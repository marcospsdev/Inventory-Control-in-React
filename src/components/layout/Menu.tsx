import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import CategoryIcon from "@mui/icons-material/Category";
import PersonIcon from "@mui/icons-material/Person";
import InventoryIcon from "@mui/icons-material/Inventory";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import LogoutIcon from "@mui/icons-material/Logout";
import WarehouseIcon from "@mui/icons-material/Warehouse";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { authService } from "../../services/authService";
import { profileOf } from "../../services/userService";
import { initialsOf } from "../../lib/format";

export const DRAWER_WIDTH = 260;

const menuItems = [
  { text: "Vendas", path: "/sales", icon: <MonetizationOnIcon /> },
  { text: "Produtos", path: "/products", icon: <InventoryIcon /> },
  { text: "Categorias", path: "/categories", icon: <CategoryIcon /> },
  { text: "Usuários", path: "/users", icon: <PersonIcon /> },
];

export const Menu = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = authService.getUser();

  const handleLogout = () => {
    authService.signOut();
    navigate("/");
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: DRAWER_WIDTH,
          boxSizing: "border-box",
          borderRight: "1px solid",
          borderColor: "divider",
        },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2.5, py: 2.5 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            bgcolor: "primary.main",
            color: "primary.contrastText",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <WarehouseIcon />
        </Box>
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            Inventory Control
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Controle de estoque
          </Typography>
        </Box>
      </Box>
      <Divider />
      <List sx={{ px: 1.5, py: 2, flex: 1 }}>
        {menuItems.map((item) => {
          const selected = location.pathname.startsWith(item.path);
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={Link}
                to={item.path}
                selected={selected}
                sx={{
                  borderRadius: 2,
                  "&.Mui-selected": { bgcolor: "primary.main", color: "primary.contrastText" },
                  "&.Mui-selected:hover": { bgcolor: "primary.dark" },
                  "&.Mui-selected .MuiListItemIcon-root": { color: "primary.contrastText" },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} slotProps={{ primary: { sx: { fontWeight: 600 } } }} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      <Divider />
      {user && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, p: 2 }}>
          <Avatar sx={{ bgcolor: "primary.light", width: 38, height: 38, fontSize: 15 }}>
            {initialsOf(user.name)}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
              {user.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap component="p">
              {profileOf(user.user_type_id)?.label ?? user.email}
            </Typography>
          </Box>
          <Tooltip title="Sair">
            <IconButton size="small" onClick={handleLogout}>
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Drawer>
  );
};
