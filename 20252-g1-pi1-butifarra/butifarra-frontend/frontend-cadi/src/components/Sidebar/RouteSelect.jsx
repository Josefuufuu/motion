import React, { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

import homeIcon from "../../assets/icons/home-icon.png";
import dashboardIcon from "../../assets/icons/dashboard-icon.png";
import groupsIcon from "../../assets/icons/groups-icon.png";
import notificationIcon from "../../assets/icons/notification-icon.png";
import profileIcon from "../../assets/icons/profile-icon.png";
import reportIcon from "../../assets/icons/report-icon.png";
import trophyIcon from "../../assets/icons/trophy-icon.png";
import brainIcon from "../../assets/icons/brain-icon.png";
import calendarIcon from "../../assets/icons/dashboard-icon.png";

// Rutas para beneficiarios/estudiantes
const beneficiaryRoutes = [
  { key: "home", path: "/inicio", icon: homeIcon, title: "Inicio" },
  { key: "calendario", path: "/calendario", icon: calendarIcon, title: "Calendario" },
  { key: "torneos", path: "/torneos", icon: trophyIcon, title: "Torneos" },
  { key: "psu", path: "/psu", icon: groupsIcon, title: "PSU/Voluntariados" },
  { key: "citas", path: "/citas", icon: brainIcon, title: "Citas psicológicas" },
];

// Rutas para administradores
const adminRoutes = [
  { key: "home", path: "/admin/home", icon: homeIcon, title: "Inicio Admin" },
  { key: "register-user", path: "/admin/registrar-usuario", icon: profileIcon, title: "Registrar usuario" },
  { key: "gestion", path: "/gestion-cadi", icon: dashboardIcon, title: "Gestión CADI" },
  { key: "calendario", path: "/calendario", icon: calendarIcon, title: "Calendario" },
  { key: "torneos", path: "/admin/torneos", icon: trophyIcon, title: "Gestión Torneos" },
  { key: "reportes", path: "/admin/reports", icon: reportIcon, title: "Reportes" },
  { key: "notificaciones", path: "/notificaciones", icon: notificationIcon, title: "Notificaciones" },
];

// Rutas para profesores
const professorRoutes = [
  { key: "home", path: "/profesor", icon: homeIcon, title: "Inicio Profesor" },
  { key: "mis-actividades", path: "/profesor/actividades", icon: dashboardIcon, title: "Mis actividades" },
  { key: "calendario", path: "/calendario", icon: calendarIcon, title: "Calendario" },
];

export const RouteSelect = () => {
  const { isAdmin, isBeneficiary, isProfessor } = useAuth();
  const location = useLocation();

  const resolvedRoutes = useMemo(() => {
    if (isAdmin()) return adminRoutes;
    if (isProfessor && isProfessor()) return professorRoutes;
    if (isBeneficiary()) return beneficiaryRoutes;
    return [];
  }, [isAdmin, isBeneficiary, isProfessor]);

  return (
    <div className="space-y-1">
      {resolvedRoutes.map((route) => (
        <SidebarRoute key={route.key} icon={route.icon} title={route.title} path={route.path} selected={location.pathname === route.path || location.pathname.startsWith(route.path + '/')} />
      ))}
    </div>
  );
};

const SidebarRoute = ({ selected, icon, title, path }) => {
  const baseClasses = "flex items-center gap-3 rounded px-4 py-2 transition-colors";
  const selectedClasses = selected ? "bg-violet-200 text-stone-900 shadow" : "text-stone-700 hover:bg-stone-200";
  return (
    <Link to={path} className={`${baseClasses} ${selectedClasses}`}>
      <img src={icon} alt="" className="h-5 w-5" aria-hidden="true" />
      <span className="text-base font-medium">{title}</span>
    </Link>
  );
};