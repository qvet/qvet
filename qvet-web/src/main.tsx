import "./index.css";
import React from "react";
import Container from "@mui/material/Container";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import ReactDOM from "react-dom/client";
import { Home, Oauth2Callback } from "./routes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import CssBaseline from "@mui/material/CssBaseline";

const darkTheme = createTheme({
  palette: {
    mode: "light",
  },
});

function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Home />,
    },
    {
      path: "/oauth2/callback",
      element: <Oauth2Callback />,
    },
  ]);

  const queryClient = new QueryClient();
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline>
        <Container maxWidth="lg">
          <QueryClientProvider client={queryClient}>
            <React.StrictMode>
              <RouterProvider router={router} />
            </React.StrictMode>
          </QueryClientProvider>
        </Container>
      </CssBaseline>
    </ThemeProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
