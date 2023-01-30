import { createContext } from "react";
import { components } from "@octokit/openapi-types";

export interface OwnerRepo {
  owner: string;
  repo: string;
}

// Default value should never be used.
export const OwnerRepoContext = createContext<OwnerRepo>({
  owner: "octokit",
  repo: "app.js",
});

export type Commit = components["schemas"]["commit"];
export type CommitComparison = components["schemas"]["commit-comparison"];
export type Status = components["schemas"]["status"];
export type User = components["schemas"]["simple-user"];
