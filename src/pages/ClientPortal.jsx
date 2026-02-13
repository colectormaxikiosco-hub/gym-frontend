"use client"

import { useState, useEffect } from "react"
import { Box, Typography, Paper, Alert, Skeleton } from "@mui/material"
import { useAuth } from "../context/AuthContext"
import { Notifications, FitnessCenter, Info, Warning, CheckCircle, Person, CardMembership } from "@mui/icons-material"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import clientService from "../services/clientService"
import noticeService from "../services/noticeService"
import classService from "../services/classService"

const formatDate = (date) => {
  if (!date) return "—"
  return format(new Date(date), "dd/MM/yyyy", { locale: es })
}

const ClientPortal = () => {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [notices, setNotices] = useState([])
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [profileRes, noticesRes, classesRes] = await Promise.all([
        clientService.getMyProfile(),
        noticeService.getAllNotices(),
        classService.getAllClasses(),
      ])
      setProfile(profileRes?.data ?? null)
      setNotices(noticesRes.data || [])
      setClasses(classesRes.data || [])
      setError("")
    } catch {
      setError("No se pudo cargar la información. Revisa tu conexión.")
      setProfile(null)
      setNotices([])
      setClasses([])
    } finally {
      setLoading(false)
    }
  }

  const getNoticeIcon = (type) => {
    switch (type) {
      case "success":
        return <CheckCircle sx={{ color: "#166534", fontSize: 22 }} />
      case "warning":
        return <Warning sx={{ color: "#d97706", fontSize: 22 }} />
      default:
        return <Info sx={{ color: "#57534e", fontSize: 22 }} />
    }
  }

  const getNoticeBg = (type) => {
    switch (type) {
      case "success":
        return "#f0fdf4"
      case "warning":
        return "#fffbeb"
      default:
        return "#f5f5f4"
    }
  }

  const groupClassesByDay = () => {
    const days = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
    const grouped = {}
    days.forEach((day) => {
      grouped[day] = Array.isArray(classes) ? classes.filter((c) => c.day_of_week === day) : []
    })
    return grouped
  }

  const membership = profile?.active_membership ?? null
  const daysRemaining = membership?.days_remaining

  const getDaysRemainingText = () => {
    if (daysRemaining == null) return ""
    if (daysRemaining === 0) return "Vence hoy"
    if (daysRemaining === 1) return "1 día restante"
    return `${daysRemaining} días restantes`
  }

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "calc(100vh - 64px)",
          bgcolor: "#fafaf9",
          px: { xs: 2, sm: 3 },
          py: { xs: 2.5, sm: 4 },
          pb: { xs: 4, sm: 5 },
        }}
      >
        <Box sx={{ maxWidth: 640, mx: "auto" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
            <Skeleton variant="rounded" width={48} height={48} sx={{ borderRadius: "12px" }} />
            <Box sx={{ flex: 1 }}>
              <Skeleton width="70%" height={28} />
              <Skeleton width="50%" height={20} sx={{ mt: 0.5 }} />
            </Box>
          </Box>
          <Skeleton variant="rounded" height={140} sx={{ borderRadius: "12px", mb: 3 }} />
          <Skeleton variant="rounded" height={80} sx={{ borderRadius: "12px", mb: 2 }} />
          <Skeleton variant="rounded" height={80} sx={{ borderRadius: "12px" }} />
        </Box>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 64px)",
        bgcolor: "#fafaf9",
        px: { xs: 2, sm: 3 },
        py: { xs: 2.5, sm: 4 },
        pb: { xs: 5, sm: 6 },
      }}
    >
      <Box sx={{ maxWidth: 640, mx: "auto" }}>
        {/* Encabezado: móvil primero, minimalista */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            mb: { xs: 3, sm: 4 },
          }}
        >
        
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: "#111827",
                fontSize: { xs: "1.125rem", sm: "1.25rem" },
                lineHeight: 1.3,
              }}
            >
              Hola, {user?.name ?? "—"}
            </Typography>
            <Typography variant="caption" sx={{ color: "#9ca3af", display: "block", mt: 0.25 }}>
              Portal del cliente · Life Fitness
            </Typography>
          </Box>
        </Box>

        {error && (
          <Alert
            severity="error"
            onClose={() => setError("")}
            sx={{
              mb: 3,
              borderRadius: "12px",
              "& .MuiAlert-message": { fontSize: "0.875rem" },
            }}
          >
            {error}
          </Alert>
        )}

        {/* Mi membresía — lo primero que ve el cliente */}
        <Box sx={{ mb: { xs: 4, sm: 5 } }}>
          <Paper
            elevation={0}
            sx={{
              border: "1px solid",
              borderColor: membership ? "#bbf7d0" : "#f3f4f6",
              borderRadius: "12px",
              overflow: "hidden",
              bgcolor: membership ? "#f0fdf4" : "#fafaf9",
            }}
          >
            <Box sx={{ p: { xs: 2.5, sm: 3 } }}>
              {membership ? (
                <>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1.5, mb: 1.5 }}>
                    <Typography
                      component="span"
                      sx={{
                        px: 1.25,
                        py: 0.5,
                        borderRadius: "8px",
                        bgcolor: "#166534",
                        color: "#fff",
                        fontWeight: 700,
                        fontSize: "0.75rem",
                      }}
                    >
                      Activa
                    </Typography>
                    <Typography sx={{ fontWeight: 700, color: "#166534", fontSize: { xs: "1rem", sm: "1.125rem" } }}>
                      {getDaysRemainingText()}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontWeight: 600, color: "#111827", fontSize: "1rem", mb: 0.5 }}>
                    {membership.plan_name ?? "—"}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#4b5563", fontSize: "0.8125rem" }}>
                    Válida hasta {formatDate(membership.end_date)}
                  </Typography>
                </>
              ) : (
                <>
                  <Typography
                    component="span"
                    sx={{
                      px: 1.25,
                      py: 0.5,
                      borderRadius: "8px",
                      bgcolor: "#e5e7eb",
                      color: "#6b7280",
                      fontWeight: 600,
                      fontSize: "0.75rem",
                    }}
                  >
                    Sin membresía activa
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#6b7280", mt: 1.5, fontSize: "0.8125rem", lineHeight: 1.5 }}>
                    Acercate a recepción para activar o renovar tu plan.
                  </Typography>
                </>
              )}
            </Box>
          </Paper>
        </Box>

        {/* Avisos */}
        <Box sx={{ mb: { xs: 4, sm: 5 } }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
            <Box>
              <Typography sx={{ fontWeight: 600, color: "#111827", fontSize: "0.9375rem" }}>
                Avisos
              </Typography>
              <Typography variant="caption" sx={{ color: "#9ca3af" }}>
                Novedades del gimnasio
              </Typography>
            </Box>
          </Box>

          {!Array.isArray(notices) || notices.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                border: "1px solid #f3f4f6",
                borderRadius: "12px",
                p: { xs: 2.5, sm: 3 },
                textAlign: "center",
              }}
            >
              <Typography variant="body2" sx={{ color: "#9ca3af" }}>
                No hay avisos en este momento
              </Typography>
            </Paper>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {notices.map((notice) => (
                <Paper
                  key={notice.id}
                  elevation={0}
                  sx={{
                    border: "1px solid #f3f4f6",
                    borderRadius: "12px",
                    overflow: "hidden",
                    bgcolor: getNoticeBg(notice.type),
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 1.5,
                      p: { xs: 2, sm: 2.5 },
                    }}
                  >
                    <Box sx={{ flexShrink: 0, mt: 0.25 }}>{getNoticeIcon(notice.type)}</Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 600, color: "#111827", fontSize: "0.875rem", mb: 0.5 }}>
                        {notice.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#4b5563", fontSize: "0.8125rem", lineHeight: 1.5 }}>
                        {notice.content}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              ))}
            </Box>
          )}
        </Box>

        {/* Horario de clases */}
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
            <Box>
              <Typography sx={{ fontWeight: 600, color: "#111827", fontSize: "0.9375rem" }}>
                Horario de clases
              </Typography>
              <Typography variant="caption" sx={{ color: "#9ca3af" }}>
                Clases semanales
              </Typography>
            </Box>
          </Box>

          {!Array.isArray(classes) || classes.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                border: "1px solid #f3f4f6",
                borderRadius: "12px",
                p: { xs: 2.5, sm: 3 },
                textAlign: "center",
              }}
            >
              <Typography variant="body2" sx={{ color: "#9ca3af" }}>
                No hay clases programadas
              </Typography>
            </Paper>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {Object.entries(groupClassesByDay()).map(([day, dayClasses]) => {
                if (dayClasses.length === 0) return null
                return (
                  <Paper
                    key={day}
                    elevation={0}
                    sx={{
                      border: "1px solid #f3f4f6",
                      borderRadius: "12px",
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      sx={{
                        px: { xs: 2, sm: 2.5 },
                        py: 1.25,
                        bgcolor: "#fafafa",
                        borderBottom: "1px solid #f3f4f6",
                      }}
                    >
                      <Typography sx={{ fontWeight: 600, color: "#374151", fontSize: "0.8125rem" }}>
                        {day}
                      </Typography>
                    </Box>
                    <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
                      {dayClasses.map((classItem) => (
                        <Box
                          key={classItem.id}
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 0.75,
                            p: { xs: 1.5, sm: 2 },
                            borderRadius: "10px",
                            bgcolor: "#fafaf9",
                            "&:not(:last-child)": { mb: 1 },
                          }}
                        >
                          <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                            <Typography sx={{ fontWeight: 600, color: "#111827", fontSize: "0.875rem" }}>
                              {classItem.name}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                fontWeight: 600,
                                color: "#d97706",
                                fontSize: "0.75rem",
                              }}
                            >
                              {classItem.start_time} – {classItem.end_time}
                            </Typography>
                          </Box>
                          {classItem.description && (
                            <Typography variant="caption" sx={{ color: "#6b7280", fontSize: "0.75rem", lineHeight: 1.4 }}>
                              {classItem.description}
                            </Typography>
                          )}
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 0.25 }}>
                            {classItem.instructor && (
                              <Typography
                                component="span"
                                variant="caption"
                                sx={{
                                  px: 1,
                                  py: 0.25,
                                  borderRadius: "6px",
                                  bgcolor: "#f5f5f4",
                                  color: "#57534e",
                                  fontSize: "0.7rem",
                                }}
                              >
                                {classItem.instructor}
                              </Typography>
                            )}
                            <Typography
                              component="span"
                              variant="caption"
                              sx={{
                                px: 1,
                                py: 0.25,
                                borderRadius: "6px",
                                bgcolor: "#fffbeb",
                                color: "#92400e",
                                fontSize: "0.7rem",
                              }}
                            >
                              {classItem.capacity} personas
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Paper>
                )
              })}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  )
}

export default ClientPortal
