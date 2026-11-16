import { Octokit } from "octokit";

import { fakeFetch } from "./fakeGithub";

const octokit = new Octokit({ request: { fetch: fakeFetch } });

export default function useOctokit(): Octokit | null {
  return octokit;
}
