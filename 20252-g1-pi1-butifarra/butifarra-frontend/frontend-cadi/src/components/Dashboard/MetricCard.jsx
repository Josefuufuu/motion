import React from 'react';

export const MetricCard = ({ title, value, change, icon }) => {
  const isPositive = change >= 0;

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 w-[260px] max-w-xs h-[130px]">
      <div className="flex items-center gap-3 mb-2">
        <img src={icon} alt={title} className="w-{[] h-6" />
        <h2 className="text-base font-semibold text-slate-800">{title}</h2>
      </div>
      <p className="text-3xl font-bold text-violet-600">{value}</p>
      <p className={`text-sm mt-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
        {isPositive ? '+' : ''}{change}%
      </p>
    </div>
  );
};