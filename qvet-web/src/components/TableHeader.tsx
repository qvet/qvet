import { Box, Typography } from "@mui/material";

export default function TableHeader({
  title,
}: {
  title: string;
}): React.ReactElement {
  return (
    <Box
      sx={{
        padding: "10px",
        borderBottom: (theme) =>
          `1px solid ${theme.palette.getContrastText(
            theme.palette.background.paper,
          )}`,
      }}>
      <Typography variant="body1">{title}</Typography>
    </Box>
  );
}
