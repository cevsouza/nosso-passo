import { SENSORY_AUDIO } from './sensory-standards';
import { firebaseBridge } from './firebase-bridge';

let audioCtx: AudioContext | null = null;

// Initialize or get the AudioContext lazily (must be triggered by user gesture)
const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) {
    console.warn('Web Audio API is not supported in this browser.');
    return null;
  }

  if (!audioCtx) {
    try {
      audioCtx = new AudioContextClass();
    } catch (e) {
      console.error('Failed to create AudioContext:', e);
      return null;
    }
  }

  if (audioCtx && audioCtx.state === 'suspended') {
    try {
      audioCtx.resume();
    } catch (e) {
      console.warn('Failed to resume AudioContext:', e);
    }
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
  let soundPref = child?.sensorySound ?? user?.sensorySound ?? 'marimba';
  if (typeof window !== 'undefined' && localStorage.getItem('localCalmMode') === 'true') {
    soundPref = 'silent';
  }
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
  let soundPref = child?.sensorySound ?? user?.sensorySound ?? 'marimba';
  if (typeof window !== 'undefined' && localStorage.getItem('localCalmMode') === 'true') {
    soundPref = 'silent';
  }
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
  let soundPref = child?.sensorySound ?? user?.sensorySound ?? 'marimba';
  if (typeof window !== 'undefined' && localStorage.getItem('localCalmMode') === 'true') {
    soundPref = 'silent';
  }
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
  let rawSpeed = child?.sensorySpeed ?? user?.sensorySpeed ?? 1.0;
  if (typeof window !== 'undefined' && localStorage.getItem('localCalmMode') === 'true') {
    rawSpeed = 0.7;
  }
  
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

// Global ambient sound state variables
let activeAmbientSource: { stop: () => void } | null = null;
let activeAmbientGain: GainNode | null = null;

/**
 * Starts a procedural sensory ambient sound loop (brown noise or binaural beats).
 * Safe from missing audio asset issues as it synthesizes audio nodes dynamically.
 */
export const startAmbientSound = (type: 'rain' | 'binaural' | 'white' | 'pink' | 'none') => {
  if (typeof window === 'undefined') return;
  stopAmbientSound(); // Stop any existing loop first
  
  if (type === 'none') return;
  
  const ctx = getAudioContext();
  if (!ctx) return;
  
  const now = ctx.currentTime;
  const mainGain = ctx.createGain();
  mainGain.gain.setValueAtTime(0, now);
  mainGain.gain.linearRampToValueAtTime(0.08, now + 1.0); // Smooth fade in over 1 second, keep volume low
  
  let sourceNode: { stop: () => void };
  
  if (type === 'rain') {
    // Generate Brown Noise (simulates rain/ocean)
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5; // Gain compensation
    }
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;
    noiseSource.connect(mainGain);
    mainGain.connect(ctx.destination);
    noiseSource.start(now);
    
    sourceNode = {
      stop: () => {
        try {
          noiseSource.stop();
        } catch(e) {}
      }
    };
  } else if (type === 'white') {
    // Generate White Noise
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.5; // reduce base intensity slightly
    }
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;
    noiseSource.connect(mainGain);
    mainGain.connect(ctx.destination);
    noiseSource.start(now);
    
    sourceNode = {
      stop: () => {
        try {
          noiseSource.stop();
        } catch(e) {}
      }
    };
  } else if (type === 'pink') {
    // Generate Pink Noise (refined 3dB/octave decay approximation)
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      output[i] *= 0.11; // rescue factor
      b6 = white * 0.115926;
    }
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;
    noiseSource.connect(mainGain);
    mainGain.connect(ctx.destination);
    noiseSource.start(now);
    
    sourceNode = {
      stop: () => {
        try {
          noiseSource.stop();
        } catch(e) {}
      }
    };
  } else {
    // Binaural Beats (200Hz Left / 210Hz Right for 10Hz Alpha waves)
    const leftOsc = ctx.createOscillator();
    leftOsc.type = 'sine';
    leftOsc.frequency.setValueAtTime(200, now);
    
    const rightOsc = ctx.createOscillator();
    rightOsc.type = 'sine';
    rightOsc.frequency.setValueAtTime(210, now);
    
    const merger = ctx.createChannelMerger(2);
    
    // Connect oscillators to merger channels
    const leftGain = ctx.createGain();
    const rightGain = ctx.createGain();
    leftGain.gain.setValueAtTime(0.5, now);
    rightGain.gain.setValueAtTime(0.5, now);
    
    leftOsc.connect(leftGain);
    rightOsc.connect(rightGain);
    
    leftGain.connect(merger, 0, 0); // left channel
    rightGain.connect(merger, 0, 1); // right channel
    
    merger.connect(mainGain);
    mainGain.connect(ctx.destination);
    
    leftOsc.start(now);
    rightOsc.start(now);
    
    sourceNode = {
      stop: () => {
        try {
          leftOsc.stop();
          rightOsc.stop();
        } catch(e) {}
      }
    };
  }
  
  activeAmbientSource = sourceNode;
  activeAmbientGain = mainGain;
};

/**
 * Stops any active sensory ambient sound loop with a soft gain fadeout.
 */
export const stopAmbientSound = () => {
  if (activeAmbientGain && audioCtx) {
    const now = audioCtx.currentTime;
    try {
      activeAmbientGain.gain.cancelScheduledValues(now);
      activeAmbientGain.gain.setValueAtTime(activeAmbientGain.gain.value, now);
      activeAmbientGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
    } catch(e) {}
  }
  
  const sourceToStop = activeAmbientSource;
  setTimeout(() => {
    if (sourceToStop) {
      sourceToStop.stop();
    }
  }, 550);
  
  activeAmbientSource = null;
  activeAmbientGain = null;
};
