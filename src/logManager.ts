import { useState } from 'react';

// -- Log Manager Module --
// Encapsulates Log lines management: logMessage, addAudit, onClearLogs, logLines state.
// Exported hooks and functions for the App to use.

/**
 * Terminal line interface
 */
export type TerminalLine = {
  type: 'prompt' | 'info' | 'ok' | 'warn' | 'err';
  text: string;
  timestamp: string;
};

/**
 * Initial log lines — matches the original INITIAL_LOG_LINES
 */
const INITIAL_LOG_LINES: TerminalLine[] = [
  { type: 'prompt', text: 'system.boot', timestamp: new Date().toTimeString().split(' ')[0] },
  { type: 'info', text: 'Personal OS initialized', timestamp: new Date().toTimeString().split(' ')[0] },
  { type: 'ok', text: 'Ready for operation', timestamp: new Date().toTimeString().split(' ')[0] },
  { type: 'warn', text: 'Deprecated feature detected', timestamp: new Date().toTimeString().split(' ')[0] },
  { type: 'err', text: 'Simulated error for testing', timestamp: new Date().toTimeString().split(' ')[0] },
  { type: 'info', text: 'Configuration loaded', timestamp: new Date().toTimeString().split(' ')[0] },
  { type: 'ok', text: 'All systems nominal', timestamp: new Date().toTimeString().split(' ')[0] },
];

/**
 * useLogs — Manages the log lines state with logging functions.
 * 
 * State:
 *   - logLines: TerminalLine[] — the array of log lines
 * 
 * Functions:
 *   - logMessage: Write a dynamic string directly to the log lines list
 *   - addAudit: Dedicated Audit Logger helper
 *   - onClearLogs: Clear all log lines
 * 
 * @returns [logLines, logMessage, addAudit, onClearLogs] tuple
 */
export function useLogs() {
  const [logLines, setLogLines] = useState<TerminalLine[]>(INITIAL_LOG_LINES);

  // Helper utility to write a dynamic string directly to the log lines list
  const logMessage = (type: 'info' | 'ok' | 'warn' | 'err', text: string) => {
    const timestamp = new Date().toTimeString().split(' ')[0];
    setLogLines((prev) => [
      ...prev,
      { type, text, timestamp }
    ]);
  };

  // Dedicated Audit Logger helper
  const addAudit = (module: string, action: string, detail: string) => {
    const timestamp = new Date().toTimeString().split(' ')[0];
    const newAudit = {
      id: `AUD-${Math.floor(Math.random() * 899 + 100)}`,
      timestamp,
      module: module.toUpperCase(),
      action: action.toUpperCase(),
      user: 'ia.strongmagazine@gmail.com',
      detail
    };
    // Note: setAudits not available in this module — App handles audits separately
    logMessage('ok', `[REGISTRO AUDITORÍA] ${module} :: ${action} — ${detail}`);
  };

  // Triggering simulated system reboot/clean OS sequence
  const onClearLogs = () => {
    setLogLines([]);
  };

  return [logLines, logMessage, addAudit, onClearLogs] as const;
}