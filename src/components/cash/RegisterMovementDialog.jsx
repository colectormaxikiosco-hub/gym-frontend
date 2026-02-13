"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  TextField,
  IconButton,
  Alert,
  InputAdornment,
} from "@mui/material"
import {
  Close,
  TrendingUp,
  TrendingDown,
  AttachMoney,
  AccountBalance,
  CreditCard,
  Description,
} from "@mui/icons-material"
import { NumericFormat } from "react-number-format"

export default function RegisterMovementDialog({ open, onClose, onSubmit, defaultType = "income" }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    type: defaultType,
    amount: "",
    payment_method: "cash",
    description: "",
  })

  useEffect(() => {
    if (open) {
      setFormData((prev) => ({ ...prev, type: defaultType }))
      setError("")
    }
  }, [open, defaultType])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const data = {
        ...formData,
        amount: Number.parseFloat(formData.amount),
      }
      await onSubmit(data)
      resetForm()
    } catch (err) {
      setError(err.response?.data?.message || "Error al registrar el movimiento")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      type: defaultType,
      amount: "",
      payment_method: "cash",
      description: "",
    })
    setError("")
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const paymentMethods = [
    { id: "cash", label: "Efectivo", icon: AttachMoney, color: "#16a34a" },
    { id: "transfer", label: "Transferencia", icon: AccountBalance, color: "#2563eb" },
    { id: "credit_card", label: "Tarjeta", icon: CreditCard, color: "#7c3aed" },
  ]

  return (
    <Dialog
      open={open}
      onClose={handleClose}
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
            Registrar Movimiento
          </Typography>
          <Typography variant="body2" sx={{ color: "#6b7280", mt: 0.25 }}>
            {formData.type === "income" ? "Agrega un ingreso a caja" : "Registra un egreso de caja"}
          </Typography>
        </Box>
        <IconButton
          onClick={handleClose}
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
        <Box component="form" onSubmit={handleSubmit}>
          {error && (
            <Alert
              severity="error"
              sx={{ mb: 3, borderRadius: "10px" }}
              onClose={() => setError("")}
            >
              {error}
            </Alert>
          )}

          {/* Tipo de Movimiento */}
          <Box sx={{ mb: 2.5 }}>
            <Typography
              variant="body2"
              sx={{ fontWeight: 500, color: "#374151", mb: 1 }}
            >
              Tipo de Movimiento *
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
              <Box
                onClick={() => setFormData({ ...formData, type: "income" })}
                sx={{
                  p: 2,
                  borderRadius: "10px",
                  border: "2px solid",
                  borderColor: formData.type === "income" ? "#16a34a" : "#e5e7eb",
                  backgroundColor: formData.type === "income" ? "#f0fdf4" : "#fff",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1.5,
                  "&:hover": {
                    borderColor: formData.type === "income" ? "#16a34a" : "#d1d5db",
                  },
                }}
              >
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "8px",
                    backgroundColor: formData.type === "income" ? "#16a34a" : "#d1d5db",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <TrendingUp sx={{ fontSize: 18, color: "#fff" }} />
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: formData.type === "income" ? "#166534" : "#6b7280",
                  }}
                >
                  Ingreso
                </Typography>
              </Box>

              <Box
                onClick={() => setFormData({ ...formData, type: "expense" })}
                sx={{
                  p: 2,
                  borderRadius: "10px",
                  border: "2px solid",
                  borderColor: formData.type === "expense" ? "#dc2626" : "#e5e7eb",
                  backgroundColor: formData.type === "expense" ? "#fef2f2" : "#fff",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1.5,
                  "&:hover": {
                    borderColor: formData.type === "expense" ? "#dc2626" : "#d1d5db",
                  },
                }}
              >
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "8px",
                    backgroundColor: formData.type === "expense" ? "#dc2626" : "#d1d5db",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <TrendingDown sx={{ fontSize: 18, color: "#fff" }} />
                </Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: formData.type === "expense" ? "#991b1b" : "#6b7280",
                  }}
                >
                  Egreso
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Monto */}
          <Box sx={{ mb: 2.5 }}>
            <Typography
              variant="body2"
              sx={{ fontWeight: 500, color: "#374151", mb: 1 }}
            >
              Monto *
            </Typography>
            <NumericFormat
              value={formData.amount}
              onValueChange={(values) => setFormData({ ...formData, amount: values.value })}
              thousandSeparator="."
              decimalSeparator=","
              prefix="$ "
              decimalScale={2}
              fixedDecimalScale
              allowNegative={false}
              customInput={TextField}
              fullWidth
              size="small"
              placeholder="$ 0,00"
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AttachMoney sx={{ color: "#9ca3af", fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "10px",
                  backgroundColor: "#fafafa",
                  "&:hover fieldset": { borderColor: "#d1d5db" },
                  "&.Mui-focused fieldset": { borderColor: "#d97706", borderWidth: "1px" },
                },
              }}
            />
          </Box>

          {/* Método de Pago */}
          <Box sx={{ mb: 2.5 }}>
            <Typography
              variant="body2"
              sx={{ fontWeight: 500, color: "#374151", mb: 1 }}
            >
              Método de Pago *
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1.5 }}>
              {paymentMethods.map((method) => (
                <Box
                  key={method.id}
                  onClick={() => setFormData({ ...formData, payment_method: method.id })}
                  sx={{
                    p: 1.5,
                    borderRadius: "10px",
                    border: "2px solid",
                    borderColor: formData.payment_method === method.id ? method.color : "#e5e7eb",
                    backgroundColor: formData.payment_method === method.id ? `${method.color}10` : "#fff",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    textAlign: "center",
                    "&:hover": {
                      borderColor: formData.payment_method === method.id ? method.color : "#d1d5db",
                    },
                  }}
                >
                  <method.icon
                    sx={{
                      fontSize: 24,
                      color: formData.payment_method === method.id ? method.color : "#9ca3af",
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      display: "block",
                      mt: 0.5,
                      fontWeight: formData.payment_method === method.id ? 600 : 400,
                      color: formData.payment_method === method.id ? method.color : "#6b7280",
                    }}
                  >
                    {method.label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Descripción */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="body2"
              sx={{ fontWeight: 500, color: "#374151", mb: 1 }}
            >
              Descripción *
            </Typography>
            <TextField
              fullWidth
              size="small"
              multiline
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Ej: Pago de servicios, Compra de equipamiento..."
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start" sx={{ alignSelf: "flex-start", mt: 1 }}>
                    <Description sx={{ color: "#9ca3af", fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "10px",
                  backgroundColor: "#fafafa",
                  "&:hover fieldset": { borderColor: "#d1d5db" },
                  "&.Mui-focused fieldset": { borderColor: "#d97706", borderWidth: "1px" },
                },
              }}
            />
          </Box>

          {/* Footer buttons */}
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <Button
              type="button"
              onClick={handleClose}
              variant="outlined"
              fullWidth
              disabled={loading}
              sx={{
                color: "#6b7280",
                borderColor: "#d1d5db",
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 500,
                "&:hover": {
                  borderColor: "#9ca3af",
                  backgroundColor: "#f9fafb",
                },
              }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading || !formData.amount || !formData.description}
              sx={{
                backgroundColor: "#d97706",
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 600,
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
              {loading ? "Registrando..." : "Registrar"}
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  )
}
