import React, { useState, useCallback, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { ExternalLink, X, Star, Lock, Trash2 } from 'lucide-react';
import type { TabItem } from '../../types';

interface TabsPopoverProps {
  item: TabItem;
  rect: DOMRect;
  onClose: () => void;
  onUpdateNote: (note: string) => void;
  onUpdateTags: (tags: string[]) => void;
}

const COMMON_EMOJIS = ['📁', '💼', '🎯', '📚', '🔧', '🎨', '🏠', '🚀', '💡', '🔗', '📝', '⭐'];

export function TabsPopover({
  item,
  rect,
  onClose,
  onUpdateNote,
  onUpdateTags,
}: TabsPopoverProps) {
  const [note, setNote] = useState(item.note || '');
  const [localTags, setLocalTags] = useState(item.tags);
  const [newTag, setNewTag] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);

  // Re-sync note when prop changes (e.g. external edit or item switch)
  useEffect(() => {
    setNote(item.note || '');
  }, [item.note, item.id]);

  // Re-sync tags when prop changes
  useEffect(() => {
    setLocalTags(item.tags);
  }, [item.tags, item.id]);

  // Compute position relative to viewport
  const [style, setStyle] = useState<{ top: number; left: number }>({
    top: rect.bottom + 8,
    left: rect.left,
  });

  // Reposition on mount to handle viewport edges (useLayoutEffect to avoid 1-frame flicker)
  useLayoutEffect(() => {
    const popW = 340;
    const popH = popoverRef.current?.offsetHeight || 300;
    const pad = 12;

    let top = rect.bottom + pad;
    let left = rect.left;

    // Flip above if too close to bottom
    if (top + popH > window.innerHeight - pad) {
      top = rect.top - popH - pad;
    }

    // Shift left if too close to right edge
    if (left + popW > window.innerWidth - pad) {
      left = window.innerWidth - popW - pad;
    }

    // Ensure not negative
    if (left < pad) left = pad;
    if (top < pad) top = pad;

    setStyle({ top, left });
  }, [rect]);

  // Click outside to close
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [onClose]);

  // Escape to close + save note on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (note !== (item.note || '')) {
          onUpdateNote(note);
        }
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [note, item.note, onUpdateNote, onClose]);

  const handleNoteBlur = useCallback(() => {
    if (note !== (item.note || '')) {
      onUpdateNote(note);
    }
  }, [note, item.note, onUpdateNote]);

  const handleAddTag = useCallback(() => {
    const trimmed = newTag.trim();
    if (trimmed && !localTags.includes(trimmed)) {
      const next = [...localTags, trimmed];
      setLocalTags(next);
      onUpdateTags(next);
      setNewTag('');
    }
  }, [newTag, localTags, onUpdateTags]);

  const handleRemoveTag = useCallback(
    (tag: string) => {
      const next = localTags.filter((t) => t !== tag);
      setLocalTags(next);
      onUpdateTags(next);
    },
    [localTags, onUpdateTags],
  );

  const handleAddTagKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddTag();
      }
    },
    [handleAddTag],
  );

  const popover = (
    <div
      ref={popoverRef}
      role="dialog"
      aria-label={`Details for ${item.title || item.url}`}
      className="fixed z-[500] w-[340px] bg-carbon border border-graphite/40 rounded-xl shadow-2xl overflow-hidden animate-fade-in"
      style={{ top: style.top, left: style.left }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-start gap-3 p-3 border-b border-graphite/20">
        <img
          src={item.favicon}
          alt=""
          className="w-6 h-6 rounded-sm shrink-0 mt-0.5"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-mono font-semibold text-bone truncate">
            {item.title || item.url}
          </div>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[9px] font-mono text-signal-cyan/70 hover:text-signal-cyan truncate mt-0.5 transition-colors"
          >
            <ExternalLink className="w-2.5 h-2.5 shrink-0" />
            {item.url}
          </a>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-ash/40 hover:text-bone transition-colors cursor-pointer shrink-0"
          aria-label="Close"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Indicators */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-graphite/10">
        {item.starred && (
          <span className="flex items-center gap-0.5 text-[9px] font-mono text-signal-amber">
            <Star className="w-3 h-3 fill-signal-amber" /> Starred
          </span>
        )}
        {item.locked && (
          <span className="flex items-center gap-0.5 text-[9px] font-mono text-signal-cyan">
            <Lock className="w-3 h-3 fill-signal-cyan" /> Locked
          </span>
        )}
        {!item.starred && !item.locked && (
          <span className="text-[9px] font-mono text-ash/30">No flags</span>
        )}
      </div>

      {/* Tags */}
      <div className="px-3 py-2 border-b border-graphite/10">
        <div className="text-[8px] font-mono text-ash/40 uppercase tracking-wider mb-1.5">
          Tags
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          {localTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-graphite/30 text-[8px] font-mono text-ash rounded-full"
            >
              {tag}
              <button
                onClick={() => handleRemoveTag(tag)}
                className="text-ash/40 hover:text-signal-magenta cursor-pointer"
                aria-label={`Remove tag ${tag}`}
              >
                ×
              </button>
            </span>
          ))}
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={handleAddTagKeyDown}
            onBlur={handleAddTag}
            placeholder="+ tag"
            aria-label="Add new tag"
            className="px-1.5 py-0.5 bg-transparent border border-graphite/20 rounded text-[8px] font-mono text-bone placeholder:text-ash/30 w-14 focus:outline-none focus:border-signal-cyan/40 transition-colors"
          />
        </div>
      </div>

      {/* Note */}
      <div className="px-3 py-2">
        <div className="text-[8px] font-mono text-ash/40 uppercase tracking-wider mb-1.5">
          Note
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={handleNoteBlur}
          placeholder="Add a note..."
          aria-label="Edit note"
          className="w-full h-16 px-2 py-1.5 bg-carbon/50 border border-graphite/20 rounded-lg text-[10px] font-mono text-bone placeholder:text-ash/30 resize-none focus:outline-none focus:border-signal-cyan/40 transition-colors"
        />
      </div>
    </div>
  );

  return createPortal(popover, document.body);
}
