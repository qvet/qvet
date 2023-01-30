import { Octokit } from "octokit";
import { useMemo } from "react";
import useAccessToken from "src/hooks/useAccessToken";

/**
 * Return the current octokit for the logged in user.
 *
 * Will fail if no user is credentialed.
 */
export default function useOctokit() {
  const accessToken = useAccessToken();
  if (accessToken === null) {
    throw new Error("tried to use octokit without credentials");
  }

  return useMemo(
    () =>
      new Octokit({
        auth: accessToken,
      }),
    [accessToken]
  );
}
