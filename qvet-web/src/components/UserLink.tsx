import { Link } from "react-router-dom";
import { User } from "src/octokitHelpers";
import Stack from "@mui/material/Stack";
import UserAvatar from "src/components/UserAvatar";

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
      <UserAvatar user={user} />
      {link}
    </Stack>
  );
}
