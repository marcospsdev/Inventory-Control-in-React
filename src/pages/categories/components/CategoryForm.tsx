import { useState, useEffect } from "react";
import { TextField, Button, Box, Alert, Stack } from "@mui/material";

// A interface agora usa 'string' para o id, compatível com a API.
interface Category {
  id: string;
  name: string;
}

interface CategoryFormProps {
  initialData: Category | null;
  onSubmit: (categoryData: Omit<Category, "id">) => void;
  onCancel: () => void;
}

export const CategoryForm = ({
  initialData,
  onSubmit,
  onCancel,
}: CategoryFormProps) => {
  const [name, setName] = useState(initialData?.name || "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(initialData?.name || "");
    setError(null);
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("O nome da categoria é obrigatório.");
      return;
    }

    onSubmit({ name });
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TextField
        label="Category Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        error={!!error}
        helperText={error}
      />

      <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
        <Button type="submit" variant="contained">
          {initialData ? "Salvar Edição" : "Criar Categoria"}
        </Button>
        <Button type="button" variant="outlined" onClick={onCancel}>
          Cancelar
        </Button>
      </Stack>
    </Box>
  );
};
