import Button from "@mui/material/Button";
import useLoginRedirect from "src/hooks/useLoginRedirect";

export default function LoginButton({ loggedIn }: { loggedIn: boolean }) {
  const loginRedirect = useLoginRedirect();

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
