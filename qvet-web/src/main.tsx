import "./index.css";
import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import ReactDOM from "react-dom/client";
import { Home, Oauth2Callback } from "./routes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import CssBaseline from "@mui/material/CssBaseline";
import Theme from "src/components/Theme";
import Shell from "src/components/Shell";

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

  const queryClient = new QueryClient();
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
