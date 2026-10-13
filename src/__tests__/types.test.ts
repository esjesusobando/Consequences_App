import { describe, it, expect } from 'vitest';
import type { SignalEvent, TerminalLine, MetricStats } from '../types';

describe('types (structural validation)', () => {
  describe('SignalEvent', () => {
    it('accepts a minimal valid object', () => {
      const event: SignalEvent = {
        id: 'MTG-001',
        time: '14:00',
        title: 'Test Meeting',
        description: 'A test meeting',
        category: 'alpha',
        iconType: 'video',
        active: true,
        syncedToGoogleCalendar: false,
      };
      expect(event.id).toBe('MTG-001');
      expect(event.title).toBe('Test Meeting');
      expect(event.active).toBe(true);
      expect(event.syncedToGoogleCalendar).toBe(false);
    });

    it('accepts an object with all optional fields', () => {
      const event: SignalEvent = {
        id: 'MTG-002',
        time: '15:30',
        title: 'Full Event',
        description: 'With all fields',
        category: 'beta',
        iconType: 'phone',
        active: true,
        syncedToGoogleCalendar: true,
        googleEventId: 'evt_123',
        sessionUrl: 'https://meet.google.com/abc-def-ghi',
        date: '2026-07-05',
      };
      expect(event.active).toBe(true);
      expect(event.syncedToGoogleCalendar).toBe(true);
      expect(event.sessionUrl).toContain('meet.google.com');
    });

    it('accepts custom category and iconType strings beyond the union', () => {
      // The types allow arbitrary strings via `| string` — this is intentional
      const event: SignalEvent = {
        id: 'MTG-003',
        time: '16:00',
        title: 'Custom',
        description: 'Custom category test',
        category: 'custom_value',
        iconType: 'custom_icon',
      };
      expect(event.category).toBe('custom_value');
      expect(event.iconType).toBe('custom_icon');
    });

    it('id, time, title, description are required string fields', () => {
      const event: SignalEvent = {
        id: 'MTG-004',
        time: '17:00',
        title: 'Required Check',
        description: 'Testing required fields',
        category: 'omega',
        iconType: 'group',
      };
      expect(typeof event.id).toBe('string');
      expect(typeof event.time).toBe('string');
      expect(typeof event.title).toBe('string');
      expect(typeof event.description).toBe('string');
    });
  });

  describe('TerminalLine', () => {
    it('accepts a minimal valid object', () => {
      const line: TerminalLine = {
        type: 'info',
        text: 'System initialized',
      };
      expect(line.type).toBe('info');
    });

    it('accepts all type variants', () => {
      const types: TerminalLine['type'][] = ['prompt', 'info', 'ok', 'warn', 'err'];
      for (const t of types) {
        const line: TerminalLine = { type: t, text: `Test ${t}` };
        expect(line.type).toBe(t);
      }
    });

    it('accepts optional command and timestamp fields', () => {
      const line: TerminalLine = {
        type: 'prompt',
        text: 'ls -la',
        command: 'ls -la',
        timestamp: '14:49:01',
      };
      expect(line.command).toBe('ls -la');
      expect(line.timestamp).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    });
  });

  describe('MetricStats', () => {
    it('accepts a valid OPTIMAL status object', () => {
      const stats: MetricStats = {
        systemActive: true,
        netProtocol: 'TCP',
        dbConnected: true,
        speedMbps: 1000,
        nodeStatus: 'OPTIMAL',
      };
      expect(stats.systemActive).toBe(true);
      expect(stats.nodeStatus).toBe('OPTIMAL');
    });

    it('accepts all nodeStatus variants', () => {
      const statuses: MetricStats['nodeStatus'][] = ['OPTIMAL', 'DEGRADED', 'WARNING'];
      for (const status of statuses) {
        const stats: MetricStats = {
          systemActive: true,
          netProtocol: 'HTTPS',
          dbConnected: true,
          speedMbps: 500,
          nodeStatus: status,
        };
        expect(stats.nodeStatus).toBe(status);
      }
    });

    it('speedMbps is a number', () => {
      const stats: MetricStats = {
        systemActive: false,
        netProtocol: 'HTTP',
        dbConnected: false,
        speedMbps: 0,
        nodeStatus: 'WARNING',
      };
      expect(typeof stats.speedMbps).toBe('number');
    });
  });
});
