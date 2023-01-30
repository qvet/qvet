import { Link } from "react-router-dom";
import { User } from "src/octokitHelpers";
import Avatar from "@mui/material/Avatar";
import Stack from "@mui/material/Stack";

export default function UserLink({ user }: { user: User }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Avatar alt={user.login} src={user.avatar_url} />
      <Link to={user.html_url}>{user.login}</Link>
    </Stack>
  );
}
