import { Octokit } from "octokit";
import { useMemo } from "react";

import useAccessToken from "src/hooks/useAccessToken";

/**
 * Return the current octokit for the logged in user.
 *
 * Will fail if no user is credentialed.
 */
export default function useOctokit(): Octokit | null {
  const { data: accessToken } = useAccessToken();

  return useMemo(
    () =>
      accessToken
        ? new Octokit({
            auth: accessToken,
          })
        : null,
    [accessToken],
  );
}
