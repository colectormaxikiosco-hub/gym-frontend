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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  InputAdornment,
  Card,
  CardContent,
} from "@mui/material"
import {
  Refresh,
  Search,
  SwapHoriz,
  History as HistoryIcon,
  WarningAmber,
  Inventory2,
  TrendingDown,
} from "@mui/icons-material"
import productService from "../../services/productService"
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

const ALERT_TYPES = [
  { value: "all", label: "Todas las alertas" },
  { value: "out", label: "Sin stock" },
  { value: "low", label: "Bajo mínimo" },
  { value: "near", label: "Cerca del mínimo" },
]

const ProductAlertsTab = () => {
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState({ type: "", text: "" })
  const [alertTypeFilter, setAlertTypeFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [counts, setCounts] = useState({ out: 0, low: 0, near: 0 })
  const [list, setList] = useState([])
  const [categories, setCategories] = useState([])

  const [openMovementDialog, setOpenMovementDialog] = useState(false)
  const [productForMovement, setProductForMovement] = useState(null)
  const [openHistoryDialog, setOpenHistoryDialog] = useState(false)
  const [productForHistory, setProductForHistory] = useState(null)

  const loadAlerts = async () => {
    try {
      setLoading(true)
      const params = {}
      if (search.trim()) params.search = search.trim()
      if (categoryFilter.trim()) params.category = categoryFilter.trim()
      if (alertTypeFilter && alertTypeFilter !== "all") params.type = alertTypeFilter

      const res = await productService.getAlerts(params)

      const c = res.counts || { out: 0, low: 0, near: 0 }
      setCounts(c)

      let items = []
      if (res.data && !Array.isArray(res.data)) {
        const { outOfStock = [], lowStock = [], nearMin = [] } = res.data
        items = [...outOfStock, ...lowStock, ...nearMin]
      } else if (Array.isArray(res.data)) {
        items = res.data
      }
      setList(items)

      const cats = [...new Set(items.map((p) => p.category).filter(Boolean))].sort()
      setCategories(cats)
    } catch (err) {
      if (!err.cancelled) setMessage({ type: "error", text: "Error al cargar alertas" })
      setList([])
      setCounts({ out: 0, low: 0, near: 0 })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAlerts()
  }, [])

  const handleSearch = () => {
    loadAlerts()
  }

  const handleMovementSaved = () => {
    setOpenMovementDialog(false)
    setProductForMovement(null)
    setMessage({ type: "success", text: "Movimiento registrado" })
    loadAlerts()
  }

  const formatStock = (stock, unit) => {
    const n = Number(stock)
    if (unit === "kg") return `${n.toFixed(2)} kg`
    return `${n} ${unit === "kg" ? "kg" : "un."}`
  }

  const getAlertChip = (alert_type) => {
    const config = {
      out: { label: "Sin stock", color: "#dc2626", bg: "#fef2f2", icon: <Inventory2 sx={{ fontSize: 14, mr: 0.25 }} /> },
      low: { label: "Bajo mínimo", color: "#ea580c", bg: "#fff7ed", icon: <TrendingDown sx={{ fontSize: 14, mr: 0.25 }} /> },
      near: { label: "Cerca del mínimo", color: "#ca8a04", bg: "#fefce8", icon: <WarningAmber sx={{ fontSize: 14, mr: 0.25 }} /> },
    }
    const c = config[alert_type] || config.out
    return (
      <Chip
        size="small"
        label={c.label}
        icon={c.icon}
        sx={{
          backgroundColor: c.bg,
          color: c.color,
          fontWeight: 600,
          fontSize: "0.7rem",
          "& .MuiChip-icon": { color: "inherit" },
        }}
      />
    )
  }

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, flexWrap: "wrap", gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: "#111827", mb: 0.5 }}>
            Alertas de stock
          </Typography>
          <Typography variant="body2" sx={{ color: "#6b7280" }}>
            Productos sin stock, bajo mínimo o cerca de agotarse según el stock mínimo configurado.
          </Typography>
        </Box>
        <IconButton
          onClick={loadAlerts}
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
      </Box>

      {message.text && (
        <Alert severity={message.type} sx={{ mb: 3, borderRadius: "10px" }} onClose={() => setMessage({ type: "", text: "" })}>
          {message.text}
        </Alert>
      )}

      <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2, mb: 3 }}>
        <Card variant="outlined" sx={{ flex: 1, borderColor: "#fecaca", backgroundColor: "#fef2f2", borderRadius: "12px" }}>
          <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", fontWeight: 600 }}>
              Sin stock
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: "#dc2626" }}>
              {counts.out}
            </Typography>
          </CardContent>
        </Card>
        <Card variant="outlined" sx={{ flex: 1, borderColor: "#fed7aa", backgroundColor: "#fff7ed", borderRadius: "12px" }}>
          <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", fontWeight: 600 }}>
              Bajo mínimo
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: "#ea580c" }}>
              {counts.low}
            </Typography>
          </CardContent>
        </Card>
        <Card variant="outlined" sx={{ flex: 1, borderColor: "#fde047", backgroundColor: "#fefce8", borderRadius: "12px" }}>
          <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", fontWeight: 600 }}>
              Cerca del mínimo
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color: "#ca8a04" }}>
              {counts.near}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3 }}>
        <FormControl size="small" sx={{ ...inputStyles, minWidth: 200 }}>
          <InputLabel>Tipo de alerta</InputLabel>
          <Select
            value={alertTypeFilter}
            label="Tipo de alerta"
            onChange={(e) => setAlertTypeFilter(e.target.value)}
          >
            {ALERT_TYPES.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
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
          <Select value={categoryFilter} label="Categoría" onChange={(e) => setCategoryFilter(e.target.value)}>
            <MenuItem value="">Todas</MenuItem>
            {categories.map((c) => (
              <MenuItem key={c} value={c}>{c}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="contained"
          onClick={handleSearch}
          sx={{
            backgroundColor: "#d97706",
            borderRadius: "10px",
            textTransform: "none",
            fontWeight: 600,
            "&:hover": { backgroundColor: "#b45309" },
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
              <TableCell>Estado</TableCell>
              <TableCell>Nombre / Código</TableCell>
              <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>Categoría</TableCell>
              <TableCell align="right">Stock actual</TableCell>
              <TableCell align="right">Mínimo</TableCell>
              <TableCell>Unidad</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                    <Box sx={{ width: 36, height: 36, border: "2px solid #e5e7eb", borderTopColor: "#d97706", borderRadius: "50%", animation: "spin 1s linear infinite", "@keyframes spin": { "0%": { transform: "rotate(0deg)" }, "100%": { transform: "rotate(360deg)" } } }} />
                    <Typography variant="body2" color="text.secondary">Cargando alertas...</Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : list.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                  <Typography variant="body2" color="text.secondary">
                    No hay productos que coincidan con los filtros. Ajustá la búsqueda o el tipo de alerta.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              list.map((p) => (
                <TableRow key={p.id} hover sx={{ "&:hover": { backgroundColor: "#fafafa" }, "&:last-child .MuiTableCell-root": { borderBottom: "none" } }}>
                  <TableCell>{getAlertChip(p.alert_type)}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>{p.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{p.code}</Typography>
                  </TableCell>
                  <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
                    {p.category ? <Chip label={p.category} size="small" sx={{ backgroundColor: "#f3f4f6", color: "#374151", fontSize: "0.75rem" }} /> : "—"}
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={600} sx={{ color: p.alert_type === "out" ? "#dc2626" : "inherit" }}>
                      {formatStock(p.stock, p.unit)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color="text.secondary">{formatStock(p.min_stock, p.unit)}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={p.unit === "kg" ? "kg" : "unidad"} size="small" sx={{ backgroundColor: "#fffbeb", color: "#92400e", fontSize: "0.75rem" }} />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => { setProductForMovement(p); setOpenMovementDialog(true) }} sx={{ color: "#0ea5e9" }} title="Registrar movimiento">
                      <SwapHoriz fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => { setProductForHistory(p); setOpenHistoryDialog(true) }} sx={{ color: "#6b7280" }} title="Historial">
                      <HistoryIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

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

export default ProductAlertsTab
