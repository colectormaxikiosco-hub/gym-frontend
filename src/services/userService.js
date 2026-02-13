import api from "./api"
import { API_ENDPOINTS } from "../config/api"

const userService = {
  getProfile: async () => {
    const response = await api.get(API_ENDPOINTS.PROFILE)
    return response.data
  },

  updateProfile: async (data) => {
    const response = await api.put(API_ENDPOINTS.PROFILE, data)
    return response.data
  },

  changePassword: async (currentPassword, newPassword) => {
    const response = await api.post(API_ENDPOINTS.CHANGE_PASSWORD, {
      currentPassword,
      newPassword,
    })
    return response.data
  },

  getAllUsers: async () => {
    const response = await api.get(API_ENDPOINTS.USERS)
    return response.data
  },

  createUser: async (userData) => {
    const response = await api.post(API_ENDPOINTS.USERS, userData)
    return response.data
  },

  updateUser: async (id, userData) => {
    const response = await api.put(`${API_ENDPOINTS.USERS}/${id}`, userData)
    return response.data
  },

  deleteUser: async (id) => {
    const response = await api.delete(`${API_ENDPOINTS.USERS}/${id}`)
    return response.data
  },
}

export default userService
