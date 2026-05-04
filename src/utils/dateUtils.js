/**
 * Devuelve la fecha de hoy en zona local como YYYY-MM-DD (para inputs type="date" y envío al backend).
 */
export function getTodayLocalISO() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

/**
 * Parsea una fecha solo-día (YYYY-MM-DD) como fecha local para evitar que
 * new Date("2026-03-02") se interprete como medianoche UTC y muestre el día anterior en UTC-3.
 * @param {string} dateStr - Fecha en formato YYYY-MM-DD (puede incluir "T..." después)
 * @returns {Date} Fecha en hora local con ese día
 */
/**
 * Convierte una fecha de API (DATE o ISO) a YYYY-MM-DD para inputs type="date".
 * @param {string|Date|null|undefined} dateStr
 * @returns {string} Cadena vacía si no hay valor.
 */
export function toDateInputValue(dateStr) {
  if (dateStr == null || dateStr === "") return ""
  return String(dateStr).trim().split("T")[0]
}

export function parseDateOnly(dateStr) {
  if (!dateStr) return null
  const s = String(dateStr).trim().split("T")[0]
  const parts = s.split("-")
  if (parts.length !== 3) return new Date(dateStr)
  const y = parseInt(parts[0], 10)
  const m = parseInt(parts[1], 10) - 1
  const d = parseInt(parts[2], 10)
  if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) return new Date(dateStr)
  return new Date(y, m, d)
}

/**
 * Parsea un timestamp que puede venir sin zona (ej. "2026-03-02 20:37:56" en UTC desde el servidor).
 * Si no tiene 'Z' ni offset, se asume UTC para que al mostrar en local se vea la hora correcta.
 * @param {string|Date} value
 * @returns {Date}
 */
export function parseTimestamp(value) {
  if (!value) return null
  if (value instanceof Date) return value
  const s = String(value).trim()
  if (s.endsWith("Z") || /[+-]\d{2}:?\d{2}$/.test(s)) return new Date(s)
  const normalized = s.replace(" ", "T")
  return new Date(normalized.length > 10 ? normalized + "Z" : normalized)
}
