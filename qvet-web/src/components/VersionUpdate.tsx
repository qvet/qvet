import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Collapse from "@mui/material/Collapse";
import ky from "ky";
import { useCallback } from "react";

import useVersions from "src/hooks/useVersions";

export default function VersionUpdate(): React.ReactElement {
  const [localVersion, serverVersion] = useVersions();

  const doUpdate = useCallback(async () => {
    // Bust cache on the app entrypoint we know about
    await ky.get("index.html", {
      headers: {
        "Cache-Control": "no-cache",
      },
    });
    // Bust version cache to mark us as updated
    await ky.get("version", {
      headers: {
        "Cache-Control": "no-cache",
      },
    });

    // Reload everything (will now use latest cached app entrypoint)
    window.location.reload();
  }, []);

  const noUpdateAvailable =
    localVersion.isLoading ||
    localVersion.isError ||
    serverVersion.isLoading ||
    serverVersion.isError ||
    serverVersion.data === localVersion.data;
  return (
    <Collapse in={!noUpdateAvailable}>
      <Alert
        severity="info"
        action={
          <Button color="inherit" size="small" onClick={doUpdate}>
            Update
          </Button>
        }>
        New version avaiable
      </Alert>
    </Collapse>
  );
}
