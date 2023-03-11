import { useQuery } from "@tanstack/react-query";
import { Octokit } from "octokit";
import useOctokit from "src/hooks/useOctokit";
import { useRepo } from "src/hooks/useOwnerRepo";
import { Repository } from "src/octokitHelpers";

export default function useMasterSha() {
  const octokit = useOctokit();
  const repo = useRepo();

  return useQuery({
    queryKey: ["getMasterSha", { ownerRepo: repo.data }],
    queryFn: () => getMasterSha(octokit!, repo.data!),
    refetchInterval: GIT_REF_POLL_INTERVAL_MS,
    enabled: !!octokit && !!repo.data,
  });
}

async function getMasterSha(
  octokit: Octokit,
  repo: Repository
): Promise<string> {
  const branch = await octokit.rest.repos.getBranch({
    owner: repo.owner.login,
    repo: repo.name,
    branch: "master",
  });
  return branch.data.commit.sha;
}

// Five minutes
const GIT_REF_POLL_INTERVAL_MS = 5 * 60 * 1000;
