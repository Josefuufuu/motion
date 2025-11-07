// src/components/Statistics/ParticipationChart.jsx
import React from 'react';
import { Bar } from 'react-chartjs-2';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';


ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export const ParticipationChart = ({ data }) => {
  const chartData = {
    labels: data.map(d => d.type),
    datasets: [{
      label: 'Nº de Participantes',
      data: data.map(d => d.count),
      backgroundColor: 'rgba(59, 130, 246, 0.6)',
      borderColor: 'rgba(59, 130, 246, 1)',
      borderWidth: 1,
      borderRadius: 5,
    }]
  };
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  return (
    <div className="h-80">
      <Bar options={options} data={chartData} />
    </div>
  );
};