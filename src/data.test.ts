import { describe, it, expect } from 'vitest';
import {
  getInitialSignals,
  INITIAL_LOG_LINES,
  COLOR_SWATCHES,
  SIGNAL_PALETTE,
} from './data';

describe('data', () => {
  describe('getInitialSignals()', () => {
    it('returns 4 signals', () => {
      const signals = getInitialSignals();
      expect(signals).toHaveLength(4);
    });

    it('each signal has the correct shape', () => {
      const signals = getInitialSignals();
      for (const signal of signals) {
        expect(signal).toHaveProperty('id');
        expect(signal).toHaveProperty('time');
        expect(signal).toHaveProperty('title');
        expect(signal).toHaveProperty('description');
        expect(signal).toHaveProperty('category');
        expect(signal).toHaveProperty('iconType');
        expect(signal).toHaveProperty('active');
      }
    });

    it('first signal is MTG-TEST and active', () => {
      const signals = getInitialSignals();
      expect(signals[0].id).toBe('MTG-TEST');
      expect(signals[0].active).toBe(true);
    });

    it('first signal has a dynamic testTime (future time)', () => {
      const signals = getInitialSignals();
      expect(signals[0].time).toMatch(/^\d{2}:\d{2}$/);
    });

    it('returns MTG-ALPHA as second signal with category alpha', () => {
      const signals = getInitialSignals();
      expect(signals[1].id).toBe('MTG-ALPHA');
      expect(signals[1].category).toBe('alpha');
    });

    it('returns CL-BETA as third signal (inactive)', () => {
      const signals = getInitialSignals();
      expect(signals[2].id).toBe('CL-BETA');
      expect(signals[2].active).toBe(false);
    });

    it('returns INT-OMEGA as fourth signal (inactive)', () => {
      const signals = getInitialSignals();
      expect(signals[3].id).toBe('INT-OMEGA');
      expect(signals[3].active).toBe(false);
    });

    it('every signal has a non-empty title', () => {
      const signals = getInitialSignals();
      for (const signal of signals) {
        expect(signal.title).toBeTruthy();
        expect(signal.title.length).toBeGreaterThan(0);
      }
    });

    it('every signal has a non-empty description', () => {
      const signals = getInitialSignals();
      for (const signal of signals) {
        expect(signal.description).toBeTruthy();
        expect(signal.description.length).toBeGreaterThan(0);
      }
    });
  });

  describe('INITIAL_LOG_LINES', () => {
    it('has 7 entries', () => {
      expect(INITIAL_LOG_LINES).toHaveLength(7);
    });

    it('each entry has correct shape', () => {
      for (const line of INITIAL_LOG_LINES) {
        expect(line).toHaveProperty('type');
        expect(line).toHaveProperty('text');
        expect(line).toHaveProperty('timestamp');
      }
    });

    it('first line is a prompt type', () => {
      expect(INITIAL_LOG_LINES[0].type).toBe('prompt');
      expect(INITIAL_LOG_LINES[0].text).toContain('system.boot');
    });

    it('contains valid type values', () => {
      const validTypes = ['prompt', 'info', 'ok', 'warn', 'err'];
      for (const line of INITIAL_LOG_LINES) {
        expect(validTypes).toContain(line.type);
      }
    });

    it('each line has a non-empty text', () => {
      for (const line of INITIAL_LOG_LINES) {
        expect(line.text.length).toBeGreaterThan(0);
      }
    });

    it('each line has a timestamp matching HH:MM:SS', () => {
      for (const line of INITIAL_LOG_LINES) {
        expect(line.timestamp).toMatch(/^\d{2}:\d{2}:\d{2}$/);
      }
    });
  });

  describe('COLOR_SWATCHES', () => {
    it('has 10 entries', () => {
      expect(COLOR_SWATCHES).toHaveLength(10);
    });

    it('each swatch has correct shape', () => {
      for (const swatch of COLOR_SWATCHES) {
        expect(swatch).toHaveProperty('name');
        expect(swatch).toHaveProperty('hex');
        expect(swatch).toHaveProperty('token');
        expect(swatch).toHaveProperty('desc');
      }
    });

    it('first swatch is Void with hex #04060A', () => {
      expect(COLOR_SWATCHES[0].name).toBe('Void');
      expect(COLOR_SWATCHES[0].hex).toBe('#04060A');
    });

    it('last swatch is Pure with hex #FFFFFF', () => {
      expect(COLOR_SWATCHES[COLOR_SWATCHES.length - 1].name).toBe('Pure');
      expect(COLOR_SWATCHES[COLOR_SWATCHES.length - 1].hex).toBe('#FFFFFF');
    });

    it('every hex starts with #', () => {
      for (const swatch of COLOR_SWATCHES) {
        expect(swatch.hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }
    });

    it('every token starts with "color-"', () => {
      for (const swatch of COLOR_SWATCHES) {
        expect(swatch.token).toMatch(/^color-/);
      }
    });
  });

  describe('SIGNAL_PALETTE', () => {
    it('has 4 entries', () => {
      expect(SIGNAL_PALETTE).toHaveLength(4);
    });

    it('each entry has correct shape', () => {
      for (const color of SIGNAL_PALETTE) {
        expect(color).toHaveProperty('name');
        expect(color).toHaveProperty('hex');
        expect(color).toHaveProperty('token');
        expect(color).toHaveProperty('desc');
      }
    });

    it('contains Signal Cyan as first entry', () => {
      expect(SIGNAL_PALETTE[0].name).toBe('Signal Cyan');
      expect(SIGNAL_PALETTE[0].hex).toBe('#00F0FF');
    });

    it('contains Signal Amber as last entry', () => {
      expect(SIGNAL_PALETTE[SIGNAL_PALETTE.length - 1].name).toBe('Signal Amber');
      expect(SIGNAL_PALETTE[SIGNAL_PALETTE.length - 1].hex).toBe('#FFB400');
    });

    it('every hex starts with #', () => {
      for (const color of SIGNAL_PALETTE) {
        expect(color.hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }
    });
  });
});
