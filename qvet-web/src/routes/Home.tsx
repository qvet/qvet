import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, useCallback } from "react";
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
              <Installations />
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

function Installations() {
  const repo = useRepo();

  return repo.isError ? (
    <Paper elevation={3}>
      <Box padding={2}>
        <Alert severity="error">Error loading repositories</Alert>
      </Box>
    </Paper>
  ) : repo.isLoading ? (
    <Skeleton variant="rounded" width={450} height={56} />
  ) : repo.data === null ? (
    <Paper elevation={3}>
      <Box padding={2}>
        <Alert severity="info">
          <AlertTitle>No repositories found</AlertTitle>
          You need to install the{" "}
          <Link target="_blank" to="https://github.com/apps/qvet">
            qvet GitHub App
          </Link>{" "}
          on a repository before it is listed here.
        </Alert>
      </Box>
    </Paper>
  ) : (
    <>
      <RepoSelect />
      <Comparison repo={repo.data} />
    </>
  );
}

export function Comparison({ repo }: { repo: Repository }) {
  const octokit = useOctokit();
  const ownerRepo = useOwnerRepo();
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
          ) : comparison.isError || config.isError ? (
            <Alert severity="error">Error loading comparison</Alert>
          ) : comparison.isLoading || config.isLoading ? (
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
              repo={repo}
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
  const [expand, setExpand] = useState<boolean>(false);

  const authorLogins = config.commit.ignore.authors;
  const merges = config.commit.ignore.merges;
  const developerCommits = comparison.commits.filter((commit) => {
    // Is a merge (and we don't want merges)
    if (merges && commit.parents.length > 1) {
      return false;
    }

    // Author is in the ignore list
    if (
      authorLogins.some((ignoredLogin) => ignoredLogin === commit.author?.login)
    ) {
      return false;
    }
    return true;
  });
  const ignoredCommitCount =
    comparison.commits.length - developerCommits.length;
  const ignoredParts = [];
  if (merges) {
    ignoredParts.push("merges");
  }
  if (authorLogins.length > 0) {
    ignoredParts.push(
      `author${authorLogins.length > 1 ? "s" : ""} ${authorLogins.join(", ")}`
    );
  }

  const ignoredDescription = ignoredParts.join(", and ");

  const onExpand = useCallback(() => {
    setExpand((value) => !value);
  }, [setExpand]);

  const expandToggle = (
    <Link to="#" onClick={onExpand}>
      {expand ? "collapse" : "expand"}
    </Link>
  );

  // Duplicate the commits to show, so we can reverse the array
  const visibleCommits =
    // If we're expanding ignored commits, use original without filtering
    (expand ? comparison.commits : developerCommits).slice();
  visibleCommits.reverse();

  return (
    <Stack spacing={1}>
      <DeploymentHeadline commits={developerCommits} />
      <ConfigStatus />
      <CommitTable commits={visibleCommits} />
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
      {ignoredCommitCount > 0 ? (
        <Typography variant="caption">
          {ignoredCommitCount} commits from {ignoredDescription} are ignored (
          {expandToggle})
        </Typography>
      ) : null}
      <ConfigStatus showInfo />
    </Stack>
  );
}
