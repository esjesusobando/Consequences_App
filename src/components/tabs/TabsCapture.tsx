import React, { useState, useRef, useCallback } from 'react';
import { Upload, Clipboard } from 'lucide-react';

interface TabsCaptureProps {
  onParseUrls: (raw: string) => void;
  onImportBookmarks: (content: string) => void;
}

export function TabsCapture({ onParseUrls, onImportBookmarks }: TabsCaptureProps) {
  const [text, setText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleParse = useCallback(() => {
    if (text.trim()) {
      onParseUrls(text);
      setText('');
    }
  }, [text, onParseUrls]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleParse();
      }
    },
    [handleParse],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result;
        if (typeof content === 'string') {
          // Detect format: JSON starts with '{', HTML with '<!DOCTYPE' or '<html>'
          if (content.trim().startsWith('{')) {
            // JSON format - could be parsed state or raw JSON
            onImportBookmarks(content);
          } else if (content.includes('<DL>') || content.includes('<dl>') || content.startsWith('<!DOCTYPE')) {
            // HTML bookmarks format
            onImportBookmarks(content);
          } else {
            console.warn('Unknown file format - attempting import anyway');
            onImportBookmarks(content);
          }
        }
      };
      reader.readAsText(file);

      // Reset input so same file can be re-imported
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [onImportBookmarks],
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Clipboard className="w-3.5 h-3.5 text-ash/60" />
        <span className="text-[10px] font-mono text-ash/60 uppercase tracking-wider">
          Capture URLs
        </span>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Paste URLs here (one per line, or space/comma separated)&#10;Ctrl+Enter to parse"
        aria-label="Paste URLs to capture"
        className="w-full h-20 px-3 py-2 bg-carbon/50 border border-graphite/20 rounded-lg text-[11px] font-mono text-bone placeholder:text-ash/30 resize-none focus:outline-none focus:border-signal-cyan/40 transition-colors"
      />

      <div className="flex items-center gap-2">
        <button
          onClick={handleParse}
          disabled={!text.trim()}
          aria-label="Parse URLs from text"
          className="px-3 py-1.5 bg-signal-cyan/10 text-signal-cyan border border-signal-cyan/30 rounded-lg text-[10px] font-mono font-semibold uppercase tracking-wider hover:bg-signal-cyan/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          Parse
        </button>

        <div className="h-4 w-px bg-graphite/20" />

        <input
          ref={fileInputRef}
          type="file"
          accept=".html,.htm,.json"
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          aria-label="Import bookmarks from file"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-carbon/50 text-ash border border-graphite/20 rounded-lg text-[10px] font-mono font-semibold uppercase tracking-wider hover:text-bone hover:border-graphite/40 transition-colors cursor-pointer"
        >
          <Upload className="w-3 h-3" />
          Import Bookmarks
        </button>
      </div>
    </div>
  );
}
