# Comparison harness

Runs the real comparison view against an in-memory fake of the GitHub API, so
loading behaviour can be seen without logging in or finding a large release.

```sh
npm run harness
```

Open <http://localhost:20557/>. The bar at the top sets the number of commits,
the per-page delay and jitter, a fixed delay for the first page, and a page to fail
with a 500. It logs when each compare page was requested and returned, how many
QA status requests have gone out, and any long main-thread tasks.

Only `useOctokit` and `useOwnerRepo` are replaced (see `vite.config.ts`);
everything else is the code in `src`.
