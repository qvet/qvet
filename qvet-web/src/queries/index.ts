const STATUS_CONTEXT = "qvet/qa";

import { Octokit } from "octokit";
import { ResponseHeaders } from "@octokit/types";
import { OwnerRepo, Status } from "src/octokitHelpers";

// Github requests commit statuses be cached for 60s in browser
// A current value can be found in the `cache-control` header of the github response
export const COMMIT_STATUS_HTTP_CACHE_MAX_AGE_S = 60;

function parseCacheControlMaxAge(headers: ResponseHeaders): number | null {
  const cacheControl = headers["cache-control"];
  if (!cacheControl) {
    return null;
  }

  const matches = cacheControl.match(/max-age=(\d+)/);
  const maxAge = matches ? parseInt(matches[1], 10) : null;
  return maxAge;
}

export async function getCommitStatus(
  octokit: Octokit,
  ownerRepo: OwnerRepo,
  sha: string
): Promise<Status | null> {
  const { data, headers } = await octokit.rest.repos.listCommitStatusesForRef({
    ...ownerRepo,
    ref: sha,
  });

  // Sanity check that our hardcoded cache expectation is up to date
  const maxAge = parseCacheControlMaxAge(headers);
  if (maxAge !== COMMIT_STATUS_HTTP_CACHE_MAX_AGE_S) {
    console.warn(
      `Outdated expectation for Github statuses cache-control: expected ${COMMIT_STATUS_HTTP_CACHE_MAX_AGE_S}, actual ${maxAge}`
    );
  }

  for (const status of data) {
    if (status.context === STATUS_CONTEXT) {
      return status;
    }
  }
  return null;
}

export type WriteableState = "success" | "failure" | "pending";

function stateDescriptionStem(state: WriteableState): string {
  switch (state) {
    case "success":
      return "Approved";
    case "failure":
      return "Rejected";
    case "pending":
      return "Cleared";
  }
}

export async function setCommitStatus(
  octokit: Octokit,
  ownerRepo: OwnerRepo,
  sha: string,
  login: string,
  state: WriteableState
): Promise<Status> {
  const { data } = await octokit.rest.repos.createCommitStatus({
    ...ownerRepo,
    sha,
    context: STATUS_CONTEXT,
    state,
    target_url: window.location.origin,
    description: `Manual QA: ${stateDescriptionStem(state)} by ${login}`,
  });
  return data;
}
