/**
 * Normaliza un número de teléfono de Argentina para enlaces wa.me (sin +).
 * Argentina: 54, móviles con 9 (54 9 XXX XXXXXXX).
 * @param {string} input - Número tal como lo ingresó el usuario
 * @returns {string|null} - Número para wa.me (ej: 5493811234567) o null si no es válido
 */
export function normalizePhoneForWhatsApp(input) {
  if (input == null || typeof input !== "string") return null
  const digits = input.replace(/\D/g, "")
  if (digits.length < 10) return null

  let normalized = digits

  if (normalized.startsWith("54")) {
    if (normalized.length === 12 && normalized.charAt(2) !== "9") {
      normalized = "54" + "9" + normalized.slice(2)
    }
    return normalized.length >= 12 ? normalized : null
  }

  if (normalized.length === 11 && normalized.startsWith("15")) {
    return "549" + normalized.slice(2)
  }

  if (normalized.length === 10) {
    return "549" + normalized
  }

  return null
}

const WELCOME_SITE_URL = "www.lifefitnesstrancas.com"

/**
 * Arma el mensaje de bienvenida con credenciales para enviar por WhatsApp.
 */
export function getWelcomeMessageWhatsApp(username, password) {
  return [
    "¡Bienvenido/a a Life Fitness!",
    "",
    "Tus credenciales de ingreso son:",
    `Usuario: ${username}`,
    `Contraseña: ${password}`,
    "",
    `Ingresá a ${WELCOME_SITE_URL} para ver tu estado de membresía, avisos y más.`,
    "",
    "Podés cambiar tu contraseña en la sección Perfil una vez que ingreses.",
    "",
    "— Life Fitness",
  ].join("\n")
}

/**
 * Devuelve la URL de WhatsApp Web para abrir chat con número y mensaje prefijado.
 * @param {string} phone - Teléfono normalizado (ej: 5493811234567)
 * @param {string} message - Mensaje ya armado
 */
export function getWhatsAppWebUrl(phone, message) {
  const base = `https://wa.me/${phone}`
  if (!message || !message.trim()) return base
  return `${base}?text=${encodeURIComponent(message)}`
}

/** Días en los que se muestra el botón de recordatorio (5, 4, 3, 2, 1 y 0 = vence hoy). */
export const MEMBERSHIP_REMINDER_DAYS = [5, 4, 3, 2, 1, 0]

/** Duración mínima del plan (días) para mostrar recordatorios; planes diarios (≤5) no aplican. */
export const MIN_PLAN_DAYS_FOR_REMINDER = 5

/**
 * Parsea reminder_sent_days (ej. "5,3" o "5,3,1") a array de números.
 * @param {string} [raw]
 * @returns {number[]}
 */
export function getReminderSentDaysArray(raw) {
  if (!raw || typeof raw !== "string") return []
  return raw
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !Number.isNaN(n))
}

/**
 * Indica si el cliente debe ver el botón de recordatorio:
 * - Plan con duración > 5 días (excluye planes diarios).
 * - Le quedan 5, 4, 3, 2, 1 días o vence hoy (0).
 * - Aún no se envió el recordatorio para ese día (un mensaje por día).
 * @param {{ active_membership?: { days_remaining?: number, duration_days?: number, reminder_sent_days?: string } | null, phone?: string }} client
 * @returns {boolean}
 */
export function canSendMembershipReminder(client) {
  const m = client?.active_membership
  if (!m) return false
  const durationDays = Number(m.duration_days)
  if (durationDays <= MIN_PLAN_DAYS_FOR_REMINDER) return false
  const days = m.days_remaining
  if (days === undefined || days === null) return false
  const daysNum = Number(days)
  if (!MEMBERSHIP_REMINDER_DAYS.includes(daysNum)) return false
  const sent = getReminderSentDaysArray(m.reminder_sent_days)
  if (sent.includes(daysNum)) return false
  return Boolean(client?.phone?.toString?.()?.trim?.())
}

/**
 * Mensaje de recordatorio de vencimiento de membresía para WhatsApp.
 * @param {number} daysRemaining - 0 (vence hoy), 1, 2, 3, 4 o 5
 */
export function getMembershipReminderMessage(daysRemaining) {
  const dayText =
    daysRemaining === 0 ? "hoy" : daysRemaining === 1 ? "1 día" : `${daysRemaining} días`
  const text =
    daysRemaining === 0
      ? "Hola! Te recordamos que tu membresía en Life Fitness vence hoy."
      : "Hola! Te recordamos que tu membresía en Life Fitness vence en " + dayText + "."
  return [text, "", "Te esperamos para renovar.", "", "— Life Fitness"].join("\n")
}

/**
 * Estilos de fila según membresía: verde (activa), naranja (5-2 días), rojo (1 o vence hoy), rojo oscuro (vencida).
 * @param {{ active_membership?: { days_remaining?: number, duration_days?: number } | null, expired_membership?: { end_date?: string, status?: string } | null }} client
 * @returns {{ backgroundColor: string, borderLeft: string, "&:hover": { backgroundColor: string } }}
 */
export function getMembershipRowStyle(client) {
  const expired = client?.expired_membership
  if (!client?.active_membership && expired) {
    return {
      backgroundColor: "#fecaca",
      borderLeft: "3px solid #b91c1c",
      "&:hover": { backgroundColor: "#fca5a5" },
    }
  }

  const m = client?.active_membership
  if (!m) {
    return {
      backgroundColor: "inherit",
      borderLeft: "3px solid transparent",
      "&:hover": { backgroundColor: "#fafafa" },
    }
  }
  const durationDays = Number(m.duration_days)
  const days = Number(m.days_remaining)

  // Plan con más de 5 días: naranja a 5, 4, 3 y 2 días; rojo a 1 día o vence hoy (0)
  if (durationDays > MIN_PLAN_DAYS_FOR_REMINDER) {
    if (days === 1 || days === 0) {
      return {
        backgroundColor: "#fef2f2",
        borderLeft: "3px solid #dc2626",
        "&:hover": { backgroundColor: "#fee2e2" },
      }
    }
    if ([2, 3, 4, 5].includes(days)) {
      return {
        backgroundColor: "#fff7ed",
        borderLeft: "3px solid #ea580c",
        "&:hover": { backgroundColor: "#ffedd5" },
      }
    }
  }

  // Verde: membresía activa (planes cortos o aún con muchos días)
  return {
    backgroundColor: "#f0fdf4",
    borderLeft: "3px solid #16a34a",
    "&:hover": { backgroundColor: "#dcfce7" },
  }
}
