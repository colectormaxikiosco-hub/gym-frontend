/**
 * Formatea la duración de un plan para mostrar en UI.
 * @param {{ duration_days?: number | null, duration_hours?: number | null }} plan
 * @returns {string} Ej: "30 días", "1 día", "5 horas", "1 hora"
 */
export function formatPlanDuration(plan) {
  if (!plan) return "—"
  const hours = Number(plan.duration_hours)
  const days = Number(plan.duration_days)
  if (!Number.isNaN(hours) && hours > 0) {
    return hours === 1 ? "1 hora" : `${hours} horas`
  }
  if (!Number.isNaN(days) && days >= 0) {
    return days === 1 ? "1 día" : `${days} días`
  }
  return "—"
}

/**
 * Formatea el tiempo restante de una membresía activa (por días o por minutos/horas).
 * @param {{ days_remaining?: number | null, minutes_remaining?: number | null, ends_at?: string | null, plan_duration_hours?: number | null }} membership
 * @returns {{ label: string, shortLabel?: string }} label para badge, shortLabel opcional (ej. "2h 30m")
 */
export function formatMembershipTimeRemaining(membership) {
  if (!membership) return { label: "Activa" }
  const minutesRem = membership.minutes_remaining
  const daysRem = membership.days_remaining
  const hasHours = membership.plan_duration_hours != null && Number(membership.plan_duration_hours) > 0

  if (hasHours && typeof minutesRem === "number") {
    if (minutesRem <= 0) return { label: "Vence ahora", shortLabel: "0m" }
    if (minutesRem < 60) return { label: `${minutesRem} min restantes`, shortLabel: `${minutesRem}m` }
    const h = Math.floor(minutesRem / 60)
    const m = minutesRem % 60
    const shortLabel = m > 0 ? `${h}h ${m}m` : `${h}h`
    if (h < 1) return { label: `${minutesRem} min restantes`, shortLabel }
    return { label: m > 0 ? `${h}h ${m}m restantes` : (h === 1 ? "1 hora restante" : `${h} horas restantes`), shortLabel }
  }

  if (typeof daysRem === "number") {
    if (daysRem === 0) return { label: "Vence hoy" }
    if (daysRem === 1) return { label: "1 día restante" }
    if (daysRem > 1) return { label: `${daysRem} días restantes` }
  }
  return { label: "Activa" }
}

/**
 * Formatea la duración del plan en el contexto de una membresía (usa plan_duration y plan_duration_hours).
 * @param {{ plan_duration?: number | null, plan_duration_hours?: number | null }} membership
 * @returns {string}
 */
export function formatMembershipPlanDuration(membership) {
  if (!membership) return "—"
  const hours = Number(membership.plan_duration_hours)
  const days = Number(membership.plan_duration)
  if (!Number.isNaN(hours) && hours > 0) return hours === 1 ? "1 hora" : `${hours} horas`
  if (!Number.isNaN(days) && days >= 0) return days === 1 ? "1 día" : `${days} días`
  return "—"
}
