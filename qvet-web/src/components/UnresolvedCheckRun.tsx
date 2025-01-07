import { LoadingButton } from "@mui/lab";
import { Alert, AlertTitle, Stack } from "@mui/material";
import { Link } from "react-router-dom";

import useBaseSha from "src/hooks/useBaseSha";
import {
  checkRunOverruleContext,
  getCheckRunConfigUrl,
  getCheckRunLevel,
} from "src/hooks/useCheckRuns";
import useCommitStatus from "src/hooks/useCommitStatus";
import useSetCommitState from "src/hooks/useSetCommitState";
import { CheckRun } from "src/octokitHelpers";
import { CheckRunGlobalConfig } from "src/utils/config";

import UserLink from "./UserLink";

// Alert for a check run that is either incomplete or failed
export default function UnresolvedCheckRun({
  checkRun,
  config,
}: {
  checkRun: CheckRun;
  config: CheckRunGlobalConfig;
}): React.ReactElement {
  const baseSha = useBaseSha();
  const level = getCheckRunLevel(checkRun, config);
  const configUrl = getCheckRunConfigUrl(checkRun, config);

  switch (level) {
    case "info":
      return <InfoCheckRun checkRun={checkRun} configUrl={configUrl} />;
    case "embargo":
      if (baseSha.data) {
        return (
          <EmbargoCheckRun
            checkRun={checkRun}
            sha={baseSha.data}
            configUrl={configUrl}
          />
        );
      }
      return <></>;
    case "hidden":
      return <></>;
    default:
      console.error(`Unknown embargo level ${level}`);
      return <></>;
  }
}

function InfoCheckRun({
  checkRun,
  configUrl,
}: {
  checkRun: CheckRun;
  configUrl: string | null;
}): React.ReactElement {
  const checkRunName = (
    <span style={{ fontWeight: "bold" }}>
      {checkRun.details_url ? (
        <Link to={checkRun.details_url} target="_blank" rel="noopener">
          {checkRun.name}
        </Link>
      ) : (
        checkRun.name
      )}
    </span>
  );

  return (
    <Alert severity="info">
      {checkRun.status === "completed" ? (
        <AlertTitle>
          External job {checkRunName} has completed with status "
          {checkRun.conclusion}"
        </AlertTitle>
      ) : (
        <AlertTitle>
          External job {checkRunName} is incomplete with status "
          {checkRun.status}"
        </AlertTitle>
      )}
      This job does not block deployment. Re-run this job successfully to
      resolve this issue.
      <br />
      {configUrl && (
        <Link to={configUrl} target="_blank" rel="noopener">
          What is this job?
        </Link>
      )}
    </Alert>
  );
}

function EmbargoCheckRun({
  checkRun,
  sha,
  configUrl,
}: {
  checkRun: CheckRun;
  sha: string;
  configUrl: string | null;
}): React.ReactElement {
  const context = checkRunOverruleContext(checkRun);
  const commitStatus = useCommitStatus(sha, context);

  const overrule = useSetCommitState(sha, "success", context);
  const removeOverrule = useSetCommitState(sha, "failure", context);

  const embargoActive = commitStatus.data?.state !== "success";

  const action = (
    <Stack style={{ height: "100%" }} spacing={1} justifyContent="center">
      <LoadingButton
        color="inherit"
        size="small"
        onClick={() =>
          embargoActive
            ? overrule.mutateAsync({
                description: "Overruled by user.",
              })
            : removeOverrule.mutateAsync({
                description: "Overrule removed by user.",
              })
        }
        loading={false}>
        {embargoActive ? "Overrule" : "Remove Overrule"}
      </LoadingButton>
    </Stack>
  );
  const checkRunName = (
    <span style={{ fontWeight: "bold" }}>
      {checkRun.details_url ? (
        <Link to={checkRun.details_url} target="_blank" rel="noopener">
          {checkRun.name}
        </Link>
      ) : (
        checkRun.name
      )}
    </span>
  );
  const userLink = commitStatus.data?.creator ? (
    <UserLink user={commitStatus.data.creator} inline />
  ) : null;
  return (
    <Alert severity={embargoActive ? "warning" : "info"} action={action}>
      {checkRun.status === "completed" ? (
        <AlertTitle>
          External job {checkRunName} has completed with status "
          {checkRun.conclusion}"
        </AlertTitle>
      ) : (
        <AlertTitle>
          External job {checkRunName} is incomplete with status "
          {checkRun.status}"
        </AlertTitle>
      )}
      {embargoActive ? (
        <span>
          This is blocking deployment. Re-run this job successfully to resolve
          this issue.
        </span>
      ) : (
        <span>
          This is no longer blocking deployment.{" "}
          {userLink && <span>Overruled by {userLink}.</span>}
        </span>
      )}
      <br />
      {configUrl && (
        <Link to={configUrl} target="_blank" rel="noopener">
          What is this job?
        </Link>
      )}
    </Alert>
  );
}
