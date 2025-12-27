
export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'AGENT';

export interface TelemetryLog {
  id: string;
  timestamp: number;
  level: LogLevel;
  message: string;
  data?: any;
}

export interface TelemetryContextType {
  logs: TelemetryLog[];
  log: (level: LogLevel, message: string, data?: any) => void;
  clearLogs: () => void;
  isConsoleOpen: boolean;
  setIsConsoleOpen: (open: boolean) => void;
}
