"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Alert,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Fade,
  Chip,
  Paper,
} from "@mui/material"
import {
  Search,
  Person,
  FitnessCenter,
  CalendarMonth,
  Close,
  ArrowBack,
  AttachMoney,
  AccountBalance,
  CreditCard,
  AccountBalanceWallet,
  InfoOutlined,
  Add,
  Login as LoginIcon,
  Badge as BadgeIcon,
  Phone as PhoneIcon,
  Autorenew,
} from "@mui/icons-material"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useAuth } from "../context/AuthContext"
import clientService from "../services/clientService"
import planService from "../services/planService"
import membershipService from "../services/membershipService"
import entryService from "../services/entryService"
import { useDebounce } from "../hooks/useDebounce"

const formatPrice = (price) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(price)

const formatDate = (date) => {
  if (!date) return "-"
  return format(new Date(date), "dd/MM/yyyy", { locale: es })
}

const PAYMENT_METHODS = [
  { id: "cash", label: "Efectivo", sub: "En caja", icon: AttachMoney, color: "#16a34a" },
  { id: "transfer", label: "Transferencia", sub: "Bancaria", icon: AccountBalance, color: "#2563eb" },
  { id: "credit_card", label: "Tarjeta", sub: "Crédito/Débito", icon: CreditCard, color: "#7c3aed" },
  { id: "current_account", label: "Cuenta Corriente", sub: "A crédito", icon: AccountBalanceWallet, color: "#ea580c" },
]

const Dashboard = () => {
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const debouncedSearch = useDebounce(searchTerm, 350)
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [openCreateModal, setOpenCreateModal] = useState(false)
  const [isRenewalFlow, setIsRenewalFlow] = useState(false)
  const [selectedClient, setSelectedClient] = useState(null)
  const [plans, setPlans] = useState([])
  const [createStep, setCreateStep] = useState(1)
  const [formData, setFormData] = useState({
    client_id: "",
    plan_id: "",
    instructor_id: "",
    start_date: new Date().toISOString().split("T")[0],
  })
  const [pendingMembership, setPendingMembership] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [entryLoadingClientId, setEntryLoadingClientId] = useState(null)

  const runSearch = useCallback(async (term) => {
    if (!term || term.trim().length < 2) {
      setSearchResults([])
      return
    }
    setSearchLoading(true)
    setError("")
    try {
      const { data } = await clientService.quickSearch({ search: term.trim(), limit: 15 })
      setSearchResults(Array.isArray(data) ? data : [])
    } catch (err) {
      setSearchResults([])
      setError(err.response?.data?.message || "Error al buscar clientes")
    } finally {
      setSearchLoading(false)
    }
  }, [])

  useEffect(() => {
    runSearch(debouncedSearch)
  }, [debouncedSearch, runSearch])

  useEffect(() => {
    if (openCreateModal && selectedClient) {
      const endDate = selectedClient.active_membership?.end_date
      const startDateForRenewal = endDate ? String(endDate).split("T")[0] : new Date().toISOString().split("T")[0]
      setFormData({
        client_id: selectedClient.id,
        plan_id: "",
        instructor_id: "",
        start_date: isRenewalFlow ? startDateForRenewal : new Date().toISOString().split("T")[0],
      })
      setCreateStep(1)
      setPendingMembership(null)
      setPaymentMethod("cash")
      planService.getAll().then((res) => {
        const list = res?.data ?? res ?? []
        setPlans(Array.isArray(list) ? list : [])
      }).catch(() => setPlans([]))
    }
  }, [openCreateModal, selectedClient, isRenewalFlow])

  const getWelcomeMessage = () => {
    if (user?.role === "admin") return "Bienvenido, Administrador"
    if (user?.role === "empleado") return "Bienvenido"
    return "Bienvenido"
  }

  const handleOpenCreateMembership = (client) => {
    setIsRenewalFlow(false)
    setSelectedClient(client)
    setOpenCreateModal(true)
    setError("")
  }

  const handleOpenRenewOrChange = (client) => {
    setIsRenewalFlow(true)
    setSelectedClient(client)
    setOpenCreateModal(true)
    setError("")
  }

  const handleRegisterEntry = async (client) => {
    setEntryLoadingClientId(client.id)
    setError("")
    try {
      await entryService.registerEntry(client.id)
      setSuccess("Entrada registrada correctamente")
      if (debouncedSearch.trim().length >= 2) runSearch(debouncedSearch)
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError(err.response?.data?.message || "Error al registrar la entrada")
    } finally {
      setEntryLoadingClientId(null)
    }
  }

  const handleCloseCreateModal = () => {
    setOpenCreateModal(false)
    setIsRenewalFlow(false)
    setSelectedClient(null)
    setCreateStep(1)
    setPendingMembership(null)
    setError("")
  }

  const handleGoToPayment = () => {
    setError("")
    const plan = plans.find((p) => p.id === formData.plan_id)
    if (!plan) {
      setError("Seleccioná un plan")
      return
    }
    const instructors = plan.instructors || []
    if (instructors.length >= 2 && !formData.instructor_id) {
      setError("Seleccioná el instructor para esta membresía")
      return
    }
    setPendingMembership({ ...formData })
    setCreateStep(2)
  }

  const handleConfirmPayment = async () => {
    if (!pendingMembership) return
    setPaymentLoading(true)
    setError("")
    try {
      await membershipService.create({
        ...pendingMembership,
        payment_method: paymentMethod,
      })
      setSuccess("Membresía creada correctamente")
      handleCloseCreateModal()
      if (debouncedSearch.trim().length >= 2) {
        runSearch(debouncedSearch)
      }
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError(err.response?.data?.message || "Error al crear la membresía")
    } finally {
      setPaymentLoading(false)
    }
  }

  const selectedPlan = plans.find((p) => p.id === formData.plan_id)
  const planForPayment = plans.find((p) => p.id === pendingMembership?.plan_id)

  const getMembershipBadge = (client) => {
    if (!client.active_membership) {
      return { label: "Sin membresía activa", bg: "#fef3c7", border: "#fcd34d", color: "#92400e" }
    }
    const m = client.active_membership
    const dur = Number(m.duration_days)
    const d = Number(m.days_remaining)
    const isShortPlan = dur <= 5
    if (isShortPlan) {
      return {
        label: d === 0 ? "Vence hoy" : d === 1 ? "1 día" : `${d} días`,
        bg: "#dcfce7",
        border: "#86efac",
        color: "#166534",
      }
    }
    if (d === 0 || d === 1) {
      return {
        label: d === 0 ? "Vence hoy" : "1 día",
        bg: "#fee2e2",
        border: "#fca5a5",
        color: "#991b1b",
      }
    }
    if ([2, 3, 4, 5].includes(d)) {
      return {
        label: `${d} días`,
        bg: "#ffedd5",
        border: "#fdba74",
        color: "#c2410c",
      }
    }
    return {
      label: `${d} días restantes`,
      bg: "#dcfce7",
      border: "#86efac",
      color: "#166534",
    }
  }

  return (
    <Box className="min-h-screen bg-gradient-to-br from-gray-50 via-amber-50/20 to-gray-50">
      <Box className="p-4 sm:p-6 lg:p-8 max-w-[900px] mx-auto">
        <Box className="mb-6">
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: "#111827",
              letterSpacing: "-0.02em",
              fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" },
            }}
          >
            {getWelcomeMessage()}
          </Typography>
          <Typography variant="body1" sx={{ color: "#6b7280", fontWeight: 500, mt: 0.5 }}>
            {user?.name} • Buscá un cliente para ver su estado o crear una membresía
          </Typography>
        </Box>

        {error && (
          <Alert
            severity="error"
            sx={{ mb: 2, borderRadius: "12px" }}
            onClose={() => setError("")}
          >
            {error}
          </Alert>
        )}
        {success && (
          <Alert
            severity="success"
            sx={{ mb: 2, borderRadius: "12px" }}
            onClose={() => setSuccess("")}
          >
            {success}
          </Alert>
        )}

        {/* Buscador rápido */}
        <Box
          className="bg-white rounded-2xl p-4 sm:p-6 mb-6"
          sx={{
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            border: "1px solid #e5e7eb",
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#374151", mb: 2 }}>
            Búsqueda rápida
          </Typography>
          <TextField
            fullWidth
            placeholder="Buscar por nombre o DNI..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="medium"
            autoFocus
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: "#9ca3af", fontSize: 24 }} />
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "14px",
                backgroundColor: "#fafafa",
                fontSize: "1rem",
                "&:hover fieldset": { borderColor: "#e5e7eb" },
                "&.Mui-focused fieldset": { borderColor: "#d97706", borderWidth: "2px" },
              },
            }}
          />
          {searchTerm.trim().length > 0 && searchTerm.trim().length < 2 && (
            <Typography variant="caption" sx={{ color: "#6b7280", mt: 1, display: "block" }}>
              Escribí al menos 2 caracteres para buscar
            </Typography>
          )}
        </Box>

        {/* Resultados */}
        <Box
          className="bg-white rounded-2xl overflow-hidden"
          sx={{
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            border: "1px solid #e5e7eb",
          }}
        >
          {searchLoading ? (
            <Box sx={{ py: 6, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <Box className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <Typography variant="body2" color="text.secondary">Buscando...</Typography>
            </Box>
          ) : debouncedSearch.trim().length < 2 ? (
            <Box sx={{ py: 6, px: 3, textAlign: "center" }}>
              <Person sx={{ fontSize: 48, color: "#d6d3d1", mb: 1 }} />
              <Typography variant="body1" color="text.secondary">
                Escribí nombre o DNI del cliente para ver si tiene membresía activa o crear una nueva
              </Typography>
            </Box>
          ) : searchResults.length === 0 ? (
            <Box sx={{ py: 6, px: 3, textAlign: "center" }}>
              <Typography variant="body1" color="text.secondary">
                No se encontraron clientes con &quot;{debouncedSearch}&quot;
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(2, 1fr)" },
                gap: 2,
                p: 2,
              }}
            >
              {searchResults.map((client) => {
                const badge = getMembershipBadge(client)
                const hasActive = !!client.active_membership
                const durationDays = Number(client.active_membership?.duration_days ?? 0)
                const canRegister = hasActive && durationDays > 1
                const canRenewOrChange = hasActive && durationDays > 5
                return (
                  <Paper
                    key={client.id}
                    elevation={0}
                    sx={{
                      borderRadius: "16px",
                      border: "1px solid #e5e7eb",
                      overflow: "hidden",
                      transition: "box-shadow 0.2s, border-color 0.2s",
                      "&:hover": {
                        boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                        borderColor: "#d1d5db",
                      },
                    }}
                  >
                    <Box sx={{ p: 2.5 }}>
                      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, mb: 1.5 }}>
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: "12px",
                            bgcolor: "#f5f5f4",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <Person sx={{ color: "#78716c", fontSize: 24 }} />
                        </Box>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography
                            variant="subtitle1"
                            sx={{
                              fontWeight: 600,
                              color: "#111827",
                              fontSize: "1rem",
                              lineHeight: 1.3,
                            }}
                          >
                            {client.name}
                          </Typography>
                          <Box
                            sx={{
                              display: "flex",
                              flexWrap: "wrap",
                              alignItems: "center",
                              gap: 0.75,
                              mt: 0.5,
                            }}
                          >
                            {client.dni && (
                              <Typography variant="caption" sx={{ color: "#6b7280", fontWeight: 500 }}>
                                DNI {client.dni}
                              </Typography>
                            )}
                            {client.phone && (
                              <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
                                {client.dni && (
                                  <Typography component="span" variant="caption" sx={{ color: "#d1d5db" }}>
                                    •
                                  </Typography>
                                )}
                                <PhoneIcon sx={{ fontSize: 14, color: "#9ca3af" }} />
                                <Typography variant="caption" sx={{ color: "#6b7280" }}>
                                  {client.phone}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </Box>
                      </Box>

                      <Box
                        sx={{
                          display: "inline-flex",
                          flexWrap: "wrap",
                          alignItems: "center",
                          gap: 0.75,
                          px: 1.5,
                          py: 1,
                          borderRadius: "10px",
                          backgroundColor: badge.bg,
                          border: `1px solid ${badge.border}`,
                          mb: 2,
                        }}
                      >
                        <BadgeIcon sx={{ fontSize: 16, color: badge.color }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.8125rem", color: badge.color }}>
                          {badge.label}
                        </Typography>
                        {client.active_membership?.end_date ? (
                          <Typography variant="caption" sx={{ color: badge.color, opacity: 0.9, fontSize: "0.75rem" }}>
                            hasta {formatDate(client.active_membership.end_date)}
                            {client.active_membership.plan_name ? ` · ${client.active_membership.plan_name}` : ""}
                          </Typography>
                        ) : null}
                      </Box>

                      {canRegister ? (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
                          <Button
                            fullWidth
                            variant="contained"
                            size="medium"
                            startIcon={<LoginIcon />}
                            onClick={() => handleRegisterEntry(client)}
                            disabled={entryLoadingClientId === client.id}
                            sx={{
                              borderRadius: "12px",
                              textTransform: "none",
                              fontWeight: 600,
                              py: 1.25,
                              fontSize: "0.9375rem",
                              backgroundColor: "#16a34a",
                              boxShadow: "0 1px 3px rgba(22, 163, 74, 0.3)",
                              "&:hover": { backgroundColor: "#15803d" },
                              "&:disabled": { backgroundColor: "#d1d5db" },
                            }}
                          >
                            {entryLoadingClientId === client.id ? "Registrando..." : "Registrar entrada"}
                          </Button>
                          {canRenewOrChange && (
                            <Button
                              fullWidth
                              variant="outlined"
                              size="medium"
                              startIcon={<Autorenew />}
                              onClick={() => handleOpenRenewOrChange(client)}
                              sx={{
                                borderRadius: "12px",
                                textTransform: "none",
                                fontWeight: 600,
                                py: 1.25,
                                fontSize: "0.9375rem",
                                borderColor: "#d97706",
                                color: "#b45309",
                                "&:hover": { borderColor: "#b45309", backgroundColor: "#fff7ed" },
                              }}
                            >
                              Renovar o cambiar
                            </Button>
                          )}
                        </Box>
                      ) : !hasActive ? (
                        <Button
                          fullWidth
                          variant="contained"
                          size="medium"
                          startIcon={<Add />}
                          onClick={() => handleOpenCreateMembership(client)}
                          sx={{
                            borderRadius: "12px",
                            textTransform: "none",
                            fontWeight: 600,
                            py: 1.25,
                            fontSize: "0.9375rem",
                            backgroundColor: "#d97706",
                            boxShadow: "0 1px 3px rgba(217, 119, 6, 0.3)",
                            "&:hover": { backgroundColor: "#b45309" },
                          }}
                        >
                          Crear membresía
                        </Button>
                      ) : (
                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
                          <Box
                            sx={{
                              py: 1.25,
                              borderRadius: "12px",
                              backgroundColor: "#f5f5f4",
                              textAlign: "center",
                            }}
                          >
                            <Typography variant="body2" sx={{ fontWeight: 500, color: "#6b7280" }}>
                              Membresía activa
                            </Typography>
                          </Box>
                          {canRenewOrChange && (
                            <Button
                              fullWidth
                              variant="outlined"
                              size="medium"
                              startIcon={<Autorenew />}
                              onClick={() => handleOpenRenewOrChange(client)}
                              sx={{
                                borderRadius: "12px",
                                textTransform: "none",
                                fontWeight: 600,
                                py: 1.25,
                                fontSize: "0.9375rem",
                                borderColor: "#d97706",
                                color: "#b45309",
                                "&:hover": { borderColor: "#b45309", backgroundColor: "#fff7ed" },
                              }}
                            >
                              Renovar o cambiar
                            </Button>
                          )}
                        </Box>
                      )}
                    </Box>
                  </Paper>
                )
              })}
            </Box>
          )}
        </Box>
      </Box>

      {/* Modal crear membresía (cliente preseleccionado) */}
      <Dialog
        open={openCreateModal}
        onClose={handleCloseCreateModal}
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
        <Box sx={{ px: { xs: 2.5, sm: 3 }, py: 2.5, borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: "#111827", fontSize: { xs: "1.125rem", sm: "1.25rem" } }}>
                {createStep === 1 ? (isRenewalFlow ? "Renovar o cambiar membresía" : "Nueva membresía") : "Confirmar pago"}
              </Typography>
              <Typography variant="body2" sx={{ color: "#6b7280", mt: 0.25 }}>
                {createStep === 1
                  ? (isRenewalFlow ? "La nueva membresía comenzará al vencer la actual" : "Cliente preseleccionado desde el inicio")
                  : "Paso 2 de 2 — Método de pago"}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 0.5, px: 1.5, py: 0.5, borderRadius: "10px", backgroundColor: "#f5f5f4" }}>
              <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: createStep >= 1 ? "#d97706" : "#d6d3d1" }} />
              <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: createStep >= 2 ? "#d97706" : "#d6d3d1" }} />
            </Box>
          </Box>
          <IconButton onClick={handleCloseCreateModal} size="small" sx={{ color: "#9ca3af", "&:hover": { backgroundColor: "#f3f4f6", color: "#6b7280" } }} aria-label="Cerrar">
            <Close fontSize="small" />
          </IconButton>
        </Box>

        <DialogContent sx={{ px: { xs: 2.5, sm: 3 }, py: 3, minHeight: 280 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: "10px" }} onClose={() => setError("")}>
              {error}
            </Alert>
          )}

          <Fade in key={createStep} timeout={280}>
            <Box>
              {createStep === 1 ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                  {selectedClient && (
                    <Box sx={{ p: 2, backgroundColor: "#fafafa", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
                      <Typography variant="caption" color="text.secondary">Cliente</Typography>
                      <Typography variant="body1" fontWeight={600}>{selectedClient.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedClient.dni ? `DNI ${selectedClient.dni}` : ""}
                        {selectedClient.phone ? ` • ${selectedClient.phone}` : ""}
                      </Typography>
                    </Box>
                  )}
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
                        const newInstructorId = instructors.length === 1 ? instructors[0].id : ""
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
                        <MenuItem disabled>Cargando planes...</MenuItem>
                      ) : (
                        plans.map((plan) => (
                          <MenuItem key={plan.id} value={plan.id}>
                            {plan.name} — {formatPrice(plan.price)}
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
                        <Box sx={{ p: 1.5, borderRadius: "10px", backgroundColor: "#f5f5f4", border: "1px solid #e7e5e4" }}>
                          <Typography variant="body2" sx={{ fontWeight: 500, color: "#374151" }}>
                            Instructor: {instructors[0].name}
                          </Typography>
                        </Box>
                      )
                    }
                    return (
                      <FormControl fullWidth required size="small" sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", backgroundColor: "#fafafa", "&:hover fieldset": { borderColor: "#d1d5db" }, "&.Mui-focused fieldset": { borderColor: "#d97706", borderWidth: "1px" } }, "& .MuiInputLabel-root.Mui-focused": { color: "#d97706" } }}>
                        <InputLabel>Instructor a cargo</InputLabel>
                        <Select value={formData.instructor_id || ""} onChange={(e) => setFormData({ ...formData, instructor_id: e.target.value })} label="Instructor a cargo">
                          {instructors.map((inst) => (
                            <MenuItem key={inst.id} value={inst.id}>{inst.name}{inst.phone ? ` - ${inst.phone}` : ""}</MenuItem>
                          ))}
                        </Select>
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
                    <Box sx={{ p: 2.5, backgroundColor: "#fffbeb", borderRadius: "12px", border: "1px solid #fde68a" }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#92400e", mb: 1.5 }}>Resumen del plan</Typography>
                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography variant="body2" color="text.secondary">Duración</Typography>
                        <Typography variant="body2" fontWeight={500}>{selectedPlan.duration_days} días</Typography>
                      </Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography variant="body2" color="text.secondary">Precio</Typography>
                        <Typography variant="body2" fontWeight={600} sx={{ color: "#d97706" }}>{formatPrice(selectedPlan.price)}</Typography>
                      </Box>
                    </Box>
                  )}
                </Box>
              ) : planForPayment ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                  <Box sx={{ p: 2.5, backgroundColor: "#fafafa", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#374151", mb: 1.5 }}>Resumen</Typography>
                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Plan</Typography>
                        <Typography variant="body2" fontWeight={500}>{planForPayment.name}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Duración</Typography>
                        <Typography variant="body2" fontWeight={500}>{planForPayment.duration_days} días</Typography>
                      </Box>
                      {pendingMembership?.instructor_id && (() => {
                        const inst = planForPayment?.instructors?.find((i) => Number(i.id) === Number(pendingMembership.instructor_id))
                        return inst ? (
                          <Box sx={{ gridColumn: "1 / -1" }}>
                            <Typography variant="caption" color="text.secondary">Instructor</Typography>
                            <Typography variant="body2" fontWeight={500}>{inst.name}</Typography>
                          </Box>
                        ) : null
                      })()}
                      <Box>
                        <Typography variant="caption" color="text.secondary">Total</Typography>
                        <Typography variant="body2" fontWeight={600} sx={{ color: "#d97706" }}>{formatPrice(planForPayment.price)}</Typography>
                      </Box>
                    </Box>
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: "#374151", mb: 1.5 }}>Método de pago *</Typography>
                    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
                      {PAYMENT_METHODS.map((item) => {
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
                              "&:hover": { borderColor: selected ? item.color : "#d1d5db" },
                            }}
                          >
                            <Box sx={{ width: 36, height: 36, borderRadius: "10px", backgroundColor: selected ? item.color : "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Icon sx={{ fontSize: 20, color: selected ? "#fff" : "#9ca3af" }} />
                            </Box>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: selected ? item.color : "#374151" }}>{item.label}</Typography>
                              <Typography variant="caption" color="text.secondary">{item.sub}</Typography>
                            </Box>
                          </Box>
                        )
                      })}
                    </Box>
                  </Box>
                  {paymentMethod === "current_account" && (
                    <Box sx={{ p: 2, borderRadius: "10px", border: "1px solid #fed7aa", backgroundColor: "#fff7ed", display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                      <InfoOutlined sx={{ color: "#ea580c", fontSize: 20, mt: 0.25 }} />
                      <Box>
                        <Typography variant="body2" fontWeight={600} sx={{ color: "#9a3412" }}>Cuenta corriente</Typography>
                        <Typography variant="caption" sx={{ color: "#9a3412", display: "block" }}>
                          La membresía se registrará como deuda. El monto no ingresará a caja hasta que se registre el pago.
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </Box>
              ) : null}
            </Box>
          </Fade>
        </DialogContent>

        <Box sx={{ px: { xs: 2.5, sm: 3 }, py: 2.5, borderTop: "1px solid #e5e7eb", backgroundColor: "#fafafa", display: "flex", justifyContent: "space-between", gap: 1.5 }}>
          {createStep === 1 ? (
            <>
              <Button
                onClick={handleCloseCreateModal}
                variant="outlined"
                sx={{ color: "#6b7280", borderColor: "#d1d5db", borderRadius: "10px", textTransform: "none", fontWeight: 500, px: 3, "&:hover": { borderColor: "#9ca3af", backgroundColor: "#f9fafb" } }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleGoToPayment}
                variant="contained"
                disabled={
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
                  "&:hover": { backgroundColor: "#b45309" },
                  "&:disabled": { backgroundColor: "#d1d5db" },
                }}
              >
                Continuar al pago
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={() => { setCreateStep(1); setError(""); }}
                variant="outlined"
                startIcon={<ArrowBack />}
                disabled={paymentLoading}
                sx={{ color: "#6b7280", borderColor: "#d1d5db", borderRadius: "10px", textTransform: "none", fontWeight: 500, px: 3, "&:hover": { borderColor: "#9ca3af", backgroundColor: "#f9fafb" } }}
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
                  "&:hover": { backgroundColor: "#b45309" },
                  "&:disabled": { backgroundColor: "#d1d5db" },
                }}
              >
                {paymentLoading ? "Procesando..." : paymentMethod === "current_account" ? "Registrar a cuenta corriente" : "Confirmar pago"}
              </Button>
            </>
          )}
        </Box>
      </Dialog>
    </Box>
  )
}

export default Dashboard
