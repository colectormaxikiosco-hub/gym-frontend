"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Alert,
  TextField,
  InputAdornment,
  Button,
} from "@mui/material"
import {
  Close,
  AttachMoney,
  TrendingUp,
  TrendingDown,
  Add,
  AccountBalance,
  CreditCard,
  Receipt,
  Description,
} from "@mui/icons-material"
import { NumericFormat } from "react-number-format"
import currentAccountService from "../../services/currentAccountService"

export default function CurrentAccountDialog({ open, onClose, client }) {
  const [loading, setLoading] = useState(true)
  const [account, setAccount] = useState(null)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [paymentData, setPaymentData] = useState({
    amount: "",
    payment_method: "cash",
    description: "",
  })
  const [error, setError] = useState("")

  useEffect(() => {
    if (open && client) {
      loadAccount()
      setShowPaymentForm(false)
      setPaymentData({ amount: "", payment_method: "cash", description: "" })
    }
  }, [open, client?.id])

  const loadAccount = async () => {
    try {
      setLoading(true)
      setError("")
      const response = await currentAccountService.getClientAccount(client.id)
      setAccount(response.data.data)
    } catch (error) {
      if (!error.cancelled) {
        setError("Error al cargar la cuenta corriente")
      }
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError("")

      await currentAccountService.registerPayment(client.id, {
        amount: Number.parseFloat(paymentData.amount),
        payment_method: paymentData.payment_method,
        description: paymentData.description || "Pago de cuenta corriente",
      })

      setPaymentData({ amount: "", payment_method: "cash", description: "" })
      setShowPaymentForm(false)
      await loadAccount()
    } catch (error) {
      setError(error.response?.data?.message || "Error al registrar el pago")
    } finally {
      setLoading(false)
    }
  }

  const getMovementIcon = (type) => {
    return type === "debit" ? (
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: "8px",
          backgroundColor: "#fef2f2",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <TrendingDown sx={{ fontSize: 18, color: "#dc2626" }} />
      </Box>
    ) : (
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: "8px",
          backgroundColor: "#f0fdf4",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <TrendingUp sx={{ fontSize: 18, color: "#16a34a" }} />
      </Box>
    )
  }

  const getPaymentMethodLabel = (method) => {
    const methods = {
      cash: "Efectivo",
      transfer: "Transferencia",
      credit_card: "Tarjeta",
    }
    return methods[method] || method
  }

  const balance = account?.balance || 0
  const hasDebt = balance > 0

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
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
            Cuenta Corriente
          </Typography>
          <Typography variant="body2" sx={{ color: "#6b7280", mt: 0.25 }}>
            {client?.name} • DNI: {client?.dni || "-"}
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
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
        {error && (
          <Alert
            severity="error"
            sx={{ mb: 3, borderRadius: "10px" }}
            onClose={() => setError("")}
          >
            {error}
          </Alert>
        )}

        {loading && !account ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 8 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                border: "3px solid #e5e7eb",
                borderTopColor: "#d97706",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                "@keyframes spin": {
                  "0%": { transform: "rotate(0deg)" },
                  "100%": { transform: "rotate(360deg)" },
                },
              }}
            />
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Balance Card */}
            <Box
              sx={{
                background: hasDebt
                  ? "linear-gradient(135deg, #fef2f2 0%, #fff7ed 100%)"
                  : "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)",
                border: hasDebt ? "1px solid #fecaca" : "1px solid #bbf7d0",
                borderRadius: "16px",
                p: { xs: 2.5, sm: 3 },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  alignItems: { xs: "flex-start", sm: "center" },
                  justifyContent: "space-between",
                  gap: 2,
                }}
              >
                <Box>
                  <Typography
                    variant="body2"
                    sx={{ color: "#6b7280", fontWeight: 500, mb: 0.5 }}
                  >
                    Saldo Actual
                  </Typography>
                  <NumericFormat
                    value={balance}
                    displayType="text"
                    thousandSeparator="."
                    decimalSeparator=","
                    prefix="$ "
                    decimalScale={2}
                    fixedDecimalScale
                    renderText={(value) => (
                      <Typography
                        sx={{
                          fontSize: { xs: "1.75rem", sm: "2rem" },
                          fontWeight: 700,
                          color: hasDebt ? "#dc2626" : "#16a34a",
                          lineHeight: 1.2,
                        }}
                      >
                        {value}
                      </Typography>
                    )}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      color: hasDebt ? "#b91c1c" : "#15803d",
                      fontWeight: 500,
                      mt: 0.5,
                      display: "block",
                    }}
                  >
                    {hasDebt ? "Cliente con deuda pendiente" : "Sin deuda - Al día"}
                  </Typography>
                </Box>
                {hasDebt && !showPaymentForm && (
                  <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setShowPaymentForm(true)}
                    sx={{
                      backgroundColor: "#16a34a",
                      borderRadius: "10px",
                      textTransform: "none",
                      fontWeight: 600,
                      px: 2.5,
                      py: 1,
                      boxShadow: "0 1px 3px rgba(22, 163, 74, 0.3)",
                      "&:hover": {
                        backgroundColor: "#15803d",
                        boxShadow: "0 4px 12px rgba(22, 163, 74, 0.4)",
                      },
                    }}
                  >
                    Registrar Pago
                  </Button>
                )}
              </Box>
            </Box>

            {/* Payment Form */}
            {showPaymentForm && (
              <Box
                component="form"
                onSubmit={handlePayment}
                sx={{
                  backgroundColor: "#fafafa",
                  border: "1px solid #e5e7eb",
                  borderRadius: "16px",
                  p: { xs: 2.5, sm: 3 },
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 600, color: "#111827", mb: 2.5 }}
                >
                  Registrar Pago
                </Typography>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                  {/* Monto */}
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 500, color: "#374151", mb: 1 }}
                    >
                      Monto *
                    </Typography>
                    <NumericFormat
                      value={paymentData.amount}
                      onValueChange={(values) =>
                        setPaymentData((prev) => ({ ...prev, amount: values.value }))
                      }
                      thousandSeparator="."
                      decimalSeparator=","
                      prefix="$ "
                      decimalScale={2}
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
                          backgroundColor: "#fff",
                          "&:hover fieldset": { borderColor: "#d1d5db" },
                          "&.Mui-focused fieldset": {
                            borderColor: "#16a34a",
                            borderWidth: "1px",
                          },
                        },
                      }}
                    />
                  </Box>

                  {/* Método de Pago */}
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 500, color: "#374151", mb: 1 }}
                    >
                      Método de Pago *
                    </Typography>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, 1fr)",
                        gap: 1.5,
                      }}
                    >
                      {[
                        { id: "cash", label: "Efectivo", icon: AttachMoney, color: "#16a34a" },
                        { id: "transfer", label: "Transferencia", icon: AccountBalance, color: "#2563eb" },
                        { id: "credit_card", label: "Tarjeta", icon: CreditCard, color: "#7c3aed" },
                      ].map((method) => (
                        <Box
                          key={method.id}
                          onClick={() =>
                            setPaymentData((prev) => ({ ...prev, payment_method: method.id }))
                          }
                          sx={{
                            p: 1.5,
                            borderRadius: "10px",
                            border: "2px solid",
                            borderColor:
                              paymentData.payment_method === method.id
                                ? method.color
                                : "#e5e7eb",
                            backgroundColor:
                              paymentData.payment_method === method.id
                                ? `${method.color}10`
                                : "#fff",
                            cursor: "pointer",
                            transition: "all 0.2s",
                            textAlign: "center",
                            "&:hover": {
                              borderColor:
                                paymentData.payment_method === method.id
                                  ? method.color
                                  : "#d1d5db",
                            },
                          }}
                        >
                          <method.icon
                            sx={{
                              fontSize: 24,
                              color:
                                paymentData.payment_method === method.id
                                  ? method.color
                                  : "#9ca3af",
                            }}
                          />
                          <Typography
                            variant="caption"
                            sx={{
                              display: "block",
                              mt: 0.5,
                              fontWeight:
                                paymentData.payment_method === method.id ? 600 : 400,
                              color:
                                paymentData.payment_method === method.id
                                  ? method.color
                                  : "#6b7280",
                            }}
                          >
                            {method.label}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>

                  {/* Descripción */}
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 500, color: "#374151", mb: 1 }}
                    >
                      Descripción
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      value={paymentData.description}
                      onChange={(e) =>
                        setPaymentData((prev) => ({ ...prev, description: e.target.value }))
                      }
                      placeholder="Ej: Pago parcial de deuda"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Description sx={{ color: "#9ca3af", fontSize: 20 }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "10px",
                          backgroundColor: "#fff",
                          "&:hover fieldset": { borderColor: "#d1d5db" },
                          "&.Mui-focused fieldset": {
                            borderColor: "#16a34a",
                            borderWidth: "1px",
                          },
                        },
                      }}
                    />
                  </Box>

                  {/* Botones */}
                  <Box sx={{ display: "flex", gap: 1.5, pt: 1 }}>
                    <Button
                      type="button"
                      variant="outlined"
                      fullWidth
                      onClick={() => {
                        setShowPaymentForm(false)
                        setPaymentData({ amount: "", payment_method: "cash", description: "" })
                      }}
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
                      disabled={loading || !paymentData.amount}
                      sx={{
                        backgroundColor: "#16a34a",
                        borderRadius: "10px",
                        textTransform: "none",
                        fontWeight: 600,
                        boxShadow: "0 1px 3px rgba(22, 163, 74, 0.3)",
                        "&:hover": {
                          backgroundColor: "#15803d",
                        },
                        "&:disabled": {
                          backgroundColor: "#d1d5db",
                        },
                      }}
                    >
                      {loading ? "Procesando..." : "Confirmar Pago"}
                    </Button>
                  </Box>
                </Box>
              </Box>
            )}

            {/* Movements History */}
            <Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 2,
                }}
              >
                <Receipt sx={{ fontSize: 20, color: "#6b7280" }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#111827" }}>
                  Historial de Movimientos
                </Typography>
              </Box>

              {!account?.movements || account.movements.length === 0 ? (
                <Box
                  sx={{
                    textAlign: "center",
                    py: 6,
                    backgroundColor: "#fafafa",
                    borderRadius: "12px",
                    border: "1px dashed #e5e7eb",
                  }}
                >
                  <Receipt sx={{ fontSize: 40, color: "#d1d5db", mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">
                    No hay movimientos registrados
                  </Typography>
                </Box>
              ) : (
                <Box
                  sx={{
                    maxHeight: 320,
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                    pr: 0.5,
                    "&::-webkit-scrollbar": {
                      width: "6px",
                    },
                    "&::-webkit-scrollbar-track": {
                      backgroundColor: "#f3f4f6",
                      borderRadius: "3px",
                    },
                    "&::-webkit-scrollbar-thumb": {
                      backgroundColor: "#d1d5db",
                      borderRadius: "3px",
                      "&:hover": {
                        backgroundColor: "#9ca3af",
                      },
                    },
                  }}
                >
                  {account.movements.map((movement) => (
                    <Box
                      key={movement.id}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        p: 2,
                        backgroundColor: "#fafafa",
                        borderRadius: "12px",
                        border: "1px solid #f3f4f6",
                        transition: "all 0.2s",
                        "&:hover": {
                          backgroundColor: "#f5f5f5",
                          borderColor: "#e5e7eb",
                        },
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        {getMovementIcon(movement.type)}
                        <Box>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 500, color: "#111827" }}
                          >
                            {movement.description}
                          </Typography>
                          <Typography variant="caption" sx={{ color: "#6b7280" }}>
                            {new Date(movement.created_at).toLocaleDateString("es-AR", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                            {movement.payment_method &&
                              ` • ${getPaymentMethodLabel(movement.payment_method)}`}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ textAlign: "right" }}>
                        <NumericFormat
                          value={movement.amount}
                          displayType="text"
                          thousandSeparator="."
                          decimalSeparator=","
                          prefix={movement.type === "debit" ? "+ $ " : "- $ "}
                          decimalScale={2}
                          fixedDecimalScale
                          renderText={(value) => (
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 600,
                                color: movement.type === "debit" ? "#dc2626" : "#16a34a",
                              }}
                            >
                              {value}
                            </Typography>
                          )}
                        />
                        <Typography variant="caption" sx={{ color: "#9ca3af" }}>
                          Saldo: ${" "}
                          {Number.parseFloat(movement.balance).toLocaleString("es-AR", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        )}
      </DialogContent>

      {/* Footer */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          px: { xs: 2.5, sm: 3 },
          py: 2,
          borderTop: "1px solid #e5e7eb",
          backgroundColor: "#fafafa",
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            color: "#6b7280",
            borderColor: "#d1d5db",
            borderRadius: "10px",
            textTransform: "none",
            fontWeight: 500,
            px: 3,
            "&:hover": {
              borderColor: "#9ca3af",
              backgroundColor: "#f9fafb",
            },
          }}
        >
          Cerrar
        </Button>
      </Box>
    </Dialog>
  )
}
