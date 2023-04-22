import { useQueries } from "@tanstack/react-query";
import { Commit, Status } from "src/octokitHelpers";
import {
  commitStatusQuery,
  useCommitStatusList,
  embargoListFromStatusList,
} from "src/hooks/useCommitStatus";
import useSetCommitState from "src/hooks/useSetCommitState";
import { STATUS_CONTEXT_QA, STATUS_CONTEXT_EMBARGO_PREFIX } from "src/queries";
import useOwnerRepo from "src/hooks/useOwnerRepo";
import useConfig from "src/hooks/useConfig";
import { Action } from "src/utils/config";
import useOctokit from "src/hooks/useOctokit";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Collapse from "@mui/material/Collapse";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import LoadingButton from "@mui/lab/LoadingButton";
import { useCallback } from "react";
import UserLink from "src/components/UserLink";
import RelativeTime from "src/components/RelativeTime";

function useAllQaSuccess(commits: Array<Commit>): boolean {
  const octokit = useOctokit();
  const ownerRepo = useOwnerRepo();
  const statusQueries = useQueries({
    queries: commits.map((commit) =>
      commitStatusQuery(octokit, ownerRepo, commit.sha, STATUS_CONTEXT_QA)
    ),
  });
  return statusQueries.every(
    (statusQuery) =>
      statusQuery.isSuccess && statusQuery.data?.state === "success"
  );
}

interface EmbargoRowProps {
  sha: string;
  status: Status;
  id: string;
}

function EmbargoRow({ sha, status, id }: EmbargoRowProps) {
  const [remove, setRemove] = useSetCommitState(
    sha,
    "success",
    `${STATUS_CONTEXT_EMBARGO_PREFIX}${id}`
  );
  const action = (
    <Stack style={{ height: "100%" }} spacing={1} justifyContent="center">
      <LoadingButton
        color="inherit"
        size="small"
        onClick={setRemove}
        loading={remove.isLoading}
      >
        Resolve
      </LoadingButton>
    </Stack>
  );

  return (
    <Alert severity="warning" action={action}>
      <AlertTitle>Embargo in place</AlertTitle>
      <Typography>{status.description || "<no reason>"}</Typography>
      <Typography variant="caption">
        Created{" "}
        {status.creator ? (
          <>
            by <UserLink user={status.creator} inline />{" "}
          </>
        ) : (
          ""
        )}
        <RelativeTime timestamp={status.created_at} />
      </Typography>
    </Alert>
  );
}

export default function DeploymentHeadline({
  commits,
  baseSha,
}: {
  commits: Array<Commit>;
  baseSha: string;
}) {
  const commitStatusList = useCommitStatusList(baseSha);
  const embargoList = commitStatusList.isSuccess
    ? embargoListFromStatusList(baseSha, commitStatusList.data)
    : null;

  const noEmbargos = embargoList !== null && embargoList.length === 0;
  const allQaSuccess = useAllQaSuccess(commits);
  const readyToDeploy = noEmbargos && allQaSuccess && commits.length > 0;
  const config = useConfig();
  const action = !!config.data && config.data.action.ready;

  const alerts = (embargoList || []).map((embargo) => (
    <EmbargoRow
      key={embargo.id}
      sha={embargo.sha}
      status={embargo.status}
      id={embargo.id}
    />
  ));

  if (readyToDeploy) {
    const readyAlert = (
      <Alert
        key="ready-to-deploy"
        severity="success"
        action={!!action ? <ReadyAction action={action} /> : null}
      >
        Ready to Deploy
      </Alert>
    );
    alerts.push(readyAlert);
  }

  return alerts.length > 0 ? <Stack spacing={1}>{alerts}</Stack> : null;
}

function ReadyAction({ action }: { action: Action }) {
  const onAction = useCallback(() => {
    window.open(action.url, "_blank");
  }, [action]);

  return (
    <Button color="inherit" size="small" onClick={onAction}>
      {action.name}
    </Button>
  );
}
