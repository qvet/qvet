import Stack from "@mui/material/Stack";
import { Link } from "react-router-dom";

import UserAvatar from "src/components/UserAvatar";
import { User } from "src/octokitHelpers";

interface UserLinkProps {
  user: User;
  inline?: boolean;
}

export default function UserLink({
  user,
  inline,
}: UserLinkProps): React.ReactElement {
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
