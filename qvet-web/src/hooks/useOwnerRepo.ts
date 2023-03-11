import { useQuery, useQueries, UseQueryResult } from "@tanstack/react-query";
import { Octokit } from "octokit";
import useOctokit from "src/hooks/useOctokit";
import useLogin from "src/hooks/useLogin";
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
  const selectedRepo = useStore((store) => store.repoId);
  const setSelectedRepo = useStore((store) => store.setRepoId);
  const visibleRepos = useVisibleRepos();
  const currentRepo = useQuery({
    queryKey: [
      "currentRepo",
      { selectedRepo, visibleRepos: visibleRepos.data },
    ],
    queryFn: () => lookupRepository(selectedRepo, visibleRepos.data!),
    enabled: visibleRepos.isSuccess,
  });

  return {
    currentRepo,
    visibleRepos,
    setSelectedRepo,
  };
}

function lookupRepository(
  selectedRepo: number | null,
  repos: Array<Repository>
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
    enabled: !!octokit && !!login.data,
  });

  const installationRepoQueries = useQueries({
    queries: (installations.data ?? []).map((installation: Installation) => ({
      queryKey: ["listInstallationRepos", { installationId: installation.id }],
      queryFn: () => listInstallationRepos(octokit!, installation.id),
      enabled: !!octokit,
    })),
  });
  const allInstallationRepos = useQuery({
    queryKey: [
      "allInstallationRepos",
      { items: installationRepoQueries.map((query) => query.data) },
    ],
    queryFn: () => installationRepoQueries.map((query) => query.data!).flat(),
    enabled:
      !!octokit &&
      // don't run until we actually know the list of installations
      // otherwise we get an array of zero which is technically done
      installations.isSuccess &&
      installationRepoQueries.every((query) => query.isSuccess),
  });

  return allInstallationRepos;
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
  octokit: Octokit
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
  installationId: number
): Promise<Array<Repository>> {
  // FIXME pagination here
  const response =
    await octokit.rest.apps.listInstallationReposForAuthenticatedUser({
      installation_id: installationId,
    });
  return response.data.repositories;
}
