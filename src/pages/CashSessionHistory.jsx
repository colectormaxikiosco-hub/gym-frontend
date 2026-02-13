"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
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
  CalendarToday,
  Person,
  AttachMoney,
  TrendingUp,
  TrendingDown,
  Visibility,
  History,
} from "@mui/icons-material"
import { NumericFormat } from "react-number-format"
import cashService from "../services/cashService"

export default function CashSessionHistory() {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    try {
      setLoading(true)
      const response = await cashService.getHistory()
      const list = Array.isArray(response?.data) ? response.data : response?.data?.data
      setSessions(Array.isArray(list) ? list : [])
    } catch (error) {
      if (!error.cancelled) {
        console.error("Error al cargar sesiones:", error)
      }
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Box className="min-h-screen bg-gradient-to-br from-gray-50 via-amber-50/20 to-gray-50">
      <Box className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 6 }}>
          <IconButton
            onClick={() => navigate("/caja")}
            size="small"
            sx={{
              color: "#78716c",
              backgroundColor: "#f5f5f4",
              "&:hover": {
                backgroundColor: "#e7e5e4",
                color: "#d97706",
              },
            }}
            aria-label="Volver a Caja"
          >
            <ArrowBack fontSize="small" />
          </IconButton>
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
              Historial de Sesiones
            </Typography>
            <Typography variant="body1" sx={{ color: "#6b7280", fontWeight: 500, mt: 0.5 }}>
              Consulta todas las sesiones de caja cerradas
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            backgroundColor: "#fff",
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            overflow: "hidden",
          }}
        >
          {loading ? (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 10 }}>
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
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Cargando...
              </Typography>
            </Box>
          ) : sessions.length === 0 ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                py: 10,
                px: 3,
              }}
            >
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  backgroundColor: "#fafafa",
                  borderRadius: "16px",
                  border: "1px dashed #e5e7eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: 2,
                }}
              >
                <History sx={{ fontSize: 32, color: "#d1d5db" }} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: "#374151", mb: 1 }}>
                No hay sesiones cerradas aún
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Las sesiones de caja aparecerán aquí una vez cerradas
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={0}>
              <Table
                size="small"
                sx={{
                  minWidth: 700,
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
                    <TableCell>Fecha / Horario</TableCell>
                    <TableCell>Cajero</TableCell>
                    <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>Monto Inicial</TableCell>
                    <TableCell sx={{ display: { xs: "none", lg: "table-cell" } }}>Ingresos</TableCell>
                    <TableCell sx={{ display: { xs: "none", lg: "table-cell" } }}>Egresos</TableCell>
                    <TableCell>Monto Cierre</TableCell>
                    <TableCell align="right">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow
                      key={session.id}
                      hover
                      onClick={() => navigate(`/caja/sesion/${session.id}`)}
                      sx={{
                        cursor: "pointer",
                        "&:hover": { backgroundColor: "#fafafa" },
                        "&:last-child .MuiTableCell-root": { borderBottom: "none" },
                      }}
                    >
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight={600} color="text.primary">
                            {formatDate(session.opened_at)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatTime(session.opened_at)} - {formatTime(session.closed_at)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {session.user_name || "-"}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>
                        <NumericFormat
                          value={session.opening_amount}
                          displayType="text"
                          thousandSeparator="."
                          decimalSeparator=","
                          prefix="$ "
                          decimalScale={2}
                          fixedDecimalScale
                          renderText={(value) => (
                            <Typography variant="body2">{value}</Typography>
                          )}
                        />
                      </TableCell>
                      <TableCell sx={{ display: { xs: "none", lg: "table-cell" } }}>
                        <NumericFormat
                          value={session.total_income}
                          displayType="text"
                          thousandSeparator="."
                          decimalSeparator=","
                          prefix="$ "
                          decimalScale={2}
                          fixedDecimalScale
                          renderText={(value) => (
                            <Typography variant="body2" sx={{ color: "#16a34a", fontWeight: 500 }}>
                              {value}
                            </Typography>
                          )}
                        />
                      </TableCell>
                      <TableCell sx={{ display: { xs: "none", lg: "table-cell" } }}>
                        <NumericFormat
                          value={session.total_expenses}
                          displayType="text"
                          thousandSeparator="."
                          decimalSeparator=","
                          prefix="$ "
                          decimalScale={2}
                          fixedDecimalScale
                          renderText={(value) => (
                            <Typography variant="body2" sx={{ color: "#dc2626", fontWeight: 500 }}>
                              {value}
                            </Typography>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <Box>
                          <NumericFormat
                            value={session.closing_amount}
                            displayType="text"
                            thousandSeparator="."
                            decimalSeparator=","
                            prefix="$ "
                            decimalScale={2}
                            fixedDecimalScale
                            renderText={(value) => (
                              <Typography variant="body2" fontWeight={600} sx={{ color: "#d97706" }}>
                                {value}
                              </Typography>
                            )}
                          />
                          {session.difference != null && session.difference !== 0 && (
                            <NumericFormat
                              value={session.difference}
                              displayType="text"
                              thousandSeparator="."
                              decimalSeparator=","
                              prefix={session.difference > 0 ? "+ $ " : "- $ "}
                              decimalScale={2}
                              fixedDecimalScale
                              renderText={(value) => (
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: session.difference > 0 ? "#16a34a" : "#dc2626",
                                    fontWeight: 500,
                                  }}
                                >
                                  {value}
                                </Typography>
                              )}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/caja/sesion/${session.id}`)
                          }}
                          sx={{ color: "#d97706" }}
                          title="Ver detalle"
                          aria-label="Ver detalle"
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Box>
    </Box>
  )
}
