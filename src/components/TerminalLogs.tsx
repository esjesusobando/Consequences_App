import React, { useState, useRef, useEffect } from 'react';
import { TerminalLine, AccentColor } from '../types';
import { Terminal as TermIcon, Shield, Database, Wifi, Cpu, X } from 'lucide-react';

interface TerminalLogsProps {
  logLines: TerminalLine[];
  setLogLines: React.Dispatch<React.SetStateAction<TerminalLine[]>>;
  accent: AccentColor;
  onAccentChange: (accent: AccentColor) => void;
  speedMbps: number;
  dbConnected: boolean;
  onClearLogs: () => void;
  onLogMessage: (type: 'info' | 'ok' | 'warn' | 'err', text: string) => void;
  onInjectSignalFromCmd: (title: string, time: string) => void;
  onExit: () => void;
}

export default function TerminalLogs({
  logLines,
  setLogLines,
  accent,
  onAccentChange,
  speedMbps,
  dbConnected,
  onClearLogs,
  onLogMessage,
  onInjectSignalFromCmd,
  onExit,
}: TerminalLogsProps) {
  const [cmdInput, setCmdInput] = useState<string>('');
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Escape to exit terminal
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onExit();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onExit]);

  // Auto scroll output
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logLines]);

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCmd = cmdInput.trim();
    if (!cleanCmd) return;

    // Echo prompt back
    setLogLines(prev => [...prev, { type: 'prompt', text: cleanCmd, timestamp: new Date().toLocaleTimeString() }]);
    setCmdInput('');

    // Parse command
    const parts = cleanCmd.split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (command) {
      case 'help':
        onLogMessage('info', 'Command options: help, clear, status, accent [cyan|magenta|lime|amber], signal.scan, signal.inject [title] [time]');
        break;
      
      case 'clear':
        onClearLogs();
        break;

      case 'status':
        onLogMessage('ok', `SYSTEM LOG STATUS: ONLINE // BANDWIDTH: ${speedMbps} MBPS // DATABASE: ${dbConnected ? 'CONNECTED' : 'DISCONNECTED'} // CORE: ${accent.toUpperCase()}`);
        break;

      case 'accent':
        const targetColor = args[0]?.toLowerCase() as AccentColor;
        if (['cyan', 'magenta', 'lime', 'amber'].includes(targetColor)) {
          onAccentChange(targetColor);
          onLogMessage('ok', `System Color Engine modified to ${targetColor.toUpperCase()}`);
        } else {
          onLogMessage('err', 'Invalid accent. Choose one: cyan, magenta, lime, amber');
        }
        break;

      case 'signal.scan':
        onLogMessage('info', 'Scanning frequency grids... All system channels are optimal.');
        break;

      case 'signal.inject':
        if (args.length < 2) {
          onLogMessage('err', "Invalid syntax. Usage: signal.inject [title_slug] [HH:MM] (Example: signal.inject alpha-review 15:45)");
        } else {
          const title = args[0].replace(/-/g, ' ');
          const time = args[1];
          onInjectSignalFromCmd(title, time);
        }
        break;

      case 'system.boot':
        onLogMessage('info', 'Reloading system OS payload...');
        setLogLines(prev => [
          ...prev,
          { type: 'info', text: 'Initializing and synchronizing with Google Antigravity servers...', timestamp: new Date().toLocaleTimeString() },
          { type: 'ok', text: 'Telemetry linked. CONSEQUENCES V1.0 up and running successfully.', timestamp: new Date().toLocaleTimeString() }
        ]);
        break;

      default:
        onLogMessage('err', `System directive unrecognized: "${command}". Type "help" for a list of valid protocols.`);
        break;
    }
  };

  const getLogColorClass = (type: string) => {
    switch (type) {
      case 'ok': return 'text-signal-lime';
      case 'info': return 'text-signal-cyan';
      case 'warn': return 'text-signal-amber';
      case 'err': return 'text-signal-magenta';
      default: return 'text-[#C7CCD8]';
    }
  };

  const getAccentTextClass = () => {
    switch (accent) {
      case 'magenta': return 'text-signal-magenta';
      case 'lime': return 'text-signal-lime';
      case 'amber': return 'text-signal-amber';
      default: return 'text-signal-cyan';
    }
  };

  const getAccentBgClass = () => {
    switch (accent) {
      case 'magenta': return 'bg-signal-magenta text-void shadow-[0_0_8px_rgba(255,46,154,0.3)]';
      case 'lime': return 'bg-signal-lime text-void shadow-[0_0_8px_rgba(189,245,50,0.3)]';
      case 'amber': return 'bg-signal-amber text-void shadow-[0_0_8px_rgba(255,180,0,0.3)]';
      default: return 'bg-signal-cyan text-void shadow-[0_0_8px_rgba(0,240,255,0.3)]';
    }
  };

  return (
    <div className="flex-1 p-6 md:p-8 flex flex-col gap-6 max-w-4xl mx-auto select-none h-[calc(100vh-140px)] overflow-hidden">
      
      {/* HUD metrics dashboard sub header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-shrink-0">
        <div className="bg-carbon/20 border border-graphite/40 rounded-lg p-3.5 flex items-center gap-3">
          <Shield className="w-5 h-5 text-signal-cyan" />
          <div>
            <div className="text-[10px] font-mono text-slate uppercase">NET SECURE</div>
            <div className="font-display font-bold text-xs text-bone">PROTOCOL V3</div>
          </div>
        </div>

        <div className="bg-carbon/20 border border-graphite/40 rounded-lg p-3.5 flex items-center gap-3">
          <Database className="w-5 h-5 text-signal-lime" />
          <div>
            <div className="text-[10px] font-mono text-slate uppercase">DATABASE</div>
            <div className="font-display font-bold text-xs text-bone">{dbConnected ? 'CONNECTED' : 'STANDBY'}</div>
          </div>
        </div>

        <div className="bg-carbon/20 border border-graphite/40 rounded-lg p-3.5 flex items-center gap-3">
          <Wifi className="w-5 h-5 text-signal-amber" />
          <div>
            <div className="text-[10px] font-mono text-slate uppercase">BANDWIDTH</div>
            <div className="font-display font-bold text-xs text-bone">{speedMbps} MBPS</div>
          </div>
        </div>

        <div className="bg-carbon/20 border border-graphite/40 rounded-lg p-3.5 flex items-center gap-3">
          <Cpu className={`w-5 h-5 ${getAccentTextClass()}`} />
          <div>
            <div className="text-[10px] font-mono text-slate uppercase">COLOR GRID</div>
            <div className="font-display font-bold text-xs text-bone">{accent.toUpperCase()} ACCENT</div>
          </div>
        </div>
      </div>

      {/* Terminal Display Block */}
      <div className="flex-1 bg-[#04060A]/90 border border-graphite/45 rounded-xl overflow-hidden flex flex-col glow-cyan">
        
        {/* Terminal Header */}
        <div className="bg-carbon border-b border-graphite/40 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate">
            <TermIcon className="w-3.5 h-3.5 mr-1" />
            CONSEQUENCES Core terminal HUD // active shell
          </div>
          <button 
            onClick={onClearLogs}
            className="text-[9px] font-mono text-slate hover:text-signal-magenta px-2 py-0.5 bg-void border border-graphite/30 hover:border-signal-magenta/40 rounded cursor-pointer transition-colors"
          >
            Clear Shell
          </button>
        </div>

        {/* Live Command Logs lines container */}
        <div 
          ref={containerRef}
          className="flex-1 p-4 font-mono text-xs overflow-y-auto space-y-2 custom-scrollbar text-bone"
        >
          {logLines.map((line, idx) => (
            <div key={idx} className="flex items-start gap-2.5">
              <span className="text-slate select-none text-[10px] min-w-[54px]">{line.timestamp || '00:00:00'}</span>
              
              {line.type === 'prompt' ? (
                <div className="flex gap-2">
                  <span className="text-slate select-none">▸</span>
                  <span className="text-bone font-semibold">{line.text}</span>
                </div>
              ) : (
                <span className={getLogColorClass(line.type)}>
                  {line.type === 'err' ? '✗ ' : line.type === 'ok' ? '✓ ' : '  '} 
                  {line.text}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Command shell Input Prompt Form */}
        <form 
          onSubmit={handleCommandSubmit}
          className="bg-carbon/40 border-t border-graphite/40 p-2.5 flex items-center gap-3"
        >
          <span className={`font-mono text-xs font-bold pl-1.5 ${getAccentTextClass()}`}>
            ▸
          </span>
          <input 
            type="text"
            value={cmdInput}
            onChange={(e) => setCmdInput(e.target.value)}
            placeholder='Type command directives (e.g., "help", "accent magenta", "status")'
            className="flex-1 bg-transparent text-bone font-mono text-xs outline-none focus:ring-0 placeholder:text-slate"
          />
          <button 
            type="submit"
            className={`font-mono text-[10px] uppercase font-bold py-1 px-3.5 rounded transition-all active:scale-95 ${getAccentBgClass()}`}
          >
            Execute
          </button>
        </form>
      </div>

    </div>
  );
}
