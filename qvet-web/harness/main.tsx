import CssBaseline from "@mui/material/CssBaseline";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryParamProvider } from "use-query-params";
import { ReactRouter6Adapter } from "use-query-params/adapters/react-router-6";

import Comparison from "src/components/Comparison";
import Theme from "src/components/Theme";

import { requestLog, statusRequestTimes } from "./mocks/fakeGithub";
import { repository } from "./mocks/useOwnerRepo";
import { settings } from "./settings";

const queryClient = new QueryClient();
const t0 = performance.now();
const longTasks: Array<string> = [];
// Main-thread stalls are the cost of re-rendering as each page lands.
new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    longTasks.push(
      `${Math.round(entry.startTime)}ms +${Math.round(entry.duration)}ms`,
    );
  }
}).observe({ type: "longtask", buffered: true });

function Controls() {
  const [, rerender] = useState(0);
  useEffect(() => {
    const onLog = () => rerender((n) => n + 1);
    window.addEventListener("harness-log", onLog);
    return () => window.removeEventListener("harness-log", onLog);
  }, []);
  const field = (name: string, label: string, value: number) => (
    <label style={{ marginRight: 12 }}>
      {label} <input name={name} defaultValue={value} size={6} />
    </label>
  );
  return (
    <div
      style={{
        font: "13px monospace",
        color: "#ccc",
        padding: 12,
        borderBottom: "1px solid #8884",
      }}>
      <form>
        {field("total", "commits", settings.total)}
        {field("delay", "page delay ms", settings.delayMs)}
        {field("jitter", "jitter ms", settings.jitterMs)}
        <label style={{ marginRight: 12 }}>
          first page ms{" "}
          <input
            name="first"
            defaultValue={settings.firstPageMs ?? ""}
            size={6}
          />
        </label>
        {field("fail", "fail page (0=off)", settings.failPage)}
        <button type="submit">Reload</button>
      </form>
      <div style={{ marginTop: 8 }}>
        page load at {Math.round(t0)}ms · {requestLog.length} compare responses:
        {requestLog.map((line) => (
          <div key={line}>{line}</div>
        ))}
      </div>
      <div style={{ marginTop: 8 }}>
        QA status requests: {statusRequestTimes.length}
        {statusRequestTimes.length > 0 &&
          `, first sent at ${Math.round(statusRequestTimes[0])}ms`}
      </div>
      <div style={{ marginTop: 8 }}>
        long tasks (&gt;50ms): {longTasks.join(", ") || "none"}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <Theme>
    <CssBaseline>
      <QueryClientProvider client={queryClient}>
        <React.StrictMode>
          <BrowserRouter>
            <QueryParamProvider adapter={ReactRouter6Adapter}>
              <Controls />
              <div style={{ padding: 16 }}>
                <Comparison repo={repository} />
              </div>
            </QueryParamProvider>
          </BrowserRouter>
        </React.StrictMode>
      </QueryClientProvider>
    </CssBaseline>
  </Theme>,
);
