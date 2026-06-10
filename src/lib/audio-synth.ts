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
  const child = firebaseBridge.auth.getActiveChild();
  const user = firebaseBridge.auth.getCurrentUser();
  const soundPref = child?.sensorySound ?? user?.sensorySound ?? 'marimba';
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

  osc1.connect(masterGain);
  masterGain.connect(ctx.destination);

  osc1.start(now);
  osc1.stop(now + duration + 0.05);
};

/**
 * Plays a bubbly, rounded pop sound for micro-interactions (e.g. navigation).
 */
export const playBubble = () => {
  const child = firebaseBridge.auth.getActiveChild();
  const user = firebaseBridge.auth.getCurrentUser();
  const soundPref = child?.sensorySound ?? user?.sensorySound ?? 'marimba';
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
  const child = firebaseBridge.auth.getActiveChild();
  const user = firebaseBridge.auth.getCurrentUser();
  const soundPref = child?.sensorySound ?? user?.sensorySound ?? 'marimba';
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

  const child = firebaseBridge.auth.getActiveChild();
  const user = firebaseBridge.auth.getCurrentUser();
  const rawSpeed = child?.sensorySpeed ?? user?.sensorySpeed ?? 1.0;
  
  // Map sensory speed: 0.7 -> 0.65 (very slow), 1.0 -> 0.85 (calm), 1.2 -> 1.05 (normal)
  let speedRate = 0.85;
  if (rawSpeed === 0.7) speedRate = 0.65;
  if (rawSpeed === 1.2) speedRate = 1.05;

  // Remove emojis and symbols from the spoken text so SpeechSynthesis does not read them
  const cleanText = text
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/\uFE0F/g, '') // Variation selector-16
    .replace(/\s+/g, ' ')
    .trim();

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = 'pt-BR';
  utterance.rate = speedRate; // Configured speed rate for TEA children
  utterance.pitch = 1.15; // Warm, friendly, slightly higher pitch for engagement

  window.speechSynthesis.speak(utterance);
};
