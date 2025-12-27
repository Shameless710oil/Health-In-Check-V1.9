
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { TelemetryLog, LogLevel, TelemetryContextType } from './types';

const TelemetryContext = createContext<TelemetryContextType | undefined>(undefined);

export const TelemetryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [logs, setLogs] = useState<TelemetryLog[]>([]);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);

  const log = useCallback((level: LogLevel, message: string, data?: any) => {
    const newLog: TelemetryLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      level,
      message,
      data
    };

    setLogs(prev => {
      const updated = [newLog, ...prev];
      return updated.slice(0, 200); // Keep last 200 logs
    });

    // Mirror to standard console
    const color = level === 'ERROR' ? 'red' : level === 'WARN' ? 'orange' : level === 'AGENT' ? 'cyan' : 'gray';
    console.log(`%c[${level}] %c${message}`, `color: ${color}; font-weight: bold;`, 'color: inherit;', data || '');
  }, []);

  const clearLogs = useCallback(() => setLogs([]), []);

  return (
    <TelemetryContext.Provider value={{ logs, log, clearLogs, isConsoleOpen, setIsConsoleOpen }}>
      {children}
    </TelemetryContext.Provider>
  );
};

export const useTelemetry = () => {
  const context = useContext(TelemetryContext);
  if (!context) throw new Error('useTelemetry must be used within TelemetryProvider');
  return context;
};
