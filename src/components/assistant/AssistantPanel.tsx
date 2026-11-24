import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  Fab,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CloseIcon from "@mui/icons-material/Close";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import SendIcon from "@mui/icons-material/Send";
import { AssistantText } from "./AssistantText";
import {
  ASSISTANT_MESSAGE_LIMIT,
  aiService,
  toFriendlyAssistantError,
  type AssistantMessage,
} from "../../services/aiService";

interface ChatEntry extends AssistantMessage {
  id: number;
  toolsUsed?: string[];
}

const SUGGESTIONS = [
  "Quais produtos estão acabando?",
  "Resumo das vendas dos últimos 30 dias",
  "Qual é o valor total do estoque?",
  "Quais foram os 3 produtos mais vendidos?",
];

const TOOL_LABELS: Record<string, string> = {
  list_products: "produtos",
  stock_overview: "resumo do estoque",
  sales_summary: "vendas",
  list_categories: "categorias",
};

const PANEL_WIDTH = 420;

const describeTools = (tools: string[]) =>
  [...new Set(tools)].map((tool) => TOOL_LABELS[tool] ?? tool).join(", ");

export const AssistantPanel = () => {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [entries, sending, error]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  const ask = async (history: ChatEntry[]) => {
    setSending(true);
    setError(null);
    try {
      const answer = await aiService.ask(history.map(({ role, content }) => ({ role, content })));
      setEntries((current) => [
        ...current,
        { id: Date.now(), role: "assistant", content: answer.reply || "Não encontrei uma resposta para isso.", toolsUsed: answer.toolsUsed },
      ]);
    } catch (err) {
      setError(toFriendlyAssistantError(err instanceof Error ? err.message : ""));
    } finally {
      setSending(false);
    }
  };

  const send = (text: string) => {
    const content = text.trim();
    if (!content || sending) return;
    const history = [...entries, { id: Date.now(), role: "user" as const, content }];
    setEntries(history);
    setInput("");
    ask(history);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    send(input);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      send(input);
    }
  };

  const retry = () => {
    if (entries.length && entries[entries.length - 1].role === "user") ask(entries);
  };

  const clear = () => {
    setEntries([]);
    setError(null);
  };

  return (
    <>
      {!open && (
        <Tooltip title="Assistente de estoque (IA)" placement="left">
          <Fab
            color="primary"
            aria-label="Abrir assistente de estoque"
            onClick={() => setOpen(true)}
            sx={{ position: "fixed", right: 24, bottom: 24, zIndex: (theme) => theme.zIndex.drawer + 1 }}
          >
            <AutoAwesomeIcon />
          </Fab>
        </Tooltip>
      )}

      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        slotProps={{ paper: { sx: { width: { xs: "100%", sm: PANEL_WIDTH }, display: "flex", flexDirection: "column" } } }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1.5 }}>
          <Avatar sx={{ bgcolor: "primary.main", width: 36, height: 36 }}>
            <AutoAwesomeIcon fontSize="small" />
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              Assistente de estoque
            </Typography>
            <Typography variant="caption" color="text.secondary">
              IA · Amazon Bedrock
            </Typography>
          </Box>
          <Tooltip title="Limpar conversa">
            <span>
              <IconButton size="small" onClick={clear} disabled={!entries.length || sending}>
                <DeleteSweepIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Fechar">
            <IconButton size="small" onClick={() => setOpen(false)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <Divider />

        <Box ref={scrollRef} sx={{ flex: 1, overflowY: "auto", px: 2, py: 2, bgcolor: "grey.50", display: "flex", flexDirection: "column", gap: 1.5 }}>
          {entries.length === 0 && (
            <Box sx={{ textAlign: "center", my: "auto", px: 1 }}>
              <AutoAwesomeIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Como posso ajudar?
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Pergunte sobre produtos, estoque e vendas. Eu consulto os dados reais antes de responder.
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "center" }}>
                {SUGGESTIONS.map((suggestion) => (
                  <Chip key={suggestion} label={suggestion} variant="outlined" onClick={() => send(suggestion)} sx={{ bgcolor: "background.paper" }} />
                ))}
              </Box>
            </Box>
          )}

          {entries.map((entry) => {
            const mine = entry.role === "user";
            return (
              <Box key={entry.id} sx={{ display: "flex", flexDirection: "column", alignItems: mine ? "flex-end" : "flex-start" }}>
                <Box
                  sx={{
                    maxWidth: "88%",
                    px: 1.75,
                    py: 1.25,
                    borderRadius: 2.5,
                    borderTopRightRadius: mine ? 4 : undefined,
                    borderTopLeftRadius: mine ? undefined : 4,
                    bgcolor: mine ? "primary.main" : "background.paper",
                    color: mine ? "primary.contrastText" : "text.primary",
                    border: mine ? "none" : "1px solid",
                    borderColor: "divider",
                    wordBreak: "break-word",
                  }}
                >
                  {mine ? (
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                      {entry.content}
                    </Typography>
                  ) : (
                    <AssistantText text={entry.content} />
                  )}
                </Box>
                {!mine && entry.toolsUsed && entry.toolsUsed.length > 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 0.5 }}>
                    Consultou: {describeTools(entry.toolsUsed)}
                  </Typography>
                )}
              </Box>
            );
          })}

          {sending && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "text.secondary" }}>
              <CircularProgress size={16} />
              <Typography variant="body2">Consultando os dados...</Typography>
            </Box>
          )}

          {error && (
            <Alert
              severity="warning"
              action={
                <Button color="inherit" size="small" onClick={retry}>
                  Tentar de novo
                </Button>
              }
            >
              {error}
            </Alert>
          )}
        </Box>

        <Divider />
        <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", alignItems: "flex-end", gap: 1, p: 1.5 }}>
          <TextField
            inputRef={inputRef}
            fullWidth
            multiline
            maxRows={4}
            size="small"
            placeholder="Pergunte sobre o estoque ou as vendas..."
            value={input}
            onChange={(event) => setInput(event.target.value.slice(0, ASSISTANT_MESSAGE_LIMIT))}
            onKeyDown={handleKeyDown}
            disabled={sending}
            helperText={input.length > ASSISTANT_MESSAGE_LIMIT * 0.8 ? `${input.length}/${ASSISTANT_MESSAGE_LIMIT}` : "Enter envia · Shift+Enter quebra linha"}
          />
          <Tooltip title="Enviar">
            <span>
              <IconButton type="submit" color="primary" disabled={!input.trim() || sending} sx={{ mb: 2.75 }}>
                <SendIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Drawer>
    </>
  );
};
