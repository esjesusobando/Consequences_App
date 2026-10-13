import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipForward, Volume2, Radio, Disc } from 'lucide-react';
import { AccentColor } from '../types';

interface Track {
  num: string;
  title: string;
  subtitle: string;
  durationStr: string;
  durationSec: number;
}

export const PLAYABLE_TRACKS: Track[] = [
  { num: '01', title: 'Inter Tight — Episodio de Apertura', subtitle: 'BODY LG 18PT // BODY 16PT // BODY SM 14PT', durationStr: '32:00', durationSec: 32 * 60 },
  { num: '02', title: 'CONSEQUENCES — Signal Crossover', subtitle: 'Llaves cryptografics, passkeys or loon SM 14PT', durationStr: '47:00', durationSec: 47 * 60 },
  { num: '03', title: 'Arquitectura de Señales — Vol. III', subtitle: 'EP. 03 // 52 MIN // SEÑAL ACTIVA', durationStr: '52:10', durationSec: 52 * 60 + 10 },
];

interface WaveformPlayerProps {
  accent: AccentColor;
  activeTrackIndex: number;
  setActiveTrackIndex: (index: number) => void;
  onLogMessage: (type: 'info' | 'ok' | 'warn' | 'err', text: string) => void;
}

export default function WaveformPlayer({
  accent,
  activeTrackIndex,
  setActiveTrackIndex,
  onLogMessage,
}: WaveformPlayerProps) {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playProgress, setPlayProgress] = useState<number>(0.31); // Initial playback progress from the screenshot (approx 31%)
  const [volume, setVolume] = useState<number>(0.8);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  const currentTrack = PLAYABLE_TRACKS[activeTrackIndex] || PLAYABLE_TRACKS[1]; // default to consequences path

  // Map accents to high quality hexadecimal values for drawing on HTML5 Canvas
  const getAccentHex = () => {
    switch (accent) {
      case 'magenta': return '#FF2E9A';
      case 'lime': return '#C6FF3D';
      case 'amber': return '#FFB400';
      default: return '#00F0FF';
    }
  };

  // Generate a random-seeded sinusoidal waveform once for visual consistency
  const [waveAmplitudes, setWaveAmplitudes] = useState<number[]>([]);

  useEffect(() => {
    const counts = 120;
    const amps: number[] = [];
    for (let i = 0; i < counts; i++) {
      const base = Math.sin(i * 0.15) * 0.35 + Math.sin(i * 0.08) * 0.45 + Math.sin(i * 0.35) * 0.15;
      amps.push(0.12 + Math.abs(base) * 0.8 + Math.random() * 0.08);
    }
    setWaveAmplitudes(amps);
  }, [activeTrackIndex]);

  // Audio Playback simulation ticker
  useEffect(() => {
    let lastTime = performance.now();
    
    const tick = (now: number) => {
      if (isPlaying) {
        const delta = (now - lastTime) / 1000;
        const addProgress = delta / currentTrack.durationSec;
        setPlayProgress((prev) => {
          if (prev + addProgress >= 1) {
            onLogMessage('ok', `Finished playback of telemetry stream: ${currentTrack.title}`);
            setIsPlaying(false);
            return 0;
          }
          return prev + addProgress;
        });
      }
      lastTime = now;
      animationRef.current = requestAnimationFrame(tick);
    };

    animationRef.current = requestAnimationFrame(tick);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, currentTrack]);

  // Render the Canvas Waveform based on active state progress and colors
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || waveAmplitudes.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Support device pixel ratio scaling
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const w = rect.width;
    const h = rect.height;
    ctx.clearRect(0, 0, w, h);

    const barWidth = 2.5;
    const gap = 1.5;
    const totalSpacing = barWidth + gap;
    const totalBarsCount = Math.floor(w / totalSpacing);
    const midY = h / 2;

    const accentColor = getAccentHex();

    for (let i = 0; i < totalBarsCount; i++) {
      const amplitudeIndex = i % waveAmplitudes.length;
      const amplitude = waveAmplitudes[amplitudeIndex];
      // Compute responsive tallness
      const barHeight = amplitude * (h * 0.84);
      const x = i * totalSpacing;
      
      const barCompletionPct = i / totalBarsCount;

      // Draw Played path in bright accent, and unplayed path in cold steel grey
      if (barCompletionPct < playProgress) {
        ctx.fillStyle = accentColor;
        // Draw sutil shadow glow for active path
        ctx.shadowColor = accentColor;
        ctx.shadowBlur = 4;
      } else {
        ctx.fillStyle = '#2A3148';
        ctx.shadowBlur = 0;
      }

      ctx.fillRect(x, midY - barHeight / 2, barWidth, barHeight);
    }
  }, [waveAmplitudes, playProgress, accent]);

  // Seek Progress by clicking directly on the canvas container
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    setPlayProgress(pct);
    
    // Log seek to shell console
    const elapsedSecs = Math.floor(pct * currentTrack.durationSec);
    const m = Math.floor(elapsedSecs / 60);
    const s = elapsedSecs % 60;
    onLogMessage('info', `Seek signal position [${currentTrack.num}] to ${m}:${String(s).padStart(2, '0')}`);
  };

  const handleTogglePlay = () => {
    const nextState = !isPlaying;
    setIsPlaying(nextState);
    onLogMessage('info', nextState 
      ? `Started signal listener transmission: ${currentTrack.title}`
      : 'Suspended signal audio stream reception.'
    );
  };

  const handleNextTrack = () => {
    const nextIdx = (activeTrackIndex + 1) % PLAYABLE_TRACKS.length;
    setActiveTrackIndex(nextIdx);
    setPlayProgress(0);
    setIsPlaying(true);
    onLogMessage('ok', `Fidelity stream target modified to track [${PLAYABLE_TRACKS[nextIdx].num}]`);
  };

  // Convert current elapsed seconds back into a printable clock string
  const getElapsedString = () => {
    const totalSecs = Math.floor(playProgress * currentTrack.durationSec);
    const minStr = String(Math.floor(totalSecs / 60)).padStart(2, '0');
    const secStr = String(totalSecs % 60).padStart(2, '0');
    return `${minStr}:${secStr}`;
  };

  const getAccentColorsStyle = () => {
    switch (accent) {
      case 'magenta': return 'bg-signal-magenta text-void shadow-[0_0_12px_rgba(255,46,154,0.35)]';
      case 'lime': return 'bg-signal-lime text-void shadow-[0_0_12px_rgba(189,245,50,0.35)]';
      case 'amber': return 'bg-signal-amber text-void shadow-[0_0_12px_rgba(255,180,0,0.35)]';
      default: return 'bg-signal-cyan text-void shadow-[0_0_12px_rgba(0,240,255,0.35)]';
    }
  };

  return (
    <div className="bg-night border-t border-graphite/45 py-3 px-6 select-none flex flex-col md:flex-row items-center gap-4 w-full">
      
      {/* Current track metadata */}
      <div className="flex items-center gap-3 w-full md:w-64 flex-shrink-0">
        <div className={`p-2 bg-carbon border border-graphite/40 rounded flex items-center justify-center relative overflow-hidden ${isPlaying ? 'animate-spin [animation-duration:8s]' : ''}`}>
          <Disc className={`w-4 h-4 text-ash group-hover:text-white`} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-mono text-[9px] text-ash/80 tracking-wider flex items-center gap-1.5 uppercase">
            <Radio className="w-3 h-3 text-signal-magenta inline" /> EP_RECEIVER // SIGNAL_{currentTrack.num}
          </div>
          <div className="font-body text-xs font-semibold text-bone truncate">
            {currentTrack.title}
          </div>
        </div>
      </div>

      {/* Interactive Controls & Waveform */}
      <div className="flex-1 flex items-center gap-4 w-full">
        <button 
          onClick={handleTogglePlay}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95 flex-shrink-0 ${getAccentColorsStyle()}`}
          title={isPlaying ? "Pause Stream" : "Listen Live"}
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current translate-x-0.5" />}
        </button>

        <button 
          onClick={handleNextTrack}
          className="p-1.5 text-slate hover:text-bone hover:bg-carbon rounded transition-colors flex-shrink-0"
          title="Cycle Track Stream"
        >
          <SkipForward className="w-4 h-4" />
        </button>

        {/* Dynamic Canvas Container */}
        <div 
          onClick={handleSeek}
          className="flex-1 h-8 relative cursor-pointer group bg-carbon/10 rounded flex items-center"
        >
          <canvas ref={canvasRef} className="w-full h-full block" />
        </div>

        {/* Track time elapsed */}
        <div className="font-mono text-[11px] text-slate font-bold flex-shrink-0">
          {getElapsedString()} / {currentTrack.durationStr}
        </div>
      </div>

      {/* Volume Selector */}
      <div className="hidden lg:flex items-center gap-2.5 w-32 flex-shrink-0">
        <Volume2 className="w-4 h-4 text-slate" />
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.05"
          value={volume}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            setVolume(val);
            onLogMessage('info', `Receiver audio volume adjusted to ${Math.floor(val * 100)}%`);
          }}
          className="w-full accent-signal-cyan h-1 bg-graphite rounded-lg cursor-pointer"
        />
      </div>

    </div>
  );
}
