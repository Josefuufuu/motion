// src/components/Sidebar/RouteSelect.jsx
import React, { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { useRole } from "./RoleContext";

import homeIcon from "../../assets/icons/home-icon.png";
import dashboardIcon from "../../assets/icons/dashboard-icon.png";
import groupsIcon from "../../assets/icons/groups-icon.png";
import notificationIcon from "../../assets/icons/notification-icon.png";
import reportIcon from "../../assets/icons/report-icon.png";
import trophyIcon from "../../assets/icons/trophy-icon.png";
import brainIcon from "../../assets/icons/brain-icon.png";
import calendarIcon from "../../assets/icons/dashboard-icon.png";

const routes = [
  {
    key: "home",
    path: "/admin/home",
    pathByRole: {
      Estudiante: "/inicio",
    },
    icon: homeIcon,
    title: "Inicio",
    roles: ["Estudiante", "Administrador", "Colaborador"],
  },
  {
    key: "gestion",
    path: "/gestion-cadi",
    icon: dashboardIcon,
    title: "Gestión CADI",
    roles: ["Administrador"],
  },
  {
    key: "torneos",
    path: "/admin/torneos", 
    pathByRole: {
      Estudiante: "/torneos", 
    },
    icon: trophyIcon,
    title: "Torneos",
    roles: ["Estudiante", "Colaborador", "Administrador"],
  },
  {
    key: "psu",
    path: "/psu",
    icon: groupsIcon,
    title: "PSU/Voluntariados",
    roles: ["Estudiante", "Colaborador", "Administrador"],
  },
  {
    key: "citas",
    path: "/citas",
    icon: brainIcon,
    title: "Citas psicológicas",
    roles: ["Estudiante"],
  },
  {
    key: "reportes",
    path: "/estadisticas", 
    icon: reportIcon,
    title: "Analítica y Reportes",
    roles: ["Administrador", "Colaborador"],
  },
  {
    key: "notificaciones",
    path: "/notificaciones",
    icon: notificationIcon,
    title: "Notificaciones",
    roles: ["Estudiante", "Administrador", "Colaborador"],
  },
  {
    key: "calendario",
    path: "/calendario",
    icon: calendarIcon,
    title: "Calendario",
    roles: ["Estudiante", "Administrador", "Colaborador"],
  },
];

export const RouteSelect = () => {
  const role = useRole();
  const location = useLocation();

  const resolvedRoutes = useMemo(() => {
    if (!role) return [];
    return routes
      .filter((route) => route.roles.includes(role))
      .map((route) => ({
        ...route,
        path: route.pathByRole?.[role] ?? route.path,
      }));
  }, [role]);

  if (!role) return null;

  return (
    <div className="space-y-1">
      {resolvedRoutes.map((route) => (
        <SidebarRoute
          key={route.key}
          icon={route.icon}
          title={route.title}
          path={route.path}
          selected={location.pathname.startsWith(route.path)}
        />
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