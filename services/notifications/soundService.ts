"use client";

import type { AlertSound } from "@/core/types";
import { getCachedCustomSound, getCustomSounds } from "@/services/audio/customSoundService";

// Web Audio API based mindful alarm chime & music synthesizer
// Plays soothing, natural acoustic sounds or custom uploaded music for up to 20 seconds

let audioCtx: AudioContext | null = null;
let isPlaying = false;
let timeoutId: NodeJS.Timeout | null = null;
let activeOscillators: OscillatorNode[] = [];
let masterGain: GainNode | null = null;
let customAudioEl: HTMLAudioElement | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// ─── Sound 1: Zen Chime (Pentatonic D-F#-A-B Melody) ───────
const CHIME_NOTES = [587.33, 659.25, 739.99, 880.0, 987.77, 1174.66]; // D5, E5, F#5, A5, B5, D6

function playChimeNote(ctx: AudioContext, freq: number, startTime: number, duration: number, dest: AudioNode) {
  const osc = ctx.createOscillator();
  const noteGain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, startTime);

  noteGain.gain.setValueAtTime(0, startTime);
  noteGain.gain.linearRampToValueAtTime(0.2, startTime + 0.04);
  noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  osc.connect(noteGain);
  noteGain.connect(dest);

  osc.start(startTime);
  osc.stop(startTime + duration);
  activeOscillators.push(osc);
}

function scheduleChimeLoop(ctx: AudioContext, loopStart: number, dest: AudioNode) {
  playChimeNote(ctx, CHIME_NOTES[0], loopStart + 0.0, 1.2, dest);
  playChimeNote(ctx, CHIME_NOTES[2], loopStart + 0.35, 1.2, dest);
  playChimeNote(ctx, CHIME_NOTES[3], loopStart + 0.7, 1.4, dest);
  playChimeNote(ctx, CHIME_NOTES[4], loopStart + 1.05, 1.6, dest);
}

// ─── Sound 2: Mindful Temple Bell ──────────────────────────
function scheduleBellLoop(ctx: AudioContext, loopStart: number, dest: AudioNode) {
  // Fundamental + partials to mimic a resonant Japanese or Buddhist acoustic bell
  const partials = [
    { freq: 440, gain: 0.25, decay: 2.2 },
    { freq: 880, gain: 0.12, decay: 1.8 },
    { freq: 1320, gain: 0.06, decay: 1.2 },
    { freq: 1760, gain: 0.03, decay: 0.8 },
  ];

  partials.forEach(({ freq, gain, decay }) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, loopStart);

    g.gain.setValueAtTime(0, loopStart);
    g.gain.linearRampToValueAtTime(gain, loopStart + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0005, loopStart + decay);

    osc.connect(g);
    g.connect(dest);
    osc.start(loopStart);
    osc.stop(loopStart + decay);
    activeOscillators.push(osc);
  });
}

// ─── Sound 3: Tibetan Singing Bowl ─────────────────────────
function scheduleBowlLoop(ctx: AudioContext, loopStart: number, dest: AudioNode) {
  // Deep warm singing bowl with subtle binaural shimmer
  const frequencies = [216, 218.5, 432, 648];
  const gains = [0.22, 0.2, 0.08, 0.03];

  frequencies.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, loopStart);

    g.gain.setValueAtTime(0.001, loopStart);
    g.gain.linearRampToValueAtTime(gains[idx], loopStart + 0.4);
    g.gain.exponentialRampToValueAtTime(0.0005, loopStart + 2.8);

    osc.connect(g);
    g.connect(dest);
    osc.start(loopStart);
    osc.stop(loopStart + 2.8);
    activeOscillators.push(osc);
  });
}

// ─── Sound 4: Morning Birds ────────────────────────────────
function playBirdChirp(ctx: AudioContext, start: number, f1: number, f2: number, f3: number, dest: AudioNode) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();

  osc.type = "sine";
  osc.frequency.setValueAtTime(f1, start);
  osc.frequency.exponentialRampToValueAtTime(f2, start + 0.06);
  osc.frequency.exponentialRampToValueAtTime(f3, start + 0.14);

  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(0.12, start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.001, start + 0.16);

  osc.connect(g);
  g.connect(dest);
  osc.start(start);
  osc.stop(start + 0.16);
  activeOscillators.push(osc);
}

function scheduleBirdsLoop(ctx: AudioContext, loopStart: number, dest: AudioNode) {
  // Sweet sequence of little bird chirps
  playBirdChirp(ctx, loopStart + 0.0, 2200, 3100, 2400, dest);
  playBirdChirp(ctx, loopStart + 0.22, 2400, 3400, 2600, dest);
  playBirdChirp(ctx, loopStart + 0.7, 1900, 2800, 2200, dest);
  playBirdChirp(ctx, loopStart + 0.95, 2300, 3200, 2500, dest);
}

// ─── Sound 5: Warm Marimba ─────────────────────────────────
function playMarimbaBar(ctx: AudioContext, freq: number, start: number, dest: AudioNode) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();

  osc.type = "triangle"; // Warm acoustic wood characteristic
  osc.frequency.setValueAtTime(freq, start);

  g.gain.setValueAtTime(0, start);
  g.gain.linearRampToValueAtTime(0.18, start + 0.008);
  g.gain.exponentialRampToValueAtTime(0.001, start + 0.6);

  osc.connect(g);
  g.connect(dest);
  osc.start(start);
  osc.stop(start + 0.6);
  activeOscillators.push(osc);
}

function scheduleMarimbaLoop(ctx: AudioContext, loopStart: number, dest: AudioNode) {
  // C major arpeggio
  playMarimbaBar(ctx, 523.25, loopStart + 0.0, dest);  // C5
  playMarimbaBar(ctx, 659.25, loopStart + 0.22, dest); // E5
  playMarimbaBar(ctx, 783.99, loopStart + 0.44, dest); // G5
  playMarimbaBar(ctx, 987.77, loopStart + 0.66, dest); // B5
  playMarimbaBar(ctx, 1046.5, loopStart + 0.88, dest); // C6
}

// ─── Main Sound Scheduler ──────────────────────────────────

function scheduleSoundLoop(soundType: AlertSound, ctx: AudioContext, loopStart: number, dest: AudioNode) {
  switch (soundType) {
    case "bell":
      scheduleBellLoop(ctx, loopStart, dest);
      break;
    case "bowl":
      scheduleBowlLoop(ctx, loopStart, dest);
      break;
    case "birds":
      scheduleBirdsLoop(ctx, loopStart, dest);
      break;
    case "marimba":
      scheduleMarimbaLoop(ctx, loopStart, dest);
      break;
    case "chime":
    default:
      scheduleChimeLoop(ctx, loopStart, dest);
      break;
  }
}

function getLoopInterval(soundType: AlertSound): number {
  switch (soundType) {
    case "bowl":
      return 3.0;
    case "bell":
      return 2.5;
    case "birds":
      return 2.0;
    case "marimba":
      return 2.2;
    case "chime":
    default:
      return 2.4;
  }
}

/**
 * Start the alerting audio for a given duration (default 20 seconds).
 * Uses the requested AlertSound ("chime", "bell", "bowl", "birds", "marimba").
 */
export function startAlarmAudio(durationSeconds = 20, soundType: AlertSound = "chime"): () => void {
  stopAlarmAudio();

  // If user selected a custom uploaded audio file
  if (soundType && soundType.startsWith("custom_")) {
    const playCustom = (dataUrl: string) => {
      try {
        customAudioEl = new Audio(dataUrl);
        customAudioEl.loop = true;
        customAudioEl.volume = 0.85;
        isPlaying = true;
        customAudioEl.play().catch((err) => {
          console.warn("[SoundService] Custom audio play failed:", err);
        });

        timeoutId = setTimeout(() => {
          stopAlarmAudio();
        }, durationSeconds * 1000);
      } catch (err) {
        console.error("[SoundService] Failed to initialize custom audio:", err);
      }
    };

    const cached = getCachedCustomSound(soundType);
    if (cached?.dataUrl) {
      playCustom(cached.dataUrl);
      return stopAlarmAudio;
    } else {
      // Async fetch from IndexedDB if not yet cached
      getCustomSounds().then((sounds) => {
        const found = sounds.find((s) => s.id === soundType);
        if (found?.dataUrl) {
          playCustom(found.dataUrl);
        }
      });
      return stopAlarmAudio;
    }
  }

  // Synthesize built-in mindful melody using Web Audio API
  const ctx = getAudioContext();
  if (!ctx) return () => {};

  isPlaying = true;
  masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.7, ctx.currentTime);
  masterGain.connect(ctx.destination);

  const loopLength = getLoopInterval(soundType);
  const totalLoops = Math.ceil(durationSeconds / loopLength);
  const startTime = ctx.currentTime;

  for (let loop = 0; loop < totalLoops; loop++) {
    const loopStart = startTime + loop * loopLength;
    scheduleSoundLoop(soundType, ctx, loopStart, masterGain);
  }

  // Automatically fade out and stop after durationSeconds (20s)
  timeoutId = setTimeout(() => {
    stopAlarmAudio();
  }, durationSeconds * 1000);

  return stopAlarmAudio;
}

/**
 * Preview a sample of the chosen alert sound in the UI.
 */
export function previewAlertSound(soundType: AlertSound = "chime", durationSeconds = 3.5): () => void {
  return startAlarmAudio(durationSeconds, soundType);
}

export function stopAlarmAudio(): void {
  if (timeoutId) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }

  // Stop custom uploaded audio element if playing
  if (customAudioEl) {
    try {
      customAudioEl.pause();
      customAudioEl.currentTime = 0;
      customAudioEl.src = "";
    } catch {
      // ignore
    }
    customAudioEl = null;
  }

  if (masterGain && audioCtx) {
    try {
      masterGain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    } catch {
      // ignore
    }
  }

  setTimeout(() => {
    activeOscillators.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // already stopped
      }
    });
    activeOscillators = [];
    isPlaying = false;
  }, 120);
}

export function isAlarmPlaying(): boolean {
  return isPlaying;
}
