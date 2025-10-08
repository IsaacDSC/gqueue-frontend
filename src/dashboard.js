// Dashboard Management System
class Dashboard {
  constructor() {
    this.isDarkMode = false;
    this.isElectron = window.electronAPI !== undefined;
    this.events = JSON.parse(localStorage.getItem("gqueue-events") || "[]");

    // Add sample events if none exist
    if (this.events.length === 0) {
      this.addSampleEvents();
    }
    this.charts = {};

    this.init();
  }

  init() {
    this.initializeTheme();
    this.initializeCharts();
    this.bindEvents();
    this.renderEventsList();
    this.startDataSimulation();
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

    // Listen for system theme changes
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", (e) => {
        if (e.matches) {
          this.enableDarkMode();
        } else {
          this.enableLightMode();
        }
      });

    // Listen for Electron theme updates
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
        chart.options.plugins.legend.labels.color = textColor;
        chart.update();
      }
    });
  }

  // Charts Initialization
  initializeCharts() {
    Chart.defaults.font.family = "Inter, system-ui, sans-serif";
    Chart.defaults.font.size = 12;

    this.initRPMChart();
    this.initLagChart();
    this.initDLQChart();
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
          legend: {
            display: false,
          },
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
          legend: {
            display: false,
          },
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
          legend: {
            display: false,
          },
        },
      },
    });
  }

  // Event Handlers
  bindEvents() {
    // Theme toggle buttons
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

    // Modal handlers
    document.getElementById("add-event-btn").addEventListener("click", () => {
      this.openModal();
    });

    document.getElementById("close-modal").addEventListener("click", () => {
      this.closeModal();
    });

    document.getElementById("cancel-btn").addEventListener("click", () => {
      this.closeModal();
    });

    // Form submission
    document.getElementById("event-form").addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleFormSubmit();
    });

    // Close modal on background click
    document.getElementById("event-modal").addEventListener("click", (e) => {
      if (e.target.id === "event-modal") {
        this.closeModal();
      }
    });
  }

  // Modal Management
  openModal() {
    document.getElementById("event-modal").classList.add("show");
    document.body.style.overflow = "hidden";
  }

  closeModal() {
    document.getElementById("event-modal").classList.remove("show");
    document.body.style.overflow = "auto";
    this.resetForm();
  }

  resetForm() {
    document.getElementById("event-form").reset();
    document.getElementById("trigger-type").value = "persistent";
    document.getElementById("queue-type").value = "external.medium";
    document.getElementById("max-retries").value = "3";
    document.getElementById("retention").value = "168h";
    document.getElementById("unique-ttl").value = "60s";
  }

  // Form Handling
  async handleFormSubmit() {
    const formData = new FormData(document.getElementById("event-form"));
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
      created_at: new Date().toISOString(),
    };

    await this.addEvent(event);
    this.closeModal();
  }

  // Event Management
  async addEvent(event) {
    this.events.push(event);
    await this.saveEvents();
    this.renderEventsList();
  }

  deleteEventById(index) {
    const eventIndex = parseInt(index);
    const event = this.events[eventIndex];

    if (!event) {
      console.error("Event not found at index:", eventIndex);
      return;
    }

    console.log({ deletingEvent: event });
    if (confirm(`Are you sure you want to delete the event "${event.name}"?`)) {
      this.events.splice(eventIndex, 1);
      this.renderEventsList();
    }
  }

  async saveEvents() {
    // Save to local storage as backup
    localStorage.setItem("gqueue-events", JSON.stringify(this.events));

    // Send events to server
    try {
      const response = await fetch(
        "http://localhost:8080/api/v1/event/consumer",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(this.events),
        },
      );

      if (response.status >= 200 && response.status < 300) {
        console.log("Events saved to server successfully");
        alert("Events saved to server successfully!");
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error saving events to server:", error);
      alert("Failed to save events to server. Data saved locally.");
    }
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

  // Sample Events
  async addSampleEvents() {
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
    ];

    this.events = sampleEvents;
    await this.saveEvents();
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

    // Start real-time updates
    setInterval(() => {
      this.updateChartData();
    }, 5000);
  }

  updateChartData() {
    const time = new Date().toLocaleTimeString();
    const maxDataPoints = 20;

    // Add new data point
    [this.charts.rpm, this.charts.lag, this.charts.dlq].forEach((chart) => {
      chart.data.labels.push(time);
      if (chart.data.labels.length > maxDataPoints) {
        chart.data.labels.shift();
        chart.data.datasets[0].data.shift();
      }
    });

    this.charts.rpm.data.datasets[0].data.push(
      Math.floor(Math.random() * 1000) + 500,
    );
    this.charts.lag.data.datasets[0].data.push(
      Math.floor(Math.random() * 200) + 50,
    );
    this.charts.dlq.data.datasets[0].data.push(Math.floor(Math.random() * 50));

    this.charts.rpm.update("none");
    this.charts.lag.update("none");
    this.charts.dlq.update("none");
  }
}

// Initialize dashboard when page loads
document.addEventListener("DOMContentLoaded", () => {
  window.dashboard = new Dashboard();
});
