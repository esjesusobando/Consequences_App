import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Clock,
  Calendar,
  Play,
  Pause,
  CheckCircle2,
  Trash2,
  Edit2,
  Save,
  X,
  TrendingUp,
  Target,
  Zap,
  Sparkles,
  ListTodo,
  CalendarDays,
  Timer,
  Brain,
  Eye,
  EyeOff,
} from 'lucide-react';
import { BacklogTask, AccentColor, TimeLog } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface TaskBacklogProps {
  tasks: BacklogTask[];
  setTasks: React.Dispatch<React.SetStateAction<BacklogTask[]>>;
  accent: AccentColor;
  onLogMessage: (type: 'info' | 'ok' | 'warn' | 'err', text: string) => void;
  onStartFocus?: () => void;
}

export default function TaskBacklog({
  tasks,
  setTasks,
  accent,
  onLogMessage,
  onStartFocus,
}: TaskBacklogProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newEstimatedMinutes, setNewEstimatedMinutes] = useState(30);
  const [newScheduledDate, setNewScheduledDate] = useState('');
  const [newScheduledTime, setNewScheduledTime] = useState('');
  const [newPriority, setNewPriority] = useState<'high' | 'medium' | 'low'>('medium');

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [editEstimatedMinutes, setEditEstimatedMinutes] = useState(30);
  const [editScheduledDate, setEditScheduledDate] = useState('');
  const [editScheduledTime, setEditScheduledTime] = useState('');

  const [activeTimer, setActiveTimer] = useState<{ taskId: string; startTime: Date } | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef(0);

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [localNotes, setLocalNotes] = useState('');

  // Filter tasks
  const backlogTasks = tasks.filter(t => t.status === 'backlog');
  const scheduledTasks = tasks.filter(t => t.status === 'scheduled');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const doneTasks = tasks.filter(t => t.status === 'done');

  // Stats
  const totalEstimatedMinutes = tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);
  const totalActualMinutes = tasks.reduce((sum, t) => sum + (t.actualMinutes || 0), 0);
  const completedTasks = doneTasks.length;
  const accuracyRate = totalActualMinutes > 0 
    ? Math.round((totalEstimatedMinutes / totalActualMinutes) * 100)
    : 0;

  // Add task
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const task: BacklogTask = {
      id: `TASK-${Date.now().toString(36).toUpperCase()}`,
      title: newTitle,
      description: newDescription,
      estimatedMinutes: newEstimatedMinutes,
      scheduledDate: newScheduledDate || undefined,
      scheduledTime: newScheduledTime || undefined,
      source: 'manual',
      userNotes: '',
      status: newScheduledDate ? 'scheduled' : 'backlog',
      priority: newPriority,
      tags: [],
      createdAt: new Date().toISOString(),
    };

    setTasks(prev => [...prev, task]);
    onLogMessage('ok', `Tarea creada: "${task.title}" (${task.estimatedMinutes}min)`);

    // Reset form
    setNewTitle('');
    setNewDescription('');
    setNewEstimatedMinutes(30);
    setNewScheduledDate('');
    setNewScheduledTime('');
    setNewPriority('medium');
    setShowAddForm(false);
  };

  // Start timer
  const startTimer = (taskId: string) => {
    setActiveTimer({ taskId, startTime: new Date() });
    setElapsedSeconds(0);
    elapsedRef.current = 0;
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, status: 'in_progress' as const } : t
    ));
    onLogMessage('info', `Timer iniciado para tarea`);

    // Update elapsed time every second
    timerIntervalRef.current = setInterval(() => {
      elapsedRef.current += 1;
      setElapsedSeconds(elapsedRef.current);
    }, 1000);
  };

  // Stop timer
  const stopTimer = () => {
    if (!activeTimer) return;

    const actualMinutes = Math.round(elapsedSeconds / 60);
    
    setTasks(prev => prev.map(t => 
      t.id === activeTimer.taskId 
        ? { ...t, status: 'done' as const, actualMinutes, completedAt: new Date().toISOString() }
        : t
    ));

    onLogMessage('ok', `Tarea completada en ${actualMinutes}min`);
    setActiveTimer(null);
    setElapsedSeconds(0);
    elapsedRef.current = 0;

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  // Delete task
  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    onLogMessage('warn', `Tarea eliminada`);
  };

  // Schedule task
  const scheduleTask = (taskId: string, date: string, time: string) => {
    setTasks(prev => prev.map(t => 
      t.id === taskId 
        ? { ...t, scheduledDate: date, scheduledTime: time, status: 'scheduled' as const }
        : t
    ));
    onLogMessage('info', `Tarea programada para ${date} ${time}`);
  };

  // Get accent classes
  const getAccentClass = () => {
    switch (accent) {
      case 'magenta': return 'text-signal-magenta';
      case 'lime': return 'text-signal-lime';
      case 'amber': return 'text-signal-amber';
      default: return 'text-signal-cyan';
    }
  };

  const getAccentBgClass = () => {
    switch (accent) {
      case 'magenta': return 'bg-signal-magenta/10';
      case 'lime': return 'bg-signal-lime/10';
      case 'amber': return 'bg-signal-amber/10';
      default: return 'bg-signal-cyan/10';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-signal-magenta bg-signal-magenta/10';
      case 'medium': return 'text-signal-amber bg-signal-amber/10';
      case 'low': return 'text-signal-lime bg-signal-lime/10';
      default: return 'text-ash bg-carbon/40';
    }
  };

  // Format timer
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Sync editor state when selected task changes
  useEffect(() => {
    const task = tasks.find(t => t.id === selectedTaskId);
    if (task) {
      setEditTitle(task.title);
      setEditDescription(task.description);
      setEditPriority(task.priority);
      setEditEstimatedMinutes(task.estimatedMinutes);
      setEditScheduledDate(task.scheduledDate || '');
      setEditScheduledTime(task.scheduledTime || '');
      setLocalNotes(task.userNotes || '');
    }
    setIsEditing(false);
  }, [selectedTaskId, tasks]);

  // Save task edits
  const handleSaveEdit = () => {
    if (!selectedTaskId) return;
    setTasks(prev => prev.map(t =>
      t.id === selectedTaskId
        ? {
            ...t,
            title: editTitle,
            description: editDescription,
            priority: editPriority,
            estimatedMinutes: editEstimatedMinutes,
            scheduledDate: editScheduledDate || undefined,
            scheduledTime: editScheduledTime || undefined,
          }
        : t
    ));
    onLogMessage('info', `Tarea actualizada: "${editTitle}"`);
  };

  return (
    <div className="flex h-full bg-void overflow-hidden">
      {/* Column 1: Tasks (w-72) */}
      <div className="w-72 bg-carbon/20 border-r border-graphite/40 flex flex-col shrink-0">
        <div className="p-4 border-b border-graphite/30">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold font-display text-bone flex items-center gap-2">
              <ListTodo className="w-5 h-5" />
              Tasks
            </h2>
            <div className="flex items-center gap-2">
              {onStartFocus && (
                <button
                  onClick={onStartFocus}
                  className="px-3 py-1.5 bg-signal-cyan/10 text-signal-cyan hover:bg-signal-cyan/20 rounded-lg transition-all text-xs font-mono uppercase tracking-widest"
                  title="Start Focus Mode"
                >
                  Focus
                </button>
              )}
              <button
                onClick={() => setShowAddForm(true)}
                className={`p-2 rounded-lg ${getAccentBgClass()} ${getAccentClass()} hover:opacity-80 transition-all`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Minimal count */}
          <div className="flex items-center gap-3 text-xs text-ash/60 font-mono">
            <span>{tasks.length} tareas</span>
            <span className="text-signal-lime">{completedTasks} hechas</span>
          </div>
        </div>

        {/* Task list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {backlogTasks.length === 0 ? (
            <div className="text-center py-12 text-ash/40">
              <ListTodo className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No hay tareas</p>
            </div>
          ) : (
            backlogTasks.map(task => (
              <div
                key={task.id}
                onClick={() => setSelectedTaskId(task.id)}
                className={`px-3 py-2 rounded-lg transition-all cursor-pointer ${
                  selectedTaskId === task.id
                    ? 'bg-signal-cyan/10 border border-signal-cyan/60'
                    : 'bg-carbon/30 border border-graphite/40 hover:border-graphite/60'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded shrink-0 ${getPriorityColor(task.priority)}`}>
                      {task.priority.toUpperCase()}
                    </span>
                    <h3 className="text-sm font-semibold font-body text-bone truncate">{task.title}</h3>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] font-mono text-ash/60">{task.estimatedMinutes}min</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                      className="p-1 text-ash/60 hover:text-signal-magenta hover:bg-signal-magenta/10 rounded transition-all"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Column 2: Active Timer + Scheduled + Detail Editor (flex-1) */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Active timer */}
        {activeTimer && (
          <div className="p-6 bg-signal-lime/5 border-b border-signal-lime/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-mono text-signal-lime uppercase mb-1">Timer Activo</div>
                <div className="text-lg font-bold text-bone">
                  {tasks.find(t => t.id === activeTimer.taskId)?.title}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-3xl font-mono font-bold text-signal-lime">
                  {formatTimer(elapsedSeconds)}
                </div>
                <button
                  onClick={stopTimer}
                  className="p-3 bg-signal-magenta hover:bg-signal-magenta/80 text-white rounded-lg transition-all"
                >
                  <Pause className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Scheduled tasks */}
          {scheduledTasks.length > 0 && (
            <>
              <h3 className="text-lg font-bold font-display text-bone mb-4 flex items-center gap-2">
                <CalendarDays className="w-5 h-5" />
                Programadas
              </h3>
              <div className="space-y-3 mb-8">
                {scheduledTasks.map(task => (
                  <div
                    key={task.id}
                    className="p-4 bg-carbon/30 border border-graphite/40 rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-bone">{task.title}</h4>
                        <div className="flex items-center gap-3 mt-2 text-xs text-ash/60">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {task.scheduledDate}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {task.scheduledTime}
                          </span>
                          <span>{task.estimatedMinutes}min</span>
                        </div>
                      </div>
                      <button
                        onClick={() => startTimer(task.id)}
                        className="p-2 text-signal-lime hover:bg-signal-lime/10 rounded-lg transition-all"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Task Detail Panel */}
          {selectedTaskId ? (
            <div className="flex flex-col h-full">
              {(() => {
                const task = tasks.find(t => t.id === selectedTaskId);
                if (!task) return <p className="text-ash/60 p-6">Tarea no encontrada</p>;
                return (
                  <div className="flex flex-col h-full">
                    {/* ─── Consolidated Info Card ─── */}
                    <div className="bg-carbon/20 border border-graphite/40 rounded-xl m-6 mb-3 p-5">
                      {!isEditing ? (
                        /* ── READ MODE ── */
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${getPriorityColor(task.priority)}`}>
                                {task.priority.toUpperCase()}
                              </span>
                              {task.source === 'email' && (
                                <span className="text-[9px] font-mono text-signal-cyan bg-signal-cyan/10 px-1.5 py-0.5 rounded">EMAIL</span>
                              )}
                            </div>
                          </div>

                          <h3 className="text-xl font-bold font-display text-bone">{task.title}</h3>

                          <div className="flex items-center gap-4 text-xs font-mono text-ash/70">
                            <span className="flex items-center gap-1">⏱ {task.estimatedMinutes}min</span>
                            {task.scheduledDate && <span className="flex items-center gap-1">📅 {task.scheduledDate}</span>}
                            {task.scheduledTime && <span className="flex items-center gap-1">🕐 {task.scheduledTime}</span>}
                            <span className="font-mono uppercase">• {task.source === 'email' ? 'Email' : task.source === 'calendar' ? 'Calendar' : 'Manual'}</span>
                            {task.aiEstimatedMinutes && <span>• AI: {task.aiEstimatedMinutes}min</span>}
                          </div>

                          {task.description && (
                            <p className="text-sm text-ash/80 leading-relaxed">{task.description}</p>
                          )}

                          {task.aiNotes && (
                            <div className="p-3 bg-signal-cyan/5 border border-signal-cyan/20 rounded-lg">
                              <div className="text-[9px] font-mono text-signal-cyan uppercase mb-1">AI Notes</div>
                              <p className="text-sm text-ash/80">{task.aiNotes}</p>
                            </div>
                          )}

                          {/* CRUD Buttons */}
                          <div className="flex items-center gap-2 pt-2">
                            <button
                              onClick={() => setIsEditing(true)}
                              className="px-4 py-2 bg-signal-cyan text-void font-semibold rounded-lg hover:bg-signal-cyan/90 transition-all text-xs flex items-center gap-1.5"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              Edit
                            </button>
                            <button
                              onClick={() => { deleteTask(task.id); setSelectedTaskId(null); }}
                              className="px-4 py-2 bg-signal-magenta/10 text-signal-magenta rounded-lg hover:bg-signal-magenta/20 transition-all text-xs flex items-center gap-1.5"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* ── EDIT MODE ── */
                        <div className="space-y-4">
                          <div>
                            <label className="text-[9px] font-mono text-ash uppercase mb-1 block">Title</label>
                            <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                              className="w-full px-3 py-2 bg-void border border-graphite/50 rounded-lg text-bone text-base font-semibold focus:outline-none focus:border-signal-cyan/60" />
                          </div>
                          <div>
                            <label className="text-[9px] font-mono text-ash uppercase mb-1 block">Description</label>
                            <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)}
                              className="w-full px-3 py-2 bg-void border border-graphite/50 rounded-lg text-bone focus:outline-none focus:border-signal-cyan/60 resize-none" rows={3}
                              placeholder="Sin descripción" />
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="text-[9px] font-mono text-ash uppercase mb-1 block">Priority</label>
                              <select value={editPriority} onChange={(e) => setEditPriority(e.target.value as 'high' | 'medium' | 'low')}
                                className="w-full px-3 py-2 bg-void border border-graphite/50 rounded-lg text-bone focus:outline-none focus:border-signal-cyan/60">
                                <option value="high">Alta</option>
                                <option value="medium">Media</option>
                                <option value="low">Baja</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-[9px] font-mono text-ash uppercase mb-1 block">Est. (min)</label>
                              <input type="number" value={editEstimatedMinutes} onChange={(e) => setEditEstimatedMinutes(Number(e.target.value))}
                                className="w-full px-3 py-2 bg-void border border-graphite/50 rounded-lg text-bone focus:outline-none focus:border-signal-cyan/60" min={1} step={5} />
                            </div>
                            <div>
                              <label className="text-[9px] font-mono text-ash uppercase mb-1 block">Date</label>
                              <input type="date" value={editScheduledDate} onChange={(e) => setEditScheduledDate(e.target.value)}
                                className="w-full px-3 py-2 bg-void border border-graphite/50 rounded-lg text-bone focus:outline-none focus:border-signal-cyan/60" />
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => { handleSaveEdit(); setIsEditing(false); }}
                              className="px-4 py-2 bg-signal-cyan text-void font-semibold rounded-lg hover:bg-signal-cyan/90 transition-all text-xs flex items-center gap-1.5">
                              <Save className="w-3.5 h-3.5" />
                              Save
                            </button>
                            <button onClick={() => setIsEditing(false)}
                              className="px-4 py-2 bg-carbon border border-graphite/50 text-ash rounded-lg hover:text-bone transition-all text-xs">
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ─── Notes Area ─── */}
                    <div className="flex-1 mx-6 mb-6 flex flex-col">
                      <label className="text-[9px] font-mono text-ash uppercase mb-2 flex items-center gap-1.5">
                        Notes
                      </label>
                      <textarea
                        value={localNotes}
                        onChange={(e) => setLocalNotes(e.target.value)}
                        onBlur={() => {
                          if (localNotes !== (task.userNotes || '')) {
                            setTasks(prev => prev.map(t =>
                              t.id === task.id ? { ...t, userNotes: localNotes } : t
                            ));
                          }
                        }}
                        placeholder="Write your notes about this task here..."
                        className="flex-1 w-full px-4 py-3 bg-void border border-graphite/40 rounded-lg text-bone text-sm focus:outline-none focus:border-signal-cyan/60 resize-none placeholder:text-ash/30"
                      />
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-ash/40">
              <div className="text-center">
                <Edit2 className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">Selecciona una tarea para ver sus detalles</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Column 3: Completed Tasks (w-80, collapsible) */}
      {showCompleted ? (
        <div className="w-80 bg-carbon/20 border-l border-graphite/40 flex flex-col shrink-0">
          <div className="p-4 border-b border-graphite/30 flex items-center justify-between">
            <h3 className="text-sm font-bold font-display text-bone flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-signal-lime" />
              Completadas
              <span className="text-xs font-mono text-ash/60 ml-1">({doneTasks.length})</span>
            </h3>
            <button
              onClick={() => setShowCompleted(false)}
              className="p-1.5 text-ash/60 hover:text-bone hover:bg-carbon/40 rounded transition-all"
              title="Ocultar completadas"
            >
              <EyeOff className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {doneTasks.length === 0 ? (
              <div className="text-center py-12 text-ash/40">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-xs">Ninguna tarea completada</p>
              </div>
            ) : (
              doneTasks.slice(0, 20).map(task => (
                <div
                  key={task.id}
                  className="p-3 bg-carbon/20 border border-graphite/30 rounded-lg opacity-60"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-bone line-through truncate">{task.title}</h4>
                      <div className="flex items-center gap-3 mt-1 text-xs text-ash/60">
                        <span>{task.estimatedMinutes}min</span>
                        <span className={task.actualMinutes !== undefined && task.actualMinutes > task.estimatedMinutes * 1.2 ? 'text-signal-magenta' : ''}>
                          Real: {task.actualMinutes ?? '—'}min
                        </span>
                      </div>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-signal-lime shrink-0 mt-0.5" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="w-8 bg-carbon/20 border-l border-graphite/40 flex flex-col items-center py-3 shrink-0">
          <button
            onClick={() => setShowCompleted(true)}
            className="p-1.5 text-ash/60 hover:text-bone hover:bg-carbon/40 rounded transition-all"
            title="Mostrar completadas"
          >
            <Eye className="w-4 h-4" />
          </button>
          <span className="text-[10px] font-mono text-ash/40 mt-1">{doneTasks.length}</span>
        </div>
      )}

      {/* Add task modal */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowAddForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-carbon border border-graphite/60 rounded-xl p-6 w-full max-w-md shadow-2xl"
            >
              <h3 className="text-lg font-bold font-display text-bone mb-4">Nueva Tarea</h3>
              <form onSubmit={handleAddTask} className="space-y-4">
                <div>
                  <label className="text-xs font-mono text-ash uppercase mb-1 block">Título</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-void border border-graphite/50 rounded-lg text-bone focus:outline-none focus:border-signal-cyan/60"
                    placeholder="¿Qué necesitas hacer?"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-ash uppercase mb-1 block">Descripción</label>
                  <textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-void border border-graphite/50 rounded-lg text-bone focus:outline-none focus:border-signal-cyan/60 resize-none"
                    rows={3}
                    placeholder="Detalles opcionales..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-mono text-ash uppercase mb-1 block">Tiempo (min)</label>
                    <input
                      type="number"
                      value={newEstimatedMinutes}
                      onChange={(e) => setNewEstimatedMinutes(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-void border border-graphite/50 rounded-lg text-bone focus:outline-none focus:border-signal-cyan/60"
                      min={5}
                      step={5}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-mono text-ash uppercase mb-1 block">Prioridad</label>
                    <select
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value as 'high' | 'medium' | 'low')}
                      className="w-full px-3 py-2 bg-void border border-graphite/50 rounded-lg text-bone focus:outline-none focus:border-signal-cyan/60"
                    >
                      <option value="high">Alta</option>
                      <option value="medium">Media</option>
                      <option value="low">Baja</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-mono text-ash uppercase mb-1 block">Fecha (opcional)</label>
                    <input
                      type="date"
                      value={newScheduledDate}
                      onChange={(e) => setNewScheduledDate(e.target.value)}
                      className="w-full px-3 py-2 bg-void border border-graphite/50 rounded-lg text-bone focus:outline-none focus:border-signal-cyan/60"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-mono text-ash uppercase mb-1 block">Hora (opcional)</label>
                    <input
                      type="time"
                      value={newScheduledTime}
                      onChange={(e) => setNewScheduledTime(e.target.value)}
                      className="w-full px-3 py-2 bg-void border border-graphite/50 rounded-lg text-bone focus:outline-none focus:border-signal-cyan/60"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-signal-cyan text-void font-semibold rounded-lg hover:bg-signal-cyan/90 transition-all"
                  >
                    Crear Tarea
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2.5 bg-carbon border border-graphite/50 text-ash rounded-lg hover:text-bone transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
