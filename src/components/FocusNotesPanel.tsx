import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Copy, 
  Pencil, 
  Trash2, 
  Check, 
  X, 
  FolderOpen, 
  StickyNote,
  MoreHorizontal
} from 'lucide-react';
import { safeSet } from '../lib/storage';

type Note = {
  id: string;
  text: string;
  folder: string;
};

const DEFAULT_FOLDERS = ['Sin carpeta', 'Ideas', 'Pendientes', 'Referencia', 'Archive'];

export default function FocusNotesPanel() {
  const storageKey = 'sota_focus_notes';
  const folderKey = 'sota_focus_folders';

  const [notes, setNotes] = useState<Note[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch { /* ignore */ }
    return [];
  });

  const [folders, setFolders] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(folderKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch { /* ignore */ }
    return DEFAULT_FOLDERS;
  });

  const [newNote, setNewNote] = useState('');
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showFolderPicker, setShowFolderPicker] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  useEffect(() => {
    safeSet(storageKey, notes);
  }, [notes]);

  useEffect(() => {
    safeSet(folderKey, folders);
  }, [folders]);

  // Close menus on outside click
  useEffect(() => {
    const handler = () => { setActiveMenu(null); setShowFolderPicker(null); };
    if (activeMenu || showFolderPicker) {
      document.addEventListener('click', handler, { once: true });
      return () => document.removeEventListener('click', handler);
    }
  }, [activeMenu, showFolderPicker]);

  const filteredNotes = activeFolder 
    ? notes.filter(n => n.folder === activeFolder)
    : notes;

  const addNote = () => {
    if (!newNote.trim()) return;
    const note: Note = {
      id: `note-${Date.now()}`,
      text: newNote.trim(),
      folder: activeFolder || 'Sin carpeta',
    };
    setNotes(prev => [note, ...prev]);
    setNewNote('');
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    setActiveMenu(null);
  };

  const copyNote = (note: Note) => {
    navigator.clipboard.writeText(note.text).then(() => {
      setCopiedId(note.id);
      setTimeout(() => setCopiedId(null), 1500);
    });
    setActiveMenu(null);
  };

  const startEdit = (note: Note) => {
    setEditingId(note.id);
    setEditingText(note.text);
    setActiveMenu(null);
  };

  const saveEdit = (id: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, text: editingText } : n));
    setEditingId(null);
    setEditingText('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText('');
  };

  const moveToFolder = (id: string, folder: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, folder } : n));
    setShowFolderPicker(null);
    setActiveMenu(null);
  };

  const addFolder = () => {
    if (!newFolderName.trim()) return;
    if (!folders.includes(newFolderName.trim())) {
      setFolders(prev => [...prev, newFolderName.trim()]);
    }
    setNewFolderName('');
  };

  const folderCounts = (folder: string) => notes.filter(n => n.folder === folder).length;

  return (
    <div className="flex flex-col h-full bg-void/80 border-t border-graphite/40">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-graphite/30 bg-carbon/30">
        <div className="flex items-center gap-2">
          <StickyNote className="w-3.5 h-3.5 text-signal-lime" />
          <span className="font-mono text-[10px] uppercase font-bold tracking-widest text-signal-lime">
            NOTAS RÁPIDAS
          </span>
          <span className="text-[8px] font-mono text-slate">{notes.length}</span>
        </div>
      </div>

      {/* Folder tabs */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-graphite/20 overflow-x-auto">
        <button
          onClick={() => setActiveFolder(null)}
          className={`text-[7px] font-mono uppercase px-1.5 py-0.5 rounded transition-all cursor-pointer whitespace-nowrap ${
            activeFolder === null
              ? 'bg-signal-lime/15 text-signal-lime border border-signal-lime/30'
              : 'text-slate hover:text-bone border border-transparent'
          }`}
        >
          Todas ({notes.length})
        </button>
        {folders.map(f => (
          <button
            key={f}
            onClick={() => setActiveFolder(f)}
            className={`text-[7px] font-mono uppercase px-1.5 py-0.5 rounded transition-all cursor-pointer whitespace-nowrap ${
              activeFolder === f
                ? 'bg-signal-lime/15 text-signal-lime border border-signal-lime/30'
                : 'text-slate hover:text-bone border border-transparent'
            }`}
          >
            {f} ({folderCounts(f)})
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-1.5 px-3 py-2 border-b border-graphite/20">
        <input
          type="text"
          value={newNote}
          onChange={e => setNewNote(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addNote()}
          placeholder="Escribí tu nota..."
          className="flex-1 bg-void border border-graphite/50 rounded px-2.5 py-1 text-[10px] font-mono text-bone placeholder:text-slate/50 outline-none focus:border-signal-lime"
        />
        <button
          onClick={addNote}
          disabled={!newNote.trim()}
          className="w-7 h-7 flex items-center justify-center bg-signal-lime/15 text-signal-lime border border-signal-lime/30 rounded hover:bg-signal-lime/25 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>

      {/* Notes list */}
      <div className="flex-1 overflow-y-auto px-3 py-1.5 flex flex-col gap-1">
        {filteredNotes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-slate">
            <StickyNote className="w-5 h-5 mb-1.5 opacity-30" />
            <span className="text-[8px] font-mono uppercase">Sin notas{activeFolder ? ` en ${activeFolder}` : ''}</span>
          </div>
        )}

        {filteredNotes.map(note => (
          <div
            key={note.id}
            className="group bg-void/40 border border-graphite/25 rounded-lg px-2.5 py-2 hover:border-graphite/50 transition-all"
          >
            {editingId === note.id ? (
              <div className="flex flex-col gap-1">
                <textarea
                  value={editingText}
                  onChange={e => setEditingText(e.target.value)}
                  autoFocus
                  className="w-full bg-void border border-signal-lime/40 rounded px-2 py-1 text-[10px] font-mono text-bone outline-none resize-none min-h-[32px]"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit(note.id); }
                    if (e.key === 'Escape') cancelEdit();
                  }}
                />
                <div className="flex gap-1 justify-end">
                  <button onClick={() => saveEdit(note.id)} className="p-0.5 text-signal-lime hover:bg-signal-lime/15 rounded cursor-pointer" title="Guardar">
                    <Check className="w-3 h-3" />
                  </button>
                  <button onClick={cancelEdit} className="p-0.5 text-slate hover:text-bone hover:bg-graphite/30 rounded cursor-pointer" title="Cancelar">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-2">
                <p className="text-[10px] font-mono text-bone leading-relaxed whitespace-pre-wrap break-words flex-1 min-w-0">
                  {note.text}
                </p>
                
                {/* Kebab menu — minimalist */}
                <div className="relative flex-shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === note.id ? null : note.id); }}
                    className="p-0.5 text-slate/50 hover:text-signal-lime rounded transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                  >
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </button>

                  {activeMenu === note.id && (
                    <div className="absolute right-0 top-full mt-1 bg-[#0c101a] border border-graphite/50 rounded-lg shadow-xl z-20 py-1 min-w-[110px]" onClick={e => e.stopPropagation()}>
                      <button onClick={() => copyNote(note)} className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[8px] font-mono text-bone hover:bg-graphite/30 transition-colors cursor-pointer">
                        <Copy className="w-3 h-3 text-slate" /> Copiar
                      </button>
                      <button onClick={() => startEdit(note)} className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[8px] font-mono text-bone hover:bg-graphite/30 transition-colors cursor-pointer">
                        <Pencil className="w-3 h-3 text-slate" /> Editar
                      </button>
                      
                      {/* Submenu: move to folder */}
                      <div className="relative">
                        <button 
                          onClick={() => setShowFolderPicker(showFolderPicker === note.id ? null : note.id)}
                          className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[8px] font-mono text-bone hover:bg-graphite/30 transition-colors cursor-pointer"
                        >
                          <FolderOpen className="w-3 h-3 text-slate" /> Mover a...
                        </button>
                        {showFolderPicker === note.id && (
                          <div className="absolute right-full top-0 mr-1 bg-[#0c101a] border border-graphite/50 rounded-lg shadow-xl py-1 min-w-[100px]">
                            {folders.map(f => (
                              <button
                                key={f}
                                onClick={() => moveToFolder(note.id, f)}
                                className={`w-full text-left px-2.5 py-1 text-[7px] font-mono uppercase hover:bg-graphite/30 transition-colors cursor-pointer ${
                                  note.folder === f ? 'text-signal-lime' : 'text-bone'
                                }`}
                              >
                                {f}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="border-t border-graphite/30 my-0.5" />
                      <button onClick={() => deleteNote(note.id)} className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[8px] font-mono text-signal-magenta hover:bg-signal-magenta/10 transition-colors cursor-pointer">
                        <Trash2 className="w-3 h-3" /> Eliminar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer — add folder */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 border-t border-graphite/20">
        <input
          type="text"
          value={newFolderName}
          onChange={e => setNewFolderName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addFolder()}
          placeholder="+ carpeta..."
          className="flex-1 bg-void border border-graphite/40 rounded px-2 py-0.5 text-[7px] font-mono text-bone placeholder:text-slate/40 outline-none focus:border-signal-lime/50"
        />
        <button
          onClick={addFolder}
          disabled={!newFolderName.trim()}
          className="p-0.5 text-slate hover:text-signal-lime transition-colors cursor-pointer disabled:opacity-30"
          title="Crear carpeta"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
