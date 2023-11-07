import LoadingButton from "@mui/lab/LoadingButton";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {
  useQueries,
  UseQueryResult,
  QueriesResults,
} from "@tanstack/react-query";
import { memo, useCallback } from "react";

import RelativeTime from "src/components/RelativeTime";
import UserLink from "src/components/UserLink";
import {
  commitStatusQuery,
  useCommitStatusList,
  embargoListFromStatusList,
} from "src/hooks/useCommitStatus";
import useConfig from "src/hooks/useConfig";
import useLogin from "src/hooks/useLogin";
import useOctokit from "src/hooks/useOctokit";
import useOwnerRepo from "src/hooks/useOwnerRepo";
import useSetCommitState from "src/hooks/useSetCommitState";
import useTeamMembers from "src/hooks/useTeamMembers";
import { Commit, Status } from "src/octokitHelpers";
import { STATUS_CONTEXT_QA, STATUS_CONTEXT_EMBARGO_PREFIX } from "src/queries";
import { Action } from "src/utils/config";

function useAllQaSuccess(commits: Array<Commit>): boolean {
  const octokit = useOctokit();
  const ownerRepo = useOwnerRepo();
  const statusQueries: QueriesResults<Array<Status | null>> = useQueries({
    queries: commits.map((commit) =>
      commitStatusQuery(octokit, ownerRepo, commit.sha, STATUS_CONTEXT_QA),
    ),
  });
  return statusQueries.every(
    (statusQuery: UseQueryResult<unknown, unknown>): boolean => {
      const data: Status | null = statusQuery.data as any;
      return statusQuery.isSuccess && data?.state === "success";
    },
  );
}

interface EmbargoRowProps {
  sha: string;
  status: Status;
  id: string;
}

function EmbargoRow({ sha, status, id }: EmbargoRowProps) {
  const remove = useSetCommitState(
    sha,
    "success",
    `${STATUS_CONTEXT_EMBARGO_PREFIX}${id}`,
  );
  const setRemove = useCallback(
    () => remove.mutate({ description: null }),
    [remove],
  );
  const action = (
    <Stack style={{ height: "100%" }} spacing={1} justifyContent="center">
      <LoadingButton
        color="inherit"
        size="small"
        onClick={setRemove}
        loading={remove.isLoading}>
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

function selectUsers<T>(array: Array<T>) {
  // Optimally randomly select a set of max 3 users
  const finalArraySize = Math.min(array.length, 3);
  array = array.slice();
  for (let i = 0; i < finalArraySize; i++) {
    const j = Math.floor(i + Math.random() * (array.length - i));
    [array[i], array[j]] = [array[j], array[i]];
  }
  array.length = finalArraySize;
  return array;
}

interface DeploymentUsersProps {
  commits: Array<Commit>;
}

const DeploymentUsers = memo(function ({ commits }: DeploymentUsersProps) {
  const allUsers = useTeamMembers();
  const loginData = useLogin();
  if (allUsers.isLoading || allUsers.isError || allUsers.data === null) {
    return null;
  }

  const userIdsWithCommits = new Set(
    commits.map((commit) => commit.author?.id).filter((id) => id !== undefined),
  );
  const usersWithoutCommits = allUsers.data.filter(
    (user) => !userIdsWithCommits.has(user.id),
  );

  if (usersWithoutCommits.length === 0) {
    return (
      <Typography>
        All team members have a commit to be deployed, please ask the
        support-dev to do an emergency deployment
      </Typography>
    );
  }

  const userIdsWithoutCommits = new Set(
    usersWithoutCommits.map((user) => user.id),
  );
  if (loginData.data && userIdsWithoutCommits.has(loginData.data.id)) {
    return <Typography>You can deploy!</Typography>;
  }

  const luckyUsers = selectUsers(usersWithoutCommits);
  const userSingularOrPlural = luckyUsers.length > 1 ? "users" : "user";
  return (
    <Typography>
      The following randomly selected {userSingularOrPlural} can deploy:
      <Stack
        style={{ padding: "0.5em", columnGap: "1em" }}
        spacing={1}
        direction="row">
        {luckyUsers.map((user) => (
          <UserLink key={user.id} user={user} />
        ))}
      </Stack>
    </Typography>
  );
});

export default function DeploymentHeadline({
  commits,
  baseSha,
}: {
  commits: Array<Commit>;
  baseSha: string;
}): React.ReactElement | null {
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
        action={action ? <ReadyAction action={action} /> : null}>
        Ready to Deploy
        <DeploymentUsers commits={commits} />
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
