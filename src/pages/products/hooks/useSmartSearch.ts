import { useCallback, useState } from "react";
import {
  aiService,
  toFriendlyAssistantError,
  type SearchIndexStatus,
  type SmartSearchResult,
} from "../../../services/aiService";

const errorMessage = (err: unknown, fallback: string) =>
  toFriendlyAssistantError(err instanceof Error ? err.message : "", fallback);

export const useSmartSearch = () => {
  const [enabled, setEnabled] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SmartSearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<SearchIndexStatus | null>(null);
  const [reindexing, setReindexing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      setStatus(await aiService.searchStatus());
    } catch {
      setStatus(null);
    }
  }, []);

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    setResults(null);
    setError(null);
    setNotice(null);
    if (next) loadStatus();
  };

  const search = async () => {
    const text = query.trim();
    if (text.length < 2 || loading) return;
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      const response = await aiService.smartSearch(text);
      setResults(response.results);
      setStatus((current) => (current ? { ...current, indexed: response.indexed, total: response.total, missing: Math.max(0, response.total - response.indexed) } : current));
    } catch (err) {
      setResults(null);
      setError(errorMessage(err, "Não foi possível fazer a busca inteligente."));
    } finally {
      setLoading(false);
    }
  };

  const reindex = async () => {
    setReindexing(true);
    setError(null);
    setNotice(null);
    try {
      const result = await aiService.reindexSearch();
      setStatus(result.status);
      setNotice(`Índice atualizado: ${result.indexed} produto(s) indexado(s), ${result.unchanged} sem mudanças.`);
    } catch (err) {
      setError(errorMessage(err, "Não foi possível indexar os produtos."));
      loadStatus();
    } finally {
      setReindexing(false);
    }
  };

  const clear = () => {
    setQuery("");
    setResults(null);
    setError(null);
  };

  return { enabled, toggle, query, setQuery, results, loading, error, status, reindexing, reindex, notice, search, clear, loadStatus };
};
