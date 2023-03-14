import Stack from "@mui/material/Stack";
import { useConfigMeta } from "src/hooks/useConfig";
import Paper from "@mui/material/Paper";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";

export default function ConfigFile() {
  const configMeta = useConfigMeta();

  return (
    <>
      <Paper elevation={3}>
        <Box padding={2} minWidth={500}>
          {configMeta.isError ? (
            <Alert severity="error">Error loading comparison</Alert>
          ) : configMeta.isLoading ? (
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
          ) : configMeta.data.repositoryFileMissing ? (
            <Alert severity="warning">
              <AlertTitle>Config file not found</AlertTitle>
              Does <code>qvet.yml</code> exist in your default branch?
            </Alert>
          ) : configMeta.data.parseResult.errorsText ? (
            <Alert severity="error">
              <AlertTitle>Invalid config file</AlertTitle>
              {configMeta.data.parseResult.errorsText}
            </Alert>
          ) : (
            <Box
              style={{
                display: "block",
                fontFamily: "monospace",
                whiteSpace: "pre",
              }}
            >
              {JSON.stringify(configMeta.data.parseResult.config, undefined, 2)}
            </Box>
          )}
        </Box>
      </Paper>
    </>
  );
}
