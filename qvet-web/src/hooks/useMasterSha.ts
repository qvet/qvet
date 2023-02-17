import { useQuery } from "@tanstack/react-query";
import { Octokit } from "octokit";
import useOctokit from "src/hooks/useOctokit";
import useOwnerRepo from "src/hooks/useOwnerRepo";
import { OwnerRepo } from "src/octokitHelpers";

export default function useMasterSha() {
  const octokit = useOctokit();
  const ownerRepo = useOwnerRepo();

  return useQuery({
    queryKey: ["getMasterSha", { ownerRepo }],
    queryFn: () => getMasterSha(octokit!, ownerRepo),
    refetchInterval: GIT_REF_POLL_INTERVAL_MS,
    enabled: !!octokit,
  });
}

async function getMasterSha(
  octokit: Octokit,
  ownerRepo: OwnerRepo
): Promise<string> {
  const branch = await octokit.rest.repos.getBranch({
    ...ownerRepo,
    branch: "master",
  });
  return branch.data.commit.sha;
}

// Five minutes
const GIT_REF_POLL_INTERVAL_MS = 5 * 60 * 1000;
