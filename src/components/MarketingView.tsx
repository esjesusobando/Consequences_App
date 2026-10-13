import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mic,
  FileText,
  PenTool,
  CheckCircle2,
  Send,
  Image,
  ChevronDown,
  ChevronRight,
  Play,
  RefreshCw,
  AlertCircle,
  BarChart3,
  Eye,
  EyeOff,
  Globe,
  Linkedin,
  Instagram,
  Volume2,
} from 'lucide-react';
import { AccentColor } from '../types';

interface MarketingViewProps {
  accent: AccentColor;
  onLogMessage: (type: 'info' | 'ok' | 'warn' | 'err', text: string) => void;
}

// ── Types ──────────────────────────────────────────────────────────

interface AgentStatus {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  model: string;
  role: string;
  status: 'idle' | 'running' | 'done' | 'error';
  output?: string;
}

interface PipelineStep {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  status: 'pending' | 'active' | 'done' | 'error';
}

interface PublishedPost {
  id: string;
  platform: 'linkedin' | 'instagram';
  date: string;
  content: string;
  status: 'scheduled' | 'published' | 'draft';
}

// ── Mock data ──────────────────────────────────────────────────────

const LEVELS = [
  {
    id: 'audio',
    title: 'Nivel 1 — Audio Pipeline',
    subtitle: 'Captura y transcripción',
    icon: Mic,
    color: 'text-signal-cyan',
    borderColor: 'border-signal-cyan/30',
  },
  {
    id: 'content',
    title: 'Nivel 2 — Content Factory',
    subtitle: 'Redacción, revisión y aprobación',
    icon: PenTool,
    color: 'text-signal-magenta',
    borderColor: 'border-signal-magenta/30',
  },
  {
    id: 'publish',
    title: 'Nivel 3 — Publishing Engine',
    subtitle: 'Programación y distribución',
    icon: Send,
    color: 'text-signal-lime',
    borderColor: 'border-signal-lime/30',
  },
  {
    id: 'brand',
    title: 'Nivel 4 — Brand & Assets',
    subtitle: 'Voz, diseño y referencias',
    icon: Eye,
    color: 'text-signal-amber',
    borderColor: 'border-signal-amber/30',
  },
];

const INITIAL_AGENTS: AgentStatus[] = [
  { id: 'redactor', name: 'Redactor', icon: PenTool, model: 'sonnet', role: 'Newsletter + 3 posts LinkedIn', status: 'idle' },
  { id: 'revisor', name: 'Revisor', icon: CheckCircle2, model: 'haiku', role: 'Evaluación calidad → JSON', status: 'idle' },
  { id: 'publicador', name: 'Publicador', icon: Send, model: 'haiku', role: 'Programación Metricool', status: 'idle' },
  { id: 'carrusel-designer', name: 'Carrusel Designer', icon: Image, model: 'sonnet', role: 'Carruseles Instagram con Higgsfield', status: 'idle' },
];

const SAMPLE_POSTS: PublishedPost[] = [
  { id: '1', platform: 'linkedin', date: '2026-06-15 09:00', content: 'El poder de crear contenido desde tu voz (conceptual)', status: 'published' },
  { id: '2', platform: 'linkedin', date: '2026-06-17 09:00', content: '3 pasos para grabar un post en 5 minutos (práctico)', status: 'scheduled' },
  { id: '3', platform: 'instagram', date: '2026-06-20 10:00', content: 'Carrusel: De la idea al post en 3 pasos', status: 'scheduled' },
];

// ── Component ──────────────────────────────────────────────────────

function LevelCard({
  level,
  isOpen,
  onToggle,
  children,
}: {
  level: typeof LEVELS[0];
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const Icon = level.icon;
  return (
    <div className={`border ${level.borderColor} rounded-xl bg-void/60 backdrop-blur-sm overflow-hidden transition-all duration-200`}>
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-carbon/20 transition-colors ${isOpen ? 'border-b border-graphite/20' : ''}`}
      >
        <div className="flex items-center gap-3">
          <Icon className={`w-5 h-5 ${level.color}`} />
          <div className="text-left">
            <span className="text-sm font-semibold text-bone font-display">{level.title}</span>
            <span className={`text-[10px] font-mono block ${level.color}`}>{level.subtitle}</span>
          </div>
        </div>
        {isOpen ? <ChevronDown className="w-4 h-4 text-ash" /> : <ChevronRight className="w-4 h-4 text-ash" />}
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-5">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatusBadge({ status }: { status: AgentStatus['status'] }) {
  const map = {
    idle: { label: 'Inactivo', class: 'text-ash/50 bg-carbon/30' },
    running: { label: 'Ejecutando…', class: 'text-signal-cyan bg-signal-cyan/10' },
    done: { label: 'Completado', class: 'text-signal-lime bg-signal-lime/10' },
    error: { label: 'Error', class: 'text-signal-magenta bg-signal-magenta/10' },
  };
  const s = map[status];
  return (
    <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider ${s.class}`}>
      {s.label}
    </span>
  );
}

export default function MarketingView({ accent, onLogMessage }: MarketingViewProps) {
  const [openLevels, setOpenLevels] = useState<Set<string>>(new Set(['audio', 'content', 'publish']));
  const [agents, setAgents] = useState<AgentStatus[]>(INITIAL_AGENTS);
  const [showTranscription, setShowTranscription] = useState(false);
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const posts = SAMPLE_POSTS;
  const timeoutRefs = useRef<Set<number>>(new Set());

  // Cleanup timeouts on unmount — prevents stale state updates
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(clearTimeout);
      timeoutRefs.current.clear();
    };
  }, []);

  const toggleLevel = (id: string) => {
    setOpenLevels(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const runAgent = (agentId: string, onComplete?: () => void) => {
    setAgents(prev => prev.map(a => a.id === agentId ? { ...a, status: 'running' as const } : a));
    onLogMessage('info', `Marketing: Ejecutando agente ${agentId}...`);
    const id = window.setTimeout(() => {
      timeoutRefs.current.delete(id);
      setAgents(prev => prev.map(a => {
        if (a.id !== agentId) return a;
        const ok = a.id !== 'revisor' || Math.random() > 0.2; // 80% success for revisor
        return {
          ...a,
          status: ok ? 'done' as const : 'error' as const,
          output: ok
            ? a.id === 'redactor'
              ? 'Newsletter + 3 posts generados en output/'
              : a.id === 'revisor'
                ? JSON.stringify({ aprobado_global: true, puntuacion: 8.5, observaciones: [] }, null, 2)
                : a.id === 'publicador'
                  ? 'Posts programados en Metricool: LinkedIn 15/06 09:00'
                  : 'Carrusel generado con Higgsfield ✅'
            : 'No cumple criterios de brand_voice.md',
        };
      }));
      onLogMessage('ok', `Marketing: Agente ${agentId} completado`);
      onComplete?.();
    }, 1200);
    timeoutRefs.current.add(id);
  };

  const runPipeline = () => {
    if (pipelineRunning) return;
    setPipelineRunning(true);
    onLogMessage('info', 'Marketing: Iniciando pipeline completo...');

    // Reset agents
    setAgents(prev => prev.map(a => ({ ...a, status: 'idle' as const, output: undefined })));

    // Schedule with ID tracking for cleanup; pipeline flag clears after LAST agent completes
    const schedule = (delay: number, agentId: string, isLast = false) => {
      const id = window.setTimeout(() => {
        timeoutRefs.current.delete(id);
        runAgent(agentId, isLast ? () => {
          setPipelineRunning(false);
          onLogMessage('ok', 'Marketing: Pipeline completo finalizado ✅');
        } : undefined);
      }, delay);
      timeoutRefs.current.add(id);
    };

    // Sequential pipeline: redactor → revisor → publicador → carrusel
    schedule(300, 'redactor');
    schedule(2000, 'revisor');
    schedule(3800, 'publicador');
    schedule(5200, 'carrusel-designer', true); // pipelineRunning=false fires after carrusel's 1200ms completes
  };

  const getAccentClasses = () => {
    switch (accent) {
      case 'magenta': return 'bg-signal-magenta/10 text-signal-magenta border-signal-magenta/30';
      case 'lime': return 'bg-signal-lime/10 text-signal-lime border-signal-lime/30';
      case 'amber': return 'bg-signal-amber/10 text-signal-amber border-signal-amber/30';
      default: return 'bg-signal-cyan/10 text-signal-cyan border-signal-cyan/30';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-void">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-graphite/20 shrink-0">
        <div>
          <h1 className={`text-lg font-semibold font-display text-bone`}>
            Marketing Automation
          </h1>
          <p className="text-[10px] font-mono text-ash/60 mt-0.5">
            audio → contenido → publicado
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono text-ash/40 uppercase tracking-wider bg-carbon/20 px-2 py-1 rounded">
            Sistema por Niveles
          </span>
        </div>
      </div>

      {/* ── Stats Bar ── */}
      <div className="flex gap-4 px-6 py-3 border-b border-graphite/10 shrink-0">
        {[
          { label: 'Agentes', value: agents.length.toString(), color: 'text-signal-cyan' },
          { label: 'Activos', value: agents.filter(a => a.status === 'running').length.toString(), color: 'text-signal-magenta' },
          { label: 'Posts Programados', value: posts.filter(p => p.status === 'scheduled').length.toString(), color: 'text-signal-lime' },
          { label: 'Publicados', value: posts.filter(p => p.status === 'published').length.toString(), color: 'text-signal-amber' },
        ].map(stat => (
          <div key={stat.label} className="bg-carbon/20 rounded-lg px-3 py-2 flex items-center gap-2">
            <span className="text-[9px] font-mono text-ash/50 uppercase tracking-wider">{stat.label}</span>
            <span className={`text-sm font-bold font-display ${stat.color}`}>{stat.value}</span>
          </div>
        ))}
      </div>

      {/* ── Pipeline Trigger ── */}
      <div className="px-6 pt-4 pb-2 shrink-0">
        <button
          onClick={runPipeline}
          disabled={pipelineRunning}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 border ${getAccentClasses()} ${
            pipelineRunning ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-125 cursor-pointer'
          }`}
        >
          {pipelineRunning ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          {pipelineRunning ? 'Pipeline en ejecución…' : 'Ejecutar Pipeline Completo'}
        </button>
      </div>

      {/* ── Levels ── */}
      <div className="flex-1 overflow-y-auto px-6 py-3 space-y-3">
        {/* Level 1: Audio Pipeline */}
        <LevelCard level={LEVELS[0]} isOpen={openLevels.has('audio')} onToggle={() => toggleLevel('audio')}>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-[10px] font-mono text-ash/50 uppercase tracking-wider block mb-1">
                  Audio a transcribir
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 bg-carbon/30 border border-graphite/30 rounded-lg px-3 py-2 text-xs text-ash/70 font-mono">
                    audio/grabacion-2026-06-14.mp3
                  </div>
                  <button className="px-3 py-2 bg-carbon/40 border border-graphite/30 rounded-lg text-ash hover:text-bone hover:border-graphite/60 transition-colors cursor-pointer">
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div>
              <button
                onClick={() => setShowTranscription(!showTranscription)}
                className="flex items-center gap-2 text-[11px] font-mono text-ash/60 hover:text-bone transition-colors cursor-pointer"
              >
                {showTranscription ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showTranscription ? 'Ocultar transcripción' : 'Ver última transcripción'}
              </button>
              {showTranscription && (
                <div className="mt-2 bg-carbon/30 border border-graphite/20 rounded-lg p-3">
                  <p className="text-[11px] text-ash/70 font-mono leading-relaxed">
                    La clave del marketing hoy no es producir más, sino producir con intención.
                    Cada pieza de contenido debe tener un propósito claro y estar alineada con
                    tu voz de marca. El pipeline audio → texto → contenido nos permite grabar
                    una idea en 5 minutos y distribuirla en 3 formatos distintos...
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-[10px] font-mono text-ash/50">
              <span className="inline-block w-2 h-2 rounded-full bg-signal-cyan/60" />
              Transcripción con Faster-Whisper
            </div>
          </div>
        </LevelCard>

        {/* Level 2: Content Factory */}
        <LevelCard level={LEVELS[1]} isOpen={openLevels.has('content')} onToggle={() => toggleLevel('content')}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {agents.map(agent => {
                const AgentIcon = agent.icon;
                const canRun = !pipelineRunning && agent.status === 'idle';
                return (
                  <div
                    key={agent.id}
                    className={`bg-carbon/20 border border-graphite/20 rounded-xl p-3 transition-all duration-200 ${
                      agent.status === 'running' ? 'border-signal-cyan/40 shadow-[0_0_12px_rgba(0,240,255,0.08)]' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                          agent.status === 'done' ? 'bg-signal-lime/15 text-signal-lime' :
                          agent.status === 'error' ? 'bg-signal-magenta/15 text-signal-magenta' :
                          agent.status === 'running' ? 'bg-signal-cyan/15 text-signal-cyan' :
                          'bg-carbon/40 text-ash/50'
                        }`}>
                          <AgentIcon className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-bone font-display">{agent.name}</div>
                          <code className="text-[8px] font-mono text-ash/50 block">model: {agent.model}</code>
                        </div>
                      </div>
                      <StatusBadge status={agent.status} />
                    </div>
                    <p className="text-[10px] text-ash/60 font-mono mb-2">{agent.role}</p>
                    {agent.output && (
                      <div className="text-[9px] font-mono text-ash/50 bg-carbon/30 rounded px-2 py-1.5 mt-1 border border-graphite/10">
                        <pre className="whitespace-pre-wrap">{agent.output}</pre>
                      </div>
                    )}
                    {canRun && (
                      <button
                        onClick={() => runAgent(agent.id)}
                        className="mt-2 text-[9px] font-mono text-signal-cyan/60 hover:text-signal-cyan uppercase tracking-wider cursor-pointer transition-colors"
                      >
                        ▶ Ejecutar individual
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pipeline Flow Diagram */}
            <div className="bg-carbon/20 border border-graphite/15 rounded-lg p-3 mt-2">
              <div className="text-[9px] font-mono text-ash/40 uppercase tracking-wider mb-2">Flujo del Pipeline</div>
              <div className="flex items-center gap-1.5 text-[9px] font-mono">
                <span className="text-signal-cyan">audio</span>
                <ChevronRight className="w-3 h-3 text-ash/30" />
                <span className="text-signal-cyan">transcripción</span>
                <ChevronRight className="w-3 h-3 text-ash/30" />
                <span className="text-signal-magenta">redactor</span>
                <ChevronRight className="w-3 h-3 text-ash/30" />
                <span className="text-signal-magenta">revisor</span>
                <span className="text-[7px] text-signal-amber/60 bg-signal-amber/10 px-1 py-0.5 rounded">gate</span>
                <ChevronRight className="w-3 h-3 text-ash/30" />
                <span className="text-signal-lime">publicador</span>
                <ChevronRight className="w-3 h-3 text-ash/30" />
                <span className="text-signal-lime">carrusel</span>
              </div>
            </div>
          </div>
        </LevelCard>

        {/* Level 3: Publishing Engine */}
        <LevelCard level={LEVELS[2]} isOpen={openLevels.has('publish')} onToggle={() => toggleLevel('publish')}>
          <div className="space-y-4">
            {/* MCP Status */}
            <div className="flex gap-4">
              <div className="flex-1 bg-carbon/20 border border-graphite/15 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Globe className="w-3.5 h-3.5 text-signal-lime" />
                  <span className="text-[10px] font-mono text-ash/60">Metricool MCP</span>
                </div>
                <span className="text-[9px] font-mono text-signal-lime bg-signal-lime/10 px-2 py-0.5 rounded-full">Conectado</span>
              </div>
              <div className="flex-1 bg-carbon/20 border border-graphite/15 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Image className="w-3.5 h-3.5 text-signal-amber" />
                  <span className="text-[10px] font-mono text-ash/60">Higgsfield MCP</span>
                </div>
                <span className="text-[9px] font-mono text-signal-lime bg-signal-lime/10 px-2 py-0.5 rounded-full">Conectado</span>
              </div>
            </div>

            {/* Scheduled Posts */}
            <div>
              <div className="text-[10px] font-mono text-ash/50 uppercase tracking-wider mb-2">Posts Programados</div>
              <div className="space-y-2">
                {posts.map(post => (
                  <div key={post.id} className="flex items-center gap-3 bg-carbon/20 border border-graphite/15 rounded-lg px-3 py-2">
                    {post.platform === 'linkedin' ? (
                      <Linkedin className="w-4 h-4 text-[#0A66C2]" />
                    ) : (
                      <Instagram className="w-4 h-4 text-signal-magenta" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-bone truncate font-mono">{post.content}</p>
                      <p className="text-[9px] font-mono text-ash/40">{post.date}</p>
                    </div>
                    <span className={`text-[8px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      post.status === 'published'
                        ? 'text-signal-lime bg-signal-lime/10'
                        : post.status === 'scheduled'
                          ? 'text-signal-cyan bg-signal-cyan/10'
                          : 'text-ash/50 bg-carbon/30'
                    }`}>
                      {post.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </LevelCard>

        {/* Level 4: Brand & Assets */}
        <LevelCard level={LEVELS[3]} isOpen={openLevels.has('brand')} onToggle={() => toggleLevel('brand')}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-carbon/20 border border-graphite/15 rounded-lg p-3">
                <div className="text-xs font-semibold text-bone font-display mb-1">Brand Voice</div>
                <p className="text-[10px] font-mono text-ash/60 mb-2">
                  Tono, estructura y reglas por canal. Fuente de verdad para redactor y revisor.
                </p>
                <div className="flex items-center gap-2 text-[9px] font-mono">
                  <span className="text-signal-amber bg-signal-amber/10 px-2 py-0.5 rounded-full">brand_voice.md</span>
                  <span className="text-ash/40">→ SSoT</span>
                </div>
              </div>
              <div className="bg-carbon/20 border border-graphite/15 rounded-lg p-3">
                <div className="text-xs font-semibold text-bone font-display mb-1">Brand Design</div>
                <p className="text-[10px] font-mono text-ash/60 mb-2">
                  Paleta, tipografía, layout. Fuente de verdad para carrusel-designer.
                </p>
                <div className="flex items-center gap-2 text-[9px] font-mono">
                  <span className="text-signal-amber bg-signal-amber/10 px-2 py-0.5 rounded-full">brand_design.md</span>
                  <span className="text-ash/40">→ SSoT</span>
                </div>
              </div>
            </div>

            <div className="bg-carbon/20 border border-graphite/15 rounded-lg p-3">
              <div className="text-[10px] font-mono text-ash/50 uppercase tracking-wider mb-2">Skills del Sistema</div>
              <div className="flex flex-wrap gap-2">
                {[
                  { name: 'publica-esto', desc: 'Pipeline completo', color: 'text-signal-cyan' },
                  { name: 'carrusels', desc: 'Carrusel desde newsletter', color: 'text-signal-magenta' },
                ].map(skill => (
                  <div key={skill.name} className="bg-carbon/30 border border-graphite/10 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <code className={`text-[10px] font-mono ${skill.color}`}>/{skill.name}</code>
                      <span className="text-[9px] font-mono text-ash/40">{skill.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Architecture Summary */}
            <div className="bg-carbon/20 border border-graphite/15 rounded-lg p-3">
              <div className="text-[10px] font-mono text-ash/50 uppercase tracking-wider mb-2">Arquitectura</div>
              <pre className="text-[9px] font-mono text-ash/60 leading-relaxed whitespace-pre-wrap">
{`.claude/
├── agents/
│   ├── redactor.md          (sonnet)
│   ├── revisor.md           (haiku)  ← gate JSON
│   ├── publicador.md        (haiku)  ← Metricool MCP
│   └── carrusel-designer.md (sonnet) ← Higgsfield MCP
└── skills/
    ├── publica-esto/  SKILL.md
    └── carrusels/     SKILL.md`}
              </pre>
            </div>
          </div>
        </LevelCard>
      </div>
    </div>
  );
}
