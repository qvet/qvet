import { Link } from "react-router-dom";
import Comparison from "src/components/Comparison";
import RepoSelect from "src/components/RepoSelect";
import { useRepo } from "src/hooks/useOwnerRepo";
import Paper from "@mui/material/Paper";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";

export default function Installations() {
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
