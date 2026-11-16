import { UseQueryResult } from "@tanstack/react-query";

import type { useRepos as realUseRepos } from "src/hooks/useOwnerRepo";
import { OwnerRepo, Repository } from "src/octokitHelpers";

import { OWNER, REPO } from "./fakeGithub";

export const repository = {
  id: 1,
  name: REPO,
  full_name: `${OWNER}/${REPO}`,
  description: "Fake repository served by the harness",
  default_branch: "main",
  owner: { login: OWNER },
} as Repository;

// Only the fields the components read are filled in.
const ok = <T>(data: T) =>
  ({
    data,
    isSuccess: true,
    isLoading: false,
    isError: false,
  }) as UseQueryResult<T>;

export default function useOwnerRepo(): UseQueryResult<OwnerRepo | null> {
  return ok({ owner: OWNER, repo: REPO });
}
export function useRepo(): UseQueryResult<Repository | null> {
  return ok(repository);
}
export function useRepos(): ReturnType<typeof realUseRepos> {
  return {
    currentRepo: ok(repository),
    setRepoId: () => undefined,
  } as unknown as ReturnType<typeof realUseRepos>;
}
export function useVisibleRepos(): UseQueryResult<Array<Repository>> {
  return ok([repository]);
}
