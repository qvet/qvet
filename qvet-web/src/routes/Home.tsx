import { useEffect } from "react";
import Installations from "src/components/Installations";
import LoginButton from "src/components/LoginButton";
import VersionUpdate from "src/components/VersionUpdate";
import useLoginRedirect from "src/hooks/useLoginRedirect";
import useAccessToken from "src/hooks/useAccessToken";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import { LOCAL_STORAGE_KEYS } from "src/constants";

export function Home() {
  const accessToken = useAccessToken();
  const loginRedirect = useLoginRedirect();
  const oauthFlowInFlight = !!localStorage.getItem(
    LOCAL_STORAGE_KEYS.oauthFlowInternalState,
  );

  useEffect(() => {
    if (accessToken.isError && !oauthFlowInFlight) {
      loginRedirect();
    }
  }, [accessToken]);

  return (
    <Box style={{ width: "100%", padding: "8px" }}>
      <Stack spacing={2} alignItems="center">
        <VersionUpdate />
        {
          // Only show login button if there's an oauth flow in flight,
          // i.e. it failed to complete successfully.
          //
          // We do this to avoid an infinite loop on error.
          accessToken.isError && oauthFlowInFlight ? (
            <Box>
              <LoginButton />
            </Box>
          ) : (
            <Installations />
          )
        }
      </Stack>
    </Box>
  );
}
