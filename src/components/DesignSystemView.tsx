import React, { useState } from 'react';
import { 
  COLOR_SWATCHES, 
  SIGNAL_PALETTE, 
  SPACING_TOKENS 
} from '../data';
import { AccentColor } from '../types';
import { Copy, Check, Info, Sparkles, Sliders, Type, Grid } from 'lucide-react';
import { motion } from 'motion/react';

interface DesignSystemViewProps {
  accent: AccentColor;
  onAccentChange: (accent: AccentColor) => void;
  onLogMessage: (type: 'info' | 'ok' | 'warn' | 'err', text: string) => void;
}

export default function DesignSystemView({
  accent,
  onAccentChange,
  onLogMessage,
}: DesignSystemViewProps) {
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [customTypographyText, setCustomTypographyText] = useState<string>('CONSEQUENCES');
  const [formDemoInput, setFormDemoInput] = useState<string>('hola@consequences.fm');
  
  // Interactive switches local states
  const [switchesState, setSwitchesState] = useState({
    live: true,
    darkMode: true,
    notifications: false,
    hud: false,
  });

  const handleCopyHex = (hex: string, name: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    onLogMessage('ok', `HEX token copied to clipboard: ${name} (${hex})`);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  const handleSwitchToggle = (key: 'live' | 'darkMode' | 'notifications' | 'hud') => {
    const val = !switchesState[key];
    setSwitchesState(prev => ({ ...prev, [key]: val }));
    onLogMessage('info', `Design Component Switched: [${key}] changed to ${val}`);
  };

  // Accent color — single source of truth
  // One mapping defines ALL CSS outputs for a given accent name.
  // Every helper below reads from this object; never add a new switch.
  const accentMap: Record<AccentColor, {
    hex: string;
    textClass: string;
    borderClass: string;
    glowClass: string;
    btnSolid: string;
  }> = {
    cyan: {
      hex: '#00F0FF',
      textClass: 'text-signal-cyan',
      borderClass: 'border-signal-cyan focus:ring-signal-cyan/30',
      glowClass: 'glow-cyan border-signal-cyan/60 text-signal-cyan bg-signal-cyan/5',
      btnSolid: 'bg-signal-cyan text-void hover:bg-signal-cyan/90 shadow-[0_0_15px_rgba(0,240,255,0.3)]',
    },
    magenta: {
      hex: '#FF2E9A',
      textClass: 'text-signal-magenta',
      borderClass: 'border-signal-magenta focus:ring-signal-magenta/30',
      glowClass: 'glow-magenta border-signal-magenta/60 text-signal-magenta bg-signal-magenta/5',
      btnSolid: 'bg-signal-magenta text-void hover:bg-signal-magenta/90 shadow-[0_0_15px_rgba(255,46,154,0.3)]',
    },
    lime: {
      hex: '#C6FF3D',
      textClass: 'text-signal-lime',
      borderClass: 'border-signal-lime focus:ring-signal-lime/30',
      glowClass: 'glow-lime border-signal-lime/60 text-signal-lime bg-signal-lime/5',
      btnSolid: 'bg-signal-lime text-void hover:bg-signal-lime/90 shadow-[0_0_15px_rgba(198,255,61,0.3)]',
    },
    amber: {
      hex: '#FFB400',
      textClass: 'text-signal-amber',
      borderClass: 'border-signal-amber focus:ring-signal-amber/30',
      glowClass: 'glow-amber border-signal-amber/60 text-signal-amber bg-signal-amber/5',
      btnSolid: 'bg-signal-amber text-void hover:bg-signal-amber/90 shadow-[0_0_15px_rgba(255,180,0,0.3)]',
    },
    tokyo: {
      hex: '#00D4AA',
      textClass: 'text-signal-tokyo',
      borderClass: 'border-signal-tokyo focus:ring-signal-tokyo/30',
      glowClass: 'glow-tokyo border-signal-tokyo/60 text-signal-tokyo bg-signal-tokyo/5',
      btnSolid: 'bg-signal-tokyo text-void hover:bg-signal-tokyo/90 shadow-[0_0_15px_rgba(0,212,170,0.3)]',
    },
    matteWhite: {
      hex: '#F5F5F0',
      textClass: 'text-signal-matte-white',
      borderClass: 'border-signal-matte-white focus:ring-signal-matte-white/30',
      glowClass: 'glow-matte-white border-signal-matte-white/60 text-signal-matte-white bg-signal-matte-white/5',
      btnSolid: 'bg-signal-matte-white text-void hover:bg-signal-matte-white/90 shadow-[0_0_15px_rgba(245,245,240,0.3)]',
    },
    custom: {
      hex: '#888888',
      textClass: 'text-signal-custom',
      borderClass: 'border-signal-custom focus:ring-signal-custom/30',
      glowClass: 'glow-custom border-signal-custom/60 text-signal-custom bg-signal-custom/5',
      btnSolid: 'bg-signal-custom text-void hover:bg-signal-custom/90 shadow-[0_0_15px_rgba(136,136,136,0.3)]',
    },
  };

  return (
    <div className="flex-1 p-6 md:p-8 overflow-y-auto z-10 custom-scrollbar select-none max-w-5xl mx-auto space-y-12 pb-24">
      
      {/* SECTION 1: OVERVIEW */}
      <section className="border-b border-graphite/35 pb-8 space-y-4">
        <div className="flex items-center gap-2 text-stone-500 font-mono text-[10px] tracking-wider uppercase">
          <span>// 01 //</span> <span className={getAccentTextClass()}>FOUNDATION OVERVIEW</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold uppercase tracking-tight text-bone">
          CONSEQUENCES DESIGN SPEC
        </h1>
        <p className="text-ash/80 font-body text-sm leading-relaxed max-w-2xl">
          Inspirado en interfaces de rendimiento técnico, estética cyberpunk, alto contraste adaptativo y control preciso de elementos de interfaz. Esta especificación describe el comportamiento métrico, colorimétrico y tipográfico de la plataforma Consequences.
        </p>

        {/* Dynamic Demo Warning */}
        <div className="border border-graphite/40 bg-carbon/25 p-4 rounded-lg flex items-start gap-3">
          <Info className={`w-5 h-5 mt-0.5 flex-shrink-0 ${getAccentTextClass()}`} />
          <div className="text-xs space-y-1">
            <div className="font-bold text-bone font-mono uppercase">Interactive Accent Controller Enabled</div>
            <div className="text-slate font-body">
              Modify the signal accent below or in the topbar header. Every dynamic component, halo glow, and reactive focal system across the view will adapt instantaneously to mimic full system parity.
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: COLOR SYSTEM */}
      <section className="border-b border-graphite/35 pb-8 space-y-6">
        <div className="flex justify-between items-baseline">
          <div className="flex items-center gap-2 text-stone-500 font-mono text-[10px] tracking-wider uppercase">
            <span>// 02 //</span> <span className={getAccentTextClass()}>SISTEMA DE COLOR & LUMINISCENCIA</span>
          </div>
          <span className="font-mono text-[10px] text-slate/50">BASE PALETTE V1.0</span>
        </div>

        <div className="space-y-2">
          <h2 className="font-display text-xl font-bold uppercase text-bone">Voids, Surfaces & Neutrals</h2>
          <p className="text-ash text-xs font-body">
            El color no es meramente estético, sino funcional. Se compone de una escala de negros cromáticos profundos para la gestión de capas superficiales. Click on any block to copy its HEX token.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {COLOR_SWATCHES.map((swatch) => (
            <div 
              key={swatch.hex}
              onClick={() => handleCopyHex(swatch.hex, swatch.name)}
              className="bg-carbon/30 border border-graphite/30 rounded-lg overflow-hidden group cursor-pointer hover:-translate-y-1 transition-all duration-200"
            >
              <div 
                className="h-16 w-full border-b border-graphite/10 transition-transform duration-200 group-hover:scale-105" 
                style={{ backgroundColor: swatch.hex }}
              />
              <div className="p-2.5 font-mono text-[10px] relative">
                <div className="font-bold text-bone">{swatch.name}</div>
                <div className="text-slate flex items-center justify-between mt-1">
                  <span>{swatch.hex}</span>
                  {copiedHex === swatch.hex ? (
                    <Check className="w-3 h-3 text-signal-lime" />
                  ) : (
                    <Copy className="w-3 h-3 group-hover:text-bone opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Signal Palette */}
        <div className="space-y-4 pt-4">
          <div className="font-mono text-[10px] text-ash uppercase tracking-wider">// SIGNAL PALETTE (ACENTOS & ESTADOS ACTIVOS)</div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {SIGNAL_PALETTE.map((sig) => {
              const isActiveAccent = accent === sig.name.toLowerCase().split(' ')[1];
              
              // Map local color borders for display cards
              const getLocalCardStyle = () => {
                if (sig.name.includes('Cyan')) return 'border-signal-cyan/50 text-signal-cyan hover:bg-signal-cyan/5 shadow-[0_0_12px_rgba(0,240,255,0.15)]';
                if (sig.name.includes('Magenta')) return 'border-signal-magenta/50 text-signal-magenta hover:bg-signal-magenta/5 shadow-[0_0_12px_rgba(255,0,255,0.15)]';
                if (sig.name.includes('Lime')) return 'border-signal-lime/50 text-signal-lime hover:bg-signal-lime/5 shadow-[0_0_12px_rgba(189,245,50,0.15)]';
                return 'border-signal-amber/50 text-signal-amber hover:bg-signal-amber/5 shadow-[0_0_12px_rgba(255,180,0,0.15)]';
};

  // Helper functions — read from the single accentMap source
  const getAccentHex = () => accentMap[accent].hex;
  const getAccentTextClass = () => accentMap[accent].textClass;
  const getAccentBorderClass = () => accentMap[accent].borderClass;
  const getAccentGlowClass = () => accentMap[accent].glowClass;
  const getAccentBtnSolid = () => accentMap[accent].btnSolid;

              return (
                <div 
                  key={sig.hex}
                  onClick={() => onAccentChange(sig.name.toLowerCase().split(' ')[1] as AccentColor)}
                  className={`p-4 rounded-lg bg-carbon/25 border cursor-pointer transition-all duration-300 relative ${getLocalCardStyle()} ${
                    isActiveAccent ? 'ring-2 ring-white scale-[1.02]' : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="font-mono text-[10px] uppercase font-bold tracking-widest">{sig.name}</div>
                  <div className="text-[20px] font-bold tracking-tight font-display mt-2">{sig.hex}</div>
                  <div className="text-[11px] text-ash font-body leading-relaxed mt-2">{sig.desc}</div>
                  
                  {isActiveAccent && (
                    <span className="absolute bottom-2 right-2 text-[9px] font-mono text-white bg-white/10 px-1 py-0.5 rounded">
                      ACTIVE
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 3: TYPOGRAPHY */}
      <section className="border-b border-[#1E2435]/65 pb-8 space-y-6">
        <div className="flex items-center gap-2 text-stone-500 font-mono text-[10px] tracking-wider uppercase">
          <span>// 03 //</span> <span className={getAccentTextClass()}>ESCALA Y JERARQUÍA TIPOGRÁFICA</span>
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-mono text-[10px] uppercase text-slate">Live text utility generator</label>
          <input 
            type="text" 
            value={customTypographyText}
            onChange={(e) => setCustomTypographyText(e.target.value.toUpperCase())}
            placeholder="Type preview string..."
            className="bg-carbon/20 border border-graphite/40 focus:border-signal-cyan outline-none rounded p-2.5 font-mono text-bone text-xs max-w-sm mb-4"
          />
        </div>

        <div className="space-y-6">
          {/* DISPLAY SCALE */}
          <div className="space-y-1">
            <span className="font-mono text-[10px] text-slate uppercase">DISPLAY SCALE // 88PT // LINE-HEIGHT: 1.0</span>
            
            {/* Spectacular Glitch signature split rendering */}
            <div className="relative py-4 select-none">
              <div className="font-display text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight uppercase leading-none text-white relative z-10 transition-colors">
                {customTypographyText || 'CONSEQUENCES'}
              </div>
              <div className="font-display text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight uppercase leading-none absolute top-4 left-[-2px] text-signal-cyan opacity-80 glitch-layer-1 select-none pointer-events-none" />
              <div className="font-display text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight uppercase leading-none absolute top-4 left-[2px] text-signal-magenta opacity-80 glitch-layer-2 select-none pointer-events-none" />
            </div>
            
            <p className="text-slate font-body text-xs leading-relaxed max-w-lg">
              Se utiliza tipografía de corte industrial geométrico y condensado (Space Grotesk). Su uso es estrictamente en MAYÚSCULAS y con interlineado/tracking muy ajustado (Tight).
            </p>
          </div>

          <div className="divider h-[1px] bg-graphite/30" />

          {/* H1 SCALE */}
          <div className="space-y-1">
            <span className="font-mono text-[10px] text-[#4A5273] uppercase">H1 // 60PT // LINE-HEIGHT: 1.1</span>
            <div className="font-display text-2xl sm:text-4xl text-[#FFFFFF] font-bold tracking-tight uppercase">
              {customTypographyText ? `EL FUTURO DE ${customTypographyText}` : 'EL FUTURO DE LA INTERFAZ'}
            </div>
          </div>

          <div className="divider h-[1px] bg-graphite/30" />

          {/* H2 SCALE */}
          <div className="space-y-1">
            <span className="font-mono text-[10px] text-[#4A5273] uppercase">H2 // 44PT // LINE-HEIGHT: 1.2</span>
            <div className="font-display text-xl sm:text-2xl text-[#C7CCD8] font-bold uppercase tracking-wide">
              DETALLES DEL SISTEMA ACTUAL
            </div>
          </div>

          <div className="divider h-[1px] bg-graphite/30" />

          {/* Body & Technical Scale Table */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div className="space-y-4">
              <div className="font-mono text-[10px] text-ash uppercase">// CUERPOS DE TEXTO INTER TIGHT</div>
              
              <div className="space-y-1">
                <div className="text-[11px] font-mono text-slate">BODY LG (18pt) // Wt: 400</div>
                <p className="text-bone font-body text-sm leading-relaxed">
                  Texto de introducción para publicaciones, newsletters de impacto o párrafos de apertura.
                </p>
              </div>

              <div className="space-y-1">
                <div className="text-[11px] font-mono text-slate">BODY (16pt) // Wt: 400</div>
                <p className="text-ash font-body text-xs leading-relaxed">
                  Cuerpo general optimizado para pantallas oscuras. Optimizado para evitar la fatiga ocular recurrente en interfaces de alta densidad.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="font-mono text-[10px] text-ash uppercase">// DATOS TÉCNICOS & METADATOS (JETBRAINS MONO)</div>
              
              <div className="space-y-1">
                <div className="text-[11px] font-mono text-slate">MONO (12pt) // Wt: 500</div>
                <div className="text-bone font-mono text-xs uppercase tracking-wider">
                  EP. 04 // 47 MIN // ESCUCHA AHORA →
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-[11px] font-mono text-slate">EYEBROW (11pt) // Wt: 450</div>
                <div className="text-[#4A5273] font-mono text-xs uppercase tracking-widest">
                  T-MINUS 12.07.2026 // SEÑAL 04
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: INTERACTIVE COMPONENTS & CONTROLS */}
      <section className="border-b border-graphite/35 pb-8 space-y-6">
        <div className="flex items-center gap-2 text-stone-500 font-mono text-[10px] tracking-wider uppercase">
          <span>// 04 //</span> <span className={getAccentTextClass()}>COMPONENTES Y CONTROLES DE INTERFAZ</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Inputs testing zone */}
          <div className="space-y-4">
            <span className="font-mono text-[11px] text-ash uppercase tracking-wider block border-b border-graphite/20 pb-1">
              CAMPOS DE ENTRADA DE DATOS (FORM INPUTS)
            </span>

            <div className="flex flex-col gap-1">
              <label className="font-mono text-[9px] uppercase text-slate">DEFAULT STATE</label>
              <input 
                type="email" 
                placeholder="tu@correo.com"
                className="bg-carbon/25 border border-graphite/40 focus:border-signal-cyan outline-none rounded p-2 text-bone font-body text-xs placeholder:text-[#2A3148] transition-all"
              />
              <span className="text-[10px] text-[#4A5273] font-body">Texto de soporte secundario o pie informativo</span>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-mono text-[9px] uppercase text-slate">FOCUS STATE (SELECT STATE)</label>
              <input 
                type="email" 
                value={formDemoInput}
                onChange={(e) => setFormDemoInput(e.target.value)}
                className={`bg-[#04060A] border rounded p-2 text-bone font-body text-xs outline-none focus:ring-2 focus:ring-offset-0 transition-all ${getAccentBorderClass()}`}
              />
              <span className="text-[10px] text-signal-lime font-mono uppercase flex items-center gap-1">
                ✓ SEÑAL VALIDADA — HANDSHAKE OK // ACTIVE SIGNAL
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-mono text-[9px] uppercase text-slate">ERROR STATE</label>
              <input 
                type="text" 
                value="Auth_Error: invalid_token_handshake"
                readOnly
                className="bg-carbon/20 border border-signal-magenta/50 rounded p-2 text-signal-magenta font-mono text-xs outline-none"
              />
              <span className="text-[10px] text-signal-magenta font-mono uppercase">
                ✗ ERROR CRÍTICO — SECURE ROUTELINE DEGRADED
              </span>
            </div>
          </div>

          {/* Interactive buttons & toggles */}
          <div className="space-y-6">
            <div className="space-y-4">
              <span className="font-mono text-[11px] text-ash uppercase tracking-wider block border-b border-graphite/20 pb-1">
                CONTROLES DE SELECCIÓN (INTERRUPTORES & TOGGLES)
              </span>

              <div className="bg-carbon/15 border border-graphite/30 rounded-lg p-4 space-y-3.5">
                {/* Switch Item 1 */}
                <div className="flex justify-between items-center bg-void/30 p-2.5 rounded border border-graphite/10">
                  <span className="font-body text-xs text-bone">Transmisión En Vivo</span>
                  <button 
                    type="button"
                    onClick={() => handleSwitchToggle('live')}
                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 outline-none ${
                      switchesState.live ? 'bg-signal-cyan' : 'bg-graphite'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-void absolute top-1 left-1 transition-transform ${
                      switchesState.live ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* Switch Item 2 */}
                <div className="flex justify-between items-center bg-void/30 p-2.5 rounded border border-graphite/10">
                  <span className="font-body text-xs text-bone">Modo Oscuro Profundo</span>
                  <button 
                    type="button"
                    onClick={() => handleSwitchToggle('darkMode')}
                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 outline-none ${
                      switchesState.darkMode ? 'bg-signal-magenta shadow-[0_0_8px_rgba(255,46,154,0.3)]' : 'bg-graphite'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-void absolute top-1 left-1 transition-transform ${
                      switchesState.darkMode ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* Switch Item 3 */}
                <div className="flex justify-between items-center bg-void/30 p-2.5 rounded border border-graphite/10">
                  <span className="font-body text-xs text-bone">Notificaciones Activas</span>
                  <button 
                    type="button"
                    onClick={() => handleSwitchToggle('notifications')}
                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 outline-none ${
                      switchesState.notifications ? 'bg-signal-lime' : 'bg-graphite'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-void absolute top-1 left-1 transition-transform ${
                      switchesState.notifications ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Buttons Showcase */}
            <div className="space-y-3">
              <span className="font-mono text-[10px] text-ash/80 uppercase">// SYSTEM BUTTONS ACTION RIG</span>
              
              <div className="flex flex-wrap gap-2.5">
                <button 
                  onClick={() => onLogMessage('ok', 'Primary CTA button triggered in style sandbox.')}
                  className={`px-4 py-2 font-display text-xs font-bold uppercase rounded tracking-wider transition-all duration-200 active:scale-95 ${getAccentBtnSolid()}`}
                >
                  ESCUCHA AHORA →
                </button>

                <button 
                  onClick={() => onLogMessage('info', 'Secondary button triggered in sandbox.')}
                  className="px-4 py-2 bg-gradient-to-r from-[#131826] to-[#1E2435] hover:from-[#1E2435] hover:to-[#2A3148] border border-graphite text-bone text-xs font-mono rounded tracking-wider transition-all duration-200"
                >
                  VER EPISODIOS
                </button>

                <button 
                  onClick={() => onLogMessage('warn', 'Danger override triggered.')}
                  className="px-4 py-2 bg-transparent border border-signal-magenta hover:bg-signal-magenta/10 text-signal-magenta text-xs font-mono rounded tracking-wider transition-all duration-200"
                >
                  ⚠ SYSTEM OVERRIDE
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: METRIC SPACING */}
      <section className="pb-8 space-y-6">
        <div className="flex items-center gap-2 text-stone-500 font-mono text-[10px] tracking-wider uppercase">
          <span>// 05 //</span> <span className={getAccentTextClass()}>SISTEMA DE ESPACIADO (ESCALA MÉTRICA DE 4PX)</span>
        </div>
        
        <p className="text-ash font-body text-xs max-w-xl">
          El ritmo visual y el empaquetado de todos los componentes dentro del layout se calculan mediante multiplicadores estrictos basados en una unidad base de 4px, garantizando simetría matemática en cualquier pantalla.
        </p>

        <div className="space-y-2.5 bg-carbon/15 border border-graphite/30 p-6 rounded-lg font-mono text-xs">
          {SPACING_TOKENS.map((item) => {
            // Compute dynamic bar width multiplier
            const barWidth = item.value * 2.5;
            
            return (
              <div key={item.token} className="flex items-center gap-4 group">
                <div className="w-12 text-ash font-bold uppercase">{item.token}</div>
                <div className="flex-1 bg-[#131826] h-5 rounded overflow-hidden flex items-center relative">
                  <div 
                    className="h-full bg-gradient-to-r from-signal-cyan/50 to-signal-cyan transition-all duration-500 group-hover:brightness-110" 
                    style={{ width: `${barWidth}px` }} 
                  />
                  <span className="absolute left-3 text-[9px] text-[#4A5273] font-mono select-none">
                    {item.desc}
                  </span>
                </div>
                <div className="w-12 text-right font-bold text-bone">{item.value}px</div>
              </div>
            );
          })}
        </div>
      </section>
      
    </div>
  );
}
