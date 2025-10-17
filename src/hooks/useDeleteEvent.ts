import { useState, useCallback } from "react";

interface UseDeleteEventReturn {
  deleteEvent: (eventId: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

const API_BASE_URL = "http://localhost:8080/api/v1";

export const useDeleteEvent = (): UseDeleteEventReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const deleteEvent = useCallback(
    async (eventId: string): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/event/${eventId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(
            `Failed to delete event: ${response.status} ${response.statusText}`,
          );
        }

        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to delete event";
        setError(errorMessage);
        console.error("Error deleting event:", err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    deleteEvent,
    loading,
    error,
    clearError,
  };
};
