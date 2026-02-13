"use client"

import { useState } from "react"
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
import { Close, AttachMoney } from "@mui/icons-material"
import { NumericFormat } from "react-number-format"

export default function OpenCashDialog({ open, onClose, onSubmit }) {
  const [amount, setAmount] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    const numericAmount = amount === "" || amount === undefined ? 0 : Number.parseFloat(amount)

    if (isNaN(numericAmount) || numericAmount < 0) {
      setError("El monto inicial no puede ser negativo")
      return
    }

    try {
      setLoading(true)
      await onSubmit(numericAmount)
      setAmount("")
    } catch (err) {
      setError(err.response?.data?.message || "Error al abrir caja")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setAmount("")
    setError("")
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: { xs: "16px", sm: "20px" },
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
          m: { xs: 2, sm: 3 },
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
            Abrir Caja
          </Typography>
          <Typography variant="body2" sx={{ color: "#6b7280", mt: 0.25 }}>
            Inicia una nueva sesión de caja
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

          <Box sx={{ mb: 3 }}>
            <Typography
              variant="body2"
              sx={{ fontWeight: 500, color: "#374151", mb: 1 }}
            >
              Monto Inicial *
            </Typography>
            <NumericFormat
              value={amount}
              onValueChange={(values) => setAmount(values.value)}
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
            <Typography variant="caption" sx={{ color: "#9ca3af", mt: 1, display: "block" }}>
              Ingresa el monto con el que inicias la caja
            </Typography>
          </Box>

          {/* Footer buttons inside form for submit */}
          <Box
            sx={{
              display: "flex",
              gap: 1.5,
              pt: 1,
            }}
          >
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
              disabled={loading}
              startIcon={!loading && <AttachMoney />}
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
              {loading ? "Abriendo..." : "Abrir Caja"}
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  )
}
