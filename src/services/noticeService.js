import api from "./api"
import { API_ENDPOINTS } from "../config/api"

const noticeService = {
  getAllNotices: async () => {
    const response = await api.get(API_ENDPOINTS.NOTICES)
    return response.data
  },

  getNoticeById: async (id) => {
    const response = await api.get(`${API_ENDPOINTS.NOTICES}/${id}`)
    return response.data
  },

  createNotice: async (noticeData) => {
    const response = await api.post(API_ENDPOINTS.NOTICES, noticeData)
    return response.data
  },

  updateNotice: async (id, noticeData) => {
    const response = await api.put(`${API_ENDPOINTS.NOTICES}/${id}`, noticeData)
    return response.data
  },

  deleteNotice: async (id) => {
    const response = await api.delete(`${API_ENDPOINTS.NOTICES}/${id}`)
    return response.data
  },
}

export default noticeService
