import { useCallback, useRef, useState } from "react";
import Button from "@mui/material/Button";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Dialog from "@mui/material/Dialog";
import useSetCommitState from "src/hooks/useSetCommitState";
import { STATUS_CONTEXT_EMBARGO_PREFIX } from "src/queries";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import LoadingButton from "@mui/lab/LoadingButton";

function randomHexId(): string {
  return Math.floor(Math.random() * 0xff_ff_ff_ff).toString(16);
}

export interface AddEmbargoDialogProps {
  sha: string;
  open: boolean;
  onClose: () => void;
}

export default function AddEmbargoDialog(props: AddEmbargoDialogProps) {
  const { onClose, open, sha } = props;
  const [message, setMessage] = useState<string>("");

  const id = randomHexId();
  const [remove, setRemove] = useSetCommitState(
    sha,
    "failure",
    `${STATUS_CONTEXT_EMBARGO_PREFIX}${id}`,
    message
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
    setRemove();
    onClose();
    setMessage("");
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleOk();
  };

  const changeMessage = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setMessage(event.target.value);
    },
    []
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
          loading={remove.isLoading}
          onClick={handleOk}
        >
          Embargo
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
