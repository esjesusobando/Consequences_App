import React, { useEffect, useState, useRef } from 'react';
import { Eye, EyeOff, ChevronDown, Menu } from 'lucide-react';
import { AccentColor } from '../types';
import type { TabId } from './SideNavBar';

interface TopNavBarProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  accent: AccentColor;
  onAccentChange: (accent: AccentColor) => void;
  onOpenSettings: () => void;
  focusMode: boolean;
  onToggleFocus: () => void;
  onOpenCommandPalette: () => void;
}

const tabLabels: Record<string, string> = {
  dashboard: 'PRÓXIMA SESIÓN',
  email: 'EMAIL',
  tasks: 'TAREAS',
  marketing: 'MARKETING',
  personal_os: 'PERSONAL OS',
  linear: 'TEAM LINEAR',
  operations: 'OPERACIONES',
  analytics: 'REPORTES & QR',
  specs: 'ESTILOS',
  terminal: 'TERMINAL',
  tools: 'TOOLS',
};

const allTabs = ['dashboard', 'personal_os', 'linear', 'operations', 'analytics', 'specs', 'terminal'] as const;

export default function TopNavBar({
  activeTab,
  setActiveTab,
  accent,
  onOpenSettings,
  focusMode,
  onToggleFocus,
  onOpenCommandPalette,
}: TopNavBarProps) {
  const [visible, setVisible] = useState<boolean>(true);
  const [showPanel, setShowPanel] = useState<boolean>(false);
  const [clockText, setClockText] = useState<string>('');
  const panelRef = useRef<HTMLDivElement>(null);

  // Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const days = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
      const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
      const dayName = days[now.getDay()];
      const dayNum = now.getDate();
      const monthName = months[now.getMonth()];
      const yearNum = now.getFullYear();
      const hrs = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      setClockText(`${dayName}, ${dayNum} ${monthName} ${yearNum} — ${hrs}:${mins}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close panel on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowPanel(false);
      }
    };
    if (showPanel) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPanel]);

  // Ctrl+K to open command palette
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        onOpenCommandPalette();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onOpenCommandPalette]);

  const getAccentColor = () => {
    switch (accent) {
      case 'magenta': return '#FF2D78';
      case 'lime': return '#CCFF00';
      case 'amber': return '#FFB800';
      default: return '#00E5FF';
    }
  };

  // HIDDEN MODE - minimal bar
  if (!visible) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-9 bg-void/90 backdrop-blur-md border-b border-graphite/30">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[9px] text-ash uppercase tracking-widest">
            {tabLabels[activeTab]}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleFocus}
            className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${
              focusMode ? 'text-signal-lime' : 'text-ash hover:text-bone'
            }`}
            title={focusMode ? 'Salir de Focus' : 'Focus Mode'}
          >
            {focusMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    );
  }

  // VISIBLE MODE - ultra minimal
  return (
    <>
      <header
        ref={panelRef}
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-9 bg-void/90 backdrop-blur-md border-b border-graphite/30 select-none"
      >
        {/* LEFT: Clock + Location name (click to show panel) */}
        <div className="flex items-center gap-4">
          {/* Clock */}
          <span className="font-mono text-[9px] text-ash tracking-wider">
            {clockText}
          </span>

          <div className="w-[1px] h-3 bg-graphite/30" />

          {/* Current location - click to expand panel */}
          <div className="relative">
            <button
              onClick={() => { setShowPanel(p => !p); setVisible(true); }}
              className="flex items-center gap-1.5 cursor-pointer group"
              title="Ver todas las ubicaciones"
            >
              <span
                className="font-mono text-[10px] uppercase tracking-widest transition-colors"
                style={{ color: getAccentColor() }}
              >
                {tabLabels[activeTab]}
              </span>
              <ChevronDown className="w-3 h-3 text-ash" />
            </button>

            {/* Dropdown panel */}
            {showPanel && (
              <div className="absolute top-7 left-0 bg-carbon/95 backdrop-blur-md border border-graphite/50 rounded-lg shadow-xl py-1 min-w-[200px] z-[100] animate-fade-in">
                <div className="px-3 py-1.5 border-b border-graphite/30">
                  <span className="font-mono text-[8px] text-ash uppercase tracking-widest">
                    UBICACIÓN ACTUAL
                  </span>
                </div>
                {allTabs.map((tab) => {
                  const isActive = tab === activeTab;
                  return (
                    <button
                      key={tab}
                      onClick={() => {
                        setActiveTab(tab);
                        setShowPanel(false);
                      }}
                      className={`w-full text-left px-3 py-2 font-mono text-[10px] uppercase tracking-wider transition-colors cursor-pointer ${
                        isActive ? 'text-bone font-bold' : 'text-ash hover:text-bone'
                      }`}
                    >
                      <span className="mr-2">{isActive ? '▸' : '·'}</span>
                      {tabLabels[tab]}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Settings + ⌘K + Focus */}
        <div className="flex items-center gap-2">
          {/* Hamburger - Settings */}
          <button
            onClick={onOpenSettings}
            className="w-6 h-6 flex items-center justify-center text-ash hover:text-bone cursor-pointer transition-colors"
            title="Configuración"
          >
            <Menu className="w-3.5 h-3.5" />
          </button>

          {/* Ctrl+K command palette */}
          <button
            onClick={onOpenCommandPalette}
            className="flex items-center gap-1 font-mono text-[8px] text-ash hover:text-bone transition-colors cursor-pointer uppercase tracking-widest"
            title="Command Palette (Ctrl+K)"
          >
            <span className="text-[7px] px-1 py-0.5 bg-graphite/40 rounded border border-graphite/60">⌘K</span>
          </button>

          {/* Focus mode toggle */}
          <button
            onClick={onToggleFocus}
            className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${
              focusMode ? 'text-signal-lime' : 'text-ash hover:text-bone'
            }`}
            title={focusMode ? 'Salir de Focus' : 'Focus Mode'}
          >
            {focusMode ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          </button>
        </div>
      </header>
    </>
  );
}