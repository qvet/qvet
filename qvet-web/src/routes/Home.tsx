import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Octokit } from "octokit";
import CommitTable from "src/components/CommitTable";
import LoginStatus from "src/components/LoginStatus";
import LoginButton from "src/components/LoginButton";
import VersionUpdate from "src/components/VersionUpdate";
import useOctokit from "src/hooks/useOctokit";
import useMasterSha from "src/hooks/useMasterSha";
import useOwnerRepo from "src/hooks/useOwnerRepo";
import useProdTag from "src/hooks/useProdTag";
import useAccessToken from "src/hooks/useAccessToken";
import Stack from "@mui/material/Stack";
import { OwnerRepo, CommitComparison } from "src/octokitHelpers";
import Paper from "@mui/material/Paper";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";

export function Home() {
  // Backcompat - remove existing token storage in browser
  localStorage.removeItem("access_token");
  const accessToken = useAccessToken();
  const loggedIn = !(accessToken.isLoading || accessToken.isError);
  return (
    <Box style={{ width: "100%", padding: "8px" }}>
      <Stack spacing={2} alignItems="center">
        <VersionUpdate />
        <Typography variant="h2">qvet</Typography>
        {loggedIn ? (
          <>
            <LoginStatus />
            <Comparison />
          </>
        ) : (
          <Box>
            <LoginButton loggedIn={loggedIn} />
          </Box>
        )}
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
  const masterSha = useMasterSha();
  const prodTag = useProdTag();

  const comparison = useQuery({
    queryKey: [
      "getComparison",
      {
        ownerRepo,
        masterSha: masterSha.data,
        prodSha: prodTag.data?.commit.sha,
      },
    ],
    queryFn: () =>
      getCommitComparison(
        octokit!,
        ownerRepo,
        masterSha.data!,
        prodTag.data!.commit.sha
      ),
    enabled: !!octokit && !!masterSha.data && !!prodTag.data,
  });

  return (
    <>
      <Paper elevation={3}>
        <Box padding={2}>
          {prodTag.data === null ? (
            <Alert severity="info">No previous prod release</Alert>
          ) : comparison.isError ? (
            <Alert severity="error">Error loading comparison</Alert>
          ) : comparison.isLoading ? (
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
            <CommitSummary comparison={comparison.data} />
          )}
        </Box>
      </Paper>
    </>
  );
}

interface CommitSummaryProps {
  comparison: CommitComparison;
}

export function CommitSummary({ comparison }: CommitSummaryProps) {
  const developerCommits = comparison.commits.filter((commit) => {
    // FIXME un-hardcode
    return !(commit.author && commit.author.login === "rebors[bot]");
  });
  developerCommits.reverse();
  const hiddenCommitCount = comparison.commits.length - developerCommits.length;

  return (
    <Stack spacing={1}>
      <CommitTable commits={developerCommits} />
      <Typography variant="caption">
        Showing {developerCommits.length} undeployed commits on{" "}
        <code>master</code> (view the{" "}
        {<Link to={comparison.html_url}>Github comparison</Link>}):
      </Typography>
      <Typography variant="caption">
        {hiddenCommitCount} commits from <code>bors</code> are hidden.
      </Typography>
    </Stack>
  );
}
