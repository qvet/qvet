import { useCallback } from "react";
import ky from "ky";
import { LOCAL_STORAGE_KEYS } from "src/constants";

interface Oauth2InitiateRequest {
  redirect_origin: string;
}

interface Oauth2InitiateResponse {
  redirect_url: string;
  internal_state: string;
}
export default function useLoginRedirect() {
  return useCallback(async () => {
    const body: Oauth2InitiateRequest = {
      redirect_origin: window.location.origin,
    };
    const response: Oauth2InitiateResponse = await ky
      .post("/api/oauth2/initiate", { json: body })
      .json();
    localStorage.setItem(
      LOCAL_STORAGE_KEYS.oauthFlowInternalState,
      response.internal_state
    );
    window.location.href = response.redirect_url;
  }, []);
}
