// src/hooks/useStatistics.js
import { useState, useEffect, useCallback } from 'react';

// Base de datos de prueba completa
const fullMockData = {
  kpis: { totalParticipants: 2350, attendanceRate: 85.3, newParticipants: 420 },
  participationByType: [
    { type: 'Deportivo', count: 1250 }, { type: 'Cultural', count: 640 },
    { type: 'Bienestar', count: 320 }, { type: 'Voluntariado', count: 140 },
  ],
  topActivities: [
    { name: 'Copa ICESI Fútbol 2024', type: 'Deportivo', participants: 256, recurrence: '60%' },
    { name: 'Taller de Yoga Semanal', type: 'Bienestar', participants: 180, recurrence: '75%' },
    { name: 'Club de Cine de los Viernes', type: 'Cultural', participants: 120, recurrence: '40%' },
    { name: 'Voluntariado Techo', type: 'Voluntariado', participants: 95, recurrence: '90%' },
  ],
};

const previousPeriodData = {
  kpis: { totalParticipants: 1980, attendanceRate: 82.1, newParticipants: 350 },
  participationByType: [
    { type: 'Deportivo', count: 1100 }, { type: 'Cultural', count: 550 },
    { type: 'Bienestar', count: 250 }, { type: 'Voluntariado', count: 80 },
  ],
};

// Función que SIMULA el filtrado que haría el backend
const getFilteredData = (filters) => {
  let data = JSON.parse(JSON.stringify(fullMockData));
  if (filters.activityType !== 'all') {
    data.kpis.totalParticipants = Math.round(data.kpis.totalParticipants * 0.4);
    data.participationByType.forEach(p => { if (p.type !== filters.activityType) p.count = Math.round(p.count * 0.2); });
  }
  if (filters.compare) {
    data.comparison = previousPeriodData;
  }
  return data;
};

export const useStatistics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStatistics = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    console.log("Buscando estadísticas con filtros:", filters);
    
    setTimeout(() => {
      // --- CORRECCIÓN CLAVE ---
      // El nombre de la función es `getFilteredData`, no `getFiltered-Data`
      const data = getFilteredData(filters); 
      setStats(data);
      setLoading(false);
    }, 600);
  }, []);

  useEffect(() => { fetchStatistics(); }, [fetchStatistics]);

  return { stats, loading, error, refresh: fetchStatistics };
};