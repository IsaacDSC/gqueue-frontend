import React, { useState } from "react";
import { useMetricsControl } from "./UnifiedMetricsControl";
import { getLocalStorageInfo } from "../hooks/useLocalStorage";

interface MetricsDebugPanelProps {
  className?: string;
}

const MetricsDebugPanel: React.FC<MetricsDebugPanelProps> = ({
  className = "",
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [storageInfo, setStorageInfo] = useState(getLocalStorageInfo());
  const [clearTrigger, setClearTrigger] = useState(0);

  const {
    selectedPublisher,
    selectedConsumers,
    availablePublishers,
    availableConsumers,
  } = useMetricsControl();

  const refreshStorageInfo = () => {
    setStorageInfo(getLocalStorageInfo());
  };

  const exportConfiguration = () => {
    const config = {
      selectedPublisher,
      selectedConsumers,
      availablePublishers: availablePublishers.map((p) => ({
        id: p.id,
        label: p.label,
        sources: p.sources,
      })),
      availableConsumers: availableConsumers.map((c) => ({
        id: c.id,
        label: c.label,
        sources: c.sources,
      })),
      timestamp: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(config, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `metrics-config-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearLocalStorage = () => {
    if (
      window.confirm(
        "Are you sure you want to clear all localStorage data? This action cannot be undone.",
      )
    ) {
      localStorage.clear();
      setStorageInfo(getLocalStorageInfo());
      setClearTrigger((prev) => prev + 1);
      // Force re-render of components that depend on localStorage
      window.dispatchEvent(new Event("storage"));
    }
  };

  if (!isExpanded) {
    return (
      <div className={`bg-gray-800 text-white p-2 rounded-lg ${className}`}>
        <button
          onClick={() => setIsExpanded(true)}
          className="text-xs text-gray-300 hover:text-white flex items-center"
        >
          🔧 Debug Panel
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-gray-800 text-white p-4 rounded-lg ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-medium">🔧 Metrics Debug Panel</h3>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-gray-400 hover:text-white text-sm"
        >
          ✕
        </button>
      </div>

      <div className="space-y-4 text-xs">
        {/* Current State */}
        <div>
          <h4 className="text-yellow-400 font-medium mb-2">Current State</h4>
          <div className="bg-gray-700 p-2 rounded">
            <div>
              <strong>Publisher:</strong> {selectedPublisher || "None"}
            </div>
            <div>
              <strong>Consumers:</strong> {selectedConsumers.length} selected
            </div>
            <div>
              <strong>Available Publishers:</strong>{" "}
              {availablePublishers.length}
            </div>
            <div>
              <strong>Available Consumers:</strong> {availableConsumers.length}
            </div>
          </div>
        </div>

        {/* localStorage Info */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-yellow-400 font-medium">localStorage Usage</h4>
            <button
              onClick={refreshStorageInfo}
              className="text-blue-400 hover:text-blue-300"
            >
              🔄 Refresh
            </button>
          </div>
          <div className="bg-gray-700 p-2 rounded">
            <div>
              <strong>Used:</strong> {(storageInfo.used / 1024).toFixed(2)} KB
            </div>
            <div>
              <strong>Total:</strong>{" "}
              {(storageInfo.total / 1024 / 1024).toFixed(2)} MB
            </div>
            <div>
              <strong>Usage:</strong> {storageInfo.usedPercentage?.toFixed(2)}%
            </div>
            <div className="mt-1">
              <div className="w-full bg-gray-600 rounded-full h-1">
                <div
                  className="bg-blue-500 h-1 rounded-full"
                  style={{
                    width: `${Math.min(storageInfo.usedPercentage || 0, 100)}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Stored Keys */}
        <div>
          <h4 className="text-yellow-400 font-medium mb-2">Stored Keys</h4>
          <div className="bg-gray-700 p-2 rounded">
            {Object.keys(localStorage)
              .filter((key) => key.startsWith("metricsControl_"))
              .map((key) => (
                <div key={key} className="flex justify-between items-center">
                  <span>{key}</span>
                  <span className="text-gray-400">
                    {localStorage.getItem(key)?.length} chars
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* Raw Data */}
        <div>
          <h4 className="text-yellow-400 font-medium mb-2">Raw Data</h4>
          <div className="bg-gray-700 p-2 rounded max-h-32 overflow-y-auto">
            <pre className="text-xs">
              {JSON.stringify(
                {
                  selectedPublisher,
                  selectedConsumers,
                  publisherCount: availablePublishers.length,
                  consumerCount: availableConsumers.length,
                },
                null,
                2,
              )}
            </pre>
          </div>
        </div>

        {/* Actions */}
        <div>
          <h4 className="text-yellow-400 font-medium mb-2">Actions</h4>
          <div className="flex space-x-2">
            <button
              onClick={exportConfiguration}
              className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs"
            >
              📥 Export Config
            </button>
            <button
              onClick={clearLocalStorage}
              className="bg-blue-600 hover:bg-red-700 px-2 py-1 rounded text-xs"
            >
              🗑️ Clear All
            </button>
          </div>
        </div>

        {/* Environment Info */}
        <div>
          <h4 className="text-yellow-400 font-medium mb-2">Environment</h4>
          <div className="bg-gray-700 p-2 rounded">
            <div>
              <strong>localStorage supported:</strong>{" "}
              {typeof Storage !== "undefined" ? "Yes" : "No"}
            </div>
            <div>
              <strong>User Agent:</strong>{" "}
              {navigator.userAgent.split(" ").slice(-2).join(" ")}
            </div>
            <div>
              <strong>Timestamp:</strong> {new Date().toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricsDebugPanel;
