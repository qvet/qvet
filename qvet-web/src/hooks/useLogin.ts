import { Octokit } from "octokit";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import useOctokit from "src/hooks/useOctokit";
import useAccessToken from "src/hooks/useAccessToken";
import { User } from "src/octokitHelpers";

/**
 * Return the current logged in user.
 *
 * Will fail if no user is credentialed.
 */
export default function useLogin(): UseQueryResult<User, Error> {
  const accessToken = useAccessToken();
  const octokit = useOctokit();

  return useQuery({
    queryKey: ["getLogin", accessToken.data],
    queryFn: () => getLogin(octokit!),
    enabled: !!accessToken.data && !!octokit,
  });
}

async function getLogin(octokit: Octokit): Promise<User> {
  const { data } = await octokit.rest.users.getAuthenticated();
  return data;
}
