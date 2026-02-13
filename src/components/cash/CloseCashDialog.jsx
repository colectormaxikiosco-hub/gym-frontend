"use client"

import { useState, useMemo } from "react"
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
  AttachMoney,
  Warning,
  CheckCircle,
  Notes,
  ShoppingCart,
  CardMembership,
  TrendingUp,
  TrendingDown,
  AccountBalance,
  CreditCard,
  Money,
  EditNote,
} from "@mui/icons-material"
import { NumericFormat } from "react-number-format"

const PAYMENT_METHOD_ORDER = ["cash", "transfer", "credit_card"]
const PAYMENT_LABELS = { cash: "Efectivo", transfer: "Transferencia", credit_card: "Tarjeta" }

function normalizePaymentMethod(value) {
  if (value == null || value === "") return "cash"
  const v = String(value).trim().toLowerCase().replace(/\s+/g, "_")
  if (v === "transfer" || v === "transferencia") return "transfer"
  if (v === "credit_card" || v === "creditcard" || v === "tarjeta" || v === "card") return "credit_card"
  return "cash"
}

function getPaymentIcon(method) {
  switch (method) {
    case "cash":
      return <Money sx={{ fontSize: 18, color: "#6b7280" }} />
    case "transfer":
      return <AccountBalance sx={{ fontSize: 18, color: "#6b7280" }} />
    case "credit_card":
      return <CreditCard sx={{ fontSize: 18, color: "#6b7280" }} />
    default:
      return <Money sx={{ fontSize: 18, color: "#6b7280" }} />
  }
}

function SectionCard({ title, icon, children, borderColor }) {
  return (
    <Box
      sx={{
        borderRadius: "12px",
        border: "1px solid",
        borderColor: borderColor || "#e5e7eb",
        overflow: "hidden",
        backgroundColor: "#fff",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: "1px solid #f3f4f6",
          display: "flex",
          alignItems: "center",
          gap: 1,
          backgroundColor: "#fafafa",
        }}
      >
        {icon}
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#111827" }}>
          {title}
        </Typography>
      </Box>
      <Box sx={{ p: 2, flex: 1, overflow: "auto" }}>{children}</Box>
    </Box>
  )
}

function MethodRow({ method, amount, color }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 0.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {getPaymentIcon(method)}
        <Typography variant="body2" color="text.secondary">
          {PAYMENT_LABELS[method] || method}
        </Typography>
      </Box>
      <NumericFormat
        value={amount}
        displayType="text"
        thousandSeparator="."
        decimalSeparator=","
        prefix="$ "
        decimalScale={2}
        fixedDecimalScale
        renderText={(value) => (
          <Typography variant="body2" fontWeight={600} sx={{ color: color || "#111827" }}>
            {value}
          </Typography>
        )}
      />
    </Box>
  )
}

export default function CloseCashDialog({
  open,
  onClose,
  onSubmit,
  currentSession,
  currentBalance,
  initialAmount,
  totalIncome,
  totalExpense,
}) {
  const [closingCash, setClosingCash] = useState("")
  const [closingTransfer, setClosingTransfer] = useState("")
  const [closingCard, setClosingCard] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const movements = currentSession?.movements || []
  const openingAmount = Number(initialAmount ?? currentSession?.opening_amount ?? 0)
  const totalIngresos = Number(totalIncome ?? 0)
  const totalEgresos = Number(totalExpense ?? 0)

  const breakdown = useMemo(() => {
    const salesIncome = {}
    const salesExpense = {}
    const membershipIncome = {}
    const membershipExpense = {}
    const manualIncome = {}
    const manualExpense = {}
    const membershipByPlan = {}
    const incomeByMethod = { cash: 0, transfer: 0, credit_card: 0 }
    const expenseByMethod = { cash: 0, transfer: 0, credit_card: 0 }

    movements.forEach((m) => {
      const amount = Math.round((Number.parseFloat(m.amount) || 0) * 100) / 100
      const method = normalizePaymentMethod(m.payment_method)

      if (m.type === "sale") {
        salesIncome[method] = (salesIncome[method] || 0) + amount
        incomeByMethod[method] += amount
      } else if (m.type === "membership_payment") {
        membershipIncome[method] = (membershipIncome[method] || 0) + amount
        incomeByMethod[method] += amount
        const planName = m.description && m.description.includes(" - ") ? m.description.split(" - ")[1]?.trim() || "Otro" : "Otro"
        membershipByPlan[planName] = (membershipByPlan[planName] || 0) + amount
      } else if (m.type === "income") {
        manualIncome[method] = (manualIncome[method] || 0) + amount
        incomeByMethod[method] += amount
      } else if (m.type === "expense") {
        expenseByMethod[method] += amount
        const desc = (m.description || "").toLowerCase()
        if (desc.includes("cancelación venta") || desc.includes("cancelacion venta")) {
          salesExpense[method] = (salesExpense[method] || 0) + amount
        } else if (desc.includes("cancelación membresía") || desc.includes("cancelacion membresia")) {
          membershipExpense[method] = (membershipExpense[method] || 0) + amount
        } else {
          manualExpense[method] = (manualExpense[method] || 0) + amount
        }
      }
    })

    const round2 = (n) => Math.round(Number(n) * 100) / 100
    const expectedCash = round2(openingAmount + incomeByMethod.cash - expenseByMethod.cash)
    const expectedTransfer = round2(incomeByMethod.transfer - expenseByMethod.transfer)
    const expectedCard = round2(incomeByMethod.credit_card - expenseByMethod.credit_card)

    return {
      salesIncome,
      salesExpense,
      membershipIncome,
      membershipExpense,
      manualIncome,
      manualExpense,
      membershipByPlan: Object.entries(membershipByPlan).sort((a, b) => b[1] - a[1]),
      expectedCash,
      expectedTransfer,
      expectedCard,
    }
  }, [movements, openingAmount])

  const enteredCash = Number.parseFloat(closingCash) || 0
  const enteredTransfer = Number.parseFloat(closingTransfer) || 0
  const enteredCard = Number.parseFloat(closingCard) || 0
  const totalEntered = enteredCash + enteredTransfer + enteredCard
  const difference = totalEntered > 0 ? totalEntered - currentBalance : 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (totalEntered <= 0) {
      setError("Ingresá al menos un monto (efectivo, transferencia y/o tarjeta)")
      return
    }

    try {
      setLoading(true)
      await onSubmit({
        closing_amount: totalEntered,
        closing_cash: enteredCash || null,
        closing_transfer: enteredTransfer || null,
        closing_card: enteredCard || null,
        notes: notes.trim() || null,
      })
      setClosingCash("")
      setClosingTransfer("")
      setClosingCard("")
      setNotes("")
    } catch (err) {
      setError(err.response?.data?.message || "Error al cerrar caja")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setClosingCash("")
    setClosingTransfer("")
    setClosingCard("")
    setNotes("")
    setError("")
    onClose()
  }

  const renderMethodBlock = (incomeObj, expenseObj, colorIncome, colorExpense) => (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Box>
        <Typography variant="caption" sx={{ color: "#6b7280", fontWeight: 600, display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
          <TrendingUp sx={{ fontSize: 14 }} /> Ingresos
        </Typography>
        {PAYMENT_METHOD_ORDER.map((method) => {
          const val = incomeObj[method]
          if (!val || val <= 0) return null
          return <MethodRow key={method} method={method} amount={val} color={colorIncome} />
        })}
        {Object.keys(incomeObj).filter((k) => !PAYMENT_METHOD_ORDER.includes(k)).length === 0 &&
          Object.values(incomeObj).every((v) => !v || v <= 0) && (
            <Typography variant="caption" color="text.secondary">Sin ingresos</Typography>
          )}
      </Box>
      <Box>
        <Typography variant="caption" sx={{ color: "#6b7280", fontWeight: 600, display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
          <TrendingDown sx={{ fontSize: 14 }} /> Egresos
        </Typography>
        {PAYMENT_METHOD_ORDER.map((method) => {
          const val = expenseObj[method]
          if (!val || val <= 0) return null
          return <MethodRow key={method} method={method} amount={val} color={colorExpense} />
        })}
        {Object.values(expenseObj).every((v) => !v || v <= 0) && (
          <Typography variant="caption" color="text.secondary">Sin egresos</Typography>
        )}
      </Box>
    </Box>
  )

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: { xs: "16px", sm: "20px" },
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
          m: { xs: 2, sm: 3 },
          maxWidth: 960,
          maxHeight: { xs: "calc(100vh - 32px)", sm: "calc(100vh - 48px)" },
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: { xs: 2.5, sm: 3 },
          py: 2,
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700, color: "#111827", fontSize: "1.25rem" }}>
          Cerrar Caja
        </Typography>
        <IconButton onClick={handleClose} size="small" sx={{ color: "#9ca3af", "&:hover": { backgroundColor: "#f3f4f6" } }} aria-label="Cerrar">
          <Close />
        </IconButton>
      </Box>

      <DialogContent sx={{ px: { xs: 2.5, sm: 3 }, py: 2, overflowX: "hidden" }}>
        <Box component="form" onSubmit={handleSubmit}>
          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: "10px" }} onClose={() => setError("")}>
              {error}
            </Alert>
          )}

          {/* Dos secciones: Ventas | Membresías */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 2,
              mb: 2,
            }}
          >
            <SectionCard
              title="Ventas"
              icon={<ShoppingCart sx={{ fontSize: 20, color: "#d97706" }} />}
              borderColor="#fde68a"
            >
              {renderMethodBlock(breakdown.salesIncome, breakdown.salesExpense, "#16a34a", "#dc2626")}
            </SectionCard>
            <SectionCard
              title="Membresías"
              icon={<CardMembership sx={{ fontSize: 20, color: "#2563eb" }} />}
              borderColor="#bfdbfe"
            >
              {renderMethodBlock(breakdown.membershipIncome, breakdown.membershipExpense, "#16a34a", "#dc2626")}
              {breakdown.membershipByPlan.length > 0 && (
                <Box sx={{ mt: 1.5, pt: 1.5, borderTop: "1px solid #f3f4f6" }}>
                  <Typography variant="caption" sx={{ color: "#6b7280", fontWeight: 600, display: "block", mb: 0.75 }}>
                    Por plan
                  </Typography>
                  {breakdown.membershipByPlan.map(([planName, amount]) => (
                    <Box key={planName} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 0.25 }}>
                      <Typography variant="body2" color="text.secondary">{planName}</Typography>
                      <NumericFormat
                        value={amount}
                        displayType="text"
                        thousandSeparator="."
                        decimalSeparator=","
                        prefix="$ "
                        decimalScale={2}
                        fixedDecimalScale
                        renderText={(value) => (
                          <Typography variant="body2" fontWeight={600} sx={{ color: "#16a34a" }}>{value}</Typography>
                        )}
                      />
                    </Box>
                  ))}
                </Box>
              )}
            </SectionCard>
          </Box>

          {/* Ingresos y egresos manuales (desde caja, no ventas ni membresías) */}
          {(Object.values(breakdown.manualIncome).some((v) => v > 0) || Object.values(breakdown.manualExpense).some((v) => v > 0)) && (
            <Box sx={{ mb: 2 }}>
              <SectionCard
                title="Ingresos y egresos manuales"
                icon={<EditNote sx={{ fontSize: 20, color: "#6b7280" }} />}
                borderColor="#e5e7eb"
              >
                <Typography variant="caption" sx={{ color: "#6b7280", display: "block", mb: 1 }}>
                  Registrados manualmente desde caja (no son ventas ni membresías)
                </Typography>
                {renderMethodBlock(breakdown.manualIncome, breakdown.manualExpense, "#16a34a", "#dc2626")}
              </SectionCard>
            </Box>
          )}

          {/* Sección general */}
          <Box
            sx={{
              backgroundColor: "#fffbeb",
              borderRadius: "12px",
              border: "1px solid #fde68a",
              p: 2,
              mb: 2,
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#92400e", mb: 1.5 }}>
              Resumen general
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="body2" color="text.secondary">Monto inicial:</Typography>
                <NumericFormat
                  value={openingAmount}
                  displayType="text"
                  thousandSeparator="."
                  decimalSeparator=","
                  prefix="$ "
                  decimalScale={2}
                  fixedDecimalScale
                  renderText={(v) => <Typography variant="body2" fontWeight={600}>{v}</Typography>}
                />
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="body2" color="text.secondary">Total ingresos:</Typography>
                <NumericFormat
                  value={totalIngresos}
                  displayType="text"
                  thousandSeparator="."
                  decimalSeparator=","
                  prefix="$ "
                  decimalScale={2}
                  fixedDecimalScale
                  renderText={(v) => <Typography variant="body2" fontWeight={600} sx={{ color: "#16a34a" }}>{v}</Typography>}
                />
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="body2" color="text.secondary">Total egresos:</Typography>
                <NumericFormat
                  value={totalEgresos}
                  displayType="text"
                  thousandSeparator="."
                  decimalSeparator=","
                  prefix="$ "
                  decimalScale={2}
                  fixedDecimalScale
                  renderText={(v) => <Typography variant="body2" fontWeight={600} sx={{ color: "#dc2626" }}>{v}</Typography>}
                />
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="body2" fontWeight={600}>Balance esperado:</Typography>
                <NumericFormat
                  value={currentBalance}
                  displayType="text"
                  thousandSeparator="."
                  decimalSeparator=","
                  prefix="$ "
                  decimalScale={2}
                  fixedDecimalScale
                  renderText={(v) => <Typography variant="body2" fontWeight={700} sx={{ color: "#d97706" }}>{v}</Typography>}
                />
              </Box>
            </Box>
          </Box>

          {/* Montos por método para cierre */}
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#111827", mb: 1.5 }}>
            Monto con el que cerramos
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
              gap: 2,
              mb: 2,
            }}
          >
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                Efectivo <Typography component="span" sx={{ fontWeight: 600, color: "#374151" }}>(esperado: $ {breakdown.expectedCash.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</Typography>
              </Typography>
              <NumericFormat
                value={closingCash}
                onValueChange={(v) => setClosingCash(v.value)}
                thousandSeparator="."
                decimalSeparator=","
                decimalScale={2}
                allowNegative={false}
                customInput={TextField}
                fullWidth
                size="small"
                placeholder="$ 0,00"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Money sx={{ color: "#9ca3af", fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", backgroundColor: "#fff" } }}
              />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                Transferencia <Typography component="span" sx={{ fontWeight: 600, color: "#374151" }}>(esperado: $ {breakdown.expectedTransfer.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</Typography>
              </Typography>
              <NumericFormat
                value={closingTransfer}
                onValueChange={(v) => setClosingTransfer(v.value)}
                thousandSeparator="."
                decimalSeparator=","
                decimalScale={2}
                allowNegative={false}
                customInput={TextField}
                fullWidth
                size="small"
                placeholder="$ 0,00"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AccountBalance sx={{ color: "#9ca3af", fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", backgroundColor: "#fff" } }}
              />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                Tarjeta <Typography component="span" sx={{ fontWeight: 600, color: "#374151" }}>(esperado: $ {breakdown.expectedCard.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</Typography>
              </Typography>
              <NumericFormat
                value={closingCard}
                onValueChange={(v) => setClosingCard(v.value)}
                thousandSeparator="."
                decimalSeparator=","
                decimalScale={2}
                allowNegative={false}
                customInput={TextField}
                fullWidth
                size="small"
                placeholder="$ 0,00"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CreditCard sx={{ color: "#9ca3af", fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", backgroundColor: "#fff" } }}
              />
            </Box>
          </Box>

          {/* Diferencia */}
          {totalEntered > 0 && (
            <Box
              sx={{
                p: 2,
                borderRadius: "10px",
                border: "1px solid",
                borderColor: Math.abs(difference) < 0.01 ? "#bbf7d0" : "#fde68a",
                backgroundColor: Math.abs(difference) < 0.01 ? "#f0fdf4" : "#fffbeb",
                mb: 2,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                {Math.abs(difference) < 0.01 ? (
                  <CheckCircle sx={{ fontSize: 22, color: "#16a34a" }} />
                ) : (
                  <Warning sx={{ fontSize: 22, color: "#d97706" }} />
                )}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight={600}>
                    {Math.abs(difference) < 0.01 ? "Cuadra perfecto" : "Diferencia"}
                  </Typography>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">
                      Total ingresado: $ {totalEntered.toLocaleString("es-AR", { minimumFractionDigits: 2 })} — {difference > 0 ? "Sobrante" : difference < 0 ? "Faltante" : "Sin diferencia"}:
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      sx={{
                        color: Math.abs(difference) < 0.01 ? "#16a34a" : difference > 0 ? "#16a34a" : "#dc2626",
                      }}
                    >
                      $ {Math.abs(difference).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}

          {/* Notas */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 500, color: "#374151", mb: 1 }}>Notas (opcional)</Typography>
            <TextField
              fullWidth
              size="small"
              multiline
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observaciones sobre el cierre..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start" sx={{ alignSelf: "flex-start", mt: 1 }}>
                    <Notes sx={{ color: "#9ca3af", fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", backgroundColor: "#fff" } }}
            />
          </Box>

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
                "&:hover": { borderColor: "#9ca3af", backgroundColor: "#f9fafb" },
              }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={{
                backgroundColor: "#dc2626",
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 600,
                "&:hover": { backgroundColor: "#b91c1c" },
                "&:disabled": { backgroundColor: "#d1d5db" },
              }}
            >
              {loading ? "Cerrando..." : "Cerrar Caja"}
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  )
}
