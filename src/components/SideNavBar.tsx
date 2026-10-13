import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutGrid, 
  Code, 
  Sliders, 
  LogOut, 
  Monitor, 
  FolderKanban, 
  Boxes, 
  TrendingUp, 
  CalendarDays,
  Menu,
  X,
  ChevronRight,
  Mail,
  ListTodo,
  Megaphone,
  Wrench,
  Bookmark,
} from 'lucide-react';
import { AccentColor } from '../types';

export type TabId = 'dashboard' | 'email' | 'tasks' | 'marketing' | 'personal_os' | 'linear' | 'operations' | 'analytics' | 'specs' | 'terminal' | 'tools' | 'tabs';

interface SideNavBarProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  accent: AccentColor;
  onSystemReset: () => void;
  hideLeftPanel: boolean;
}

interface MenuItem {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  desc: string;
  /** When true, the item shows directly in the sidebar. When false, it lives inside the hamburger menu. */
  ready: boolean;
}

export default function SideNavBar({
  activeTab,
  setActiveTab,
  accent,
  onSystemReset,
  hideLeftPanel,
}: SideNavBarProps) {
  
  const [hamburgerOpen, setHamburgerOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close hamburger on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setHamburgerOpen(false);
      }
    };
    if (hamburgerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [hamburgerOpen]);

  const getAccentBgClass = () => {
    switch (accent) {
      case 'magenta': return 'text-signal-magenta bg-signal-magenta/10';
      case 'lime': return 'text-signal-lime bg-signal-lime/10';
      case 'amber': return 'text-signal-amber bg-signal-amber/10';
      default: return 'text-signal-cyan bg-signal-cyan/10';
    }
  };

  // ── Menu items with ready flag ──────────────────────────────────
  // Toggle `ready: true` to pull an item out of the hamburger and into the sidebar.
  // Dashboard, Email, and Tasks are ready. As we work on each view, flip its flag.
  const menuItems: MenuItem[] = [
    { id: 'dashboard',    label: 'Sesión Reunión', icon: CalendarDays,  desc: 'Próxima Reunión & Conteo',                    ready: true  },
    { id: 'email',        label: 'Email',          icon: Mail,          desc: 'Gestor de Correos (Superhuman-like)',          ready: true  },
    { id: 'tasks',        label: 'Tareas',         icon: ListTodo,      desc: 'Backlog, Scheduling & Time Tracking',          ready: true  },
    { id: 'marketing',    label: 'Marketing',      icon: Megaphone,     desc: 'Audio Pipeline & Content Automation',          ready: true  },
    { id: 'personal_os',  label: 'Personal OS',    icon: Monitor,       desc: 'Espacio Personal (Supernative, OCR, Codex)',   ready: false },
    { id: 'linear',       label: 'Linear Team',    icon: FolderKanban,  desc: 'Varios Proyectos & Criterios SOTA',            ready: false },
    { id: 'operations',   label: 'Operaciones',    icon: Boxes,         desc: 'SKU, Variantes, Bodegas, Compras',             ready: false },
    { id: 'analytics',    label: 'Analíticas',     icon: TrendingUp,    desc: 'Balance Valuación, QR, Reportes CSV/PDF',      ready: false },
    { id: 'specs',        label: 'Design Guide',   icon: Code,          desc: 'Guías de Estilo & Color Specs',                ready: false },
    { id: 'terminal',     label: 'CLI Terminal',   icon: Sliders,       desc: 'Comandos del Sistema',                         ready: false },
    { id: 'tools',        label: 'Tools',          icon: Wrench,        desc: 'Editor Imagen, QR, Prompts, Passwords',        ready: true  },
    { id: 'tabs',         label: 'Tabs',           icon: Bookmark,      desc: 'Capturar y organizar URLs',                    ready: false },
  ];

  const visibleItems = menuItems.filter(item => item.ready);
  const hamburgerItems = menuItems.filter(item => !item.ready);

  return (
    <nav className={`bg-void border-r border-graphite/45 h-screen w-14 left-0 fixed top-0 flex flex-col pt-14 z-40 items-center justify-between pb-6 select-none transition-transform duration-300 ${hideLeftPanel ? '-translate-x-full font-sans' : 'translate-x-0'}`}>
      
      <div className="flex flex-col gap-3.5 mt-6 w-full px-2" ref={menuRef}>
        
        {/* ── Hamburger button (contains pending/unreleased views) ── */}
        {hamburgerItems.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setHamburgerOpen(prev => !prev)}
              className={`flex justify-center py-2.5 rounded-lg cursor-pointer transition-all duration-200 w-full ${
                hamburgerOpen
                  ? getAccentBgClass()
                  : 'text-ash hover:text-bone hover:bg-carbon/30'
              }`}
              title={`${hamburgerItems.length} vistas en desarrollo`}
            >
              {hamburgerOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Hamburger dropdown panel */}
            {hamburgerOpen && (
              <div className="absolute left-16 top-0 z-50 bg-[#0d1117]/98 border border-graphite/70 rounded-xl shadow-2xl p-2 min-w-[220px] backdrop-blur-md">
                <div className="text-[8px] font-mono text-ash/50 uppercase tracking-widest px-2.5 py-1.5 border-b border-graphite/30 mb-1">
                  Vistas en desarrollo
                </div>
                {hamburgerItems.map((item) => {
                  const Icon = item.icon;
                  const active = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setHamburgerOpen(false);
                      }}
                      className={`flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-left transition-all duration-150 group ${
                        active
                          ? getAccentBgClass()
                          : 'text-ash hover:text-bone hover:bg-carbon/40'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-[10px] font-semibold uppercase tracking-wide">{item.label}</span>
                        <span className="text-[8px] text-ash/50 font-mono">{item.desc}</span>
                      </div>
                      <ChevronRight className="w-3 h-3 ml-auto text-ash/30 group-hover:text-bone/60 transition-colors" />
                    </button>
                  );
                })}
                <div className="text-[7px] font-mono text-ash/30 uppercase tracking-wider px-2.5 pt-2 mt-1 border-t border-graphite/20">
                  Se activan al completar desarrollo
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Ready/visible items (currently only dashboard) ── */}
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex justify-center py-2.5 rounded-lg cursor-pointer transition-all duration-200 group relative ${
                active
                  ? getAccentBgClass()
                  : 'text-ash hover:text-bone hover:bg-carbon/30'
              }`}
              title={item.label}
            >
              <Icon className="w-5 h-5" />
              <span className="absolute left-16 bg-carbon/95 border border-graphite/80 px-2.5 py-1 rounded text-[10px] text-bone uppercase tracking-widest opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-150 z-50 whitespace-nowrap shadow-xl">
                {item.desc}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-4 w-full px-2 mb-4">
        <button
          onClick={onSystemReset}
          className="text-ash hover:text-signal-magenta hover:bg-signal-magenta/10 rounded-lg flex justify-center py-2.5 cursor-pointer transition-all relative group"
          title="Resetear Memoria OS"
        >
          <LogOut className="w-5 h-5 rotate-180" />
          <span className="absolute left-16 bg-carbon border border-graphite px-2.5 py-1 rounded text-[10px] text-signal-magenta bg-signal-magenta/5 uppercase tracking-widest opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-150 z-50 whitespace-nowrap">
            Reiniciar Almacenamiento
          </span>
        </button>
      </div>
    </nav>
  );
}
