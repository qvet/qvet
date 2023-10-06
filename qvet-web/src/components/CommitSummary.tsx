import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Collapse from "@mui/material/Collapse";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useState, useCallback } from "react";
import { Link } from "react-router-dom";

import AddEmbargoDialog from "src/components/AddEmbargoDialog";
import CommitTable from "src/components/CommitTable";
import ConfigStatus from "src/components/ConfigStatus";
import DeploymentHeadline from "src/components/DeploymentHeadline";
import { CommitComparison, Repository } from "src/octokitHelpers";
import { Config } from "src/utils/config";

interface CommitSummaryProps {
  comparison: CommitComparison;
  config: Config;
  repo: Repository;
}

export default function CommitSummary({
  comparison,
  config,
  repo,
}: CommitSummaryProps): React.ReactElement {
  const [expand, setExpand] = useState<boolean>(false);

  const authorLogins = config.commit.ignore.authors;
  const merges = config.commit.ignore.merges;
  const base_branch = config.commit.base
    ? config.commit.base
    : repo.default_branch;
  const developerCommits = comparison.commits.filter((commit) => {
    // Is a merge (and we don't want merges)
    if (merges && commit.parents.length > 1) {
      return false;
    }

    // Author is in the ignore list
    return !authorLogins.some(
      (ignoredLogin) => ignoredLogin === commit.author?.login,
    );
  });
  const ignoredCommitCount =
    comparison.commits.length - developerCommits.length;
  const ignoredParts = [];
  if (merges) {
    ignoredParts.push("merges");
  }
  if (authorLogins.length > 0) {
    ignoredParts.push(
      `author${authorLogins.length > 1 ? "s" : ""} ${authorLogins.join(", ")}`,
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

  const deploymentHeadline = (
    <DeploymentHeadline
      commits={developerCommits}
      baseSha={comparison.base_commit.sha}
    />
  );
  const configStatus = <ConfigStatus />;

  return (
    <Stack spacing={1}>
      <Box padding={1}>
        <Stack spacing={1}>
          <RepoSummary repo={repo} />
          <RepoActions baseSha={comparison.base_commit.sha} />
        </Stack>
      </Box>
      {
        <Collapse in={!!deploymentHeadline || !!configStatus}>
          {deploymentHeadline}
          {configStatus}
        </Collapse>
      }
      <CommitTable commits={visibleCommits} />
      <Typography variant="caption">
        Showing {developerCommits.length} undeployed commits on{" "}
        <code>{base_branch}</code> (view the{" "}
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

function RepoSummary({ repo }: { repo: Repository }) {
  return (
    <>
      <Typography variant="h5">{repo.full_name}</Typography>
      {repo.description ? <Typography>{repo.description}</Typography> : null}
    </>
  );
}

function RepoActions({ baseSha }: { baseSha: string }) {
  const [open, setOpen] = useState<boolean>(false);
  const handleOpen = useCallback(() => setOpen(true), [setOpen]);
  const handleClose = useCallback(() => setOpen(false), [setOpen]);
  return (
    <div>
      <AddEmbargoDialog onClose={handleClose} open={open} sha={baseSha} />
      <Button
        aria-label="embargo repository"
        component="label"
        onClick={handleOpen}
        size="small"
        variant="outlined">
        Add Embargo
      </Button>
    </div>
  );
}
