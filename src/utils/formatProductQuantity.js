/**
 * Formatea cantidad de producto según su unidad de medida.
 * - unidad: se muestra como número entero (sin decimales).
 * - kg: se muestra con hasta 3 decimales, eliminando ceros finales.
 */
export function formatQuantity(value, unit = "unidad") {
  const num = Number(value)
  if (Number.isNaN(num)) return "—"
  if (unit === "kg") {
    const fixed = num.toFixed(3).replace(/\.?0+$/, "")
    return fixed === "" ? "0" : fixed
  }
  return String(Math.round(num))
}

/**
 * Formatea cantidad con sufijo de unidad para mostrar (ej: "9 un.", "2.5 kg").
 */
export function formatQuantityWithUnit(value, unit = "unidad") {
  const q = formatQuantity(value, unit)
  const suffix = unit === "kg" ? " kg" : " un."
  return `${q}${suffix}`
}

/**
 * Formatea cantidad de movimiento con signo (+ / -) según unidad.
 */
export function formatMovementQuantity(quantity, unit = "unidad") {
  const num = Number(quantity)
  if (Number.isNaN(num)) return "—"
  const formatted = formatQuantity(Math.abs(num), unit)
  if (num > 0) return `+${formatted}`
  if (num < 0) return `-${formatted}`
  return "0"
}
