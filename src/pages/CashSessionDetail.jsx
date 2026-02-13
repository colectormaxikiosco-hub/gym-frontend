"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  Box,
  Typography,
  Button,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from "@mui/material"
import {
  ArrowBack,
  Person,
  TrendingUp,
  TrendingDown,
  Description,
  ShoppingCart,
  CardMembership,
  EditNote,
  AccountBalance,
  CreditCard,
  Money,
} from "@mui/icons-material"
import { NumericFormat } from "react-number-format"
import cashService from "../services/cashService"

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

export default function CashSessionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSessionDetail()
  }, [id])

  const loadSessionDetail = async () => {
    if (!id) {
      setLoading(false)
      setSession(null)
      return
    }
    try {
      setLoading(true)
      setSession(null)
      setMovements([])
      const response = await cashService.getSessionDetail(id)
      const body = response?.data
      const sessionPayload = body && typeof body === "object" && body.data !== undefined ? body.data : body
      if (!sessionPayload || sessionPayload.id == null) {
        setSession(null)
        setMovements([])
        return
      }
      const { movements: mov, ...sessionInfo } = sessionPayload
      setSession(sessionInfo)
      setMovements(Array.isArray(mov) ? mov : [])
    } catch (error) {
      if (!error.cancelled) {
        console.error("Error al cargar detalle:", error)
      }
      setSession(null)
      setMovements([])
    } finally {
      setLoading(false)
    }
  }

  const openingAmount = Number(session?.opening_amount ?? 0)
  const totalIngresos = Number(session?.total_income ?? 0)
  const totalEgresos = Number(session?.total_expenses ?? 0)
  const balanceEsperado = openingAmount + totalIngresos - totalEgresos

  const breakdown = useMemo(() => {
    const salesIncome = {}
    const salesExpense = {}
    const membershipIncome = {}
    const membershipExpense = {}
    const manualIncome = {}
    const manualExpense = {}
    const membershipByPlan = {}
    movements.forEach((m) => {
      const amount = Math.round((Number.parseFloat(m.amount) || 0) * 100) / 100
      const method = normalizePaymentMethod(m.payment_method)

      if (m.type === "sale") {
        salesIncome[method] = (salesIncome[method] || 0) + amount
      } else if (m.type === "membership_payment") {
        membershipIncome[method] = (membershipIncome[method] || 0) + amount
        const planName =
          m.description && m.description.includes(" - ")
            ? m.description.split(" - ")[1]?.trim() || "Otro"
            : "Otro"
        membershipByPlan[planName] = (membershipByPlan[planName] || 0) + amount
      } else if (m.type === "income") {
        manualIncome[method] = (manualIncome[method] || 0) + amount
      } else if (m.type === "expense") {
        const desc = (m.description || "").toLowerCase()
        if (desc.includes("cancelación venta") || desc.includes("cancelacion venta")) {
          salesExpense[method] = (salesExpense[method] || 0) + amount
        } else if (
          desc.includes("cancelación membresía") ||
          desc.includes("cancelacion membresia")
        ) {
          membershipExpense[method] = (membershipExpense[method] || 0) + amount
        } else {
          manualExpense[method] = (manualExpense[method] || 0) + amount
        }
      }
    })
    return {
      salesIncome,
      salesExpense,
      membershipIncome,
      membershipExpense,
      manualIncome,
      manualExpense,
      membershipByPlan: Object.entries(membershipByPlan).sort((a, b) => b[1] - a[1]),
    }
  }, [movements])

  const formatDate = (dateString) => {
    if (!dateString) return "-"
    const date = new Date(dateString)
    return date.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const formatTime = (dateString) => {
    if (!dateString) return "-"
    const date = new Date(dateString)
    return date.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getPaymentMethodLabel = (method) => PAYMENT_LABELS[normalizePaymentMethod(method)] || method || "-"

  const getMovementTypeLabel = (type) => {
    const types = {
      membership_payment: "Pago Membresía",
      income: "Ingreso",
      sale: "Venta",
      expense: "Egreso",
    }
    return types[type] || type || "-"
  }

  const getMovementChip = (type) => {
    const isIncome =
      type === "membership_payment" || type === "income" || type === "sale"
    return (
      <Chip
        label={getMovementTypeLabel(type)}
        size="small"
        sx={{
          backgroundColor: isIncome ? "#dcfce7" : "#fee2e2",
          color: isIncome ? "#166534" : "#991b1b",
          fontWeight: 600,
          fontSize: "0.75rem",
        }}
      />
    )
  }

  const renderMethodBlock = (incomeObj, expenseObj, colorIncome, colorExpense) => (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Box>
        <Typography
          variant="caption"
          sx={{
            color: "#6b7280",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            mb: 0.5,
          }}
        >
          <TrendingUp sx={{ fontSize: 14 }} /> Ingresos
        </Typography>
        {PAYMENT_METHOD_ORDER.map((method) => {
          const val = incomeObj[method]
          if (!val || val <= 0) return null
          return <MethodRow key={method} method={method} amount={val} color={colorIncome} />
        })}
        {Object.values(incomeObj).every((v) => !v || v <= 0) && (
          <Typography variant="caption" color="text.secondary">
            Sin ingresos
          </Typography>
        )}
      </Box>
      <Box>
        <Typography
          variant="caption"
          sx={{
            color: "#6b7280",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            mb: 0.5,
          }}
        >
          <TrendingDown sx={{ fontSize: 14 }} /> Egresos
        </Typography>
        {PAYMENT_METHOD_ORDER.map((method) => {
          const val = expenseObj[method]
          if (!val || val <= 0) return null
          return <MethodRow key={method} method={method} amount={val} color={colorExpense} />
        })}
        {Object.values(expenseObj).every((v) => !v || v <= 0) && (
          <Typography variant="caption" color="text.secondary">
            Sin egresos
          </Typography>
        )}
      </Box>
    </Box>
  )

  const hasManual =
    Object.values(breakdown.manualIncome).some((v) => v > 0) ||
    Object.values(breakdown.manualExpense).some((v) => v > 0)

  const hasClosingByMethod =
    session &&
    (session.closing_cash != null ||
      session.closing_transfer != null ||
      session.closing_card != null)

  if (loading) {
    return (
      <Box className="min-h-screen bg-gradient-to-br from-gray-50 via-amber-50/20 to-gray-50 flex items-center justify-center">
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              border: "2px solid #e5e7eb",
              borderTopColor: "#d97706",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              "@keyframes spin": {
                "0%": { transform: "rotate(0deg)" },
                "100%": { transform: "rotate(360deg)" },
              },
            }}
          />
          <Typography variant="body2" color="text.secondary">
            Cargando...
          </Typography>
        </Box>
      </Box>
    )
  }

  if (!session) {
    return (
      <Box className="min-h-screen bg-gradient-to-br from-gray-50 via-amber-50/20 to-gray-50 flex items-center justify-center">
        <Box sx={{ textAlign: "center", p: 4 }}>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            No se encontró la sesión
          </Typography>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => navigate("/caja/historial")}
            sx={{
              color: "#6b7280",
              borderColor: "#d1d5db",
              borderRadius: "10px",
              textTransform: "none",
              "&:hover": { borderColor: "#9ca3af", backgroundColor: "#f9fafb" },
            }}
          >
            Volver al historial
          </Button>
        </Box>
      </Box>
    )
  }

  return (
    <Box className="min-h-screen bg-gradient-to-br from-gray-50 via-amber-50/20 to-gray-50">
      <Box className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
          <IconButton
            onClick={() => navigate("/caja/historial")}
            size="small"
            sx={{
              color: "#78716c",
              backgroundColor: "#f5f5f4",
              "&:hover": { backgroundColor: "#e7e5e4", color: "#d97706" },
            }}
            aria-label="Volver al historial"
          >
            <ArrowBack fontSize="small" />
          </IconButton>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: "#111827",
                letterSpacing: "-0.02em",
                fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" },
              }}
            >
              Detalle de Sesión
            </Typography>
            <Typography variant="body1" sx={{ color: "#6b7280", fontWeight: 500, mt: 0.5 }}>
              {formatDate(session.opened_at)} • {formatTime(session.opened_at)} - {formatTime(session.closed_at)}
            </Typography>
          </Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Person sx={{ fontSize: 20, color: "#6b7280" }} />
              <Typography variant="body2" fontWeight={600} color="text.primary">
                {session.user_name || "-"}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Ventas | Membresías */}
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
            {renderMethodBlock(
              breakdown.membershipIncome,
              breakdown.membershipExpense,
              "#16a34a",
              "#dc2626"
            )}
            {breakdown.membershipByPlan.length > 0 && (
              <Box sx={{ mt: 1.5, pt: 1.5, borderTop: "1px solid #f3f4f6" }}>
                <Typography
                  variant="caption"
                  sx={{ color: "#6b7280", fontWeight: 600, display: "block", mb: 0.75 }}
                >
                  Por plan
                </Typography>
                {breakdown.membershipByPlan.map(([planName, amount]) => (
                  <Box
                    key={planName}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      py: 0.25,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      {planName}
                    </Typography>
                    <NumericFormat
                      value={amount}
                      displayType="text"
                      thousandSeparator="."
                      decimalSeparator=","
                      prefix="$ "
                      decimalScale={2}
                      fixedDecimalScale
                      renderText={(value) => (
                        <Typography variant="body2" fontWeight={600} sx={{ color: "#16a34a" }}>
                          {value}
                        </Typography>
                      )}
                    />
                  </Box>
                ))}
              </Box>
            )}
          </SectionCard>
        </Box>

        {/* Ingresos y egresos manuales */}
        {hasManual && (
          <Box sx={{ mb: 2 }}>
            <SectionCard
              title="Ingresos y egresos manuales"
              icon={<EditNote sx={{ fontSize: 20, color: "#6b7280" }} />}
              borderColor="#e5e7eb"
            >
              <Typography
                variant="caption"
                sx={{ color: "#6b7280", display: "block", mb: 1 }}
              >
                Registrados manualmente desde caja (no son ventas ni membresías)
              </Typography>
              {renderMethodBlock(
                breakdown.manualIncome,
                breakdown.manualExpense,
                "#16a34a",
                "#dc2626"
              )}
            </SectionCard>
          </Box>
        )}

        {/* Resumen general */}
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
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 2,
              alignItems: "center",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Monto inicial:
              </Typography>
              <NumericFormat
                value={openingAmount}
                displayType="text"
                thousandSeparator="."
                decimalSeparator=","
                prefix="$ "
                decimalScale={2}
                fixedDecimalScale
                renderText={(v) => (
                  <Typography variant="body2" fontWeight={600}>
                    {v}
                  </Typography>
                )}
              />
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Total ingresos:
              </Typography>
              <NumericFormat
                value={totalIngresos}
                displayType="text"
                thousandSeparator="."
                decimalSeparator=","
                prefix="$ "
                decimalScale={2}
                fixedDecimalScale
                renderText={(v) => (
                  <Typography variant="body2" fontWeight={600} sx={{ color: "#16a34a" }}>
                    {v}
                  </Typography>
                )}
              />
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Total egresos:
              </Typography>
              <NumericFormat
                value={totalEgresos}
                displayType="text"
                thousandSeparator="."
                decimalSeparator=","
                prefix="$ "
                decimalScale={2}
                fixedDecimalScale
                renderText={(v) => (
                  <Typography variant="body2" fontWeight={600} sx={{ color: "#dc2626" }}>
                    {v}
                  </Typography>
                )}
              />
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="body2" fontWeight={600}>
                Balance esperado:
              </Typography>
              <NumericFormat
                value={balanceEsperado}
                displayType="text"
                thousandSeparator="."
                decimalSeparator=","
                prefix="$ "
                decimalScale={2}
                fixedDecimalScale
                renderText={(v) => (
                  <Typography variant="body2" fontWeight={700} sx={{ color: "#d97706" }}>
                    {v}
                  </Typography>
                )}
              />
            </Box>
          </Box>
        </Box>

        {/* Monto con el que se cerró (si existe desglose) */}
        {hasClosingByMethod && (
          <Box
            sx={{
              backgroundColor: "#fff",
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
              p: 2,
              mb: 2,
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#111827", mb: 1.5 }}>
              Monto con el que se cerró
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
                gap: 2,
              }}
            >
              {[
                { key: "closing_cash", label: "Efectivo", icon: Money },
                { key: "closing_transfer", label: "Transferencia", icon: AccountBalance },
                { key: "closing_card", label: "Tarjeta", icon: CreditCard },
              ].map(({ key, label, icon: Icon }) => {
                const val = session[key]
                if (val == null) return null
                return (
                  <Box
                    key={key}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      p: 1.5,
                      borderRadius: "10px",
                      backgroundColor: "#f9fafb",
                    }}
                  >
                    <Icon sx={{ fontSize: 20, color: "#6b7280" }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        {label}
                      </Typography>
                      <NumericFormat
                        value={val}
                        displayType="text"
                        thousandSeparator="."
                        decimalSeparator=","
                        prefix="$ "
                        decimalScale={2}
                        fixedDecimalScale
                        renderText={(v) => (
                          <Typography variant="body2" fontWeight={700} sx={{ color: "#111827" }}>
                            {v}
                          </Typography>
                        )}
                      />
                    </Box>
                  </Box>
                )
              })}
            </Box>
            {session.difference != null && session.difference !== 0 && (
              <Box sx={{ mt: 1.5, pt: 1.5, borderTop: "1px solid #f3f4f6" }}>
                <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                  Diferencia (faltante/sobrante):
                </Typography>
                <NumericFormat
                  value={session.difference}
                  displayType="text"
                  thousandSeparator="."
                  decimalSeparator=","
                  prefix={session.difference > 0 ? "+ $ " : "- $ "}
                  decimalScale={2}
                  fixedDecimalScale
                  renderText={(v) => (
                    <Typography
                      variant="body2"
                      fontWeight={700}
                      sx={{ color: session.difference > 0 ? "#16a34a" : "#dc2626" }}
                    >
                      {v}
                    </Typography>
                  )}
                />
              </Box>
            )}
          </Box>
        )}

        {/* Si no hay desglose por método pero sí closing_amount y/o difference */}
        {!hasClosingByMethod && (session.closing_amount != null || (session.difference != null && session.difference !== 0)) && (
          <Box
            sx={{
              backgroundColor: "#fff",
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
              p: 2,
              mb: 2,
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#111827", mb: 1 }}>
              Cierre
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center" }}>
              {session.closing_amount != null && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Monto cierre:
                  </Typography>
                  <NumericFormat
                    value={session.closing_amount}
                    displayType="text"
                    thousandSeparator="."
                    decimalSeparator=","
                    prefix="$ "
                    decimalScale={2}
                    fixedDecimalScale
                    renderText={(v) => (
                      <Typography variant="body2" fontWeight={700} sx={{ color: "#d97706" }}>
                        {v}
                      </Typography>
                    )}
                  />
                </Box>
              )}
              {session.difference != null && session.difference !== 0 && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Diferencia:
                  </Typography>
                  <NumericFormat
                    value={session.difference}
                    displayType="text"
                    thousandSeparator="."
                    decimalSeparator=","
                    prefix={session.difference > 0 ? "+ $ " : "- $ "}
                    decimalScale={2}
                    fixedDecimalScale
                    renderText={(v) => (
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        sx={{ color: session.difference > 0 ? "#16a34a" : "#dc2626" }}
                      >
                        {v}
                      </Typography>
                    )}
                  />
                </Box>
              )}
            </Box>
          </Box>
        )}

        {/* Tabla de movimientos */}
        <Box
          sx={{
            backgroundColor: "#fff",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              px: { xs: 2.5, sm: 3 },
              py: 2,
              borderBottom: "1px solid #e5e7eb",
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#111827" }}>
              Movimientos de la sesión
            </Typography>
          </Box>

          {movements.length === 0 ? (
            <Box sx={{ py: 8, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                No hay movimientos registrados
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={0}>
              <Table
                size="small"
                sx={{
                  minWidth: 600,
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
                    <TableCell>Hora</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
                      Descripción
                    </TableCell>
                    <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>Método</TableCell>
                    <TableCell align="right">Monto</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {movements.map((movement) => {
                    const isIncome =
                      movement.type === "membership_payment" ||
                      movement.type === "income" ||
                      movement.type === "sale"
                    return (
                      <TableRow
                        key={movement.id}
                        hover
                        sx={{
                          "&:hover": { backgroundColor: "#fafafa" },
                          "&:last-child .MuiTableCell-root": { borderBottom: "none" },
                        }}
                      >
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {formatTime(movement.created_at)}
                          </Typography>
                        </TableCell>
                        <TableCell>{getMovementChip(movement.type)}</TableCell>
                        <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
                          <Typography variant="body2">
                            {movement.description || "-"}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
                          <Typography variant="body2" color="text.secondary">
                            {getPaymentMethodLabel(movement.payment_method)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <NumericFormat
                            value={movement.amount}
                            displayType="text"
                            thousandSeparator="."
                            decimalSeparator=","
                            prefix={isIncome ? "$ " : "- $ "}
                            decimalScale={2}
                            fixedDecimalScale
                            renderText={(value) => (
                              <Typography
                                variant="body2"
                                fontWeight={600}
                                sx={{ color: isIncome ? "#16a34a" : "#dc2626" }}
                              >
                                {value}
                              </Typography>
                            )}
                          />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>

        {/* Notas de cierre */}
        {session.notes && (
          <Box
            sx={{
              mt: 3,
              backgroundColor: "#fff",
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              p: 3,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
              <Description sx={{ fontSize: 20, color: "#6b7280" }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#111827" }}>
                Notas de cierre
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: "#374151", lineHeight: 1.6 }}>
              {session.notes}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  )
}
