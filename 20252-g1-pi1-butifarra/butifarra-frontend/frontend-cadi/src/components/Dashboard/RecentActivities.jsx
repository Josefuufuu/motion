import React from "react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { es } from "date-fns/locale";

const STATUS_STYLES = {
  active: "bg-blue-500 text-white",
  finished: "bg-stone-300 text-stone-700",
  cancelled: "bg-red-100 text-red-600",
  pending: "bg-cyan-500 text-white",
};

function getStatusLabel(status) {
  if (!status) {
    return "Actividad";
  }
  return status
    .toString()
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/^\w/u, (c) => c.toUpperCase());
}

function getRelativeTime(isoDate) {
  if (!isoDate) {
    return "Fecha no disponible";
  }
  try {
    return formatDistanceToNow(parseISO(isoDate), { addSuffix: true, locale: es });
  } catch (error) {
    return "Fecha no disponible";
  }
}

export const RecentActivities = ({ activities = [], loading, hasError }) => {
  if (loading) {
    return (
      <div className="w-full rounded-lg bg-white p-6 shadow-sm">
        <div className="mb-4 h-6 w-48 rounded bg-slate-200" />
        <div className="mb-6 h-4 w-64 rounded bg-slate-200" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={`activity-skeleton-${index}`} className="flex items-center justify-between">
              <div>
                <div className="mb-2 h-4 w-48 rounded bg-slate-200" />
                <div className="h-3 w-32 rounded bg-slate-200" />
              </div>
              <div className="h-6 w-20 rounded-full bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="w-full rounded-lg bg-white p-6 text-sm text-slate-500 shadow-sm">
        No se pudieron cargar las actividades recientes.
      </div>
    );
  }

  if (!activities.length) {
    return (
      <div className="w-full rounded-lg bg-white p-6 text-sm text-slate-500 shadow-sm">
        No hay actividades recientes registradas.
      </div>
    );
  }

  return (
    <div className="w-full rounded-lg bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-800 mb-1">Actividades recientes</h2>
      <p className="text-sm text-stone-500 mb-4">Últimas inscripciones y cambios</p>
      <div className="space-y-4">
        {activities.map((activity) => {
          const participants =
            activity.actualAttendees ?? activity.enrollments ?? activity.participants ?? 0;
          const statusLabel = getStatusLabel(activity.status);
          const statusStyle = STATUS_STYLES[activity.status] ?? "bg-slate-200 text-slate-700";
          const relativeTime = getRelativeTime(activity.start ?? activity.updatedAt ?? activity.createdAt);

          return (
            <div key={activity.id} className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-medium text-slate-700">{activity.title}</h3>
                <p className="text-sm text-stone-500">
                  {participants ?? 0} participantes · {relativeTime}
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusStyle}`}>
                {statusLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
