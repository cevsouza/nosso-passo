import { SENSORY_AUDIO } from './sensory-standards';
import { firebaseBridge } from './firebase-bridge';

let audioCtx: AudioContext | null = null;

// Initialize or get the AudioContext lazily (must be triggered by user gesture)
const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

/**
 * Plays a warm, organic marimba note of a specific frequency.
 * Designed to sound woody, low-frequency, and extremely calming.
 */
export const playMarimba = (frequency: number = SENSORY_AUDIO.frequencies.marimbaCore, duration: number = 0.5) => {
  const user = firebaseBridge.auth.getCurrentUser();
  const soundPref = user?.sensorySound ?? 'marimba';
  if (soundPref === 'silent') return;
  if (soundPref === 'bubble') {
    playBubble();
    return;
  }

  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  
  // Master Gain to normalize and ensure volume is strictly controlled
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0, now);
  masterGain.gain.linearRampToValueAtTime(SENSORY_AUDIO.masterVolume, now + 0.02);
  masterGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  
  // Fundamental Tone (Sine Wave for maximum smoothness)
  const osc1 = ctx.createOscillator();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(frequency, now);

  // Soft Secondary Harmonic (Triangular for warm wooden texture, very low gain)
  const osc2 = ctx.createOscillator();
  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(frequency * 2, now);
  const gainHarmonic = ctx.createGain();
  gainHarmonic.gain.setValueAtTime(0.04, now); // Just a tiny touch of color
  
  // Connections
  osc1.connect(masterGain);
  osc2.connect(gainHarmonic);
  gainHarmonic.connect(masterGain);
  masterGain.connect(ctx.destination);

  // Start & Stop
  osc1.start(now);
  osc2.start(now);
  osc1.stop(now + duration + 0.1);
  osc2.stop(now + duration + 0.1);
};

/**
 * Plays a soft, cute bubble pop sound.
 * Uses quick sine sweeps to sound fluid, watery, and extremely non-threatening.
 */
export const playBubble = () => {
  const user = firebaseBridge.auth.getCurrentUser();
  const soundPref = user?.sensorySound ?? 'marimba';
  if (soundPref === 'silent') return;

  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const duration = 0.12;

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0, now);
  masterGain.gain.linearRampToValueAtTime(SENSORY_AUDIO.masterVolume * 0.9, now + 0.01);
  masterGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  
  // Fast frequency sweep (upwards) to sound like a pop
  const startFreq = SENSORY_AUDIO.frequencies.bubblePop[0];
  const endFreq = SENSORY_AUDIO.frequencies.bubblePop[1];
  
  osc.frequency.setValueAtTime(startFreq, now);
  osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration * 0.8);

  osc.connect(masterGain);
  masterGain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + duration + 0.05);
};

/**
 * Plays a warm major-chord sequence representing task/day completion.
 * Spaced out and slow to provide smooth cognitive closure.
 */
export const playCelebration = () => {
  const user = firebaseBridge.auth.getCurrentUser();
  const soundPref = user?.sensorySound ?? 'marimba';
  if (soundPref === 'silent') return;

  const notes = SENSORY_AUDIO.frequencies.celebrationChord;
  
  // Play 3 notes sequentially with gentle pacing (250ms interval)
  notes.forEach((freq, idx) => {
    setTimeout(() => {
      if (soundPref === 'bubble') {
        playBubble();
      } else {
        playMarimba(freq, 0.6);
      }
    }, idx * 220);
  });
};

/**
 * Synthesizes a friendly, calm speech read-aloud in Portuguese (pt-BR).
 * Automatically cancels any active speech to avoid queues overlapping.
 */
export const speakText = (text: string) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  // Cancel any active speech to avoid queues overlapping
  window.speechSynthesis.cancel();

  const user = firebaseBridge.auth.getCurrentUser();
  const rawSpeed = user?.sensorySpeed ?? 1.0;
  
  // Map sensory speed: 0.7 -> 0.65 (very slow), 1.0 -> 0.85 (calm), 1.2 -> 1.05 (normal)
  let speedRate = 0.85;
  if (rawSpeed === 0.7) speedRate = 0.65;
  if (rawSpeed === 1.2) speedRate = 1.05;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'pt-BR';
  utterance.rate = speedRate; // Configured speed rate for TEA children
  utterance.pitch = 1.15; // Warm, friendly, slightly higher pitch for engagement

  window.speechSynthesis.speak(utterance);
};
