import { useState } from 'react';
import {
  INITIAL_PROJECTS,
  INITIAL_ISSUES,
  INITIAL_PRODUCTS,
  INITIAL_PURCHASE_ORDERS,
  INITIAL_AUDITS,
} from './personalOsData';
import { getInitialSignals } from './signalManager';

// -- System Manager Module --
// Encapsulates System reset: handleSystemReset, onClearLogs.
// Exported functions for the App to use.

/**
 * handleSystemReset — Triggers simulated system reboot/clean OS sequence.
 * 
 * Effects:
 *   - Clears logs via onClearLogs
 *   - Logs system reset warning
 *   - Logs Personal OS panel parameter establishment
 *   - Resets signals registry back to default values (with fresh future time)
 *   - Resets accent to 'cyan'
 *   - Resets projects, issues, products, purchase orders, audits to initial values
 *   - Sets active tab to 'personal_os'
 *   - Shows success message after timeout
 * 
 * @param setSignals — Signals state setter
 * @param setProjects — Projects state setter
 * @param setIssues — Issues state setter
 * @param setProducts — Products state setter
 * @param setPurchaseOrders — Purchase orders state setter
 * @param setAudits — Audits state setter
 * @param setActiveTab — Active tab setter
 * @param setAccent — Accent state setter
 */
export function handleSystemReset(
  setSignals: any,
  setProjects: any,
  setIssues: any,
  setProducts: any,
  setPurchaseOrders: any,
  setAudits: any,
  setActiveTab: any,
  setAccent: any,
  onLogMessage: any
) {
  onClearLogs();
  onLogMessage('warn', 'REINICIO DEL SISTEMA: Vaciando caché local...');
  onLogMessage('info', 'Estableciendo parámetros del panel Personal OS...');

  // Reset signals registry back to default values (with fresh future time)
  setSignals(getInitialSignals());
  setAccent('cyan');
  setProjects(INITIAL_PROJECTS as any);
  setIssues(INITIAL_ISSUES as any);
  setProducts(INITIAL_PRODUCTS as any);
  setPurchaseOrders(INITIAL_PURCHASE_ORDERS as any);
  setAudits(INITIAL_AUDITS as any);
  setActiveTab('personal_os');

  setTimeout(() => {
    onLogMessage('ok', 'Parámetros del sistema recuperados con éxito. 100% SOTA Parity.');
  }, 1200);
};

/**
 * onClearLogs — Clears all log lines.
 * 
 * @param setLogLines — Log lines state setter
 */
export function onClearLogs(setLogLines?: any) {
  setLogLines?.([]);
}

/**
 * getInitialSignals — Re-exported from signalManager for system reset use.
 * 
 * @returns SignalEvent[] — the initial signals array
 */
export { getInitialSignals };