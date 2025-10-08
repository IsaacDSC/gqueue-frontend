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

    // Initialize API service
    this.api = new ManagerApi(this.apiBaseUrl, this.authToken, this.apiTimeout);

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
        // Don't close modal if user is typing in JSON textarea
        const activeElement = document.activeElement;
        if (activeElement && activeElement.id === "triggers-json") {
          console.log("Escape pressed in JSON textarea - not closing modal");
          return;
        }
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

    // Trigger configuration event listeners
    this.bindTriggerEvents();
    console.log("Trigger events bound successfully");
  }

  // Trigger Management
  bindTriggerEvents() {
    // Toggle between form and JSON mode
    document
      .getElementById("trigger-mode-toggle")
      .addEventListener("click", () => {
        console.log("Toggle trigger mode clicked");
        this.toggleTriggerMode();
      });

    // Add new trigger
    document.getElementById("add-trigger-btn").addEventListener("click", () => {
      console.log("Add trigger button clicked");
      this.addNewTrigger();
    });

    // JSON validation
    document
      .getElementById("validate-json-btn")
      .addEventListener("click", () => {
        this.validateTriggersJson();
      });

    // Import from form to JSON
    document
      .getElementById("import-from-form-btn")
      .addEventListener("click", () => {
        this.importFormToJson();
      });

    // Paste JSON from clipboard
    document.getElementById("paste-json-btn").addEventListener("click", () => {
      this.pasteJsonFromClipboard();
    });

    // Clear JSON textarea
    document.getElementById("clear-json-btn").addEventListener("click", () => {
      this.clearJsonTextarea();
    });

    // Debug paste functionality
    document.getElementById("debug-paste-btn").addEventListener("click", () => {
      this.debugPasteFunctionality();
    });

    // Bind remove buttons for existing triggers
    this.bindRemoveTriggerButtons();

    // Add specific paste support for JSON textarea
    this.bindJsonTextareaEvents();
  }

  toggleTriggerMode() {
    const formMode = document.getElementById("triggers-form-mode");
    const jsonMode = document.getElementById("triggers-json-mode");
    const toggle = document.getElementById("trigger-mode-toggle");
    const dot = document.getElementById("trigger-mode-toggle-dot");

    if (jsonMode.classList.contains("hidden")) {
      console.log("Switching to JSON mode");
      // Switch to JSON mode
      formMode.classList.add("hidden");
      jsonMode.classList.remove("hidden");
      toggle.classList.add("bg-blue-600");
      toggle.classList.remove("bg-gray-200", "dark:bg-gray-600");
      dot.classList.add("translate-x-5");
      dot.classList.remove("translate-x-1");

      // Import current form data to JSON
      this.importFormToJson();
    } else {
      console.log("Switching to form mode");
      // Switch to form mode
      jsonMode.classList.add("hidden");
      formMode.classList.remove("hidden");
      toggle.classList.remove("bg-blue-600");
      toggle.classList.add("bg-gray-200", "dark:bg-gray-600");
      dot.classList.remove("translate-x-5");
      dot.classList.add("translate-x-1");
    }
  }

  addNewTrigger() {
    const container = document.getElementById("triggers-container");
    const triggerCount = container.children.length + 1;
    console.log(`Adding trigger #${triggerCount}`);

    const triggerHtml = `
      <div class="trigger-item border border-gray-200 dark:border-dark-border rounded-lg p-4 mb-4">
        <div class="flex items-center justify-between mb-4">
          <h5 class="text-sm font-medium dark-text">Trigger #${triggerCount}</h5>
          <button type="button" class="remove-trigger-btn text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300" title="Remove trigger">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
          </button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium dark-text-muted">Trigger Service Name</label>
            <input type="text" name="trigger_service_name" required class="mt-1 block w-full dark-input rounded-md shadow-sm py-2 px-3" />
          </div>
          <div>
            <label class="block text-sm font-medium dark-text-muted">Type</label>
            <select name="trigger_type" required class="mt-1 block w-full dark-input rounded-md shadow-sm py-2 px-3">
              <option value="persistent">persistent</option>
              <option value="temporary">temporary</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium dark-text-muted">Host</label>
            <input type="url" name="trigger_host" required class="mt-1 block w-full dark-input rounded-md shadow-sm py-2 px-3" />
          </div>
          <div>
            <label class="block text-sm font-medium dark-text-muted">Path</label>
            <input type="text" name="trigger_path" required class="mt-1 block w-full dark-input rounded-md shadow-sm py-2 px-3" />
          </div>
        </div>
        <div class="mt-4">
          <h6 class="text-xs font-medium dark-text-muted mb-3">Options</h6>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label class="block text-sm font-medium dark-text-muted">Queue Type</label>
              <select name="queue_type" required class="mt-1 block w-full dark-input rounded-md shadow-sm py-2 px-3">
                <option value="external.medium">external.medium</option>
                <option value="external.high">external.high</option>
                <option value="external.low">external.low</option>
                <option value="internal.medium">internal.medium</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium dark-text-muted">Max Retries</label>
              <input type="number" name="max_retries" min="0" max="10" value="3" required class="mt-1 block w-full dark-input rounded-md shadow-sm py-2 px-3" />
            </div>
            <div>
              <label class="block text-sm font-medium dark-text-muted">Retention</label>
              <input type="text" name="retention" value="168h" required class="mt-1 block w-full dark-input rounded-md shadow-sm py-2 px-3" />
            </div>
            <div>
              <label class="block text-sm font-medium dark-text-muted">Unique TTL</label>
              <input type="text" name="unique_ttl" value="60s" required class="mt-1 block w-full dark-input rounded-md shadow-sm py-2 px-3" />
            </div>
          </div>
        </div>
      </div>
    `;

    container.insertAdjacentHTML("beforeend", triggerHtml);
    this.updateTriggerNumbers();
    this.bindRemoveTriggerButtons();
  }

  bindRemoveTriggerButtons() {
    const removeButtons = document.querySelectorAll(".remove-trigger-btn");
    removeButtons.forEach((button) => {
      button.addEventListener("click", (e) => {
        this.removeTrigger(e.target.closest(".trigger-item"));
      });
    });
  }

  removeTrigger(triggerElement) {
    const container = document.getElementById("triggers-container");
    if (container.children.length > 1) {
      triggerElement.remove();
      this.updateTriggerNumbers();
    }
  }

  updateTriggerNumbers() {
    const container = document.getElementById("triggers-container");
    const triggers = container.children;

    Array.from(triggers).forEach((trigger, index) => {
      const title = trigger.querySelector("h5");
      title.textContent = `Trigger #${index + 1}`;

      const removeBtn = trigger.querySelector(".remove-trigger-btn");
      if (triggers.length === 1) {
        removeBtn.classList.add("hidden");
      } else {
        removeBtn.classList.remove("hidden");
      }
    });
  }

  validateTriggersJson() {
    const jsonTextarea = document.getElementById("triggers-json");
    const messageDiv = document.getElementById("json-validation-message");

    try {
      const triggers = JSON.parse(jsonTextarea.value);

      if (!Array.isArray(triggers)) {
        throw new Error("JSON must be an array of triggers");
      }

      triggers.forEach((trigger, index) => {
        if (!trigger.service_name)
          throw new Error(`Trigger ${index + 1}: service_name is required`);
        if (!trigger.type)
          throw new Error(`Trigger ${index + 1}: type is required`);
        if (!trigger.host)
          throw new Error(`Trigger ${index + 1}: host is required`);
        if (!trigger.path)
          throw new Error(`Trigger ${index + 1}: path is required`);
      });

      messageDiv.className = "mt-2 text-sm text-green-600 dark:text-green-400";
      messageDiv.textContent = "✓ Valid JSON format";
      messageDiv.classList.remove("hidden");

      setTimeout(() => messageDiv.classList.add("hidden"), 3000);
    } catch (error) {
      messageDiv.className = "mt-2 text-sm text-red-600 dark:text-red-400";
      messageDiv.textContent = `❌ ${error.message}`;
      messageDiv.classList.remove("hidden");
    }
  }

  importFormToJson() {
    const triggers = this.getTriggersFromForm();
    const jsonTextarea = document.getElementById("triggers-json");
    jsonTextarea.value = JSON.stringify(triggers, null, 2);
  }

  getTriggersFromForm() {
    const triggerItems = document.querySelectorAll(".trigger-item");
    const triggers = [];

    triggerItems.forEach((item) => {
      const trigger = {
        service_name: item.querySelector('input[name="trigger_service_name"]')
          .value,
        type: item.querySelector('select[name="trigger_type"]').value,
        host: item.querySelector('input[name="trigger_host"]').value,
        path: item.querySelector('input[name="trigger_path"]').value,
        headers: {
          "Content-Type": "application/json",
        },
        option: {
          queue_type: item.querySelector('select[name="queue_type"]').value,
          max_retries: parseInt(
            item.querySelector('input[name="max_retries"]').value,
          ),
          retention: item.querySelector('input[name="retention"]').value,
          unique_ttl: item.querySelector('input[name="unique_ttl"]').value,
        },
      };

      if (trigger.service_name && trigger.host && trigger.path) {
        triggers.push(trigger);
      }
    });

    return triggers;
  }

  bindJsonTextareaEvents() {
    const jsonTextarea = document.getElementById("triggers-json");

    // Ensure paste events work properly
    jsonTextarea.addEventListener("paste", (e) => {
      console.log("Paste event detected in JSON textarea");
      // Allow the default paste behavior
      setTimeout(() => {
        console.log(
          "JSON textarea content after paste:",
          jsonTextarea.value.length,
          "characters",
        );
      }, 10);
    });

    // Add keyboard shortcuts
    jsonTextarea.addEventListener("keydown", (e) => {
      // Ctrl+V or Cmd+V for paste (usually handled by browser, but ensure it's not blocked)
      if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        console.log("Paste shortcut detected");
        // Don't prevent default - let browser handle paste
        return true;
      }

      // Ctrl+A or Cmd+A for select all
      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        console.log("Select all shortcut detected");
        return true;
      }
    });

    // Focus and blur events for debugging
    jsonTextarea.addEventListener("focus", () => {
      console.log("JSON textarea focused");
    });

    jsonTextarea.addEventListener("blur", () => {
      console.log("JSON textarea blurred");
    });
  }

  // Paste JSON from clipboard using Clipboard API
  async pasteJsonFromClipboard() {
    const jsonTextarea = document.getElementById("triggers-json");
    const messageDiv = document.getElementById("json-validation-message");

    try {
      // Check if Clipboard API is available
      if (!navigator.clipboard) {
        throw new Error(
          "Clipboard API not available. Use Ctrl+V or Cmd+V to paste.",
        );
      }

      // Read text from clipboard
      const clipboardText = await navigator.clipboard.readText();
      console.log("Read from clipboard:", clipboardText.length, "characters");

      if (!clipboardText.trim()) {
        throw new Error("Clipboard is empty or contains no text.");
      }

      // Set the text in the textarea
      jsonTextarea.value = clipboardText;
      jsonTextarea.focus();

      // Show success message
      messageDiv.className = "mt-2 text-sm text-green-600 dark:text-green-400";
      messageDiv.textContent = "✓ JSON pasted from clipboard successfully";
      messageDiv.classList.remove("hidden");

      // Auto-validate after paste
      setTimeout(() => {
        this.validateTriggersJson();
      }, 100);

      console.log("JSON pasted successfully");
    } catch (error) {
      console.error("Paste error:", error);

      // Show error message
      messageDiv.className =
        "mt-2 text-sm text-orange-600 dark:text-orange-400";
      messageDiv.textContent = `📋 ${error.message}`;
      messageDiv.classList.remove("hidden");

      // Focus on textarea for manual paste
      jsonTextarea.focus();

      setTimeout(() => messageDiv.classList.add("hidden"), 5000);
    }
  }

  // Clear JSON textarea
  clearJsonTextarea() {
    const jsonTextarea = document.getElementById("triggers-json");
    const messageDiv = document.getElementById("json-validation-message");

    jsonTextarea.value = "";
    jsonTextarea.focus();

    // Hide any validation messages
    messageDiv.classList.add("hidden");

    console.log("JSON textarea cleared");
  }

  // Debug paste functionality
  debugPasteFunctionality() {
    const jsonTextarea = document.getElementById("triggers-json");
    const messageDiv = document.getElementById("json-validation-message");

    console.log("🔧 Starting paste functionality debug...");

    // Test 1: Check textarea properties
    console.log("1. Textarea properties:");
    console.log("  - ID:", jsonTextarea.id);
    console.log("  - Focused:", document.activeElement === jsonTextarea);
    console.log("  - Disabled:", jsonTextarea.disabled);
    console.log("  - ReadOnly:", jsonTextarea.readOnly);
    console.log("  - TabIndex:", jsonTextarea.tabIndex);

    // Test 2: Check Clipboard API
    console.log("2. Clipboard API support:");
    console.log("  - Available:", !!navigator.clipboard);
    console.log("  - HTTPS context:", location.protocol === "https:");
    console.log("  - Secure context:", window.isSecureContext);

    // Test 3: Test programmatic value setting
    console.log("3. Testing programmatic value setting...");
    const originalValue = jsonTextarea.value;
    const testJson = '[{"test": "debug"}]';
    jsonTextarea.value = testJson;
    const setValue = jsonTextarea.value === testJson;
    console.log("  - Can set value:", setValue);
    jsonTextarea.value = originalValue; // Restore

    // Test 4: Test focus
    console.log("4. Testing focus...");
    jsonTextarea.focus();
    const canFocus = document.activeElement === jsonTextarea;
    console.log("  - Can focus:", canFocus);

    // Test 5: Check event listeners
    console.log("5. Event listeners check:");
    if (typeof getEventListeners === "function") {
      const listeners = getEventListeners(jsonTextarea);
      console.log("  - Event listeners:", listeners);
    } else {
      console.log("  - getEventListeners not available (Chrome DevTools only)");
    }

    // Test 6: Simulate paste event
    console.log("6. Simulating paste event...");
    try {
      const pasteEvent = new ClipboardEvent("paste", {
        bubbles: true,
        cancelable: true,
        clipboardData: new DataTransfer(),
      });
      pasteEvent.clipboardData.setData("text/plain", testJson);
      const eventDispatched = jsonTextarea.dispatchEvent(pasteEvent);
      console.log("  - Paste event dispatched:", eventDispatched);
      console.log("  - Value after paste simulation:", jsonTextarea.value);
    } catch (error) {
      console.log("  - Paste simulation error:", error.message);
    }

    // Show debug summary
    messageDiv.className = "mt-2 text-sm text-purple-600 dark:text-purple-400";
    messageDiv.textContent = "🔧 Debug completed - check console for details";
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);

    console.log("🔧 Debug completed. Try pasting now with Ctrl+V/Cmd+V");
  }

  // Modal Management
  openModal() {
    document.getElementById("event-modal").classList.remove("hidden");
    document.body.style.overflow = "hidden";

    // Initialize trigger functionality
    this.updateTriggerNumbers();
    this.bindRemoveTriggerButtons();

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

    // Reset to single trigger
    const container = document.getElementById("triggers-container");
    const firstTrigger = container.firstElementChild;
    container.innerHTML = "";
    container.appendChild(firstTrigger);

    // Reset form mode
    const formMode = document.getElementById("triggers-form-mode");
    const jsonMode = document.getElementById("triggers-json-mode");
    const toggle = document.getElementById("trigger-mode-toggle");
    const dot = document.getElementById("trigger-mode-toggle-dot");

    jsonMode.classList.add("hidden");
    formMode.classList.remove("hidden");
    toggle.classList.remove("bg-blue-600");
    toggle.classList.add("bg-gray-200", "dark:bg-gray-600");
    dot.classList.remove("translate-x-5");
    dot.classList.add("translate-x-1");

    // Clear JSON textarea
    document.getElementById("triggers-json").value = "";

    document.getElementById("api-url").value = this.apiBaseUrl;
    document.getElementById("api-timeout").value = this.apiTimeout;
  }

  // Form Handling
  async handleFormSubmit() {
    const formData = new FormData(document.getElementById("event-form"));

    // Update API settings from form
    this.apiBaseUrl = formData.get("api_url") || this.apiBaseUrl;
    this.apiTimeout = parseInt(formData.get("api_timeout")) || this.apiTimeout;

    let triggers;

    // Check if in JSON mode
    const jsonMode = document.getElementById("triggers-json-mode");
    if (!jsonMode.classList.contains("hidden")) {
      console.log("Using JSON mode for form submission");
      // Use JSON data
      try {
        const jsonValue = document.getElementById("triggers-json").value.trim();
        if (jsonValue) {
          triggers = JSON.parse(jsonValue);
          console.log("Parsed triggers from JSON:", triggers);
        } else {
          triggers = this.getTriggersFromForm();
          console.log("JSON empty, using form data:", triggers);
        }
      } catch (error) {
        console.error("JSON parsing error:", error);
        alert(
          "Invalid JSON format in triggers configuration. Please validate your JSON first.",
        );
        return;
      }
    } else {
      console.log("Using form mode for submission");
      // Use form data
      triggers = this.getTriggersFromForm();
      console.log("Extracted triggers from form:", triggers);
    }

    if (triggers.length === 0) {
      alert("At least one trigger is required.");
      return;
    }

    const event = {
      name: formData.get("name"),
      service_name: formData.get("service_name"),
      repo_url: formData.get("repo_url"),
      team_owner: formData.get("team_owner"),
      triggers: triggers,
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

      const result = await this.api.createEvent(eventData);

      if (result.status === "ERROR") {
        throw new Error(result.error);
      }

      this.addEventToLocal(result.data);
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
    this.renderEventsList();
  }

  addEvent(event) {
    // This method is kept for backward compatibility with sample events
    this.addEventToLocal(event);
  }

  async saveEvents() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/api/v1/event/consumer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(this.events),
      });

      if (response.status >= 200 && response.status < 300) {
        console.log("Events saved to server successfully");
        this.showMessage("Events saved to server successfully", "success");
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error saving events to server:", error);
      this.showMessage(
        "Failed to save events to server. Data saved locally.",
        "error",
      );
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
                            onclick="dashboard.deleteEventById('${event.id}')"
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

  deleteEventById(id) {
    console.log({ id });
    if (confirm(`Are you sure you want to delete the event "${id}"?`)) {
      this.renderEventsList();
    }
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
      return await this.api.ping();
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

      // Create a temporary API instance for testing with new parameters
      const testApi = new ManagerApi(testUrl, this.authToken, testTimeout);
      const isConnected = await testApi.ping();

      if (isConnected) {
        this.showSuccessMessage(`Connection successful to ${testUrl}`);
        testButton.className = testButton.className.replace(
          "text-gray-700 dark:text-gray-300",
          "text-green-700 dark:text-green-300",
        );

        // Update the API configuration if connection is successful
        this.apiBaseUrl = testUrl;
        this.apiTimeout = testTimeout;
        this.api = new ManagerApi(
          this.apiBaseUrl,
          this.authToken,
          this.apiTimeout,
        );

        // Update the main API status
        this.checkApiStatus();
      } else {
        this.showErrorMessage(`Connection failed to ${testUrl}`);
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

      const result = await this.api.getEvents();
      console.log("API Response:", result);

      if (result.status === "ERROR") {
        console.warn(`Failed to fetch events: ${result.error}`);
        this.showErrorMessage(`API Error: ${result.error}`);
        this.lastDataSource = "Local (API Error)";
        this.loadLocalEvents();
        return;
      }

      const apiEvents = result.data;

      // Transform API response to match our local format if needed
      const transformedEvents = this.transformAPIEvents(apiEvents);
      console.log("Transformed events:", transformedEvents);

      if (transformedEvents && transformedEvents.length > 0) {
        this.events = transformedEvents;
        this.lastDataSource = "API";
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
