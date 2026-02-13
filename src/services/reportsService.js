import api from "./api"
import { API_ENDPOINTS } from "../config/api"

const reportsService = {
  getMembershipReports: async (params = {}) => {
    const response = await api.get(API_ENDPOINTS.REPORTS_MEMBERSHIPS, { params })
    return response.data
  },

  getSalesReports: async (params = {}) => {
    const response = await api.get(API_ENDPOINTS.REPORTS_SALES, { params })
    return response.data
  },
}

export default reportsService
