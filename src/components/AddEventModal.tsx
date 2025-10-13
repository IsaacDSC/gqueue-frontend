import React, { useState } from "react";
import { useEvents, EventFormData, CreateEventRequest } from "../hooks";

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface TriggerFormData {
  service_name: string;
  type: string;
  host: string;
  path: string;
  queue_type: string;
  max_retries: number;
  retention: string;
  unique_ttl: string;
}

const AddEventModal: React.FC<AddEventModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { createEvent, loading, error, clearError, testApiConnection } =
    useEvents();
  const [formData, setFormData] = useState<
    Omit<
      EventFormData,
      | "trigger_service_name"
      | "trigger_type"
      | "host"
      | "path"
      | "queue_type"
      | "max_retries"
      | "retention"
      | "unique_ttl"
    >
  >({
    // Event Details
    name: "",
    service_name: "",
    repo_url: "",
    team_owner: "",
  });

  const [triggers, setTriggers] = useState<TriggerFormData[]>([
    {
      service_name: "",
      type: "persistent",
      host: "",
      path: "",
      queue_type: "external.medium",
      max_retries: 3,
      retention: "168h",
      unique_ttl: "60s",
    },
  ]);

  const [showApiConfig, setShowApiConfig] = useState(false);
  const [apiBaseUrl, setApiBaseUrl] = useState("http://localhost:8080");
  const [timeout, setTimeout] = useState(10000);
  const [debugMode, setDebugMode] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>("");
  const [jsonMode, setJsonMode] = useState(false);
  const [jsonData, setJsonData] = useState<string>("");

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTriggerChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setTriggers((prev) =>
      prev.map((trigger, i) =>
        i === index
          ? {
              ...trigger,
              [name]: name === "max_retries" ? parseInt(value) || 0 : value,
            }
          : trigger,
      ),
    );
  };

  const addTrigger = () => {
    setTriggers((prev) => [
      ...prev,
      {
        service_name: "",
        type: "persistent",
        host: "",
        path: "",
        queue_type: "external.medium",
        max_retries: 3,
        retention: "168h",
        unique_ttl: "60s",
      },
    ]);
  };

  const updateJsonFromForm = () => {
    const eventData = convertFormDataToEvent();
    setJsonData(JSON.stringify(eventData, null, 2));
  };

  const updateFormFromJson = () => {
    try {
      const parsed = JSON.parse(jsonData);
      setFormData({
        name: parsed.name || "",
        service_name: parsed.service_name || "",
        repo_url: parsed.repo_url || "",
        team_owner: parsed.team_owner || "",
      });
      setTriggers(
        parsed.triggers?.map((trigger: any) => ({
          service_name: trigger.service_name || "",
          type: trigger.type || "persistent",
          host: trigger.host || "",
          path: trigger.path || "",
          queue_type: trigger.option?.queue_type || "external.medium",
          max_retries: trigger.option?.max_retries || 3,
          retention: trigger.option?.retention || "168h",
          unique_ttl: trigger.option?.unique_ttl || "60s",
        })) || [
          {
            service_name: "",
            type: "persistent",
            host: "",
            path: "",
            queue_type: "external.medium",
            max_retries: 3,
            retention: "168h",
            unique_ttl: "60s",
          },
        ],
      );
    } catch (error) {
      console.error("Failed to parse JSON:", error);
    }
  };

  const handleModeToggle = (mode: "form" | "json") => {
    if (mode === "json" && !jsonMode) {
      updateJsonFromForm();
    } else if (mode === "form" && jsonMode) {
      updateFormFromJson();
    }
    setJsonMode(mode === "json");
  };

  const removeTrigger = (index: number) => {
    if (triggers.length > 1) {
      setTriggers((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const convertFormDataToEvent = (): CreateEventRequest => {
    return {
      name: formData.name,
      service_name: formData.service_name,
      repo_url: formData.repo_url,
      team_owner: formData.team_owner,
      triggers: triggers.map((trigger) => ({
        service_name: trigger.service_name,
        type: trigger.type,
        host: trigger.host,
        path: trigger.path,
        headers: {
          "Content-Type": "application/json",
        },
        option: {
          queue_type: trigger.queue_type,
          max_retries: trigger.max_retries,
          retention: trigger.retention,
          unique_ttl: trigger.unique_ttl,
        },
      })),
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    let eventData;

    if (jsonMode) {
      try {
        eventData = JSON.parse(jsonData);
      } catch (error) {
        setDebugInfo(
          `[${new Date().toISOString()}] ❌ Invalid JSON: ${error instanceof Error ? error.message : "Unknown error"}\n\n`,
        );
        return;
      }
    } else {
      eventData = convertFormDataToEvent();
    }

    console.log(
      "Form submitted with data:",
      jsonMode ? jsonData : { formData, triggers },
    );
    setDebugInfo(
      `[${new Date().toISOString()}] Form submitted with data:\n${JSON.stringify(jsonMode ? jsonData : { formData, triggers }, null, 2)}\n\n`,
    );

    try {
      console.log("Converted event data:", eventData);
      setDebugInfo(
        (prev) =>
          prev +
          `[${new Date().toISOString()}] Converted event data:\n${JSON.stringify(eventData, null, 2)}\n\n`,
      );

      const success = await createEvent(eventData);

      if (success) {
        console.log("Event created successfully");
        setDebugInfo(
          (prev) =>
            prev +
            `[${new Date().toISOString()}] ✅ Event created successfully!\n\n`,
        );
        onSuccess?.();
        onClose();
        // Reset form
        setFormData({
          name: "",
          service_name: "",
          repo_url: "",
          team_owner: "",
        });
        setTriggers([
          {
            service_name: "",
            type: "persistent",
            host: "",
            path: "",
            queue_type: "external.medium",
            max_retries: 3,
            retention: "168h",
            unique_ttl: "60s",
          },
        ]);
        setDebugInfo("");
      } else {
        console.log("Failed to create event");
        setDebugInfo(
          (prev) =>
            prev +
            `[${new Date().toISOString()}] ❌ Failed to create event\n\n`,
        );
      }
    } catch (err) {
      console.error("Error in form submission:", err);
      setDebugInfo(
        (prev) =>
          prev +
          `[${new Date().toISOString()}] ❌ Error: ${err instanceof Error ? err.message : "Unknown error"}\n\n`,
      );
    }
  };

  const handleCancel = () => {
    clearError();
    setDebugInfo("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Add New Event</h2>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={debugMode}
                onChange={(e) => setDebugMode(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
              />
              <span className="text-gray-300">Debug Mode</span>
            </label>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* API Configuration Section */}
          <div className="mb-6">
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setShowApiConfig(!showApiConfig)}
            >
              <h3 className="text-lg font-medium text-white mb-2">
                API Configuration
              </h3>
              <button
                type="button"
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                {showApiConfig ? "Hide" : "Show"}
              </button>
            </div>

            {showApiConfig && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    API Base URL
                  </label>
                  <input
                    type="url"
                    value={apiBaseUrl}
                    onChange={(e) => setApiBaseUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="http://localhost:8080"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Timeout (ms)
                  </label>
                  <input
                    type="number"
                    value={timeout}
                    onChange={(e) =>
                      setTimeout(parseInt(e.target.value) || 10000)
                    }
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="10000"
                  />
                </div>
              </div>
            )}

            {showApiConfig && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    console.log("Testing connection to:", apiBaseUrl);
                    const success = await testApiConnection(apiBaseUrl);
                    alert(
                      success
                        ? "Connection successful!"
                        : "Connection failed! Check console for details.",
                    );
                  } catch (err) {
                    console.error("Connection test failed:", err);
                    alert(
                      "Connection failed: " +
                        (err instanceof Error ? err.message : "Unknown error"),
                    );
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm text-white"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Test Connection
              </button>
            )}
          </div>

          {/* Event Details Section */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-white mb-4">
              Event Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Event Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="payment.processed"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Service Name
                </label>
                <input
                  type="text"
                  name="service_name"
                  value={formData.service_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="my-app"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Repository URL
                </label>
                <input
                  type="url"
                  name="repo_url"
                  value={formData.repo_url}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="http://github.com/my-org/my-repo"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Team Owner
                </label>
                <input
                  type="text"
                  name="team_owner"
                  value={formData.team_owner}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="my-team"
                  required
                />
              </div>
            </div>
          </div>

          {/* Trigger Configuration Section */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-white">
                Trigger Configuration
              </h3>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-400">Mode:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="form-mode"
                    name="mode"
                    checked={!jsonMode}
                    onChange={() => handleModeToggle("form")}
                    className="w-4 h-4"
                  />
                  <label htmlFor="form-mode" className="text-sm text-white">
                    Form
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="json-mode"
                    name="mode"
                    checked={jsonMode}
                    onChange={() => handleModeToggle("json")}
                    className="w-4 h-4"
                  />
                  <label htmlFor="json-mode" className="text-sm text-white">
                    JSON
                  </label>
                </div>
              </div>
            </div>

            {jsonMode ? (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Event JSON Configuration
                </label>
                <textarea
                  value={jsonData}
                  onChange={(e) => setJsonData(e.target.value)}
                  className="w-full h-96 px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter JSON configuration..."
                />
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        const parsed = JSON.parse(jsonData);
                        setJsonData(JSON.stringify(parsed, null, 2));
                      } catch (error) {
                        console.error("Invalid JSON:", error);
                      }
                    }}
                    className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-sm text-white"
                  >
                    Format JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const example = {
                        name: "payment.processed",
                        service_name: "my-app",
                        repo_url: "http://github.com/my-org/my-repo",
                        team_owner: "my-team",
                        triggers: [
                          {
                            service_name: "consumer-1",
                            type: "persistent",
                            host: "http://localhost:3333",
                            path: "/wq/payment/processed",
                            headers: {
                              "Content-Type": "application/json",
                            },
                            option: {
                              queue_type: "external.medium",
                              max_retries: 3,
                              retention: "168h",
                              unique_ttl: "60s",
                            },
                          },
                        ],
                      };
                      setJsonData(JSON.stringify(example, null, 2));
                    }}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm text-white"
                  >
                    Load Example
                  </button>
                </div>
              </div>
            ) : (
              triggers.map((trigger, index) => (
                <div key={index} className="bg-gray-700 rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-md font-medium text-white">
                      Trigger #{index + 1}
                    </h4>
                    {triggers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTrigger(index)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Trigger Service Name
                      </label>
                      <input
                        type="text"
                        name="service_name"
                        value={trigger.service_name}
                        onChange={(e) => handleTriggerChange(index, e)}
                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="consumer-1"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Type
                      </label>
                      <select
                        name="type"
                        value={trigger.type}
                        onChange={(e) => handleTriggerChange(index, e)}
                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="persistent">persistent</option>
                        <option value="one-time">one-time</option>
                        <option value="scheduled">scheduled</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Host
                      </label>
                      <input
                        type="url"
                        name="host"
                        value={trigger.host}
                        onChange={(e) => handleTriggerChange(index, e)}
                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="http://localhost:3333"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Path
                      </label>
                      <input
                        type="text"
                        name="path"
                        value={trigger.path}
                        onChange={(e) => handleTriggerChange(index, e)}
                        className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="/wq/payment/processed"
                        required
                      />
                    </div>
                  </div>

                  {/* Options */}
                  <div className="mt-4">
                    <h5 className="text-sm font-medium text-gray-300 mb-3">
                      Options
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">
                          Queue Type
                        </label>
                        <select
                          name="queue_type"
                          value={trigger.queue_type}
                          onChange={(e) => handleTriggerChange(index, e)}
                          className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="external.medium">
                            external.medium
                          </option>
                          <option value="external.high">external.high</option>
                          <option value="external.low">external.low</option>
                          <option value="internal">internal</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">
                          Max Retries
                        </label>
                        <input
                          type="number"
                          name="max_retries"
                          value={trigger.max_retries}
                          onChange={(e) => handleTriggerChange(index, e)}
                          className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          min="0"
                          max="10"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">
                          Retention
                        </label>
                        <input
                          type="text"
                          name="retention"
                          value={trigger.retention}
                          onChange={(e) => handleTriggerChange(index, e)}
                          className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="168h"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">
                          Unique TTL
                        </label>
                        <input
                          type="text"
                          name="unique_ttl"
                          value={trigger.unique_ttl}
                          onChange={(e) => handleTriggerChange(index, e)}
                          className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="60s"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}

            {!jsonMode && (
              <button
                type="button"
                onClick={addTrigger}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md text-sm text-white"
              >
                <span>+</span>
                Add Another Trigger
              </button>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-900 border border-red-700 rounded-md">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {/* Debug Panel */}
          {debugMode && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-medium text-white">
                  Debug Information
                </h3>
                <button
                  type="button"
                  onClick={() => setDebugInfo("")}
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  Clear Log
                </button>
              </div>
              <div className="bg-gray-900 rounded-md p-4 max-h-64 overflow-y-auto">
                <pre className="text-xs text-gray-300 whitespace-pre-wrap">
                  {debugInfo || "No debug information yet..."}
                </pre>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md text-white"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEventModal;
