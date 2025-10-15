import { useState, useCallback } from "react";

export interface PublishEventData {
  service_name: string;
  event_name: string;
  data: Record<string, any>;
  metadata: {
    correlation_id: string;
  };
  opts: {
    max_retries: number;
    queue_type: string;
  };
}

export interface UseEventPublisherReturn {
  publishEvent: (data: PublishEventData) => Promise<void>;
  loading: boolean;
  error: string | null;
  success: boolean;
  clearError: () => void;
  clearSuccess: () => void;
  setError: (message: string) => void;
}

const API_BASE_URL = "http://localhost:8080/api/v1";

export const useEventPublisher = (): UseEventPublisherReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearSuccess = useCallback(() => {
    setSuccess(false);
  }, []);

  const setErrorMessage = useCallback((message: string) => {
    setError(message);
  }, []);

  const publishEvent = useCallback(async (data: PublishEventData) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`${API_BASE_URL}/event/publisher`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.status === 202) {
        setSuccess(true);
      } else if (!response.ok) {
        throw new Error(
          `Failed to publish event: ${response.status} ${response.statusText}`,
        );
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to publish event";
      setError(errorMessage);
      console.error("Error publishing event:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    publishEvent,
    loading,
    error,
    success,
    clearError,
    clearSuccess,
    setError: setErrorMessage,
  };
};
