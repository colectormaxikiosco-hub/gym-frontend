import api from "./api"
import { API_ENDPOINTS } from "../config/api"

const clientService = {
  /** Lista todos los clientes activos (para selects, crear membresía, etc.). Devuelve array (hasta 1000). */
  getAll: async () => {
    const response = await api.get(API_ENDPOINTS.CLIENTS, { params: { page: 1, limit: 1000, active_filter: "active" } })
    const body = response.data
    return Array.isArray(body) ? body : body?.data ?? []
  },

  /** @deprecated Usar getClientsPaginated para la lista con paginación. Devuelve array. */
  getAllClients: async () => {
    const response = await api.get(API_ENDPOINTS.CLIENTS)
    const body = response.data
    return Array.isArray(body) ? body : body?.data ?? []
  },

  /**
   * Lista clientes con paginación (búsqueda y filtro por cuenta corriente / días de membresía).
   * @param {{ page?: number, limit?: number, search?: string, debt_filter?: string, include_active_membership?: boolean, active_filter?: string, days_remaining?: number }} params
   * @returns {{ data: Array, pagination: { page, limit, total, totalPages } }}
   */
  getClientsPaginated: async ({
    page = 1,
    limit = 10,
    search = "",
    debt_filter = "all",
    include_active_membership = false,
    active_filter = "active",
    days_remaining,
    filter_expired = false,
  } = {}) => {
    const queryParams = { page, limit }
    if (search && search.trim()) queryParams.search = search.trim()
    if (debt_filter && debt_filter !== "all") queryParams.debt_filter = debt_filter
    if (include_active_membership) queryParams.include_active_membership = "1"
    if (active_filter && active_filter !== "all") queryParams.active_filter = active_filter
    if (filter_expired) queryParams.filter_expired = "1"
    if (
      days_remaining !== undefined &&
      days_remaining !== null &&
      [0, 1, 2, 3, 4, 5].includes(Number(days_remaining))
    ) {
      queryParams.days_remaining = Number(days_remaining)
    }
    const response = await api.get(API_ENDPOINTS.CLIENTS, { params: queryParams })
    const body = response.data
    const data = Array.isArray(body?.data) ? body.data : []
    const pagination = body?.pagination ?? { page: 1, limit: 10, total: 0, totalPages: 0 }
    return { data, pagination }
  },

  /**
   * Búsqueda rápida para inicio: clientes por nombre o DNI con membresía activa incluida.
   * @param {{ search: string, limit?: number }} params
   * @returns {{ data: Array, pagination: Object }}
   */
  quickSearch: async ({ search = "", limit = 15 } = {}) => {
    const queryParams = { page: 1, limit, include_active_membership: "1", active_filter: "active" }
    if (search && search.trim()) queryParams.search = search.trim()
    const response = await api.get(API_ENDPOINTS.CLIENTS, { params: queryParams })
    const body = response.data
    const data = Array.isArray(body?.data) ? body.data : []
    const pagination = body?.pagination ?? { page: 1, limit, total: 0, totalPages: 0 }
    return { data, pagination }
  },

  getClientById: async (id) => {
    const response = await api.get(`${API_ENDPOINTS.CLIENTS}/${id}`)
    return response.data
  },

  createClient: async (clientData) => {
    const response = await api.post(API_ENDPOINTS.CLIENTS, clientData)
    return response.data
  },

  updateClient: async (id, clientData) => {
    const response = await api.put(`${API_ENDPOINTS.CLIENTS}/${id}`, clientData)
    return response.data
  },

  deleteClient: async (id) => {
    const response = await api.delete(`${API_ENDPOINTS.CLIENTS}/${id}`)
    return response.data
  },

  getMyProfile: async () => {
    const response = await api.get(API_ENDPOINTS.CLIENT_PROFILE)
    return response.data
  },

  updateMyProfile: async (profileData) => {
    const response = await api.put(API_ENDPOINTS.CLIENT_PROFILE, profileData)
    return response.data
  },

  changePassword: async (currentPassword, newPassword) => {
    const response = await api.post(API_ENDPOINTS.CLIENT_CHANGE_PASSWORD, {
      currentPassword,
      newPassword,
    })
    return response.data
  },
}

export default clientService
