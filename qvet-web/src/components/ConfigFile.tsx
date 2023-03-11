import Stack from "@mui/material/Stack";
import useConfigFile from "src/hooks/useConfigFile";
import Paper from "@mui/material/Paper";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";

export default function ConfigFile() {
  const configFile = useConfigFile();

  return (
    <>
      <Paper elevation={3}>
        <Box padding={2} minWidth={500}>
          {configFile.isError ? (
            configFile.error.response.status === 404 ? (
              <Alert severity="warning">
                <AlertTitle>Config file not found</AlertTitle>
                Does <code>qvet.yml</code> exit in your default branch?
              </Alert>
            ) : (
              <Alert severity="error">Error loading comparison</Alert>
            )
          ) : configFile.isLoading ? (
            <Stack spacing={1}>
              {Array.from(Array(21)).map((_value, index) => (
                <Skeleton
                  key={index}
                  variant="rounded"
                  width={30 + ((Math.pow(9, index) + 10 * index) % 400)}
                  height={12}
                />
              ))}
            </Stack>
          ) : (
            <Box
              style={{
                display: "block",
                fontFamily: "monospace",
                whiteSpace: "pre",
              }}
            >
              {configFile.data.trim()}
            </Box>
          )}
        </Box>
      </Paper>
    </>
  );
}
