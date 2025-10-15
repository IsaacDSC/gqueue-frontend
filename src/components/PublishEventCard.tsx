import React, { useState } from "react";
import { useEventPublisher, PublishEventData } from "../hooks";

interface PublishEventCardProps {
  className?: string;
}

const PublishEventCard: React.FC<PublishEventCardProps> = ({
  className = "",
}) => {
  const {
    publishEvent,
    loading,
    error,
    success,
    clearError,
    clearSuccess,
    setError,
  } = useEventPublisher();

  const [formData, setFormData] = useState({
    service_name: "",
    event_name: "",
    data_json: '{\n  "key": "value"\n}',
    correlation_id: "",
    max_retries: 3,
    queue_type: "internal.high",
  });

  const generateCorrelationId = () => {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c == "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      },
    );
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "max_retries" ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    clearSuccess();

    try {
      // Validate required fields
      if (!formData.service_name.trim()) {
        throw new Error("Nome do serviço é obrigatório");
      }
      if (!formData.event_name.trim()) {
        throw new Error("Nome do evento é obrigatório");
      }

      // Validate JSON before parsing
      const trimmedJson = formData.data_json.trim();
      if (!trimmedJson) {
        throw new Error("Dados do evento são obrigatórios");
      }

      let parsedData;
      try {
        parsedData = JSON.parse(trimmedJson);
      } catch (jsonError) {
        throw new Error(
          "JSON inválido. Verifique a sintaxe dos dados do evento.",
        );
      }

      const correlationId = formData.correlation_id || generateCorrelationId();
      console.log("Generated correlation ID:", correlationId);

      const publishData: PublishEventData = {
        service_name: formData.service_name,
        event_name: formData.event_name,
        data: parsedData,
        metadata: {
          correlation_id: correlationId,
        },
        opts: {
          max_retries: formData.max_retries,
          queue_type: formData.queue_type,
        },
      };

      console.log("Publishing event data:", publishData);
      await publishEvent(publishData);
    } catch (err) {
      console.error("Error in handleSubmit:", err);
      if (err instanceof Error) {
        setError(err.message);
      }
    }
  };

  const handleGenerateId = () => {
    const newId = generateCorrelationId();
    console.log("Generating new correlation ID:", newId);
    setFormData((prev) => ({
      ...prev,
      correlation_id: newId,
    }));
  };

  const handleClear = () => {
    setFormData({
      service_name: "",
      event_name: "",
      data_json: '{\n  "key": "value"\n}',
      correlation_id: "",
      max_retries: 3,
      queue_type: "internal.high",
    });
    clearError();
    clearSuccess();
  };

  return (
    <div className={`bg-gray-800 rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Publish Event</h2>
        <div className="flex items-center">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Gqueue Publisher API
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="service_name"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Service Name *
            </label>
            <input
              type="text"
              id="service_name"
              name="service_name"
              value={formData.service_name}
              onChange={handleInputChange}
              required
              className="dark-input"
              placeholder="my-app"
            />
          </div>

          <div>
            <label
              htmlFor="event_name"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Topic Name *
            </label>
            <input
              type="text"
              id="event_name"
              name="event_name"
              value={formData.event_name}
              onChange={handleInputChange}
              required
              className="dark-input"
              placeholder="payment.processed"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="data_json"
            className="block text-sm font-medium text-gray-300 mb-1"
          >
            Payload (JSON) *
          </label>
          <textarea
            id="data_json"
            name="data_json"
            value={formData.data_json}
            onChange={handleInputChange}
            required
            rows={4}
            className="dark-input font-mono text-sm"
            placeholder='{"key": "value"}'
          />
        </div>

        <div>
          <label
            htmlFor="correlation_id"
            className="block text-sm font-medium text-gray-300 mb-1"
          >
            Correlation ID
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              id="correlation_id"
              name="correlation_id"
              value={formData.correlation_id}
              onChange={handleInputChange}
              className="dark-input flex-1"
              placeholder="Será gerado automaticamente se vazio"
            />
            <button
              type="button"
              onClick={handleGenerateId}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
            >
              Generate
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="max_retries"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Max Retries
            </label>
            <input
              type="number"
              id="max_retries"
              name="max_retries"
              value={formData.max_retries}
              onChange={handleInputChange}
              min="0"
              max="10"
              className="dark-input"
            />
          </div>

          <div>
            <label
              htmlFor="queue_type"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Queue Type
            </label>
            <select
              id="queue_type"
              name="queue_type"
              value={formData.queue_type}
              onChange={handleInputChange}
              className="dark-input"
            >
              <option value="internal.high" className="bg-gray-700 text-white">
                internal.high
              </option>
              <option
                value="internal.normal"
                className="bg-gray-700 text-white"
              >
                internal.normal
              </option>
              <option value="internal.low" className="bg-gray-700 text-white">
                internal.low
              </option>
              <option value="external.high" className="bg-gray-700 text-white">
                external.high
              </option>
              <option
                value="external.normal"
                className="bg-gray-700 text-white"
              >
                external.normal
              </option>
              <option value="external.low" className="bg-gray-700 text-white">
                external.low
              </option>
            </select>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error on publishing event
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  Event published successfully!
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>The event was sent to the queue and will be processed.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Publishing...
              </span>
            ) : (
              "Send event"
            )}
          </button>

          <button
            type="button"
            onClick={handleClear}
            disabled={loading}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Clear
          </button>
        </div>
      </form>
    </div>
  );
};

export default PublishEventCard;
