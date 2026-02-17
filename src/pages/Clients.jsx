"use client"

import { useState, useEffect, useCallback, useRef } from "react"
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
  TablePagination,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  Paper,
  InputAdornment,
  FormControlLabel,
  Checkbox,
  Tooltip,
} from "@mui/material"
import { Add, Edit, AccountBalance, Search, Refresh, Close, Person, Badge, Phone, Home, Lock, DriveFileRenameOutline, Visibility, PersonOff, Chat } from "@mui/icons-material"
import { NumericFormat } from "react-number-format"
import { useNavigate } from "react-router-dom"
import clientService from "../services/clientService"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import CurrentAccountDialog from "../components/clients/CurrentAccountDialog"
import ClientDetailDialog from "../components/clients/ClientDetailDialog"
import { useDebounce } from "../hooks/useDebounce"
import { usePagination } from "../hooks/usePagination"
import {
  normalizePhoneForWhatsApp,
  getWelcomeMessageWhatsApp,
  getWhatsAppWebUrl,
  canSendMembershipReminder,
  getMembershipReminderMessage,
  getMembershipRowStyle,
} from "../utils/phoneAr"
import membershipService from "../services/membershipService"

const Clients = () => {
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })
  const [searchTerm, setSearchTerm] = useState("")
  const [debtFilter, setDebtFilter] = useState("all") // "all" | "al_day" | "with_debt"
  const [showInactiveOnly, setShowInactiveOnly] = useState(false) // false = solo activos (por defecto), true = solo inactivos
  const [daysRemainingFilter, setDaysRemainingFilter] = useState(null) // null | 0 | 1 | 2 | 3 | 4 | 5 | 'expired'
  const [currentClient, setCurrentClient] = useState({
    id: null,
    username: "",
    password: "",
    name: "",
    phone: "",
    dni: "",
    address: "",
    active: true,
  })
  const [openCurrentAccountDialog, setOpenCurrentAccountDialog] = useState(false)
  const [selectedClientForAccount, setSelectedClientForAccount] = useState(null)
  const [openDetailDialog, setOpenDetailDialog] = useState(false)
  const [selectedClientForDetail, setSelectedClientForDetail] = useState(null)
  const [openWhatsAppConfirmDialog, setOpenWhatsAppConfirmDialog] = useState(false)
  const [whatsAppConfirmData, setWhatsAppConfirmData] = useState(null)
  const [openMembershipReminderDialog, setOpenMembershipReminderDialog] = useState(false)
  const [membershipReminderData, setMembershipReminderData] = useState(null)
  const [dialogError, setDialogError] = useState("")

  const debouncedSearchTerm = useDebounce(searchTerm, 500)
  const pagination = usePagination({ limit: 10, rowsPerPageOptions: [5, 10, 25, 50] })
  const prevSearchRef = useRef(debouncedSearchTerm)
  const prevDebtFilterRef = useRef(debtFilter)
  const prevShowInactiveRef = useRef(showInactiveOnly)
  const prevDaysRemainingRef = useRef(daysRemainingFilter)

  const loadClients = useCallback(async () => {
    const searchChanged = prevSearchRef.current !== debouncedSearchTerm
    const filterChanged = prevDebtFilterRef.current !== debtFilter
    const inactiveFilterChanged = prevShowInactiveRef.current !== showInactiveOnly
    const daysFilterChanged = prevDaysRemainingRef.current !== daysRemainingFilter
    if (searchChanged) prevSearchRef.current = debouncedSearchTerm
    if (filterChanged) prevDebtFilterRef.current = debtFilter
    if (inactiveFilterChanged) prevShowInactiveRef.current = showInactiveOnly
    if (daysFilterChanged) prevDaysRemainingRef.current = daysRemainingFilter
    const pageToLoad = searchChanged || filterChanged || inactiveFilterChanged || daysFilterChanged ? 1 : pagination.page
    try {
      setLoading(true)
      const { data, pagination: resPagination } = await clientService.getClientsPaginated({
        page: pageToLoad,
        limit: pagination.limit,
        search: debouncedSearchTerm,
        debt_filter: debtFilter,
        include_active_membership: !showInactiveOnly,
        active_filter: showInactiveOnly ? "inactive" : "active",
        days_remaining:
          typeof daysRemainingFilter === "number" ? daysRemainingFilter : undefined,
        filter_expired: daysRemainingFilter === "expired",
      })
      setClients(Array.isArray(data) ? data : [])
      pagination.setPagination(resPagination)
    } catch (error) {
      if (!error.cancelled) {
        setMessage({ type: "error", text: "Error al cargar clientes" })
      }
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, debouncedSearchTerm, debtFilter, showInactiveOnly, daysRemainingFilter])

  useEffect(() => {
    loadClients()
  }, [loadClients])

  const handleOpenDialog = (client = null) => {
    setDialogError("")
    if (client) {
      setEditMode(true)
      setCurrentClient({
        id: client.id,
        username: client.username,
        name: client.name,
        phone: client.phone || "",
        dni: client.dni || "",
        address: client.address || "",
        active: client.active,
        password: "",
      })
    } else {
      setEditMode(false)
      setCurrentClient({
        id: null,
        username: "",
        password: "",
        name: "",
        phone: "",
        dni: "",
        address: "",
        active: true,
      })
    }
    setOpenDialog(true)
  }

  const handleCloseWhatsAppConfirm = () => {
    setOpenWhatsAppConfirmDialog(false)
    setWhatsAppConfirmData(null)
  }

  const handleConfirmSendWhatsApp = () => {
    if (!whatsAppConfirmData) return
    const normalized = normalizePhoneForWhatsApp(whatsAppConfirmData.phone)
    if (normalized) {
      const msg = getWelcomeMessageWhatsApp(whatsAppConfirmData.username, whatsAppConfirmData.password)
      const url = getWhatsAppWebUrl(normalized, msg)
      window.open(url, "_blank", "noopener,noreferrer")
    }
    handleCloseWhatsAppConfirm()
  }

  const handleOpenMembershipReminder = (client) => {
    const m = client?.active_membership
    const days = m?.days_remaining
    const phone = client?.phone?.toString?.()?.trim?.()
    if (!phone || days === undefined || days === null || !m?.membership_id) return
    setMembershipReminderData({
      phone,
      daysRemaining: Number(days),
      membershipId: m.membership_id,
      clientName: client?.name,
    })
    setOpenMembershipReminderDialog(true)
  }

  const handleCloseMembershipReminder = () => {
    setOpenMembershipReminderDialog(false)
    setMembershipReminderData(null)
  }

  const handleConfirmSendMembershipReminder = async () => {
    if (!membershipReminderData) return
    const { membershipId, daysRemaining, phone } = membershipReminderData
    try {
      await membershipService.recordReminder(membershipId, daysRemaining)
    } catch (e) {
      setMessage({ type: "error", text: "No se pudo registrar el envío del recordatorio." })
    }
    const normalized = normalizePhoneForWhatsApp(phone)
    if (normalized) {
      const msg = getMembershipReminderMessage(daysRemaining)
      const url = getWhatsAppWebUrl(normalized, msg)
      window.open(url, "_blank", "noopener,noreferrer")
    }
    handleCloseMembershipReminder()
    loadClients()
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setDialogError("")
    setCurrentClient({
      id: null,
      username: "",
      password: "",
      name: "",
      phone: "",
      dni: "",
      address: "",
      active: true,
    })
  }

  const handleSaveClient = async () => {
    try {
      setMessage({ type: "", text: "" })

      if (editMode) {
        await clientService.updateClient(currentClient.id, {
          username: currentClient.username,
          name: currentClient.name,
          phone: currentClient.phone,
          dni: currentClient.dni,
          address: currentClient.address,
          active: currentClient.active,
        })
        setMessage({ type: "success", text: "Cliente actualizado correctamente" })
      } else {
        const passwordToUse = currentClient.password?.trim() || currentClient.dni?.trim() || ""
        await clientService.createClient({
          username: currentClient.username,
          password: passwordToUse,
          name: currentClient.name,
          phone: currentClient.phone,
          dni: currentClient.dni,
          address: currentClient.address,
        })
        setMessage({ type: "success", text: "Cliente creado correctamente." })

        const phone = currentClient.phone?.toString?.()?.trim?.()
        if (phone) {
          setWhatsAppConfirmData({
            phone,
            username: currentClient.username,
            password: passwordToUse,
          })
          setOpenWhatsAppConfirmDialog(true)
        }
      }

      handleCloseDialog()
      loadClients()
    } catch (error) {
      const errorText = error.response?.data?.message || "Error al guardar cliente"
      setDialogError(errorText)
      setMessage({ type: "error", text: errorText })
    }
  }

  const handleDeleteClient = async (id) => {
    if (!window.confirm("¿Estás seguro de que deseas desactivar este cliente?")) {
      return
    }

    try {
      await clientService.deleteClient(id)
      setMessage({ type: "success", text: "Cliente desactivado correctamente" })
      loadClients()
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.message || "Error al desactivar cliente" })
    }
  }

  const handleOpenCurrentAccount = (client) => {
    setSelectedClientForAccount(client)
    setOpenCurrentAccountDialog(true)
  }

  const handleCloseCurrentAccount = () => {
    setOpenCurrentAccountDialog(false)
    setSelectedClientForAccount(null)
  }

  const handleOpenDetail = (client) => {
    setSelectedClientForDetail(client)
    setOpenDetailDialog(true)
  }

  const handleCloseDetail = () => {
    setOpenDetailDialog(false)
    setSelectedClientForDetail(null)
  }

  const formatDate = (date) => {
    if (!date) return "Nunca"
    return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: es })
  }

  const refreshList = useCallback(() => {
    loadClients()
  }, [loadClients])

  return (
    <Box className="min-h-screen bg-gradient-to-br from-gray-50 via-amber-50/20 to-gray-50">
      <Box className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
        {/* Header */}
        <Box className="mb-8">
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: "#111827",
              letterSpacing: "-0.02em",
              fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" },
            }}
          >
            Gestión de Clientes
          </Typography>
          <Typography variant="body1" sx={{ color: "#6b7280", fontWeight: 500, mt: 0.5 }}>
            Administra los clientes del gimnasio
          </Typography>
        </Box>

        {message.text && (
          <Alert
            severity={message.type}
            sx={{
              mb: 3,
              borderRadius: "14px",
              boxShadow:
                message.type === "error" ? "0 2px 8px rgba(220, 38, 38, 0.15)" : "0 2px 8px rgba(34, 197, 94, 0.15)",
            }}
            onClose={() => setMessage({ type: "", text: "" })}
          >
            {message.text}
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                placeholder="Buscar cliente"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: "#9ca3af" }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  minWidth: { xs: "100%", sm: 220 },
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
                <InputLabel id="debt-filter-label" sx={{ fontSize: "0.875rem" }}>
                  Cuenta corriente
                </InputLabel>
                <Select
                  labelId="debt-filter-label"
                  id="debt-filter"
                  value={debtFilter}
                  label="Cuenta corriente"
                  onChange={(e) => setDebtFilter(e.target.value)}
                  sx={{
                    "& .MuiSelect-select": { py: 1 },
                  }}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="al_day">Al día</MenuItem>
                  <MenuItem value="with_debt">Con deuda</MenuItem>
                </Select>
              </FormControl>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={showInactiveOnly}
                    onChange={(e) => setShowInactiveOnly(e.target.checked)}
                    size="small"
                    sx={{
                      color: "#78716c",
                      "&.Mui-checked": { color: "#d97706" },
                    }}
                  />
                }
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <PersonOff sx={{ fontSize: 18, color: showInactiveOnly ? "#d97706" : "#9ca3af" }} />
                    <Typography variant="body2" sx={{ fontWeight: 500, color: showInactiveOnly ? "#92400e" : "#6b7280" }}>
                      Mostrar inactivos
                    </Typography>
                  </Box>
                }
                sx={{ ml: 0.5 }}
              />
              {!showInactiveOnly && (
                <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 0.75 }}>
                  <Typography variant="body2" sx={{ color: "#6b7280", fontWeight: 500, mr: 0.5 }}>
                    Vence en:
                  </Typography>
                  {[null, 5, 4, 3, 2, 1, 0, "expired"].map((d) => (
                    <Chip
                      key={d === null ? "all" : d}
                      label={
                        d === null
                          ? "Todos"
                          : d === "expired"
                            ? "Vencidas"
                            : d === 0
                              ? "Vence hoy"
                              : d === 1
                                ? "1 día"
                                : `${d} días`
                      }
                      onClick={() => setDaysRemainingFilter(d)}
                      size="small"
                      sx={{
                        fontWeight: 600,
                        "&.MuiChip-clickable": { cursor: "pointer" },
                        ...(daysRemainingFilter === d
                          ? {
                              backgroundColor: d === "expired" ? "#b91c1c" : "#d97706",
                              color: "#fff",
                              "&:hover": {
                                backgroundColor: d === "expired" ? "#991b1b" : "#b45309",
                              },
                            }
                          : {
                              backgroundColor: "#f5f5f4",
                              color: "#6b7280",
                              "&:hover": { backgroundColor: "#e7e5e4", color: "#92400e" },
                            }),
                      }}
                    />
                  ))}
                </Box>
              )}
              <IconButton
                onClick={refreshList}
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
              onClick={() => handleOpenDialog()}
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
              Nuevo Cliente
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
                  <TableCell>Usuario</TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>DNI</TableCell>
                  <TableCell sx={{ display: { xs: "none", lg: "table-cell" } }}>Teléfono</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>Membresía</TableCell>
                  <TableCell>Cuenta corriente</TableCell>
                  <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>Último login</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                      <Box className="flex flex-col items-center gap-3">
                        <Box className="w-9 h-9 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                        <Typography variant="body2" color="text.secondary">
                          Cargando...
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : clients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                      <Typography variant="body2" color="text.secondary">
                        {showInactiveOnly
                          ? "No hay clientes inactivos"
                          : debouncedSearchTerm || debtFilter !== "all"
                            ? "No se encontraron clientes con los criterios aplicados"
                            : "No hay clientes disponibles"}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  clients.map((client) => {
                    const balance = client.balance != null ? Number(client.balance) : 0
                    const alDia = balance <= 0
                    const hasActiveMembership = client.active_membership != null
                    const hasExpiredMembership = client.expired_membership != null
                    const daysRemaining = client.active_membership?.days_remaining
                    const membershipEndDate = client.active_membership?.end_date ?? client.expired_membership?.end_date
                    const daysText =
                      hasExpiredMembership && !hasActiveMembership
                        ? "Vencida"
                        : daysRemaining === undefined || daysRemaining === null
                          ? "Activa"
                          : daysRemaining === 0
                            ? "Vence hoy"
                            : daysRemaining === 1
                              ? "1 día restante"
                              : `${daysRemaining} días restantes`
                    const untilDate = membershipEndDate
                      ? format(new Date(membershipEndDate), "dd/MM/yyyy", { locale: es })
                      : ""
                    return (
                      <TableRow
                        key={client.id}
                        hover
                        sx={{
                          ...getMembershipRowStyle(client),
                          "&:last-child .MuiTableCell-root": { borderBottom: "none" },
                        }}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight={500} color="text.primary">
                            {client.username}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {client.name}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
                          <Typography variant="body2" color="text.secondary">
                            {client.dni || "-"}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ display: { xs: "none", lg: "table-cell" } }}>
                          <Typography variant="body2" color="text.secondary">
                            {client.phone || "-"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={client.active ? "Activo" : "Inactivo"}
                            size="small"
                            color={client.active ? "success" : "default"}
                            sx={{
                              fontWeight: 600,
                              fontSize: "0.75rem",
                              "& .MuiChip-label": { px: 1 },
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>
                          {hasExpiredMembership && !hasActiveMembership ? (
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
                              <Typography variant="body2" sx={{ fontWeight: 700, fontSize: "0.875rem", color: "#7f1d1d", lineHeight: 1.2 }}>
                                Vencida
                              </Typography>
                              {client.expired_membership?.end_date && (
                                <Typography variant="caption" sx={{ fontWeight: 500, color: "#991b1b", fontSize: "0.7rem" }}>
                                  Venció {format(new Date(client.expired_membership.end_date), "dd/MM/yyyy", { locale: es })}
                                </Typography>
                              )}
                            </Box>
                          ) : hasActiveMembership ? (
                            (() => {
                              const dur = Number(client.active_membership?.duration_days)
                              const d = Number(client.active_membership?.days_remaining)
                              const isShortPlan = dur <= 5
                              const isRed = !isShortPlan && (d === 1 || d === 0)
                              const isOrange = !isShortPlan && [2, 3, 4, 5].includes(d)
                              const bg = isRed ? "#fee2e2" : isOrange ? "#ffedd5" : "#dcfce7"
                              const border = isRed ? "#fca5a5" : isOrange ? "#fdba74" : "#86efac"
                              const colorMain = isRed ? "#991b1b" : isOrange ? "#c2410c" : "#166534"
                              const colorSub = isRed ? "#b91c1c" : isOrange ? "#ea580c" : "#15803d"
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
                                  <Typography variant="body2" sx={{ fontWeight: 700, fontSize: "0.875rem", color: colorMain, lineHeight: 1.2 }}>
                                    {daysText}
                                  </Typography>
                                  {untilDate && (
                                    <Typography variant="caption" sx={{ fontWeight: 500, color: colorSub, fontSize: "0.7rem" }}>
                                      Hasta {untilDate}
                                    </Typography>
                                  )}
                                </Box>
                              )
                            })()
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              —
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {alDia ? (
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              sx={{ color: "#059669" }}
                            >
                              Al día
                            </Typography>
                          ) : (
                            <NumericFormat
                              value={balance}
                              displayType="text"
                              thousandSeparator="."
                              decimalSeparator=","
                              prefix="$ "
                              decimalScale={2}
                              fixedDecimalScale
                              className="font-semibold text-sm"
                              style={{ color: "#dc2626" }}
                            />
                          )}
                        </TableCell>
                        <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(client.last_login)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {canSendMembershipReminder(client) && client.phone && (
                            <Tooltip
                              title={
                                client.active_membership.days_remaining === 0
                                  ? "Recordar por WhatsApp (vence hoy)"
                                  : `Recordar por WhatsApp (vence en ${client.active_membership.days_remaining} ${client.active_membership.days_remaining === 1 ? "día" : "días"})`
                              }
                            >
                              <IconButton
                                size="small"
                                onClick={() => handleOpenMembershipReminder(client)}
                                sx={{ color: "#25D366", "&:hover": { backgroundColor: "#dcfce7" } }}
                                aria-label="Recordar membresía por WhatsApp"
                              >
                                <Chat fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDetail(client)}
                            sx={{ color: "#374151" }}
                            title="Ver detalle"
                            aria-label="Ver detalle"
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenCurrentAccount(client)}
                            sx={{ color: "#059669" }}
                            title="Cuenta corriente"
                            aria-label="Cuenta corriente"
                          >
                            <AccountBalance fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(client)}
                            sx={{ color: "#d97706" }}
                            title="Editar"
                            aria-label="Editar"
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
            {!loading && clients.length >= 0 && (
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
                  ".MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows": { fontWeight: 500, color: "#6b7280" },
                  ".MuiIconButton-root:not(.Mui-disabled)": { color: "#374151" },
                  ".MuiIconButton-root.Mui-disabled": { color: "#d1d5db" },
                }}
              />
            )}
          </TableContainer>
        </Box>
      </Box>

      {/* Dialog - Crear/Editar Cliente */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
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
              {editMode ? "Editar Cliente" : "Nuevo Cliente"}
            </Typography>
            <Typography variant="body2" sx={{ color: "#6b7280", mt: 0.25 }}>
              {editMode ? "Actualiza la información del cliente" : "Completa los datos para registrar un nuevo cliente"}
            </Typography>
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

        {/* Content */}
        <DialogContent sx={{ px: { xs: 2.5, sm: 3 }, py: 3 }}>
          {dialogError && (
            <Alert
              severity="error"
              onClose={() => setDialogError("")}
              sx={{
                mb: 2,
                borderRadius: "10px",
                "& .MuiAlert-message": { width: "100%" },
              }}
            >
              {dialogError}
            </Alert>
          )}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: { xs: 2, sm: 2.5 },
            }}
          >
            {/* DNI primero: al escribir se rellena la contraseña por defecto (documento) */}
            <TextField
              fullWidth
              label="DNI"
              value={currentClient.dni}
              onChange={(e) => {
                const v = e.target.value
                setCurrentClient((prev) => ({
                  ...prev,
                  dni: v,
                  ...(!editMode && { password: v }),
                }))
              }}
              required
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Badge sx={{ color: "#9ca3af", fontSize: 20 }} />
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

            {/* Contraseña - solo en modo crear; por defecto = DNI, se rellena al escribir DNI */}
            {!editMode && (
              <TextField
                fullWidth
                label="Contraseña"
                type="password"
                value={currentClient.password}
                onChange={(e) => setCurrentClient({ ...currentClient, password: e.target.value })}
                required
                size="small"
                helperText="Por defecto es el DNI. Podés cambiarla."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: "#9ca3af", fontSize: 20 }} />
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
            )}

            {/* Estado - solo en modo editar (ocupa el lugar de contraseña) */}
            {editMode && (
              <FormControl
                fullWidth
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
                <InputLabel>Estado</InputLabel>
                <Select
                  value={currentClient.active ? 1 : 0}
                  label="Estado"
                  onChange={(e) => setCurrentClient({ ...currentClient, active: e.target.value === 1 })}
                >
                  <MenuItem value={1}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#22c55e" }} />
                      Activo
                    </Box>
                  </MenuItem>
                  <MenuItem value={0}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#9ca3af" }} />
                      Inactivo
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            )}

            {/* Nombre de usuario */}
            <TextField
              fullWidth
              label="Nombre de usuario"
              value={currentClient.username}
              onChange={(e) => setCurrentClient({ ...currentClient, username: e.target.value })}
              required
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person sx={{ color: "#9ca3af", fontSize: 20 }} />
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

            {/* Nombre completo */}
            <TextField
              fullWidth
              label="Nombre completo"
              value={currentClient.name}
              onChange={(e) => setCurrentClient({ ...currentClient, name: e.target.value })}
              required
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <DriveFileRenameOutline sx={{ color: "#9ca3af", fontSize: 20 }} />
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

            {/* Teléfono */}
            <TextField
              fullWidth
              label="Teléfono"
              value={currentClient.phone}
              onChange={(e) => setCurrentClient({ ...currentClient, phone: e.target.value })}
              size="small"
              helperText={!editMode ? "Si completás este campo, al crear el cliente podrás enviarle las credenciales por WhatsApp (se abrirá WhatsApp Web con el mensaje listo)." : undefined}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Phone sx={{ color: "#9ca3af", fontSize: 20 }} />
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

            {/* Dirección - ocupa 2 columnas */}
            <TextField
              fullWidth
              label="Dirección"
              value={currentClient.address}
              onChange={(e) => setCurrentClient({ ...currentClient, address: e.target.value })}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Home sx={{ color: "#9ca3af", fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                gridColumn: { xs: "1", sm: "1 / -1" },
                "& .MuiOutlinedInput-root": {
                  borderRadius: "10px",
                  backgroundColor: "#fafafa",
                  "&:hover fieldset": { borderColor: "#d1d5db" },
                  "&.Mui-focused fieldset": { borderColor: "#d97706", borderWidth: "1px" },
                },
                "& .MuiInputLabel-root.Mui-focused": { color: "#d97706" },
              }}
            />
          </Box>

          {/* Nota informativa */}
          <Box
            sx={{
              mt: 3,
              p: 2,
              backgroundColor: "#fffbeb",
              borderRadius: "10px",
              border: "1px solid #fde68a",
            }}
          >
            <Typography variant="body2" sx={{ color: "#92400e", fontSize: "0.8125rem" }}>
              <strong>Nota:</strong> Los campos marcados con * son obligatorios.
              {!editMode && " El cliente podrá usar su nombre de usuario y contraseña para acceder al portal."}
            </Typography>
          </Box>
        </DialogContent>

        {/* Footer */}
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
            onClick={handleSaveClient}
            variant="contained"
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
            }}
          >
            {editMode ? "Guardar Cambios" : "Crear Cliente"}
          </Button>
        </Box>
      </Dialog>

      {/* Modal: ¿Enviar credenciales por WhatsApp? */}
      <Dialog
        open={openWhatsAppConfirmDialog}
        onClose={handleCloseWhatsAppConfirm}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "16px",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
            p: 0,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, color: "#111827", pt: 2.5, px: 3, pb: 0 }}>
          Enviar credenciales por WhatsApp
        </DialogTitle>
        <DialogContent sx={{ px: 3, py: 2 }}>
          <Typography variant="body1" sx={{ color: "#6b7280" }}>
            ¿Querés enviar las credenciales de ingreso al cliente por WhatsApp? Se abrirá WhatsApp Web con el mensaje listo para que lo envíes.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ gap: 1, px: 3, pb: 2.5, pt: 0 }}>
          <Button
            onClick={handleCloseWhatsAppConfirm}
            variant="outlined"
            sx={{
              color: "#6b7280",
              borderColor: "#d1d5db",
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 500,
              "&:hover": { borderColor: "#9ca3af", backgroundColor: "#f9fafb" },
            }}
          >
            No
          </Button>
          <Button
            onClick={handleConfirmSendWhatsApp}
            variant="contained"
            sx={{
              backgroundColor: "#25D366",
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 600,
              "&:hover": { backgroundColor: "#1da851" },
            }}
          >
            Sí, abrir WhatsApp
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal: Recordatorio de membresía por WhatsApp */}
      <Dialog
        open={openMembershipReminderDialog}
        onClose={handleCloseMembershipReminder}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "16px",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
            p: 0,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, color: "#111827", pt: 2.5, px: 3, pb: 0 }}>
          Recordatorio de membresía por WhatsApp
        </DialogTitle>
        <DialogContent sx={{ px: 3, py: 2 }}>
          <Typography variant="body1" sx={{ color: "#6b7280" }}>
            {membershipReminderData
              ? `¿Enviar recordatorio al cliente? ${membershipReminderData.daysRemaining === 0 ? "Le vence hoy la membresía." : membershipReminderData.daysRemaining === 1 ? "Le queda 1 día de membresía." : `Le quedan ${membershipReminderData.daysRemaining} días de membresía.`} Se abrirá WhatsApp Web con el mensaje listo para que lo envíes.`
              : ""}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ gap: 1, px: 3, pb: 2.5, pt: 0 }}>
          <Button
            onClick={handleCloseMembershipReminder}
            variant="outlined"
            sx={{
              color: "#6b7280",
              borderColor: "#d1d5db",
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 500,
              "&:hover": { borderColor: "#9ca3af", backgroundColor: "#f9fafb" },
            }}
          >
            No
          </Button>
          <Button
            onClick={handleConfirmSendMembershipReminder}
            variant="contained"
            sx={{
              backgroundColor: "#25D366",
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 600,
              "&:hover": { backgroundColor: "#1da851" },
            }}
          >
            Sí, abrir WhatsApp
          </Button>
        </DialogActions>
      </Dialog>

      <CurrentAccountDialog
        open={openCurrentAccountDialog}
        onClose={handleCloseCurrentAccount}
        client={selectedClientForAccount}
      />

      <ClientDetailDialog
        open={openDetailDialog}
        onClose={handleCloseDetail}
        client={selectedClientForDetail}
        onEdit={handleOpenDialog}
        onCurrentAccount={handleOpenCurrentAccount}
        onRenewOrChange={(client) => {
          setOpenDetailDialog(false)
          navigate("/memberships", { state: { renewClient: client } })
        }}
        onDelete={handleDeleteClient}
        onRefresh={loadClients}
      />
    </Box>
  )
}

export default Clients
