import { fetchApi } from "./fetchApi";
import { toQueryString, type PageParams, type Paginated } from "./pagination";

export interface Category {
  id: string;
  name: string;
}

interface CategoryData {
  name: string;
}

export const categoryService = {
  getAll: async (): Promise<Category[]> => {
    return fetchApi<Category[]>("/categories");
  },

  list: async ({ page, limit, search }: PageParams): Promise<Paginated<Category>> => {
    return fetchApi<Paginated<Category>>(`/categories?${toQueryString({ page, limit, search })}`);
  },

  create: async (categoryData: CategoryData): Promise<Category> => {
    return fetchApi<Category>("/category", {
      method: "POST",
      body: JSON.stringify(categoryData),
    });
  },

  update: async (id: string, categoryData: CategoryData): Promise<Category> => {
    return fetchApi<Category>(`/category/${id}`, {
      method: "PUT",
      body: JSON.stringify(categoryData),
    });
  },

  remove: async (id: string): Promise<void> => {
    await fetchApi<void>(`/category/${id}`, {
      method: "DELETE",
    });
  },
};
