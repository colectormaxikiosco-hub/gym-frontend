import api from "./api"
import { API_ENDPOINTS } from "../config/api"

const categoryService = {
  getAll: async (params = {}) => {
    const response = await api.get(API_ENDPOINTS.CATEGORIES, { params })
    return response.data
  },

  getById: async (id) => {
    const response = await api.get(API_ENDPOINTS.CATEGORY_BY_ID(id))
    return response.data
  },

  create: async (data) => {
    const response = await api.post(API_ENDPOINTS.CATEGORIES, data)
    return response.data
  },

  update: async (id, data) => {
    const response = await api.put(API_ENDPOINTS.CATEGORY_BY_ID(id), data)
    return response.data
  },

  delete: async (id) => {
    const response = await api.delete(API_ENDPOINTS.CATEGORY_BY_ID(id))
    return response.data
  },
}

export default categoryService
