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

export type RestockStatus = "out" | "critical" | "low";

export interface RestockItem {
  product_id: string;
  name: string;
  category: string | null;
  stock: number;
  unitsSold: number;
  dailyRate: number;
  daysLeft: number | null;
  suggestedRestock: number;
  status: RestockStatus;
}

interface PeriodTotals {
  sales: number;
  units: number;
  revenue: number;
}

export interface RestockForecast {
  periodDays: number;
  coverageDays: number;
  current: PeriodTotals;
  previous: PeriodTotals;
  counts: Record<RestockStatus, number>;
  items: RestockItem[];
}

export const saleService = {
  restockForecast: async (days: number): Promise<RestockForecast> => {
    return fetchApi<RestockForecast>(`/sales/restock-forecast?${toQueryString({ days })}`);
  },

  list: async ({ page, limit, search }: PageParams): Promise<PaginatedSales> => {
    return fetchApi<PaginatedSales>(`/sales?${toQueryString({ page, limit, search })}`);
  },

  remove: async (id: string): Promise<void> => {
    await fetchApi<void>(`/sales/${id}`, { method: "DELETE" });
  },
};
