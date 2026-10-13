import { useEffect, useRef } from 'react';

// -- Audio Manager Module --
// Encapsulates ALL audio synthesis logic:
// AudioContext management, startSynth, createFilteredOscillator,
// createLofiChordsLoop, cleanupAudioSources, teardownAudio,
// track switching, volume control.
// Exported functions/hooks for the App to use.

/**
 * Audio state ref structure
 */
interface AudioRef {
  audioCtx: AudioContext | null;
  gainNode: GainNode | null;
  sources: any[];
  activeTrack: string | null;
}

/**
 * useAudio — Manages the entire audio synthesis system.
 * 
 * Sets up AudioContext, oscillators, loops, volume control, and track switching.
 * 
 * @param config — Presentation config with audio settings
 * @param onLog — Optional logging callback
 */
export function useAudio(
  config: { isPlayingSound: boolean; audioLoop: string; volume: number },
  onLog?: (type: 'info' | 'ok' | 'warn' | 'err', text: string) => void
) {
  const synthRef = useRef<AudioRef>({ audioCtx: null, gainNode: null, sources: [], activeTrack: null });
  const lofiChordTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Lifecycle effect: start / stop / teardown the synth.
  // Volume is deliberately NOT a dep here — a volume change must never tear
  // down running audio (it is handled by the gain-only effect below).
  useEffect(() => {
    const audioConfig = config;

    const cleanupAudioSources = () => {
      synthRef.current.sources.forEach(src => {
        try {
          if (src.disconnect) {
            src.disconnect();
          }
        } catch (e) {}
        try {
          if (src.stop) {
            src.stop();
          }
        } catch (e) {}
      });
      synthRef.current.sources = [];
    };

    const teardownAudio = () => {
      if (lofiChordTimerRef.current) {
        clearTimeout(lofiChordTimerRef.current);
        lofiChordTimerRef.current = null;
      }
      cleanupAudioSources();
      if (synthRef.current.audioCtx) {
        try {
          synthRef.current.audioCtx.close();
        } catch (e) {}
      }
      synthRef.current = { audioCtx: null, gainNode: null, sources: [], activeTrack: null };
    };

    // Stop synthesize if disabled — stops/disconnects sources, closes the context
    if (!audioConfig.isPlayingSound) {
      teardownAudio();
      return teardownAudio;
    }

    const createFilteredOscillator = (ctx: AudioContext, freq: number, type: OscillatorType, gainVal: number, destination: AudioNode) => {
      const osc = ctx.createOscillator();
      const nodeGain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      nodeGain.gain.value = gainVal;
      osc.connect(nodeGain);
      nodeGain.connect(destination);
      osc.start();
      synthRef.current.sources.push(osc);
    };

    const createLofiChordsLoop = (ctx: AudioContext, destination: AudioNode) => {
      const chords = [
        [196.00, 246.94, 293.66, 369.99], // Gmaj7
        [220.00, 261.63, 329.63, 392.00], // Am7
        [146.83, 220.00, 293.66, 349.23]  // D7 / F
      ];

      let chordIndex = 0;
      const playNextChord = () => {
        if (!synthRef.current.audioCtx || synthRef.current.activeTrack !== 'lofi-rain') return;
        const currentChord = chords[chordIndex];
        const now = ctx.currentTime;

        currentChord.forEach(freq => {
          const osc = ctx.createOscillator();
          const oscGain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = freq;

          // Vintage pitch flutter
          const vibrato = ctx.createOscillator();
          vibrato.frequency.value = 4.5 + Math.random() * 2;
          const vibratoGain = ctx.createGain();
          // FM modulation depth into osc.frequency (Hz); clamped to the 0..1 gain
          // invariant — was 1.3 (last gain.value above 1 in this module).
          vibratoGain.gain.value = Math.min(1.3, 1);
          vibrato.connect(vibratoGain);
          vibratoGain.connect(osc.frequency);
          vibrato.start();
          synthRef.current.sources.push(vibrato);

          // Lofi Envelope
          oscGain.gain.setValueAtTime(0, now);
          oscGain.gain.linearRampToValueAtTime(0.05, now + 1.5);
          oscGain.gain.setValueAtTime(0.05, now + 3);
          oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 5.5);

          osc.connect(oscGain);
          oscGain.connect(destination);
          try {
            osc.start(now);
            osc.stop(now + 5.8);
          } catch (e) {}
        });

        chordIndex = (chordIndex + 1) % chords.length;
        const timer = setTimeout(playNextChord, 6000);
        lofiChordTimerRef.current = timer;
      };

      playNextChord();
    };

    const startSynth = (trackId: string) => {
      try {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtxClass) return;
        const ctx = new AudioCtxClass();
        synthRef.current.audioCtx = ctx;
        synthRef.current.activeTrack = trackId;

        const mainGain = ctx.createGain();
        mainGain.gain.setValueAtTime((audioConfig.volume / 100) * 0.15, ctx.currentTime);
        mainGain.connect(ctx.destination);
        synthRef.current.gainNode = mainGain;

        if (trackId === 'synth-pad') {
          // Consequences Deep Drone
          const filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.Q.value = 4;
          filter.frequency.value = 170;
          filter.connect(mainGain);

          createFilteredOscillator(ctx, 55, 'sawtooth', 0.15, filter);  // A1 Harmonic sub-drone
          createFilteredOscillator(ctx, 110, 'triangle', 0.25, filter); // A2 Rich midrange
          createFilteredOscillator(ctx, 165, 'sine', 0.15, filter);     // E2 Pure fifth

          // Very slow resonant filter sweeping using LFO
          // Clamp gain to 0-1 range — was 75 (would cause severe distortion/clipping)
          const lfo = ctx.createOscillator();
          lfo.frequency.value = 0.07; // 14 seconds sweep cycle
          const lfoGain = ctx.createGain();
          lfoGain.gain.value = Math.min(75 / 100, 1);

          lfo.connect(lfoGain);
          lfoGain.connect(filter.frequency);
          lfo.start();
          synthRef.current.sources.push(lfo);
        }
        else if (trackId === 'lofi-rain') {
          // Rain pinkish water drops simulator
          const bufferSize = ctx.sampleRate * 2;
          const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const output = noiseBuffer.getChannelData(0);
          let lastOut = 0.0;
          for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            output[i] = (lastOut * 0.15 + white * 0.04);
            lastOut = output[i];
          }
          const noiseSrc = ctx.createBufferSource();
          noiseSrc.buffer = noiseBuffer;
          noiseSrc.loop = true;

          const rainFilter = ctx.createBiquadFilter();
          rainFilter.type = 'bandpass';
          rainFilter.frequency.value = 750;
          rainFilter.Q.value = 1.2;

          noiseSrc.connect(rainFilter);
          rainFilter.connect(mainGain);
          noiseSrc.start();
          synthRef.current.sources.push(noiseSrc);

          // Elegant chords loop overlays
          createLofiChordsLoop(ctx, mainGain);
        }
        else if (trackId === 'cosmic-wind') {
          // Solar ambient echoes: Swirling bandpass modulated noise
          // Clamp gain to 0-1 range — was 300 (would cause extreme distortion/clipping)
          const bufferSize = ctx.sampleRate * 2;
          const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const output = noiseBuffer.getChannelData(0);
          for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
          }
          const noiseSrc = ctx.createBufferSource();
          noiseSrc.buffer = noiseBuffer;
          noiseSrc.loop = true;

          const bpFilter = ctx.createBiquadFilter();
          bpFilter.type = 'bandpass';
          bpFilter.Q.value = 7;
          bpFilter.frequency.value = 450;

          const lfo = ctx.createOscillator();
          lfo.frequency.value = 0.04; // 25 seconds sweeping
          const lfoGain = ctx.createGain();
          // Clamped from 300 to 0.3 — prevents extreme gain staging issues
          lfoGain.gain.value = Math.min(300 / 1000, 1);

          lfo.connect(lfoGain);
          lfoGain.connect(bpFilter.frequency);
          lfo.start();
          synthRef.current.sources.push(lfo);

          noiseSrc.connect(bpFilter);
          bpFilter.connect(mainGain);
          noiseSrc.start();
          synthRef.current.sources.push(noiseSrc);
        }
      } catch (err) {
        console.warn("Synth Audio initialization failed on current browser frame", err);
      }
    };

    startSynth(audioConfig.audioLoop);

    // React runs this cleanup before every re-run and on unmount, so no source,
    // context or chord timer ever survives the effect that created it.
    return teardownAudio;
  }, [config.isPlayingSound, config.audioLoop]);

  // Gain-only effect: volume changes never stop or restart the audio.
  useEffect(() => {
    const { audioCtx, gainNode } = synthRef.current;
    if (audioCtx && gainNode) {
      gainNode.gain.setValueAtTime((config.volume / 100) * 0.15, audioCtx.currentTime);
    }
  }, [config.volume]);
}