import { useState, useCallback } from "react";
import { useConnectionConfig } from "./useConnectionConfig";

interface UseDeleteEventReturn {
  deleteEvent: (eventId: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

export const useDeleteEvent = (): UseDeleteEventReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getAuthHeaders, getApiUrl } = useConnectionConfig();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const deleteEvent = useCallback(
    async (eventId: string): Promise<boolean> => {
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
          method: "DELETE",
          headers,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Failed to delete event: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ""}`
          );
        }

        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to delete event";
        setError(errorMessage);
        console.error("Error deleting event:", err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [getAuthHeaders, getApiUrl]
  );

  return {
    deleteEvent,
    loading,
    error,
    clearError,
  };
};

