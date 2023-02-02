import Button from "@mui/material/Button";
import { useCallback } from "react";
import ky from "ky";

interface Oauth2InitiateRequest {
  redirect_origin: string;
}

interface Oauth2InitiateResponse {
  redirect_url: string;
  internal_state: string;
}

export default function LoginButton({ loggedIn }: { loggedIn: boolean }) {
  const loginRedirect = useCallback(async () => {
    const body: Oauth2InitiateRequest = {
      redirect_origin: window.location.origin,
    };
    const response: Oauth2InitiateResponse = await ky
      .post("/api/oauth2/initiate", { json: body })
      .json();
    localStorage.setItem("oauth2_internal_state", response.internal_state);
    window.location.href = response.redirect_url;
  }, []);

  return loggedIn ? (
    <Button onClick={loginRedirect} variant="outlined">
      {" "}
      Refresh Login
    </Button>
  ) : (
    <Button onClick={loginRedirect} variant="contained">
      Login
    </Button>
  );
}
