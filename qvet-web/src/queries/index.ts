import { ResponseHeaders } from "@octokit/types";
import { Octokit } from "octokit";

import { OwnerRepo, Status, User, Team } from "src/octokitHelpers";
import { UpdateState, stateDisplay } from "src/utils/status";

export const STATUS_CONTEXT_EMBARGO_PREFIX = "qvet/embargo/";
export const STATUS_CONTEXT_QA = "qvet/qa";

// Github requests commit statuses be cached for 60s in browser
// A current value can be found in the `cache-control` header of the github response
export const COMMIT_STATUS_HTTP_CACHE_MAX_AGE_S = 60;

function parseCacheControlMaxAge(headers: ResponseHeaders): number | null {
  const cacheControl = headers["cache-control"];
  if (!cacheControl) {
    return null;
  }

  const matches = cacheControl.match(/max-age=(\d+)/);
  return matches ? parseInt(matches[1], 10) : null;
}

export async function getCommitStatusList(
  octokit: Octokit,
  ownerRepo: OwnerRepo,
  sha: string,
): Promise<Array<Status>> {
  const { data, headers } = await octokit.rest.repos.listCommitStatusesForRef({
    ...ownerRepo,
    ref: sha,
  });

  // Sanity check that our hardcoded cache expectation is up to date
  const maxAge = parseCacheControlMaxAge(headers);
  if (maxAge !== COMMIT_STATUS_HTTP_CACHE_MAX_AGE_S) {
    console.warn(
      `Outdated expectation for Github statuses cache-control: expected ${COMMIT_STATUS_HTTP_CACHE_MAX_AGE_S}, actual ${maxAge}`,
    );
  }

  return data;
}

export async function getCommitStatus(
  octokit: Octokit,
  ownerRepo: OwnerRepo,
  sha: string,
  context: string,
): Promise<Status | null> {
  const statusList = await getCommitStatusList(octokit, ownerRepo, sha);
  for (const status of statusList) {
    if (status.context === context) {
      // First status is the most recent one
      return status;
    }
  }
  return null;
}

function updateDescription(update: UpdateState): string {
  return `${stateDisplay(update.state)} by ${update.user.login}`;
}

export async function setCommitStatus(
  octokit: Octokit,
  ownerRepo: OwnerRepo,
  sha: string,
  context: string,
  update: UpdateState,
): Promise<Status> {
  const description = update.description ?? updateDescription(update);
  const { data } = await octokit.rest.repos.createCommitStatus({
    ...ownerRepo,
    sha,
    context,
    state: update.state,
    target_url: window.location.origin,
    description,
  });
  return data;
}

export async function getTeamMembers(
  octokit: Octokit,
  team: Team,
): Promise<Array<User>> {
  const { data } = await octokit.rest.teams.listMembersInOrg({ ...team });
  return data;
}
