import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {
  FetchQueryOptions,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Octokit } from "octokit";
import { useEffect, useState } from "react";

import CommitSummary from "src/components/CommitSummary";
import useBaseSha from "src/hooks/useBaseSha";
import { commitStatusQuery } from "src/hooks/useCommitStatus";
import useConfig from "src/hooks/useConfig";
import useOctokit from "src/hooks/useOctokit";
import useOwnerRepo from "src/hooks/useOwnerRepo";
import useProdTag from "src/hooks/useProdTag";
import { Commit, OwnerRepo, CommitComparison } from "src/octokitHelpers";
import { Repository } from "src/octokitHelpers";
import { STATUS_CONTEXT_QA } from "src/queries";
import { isDeveloperCommit } from "src/utils/config";

// Long enough for most releases to arrive whole, short enough not to stall a big one.
const SHOW_LOADED_SO_FAR_AFTER_MS = 3000;

export default function Comparison({
  repo,
}: {
  repo: Repository;
}): React.ReactElement {
  const octokit = useOctokit();
  const ownerRepo = useOwnerRepo();
  const baseSha = useBaseSha();
  const prodTag = useProdTag();
  const config = useConfig();
  const [loadedSoFar, setLoadedSoFar] = useState<CommitComparison | null>(null);
  const [showLoadedSoFar, setShowLoadedSoFar] = useState(false);
  const queryClient = useQueryClient();

  const comparison = useQuery({
    queryKey: [
      "getComparison",
      {
        ownerRepo: ownerRepo.data,
        baseSha: baseSha.data,
        prodSha: prodTag.data?.commit.sha,
      },
    ],
    queryFn: () => {
      // Otherwise the previous repo's commits would show for the new one.
      setLoadedSoFar(null);
      return getCommitComparison(
        octokit!,
        ownerRepo.data!,
        baseSha.data!,
        prodTag.data!.commit.sha,
        setLoadedSoFar,
        // The headline needs every developer commit's QA status, so start
        // each page's requests as it lands rather than once the list renders.
        (commits) => {
          for (const commit of commits) {
            if (isDeveloperCommit(commit, config.data!)) {
              queryClient.prefetchQuery(
                commitStatusQuery(
                  octokit,
                  ownerRepo,
                  commit.sha,
                  STATUS_CONTEXT_QA,
                ) as FetchQueryOptions,
              );
            }
          }
        },
      );
    },
    enabled: !!octokit && !!ownerRepo.data && !!baseSha.data && !!prodTag.data,
    // octokit already retries each page; a query retry would refetch them all.
    retry: false,
    // default branch should not be rewritten, this will not go out of date
    // unless the refs are updated
    staleTime: Infinity,
  });

  // isLoading is also true while the query is disabled waiting on the refs;
  // the three seconds should only count the comparison fetch itself.
  const fetching = comparison.isInitialLoading;
  useEffect(() => {
    if (!fetching) {
      return;
    }
    setShowLoadedSoFar(false);
    const timer = setTimeout(
      () => setShowLoadedSoFar(true),
      SHOW_LOADED_SO_FAR_AFTER_MS,
    );
    return () => clearTimeout(timer);
  }, [fetching]);

  const shown =
    comparison.data ??
    (showLoadedSoFar && loadedSoFar?.commits.length ? loadedSoFar : null);

  return (
    <>
      <Paper elevation={3}>
        <Box padding={2}>
          {prodTag.data === null ? (
            <Alert severity="info">No previous prod release</Alert>
          ) : comparison.isError || config.isError ? (
            <Alert severity="error">
              Error loading comparison:{" "}
              {errorMessage(comparison.error ?? config.error)}
            </Alert>
          ) : !shown || !config.data ? (
            <GatheringCommits loadedSoFar={loadedSoFar} />
          ) : (
            <CommitSummary
              comparison={shown}
              config={config.data}
              repo={repo}
            />
          )}
        </Box>
      </Paper>
    </>
  );
}

function GatheringCommits({
  loadedSoFar,
}: {
  loadedSoFar: CommitComparison | null;
}): React.ReactElement {
  return (
    <Stack spacing={2} padding={4} alignItems="center">
      <CircularProgress />
      <Typography>
        Gathering commits
        {loadedSoFar &&
          ` (${loadedSoFar.commits.length} of ${loadedSoFar.total_commits})`}
        …
      </Typography>
    </Stack>
  );
}

const COMPARE_PAGE_SIZE = 100;

async function getCommitComparison(
  octokit: Octokit,
  ownerRepo: OwnerRepo,
  baseSha: string,
  prodSha: string,
  onProgress: (loadedSoFar: CommitComparison) => void,
  onPage: (commits: Array<Commit>) => void,
): Promise<CommitComparison> {
  const fetchPage = async (page: number): Promise<CommitComparison> =>
    (
      await octokit.request("GET /repos/{owner}/{repo}/compare/{basehead}", {
        ...ownerRepo,
        basehead: `${prodSha}...${baseSha}`,
        per_page: COMPARE_PAGE_SIZE,
        page,
      })
    ).data;

  // The first page carries the total, so the rest can be fetched in parallel.
  const first = await fetchPage(1);
  const pageCount = Math.max(
    1,
    Math.ceil(first.total_commits / COMPARE_PAGE_SIZE),
  );
  // Pages land in any order; slots keep the commits oldest first.
  const pages: Array<CommitComparison | undefined> = Array(pageCount);
  pages[0] = first;
  const assemble = (): CommitComparison => ({
    ...first,
    commits: pages.flatMap((page) => page?.commits ?? []),
  });

  const rest = Promise.all(
    Array.from({ length: pageCount - 1 }, async (_, index) => {
      const page = await fetchPage(index + 2);
      pages[index + 1] = page;
      onPage(page.commits);
      onProgress(assemble());
    }),
  );
  // octokit's throttle runs requests in order, 10 at a time, so the
  // remaining pages must be queued before this page's status requests.
  onPage(first.commits);
  onProgress(assemble());
  await rest;

  const comparison = assemble();
  if (comparison.commits.length !== first.total_commits) {
    throw new Error(
      `Loaded ${comparison.commits.length} of ${first.total_commits} commits in the comparison`,
    );
  }
  return comparison;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
