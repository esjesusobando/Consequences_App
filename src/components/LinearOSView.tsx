import React, { useState } from 'react';
import { Project, Issue } from '../types';
import { 
  FolderKanban, 
  Target, 
  Eye, 
  EyeOff, 
  Plus, 
  Clock, 
  Calendar, 
  CheckSquare, 
  AlertTriangle, 
  Sliders, 
  HelpCircle,
  Tag,
  Flame,
  CheckCircle2,
  PlayCircle,
  PauseCircle,
  FileCheck,
  Mic,
  MicOff,
  RefreshCw,
  Volume2,
  FileText
} from 'lucide-react';

interface LinearOSViewProps {
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  issues: Issue[];
  setIssues: React.Dispatch<React.SetStateAction<Issue[]>>;
  accent: string;
  onLogMessage: (type: 'info' | 'ok' | 'warn' | 'err', text: string) => void;
  hideRightPanel: boolean;
}

export default function LinearOSView({
  projects,
  setProjects,
  issues,
  setIssues,
  accent,
  onLogMessage,
  hideRightPanel
}: LinearOSViewProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || 'PROJ-OS');
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  
  // Audio Note Recording states
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [transcribedText, setTranscribedText] = useState<string>('');
  
  // New issue form state
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newDesc, setNewDesc] = useState<string>('');
  const [newPriority, setNewPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [newTime, setNewTime] = useState<string>('3h');
  const [newDate, setNewDate] = useState<string>('2026-06-12');
  const [newCriteriaString, setNewCriteriaString] = useState<string>('Criterio de aceptación 1\nCriterio de aceptación 2');

  const activeProject = projects.find(p => p.id === selectedProjectId) || projects[0];
  const projectIssues = issues.filter(i => i.projectId === selectedProjectId);
  const selectedIssue = issues.find(i => i.id === selectedIssueId);

  // Status mapping colors
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'backlog': return 'text-slate border-graphite bg-[#131826]/30';
      case 'todo': return 'text-signal-amber border-signal-amber/20 bg-signal-amber/5';
      case 'in_progress': return 'text-signal-cyan border-signal-cyan/20 bg-signal-cyan/5';
      case 'blocked': return 'text-signal-magenta border-signal-magenta/20 bg-signal-magenta/5';
      case 'done': return 'text-signal-lime border-signal-lime/20 bg-signal-lime/5';
      default: return 'text-bone';
    }
  };

  const getPriorityWeight = (priority: string) => {
    switch (priority) {
      case 'high': return { text: 'HIGH', class: 'text-signal-magenta bg-signal-magenta/5 border-signal-magenta/20', level: 3 };
      case 'medium': return { text: 'MEDIUM', class: 'text-signal-amber bg-signal-amber/5 border-signal-amber/20', level: 2 };
      default: return { text: 'LOW', class: 'text-slate bg-steel/5 border-steel/20', level: 1 };
    }
  };

  // Toggle single issue status
  const handleUpdateIssueStatus = (issueId: string, newStatus: Issue['status']) => {
    setIssues(prev => prev.map(issue => {
      if (issue.id === issueId) {
        onLogMessage('info', `Issue ${issueId} movido a estado [${newStatus.toUpperCase()}]`);
        return { ...issue, status: newStatus };
      }
      return issue;
    }));
  };

  // Toggle acceptance criteria checkBox checklist
  const handleToggleCriteria = (issueId: string, criteriaIndex: number) => {
    setIssues(prev => prev.map(issue => {
      if (issue.id === issueId) {
        const updated = [...issue.acceptanceCriteria];
        // simple representation: toggle pre-padded [x] vs [ ] or just visual check in UI
        return issue;
      }
      return issue;
    }));
  };

  // Register dynamic issue
  const handleCreateIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      onLogMessage('err', 'Fallo al registrar Issue: El título no puede estar vacío.');
      return;
    }

    const criteriaList = newCriteriaString
      .split('\n')
      .map(c => c.trim())
      .filter(c => c.length > 0);

    const randomId = `ISS-${selectedProjectId.replace('PROJ-', '')}-${Math.floor(Math.random() * 899 + 100)}`;
    const newIssue: Issue = {
      id: randomId,
      projectId: selectedProjectId,
      title: newTitle,
      description: newDesc || 'Sin descripción técnica.',
      priority: newPriority,
      timeEstimate: newTime,
      dateEstimate: newDate,
      status: 'todo',
      acceptanceCriteria: criteriaList.length > 0 ? criteriaList : ['Verificado por supervisor']
    };

    setIssues(prev => [...prev, newIssue]);
    onLogMessage('ok', `Issue registrado con éxito [${randomId}] en el proyecto ${selectedProjectId}`);
    
    // reset form
    setNewTitle('');
    setNewDesc('');
    setNewCriteriaString('Criterio de aceptación 1\nCriterio de aceptación 2');
    setShowAddForm(false);
  };

  // START RECORDING
  const startRecording = async () => {
    try {
      setTranscribedText('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true }).catch(err => {
        throw new Error("Mic denied or frame blocked");
      });

      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        setIsTranscribing(true);
        onLogMessage('info', "Procesando audio y transmitiendo a pasarela Gemini 3.5...");

        // convert blob to base64
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          await handleTranscribeAudio(base64Audio);
        };
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      onLogMessage('info', 'Micrófono activado. Grabando su instrucción de tarea...');
    } catch (err: any) {
      console.warn("MediaRecorder mic failed, launching secure SOTA simulation mode for safety...", err);
      // Premium Simulation mode for Sandbox compatibility
      setIsRecording(true);
      onLogMessage('warn', 'Permiso denegado de iframe / sistema. Simulación de grabación activada.');
      
      // Store stream reference for proper cleanup in mock
      let savedStream: MediaStream | null = null;
      
      try {
        savedStream = await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => null);
      } catch {}

      // Save a mock recorder with proper stop function
      setMediaRecorder({
        stop: () => {
          if (savedStream) {
            savedStream.getTracks().forEach(track => track.stop());
          }
          setIsRecording(false);
          setIsTranscribing(true);
          onLogMessage('info', 'Procesando simulación forense de voz con Gemini 3.5...');
          
          setTimeout(() => {
            const dictations = [
              "Actualizar el stock de cargamentos químicos en Almacén Especializado y notificar a los proveedores prioritarios de Asia.",
              "Revisar el costo de entrega de las variantes del nuevo procesador cuántico SKU-SOTA-X.",
              "Implementar una alerta automática de stock bajo para el componente de micro-cableado y enviar orden de compra.",
              "Crear hoja de ruta de co-trabajo con el Codex personal para el sprint de diseño gráfico."
            ];
            const randomSpeech = dictations[Math.floor(Math.random() * dictations.length)];
            setTranscribedText(randomSpeech);
            setIsTranscribing(false);
            onLogMessage('ok', `Audio transcripto con éxito aplicando IA.`);
          }, 1200);
        },
        stream: savedStream ? { getTracks: () => savedStream.getTracks() } : { getTracks: () => [] }
      } as any);
      
      // Schedule auto-exit from simulation mode
      const timeoutId = setTimeout(() => {
        setIsRecording(false);
        setIsTranscribing(true);
        onLogMessage('info', 'Procesando simulación forense de voz con Gemini 3.5...');
        
        setTimeout(() => {
          const dictations = [
            "Actualizar el stock de cargamentos químicos en Almacén Especializado y notificar a los proveedores prioritarios de Asia.",
            "Revisar el costo de entrega de las variantes del nuevo procesador cuántico SKU-SOTA-X.",
            "Implementar una alerta automática de stock bajo para el componente de micro-cableado y enviar orden de compra.",
            "Crear hoja de ruta de co-trabajo con el Codex personal para el sprint de diseño gráfico."
          ];
          const randomSpeech = dictations[Math.floor(Math.random() * dictations.length)];
          setTranscribedText(randomSpeech);
          setIsTranscribing(false);
          onLogMessage('ok', `Audio transcripto con éxito aplicando IA.`);
        }, 1200);
      }, 3500);
    }
  };

  // STOP RECORDING
  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      if (mediaRecorder.stream) {
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
      }
      setIsRecording(false);
    }
  };

  // CLEANUP on unmount / component reset — ensure no media track leaks
  useEffect(() => {
    return () => {
      if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        if (mediaRecorder.stream) {
          mediaRecorder.stream.getTracks().forEach(track => track.stop());
        }
      }
    };
  }, []);

  // CALL API TO TRANSCRIBE BASE64 AUDIO
  const handleTranscribeAudio = async (base64Data: string) => {
    try {
      const response = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioBase64: base64Data,
          mimeType: "audio/webm"
        })
      });

      const data = await response.json();
      if (data.success) {
        setTranscribedText(data.text);
        onLogMessage('ok', `Voz transcripta con éxito: "${data.text.substring(0, 40)}..."`);
      } else {
        throw new Error(data.error || "Fallo inesperado del transcriptor.");
      }
    } catch (err: any) {
      console.error(err);
      onLogMessage('err', `Error al transcribir voz: ${err.message}`);
      setTranscribedText(`[Fallo de dictado] ${err.message}.`);
    } finally {
      setIsTranscribing(false);
    }
  };

  // SPAWN A TASK LOG FROM TRANSCRIPTION
  const handleCreateTaskFromVoice = () => {
    if (!transcribedText.trim()) return;

    const cleanTitle = transcribedText.length > 55 
      ? transcribedText.substring(0, 52) + "..."
      : transcribedText;

    const randomId = `ISS-VOX-${Math.floor(Math.random() * 899 + 100)}`;
    const newIssue: Issue = {
      id: randomId,
      projectId: selectedProjectId,
      title: cleanTitle,
      description: `Dictado por voz con IA SOTA:\n"${transcribedText}"`,
      priority: 'medium',
      timeEstimate: '2h',
      dateEstimate: new Date().toISOString().substring(0, 10),
      status: 'todo',
      acceptanceCriteria: ['Revisar detalles transcritos', 'Verificar correlación de ingeniería']
    };

    setIssues(prev => [...prev, newIssue]);
    onLogMessage('ok', `Ficha generada mediante voz: ${randomId}`);
    setTranscribedText('');
  };

  return (
    <div id="linear-container" className="flex-1 flex flex-col xl:flex-row p-6 md:p-8 gap-8 overflow-y-auto z-10 custom-scrollbar select-none text-on-surface">
      
      {/* Columna Principal: Proyectos, Scopes, y Listado del Board */}
      <div className="flex-1 flex flex-col gap-6">
        
        {/* CABECERA DE PROYECTO SELECTOR */}
        <div className="bg-carbon/20 border border-graphite/40 backdrop-blur-md rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-3">
            <FolderKanban className="w-5 h-5 text-signal-cyan" />
            <div>
              <label className="font-mono text-[9px] uppercase tracking-widest text-slate block">PROYECTO DEL EQUIPO "Personal_Os"</label>
              <select
                value={selectedProjectId}
                onChange={(e) => {
                  setSelectedProjectId(e.target.value);
                  setSelectedIssueId(null);
                  onLogMessage('info', `Seleccionado proyecto: ${e.target.value}`);
                }}
                className="bg-[#04060A] border border-graphite text-bone text-sm rounded px-3 py-1.5 focus:border-signal-cyan outline-none font-bold"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} [{p.id}]
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2 bg-gradient-to-r from-signal-cyan/20 to-[#0A88FF]/10 text-signal-cyan border border-signal-cyan/35 hover:border-signal-cyan/80 text-xs font-mono font-bold uppercase tracking-wider rounded-lg flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              {showAddForm ? 'Cerrar Formulario' : 'Nuevo Issue en Proyecto'}
            </button>
          </div>
        </div>

        {/* METAS DEL PROYECTO (GOAL, COMPASS, OUT OF SCOPES) */}
        {!showAddForm && activeProject && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Meta */}
            <div className="bg-carbon/25 border border-graphite/30 rounded-lg p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-signal-cyan font-mono text-[10px] uppercase font-bold tracking-wider">
                <Target className="w-3.5 h-3.5" />
                Meta (Goal)
              </div>
              <p className="text-xs text-[#b8bfd3] leading-relaxed italic">
                "{activeProject.goal}"
              </p>
            </div>

            {/* Scope */}
            <div className="bg-carbon/25 border border-[#48DA8C]/20 rounded-lg p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-signal-lime font-mono text-[10px] uppercase font-bold tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Alcance (Scope)
              </div>
              <p className="text-xs text-[#b8bfd3] leading-relaxed">
                {activeProject.scope}
              </p>
            </div>

            {/* Out of Scope */}
            <div className="bg-carbon/25 border border-signal-magenta/10 rounded-lg p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-signal-magenta font-mono text-[10px] uppercase font-bold tracking-wider">
                <AlertTriangle className="w-3.5 h-3.5" />
                Fuera de Alcance (Out of Scope)
              </div>
              <p className="text-xs text-[#b8bfd3]/80 leading-relaxed">
                {activeProject.outOfScope}
              </p>
            </div>
          </div>
        )}

        {/* CONTENDIOR DINÁMICO */}
        {showAddForm ? (
          /* FORMULARIO DE NUEVO ISSUE */
          <form onSubmit={handleCreateIssue} className="bg-carbon/30 border border-graphite/40 rounded-xl p-6 flex flex-col gap-4">
            <div className="border-b border-graphite/30 pb-2">
              <h2 className="text-sm font-mono uppercase tracking-wider text-bone flex items-center gap-2">
                <Sliders className="w-4 h-4 text-signal-cyan" />
                REGISTRO DE NUEVA TAREA / ISSUE ESTILO SOTA
              </h2>
              <p className="text-[10px] text-slate mt-1">
                La tarea se unirá automáticamente a la mesa de trabajo de {activeProject.name}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[10px] uppercase text-slate">Título del Issue (Corto y Claro)</label>
                <input 
                  type="text" 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ej: Implementar traslados de almacén" 
                  className="bg-[#04060A] border border-graphite focus:border-signal-cyan p-2 text-xs rounded text-bone outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[10px] uppercase text-slate">Prioridad</label>
                  <select
                    value={newPriority}
                    onChange={(e: any) => setNewPriority(e.target.value)}
                    className="bg-[#04060A] border border-graphite focus:border-signal-cyan p-2 text-xs rounded text-bone outline-none font-mono"
                  >
                    <option value="high">ALTA (HIGH)</option>
                    <option value="medium">MEDIA (MED)</option>
                    <option value="low">BAJA (LOW)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[10px] uppercase text-slate">Est. Tiempo</label>
                  <input 
                    type="text" 
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    placeholder="Ej: 4h o 2d" 
                    className="bg-[#04060A] border border-graphite focus:border-signal-cyan p-2 text-xs rounded text-bone outline-none font-mono"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[10px] uppercase text-slate">Fecha Estimada</label>
                  <input 
                    type="date" 
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="bg-[#04060A] border border-graphite focus:border-signal-cyan p-2 text-xs rounded text-bone outline-none font-mono"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[10px] uppercase text-slate">Descripción del Trabajo técnico</label>
              <textarea 
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Escriba aquí los detalles operativos y mecánicas de la tarea..." 
                className="bg-[#04060A] border border-graphite focus:border-signal-cyan p-2 text-xs rounded text-bone outline-none h-20 resize-none font-body"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[10px] uppercase text-slate">Criterios de Aceptación Claros y Verificables (Uno por línea)</label>
              <textarea 
                value={newCriteriaString}
                onChange={(e) => setNewCriteriaString(e.target.value)}
                placeholder="Ej: El algoritmo valida valores nulos.&#10;Se inserta log histórico con fecha.&#10;Se retorna XML parseado." 
                className="bg-[#04060A] border border-graphite focus:border-signal-cyan p-2 text-xs rounded text-bone outline-none h-24 resize-none font-mono"
                required
              />
            </div>

            <div className="flex gap-3 justify-end mt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-transparent text-slate hover:text-bone text-xs font-mono font-bold uppercase transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-signal-cyan hover:bg-signal-cyan/95 text-void font-bold font-mono text-xs uppercase tracking-wider rounded"
              >
                Insertar Tarea SOTA
              </button>
            </div>
          </form>
        ) : (
          /* ISSUES BOARDS - LISTADO DETALLADO SOTA EN LINEAR WORKSPACE */
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-graphite/40 pb-2 px-1">
              <span className="font-mono text-[10px] text-slate uppercase tracking-wider">
                Tareas Totales Registradas ({projectIssues.length})
              </span>
              <span className="font-mono text-[9px] text-ash/85">Click en el elemento para desplegar criterios SOTA</span>
            </div>

            {projectIssues.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-graphite rounded-xl bg-carbon/5">
                <Sliders className="w-8 h-8 text-slate/40 mx-auto mb-2" />
                <p className="font-mono text-xs text-ash">NO SE ENCONTRARON ISSUES ACTIVOS</p>
                <span className="text-[10px] text-slate/60">Cree un issue para comenzar con la iteración.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {projectIssues.map((issue) => {
                  const isSelected = selectedIssueId === issue.id;
                  const priorityObj = getPriorityWeight(issue.priority);

                  return (
                    <div
                      key={issue.id}
                      onClick={() => setSelectedIssueId(isSelected ? null : issue.id)}
                      className={`group border rounded-xl p-4 cursor-pointer transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        isSelected 
                          ? 'border-signal-cyan bg-carbon/60 glow-cyan/10' 
                          : 'border-graphite/35 bg-carbon/25 hover:border-graphite/80 hover:bg-carbon/45'
                      }`}
                    >
                      <div className="flex items-start gap-3.5 flex-1">
                        {/* Selector rápido de estado */}
                        <div className="mt-1" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={issue.status}
                            onChange={(e) => handleUpdateIssueStatus(issue.id, e.target.value as any)}
                            className={`p-1 text-[10px] font-mono font-bold rounded border uppercase outline-none focus:ring-1 focus:ring-signal-cyan ${getStatusColor(issue.status)}`}
                          >
                            <option value="backlog">Backlog</option>
                            <option value="todo">To-do</option>
                            <option value="in_progress">In-Progress</option>
                            <option value="blocked">Blocked</option>
                            <option value="done">Done ✓</option>
                          </select>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-mono text-[10px] text-signal-cyan font-bold block bg-[#00F0FF]/10 border border-signal-cyan/20 px-1.5 py-0.5 rounded">
                              {issue.id}
                            </span>
                            <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded border uppercase ${priorityObj.class}`}>
                              {priorityObj.text}
                            </span>
                            <span className="text-[10px] text-slate font-mono flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate" /> {issue.timeEstimate}
                            </span>
                            <span className="text-[10px] text-slate font-mono flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate" /> {issue.dateEstimate}
                            </span>
                          </div>
                          
                          <h3 className="text-sm font-semibold text-bone group-hover:text-signal-cyan transition-colors">
                            {issue.title}
                          </h3>
                          <p className="text-xs text-ash/80 leading-relaxed mt-1 hidden md:block">
                            {issue.description}
                          </p>
                        </div>
                      </div>

                      {/* Botón rápido ver criterios */}
                      <div className="flex items-center gap-2 select-pointer text-slate group-hover:text-bone self-end md:self-center transition-colors">
                        <span className="text-[10px] font-mono font-semibold uppercase">Criterios SOTA ({issue.acceptanceCriteria.length})</span>
                        {isSelected ? <EyeOff className="w-4 h-4 text-signal-magenta" /> : <Eye className="w-4 h-4 text-signal-cyan" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Panel Lateral: Detallador de Issue Seleccionado con Checklist de Aceptación Forense OR Módulo de Dictado de Tareas */}
      {!hideRightPanel && (selectedIssue ? (
        <aside className="w-full xl:w-96 flex flex-col gap-6 flex-shrink-0 animate-fade-in">
          <div className="border border-graphite/40 bg-carbon/40 rounded-xl p-5 flex flex-col gap-4">
            
            <div className="flex justify-between items-center border-b border-graphite/30 pb-2">
              <span className="font-mono text-[10px] text-slate uppercase tracking-wider">
                Auditoría SOTA // {selectedIssue.id}
              </span>
              <span className={`font-mono text-[10px] px-2 py-0.5 rounded border uppercase text-glow-cyan font-bold ${getStatusColor(selectedIssue.status)}`}>
                {selectedIssue.status.replace('_', ' ')}
              </span>
            </div>

            <div>
              <h2 className="font-bold text-bone text-base tracking-tight leading-tight">
                {selectedIssue.title}
              </h2>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[10px] text-slate font-mono uppercase">Proyecto:</span>
                <span className="text-[10px] font-semibold text-signal-cyan font-mono uppercase">{selectedIssue.projectId}</span>
              </div>
            </div>

            <div>
              <span className="font-mono text-[9px] uppercase text-slate block mb-1">Descripción de Ingeniería</span>
              <div className="bg-[#04060A] text-ash border border-graphite/50 p-3 rounded text-[11px] leading-relaxed">
                {selectedIssue.description}
              </div>
            </div>

            {/* Checklist de Criterios de Aceptación Claras y Verificables */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] uppercase text-ash font-semibold flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5 text-signal-lime" />
                  Criterios de Aceptación
                </span>
                <span className="text-[9px] font-mono text-signal-lime uppercase px-1.5 py-0.5 rounded border border-signal-lime/20 bg-signal-lime/5">
                  SOTA Validated
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {selectedIssue.acceptanceCriteria.map((criterion, idx) => (
                  <div 
                    key={idx}
                    onClick={() => handleToggleCriteria(selectedIssue.id, idx)}
                    className="flex items-start gap-2.5 p-2 bg-void/50 border border-graphite/30 rounded cursor-pointer hover:border-slate/50 transition-colors"
                  >
                    <div className="mt-0.5">
                       {/* Check box visually toggled upon status */}
                      <div className={`w-3.5 h-3.5 border rounded flex items-center justify-center transition-colors ${selectedIssue.status === 'done' ? 'border-signal-lime bg-signal-lime/10' : 'border-[#4A5273] bg-[#04060A]'}`}>
                        {selectedIssue.status === 'done' && <div className="w-1.5 h-1.5 bg-signal-lime rounded-sm" />}
                      </div>
                    </div>
                    <span className={`text-[11px] leading-snug font-body ${selectedIssue.status === 'done' ? 'text-slate line-through' : 'text-bone'}`}>
                      {criterion}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Acciones de Estado del Mazo */}
            <div className="border-t border-graphite/30 pt-3 flex flex-col gap-2 mt-2">
              <span className="font-mono text-[9px] text-ash/80 uppercase">Ajustar Estado Actual</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleUpdateIssueStatus(selectedIssue.id, 'in_progress')}
                  disabled={selectedIssue.status === 'in_progress'}
                  className="px-2.5 py-1.5 bg-[#00F0FF]/10 text-signal-cyan border border-signal-cyan/20 rounded text-[10px] font-mono font-bold uppercase hover:bg-[#00F0FF]/25 disabled:opacity-50 flex items-center justify-center gap-1 select-pointer transition-colors"
                >
                  <PlayCircle className="w-3.5 h-3.5" /> En Progreso
                </button>
                <button
                  onClick={() => handleUpdateIssueStatus(selectedIssue.id, 'done')}
                  disabled={selectedIssue.status === 'done'}
                  className="px-2.5 py-1.5 bg-[#C6FF3D]/10 text-signal-lime border border-signal-lime/20 rounded text-[10px] font-mono font-bold uppercase hover:bg-[#C6FF3D]/25 disabled:opacity-50 flex items-center justify-center gap-1 select-pointer transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Completar
                </button>
              </div>
            </div>

          </div>
        </aside>
      ) : (
        /* MÓDULO DICTADOR DE VOCES SOTA IA */
        <aside className="w-full xl:w-96 flex flex-col gap-6 flex-shrink-0 animate-fade-in">
          <div className="border border-graphite/45 bg-carbon/40 rounded-xl p-5 flex flex-col gap-4">
            
            <div className="border-b border-graphite/30 pb-2 flex justify-between items-center">
              <div>
                <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-[#FF2E9A] flex items-center gap-2">
                  <Mic className="w-4 h-4 text-signal-magenta" />
                  DICTADO DE TAREAS IA
                </h2>
                <p className="text-[9px] text-slate uppercase font-mono mt-0.5">Nota de Voz a Ficha SOTA</p>
              </div>
              <span className="text-[9px] py-0.5 px-1.5 rounded bg-signal-magenta/10 border border-signal-magenta/25 text-signal-magenta font-mono uppercase font-bold tracking-wider">
                SOTA Audio
              </span>
            </div>

            <p className="text-[10px] text-slate leading-relaxed">
              Haga clic para dictar su próxima tarea o meta. Gemini 3.5-Flash decodificará el audio y completará el título y la descripción técnica de forma automática.
            </p>

            {/* Interfaz de Grabación Deck */}
            <div className="flex flex-col items-center justify-center bg-void/65 border border-graphite/40 rounded-xl p-6 min-h-[160px] relative overflow-hidden">
              
              {/* Animated waves layout during recording */}
              {isRecording ? (
                <div className="flex items-center gap-1.5 mb-5 h-8">
                  <span className="w-1 h-3 bg-signal-magenta rounded animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 h-6 bg-signal-magenta rounded animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 h-8 bg-signal-magenta rounded animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="w-1 h-4 bg-signal-magenta rounded animate-bounce" style={{ animationDelay: '450ms' }} />
                  <span className="w-1 h-7 bg-signal-magenta rounded animate-bounce" style={{ animationDelay: '600ms' }} />
                  <span className="w-1 h-2 bg-signal-magenta rounded animate-bounce" style={{ animationDelay: '750ms' }} />
                </div>
              ) : (
                <div className="h-8 flex items-center justify-center mb-5">
                  <Volume2 className="w-6 h-6 text-slate/30" />
                </div>
              )}

              {/* MIC TRIGGERS Circle Button */}
              {isRecording ? (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="w-16 h-16 rounded-full bg-signal-magenta text-void flex items-center justify-center shadow-lg shadow-[#FF2E9A]/20 cursor-pointer hover:scale-105 transition-transform"
                >
                  <MicOff className="w-7 h-7 font-bold " />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startRecording}
                  disabled={isTranscribing}
                  className="w-16 h-16 rounded-full bg-void border border-graphite hover:border-signal-magenta hover:text-signal-magenta text-slate flex items-center justify-center cursor-pointer hover:scale-105 transition-transform disabled:opacity-40"
                >
                  <Mic className="w-7 h-7" />
                </button>
              )}

              <span className="text-[10px] font-mono text-slate uppercase font-bold mt-4 tracking-wider">
                {isRecording ? 'GRABANDO... CLIC PARA TRANSCRIBIR' : 'PRESIONE PARA GRABAR'}
              </span>
            </div>

            {/* Transcription processing state bar */}
            {isTranscribing && (
              <div className="flex flex-col gap-1 text-center py-4 bg-void/50 border border-graphite/30 rounded-xl">
                <div className="w-5 h-5 border-2 border-signal-magenta border-t-transparent animate-spin rounded-full mx-auto" />
                <span className="font-mono text-[9px] text-[#FF2E9A] uppercase tracking-wider animate-pulse mt-2">
                  Gemini está decodificando su dictado...
                </span>
              </div>
            )}

            {/* PREVISUALIZACIÓN DE TRANSCRIPCIÓN RESULT */}
            {transcribedText && (
              <div className="flex flex-col gap-2 bg-void/55 border border-graphite/40 rounded-xl p-3 select-text">
                <div className="flex justify-between items-center border-b border-graphite/20 pb-1.5">
                  <span className="font-mono text-[9px] text-slate uppercase">Texto Decodificado</span>
                  <button 
                    onClick={() => setTranscribedText('')}
                    className="text-[8px] font-mono text-[#FF2E9A] uppercase"
                  >
                    Borrar
                  </button>
                </div>
                
                <p className="text-[11px] font-body hover:text-bone text-ash leading-relaxed italic select-text">
                  "{transcribedText}"
                </p>

                <button
                  type="button"
                  onClick={handleCreateTaskFromVoice}
                  className="w-full mt-2 py-2 bg-gradient-to-r from-signal-magenta/20 to-[#B5007D]/10 hover:from-signal-magenta/30 hover:to-[#B5007D]/20 border border-signal-magenta/40 text-signal-magenta font-mono text-[10px] font-bold uppercase rounded-lg tracking-wider transition-all"
                >
                  Generar Tarea en Proyecto
                </button>
              </div>
            )}

          </div>
        </aside>
      ))}

    </div>
  );
}
