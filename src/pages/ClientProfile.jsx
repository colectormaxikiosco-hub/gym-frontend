"use client"

import { Box, Typography, Paper } from "@mui/material"
import { useAuth } from "../context/AuthContext"
import { Person } from "@mui/icons-material"
import ProfileTab from "../components/configuration/ProfileTab"

const ClientProfile = () => {
  const { user } = useAuth()

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
      <Box sx={{ maxWidth: 560, mx: "auto" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "10px",
              bgcolor: "#f5f5f4",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Person sx={{ color: "#78716c", fontSize: 20 }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 600, color: "#111827", fontSize: "0.9375rem" }}>
              Mi perfil
            </Typography>
            <Typography variant="caption" sx={{ color: "#9ca3af" }}>
              Información personal y seguridad
            </Typography>
          </Box>
        </Box>

        <Paper
          elevation={0}
          sx={{
            border: "1px solid #f3f4f6",
            borderRadius: "12px",
            overflow: "hidden",
          }}
        >
          <ProfileTab />
        </Paper>
      </Box>
    </Box>
  )
}

export default ClientProfile
