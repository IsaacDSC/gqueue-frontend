import { useState, useCallback, useEffect } from "react";
import { Event } from "../types";
import { useConnectionConfig } from "./useConnectionConfig";

interface UseRegisteredEventsReturn {
  events: Event[];
  loading: boolean;
  error: string | null;
  fetchEvents: () => Promise<void>;
  refreshEvents: () => void;
  clearError: () => void;
}

export const useRegisteredEvents = (): UseRegisteredEventsReturn => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { makeAuthenticatedRequest } = useConnectionConfig();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await makeAuthenticatedRequest("/api/v1/events", {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch registered events: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();

      // The API returns an array of events directly
      if (Array.isArray(data)) {
        setEvents(data);
      } else {
        throw new Error("Invalid response format: expected array of events");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to fetch registered events";
      setError(errorMessage);
      console.error("Error fetching registered events:", err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [makeAuthenticatedRequest]);

  const refreshEvents = useCallback(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Fetch events automatically when the hook is used
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return {
    events,
    loading,
    error,
    fetchEvents,
    refreshEvents,
    clearError,
  };
};
