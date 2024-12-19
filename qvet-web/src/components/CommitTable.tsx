import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

import CommitRow from "src/components/CommitRow";
import { Commit } from "src/octokitHelpers";

import TableHeader from "./TableHeader";

export default function CommitTable({
  commits: rawCommits,
  showHeader,
}: {
  commits: ReadonlyArray<Commit>;
  showHeader: boolean;
}): React.ReactElement {
  // FIXME warn/paginate on large numbers
  const commits = rawCommits.slice(0, 100);

  return (
    <>
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
