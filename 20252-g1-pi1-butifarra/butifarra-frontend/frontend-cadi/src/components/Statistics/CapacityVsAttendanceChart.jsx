import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export const CapacityVsAttendanceChart = ({ data = [] }) => {
  const labels = data.map((item) => item?.label ?? item?.category ?? "");

  const chartData = {
    labels,
    datasets: [
      {
        label: "Capacidad",
        data: data.map((item) => item?.capacity ?? 0),
        backgroundColor: "rgba(156, 163, 175, 0.6)",
        borderColor: "rgba(156, 163, 175, 1)",
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: "Asistentes",
        data: data.map((item) => item?.attendees ?? 0),
        backgroundColor: "rgba(16, 185, 129, 0.6)",
        borderColor: "rgba(16, 185, 129, 1)",
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      tooltip: {
        callbacks: {
          label: (item) => `${item.dataset.label}: ${item.parsed.y}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
  };

  return (
    <div className="h-80">
      <Bar options={options} data={chartData} />
    </div>
  );
};

export default CapacityVsAttendanceChart;
