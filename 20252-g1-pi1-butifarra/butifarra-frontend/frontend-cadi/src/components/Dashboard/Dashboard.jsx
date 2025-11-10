import React, { useEffect, useMemo, useState } from "react";
import XLSX from "xlsx";
import { TopBar } from "./TopBar";
import { Grid } from "./Grid";
import { fetchDashboardReports } from "../../services/reportsService";
import { buildDashboardWorkbook } from "../../utils/dashboardExport";

export const Dashboard = () => {
  const [data, setData] = useState({
    summaryCards: [],
    weeklyMetrics: [],
    recentActivities: [],
    chartDatasets: {
      participationByType: [],
      attendanceTrend: [],
      capacityVsAttendance: [],
    },
    datasetDocumentation: {},
    filtersApplied: {},
    generatedAt: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: { start: "", end: "" },
    activityTypes: [],
  });

  const activityTypeOptions = useMemo(
    () => [
      { value: "", label: "Todas las actividades" },
      { value: "DEPORTE", label: "Deporte" },
      { value: "CULTURA", label: "Cultura" },
      { value: "EVENTO", label: "Evento" },
      { value: "BIENESTAR", label: "Bienestar" },
      { value: "OTRO", label: "Otro" },
    ],
    []
  );

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const loadDashboard = async () => {
      try {
        setLoading(true);
        const result = await fetchDashboardReports({
          signal: controller.signal,
          filters: {
            dateRange: {
              start: filters.dateRange.start || undefined,
              end: filters.dateRange.end || undefined,
            },
            activityTypes: filters.activityTypes,
          },
        });
        if (!isMounted) {
          return;
        }
        setData({
          summaryCards: result.summaryCards || [],
          weeklyMetrics: result.weeklyMetrics || [],
          recentActivities: result.recentActivities || [],
          chartDatasets: result.chartDatasets || {
            participationByType: [],
            attendanceTrend: [],
            capacityVsAttendance: [],
          },
          datasetDocumentation: result.datasetDocumentation || {},
          filtersApplied: result.filtersApplied || {},
          generatedAt: result.generatedAt || null,
        });
        setError(null);
      } catch (err) {
        if (err.name === "AbortError") {
          return;
        }
        if (!isMounted) {
          return;
        }
        setError(err.message || "Ocurrió un error al cargar el dashboard.");
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
  }, [filters]);

  const handleDateRangeChange = (changes) => {
    setFilters((prev) => ({
      ...prev,
      dateRange: { ...prev.dateRange, ...changes },
    }));
  };

  const handleActivityTypeChange = (value) => {
    setFilters((prev) => ({
      ...prev,
      activityTypes: value ? [value] : [],
    }));
  };

  const handleExport = () => {
    if (loading) {
      if (typeof window !== "undefined" && typeof window.alert === "function") {
        window.alert("Espera a que termine la carga del dashboard para exportar las métricas.");
      }
      return;
    }

    if (error) {
      if (typeof window !== "undefined" && typeof window.alert === "function") {
        window.alert("No se puede exportar mientras exista un error en el dashboard.");
      }
      return;
    }

    if (exporting) {
      return;
    }

    try {
      setExporting(true);
      const workbook = buildDashboardWorkbook({
        summaryCards: data.summaryCards,
        weeklyMetrics: data.weeklyMetrics,
        recentActivities: data.recentActivities,
        generatedAt: data.generatedAt || new Date(),
      });
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      XLSX.writeFile(workbook, `dashboard_metricas_${timestamp}.xlsx`);
    } catch (err) {
      console.error("Error al exportar el dashboard", err);
      if (typeof window !== "undefined" && typeof window.alert === "function") {
        window.alert("No se pudo descargar el archivo de métricas. Inténtalo nuevamente.");
      }
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="h-full bg-stone-50">
      <TopBar />
      <Grid
        summaryCards={data.summaryCards}
        weeklyMetrics={data.weeklyMetrics}
        recentActivities={data.recentActivities}
        chartDatasets={data.chartDatasets}
        datasetDocumentation={data.datasetDocumentation}
        filtersApplied={data.filtersApplied}
        filters={filters}
        activityTypeOptions={activityTypeOptions}
        onDateRangeChange={handleDateRangeChange}
        onActivityTypeChange={handleActivityTypeChange}
        loading={loading}
        error={error}
        onExport={handleExport}
        exporting={exporting}
      />
    </div>
  );
};
