import { useCallback } from "react";

export interface ConnectionConfig {
  serverUrl: string;
  authToken?: string;
  lastUsed?: string;
}

const STORAGE_KEY = "gqueue-recent-connections";

export const useConnectionConfig = () => {
  const getConnectionConfig = useCallback((): ConnectionConfig | null => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const connections = JSON.parse(stored);
        if (connections.length > 0) {
          return connections[0]; // Use most recent connection
        }
      }
    } catch (error) {
      console.warn("Failed to load connection config from localStorage:", error);
    }
    return null;
  }, []);

  const getAuthHeaders = useCallback((additionalHeaders: Record<string, string> = {}): Record<string, string> => {
    const config = getConnectionConfig();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...additionalHeaders,
    };

    if (config?.authToken) {
      headers["Authorization"] = `Basic ${config.authToken}`;
    }

    return headers;
  }, [getConnectionConfig]);

  const getApiUrl = useCallback((endpoint: string): string => {
    const config = getConnectionConfig();
    if (!config) {
      throw new Error(
        "No server connection configured. Please configure a server connection first.",
      );
    }

    const baseUrl = config.serverUrl.endsWith('/')
      ? config.serverUrl.slice(0, -1)
      : config.serverUrl;

    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    return `${baseUrl}${cleanEndpoint}`;
  }, [getConnectionConfig]);

  const makeAuthenticatedRequest = useCallback(async (
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> => {
    const url = getApiUrl(endpoint);
    const headers = getAuthHeaders(options.headers as Record<string, string>);

    return fetch(url, {
      ...options,
      headers,
    });
  }, [getApiUrl, getAuthHeaders]);

  return {
    getConnectionConfig,
    getAuthHeaders,
    getApiUrl,
    makeAuthenticatedRequest,
  };
};
