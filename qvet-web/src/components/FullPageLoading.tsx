import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";

export default function FullPageLoading(): React.ReactElement {
  return (
    <Box sx={{ width: "100%" }}>
      <LinearProgress />
    </Box>
  );
}
