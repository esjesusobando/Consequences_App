import { useEffect } from 'react';
import { PresentationConfig, AccentColor, ThemeMode } from './types';

// -- Theme Manager Module --
// Encapsulates ALL theming logic: data-theme attribute, 5 theme modes,
// accent handling (including custom HSL), root style property setting.
// Consumed by App via useTheme hook.

// Storage version constant for persistence migration support
export const STORAGE_VERSION = 'sota_storage_v1';

// Migration function — upgrades old storage keys to current schema version
const migratePresentationConfig = (saved: string): PresentationConfig => {
  try {
    const parsed = JSON.parse(saved);
    // If no version field, it's an old save — add current version and defaults
    if (!parsed.version) {
      return {
        ...parsed,
        version: STORAGE_VERSION,
        backgroundImage: parsed.backgroundImage || 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?auto=format&fit=crop&w=1200&q=80',
        backdropBlur: parsed.backdropBlur ?? 10,
        overlayOpacity: parsed.overlayOpacity ?? 0.15,
        bgPositionX: parsed.bgPositionX ?? 50,
        bgPositionY: parsed.bgPositionY ?? 50,
        accentPreference: parsed.accentPreference ?? 'cyan',
        audioLoop: parsed.audioLoop ?? 'synth-pad',
        volume: parsed.volume ?? 25,
        isPlayingSound: parsed.isPlayingSound ?? false,
        customH: parsed.customH ?? 28,
        customS: parsed.customS ?? 45,
        customL: parsed.customL ?? 65,
        panelsSwapped: parsed.panelsSwapped ?? false,
        sidebarWidth: parsed.sidebarWidth ?? 384,
        themeMode: parsed.themeMode ?? 'dark',
      };
    }
    // Current version — return as-is (with fallback for missing fields)
    return {
      ...parsed,
      backgroundImage: parsed.backgroundImage || 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?auto=format&fit=crop&w=1200&q=80',
      backdropBlur: parsed.backdropBlur ?? 10,
      overlayOpacity: parsed.overlayOpacity ?? 0.15,
      bgPositionX: parsed.bgPositionX ?? 50,
      bgPositionY: parsed.bgPositionY ?? 50,
      accentPreference: parsed.accentPreference ?? 'cyan',
      audioLoop: parsed.audioLoop ?? 'synth-pad',
      volume: parsed.volume ?? 25,
      isPlayingSound: parsed.isPlayingSound ?? false,
      customH: parsed.customH ?? 28,
      customS: parsed.customS ?? 45,
      customL: parsed.customL ?? 65,
      panelsSwapped: parsed.panelsSwapped ?? false,
      sidebarWidth: parsed.sidebarWidth ?? 384,
      themeMode: parsed.themeMode ?? 'dark',
    };
  } catch {
    // Corrupt data — return full defaults with current version
    return {
      version: STORAGE_VERSION,
      backgroundImage: 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?auto=format&fit=crop&w=1200&q=80',
      backdropBlur: 10,
      overlayOpacity: 0.15,
      bgPositionX: 50,
      bgPositionY: 50,
      accentPreference: 'cyan',
      audioLoop: 'synth-pad',
      volume: 25,
      isPlayingSound: false,
      customH: 28,
      customS: 45,
      customL: 65,
      panelsSwapped: false,
      sidebarWidth: 384,
      themeMode: 'dark',
    };
  }
};

// Use migrated presentation config from localStorage
const storedConfig = localStorage.getItem('sota_presentation_config');
const presentationConfig: PresentationConfig = storedConfig
  ? migratePresentationConfig(storedConfig)
  : {
    version: STORAGE_VERSION,
    backgroundImage: 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?auto=format&fit=crop&w=1200&q=80',
    backdropBlur: 10,
    overlayOpacity: 0.15,
    bgPositionX: 50,
    bgPositionY: 50,
    accentPreference: 'cyan',
    audioLoop: 'synth-pad',
    volume: 25,
    isPlayingSound: false,
    customH: 28,
    customS: 45,
    customL: 65,
    panelsSwapped: false,
    sidebarWidth: 384,
    themeMode: 'dark',
  };

/**
 * useTheme — Sets up the theming system as a side-effect hook.
 * 
 * The hook watches `accent` and `presentationConfig` changes and applies
 * the appropriate root CSS custom properties and data-theme attribute.
 * 
 * @param presentationConfig — Global presentation config (themeMode, customH/S/L, accentPreference, etc.)
 * @param accent — Current active accent color (read-only, managed by the parent component)
 * 
 * Effects:
 *   - Sets data-theme attribute on document.documentElement
 *   - Applies root CSS custom properties for the active theme mode
 *   - Handles accent colors (standard + custom HSL)
 *   - watches presentationConfig changes and re-applies styles
 * 
 * Returns: nothing (effects run as side-effects)
 */
export function useTheme(
  presentationConfig: PresentationConfig,
  accent: AccentColor
) {
  useEffect(() => {
    const root = document.documentElement;
    const theme = presentationConfig.themeMode ?? 'dark';

    // Set data-theme attribute for CSS-based overrides (editorial modes, etc.)
    root.setAttribute('data-theme', theme);

    // ---- First, restore standard variables (default dark theme) ----
    const standardColors: Record<string, string> = {
      '--color-void': '#04060A',
      '--color-night': '#0B0F18',
      '--color-carbon': '#131826',
      '--color-graphite': '#1E2435',
      '--color-steel': '#2A3148',
      '--color-slate': '#4A5273',
      '--color-ash': '#7A839E',
      '--color-bone': '#C7CCD8',
      '--color-signal-cyan': '#00F0FF',
      '--color-signal-magenta': '#FF2E9A',
      '--color-signal-lime': '#C6FF3D',
      '--color-signal-amber': '#FFB400',
      '--color-on-surface': '#ECEEF5',
      '--color-on-primary': '#04060A',
      '--color-paper': '#131826',
    };

    Object.entries(standardColors).forEach(([key, val]) => {
      root.style.setProperty(key, val);
    });

    // ---- CRAFT MODE (Zero_Consequences light/zinc aesthetic) ----
    if (theme === 'craft') {
      const craftColors: Record<string, string> = {
        '--color-void': '#F4F5F8',
        '--color-night': '#FFFFFF',
        '--color-carbon': '#FAFBFC',
        '--color-graphite': '#E2E5EB',
        '--color-steel': '#D1D5DB',
        '--color-slate': '#6B7280',
        '--color-ash': '#4B5563',
        '--color-bone': '#1F2937',
        '--color-signal-cyan': '#0066FF',
        '--color-signal-magenta': '#DC2626',
        '--color-signal-lime': '#65A30D',
        '--color-signal-amber': '#D97706',
      };
      Object.entries(craftColors).forEach(([key, val]) => {
        root.style.setProperty(key, val);
      });

      const craftAccents: Record<string, string> = {
        magenta: '#DC2626', lime: '#65A30D', amber: '#D97706', tokyo: '#8B7355', 'matte-white': '#E8E4D9'
      };
      if (accent === 'custom') {
        const h = presentationConfig.customH ?? 210;
        const s = presentationConfig.customS ?? 100;
        const l = presentationConfig.customL ?? 50;
        root.style.setProperty('--color-signal-cyan', `hsl(${h}, ${s}%, ${l}%)`);
        root.style.setProperty('--accent-hex', `hsl(${h}, ${s}%, ${l}%)`);
      } else if (accent !== 'cyan') {
        root.style.setProperty('--accent-hex', craftAccents[accent] || '#0066FF');
        if (accent === 'magenta') root.style.setProperty('--color-signal-cyan', '#DC2626');
        if (accent === 'lime') root.style.setProperty('--color-signal-cyan', '#65A30D');
        if (accent === 'amber') root.style.setProperty('--color-signal-cyan', '#D97706');
        if (accent === 'tokyo') root.style.setProperty('--color-signal-cyan', '#8B7355');
        if (accent === 'matte-white') root.style.setProperty('--color-signal-cyan', '#E8E4D9');
      } else {
        root.style.setProperty('--accent-hex', '#0066FF');
      }
    }
    // ---- CYBER MODE (Zero_Consequences cyber aesthetic - dark with vivid signals) ----
    else if (theme === 'cyber') {
      const cyberColors: Record<string, string> = {
        '--color-void': '#05080F',
        '--color-night': '#0A0E1A',
        '--color-carbon': '#111624',
        '--color-graphite': '#1A2035',
        '--color-steel': '#232B45',
        '--color-slate': '#3D4768',
        '--color-ash': '#6B7598',
        '--color-bone': '#C8D0E0',
        '--color-on-surface': '#E8EDF5',
      };
      Object.entries(cyberColors).forEach(([key, val]) => {
        root.style.setProperty(key, val);
      });

      if (accent === 'custom') {
        const h = presentationConfig.customH ?? 180;
        const s = presentationConfig.customS ?? 100;
        const l = presentationConfig.customL ?? 50;
        root.style.setProperty('--color-signal-cyan', `hsl(${h}, ${s}%, ${l}%)`);
        root.style.setProperty('--color-signal-magenta', `hsl(${(h + 120) % 360}, ${Math.min(100, s)}%, ${l}%)`);
        root.style.setProperty('--color-signal-lime', `hsl(${(h + 240) % 360}, ${Math.min(100, s)}%, ${l}%)`);
        root.style.setProperty('--color-signal-amber', `hsl(${(h + 40) % 360}, ${Math.max(10, s - 10)}%, ${Math.max(10, l - 10)}%)`);
        root.style.setProperty('--accent-hex', `hsl(${h}, ${s}%, ${l}%)`);
      } else if (accent === 'tokyo') {
        const tokyoColors = {
          '--color-void': '#0e0b09', '--color-night': '#1a110e',
          '--color-carbon': '#251a16', '--color-graphite': '#362621',
          '--color-steel': '#47332c', '--color-slate': '#8c6e64',
          '--color-ash': '#bfa69c', '--color-bone': '#ebe2de',
          '--color-signal-cyan': '#d4b395', '--color-signal-magenta': '#ad7653',
          '--color-signal-lime': '#dfbc96', '--color-signal-amber': '#754a2c',
        };
        Object.entries(tokyoColors).forEach(([key, val]) => root.style.setProperty(key, val));
        root.style.setProperty('--accent-hex', '#d4b395');
      } else if (accent === 'matte-white') {
        root.style.setProperty('--accent-hex', '#E8E4D9');
        root.style.setProperty('--color-signal-cyan', '#E8E4D9');
      } else if (accent !== 'cyan') {
        root.style.setProperty('--accent-hex', accentHexMap[accent] || '#00F0FF');
      } else {
        root.style.setProperty('--accent-hex', '#00F0FF');
      }
    }
    // ---- LIGHT NEOCRAFT MODE (Dashboard-Conteo original light theme) ----
    else if (theme === 'light_neocraft') {
      const lightNeoCraftColors: Record<string, string> = {
        '--color-void': '#E8EBF0',
        '--color-night': '#F2F4F7',
        '--color-carbon': '#FFFFFF',
        '--color-graphite': '#D3D8E2',
        '--color-steel': '#B9C2D1',
        '--color-slate': '#4B5563',
        '--color-ash': '#333D52',
        '--color-bone': '#111111',
        '--color-signal-cyan': '#156BFF',
        '--color-signal-magenta': '#4B5DFF',
        '--color-signal-lime': '#1A7A1A',
        '--color-signal-amber': '#5BE8FF',
      };
      Object.entries(lightNeoCraftColors).forEach(([key, val]) => {
        root.style.setProperty(key, val);
      });

      if (accent === 'custom') {
        const h = presentationConfig.customH ?? 180;
        const s = presentationConfig.customS ?? 100;
        const l = presentationConfig.customL ?? 50;
        root.style.setProperty('--color-signal-cyan', `hsl(${h}, ${s}%, ${l}%)`);
        root.style.setProperty('--accent-hex', `hsl(${h}, ${s}%, ${l}%)`);
      } else if (accent !== 'cyan') {
        const lncAccents: Record<string, string> = {
          magenta: '#4B5DFF', lime: '#B6FF4D', amber: '#5BE8FF', tokyo: '#d4b395', 'matte-white': '#E8E4D9'
        };
        root.style.setProperty('--accent-hex', lncAccents[accent] || '#156BFF');
        if (accent === 'lime') root.style.setProperty('--color-signal-cyan', '#B6FF4D');
        if (accent === 'magenta') root.style.setProperty('--color-signal-cyan', '#4B5DFF');
        if (accent === 'amber') root.style.setProperty('--color-signal-cyan', '#5BE8FF');
        if (accent === 'matte-white') root.style.setProperty('--color-signal-cyan', '#E8E4D9');
      } else {
        root.style.setProperty('--accent-hex', '#156BFF');
      }
    }
    // ---- EDITORIAL MODE (Notion/Craft/Maven-inspired light) ----
    else if (theme === 'editorial') {
      const editorialColors: Record<string, string> = {
        '--color-void': '#FFFFFF',
        '--color-night': '#F8F9FA',
        '--color-carbon': '#FFFFFF',
        '--color-graphite': '#E2E4E8',
        '--color-steel': '#D1D5DB',
        '--color-slate': '#6B7280',
        '--color-ash': '#4B5563',
        '--color-bone': '#1F2937',
        '--color-on-surface': '#1F2937',
        '--color-on-primary': '#FFFFFF',
        '--color-paper': '#F0F1F3',
        '--color-signal-cyan': '#00838F',
        '--color-signal-magenta': '#C62828',
        '--color-signal-lime': '#55822F',
        '--color-signal-amber': '#AE6500',
      };
      Object.entries(editorialColors).forEach(([key, val]) => {
        root.style.setProperty(key, val);
      });

      const editorialAccents: Record<string, string> = {
        cyan: '#00838F', magenta: '#C62828', lime: '#55822F', amber: '#AE6500',
        tokyo: '#8B7355', 'matte-white': '#E8E4D9'
      };

      if (accent === 'custom') {
        const h = presentationConfig.customH ?? 210;
        const s = presentationConfig.customS ?? 100;
        const l = presentationConfig.customL ?? 50;
        root.style.setProperty('--color-signal-cyan', `hsl(${h}, ${s}%, ${l}%)`);
        root.style.setProperty('--accent-hex', `hsl(${h}, ${s}%, ${l}%)`);
      } else if (accent !== 'cyan') {
        root.style.setProperty('--accent-hex', editorialAccents[accent] || '#00838F');
        if (accent === 'magenta') root.style.setProperty('--color-signal-cyan', '#C62828');
        if (accent === 'lime') root.style.setProperty('--color-signal-cyan', '#55822F');
        if (accent === 'amber') root.style.setProperty('--color-signal-cyan', '#AE6500');
        if (accent === 'tokyo') root.style.setProperty('--color-signal-cyan', '#8B7355');
        if (accent === 'matte-white') root.style.setProperty('--color-signal-cyan', '#E8E4D9');
      } else {
        root.style.setProperty('--accent-hex', '#00838F');
      }
    }
    // ---- DARK MODE (default) ----
    else {
      if (accent === 'tokyo') {
        const tokyoCappuccinoColors: Record<string, string> = {
          '--color-void': '#0e0b09',
          '--color-night': '#1a110e',
          '--color-carbon': '#251a16',
          '--color-graphite': '#362621',
          '--color-steel': '#47332c',
          '--color-slate': '#8c6e64',
          '--color-ash': '#bfa69c',
          '--color-bone': '#ebe2de',
          '--color-signal-cyan': '#d4b395',
          '--color-signal-magenta': '#ad7653',
          '--color-signal-lime': '#dfbc96',
          '--color-signal-amber': '#754a2c',
        };
        Object.entries(tokyoCappuccinoColors).forEach(([key, val]) => {
          root.style.setProperty(key, val);
        });
        root.style.setProperty('--accent-hex', '#d4b395');
      } else if (accent === 'custom') {
        const h = presentationConfig.customH ?? 28;
        const s = presentationConfig.customS ?? 45;
        const l = presentationConfig.customL ?? 65;

        const customAccentColor = `hsl(${h}, ${s}%, ${l}%)`;
        const customMagentaColor = `hsl(${(h + 120) % 360}, ${s}%, ${l}%)`;
        const customLimeColor = `hsl(${(h + 240) % 360}, ${s}%, ${l}%)`;
        const customAmberColor = `hsl(${(h + 40) % 360}, ${Math.max(10, s - 10)}%, ${Math.max(10, l - 10)}%)`;

        root.style.setProperty('--color-signal-cyan', customAccentColor);
        root.style.setProperty('--color-signal-magenta', customMagentaColor);
        root.style.setProperty('--color-signal-lime', customLimeColor);
        root.style.setProperty('--color-signal-amber', customAmberColor);
        root.style.setProperty('--accent-hex', customAccentColor);
      } else if (accent === 'matte-white') {
        root.style.setProperty('--accent-hex', '#E8E4D9');
        root.style.setProperty('--color-signal-cyan', '#E8E4D9');
      } else {
        root.style.setProperty('--accent-hex', accentHexMap[accent] || '#00F0FF');
      }
    }
  }, [accent, presentationConfig.customH, presentationConfig.customS, presentationConfig.customL, presentationConfig.themeMode]);
}

// Helper map used across theme modes
const accentHexMap: Record<string, string> = {
  cyan: '#00F0FF', magenta: '#FF2E9A', lime: '#C6FF3D', amber: '#FFB400'
};

export type { ThemeMode, PresentationConfig, AccentColor };