// src/pages/HomeBeneficiary.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Calendar,
  ClipboardCheck,
  Heart,
  Trophy,
  Clock,
  Star,
  Users,
  TrendingUp,
  Shield,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import AppLayout from "../components/layout/AppLayout.jsx";
import Button from "../components/ui/Button.jsx";
import StatCard from "../components/ui/StatCard.jsx";
import ActivityCard from "../components/ActivityCard.jsx";
import SectionHeader from "../components/ui/SectionHeader.jsx";
import AnimatedContainer from "../components/ui/AnimatedContainer.jsx";

// Tarjetas de acceso rápido para estudiantes
const summaryCards = [
  {
    title: "Explorar actividades",
    description: "Descubre y inscríbete en nuevas experiencias",
    to: "/calendario",
    icon: "🎭",
  },
  {
    title: "Mis inscripciones",
    description: "Revisa tus actividades programadas",
    to: "/actividades",
    icon: "📋",
  },
  {
    title: "Torneos disponibles",
    description: "Participa en competencias deportivas",
    to: "/torneos",
    icon: "🏆",
  },
];

// Métricas personales del estudiante
const studentMetrics = [
  {
    id: "m1",
    title: "Actividades este mes",
    value: "8",
    cta: "Ver calendario",
    tone: "text-emerald-600",
    Icon: Calendar,
  },
  {
    id: "m2",
    title: "Horas de bienestar",
    value: "12h",
    cta: "Ver detalles",
    tone: "text-emerald-600",
    Icon: Clock,
  },
  {
    id: "m3",
    title: "Inscripciones activas",
    value: "5",
    cta: "Ver inscripciones",
    tone: "text-blue-600",
    Icon: ClipboardCheck,
  },
  {
    id: "m4",
    title: "Favoritos",
    value: "7",
    cta: "Ver favoritos",
    tone: "text-yellow-600",
    Icon: Heart,
  },
];

// Actividades recomendadas
const recommendedActivities = [
  { name: "Música & Ritmo", category: "Cultura", spots: "5 cupos", tone: "text-purple-600" },
  { name: "Zumba fitness", category: "Deporte", spots: "8 cupos", tone: "text-emerald-600" },
  { name: "Club de lectura", category: "Bienestar", spots: "12 cupos", tone: "text-blue-600" },
];

export default function HomeBeneficiary() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const userName = user?.first_name || user?.username || "Estudiante";

  return (
    <AppLayout>
      {/* Hero */}
      <AnimatedContainer
        as="section"
        className="rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 p-6 text-white shadow-lg mb-6"
        variant="fade-up"
      >
        <div className="flex items-center gap-2 mb-2">
          <Shield size={20} />
          <span className="px-2 py-1 bg-white/20 rounded-full text-xs font-medium uppercase tracking-wide">
            Panel Estudiantil
          </span>
        </div>
        <h1 className="text-2xl font-semibold mb-1">¡Hola, {userName}!</h1>
        <p className="opacity-90">
          Explora actividades del Centro Artístico y Deportivo (CADI), inscríbete a eventos y gestiona tu bienestar.
        </p>
        <div className="mt-4">
          <Button onClick={() => navigate("/mi-calendario")}>Ver calendario</Button>
        </div>
      </AnimatedContainer>

      {/* KPIs */}
      <div className="grid md:grid-cols-4 sm:grid-cols-2 gap-4 mb-6">
        {studentMetrics.map((s, index) => (
          <StatCard
            key={s.id}
            title={s.title}
            value={s.value}
            cta={s.cta}
            tone={s.tone}
            onClick={() => navigate("/mi-calendario")}
            animationDelay={index * 0.05}
          />
        ))}
      </div>

      {/* Acciones rápidas */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800">⚡ Acciones rápidas</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {summaryCards.map(({ label, description, to, Icon, title }) => (
            <button
              key={title || label}
              onClick={() => navigate(to)}
              className="group flex flex-col items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-blue-300 hover:bg-blue-50"
            >
              <span className="rounded-lg bg-blue-100 p-2 text-blue-600 group-hover:bg-blue-200">
                {(Icon && <Icon className="size-5" />) || ""}
              </span>
              <div>
                <h4 className="font-semibold text-slate-800">{title}</h4>
                <p className="text-sm text-slate-500">{description}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Cards de actividades recomendadas */}
      <div className="grid md:grid-cols-3 sm:grid-cols-2 gap-4">
        {recommendedActivities.map((a, index) => (
          <ActivityCard
            key={`${a.name}-${index}`}
            title={a.name}
            tags={[a.category]}
            place={""}
            when={""}
            rating={""}
            quota={a.spots}
            onEnroll={() => navigate("/calendario")}
            animationDelay={0.05 + index * 0.06}
          />
        ))}
      </div>
    </AppLayout>
  );
}
