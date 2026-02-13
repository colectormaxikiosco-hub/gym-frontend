"use client"

import { useState, useEffect, useRef, useMemo } from "react"
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
  Chip,
  IconButton,
  Dialog,
  DialogContent,
} from "@mui/material"
import {
  AttachMoney,
  TrendingUp,
  TrendingDown,
  AccessTime,
  CheckCircle,
  Add,
  Remove,
  History,
  AccountBalance,
  CreditCard,
  Money,
  Refresh,
  ExpandMore,
  ExpandLess,
  Close,
} from "@mui/icons-material"
import { NumericFormat } from "react-number-format"
import { useAuth } from "../context/AuthContext"
import cashService from "../services/cashService"
import OpenCashDialog from "../components/cash/OpenCashDialog"
import CloseCashDialog from "../components/cash/CloseCashDialog"
import RegisterMovementDialog from "../components/cash/RegisterMovementDialog"

const CashRegister = () => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [currentSession, setCurrentSession] = useState(null)
  const [movements, setMovements] = useState([])
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
  })

  const [openDialog, setOpenDialog] = useState(false)
  const [closeDialog, setCloseDialog] = useState(false)
  const [movementDialog, setMovementDialog] = useState(false)
  const [movementType, setMovementType] = useState("income")
  const [expandedBreakdown, setExpandedBreakdown] = useState(null)
  const [expandedMethod, setExpandedMethod] = useState(null)

  const loadingRef = useRef(false)

  const PAYMENT_METHOD_ORDER = ["cash", "transfer", "credit_card"]
  const INCOME_TYPE_ORDER = ["sale", "membership_payment", "income"]
  const INCOME_TYPE_LABELS = { sale: "Ventas", membership_payment: "Pago Membresía", income: "Ingreso" }

  const { incomeByMethod, expenseByMethod, incomeByMethodAndType, expenseByMethodAndType } = useMemo(() => {
    const incomeTypes = ["income", "membership_payment", "sale"]
    const income = {}
    const expense = {}
    const incomeByType = {}
    const expenseByType = {}
    movements.forEach((m) => {
      const amount = Number.parseFloat(m.amount) || 0
      const method = m.payment_method || "other"
      if (incomeTypes.includes(m.type)) {
        income[method] = (income[method] || 0) + amount
        if (!incomeByType[method]) incomeByType[method] = { sale: 0, membership_payment: 0, income: 0 }
        if (m.type in incomeByType[method]) incomeByType[method][m.type] += amount
        else incomeByType[method][m.type] = amount
      } else if (m.type === "expense") {
        expense[method] = (expense[method] || 0) + amount
        if (!expenseByType[method]) expenseByType[method] = { expense: 0 }
        expenseByType[method].expense += amount
      }
    })
    return {
      incomeByMethod: income,
      expenseByMethod: expense,
      incomeByMethodAndType: incomeByType,
      expenseByMethodAndType: expenseByType,
    }
  }, [movements])

  useEffect(() => {
    loadCurrentSession()
  }, [])

  const loadCurrentSession = async () => {
    if (loadingRef.current) {
      return
    }

    try {
      loadingRef.current = true
      setLoading(true)
      const response = await cashService.getActiveSession()

      if (response.data) {
        setCurrentSession(response.data)
        const movementsData = response.data.movements || []
        setMovements(movementsData)
        calculateStats(response.data, movementsData)
      } else {
        setCurrentSession(null)
        setMovements([])
      }
    } catch (error) {
      if (!error.cancelled) {
        console.error("Error loading session:", error)
      }
      setCurrentSession(null)
      setMovements([])
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }

  const calculateStats = (session, movementsData) => {
    const income = movementsData
      .filter((m) => m.type === "income" || m.type === "membership_payment" || m.type === "sale")
      .reduce((sum, m) => sum + Number.parseFloat(m.amount), 0)

    const expense = movementsData
      .filter((m) => m.type === "expense")
      .reduce((sum, m) => sum + Number.parseFloat(m.amount), 0)

    const openingAmount = session ? Number.parseFloat(session.opening_amount) : 0

    setStats({
      totalIncome: income,
      totalExpense: expense,
      balance: openingAmount + income - expense,
    })
  }

  const handleOpenCash = async (initialAmount) => {
    try {
      await cashService.openSession({ opening_amount: initialAmount })
      setOpenDialog(false)
      await loadCurrentSession()
    } catch (error) {
      console.error("Error opening cash:", error)
      throw error
    }
  }

  const handleCloseCash = async (data) => {
    try {
      await cashService.closeSession(currentSession.id, data)
      setCloseDialog(false)
      await loadCurrentSession()
    } catch (error) {
      console.error("Error closing cash:", error)
      throw error
    }
  }

  const handleAddMovement = async (movementData) => {
    try {
      await cashService.registerMovement(movementData)
      setMovementDialog(false)
      await loadCurrentSession()
    } catch (error) {
      console.error("Error adding movement:", error)
      throw error
    }
  }

  const getMovementIcon = (type) => {
    switch (type) {
      case "income":
      case "membership_payment":
      case "sale":
        return <TrendingUp sx={{ fontSize: 16 }} />
      case "expense":
        return <TrendingDown sx={{ fontSize: 16 }} />
      default:
        return <AttachMoney sx={{ fontSize: 16 }} />
    }
  }

  const getMovementTypeLabel = (type) => {
    const types = {
      membership_payment: "Pago Membresía",
      income: "Ingreso",
      expense: "Egreso",
      sale: "Venta",
    }
    return types[type] || type
  }

  const getMovementChip = (type) => {
    const isIncome = type === "income" || type === "membership_payment" || type === "sale"
    return (
      <Chip
        icon={getMovementIcon(type)}
        label={getMovementTypeLabel(type)}
        size="small"
        sx={{
          backgroundColor: isIncome ? "#dcfce7" : "#fee2e2",
          color: isIncome ? "#166534" : "#991b1b",
          fontWeight: 600,
          fontSize: "0.75rem",
          "& .MuiChip-icon": {
            color: isIncome ? "#166534" : "#991b1b",
          },
        }}
      />
    )
  }

  const getPaymentMethodLabel = (method) => {
    const methods = {
      cash: "Efectivo",
      transfer: "Transferencia",
      credit_card: "Tarjeta",
      efectivo: "Efectivo",
      transferencia: "Transferencia",
      tarjeta_credito: "Tarjeta",
      other: "Otro",
    }
    return methods[method] || method || "Otro"
  }

  const getPaymentMethodIcon = (method) => {
    switch (method?.toLowerCase()) {
      case "cash":
      case "efectivo":
        return <Money sx={{ fontSize: 16, color: "#6b7280" }} />
      case "transfer":
      case "transferencia":
        return <AccountBalance sx={{ fontSize: 16, color: "#6b7280" }} />
      case "credit_card":
      case "tarjeta_credito":
        return <CreditCard sx={{ fontSize: 16, color: "#6b7280" }} />
      default:
        return <Money sx={{ fontSize: 16, color: "#6b7280" }} />
    }
  }

  // Loading state
  if (loading) {
    return (
      <Box className="min-h-screen bg-gradient-to-br from-gray-50 via-amber-50/20 to-gray-50 flex items-center justify-center">
        <Box className="flex flex-col items-center gap-4">
          <Box className="w-9 h-9 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <Typography variant="body2" color="text.secondary">
            Cargando...
          </Typography>
        </Box>
      </Box>
    )
  }

  // No session state - Caja cerrada (centrado y mismo patrón de diseño)
  if (!currentSession) {
    return (
      <Box className="min-h-screen bg-gradient-to-br from-gray-50 via-amber-50/20 to-gray-50">
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            minHeight: "100vh",
            pt: { xs: 6, sm: 8 },
            px: { xs: 3, sm: 4 },
            pb: 4,
          }}
        >
          {/* Card centrada */}
          <Box
            sx={{
              width: "100%",
              maxWidth: 480,
              backgroundColor: "#fff",
              borderRadius: "20px",
              border: "1px solid #e5e7eb",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              p: { xs: 4, sm: 5 },
              textAlign: "center",
            }}
          >
            {/* Icono */}
            <Box
              sx={{
                width: 72,
                height: 72,
                backgroundColor: "#fffbeb",
                borderRadius: "16px",
                border: "1px solid #fde68a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 3,
              }}
            >
              <AttachMoney sx={{ fontSize: 36, color: "#d97706" }} />
            </Box>

            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: "#111827",
                mb: 1.5,
                fontSize: { xs: "1.25rem", sm: "1.5rem" },
              }}
            >
              Caja Cerrada
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "#6b7280",
                lineHeight: 1.6,
                mb: 4,
                maxWidth: 360,
                mx: "auto",
              }}
            >
              No hay una sesión de caja abierta. Abre la caja para comenzar a registrar transacciones del día.
            </Typography>

            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: 1.5,
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <Button
                variant="contained"
                startIcon={<AttachMoney />}
                onClick={() => setOpenDialog(true)}
                sx={{
                  backgroundColor: "#f59e0b",
                  "&:hover": { backgroundColor: "#d97706" },
                  textTransform: "none",
                  fontWeight: 600,
                  borderRadius: "12px",
                  px: 3.5,
                  py: 1.5,
                  boxShadow: "0 1px 3px rgba(217, 119, 6, 0.3)",
                  minWidth: { xs: "100%", sm: "auto" },
                }}
              >
                Abrir Caja
              </Button>
              <Button
                variant="outlined"
                startIcon={<History />}
                onClick={() => (window.location.href = "/caja/historial")}
                sx={{
                  color: "#6b7280",
                  borderColor: "#d1d5db",
                  borderRadius: "12px",
                  textTransform: "none",
                  fontWeight: 500,
                  px: 3.5,
                  py: 1.5,
                  minWidth: { xs: "100%", sm: "auto" },
                  "&:hover": {
                    borderColor: "#9ca3af",
                    backgroundColor: "#f9fafb",
                  },
                }}
              >
                Ver Historial
              </Button>
            </Box>
          </Box>
        </Box>

        <OpenCashDialog open={openDialog} onClose={() => setOpenDialog(false)} onSubmit={handleOpenCash} />
      </Box>
    )
  }

  // Main content with active session
  return (
    <Box className="min-h-screen bg-gradient-to-br from-gray-50 via-amber-50/20 to-gray-50">
      <Box className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
        {/* Header */}
        <Box className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: "#111827",
                letterSpacing: "-0.02em",
                fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" },
              }}
            >
              Caja
            </Typography>
            <Typography variant="body1" sx={{ color: "#6b7280", fontWeight: 500, mt: 0.5 }}>
              Gestiona los movimientos de caja del gimnasio
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
            <Button
              variant="outlined"
              startIcon={<History />}
              onClick={() => (window.location.href = "/caja/historial")}
              sx={{
                color: "#6b7280",
                borderColor: "#d1d5db",
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 500,
                px: 2.5,
                "&:hover": {
                  borderColor: "#9ca3af",
                  backgroundColor: "#f9fafb",
                },
              }}
            >
              <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                Historial
              </Box>
            </Button>
            <Button
              variant="contained"
              startIcon={<Remove />}
              onClick={() => setCloseDialog(true)}
              sx={{
                backgroundColor: "#dc2626",
                "&:hover": { backgroundColor: "#b91c1c" },
                textTransform: "none",
                fontWeight: 600,
                borderRadius: "10px",
                px: 2.5,
                boxShadow: "0 1px 3px rgba(220, 38, 38, 0.3)",
              }}
            >
              Cerrar Caja
            </Button>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(5, 1fr)" },
            gap: 2,
            mb: 3,
          }}
        >
          {/* Estado */}
          <Box
            className="bg-white rounded-2xl p-4"
            sx={{
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              border: "1px solid #e5e7eb",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  backgroundColor: "#dcfce7",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CheckCircle sx={{ fontSize: 20, color: "#16a34a" }} />
              </Box>
              <Typography variant="caption" sx={{ color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Estado
              </Typography>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: "#16a34a", mb: 0.5 }}>
              Abierta
            </Typography>
            <Typography variant="caption" sx={{ color: "#9ca3af" }}>
              {new Date(currentSession.opened_at).toLocaleString("es-AR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Typography>
          </Box>

          {/* Monto Inicial */}
          <Box
            className="bg-white rounded-2xl p-4"
            sx={{
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              border: "1px solid #e5e7eb",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  backgroundColor: "#dbeafe",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AttachMoney sx={{ fontSize: 20, color: "#2563eb" }} />
              </Box>
              <Typography variant="caption" sx={{ color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Monto Inicial
              </Typography>
            </Box>
            <NumericFormat
              value={currentSession.opening_amount}
              displayType="text"
              thousandSeparator="."
              decimalSeparator=","
              prefix="$ "
              decimalScale={2}
              fixedDecimalScale
              renderText={(value) => (
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#111827" }}>
                  {value}
                </Typography>
              )}
            />
          </Box>

          {/* Ingresos */}
          <Box
            className="bg-white rounded-2xl p-4"
            onClick={() => {
              setExpandedBreakdown((prev) => (prev === "ingresos" ? null : "ingresos"))
              setExpandedMethod(null)
            }}
            sx={{
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              border: "1px solid",
              borderColor: expandedBreakdown === "ingresos" ? "#16a34a" : "#e5e7eb",
              cursor: "pointer",
              transition: "all 0.2s ease",
              "&:hover": {
                borderColor: "#86efac",
                backgroundColor: "#f0fdf4",
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  backgroundColor: "#dcfce7",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <TrendingUp sx={{ fontSize: 20, color: "#16a34a" }} />
              </Box>
              <Typography variant="caption" sx={{ color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Ingresos
              </Typography>
            </Box>
            <NumericFormat
              value={stats.totalIncome}
              displayType="text"
              thousandSeparator="."
              decimalSeparator=","
              prefix="$ "
              decimalScale={2}
              fixedDecimalScale
              renderText={(value) => (
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#16a34a" }}>
                  {value}
                </Typography>
              )}
            />
          </Box>

          {/* Egresos */}
          <Box
            className="bg-white rounded-2xl p-4"
            onClick={() => {
              setExpandedBreakdown((prev) => (prev === "egresos" ? null : "egresos"))
              setExpandedMethod(null)
            }}
            sx={{
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              border: "1px solid",
              borderColor: expandedBreakdown === "egresos" ? "#dc2626" : "#e5e7eb",
              cursor: "pointer",
              transition: "all 0.2s ease",
              "&:hover": {
                borderColor: "#fca5a5",
                backgroundColor: "#fef2f2",
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  backgroundColor: "#fee2e2",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <TrendingDown sx={{ fontSize: 20, color: "#dc2626" }} />
              </Box>
              <Typography variant="caption" sx={{ color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Egresos
              </Typography>
            </Box>
            <NumericFormat
              value={stats.totalExpense}
              displayType="text"
              thousandSeparator="."
              decimalSeparator=","
              prefix="$ "
              decimalScale={2}
              fixedDecimalScale
              renderText={(value) => (
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#dc2626" }}>
                  {value}
                </Typography>
              )}
            />
          </Box>

          {/* Balance Total */}
          <Box
            className="bg-white rounded-2xl p-4"
            sx={{
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              border: "1px solid #fde68a",
              backgroundColor: "#fffbeb",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  backgroundColor: "#fef3c7",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AttachMoney sx={{ fontSize: 20, color: "#d97706" }} />
              </Box>
              <Typography variant="caption" sx={{ color: "#92400e", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Balance Total
              </Typography>
            </Box>
            <NumericFormat
              value={stats.balance}
              displayType="text"
              thousandSeparator="."
              decimalSeparator=","
              prefix="$ "
              decimalScale={2}
              fixedDecimalScale
              renderText={(value) => (
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#d97706" }}>
                  {value}
                </Typography>
              )}
            />
          </Box>
        </Box>

        {/* Modal Desglose por método de pago */}
        <Dialog
          open={!!expandedBreakdown}
          onClose={() => {
            setExpandedBreakdown(null)
            setExpandedMethod(null)
          }}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: "16px",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
              maxWidth: 600,
              m: 2,
            },
          }}
        >
          <Box
            sx={{
              px: { xs: 2, sm: 3 },
              py: 2,
              borderBottom: "1px solid #f3f4f6",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1.5,
              backgroundColor: expandedBreakdown === "ingresos" ? "#f0fdf4" : "#fef2f2",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              {expandedBreakdown === "ingresos" ? (
                <TrendingUp sx={{ fontSize: 22, color: "#16a34a" }} />
              ) : (
                <TrendingDown sx={{ fontSize: 22, color: "#dc2626" }} />
              )}
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: expandedBreakdown === "ingresos" ? "#166534" : "#991b1b" }}>
                Desglose por método de pago — {expandedBreakdown === "ingresos" ? "Ingresos" : "Egresos"}
              </Typography>
            </Box>
            <IconButton
              onClick={() => {
                setExpandedBreakdown(null)
                setExpandedMethod(null)
              }}
              size="small"
              sx={{ color: "#6b7280", "&:hover": { backgroundColor: "rgba(0,0,0,0.04)", color: "#374151" } }}
              aria-label="Cerrar"
            >
              <Close />
            </IconButton>
          </Box>
          <DialogContent sx={{ p: { xs: 2, sm: 3 }, pt: 2 }}>
            {expandedBreakdown && (() => {
              const data = expandedBreakdown === "ingresos" ? incomeByMethod : expenseByMethod
              const byType = expandedBreakdown === "ingresos" ? incomeByMethodAndType : expenseByMethodAndType
              const total = Object.values(data).reduce((s, v) => s + v, 0)
              const methodKeys = [...PAYMENT_METHOD_ORDER.filter((k) => (data[k] || 0) > 0), ...Object.keys(data).filter((k) => !PAYMENT_METHOD_ORDER.includes(k))]
              if (total === 0) {
                return (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    No hay movimientos en este período.
                  </Typography>
                )
              }
              return (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {methodKeys.map((method) => {
                    const amount = data[method]
                    if (!amount || amount <= 0) return null
                    const isMethodExpanded = expandedMethod === method
                    const typeData = byType[method] || {}
                    return (
                      <Box
                        key={method}
                        sx={{
                          borderRadius: "12px",
                          backgroundColor: expandedBreakdown === "ingresos" ? "#f0fdf4" : "#fef2f2",
                          border: "1px solid",
                          borderColor: expandedBreakdown === "ingresos" ? "#bbf7d0" : "#fecaca",
                          overflow: "hidden",
                        }}
                      >
                        <Box
                          onClick={() => setExpandedMethod((prev) => (prev === method ? null : method))}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            p: 2,
                            cursor: "pointer",
                            "&:hover": { backgroundColor: expandedBreakdown === "ingresos" ? "#dcfce7" : "#fee2e2" },
                          }}
                        >
                          <Box
                            sx={{
                              width: 44,
                              height: 44,
                              borderRadius: "12px",
                              backgroundColor: "#fff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                            }}
                          >
                            {getPaymentMethodIcon(method)}
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: "#374151" }}>
                              {getPaymentMethodLabel(method)}
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
                                <Typography
                                  variant="subtitle2"
                                  sx={{
                                    fontWeight: 700,
                                    color: expandedBreakdown === "ingresos" ? "#16a34a" : "#dc2626",
                                  }}
                                >
                                  {value}
                                </Typography>
                              )}
                            />
                          </Box>
                          <IconButton size="small" sx={{ color: "#6b7280" }} aria-label={isMethodExpanded ? "Cerrar desglose" : "Ver por tipo"}>
                            {isMethodExpanded ? <ExpandLess /> : <ExpandMore />}
                          </IconButton>
                        </Box>
                        {isMethodExpanded && (
                          <Box
                            sx={{
                              borderTop: "1px solid",
                              borderColor: expandedBreakdown === "ingresos" ? "#bbf7d0" : "#fecaca",
                              backgroundColor: "#fff",
                              px: 2,
                              py: 1.5,
                            }}
                          >
                            <Typography variant="caption" sx={{ color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", mb: 1.5 }}>
                              Por tipo
                            </Typography>
                            {expandedBreakdown === "ingresos" ? (
                              INCOME_TYPE_ORDER.map((typeKey) => {
                                const typeAmount = typeData[typeKey] || 0
                                if (typeAmount <= 0) return null
                                return (
                                  <Box
                                    key={typeKey}
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                      py: 0.75,
                                      px: 1.5,
                                      borderRadius: "8px",
                                      backgroundColor: "#f9fafb",
                                      "&:not(:last-child)": { mb: 0.75 },
                                    }}
                                  >
                                    <Typography variant="body2" sx={{ color: "#374151", fontWeight: 500 }}>
                                      {INCOME_TYPE_LABELS[typeKey] || typeKey}
                                    </Typography>
                                    <NumericFormat
                                      value={typeAmount}
                                      displayType="text"
                                      thousandSeparator="."
                                      decimalSeparator=","
                                      prefix="$ "
                                      decimalScale={2}
                                      fixedDecimalScale
                                      renderText={(value) => (
                                        <Typography variant="body2" sx={{ fontWeight: 700, color: "#16a34a" }}>
                                          {value}
                                        </Typography>
                                      )}
                                    />
                                  </Box>
                                )
                              })
                            ) : (
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  py: 0.75,
                                  px: 1.5,
                                  borderRadius: "8px",
                                  backgroundColor: "#f9fafb",
                                }}
                              >
                                <Typography variant="body2" sx={{ color: "#374151", fontWeight: 500 }}>
                                  Egreso
                                </Typography>
                                <NumericFormat
                                  value={typeData.expense || amount}
                                  displayType="text"
                                  thousandSeparator="."
                                  decimalSeparator=","
                                  prefix="$ "
                                  decimalScale={2}
                                  fixedDecimalScale
                                  renderText={(value) => (
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: "#dc2626" }}>
                                      {value}
                                    </Typography>
                                  )}
                                />
                              </Box>
                            )}
                          </Box>
                        )}
                      </Box>
                    )
                  })}
                </Box>
              )
            })()}
          </DialogContent>
        </Dialog>

        {/* Action Buttons */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
            gap: 2,
            mb: 3,
          }}
        >
          <Box
            component="button"
            onClick={() => {
              setMovementType("income")
              setMovementDialog(true)
            }}
            sx={{
              p: 2.5,
              backgroundColor: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "14px",
              display: "flex",
              alignItems: "center",
              gap: 2,
              cursor: "pointer",
              transition: "all 0.2s",
              "&:hover": {
                borderColor: "#bbf7d0",
                backgroundColor: "#f0fdf4",
              },
            }}
          >
            <Box
              sx={{
                width: 44,
                height: 44,
                backgroundColor: "#dcfce7",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Add sx={{ fontSize: 24, color: "#16a34a" }} />
            </Box>
            <Box sx={{ textAlign: "left" }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#111827" }}>
                Registrar Ingreso
              </Typography>
              <Typography variant="caption" sx={{ color: "#6b7280" }}>
                Agregar dinero a caja
              </Typography>
            </Box>
          </Box>

          <Box
            component="button"
            onClick={() => {
              setMovementType("expense")
              setMovementDialog(true)
            }}
            sx={{
              p: 2.5,
              backgroundColor: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "14px",
              display: "flex",
              alignItems: "center",
              gap: 2,
              cursor: "pointer",
              transition: "all 0.2s",
              "&:hover": {
                borderColor: "#fecaca",
                backgroundColor: "#fef2f2",
              },
            }}
          >
            <Box
              sx={{
                width: 44,
                height: 44,
                backgroundColor: "#fee2e2",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Remove sx={{ fontSize: 24, color: "#dc2626" }} />
            </Box>
            <Box sx={{ textAlign: "left" }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#111827" }}>
                Registrar Egreso
              </Typography>
              <Typography variant="caption" sx={{ color: "#6b7280" }}>
                Retirar dinero de caja
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Movements Table */}
        <Box
          className="bg-white rounded-2xl"
          sx={{
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            border: "1px solid #e5e7eb",
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
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#111827" }}>
              Movimientos de Hoy
            </Typography>
            <IconButton
              onClick={loadCurrentSession}
              size="small"
              sx={{
                color: "#78716c",
                backgroundColor: "#f5f5f4",
                "&:hover": {
                  backgroundColor: "#e7e5e4",
                  color: "#d97706",
                },
              }}
              title="Actualizar"
              aria-label="Actualizar"
            >
              <Refresh fontSize="small" />
            </IconButton>
          </Box>

          {movements.length === 0 ? (
            <Box sx={{ p: 6, textAlign: "center" }}>
              <AccessTime sx={{ fontSize: 40, color: "#d1d5db", mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                No hay movimientos registrados
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Los movimientos aparecerán aquí cuando los registres
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
                    <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>Descripción</TableCell>
                    <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>Método</TableCell>
                    <TableCell align="right">Monto</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {movements.map((movement, index) => {
                    const isIncome = movement.type === "income" || movement.type === "membership_payment" || movement.type === "sale"
                    return (
                      <TableRow
                        key={movement.id || index}
                        hover
                        sx={{
                          "&:hover": { backgroundColor: "#fafafa" },
                          "&:last-child .MuiTableCell-root": { borderBottom: "none" },
                        }}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight={500} color="text.secondary">
                            {new Date(movement.created_at).toLocaleTimeString("es-AR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </Typography>
                        </TableCell>
                        <TableCell>{getMovementChip(movement.type)}</TableCell>
                        <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
                          <Typography variant="body2" fontWeight={500}>
                            {movement.description || "-"}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            {getPaymentMethodIcon(movement.payment_method)}
                            <Typography variant="body2" color="text.secondary">
                              {getPaymentMethodLabel(movement.payment_method)}
                            </Typography>
                          </Box>
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
                                sx={{
                                  fontWeight: 600,
                                  color: isIncome ? "#16a34a" : "#dc2626",
                                }}
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
      </Box>

      {/* Dialogs */}
      <OpenCashDialog open={openDialog} onClose={() => setOpenDialog(false)} onSubmit={handleOpenCash} />

      <CloseCashDialog
        open={closeDialog}
        onClose={() => setCloseDialog(false)}
        onSubmit={handleCloseCash}
        currentSession={currentSession}
        currentBalance={stats.balance}
        initialAmount={currentSession?.opening_amount}
        totalIncome={stats.totalIncome}
        totalExpense={stats.totalExpense}
      />

      <RegisterMovementDialog
        open={movementDialog}
        onClose={() => setMovementDialog(false)}
        onSubmit={handleAddMovement}
        defaultType={movementType}
      />
    </Box>
  )
}

export default CashRegister
