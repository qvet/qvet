import { useQuery, useQueries, UseQueryResult } from "@tanstack/react-query";
import { Octokit } from "octokit";
import * as React from "react";
import { useQueryParam, NumberParam } from "use-query-params";

import useLogin from "src/hooks/useLogin";
import useOctokit from "src/hooks/useOctokit";
import useStore from "src/hooks/useStore";
import { OwnerRepo, Repository, Installation } from "src/octokitHelpers";

export default function useOwnerRepo(): UseQueryResult<OwnerRepo | null> {
  const currentRepo = useRepos().currentRepo;
  return useQuery({
    queryKey: ["ownerRepo", { currentRepo: currentRepo.data?.id }],
    queryFn: () => {
      const repo = currentRepo.data!;
      if (repo === null) {
        return null;
      }
      return { owner: repo.owner.login, repo: repo.name };
    },
    // pure data mapper
    staleTime: Infinity,
    enabled: currentRepo.isSuccess,
  });
}

export function useRepo(): UseQueryResult<Repository | null> {
  return useRepos().currentRepo;
}

export function useRepos(): {
  currentRepo: UseQueryResult<Repository | null>;
  visibleRepos: UseQueryResult<Array<Repository>>;
  setSelectedRepo: (id: number) => void;
} {
  const [repoIdUrl, setRepoIdUrl] = useQueryParam(`repoId`, NumberParam);

  // Fallback to url if we don't have state in the store - should be identical
  const selectedRepo = useStore((store) => store.repoId) ?? repoIdUrl ?? null;
  const setRepoIdStore = useStore((store) => store.setRepoId);
  const setRepoId = React.useCallback(
    (id: number) => {
      setRepoIdStore(id);
      if (id) {
        setRepoIdUrl(id);
      } else {
        // Do not set query param if no repo selected
        setRepoIdUrl(undefined);
      }
    },
    [setRepoIdStore, setRepoIdUrl],
  );
  const visibleRepos = useVisibleRepos();
  const currentRepo = useQuery({
    queryKey: [
      "currentRepo",
      { selectedRepo, visibleRepos: visibleRepos.data },
    ],
    queryFn: () => lookupRepository(selectedRepo, visibleRepos.data!),
    // pure data mapper
    staleTime: Infinity,
    enabled: visibleRepos.isSuccess,
  });

  return {
    currentRepo,
    visibleRepos,
    setSelectedRepo: setRepoId,
  };
}

function lookupRepository(
  selectedRepo: number | null,
  repos: Array<Repository>,
) {
  if (selectedRepo === null) {
    if (repos.length > 0) {
      return repos[0];
    }

    return null;
  }

  return repos.find((repo) => repo.id === selectedRepo) ?? null;
}

/**
 * Display all visible repos from all visible installations.
 */
export function useVisibleRepos(): UseQueryResult<Array<Repository>> {
  const octokit = useOctokit();
  const login = useLogin();

  const installations = useQuery({
    queryKey: ["listInstallations", { login: login.data! }],
    queryFn: () => listInstallations(octokit!),
    // Never update after page load
    staleTime: Infinity,
    enabled: !!octokit && !!login.data,
  });

  const installationRepoQueries = useQueries({
    queries: (installations.data ?? []).map((installation: Installation) => ({
      queryKey: ["listInstallationRepos", { installationId: installation.id }],
      queryFn: () => listInstallationRepos(octokit!, installation.id),
      // Never update after page load
      staleTime: Infinity,
      enabled: !!octokit,
    })),
  });
  return useQuery({
    queryKey: [
      "allInstallationRepos",
      { items: installationRepoQueries.map((query) => query.data) },
    ],
    queryFn: () => {
      return installationRepoQueries.map((query) => query.data!).flat();
    },
    // pure data mapper
    staleTime: Infinity,
    enabled:
      !!octokit &&
      // don't run until we actually know the list of installations
      // otherwise we get an array of zero which is technically done
      installations.isSuccess &&
      installationRepoQueries.every((query) => query.isSuccess),
  });
}

/**
 * Get the installations available to this authenticated token.
 *
 * By construction, this is only:
 *
 * - This app type
 * - This installation instance
 *
 * if we're logged in with a valid token. Otherwise, return null.
 *
 */
async function listInstallations(
  octokit: Octokit,
): Promise<Array<Installation>> {
  // FIXME pagination here
  const response =
    await octokit.rest.apps.listInstallationsForAuthenticatedUser();
  return response.data.installations;
}

/**
 * List the repos visible to this authenticated token.
 */
async function listInstallationRepos(
  octokit: Octokit,
  installationId: number,
): Promise<Array<Repository>> {
  // FIXME pagination here
  const response =
    await octokit.rest.apps.listInstallationReposForAuthenticatedUser({
      installation_id: installationId,
    });
  return response.data.repositories;
}
