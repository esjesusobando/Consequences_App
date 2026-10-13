import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Image as ImageIcon, 
  Sliders, 
  Palette,
  Music,
  Check,
  Star,
  Layout,
  Save,
  Trash2,
  ArrowLeftRight,
  ChevronDown,
  Server,
  BookOpen,
  Terminal,
  Zap,
  FlaskConical,
  Play,
  Plus,
  Wrench,
  Activity,
  Power,
  PowerOff,
  Loader
} from 'lucide-react';
import { PresentationConfig, AccentColor } from '../types';
import { BACKGROUND_PRESETS, AMBIENT_TRACKS } from '../personalOsData';
import { safeGet, safeSet } from '../lib/storage';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  config: PresentationConfig;
  setConfig: React.Dispatch<React.SetStateAction<PresentationConfig>>;
  accent: AccentColor;
  setAccent: (accent: AccentColor) => void;
  onLogMessage: (type: 'info' | 'ok' | 'warn' | 'err', text: string) => void;
  focusMode: boolean;
  setFocusMode: (v: boolean) => void;
}

// ─── CollapsibleSection ───────────────────────────────────────
function CollapsibleSection({
  title,
  icon,
  accentColor,
  defaultExpanded = false,
  sectionKey,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  accentColor: string;
  defaultExpanded?: boolean;
  sectionKey: string;
  children: React.ReactNode;
}) {
  const storageKey = `sota_drawer_section_${sectionKey}`;

  const [expanded, setExpanded] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved !== null) return JSON.parse(saved);
    } catch { /* ignore */ }
    return defaultExpanded;
  });

  useEffect(() => {
    safeSet(storageKey, expanded);
  }, [expanded, storageKey]);

  return (
    <div className="flex flex-col border-b border-graphite/20 pb-5">
      <button
        type="button"
        onClick={() => setExpanded(prev => !prev)}
        aria-expanded={expanded}
        className="flex items-center justify-between w-full group cursor-pointer"
      >
        <h3
          className="font-mono text-[10px] uppercase font-bold tracking-widest flex items-center gap-1.5"
          style={{ color: accentColor }}
        >
          {icon}
          {title}
        </h3>
        <ChevronDown
          aria-hidden="true"
          className="w-3.5 h-3.5 text-slate transition-transform duration-200 group-hover:text-bone"
          style={{ transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}
        />
      </button>
      <div
        className="transition-all duration-200 overflow-hidden"
        style={{
          maxHeight: expanded ? '2000px' : '0px',
          opacity: expanded ? 1 : 0,
          marginTop: expanded ? '0.75rem' : '0',
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ─── Playground Sub-components ────────────────────────────────

type McpConnection = {
  id: string;
  name: string;
  url: string;
  status: 'connected' | 'connecting' | 'error' | 'disabled';
};

type SkillEntry = {
  name: string;
  description: string;
  enabled: boolean;
};

type CommandEntry = {
  name: string;
  description: string;
  keybinding?: string;
  category: string;
};

type HookEntry = {
  name: string;
  trigger: string;
  path: string;
  enabled: boolean;
};

type HarnessEntry = {
  name: string;
  status: 'running' | 'idle' | 'error';
  lastRun: string | null;
};

function McpServerSubsection() {
  const storageKey = 'sota_playground_mcp';
  const connectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [connections, setConnections] = useState<McpConnection[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch { /* ignore */ }
    return [];
  });

  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');

  useEffect(() => {
    safeSet(storageKey, connections);
  }, [connections]);

  const addConnection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newUrl.trim()) return;
    const id = `mcp-${Date.now()}`;
    setConnections(prev => [...prev, { id, name: newName.trim(), url: newUrl.trim(), status: 'connecting' }]);
    setNewName('');
    setNewUrl('');
    setShowForm(false);

    // Simulate connection test after 1.5s
    connectTimeoutRef.current = setTimeout(() => {
      setConnections(prev =>
        prev.map(c => (c.id === id ? { ...c, status: 'connected' as const } : c))
      );
    }, 1500);
  };

  useEffect(() => {
    return () => {
      if (connectTimeoutRef.current) {
        clearTimeout(connectTimeoutRef.current);
      }
    };
  }, []);

  const removeConnection = (id: string) => {
    setConnections(prev => prev.filter(c => c.id !== id));
  };

  const statusColor = (status: McpConnection['status']) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-400 animate-pulse';
      case 'error': return 'bg-red-500';
      case 'disabled': return 'bg-gray-500';
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[9px] text-slate uppercase tracking-wider flex items-center gap-1.5">
          <Server className="w-3 h-3" />
          MCP Servers
        </span>
        <button
          type="button"
          onClick={() => setShowForm(prev => !prev)}
          className="flex items-center gap-1 text-[8px] font-mono uppercase text-signal-cyan hover:text-signal-cyan/80 transition-colors cursor-pointer"
        >
          <Plus className="w-3 h-3" />
          Add Server
        </button>
      </div>

      {showForm && (
        <form onSubmit={addConnection} className="flex flex-col gap-2 bg-void/40 border border-graphite/40 rounded-lg p-2.5">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Server name"
            className="bg-void border border-graphite/60 rounded px-2 py-1 text-[10px] font-mono text-bone outline-none focus:border-signal-cyan"
          />
          <input
            type="text"
            value={newUrl}
            onChange={e => setNewUrl(e.target.value)}
            placeholder="URL / endpoint"
            className="bg-void border border-graphite/60 rounded px-2 py-1 text-[10px] font-mono text-bone outline-none focus:border-signal-cyan"
          />
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-[8px] font-mono uppercase text-slate hover:text-bone px-2 py-1 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="text-[8px] font-mono uppercase text-signal-cyan bg-signal-cyan/10 border border-signal-cyan/30 rounded px-3 py-1 hover:bg-signal-cyan/20 cursor-pointer transition-colors"
            >
              Connect
            </button>
          </div>
        </form>
      )}

      {connections.length === 0 && !showForm && (
        <span className="text-[8px] font-mono text-slate italic">No MCP servers configured</span>
      )}

      {connections.map(conn => (
        <div
          key={conn.id}
          className="flex items-center justify-between bg-void/30 border border-graphite/30 rounded-lg p-2"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusColor(conn.status)}`} />
            <div className="min-w-0">
              <div className="text-[9px] font-mono text-bone truncate">{conn.name}</div>
              <div className="text-[7px] font-mono text-slate truncate">{conn.url}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => removeConnection(conn.id)}
            className="p-1 text-slate hover:text-signal-magenta transition-colors flex-shrink-0 cursor-pointer"
            title="Remove"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
}

function SkillsBrowserSubsection() {
  const storageKey = 'sota_playground_skills';

  const [skills, setSkills] = useState<SkillEntry[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch { /* ignore */ }
    // Default sample skills
    return [
      { name: 'typescript', description: 'TypeScript strict patterns', enabled: true },
      { name: 'react-19', description: 'React 19 with Compiler', enabled: true },
      { name: 'debug', description: 'Systematic root-cause debugging', enabled: true },
      { name: 'ce-plan', description: 'Structured implementation plans', enabled: false },
    ];
  });

  useEffect(() => {
    safeSet(storageKey, skills);
  }, [skills]);

  const toggleSkill = (name: string) => {
    setSkills(prev => prev.map(s => s.name === name ? { ...s, enabled: !s.enabled } : s));
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[9px] text-slate uppercase tracking-wider flex items-center gap-1.5">
          <BookOpen className="w-3 h-3" />
          Skills Registry
        </span>
        <span className="text-[7px] font-mono text-slate">{skills.filter(s => s.enabled).length}/{skills.length} active</span>
      </div>

      {skills.map(skill => (
        <div
          key={skill.name}
          className="flex items-center justify-between bg-void/30 border border-graphite/30 rounded-lg p-2"
        >
          <div className="min-w-0 flex-1">
            <div className="text-[9px] font-mono text-bone truncate">{skill.name}</div>
            <div className="text-[7px] font-mono text-slate truncate">{skill.description}</div>
          </div>
          <button
            type="button"
            onClick={() => toggleSkill(skill.name)}
            className={`p-1 rounded transition-colors cursor-pointer ${
              skill.enabled ? 'text-signal-lime' : 'text-slate hover:text-bone'
            }`}
            title={skill.enabled ? 'Disable' : 'Enable'}
          >
            {skill.enabled ? <Power className="w-3 h-3" /> : <PowerOff className="w-3 h-3" />}
          </button>
        </div>
      ))}
    </div>
  );
}

function CommandsSubsection() {
  const mockCommands: CommandEntry[] = [
    { name: 'commit', description: 'Create a git commit', keybinding: 'Ctrl+K', category: 'git' },
    { name: 'plan', description: 'Create implementation plan', keybinding: 'Ctrl+P', category: 'planning' },
    { name: 'debug', description: 'Start debug session', keybinding: 'Ctrl+D', category: 'debug' },
    { name: 'review', description: 'Code review mode', keybinding: 'Ctrl+R', category: 'review' },
  ];

  const categories = [...new Set(mockCommands.map(c => c.category))];

  return (
    <div className="flex flex-col gap-2">
      <span className="font-mono text-[9px] text-slate uppercase tracking-wider flex items-center gap-1.5">
        <Terminal className="w-3 h-3" />
        Command Palette
      </span>

      {categories.map(cat => (
        <div key={cat} className="flex flex-col gap-1">
          <span className="text-[7px] font-mono uppercase text-slate/60 tracking-wider px-1">{cat}</span>
          {mockCommands.filter(c => c.category === cat).map(cmd => (
            <div
              key={cmd.name}
              className="flex items-center justify-between bg-void/30 border border-graphite/30 rounded-lg p-2"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="w-1 h-3 bg-signal-cyan/40 rounded" />
                <span className="text-[9px] font-mono text-bone">{cmd.name}</span>
                <span className="text-[7px] font-mono text-slate truncate hidden sm:inline">{cmd.description}</span>
              </div>
              {cmd.keybinding && (
                <span className="text-[7px] font-mono bg-void border border-graphite/40 rounded px-1.5 py-0.5 text-slate">
                  {cmd.keybinding}
                </span>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function HooksSubsection() {
  const storageKey = 'sota_playground_hooks';

  const [hooks, setHooks] = useState<HookEntry[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch { /* ignore */ }
    return [
      { name: 'pre-commit-ga', trigger: 'pre-commit', path: '.agents/hooks/pre-commit-ga', enabled: true },
      { name: 'post-build-test', trigger: 'post-build', path: '.agents/hooks/post-build-test', enabled: false },
      { name: 'engram-sync', trigger: 'post-commit', path: '~/.config/opencode/hooks/engram-sync', enabled: true },
    ];
  });

  useEffect(() => {
    safeSet(storageKey, hooks);
  }, [hooks]);

  const toggleHook = (name: string) => {
    setHooks(prev => prev.map(h => h.name === name ? { ...h, enabled: !h.enabled } : h));
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[9px] text-slate uppercase tracking-wider flex items-center gap-1.5">
          <Zap className="w-3 h-3" />
          Hooks Manager
        </span>
        <span className="text-[7px] font-mono text-slate">{hooks.filter(h => h.enabled).length}/{hooks.length} active</span>
      </div>

      {hooks.map(hook => (
        <div
          key={hook.name}
          className="flex items-center justify-between bg-void/30 border border-graphite/30 rounded-lg p-2"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono text-bone">{hook.name}</span>
              <span className="text-[7px] font-mono bg-graphite/30 rounded px-1 text-slate">{hook.trigger}</span>
            </div>
            <div className="text-[7px] font-mono text-slate truncate">{hook.path}</div>
          </div>
          <button
            type="button"
            onClick={() => toggleHook(hook.name)}
            className={`p-1 rounded transition-colors cursor-pointer ${
              hook.enabled ? 'text-signal-amber' : 'text-slate hover:text-bone'
            }`}
            title={hook.enabled ? 'Disable' : 'Enable'}
          >
            {hook.enabled ? <Power className="w-3 h-3" /> : <PowerOff className="w-3 h-3" />}
          </button>
        </div>
      ))}
    </div>
  );
}

function HarnessSubsection() {
  const [harnesses] = useState<HarnessEntry[]>([
    { name: 'Unit Tests', status: 'idle', lastRun: '2 min ago' },
    { name: 'Integration', status: 'idle', lastRun: '15 min ago' },
    { name: 'E2E Browser', status: 'running', lastRun: 'now' },
  ]);

  const statusBadge = (status: HarnessEntry['status']) => {
    switch (status) {
      case 'running':
        return (
          <span className="flex items-center gap-1 text-[7px] font-mono text-signal-lime">
            <Loader className="w-2.5 h-2.5 animate-spin" />
            RUNNING
          </span>
        );
      case 'idle':
        return <span className="text-[7px] font-mono text-slate">IDLE</span>;
      case 'error':
        return <span className="text-[7px] font-mono text-signal-magenta">ERROR</span>;
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[9px] text-slate uppercase tracking-wider flex items-center gap-1.5">
          <FlaskConical className="w-3 h-3" />
          Harness Active List
        </span>
        <button
          type="button"
          className="text-[8px] font-mono uppercase text-signal-lime bg-signal-lime/10 border border-signal-lime/30 rounded px-2 py-0.5 hover:bg-signal-lime/20 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <Play className="w-2.5 h-2.5" />
          Run All
        </button>
      </div>

      {harnesses.map(h => (
        <div
          key={h.name}
          className="flex items-center justify-between bg-void/30 border border-graphite/30 rounded-lg p-2"
        >
          <div className="flex items-center gap-2">
            <Activity className="w-3 h-3 text-slate" />
            <span className="text-[9px] font-mono text-bone">{h.name}</span>
          </div>
          <div className="flex items-center gap-2">
            {statusBadge(h.status)}
            {h.lastRun && <span className="text-[7px] font-mono text-slate">{h.lastRun}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── SettingsDrawer Main Component ────────────────────────────
export default function SettingsDrawer({
  isOpen,
  onClose,
  config,
  setConfig,
  accent,
  setAccent,
  onLogMessage,
  focusMode,
  setFocusMode,
}: SettingsDrawerProps) {
  // NOTE: ~8 synchronous localStorage.getItem() calls in useState initializers below.
  // This is a known perf issue on mount — fixing would require lazy component splitting
  // or a context-based persistence layer. Left as-is intentionally for now.
  // Manage recent background images with pinned favorites
  const [recentImages, setRecentImages] = useState<Array<{ url: string; isFavorite: boolean; name: string }>>(() => {
    const saved = safeGet<unknown>('sota_recent_images', null);
    if (Array.isArray(saved)) {
      return (saved as Array<{ url?: string }>).filter(img => img && typeof img === 'object' && img.url) as Array<{ url: string; isFavorite: boolean; name: string }>;
    }
    return [
      { url: "https://images.unsplash.com/photo-1544027993-37dbfe43562a?auto=format&fit=crop&w=1200&q=80", isFavorite: true, name: "Editorial Charcoal" },
      { url: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80", isFavorite: false, name: "Desarrollo Grid" },
      { url: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=1200&q=80", isFavorite: false, name: "Matriz Neón" }
    ];
  });

  // Manage saved custom Workspace layouts
  const [savedWorkspaces, setSavedWorkspaces] = useState<Array<{ id: string, name: string, config: Partial<PresentationConfig>, accent: AccentColor }>>(() => {
    const saved = safeGet<unknown>('sota_saved_workspaces', null);
    if (Array.isArray(saved)) return saved as Array<{ id: string, name: string, config: Partial<PresentationConfig>, accent: AccentColor }>;
    return [
      {
        id: 'preset-sota',
        name: 'Producción SOTA',
        accent: 'cyan' as AccentColor,
        config: {
          backgroundImage: "https://images.unsplash.com/photo-1544027993-37dbfe43562a?auto=format&fit=crop&w=1200&q=80",
          backdropBlur: 10,
          overlayOpacity: 0.15,
          audioLoop: 'synth-pad',
          volume: 25,
          isPlayingSound: false,
          panelsSwapped: false,
          sidebarWidth: 384,
          themeMode: 'dark'
        }
      },
      {
        id: 'preset-minimal',
        name: 'Workspace Zen',
        accent: 'tokyo' as AccentColor,
        config: {
          backgroundImage: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=1200&q=80",
          backdropBlur: 15,
          overlayOpacity: 0.05,
          audioLoop: 'wave-sync',
          volume: 0,
          isPlayingSound: false,
          panelsSwapped: false,
          sidebarWidth: 280,
          themeMode: 'dark'
        }
      },
      {
        id: 'preset-craft',
        name: 'Craft Light',
        accent: 'cyan' as AccentColor,
        config: {
          backgroundImage: "",
          backdropBlur: 4,
          overlayOpacity: 0,
          audioLoop: 'synth-pad',
          volume: 15,
          isPlayingSound: false,
          panelsSwapped: false,
          sidebarWidth: 340,
          themeMode: 'craft'
        }
      },
      {
        id: 'preset-cyber',
        name: 'Cyber Nexus',
        accent: 'magenta' as AccentColor,
        config: {
          backgroundImage: "https://images.unsplash.com/photo-1544027993-37dbfe43562a?auto=format&fit=crop&w=1200&q=80",
          backdropBlur: 8,
          overlayOpacity: 0.1,
          audioLoop: 'cosmic-wind',
          volume: 30,
          isPlayingSound: false,
          panelsSwapped: false,
          sidebarWidth: 384,
          themeMode: 'cyber'
        }
      },
      {
        id: 'preset-editorial',
        name: 'Notion Editorial',
        accent: 'cyan' as AccentColor,
        config: {
          backgroundImage: "",
          backdropBlur: 0,
          overlayOpacity: 0,
          audioLoop: 'synth-pad',
          volume: 15,
          isPlayingSound: false,
          panelsSwapped: false,
          sidebarWidth: 340,
          themeMode: 'editorial'
        }
      }
    ];
  });

  const [newWorkspaceName, setNewWorkspaceName] = useState('');

  useEffect(() => {
    if (isOpen) {
      safeSet('sota_recent_images', recentImages);
    }
  }, [recentImages, isOpen]);

  useEffect(() => {
    if (isOpen) {
      safeSet('sota_saved_workspaces', savedWorkspaces);
    }
  }, [savedWorkspaces, isOpen]);

  // Synchronize new backgrounds selected or uploaded into recent images list
  useEffect(() => {
    if (!config.backgroundImage) return;
    setRecentImages(prev => {
      const safePrev = Array.isArray(prev) ? prev.filter(Boolean) : [];
      if (safePrev.some(img => img && img.url === config.backgroundImage)) {
        return safePrev;
      }
      const isPreset = BACKGROUND_PRESETS.some(p => p && p.url === config.backgroundImage);
      const name = config.backgroundImage.startsWith('data:') 
        ? 'Imagen Local PC' 
        : isPreset 
          ? BACKGROUND_PRESETS.find(p => p && p.url === config.backgroundImage)?.name || 'Preset' 
          : 'Fondo Externo';

      // Filter and keep maximum of 8 entries, prioritizing favorites
      const favorites = safePrev.filter(img => img && img.isFavorite);
      const nonFavorites = safePrev.filter(img => img && !img.isFavorite).slice(0, 5);
      return [{ url: config.backgroundImage, isFavorite: false, name }, ...favorites, ...nonFavorites].slice(0, 10);
    });
  }, [config.backgroundImage]);

  const toggleFavoriteImage = (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentImages(prev => {
      const safePrev = Array.isArray(prev) ? prev.filter(Boolean) : [];
      return safePrev.map(img => img.url === url ? { ...img, isFavorite: !img.isFavorite } : img);
    });
    onLogMessage('ok', 'Favorito ambiental actualizado.');
  };

  const handleSaveWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    
    const newWs = {
      id: `WS-${Date.now()}`,
      name: newWorkspaceName.trim(),
      accent: accent,
      config: { ...config }
    };
    
    setSavedWorkspaces(prev => [newWs, ...prev]);
    onLogMessage('ok', `Espacio de distribución guardado: "${newWs.name}"`);
    setNewWorkspaceName('');
  };

  const handleApplyWorkspace = (ws: { id: string; name: string; config: Partial<PresentationConfig>; accent: AccentColor }) => {
    setConfig(prev => ({ ...prev, ...ws.config }));
    setAccent(ws.accent);
    onLogMessage('ok', `Espacio de trabajo restaurado: "${ws.name}"`);
  };

  const handleDeleteWorkspace = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedWorkspaces(prev => prev.filter(ws => ws.id !== id));
    onLogMessage('warn', `Se purgó la distribución de espacio seleccionada.`);
  };

  if (!isOpen) return null;

  const handleSelectBgPreset = (url: string, name: string) => {
    setConfig(prev => ({ ...prev, backgroundImage: url }));
    onLogMessage('ok', `Fondo de pantalla actualizado a preset: ${name}`);
  };

  const handleSelectTrack = (trackId: string, name: string) => {
    setConfig(prev => ({ ...prev, audioLoop: trackId }));
    onLogMessage('info', `Pista de audio ambiental actualizada: ${name.toUpperCase()}`);
  };

  // Color circles definitions
  const colors: Array<{ id: AccentColor; label: string; class: string; textClass: string }> = [
    { id: 'cyan', label: 'Cian Radical', class: 'bg-signal-cyan', textClass: 'text-signal-cyan' },
    { id: 'magenta', label: 'Megapíxel Magenta', class: 'bg-signal-magenta', textClass: 'text-signal-magenta' },
    { id: 'lime', label: 'Lima Eléctrico', class: 'bg-signal-lime', textClass: 'text-signal-lime' },
    { id: 'amber', label: 'Ámbar Intenso', class: 'bg-signal-amber', textClass: 'text-signal-amber' },
    { id: 'tokyo', label: 'Tokyo Cappuccino', class: 'bg-[#d4b395]', textClass: 'text-[#d4b395]' },
    { id: 'matte-white', label: 'Blanco Mate', class: 'bg-[#E8E4D9]', textClass: 'text-[#E8E4D9]' },
    { id: 'custom', label: 'HSL Personalizado', class: 'bg-gradient-to-r from-red-500 via-green-500 to-blue-500', textClass: 'text-signal-cyan' }
  ];

  return (
    <>
      {/* Dark overlay backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-void/60 backdrop-blur-sm z-50 transition-opacity duration-300 pointer-events-auto"
      />

      {/* Slide-out Panel */}
      <div 
        id="settings-ambient-drawer"
        className="fixed top-0 right-0 h-full w-[380px] max-w-full bg-void/95 border-l border-graphite/50 shadow-2xl z-50 flex flex-col transition-all duration-300 custom-scrollbar select-none text-bone"
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-graphite/30 flex items-center justify-between bg-carbon/25">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-signal-cyan" />
            <div>
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-bone">
                PANEL DE PERSONALIZACIÓN
              </h2>
              <p className="text-[9px] text-slate uppercase font-mono">Ajustes Generales de Ambiente</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-carbon text-slate hover:text-bone rounded transition-colors"
            title="Cerrar Panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable controls list */}
        <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-6 custom-scrollbar text-xs">

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* 1. IMAGEN DE FONDO                                              */}
          {/* ════════════════════════════════════════════════════════════════ */}
          <CollapsibleSection
            title="IMAGEN DE FONDO"
            icon={<ImageIcon className="w-3.5 h-3.5" />}
            accentColor="#00F0FF"
            sectionKey="background"
          >
            <div className="flex flex-col gap-3 mt-1">
              {/* Upload */}
              <label 
                htmlFor="bg-image-upload"
                className="flex flex-col items-center justify-center border border-dashed border-graphite/60 hover:border-signal-cyan/50 bg-carbon/30 hover:bg-carbon/60 p-3 rounded-lg cursor-pointer transition-all text-center select-none"
              >
                <ImageIcon className="w-4 h-4 text-signal-cyan mb-1 animate-pulse" />
                <span className="text-[9px] font-mono text-bone uppercase font-bold">Subir imagen</span>
                <span className="text-[7px] text-slate uppercase font-mono">PNG, JPG, WEBP, GIF</span>
              </label>
              <input type="file" id="bg-image-upload" accept="image/*" className="hidden" onChange={(e) => {
                const file = e.target.files?.[0];
                // Reset value so selecting the SAME file again still fires onChange
                e.target.value = '';
                if (!file) return;
                const MAX_BG_BYTES = 4 * 1024 * 1024; // 4MB — base64 ~5.3MB, fits localStorage ~5MB quota
                if (file.size > MAX_BG_BYTES) {
                  onLogMessage('err', `Imagen muy grande (${(file.size / 1048576).toFixed(1)}MB). Máximo 4MB.`);
                  return;
                }
                const reader = new FileReader();
                reader.onload = (event) => {
                  const base64 = event.target?.result as string;
                  if (base64) { setConfig(prev => ({ ...prev, backgroundImage: base64 })); onLogMessage('ok', `Fondo: ${file.name}`); }
                };
                reader.onerror = () => onLogMessage('err', `No se pudo leer: ${file.name}`);
                reader.readAsDataURL(file);
              }} />

              {/* Recent images grid */}
              <div className="grid grid-cols-3 gap-1.5">
                {recentImages.filter(img => img && img.url).slice(0, 6).map((img, index) => {
                  const isActive = config.backgroundImage === img.url;
                  return (
                    <div 
                      key={`${img.url}-${index}`}
                      onClick={() => { setConfig(prev => ({ ...prev, backgroundImage: img.url })); onLogMessage('ok', `Fondo: ${img.name || 'Fondo'}`); }}
                      className={`relative aspect-[1.3] rounded-lg overflow-hidden border cursor-pointer transition-all ${isActive ? 'border-signal-cyan shadow-lg scale-105 z-10' : 'border-graphite/55 hover:border-slate'}`}
                      title={img.name || 'Fondo'}
                    >
                      <img src={img.url} alt={img.name || 'Fondo'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <button onClick={(e) => toggleFavoriteImage(img.url, e)} className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-void/65 hover:bg-void/90 transition-all text-bone" title="Favorito">
                        <Star className={`w-2.5 h-2.5 ${img.isFavorite ? 'text-signal-amber fill-signal-amber' : 'text-slate'}`} />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Sliders */}
              {config.backgroundImage && (
                <div className="flex flex-col gap-2 border-t border-graphite/15 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-mono text-slate uppercase">Blur</span>
                    <span className="text-[8px] font-mono text-signal-cyan">{config.backdropBlur}px</span>
                  </div>
                  <input type="range" min="0" max="30" value={config.backdropBlur} onChange={(e) => setConfig(prev => ({ ...prev, backdropBlur: Number(e.target.value) }))} className="w-full accent-signal-cyan cursor-pointer" />
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-mono text-slate uppercase">Opacidad</span>
                    <span className="text-[8px] font-mono text-signal-lime">{Math.round((config.overlayOpacity ?? 0.12) * 100)}%</span>
                  </div>
                  <input type="range" min="0" max="100" step="5" value={Math.round((config.overlayOpacity ?? 0.12) * 100)} onChange={(e) => setConfig(prev => ({ ...prev, overlayOpacity: Number(e.target.value) / 100 }))} className="w-full accent-signal-lime cursor-pointer" />
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-mono text-slate uppercase">Posición X</span>
                    <span className="text-[8px] font-mono text-signal-amber">{config.bgPositionX}%</span>
                  </div>
                  <input type="range" min="0" max="100" step="1" value={config.bgPositionX} onChange={(e) => setConfig(prev => ({ ...prev, bgPositionX: Number(e.target.value) }))} className="w-full accent-signal-amber cursor-pointer" />
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-mono text-slate uppercase">Posición Y</span>
                    <span className="text-[8px] font-mono text-signal-amber">{config.bgPositionY}%</span>
                  </div>
                  <input type="range" min="0" max="100" step="1" value={config.bgPositionY} onChange={(e) => setConfig(prev => ({ ...prev, bgPositionY: Number(e.target.value) }))} className="w-full accent-signal-amber cursor-pointer" />
                  <button onClick={() => { setConfig(prev => ({ ...prev, backgroundImage: '' })); onLogMessage('info', 'Fondo removido.'); }} className="text-[8px] font-mono text-signal-magenta hover:underline cursor-pointer mt-1">
                    Remover fondo
                  </button>
                </div>
              )}
            </div>
          </CollapsibleSection>

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* 2. COLOR DE ACENTO                                              */}
          {/* ════════════════════════════════════════════════════════════════ */}
          <CollapsibleSection
            title="COLOR DE ACENTO"
            icon={<Palette className="w-3.5 h-3.5" />}
            accentColor="#FFB400"
            sectionKey="accent"
          >
            <div className="grid grid-cols-2 gap-1.5 mt-1">
              {colors.map((color) => {
                const isSelected = accent === color.id;
                return (
                  <button
                    key={color.id}
                    onClick={() => { setAccent(color.id); onLogMessage('ok', `Acento: ${color.id.toUpperCase()}`); }}
                    className={`flex items-center gap-2 p-1.5 rounded-lg border text-left transition-all ${isSelected ? 'border-white bg-white/5 font-bold' : 'border-graphite/40 bg-void/30 hover:border-graphite'}`}
                  >
                    <span className={`w-3 h-3 rounded-full ${color.class} flex items-center justify-center`}>
                      {isSelected && <Check className="w-2 h-2 text-void" />}
                    </span>
                    <span className={`text-[9px] font-mono leading-none ${color.textClass}`}>{color.label}</span>
                  </button>
                );
              })}
            </div>

            {accent === 'custom' && (
              <div className="mt-3 bg-void/75 border border-graphite/60 p-3 rounded-xl flex flex-col gap-2.5">
                <span className="font-mono text-[7px] text-signal-cyan uppercase font-bold tracking-widest">// HSL:</span>
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-[8px] font-mono text-bone"><span>H</span><span style={{ color: `hsl(${config.customH ?? 180},100%,55%)` }}>{config.customH ?? 180}°</span></div>
                  <input type="range" min="0" max="360" value={config.customH ?? 180} onChange={(e) => setConfig(prev => ({ ...prev, customH: Number(e.target.value) }))} className="w-full h-1.5 rounded cursor-pointer appearance-none outline-none" style={{ background: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)' }} />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-[8px] font-mono text-bone"><span>S</span><span>{config.customS ?? 100}%</span></div>
                  <input type="range" min="0" max="100" value={config.customS ?? 100} onChange={(e) => setConfig(prev => ({ ...prev, customS: Number(e.target.value) }))} className="w-full accent-signal-cyan cursor-pointer" />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between text-[8px] font-mono text-bone"><span>L</span><span>{config.customL ?? 50}%</span></div>
                  <input type="range" min="15" max="85" value={config.customL ?? 50} onChange={(e) => setConfig(prev => ({ ...prev, customL: Number(e.target.value) }))} className="w-full accent-signal-cyan cursor-pointer" />
                </div>
              </div>
            )}
          </CollapsibleSection>

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* 3. MODO DE DISEÑO                                               */}
          {/* ════════════════════════════════════════════════════════════════ */}
          <CollapsibleSection
            title="MODO DE DISEÑO"
            icon={<Sparkles className="w-3.5 h-3.5" />}
            accentColor="#00F0FF"
            sectionKey="theme"
          >
            <div className="grid grid-cols-3 gap-2 mt-1">
              <button
                type="button"
                onClick={() => { setConfig(prev => ({ ...prev, themeMode: 'dark' })); onLogMessage('info', 'Modo Oscuro'); }}
                className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border text-center transition-all cursor-pointer ${(config.themeMode ?? 'dark') === 'dark' ? 'border-signal-cyan bg-signal-cyan/10 font-bold' : 'border-graphite/40 bg-void/35 hover:border-graphite'}`}
              >
                <div className="w-5 h-5 rounded bg-void border border-graphite flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-signal-cyan" />
                </div>
                <span className="text-[9px] font-mono font-bold uppercase text-bone mt-1">DARK</span>
              </button>

              <button
                type="button"
                onClick={() => { setConfig(prev => ({ ...prev, themeMode: 'light_neocraft' })); onLogMessage('ok', 'Modo Claro'); }}
                className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border text-center transition-all cursor-pointer ${config.themeMode === 'light_neocraft' ? 'border-signal-cyan bg-signal-cyan/10 font-bold' : 'border-graphite/40 bg-void/35 hover:border-graphite'}`}
              >
                <div className="w-5 h-5 rounded bg-bone border border-graphite/30 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-signal-cyan" />
                </div>
                <span className="text-[9px] font-mono font-bold uppercase text-bone mt-1">LIGHT</span>
              </button>

              <button
                type="button"
                onClick={() => { setConfig(prev => ({ ...prev, themeMode: 'editorial' })); onLogMessage('ok', 'Modo Editorial'); }}
                className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border text-center transition-all cursor-pointer ${config.themeMode === 'editorial' ? 'border-signal-cyan bg-signal-cyan/10 font-bold' : 'border-graphite/40 bg-void/35 hover:border-graphite'}`}
              >
                <div className="w-5 h-5 rounded bg-white border border-graphite/30 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-signal-cyan/80" />
                </div>
                <span className="text-[9px] font-mono font-bold uppercase text-bone mt-1">EDITORIAL</span>
              </button>
            </div>
          </CollapsibleSection>

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* 4. AUDIO                                                        */}
          {/* ════════════════════════════════════════════════════════════════ */}
          <CollapsibleSection
            title="AUDIO AMBIENTAL"
            icon={<Music className="w-3.5 h-3.5" />}
            accentColor="#FF2E9A"
            sectionKey="audio"
          >
            <div className="flex flex-col gap-2 mt-1">
              <button 
                onClick={() => setConfig(prev => ({ ...prev, isPlayingSound: !prev.isPlayingSound }))}
                className={`self-start p-1 px-2 text-[8px] font-mono font-bold uppercase rounded transition-all flex items-center gap-1 border ${
                  config.isPlayingSound ? 'bg-signal-magenta/10 text-signal-magenta border-signal-magenta/35' : 'bg-carbon/45 text-slate border-transparent hover:text-bone'
                }`}
              >
                {config.isPlayingSound ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                {config.isPlayingSound ? 'On' : 'Off'}
              </button>

              {AMBIENT_TRACKS.map((track) => {
                const isActive = config.audioLoop === track.id;
                return (
                  <div key={track.id} onClick={() => handleSelectTrack(track.id, track.name)} className={`flex items-center justify-between p-1.5 rounded border cursor-pointer transition-all ${isActive ? 'border-signal-magenta bg-signal-magenta/5' : 'border-graphite/20 bg-void/30 hover:border-graphite/80'}`}>
                    <div className="text-[9px] font-bold text-bone font-mono uppercase flex items-center gap-1.5">
                      {isActive && <span className="w-1.5 h-1.5 bg-signal-magenta rounded-full animate-ping" />}
                      {track.name}
                    </div>
                    <span className="text-[7px] font-mono text-slate">{track.duration}</span>
                  </div>
                );
              })}

              <div className="flex flex-col gap-0.5 mt-1">
                <div className="flex justify-between text-[8px] font-mono text-slate"><span>VOLUMEN</span><span>{config.volume}%</span></div>
                <input type="range" min="0" max="100" value={config.volume} onChange={(e) => setConfig(prev => ({ ...prev, volume: Number(e.target.value) }))} className="w-full accent-signal-magenta cursor-pointer" />
              </div>
            </div>
          </CollapsibleSection>

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* 5. DISTRIBUCIÓN                                                 */}
          {/* ════════════════════════════════════════════════════════════════ */}
          <CollapsibleSection
            title="DISTRIBUCIÓN"
            icon={<Layout className="w-3.5 h-3.5" />}
            accentColor="#C6FF3D"
            sectionKey="workspace"
          >
            <div className="flex flex-col gap-3 mt-1">
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[8px] font-mono text-bone"><span>Ancho sidebar</span><span className="text-signal-cyan">{config.sidebarWidth ?? 384}px</span></div>
                <input type="range" min="260" max="460" value={config.sidebarWidth ?? 384} onChange={(e) => setConfig(prev => ({ ...prev, sidebarWidth: Number(e.target.value) }))} className="w-full accent-signal-cyan cursor-pointer" />
              </div>

              <div className="flex items-center justify-between border-t border-graphite/20 py-2">
                <div>
                  <span className="text-[9px] font-mono font-bold text-bone uppercase">Invertir paneles</span>
                  <span className="text-[7px] text-slate font-mono block">Intercambiar izq ⇆ der</span>
                </div>
                <button onClick={() => { const v = !config.panelsSwapped; setConfig(prev => ({ ...prev, panelsSwapped: v })); onLogMessage('info', `Paneles: ${v ? 'invertidos' : 'normales'}`); }} className={`p-1.5 rounded-lg border transition-all ${config.panelsSwapped ? 'bg-signal-cyan/10 border-signal-cyan text-signal-cyan' : 'border-graphite/60 text-slate hover:text-bone'}`} title="Invertir">
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <form onSubmit={handleSaveWorkspace} className="flex gap-1.5 mt-1">
                <input type="text" value={newWorkspaceName} onChange={(e) => setNewWorkspaceName(e.target.value)} placeholder="Nombre workspace..." className="flex-1 bg-void border border-graphite focus:border-signal-lime outline-none rounded px-2 py-1 text-bone font-mono text-[9px]" required />
                <button type="submit" className="px-2 bg-signal-lime text-void hover:bg-signal-lime/90 font-mono font-bold uppercase text-[8px] rounded flex items-center gap-1 cursor-pointer"><Save className="w-3 h-3" /></button>
              </form>

              <div className="flex flex-col gap-1">
                {savedWorkspaces.map((ws) => (
                  <div key={ws.id} onClick={() => handleApplyWorkspace(ws)} className="group flex items-center justify-between p-1.5 bg-void border border-graphite/45 rounded-lg cursor-pointer hover:border-slate/60 transition-all">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ws.accent === 'tokyo' ? '#d4b395' : ws.accent === 'custom' ? 'hsl(180,100%,50%)' : `var(--color-signal-${ws.accent})` }} />
                      <span className="font-mono text-[9px] font-bold text-bone uppercase">{ws.name}</span>
                    </div>
                    {ws.id !== 'preset-sota' && ws.id !== 'preset-minimal' && ws.id !== 'preset-craft' && ws.id !== 'preset-cyber' && ws.id !== 'preset-editorial' && (
                      <button onClick={(e) => handleDeleteWorkspace(ws.id, e)} className="p-0.5 text-slate hover:text-signal-magenta rounded transition-all opacity-0 group-hover:opacity-100" title="Eliminar">
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CollapsibleSection>

          {/* ════════════════════════════════════════════════════════════════ */}
          {/* 6. PLAYGROUND (último)                                          */}
          {/* ════════════════════════════════════════════════════════════════ */}
          <CollapsibleSection
            title="PLAYGROUND"
            icon={<Wrench className="w-3.5 h-3.5" />}
            accentColor="#818CF8"
            sectionKey="playground"
          >
            <div className="flex flex-col gap-3">
              <div className="bg-void/40 border border-indigo-500/15 rounded-xl p-2.5"><McpServerSubsection /></div>
              <div className="bg-void/40 border border-indigo-500/15 rounded-xl p-2.5"><SkillsBrowserSubsection /></div>
              <div className="bg-void/40 border border-indigo-500/15 rounded-xl p-2.5"><CommandsSubsection /></div>
              <div className="bg-void/40 border border-indigo-500/15 rounded-xl p-2.5"><HooksSubsection /></div>
              <div className="bg-void/40 border border-indigo-500/15 rounded-xl p-2.5"><HarnessSubsection /></div>
            </div>
          </CollapsibleSection>

        </div>

        {/* Drawer Footer info details */}
        <div className="p-4 border-t border-graphite/35 bg-void text-center">
          <span className="text-[8.5px] font-mono tracking-widest text-slate uppercase flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3 text-signal-cyan animate-pulse" />
            PERSONAL OS CORE v1 — DESIGN SYNCED
          </span>
        </div>

      </div>
    </>
  );
}
