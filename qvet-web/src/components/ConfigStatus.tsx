import Alert, { AlertColor } from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import { useState, useCallback } from "react";

import ConfigFile from "src/components/ConfigFile";
import { useConfigMeta } from "src/hooks/useConfig";

interface Parts {
  text: string;
  severity: AlertColor;
}

export default function ConfigStatus({
  showInfo,
}: {
  showInfo?: boolean;
}): React.ReactElement | null {
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const configMeta = useConfigMeta();
  const parts: Parts = configMeta.isError
    ? { text: "Error loading config", severity: "error" }
    : configMeta.data?.repositoryFileMissing
    ? { text: "Config file not found", severity: "warning" }
    : configMeta.data?.parseResult.errorsText
    ? { text: "Invalid config file", severity: "error" }
    : configMeta.isLoading
    ? { text: "Loading config file...", severity: "info" }
    : {
        text: "Using custom settings from config file",
        severity: "info",
      };

  const onAction = useCallback(() => {
    setDialogOpen(true);
  }, [setDialogOpen]);

  const onDialogClose = useCallback(() => {
    setDialogOpen(false);
  }, [setDialogOpen]);

  const show =
    parts !== null &&
    (parts.severity === "error" || parts.severity === "warning") === !showInfo;
  return show ? (
    <>
      <Alert
        severity={parts.severity}
        action={
          <Button color="inherit" size="small" onClick={onAction}>
            See Details
          </Button>
        }>
        {parts.text}
      </Alert>
      <SimpleDialog open={dialogOpen} onClose={onDialogClose} />
    </>
  ) : null;
}

export interface SimpleDialogProps {
  open: boolean;
  onClose: () => void;
}

function SimpleDialog(props: SimpleDialogProps) {
  const { onClose, open } = props;

  return (
    <Dialog onClose={onClose} open={open}>
      <DialogTitle>Configuration Details</DialogTitle>
      <Box padding={1}>
        <ConfigFile />
      </Box>
    </Dialog>
  );
}
