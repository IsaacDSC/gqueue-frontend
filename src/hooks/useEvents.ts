import { useState, useCallback } from "react";
import { CreateEventRequest, Event, EventFormData } from "../types";

interface UseEventsReturn {
  events: Event[];
  loading: boolean;
  error: string | null;
  createEvent: (eventData: CreateEventRequest) => Promise<boolean>;
  fetchEvents: () => Promise<void>;
  testApiConnection: (baseUrl?: string) => Promise<boolean>;
  clearError: () => void;
}

const API_BASE_URL = "http://localhost:8080/api/v1";

export const useEvents = (): UseEventsReturn => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/events`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch events: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();
      setEvents(Array.isArray(data) ? data : data.events || []);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch events";
      setError(errorMessage);
      console.error("Error fetching events:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createEvent = useCallback(
    async (eventData: CreateEventRequest): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        console.log("Creating event with data:", eventData);

        const response = await fetch(`${API_BASE_URL}/event/consumer`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(eventData),
        });

        console.log("Response status:", response.status);
        console.log("Response headers:", response.headers);

        if (!response.ok) {
          let errorText = "";
          try {
            errorText = await response.text();
          } catch (textError) {
            errorText = "Unable to read error response";
          }
          throw new Error(
            `Failed to create event: ${response.status} ${response.statusText}. ${errorText}`,
          );
        }

        // Check if response has content
        const contentLength = response.headers.get("content-length");
        const contentType = response.headers.get("content-type");

        console.log("Content-Length:", contentLength);
        console.log("Content-Type:", contentType);

        let responseData = null;

        // Only try to parse JSON if there's content and it's JSON
        if (
          contentLength !== "0" &&
          contentType &&
          contentType.includes("application/json")
        ) {
          try {
            const responseText = await response.text();
            console.log("Response text:", responseText);

            if (responseText.trim()) {
              responseData = JSON.parse(responseText);
            }
          } catch (jsonError) {
            console.warn("Failed to parse JSON response:", jsonError);
            // Don't throw error if JSON parsing fails but request was successful
          }
        }

        console.log("Parsed response data:", responseData);

        // Add the new event to the events list if it has an ID
        if (responseData && responseData.id) {
          const newEvent: Event = {
            ...eventData,
            id: responseData.id,
            type_event: eventData.type_event || 0,
            state: eventData.state || "active",
            created_at: new Date().toISOString(),
          };
          setEvents((prevEvents) => [...prevEvents, newEvent]);
        } else {
          // If no response data, still add event with generated ID
          const newEvent: Event = {
            ...eventData,
            id: Date.now().toString(),
            type_event: eventData.type_event || 0,
            state: eventData.state || "active",
            created_at: new Date().toISOString(),
          };
          setEvents((prevEvents) => [...prevEvents, newEvent]);
        }

        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to create event";
        setError(errorMessage);
        console.error("Error creating event:", err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const testApiConnection = useCallback(
    async (baseUrl: string = API_BASE_URL): Promise<boolean> => {
      setLoading(true);
      setError(null);

      try {
        console.log("Testing API connection to:", baseUrl);

        // Try multiple endpoints to test connectivity
        const endpoints = ["/health", "/api/v1/health", "/ping"];

        for (const endpoint of endpoints) {
          try {
            const response = await fetch(`${baseUrl}${endpoint}`, {
              method: "GET",
              headers: {
                Accept: "application/json",
              },
            });

            console.log(`${endpoint} response:`, response.status);

            if (response.ok) {
              console.log("API connection successful via", endpoint);
              return true;
            }
          } catch (endpointError) {
            console.log(`Endpoint ${endpoint} failed:`, endpointError);
            continue;
          }
        }

        // If health checks fail, try the actual API endpoint
        const response = await fetch(`${baseUrl}/api/v1/events`, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        });

        console.log("Events endpoint response:", response.status);
        return response.status < 500; // Accept 4xx but not 5xx errors
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Connection test failed";
        setError(errorMessage);
        console.error("API connection test failed:", err);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    events,
    loading,
    error,
    createEvent,
    fetchEvents,
    testApiConnection,
    clearError,
  };
};
