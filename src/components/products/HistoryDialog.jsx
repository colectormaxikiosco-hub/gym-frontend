"use client"

import { useState, useEffect } from "react"
import {
  Box,
  Typography,
  Dialog,
  DialogContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
} from "@mui/material"
import { Close } from "@mui/icons-material"
import productService from "../../services/productService"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { formatMovementQuantity } from "../../utils/formatProductQuantity"

const HistoryDialog = ({ open, onClose, product }) => {
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && product?.id) {
      setLoading(true)
      productService
        .getMovementsByProduct(product.id)
        .then((res) => setMovements(res.data || []))
        .catch(() => setMovements([]))
        .finally(() => setLoading(false))
    }
  }, [open, product?.id])

  if (!product) return null

  const formatDate = (d) => (d ? format(new Date(d), "dd/MM/yyyy HH:mm", { locale: es }) : "—")

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: { xs: "16px", sm: "20px" }, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", m: { xs: 2, sm: 3 }, maxHeight: "calc(100vh - 48px)" },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: { xs: 2.5, sm: 3 }, py: 2.5, borderBottom: "1px solid #e5e7eb" }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: "#111827", fontSize: "1.25rem" }}>
            Historial de movimientos
          </Typography>
          <Typography variant="body2" sx={{ color: "#6b7280", mt: 0.25 }}>
            {product.name} ({product.code})
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: "#9ca3af", "&:hover": { backgroundColor: "#f3f4f6", color: "#6b7280" } }} aria-label="Cerrar">
          <Close fontSize="small" />
        </IconButton>
      </Box>
      <DialogContent sx={{ px: { xs: 2.5, sm: 3 }, py: 2 }}>
        <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #e5e7eb", borderRadius: "12px" }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: "#fafafa", "& .MuiTableCell-head": { fontWeight: 600, color: "#374151", fontSize: "0.75rem" } }}>
                <TableCell>Fecha</TableCell>
                <TableCell>Tipo</TableCell>
                <TableCell align="right">Cantidad</TableCell>
                <TableCell>Usuario</TableCell>
                <TableCell>Observaciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">Cargando...</Typography>
                  </TableCell>
                </TableRow>
              ) : movements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">Sin movimientos</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                movements.map((m) => (
                  <TableRow key={m.id} hover>
                    <TableCell sx={{ fontSize: "0.8125rem" }}>{formatDate(m.created_at)}</TableCell>
                    <TableCell>
                      <Typography
                        component="span"
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: m.type === "entrada" ? "#166534" : m.type === "salida" ? "#dc2626" : "#92400e",
                        }}
                      >
                        {m.type === "entrada" ? "Entrada" : m.type === "salida" ? "Salida" : "Ajuste"}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 500 }}>
                      {formatMovementQuantity(m.quantity, product.unit)}
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.8125rem" }}>{m.created_by_name || "—"}</TableCell>
                    <TableCell sx={{ fontSize: "0.8125rem", maxWidth: 180 }} noWrap>
                      {m.notes || "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
    </Dialog>
  )
}

export default HistoryDialog
