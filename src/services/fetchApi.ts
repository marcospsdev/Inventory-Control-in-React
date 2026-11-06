import { API_BASE_URL } from "../config/apiConfig";

// Tipagem para os cabeçalhos
interface HeadersInit {
  [key: string]: string;
}

// Opções da requisição, incluindo o corpo para POST/PUT
interface RequestOptions {
  method?: string;
  headers?: HeadersInit;
  body?: string | FormData;
}

// Função utilitária que envolve o 'fetch' e adiciona o token
export const fetchApi = async <T>(
  endpoint: string,
  options?: RequestOptions,
): Promise<T> => {
  const token = localStorage.getItem("authToken");
  const isFormData = options?.body instanceof FormData;

  const headers: HeadersInit = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options?.headers || {}), // Mescla os headers existentes
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.error || "Ocorreu um erro na requisição.");
  }

  return data as T;
};
