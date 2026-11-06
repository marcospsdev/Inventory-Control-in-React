import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
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
  Typography,
} from "@mui/material";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import { PageHeader } from "../../components/layout/PageHeader";
import {
  productImageUrl,
  productService,
  type ProductWithCategory,
} from "../../services/productService";
import { formatCurrency } from "../../lib/format";

interface SaleRecord {
  id: number;
  product: ProductWithCategory;
  amount: number;
  total: number;
  at: Date;
}

const toNumber = (price: string) => Number(String(price).replace(",", ".")) || 0;

export const SalesPage = () => {
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [productId, setProductId] = useState("");
  const [amount, setAmount] = useState(1);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [sales, setSales] = useState<SaleRecord[]>([]);

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
  const sessionTotal = sales.reduce((acc, sale) => acc + sale.total, 0);
  const totalStock = useMemo(() => products.reduce((acc, product) => acc + product.amount, 0), [products]);
  const maxStock = Math.max(1, ...products.map((product) => product.amount));

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selected) return;
    setSaving(true);
    setFeedback(null);
    try {
      await productService.sell(selected.id, amount);
      setSales((prev) => [{ id: Date.now(), product: selected, amount, total, at: new Date() }, ...prev]);
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
                  Vendas desta sessão
                </Typography>
              </Box>
              <Chip label={formatCurrency(sessionTotal)} color="primary" sx={{ fontWeight: 700 }} />
            </Box>
            {sales.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
                Nenhuma venda registrada ainda.
              </Typography>
            ) : (
              <List disablePadding>
                {sales.map((sale, index) => (
                  <Box key={sale.id}>
                    {index > 0 && <Divider component="li" />}
                    <ListItem disableGutters secondaryAction={<Typography sx={{ fontWeight: 700 }}>{formatCurrency(sale.total)}</Typography>}>
                      <ListItemAvatar>
                        <Avatar variant="rounded" src={productImageUrl(sale.product.banner)} />
                      </ListItemAvatar>
                      <ListItemText
                        primary={`${sale.amount}x ${sale.product.name}`}
                        secondary={`${sale.product.category?.name ?? ""} · ${sale.at.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`}
                        slotProps={{ primary: { sx: { fontWeight: 600 } } }}
                      />
                    </ListItem>
                  </Box>
                ))}
              </List>
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
    </div>
  );
};
