import React from "react";
import { MetricCard } from "./MetricCard";
import dashboardIcon from "../../assets/icons/dashboard-icon.png";
import groupsIcon from "../../assets/icons/groups-icon.png";
import reportIcon from "../../assets/icons/report-icon.png";
import notificationIcon from "../../assets/icons/notification-icon.png";

const ICON_BY_KEY = {
  attendance_today: dashboardIcon,
  open_enrollments: groupsIcon,
  occupancy_rate: reportIcon,
  weekly_incidents: notificationIcon,
};

export const DashboardMetrics = ({ metrics = [], loading, hasError }) => {
  if (loading) {
    return (
      <div className="flex flex-wrap justify-start gap-x-[22px] gap-y-6 px-[32px]">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={`metric-skeleton-${index}`}
            className="flex-grow basis-[calc((100%-66px)/4)] min-w-[180px] max-w-[260px]"
          >
            <MetricCard loading />
          </div>
        ))}
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="px-[32px] text-sm text-slate-500">
        No se pudieron cargar las métricas del dashboard.
      </div>
    );
  }

  if (!metrics.length) {
    return (
      <div className="px-[32px] text-sm text-slate-500">No hay métricas para mostrar.</div>
    );
  }

  return (
    <div className="flex flex-wrap justify-start gap-x-[22px] gap-y-6 px-[32px]">
      {metrics.map((metric) => (
        <div
          key={metric.key}
          className="flex-grow basis-[calc((100%-66px)/4)] min-w-[180px] max-w-[260px]"
        >
          <MetricCard
            title={metric.label}
            value={metric.value}
            change={metric.change}
            format={metric.format}
            icon={ICON_BY_KEY[metric.key] ?? dashboardIcon}
          />
        </div>
      ))}
    </div>
  );
};
