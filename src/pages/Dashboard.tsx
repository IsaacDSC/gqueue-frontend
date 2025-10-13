import React, { useState } from "react";
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
import { Link } from "../components/Link";
import AddEventModal from "../components/AddEventModal";
import PublishEventCard from "../components/PublishEventCard";
import { useRegisteredEvents } from "../hooks/useRegisteredEvents";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

const QQueueDashboard: React.FC = () => {
  const { events, loading, error, refreshEvents, clearError } =
    useRegisteredEvents();
  const [autoOn, setAutoOn] = useState(true);
  const [debugMode, setDebugMode] = useState(false);
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);

  // Sample data for charts
  // const timeLabels = [
  //   "00:15:28",
  //   "00:15:48",
  //   "00:16:08",
  //   "00:16:28",
  //   "00:16:48",
  //   "00:17:08",
  //   "00:17:28",
  //   "00:17:48",
  //   "00:18:08",
  //   "00:18:28",
  // ];

  // const rpmData = {
  //   labels: timeLabels,
  //   datasets: [
  //     {
  //       label: "RPM",
  //       data: [800, 1400, 1200, 900, 600, 1500, 1300, 800, 1200, 1000],
  //       borderColor: "#3B82F6",
  //       backgroundColor: "rgba(59, 130, 246, 0.1)",
  //       borderWidth: 2,
  //       tension: 0.4,
  //       pointRadius: 0,
  //       pointHoverRadius: 4,
  //     },
  //   ],
  // };

  // const latencyData = {
  //   labels: timeLabels,
  //   datasets: [
  //     {
  //       label: "Latency",
  //       data: [120, 200, 180, 100, 150, 90, 160, 140, 180, 200],
  //       borderColor: "#F59E0B",
  //       backgroundColor: "rgba(245, 158, 11, 0.1)",
  //       borderWidth: 2,
  //       tension: 0.4,
  //       pointRadius: 0,
  //       pointHoverRadius: 4,
  //     },
  //   ],
  // };

  // const dlqData = {
  //   labels: timeLabels,
  //   datasets: [
  //     {
  //       label: "DLQ RPM",
  //       data: [25, 45, 50, 35, 20, 15, 40, 35, 30, 25],
  //       borderColor: "#EF4444",
  //       backgroundColor: "rgba(239, 68, 68, 0.1)",
  //       borderWidth: 2,
  //       tension: 0.4,
  //       pointRadius: 0,
  //       pointHoverRadius: 4,
  //     },
  //   ],
  // };

  // const chartOptions: ChartOptions<"line"> = {
  //   responsive: true,
  //   maintainAspectRatio: false,
  //   plugins: {
  //     legend: {
  //       display: false,
  //     },
  //     tooltip: {
  //       backgroundColor: "rgba(0, 0, 0, 0.8)",
  //       titleColor: "#fff",
  //       bodyColor: "#fff",
  //       borderColor: "#374151",
  //       borderWidth: 1,
  //     },
  //   },
  //   scales: {
  //     x: {
  //       grid: {
  //         color: "rgba(55, 65, 81, 0.3)",
  //       },
  //       ticks: {
  //         color: "#9CA3AF",
  //         font: {
  //           size: 10,
  //         },
  //       },
  //     },
  //     y: {
  //       grid: {
  //         color: "rgba(55, 65, 81, 0.3)",
  //       },
  //       ticks: {
  //         color: "#9CA3AF",
  //         font: {
  //           size: 10,
  //         },
  //       },
  //     },
  //   },
  //   interaction: {
  //     intersect: false,
  //     mode: "index",
  //   },
  // };

  const handleRefresh = () => {
    clearError();
    refreshEvents();
  };

  const formatRetention = (retention: string) => {
    if (retention.includes("h")) {
      const hours = parseInt(retention.split("h")[0]);
      if (hours >= 24) {
        return `${hours / 24} dias`;
      }
      return `${hours} horas`;
    }
    return retention;
  };

  const formatDuration = (duration: string) => {
    if (duration.includes("m") && duration.includes("s")) {
      return duration.replace("m", " min ").replace("s", " seg");
    }
    return duration;
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case "active":
        return "bg-green-600 text-green-100";
      case "inactive":
        return "bg-red-600 text-red-100";
      case "paused":
        return "bg-yellow-600 text-yellow-100";
      default:
        return "bg-gray-600 text-gray-100";
    }
  };

  const getTriggerTypeColor = (type: string) => {
    switch (type) {
      case "persistent":
        return "bg-blue-600 text-blue-100";
      case "immediate":
        return "bg-purple-600 text-purple-100";
      default:
        return "bg-gray-600 text-gray-100";
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="text-blue-400 hover:text-blue-300 text-sm mr-4"
          >
            ← Back to Home
          </Link>
          <h1 className="text-2xl font-bold">GQueue Dashboard</h1>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${error ? "bg-red-400" : "bg-green-400"}`}
            ></div>
            <span
              className={`text-sm ${error ? "text-red-400" : "text-green-400"}`}
            >
              {error ? "API Error" : "API Connected"}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-3 py-2 bg-gray-700 rounded-md text-sm">
            <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
            Server
          </button>
          <button className="flex items-center gap-2 px-3 py-2 bg-gray-700 rounded-md text-sm border border-blue-500">
            <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
            Theme
          </button>
          <button className="flex items-center gap-2 px-3 py-2 bg-gray-700 rounded-md text-sm">
            <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
            System
          </button>
        </div>
      </div>

      {/* Charts Section */}
      {/*<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">
            RPM (Requests Per Minute)
          </h3>
          <div className="h-48 mb-4">
            <Line data={rpmData} options={chartOptions} />
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400">973</div>
            <div className="text-sm text-gray-400">Current RPM</div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">LAG (Latency)</h3>
          <div className="h-48 mb-4">
            <Line data={latencyData} options={chartOptions} />
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-400">231ms</div>
            <div className="text-sm text-gray-400">Average Latency</div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">DLQ RPM</h3>
          <div className="h-48 mb-4">
            <Line data={dlqData} options={chartOptions} />
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-400">36</div>
            <div className="text-sm text-gray-400">Dead Letter Queue RPM</div>
          </div>
        </div>
      </div>*/}

      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold">Event Management</h3>
            <p className="text-sm text-gray-400">
              Create and manage queue events
            </p>
          </div>
          <button
            onClick={() => setIsAddEventModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2"
          >
            <span>+</span>
            Add Event
          </button>
        </div>

        <div className="text-sm">
          <span className="text-gray-400">API: </span>
          <span className={error ? "text-red-400" : "text-green-400"}>
            {error ? `Error: ${error}` : "Connected to http://localhost:8080"}
          </span>
        </div>
      </div>

      {/* Publish Event Section */}
      <PublishEventCard className="mb-6" />

      {/* Registered Events Section */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold">Registered Events</h3>
            <p className="text-sm text-gray-400">
              Status:{" "}
              <span className={error ? "text-red-400" : "text-green-400"}>
                {error ? "Error" : "OK"}
              </span>{" "}
              • Count: <span className="text-blue-400">{events.length}</span> •
              Last updated:{" "}
              <span className="text-gray-300">
                {new Date().toLocaleTimeString()}
              </span>
            </p>
          </div>

          <div className="flex gap-4 items-center">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoOn}
                onChange={(e) => setAutoOn(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
              Auto ON
            </label>

            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 rounded-md text-sm"
            >
              <svg
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh
            </button>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={debugMode}
                onChange={(e) => setDebugMode(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
              Debug
            </label>
          </div>
        </div>

        {/* Events List */}
        {loading && events.length === 0 ? (
          <div className="bg-gray-700 rounded-lg p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <p className="text-gray-400">Carregando eventos...</p>
          </div>
        ) : error ? (
          <div className="bg-red-900 border border-red-700 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <svg
                className="w-5 h-5 text-red-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-red-200 font-medium">
                Erro ao carregar eventos
              </span>
            </div>
            <p className="text-red-300 text-sm mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm"
            >
              Tentar Novamente
            </button>
          </div>
        ) : events.length === 0 ? (
          <div className="bg-gray-700 rounded-lg p-6 text-center">
            <div className="text-gray-400 mb-4">
              <svg
                className="w-16 h-16 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m0 0v5a2 2 0 002 2h8a2 2 0 002-2v-5m-6 0V9a2 2 0 00-2-2H8a2 2 0 00-2 2v4m4 0v2"
                />
              </svg>
              Nenhum evento registrado encontrado
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {events.slice(0, 3).map((event) => (
              <div key={event.id} className="bg-gray-700 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <h4 className="text-xl font-semibold">{event.name}</h4>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getStateColor(event.state)}`}
                    >
                      {event.state}
                    </span>
                    <span className="px-2 py-1 rounded text-xs font-medium bg-gray-600 text-gray-100">
                      {event.service_name}
                    </span>
                    {event.triggers.map((trigger, idx) => (
                      <span
                        key={idx}
                        className={`px-2 py-1 rounded text-xs font-medium ${getTriggerTypeColor(trigger.type)}`}
                      >
                        {trigger.type}
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm">
                      View JSON
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Team: </span>
                    <span className="text-white">{event.team_owner}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Max Retries: </span>
                    <span className="text-white">
                      {event.triggers[0]?.option.max_retries || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Retention: </span>
                    <span className="text-white">
                      {formatRetention(
                        event.triggers[0]?.option.retention || "",
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">TTL: </span>
                    <span className="text-white">
                      {formatDuration(
                        event.triggers[0]?.option.unique_ttl || "",
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Consumer: </span>
                    <span className="text-white">
                      {event.triggers[0]?.service_name || "N/A"}
                    </span>
                  </div>
                  <div className="lg:col-span-3">
                    <span className="text-gray-400">Endpoint: </span>
                    <span className="text-white">
                      {event.triggers[0]
                        ? `${event.triggers[0].host}${event.triggers[0].path}`
                        : "N/A"}
                    </span>
                  </div>
                  <div className="lg:col-span-4">
                    <span className="text-gray-400">Created: </span>
                    <span className="text-white">
                      {event.created_at
                        ? new Date(event.created_at).toLocaleString()
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {events.length > 3 && (
              <div className="text-center">
                <Link
                  to="/events"
                  className="inline-block bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm font-medium"
                >
                  Ver todos os {events.length} eventos
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Event Modal */}
      <AddEventModal
        isOpen={isAddEventModalOpen}
        onClose={() => setIsAddEventModalOpen(false)}
        onSuccess={() => {
          // Optionally refresh events list or show success message
          console.log("Event created successfully!");
        }}
      />
    </div>
  );
};

export default QQueueDashboard;
