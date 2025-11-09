import React from "react";
import { DashboardHeader } from "./DashboardHeader ";

import { DashboardMetrics } from "./DashboardMetrics";
import { QuickActions } from "./QuickACtions";
import { DashboardPanels } from "./DashboardBottomPanels";

export const Grid = ({
  summaryCards,
  weeklyMetrics,
  recentActivities,
  loading,
  error,
}) => {
  const hasError = Boolean(error);

  return (
    <div className="px-4 py-4 space-y-4">
      <DashboardHeader />
      {hasError ? (
        <div className="px-[32px]">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        </div>
      ) : null}
      <DashboardMetrics metrics={summaryCards} loading={loading} hasError={hasError} />
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
