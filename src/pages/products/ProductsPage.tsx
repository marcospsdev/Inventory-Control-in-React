import { useEffect, useState } from "react";
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
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CloseIcon from "@mui/icons-material/Close";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import { InvoiceImportDialog } from "./components/InvoiceImportDialog";
import { PageHeader } from "../../components/layout/PageHeader";
import { useSmartSearch } from "./hooks/useSmartSearch";
import { authService } from "../../services/authService";
import { USER_PROFILES } from "../../services/userService";
import { ProductFormDialog } from "./components/ProductFormDialog";
import { ProductDetailDialog } from "./components/ProductDetailDialog";
import { ListPagination } from "../../components/common/ListPagination";
import { useDebouncedValue, usePagination } from "../../hooks/usePagination";
import { categoryService, type Category } from "../../services/categoryService";
import {
  productImageUrl,
  productService,
  type ProductFormData,
  type StockSummaryItem,
  type ProductWithCategory,
} from "../../services/productService";
import { formatCurrency } from "../../lib/format";

const LOW_STOCK = 5;
const PAGE_SIZES = [12, 24, 48];
const CAN_REINDEX: string[] = [USER_PROFILES[0].id, USER_PROFILES[1].id];

export const ProductsPage = () => {
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [total, setTotal] = useState(0);
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
  const [importOpen, setImportOpen] = useState(false);
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { page, limit, setPage, changeLimit } = usePagination(PAGE_SIZES[0]);
  const debouncedSearch = useDebouncedValue(search.trim());
  const smart = useSmartSearch();
  const canReindex = CAN_REINDEX.includes(authService.getUser()?.user_type_id ?? "");

  const reload = () => setRefreshKey((key) => key + 1);

  useEffect(() => {
    let ignore = false;
    Promise.all([categoryService.getAll(), productService.getStockSummary()])
      .then(([categoryList, stock]) => {
        if (ignore) return;
        setCategories(categoryList);
        setSummary(stock);
      })
      .catch(() => !ignore && setError("Não foi possível carregar o resumo do estoque."));
    return () => {
      ignore = true;
    };
  }, [refreshKey]);

  useEffect(() => {
    let ignore = false;
    setIsLoading(true);
    setError(null);
    productService
      .list({
        page: page + 1,
        limit,
        search: debouncedSearch,
        categoryId: categoryFilter === "all" ? undefined : categoryFilter,
      })
      .then((result) => {
        if (ignore) return;
        if (result.data.length === 0 && page > 0) {
          setPage(Math.max(0, result.totalPages - 1));
          return;
        }
        setProducts(result.data);
        setTotal(result.total);
      })
      .catch(() => !ignore && setError("Não foi possível carregar os produtos."))
      .finally(() => !ignore && setIsLoading(false));
    return () => {
      ignore = true;
    };
  }, [page, limit, debouncedSearch, categoryFilter, refreshKey, setPage]);

  const changeSearch = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  const changeCategory = (categoryId: string) => {
    setCategoryFilter(categoryId);
    setPage(0);
  };

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
      reload();
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
      reload();
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

  const countBy = (categoryId: string) => summary.filter((item) => item.category_id === categoryId).length;

  const visibleProducts: ProductWithCategory[] = smart.enabled ? smart.results ?? [] : products;
  const listLoading = smart.enabled ? smart.loading : isLoading;
  const emptyMessage = smart.enabled
    ? smart.results === null
      ? "Descreva o que o cliente procura e aperte Enter. Ex.: \"algo para assistir filmes\"."
      : "Nenhum produto parecido com essa descrição."
    : "Nenhum produto encontrado.";

  return (
    <div>
      <PageHeader
        title="Produtos"
        subtitle={`${summary.length} produtos cadastrados em ${categories.length} categorias`}
        action={
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {canReindex && (
              <Button variant="outlined" color="secondary" startIcon={<ReceiptLongIcon />} onClick={() => setImportOpen(true)} disabled={isLoading}>
                Importar nota (IA)
              </Button>
            )}
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => openForm(null)} disabled={isLoading}>
              Novo produto
            </Button>
          </Box>
        }
      />

      {importNotice && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setImportNotice(null)}>
          {importNotice}
        </Alert>
      )}

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

      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5, mb: smart.enabled ? 1.5 : 3 }}>
        {smart.enabled ? (
          <TextField
            size="small"
            autoFocus
            placeholder="Descreva o que procura e aperte Enter..."
            value={smart.query}
            onChange={(e) => smart.setQuery(e.target.value.slice(0, 200))}
            onKeyDown={(e) => {
              if (e.key === "Enter") smart.search();
            }}
            sx={{ width: { xs: "100%", sm: 420 }, bgcolor: "background.paper" }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <AutoAwesomeIcon fontSize="small" color="secondary" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    {smart.query && (
                      <IconButton size="small" onClick={smart.clear} aria-label="Limpar busca">
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    )}
                    <IconButton size="small" onClick={smart.search} disabled={smart.query.trim().length < 2 || smart.loading} aria-label="Buscar">
                      <SearchIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
        ) : (
          <TextField
            size="small"
            placeholder="Buscar produto..."
            value={search}
            onChange={(e) => changeSearch(e.target.value)}
            sx={{ width: { xs: "100%", sm: 280 }, bgcolor: "background.paper" }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
          />
        )}
        <Tooltip title={smart.enabled ? "Voltar para a busca por nome" : "Buscar pelo significado, com IA"}>
          <Button size="small" color="secondary" variant={smart.enabled ? "contained" : "outlined"} startIcon={<AutoAwesomeIcon />} onClick={smart.toggle} sx={{ height: 40 }}>
            Busca inteligente
          </Button>
        </Tooltip>
        {!smart.enabled && (
          <>
            <Chip
              label={`Todas (${summary.length})`}
              color={categoryFilter === "all" ? "primary" : "default"}
              variant={categoryFilter === "all" ? "filled" : "outlined"}
              onClick={() => changeCategory("all")}
            />
            {categories.map((category) => (
              <Chip
                key={category.id}
                label={`${category.name} (${countBy(category.id)})`}
                color={categoryFilter === category.id ? "primary" : "default"}
                variant={categoryFilter === category.id ? "filled" : "outlined"}
                onClick={() => changeCategory(category.id)}
              />
            ))}
          </>
        )}
      </Box>

      {smart.enabled && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 3 }}>
          {smart.status && smart.status.missing > 0 && (
            <Alert
              severity="info"
              action={
                canReindex && (
                  <Button color="inherit" size="small" onClick={smart.reindex} disabled={smart.reindexing} startIcon={smart.reindexing ? <CircularProgress size={14} color="inherit" /> : undefined}>
                    {smart.reindexing ? "Indexando..." : "Indexar produtos"}
                  </Button>
                )
              }
            >
              {smart.status.indexed === 0
                ? "A busca inteligente ainda não tem nenhum produto indexado."
                : `${smart.status.missing} de ${smart.status.total} produtos ainda não estão na busca inteligente.`}
              {!canReindex && " Peça a um administrador ou operador para indexar."}
            </Alert>
          )}
          {smart.notice && (
            <Alert severity="success" onClose={() => smart.loadStatus()}>
              {smart.notice}
            </Alert>
          )}
          {smart.error && <Alert severity="warning">{smart.error}</Alert>}
          {!smart.error && smart.results !== null && smart.results.length > 0 && (
            <Typography variant="body2" color="text.secondary">
              {smart.results.length} produto(s) mais parecidos com "{smart.query.trim()}", do mais para o menos relevante.
            </Typography>
          )}
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {listLoading ? (
        <Box display="flex" justifyContent="center" mt={6}>
          <CircularProgress />
        </Box>
      ) : visibleProducts.length === 0 ? (
        <Typography variant="body1" sx={{ mt: 4, textAlign: "center" }} color="text.secondary">
          {emptyMessage}
        </Typography>
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 2.5 }}>
          {visibleProducts.map((product) => (
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

      {!smart.enabled && total > 0 && (
        <ListPagination
          total={total}
          page={page}
          limit={limit}
          limitOptions={PAGE_SIZES}
          onPageChange={setPage}
          onLimitChange={changeLimit}
        />
      )}

      <ProductDetailDialog productId={detailId} categories={categories} onClose={() => setDetailId(null)} />

      <InvoiceImportDialog
        open={importOpen}
        products={[...summary].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))}
        onClose={() => setImportOpen(false)}
        onImported={(message) => {
          setImportOpen(false);
          setImportNotice(message);
          reload();
        }}
      />

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
