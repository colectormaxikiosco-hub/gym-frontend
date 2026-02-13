import api from "./api"
import { API_ENDPOINTS } from "../config/api"

const membershipService = {
  /**
   * Lista todas las membresías (sin paginación). Para listado paginado usar getMembershipsPaginated.
   * @param {string} [search]
   * @param {string} [planId]
   * @param {string} [status]
   * @returns {Promise<{ success: boolean, data: Array, pagination?: Object }>}
   */
  getAll: async (search = "", planId = "", status = "") => {
    const params = new URLSearchParams()
    if (search) params.append("search", search)
    if (planId) params.append("plan_id", planId)
    if (status) params.append("status", status)

    const response = await api.get(`${API_ENDPOINTS.MEMBERSHIPS}?${params.toString()}`)
    return response.data
  },

  /**
   * Lista membresías con paginación (búsqueda y filtros).
   * @param {{ page?: number, limit?: number, search?: string, plan_id?: string, status?: string }} params
   * @returns {Promise<{ data: Array, pagination: { page, limit, total, totalPages } }>}
   */
  getMembershipsPaginated: async ({
    page = 1,
    limit = 10,
    search = "",
    plan_id = "",
    status = "",
  } = {}) => {
    const queryParams = { page, limit }
    if (search && search.trim()) queryParams.search = search.trim()
    if (plan_id) queryParams.plan_id = plan_id
    if (status && status.trim()) queryParams.status = status.trim()

    const response = await api.get(API_ENDPOINTS.MEMBERSHIPS, { params: queryParams })
    const body = response.data
    const data = Array.isArray(body?.data) ? body.data : []
    const pagination = body?.pagination ?? { page: 1, limit: 10, total: 0, totalPages: 0 }
    return { data, pagination }
  },

  getActive: async () => {
    const response = await api.get(`${API_ENDPOINTS.MEMBERSHIPS}/active`)
    return response.data
  },

  /** Membresía activa de un cliente (para portal o inicio). */
  getClientActiveMembership: async (clientId) => {
    const response = await api.get(
      `${API_ENDPOINTS.MEMBERSHIPS}/client/${clientId}/active`,
    )
    return response.data
  },

  getById: async (id) => {
    const response = await api.get(`${API_ENDPOINTS.MEMBERSHIPS}/${id}`)
    return response.data
  },

  create: async (membershipData) => {
    const response = await api.post(API_ENDPOINTS.MEMBERSHIPS, membershipData)
    return response.data
  },

  cancel: async (id) => {
    const response = await api.patch(`${API_ENDPOINTS.MEMBERSHIPS}/${id}/cancel`)
    return response.data
  },

  /**
   * Registra que se envió el recordatorio por WhatsApp para esta membresía (5, 3 o 1 días restantes).
   * @param {number} membershipId
   * @param {number} daysRemaining - 1, 3 o 5
   */
  recordReminder: async (membershipId, daysRemaining) => {
    const response = await api.post(
      `${API_ENDPOINTS.MEMBERSHIPS}/${membershipId}/record-reminder`,
      { days_remaining: daysRemaining },
    )
    return response.data
  },
}

export default membershipService
