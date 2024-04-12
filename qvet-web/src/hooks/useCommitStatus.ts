import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { Octokit } from "octokit";

import useOctokit from "src/hooks/useOctokit";
import useOwnerRepo from "src/hooks/useOwnerRepo";
import { OwnerRepo, Status } from "src/octokitHelpers";
import { getCommitStatus, getCommitStatusList } from "src/queries";
import {
  COMMIT_STATUS_HTTP_CACHE_MAX_AGE_S,
  STATUS_CONTEXT_EMBARGO_PREFIX,
  STATUS_CONTEXT_DEPLOYMENT_NOTE_PREFIX,
} from "src/queries";

// Five minutes
const COMMIT_STATUS_POLL_INTERVAL_MS = 5 * 60 * 1000;
// So let our data only refetch after a bit more time than that
const COMMIT_STATUS_STALE_TIME_MS =
  (COMMIT_STATUS_HTTP_CACHE_MAX_AGE_S + 10) * 1000;

export function commitStatusQuery(
  octokit: Octokit | null,
  ownerRepo: UseQueryResult<OwnerRepo | null>,
  sha: string,
  context: string,
): object {
  return {
    queryKey: ["getCommitStatus", { ownerRepo: ownerRepo.data, sha, context }],
    queryFn: () => getCommitStatus(octokit!, ownerRepo.data!, sha, context),
    refetchInterval: COMMIT_STATUS_POLL_INTERVAL_MS,
    staleTime: COMMIT_STATUS_STALE_TIME_MS,
    enabled: !!octokit && !!ownerRepo.data,
  };
}

export interface Embargo {
  sha: string;
  id: string;
  status: Status;
}

export function embargoListFromStatusList(
  sha: string,
  commitStatusList: Array<Status>,
): Array<Embargo> {
  const ids = new Set();
  const embargoes: Array<Embargo> = [];
  commitStatusList.forEach((commitStatus) => {
    const isEmbargo = commitStatus.context.startsWith(
      STATUS_CONTEXT_EMBARGO_PREFIX,
    );
    const id = commitStatus.context.slice(STATUS_CONTEXT_EMBARGO_PREFIX.length);
    const mostRecent = !ids.has(id);
    if (isEmbargo && mostRecent) {
      ids.add(id);
      if (commitStatus.state === "failure") {
        embargoes.push({
          sha,
          id,
          status: commitStatus,
        });
      }
    }
  });
  return embargoes;
}

export function deploymentNoteListFromStatusList(
  sha: string,
  commitStatusList: Array<Status>,
): Array<Embargo> {
  const ids = new Set();
  const notes: Array<Embargo> = [];
  commitStatusList.forEach((commitStatus) => {
    const isNote = commitStatus.context.startsWith(
      STATUS_CONTEXT_DEPLOYMENT_NOTE_PREFIX,
    );
    const id = commitStatus.context.slice(
      STATUS_CONTEXT_DEPLOYMENT_NOTE_PREFIX.length,
    );
    const mostRecent = !ids.has(id);
    if (isNote && mostRecent) {
      ids.add(id);
      if (commitStatus.state === "failure") {
        notes.push({
          sha,
          id,
          status: commitStatus,
        });
      }
    }
  });
  return notes;
}

export function useCommitStatusList(
  sha: string,
): UseQueryResult<Array<Status>> {
  const octokit = useOctokit();
  const ownerRepo = useOwnerRepo();
  return useQuery({
    queryKey: ["getCommitStatusList", { ownerRepo: ownerRepo.data, sha }],
    queryFn: async (): Promise<Array<Status>> => {
      return getCommitStatusList(octokit!, ownerRepo.data!, sha);
    },
    refetchInterval: COMMIT_STATUS_POLL_INTERVAL_MS,
    staleTime: COMMIT_STATUS_STALE_TIME_MS,
    enabled: !!octokit && !!ownerRepo.data,
  });
}

export default function useCommitStatus(
  sha: string,
  context: string,
): UseQueryResult<Status | null> {
  const octokit = useOctokit();
  const ownerRepo = useOwnerRepo();
  return useQuery(commitStatusQuery(octokit, ownerRepo, sha, context));
}
