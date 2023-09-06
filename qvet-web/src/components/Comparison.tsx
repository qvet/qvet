import { Octokit } from "octokit";
import { OwnerRepo, CommitComparison } from "src/octokitHelpers";
import { useQuery } from "@tanstack/react-query";
import CommitSummary from "src/components/CommitSummary";
import useOctokit from "src/hooks/useOctokit";
import useConfig from "src/hooks/useConfig";
import useBaseSha from "src/hooks/useBaseSha";
import useOwnerRepo from "src/hooks/useOwnerRepo";
import useProdTag from "src/hooks/useProdTag";
import Stack from "@mui/material/Stack";
import { Repository } from "src/octokitHelpers";
import Paper from "@mui/material/Paper";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";

export default function Comparison({ repo }: { repo: Repository }) {
  const octokit = useOctokit();
  const ownerRepo = useOwnerRepo();
  const baseSha = useBaseSha();
  const prodTag = useProdTag();
  const config = useConfig();

  const comparison = useQuery({
    queryKey: [
      "getComparison",
      {
        ownerRepo: ownerRepo.data,
        baseSha: baseSha.data,
        prodSha: prodTag.data?.commit.sha,
      },
    ],
    queryFn: () =>
      getCommitComparison(
        octokit!,
        ownerRepo.data!,
        baseSha.data!,
        prodTag.data!.commit.sha
      ),
    enabled: !!octokit && !!ownerRepo.data && !!baseSha.data && !!prodTag.data,
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

async function getCommitComparison(
  octokit: Octokit,
  ownerRepo: OwnerRepo,
  baseSha: string,
  prodSha: string
): Promise<CommitComparison> {
  const comparison = await octokit.request(
    "GET /repos/{owner}/{repo}/compare/{basehead}",
    { ...ownerRepo, basehead: `${prodSha}...${baseSha}` }
  );
  return comparison.data;
}
