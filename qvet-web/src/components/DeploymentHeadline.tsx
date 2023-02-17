import { useQueries } from "@tanstack/react-query";
import { Commit } from "src/octokitHelpers";
import { useCommitStatusQuery } from "src/hooks/useCommitStatus";
import Alert from "@mui/material/Alert";
import Collapse from "@mui/material/Collapse";
import Button from "@mui/material/Button";
import { useCallback } from "react";

const JENKINS_DEPLOY_UI =
  "http://localhost:39101/job/ProductionDeployment/job/Deploy/";

export default function CommitTable({ commits }: { commits: Array<Commit> }) {
  const statusQueries = useQueries({
    queries: commits.map((commit) => useCommitStatusQuery(commit.sha)),
  });
  const allSuccess = statusQueries.every(
    (statusQuery) =>
      statusQuery.isSuccess && statusQuery.data?.state === "success"
  );
  const readyToDeploy = allSuccess && commits.length > 0;

  const goToJenkins = useCallback(() => {
    window.open(JENKINS_DEPLOY_UI, "_blank");
  }, []);

  return (
    <Collapse in={readyToDeploy}>
      <Alert
        severity="success"
        action={
          <Button color="inherit" size="small" onClick={goToJenkins}>
            Go To Jenkins
          </Button>
        }
      >
        Ready to Deploy
      </Alert>
    </Collapse>
  );
}
