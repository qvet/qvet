import ky from "ky";
import { useQuery } from "@tanstack/react-query";

// 30 minutes
const ACCESS_TOKEN_POLL_INTERVAL_MS = 30 * 60 * 1000;

export default function useAccessToken() {
  return useQuery({
    queryKey: ["getAccessToken"],
    queryFn: () => getAccessToken(),
    retry: 1,
    retryDelay: 0,
    refetchInterval: ACCESS_TOKEN_POLL_INTERVAL_MS,
    staleTime: ACCESS_TOKEN_POLL_INTERVAL_MS,
  });
}

interface AccessTokenResponse {
  access_token: string;
}

async function getAccessToken(): Promise<string> {
  const response: AccessTokenResponse = await ky
    .post("/api/oauth2/access-token")
    .json();
  return response.access_token;
}
