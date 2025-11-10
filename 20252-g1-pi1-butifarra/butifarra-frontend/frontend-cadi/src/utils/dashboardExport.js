import XLSX from "xlsx";
import { formatMetricValue } from "../services/reportsService";

const numberFormatter = new Intl.NumberFormat("es-ES");
const percentFormatter = new Intl.NumberFormat("es-ES", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const dateTimeFormatter = new Intl.DateTimeFormat("es-ES", {
  dateStyle: "short",
  timeStyle: "short",
});

function formatPercent(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "–";
  }
  const formatted = percentFormatter.format(value);
  return `${formatted}%`;
}

function formatNumber(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "–";
  }
  return numberFormatter.format(value);
}

function formatDateTime(value) {
  if (!value) {
    return "–";
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }
  return dateTimeFormatter.format(date);
}

function buildMetadataRows({ summaryCards, weeklyMetrics, recentActivities, generatedAt }) {
  const rows = [];
  if (generatedAt) {
    rows.push({ Campo: "Generado el", Valor: formatDateTime(generatedAt) });
  }
  rows.push({ Campo: "Total métricas", Valor: summaryCards.length });
  rows.push({ Campo: "Indicadores semanales", Valor: weeklyMetrics.length });
  rows.push({ Campo: "Actividades recientes", Valor: recentActivities.length });
  return rows.filter((row) => row.Valor !== undefined && row.Valor !== null);
}

function buildSummaryRows(summaryCards) {
  return summaryCards.map((card) => ({
    Métrica: card.label || card.key || "Métrica",
    Valor: formatMetricValue(card.value, card.format),
    "Cambio %": formatPercent(card.change),
  }));
}

function buildWeeklyRows(weeklyMetrics) {
  return weeklyMetrics.map((metric) => ({
    Métrica: metric.label || metric.key || "Indicador",
    Actual: formatNumber(metric.current),
    "Semana anterior": formatNumber(metric.previous),
    "Cambio %": formatPercent(metric.change),
  }));
}

function buildActivityRows(recentActivities) {
  return recentActivities.map((activity) => ({
    Actividad: activity.title || activity.name || "Actividad",
    Categoría: activity.category || "–",
    Estado: activity.status || "–",
    "Fecha inicio": formatDateTime(activity.start),
    "Fecha fin": formatDateTime(activity.end),
    "Cupo total": formatNumber(activity.capacity),
    "Cupos disponibles": formatNumber(activity.availableSpots),
    Asistentes: formatNumber(activity.actualAttendees),
    Inscripciones: formatNumber(activity.enrollments),
  }));
}

export function buildDashboardWorkbook({
  summaryCards = [],
  weeklyMetrics = [],
  recentActivities = [],
  generatedAt = null,
} = {}) {
  const workbook = XLSX.utils.book_new();

  const metadataRows = buildMetadataRows({ summaryCards, weeklyMetrics, recentActivities, generatedAt });
  if (metadataRows.length > 0) {
    const sheet = XLSX.utils.json_to_sheet(metadataRows);
    XLSX.utils.book_append_sheet(workbook, sheet, "Información");
  }

  if (summaryCards.length > 0) {
    const sheet = XLSX.utils.json_to_sheet(buildSummaryRows(summaryCards));
    XLSX.utils.book_append_sheet(workbook, sheet, "Resumen métricas");
  }

  if (weeklyMetrics.length > 0) {
    const sheet = XLSX.utils.json_to_sheet(buildWeeklyRows(weeklyMetrics));
    XLSX.utils.book_append_sheet(workbook, sheet, "Comparativo semanal");
  }

  if (recentActivities.length > 0) {
    const sheet = XLSX.utils.json_to_sheet(buildActivityRows(recentActivities));
    XLSX.utils.book_append_sheet(workbook, sheet, "Actividades recientes");
  }

  return workbook;
}

export default {
  buildDashboardWorkbook,
};
