import React, { useMemo } from 'react';
import type { TabSession } from '../../types';
import { TabsItemCard } from './TabsItemCard';
import { extractDomain, matchesFilter } from './tabsUtils';

interface TabsDashboardViewProps {
  sessions: TabSession[];
  searchQuery: string;
  activeTagFilter: string | null;
  onToggleStarItem: (sessionId: string, itemId: string) => void;
  onToggleLockItem: (sessionId: string, itemId: string) => void;
  onDeleteItem: (sessionId: string, itemId: string) => void;
  onShowPopover: (itemId: string, sessionId: string, rect: DOMRect) => void;
}

export function TabsDashboardView({
  sessions,
  searchQuery,
  activeTagFilter,
  onToggleStarItem,
  onToggleLockItem,
  onDeleteItem,
  onShowPopover,
}: TabsDashboardViewProps) {
  // Sort: starred first, then by creation time (newest first)
  const sortedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => {
      if (a.starred && !b.starred) return -1;
      if (!a.starred && b.starred) return 1;
      return b.createdAt - a.createdAt;
    });
  }, [sessions]);

  // Filter sessions/items
  const filteredSessions = useMemo(() => {
    return sortedSessions
      .map((session) => {
        const filteredItems = session.items.filter((item) =>
          matchesFilter(item, searchQuery, activeTagFilter),
        );
        return { ...session, filteredItems };
      })
      .filter(
        (session) =>
          session.filteredItems.length > 0 ||
          (!searchQuery && !activeTagFilter),
      );
  }, [sortedSessions, searchQuery, activeTagFilter]);

  const hasAnySessions = sessions.length > 0;

  // Empty state
  if (!hasAnySessions) {
    return (
      <div className="flex-1 flex items-center justify-center py-16">
        <div className="text-center">
          <div className="text-[11px] font-mono text-ash/40 uppercase tracking-wider">
            No tabs to display
          </div>
          <div className="text-[10px] font-mono text-ash/25 mt-1">
            Paste URLs or import bookmarks to get started
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {filteredSessions.map((session) => (
        <div
          key={session.id}
          className="flex flex-col bg-carbon/20 border border-graphite/10 rounded-xl overflow-hidden"
        >
          {/* Session column header */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-graphite/10 shrink-0 sticky top-0 bg-carbon/60 backdrop-blur-sm z-10">
            {session.emoji && (
              <span className="text-sm">{session.emoji}</span>
            )}
            <span className="text-[10px] font-mono font-semibold text-bone truncate flex-1">
              {session.name}
            </span>
            <span className="px-1.5 py-0.5 bg-graphite/30 text-[8px] font-mono text-ash rounded-full">
              {session.filteredItems.length}
            </span>
          </div>

          {/* Items — scrollable */}
          <div className="flex-1 overflow-y-auto p-1.5 space-y-1 max-h-[400px]">
            {session.filteredItems.map((item) => (
              <TabsItemCard
                key={item.id}
                item={item}
                compact
                onToggleStar={() => onToggleStarItem(session.id, item.id)}
                onToggleLock={() => onToggleLockItem(session.id, item.id)}
                onDelete={() => onDeleteItem(session.id, item.id)}
                onShowPopover={(rect) =>
                  onShowPopover(item.id, session.id, rect)
                }
                onRemoveTag={() => {}}
              />
            ))}

            {/* Empty column */}
            {session.filteredItems.length === 0 && !searchQuery && !activeTagFilter && (
              <div className="py-4 text-center text-[9px] font-mono text-ash/30 italic">
                Empty session
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
