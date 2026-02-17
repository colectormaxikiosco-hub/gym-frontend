import axios from "axios"

const api = axios.create({
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
})

const pendingRequests = new Map()

const generateRequestKey = (config) => {
  return `${config.method}-${config.url}-${JSON.stringify(config.params || {})}`
}

// Interceptor para agregar token y prevenir duplicados
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("gymToken")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // No cancelar peticiones duplicadas en verify: al refrescar, React Strict Mode
    // puede ejecutar initAuth dos veces; si cancelamos la segunda, se interpreta
    // como token inválido y se hace logout, perdiendo la sesión.
    const isVerifyRequest = config.url?.includes("auth/verify")
    if (isVerifyRequest) {
      return config
    }

    const requestKey = generateRequestKey(config)

    if (pendingRequests.has(requestKey)) {
      // Si ya hay una petición en curso con la misma clave, cancelar esta
      const source = axios.CancelToken.source()
      config.cancelToken = source.token
      source.cancel(`Petición duplicada cancelada: ${requestKey}`)
    } else {
      // Registrar esta petición como en curso
      const source = axios.CancelToken.source()
      config.cancelToken = source.token
      pendingRequests.set(requestKey, source)
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Interceptor para manejar respuestas y limpiar peticiones pendientes
api.interceptors.response.use(
  (response) => {
    const requestKey = generateRequestKey(response.config)
    pendingRequests.delete(requestKey)
    return response
  },
  (error) => {
    if (error.config) {
      const requestKey = generateRequestKey(error.config)
      pendingRequests.delete(requestKey)
    }

    // No mostrar error si fue cancelada por ser duplicada
    if (axios.isCancel(error)) {
      return Promise.reject({ cancelled: true, message: error.message })
    }

    if (error.response?.status === 401) {
      const isLoginRequest = error.config?.url?.includes("auth/login")
      if (!isLoginRequest) {
        localStorage.removeItem("gymToken")
        localStorage.removeItem("gymUser")
        window.location.href = "/login"
      }
    }

    if (error.response?.status === 429) {
      console.warn("Rate limit alcanzado. Reintentando en unos segundos...")
      return Promise.reject({
        ...error,
        response: {
          ...error.response,
          data: { ...error.response?.data, message: "Demasiadas peticiones. Por favor, espera un momento e intenta de nuevo." },
        },
      })
    }

    // Fallo de red o timeout: sin response del servidor
    if (!error.response) {
      const message = error.code === "ECONNABORTED"
        ? "La solicitud tardó demasiado. Revisá tu conexión e intentá de nuevo."
        : "Error de conexión. Revisá tu red e intentá de nuevo."
      return Promise.reject({
        ...error,
        response: { data: { message } },
      })
    }

    // 403: asegurar mensaje por defecto si falta o está vacío
    if (error.response.status === 403) {
      const msg = (error.response.data?.message && String(error.response.data.message).trim()) || "No tenés permisos para esta acción."
      return Promise.reject({
        ...error,
        response: {
          ...error.response,
          data: { ...error.response.data, message: msg },
        },
      })
    }

    return Promise.reject(error)
  },
)

export default api
