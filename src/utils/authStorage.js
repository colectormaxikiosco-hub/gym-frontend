/**
 * Sesión de autenticación en sessionStorage (aislada por pestaña del navegador).
 *
 * localStorage es compartido entre todas las pestañas del mismo origen: si dos usuarios
 * inician sesión en distintas pestañas en la misma PC, el último login pisa el token
 * y al refrescar cualquier pestaña se “cambia” de usuario. sessionStorage evita eso.
 *
 * Migración única: si existía token en localStorage (versiones anteriores), se copia
 * a sessionStorage y se limpia localStorage.
 */

const TOKEN_KEY = "gymToken"
const USER_KEY = "gymUser"

function migrateLegacyLocalStorageOnce() {
  if (typeof window === "undefined") return
  try {
    if (sessionStorage.getItem(TOKEN_KEY)) return
    const legacyToken = localStorage.getItem(TOKEN_KEY)
    const legacyUser = localStorage.getItem(USER_KEY)
    if (legacyToken) {
      sessionStorage.setItem(TOKEN_KEY, legacyToken)
      if (legacyUser) sessionStorage.setItem(USER_KEY, legacyUser)
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    }
  } catch {
    // sessionStorage puede fallar en modo privado / cuota
  }
}

export function getToken() {
  migrateLegacyLocalStorageOnce()
  try {
    return sessionStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function getCurrentUser() {
  migrateLegacyLocalStorageOnce()
  try {
    const userStr = sessionStorage.getItem(USER_KEY)
    return userStr ? JSON.parse(userStr) : null
  } catch {
    return null
  }
}

export function setAuth(token, user) {
  if (typeof window === "undefined") return
  try {
    sessionStorage.setItem(TOKEN_KEY, token)
    sessionStorage.setItem(USER_KEY, JSON.stringify(user))
  } catch {
    // ignore
  }
}

/** Actualiza solo el objeto usuario (mismo token), p. ej. tras editar perfil o verify */
export function setStoredUser(user) {
  if (typeof window === "undefined") return
  try {
    sessionStorage.setItem(USER_KEY, JSON.stringify(user))
  } catch {
    // ignore
  }
}

export function clearAuth() {
  if (typeof window === "undefined") return
  try {
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(USER_KEY)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  } catch {
    // ignore
  }
}
