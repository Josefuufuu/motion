// src/components/Statistics/StatCard.jsx
import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

// Componente para mostrar la tendencia
const Trend = ({ value, comparisonValue }) => {
  if (comparisonValue === undefined || comparisonValue === null) return null;
  const change = value - comparisonValue;
  const isPositive = change >= 0;
  const percentageChange = ((change / comparisonValue) * 100).toFixed(1);

  return (
    <div className={`flex items-center text-xs font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
      {isPositive ? <ArrowUp size={12} className="mr-1" /> : <ArrowDown size={12} className="mr-1" />}
      {percentageChange}% vs. período anterior
    </div>
  );
};

export const StatCard = ({ icon: Icon, label, value, unit = '', comparisonValue }) => (
  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
    <div className="flex items-start justify-between">
      <div className="flex items-start gap-4">
        <div className="bg-blue-100 text-blue-600 p-3 rounded-lg">
          <Icon size={24} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="text-3xl font-bold text-gray-800">{value}<span className="text-xl font-semibold text-gray-500">{unit}</span></p>
        </div>
      </div>
    </div>
    {/* Mostramos la tendencia solo si hay datos de comparación */}
    <Trend value={parseFloat(value.replace(',',''))} comparisonValue={comparisonValue} />
  </div>
);