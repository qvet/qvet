import * as React from "react";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import PersonAdd from "@mui/icons-material/PersonAdd";
import Settings from "@mui/icons-material/Settings";
import Logout from "@mui/icons-material/Logout";
import ThemeModeToggle from "src/components/ThemeModeToggle";
import UserAvatar from "src/components/UserAvatar";
import UserLink from "src/components/UserLink";
import { User } from "src/octokitHelpers";
import useLogin from "src/hooks/useLogin";
import useLogout from "src/hooks/useLogout";

export default function AccountMenu() {
  let login = useLogin();

  const userAvatar = login.isLoading ? (
    <Skeleton animation="wave" variant="circular" width={40} height={40} />
  ) : login.isError ? (
    <Skeleton variant="circular" width={40} height={40} />
  ) : (
    <UserAvatar user={login.data} />
  );
  const userLink = login.isLoading ? (
    <Skeleton animation="wave" variant="rounded" width={100} height={20} />
  ) : login.isError ? (
    <Typography variant="body1">Error logging in</Typography>
  ) : (
    <Typography variant="body1">
      Logged in as <UserLink user={login.data} inline />
    </Typography>
  );

  const [logout, setLogout] = useLogout();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    setLogout();
  };

  return (
    <>
      <IconButton
        onClick={handleClick}
        size="small"
        sx={{ ml: 2 }}
        aria-controls={open ? "account-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}>
        {userAvatar}
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={handleClose}
        PaperProps={{
          elevation: 3,
          sx: {
            overflow: "visible",
            filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
            mt: 1.5,
            "& .MuiAvatar-root": {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
            "&:before": {
              content: '""',
              display: "block",
              position: "absolute",
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              transform: "translateY(-50%) rotate(45deg)",
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}>
        <MenuItem>{userLink}</MenuItem>
        <Divider />
        <MenuItem>
          <ThemeModeToggle />
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </>
  );
}
