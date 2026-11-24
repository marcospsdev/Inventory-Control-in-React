import { fetchApi } from "./fetchApi";

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
];

export const toFriendlyAssistantError = (message: string) =>
  FRIENDLY_ERRORS.find(([pattern]) => pattern.test(message))?.[1] ?? "Não foi possível obter a resposta do assistente.";

export const aiService = {
  ask: async (messages: AssistantMessage[]): Promise<AssistantAnswer> => {
    return fetchApi<AssistantAnswer>("/ai/assistant", {
      method: "POST",
      body: JSON.stringify({ messages: messages.slice(-ASSISTANT_HISTORY_LIMIT) }),
    });
  },
};
