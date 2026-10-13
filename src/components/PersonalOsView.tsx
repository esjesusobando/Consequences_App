import React, { useState, useRef } from 'react';
import { 
  Sliders, 
  Image as ImageIcon, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  FileText, 
  Sparkles, 
  Upload, 
  Files, 
  Search, 
  Plus, 
  FileCheck, 
  Copy, 
  Check, 
  Clock, 
  Eye, 
  HelpCircle,
  Tag,
  Monitor,
  Video
} from 'lucide-react';
import { PresentationConfig, AccentColor } from '../types';
import { BACKGROUND_PRESETS, AMBIENT_TRACKS } from '../personalOsData';

interface PersonalOsViewProps {
  config: PresentationConfig;
  setConfig: React.Dispatch<React.SetStateAction<PresentationConfig>>;
  onLogMessage: (type: 'info' | 'ok' | 'warn' | 'err', text: string) => void;
  accent: AccentColor;
}

export default function PersonalOsView({
  config,
  setConfig,
  onLogMessage,
  accent,
}: PersonalOsViewProps) {
  // OCR states
  const [ocrImageName, setOcrImageName] = useState<string>('');
  const [ocrBase64, setOcrBase64] = useState<string>('');
  const [ocrText, setOcrText] = useState<string>('');
  const [isOcrAnalyzing, setIsOcrAnalyzing] = useState<boolean>(false);
  const [ocrCopied, setOcrCopied] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Claude Co-work style states
  const [colaborativeDraft, setColaborativeDraft] = useState<string>(
    "# Borrador del Plan Operativo Personal OS\n\nEste espacio es tu lienzo donde co-trabajas con tu Codex Personal.\nModifica, edita, y sincroniza tus especificaciones técnicas en tiempo real."
  );
  const [aiChatMessages, setAiChatMessages] = useState<{ sender: 'user' | 'assistant'; text: string; time: string }[]>([
    { sender: 'assistant', text: "Saludos. Soy tu Codex Co-worker de Personal OS. ¿En qué especificación técnica u orden de inventario trabajamos hoy?", time: "14:49" }
  ]);
  const [currentUserMsg, setCurrentUserMsg] = useState<string>('');
  const [isAiResponding, setIsAiResponding] = useState<boolean>(false);

  // Vitaminized File Explorer states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [explorerFiles, setExplorerFiles] = useState<Array<{ id: string; name: string; tag: 'Doc' | 'Data' | 'Media' | 'System'; size: string; date: string; content?: string }>>([
    { id: "FILE-001", name: "especificacion_personal_os.md", tag: "Doc", size: "14.2 KB", date: "2026-06-07 14:10", content: "Detalles del sistema Supernatural OS." },
    { id: "FILE-002", name: "matriz_costos_proveedores.json", tag: "Data", size: "4.5 KB", date: "2026-06-07 14:15", content: "Comparativa Asiátia Optronics y Logística Europea." },
    { id: "FILE-003", name: "auditoria_recepciones_quimica.csv", tag: "Data", size: "48.1 KB", date: "2026-06-07 14:32", content: "Auditoría de almacén sur." },
    { id: "FILE-004", name: "blueprint_interfaz_supernatural.png", tag: "Media", size: "1.2 MB", date: "2026-06-07 13:00" },
    { id: "FILE-005", name: "modulo_sistema_ocr.ts", tag: "System", size: "8.9 KB", date: "2026-06-07 12:45", content: "Llamadas a servidor Express y Gemini 3.5 API." }
  ]);
  const [newFileName, setNewFileName] = useState<string>('');
  const [newFileTag, setNewFileTag] = useState<'Doc' | 'Data' | 'Media' | 'System'>('Doc');

  // Triggering Sound selection
  const handleSelectTrack = (trackId: string) => {
    setConfig(prev => ({ ...prev, audioLoop: trackId }));
    onLogMessage('info', `Pista de audio ambiental actualizada: ${trackId.toUpperCase()}`);
  };

  // Preset Background images selection
  const handleSelectBgPreset = (url: string) => {
    setConfig(prev => ({ ...prev, backgroundImage: url }));
    onLogMessage('info', `Fondo de pantalla personalizado actualizado.`);
  };

  // OCR file handler
  const handleOcrFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrImageName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setOcrBase64(reader.result as string);
      onLogMessage('info', `Imagen cargada para OCR: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
    };
    reader.readAsDataURL(file);
  };

  // Perform Gemini-driven OCR extraction
  const handleTriggerOcr = async () => {
    if (!ocrBase64) {
      onLogMessage('err', "Fallo en OCR: No hay imagen cargada en el búfer.");
      return;
    }

    setIsOcrAnalyzing(true);
    setOcrText('');
    onLogMessage('info', "Iniciando análisis forense OCR con Gemini 3.5-Flash...");

    try {
      const response = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: ocrBase64,
          mimeType: ocrBase64.split(';')[0].split(':')[1] || "image/jpeg"
        })
      });

      const data = await response.json();
      if (data.success) {
        setOcrText(data.text);
        onLogMessage('ok', `OCR completado con éxito. Extracción de caracteres finalizada.`);
      } else {
        throw new Error(data.error || "Ocurrió un error inesperado.");
      }
    } catch (err: any) {
      console.error(err);
      onLogMessage('err', `Error en canal OCR: ${err.message || 'Fallo de red'}`);
      setOcrText(`Error de conexión con el servidor de IA.\n\nFallo: ${err.message}`);
    } finally {
      setIsOcrAnalyzing(false);
    }
  };

  // Copy OCR result helper
  const handleCopyOcrText = () => {
    if (!ocrText) return;
    navigator.clipboard.writeText(ocrText);
    setOcrCopied(true);
    onLogMessage('ok', "Texto OCR copiado al portapapeles.");
    setTimeout(() => setOcrCopied(false), 2000);
  };

  // Send AI Co-work chat message
  const handleSendCoWorkMsg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserMsg.trim()) return;

    const userTime = new Date().toTimeString().split(' ')[0].substring(0, 5);
    const updatedChat = [...aiChatMessages, { sender: 'user' as const, text: currentUserMsg, time: userTime }];
    setAiChatMessages(updatedChat);
    const sentMsg = currentUserMsg;
    setCurrentUserMsg('');
    setIsAiResponding(true);
    onLogMessage('info', `Solicitud de co-work enviada a Codex: "${sentMsg.substring(0, 30)}..."`);

    try {
      // Inline intelligent response simulating SOTA partner work
      setTimeout(() => {
        const timestamp = new Date().toTimeString().split(' ')[0].substring(0, 5);
        let responsePhrase = "";
        
        const lower = sentMsg.toLowerCase();
        if (lower.includes("ocr") || lower.includes("imagen")) {
          responsePhrase = "Entendido. He optimizado el pipeline de extracción OCR. Puedes arrastrar cualquier ticket, imagen de almacén o factura a la sección de la izquierda y la procesaré usando Gemini 3.5 en milisegundos.";
        } else if (lower.includes("producto") || lower.includes("sku") || lower.includes("variante")) {
          responsePhrase = "De acuerdo. Analizando la estructura de productos... Recuerda que puedes gestionar todos tus SKUs y variantes de inventario en la pestaña 'Operaciones', incluyendo su stock en Bodegas.";
        } else if (lower.includes("linear") || lower.includes("proyecto") || lower.includes("meta")) {
          responsePhrase = "Excelente. El equipo Linear 'Personal_Os' tiene metas de alta fidelidad. Ya configuramos tres módulos con goals específicos en español. Recomiendo priorizar el módulo de Inventario Industrial.";
        } else {
          responsePhrase = `Para apoyar tu borrador, propongo agregar la siguiente nota: 'La integración SOTA de Personal OS busca optimizar tiempos de traslado y automatizar alertas de inventario'. ¿Te gustaría que redacte un resumen de proveedores para integrarlo al documento?`;
        }

        setAiChatMessages(prev => [...prev, { sender: 'assistant', text: responsePhrase, time: timestamp }]);
        setIsAiResponding(false);
        onLogMessage('ok', "Codex Co-worker retornó retroalimentación estratégica.");
      }, 1500);
    } catch (error) {
      setIsAiResponding(false);
    }
  };

  // Vitaminized File Creator
  const handleCreateFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    const cleanName = newFileName.toLowerCase().replace(/\s+/g, '_');
    const enrichedName = cleanName.includes('.') ? cleanName : `${cleanName}.txt`;
    
    const newFileObj = {
      id: `FILE-${Math.floor(Math.random() * 899 + 100)}`,
      name: enrichedName,
      tag: newFileTag,
      size: "1.2 KB",
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      content: `# ${newFileName}\nCreado en canal de co-working Personal OS.`
    };

    setExplorerFiles(prev => [newFileObj, ...prev]);
    setNewFileName('');
    onLogMessage('ok', `Archivo registrado en explorador: ${enrichedName}`);
  };

  // Delete archive from explorer list
  const handleDeleteFile = (id: string, name: string) => {
    setExplorerFiles(prev => prev.filter(f => f.id !== id));
    onLogMessage('warn', `Archivo purgado del explorador de Personal_Os: ${name}`);
  };

  // Filter & Search computations
  const filteredFiles = explorerFiles.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag === 'all' || f.tag === selectedTag;
    return matchesSearch && matchesTag;
  });

  return (
    <div id="personal-os-wrapper" className="flex-1 p-6 md:p-8 overflow-y-auto z-10 custom-scrollbar select-none text-on-surface">
      <div className="flex flex-col gap-6">
        
        {/* FILA SUPERIOR: OCR e Inteligencia Co-work de Codex */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* SECCIÓN OCR DE EXTRACCIÓN DE TEXTO REAL CON GEMINI 3.5 */}
          <div className="bg-carbon/25 border border-graphite/45 backdrop-blur-md rounded-xl p-5 flex flex-col gap-4">
            <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-[#FF007F] flex items-center gap-2">
              <Monitor className="w-4 h-4 text-signal-magenta" />
              Reconocimiento Óptico OCR (Impulsado por Gemini 3.5)
            </h2>
            <p className="text-[10px] text-slate leading-relaxed">
              Sube o arrastra cualquier ticket de proveedor, hoja de auditoría o imagen con texto. Nuestro motor SOTA analizará visualmente el archivo extrayendo de inmediato los caracteres alfanuméricos.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Cargador & Dropper */}
              <div className="flex flex-col gap-3">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-graphite/80 hover:border-signal-magenta/50 bg-void/60 hover:bg-[#131826]/20 rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[160px] relative group overflow-hidden"
                >
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleOcrFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  
                  {ocrBase64 ? (
                    <div className="absolute inset-0 p-2 flex flex-col items-center justify-center bg-void/90">
                      <img 
                        src={ocrBase64} 
                        alt="Cargado para OCR" 
                        className="max-h-24 w-auto rounded object-contain border border-graphite"
                        referrerPolicy="no-referrer"
                      />
                      <span className="text-[9px] font-mono text-ash mt-2 truncate w-full text-center">
                        {ocrImageName}
                      </span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-slate group-hover:text-signal-magenta transition-colors mb-2" />
                      <span className="text-[11px] text-bone font-mono leading-none">Arrastrar o Clic para cargar</span>
                      <span className="text-[9px] text-[#5A6380] mt-1.5 uppercase">JPG, PNG, WEBP (MÁX.10MB)</span>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleTriggerOcr}
                  disabled={!ocrBase64 || isOcrAnalyzing}
                  className="w-full py-2.5 bg-gradient-to-r from-signal-magenta to-[#B5007D] hover:from-signal-magenta/90 hover:to-[#B5007D]/95 text-on-primary font-bold font-mono text-xs uppercase tracking-wider rounded-lg select-pointer disabled:opacity-40 select-none transition-all flex items-center justify-center gap-1.5"
                >
                  {isOcrAnalyzing ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-void border-t-transparent animate-spin rounded-full"></span>
                      Procesando con IA...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Escanear & Extraer Texto
                    </>
                  )}
                </button>
              </div>

              {/* Resultado Alfanumérico */}
              <div className="flex flex-col gap-2 relative bg-void/60 border border-graphite/40 rounded-xl p-4 min-h-[200px]">
                
                {/* Laser scan animation overlay */}
                {isOcrAnalyzing && (
                  <div className="absolute left-0 right-0 h-0.5 bg-signal-magenta animate-bounce" style={{ top: '20%' }} />
                )}

                <div className="flex justify-between items-center border-b border-graphite/30 pb-2">
                  <span className="font-mono text-[9px] text-slate uppercase">Resultado Forense</span>
                  
                  {ocrText && (
                    <button
                      onClick={handleCopyOcrText}
                      className="text-[10px] font-mono text-signal-cyan hover:text-bone transition-colors flex items-center gap-1"
                    >
                      {ocrCopied ? <Check className="w-3 h-3 text-signal-lime" /> : <Copy className="w-3 h-3" />}
                      {ocrCopied ? 'Copiado!' : 'Copiar'}
                    </button>
                  )}
                </div>

                {isOcrAnalyzing ? (
                  <div className="flex-1 flex flex-col justify-center items-center py-8">
                    <span className="font-mono text-[10px] text-signal-magenta text-glow-magenta animate-pulse">DESENCRIPTANDO MATRIZ DE PÍXELES...</span>
                    <span className="text-[9px] text-slate uppercase mt-1">Llamando a gemini-3.5-flash</span>
                  </div>
                ) : ocrText ? (
                  <div className="flex-1 overflow-y-auto max-h-36 custom-scrollbar text-[11px] font-mono text-bone leading-relaxed whitespace-pre-wrap select-text">
                    {ocrText}
                  </div>
                ) : (
                  <div className="flex-1 flex justify-center items-center text-center text-slate font-mono text-[10px]">
                    ESPERANDO QUE SE INICIE EL ANÁLISIS
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* CODEX TEXT CANVAS & AI PARTNER CO-WORK */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Borrador interactivo (Documento) */}
            <div className="bg-carbon/25 border border-graphite/45 backdrop-blur-md rounded-xl p-5 flex flex-col gap-3">
              <div className="flex justify-between items-center border-b border-graphite/30 pb-2">
                <span className="font-mono text-[10px] text-[#C6FF3D] font-bold flex items-center gap-1 px-1">
                  <FileText className="w-3.5 h-3.5 text-signal-lime" />
                  CODEX CANVAS EDITABLE
                </span>
                <span className="text-[9px] text-slate font-mono">Borrador de Trabajo</span>
              </div>
              
              <textarea
                value={colaborativeDraft}
                onChange={(e) => setColaborativeDraft(e.target.value)}
                className="w-full flex-1 min-h-[220px] bg-[#04060A]/60 text-bone p-3 rounded-lg border border-graphite focus:border-signal-lime outline-none font-body text-xs leading-relaxed resize-none custom-scrollbar"
              />
            </div>

            {/* AI Partner Chat Panel */}
            <div className="bg-carbon/25 border border-graphite/45 backdrop-blur-md rounded-xl p-5 flex flex-col gap-3">
              <div className="flex justify-between items-center border-b border-graphite/30 pb-2">
                <span className="font-mono text-[10px] text-signal-cyan font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  PERSONAL OS CO-WORKER
                </span>
                <span className="text-[9px] text-signal-lime font-mono">En Línea</span>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 h-36 overflow-y-auto flex flex-col gap-3 pr-1 custom-scrollbar text-[11px] leading-relaxed">
                {aiChatMessages.map((msg, idx) => {
                  const isAsst = msg.sender === 'assistant';
                  return (
                    <div 
                      key={idx} 
                      className={`max-w-[85%] rounded px-3 py-2 border flex flex-col gap-1 ${
                        isAsst 
                          ? 'border-graphite/50 bg-[#131826]/40 text-bone self-start' 
                          : 'border-signal-cyan/20 bg-signal-cyan/5 text-bone self-end'
                      }`}
                    >
                      <p className="font-body text-[11px]">{msg.text}</p>
                      <span className="text-[8px] font-mono text-slate text-right block">{msg.time}</span>
                    </div>
                  );
                })}
                {isAiResponding && (
                  <div className="p-2 border border-graphite/30 bg-[#131826]/10 text-slate font-mono text-[9px] self-start animate-pulse uppercase rounded">
                    Codex reflexionando...
                  </div>
                )}
              </div>

              {/* Simple Input Form */}
              <form onSubmit={handleSendCoWorkMsg} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Instrucción de código, consulta OCR o consulta..."
                  value={currentUserMsg}
                  onChange={(e) => setCurrentUserMsg(e.target.value)}
                  className="flex-1 bg-[#04060A] border border-graphite text-xs p-2 text-bone rounded outline-none focus:border-signal-cyan"
                />
                <button
                  type="submit"
                  className="px-3 bg-signal-cyan hover:bg-signal-cyan/90 text-void font-bold font-mono text-xs uppercase rounded transition-colors"
                >
                  Enviar
                </button>
              </form>
            </div>

          </div>

        </div>

        {/* EXPLORADOR DE ARCHIVOS VITAMINADO */}
        <div className="bg-carbon/25 border border-graphite/45 backdrop-blur-md rounded-xl p-5 flex flex-col gap-4">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-graphite/30 pb-3">
              <div>
                <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-[#00F0FF] flex items-center gap-2">
                  <Files className="w-4 h-4 text-signal-cyan" />
                  Explorador de Archivos Vitaminado
                </h2>
                <p className="text-[10px] text-slate leading-none mt-1">
                  Matriz de almacenamiento local y filtros dinámicos.
                </p>
              </div>

              {/* Filtrado de Archivos por Tag */}
              <div className="flex gap-1.5 flex-wrap">
                {(['all', 'Doc', 'Data', 'Media', 'System'] as const).map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      setSelectedTag(tag);
                      onLogMessage('info', `Filtro de explorador: ${tag.toUpperCase()}`);
                    }}
                    className={`px-2.5 py-1 font-mono text-[10px] rounded transition-all lowercase border ${
                      selectedTag === tag 
                        ? 'bg-[#00F0FF]/15 text-signal-cyan border-signal-cyan/30 font-bold' 
                        : 'bg-void/40 text-slate border-graphite hover:text-bone'
                    }`}
                  >
                    {tag === 'all' ? 'todos' : tag.toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Buscador de Archivos integral */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative md:col-span-2">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate" />
                <input 
                  type="text" 
                  placeholder="Buscar archivo... (Ej: factura, modulo_sistema)" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#04060A] border border-graphite rounded pl-9 pr-3 py-1.5 text-xs text-bone outline-none focus:border-signal-cyan"
                />
              </div>

              {/* Registro Rápido de Archivo de Texto */}
              <form onSubmit={handleCreateFile} className="flex gap-1.5">
                <input 
                  type="text" 
                  placeholder="Nuevo_Fichero" 
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className="flex-1 bg-[#04060A] border border-graphite rounded px-2.5 py-1.5 text-xs text-bone outline-none"
                />
                <select
                  value={newFileTag}
                  onChange={(e: any) => setNewFileTag(e.target.value)}
                  className="bg-[#04060A] border border-graphite text-[10px] text-bone rounded font-mono px-1 border-r"
                >
                  <option value="Doc">Doc</option>
                  <option value="Data">Data</option>
                  <option value="Media">Media</option>
                  <option value="System">Sys</option>
                </select>
                <button
                  type="submit"
                  className="px-2.5 bg-signal-cyan text-void rounded font-mono text-xs font-bold"
                >
                  +
                </button>
              </form>
            </div>

            {/* File List Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredFiles.map((file) => {
                
                const getTagBadgeColor = (tag: string) => {
                  switch (tag) {
                    case 'Doc': return 'bg-[#00F0FF]/10 text-signal-cyan border-signal-cyan/20';
                    case 'Data': return 'bg-[#C6FF3D]/10 text-signal-lime border-signal-lime/20';
                    case 'Media': return 'bg-[#FF2E9A]/10 text-signal-magenta border-signal-magenta/20';
                    default: return 'bg-[#FFB400]/10 text-signal-amber border-signal-amber/20';
                  }
                };

                return (
                  <div
                    key={file.id}
                    className="group select-text p-3 border border-graphite/40 bg-void/40 rounded-lg flex flex-col gap-2 relative hover:border-graphite/90 transition-all"
                  >
                    <div className="flex justify-between items-center">
                      <span className={`text-[9px] font-mono border px-1.5 py-0.5 rounded uppercase font-semibold ${getTagBadgeColor(file.tag)}`}>
                        {file.tag}
                      </span>
                      <span className="text-[9px] font-mono text-slate">{file.size}</span>
                    </div>

                    <div className="font-body text-[11px] font-bold text-bone truncate group-hover:text-signal-cyan transition-colors" title={file.name}>
                      {file.name}
                    </div>

                    <div className="flex justify-between items-center text-[8px] font-mono text-slate border-t border-graphite/20 pt-1.5 mt-1 select-none">
                      <span>{file.date}</span>
                      
                      <button
                        onClick={() => handleDeleteFile(file.id, file.name)}
                        className="text-slate hover:text-signal-magenta select-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Borrar archivo"
                      >
                        Purgar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

        </div>

      </div>
  );
}
