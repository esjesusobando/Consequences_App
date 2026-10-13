import React, { useState, useCallback, useRef, useEffect } from 'react';
import { List, LayoutGrid, Download, Upload, Tag, Search, Sparkles } from 'lucide-react';

interface TabsToolbarProps {
  activeView: 'list' | 'dashboard';
  onViewChange: (view: 'list' | 'dashboard') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  allTags: string[];
  activeTagFilter: string | null;
  onTagFilterChange: (tag: string | null) => void;
  onExportJSON: () => void;
  onExportHTML: () => void;
  onImportClick: () => void;
  onAiGroup: () => void;
  sessionCount: number;
  itemCount: number;
}

export function TabsToolbar({
  activeView,
  onViewChange,
  searchQuery,
  onSearchChange,
  allTags,
  activeTagFilter,
  onTagFilterChange,
  onExportJSON,
  onExportHTML,
  onImportClick,
  onAiGroup,
  sessionCount,
  itemCount,
}: TabsToolbarProps) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close export menu on outside click or Escape
  useEffect(() => {
    if (!showExportMenu) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showExportMenu]);

  const handleExport = useCallback(
    (type: 'json' | 'html') => {
      setShowExportMenu(false);
      if (type === 'json') onExportJSON();
      else onExportHTML();
    },
    [onExportJSON, onExportHTML],
  );

  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      {/* Left: View toggle + Search + Tag filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* View toggle */}
        <div className="flex items-center bg-carbon/50 border border-graphite/20 rounded-lg p-0.5">
          <button
            onClick={() => onViewChange('list')}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              activeView === 'list'
                ? 'bg-signal-cyan/10 text-signal-cyan'
                : 'text-ash/40 hover:text-bone'
            }`}
            aria-label="List view"
            aria-pressed={activeView === 'list'}
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onViewChange('dashboard')}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              activeView === 'dashboard'
                ? 'bg-signal-cyan/10 text-signal-cyan'
                : 'text-ash/40 hover:text-bone'
            }`}
            aria-label="Dashboard view"
            aria-pressed={activeView === 'dashboard'}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-ash/40 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tabs..."
            aria-label="Search tabs"
            className="pl-7 pr-2 py-1 bg-carbon/50 border border-graphite/20 rounded-lg text-[10px] font-mono text-bone placeholder:text-ash/30 w-40 focus:outline-none focus:border-signal-cyan/40 transition-colors"
          />
        </div>

        {/* Tag filter chips */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            <Tag className="w-3 h-3 text-ash/30" />
            <button
              onClick={() => onTagFilterChange(null)}
              aria-label="Clear tag filter"
              aria-pressed={activeTagFilter === null}
              className={`px-2 py-0.5 rounded-full text-[9px] font-mono transition-colors cursor-pointer ${
                activeTagFilter === null
                  ? 'bg-signal-cyan/10 text-signal-cyan border border-signal-cyan/30'
                  : 'bg-graphite/20 text-ash/60 border border-transparent hover:text-bone'
              }`}
            >
              All
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() =>
                  onTagFilterChange(activeTagFilter === tag ? null : tag)
                }
                aria-label={`Filter by tag: ${tag}`}
                aria-pressed={activeTagFilter === tag}
                className={`px-2 py-0.5 rounded-full text-[9px] font-mono transition-colors cursor-pointer ${
                  activeTagFilter === tag
                    ? 'bg-signal-cyan/10 text-signal-cyan border border-signal-cyan/30'
                    : 'bg-graphite/20 text-ash/60 border border-transparent hover:text-bone'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right: Stats + Export/Import */}
      <div className="flex items-center gap-2">
        {/* Stats */}
        <span className="text-[9px] font-mono text-ash/40">
          {sessionCount} sessions · {itemCount} items
        </span>

        <div className="h-4 w-px bg-graphite/20" />

        {/* AI Group — v2 stub */}
        <button
          onClick={onAiGroup}
          disabled={sessionCount === 0}
          title="AI auto-grouping coming in v2"
          aria-label="Group tabs with AI (coming in v2)"
          className="flex items-center gap-1 px-2 py-1 bg-carbon/50 text-ash border border-graphite/20 rounded-lg text-[9px] font-mono hover:text-bone hover:border-graphite/40 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Sparkles className="w-3 h-3" />
          Group AI
        </button>

        <div className="h-4 w-px bg-graphite/20" />

        {/* Import */}
        <button
          onClick={onImportClick}
          aria-label="Import bookmarks or JSON file"
          className="flex items-center gap-1 px-2 py-1 bg-carbon/50 text-ash border border-graphite/20 rounded-lg text-[9px] font-mono hover:text-bone hover:border-graphite/40 transition-colors cursor-pointer"
        >
          <Upload className="w-3 h-3" />
          Import
        </button>

        {/* Export dropdown */}
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            aria-label="Export tabs"
            aria-expanded={showExportMenu}
            aria-haspopup="menu"
            className="flex items-center gap-1 px-2 py-1 bg-carbon/50 text-ash border border-graphite/20 rounded-lg text-[9px] font-mono hover:text-bone hover:border-graphite/40 transition-colors cursor-pointer"
          >
            <Download className="w-3 h-3" />
            Export
          </button>

          {showExportMenu && (
            <div role="menu" className="absolute right-0 top-full mt-1 bg-carbon border border-graphite/40 rounded-lg shadow-xl z-50 py-1 min-w-[140px]">
              <button
                role="menuitem"
                onClick={() => handleExport('json')}
                className="w-full text-left px-3 py-1.5 text-[10px] font-mono text-bone hover:bg-graphite/30 transition-colors cursor-pointer"
              >
                Export JSON
              </button>
              <button
                role="menuitem"
                onClick={() => handleExport('html')}
                className="w-full text-left px-3 py-1.5 text-[10px] font-mono text-bone hover:bg-graphite/30 transition-colors cursor-pointer"
              >
                Export HTML Bookmarks
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
