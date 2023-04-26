import * as React from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";

export const ColorModeContext = React.createContext({
  toggleColorMode: () => {},
});

type ThemeMode = "light" | "dark";

const systemIsDarkTheme = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;

export default function Theme({ children }: { children: React.ReactNode }) {
  const storedMode = (localStorage.getItem("theme_mode") ??
    systemIsDarkTheme ?  "dark" : "light") as ThemeMode;
  const [mode, setMode] = React.useState<ThemeMode>(storedMode);
  const colorMode = React.useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode: ThemeMode) => {
          const newMode = prevMode === "light" ? "dark" : "light";
          localStorage.setItem("theme_mode", newMode);
          return newMode;
        });
      },
    }),
    []
  );

  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode,
        },
      }),
    [mode]
  );

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ColorModeContext.Provider>
  );
}
