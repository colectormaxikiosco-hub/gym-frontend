import api from "./api"
import { API_ENDPOINTS } from "../config/api"

const saleService = {
  getAll: async (params = {}) => {
    const response = await api.get(API_ENDPOINTS.SALES, { params })
    const body = response.data
    return {
      data: Array.isArray(body?.data) ? body.data : [],
      pagination: body?.pagination ?? { page: 1, limit: 10, total: 0, totalPages: 0 },
    }
  },

  getById: async (id) => {
    const response = await api.get(API_ENDPOINTS.SALE_BY_ID(id))
    return response.data
  },

  create: async (payload) => {
    const response = await api.post(API_ENDPOINTS.SALES, payload)
    return response.data
  },

  cancel: async (id) => {
    const response = await api.patch(`${API_ENDPOINTS.SALES}/${id}/cancel`)
    return response.data
  },
}

export default saleService
