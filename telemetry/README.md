
# FCI Telemetry Console (Localhost Only)

The **Food Chemistry Intelligence Telemetry Console** is a specialized debugging tool for monitoring multi-agent orchestration and API performance.

## ⚠️ Restricted Access
By design, this console and its associated logging logic are **only functional** when the application is running on:
`http://localhost:3000`

## How to Open
1. Ensure you are running the app locally.
2. Rapidly tap/click the **FCI Logo** in the top-left header **3 times**.
3. The terminal overlay will slide up from the bottom.

## Logging for Developers
To add custom logs anywhere in the application:

```typescript
import { useTelemetry } from './telemetry/TelemetryProvider';

const { log } = useTelemetry();

// Standard Log
log('INFO', 'User initiated scan');

// Detailed Error with Data
log('ERROR', 'OCR Agent Failed', { error: err.message, retry: true });

// Agent Tracking
log('AGENT', 'Visual Cortex processing started');
```

## Log Levels
- `INFO`: General app flow.
- `WARN`: Recoverable issues or slow responses.
- `ERROR`: Critical failures (API 4xx/5xx).
- `DEBUG`: Verbose technical data.
- `AGENT`: Specific logic from the Multi-Agent Orchestration layer.
