import { SignalEvent, TerminalLine } from './types';

/**
 * Generate initial signals with a test meeting always 2 hours in the future
 * This ensures the countdown timer always has something to count down to
 */
export function getInitialSignals(): SignalEvent[] {
  const now = new Date();
  const futureTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // +2 hours
  const futureHour = String(futureTime.getHours()).padStart(2, '0');
  const futureMinute = String(futureTime.getMinutes()).padStart(2, '0');
  const testTime = `${futureHour}:${futureMinute}`;

  return [
    {
      id: 'MTG-TEST',
      time: testTime,
      title: 'Prueba de Contador',
      description: 'Reunión de prueba para verificar que el countdown funciona correctamente.',
      category: 'test',
      iconType: 'video',
      active: true,
    },
    {
      id: 'MTG-ALPHA',
      time: '14:00',
      title: 'Strategic Alignment',
      description: 'Quarterly review of project deliverables and design integration guidelines.',
      category: 'alpha',
      iconType: 'video',
      active: true,
    },
    {
      id: 'CL-BETA',
      time: '15:30',
      title: 'Vendor Review Sync',
      description: 'Contract terms examination and procurement checklist verification.',
      category: 'beta',
      iconType: 'phone',
      active: false,
    },
    {
      id: 'INT-OMEGA',
      time: '17:00',
      title: 'Daily Wrap-up',
      description: 'Operational summary reporting and engineering code base commit checks.',
      category: 'omega',
      iconType: 'group',
      active: false,
    }
  ];
}

export const INITIAL_SIGNALS = getInitialSignals();

export const INITIAL_LOG_LINES: TerminalLine[] = [
  { type: 'prompt', text: 'system.boot --mode=signal --env=prod', timestamp: '14:49:01' },
  { type: 'info', text: 'Initializing CONSEQUENCES Core OS v1.0.0_refined...', timestamp: '14:49:02' },
  { type: 'info', text: 'Loading luminescent signal color matrices and fonts...', timestamp: '14:49:03' },
  { type: 'ok', text: 'HANDSHAKE OK — Telemetry secure tunnel established.', timestamp: '14:49:03' },
  { type: 'info', text: 'Connected to node signal crossover. Synchronizing databases...', timestamp: '14:49:04' },
  { type: 'ok', text: 'Database integration status: DB_CONNECTED (100% parity)', timestamp: '14:49:04' },
  { type: 'warn', text: 'ASYNC PROCESS RUNNING — Keep terminal live stream active.', timestamp: '14:49:05' },
];

export const COLOR_SWATCHES = [
  { name: 'Void', hex: '#04060A', token: 'color-void', desc: 'Fondo más profundo absoluto. Lienzo oscuro primario.' },
  { name: 'Night', hex: '#0B0F18', token: 'color-night', desc: 'Capa base secundaria para contenedores principales o áreas estructuradas.' },
  { name: 'Carbon', hex: '#131826', token: 'color-carbon', desc: 'Superficies de tarjetas elevadas, cajas de entrada (inputs) o paneles modulares.' },
  { name: 'Graphite', hex: '#1E2435', token: 'color-graphite', desc: 'Bordes sutiles, divisiones, líneas guía y estados deshabilitados.' },
  { name: 'Steel', hex: '#2A3148', token: 'color-steel', desc: 'Tonos medios de control, bordes en estado activo secundario e iconografía.' },
  { name: 'Slate', hex: '#4A5273', token: 'color-slate', desc: 'Texto de apoyo de bajo contraste, etiquetas informativas y metadatos.' },
  { name: 'Ash', hex: '#7A839E', token: 'color-ash', desc: 'Texto secundario de alta legibilidad en bloques de lectura.' },
  { name: 'Bone', hex: '#C7CCD8', token: 'color-bone', desc: 'Texto principal del cuerpo. Optimizado para evitar la fatiga ocular.' },
  { name: 'Paper', hex: '#ECEEF5', token: 'color-paper', desc: 'Alto contraste neutro. Destacados fijos y acentos de texto de alta jerarquía.' },
  { name: 'Pure', hex: '#FFFFFF', token: 'color-pure', desc: 'Blanco puro absoluto. Iluminación y núcleos de efectos de brillo.' }
];

export const SIGNAL_PALETTE = [
  { name: 'Signal Cyan', hex: '#00F0FF', token: 'color-signal-cyan', desc: 'Acento primario, llamadas a la acción (CTA), estados de foco activos.' },
  { name: 'Signal Magenta', hex: '#FF2E9A', token: 'color-signal-magenta', desc: 'Acento secundario, alertas críticas de error, notificaciones nuevas, reproducción.' },
  { name: 'Signal Lime', hex: '#C6FF3D', token: 'color-signal-lime', desc: 'Acento terciario, citas destacadas, bloques con perspectiva conceptual.' },
  { name: 'Signal Amber', hex: '#FFB400', token: 'color-signal-amber', desc: 'Indicador de advertencia preventiva, procesos en desarrollo, estado On-Air.' }
];

export const SPACING_TOKENS = [
  { token: 's-1', value: 4, desc: 'Separación de textos internos y micro-ajustes de iconos.' },
  { token: 's-2', value: 8, desc: 'Padding interno de inputs de formulario y botones compactos.' },
  { token: 's-3', value: 12, desc: 'Espaciado entre textos de etiquetas primarias y secundarias.' },
  { token: 's-4', value: 16, desc: 'Margen base entre elementos de listas y contenedores simples.' },
  { token: 's-5', value: 24, desc: 'Padding general para tarjetas pequeñas y márgenes interiores.' },
  { token: 's-6', value: 32, desc: 'Separación estándar entre bloques de texto del mismo encabezado.' },
  { token: 's-7', value: 48, desc: 'Márgenes estructurales de secciones internas.' },
  { token: 's-8', value: 64, desc: 'Espacio de separación mayor entre grupos funcionales masivos.' },
  { token: 's-9', value: 96, desc: 'Márgenes de seguridad perimetrales de páginas e introducciones.' }
];
