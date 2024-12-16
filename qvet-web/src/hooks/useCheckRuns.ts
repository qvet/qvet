import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { Octokit } from "octokit";

import useAccessToken from "src/hooks/useAccessToken";
import useOctokit from "src/hooks/useOctokit";
import { CheckRun, OwnerRepo } from "src/octokitHelpers";

import useBaseSha from "./useBaseSha";
import useOwnerRepo from "./useOwnerRepo";

/**
 * Return all checks runs for base SHA
 *
 * Will fail if no user is credentialed.
 */
export function useCheckRuns(): UseQueryResult<Array<CheckRun>, Error> {
  const accessToken = useAccessToken();
  const octokit = useOctokit();
  const baseSha = useBaseSha();
  const ownerRepo = useOwnerRepo();

  return useQuery({
    queryKey: ["getCheckRuns", accessToken.data],
    queryFn: () => getCheckRuns(octokit!, baseSha.data!, ownerRepo.data!),
    enabled:
      !!accessToken.data && !!baseSha.data && !!ownerRepo.data && !!octokit,
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
