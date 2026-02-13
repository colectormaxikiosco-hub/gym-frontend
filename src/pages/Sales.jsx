"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Box, Typography, Tabs, Tab, Paper, Button } from "@mui/material"
import { ShoppingCart, History, PointOfSale, Assessment } from "@mui/icons-material"
import PointOfSaleTab from "../components/sales/PointOfSaleTab"
import SalesHistoryTab from "../components/sales/SalesHistoryTab"
import cashService from "../services/cashService"

const Sales = () => {
  const navigate = useNavigate()
  const [currentTab, setCurrentTab] = useState(0)
  const [cashOpen, setCashOpen] = useState(null)
  const [loadingCash, setLoadingCash] = useState(true)

  useEffect(() => {
    if (currentTab === 0) {
      setLoadingCash(true)
      cashService
        .getActiveSession()
        .then((res) => setCashOpen(res?.data != null))
        .catch(() => setCashOpen(false))
        .finally(() => setLoadingCash(false))
    }
  }, [currentTab])

  return (
    <Box className="min-h-screen bg-gradient-to-br from-gray-50 via-amber-50/20 to-gray-50">
      <Box className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
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
              Ventas
            </Typography>
            <Typography variant="body1" sx={{ color: "#6b7280", fontWeight: 500, mt: 0.5 }}>
              Punto de venta e historial de ventas
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<Assessment />}
            onClick={() => navigate("/ventas/reportes")}
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

        <Box
          className="bg-white rounded-2xl"
          sx={{
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            border: "1px solid #e5e7eb",
            overflow: "hidden",
          }}
        >
          <Tabs
            value={currentTab}
            onChange={(_, v) => setCurrentTab(v)}
            sx={{
              borderBottom: "1px solid #e5e7eb",
              backgroundColor: "#fafafa",
              minHeight: 56,
              "& .MuiTab-root": {
                textTransform: "none",
                fontWeight: 500,
                fontSize: "0.875rem",
                minHeight: 56,
                color: "#6b7280",
                px: 3,
                gap: 1,
                "&.Mui-selected": { color: "#d97706", fontWeight: 600 },
                "&:hover": { backgroundColor: "#f3f4f6" },
              },
              "& .MuiTabs-indicator": { backgroundColor: "#d97706", height: 2 },
              "& .MuiTab-iconWrapper": { marginRight: 1 },
            }}
          >
            <Tab label="Punto de venta" icon={<ShoppingCart />} iconPosition="start" />
            <Tab label="Historial de ventas" icon={<History />} iconPosition="start" />
          </Tabs>

          <Box sx={{ p: { xs: 2.5, sm: 3 } }}>
            {currentTab === 0 && loadingCash && (
              <Box sx={{ py: 6, textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">Verificando sesión de caja...</Typography>
              </Box>
            )}
            {currentTab === 0 && !loadingCash && !cashOpen && (
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  textAlign: "center",
                  border: "1px solid #fecaca",
                  borderRadius: "12px",
                  backgroundColor: "#fef2f2",
                }}
              >
                <PointOfSale sx={{ fontSize: 56, color: "#dc2626", mb: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#991b1b", mb: 1 }}>
                  La caja no está abierta
                </Typography>
                <Typography variant="body2" sx={{ color: "#b91c1c", mb: 3, maxWidth: 400, mx: "auto" }}>
                  Para usar el punto de venta es necesario tener una sesión de caja abierta. Abrí la caja desde la sección de Caja para poder registrar ventas.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<PointOfSale />}
                  onClick={() => navigate("/caja")}
                  sx={{
                    backgroundColor: "#d97706",
                    fontWeight: 600,
                    borderRadius: "10px",
                    textTransform: "none",
                    px: 3,
                    "&:hover": { backgroundColor: "#b45309" },
                  }}
                >
                  Ir a Caja para abrir
                </Button>
              </Paper>
            )}
            {currentTab === 0 && !loadingCash && cashOpen && <PointOfSaleTab onSaleComplete={() => setCurrentTab(1)} />}
            {currentTab === 1 && <SalesHistoryTab />}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default Sales
