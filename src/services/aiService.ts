import { fetchApi } from "./fetchApi";
import { toQueryString } from "./pagination";
import type { ProductWithCategory } from "./productService";

export interface AssistantMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AssistantAnswer {
  reply: string;
  model: string;
  region: string;
  toolsUsed: string[];
  usage: { inputTokens: number; outputTokens: number };
}

export const ASSISTANT_HISTORY_LIMIT = 10;
export const ASSISTANT_MESSAGE_LIMIT = 2000;

const FRIENDLY_ERRORS: [RegExp, string][] = [
  [/credentials were not found/i, "A IA ainda não está configurada: faltam as credenciais da AWS no arquivo .env.aws da API."],
  [/quotas .* still 0|operation not allowed/i, "A IA está indisponível: as cotas do Amazon Bedrock desta conta AWS ainda estão zeradas."],
  [/do not have permission/i, "A credencial da AWS configurada não tem permissão para usar este modelo do Bedrock."],
  [/too many requests|busy/i, "O assistente está recebendo muitas perguntas agora. Tente de novo em alguns segundos."],
  [/too many tool calls/i, "O assistente não conseguiu concluir a resposta. Tente reformular a pergunta."],
  [/have expired/i, "A chave da AWS configurada na API expirou. Gere uma nova chave de API no Bedrock."],
  [/unsupported image format/i, "Formato de imagem não suportado pela IA. Use JPG, PNG, WEBP ou GIF."],
  [/image too large|file too large/i, "A imagem é grande demais para a IA. Use uma imagem de até 3,75 MB."],
  [/could not identify the product|did not return a product suggestion/i, "A IA não conseguiu identificar o produto na foto. Tente outra imagem."],
  [/did not return the sales analysis/i, "A IA não conseguiu montar a análise agora. Tente gerar de novo."],
  [/search index is empty/i, "O índice da busca inteligente ainda está vazio. Clique em \"Indexar produtos\" para criá-lo."],
  [/search must have between/i, "Descreva o que procura com 2 a 200 caracteres."],
  [/model identifier is invalid|on-demand throughput isn.t supported/i, "O modelo de IA configurado não está disponível nesta região da AWS."],
];

export const toFriendlyAssistantError = (message: string, fallback = "Não foi possível obter a resposta do assistente.") =>
  FRIENDLY_ERRORS.find(([pattern]) => pattern.test(message))?.[1] ?? fallback;

export interface ProductSuggestion {
  name: string;
  description: string;
  category_id: string | null;
  category_name: string | null;
  new_category_name: string | null;
  model: string;
  usage: { inputTokens: number; outputTokens: number };
}

export const AI_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export interface SalesInsights {
  periodDays: number;
  headline: string;
  insights: string[];
  actions: string[];
  generatedAt: string;
  model: string;
  usage: { inputTokens: number; outputTokens: number };
}

export interface SmartSearchResult extends ProductWithCategory {
  score: number;
}

export interface SmartSearchResponse {
  query: string;
  results: SmartSearchResult[];
  indexed: number;
  total: number;
  cached: boolean;
}

export interface SearchIndexStatus {
  total: number;
  indexed: number;
  missing: number;
  model: string;
}

export interface ReindexResult {
  total: number;
  indexed: number;
  unchanged: number;
  status: SearchIndexStatus;
}

export const aiService = {
  smartSearch: async (query: string): Promise<SmartSearchResponse> => {
    return fetchApi<SmartSearchResponse>(`/ai/search?${toQueryString({ q: query, limit: 24 })}`);
  },

  searchStatus: async (): Promise<SearchIndexStatus> => {
    return fetchApi<SearchIndexStatus>("/ai/search/status");
  },

  reindexSearch: async (force = false): Promise<ReindexResult> => {
    return fetchApi<ReindexResult>("/ai/search/reindex", { method: "POST", body: JSON.stringify({ force }) });
  },

  salesInsights: async (days: number): Promise<SalesInsights> => {
    return fetchApi<SalesInsights>("/ai/sales-insights", { method: "POST", body: JSON.stringify({ days }) });
  },

  suggestProduct: async (file: File, hint?: string): Promise<ProductSuggestion> => {
    const form = new FormData();
    form.append("file", file);
    if (hint?.trim()) form.append("hint", hint.trim());
    return fetchApi<ProductSuggestion>("/ai/product-suggestion", { method: "POST", body: form });
  },

  ask: async (messages: AssistantMessage[]): Promise<AssistantAnswer> => {
    return fetchApi<AssistantAnswer>("/ai/assistant", {
      method: "POST",
      body: JSON.stringify({ messages: messages.slice(-ASSISTANT_HISTORY_LIMIT) }),
    });
  },
};
