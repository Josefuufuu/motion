import React from 'react';
import { MetricCard } from './MetricCard';

// Replace these with your actual icons
import asistenciaIcon from '../../assets/icons/brain-icon.png';
import inscripcionesIcon from '../../assets/icons/brain-icon.png';
import ocupacionIcon from '../../assets/icons/brain-icon.png';
import incidenciasIcon from '../../assets/icons/brain-icon.png';

export const DashboardMetrics = () => {
  const metrics = [
    { title: 'Asistencia hoy', value: 324, change: 10, icon: asistenciaIcon },
    { title: 'Inscripciones abiertas', value: 1245, change: 6, icon: inscripcionesIcon },
    { title: 'Ocupación', value: '85%', change: -2, icon: ocupacionIcon },
    { title: 'Incidencias', value: 3, change: 0, icon: incidenciasIcon },
  ];

  return (
    <div className="flex flex-wrap gap-x-[22px] gap-y-6 px-[32px] justify-start">
      {metrics.map((metric, index) => (
        <div key={index} className="flex-grow basis-[calc((100%-66px)/4)] max-w-[260px] min-w-[180px]">
          <MetricCard
            title={metric.title}
            value={metric.value}
            change={metric.change}
            icon={metric.icon}
          />
        </div>
      ))}
    </div>
  );
};