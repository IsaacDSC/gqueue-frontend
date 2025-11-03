import { useState, useCallback } from "react";
import { useConnectionConfig } from "./useConnectionConfig";
import { Event } from "../types";

interface UseUpdateEventReturn {
  updateEvent: (eventId: string, eventData: Partial<Event>) => Promise<boolean>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

export const useUpdateEvent = (): UseUpdateEventReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getAuthHeaders, getApiUrl } = useConnectionConfig();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const updateEvent = useCallback(
    async (eventId: string, eventData: Partial<Event>): Promise<boolean> => {
      if (!eventId) {
        setError("Event ID is required");
        return false;
      }

      setLoading(true);
      setError(null);

      try {
        const url = getApiUrl(`/api/v1/event/${eventId}`);
        const headers = getAuthHeaders({
          Accept: "application/json",
        });

        const response = await fetch(url, {
          method: "PATCH",
          headers,
          body: JSON.stringify(eventData),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Failed to update event: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ""}`
          );
        }

        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to update event";
        setError(errorMessage);
        console.error("Error updating event:", err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [getAuthHeaders, getApiUrl]
  );

  return {
    updateEvent,
    loading,
    error,
    clearError,
  };
};

