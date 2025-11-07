import React from 'react';
import { RecentActivities } from './RecentActivities';
import { WeeklyMetrics } from './WeeklyMetrics';

export const DashboardPanels = () => {
  return (
    <div className="flex gap-6 px-[32px] py-6 mt-[50px]">
      <div className="flex-1">
        <RecentActivities />
      </div>
      <div className="flex-1">
        <WeeklyMetrics />
      </div>
    </div>
  );
};