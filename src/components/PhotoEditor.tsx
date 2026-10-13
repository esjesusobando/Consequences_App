import React, { useState, useRef, useCallback, useEffect } from 'react';
import type { AccentColor } from '../types';
import { safeSet } from '../lib/storage';

interface PhotoEditorProps {
  accent: AccentColor;
  onLogMessage: (type: 'info' | 'ok' | 'warn' | 'err', text: string) => void;
}

// ── Types ──

interface Adjustments {
  exposure: number;
  contrast: number;
  shadows: number;
  highlights: number;
  warmth: number;
  saturation: number;
  vibrance: number;
  clarity: number;
  vignette: number;
  dof: number;
}

interface Preset {
  id: string;
  label: string;
  sub: string;
  adj: Adjustments;
}

// ── Constants ──

const DEF: Adjustments = { exposure: 0, contrast: 0, shadows: 0, highlights: 0, warmth: 0, saturation: 0, vibrance: 0, clarity: 0, vignette: 0, dof: 0 };

const PRESETS: Preset[] = [
  { id: 'none',      label: 'Original',  sub: 'Sin filtro',             adj: { ...DEF } },
  { id: 'portrait',  label: 'Portrait',  sub: 'Suave · Cálido · Bokeh', adj: { ...DEF, exposure: 0.05, contrast: 0.12, shadows: 0.25, highlights: -0.18, warmth: 18, saturation: 0.05, vibrance: 0.18, clarity: 0.10, vignette: 0.28, dof: 0.40 } },
  { id: 'lifestyle', label: 'Lifestyle', sub: 'Cinematográfico',        adj: { ...DEF, exposure: 0.02, contrast: 0.08, shadows: 0.20, highlights: -0.22, warmth: 10, saturation: -0.05, vibrance: 0.12, clarity: 0.08, vignette: 0.22, dof: 0.18 } },
  { id: 'product',   label: 'Product',   sub: 'Nítido · Limpio',        adj: { ...DEF, exposure: 0.12, contrast: 0.22, shadows: 0.08, highlights: -0.08, warmth: 2, saturation: 0.10, vibrance: 0.05, clarity: 0.25, vignette: 0.10, dof: 0 } },
  { id: 'display',   label: 'Display',   sub: 'Vibrante · HDR',         adj: { ...DEF, exposure: 0.05, contrast: 0.28, shadows: 0.05, highlights: -0.05, warmth: 0, saturation: 0.32, vibrance: 0.28, clarity: 0.18, vignette: 0.32, dof: 0 } },
];

interface SliderDef {
  key: keyof Adjustments;
  label: string;
  min: number;
  max: number;
  step: number;
}

const SLIDERS: SliderDef[] = [
  { key: 'exposure',   label: 'Exposición',   min: -1,   max: 1,   step: 0.005 },
  { key: 'contrast',   label: 'Contraste',    min: -1,   max: 1,   step: 0.005 },
  { key: 'highlights', label: 'Altas Luces',  min: -1,   max: 0,   step: 0.005 },
  { key: 'shadows',    label: 'Sombras',      min: 0,    max: 1,   step: 0.005 },
  { key: 'warmth',     label: 'Temperatura',  min: -30,  max: 30,  step: 1 },
  { key: 'saturation', label: 'Saturación',   min: -0.5, max: 0.5, step: 0.005 },
  { key: 'vibrance',   label: 'Vibración',    min: 0,    max: 0.5, step: 0.005 },
  { key: 'clarity',    label: 'Claridad',     min: 0,    max: 0.5, step: 0.005 },
  { key: 'vignette',   label: 'Viñeta',       min: 0,    max: 0.8, step: 0.005 },
  { key: 'dof',        label: 'Prof. Campo',  min: 0,    max: 1,   step: 0.005 },
];

const TAGS = ['Luz suave', 'Sombras alzadas', 'Tonos cálidos', 'Split Toning teal↔ámbar', 'DoF creativo', 'Viñeta sutil', 'Vibrance inteligente'];

function fmtVal(key: string, v: number): string {
  if (key === 'warmth') return v > 0 ? `+${v}K` : v < 0 ? `${v}K` : '0';
  if (['dof', 'vignette', 'vibrance', 'clarity'].includes(key)) return `${Math.round(v * 100)}%`;
  const p = Math.round(v * 100);
  return p > 0 ? `+${p}` : `${p}`;
}

// ── Image Processing Engine ──

const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      default: h = ((r - g) / d + 4) / 6;
    }
  }
  return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) { const c = Math.round(l * 255); return [c, c, c]; }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  const f = (t: number): number => {
    t = ((t % 1) + 1) % 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [Math.round(f(h + 1 / 3) * 255), Math.round(f(h) * 255), Math.round(f(h - 1 / 3) * 255)];
}

function buildLUT(adj: Adjustments): Uint8ClampedArray {
  const lut = new Uint8ClampedArray(256);
  for (let i = 0; i < 256; i++) {
    let v = i;
    v = v * Math.pow(2, adj.exposure * 1.3);
    if (v < 128 && adj.shadows > 0) v += adj.shadows * 58 * (1 - v / 128);
    if (v > 128 && adj.highlights < 0) v += adj.highlights * 58 * ((v - 128) / 127);
    v = 128 + (v - 128) * (1 + adj.contrast * 0.9);
    lut[i] = Math.max(0, Math.min(255, Math.round(v)));
  }
  return lut;
}

function applyDoF(ctx: CanvasRenderingContext2D, w: number, h: number, strength: number) {
  const blurC = document.createElement('canvas');
  blurC.width = w; blurC.height = h;
  const bCtx = blurC.getContext('2d')!;
  bCtx.filter = `blur(${Math.round(strength * 18)}px)`;
  bCtx.drawImage(ctx.canvas, 0, 0);
  bCtx.filter = 'none';

  const maskC = document.createElement('canvas');
  maskC.width = w; maskC.height = h;
  const mCtx = maskC.getContext('2d')!;
  mCtx.drawImage(blurC, 0, 0);
  mCtx.globalCompositeOperation = 'destination-in';
  const cx = w / 2, cy = h / 2;
  const rad = Math.max(w, h) * 0.62;
  const g = mCtx.createRadialGradient(cx, cy, 0, cx, cy, rad);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(0.40, 'rgba(0,0,0,0)');
  g.addColorStop(0.70, `rgba(0,0,0,${Math.min(1, strength * 0.65).toFixed(2)})`);
  g.addColorStop(1.0, `rgba(0,0,0,${Math.min(1, strength).toFixed(2)})`);
  mCtx.fillStyle = g;
  mCtx.fillRect(0, 0, w, h);
  ctx.drawImage(maskC, 0, 0);
}

function runPipeline(canvas: HTMLCanvasElement, original: HTMLCanvasElement, adj: Adjustments) {
  const w = canvas.width, h = canvas.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  const oCtx = original.getContext('2d', { willReadFrequently: true })!;
  const imgData = oCtx.getImageData(0, 0, w, h);
  const d = imgData.data;
  const lut = buildLUT(adj);

  for (let i = 0; i < d.length; i += 4) {
    let r = lut[d[i]], g = lut[d[i + 1]], b = lut[d[i + 2]];

    if (adj.warmth !== 0) {
      r = clamp(r + adj.warmth * 0.55);
      g = clamp(g + adj.warmth * 0.09);
      b = clamp(b - adj.warmth * 0.55);
    }

    if (adj.saturation !== 0 || adj.vibrance > 0) {
      const [hh, s, l] = rgbToHsl(r, g, b);
      const ns = Math.max(0, Math.min(1, s + adj.saturation + adj.vibrance * (1 - s)));
      [r, g, b] = hslToRgb(hh, ns, l);
    }

    const lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
    if (lum < 0.38) {
      const t = (1 - lum / 0.38) * 0.044;
      r = clamp(r - t * 24); b = clamp(b + t * 18);
    } else if (lum > 0.62) {
      const t = ((lum - 0.62) / 0.38) * 0.044;
      r = clamp(r + t * 14); b = clamp(b - t * 11);
    }
    d[i] = r; d[i + 1] = g; d[i + 2] = b;
  }

  ctx.putImageData(imgData, 0, 0);

  if (adj.vignette > 0.005) {
    const cx = w / 2, cy = h / 2, rad = Math.hypot(cx, cy);
    const vg = ctx.createRadialGradient(cx, cy, rad * 0.30, cx, cy, rad * 1.20);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(0.52, 'rgba(0,0,0,0)');
    vg.addColorStop(1, `rgba(0,0,0,${(adj.vignette * 0.93).toFixed(2)})`);
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);
  }

  if (adj.clarity > 0.005) {
    const tmp = document.createElement('canvas');
    tmp.width = w; tmp.height = h;
    const tCtx = tmp.getContext('2d')!;
    tCtx.filter = `contrast(${(1 + adj.clarity * 0.32).toFixed(3)})`;
    tCtx.drawImage(canvas, 0, 0);
    ctx.drawImage(tmp, 0, 0);
  }

  if (adj.dof > 0.005) {
    const snap = document.createElement('canvas');
    snap.width = w; snap.height = h;
    snap.getContext('2d')!.drawImage(canvas, 0, 0);
    applyDoF(ctx, w, h, adj.dof);
  }
}

// ── Histogram ──

function computeHistogram(canvas: HTMLCanvasElement): number[] {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return [];
  const { width, height } = canvas;
  const data = ctx.getImageData(0, 0, width, height).data;
  const hist = new Array(256).fill(0);
  for (let i = 0; i < data.length; i += 4) {
    const lum = Math.round(data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
    hist[lum]++;
  }
  return hist;
}

function HistogramBar({ hist, max }: { hist: number[]; max: number }) {
  if (max === 0) return null;
  return (
    <div className="flex items-end h-8 gap-[1px] px-1">
      {hist.map((v, i) => (
        <div
          key={i}
          className="w-[3px] rounded-t-sm transition-all duration-75"
          style={{
            height: `${(v / max) * 100}%`,
            background: i < 85 ? `oklch(from var(--color-signal-cyan) l c h / ${0.3 + (v / max) * 0.7})` :
                        i < 170 ? `oklch(from var(--color-signal-lime) l c h / ${0.3 + (v / max) * 0.7})` :
                        `oklch(from var(--color-signal-magenta) l c h / ${0.3 + (v / max) * 0.7})`,
          }}
        />
      ))}
    </div>
  );
}

// ── Custom Slider (Lightroom-style) ──

interface SliderRowProps {
  def: SliderDef;
  value: number;
  accent: AccentColor;
  isChanged: boolean;
  onChange: (key: keyof Adjustments, value: number) => void;
}

function SliderRow({ def: s, value, accent, isChanged, onChange }: SliderRowProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [focused, setFocused] = useState(false);

  const pct = ((value - s.min) / (s.max - s.min)) * 100;
  const isBi = s.min < 0 && s.max > 0;
  const fillL = isBi ? (value >= 0 ? 50 : pct) : 0;
  const fillW = isBi ? (value >= 0 ? pct - 50 : 50 - pct) : pct;

  const accentHex = ({ cyan: '#00F0FF', magenta: '#FF2E9A', lime: '#C6FF3D', amber: '#FFB400' } as Record<string, string>)[accent] || '#00F0FF';

  const valFromPct = useCallback((clientX: number) => {
    const track = trackRef.current;
    if (!track) return value;
    const rect = track.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const raw = s.min + x * (s.max - s.min);
    const stepped = Math.round(raw / s.step) * s.step;
    return Math.max(s.min, Math.min(s.max, stepped));
  }, [s, value]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setDragging(true);
    onChange(s.key, valFromPct(e.clientX));
  }, [s.key, valFromPct, onChange]);

  useEffect(() => {
    if (!dragging) return;
    const handleMove = (e: MouseEvent) => {
      e.preventDefault();
      onChange(s.key, valFromPct(e.clientX));
    };
    const handleUp = () => setDragging(false);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [dragging, s.key, valFromPct, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const step = e.shiftKey ? s.step * 10 : s.step;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      onChange(s.key, Math.min(s.max, value + step));
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      onChange(s.key, Math.max(s.min, value - step));
    }
  }, [s, value, onChange]);

  const handleDoubleClick = useCallback(() => {
    onChange(s.key, 0);
  }, [s.key, onChange]);

  return (
    <div className="mb-3 last:mb-0">
      <div className="flex justify-between items-baseline mb-1.5">
        <label className={`text-[10px] font-mono tracking-wide transition-colors duration-150 ${isChanged ? 'text-bone' : 'text-ash/70'}`}>
          {s.label}
        </label>
        <span className="text-[10px] font-mono tabular-nums text-right tabular-nums tracking-tight min-w-[40px] text-right"
          style={{ color: isChanged ? accentHex : 'var(--color-ash)' }}>
          {fmtVal(s.key, value)}
        </span>
      </div>
      <div className="relative h-8 flex items-center">
        {/* Track background */}
        <div
          ref={trackRef}
          className={`relative w-full h-4 rounded-md cursor-pointer overflow-hidden select-none
            ${dragging ? 'cursor-grabbing' : 'cursor-pointer'}
            ${focused ? 'ring-1' : ''}`}
          style={{
            backgroundColor: 'var(--color-graphite)',
            opacity: 0.25,
            boxShadow: focused ? `0 0 0 1px ${accentHex}40` : 'none',
          }}
          onMouseDown={handleMouseDown}
          onDoubleClick={handleDoubleClick}
          tabIndex={0}
          role="slider"
          aria-label={s.label}
          aria-valuemin={s.min}
          aria-valuemax={s.max}
          aria-valuenow={value}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={handleKeyDown}
        >
          {/* Fill */}
          {fillW > 0 && (
            <div
              className="absolute h-full rounded-md pointer-events-none transition-all duration-75"
              style={{
                left: `${fillL}%`,
                width: `${Math.min(100 - fillL, fillW)}%`,
                background: isChanged ? accentHex : 'var(--color-steel)',
                opacity: isChanged ? 0.7 : 0.3,
              }}
            />
          )}
          {/* Center line */}
          {isBi && (
            <div className="absolute left-1/2 top-0 w-[1px] h-full pointer-events-none"
              style={{ backgroundColor: 'var(--color-ash)', opacity: 0.3 }} />
          )}
          {/* Thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-[14px] h-[14px] rounded-full pointer-events-none transition-all duration-75"
            style={{
              left: `calc(${pct}% - 7px)`,
              background: isChanged ? accentHex : 'var(--color-steel)',
              boxShadow: isChanged
                ? `0 0 0 2px ${accentHex}30, 0 1px 4px rgba(0,0,0,0.3)`
                : '0 1px 3px rgba(0,0,0,0.2)',
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Main PhotoEditor ──

const CUSTOM_PRESETS_KEY = 'zc_custom_presets';

function loadCustomPresets(): Preset[] {
  try {
    const raw = localStorage.getItem(CUSTOM_PRESETS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
    return [];
  } catch { return []; }
}

function saveCustomPresets(presets: Preset[]) {
  safeSet(CUSTOM_PRESETS_KEY, presets);
}

export function PhotoEditor({ accent, onLogMessage }: PhotoEditorProps) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [adj, setAdj] = useState<Adjustments>({ ...DEF });
  const [preset, setPreset] = useState<string>('none');
  const [before, setBefore] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [customPresets, setCustomPresets] = useState<Preset[]>(() => loadCustomPresets());
  const [savingPreset, setSavingPreset] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [histogram, setHistogram] = useState<number[]>([]);
  const [histMax, setHistMax] = useState(0);

  const cvRef = useRef<HTMLCanvasElement>(null);
  const ovRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const rafRef = useRef<number>(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const renderTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const hasChanged = Object.keys(DEF).some((k) => adj[k as keyof Adjustments] !== DEF[k as keyof Adjustments]);
  const hasImage = img !== null;

  // Init canvases when image loads
  useEffect(() => {
    if (!img || !cvRef.current || !ovRef.current) return;
    const MAX = 960;
    const scale = Math.min(1, MAX / img.naturalWidth, (MAX * 0.7) / img.naturalHeight);
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);

    if (imgRef.current !== img || cvRef.current.width !== w || cvRef.current.height !== h) {
      imgRef.current = img;
      cvRef.current.width = ovRef.current.width = w;
      cvRef.current.height = ovRef.current.height = h;
      ovRef.current.getContext('2d')!.drawImage(img, 0, 0, w, h);
    }
    applyRender();
    // Initial histogram
    setTimeout(() => {
      if (cvRef.current) {
        const h = computeHistogram(cvRef.current);
        setHistogram(h);
        setHistMax(Math.max(...h, 1));
      }
    }, 100);
  }, [img]);

  // Debounced pipeline render when adj or before changes
  useEffect(() => {
    if (!img) return;
    if (renderTimeoutRef.current) clearTimeout(renderTimeoutRef.current);
    renderTimeoutRef.current = setTimeout(() => {
      applyRender();
      // Update histogram
      if (cvRef.current && !before) {
        const h = computeHistogram(cvRef.current);
        setHistogram(h);
        setHistMax(Math.max(...h, 1));
      }
    }, 50);
    return () => { if (renderTimeoutRef.current) clearTimeout(renderTimeoutRef.current); };
  }, [adj, before, img]);

  function applyRender() {
    if (!img || !cvRef.current || !ovRef.current) return;
    const cv = cvRef.current;
    const ov = ovRef.current;
    const ctx = cv.getContext('2d')!;

    if (before) {
      ctx.drawImage(ov, 0, 0);
      return;
    }

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      try {
        runPipeline(cv, ov, adj);
      } catch (err) {
        console.warn('Pipeline error:', err);
        ctx.drawImage(ov, 0, 0);
      }
    });
  }

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      if (renderTimeoutRef.current) clearTimeout(renderTimeoutRef.current);
    };
  }, []);

  const loadFile = useCallback((file: File) => {
    if (!file?.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const i = new Image();
      i.onload = () => {
        setImg(i);
        setAdj({ ...DEF });
        setPreset('none');
        setBefore(false);
        setHistogram([]);
        setHistMax(0);
        imgRef.current = null;
        onLogMessage('ok', `Imagen cargada: ${file.name} (${i.naturalWidth}×${i.naturalHeight})`);
      };
      i.onerror = () => {
        onLogMessage('err', `Error al cargar imagen: ${file.name}`);
      };
      const target = e.target;
      if (target?.result) {
        i.src = target.result as string;
      }
    };
    reader.readAsDataURL(file);
  }, [onLogMessage]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) loadFile(e.target.files[0]);
  }, [loadFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]);
  }, [loadFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setDragOver(false), []);

  const handleSliderChange = useCallback((key: keyof Adjustments, value: number) => {
    setAdj((prev) => ({ ...prev, [key]: value }));
    setPreset('none');
  }, []);

  const pickPreset = useCallback((p: Preset) => {
    setPreset(p.id);
    setAdj({ ...p.adj });
  }, []);

  const toggleBefore = useCallback(() => setBefore((b) => !b), []);

  const handleReset = useCallback(() => {
    setPreset('none');
    setAdj({ ...DEF });
    onLogMessage('info', 'Editor restablecido');
  }, [onLogMessage]);

  const handleSaveCustom = useCallback(() => {
    const name = presetName.trim();
    if (!name) return;
    const newPreset: Preset = {
      id: `custom_${Date.now()}`,
      label: name,
      sub: 'Personalizado',
      adj: { ...adj },
    };
    const updated = [...customPresets, newPreset];
    setCustomPresets(updated);
    saveCustomPresets(updated);
    setPreset(newPreset.id);
    setPresetName('');
    setSavingPreset(false);
    onLogMessage('ok', `Preset "${name}" guardado`);
  }, [presetName, adj, customPresets, onLogMessage]);

  const handleDeleteCustom = useCallback((id: string) => {
    const updated = customPresets.filter(p => p.id !== id);
    setCustomPresets(updated);
    saveCustomPresets(updated);
    if (preset === id) { setPreset('none'); setAdj({ ...DEF }); }
    onLogMessage('info', 'Preset eliminado');
  }, [customPresets, preset, onLogMessage]);

  const handleSave = useCallback(() => {
    if (!cvRef.current || !img) return;
    const a = document.createElement('a');
    a.download = 'zero-consequences-edit.png';
    a.href = cvRef.current.toDataURL('image/png', 1);
    a.click();
    onLogMessage('ok', 'Imagen descargada como PNG');
  }, [img, onLogMessage]);

  const handleZoom = useCallback(() => {
    // TODO: zoom-to-100% toggle
  }, []);

  return (
    <div className="flex-1 flex overflow-hidden bg-void text-bone font-sans select-none">
      {/* LEFT: Preview */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <div className="h-11 flex items-center px-4 gap-2 border-b border-graphite/30 shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-signal-cyan)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>
            <line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/>
            <line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/>
          </svg>
          <span className="font-semibold tracking-tight text-sm">Photo Editor</span>
          {hasImage && (
            <span className="text-ash text-[10px] font-mono ml-auto">
              {img?.naturalWidth}×{img?.naturalHeight}
            </span>
          )}
        </div>

        {/* Canvas zone */}
        <div
          className="flex-1 flex items-center justify-center p-6 bg-carbon/40 relative overflow-hidden"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {!hasImage ? (
            <div
              className={`w-full max-w-lg aspect-[4/3] flex flex-col items-center justify-center border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200
                ${dragOver ? 'border-signal-cyan bg-signal-cyan/5' : 'border-graphite/40 hover:border-graphite hover:bg-carbon/20'}`}
              onClick={() => fileRef.current?.click()}
            >
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-ash)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4, marginBottom: 16 }}>
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <p className="text-base font-medium tracking-tight mb-1.5">Arrastrá tu foto aquí</p>
              <p className="text-ash text-[12px] font-mono mb-5">JPG · PNG · WEBP · HEIC</p>
              <button className="px-5 py-2 rounded-xl text-sm font-semibold border-none cursor-pointer hover:brightness-110 transition-all"
                style={{ background: 'var(--color-signal-cyan)', color: 'var(--color-void)' }}>
                Seleccionar imagen
              </button>
            </div>
          ) : (
            <>
              {/* Status badge */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none px-3 py-1 rounded-full text-[9px] tracking-wider uppercase font-semibold font-mono"
                style={{
                  background: 'var(--color-carbon)',
                  opacity: 0.9,
                  color: before ? 'var(--color-ash)' : 'var(--color-signal-cyan)',
                }}>
                {before ? '◁ ORIGINAL' : '✦ EDITADO'}
              </div>
              <canvas ref={cvRef} className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" />
              <canvas ref={ovRef} style={{ display: 'none' }} />

              {/* Histogram overlay */}
              <div className="absolute bottom-3 right-3 bg-carbon/70 backdrop-blur-sm rounded-lg p-2 border border-graphite/20">
                <div className="text-[7px] font-mono text-ash/50 uppercase tracking-wider mb-1 px-1">Histogram</div>
                <HistogramBar hist={histogram} max={histMax} />
              </div>
            </>
          )}
        </div>

        {/* Bottom bar */}
        {hasImage && (
          <div className="flex items-center gap-2 px-4 py-2.5 border-t border-graphite/30 shrink-0 bg-carbon/20">
            <button onClick={toggleBefore}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-mono border transition-all cursor-pointer ${
                before
                  ? 'bg-signal-amber/15 border-signal-amber text-signal-amber font-semibold'
                  : 'border-graphite/40 text-ash hover:border-steel hover:text-bone bg-transparent'
              }`}>
              {before ? '▶ Ver editada' : '◁ Ver original'}
            </button>
            <button onClick={() => fileRef.current?.click()}
              className="px-3 py-1.5 rounded-lg text-[10px] font-mono border border-graphite/40 text-ash hover:border-steel hover:text-bone bg-transparent cursor-pointer transition-all">
              Cambiar foto
            </button>
            <button onClick={handleReset} disabled={!hasChanged}
              className="px-3 py-1.5 rounded-lg text-[10px] font-mono border border-graphite/40 text-ash/60 hover:text-bone bg-transparent cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed">
              Reset
            </button>
            <div className="ml-auto flex items-center gap-2">
              <button onClick={handleSave}
                className="px-5 py-1.5 rounded-lg text-[11px] font-bold tracking-tight border-none cursor-pointer transition-all hover:brightness-110"
                style={{ background: 'var(--color-signal-lime)', color: 'var(--color-void)' }}>
                ↓ Exportar PNG
              </button>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT: Panel — Lightroom-style */}
      <div className="w-[280px] border-l border-graphite/30 bg-carbon/30 flex flex-col overflow-y-auto shrink-0">
        {/* Quick Styles */}
        <div className="px-4 py-3 border-b border-graphite/20">
          <h3 className="text-[9px] text-ash/60 tracking-wider uppercase font-semibold mb-2.5 font-mono">Estilos Rápidos</h3>
          <div className="grid grid-cols-3 gap-1.5">
            {PRESETS.map((p) => (
              <button key={p.id} onClick={() => pickPreset(p)}
                className={`text-center px-1.5 py-2 rounded-xl cursor-pointer transition-all outline-none border text-[10px]
                  ${preset === p.id
                    ? 'bg-signal-cyan/12 border-signal-cyan/50 text-signal-cyan'
                    : 'bg-carbon border-graphite/50 text-ash/80 hover:border-steel hover:text-bone'
                  }`}>
                <span className="block font-semibold">{p.label}</span>
                <span className={`block text-[7px] mt-0.5 leading-tight font-mono ${preset === p.id ? 'text-signal-cyan/70' : 'text-ash/50'}`}>{p.sub}</span>
              </button>
            ))}
            {customPresets.map((p) => (
              <div key={p.id} className="relative group">
                <button onClick={() => pickPreset(p)}
                  className={`w-full text-center px-1.5 py-2 rounded-xl cursor-pointer transition-all outline-none border text-[10px]
                    ${preset === p.id
                      ? 'bg-signal-magenta/12 border-signal-magenta/50 text-signal-magenta'
                      : 'bg-carbon border-graphite/50 text-ash/80 hover:border-steel hover:text-bone'
                    }`}>
                  <span className="block font-semibold">{p.label}</span>
                  <span className="block text-[7px] mt-0.5 leading-tight font-mono text-ash/50">Personalizado</span>
                </button>
                <button onClick={() => handleDeleteCustom(p.id)}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-none"
                  style={{ background: 'var(--color-signal-magenta)', color: 'var(--color-void)' }}>
                  ✕
                </button>
              </div>
            ))}
          </div>
          {savingPreset ? (
            <div className="flex items-center gap-1.5 mt-2">
              <input type="text" value={presetName} onChange={e => setPresetName(e.target.value)}
                placeholder="Nombre del preset..." autoFocus
                className="flex-1 bg-carbon border border-graphite/30 rounded-lg px-2 py-1.5 text-[10px] text-bone placeholder:text-ash/20 outline-none focus:border-signal-cyan/40 font-mono"
                onKeyDown={e => { if (e.key === 'Enter') handleSaveCustom(); if (e.key === 'Escape') setSavingPreset(false); }} />
              <button onClick={handleSaveCustom} className="text-[10px] text-signal-cyan font-mono hover:text-signal-cyan/80 cursor-pointer shrink-0">Guardar</button>
              <button onClick={() => setSavingPreset(false)} className="text-[10px] text-ash/50 font-mono hover:text-bone cursor-pointer shrink-0">×</button>
            </div>
          ) : (
            hasChanged && !savingPreset && (
              <button onClick={() => setSavingPreset(true)}
                className="w-full mt-2 px-2 py-1.5 rounded-lg text-[9px] font-mono text-signal-cyan/70 bg-signal-cyan/8 border border-dashed border-signal-cyan/20 hover:bg-signal-cyan/15 hover:text-signal-cyan transition-all cursor-pointer">
                + Guardar como preset
              </button>
            )
          )}
        </div>

        {/* Quality Principles */}
        <div className="px-4 py-2.5 border-b border-graphite/20">
          <div className="flex flex-wrap gap-1">
            {TAGS.map((t) => (
              <span key={t} className="text-[8px] font-mono px-1.5 py-0.5 rounded text-signal-cyan/80 border border-signal-cyan/20"
                style={{ background: 'var(--color-signal-cyan)', opacity: 0.08 }}>
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Manual Adjustments */}
        <div className="flex-1 px-4 py-3 overflow-y-auto">
          <div className="text-[9px] text-ash/50 tracking-wider uppercase font-semibold mb-3 font-mono">Ajustes</div>
          {SLIDERS.map((s) => (
            <div key={s.key} className="contents">
            <SliderRow
              def={s}
              value={adj[s.key]}
              accent={accent}
              isChanged={adj[s.key] !== DEF[s.key]}
              onChange={handleSliderChange}
            />
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-graphite/20">
          <button onClick={handleReset}
            className="w-full py-2 rounded-lg text-[10px] font-mono transition-all cursor-pointer"
            style={{ background: 'var(--color-carbon)', border: '1px solid var(--color-graphite)', color: 'var(--color-ash)' }}>
            Restablecer todo
          </button>
          <p className="text-center text-ash/15 text-[7px] mt-2 font-mono">
            Canvas API · Split Toning · Bokeh Sim · v2
          </p>
        </div>
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileInput} />
    </div>
  );
}
