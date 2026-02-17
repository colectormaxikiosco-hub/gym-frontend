"use client"

import { useState, useEffect } from "react"
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
  CircularProgress,
  Tooltip,
} from "@mui/material"
import { Add, Edit, Delete, FitnessCenter, AccountBalance, Chat } from "@mui/icons-material"
import clientService from "../../services/clientService"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import CurrentAccountDialog from "./CurrentAccountDialog"
import {
  normalizePhoneForWhatsApp,
  getWelcomeMessageWhatsApp,
  getWhatsAppWebUrl,
  canSendMembershipReminder,
  getMembershipReminderMessage,
  getMembershipRowStyle,
} from "../../utils/phoneAr"
import membershipService from "../../services/membershipService"

const ClientsManagementTab = () => {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })
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
  const [openWhatsAppConfirmDialog, setOpenWhatsAppConfirmDialog] = useState(false)
  const [whatsAppConfirmData, setWhatsAppConfirmData] = useState(null)
  const [openMembershipReminderDialog, setOpenMembershipReminderDialog] = useState(false)
  const [membershipReminderData, setMembershipReminderData] = useState(null)
  const [daysRemainingFilter, setDaysRemainingFilter] = useState(null) // null | 0 | 1 | 2 | 3 | 4 | 5 | 'expired'

  useEffect(() => {
    loadClients()
  }, [daysRemainingFilter])

  const loadClients = async () => {
    try {
      const { data } = await clientService.getClientsPaginated({
        page: 1,
        limit: 1000,
        include_active_membership: true,
        active_filter: "active",
        days_remaining:
          typeof daysRemainingFilter === "number" ? daysRemainingFilter : undefined,
        filter_expired: daysRemainingFilter === "expired",
      })
      setClients(Array.isArray(data) ? data : [])
    } catch (error) {
      if (!error.cancelled) {
        setMessage({ type: "error", text: "Error al cargar clientes" })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (client = null) => {
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

  const handleCloseDialog = () => {
    setOpenDialog(false)
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
        const passwordToUse = (currentClient.password && currentClient.password.trim()) || (currentClient.dni && currentClient.dni.trim()) || ""
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
      setMessage({ type: "error", text: error.response?.data?.message || "Error al guardar cliente" })
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

  const formatDate = (date) => {
    if (!date) return "Nunca"
    return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: es })
  }

  if (loading) {
    return (
      <Box className="flex justify-center items-center py-12">
        <CircularProgress sx={{ color: "#f59e0b" }} />
      </Box>
    )
  }

  return (
    <Box>
      <Box className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <Box className="flex items-center gap-3">
          <Box className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
            <FitnessCenter sx={{ color: "#f59e0b", fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h6" className="font-semibold text-gray-900">
              Gestión de Clientes
            </Typography>
            <Typography variant="body2" className="text-gray-600">
              Administra los clientes del gimnasio
            </Typography>
          </Box>
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
          }}
        >
          Nuevo Cliente
        </Button>
      </Box>

      {message.text && (
        <Alert severity={message.type} className="mb-4" onClose={() => setMessage({ type: "", text: "" })}>
          {message.text}
        </Alert>
      )}

      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 0.75, mb: 2 }}>
        <Typography variant="body2" sx={{ color: "#6b7280", fontWeight: 600 }}>
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
                    backgroundColor: d === "expired" ? "#b91c1c" : "#f59e0b",
                    color: "#fff",
                    "&:hover": { backgroundColor: d === "expired" ? "#991b1b" : "#d97706" },
                  }
                : { backgroundColor: "#f3f4f6", color: "#6b7280", "&:hover": { backgroundColor: "#e5e7eb", color: "#92400e" } }),
            }}
          />
        ))}
      </Box>

      <TableContainer className="border border-gray-200 rounded-lg">
        <Table>
          <TableHead className="bg-gray-50">
            <TableRow>
              <TableCell className="font-semibold">Usuario</TableCell>
              <TableCell className="font-semibold">Nombre</TableCell>
              <TableCell className="font-semibold">DNI</TableCell>
              <TableCell className="font-semibold">Teléfono</TableCell>
              <TableCell className="font-semibold">Estado</TableCell>
              <TableCell className="font-semibold">Membresía</TableCell>
              <TableCell className="font-semibold">Último Login</TableCell>
              <TableCell className="font-semibold" align="right">
                Acciones
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {clients.map((client) => {
              const hasExpired = !!client.expired_membership && !client.active_membership
              const daysRemaining = client.active_membership?.days_remaining
              const durationDays = Number(client.active_membership?.duration_days)
              const daysText = hasExpired
                ? "Vencida"
                : daysRemaining === undefined || daysRemaining === null
                  ? "—"
                  : daysRemaining === 0
                    ? "Vence hoy"
                    : daysRemaining === 1
                      ? "1 día"
                      : `${daysRemaining} días`
              const hasMembership = !!client.active_membership
              const isShortPlan = durationDays <= 5
              const isRed = hasMembership && !isShortPlan && (Number(daysRemaining) === 1 || Number(daysRemaining) === 0)
              const isOrange = hasMembership && !isShortPlan && [2, 3, 4, 5].includes(Number(daysRemaining))
              const isExpiredBadge = hasExpired
              const badgeBg = isExpiredBadge ? "#fecaca" : isRed ? "#fee2e2" : isOrange ? "#ffedd5" : hasMembership ? "#d1fae5" : "transparent"
              const badgeColor = isExpiredBadge ? "#7f1d1d" : isRed ? "#991b1b" : isOrange ? "#c2410c" : hasMembership ? "#065f46" : "#6b7280"
              return (
                <TableRow key={client.id} hover sx={getMembershipRowStyle(client)}>
                  <TableCell className="font-medium">{client.username}</TableCell>
                  <TableCell>{client.name}</TableCell>
                  <TableCell>{client.dni || "-"}</TableCell>
                  <TableCell>{client.phone || "-"}</TableCell>
                  <TableCell>
                    <Chip
                      label={client.active ? "Activo" : "Inactivo"}
                      size="small"
                      sx={{
                        backgroundColor: client.active ? "#d1fae5" : "#fee2e2",
                        color: client.active ? "#065f46" : "#991b1b",
                        fontWeight: 600,
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box
                      component="span"
                      sx={{
                        display: "inline-block",
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        backgroundColor: badgeBg,
                        color: badgeColor,
                        fontWeight: 600,
                        fontSize: "0.8125rem",
                      }}
                    >
                      {daysText}
                    </Box>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">{formatDate(client.last_login)}</TableCell>
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
                      onClick={() => handleOpenCurrentAccount(client)}
                      sx={{ color: "#059669", "&:hover": { backgroundColor: "#d1fae5" } }}
                      title="Cuenta Corriente"
                    >
                      <AccountBalance fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(client)}
                      sx={{ color: "#f59e0b", "&:hover": { backgroundColor: "#fef3c7" } }}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteClient(client.id)}
                      sx={{ color: "#dc2626", "&:hover": { backgroundColor: "#fee2e2" } }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle className="font-bold">{editMode ? "Editar Cliente" : "Nuevo Cliente"}</DialogTitle>
        <DialogContent>
          <Box className="space-y-4 mt-2">
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
              sx={{
                "& .MuiOutlinedInput-root": {
                  "&.Mui-focused fieldset": { borderColor: "#f59e0b" },
                },
                "& .MuiInputLabel-root.Mui-focused": { color: "#f59e0b" },
              }}
            />

            {!editMode && (
              <TextField
                fullWidth
                label="Contraseña"
                type="password"
                value={currentClient.password}
                onChange={(e) => setCurrentClient({ ...currentClient, password: e.target.value })}
                required
                helperText="Por defecto es el DNI. Podés cambiarla."
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "&.Mui-focused fieldset": { borderColor: "#f59e0b" },
                  },
                  "& .MuiInputLabel-root.Mui-focused": { color: "#f59e0b" },
                }}
              />
            )}

            <TextField
              fullWidth
              label="Nombre de usuario"
              value={currentClient.username}
              onChange={(e) => setCurrentClient({ ...currentClient, username: e.target.value })}
              required
              sx={{
                "& .MuiOutlinedInput-root": {
                  "&.Mui-focused fieldset": { borderColor: "#f59e0b" },
                },
                "& .MuiInputLabel-root.Mui-focused": { color: "#f59e0b" },
              }}
            />

            <TextField
              fullWidth
              label="Nombre completo"
              value={currentClient.name}
              onChange={(e) => setCurrentClient({ ...currentClient, name: e.target.value })}
              required
              sx={{
                "& .MuiOutlinedInput-root": {
                  "&.Mui-focused fieldset": { borderColor: "#f59e0b" },
                },
                "& .MuiInputLabel-root.Mui-focused": { color: "#f59e0b" },
              }}
            />

            <TextField
              fullWidth
              label="Teléfono"
              value={currentClient.phone}
              onChange={(e) => setCurrentClient({ ...currentClient, phone: e.target.value })}
              helperText={!editMode ? "Si completás este campo, al crear el cliente podrás enviarle las credenciales por WhatsApp (se abrirá WhatsApp Web con el mensaje listo)." : undefined}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "&.Mui-focused fieldset": { borderColor: "#f59e0b" },
                },
                "& .MuiInputLabel-root.Mui-focused": { color: "#f59e0b" },
              }}
            />

            <TextField
              fullWidth
              label="Dirección"
              multiline
              rows={2}
              value={currentClient.address}
              onChange={(e) => setCurrentClient({ ...currentClient, address: e.target.value })}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "&.Mui-focused fieldset": { borderColor: "#f59e0b" },
                },
                "& .MuiInputLabel-root.Mui-focused": { color: "#f59e0b" },
              }}
            />

            {editMode && (
              <FormControl fullWidth>
                <InputLabel sx={{ "&.Mui-focused": { color: "#f59e0b" } }}>Estado</InputLabel>
                <Select
                  value={currentClient.active ? 1 : 0}
                  label="Estado"
                  onChange={(e) => setCurrentClient({ ...currentClient, active: e.target.value === 1 })}
                  sx={{
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#f59e0b" },
                  }}
                >
                  <MenuItem value={1}>Activo</MenuItem>
                  <MenuItem value={0}>Inactivo</MenuItem>
                </Select>
              </FormControl>
            )}
          </Box>
        </DialogContent>
        <DialogActions className="px-6 pb-4">
          <Button onClick={handleCloseDialog} sx={{ textTransform: "none", color: "#6b7280" }}>
            Cancelar
          </Button>
          <Button
            onClick={handleSaveClient}
            variant="contained"
            sx={{
              backgroundColor: "#f59e0b",
              "&:hover": { backgroundColor: "#d97706" },
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            {editMode ? "Guardar Cambios" : "Crear Cliente"}
          </Button>
        </DialogActions>
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
    </Box>
  )
}

export default ClientsManagementTab
