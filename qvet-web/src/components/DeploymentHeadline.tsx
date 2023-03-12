import { useQueries } from "@tanstack/react-query";
import { Commit } from "src/octokitHelpers";
import { commitStatusQuery } from "src/hooks/useCommitStatus";
import useOwnerRepo from "src/hooks/useOwnerRepo";
import useConfig, { Action } from "src/hooks/useConfig";
import useOctokit from "src/hooks/useOctokit";
import Alert from "@mui/material/Alert";
import Collapse from "@mui/material/Collapse";
import Button from "@mui/material/Button";
import { useCallback } from "react";

// FIXME unhardcode
const JENKINS_DEPLOY_UI =
  "http://localhost:39101/job/ProductionDeployment/job/Deploy/";

export default function CommitTable({ commits }: { commits: Array<Commit> }) {
  const octokit = useOctokit();
  const ownerRepo = useOwnerRepo();
  const statusQueries = useQueries({
    queries: commits.map((commit) =>
      commitStatusQuery(octokit, ownerRepo, commit.sha)
    ),
  });
  const allSuccess = statusQueries.every(
    (statusQuery) =>
      statusQuery.isSuccess && statusQuery.data?.state === "success"
  );
  const readyToDeploy = allSuccess && commits.length > 0;
  const config = useConfig();
  const action = !!config.data && config.data.actions.ready;

  return (
    <Collapse in={readyToDeploy}>
      <Alert
        severity="success"
        action={!!action ? <ReadyAction action={action} /> : null}
      >
        Ready to Deploy
      </Alert>
    </Collapse>
  );
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
