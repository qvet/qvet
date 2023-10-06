import Box from "@mui/material/Box";
import Container from "@mui/material/Container";

import TopBar from "src/components/TopBar";

export default function Shell({
  children,
}: {
  children: React.ReactElement;
}): React.ReactElement {
  return (
    <>
      <TopBar />
      <Box
        height={3}
        width="100%"
        sx={{
          background: `linear-gradient(45deg, darkgreen 10%, green 30%, lightgreen 90%)`,
        }}
      />
      <Container maxWidth="lg">{children}</Container>
    </>
  );
}
