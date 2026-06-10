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
  if (focus.includes("trem") || focus.includes("train") || focus.includes("locomotiva")) {
    return <TrainMascot state={state} size={size} />;
  }
  if (focus.includes("herói") || focus.includes("heroi") || focus.includes("hero") || focus.includes("super")) {
    return <HeroMascot state={state} size={size} />;
  }
  if (focus.includes("tubarão") || focus.includes("tubarao") || focus.includes("shark") || focus.includes("mar")) {
    return <SharkMascot state={state} size={size} />;
  }
  if (focus.includes("unicórnio") || focus.includes("unicornio") || focus.includes("unicorn")) {
    return <UnicornMascot state={state} size={size} />;
  }
  if (focus.includes("robô") || focus.includes("robo") || focus.includes("robot")) {
    return <RobotMascot state={state} size={size} />;
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

/* --- TRAIN MASCOT COMPONENT --- */
const TrainMascot: React.FC<{ state: CollieState; size: number }> = ({ state, size }) => {
  return (
    <div className="flex flex-col items-center justify-center relative select-none" style={{ width: size, height: size }}>
      <motion.svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        animate={
          state === 'celebrating' 
            ? { y: [0, -10, 0, -10, 0], scale: [1, 1.04, 1] } 
            : state === 'sleeping' 
            ? { y: 2, scale: 0.98 } 
            : { y: [0, -2, 0] }
        }
        transition={
          state === 'celebrating'
            ? { duration: 1.2, ease: "easeInOut" }
            : state === 'sleeping'
            ? { duration: 0.5 }
            : { duration: 3.5, repeat: Infinity, ease: "easeInOut" }
        }
      >
        {/* Zzz for sleeping / Smoke for celebrating */}
        {state === 'sleeping' ? (
          <>
            <motion.text x="145" y="45" fill="#f9e2af" fontSize="16" fontWeight="bold" animate={{ opacity: [0, 1, 0], y: [45, 30] }} transition={{ duration: 2, repeat: Infinity, delay: 0 }}>z</motion.text>
            <motion.text x="160" y="35" fill="#f9e2af" fontSize="22" fontWeight="bold" animate={{ opacity: [0, 1, 0], y: [35, 15] }} transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}>Z</motion.text>
          </>
        ) : (
          <>
            {/* Little dynamic steam puffs */}
            <motion.circle cx="143" cy="50" r="6" fill="#e2e8f0" animate={{ y: [50, 25], x: [143, 138], scale: [1, 1.8], opacity: [0, 0.7, 0] }} transition={{ duration: 1.8, repeat: Infinity, delay: 0 }} />
            <motion.circle cx="143" cy="50" r="5" fill="#e2e8f0" animate={{ y: [50, 20], x: [143, 148], scale: [1, 1.5], opacity: [0, 0.7, 0] }} transition={{ duration: 1.8, repeat: Infinity, delay: 0.9 }} />
          </>
        )}

        {/* Smoke Stack */}
        <rect x="135" y="60" width="16" height="25" rx="3" fill="#313244" stroke="#313244" strokeWidth="2.5" />
        
        {/* Boiler */}
        <rect x="65" y="80" width="80" height="55" rx="15" fill="#89b4fa" stroke="#313244" strokeWidth="4" />
        
        {/* Cabin */}
        <rect x="35" y="60" width="45" height="75" rx="5" fill="#f9e2af" stroke="#313244" strokeWidth="4" />
        <rect x="45" y="70" width="25" height="30" rx="3" fill="#89dceb" stroke="#313244" strokeWidth="2.5" />

        {/* Cowcatcher (Front grill) */}
        <path d="M 145 120 L 168 135 L 145 135 Z" fill="#f38ba8" stroke="#313244" strokeWidth="3" />

        {/* Eyes on Boiler */}
        {state === 'sleeping' ? (
          <path d="M 118 95 Q 124 100 130 95 M 132 95 Q 138 100 144 95" stroke="#313244" strokeWidth="3.5" fill="none" strokeLinecap="round" />
        ) : (
          <>
            <circle cx="124" cy="95" r="7" fill="white" stroke="#313244" strokeWidth="2" />
            <circle cx="125" cy="95" r="3.5" fill="#1e1e2e" />
            <circle cx="138" cy="95" r="7" fill="white" stroke="#313244" strokeWidth="2" />
            <circle cx="139" cy="95" r="3.5" fill="#1e1e2e" />
          </>
        )}

        {/* Smile on Boiler */}
        <path d="M 125 110 Q 131 116 137 110" stroke="#313244" strokeWidth="2.5" fill="none" strokeLinecap="round" />

        {/* Wheels */}
        {/* Back Wheel */}
        <motion.g
          animate={state === 'celebrating' ? { rotate: 360 } : {}}
          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
          style={{ originX: "58px", originY: "155px" }}
        >
          <circle cx="58" cy="155" r="20" fill="#f38ba8" stroke="#313244" strokeWidth="3" />
          <circle cx="58" cy="155" r="6" fill="#bac2de" />
          <line x1="58" y1="145" x2="58" y2="165" stroke="#313244" strokeWidth="2" />
          <line x1="48" y1="155" x2="68" y2="155" stroke="#313244" strokeWidth="2" />
        </motion.g>

        {/* Middle Wheel */}
        <motion.g
          animate={state === 'celebrating' ? { rotate: 360 } : {}}
          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
          style={{ originX: "98px", originY: "155px" }}
        >
          <circle cx="98" cy="155" r="20" fill="#f38ba8" stroke="#313244" strokeWidth="3" />
          <circle cx="98" cy="155" r="6" fill="#bac2de" />
          <line x1="98" y1="145" x2="98" y2="165" stroke="#313244" strokeWidth="2" />
          <line x1="88" y1="155" x2="108" y2="155" stroke="#313244" strokeWidth="2" />
        </motion.g>

        {/* Front Wheel */}
        <motion.g
          animate={state === 'celebrating' ? { rotate: 360 } : {}}
          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
          style={{ originX: "138px", originY: "155px" }}
        >
          <circle cx="138" cy="155" r="16" fill="#f38ba8" stroke="#313244" strokeWidth="3" />
          <circle cx="138" cy="155" r="5" fill="#bac2de" />
          <line x1="138" y1="147" x2="138" y2="163" stroke="#313244" strokeWidth="1.5" />
          <line x1="130" y1="155" x2="146" y2="155" stroke="#313244" strokeWidth="1.5" />
        </motion.g>
        
        {/* Connector Rod */}
        <motion.line 
          x1="58" y1="155" x2="138" y2="155" 
          stroke="#313244" strokeWidth="4" strokeLinecap="round"
          animate={state === 'celebrating' ? { y: [0, -3, 3, 0] } : {}}
          transition={{ duration: 0.4, repeat: Infinity, ease: "linear" }}
        />
      </motion.svg>
    </div>
  );
};

/* --- HERO MASCOT COMPONENT --- */
const HeroMascot: React.FC<{ state: CollieState; size: number }> = ({ state, size }) => {
  return (
    <div className="flex flex-col items-center justify-center relative select-none" style={{ width: size, height: size }}>
      <motion.svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        animate={
          state === 'celebrating'
            ? { y: [0, -15, 0, -15, 0], scale: [1, 1.05, 1] }
            : state === 'sleeping'
            ? { y: 4, scale: 0.97 }
            : { y: [0, -5, 0] }
        }
        transition={
          state === 'celebrating'
            ? { duration: 1.2, ease: "easeInOut" }
            : state === 'sleeping'
            ? { duration: 0.5 }
            : { duration: 3, repeat: Infinity, ease: "easeInOut" }
        }
      >
        {/* Zzz for sleeping */}
        {state === 'sleeping' && (
          <>
            <motion.text x="145" y="45" fill="#cba6f7" fontSize="16" fontWeight="bold" animate={{ opacity: [0, 1, 0], y: [45, 30] }} transition={{ duration: 2, repeat: Infinity, delay: 0 }}>z</motion.text>
            <motion.text x="160" y="35" fill="#cba6f7" fontSize="22" fontWeight="bold" animate={{ opacity: [0, 1, 0], y: [35, 15] }} transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}>Z</motion.text>
          </>
        )}

        {/* Cape */}
        <motion.path
          d="M 68 110 Q 15 110 25 155 Q 65 155 75 125 Z"
          fill="#f38ba8"
          stroke="#313244"
          strokeWidth="4"
          style={{ originX: 0.75, originY: 0.6 }}
          animate={state === 'celebrating' ? { skewY: [-10, 15, -10, 15, -10] } : { skewY: [-2, 5, -2] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Suit Body */}
        <circle cx="100" cy="110" r="42" fill="#cba6f7" stroke="#313244" strokeWidth="4" />
        
        {/* Star symbol on chest */}
        <motion.text x="91" y="132" fill="#f9e2af" fontSize="20" fontWeight="bold" animate={state === 'celebrating' ? { scale: [1, 1.2, 1] } : {}}>⭐</motion.text>

        {/* Arms */}
        {/* Left Arm (raised in excitement) */}
        <motion.path
          d="M 60 115 Q 40 100 45 80"
          stroke="#cba6f7"
          strokeWidth="12"
          strokeLinecap="round"
          fill="none"
          style={{ originX: 0.6, originY: 0.9 }}
          animate={state === 'celebrating' ? { rotate: [-10, 30, -10] } : {}}
          transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
        />
        
        {/* Right Arm (hero flying pose!) */}
        <motion.path
          d="M 140 115 Q 165 95 160 70"
          stroke="#cba6f7"
          strokeWidth="12"
          strokeLinecap="round"
          fill="none"
          style={{ originX: 0.7, originY: 0.9 }}
          animate={
            state === 'celebrating'
              ? { rotate: [0, -30, 0, -30, 0], y: [0, -5, 0] }
              : state === 'guiding'
              ? { rotate: -40 }
              : { rotate: 0 }
          }
          transition={{ duration: 0.4 }}
        />

        {/* Mask */}
        <path d="M 62 100 Q 100 112 138 100 Q 142 90 138 80 Q 100 95 62 80 Q 58 90 62 100 Z" fill="#89b4fa" stroke="#313244" strokeWidth="3.5" />

        {/* Mask Eyes */}
        {state === 'sleeping' ? (
          <path d="M 80 90 Q 86 95 92 90 M 108 90 Q 114 95 120 90" stroke="#313244" strokeWidth="3" fill="none" strokeLinecap="round" />
        ) : (
          <>
            <circle cx="85" cy="90" r="7" fill="white" stroke="#313244" strokeWidth="2" />
            <circle cx="86" cy="90" r="3.5" fill="#1e1e2e" />
            
            <circle cx="115" cy="90" r="7" fill="white" stroke="#313244" strokeWidth="2" />
            <circle cx="116" cy="90" r="3.5" fill="#1e1e2e" />
          </>
        )}

        {/* Mouth */}
        <path d="M 94 116 Q 100 121 106 116" stroke="#313244" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        
        {/* Boots */}
        <rect x="70" y="150" width="22" height="15" rx="5" fill="#f38ba8" stroke="#313244" strokeWidth="3" />
        <rect x="108" y="150" width="22" height="15" rx="5" fill="#f38ba8" stroke="#313244" strokeWidth="3" />
      </motion.svg>
    </div>
  );
};

/* --- SHARK MASCOT COMPONENT --- */
const SharkMascot: React.FC<{ state: CollieState; size: number }> = ({ state, size }) => {
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
            ? { y: [0, -12, 0, -12, 0], scale: [1, 1.05, 1], rotate: [0, 5, -5, 5, 0] } 
            : state === 'sleeping' 
            ? { y: 4, scale: 0.96 } 
            : { y: [0, -4, 0] }
        }
        transition={
          state === 'celebrating'
            ? { duration: 1.2, ease: "easeInOut" }
            : state === 'sleeping'
            ? { duration: 0.5 }
            : { duration: 3.2, repeat: Infinity, ease: "easeInOut" }
        }
      >
        {/* Zzz or Bubbles for sleeping */}
        {state === 'sleeping' && (
          <>
            <motion.circle cx="145" cy="50" r="4" fill="none" stroke="#89b4fa" strokeWidth="1.5" animate={{ opacity: [0, 1, 0], y: [50, 30], x: [145, 150] }} transition={{ duration: 2, repeat: Infinity, delay: 0 }} />
            <motion.circle cx="155" cy="40" r="6" fill="none" stroke="#89b4fa" strokeWidth="1.5" animate={{ opacity: [0, 1, 0], y: [40, 15], x: [155, 150] }} transition={{ duration: 2, repeat: Infinity, delay: 0.7 }} />
            <motion.text x="130" y="55" fill="#89b4fa" fontSize="14" fontWeight="bold" animate={{ opacity: [0, 0.8, 0], y: [55, 40] }} transition={{ duration: 2.2, repeat: Infinity }}>z</motion.text>
          </>
        )}

        {/* Celebrating splash drops */}
        {state === 'celebrating' && (
          <>
            <motion.circle cx="35" cy="120" r="3.5" fill="#89dceb" animate={{ y: [120, 100], x: [35, 15], opacity: [1, 0] }} transition={{ duration: 0.6, repeat: Infinity }} />
            <motion.circle cx="165" cy="120" r="3.5" fill="#89dceb" animate={{ y: [120, 100], x: [165, 185], opacity: [1, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} />
          </>
        )}
        
        {/* Tail Fin */}
        <motion.path
          d="M 50 110 C 25 90, 15 130, 5 110 C -2 100, 10 75, 50 95"
          fill="#89b4fa"
          stroke="#313244"
          strokeWidth="4"
          style={{ originX: 0.25, originY: 0.5 }}
          animate={state === 'celebrating' ? { rotate: [-25, 25, -25, 25, -25] } : { rotate: [-8, 8, -8] }}
          transition={tailTransition}
        />
        
        {/* Dorsal Fin (Top) */}
        <path d="M 95 82 C 95 82, 100 45, 120 50 C 130 53, 120 82, 120 82 Z" fill="#89b4fa" stroke="#313244" strokeWidth="4" />
        
        {/* Shark Body */}
        <path d="M 45 110 C 45 75, 135 75, 155 110 C 165 125, 150 170, 100 170 C 60 170, 45 135, 45 110 Z" fill="#89b4fa" stroke="#313244" strokeWidth="4" />
        
        {/* Lighter Belly Patch */}
        <path d="M 70 120 C 70 100, 130 100, 130 120 C 130 140, 120 162, 100 162 C 80 162, 70 140, 70 120 Z" fill="#eff1f5" />

        {/* Side Fin (Left Pectoral) */}
        <motion.path
          d="M 60 135 C 50 135, 30 148, 40 155 C 50 160, 65 145, 65 145"
          fill="#89b4fa"
          stroke="#313244"
          strokeWidth="3"
          animate={state === 'celebrating' ? { rotate: [0, 20, -10, 0] } : {}}
        />

        {/* Side Fin (Right Pectoral) */}
        <motion.path
          d="M 140 135 C 150 135, 170 148, 160 155 C 150 160, 135 145, 135 145"
          fill="#89b4fa"
          stroke="#313244"
          strokeWidth="3"
          style={{ originX: 0.1, originY: 0.1 }}
          animate={
            state === 'celebrating' 
              ? { rotate: [0, -30, 10, 0] } 
              : state === 'guiding'
              ? { rotate: -20 }
              : {}
          }
        />

        {/* Cute Face */}
        <motion.g
          animate={state === 'sleeping' ? { y: 1 } : {}}
        >
          {/* Eyes */}
          {state === 'sleeping' ? (
            <path d="M 92 98 Q 98 103 104 98 M 116 98 Q 122 103 128 98" stroke="#313244" strokeWidth="3" fill="none" strokeLinecap="round" />
          ) : (
            <>
              <circle cx="98" cy="95" r="6.5" fill="white" stroke="#313244" strokeWidth="2" />
              <circle cx="99.5" cy="95" r="3.5" fill="#1e1e2e" />
              <circle cx="98" cy="93" r="1.5" fill="white" />

              <circle cx="122" cy="95" r="6.5" fill="white" stroke="#313244" strokeWidth="2" />
              <circle cx="123.5" cy="95" r="3.5" fill="#1e1e2e" />
              <circle cx="122" cy="93" r="1.5" fill="white" />
            </>
          )}

          {/* Cheeks */}
          {!state || state !== 'sleeping' ? (
            <>
              <circle cx="89" cy="103" r="3" fill="#f5c2e7" opacity="0.6" />
              <circle cx="131" cy="103" r="3" fill="#f5c2e7" opacity="0.6" />
            </>
          ) : null}

          {/* Shark Smile with 2 small cute teeth */}
          {state === 'celebrating' ? (
            <g>
              <path d="M 100 112 Q 110 128 120 112 Z" fill="#f38ba8" stroke="#313244" strokeWidth="2" />
              <polygon points="104,112 107,117 110,112" fill="white" />
              <polygon points="110,112 113,117 116,112" fill="white" />
            </g>
          ) : (
            <g>
              <path d="M 102 112 Q 110 120 118 112" stroke="#313244" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <polygon points="107,112 109,115 111,112" fill="white" stroke="#313244" strokeWidth="1" />
              <polygon points="111,112 113,115 115,112" fill="white" stroke="#313244" strokeWidth="1" />
            </g>
          )}
        </motion.g>
      </motion.svg>
    </div>
  );
};

/* --- UNICORN MASCOT COMPONENT --- */
const UnicornMascot: React.FC<{ state: CollieState; size: number }> = ({ state, size }) => {
  return (
    <div className="flex flex-col items-center justify-center relative select-none" style={{ width: size, height: size }}>
      <motion.svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        animate={
          state === 'celebrating'
            ? { y: [0, -15, 0, -15, 0], scale: [1, 1.04, 1], rotate: [0, 4, -4, 4, 0] }
            : state === 'sleeping'
            ? { y: 3, scale: 0.97 }
            : { y: [0, -4, 0] }
        }
        transition={
          state === 'celebrating'
            ? { duration: 1.2, ease: "easeInOut" }
            : state === 'sleeping'
            ? { duration: 0.5 }
            : { duration: 3.6, repeat: Infinity, ease: "easeInOut" }
        }
      >
        {/* Zzz for sleeping */}
        {state === 'sleeping' && (
          <>
            <motion.text x="145" y="45" fill="#f5c2e7" fontSize="16" fontWeight="bold" animate={{ opacity: [0, 1, 0], y: [45, 30] }} transition={{ duration: 2, repeat: Infinity, delay: 0 }}>z</motion.text>
            <motion.text x="160" y="35" fill="#f5c2e7" fontSize="22" fontWeight="bold" animate={{ opacity: [0, 1, 0], y: [35, 15] }} transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}>Z</motion.text>
          </>
        )}

        {/* Magic sparkles in celebrating state */}
        {state === 'celebrating' && (
          <>
            <motion.polygon points="40,60 42,65 47,65 43,68 45,73 40,70 35,73 37,68 33,65 38,65" fill="#f9e2af" animate={{ scale: [0.6, 1.2, 0.6], opacity: [0.4, 1, 0.4] }} transition={{ duration: 1 }} style={{ originX: 0.2, originY: 0.3 }} />
            <motion.polygon points="160,80 162,85 167,85 163,88 165,93 160,90 155,93 157,88 153,85 158,85" fill="#cba6f7" animate={{ scale: [1.2, 0.6, 1.2], opacity: [1, 0.4, 1] }} transition={{ duration: 1.2 }} style={{ originX: 0.8, originY: 0.4 }} />
          </>
        )}
        
        {/* Mane / Tail (Back) */}
        <path d="M 45 125 C 20 120, 15 150, 25 155 C 35 160, 48 140, 48 140" fill="#f5c2e7" stroke="#313244" strokeWidth="3.5" />
        
        {/* Unicorn Body */}
        <path d="M 50 115 C 50 85, 125 85, 135 115 C 145 130, 135 175, 95 175 C 55 175, 50 140, 50 115 Z" fill="#ffffff" stroke="#313244" strokeWidth="4" />
        
        {/* Pink Belly Patch */}
        <path d="M 75 125 C 75 110, 115 110, 115 125 C 115 140, 110 165, 95 165 C 80 165, 75 140, 75 125 Z" fill="#fef2f2" />

        {/* Fluffy Mane (Neck) */}
        <path d="M 68 85 C 55 90, 55 110, 68 115 C 62 125, 55 120, 52 110 Z" fill="#cba6f7" stroke="#313244" strokeWidth="3" />

        {/* Unicorn Head */}
        <motion.g
          animate={state === 'sleeping' ? { rotate: 3, y: 1.5 } : {}}
        >
          {/* Back Mane on Head */}
          <path d="M 85 55 C 70 45, 75 80, 90 75" fill="#f5c2e7" stroke="#313244" strokeWidth="3" />
          
          {/* Head Base */}
          <path d="M 85 62 C 85 42, 145 42, 145 62 C 145 78, 130 92, 115 92 C 90 92, 85 78, 85 62 Z" fill="#ffffff" stroke="#313244" strokeWidth="4" />
          
          {/* Snout */}
          <path d="M 115 92 C 105 92, 100 85, 100 75 C 100 68, 110 65, 120 65" fill="#fecaca" opacity="0.5" />

          {/* Ears */}
          {/* Left Ear */}
          <path d="M 90 48 L 78 25 L 98 38 Z" fill="#ffffff" stroke="#313244" strokeWidth="3.5" />
          <path d="M 90 45 L 83 30 L 94 38 Z" fill="#fecaca" />
          
          {/* Right Ear */}
          <path d="M 135 48 L 147 25 L 127 38 Z" fill="#ffffff" stroke="#313244" strokeWidth="3.5" />
          <path d="M 133 45 L 140 30 L 129 38 Z" fill="#fecaca" />

          {/* Horn (Golden Glowing!) */}
          <motion.polygon
            points="110,38 115,10 120,38"
            fill="#f9e2af"
            stroke="#313244"
            strokeWidth="3.5"
            style={{ originX: 0.575, originY: 0.38 }}
            animate={
              state === 'celebrating'
                ? { scale: [1, 1.25, 1], opacity: 1 }
                : { scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] }
            }
            transition={
              state === 'celebrating'
                ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" as const }
                : { duration: 2, repeat: Infinity, ease: "easeInOut" as const }
            }
          />

          {/* Cute Eyes */}
          {state === 'sleeping' ? (
            <path d="M 98 62 Q 104 67 110 62 M 120 62 Q 126 67 132 62" stroke="#313244" strokeWidth="3" fill="none" strokeLinecap="round" />
          ) : (
            <>
              <circle cx="104" cy="59" r="6" fill="#313244" />
              <circle cx="102.5" cy="57.5" r="2" fill="white" />
              <circle cx="105.5" cy="60.5" r="1.2" fill="white" />

              <circle cx="126" cy="59" r="6" fill="#313244" />
              <circle cx="124.5" cy="57.5" r="2" fill="white" />
              <circle cx="127.5" cy="60.5" r="1.2" fill="white" />
            </>
          )}

          {/* Cheeks */}
          {!state || state !== 'sleeping' ? (
            <>
              <circle cx="94" cy="68" r="3.5" fill="#fecaca" />
              <circle cx="136" cy="68" r="3.5" fill="#fecaca" />
            </>
          ) : null}

          {/* Smile */}
          {state === 'celebrating' ? (
            <path d="M 108 72 Q 115 82 122 72 Z" fill="#f38ba8" stroke="#313244" strokeWidth="2" />
          ) : (
            <path d="M 111 72 Q 115 76 119 72" stroke="#313244" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          )}
        </motion.g>

        {/* Legs / Hooves */}
        <rect x="65" y="172" width="22" height="15" rx="4" fill="#ffffff" stroke="#313244" strokeWidth="3" />
        <rect x="65" y="180" width="22" height="7" fill="#f9e2af" stroke="#313244" strokeWidth="3" />
        
        <rect x="110" y="172" width="22" height="15" rx="4" fill="#ffffff" stroke="#313244" strokeWidth="3" />
        <rect x="110" y="180" width="22" height="7" fill="#f9e2af" stroke="#313244" strokeWidth="3" />
      </motion.svg>
    </div>
  );
};

/* --- ROBOT MASCOT COMPONENT --- */
const RobotMascot: React.FC<{ state: CollieState; size: number }> = ({ state, size }) => {
  const blinkTransition = { duration: 0.8, repeat: Infinity, repeatType: "reverse" as const };
  return (
    <div className="flex flex-col items-center justify-center relative select-none" style={{ width: size, height: size }}>
      <motion.svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
        animate={
          state === 'celebrating'
            ? { y: [0, -10, 0, -10, 0], scale: [1, 1.04, 1], rotate: [0, 3, -3, 3, 0] }
            : state === 'sleeping'
            ? { y: 2, scale: 0.97 }
            : { y: [0, -4, 0] }
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
            <motion.text x="145" y="45" fill="#89dceb" fontSize="16" fontWeight="bold" animate={{ opacity: [0, 1, 0], y: [45, 30] }} transition={{ duration: 2, repeat: Infinity, delay: 0 }}>z</motion.text>
            <motion.text x="160" y="35" fill="#89dceb" fontSize="22" fontWeight="bold" animate={{ opacity: [0, 1, 0], y: [35, 15] }} transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}>Z</motion.text>
          </>
        )}

        {/* Hover thrust fire in active/celebrating states */}
        {state !== 'sleeping' && (
          <motion.path
            d="M 90 172 L 100 195 L 110 172 Z"
            fill="#f9e2af"
            animate={{ scaleY: [1, 1.4, 0.9, 1.3, 1], opacity: [0.7, 1, 0.6, 0.9, 0.7] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            style={{ originX: 0.5, originY: 0.85 }}
          />
        )}

        {/* Antenna */}
        <rect x="97" y="30" width="6" height="20" fill="#7f849c" stroke="#313244" strokeWidth="2.5" />
        <motion.circle
          cx="100"
          cy="25"
          r="8"
          fill={state === 'celebrating' ? '#f38ba8' : state === 'sleeping' ? '#7f849c' : '#f9e2af'}
          stroke="#313244"
          strokeWidth="2.5"
          animate={state === 'celebrating' ? { opacity: [0.4, 1, 0.4] } : {}}
          transition={state === 'celebrating' ? blinkTransition : {}}
        />
        
        {/* Body Block */}
        <rect x="62" y="112" width="76" height="60" rx="10" fill="#bac2de" stroke="#313244" strokeWidth="4" />
        
        {/* Chest Panel with Heart/Power indicator */}
        <rect x="74" y="122" width="52" height="26" rx="5" fill="#313244" />
        
        {/* Little blinking lights on chest */}
        <motion.circle cx="83" cy="135" r="3" fill="#a6e3a1" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }} />
        <motion.circle cx="93" cy="135" r="3" fill="#f9e2af" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
        
        {/* Digital Heart/Energy icon */}
        <path d="M 110 131 C 108 128, 105 128, 103 131 L 107 137 Z" fill="#f38ba8" />
        <circle cx="113" cy="132" r="1.5" fill="#f38ba8" />
        <circle cx="116" cy="132" r="1.5" fill="#f38ba8" />

        {/* Arms */}
        {/* Left Arm */}
        <motion.g
          style={{ originX: "58px", originY: "122px" }}
          animate={state === 'celebrating' ? { rotate: [0, 30, -20, 0] } : {}}
        >
          <rect x="36" y="122" width="22" height="8" rx="3" fill="#7f849c" stroke="#313244" strokeWidth="2.5" />
          <circle cx="30" cy="126" r="6" fill="#bac2de" stroke="#313244" strokeWidth="2.5" />
        </motion.g>

        {/* Right Arm */}
        <motion.g
          style={{ originX: "142px", originY: "122px" }}
          animate={
            state === 'celebrating'
              ? { rotate: [0, -60, 20, 0] }
              : state === 'guiding'
              ? { rotate: -45 }
              : {}
          }
          transition={{ duration: 0.5 }}
        >
          <rect x="142" y="122" width="22" height="8" rx="3" fill="#7f849c" stroke="#313244" strokeWidth="2.5" />
          <circle cx="170" cy="126" r="6" fill="#bac2de" stroke="#313244" strokeWidth="2.5" />
        </motion.g>

        {/* Head Block */}
        <motion.g
          animate={state === 'sleeping' ? { y: 2, rotate: 2 } : {}}
        >
          {/* Head base */}
          <rect x="52" y="46" width="96" height="66" rx="12" fill="#cdd6f4" stroke="#313244" strokeWidth="4" />
          
          {/* Ears / Bolts */}
          <rect x="44" y="66" width="8" height="20" rx="2" fill="#7f849c" stroke="#313244" strokeWidth="2.5" />
          <rect x="148" y="66" width="8" height="20" rx="2" fill="#7f849c" stroke="#313244" strokeWidth="2.5" />

          {/* Visor Screen */}
          <rect x="62" y="56" width="76" height="46" rx="8" fill="#1e1e2e" stroke="#313244" strokeWidth="3" />

          {/* Cute LED screen eyes */}
          {state === 'sleeping' ? (
            <>
              <line x1="72" y1="78" x2="86" y2="78" stroke="#89dceb" strokeWidth="4" strokeLinecap="round" />
              <line x1="114" y1="78" x2="128" y2="78" stroke="#89dceb" strokeWidth="4" strokeLinecap="round" />
            </>
          ) : state === 'celebrating' ? (
            <>
              <path d="M 72 82 L 79 74 L 86 82" stroke="#a6e3a1" strokeWidth="4.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 114 82 L 121 74 L 128 82" stroke="#a6e3a1" strokeWidth="4.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </>
          ) : (
            <>
              <circle cx="79" cy="78" r="6" fill="#89b4fa" />
              <circle cx="121" cy="78" r="6" fill="#89b4fa" />
            </>
          )}

          {/* Digital Smile */}
          {state === 'celebrating' ? (
            <path d="M 94 90 Q 100 96 106 90" stroke="#a6e3a1" strokeWidth="3" fill="none" strokeLinecap="round" />
          ) : state === 'sleeping' ? (
            <line x1="96" y1="90" x2="104" y2="90" stroke="#89dceb" strokeWidth="2.5" strokeLinecap="round" />
          ) : (
            <line x1="96" y1="90" x2="104" y2="90" stroke="#89b4fa" strokeWidth="2.5" strokeLinecap="round" />
          )}
        </motion.g>

        {/* Small Legs / Feet */}
        <rect x="74" y="172" width="16" height="8" rx="2" fill="#7f849c" stroke="#313244" strokeWidth="2.5" />
        <rect x="110" y="172" width="16" height="8" rx="2" fill="#7f849c" stroke="#313244" strokeWidth="2.5" />
      </motion.svg>
    </div>
  );
};
