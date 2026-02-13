import api from "./api"
import { API_ENDPOINTS } from "../config/api"

const entryService = {
  /**
   * Lista las entradas de un cliente con paginación.
   * @param {number|string} clientId
   * @param {{ page?: number, limit?: number }} params
   * @returns {Promise<{ data: Array, pagination: { page, limit, total, totalPages } }>}
   */
  getEntriesByClient: async (clientId, { page = 1, limit = 10 } = {}) => {
    const response = await api.get(API_ENDPOINTS.ENTRIES_BY_CLIENT(clientId), {
      params: { page, limit },
    })
    const body = response.data
    const data = Array.isArray(body?.data) ? body.data : []
    const pagination = body?.pagination ?? { page: 1, limit: 10, total: 0, totalPages: 0 }
    return { data, pagination }
  },

  /**
   * Registra una entrada (ingreso) del cliente al gimnasio.
   * Requiere membresía activa; aplica cooldown de 30 min entre entradas del mismo cliente.
   * @param {number|string} clientId
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  registerEntry: async (clientId) => {
    const response = await api.post(API_ENDPOINTS.ENTRIES_REGISTER(clientId))
    return response.data
  },
}

export default entryService
