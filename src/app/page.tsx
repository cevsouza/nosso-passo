"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { HyperfocusMascot } from '../components/ludic/HyperfocusMascot';
import { playBubble, playMarimba } from '../lib/audio-synth';
import { BookOpen, ShieldAlert, Sparkles, User2, ArrowRight } from 'lucide-react';
import { firebaseBridge } from '../lib/firebase-bridge';

const MotionLink = motion(Link);

export default function Home() {
  const [collieState, setCollieState] = useState<'idle' | 'guiding' | 'celebrating'>('idle');
  const [childHyperfocus, setChildHyperfocus] = useState('Border Collies 🐕');

  useEffect(() => {
    try {
      const active = firebaseBridge.auth.getActiveChild();
      if (active && active.childHyperfocus) {
        setChildHyperfocus(active.childHyperfocus);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  // Calming, low-contrast, sensory-safe bubbles rising slowly
  const bubbles = [
    { id: 1, size: 24, left: "8%", delay: 0, duration: 18 },
    { id: 2, size: 38, left: "20%", delay: 4, duration: 22 },
    { id: 3, size: 16, left: "78%", delay: 1, duration: 15 },
    { id: 4, size: 30, left: "88%", delay: 5, duration: 24 },
    { id: 5, size: 20, left: "45%", delay: 2, duration: 19 }
  ];

  const handleMascotClick = () => {
    setCollieState('celebrating');
    playMarimba(330, 0.4);
    setTimeout(() => {
      setCollieState('idle');
    }, 2000);
  };

  const handleHover = () => {
    setCollieState('guiding');
    playBubble();
  };

  const handleHoverLeave = () => {
    setCollieState('idle');
  };

  const getMascotCelebrationText = (hyperfocusStr: string) => {
    const focus = (hyperfocusStr || "").toLowerCase().trim();
    if (focus.includes("dino") || focus.includes("dinossauro") || focus.includes("dinosaur")) {
      return 'Roar! 🦖';
    }
    if (focus.includes("espaço") || focus.includes("astronauta") || focus.includes("space") || focus.includes("estrela") || focus.includes("star") || focus.includes("foguete") || focus.includes("rocket")) {
      return 'Bip bip! 🚀';
    }
    if (focus.includes("minecraft") || focus.includes("bloco") || focus.includes("block")) {
      return 'Tlec! 🟩';
    }
    if (focus.includes("gato") || focus.includes("cat")) {
      return 'Miau! 🐾';
    }
    if (focus.includes("carro") || focus.includes("car")) {
      return 'Vrum! 🏁';
    }
    return 'Au au! 🎉';
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-between p-6 md:p-12 bg-gradient-to-tr from-[#f8fafc] via-[#eff6ff] to-[#f0fdf4] animate-gradient-flow relative overflow-hidden font-sans">
      
      {/* Decorative slow floating SVGs clouds for sensory calmness */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* Soft Cloud 1 */}
        <motion.div
          className="absolute opacity-20"
          style={{ top: "12%", left: "-15%", width: 160 }}
          animate={{ x: ["-10vw", "110vw"] }}
          transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
        >
          <svg viewBox="0 0 100 100" fill="#cbd5e1">
            <path d="M 20 60 C 20 48, 32 38, 48 38 C 55 28, 75 28, 80 38 C 92 38, 98 48, 98 60 C 98 72, 88 82, 50 82 C 22 82, 20 72, 20 60 Z" />
          </svg>
        </motion.div>

        {/* Soft Cloud 2 */}
        <motion.div
          className="absolute opacity-15"
          style={{ top: "45%", left: "-25%", width: 220 }}
          animate={{ x: ["-20vw", "110vw"] }}
          transition={{ duration: 130, repeat: Infinity, ease: "linear", delay: 15 }}
        >
          <svg viewBox="0 0 100 100" fill="#cbd5e1">
            <path d="M 20 60 C 20 48, 32 38, 48 38 C 55 28, 75 28, 80 38 C 92 38, 98 48, 98 60 C 98 72, 88 82, 50 82 C 22 82, 20 72, 20 60 Z" />
          </svg>
        </motion.div>
      </div>

      {/* Floating Calming Particles / Bubbles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {bubbles.map(b => (
          <motion.div
            key={b.id}
            className="absolute bottom-[-10%] rounded-full bg-indigo-300/20 border border-indigo-400/20 backdrop-blur-[0.5px]"
            style={{
              width: b.size,
              height: b.size,
              left: b.left,
            }}
            animate={{
              y: ["0vh", "-115vh"],
              x: [0, Math.sin(b.id) * 35, 0],
              opacity: [0, 0.45, 0.45, 0]
            }}
            transition={{
              duration: b.duration,
              delay: b.delay,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        ))}
      </div>

      {/* Header Info */}
      <header className="z-10 w-full max-w-5xl flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-2 select-none">
          <span className="text-3xl animate-bounce">🐶</span>
          <span className="text-xl font-black tracking-tight text-slate-900 font-Outfit">Rotina Animada</span>
        </div>
        <span className="text-xs font-black uppercase tracking-widest text-indigo-750 bg-indigo-100 border-2 border-indigo-255 px-4 py-2 rounded-full shadow-sm">
          ✨ Neurodiversidade
        </span>
      </header>

      {/* Main content grid */}
      <div className="z-10 w-full max-w-5xl my-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-6">
        
        {/* Left Column: Headline and Mascot Pedestal */}
        <div className="lg:col-span-5 flex flex-col items-center lg:items-start text-center lg:text-left gap-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center lg:items-start"
          >
            <span className="text-[11px] font-black uppercase tracking-widest text-emerald-950 bg-emerald-100 border-2 border-emerald-300 px-4 py-2 rounded-full mb-4 flex items-center gap-1.5 shadow-sm select-none">
              <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" /> 100% Sensorialmente Seguro
            </span>
            <h1 className="text-4xl md:text-5.5xl font-black tracking-tight text-slate-900 leading-tight font-Outfit">
              Previsibilidade <br />
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 bg-clip-text text-transparent">que Diverte!</span>
            </h1>
            <p className="text-slate-700 text-sm md:text-base mt-4 leading-relaxed font-semibold max-w-md">
              Uma agenda semanal e diária estruturada de forma lúdica com reforço positivo do Border Collie para reduzir a sobrecarga cognitiva e a ansiedade.
            </p>
          </motion.div>

          {/* Mascot Pedestal - Elegant Layered 3D Structure */}
          <div className="relative flex flex-col items-center justify-center p-6 my-2 select-none self-center lg:self-start">
            
            {/* Pulsing orbital rings */}
            <motion.div 
              className="absolute w-[220px] h-[220px] rounded-full border-2 border-dashed border-indigo-400/30 -z-10"
              animate={{ rotate: 360 }}
              transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
            />
            
            <div className="absolute w-[180px] h-[180px] bg-gradient-to-tr from-emerald-100 to-indigo-150 rounded-full filter blur-2xl opacity-40 -z-10 animate-pulse"></div>

            {/* Pedestal Base Glass Circle */}
            <motion.div
              className="cursor-pointer relative flex flex-col items-center justify-center p-5 bg-white border-2 border-slate-300/60 rounded-full shadow-[0_20px_40px_rgba(15,23,42,0.06)] hover:shadow-[0_30px_60px_rgba(79,70,229,0.12)] hover:scale-[1.04] transition-all"
              onClick={handleMascotClick}
              onMouseEnter={handleHover}
              onMouseLeave={handleHoverLeave}
              whileTap={{ scale: 0.96 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <HyperfocusMascot hyperfocus={childHyperfocus} state={collieState} size={170} />
              
              <span className="absolute bottom-2 text-[10px] font-black bg-slate-950 text-white px-3 py-1.5 rounded-full shadow-md select-none border border-slate-750 uppercase tracking-widest font-Outfit">
                {collieState === 'celebrating' ? getMascotCelebrationText(childHyperfocus) : collieState === 'guiding' ? 'Olha lá! 👉' : 'Toca em mim! 👋'}
              </span>
            </motion.div>
          </div>
        </div>

        {/* Right Column: Portal Cards Remodeled */}
        <div className="lg:col-span-7 flex flex-col md:grid md:grid-cols-2 gap-6 w-full">
          
          {/* Card 1: Kids Magical Entrance (Huge and Tactile) */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-850 p-8 rounded-[36px] text-white shadow-[0_25px_50px_-10px_rgba(4,120,87,0.35)] border-b-8 border-emerald-900 flex flex-col justify-between min-h-[320px] transform hover:scale-[1.02] hover:shadow-[0_30px_60px_-10px_rgba(4,120,87,0.45)] transition-all group"
          >
            <div className="flex flex-col gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-all select-none border border-white/20">
                🐾
              </div>
              <div>
                <h3 className="text-2.5xl font-black tracking-tight leading-tight font-Outfit text-white">Área da Criança</h3>
                <p className="text-emerald-100 text-xs font-semibold leading-relaxed mt-3">
                  Painel de missões diárias com visual super divertido, voz nativa automática e estrelas de conquista para reforço positivo.
                </p>
              </div>
            </div>

            <MotionLink
              href="/routine"
              onMouseEnter={playBubble}
              onClick={() => playMarimba(261.63, 0.5)}
              className="mt-6 flex items-center justify-center gap-2 py-4 bg-white text-emerald-900 hover:bg-emerald-50 rounded-2xl font-black text-sm shadow-md cursor-pointer transition-all active:scale-95 border-b-4 border-emerald-200 font-Outfit"
            >
              Iniciar Rotina <ArrowRight className="w-4 h-4 text-emerald-800" />
            </MotionLink>
          </motion.div>

          {/* Card 2: Parent Administration Entrance */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white border-2 border-slate-350 p-8 rounded-[36px] text-slate-900 shadow-[0_25px_50px_rgba(15,23,42,0.04)] border-b-8 border-slate-300 flex flex-col justify-between min-h-[320px] transform hover:scale-[1.02] hover:border-indigo-400 hover:shadow-[0_30px_60px_rgba(79,70,229,0.08)] transition-all group"
          >
            <div className="flex flex-col gap-4">
              <div className="w-14 h-14 bg-indigo-50 border-2 border-indigo-150 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-all">
                <User2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-2.5xl font-black tracking-tight leading-tight text-slate-900 font-Outfit">Cuidadores</h3>
                <p className="text-slate-600 text-xs font-semibold leading-relaxed mt-3">
                  Painel completo para configurar tarefas com presets recomendados, gerenciar múltiplos perfis e acompanhar relatórios comportamentais.
                </p>
              </div>
            </div>

            <MotionLink
              href="/login"
              onMouseEnter={playBubble}
              onClick={() => playMarimba(329.63, 0.4)}
              className="mt-6 flex items-center justify-center gap-2 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-sm shadow-glow-indigo cursor-pointer transition-all active:scale-95 border-b-4 border-indigo-900 font-Outfit"
            >
              Acessar Painel <ArrowRight className="w-4 h-4 text-indigo-200" />
            </MotionLink>
          </motion.div>

        </div>
      </div>

      {/* Footer Info */}
      <footer className="z-10 w-full text-center flex flex-col md:flex-row items-center justify-between gap-2 border-t border-slate-300/60 pt-6 pointer-events-none mt-10">
        <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest">
          neurodiversidade amigável • sem arquivos externos
        </span>
        <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest">
          © 2026 Rotina Animada
        </span>
      </footer>

    </main>
  );
}
