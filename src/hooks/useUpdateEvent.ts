import { useState, useCallback } from "react";
import { Event } from "../types";

interface UseUpdateEventReturn {
  updateEvent: (eventId: string, eventData: Event) => Promise<boolean>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

const API_BASE_URL = "http://localhost:8080/api/v1";

export const useUpdateEvent = (): UseUpdateEventReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const updateEvent = useCallback(
    async (eventId: string, eventData: Event): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/event/${eventId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(eventData),
        });

        if (!response.ok) {
          throw new Error(
            `Failed to update event: ${response.status} ${response.statusText}`,
          );
        }

        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update event";
        setError(errorMessage);
        console.error("Error updating event:", err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    updateEvent,
    loading,
    error,
    clearError,
  };
};
