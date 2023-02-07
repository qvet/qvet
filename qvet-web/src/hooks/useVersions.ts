import { useQuery, UseQueryResult } from "@tanstack/react-query";
import ky from "ky";

// One hour
const VERSION_POLL_MS = 3_600_000;

/**
 * Return the pair of (cached-local, server) versions.
 */
export default function useVersions(): [
  UseQueryResult<string, Error>,
  UseQueryResult<string, Error>
] {
  return [
    useQuery({
      queryKey: ["getVersion"],
      queryFn: () => getVersion(),
      refetchInterval: VERSION_POLL_MS,
    }),
    useQuery({
      queryKey: ["getVersionUncached"],
      queryFn: () => getVersionUncached(),
      refetchInterval: VERSION_POLL_MS,
    }),
  ];
}

async function getVersion(): Promise<string> {
  return ky.get("version").text();
}

async function getVersionUncached(): Promise<string> {
  return ky.get("version-uncached").text();
}
