"use client"

import { useState } from "react"
import { Box, Typography, Tabs, Tab } from "@mui/material"
import { Inventory2, History, WarningAmber } from "@mui/icons-material"
import ProductsStockTab from "../components/products/ProductsStockTab"
import MovementsGeneralTab from "../components/products/MovementsGeneralTab"
import ProductAlertsTab from "../components/products/ProductAlertsTab"

const Products = () => {
  const [currentTab, setCurrentTab] = useState(0)

  return (
    <Box className="min-h-screen bg-gradient-to-br from-gray-50 via-amber-50/20 to-gray-50">
      <Box className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
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
            Productos
          </Typography>
          <Typography variant="body1" sx={{ color: "#6b7280", fontWeight: 500, mt: 0.5 }}>
            Gestiona el inventario y los movimientos de stock
          </Typography>
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
            <Tab label="Gestión de stock" icon={<Inventory2 />} iconPosition="start" />
            <Tab label="Alertas" icon={<WarningAmber />} iconPosition="start" />
            <Tab label="Movimientos generales" icon={<History />} iconPosition="start" />
          </Tabs>

          <Box sx={{ p: { xs: 2.5, sm: 3 } }}>
            {currentTab === 0 && <ProductsStockTab />}
            {currentTab === 1 && <ProductAlertsTab />}
            {currentTab === 2 && <MovementsGeneralTab />}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default Products
