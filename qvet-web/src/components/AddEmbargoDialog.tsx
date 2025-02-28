import LoadingButton from "@mui/lab/LoadingButton";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useCallback, useRef, useState } from "react";

import useSetCommitState from "src/hooks/useSetCommitState";
import { STATUS_CONTEXT_EMBARGO_PREFIX } from "src/queries";
import {
  randomHexId,
  validateCommitStatusDescription,
} from "src/utils/helpers";

export interface AddEmbargoDialogProps {
  sha: string;
  open: boolean;
  onClose: () => void;
}

export default function AddEmbargoDialog(
  props: AddEmbargoDialogProps,
): React.ReactElement {
  const { onClose, open, sha } = props;
  const [message, setMessage] = useState<string>("");

  const id = randomHexId();
  const addEmbargo = useSetCommitState(
    sha,
    "failure",
    `${STATUS_CONTEXT_EMBARGO_PREFIX}${id}`,
  );

  const inputGroupRef = useRef<HTMLElement>(null);

  const handleEntering = () => {
    if (inputGroupRef.current != null) {
      inputGroupRef.current.focus();
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const handleOk = () => {
    addEmbargo.mutate({ description: message });
    onClose();
    setMessage("");
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleOk();
  };

  const changeMessage = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      if (validateCommitStatusDescription(value)) {
        setMessage(event.target.value);
      }
    },
    [],
  );

  return (
    <Dialog TransitionProps={{ onEntering: handleEntering }} open={open}>
      <DialogTitle>Embargo Deployment</DialogTitle>
      <DialogContent dividers>
        <form onSubmit={handleFormSubmit}>
          <Stack spacing={1}>
            <Typography variant="body2">
              These commits should not be released because:
            </Typography>
            <TextField
              id="message"
              label="Reason"
              variant="outlined"
              value={message}
              onChange={changeMessage}
              style={{ minWidth: 450 }}
            />
          </Stack>
        </form>
      </DialogContent>
      <DialogActions>
        <Button autoFocus onClick={handleCancel}>
          Cancel
        </Button>
        <LoadingButton
          type="submit"
          variant="contained"
          loading={addEmbargo.isLoading}
          onClick={handleOk}>
          Embargo
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
