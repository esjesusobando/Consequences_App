import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: string) => void;
  activeTab: string;
}

const allCommands = [
  { id: 'dashboard', label: 'PRÓXIMA SESIÓN', description: 'Contador y sesiones de alignment', category: 'Navegación' },
  { id: 'personal_os', label: 'PERSONAL OS', description: 'Proyectos, tareas y métricas personales', category: 'Navegación' },
  { id: 'linear', label: 'TEAM LINEAR', description: 'Panel de equipo y gestión de issues', category: 'Navegación' },
  { id: 'operations', label: 'OPERACIONES', description: 'Gestión de operaciones y logística', category: 'Navegación' },
  { id: 'analytics', label: 'REPORTES & QR', description: 'Reportes, QR codes y métricas', category: 'Navegación' },
  { id: 'specs', label: 'ESTILOS', description: 'Sistema de diseño y guías de estilos', category: 'Navegación' },
  { id: 'terminal', label: 'TERMINAL', description: 'Consola de comandos CLI', category: 'Navegación' },
  { id: 'tabs', label: 'CONSEQUENCES TABS', description: 'Capturar y organizar URLs guardadas', category: 'Navegación' },
];

const categories = ['Navegación', 'Sistema', 'Git', 'Debug', 'Custom'];

export default function CommandPalette({ isOpen, onClose, onSelectTab, activeTab }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = allCommands.filter(cmd =>
    cmd.label.toLowerCase().includes(query.toLowerCase()) ||
    cmd.description.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, filtered.length - 1)); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); return; }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          onSelectTab(filtered[selectedIndex].id);
          onClose();
        }
        return;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, filtered, selectedIndex, onSelectTab, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-void/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Palette */}
      <div className="relative w-full max-w-lg bg-carbon/95 border border-graphite/50 rounded-xl shadow-2xl overflow-hidden animate-fade-in">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-graphite/40">
          <Search className="w-4 h-4 text-slate flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar ubicación o comando..."
            className="flex-1 bg-transparent text-bone font-mono text-sm outline-none placeholder:text-slate"
          />
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center text-slate hover:text-bone cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[300px] overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <div className="px-4 py-6 text-center font-mono text-[10px] text-slate uppercase tracking-widest">
              Sin resultados para "{query}"
            </div>
          ) : (
            filtered.map((cmd, idx) => {
              const isActive = cmd.id === activeTab;
              return (
                <button
                  key={cmd.id}
                  onClick={() => { onSelectTab(cmd.id); onClose(); }}
                  className={`w-full text-left px-4 py-2.5 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                    idx === selectedIndex ? 'bg-graphite/30' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {idx === selectedIndex && (
                      <span className="text-[8px] font-mono text-slate flex-shrink-0">▸</span>
                    )}
                    <div className="min-w-0">
                      <div className={`font-mono text-[11px] uppercase tracking-wider ${isActive ? 'text-bone font-bold' : 'text-bone/80'}`}>
                        {cmd.label}
                      </div>
                      <div className="font-mono text-[9px] text-slate truncate">{cmd.description}</div>
                    </div>
                  </div>
                  <span className="font-mono text-[8px] text-slate/50 uppercase flex-shrink-0">{cmd.category}</span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-graphite/30 flex items-center gap-4">
          <span className="font-mono text-[8px] text-slate flex items-center gap-1">
            <span className="px-1 py-0.5 bg-graphite/40 rounded border border-graphite/60">↑↓</span>
            navegar
          </span>
          <span className="font-mono text-[8px] text-slate flex items-center gap-1">
            <span className="px-1 py-0.5 bg-graphite/40 rounded border border-graphite/60">↵</span>
            seleccionar
          </span>
          <span className="font-mono text-[8px] text-slate flex items-center gap-1">
            <span className="px-1 py-0.5 bg-graphite/40 rounded border border-graphite/60">esc</span>
            cerrar
          </span>
        </div>
      </div>
    </div>
  );
}