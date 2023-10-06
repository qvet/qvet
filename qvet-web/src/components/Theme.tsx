import {
  Theme as MuiTheme,
  ThemeProvider,
  createTheme,
  CSSObject,
  Palette,
  PaletteColor,
} from "@mui/material/styles";
import * as React from "react";

export const ColorModeContext = React.createContext({
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  toggleColorMode: () => {},
});

type ThemeMode = "light" | "dark";

const systemIsDarkTheme =
  window.matchMedia &&
  window.matchMedia("(prefers-color-scheme: dark)").matches;

export default function Theme({
  children,
}: {
  children: React.ReactElement;
}): React.ReactElement {
  const storedMode = (
    localStorage.getItem("theme_mode") ?? systemIsDarkTheme ? "dark" : "light"
  ) as ThemeMode;
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
    [],
  );

  const baseTheme = React.useMemo(() => createTheme(), []);
  const gradientButtonOverrides = makeGradientButtonOverrides(baseTheme);
  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          mode,
        },
        components: {
          MuiButton: {
            styleOverrides: {
              ...gradientButtonOverrides,
            },
          },
        },
      }),
    [mode, gradientButtonOverrides],
  );

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ColorModeContext.Provider>
  );
}

function assertPaletteColor(
  paletteColor: any,
): asserts paletteColor is PaletteColor {
  if (paletteColor.main === undefined) {
    throw new Error("assertPaletteColor");
  }
}

interface StyleOverrides {
  [key: string]: CSSObject;
}
function makeGradientButtonOverrides(theme: MuiTheme): object {
  const styleOverrides: StyleOverrides = {};
  const variants: Array<keyof Palette> = [
    "primary",
    "secondary",
    "success",
    "info",
    "error",
    "warning",
  ];
  variants.forEach((variant: keyof Palette) => {
    const paletteColor = theme.palette[variant];
    assertPaletteColor(paletteColor);
    const key = "contained" + capitalizeFirstLetter(variant);
    styleOverrides[key] = {
      background: `linear-gradient(45deg, ${paletteColor.dark} 10%, ${paletteColor.main} 30%, ${paletteColor.light} 90%)`,
    };
  });
  return styleOverrides;
}

function capitalizeFirstLetter(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
