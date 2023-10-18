import ClearIcon from "@mui/icons-material/Clear";
import { IconButton, TextField, Tooltip } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Collapse from "@mui/material/Collapse";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Fuse from "fuse.js";
import { useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";

import AddEmbargoDialog from "src/components/AddEmbargoDialog";
import CommitTable from "src/components/CommitTable";
import ConfigStatus from "src/components/ConfigStatus";
import DeploymentHeadline from "src/components/DeploymentHeadline";
import useLogin from "src/hooks/useLogin";
import { Commit, CommitComparison, Repository } from "src/octokitHelpers";
import { Config } from "src/utils/config";

import UserAvatar from "./UserAvatar";

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
  const [search, setSearch] = useState<string>("");

  const authorLogins = config.commit.ignore.authors;
  const merges = config.commit.ignore.merges;
  const base_branch = config.commit.base
    ? config.commit.base
    : repo.default_branch;
  const developerCommits = useMemo(
    () =>
      comparison.commits.filter((commit) => {
        // Is a merge (and we don't want merges)
        if (merges && commit.parents.length > 1) {
          return false;
        }

        // Author is in the ignore list
        return !authorLogins.some(
          (ignoredLogin) => ignoredLogin === commit.author?.login,
        );
      }),
    [authorLogins, comparison, merges],
  );
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

  const visibleCommits = useFuzzySearch(
    // If we're expanding ignored commits, use original without filtering
    (expand ? comparison.commits : developerCommits).slice(),
    search,
  );
  // Reverse the commits to get the latest on top
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
      <Box padding={1} display="flex" justifyContent="space-between">
        <Stack spacing={1}>
          <RepoSummary repo={repo} />
          <RepoActions baseSha={comparison.base_commit.sha} />
        </Stack>
        <CommitFiltering setSearch={setSearch} search={search} />
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

const useFuzzySearch = (list: Array<Commit>, search: string) => {
  const fuse = useMemo(() => {
    return new Fuse(list, {
      keys: ["author.login", "commit.author.name", "commit.message"],
      findAllMatches: true,
      // We don't want sorting here as it will mess up the order (since it will
      // order by closest match first)
      shouldSort: false,
      threshold: 0.3,
      distance: 30,
    });
  }, [list]);

  // Only apply fuzzy filtering if we have a search, since Fuse won't return
  // the entire list for `.search("")` which is sad
  return search ? fuse.search(search).map((value) => value.item) : list;
};

const CommitFiltering = ({
  search,
  setSearch,
}: {
  readonly search: string;
  readonly setSearch: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const loginData = useLogin();

  return (
    <TextField
      variant="outlined"
      placeholder="Search commits"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      InputProps={{
        endAdornment: (
          <>
            <IconButton
              onClick={() => setSearch("")}
              size="small"
              sx={{
                visibility: search ? "visible" : "hidden",
              }}>
              <ClearIcon />
            </IconButton>
            {loginData.data ? (
              <IconButton
                onClick={() => setSearch(loginData.data.login)}
                size="small">
                <Tooltip title="Show my commits" arrow>
                  <span>
                    <UserAvatar user={loginData.data} />
                  </span>
                </Tooltip>
              </IconButton>
            ) : null}
          </>
        ),
      }}
    />
  );
};
