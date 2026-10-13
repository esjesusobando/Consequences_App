import { useEffect, useState } from 'react';
import type { MetricStats } from './types';

// -- Metrics Manager Module --
// Encapsulates Metrics state: systemActive, netProtocol, dbConnected, speedMbps,
// nodeStatus, the interval that randomizes speed.
// Exported hooks for the App to use.

/**
 * useMetrics — Manages the dynamic metrics state with simulated system data.
 * 
 * State:
 *   - systemActive: boolean — whether the system is active
 *   - netProtocol: string — communication protocol (fixed: 'SECURE_V3_SOTA')
 *   - dbConnected: boolean — database connection status (fixed: true)
 *   - speedMbps: number — randomized download speed (updates every 5s)
 *   - nodeStatus: 'OPTIMAL' | 'DEGRADED' | 'WARNING' — current node status
 * 
 * Effects:
 *   - Sets up interval to randomly update speedMbps every 5 seconds
 *   - Provides state update functions
 * 
 * @returns [metrics, setMetrics, injectSignal, clearSignals] — but for metrics it's [metrics, setMetrics]
 */
export function useMetrics() {
  const [metrics, setMetrics] = useState<MetricStats>({
    systemActive: true,
    netProtocol: 'SECURE_V3_SOTA',
    dbConnected: true,
    speedMbps: 99.4,
    nodeStatus: 'OPTIMAL',
  });

  // Dynamic Metrics Simulation — randomized speed every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics((prev) => ({
        ...prev,
        speedMbps: parseFloat((96 + Math.random() * 4).toFixed(1))
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const updateMetrics = (partial: Partial<MetricStats>) => {
    setMetrics(prev => ({ ...prev, ...partial }));
  };

  return [metrics, setMetrics, updateMetrics] as const;
}