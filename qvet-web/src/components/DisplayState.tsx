import DoneIcon from "@mui/icons-material/Done";
import CloseIcon from "@mui/icons-material/Close";
import CircleOutlinedIcon from "@mui/icons-material/CircleOutlined";
import UserLink from "src/components/UserLink";
import { stateDisplay } from "src/utils/status";
import { Status } from "src/octokitHelpers";

function nullableStatusDisplay(status: Status | null): {
  text: string;
  icon: React.ReactNode;
} {
  const pending = {
    text: "Pending",
    icon: <CircleOutlinedIcon fontSize="small" color="warning" />,
  };

  if (!status) {
    return pending;
  } else {
    const state = status.state;
    switch (state) {
      case "success":
        return {
          text: stateDisplay(state),
          icon: <DoneIcon fontSize="small" color="success" />,
        };
      case "error":
      case "failure":
        return {
          text: stateDisplay(state),
          icon: <CloseIcon fontSize="small" color="error" />,
        };
      case "pending":
        return pending;
      default:
        return {
          text: state,
          icon: <CircleOutlinedIcon fontSize="small" />,
        };
    }
  }
}

export default function DisplayState({ status }: { status: Status | null }) {
  const { text, icon } = nullableStatusDisplay(status);

  return (
    <div style={{ display: "flex", gap: "8px" }}>
      {icon}
      <span>
        {text}
        {status && status.creator && status.state !== "pending" ? (
          <> by {<UserLink inline user={status.creator} />}</>
        ) : null}
      </span>
    </div>
  );
}
