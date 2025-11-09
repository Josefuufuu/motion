import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Activity,
  BarChart3,
  Bell,
  ClipboardList,
  Trophy,
  Users,
  Shield,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import AppLayout from "../components/layout/AppLayout.jsx";
import {
  fetchDashboardReports,
  formatMetricValue,
} from "../services/reportsService";

const summaryCards = [
  {
    title: "Registrar usuario",
    description: "Crea cuentas para profesores o estudiantes",
    to: "/admin/registrar-usuario",
    icon: "➕",
  },
  {
    title: "Gestionar usuarios",
    description: "Revisa solicitudes y actualiza perfiles",
    to: "/admin/form-inscripcion",
    icon: "👥",
  },
  {
    title: "Gestionar actividades",
    description: "Crea y edita la programación del CADI",
    to: "/gestion-cadi",
    icon: "🎭",
  },
  {
    title: "Ver reportes",
    description: "Indicadores y reportes de bienestar",
    to: "/admin/reports",
    icon: "📊",
  },
];

const quickActions = [
  {
    label: "Registrar usuario",
    description: "Dar acceso al CADI",
    to: "/admin/registrar-usuario",
    Icon: Users,
  },
  {
    label: "Crear actividad",
    description: "Nueva experiencia CADI",
    to: "/actividades/crear",
    Icon: ClipboardList,
  },
  {
    label: "Gestionar torneos",
    description: "Organiza competencias",
    to: "/admin/torneos",
    Icon: Trophy,
  },
  {
    label: "Ver calendario",
    description: "Administrar eventos",
    to: "/calendario",
    Icon: Bell,
  },
];

const METRIC_ICON_MAP = {
  attendance_today: Users,
  open_enrollments: ClipboardList,
  occupancy_rate: BarChart3,
  weekly_incidents: Activity,
};

const STATUS_TONE_MAP = {
  active: "text-emerald-600",
  finished: "text-slate-500",
  cancelled: "text-rose-500",
  pending: "text-amber-500",
};

const FALLBACK_METRIC_ICONS = [Users, ClipboardList, BarChart3, Activity];

function formatChange(change) {
  if (typeof change !== "number" || !Number.isFinite(change)) {
    return "–";
  }
  const rounded = Number(change.toFixed(1));
  const prefix = rounded > 0 ? "+" : "";
  return `${prefix}${rounded}%`;
}

function getTone(change) {
  if (typeof change !== "number" || !Number.isFinite(change)) {
    return "text-slate-400";
  }
  if (change > 0) {
    return "text-emerald-600";
  }
  if (change < 0) {
    return "text-rose-500";
  }
  return "text-slate-500";
}

function mapSummaryCards(cards = []) {
  return cards.map((card, index) => {
    const Icon = METRIC_ICON_MAP[card.key] ?? FALLBACK_METRIC_ICONS[index % FALLBACK_METRIC_ICONS.length];
    const value = formatMetricValue(card.value, card.format);
    const changeText = formatChange(card.change);

    return {
      key: card.key ?? `metric-${index}`,
      title: card.label || "Métrica",
      value,
      change: changeText,
      tone: getTone(card.change),
      Icon,
    };
  });
}

function mapWeeklyMetrics(metrics = []) {
  return metrics.map((metric, index) => ({
    key: metric.key ?? `weekly-${index}`,
    label: metric.label || "Métrica",
    value: formatChange(metric.change),
    tone: getTone(metric.change),
  }));
}

function mapRecentActivities(activities = []) {
  return activities.map((activity, index) => {
    const attendeesValue =
      activity.actualAttendees ?? activity.enrollments ?? activity.participants ?? null;
    const attendeesText =
      attendeesValue !== null
        ? `${formatMetricValue(attendeesValue)} participantes`
        : "Sin datos";

    return {
      key: activity.id ?? index,
      name: activity.title || "Actividad",
      attendees: attendeesText,
      tone: STATUS_TONE_MAP[activity.status] ?? "text-slate-500",
    };
  });
}

export default function AdminHomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [weeklyMetrics, setWeeklyMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const loadDashboard = async () => {
      try {
        setLoading(true);
        const result = await fetchDashboardReports({ signal: controller.signal });
        if (!isMounted) {
          return;
        }
        setMetrics(mapSummaryCards(result.summaryCards || []));
        setRecentActivities(mapRecentActivities(result.recentActivities || []));
        setWeeklyMetrics(mapWeeklyMetrics(result.weeklyMetrics || []));
        setError(null);
      } catch (err) {
        if (err.name === "AbortError") {
          return;
        }
        if (!isMounted) {
          return;
        }
        setMetrics([]);
        setRecentActivities([]);
        setWeeklyMetrics([]);
        setError(err.message || "Ocurrió un error al cargar la información del dashboard.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  const adminName = user?.first_name || user?.username || "Administrador";

  return (
    <AppLayout>
      <div className="space-y-8">
        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}
        {/* Hero - Banner distintivo para administradores */}
        <section className="rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <Shield size={20} />
            <span className="px-2 py-1 bg-white/20 rounded-full text-xs font-medium uppercase tracking-wide">
              Panel Administrativo
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-semibold">Bienvenido, {adminName}</h1>
          <p className="mt-3 max-w-2xl text-sm text-indigo-100">
            Supervisa las actividades y el impacto del programa de bienestar universitario. Gestiona campañas,
            actividades y reportes desde un mismo lugar.
          </p>
        </section>

        {/* Tarjetas de acceso rápido */}
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {summaryCards.map((card) => (
            <Link
              key={card.title}
              to={card.to}
              className="group flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-violet-200 hover:shadow-md"
            >
              <span className="text-3xl">{card.icon}</span>
              <div>
                <h2 className="mt-4 text-lg font-semibold text-slate-800">{card.title}</h2>
                <p className="mt-1 text-sm text-slate-500">{card.description}</p>
              </div>
              <span className="mt-4 text-sm font-medium text-violet-600 group-hover:text-violet-700">
                Ir a la sección →
              </span>
            </Link>
          ))}
        </section>

        {/* Métricas principales */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={`metric-skeleton-${index}`}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between animate-pulse">
                    <div className="space-y-2">
                      <div className="h-4 w-24 rounded bg-slate-200" />
                      <div className="h-6 w-20 rounded bg-slate-200" />
                    </div>
                    <span className="h-10 w-10 rounded-full bg-slate-200" />
                  </div>
                  <span className="mt-4 h-4 w-28 rounded bg-slate-200 animate-pulse" />
                </div>
              ))
            : metrics.length
            ? metrics.map(({ key, title, value, change, tone, Icon }) => (
                <div
                  key={key}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-slate-500">{title}</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-800">{value}</p>
                    </div>
                    <span className="rounded-full bg-violet-100 p-2 text-violet-600">
                      <Icon className="size-5" />
                    </span>
                  </div>
                  <span className={`mt-4 text-xs font-semibold ${tone}`}>
                    {change !== "–" ? `${change} respecto a la semana pasada` : "Sin variación disponible"}
                  </span>
                </div>
              ))
            : (
                <div className="sm:col-span-2 xl:col-span-4 rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
                  No hay métricas disponibles.
                </div>
              )}
        </section>

        {/* Acciones rápidas */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800">⚡ Acciones rápidas</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {quickActions.map(({ label, description, to, Icon }) => (
              <button
                key={label}
                onClick={() => navigate(to)}
                className="group flex flex-col items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-violet-300 hover:bg-violet-50"
              >
                <span className="rounded-lg bg-violet-100 p-2 text-violet-600 group-hover:bg-violet-200">
                  <Icon className="size-5" />
                </span>
                <div>
                  <h4 className="font-semibold text-slate-800">{label}</h4>
                  <p className="text-sm text-slate-500">{description}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Grid de 2 columnas: Actividades recientes y métricas semanales */}
        <section className="grid gap-4 lg:grid-cols-2">
          {/* Actividades recientes */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800">📋 Actividades recientes</h3>
            {loading ? (
              <ul className="mt-4 space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <li
                    key={`activity-skeleton-${index}`}
                    className="flex items-center justify-between rounded-lg border border-slate-100 p-3"
                  >
                    <span className="h-4 w-40 rounded bg-slate-200 animate-pulse" />
                    <span className="h-4 w-24 rounded bg-slate-200 animate-pulse" />
                  </li>
                ))}
              </ul>
            ) : recentActivities.length ? (
              <ul className="mt-4 space-y-3">
                {recentActivities.map((activity) => (
                  <li
                    key={activity.key}
                    className="flex items-center justify-between rounded-lg border border-slate-100 p-3"
                  >
                    <span className="font-medium text-slate-700">{activity.name}</span>
                    <span className={`text-sm ${activity.tone}`}>{activity.attendees}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-slate-500">No hay actividades recientes registradas.</p>
            )}
          </div>

          {/* Métricas semanales */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800">📈 Métricas de la semana</h3>
            {loading ? (
              <ul className="mt-4 space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <li
                    key={`weekly-skeleton-${index}`}
                    className="flex items-center justify-between rounded-lg border border-slate-100 p-3"
                  >
                    <span className="h-4 w-44 rounded bg-slate-200 animate-pulse" />
                    <span className="h-4 w-16 rounded bg-slate-200 animate-pulse" />
                  </li>
                ))}
              </ul>
            ) : weeklyMetrics.length ? (
              <ul className="mt-4 space-y-3">
                {weeklyMetrics.map((metric) => (
                  <li
                    key={metric.key}
                    className="flex items-center justify-between rounded-lg border border-slate-100 p-3"
                  >
                    <span className="font-medium text-slate-700">{metric.label}</span>
                    <span className={`text-sm font-semibold ${metric.tone}`}>{metric.value}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-slate-500">No hay métricas semanales disponibles.</p>
            )}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
