// GQueue Frontend Configuration Example
// Copy this file to config.js and modify as needed

window.GQUEUE_CONFIG = {
  // Backend API Configuration
  apiBaseUrl: "http://localhost:8080",
  apiTimeout: 10000, // 10 seconds

  // Events Auto-refresh Configuration
  autoRefreshEnabled: true,
  autoRefreshInterval: 60000, // 1 minute (60000ms)

  // Development settings
  development: {
    apiBaseUrl: "http://localhost:8080",
    apiTimeout: 15000,
    enableLogging: true,
    mockData: false,
    autoRefreshEnabled: true,
    autoRefreshInterval: 30000, // 30 seconds for development
  },

  // Production settings
  production: {
    apiBaseUrl: "https://your-production-api.com",
    apiTimeout: 8000,
    enableLogging: false,
    mockData: false,
    autoRefreshEnabled: true,
    autoRefreshInterval: 120000, // 2 minutes for production
  },

  // Testing settings
  testing: {
    apiBaseUrl: "http://localhost:8080",
    apiTimeout: 5000,
    enableLogging: true,
    mockData: true,
    autoRefreshEnabled: false, // Disable auto-refresh in tests
    autoRefreshInterval: 10000,
  },

  // Chart configuration
  charts: {
    updateInterval: 5000, // 5 seconds
    maxDataPoints: 20,
    animationDuration: 300,
  },

  // Theme settings
  theme: {
    defaultTheme: "system", // "light", "dark", or "system"
    persistTheme: true,
  },

  // Event form defaults
  eventDefaults: {
    triggerType: "persistent",
    queueType: "external.medium",
    maxRetries: 3,
    retention: "168h",
    uniqueTtl: "60s",
    headers: {
      "Content-Type": "application/json",
    },
  },
};

// Environment detection
const ENV =
  window.location.hostname === "localhost" ? "development" : "production";

// Merge environment-specific config
if (window.GQUEUE_CONFIG[ENV]) {
  Object.assign(window.GQUEUE_CONFIG, window.GQUEUE_CONFIG[ENV]);
}
