
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { TelemetryProvider } from './telemetry/TelemetryProvider';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <TelemetryProvider>
      <App />
    </TelemetryProvider>
  </React.StrictMode>
);
