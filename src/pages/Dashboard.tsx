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
import { useConnectionConfig } from "../hooks/useConnectionConfig";

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
  const { error } = useRegisteredEvents();
  const { getConnectionConfig } = useConnectionConfig();
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);

  const connectionConfig = getConnectionConfig();
  const serverUrl = connectionConfig?.serverUrl || "http://localhost:8080";


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
            {error ? `Error: ${error}` : `Connected to ${serverUrl}`}
          </span>
        </div>
      </div>

      {/* Publish Event Section */}
      <PublishEventCard className="mb-6" />

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
