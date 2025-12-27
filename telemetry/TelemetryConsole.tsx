
import React, { useState, useEffect } from 'react';
import { useTelemetry } from './TelemetryProvider';
import { X, Trash2, Terminal, Filter, Bug, Cpu, ShieldCheck } from 'lucide-react';
import { LogLevel } from './types';

const TelemetryConsole: React.FC = () => {
  const { logs, clearLogs, isConsoleOpen, setIsConsoleOpen } = useTelemetry();
  const [filter, setFilter] = useState<LogLevel | 'ALL'>('ALL');
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    // Definitive environment check
    const isLocalDev = 
      window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1' ||
      (window.location.hostname === 'localhost' && window.location.port === '3000');
    
    setShouldRender(isLocalDev);
    
    // Auto-close if somehow open in production
    if (!isLocalDev && isConsoleOpen) {
      setIsConsoleOpen(false);
    }
  }, [isConsoleOpen, setIsConsoleOpen]);

  if (!isConsoleOpen || !shouldRender) return null;

  const filteredLogs = logs.filter(l => filter === 'ALL' || l.level === filter);

  const getLevelColor = (level: LogLevel) => {
    switch (level) {
      case 'ERROR': return 'text-red-400';
      case 'WARN': return 'text-yellow-400';
      case 'AGENT': return 'text-cyan-400';
      case 'DEBUG': return 'text-slate-500';
      default: return 'text-emerald-400';
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-slate-950/95 backdrop-blur-md animate-in fade-in slide-in-from-bottom-10 duration-300 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-emerald-400" />
          <h2 className="text-sm font-black text-white uppercase tracking-tighter">HIC Telemetry Console</h2>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-[9px] text-emerald-500 font-bold border border-emerald-500/20">
            <ShieldCheck className="w-3 h-3" /> LOCAL_DEV_ONLY
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={clearLogs} title="Clear Logs" className="p-2 text-slate-500 hover:text-red-400 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
          <button onClick={() => setIsConsoleOpen(false)} title="Close Console" className="p-2 text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 p-3 border-b border-slate-800 overflow-x-auto bg-slate-950">
        <Filter className="w-3 h-3 text-slate-500 shrink-0" />
        {(['ALL', 'INFO', 'AGENT', 'WARN', 'ERROR', 'DEBUG'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded text-[9px] font-bold uppercase whitespace-nowrap border transition-all ${
              filter === f ? 'bg-emerald-500 border-emerald-500 text-slate-950 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-slate-900 border-slate-700 text-slate-500'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Logs Feed */}
      <div className="flex-1 overflow-y-auto p-2 text-[11px] selection:bg-emerald-500 selection:text-slate-950">
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-700 italic text-center">
            <Bug className="w-8 h-8 mb-2 opacity-20" />
            Terminal Idle<br/>
            <span className="text-[9px] mt-1 not-italic opacity-50">Capture limited to localhost:3000</span>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredLogs.map(log => (
              <div key={log.id} className="p-2 border-b border-slate-900 hover:bg-slate-900/40 rounded transition-colors group">
                <div className="flex gap-2 items-start">
                  <span className="text-slate-600 whitespace-nowrap opacity-50">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                  <span className={`font-bold shrink-0 min-w-[50px] ${getLevelColor(log.level)}`}>[{log.level}]</span>
                  <span className="text-slate-300 break-words flex-1 leading-relaxed">{log.message}</span>
                </div>
                {log.data && (
                  <pre className="mt-2 p-3 bg-black/60 rounded border border-slate-800 text-[10px] text-slate-400 overflow-x-auto shadow-inner">
                    {JSON.stringify(log.data, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="p-2 border-t border-slate-800 bg-slate-900 flex justify-between items-center text-[9px] text-slate-500 uppercase font-bold tracking-widest">
        <div className="flex gap-4">
          <span className="flex items-center gap-1"><Cpu className="w-3 h-3" /> Target: {window.location.hostname}</span>
          <span className="flex items-center gap-1 text-emerald-500/70"><Terminal className="w-3 h-3" /> Console: Ready</span>
        </div>
        <div className="opacity-50">
          Trace: {logs.length}/200
        </div>
      </div>
    </div>
  );
};

export default TelemetryConsole;
