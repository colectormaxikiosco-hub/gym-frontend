"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
} from "@mui/material"
import {
  Close,
  Person,
  Edit,
  AccountBalance,
  Delete,
  Login as LoginIcon,
  Autorenew,
} from "@mui/icons-material"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import clientService from "../../services/clientService"
import entryService from "../../services/entryService"
import { NumericFormat } from "react-number-format"

const formatDate = (date) => {
  if (!date) return "—"
  return format(new Date(date), "dd/MM/yyyy", { locale: es })
}

const formatDateTime = (date) => {
  if (!date) return "—"
  return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: es })
}

export default function ClientDetailDialog({
  open,
  onClose,
  client: rowClient,
  onEdit,
  onCurrentAccount,
  onRenewOrChange,
  onDelete,
  onRefresh,
}) {
  const [tabValue, setTabValue] = useState(0)
  const [detailClient, setDetailClient] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [entries, setEntries] = useState([])
  const [entriesPagination, setEntriesPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [entriesLoading, setEntriesLoading] = useState(false)

  const clientId = rowClient?.id

  const loadDetailClient = useCallback(async () => {
    if (!clientId) return
    setDetailLoading(true)
    try {
      const res = await clientService.getClientById(clientId)
      const data = res?.data ?? res
      setDetailClient(data)
    } catch {
      setDetailClient(null)
    } finally {
      setDetailLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    if (open && clientId) {
      setTabValue(0)
      loadDetailClient()
    }
  }, [open, clientId, loadDetailClient])

  const loadEntries = useCallback(async (page = 1, limit = 10) => {
    if (!clientId) return
    setEntriesLoading(true)
    try {
      const { data, pagination } = await entryService.getEntriesByClient(clientId, { page, limit })
      setEntries(Array.isArray(data) ? data : [])
      setEntriesPagination(pagination)
    } catch {
      setEntries([])
      setEntriesPagination({ page: 1, limit: 10, total: 0, totalPages: 0 })
    } finally {
      setEntriesLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    if (open && clientId && tabValue === 1) {
      loadEntries(1, 10)
    }
  }, [open, clientId, tabValue])

  const handleEntriesPageChange = (_, newPage) => {
    const nextPage = newPage + 1
    setEntriesPagination((p) => ({ ...p, page: nextPage }))
    loadEntries(nextPage, entriesPagination.limit)
  }

  const handleEntriesRowsPerPageChange = (e) => {
    const limit = parseInt(e.target.value, 10)
    setEntriesPagination((p) => ({ ...p, limit, page: 1 }))
    loadEntries(1, limit)
  }

  const handleClose = () => {
    setDetailClient(null)
    setTabValue(0)
    onClose()
  }

  const handleDelete = () => {
    if (window.confirm("¿Estás seguro de que deseas desactivar este cliente?")) {
      onDelete(clientId)
      handleClose()
      onRefresh?.()
    }
  }

  const balance = detailClient?.balance != null ? Number(detailClient.balance) : (rowClient?.balance != null ? Number(rowClient.balance) : 0)
  const alDia = balance <= 0

  const InfoRow = ({ label, value, mono }) => (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 2, py: 1.5, px: { xs: 2.5, sm: 3 }, borderBottom: "1px solid #f3f4f6" }}>
      <Typography variant="caption" sx={{ color: "#9ca3af", fontSize: "0.75rem", fontWeight: 500, flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 500, color: "#111827", fontFamily: mono ? "monospace" : "inherit", textAlign: "right", minWidth: 0, wordBreak: "break-word", pl: 2 }}>
        {value ?? "—"}
      </Typography>
    </Box>
  )

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: { xs: "16px", sm: "20px" },
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
          m: { xs: 1.5, sm: 3 },
          maxHeight: { xs: "calc(100vh - 24px)", sm: "calc(100vh - 48px)" },
          width: "100%",
          maxWidth: { xs: "calc(100vw - 24px)", sm: "900px" },
        },
      }}
    >
      {/* Header minimalista */}
      <Box
        sx={{
          px: { xs: 2.5, sm: 3 },
          py: 2,
          borderBottom: "1px solid #f3f4f6",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: "12px",
              backgroundColor: "#f5f5f4",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Person sx={{ color: "#78716c", fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: "#111827", fontSize: "1.0625rem" }}>
              {detailLoading ? "Cargando..." : (detailClient?.name ?? rowClient?.name ?? "—")}
            </Typography>
            <Typography variant="caption" sx={{ color: "#9ca3af", display: "block" }}>
              {detailClient?.dni ?? rowClient?.dni ? `DNI ${detailClient?.dni ?? rowClient?.dni}` : "Cliente"}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={handleClose} size="small" sx={{ color: "#9ca3af", "&:hover": { backgroundColor: "#f5f5f4", color: "#57534e" } }} aria-label="Cerrar">
          <Close fontSize="small" />
        </IconButton>
      </Box>

      <Tabs
        value={tabValue}
        onChange={(_, v) => setTabValue(v)}
        sx={{
          px: { xs: 2.5, sm: 3 },
          minHeight: 48,
          "& .MuiTab-root": { textTransform: "none", fontWeight: 600, fontSize: "0.8125rem", minHeight: 48 },
          "& .Mui-selected": { color: "#d97706" },
          "& .MuiTabs-indicator": { backgroundColor: "#d97706", height: 2 },
        }}
      >
        <Tab label="Información general" />
        <Tab label="Entradas" />
      </Tabs>

      <DialogContent sx={{ px: 0, py: 0, overflow: "auto", display: "flex", flexDirection: "column", minHeight: 0, minWidth: 0 }} className="client-detail-content">
        {tabValue === 0 && (
          <Box sx={{ px: { xs: 2.5, sm: 3 }, py: 3, overflow: "auto" }}>
            {detailLoading ? (
              <Box sx={{ py: 6, textAlign: "center" }}>
                <Box className="w-9 h-9 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" sx={{ mx: "auto", mb: 1.5 }} />
                <Typography variant="body2" color="text.secondary">Cargando...</Typography>
              </Box>
            ) : (
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: { xs: 0, sm: 4 }, minWidth: 0 }}>
                {/* Columna: Datos personales */}
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="caption" sx={{ color: "#9ca3af", fontWeight: 600, letterSpacing: "0.05em", display: "block", mb: 1.5 }}>
                    Datos personales
                  </Typography>
                  <Box sx={{ border: "1px solid #f3f4f6", borderRadius: "12px", overflow: "hidden" }}>
                    <InfoRow label="Nombre" value={detailClient?.name ?? "—"} />
                    <InfoRow label="Usuario" value={detailClient?.username ?? "—"} mono />
                    <InfoRow label="DNI" value={detailClient?.dni ?? rowClient?.dni ?? "—"} />
                    <InfoRow label="Teléfono" value={detailClient?.phone || rowClient?.phone || "—"} />
                    {(detailClient?.address != null && detailClient?.address !== "") && (
                      <Box sx={{ px: { xs: 2.5, sm: 3 }, py: 1.25, borderBottom: "1px solid #f3f4f6" }}>
                        <Typography variant="caption" sx={{ color: "#9ca3af", fontSize: "0.75rem", fontWeight: 500 }}>Dirección</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: "#111827", mt: 0.5 }}>{detailClient.address}</Typography>
                      </Box>
                    )}
                    <Box sx={{ py: 1.25, px: { xs: 2.5, sm: 3 }, borderBottom: "none" }}>
                      <Typography variant="caption" sx={{ color: "#9ca3af", fontSize: "0.75rem", fontWeight: 500 }}>Estado</Typography>
                      <Box sx={{ mt: 0.5 }}>
                        <Chip
                          size="small"
                          label={detailClient?.active !== false ? "Activo" : "Inactivo"}
                          sx={{
                            height: 22,
                            backgroundColor: detailClient?.active !== false ? "#f0fdf4" : "#f5f5f4",
                            color: detailClient?.active !== false ? "#166534" : "#78716c",
                            fontWeight: 600,
                            fontSize: "0.7rem",
                            "& .MuiChip-label": { px: 1.25 },
                          }}
                        />
                      </Box>
                    </Box>
                  </Box>
                </Box>

                {/* Columna: Cuenta y membresía */}
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="caption" sx={{ color: "#9ca3af", fontWeight: 600, letterSpacing: "0.05em", display: "block", mb: 1.5 }}>
                    Cuenta y membresía
                  </Typography>
                  <Box sx={{ border: "1px solid #f3f4f6", borderRadius: "12px", overflow: "hidden" }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 2, py: 1.25, px: { xs: 2.5, sm: 3 }, borderBottom: "1px solid #f3f4f6" }}>
                      <Typography variant="caption" sx={{ color: "#9ca3af", fontSize: "0.75rem", fontWeight: 500 }}>Cuenta corriente</Typography>
                      {alDia ? (
                        <Typography variant="body2" fontWeight={600} sx={{ color: "#059669" }}>Al día</Typography>
                      ) : (
                        <NumericFormat
                          value={balance}
                          displayType="text"
                          thousandSeparator="."
                          decimalSeparator=","
                          prefix="$ "
                          decimalScale={2}
                          fixedDecimalScale
                          style={{ color: "#dc2626", fontWeight: 600, fontSize: "0.875rem" }}
                        />
                      )}
                    </Box>
                    {(detailClient?.active_membership ?? rowClient?.active_membership) ? (
                      <Box sx={{ py: 1.5, px: { xs: 2.5, sm: 3 } }}>
                        <Typography variant="caption" sx={{ color: "#9ca3af", fontSize: "0.75rem", fontWeight: 500 }}>Membresía activa</Typography>
                        <Typography variant="body2" fontWeight={600} sx={{ color: "#15803d", mt: 0.5 }}>
                          {(detailClient?.active_membership ?? rowClient?.active_membership)?.plan_name ?? "—"}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#6b7280" }}>
                          Hasta {formatDate((detailClient?.active_membership ?? rowClient?.active_membership)?.end_date)}
                        </Typography>
                      </Box>
                    ) : (
                      <Box sx={{ py: 1.25, px: { xs: 2.5, sm: 3 }, borderBottom: "none" }}>
                        <Typography variant="caption" sx={{ color: "#9ca3af", fontSize: "0.75rem", fontWeight: 500 }}>Membresía activa</Typography>
                        <Typography variant="body2" sx={{ color: "#9ca3af", mt: 0.5 }}>Sin membresía activa</Typography>
                      </Box>
                    )}
                  </Box>

                  {/* Acciones */}
                  <Box sx={{ mt: 3, display: "flex", flexWrap: "wrap", gap: 1.5 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Edit />}
                      onClick={() => { onEdit?.(detailClient ?? rowClient); handleClose(); }}
                      sx={{
                        color: "#78716c",
                        borderColor: "#e7e5e4",
                        borderRadius: "10px",
                        textTransform: "none",
                        fontWeight: 600,
                        fontSize: "0.8125rem",
                        "&:hover": { borderColor: "#d6d3d1", backgroundColor: "#fafaf9" },
                      }}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<AccountBalance />}
                      onClick={() => { onCurrentAccount?.(detailClient ?? rowClient); handleClose(); }}
                      sx={{
                        color: "#059669",
                        borderColor: "#a7f3d0",
                        borderRadius: "10px",
                        textTransform: "none",
                        fontWeight: 600,
                        fontSize: "0.8125rem",
                        "&:hover": { borderColor: "#6ee7b7", backgroundColor: "#f0fdf4" },
                      }}
                    >
                      Cuenta corriente
                    </Button>
                    {(detailClient?.active_membership ?? rowClient?.active_membership) &&
                     Number((detailClient?.active_membership ?? rowClient?.active_membership)?.duration_days ?? 0) > 5 && (
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Autorenew />}
                        onClick={() => { onRenewOrChange?.(detailClient ?? rowClient); handleClose(); }}
                        sx={{
                          color: "#b45309",
                          borderColor: "#fdba74",
                          borderRadius: "10px",
                          textTransform: "none",
                          fontWeight: 600,
                          fontSize: "0.8125rem",
                          "&:hover": { borderColor: "#d97706", backgroundColor: "#fff7ed" },
                        }}
                      >
                        Renovar o cambiar membresía
                      </Button>
                    )}
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Delete />}
                      onClick={handleDelete}
                      sx={{
                        color: "#dc2626",
                        borderColor: "#fecaca",
                        borderRadius: "10px",
                        textTransform: "none",
                        fontWeight: 600,
                        fontSize: "0.8125rem",
                        "&:hover": { borderColor: "#f87171", backgroundColor: "#fef2f2" },
                      }}
                    >
                      Desactivar cliente
                    </Button>
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
        )}

        {tabValue === 1 && (
          <Box sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, minWidth: 0, overflow: "auto" }}>
            <Box sx={{ px: { xs: 2, sm: 3 }, py: 2, flexShrink: 0 }}>
              <Typography variant="body2" color="text.secondary">
                Historial de ingresos al gimnasio de este cliente.
              </Typography>
            </Box>
            <Box sx={{ px: { xs: 2, sm: 3 }, pb: 2, flex: 1, minWidth: 0, display: "flex", flexDirection: "column", width: "100%", boxSizing: "border-box" }}>
              <TableContainer
                component={Paper}
                elevation={0}
                sx={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  overflow: "auto",
                  flex: 1,
                  minHeight: 0,
                  width: "100%",
                  maxWidth: "100%",
                }}
              >
                <Table size="small" sx={{ width: "100%", minWidth: 260, tableLayout: "fixed" }}>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "#fafafa" }}>
                      <TableCell sx={{ fontWeight: 600, color: "#374151", fontSize: "0.75rem", width: "50%", px: { xs: 1.5, sm: 2 }, py: 1.5 }}>Fecha y hora</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: "#374151", fontSize: "0.75rem", width: "50%", px: { xs: 1.5, sm: 2 }, py: 1.5 }}>Plan</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {entriesLoading ? (
                      <TableRow>
                        <TableCell colSpan={2} align="center" sx={{ py: 4, px: 2 }}>
                          <Box className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" sx={{ mx: "auto", mb: 1 }} />
                          <Typography variant="caption" color="text.secondary">Cargando entradas...</Typography>
                        </TableCell>
                      </TableRow>
                    ) : entries.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2} align="center" sx={{ py: 4, px: 2 }}>
                          <LoginIcon sx={{ fontSize: 40, color: "#d6d3d1", mb: 1 }} />
                          <Typography variant="body2" color="text.secondary">No hay entradas registradas</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      entries.map((entry) => (
                        <TableRow key={entry.id} sx={{ "&:last-child td": { border: 0 } }}>
                          <TableCell sx={{ fontSize: "0.875rem", px: { xs: 1.5, sm: 2 }, py: 1.25 }}>{formatDateTime(entry.entered_at)}</TableCell>
                          <TableCell sx={{ fontSize: "0.875rem", wordBreak: "break-word", px: { xs: 1.5, sm: 2 }, py: 1.25 }}>{entry.plan_name ?? "—"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              {!entriesLoading && entries.length > 0 && (
                <Paper
                  elevation={0}
                  sx={{
                    border: "1px solid #e5e7eb",
                    borderTop: "none",
                    borderTopLeftRadius: 0,
                    borderTopRightRadius: 0,
                    borderRadius: "0 0 12px 12px",
                    overflow: "hidden",
                    width: "100%",
                    maxWidth: "100%",
                  }}
                >
                  <TablePagination
                    component="div"
                    count={entriesPagination.total}
                    page={entriesPagination.page - 1}
                    onPageChange={handleEntriesPageChange}
                    rowsPerPage={entriesPagination.limit}
                    onRowsPerPageChange={handleEntriesRowsPerPageChange}
                    rowsPerPageOptions={[5, 10, 25]}
                    labelRowsPerPage="Filas:"
                    labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                    sx={{
                      fontSize: "0.8125rem",
                      px: { xs: 1.5, sm: 2 },
                      "& .MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows": { fontSize: "0.8125rem" },
                    }}
                  />
                </Paper>
              )}
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  )
}
