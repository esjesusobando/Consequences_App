import { useEffect, useState } from 'react';
import type { SignalEvent } from './types';
import { safeSet } from './lib/storage';

// -- Signal Manager Module --
// Encapsulates Signals registry: signals state, persistence to localStorage,
// initialization from localStorage, getInitialSignals.

// Storage version constant for persistence migration support
export const SIGNAL_STORAGE_VERSION = 'sota_signals_v1';

// Migration function — upgrades old signal keys to current schema version
const migrateSignals = (saved: string): SignalEvent[] => {
  try {
    const parsed = JSON.parse(saved);
    // If no version field, it's an old save — add current version
    if (!parsed.version) {
      // Mark all existing signals as not synced since we can't verify their state
      return parsed.map((s: any) => ({
        ...s,
        syncedToGoogleCalendar: false,
        version: SIGNAL_STORAGE_VERSION,
      }));
    }
    // Current version — return as-is
    return parsed;
  } catch {
    // Corrupt data — return initial signals with current version marker
    return INITIAL_SIGNALS.map(s => ({ ...s, version: SIGNAL_STORAGE_VERSION }));
  }
};

// Use migrated signals from localStorage
const storedSignals = localStorage.getItem('zc_signals');
const storedSignalsData: SignalEvent[] = storedSignals
  ? migrateSignals(storedSignals)
  : INITIAL_SIGNALS;
// Exported hooks for the App to use.

/**
 * Initial signal data — matches the original getInitialSignals logic
 */
const INITIAL_SIGNALS: SignalEvent[] = [
  { id: 'MTG-TEST', time: '14:00', title: 'Meeting Test', description: 'Session meeting injected via integrated CLI console.', category: 'calendario_sota', iconType: 'calendar', active: true, syncedToGoogleCalendar: true },
  { id: 'MTG-ALPHA', time: '15:30', title: 'Meeting Alpha', description: 'Alpha meeting scheduled.', category: 'alpha', iconType: 'video', active: false, syncedToGoogleCalendar: false },
  { id: 'CL-BETA', time: '16:00', title: 'Meeting Beta', description: 'Beta meeting (inactive).', category: 'beta', iconType: 'phone', active: false, syncedToGoogleCalendar: false },
  { id: 'INT-OMEGA', time: '17:00', title: 'Meeting Omega', description: 'Omega meeting (inactive).', category: 'omega', iconType: 'group', active: false, syncedToGoogleCalendar: false },
];

/**
 * getInitialSignals — Returns initial signals, checking for saved data in localStorage.
 * 
 * Logic:
 *   - Try to parse signals from localStorage ('zc_signals')
 *   - If there's at least one active future meeting, use the saved data
 *   - If no future meetings, regenerate with fresh test meeting (MTG-TEST)
 *   - On corrupt data, fall back to defaults
 * 
 * @returns SignalEvent[] — the initial signals array
 */
export function getInitialSignals(): SignalEvent[] {
  try {
    const saved = localStorage.getItem('zc_signals');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Check if there's at least one active future meeting
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const hasFutureMeeting = parsed.some((s: SignalEvent) => {
        if (!s.active) return false;
        const [h, m] = s.time.split(':').map(Number);
        return h * 60 + m > currentMinutes;
      });
      // If no future meetings, regenerate with fresh test meeting
      if (!hasFutureMeeting) {
        return INITIAL_SIGNALS;
      }
      return parsed;
    }
  } catch {
    console.warn('Corrupt zc_signals in localStorage, falling back to defaults');
  }
  return INITIAL_SIGNALS;
}

/**
 * useSignals — Manages the signals registry state with localStorage persistence.
 * 
 * Handles:
 *   - Initialization from localStorage (version-aware, with future meeting check)
 *   - Persistence to localStorage on state changes
 *   - Signal injection (adding new signals)
 *   - Signal clearing
 * 
 * @returns [signals, setSignals, injectSignal, clearSignals] tuple
 */
export function useSignals() {
  const [signals, setSignals] = useState<SignalEvent[]>(storedSignalsData);

  // Persist signals to localStorage
  useEffect(() => {
    safeSet('zc_signals', signals);
  }, [signals]);

  const injectSignal = (title: string, time: string) => {
    const randomId = `MTG-${Math.floor(Math.random() * 899 + 100)}`;
    const newSig: SignalEvent = {
      id: randomId,
      time: time,
      title: title,
      description: 'Sesión de meeting inyectada mediante consola CLI integrada.',
      category: 'calendario_sota',
      iconType: 'calendar',
      active: true,
      syncedToGoogleCalendar: true
    };
    setSignals(prev => [...prev, newSig]);
  };

  const clearSignals = () => {
    setSignals(INITIAL_SIGNALS);
  };

  return [signals, setSignals, getInitialSignals, injectSignal, clearSignals] as const;
}