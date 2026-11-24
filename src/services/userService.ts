import { fetchApi } from "./fetchApi";
import { toQueryString, type PageParams, type Paginated } from "./pagination";

export interface User {
  id: string;
  name: string;
  email: string;
  user_type_id: string;
}

export interface UserFormData {
  name: string;
  email: string;
  password?: string;
  user_type_id: string;
}

export const USER_PROFILES = [
  { id: "af77c7f3-c5b9-4a99-b145-c6328a6f8745", label: "Administrador", color: "error" },
  { id: "e88d7f1d-f8f8-4e8c-8a24-2c6c1a8a25c3", label: "Operador", color: "info" },
  { id: "f88d7f1d-f8f8-4e8c-8a24-2c6c1a8a25c3", label: "Vendedor", color: "success" },
] as const;

export const profileOf = (userTypeId: string) =>
  USER_PROFILES.find((profile) => profile.id === userTypeId);

export interface PaginatedUsers extends Paginated<User> {
  countsByType: Record<string, number>;
}

export const userService = {
  getAll: async (): Promise<User[]> => {
    return fetchApi<User[]>("/users");
  },

  list: async ({ page, limit, search }: PageParams): Promise<PaginatedUsers> => {
    return fetchApi<PaginatedUsers>(`/users?${toQueryString({ page, limit, search })}`);
  },

  getById: async (id: string): Promise<User> => {
    return fetchApi<User>(`/user/${id}`);
  },

  updatePassword: async (id: string, password: string): Promise<User> => {
    return fetchApi<User>(`/user/password/${id}`, {
      method: "PUT",
      body: JSON.stringify({ password }),
    });
  },

  create: async (data: UserFormData): Promise<User> => {
    return fetchApi<User>("/user", { method: "POST", body: JSON.stringify(data) });
  },

  update: async (id: string, data: UserFormData): Promise<User> => {
    const { name, email, user_type_id } = data;
    return fetchApi<User>(`/user/${id}`, {
      method: "PUT",
      body: JSON.stringify({ name, email, user_type_id }),
    });
  },

  remove: async (id: string): Promise<void> => {
    await fetchApi<void>(`/user/${id}`, { method: "DELETE" });
  },
};
