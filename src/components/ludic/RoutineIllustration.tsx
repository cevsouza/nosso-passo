"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { HyperfocusMascot } from './HyperfocusMascot';
import { getTaskCategory } from '../../lib/sensory-standards';

interface RoutineIllustrationProps {
  category: string;
  size?: number;
  hyperfocus?: string;
}

export const RoutineIllustration: React.FC<RoutineIllustrationProps> = ({ 
  category, 
  size = 150,
  hyperfocus = ''
}) => {
  // Normalize category key based on the standard sensory-standards task categories
  const getNormCategory = (): 'hygiene' | 'meal' | 'study' | 'rest' | 'play' | 'aba' | 'ocupacional' | 'fono' | 'fisio' | 'psicoterapia' | 'psicomotricidade' => {
    const title = category.toLowerCase();
    if (title.includes('aba') || title.includes('comportamental')) return 'aba';
    if (title.includes('ocupacional') || title.includes('t.o.')) return 'ocupacional';
    if (title.includes('fono') || title.includes('fonoterapia') || title.includes('fala')) return 'fono';
    if (title.includes('fisioterapia') || title.includes('fisio')) return 'fisio';
    if (title.includes('psicoterapia') || title.includes('psicólogo') || title.includes('psicologo') || title.includes('infantil')) return 'psicoterapia';
    if (title.includes('psicomotricidade') || title.includes('psicomotor') || title.includes('motricidade') || title.includes('alongamento')) return 'psicomotricidade';

    const taskCat = getTaskCategory(category);
    const label = taskCat.label;
    if (label.includes('Higiene')) return 'hygiene';
    if (label.includes('Refeição')) return 'meal';
    if (label.includes('Estudo')) return 'study';
    if (label.includes('Descanso')) return 'rest';
    return 'play';
  };

  const normCat = getNormCategory();

  // Animation constants - low-velocity, relaxing, sensory safe
  const floatTransition = {
    duration: 3.5,
    repeat: Infinity,
    ease: "easeInOut" as const
  };

  const spinTransition = {
    duration: 10,
    repeat: Infinity,
    ease: "linear" as const
  };

  const breatheTransition = {
    duration: 4.2,
    repeat: Infinity,
    ease: "easeInOut" as const
  };

  return (
    <div 
      className="flex items-center justify-center relative select-none pointer-events-none"
      style={{ width: size, height: size }}
    >
      <svg 
        viewBox="0 0 200 200" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg" 
        className="w-full h-full"
      >
        {/* --- 1. HYGIENE: Mascot in a Bubble Bath --- */}
        {normCat === 'hygiene' && (
          <g>
            {/* Background glowing circle */}
            <circle cx="100" cy="100" r="75" fill="hsl(174, 75%, 93%)" opacity="0.65" />
            
            {/* Bubbles floating slowly in background */}
            <motion.circle cx="45" cy="110" r="9" fill="rgba(45, 212, 191, 0.35)" stroke="#2dd4bf" strokeWidth="1.2" animate={{ y: [0, -60, 0], x: [0, 5, -3, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} />
            <motion.circle cx="155" cy="95" r="13" fill="rgba(45, 212, 191, 0.3)" stroke="#2dd4bf" strokeWidth="1.2" animate={{ y: [0, -55, 0], x: [0, -6, 4, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }} />
            <motion.circle cx="100" cy="130" r="7" fill="rgba(45, 212, 191, 0.4)" stroke="#2dd4bf" strokeWidth="1.2" animate={{ y: [0, -70, 0], x: [0, 4, -4, 0] }} transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }} />

            {/* MASCOT IN BATHTUB */}
            <foreignObject x="50" y="42" width="100" height="90">
              <div className="w-full h-full flex items-center justify-center bg-transparent">
                <HyperfocusMascot hyperfocus={hyperfocus} state="idle" size={82} />
              </div>
            </foreignObject>

            {/* CLASSIC BLUE BATHTUB */}
            <motion.g animate={{ y: [2, -1, 2] }} transition={breatheTransition}>
              {/* Tub Back Shadow */}
              <path d="M 36 126 C 21 126, 21 171, 36 171 L 164 171 C 179 171, 179 126, 164 126 Z" fill="#0284c7" />
              {/* Tub Front Body */}
              <path d="M 38 122 L 162 122 C 176 122, 176 166, 162 166 L 38 166 C 24 166, 24 122, 38 122 Z" fill="#0ea5e9" />
              {/* Tub Rim (White Highlight) */}
              <path d="M 32 122 L 168 122" stroke="#e0f2fe" strokeWidth="4.5" strokeLinecap="round" />
              {/* Tub feet */}
              <rect x="52" y="166" width="10" height="8" rx="3" fill="#cbd5e1" />
              <rect x="138" y="166" width="10" height="8" rx="3" fill="#cbd5e1" />

              {/* Bubbles overflowing tub edge */}
              <circle cx="48" cy="122" r="8" fill="#ffffff" />
              <circle cx="58" cy="120" r="10" fill="#ffffff" />
              <circle cx="68" cy="123" r="6" fill="#ffffff" />
              
              <circle cx="132" cy="122" r="8" fill="#ffffff" />
              <circle cx="144" cy="120" r="11" fill="#ffffff" />
              <circle cx="156" cy="124" r="6" fill="#ffffff" />
            </motion.g>
          </g>
        )}

        {/* --- 2. MEAL: Mascot eating with Bib --- */}
        {normCat === 'meal' && (
          <g>
            {/* Background glowing circle */}
            <circle cx="100" cy="100" r="75" fill="hsl(35, 95%, 93%)" opacity="0.65" />
            
            {/* MASCOT EATING */}
            <foreignObject x="50" y="55" width="100" height="90">
              <div className="w-full h-full flex items-center justify-center bg-transparent">
                <HyperfocusMascot hyperfocus={hyperfocus} state="idle" size={82} />
              </div>
            </foreignObject>

            {/* WOODEN TABLE & RED SOUP BOWL */}
            <g>
              {/* Wooden Table Edge */}
              <rect x="25" y="145" width="150" height="35" fill="#a16207" rx="6" />
              <rect x="25" y="145" width="150" height="4" fill="#ca8a04" />

              {/* Red Soup Bowl */}
              <motion.g animate={{ scaleY: [1, 1.03, 1] }} transition={breatheTransition} style={{ originX: 0.5, originY: 0.75 }}>
                <path d="M 72 145 C 72 145, 72 170, 100 170 C 128 170, 128 145, 128 145 Z" fill="#ef4444" />
                <path d="M 68 145 L 132 145" stroke="#fca5a5" strokeWidth="3" strokeLinecap="round" />
                {/* Hot steam waves */}
                <motion.path d="M 88 135 Q 92 130 88 125" stroke="#ea580c" strokeWidth="1.5" strokeLinecap="round" fill="none" animate={{ y: [0, -8, 0], opacity: [0.3, 0.8, 0.3] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} />
                <motion.path d="M 100 137 Q 104 131 100 125" stroke="#ea580c" strokeWidth="1.5" strokeLinecap="round" fill="none" animate={{ y: [0, -10, 0], opacity: [0.3, 0.9, 0.3] }} transition={{ duration: 2.7, repeat: Infinity, ease: "easeInOut", delay: 0.4 }} />
                <motion.path d="M 112 135 Q 116 130 112 125" stroke="#ea580c" strokeWidth="1.5" strokeLinecap="round" fill="none" animate={{ y: [0, -8, 0], opacity: [0.3, 0.8, 0.3] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.8 }} />
              </motion.g>
            </g>
          </g>
        )}

        {/* --- 3. STUDY: Mascot Studying --- */}
        {normCat === 'study' && (
          <g>
            {/* Background glowing circle */}
            <circle cx="100" cy="100" r="75" fill="hsl(198, 85%, 93%)" opacity="0.65" />
            
            {/* Spinning stars of knowledge */}
            <motion.g animate={{ rotate: 360 }} transition={spinTransition} style={{ originX: 0.5, originY: 0.5 }}>
              <polygon points="50,45 52,48 56,48 53,50 54,54 50,52 46,54 47,50 44,48 48,48" fill="#eab308" />
              <polygon points="152,60 154,63 158,63 155,65 156,69 152,67 148,69 149,65 146,63 150,63" fill="#eab308" />
              <polygon points="135,145 137,148 141,148 138,150 139,154 135,152 131,154 132,150 129,148 133,148" fill="#eab308" />
            </motion.g>

            {/* Green Study Rug */}
            <ellipse cx="100" cy="155" rx="65" ry="16" fill="#86efac" opacity="0.8" />

            {/* MASCOT STUDYING */}
            <foreignObject x="50" y="45" width="100" height="90">
              <div className="w-full h-full flex items-center justify-center bg-transparent">
                <HyperfocusMascot hyperfocus={hyperfocus} state="guiding" size={82} />
              </div>
            </foreignObject>

            {/* OPEN MAGIC BOOK */}
            <motion.g animate={{ y: [1, -2, 1] }} transition={breatheTransition}>
              {/* Book cover shadow */}
              <path d="M 46 142 C 46 142, 75 152, 100 144 C 125 152, 154 142, 154 142 L 158 115 C 158 115, 125 125, 100 117 C 75 125, 42 115, 42 115 Z" fill="#0284c7" />
              {/* Pages */}
              <path d="M 48 138 C 48 138, 75 148, 100 140 C 125 148, 152 138, 152 138 L 154 111 C 154 111, 125 121, 100 113 C 75 121, 46 111, 46 111 Z" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
              {/* Text lines */}
              <path d="M 58 119 Q 72 124, 82 120 M 58 127 Q 72 132, 82 128" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
              <path d="M 118 120 Q 128 124, 142 119 M 118 128 Q 128 132, 142 127" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
            </motion.g>
          </g>
        )}

        {/* --- 4. REST: Mascot Sleeping Curl in Basket --- */}
        {normCat === 'rest' && (
          <g>
            {/* Background glowing circle */}
            <circle cx="100" cy="100" r="75" fill="hsl(230, 75%, 93%)" opacity="0.65" />
            
            {/* Twinkling cozy moon in background */}
            <motion.path d="M 125 45 C 110 45, 105 75, 125 85 C 130 85, 135 83, 138 80 C 128 81, 118 75, 118 63 C 118 55, 125 48, 130 45 Z" fill="#fef08a" animate={{ y: [0, -3, 0] }} transition={floatTransition} />

            {/* Zzz indicators */}
            <motion.text x="135" y="95" fill="#a5b4fc" fontSize="12" fontWeight="extrabold" animate={{ opacity: [0, 0.8, 0], y: [95, 80], x: [135, 140] }} transition={{ duration: 2.8, repeat: Infinity, delay: 0 }} >z</motion.text>
            <motion.text x="147" y="85" fill="#5cb3a8" fontSize="16" fontWeight="extrabold" animate={{ opacity: [0, 0.8, 0], y: [85, 65], x: [147, 154] }} transition={{ duration: 2.8, repeat: Infinity, delay: 0.9 }} >Z</motion.text>
            <motion.text x="160" y="75" fill="#2f8f86" fontSize="22" fontWeight="extrabold" animate={{ opacity: [0, 0.8, 0], y: [75, 50], x: [160, 168] }} transition={{ duration: 2.8, repeat: Infinity, delay: 1.8 }} >Z</motion.text>

            {/* COZY BASKET & SLEEPING MASCOT */}
            <motion.g animate={{ scale: [1, 1.02, 1] }} transition={breatheTransition} style={{ originX: 0.5, originY: 0.7 }}>
              
              {/* Wicker Basket Back rim */}
              <ellipse cx="100" cy="138" rx="65" ry="22" fill="#92400e" stroke="#78350f" strokeWidth="2" />
              
              {/* Cozy Pillow Inside Basket */}
              <ellipse cx="100" cy="138" rx="55" ry="15" fill="#fecaca" />

              {/* MASCOT SLEEPING */}
              <foreignObject x="50" y="66" width="100" height="90">
                <div className="w-full h-full flex items-center justify-center bg-transparent">
                  <HyperfocusMascot hyperfocus={hyperfocus} state="sleeping" size={82} />
                </div>
              </foreignObject>

              {/* COZY BLUE STAR BLANKET covering the mascot's body */}
              <path d="M 46 135 C 46 135, 75 125, 110 133 C 145 125, 154 135, 154 135 L 148 156 C 148 156, 100 162, 52 156 Z" fill="#2563eb" />
              {/* Star prints on blanket */}
              <polygon points="65,138 67,141 71,141 68,143 69,147 65,145 61,147 62,143 59,141 63,141" fill="#fef08a" />
              <polygon points="120,136 122,139 126,139 123,141 124,145 120,143 116,145 117,141 114,139 118,139" fill="#fef08a" />
              <polygon points="92,143 94,146 98,146 95,148 96,152 92,150 88,152 89,148 86,146 90,146" fill="#fef08a" />

              {/* Basket Front rim */}
              <path d="M 35 138 C 35 138, 30 168, 100 168 C 170 168, 165 138, 165 138 L 158 160 C 158 160, 100 172, 42 160 Z" fill="#b45309" stroke="#78350f" strokeWidth="2.5" />
            </motion.g>
          </g>
        )}

        {/* --- 5. PLAY: Mascot playing with Beach Ball and Blocks --- */}
        {normCat === 'play' && (
          <g>
            {/* Background glowing circle */}
            <circle cx="100" cy="100" r="75" fill="hsl(328, 85%, 93%)" opacity="0.65" />
            
            {/* Playful sparks in background */}
            <motion.circle cx="45" cy="60" r="4" fill="#db2777" animate={{ scale: [0.5, 1.3, 0.5], opacity: [0.3, 0.9, 0.3] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} />
            <motion.circle cx="155" cy="130" r="5.5" fill="#c084fc" animate={{ scale: [1.3, 0.5, 1.3], opacity: [0.9, 0.3, 0.9] }} transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }} />

            {/* MASCOT IN HAPPY JUMPING FRAME */}
            <foreignObject x="50" y="50" width="100" height="90">
              <div className="w-full h-full flex items-center justify-center bg-transparent">
                <HyperfocusMascot hyperfocus={hyperfocus} state="celebrating" size={82} />
              </div>
            </foreignObject>

            {/* COLORFUL BEACH BALL & BLOCKS ON FLOOR */}
            <g>
              {/* Toy Block Red */}
              <rect x="35" y="145" width="22" height="15" fill="#ef4444" rx="3" />
              <circle cx="40" cy="143" r="2" fill="#f87171" />
              <circle cx="52" cy="143" r="2" fill="#f87171" />

              {/* Toy Block Yellow */}
              <rect x="48" y="136" width="22" height="12" fill="#eab308" rx="2" />
              <circle cx="53" cy="134" r="1.5" fill="#fde047" />
              <circle cx="65" cy="134" r="1.5" fill="#fde047" />

              {/* Colorful Beach Ball */}
              <motion.g animate={{ rotate: 360 }} transition={spinTransition} style={{ originX: 0.725, originY: 0.725 }}>
                <circle cx="145" cy="145" r="22" fill="#3b82f6" />
                {/* Yellow segment */}
                <path d="M 145 145 L 123 145 A 22 22 0 0 1 145 123 Z" fill="#fbbf24" />
                {/* Red segment */}
                <path d="M 145 145 L 145 167 A 22 22 0 0 1 123 145 Z" fill="#ef4444" />
                {/* White segment */}
                <path d="M 145 145 L 167 145 A 22 22 0 0 1 145 167 Z" fill="#ffffff" />
                <circle cx="145" cy="145" r="4.5" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
              </motion.g>
            </g>
          </g>
        )}

        {/* --- 6. ABA: Mascot with puzzle and shapes --- */}
        {normCat === 'aba' && (
          <g>
            <circle cx="100" cy="100" r="75" fill="hsl(262, 80%, 93%)" opacity="0.65" />
            <foreignObject x="50" y="45" width="100" height="90">
              <div className="w-full h-full flex items-center justify-center bg-transparent">
                <HyperfocusMascot hyperfocus={hyperfocus} state="guiding" size={82} />
              </div>
            </foreignObject>
            {/* Puzzle piece matching */}
            <motion.g animate={{ y: [0, -3, 0] }} transition={floatTransition}>
              <rect x="55" y="138" width="22" height="22" fill="#5cb3a8" rx="4" />
              <circle cx="66" cy="138" r="6" fill="#5cb3a8" />
              <circle cx="77" cy="149" r="6" fill="#f8fafc" />
              
              <rect x="120" y="132" width="22" height="22" fill="#f43f5e" rx="4" />
              <circle cx="131" cy="143" r="6" fill="#f43f5e" />
              <circle cx="120" cy="143" r="6" fill="#f8fafc" />
            </motion.g>
          </g>
        )}

        {/* --- 7. OCUPACIONAL: Mascot with sensory pegboard --- */}
        {normCat === 'ocupacional' && (
          <g>
            <circle cx="100" cy="100" r="75" fill="hsl(187, 75%, 93%)" opacity="0.65" />
            <foreignObject x="50" y="45" width="100" height="90">
              <div className="w-full h-full flex items-center justify-center bg-transparent">
                <HyperfocusMascot hyperfocus={hyperfocus} state="idle" size={82} />
              </div>
            </foreignObject>
            {/* Sensory pegboard */}
            <g>
              <rect x="45" y="140" width="110" height="15" fill="#d97706" rx="4" />
              {/* Colorful pegs */}
              <circle cx="65" cy="133" r="6" fill="#10b981" />
              <rect x="63" y="133" width="4" height="10" fill="#10b981" />
              
              <circle cx="100" cy="130" r="6" fill="#3b82f6" />
              <rect x="98" y="130" width="4" height="12" fill="#3b82f6" />
              
              <circle cx="135" cy="133" r="6" fill="#ef4444" />
              <rect x="133" y="133" width="4" height="10" fill="#ef4444" />
            </g>
          </g>
        )}

        {/* --- 8. FONO: Mascot speaking with sound waves --- */}
        {normCat === 'fono' && (
          <g>
            <circle cx="100" cy="100" r="75" fill="hsl(24, 85%, 93%)" opacity="0.65" />
            <foreignObject x="50" y="45" width="100" height="90">
              <div className="w-full h-full flex items-center justify-center bg-transparent">
                <HyperfocusMascot hyperfocus={hyperfocus} state="celebrating" size={82} />
              </div>
            </foreignObject>
            {/* Sound waves & microphone */}
            <g>
              {/* Vintage Microphone */}
              <rect x="130" y="125" width="12" height="20" rx="6" fill="#94a3b8" stroke="#475569" strokeWidth="1.5" />
              <line x1="136" y1="145" x2="136" y2="158" stroke="#475569" strokeWidth="2.5" />
              <circle cx="136" cy="158" r="6" fill="#475569" />
              {/* Animated speech sound waves */}
              <motion.path d="M 115 125 A 15 15 0 0 0 115 145" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" fill="none" animate={{ scale: [1, 1.15, 1], opacity: [0.4, 1, 0.4] }} transition={breatheTransition} />
              <motion.path d="M 105 120 A 25 25 0 0 0 105 150" stroke="#fdba74" strokeWidth="2" strokeLinecap="round" fill="none" animate={{ scale: [0.95, 1.1, 0.95], opacity: [0.3, 0.8, 0.3] }} transition={{ ...breatheTransition, delay: 0.5 }} />
            </g>
          </g>
        )}

        {/* --- 9. FISIO: Mascot on Pilates Ball --- */}
        {normCat === 'fisio' && (
          <g>
            <circle cx="100" cy="100" r="75" fill="hsl(142, 70%, 93%)" opacity="0.65" />
            {/* Pilates Ball behind/under mascot */}
            <motion.circle cx="135" cy="138" r="30" fill="#10b981" animate={{ y: [0, -4, 0] }} transition={floatTransition} />
            <motion.path d="M 110 120 Q 125 130 145 120" stroke="#047857" strokeWidth="3" fill="none" />
            
            <foreignObject x="35" y="45" width="100" height="90">
              <div className="w-full h-full flex items-center justify-center bg-transparent">
                <HyperfocusMascot hyperfocus={hyperfocus} state="guiding" size={82} />
              </div>
            </foreignObject>
          </g>
        )}

        {/* --- 10. PSICOTERAPIA: Mascot talking about emotions --- */}
        {normCat === 'psicoterapia' && (
          <g>
            <circle cx="100" cy="100" r="75" fill="hsl(215, 80%, 94%)" opacity="0.65" />
            <foreignObject x="50" y="52" width="100" height="90">
              <div className="w-full h-full flex items-center justify-center bg-transparent">
                <HyperfocusMascot hyperfocus={hyperfocus} state="idle" size={82} />
              </div>
            </foreignObject>
            {/* Speech bubble with heart */}
            <motion.g animate={{ y: [-2, 2, -2] }} transition={floatTransition}>
              <path d="M 125 90 C 125 78, 165 78, 165 90 C 165 98, 145 105, 145 110 L 140 115 L 141 109 C 125 109, 125 96, 125 90 Z" fill="#ffffff" stroke="#2f8f86" strokeWidth="1.5" />
              {/* Tiny Red Heart */}
              <path d="M 145 88 C 143 85, 140 85, 139 88 L 145 94 L 151 88 C 150 85, 147 85, 145 88 Z" fill="#ef4444" transform="scale(0.85) translate(25, 16)" />
            </motion.g>
          </g>
        )}

        {/* --- 11. PSICOMOTRICIDADE: Mascot stepping on balance stones --- */}
        {normCat === 'psicomotricidade' && (
          <g>
            <circle cx="100" cy="100" r="75" fill="hsl(330, 80%, 93%)" opacity="0.65" />
            {/* Balance stones */}
            <ellipse cx="65" cy="150" rx="22" ry="7" fill="#f97316" />
            <ellipse cx="100" cy="155" rx="20" ry="7" fill="#10b981" />
            <ellipse cx="135" cy="148" rx="22" ry="7" fill="#8b5cf6" />
            
            <foreignObject x="50" y="46" width="100" height="90">
              <div className="w-full h-full flex items-center justify-center bg-transparent">
                <HyperfocusMascot hyperfocus={hyperfocus} state="celebrating" size={82} />
              </div>
            </foreignObject>
          </g>
        )}
      </svg>
    </div>
  );
};
