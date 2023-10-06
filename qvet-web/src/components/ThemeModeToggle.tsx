import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import Switch from "@mui/material/Switch";
import { useTheme } from "@mui/material/styles";
import * as React from "react";

import { ColorModeContext } from "src/components/Theme";

export default function ThemeModeToggle(): React.ReactElement {
  const theme = useTheme();
  const colorMode = React.useContext(ColorModeContext);
  return (
    <FormGroup>
      <FormControlLabel
        control={
          <Switch
            checked={theme.palette.mode === "dark"}
            onClick={colorMode.toggleColorMode}
          />
        }
        label="Dark mode"
      />
    </FormGroup>
  );
}
