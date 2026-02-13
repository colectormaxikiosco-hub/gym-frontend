"use client"

import { useState, useEffect } from "react"
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  InputAdornment,
} from "@mui/material"
import { Search, Refresh } from "@mui/icons-material"
import productService from "../../services/productService"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { formatMovementQuantity } from "../../utils/formatProductQuantity"

const inputStyles = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "10px",
    backgroundColor: "#fafafa",
    "&:hover fieldset": { borderColor: "#d1d5db" },
    "&.Mui-focused fieldset": { borderColor: "#d97706", borderWidth: "1px" },
  },
  "& .MuiInputLabel-root.Mui-focused": { color: "#d97706" },
}

const MovementsGeneralTab = () => {
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("")

  const loadMovements = async () => {
    try {
      setLoading(true)
      const params = {}
      if (search.trim()) params.search = search.trim()
      if (typeFilter) params.type = typeFilter
      const res = await productService.getAllMovements(params)
      setMovements(res.data || [])
    } catch (error) {
      if (!error.cancelled) setMovements([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMovements()
  }, [])

  const handleSearch = () => {
    loadMovements()
  }

  const formatDate = (d) => (d ? format(new Date(d), "dd/MM/yyyy HH:mm", { locale: es }) : "—")

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: "#111827", mb: 0.5 }}>
            Movimientos generales
          </Typography>
          <Typography variant="body2" sx={{ color: "#6b7280" }}>
            Historial de todos los movimientos de stock, del más reciente al más antiguo
          </Typography>
        </Box>
        <Button
          startIcon={<Refresh />}
          onClick={loadMovements}
          variant="outlined"
          size="small"
          sx={{
            borderColor: "#d1d5db",
            color: "#6b7280",
            borderRadius: "10px",
            textTransform: "none",
            fontWeight: 600,
            "&:hover": { borderColor: "#d97706", backgroundColor: "#fffbeb", color: "#d97706" },
          }}
        >
          Actualizar
        </Button>
      </Box>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3 }}>
        <TextField
          size="small"
          placeholder="Buscar por producto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: "#9ca3af", fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
          sx={{ ...inputStyles, minWidth: 220 }}
        />
        <FormControl size="small" sx={{ ...inputStyles, minWidth: 160 }}>
          <InputLabel>Tipo</InputLabel>
          <Select value={typeFilter} label="Tipo" onChange={(e) => setTypeFilter(e.target.value)}>
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="entrada">Entrada</MenuItem>
            <MenuItem value="salida">Salida</MenuItem>
            <MenuItem value="ajuste">Ajuste</MenuItem>
          </Select>
        </FormControl>
        <Button
          variant="outlined"
          onClick={handleSearch}
          sx={{
            borderColor: "#d97706",
            color: "#d97706",
            borderRadius: "10px",
            textTransform: "none",
            fontWeight: 600,
            "&:hover": { borderColor: "#b45309", backgroundColor: "#fffbeb" },
          }}
        >
          Buscar
        </Button>
      </Box>

      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          overflow: "auto",
          backgroundColor: "#fff",
        }}
      >
        <Table
          size="small"
          sx={{
            minWidth: 700,
            "& .MuiTableCell-root": {
              borderBottom: "1px solid #f3f4f6",
              py: { xs: 1.25, sm: 1.5 },
              px: { xs: 1.5, sm: 2 },
              fontSize: { xs: "0.8125rem", sm: "0.875rem" },
            },
          }}
        >
          <TableHead>
            <TableRow
              sx={{
                backgroundColor: "#fafafa",
                "& .MuiTableCell-head": {
                  fontWeight: 600,
                  color: "#374151",
                  fontSize: { xs: "0.75rem", sm: "0.8125rem" },
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                },
              }}
            >
              <TableCell>Fecha</TableCell>
              <TableCell>Producto</TableCell>
              <TableCell>Código</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell align="right">Cantidad</TableCell>
              <TableCell>Usuario</TableCell>
              <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>Observaciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                    <Box sx={{ width: 36, height: 36, border: "2px solid #e5e7eb", borderTopColor: "#d97706", borderRadius: "50%", animation: "spin 1s linear infinite", "@keyframes spin": { "0%": { transform: "rotate(0deg)" }, "100%": { transform: "rotate(360deg)" } } }} />
                    <Typography variant="body2" color="text.secondary">Cargando...</Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : movements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                  <Typography variant="body2" color="text.secondary">No hay movimientos</Typography>
                </TableCell>
              </TableRow>
            ) : (
              movements.map((m) => (
                <TableRow key={m.id} hover sx={{ "&:hover": { backgroundColor: "#fafafa" }, "&:last-child .MuiTableCell-root": { borderBottom: "none" } }}>
                  <TableCell>{formatDate(m.created_at)}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>{m.product_name || "—"}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">{m.product_code || "—"}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      component="span"
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: m.type === "entrada" ? "#166534" : m.type === "salida" ? "#dc2626" : "#92400e",
                      }}
                    >
                      {m.type === "entrada" ? "Entrada" : m.type === "salida" ? "Salida" : "Ajuste"}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 500 }}>
                    {formatMovementQuantity(m.quantity, m.product_unit)}
                  </TableCell>
                  <TableCell sx={{ fontSize: "0.8125rem" }}>{m.created_by_name || "—"}</TableCell>
                  <TableCell sx={{ display: { xs: "none", md: "table-cell" }, maxWidth: 180 }} noWrap>
                    {m.notes || "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

export default MovementsGeneralTab
