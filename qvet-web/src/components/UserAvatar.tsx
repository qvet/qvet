import Avatar from "@mui/material/Avatar";

import { User } from "src/octokitHelpers";

interface UserAvatarProps {
  user: User;
}

export default function UserAvatar({
  user,
}: UserAvatarProps): React.ReactElement {
  return <Avatar alt={user.login} src={user.avatar_url} />;
}
