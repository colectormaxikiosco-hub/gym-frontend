"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import toast, { Toaster } from "react-hot-toast"
import { Box, TextField, Button, Typography, CircularProgress, IconButton, InputAdornment } from "@mui/material"
import { FitnessCenter, Visibility, VisibilityOff } from "@mui/icons-material"

const Login = () => {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleTogglePasswordVisibility = () => {
    setShowPassword((prev) => !prev)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (loading) return

    // Validación básica
    if (!username.trim() || !password.trim()) {
      toast.error("Por favor completa todos los campos", {
        duration: 4000,
        position: "top-center",
        style: {
          background: "#dc2626",
          color: "#fff",
          fontWeight: "600",
          padding: "16px 24px",
          borderRadius: "12px",
          fontSize: "15px",
        },
      })
      return
    }

    setLoading(true)

    try {
      const result = await login(username, password)

      toast.success("¡Bienvenido! Redirigiendo...", {
        duration: 2000,
        position: "top-center",
        style: {
          background: "#f59e0b",
          color: "#fff",
          fontWeight: "600",
          padding: "16px 24px",
          borderRadius: "12px",
          fontSize: "15px",
        },
        iconTheme: {
          primary: "#fff",
          secondary: "#f59e0b",
        },
      })

      setTimeout(() => {
        if (result.user.role === "client") {
          navigate("/client-portal")
        } else {
          navigate("/dashboard")
        }
      }, 1500)
    } catch (err) {
      setLoading(false)

      const errorMessage = err.message || "Credenciales incorrectas. Verifica tus datos."

      toast.error(errorMessage, {
        duration: 4000,
        position: "top-center",
        style: {
          background: "#dc2626",
          color: "#fff",
          fontWeight: "600",
          padding: "16px 24px",
          borderRadius: "12px",
          fontSize: "15px",
        },
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/50 via-white to-yellow-50/50 flex items-center justify-center p-4 sm:p-6">
      <Toaster />

      <Box className="w-full max-w-[440px]">
        <Box className="text-center mb-10">
          <Box className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-500 rounded-3xl mb-6">
            <FitnessCenter sx={{ fontSize: 40, color: "white" }} />
          </Box>
          <Typography
            variant="h3"
            sx={{
              fontSize: { xs: "28px", sm: "32px" },
              fontWeight: 700,
              color: "#111827",
              fontFamily: "'Poppins', 'Inter', sans-serif",
              letterSpacing: "-0.02em",
            }}
          >
            Life Fitness
          </Typography>
        </Box>

        <Box
          className="bg-white rounded-3xl p-8 sm:p-10"
          sx={{
            boxShadow: "0 0 0 1px rgba(0,0,0,0.05), 0 20px 40px -10px rgba(0,0,0,0.08)",
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontSize: { xs: "20px", sm: "22px" },
              fontWeight: 600,
              color: "#111827",
              mb: 3,
              fontFamily: "'Poppins', 'Inter', sans-serif",
              letterSpacing: "-0.01em",
              textAlign: "center"
            }}
          >
            Iniciar Sesión
          </Typography>

          <form onSubmit={handleSubmit}>
            <Box className="space-y-6">
              <Box>
                <TextField
                  fullWidth
                  variant="outlined"
                  label="Usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                  disabled={loading}
                  inputProps={{
                    style: { fontSize: 16 },
                    enterKeyHint: "next",
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "14px",
                      backgroundColor: "#f9fafb",
                      fontSize: "16px",
                      fontFamily: "'Inter', sans-serif",
                      transition: "all 0.2s ease",
                      "& fieldset": {
                        borderColor: "#e5e7eb",
                        borderWidth: "1.5px",
                      },
                      "&:hover": {
                        backgroundColor: "#ffffff",
                        "& fieldset": {
                          borderColor: "#f59e0b",
                        },
                      },
                      "&.Mui-focused": {
                        backgroundColor: "#ffffff",
                        "& fieldset": {
                          borderColor: "#f59e0b",
                          borderWidth: "2px",
                        },
                      },
                    },
                    "& .MuiInputLabel-root": {
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "16px",
                      color: "#6b7280",
                      "&.Mui-focused": {
                        color: "#f59e0b",
                      },
                    },
                    "& input": {
                      padding: "14px 16px",
                      fontSize: "16px",
                    },
                  }}
                />
              </Box>

              <Box>
                <TextField
                  fullWidth
                  type={showPassword ? "text" : "password"}
                  variant="outlined"
                  label="Contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  disabled={loading}
                  inputProps={{
                    style: { fontSize: 16 },
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="mostrar contraseña"
                          onClick={handleTogglePasswordVisibility}
                          edge="end"
                          disabled={loading}
                          sx={{
                            color: "#9ca3af",
                            "&:hover": {
                              color: "#f59e0b",
                              backgroundColor: "rgba(245, 158, 11, 0.08)",
                            },
                          }}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "14px",
                      backgroundColor: "#f9fafb",
                      fontSize: "16px",
                      fontFamily: "'Inter', sans-serif",
                      transition: "all 0.2s ease",
                      "& fieldset": {
                        borderColor: "#e5e7eb",
                        borderWidth: "1.5px",
                      },
                      "&:hover": {
                        backgroundColor: "#ffffff",
                        "& fieldset": {
                          borderColor: "#f59e0b",
                        },
                      },
                      "&.Mui-focused": {
                        backgroundColor: "#ffffff",
                        "& fieldset": {
                          borderColor: "#f59e0b",
                          borderWidth: "2px",
                        },
                      },
                    },
                    "& .MuiInputLabel-root": {
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "16px",
                      color: "#6b7280",
                      "&.Mui-focused": {
                        color: "#f59e0b",
                      },
                    },
                    "& input": {
                      padding: "14px 16px",
                      fontSize: "16px",
                    },
                  }}
                />
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                sx={{
                  mt: 4,
                  py: 1.75,
                  borderRadius: "14px",
                  background: "#f59e0b",
                  fontSize: "15px",
                  fontWeight: 600,
                  fontFamily: "'Inter', sans-serif",
                  textTransform: "none",
                  boxShadow: "0 0 0 1px rgba(245, 158, 11, 0.1), 0 8px 16px -4px rgba(245, 158, 11, 0.3)",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    background: "#d97706",
                    boxShadow: "0 0 0 1px rgba(245, 158, 11, 0.2), 0 12px 24px -6px rgba(245, 158, 11, 0.4)",
                    transform: "translateY(-1px)",
                  },
                  "&:active": {
                    transform: "translateY(0px)",
                  },
                  "&:disabled": {
                    background: "#fbbf24",
                    color: "white",
                    opacity: 0.7,
                  },
                }}
              >
                {loading ? "Ingresando..." : "Iniciar Sesión"}
              </Button>
            </Box>
          </form>

        </Box>

        <Box className="mt-6 text-center">
          <Typography
            variant="caption"
            sx={{
              color: "#6b7280",
              fontSize: "13px",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            ¿Problemas para acceder? Contacta al administrador
          </Typography>
        </Box>
      </Box>
    </div>
  )
}

export default Login
