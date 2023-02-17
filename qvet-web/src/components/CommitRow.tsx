import { useQuery } from "@tanstack/react-query";
import LoadingButton from "@mui/lab/LoadingButton";
import ButtonGroup from "@mui/material/ButtonGroup";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import Skeleton from "@mui/material/Skeleton";
import DoneIcon from "@mui/icons-material/Done";
import CloseIcon from "@mui/icons-material/Close";
import ReplayIcon from "@mui/icons-material/Replay";
import { Commit } from "src/octokitHelpers";
import UserLink from "src/components/UserLink";
import ShaLink from "src/components/ShaLink";
import { getCommitStatus } from "src/queries";
import useSetCommitState from "src/hooks/useSetCommitState";
import useOwnerRepo from "src/hooks/useOwnerRepo";
import useOctokit from "src/hooks/useOctokit";
import { COMMIT_STATUS_HTTP_CACHE_MAX_AGE_S } from "src/queries";
import { grey } from "@mui/material/colors";
import DisplayState from "src/components/DisplayState";

// Two minutes
const COMMIT_STATUS_POLL_INTERVAL_MS = 2 * 60 * 1000;
// So let our data only refetch after a bit more time than that
const COMMIT_STATUS_STALE_TIME_MS =
  (COMMIT_STATUS_HTTP_CACHE_MAX_AGE_S + 10) * 1000;

export default function CommitRow({ commit }: { commit: Commit }) {
  const octokit = useOctokit();
  const ownerRepo = useOwnerRepo();

  const sha = commit.sha;
  const status = useQuery({
    queryKey: ["getCommitStatus", { ownerRepo, sha }],
    queryFn: () => getCommitStatus(octokit!, ownerRepo, sha),
    refetchInterval: COMMIT_STATUS_POLL_INTERVAL_MS,
    staleTime: COMMIT_STATUS_STALE_TIME_MS,
    enabled: !!octokit,
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
      <TableCell style={{ minWidth: "250px" }}>
        {status.isError ? (
          <DisplayStateSkeleton animation={false} />
        ) : status.isLoading ? (
          <DisplayStateSkeleton />
        ) : (
          <DisplayState status={status.data} />
        )}
      </TableCell>
      <TableCell>
        <ButtonGroup>
          <LoadingButton
            title="Mark QA as Completed"
            onClick={setApprove}
            loading={approve.isLoading}
          >
            <DoneIcon />
          </LoadingButton>
          <LoadingButton
            title="Mark QA as Rejected"
            onClick={setDeny}
            loading={deny.isLoading}
          >
            <CloseIcon />
          </LoadingButton>
          <LoadingButton
            title="Reset QA Status"
            style={{ color: grey[400] }}
            onClick={setClear}
            loading={clear.isLoading}
          >
            <ReplayIcon />
          </LoadingButton>
        </ButtonGroup>
      </TableCell>
    </TableRow>
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
