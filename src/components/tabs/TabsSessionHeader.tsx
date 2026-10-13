import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ChevronRight, Star, Lock, Trash2, RotateCcw, Pencil } from 'lucide-react';
import type { TabSession } from '../../types';

interface TabsSessionHeaderProps {
  session: TabSession;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onRename: (name: string) => void;
  onToggleStar: () => void;
  onToggleLock: () => void;
  onDelete: () => void;
  onRestoreAll: () => void;
}

export function TabsSessionHeader({
  session,
  isCollapsed,
  onToggleCollapse,
  onRename,
  onToggleStar,
  onToggleLock,
  onDelete,
  onRestoreAll,
}: TabsSessionHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(session.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleDoubleClick = useCallback(() => {
    setEditName(session.name);
    setIsEditing(true);
  }, [session.name]);

  const handleSave = useCallback(() => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== session.name) {
      onRename(trimmed);
    }
    setIsEditing(false);
  }, [editName, session.name, onRename]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSave();
      } else if (e.key === 'Escape') {
        setIsEditing(false);
        setEditName(session.name);
      }
    },
    [handleSave, session.name],
  );

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-carbon/40 border border-graphite/10 rounded-xl group">
      {/* Collapse toggle */}
      <button
        onClick={onToggleCollapse}
        className="p-1 text-ash/60 hover:text-bone transition-colors cursor-pointer"
        aria-label={isCollapsed ? 'Expand session' : 'Collapse session'}
        aria-expanded={!isCollapsed}
      >
        <ChevronRight
          className={`w-3.5 h-3.5 transition-transform duration-200 ${
            isCollapsed ? '' : 'rotate-90'
          }`}
        />
      </button>

      {/* Emoji */}
      {session.emoji && (
        <span className="text-sm">{session.emoji}</span>
      )}

      {/* Name / editing */}
      {isEditing ? (
        <input
          ref={inputRef}
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          aria-label="Rename session"
          className="flex-1 min-w-0 px-1.5 py-0.5 bg-carbon border border-signal-cyan/40 rounded text-[11px] font-mono text-bone outline-none"
        />
      ) : (
        <span
          onDoubleClick={handleDoubleClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleDoubleClick();
          }}
          aria-label={`Session: ${session.name}. Double-click or press Enter to rename.`}
          className="flex-1 min-w-0 text-[11px] font-mono font-semibold text-bone truncate cursor-default select-none"
          title="Double-click to rename"
        >
          {session.name}
        </span>
      )}

      {/* Count badge */}
      <span className="px-1.5 py-0.5 bg-graphite/30 text-[9px] font-mono text-ash rounded-full">
        {session.items.length}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleDoubleClick}
          className="p-1 text-ash/40 hover:text-bone transition-colors cursor-pointer"
          aria-label="Rename session"
        >
          <Pencil className="w-3 h-3" />
        </button>
        <button
          onClick={onToggleStar}
          className="p-1 text-ash/40 hover:text-signal-amber transition-colors cursor-pointer"
          aria-label={session.starred ? 'Unstar session' : 'Star session'}
          aria-pressed={session.starred}
        >
          <Star
            className={`w-3 h-3 ${session.starred ? 'fill-signal-amber text-signal-amber' : ''}`}
          />
        </button>
        <button
          onClick={onToggleLock}
          className="p-1 text-ash/40 hover:text-signal-cyan transition-colors cursor-pointer"
          aria-label={session.locked ? 'Unlock session' : 'Lock session'}
          aria-pressed={session.locked}
        >
          <Lock
            className={`w-3 h-3 ${session.locked ? 'fill-signal-cyan text-signal-cyan' : ''}`}
          />
        </button>
        <button
          onClick={onRestoreAll}
          className="p-1 text-ash/40 hover:text-signal-lime transition-colors cursor-pointer"
          aria-label="Restore all URLs"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
        <button
          onClick={onDelete}
          className="p-1 text-ash/40 hover:text-signal-magenta transition-colors cursor-pointer"
          aria-label="Delete session"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
