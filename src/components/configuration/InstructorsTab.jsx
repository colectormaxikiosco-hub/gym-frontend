"use client"

import { useState, useEffect } from "react"
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Typography,
  Alert,
  InputAdornment,
  FormControlLabel,
  Switch,
} from "@mui/material"
import {
  Add,
  Edit,
  Delete,
  Close,
  Refresh,
  Person,
  Badge,
  Phone,
} from "@mui/icons-material"
import instructorService from "../../services/instructorService"

const InstructorsTab = () => {
  const [instructors, setInstructors] = useState([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingInstructor, setEditingInstructor] = useState(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    dni: "",
    phone: "",
    active: true,
  })

  useEffect(() => {
    loadInstructors()
  }, [])

  const loadInstructors = async () => {
    try {
      setLoading(true)
      const response = await instructorService.getAll()
      const data = response?.data ?? response
      setInstructors(Array.isArray(data) ? data : [])
    } catch (err) {
      if (!err.cancelled) setError("Error al cargar los instructores")
      setInstructors([])
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (instructor = null) => {
    setError("")
    if (instructor) {
      setEditingInstructor(instructor)
      setFormData({
        name: instructor.name ?? "",
        dni: instructor.dni ?? "",
        phone: instructor.phone ?? "",
        active: instructor.active !== false,
      })
    } else {
      setEditingInstructor(null)
      setFormData({
        name: "",
        dni: "",
        phone: "",
        active: true,
      })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingInstructor(null)
    setFormData({ name: "", dni: "", phone: "", active: true })
    setError("")
  }

  const handleSubmit = async () => {
    try {
      setError("")
      const payload = {
        name: formData.name.trim(),
        dni: formData.dni.trim(),
        phone: formData.phone.trim() || null,
      }
      if (editingInstructor) {
        await instructorService.update(editingInstructor.id, { ...payload, active: formData.active })
        setSuccess("Instructor actualizado correctamente")
      } else {
        await instructorService.create(payload)
        setSuccess("Instructor creado correctamente")
      }
      loadInstructors()
      handleCloseDialog()
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError(err.response?.data?.message || "Error al guardar el instructor")
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este instructor?")) return
    try {
      await instructorService.delete(id)
      setSuccess("Instructor eliminado correctamente")
      loadInstructors()
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError(err.response?.data?.message || "Error al eliminar el instructor")
      setTimeout(() => setError(""), 4000)
    }
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
            Gestión de Instructores
          </Typography>
          <Typography variant="body2" sx={{ color: "#6b7280" }}>
            Crear, editar y eliminar instructores
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <IconButton
            onClick={loadInstructors}
            size="small"
            sx={{
              color: "#78716c",
              backgroundColor: "#f5f5f4",
              "&:hover": { backgroundColor: "#e7e5e4", color: "#d97706" },
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
            Nuevo Instructor
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: "10px" }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: "10px" }} onClose={() => setSuccess("")}>
          {success}
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
            minWidth: 520,
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
              <TableCell>Nombre</TableCell>
              <TableCell>DNI</TableCell>
              <TableCell>Teléfono</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
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
            ) : instructors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                  <Typography variant="body2" color="text.secondary">
                    No hay instructores. Crea uno para comenzar.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              instructors.map((instructor) => (
                <TableRow
                  key={instructor.id}
                  hover
                  sx={{
                    "&:hover": { backgroundColor: "#fafafa" },
                    "&:last-child .MuiTableCell-root": { borderBottom: "none" },
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {instructor.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                      {instructor.dni}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {instructor.phone || "—"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={instructor.active !== false ? "Activo" : "Inactivo"}
                      size="small"
                      sx={{
                        backgroundColor: instructor.active !== false ? "#dcfce7" : "#f3f4f6",
                        color: instructor.active !== false ? "#166534" : "#6b7280",
                        fontWeight: 600,
                        fontSize: "0.75rem",
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(instructor)}
                      sx={{ color: "#d97706" }}
                      title="Editar"
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(instructor.id)}
                      sx={{ color: "#dc2626" }}
                      title="Eliminar"
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
            <Typography variant="h6" sx={{ fontWeight: 600, color: "#111827", fontSize: { xs: "1.125rem", sm: "1.25rem" } }}>
              {editingInstructor ? "Editar Instructor" : "Nuevo Instructor"}
            </Typography>
            <Typography variant="body2" sx={{ color: "#6b7280", mt: 0.25 }}>
              {editingInstructor ? "Actualiza los datos del instructor" : "Completa los datos del instructor"}
            </Typography>
          </Box>
          <IconButton
            onClick={handleCloseDialog}
            size="small"
            sx={{ color: "#9ca3af", "&:hover": { backgroundColor: "#f3f4f6", color: "#6b7280" } }}
            aria-label="Cerrar"
          >
            <Close fontSize="small" />
          </IconButton>
        </Box>

        <DialogContent sx={{ px: { xs: 2.5, sm: 3 }, py: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: "10px" }} onClose={() => setError("")}>
              {error}
            </Alert>
          )}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <TextField
              fullWidth
              label="Nombre"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
            <TextField
              fullWidth
              label="DNI"
              value={formData.dni}
              onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
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
              label="Teléfono (opcional)"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Phone sx={{ color: "#9ca3af", fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={inputStyles}
            />
            {editingInstructor && (
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    sx={{
                      "& .MuiSwitch-switchBase.Mui-checked": { color: "#16a34a" },
                      "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: "#86efac" },
                    }}
                  />
                }
                label={<Typography variant="body2" sx={{ fontWeight: 500, color: "#374151" }}>Activo</Typography>}
              />
            )}
          </Box>
        </DialogContent>

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
              "&:hover": { borderColor: "#9ca3af", backgroundColor: "#f9fafb" },
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            sx={{
              backgroundColor: "#d97706",
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 600,
              px: 3,
              boxShadow: "0 1px 3px rgba(217, 119, 6, 0.3)",
              "&:hover": { backgroundColor: "#b45309", boxShadow: "0 4px 12px rgba(217, 119, 6, 0.4)" },
            }}
          >
            {editingInstructor ? "Guardar Cambios" : "Crear Instructor"}
          </Button>
        </Box>
      </Dialog>
    </Box>
  )
}

export default InstructorsTab
