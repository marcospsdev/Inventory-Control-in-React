import { FILES_BASE_URL } from "../config/apiConfig";
import { categoryService, type Category } from "./categoryService";
import { fetchApi } from "./fetchApi";

export interface Product {
  id: string;
  name: string;
  price: string;
  description: string;
  banner: string;
  amount: number;
  category_id: string;
  created_at?: string;
}

export interface ProductWithCategory extends Product {
  category: Category | null;
}

export interface ProductFormData {
  name: string;
  price: string;
  description: string;
  amount: number;
  category_id: string;
  file: File | null;
}

const toFormData = (data: ProductFormData) => {
  const form = new FormData();
  form.append("name", data.name);
  form.append("price", data.price);
  form.append("description", data.description);
  form.append("amount", String(data.amount));
  form.append("category_id", data.category_id);
  if (data.file) form.append("file", data.file);
  return form;
};

export const productImageUrl = (banner: string) => `${FILES_BASE_URL}/${banner}`;

export type StockSummaryItem = Pick<Product, "id" | "name" | "amount">;

export const productService = {
  getStockSummary: async (): Promise<StockSummaryItem[]> => {
    return fetchApi<StockSummaryItem[]>("/products");
  },

  getById: async (id: string): Promise<Product> => {
    return fetchApi<Product>(`/product/${id}`);
  },

  getAllWithCategories: async (): Promise<{ products: ProductWithCategory[]; categories: Category[] }> => {
    const categories = await categoryService.getAll();
    const lists = await Promise.all(
      categories.map((category) => fetchApi<Product[]>(`/products/${category.id}`)),
    );
    const products = lists
      .flat()
      .map((product) => ({
        ...product,
        category: categories.find((category) => category.id === product.category_id) ?? null,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    return { products, categories };
  },

  create: async (data: ProductFormData): Promise<Product> => {
    return fetchApi<Product>("/product", { method: "POST", body: toFormData(data) });
  },

  update: async (id: string, data: ProductFormData): Promise<Product> => {
    return fetchApi<Product>(`/product/${id}`, { method: "PUT", body: toFormData(data) });
  },

  remove: async (id: string): Promise<void> => {
    await fetchApi<void>(`/product/${id}`, { method: "DELETE" });
  },

  sell: async (id: string, amount: number): Promise<Pick<Product, "id" | "name" | "amount">> => {
    return fetchApi(`/sale/${id}`, { method: "PUT", body: JSON.stringify({ amount }) });
  },
};
