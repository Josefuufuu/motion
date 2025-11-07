// src/components/Statistics/TopActivitiesTable.jsx
import React from 'react';

export const TopActivitiesTable = ({ data }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left">
      <thead className="bg-gray-50"><tr>
        <th className="p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Actividad</th>
        <th className="p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Participantes</th>
        <th className="p-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Reincidencia</th>
      </tr></thead>
      <tbody className="divide-y divide-gray-200">
        {data.map((activity) => (
          <tr key={activity.name} className="hover:bg-gray-50">
            <td className="p-4 font-medium text-gray-800">{activity.name}</td>
            <td className="p-4 text-gray-600">{activity.participants.toLocaleString('es-ES')}</td>
            <td className="p-4 text-gray-600 font-medium">{activity.recurrence}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);