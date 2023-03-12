import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { Octokit } from "octokit";
import useOctokit from "src/hooks/useOctokit";
import { useRepo } from "src/hooks/useOwnerRepo";
import { Repository } from "src/octokitHelpers";
import { HTTPError } from "ky";

function retry(failureCount: number, error: HTTPError): boolean {
  return error.response.status === 404
    ? false
    : failureCount < 3
    ? true
    : false;
}

export default function useConfigFile(): UseQueryResult<string, HTTPError> {
  const octokit = useOctokit();
  const repo = useRepo();

  return useQuery({
    queryKey: ["getConfigFileContents", { ownerRepo: repo.data }],
    queryFn: () => getConfigFileContents(octokit!, repo.data!),
    enabled: !!octokit && !!repo.data,
    // Don't retry on 404
    retry,
  });
}

async function getConfigFileContents(
  octokit: Octokit,
  repo: Repository
): Promise<string> {
  // Cast to this type, as it can vary based on media type
  const response = (await octokit.rest.repos.getContent({
    owner: repo.owner.login,
    repo: repo.name,
    path: "qvet.yml",
  })) as any as { data: { content: string } };

  return window.atob(response.data.content);
}
