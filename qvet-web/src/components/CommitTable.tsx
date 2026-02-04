import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";

import CommitRow from "src/components/CommitRow";
import { Commit } from "src/octokitHelpers";

import TableHeader from "./TableHeader";

const MAX_COMMITS_IN_TABLE = 200;

export default function CommitTable({
  commits: rawCommits,
  showHeader,
}: {
  commits: ReadonlyArray<Commit>;
  showHeader: boolean;
}): React.ReactElement {
  // FIXME: paginate on large numbers
  const commits = rawCommits.slice(0, MAX_COMMITS_IN_TABLE);
  const showTooManyCommitsError = commits.length !== rawCommits.length;

  return (
    <>
      {showTooManyCommitsError && (
        <Alert severity="error">
          <AlertTitle>Too many commits</AlertTitle>
          <Typography>
            There were too many commits in this batch to show.
          </Typography>
          <Typography>
            Some commits are missing. Please raise qvet's limit, or implement
            pagination.
          </Typography>
        </Alert>
      )}
      {showHeader && <TableHeader title="Commits" />}
      <Table sx={{ minWidth: 650 }} size="small">
        <TableHead>
          <TableRow>
            <TableCell>Message</TableCell>
            <TableCell>Author</TableCell>
            <TableCell>Hash</TableCell>
            <TableCell>Manual QA</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {commits.map((commit) => (
            <CommitRow key={commit.sha} commit={commit} />
          ))}
        </TableBody>
      </Table>
    </>
  );
}
