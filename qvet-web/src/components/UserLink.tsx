import { Link } from "react-router-dom";
import { User } from "src/octokitHelpers";
import Avatar from "@mui/material/Avatar";
import Stack from "@mui/material/Stack";

interface UserLinkProps {
  user: User;
  inline?: boolean;
}

export default function UserLink({ user, inline }: UserLinkProps) {
  const link = (
    <Link target="_blank" to={user.html_url}>
      {user.login}
    </Link>
  );
  if (inline) {
    return link;
  }
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Avatar alt={user.login} src={user.avatar_url} />
      {link}
    </Stack>
  );
}
