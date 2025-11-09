import React, { useEffect, useState } from "react";
import { TopBar } from "./TopBar";
import { Grid } from "./Grid";
import { fetchDashboardReports } from "../../services/reportsService";

export const Dashboard = () => {
  const [data, setData] = useState({
    summaryCards: [],
    weeklyMetrics: [],
    recentActivities: [],
  });
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
        setData(result);
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
  }, []);

  return (
    <div className="h-full bg-stone-50">
      <TopBar />
      <Grid
        summaryCards={data.summaryCards}
        weeklyMetrics={data.weeklyMetrics}
        recentActivities={data.recentActivities}
        loading={loading}
        error={error}
      />
    </div>
  );
};
