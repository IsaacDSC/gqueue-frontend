import { useState, useCallback } from "react";

export interface ConnectionConfig {
  serverUrl: string;
  authToken?: string;
}

export interface ConnectionState {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  lastChecked: Date | null;
}

export interface UseConnectionReturn {
  state: ConnectionState;
  testConnection: (config: ConnectionConfig) => Promise<boolean>;
  connect: (config: ConnectionConfig) => Promise<boolean>;
  disconnect: () => void;
  saveConnection: (config: ConnectionConfig) => void;
  getRecentConnections: () => ConnectionConfig[];
}

const STORAGE_KEY = "gqueue-recent-connections";

export const useConnection = (): UseConnectionReturn => {
  const [state, setState] = useState<ConnectionState>({
    isConnected: false,
    isLoading: false,
    error: null,
    lastChecked: null,
  });

  const testConnection = useCallback(
    async (config: ConnectionConfig): Promise<boolean> => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const url = `${config.serverUrl}/api/v1/ping`;
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        if (config.authToken) {
          headers["Authorization"] = `Bearer ${config.authToken}`;
        }

        const response = await fetch(url, {
          method: "GET",
          headers,
        });

        const success = response.status === 200;

        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: success
            ? null
            : `Server responded with status ${response.status}`,
          lastChecked: new Date(),
        }));

        return success;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Connection failed";
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
          lastChecked: new Date(),
        }));

        return false;
      }
    },
    [],
  );

  const connect = useCallback(
    async (config: ConnectionConfig): Promise<boolean> => {
      const success = await testConnection(config);

      if (success) {
        setState((prev) => ({
          ...prev,
          isConnected: true,
        }));
        saveConnection(config);
      }

      return success;
    },
    [testConnection],
  );

  const disconnect = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isConnected: false,
      error: null,
    }));
  }, []);

  const saveConnection = useCallback((config: ConnectionConfig) => {
    try {
      const existing = getRecentConnections();
      const updated = [
        {
          ...config,
          lastUsed: new Date().toISOString(),
        },
        ...existing
          .filter((conn) => conn.serverUrl !== config.serverUrl)
          .slice(0, 4), // Keep only 4 most recent
      ];

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.warn("Failed to save connection to localStorage:", error);
    }
  }, []);

  const getRecentConnections = useCallback((): ConnectionConfig[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn(
        "Failed to load recent connections from localStorage:",
        error,
      );
    }
    return [];
  }, []);

  return {
    state,
    testConnection,
    connect,
    disconnect,
    saveConnection,
    getRecentConnections,
  };
};
