import api from "./api"
import { API_ENDPOINTS } from "../config/api"

const authService = {
  login: async (username, password) => {
    try {
      const response = await api.post(API_ENDPOINTS.LOGIN, {
        username,
        password,
      })

      if (response.data.success) {
        const { token, user } = response.data.data
        localStorage.setItem("gymToken", token)
        localStorage.setItem("gymUser", JSON.stringify(user))
        return { success: true, user }
      }

      return { success: false, message: "Error en el login" }
    } catch (error) {
      if (error.cancelled) {
        throw new Error("Petición duplicada")
      }

      let message = "Error de conexión con el servidor"

      if (error.code === "ECONNREFUSED" || error.code === "ERR_NETWORK") {
        message = "No se puede conectar al servidor"
        console.error("Backend no disponible")
      } else if (error.code === "ECONNABORTED") {
        message = "Tiempo de espera agotado"
      } else if (error.response) {
        message = error.response.data?.message || "Error en el servidor"
      }

      throw new Error(message)
    }
  },

  verifyToken: async () => {
    try {
      const response = await api.get(API_ENDPOINTS.VERIFY_TOKEN)
      if (response.data.success) {
        return { success: true, user: response.data.data.user }
      }
      return { success: false }
    } catch (error) {
      // Cancelación (ej. petición duplicada) no significa token inválido
      if (error.cancelled) {
        return { cancelled: true }
      }
      return { success: false }
    }
  },

  logout: () => {
    localStorage.removeItem("gymToken")
    localStorage.removeItem("gymUser")
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem("gymUser")
    return userStr ? JSON.parse(userStr) : null
  },

  getToken: () => {
    return localStorage.getItem("gymToken")
  },
}

export default authService
