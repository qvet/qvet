import { User } from "src/octokitHelpers";
import Avatar from "@mui/material/Avatar";

interface UserAvatarProps {
  user: User;
}

export default function UserAvatar({ user }: UserAvatarProps) {
  return <Avatar alt={user.login} src={user.avatar_url} />;
}
