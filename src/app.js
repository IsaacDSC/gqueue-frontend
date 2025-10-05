// Dashboard Management System
class Dashboard {
  constructor() {
    this.isDarkMode = false;
    this.isElectron = window.electronAPI !== undefined;
    this.events = JSON.parse(localStorage.getItem("gqueue-events") || "[]");
    this.charts = {};

    // Check for saved configuration first
    console.log("Dashboard constructor called");

    // Ensure DOM is ready before proceeding
    if (
      document.readyState !== "complete" &&
      document.readyState !== "interactive"
    ) {
      console.log("DOM not ready, waiting...");
      document.addEventListener("DOMContentLoaded", () => {
        this.checkAndLoadConfig();
      });
      return;
    }

    this.checkAndLoadConfig();
  }

  checkAndLoadConfig() {
    console.log("Checking configuration...");

    // Check for saved configuration
    const savedConfig = this.loadSavedConfig();
    console.log("Loaded config:", savedConfig);

    if (!savedConfig || !savedConfig.serverUrl) {
      console.log("No valid config found, redirecting to setup");
      this.redirectToSetup();
      return;
    }

    // Apply configuration
    this.apiBaseUrl = savedConfig.serverUrl || "http://localhost:8080";
    this.apiTimeout = savedConfig.apiTimeout || 10000;
    this.authToken = savedConfig.authToken || null;
    this.autoRefreshInterval = savedConfig.autoRefreshInterval || 60000;
    this.autoRefreshEnabled = savedConfig.autoRefreshEnabled !== false;
    this.autoRefreshTimer = null;

    console.log("Dashboard initializing with config:", {
      apiBaseUrl: this.apiBaseUrl,
      hasToken: !!this.authToken,
    });

    // Add sample events if none exist
    if (this.events.length === 0) {
      this.addSampleEvents();
    }

    // Initialize the dashboard
    try {
      this.init();
    } catch (error) {
      console.error("Dashboard initialization failed:", error);
      this.showInitializationError(error);
    }
  }

  init() {
    this.initializeTheme();
    this.initializeCharts();
    this.bindEvents();

    // Ensure all DOM elements exist before proceeding
    const requiredElements = [
      "events-list",
      "no-events",
      "rpmChart",
      "lagChart",
      "dlqChart",
    ];
    const missingElements = requiredElements.filter(
      (id) => !document.getElementById(id),
    );

    if (missingElements.length > 0) {
      console.warn(`Missing DOM elements: ${missingElements.join(", ")}`);
      // Continue anyway but log the issue
    }

    // Initialize with local events first
    console.log("Loading local events...");
    this.loadLocalEvents();
    this.renderEventsList();

    // Initialize UI status
    this.updateEventsInfo(this.events.length, this.lastDataSource || "Local");

    // Then try to load from API after a short delay
    console.log("Scheduling API load...");
    setTimeout(() => {
      console.log("Starting API load...");
      this.loadEventsFromAPI();
    }, 1000);

    this.startDataSimulation();
    this.checkApiStatus();
    this.startPeriodicStatusCheck();
    this.startAutoRefresh();
    this.updateAutoRefreshButton();
  }

  // Theme Management
  initializeTheme() {
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;

    if (systemPrefersDark) {
      this.enableDarkMode();
    } else {
      this.enableLightMode();
    }

    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", (e) => {
        if (e.matches) {
          this.enableDarkMode();
        } else {
          this.enableLightMode();
        }
      });

    if (this.isElectron) {
      window.electronAPI.onThemeUpdated((event, isDark) => {
        if (isDark) {
          this.enableDarkMode();
        } else {
          this.enableLightMode();
        }
      });
    }
  }

  enableDarkMode() {
    document.documentElement.classList.add("dark");
    this.isDarkMode = true;
    this.updateChartsTheme();
  }

  enableLightMode() {
    document.documentElement.classList.remove("dark");
    this.isDarkMode = false;
    this.updateChartsTheme();
  }

  updateChartsTheme() {
    const textColor = this.isDarkMode ? "#f3f4f6" : "#374151";
    const gridColor = this.isDarkMode ? "#374151" : "#e5e7eb";

    Object.values(this.charts).forEach((chart) => {
      if (chart) {
        chart.options.scales.x.ticks.color = textColor;
        chart.options.scales.y.ticks.color = textColor;
        chart.options.scales.x.grid.color = gridColor;
        chart.options.scales.y.grid.color = gridColor;
        chart.update();
      }
    });
  }

  // Charts Initialization
  initializeCharts() {
    try {
      console.log("Initializing charts...");

      // Check if Chart.js is available
      if (typeof Chart === "undefined") {
        console.error("Chart.js is not loaded");
        return;
      }

      this.initRPMChart();
      this.initLagChart();
      this.initDLQChart();

      console.log("Charts initialized successfully");
    } catch (error) {
      console.error("Chart initialization failed:", error);
      this.showChartsError();
    }
  }

  initRPMChart() {
    const ctx = document.getElementById("rpmChart").getContext("2d");
    const textColor = this.isDarkMode ? "#f3f4f6" : "#374151";
    const gridColor = this.isDarkMode ? "#374151" : "#e5e7eb";

    this.charts.rpm = new Chart(ctx, {
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            label: "RPM",
            data: [],
            borderColor: "#3b82f6",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            display: true,
            ticks: { color: textColor },
            grid: { color: gridColor },
          },
          y: {
            display: true,
            ticks: { color: textColor },
            grid: { color: gridColor },
            beginAtZero: true,
          },
        },
        plugins: {
          legend: { display: false },
        },
      },
    });
  }

  initLagChart() {
    const ctx = document.getElementById("lagChart").getContext("2d");
    const textColor = this.isDarkMode ? "#f3f4f6" : "#374151";
    const gridColor = this.isDarkMode ? "#374151" : "#e5e7eb";

    this.charts.lag = new Chart(ctx, {
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            label: "Latency (ms)",
            data: [],
            borderColor: "#f59e0b",
            backgroundColor: "rgba(245, 158, 11, 0.1)",
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            display: true,
            ticks: { color: textColor },
            grid: { color: gridColor },
          },
          y: {
            display: true,
            ticks: { color: textColor },
            grid: { color: gridColor },
            beginAtZero: true,
          },
        },
        plugins: {
          legend: { display: false },
        },
      },
    });
  }

  initDLQChart() {
    const ctx = document.getElementById("dlqChart").getContext("2d");
    const textColor = this.isDarkMode ? "#f3f4f6" : "#374151";
    const gridColor = this.isDarkMode ? "#374151" : "#e5e7eb";

    this.charts.dlq = new Chart(ctx, {
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            label: "DLQ RPM",
            data: [],
            borderColor: "#ef4444",
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            display: true,
            ticks: { color: textColor },
            grid: { color: gridColor },
          },
          y: {
            display: true,
            ticks: { color: textColor },
            grid: { color: gridColor },
            beginAtZero: true,
          },
        },
        plugins: {
          legend: { display: false },
        },
      },
    });
  }

  // Event Handlers
  bindEvents() {
    document
      .getElementById("toggle-theme")
      .addEventListener("click", async () => {
        if (this.isElectron) {
          const newTheme = await window.electronAPI.toggleDarkMode();
          if (newTheme) {
            this.enableDarkMode();
          } else {
            this.enableLightMode();
          }
        } else {
          if (this.isDarkMode) {
            this.enableLightMode();
          } else {
            this.enableDarkMode();
          }
        }
      });

    document
      .getElementById("system-theme")
      .addEventListener("click", async () => {
        if (this.isElectron) {
          await window.electronAPI.useSystemTheme();
        }
        const systemPrefersDark = window.matchMedia(
          "(prefers-color-scheme: dark)",
        ).matches;
        if (systemPrefersDark) {
          this.enableDarkMode();
        } else {
          this.enableLightMode();
        }
      });

    document.getElementById("add-event-btn").addEventListener("click", () => {
      this.openModal();
    });

    document.getElementById("close-modal").addEventListener("click", () => {
      this.closeModal();
    });

    document.getElementById("cancel-btn").addEventListener("click", () => {
      this.closeModal();
    });

    document.getElementById("event-form").addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleFormSubmit();
    });

    document.getElementById("event-modal").addEventListener("click", (e) => {
      if (e.target.id === "event-modal") {
        this.closeModal();
      }
    });

    // Add Escape key support
    document.addEventListener("keydown", (e) => {
      if (
        e.key === "Escape" &&
        !document.getElementById("event-modal").classList.contains("hidden")
      ) {
        this.closeModal();
      }
    });

    document
      .getElementById("test-connection-btn")
      .addEventListener("click", () => {
        this.testApiConnection();
      });

    document
      .getElementById("refresh-events-btn")
      .addEventListener("click", () => {
        this.refreshEvents();
      });

    document
      .getElementById("auto-refresh-toggle")
      .addEventListener("click", () => {
        this.toggleAutoRefresh();
        this.updateAutoRefreshButton();
      });

    document.getElementById("debug-btn").addEventListener("click", () => {
      this.debugLoadingIssues();
    });

    document.getElementById("config-btn").addEventListener("click", () => {
      this.openServerConfig();
    });
  }

  // Modal Management
  openModal() {
    document.getElementById("event-modal").classList.remove("hidden");
    document.body.style.overflow = "hidden";
    // Focus on the first input field
    setTimeout(() => {
      const firstInput = document.querySelector("#event-modal input");
      if (firstInput) {
        firstInput.focus();
      }
    }, 100);
  }

  closeModal() {
    document.getElementById("event-modal").classList.add("hidden");
    document.body.style.overflow = "auto";
    this.resetForm();
    // Remove focus from any modal elements
    if (document.activeElement) {
      document.activeElement.blur();
    }
  }

  resetForm() {
    document.getElementById("event-form").reset();
    document.getElementById("trigger-type").value = "persistent";
    document.getElementById("queue-type").value = "external.medium";
    document.getElementById("max-retries").value = "3";
    document.getElementById("retention").value = "168h";
    document.getElementById("unique-ttl").value = "60s";
    document.getElementById("api-url").value = this.apiBaseUrl;
    document.getElementById("api-timeout").value = this.apiTimeout;
  }

  // Form Handling
  async handleFormSubmit() {
    const formData = new FormData(document.getElementById("event-form"));

    // Update API settings from form
    this.apiBaseUrl = formData.get("api_url") || this.apiBaseUrl;
    this.apiTimeout = parseInt(formData.get("api_timeout")) || this.apiTimeout;

    const event = {
      name: formData.get("name"),
      service_name: formData.get("service_name"),
      repo_url: formData.get("repo_url"),
      team_owner: formData.get("team_owner"),
      triggers: [
        {
          service_name: formData.get("trigger_service_name"),
          type: formData.get("trigger_type"),
          host: formData.get("trigger_host"),
          path: formData.get("trigger_path"),
          headers: {
            "Content-Type": "application/json",
          },
          option: {
            queue_type: formData.get("queue_type"),
            max_retries: parseInt(formData.get("max_retries")),
            retention: formData.get("retention"),
            unique_ttl: formData.get("unique_ttl"),
          },
        },
      ],
    };

    await this.createEventOnBackend(event);
  }

  // Backend Integration
  async createEventOnBackend(eventData) {
    const submitButton = document.querySelector(
      '#event-form button[type="submit"]',
    );
    const originalText = submitButton.textContent;

    try {
      // Show loading state
      submitButton.textContent = "Creating...";
      submitButton.disabled = true;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.apiTimeout);

      const headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };

      if (this.authToken) {
        headers["Authorization"] = `Bearer ${this.authToken}`;
      }

      const response = await fetch(`${this.apiBaseUrl}/api/v1/event/consumer`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(eventData),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorData}`);
      }

      const result = await response.json();

      // Add created_at timestamp for local storage
      const eventWithTimestamp = {
        ...eventData,
        created_at: new Date().toISOString(),
        id: result.id || Date.now(), // Use backend ID if available
      };

      this.addEventToLocal(eventWithTimestamp);
      this.closeModal();
      this.showSuccessMessage("Event created successfully!");
    } catch (error) {
      console.error("Error creating event:", error);
      this.showErrorMessage(`Failed to create event: ${error.message}`);
    } finally {
      // Reset button state
      submitButton.textContent = originalText;
      submitButton.disabled = false;
    }
  }

  // Event Management
  addEventToLocal(event) {
    this.events.push(event);
    this.saveEvents();
    this.renderEventsList();
  }

  addEvent(event) {
    // This method is kept for backward compatibility with sample events
    this.addEventToLocal(event);
  }

  deleteEvent(index) {
    if (confirm("Are you sure you want to delete this event?")) {
      this.events.splice(index, 1);
      this.saveEvents();
      this.renderEventsList();
      // Note: In a full implementation, this would call a DELETE API endpoint
      // For now, we're just removing from local storage
    }
  }

  saveEvents() {
    localStorage.setItem("gqueue-events", JSON.stringify(this.events));
  }

  getQueueTypeColor(queueType) {
    const colors = {
      "external.high":
        "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      "external.medium":
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      "external.low":
        "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      "internal.medium":
        "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    };
    return (
      colors[queueType] ||
      "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    );
  }

  renderEventsList() {
    const container = document.getElementById("events-list");
    const noEventsMessage = document.getElementById("no-events");

    if (this.events.length === 0) {
      container.innerHTML = "";
      noEventsMessage.style.display = "block";
      this.updateEventsInfo(0, "No Data");
      return;
    }

    noEventsMessage.style.display = "none";

    // Add loading indicator if events are being fetched
    if (this.isLoadingEvents) {
      container.innerHTML = `
        <div class="flex items-center justify-center py-8">
          <svg class="w-8 h-8 mr-3 animate-spin text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          <span class="text-gray-600 dark:text-gray-400">Loading events from API...</span>
          <button onclick="dashboard.forceStopLoading()" class="ml-4 px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600">
            Stop Loading
          </button>
        </div>
      `;
      return;
    }

    this.updateEventsInfo(this.events.length, this.lastDataSource || "Local");

    container.innerHTML = this.events
      .map((event, index) => {
        const queueTypeColor = this.getQueueTypeColor(
          event.triggers[0].option.queue_type,
        );
        const typeColor =
          event.triggers[0].type === "persistent"
            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";

        return `
            <div class="border border-gray-200 dark:border-gray-600 rounded-lg p-6 hover:shadow-lg transition-all duration-200">
                <div class="flex justify-between items-start mb-4">
                    <div class="flex-1">
                        <div class="flex items-center flex-wrap gap-3 mb-3">
                            <h4 class="text-xl font-bold text-gray-900 dark:text-white">${event.name}</h4>
                            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                ${event.service_name}
                            </span>
                            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${typeColor}">
                                ${event.triggers[0].type}
                            </span>
                            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${queueTypeColor}">
                                ${event.triggers[0].option.queue_type}
                            </span>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 text-sm">
                            <div class="flex items-center space-x-2">
                                <span class="text-gray-500 dark:text-gray-400">Team:</span>
                                <span class="font-medium text-gray-900 dark:text-white">${event.team_owner}</span>
                            </div>
                            <div class="flex items-center space-x-2">
                                <span class="text-gray-500 dark:text-gray-400">Max Retries:</span>
                                <span class="font-medium text-gray-900 dark:text-white">${event.triggers[0].option.max_retries}</span>
                            </div>
                            <div class="flex items-center space-x-2">
                                <span class="text-gray-500 dark:text-gray-400">Retention:</span>
                                <span class="font-medium text-gray-900 dark:text-white">${event.triggers[0].option.retention}</span>
                            </div>
                            <div class="flex items-center space-x-2">
                                <span class="text-gray-500 dark:text-gray-400">TTL:</span>
                                <span class="font-medium text-gray-900 dark:text-white">${event.triggers[0].option.unique_ttl}</span>
                            </div>
                            <div class="flex items-center space-x-2">
                                <span class="text-gray-500 dark:text-gray-400">Consumer:</span>
                                <span class="font-medium text-gray-900 dark:text-white">${event.triggers[0].service_name}</span>
                            </div>
                        </div>

                        <div class="mb-2 text-sm">
                            <span class="text-gray-500 dark:text-gray-400">Endpoint:</span>
                            <span class="font-mono text-gray-900 dark:text-white">${event.triggers[0].host}${event.triggers[0].path}</span>
                        </div>

                        <div class="text-xs text-gray-400 dark:text-gray-500">
                            Created: ${new Date(event.created_at).toLocaleString()}
                        </div>
                    </div>

                    <div class="flex space-x-2 ml-4">
                        <button
                            onclick="dashboard.viewEvent(${index})"
                            class="px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 border border-blue-300 dark:border-blue-600 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        >
                            View JSON
                        </button>
                        <button
                            onclick="dashboard.deleteEvent(${index})"
                            class="px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 border border-red-300 dark:border-red-600 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
            `;
      })
      .join("");
  }

  viewEvent(index) {
    const event = this.events[index];
    const jsonString = JSON.stringify(event, null, 2);

    // Create a simple modal to show JSON
    const modal = document.createElement("div");
    modal.className =
      "fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center";
    modal.innerHTML = `
            <div class="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-11/12 max-h-5/6 overflow-hidden">
                <div class="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 class="text-lg font-medium text-gray-900 dark:text-white">Event JSON: ${event.name}</h3>
                    <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                <div class="p-4 overflow-auto max-h-96">
                    <pre class="bg-gray-100 dark:bg-gray-900 p-4 rounded-md text-sm text-gray-800 dark:text-gray-200 overflow-auto"><code>${jsonString}</code></pre>
                </div>
                <div class="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                    <button onclick="navigator.clipboard.writeText('${jsonString.replace(/'/g, "\\'")}'); alert('JSON copied to clipboard!')"
                            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mr-2">
                        Copy JSON
                    </button>
                    <button onclick="this.closest('.fixed').remove()"
                            class="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500">
                        Close
                    </button>
                </div>
            </div>
        `;

    document.body.appendChild(modal);
  }

  // Data Simulation
  startDataSimulation() {
    const maxDataPoints = 20;

    // Generate initial data
    for (let i = 0; i < maxDataPoints; i++) {
      const time = new Date(
        Date.now() - (maxDataPoints - i) * 30000,
      ).toLocaleTimeString();

      this.charts.rpm.data.labels.push(time);
      this.charts.lag.data.labels.push(time);
      this.charts.dlq.data.labels.push(time);

      this.charts.rpm.data.datasets[0].data.push(
        Math.floor(Math.random() * 1000) + 500,
      );
      this.charts.lag.data.datasets[0].data.push(
        Math.floor(Math.random() * 200) + 50,
      );
      this.charts.dlq.data.datasets[0].data.push(
        Math.floor(Math.random() * 50),
      );
    }

    this.charts.rpm.update();
    this.charts.lag.update();
    this.charts.dlq.update();

    this.updateCurrentValues();

    // Start real-time updates
    setInterval(() => {
      this.updateChartData();
    }, 5000);
  }

  updateChartData() {
    const time = new Date().toLocaleTimeString();
    const maxDataPoints = 20;

    const newRpm = Math.floor(Math.random() * 1000) + 500;
    const newLag = Math.floor(Math.random() * 200) + 50;
    const newDlq = Math.floor(Math.random() * 50);

    // Update RPM chart
    this.charts.rpm.data.labels.push(time);
    this.charts.rpm.data.datasets[0].data.push(newRpm);
    if (this.charts.rpm.data.labels.length > maxDataPoints) {
      this.charts.rpm.data.labels.shift();
      this.charts.rpm.data.datasets[0].data.shift();
    }

    // Update LAG chart
    this.charts.lag.data.labels.push(time);
    this.charts.lag.data.datasets[0].data.push(newLag);
    if (this.charts.lag.data.labels.length > maxDataPoints) {
      this.charts.lag.data.labels.shift();
      this.charts.lag.data.datasets[0].data.shift();
    }

    // Update DLQ chart
    this.charts.dlq.data.labels.push(time);
    this.charts.dlq.data.datasets[0].data.push(newDlq);
    if (this.charts.dlq.data.labels.length > maxDataPoints) {
      this.charts.dlq.data.labels.shift();
      this.charts.dlq.data.datasets[0].data.shift();
    }

    this.charts.rpm.update("none");
    this.charts.lag.update("none");
    this.charts.dlq.update("none");

    this.updateCurrentValues();
  }

  updateCurrentValues() {
    const rpmData = this.charts.rpm.data.datasets[0].data;
    const lagData = this.charts.lag.data.datasets[0].data;
    const dlqData = this.charts.dlq.data.datasets[0].data;

    if (rpmData.length > 0) {
      document.getElementById("rpmValue").textContent =
        rpmData[rpmData.length - 1];
      document.getElementById("lagValue").textContent =
        lagData[lagData.length - 1] + "ms";
      document.getElementById("dlqValue").textContent =
        dlqData[dlqData.length - 1];
    }
  }

  // Add sample events for demonstration
  addSampleEvents() {
    const sampleEvents = [
      {
        name: "payment.processed",
        service_name: "payment-service",
        repo_url: "https://github.com/my-org/payment-service",
        team_owner: "payments-team",
        triggers: [
          {
            service_name: "notification-consumer",
            type: "persistent",
            host: "http://localhost:3333",
            path: "/wq/payment/processed",
            headers: {
              "Content-Type": "application/json",
            },
            option: {
              queue_type: "external.medium",
              max_retries: 3,
              retention: "168h",
              unique_ttl: "60s",
            },
          },
        ],
        created_at: new Date(
          Date.now() - 2 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      },
      {
        name: "user.registered",
        service_name: "user-service",
        repo_url: "https://github.com/my-org/user-service",
        team_owner: "user-management-team",
        triggers: [
          {
            service_name: "email-consumer",
            type: "persistent",
            host: "http://localhost:3334",
            path: "/wq/user/registered",
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer token",
            },
            option: {
              queue_type: "external.high",
              max_retries: 5,
              retention: "72h",
              unique_ttl: "30s",
            },
          },
        ],
        created_at: new Date(
          Date.now() - 5 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      },
      {
        name: "order.cancelled",
        service_name: "order-service",
        repo_url: "https://github.com/my-org/order-service",
        team_owner: "order-team",
        triggers: [
          {
            service_name: "refund-consumer",
            type: "temporary",
            host: "http://localhost:3335",
            path: "/wq/order/cancelled",
            headers: {
              "Content-Type": "application/json",
            },
            option: {
              queue_type: "internal.medium",
              max_retries: 2,
              retention: "24h",
              unique_ttl: "120s",
            },
          },
        ],
        created_at: new Date(
          Date.now() - 1 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      },
      {
        name: "inventory.updated",
        service_name: "inventory-service",
        repo_url: "https://github.com/my-org/inventory-service",
        team_owner: "inventory-team",
        triggers: [
          {
            service_name: "analytics-consumer",
            type: "persistent",
            host: "http://localhost:3336",
            path: "/wq/inventory/updated",
            headers: {
              "Content-Type": "application/json",
              "X-API-Key": "analytics-key",
            },
            option: {
              queue_type: "external.low",
              max_retries: 1,
              retention: "48h",
              unique_ttl: "300s",
            },
          },
        ],
        created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      },
    ];

    this.events = sampleEvents;
    this.lastDataSource = "Sample Data";
    this.saveEvents();
  }

  // UI Helper Methods
  showSuccessMessage(message) {
    this.showMessage(message, "success");
  }

  showErrorMessage(message) {
    this.showMessage(message, "error");
  }

  showMessage(message, type = "info") {
    // Create toast notification with improved styling
    const toast = document.createElement("div");
    const iconSvg =
      type === "success"
        ? '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>'
        : type === "error"
          ? '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>'
          : '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';

    const bgColor =
      type === "success"
        ? "bg-green-500"
        : type === "error"
          ? "bg-red-500"
          : "bg-blue-500";

    toast.className = `fixed top-4 right-4 ${bgColor} text-white px-4 py-3 rounded-lg shadow-xl z-50 transform translate-x-full transition-all duration-300 flex items-center space-x-3 max-w-md`;

    toast.innerHTML = `
      <div class="flex-shrink-0">${iconSvg}</div>
      <div class="flex-1 text-sm font-medium">${message}</div>
      <button onclick="this.parentElement.classList.add('translate-x-full')" class="flex-shrink-0 ml-4 text-white hover:text-gray-200">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    `;

    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => {
      toast.classList.remove("translate-x-full");
    }, 100);

    // Auto remove after 5 seconds
    setTimeout(() => {
      toast.classList.add("translate-x-full");
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 5000);
  }

  // API Connection Test
  async testBackendConnection() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const headers = {
        Accept: "application/json",
      };

      if (this.authToken) {
        headers["Authorization"] = `Bearer ${this.authToken}`;
      }

      const response = await fetch(`${this.apiBaseUrl}/api/v1/ping`, {
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

  // Check API Status
  async checkApiStatus() {
    const statusElement = document.getElementById("api-status");
    const statusIndicator = document.getElementById("api-status-indicator");
    const statusText = document.getElementById("api-status-text");

    // Update main status element if it exists (in the event management section)
    if (statusElement) {
      statusElement.textContent = "Checking...";
      statusElement.className =
        "font-mono text-yellow-600 dark:text-yellow-400";
    }

    // Update header status indicators
    if (statusIndicator && statusText) {
      statusIndicator.className =
        "w-3 h-3 rounded-full bg-yellow-500 animate-pulse";
      statusText.textContent = "Checking API...";
      statusText.className = "text-sm text-yellow-600 dark:text-yellow-400";
    }

    try {
      const isConnected = await this.testBackendConnection();
      if (isConnected) {
        // Update main status element
        if (statusElement) {
          statusElement.textContent = `Connected to ${this.apiBaseUrl}`;
          statusElement.className =
            "font-mono text-green-600 dark:text-green-400";
        }

        // Update header indicators
        if (statusIndicator && statusText) {
          statusIndicator.className = "w-3 h-3 rounded-full bg-green-500";
          statusText.textContent = "API Connected";
          statusText.className = "text-sm text-green-600 dark:text-green-400";
        }
      } else {
        // Update main status element
        if (statusElement) {
          statusElement.textContent = `Unable to connect to ${this.apiBaseUrl}`;
          statusElement.className = "font-mono text-red-600 dark:text-red-400";
        }

        // Update header indicators
        if (statusIndicator && statusText) {
          statusIndicator.className = "w-3 h-3 rounded-full bg-red-500";
          statusText.textContent = "API Disconnected";
          statusText.className = "text-sm text-red-600 dark:text-red-400";
        }
      }
    } catch (error) {
      // Update main status element
      if (statusElement) {
        statusElement.textContent = `Error: ${this.apiBaseUrl}`;
        statusElement.className = "font-mono text-red-600 dark:text-red-400";
      }

      // Update header indicators
      if (statusIndicator && statusText) {
        statusIndicator.className = "w-3 h-3 rounded-full bg-red-500";
        statusText.textContent = "API Error";
        statusText.className = "text-sm text-red-600 dark:text-red-400";
      }
    }
  }

  // Test API Connection from form
  async testApiConnection() {
    const testButton = document.getElementById("test-connection-btn");
    const originalText = testButton.textContent;
    const apiUrlInput = document.getElementById("api-url");
    const apiTimeoutInput = document.getElementById("api-timeout");

    const testUrl = apiUrlInput.value || this.apiBaseUrl;
    const testTimeout = parseInt(apiTimeoutInput.value) || this.apiTimeout;

    try {
      testButton.textContent = "Testing...";
      testButton.disabled = true;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), testTimeout);

      const headers = {
        Accept: "application/json",
      };

      if (this.authToken) {
        headers["Authorization"] = `Bearer ${this.authToken}`;
      }

      const response = await fetch(`${testUrl}/api/v1/ping`, {
        method: "GET",
        headers: headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        this.showSuccessMessage(`Connection successful to ${testUrl}`);
        testButton.className = testButton.className.replace(
          "text-gray-700 dark:text-gray-300",
          "text-green-700 dark:text-green-300",
        );

        // Update the API configuration if connection is successful
        this.apiBaseUrl = testUrl;
        this.apiTimeout = testTimeout;

        // Update the main API status
        this.checkApiStatus();
      } else {
        this.showErrorMessage(`Connection failed: HTTP ${response.status}`);
      }
    } catch (error) {
      if (error.name === "AbortError") {
        this.showErrorMessage(`Connection timeout after ${testTimeout}ms`);
      } else {
        this.showErrorMessage(`Connection error: ${error.message}`);
      }
    } finally {
      testButton.textContent = originalText;
      testButton.disabled = false;

      // Reset button color after 3 seconds
      setTimeout(() => {
        testButton.className = testButton.className.replace(
          "text-green-700 dark:text-green-300",
          "text-gray-700 dark:text-gray-300",
        );
      }, 3000);
    }
  }

  // Start periodic API status checking
  startPeriodicStatusCheck() {
    // Check API status every 30 seconds
    setInterval(() => {
      this.checkApiStatus();
    }, 30000);
  }

  // Configuration management
  loadSavedConfig() {
    const config = localStorage.getItem("gqueue-config");
    console.log("Raw config from localStorage:", config);

    if (config) {
      try {
        const parsed = JSON.parse(config);
        console.log("Parsed config:", parsed);

        // Validate required fields
        if (!parsed.serverUrl) {
          console.warn("Config missing serverUrl, treating as invalid");
          localStorage.removeItem("gqueue-config");
          return null;
        }

        return parsed;
      } catch (e) {
        console.warn("Invalid saved config:", e);
        localStorage.removeItem("gqueue-config");
      }
    }
    console.log("No valid config found");
    return null;
  }

  redirectToSetup() {
    console.log("No configuration found, redirecting to setup...");
    window.location.href = "setup.html";
  }

  // API Integration for fetching events
  async loadEventsFromAPI() {
    console.log("Starting to load events from API...");

    // Safety check - don't set loading if already loading
    if (this.isLoadingEvents) {
      console.log("Already loading events, skipping...");
      return;
    }

    this.isLoadingEvents = true;

    // Update UI immediately to show loading
    const container = document.getElementById("events-list");
    if (container) {
      container.innerHTML = `
        <div class="flex items-center justify-center py-8">
          <svg class="w-8 h-8 mr-3 animate-spin text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          <span class="text-gray-600 dark:text-gray-400">Loading events from API...</span>
        </div>
      `;
    }

    // Safety timeout to prevent infinite loading
    const safetyTimeout = setTimeout(() => {
      console.warn("Safety timeout triggered - forcing loading to stop");
      this.isLoadingEvents = false;
      this.renderEventsList();
      this.showErrorMessage("Loading timeout - please try refreshing manually");
    }, 10000); // 10 seconds safety timeout

    try {
      console.log(`Fetching events from: ${this.apiBaseUrl}/api/v1/events`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.apiTimeout);

      const headers = {
        Accept: "application/json",
      };

      if (this.authToken) {
        headers["Authorization"] = `Bearer ${this.authToken}`;
      }

      const response = await fetch(`${this.apiBaseUrl}/api/v1/events`, {
        method: "GET",
        headers: headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`Failed to fetch events: HTTP ${response.status}`);
        this.showErrorMessage(`API Error: HTTP ${response.status}`);
        this.lastDataSource = "Local (API Error)";
        this.loadLocalEvents();
        return;
      }

      const apiEvents = await response.json();
      console.log("API Response:", apiEvents);

      // Transform API response to match our local format if needed
      const transformedEvents = this.transformAPIEvents(apiEvents);
      console.log("Transformed events:", transformedEvents);

      if (transformedEvents && transformedEvents.length > 0) {
        this.events = transformedEvents;
        this.lastDataSource = "API";
        this.saveEvents(); // Save to local storage as backup
        this.showSuccessMessage(
          `Loaded ${transformedEvents.length} events from API`,
        );
      } else {
        // If no events from API, load local events
        console.log("No events from API, loading local data");
        this.lastDataSource = "API (Empty)";
        this.loadLocalEvents();
        this.showMessage("No events found in API, showing local data", "info");
      }
    } catch (error) {
      console.error("Error fetching events from API:", error);
      if (error.name === "AbortError") {
        this.showErrorMessage(`API timeout after ${this.apiTimeout}ms`);
      } else {
        this.showErrorMessage(
          "Failed to load events from API, using local data",
        );
      }
      this.lastDataSource = "Local (API Error)";
      this.loadLocalEvents();
    } finally {
      console.log("Finished loading events, isLoadingEvents = false");
      clearTimeout(safetyTimeout);
      this.isLoadingEvents = false;

      // Ensure we always render the final state
      setTimeout(() => {
        this.renderEventsList();
      }, 100);
    }
  }

  // Load events from local storage or sample data
  loadLocalEvents() {
    console.log("Loading local events...");
    const localEvents = JSON.parse(
      localStorage.getItem("gqueue-events") || "[]",
    );
    console.log("Local events found:", localEvents);

    if (localEvents.length === 0) {
      console.log("No local events, adding sample data");
      this.addSampleEvents();
      this.lastDataSource = "Sample Data";
    } else {
      console.log("Using local events");
      this.events = localEvents;
      if (!this.lastDataSource) {
        this.lastDataSource = "Local Storage";
      }
    }

    // Only render if not currently loading from API
    if (!this.isLoadingEvents) {
      this.renderEventsList();
    }
  }

  // Transform API events to match our expected format
  transformAPIEvents(apiEvents) {
    console.log("Transforming API events:", apiEvents);

    if (!Array.isArray(apiEvents)) {
      console.warn("API response is not an array:", apiEvents);
      return [];
    }

    const transformed = apiEvents.map((event) => {
      // Ensure the event has all required fields
      return {
        name: event.name || "Unknown Event",
        service_name: event.service_name || "Unknown Service",
        repo_url: event.repo_url || "",
        team_owner: event.team_owner || "Unknown Team",
        triggers: event.triggers || [],
        created_at: event.created_at || new Date().toISOString(),
        id: event.id || event._id || Date.now() + Math.random(),
      };
    });

    console.log("Transformed result:", transformed);
    return transformed;
  }

  // Refresh events from API
  async refreshEvents() {
    const refreshButton = document.getElementById("refresh-events-btn");
    const originalText = refreshButton.textContent;

    try {
      // Show loading state
      refreshButton.disabled = true;
      refreshButton.innerHTML = `
        <svg class="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
        </svg>
        Refreshing...
      `;

      await this.loadEventsFromAPI();
    } finally {
      // Reset button state
      refreshButton.disabled = false;
      refreshButton.innerHTML = `
        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
        </svg>
        Refresh
      `;
    }
  }

  // Debug functionality to help diagnose loading issues
  debugLoadingIssues() {
    const debugInfo = {
      isLoadingEvents: this.isLoadingEvents,
      lastDataSource: this.lastDataSource,
      eventsCount: this.events.length,
      apiBaseUrl: this.apiBaseUrl,
      apiTimeout: this.apiTimeout,
      autoRefreshEnabled: this.autoRefreshEnabled,
      autoRefreshInterval: this.autoRefreshInterval,
      localStorageData: localStorage.getItem("gqueue-events"),
    };

    console.log("=== DEBUG INFO ===");
    console.log(JSON.stringify(debugInfo, null, 2));

    // Force reset loading state
    if (this.isLoadingEvents) {
      console.log("Forcing loading state to false");
      this.isLoadingEvents = false;
      this.renderEventsList();
    }

    // Show debug modal
    const debugModal = document.createElement("div");
    debugModal.className =
      "fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center";
    debugModal.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
        <h3 class="text-lg font-bold mb-4 text-gray-900 dark:text-white">Debug Information</h3>
        <pre class="bg-gray-100 dark:bg-gray-700 p-4 rounded text-sm overflow-auto text-gray-800 dark:text-gray-200">${JSON.stringify(debugInfo, null, 2)}</pre>
        <div class="mt-4 flex space-x-2">
          <button onclick="this.closest('.fixed').remove()" class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">Close</button>
          <button onclick="dashboard.forceReload()" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">Force Reload</button>
          <button onclick="dashboard.clearLocalData()" class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">Clear Local Data</button>
        </div>
      </div>
    `;

    document.body.appendChild(debugModal);
  }

  // Force reload events
  forceReload() {
    console.log("Force reloading events...");
    this.isLoadingEvents = false;
    this.loadEventsFromAPI();
    // Close debug modal
    const modal = document.querySelector(".fixed.inset-0");
    if (modal) modal.remove();
  }

  // Clear local data and reload
  clearLocalData() {
    console.log("Clearing local data...");
    localStorage.removeItem("gqueue-events");
    this.events = [];
    this.isLoadingEvents = false;
    this.loadEventsFromAPI();
    // Close debug modal
    const modal = document.querySelector(".fixed.inset-0");
    if (modal) modal.remove();
    this.showMessage("Local data cleared", "info");
  }

  // Force stop loading state
  forceStopLoading() {
    console.log("Force stopping loading state...");
    this.isLoadingEvents = false;
    this.renderEventsList();
    this.showMessage("Loading stopped manually", "info");
  }

  // Server configuration management
  openServerConfig() {
    if (
      confirm(
        "Do you want to reconfigure the server connection? This will redirect you to the setup page.",
      )
    ) {
      window.location.href = "setup.html";
    }
  }

  // Show initialization error
  showInitializationError(error) {
    document.body.innerHTML = `
      <div class="min-h-screen flex items-center justify-center bg-gray-50">
        <div class="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <div class="text-center">
            <h1 class="text-xl font-bold text-red-600 mb-4">Initialization Error</h1>
            <p class="text-gray-700 mb-4">The dashboard failed to initialize:</p>
            <p class="text-sm text-gray-600 bg-gray-100 p-3 rounded mb-4">${error.message}</p>
            <button onclick="window.location.href='setup.html'"
                    class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Go to Setup
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // Show charts error
  showChartsError() {
    const chartsContainers = ["rpmChart", "lagChart", "dlqChart"];
    chartsContainers.forEach((id) => {
      const container = document.getElementById(id);
      if (container) {
        container.innerHTML = `
          <div class="flex items-center justify-center h-full">
            <p class="text-gray-500 dark:text-gray-400 text-sm">Chart unavailable</p>
          </div>
        `;
      }
    });
  }

  // Auto refresh functionality
  startAutoRefresh() {
    if (!this.autoRefreshEnabled) return;

    this.autoRefreshTimer = setInterval(() => {
      this.loadEventsFromAPI();
    }, this.autoRefreshInterval);
  }

  stopAutoRefresh() {
    if (this.autoRefreshTimer) {
      clearInterval(this.autoRefreshTimer);
      this.autoRefreshTimer = null;
    }
  }

  toggleAutoRefresh() {
    this.autoRefreshEnabled = !this.autoRefreshEnabled;
    if (this.autoRefreshEnabled) {
      this.startAutoRefresh();
      this.showSuccessMessage("Auto refresh enabled");
    } else {
      this.stopAutoRefresh();
      this.showMessage("Auto refresh disabled", "info");
    }
  }

  // Update events information display
  updateEventsInfo(count, source) {
    const eventsCount = document.getElementById("events-count");
    const eventsSource = document.getElementById("events-source");
    const lastUpdated = document.getElementById("last-updated");

    if (eventsCount) {
      eventsCount.textContent = `Count: ${count}`;
    }

    if (eventsSource) {
      eventsSource.textContent = `Source: ${source}`;
    }

    if (lastUpdated) {
      lastUpdated.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
    }
  }

  // Update auto refresh button appearance
  updateAutoRefreshButton() {
    const button = document.getElementById("auto-refresh-toggle");
    if (!button) return;

    if (this.autoRefreshEnabled) {
      button.className = button.className.replace(
        "text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800",
        "text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900",
      );
      button.innerHTML = `
        <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        Auto ON
      `;
    } else {
      button.className = button.className.replace(
        "text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900",
        "text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800",
      );
      button.innerHTML = `
        <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        Auto OFF
      `;
    }
  }
}

// Initialize dashboard when DOM is loaded
let dashboard;
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded, initializing dashboard...");

  // Add a small delay to ensure all resources are loaded
  setTimeout(() => {
    try {
      dashboard = new Dashboard();
      console.log("Dashboard created successfully");
    } catch (error) {
      console.error("Failed to create dashboard:", error);

      // Show fallback error page
      document.body.innerHTML = `
        <div class="min-h-screen flex items-center justify-center bg-gray-50">
          <div class="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <h1 class="text-xl font-bold text-red-600 mb-4">Dashboard Error</h1>
            <p class="text-gray-700 mb-4">Failed to initialize dashboard:</p>
            <p class="text-sm text-gray-600 bg-gray-100 p-3 rounded mb-4">${error.message}</p>
            <div class="space-y-2">
              <button onclick="localStorage.clear(); location.reload();"
                      class="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Clear Data & Reload
              </button>
              <button onclick="window.location.href='setup.html';"
                      class="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
                Go to Setup
              </button>
              <button onclick="window.location.href='minimal-dashboard.html';"
                      class="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                Debug Mode
              </button>
            </div>
          </div>
        </div>
      `;
    }
  }, 100);
});
