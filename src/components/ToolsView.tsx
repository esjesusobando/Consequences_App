import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen,
  ImagePlus,
  Wand2,
  QrCode,
  KeyRound,
  Cpu,
  Search,
  Copy,
  Check,
  ChevronRight,
  RefreshCw,
  Eye,
  EyeOff,
  Upload,
  Download,
  Shield,
  Sparkles,
  Sliders,
  Type,
  RotateCcw,
  Layers,
  Sun,
  Contrast,
  Hash,
  ArrowLeftRight,
  Palette,
  Plus,
  Trash2,
  Star,
  StarOff,
  FolderPlus,
  Folder,
  Edit3,
  FileJson,
  FileText,
  X,
  ChevronDown,
  SortAsc,
  Calendar,
  AlignLeft,
  LayoutGrid,
  Bookmark,
} from 'lucide-react';
import { AccentColor } from '../types';
import { nanoid } from 'nanoid';
import QRCode from 'qrcode';
import { removeBackground } from '@imgly/background-removal';
import { PhotoEditor } from './PhotoEditor';
import { safeSet } from '../lib/storage';

// ── Title Normalizer ──────────────────────────────────────────────

function toPascalCaseUnderscore(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9ÁÉÍÓÚáéíóúÑñüÜ\s_-]/g, ' ')
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('_');
}

// ── Types ──────────────────────────────────────────────────────────

interface ToolsViewProps {
  accent: AccentColor;
  onLogMessage: (type: 'info' | 'ok' | 'warn' | 'err', text: string) => void;
}

interface ToolDef {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  desc: string;
}

const TOOLS: ToolDef[] = [
  { id: 'prompts',    label: 'Prompt Library',  icon: BookOpen,   desc: 'Prompts SOTA por categoría' },
  { id: 'image-edit', label: 'Image Editor',    icon: ImagePlus,  desc: 'Pipeline fotográfico con presets' },
  { id: 'remove-bg',  label: 'Remove BG',       icon: Wand2,      desc: 'Quitar fondo automático' },
  { id: 'qr',         label: 'QR Generator',    icon: QrCode,     desc: 'Texto a código QR' },
  { id: 'passwords',  label: 'Passwords',       icon: KeyRound,   desc: 'Generador estilo ProtonVPN' },
  { id: 'skills',     label: 'Skills Library',  icon: Cpu,        desc: 'CRUD de skills nivel SOTA' },
  { id: 'tabs',       label: 'Consequences Tabs', icon: Bookmark, desc: 'Capturar y organizar URLs' },
];

import { IMPORTED_PROMPTS } from '../data/importedPrompts';
import SkillsLibrary from './SkillsLibrary';
import { ConsequenceTabs } from './tabs/ConsequenceTabs';

// ── Seed data ─────────────────────────────────────────────────────

export interface Prompt {
  id: string;
  title: string;
  category: string;
  prompt: string;
  tags: string[];
  folder: string;
  isFavorite: boolean;
  createdAt: number;
  updatedAt: number;
  sotaLevel?: 'basic' | 'intermediate' | 'advanced' | 'sota';
}

const SEED_PROMPTS: Prompt[] = [
  ...IMPORTED_PROMPTS,
];

const DEFAULT_CATEGORIES = ['Marketing', 'Diseño', 'Dev', 'General', 'Estrategia', 'Config', 'System'];

// ── Prompt Store (localStorage) ─────────────────────────────────────

const STORAGE_KEY = 'zc_prompts';
const FOLDERS_KEY = 'zc_prompt_folders';

function loadPrompts(): Prompt[] {
  const normalize = (p: Prompt) => ({ ...p, title: toPascalCaseUnderscore(p.title) });
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const stored: Prompt[] = JSON.parse(raw).map(normalize);
      if (stored.length < SEED_PROMPTS.length) {
        const storedIds = new Set(stored.map(p => p.id));
        const missingFromSeeds = SEED_PROMPTS.filter(p => !storedIds.has(p.id));
        const merged = [...stored, ...missingFromSeeds.map(normalize)];
        safeSet(STORAGE_KEY, merged);
        return merged;
      }
      return stored;
    }
  } catch { /* corrupted */ }
  const seeds = SEED_PROMPTS.map(normalize);
  safeSet(STORAGE_KEY, seeds);
  return seeds;
}

function loadFolders(): string[] {
  try {
    const raw = localStorage.getItem(FOLDERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch { /* corrupted */ }
  return [];
}

function savePrompts(prompts: Prompt[]) {
  safeSet(STORAGE_KEY, prompts);
}

function saveFolders(folders: string[]) {
  safeSet(FOLDERS_KEY, folders);
}

// ── Export / Import Helpers ─────────────────────────────────────────

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exportJSON(prompts: Prompt[]) {
  const data = prompts.map(({ id, title, category, prompt, tags, folder, sotaLevel, createdAt, updatedAt }) => ({
    id, title, category, prompt, tags, folder, sotaLevel, createdAt, updatedAt,
  }));
  downloadFile(JSON.stringify(data, null, 2), 'prompts.json', 'application/json');
}

function exportCSV(prompts: Prompt[]) {
  const header = 'title,category,prompt,tags,folder,sotaLevel,createdAt,updatedAt';
  const rows = prompts.map(p => {
    const escapedPrompt = `"${p.prompt.replace(/"/g, '""')}"`;
    const escapedTags = `"${p.tags.join(';')}"`;
    return `${p.title},${p.category},${escapedPrompt},${escapedTags},${p.folder},${p.sotaLevel || ''},${p.createdAt},${p.updatedAt}`;
  });
  downloadFile([header, ...rows].join('\n'), 'prompts.csv', 'text/csv');
}

function exportMarkdown(prompts: Prompt[]) {
  const md = prompts.map(p => {
    let block = `# ${p.title}\n\n`;
    block += `**Category:** ${p.category}\n`;
    if (p.sotaLevel) block += `**Level:** ${p.sotaLevel === 'sota' ? 'SOTA' : p.sotaLevel.charAt(0).toUpperCase() + p.sotaLevel.slice(1)}\n`;
    block += `\n${p.prompt}\n\n---\n`;
    return block;
  }).join('\n');
  downloadFile(md, 'prompts.md', 'text/markdown');
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function importMerge(existing: Prompt[], imported: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt' | 'isFavorite'>[]): Prompt[] {
  const now = Date.now();
  const existingTitles = new Set(existing.map(p => p.title.toLowerCase()));
  const newPrompts: Prompt[] = [];
  for (const p of imported) {
    if (p.title && !existingTitles.has(p.title.toLowerCase())) {
      newPrompts.push({
        id: nanoid(8),
        ...p,
        isFavorite: false,
        createdAt: now,
        updatedAt: now,
      });
      existingTitles.add(p.title.toLowerCase());
    }
  }
  return [...newPrompts, ...existing];
}

// ── Password Generator ─────────────────────────────────────────────

function generatePassword(length: number, useSymbols: boolean, useNumbers: boolean, useUppercase: boolean): string {
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const nums = '0123456789';
  const syms = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  let chars = lower;
  if (useUppercase) chars += upper;
  if (useNumbers) chars += nums;
  if (useSymbols) chars += syms;
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  return password;
}

function calculateStrength(pw: string): { label: string; color: string; width: string } {
  let score = 0;
  if (pw.length >= 12) score += 2;
  else if (pw.length >= 8) score += 1;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score += 1;
  if (/\d/.test(pw)) score += 1;
  if (/[^a-zA-Z0-9]/.test(pw)) score += 1;
  if (pw.length >= 16) score += 1;
  if (score >= 5) return { label: 'Muy fuerte', color: 'bg-signal-lime', width: 'w-full' };
  if (score >= 4) return { label: 'Fuerte', color: 'bg-signal-lime', width: 'w-3/4' };
  if (score >= 2) return { label: 'Media', color: 'bg-signal-amber', width: 'w-1/2' };
  return { label: 'Débil', color: 'bg-signal-magenta', width: 'w-1/4' };
}

// ── QR Code simple render ───────────────────────────────────────────

function QrCodeRender({ text, size = 180 }: { text: string; size?: number }) {
  const seed = text.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const cells: boolean[] = [];
  for (let i = 0; i < 21 * 21; i++) {
    const hash = (seed * (i + 1) * 7 + i * 13) % 100;
    cells.push(hash > 35);
  }
  const cellSize = size / 21;
  return (
    <div
      className="grid bg-white rounded-xl p-3 shadow-lg"
      style={{
        width: size + 24, height: size + 24,
        gridTemplateColumns: `repeat(21, ${cellSize}px)`,
        gridTemplateRows: `repeat(21, ${cellSize}px)`,
        gap: 0,
      }}
    >
      {cells.map((on, i) => {
        const row = Math.floor(i / 21);
        const col = i % 21;
        const isCorner =
          (row < 7 && col < 7) ||
          (row < 7 && col > 13) ||
          (row > 13 && col < 7);
        const fill = isCorner || on;
        return (
          <div key={i} className={fill ? 'bg-gray-900' : 'bg-white'}
            style={{ width: cellSize, height: cellSize }} />
        );
      })}
    </div>
  );
}

// ── Remove BG ─────────────────────────────────────────────────────

function RemoveBgMock() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [originalSrc, setOriginalSrc] = useState<string | null>(null);
  const [processedSrc, setProcessedSrc] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  // Preload removal model silently
  useEffect(() => {
    let cancelled = false;
    setIsModelLoading(true);
    Promise.resolve().then(() => { if (!cancelled) setModelReady(true); })
      .finally(() => { if (!cancelled) setIsModelLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleFile = async (file: File) => {
    if (!file?.type.startsWith('image/')) return;
    setError(null);
    setIsProcessing(true);
    setProgress(0);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const src = e.target?.result as string;
      setOriginalSrc(src);
      setProcessedSrc(null);

      try {
        const blob = await removeBackground(file, {
          progress: (key, current, total) => {
            if (key === 'compute:inference') {
              setProgress(Math.round((current / total) * 100));
            }
          },
          output: { format: 'image/png' },
        });
        const url = URL.createObjectURL(blob);
        setProcessedSrc(url);
      } catch (err) {
        setError('Error procesando. Intentá con otra imagen.');
        console.error(err);
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleDownload = () => {
    if (!processedSrc) return;
    const a = document.createElement('a');
    a.href = processedSrc;
    a.download = 'sin-fondo.png';
    a.click();
  };

  const reset = () => {
    setOriginalSrc(null);
    setProcessedSrc(null);
    setError(null);
    setIsProcessing(false);
    setProgress(0);
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); e.target.value = ''; }}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Original */}
        <div className="bg-carbon/40 border border-graphite/20 rounded-2xl overflow-hidden">
          <div className="text-[9px] font-mono text-ash/30 uppercase tracking-wider px-4 pt-3 pb-1">Original</div>
          <div
            className="aspect-square m-3 rounded-xl flex items-center justify-center cursor-pointer transition-all bg-carbon/20 hover:bg-carbon/30 border-2 border-dashed border-graphite/20 hover:border-signal-cyan/30"
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop} onDragOver={e => e.preventDefault()}
          >
            {originalSrc ? (
              <img src={originalSrc} alt="Original" className="max-w-full max-h-full object-contain rounded-lg" />
            ) : (
              <div className="text-center">
                <Upload className="w-8 h-8 text-ash/30 mx-auto mb-2" />
                <p className="text-xs text-ash/50 font-mono">Arrastrá o hacé click</p>
              </div>
            )}
          </div>
        </div>

        {/* Resultado */}
        <div className="bg-carbon/40 border border-graphite/20 rounded-2xl overflow-hidden">
          <div className="text-[9px] font-mono text-ash/30 uppercase tracking-wider px-4 pt-3 pb-1">
            {isModelLoading ? 'Cargando modelo…' : isProcessing ? `Procesando ${progress}%` : processedSrc ? 'Sin Fondo' : 'Resultado'}
          </div>
          <div className="aspect-square m-3 rounded-xl flex items-center justify-center transition-all bg-[repeating-conic-gradient(#1a1a2e_0%_25%,#0d0d15_0%_50%)_50%/16px_16px]">
            {isModelLoading ? (
              <div className="text-center">
                <div className="w-8 h-8 mx-auto mb-3">
                  <svg className="w-8 h-8 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="#1E2433" strokeWidth="3" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="#00F0FF" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                </div>
                <p className="text-xs text-ash/50 font-mono">Descargando modelo<br/>(~80MB · solo 1ª vez)</p>
              </div>
            ) : isProcessing ? (
              <div className="text-center">
                <div className="w-12 h-12 relative mx-auto mb-2">
                  <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15" fill="none" stroke="#1E2433" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15" fill="none" stroke="#00F0FF" strokeWidth="3"
                      strokeDasharray={`${progress} 100`} strokeLinecap="round" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono text-signal-cyan">
                    {progress}%
                  </span>
                </div>
                <p className="text-xs text-ash/50 font-mono">El modelo es ~80MB<br/>Se descarga una sola vez</p>
              </div>
            ) : processedSrc ? (
              <img src={processedSrc} alt="Sin fondo" className="max-w-full max-h-full object-contain rounded-lg" />
            ) : (
              <Wand2 className="w-8 h-8 text-ash/20" />
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-signal-magenta/10 border border-signal-magenta/20 rounded-xl px-4 py-2">
          <p className="text-[11px] font-mono text-signal-magenta">{error}</p>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-semibold bg-signal-cyan/10 text-signal-cyan border border-signal-cyan/30 hover:brightness-125 transition-all cursor-pointer"
        >
          <Upload className="w-4 h-4" />
          {originalSrc ? 'Cambiar imagen' : 'Seleccionar imagen'}
        </button>

        {processedSrc && (
          <>
            <button onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-semibold bg-signal-lime/10 text-signal-lime border border-signal-lime/30 hover:brightness-125 transition-all cursor-pointer">
              <Download className="w-4 h-4" /> Descargar PNG
            </button>
            <button onClick={reset}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-semibold bg-carbon/30 text-ash/60 border border-graphite/20 hover:text-bone hover:border-graphite/40 transition-all cursor-pointer">
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── QR Generator ──────────────────────────────────────────────────

function QrGeneratorMock() {
  const [inputText, setInputText] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateQr = useCallback(async (text: string) => {
    if (!text.trim()) { setQrDataUrl(null); return; }
    try {
      setError(null);
      const url = await QRCode.toDataURL(text, {
        width: 280,
        margin: 2,
        color: { dark: '#0D0D0F', light: '#E8E0D4' },
        errorCorrectionLevel: 'M',
      });
      setQrDataUrl(url);
    } catch (err) {
      setError('No se pudo generar el QR');
      setQrDataUrl(null);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => generateQr(inputText), 300);
    return () => clearTimeout(timer);
  }, [inputText, generateQr]);

  const copyQr = useCallback(() => {
    if (!qrDataUrl) return;
    // Copy as image via clipboard API
    fetch(qrDataUrl).then(r => r.blob()).then(blob => {
      navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }).catch(() => {
      // Fallback: copy text
      navigator.clipboard.writeText(inputText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [qrDataUrl, inputText]);

  const downloadQr = useCallback(() => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = 'qr-code.png';
    a.click();
  }, [qrDataUrl]);

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-[9px] font-mono text-ash/40 uppercase tracking-wider block mb-1.5">Texto o URL</label>
          <div className="flex gap-2">
            <input type="text" value={inputText} onChange={e => setInputText(e.target.value)}
              placeholder="https://tudominio.com o texto libre…"
              className="flex-1 bg-carbon/30 border border-graphite/20 rounded-xl px-4 py-2.5 text-xs text-bone font-mono placeholder:text-ash/20 outline-none focus:border-signal-cyan/40 transition-colors" />
            <button onClick={() => setInputText('')}
              className="px-3 py-2 bg-carbon/30 border border-graphite/20 rounded-xl text-ash/50 hover:text-bone transition-colors cursor-pointer">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-signal-magenta/10 border border-signal-magenta/20 rounded-xl px-4 py-2">
          <p className="text-[11px] font-mono text-signal-magenta">{error}</p>
        </div>
      )}

      <div className="flex flex-col items-center gap-4 py-4">
        {qrDataUrl ? (
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}>
            <div className="p-4 bg-bone rounded-2xl shadow-lg">
              <img src={qrDataUrl} alt="QR Code" className="w-[180px] h-[180px] rounded-lg" />
            </div>
          </motion.div>
        ) : (
          <div className="w-[204px] h-[204px] bg-carbon/30 border border-dashed border-graphite/20 rounded-xl flex items-center justify-center">
            <QrCode className="w-10 h-10 text-ash/20" />
          </div>
        )}

        <div className="flex items-center gap-2">
          <button onClick={copyQr} disabled={!qrDataUrl}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-semibold transition-all duration-200 cursor-pointer ${
              !qrDataUrl ? 'bg-carbon/20 text-ash/30' : copied ? 'bg-signal-lime/10 text-signal-lime border border-signal-lime/30' : 'bg-signal-cyan/10 text-signal-cyan border border-signal-cyan/30 hover:brightness-125'
            }`}>
            {copied ? <><Check className="w-4 h-4" /> Copiado</> : <><Copy className="w-4 h-4" /> Copiar QR</>}
          </button>
          <button onClick={downloadQr} disabled={!qrDataUrl}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-semibold bg-carbon/30 text-ash/60 border border-graphite/20 hover:text-bone hover:border-graphite/40 transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
            <Download className="w-4 h-4" /> PNG
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Password Generator ─────────────────────────────────────────────

function PasswordGenerator() {
  const [length, setLength] = useState(24);
  const [useSymbols, setUseSymbols] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useUppercase, setUseUppercase] = useState(true);
  const [password, setPassword] = useState(() => generatePassword(24, true, true, true));
  const [copied, setCopied] = useState(false);
  const [visible, setVisible] = useState(false);
  const regenerate = () => setPassword(generatePassword(length, useSymbols, useNumbers, useUppercase));
  const copyPw = () => { navigator.clipboard.writeText(password); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  const strength = calculateStrength(password);
  return (
    <div className="space-y-5">
      <div className="bg-carbon/30 border border-graphite/20 rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 font-mono text-lg text-bone tracking-wider break-all select-all">
            {visible ? password : '•'.repeat(password.length)}
          </div>
          <button onClick={() => setVisible(!visible)} className="p-2 text-ash/50 hover:text-bone transition-colors cursor-pointer">
            {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-carbon/40 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
              style={{ width: strength.width === 'w-full' ? '100%' : strength.width === 'w-3/4' ? '75%' : strength.width === 'w-1/2' ? '50%' : '25%' }} />
          </div>
          <span className="text-[9px] font-mono text-ash/50 uppercase tracking-wider">{strength.label}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[9px] font-mono text-ash/40 uppercase tracking-wider block mb-1.5">Longitud: {length}</label>
          <input type="range" min={8} max={64} value={length} onChange={e => setLength(Number(e.target.value))}
            className="w-full accent-signal-cyan" />
          <div className="flex justify-between text-[8px] font-mono text-ash/30 mt-0.5">
            <span>8</span><span>64</span>
          </div>
        </div>
        <div className="space-y-2">
          {[{ label: 'Mayúsculas', state: useUppercase, toggle: () => setUseUppercase(!useUppercase) },
            { label: 'Números', state: useNumbers, toggle: () => setUseNumbers(!useNumbers) },
            { label: 'Símbolos', state: useSymbols, toggle: () => setUseSymbols(!useSymbols) }].map(({ label, state, toggle }) => (
            <label key={label} className="flex items-center gap-2 cursor-pointer">
              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${state ? 'bg-signal-cyan/20 border-signal-cyan text-signal-cyan' : 'border-graphite/30'}`}>
                {state && <Check className="w-3 h-3" />}
              </div>
              <span className="text-[11px] font-mono text-ash/60">{label}</span>
              <input type="checkbox" checked={state} onChange={toggle} className="hidden" />
            </label>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={regenerate}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-semibold bg-signal-cyan/10 text-signal-cyan border border-signal-cyan/30 hover:brightness-125 transition-all duration-200 cursor-pointer">
          <RefreshCw className="w-4 h-4" /> Regenerar
        </button>
        <button onClick={copyPw}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[11px] font-semibold transition-all duration-200 cursor-pointer ${
            copied ? 'bg-signal-lime/10 text-signal-lime border border-signal-lime/30' : 'bg-carbon/30 text-ash/60 border border-graphite/20 hover:text-bone'
          }`}>
          {copied ? <><Check className="w-4 h-4" /> Copiada</> : <><Copy className="w-4 h-4" /> Copiar</>}
        </button>
      </div>
    </div>
  );
}

// ── Prompt Modal ────────────────────────────────────────────────────

interface PromptModalProps {
  prompt?: Prompt | null;
  folders: string[];
  categories: string[];
  onSave: (prompt: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onClose: () => void;
}

function PromptModal({ prompt, folders, categories, onSave, onClose }: PromptModalProps) {
  const [title, setTitle] = useState(prompt?.title ?? '');
  const [promptText, setPromptText] = useState(prompt?.prompt ?? '');
  const [category, setCategory] = useState(prompt?.category ?? categories[0] ?? 'General');
  const [folder, setFolder] = useState(prompt?.folder ?? '');
  const [tags, setTags] = useState(prompt?.tags.join(', ') ?? '');
  const [newCategory, setNewCategory] = useState('');
  const [newFolder, setNewFolder] = useState('');
  const [sotaLevel, setSotaLevel] = useState<'basic' | 'intermediate' | 'advanced' | 'sota' | ''>(prompt?.sotaLevel ?? '');
  const [showCatDropdown, setShowCatDropdown] = useState(false);
  const [showFoldDropdown, setShowFoldDropdown] = useState(false);
  const [showSotaDropdown, setShowSotaDropdown] = useState(false);

  const allCategories = [...new Set([...categories, ...DEFAULT_CATEGORIES])];
  const allFolders = folders;

  const handleSave = () => {
    if (!title.trim() || !promptText.trim()) return;
    const parsedTags = tags.split(',').map(t => t.trim()).filter(Boolean);
    const now = Date.now();
    onSave({
      title: title.trim(),
      prompt: promptText.trim(),
      category: category.trim(),
      folder: folder.trim(),
      tags: parsedTags,
      isFavorite: prompt?.isFavorite ?? false,
      sotaLevel: sotaLevel || undefined,
    } as Omit<Prompt, 'id' | 'createdAt' | 'updatedAt'>);
    onClose();
  };

  const overlayRef = useRef<HTMLDivElement>(null);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(5,7,11,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={e => { if (e.target === overlayRef.current) onClose(); }}
      ref={overlayRef}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-lg bg-carbon border border-graphite/40 rounded-2xl overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-graphite/20">
          <h2 className="text-sm font-semibold text-bone font-display">
            {prompt ? 'Editar Prompt' : 'Nuevo Prompt'}
          </h2>
          <button onClick={onClose} className="p-1.5 text-ash/40 hover:text-bone transition-colors cursor-pointer rounded-lg hover:bg-carbon/40">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Título */}
          <div>
            <label className="text-[9px] font-mono text-ash/40 uppercase tracking-wider block mb-1.5">Título *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="ej: Redactor de LinkedIn"
              className="w-full bg-graphite/30 border border-graphite/20 rounded-xl px-4 py-2.5 text-xs text-bone placeholder:text-ash/20 outline-none focus:border-signal-cyan/40 transition-colors font-display" />
          </div>

          {/* Prompt text */}
          <div>
            <label className="text-[9px] font-mono text-ash/40 uppercase tracking-wider block mb-1.5">Prompt *</label>
            <textarea value={promptText} onChange={e => setPromptText(e.target.value)} rows={5}
              placeholder="Actuá como un copywriter senior..."
              className="w-full bg-graphite/30 border border-graphite/20 rounded-xl px-4 py-2.5 text-xs text-bone placeholder:text-ash/20 outline-none focus:border-signal-cyan/40 transition-colors font-mono resize-none leading-relaxed" />
          </div>

          {/* Categoría */}
          <div>
            <label className="text-[9px] font-mono text-ash/40 uppercase tracking-wider block mb-1.5">Categoría</label>
            <div className="relative">
              <button onClick={() => setShowCatDropdown(!showCatDropdown)}
                className="w-full flex items-center justify-between bg-graphite/30 border border-graphite/20 rounded-xl px-4 py-2.5 text-xs text-bone hover:border-graphite/40 transition-colors cursor-pointer">
                <span>{category}</span>
                <ChevronDown className="w-3.5 h-3.5 text-ash/40" />
              </button>
              <AnimatePresence>
                {showCatDropdown && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    className="absolute top-full left-0 right-0 mt-1 bg-graphite/90 border border-graphite/30 rounded-xl overflow-hidden z-10">
                    {allCategories.map(c => (
                      <button key={c} onClick={() => { setCategory(c); setShowCatDropdown(false); }}
                        className={`w-full text-left px-4 py-2 text-xs transition-colors cursor-pointer ${c === category ? 'text-signal-cyan bg-signal-cyan/10' : 'text-bone hover:bg-carbon/50'}`}>
                        {c}
                      </button>
                    ))}
                    <div className="px-3 py-2 border-t border-graphite/20 flex gap-2">
                      <input type="text" value={newCategory} onChange={e => setNewCategory(e.target.value)}
                        placeholder="Nueva categoría..."
                        className="flex-1 bg-carbon/30 border border-graphite/20 rounded-lg px-2 py-1 text-xs text-bone placeholder:text-ash/20 outline-none"
                        onKeyDown={e => {
                          if (e.key === 'Enter' && newCategory.trim()) { setCategory(newCategory.trim()); setNewCategory(''); setShowCatDropdown(false); }
                        }} />
                      <button onClick={() => { if (newCategory.trim()) { setCategory(newCategory.trim()); setNewCategory(''); setShowCatDropdown(false); }}}
                        className="text-[10px] text-signal-cyan font-mono hover:text-signal-cyan/80 cursor-pointer">Añadir</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Carpeta */}
          <div>
            <label className="text-[9px] font-mono text-ash/40 uppercase tracking-wider block mb-1.5">Carpeta</label>
            <div className="relative">
              <button onClick={() => setShowFoldDropdown(!showFoldDropdown)}
                className="w-full flex items-center justify-between bg-graphite/30 border border-graphite/20 rounded-xl px-4 py-2.5 text-xs text-bone hover:border-graphite/40 transition-colors cursor-pointer">
                <span className="flex items-center gap-2">
                  {folder ? <Folder className="w-3.5 h-3.5 text-signal-cyan/60" /> : <span className="text-ash/40">Sin carpeta</span>}
                  {folder}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-ash/40" />
              </button>
              <AnimatePresence>
                {showFoldDropdown && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    className="absolute top-full left-0 right-0 mt-1 bg-graphite/90 border border-graphite/30 rounded-xl overflow-hidden z-10">
                    <button onClick={() => { setFolder(''); setShowFoldDropdown(false); }}
                      className={`w-full text-left px-4 py-2 text-xs transition-colors cursor-pointer ${!folder ? 'text-signal-cyan bg-signal-cyan/10' : 'text-bone hover:bg-carbon/50'}`}>
                      Sin carpeta
                    </button>
                    {allFolders.map(f => (
                      <button key={f} onClick={() => { setFolder(f); setShowFoldDropdown(false); }}
                        className={`w-full text-left px-4 py-2 text-xs transition-colors cursor-pointer ${f === folder ? 'text-signal-cyan bg-signal-cyan/10' : 'text-bone hover:bg-carbon/50'}`}>
                        <Folder className="w-3 h-3 inline mr-1.5 text-signal-cyan/60" />{f}
                      </button>
                    ))}
                    <div className="px-3 py-2 border-t border-graphite/20 flex gap-2">
                      <input type="text" value={newFolder} onChange={e => setNewFolder(e.target.value)}
                        placeholder="Nueva carpeta..."
                        className="flex-1 bg-carbon/30 border border-graphite/20 rounded-lg px-2 py-1 text-xs text-bone placeholder:text-ash/20 outline-none"
                        onKeyDown={e => {
                          if (e.key === 'Enter' && newFolder.trim()) { setFolder(newFolder.trim()); setNewFolder(''); setShowFoldDropdown(false); }
                        }} />
                      <button onClick={() => { if (newFolder.trim()) { setFolder(newFolder.trim()); setNewFolder(''); setShowFoldDropdown(false); }}}
                        className="text-[10px] text-signal-cyan font-mono hover:text-signal-cyan/80 cursor-pointer">Añadir</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* SOTA Level */}
          <div>
            <label className="text-[9px] font-mono text-ash/40 uppercase tracking-wider block mb-1.5">Nivel SOTA</label>
            <div className="relative">
              <button onClick={() => setShowSotaDropdown(!showSotaDropdown)}
                className="w-full flex items-center justify-between bg-graphite/30 border border-graphite/20 rounded-xl px-4 py-2.5 text-xs text-bone hover:border-graphite/40 transition-colors cursor-pointer">
                <span>{sotaLevel ? ({ sota: 'SOTA', advanced: 'Advanced', intermediate: 'Intermediate', basic: 'Basic' } as Record<string, string>)[sotaLevel] : '— Sin nivel —'}</span>
                <ChevronDown className="w-3.5 h-3.5 text-ash/40" />
              </button>
              <AnimatePresence>
                {showSotaDropdown && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    className="absolute top-full left-0 right-0 mt-1 bg-graphite/90 border border-graphite/30 rounded-xl overflow-hidden z-10">
                    <button onClick={() => { setSotaLevel(''); setShowSotaDropdown(false); }}
                      className={`w-full text-left px-4 py-2 text-xs transition-colors cursor-pointer ${!sotaLevel ? 'text-signal-cyan bg-signal-cyan/10' : 'text-bone hover:bg-carbon/50'}`}>
                      — Sin nivel —
                    </button>
                    {(['sota', 'advanced', 'intermediate', 'basic'] as const).map(level => (
                      <button key={level} onClick={() => { setSotaLevel(level); setShowSotaDropdown(false); }}
                        className={`w-full text-left px-4 py-2 text-xs transition-colors cursor-pointer ${sotaLevel === level ? 'text-signal-cyan bg-signal-cyan/10' : 'text-bone hover:bg-carbon/50'}`}>
                        {({ sota: 'SOTA', advanced: 'Advanced', intermediate: 'Intermediate', basic: 'Basic' } as Record<string, string>)[level]}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-[9px] font-mono text-ash/40 uppercase tracking-wider block mb-1.5">Tags <span className="text-ash/20">(separados por coma)</span></label>
            <input type="text" value={tags} onChange={e => setTags(e.target.value)}
              placeholder="linkedin, copy, marketing"
              className="w-full bg-graphite/30 border border-graphite/20 rounded-xl px-4 py-2.5 text-xs text-bone placeholder:text-ash/20 outline-none focus:border-signal-cyan/40 transition-colors font-mono" />
            {tags && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tags.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                  <span key={tag} className="text-[8px] font-mono text-signal-cyan/70 bg-signal-cyan/10 border border-signal-cyan/20 px-1.5 py-0.5 rounded">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-graphite/20 bg-carbon/50">
          <button onClick={onClose}
            className="px-4 py-2 rounded-xl text-[11px] font-semibold bg-carbon/30 text-ash/60 border border-graphite/20 hover:text-bone hover:border-graphite/40 transition-all cursor-pointer">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={!title.trim() || !promptText.trim()}
            className="px-5 py-2 rounded-xl text-[11px] font-semibold bg-signal-cyan/10 text-signal-cyan border border-signal-cyan/30 hover:brightness-125 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
            {prompt ? 'Guardar cambios' : 'Crear Prompt'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Prompt Library ─────────────────────────────────────────────────

type SortMode = 'name' | 'created' | 'updated' | 'area';

type SotaLevel = 'basic' | 'intermediate' | 'advanced' | 'sota';

function PromptLibrary() {
  const [prompts, setPrompts] = useState<Prompt[]>(() => loadPrompts());
  const [folders, setFolders] = useState<string[]>(() => loadFolders());
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'favorites' | SotaLevel | string>('all');
  const [sortMode, setSortMode] = useState<SortMode>('updated');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [addingFolder, setAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [toast, setToast] = useState<{ message: string; key: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persist on change
  useEffect(() => { savePrompts(prompts); }, [prompts]);
  useEffect(() => { saveFolders(folders); }, [folders]);

  // Toast auto-dismiss
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Collect unique categories from prompts
  // as string[] needed: Set spread from JSON-backed array loses type inference
  const categories = [...new Set(prompts.map(p => p.category))] as string[];

  // ── CRUD ──────────────────────────────────────────────────────

  const handleSavePrompt = useCallback((data: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = Date.now();
    const normalized = { ...data, title: toPascalCaseUnderscore(data.title) };
    if (editingPrompt) {
      setPrompts(prev => prev.map(p =>
        p.id === editingPrompt.id
          ? { ...p, ...normalized, sotaLevel: normalized.sotaLevel ?? p.sotaLevel, updatedAt: now }
          : p
      ));
    } else {
      const newPrompt: Prompt = {
        id: nanoid(8),
        ...normalized,
        createdAt: now,
        updatedAt: now,
      };
      setPrompts(prev => [newPrompt, ...prev]);
    }
    setEditingPrompt(null);
    setIsCreating(false);
  }, [editingPrompt]);

  const handleDeletePrompt = useCallback((id: string) => {
    setPrompts(prev => prev.filter(p => p.id !== id));
    setConfirmDelete(null);
  }, []);

  const handleToggleFavorite = useCallback((id: string) => {
    setPrompts(prev => prev.map(p =>
      p.id === id ? { ...p, isFavorite: !p.isFavorite, updatedAt: Date.now() } : p
    ));
  }, []);

  const handleAddFolder = () => {
    if (newFolderName.trim() && !folders.includes(newFolderName.trim())) {
      setFolders(prev => [...prev, newFolderName.trim()]);
    }
    setNewFolderName('');
    setAddingFolder(false);
  };

  const handleMoveToFolder = (promptId: string, targetFolder: string) => {
    setPrompts(prev => prev.map(p =>
      p.id === promptId ? { ...p, folder: targetFolder, updatedAt: Date.now() } : p
    ));
  };

  const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const ext = file.name.split('.').pop()?.toLowerCase();
    let text: string;
    try { text = await file.text(); } catch { return; }

    type ImportRow = Omit<Prompt, 'id' | 'createdAt' | 'updatedAt' | 'isFavorite'>;
    let parsed: ImportRow[] = [];

    try {
      if (ext === 'json') {
        const data = JSON.parse(text);
        if (Array.isArray(data)) {
          parsed = data.map((item: Record<string, any>) => ({
            title: item.title || 'Untitled',
            prompt: item.prompt || item.content || '',
            category: item.category || '',
            tags: Array.isArray(item.tags) ? item.tags : item.tags ? String(item.tags).split(',').map((t: string) => t.trim()).filter(Boolean) : [],
            folder: item.folder || '',
            sotaLevel: item.sotaLevel || undefined,
          }));
        } else if (typeof data === 'object' && data !== null) {
          // Key-value format: {"Prompt Name": "prompt content"}
          parsed = Object.entries(data).map(([title, prompt]) => ({
            title,
            prompt: String(prompt),
            category: '',
            tags: [],
            folder: '',
            sotaLevel: undefined,
          }));
        }
      } else if (ext === 'csv') {
        const lines = text.split('\n').filter(Boolean);
        if (lines.length > 1) {
          const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
          const titleIdx = headers.indexOf('title');
          const promptIdx = headers.indexOf('prompt');
          const catIdx = headers.indexOf('category');
          const tagsIdx = headers.indexOf('tags');
          const folderIdx = headers.indexOf('folder');
          const sotaIdx = headers.indexOf('sotalevel');
          for (let i = 1; i < lines.length; i++) {
            const cols = parseCSVLine(lines[i]);
            const title = cols[titleIdx] || '';
            const prompt = cols[promptIdx] || '';
            if (!title && !prompt) continue;
            parsed.push({
              title: title || 'Untitled',
              prompt: prompt || '',
              category: (cols[catIdx] || '').trim(),
              tags: cols[tagsIdx] ? cols[tagsIdx].split(';').map((t: string) => t.trim()).filter(Boolean) : [],
              folder: (cols[folderIdx] || '').trim(),
              sotaLevel: (cols[sotaIdx] as ImportRow['sotaLevel']) || undefined,
            });
          }
        }
      } else if (ext === 'md' || ext === 'txt') {
        const blocks = text.split(/(?=^# )/m);
        for (const block of blocks) {
          if (!block.trim()) continue;
          const titleMatch = block.match(/^# (.+)/m);
          const title = titleMatch ? titleMatch[1].trim() : 'Untitled';
          const content = block.replace(/^# .+(\n|$)/, '').replace(/^---\s*$/m, '').trim();
          if (content) {
            parsed.push({ title, prompt: content, category: '', tags: [], folder: '', sotaLevel: undefined });
          }
        }
      }
    } catch {
      setToast({ message: 'Error al importar: archivo inválido', key: Date.now() });
      return;
    }

    if (parsed.length === 0) {
      setToast({ message: 'No se encontraron prompts en el archivo', key: Date.now() });
      return;
    }

    setPrompts(prev => importMerge(prev, parsed));
    setToast({ message: `✓ ${parsed.length} prompts importados`, key: Date.now() });
  }, []);

  // ── Filter + Sort ─────────────────────────────────────────────

  const filtered = prompts
    .filter(p => {
      const matchSearch = !search ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.prompt.toLowerCase().includes(search.toLowerCase()) ||
        p.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
      const isSotaFilter = ['basic', 'intermediate', 'advanced', 'sota'].includes(activeFilter);
      const matchFilter =
        activeFilter === 'all' ||
        (activeFilter === 'favorites' && p.isFavorite) ||
        p.folder === activeFilter ||
        (isSotaFilter && p.sotaLevel === activeFilter);
      return matchSearch && matchFilter;
    })
    .sort((a, b) => {
      if (sortMode === 'name') return a.title.localeCompare(b.title);
      if (sortMode === 'created') return b.createdAt - a.createdAt;
      if (sortMode === 'area') return a.category.localeCompare(b.category) || a.title.localeCompare(b.title);
      return b.updatedAt - a.updatedAt;
    });

  const copyPrompt = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const sortLabel = { name: 'Nombre A→Z', created: 'Creación ↓', updated: 'Modificación ↓', area: 'Área A→Z' }[sortMode];

  const sotaBadgeClass = (level: SotaLevel): string => {
    const map: Record<SotaLevel, string> = {
      sota: 'text-signal-amber bg-signal-amber/10 border border-signal-amber/20',
      advanced: 'text-signal-cyan bg-signal-cyan/8 border border-signal-cyan/15',
      intermediate: 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/20',
      basic: 'text-ash/50 bg-carbon/30 border border-graphite/15',
    };
    return map[level];
  };

  return (
    <>
      <AnimatePresence>
        {(isCreating || editingPrompt) && (
          <PromptModal
            prompt={editingPrompt}
            folders={folders}
            categories={categories}
            onSave={handleSavePrompt}
            onClose={() => { setEditingPrompt(null); setIsCreating(false); }}
          />
        )}
      </AnimatePresence>

      <div className="flex h-full gap-0">
        {/* ── Folder Sidebar ── */}
        <div className="w-[170px] shrink-0 border-r border-graphite/15 flex flex-col py-2 pr-3">
          {/* Favorites */}
          <button
            onClick={() => setActiveFilter('favorites')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] transition-all cursor-pointer mx-1 mb-1 ${
              activeFilter === 'favorites'
                ? 'bg-signal-amber/10 text-signal-amber border border-signal-amber/20'
                : 'text-ash/60 hover:text-bone hover:bg-carbon/20'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${activeFilter === 'favorites' ? 'text-signal-amber fill-signal-amber' : ''}`} />
            Favoritos
            <span className="ml-auto text-[9px] font-mono opacity-60">
              {prompts.filter(p => p.isFavorite).length}
            </span>
          </button>

          {/* All */}
          <button
            onClick={() => setActiveFilter('all')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] transition-all cursor-pointer mx-1 mb-3 ${
              activeFilter === 'all'
                ? 'bg-signal-cyan/10 text-signal-cyan border border-signal-cyan/20'
                : 'text-ash/60 hover:text-bone hover:bg-carbon/20'
            }`}
          >
            <AlignLeft className="w-3.5 h-3.5" />
            Todos
            <span className="ml-auto text-[9px] font-mono opacity-60">{prompts.length}</span>
          </button>

          {/* SOTA Level filter */}
          <div className="text-[9px] font-mono text-ash/30 uppercase tracking-wider px-3 mt-4 mb-1.5">Nivel SOTA</div>
          <div className="flex flex-wrap gap-1 px-1 mb-3">
            {(['sota', 'advanced', 'intermediate', 'basic'] as SotaLevel[]).map(level => {
              const count = prompts.filter(p => p.sotaLevel === level).length;
              const labels: Record<SotaLevel, string> = { sota: 'SOTA', advanced: 'Advanced', intermediate: 'Intermediate', basic: 'Basic' };
              return (
                <button key={level}
                  onClick={() => setActiveFilter(activeFilter === level ? 'all' : level)}
                  className={`text-[9px] font-mono px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                    activeFilter === level
                      ? 'bg-signal-cyan/10 text-signal-cyan border-signal-cyan/20'
                      : 'text-ash/50 border-graphite/15 hover:text-bone hover:border-graphite/30'
                  }`}
                >
                  {labels[level]}
                  <span className="ml-1 opacity-50">{count}</span>
                </button>
              );
            })}
          </div>

          <div className="text-[9px] font-mono text-ash/30 uppercase tracking-wider px-3 mb-1.5">Carpetas</div>

          {/* Folder list */}
          <div className="flex-1 overflow-y-auto space-y-0.5 px-1">
            {folders.map(folder => {
              const count = prompts.filter(p => p.folder === folder).length;
              return (
                <div key={folder} className="group relative">
                  <button
                    onClick={() => setActiveFilter(folder)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[10px] transition-all cursor-pointer ${
                      activeFilter === folder
                        ? 'bg-signal-cyan/10 text-signal-cyan border border-signal-cyan/15'
                        : 'text-ash/60 hover:text-bone hover:bg-carbon/20'
                    }`}
                  >
                    <Folder className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate flex-1 text-left">{folder}</span>
                    <span className="text-[9px] font-mono opacity-50">{count}</span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Add folder */}
          <div className="px-1 mt-2">
            {addingFolder ? (
              <div className="flex gap-1.5 px-1">
                <input
                  type="text"
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  placeholder="Nombre..."
                  autoFocus
                  className="flex-1 bg-carbon/40 border border-graphite/20 rounded-lg px-2 py-1 text-[10px] text-bone placeholder:text-ash/20 outline-none focus:border-signal-cyan/40"
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleAddFolder();
                    if (e.key === 'Escape') { setAddingFolder(false); setNewFolderName(''); }
                  }}
                />
                <button onClick={handleAddFolder}
                  className="text-[10px] text-signal-cyan font-mono hover:text-signal-cyan/80 cursor-pointer shrink-0">Añadir</button>
              </div>
            ) : (
              <button onClick={() => setAddingFolder(true)}
                className="flex items-center gap-1.5 px-2 py-1.5 text-[10px] text-ash/40 hover:text-signal-cyan transition-colors cursor-pointer w-full rounded-lg hover:bg-carbon/20">
                <FolderPlus className="w-3.5 h-3.5" />
                Nueva carpeta
              </button>
            )}
          </div>
        </div>

        {/* ── Main Content ── */}
        <div className="flex-1 flex flex-col min-w-0 pl-4">
          {/* Header: Search + Sort + New */}
          <div className="flex items-center gap-2 mb-4 shrink-0">
            <div className="flex-1 relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ash/40" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar prompts…"
                className="w-full bg-carbon/30 border border-graphite/20 rounded-xl pl-9 pr-4 py-2.5 text-xs text-bone font-mono placeholder:text-ash/20 outline-none focus:border-signal-cyan/40 transition-colors"
              />
            </div>

            {/* Sort */}
            <div className="relative">
              <button
                onClick={() => setShowSortMenu(!showSortMenu)}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-[10px] font-mono text-ash/60 bg-carbon/30 border border-graphite/20 hover:text-bone hover:border-graphite/40 transition-all cursor-pointer"
              >
                <SortAsc className="w-3.5 h-3.5" />
                {sortLabel}
              </button>
              <AnimatePresence>
                {showSortMenu && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    className="absolute top-full right-0 mt-1 bg-graphite/90 border border-graphite/30 rounded-xl overflow-hidden z-20 min-w-[150px]">
                    {([['name','Nombre A→Z', SortAsc], ['created','Creación ↓', Calendar], ['updated','Modificación ↓', Calendar], ['area','Área A→Z', LayoutGrid]] as [SortMode, string, any][]).map(([key, label]) => (
                      <button key={key} onClick={() => { setSortMode(key); setShowSortMenu(false); }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-[10px] font-mono transition-colors cursor-pointer ${
                          sortMode === key ? 'text-signal-cyan bg-signal-cyan/10' : 'text-bone hover:bg-carbon/50'
                        }`}>
                        {label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Export dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-[11px] font-semibold bg-carbon/30 text-ash/60 border border-graphite/20 hover:text-bone hover:border-graphite/40 transition-all cursor-pointer shrink-0"
                title="Exportar prompts"
              >
                <Upload className="w-3.5 h-3.5" />
              </button>
              <AnimatePresence>
                {showExportMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute top-full right-0 mt-1 bg-graphite/90 border border-graphite/30 rounded-xl overflow-hidden z-20 min-w-[140px]"
                  >
                    <button
                      onClick={() => { exportJSON(prompts); setShowExportMenu(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-mono text-bone hover:bg-carbon/50 transition-colors cursor-pointer"
                    >
                      <FileJson className="w-3.5 h-3.5" /> JSON
                    </button>
                    <button
                      onClick={() => { exportCSV(prompts); setShowExportMenu(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-mono text-bone hover:bg-carbon/50 transition-colors cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" /> CSV
                    </button>
                    <button
                      onClick={() => { exportMarkdown(prompts); setShowExportMenu(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-mono text-bone hover:bg-carbon/50 transition-colors cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" /> Markdown
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Import */}
            <input ref={fileInputRef} type="file" accept=".json,.csv,.md,.txt" onChange={handleImport} className="hidden" />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-[11px] font-semibold bg-carbon/30 text-ash/60 border border-graphite/20 hover:text-bone hover:border-graphite/40 transition-all cursor-pointer shrink-0"
              title="Importar prompts"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            {/* New prompt */}
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[11px] font-semibold bg-signal-cyan/10 text-signal-cyan border border-signal-cyan/30 hover:brightness-125 transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Nuevo
            </button>
          </div>

          {/* Grid */}
          <div className="flex-1 overflow-y-auto pr-1">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <p className="text-sm text-ash/40 font-mono mb-2">
                  {search ? `No se encontraron prompts para "${search}"` : 'No hay prompts en esta carpeta'}
                </p>
                <button onClick={() => setIsCreating(true)}
                  className="text-[11px] text-signal-cyan font-mono hover:underline cursor-pointer">
                  + Crear el primero
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pb-4">
                <AnimatePresence mode="popLayout">
                  {filtered.map(p => (
                    <motion.div
                      key={p.id}
                      layout
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-carbon/25 border border-graphite/15 rounded-xl p-4 hover:border-graphite/30 transition-all group relative"
                    >
                      {/* Card header */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-bone font-display flex items-center gap-1.5">
                            {p.isFavorite && <Star className="w-3 h-3 text-signal-amber fill-signal-amber shrink-0" />}
                            <span className="truncate">{p.title}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-[9px] font-mono text-signal-cyan/70 bg-signal-cyan/8 px-1.5 py-0.5 rounded">{p.category}</span>
                            {p.sotaLevel && (
                              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${sotaBadgeClass(p.sotaLevel)}`}>
                                {p.sotaLevel === 'sota' ? 'SOTA' : p.sotaLevel.charAt(0).toUpperCase() + p.sotaLevel.slice(1)}
                              </span>
                            )}
                            {p.folder && (
                              <span className="text-[9px] font-mono text-ash/40 bg-carbon/30 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                <Folder className="w-2.5 h-2.5" />{p.folder}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-0.5 shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleToggleFavorite(p.id)}
                            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                              p.isFavorite
                                ? 'text-signal-amber hover:text-signal-amber/70'
                                : 'text-ash/40 hover:text-bone hover:bg-carbon/40'
                            }`}
                          >
                            {p.isFavorite ? <StarOff className="w-3.5 h-3.5" /> : <Star className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => setEditingPrompt(p)}
                            className="p-1.5 rounded-lg text-ash/40 hover:text-bone hover:bg-carbon/40 transition-all cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {confirmDelete === p.id ? (
                            <div className="flex items-center gap-1 bg-signal-magenta/10 border border-signal-magenta/30 rounded-lg px-1.5 py-1">
                              <button
                                onClick={() => handleDeletePrompt(p.id)}
                                className="text-[9px] font-mono text-signal-magenta hover:text-signal-magenta/70 cursor-pointer"
                              >Sí</button>
                              <span className="text-ash/30">·</span>
                              <button
                                onClick={() => setConfirmDelete(null)}
                                className="text-[9px] font-mono text-ash/40 hover:text-bone cursor-pointer"
                              >No</button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDelete(p.id)}
                              className="p-1.5 rounded-lg text-ash/40 hover:text-signal-magenta hover:bg-signal-magenta/10 transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Prompt text */}
                      <p className="text-[10px] font-mono text-ash/60 leading-relaxed line-clamp-3 mb-2">
                        {p.prompt}
                      </p>

                      {/* Tags + copy */}
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-1">
                          {p.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="text-[8px] font-mono text-ash/30 bg-carbon/20 px-1.5 py-0.5 rounded">
                              #{tag}
                            </span>
                          ))}
                          {p.tags.length > 3 && (
                            <span className="text-[8px] font-mono text-ash/20">+{p.tags.length - 3}</span>
                          )}
                        </div>
                        <button
                          onClick={() => copyPrompt(p.id, p.prompt)}
                          className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                            copiedId === p.id
                              ? 'text-signal-lime bg-signal-lime/10'
                              : 'text-ash/40 hover:text-bone hover:bg-carbon/40'
                          }`}
                        >
                          {copiedId === p.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-bone/90 backdrop-blur-md text-carbon text-[11px] font-semibold font-display px-5 py-2.5 rounded-xl shadow-2xl"
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ── Main ToolsView ─────────────────────────────────────────────────

interface ToolsViewComponentProps extends ToolsViewProps {
  initialTool?: string;
}

export default function ToolsView({ accent, onLogMessage, initialTool }: ToolsViewComponentProps) {
  const [activeTool, setActiveTool] = useState(initialTool || 'prompts');

  const getAccentClasses = () => {
    switch (accent) {
      case 'magenta': return 'bg-signal-magenta/10 text-signal-magenta border-signal-magenta/30';
      case 'lime': return 'bg-signal-lime/10 text-signal-lime border-signal-lime/30';
      case 'amber': return 'bg-signal-amber/10 text-signal-amber border-signal-amber/30';
      default: return 'bg-signal-cyan/10 text-signal-cyan border-signal-cyan/30';
    }
  };

  const activeDef = TOOLS.find(t => t.id === activeTool) ?? TOOLS[0];

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-void">
      {/* ── Tool Sidebar ── */}
      <div className="w-[200px] border-r border-graphite/20 shrink-0 overflow-y-auto py-4 px-3">
        <div className="text-[9px] font-mono text-ash/40 uppercase tracking-wider px-2 mb-3">Tools</div>
        <div className="space-y-1">
          {TOOLS.map(tool => {
            const Icon = tool.icon;
            const active = activeTool === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => {
                  setActiveTool(tool.id);
                  onLogMessage('info', `Tools: Cambiado a ${tool.label}`);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all duration-200 cursor-pointer ${
                  active
                    ? getAccentClasses()
                    : 'text-ash hover:text-bone hover:bg-carbon/30'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold truncate">{tool.label}</div>
                  <div className="text-[8px] font-mono text-ash/40 truncate">{tool.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tool Content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-graphite/20 shrink-0">
          <div>
            <h1 className="text-lg font-semibold font-display text-bone flex items-center gap-2">
              <activeDef.icon className="w-5 h-5 text-signal-cyan" />
              {activeDef.label}
            </h1>
            <p className="text-[10px] font-mono text-ash/60 mt-0.5">{activeDef.desc}</p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden px-6 py-4">
          {activeTool === 'prompts' && <PromptLibrary />}
          {activeTool === 'image-edit' && <PhotoEditor accent={accent} onLogMessage={onLogMessage} />}
          {activeTool === 'remove-bg' && <RemoveBgMock />}
          {activeTool === 'qr' && <QrGeneratorMock />}
          {activeTool === 'passwords' && <PasswordGenerator />}
          {activeTool === 'skills' && <SkillsLibrary />}
          {activeTool === 'tabs' && <ConsequenceTabs onLogMessage={onLogMessage} />}
        </div>
      </div>
    </div>
  );
}
