import { useQuery } from "@tanstack/react-query";
import { Octokit } from "octokit";
import useOctokit from "src/hooks/useOctokit";
import useOwnerRepo from "src/hooks/useOwnerRepo";
import { OwnerRepo } from "src/octokitHelpers";

export default function useMasterSha() {
  const octokit = useOctokit();
  const ownerRepo = useOwnerRepo();

  return useQuery({
    queryKey: ["getMasterSha", { ownerRepo: ownerRepo.data }],
    queryFn: () => getMasterSha(octokit!, ownerRepo.data!),
    refetchInterval: GIT_REF_POLL_INTERVAL_MS,
    enabled: !!octokit && !!ownerRepo.data,
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
