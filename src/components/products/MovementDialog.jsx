"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogContent,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Alert,
  InputAdornment,
  Paper,
} from "@mui/material"
import { Close, SwapHoriz, Notes, TrendingUp, TrendingDown, Inventory2 } from "@mui/icons-material"
import productService from "../../services/productService"
import { formatQuantityWithUnit } from "../../utils/formatProductQuantity"

const MovementDialog = ({ open, onClose, product, onSaved, inputStyles }) => {
  const [error, setError] = useState("")
  const [type, setType] = useState("entrada")
  const [quantity, setQuantity] = useState("")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    if (open) {
      setError("")
      setType("entrada")
      setQuantity("")
      setNotes("")
    }
  }, [open])

  const currentStock = Number(product?.stock) || 0
  const unit = product?.unit || "unidad"
  const qtyNum = useMemo(() => {
    const v = Number(String(quantity).replace(",", "."))
    return Number.isNaN(v) ? 0 : v
  }, [quantity])
  const delta = useMemo(() => {
    if (type === "entrada") return Math.abs(qtyNum)
    if (type === "salida") return -Math.abs(qtyNum)
    return qtyNum // ajuste: puede ser + o -
  }, [type, qtyNum])
  const resultingStock = useMemo(() => Math.max(0, currentStock + delta), [currentStock, delta])
  const isValidMovement = type === "salida" ? currentStock + delta >= 0 : type === "ajuste" ? currentStock + delta >= 0 : true
  const showPreview = quantity !== "" && quantity !== "-" && quantity !== "."

  const handleSubmit = async () => {
    if (!product) return
    const qty = Number(quantity)
    if (isNaN(qty) || qty === 0) {
      setError("La cantidad no puede ser cero")
      return
    }
    if (type !== "ajuste" && qty <= 0) {
      setError("La cantidad debe ser mayor a 0")
      return
    }
    if (type === "salida" && qty > Number(product.stock)) {
      setError("No hay stock suficiente para esta salida")
      return
    }
    setError("")
    try {
      let sendQty = qty
      if (type === "salida") sendQty = -Math.abs(qty)
      else if (type === "entrada") sendQty = Math.abs(qty)
      await productService.createMovement({
        product_id: product.id,
        type,
        quantity: sendQty,
        notes: notes.trim() || null,
      })
      onSaved()
    } catch (err) {
      setError(err.response?.data?.message || "Error al registrar movimiento")
    }
  }

  if (!product) return null

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: { borderRadius: { xs: "16px", sm: "20px" }, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", m: { xs: 2, sm: 3 } },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: { xs: 2.5, sm: 3 }, py: 2.5, borderBottom: "1px solid #e5e7eb" }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: "#111827", fontSize: "1.25rem" }}>
            Movimiento de stock
          </Typography>
          <Typography variant="body2" sx={{ color: "#6b7280", mt: 0.25 }}>
            {product.name} ({product.code})
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: "#9ca3af", "&:hover": { backgroundColor: "#f3f4f6", color: "#6b7280" } }} aria-label="Cerrar">
          <Close fontSize="small" />
        </IconButton>
      </Box>
      <DialogContent sx={{ px: { xs: 2.5, sm: 3 }, py: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: "10px" }} onClose={() => setError("")}>{error}</Alert>
        )}

        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 2.5,
            backgroundColor: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
          }}
        >
          <Typography variant="subtitle2" sx={{ color: "#64748b", fontWeight: 600, mb: 1.5 }}>
            Resumen en tiempo real
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <Inventory2 sx={{ fontSize: 18, color: "#64748b" }} />
                Stock actual
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {formatQuantityWithUnit(currentStock, unit)}
              </Typography>
            </Box>
            {showPreview && (
              <>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                    {delta >= 0 ? <TrendingUp sx={{ fontSize: 18, color: "#166534" }} /> : <TrendingDown sx={{ fontSize: 18, color: "#dc2626" }} />}
                    Movimiento
                  </Typography>
                  <Typography variant="body2" fontWeight={600} sx={{ color: delta >= 0 ? "#166534" : "#dc2626" }}>
                    {delta >= 0 ? "+" : ""}{formatQuantityWithUnit(delta, unit)}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pt: 1, borderTop: "1px solid #e2e8f0" }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>
                    Stock resultante
                  </Typography>
                  <Typography variant="body2" fontWeight={700} sx={{ color: isValidMovement ? "#0ea5e9" : "#dc2626" }}>
                    {formatQuantityWithUnit(resultingStock, unit)}
                    {!isValidMovement && " (insuficiente)"}
                  </Typography>
                </Box>
              </>
            )}
          </Box>
        </Paper>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          <FormControl fullWidth size="small" sx={inputStyles}>
            <InputLabel>Tipo</InputLabel>
            <Select value={type} label="Tipo" onChange={(e) => setType(e.target.value)}>
              <MenuItem value="entrada">Entrada</MenuItem>
              <MenuItem value="salida">Salida</MenuItem>
              <MenuItem value="ajuste">Ajuste</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Cantidad"
            type="number"
            inputProps={{ min: type === "ajuste" ? undefined : 0, step: unit === "kg" ? 0.001 : 1 }}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            size="small"
            required
            placeholder={unit === "kg" ? "Ej: 2.5" : "Ej: 10"}
            helperText={type === "salida" ? "No puede superar el stock actual." : type === "ajuste" ? "Positivo suma, negativo resta al stock." : unit === "unidad" ? "Ingresá un número entero." : ""}
            InputProps={{ startAdornment: <InputAdornment position="start"><SwapHoriz sx={{ color: "#9ca3af", fontSize: 20 }} /></InputAdornment> }}
            sx={inputStyles}
          />
          <TextField
            fullWidth
            label="Observaciones (opcional)"
            multiline
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            size="small"
            InputProps={{ startAdornment: <InputAdornment position="start" sx={{ alignSelf: "flex-start", mt: 1 }}><Notes sx={{ color: "#9ca3af", fontSize: 20 }} /></InputAdornment> }}
            sx={inputStyles}
          />
        </Box>
      </DialogContent>
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5, px: { xs: 2.5, sm: 3 }, py: 2.5, borderTop: "1px solid #e5e7eb", backgroundColor: "#fafafa" }}>
        <Button onClick={onClose} variant="outlined" sx={{ color: "#6b7280", borderColor: "#d1d5db", borderRadius: "10px", textTransform: "none", fontWeight: 500, px: 3, "&:hover": { borderColor: "#9ca3af", backgroundColor: "#f9fafb" } }}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} variant="contained" sx={{ backgroundColor: "#d97706", borderRadius: "10px", textTransform: "none", fontWeight: 600, px: 3, boxShadow: "0 1px 3px rgba(217, 119, 6, 0.3)", "&:hover": { backgroundColor: "#b45309" } }}>
          Registrar movimiento
        </Button>
      </Box>
    </Dialog>
  )
}

export default MovementDialog
