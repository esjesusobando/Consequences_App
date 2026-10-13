import React, { useState, useEffect, useRef } from 'react';
import {
  Inbox,
  Send,
  FileText,
  Archive,
  AlertCircle,
  Trash2,
  Star,
  Search,
  RefreshCw,
  Mail,
  MailOpen,
  Clock,
  Copy,
  CheckCircle2,
  ListTodo,
  Sparkles,
  Zap,
  ChevronDown,
  Paperclip,
  Reply,
  Forward,
  MoreHorizontal,
} from 'lucide-react';
import { EmailMessage, EmailFolder, BacklogTask, AccentColor } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface EmailViewProps {
  accent: AccentColor;
  onLogMessage: (type: 'info' | 'ok' | 'warn' | 'err', text: string) => void;
  onAddTask: (task: BacklogTask) => void;
  googleToken: string | null;
}

// Mock data for now - will integrate with Gmail API
const MOCK_EMAILS: EmailMessage[] = [
  {
    id: '1',
    from: 'cliente@empresa.com',
    fromName: 'Carlos Méndez',
    to: ['tu@email.com'],
    subject: 'Propuesta de proyecto Q3 - Revisión urgente',
    body: '<p>Hola,</p><p>Te envío la propuesta para el proyecto Q3. Necesito tu feedback antes del viernes para poder presentarla al board.</p><p>Los puntos clave son:</p><ul><li>Presupuesto: $45,000 USD</li><li>Timeline: 3 meses</li><li>Equipo: 4 developers + 1 PM</li></ul><p>Avísame si tienes dudas.</p><p>Saludos,<br/>Carlos</p>',
    bodyText: 'Hola, Te envío la propuesta para el proyecto Q3. Necesito tu feedback antes del viernes para poder presentarla al board. Los puntos clave son: Presupuesto: $45,000 USD, Timeline: 3 meses, Equipo: 4 developers + 1 PM. Avísame si tienes dudas. Saludos, Carlos',
    snippet: 'Te envío la propuesta para el proyecto Q3. Necesito tu feedback antes del viernes...',
    date: '2026-06-13T10:30:00Z',
    read: false,
    starred: true,
    folder: 'inbox',
    labels: ['importante', 'proyecto'],
    attachments: [],
    provider: 'gmail',
    aiSummary: 'Propuesta de proyecto Q3 con presupuesto $45K y timeline 3 meses. Requiere feedback antes del viernes.',
    aiPriority: 'urgent',
    aiActionItems: ['Revisar propuesta', 'Dar feedback antes del viernes'],
  },
  {
    id: '2',
    from: 'equipo@startup.io',
    fromName: 'Equipo Dev',
    to: ['tu@email.com'],
    subject: 'Sprint Review - Resumen y próximos pasos',
    body: '<p>Resumen del Sprint Review:</p><p>Completamos 18 de 21 story points. Los pendientes son:</p><ul><li>Fix del bug en autenticación (prioridad alta)</li><li>Optimización de queries N+1</li><li>Documentación de API endpoints</li></ul><p>Próximo sprint planning: lunes 10am.</p>',
    bodyText: 'Resumen del Sprint Review: Completamos 18 de 21 story points. Los pendientes son: Fix del bug en autenticación (prioridad alta), Optimización de queries N+1, Documentación de API endpoints. Próximo sprint planning: lunes 10am.',
    snippet: 'Completamos 18 de 21 story points. Los pendientes son: Fix del bug en autenticación...',
    date: '2026-06-13T09:15:00Z',
    read: false,
    starred: false,
    folder: 'inbox',
    labels: ['sprint', 'dev'],
    attachments: [],
    provider: 'gmail',
    aiSummary: 'Sprint review: 18/21 puntos completados. Pendientes: bug auth, queries N+1, docs API.',
    aiPriority: 'normal',
    aiActionItems: ['Fix bug autenticación', 'Optimizar queries N+1', 'Documentar API'],
  },
  {
    id: '3',
    from: 'newsletter@techdigest.com',
    fromName: 'Tech Digest',
    to: ['tu@email.com'],
    subject: 'Las 10 tendencias de IA que dominarán 2026',
    body: '<p>Descubre las tendencias que están transformando la industria...</p>',
    bodyText: 'Descubre las tendencias que están transformando la industria...',
    snippet: 'Descubre las tendencias que están transformando la industria...',
    date: '2026-06-13T08:00:00Z',
    read: true,
    starred: false,
    folder: 'inbox',
    labels: ['newsletter'],
    attachments: [],
    provider: 'gmail',
    aiPriority: 'low',
  },
];

export default function EmailView({
  accent,
  onLogMessage,
  onAddTask,
  googleToken,
}: EmailViewProps) {
  const [emails, setEmails] = useState<EmailMessage[]>(MOCK_EMAILS);
  const [selectedFolder, setSelectedFolder] = useState<EmailFolder>('inbox');
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [copyToTasksEnabled, setCopyToTasksEnabled] = useState(true);
  const [copiedText, setCopiedText] = useState('');
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [tasksCreatedCount, setTasksCreatedCount] = useState(0);

  const readingPaneRef = useRef<HTMLDivElement>(null);

  // Filter emails by folder and search
  const filteredEmails = emails.filter(email => {
    const matchesFolder = email.folder === selectedFolder;
    const matchesSearch = searchQuery === '' || 
      email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.fromName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.bodyText.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFolder && matchesSearch;
  });

  // Handle text selection in reading pane
  const handleTextSelection = () => {
    // Small delay to ensure selection is complete
    setTimeout(() => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !selectedEmail) return;

      const text = selection.toString().trim();
      if (text.length < 5) return; // Ignore tiny selections

      // Copy to clipboard
      navigator.clipboard.writeText(text).then(() => {
        setCopiedText(text);
        setShowCopyToast(true);
        setTimeout(() => setShowCopyToast(false), 2000);

        onLogMessage('info', `Texto copiado al portapapeles: "${text.slice(0, 50)}..."`);

        // If copy-to-tasks is enabled, create a task
        if (copyToTasksEnabled) {
          const newTask: BacklogTask = {
            id: `TASK-${Date.now().toString(36).toUpperCase()}`,
            title: `[Email] ${selectedEmail.subject}`,
            description: text,
            estimatedMinutes: 30,
            source: 'email',
            sourceEmailId: selectedEmail.id,
            sourceText: text,
            status: 'backlog',
            priority: 'medium',
            tags: ['email', 'extracted'],
            createdAt: new Date().toISOString(),
          };

          onAddTask(newTask);
          setTasksCreatedCount(prev => prev + 1);
          onLogMessage('ok', `✓ Tarea creada: "${newTask.title}" → Ir a Tareas para ver`);
        }
      }).catch(err => {
        onLogMessage('err', `Error al copiar: ${err.message}`);
      });
    }, 100);
  };

  // Mark email as read
  const markAsRead = (emailId: string) => {
    setEmails(prev => prev.map(e => 
      e.id === emailId ? { ...e, read: true } : e
    ));
  };

  // Toggle star
  const toggleStar = (emailId: string) => {
    setEmails(prev => prev.map(e => 
      e.id === emailId ? { ...e, starred: !e.starred } : e
    ));
  };

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return 'Ahora';
    if (hours < 24) return `${hours}h`;
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  };

  // Get accent classes
  const getAccentClass = () => {
    switch (accent) {
      case 'magenta': return 'text-signal-magenta';
      case 'lime': return 'text-signal-lime';
      case 'amber': return 'text-signal-amber';
      default: return 'text-signal-cyan';
    }
  };

  const getAccentBgClass = () => {
    switch (accent) {
      case 'magenta': return 'bg-signal-magenta/10';
      case 'lime': return 'bg-signal-lime/10';
      case 'amber': return 'bg-signal-amber/10';
      default: return 'bg-signal-cyan/10';
    }
  };

  // Folders config
  const folders = [
    { id: 'inbox', label: 'Inbox', icon: Inbox, count: emails.filter(e => e.folder === 'inbox' && !e.read).length },
    { id: 'starred', label: 'Starred', icon: Star, count: emails.filter(e => e.starred).length },
    { id: 'sent', label: 'Sent', icon: Send, count: 0 },
    { id: 'drafts', label: 'Drafts', icon: FileText, count: 0 },
    { id: 'archive', label: 'Archive', icon: Archive, count: 0 },
    { id: 'spam', label: 'Spam', icon: AlertCircle, count: 0 },
    { id: 'trash', label: 'Trash', icon: Trash2, count: 0 },
  ];

  return (
    <div className="flex h-full bg-void overflow-hidden">
      {/* Left sidebar: Folders */}
      <div className="w-56 bg-carbon/30 border-r border-graphite/40 flex flex-col">
        <div className="p-4 border-b border-graphite/30">
          <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-signal-cyan/10 hover:bg-signal-cyan/20 text-signal-cyan rounded-lg transition-all font-display font-semibold text-sm">
            <Mail className="w-4 h-4" />
            Compose
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {folders.map(folder => {
            const Icon = folder.icon;
            const active = selectedFolder === folder.id;
            return (
              <button
                key={folder.id}
                onClick={() => setSelectedFolder(folder.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg mb-1 transition-all ${
                  active
                    ? `${getAccentBgClass()} ${getAccentClass()}`
                    : 'text-ash hover:text-bone hover:bg-carbon/40'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-display font-semibold">{folder.label}</span>
                {folder.count > 0 && (
                  <span className={`ml-auto text-xs font-bold ${active ? getAccentClass() : 'text-ash/60'}`}>
                    {folder.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Copy to Tasks toggle */}
        <div className="p-4 border-t border-graphite/30 bg-carbon/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ListTodo className="w-4 h-4 text-signal-lime" />
              <span className="text-xs font-mono text-bone uppercase tracking-wide">Auto → Tareas</span>
            </div>
            <button
              onClick={() => setCopyToTasksEnabled(!copyToTasksEnabled)}
              className={`relative w-10 h-5 rounded-full transition-all ${
                copyToTasksEnabled ? 'bg-signal-lime' : 'bg-graphite/60'
              }`}
            >
              <div
                className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${
                  copyToTasksEnabled ? 'left-5' : 'left-0.5'
                }`}
              />
            </button>
          </div>
          <p className="text-[10px] text-ash/70 font-mono mb-2">
            {copyToTasksEnabled ? '✓ Seleccionar texto crea tarea' : 'Solo copia al portapapeles'}
          </p>
          {tasksCreatedCount > 0 && (
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-signal-lime">
              <CheckCircle2 className="w-3 h-3" />
              <span>{tasksCreatedCount} tarea{tasksCreatedCount > 1 ? 's' : ''} creada{tasksCreatedCount > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </div>

      {/* Middle: Email list */}
      <div className="w-96 bg-void border-r border-graphite/40 flex flex-col">
        {/* Search bar */}
        <div className="p-3 border-b border-graphite/30">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ash/60" />
            <input
              type="text"
              placeholder="Buscar emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-carbon/40 border border-graphite/50 rounded-lg text-sm text-bone placeholder-ash/40 focus:outline-none focus:border-signal-cyan/60 transition-all"
            />
          </div>
        </div>

        {/* Email list */}
        <div className="flex-1 overflow-y-auto">
          {filteredEmails.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-ash/40">
              <Mail className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm font-display">No hay emails</p>
            </div>
          ) : (
            filteredEmails.map(email => {
              const isSelected = selectedEmail?.id === email.id;
              return (
                <div
                  key={email.id}
                  onClick={() => {
                    setSelectedEmail(email);
                    if (!email.read) markAsRead(email.id);
                  }}
                  className={`px-4 py-3 border-b border-graphite/20 cursor-pointer transition-all ${
                    isSelected
                      ? `${getAccentBgClass()} border-l-2 ${getAccentClass().replace('text-', 'border-')}`
                      : 'hover:bg-carbon/30'
                  } ${!email.read ? 'bg-carbon/20' : ''}`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {!email.read && <div className="w-2 h-2 bg-signal-cyan rounded-full shrink-0" />}
                      <span className={`text-sm font-display font-semibold truncate ${!email.read ? 'text-bone' : 'text-ash'}`}>
                        {email.fromName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-ash/60 font-mono">{formatDate(email.date)}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStar(email.id);
                        }}
                        className={`p-0.5 ${email.starred ? 'text-signal-amber' : 'text-ash/30 hover:text-ash/60'}`}
                      >
                        <Star className="w-3.5 h-3.5" fill={email.starred ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                  </div>
                  <div className={`text-sm font-display font-medium mb-1 truncate ${!email.read ? 'text-bone' : 'text-ash/80'}`}>
                    {email.subject}
                  </div>
                  <div className="text-xs text-ash/60 truncate">{email.snippet}</div>
                  {email.aiPriority && (
                    <div className="flex items-center gap-1 mt-2">
                      <Sparkles className="w-3 h-3 text-signal-cyan" />
                      <span className="text-[9px] font-mono text-signal-cyan uppercase">
                        {email.aiPriority}
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right: Reading pane */}
      <div className="flex-1 flex flex-col bg-void overflow-hidden">
        {selectedEmail ? (
          <>
            {/* Email header */}
            <div className="p-6 border-b border-graphite/30 bg-carbon/20">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-xl font-bold font-display text-bone mb-2">{selectedEmail.subject}</h1>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="font-display font-semibold text-bone">{selectedEmail.fromName}</span>
                    <span className="text-ash/60 font-mono">&lt;{selectedEmail.from}&gt;</span>
                  </div>
                  <div className="text-xs text-ash/60 mt-1 font-mono">
                    Para: {selectedEmail.to.join(', ')}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 text-ash hover:text-bone hover:bg-carbon/40 rounded-lg transition-all">
                    <Reply className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-ash hover:text-bone hover:bg-carbon/40 rounded-lg transition-all">
                    <Forward className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-ash hover:text-bone hover:bg-carbon/40 rounded-lg transition-all">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* AI Summary */}
              {selectedEmail.aiSummary && (
                <div className="flex items-start gap-2 p-3 bg-signal-cyan/5 border border-signal-cyan/20 rounded-lg">
                  <Sparkles className="w-4 h-4 text-signal-cyan shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-xs font-display text-signal-cyan uppercase mb-1">AI Summary</div>
                    <div className="text-sm text-bone">{selectedEmail.aiSummary}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Email body */}
            <div
              ref={readingPaneRef}
              onMouseUp={handleTextSelection}
              className="flex-1 overflow-y-auto p-6 custom-scrollbar select-text"
              style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
            >
              <div
                className="prose prose-invert prose-sm max-w-none text-bone/90 leading-relaxed select-text"
                style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
                dangerouslySetInnerHTML={{ __html: selectedEmail.body }}
              />
            </div>

            {/* Action items */}
            {selectedEmail.aiActionItems && selectedEmail.aiActionItems.length > 0 && (
              <div className="p-4 border-t border-graphite/30 bg-carbon/20">
                <div className="flex items-center gap-2 mb-2">
                  <ListTodo className="w-4 h-4 text-signal-lime" />
                  <span className="text-xs font-display text-signal-lime uppercase">Action Items</span>
                </div>
                <div className="space-y-1">
                  {selectedEmail.aiActionItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-bone/80">
                      <div className="w-1.5 h-1.5 bg-signal-lime rounded-full" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-ash/40">
            <MailOpen className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-sm font-display">Selecciona un email para leer</p>
          </div>
        )}
      </div>

      {/* Copy toast */}
      <AnimatePresence>
        {showCopyToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 right-6 ${copyToTasksEnabled ? 'bg-signal-lime' : 'bg-signal-cyan'} text-void px-4 py-3 rounded-lg shadow-2xl flex items-center gap-2 z-50`}
          >
            <CheckCircle2 className="w-5 h-5" />
            <div>
              <div className="text-sm font-semibold">Copiado al portapapeles</div>
              {copyToTasksEnabled && (
                <div className="text-xs opacity-90 font-semibold">+ Tarea creada → Ve a Tareas para verla</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
