import api from "./api"
import { API_ENDPOINTS } from "../config/api"

const productService = {
  getAll: async (params = {}) => {
    const response = await api.get(API_ENDPOINTS.PRODUCTS, { params })
    return response.data
  },

  getAlerts: async (params = {}) => {
    const response = await api.get(API_ENDPOINTS.PRODUCTS_ALERTS, { params })
    return response.data
  },

  getById: async (id) => {
    const response = await api.get(API_ENDPOINTS.PRODUCT_BY_ID(id))
    return response.data
  },

  create: async (data) => {
    const response = await api.post(API_ENDPOINTS.PRODUCTS, data)
    return response.data
  },

  update: async (id, data) => {
    const response = await api.put(API_ENDPOINTS.PRODUCT_BY_ID(id), data)
    return response.data
  },

  delete: async (id) => {
    const response = await api.delete(API_ENDPOINTS.PRODUCT_BY_ID(id))
    return response.data
  },

  getMovementsByProduct: async (productId) => {
    const response = await api.get(API_ENDPOINTS.PRODUCT_MOVEMENTS(productId))
    return response.data
  },

  getAllMovements: async (params = {}) => {
    const response = await api.get(API_ENDPOINTS.PRODUCT_MOVEMENTS_ALL, { params })
    return response.data
  },

  createMovement: async (data) => {
    const response = await api.post(API_ENDPOINTS.PRODUCT_MOVEMENTS_CREATE, data)
    return response.data
  },
}

export default productService
