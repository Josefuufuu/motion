import apiFetch from "./api";

const numberFormatter = new Intl.NumberFormat("es-ES");

function normalizeNumber(value) {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeSummaryCards(rawCards) {
  if (!Array.isArray(rawCards)) {
    return [];
  }

  return rawCards.map((item, index) => {
    const value = normalizeNumber(item?.value);
    return {
      key: item?.key ?? `metric-${index}`,
      label: item?.label ?? "",
      value,
      change: normalizeNumber(item?.change),
      format: item?.format === "percentage" ? "percentage" : "number",
    };
  });
}

function normalizeWeeklyMetrics(rawMetrics) {
  if (!Array.isArray(rawMetrics)) {
    return [];
  }

  return rawMetrics.map((metric, index) => ({
    key: metric?.key ?? `weekly-${index}`,
    label: metric?.label ?? "",
    current: normalizeNumber(metric?.current),
    previous: normalizeNumber(metric?.previous),
    change: normalizeNumber(metric?.change),
  }));
}

function normalizeRecentActivities(rawActivities) {
  if (!Array.isArray(rawActivities)) {
    return [];
  }

  return rawActivities.map((activity, index) => {
    const parseDate = (value) => {
      if (typeof value === "string") {
        return value;
      }
      if (value instanceof Date) {
        return value.toISOString();
      }
      return null;
    };

    return {
      id: activity?.id ?? index,
      title: activity?.title ?? "Actividad sin nombre",
      category: activity?.category ?? "",
      status: activity?.status ?? "",
      start: parseDate(activity?.start),
      end: parseDate(activity?.end),
      createdAt: parseDate(activity?.created_at ?? activity?.createdAt),
      updatedAt: parseDate(activity?.updated_at ?? activity?.updatedAt),
      capacity: normalizeNumber(activity?.capacity),
      availableSpots: normalizeNumber(activity?.available_spots ?? activity?.availableSpots),
      actualAttendees: normalizeNumber(activity?.actual_attendees ?? activity?.actualAttendees),
      enrollments: normalizeNumber(activity?.enrollments),
    };
  });
}

function normalizeDashboardPayload(raw) {
  return {
    summaryCards: normalizeSummaryCards(raw?.summary_cards),
    weeklyMetrics: normalizeWeeklyMetrics(raw?.weekly_metrics),
    recentActivities: normalizeRecentActivities(raw?.recent_activities),
    generatedAt:
      typeof raw?.generated_at === "string"
        ? raw.generated_at
        : raw?.generatedAt instanceof Date
        ? raw.generatedAt.toISOString()
        : null,
  };
}

export async function fetchDashboardReports({ signal } = {}) {
  const response = await apiFetch("/api/reports/dashboard/", {
    method: "GET",
    signal,
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch (error) {
    payload = null;
  }

  if (!response.ok) {
    const message =
      payload?.detail ||
      payload?.error ||
      payload?.message ||
      `No se pudo cargar el dashboard (código ${response.status}).`;
    const err = new Error(message);
    err.status = response.status;
    err.payload = payload;
    throw err;
  }

  return normalizeDashboardPayload(payload);
}

export const reportsService = {
  fetchDashboardReports,
};

export function formatMetricValue(value, format = "number") {
  if (value === null || value === undefined) {
    return "–";
  }

  if (format === "percentage" && typeof value === "number" && Number.isFinite(value)) {
    return `${value.toFixed(1)}%`;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return numberFormatter.format(value);
  }

  return String(value);
}

export default reportsService;
