import Button from "@mui/material/Button";

import useLoginRedirect from "src/hooks/useLoginRedirect";

export default function LoginButton(): React.ReactElement {
  const loginRedirect = useLoginRedirect();

  return (
    <Button onClick={loginRedirect} variant="contained">
      Login
    </Button>
  );
}
