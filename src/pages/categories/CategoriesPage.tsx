import { useState, useEffect, useCallback } from "react";
import {
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { CategoryList } from "./components/CategoryList";
import { CategoryForm } from "./components/CategoryForm";
import { categoryService } from "../../services/categoryService.ts";
import { ListPagination } from "../../components/common/ListPagination";
import { SearchField } from "../../components/common/SearchField";
import { useDebouncedValue, usePagination } from "../../hooks/usePagination";

const PAGE_SIZES = [5, 10, 25];

interface Category {
  id: string;
  name: string;
}

export const CategoriesPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const { page, limit, setPage, changeLimit } = usePagination(PAGE_SIZES[1]);
  const debouncedSearch = useDebouncedValue(search.trim());

  const changeSearch = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await categoryService.list({ page: page + 1, limit, search: debouncedSearch });
      if (result.data.length === 0 && page > 0) {
        setPage(Math.max(0, result.totalPages - 1));
        return;
      }
      setCategories(result.data);
      setTotal(result.total);
    } catch {
      setError("Não foi possível carregar as categorias.");
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, debouncedSearch, setPage]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openCategoryForm = (category: Category | null) => {
    setSelectedCategory(category);
    setIsFormOpen(true);
  };

  const closeCategoryForm = () => {
    setIsFormOpen(false);
    setSelectedCategory(null);
  };

  const handleSaveCategory = async (categoryData: Omit<Category, "id">) => {
    setIsLoading(true);
    setError(null);
    try {
      if (selectedCategory) {
        await categoryService.update(selectedCategory.id, categoryData);
      } else {
        await categoryService.create(categoryData);
      }
      await fetchCategories();
      closeCategoryForm();
    } catch {
      setError("Não foi possível salvar a categoria.");
    } finally {
      setIsLoading(false);
    }
  };

  const openDeleteConfirmation = (id: string) => {
    setCategoryToDelete(id);
    setIsConfirmationOpen(true);
  };

  const closeDeleteConfirmation = () => {
    setIsConfirmationOpen(false);
    setCategoryToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (categoryToDelete !== null) {
      setIsLoading(true);
      setError(null);
      try {
        await categoryService.remove(categoryToDelete);
        await fetchCategories();
        closeDeleteConfirmation();
      } catch {
        setError("Não foi possível excluir a categoria.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const renderListContent = () => {
    if (isLoading) {
      return (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      );
    }
    if (error) {
      return (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      );
    }
    if (categories.length === 0) {
      return (
        <Typography variant="body1" sx={{ mt: 2, textAlign: "center" }}>
          Nenhuma categoria encontrada.
        </Typography>
      );
    }
    return (
      <>
        <CategoryList
          categories={categories}
          onEdit={openCategoryForm}
          onDelete={openDeleteConfirmation}
        />
        <ListPagination
          total={total}
          page={page}
          limit={limit}
          limitOptions={PAGE_SIZES}
          onPageChange={setPage}
          onLimitChange={changeLimit}
        />
      </>
    );
  };

  return (
    <div>
      <Typography variant="h4" component="h1" gutterBottom>
        Gerenciamento de Categorias
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 1.5, mb: 2 }}>
        <SearchField value={search} placeholder="Buscar categoria..." onChange={changeSearch} />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => openCategoryForm(null)}
          disabled={isLoading}
        >
          Nova Categoria
        </Button>
      </Box>

      {renderListContent()}

      <Dialog open={isFormOpen} onClose={closeCategoryForm}>
        <DialogTitle>
          {selectedCategory ? "Editar Categoria" : "Criar Categoria"}
        </DialogTitle>
        <DialogContent>
          <CategoryForm
            initialData={selectedCategory}
            onSubmit={handleSaveCategory}
            onCancel={closeCategoryForm}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={isConfirmationOpen}
        onClose={closeDeleteConfirmation}
        aria-labelledby="alert-dialog-title"
      >
        <DialogTitle id="alert-dialog-title">
          {"Confirmar Exclusão?"}
        </DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja excluir esta categoria? Esta ação não pode
            ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={closeDeleteConfirmation}
            color="primary"
            variant="outlined"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            autoFocus
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
