import { LoadingButton } from "@mui/lab";
import { Alert, AlertTitle, Stack, Typography } from "@mui/material";
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
import {
  CheckRunGlobalConfig,
  CheckRunItemConfig,
  CheckRunLevel,
} from "src/utils/config";

import UserLink from "./UserLink";

// We also want to raise an issue if a check run is missing -
// this is not a status value that can be returned by the github api.
type ExtendedCheckRunStatus = CheckRun["status"] | "missing";

export function MissingCheckRun({
  checkRunItemConfig,
}: {
  checkRunItemConfig: CheckRunItemConfig;
}): React.ReactElement {
  const baseSha = useBaseSha();

  if (!baseSha.data) {
    return <></>;
  }

  return (
    <CheckRunInner
      level={checkRunItemConfig.level}
      checkName={checkRunItemConfig.name}
      checkStatus="missing"
      checkConclusion={null}
      checkDetailsUrl={null}
      configUrl={checkRunItemConfig.url || null}
      sha={baseSha.data}
    />
  );
}

// Alert for a check run that is either incomplete or failed
export function UnresolvedCheckRun({
  checkRun,
  config,
}: {
  checkRun: CheckRun;
  config: CheckRunGlobalConfig;
}): React.ReactElement {
  const baseSha = useBaseSha();
  const level = getCheckRunLevel(checkRun, config);
  const configUrl = getCheckRunConfigUrl(checkRun, config);

  if (!baseSha.data) {
    return <></>;
  }

  return (
    <CheckRunInner
      level={level}
      checkName={checkRun.name}
      checkStatus={checkRun.status}
      checkConclusion={checkRun.conclusion}
      checkDetailsUrl={checkRun.details_url}
      configUrl={configUrl}
      sha={baseSha.data}
    />
  );
}

function CheckRunInner({
  level,
  checkName,
  checkStatus,
  checkConclusion,
  checkDetailsUrl,
  configUrl,
  sha,
}: {
  level: CheckRunLevel;
  checkName: CheckRun["name"];
  checkStatus: ExtendedCheckRunStatus;
  checkConclusion: CheckRun["conclusion"];
  checkDetailsUrl: CheckRun["details_url"];
  configUrl: string | null;
  sha: string;
}): React.ReactElement {
  switch (level) {
    case "info":
      return (
        <InfoCheckRun
          checkName={checkName}
          checkStatus={checkStatus}
          checkConclusion={checkConclusion}
          checkDetailsUrl={checkDetailsUrl}
          configUrl={configUrl}
        />
      );
    case "embargo":
      if (sha) {
        return (
          <EmbargoCheckRun
            checkName={checkName}
            checkStatus={checkStatus}
            checkConclusion={checkConclusion}
            checkDetailsUrl={checkDetailsUrl}
            sha={sha}
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
  checkName,
  checkStatus,
  checkConclusion,
  checkDetailsUrl,
  configUrl,
}: {
  checkName: CheckRun["name"];
  checkStatus: ExtendedCheckRunStatus;
  checkConclusion: CheckRun["conclusion"];
  checkDetailsUrl: CheckRun["details_url"];
  configUrl: string | null;
}): React.ReactElement {
  return (
    <Alert severity="info">
      <CheckRunAlertTitle
        checkName={checkName}
        checkStatus={checkStatus}
        checkConclusion={checkConclusion}
        checkDetailsUrl={checkDetailsUrl}
      />
      This job does not block deployment. Run this job successfully to resolve
      this issue.
      <br />
      <CheckRunMoreDetails configUrl={configUrl} />
    </Alert>
  );
}

function EmbargoCheckRun({
  checkName,
  checkStatus,
  checkConclusion,
  checkDetailsUrl,
  configUrl,
  sha,
}: {
  checkName: CheckRun["name"];
  checkStatus: ExtendedCheckRunStatus;
  checkConclusion: CheckRun["conclusion"];
  checkDetailsUrl: CheckRun["details_url"];
  configUrl: string | null;
  sha: string;
}): React.ReactElement {
  const context = checkRunOverruleContext(checkName);
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

  const userLink = commitStatus.data?.creator ? (
    <UserLink user={commitStatus.data.creator} inline />
  ) : null;
  return (
    <Alert severity={embargoActive ? "warning" : "info"} action={action}>
      <CheckRunAlertTitle
        checkName={checkName}
        checkStatus={checkStatus}
        checkConclusion={checkConclusion}
        checkDetailsUrl={checkDetailsUrl}
      />
      {embargoActive ? (
        <span>
          This is blocking deployment. Run this job successfully to resolve this
          issue.
        </span>
      ) : (
        <span>
          This is no longer blocking deployment.{" "}
          {userLink && <span>Overruled by {userLink}.</span>}
        </span>
      )}
      <br />
      <CheckRunMoreDetails configUrl={configUrl} />
    </Alert>
  );
}

function CheckRunAlertTitle({
  checkName,
  checkStatus,
  checkConclusion,
  checkDetailsUrl,
}: {
  checkName: CheckRun["name"];
  checkStatus: ExtendedCheckRunStatus;
  checkConclusion: CheckRun["conclusion"];
  checkDetailsUrl: CheckRun["details_url"];
}): React.ReactElement {
  const checkRunName = (
    <CheckRunName checkName={checkName} checkDetailsUrl={checkDetailsUrl} />
  );
  switch (checkStatus) {
    case "completed":
      return (
        <AlertTitle>
          External job {checkRunName} has completed with status "
          {checkConclusion}"
        </AlertTitle>
      );
    case "missing":
      return (
        <AlertTitle>
          Could not find run for external job {checkRunName}
        </AlertTitle>
      );
    default:
      return (
        <AlertTitle>
          External job {checkRunName} is incomplete with status "{checkStatus}"
        </AlertTitle>
      );
  }
}

function CheckRunName({
  checkName,
  checkDetailsUrl,
}: {
  checkName: CheckRun["name"];
  checkDetailsUrl: CheckRun["details_url"];
}): React.ReactElement {
  return (
    <span style={{ fontWeight: "bold" }}>
      {checkDetailsUrl ? (
        <Link to={checkDetailsUrl} target="_blank" rel="noopener">
          {checkName}
        </Link>
      ) : (
        <Typography
          style={{ display: "inline", fontWeight: "bold" }}
          sx={{ color: (theme) => theme.palette.text.primary }}>
          {checkName}
        </Typography>
      )}
    </span>
  );
}

function CheckRunMoreDetails({
  configUrl,
}: {
  configUrl: string | null;
}): React.ReactElement | null {
  return configUrl ? (
    <Link to={configUrl} target="_blank" rel="noopener">
      What is this job?
    </Link>
  ) : null;
}
