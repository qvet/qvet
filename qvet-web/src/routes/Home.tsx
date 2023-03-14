import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Octokit } from "octokit";
import RepoSelect from "src/components/RepoSelect";
import CommitTable from "src/components/CommitTable";
import ConfigStatus from "src/components/ConfigStatus";
import LoginStatus from "src/components/LoginStatus";
import LoginButton from "src/components/LoginButton";
import DeploymentHeadline from "src/components/DeploymentHeadline";
import VersionUpdate from "src/components/VersionUpdate";
import useOctokit from "src/hooks/useOctokit";
import useConfig from "src/hooks/useConfig";
import { Config } from "src/utils/config";
import useLoginRedirect from "src/hooks/useLoginRedirect";
import useMasterSha from "src/hooks/useMasterSha";
import useOwnerRepo, { useRepo } from "src/hooks/useOwnerRepo";
import useProdTag from "src/hooks/useProdTag";
import useAccessToken from "src/hooks/useAccessToken";
import Stack from "@mui/material/Stack";
import { OwnerRepo, CommitComparison, Repository } from "src/octokitHelpers";
import Paper from "@mui/material/Paper";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import { LOCAL_STORAGE_KEYS } from "src/constants";

export function Home() {
  const accessToken = useAccessToken();
  const loginRedirect = useLoginRedirect();
  const oauthFlowInFlight = !!localStorage.getItem(
    LOCAL_STORAGE_KEYS.oauthFlowInternalState
  );

  useEffect(() => {
    if (accessToken.isError && !oauthFlowInFlight) {
      loginRedirect();
    }
  }, [accessToken]);

  return (
    <Box style={{ width: "100%", padding: "8px" }}>
      <Stack spacing={2} alignItems="center">
        <VersionUpdate />
        <Typography variant="h2">qvet</Typography>
        {
          // Only show login button if there's an oauth flow in flight,
          // i.e. it failed to complete successfully.
          //
          // We do this to avoid an infinite loop on error.
          accessToken.isError && oauthFlowInFlight ? (
            <Box>
              <LoginButton loggedIn={false} />
            </Box>
          ) : (
            <>
              <LoginStatus />
              <RepoSelect />
              <Comparison />
            </>
          )
        }
      </Stack>
    </Box>
  );
}

async function getCommitComparison(
  octokit: Octokit,
  ownerRepo: OwnerRepo,
  masterSha: string,
  prodSha: string
): Promise<CommitComparison> {
  const comparison = await octokit.request(
    "GET /repos/{owner}/{repo}/compare/{basehead}",
    { ...ownerRepo, basehead: `${prodSha}...${masterSha}` }
  );
  return comparison.data;
}

export function Comparison() {
  const octokit = useOctokit();
  const ownerRepo = useOwnerRepo();
  const repo = useRepo();
  const masterSha = useMasterSha();
  const prodTag = useProdTag();
  const config = useConfig();

  const comparison = useQuery({
    queryKey: [
      "getComparison",
      {
        ownerRepo: ownerRepo.data,
        masterSha: masterSha.data,
        prodSha: prodTag.data?.commit.sha,
      },
    ],
    queryFn: () =>
      getCommitComparison(
        octokit!,
        ownerRepo.data!,
        masterSha.data!,
        prodTag.data!.commit.sha
      ),
    enabled:
      !!octokit && !!ownerRepo.data && !!masterSha.data && !!prodTag.data,
    // default branch should not be rewritten, this will not go out of date
    // unless the refs are updated
    staleTime: Infinity,
  });

  return (
    <>
      <Paper elevation={3}>
        <Box padding={2}>
          {prodTag.data === null ? (
            <Alert severity="info">No previous prod release</Alert>
          ) : repo.data === null ? (
            <Alert severity="info">
              <AlertTitle>No repositories found</AlertTitle>
              You need to install the{" "}
              <Link target="_blank" to="https://github.com/apps/qvet">
                qvet GitHub App
              </Link>{" "}
              on a repository before it is listed here.
            </Alert>
          ) : comparison.isError || config.isError || repo.isError ? (
            <Alert severity="error">Error loading comparison</Alert>
          ) : comparison.isLoading || config.isLoading || repo.isLoading ? (
            <Stack spacing={1}>
              {Array.from(Array(4)).map((_value, index) => (
                <Skeleton
                  key={index}
                  variant="rounded"
                  width={920}
                  height={60}
                />
              ))}
            </Stack>
          ) : (
            <CommitSummary
              comparison={comparison.data}
              config={config.data}
              repo={repo.data}
            />
          )}
        </Box>
      </Paper>
    </>
  );
}

interface CommitSummaryProps {
  comparison: CommitComparison;
  config: Config;
  repo: Repository;
}

export function CommitSummary({
  comparison,
  config,
  repo,
}: CommitSummaryProps) {
  const authorLogins = config.commit.ignore.authors;
  const developerCommits = comparison.commits.filter((commit) => {
    return !authorLogins.some(
      (ignoredLogin) => ignoredLogin === commit.author?.login
    );
  });
  developerCommits.reverse();
  const hiddenCommitCount = comparison.commits.length - developerCommits.length;
  const ignoredLoginList = authorLogins.join(", ");

  return (
    <Stack spacing={1}>
      <DeploymentHeadline commits={developerCommits} />
      <ConfigStatus />
      <CommitTable commits={developerCommits} />
      <Typography variant="caption">
        Showing {developerCommits.length} undeployed commits on{" "}
        <code>{repo.default_branch}</code> (view the{" "}
        {
          <Link target="_blank" to={comparison.html_url}>
            Github comparison
          </Link>
        }
        ):
      </Typography>
      {hiddenCommitCount > 0 ? (
        <Typography variant="caption">
          {hiddenCommitCount} commits from {ignoredLoginList} are hidden.
        </Typography>
      ) : null}
      <ConfigStatus showInfo />
    </Stack>
  );
}
