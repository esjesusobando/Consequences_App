import React, { useMemo } from 'react';
import type { TabSession, TabItem } from '../../types';
import { matchesFilter } from './tabsUtils';
import { TabsSessionHeader } from './TabsSessionHeader';
import { TabsItemCard } from './TabsItemCard';

interface TabsListViewProps {
  sessions: TabSession[];
  searchQuery: string;
  activeTagFilter: string | null;
  collapsedSessions: Set<string>;
  onToggleCollapse: (sessionId: string) => void;
  onRenameSession: (sessionId: string, name: string) => void;
  onToggleStarSession: (sessionId: string) => void;
  onToggleLockSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onRestoreAll: (sessionId: string) => void;
  onUpdateItem: (sessionId: string, itemId: string, patch: Partial<TabItem>) => void;
  onDeleteItem: (sessionId: string, itemId: string) => void;
  onToggleStarItem: (sessionId: string, itemId: string) => void;
  onToggleLockItem: (sessionId: string, itemId: string) => void;
  onRemoveTag: (sessionId: string, itemId: string, tag: string) => void;
  onShowPopover: (itemId: string, sessionId: string, rect: DOMRect) => void;
}

export function TabsListView({
  sessions,
  searchQuery,
  activeTagFilter,
  collapsedSessions,
  onToggleCollapse,
  onRenameSession,
  onToggleStarSession,
  onToggleLockSession,
  onDeleteSession,
  onRestoreAll,
  onUpdateItem,
  onDeleteItem,
  onToggleStarItem,
  onToggleLockItem,
  onRemoveTag,
  onShowPopover,
}: TabsListViewProps) {
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
          // Show session if it has matching items, or if there's no filter active
          session.filteredItems.length > 0 ||
          (!searchQuery && !activeTagFilter),
      );
  }, [sortedSessions, searchQuery, activeTagFilter]);

  const hasAnySessions = sessions.length > 0;
  const hasFilteredResults = filteredSessions.some((s) => s.filteredItems.length > 0);

  // Empty state
  if (!hasAnySessions) {
    return (
      <div className="flex-1 flex items-center justify-center py-16">
        <div className="text-center">
          <div className="text-[11px] font-mono text-ash/40 uppercase tracking-wider">
            No sessions yet
          </div>
          <div className="text-[10px] font-mono text-ash/25 mt-1">
            Paste URLs or import bookmarks to get started
          </div>
        </div>
      </div>
    );
  }

  // Empty search state
  if (searchQuery && !hasFilteredResults) {
    return (
      <div className="flex-1 flex items-center justify-center py-16">
        <div className="text-center">
          <div className="text-[11px] font-mono text-ash/40 uppercase tracking-wider">
            No tabs match your search
          </div>
          <div className="text-[10px] font-mono text-ash/25 mt-1">
            Try a different search term or clear filters
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 overflow-y-auto">
      {filteredSessions.map((session) => {
        const isCollapsed = collapsedSessions.has(session.id);
        return (
        <div key={session.id} className="space-y-1">
          <TabsSessionHeader
            session={session}
            isCollapsed={isCollapsed}
            onToggleCollapse={() => onToggleCollapse(session.id)}
            onRename={(name) => onRenameSession(session.id, name)}
            onToggleStar={() => onToggleStarSession(session.id)}
            onToggleLock={() => onToggleLockSession(session.id)}
            onDelete={() => onDeleteSession(session.id)}
            onRestoreAll={() => onRestoreAll(session.id)}
          />

          {/* Items - hidden when collapsed */}
          {!isCollapsed && session.filteredItems.length > 0 && (
            <div className="ml-6 space-y-1">
              {session.filteredItems.map((item) => (
                <TabsItemCard
                  key={item.id}
                  item={item}
                  onToggleStar={() => onToggleStarItem(session.id, item.id)}
                  onToggleLock={() => onToggleLockItem(session.id, item.id)}
                  onDelete={() => onDeleteItem(session.id, item.id)}
                  onShowPopover={(rect) =>
                    onShowPopover(item.id, session.id, rect)
                  }
                  onRemoveTag={(tag) => onRemoveTag(session.id, item.id, tag)}
                />
              ))}
            </div>
          )}

          {/* Empty session */}
          {!isCollapsed && session.filteredItems.length === 0 &&
            !searchQuery &&
            !activeTagFilter && (
              <div className="ml-6 py-2 text-[9px] font-mono text-ash/30 italic">
                Empty session
              </div>
            )}
        </div>
        );
      })}
    </div>
  );
}
