import { useState, useEffect, useMemo } from "react";
import { Link } from "../components/Link";
import UnifiedMetricsControl, {
  MetricsControlPanel,
} from "../components/UnifiedMetricsControl";
import {
  PerformanceMetricsDisplay,
  SegmentationMetricsDisplay,
  RpmChartDisplay,
} from "../components/UnifiedMetricsDisplay";
import MetricsDebugPanel from "../components/MetricsDebugPanel";
import { useInsights } from "../hooks/useInsights";
import { useConnection } from "../hooks/useConnection";

const PublisherDashboard = () => {
  const { getRecentConnections } = useConnection();
  const [serverConfig, setServerConfig] = useState<{
    serverUrl: string;
    authToken?: string;
  } | null>(null);

  // Get the most recent connection configuration
  useEffect(() => {
    const recentConnections = getRecentConnections();
    if (recentConnections.length > 0) {
      setServerConfig({
        serverUrl: recentConnections[0].serverUrl,
        authToken: recentConnections[0].authToken,
      });
    } else {
      // Fallback to default localhost
      setServerConfig({
        serverUrl: "http://localhost:8080",
      });
    }
  }, []); // Remove getRecentConnections dependency to prevent re-renders

  // Memoize the config object to prevent unnecessary re-renders
  const memoizedServerConfig = useMemo(() => {
    return serverConfig || { serverUrl: "http://localhost:8080" };
  }, [serverConfig]);

  const {
    data: insights,
    loading,
    error,
    refetch,
  } = useInsights({
    ...memoizedServerConfig,
    autoRefresh: false, // Disable auto-refresh to prevent unwanted updates
  });

  if (loading === "loading") {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-lg text-gray-300">Loading insights...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <h1 className="text-2xl font-bold mb-4 text-white">
          Publisher Dashboard
        </h1>
        <div className="bg-red-800 border border-red-600 text-red-200 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error.message}
          <button
            onClick={refetch}
            className="ml-4 bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <h1 className="text-2xl font-bold mb-4 text-white">
          Publisher Dashboard
        </h1>
        <div className="text-center py-8 text-gray-400">
          No insights data available
        </div>
      </div>
    );
  }

  return (
    <UnifiedMetricsControl insights={insights}>
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="text-blue-400 hover:text-blue-300 text-sm mr-4"
            >
              ← Back to Home
            </Link>
            <h1 className="text-2xl font-bold text-white">
              📊 Publisher Dashboard
            </h1>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={(e) => {
                e.preventDefault();
                refetch();
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-800 p-4 rounded-lg shadow border border-gray-700">
              <h3 className="text-sm font-medium text-gray-400">
                📤 Total Published
              </h3>
              <p className="text-2xl font-bold text-green-400">
                {insights.total_published}
              </p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg shadow border border-gray-700">
              <h3 className="text-sm font-medium text-gray-400">
                📥 Total Consumed
              </h3>
              <p className="text-2xl font-bold text-blue-400">
                {insights.total_consumed}
              </p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg shadow border border-gray-700">
              <h3 className="text-sm font-medium text-gray-400">
                ❌ Published Errors
              </h3>
              <p className="text-2xl font-bold text-red-400">
                {insights.total_published_with_err}
              </p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg shadow border border-gray-700">
              <h3 className="text-sm font-medium text-gray-400">
                ❌ Consumed Errors
              </h3>
              <p className="text-2xl font-bold text-red-400">
                {insights.total_consumed_with_err}
              </p>
            </div>
          </div>

          {/* Success Rate Cards (if available) */}
          {(insights.percentage_published_success ||
            insights.percentage_consumed_success) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insights.percentage_published_success && (
                <div className="bg-gray-800 p-4 rounded-lg shadow border border-gray-700">
                  <h3 className="text-sm font-medium text-gray-400">
                    ✅ Success Rate
                  </h3>
                  <p className="text-2xl font-bold text-green-400">
                    {insights.percentage_published_success === "NaN%"
                      ? "-"
                      : insights.percentage_published_success}
                  </p>
                </div>
              )}
              {insights.percentage_consumed_success && (
                <div className="bg-gray-800 p-4 rounded-lg shadow border border-gray-700">
                  <h3 className="text-sm font-medium text-gray-400">
                    ✅ Consumed Success Rate
                  </h3>
                  <p className="text-2xl font-bold text-green-400">
                    {insights.percentage_consumed_success === "NaN%"
                      ? "-"
                      : insights.percentage_consumed_success}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Unified Metrics Control Panel */}
          <MetricsControlPanel />

          {/* Performance Metrics Display */}
          <PerformanceMetricsDisplay insights={insights} />

          {/* Topic Segmentation Display */}
          <SegmentationMetricsDisplay insights={insights} />

          {/* RPM Chart Display */}
          <RpmChartDisplay insights={insights} />

          {/* Debug Panel - Only show in development */}
          {process.env.NODE_ENV === "development" && (
            <MetricsDebugPanel className="mt-6" />
          )}
        </div>
      </div>
    </UnifiedMetricsControl>
  );
};

export default PublisherDashboard;
