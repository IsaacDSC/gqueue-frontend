import { useState, useEffect, useCallback, useMemo } from "react";
import { InsightsResponse, LoadingState, ErrorState } from "../types";

export interface UseInsightsConfig {
  serverUrl: string;
  authToken?: string;
  refreshInterval?: number; // in milliseconds
  autoRefresh?: boolean;
}

export interface UseInsightsReturn {
  data: InsightsResponse | null;
  loading: LoadingState;
  error: ErrorState | null;
  refetch: () => Promise<void>;
  clearError: () => void;
}

const DEFAULT_CONFIG: Partial<UseInsightsConfig> = {
  refreshInterval: 30000, // 30 seconds
  autoRefresh: true,
};

export const useInsights = (config: UseInsightsConfig): UseInsightsReturn => {
  const [data, setData] = useState<InsightsResponse | null>(null);
  const [loading, setLoading] = useState<LoadingState>("idle");
  const [error, setError] = useState<ErrorState | null>(null);

  const mergedConfig = useMemo(
    () => ({ ...DEFAULT_CONFIG, ...config }),
    [
      config.serverUrl,
      config.authToken,
      config.refreshInterval,
      config.autoRefresh,
    ],
  );

  const fetchInsights = useCallback(async (): Promise<void> => {
    setLoading("loading");
    setError(null);

    try {
      const url = `${mergedConfig.serverUrl}/api/v1/insights`;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (mergedConfig.authToken) {
        headers["Authorization"] = `Bearer ${mergedConfig.authToken}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: InsightsResponse = await response.json();
      setData(result);
      setLoading("success");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch insights";
      setError({
        message: errorMessage,
        code:
          err instanceof Error && "status" in err
            ? (err as any).status
            : "FETCH_ERROR",
      });
      setLoading("error");
    }
  }, [mergedConfig.serverUrl, mergedConfig.authToken]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Initial fetch - only depend on the actual values, not the callback
  useEffect(() => {
    if (mergedConfig.serverUrl) {
      const controller = new AbortController();

      const initialFetch = async () => {
        setLoading("loading");
        setError(null);

        try {
          const url = `${mergedConfig.serverUrl}/api/v1/insights`;
          const headers: Record<string, string> = {
            "Content-Type": "application/json",
          };

          if (mergedConfig.authToken) {
            headers["Authorization"] = `Bearer ${mergedConfig.authToken}`;
          }

          const response = await fetch(url, {
            method: "GET",
            headers,
            signal: controller.signal,
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const result: InsightsResponse = await response.json();
          if (!controller.signal.aborted) {
            setData(result);
            setLoading("success");
          }
        } catch (err) {
          if (!controller.signal.aborted) {
            const errorMessage =
              err instanceof Error ? err.message : "Failed to fetch insights";
            setError({
              message: errorMessage,
              code:
                err instanceof Error && "status" in err
                  ? (err as any).status
                  : "FETCH_ERROR",
            });
            setLoading("error");
          }
        }
      };

      initialFetch();

      return () => controller.abort();
    }
  }, [mergedConfig.serverUrl, mergedConfig.authToken]);

  // Auto refresh - use a ref to avoid stale closure issues
  useEffect(() => {
    if (
      !mergedConfig.autoRefresh ||
      !mergedConfig.refreshInterval ||
      !mergedConfig.serverUrl
    ) {
      return;
    }

    const interval = setInterval(() => {
      // Use a direct state check instead of closure
      setLoading((currentLoading) => {
        if (currentLoading !== "loading") {
          fetchInsights();
        }
        return currentLoading;
      });
    }, mergedConfig.refreshInterval);

    return () => clearInterval(interval);
  }, [
    mergedConfig.autoRefresh,
    mergedConfig.refreshInterval,
    mergedConfig.serverUrl,
    fetchInsights,
  ]);

  return {
    data,
    loading,
    error,
    refetch: fetchInsights,
    clearError,
  };
};
