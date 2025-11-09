import React from "react";
import { formatMetricValue } from "../../services/reportsService";

function formatChange(change) {
  if (typeof change !== "number" || !Number.isFinite(change)) {
    return "–";
  }
  const rounded = Number(change.toFixed(1));
  return `${rounded > 0 ? "+" : ""}${rounded}%`;
}

function getChangeColor(change) {
  if (typeof change !== "number" || !Number.isFinite(change)) {
    return "text-slate-400";
  }
  if (change > 0) {
    return "text-green-500";
  }
  if (change < 0) {
    return "text-red-500";
  }
  return "text-slate-500";
}

export const WeeklyMetrics = ({ metrics = [], loading, hasError }) => {
  if (loading) {
    return (
      <div className="w-full rounded-lg bg-white p-6 shadow-sm">
        <div className="mb-4 h-6 w-40 rounded bg-slate-200" />
        <div className="mb-6 h-4 w-56 rounded bg-slate-200" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={`weekly-skeleton-${index}`} className="flex items-center justify-between">
              <div className="h-4 w-40 rounded bg-slate-200" />
              <div className="flex items-center gap-2">
                <div className="h-6 w-16 rounded bg-slate-200" />
                <div className="h-4 w-12 rounded bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="w-full rounded-lg bg-white p-6 text-sm text-slate-500 shadow-sm">
        No se pudieron cargar las métricas semanales.
      </div>
    );
  }

  if (!metrics.length) {
    return (
      <div className="w-full rounded-lg bg-white p-6 text-sm text-slate-500 shadow-sm">
        No hay métricas semanales disponibles.
      </div>
    );
  }

  return (
    <div className="w-full rounded-lg bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-800 mb-1">Métricas de la semana</h2>
      <p className="text-sm text-stone-500 mb-4">Comparación con semana anterior</p>
      <div className="space-y-4">
        {metrics.map((metric) => (
          <div key={metric.key} className="flex items-center justify-between">
            <div>
              <span className="text-base text-slate-700">{metric.label}</span>
              <p className="text-xs text-stone-400">
                Semana actual: {formatMetricValue(metric.current)} · Semana previa: {formatMetricValue(metric.previous)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-slate-800">
                {formatMetricValue(metric.current)}
              </span>
              <span className={`text-sm ${getChangeColor(metric.change)}`}>
                {formatChange(metric.change)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
