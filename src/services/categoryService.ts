import { fetchApi } from "./fetchApi";

interface Category {
  id: string;
  name: string;
}

interface CategoryData {
  name: string;
}

export const categoryService = {
  getAll: async (): Promise<Category[]> => {
    return fetchApi<Category[]>("/category/all");
  },

  create: async (categoryData: CategoryData): Promise<Category> => {
    return fetchApi<Category>("/category", {
      method: "POST",
      body: JSON.stringify(categoryData),
    });
  },

  update: async (id: string, categoryData: CategoryData): Promise<Category> => {
    return fetchApi<Category>(`/category/edit/${id}`, {
      method: "PUT",
      body: JSON.stringify(categoryData),
    });
  },

  remove: async (id: string): Promise<void> => {
    await fetchApi<void>(`/category/remove/${id}`, {
      method: "DELETE",
    });
  },
};
