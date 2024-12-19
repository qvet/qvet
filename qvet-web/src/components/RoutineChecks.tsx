import CloseIcon from "@mui/icons-material/Close";
import DoneIcon from "@mui/icons-material/Done";
import ReplayIcon from "@mui/icons-material/Replay";
import LoadingButton from "@mui/lab/LoadingButton";
import { Table, TableHead } from "@mui/material";
import ButtonGroup from "@mui/material/ButtonGroup";
import Skeleton from "@mui/material/Skeleton";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import { grey } from "@mui/material/colors";
import React from "react";
import { Link } from "react-router-dom";

import useCommitStatus from "src/hooks/useCommitStatus";
import useSetCommitState from "src/hooks/useSetCommitState";
import { STATUS_CONTEXT_ROUTINE_CHECK_PREFIX } from "src/queries";
import { RoutineCheck } from "src/utils/config";

import DisplayState from "./DisplayState";
import TableHeader from "./TableHeader";

export const routineCheckContext = (check: RoutineCheck): string =>
  `${STATUS_CONTEXT_ROUTINE_CHECK_PREFIX}${check.id}`;

export default function RoutineChecks({
  baseSha,
  checks,
}: {
  baseSha: string;
  checks: ReadonlyArray<RoutineCheck>;
}): React.ReactElement {
  return (
    <>
      <TableHeader title="Routine Checks" />
      <Table
        sx={{
          width: "100%",
        }}
        size="small">
        <colgroup>
          <col style={{ width: "auto" }} />
          <col style={{ width: "22%" }} />
          <col style={{ width: "10%" }} />
        </colgroup>
        <TableHead>
          <TableRow>
            <TableCell>Check</TableCell>
            <TableCell>Manual QA</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        {checks.map((check) => (
          <RoutineCheckRow key={check.id} sha={baseSha} check={check} />
        ))}
      </Table>
    </>
  );
}

function RoutineCheckRow({
  sha,
  check,
}: {
  sha: string;
  check: RoutineCheck;
}): React.ReactElement {
  const context = routineCheckContext(check);
  const commitStatus = useCommitStatus(sha, context);

  const approve = useSetCommitState(sha, "success", context);
  const deny = useSetCommitState(sha, "failure", context);
  const reset = useSetCommitState(sha, "pending", context);

  return (
    <TableRow>
      <TableCell
        component="th"
        scope="row"
        style={{
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          overflow: "hidden",
          width: "500px",
        }}>
        {check.text}
        {check.url && (
          <>
            <br />
            <Link to={check.url} target="_blank" rel="noopener">
              More details.
            </Link>
          </>
        )}
      </TableCell>
      <TableCell align="right">
        {commitStatus.isLoading ? (
          <DisplayStateSkeleton animation={false} />
        ) : (
          <DisplayState status={commitStatus.data!} />
        )}
      </TableCell>
      <TableCell align="right" width="0px">
        <ButtonGroup>
          <LoadingButton
            title="Mark QA as Completed"
            onClick={() =>
              approve.mutate({ description: "Routine check approved" })
            }
            loading={approve.isLoading}>
            <DoneIcon />
          </LoadingButton>
          <LoadingButton
            title="Mark QA as Rejected"
            onClick={() => deny.mutate({ description: "Routine check failed" })}
            loading={deny.isLoading}>
            <CloseIcon />
          </LoadingButton>
          <LoadingButton
            title="Reset QA Status"
            style={{ color: grey[400] }}
            onClick={() => reset.mutate({ description: "Routine check reset" })}
            loading={reset.isLoading}>
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
