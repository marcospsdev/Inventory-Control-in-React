import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  CircularProgress,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import type { Category } from "../../../services/categoryService";
import { AI_IMAGE_TYPES, aiService, toFriendlyAssistantError } from "../../../services/aiService";
import {
  productImageUrl,
  type ProductFormData,
  type ProductWithCategory,
} from "../../../services/productService";

interface ProductFormDialogProps {
  open: boolean;
  product: ProductWithCategory | null;
  categories: Category[];
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (data: ProductFormData) => void;
}

const EMPTY: ProductFormData = {
  name: "",
  price: "",
  description: "",
  amount: 0,
  category_id: "",
  file: null,
};

export const ProductFormDialog = ({
  open,
  product,
  categories,
  saving,
  error,
  onClose,
  onSubmit,
}: ProductFormDialogProps) => {
  const [form, setForm] = useState<ProductFormData>(EMPTY);
  const [preview, setPreview] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{ type: "success" | "error"; message: string; newCategory?: string } | null>(null);

  useEffect(() => {
    if (!open) return;
    setAiResult(null);
    setAiLoading(false);
    if (product) {
      setForm({
        name: product.name,
        price: product.price,
        description: product.description,
        amount: product.amount,
        category_id: product.category_id,
        file: null,
      });
      setPreview(productImageUrl(product.banner));
    } else {
      setForm(EMPTY);
      setPreview(null);
    }
  }, [open, product]);

  useEffect(() => {
    if (!form.file) return;
    const url = URL.createObjectURL(form.file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [form.file]);

  const set = <K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      set("file", file);
      setAiResult(null);
    }
  };

  const fillWithAi = async () => {
    if (!form.file) return;
    if (!AI_IMAGE_TYPES.includes(form.file.type)) {
      setAiResult({ type: "error", message: "Formato de imagem não suportado pela IA. Use JPG, PNG, WEBP ou GIF." });
      return;
    }
    setAiLoading(true);
    setAiResult(null);
    try {
      const suggestion = await aiService.suggestProduct(form.file, form.name);
      const canChangeCategory = !product && !!suggestion.category_id;
      setForm((prev) => ({
        ...prev,
        name: suggestion.name || prev.name,
        description: suggestion.description || prev.description,
        category_id: canChangeCategory ? suggestion.category_id! : prev.category_id,
      }));
      setAiResult({
        type: "success",
        message: "Campos preenchidos pela IA. Revise antes de salvar; preço e quantidade continuam com você.",
        newCategory: !product && !suggestion.category_id ? suggestion.new_category_name ?? undefined : undefined,
      });
    } catch (err) {
      setAiResult({
        type: "error",
        message: toFriendlyAssistantError(err instanceof Error ? err.message : "", "Não foi possível obter a sugestão da IA."),
      });
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit(form);
  };

  const missingImage = !product && !form.file;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {product ? "Editar produto" : "Novo produto"}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "280px 1fr" }, gap: 3, pt: 1 }}>
            <Box>
              <Box
                component="label"
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  aspectRatio: "1 / 1",
                  borderRadius: 3,
                  border: "2px dashed",
                  borderColor: preview ? "transparent" : "divider",
                  bgcolor: "grey.50",
                  overflow: "hidden",
                  cursor: "pointer",
                  position: "relative",
                }}
              >
                {preview ? (
                  <Box component="img" src={preview} alt="Pré-visualização" sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <>
                    <CloudUploadIcon color="primary" sx={{ fontSize: 44 }} />
                    <Typography variant="body2" sx={{ mt: 1, fontWeight: 600 }}>
                      Clique para enviar a imagem
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      PNG ou JPG
                    </Typography>
                  </>
                )}
                <input hidden type="file" accept="image/*" onChange={handleFile} />
              </Box>
              <Button component="label" fullWidth variant="outlined" startIcon={<CloudUploadIcon />} sx={{ mt: 1.5 }}>
                {preview ? "Trocar imagem" : "Selecionar imagem"}
                <input hidden type="file" accept="image/*" onChange={handleFile} />
              </Button>
              {form.file && (
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }} noWrap>
                  {form.file.name}
                </Typography>
              )}
              <Tooltip title={form.file ? "" : "Selecione uma foto do produto para a IA analisar"}>
                <span>
                  <Button
                    fullWidth
                    variant="contained"
                    color="secondary"
                    startIcon={aiLoading ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeIcon />}
                    onClick={fillWithAi}
                    disabled={!form.file || aiLoading || saving}
                    sx={{ mt: 1.5 }}
                  >
                    {aiLoading ? "Analisando a foto..." : "Preencher com IA"}
                  </Button>
                </span>
              </Tooltip>
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {aiResult && (
                <Alert severity={aiResult.type === "success" ? "info" : "warning"} icon={<AutoAwesomeIcon fontSize="inherit" />} onClose={() => setAiResult(null)}>
                  {aiResult.message}
                  {aiResult.newCategory && (
                    <Box component="span" sx={{ display: "block", mt: 0.5 }}>
                      Nenhuma categoria cadastrada combina. Sugestão de nova categoria: <strong>{aiResult.newCategory}</strong>
                    </Box>
                  )}
                </Alert>
              )}
              <TextField label="Nome" value={form.name} onChange={(e) => set("name", e.target.value)} required fullWidth />
              <TextField
                select
                label="Categoria"
                value={form.category_id}
                onChange={(e) => set("category_id", e.target.value)}
                required
                fullWidth
                disabled={!!product}
              >
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </TextField>
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                <TextField
                  label="Preço (R$)"
                  value={form.price}
                  onChange={(e) => set("price", e.target.value.replace(/[^\d.,]/g, ""))}
                  required
                  slotProps={{ htmlInput: { inputMode: "decimal" } }}
                />
                <TextField
                  label="Quantidade em estoque"
                  type="number"
                  value={form.amount}
                  onChange={(e) => set("amount", Math.max(0, Number(e.target.value)))}
                  required
                />
              </Box>
              <TextField
                label="Descrição"
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                required
                multiline
                minRows={4}
                fullWidth
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={saving || missingImage}>
            {saving ? "Salvando..." : "Salvar produto"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};
