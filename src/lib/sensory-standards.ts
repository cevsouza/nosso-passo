/**
 * Sensory Standards for ASD/TEA Children's Agenda.
 * Centralizes sensory safety constants for animation and sound.
 */

// High-contrast, accessibility-checked palette for readable text and components
export const SENSORY_PALETTE = {
  bgSoft: 'hsl(210, 40%, 98%)',      // Clean soft off-white background
  primarySoft: 'hsl(225, 75%, 50%)', // Indigo-600 equivalent, high contrast
  successSoft: 'hsl(142, 72%, 29%)', // Deep success green, high contrast
  warningSoft: 'hsl(38, 92%, 40%)',   // Rich warning amber, high contrast
  textPrimary: 'hsl(220, 25%, 10%)',  // Near-black charcoal for supreme readability
  textSecondary: 'hsl(215, 20%, 32%)',// Slate-700 for accessible subtext
  whiteGlass: 'rgba(255, 255, 255, 0.95)',
  borderGlass: 'rgba(148, 163, 184, 0.45)', // Defined slate borders
};

// Strict animation standards to prevent visual triggers (flashes, shakes, fast movements)
export const SENSORY_ANIMATIONS = {
  // Low-velocity transitions
  transitionDefault: {
    type: "tween",
    duration: 0.35,
    ease: [0.25, 0.1, 0.25, 1.0], // cubic-bezier smooth ease
  },
  
  // Safe mascot celebration time (precisely 2.0 seconds for cognitive closure)
  celebrationDuration: 2000, 
  
  // Mild zoom-in for active mission (no rapid pops)
  activeMissionVariants: {
    initial: { opacity: 0, scale: 0.97 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.97 }
  },

  // Soft slide-up for timeline entries
  timelineVariants: {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 }
  }
};

// Audio normalization settings (low-frequency tones)
export const SENSORY_AUDIO = {
  masterVolume: 0.15, // Low normalized default volume
  frequencies: {
    bubblePop: [220, 330],    // Soft sweeps in lower mids (Hz)
    marimbaCore: 261.63,     // Middle C (C4) - warm fundamental
    marimbaHarmonic: 523.25,  // Octave C5 (very soft mix)
    celebrationChord: [261.63, 329.63, 392.00] // C4 - E4 - G4 warm major chord sequence
  }
};

// --- Task Categories and Theme Mapping (Shared across Parents & Kids) ---
import { LucideIcon, Sparkles, Utensils, BookOpen, Bed, Gamepad2 } from 'lucide-react';

export interface TaskCategory {
  gradient: string;
  shadow: string;
  tagClass: string;
  label: string;
  icon: LucideIcon;
}

export const getTaskCategory = (title: string): TaskCategory => {
  const text = title.toLowerCase();
  
  // Hygiene
  if (text.includes('escovar') || text.includes('banho') || text.includes('dente') || text.includes('lavar') || text.includes('higiene') || text.includes('vestir') || text.includes('trocar') || text.includes('pentear')) {
    return {
      gradient: 'from-teal-500 to-teal-800', // High-contrast teal to deep emerald
      shadow: 'shadow-teal-100 border-teal-400',
      tagClass: 'text-teal-950 bg-teal-100 border-teal-300 font-extrabold',
      label: 'Higiene 🫧',
      icon: Sparkles
    };
  }
  
  // Meals
  if (text.includes('comer') || text.includes('café') || text.includes('almoço') || text.includes('jantar') || text.includes('lanche') || text.includes('bebida') || text.includes('água') || text.includes('refeição') || text.includes('suco') || text.includes('fruta')) {
    return {
      gradient: 'from-amber-500 to-orange-650', // High-contrast amber to orange
      shadow: 'shadow-orange-100 border-orange-400',
      tagClass: 'text-orange-950 bg-orange-100 border-orange-300 font-extrabold',
      label: 'Refeição 🍎',
      icon: Utensils
    };
  }
  
  // Study/School
  if (text.includes('escola') || text.includes('estudar') || text.includes('aula') || text.includes('dever') || text.includes('lição') || text.includes('ler') || text.includes('livro') || text.includes('tarefa') || text.includes('curso')) {
    return {
      gradient: 'from-sky-500 to-blue-800', // High-contrast sky to blue
      shadow: 'shadow-blue-100 border-blue-400',
      tagClass: 'text-blue-950 bg-blue-100 border-blue-300 font-extrabold',
      label: 'Estudo 📝',
      icon: BookOpen
    };
  }
  
  // Sleep/Rest
  if (text.includes('dormir') || text.includes('cama') || text.includes('deitar') || text.includes('sono') || text.includes('descansar') || text.includes('cochilar') || text.includes('relaxar')) {
    return {
      gradient: 'from-indigo-500 to-indigo-850', // High-contrast indigo to dark blue
      shadow: 'shadow-indigo-100 border-indigo-400',
      tagClass: 'text-indigo-950 bg-indigo-100 border-indigo-300 font-extrabold',
      label: 'Descanso 🌙',
      icon: Bed
    };
  }
  
  // Play/Default Play
  return {
    gradient: 'from-purple-500 to-pink-700', // High-contrast purple to pink
    shadow: 'shadow-pink-100 border-purple-400',
    tagClass: 'text-purple-950 bg-purple-100 border-purple-300 font-extrabold',
    label: 'Diversão 🎮',
    icon: Gamepad2
  };
};

