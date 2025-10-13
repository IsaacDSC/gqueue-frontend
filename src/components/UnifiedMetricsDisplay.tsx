import React, { useMemo } from "react";
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
import { useMetricsControl } from "./UnifiedMetricsControl";
import { InsightsResponse, TimeSeriesData } from "../types";

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

interface UnifiedMetricsDisplayProps {
  insights: InsightsResponse;
}

interface MetricDisplayProps {
  title: string;
  data: Record<string, number | string>;
  type: "publisher" | "consumer" | "mixed";
  className?: string;
  color: {
    bg: string;
    border: string;
    text: string;
    accent: string;
  };
}

// Performance Metrics Display Component
export const PerformanceMetricsDisplay = ({
  insights,
}: UnifiedMetricsDisplayProps) => {
  const {
    selectedPublisher,
    selectedConsumers,
    availablePublishers,
    availableConsumers,
  } = useMetricsControl();

  const selectedMetrics = useMemo(() => {
    const metrics: Array<{
      label: string;
      value: number;
      type: string;
      metricType: string;
      color: string;
    }> = [];

    if (selectedPublisher) {
      const publisher = availablePublishers.find(
        (p) => p.id === selectedPublisher,
      );
      if (publisher) {
        // P99 metrics
        if (insights.publishers_p99?.[publisher.key] !== undefined) {
          metrics.push({
            label: publisher.key,
            value: insights.publishers_p99[publisher.key],
            type: "Publisher",
            metricType: "P99",
            color: "bg-blue-900 border-blue-700 text-blue-300",
          });
        }

        // P75 metrics
        if (insights.publishers_p75?.[publisher.key] !== undefined) {
          metrics.push({
            label: publisher.key,
            value: insights.publishers_p75[publisher.key],
            type: "Publisher",
            metricType: "P75",
            color: "bg-green-900 border-green-700 text-green-300",
          });
        }
      }
    }

    selectedConsumers.forEach((consumerId) => {
      const consumer = availableConsumers.find((c) => c.id === consumerId);
      if (consumer) {
        // P99 metrics
        if (insights.consumers_p99?.[consumer.key] !== undefined) {
          metrics.push({
            label: consumer.key,
            value: insights.consumers_p99[consumer.key],
            type: "Consumer",
            metricType: "P99",
            color: "bg-blue-900 border-blue-700 text-blue-300",
          });
        }

        // P75 metrics
        if (insights.consumers_p75?.[consumer.key] !== undefined) {
          metrics.push({
            label: consumer.key,
            value: insights.consumers_p75[consumer.key],
            type: "Consumer",
            metricType: "P75",
            color: "bg-green-900 border-green-700 text-green-300",
          });
        }
      }
    });

    return metrics;
  }, [
    selectedPublisher,
    selectedConsumers,
    availablePublishers,
    availableConsumers,
    insights,
  ]);

  if (selectedMetrics.length === 0) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg shadow border border-gray-700">
        <h2 className="text-lg font-semibold mb-4 text-white">
          ⚡ Performance Metrics
        </h2>
        <div className="text-center py-8 text-gray-400">
          <p className="text-lg mb-2">📊 No metrics selected</p>
          <p className="text-sm">
            Use the control panel above to select publishers and consumers
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow border border-gray-700">
      <h2 className="text-lg font-semibold mb-6 text-white">
        ⚡ Performance Metrics
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {selectedMetrics.map((metric, index) => (
          <div
            key={`${metric.type}-${metric.metricType}-${metric.label}`}
            className={`text-center p-3 rounded-lg border ${metric.color}`}
          >
            <p className="text-sm font-medium">
              {metric.type} {metric.metricType}
            </p>
            <p className="text-lg font-bold text-white">{metric.value}ms</p>
            <p className="text-xs text-gray-400">{metric.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// Segmentation Metrics Display Component
export const SegmentationMetricsDisplay = ({
  insights,
}: UnifiedMetricsDisplayProps) => {
  const {
    selectedPublisher,
    selectedConsumers,
    availablePublishers,
    availableConsumers,
  } = useMetricsControl();

  const selectedMetrics = useMemo(() => {
    const publishedMetrics: Array<{ label: string; value: number | string }> =
      [];
    const consumedMetrics: Array<{ label: string; value: number | string }> =
      [];

    if (selectedPublisher) {
      const publisher = availablePublishers.find(
        (p) => p.id === selectedPublisher,
      );
      if (
        publisher &&
        insights.total_segmentation_published?.[publisher.key] !== undefined
      ) {
        publishedMetrics.push({
          label: publisher.key,
          value: insights.total_segmentation_published[publisher.key],
        });
      }
    }

    selectedConsumers.forEach((consumerId) => {
      const consumer = availableConsumers.find((c) => c.id === consumerId);
      if (
        consumer &&
        insights.total_segmentation_consumed?.[consumer.key] !== undefined
      ) {
        consumedMetrics.push({
          label: consumer.key,
          value: insights.total_segmentation_consumed[consumer.key],
        });
      }
    });

    return { publishedMetrics, consumedMetrics };
  }, [
    selectedPublisher,
    selectedConsumers,
    availablePublishers,
    availableConsumers,
    insights,
  ]);

  const hasData =
    selectedMetrics.publishedMetrics.length > 0 ||
    selectedMetrics.consumedMetrics.length > 0;

  if (!hasData) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg shadow border border-gray-700">
        <h2 className="text-lg font-semibold mb-4 text-white">
          📊 Topic Segmentation
        </h2>
        <div className="text-center py-8 text-gray-400">
          <p className="text-lg mb-2">📈 No segmentation data</p>
          <p className="text-sm">
            Select publishers and consumers to view segmentation metrics
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Published Metrics */}
      {selectedMetrics.publishedMetrics.length > 0 && (
        <div className="bg-gray-800 p-6 rounded-lg shadow border border-gray-700">
          <h2 className="text-lg font-semibold mb-4 text-white">
            📤 Published by Topic
          </h2>
          <div className="space-y-3">
            {selectedMetrics.publishedMetrics.map((metric) => (
              <div
                key={`pub-${metric.label}`}
                className="flex justify-between items-center p-3 bg-purple-900 rounded-lg border border-purple-700"
              >
                <span className="text-sm font-medium text-purple-300">
                  {metric.label}
                </span>
                <span className="font-bold text-purple-200">
                  {metric.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Consumed Metrics */}
      {selectedMetrics.consumedMetrics.length > 0 && (
        <div className="bg-gray-800 p-6 rounded-lg shadow border border-gray-700">
          <h2 className="text-lg font-semibold mb-4 text-white">
            📥 Consumed by Consumer
          </h2>
          <div className="space-y-3">
            {selectedMetrics.consumedMetrics.map((metric) => (
              <div
                key={`cons-${metric.label}`}
                className="flex justify-between items-center p-3 bg-orange-900 rounded-lg border border-orange-700"
              >
                <span className="text-sm font-medium text-orange-300">
                  {metric.label}
                </span>
                <span className="font-bold text-orange-200">
                  {metric.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// RPM Chart Display Component
export const RpmChartDisplay = ({ insights }: UnifiedMetricsDisplayProps) => {
  const {
    selectedPublisher,
    selectedConsumers,
    availablePublishers,
    availableConsumers,
  } = useMetricsControl();

  const chartData = useMemo(() => {
    const datasets: Array<{
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
      borderWidth: number;
      fill: boolean;
      tension: number;
      pointRadius: number;
      pointHoverRadius: number;
    }> = [];
    let chartLabels: string[] = [];

    const publisherColors = [
      { border: "rgb(54, 162, 235)", bg: "rgba(54, 162, 235, 0.5)" },
      { border: "rgb(255, 99, 132)", bg: "rgba(255, 99, 132, 0.5)" },
      { border: "rgb(75, 192, 192)", bg: "rgba(75, 192, 192, 0.5)" },
    ];

    const consumerColors = [
      { border: "rgb(153, 102, 255)", bg: "rgba(153, 102, 255, 0.5)" },
      { border: "rgb(255, 159, 64)", bg: "rgba(255, 159, 64, 0.5)" },
      { border: "rgb(199, 199, 199)", bg: "rgba(199, 199, 199, 0.5)" },
    ];

    // Add selected publisher data
    if (selectedPublisher) {
      const publisher = availablePublishers.find(
        (p) => p.id === selectedPublisher,
      );
      if (publisher && insights.rpm_publisher?.[publisher.key]) {
        const rpmData = insights.rpm_publisher[publisher.key];
        let timeLabels: string[] = [];
        let values: number[] = [];

        if (Array.isArray(rpmData)) {
          timeLabels = rpmData.map((item) =>
            new Date(item.time || "").toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          );
          values = rpmData.map((item) => item.value || 0);
        } else {
          timeLabels = (rpmData.timeseries || []).map((time) =>
            new Date(time).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          );
          values = rpmData.values || [];
        }

        if (chartLabels.length === 0) chartLabels = timeLabels;

        datasets.push({
          label: `Publisher: ${publisher.key}`,
          data: values,
          borderColor: publisherColors[0].border,
          backgroundColor: publisherColors[0].bg,
          borderWidth: 2,
          fill: false,
          tension: 0.1,
          pointRadius: 4,
          pointHoverRadius: 6,
        });
      }
    }

    // Add selected consumer data
    selectedConsumers.forEach((consumerId, index) => {
      const consumer = availableConsumers.find((c) => c.id === consumerId);
      if (consumer && insights.rpm_consumer?.[consumer.key]) {
        const rpmData = insights.rpm_consumer[consumer.key];
        let timeLabels: string[] = [];
        let values: number[] = [];

        if (Array.isArray(rpmData)) {
          timeLabels = rpmData.map((item) =>
            new Date(item.time || "").toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          );
          values = rpmData.map((item) => item.value || 0);
        } else {
          timeLabels = (rpmData.timeseries || []).map((time) =>
            new Date(time).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          );
          values = rpmData.values || [];
        }

        if (chartLabels.length === 0) chartLabels = timeLabels;

        const colorIndex = index % consumerColors.length;
        datasets.push({
          label: `Consumer: ${consumer.key}`,
          data: values,
          borderColor: consumerColors[colorIndex].border,
          backgroundColor: consumerColors[colorIndex].bg,
          borderWidth: 2,
          fill: false,
          tension: 0.1,
          pointRadius: 4,
          pointHoverRadius: 6,
        });
      }
    });

    return {
      labels: chartLabels,
      datasets,
    };
  }, [
    selectedPublisher,
    selectedConsumers,
    availablePublishers,
    availableConsumers,
    insights,
  ]);

  const chartOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          color: "#E5E7EB", // gray-200
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        mode: "index",
        intersect: false,
        backgroundColor: "rgba(17, 24, 39, 0.9)", // gray-900 with opacity
        titleColor: "#E5E7EB",
        bodyColor: "#D1D5DB",
        borderColor: "#374151",
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: "Time",
          color: "#D1D5DB", // gray-300
        },
        ticks: {
          color: "#9CA3AF", // gray-400
        },
        grid: {
          display: true,
          color: "rgba(75, 85, 99, 0.3)", // gray-600 with opacity
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: "RPM",
          color: "#D1D5DB", // gray-300
        },
        ticks: {
          color: "#9CA3AF", // gray-400
        },
        beginAtZero: true,
        grid: {
          display: true,
          color: "rgba(75, 85, 99, 0.3)", // gray-600 with opacity
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
    <div className="bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-700">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-2">
          📈 Messages per Minute (RPM)
        </h3>
        <p className="text-sm text-gray-300">
          Real-time message throughput for selected publishers and consumers
        </p>
      </div>

      <div className="h-64 w-full">
        {chartData.datasets.length > 0 ? (
          <Line data={chartData} options={chartOptions} />
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-700 rounded-lg">
            <div className="text-center">
              <p className="text-gray-400 text-lg mb-2">
                📊 No RPM data selected
              </p>
              <p className="text-gray-500 text-sm">
                Select publishers and consumers to view RPM chart
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Active Metrics Summary */}
      {chartData.datasets.length > 0 && (
        <div className="mt-4 p-3 bg-gray-700 rounded-lg border border-gray-600">
          <h4 className="text-sm font-medium text-gray-300 mb-2">
            📋 Active in Chart:
          </h4>
          <div className="flex flex-wrap gap-2">
            {chartData.datasets.map((dataset, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: dataset.backgroundColor,
                  color: dataset.borderColor,
                  border: `1px solid ${dataset.borderColor}`,
                }}
              >
                {dataset.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
