import type { Category } from "./categoryService";
import { fetchApi } from "./fetchApi";
import { toQueryString, type PageParams, type Paginated } from "./pagination";

export interface Sale {
  id: string;
  product_id: string | null;
  product_name: string;
  unit_price: string;
  amount: number;
  total: number;
  created_at: string;
  product: {
    id: string;
    banner: string;
    category: Category | null;
  } | null;
}

export interface PaginatedSales extends Paginated<Sale> {
  totalRevenue: number;
  totalUnits: number;
}

export const saleService = {
  list: async ({ page, limit, search }: PageParams): Promise<PaginatedSales> => {
    return fetchApi<PaginatedSales>(`/sales?${toQueryString({ page, limit, search })}`);
  },

  remove: async (id: string): Promise<void> => {
    await fetchApi<void>(`/sales/${id}`, { method: "DELETE" });
  },
};
