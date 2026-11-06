import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  Typography,
} from "@mui/material";
import type { Category } from "../../../services/categoryService";
import { productImageUrl, productService, type Product } from "../../../services/productService";
import { formatCurrency } from "../../../lib/format";

interface ProductDetailDialogProps {
  productId: string | null;
  categories: Category[];
  onClose: () => void;
}

export const ProductDetailDialog = ({ productId, categories, onClose }: ProductDetailDialogProps) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) return;
    setProduct(null);
    setError(null);
    productService
      .getById(productId)
      .then(setProduct)
      .catch(() => setError("Não foi possível carregar o produto."));
  }, [productId]);

  const category = categories.find((item) => item.id === product?.category_id);

  return (
    <Dialog open={!!productId} onClose={onClose} maxWidth="md" fullWidth>
      <DialogContent sx={{ p: 0 }}>
        {error && <Alert severity="error" sx={{ m: 3 }}>{error}</Alert>}
        {!product && !error && (
          <Box display="flex" justifyContent="center" py={8}>
            <CircularProgress />
          </Box>
        )}
        {product && (
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
            <Box component="img" src={productImageUrl(product.banner)} alt={product.name} sx={{ width: "100%", height: "100%", minHeight: 320, objectFit: "cover", bgcolor: "grey.100" }} />
            <Box sx={{ p: 4, display: "flex", flexDirection: "column", gap: 2 }}>
              {category && <Chip label={category.name} size="small" color="primary" variant="outlined" sx={{ alignSelf: "flex-start", fontWeight: 600 }} />}
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {product.name}
              </Typography>
              <Typography variant="h4" color="primary" sx={{ fontWeight: 700 }}>
                {formatCurrency(product.price)}
              </Typography>
              <Typography color="text.secondary">{product.description}</Typography>
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mt: "auto" }}>
                <Box sx={{ bgcolor: "grey.50", borderRadius: 2, p: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Em estoque
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {product.amount} un.
                  </Typography>
                </Box>
                <Box sx={{ bgcolor: "grey.50", borderRadius: 2, p: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Cadastrado em
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {product.created_at ? new Date(product.created_at).toLocaleDateString("pt-BR") : "—"}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Fechar</Button>
      </DialogActions>
    </Dialog>
  );
};
