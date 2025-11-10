import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const formatLabels = (data) =>
  data.map((item) => {
    if (!item?.date) {
      return "";
    }
    try {
      const parsed = new Date(item.date);
      if (Number.isNaN(parsed.getTime())) {
        return item.date;
      }
      return parsed.toLocaleDateString("es-ES", { month: "short", day: "numeric" });
    } catch (error) {
      return item.date;
    }
  });

export const AttendanceTrendChart = ({ data = [] }) => {
  const labels = formatLabels(data);
  const chartData = {
    labels,
    datasets: [
      {
        label: "Asistentes",
        data: data.map((item) => item?.attendees ?? 0),
        fill: false,
        borderColor: "rgba(37, 99, 235, 1)",
        backgroundColor: "rgba(37, 99, 235, 0.3)",
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          title: (items) => (items[0]?.label ? items[0].label : ""),
          label: (item) => `${item.parsed.y} asistentes`,
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
      <Line data={chartData} options={options} />
    </div>
  );
};

export default AttendanceTrendChart;
