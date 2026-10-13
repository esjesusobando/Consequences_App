import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { TabsState, TabSession, TabItem } from '../../types';
import {
  parseUrls,
  deduplicateUrls,
  parseBookmarks,
  exportToJson,
  exportToBookmarksHtml,
  downloadFile,
  createSession,
  createTabItem,
  isValidUrl,
} from './tabsUtils';
import { TabsCapture } from './TabsCapture';
import { TabsToolbar } from './TabsToolbar';
import { TabsListView } from './TabsListView';
import { TabsDashboardView } from './TabsDashboardView';
import { TabsPopover } from './TabsPopover';

const STORAGE_KEY = 'consequences-tabs';
const DEBOUNCE_MS = 300;

interface ConsequenceTabsProps {
  onLogMessage: (type: 'info' | 'ok' | 'warn' | 'err', text: string) => void;
}

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface Toast {
  message: string;
  type: 'ok' | 'warn' | 'err';
  key: number;
  actions?: ToastAction[];
}

function loadFromStorage(): { state: TabsState; corrupted: boolean } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as TabsState;
      if (
        parsed &&
        typeof parsed === 'object' &&
        Array.isArray(parsed.sessions) &&
        Array.isArray(parsed.bin)
      ) {
        return { state: parsed, corrupted: false };
      }
    }
  } catch {
    // Corrupted JSON — will be flagged
  }
  return {
    state: { sessions: [], bin: [], activeView: 'list' },
    corrupted: true,
  };
}

function persistToStorage(state: TabsState): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

// Debounced persist helper
function useDebouncedPersist(
  state: TabsState,
  delay: number,
  onQuotaExceeded?: () => void,
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestStateRef = useRef(state);
  latestStateRef.current = state;

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      const ok = persistToStorage(state);
      if (!ok && onQuotaExceeded) onQuotaExceeded();
    }, delay);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        const ok = persistToStorage(latestStateRef.current);
        if (!ok && onQuotaExceeded) onQuotaExceeded();
      }
    };
  }, [state, delay, onQuotaExceeded]);
}

export function ConsequenceTabs({
  onLogMessage,
}: ConsequenceTabsProps) {
  const [storageInit] = useState(loadFromStorage);
  const [state, setState] = useState<TabsState>(storageInit.state);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [collapsedSessions, setCollapsedSessions] = useState<Set<string>>(
    new Set(),
  );
  const [popoverTarget, setPopoverTarget] = useState<{
    itemId: string;
    sessionId: string;
    rect: DOMRect;
  } | null>(null);
  const toastKeyRef = useRef(0);
  const popoverRafRef = useRef<number>(0);
  const [pendingRestoreUrls, setPendingRestoreUrls] = useState<{
    sessionName: string;
    urls: { url: string; title: string }[];
  } | null>(null);

  const showToastRef = useRef<(message: string, type?: Toast['type']) => void>(
    () => {},
  );

  // Cleanup rAF on unmount
  useEffect(() => {
    return () => {
      if (popoverRafRef.current) {
        cancelAnimationFrame(popoverRafRef.current);
      }
    };
  }, []);

  // Debounced localStorage persistence
  const handleQuotaExceeded = useCallback(() => {
    showToastRef.current('Storage quota exceeded — changes not saved', 'warn');
  }, []);

  useDebouncedPersist(state, DEBOUNCE_MS, handleQuotaExceeded);

  // Show corrupt localStorage warning on mount
  useEffect(() => {
    if (storageInit.corrupted) {
      showToastRef.current(
        'Previous data was corrupted — starting fresh',
        'warn',
      );
    }
  }, [storageInit.corrupted]);

  // Toast auto-dismiss
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = useCallback(
    (message: string, type: Toast['type'] = 'ok', actions?: ToastAction[]) => {
      toastKeyRef.current += 1;
      setToast({ message, type, key: toastKeyRef.current, actions });
      onLogMessage(type, message);
    },
    [onLogMessage],
  );

  // Keep showToastRef current so effects can use it before showToast is stable
  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);

  // ── Derived State ────────────────────────────────────────────

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const session of state.sessions) {
      for (const item of session.items) {
        for (const tag of item.tags) {
          tagSet.add(tag);
        }
      }
    }
    return [...tagSet].sort();
  }, [state.sessions]);

  const totalItems = useMemo(
    () => state.sessions.reduce((sum, s) => sum + s.items.length, 0),
    [state.sessions],
  );

  // ── URL Parse Handler ────────────────────────────────────────

  const handleParseUrls = useCallback(
    (raw: string) => {
      const urls = parseUrls(raw);
      if (urls.length === 0) {
        showToast('No valid URLs found', 'warn');
        return;
      }

      // Dedup against ALL existing items across all sessions
      const existingUrls = new Set<string>();
      for (const session of state.sessions) {
        for (const item of session.items) {
          existingUrls.add(item.url);
        }
      }

      const crossSessionDupes = urls.filter((u) => existingUrls.has(u));
      const { unique: inputUnique } = deduplicateUrls(urls);
      const newUnique = inputUnique.filter((u) => !existingUrls.has(u));

      const handleAddAll = () => {
        const items = inputUnique.map((url) => createTabItem(url));
        setState((prev) => {
          let sessions = [...prev.sessions];
          if (sessions.length > 0) {
            const firstSession = { ...sessions[0] };
            firstSession.items = [...firstSession.items, ...items];
            sessions[0] = firstSession;
          } else {
            const newSession = createSession('Imported');
            newSession.items = items;
            sessions = [newSession];
          }
          return { ...prev, sessions };
        });
        showToast(`${items.length} URL(s) added (including duplicates)`, 'ok');
      };

      const handleSkipDupes = () => {
        if (newUnique.length === 0) {
          showToast('All URLs already exist', 'warn');
          return;
        }
        const items = newUnique.map((url) => createTabItem(url));
        setState((prev) => {
          let sessions = [...prev.sessions];
          if (sessions.length > 0) {
            const firstSession = { ...sessions[0] };
            firstSession.items = [...firstSession.items, ...items];
            sessions[0] = firstSession;
          } else {
            const newSession = createSession('Imported');
            newSession.items = items;
            sessions = [newSession];
          }
          return { ...prev, sessions };
        });
        showToast(
          `${newUnique.length} new URL(s) added, ${crossSessionDupes.length} skipped`,
          'ok',
        );
      };

      if (crossSessionDupes.length > 0) {
        showToast(
          `${crossSessionDupes.length} duplicate(s) found — ${newUnique.length} new URL(s)`,
          'warn',
          [
            { label: 'Skip duplicates', onClick: handleSkipDupes },
            { label: 'Add all', onClick: handleAddAll },
          ],
        );
      } else {
        // No cross-session duplicates — just add them
        const items = inputUnique.map((url) => createTabItem(url));
        setState((prev) => {
          let sessions = [...prev.sessions];
          if (sessions.length > 0) {
            const firstSession = { ...sessions[0] };
            firstSession.items = [...firstSession.items, ...items];
            sessions[0] = firstSession;
          } else {
            const newSession = createSession('Imported');
            newSession.items = items;
            sessions = [newSession];
          }
          return { ...prev, sessions };
        });
        showToast(`${items.length} URL(s) added`, 'ok');
      }
    },
    [state.sessions, showToast],
  );

  // ── Bookmark Import Handler ──────────────────────────────────

  const handleImportBookmarks = useCallback(
    (html: string) => {
      const importedSessions = parseBookmarks(html);
      if (importedSessions.length === 0) {
        showToast('No bookmarks found in file', 'warn');
        return;
      }

      const totalImported = importedSessions.reduce(
        (sum, s) => sum + s.items.length,
        0,
      );

      setState((prev) => ({
        ...prev,
        sessions: [...prev.sessions, ...importedSessions],
      }));

      showToast(
        `Imported ${importedSessions.length} session(s) with ${totalImported} URL(s)`,
        'ok',
      );
    },
    [showToast],
  );

  // ── Export Handlers ──────────────────────────────────────────

  const handleExportJSON = useCallback(() => {
    const json = exportToJson(state);
    downloadFile(json, 'consequences-tabs.json', 'application/json');
    showToast('JSON exported', 'ok');
  }, [state, showToast]);

  const handleExportHTML = useCallback(() => {
    const html = exportToBookmarksHtml(state.sessions);
    downloadFile(html, 'bookmarks.html', 'text/html');
    showToast('HTML bookmarks exported', 'ok');
  }, [state.sessions, showToast]);

  // ── AI Grouping (v0.1 stub) ────────────────────────────────

  const handleAiGroup = useCallback(() => {
    showToast('AI auto-grouping coming in v2', 'warn');
  }, [showToast]);

  // ── Import Button (reuses bookmark file picker) ─────────────

  const handleImportClick = useCallback(() => {
    // Trigger the hidden file input in TabsCapture via a custom event
    // We'll use a simpler approach: create a temporary file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.html,.htm,.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result;
        if (typeof content === 'string') {
          if (file.name.endsWith('.json')) {
            // JSON import
            try {
              const parsed = JSON.parse(content) as TabsState;
              if (
                parsed &&
                typeof parsed === 'object' &&
                Array.isArray(parsed.sessions) &&
                Array.isArray(parsed.bin)
              ) {
                // Sanitize: reject non-http(s) URLs to prevent XSS via javascript: links
                const sanitizedSessions = parsed.sessions.map((session: TabSession) => ({
                  ...session,
                  items: session.items.filter((item: TabItem) => isValidUrl(item.url)),
                }));
                const sanitizedBin = parsed.bin.map((session: TabSession) => ({
                  ...session,
                  items: session.items.filter((item: TabItem) => isValidUrl(item.url)),
                }));
                setState({ ...parsed, sessions: sanitizedSessions, bin: sanitizedBin, activeView: parsed.activeView === 'dashboard' ? 'dashboard' : 'list' });
                showToast('JSON state imported', 'ok');
              } else {
                showToast('Invalid JSON format', 'err');
              }
            } catch {
              showToast('Failed to parse JSON', 'err');
            }
          } else {
            handleImportBookmarks(content);
          }
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [handleImportBookmarks, showToast]);

  // ── Session Handlers ─────────────────────────────────────────

  const handleToggleCollapse = useCallback((sessionId: string) => {
    setCollapsedSessions((prev) => {
      const next = new Set(prev);
      if (next.has(sessionId)) {
        next.delete(sessionId);
      } else {
        next.add(sessionId);
      }
      return next;
    });
  }, []);

  const handleRenameSession = useCallback((sessionId: string, name: string) => {
    setState((prev) => ({
      ...prev,
      sessions: prev.sessions.map((s) =>
        s.id === sessionId ? { ...s, name } : s,
      ),
    }));
  }, []);

  const handleToggleStarSession = useCallback((sessionId: string) => {
    setState((prev) => ({
      ...prev,
      sessions: prev.sessions.map((s) =>
        s.id === sessionId ? { ...s, starred: !s.starred } : s,
      ),
    }));
  }, []);

  const handleToggleLockSession = useCallback((sessionId: string) => {
    setState((prev) => ({
      ...prev,
      sessions: prev.sessions.map((s) =>
        s.id === sessionId ? { ...s, locked: !s.locked } : s,
      ),
    }));
  }, []);

  const handleDeleteSession = useCallback((sessionId: string) => {
    setState((prev) => ({
      ...prev,
      sessions: prev.sessions.filter((s) => s.id !== sessionId),
    }));
  }, []);

  const handleRestoreAll = useCallback((sessionId: string) => {
    const session = state.sessions.find((s) => s.id === sessionId);
    if (!session || session.items.length === 0) return;
    setPendingRestoreUrls({
      sessionName: session.name,
      urls: session.items.map((i) => ({ url: i.url, title: i.title || i.url })),
    });
  }, [state.sessions]);

  // ── Item Handlers ────────────────────────────────────────────

  const handleUpdateItem = useCallback(
    (
      sessionId: string,
      itemId: string,
      patch: Partial<TabItem>,
    ) => {
      setState((prev) => ({
        ...prev,
        sessions: prev.sessions.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                items: s.items.map((item) =>
                  item.id === itemId ? { ...item, ...patch } : item,
                ),
              }
            : s,
        ),
      }));
    },
    [],
  );

  const handleDeleteItem = useCallback((sessionId: string, itemId: string) => {
    setState((prev) => ({
      ...prev,
      sessions: prev.sessions.map((s) =>
        s.id === sessionId
          ? { ...s, items: s.items.filter((item) => item.id !== itemId) }
          : s,
      ),
    }));
  }, []);

  const handleToggleStarItem = useCallback(
    (sessionId: string, itemId: string) => {
      setState((prev) => ({
        ...prev,
        sessions: prev.sessions.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                items: s.items.map((item) =>
                  item.id === itemId
                    ? { ...item, starred: !item.starred }
                    : item,
                ),
              }
            : s,
        ),
      }));
    },
    [],
  );

  const handleToggleLockItem = useCallback(
    (sessionId: string, itemId: string) => {
      setState((prev) => ({
        ...prev,
        sessions: prev.sessions.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                items: s.items.map((item) =>
                  item.id === itemId
                    ? { ...item, locked: !item.locked }
                    : item,
                ),
              }
            : s,
        ),
      }));
    },
    [],
  );

  const handleRemoveTag = useCallback(
    (sessionId: string, itemId: string, tag: string) => {
      setState((prev) => ({
        ...prev,
        sessions: prev.sessions.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                items: s.items.map((item) =>
                  item.id === itemId
                    ? { ...item, tags: item.tags.filter((t) => t !== tag) }
                    : item,
                ),
              }
            : s,
        ),
      }));
    },
    [],
  );

  const handleShowPopover = useCallback(
    (itemId: string, sessionId: string, rect: DOMRect) => {
      // Cancel any pending rAF from a previous call
      if (popoverRafRef.current) {
        cancelAnimationFrame(popoverRafRef.current);
      }
      // Close any existing popover first, then open new one
      setPopoverTarget(null);
      // Use requestAnimationFrame to ensure close happens before open
      popoverRafRef.current = requestAnimationFrame(() => {
        setPopoverTarget({ itemId, sessionId, rect });
      });
    },
    [],
  );

  const handleClosePopover = useCallback(() => {
    setPopoverTarget(null);
  }, []);

  // Get the active popover item
  const popoverItem = useMemo(() => {
    if (!popoverTarget) return null;
    const session = state.sessions.find((s) => s.id === popoverTarget.sessionId);
    if (!session) return null;
    return session.items.find((item) => item.id === popoverTarget.itemId) || null;
  }, [popoverTarget, state.sessions]);

  const handlePopoverUpdateNote = useCallback(
    (note: string) => {
      if (!popoverTarget) return;
      handleUpdateItem(popoverTarget.sessionId, popoverTarget.itemId, { note });
    },
    [popoverTarget, handleUpdateItem],
  );

  const handlePopoverUpdateTags = useCallback(
    (tags: string[]) => {
      if (!popoverTarget) return;
      handleUpdateItem(popoverTarget.sessionId, popoverTarget.itemId, { tags });
    },
    [popoverTarget, handleUpdateItem],
  );

  // Restore modal Escape key handler
  useEffect(() => {
    if (!pendingRestoreUrls) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPendingRestoreUrls(null);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [pendingRestoreUrls]);

  // ── Render ───────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toast */}
      {toast && (
        <div
          key={toast.key}
          role="status"
          aria-live="polite"
          className={`fixed top-4 right-4 z-[300] px-4 py-2 rounded-xl border shadow-xl text-[11px] font-mono animate-fade-in max-w-[400px] ${
            toast.type === 'ok'
              ? 'bg-signal-lime/10 border-signal-lime/30 text-signal-lime'
              : toast.type === 'warn'
                ? 'bg-signal-amber/10 border-signal-amber/30 text-signal-amber'
                : 'bg-signal-magenta/10 border-signal-magenta/30 text-signal-magenta'
          }`}
        >
          <div>{toast.message}</div>
          {toast.actions && toast.actions.length > 0 && (
            <div className="flex items-center gap-2 mt-1.5">
              {toast.actions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => {
                    action.onClick();
                    setToast(null);
                  }}
                  className={`px-2 py-0.5 rounded text-[9px] font-mono font-semibold transition-colors cursor-pointer ${
                    toast.type === 'ok'
                      ? 'bg-signal-lime/20 hover:bg-signal-lime/30 text-signal-lime'
                      : toast.type === 'warn'
                        ? 'bg-signal-amber/20 hover:bg-signal-amber/30 text-signal-amber'
                        : 'bg-signal-magenta/20 hover:bg-signal-magenta/30 text-signal-magenta'
                  }`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Capture area */}
      <div className="shrink-0 border-b border-graphite/20 pb-3 mb-3">
        <TabsCapture
          onParseUrls={handleParseUrls}
          onImportBookmarks={handleImportBookmarks}
        />
      </div>

      {/* Toolbar */}
      <div className="shrink-0 border-b border-graphite/20 pb-3 mb-3">
        <TabsToolbar
          activeView={state.activeView}
          onViewChange={(view) =>
            setState((prev) => ({ ...prev, activeView: view }))
          }
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          allTags={allTags}
          activeTagFilter={activeTagFilter}
          onTagFilterChange={setActiveTagFilter}
          onExportJSON={handleExportJSON}
          onExportHTML={handleExportHTML}
          onImportClick={handleImportClick}
          onAiGroup={handleAiGroup}
          sessionCount={state.sessions.length}
          itemCount={totalItems}
        />
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-y-auto">
        {state.activeView === 'list' ? (
          <TabsListView
            sessions={state.sessions}
            searchQuery={searchQuery}
            activeTagFilter={activeTagFilter}
            collapsedSessions={collapsedSessions}
            onToggleCollapse={handleToggleCollapse}
            onRenameSession={handleRenameSession}
            onToggleStarSession={handleToggleStarSession}
            onToggleLockSession={handleToggleLockSession}
            onDeleteSession={handleDeleteSession}
            onRestoreAll={handleRestoreAll}
            onUpdateItem={handleUpdateItem}
            onDeleteItem={handleDeleteItem}
            onToggleStarItem={handleToggleStarItem}
            onToggleLockItem={handleToggleLockItem}
            onRemoveTag={handleRemoveTag}
            onShowPopover={handleShowPopover}
          />
        ) : (
          <TabsDashboardView
            sessions={state.sessions}
            searchQuery={searchQuery}
            activeTagFilter={activeTagFilter}
            onToggleStarItem={handleToggleStarItem}
            onToggleLockItem={handleToggleLockItem}
            onDeleteItem={handleDeleteItem}
            onShowPopover={handleShowPopover}
          />
        )}
      </div>

      {/* Popover (Portal) */}
      {popoverTarget && popoverItem && (
        <TabsPopover
          item={popoverItem}
          rect={popoverTarget.rect}
          onClose={handleClosePopover}
          onUpdateNote={handlePopoverUpdateNote}
          onUpdateTags={handlePopoverUpdateTags}
        />
      )}

      {/* Restore All — clickable link list (avoids popup blocker) */}
      {pendingRestoreUrls && (
        <div
          className="fixed inset-0 z-[400] flex items-center justify-center"
          style={{ background: 'rgba(5,7,11,0.85)' }}
          onClick={() => setPendingRestoreUrls(null)}
        >
          <div
            role="dialog"
            aria-label={`Restore URLs from ${pendingRestoreUrls.sessionName}`}
            className="bg-carbon border border-graphite/40 rounded-xl shadow-2xl p-4 max-w-md w-full max-h-[60vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[11px] font-mono font-semibold text-bone">
                Restore {pendingRestoreUrls.urls.length} URL(s) from &quot;{pendingRestoreUrls.sessionName}&quot;
              </h3>
              <button
                onClick={() => setPendingRestoreUrls(null)}
                className="p-1 text-ash/40 hover:text-bone transition-colors cursor-pointer"
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            <p className="text-[9px] font-mono text-ash/40 mb-2">
              Click each link, or Cmd/Ctrl+click to open multiple at once.
            </p>
            <div className="space-y-0.5">
              {pendingRestoreUrls.urls.map(({ url, title }, index) => (
                <a
                  key={`${url}-${index}`}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-2 py-1 text-[10px] font-mono text-signal-cyan/70 hover:text-signal-cyan hover:bg-carbon/40 rounded truncate transition-colors"
                >
                  {title}
                </a>
              ))}
            </div>
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => setPendingRestoreUrls(null)}
                aria-label="Close restore dialog"
                className="px-3 py-1.5 text-[10px] font-mono text-ash/60 hover:text-bone border border-graphite/20 rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
