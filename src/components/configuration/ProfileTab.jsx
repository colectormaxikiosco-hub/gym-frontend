"use client"

import { useState, useEffect } from "react"
import {
  Box,
  TextField,
  Button,
  Alert,
  Dialog,
  DialogContent,
  IconButton,
  InputAdornment,
  Typography,
} from "@mui/material"
import { Person, Lock, Visibility, VisibilityOff, Email, Badge, Close } from "@mui/icons-material"
import userService from "../../services/userService"
import clientService from "../../services/clientService"
import { useAuth } from "../../context/AuthContext"

const ProfileTab = () => {
  const { user, setUser } = useAuth()
  const [profile, setProfile] = useState({
    username: "",
    name: "",
    email: "",
    role: "",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })
  const [passwordDialog, setPasswordDialog] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })

  const isClient = user?.role === "client"

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const response = isClient ? await clientService.getMyProfile() : await userService.getProfile()
      setProfile(response.data)
      setLoading(false)
    } catch (error) {
      if (!error.cancelled) {
        setMessage({ type: "error", text: "Error al cargar el perfil" })
      }
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    try {
      setSaving(true)
      setMessage({ type: "", text: "" })

      const response = isClient
        ? await clientService.updateMyProfile({
            username: profile.username,
            name: profile.name,
            email: profile.email,
          })
        : await userService.updateProfile({
            username: profile.username,
            name: profile.name,
            email: profile.email,
          })

      setProfile(response.data)

      const updatedUser = { ...user, username: response.data.username, name: response.data.name }
      setUser(updatedUser)
      localStorage.setItem("gymUser", JSON.stringify(updatedUser))

      setMessage({ type: "success", text: "Perfil actualizado correctamente" })
      setSaving(false)
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Error al actualizar el perfil" })
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    try {
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setMessage({ type: "error", text: "Las contraseñas no coinciden" })
        return
      }

      if (passwordData.newPassword.length < 6) {
        setMessage({ type: "error", text: "La contraseña debe tener al menos 6 caracteres" })
        return
      }

      setMessage({ type: "", text: "" })

      const response = isClient
        ? await clientService.changePassword(passwordData.currentPassword, passwordData.newPassword)
        : await userService.changePassword(passwordData.currentPassword, passwordData.newPassword)

      setMessage({ type: "success", text: response.message })
      setPasswordDialog(false)
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Error al cambiar la contraseña" })
    }
  }

  const handleClosePasswordDialog = () => {
    setPasswordDialog(false)
    setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 8 }}>
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
      </Box>
    )
  }

  const getRoleText = () => {
    if (profile.role === "admin") return "Administrador"
    if (profile.role === "empleado") return "Empleado"
    if (profile.role === "client") return "Cliente"
    return profile.role
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
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: "#111827", mb: 0.5 }}>
          Información Personal
        </Typography>
        <Typography variant="body2" sx={{ color: "#6b7280" }}>
          Actualiza tus datos personales y preferencias de cuenta
        </Typography>
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

      <Box sx={{ maxWidth: 600 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 2.5,
            mb: 3,
          }}
        >
          <TextField
            fullWidth
            label="Nombre de usuario"
            value={profile.username}
            onChange={(e) => setProfile({ ...profile, username: e.target.value })}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Person sx={{ color: "#9ca3af", fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
            sx={inputStyles}
          />

          <TextField
            fullWidth
            label="Nombre completo"
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            size="small"
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
            value={profile.email || ""}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
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

          <TextField
            fullWidth
            label="Rol"
            value={getRoleText()}
            disabled
            size="small"
            sx={{
              ...inputStyles,
              "& .MuiOutlinedInput-root.Mui-disabled": {
                backgroundColor: "#f3f4f6",
              },
            }}
          />
        </Box>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
          <Button
            variant="contained"
            onClick={handleSaveProfile}
            disabled={saving}
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
              "&:disabled": {
                backgroundColor: "#d1d5db",
              },
            }}
          >
            {saving ? "Guardando..." : "Guardar Cambios"}
          </Button>

          <Button
            variant="outlined"
            startIcon={<Lock />}
            onClick={() => setPasswordDialog(true)}
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
            Cambiar Contraseña
          </Button>
        </Box>
      </Box>

      {/* Password Dialog */}
      <Dialog
        open={passwordDialog}
        onClose={handleClosePasswordDialog}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: { xs: "16px", sm: "20px" },
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
            m: { xs: 2, sm: 3 },
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
              Cambiar Contraseña
            </Typography>
            <Typography variant="body2" sx={{ color: "#6b7280", mt: 0.25 }}>
              Actualiza tu contraseña de acceso
            </Typography>
          </Box>
          <IconButton
            onClick={handleClosePasswordDialog}
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
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <TextField
              fullWidth
              label="Contraseña actual"
              type={showPasswords.current ? "text" : "password"}
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: "#9ca3af", fontSize: 20 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      edge="end"
                      size="small"
                    >
                      {showPasswords.current ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={inputStyles}
            />

            <TextField
              fullWidth
              label="Nueva contraseña"
              type={showPasswords.new ? "text" : "password"}
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              size="small"
              helperText="Mínimo 6 caracteres"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: "#9ca3af", fontSize: 20 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      edge="end"
                      size="small"
                    >
                      {showPasswords.new ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={inputStyles}
            />

            <TextField
              fullWidth
              label="Confirmar nueva contraseña"
              type={showPasswords.confirm ? "text" : "password"}
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: "#9ca3af", fontSize: 20 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      edge="end"
                      size="small"
                    >
                      {showPasswords.confirm ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={inputStyles}
            />
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
            onClick={handleClosePasswordDialog}
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
            onClick={handleChangePassword}
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
            Cambiar Contraseña
          </Button>
        </Box>
      </Dialog>
    </Box>
  )
}

export default ProfileTab
