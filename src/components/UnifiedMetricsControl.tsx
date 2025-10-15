import {
  useMemo,
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useState,
} from "react";
import { InsightsResponse } from "../types";
import { useMetricsLocalStorage } from "../hooks/useLocalStorage";

interface MetricsControlContextType {
  selectedPublisher: string;
  selectedConsumers: string[];
  setSelectedPublisher: (value: string) => void;
  setSelectedConsumers: (value: string[]) => void;
  toggleConsumer: (consumerId: string) => void;
  availablePublishers: PublisherOption[];
  availableConsumers: ConsumerOption[];
}

interface PublisherOption {
  id: string;
  label: string;
  key: string;
  sources: string[];
}

interface ConsumerOption {
  id: string;
  label: string;
  key: string;
  sources: string[];
}

interface UnifiedMetricsControlProps {
  insights: InsightsResponse;
  children: ReactNode;
}

interface MetricsControlPanelProps {
  className?: string;
}

const MetricsControlContext = createContext<
  MetricsControlContextType | undefined
>(undefined);

export const useMetricsControl = () => {
  const context = useContext(MetricsControlContext);
  if (!context) {
    throw new Error(
      "useMetricsControl must be used within UnifiedMetricsControl",
    );
  }
  return context;
};

const UnifiedMetricsControl = ({
  insights,
  children,
}: UnifiedMetricsControlProps) => {
  // Use the custom localStorage hook for metrics state
  const {
    selectedPublisher,
    selectedConsumers,
    setSelectedPublisher,
    setSelectedConsumers,
    validatePublisher,
    validateConsumers,
  } = useMetricsLocalStorage();

  // Extract all available publishers and consumers from all data sources
  const { availablePublishers, availableConsumers } = useMemo(() => {
    const publishersMap = new Map<string, PublisherOption>();
    const consumersMap = new Map<string, ConsumerOption>();

    // Process P99 metrics
    if (insights.publishers_p99) {
      Object.keys(insights.publishers_p99).forEach((key) => {
        const existing = publishersMap.get(key);
        publishersMap.set(key, {
          id: `pub-${key}`,
          label: key,
          key,
          sources: existing ? [...existing.sources, "P99"] : ["P99"],
        });
      });
    }

    if (insights.consumers_p99) {
      Object.keys(insights.consumers_p99).forEach((key) => {
        const existing = consumersMap.get(key);
        consumersMap.set(key, {
          id: `cons-${key}`,
          label: key,
          key,
          sources: existing ? [...existing.sources, "P99"] : ["P99"],
        });
      });
    }

    // Process P75 metrics
    if (insights.publishers_p75) {
      Object.keys(insights.publishers_p75).forEach((key) => {
        const existing = publishersMap.get(key);
        publishersMap.set(key, {
          id: `pub-${key}`,
          label: key,
          key,
          sources: existing ? [...existing.sources, "P75"] : ["P75"],
        });
      });
    }

    if (insights.consumers_p75) {
      Object.keys(insights.consumers_p75).forEach((key) => {
        const existing = consumersMap.get(key);
        consumersMap.set(key, {
          id: `cons-${key}`,
          label: key,
          key,
          sources: existing ? [...existing.sources, "P75"] : ["P75"],
        });
      });
    }

    // Process RPM data
    if (insights.rpm_publisher) {
      Object.keys(insights.rpm_publisher).forEach((key) => {
        const existing = publishersMap.get(key);
        publishersMap.set(key, {
          id: `pub-${key}`,
          label: key,
          key,
          sources: existing ? [...existing.sources, "RPM"] : ["RPM"],
        });
      });
    }

    if (insights.rpm_consumer) {
      Object.keys(insights.rpm_consumer).forEach((key) => {
        const existing = consumersMap.get(key);
        consumersMap.set(key, {
          id: `cons-${key}`,
          label: key,
          key,
          sources: existing ? [...existing.sources, "RPM"] : ["RPM"],
        });
      });
    }

    // Process segmentation data
    if (insights.total_segmentation_published) {
      Object.keys(insights.total_segmentation_published).forEach((key) => {
        const existing = publishersMap.get(key);
        publishersMap.set(key, {
          id: `pub-${key}`,
          label: key,
          key,
          sources: existing ? [...existing.sources, "Topics"] : ["Topics"],
        });
      });
    }

    if (insights.total_segmentation_consumed) {
      Object.keys(insights.total_segmentation_consumed).forEach((key) => {
        const existing = consumersMap.get(key);
        consumersMap.set(key, {
          id: `cons-${key}`,
          label: key,
          key,
          sources: existing
            ? [...existing.sources, "Segmentation"]
            : ["Segmentation"],
        });
      });
    }

    return {
      availablePublishers: Array.from(publishersMap.values()),
      availableConsumers: Array.from(consumersMap.values()),
    };
  }, [insights]);

  const toggleConsumer = (consumerId: string) => {
    setSelectedConsumers((prev) => {
      return prev.includes(consumerId)
        ? prev.filter((id) => id !== consumerId)
        : [...prev, consumerId];
    });
  };

  // Effect to validate and clean up localStorage when available options change
  useEffect(() => {
    validatePublisher(availablePublishers);
    validateConsumers(availableConsumers);
  }, [
    availablePublishers,
    availableConsumers,
    validatePublisher,
    validateConsumers,
  ]);

  const contextValue: MetricsControlContextType = {
    selectedPublisher,
    selectedConsumers,
    setSelectedPublisher,
    setSelectedConsumers,
    toggleConsumer,
    availablePublishers,
    availableConsumers,
  };

  return (
    <MetricsControlContext.Provider value={contextValue}>
      {children}
    </MetricsControlContext.Provider>
  );
};

export const MetricsControlPanel = ({
  className = "",
}: MetricsControlPanelProps) => {
  const {
    selectedPublisher,
    selectedConsumers,
    setSelectedPublisher,
    setSelectedConsumers,
    toggleConsumer,
    availablePublishers,
    availableConsumers,
  } = useMetricsControl();

  const { clearAll } = useMetricsLocalStorage();
  const [isClearing, setIsClearing] = useState(false);

  const removeConsumer = (consumerId: string) => {
    toggleConsumer(consumerId);
  };

  const clearAllConsumers = () => {
    setSelectedConsumers([]);
  };

  const clearAllSelections = async () => {
    if (
      window.confirm(
        "Tem certeza que deseja limpar todas as seleções? Esta ação não pode ser desfeita.",
      )
    ) {
      setIsClearing(true);

      try {
        clearAll();

        // Pequeno delay para mostrar feedback visual
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Força uma re-renderização para garantir que a UI seja atualizada
        window.dispatchEvent(new Event("storage"));
      } finally {
        setIsClearing(false);
      }
    }
  };

  const [enabledConsumers, setEnableConsumers] = useState<ConsumerOption[]>([]);

  return (
    <div
      className={`bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 ${className}`}
    >
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold text-white">
            🎛️ Metrics Control Center
          </h2>
          <button
            onClick={clearAllSelections}
            disabled={isClearing}
            className={`${
              isClearing
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 hover:scale-105 active:scale-95"
            } text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform border border-blue-500 hover:border-blue-400 flex items-center gap-2`}
            title="Limpar todas as seleções do localStorage"
          >
            <span>{isClearing ? "⏳" : "🗑️"}</span>
            <span>{isClearing ? "Limpando..." : "Clear All"}</span>
          </button>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-300">
            Configure which metrics to display across all charts and
            visualizations
          </p>
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-green-400 flex items-center">
              💾 Auto-saved
            </span>
            <span className="text-gray-500">|</span>
            <span className="text-blue-400">🔄 Persists on refresh</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Publisher Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            📊 Publisher Selection (max 1)
          </label>
          <select
            value={selectedPublisher}
            onChange={(e) => {
              const selectedPublisherId = e.target.value;
              const selectedPublisherLabel = availablePublishers.find(
                (p) => p.id === selectedPublisherId,
              )?.label;
              const consumers = availableConsumers.filter((consumer) =>
                selectedPublisherLabel
                  ? consumer.label.includes(selectedPublisherLabel)
                  : false,
              );
              setEnableConsumers(consumers ?? []);
              setSelectedPublisher(selectedPublisherId);
            }}
            className="w-full p-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-white"
          >
            <option value="">-- Select a publisher --</option>
            {availablePublishers.map((publisher) => (
              <option key={publisher.id} value={publisher.id}>
                {publisher.label} ({publisher.sources.join(", ")})
              </option>
            ))}
          </select>
          {selectedPublisher && (
            <div className="mt-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900 text-blue-200">
                Selected:{" "}
                {
                  availablePublishers.find((p) => p.id === selectedPublisher)
                    ?.label
                }
              </span>
            </div>
          )}
        </div>

        {/* Consumer Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            📈 Consumer Selection (multiple allowed)
          </label>
          <div className="max-h-40 overflow-y-auto border border-gray-600 rounded-lg p-3 bg-gray-700">
            {enabledConsumers.length === 0 ? (
              <p className="text-sm text-gray-400 italic">
                No consumers available
              </p>
            ) : (
              <div className="space-y-2">
                {enabledConsumers.map((consumer) => (
                  <label
                    key={consumer.id}
                    className="flex items-center space-x-3 p-2 hover:bg-gray-600 rounded-md transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedConsumers.includes(consumer.id)}
                      onChange={() => toggleConsumer(consumer.id)}
                      className="rounded border-gray-500 text-blue-400 focus:ring-blue-500 h-4 w-4 bg-gray-600"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-white">
                        {consumer.label}
                      </span>
                      <div className="text-xs text-gray-400">
                        Available in: {consumer.sources.join(", ")}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
          {selectedConsumers.length > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-300">Selected consumers:</p>
                <button
                  onClick={clearAllConsumers}
                  className="text-xs text-red-400 hover:text-red-300 hover:underline transition-colors"
                  title="Remove all selected consumers"
                >
                  Clear all consumers
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {selectedConsumers.map((consumerId) => {
                  const consumer = availableConsumers.find(
                    (c) => c.id === consumerId,
                  );
                  return consumer ? (
                    <span
                      key={consumerId}
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-900 text-purple-200 gap-1 group hover:bg-purple-800 transition-colors"
                    >
                      <span className="truncate max-w-32">
                        {consumer.label}
                      </span>
                      <button
                        onClick={() => removeConsumer(consumerId)}
                        className="ml-1 hover:bg-red-600 hover:text-white rounded-full w-4 h-4 flex items-center justify-center transition-all duration-200 text-purple-300 hover:scale-110 font-bold text-xs leading-none"
                        title={`Remove ${consumer.label}`}
                        aria-label={`Remove ${consumer.label} from selection`}
                      >
                        ×
                      </button>
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 p-4 bg-gray-700 rounded-lg border border-gray-600">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-300">
            📋 Active Configuration
          </h3>
          {(selectedPublisher || selectedConsumers.length > 0) && (
            <div className="flex items-center text-xs text-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></div>
              Saved to localStorage
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-300">Publisher:</span>
            <span className="ml-2 text-white">
              {selectedPublisher
                ? availablePublishers.find((p) => p.id === selectedPublisher)
                    ?.label || "None"
                : "None selected"}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-300">Consumers:</span>
            <span className="ml-2 text-white">
              {selectedConsumers.length > 0
                ? `${selectedConsumers.length} selected`
                : "None selected"}
            </span>
          </div>
        </div>

        {/* Storage Info */}
        <div className="mt-3 pt-3 border-t border-gray-600">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>🔒 Data stored locally in browser</span>
            <span className="italic">Syncs across tabs</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedMetricsControl;
