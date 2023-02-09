import { useCallback } from "react";
import Alert from "@mui/material/Alert";
import Collapse from "@mui/material/Collapse";
import Button from "@mui/material/Button";
import useVersions from "src/hooks/useVersions";
import ky from "ky";

export default function VersionUpdate() {
  let [localVersion, serverVersion] = useVersions();

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
        }
      >
        New version avaiable
      </Alert>
    </Collapse>
  );
}
