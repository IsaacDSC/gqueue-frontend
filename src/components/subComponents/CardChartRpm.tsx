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
  ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { InsightsResponse, TimeSeriesData } from "../../types";

// Registrar os componentes necessários do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

interface CardChartRpmProps {
  title?: string;
  data?: number[];
  labels?: string[];
  className?: string;
  insights?: InsightsResponse;
}

const CardChartRpm: React.FC<CardChartRpmProps> = ({
  title = "RPM Chart",
  data = [10, 20, 30, 40, 50, 0, 5],
  labels = ["January", "February", "March", "April", "May", "June", "July"],
  className = "",
  insights,
}) => {
  // Process insights data if available
  const processedData = React.useMemo(() => {
    if (!insights) {
      return {
        chartData: [data],
        chartLabels: labels,
        datasets: [{ label: "Default", data }],
      };
    }

    const datasets: {
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
    }[] = [];
    let chartLabels: string[] = [];

    // Process publisher RPM data
    Object.entries(insights.rpm_publisher).forEach(([key, rpmData], index) => {
      const colors = [
        { border: "rgb(54, 162, 235)", bg: "rgba(54, 162, 235, 0.5)" },
        { border: "rgb(255, 99, 132)", bg: "rgba(255, 99, 132, 0.5)" },
        { border: "rgb(75, 192, 192)", bg: "rgba(75, 192, 192, 0.5)" },
        { border: "rgb(255, 205, 86)", bg: "rgba(255, 205, 86, 0.5)" },
      ];
      const color = colors[index % colors.length];

      if (Array.isArray(rpmData)) {
        // Old format
        const timeLabels = rpmData.map((item) =>
          new Date(item.time || "").toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        );
        const values = rpmData.map((item) => item.value || 0);

        if (chartLabels.length === 0) chartLabels = timeLabels;

        datasets.push({
          label: `Publisher: ${key}`,
          data: values,
          borderColor: color.border,
          backgroundColor: color.bg,
        });
      } else {
        // New format with timeseries and values arrays
        const timeLabels = (rpmData.timeseries || []).map((time) =>
          new Date(time).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        );
        const values = rpmData.values || [];

        if (chartLabels.length === 0) chartLabels = timeLabels;

        datasets.push({
          label: `Publisher: ${key}`,
          data: values,
          borderColor: color.border,
          backgroundColor: color.bg,
        });
      }
    });

    // Process consumer RPM data
    Object.entries(insights.rpm_consumer).forEach(([key, rpmData], index) => {
      const colors = [
        { border: "rgb(153, 102, 255)", bg: "rgba(153, 102, 255, 0.5)" },
        { border: "rgb(255, 159, 64)", bg: "rgba(255, 159, 64, 0.5)" },
        { border: "rgb(199, 199, 199)", bg: "rgba(199, 199, 199, 0.5)" },
        { border: "rgb(83, 102, 255)", bg: "rgba(83, 102, 255, 0.5)" },
      ];
      const color = colors[index % colors.length];

      if (Array.isArray(rpmData)) {
        // Old format
        const timeLabels = rpmData.map((item) =>
          new Date(item.time || "").toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        );
        const values = rpmData.map((item) => item.value || 0);

        if (chartLabels.length === 0) chartLabels = timeLabels;

        datasets.push({
          label: `Consumer: ${key}`,
          data: values,
          borderColor: color.border,
          backgroundColor: color.bg,
        });
      } else {
        // New format with timeseries and values arrays
        const timeLabels = (rpmData.timeseries || []).map((time) =>
          new Date(time).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        );
        const values = rpmData.values || [];

        if (chartLabels.length === 0) chartLabels = timeLabels;

        datasets.push({
          label: `Consumer: ${key}`,
          data: values,
          borderColor: color.border,
          backgroundColor: color.bg,
        });
      }
    });

    return {
      chartData: datasets.map((d) => d.data),
      chartLabels: chartLabels.length > 0 ? chartLabels : labels,
      datasets,
    };
  }, [insights, data, labels]);
  const chartData = {
    labels: processedData.chartLabels,
    datasets:
      processedData.datasets.length > 0
        ? processedData.datasets.map((dataset) => ({
            ...dataset,
            borderWidth: 2,
            fill: false,
            tension: 0.1,
            pointRadius: 4,
            pointHoverRadius: 6,
          }))
        : [
            {
              label: "Default Dataset",
              backgroundColor: "rgba(54, 162, 235, 0.5)",
              borderColor: "rgb(54, 162, 235)",
              borderWidth: 2,
              data: data,
              fill: false,
              tension: 0.1,
              pointRadius: 4,
              pointHoverRadius: 6,
            },
          ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        mode: "index",
        intersect: false,
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: "Time",
        },
        grid: {
          display: true,
          color: "rgba(0, 0, 0, 0.1)",
        },
        border: {
          display: true,
          color: "rgba(255, 0, 0, 1)",
          width: 2,
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: "RPM",
        },
        beginAtZero: true,
        grid: {
          display: true,
          color: "rgba(0, 0, 0, 0.1)",
        },
        border: {
          display: true,
          color: "rgba(255, 0, 0, 1)",
          width: 2,
        },
      },
    },
    interaction: {
      mode: "nearest",
      axis: "x",
      intersect: false,
    },
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          {insights ? "Messages per Minute (RPM)" : title}
        </h3>
        {insights && (
          <p className="text-sm text-gray-600 mt-1">
            Real-time message throughput for publishers and consumers
          </p>
        )}
      </div>
      <div className="h-64 w-full">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

export default CardChartRpm;
