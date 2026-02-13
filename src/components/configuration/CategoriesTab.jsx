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
  Chip,
  Alert,
  InputAdornment,
} from "@mui/material"
import { Add, Edit, Delete, Close, Category, Description, Refresh } from "@mui/icons-material"
import categoryService from "../../services/categoryService"
import { format } from "date-fns"
import { es } from "date-fns/locale"

const CategoriesTab = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })
  const [currentCategory, setCurrentCategory] = useState({
    id: null,
    name: "",
    description: "",
    active: true,
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const res = await categoryService.getAll().catch(() => ({ data: [] }))
      setCategories(res.data || [])
    } catch (error) {
      if (!error.cancelled) setMessage({ type: "error", text: "Error al cargar categorías" })
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (category = null) => {
    if (category) {
      setEditMode(true)
      setCurrentCategory({
        id: category.id,
        name: category.name,
        description: category.description || "",
        active: category.active,
      })
    } else {
      setEditMode(false)
      setCurrentCategory({
        id: null,
        name: "",
        description: "",
        active: true,
      })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setCurrentCategory({ id: null, name: "", description: "", active: true })
  }

  const handleSave = async () => {
    try {
      setMessage({ type: "", text: "" })
      if (editMode) {
        await categoryService.update(currentCategory.id, {
          name: currentCategory.name,
          description: currentCategory.description,
          active: currentCategory.active,
        })
        setMessage({ type: "success", text: "Categoría actualizada correctamente" })
      } else {
        await categoryService.create({
          name: currentCategory.name,
          description: currentCategory.description,
        })
        setMessage({ type: "success", text: "Categoría creada correctamente" })
      }
      handleCloseDialog()
      loadData()
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Error al guardar categoría" })
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de desactivar esta categoría?")) return
    try {
      await categoryService.delete(id)
      setMessage({ type: "success", text: "Categoría desactivada correctamente" })
      loadData()
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Error al eliminar categoría" })
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
            Categorías
          </Typography>
          <Typography variant="body2" sx={{ color: "#6b7280" }}>
            Gestiona las categorías para organizar productos y otros elementos
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
            Nueva categoría
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
            minWidth: 500,
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
              <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>Descripción</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell sx={{ display: { xs: "none", lg: "table-cell" } }}>Creado</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                    <Box sx={{ width: 36, height: 36, border: "2px solid #e5e7eb", borderTopColor: "#d97706", borderRadius: "50%", animation: "spin 1s linear infinite", "@keyframes spin": { "0%": { transform: "rotate(0deg)" }, "100%": { transform: "rotate(360deg)" } } }} />
                    <Typography variant="body2" color="text.secondary">Cargando...</Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                  <Typography variant="body2" color="text.secondary">No hay categorías. Crea una para usarla en productos.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              categories.map((cat) => (
                <TableRow key={cat.id} hover sx={{ "&:hover": { backgroundColor: "#fafafa" }, "&:last-child .MuiTableCell-root": { borderBottom: "none" } }}>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>{cat.name}</Typography>
                  </TableCell>
                  <TableCell sx={{ display: { xs: "none", md: "table-cell" }, maxWidth: 280 }}>
                    <Typography variant="body2" color="text.secondary" noWrap>{cat.description || "—"}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={cat.active ? "Activa" : "Inactiva"}
                      size="small"
                      sx={{ backgroundColor: cat.active ? "#dcfce7" : "#f3f4f6", color: cat.active ? "#166534" : "#6b7280", fontWeight: 600, fontSize: "0.75rem" }}
                    />
                  </TableCell>
                  <TableCell sx={{ display: { xs: "none", lg: "table-cell" } }}>
                    <Typography variant="caption" color="text.secondary">{formatDate(cat.created_at)}</Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleOpenDialog(cat)} sx={{ color: "#d97706" }} title="Editar">
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(cat.id)} sx={{ color: "#dc2626" }} title="Eliminar">
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
          sx: { borderRadius: { xs: "16px", sm: "20px" }, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", m: { xs: 2, sm: 3 }, maxHeight: "calc(100vh - 48px)" },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: { xs: 2.5, sm: 3 }, py: 2.5, borderBottom: "1px solid #e5e7eb" }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: "#111827", fontSize: "1.25rem" }}>
              {editMode ? "Editar categoría" : "Nueva categoría"}
            </Typography>
            <Typography variant="body2" sx={{ color: "#6b7280", mt: 0.25 }}>
              {editMode ? "Modifica el nombre y la descripción" : "Crea una categoría para organizar productos"}
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
              label="Nombre"
              value={currentCategory.name}
              onChange={(e) => setCurrentCategory({ ...currentCategory, name: e.target.value })}
              size="small"
              required
              InputProps={{ startAdornment: <InputAdornment position="start"><Category sx={{ color: "#9ca3af", fontSize: 20 }} /></InputAdornment> }}
              sx={inputStyles}
            />
            <TextField
              fullWidth
              label="Descripción (opcional)"
              multiline
              rows={3}
              value={currentCategory.description}
              onChange={(e) => setCurrentCategory({ ...currentCategory, description: e.target.value })}
              size="small"
              InputProps={{ startAdornment: <InputAdornment position="start" sx={{ alignSelf: "flex-start", mt: 1 }}><Description sx={{ color: "#9ca3af", fontSize: 20 }} /></InputAdornment> }}
              sx={inputStyles}
            />
            {editMode && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="body2" sx={{ color: "#374151", fontWeight: 500 }}>Estado:</Typography>
                <Chip
                  label={currentCategory.active ? "Activa" : "Inactiva"}
                  size="small"
                  onClick={() => setCurrentCategory({ ...currentCategory, active: !currentCategory.active })}
                  sx={{
                    backgroundColor: currentCategory.active ? "#dcfce7" : "#f3f4f6",
                    color: currentCategory.active ? "#166534" : "#6b7280",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                />
              </Box>
            )}
          </Box>
        </DialogContent>
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5, px: { xs: 2.5, sm: 3 }, py: 2.5, borderTop: "1px solid #e5e7eb", backgroundColor: "#fafafa" }}>
          <Button onClick={handleCloseDialog} variant="outlined" sx={{ color: "#6b7280", borderColor: "#d1d5db", borderRadius: "10px", textTransform: "none", fontWeight: 500, px: 3, "&:hover": { borderColor: "#9ca3af", backgroundColor: "#f9fafb" } }}>
            Cancelar
          </Button>
          <Button onClick={handleSave} variant="contained" sx={{ backgroundColor: "#d97706", borderRadius: "10px", textTransform: "none", fontWeight: 600, px: 3, boxShadow: "0 1px 3px rgba(217, 119, 6, 0.3)", "&:hover": { backgroundColor: "#b45309" } }}>
            {editMode ? "Guardar cambios" : "Crear categoría"}
          </Button>
        </Box>
      </Dialog>
    </Box>
  )
}

export default CategoriesTab
