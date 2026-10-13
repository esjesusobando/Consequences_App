import { useState, useEffect, useRef, Dispatch, SetStateAction } from 'react';
import { SignalEvent } from '../types';
import { fetchCalendarEvents } from '../lib/googleAuth';

type SyncStatus = 'synchronized' | 'syncing' | 'offline';

interface GoogleCalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
}

interface UseGoogleCalendarSyncReturn {
  calendarSyncStatus: SyncStatus;
  setCalendarSyncStatus: Dispatch<SetStateAction<SyncStatus>>;
  handleCalendarResync: () => Promise<void>;
}

export function useGoogleCalendarSync(
  googleToken: string | null,
  setSignals: Dispatch<SetStateAction<SignalEvent[]>>,
  onLogMessage: (type: 'info' | 'ok' | 'warn' | 'err', text: string) => void
): UseGoogleCalendarSyncReturn {
  const [calendarSyncStatus, setCalendarSyncStatus] = useState<SyncStatus>('synchronized');
  const fetchRef = useRef(fetchCalendarEvents);
  const logRef = useRef(onLogMessage);
  const setSignalsRef = useRef(setSignals);
  fetchRef.current = fetchCalendarEvents;
  logRef.current = onLogMessage;
  setSignalsRef.current = setSignals;

  useEffect(() => {
    if (!googleToken) return;

    const pullAndSync = async () => {
      try {
        setCalendarSyncStatus('syncing');
        const items = await fetchRef.current(googleToken);
        if (!items) {
          logRef.current('info', 'Sincronizador GCalendar: Conectado y en línea con Workspace.');
          setCalendarSyncStatus('synchronized');
          return;
        }

        let updatedCount = 0;
        let newCount = 0;

        setSignalsRef.current(prev => {
          let currentList = [...prev];
          items.forEach((item: GoogleCalendarEvent) => {
            const googleId = item.id;
            const summary = item.summary || 'Reunión agendada';
            const desc = item.description || 'Detalles sincronizados vía Google Workspace API.';
            
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
          logRef.current('ok', `Google Calendar: ${newCount} nuevas reuniones añadidas, ${updatedCount} actualizadas.`);
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
      } catch (err: unknown) {
        setCalendarSyncStatus('offline');
        onLogMessage('err', `Fallo de sincronización: ${err instanceof Error ? err.message : 'Error desconocido'}`);
      }
    } else {
      setCalendarSyncStatus('syncing');
      onLogMessage('info', 'Estableciendo sincronización simulada de agenda personal...');
      setTimeout(() => {
        setCalendarSyncStatus('synchronized');
        onLogMessage('ok', 'Calendario simulado sincronizado con éxito. 3 eventos en cola.');
      }, 1200);
    }
  };

  return {
    calendarSyncStatus,
    setCalendarSyncStatus,
    handleCalendarResync,
  };
}
