import { components } from "@octokit/openapi-types";

export interface OwnerRepo {
  owner: string;
  repo: string;
}

export interface Team {
  org: string;
  team_slug: string;
}

export type Commit = components["schemas"]["commit"];
export type CommitComparison = components["schemas"]["commit-comparison"];
export type Status = components["schemas"]["status"];
export type CheckRun = components["schemas"]["check-run"];
export type User = components["schemas"]["simple-user"];
export type Repository = components["schemas"]["repository"];
export type Installation = components["schemas"]["installation"];
export type Ref = components["schemas"]["git-ref"];
