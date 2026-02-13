"use client"

import { useState, useEffect } from "react"
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  Dialog,
  DialogContent,
  Chip,
  Alert,
} from "@mui/material"
import { Refresh, Visibility, Cancel as CancelIcon, WarningAmber, Close } from "@mui/icons-material"
import saleService from "../../services/saleService"
import cashService from "../../services/cashService"
import { format } from "date-fns"
import { es } from "date-fns/locale"

const formatPrice = (n) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 2 }).format(n)
const formatDate = (d) => (d ? format(new Date(d), "dd/MM/yyyy HH:mm", { locale: es }) : "—")

const paymentLabels = {
  cash: "Efectivo",
  transfer: "Transferencia",
  credit_card: "Tarjeta",
  current_account: "Cuenta corriente",
}

const SalesHistoryTab = () => {
  const [sales, setSales] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [paymentFilter, setPaymentFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [detailSale, setDetailSale] = useState(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [activeSessionId, setActiveSessionId] = useState(null)
  const [cancelSale, setCancelSale] = useState(null)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const loadSales = async (page = 1) => {
    try {
      setLoading(true)
      const params = { page, limit: 10 }
      if (dateFrom) params.date_from = dateFrom
      if (dateTo) params.date_to = dateTo
      if (paymentFilter) params.payment_method = paymentFilter
      if (statusFilter) params.status = statusFilter
      const { data, pagination: resPag } = await saleService.getAll(params)
      setSales(data)
      setPagination(resPag)
    } catch {
      setSales([])
    } finally {
      setLoading(false)
    }
  }

  const loadActiveSession = async () => {
    try {
      const res = await cashService.getActiveSession()
      setActiveSessionId(res?.data?.id ?? null)
    } catch {
      setActiveSessionId(null)
    }
  }

  useEffect(() => {
    loadSales()
  }, [])

  useEffect(() => {
    loadActiveSession()
  }, [sales])

  const handleSearch = () => loadSales(1)
  const handleViewDetail = async (sale) => {
    try {
      const res = await saleService.getById(sale.id)
      setDetailSale(res.data)
      setDetailOpen(true)
    } catch {
      setDetailSale(null)
    }
  }

  const canCancelSale = (sale) =>
    sale.status === "completed" &&
    sale.cash_session_id != null &&
    activeSessionId != null &&
    sale.cash_session_id === activeSessionId

  const handleOpenCancelDialog = (sale) => {
    setCancelSale(sale)
    setCancelDialogOpen(true)
    setError("")
  }

  const handleCloseCancelDialog = () => {
    if (!cancelLoading) {
      setCancelDialogOpen(false)
      setCancelSale(null)
      setError("")
    }
  }

  const handleConfirmCancel = async () => {
    if (!cancelSale) return
    setCancelLoading(true)
    setError("")
    try {
      await saleService.cancel(cancelSale.id)
      setSuccess("Venta cancelada correctamente. Se revirtió el stock y se descontó el monto de la caja.")
      handleCloseCancelDialog()
      loadSales(pagination.page)
      loadActiveSession()
      setTimeout(() => setSuccess(""), 4000)
    } catch (err) {
      setError(err.response?.data?.message || "Error al cancelar la venta")
    } finally {
      setCancelLoading(false)
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
      <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: "#111827" }}>
            Historial de ventas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Consultá todas las ventas realizadas
          </Typography>
        </Box>
        <IconButton onClick={() => loadSales(pagination.page)} size="small" sx={{ backgroundColor: "#f5f5f4", "&:hover": { backgroundColor: "#e7e5e4", color: "#d97706" } }} title="Actualizar">
          <Refresh fontSize="small" />
        </IconButton>
      </Box>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3 }}>
        <TextField
          size="small"
          label="Desde"
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={inputStyles}
        />
        <TextField
          size="small"
          label="Hasta"
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={inputStyles}
        />
        <FormControl size="small" sx={{ minWidth: 160, ...inputStyles }}>
          <InputLabel>Método de pago</InputLabel>
          <Select value={paymentFilter} label="Método de pago" onChange={(e) => setPaymentFilter(e.target.value)}>
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="cash">Efectivo</MenuItem>
            <MenuItem value="transfer">Transferencia</MenuItem>
            <MenuItem value="credit_card">Tarjeta</MenuItem>
            <MenuItem value="current_account">Cuenta corriente</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140, ...inputStyles }}>
          <InputLabel>Estado</InputLabel>
          <Select value={statusFilter} label="Estado" onChange={(e) => setStatusFilter(e.target.value)}>
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="completed">Completada</MenuItem>
            <MenuItem value="cancelled">Cancelada</MenuItem>
          </Select>
        </FormControl>
        <Button variant="contained" onClick={handleSearch} sx={{ backgroundColor: "#d97706", "&:hover": { backgroundColor: "#b45309" }, borderRadius: "10px", textTransform: "none" }}>
          Buscar
        </Button>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 2, borderRadius: "10px" }} onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: "10px" }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #e5e7eb", borderRadius: "12px", overflow: "auto" }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: "#fafafa", "& .MuiTableCell-head": { fontWeight: 600, color: "#374151", fontSize: "0.75rem", textTransform: "uppercase" } }}>
              <TableCell>Fecha</TableCell>
              <TableCell># Venta</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Pago</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Usuario</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  <Typography variant="body2" color="text.secondary">Cargando...</Typography>
                </TableCell>
              </TableRow>
            ) : sales.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  <Typography variant="body2" color="text.secondary">No hay ventas en el período seleccionado</Typography>
                </TableCell>
              </TableRow>
            ) : (
              sales.map((sale) => (
                <TableRow key={sale.id} hover sx={{ "&:hover": { backgroundColor: "#fafafa" }, opacity: sale.status === "cancelled" ? 0.85 : 1 }}>
                  <TableCell>{formatDate(sale.created_at)}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>#{sale.id}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600} sx={{ color: sale.status === "cancelled" ? "#9ca3af" : "#d97706" }}>{formatPrice(sale.total)}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={paymentLabels[sale.payment_method] || sale.payment_method}
                      sx={{ backgroundColor: "#fffbeb", color: "#92400e", fontWeight: 600, fontSize: "0.75rem" }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={sale.status === "cancelled" ? "Cancelada" : "Completada"}
                      sx={{
                        backgroundColor: sale.status === "cancelled" ? "#f3f4f6" : "#dcfce7",
                        color: sale.status === "cancelled" ? "#6b7280" : "#166534",
                        fontWeight: 600,
                        fontSize: "0.75rem",
                      }}
                    />
                  </TableCell>
                  <TableCell>{sale.user_name || "—"}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleViewDetail(sale)} sx={{ color: "#d97706" }} title="Ver detalle">
                      <Visibility fontSize="small" />
                    </IconButton>
                    {canCancelSale(sale) && (
                      <IconButton size="small" onClick={() => handleOpenCancelDialog(sale)} sx={{ color: "#dc2626" }} title="Cancelar venta">
                        <CancelIcon fontSize="small" />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {pagination.totalPages > 1 && (
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2, flexWrap: "wrap", gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Página {pagination.page} de {pagination.totalPages} · {pagination.total} ventas
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button size="small" disabled={pagination.page <= 1} onClick={() => loadSales(pagination.page - 1)} sx={{ textTransform: "none" }}>
              Anterior
            </Button>
            <Button size="small" disabled={pagination.page >= pagination.totalPages} onClick={() => loadSales(pagination.page + 1)} sx={{ textTransform: "none" }}>
              Siguiente
            </Button>
          </Box>
        </Box>
      )}

      <Dialog
        open={cancelDialogOpen}
        onClose={handleCloseCancelDialog}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px" } }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2.5, py: 2, borderBottom: "1px solid #e5e7eb" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box sx={{ width: 44, height: 44, borderRadius: "12px", backgroundColor: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <WarningAmber sx={{ color: "#dc2626", fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: "#111827", fontSize: "1.0625rem" }}>
                Cancelar venta
              </Typography>
              <Typography variant="body2" sx={{ color: "#6b7280", mt: 0.25 }}>
                Solo se puede cancelar si la venta es de la sesión de caja actual
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={handleCloseCancelDialog} size="small" disabled={cancelLoading} aria-label="Cerrar">
            <Close fontSize="small" />
          </IconButton>
        </Box>
        <DialogContent sx={{ py: 2.5 }}>
          {cancelSale && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Typography variant="body2" sx={{ color: "#374151" }}>
                ¿Cancelar la venta <strong>#{cancelSale.id}</strong> por {formatPrice(cancelSale.total)}?
              </Typography>
              <Typography variant="caption" sx={{ color: "#6b7280" }}>
                Se revierte el stock de productos y se descuenta el monto de la caja actual. Esta acción no se puede deshacer.
              </Typography>
              {error && (
                <Alert severity="error" sx={{ mt: 1 }} onClose={() => setError("")}>
                  {error}
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5, px: 2.5, py: 2, borderTop: "1px solid #e5e7eb" }}>
          <Button onClick={handleCloseCancelDialog} disabled={cancelLoading} variant="outlined" sx={{ textTransform: "none" }}>
            No
          </Button>
          <Button onClick={handleConfirmCancel} disabled={cancelLoading} variant="contained" color="error" sx={{ textTransform: "none" }}>
            {cancelLoading ? "Cancelando..." : "Sí, cancelar venta"}
          </Button>
        </Box>
      </Dialog>

      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "16px" } }}>
        <DialogContent sx={{ p: 0 }}>
          {detailSale && (
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2, flexWrap: "wrap" }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#111827" }}>
                  Venta #{detailSale.id}
                </Typography>
                <Chip
                  size="small"
                  label={detailSale.status === "cancelled" ? "Cancelada" : "Completada"}
                  sx={{
                    backgroundColor: detailSale.status === "cancelled" ? "#f3f4f6" : "#dcfce7",
                    color: detailSale.status === "cancelled" ? "#6b7280" : "#166534",
                    fontWeight: 600,
                    fontSize: "0.75rem",
                  }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {formatDate(detailSale.created_at)} · {detailSale.user_name || "—"} · {paymentLabels[detailSale.payment_method] || detailSale.payment_method}
              </Typography>
              <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #e5e7eb", borderRadius: "10px", mb: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "#fafafa" }}>
                      <TableCell>Producto</TableCell>
                      <TableCell align="right">Cant.</TableCell>
                      <TableCell align="right">P. unit.</TableCell>
                      <TableCell align="right">Subtotal</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(detailSale.items || []).map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.product_name} ({item.product_code})</TableCell>
                        <TableCell align="right">{item.quantity} {item.unit}</TableCell>
                        <TableCell align="right">{formatPrice(item.unit_price)}</TableCell>
                        <TableCell align="right">{formatPrice(item.subtotal)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
                {detailSale.discount > 0 && (
                  <Typography variant="body2" color="text.secondary">
                    Descuento: {formatPrice(detailSale.discount)}
                  </Typography>
                )}
                <Typography variant="h6" fontWeight={700} sx={{ color: "#d97706" }}>
                  Total: {formatPrice(detailSale.total)}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  )
}

export default SalesHistoryTab
