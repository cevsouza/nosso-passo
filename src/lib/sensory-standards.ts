/**
 * Sensory Standards for ASD/TEA Children's Agenda.
 * Centralizes sensory safety constants for animation and sound.
 */

// Soft, low-contrast, harmonious pastel palette for TEA children to avoid visual overstimulation
export const SENSORY_PALETTE = {
  bgSoft: 'hsl(210, 30%, 96%)',      // Soft grayish blue
  primarySoft: 'hsl(207, 85%, 60%)', // Calm soft blue
  successSoft: 'hsl(145, 63%, 45%)', // Gentle pastel green
  warningSoft: 'hsl(35, 85%, 62%)',   // Warm soft orange
  textPrimary: 'hsl(220, 20%, 25%)',  // Low contrast charcoal
  textSecondary: 'hsl(218, 12%, 45%)',// Distanced grayish slate
  whiteGlass: 'rgba(255, 255, 255, 0.88)',
  borderGlass: 'rgba(255, 255, 255, 0.45)',
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
      gradient: 'from-[#2dd4bf] to-[#0d9488]', // Teal to Emerald
      shadow: 'shadow-teal-100 border-teal-200/80',
      tagClass: 'text-teal-700 bg-teal-50 border-teal-100',
      label: 'Higiene 🫧',
      icon: Sparkles
    };
  }
  
  // Meals
  if (text.includes('comer') || text.includes('café') || text.includes('almoço') || text.includes('jantar') || text.includes('lanche') || text.includes('bebida') || text.includes('água') || text.includes('refeição') || text.includes('suco') || text.includes('fruta')) {
    return {
      gradient: 'from-[#fbbf24] to-[#ea580c]', // Amber to Orange
      shadow: 'shadow-orange-100 border-orange-200/80',
      tagClass: 'text-orange-700 bg-orange-50 border-orange-100',
      label: 'Refeição 🍎',
      icon: Utensils
    };
  }
  
  // Study/School
  if (text.includes('escola') || text.includes('estudar') || text.includes('aula') || text.includes('dever') || text.includes('lição') || text.includes('ler') || text.includes('livro') || text.includes('tarefa') || text.includes('curso')) {
    return {
      gradient: 'from-[#38bdf8] to-[#0284c7]', // Sky to Blue
      shadow: 'shadow-blue-100 border-blue-200/80',
      tagClass: 'text-blue-700 bg-blue-50 border-blue-100',
      label: 'Estudo 📝',
      icon: BookOpen
    };
  }
  
  // Sleep/Rest
  if (text.includes('dormir') || text.includes('cama') || text.includes('deitar') || text.includes('sono') || text.includes('descansar') || text.includes('cochilar') || text.includes('relaxar')) {
    return {
      gradient: 'from-[#6366f1] to-[#4338ca]', // Indigo to Dark Indigo
      shadow: 'shadow-indigo-100 border-indigo-200/80',
      tagClass: 'text-indigo-700 bg-indigo-50 border-indigo-100',
      label: 'Descanso 🌙',
      icon: Bed
    };
  }
  
  // Play/Default Play
  return {
    gradient: 'from-[#c084fc] to-[#db2777]', // Purple to Pink
    shadow: 'shadow-pink-100 border-purple-200/80',
    tagClass: 'text-purple-700 bg-purple-50 border-purple-100',
    label: 'Diversão 🎮',
    icon: Gamepad2
  };
};

