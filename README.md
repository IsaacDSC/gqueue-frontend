# GQueue Frontend Dashboard

A modern Electron-based dashboard for managing and monitoring GQueue events with real-time charts and dark/light theme support.

## Features

- **Real-time Monitoring**: Live charts showing RPM, Latency, and Dead Letter Queue metrics
- **Event Management**: Create, view, and manage queue events through an intuitive interface
- **Backend Integration**: Direct integration with GQueue backend API for event creation
- **Theme Support**: Dark/light theme with system preference detection
- **Cross-platform**: Built with Electron for Windows, macOS, and Linux

## Prerequisites

- Node.js (v16 or higher)
- Yarn package manager
- GQueue Backend running on `http://localhost:8080` (configurable)

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd gqueue-frontend
```

2. Install dependencies:

```bash
yarn install
```

3. Start the application:

```bash
yarn start
```

## Usage

### Dashboard Overview

The dashboard displays three main sections:

1. **Metrics Charts** (Top): Real-time visualization of:
   - RPM (Requests Per Minute)
   - LAG (Latency in milliseconds)
   - DLQ RPM (Dead Letter Queue Requests Per Minute)

2. **Event Management** (Middle): Controls for creating new events

3. **Event List** (Bottom): Display of all registered events with detailed information

### Creating Events

1. Click the "Add Event" button
2. Configure API settings if needed (URL and timeout)
3. Fill in the event details:
   - **Event Name**: Unique identifier for the event
   - **Service Name**: Name of the service producing the event
   - **Repository URL**: Git repository URL
   - **Team Owner**: Responsible team

4. Configure trigger settings:
   - **Trigger Service Name**: Consumer service name
   - **Type**: persistent or temporary
   - **Host**: Consumer endpoint host
   - **Path**: Consumer endpoint path
   - **Queue Type**: external.high, external.medium, external.low, or internal.medium
   - **Max Retries**: Number of retry attempts
   - **Retention**: How long to keep the event
   - **Unique TTL**: Time-to-live for unique constraints

5. Click "Create Event" to submit to the backend

### API Configuration

The dashboard supports configurable API settings:

- **Default URL**: `http://localhost:8080`
- **Timeout**: 10 seconds (configurable)
- **Test Connection**: Built-in connection testing

To change API settings:

1. Open the "Add Event" modal
2. Modify the API Base URL and timeout in the API Configuration section
3. Click "Test Connection" to verify connectivity

### Theme Management

- **Toggle Theme**: Click the theme button in the header
- **System Theme**: Automatically follows system dark/light preference
- **Persistent**: Theme preference is saved and restored

## Backend Integration

The dashboard integrates with the GQueue backend via REST API:

### API Endpoints

#### Health Check

```
GET /api/v1/ping
```

#### Get All Events

```
GET /api/v1/events
Accept: application/json
```

#### Create Event

```
POST /api/v1/event/consumer
Content-Type: application/json
```

Example payload:

```json
{
  "name": "payment.processed",
  "service_name": "my-app",
  "repo_url": "http://github.com/my-org/my-repo",
  "team_owner": "my-team",
  "triggers": [
    {
      "service_name": "consumer-1",
      "type": "persistent",
      "host": "http://localhost:3333",
      "path": "/wq/payment/processed",
      "headers": {
        "Content-Type": "application/json"
      },
      "option": {
        "queue_type": "external.medium",
        "max_retries": 3,
        "retention": "168h",
        "unique_ttl": "60s"
      }
    }
  ]
}
```

### Events List Integration

The dashboard automatically fetches events from the backend API on startup. Features include:

- **Automatic loading**: Events are fetched from `/api/v1/events` on application start
- **Fallback mechanism**: If API is unavailable, shows local/sample data
- **Manual refresh**: Click the "Refresh" button to reload events from API
- **Auto-refresh**: Toggle automatic refresh every 60 seconds
- **Data source indicator**: Shows whether data comes from API or local storage
- **Real-time status**: Displays event count and last updated time

#### Expected API Response Format

```json
[
  {
    "id": "event-123",
    "name": "payment.processed",
    "service_name": "payment-service",
    "repo_url": "https://github.com/my-org/payment-service",
    "team_owner": "payments-team",
    "triggers": [
      {
        "service_name": "notification-consumer",
        "type": "persistent",
        "host": "http://localhost:3333",
        "path": "/wq/payment/processed",
        "headers": {
          "Content-Type": "application/json"
        },
        "option": {
          "queue_type": "external.medium",
          "max_retries": 3,
          "retention": "168h",
          "unique_ttl": "60s"
        }
      }
    ],
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

## Development

### Project Structure

```
src/
├── index.html      # Main HTML file
├── app.js          # Dashboard logic and API integration
├── main.js         # Electron main process
└── preload.js      # Electron preload script
```

### Available Scripts

- `yarn start`: Start the Electron application
- `yarn dev`: Start with development logging
- `yarn electron`: Run Electron directly

### Configuration

API configuration can be modified in `src/index.html`:

```javascript
window.GQUEUE_CONFIG = {
  apiBaseUrl: "http://localhost:8080",
  apiTimeout: 10000,
  autoRefreshInterval: 60000, // 1 minute
  autoRefreshEnabled: true,
};
```

## Troubleshooting

### Common Issues

1. **Cannot connect to backend**:
   - Verify backend is running on the configured URL
   - Check firewall settings
   - Use the "Test Connection" feature in the dashboard

2. **Events not saving**:
   - Check browser console for error messages
   - Verify API endpoint is accessible
   - Ensure request payload matches expected format

3. **Charts not updating**:
   - Charts use simulated data for demonstration
   - Real metrics integration would require additional backend endpoints

### Error Messages

The dashboard provides user-friendly error messages:

- Connection timeouts
- HTTP errors with status codes
- Network connectivity issues
- API fetch failures with fallback to local data

### Events Management

#### Loading Behavior

1. **Primary**: Attempts to load events from API (`/api/v1/events`)
2. **Fallback**: If API fails, loads from local storage
3. **Default**: If no local data, shows sample events

#### Manual Controls

- **Refresh Button**: Manually reload events from API
- **Auto-refresh Toggle**: Enable/disable automatic refresh (default: ON)
- **Data Source Indicator**: Shows current data source (API/Local/Error)

#### Auto-refresh Settings

- **Default Interval**: 60 seconds
- **Configurable**: Via `window.GQUEUE_CONFIG.autoRefreshInterval`
- **Toggle**: Can be enabled/disabled via UI button

## Sample Data

The dashboard includes sample events for demonstration:

- payment.processed
- user.registered
- order.cancelled
- inventory.updated

These events are stored locally and can be cleared by clearing browser storage.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details
