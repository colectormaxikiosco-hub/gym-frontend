"use client"

import { useState } from "react"
import { Box, Typography, Tabs, Tab } from "@mui/material"
import { Person, People, FitnessCenter, Notifications, School, CalendarMonth, Category } from "@mui/icons-material"
import ProfileTab from "../components/configuration/ProfileTab"
import UsersTab from "../components/configuration/UsersTab"
import NoticesTab from "../components/configuration/NoticesTab"
import ClassesTab from "../components/configuration/ClassesTab"
import PlansTab from "../components/configuration/PlansTab"
import InstructorsTab from "../components/configuration/InstructorsTab"
import CategoriesTab from "../components/configuration/CategoriesTab"
import { useAuth } from "../context/AuthContext"

const Configuration = () => {
  const [currentTab, setCurrentTab] = useState(0)
  const { user } = useAuth()

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue)
  }

  // Build tabs array based on user role
  const getTabs = () => {
    const tabs = [{ label: "Mi Perfil", icon: <Person /> }]
    if (user?.role === "admin") {
      tabs.push({ label: "Usuarios", icon: <People /> })
      tabs.push({ label: "Planes", icon: <FitnessCenter /> })
      tabs.push({ label: "Instructores", icon: <School /> })
      tabs.push({ label: "Categorías", icon: <Category /> })
    }
    if (user?.role === "admin" || user?.role === "empleado") {
      tabs.push({ label: "Avisos", icon: <Notifications /> })
      tabs.push({ label: "Clases", icon: <CalendarMonth /> })
    }
    return tabs
  }

  const tabs = getTabs()

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
            Configuración
          </Typography>
          <Typography variant="body1" sx={{ color: "#6b7280", fontWeight: 500, mt: 0.5 }}>
            Administra tu perfil y la configuración del sistema
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
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
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
                "&.Mui-selected": {
                  color: "#d97706",
                  fontWeight: 600,
                },
                "&:hover": {
                  backgroundColor: "#f3f4f6",
                },
              },
              "& .MuiTabs-indicator": {
                backgroundColor: "#d97706",
                height: 2,
              },
              "& .MuiTab-iconWrapper": {
                marginRight: 1,
              },
            }}
          >
            {tabs.map((tab, index) => (
              <Tab key={index} label={tab.label} icon={tab.icon} iconPosition="start" />
            ))}
          </Tabs>

          <Box sx={{ p: { xs: 2.5, sm: 3 } }}>
            {currentTab === 0 && <ProfileTab />}
            {currentTab === 1 && user?.role === "admin" && <UsersTab />}
            {currentTab === 2 && user?.role === "admin" && <PlansTab />}
            {currentTab === 3 && user?.role === "admin" && <InstructorsTab />}
            {currentTab === 4 && user?.role === "admin" && <CategoriesTab />}
            {currentTab === 5 && user?.role === "admin" && <NoticesTab />}
            {currentTab === 6 && user?.role === "admin" && <ClassesTab />}
            {currentTab === 1 && user?.role === "empleado" && <NoticesTab />}
            {currentTab === 2 && user?.role === "empleado" && <ClassesTab />}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default Configuration
