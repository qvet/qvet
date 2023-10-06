import { useQuery, useQueryClient } from "@tanstack/react-query";
import ky from "ky";
import * as React from "react";
import { useNavigate } from "react-router-dom";

import FullPageLoading from "src/components/FullPageLoading";
import { LOCAL_STORAGE_KEYS } from "src/constants";

interface Oauth2CallbackRequest {
  code: string;
  state: string;
  internal_state: string;
}

interface Oauth2CallbackResponse {
  access_token: string;
}

async function apiCallback(body: Oauth2CallbackRequest): Promise<string> {
  const response: Oauth2CallbackResponse = await ky
    .post("/api/oauth2/callback", {
      json: body,
    })
    .json();
  return response.access_token;
}

export function Oauth2Callback(): React.ReactElement {
  const navigate = useNavigate();

  const query = new URLSearchParams(window.location.search);
  const code = query.get("code") ?? "";
  const state = query.get("state") ?? "";
  const internal_state =
    localStorage.getItem(LOCAL_STORAGE_KEYS.oauthFlowInternalState) ?? "";

  const body: Oauth2CallbackRequest = { code, state, internal_state };

  const queryClient = useQueryClient();
  const accessToken = useQuery({
    queryKey: ["oauth2Callback", body],
    queryFn: () => apiCallback(body),
  });

  React.useEffect(() => {
    if (accessToken.isSuccess) {
      queryClient.setQueryData(["getAccessToken"], accessToken.data);
      localStorage.removeItem(LOCAL_STORAGE_KEYS.oauthFlowInternalState);
      navigate("/");
    }
  }, [accessToken, queryClient, navigate]);

  return <FullPageLoading />;
}
