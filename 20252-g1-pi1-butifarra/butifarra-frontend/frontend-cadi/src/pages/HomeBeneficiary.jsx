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
import AnimatedContainer from "../components/ui/AnimatedContainer.jsx";

const summaryCards = [
  { title: "Explorar actividades", description: "Descubre y inscríbete en nuevas experiencias", to: "/calendario", icon: "🎭" },
  { title: "Mis inscripciones", description: "Revisa tus actividades programadas", to: "/actividades", icon: "📋" },
  { title: "Torneos disponibles", description: "Participa en competencias deportivas", to: "/torneos", icon: "🏆" },
];

const studentMetrics = [
  { title: "Actividades este mes", value: "8",  change: "+3 vs mes anterior", tone: "text-emerald-600", Icon: Calendar },
  { title: "Horas de bienestar",   value: "12h", change: "+2h esta semana",   tone: "text-emerald-600", Icon: Clock },
  { title: "Inscripciones activas", value: "5",  change: "2 próximas",         tone: "text-blue-600",   Icon: ClipboardCheck },
  { title: "Favoritos",             value: "7",  change: "Actividades guardadas", tone: "text-yellow-600", Icon: Heart },
];

const upcomingActivities = [
  { name: "Yoga matutino", date: "Hoy, 7:00 AM", status: "Inscrito", tone: "text-emerald-600" },
  { name: "Taller de pintura", date: "Mañana, 11:00 AM", status: "Inscrito", tone: "text-blue-600" },
  { name: "Torneo fútbol 5", date: "Viernes, 5:00 PM", status: "Pendiente", tone: "text-orange-500" },
];

const recommendedActivities = [
  { name: "Música & Ritmo", category: "Cultura", spots: "5 cupos",  tone: "text-purple-600" },
  { name: "Zumba fitness",  category: "Deporte", spots: "8 cupos",  tone: "text-emerald-600" },
  { name: "Club de lectura", category: "Bienestar", spots: "12 cupos", tone: "text-blue-600" },
];

export default function HomeBeneficiary() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const userName = user?.first_name || user?.username || "Estudiante";

  const stats = studentMetrics.map((m) => ({
    id: m.title.toLowerCase().replaceAll(" ", "-"),
    title: m.title,
    value: m.value,
    cta: m.change,     
    tone: m.tone,
    Icon: m.Icon,
  }));

  const kpiHandlers = {
    "actividades-este-mes": () => navigate("/calendario"),
    "horas-de-bienestar": () => navigate("/reportes"),
    "inscripciones-activas": () => navigate("/actividades"),
    "favoritos": () => navigate("/actividades"),
  };

  const highlights = [
    ...upcomingActivities.map((a, i) => ({
      id: `up-${i}`,
      title: a.name,
      tags: [a.status],         
      place: "CADI",
      when: a.date,
      rating: 4.6,
      quota: a.status,
    })),
    ...recommendedActivities.map((a, i) => ({
      id: `rec-${i}`,
      title: a.name,
      tags: [a.category, a.spots],
      place: a.category,
      when: "Próximamente",
      rating: 4.7,
      quota: a.spots,
    })),
  ];

  const onEnroll = (activity) => {
    navigate("/actividades");
  };

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
          <Button variant="default" className="bg-white text-indigo-600 border-white hover:bg-gray-50 cursor-pointer" onClick={() => navigate("/mi-calendario")}>Ver calendario</Button>
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
            icon={s.Icon}                 
            onClick={() => kpiHandlers[s.id]?.()}
            animationDelay={index * 0.05}
          />
        ))}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm mb-6">
        <h3 className="text-lg font-semibold text-slate-800">⚡ Acciones rápidas</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {[
            { label: "Ver calendario", description: "Todas las actividades disponibles", to: "/calendario", Icon: Calendar },
            { label: "PSU y voluntariados", description: "Cumple tus requisitos", to: "/psu", Icon: Users },
            { label: "Citas psicológicas", description: "Agenda tu cita de bienestar", to: "/citas", Icon: Heart },
          ].map(({ label, description, to, Icon }) => (
            <button
              key={label}
              onClick={() => navigate(to)}
              className="group flex flex-col items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left transition hover:border-blue-300 hover:bg-blue-50 cursor-pointer"
            >
              <span className="rounded-lg bg-blue-100 p-2 text-blue-600 group-hover:bg-blue-200">
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

      {/* Cards de actividades recomendadas */}
      <div className="grid md:grid-cols-3 sm:grid-cols-2 gap-4">
        {recommendedActivities.map((a, index) => (
          <ActivityCard
            key={a.id}
            title={a.title}
            tags={a.tags}
            place={a.place}
            when={a.when}
            rating={a.rating}
            quota={a.quota}
            onEnroll={() => onEnroll(a)}
            animationDelay={0.05 + index * 0.06}
          />
        ))}
      </div>
    </AppLayout>
  );
}
