"use client"

import { useState, useEffect } from "react"
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogContent,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  InputAdornment,
} from "@mui/material"
import { Add, Edit, Delete, Person, Lock, Email, Badge, Close, Refresh } from "@mui/icons-material"
import userService from "../../services/userService"
import { format } from "date-fns"
import { es } from "date-fns/locale"

const UsersTab = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })
  const [currentUser, setCurrentUser] = useState({
    id: null,
    username: "",
    password: "",
    name: "",
    email: "",
    role: "empleado",
    active: true,
  })

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const response = await userService.getAllUsers()
      setUsers(response.data)
    } catch (error) {
      if (!error.cancelled) {
        setMessage({ type: "error", text: "Error al cargar usuarios" })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (user = null) => {
    if (user) {
      setEditMode(true)
      setCurrentUser({
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email || "",
        role: user.role,
        active: user.active,
        password: "",
      })
    } else {
      setEditMode(false)
      setCurrentUser({
        id: null,
        username: "",
        password: "",
        name: "",
        email: "",
        role: "empleado",
        active: true,
      })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setCurrentUser({
      id: null,
      username: "",
      password: "",
      name: "",
      email: "",
      role: "empleado",
      active: true,
    })
  }

  const handleSaveUser = async () => {
    try {
      setMessage({ type: "", text: "" })

      if (editMode) {
        await userService.updateUser(currentUser.id, {
          username: currentUser.username,
          name: currentUser.name,
          email: currentUser.email,
          role: currentUser.role,
          active: currentUser.active,
        })
        setMessage({ type: "success", text: "Usuario actualizado correctamente" })
      } else {
        await userService.createUser({
          username: currentUser.username,
          password: currentUser.password,
          name: currentUser.name,
          email: currentUser.email,
          role: currentUser.role,
        })
        setMessage({ type: "success", text: "Usuario creado correctamente" })
      }

      handleCloseDialog()
      loadUsers()
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Error al guardar usuario" })
    }
  }

  const handleDeleteUser = async (id) => {
    if (!window.confirm("¿Estás seguro de que deseas desactivar este usuario?")) {
      return
    }

    try {
      await userService.deleteUser(id)
      setMessage({ type: "success", text: "Usuario desactivado correctamente" })
      loadUsers()
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Error al desactivar usuario" })
    }
  }

  const formatDate = (date) => {
    if (!date) return "Nunca"
    return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: es })
  }

  const inputStyles = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "10px",
      backgroundColor: "#fafafa",
      "&:hover fieldset": { borderColor: "#d1d5db" },
      "&.Mui-focused fieldset": { borderColor: "#d97706", borderWidth: "1px" },
    },
    "& .MuiInputLabel-root.Mui-focused": { color: "#d97706" },
  }

  return (
    <Box>
      {/* Section Header */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: "#111827", mb: 0.5 }}>
            Gestión de Usuarios
          </Typography>
          <Typography variant="body2" sx={{ color: "#6b7280" }}>
            Administra los usuarios del sistema
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1.5 }}>
          <IconButton
            onClick={loadUsers}
            size="small"
            sx={{
              color: "#78716c",
              backgroundColor: "#f5f5f4",
              "&:hover": {
                backgroundColor: "#e7e5e4",
                color: "#d97706",
              },
            }}
            title="Actualizar"
            aria-label="Actualizar"
          >
            <Refresh fontSize="small" />
          </IconButton>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            sx={{
              backgroundColor: "#f59e0b",
              "&:hover": { backgroundColor: "#d97706" },
              textTransform: "none",
              fontWeight: 600,
              borderRadius: "10px",
              px: 2.5,
              boxShadow: "0 1px 3px rgba(245, 158, 11, 0.3)",
            }}
          >
            Nuevo Usuario
          </Button>
        </Box>
      </Box>

      {message.text && (
        <Alert
          severity={message.type}
          sx={{ mb: 3, borderRadius: "10px" }}
          onClose={() => setMessage({ type: "", text: "" })}
        >
          {message.text}
        </Alert>
      )}

      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          overflow: "auto",
          backgroundColor: "#fff",
        }}
      >
        <Table
          size="small"
          sx={{
            minWidth: 700,
            "& .MuiTableCell-root": {
              borderBottom: "1px solid #f3f4f6",
              py: { xs: 1.25, sm: 1.5 },
              px: { xs: 1.5, sm: 2 },
              fontSize: { xs: "0.8125rem", sm: "0.875rem" },
            },
          }}
        >
          <TableHead>
            <TableRow
              sx={{
                backgroundColor: "#fafafa",
                "& .MuiTableCell-head": {
                  fontWeight: 600,
                  color: "#374151",
                  fontSize: { xs: "0.75rem", sm: "0.8125rem" },
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                },
              }}
            >
              <TableCell>Usuario</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>Email</TableCell>
              <TableCell>Rol</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell sx={{ display: { xs: "none", lg: "table-cell" } }}>Último Login</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        border: "2px solid #e5e7eb",
                        borderTopColor: "#d97706",
                        borderRadius: "50%",
                        animation: "spin 1s linear infinite",
                        "@keyframes spin": {
                          "0%": { transform: "rotate(0deg)" },
                          "100%": { transform: "rotate(360deg)" },
                        },
                      }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      Cargando...
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                  <Typography variant="body2" color="text.secondary">
                    No hay usuarios disponibles
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow
                  key={user.id}
                  hover
                  sx={{
                    "&:hover": { backgroundColor: "#fafafa" },
                    "&:last-child .MuiTableCell-root": { borderBottom: "none" },
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {user.username}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {user.name}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
                    <Typography variant="body2" color="text.secondary">
                      {user.email || "-"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.role === "admin" ? "Admin" : "Empleado"}
                      size="small"
                      sx={{
                        backgroundColor: user.role === "admin" ? "#fef3c7" : "#dbeafe",
                        color: user.role === "admin" ? "#92400e" : "#1e40af",
                        fontWeight: 600,
                        fontSize: "0.75rem",
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.active ? "Activo" : "Inactivo"}
                      size="small"
                      sx={{
                        backgroundColor: user.active ? "#dcfce7" : "#f3f4f6",
                        color: user.active ? "#166534" : "#6b7280",
                        fontWeight: 600,
                        fontSize: "0.75rem",
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ display: { xs: "none", lg: "table-cell" } }}>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(user.last_login)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(user)}
                      sx={{ color: "#d97706" }}
                      title="Editar"
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteUser(user.id)}
                      sx={{ color: "#dc2626" }}
                      title="Desactivar"
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: { xs: "16px", sm: "20px" },
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
            m: { xs: 2, sm: 3 },
            maxHeight: { xs: "calc(100vh - 32px)", sm: "calc(100vh - 48px)" },
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: { xs: 2.5, sm: 3 },
            py: 2.5,
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: "#111827",
                fontSize: { xs: "1.125rem", sm: "1.25rem" },
              }}
            >
              {editMode ? "Editar Usuario" : "Nuevo Usuario"}
            </Typography>
            <Typography variant="body2" sx={{ color: "#6b7280", mt: 0.25 }}>
              {editMode ? "Actualiza la información del usuario" : "Completa los datos para crear un usuario"}
            </Typography>
          </Box>
          <IconButton
            onClick={handleCloseDialog}
            size="small"
            sx={{
              color: "#9ca3af",
              "&:hover": { backgroundColor: "#f3f4f6", color: "#6b7280" },
            }}
            aria-label="Cerrar"
          >
            <Close fontSize="small" />
          </IconButton>
        </Box>

        {/* Content */}
        <DialogContent sx={{ px: { xs: 2.5, sm: 3 }, py: 3 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2.5,
            }}
          >
            <TextField
              fullWidth
              label="Nombre de usuario"
              value={currentUser.username}
              onChange={(e) => setCurrentUser({ ...currentUser, username: e.target.value })}
              size="small"
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person sx={{ color: "#9ca3af", fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={inputStyles}
            />

            {!editMode ? (
              <TextField
                fullWidth
                label="Contraseña"
                type="password"
                value={currentUser.password}
                onChange={(e) => setCurrentUser({ ...currentUser, password: e.target.value })}
                size="small"
                required
                helperText="Mínimo 6 caracteres"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: "#9ca3af", fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
                sx={inputStyles}
              />
            ) : (
              <FormControl
                fullWidth
                size="small"
                sx={{
                  ...inputStyles,
                  "& .MuiSelect-select": { py: 1 },
                }}
              >
                <InputLabel>Estado</InputLabel>
                <Select
                  value={currentUser.active ? 1 : 0}
                  label="Estado"
                  onChange={(e) => setCurrentUser({ ...currentUser, active: e.target.value === 1 })}
                >
                  <MenuItem value={1}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#22c55e" }} />
                      Activo
                    </Box>
                  </MenuItem>
                  <MenuItem value={0}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#9ca3af" }} />
                      Inactivo
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            )}

            <TextField
              fullWidth
              label="Nombre completo"
              value={currentUser.name}
              onChange={(e) => setCurrentUser({ ...currentUser, name: e.target.value })}
              size="small"
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Badge sx={{ color: "#9ca3af", fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={inputStyles}
            />

            <TextField
              fullWidth
              label="Email"
              type="email"
              value={currentUser.email}
              onChange={(e) => setCurrentUser({ ...currentUser, email: e.target.value })}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email sx={{ color: "#9ca3af", fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={inputStyles}
            />

            <FormControl
              fullWidth
              size="small"
              sx={{
                gridColumn: { xs: "1", sm: "1 / -1" },
                ...inputStyles,
              }}
            >
              <InputLabel>Rol</InputLabel>
              <Select
                value={currentUser.role}
                label="Rol"
                onChange={(e) => setCurrentUser({ ...currentUser, role: e.target.value })}
              >
                <MenuItem value="empleado">Empleado</MenuItem>
                <MenuItem value="admin">Administrador</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>

        {/* Footer */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 1.5,
            px: { xs: 2.5, sm: 3 },
            py: 2.5,
            borderTop: "1px solid #e5e7eb",
            backgroundColor: "#fafafa",
          }}
        >
          <Button
            onClick={handleCloseDialog}
            variant="outlined"
            sx={{
              color: "#6b7280",
              borderColor: "#d1d5db",
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 500,
              px: 3,
              "&:hover": {
                borderColor: "#9ca3af",
                backgroundColor: "#f9fafb",
              },
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSaveUser}
            variant="contained"
            sx={{
              backgroundColor: "#d97706",
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 600,
              px: 3,
              boxShadow: "0 1px 3px rgba(217, 119, 6, 0.3)",
              "&:hover": {
                backgroundColor: "#b45309",
                boxShadow: "0 4px 12px rgba(217, 119, 6, 0.4)",
              },
            }}
          >
            {editMode ? "Guardar Cambios" : "Crear Usuario"}
          </Button>
        </Box>
      </Dialog>
    </Box>
  )
}

export default UsersTab
