import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import ky from "ky";
import FullPageLoading from "src/components/FullPageLoading";

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

export function Oauth2Callback() {
  const navigate = useNavigate();

  const query = new URLSearchParams(window.location.search);
  const code = query.get("code") ?? "";
  const state = query.get("state") ?? "";
  const internal_state = localStorage.getItem("oauth2_internal_state") ?? "";

  const body: Oauth2CallbackRequest = { code, state, internal_state };

  const queryClient = useQueryClient();
  const accessToken = useQuery({
    queryKey: ["oauth2Callback", body],
    queryFn: () => apiCallback(body),
  });

  React.useEffect(() => {
    if (accessToken.isSuccess) {
      queryClient.setQueryData(["getAccessToken"], accessToken.data);
      navigate("/");
    }
  }, [accessToken, queryClient]);

  return <FullPageLoading />;
}
