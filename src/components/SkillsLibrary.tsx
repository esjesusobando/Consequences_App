import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Copy,
  Check,
  ChevronDown,
  SortAsc,
  Calendar,
  LayoutGrid,
  Upload,
  Download,
  Plus,
  Trash2,
  Edit3,
  Star,
  StarOff,
  Folder,
  FolderPlus,
  FileJson,
  FileText,
  X,
  AlignLeft,
  Cpu,
  Zap,
  FileCode,
  FolderOpen,
} from 'lucide-react';
import { nanoid } from 'nanoid';
import seedSkills from '../seed-skills.json';
import { safeSet } from '../lib/storage';
import CodeMirror from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { jsonLanguage } from '@codemirror/lang-json';
import { EditorView } from '@codemirror/view';

// ── SKILL.md parser ───────────────────────────────────────────────────

function parseSkillMdContent(text: string): { name: string; trigger: string; description: string; content: string } {
  const lines = text.split('\n');
  let fm: Record<string, string> = {};
  let contentStart = 0;
  if (lines[0]?.trim() === '---') {
    let endIdx = -1;
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '---') { endIdx = i; break; }
    }
    if (endIdx > 0) {
      for (let i = 1; i < endIdx; i++) {
        const line = lines[i].trim();
        const colonIdx = line.indexOf(':');
        if (colonIdx > 0) {
          const key = line.slice(0, colonIdx).trim().toLowerCase();
          const val = line.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, '');
          fm[key] = val;
        }
      }
      contentStart = endIdx + 1;
    }
  }
  const body = lines.slice(contentStart).join('\n').trim();

  // Extract trigger from first ~15 lines if not in frontmatter
  let trigger = fm['trigger'] || '';
  if (!trigger) {
    const head = body.split('\n').slice(0, 15).join('\n').toLowerCase();
    const match = head.match(/trigger[:\s]+(.+?)(?:\n|$)/i);
    if (match) trigger = match[1].trim();
  }

  return {
    name: fm['name'] || '',
    trigger,
    description: fm['description'] || '',
    content: body,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
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

// ── Types ────────────────────────────────────────────────────────────

type SotaLevel = 'basic' | 'intermediate' | 'advanced' | 'sota';

interface Skill {
  id: string;
  name: string;
  trigger: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  folder: string;
  isFavorite: boolean;
  sotaLevel?: SotaLevel;
  sourcePath: string;
  createdAt: number;
  updatedAt: number;
}

type SortMode = 'name' | 'created' | 'updated' | 'area';

// ── Seed data — 233 skills reales escaneadas del sistema ─────────────

const SEED_SKILLS: Skill[] = seedSkills.filter((s: any) => s.id && s.name).map((s: any) => ({
  ...s,
  tags: Array.isArray(s.tags) ? s.tags : [],
  isFavorite: false,
}));

const DEFAULT_CATEGORIES = ['Marketing', 'Diseño', 'Dev', 'General', 'Estrategia', 'Config', 'System'];

// ── Storage ──────────────────────────────────────────────────────────

const STORAGE_KEY = 'zc_skills';
const FOLDERS_KEY = 'zc_skill_folders';
const VERSION_KEY = 'zc_skills_version';
const SEED_VERSION = '20260704'; // bump when seed data changes
// NOTE: VERSION_KEY must stay raw localStorage.setItem (inline try/catch).
// safeSet JSON-stringifies values; readers here compare getItem(VERSION_KEY)
// === SEED_VERSION with strict equality. Switching to safeSet would store
// '"20260704"' and trigger a permanent reseed loop. Same rule applies to
// 'zc_project_name' in DashboardView — raw readers expect a raw string.

function loadSkills(): Skill[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const version = localStorage.getItem(VERSION_KEY);
    if (raw && version === SEED_VERSION) {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) throw new Error('not an array');
      const stored: Skill[] = parsed;
      if (stored.length < SEED_SKILLS.length) {
        const storedIds = new Set(stored.map(s => s.id));
        const missing = SEED_SKILLS.filter(s => !storedIds.has(s.id));
        const merged = [...stored, ...missing];
        // Only stamp the seed version when the data write succeeded —
        // otherwise a failed write + stamped version = silent data loss on reload.
        if (safeSet(STORAGE_KEY, merged)) {
          try { localStorage.setItem(VERSION_KEY, SEED_VERSION); } catch { /* quota */ }
        }
        return merged;
      }
      return stored;
    }
  } catch { /* corrupted — fall through to fresh seed */ }
  // Fresh seed — replaces stale or missing cache
  const seeds = SEED_SKILLS;
  if (safeSet(STORAGE_KEY, seeds)) {
    try { localStorage.setItem(VERSION_KEY, SEED_VERSION); } catch { /* quota */ }
  }
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

function saveSkills(skills: Skill[]) {
  safeSet(STORAGE_KEY, skills);
}

function saveFolders(folders: string[]) {
  safeSet(FOLDERS_KEY, folders);
}

// ── Export ───────────────────────────────────────────────────────────

function exportJSON(skills: Skill[]) {
  const data = skills.map(({ id, name, trigger, description, content, category, tags, folder, sotaLevel, createdAt, updatedAt }) => ({
    id, name, trigger, description, content, category, tags, folder, sotaLevel, createdAt, updatedAt,
  }));
  downloadFile(JSON.stringify(data, null, 2), 'skills.json', 'application/json');
}

function exportCSV(skills: Skill[]) {
  const header = 'name,trigger,description,category,tags,folder,sotaLevel,createdAt,updatedAt,content';
  const rows = skills.map(s => {
    const escapedContent = `"${s.content.replace(/"/g, '""')}"`;
    const escapedTrigger = `"${s.trigger.replace(/"/g, '""')}"`;
    const escapedDesc = `"${s.description.replace(/"/g, '""')}"`;
    const escapedTags = `"${s.tags.join(';')}"`;
    return `${s.name},${escapedTrigger},${escapedDesc},${s.category},${escapedTags},${s.folder},${s.sotaLevel || ''},${s.createdAt},${s.updatedAt},${escapedContent}`;
  });
  downloadFile([header, ...rows].join('\n'), 'skills.csv', 'text/csv');
}

function exportMarkdown(skills: Skill[]) {
  const md = skills.map(s => {
    let block = `# ${s.name}\n\n`;
    block += `**Trigger:** ${s.trigger}\n\n`;
    block += `**Category:** ${s.category}\n`;
    if (s.sotaLevel) block += `**Level:** ${s.sotaLevel === 'sota' ? 'SOTA' : s.sotaLevel.charAt(0).toUpperCase() + s.sotaLevel.slice(1)}\n`;
    block += `\n${s.description}\n\n---\n`;
    return block;
  }).join('\n');
  downloadFile(md, 'skills.md', 'text/markdown');
}

function exportSingleSkillMD(skill: Skill) {
  let md = `# ${skill.name}\n\n`;
  if (skill.trigger) md += `**Trigger:** ${skill.trigger}\n\n`;
  if (skill.category) md += `**Category:** ${skill.category}\n`;
  if (skill.sotaLevel) {
    const label = skill.sotaLevel === 'sota' ? 'SOTA' : skill.sotaLevel.charAt(0).toUpperCase() + skill.sotaLevel.slice(1);
    md += `**Level:** ${label}\n`;
  }
  if (skill.tags.length) md += `**Tags:** ${skill.tags.join(', ')}\n`;
  md += `\n${skill.content}\n`;
  downloadFile(md, `${skill.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.md`, 'text/markdown');
}

function importMerge(existing: Skill[], imported: Omit<Skill, 'id' | 'createdAt' | 'updatedAt' | 'isFavorite'>[]): Skill[] {
  const now = Date.now();
  const existingNames = new Set(existing.map(s => s.name.toLowerCase()));
  const newSkills: Skill[] = [];
  for (const s of imported) {
    if (s.name && !existingNames.has(s.name.toLowerCase())) {
      newSkills.push({
        id: nanoid(8),
        ...s,
        isFavorite: false,
        createdAt: now,
        updatedAt: now,
      });
      existingNames.add(s.name.toLowerCase());
    }
  }
  return [...newSkills, ...existing];
}

// ── Skill Modal ──────────────────────────────────────────────────────

interface SkillModalProps {
  skill?: Skill | null;
  folders: string[];
  categories: string[];
  onSave: (data: Omit<Skill, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onClose: () => void;
}

function SkillModal({ skill, folders, categories, onSave, onClose }: SkillModalProps) {
  const [name, setName] = useState(skill?.name ?? '');
  const [trigger, setTrigger] = useState(skill?.trigger ?? '');
  const [description, setDescription] = useState(skill?.description ?? '');
  const [content, setContent] = useState(skill?.content ?? '');
  const [category, setCategory] = useState(skill?.category ?? categories[0] ?? 'General');
  const [folder, setFolder] = useState(skill?.folder ?? '');
  const [tags, setTags] = useState(skill?.tags.join(', ') ?? '');
  const [newCategory, setNewCategory] = useState('');
  const [newFolder, setNewFolder] = useState('');
  const [sotaLevel, setSotaLevel] = useState<SotaLevel | ''>(skill?.sotaLevel ?? '');
  const [showCatDropdown, setShowCatDropdown] = useState(false);
  const [showFoldDropdown, setShowFoldDropdown] = useState(false);
  const [showSotaDropdown, setShowSotaDropdown] = useState(false);

  const allCategories = [...new Set([...categories, ...DEFAULT_CATEGORIES])];
  const allFolders = folders;

  const handleSave = () => {
    if (!name.trim() || !content.trim()) return;
    const parsedTags = tags.split(',').map(t => t.trim()).filter(Boolean);
    const now = Date.now();
    onSave({
      name: name.trim(),
      trigger: trigger.trim(),
      description: description.trim(),
      content: content.trim(),
      category: category.trim(),
      folder: folder.trim(),
      tags: parsedTags,
      isFavorite: skill?.isFavorite ?? false,
      sotaLevel: sotaLevel || undefined,
      sourcePath: skill?.sourcePath ?? '',
    } as Omit<Skill, 'id' | 'createdAt' | 'updatedAt'>);
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
        className="w-full max-w-2xl bg-carbon border border-graphite/40 rounded-2xl overflow-hidden shadow-2xl"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-graphite/20">
          <h2 className="text-sm font-semibold text-bone font-display">
            {skill ? 'Editar Skill' : 'Nueva Skill'}
          </h2>
          <button onClick={onClose} className="p-1.5 text-ash/40 hover:text-bone transition-colors cursor-pointer rounded-lg hover:bg-carbon/40">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Name */}
          <div>
            <label className="text-[9px] font-mono text-ash/40 uppercase tracking-wider block mb-1.5">Nombre *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="ej: seo-audit"
              className="w-full bg-graphite/30 border border-graphite/20 rounded-xl px-4 py-2.5 text-xs text-bone placeholder:text-ash/20 outline-none focus:border-signal-cyan/40 transition-colors font-mono" />
          </div>

          {/* Trigger */}
          <div>
            <label className="text-[9px] font-mono text-ash/40 uppercase tracking-wider block mb-1.5">Trigger / Comando</label>
            <input type="text" value={trigger} onChange={e => setTrigger(e.target.value)} placeholder="ej: /audit, audit this site, SEO analysis"
              className="w-full bg-graphite/30 border border-graphite/20 rounded-xl px-4 py-2.5 text-xs text-bone placeholder:text-ash/20 outline-none focus:border-signal-cyan/40 transition-colors font-mono" />
          </div>

          {/* Description */}
          <div>
            <label className="text-[9px] font-mono text-ash/40 uppercase tracking-wider block mb-1.5">Descripción corta</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Breve descripción de qué hace esta skill"
              className="w-full bg-graphite/30 border border-graphite/20 rounded-xl px-4 py-2.5 text-xs text-bone placeholder:text-ash/20 outline-none focus:border-signal-cyan/40 transition-colors" />
          </div>

          {/* Content — editor tipo Cursor/Word */}
          <div>
            <label className="text-[9px] font-mono text-ash/40 uppercase tracking-wider block mb-1.5">Contenido de la Skill *</label>
            <div className="border border-graphite/20 rounded-xl overflow-hidden">
              <CodeMirror
                value={content}
                onChange={(val) => setContent(val)}
                height="300px"
                theme="dark"
                extensions={[
                  markdown({ base: markdownLanguage }),
                  EditorView.lineWrapping,
                ]}
                basicSetup={{
                  lineNumbers: true,
                  foldGutter: true,
                  highlightActiveLine: true,
                  autocompletion: true,
                }}
              />
            </div>
          </div>

          {/* Categoría */}
          <div className="grid grid-cols-2 gap-4">
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
              placeholder="seo, audit, marketing"
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

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-graphite/20 bg-carbon/50">
          <button onClick={onClose}
            className="px-4 py-2 rounded-xl text-[11px] font-semibold bg-carbon/30 text-ash/60 border border-graphite/20 hover:text-bone hover:border-graphite/40 transition-all cursor-pointer">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={!name.trim() || !content.trim()}
            className="px-5 py-2 rounded-xl text-[11px] font-semibold bg-signal-cyan/10 text-signal-cyan border border-signal-cyan/30 hover:brightness-125 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
            {skill ? 'Guardar cambios' : 'Crear Skill'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Skills Library ───────────────────────────────────────────────────

export default function SkillsLibrary() {
  const [skills, setSkills] = useState<Skill[]>(() => loadSkills());
  const [folders, setFolders] = useState<string[]>(() => loadFolders());
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'favorites' | SotaLevel | string>('all');
  const [sortMode, setSortMode] = useState<SortMode>('updated');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [addingFolder, setAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [toast, setToast] = useState<{ message: string; key: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { saveSkills(skills); }, [skills]);
  useEffect(() => { saveFolders(folders); }, [folders]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // as string[] needed: Set spread from JSON-backed array loses type inference
  const categories = [...new Set(skills.map(s => s.category))] as string[];

  // ── CRUD ──

  const handleSaveSkill = useCallback((data: Omit<Skill, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = Date.now();
    if (editingSkill) {
      setSkills(prev => prev.map(s =>
        s.id === editingSkill.id
          ? { ...s, ...data, sotaLevel: data.sotaLevel ?? s.sotaLevel, updatedAt: now }
          : s
      ));
    } else {
      const newSkill: Skill = {
        id: nanoid(8),
        ...data,
        createdAt: now,
        updatedAt: now,
      };
      setSkills(prev => [newSkill, ...prev]);
    }
    setEditingSkill(null);
    setIsCreating(false);
  }, [editingSkill]);

  const handleDeleteSkill = useCallback((id: string) => {
    setSkills(prev => prev.filter(s => s.id !== id));
    setConfirmDelete(null);
  }, []);

  const handleToggleFavorite = useCallback((id: string) => {
    setSkills(prev => prev.map(s =>
      s.id === id ? { ...s, isFavorite: !s.isFavorite, updatedAt: Date.now() } : s
    ));
  }, []);

  const handleAddFolder = () => {
    if (newFolderName.trim() && !folders.includes(newFolderName.trim())) {
      setFolders(prev => [...prev, newFolderName.trim()]);
    }
    setNewFolderName('');
    setAddingFolder(false);
  };

  const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const ext = file.name.split('.').pop()?.toLowerCase();
    let text: string;
    try { text = await file.text(); } catch { return; }

    type ImportRow = Omit<Skill, 'id' | 'createdAt' | 'updatedAt' | 'isFavorite'>;
    let parsed: ImportRow[] = [];

    try {
      if (ext === 'json') {
        const data = JSON.parse(text);
        if (Array.isArray(data)) {
          parsed = data.map((item: Record<string, any>) => ({
            name: item.name || item.title || 'Untitled',
            trigger: item.trigger || '',
            description: item.description || '',
            content: item.content || item.prompt || '',
            category: item.category || '',
            tags: Array.isArray(item.tags) ? item.tags : item.tags ? String(item.tags).split(',').map((t: string) => t.trim()).filter(Boolean) : [],
            folder: item.folder || '',
            sotaLevel: item.sotaLevel || undefined,
            sourcePath: item.sourcePath || '',
          }));
        }
      } else if (ext === 'csv') {
        const lines = text.split('\n').filter(Boolean);
        if (lines.length > 1) {
          const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
          const nameIdx = headers.indexOf('name');
          const triggerIdx = headers.indexOf('trigger');
          const descIdx = headers.indexOf('description');
          const catIdx = headers.indexOf('category');
          const tagsIdx = headers.indexOf('tags');
          const folderIdx = headers.indexOf('folder');
          const sotaIdx = headers.indexOf('sotalevel');
          const contentIdx = headers.indexOf('content');
          for (let i = 1; i < lines.length; i++) {
            const cols = parseCSVLine(lines[i]);
            const name = cols[nameIdx] || '';
            const content = cols[contentIdx] || '';
            if (!name && !content) continue;
            parsed.push({
              name: name || 'Untitled',
              trigger: (cols[triggerIdx] || '').trim(),
              description: (cols[descIdx] || '').trim(),
              content: content || '',
              category: (cols[catIdx] || '').trim(),
              tags: cols[tagsIdx] ? cols[tagsIdx].split(';').map((t: string) => t.trim()).filter(Boolean) : [],
              folder: (cols[folderIdx] || '').trim(),
              sotaLevel: (cols[sotaIdx] as ImportRow['sotaLevel']) || undefined,
              sourcePath: '',
            });
          }
        }
      } else if (ext === 'md' || ext === 'txt') {
        const blocks = text.split(/(?=^# )/m);
        for (const block of blocks) {
          if (!block.trim()) continue;
          const nameMatch = block.match(/^# (.+)/m);
          const name = nameMatch ? nameMatch[1].trim() : 'Untitled';
          const content = block.replace(/^# .+(\n|$)/, '').replace(/^---\s*$/m, '').trim();
          if (content) {
            parsed.push({ name, trigger: '', description: '', content, category: '', tags: [], folder: '', sotaLevel: undefined, sourcePath: '' });
          }
        }
      }
    } catch {
      setToast({ message: 'Error al importar: archivo inválido', key: Date.now() });
      return;
    }

    if (parsed.length === 0) {
      setToast({ message: 'No se encontraron skills en el archivo', key: Date.now() });
      return;
    }

    setSkills(prev => importMerge(prev, parsed));
    setToast({ message: `✓ ${parsed.length} skills importadas`, key: Date.now() });
  }, []);

  // ── Filter + Sort ──

  const filtered = skills
    .filter(s => {
      const q = search.toLowerCase();
      const matchSearch = !search ||
        s.name.toLowerCase().includes(q) ||
        (s.description || '').toLowerCase().includes(q) ||
        (s.trigger || '').toLowerCase().includes(q) ||
        s.content.toLowerCase().includes(q) ||
        s.tags.some(t => t.toLowerCase().includes(q));
      const isSotaFilter = ['basic', 'intermediate', 'advanced', 'sota'].includes(activeFilter);
      const matchFilter =
        activeFilter === 'all' ||
        (activeFilter === 'favorites' && s.isFavorite) ||
        s.folder === activeFilter ||
        (isSotaFilter && s.sotaLevel === activeFilter);
      return matchSearch && matchFilter;
    })
    .sort((a, b) => {
      if (sortMode === 'name') return a.name.localeCompare(b.name);
      if (sortMode === 'created') return b.createdAt - a.createdAt;
      if (sortMode === 'area') return a.category.localeCompare(b.category) || a.name.localeCompare(b.name);
      return b.updatedAt - a.updatedAt;
    });

  const copyTrigger = (id: string) => {
    const skill = skills.find(s => s.id === id);
    if (!skill) return;
    navigator.clipboard.writeText(skill.trigger);
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
        {(isCreating || editingSkill) && (
          <SkillModal
            skill={editingSkill}
            folders={folders}
            categories={categories}
            onSave={handleSaveSkill}
            onClose={() => { setEditingSkill(null); setIsCreating(false); }}
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
            <span className="ml-auto text-[9px] font-mono opacity-60">{skills.filter(s => s.isFavorite).length}</span>
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
            Todas
            <span className="ml-auto text-[9px] font-mono opacity-60">{skills.length}</span>
          </button>

          {/* SOTA Level filter */}
          <div className="text-[9px] font-mono text-ash/30 uppercase tracking-wider px-3 mt-4 mb-1.5">Nivel SOTA</div>
          <div className="flex flex-wrap gap-1 px-1 mb-3">
            {(['sota', 'advanced', 'intermediate', 'basic'] as SotaLevel[]).map(level => {
              const count = skills.filter(s => s.sotaLevel === level).length;
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

          <div className="flex-1 overflow-y-auto space-y-0.5 px-1">
            {folders.map(folder => {
              const count = skills.filter(s => s.folder === folder).length;
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
          {/* Header: Search + Sort + Export + New */}
          <div className="flex items-center gap-2 mb-4 shrink-0">
            <div className="flex-1 relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ash/40" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar skills…"
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
                title="Exportar skills"
              >
                <Upload className="w-3.5 h-3.5" />
              </button>
              <AnimatePresence>
                {showExportMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute top-full right-0 mt-1 bg-graphite/90 border border-graphite/30 rounded-xl overflow-hidden z-20 min-w-[160px]"
                  >
                    <button onClick={() => { exportJSON(skills); setShowExportMenu(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-mono text-bone hover:bg-carbon/50 transition-colors cursor-pointer">
                      <FileJson className="w-3.5 h-3.5" /> JSON
                    </button>
                    <button onClick={() => { exportCSV(skills); setShowExportMenu(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-mono text-bone hover:bg-carbon/50 transition-colors cursor-pointer">
                      <FileText className="w-3.5 h-3.5" /> CSV
                    </button>
                    <button onClick={() => { exportMarkdown(skills); setShowExportMenu(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-mono text-bone hover:bg-carbon/50 transition-colors cursor-pointer">
                      <FileText className="w-3.5 h-3.5" /> Markdown
                    </button>
                    <div className="border-t border-graphite/20 mx-2" />
                    <div className="px-3 py-1.5 text-[8px] font-mono text-ash/30 uppercase tracking-wider">Individual</div>
                    {skills.filter(s => s.isFavorite).slice(0, 5).map(s => (
                      <button key={s.id} onClick={() => { exportSingleSkillMD(s); setShowExportMenu(false); }}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-[10px] font-mono text-bone hover:bg-carbon/50 transition-colors cursor-pointer truncate">
                        <Download className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">{s.name}.md</span>
                      </button>
                    ))}
                    {skills.filter(s => s.isFavorite).length === 0 && (
                      <div className="px-3 py-2 text-[9px] text-ash/30 italic">Marcá favoritos para export rápido</div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Import */}
            <input ref={fileInputRef} type="file" accept=".json,.csv,.md,.txt" onChange={handleImport} className="hidden" />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-[11px] font-semibold bg-carbon/30 text-ash/60 border border-graphite/20 hover:text-bone hover:border-graphite/40 transition-all cursor-pointer shrink-0"
              title="Importar skills"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            {/* New skill */}
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[11px] font-semibold bg-signal-cyan/10 text-signal-cyan border border-signal-cyan/30 hover:brightness-125 transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Nueva
            </button>
          </div>

          {/* Grid */}
          <div className="flex-1 overflow-y-auto pr-1">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <Cpu className="w-12 h-12 text-ash/20 mx-auto mb-3" />
                <p className="text-sm text-ash/40 font-mono mb-2">
                  {search ? `No se encontraron skills para "${search}"` : 'No hay skills en esta carpeta'}
                </p>
                <button onClick={() => setIsCreating(true)}
                  className="text-[11px] text-signal-cyan font-mono hover:underline cursor-pointer">
                  + Crear la primera
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 pb-4">
                <AnimatePresence mode="popLayout">
                  {filtered.map(s => (
                    <motion.div
                      key={s.id}
                      layout
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-carbon/25 border border-graphite/15 rounded-xl p-4 hover:border-graphite/30 transition-all group relative"
                    >
                      {/* Card header */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-bone font-mono flex items-center gap-1.5">
                            {s.isFavorite && <Star className="w-3 h-3 text-signal-amber fill-signal-amber shrink-0" />}
                            <span className="truncate">{s.name}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-[9px] font-mono text-signal-cyan/70 bg-signal-cyan/8 px-1.5 py-0.5 rounded">{s.category}</span>
                            {s.sotaLevel && (
                              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${sotaBadgeClass(s.sotaLevel)}`}>
                                {s.sotaLevel === 'sota' ? 'SOTA' : s.sotaLevel.charAt(0).toUpperCase() + s.sotaLevel.slice(1)}
                              </span>
                            )}
                            {s.folder && (
                              <span className="text-[9px] font-mono text-ash/40 bg-carbon/30 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                <Folder className="w-2.5 h-2.5" />{s.folder}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-0.5 shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleToggleFavorite(s.id)}
                            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                              s.isFavorite
                                ? 'text-signal-amber hover:text-signal-amber/70'
                                : 'text-ash/40 hover:text-bone hover:bg-carbon/40'
                            }`}
                          >
                            {s.isFavorite ? <StarOff className="w-3.5 h-3.5" /> : <Star className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => setEditingSkill(s)}
                            className="p-1.5 rounded-lg text-ash/40 hover:text-bone hover:bg-carbon/40 transition-all cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {confirmDelete === s.id ? (
                            <div className="flex items-center gap-1 bg-signal-magenta/10 border border-signal-magenta/30 rounded-lg px-1.5 py-1">
                              <button onClick={() => handleDeleteSkill(s.id)}
                                className="text-[9px] font-mono text-signal-magenta hover:text-signal-magenta/70 cursor-pointer">Sí</button>
                              <span className="text-ash/30">·</span>
                              <button onClick={() => setConfirmDelete(null)}
                                className="text-[9px] font-mono text-ash/40 hover:text-bone cursor-pointer">No</button>
                            </div>
                          ) : (
                            <button onClick={() => setConfirmDelete(s.id)}
                              className="p-1.5 rounded-lg text-ash/40 hover:text-signal-magenta hover:bg-signal-magenta/10 transition-all cursor-pointer">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Trigger */}
                      {s.trigger && (
                        <div className="mb-1.5">
                          <span className="text-[8px] font-mono text-ash/30 uppercase tracking-wider">trigger </span>
                          <span className="text-[9px] font-mono text-signal-cyan/60">{s.trigger}</span>
                        </div>
                      )}

                      {/* Description */}
                      <p className="text-[10px] font-mono text-ash/60 leading-relaxed line-clamp-2 mb-2">
                        {s.description || s.content.slice(0, 150)}
                      </p>

                      {/* Tags + copy */}
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex flex-wrap gap-1">
                          {s.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="text-[8px] font-mono text-ash/30 bg-carbon/20 px-1.5 py-0.5 rounded">
                              #{tag}
                            </span>
                          ))}
                          {s.tags.length > 3 && (
                            <span className="text-[8px] font-mono text-ash/20">+{s.tags.length - 3}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {/* Export individual */}
                          <button
                            onClick={() => exportSingleSkillMD(s)}
                            className="p-1.5 rounded-lg text-ash/30 hover:text-bone hover:bg-carbon/40 transition-all cursor-pointer"
                            title="Exportar como SKILL.md"
                          >
                            <Download className="w-3 h-3" />
                          </button>
                          {/* Copy trigger */}
                          <button
                            onClick={() => copyTrigger(s.id)}
                            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                              copiedId === s.id
                                ? 'text-signal-lime bg-signal-lime/10'
                                : 'text-ash/40 hover:text-bone hover:bg-carbon/40'
                            }`}
                            title="Copiar trigger"
                          >
                            {copiedId === s.id ? <Check className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
                          </button>
                        </div>
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
