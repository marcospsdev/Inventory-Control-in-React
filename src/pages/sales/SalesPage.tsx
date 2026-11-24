import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import DeleteIcon from "@mui/icons-material/Delete";
import { PageHeader } from "../../components/layout/PageHeader";
import { ListPagination } from "../../components/common/ListPagination";
import { SearchField } from "../../components/common/SearchField";
import { useDebouncedValue, usePagination } from "../../hooks/usePagination";
import { authService } from "../../services/authService";
import { saleService, type Sale } from "../../services/saleService";
import { USER_PROFILES } from "../../services/userService";
import {
  productImageUrl,
  productService,
  type ProductWithCategory,
} from "../../services/productService";
import { formatCurrency } from "../../lib/format";

const toNumber = (price: string) => Number(String(price).replace(",", ".")) || 0;
const HISTORY_PAGE_SIZES = [5, 10, 25];
const CAN_DELETE_SALES: string[] = [USER_PROFILES[0].id, USER_PROFILES[1].id];

const formatSaleDate = (value: string) =>
  new Date(value).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

export const SalesPage = () => {
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [productId, setProductId] = useState("");
  const [amount, setAmount] = useState(1);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [salesTotal, setSalesTotal] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historySearch, setHistorySearch] = useState("");
  const [historyKey, setHistoryKey] = useState(0);
  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);
  const [deleting, setDeleting] = useState(false);
  const history = usePagination(HISTORY_PAGE_SIZES[0]);
  const { page: historyPage, limit: historyLimit, setPage: setHistoryPage } = history;
  const debouncedHistorySearch = useDebouncedValue(historySearch.trim());
  const canDeleteSales = CAN_DELETE_SALES.includes(authService.getUser()?.user_type_id ?? "");

  useEffect(() => {
    let ignore = false;
    setHistoryLoading(true);
    setHistoryError(null);
    saleService
      .list({ page: historyPage + 1, limit: historyLimit, search: debouncedHistorySearch })
      .then((result) => {
        if (ignore) return;
        if (result.data.length === 0 && historyPage > 0) {
          setHistoryPage(Math.max(0, result.totalPages - 1));
          return;
        }
        setSales(result.data);
        setSalesTotal(result.total);
        setTotalRevenue(result.totalRevenue);
      })
      .catch(() => !ignore && setHistoryError("Não foi possível carregar o histórico de vendas."))
      .finally(() => !ignore && setHistoryLoading(false));
    return () => {
      ignore = true;
    };
  }, [historyPage, historyLimit, debouncedHistorySearch, historyKey, setHistoryPage]);

  const reloadHistory = () => setHistoryKey((key) => key + 1);

  const changeHistorySearch = (value: string) => {
    setHistorySearch(value);
    setHistoryPage(0);
  };

  const handleDeleteSale = async () => {
    if (!saleToDelete) return;
    setDeleting(true);
    try {
      await saleService.remove(saleToDelete.id);
      setSaleToDelete(null);
      reloadHistory();
    } catch {
      setHistoryError("Não foi possível excluir a venda.");
      setSaleToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await productService.getAllWithCategories();
      setProducts(data.products);
    } catch {
      setFeedback({ type: "error", message: "Não foi possível carregar os produtos." });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const selected = products.find((product) => product.id === productId);
  const total = selected ? toNumber(selected.price) * amount : 0;
  const totalStock = useMemo(() => products.reduce((acc, product) => acc + product.amount, 0), [products]);
  const maxStock = Math.max(1, ...products.map((product) => product.amount));

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selected) return;
    setSaving(true);
    setFeedback(null);
    try {
      await productService.sell(selected.id, amount);
      if (historyPage === 0) reloadHistory();
      else setHistoryPage(0);
      setFeedback({ type: "success", message: `Venda de ${amount}x ${selected.name} registrada.` });
      setAmount(1);
      await load();
    } catch {
      setFeedback({ type: "error", message: "Não foi possível registrar a venda. Verifique o estoque disponível." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Vendas" subtitle="Registre vendas e acompanhe a baixa no estoque em tempo real" />

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.1fr 1fr" }, gap: 3, mb: 3 }}>
        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2.5, p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <PointOfSaleIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Nova venda
              </Typography>
            </Box>
            <TextField
              select
              label="Produto"
              value={productId}
              onChange={(e) => {
                setProductId(e.target.value);
                setAmount(1);
              }}
              required
              disabled={isLoading}
            >
              {products.map((product) => (
                <MenuItem key={product.id} value={product.id} disabled={product.amount <= 1}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, width: "100%" }}>
                    <Avatar variant="rounded" src={productImageUrl(product.banner)} sx={{ width: 32, height: 32 }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                        {product.name}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {product.amount} un.
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </TextField>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
              <TextField
                label="Quantidade"
                type="number"
                value={amount}
                onChange={(e) => setAmount(Math.min(Math.max(1, Number(e.target.value)), selected ? Math.max(1, selected.amount - 1) : Infinity))}
                slotProps={{ htmlInput: { min: 1, max: selected ? selected.amount - 1 : undefined } }}
                helperText={selected ? `Em estoque: ${selected.amount} un. · máx. ${selected.amount - 1} por venda` : " "}
                required
              />
              <TextField label="Preço unitário" value={selected ? formatCurrency(selected.price) : "—"} slotProps={{ input: { readOnly: true } }} helperText=" " />
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", bgcolor: "grey.50", borderRadius: 2, px: 2, py: 1.5 }}>
              <Typography color="text.secondary">Total da venda</Typography>
              <Typography variant="h5" color="primary" sx={{ fontWeight: 700 }}>
                {formatCurrency(total)}
              </Typography>
            </Box>
            {feedback && <Alert severity={feedback.type}>{feedback.message}</Alert>}
            <Button type="submit" variant="contained" size="large" disabled={!selected || saving}>
              {saving ? "Registrando..." : "Registrar venda"}
            </Button>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <ReceiptLongIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Histórico de vendas
                </Typography>
              </Box>
              <Tooltip title={`${salesTotal} vendas no total`}>
                <Chip label={formatCurrency(totalRevenue)} color="primary" sx={{ fontWeight: 700 }} />
              </Tooltip>
            </Box>
            <Box sx={{ mb: 1 }}>
              <SearchField value={historySearch} placeholder="Buscar por produto..." onChange={changeHistorySearch} />
            </Box>
            {historyError && (
              <Alert severity="error" sx={{ mb: 1 }}>
                {historyError}
              </Alert>
            )}
            {historyLoading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress size={28} />
              </Box>
            ) : sales.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
                {debouncedHistorySearch ? "Nenhuma venda encontrada." : "Nenhuma venda registrada ainda."}
              </Typography>
            ) : (
              <List disablePadding>
                {sales.map((sale, index) => (
                  <Box key={sale.id}>
                    {index > 0 && <Divider component="li" />}
                    <ListItem
                      disableGutters
                      secondaryAction={
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <Typography sx={{ fontWeight: 700 }}>{formatCurrency(sale.total)}</Typography>
                          {canDeleteSales && (
                            <Tooltip title="Excluir do histórico">
                              <IconButton size="small" color="error" onClick={() => setSaleToDelete(sale)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      }
                      sx={{ pr: canDeleteSales ? 15 : 10 }}
                    >
                      <ListItemAvatar>
                        <Avatar variant="rounded" src={sale.product ? productImageUrl(sale.product.banner) : undefined}>
                          <ReceiptLongIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={`${sale.amount}x ${sale.product_name}`}
                        secondary={[sale.product?.category?.name ?? (sale.product ? null : "Produto removido"), formatSaleDate(sale.created_at)]
                          .filter(Boolean)
                          .join(" · ")}
                        slotProps={{ primary: { sx: { fontWeight: 600 }, noWrap: true } }}
                      />
                    </ListItem>
                  </Box>
                ))}
              </List>
            )}
            {salesTotal > 0 && (
              <ListPagination
                total={salesTotal}
                page={historyPage}
                limit={historyLimit}
                limitOptions={HISTORY_PAGE_SIZES}
                onPageChange={setHistoryPage}
                onLimitChange={history.changeLimit}
              />
            )}
          </CardContent>
        </Card>
      </Box>

      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 3, pb: "8px !important" }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Estoque atual
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {totalStock} unidades no total
            </Typography>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Produto</TableCell>
                  <TableCell>Categoria</TableCell>
                  <TableCell align="right">Preço</TableCell>
                  <TableCell sx={{ width: 280 }}>Estoque</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id} hover selected={product.id === productId}>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Avatar variant="rounded" src={productImageUrl(product.banner)} sx={{ width: 36, height: 36 }} />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {product.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{product.category?.name}</TableCell>
                    <TableCell align="right">{formatCurrency(product.price)}</TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <LinearProgress
                          variant="determinate"
                          value={(product.amount / maxStock) * 100}
                          color={product.amount <= 5 ? "warning" : "primary"}
                          sx={{ flex: 1, height: 8, borderRadius: 4 }}
                        />
                        <Typography variant="body2" sx={{ width: 52, textAlign: "right", fontWeight: 600 }}>
                          {product.amount} un.
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={!!saleToDelete} onClose={() => !deleting && setSaleToDelete(null)}>
        <DialogTitle>Excluir venda do histórico?</DialogTitle>
        <DialogContent>
          <Typography>
            A venda de <strong>{saleToDelete ? `${saleToDelete.amount}x ${saleToDelete.product_name}` : ""}</strong>
            {saleToDelete ? ` (${formatSaleDate(saleToDelete.created_at)})` : ""} será removida do histórico. O estoque do produto não será alterado.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaleToDelete(null)} variant="outlined" disabled={deleting}>
            Cancelar
          </Button>
          <Button onClick={handleDeleteSale} color="error" variant="contained" disabled={deleting}>
            {deleting ? "Excluindo..." : "Excluir"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
