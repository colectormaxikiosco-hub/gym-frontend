import api from "./api"
import { API_ENDPOINTS } from "../config/api"

const instructorService = {
  getAll: async () => {
    const response = await api.get(API_ENDPOINTS.INSTRUCTORS)
    return response.data
  },

  getById: async (id) => {
    const response = await api.get(`${API_ENDPOINTS.INSTRUCTORS}/${id}`)
    return response.data
  },

  create: async (data) => {
    const response = await api.post(API_ENDPOINTS.INSTRUCTORS, data)
    return response.data
  },

  update: async (id, data) => {
    const response = await api.put(`${API_ENDPOINTS.INSTRUCTORS}/${id}`, data)
    return response.data
  },

  delete: async (id) => {
    const response = await api.delete(`${API_ENDPOINTS.INSTRUCTORS}/${id}`)
    return response.data
  },
}

export default instructorService
