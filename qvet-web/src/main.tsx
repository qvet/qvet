import "./index.css";
import CssBaseline from "@mui/material/CssBaseline";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryParamProvider } from "use-query-params";
import { ReactRouter6Adapter } from "use-query-params/adapters/react-router-6";

import Shell from "src/components/Shell";
import Theme from "src/components/Theme";

import { Home, Oauth2Callback } from "./routes";

const queryClient = new QueryClient();

function App() {
  removeUnusedLocalStorageItems();
  const router = (
    <BrowserRouter>
      <QueryParamProvider adapter={ReactRouter6Adapter}>
        <Routes>
          <Route
            path="/"
            element={
              <Shell>
                <Home />
              </Shell>
            }
          />
          <Route path="/oauth2/callback" element={<Oauth2Callback />} />
        </Routes>
      </QueryParamProvider>
    </BrowserRouter>
  );

  return (
    <Theme>
      <CssBaseline>
        <QueryClientProvider client={queryClient}>
          <React.StrictMode>{router}</React.StrictMode>
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
