"use client"

import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import {
  Box,
  Typography,
  Button,
  IconButton,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from "@mui/material"
import {
  ArrowBack,
  BarChart,
  ShoppingCart,
  TrendingUp,
  Payment,
  Person,
  Print,
  Inventory2,
} from "@mui/icons-material"
import reportsService from "../services/reportsService"

const formatMonth = (ym) => {
  if (!ym) return ""
  const [y, m] = String(ym).split("-")
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
  return `${months[Number(m) - 1]} ${y}`
}

const formatNumber = (n) => {
  const num = Number(n)
  if (Number.isNaN(num)) return "0"
  return num.toLocaleString("es-AR")
}

const formatCurrency = (n) => {
  const num = Number(n)
  if (Number.isNaN(num)) return "$ 0"
  return num.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function getDatePresetRange(preset) {
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  const start = new Date(today)
  start.setHours(0, 0, 0, 0)
  const toStr = (d) => d.toISOString().slice(0, 10)
  switch (preset) {
    case "today":
      return { dateFrom: toStr(start), dateTo: toStr(today) }
    case "week":
      start.setDate(start.getDate() - 6)
      return { dateFrom: toStr(start), dateTo: toStr(today) }
    case "month":
      start.setMonth(start.getMonth() - 1)
      start.setDate(1)
      return { dateFrom: toStr(start), dateTo: toStr(today) }
    case "quarter":
      start.setMonth(start.getMonth() - 3)
      return { dateFrom: toStr(start), dateTo: toStr(today) }
    case "year":
      start.setFullYear(start.getFullYear() - 1)
      start.setMonth(start.getMonth())
      start.setDate(start.getDate() + 1)
      return { dateFrom: toStr(start), dateTo: toStr(today) }
    default:
      return {}
  }
}

const PAYMENT_LABELS = { cash: "Efectivo", transfer: "Transferencia", credit_card: "Tarjeta" }

function SummaryCard({ title, value, icon: Icon, color, bg, isCurrency }) {
  const display = isCurrency ? formatCurrency(value) : formatNumber(value)
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: "12px",
        border: "1px solid #e5e7eb",
        backgroundColor: "#fff",
        display: "flex",
        alignItems: "center",
        gap: 2,
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: "12px",
          bgcolor: bg || "#f3f4f6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon sx={{ fontSize: 24, color: color || "#6b7280" }} />
      </Box>
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
          {title}
        </Typography>
        <Typography variant="h6" fontWeight={700} sx={{ color: color || "#111827" }}>
          {display}
        </Typography>
      </Box>
    </Box>
  )
}

function RankList({
  title,
  icon,
  items,
  nameKey,
  countKey,
  maxItems = 10,
  barColor,
  secondaryKey,
  secondaryFormat,
}) {
  const max = items.length > 0 ? Math.max(...items.map((i) => Number(i[countKey]) || 0), 1) : 1
  return (
    <Box
      sx={{
        backgroundColor: "#fff",
        borderRadius: "12px",
        border: "1px solid #e5e7eb",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: "1px solid #f3f4f6",
          display: "flex",
          alignItems: "center",
          gap: 1,
          backgroundColor: "#fafafa",
        }}
      >
        {icon}
        <Typography variant="subtitle2" fontWeight={700} color="text.primary">
          {title}
        </Typography>
      </Box>
      <Box sx={{ p: 2 }}>
        {items.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Sin datos
          </Typography>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {items.slice(0, maxItems).map((item, index) => {
              const count = Number(item[countKey]) || 0
              const pct = (count / max) * 100
              const secondary = secondaryKey ? item[secondaryKey] : null
              return (
                <Box key={(item[nameKey] || index) + index}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                    <Typography variant="body2" fontWeight={500}>
                      {item[nameKey] || "-"}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                      <Typography variant="body2" fontWeight={700} sx={{ color: barColor || "#d97706" }}>
                        {formatNumber(count)}
                      </Typography>
                      {secondary != null && secondary !== "" && (
                        <Typography variant="caption" color="text.secondary">
                          {secondaryFormat === "currency" ? formatCurrency(secondary) : formatNumber(secondary)}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: "#f3f4f6",
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      sx={{
                        height: "100%",
                        width: `${pct}%`,
                        backgroundColor: barColor || "#d97706",
                        borderRadius: 4,
                        minWidth: count > 0 ? 4 : 0,
                      }}
                    />
                  </Box>
                </Box>
              )
            })}
          </Box>
        )}
      </Box>
    </Box>
  )
}

function SimpleBarChart({ title, data, dataKey, valueKey, color, valueFormat }) {
  const max = data.length > 0 ? Math.max(...data.map((d) => Number(d[valueKey]) || 0), 1) : 1
  const formatVal = valueFormat === "currency" ? formatCurrency : formatNumber
  return (
    <Box
      sx={{
        backgroundColor: "#fff",
        borderRadius: "12px",
        border: "1px solid #e5e7eb",
        overflow: "hidden",
      }}
    >
      <Box sx={{ px: 2, py: 1.5, borderBottom: "1px solid #f3f4f6", backgroundColor: "#fafafa" }}>
        <Typography variant="subtitle2" fontWeight={700} color="text.primary">
          {title}
        </Typography>
      </Box>
      <Box sx={{ p: 2 }}>
        {data.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Sin datos
          </Typography>
        ) : (
          <Box sx={{ display: "flex", alignItems: "flex-end", gap: 0.5, height: 120 }}>
            {data.map((d, i) => {
              const val = Number(d[valueKey]) || 0
              const h = (val / max) * 100
              return (
                <Box
                  key={(d[dataKey] || i) + i}
                  sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="caption" sx={{ color: "#6b7280", mb: 0.5, fontSize: "0.65rem" }}>
                    {formatVal(val)}
                  </Typography>
                  <Box
                    sx={{
                      width: "100%",
                      height: `${h}%`,
                      minHeight: val > 0 ? 8 : 0,
                      backgroundColor: color || "#d97706",
                      borderRadius: "6px 6px 0 0",
                    }}
                  />
                  <Typography variant="caption" sx={{ color: "#6b7280", mt: 0.5, fontSize: "0.65rem" }}>
                    {formatMonth(d[dataKey])}
                  </Typography>
                </Box>
              )
            })}
          </Box>
        )}
      </Box>
    </Box>
  )
}

export default function SalesReports() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    payment_method: "",
    status: "completed",
  })

  const loadReports = useCallback(async (overrideFilters) => {
    const f = overrideFilters !== undefined ? overrideFilters : filters
    try {
      setLoading(true)
      const params = { status: f.status }
      if (f.dateFrom) params.dateFrom = f.dateFrom
      if (f.dateTo) params.dateTo = f.dateTo
      if (f.payment_method) params.payment_method = f.payment_method
      const response = await reportsService.getSalesReports(params)
      const payload = response?.data ?? response
      setData(payload)
    } catch (err) {
      console.error("Error loading sales reports:", err)
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    loadReports()
  }, [])

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
  }

  const handleApplyFilters = () => loadReports()

  const handleClearFilters = () => {
    const empty = { dateFrom: "", dateTo: "", payment_method: "", status: "completed" }
    setFilters(empty)
    loadReports(empty)
  }

  const handlePreset = (preset) => {
    const range = getDatePresetRange(preset)
    setFilters((prev) => ({ ...prev, ...range }))
    loadReports({ ...filters, ...range })
  }

  const handlePrint = () => window.print()

  const hasNoData =
    data &&
    (data.summary?.total_sales ?? 0) === 0 &&
    (data.by_product?.length ?? 0) === 0 &&
    (data.by_payment_method?.length ?? 0) === 0 &&
    (data.by_client?.length ?? 0) === 0

  const statusLabel = (s) => (s === "completed" ? "Completadas" : s === "cancelled" ? "Canceladas" : s)

  return (
    <Box className="min-h-screen bg-gradient-to-br from-gray-50 via-amber-50/20 to-gray-50">
      <Box className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
        <Box
          className="no-print"
          sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2, mb: 4 }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton
              onClick={() => navigate("/ventas")}
              size="small"
              sx={{
                color: "#78716c",
                backgroundColor: "#f5f5f4",
                "&:hover": { backgroundColor: "#e7e5e4", color: "#d97706" },
              }}
              aria-label="Volver a Ventas"
            >
              <ArrowBack fontSize="small" />
            </IconButton>
            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: "#111827",
                  letterSpacing: "-0.02em",
                  fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" },
                }}
              >
                Reportes de Ventas
              </Typography>
              <Typography variant="body1" sx={{ color: "#6b7280", fontWeight: 500, mt: 0.5 }}>
                Productos más vendidos, por método de pago, clientes e ingresos
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Button
              variant="text"
              onClick={() => navigate("/reportes")}
              sx={{
                borderRadius: "10px",
                textTransform: "none",
                color: "#6b7280",
                "&:hover": { color: "#d97706", bgcolor: "#fffbeb" },
              }}
            >
              Todos los reportes
            </Button>
            <Button
              variant="outlined"
              startIcon={<Print />}
              onClick={handlePrint}
              sx={{
                borderRadius: "10px",
                textTransform: "none",
                borderColor: "#d97706",
                color: "#d97706",
                "&:hover": { borderColor: "#b45309", backgroundColor: "#fffbeb" },
              }}
            >
              Imprimir reporte
            </Button>
          </Box>
        </Box>

        <Box className="no-print" sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
          <Typography variant="body2" sx={{ color: "#6b7280", alignSelf: "center", mr: 1 }}>
            Rápido:
          </Typography>
          {[
            { key: "today", label: "Hoy" },
            { key: "week", label: "Esta semana" },
            { key: "month", label: "Este mes" },
            { key: "quarter", label: "Últimos 3 meses" },
            { key: "year", label: "Este año" },
          ].map(({ key, label }) => (
            <Button
              key={key}
              size="small"
              variant="outlined"
              onClick={() => handlePreset(key)}
              sx={{ borderRadius: "8px", textTransform: "none", fontSize: "0.8125rem" }}
            >
              {label}
            </Button>
          ))}
        </Box>

        <Paper
          className="no-print"
          elevation={0}
          sx={{
            p: 2,
            mb: 3,
            borderRadius: "12px",
            border: "1px solid #e5e7eb",
            backgroundColor: "#fff",
          }}
        >
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2, color: "#374151" }}>
            Filtros
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr 1fr", sm: "1fr 1fr 1fr 1fr auto" },
              gap: 2,
              alignItems: "end",
            }}
          >
            <TextField
              label="Desde"
              type="date"
              size="small"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="Hasta"
              type="date"
              size="small"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange("dateTo", e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <FormControl size="small" fullWidth>
              <InputLabel>Método de pago</InputLabel>
              <Select
                value={filters.payment_method}
                label="Método de pago"
                onChange={(e) => handleFilterChange("payment_method", e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="cash">Efectivo</MenuItem>
                <MenuItem value="transfer">Transferencia</MenuItem>
                <MenuItem value="credit_card">Tarjeta</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select
                value={filters.status}
                label="Estado"
                onChange={(e) => handleFilterChange("status", e.target.value)}
              >
                <MenuItem value="completed">Completadas</MenuItem>
                <MenuItem value="cancelled">Canceladas</MenuItem>
                <MenuItem value="">Todos</MenuItem>
              </Select>
            </FormControl>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="contained"
                onClick={handleApplyFilters}
                sx={{
                  borderRadius: "10px",
                  textTransform: "none",
                  bgcolor: "#d97706",
                  "&:hover": { bgcolor: "#b45309" },
                }}
              >
                Aplicar
              </Button>
              <Button variant="outlined" onClick={handleClearFilters} sx={{ borderRadius: "10px", textTransform: "none" }}>
                Limpiar
              </Button>
            </Box>
          </Box>
        </Paper>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress sx={{ color: "#d97706" }} />
          </Box>
        ) : data ? (
          <>
            {hasNoData && (
              <Paper
                className="no-print"
                elevation={0}
                sx={{
                  p: 3,
                  mb: 3,
                  borderRadius: "12px",
                  border: "1px solid #fde68a",
                  backgroundColor: "#fffbeb",
                }}
              >
                <Typography variant="body2" sx={{ color: "#92400e", fontWeight: 500 }}>
                  No hay datos para el período o filtros seleccionados. Probá ampliar las fechas o limpiar filtros.
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleClearFilters}
                  sx={{ mt: 2, borderRadius: "8px", textTransform: "none" }}
                >
                  Limpiar filtros
                </Button>
              </Paper>
            )}

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }, gap: 2, mb: 3 }}>
              <SummaryCard
                title="Ventas en el período"
                value={data.summary?.total_sales ?? 0}
                icon={ShoppingCart}
                color="#d97706"
                bg="#fffbeb"
              />
              <SummaryCard
                title="Ingresos (total)"
                value={data.summary?.total_revenue ?? 0}
                icon={TrendingUp}
                color="#16a34a"
                bg="#dcfce7"
                isCurrency
              />
              <SummaryCard
                title="Descuentos aplicados"
                value={data.summary?.total_discount ?? 0}
                icon={Payment}
                color="#6b7280"
                bg="#f3f4f6"
                isCurrency
              />
            </Box>

            {data.by_status?.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, color: "#374151" }}>
                  Ventas por estado (período)
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
                  {data.by_status.map((row) => (
                    <Box
                      key={row.status}
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 1,
                        px: 1.5,
                        py: 0.75,
                        borderRadius: "8px",
                        backgroundColor: "#f9fafb",
                        border: "1px solid #e5e7eb",
                      }}
                    >
                      <Typography variant="body2" color="text.secondary">
                        {statusLabel(row.status)}
                      </Typography>
                      <Typography variant="body2" fontWeight={700} sx={{ color: "#111827" }}>
                        {formatNumber(row.count)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatCurrency(row.total_revenue)}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr", lg: "1fr 1fr 1fr" },
                gap: 2,
                mb: 3,
              }}
            >
              <RankList
                title="Productos más vendidos"
                icon={<Inventory2 sx={{ fontSize: 20, color: "#d97706" }} />}
                items={data.by_product || []}
                nameKey="product_name"
                countKey="total_quantity"
                maxItems={10}
                barColor="#d97706"
                secondaryKey="total_revenue"
                secondaryFormat="currency"
              />
              <RankList
                title="Por método de pago"
                icon={<Payment sx={{ fontSize: 20, color: "#2563eb" }} />}
                items={(data.by_payment_method || []).map((r) => ({
                  ...r,
                  payment_method_label: PAYMENT_LABELS[r.payment_method] || r.payment_method,
                }))}
                nameKey="payment_method_label"
                countKey="count"
                maxItems={5}
                barColor="#2563eb"
                secondaryKey="total_revenue"
                secondaryFormat="currency"
              />
              <RankList
                title="Clientes (por compras)"
                icon={<Person sx={{ fontSize: 20, color: "#16a34a" }} />}
                items={data.by_client || []}
                nameKey="client_name"
                countKey="sales_count"
                maxItems={10}
                barColor="#16a34a"
                secondaryKey="total_revenue"
                secondaryFormat="currency"
              />
            </Box>

            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
              <SimpleBarChart
                title="Ventas por mes (últimos 12 meses)"
                data={data.chart_sales_per_month || []}
                dataKey="month"
                valueKey="count"
                color="#d97706"
              />
              <SimpleBarChart
                title="Ingresos por mes (últimos 12 meses)"
                data={data.chart_sales_per_month || []}
                dataKey="month"
                valueKey="revenue"
                color="#16a34a"
                valueFormat="currency"
              />
            </Box>
          </>
        ) : (
          <Box sx={{ textAlign: "center", py: 8 }}>
            <Typography color="text.secondary">No se pudieron cargar los reportes.</Typography>
            <Button
              variant="outlined"
              onClick={() => loadReports()}
              sx={{ mt: 2, borderRadius: "10px", textTransform: "none" }}
            >
              Reintentar
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  )
}
