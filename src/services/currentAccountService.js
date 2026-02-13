import api from "./api"
import { API_ENDPOINTS } from "../config/api"

const currentAccountService = {
  getClientAccount: (clientId) => {
    const url = API_ENDPOINTS.CURRENT_ACCOUNT_CLIENT.replace(":clientId", clientId)
    return api.get(url)
  },

  registerPayment: (clientId, paymentData) => {
    const url = API_ENDPOINTS.CURRENT_ACCOUNT_PAYMENT.replace(":clientId", clientId)
    return api.post(url, paymentData)
  },

  getSummary: () => {
    return api.get(API_ENDPOINTS.CURRENT_ACCOUNT_SUMMARY)
  },
}

export default currentAccountService
