"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { BorderCollie, CollieState } from './BorderCollie';

interface MascotProps {
  hyperfocus?: string;
  state?: CollieState;
  size?: number;
}

export const HyperfocusMascot: React.FC<MascotProps> = ({
  hyperfocus = 'Border Collies 🐕',
  state = 'idle',
  size = 200
}) => {
  const focus = (hyperfocus || "").toLowerCase().trim();

  if (focus.includes("dino") || focus.includes("dinossauro") || focus.includes("dinosaur")) {
    return <DinosaurMascot state={state} size={size} />;
  }
  if (focus.includes("espaço") || focus.includes("astronauta") || focus.includes("space") || focus.includes("estrela") || focus.includes("star") || focus.includes("foguete") || focus.includes("rocket")) {
    return <AstronautMascot state={state} size={size} />;
  }
  if (focus.includes("minecraft") || focus.includes("bloco") || focus.includes("block")) {
    return <MinecraftMascot state={state} size={size} />;
  }
  if (focus.includes("gato") || focus.includes("cat")) {
    return <CatMascot state={state} size={size} />;
  }
  if (focus.includes("carro") || focus.includes("car")) {
    return <CarMascot state={state} size={size} />;
  }

  // Default fallback to the beautiful Border Collie
  return <BorderCollie state={state} size={size} />;
};

/* --- DINOSAUR MASCOT COMPONENT --- */
const DinosaurMascot: React.FC<{ state: CollieState; size: number }> = ({ state, size }) => {
  const tailTransition = { duration: 1.5, repeat: Infinity, ease: "easeInOut" } as const;
  return (
    <div className="flex flex-col items-center justify-center relative select-none" style={{ width: size, height: size }}>
      <motion.svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        animate={
          state === 'celebrating' 
            ? { y: [0, -10, 0, -10, 0], scale: [1, 1.05, 1] } 
            : state === 'sleeping' 
            ? { y: 3, scale: 0.97 } 
            : { y: [0, -3, 0] }
        }
        transition={
          state === 'celebrating'
            ? { duration: 1.2, ease: "easeInOut" }
            : state === 'sleeping'
            ? { duration: 0.5 }
            : { duration: 3.5, repeat: Infinity, ease: "easeInOut" }
        }
      >
        {/* Zzz for sleeping */}
        {state === 'sleeping' && (
          <>
            <motion.text x="140" y="50" fill="#a6e3a1" fontSize="16" fontWeight="bold" animate={{ opacity: [0, 1, 0], y: [50, 35] }} transition={{ duration: 2, repeat: Infinity, delay: 0 }}>z</motion.text>
            <motion.text x="155" y="40" fill="#a6e3a1" fontSize="22" fontWeight="bold" animate={{ opacity: [0, 1, 0], y: [40, 20] }} transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}>Z</motion.text>
          </>
        )}
        
        {/* Dino Tail */}
        <motion.path
          d="M 55 140 C 25 130, 15 160, 5 150 C 0 140, 20 110, 55 125"
          fill="#89dceb"
          stroke="#313244"
          strokeWidth="4"
          style={{ originX: 0.28, originY: 0.7 }}
          animate={state === 'celebrating' ? { rotate: [-20, 30, -20, 30, -20] } : { rotate: [-5, 8, -5] }}
          transition={tailTransition}
        />
        
        {/* Dino Body */}
        <path d="M 50 110 C 50 80, 130 80, 140 110 C 150 130, 140 180, 100 180 C 60 180, 50 140, 50 110 Z" fill="#a6e3a1" stroke="#313244" strokeWidth="4" />
        
        {/* Spikes on Back */}
        <path d="M 60 90 L 52 75 L 72 82 Z" fill="#f9e2af" stroke="#313244" strokeWidth="3" />
        <path d="M 85 80 L 80 62 L 98 72 Z" fill="#f9e2af" stroke="#313244" strokeWidth="3" />
        <path d="M 112 85 L 115 68 L 125 82 Z" fill="#f9e2af" stroke="#313244" strokeWidth="3" />

        {/* Dino Belly (Yellow patch) */}
        <path d="M 75 120 C 75 100, 115 100, 115 120 C 115 140, 110 170, 95 170 C 80 170, 75 140, 75 120 Z" fill="#f9e2af" />

        {/* Dino Head */}
        <motion.g
          animate={state === 'sleeping' ? { rotate: 5, y: 2 } : { y: [0, -2, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Head Base */}
          <path d="M 90 55 C 90 35, 150 35, 150 55 C 150 75, 140 95, 115 95 C 90 95, 90 75, 90 55 Z" fill="#a6e3a1" stroke="#313244" strokeWidth="4" />
          
          {/* Cute Eyes */}
          {state === 'sleeping' ? (
            <path d="M 105 58 Q 112 63 118 58 M 128 58 Q 135 63 142 58" stroke="#313244" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          ) : (
            <>
              <circle cx="112" cy="55" r="7" fill="white" stroke="#313244" strokeWidth="2" />
              <circle cx="113" cy="55" r="3.5" fill="#1e1e2e" />
              <circle cx="111" cy="53" r="1.5" fill="white" />

              <circle cx="132" cy="55" r="7" fill="white" stroke="#313244" strokeWidth="2" />
              <circle cx="133" cy="55" r="3.5" fill="#1e1e2e" />
              <circle cx="131" cy="53" r="1.5" fill="white" />
            </>
          )}

          {/* Cheeks */}
          {!state || state !== 'sleeping' ? (
            <>
              <circle cx="102" cy="65" r="3.5" fill="#f5c2e7" opacity="0.6" />
              <circle cx="142" cy="65" r="3.5" fill="#f5c2e7" opacity="0.6" />
            </>
          ) : null}

          {/* Dino Mouth/Smile */}
          {state === 'celebrating' ? (
            <path d="M 112 72 Q 122 85 132 72 Z" fill="#f38ba8" stroke="#313244" strokeWidth="2" />
          ) : (
            <path d="M 115 72 Q 122 78 129 72" stroke="#313244" strokeWidth="2" fill="none" strokeLinecap="round" />
          )}
        </motion.g>

        {/* Dino Feet */}
        <rect x="65" y="175" width="20" height="15" rx="5" fill="#a6e3a1" stroke="#313244" strokeWidth="3" />
        <rect x="105" y="175" width="20" height="15" rx="5" fill="#a6e3a1" stroke="#313244" strokeWidth="3" />
      </motion.svg>
    </div>
  );
};

/* --- ASTRONAUT/SPACE MASCOT COMPONENT --- */
const AstronautMascot: React.FC<{ state: CollieState; size: number }> = ({ state, size }) => {
  return (
    <div className="flex flex-col items-center justify-center relative select-none" style={{ width: size, height: size }}>
      <motion.svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        animate={
          state === 'celebrating'
            ? { y: [0, -12, 0, -12, 0], scale: [1, 1.04, 1], rotate: [0, 5, -5, 5, 0] }
            : state === 'sleeping'
            ? { y: 4, scale: 0.96 }
            : { y: [0, -6, 0] }
        }
        transition={
          state === 'celebrating'
            ? { duration: 1.5, ease: "easeInOut" }
            : state === 'sleeping'
            ? { duration: 0.5 }
            : { duration: 4.5, repeat: Infinity, ease: "easeInOut" }
        }
      >
        {/* Zzz for sleeping */}
        {state === 'sleeping' && (
          <>
            <motion.text x="145" y="45" fill="#cba6f7" fontSize="16" fontWeight="bold" animate={{ opacity: [0, 1, 0], y: [45, 30] }} transition={{ duration: 2, repeat: Infinity, delay: 0 }}>z</motion.text>
            <motion.text x="160" y="35" fill="#cba6f7" fontSize="22" fontWeight="bold" animate={{ opacity: [0, 1, 0], y: [35, 15] }} transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}>Z</motion.text>
          </>
        )}
        
        {/* Space Rocket/Pack Backpack */}
        <rect x="50" y="70" width="100" height="80" rx="15" fill="#cdd6f4" stroke="#313244" strokeWidth="4" />
        
        {/* Suit Body */}
        <path d="M 60 120 L 140 120 L 150 175 C 150 180, 50 180, 50 175 Z" fill="#f5e0dc" stroke="#313244" strokeWidth="4" />
        
        {/* Chest Control Panel */}
        <rect x="85" y="130" width="30" height="25" rx="5" fill="#1e1e2e" stroke="#313244" strokeWidth="2" />
        <circle cx="93" cy="138" r="2.5" fill="#f38ba8" />
        <circle cx="107" cy="138" r="2.5" fill="#a6e3a1" />
        <rect x="91" y="146" width="18" height="4" rx="1" fill="#89b4fa" />

        {/* Arms */}
        {/* Left Arm */}
        <motion.path
          d="M 60 122 Q 40 135 48 155"
          stroke="#f5e0dc"
          strokeWidth="12"
          strokeLinecap="round"
          fill="none"
          animate={state === 'celebrating' ? { rotate: [-10, 20, -10] } : {}}
        />
        {/* Right Arm - Waving in celebration */}
        <motion.path
          d="M 140 122 Q 160 135 152 155"
          stroke="#f5e0dc"
          strokeWidth="12"
          strokeLinecap="round"
          fill="none"
          style={{ originX: 0.7, originY: 0.6 }}
          animate={
            state === 'celebrating'
              ? { rotate: [0, -50, -20, -50, 0], y: [0, -10, -5, -10, 0] }
              : state === 'guiding'
              ? { rotate: -25 }
              : { rotate: 0 }
          }
          transition={{ duration: state === 'celebrating' ? 2 : 0.4 }}
        />

        {/* Space Helmet */}
        <circle cx="100" cy="75" r="42" fill="#ffffff" stroke="#313244" strokeWidth="4" />
        
        {/* Glass Visor */}
        <motion.ellipse
          cx="100"
          cy="75"
          rx="32"
          ry="24"
          fill="#11111b"
          stroke="#89b4fa"
          strokeWidth="3"
          animate={state === 'celebrating' ? { fill: ["#11111b", "#1e1e2e", "#11111b"] } : {}}
          transition={{ duration: 1.5, repeat: Infinity }}
        />

        {/* Visor Reflection / Sleeping eyes */}
        {state === 'sleeping' ? (
          <path d="M 85 75 Q 92 80 100 75 M 108 75 Q 115 80 122 75" stroke="#a6e3a1" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        ) : (
          <path d="M 80 65 L 120 65 C 122 65, 115 72, 100 72 C 85 72, 78 65, 80 65 Z" fill="#89dceb" opacity="0.4" />
        )}
        
        {/* Boots */}
        <rect x="65" y="172" width="26" height="15" rx="5" fill="#bac2de" stroke="#313244" strokeWidth="3" />
        <rect x="109" y="172" width="26" height="15" rx="5" fill="#bac2de" stroke="#313244" strokeWidth="3" />
      </motion.svg>
    </div>
  );
};

/* --- MINECRAFT MASCOT COMPONENT --- */
const MinecraftMascot: React.FC<{ state: CollieState; size: number }> = ({ state, size }) => {
  return (
    <div className="flex flex-col items-center justify-center relative select-none" style={{ width: size, height: size }}>
      <motion.svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        animate={
          state === 'celebrating'
            ? { y: [0, -10, 0, -10, 0], scale: [1, 1.03, 1] }
            : state === 'sleeping'
            ? { y: 2, scale: 0.97 }
            : { y: [0, -2, 0] }
        }
        transition={
          state === 'celebrating'
            ? { duration: 1.2, ease: "easeInOut" }
            : state === 'sleeping'
            ? { duration: 0.5 }
            : { duration: 4, repeat: Infinity, ease: "easeInOut" }
        }
      >
        {/* Zzz for sleeping */}
        {state === 'sleeping' && (
          <>
            <motion.text x="145" y="45" fill="#f9e2af" fontSize="16" fontWeight="bold" animate={{ opacity: [0, 1, 0], y: [45, 30] }} transition={{ duration: 2, repeat: Infinity, delay: 0 }}>z</motion.text>
            <motion.text x="160" y="35" fill="#f9e2af" fontSize="22" fontWeight="bold" animate={{ opacity: [0, 1, 0], y: [35, 15] }} transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}>Z</motion.text>
          </>
        )}

        {/* Block Body */}
        <rect x="60" y="115" width="80" height="60" fill="#a6e3a1" stroke="#313244" strokeWidth="4" />
        
        {/* Shirt/T-Shirt Block */}
        <rect x="75" y="115" width="50" height="25" fill="#f9e2af" />
        
        {/* Blocky Arms */}
        {/* Left Arm */}
        <motion.rect
          x="38" y="115" width="22" height="40" rx="2"
          fill="#a6e3a1" stroke="#313244" strokeWidth="4"
          style={{ originX: 0.75, originY: 0.1 }}
          animate={state === 'celebrating' ? { rotate: [0, 20, -10, 20, 0] } : {}}
        />
        {/* Right Arm */}
        <motion.rect
          x="140" y="115" width="22" height="40" rx="2"
          fill="#a6e3a1" stroke="#313244" strokeWidth="4"
          style={{ originX: 0.25, originY: 0.1 }}
          animate={
            state === 'celebrating'
              ? { rotate: [0, -60, -30, -60, 0] }
              : state === 'guiding'
              ? { rotate: -30 }
              : { rotate: 0 }
          }
          transition={{ duration: state === 'celebrating' ? 2 : 0.4 }}
        />

        {/* Cube Head */}
        <motion.g
          animate={state === 'sleeping' ? { y: 2, rotate: 3 } : {}}
        >
          {/* Head Base */}
          <rect x="55" y="35" width="90" height="80" fill="#f9e2af" stroke="#313244" strokeWidth="4" />
          
          {/* Hair block (Minecraft typical helmet hair style) */}
          <rect x="55" y="35" width="90" height="22" fill="#7f5a3c" />
          <rect x="55" y="57" width="15" height="15" fill="#7f5a3c" />
          <rect x="130" y="57" width="15" height="15" fill="#7f5a3c" />

          {/* Pixel Eyes */}
          {state === 'sleeping' ? (
            <>
              {/* Closed pixel eyes (horizontal lines) */}
              <rect x="68" y="75" width="18" height="4" fill="#7f5a3c" />
              <rect x="114" y="75" width="18" height="4" fill="#7f5a3c" />
            </>
          ) : (
            <>
              {/* Square Pixel Eyes */}
              <rect x="66" y="70" width="20" height="12" fill="white" stroke="#313244" strokeWidth="2" />
              <rect x="76" y="70" width="10" height="12" fill="#89b4fa" /> {/* Blue Iris */}
              
              <rect x="114" y="70" width="20" height="12" fill="white" stroke="#313244" strokeWidth="2" />
              <rect x="114" y="70" width="10" height="12" fill="#89b4fa" />
            </>
          )}

          {/* Pixel Mouth */}
          {state === 'celebrating' ? (
            <rect x="90" y="92" width="20" height="12" fill="#f38ba8" stroke="#313244" strokeWidth="2" />
          ) : (
            <rect x="90" y="92" width="20" height="6" fill="#7f5a3c" />
          )}
        </motion.g>

        {/* Feet Blocks */}
        <rect x="65" y="175" width="25" height="15" fill="#7f5a3c" stroke="#313244" strokeWidth="3" />
        <rect x="110" y="175" width="25" height="15" fill="#7f5a3c" stroke="#313244" strokeWidth="3" />
      </motion.svg>
    </div>
  );
};

/* --- CAT MASCOT COMPONENT --- */
const CatMascot: React.FC<{ state: CollieState; size: number }> = ({ state, size }) => {
  const tailTransition = { duration: 1.2, repeat: Infinity, ease: "easeInOut" } as const;
  return (
    <div className="flex flex-col items-center justify-center relative select-none" style={{ width: size, height: size }}>
      <motion.svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        animate={
          state === 'celebrating' 
            ? { y: [0, -12, 0, -12, 0], scale: [1, 1.04, 1] } 
            : state === 'sleeping' 
            ? { y: 2, scale: 0.98 } 
            : { y: [0, -3, 0] }
        }
        transition={
          state === 'celebrating'
            ? { duration: 1.2, ease: "easeInOut" }
            : state === 'sleeping'
            ? { duration: 0.5 }
            : { duration: 3.5, repeat: Infinity, ease: "easeInOut" }
        }
      >
        {/* Zzz for sleeping */}
        {state === 'sleeping' && (
          <>
            <motion.text x="145" y="45" fill="#f5c2e7" fontSize="16" fontWeight="bold" animate={{ opacity: [0, 1, 0], y: [45, 30] }} transition={{ duration: 2, repeat: Infinity, delay: 0 }}>z</motion.text>
            <motion.text x="160" y="35" fill="#f5c2e7" fontSize="22" fontWeight="bold" animate={{ opacity: [0, 1, 0], y: [35, 15] }} transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}>Z</motion.text>
          </>
        )}
        
        {/* Cat Tail */}
        <motion.path
          d="M 50 140 C 20 130, 10 160, 0 145 C -5 135, 15 110, 50 125"
          fill="#fab387"
          stroke="#313244"
          strokeWidth="4"
          style={{ originX: 0.25, originY: 0.7 }}
          animate={state === 'celebrating' ? { rotate: [-15, 25, -15, 25, -15] } : { rotate: [-4, 6, -4] }}
          transition={tailTransition}
        />
        
        {/* Cat Body */}
        <path d="M 50 110 C 50 80, 130 80, 140 110 C 150 130, 140 180, 100 180 C 60 180, 50 140, 50 110 Z" fill="#fab387" stroke="#313244" strokeWidth="4" />
        
        {/* Cat Chest patch */}
        <path d="M 75 120 C 75 100, 115 100, 115 120 C 115 140, 110 175, 95 175 C 80 175, 75 140, 75 120 Z" fill="#f5e0dc" />

        {/* Cat Head */}
        <motion.g
          animate={state === 'sleeping' ? { rotate: 4, y: 1 } : { y: [0, -1.5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Ears */}
          {/* Left Ear */}
          <path d="M 92 42 L 72 15 L 108 32 Z" fill="#fab387" stroke="#313244" strokeWidth="4" />
          <path d="M 90 39 L 78 22 L 102 32 Z" fill="#f2cdcd" />
          
          {/* Right Ear */}
          <path d="M 148 42 L 168 15 L 132 32 Z" fill="#fab387" stroke="#313244" strokeWidth="4" />
          <path d="M 150 39 L 162 22 L 138 32 Z" fill="#f2cdcd" />

          {/* Head Base */}
          <path d="M 90 55 C 90 35, 150 35, 150 55 C 150 75, 140 95, 120 95 C 90 95, 90 75, 90 55 Z" fill="#fab387" stroke="#313244" strokeWidth="4" />
          
          {/* Whiskers */}
          {/* Left Whiskers */}
          <line x1="85" y1="68" x2="60" y2="63" stroke="#313244" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="85" y1="74" x2="60" y2="79" stroke="#313244" strokeWidth="2.5" strokeLinecap="round" />
          
          {/* Right Whiskers */}
          <line x1="155" y1="68" x2="180" y2="63" stroke="#313244" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="155" y1="74" x2="180" y2="79" stroke="#313244" strokeWidth="2.5" strokeLinecap="round" />

          {/* Cute Eyes */}
          {state === 'sleeping' ? (
            <path d="M 102 58 Q 109 63 115 58 M 125 58 Q 132 63 138 58" stroke="#313244" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          ) : (
            <>
              <circle cx="108" cy="55" r="7" fill="white" stroke="#313244" strokeWidth="2" />
              <circle cx="109" cy="55" r="3.5" fill="#1e1e2e" />
              <circle cx="107" cy="53" r="1.5" fill="white" />

              <circle cx="132" cy="55" r="7" fill="white" stroke="#313244" strokeWidth="2" />
              <circle cx="133" cy="55" r="3.5" fill="#1e1e2e" />
              <circle cx="131" cy="53" r="1.5" fill="white" />
            </>
          )}

          {/* Cheeks */}
          {!state || state !== 'sleeping' ? (
            <>
              <circle cx="98" cy="65" r="3" fill="#f5c2e7" opacity="0.6" />
              <circle cx="142" cy="65" r="3" fill="#f5c2e7" opacity="0.6" />
            </>
          ) : null}

          {/* Cat Nose & Mouth */}
          <path d="M 117 65 L 123 65 L 120 68 Z" fill="#f2cdcd" stroke="#313244" strokeWidth="1.5" />
          <path d="M 116 73 Q 120 76 120 73 Q 120 76 124 73" stroke="#313244" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </motion.g>

        {/* Cat Feet */}
        <rect x="65" y="175" width="20" height="15" rx="5" fill="#fab387" stroke="#313244" strokeWidth="3" />
        <rect x="115" y="175" width="20" height="15" rx="5" fill="#fab387" stroke="#313244" strokeWidth="3" />
      </motion.svg>
    </div>
  );
};

/* --- CAR MASCOT COMPONENT --- */
const CarMascot: React.FC<{ state: CollieState; size: number }> = ({ state, size }) => {
  return (
    <div className="flex flex-col items-center justify-center relative select-none" style={{ width: size, height: size }}>
      <motion.svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        animate={
          state === 'celebrating'
            ? { y: [0, -15, 0, -15, 0], scale: [1, 1.05, 1], rotate: [0, 4, -4, 4, 0] }
            : state === 'sleeping'
            ? { y: 3, scale: 0.97 }
            : { y: [0, -2, 0] }
        }
        transition={
          state === 'celebrating'
            ? { duration: 1.2, ease: "easeInOut" }
            : state === 'sleeping'
            ? { duration: 0.5 }
            : { duration: 3, repeat: Infinity, ease: "easeInOut" }
        }
      >
        {/* Zzz for sleeping (emerging from exhaust pipe) */}
        {state === 'sleeping' && (
          <>
            <motion.text x="18" y="130" fill="#f38ba8" fontSize="16" fontWeight="bold" animate={{ opacity: [0, 1, 0], y: [130, 105], x: [18, 5] }} transition={{ duration: 2, repeat: Infinity, delay: 0 }}>z</motion.text>
            <motion.text x="8" y="115" fill="#f38ba8" fontSize="22" fontWeight="bold" animate={{ opacity: [0, 1, 0], y: [115, 85], x: [8, -5] }} transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}>Z</motion.text>
          </>
        )}

        {/* Exhaust Pipe */}
        <rect x="15" y="142" width="18" height="10" rx="3" fill="#bac2de" stroke="#313244" strokeWidth="2.5" />
        
        {/* Main Car Body */}
        <path
          d="M 30 140 C 30 110, 50 100, 70 80 C 85 65, 125 65, 140 80 C 160 100, 180 110, 180 140 C 180 155, 30 155, 30 140 Z"
          fill="#f38ba8"
          stroke="#313244"
          strokeWidth="4"
        />
        
        {/* Bumper */}
        <rect x="25" y="145" width="160" height="12" rx="6" fill="#cdd6f4" stroke="#313244" strokeWidth="3" />

        {/* Windshield */}
        <path
          d="M 75 85 L 135 85 L 125 115 L 85 115 Z"
          fill="#89dceb"
          stroke="#313244"
          strokeWidth="3.5"
        />

        {/* Eyes on windshield */}
        {state === 'sleeping' ? (
          <path d="M 90 100 Q 95 105 100 100 M 110 100 Q 115 105 120 100" stroke="#313244" strokeWidth="3" fill="none" strokeLinecap="round" />
        ) : (
          <>
            {/* Left Eye */}
            <circle cx="95" cy="100" r="6" fill="white" stroke="#313244" strokeWidth="2" />
            <circle cx="96" cy="100" r="3" fill="#1e1e2e" />
            {/* Right Eye */}
            <circle cx="115" cy="100" r="6" fill="white" stroke="#313244" strokeWidth="2" />
            <circle cx="116" cy="100" r="3" fill="#1e1e2e" />
          </>
        )}

        {/* Headlights */}
        <circle cx="48" cy="132" r="10" fill={state === 'sleeping' ? '#7f849c' : '#f9e2af'} stroke="#313244" strokeWidth="3.5" />
        <circle cx="162" cy="132" r="10" fill={state === 'sleeping' ? '#7f849c' : '#f9e2af'} stroke="#313244" strokeWidth="3.5" />

        {/* Happy Grill/Smile */}
        {state === 'celebrating' ? (
          <path d="M 85 145 Q 105 160 125 145 Z" fill="#cdd6f4" stroke="#313244" strokeWidth="2" />
        ) : (
          <path d="M 90 145 Q 105 152 120 145" stroke="#313244" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        )}

        {/* Wheels (spinning in celebration) */}
        {/* Left Wheel */}
        <motion.g
          animate={state === 'celebrating' ? { rotate: 360 } : {}}
          transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
          style={{ originX: "65px", originY: "165px" }}
        >
          <circle cx="65" cy="165" r="22" fill="#313244" stroke="#11111b" strokeWidth="3" />
          <circle cx="65" cy="165" r="10" fill="#bac2de" />
          <line x1="65" y1="155" x2="65" y2="175" stroke="#313244" strokeWidth="2" />
          <line x1="55" y1="165" x2="75" y2="165" stroke="#313244" strokeWidth="2" />
        </motion.g>

        {/* Right Wheel */}
        <motion.g
          animate={state === 'celebrating' ? { rotate: 360 } : {}}
          transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
          style={{ originX: "145px", originY: "165px" }}
        >
          <circle cx="145" cy="165" r="22" fill="#313244" stroke="#11111b" strokeWidth="3" />
          <circle cx="145" cy="165" r="10" fill="#bac2de" />
          <line x1="145" y1="155" x2="145" y2="175" stroke="#313244" strokeWidth="2" />
          <line x1="135" y1="165" x2="155" y2="165" stroke="#313244" strokeWidth="2" />
        </motion.g>
      </motion.svg>
    </div>
  );
};
