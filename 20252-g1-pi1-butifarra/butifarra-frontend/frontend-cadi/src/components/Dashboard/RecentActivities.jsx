import React from 'react';

export const RecentActivities = () => {
  const activities = [
    { title: 'Yoga matutino', participants: 15, time: 'Hace 2 min', status: 'Actividad' },
    { title: 'Torneo Fútbol 5', participants: 18, time: 'Hace 2 min', status: 'Pendiente' },
    { title: 'Taller Fotografía', participants: 20, time: 'Hace 2 min', status: 'Llena' },
  ];

  const statusColors = {
    Actividad: 'bg-blue-500 text-white',
    Pendiente: 'bg-cyan-500 text-white',
    Llena: 'bg-stone-300 text-stone-700',
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 w-full">
      <h2 className="text-lg font-semibold text-slate-800 mb-1">Actividades recientes</h2>
      <p className="text-sm text-stone-500 mb-4">Últimas inscripciones y cambios</p>
      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div key={index} className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-medium text-slate-700">{activity.title}</h3>
              <p className="text-sm text-stone-500">
                {activity.participants} participantes – {activity.time}
              </p>
            </div>
            <span className={`text-xs px-3 py-1 rounded-full ${statusColors[activity.status]}`}>
              {activity.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};