import React from "react";
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

const summaryCards = [
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

const metrics = [
  {
    title: "Asistencia hoy",
    value: "324",
    change: "+12%",
    tone: "text-emerald-600",
    Icon: Users,
  },
  {
    title: "Inscripciones activas",
    value: "1.245",
    change: "+6%",
    tone: "text-emerald-600",
    Icon: ClipboardList,
  },
  {
    title: "Ocupación",
    value: "85%",
    change: "-2%",
    tone: "text-rose-500",
    Icon: BarChart3,
  },
  {
    title: "Incidencias",
    value: "3",
    change: "+1%",
    tone: "text-rose-500",
    Icon: Activity,
  },
];

const quickActions = [
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

const recentActivities = [
  { name: "Yoga matutino", attendees: "15 participantes", tone: "text-violet-600" },
  { name: "Torneo fútbol 5", attendees: "8 participantes", tone: "text-emerald-600" },
  { name: "Taller fotografía", attendees: "20 participantes", tone: "text-slate-500" },
];

const weeklyMetrics = [
  { label: "Nuevos usuarios", value: "+23%", tone: "text-emerald-600" },
  { label: "Actividades completadas", value: "+18%", tone: "text-emerald-600" },
  { label: "Cancelaciones", value: "+5%", tone: "text-rose-500" },
  { label: "Satisfacción promedio", value: "+2%", tone: "text-emerald-600" },
];

export default function AdminHomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const adminName = user?.first_name || user?.username || "Administrador";

  return (
    <AppLayout>
      <div className="space-y-8">
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
          {metrics.map(({ title, value, change, tone, Icon }) => (
            <div
              key={title}
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
              <span className={`mt-4 text-xs font-semibold ${tone}`}>{change} respecto a la semana pasada</span>
            </div>
          ))}
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
            <ul className="mt-4 space-y-3">
              {recentActivities.map((activity, index) => (
                <li key={index} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                  <span className="font-medium text-slate-700">{activity.name}</span>
                  <span className={`text-sm ${activity.tone}`}>{activity.attendees}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Métricas semanales */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800">📈 Métricas de la semana</h3>
            <ul className="mt-4 space-y-3">
              {weeklyMetrics.map((metric, index) => (
                <li key={index} className="flex items-center justify-between rounded-lg border border-slate-100 p-3">
                  <span className="font-medium text-slate-700">{metric.label}</span>
                  <span className={`text-sm font-semibold ${metric.tone}`}>{metric.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
