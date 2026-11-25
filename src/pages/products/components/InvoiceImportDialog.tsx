import { useEffect, useState, type ChangeEvent } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { AI_INVOICE_TYPES, aiService, toFriendlyAssistantError, type InvoiceExtraction } from "../../../services/aiService";
import { productService, type StockSummaryItem } from "../../../services/productService";
import { formatCurrency } from "../../../lib/format";

interface InvoiceImportDialogProps {
  open: boolean;
  products: StockSummaryItem[];
  onClose: () => void;
  onImported: (message: string) => void;
}

interface ReviewRow {
  key: number;
  description: string;
  unitPrice: number | null;
  productId: string;
  quantity: number;
  include: boolean;
  matchedByAi: boolean;
}

const errorMessage = (err: unknown, fallback: string) => toFriendlyAssistantError(err instanceof Error ? err.message : "", fallback);

const formatDate = (value: string | null) => (value ? new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR") : null);

export const InvoiceImportDialog = ({ open, products, onClose, onImported }: InvoiceImportDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [reading, setReading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<InvoiceExtraction | null>(null);
  const [rows, setRows] = useState<ReviewRow[]>([]);

  useEffect(() => {
    if (!open) return;
    setFile(null);
    setInvoice(null);
    setRows([]);
    setError(null);
    setReading(false);
    setSaving(false);
  }, [open]);

  const stockOf = (productId: string) => products.find((product) => product.id === productId)?.amount ?? 0;

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    event.target.value = "";
    if (!selected) return;
    if (!AI_INVOICE_TYPES.includes(selected.type)) {
      setError("Formato não suportado. Envie a nota em PDF, JPG, PNG ou WEBP.");
      return;
    }
    setError(null);
    setFile(selected);
    setInvoice(null);
    setRows([]);
  };

  const readInvoice = async () => {
    if (!file) return;
    setReading(true);
    setError(null);
    try {
      const result = await aiService.extractInvoice(file);
      setInvoice(result);
      setRows(
        result.items.map((item, index) => ({
          key: index,
          description: item.description,
          unitPrice: item.unit_price,
          productId: item.product_id ?? "",
          quantity: item.quantity ?? 1,
          include: !!item.product_id && !!item.quantity,
          matchedByAi: !!item.product_id,
        })),
      );
    } catch (err) {
      setError(errorMessage(err, "Não foi possível ler a nota com a IA."));
    } finally {
      setReading(false);
    }
  };

  const updateRow = (key: number, changes: Partial<ReviewRow>) =>
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...changes } : row)));

  const selected = rows.filter((row) => row.include && row.productId && row.quantity > 0);
  const totalUnits = selected.reduce((sum, row) => sum + row.quantity, 0);

  const confirm = async () => {
    if (!selected.length) return;
    setSaving(true);
    setError(null);
    try {
      const reference = [invoice?.invoice_number && `NF ${invoice.invoice_number}`, invoice?.supplier].filter(Boolean).join(" · ");
      const result = await productService.addStock(
        selected.map((row) => ({ product_id: row.productId, amount: row.quantity })),
        "invoice",
        reference || undefined,
      );
      onImported(`Entrada registrada: ${result.totalUnits} unidade(s) em ${result.products.length} produto(s)${reference ? ` (${reference})` : ""}.`);
    } catch (err) {
      setError(err instanceof Error && err.message ? `Não foi possível dar entrada no estoque: ${err.message}` : "Não foi possível dar entrada no estoque.");
    } finally {
      setSaving(false);
    }
  };

  const busy = reading || saving;

  return (
    <Dialog open={open} onClose={() => !busy && onClose()} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
        <ReceiptLongIcon color="secondary" />
        Importar nota fiscal com IA
      </DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Envie a nota ou o pedido do fornecedor (PDF ou foto). A IA lê os itens e sugere o produto do estoque de cada linha. Nada é salvo até você conferir e confirmar.
        </Typography>

        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5 }}>
          <Button component="label" variant="outlined" startIcon={<UploadFileIcon />} disabled={busy}>
            {file ? "Trocar arquivo" : "Selecionar nota"}
            <input hidden type="file" accept={AI_INVOICE_TYPES.join(",")} onChange={handleFile} />
          </Button>
          {file && (
            <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
              {file.name}
            </Typography>
          )}
          <Box sx={{ flex: 1 }} />
          <Button
            variant="contained"
            color="secondary"
            startIcon={reading ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeIcon />}
            onClick={readInvoice}
            disabled={!file || busy}
          >
            {reading ? "Lendo a nota..." : invoice ? "Ler de novo" : "Ler nota com IA"}
          </Button>
        </Box>

        {error && <Alert severity="warning">{error}</Alert>}

        {invoice && (
          <>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {invoice.supplier && <Chip label={`Fornecedor: ${invoice.supplier}`} />}
              {invoice.invoice_number && <Chip label={`Nº ${invoice.invoice_number}`} />}
              {invoice.issue_date && <Chip label={`Emissão: ${formatDate(invoice.issue_date)}`} />}
              <Chip color={invoice.matched === invoice.items.length ? "success" : "warning"} variant="outlined" label={`${invoice.matched} de ${invoice.items.length} itens reconhecidos pela IA`} />
            </Box>

            <TableContainer sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox" />
                    <TableCell>Item na nota</TableCell>
                    <TableCell sx={{ width: 300 }}>Produto do estoque</TableCell>
                    <TableCell sx={{ width: 110 }}>Quantidade</TableCell>
                    <TableCell align="right" sx={{ width: 150 }}>
                      Estoque
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.key} hover selected={row.include && !!row.productId}>
                      <TableCell padding="checkbox">
                        <Checkbox checked={row.include} disabled={!row.productId || busy} onChange={(e) => updateRow(row.key, { include: e.target.checked })} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {row.description || "—"}
                        </Typography>
                        {row.unitPrice !== null && (
                          <Typography variant="caption" color="text.secondary">
                            {formatCurrency(row.unitPrice)} un.
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <TextField
                          select
                          size="small"
                          fullWidth
                          value={row.productId}
                          disabled={busy}
                          onChange={(e) => updateRow(row.key, { productId: e.target.value, include: !!e.target.value })}
                          helperText={row.matchedByAi && row.productId ? "Sugerido pela IA" : !row.productId ? "Escolha o produto ou deixe sem importar" : " "}
                        >
                          <MenuItem value="">
                            <em>Não importar</em>
                          </MenuItem>
                          {products.map((product) => (
                            <MenuItem key={product.id} value={product.id}>
                              {product.name}
                            </MenuItem>
                          ))}
                        </TextField>
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={row.quantity}
                          disabled={busy}
                          onChange={(e) => updateRow(row.key, { quantity: Math.min(100000, Math.max(1, Math.round(Number(e.target.value) || 1))) })}
                          slotProps={{ htmlInput: { min: 1 } }}
                          helperText=" "
                        />
                      </TableCell>
                      <TableCell align="right">
                        {row.productId ? (
                          <Typography variant="body2">
                            {stockOf(row.productId)} →{" "}
                            <strong>{row.include ? stockOf(row.productId) + row.quantity : stockOf(row.productId)}</strong> un.
                          </Typography>
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            —
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Typography variant="caption" color="text.secondary">
              Confira cada linha: a IA pode errar. Itens que não existem no estoque precisam ser cadastrados antes em "Novo produto".
            </Typography>
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        {invoice && (
          <Typography variant="body2" color="text.secondary" sx={{ mr: "auto" }}>
            {selected.length} item(ns) · {totalUnits} unidade(s) para entrada
          </Typography>
        )}
        <Button onClick={onClose} disabled={busy}>
          Cancelar
        </Button>
        <Button variant="contained" onClick={confirm} disabled={!selected.length || busy} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}>
          {saving ? "Registrando..." : "Dar entrada no estoque"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
