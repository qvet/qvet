import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { Octokit } from "octokit";

import useConfig from "src/hooks/useConfig";
import useOctokit from "src/hooks/useOctokit";
import { useRepo } from "src/hooks/useOwnerRepo";
import { Repository } from "src/octokitHelpers";
import { Config } from "src/utils/config";

export default function useBaseSha(): UseQueryResult<string> {
  const octokit = useOctokit();
  const repo = useRepo();
  const config = useConfig();

  return useQuery({
    queryKey: ["getBaseSha", { ownerRepo: repo.data, config: config.data }],
    queryFn: () => getBaseSha(octokit!, repo.data!, config.data!),
    refetchInterval: GIT_REF_POLL_INTERVAL_MS,
    staleTime: GIT_REF_POLL_INTERVAL_MS,
    enabled: !!octokit && !!repo.data && !!config.data,
  });
}

async function getBaseSha(
  octokit: Octokit,
  repo: Repository,
  config: Config,
): Promise<string> {
  const branch = await octokit.rest.repos.getBranch({
    owner: repo.owner.login,
    repo: repo.name,
    branch: config.commit.base ? config.commit.base : repo.default_branch,
  });
  return branch.data.commit.sha;
}

// Five minutes
const GIT_REF_POLL_INTERVAL_MS = 5 * 60 * 1000;
