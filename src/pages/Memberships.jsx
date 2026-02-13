"use client"

import { useState, useEffect, useCallback, useRef } from "react"
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Chip,
  IconButton,
  Alert,
  InputAdornment,
  Autocomplete,
  Fade,
} from "@mui/material"
import {
  Add,
  Search,
  Cancel as CancelIcon,
  Refresh,
  Close,
  FitnessCenter,
  CalendarMonth,
  AttachMoney,
  AccountBalance,
  CreditCard,
  AccountBalanceWallet,
  InfoOutlined,
  ArrowBack,
  WarningAmber,
  Person,
  Assessment,
} from "@mui/icons-material"
import { useNavigate, useLocation } from "react-router-dom"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { NumericFormat } from "react-number-format"
import membershipService from "../services/membershipService"
import planService from "../services/planService"
import clientService from "../services/clientService"
import { useDebounce } from "../hooks/useDebounce"
import { usePagination } from "../hooks/usePagination"

const Memberships = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [memberships, setMemberships] = useState([])
  const [renewClientFromNav, setRenewClientFromNav] = useState(null)
  const [plans, setPlans] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [dialogStep, setDialogStep] = useState(1)
  const [pendingMembership, setPendingMembership] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [openCancelDialog, setOpenCancelDialog] = useState(false)
  const [membershipToCancel, setMembershipToCancel] = useState(null)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterPlan, setFilterPlan] = useState("")
  const [filterStatus, setFilterStatus] = useState("")

  const debouncedSearchTerm = useDebounce(searchTerm, 500)
  const pagination = usePagination({ limit: 10, rowsPerPageOptions: [5, 10, 25, 50] })
  const prevSearchRef = useRef(debouncedSearchTerm)
  const prevFilterPlanRef = useRef(filterPlan)
  const prevFilterStatusRef = useRef(filterStatus)

  const abortControllerRef = useRef(null)

  const [formData, setFormData] = useState({
    client_id: "",
    plan_id: "",
    instructor_id: "",
    start_date: new Date().toISOString().split("T")[0],
  })

  const loadData = useCallback(async () => {
    const searchChanged = prevSearchRef.current !== debouncedSearchTerm
    const planChanged = prevFilterPlanRef.current !== filterPlan
    const statusChanged = prevFilterStatusRef.current !== filterStatus
    if (searchChanged) prevSearchRef.current = debouncedSearchTerm
    if (planChanged) prevFilterPlanRef.current = filterPlan
    if (statusChanged) prevFilterStatusRef.current = filterStatus
    const pageToLoad = searchChanged || planChanged || statusChanged ? 1 : pagination.page

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()

    try {
      setLoading(true)
      const [membershipsRes, plansRes, clientsRes] = await Promise.all([
        membershipService.getMembershipsPaginated({
          page: pageToLoad,
          limit: pagination.limit,
          search: debouncedSearchTerm,
          plan_id: filterPlan,
          status: filterStatus,
        }),
        planService.getAll(),
        clientService.getClientsPaginated({
          page: 1,
          limit: 1000,
          include_active_membership: true,
        }),
      ])

      setMemberships(Array.isArray(membershipsRes.data) ? membershipsRes.data : [])
      pagination.setPagination(membershipsRes.pagination)
      setPlans(plansRes?.data ?? plansRes ?? [])
      setClients(Array.isArray(clientsRes?.data) ? clientsRes.data : [])
      setError("")
    } catch (err) {
      if (err.name !== "AbortError" && !err.cancelled) {
        setError("Error al cargar los datos")
      }
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, debouncedSearchTerm, filterPlan, filterStatus])

  useEffect(() => {
    loadData()

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [loadData])

  useEffect(() => {
    const renewClient = location.state?.renewClient
    if (!renewClient?.id || !renewClient?.active_membership?.end_date) return
    const startDate = String(renewClient.active_membership.end_date).split("T")[0]
    setRenewClientFromNav(renewClient)
    setFormData({
      client_id: renewClient.id,
      plan_id: "",
      instructor_id: "",
      start_date: startDate,
    })
    setDialogStep(1)
    setPendingMembership(null)
    setPaymentMethod("cash")
    setOpenDialog(true)
    setError("")
    navigate(location.pathname, { replace: true, state: {} })
  }, [location.state, location.pathname, navigate])

  const handleOpenDialog = () => {
    setRenewClientFromNav(null)
    setFormData({
      client_id: "",
      plan_id: "",
      instructor_id: "",
      start_date: new Date().toISOString().split("T")[0],
    })
    setDialogStep(1)
    setPendingMembership(null)
    setPaymentMethod("cash")
    setOpenDialog(true)
    setError("")
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setRenewClientFromNav(null)
    setDialogStep(1)
    setPendingMembership(null)
    setPaymentMethod("cash")
    setFormData({
      client_id: "",
      plan_id: "",
      instructor_id: "",
      start_date: new Date().toISOString().split("T")[0],
    })
    setError("")
  }

  const handleGoToPayment = () => {
    setError("")
    const selectedPlan = plans.find((p) => p.id === formData.plan_id)
    if (!selectedPlan) {
      setError("Plan no encontrado")
      return
    }
    const instructors = selectedPlan.instructors || []
    if (instructors.length >= 2 && !formData.instructor_id) {
      setError("Seleccioná el instructor para esta membresía")
      return
    }
    setPendingMembership({ ...formData })
    setDialogStep(2)
  }

  const handleBackToForm = () => {
    setError("")
    setDialogStep(1)
  }

  const handleConfirmPayment = async () => {
    if (!pendingMembership) return
    try {
      setPaymentLoading(true)
      setError("")
      const dataToSend = {
        ...pendingMembership,
        payment_method: paymentMethod,
      }
      await membershipService.create(dataToSend)
      setSuccess("Membresía creada y pago registrado correctamente")
      loadData()
      handleCloseDialog()
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError(err.response?.data?.message || "Error al crear la membresía")
    } finally {
      setPaymentLoading(false)
    }
  }

  const handleOpenCancelDialog = (membership) => {
    setMembershipToCancel(membership)
    setOpenCancelDialog(true)
    setError("")
  }

  const handleCloseCancelDialog = () => {
    if (!cancelLoading) {
      setOpenCancelDialog(false)
      setMembershipToCancel(null)
    }
  }

  const handleConfirmCancel = async () => {
    if (!membershipToCancel) return
    setCancelLoading(true)
    setError("")
    try {
      const result = await membershipService.cancel(membershipToCancel.id)
      const data = result?.data ?? {}
      let msg = "Membresía cancelada correctamente."
      if (data.affectsCash) {
        msg += " Se restó el monto de la sesión de caja actual."
      } else if (data.affectsCurrentAccount) {
        msg += " Se revirtió la deuda en cuenta corriente del cliente."
      } else if (membershipToCancel.cash_movement_id && !data.affectsCash) {
        msg += " El pago fue en una sesión de caja ya cerrada; no se modificó la caja."
      }
      setSuccess(msg)
      handleCloseCancelDialog()
      loadData()
      setTimeout(() => setSuccess(""), 5000)
    } catch (err) {
      setError(err.response?.data?.message || "Error al cancelar la membresía")
    } finally {
      setCancelLoading(false)
    }
  }

  const getMembershipRowStyle = (membership) => {
    const status = membership.status
    const durationDays = Number(membership.plan_duration)
    const days = Number(membership.days_remaining)

    if (status === "cancelled") {
      return {
        backgroundColor: "#f3f4f6",
        borderLeft: "3px solid #9ca3af",
        "&:hover": { backgroundColor: "#e5e7eb" },
      }
    }

    if (status === "expired") {
      return {
        backgroundColor: "#fecaca",
        borderLeft: "3px solid #b91c1c",
        "&:hover": { backgroundColor: "#fca5a5" },
      }
    }

    if (status === "active" && durationDays > 5) {
      if (days <= 1) {
        return {
          backgroundColor: "#fef2f2",
          borderLeft: "3px solid #dc2626",
          "&:hover": { backgroundColor: "#fee2e2" },
        }
      }
      if ([2, 3, 4, 5].includes(days)) {
        return {
          backgroundColor: "#fff7ed",
          borderLeft: "3px solid #ea580c",
          "&:hover": { backgroundColor: "#ffedd5" },
        }
      }
      return {
        backgroundColor: "#f0fdf4",
        borderLeft: "3px solid #16a34a",
        "&:hover": { backgroundColor: "#dcfce7" },
      }
    }

    return {
      backgroundColor: "inherit",
      borderLeft: "3px solid transparent",
      "&:hover": { backgroundColor: "#fafafa" },
    }
  }

  const getEndDateBadge = (membership) => {
    const status = membership.status
    const days = typeof membership.days_remaining === "number" ? membership.days_remaining : null

    if (status === "expired") {
      return (
        <Box
          sx={{
            display: "inline-flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: 0.25,
            px: 1.5,
            py: 1,
            borderRadius: "10px",
            backgroundColor: "#fecaca",
            border: "1px solid #b91c1c",
          }}
        >
          <Typography
            variant="body2"
            sx={{ fontWeight: 700, fontSize: "0.875rem", color: "#7f1d1d", lineHeight: 1.2 }}
          >
            Vencida
          </Typography>
          <Typography
            variant="caption"
            sx={{ fontWeight: 500, color: "#991b1b", fontSize: "0.7rem" }}
          >
            Venció {formatDate(membership.end_date)}
          </Typography>
        </Box>
      )
    }

    if (status === "active") {
      const dur = Number(membership.plan_duration)
      const isShortPlan = dur <= 5
      const d = days
      const isRed = !isShortPlan && (d === 1 || d === 0)
      const isOrange = !isShortPlan && [2, 3, 4, 5].includes(d)
      const bg = isRed ? "#fee2e2" : isOrange ? "#ffedd5" : "#dcfce7"
      const border = isRed ? "#fca5a5" : isOrange ? "#fdba74" : "#86efac"
      const colorMain = isRed ? "#991b1b" : isOrange ? "#c2410c" : "#166534"
      const colorSub = isRed ? "#b91c1c" : isOrange ? "#ea580c" : "#15803d"

      let daysLabel = "Activa"
      if (d === 0) {
        daysLabel = "Vence hoy"
      } else if (d === 1) {
        daysLabel = "1 día restante"
      } else if (typeof d === "number") {
        daysLabel = `${d} días restantes`
      }

      return (
        <Box
          sx={{
            display: "inline-flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: 0.25,
            px: 1.5,
            py: 1,
            borderRadius: "10px",
            backgroundColor: bg,
            border: `1px solid ${border}`,
          }}
        >
          <Typography
            variant="body2"
            sx={{ fontWeight: 700, fontSize: "0.875rem", color: colorMain, lineHeight: 1.2 }}
          >
            {daysLabel}
          </Typography>
          <Typography
            variant="caption"
            sx={{ fontWeight: 500, color: colorSub, fontSize: "0.7rem" }}
          >
            Vence {formatDate(membership.end_date)}
          </Typography>
        </Box>
      )
    }

    return (
      <Typography variant="body2" color="text.secondary">
        {formatDate(membership.end_date)}
      </Typography>
    )
  }

  const getStatusChip = (status) => {
    const statusConfig = {
      active: {
        label: "Activa",
        sx: {
          backgroundColor: "#dcfce7",
          color: "#166534",
          fontWeight: 600,
          fontSize: "0.75rem",
        },
      },
      expired: {
        label: "Vencida",
        sx: {
          backgroundColor: "#fee2e2",
          color: "#991b1b",
          fontWeight: 600,
          fontSize: "0.75rem",
        },
      },
      cancelled: {
        label: "Cancelada",
        sx: {
          backgroundColor: "#f3f4f6",
          color: "#6b7280",
          fontWeight: 600,
          fontSize: "0.75rem",
        },
      },
    }
    const config = statusConfig[status] || {
      label: status,
      sx: { fontWeight: 600, fontSize: "0.75rem" },
    }
    return <Chip label={config.label} size="small" sx={config.sx} />
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    }).format(price)
  }

  const formatDate = (date) => {
    if (!date) return "-"
    return format(new Date(date), "dd/MM/yyyy", { locale: es })
  }

  const selectedPlan = plans.find((p) => p.id === formData.plan_id)
  const planForPayment = plans.find((p) => p.id === pendingMembership?.plan_id)

  return (
    <Box className="min-h-screen bg-gradient-to-br from-gray-50 via-amber-50/20 to-gray-50">
      <Box className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
        {/* Header */}
        <Box className="mb-8" sx={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 2 }}>
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
              Gestión de Membresías
            </Typography>
            <Typography variant="body1" sx={{ color: "#6b7280", fontWeight: 500, mt: 0.5 }}>
              Administra las membresías de tus clientes
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<Assessment />}
            onClick={() => navigate("/memberships/reportes")}
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              borderColor: "#d97706",
              color: "#d97706",
              "&:hover": { borderColor: "#b45309", backgroundColor: "#fffbeb" },
            }}
          >
            Reportes
          </Button>
        </Box>

        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 3,
              borderRadius: "14px",
              boxShadow: "0 2px 8px rgba(220, 38, 38, 0.15)",
            }}
            onClose={() => setError("")}
          >
            {error}
          </Alert>
        )}

        {success && (
          <Alert
            severity="success"
            sx={{
              mb: 3,
              borderRadius: "14px",
              boxShadow: "0 2px 8px rgba(34, 197, 94, 0.15)",
            }}
            onClose={() => setSuccess("")}
          >
            {success}
          </Alert>
        )}

        <Box
          className="bg-white rounded-2xl p-4 sm:p-6"
          sx={{
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            border: "1px solid #e5e7eb",
          }}
        >
          <Box className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <Box className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <TextField
                placeholder="Buscar cliente"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: "#9ca3af" }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  minWidth: { xs: "100%", sm: 200 },
                  flex: "1 1 auto",
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                    backgroundColor: "#fafafa",
                    fontSize: "0.875rem",
                    "&:hover fieldset": { borderColor: "#e5e7eb" },
                    "&.Mui-focused fieldset": { borderColor: "#d97706", borderWidth: "1px" },
                  },
                }}
              />
              <FormControl
                size="small"
                sx={{
                  minWidth: 140,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                    backgroundColor: "#fafafa",
                    fontSize: "0.875rem",
                    "&:hover fieldset": { borderColor: "#e5e7eb" },
                    "&.Mui-focused fieldset": { borderColor: "#d97706", borderWidth: "1px" },
                  },
                }}
              >
                <InputLabel sx={{ fontSize: "0.875rem" }}>Plan</InputLabel>
                <Select
                  value={filterPlan}
                  onChange={(e) => setFilterPlan(e.target.value)}
                  label="Plan"
                  sx={{ "& .MuiSelect-select": { py: 1 } }}
                >
                  <MenuItem value="">Todos</MenuItem>
                  {plans.map((plan) => (
                    <MenuItem key={plan.id} value={plan.id}>
                      {plan.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl
                size="small"
                sx={{
                  minWidth: 140,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                    backgroundColor: "#fafafa",
                    fontSize: "0.875rem",
                    "&:hover fieldset": { borderColor: "#e5e7eb" },
                    "&.Mui-focused fieldset": { borderColor: "#d97706", borderWidth: "1px" },
                  },
                }}
              >
                <InputLabel sx={{ fontSize: "0.875rem" }}>Estado</InputLabel>
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  label="Estado"
                  sx={{ "& .MuiSelect-select": { py: 1 } }}
                >
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="active">Activas</MenuItem>
                  <MenuItem value="expired">Vencidas</MenuItem>
                  <MenuItem value="cancelled">Canceladas</MenuItem>
                </Select>
              </FormControl>
              <IconButton
                onClick={() => loadData()}
                size="small"
                sx={{
                  color: "#78716c",
                  backgroundColor: "#f5f5f4",
                  "&:hover": {
                    backgroundColor: "#e7e5e4",
                    color: "#d97706",
                  },
                }}
                title="Actualizar lista"
                aria-label="Actualizar lista"
              >
                <Refresh fontSize="small" />
              </IconButton>
            </Box>

            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleOpenDialog}
              sx={{
                backgroundColor: "#f59e0b",
                "&:hover": { backgroundColor: "#d97706" },
                textTransform: "none",
                fontWeight: 600,
                borderRadius: "14px",
                px: 3,
                py: 1.5,
                boxShadow: "0 4px 12px rgba(245, 158, 11, 0.3)",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Nueva Membresía
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
                minWidth: 720,
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
                  <TableCell>Cliente</TableCell>
                  <TableCell>Plan</TableCell>
                  <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>Inicio</TableCell>
                  <TableCell>Vencimiento</TableCell>
                  <TableCell sx={{ display: { xs: "none", lg: "table-cell" } }}>Precio</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                      <Box className="flex flex-col items-center gap-3">
                        <Box className="w-9 h-9 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                        <Typography variant="body2" color="text.secondary">
                          Cargando...
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : memberships.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                      <Typography variant="body2" color="text.secondary">
                        {debouncedSearchTerm || filterPlan || filterStatus
                          ? "No se encontraron membresías con los criterios aplicados"
                          : "No hay membresías disponibles"}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  memberships.map((membership) => (
                    <TableRow
                      key={membership.id}
                      hover
                      sx={{
                        ...getMembershipRowStyle(membership),
                        "&:last-child .MuiTableCell-root": { borderBottom: "none" },
                      }}
                    >
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight={500} color="text.primary">
                            {membership.client_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {membership.client_phone || "-"}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight={500} color="text.primary">
                            {membership.plan_name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {membership.plan_duration} días
                            {membership.instructor_name ? ` • ${membership.instructor_name}` : ""}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
                        <Typography variant="body2" color="text.secondary">
                          {formatDate(membership.start_date)}
                        </Typography>
                      </TableCell>
                      <TableCell>{getEndDateBadge(membership)}</TableCell>
                      <TableCell sx={{ display: { xs: "none", lg: "table-cell" } }}>
                        <NumericFormat
                          value={membership.plan_price}
                          displayType="text"
                          thousandSeparator="."
                          decimalSeparator=","
                          prefix="$ "
                          decimalScale={2}
                          fixedDecimalScale
                          className="font-semibold text-sm"
                          style={{ color: "#d97706" }}
                        />
                      </TableCell>
                      <TableCell>{getStatusChip(membership.status)}</TableCell>
                      <TableCell align="right">
                        {membership.status === "active" && (
                          <IconButton
                            size="small"
                            onClick={() => handleOpenCancelDialog(membership)}
                            sx={{ color: "#dc2626" }}
                            title="Cancelar membresía"
                            aria-label="Cancelar membresía"
                          >
                            <CancelIcon fontSize="small" />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            {!loading && memberships.length >= 0 && (
              <TablePagination
                component="div"
                count={pagination.total}
                page={pagination.page - 1}
                onPageChange={pagination.handleChangePage}
                rowsPerPage={pagination.limit}
                onRowsPerPageChange={pagination.handleChangeRowsPerPage}
                rowsPerPageOptions={pagination.rowsPerPageOptions}
                labelRowsPerPage="Filas:"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                sx={{
                  borderTop: "1px solid #e5e7eb",
                  fontSize: "0.875rem",
                  ".MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows": {
                    fontWeight: 500,
                    color: "#6b7280",
                  },
                  ".MuiIconButton-root:not(.Mui-disabled)": { color: "#374151" },
                  ".MuiIconButton-root.Mui-disabled": { color: "#d1d5db" },
                }}
              />
            )}
          </TableContainer>
        </Box>
      </Box>

      {/* Modal unificado: Paso 1 = formulario, Paso 2 = pago */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Fade}
        transitionDuration={300}
        PaperProps={{
          sx: {
            borderRadius: { xs: "16px", sm: "20px" },
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
            m: { xs: 2, sm: 3 },
            maxHeight: { xs: "calc(100vh - 32px)", sm: "calc(100vh - 48px)" },
          },
        }}
      >
        {/* Header con indicador de paso */}
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: "#111827",
                  fontSize: { xs: "1.125rem", sm: "1.25rem" },
                }}
              >
                {dialogStep === 1 ? (renewClientFromNav ? "Renovar o cambiar membresía" : "Nueva Membresía") : "Confirmar pago"}
              </Typography>
              <Typography variant="body2" sx={{ color: "#6b7280", mt: 0.25 }}>
                {dialogStep === 1
                  ? (renewClientFromNav ? "La nueva membresía comenzará al vencer la actual" : "Asigna un plan a un cliente")
                  : "Paso 2 de 2 — Seleccioná el método de pago"}
              </Typography>
            </Box>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                px: 1.5,
                py: 0.5,
                borderRadius: "10px",
                backgroundColor: "#f5f5f4",
              }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: dialogStep >= 1 ? "#d97706" : "#d6d3d1",
                }}
              />
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: dialogStep >= 2 ? "#d97706" : "#d6d3d1",
                }}
              />
            </Box>
          </Box>
          <IconButton
            onClick={handleCloseDialog}
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

        {/* Contenido según paso con transición suave */}
        <DialogContent sx={{ px: { xs: 2.5, sm: 3 }, py: 3, minHeight: 280 }}>
          {error && (
            <Alert
              severity="error"
              sx={{ mb: 2.5, borderRadius: "10px" }}
              onClose={() => setError("")}
            >
              {error}
            </Alert>
          )}

          <Fade in key={dialogStep} timeout={280}>
            <Box>
              {dialogStep === 1 ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 500, color: "#374151", mb: 1 }}>
                    Cliente *
                  </Typography>
                  {renewClientFromNav ? (
                    <Box sx={{ p: 2, backgroundColor: "#fffbeb", borderRadius: "12px", border: "1px solid #fde68a" }}>
                      <Typography variant="body2" sx={{ color: "#92400e", fontWeight: 600 }}>Renovación / cambio</Typography>
                      <Typography variant="body1" fontWeight={600} sx={{ color: "#111827", mt: 0.5 }}>{renewClientFromNav.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {renewClientFromNav.dni ? `DNI ${renewClientFromNav.dni}` : ""}
                        {renewClientFromNav.phone ? ` • ${renewClientFromNav.phone}` : ""}
                      </Typography>
                    </Box>
                  ) : (
                  <Autocomplete
                    value={clients.find((c) => c.id === formData.client_id) || null}
                    onChange={(_, newValue) => {
                      const startDate = newValue?.active_membership?.end_date
                        ? String(newValue.active_membership.end_date).split("T")[0]
                        : new Date().toISOString().split("T")[0]
                      setFormData({
                        ...formData,
                        client_id: newValue ? newValue.id : "",
                        start_date: startDate,
                      })
                    }}
                    options={clients}
                    getOptionLabel={(client) =>
                      client ? `${client.name}${client.dni ? ` - DNI: ${client.dni}` : ""}` : ""
                    }
                    isOptionEqualToValue={(option, value) => option?.id === value?.id}
                    filterOptions={(options, { inputValue }) => {
                      const term = (inputValue || "").trim().toLowerCase()
                      if (!term) return options
                      return options.filter(
                        (c) =>
                          (c.name || "").toLowerCase().includes(term) ||
                          (c.dni || "").toString().toLowerCase().includes(term)
                      )
                    }}
                    noOptionsText="No hay clientes que coincidan"
                    loadingText="Cargando clientes..."
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        size="small"
                        placeholder="Escribí nombre o DNI para buscar"
                        required={!formData.client_id}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: "10px",
                            backgroundColor: "#fafafa",
                            "&:hover fieldset": { borderColor: "#d1d5db" },
                            "&.Mui-focused fieldset": { borderColor: "#d97706", borderWidth: "1px" },
                          },
                          "& .MuiInputLabel-root.Mui-focused": { color: "#d97706" },
                        }}
                      />
                    )}
                    renderOption={(props, option) => {
                      const hasActive = option.active_membership != null
                      const untilDate = option.active_membership?.end_date
                        ? format(new Date(option.active_membership.end_date), "dd/MM/yyyy", { locale: es })
                        : ""
                      return (
                        <li {...props} key={option.id}>
                          <Box sx={{ display: "flex", flexDirection: "column", py: 0.5 }}>
                            <Typography variant="body2" fontWeight={600}>
                              {option.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              DNI: {option.dni || "-"}
                              {option.phone ? ` • ${option.phone}` : ""}
                            </Typography>
                            {hasActive && (
                              <Typography variant="caption" sx={{ color: "#b45309", fontWeight: 600, mt: 0.5 }}>
                                Membresía activa hasta {untilDate} — podés renovar o cambiar
                              </Typography>
                            )}
                          </Box>
                        </li>
                      )
                    }}
                  />
                  )}
                </Box>

                <FormControl
                  fullWidth
                  required
                  size="small"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "10px",
                      backgroundColor: "#fafafa",
                      "&:hover fieldset": { borderColor: "#d1d5db" },
                      "&.Mui-focused fieldset": { borderColor: "#d97706", borderWidth: "1px" },
                    },
                    "& .MuiInputLabel-root.Mui-focused": { color: "#d97706" },
                  }}
                >
                  <InputLabel>Plan</InputLabel>
                  <Select
                    value={formData.plan_id}
                    onChange={(e) => {
                      const newPlanId = e.target.value
                      const newPlan = plans.find((p) => p.id === newPlanId)
                      const instructors = newPlan?.instructors || []
                      let newInstructorId = ""
                      if (instructors.length === 1) {
                        newInstructorId = instructors[0].id
                      }
                      setFormData({ ...formData, plan_id: newPlanId, instructor_id: newInstructorId })
                    }}
                    label="Plan"
                    startAdornment={
                      <InputAdornment position="start">
                        <FitnessCenter sx={{ color: "#9ca3af", fontSize: 20 }} />
                      </InputAdornment>
                    }
                  >
                    {plans.length === 0 ? (
                      <MenuItem disabled>No hay planes disponibles</MenuItem>
                    ) : (
                      plans.map((plan) => (
                        <MenuItem key={plan.id} value={plan.id}>
                          {plan.name} - {formatPrice(plan.price)}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>

                {selectedPlan && (() => {
                  const instructors = selectedPlan.instructors || []
                  if (instructors.length === 0) return null
                  if (instructors.length === 1) {
                    return (
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: "10px",
                          backgroundColor: "#f5f5f4",
                          border: "1px solid #e7e5e4",
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 500, color: "#374151", display: "flex", alignItems: "center", gap: 1 }}>
                          <Person sx={{ fontSize: 18, color: "#78716c" }} />
                          Instructor: {instructors[0].name}
                        </Typography>
                      </Box>
                    )
                  }
                  return (
                    <FormControl
                      fullWidth
                      required
                      size="small"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "10px",
                          backgroundColor: "#fafafa",
                          "&:hover fieldset": { borderColor: "#d1d5db" },
                          "&.Mui-focused fieldset": { borderColor: "#d97706", borderWidth: "1px" },
                        },
                        "& .MuiInputLabel-root.Mui-focused": { color: "#d97706" },
                      }}
                    >
                      <InputLabel>Instructor a cargo</InputLabel>
                      <Select
                        value={formData.instructor_id || ""}
                        onChange={(e) => setFormData({ ...formData, instructor_id: e.target.value })}
                        label="Instructor a cargo"
                      >
                        {instructors.map((inst) => (
                          <MenuItem key={inst.id} value={inst.id}>
                            {inst.name}
                            {inst.phone ? ` - ${inst.phone}` : ""}
                          </MenuItem>
                        ))}
                      </Select>
                      <Typography variant="caption" sx={{ color: "#6b7280", mt: 0.5, display: "block" }}>
                        Seleccioná el instructor que estará a cargo de esta membresía
                      </Typography>
                    </FormControl>
                  )
                })()}

                <TextField
                  fullWidth
                  label="Fecha de inicio"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarMonth sx={{ color: "#9ca3af", fontSize: 20 }} />
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
                    "& .MuiInputLabel-root.Mui-focused": { color: "#d97706" },
                  }}
                />

                {selectedPlan && (
                  <Box
                    sx={{
                      p: 2.5,
                      backgroundColor: "#fffbeb",
                      borderRadius: "12px",
                      border: "1px solid #fde68a",
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 600, color: "#92400e", mb: 1.5 }}
                    >
                      Resumen del Plan
                    </Typography>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography variant="body2" color="text.secondary">
                          Duración:
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {selectedPlan.duration_days} días
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography variant="body2" color="text.secondary">
                          Precio:
                        </Typography>
                        <Typography variant="body2" fontWeight={600} sx={{ color: "#d97706" }}>
                          {formatPrice(selectedPlan.price)}
                        </Typography>
                      </Box>
                      {selectedPlan.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {selectedPlan.description}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                )}
              </Box>
            ) : (
              planForPayment && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                  {/* Resumen minimalista */}
                  <Box
                    sx={{
                      p: 2.5,
                      backgroundColor: "#fafafa",
                      borderRadius: "12px",
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 600, color: "#374151", mb: 1.5 }}
                    >
                      Resumen
                    </Typography>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 1.5,
                        fontSize: "0.875rem",
                      }}
                    >
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Plan
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {planForPayment.name}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Duración
                        </Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {planForPayment.duration_days} días
                        </Typography>
                      </Box>
                      {pendingMembership?.instructor_id && (() => {
                        const inst = planForPayment?.instructors?.find(
                          (i) => Number(i.id) === Number(pendingMembership.instructor_id)
                        )
                        return inst ? (
                          <Box sx={{ gridColumn: "1 / -1" }}>
                            <Typography variant="caption" color="text.secondary">
                              Instructor
                            </Typography>
                            <Typography variant="body2" fontWeight={500}>
                              {inst.name}
                            </Typography>
                          </Box>
                        ) : null
                      })()}
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Total
                        </Typography>
                        <Typography variant="body2" fontWeight={600} sx={{ color: "#d97706" }}>
                          {formatPrice(planForPayment.price)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {/* Método de pago */}
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 500, color: "#374151", mb: 1.5 }}
                    >
                      Método de pago *
                    </Typography>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 1.5,
                      }}
                    >
                      {[
                        {
                          id: "cash",
                          label: "Efectivo",
                          sub: "En caja",
                          icon: AttachMoney,
                          color: "#16a34a",
                        },
                        {
                          id: "transfer",
                          label: "Transferencia",
                          sub: "Bancaria",
                          icon: AccountBalance,
                          color: "#2563eb",
                        },
                        {
                          id: "credit_card",
                          label: "Tarjeta",
                          sub: "Crédito/Débito",
                          icon: CreditCard,
                          color: "#7c3aed",
                        },
                        {
                          id: "current_account",
                          label: "Cuenta Corriente",
                          sub: "A crédito",
                          icon: AccountBalanceWallet,
                          color: "#ea580c",
                        },
                      ].map((item) => {
                        const selected = paymentMethod === item.id
                        const Icon = item.icon
                        return (
                          <Box
                            key={item.id}
                            onClick={() => setPaymentMethod(item.id)}
                            sx={{
                              p: 2,
                              borderRadius: "10px",
                              border: "2px solid",
                              borderColor: selected ? item.color : "#e5e7eb",
                              backgroundColor: selected ? `${item.color}08` : "#fff",
                              cursor: "pointer",
                              transition: "all 0.2s",
                              display: "flex",
                              alignItems: "center",
                              gap: 1.5,
                              "&:hover": {
                                borderColor: selected ? item.color : "#d1d5db",
                              },
                            }}
                          >
                            <Box
                              sx={{
                                width: 36,
                                height: 36,
                                borderRadius: "10px",
                                backgroundColor: selected ? item.color : "#f3f4f6",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Icon
                                sx={{ fontSize: 20, color: selected ? "#fff" : "#9ca3af" }}
                              />
                            </Box>
                            <Box>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 600,
                                  color: selected ? item.color : "#374151",
                                }}
                              >
                                {item.label}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {item.sub}
                              </Typography>
                            </Box>
                          </Box>
                        )
                      })}
                    </Box>
                  </Box>

                  {paymentMethod === "current_account" && (
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: "10px",
                        border: "1px solid #fed7aa",
                        backgroundColor: "#fff7ed",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 1.5,
                      }}
                    >
                      <InfoOutlined sx={{ color: "#ea580c", fontSize: 20, mt: 0.25 }} />
                      <Box>
                        <Typography variant="body2" fontWeight={600} sx={{ color: "#9a3412" }}>
                          Cuenta corriente
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#9a3412", display: "block" }}>
                          La membresía se registrará como deuda. El monto no ingresará a caja hasta
                          que se registre el pago.
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>
              )
            )}
            </Box>
          </Fade>
        </DialogContent>

        {/* Footer según paso */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            gap: 1.5,
            px: { xs: 2.5, sm: 3 },
            py: 2.5,
            borderTop: "1px solid #e5e7eb",
            backgroundColor: "#fafafa",
          }}
        >
          {dialogStep === 1 ? (
            <>
              <Button
                onClick={handleCloseDialog}
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
                Cancelar
              </Button>
              <Button
                onClick={handleGoToPayment}
                variant="contained"
                disabled={
                  !formData.client_id ||
                  !formData.plan_id ||
                  !formData.start_date ||
                  (selectedPlan?.instructors?.length >= 2 && !formData.instructor_id)
                }
                sx={{
                  backgroundColor: "#d97706",
                  borderRadius: "10px",
                  textTransform: "none",
                  fontWeight: 600,
                  px: 3,
                  boxShadow: "0 1px 3px rgba(217, 119, 6, 0.3)",
                  "&:hover": {
                    backgroundColor: "#b45309",
                    boxShadow: "0 4px 12px rgba(217, 119, 6, 0.4)",
                  },
                  "&:disabled": { backgroundColor: "#d1d5db" },
                }}
              >
                Continuar al pago
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={handleBackToForm}
                variant="outlined"
                startIcon={<ArrowBack />}
                disabled={paymentLoading}
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
                Volver
              </Button>
              <Button
                onClick={handleConfirmPayment}
                variant="contained"
                disabled={paymentLoading}
                sx={{
                  backgroundColor: "#d97706",
                  borderRadius: "10px",
                  textTransform: "none",
                  fontWeight: 600,
                  px: 3,
                  boxShadow: "0 1px 3px rgba(217, 119, 6, 0.3)",
                  "&:hover": {
                    backgroundColor: "#b45309",
                    boxShadow: "0 4px 12px rgba(217, 119, 6, 0.4)",
                  },
                  "&:disabled": { backgroundColor: "#d1d5db" },
                }}
              >
                {paymentLoading
                  ? "Procesando..."
                  : paymentMethod === "current_account"
                    ? "Registrar a cuenta corriente"
                    : "Confirmar pago"}
              </Button>
            </>
          )}
        </Box>
      </Dialog>

      {/* Modal confirmar cancelación de membresía */}
      <Dialog
        open={openCancelDialog}
        onClose={handleCloseCancelDialog}
        maxWidth="xs"
        fullWidth
        TransitionComponent={Fade}
        transitionDuration={280}
        PaperProps={{
          sx: {
            borderRadius: { xs: "16px", sm: "20px" },
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
            m: { xs: 2, sm: 3 },
          },
        }}
      >
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: "12px",
                backgroundColor: "#fef2f2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <WarningAmber sx={{ color: "#dc2626", fontSize: 26 }} />
            </Box>
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  color: "#111827",
                  fontSize: { xs: "1.0625rem", sm: "1.125rem" },
                }}
              >
                Cancelar membresía
              </Typography>
              <Typography variant="body2" sx={{ color: "#6b7280", mt: 0.25 }}>
                Esta acción no se puede deshacer
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={handleCloseCancelDialog}
            size="small"
            disabled={cancelLoading}
            sx={{
              color: "#9ca3af",
              "&:hover": { backgroundColor: "#f3f4f6", color: "#6b7280" },
            }}
            aria-label="Cerrar"
          >
            <Close fontSize="small" />
          </IconButton>
        </Box>

        <DialogContent sx={{ px: { xs: 2.5, sm: 3 }, py: 3 }}>
          {membershipToCancel && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Typography variant="body2" sx={{ color: "#374151", lineHeight: 1.5 }}>
                ¿Estás seguro de cancelar la membresía de{" "}
                <Typography component="span" fontWeight={700} color="text.primary">
                  {membershipToCancel.client_name}
                </Typography>
                ?
              </Typography>
              <Box
                sx={{
                  p: 2,
                  borderRadius: "12px",
                  backgroundColor: "#fafafa",
                  border: "1px solid #e5e7eb",
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  Plan
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {membershipToCancel.plan_name}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                  Vencimiento: {formatDate(membershipToCancel.end_date)}
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: "#6b7280" }}>
                El cliente no tendrá membresía activa hasta que se genere una nueva.
              </Typography>
              <Typography variant="caption" sx={{ color: "#6b7280", display: "block", mt: 1 }}>
                Si el pago se registró en la sesión de caja actual, el monto se restará de la caja.
                Si fue en una sesión ya cerrada o a cuenta corriente, no se modifica la caja o se revierte la deuda.
              </Typography>
            </Box>
          )}
        </DialogContent>

        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 1.5,
            px: { xs: 2.5, sm: 3 },
            py: 2.5,
            borderTop: "1px solid #e5e7eb",
            backgroundColor: "#fafafa",
          }}
        >
          <Button
            onClick={handleCloseCancelDialog}
            variant="outlined"
            disabled={cancelLoading}
            sx={{
              color: "#6b7280",
              borderColor: "#d1d5db",
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 600,
              px: 3,
              "&:hover": {
                borderColor: "#9ca3af",
                backgroundColor: "#f9fafb",
              },
            }}
          >
            No, mantener
          </Button>
          <Button
            onClick={handleConfirmCancel}
            variant="contained"
            disabled={cancelLoading}
            sx={{
              backgroundColor: "#dc2626",
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 600,
              px: 3,
              boxShadow: "0 1px 3px rgba(220, 38, 38, 0.3)",
              "&:hover": {
                backgroundColor: "#b91c1c",
                boxShadow: "0 4px 12px rgba(220, 38, 38, 0.4)",
              },
              "&:disabled": { backgroundColor: "#d1d5db" },
            }}
          >
            {cancelLoading ? "Cancelando..." : "Sí, cancelar membresía"}
          </Button>
        </Box>
      </Dialog>
    </Box>
  )
}

export default Memberships
