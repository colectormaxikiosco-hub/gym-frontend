"use client"

import { useNavigate } from "react-router-dom"
import { Box, Typography, Card, CardContent, CardActionArea } from "@mui/material"
import { Assessment, CardMembership, BarChart, ShoppingCart } from "@mui/icons-material"

const reportCards = [
  {
    id: "membresias",
    title: "Reportes de Membresías",
    description: "Planes más contratados, instructores con más membresías, clientes con más entradas y estadísticas por período.",
    path: "/memberships/reportes",
    icon: CardMembership,
    color: "#d97706",
    bg: "#fffbeb",
  },
  {
    id: "ventas",
    title: "Reportes de Ventas",
    description: "Productos más vendidos, ventas por método de pago, clientes con más compras, ingresos y gráficos por mes.",
    path: "/ventas/reportes",
    icon: ShoppingCart,
    color: "#16a34a",
    bg: "#dcfce7",
  },
]

export default function Reportes() {
  const navigate = useNavigate()

  return (
    <Box className="min-h-screen bg-gradient-to-br from-gray-50 via-amber-50/20 to-gray-50">
      <Box className="p-4 sm:p-6 lg:p-8 max-w-[1000px] mx-auto">
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 4 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: "14px",
              bgcolor: "#fffbeb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Assessment sx={{ fontSize: 28, color: "#d97706" }} />
          </Box>
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
              Reportes y Análisis
            </Typography>
            <Typography variant="body1" sx={{ color: "#6b7280", fontWeight: 500, mt: 0.5 }}>
              Seleccioná el tipo de reporte que querés consultar
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
          {reportCards.map((card) => {
            const Icon = card.icon
            return (
              <Card
                key={card.id}
                elevation={0}
                sx={{
                  borderRadius: "14px",
                  border: "1px solid #e5e7eb",
                  overflow: "hidden",
                  transition: "box-shadow 0.2s ease, transform 0.2s ease",
                  "&:hover": {
                    boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                    transform: "translateY(-2px)",
                  },
                }}
              >
                <CardActionArea onClick={() => navigate(card.path)} sx={{ p: 0 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: "14px",
                        bgcolor: card.bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mb: 2,
                      }}
                    >
                      <Icon sx={{ fontSize: 28, color: card.color }} />
                    </Box>
                    <Typography variant="h6" fontWeight={700} sx={{ color: "#111827", mb: 1 }}>
                      {card.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                      {card.description}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 2 }}>
                      <BarChart sx={{ fontSize: 18, color: card.color }} />
                      <Typography variant="body2" fontWeight={600} sx={{ color: card.color }}>
                        Ver reporte
                      </Typography>
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            )
          })}
        </Box>
      </Box>
    </Box>
  )
}
