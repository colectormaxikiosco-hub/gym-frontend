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
import {
  Add,
  Edit,
  Delete,
  Close,
  FitnessCenter,
  Person,
  Description,
  AccessTime,
  People,
  Refresh,
} from "@mui/icons-material"
import classService from "../../services/classService"

const ClassesTab = () => {
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })
  const [currentClass, setCurrentClass] = useState({
    id: null,
    name: "",
    description: "",
    instructor: "",
    day_of_week: "Lunes",
    start_time: "",
    end_time: "",
    capacity: 20,
    active: true,
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const classesRes = await classService.getAllClasses().catch(() => ({ data: [] }))
      setClasses(classesRes.data || [])
    } catch (error) {
      if (!error.cancelled) setMessage({ type: "error", text: "Error al cargar clases" })
      setClasses([])
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (classItem = null) => {
    if (classItem) {
      setEditMode(true)
      setCurrentClass({
        id: classItem.id,
        name: classItem.name,
        description: classItem.description || "",
        instructor: classItem.instructor || "",
        day_of_week: classItem.day_of_week,
        start_time: classItem.start_time,
        end_time: classItem.end_time,
        capacity: classItem.capacity,
        active: classItem.active,
      })
    } else {
      setEditMode(false)
      setCurrentClass({
        id: null,
        name: "",
        description: "",
        instructor: "",
        day_of_week: "Lunes",
        start_time: "",
        end_time: "",
        capacity: 20,
        active: true,
      })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setCurrentClass({
      id: null,
      name: "",
      description: "",
      instructor: "",
      day_of_week: "Lunes",
      start_time: "",
      end_time: "",
      capacity: 20,
      active: true,
    })
  }

  const handleSave = async () => {
    try {
      setMessage({ type: "", text: "" })
      if (editMode) {
        await classService.updateClass(currentClass.id, currentClass)
        setMessage({ type: "success", text: "Clase actualizada correctamente" })
      } else {
        await classService.createClass(currentClass)
        setMessage({ type: "success", text: "Clase creada correctamente" })
      }
      handleCloseDialog()
      loadData()
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Error al guardar clase" })
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta clase?")) return
    try {
      await classService.deleteClass(id)
      setMessage({ type: "success", text: "Clase eliminada correctamente" })
      loadData()
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Error al eliminar clase" })
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
            Clases
          </Typography>
          <Typography variant="body2" sx={{ color: "#6b7280" }}>
            Los clientes verán el horario de clases disponibles
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <IconButton
            onClick={loadData}
            size="small"
            sx={{
              color: "#78716c",
              backgroundColor: "#f5f5f4",
              "&:hover": { backgroundColor: "#e7e5e4", color: "#d97706" },
            }}
            title="Actualizar"
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
            Nueva Clase
          </Button>
        </Box>
      </Box>

      {message.text && (
        <Alert severity={message.type} sx={{ mb: 3, borderRadius: "10px" }} onClose={() => setMessage({ type: "", text: "" })}>
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
              <TableCell>Nombre</TableCell>
              <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>Instructor</TableCell>
              <TableCell>Día</TableCell>
              <TableCell>Horario</TableCell>
              <TableCell sx={{ display: { xs: "none", lg: "table-cell" } }}>Capacidad</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                    <Box sx={{ width: 36, height: 36, border: "2px solid #e5e7eb", borderTopColor: "#d97706", borderRadius: "50%", animation: "spin 1s linear infinite", "@keyframes spin": { "0%": { transform: "rotate(0deg)" }, "100%": { transform: "rotate(360deg)" } } }} />
                    <Typography variant="body2" color="text.secondary">Cargando...</Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : classes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                  <Typography variant="body2" color="text.secondary">No hay clases disponibles</Typography>
                </TableCell>
              </TableRow>
            ) : (
              classes.map((classItem) => (
                <TableRow key={classItem.id} hover sx={{ "&:hover": { backgroundColor: "#fafafa" }, "&:last-child .MuiTableCell-root": { borderBottom: "none" } }}>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>{classItem.name}</Typography>
                  </TableCell>
                  <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
                    <Typography variant="body2" color="text.secondary">{classItem.instructor || "-"}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={classItem.day_of_week}
                      size="small"
                      sx={{ backgroundColor: "#f3f4f6", color: "#374151", fontWeight: 500, fontSize: "0.75rem" }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{classItem.start_time} - {classItem.end_time}</Typography>
                  </TableCell>
                  <TableCell sx={{ display: { xs: "none", lg: "table-cell" } }}>
                    <Typography variant="body2">{classItem.capacity} pers.</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={classItem.active ? "Activa" : "Inactiva"}
                      size="small"
                      sx={{ backgroundColor: classItem.active ? "#dcfce7" : "#f3f4f6", color: classItem.active ? "#166534" : "#6b7280", fontWeight: 600, fontSize: "0.75rem" }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleOpenDialog(classItem)} sx={{ color: "#d97706" }} title="Editar">
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(classItem.id)} sx={{ color: "#dc2626" }} title="Eliminar">
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
          sx: { borderRadius: { xs: "16px", sm: "20px" }, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", m: { xs: 2, sm: 3 }, maxHeight: { xs: "calc(100vh - 32px)", sm: "calc(100vh - 48px)" } },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: { xs: 2.5, sm: 3 }, py: 2.5, borderBottom: "1px solid #e5e7eb" }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: "#111827", fontSize: { xs: "1.125rem", sm: "1.25rem" } }}>
              {editMode ? "Editar Clase" : "Nueva Clase"}
            </Typography>
            <Typography variant="body2" sx={{ color: "#6b7280", mt: 0.25 }}>
              {editMode ? "Actualiza la información de la clase" : "Crea una nueva clase para el gimnasio"}
            </Typography>
          </Box>
          <IconButton onClick={handleCloseDialog} size="small" sx={{ color: "#9ca3af", "&:hover": { backgroundColor: "#f3f4f6", color: "#6b7280" } }} aria-label="Cerrar">
            <Close fontSize="small" />
          </IconButton>
        </Box>
        <DialogContent sx={{ px: { xs: 2.5, sm: 3 }, py: 3 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2.5 }}>
              <TextField
                fullWidth
                label="Nombre de la clase"
                value={currentClass.name}
                onChange={(e) => setCurrentClass({ ...currentClass, name: e.target.value })}
                size="small"
                required
                InputProps={{ startAdornment: <InputAdornment position="start"><FitnessCenter sx={{ color: "#9ca3af", fontSize: 20 }} /></InputAdornment> }}
                sx={inputStyles}
              />
              <TextField
                fullWidth
                label="Instructor"
                value={currentClass.instructor}
                onChange={(e) => setCurrentClass({ ...currentClass, instructor: e.target.value })}
                size="small"
                InputProps={{ startAdornment: <InputAdornment position="start"><Person sx={{ color: "#9ca3af", fontSize: 20 }} /></InputAdornment> }}
                sx={inputStyles}
              />
            </Box>
            <TextField
              fullWidth
              label="Descripción"
              multiline
              rows={2}
              value={currentClass.description}
              onChange={(e) => setCurrentClass({ ...currentClass, description: e.target.value })}
              size="small"
              InputProps={{ startAdornment: <InputAdornment position="start" sx={{ alignSelf: "flex-start", mt: 1 }}><Description sx={{ color: "#9ca3af", fontSize: 20 }} /></InputAdornment> }}
              sx={inputStyles}
            />
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" }, gap: 2.5 }}>
              <FormControl fullWidth size="small" sx={inputStyles}>
                <InputLabel>Día de la semana</InputLabel>
                <Select value={currentClass.day_of_week} label="Día de la semana" onChange={(e) => setCurrentClass({ ...currentClass, day_of_week: e.target.value })}>
                  {["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"].map((day) => (
                    <MenuItem key={day} value={day}>{day}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Hora de inicio"
                type="time"
                value={currentClass.start_time}
                onChange={(e) => setCurrentClass({ ...currentClass, start_time: e.target.value })}
                size="small"
                required
                InputLabelProps={{ shrink: true }}
                InputProps={{ startAdornment: <InputAdornment position="start"><AccessTime sx={{ color: "#9ca3af", fontSize: 20 }} /></InputAdornment> }}
                sx={inputStyles}
              />
              <TextField
                fullWidth
                label="Hora de fin"
                type="time"
                value={currentClass.end_time}
                onChange={(e) => setCurrentClass({ ...currentClass, end_time: e.target.value })}
                size="small"
                required
                InputLabelProps={{ shrink: true }}
                InputProps={{ startAdornment: <InputAdornment position="start"><AccessTime sx={{ color: "#9ca3af", fontSize: 20 }} /></InputAdornment> }}
                sx={inputStyles}
              />
            </Box>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2.5 }}>
              <TextField
                fullWidth
                label="Capacidad"
                type="number"
                value={currentClass.capacity}
                onChange={(e) => setCurrentClass({ ...currentClass, capacity: Number.parseInt(e.target.value) })}
                size="small"
                required
                InputProps={{ startAdornment: <InputAdornment position="start"><People sx={{ color: "#9ca3af", fontSize: 20 }} /></InputAdornment> }}
                sx={inputStyles}
              />
              {editMode && (
                <FormControl fullWidth size="small" sx={inputStyles}>
                  <InputLabel>Estado</InputLabel>
                  <Select value={currentClass.active ? 1 : 0} label="Estado" onChange={(e) => setCurrentClass({ ...currentClass, active: e.target.value === 1 })}>
                    <MenuItem value={1}>Activa</MenuItem>
                    <MenuItem value={0}>Inactiva</MenuItem>
                  </Select>
                </FormControl>
              )}
            </Box>
          </Box>
        </DialogContent>
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5, px: { xs: 2.5, sm: 3 }, py: 2.5, borderTop: "1px solid #e5e7eb", backgroundColor: "#fafafa" }}>
          <Button onClick={handleCloseDialog} variant="outlined" sx={{ color: "#6b7280", borderColor: "#d1d5db", borderRadius: "10px", textTransform: "none", fontWeight: 500, px: 3, "&:hover": { borderColor: "#9ca3af", backgroundColor: "#f9fafb" } }}>
            Cancelar
          </Button>
          <Button onClick={handleSave} variant="contained" sx={{ backgroundColor: "#d97706", borderRadius: "10px", textTransform: "none", fontWeight: 600, px: 3, boxShadow: "0 1px 3px rgba(217, 119, 6, 0.3)", "&:hover": { backgroundColor: "#b45309", boxShadow: "0 4px 12px rgba(217, 119, 6, 0.4)" } }}>
            {editMode ? "Guardar Cambios" : "Crear Clase"}
          </Button>
        </Box>
      </Dialog>
    </Box>
  )
}

export default ClassesTab
