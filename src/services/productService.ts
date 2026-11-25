import { FILES_BASE_URL } from "../config/apiConfig";
import { categoryService, type Category } from "./categoryService";
import { fetchApi } from "./fetchApi";
import { toQueryString, type PageParams, type Paginated } from "./pagination";

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

export interface StockEntryItem {
  product_id: string;
  amount: number;
}

export interface StockEntryResult {
  source: string;
  reference: string | null;
  totalUnits: number;
  products: { id: string; name: string; amount: number; added: number }[];
}

export type StockSummaryItem =Pick<Product, "id" | "name" | "amount" | "category_id">;

export interface ProductPageParams extends PageParams {
  categoryId?: string;
}

export const productService = {
  getStockSummary: async (): Promise<StockSummaryItem[]> => {
    return fetchApi<StockSummaryItem[]>("/products");
  },

  list: async ({ page, limit, search, categoryId }: ProductPageParams): Promise<Paginated<ProductWithCategory>> => {
    return fetchApi<Paginated<ProductWithCategory>>(
      `/products?${toQueryString({ page, limit, search, category_id: categoryId })}`,
    );
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

  addStock: async (items: StockEntryItem[], source: "manual" | "invoice", reference?: string): Promise<StockEntryResult> => {
    return fetchApi<StockEntryResult>("/stock-entries", { method: "POST", body: JSON.stringify({ items, source, reference }) });
  },
};
