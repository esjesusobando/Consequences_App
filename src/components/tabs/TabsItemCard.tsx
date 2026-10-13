import React, { useCallback, useRef } from 'react';
import { Star, Lock, Trash2, ExternalLink } from 'lucide-react';
import type { TabItem } from '../../types';
import { extractDomain } from './tabsUtils';

interface TabsItemCardProps {
  item: TabItem;
  compact?: boolean;
  onToggleStar: () => void;
  onToggleLock: () => void;
  onDelete: () => void;
  onShowPopover: (rect: DOMRect) => void;
  onRemoveTag: (tag: string) => void;
}

export function TabsItemCard({
  item,
  compact,
  onToggleStar,
  onToggleLock,
  onDelete,
  onShowPopover,
  onRemoveTag,
}: TabsItemCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const domain = extractDomain(item.url);

  const handleHover = useCallback(() => {
    if (cardRef.current) {
      onShowPopover(cardRef.current.getBoundingClientRect());
    }
  }, [onShowPopover]);

  if (compact) {
    return (
      <div
        ref={cardRef}
        onMouseEnter={handleHover}
        className="flex items-center gap-2 px-2.5 py-2 bg-carbon/30 border border-graphite/10 rounded-lg hover:border-graphite/30 transition-colors group"
      >
        <img
          src={item.favicon}
          alt=""
          className="w-4 h-4 rounded-sm shrink-0"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-mono text-bone truncate">
            {item.title || domain}
          </div>
          <div className="text-[8px] font-mono text-ash/40 truncate">{domain}</div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {item.starred && <Star className="w-3 h-3 text-signal-amber fill-signal-amber" />}
          {item.locked && <Lock className="w-3 h-3 text-signal-cyan" />}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={cardRef}
      onMouseEnter={handleHover}
      className="flex items-center gap-3 px-3 py-2.5 bg-carbon/30 border border-graphite/10 rounded-xl hover:border-graphite/30 transition-colors group"
    >
      {/* Favicon */}
      <img
        src={item.favicon}
        alt=""
        className="w-5 h-5 rounded-sm shrink-0"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-bone truncate">
            {item.title || domain}
          </span>
        </div>
        <div className="text-[9px] font-mono text-ash/40 truncate">{item.url}</div>

        {/* Tags */}
        {item.tags.length > 0 && (
          <div className="flex items-center gap-1 mt-1 flex-wrap">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-graphite/30 text-[8px] font-mono text-ash rounded-full"
              >
                {tag}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveTag(tag);
                  }}
                  className="text-ash/40 hover:text-signal-magenta cursor-pointer"
                  aria-label={`Remove tag ${tag}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="p-1 text-ash/40 hover:text-signal-cyan transition-colors"
          aria-label="Open URL"
        >
          <ExternalLink className="w-3 h-3" />
        </a>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleStar();
          }}
          className="p-1 text-ash/40 hover:text-signal-amber transition-colors cursor-pointer"
          aria-label={item.starred ? 'Unstar' : 'Star'}
          aria-pressed={item.starred}
        >
          <Star
            className={`w-3 h-3 ${item.starred ? 'fill-signal-amber text-signal-amber' : ''}`}
          />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleLock();
          }}
          className="p-1 text-ash/40 hover:text-signal-cyan transition-colors cursor-pointer"
          aria-label={item.locked ? 'Unlock' : 'Lock'}
          aria-pressed={item.locked}
        >
          <Lock
            className={`w-3 h-3 ${item.locked ? 'fill-signal-cyan text-signal-cyan' : ''}`}
          />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 text-ash/40 hover:text-signal-magenta transition-colors cursor-pointer"
          aria-label="Delete"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
