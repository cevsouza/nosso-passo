"use client";
import React from 'react';
import { motion } from 'framer-motion';

interface RoutineIllustrationProps {
  category: 'Higiene 🫧' | 'Refeição 🍎' | 'Estudo 📝' | 'Descanso 🌙' | 'Diversão 🎮' | string;
  size?: number;
}

export const RoutineIllustration: React.FC<RoutineIllustrationProps> = ({ 
  category, 
  size = 150 
}) => {
  // Normalize category key
  const getNormCategory = (): 'hygiene' | 'meal' | 'study' | 'rest' | 'play' => {
    const text = category.toLowerCase();
    if (text.includes('higiene') || text.includes('dente') || text.includes('banho') || text.includes('lavar')) return 'hygiene';
    if (text.includes('refeição') || text.includes('comer') || text.includes('almoço') || text.includes('jantar') || text.includes('café')) return 'meal';
    if (text.includes('estudo') || text.includes('escola') || text.includes('dever') || text.includes('ler')) return 'study';
    if (text.includes('descanso') || text.includes('dormir') || text.includes('sono') || text.includes('cama')) return 'rest';
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

  const bounceTransition = {
    duration: 1.8,
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
        {/* --- 1. HYGIENE: Puppy in a Bubble Bath --- */}
        {normCat === 'hygiene' && (
          <g>
            {/* Background glowing circle */}
            <circle cx="100" cy="100" r="75" fill="hsl(174, 75%, 93%)" opacity="0.65" />
            
            {/* Bubbles floating slowly in background */}
            <motion.circle cx="45" cy="110" r="9" fill="rgba(45, 212, 191, 0.35)" stroke="#2dd4bf" strokeWidth="1.2" animate={{ y: [0, -60, 0], x: [0, 5, -3, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }} />
            <motion.circle cx="155" cy="95" r="13" fill="rgba(45, 212, 191, 0.3)" stroke="#2dd4bf" strokeWidth="1.2" animate={{ y: [0, -55, 0], x: [0, -6, 4, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }} />
            <motion.circle cx="100" cy="130" r="7" fill="rgba(45, 212, 191, 0.4)" stroke="#2dd4bf" strokeWidth="1.2" animate={{ y: [0, -70, 0], x: [0, 4, -4, 0] }} transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }} />

            {/* PUPPY IN BATHTUB */}
            <motion.g animate={{ y: [0, -3, 3, 0] }} transition={floatTransition}>
              {/* Ears */}
              <path d="M 65 65 C 57 48, 41 52, 37 65 C 33 77, 55 80, 59 75 Z" fill="#2d3748" />
              <path d="M 59 67 C 53 57, 45 60, 43 68 C 40 76, 52 77, 54 74 Z" fill="#fed7d7" />
              
              <path d="M 135 65 C 143 48, 159 52, 163 65 C 167 77, 145 80, 141 75 Z" fill="#2d3748" />
              <path d="M 141 67 C 147 57, 155 60, 157 68 C 160 76, 148 77, 146 74 Z" fill="#fed7d7" />

              {/* Head Base */}
              <path d="M 65 78 C 52 78, 52 112, 74 121 C 82 125, 118 125, 126 121 C 148 112, 148 78, 135 78 Z" fill="#2d3748" />
              <path d="M 93 61 C 95 61, 105 61, 107 61 C 111 78, 120 91, 120 102 C 120 114, 111 121, 100 121 C 89 121, 80 114, 80 102 C 80 91, 89 78, 93 61 Z" fill="#ffffff" />
              
              {/* Nose */}
              <path d="M 95 99 C 95 99, 100 95, 105 99 C 107 101, 103 106, 100 106 C 97 106, 93 101, 95 99 Z" fill="#1a202c" />
              
              {/* Smile */}
              <path d="M 91 109 C 94 112, 100 112, 100 109 C 100 112, 106 112, 109 109" stroke="#2d3748" strokeWidth="2.2" strokeLinecap="round" fill="none" />

              {/* Eyes */}
              <circle cx="76" cy="89" r="8" fill="#ffffff" />
              <circle cx="76" cy="89" r="6" fill="#4a3728" />
              <circle cx="76" cy="89" r="4" fill="#1a202c" />
              <circle cx="74" cy="87" r="1.5" fill="#ffffff" />
              
              <circle cx="124" cy="89" r="8" fill="#ffffff" />
              <circle cx="124" cy="89" r="6" fill="#4a3728" />
              <circle cx="124" cy="89" r="4" fill="#1a202c" />
              <circle cx="122" cy="87" r="1.5" fill="#ffffff" />

              {/* White suds (bubble hat) on top of head */}
              <circle cx="85" cy="53" r="11" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
              <circle cx="100" cy="47" r="14" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
              <circle cx="115" cy="53" r="11" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
              <circle cx="92" cy="45" r="9" fill="#ffffff" />
              <circle cx="108" cy="45" r="9" fill="#ffffff" />

              {/* Green Toothbrush held in paw */}
              <path d="M 45 105 L 32 120" stroke="#0d9488" strokeWidth="6" strokeLinecap="round" />
              <path d="M 32 120 C 30 122, 27 121, 26 123" stroke="#ffffff" strokeWidth="7" strokeLinecap="round" />
            </motion.g>

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

        {/* --- 2. MEAL: Puppy eating with Bib --- */}
        {normCat === 'meal' && (
          <g>
            {/* Background glowing circle */}
            <circle cx="100" cy="100" r="75" fill="hsl(35, 95%, 93%)" opacity="0.65" />
            
            {/* PUPPY CHARACTER */}
            <motion.g animate={{ y: [0, -3, 3, 0] }} transition={floatTransition}>
              {/* Ears */}
              <path d="M 62 50 C 54 33, 38 37, 34 50 C 30 62, 52 65, 56 60 Z" fill="#2d3748" />
              <path d="M 56 52 C 50 42, 42 45, 40 53 C 37 61, 49 62, 51 59 Z" fill="#fed7d7" />
              
              <path d="M 138 50 C 146 33, 162 37, 166 50 C 170 62, 148 65, 144 60 Z" fill="#2d3748" />
              <path d="M 144 52 C 150 42, 158 45, 160 53 C 163 61, 151 62, 149 59 Z" fill="#fed7d7" />

              {/* Head Base */}
              <path d="M 62 63 C 49 63, 49 97, 71 106 C 79 110, 121 110, 129 106 C 151 97, 151 63, 138 63 Z" fill="#2d3748" />
              <path d="M 93 46 C 95 46, 105 46, 107 46 C 111 63, 120 76, 120 87 C 120 99, 111 106, 100 106 C 89 106, 80 99, 80 87 C 80 76, 89 46, 93 46 Z" fill="#ffffff" />
              
              {/* Nose */}
              <path d="M 95 84 C 95 84, 100 80, 105 84 C 107 86, 103 91, 100 91 C 97 91, 93 86, 95 84 Z" fill="#1a202c" />
              
              {/* Smile */}
              <path d="M 91 94 C 94 97, 100 97, 100 94 C 100 97, 106 97, 109 94" stroke="#2d3748" strokeWidth="2.2" strokeLinecap="round" fill="none" />

              {/* Eyes */}
              <circle cx="76" cy="74" r="8" fill="#ffffff" />
              <circle cx="76" cy="74" r="6" fill="#4a3728" />
              <circle cx="76" cy="74" r="4" fill="#1a202c" />
              <circle cx="74" cy="72" r="1.5" fill="#ffffff" />
              
              <circle cx="124" cy="74" r="8" fill="#ffffff" />
              <circle cx="124" cy="74" r="6" fill="#4a3728" />
              <circle cx="124" cy="74" r="4" fill="#1a202c" />
              <circle cx="122" cy="72" r="1.5" fill="#ffffff" />

              {/* Body */}
              <path d="M 65 106 L 135 106 L 145 150 L 55 150 Z" fill="#2d3748" />

              {/* Orange Bib with small white bone */}
              <path d="M 80 106 C 80 106, 74 135, 100 135 C 126 135, 120 106, 120 106 Z" fill="#ea580c" />
              {/* Small white bone on bib */}
              <path d="M 94 120 C 93 118, 91 118, 91 120 C 91 122, 93 122, 94 120 Z" fill="#ffffff" />
              <rect x="94.5" y="119" width="11" height="2" fill="#ffffff" />
              <path d="M 106 120 C 107 118, 109 118, 109 120 C 109 122, 107 122, 106 120 Z" fill="#ffffff" />

              {/* Paw holding spoon */}
              <path d="M 132 125 C 137 125, 142 135, 137 140" stroke="#cbd5e1" strokeWidth="6" strokeLinecap="round" />
            </motion.g>

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

        {/* --- 3. STUDY: Puppy Studying with Red Glasses --- */}
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

            {/* PUPPY IN LUDIC POSITION */}
            <motion.g animate={{ y: [0, -3, 3, 0] }} transition={floatTransition}>
              {/* Ears */}
              <path d="M 64 62 C 56 45, 40 49, 36 62 C 32 74, 54 77, 58 72 Z" fill="#2d3748" />
              <path d="M 58 64 C 52 54, 44 57, 42 65 C 39 73, 51 74, 53 71 Z" fill="#fed7d7" />
              
              <path d="M 136 62 C 144 45, 160 49, 164 62 C 168 74, 146 77, 142 72 Z" fill="#2d3748" />
              <path d="M 142 64 C 148 54, 156 57, 158 65 C 161 73, 149 74, 147 71 Z" fill="#fed7d7" />

              {/* Head Base */}
              <path d="M 64 75 C 51 75, 51 109, 73 118 C 81 122, 119 122, 127 118 C 149 109, 149 75, 136 75 Z" fill="#2d3748" />
              <path d="M 93 58 C 95 58, 105 58, 107 58 C 111 75, 120 88, 120 99 C 120 111, 111 118, 100 118 C 89 118, 80 111, 80 99 C 80 88, 89 58, 93 58 Z" fill="#ffffff" />
              
              {/* Nose */}
              <path d="M 95 96 C 95 96, 100 92, 105 96 C 107 98, 103 103, 100 103 C 97 103, 93 98, 95 96 Z" fill="#1a202c" />
              
              {/* Smile */}
              <path d="M 91 106 C 94 109, 100 109, 100 106 C 100 109, 106 109, 109 106" stroke="#2d3748" strokeWidth="2.2" strokeLinecap="round" fill="none" />

              {/* Eyes */}
              <circle cx="76" cy="86" r="8" fill="#ffffff" />
              <circle cx="76" cy="86" r="6" fill="#4a3728" />
              <circle cx="76" cy="86" r="4" fill="#1a202c" />
              <circle cx="74" cy="84" r="1.5" fill="#ffffff" />
              
              <circle cx="124" cy="86" r="8" fill="#ffffff" />
              <circle cx="124" cy="86" r="6" fill="#4a3728" />
              <circle cx="124" cy="86" r="4" fill="#1a202c" />
              <circle cx="122" cy="84" r="1.5" fill="#ffffff" />

              {/* Red smart glasses! */}
              <circle cx="76" cy="86" r="16" stroke="#dc2626" strokeWidth="2.5" fill="none" />
              <circle cx="124" cy="86" r="16" stroke="#dc2626" strokeWidth="2.5" fill="none" />
              <line x1="92" y1="86" x2="108" y2="86" stroke="#dc2626" strokeWidth="2.5" />

              {/* Body / Shoulders */}
              <path d="M 68 118 L 132 118 L 140 145 L 60 145 Z" fill="#2d3748" />
              {/* White Ruff */}
              <path d="M 85 118 C 85 118, 80 135, 100 135 C 120 135, 115 118, 115 118 Z" fill="#ffffff" />
            </motion.g>

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

        {/* --- 4. REST: Puppy Sleeping Curl in Basket --- */}
        {normCat === 'rest' && (
          <g>
            {/* Background glowing circle */}
            <circle cx="100" cy="100" r="75" fill="hsl(230, 75%, 93%)" opacity="0.65" />
            
            {/* Twinkling cozy moon in background */}
            <motion.path d="M 125 45 C 110 45, 105 75, 125 85 C 130 85, 135 83, 138 80 C 128 81, 118 75, 118 63 C 118 55, 125 48, 130 45 Z" fill="#fef08a" animate={{ y: [0, -3, 0] }} transition={floatTransition} />

            {/* Zzz indicators */}
            <motion.text x="135" y="95" fill="#a5b4fc" fontSize="12" fontWeight="extrabold" animate={{ opacity: [0, 0.8, 0], y: [95, 80], x: [135, 140] }} transition={{ duration: 2.8, repeat: Infinity, delay: 0 }} >z</motion.text>
            <motion.text x="147" y="85" fill="#818cf8" fontSize="16" fontWeight="extrabold" animate={{ opacity: [0, 0.8, 0], y: [85, 65], x: [147, 154] }} transition={{ duration: 2.8, repeat: Infinity, delay: 0.9 }} >Z</motion.text>
            <motion.text x="160" y="75" fill="#6366f1" fontSize="22" fontWeight="extrabold" animate={{ opacity: [0, 0.8, 0], y: [75, 50], x: [160, 168] }} transition={{ duration: 2.8, repeat: Infinity, delay: 1.8 }} >Z</motion.text>

            {/* COZY BASKET & SLEEPING PUPPY */}
            <motion.g animate={{ scale: [1, 1.02, 1] }} transition={breatheTransition} style={{ originX: 0.5, originY: 0.7 }}>
              
              {/* Wicker Basket Back rim */}
              <ellipse cx="100" cy="138" rx="65" ry="22" fill="#92400e" stroke="#78350f" strokeWidth="2" />
              
              {/* Cozy Pillow Inside Basket */}
              <ellipse cx="100" cy="138" rx="55" ry="15" fill="#fecaca" />

              {/* SLEEPING PUPPY CURLED UP */}
              <g>
                {/* Ears folded back */}
                <path d="M 68 116 C 62 106, 52 110, 52 116 C 52 122, 65 125, 68 122 Z" fill="#2d3748" />
                <path d="M 108 112 C 114 102, 124 106, 124 112 C 124 118, 111 121, 108 118 Z" fill="#2d3748" />

                {/* Head curled */}
                <path d="M 65 110 C 56 110, 56 132, 73 138 C 80 142, 105 142, 112 138 C 128 132, 128 110, 118 110 Z" fill="#2d3748" />
                <path d="M 85 96 C 87 96, 95 96, 97 96 C 100 110, 108 120, 108 128 C 108 137, 100 138, 92 138 C 83 138, 76 137, 76 128 C 76 120, 83 110, 85 96 Z" fill="#ffffff" />
                
                {/* Nose */}
                <path d="M 87 122 C 87 122, 91 119, 95 122 C 97 124, 94 128, 92 128 C 90 128, 86 124, 87 122 Z" fill="#1a202c" />

                {/* Cozy closed eyes */}
                <path d="M 68 118 Q 73 123 78 118" stroke="#1a202c" strokeWidth="2" strokeLinecap="round" fill="none" />
                <path d="M 106 116 Q 111 121 116 116" stroke="#1a202c" strokeWidth="2" strokeLinecap="round" fill="none" />
              </g>

              {/* COZY BLUE STAR BLANKET covering the puppy's body */}
              <path d="M 46 135 C 46 135, 75 120, 110 130 C 145 120, 154 135, 154 135 L 148 156 C 148 156, 100 162, 52 156 Z" fill="#2563eb" />
              {/* Star prints on blanket */}
              <polygon points="65,138 67,141 71,141 68,143 69,147 65,145 61,147 62,143 59,141 63,141" fill="#fef08a" />
              <polygon points="120,136 122,139 126,139 123,141 124,145 120,143 116,145 117,141 114,139 118,139" fill="#fef08a" />
              <polygon points="92,143 94,146 98,146 95,148 96,152 92,150 88,152 89,148 86,146 90,146" fill="#fef08a" />

              {/* Basket Front rim */}
              <path d="M 35 138 C 35 138, 30 168, 100 168 C 170 168, 165 138, 165 138 L 158 160 C 158 160, 100 172, 42 160 Z" fill="#b45309" stroke="#78350f" strokeWidth="2.5" />
            </motion.g>
          </g>
        )}

        {/* --- 5. PLAY: Puppy playing with Beach Ball and Blocks --- */}
        {normCat === 'play' && (
          <g>
            {/* Background glowing circle */}
            <circle cx="100" cy="100" r="75" fill="hsl(328, 85%, 93%)" opacity="0.65" />
            
            {/* Playful sparks in background */}
            <motion.circle cx="45" cy="60" r="4" fill="#db2777" animate={{ scale: [0.5, 1.3, 0.5], opacity: [0.3, 0.9, 0.3] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} />
            <motion.circle cx="155" cy="130" r="5.5" fill="#c084fc" animate={{ scale: [1.3, 0.5, 1.3], opacity: [0.9, 0.3, 0.9] }} transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }} />

            {/* PUPPY IN HAPPY JUMPING FRAME */}
            <motion.g animate={{ y: [0, -12, 0] }} transition={bounceTransition} style={{ originX: 0.5, originY: 0.85 }}>
              {/* Ears wiggling up */}
              <path d="M 64 62 C 54 50, 42 55, 38 67 C 34 79, 56 82, 60 76 Z" fill="#2d3748" />
              <path d="M 58 64 C 50 56, 44 60, 42 69 C 39 77, 52 79, 54 75 Z" fill="#fed7d7" />
              
              <path d="M 136 62 C 146 50, 158 55, 162 67 C 166 79, 144 82, 140 76 Z" fill="#2d3748" />
              <path d="M 142 64 C 150 56, 156 60, 158 69 C 161 77, 148 79, 146 75 Z" fill="#fed7d7" />

              {/* Head Base */}
              <path d="M 64 75 C 51 75, 51 109, 73 118 C 81 122, 119 122, 127 118 C 149 109, 149 75, 136 75 Z" fill="#2d3748" />
              <path d="M 93 58 C 95 58, 105 58, 107 58 C 111 75, 120 88, 120 99 C 120 111, 111 118, 100 118 C 89 118, 80 111, 80 99 C 80 88, 89 58, 93 58 Z" fill="#ffffff" />
              
              {/* Nose */}
              <path d="M 95 96 C 95 96, 100 92, 105 96 C 107 98, 103 103, 100 103 C 97 103, 93 98, 95 96 Z" fill="#1a202c" />
              
              {/* Happy Open mouth with tongue! */}
              <path d="M 92 106 C 92 106, 100 117, 108 106 Z" fill="#e53e3e" />
              <path d="M 95 110 C 97 113, 103 113, 105 110 C 103 108, 97 108, 95 110 Z" fill="#fed7d7" />
              <path d="M 92 106 C 95 108, 105 108, 108 106" stroke="#2d3748" strokeWidth="2" strokeLinecap="round" fill="none" />

              {/* Eyes */}
              <circle cx="76" cy="86" r="8" fill="#ffffff" />
              <circle cx="76" cy="86" r="6" fill="#4a3728" />
              <circle cx="76" cy="86" r="4" fill="#1a202c" />
              <circle cx="74" cy="84" r="1.5" fill="#ffffff" />
              
              <circle cx="124" cy="86" r="8" fill="#ffffff" />
              <circle cx="124" cy="86" r="6" fill="#4a3728" />
              <circle cx="124" cy="86" r="4" fill="#1a202c" />
              <circle cx="122" cy="84" r="1.5" fill="#ffffff" />

              {/* Waving/jumping body & paws */}
              <path d="M 68 118 L 132 118 L 138 152 L 62 152 Z" fill="#2d3748" />
              <path d="M 85 118 C 85 118, 80 138, 100 138 C 120 138, 115 118, 115 118 Z" fill="#ffffff" />
              
              {/* Happy raised paws! */}
              <path d="M 60 120 C 50 115, 45 105, 45 105" stroke="#ffffff" strokeWidth="7.5" strokeLinecap="round" />
              <path d="M 140 120 C 150 115, 155 105, 155 105" stroke="#ffffff" strokeWidth="7.5" strokeLinecap="round" />
            </motion.g>

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
      </svg>
    </div>
  );
};
