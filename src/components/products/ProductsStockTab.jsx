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
import { Add, Edit, Delete, Refresh, SwapHoriz, History as HistoryIcon, Search } from "@mui/icons-material"
import productService from "../../services/productService"
import ProductFormDialog from "./ProductFormDialog"
import MovementDialog from "./MovementDialog"
import HistoryDialog from "./HistoryDialog"

const inputStyles = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "10px",
    backgroundColor: "#fafafa",
    "&:hover fieldset": { borderColor: "#d1d5db" },
    "&.Mui-focused fieldset": { borderColor: "#d97706", borderWidth: "1px" },
  },
  "& .MuiInputLabel-root.Mui-focused": { color: "#d97706" },
}

const ProductsStockTab = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState({ type: "", text: "" })
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [categories, setCategories] = useState([])

  const [openProductDialog, setOpenProductDialog] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)

  const [openMovementDialog, setOpenMovementDialog] = useState(false)
  const [productForMovement, setProductForMovement] = useState(null)

  const [openHistoryDialog, setOpenHistoryDialog] = useState(false)
  const [productForHistory, setProductForHistory] = useState(null)

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    const cats = [...new Set(products.map((p) => p.category).filter(Boolean))].sort()
    setCategories(cats)
  }, [products])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const params = {}
      if (search.trim()) params.search = search.trim()
      if (categoryFilter.trim()) params.category = categoryFilter.trim()
      const res = await productService.getAll(params)
      setProducts(res.data || [])
    } catch (error) {
      if (!error.cancelled) setMessage({ type: "error", text: "Error al cargar productos" })
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    loadProducts()
  }

  const handleOpenProductDialog = (product = null) => {
    setEditingProduct(product)
    setOpenProductDialog(true)
  }

  const handleOpenMovementDialog = (product) => {
    setProductForMovement(product)
    setOpenMovementDialog(true)
  }

  const handleOpenHistoryDialog = (product) => {
    setProductForHistory(product)
    setOpenHistoryDialog(true)
  }

  const handleProductSaved = () => {
    setOpenProductDialog(false)
    setEditingProduct(null)
    setMessage({ type: "success", text: editingProduct ? "Producto actualizado" : "Producto creado" })
    loadProducts()
  }

  const handleMovementSaved = () => {
    setOpenMovementDialog(false)
    setProductForMovement(null)
    setMessage({ type: "success", text: "Movimiento registrado" })
    loadProducts()
  }

  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de desactivar este producto?")) return
    try {
      await productService.delete(id)
      setMessage({ type: "success", text: "Producto desactivado" })
      loadProducts()
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Error al eliminar" })
    }
  }

  const formatPrice = (n) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 2 }).format(n)

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
            Gestión de stock
          </Typography>
          <Typography variant="body2" sx={{ color: "#6b7280" }}>
            Productos del inventario. Crea, edita y registra movimientos de stock.
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <IconButton
            onClick={loadProducts}
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
            onClick={() => handleOpenProductDialog()}
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
            Nuevo producto
          </Button>
        </Box>
      </Box>

      {message.text && (
        <Alert severity={message.type} sx={{ mb: 3, borderRadius: "10px" }} onClose={() => setMessage({ type: "", text: "" })}>
          {message.text}
        </Alert>
      )}

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3 }}>
        <TextField
          size="small"
          placeholder="Buscar por nombre, código..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: "#9ca3af", fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
          sx={{ ...inputStyles, minWidth: 220 }}
        />
        <FormControl size="small" sx={{ ...inputStyles, minWidth: 180 }}>
          <InputLabel>Categoría</InputLabel>
          <Select
            value={categoryFilter}
            label="Categoría"
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <MenuItem value="">Todas</MenuItem>
            {categories.map((c) => (
              <MenuItem key={c} value={c}>{c}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="outlined"
          onClick={handleSearch}
          sx={{
            borderColor: "#d97706",
            color: "#d97706",
            borderRadius: "10px",
            textTransform: "none",
            fontWeight: 600,
            "&:hover": { borderColor: "#b45309", backgroundColor: "#fffbeb" },
          }}
        >
          Buscar
        </Button>
      </Box>

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
            minWidth: 800,
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
              <TableCell>Nombre / Código</TableCell>
              <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>Categoría</TableCell>
              <TableCell>P. venta</TableCell>
              <TableCell>Stock</TableCell>
              <TableCell>Unidad</TableCell>
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
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                  <Typography variant="body2" color="text.secondary">No hay productos</Typography>
                </TableCell>
              </TableRow>
            ) : (
              products.map((p) => (
                <TableRow key={p.id} hover sx={{ "&:hover": { backgroundColor: "#fafafa" }, "&:last-child .MuiTableCell-root": { borderBottom: "none" } }}>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>{p.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{p.code}</Typography>
                  </TableCell>
                  <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
                    {p.category ? <Chip label={p.category} size="small" sx={{ backgroundColor: "#f3f4f6", color: "#374151", fontSize: "0.75rem" }} /> : "—"}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: "#d97706", fontWeight: 600 }}>{formatPrice(p.sale_price)}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{Number(p.stock)}</Typography>
                    {p.min_stock != null && Number(p.stock) <= Number(p.min_stock) && (
                      <Chip label="Bajo" size="small" sx={{ mt: 0.5, backgroundColor: "#fef2f2", color: "#dc2626", fontSize: "0.7rem" }} />
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip label={p.unit === "kg" ? "kg" : "unidad"} size="small" sx={{ backgroundColor: "#fffbeb", color: "#92400e", fontSize: "0.75rem" }} />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleOpenMovementDialog(p)} sx={{ color: "#0ea5e9" }} title="Movimiento">
                      <SwapHoriz fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleOpenHistoryDialog(p)} sx={{ color: "#6b7280" }} title="Historial">
                      <HistoryIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleOpenProductDialog(p)} sx={{ color: "#d97706" }} title="Editar">
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(p.id)} sx={{ color: "#dc2626" }} title="Eliminar">
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <ProductFormDialog
        open={openProductDialog}
        onClose={() => { setOpenProductDialog(false); setEditingProduct(null) }}
        product={editingProduct}
        onSaved={handleProductSaved}
        inputStyles={inputStyles}
      />
      <MovementDialog
        open={openMovementDialog}
        onClose={() => { setOpenMovementDialog(false); setProductForMovement(null) }}
        product={productForMovement}
        onSaved={handleMovementSaved}
        inputStyles={inputStyles}
      />
      <HistoryDialog
        open={openHistoryDialog}
        onClose={() => { setOpenHistoryDialog(false); setProductForHistory(null) }}
        product={productForHistory}
      />
    </Box>
  )
}

export default ProductsStockTab
