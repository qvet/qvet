import { useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import LoadingButton from "@mui/lab/LoadingButton";
import ButtonGroup from "@mui/material/ButtonGroup";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Skeleton from "@mui/material/Skeleton";
import DoneIcon from "@mui/icons-material/Done";
import CloseIcon from "@mui/icons-material/Close";
import CancelIcon from "@mui/icons-material/Cancel";
import CircleOutlinedIcon from "@mui/icons-material/CircleOutlined";
import { Commit, OwnerRepoContext } from "src/octokitHelpers";
import UserLink from "src/components/UserLink";
import ShaLink from "src/components/ShaLink";
import { getCommitStatus } from "src/queries";
import useSetCommitState from "src/hooks/useSetCommitState";
import useOctokit from "src/hooks/useOctokit";
import { grey } from "@mui/material/colors";

export default function CommitTable({ commits }: { commits: Array<Commit> }) {
  return (
    <Table sx={{ minWidth: 650 }} size="small">
      <TableHead>
        <TableRow>
          <TableCell>Message</TableCell>
          <TableCell>Author</TableCell>
          <TableCell>Hash</TableCell>
          <TableCell>Status</TableCell>
          <TableCell>Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {commits.map((commit) => (
          <CommitRow key={commit.sha} commit={commit} />
        ))}
      </TableBody>
    </Table>
  );
}

function DisplayState({ state }: { state: string }) {
  // Defaults for unknown states
  let icon = <CircleOutlinedIcon fontSize="small" />;
  let text = state;

  switch (state) {
    case "success":
      icon = <DoneIcon fontSize="small" color="success" />;
      text = "Approved";
      break;
    case "error":
    case "failure":
      icon = <CloseIcon fontSize="small" color="error" />;
      text = "Rejected";
      break;
    case "pending":
      icon = <CircleOutlinedIcon fontSize="small" color="warning" />;
      text = "Pending";
      break;
  }

  return (
    <div style={{ display: "flex", gap: "8px" }}>
      {icon}
      {text}
    </div>
  );
}

function DisplayStateSkeleton({ ...rest }) {
  return (
    <Skeleton
      animation="wave"
      variant="text"
      width={84}
      height={20}
      {...rest}
    />
  );
}

function CommitRow({ commit }: { commit: Commit }) {
  const octokit = useOctokit();
  const ownerRepo = useContext(OwnerRepoContext);

  const sha = commit.sha;
  const status = useQuery({
    queryKey: ["getCommitStatus", { ownerRepo, sha }],
    queryFn: () => getCommitStatus(octokit, ownerRepo, sha),
    refetchInterval: 60_000,
  });

  const [approve, setApprove] = useSetCommitState(status, sha, "success");
  const [deny, setDeny] = useSetCommitState(status, sha, "failure");
  const [clear, setClear] = useSetCommitState(status, sha, "pending");

  return (
    <TableRow sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
      <TableCell
        component="th"
        scope="row"
        style={{
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          overflow: "hidden",
          maxWidth: "500px",
        }}
      >
        {commit.commit.message}
      </TableCell>
      <TableCell>
        {commit.author ? <UserLink user={commit.author} /> : <i>unknown</i>}
      </TableCell>
      <TableCell>
        <ShaLink commit={commit} />
      </TableCell>
      <TableCell style={{ minWidth: "150px" }}>
        {status.isError ? (
          <DisplayStateSkeleton animation={false} />
        ) : status.isLoading ? (
          <DisplayStateSkeleton />
        ) : (
          <DisplayState state={status.data?.state || "pending"} />
        )}
      </TableCell>
      <TableCell>
        <ButtonGroup>
          <LoadingButton onClick={setApprove} loading={approve.isLoading}>
            <DoneIcon />
          </LoadingButton>
          <LoadingButton onClick={setDeny} loading={deny.isLoading}>
            <CloseIcon />
          </LoadingButton>
          <LoadingButton
            style={{ color: grey[400] }}
            onClick={setClear}
            loading={clear.isLoading}
          >
            <CancelIcon />
          </LoadingButton>
        </ButtonGroup>
      </TableCell>
    </TableRow>
  );
}
