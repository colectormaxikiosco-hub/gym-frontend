"use client"

import { createContext, useState, useContext, useEffect } from "react"
import authService from "../services/authService"

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar si hay un token guardado y validarlo
    const initAuth = async () => {
      const token = authService.getToken()
      const savedUser = authService.getCurrentUser()

      if (token && savedUser) {
        // Verificar que el token siga siendo válido
        const result = await authService.verifyToken()
        if (result.success) {
          setUser(result.user)
        } else if (result.cancelled) {
          // Petición cancelada (ej. Strict Mode): no hacer logout, restaurar usuario desde storage
          setUser(savedUser)
        } else {
          // Token inválido o expirado, limpiar datos
          authService.logout()
        }
      }
      setLoading(false)
    }

    initAuth()
  }, [])

  const login = async (username, password) => {
    try {
      const result = await authService.login(username, password)
      if (result.success) {
        setUser(result.user)
        return { success: true, user: result.user }
      }
      throw new Error("Error en el login")
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    authService.logout()
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider")
  }
  return context
}
