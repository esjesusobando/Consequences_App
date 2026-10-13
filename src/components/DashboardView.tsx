import React, { useState, useEffect } from 'react';
import {
  Plus,
  Video,
  Phone,
  Users,
  Trash2,
  Check,
  Clock,
  X,
  Sparkles,
  Play,
  Pause,
  RefreshCw,
  Calendar as CalendarIcon,
  Link,
  UserCheck,
  CheckCircle2,
  CalendarDays,
  ExternalLink,
  Edit2,
  Save,
  LogIn,
  LogOut,
  List,
  ChevronUp,
  ChevronDown,
  GripVertical,
} from 'lucide-react';
import { SignalEvent, AccentColor, PresentationConfig } from '../types';
import { useCountdownRecalculate } from '../hooks/useCountdown';
import { motion, AnimatePresence } from 'motion/react';
import { 
  googleSignIn, 
  logout, 
  createCalendarEvent, 
  updateCalendarEvent, 
  deleteCalendarEvent, 
  fetchCalendarEvents 
} from '../lib/googleAuth';

interface DashboardViewProps {
  signals: SignalEvent[];
  setSignals: React.Dispatch<React.SetStateAction<SignalEvent[]>>;
  accent: AccentColor;
  nodeStatus: string;
  onLogMessage: (type: 'info' | 'ok' | 'warn' | 'err', text: string) => void;
  hideRightPanel: boolean;
  config: PresentationConfig;
  user: GoogleUser | null;
  setUser: React.Dispatch<React.SetStateAction<GoogleUser | null>>;
  googleToken: string | null;
  setGoogleToken: React.Dispatch<React.SetStateAction<string | null>>;
}

interface GoogleUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

interface GoogleCalendarItem {
  id: string;
  summary?: string;
  description?: string;
  start?: {
    dateTime?: string;
    date?: string;
  };
}

export function DashboardView({
  signals,
  setSignals,
  accent,
  nodeStatus,
  onLogMessage,
  hideRightPanel,
  config,
  user,
  setUser,
  googleToken,
  setGoogleToken,
}: DashboardViewProps) {
  // Countdown Timer — uses shared recalculate from useCountdown hook
  const { secondsLeft, isTimerRunning, nextMeetingTitle, setSecondsLeft, setIsTimerRunning } = useCountdownRecalculate(signals, onLogMessage);

  // Editable project name shown above/below the countdown (persisted)
  const [projectName, setProjectName] = useState<string>(() => {
    try {
      return localStorage.getItem('zc_project_name') || 'Sin Proyecto';
    } catch { return 'Sin Proyecto'; }
  });
  const [editingProject, setEditingProject] = useState<boolean>(false);

  // Persist project name
  useEffect(() => {
    try {
      localStorage.setItem('zc_project_name', projectName);
    } catch (err) {
      console.warn('[zc_project_name] save failed:', err);
    }
  }, [projectName]);

  // Neutral color cycling for countdown header text (visibility on any background)
  // Uses text-ash which adapts to both dark (#7A839E) and editorial (#6B7280) modes
  const neutralColors = [
    'text-ash',
    'text-ash/80',
    'text-ash/70',
    'text-ash/85',
    'text-ash/75',
    'text-ash/90',
  ];
  const [headerColorIndex, setHeaderColorIndex] = useState<number>(0);

  // Sidebar view toggle: 'meeting' | 'tasks' | 'calendar'
  const [sidebarView, setSidebarView] = useState<'meeting' | 'tasks' | 'calendar'>('meeting');

  // Modal/Form toggle for adding a new calendar sync signal
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newTime, setNewTime] = useState<string>('16:00');
  const [newId, setNewId] = useState<string>('');
  const [newIcon, setNewIcon] = useState<string>('video');
  const [newDesc, setNewDesc] = useState<string>('');

  // Which task is being edited inline (tasks view)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  // Selected inspected meeting
  const [selectedSignal, setSelectedSignal] = useState<SignalEvent | null>(signals[0] || null);

  // Active Inline Editor Form State for Selected Meeting details
  const [isEditingSelected, setIsEditingSelected] = useState<boolean>(false);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editTime, setEditTime] = useState<string>('');
  const [editDesc, setEditDesc] = useState<string>('');
  const [editIcon, setEditIcon] = useState<string>('video');

  // Drag & drop reorder state for meetings list
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Reorder signals: move item from one index to another
  const handleReorderSignal = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    if (toIndex < 0 || toIndex >= signals.length) return;
    setSignals(prev => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
    onLogMessage('info', `Reunión reordenada: posición ${fromIndex + 1} → ${toIndex + 1}`);
  };

  // Move meeting up
  const handleMoveUp = (index: number) => {
    if (index > 0) handleReorderSignal(index, index - 1);
  };

  // Move meeting down
  const handleMoveDown = (index: number) => {
    if (index < signals.length - 1) handleReorderSignal(index, index + 1);
  };

  // HTML5 drag handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    const fromIndex = Number(e.dataTransfer.getData('text/plain'));
    if (!isNaN(fromIndex)) {
      handleReorderSignal(fromIndex, toIndex);
    }
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  // Synchronize edits form state whenever selected event switches
  useEffect(() => {
    if (selectedSignal) {
      setEditTitle(selectedSignal.title);
      setEditTime(selectedSignal.time);
      setEditDesc(selectedSignal.description || '');
      setEditIcon(selectedSignal.iconType || 'video');
      setIsEditingSelected(false);
    }
  }, [selectedSignal]);

  // A safe confirmation wrapper that catches sandboxed iframe SecurityErrors
  const safeConfirm = (message: string): boolean => {
    try {
      return window.confirm(message);
    } catch (e) {
      console.warn("window.confirm blocked or failed in sandbox iframe; proceeding automatically with action.", e);
      return true;
    }
  };

  // Calendar Sync State
  const [calendarSyncStatus, setCalendarSyncStatus] = useState<'synchronized' | 'syncing' | 'offline'>('synchronized');

  // Bidirectional Synchronization loop: Fetch and match live events every 30 seconds
  useEffect(() => {
    if (!googleToken) return;

    const pullAndSync = async () => {
      try {
        setCalendarSyncStatus('syncing');
        const items = await fetchCalendarEvents(googleToken);
        if (!items) {
          // If simulation or empty, logged and kept offline fallback mode
          onLogMessage('info', 'Sincronizador GCalendar: Conectado y en línea con Workspace.');
          setCalendarSyncStatus('synchronized');
          return;
        }

        let updatedCount = 0;
        let newCount = 0;

        setSignals(prev => {
          let currentList = [...prev];
          items.forEach((item: GoogleCalendarItem) => {
            const googleId = item.id;
            const summary = item.summary || 'Reunión agendada';
            const desc = item.description || 'Detalles sincronizados vía Google Workspace API.';
            
            // Format dynamic start date to string (HH:MM)
            let timeStr = '12:00';
            if (item.start?.dateTime) {
              const dt = new Date(item.start.dateTime);
              timeStr = `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
            } else if (item.start?.date) {
              timeStr = '09:00';
            }

            const matchIndex = currentList.findIndex(s => s.googleEventId === googleId || s.id === googleId);
            if (matchIndex >= 0) {
              const matched = currentList[matchIndex];
              if (matched.title !== summary || matched.description !== desc || matched.time !== timeStr) {
                currentList[matchIndex] = {
                  ...matched,
                  title: summary,
                  description: desc,
                  time: timeStr
                };
                updatedCount++;
              }
            } else {
              // Create new event payload
              const cleanId = `G-${googleId.slice(0, 8).toUpperCase()}`;
              const newItem: SignalEvent = {
                id: cleanId,
                time: timeStr,
                title: summary,
                description: desc,
                category: 'calendario_sota',
                iconType: 'users',
                active: true,
                syncedToGoogleCalendar: true,
                googleEventId: googleId
              };
              currentList.push(newItem);
              newCount++;
            }
          });
          return currentList;
        });

        if (newCount > 0 || updatedCount > 0) {
          onLogMessage('ok', `Google Calendar: ${newCount} nuevas reuniones añadidas, ${updatedCount} actualizadas.`);
        }
        setCalendarSyncStatus('synchronized');
      } catch (err: unknown) {
        console.warn('Bidirectional pull failed:', err);
        setCalendarSyncStatus('offline');
      }
    };
 
    pullAndSync();
    const interval = setInterval(pullAndSync, 30000);
    return () => clearInterval(interval);
  }, [googleToken]);

  // Timer tick is now handled by the unified recalculation effect above

  // Compute display time string
  const formatCountdown = (totalSecs: number) => {
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    
    return {
      hoursStr: String(hours).padStart(2, '0'),
      minutesStr: String(minutes).padStart(2, '0'),
      secsStr: String(secs).padStart(2, '0')
    };
  };

  const { hoursStr, minutesStr, secsStr } = formatCountdown(secondsLeft);

  // Quick Preset buttons
  const setTimerPreset = (minutes: number) => {
    setSecondsLeft(minutes * 60);
    setIsTimerRunning(true);
    onLogMessage('info', `Cuenta regresiva de reunión ajustada: T-menos ${minutes} minutos.`);
  };

  // Trigger calendar synchronization
  const handleCalendarResync = async () => {
    if (googleToken) {
      try {
        setCalendarSyncStatus('syncing');
        onLogMessage('info', 'Estableciendo sincronización directa con Google Calendar...');
        const items = await fetchCalendarEvents(googleToken);
        if (items) {
          setCalendarSyncStatus('synchronized');
          onLogMessage('ok', `✓ Sincronización exitosa. ${items.length} reuniones actualizadas.`);
        }
      } catch (err: any) {
        setCalendarSyncStatus('offline');
        onLogMessage('err', `Fallo de sincronización: ${err instanceof Error ? err.message : String(err)}`);
      }
    } else {
      // Offline Simulation fallback
      setCalendarSyncStatus('syncing');
      onLogMessage('info', 'Estableciendo sincronización simulada de agenda personal...');
      setTimeout(() => {
        setCalendarSyncStatus('synchronized');
        onLogMessage('ok', 'Calendario simulado sincronizado con éxito. 3 eventos en cola.');
      }, 1200);
    }
  };

  // Add Signal (Meeting Event)
  const handleAddSignal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newTime.trim()) {
      onLogMessage('err', 'Error: Complete título y hora.');
      return;
    }

    const generatedId = (newId.trim() || `MTG-${Date.now().toString(36).toUpperCase()}`).toUpperCase().replace(/\s+/g, '-');
    let googleEventId = undefined;

    if (googleToken) {
      try {
        setCalendarSyncStatus('syncing');
        onLogMessage('info', `Registrando "${newTitle}" en Google Calendar...`);
        const result = await createCalendarEvent(googleToken, {
          title: newTitle,
          description: newDesc || 'Reunión agregada desde mi espacio SOTA.',
          time: newTime
        });
        if (result && result.id) {
          googleEventId = result.id;
          onLogMessage('ok', `✓ Evento registrado en Google Calendar (${result.id}).`);
        }
      } catch (err: any) {
        onLogMessage('warn', `Google API en espera: Creación registrada en memoria local.`);
      }
    }

    const payload: SignalEvent = {
      id: generatedId,
      time: newTime,
      title: newTitle,
      description: newDesc || 'Especificaciones técnicas de agenda para la sesión de meeting.',
      category: 'calendario_sota',
      iconType: newIcon,
      active: true,
      syncedToGoogleCalendar: true,
      googleEventId: googleEventId
    };

    setSignals((prev) => [...prev, payload]);
    setSelectedSignal(payload);
    onLogMessage('ok', `Reunión agendada [${payload.id}]: "${payload.title}" a las ${payload.time}`);
    
    // Reset Form
    setNewTitle('');
    setNewId('');
    setNewDesc('');
    setShowAddForm(false);
  };

  // Remove Signal with automatic Google Calendar Sync
  const handleRemoveSignal = async (id: string) => {
    const target = signals.find(s => s.id === id);
    if (!target) return;

    if (googleToken) {
      const confirmed = safeConfirm(`¿Confirmas que deseas eliminar "${target.title}" tanto localmente como de Google Calendar?`);
      if (!confirmed) return;

      try {
        setCalendarSyncStatus('syncing');
        await deleteCalendarEvent(googleToken, target.googleEventId || target.id);
        setCalendarSyncStatus('synchronized');
        onLogMessage('ok', `✓ Evento removido de Google Calendar.`);
      } catch (err: any) {
        onLogMessage('err', `Fallo al eliminar de Google Calendar: ${err.message}`);
      }
    } else {
      const confirmed = safeConfirm(`¿Seguro que deseas remover la reunión "${target.title}"?`);
      if (!confirmed) return;
    }

    const remainingSignals = signals.filter((s) => s.id !== id);
    setSignals(remainingSignals);
    onLogMessage('warn', `Sesión de meeting removida de la cola [${id}].`);
    if (selectedSignal?.id === id) {
      setSelectedSignal(remainingSignals[0] || null);
    }
  };

  // Switch Active signal (Google Calendar Sync status)
  const toggleSignalActive = (id: string) => {
    setSignals((prev) => 
      prev.map((s) => {
        if (s.id === id) {
          const updatedActive = !s.active;
          onLogMessage('info', `Sesión [${id}] - Sincronizada: ${updatedActive ? 'SI' : 'NO'}`);
          const updated = { ...s, active: updatedActive };
          if (selectedSignal?.id === id) {
            setSelectedSignal(updated);
          }
          return updated;
        }
        return s;
      })
    );
  };

  // Icon component helper
  const renderSignalIcon = (type: string, accentColorClass: string) => {
    const className = `w-4 h-4 ${accentColorClass}`;
    switch (type) {
      case 'video': return <Video className={className} />;
      case 'phone': return <Phone className={className} />;
      case 'group': return <Users className={className} />;
      default: return <Sparkles className={className} />;
    }
  };

  // System status color helpers
  const getAccentBorderClass = () => {
    switch (accent) {
      case 'magenta': return 'border-signal-amber text-signal-amber';
      case 'lime': return 'border-signal-lime text-signal-lime';
      case 'amber': return 'border-signal-amber text-signal-amber';
      default: return 'border-signal-cyan text-signal-cyan';
    }
  };

  const getAccentGlowClass = () => {
    switch (accent) {
      case 'magenta': return 'text-glow-magenta text-signal-amber';
      case 'lime': return 'text-glow-lime text-signal-lime';
      case 'amber': return 'text-glow-amber text-signal-amber';
      case 'matte-white': return 'text-[#E8E4D9]';
      default: return 'text-glow-cyan text-signal-cyan';
    }
  };

  const getAccentSolidBg = () => {
    switch (accent) {
      case 'magenta': return 'bg-signal-amber';
      case 'lime': return 'bg-signal-lime';
      case 'amber': return 'bg-signal-amber';
      default: return 'bg-signal-cyan';
    }
  };

  const getAccentBgClass = () => {
    switch (accent) {
      case 'magenta': return 'bg-signal-amber/10 text-signal-amber';
      case 'lime': return 'bg-signal-lime/10 text-signal-lime';
      case 'amber': return 'bg-signal-amber/10 text-signal-amber';
      default: return 'bg-signal-cyan/10 text-signal-cyan';
    }
  };

  // Save edited meeting details and publish automatically
  const handleSaveEditedSignal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSignal) return;
    
    // Auto sync confirmation
    const confirmed = safeConfirm(`¿Confirmas que deseas publicar estos cambios en la reunión "${editTitle}" a distancia en Google Calendar?`);
    if (!confirmed) return;

    const updatedSignal: SignalEvent = {
      ...selectedSignal,
      title: editTitle,
      time: editTime,
      description: editDesc,
      iconType: editIcon
    };

    // Update local React state list
    setSignals(prev => prev.map(s => s.id === selectedSignal.id ? updatedSignal : s));
    setSelectedSignal(updatedSignal);
    setIsEditingSelected(false);
    onLogMessage('ok', `Reunión [${selectedSignal.id}] actualizada en la cola local.`);

    if (googleToken) {
      try {
        setCalendarSyncStatus('syncing');
        onLogMessage('info', `Publicando cambios de "${editTitle}" en los servidores de Google...`);
        await updateCalendarEvent(googleToken, selectedSignal.googleEventId || selectedSignal.id, {
          title: editTitle,
          description: editDesc,
          time: editTime
        });
        setCalendarSyncStatus('synchronized');
        onLogMessage('ok', `✓ Evento actualizado con éxito en Google Workspace.`);
      } catch (err: any) {
        setCalendarSyncStatus('offline');
        onLogMessage('err', `Error al empujar actualización de agenda: ${err.message}`);
      }
    }
  };

  return (
    <div 
      id="first-tab-dashboard" 
      className={`flex-1 flex flex-col p-6 md:p-8 gap-8 overflow-y-auto z-10 custom-scrollbar select-none text-on-surface ${
        config?.panelsSwapped ? 'xl:flex-row-reverse' : 'xl:flex-row'
      }`}
    >
      
      {/* Central HUD panel: COUNTDOWN & ACTIVE MEETING DATA */}
      <div className="flex-1 flex flex-col justify-between relative bg-carbon/15 border border-graphite/35 rounded-xl p-6 md:p-8 min-h-[500px]">
        
        {/* Deco elements */}
        <div className="flex justify-between items-center w-full z-10">
          <div className="flex gap-2 items-center">
            <div className={`w-1.5 h-1.5 rounded-full ${getAccentSolidBg()}`} />
            <div className="w-10 h-[1px] bg-graphite" />
            <span className="font-mono text-[9px] tracking-widest text-ash/80">MEETING_SYNC_SYS</span>
          </div>

          <div className="flex gap-4 items-center mb-1">
            {editingProject ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const val = (e.target as HTMLFormElement).querySelector('input')?.value.trim();
                  if (val) setProjectName(val);
                  setEditingProject(false);
                }}
                className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded"
              >
                <span className="font-mono text-[9px] uppercase text-ash">Proyecto:</span>
                <input
                  defaultValue={projectName}
                  className="w-28 bg-transparent border border-signal-amber/40 outline-none rounded px-1.5 py-0.5 text-bone font-mono text-[9px] uppercase"
                  autoFocus
                />
                <button type="submit" className="text-signal-amber text-[8px] font-mono cursor-pointer">OK</button>
              </form>
            ) : (
              <span
                onClick={() => setEditingProject(true)}
                className="font-mono text-[9px] tracking-wider text-ash uppercase flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded cursor-pointer hover:text-bone transition-colors"
                title="Clic para editar nombre del proyecto"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-signal-amber animate-pulse" />
                Proyecto: <strong className="text-signal-amber">{projectName.toUpperCase()}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Outer Background subtle circles */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden animate-pulse">
          <div className="w-[320px] h-[320px] rounded-full border border-graphite/5" />
          <div className="w-[460px] h-[460px] rounded-full border border-graphite/5 absolute" />
        </div>

        {/* Countdown Content */}
        <div className="text-center z-10 my-8">
          <div
            onClick={() => setHeaderColorIndex((prev) => (prev + 1) % neutralColors.length)}
            className={`inline-block font-mono text-[10px] uppercase tracking-widest mb-4 border border-signal-amber/30 px-4 py-1.5 rounded-full bg-signal-amber/5 ${neutralColors[headerColorIndex]} cursor-pointer transition-all duration-200 hover:brightness-110`}
          >
            {isTimerRunning ? 'CONTEO REUNIÓN DE ALINEACIÓN PRÓXIMA SESIÓN' : 'SIN REUNIONES PENDIENTES HOY'}
          </div>
          
          <div className="flex justify-center items-center font-display text-[72px] sm:text-[100px] md:text-[132px] font-bold leading-none tracking-tighter">
            {isTimerRunning ? (
              <>
                <span className="text-[#4A5273] opacity-25 mr-2">-</span>
                <span className={getAccentGlowClass()}>
                  {hoursStr}:{minutesStr}:{secsStr}
                </span>
              </>
            ) : (
              <span className="text-[#4A5273] opacity-50 text-[48px] sm:text-[64px] md:text-[80px]">
                --:--:--
              </span>
            )}
          </div>

          {isTimerRunning && nextMeetingTitle && (
            <p className="font-mono text-[10px] text-signal-cyan tracking-wider mt-2 uppercase">
              → {nextMeetingTitle}
            </p>
          )}

          <p className="font-mono text-[9px] text-[#A6AFC9] tracking-[0.2em] mt-3 uppercase">
            {isTimerRunning ? 'TEMPORAL REGISTRY / GOOGLE CALENDAR SYNCED' : 'AGENDA LIBRE / SIN EVENTOS EN COLA'}
          </p>

          {/* Editable Project Name below countdown */}
          <div className="mt-4 flex justify-center">
            <div className="flex items-center gap-2 bg-black/30 border border-signal-amber/20 rounded-lg px-3 py-1.5">
              <span className="font-mono text-[8px] uppercase text-ash tracking-wider">Proyecto:</span>
              <input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-40 bg-transparent border-none outline-none text-bone font-mono text-[10px] uppercase text-center tracking-wider"
                placeholder="NOMBRE DEL PROYECTO"
              />
            </div>
          </div>
        </div>

        {/* Upcoming Session Details Card - EDITABLE FORM */}
        {selectedSignal && (
          <div className="z-10 bg-carbon/50 border border-graphite/40 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-3xl mx-auto w-full backdrop-blur-sm animate-fade-in mb-3">
            {isEditingSelected ? (
              <form onSubmit={handleSaveEditedSignal} className="w-full flex flex-col gap-3">
                <div className="flex justify-between items-center border-b border-graphite/35 pb-1.5 mb-1.5">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-signal-amber font-bold">
                    // EDITOR OPERACIONAL DE CAMPOS DE REUNIÓN:
                  </span>
                  <button 
                    type="button" 
                    onClick={() => setIsEditingSelected(false)} 
                    className="text-ash/80 hover:text-signal-amber text-[9px] font-mono uppercase font-bold"
                  >
                    X Cancelar
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1 md:col-span-2">
                    <label className="font-mono text-[8.5px] uppercase text-ash/80">Título de Reunión:</label>
                    <input 
                      type="text" 
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="bg-[#03060C] border border-graphite rounded px-2.5 py-1.5 text-bone font-mono text-[10.5px] focus:border-signal-cyan outline-none"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-mono text-[8.5px] uppercase text-ash/80">Hora (HH:MM):</label>
                    <input 
                      type="text" 
                      value={editTime}
                      onChange={(e) => setEditTime(e.target.value)}
                      className="bg-[#03060C] border border-graphite rounded px-2.5 py-1.5 text-bone font-mono text-[10.5px] focus:border-signal-cyan outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-mono text-[8.5px] uppercase text-ash/80">Descripción / Agenda de Sesión:</label>
                  <textarea 
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    rows={2}
                    className="bg-[#03060C] border border-graphite rounded px-2.5 py-1.5 text-bone font-mono text-[10px] focus:border-signal-cyan outline-none resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 mt-1">
                  <button 
                    type="submit"
                    className="px-3.5 py-1.5 bg-signal-lime text-void text-[9px] font-mono font-bold uppercase rounded flex items-center gap-1 cursor-pointer hover:bg-signal-lime/90 transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" /> Guardar Cambios
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="flex items-start gap-4">
                  <div className={`p-2.5 rounded-lg ${getAccentBgClass()} mt-1 border border-graphite/40 flex-shrink-0`}>
                    <CalendarDays className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <span className="font-mono text-[9px] uppercase tracking-widest text-slate block">// SESIÓN OPERACIONAL ACTIVA:</span>
                    <h4 className="text-sm font-bold text-bone font-body leading-snug">{selectedSignal.title}</h4>
                    <p className="text-xs text-[#A6AFC9] mt-0.5 max-w-xl leading-relaxed">{selectedSignal.description || 'Sin agenda registrada para este slot.'}</p>
                    <div className="flex gap-4 mt-2 text-[10px] font-mono text-slate">
                      <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />Hora: <strong>{selectedSignal.time}</strong></span>
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-void/50 border border-graphite/20 font-bold" style={{ color: selectedSignal.googleEventId ? 'var(--color-signal-lime)' : 'var(--color-signal-cyan)' }}>
                        <CheckCircle2 className="w-3 h-3 block" />
                        {selectedSignal.googleEventId ? 'Google Calendar' : 'Local Workspace'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex md:flex-col justify-end gap-2 text-right">
                  <button 
                    onClick={() => setIsEditingSelected(true)}
                    className="px-3 py-1.5 bg-void hover:bg-carbon border border-signal-lime/30 text-signal-lime hover:border-signal-lime/60 text-[9.5px] font-mono font-bold uppercase rounded flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    title="Editar detalles de la sesión"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-signal-lime" /> Editar Reunión
                  </button>
                  <button 
                    onClick={() => onLogMessage('ok', `Abriendo sala virtual de videoconferencia para: ${selectedSignal.title}`)}
                    className="px-3 py-1.5 bg-signal-cyan hover:bg-signal-cyan/80 text-void text-[9.5px] font-mono font-bold uppercase rounded flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    title="Google Meet Virtual Link"
                  >
                    <Link className="w-3 h-3" /> Unirse a Meet
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Timer Reset */}
        <div className="z-10 flex justify-center">
          <button 
            onClick={() => {
              setSecondsLeft(1 * 3600 + 42 * 60 + 6);
              setIsTimerRunning(true);
              onLogMessage('info', 'Reloj reseteado a valores iniciales de sesión.');
            }}
            className="p-1.5 text-ash/80 hover:text-signal-cyan transition-colors"
            title="Resetear Reloj"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Sidebar: QUEUED ITEMS CONNECTED TO CALENDAR */}
      {!hideRightPanel && (
        <aside 
          className="w-full xl:max-w-full flex flex-col gap-6 flex-shrink-0 animate-fade-in"
          style={{ width: `${config?.sidebarWidth ?? 384}px` }}
        >
          
          {/* Panel Header — dynamic title per view */}
          <div className="flex items-center justify-between px-1 border-b border-graphite/40 pb-2">
            <div className="font-mono text-xs text-bone uppercase tracking-widest flex items-center gap-2.5 font-bold">
              {sidebarView === 'meeting' && <><CalendarIcon className="w-4 h-4 text-signal-cyan" /> Agenda</>}
              {sidebarView === 'tasks' && <><List className="w-4 h-4 text-signal-lime" /> Tareas</>}
              {sidebarView === 'calendar' && <><CalendarDays className="w-4 h-4 text-signal-cyan" /> Calendario</>}
            </div>
            <button
              onClick={() => setSidebarView(v => {
                if (v === 'meeting') return 'tasks';
                if (v === 'tasks') return 'calendar';
                return 'meeting';
              })}
              className="flex items-center gap-1.5 font-mono text-[9px] text-signal-lime bg-signal-lime/5 border border-signal-lime/25 p-0.5 px-2 rounded uppercase cursor-pointer hover:bg-signal-lime/10 transition-colors"
              title="Clic para cambiar vista"
            >
              {sidebarView === 'meeting' && <><Video className="w-3 h-3" /><span>MEETING</span></>}
              {sidebarView === 'tasks' && <><List className="w-3 h-3" /><span>TAREAS</span></>}
              {sidebarView === 'calendar' && <><CalendarIcon className="w-3 h-3" /><span>CALENDAR</span></>}
            </button>
          </div>

          {/* GOOGLE WORKSPACE CONNECTION PROFILE INTEGRATION */}
          {googleToken ? (
            <div className="bg-signal-lime/5 border border-signal-lime/25 p-3 rounded-lg flex items-center justify-between font-mono text-[9.5px]">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-signal-lime" />
                <div className="leading-tight">
                  <span className="text-ash/80 block text-[8px] uppercase">Workspace Conectado:</span>
                  <span className="text-bone uppercase truncate max-w-[160px] inline-block font-bold">
                    {user?.displayName || user?.email || 'Alineado'}
                  </span>
                </div>
              </div>
              <button 
                onClick={async () => {
                  try {
                    await logout();
                  } catch (e) {}
                  setGoogleToken(null);
                  setUser(null);
                  onLogMessage('info', 'Sesión de Google Calendar desconectada.');
                }}
                className="text-signal-amber hover:underline uppercase text-[8px] font-bold"
                title="Desvincular Cuenta"
              >
                Salir
              </button>
            </div>
          ) : (
            <div className="bg-void/40 border border-graphite/40 p-3 rounded-lg flex flex-col gap-2 font-mono text-[9px] select-none text-ash/80 leading-tight">
              <p className="uppercase text-[8.5px]">
                Enlaza tus reuniones reales para activar sincronización bidireccional y Google Meet:
              </p>
              <button
                type="button"
                onClick={async () => {
                  try {
                    onLogMessage('info', 'Iniciando conexión segura de Google Workspace...');
                    const token = await googleSignIn();
                    if (token) {
                      setGoogleToken(token.accessToken);
                      onLogMessage('ok', '✓ Autenticado con Google con éxito.');
                    }
                  } catch (e: any) {
                    onLogMessage('err', `Fallo de autenticación: ${e.message || e}`);
                  }
                }}
                className="w-full py-1.5 bg-signal-amber text-void font-bold uppercase tracking-wider rounded text-[9px] flex items-center justify-center gap-1 hover:bg-signal-amber/90 transition-colors cursor-pointer"
              >
                <LogIn className="w-3 h-3" /> Conectar Google Calendar
              </button>
            </div>
          )}

          {/* Quick action: Register New Meeting to the Sync Queue */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex-1 flex items-center justify-center gap-2 border border-dashed border-graphite hover:border-ash/50 bg-carbon/30 hover:bg-carbon/30 py-2 rounded-lg text-xs font-mono text-ash hover:text-bone transition-all duration-200"
            >
              {showAddForm ? <X className="w-3.5 h-3.5 text-signal-amber" /> : <Plus className="w-3.5 h-3.5 text-signal-cyan" />}
              {showAddForm ? 'Cerrar Registro' : 'Agendar Nueva Reunión Calendario'}
            </button>
          </div>

          {/* Calendar Queue Area */}
          <div className="flex-1 relative min-h-[300px]">
            <AnimatePresence mode="wait">
              {showAddForm ? (
                <motion.form
                  onSubmit={handleAddSignal}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="bg-carbon/40 border border-graphite/45 rounded-xl p-4 flex flex-col gap-3 font-body text-xs absolute inset-0 overflow-y-auto custom-scrollbar"
                >
                  <span className="font-mono text-[8.5px] text-ash/70 uppercase tracking-wider border-b border-graphite/30 pb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-signal-lime" />
                    Agendar Reunión
                  </span>

                  {/* Quick Templates — 1 click to fill */}
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-[8px] uppercase text-ash/60">Plantillas Rápidas</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[
                        { title: 'Daily Standup', time: '09:00', icon: 'group', desc: 'Sincronización diaria del equipo' },
                        { title: '1:1 Reunión', time: '10:00', icon: 'phone', desc: 'Reunión individual' },
                        { title: 'Sprint Review', time: '14:00', icon: 'video', desc: 'Revisión de sprint' },
                        { title: 'Vendor Sync', time: '15:00', icon: 'video', desc: 'Sincronización con proveedor' },
                        { title: 'Design Review', time: '11:00', icon: 'video', desc: 'Revisión de diseño' },
                        { title: 'Wrap-up', time: '17:00', icon: 'group', desc: 'Cierre del día' },
                      ].map((tpl) => (
                        <button
                          key={tpl.title}
                          type="button"
                          onClick={() => {
                            setNewTitle(tpl.title);
                            setNewTime(tpl.time);
                            setNewIcon(tpl.icon);
                            setNewDesc(tpl.desc);
                            setNewId(`MTG-${tpl.title.replace(/\s+/g, '').toUpperCase().slice(0, 8)}`);
                          }}
                          className="text-left px-2 py-1.5 bg-void/60 border border-graphite/40 rounded text-[9px] font-mono text-bone/80 hover:border-signal-cyan/50 hover:text-signal-cyan transition-colors cursor-pointer"
                        >
                          <span className="block font-bold">{tpl.title}</span>
                          <span className="text-[8px] text-ash/60">{tpl.time}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Time — native picker */}
                  <div className="flex flex-col gap-1">
                    <label className="font-mono text-[9px] uppercase text-ash/80">Hora</label>
                    <input 
                      type="time"
                      value={newTime} 
                      onChange={(e) => setNewTime(e.target.value)}
                      className="bg-carbon border border-graphite focus:border-signal-cyan outline-none rounded p-2 font-mono text-bone text-sm"
                      required
                    />
                  </div>

                  {/* Title */}
                  <div className="flex flex-col gap-1">
                    <label className="font-mono text-[9px] uppercase text-ash/80">Título</label>
                    <input 
                      type="text" 
                      value={newTitle} 
                      onChange={(e) => {
                        setNewTitle(e.target.value);
                        if (!newId || newId.startsWith('MTG-')) {
                          setNewId(`MTG-${e.target.value.replace(/\s+/g, '-').toUpperCase().slice(0, 10) || Date.now().toString(36).toUpperCase()}`);
                        }
                      }}
                      placeholder="Nombre de la reunión" 
                      className="bg-carbon border border-graphite focus:border-signal-cyan outline-none rounded p-2 text-bone text-xs"
                      required
                    />
                  </div>

                  {/* Format — selector */}
                  <div className="flex flex-col gap-1">
                    <label className="font-mono text-[9px] uppercase text-ash/80">Formato</label>
                    <div className="flex gap-1.5">
                      {[
                        { value: 'video', label: 'Meet', icon: '📹' },
                        { value: 'phone', label: 'Llamada', icon: '📞' },
                        { value: 'group', label: 'Grupo', icon: '👥' },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setNewIcon(opt.value)}
                          className={`flex-1 py-2 rounded text-[9px] font-mono border transition-colors cursor-pointer ${
                            newIcon === opt.value
                              ? 'bg-signal-cyan/15 border-signal-cyan/50 text-signal-cyan'
                              : 'bg-void/40 border-graphite/40 text-ash/80 hover:border-graphite'
                          }`}
                        >
                          {opt.icon} {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notes — optional */}
                  <div className="flex flex-col gap-1">
                    <label className="font-mono text-[9px] uppercase text-ash/80">Notas <span className="text-ash/40">(opcional)</span></label>
                    <textarea 
                      value={newDesc} 
                      onChange={(e) => setNewDesc(e.target.value)}
                      placeholder="Temario o notas breves..." 
                      className="bg-carbon border border-graphite focus:border-signal-cyan outline-none rounded p-2 text-bone text-xs h-12 resize-none"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="mt-1 w-full py-2.5 bg-signal-cyan hover:bg-signal-cyan/95 text-void font-bold font-mono uppercase tracking-wider rounded text-[10px] cursor-pointer transition-colors"
                  >
                    Agendar Reunión
                  </button>
                </motion.form>
              ) : sidebarView === 'calendar' ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-carbon/40 border border-graphite/45 rounded-xl p-4 flex flex-col gap-3 font-body text-xs absolute inset-0 overflow-y-auto custom-scrollbar"
                >
                  {/* Calendar View — only today's events */}
                  <div className="flex items-center justify-between border-b border-graphite/30 pb-2">
                    <span className="font-mono text-[9px] text-bone uppercase tracking-widest flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-signal-cyan" />
                      Hoy
                    </span>
                    <span className="font-mono text-[9px] text-bone/80">
                      {new Date().toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </span>
                  </div>

                  {/* Timeline: only active signals sorted by time */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {(() => {
                      const now = new Date();
                      const currentMinutes = now.getHours() * 60 + now.getMinutes();
                      const todaySignals = signals
                        .filter(s => s.active)
                        .map(s => {
                          const [h, m] = s.time.split(':').map(Number);
                          return { ...s, _minutes: h * 60 + m };
                        })
                        .sort((a, b) => a._minutes - b._minutes);

                      if (todaySignals.length === 0) {
                        return (
                          <div className="text-center py-8 text-bone/60 font-mono text-[9px] border border-dashed border-graphite/40 rounded-lg">
                            SIN EVENTOS HOY
                          </div>
                        );
                      }

                      return todaySignals.map((sig) => {
                        const isPast = sig._minutes < currentMinutes;
                        const isNow = Math.abs(sig._minutes - currentMinutes) < 30;
                        return (
                          <div key={sig.id} className={`flex items-center gap-2 py-2 border-b border-graphite/20 ${isPast ? 'opacity-40' : ''}`}>
                            <span className={`font-mono text-[10px] w-12 ${isNow ? 'text-signal-cyan font-bold' : 'text-bone/80'}`}>{sig.time}</span>
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isNow ? 'bg-signal-cyan animate-pulse' : isPast ? 'bg-graphite' : 'bg-signal-lime/60'}`} />
                            <span className={`font-mono text-[10px] flex-1 truncate ${isPast ? 'line-through text-bone/50' : 'text-bone'}`}>{sig.title}</span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </motion.div>
              ) : sidebarView === 'tasks' ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-carbon/40 border border-graphite/45 rounded-xl p-4 flex flex-col gap-3 font-body text-xs absolute inset-0 overflow-y-auto custom-scrollbar"
                >
                  <div className="flex items-center justify-between border-b border-graphite/30 pb-2">
                    <span className="font-mono text-[9px] text-bone uppercase tracking-widest flex items-center gap-2">
                      <List className="w-4 h-4 text-signal-lime" />
                      Tareas del Día
                    </span>
                    <span className="font-mono text-[9px] text-bone/80">{signals.length} items</span>
                  </div>

                  {/* Add new task */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const title = (e.target as HTMLFormElement).querySelector('input')?.value.trim();
                      const time = (e.target as HTMLFormElement).querySelectorAll('input')[1]?.value.trim();
                      if (!title || !time) return;
                      const newSig: SignalEvent = {
                        id: `TASK-${Date.now()}`,
                        time,
                        title,
                        description: '',
                        category: 'task',
                        iconType: 'group',
                        active: false,
                      };
                      setSignals(prev => [...prev, newSig]);
                      onLogMessage('ok', `Tarea "${title}" agregada`);
                      (e.target as HTMLFormElement).reset();
                    }}
                    className="flex gap-2"
                  >
                    <input
                      name="title"
                      placeholder="Nueva tarea..."
                      className="flex-1 bg-carbon border border-graphite focus:border-signal-lime outline-none rounded px-2 py-1.5 text-bone font-mono text-[10px]"
                    />
                    <input
                      name="time"
                      placeholder="HH:MM"
                      className="w-16 bg-carbon border border-graphite focus:border-signal-lime outline-none rounded px-2 py-1.5 text-bone font-mono text-[10px]"
                    />
                    <button type="submit" className="px-2 py-1.5 bg-signal-lime/20 border border-signal-lime/40 text-signal-lime rounded font-mono text-[9px] hover:bg-signal-lime/30 cursor-pointer transition-colors">
                      +
                    </button>
                  </form>

                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {signals.length === 0 ? (
                      <div className="text-center py-8 text-bone/60 font-mono text-[9px] border border-dashed border-graphite/40 rounded-lg">
                        SIN TAREAS REGISTRADAS
                      </div>
                    ) : (
                      signals.map((sig) => (
                        <div key={sig.id} className="flex items-center gap-2 py-2 border-b border-graphite/20 group">
                            <button
                              onClick={() => {
                                const updated = signals.map(s => s.id === sig.id ? { ...s, active: !s.active } : s);
                                setSignals(updated);
                                onLogMessage('info', `Tarea "${sig.title}" ${sig.active ? 'marcada pendiente' : 'completada'}`);
                              }}
                              className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer ${
                                sig.active ? 'bg-signal-lime/20 border-signal-lime/40 text-signal-lime' : 'border-graphite/60'
                              }`}
                            >
                              {sig.active && <Check className="w-2.5 h-2.5" />}
                            </button>

                            {editingTaskId === sig.id ? (
                              <form
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  const f = e.target as HTMLFormElement;
                                  const newTitle = (f.elements.namedItem('editTitle') as HTMLInputElement)?.value.trim();
                                  const newTime = (f.elements.namedItem('editTime') as HTMLInputElement)?.value.trim();
                                  if (!newTitle || !newTime) return;
                                  setSignals(prev => prev.map(s => s.id === sig.id ? { ...s, title: newTitle, time: newTime } : s));
                                  setEditingTaskId(null);
                                  onLogMessage('ok', `Tarea actualizada`);
                                }}
                                className="flex-1 flex gap-1"
                              >
                                <input name="editTitle" defaultValue={sig.title} className="flex-1 bg-carbon border border-graphite focus:border-signal-lime outline-none rounded px-1.5 py-0.5 text-bone font-mono text-[10px]" />
                                <input name="editTime" defaultValue={sig.time} className="w-14 bg-carbon border border-graphite focus:border-signal-lime outline-none rounded px-1.5 py-0.5 text-bone font-mono text-[10px]" />
                                <button type="submit" className="px-1.5 py-0.5 text-signal-lime text-[8px] cursor-pointer font-mono">OK</button>
                              </form>
                            ) : (
                              <>
                                <div className="flex-1 min-w-0">
                                  <span className={`font-mono text-[10px] text-bone block truncate ${sig.active ? 'line-through opacity-50' : ''}`}>{sig.title}</span>
                                  <span className="font-mono text-[9px] text-bone/80">{sig.time}</span>
                                </div>
                                <span className={`font-mono text-[8px] uppercase px-1.5 py-0.5 rounded flex-shrink-0 ${
                                  sig.active ? 'bg-signal-lime/10 text-signal-lime' : 'bg-graphite/30 text-bone'
                                }`}>
                                  {sig.active ? 'Hecho' : 'Pendiente'}
                                </span>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => setEditingTaskId(sig.id)} className="p-1 text-bone/80 hover:text-bone cursor-pointer" title="Editar">
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSignals(prev => prev.filter(s => s.id !== sig.id));
                                      onLogMessage('info', `Tarea "${sig.title}" eliminada`);
                                    }}
                                    className="p-1 text-bone/80 hover:text-signal-amber cursor-pointer"
                                    title="Eliminar"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                      ))
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col gap-3.5 overflow-y-auto absolute inset-0 pr-1.5 custom-scrollbar"
                >
                  {signals.length === 0 ? (
                    <div className="text-center py-12 text-ash/40 font-mono text-xs border border-dashed border-graphite rounded-lg">
                      COLA DE EVENTOS VACÍA
                    </div>
                  ) : (
                    signals.map((sig, sigIndex) => {
                      const isSelected = selectedSignal?.id === sig.id;
                      const isActive = sig.active;
                      const isDragging = dragIndex === sigIndex;
                      const isDragOver = dragOverIndex === sigIndex;
                      
                      return (
                        <div 
                          key={sig.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, sigIndex)}
                          onDragOver={(e) => handleDragOver(e, sigIndex)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, sigIndex)}
                          onDragEnd={handleDragEnd}
                          onClick={() => {
                            setSelectedSignal(sig);
                            onLogMessage('info', `Inspeccionando evento calendar sync: "${sig.title}"`);
                          }}
                          className={`border rounded-xl p-3.5 transition-all duration-300 cursor-pointer flex flex-col gap-2 relative group overflow-hidden ${
                            isDragging ? 'opacity-40 scale-95' : ''
                          } ${
                            isDragOver ? 'border-signal-cyan/80 bg-signal-cyan/5 shadow-[0_0_12px_rgba(0,200,255,0.15)]' : ''
                          } ${
                            isSelected && !isDragOver
                              ? `${getAccentBorderClass()} bg-carbon/50 glow-cyan/5` 
                              : !isDragOver ? 'border-graphite/35 bg-carbon/25 hover:border-graphite/85 hover:bg-carbon/40' : ''
                          }`}
                        >
                          {/* Drag handle + reorder controls */}
                          <div className="absolute left-1 top-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleMoveUp(sigIndex); }}
                              disabled={sigIndex === 0}
                              className="p-0.5 text-ash/60 hover:text-bone disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                              title="Subir"
                            >
                              <ChevronUp className="w-3 h-3" />
                            </button>
                            <GripVertical className="w-2.5 h-2.5 text-ash/30 cursor-grab active:cursor-grabbing" />
                            <button
                              onClick={(e) => { e.stopPropagation(); handleMoveDown(sigIndex); }}
                              disabled={sigIndex === signals.length - 1}
                              className="p-0.5 text-ash/60 hover:text-bone disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                              title="Bajar"
                            >
                              <ChevronDown className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Sync ribbon indicator */}
                          {isActive && (
                            <div className={`absolute top-0 right-0 w-12 h-1 ${getAccentSolidBg()}`} />
                          )}

                          <div className="flex justify-between items-center pl-3">
                            <div className="flex items-center gap-2">
                              <span className={`font-mono text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wide ${
                                isActive 
                                  ? 'bg-signal-cyan/10 text-signal-cyan border border-signal-cyan/20' 
                                  : 'bg-graphite/40 text-ash border border-transparent'
                              }`}>
                                {sig.time}
                              </span>
                              {isActive && (
                                <span className="text-[9px] font-mono text-signal-lime animate-pulse font-semibold uppercase flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 bg-signal-lime rounded-full animate-ping" />
                                  [CONECTADO]
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-1.5">
                              {renderSignalIcon(sig.iconType, isSelected ? 'text-bone' : 'text-ash')}
                              
                              {/* Toggle Sync */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleSignalActive(sig.id);
                                }}
                                className={`p-1 rounded border transition-all ${
                                  isActive 
                                    ? 'bg-signal-lime/10 border-signal-lime/40 text-signal-lime hover:bg-signal-lime/20' 
                                    : 'bg-carbon/60 border-graphite/60 text-ash/80 hover:text-bone hover:border-slate/100'
                                }`}
                                title={isActive ? "Pausar Sincronización Google" : "Vincular a Google Calendar"}
                              >
                                <Check className="w-3 h-3" />
                              </button>

                              {/* Edit Meeting */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedSignal(sig);
                                  setIsEditingSelected(true);
                                  onLogMessage('info', `Editando detalles de: "${sig.title}"`);
                                }}
                                className="p-1 rounded border bg-signal-lime/5 border-signal-lime/25 text-signal-lime hover:bg-signal-lime/20 hover:border-signal-lime/60 transition-all"
                                title="Editar Detalles"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>

                              {/* Purge */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveSignal(sig.id);
                                }}
                                className="p-1 rounded border bg-signal-amber/5 border-signal-amber/25 text-signal-amber hover:bg-signal-amber/20 hover:border-signal-amber/60 transition-all"
                                title="Purgar Reunión"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          <div className="font-body text-xs font-semibold text-bone tracking-wide mt-1 pl-3">
                            {sig.title}
                          </div>

                          <div className="flex justify-between items-center text-[8.5px] font-mono text-ash/60 uppercase pl-3">
                            <span>REG-ID: {sig.id}</span>
                            <span className="text-signal-cyan">Google Calendar Sync ✓</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </aside>
      )}
    </div>
  );
}
