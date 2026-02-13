import api from "./api"
import { API_ENDPOINTS } from "../config/api"

const cashService = {
  getActiveSession: async () => {
    const response = await api.get(API_ENDPOINTS.CASH_ACTIVE)
    return response.data
  },

  openSession: async (data) => {
    const response = await api.post(API_ENDPOINTS.CASH_OPEN, data)
    return response.data
  },

  closeSession: async (sessionId, data) => {
    const response = await api.patch(API_ENDPOINTS.CASH_CLOSE.replace(":id", sessionId), data)
    return response.data
  },

  registerMovement: async (data) => {
    const response = await api.post(API_ENDPOINTS.CASH_MOVEMENTS, data)
    return response.data
  },

  getHistory: async () => {
    const response = await api.get(API_ENDPOINTS.CASH_SESSIONS)
    return response.data
  },

  getSessionDetail: async (sessionId) => {
    const url = API_ENDPOINTS.CASH_SESSION_DETAIL.replace(":id", String(sessionId))
    const response = await api.get(url)
    return response
  },

  getCurrentSession: async () => {
    const response = await api.get(API_ENDPOINTS.CASH_ACTIVE)
    return response.data
  },

  getIncomeBreakdown: async () => {
    const response = await api.get(API_ENDPOINTS.CASH_INCOME_BREAKDOWN)
    return response.data
  },
}

export default cashService
