import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";

import AccountMenu from "src/components/AccountMenu";

export default function TopBar(): React.ReactElement {
  return (
    <Grid container padding={2} spacing={2}>
      <Grid item xs={3} />
      <Grid item xs={6} textAlign="center">
        <Box>
          <Typography variant="h2">qvet</Typography>
        </Box>
      </Grid>
      <Grid item xs={3} textAlign="right" alignSelf="center">
        <Box>
          <AccountMenu />
        </Box>
      </Grid>
    </Grid>
  );
}
