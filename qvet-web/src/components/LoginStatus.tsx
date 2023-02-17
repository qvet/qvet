import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import Skeleton from "@mui/material/Skeleton";
import UserLink from "src/components/UserLink";
import useLogin from "src/hooks/useLogin";

export default function LoginStatus() {
  let login = useLogin();
  return login.isLoading ? (
    <Skeleton variant="rounded" width={350} height={40} />
  ) : login.isError ? (
    <Alert severity="error">"error loading login"</Alert>
  ) : (
    <Stack direction="row" spacing={1} alignItems="center">
      <span>Logged in as</span>
      <UserLink user={login.data} />
    </Stack>
  );
}
