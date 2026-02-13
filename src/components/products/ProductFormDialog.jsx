"use client"

import { useState, useEffect } from "react"
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogContent,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Alert,
  InputAdornment,
  Autocomplete,
} from "@mui/material"
import { Close, Inventory2, Code, Category, AttachMoney, Straighten, Description, Add } from "@mui/icons-material"
import { NumericFormat } from "react-number-format"
import productService from "../../services/productService"
import categoryService from "../../services/categoryService"

const ProductFormDialog = ({ open, onClose, product, onSaved, inputStyles }) => {
  const [error, setError] = useState("")
  const [categoriesList, setCategoriesList] = useState([])
  const [openQuickCategory, setOpenQuickCategory] = useState(false)
  const [quickCategoryName, setQuickCategoryName] = useState("")
  const [quickCategoryDesc, setQuickCategoryDesc] = useState("")
  const [quickCategoryError, setQuickCategoryError] = useState("")
  const [form, setForm] = useState({
    name: "",
    code: "",
    description: "",
    category: "",
    sale_price: "",
    cost_price: "",
    stock_inicial: "0",
    min_stock: "0",
    unit: "unidad",
  })

  const loadCategories = async () => {
    try {
      const res = await categoryService.getAll()
      setCategoriesList(res.data || [])
    } catch {
      setCategoriesList([])
    }
  }

  useEffect(() => {
    if (open) {
      setError("")
      loadCategories()
      if (product) {
        setForm({
          name: product.name || "",
          code: product.code || "",
          description: product.description || "",
          category: product.category || "",
          sale_price: product.sale_price ?? "",
          cost_price: product.cost_price ?? "",
          stock_inicial: "",
          min_stock: product.min_stock ?? "0",
          unit: product.unit === "kg" ? "kg" : "unidad",
        })
      } else {
        setForm({
          name: "",
          code: "",
          description: "",
          category: "",
          sale_price: "",
          cost_price: "",
          stock_inicial: "0",
          min_stock: "0",
          unit: "unidad",
        })
      }
    }
  }, [open, product])

  const activeCategories = categoriesList.filter((c) => c.active !== false)
  const selectedCategory = activeCategories.find((c) => c.name === form.category) || null

  const handleQuickCategorySave = async () => {
    const name = quickCategoryName.trim()
    if (!name) {
      setQuickCategoryError("El nombre es requerido")
      return
    }
    setQuickCategoryError("")
    try {
      const res = await categoryService.create({ name, description: quickCategoryDesc.trim() || null })
      const newCat = res.data
      setForm((prev) => ({ ...prev, category: newCat.name }))
      loadCategories()
      setOpenQuickCategory(false)
      setQuickCategoryName("")
      setQuickCategoryDesc("")
    } catch (err) {
      setQuickCategoryError(err.response?.data?.message || "Error al crear categoría")
    }
  }

  const handleSubmit = async () => {
    setError("")
    const salePrice = typeof form.sale_price === "number" ? form.sale_price : Number(form.sale_price) || 0
    const costPrice = typeof form.cost_price === "number" ? form.cost_price : Number(form.cost_price) || 0
    try {
      if (product) {
        await productService.update(product.id, {
          name: form.name,
          code: form.code,
          description: form.description,
          category: form.category,
          sale_price: salePrice,
          cost_price: costPrice,
          min_stock: form.min_stock,
          unit: form.unit,
        })
      } else {
        await productService.create({
          name: form.name,
          code: form.code,
          description: form.description,
          category: form.category,
          sale_price: salePrice,
          cost_price: costPrice,
          stock_inicial: form.stock_inicial,
          min_stock: form.min_stock,
          unit: form.unit,
        })
      }
      onSaved()
    } catch (err) {
      setError(err.response?.data?.message || "Error al guardar")
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: { xs: "16px", sm: "20px" }, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", m: { xs: 2, sm: 3 }, maxHeight: "calc(100vh - 48px)" },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: { xs: 2.5, sm: 3 }, py: 2.5, borderBottom: "1px solid #e5e7eb" }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600, color: "#111827", fontSize: "1.25rem" }}>
            {product ? "Editar producto" : "Nuevo producto"}
          </Typography>
          <Typography variant="body2" sx={{ color: "#6b7280", mt: 0.25 }}>
            {product ? "Modifica los datos del producto. El stock se gestiona con movimientos." : "Completa los datos del producto."}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: "#9ca3af", "&:hover": { backgroundColor: "#f3f4f6", color: "#6b7280" } }} aria-label="Cerrar">
          <Close fontSize="small" />
        </IconButton>
      </Box>
      <DialogContent sx={{ px: { xs: 2.5, sm: 3 }, py: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: "10px" }} onClose={() => setError("")}>{error}</Alert>
        )}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2.5 }}>
            <TextField
              fullWidth
              label="Nombre"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              size="small"
              required
              InputProps={{ startAdornment: <InputAdornment position="start"><Inventory2 sx={{ color: "#9ca3af", fontSize: 20 }} /></InputAdornment> }}
              sx={inputStyles}
            />
            <TextField
              fullWidth
              label="Código"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              size="small"
              required
              InputProps={{ startAdornment: <InputAdornment position="start"><Code sx={{ color: "#9ca3af", fontSize: 20 }} /></InputAdornment> }}
              sx={inputStyles}
            />
          </Box>
          <TextField
            fullWidth
            label="Descripción"
            multiline
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            size="small"
            InputProps={{ startAdornment: <InputAdornment position="start" sx={{ alignSelf: "flex-start", mt: 1 }}><Description sx={{ color: "#9ca3af", fontSize: 20 }} /></InputAdornment> }}
            sx={inputStyles}
          />
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Autocomplete
              value={selectedCategory}
              onChange={(_, newValue) => setForm({ ...form, category: newValue ? newValue.name : "" })}
              options={activeCategories}
              getOptionLabel={(opt) => opt.name}
              isOptionEqualToValue={(opt, val) => opt.id === val?.id}
              size="small"
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Categoría"
                  placeholder={activeCategories.length === 0 ? "Crear una categoría primero" : "Seleccionar o crear nueva"}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <InputAdornment position="start">
                          <Category sx={{ color: "#9ca3af", fontSize: 20 }} />
                        </InputAdornment>
                        {params.InputProps.startAdornment}
                      </>
                    ),
                  }}
                  sx={inputStyles}
                />
              )}
            />
            <Button
              startIcon={<Add />}
              onClick={() => setOpenQuickCategory(true)}
              size="small"
              sx={{
                alignSelf: "flex-start",
                textTransform: "none",
                color: "#d97706",
                fontWeight: 600,
                "&:hover": { backgroundColor: "#fffbeb" },
              }}
            >
              Crear categoría nueva
            </Button>
          </Box>

          {/* Modal crear categoría rápida */}
          <Dialog
            open={openQuickCategory}
            onClose={() => { setOpenQuickCategory(false); setQuickCategoryError(""); setQuickCategoryName(""); setQuickCategoryDesc("") }}
            maxWidth="xs"
            fullWidth
            PaperProps={{ sx: { borderRadius: "16px", p: 0 } }}
          >
            <Box sx={{ px: 2.5, py: 2, borderBottom: "1px solid #e5e7eb" }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "#111827" }}>Nueva categoría</Typography>
              <Typography variant="body2" color="text.secondary">Se usará en este producto y quedará disponible en la lista.</Typography>
            </Box>
            <DialogContent sx={{ pt: 2 }}>
              {quickCategoryError && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: "10px" }} onClose={() => setQuickCategoryError("")}>{quickCategoryError}</Alert>
              )}
              <TextField
                fullWidth
                label="Nombre"
                value={quickCategoryName}
                onChange={(e) => setQuickCategoryName(e.target.value)}
                size="small"
                required
                sx={inputStyles}
                onKeyDown={(e) => e.key === "Enter" && handleQuickCategorySave()}
              />
              <TextField
                fullWidth
                label="Descripción (opcional)"
                value={quickCategoryDesc}
                onChange={(e) => setQuickCategoryDesc(e.target.value)}
                size="small"
                multiline
                rows={2}
                sx={{ ...inputStyles, mt: 2 }}
              />
            </DialogContent>
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5, px: 2.5, py: 2, borderTop: "1px solid #e5e7eb", backgroundColor: "#fafafa" }}>
              <Button onClick={() => { setOpenQuickCategory(false); setQuickCategoryError(""); setQuickCategoryName(""); setQuickCategoryDesc("") }} variant="outlined" sx={{ borderRadius: "10px", textTransform: "none" }}>
                Cancelar
              </Button>
              <Button onClick={handleQuickCategorySave} variant="contained" sx={{ backgroundColor: "#d97706", borderRadius: "10px", textTransform: "none", fontWeight: 600, "&:hover": { backgroundColor: "#b45309" } }}>
                Crear y usar
              </Button>
            </Box>
          </Dialog>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2.5 }}>
            <NumericFormat
              value={form.sale_price}
              onValueChange={(values) => setForm({ ...form, sale_price: values.floatValue ?? "" })}
              thousandSeparator="."
              decimalSeparator=","
              prefix="$ "
              decimalScale={2}
              fixedDecimalScale
              allowNegative={false}
              customInput={TextField}
              fullWidth
              label="Precio de venta"
              size="small"
              required
              placeholder="$ 0,00"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AttachMoney sx={{ color: "#9ca3af", fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={inputStyles}
            />
            <NumericFormat
              value={form.cost_price}
              onValueChange={(values) => setForm({ ...form, cost_price: values.floatValue ?? "" })}
              thousandSeparator="."
              decimalSeparator=","
              prefix="$ "
              decimalScale={2}
              fixedDecimalScale
              allowNegative={false}
              customInput={TextField}
              fullWidth
              label="Precio de costo"
              size="small"
              required
              placeholder="$ 0,00"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AttachMoney sx={{ color: "#9ca3af", fontSize: 20 }} />
                  </InputAdornment>
                ),
              }}
              sx={inputStyles}
            />
          </Box>
          {!product && (
            <TextField
              fullWidth
              label="Stock inicial"
              type="number"
              inputProps={{ min: 0, step: 0.001 }}
              value={form.stock_inicial}
              onChange={(e) => setForm({ ...form, stock_inicial: e.target.value })}
              size="small"
              InputProps={{ startAdornment: <InputAdornment position="start"><Straighten sx={{ color: "#9ca3af", fontSize: 20 }} /></InputAdornment> }}
              sx={inputStyles}
            />
          )}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2.5 }}>
            <TextField
              fullWidth
              label="Stock mínimo"
              type="number"
              inputProps={{ min: 0, step: 0.001 }}
              value={form.min_stock}
              onChange={(e) => setForm({ ...form, min_stock: e.target.value })}
              size="small"
              InputProps={{ startAdornment: <InputAdornment position="start"><Straighten sx={{ color: "#9ca3af", fontSize: 20 }} /></InputAdornment> }}
              sx={inputStyles}
            />
            <FormControl fullWidth size="small" sx={inputStyles}>
              <InputLabel>Unidad de medida</InputLabel>
              <Select value={form.unit} label="Unidad de medida" onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                <MenuItem value="unidad">Unidad</MenuItem>
                <MenuItem value="kg">kg</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
      </DialogContent>
      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1.5, px: { xs: 2.5, sm: 3 }, py: 2.5, borderTop: "1px solid #e5e7eb", backgroundColor: "#fafafa" }}>
        <Button onClick={onClose} variant="outlined" sx={{ color: "#6b7280", borderColor: "#d1d5db", borderRadius: "10px", textTransform: "none", fontWeight: 500, px: 3, "&:hover": { borderColor: "#9ca3af", backgroundColor: "#f9fafb" } }}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} variant="contained" sx={{ backgroundColor: "#d97706", borderRadius: "10px", textTransform: "none", fontWeight: 600, px: 3, boxShadow: "0 1px 3px rgba(217, 119, 6, 0.3)", "&:hover": { backgroundColor: "#b45309" } }}>
          {product ? "Guardar cambios" : "Crear producto"}
        </Button>
      </Box>
    </Dialog>
  )
}

export default ProductFormDialog
