import React from "react";
import { formatMetricValue } from "../../services/reportsService";

export const MetricCard = ({ title, value, change, icon, format = "number", loading }) => {
  if (loading) {
    return (
      <div className="h-[130px] w-[260px] max-w-xs rounded-lg bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center gap-3">
          <div className="h-6 w-6 rounded-full bg-slate-200" />
          <div className="h-4 w-24 rounded bg-slate-200" />
        </div>
        <div className="mb-2 h-8 w-32 rounded bg-slate-200" />
        <div className="h-4 w-16 rounded bg-slate-200" />
      </div>
    );
  }

  const formattedValue = formatMetricValue(value, format);
  const hasChange = typeof change === "number" && Number.isFinite(change);
  const changeText = hasChange ? `${change > 0 ? "+" : ""}${change.toFixed(1)}%` : "–";
  const changeColor = hasChange
    ? change > 0
      ? "text-green-500"
      : change < 0
      ? "text-red-500"
      : "text-slate-500"
    : "text-slate-400";

  return (
    <div className="h-[130px] w-[260px] max-w-xs rounded-lg bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center gap-3">
        {icon ? (
          <img src={icon} alt={title} className="h-6 w-6" />
        ) : (
          <div className="h-6 w-6 rounded-full bg-slate-200" />
        )}
        <h2 className="text-base font-semibold text-slate-800">{title}</h2>
      </div>
      <p className="text-3xl font-bold text-violet-600">{formattedValue}</p>
      <p className={`text-sm mt-1 ${changeColor}`}>{changeText}</p>
    </div>
  );
};
