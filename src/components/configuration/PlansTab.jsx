"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Typography,
  Alert,
  InputAdornment,
  Autocomplete,
  MenuItem,
  Switch,
  Tooltip,
} from "@mui/material"
import {
  Add,
  Edit,
  Delete,
  Close,
  FitnessCenter,
  AttachMoney,
  CalendarMonth,
  Description,
  Refresh,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material"
import { NumericFormat } from "react-number-format"
import planService from "../../services/planService"
import instructorService from "../../services/instructorService"
import { formatPlanDuration } from "../../utils/membershipUtils"

/** Alineado con backend: 0/false/"0" = inactivo; resto (1, true, undefined) = activo */
function isPlanActive(plan) {
  const v = plan?.active
  if (v === false || v === 0 || v === "0") return false
  if (v === true || v === 1 || v === "1") return true
  return true
}

const PlansTab = () => {
  const [plans, setPlans] = useState([])
  const [instructorsList, setInstructorsList] = useState([])
  const [loading, setLoading] = useState(true)
  const [showInactivePlans, setShowInactivePlans] = useState(false)
  const [togglingId, setTogglingId] = useState(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingPlan, setEditingPlan] = useState(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    duration_type: "days",
    duration_value: "",
    price: "",
    description: "",
    instructor_ids: [],
  })

  const loadPlans = useCallback(async () => {
    try {
      setLoading(true)
      setError("")
      const response = await planService.getAll({ include_inactive: showInactivePlans })
      setPlans(response?.data || [])
    } catch (err) {
      if (!err.cancelled) {
        setError("Error al cargar los planes")
      }
    } finally {
      setLoading(false)
    }
  }, [showInactivePlans])

  useEffect(() => {
    loadPlans()
  }, [loadPlans])

  useEffect(() => {
    if (openDialog) {
      instructorService.getAll().then((res) => {
        const data = res?.data ?? res ?? []
        setInstructorsList(Array.isArray(data) ? data.filter((i) => i.active !== false) : [])
      }).catch(() => setInstructorsList([]))
    }
  }, [openDialog])

  const handleOpenDialog = (plan = null) => {
    if (plan) {
      setEditingPlan(plan)
      const hasHours = plan.duration_hours != null && Number(plan.duration_hours) > 0
      setFormData({
        name: plan.name,
        duration_type: hasHours ? "hours" : "days",
        duration_value: hasHours ? String(plan.duration_hours) : String(plan.duration_days ?? ""),
        price: plan.price,
        description: plan.description || "",
        instructor_ids: (plan.instructors || []).map((i) => i.id),
      })
    } else {
      setEditingPlan(null)
      setFormData({
        name: "",
        duration_type: "days",
        duration_value: "",
        price: "",
        description: "",
        instructor_ids: [],
      })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingPlan(null)
    setFormData({
      name: "",
      duration_type: "days",
      duration_value: "",
      price: "",
      description: "",
      instructor_ids: [],
    })
    setError("")
  }

  const handleSubmit = async () => {
    try {
      setError("")
      const isHours = formData.duration_type === "hours"
      const value = Number(formData.duration_value)
      if (!formData.duration_value || value <= 0) {
        setError(isHours ? "La duración en horas debe ser mayor a 0" : "La duración en días debe ser mayor a 0")
        return
      }
      const payload = {
        name: formData.name,
        duration_days: isHours ? 0 : value,
        duration_hours: isHours ? value : 0,
        price: formData.price,
        description: formData.description,
        instructor_ids: formData.instructor_ids || [],
      }
      if (editingPlan) {
        payload.active = isPlanActive(editingPlan)
        await planService.update(editingPlan.id, payload)
        setSuccess("Plan actualizado correctamente")
      } else {
        await planService.create(payload)
        setSuccess("Plan creado correctamente")
      }
      loadPlans()
      handleCloseDialog()
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError(err.response?.data?.message || "Error al guardar el plan")
    }
  }

  const handleToggleStatus = async (id) => {
    try {
      setTogglingId(id)
      setError("")
      const res = await planService.toggleStatus(id)
      setSuccess(res?.message || "Estado del plan actualizado")
      await loadPlans()
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError(err.response?.data?.message || "Error al cambiar estado")
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async (id) => {
    const ok = window.confirm(
      "Si el plan tiene alguna membresía registrada (activa o del pasado), se desactivará y dejará de mostrarse para nuevas membresías, sin afectar las existentes.\n\nSi no tiene membresías, se eliminará definitivamente.\n\n¿Continuar?",
    )
    if (!ok) return
    try {
      const res = await planService.delete(id)
      setSuccess(res?.message || (res?.action === "deleted" ? "Plan eliminado correctamente" : "Plan desactivado correctamente"))
      loadPlans()
      setTimeout(() => setSuccess(""), 5000)
    } catch (err) {
      setError(err.response?.data?.message || "Error al eliminar el plan")
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    }).format(price)
  }

  const inputStyles = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "10px",
      backgroundColor: "#fafafa",
      "&:hover fieldset": { borderColor: "#d1d5db" },
      "&.Mui-focused fieldset": { borderColor: "#d97706", borderWidth: "1px" },
    },
    "& .MuiInputLabel-root.Mui-focused": { color: "#d97706" },
  }

  return (
    <Box>
      {/* Section Header */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: "#111827", mb: 0.5 }}>
            Gestión de Planes
          </Typography>
          <Typography variant="body2" sx={{ color: "#6b7280" }}>
            {showInactivePlans
              ? "Mostrando planes activos e inactivos"
              : "Solo se listan planes activos (para nuevas membresías)"}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center" }}>
          <Button
            variant={showInactivePlans ? "contained" : "outlined"}
            size="small"
            startIcon={showInactivePlans ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
            onClick={() => setShowInactivePlans((v) => !v)}
            sx={{
              borderColor: "#d97706",
              color: showInactivePlans ? "#fff" : "#d97706",
              backgroundColor: showInactivePlans ? "#d97706" : "transparent",
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 600,
              "&:hover": {
                borderColor: "#b45309",
                backgroundColor: showInactivePlans ? "#b45309" : "#fffbeb",
              },
            }}
          >
            {showInactivePlans ? "Ocultar inactivos" : "Mostrar planes inactivos"}
          </Button>
          <IconButton
            onClick={loadPlans}
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
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            sx={{
              backgroundColor: "#f59e0b",
              "&:hover": { backgroundColor: "#d97706" },
              textTransform: "none",
              fontWeight: 600,
              borderRadius: "10px",
              px: 2.5,
              boxShadow: "0 1px 3px rgba(245, 158, 11, 0.3)",
            }}
          >
            Nuevo Plan
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: "10px" }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: "10px" }} onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}

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
            minWidth: 680,
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
              <TableCell>Nombre</TableCell>
              <TableCell>Duración</TableCell>
              <TableCell>Precio</TableCell>
              <TableCell>Instructores</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
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
                </TableCell>
              </TableRow>
            ) : plans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                  <Typography variant="body2" color="text.secondary">
                    No hay planes disponibles
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              plans.map((plan) => {
                const active = isPlanActive(plan)
                return (
                <TableRow
                  key={plan.id}
                  hover
                  sx={{
                    opacity: active ? 1 : 0.92,
                    backgroundColor: active ? undefined : "#fafafa",
                    "&:hover": { backgroundColor: active ? "#fafafa" : "#f3f4f6" },
                    "&:last-child .MuiTableCell-root": { borderBottom: "none" },
                  }}
                >
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight={500}>
                        {plan.name}
                      </Typography>
                      {plan.description && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                          {plan.description.length > 50 ? `${plan.description.substring(0, 50)}...` : plan.description}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatPlanDuration(plan)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <NumericFormat
                      value={plan.price}
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
                  <TableCell>
                    {plan.instructors && plan.instructors.length > 0 ? (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {plan.instructors.slice(0, 3).map((inst) => (
                          <Chip
                            key={inst.id}
                            label={inst.name}
                            size="small"
                            sx={{
                              backgroundColor: "#fffbeb",
                              color: "#92400e",
                              fontWeight: 500,
                              fontSize: "0.7rem",
                              maxWidth: { xs: 100, sm: 120 },
                              "& .MuiChip-label": { overflow: "hidden", textOverflow: "ellipsis" },
                            }}
                          />
                        ))}
                        {plan.instructors.length > 3 && (
                          <Chip
                            label={`+${plan.instructors.length - 3}`}
                            size="small"
                            sx={{ backgroundColor: "#f5f5f4", color: "#78716c", fontSize: "0.7rem" }}
                          />
                        )}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">—</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={active ? "Activo" : "Inactivo"}
                      size="small"
                      sx={{
                        backgroundColor: active ? "#dcfce7" : "#fef2f2",
                        color: active ? "#166534" : "#b91c1c",
                        fontWeight: 600,
                        fontSize: "0.75rem",
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title={active ? "Desactivar plan (no aparecerá en nuevas membresías)" : "Activar plan"}>
                      <span style={{ display: "inline-flex", verticalAlign: "middle" }}>
                        <Switch
                          checked={active}
                          disabled={togglingId === plan.id}
                          onChange={() => handleToggleStatus(plan.id)}
                          size="medium"
                          inputProps={{
                            "aria-label": active ? "Desactivar plan" : "Activar plan",
                          }}
                          sx={{
                            "& .MuiSwitch-switchBase.Mui-checked": {
                              color: "#16a34a",
                              "&:hover": { backgroundColor: "rgba(22, 163, 74, 0.12)" },
                            },
                            "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                              backgroundColor: "#22c55e !important",
                              opacity: "1 !important",
                            },
                            "& .MuiSwitch-switchBase:not(.Mui-checked)": {
                              color: "#dc2626",
                              "&:hover": { backgroundColor: "rgba(220, 38, 38, 0.08)" },
                            },
                            "& .MuiSwitch-switchBase:not(.Mui-checked) + .MuiSwitch-track": {
                              backgroundColor: "#fca5a5 !important",
                              opacity: "1 !important",
                            },
                          }}
                        />
                      </span>
                    </Tooltip>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(plan)}
                      sx={{ color: "#d97706" }}
                      title="Editar"
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(plan.id)}
                      sx={{ color: "#dc2626" }}
                      title="Eliminar"
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
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
              {editingPlan ? "Editar Plan" : "Nuevo Plan"}
            </Typography>
            <Typography variant="body2" sx={{ color: "#6b7280", mt: 0.25 }}>
              {editingPlan ? "Actualiza la información del plan" : "Completa los datos para crear un plan"}
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
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: "10px" }} onClose={() => setError("")}>
              {error}
            </Alert>
          )}

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2.5,
            }}
          >
            <TextField
              fullWidth
              label="Nombre del Plan"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              size="small"
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FitnessCenter sx={{ color: "#9ca3af", fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={inputStyles}
            />

            <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
              <TextField
                select
                label="Duración por"
                value={formData.duration_type}
                onChange={(e) => setFormData({ ...formData, duration_type: e.target.value, duration_value: "" })}
                size="small"
                sx={{ minWidth: 120, ...inputStyles }}
              >
                <MenuItem value="days">Días</MenuItem>
                <MenuItem value="hours">Horas</MenuItem>
              </TextField>
              <TextField
                fullWidth
                label={formData.duration_type === "hours" ? "Cantidad de horas" : "Cantidad de días"}
                type="number"
                inputProps={{ min: 1 }}
                value={formData.duration_value}
                onChange={(e) => setFormData({ ...formData, duration_value: e.target.value })}
                size="small"
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarMonth sx={{ color: "#9ca3af", fontSize: 20 }} />
                    </InputAdornment>
                  ),
                }}
                sx={inputStyles}
              />
            </Box>

            <TextField
              fullWidth
              label="Precio (ARS)"
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              size="small"
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AttachMoney sx={{ color: "#9ca3af", fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                ...inputStyles,
                gridColumn: { xs: "1", sm: "1 / -1" },
              }}
            />

            <TextField
              fullWidth
              label="Descripción (opcional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              size="small"
              multiline
              rows={3}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start" sx={{ alignSelf: "flex-start", mt: 1 }}>
                    <Description sx={{ color: "#9ca3af", fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                ...inputStyles,
                gridColumn: { xs: "1", sm: "1 / -1" },
              }}
            />

            <Box sx={{ gridColumn: { xs: "1", sm: "1 / -1" } }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#374151", mb: 1, fontSize: "0.8125rem" }}>
                Instructores del plan (opcional)
              </Typography>
              <Autocomplete
                multiple
                size="small"
                options={instructorsList}
                value={instructorsList.filter((i) => (formData.instructor_ids || []).includes(i.id))}
                getOptionLabel={(option) => option.name || ""}
                onChange={(_, newValue) => {
                  setFormData({ ...formData, instructor_ids: (newValue || []).map((i) => i.id) })
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder={instructorsList.length === 0 ? "No hay instructores cargados" : "Seleccionar instructores..."}
                    sx={inputStyles}
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      {...getTagProps({ index })}
                      key={option.id}
                      label={option.name}
                      size="small"
                      sx={{
                        backgroundColor: "#fffbeb",
                        color: "#92400e",
                        fontWeight: 500,
                        "& .MuiChip-deleteIcon": { color: "#b45309" },
                      }}
                    />
                  ))
                }
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "10px",
                    backgroundColor: "#fafafa",
                    minHeight: 42,
                  },
                }}
              />
              <Typography variant="caption" sx={{ color: "#6b7280", display: "block", mt: 0.5 }}>
                Puede no tener instructores (ej. plan diario) o uno o más.
              </Typography>
            </Box>
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
            onClick={handleSubmit}
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
            {editingPlan ? "Guardar Cambios" : "Crear Plan"}
          </Button>
        </Box>
      </Dialog>
    </Box>
  )
}

export default PlansTab
