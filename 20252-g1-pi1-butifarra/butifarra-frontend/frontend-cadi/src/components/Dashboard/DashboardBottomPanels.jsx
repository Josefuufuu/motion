import React from "react";
import { RecentActivities } from "./RecentActivities";
import { WeeklyMetrics } from "./WeeklyMetrics";

export const DashboardPanels = ({ weeklyMetrics, recentActivities, loading, hasError }) => {
  return (
    <div className="mt-[50px] flex flex-col gap-6 px-[32px] py-6 xl:flex-row">
      <div className="flex-1">
        <RecentActivities
          activities={recentActivities}
          loading={loading}
          hasError={hasError}
        />
      </div>
      <div className="flex-1">
        <WeeklyMetrics metrics={weeklyMetrics} loading={loading} hasError={hasError} />
      </div>
    </div>
  );
};
