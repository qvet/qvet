import { settings } from "../settings";

export const OWNER = "acme";
export const REPO = "widgets";
const PROD_SHA = "0".repeat(40);
const HEAD_SHA = "f".repeat(40);
const AUTHORS = ["alice", "bob", "carol", "dave", "erin"];

const sha = (index: number) => index.toString(16).padStart(40, "a");
const avatar = (login: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="#${(
      login.charCodeAt(0) * 99999
    )
      .toString(16)
      .slice(0, 6)}"/></svg>`,
  )}`;

function user(login: string) {
  return {
    login,
    avatar_url: avatar(login),
    html_url: `https://github.com/${login}`,
  };
}

// Oldest first, as GitHub's compare returns them.
function commit(index: number) {
  const login = AUTHORS[index % AUTHORS.length];
  return {
    sha: sha(index),
    html_url: `https://github.com/${OWNER}/${REPO}/commit/${sha(index)}`,
    author: user(login),
    parents: [{ sha: index ? sha(index - 1) : PROD_SHA }],
    commit: {
      message: `Commit #${index + 1} of ${settings.total} by ${login}`,
      author: { name: login },
    },
  };
}

// Every third commit has passed QA, so the table shows a mix. Only the tail of
// the sha is parsed, as the whole of it overflows a double.
const hasPassedQa = (sha: string) => parseInt(sha.slice(-6), 16) % 3 === 0;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
export const requestLog: Array<string> = [];
export const statusRequestTimes: Array<number> = [];

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function fakeFetch(input: RequestInfo | URL): Promise<Response> {
  const url = new URL(typeof input === "string" ? input : input.toString());
  const path = url.pathname;

  if (path.includes("/compare/")) {
    const page = Number(url.searchParams.get("page") ?? "1");
    const perPage = Number(url.searchParams.get("per_page") ?? "250");
    const started = performance.now();
    await sleep(
      page === 1 && settings.firstPageMs !== null
        ? settings.firstPageMs
        : settings.delayMs + Math.random() * settings.jitterMs,
    );
    requestLog.push(
      `compare page ${page}: ${Math.round(started)}ms → ${Math.round(
        performance.now(),
      )}ms`,
    );
    window.dispatchEvent(new Event("harness-log"));
    if (page === settings.failPage) {
      return json(500, {
        message: `Harness injected a failure on page ${page}; set "fail page" to 0 to turn it off`,
      });
    }
    const from = (page - 1) * perPage;
    const to = Math.min(from + perPage, settings.total);
    return json(200, {
      html_url: `https://github.com/${OWNER}/${REPO}/compare/prod...main`,
      base_commit: { sha: PROD_SHA },
      total_commits: settings.total,
      commits: Array.from({ length: Math.max(0, to - from) }, (_, i) =>
        commit(from + i),
      ),
      files: [],
    });
  }
  if (path.endsWith("/statuses")) {
    statusRequestTimes.push(performance.now());
    await sleep(200 + Math.random() * 400);
    window.dispatchEvent(new Event("harness-log"));
    const ref = path.split("/commits/")[1]?.split("/")[0] ?? "";
    return json(
      200,
      hasPassedQa(ref)
        ? [
            {
              context: "qvet/qa",
              state: "success",
              creator: user("qa-bot"),
              created_at: new Date().toISOString(),
              description: null,
            },
          ]
        : [],
    );
  }
  if (path.endsWith("/check-runs")) {
    return json(200, { total_count: 0, check_runs: [] });
  }
  if (path.includes("/contents/")) {
    return json(404, { message: "Not Found" });
  }
  if (path.includes("/branches/")) {
    return json(200, { commit: { sha: HEAD_SHA } });
  }
  if (path.endsWith("/tags")) {
    return json(200, [{ name: "v1.0.0", commit: { sha: PROD_SHA } }]);
  }
  if (path === "/user") {
    return json(200, user("alice"));
  }
  return json(200, []);
}
