import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { getCommitStatus } from "src/queries";
import useOwnerRepo from "src/hooks/useOwnerRepo";
import useOctokit from "src/hooks/useOctokit";
import { Octokit } from "octokit";
import { OwnerRepo } from "src/octokitHelpers";
import { COMMIT_STATUS_HTTP_CACHE_MAX_AGE_S } from "src/queries";

// Five minutes
const COMMIT_STATUS_POLL_INTERVAL_MS = 5 * 60 * 1000;
// So let our data only refetch after a bit more time than that
const COMMIT_STATUS_STALE_TIME_MS =
  (COMMIT_STATUS_HTTP_CACHE_MAX_AGE_S + 10) * 1000;

export function commitStatusQuery(
  octokit: Octokit | null,
  ownerRepo: UseQueryResult<OwnerRepo | null>,
  sha: string
) {
  return {
    queryKey: ["getCommitStatus", { ownerRepo: ownerRepo.data, sha }],
    queryFn: () => getCommitStatus(octokit!, ownerRepo.data!, sha),
    refetchInterval: COMMIT_STATUS_POLL_INTERVAL_MS,
    staleTime: COMMIT_STATUS_STALE_TIME_MS,
    enabled: !!octokit && !!ownerRepo.data,
  };
}

export default function useCommitStatus(sha: string) {
  const octokit = useOctokit();
  const ownerRepo = useOwnerRepo();
  return useQuery(commitStatusQuery(octokit, ownerRepo, sha));
}
