import React from "react";
import { DashboardHeader } from "./DashboardHeader ";

import { DashboardMetrics } from "./DashboardMetrics";
import { QuickActions } from "./QuickACtions";
import { DashboardPanels } from "./DashboardBottomPanels";
import { ParticipationChart } from "../Statistics/ParticipationChart";
import { AttendanceTrendChart } from "../Statistics/AttendanceTrendChart";
import { CapacityVsAttendanceChart } from "../Statistics/CapacityVsAttendanceChart";

const FiltersSection = ({
  filters,
  activityTypeOptions,
  onDateRangeChange,
  onActivityTypeChange,
  disabled,
}) => {
  return (
    <div className="px-[32px]">
      <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold text-stone-800">Filtros del dashboard</h2>
        <p className="mt-1 text-sm text-stone-500">
          Ajusta el rango de fechas o el tipo de actividad para actualizar los indicadores y gráficas.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <label className="flex flex-col text-sm font-medium text-stone-600">
            Fecha inicial
            <input
              type="date"
              className="mt-1 rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-stone-100"
              value={filters.dateRange.start}
              onChange={(event) => onDateRangeChange({ start: event.target.value })}
              disabled={disabled}
            />
          </label>
          <label className="flex flex-col text-sm font-medium text-stone-600">
            Fecha final
            <input
              type="date"
              className="mt-1 rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-stone-100"
              value={filters.dateRange.end}
              onChange={(event) => onDateRangeChange({ end: event.target.value })}
              disabled={disabled}
            />
          </label>
          <label className="flex flex-col text-sm font-medium text-stone-600">
            Tipo de actividad
            <select
              className="mt-1 rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-stone-100"
              value={filters.activityTypes[0] ?? ""}
              onChange={(event) => onActivityTypeChange(event.target.value)}
              disabled={disabled}
            >
              {activityTypeOptions.map((option) => (
                <option key={option.value || "all"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </div>
  );
};

const ChartsSection = ({
  chartDatasets,
  loading,
  hasError,
  datasetDocumentation,
}) => {
  if (hasError) {
    return null;
  }

  const renderContent = (isLoading, hasData, children) => {
    if (isLoading) {
      return <div className="flex h-80 items-center justify-center text-sm text-stone-500">Cargando datos…</div>;
    }
    if (!hasData) {
      return (
        <div className="flex h-80 items-center justify-center text-sm text-stone-400">
          No hay información disponible para los filtros seleccionados.
        </div>
      );
    }
    return children;
  };

  return (
    <div className="px-[32px]">
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm xl:col-span-1">
          <div className="mb-2 flex items-start justify-between">
            <div>
              <h3 className="text-sm font-semibold text-stone-800">Participación por tipo</h3>
              <p className="text-xs text-stone-500">
                {datasetDocumentation?.participation_by_type || "Participantes registrados por categoría."}
              </p>
            </div>
          </div>
          {renderContent(
            loading,
            Array.isArray(chartDatasets.participationByType) && chartDatasets.participationByType.length > 0,
            <ParticipationChart data={chartDatasets.participationByType} />
          )}
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm xl:col-span-2">
          <div className="mb-2 flex items-start justify-between">
            <div>
              <h3 className="text-sm font-semibold text-stone-800">Evolución de asistencia</h3>
              <p className="text-xs text-stone-500">
                {datasetDocumentation?.attendance_trend || "Tendencia diaria de asistentes registrados."}
              </p>
            </div>
          </div>
          {renderContent(
            loading,
            Array.isArray(chartDatasets.attendanceTrend) && chartDatasets.attendanceTrend.length > 0,
            <AttendanceTrendChart data={chartDatasets.attendanceTrend} />
          )}
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm xl:col-span-3">
          <div className="mb-2 flex items-start justify-between">
            <div>
              <h3 className="text-sm font-semibold text-stone-800">Capacidad vs asistencia</h3>
              <p className="text-xs text-stone-500">
                {datasetDocumentation?.capacity_vs_attendance ||
                  "Comparación del aforo disponible frente a la asistencia real por tipo de actividad."}
              </p>
            </div>
          </div>
          {renderContent(
            loading,
            Array.isArray(chartDatasets.capacityVsAttendance) && chartDatasets.capacityVsAttendance.length > 0,
            <CapacityVsAttendanceChart data={chartDatasets.capacityVsAttendance} />
          )}
        </div>
      </div>
    </div>
  );
};

export const Grid = ({
  summaryCards,
  weeklyMetrics,
  recentActivities,
  chartDatasets,
  datasetDocumentation,
  filtersApplied,
  filters,
  activityTypeOptions,
  onDateRangeChange,
  onActivityTypeChange,
  loading,
  error,
  onExport,
  exporting,
}) => {
  const hasError = Boolean(error);

  return (
    <div className="px-4 py-4 space-y-4">
      <DashboardHeader
        onExport={onExport}
        loading={loading}
        exporting={exporting}
        hasError={hasError}
      />
      {hasError ? (
        <div className="px-[32px]">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        </div>
      ) : null}
      <FiltersSection
        filters={filters}
        activityTypeOptions={activityTypeOptions}
        onDateRangeChange={onDateRangeChange}
        onActivityTypeChange={onActivityTypeChange}
        disabled={loading}
      />
      <div className="px-[32px] text-xs text-stone-400">
        {Object.keys(filtersApplied || {}).length > 0
          ? `Filtros aplicados: ${JSON.stringify(filtersApplied)}`
          : "Sin filtros adicionales aplicados."}
      </div>
      <DashboardMetrics metrics={summaryCards} loading={loading} hasError={hasError} />
      <ChartsSection
        chartDatasets={chartDatasets}
        datasetDocumentation={datasetDocumentation}
        loading={loading}
        hasError={hasError}
      />
      <QuickActions />
      <DashboardPanels
        weeklyMetrics={weeklyMetrics}
        recentActivities={recentActivities}
        loading={loading}
        hasError={hasError}
      />
    </div>
  );
};
