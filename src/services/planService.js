import api from "./api"
import { API_ENDPOINTS } from "../config/api"

const planService = {
  getAll: async () => {
    const response = await api.get(API_ENDPOINTS.PLANS)
    return response.data
  },

  getById: async (id) => {
    const response = await api.get(`${API_ENDPOINTS.PLANS}/${id}`)
    return response.data
  },

  create: async (planData) => {
    const response = await api.post(API_ENDPOINTS.PLANS, planData)
    return response.data
  },

  update: async (id, planData) => {
    const response = await api.put(`${API_ENDPOINTS.PLANS}/${id}`, planData)
    return response.data
  },

  delete: async (id) => {
    const response = await api.delete(`${API_ENDPOINTS.PLANS}/${id}`)
    return response.data
  },

  toggleStatus: async (id) => {
    const response = await api.patch(`${API_ENDPOINTS.PLANS}/${id}/toggle-status`)
    return response.data
  },
}

export default planService
