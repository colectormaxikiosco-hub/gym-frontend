"use client"

import { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Button,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material"
import {
  FitnessCenter,
  Person,
  Logout,
  Settings,
  Home,
  People,
  CardMembership,
  PointOfSale,
  PersonOutlined,
  Menu as MenuIcon,
  Close,
  Inventory2,
  ShoppingCart,
  Assessment,
} from "@mui/icons-material"

const DRAWER_WIDTH = 280

const Navbar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [anchorEl, setAnchorEl] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const open = Boolean(anchorEl)

  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleCloseMenu = () => {
    setAnchorEl(null)
  }

  const handleLogout = () => {
    handleCloseMenu()
    setDrawerOpen(false)
    logout()
    navigate("/login")
  }

  const handleNavigation = (path) => {
    setDrawerOpen(false)
    navigate(path)
  }

  const handleProfileClick = () => {
    handleCloseMenu()
    setDrawerOpen(false)
    if (user?.role === "client") {
      navigate("/client-profile")
    } else {
      navigate("/configuration")
    }
  }

  const isActive = (path) => location.pathname === path
  const isReportesActive = () =>
    location.pathname === "/reportes" ||
    location.pathname.startsWith("/memberships/reportes") ||
    location.pathname.startsWith("/ventas/reportes")

  const getNavLinks = () => {
    if (user?.role === "admin") {
      return [
        { label: "Inicio", path: "/dashboard", icon: Home },
        { label: "Clientes", path: "/clients", icon: People },
        { label: "Membresías", path: "/memberships", icon: CardMembership },
        { label: "Productos", path: "/products", icon: Inventory2 },
        { label: "Ventas", path: "/ventas", icon: ShoppingCart },
        { label: "Caja", path: "/caja", icon: PointOfSale },
        { label: "Reportes", path: "/reportes", icon: Assessment },
        { label: "Configuración", path: "/configuration", icon: Settings },
      ]
    } else if (user?.role === "empleado") {
      return [
        { label: "Inicio", path: "/dashboard", icon: Home },
        { label: "Clientes", path: "/clients", icon: People },
        { label: "Membresías", path: "/memberships", icon: CardMembership },
        { label: "Ventas", path: "/ventas", icon: ShoppingCart },
        { label: "Caja", path: "/caja", icon: PointOfSale },
        { label: "Reportes", path: "/reportes", icon: Assessment },
      ]
    } else if (user?.role === "client") {
      return [
        { label: "Inicio", path: "/client-portal", icon: Home },
        { label: "Mi Perfil", path: "/client-profile", icon: PersonOutlined },
      ]
    }
    return []
  }

  const navLinks = getNavLinks()

  const getRoleText = () => {
    if (user?.role === "admin") return "Administrador"
    if (user?.role === "empleado") return "Empleado"
    if (user?.role === "client") return "Cliente"
    return user?.role
  }

  const navButtonSx = (path) => {
    const active = path === "/reportes" ? isReportesActive() : isActive(path)
    return {
      textTransform: "none",
      fontSize: "0.9rem",
      fontWeight: 600,
      color: active ? "#f59e0b" : "#6b7280",
      backgroundColor: active ? "#fffbeb" : "transparent",
      borderRadius: "12px",
      px: { xs: 2, sm: 2.5 },
      py: 1.2,
      "&:hover": {
        backgroundColor: "#fffbeb",
        color: "#f59e0b",
      },
      transition: "all 0.2s ease",
      fontFamily: "'Inter', sans-serif",
    }
  }

  const drawerContent = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", bgcolor: "#fafaf9" }}>
      {/* Cabecera del drawer */}
      <Box
        sx={{
          p: 2,
          borderBottom: "1px solid #f3f4f6",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "12px",
              bgcolor: "#fffbeb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FitnessCenter sx={{ fontSize: 22, color: "#d97706" }} />
          </Box>
          <Typography sx={{ fontWeight: 700, color: "#111827", fontSize: "1rem" }}>Life Fitness</Typography>
        </Box>
        <IconButton
          onClick={() => setDrawerOpen(false)}
          sx={{ color: "#6b7280", "&:hover": { bgcolor: "#f5f5f4" } }}
          aria-label="Cerrar menú"
        >
          <Close />
        </IconButton>
      </Box>

      {/* Lista de navegación */}
      <List sx={{ px: 1.5, py: 2, flex: 1 }}>
        {navLinks.map((link) => {
          const IconComponent = link.icon
          const active = link.path === "/reportes" ? isReportesActive() : isActive(link.path)
          return (
            <ListItemButton
              key={link.path}
              onClick={() => handleNavigation(link.path)}
              sx={{
                borderRadius: "12px",
                mb: 0.75,
                py: 1.5,
                px: 2,
                bgcolor: active ? "#fffbeb" : "transparent",
                color: active ? "#d97706" : "#374151",
                "&:hover": {
                  bgcolor: active ? "#fef3c7" : "#f5f5f4",
                  color: "#d97706",
                },
                "& .MuiListItemIcon-root": { minWidth: 40, color: "inherit" },
              }}
            >
              <ListItemIcon>
                <IconComponent sx={{ fontSize: 22 }} />
              </ListItemIcon>
              <ListItemText
                primary={link.label}
                primaryTypographyProps={{ fontWeight: 600, fontSize: "0.9375rem" }}
              />
            </ListItemButton>
          )
        })}
      </List>

      {/* Usuario y acciones */}
      <Box sx={{ borderTop: "1px solid #f3f4f6", p: 2 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: "#111827" }}>
            {user?.name}
          </Typography>
          <Typography variant="caption" sx={{ color: "#6b7280" }}>
            {getRoleText()}
          </Typography>
        </Box>
        <ListItemButton
          onClick={handleProfileClick}
          sx={{
            borderRadius: "12px",
            py: 1.25,
            px: 2,
            mb: 0.75,
            "&:hover": { bgcolor: "#fffbeb" },
            "& .MuiListItemIcon-root": { minWidth: 40 },
          }}
        >
          <ListItemIcon>
            <Person sx={{ fontSize: 20, color: "#d97706" }} />
          </ListItemIcon>
          <ListItemText primary="Mi Perfil" primaryTypographyProps={{ fontWeight: 500, fontSize: "0.875rem" }} />
        </ListItemButton>
        <ListItemButton
          onClick={handleLogout}
          sx={{
            borderRadius: "12px",
            py: 1.25,
            px: 2,
            "&:hover": { bgcolor: "#fee2e2" },
            "& .MuiListItemIcon-root": { minWidth: 40 },
          }}
        >
          <ListItemIcon>
            <Logout sx={{ fontSize: 20, color: "#dc2626" }} />
          </ListItemIcon>
          <ListItemText
            primary="Cerrar sesión"
            primaryTypographyProps={{ fontWeight: 600, fontSize: "0.875rem", color: "#dc2626" }}
          />
        </ListItemButton>
      </Box>
    </Box>
  )

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backgroundColor: "white",
          borderBottom: "1px solid #f3f4f6",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
        }}
      >
        <Toolbar
          sx={{
            py: { xs: 1.5, sm: 2 },
            px: { xs: 2, sm: 2.5, md: 3, lg: 4 },
            minHeight: { xs: 56, sm: 64 },
            display: "flex",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          {/* Izquierda: ícono y título Life Fitness */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: { xs: 1.5, sm: 2 },
              flexShrink: 0,
              cursor: "pointer",
              minWidth: 0,
            }}
            onClick={() => handleNavigation(user?.role === "client" ? "/client-portal" : "/dashboard")}
          >
            <Box
              sx={{
                width: { xs: 40, sm: 44 },
                height: { xs: 40, sm: 44 },
                borderRadius: "12px",
                background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: "0 2px 8px rgba(245, 158, 11, 0.25)",
                "&:hover": { transform: "scale(1.02)" },
                transition: "transform 0.2s ease",
              }}
            >
              <FitnessCenter sx={{ fontSize: { xs: 22, sm: 24 }, color: "white" }} />
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                fontSize: { xs: "1.0625rem", sm: "1.25rem" },
                background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: "-0.02em",
                display: { xs: "none", sm: "block" },
              }}
            >
              Life Fitness
            </Typography>
          </Box>

          {/* Centro: links de navegación (solo en lg) */}
          {navLinks.length > 0 && (
            <Box
              sx={{
                flex: 1,
                display: { xs: "none", lg: "flex" },
                justifyContent: "center",
                gap: 0.5,
                mx: 2,
              }}
            >
              {navLinks.map((link) => {
                const IconComponent = link.icon
                return (
                  <Button
                    key={link.path}
                    onClick={() => handleNavigation(link.path)}
                    startIcon={<IconComponent sx={{ fontSize: 18 }} />}
                    sx={navButtonSx(link.path)}
                  >
                    {link.label}
                  </Button>
                )
              })}
            </Box>
          )}

          {navLinks.length === 0 && <Box sx={{ flex: 1 }} />}

          {/* Derecha: icono de usuario (nombre y rol se ven en el menú al hacer clic) y hamburguesa */}
          <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.5, sm: 1 }, minWidth: 0 }}>
            <IconButton
              onClick={handleOpenMenu}
              sx={{
                p: 0,
                "&:hover": { transform: "scale(1.05)", transition: "transform 0.2s ease" },
              }}
              aria-label="Menú de usuario"
            >
              <Avatar
                sx={{
                  width: { xs: 36, sm: 40 },
                  height: { xs: 36, sm: 40 },
                  background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                  fontSize: "1rem",
                  fontWeight: 700,
                  boxShadow: "0 2px 8px rgba(245, 158, 11, 0.25)",
                  border: "2px solid white",
                }}
              >
                {user?.name?.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
            {navLinks.length > 0 && (
              <IconButton
                onClick={() => setDrawerOpen(true)}
                sx={{
                  color: "#6b7280",
                  "&:hover": { bgcolor: "#f5f5f4", color: "#d97706" },
                  display: { xs: "inline-flex", lg: "none" },
                }}
                aria-label="Abrir menú"
              >
                <MenuIcon />
              </IconButton>
            )}
            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={handleCloseMenu}
              onClick={handleCloseMenu}
              transformOrigin={{ horizontal: "right", vertical: "top" }}
              anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
              PaperProps={{
                elevation: 0,
                sx: {
                  mt: 1.5,
                  minWidth: 240,
                  borderRadius: 2,
                  overflow: "visible",
                  boxShadow: "0 0 0 1px rgba(0,0,0,0.05), 0 20px 40px -10px rgba(0,0,0,0.12)",
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    top: 0,
                    right: 20,
                    width: 12,
                    height: 12,
                    bgcolor: "background.paper",
                    transform: "translateY(-50%) rotate(45deg)",
                    zIndex: 0,
                  },
                },
              }}
            >
              <Box sx={{ px: 2.5, py: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: "#111827" }}>
                  {user?.name}
                </Typography>
                <Typography variant="caption" sx={{ color: "#6b7280" }}>
                  {getRoleText()}
                </Typography>
              </Box>
              <Divider sx={{ mx: 1.5 }} />
              <MenuItem
                onClick={handleProfileClick}
                sx={{
                  py: 1.5,
                  px: 2.5,
                  mx: 1,
                  my: 0.5,
                  borderRadius: "10px",
                  "&:hover": { backgroundColor: "#fffbeb" },
                }}
              >
                <Person sx={{ fontSize: 20, mr: 2, color: "#d97706" }} />
                <Typography variant="body2" sx={{ fontWeight: 500, color: "#374151" }}>
                  Mi Perfil
                </Typography>
              </MenuItem>
              <Divider sx={{ mx: 1.5 }} />
              <MenuItem
                onClick={handleLogout}
                sx={{
                  py: 1.5,
                  px: 2.5,
                  mx: 1,
                  my: 0.5,
                  borderRadius: "10px",
                  "&:hover": { backgroundColor: "#fee2e2" },
                }}
              >
                <Logout sx={{ fontSize: 20, mr: 2, color: "#dc2626" }} />
                <Typography variant="body2" sx={{ fontWeight: 600, color: "#dc2626" }}>
                  Cerrar Sesión
                </Typography>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Drawer móvil/tablet */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        variant="temporary"
        sx={{
          display: { xs: "block", lg: "none" },
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            maxWidth: "85vw",
            border: "none",
            boxShadow: "4px 0 24px rgba(0,0,0,0.08)",
            boxSizing: "border-box",
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  )
}

export default Navbar
