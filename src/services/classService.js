import api from "./api"
import { API_ENDPOINTS } from "../config/api"

const classService = {
  getAllClasses: async () => {
    const response = await api.get(API_ENDPOINTS.CLASSES)
    return response.data
  },

  getClassById: async (id) => {
    const response = await api.get(`${API_ENDPOINTS.CLASSES}/${id}`)
    return response.data
  },

  createClass: async (classData) => {
    const response = await api.post(API_ENDPOINTS.CLASSES, classData)
    return response.data
  },

  updateClass: async (id, classData) => {
    const response = await api.put(`${API_ENDPOINTS.CLASSES}/${id}`, classData)
    return response.data
  },

  deleteClass: async (id) => {
    const response = await api.delete(`${API_ENDPOINTS.CLASSES}/${id}`)
    return response.data
  },
}

export default classService
