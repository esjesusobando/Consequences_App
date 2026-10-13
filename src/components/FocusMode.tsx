import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  X,
  Coffee,
  Brain,
  ChevronRight,
  SkipForward,
  Sun,
  Moon,
} from 'lucide-react';
import { FocusSession, BacklogTask, AccentColor } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface FocusModeProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: BacklogTask[];
  accent: AccentColor;
  onLogMessage: (type: 'info' | 'ok' | 'warn' | 'err', text: string) => void;
}

export default function FocusMode({
  isOpen,
  onClose,
  tasks,
  accent,
  onLogMessage,
}: FocusModeProps) {
  const [session, setSession] = useState<FocusSession | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [pomodoroMinutes, setPomodoroMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [totalCycles, setTotalCycles] = useState(4);
  const [notes, setNotes] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true);

  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [currentCycle, setCurrentCycle] = useState(1);

  const notesRef = useRef<HTMLTextAreaElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Start focus session
  const startSession = () => {
    const task = tasks.find(t => t.id === selectedTaskId);
    
    const newSession: FocusSession = {
      id: `FOCUS-${Date.now().toString(36).toUpperCase()}`,
      taskId: selectedTaskId || undefined,
      taskTitle: task?.title,
      startTime: new Date().toISOString(),
      pomodoroMinutes,
      breakMinutes,
      currentCycle: 1,
      totalCycles,
      notes: '',
      status: 'active',
    };

    setSession(newSession);
    setTimeLeft(pomodoroMinutes * 60);
    setIsRunning(true);
    setCurrentCycle(1);
    setIsBreak(false);
    setNotes('');

    onLogMessage('ok', `Focus session started: ${pomodoroMinutes}min pomodoro`);
  };

  // Timer tick
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      // Timer finished
      if (!isBreak) {
        // Work session done, start break
        setIsBreak(true);
        setTimeLeft(breakMinutes * 60);
        onLogMessage('info', `Pomodoro complete! Take a ${breakMinutes}min break.`);
      } else {
        // Break done, next cycle or finish
        if (currentCycle < totalCycles) {
          setCurrentCycle(prev => prev + 1);
          setIsBreak(false);
          setTimeLeft(pomodoroMinutes * 60);
          onLogMessage('ok', `Cycle ${currentCycle + 1}/${totalCycles} started`);
        } else {
          // All cycles done
          setIsRunning(false);
          if (session) {
            setSession({ ...session, status: 'completed', endTime: new Date().toISOString() });
          }
          onLogMessage('ok', `Focus session completed! ${totalCycles} pomodoros done.`);
        }
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timeLeft, isBreak, currentCycle, totalCycles, pomodoroMinutes, breakMinutes]);

  // Pause/resume
  const togglePause = () => {
    setIsRunning(!isRunning);
    onLogMessage('info', isRunning ? 'Timer paused' : 'Timer resumed');
  };

  // Reset
  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(pomodoroMinutes * 60);
    setIsBreak(false);
    setCurrentCycle(1);
  };

  // Skip to next
  const skipToNext = () => {
    if (!isBreak) {
      setIsBreak(true);
      setTimeLeft(breakMinutes * 60);
    } else {
      if (currentCycle < totalCycles) {
        setCurrentCycle(prev => prev + 1);
        setIsBreak(false);
        setTimeLeft(pomodoroMinutes * 60);
      }
    }
  };

  // Close session
  const closeSession = () => {
    if (session) {
      setSession({ ...session, status: 'cancelled', endTime: new Date().toISOString(), notes });
    }
    onClose();
    setSession(null);
    setIsRunning(false);
    setTimeLeft(0);
  };

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Progress percentage
  const totalTime = isBreak ? breakMinutes * 60 : pomodoroMinutes * 60;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-[100] flex flex-col overflow-hidden ${isDarkMode ? 'bg-night' : 'bg-[#FAFAF8]'}`}
    >
      {/* Top bar */}
      <div className={`flex items-center justify-between px-8 py-4 border-b ${isDarkMode ? 'border-graphite' : 'border-gray-200'}`}>
        <div className="flex items-center gap-4">
          <button
            onClick={closeSession}
            className={`p-2 rounded-lg transition-all ${isDarkMode ? 'text-ash hover:text-bone hover:bg-carbon' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
          >
            <X className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2 rounded-lg transition-all ${isDarkMode ? 'text-ash hover:text-bone hover:bg-carbon' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <div className={`text-sm font-mono ${isDarkMode ? 'text-ash' : 'text-gray-500'}`}>
            {session ? (
              <>
                {session.taskTitle && <span className={`font-semibold ${isDarkMode ? 'text-bone' : 'text-gray-700'}`}>{session.taskTitle}</span>}
                {session.taskTitle && <span className="mx-2">·</span>}
                <span>Cycle {currentCycle}/{totalCycles}</span>
              </>
            ) : (
              'Focus Mode'
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isBreak ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-signal-amber/10 text-signal-amber rounded-lg">
              <Coffee className="w-4 h-4" />
              <span className="text-sm font-semibold">Break</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-signal-cyan/10 text-signal-cyan rounded-lg">
              <Brain className="w-4 h-4" />
              <span className="text-sm font-semibold">Focus</span>
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Timer */}
        <div className={`w-96 flex flex-col items-center justify-center border-r ${isDarkMode ? 'border-graphite bg-void' : 'border-gray-200 bg-white'}`}>
          {!session ? (
            // Setup screen
            <div className="w-full max-w-sm px-8">
              <h2 className={`text-2xl font-bold font-display mb-6 ${isDarkMode ? 'text-bone' : 'text-gray-800'}`}>Start Focus Session</h2>

              <div className="space-y-4">
                <div>
                  <label className={`text-xs font-mono uppercase mb-2 block ${isDarkMode ? 'text-ash' : 'text-gray-500'}`}>Task (optional)</label>
                  <select
                    value={selectedTaskId}
                    onChange={(e) => setSelectedTaskId(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg focus:outline-none focus:border-signal-cyan ${isDarkMode ? 'bg-carbon border border-graphite text-bone' : 'bg-gray-50 border border-gray-200 text-gray-800'}`}
                  >
                    <option value="">No specific task</option>
                    {tasks.filter(t => t.status === 'backlog' || t.status === 'scheduled').map(task => (
                      <option key={task.id} value={task.id}>{task.title}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={`text-xs font-mono uppercase mb-2 block ${isDarkMode ? 'text-ash' : 'text-gray-500'}`}>Focus (min)</label>
                    <input
                      type="number"
                      value={pomodoroMinutes}
                      onChange={(e) => setPomodoroMinutes(Number(e.target.value))}
                      className={`w-full px-3 py-2 rounded-lg focus:outline-none focus:border-signal-cyan ${isDarkMode ? 'bg-carbon border border-graphite text-bone' : 'bg-gray-50 border border-gray-200 text-gray-800'}`}
                      min={5}
                      step={5}
                    />
                  </div>
                  <div>
                    <label className={`text-xs font-mono uppercase mb-2 block ${isDarkMode ? 'text-ash' : 'text-gray-500'}`}>Break (min)</label>
                    <input
                      type="number"
                      value={breakMinutes}
                      onChange={(e) => setBreakMinutes(Number(e.target.value))}
                      className={`w-full px-3 py-2 rounded-lg focus:outline-none focus:border-signal-cyan ${isDarkMode ? 'bg-carbon border border-graphite text-bone' : 'bg-gray-50 border border-gray-200 text-gray-800'}`}
                      min={1}
                      step={1}
                    />
                  </div>
                  <div>
                    <label className={`text-xs font-mono uppercase mb-2 block ${isDarkMode ? 'text-ash' : 'text-gray-500'}`}>Cycles</label>
                    <input
                      type="number"
                      value={totalCycles}
                      onChange={(e) => setTotalCycles(Number(e.target.value))}
                      className={`w-full px-3 py-2 rounded-lg focus:outline-none focus:border-signal-cyan ${isDarkMode ? 'bg-carbon border border-graphite text-bone' : 'bg-gray-50 border border-gray-200 text-gray-800'}`}
                      min={1}
                      max={12}
                    />
                  </div>
                </div>

                <button
                  onClick={startSession}
                  className={`w-full px-4 py-3 font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${isDarkMode ? 'bg-signal-cyan hover:bg-signal-cyan/80 text-void' : 'bg-signal-cyan/80 hover:bg-signal-cyan text-void'}`}
                >
                  <Play className="w-5 h-5" />
                  Start Focus
                </button>
              </div>
            </div>
          ) : (
            // Active timer
            <div className="flex flex-col items-center">
              {/* Circular progress */}
              <div className="relative w-64 h-64 mb-8">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="128"
                    cy="128"
                    r="120"
                    stroke={isDarkMode ? '#2A3148' : '#F0F0F0'}
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="128"
                    cy="128"
                    r="120"
                    stroke={isBreak ? '#f59e0b' : '#00F0FF'}
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 120}`}
                    strokeDashoffset={`${2 * Math.PI * 120 * (1 - progress / 100)}`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className={`text-6xl font-mono font-bold ${isDarkMode ? 'text-bone' : 'text-[#1A1A1A]'}`}>
                    {formatTime(timeLeft)}
                  </div>
                  <div className={`text-sm mt-2 ${isDarkMode ? 'text-ash' : 'text-gray-500'}`}>
                    {isBreak ? 'Break Time' : 'Focus Time'}
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePause}
                  className={`p-3 rounded-lg transition-all ${isDarkMode ? 'bg-carbon hover:bg-graphite text-bone' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                >
                  {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
                <button
                  onClick={resetTimer}
                  className={`p-3 rounded-lg transition-all ${isDarkMode ? 'bg-carbon hover:bg-graphite text-bone' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
                <button
                  onClick={skipToNext}
                  className={`p-3 rounded-lg transition-all ${isDarkMode ? 'bg-carbon hover:bg-graphite text-bone' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                >
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>

              {/* Cycle indicators */}
              <div className="flex items-center gap-2 mt-6">
                {Array.from({ length: totalCycles }).map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-2 h-2 rounded-full ${
                      idx < currentCycle
                        ? 'bg-signal-cyan'
                        : idx === currentCycle - 1 && !isBreak
                        ? (isDarkMode ? 'bg-signal-cyan/60 animate-pulse' : 'bg-signal-cyan/40 animate-pulse')
                        : (isDarkMode ? 'bg-graphite' : 'bg-gray-300')
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Notes canvas */}
        <div className={`flex-1 flex flex-col ${isDarkMode ? 'bg-void' : 'bg-white'}`}>
          <div className={`px-8 py-4 border-b ${isDarkMode ? 'border-graphite' : 'border-gray-200'}`}>
            <h3 className={`text-sm font-semibold font-display ${isDarkMode ? 'text-bone' : 'text-gray-700'}`}>Notes & Thoughts</h3>
          </div>
          <textarea
            ref={notesRef}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Start writing... Let your thoughts flow freely."
            className={`flex-1 px-12 py-8 text-lg leading-relaxed resize-none focus:outline-none ${
              isDarkMode
                ? 'bg-transparent text-gray-200 placeholder-gray-500'
                : 'bg-white text-gray-800 border border-gray-200 focus:border-signal-cyan placeholder-gray-300'
            }`}
            style={{ caretColor: '#00F0FF' }}
          />
        </div>
      </div>
    </motion.div>
  );
}
