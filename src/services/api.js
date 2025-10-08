class ManagerApi {
  constructor(baseUrl, authToken, timeout = 10000) {
    this.baseUrl = baseUrl;
    this.authToken = authToken;
    this.timeout = timeout;
  }

  async createEvent(eventData) {
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (this.authToken) {
      headers["Authorization"] = `Bearer ${this.authToken}`;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}/api/v1/event/consumer`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(eventData),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.text();
        return {
          error: errorData,
          status: "ERROR",
        };
      }

      const result = await response.json();
      const eventWithTimestamp = {
        data: {
          ...eventData,
          created_at: new Date().toISOString(),
          id: result.id || Date.now(),
        },
        status: "SUCCESS",
      };

      return eventWithTimestamp;
    } catch (error) {
      return {
        error: error.message,
        status: "ERROR",
      };
    }
  }

  async getEvents() {
    try {
      const headers = {
        Accept: "application/json",
      };

      if (this.authToken) {
        headers["Authorization"] = `Bearer ${this.authToken}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}/api/v1/events`, {
        method: "GET",
        headers: headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`Failed to fetch events: HTTP ${response.status}`);
        return {
          error: `API Error: HTTP ${response.status}`,
          status: "ERROR",
        };
      }

      const apiEvents = await response.json();

      return {
        data: apiEvents,
        status: "SUCCESS",
      };
    } catch (error) {
      return {
        error: error.message,
        status: "ERROR",
      };
    }
  }

  async disableEvent(eventId) {
    try {
      const headers = {
        Accept: "application/json",
      };

      if (this.authToken) {
        headers["Authorization"] = `Bearer ${this.authToken}`;
      }

      const response = await fetch(`${this.baseUrl}/api/v1/events`, {
        method: "GET",
        headers: headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return {
          error: `API Error: HTTP ${response.status}`,
          status: "ERROR",
        };
      }

      return {
        status: "SUCCESS",
      };
    } catch (error) {
      return {
        error: error.message,
        status: "ERROR",
      };
    }
  }

  async ping() {
    try {
      const headers = {
        Accept: "application/json",
      };

      if (this.authToken) {
        headers["Authorization"] = `Bearer ${this.authToken}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}/api/v1/ping`, {
        method: "GET",
        headers: headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.warn("Backend connection test failed:", error);
      return false;
    }
  }
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = ManagerApi;
}
