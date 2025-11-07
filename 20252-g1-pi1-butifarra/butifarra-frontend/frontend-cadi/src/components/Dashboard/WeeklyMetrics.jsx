import React from 'react';

export const WeeklyMetrics = () => {
  const metrics = [
    { label: 'Nuevos usuarios', value: 45, change: '+23%' },
    { label: 'Actividades completadas', value: 156, change: '+23%' },
    { label: 'Cancelaciones', value: 45, change: '+38%' },
    { label: 'Satisfacción promedio', value: '4.5/5', change: '+2%' },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 w-full">
      <h2 className="text-lg font-semibold text-slate-800 mb-1">Métricas de la semana</h2>
      <p className="text-sm text-stone-500 mb-4">Comparación con semana anterior</p>
      <div className="space-y-4">
        {metrics.map((metric, index) => (
          <div key={index} className="flex justify-between items-center">
            <span className="text-base text-slate-700">{metric.label}</span>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-slate-800">{metric.value}</span>
              <span className="text-sm text-green-500">{metric.change}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};