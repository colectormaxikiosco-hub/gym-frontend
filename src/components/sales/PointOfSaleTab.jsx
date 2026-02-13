"use client"

import { useState, useEffect } from "react"
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Paper,
  IconButton,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItemButton,
  ListItemText,
} from "@mui/material"
import {
  Search,
  Add,
  Remove,
  Delete,
  AttachMoney,
  AccountBalance,
  CreditCard,
  ShoppingCart as CartIcon,
  ReceiptLong,
  Person,
} from "@mui/icons-material"
import { NumericFormat } from "react-number-format"
import productService from "../../services/productService"
import saleService from "../../services/saleService"
import clientService from "../../services/clientService"

const formatPrice = (n) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 2 }).format(n)

const inputStyles = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "10px",
    backgroundColor: "#fafafa",
    "&:hover fieldset": { borderColor: "#d1d5db" },
    "&.Mui-focused fieldset": { borderColor: "#d97706", borderWidth: "1px" },
  },
  "& .MuiInputLabel-root.Mui-focused": { color: "#d97706" },
}

const PointOfSaleTab = ({ onSaleComplete }) => {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState("")
  const [cart, setCart] = useState([])
  const [discount, setDiscount] = useState("0")
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [selectedClient, setSelectedClient] = useState(null)
  const [clientModalOpen, setClientModalOpen] = useState(false)
  const [clients, setClients] = useState([])
  const [clientsLoading, setClientsLoading] = useState(false)
  const [clientSearch, setClientSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })
  const [lastSaleId, setLastSaleId] = useState(null)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const res = await productService.getAll({})
      setProducts(res.data || [])
    } catch {
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter((p) => {
    if (!search.trim()) return true
    const term = search.toLowerCase()
    return (
      (p.name && p.name.toLowerCase().includes(term)) ||
      (p.code && p.code.toLowerCase().includes(term)) ||
      (p.category && p.category.toLowerCase().includes(term))
    )
  })

  const getCartQty = (productId) => cart.find((c) => c.product_id === productId)?.quantity ?? 0
  const canAdd = (product) => {
    const inCart = getCartQty(product.id)
    return Number(product.stock) >= inCart + 1
  }

  const addToCart = (product, qty = 1) => {
    const current = getCartQty(product.id)
    const newQty = current + qty
    if (Number(product.stock) < newQty) return
    setCart((prev) => {
      const rest = prev.filter((c) => c.product_id !== product.id)
      if (newQty <= 0) return rest
      return [...rest, { product_id: product.id, product, quantity: newQty }]
    })
  }

  const updateCartQty = (productId, delta) => {
    const item = cart.find((c) => c.product_id === productId)
    if (!item) return
    const newQty = item.quantity + delta
    if (newQty <= 0) {
      setCart((prev) => prev.filter((c) => c.product_id !== productId))
      return
    }
    if (Number(item.product.stock) < newQty) return
    setCart((prev) =>
      prev.map((c) => (c.product_id === productId ? { ...c, quantity: newQty } : c))
    )
  }

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((c) => c.product_id !== productId))
  }

  const subtotal = cart.reduce((sum, c) => sum + Number(c.product.sale_price) * c.quantity, 0)
  const discountNum = Math.max(0, Number(discount) || 0)
  const total = Math.max(0, subtotal - discountNum)

  const canCompleteSale =
    cart.length > 0 &&
    (paymentMethod !== "current_account" || (paymentMethod === "current_account" && selectedClient != null))

  const handleCompleteSale = async () => {
    if (cart.length === 0) {
      setMessage({ type: "error", text: "Agregá al menos un producto al carrito" })
      return
    }
    if (paymentMethod === "current_account" && !selectedClient) {
      setMessage({ type: "error", text: "Debés seleccionar un cliente para venta a cuenta corriente" })
      return
    }
    setSubmitting(true)
    setMessage({ type: "", text: "" })
    try {
      const payload = {
        items: cart.map((c) => ({ product_id: c.product_id, quantity: c.quantity })),
        payment_method: paymentMethod,
        discount: discountNum,
      }
      if (paymentMethod === "current_account" && selectedClient) {
        payload.client_id = selectedClient.id
      }
      const res = await saleService.create(payload)
      const sale = res.data
      setLastSaleId(sale.id)
      setMessage({ type: "success", text: `Venta #${sale.id} registrada correctamente. Total: ${formatPrice(sale.total)}` })
      setCart([])
      setDiscount("0")
      setSelectedClient(null)
      if (typeof onSaleComplete === "function") setTimeout(() => onSaleComplete(), 1500)
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Error al registrar la venta" })
    } finally {
      setSubmitting(false)
    }
  }

  const openClientModal = () => {
    setClientModalOpen(true)
    setClientSearch("")
    setClients([])
    setClientsLoading(true)
    clientService
      .getAll()
      .then((data) => setClients(Array.isArray(data) ? data : []))
      .catch(() => setClients([]))
      .finally(() => setClientsLoading(false))
  }

  const filteredClients = clientSearch.trim()
    ? clients.filter(
        (c) =>
          (c.name && c.name.toLowerCase().includes(clientSearch.toLowerCase())) ||
          (c.username && c.username.toLowerCase().includes(clientSearch.toLowerCase())) ||
          (c.dni && String(c.dni).toLowerCase().includes(clientSearch.toLowerCase())) ||
          (c.phone && String(c.phone).includes(clientSearch))
      )
    : clients

  return (
    <Box sx={{ display: "flex", flexDirection: { xs: "column", lg: "row" }, gap: 3 }}>
      {/* Productos */}
      <Paper
        elevation={0}
        sx={{
          flex: { lg: "1 1 55%" },
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          maxHeight: { xs: "none", lg: "calc(100vh - 320px)" },
        }}
      >
        <Box sx={{ p: 2, borderBottom: "1px solid #e5e7eb" }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Buscar producto por nombre, código o categoría..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: "#9ca3af", fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
            sx={inputStyles}
          />
        </Box>
        <Box sx={{ flex: 1, overflow: "auto", p: 1.5 }}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <Typography variant="body2" color="text.secondary">Cargando productos...</Typography>
            </Box>
          ) : filteredProducts.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 6 }}>
              <Typography variant="body2" color="text.secondary">
                {search.trim() ? "No hay productos que coincidan con la búsqueda" : "No hay productos cargados"}
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
              {filteredProducts.map((p) => {
                const inCart = getCartQty(p.id)
                const canAddMore = canAdd(p)
                return (
                  <Paper
                    key={p.id}
                    elevation={0}
                    sx={{
                      p: 1.5,
                      borderRadius: "10px",
                      border: "1px solid #e5e7eb",
                      minWidth: 140,
                      maxWidth: 200,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "stretch",
                      backgroundColor: inCart > 0 ? "#fffbeb" : "#fff",
                    }}
                  >
                    <Typography variant="body2" fontWeight={600} noWrap title={p.name}>
                      {p.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {p.code} · {formatPrice(p.sale_price)} / {p.unit}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Stock: {Number(p.stock)}
                    </Typography>
                    <Button
                      size="small"
                      startIcon={<Add />}
                      onClick={() => addToCart(p)}
                      disabled={!canAddMore}
                      fullWidth
                      sx={{
                        mt: 1,
                        textTransform: "none",
                        fontWeight: 600,
                        color: "#d97706",
                        "&:hover": { backgroundColor: "#fffbeb" },
                      }}
                    >
                      Agregar {inCart > 0 ? `(${inCart})` : ""}
                    </Button>
                  </Paper>
                )
              })}
            </Box>
          )}
        </Box>
      </Paper>

      {/* Carrito y cobro */}
      <Paper
        elevation={0}
        sx={{
          flex: { lg: "0 0 380px" },
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box sx={{ p: 2, borderBottom: "1px solid #e5e7eb", backgroundColor: "#fafafa" }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ color: "#111827", display: "flex", alignItems: "center", gap: 1 }}>
            <CartIcon sx={{ color: "#d97706" }} />
            Carrito
          </Typography>
        </Box>
        <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
          {message.text && (
            <Alert severity={message.type} sx={{ mb: 2, borderRadius: "10px" }} onClose={() => setMessage({ type: "", text: "" })}>
              {message.text}
            </Alert>
          )}
          {cart.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
              El carrito está vacío. Agregá productos desde la lista.
            </Typography>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {cart.map((item) => (
                <Box
                  key={item.product_id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    p: 1.5,
                    borderRadius: "10px",
                    backgroundColor: "#fafafa",
                    border: "1px solid #f3f4f6",
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={600} noWrap>{item.product.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatPrice(item.product.sale_price)} × {item.quantity} = {formatPrice(item.product.sale_price * item.quantity)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <IconButton size="small" onClick={() => updateCartQty(item.product_id, -1)} sx={{ color: "#6b7280" }}>
                      <Remove fontSize="small" />
                    </IconButton>
                    <Typography variant="body2" fontWeight={600} sx={{ minWidth: 24, textAlign: "center" }}>
                      {item.quantity}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => updateCartQty(item.product_id, 1)}
                      disabled={Number(item.product.stock) < item.quantity + 1}
                      sx={{ color: "#d97706" }}
                    >
                      <Add fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => removeFromCart(item.product_id)} sx={{ color: "#dc2626" }}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>
        <Divider />
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="body2" color="text.secondary">Subtotal</Typography>
            <Typography variant="body2" fontWeight={600}>{formatPrice(subtotal)}</Typography>
          </Box>
          <Box sx={{ mb: 2 }}>
            <NumericFormat
              value={discount}
              onValueChange={(v) => setDiscount(v.value ?? "0")}
              thousandSeparator="."
              decimalSeparator=","
              prefix="$ "
              decimalScale={2}
              fixedDecimalScale
              allowNegative={false}
              customInput={TextField}
              fullWidth
              size="small"
              label="Descuento"
              sx={inputStyles}
            />
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={700}>Total</Typography>
            <Typography variant="h6" fontWeight={700} sx={{ color: "#d97706" }}>{formatPrice(total)}</Typography>
          </Box>
          <FormControl fullWidth size="small" sx={inputStyles}>
            <InputLabel>Método de pago</InputLabel>
            <Select
              value={paymentMethod}
              label="Método de pago"
              onChange={(e) => {
                const v = e.target.value
                setPaymentMethod(v)
                if (v !== "current_account") setSelectedClient(null)
              }}
            >
              <MenuItem value="cash">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <AttachMoney fontSize="small" /> Efectivo
                </Box>
              </MenuItem>
              <MenuItem value="transfer">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <AccountBalance fontSize="small" /> Transferencia
                </Box>
              </MenuItem>
              <MenuItem value="credit_card">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CreditCard fontSize="small" /> Tarjeta
                </Box>
              </MenuItem>
              <MenuItem value="current_account">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <ReceiptLong fontSize="small" /> Cuenta corriente
                </Box>
              </MenuItem>
            </Select>
          </FormControl>
          {paymentMethod === "current_account" && (
            <Box sx={{ mt: 1.5 }}>
              <Button
                fullWidth
                variant="outlined"
                size="medium"
                startIcon={<Person />}
                onClick={openClientModal}
                sx={{
                  borderColor: selectedClient ? "#22c55e" : "#d97706",
                  color: selectedClient ? "#22c55e" : "#d97706",
                  "&:hover": { borderColor: "#d97706", backgroundColor: "#fffbeb" },
                }}
              >
                {selectedClient ? `${selectedClient.name || selectedClient.username}` : "Seleccionar cliente"}
              </Button>
              {!selectedClient && (
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                  El saldo se cargará a la cuenta corriente del cliente seleccionado.
                </Typography>
              )}
            </Box>
          )}
          <Button
            fullWidth
            variant="contained"
            onClick={handleCompleteSale}
            disabled={!canCompleteSale || submitting}
            sx={{
              mt: 2,
              py: 1.5,
              backgroundColor: "#d97706",
              fontWeight: 700,
              borderRadius: "12px",
              textTransform: "none",
              fontSize: "1rem",
              "&:hover": { backgroundColor: "#b45309" },
            }}
          >
            {submitting ? "Procesando..." : "Cobrar " + formatPrice(total)}
          </Button>
        </Box>
      </Paper>

      <Dialog open={clientModalOpen} onClose={() => setClientModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Seleccionar cliente (cuenta corriente)</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            size="small"
            placeholder="Buscar por nombre, usuario, DNI o teléfono..."
            value={clientSearch}
            onChange={(e) => setClientSearch(e.target.value)}
            sx={{ mb: 2, mt: 0.5, ...inputStyles }}
            autoFocus
          />
          {clientsLoading ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
              Cargando clientes...
            </Typography>
          ) : filteredClients.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
              {clientSearch.trim() ? "No hay clientes que coincidan con la búsqueda" : "No hay clientes activos"}
            </Typography>
          ) : (
            <List dense sx={{ maxHeight: 320, overflow: "auto" }}>
              {filteredClients.map((client) => (
                <ListItemButton
                  key={client.id}
                  selected={selectedClient?.id === client.id}
                  onClick={() => {
                    setSelectedClient(client)
                    setClientModalOpen(false)
                  }}
                >
                  <ListItemText
                    primary={client.name || client.username}
                    secondary={[client.username && client.username !== client.name ? client.username : null, client.dni, client.phone].filter(Boolean).join(" · ") || undefined}
                  />
                </ListItemButton>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClientModalOpen(false)} color="inherit">
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default PointOfSaleTab
