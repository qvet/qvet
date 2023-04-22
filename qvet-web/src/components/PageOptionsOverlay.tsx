import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import ThemeModeToggle from "src/components/ThemeModeToggle";

export default function PageOptionsOverlay({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Box sx={{ position: "absolute", top: 8, right: 8 }}>
        <ThemeModeToggle />
      </Box>
      <Container maxWidth="lg">{children}</Container>
    </>
  );
}
