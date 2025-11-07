// src/pages/StatisticsPage.jsx
import React, { useState, useEffect } from 'react';
// --- YA NO IMPORTAMOS APPLAYOUT AQUÍ ---
import { useStatistics } from '../hooks/useStatistics';
import { StatCard } from '../components/Statistics/StatCard';
import { ParticipationChart } from '../components/Statistics/ParticipationChart';
import { TopActivitiesTable } from '../components/Statistics/TopActivitiesTable';
import { Users, Percent, UserPlus, BarChart3, Loader2 } from 'lucide-react';

const StatisticsPage = () => {
  const { stats, loading, refresh } = useStatistics();
  const [filters, setFilters] = useState({ dateRange: 'semester', activityType: 'all', compare: false });

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  useEffect(() => { refresh(filters); }, [filters, refresh]);

  // --- El <AppLayout> se ha eliminado de aquí ---

  return (
    // Devolvemos el contenido directamente, como un fragmento
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Panel de Analítica y Reportes</h1>
      </div>
      
      <div className="flex flex-wrap items-center gap-4 mb-8">
        <select name="dateRange" value={filters.dateRange} onChange={handleFilterChange} className="p-2 border border-gray-300 rounded-md bg-white shadow-sm focus:ring-2 focus:ring-blue-500">
          <option value="semester">Semestre Actual</option>
          <option value="month">Últimos 30 días</option>
        </select>
        <select name="activityType" value={filters.activityType} onChange={handleFilterChange} className="p-2 border border-gray-300 rounded-md bg-white shadow-sm focus:ring-2 focus:ring-blue-500">
          <option value="all">Todas las Actividades</option>
          <option value="Deportivo">Deportivo</option>
          <option value="Cultural">Cultural</option>
          <option value="Bienestar">Bienestar</option>
          <option value="Voluntariado">Voluntariado</option>
        </select>
        <div className="flex items-center gap-2 pl-4">
          <input type="checkbox" id="compare-checkbox" name="compare" checked={filters.compare} onChange={handleFilterChange} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
          <label htmlFor="compare-checkbox" className="text-sm font-medium text-gray-700">Comparar con período anterior</label>
        </div>
      </div>

      <div className="relative">
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-60 flex justify-center items-center z-10 rounded-xl">
            <Loader2 className="animate-spin text-blue-600" size={48} />
          </div>
        )}
        {stats ? (
          <div className="space-y-8 transition-opacity duration-300">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard icon={Users} label="Participantes Únicos" value={stats.kpis.totalParticipants.toLocaleString('es-ES')} comparisonValue={stats.comparison?.kpis.totalParticipants} />
              <StatCard icon={Percent} label="Tasa de Asistencia" value={stats.kpis.attendanceRate.toFixed(1)} unit="%" comparisonValue={stats.comparison?.kpis.attendanceRate} />
              <StatCard icon={UserPlus} label="Nuevos Participantes" value={stats.kpis.newParticipants.toLocaleString('es-ES')} comparisonValue={stats.comparison?.kpis.newParticipants} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              <div className="lg:col-span-3 bg-white p-6 rounded-xl border border-gray-200 shadow-sm"><h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2"><BarChart3 size={20} /> Participación por Tipo</h3><ParticipationChart data={stats.participationByType} /></div>
              <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm"><h3 className="text-lg font-semibold text-gray-800 p-4">Top Actividades</h3><TopActivitiesTable data={stats.topActivities} /></div>
            </div>
          </div>
        ) : ( !loading && <div className="text-center p-12">No se pudieron cargar los datos.</div> )}
      </div>
    </>
  );
};

export default StatisticsPage;