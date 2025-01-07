import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { Octokit } from "octokit";

import useAccessToken from "src/hooks/useAccessToken";
import useOctokit from "src/hooks/useOctokit";
import { CheckRun, OwnerRepo } from "src/octokitHelpers";
import { STATUS_CONTEXT_CHECK_RUN_EMBARGO_PREFIX } from "src/queries";
import { CheckRunGlobalConfig, CheckRunLevel } from "src/utils/config";

import useBaseSha from "./useBaseSha";
import { useCommitStatusList } from "./useCommitStatus";
import useOwnerRepo from "./useOwnerRepo";

export const checkRunOverruleContext = (check: CheckRun): string =>
  `${STATUS_CONTEXT_CHECK_RUN_EMBARGO_PREFIX}/${check.name}`;

/**
 * Return all checks runs for base SHA
 *
 * Will fail if no user is credentialed.
 */
export function useCheckRuns(
  enabled: boolean,
): UseQueryResult<Array<CheckRun>, Error> {
  const accessToken = useAccessToken();
  const octokit = useOctokit();
  const baseSha = useBaseSha();
  const ownerRepo = useOwnerRepo();

  return useQuery({
    queryKey: ["getCheckRuns", accessToken.data],
    queryFn: () => getCheckRuns(octokit!, baseSha.data!, ownerRepo.data!),
    enabled:
      enabled &&
      !!accessToken.data &&
      !!baseSha.data &&
      !!ownerRepo.data &&
      !!octokit,
  });
}

async function getCheckRuns(
  octokit: Octokit,
  baseSha: string,
  ownerRepo: OwnerRepo,
): Promise<Array<CheckRun>> {
  const response = await octokit.rest.checks.listForRef({
    ...ownerRepo,
    ref: baseSha,
  });
  return response.data.check_runs;
}

export const getCheckRunLevel = (
  checkRun: CheckRun,
  config: CheckRunGlobalConfig,
): CheckRunLevel => {
  const configCheckRun = config.items.find(
    (configCheckRun) => configCheckRun.name === checkRun.name,
  );
  return configCheckRun ? configCheckRun.level : config.default_level;
};

export const getCheckRunConfigUrl = (
  checkRun: CheckRun,
  config: CheckRunGlobalConfig,
): string | null => {
  const configCheckRun = config.items.find(
    (configCheckRun) => configCheckRun.name === checkRun.name,
  );
  return configCheckRun?.url || null;
};

// filter for check runs that have not returned success on their latest run
export const filterVisibleCheckRuns = (
  checkRuns: ReadonlyArray<CheckRun>,
  config: CheckRunGlobalConfig,
): ReadonlyArray<CheckRun> => {
  return checkRuns.filter(
    (checkRun) => getCheckRunLevel(checkRun, config) !== "hidden",
  );
};

// filter for check runs that have not returned success on their latest run
export const filterUnresolvedCheckRuns = (
  checkRuns: ReadonlyArray<CheckRun>,
): ReadonlyArray<CheckRun> => {
  const latestAttempts = filterLatestAttempts(checkRuns);
  return latestAttempts.filter((checkRun) => checkRun.conclusion !== "success");
};

// function dedupes check runs with the same name returning the only the latest
const filterLatestAttempts = (
  checkRuns: ReadonlyArray<CheckRun>,
): ReadonlyArray<CheckRun> => {
  const byName: Record<string, Array<CheckRun>> = {};
  for (const checkRun of checkRuns) {
    if (byName[checkRun.name] === undefined) {
      byName[checkRun.name] = [];
    }
    byName[checkRun.name].push(checkRun);
  }
  return Object.values(byName).flatMap((checkRuns) => {
    let completed: Array<CheckRun> = checkRuns.filter(
      (checkRun) => checkRun.status === "completed",
    );
    let incomplete: Array<CheckRun> = checkRuns.filter(
      (checkRun) => checkRun.status !== "completed",
    );

    if (incomplete.length > 0) {
      incomplete = incomplete.sort(
        (a, b) =>
          new Date(b.started_at || 0).getTime() -
          new Date(a.started_at || 0).getTime(),
      );
      return incomplete.slice(0, 1);
    } else {
      completed = completed.sort(
        (a, b) =>
          new Date(b.completed_at || 0).getTime() -
          new Date(a.completed_at || 0).getTime(),
      );
      return completed.slice(0, 1);
    }
  });
};

export const useCheckRunsEmbargo = (config?: CheckRunGlobalConfig): boolean => {
  const checkRuns = useCheckRuns(config?.enabled || false);
  const baseSha = useBaseSha();
  const commitStatusList = useCommitStatusList(
    config ? baseSha.data : undefined,
  );

  if (!config || !config.enabled) {
    // do not embargo if no config or config has check runs disabled
    return false;
  }
  if (commitStatusList.isLoading || checkRuns.isLoading) {
    // hold embargo while queries are loading
    return true;
  }

  if (!commitStatusList.data || !checkRuns.data) {
    // do not embargo if endpoint has failed to return
    return false;
  }

  const embargoCheckRunContexts = new Set(
    filterUnresolvedCheckRuns(checkRuns.data)
      .filter((checkRun) => getCheckRunLevel(checkRun, config) === "embargo")
      .map(checkRunOverruleContext),
  );
  for (const context of embargoCheckRunContexts) {
    const commitStatus = commitStatusList.data.find(
      // first commit status is the latest
      (commitStatus) => commitStatus.context === context,
    );
    if (!commitStatus || commitStatus.state !== "success") {
      // if not found or state is not success the embargo persists
      return true;
    }
  }
  return false;
};
