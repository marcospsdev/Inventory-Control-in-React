import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import InsightsIcon from "@mui/icons-material/Insights";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import { saleService, type RestockForecast, type RestockStatus } from "../../../services/saleService";
import { aiService, toFriendlyAssistantError, type SalesInsights } from "../../../services/aiService";
import { formatCurrency } from "../../../lib/format";

const PERIODS = [7, 30, 90];
const VISIBLE_ROWS = 8;

const STATUS: Record<RestockStatus, { label: string; color: "error" | "warning" }> = {
  out: { label: "Sem estoque", color: "error" },
  critical: { label: "Crítico", color: "error" },
  low: { label: "Baixo", color: "warning" },
};

const formatNumber = (value: number, digits = 1) =>
  value.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: digits });

const variation = (current: number, previous: number) =>
  previous > 0 ? Math.round(((current - previous) / previous) * 1000) / 10 : null;

export const RestockInsightsCard = ({ refreshKey }: { refreshKey: number }) => {
  const [days, setDays] = useState(30);
  const [forecast, setForecast] = useState<RestockForecast | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [insights, setInsights] = useState<SalesInsights | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError(null);
    saleService
      .restockForecast(days)
      .then((data) => !ignore && setForecast(data))
      .catch(() => !ignore && setError("Não foi possível calcular a reposição sugerida."))
      .finally(() => !ignore && setLoading(false));
    return () => {
      ignore = true;
    };
  }, [days, refreshKey]);

  const changePeriod = (value: number | null) => {
    if (!value || value === days) return;
    setDays(value);
    setShowAll(false);
    setInsights(null);
    setInsightsError(null);
  };

  const generateInsights = async () => {
    setInsightsLoading(true);
    setInsightsError(null);
    try {
      setInsights(await aiService.salesInsights(days));
    } catch (err) {
      setInsightsError(toFriendlyAssistantError(err instanceof Error ? err.message : "", "Não foi possível gerar a análise com IA."));
    } finally {
      setInsightsLoading(false);
    }
  };

  const revenueChange = forecast ? variation(forecast.current.revenue, forecast.previous.revenue) : null;
  const rows = forecast ? (showAll ? forecast.items : forecast.items.slice(0, VISIBLE_ROWS)) : [];

  return (
    <Card variant="outlined" sx={{ borderRadius: 3, mb: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 2, mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <InsightsIcon color="primary" />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                Reposição sugerida
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Pelo ritmo de vendas dos últimos {days} dias, para o estoque durar {forecast?.coverageDays ?? 30} dias
              </Typography>
            </Box>
          </Box>
          <ToggleButtonGroup size="small" exclusive value={days} onChange={(_, value) => changePeriod(value)}>
            {PERIODS.map((period) => (
              <ToggleButton key={period} value={period} sx={{ px: 1.5 }}>
                {period} dias
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>

        {error && <Alert severity="error">{error}</Alert>}

        {loading && !forecast ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          forecast && (
            <>
              <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1, mb: 2 }}>
                <Chip size="small" color="error" variant={forecast.counts.out ? "filled" : "outlined"} label={`${forecast.counts.out} sem estoque`} />
                <Chip size="small" color="error" variant="outlined" label={`${forecast.counts.critical} críticos (até 7 dias)`} />
                <Chip size="small" color="warning" variant="outlined" label={`${forecast.counts.low} baixos`} />
                <Box sx={{ flex: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Faturamento: <strong>{formatCurrency(forecast.current.revenue)}</strong> em {forecast.current.sales} vendas
                </Typography>
                {revenueChange !== null && (
                  <Chip
                    size="small"
                    icon={revenueChange >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                    color={revenueChange >= 0 ? "success" : "error"}
                    variant="outlined"
                    label={`${revenueChange > 0 ? "+" : ""}${formatNumber(revenueChange)}% vs ${days} dias anteriores`}
                  />
                )}
              </Box>

              {forecast.items.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
                  Nenhum produto precisa de reposição pelo ritmo de vendas dos últimos {days} dias.
                </Typography>
              ) : (
                <TableContainer sx={{ opacity: loading ? 0.5 : 1 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Produto</TableCell>
                        <TableCell>Situação</TableCell>
                        <TableCell align="right">Estoque</TableCell>
                        <TableCell align="right">Vendidos</TableCell>
                        <TableCell align="right">Ritmo</TableCell>
                        <TableCell align="right">Dura</TableCell>
                        <TableCell align="right">Repor</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {rows.map((item) => (
                        <TableRow key={item.product_id} hover>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {item.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.category ?? "—"}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip size="small" label={STATUS[item.status].label} color={STATUS[item.status].color} variant={item.status === "out" ? "filled" : "outlined"} sx={{ fontWeight: 600 }} />
                          </TableCell>
                          <TableCell align="right">{item.stock} un.</TableCell>
                          <TableCell align="right">{item.unitsSold} un.</TableCell>
                          <TableCell align="right">{item.dailyRate > 0 ? `${formatNumber(item.dailyRate, 2)}/dia` : "—"}</TableCell>
                          <TableCell align="right">{item.daysLeft === null ? "—" : `${formatNumber(item.daysLeft)} dias`}</TableCell>
                          <TableCell align="right">
                            {item.suggestedRestock > 0 ? (
                              <Typography variant="body2" sx={{ fontWeight: 700 }} color="primary">
                                {item.suggestedRestock} un.
                              </Typography>
                            ) : (
                              <Typography variant="caption" color="text.secondary">
                                sem vendas no período
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {forecast.items.length > VISIBLE_ROWS && (
                    <Box sx={{ textAlign: "center", mt: 1 }}>
                      <Button size="small" onClick={() => setShowAll((value) => !value)}>
                        {showAll ? "Mostrar menos" : `Ver todos (${forecast.items.length})`}
                      </Button>
                    </Box>
                  )}
                </TableContainer>
              )}
            </>
          )
        )}

        <Box sx={{ mt: 2.5, p: 2, borderRadius: 2, bgcolor: "grey.50", border: "1px solid", borderColor: "divider" }}>
          <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <AutoAwesomeIcon color="secondary" fontSize="small" />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Análise com IA
              </Typography>
              <Typography variant="caption" color="text.secondary">
                resumo e recomendações sobre os últimos {days} dias
              </Typography>
            </Box>
            <Button
              size="small"
              variant={insights ? "outlined" : "contained"}
              color="secondary"
              startIcon={insightsLoading ? <CircularProgress size={14} color="inherit" /> : <AutoAwesomeIcon />}
              onClick={generateInsights}
              disabled={insightsLoading || loading}
            >
              {insightsLoading ? "Analisando..." : insights ? "Gerar de novo" : "Gerar análise"}
            </Button>
          </Box>

          {insightsError && (
            <Alert severity="warning" sx={{ mt: 1.5 }}>
              {insightsError}
            </Alert>
          )}

          {insights && (
            <Box sx={{ mt: 1.5, display: "flex", flexDirection: "column", gap: 1.25 }}>
              <Typography variant="body1" sx={{ fontWeight: 700 }}>
                {insights.headline}
              </Typography>
              {insights.insights.length > 0 && (
                <Box component="ul" sx={{ m: 0, pl: 2.5, listStyleType: "disc", display: "flex", flexDirection: "column", gap: 0.5 }}>
                  {insights.insights.map((item, index) => (
                    <Typography key={index} component="li" variant="body2">
                      {item}
                    </Typography>
                  ))}
                </Box>
              )}
              {insights.actions.length > 0 && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }} color="text.secondary">
                    Ações recomendadas
                  </Typography>
                  {insights.actions.map((action, index) => (
                    <Box key={index} sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                      <TaskAltIcon color="success" fontSize="small" sx={{ mt: 0.25 }} />
                      <Typography variant="body2">{action}</Typography>
                    </Box>
                  ))}
                </Box>
              )}
              <Typography variant="caption" color="text.secondary">
                Gerado por IA às {new Date(insights.generatedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} · revise antes de agir
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};
