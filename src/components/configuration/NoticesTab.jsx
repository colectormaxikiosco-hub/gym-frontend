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
import { Add, Edit, Delete, Close, Title, Description, Refresh } from "@mui/icons-material"
import noticeService from "../../services/noticeService"
import { format } from "date-fns"
import { es } from "date-fns/locale"

const NoticesTab = () => {
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })
  const [currentNotice, setCurrentNotice] = useState({
    id: null,
    title: "",
    content: "",
    type: "info",
    active: true,
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const noticesRes = await noticeService.getAllNotices().catch(() => ({ data: [] }))
      setNotices(noticesRes.data || [])
    } catch (error) {
      if (!error.cancelled) setMessage({ type: "error", text: "Error al cargar avisos" })
      setNotices([])
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (notice = null) => {
    if (notice) {
      setEditMode(true)
      setCurrentNotice({
        id: notice.id,
        title: notice.title,
        content: notice.content,
        type: notice.type,
        active: notice.active,
      })
    } else {
      setEditMode(false)
      setCurrentNotice({
        id: null,
        title: "",
        content: "",
        type: "info",
        active: true,
      })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setCurrentNotice({
      id: null,
      title: "",
      content: "",
      type: "info",
      active: true,
    })
  }

  const handleSave = async () => {
    try {
      setMessage({ type: "", text: "" })
      if (editMode) {
        await noticeService.updateNotice(currentNotice.id, currentNotice)
        setMessage({ type: "success", text: "Aviso actualizado correctamente" })
      } else {
        await noticeService.createNotice(currentNotice)
        setMessage({ type: "success", text: "Aviso creado correctamente" })
      }
      handleCloseDialog()
      loadData()
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Error al guardar aviso" })
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este aviso?")) return
    try {
      await noticeService.deleteNotice(id)
      setMessage({ type: "success", text: "Aviso eliminado correctamente" })
      loadData()
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Error al eliminar aviso" })
    }
  }

  const formatDate = (date) => {
    if (!date) return "-"
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

  const getNoticeTypeChip = (type) => {
    const config = {
      success: { bg: "#dcfce7", color: "#166534", label: "Éxito" },
      warning: { bg: "#fef3c7", color: "#92400e", label: "Advertencia" },
      info: { bg: "#dbeafe", color: "#1e40af", label: "Información" },
    }
    const c = config[type] || config.info
    return (
      <Chip
        label={c.label}
        size="small"
        sx={{ backgroundColor: c.bg, color: c.color, fontWeight: 600, fontSize: "0.75rem" }}
      />
    )
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
            Avisos
          </Typography>
          <Typography variant="body2" sx={{ color: "#6b7280" }}>
            Los clientes verán estos avisos al iniciar sesión
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
            Nuevo Aviso
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
            minWidth: 600,
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
              <TableCell>Título</TableCell>
              <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>Contenido</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell sx={{ display: { xs: "none", lg: "table-cell" } }}>Creado</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                    <Box sx={{ width: 36, height: 36, border: "2px solid #e5e7eb", borderTopColor: "#d97706", borderRadius: "50%", animation: "spin 1s linear infinite", "@keyframes spin": { "0%": { transform: "rotate(0deg)" }, "100%": { transform: "rotate(360deg)" } } }} />
                    <Typography variant="body2" color="text.secondary">Cargando...</Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : notices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                  <Typography variant="body2" color="text.secondary">No hay avisos disponibles</Typography>
                </TableCell>
              </TableRow>
            ) : (
              notices.map((notice) => (
                <TableRow key={notice.id} hover sx={{ "&:hover": { backgroundColor: "#fafafa" }, "&:last-child .MuiTableCell-root": { borderBottom: "none" } }}>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>{notice.title}</Typography>
                  </TableCell>
                  <TableCell sx={{ display: { xs: "none", md: "table-cell" }, maxWidth: 200 }}>
                    <Typography variant="body2" color="text.secondary" noWrap>{notice.content}</Typography>
                  </TableCell>
                  <TableCell>{getNoticeTypeChip(notice.type)}</TableCell>
                  <TableCell>
                    <Chip
                      label={notice.active ? "Activo" : "Inactivo"}
                      size="small"
                      sx={{ backgroundColor: notice.active ? "#dcfce7" : "#f3f4f6", color: notice.active ? "#166534" : "#6b7280", fontWeight: 600, fontSize: "0.75rem" }}
                    />
                  </TableCell>
                  <TableCell sx={{ display: { xs: "none", lg: "table-cell" } }}>
                    <Typography variant="caption" color="text.secondary">{formatDate(notice.created_at)}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleOpenDialog(notice)} sx={{ color: "#d97706" }} title="Editar">
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(notice.id)} sx={{ color: "#dc2626" }} title="Eliminar">
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
              {editMode ? "Editar Aviso" : "Nuevo Aviso"}
            </Typography>
            <Typography variant="body2" sx={{ color: "#6b7280", mt: 0.25 }}>
              {editMode ? "Actualiza la información del aviso" : "Crea un nuevo aviso para los clientes"}
            </Typography>
          </Box>
          <IconButton onClick={handleCloseDialog} size="small" sx={{ color: "#9ca3af", "&:hover": { backgroundColor: "#f3f4f6", color: "#6b7280" } }} aria-label="Cerrar">
            <Close fontSize="small" />
          </IconButton>
        </Box>
        <DialogContent sx={{ px: { xs: 2.5, sm: 3 }, py: 3 }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            <TextField
              fullWidth
              label="Título"
              value={currentNotice.title}
              onChange={(e) => setCurrentNotice({ ...currentNotice, title: e.target.value })}
              size="small"
              required
              InputProps={{ startAdornment: <InputAdornment position="start"><Title sx={{ color: "#9ca3af", fontSize: 20 }} /></InputAdornment> }}
              sx={inputStyles}
            />
            <TextField
              fullWidth
              label="Contenido"
              multiline
              rows={4}
              value={currentNotice.content}
              onChange={(e) => setCurrentNotice({ ...currentNotice, content: e.target.value })}
              size="small"
              required
              InputProps={{ startAdornment: <InputAdornment position="start" sx={{ alignSelf: "flex-start", mt: 1 }}><Description sx={{ color: "#9ca3af", fontSize: 20 }} /></InputAdornment> }}
              sx={inputStyles}
            />
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2.5 }}>
              <FormControl fullWidth size="small" sx={inputStyles}>
                <InputLabel>Tipo</InputLabel>
                <Select value={currentNotice.type} label="Tipo" onChange={(e) => setCurrentNotice({ ...currentNotice, type: e.target.value })}>
                  <MenuItem value="info">Información</MenuItem>
                  <MenuItem value="warning">Advertencia</MenuItem>
                  <MenuItem value="success">Éxito</MenuItem>
                </Select>
              </FormControl>
              {editMode && (
                <FormControl fullWidth size="small" sx={inputStyles}>
                  <InputLabel>Estado</InputLabel>
                  <Select value={currentNotice.active ? 1 : 0} label="Estado" onChange={(e) => setCurrentNotice({ ...currentNotice, active: e.target.value === 1 })}>
                    <MenuItem value={1}>Activo</MenuItem>
                    <MenuItem value={0}>Inactivo</MenuItem>
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
            {editMode ? "Guardar Cambios" : "Crear Aviso"}
          </Button>
        </Box>
      </Dialog>
    </Box>
  )
}

export default NoticesTab
