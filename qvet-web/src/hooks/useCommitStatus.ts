import { useQuery } from "@tanstack/react-query";
import { getCommitStatus } from "src/queries";
import useOwnerRepo from "src/hooks/useOwnerRepo";
import useOctokit from "src/hooks/useOctokit";
import { COMMIT_STATUS_HTTP_CACHE_MAX_AGE_S } from "src/queries";

// Two minutes
const COMMIT_STATUS_POLL_INTERVAL_MS = 2 * 60 * 1000;
// So let our data only refetch after a bit more time than that
const COMMIT_STATUS_STALE_TIME_MS =
  (COMMIT_STATUS_HTTP_CACHE_MAX_AGE_S + 10) * 1000;

export function useCommitStatusQuery(sha: string) {
  const octokit = useOctokit();
  const ownerRepo = useOwnerRepo();
  return {
    queryKey: ["getCommitStatus", { ownerRepo: ownerRepo.data, sha }],
    queryFn: () => getCommitStatus(octokit!, ownerRepo.data!, sha),
    refetchInterval: COMMIT_STATUS_POLL_INTERVAL_MS,
    staleTime: COMMIT_STATUS_STALE_TIME_MS,
    enabled: !!octokit && !!ownerRepo.data,
  };
}

export default function useCommitStatus(sha: string) {
  return useQuery(useCommitStatusQuery(sha));
}
