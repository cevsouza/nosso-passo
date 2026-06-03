"use client";
import React from 'react';
import { motion } from 'framer-motion';

export type CollieState = 'idle' | 'guiding' | 'celebrating' | 'sleeping';

interface BorderCollieProps {
  state?: CollieState;
  size?: number;
}

export const BorderCollie: React.FC<BorderCollieProps> = ({ 
  state = 'idle', 
  size = 200 
}) => {
  // Common animation settings for safety (smooth, moderate speed, no flashes)
  const pulseTransition = {
    duration: 3,
    repeat: Infinity,
    ease: "easeInOut"
  } as const;

  const tailTransition = {
    duration: 1.8,
    repeat: Infinity,
    ease: "easeInOut"
  } as const;

  return (
    <div 
      className="flex flex-col items-center justify-center relative select-none"
      style={{ width: size, height: size }}
    >
      <motion.svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        animate={
          state === 'celebrating' 
            ? { y: [0, -8, 0, -8, 0], scale: [1, 1.02, 1] } 
            : state === 'sleeping' 
            ? { y: 2, scale: 0.98 } 
            : { y: [0, -2, 0] }
        }
        transition={
          state === 'celebrating'
            ? { duration: 1.5, ease: "easeInOut" }
            : state === 'sleeping'
            ? { duration: 0.5 }
            : { duration: 4, repeat: Infinity, ease: "easeInOut" }
        }
      >
        {/* Sleeping Zzz indicator */}
        {state === 'sleeping' && (
          <>
            <motion.text
              x="145" y="45"
              fill="hsl(207, 85%, 60%)"
              fontSize="16"
              fontWeight="bold"
              animate={{ opacity: [0, 1, 0], y: [45, 30] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0 }}
            >
              z
            </motion.text>
            <motion.text
              x="160" y="35"
              fill="hsl(207, 85%, 60%)"
              fontSize="22"
              fontWeight="bold"
              animate={{ opacity: [0, 1, 0], y: [35, 15] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
            >
              Z
            </motion.text>
            <motion.text
              x="175" y="25"
              fill="hsl(207, 85%, 60%)"
              fontSize="28"
              fontWeight="bold"
              animate={{ opacity: [0, 1, 0], y: [25, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 1.2 }}
            >
              Z
            </motion.text>
          </>
        )}

        {/* Tail (Curved and animated) */}
        <motion.path
          d="M 65 140 C 45 135, 25 155, 15 145 C 5 135, 10 115, 25 125 C 35 130, 45 125, 55 130"
          stroke="#2d3748"
          strokeWidth="14"
          strokeLinecap="round"
          fill="none"
          style={{ originX: 0.32, originY: 0.7 }}
          animate={
            state === 'sleeping'
              ? { rotate: 0 }
              : state === 'celebrating'
              ? { rotate: [-15, 20, -15, 20, -15] }
              : { rotate: [-4, 6, -4] }
          }
          transition={state === 'celebrating' ? { duration: 1.5 } : tailTransition}
        />
        {/* Tail Tip (Border Collie typical white tip) */}
        <motion.path
          d="M 22 148 C 16 151, 15 145, 15 145 C 5 135, 10 115, 22 122"
          stroke="#ffffff"
          strokeWidth="12"
          strokeLinecap="round"
          fill="none"
          style={{ originX: 0.32, originY: 0.7 }}
          animate={
            state === 'sleeping'
              ? { rotate: 0 }
              : state === 'celebrating'
              ? { rotate: [-15, 20, -15, 20, -15] }
              : { rotate: [-4, 6, -4] }
          }
          transition={state === 'celebrating' ? { duration: 1.5 } : tailTransition}
        />

        {/* Body (Back/Shoulders) */}
        <path
          d="M 60 120 L 140 120 L 155 180 L 45 180 Z"
          fill="#2d3748" /* Charcoal black */
        />

        {/* White Chest / Ruff (Fluffy white bib of Border Collies) */}
        <path
          d="M 80 120 C 80 120, 70 145, 80 170 C 85 180, 115 180, 120 170 C 130 145, 120 120, 120 120 Z"
          fill="#ffffff"
        />
        {/* White Ruff fluff lines */}
        <path d="M 95 125 C 95 135, 105 135, 105 125" stroke="#edf2f7" strokeWidth="2" strokeLinecap="round" />
        <path d="M 90 140 C 90 150, 110 150, 110 140" stroke="#edf2f7" strokeWidth="2" strokeLinecap="round" />

        {/* Front Left Paw */}
        <motion.path
          d="M 65 170 L 65 190 C 65 195, 50 195, 50 190 L 50 170 Z"
          fill="#ffffff"
          stroke="#e2e8f0"
          strokeWidth="2"
          animate={state === 'sleeping' ? { y: 2 } : {}}
        />
        
        {/* Front Right Paw / Waving paw for celebration */}
        <motion.path
          d="M 135 170 L 135 190 C 135 195, 150 195, 150 190 L 150 170 Z"
          fill="#ffffff"
          stroke="#e2e8f0"
          strokeWidth="2"
          style={{ originX: 0.67, originY: 0.85 }}
          animate={
            state === 'celebrating'
              ? { rotate: [0, -30, -10, -30, -10, 0], y: [0, -15, -15, -15, -15, 0] }
              : state === 'guiding'
              ? { rotate: -15, y: -4 }
              : state === 'sleeping'
              ? { y: 2 }
              : { rotate: 0 }
          }
          transition={{ duration: state === 'celebrating' ? 2 : 0.4 }}
        />

        {/* Head Base */}
        <g>
          {/* Black cheeks and sides */}
          <path
            d="M 60 70 C 45 70, 45 110, 70 120 C 80 125, 120 125, 130 120 C 155 110, 155 70, 140 70 Z"
            fill="#2d3748"
          />

          {/* White Center Blaze & Muzzle (Border Collie marking) */}
          <path
            d="M 92 50 C 95 50, 105 50, 108 50 C 112 70, 122 85, 122 98 C 122 112, 112 120, 100 120 C 88 120, 78 112, 78 98 C 78 85, 88 70, 92 50 Z"
            fill="#ffffff"
          />
        </g>

        {/* Nose (Soft round inverted triangle) */}
        <path
          d="M 94 95 C 94 95, 100 91, 106 95 C 108 97, 103 103, 100 103 C 97 103, 92 97, 94 95 Z"
          fill="#1a202c"
        />

        {/* Soft, low-contrast friendly mouth */}
        {state === 'sleeping' ? (
          // Sleeping mouth: extremely simple soft smile line
          <path
            d="M 92 107 C 96 110, 104 110, 108 107"
            stroke="#4a5568"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        ) : state === 'celebrating' ? (
          // Open happy mouth with tongue
          <g>
            <path
              d="M 90 106 C 90 106, 100 118, 110 106 Z"
              fill="#e53e3e"
            />
            <path
              d="M 94 111 C 97 115, 103 115, 106 111 C 103 108, 97 108, 94 111 Z"
              fill="#fed7d7"
            />
            <path
              d="M 90 106 C 95 108, 105 108, 110 106"
              stroke="#2d3748"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
          </g>
        ) : (
          // Normal soft smile
          <path
            d="M 90 106 C 93 110, 100 110, 100 107 C 100 110, 107 110, 110 106"
            stroke="#2d3748"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
        )}

        {/* Eyes (Sensory friendly, large, expressive, warm dark amber) */}
        <g>
          {/* Left Eye */}
          {state === 'sleeping' ? (
            // Curved closed eye lines for sleeping
            <path
              d="M 68 85 Q 75 92 82 85"
              stroke="#4a5568"
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
            />
          ) : (
            <g>
              <circle cx="75" cy="83" r="10" fill="#ffffff" />
              <motion.circle 
                cx="75" 
                cy="83" 
                r="7.5" 
                fill="#4a3728" /* Warm brown iris */
                animate={state === 'celebrating' ? { scale: 1.08 } : {}}
              />
              <circle cx="75" cy="83" r="5" fill="#1a202c" /> {/* Pupil */}
              <circle cx="73" cy="80" r="2.2" fill="#ffffff" /> {/* Light reflection */}
              {/* Eye Blinking (standard 4s routine for micro-engagement) */}
              <motion.path
                d="M 64 71 H 86 V 95 H 64 Z"
                fill="#2d3748"
                style={{ originX: 0.375, originY: 0.415 }}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: [0, 0, 1, 0, 0] }}
                transition={{ duration: 4, repeat: Infinity, times: [0, 0.95, 0.97, 0.99, 1] }}
              />
            </g>
          )}

          {/* Right Eye */}
          {state === 'sleeping' ? (
            <path
              d="M 118 85 Q 125 92 132 85"
              stroke="#4a5568"
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
            />
          ) : (
            <g>
              <circle cx="125" cy="83" r="10" fill="#ffffff" />
              <motion.circle 
                cx="125" 
                cy="83" 
                r="7.5" 
                fill="#4a3728"
                animate={state === 'celebrating' ? { scale: 1.08 } : {}}
              />
              <circle cx="125" cy="83" r="5" fill="#1a202c" />
              <circle cx="123" cy="80" r="2.2" fill="#ffffff" />
              {/* Eye Blinking */}
              <motion.path
                d="M 114 71 H 136 V 95 H 114 Z"
                fill="#ffffff" /* White blaze context */
                style={{ originX: 0.625, originY: 0.415 }}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: [0, 0, 1, 0, 0] }}
                transition={{ duration: 4, repeat: Infinity, times: [0, 0.95, 0.97, 0.99, 1] }}
              />
            </g>
          )}
        </g>

        {/* Ears (Border Collie standard semi-erect ears with smooth movement) */}
        {/* Left Ear */}
        <motion.path
          d="M 60 55 C 50 35, 30 40, 25 55 C 20 70, 48 74, 52 68 Z"
          fill="#2d3748"
          style={{ originX: 0.27, originY: 0.32 }}
          animate={
            state === 'celebrating'
              ? { rotate: [0, 10, -5, 10, 0], y: [0, -3, 0] }
              : state === 'sleeping'
              ? { rotate: -12 }
              : { rotate: [0, 3, 0] }
          }
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Inner Left Ear pink color */}
        <motion.path
          d="M 53 57 C 46 45, 36 48, 33 58 C 30 68, 45 70, 47 66 Z"
          fill="#fed7d7"
          style={{ originX: 0.27, originY: 0.32 }}
          animate={
            state === 'celebrating'
              ? { rotate: [0, 10, -5, 10, 0], y: [0, -3, 0] }
              : state === 'sleeping'
              ? { rotate: -12 }
              : { rotate: [0, 3, 0] }
          }
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Right Ear - Semi-Erect, tips slightly forward */}
        <motion.path
          d="M 140 55 C 150 35, 170 40, 175 55 C 180 70, 152 74, 148 68 Z"
          fill="#2d3748"
          style={{ originX: 0.73, originY: 0.32 }}
          animate={
            state === 'celebrating'
              ? { rotate: [0, -10, 5, -10, 0], y: [0, -3, 0] }
              : state === 'sleeping'
              ? { rotate: 12 }
              : { rotate: [0, -3, 0] }
          }
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Inner Right Ear pink color */}
        <motion.path
          d="M 147 57 C 154 45, 164 48, 167 58 C 170 68, 155 70, 153 66 Z"
          fill="#fed7d7"
          style={{ originX: 0.73, originY: 0.32 }}
          animate={
            state === 'celebrating'
              ? { rotate: [0, -10, 5, -10, 0], y: [0, -3, 0] }
              : state === 'sleeping'
              ? { rotate: 12 }
              : { rotate: [0, -3, 0] }
          }
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Eyebrows for expressions (smooth angle adjustments) */}
        {!state || state !== 'sleeping' ? (
          <g>
            <motion.path
              d="M 66 73 Q 72 70 78 73"
              stroke="#1a202c"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
              animate={state === 'celebrating' ? { y: -2, rotate: -5 } : {}}
            />
            <motion.path
              d="M 122 73 Q 128 70 134 73"
              stroke="#1a202c"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
              animate={state === 'celebrating' ? { y: -2, rotate: 5 } : {}}
            />
          </g>
        ) : null}
      </motion.svg>
    </div>
  );
};
