import "./index.css";
import CssBaseline from "@mui/material/CssBaseline";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import Shell from "src/components/Shell";
import Theme from "src/components/Theme";

import { Home, Oauth2Callback } from "./routes";

const queryClient = new QueryClient();

function App() {
  removeUnusedLocalStorageItems();
  const router = createBrowserRouter([
    {
      path: "/",
      element: (
        <Shell>
          <Home />
        </Shell>
      ),
    },
    {
      path: "/oauth2/callback",
      element: <Oauth2Callback />,
    },
  ]);

  return (
    <Theme>
      <CssBaseline>
        <QueryClientProvider client={queryClient}>
          <React.StrictMode>
            <RouterProvider router={router} />
          </React.StrictMode>
        </QueryClientProvider>
      </CssBaseline>
    </Theme>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);

function removeUnusedLocalStorageItems() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("oauth2_internal_state");
}
