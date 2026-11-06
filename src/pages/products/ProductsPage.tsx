import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import LayersIcon from "@mui/icons-material/Layers";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { PageHeader } from "../../components/layout/PageHeader";
import { ProductFormDialog } from "./components/ProductFormDialog";
import { ProductDetailDialog } from "./components/ProductDetailDialog";
import type { Category } from "../../services/categoryService";
import {
  productImageUrl,
  productService,
  type ProductFormData,
  type StockSummaryItem,
  type ProductWithCategory,
} from "../../services/productService";
import { formatCurrency } from "../../lib/format";

const LOW_STOCK = 5;

export const ProductsPage = () => {
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ProductWithCategory | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<ProductWithCategory | null>(null);
  const [summary, setSummary] = useState<StockSummaryItem[]>([]);
  const [detailId, setDetailId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [data, stock] = await Promise.all([productService.getAllWithCategories(), productService.getStockSummary()]);
      setProducts(data.products);
      setCategories(data.categories);
      setSummary(stock);
    } catch {
      setError("Não foi possível carregar os produtos.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(
    () =>
      products.filter(
        (product) =>
          (categoryFilter === "all" || product.category_id === categoryFilter) &&
          product.name.toLowerCase().includes(search.trim().toLowerCase()),
      ),
    [products, categoryFilter, search],
  );

  const openForm = (product: ProductWithCategory | null) => {
    setEditing(product);
    setFormError(null);
    setFormOpen(true);
  };

  const handleSave = async (data: ProductFormData) => {
    setSaving(true);
    setFormError(null);
    try {
      if (editing) await productService.update(editing.id, data);
      else await productService.create(data);
      setFormOpen(false);
      await load();
    } catch {
      setFormError("Não foi possível salvar o produto.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await productService.remove(toDelete.id);
      setToDelete(null);
      await load();
    } catch {
      setError("Não foi possível excluir o produto.");
      setToDelete(null);
    }
  };

  const totalUnits = summary.reduce((acc, item) => acc + item.amount, 0);
  const lowStock = summary.filter((item) => item.amount <= LOW_STOCK).length;
  const stats = [
    { label: "Produtos cadastrados", value: summary.length, icon: <Inventory2Icon />, color: "primary.main" },
    { label: "Unidades em estoque", value: totalUnits, icon: <LayersIcon />, color: "success.main" },
    { label: "Com estoque baixo", value: lowStock, icon: <WarningAmberIcon />, color: "warning.main" },
  ];

  const countBy = (categoryId: string) => products.filter((p) => p.category_id === categoryId).length;

  return (
    <div>
      <PageHeader
        title="Produtos"
        subtitle={`${products.length} produtos cadastrados em ${categories.length} categorias`}
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => openForm(null)} disabled={isLoading}>
            Novo produto
          </Button>
        }
      />

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 2, mb: 3 }}>
        {stats.map((stat) => (
          <Card key={stat.label} variant="outlined" sx={{ borderRadius: 3, p: 2.5, display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ width: 44, height: 44, borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "center", color: stat.color, bgcolor: "grey.100" }}>{stat.icon}</Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, lineHeight: 1.1 }}>{stat.value}</Typography>
              <Typography variant="body2" color="text.secondary">{stat.label}</Typography>
            </Box>
          </Card>
        ))}
      </Box>

      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5, mb: 3 }}>
        <TextField
          size="small"
          placeholder="Buscar produto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ width: { xs: "100%", sm: 280 }, bgcolor: "background.paper" }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
        />
        <Chip
          label={`Todas (${products.length})`}
          color={categoryFilter === "all" ? "primary" : "default"}
          variant={categoryFilter === "all" ? "filled" : "outlined"}
          onClick={() => setCategoryFilter("all")}
        />
        {categories.map((category) => (
          <Chip
            key={category.id}
            label={`${category.name} (${countBy(category.id)})`}
            color={categoryFilter === category.id ? "primary" : "default"}
            variant={categoryFilter === category.id ? "filled" : "outlined"}
            onClick={() => setCategoryFilter(category.id)}
          />
        ))}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {isLoading ? (
        <Box display="flex" justifyContent="center" mt={6}>
          <CircularProgress />
        </Box>
      ) : filtered.length === 0 ? (
        <Typography variant="body1" sx={{ mt: 4, textAlign: "center" }} color="text.secondary">
          Nenhum produto encontrado.
        </Typography>
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 2.5 }}>
          {filtered.map((product) => (
            <Card key={product.id} variant="outlined" sx={{ borderRadius: 3, display: "flex", flexDirection: "column" }}>
              <Box sx={{ position: "relative", cursor: "pointer" }} onClick={() => setDetailId(product.id)}>
                <CardMedia component="img" image={productImageUrl(product.banner)} alt={product.name} sx={{ aspectRatio: "4 / 3", objectFit: "cover", bgcolor: "grey.100" }} />
                {product.category && (
                  <Chip
                    label={product.category.name}
                    size="small"
                    sx={{ position: "absolute", top: 10, left: 10, bgcolor: "rgba(255,255,255,.92)", fontWeight: 600 }}
                  />
                )}
              </Box>
              <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 0.5, pb: "12px !important" }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.3 }} noWrap>
                  {product.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", minHeight: 40 }}>
                  {product.description}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mt: 1 }}>
                  <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
                    {formatCurrency(product.price)}
                  </Typography>
                  <Chip
                    size="small"
                    label={product.amount === 0 ? "Sem estoque" : `${product.amount} un.`}
                    color={product.amount === 0 ? "error" : product.amount <= LOW_STOCK ? "warning" : "success"}
                    variant="outlined"
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
                <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5, mt: 0.5 }}>
                  <Tooltip title="Editar">
                    <IconButton size="small" onClick={() => openForm(product)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Excluir">
                    <IconButton size="small" color="error" onClick={() => setToDelete(product)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <ProductDetailDialog productId={detailId} categories={categories} onClose={() => setDetailId(null)} />

      <ProductFormDialog
        open={formOpen}
        product={editing}
        categories={categories}
        saving={saving}
        error={formError}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSave}
      />

      <Dialog open={!!toDelete} onClose={() => setToDelete(null)}>
        <DialogTitle>Excluir produto?</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja excluir <strong>{toDelete?.name}</strong>? Esta ação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setToDelete(null)} variant="outlined">
            Cancelar
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Excluir
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
