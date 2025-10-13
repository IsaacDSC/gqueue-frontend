import React, { useState, useEffect } from "react";
import { useConnection } from "../hooks/useConnection";
import { useRouter } from "../hooks/useRouter";

interface RecentConnection {
  serverUrl: string;
  authToken?: string;
  lastUsed: string;
}

const ServerConfig: React.FC = () => {
  const { state, testConnection, connect, getRecentConnections } =
    useConnection();
  const { navigate } = useRouter();

  const [serverUrl, setServerUrl] = useState("http://localhost:8080");
  const [authToken, setAuthToken] = useState("");
  const [recentConnections, setRecentConnections] = useState<
    RecentConnection[]
  >([]);

  useEffect(() => {
    setRecentConnections(getRecentConnections());
  }, [getRecentConnections]);

  const handleTestConnection = async () => {
    await testConnection({ serverUrl, authToken });
  };

  const handleConnect = async () => {
    const success = await connect({ serverUrl, authToken });
    if (success) {
      navigate("/");
    }
  };

  const handleRecentConnectionClick = (connection: RecentConnection) => {
    setServerUrl(connection.serverUrl);
    setAuthToken(connection.authToken || "");
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return "";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            GQueue Dashboard
          </h1>
          <p className="text-purple-200">
            Configure your server to get started
          </p>
        </div>

        {/* Configuration Form */}
        <div className="bg-white rounded-lg shadow-xl p-6">
          <div className="space-y-6">
            {/* Server URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Server URL
              </label>
              <input
                type="text"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="http://localhost:8080"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the base URL of your GQueue API server
              </p>
            </div>

            {/* Authentication Token */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Authentication Token (Optional)
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={authToken}
                  onChange={(e) => setAuthToken(e.target.value)}
                  placeholder="Enter your API token (optional)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Optional Bearer token for API authentication
              </p>
            </div>

            {/* Error Message */}
            {state.error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{state.error}</p>
              </div>
            )}

            {/* Success Message */}
            {state.lastChecked && !state.error && !state.isLoading && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <p className="text-sm text-green-600">
                  Connection successful! Server is reachable.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={handleTestConnection}
                disabled={state.isLoading || !serverUrl.trim()}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {state.isLoading ? "Testing..." : "Test Connection"}
              </button>
              <button
                onClick={handleConnect}
                disabled={
                  state.isLoading ||
                  !serverUrl.trim() ||
                  (state.lastChecked && !!state.error)
                }
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {state.isLoading ? "Connecting..." : "Connect"}
              </button>
            </div>

            {/* Recent Connections */}
            {recentConnections.length > 0 && (
              <div className="border-t pt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Recent Connections
                </h3>
                <div className="space-y-2">
                  {recentConnections.slice(0, 3).map((connection, index) => (
                    <button
                      key={index}
                      onClick={() => handleRecentConnectionClick(connection)}
                      className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      <div className="font-medium text-sm text-gray-900">
                        {connection.serverUrl}
                      </div>
                      <div className="text-xs text-gray-500">
                        {connection.authToken ? "With token" : "No token"} •{" "}
                        {formatDate(connection.lastUsed)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServerConfig;
