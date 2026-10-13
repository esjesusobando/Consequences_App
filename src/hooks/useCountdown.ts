import { useState, useEffect } from 'react';
import { SignalEvent } from '../types';

interface UseCountdownReturn {
  secondsLeft: number;
  isTimerRunning: boolean;
  nextMeetingTitle: string;
  hoursStr: string;
  minutesStr: string;
  secsStr: string;
  setTimerPreset: (minutes: number) => void;
  resetTimer: () => void;
}

/** Shared countdown recalculate logic — used by both useCountdown and DashboardView */
export function useCountdownRecalculate(signals: SignalEvent[], onLogMessage?: (type: 'info' | 'ok' | 'warn' | 'err', text: string) => void) {
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [nextMeetingTitle, setNextMeetingTitle] = useState<string>('');

  useEffect(() => {
    const recalculate = () => {
      const now = new Date();
      let nextSeconds: number | null = null;
      let nextTitle = '';

      for (const sig of signals) {
        if (!sig.active) continue;
        const [h, m] = sig.time.split(':').map(Number);
        if (isNaN(h) || isNaN(m)) continue;

        const meetingDate = new Date(now);
        meetingDate.setHours(h, m, 0, 0);
        // Wrap to tomorrow when the time already passed today (daily-recurring agenda)
        if (meetingDate.getTime() <= now.getTime()) {
          meetingDate.setDate(meetingDate.getDate() + 1);
        }

        const diff = Math.floor((meetingDate.getTime() - now.getTime()) / 1000);
        if (diff > 0 && (nextSeconds === null || diff < nextSeconds)) {
          nextSeconds = diff;
          nextTitle = sig.title;
        }
      }

      if (nextSeconds !== null) {
        setSecondsLeft(nextSeconds);
        setIsTimerRunning(true);
        setNextMeetingTitle(nextTitle);
      } else {
        setIsTimerRunning(false);
        setSecondsLeft(0);
        setNextMeetingTitle('');
      }
    };

    recalculate();
    const interval = setInterval(recalculate, 1000);
    return () => clearInterval(interval);
  }, [signals]);

  return { secondsLeft, isTimerRunning, nextMeetingTitle, setSecondsLeft, setIsTimerRunning };
}

export function useCountdown(signals: SignalEvent[], onLogMessage?: (type: 'info' | 'ok' | 'warn' | 'err', text: string) => void): UseCountdownReturn {
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [nextMeetingTitle, setNextMeetingTitle] = useState<string>('');

  useEffect(() => {
    const recalculate = () => {
      const now = new Date();
      let nextSeconds: number | null = null;
      let nextTitle = '';

      for (const sig of signals) {
        if (!sig.active) continue;
        const [h, m] = sig.time.split(':').map(Number);
        if (isNaN(h) || isNaN(m)) continue;

        const meetingDate = new Date(now);
        meetingDate.setHours(h, m, 0, 0);
        // Wrap to tomorrow when the time already passed today (daily-recurring agenda)
        if (meetingDate.getTime() <= now.getTime()) {
          meetingDate.setDate(meetingDate.getDate() + 1);
        }

        const diff = Math.floor((meetingDate.getTime() - now.getTime()) / 1000);
        if (diff > 0 && (nextSeconds === null || diff < nextSeconds)) {
          nextSeconds = diff;
          nextTitle = sig.title;
        }
      }

      if (nextSeconds !== null) {
        setSecondsLeft(nextSeconds);
        setIsTimerRunning(true);
        setNextMeetingTitle(nextTitle);
      } else {
        setIsTimerRunning(false);
        setSecondsLeft(0);
        setNextMeetingTitle('');
      }
    };

    recalculate();
    const interval = setInterval(recalculate, 1000);
    return () => clearInterval(interval);
  }, [signals]);

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

  const setTimerPreset = (minutes: number) => {
    setSecondsLeft(minutes * 60);
    setIsTimerRunning(true);
    onLogMessage?.('info', `Cuenta regresiva de reunión ajustada: T-menos ${minutes} minutos.`);
  };

  const resetTimer = () => {
    setSecondsLeft(1 * 3600 + 42 * 60 + 6);
    setIsTimerRunning(true);
    onLogMessage?.('info', 'Reloj reseteado a valores iniciales de sesión.');
  };

  return {
    secondsLeft,
    isTimerRunning,
    nextMeetingTitle,
    hoursStr,
    minutesStr,
    secsStr,
    setTimerPreset,
    resetTimer,
  };
}
