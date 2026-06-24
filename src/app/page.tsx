"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { HyperfocusMascot } from '../components/ludic/HyperfocusMascot';
import { playBubble, playMarimba } from '../lib/audio-synth';
import { Sparkles, ArrowRight, GraduationCap, Stethoscope, Users, Gamepad2, Heart } from 'lucide-react';
import { firebaseBridge } from '../lib/firebase-bridge';
import { useLanguage } from '../lib/LanguageContext';
import { LanguageSelector } from '../components/LanguageSelector';

const MotionLink = motion(Link);

const localDict = {
  pt: {
    welcomeTitle: "Acolhimento, Previsibilidade e Segurança 💙",
    subheadline: "Onde a rotina pedagógica e o tratamento terapêutico se unem para dar suporte ao dia a dia do paciente no espectro autista.",
    explainTitle: "O que é o TEAcolher?",
    explainText: "O nome TEAcolher nasce da união de duas palavras fundamentais: TEA (Transtorno do Espectro Autista) e Acolher. Acreditamos que a rotina de uma criança autista não precisa ser rígida ou fria, mas sim um abraço diário de previsibilidade. O aplicativo conecta toda a rede de apoio — família, escola e terapeutas — em um portal integrativo único, reduzindo a ansiedade e promovendo uma vida mais saudável e independente.",
    portalTitle: "Portais de Acesso Integrados",
    portalSubtitle: "Selecione o painel correspondente ao seu papel na rede de apoio:",
    
    kidsTitle: "Portal do Paciente 🎮",
    kidsDesc: "Painel lúdico de missões diárias com reforço do Border Collie, cronômetros visuais e baixo estímulo sensorial.",
    kidsBtn: "Iniciar Rotina Infantil",
    
    parentsTitle: "Portal dos Responsáveis 🏡",
    parentsDesc: "Gerencie agendas semanais, registre crises, acompanhe relatórios de IA e configure as preferências sensoriais.",
    parentsBtn: "Painel da Família",
    
    therapistsTitle: "Portal dos Terapeutas 🩺",
    therapistsDesc: "Prescreva rotinas clínicas, acompanhe a evolução de objetivos ABA e registre checkpoints de regulação.",
    therapistsBtn: "Painel Clínico",
    
    schoolTitle: "Portal da Escola 🏫",
    schoolDesc: "Espaço para mediadores registrarem checkpoints de humor, nível de ruído e alimentação na sala de aula.",
    schoolBtn: "Painel Escolar"
  },
  es: {
    welcomeTitle: "Acogida, Previsibilidad y Seguridad 💙",
    subheadline: "Donde la rutina pedagógica y el tratamiento terapéutico se unen para apoyar el día a día del paciente en el espectro autista.",
    explainTitle: "¿Qué es TEAcolher?",
    explainText: "El nombre TEAcolher nace de la unión de dos palabras fundamentales: TEA (Trastorno del Espectro Autista) y Acolher (Acoger). Creemos que la rutina de un niño autista no tiene por qué ser rígida o fría, sino un abrazo diario de previsibilidad. La aplicación conecta a toda la red de apoyo — familia, escuela y terapeutas — en un portal integrador único, reduciendo la ansiedad y promoviendo una vida más saludable e independiente.",
    portalTitle: "Portales de Acceso Integrados",
    portalSubtitle: "Seleccione el panel correspondiente a su rol en la red de apoyo:",
    
    kidsTitle: "Portal del Paciente 🎮",
    kidsDesc: "Panel lúdico de misiones diarias con refuerzo del Border Collie, temporizadores visuales y bajo estímulo sensorial.",
    kidsBtn: "Iniciar Rutina Infantil",
    
    parentsTitle: "Portal de los Responsables 🏡",
    parentsDesc: "Gestione agendas semanales, registre crisis, siga reportes de IA y configure preferencias sensoriales.",
    parentsBtn: "Acceder al Panel Familiar",
    
    therapistsTitle: "Portal de Terapeutas 🩺",
    therapistsDesc: "Prescriba rutinas clínicas, siga la evolución de objetivos ABA y registre checkpoints de regulación.",
    therapistsBtn: "Panel Clínico",
    
    schoolTitle: "Portal de la Escuela 🏫",
    schoolDesc: "Espacio para mediadores para registrar checkpoints de aula, nivel de ruido y alimentación escolar.",
    schoolBtn: "Panel Escolar"
  },
  en: {
    welcomeTitle: "Embracing, Predictability and Safety 💙",
    subheadline: "Where pedagogical routine and therapeutic treatment unite to support the daily life of patients on the autism spectrum.",
    explainTitle: "What is TEAcolher?",
    explainText: "The name TEAcolher was born from the combination of two fundamental words: TEA (Autism Spectrum Disorder in Portuguese) and Acolher (to welcome/embrace). We believe that the routine of an autistic child does not have to be rigid or cold, but rather a daily hug of predictability. The app connects the entire support network — family, school, and therapists — in a single integrative portal, reducing anxiety and promoting a healthier and more independent life.",
    portalTitle: "Integrated Access Portals",
    portalSubtitle: "Select the panel corresponding to your role in the support network:",
    
    kidsTitle: "Patient Portal 🎮",
    kidsDesc: "Playful daily missions panel with Border Collie rewards, visual timers, and low sensory stimulation.",
    kidsBtn: "Start Kids Routine",
    
    parentsTitle: "Guardians Portal 🏡",
    parentsDesc: "Manage weekly agendas, log meltdowns, follow AI behavioral reports, and customize sensory parameters.",
    parentsBtn: "Access Family Dashboard",
    
    therapistsTitle: "Therapist Portal 🩺",
    therapistsDesc: "Prescribe clinical routines, track ABA intervention goals, and record regulation checkpoints.",
    therapistsBtn: "Clinical Dashboard",
    
    schoolTitle: "School Portal 🏫",
    schoolDesc: "Classroom space for mediators to log daily mood checkpoints, decibel levels, and food intake.",
    schoolBtn: "School Dashboard"
  }
};

export default function Home() {
  const { locale, t } = useLanguage();
  const [collieState, setCollieState] = useState<'idle' | 'guiding' | 'celebrating'>('idle');
  const [childHyperfocus, setChildHyperfocus] = useState('Border Collies 🐕');

  // Safe cast for dictionary indexing
  const curLang = (locale === 'en' || locale === 'es' ? locale : 'pt') as 'pt' | 'es' | 'en';
  const info = localDict[curLang];

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

  // Blue and pink sensory-safe slow rising bubbles
  const bubbles = [
    { id: 1, size: 28, left: "7%", delay: 0, duration: 17, color: "bg-blue-300/15 border-blue-400/20" },
    { id: 2, size: 42, left: "22%", delay: 3, duration: 23, color: "bg-pink-300/15 border-pink-400/20" },
    { id: 3, size: 18, left: "76%", delay: 1, duration: 16, color: "bg-blue-300/15 border-blue-400/20" },
    { id: 4, size: 32, left: "86%", delay: 5, duration: 25, color: "bg-pink-300/15 border-pink-400/20" },
    { id: 5, size: 24, left: "48%", delay: 2, duration: 20, color: "bg-indigo-300/15 border-indigo-400/20" }
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
    if (focus.includes("dino") || focus.includes("dinossauro") || focus.includes("dinosaur") || focus.includes("dinosaurio")) {
      return 'Roar! 🦖';
    }
    if (focus.includes("espaço") || focus.includes("astronauta") || focus.includes("space") || focus.includes("estrela") || focus.includes("star") || focus.includes("foguete") || focus.includes("rocket") || focus.includes("espacio")) {
      return 'Bip bip! 🚀';
    }
    if (focus.includes("minecraft") || focus.includes("bloco") || focus.includes("block")) {
      return 'Tlec! 🟩';
    }
    if (focus.includes("gato") || focus.includes("cat")) {
      return 'Miau! 🐾';
    }
    if (focus.includes("carro") || focus.includes("car") || focus.includes("coche")) {
      return 'Vrum! 🏁';
    }
    if (focus.includes("trem") || focus.includes("train") || focus.includes("locomotiva") || focus.includes("tren")) {
      return 'Tchutchu! 🚂';
    }
    if (focus.includes("herói") || focus.includes("heroi") || focus.includes("hero") || focus.includes("super") || focus.includes("héroe")) {
      return 'Super! 🌟';
    }
    if (focus.includes("tubarão") || focus.includes("tubarao") || focus.includes("shark") || focus.includes("mar") || focus.includes("tiburón")) {
      return 'Splash! 🌊';
    }
    if (focus.includes("unicórnio") || focus.includes("unicornio") || focus.includes("unicorn")) {
      return 'Brilho! ✨';
    }
    if (focus.includes("robô") || focus.includes("robo") || focus.includes("robot")) {
      return 'Bip bop! 🤖';
    }
    return 'Au au! 🎉';
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-between p-4 md:p-8 bg-gradient-to-tr from-[#fdf2f8] via-[#f0f9ff] to-[#fff1f2] dark:from-[#1b1224] dark:via-[#0c0a12] dark:to-[#0f172a] animate-gradient-flow relative overflow-hidden font-sans transition-colors duration-300">
      
      {/* Decorative slow floating SVGs clouds for sensory calmness */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {/* Soft Cloud 1 */}
        <motion.div
          className="absolute opacity-25 dark:opacity-5"
          style={{ top: "8%", left: "-15%", width: 180 }}
          animate={{ x: ["-10vw", "110vw"] }}
          transition={{ duration: 110, repeat: Infinity, ease: "linear" }}
        >
          <svg viewBox="0 0 100 100" fill="#cbd5e1">
            <path d="M 20 60 C 20 48, 32 38, 48 38 C 55 28, 75 28, 80 38 C 92 38, 98 48, 98 60 C 98 72, 88 82, 50 82 C 22 82, 20 72, 20 60 Z" />
          </svg>
        </motion.div>

        {/* Soft Cloud 2 */}
        <motion.div
          className="absolute opacity-20 dark:opacity-5"
          style={{ top: "38%", left: "-25%", width: 240 }}
          animate={{ x: ["-20vw", "110vw"] }}
          transition={{ duration: 150, repeat: Infinity, ease: "linear", delay: 20 }}
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
            className={`absolute bottom-[-10%] rounded-full border backdrop-blur-[0.5px] ${b.color}`}
            style={{
              width: b.size,
              height: b.size,
              left: b.left,
            }}
            animate={{
              y: ["0vh", "-115vh"],
              x: [0, Math.sin(b.id) * 40, 0],
              opacity: [0, 0.5, 0.5, 0]
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
      <header className="z-10 w-full max-w-6xl flex items-center justify-between pointer-events-auto select-none py-2">
        <div className="flex items-center gap-2 select-none">
          <span className="text-3xl animate-bounce">🐶</span>
          <span className="text-2xl font-black tracking-tight font-Outfit">
            <span className="text-blue-600 dark:text-blue-400">TEA</span>
            <span className="text-pink-500 dark:text-pink-400">colher</span>
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-pink-700 bg-pink-50 dark:text-pink-200 dark:bg-pink-950/40 border-2 border-pink-200 dark:border-pink-900 px-4 py-2 rounded-full shadow-sm font-Outfit">
            <Heart className="w-3.5 h-3.5 fill-pink-500 text-pink-600 animate-pulse" /> {t.landing.badgeNeuro}
          </span>
          <LanguageSelector />
        </div>
      </header>

      {/* Main content Hero container */}
      <div className="z-10 w-full max-w-6xl my-auto flex flex-col gap-10 py-6">
        
        {/* Section 1: Welcoming Brand Banner */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Headline and Definition */}
          <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left gap-4">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-center lg:items-start gap-3"
            >
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-950 bg-blue-100 border-2 border-blue-200 px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm dark:bg-blue-950/40 dark:text-blue-200 dark:border-blue-900 select-none">
                <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-pulse" /> {t.landing.badgeSensory}
              </span>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight font-Outfit text-slate-900 dark:text-white">
                {info.welcomeTitle}
              </h1>
              
              <p className="text-slate-700 dark:text-slate-350 text-sm md:text-base leading-relaxed font-semibold max-w-xl">
                {info.subheadline}
              </p>
            </motion.div>

            {/* Explanation box: What is TEAcolher? */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-2 p-5 md:p-6 bg-white/70 dark:bg-slate-900/60 border-2 border-pink-200/50 dark:border-pink-900/30 rounded-3xl shadow-sm max-w-2xl text-left"
            >
              <h2 className="text-lg font-black text-pink-600 dark:text-pink-400 font-Outfit flex items-center gap-2 mb-2">
                💙 {info.explainTitle}
              </h2>
              <p className="text-slate-650 dark:text-slate-400 text-xs md:text-sm font-medium leading-relaxed">
                {info.explainText}
              </p>
            </motion.div>
          </div>

          {/* Right Column: Mascot Pedestal */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center relative select-none min-h-[300px]">
            {/* Pulsing orbital rings */}
            <motion.div 
              className="absolute w-[240px] h-[240px] rounded-full border-2 border-dashed border-pink-400/20 dark:border-pink-500/10 -z-10"
              animate={{ rotate: 360 }}
              transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            />
            <motion.div 
              className="absolute w-[280px] h-[280px] rounded-full border border-dashed border-blue-400/20 dark:border-blue-500/10 -z-10"
              animate={{ rotate: -360 }}
              transition={{ duration: 55, repeat: Infinity, ease: "linear" }}
            />
            
            <div className="absolute w-[200px] h-[200px] bg-gradient-to-tr from-pink-100 to-blue-150 dark:from-pink-950/20 dark:to-blue-950/20 rounded-full filter blur-2xl opacity-40 -z-10 animate-pulse"></div>

            {/* Pedestal Base Glass Circle */}
            <motion.div
              className="cursor-pointer relative flex flex-col items-center justify-center p-6 bg-white border-2 border-slate-200 rounded-full shadow-[0_20px_45px_rgba(15,23,42,0.05)] dark:bg-slate-900 dark:border-slate-800 hover:scale-[1.03] transition-all"
              onClick={handleMascotClick}
              onMouseEnter={handleHover}
              onMouseLeave={handleHoverLeave}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 350, damping: 20 }}
            >
              <HyperfocusMascot hyperfocus={childHyperfocus} state={collieState} size={180} />
              
              <span className="absolute bottom-2 text-[9px] font-black bg-slate-950 text-white dark:bg-white dark:text-slate-950 px-3.5 py-1.5 rounded-full shadow-md select-none border border-slate-750 dark:border-slate-200 uppercase tracking-widest font-Outfit">
                {collieState === 'celebrating' ? getMascotCelebrationText(childHyperfocus) : collieState === 'guiding' ? t.landing.mascotLook : t.landing.mascotTapMe}
              </span>
            </motion.div>
          </div>
        </div>

        {/* Section 2: Portals Grid */}
        <section className="flex flex-col gap-6 mt-6">
          <div className="text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-black text-slate-850 dark:text-white font-Outfit">
              {info.portalTitle}
            </h2>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-bold mt-1">
              {info.portalSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
            
            {/* Portal 1: Paciente (Criança) */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white dark:bg-slate-900 border-2 border-blue-200 hover:border-blue-400 dark:border-blue-900 dark:hover:border-blue-700 p-6 rounded-[32px] text-slate-800 dark:text-slate-250 shadow-[0_15px_35px_rgba(15,23,42,0.03)] flex flex-col justify-between min-h-[290px] transform hover:scale-[1.02] hover:shadow-[0_20px_45px_rgba(59,130,246,0.08)] transition-all group"
            >
              <div className="flex flex-col gap-3.5">
                <div className="w-12 h-12 bg-blue-50 border border-blue-150 text-blue-600 dark:bg-blue-950/40 dark:border-blue-900 dark:text-blue-400 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-all select-none">
                  <Gamepad2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight leading-tight font-Outfit text-slate-900 dark:text-white">{info.kidsTitle}</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] font-semibold leading-relaxed mt-2.5">
                    {info.kidsDesc}
                  </p>
                </div>
              </div>

              <MotionLink
                href="/routine"
                onMouseEnter={playBubble}
                onClick={() => playMarimba(261.63, 0.4)}
                className="mt-5 flex items-center justify-center gap-1.5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs cursor-pointer transition-all active:scale-95 border-none font-Outfit"
              >
                {info.kidsBtn} <ArrowRight className="w-3.5 h-3.5 text-blue-100" />
              </MotionLink>
            </motion.div>

            {/* Portal 2: Responsáveis */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white dark:bg-slate-900 border-2 border-pink-200 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-700 p-6 rounded-[32px] text-slate-800 dark:text-slate-250 shadow-[0_15px_35px_rgba(15,23,42,0.03)] flex flex-col justify-between min-h-[290px] transform hover:scale-[1.02] hover:shadow-[0_20px_45px_rgba(244,63,94,0.08)] transition-all group"
            >
              <div className="flex flex-col gap-3.5">
                <div className="w-12 h-12 bg-pink-50 border border-pink-150 text-pink-600 dark:bg-pink-950/40 dark:border-pink-900 dark:text-pink-400 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-all select-none">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight leading-tight font-Outfit text-slate-900 dark:text-white">{info.parentsTitle}</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] font-semibold leading-relaxed mt-2.5">
                    {info.parentsDesc}
                  </p>
                </div>
              </div>

              <MotionLink
                href="/login"
                onMouseEnter={playBubble}
                onClick={() => playMarimba(329.63, 0.4)}
                className="mt-5 flex items-center justify-center gap-1.5 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-black text-xs cursor-pointer transition-all active:scale-95 border-none font-Outfit"
              >
                {info.parentsBtn} <ArrowRight className="w-3.5 h-3.5 text-pink-100" />
              </MotionLink>
            </motion.div>

            {/* Portal 3: Terapeutas */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white dark:bg-slate-900 border-2 border-blue-200 hover:border-blue-400 dark:border-blue-900 dark:hover:border-blue-700 p-6 rounded-[32px] text-slate-800 dark:text-slate-250 shadow-[0_15px_35px_rgba(15,23,42,0.03)] flex flex-col justify-between min-h-[290px] transform hover:scale-[1.02] hover:shadow-[0_20px_45px_rgba(59,130,246,0.08)] transition-all group"
            >
              <div className="flex flex-col gap-3.5">
                <div className="w-12 h-12 bg-blue-50 border border-blue-150 text-blue-600 dark:bg-blue-950/40 dark:border-blue-900 dark:text-blue-400 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-all select-none">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight leading-tight font-Outfit text-slate-900 dark:text-white">{info.therapistsTitle}</h3>
                  <p className="text-slate-650 dark:text-slate-450 text-[11px] font-semibold leading-relaxed mt-2.5">
                    {info.therapistsDesc}
                  </p>
                </div>
              </div>

              <MotionLink
                href="/therapist"
                onMouseEnter={playBubble}
                onClick={() => playMarimba(261.63, 0.4)}
                className="mt-5 flex items-center justify-center gap-1.5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs cursor-pointer transition-all active:scale-95 border-none font-Outfit"
              >
                {info.therapistsBtn} <ArrowRight className="w-3.5 h-3.5 text-blue-100" />
              </MotionLink>
            </motion.div>

            {/* Portal 4: Escola */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white dark:bg-slate-900 border-2 border-pink-200 hover:border-pink-400 dark:border-pink-900 dark:hover:border-pink-700 p-6 rounded-[32px] text-slate-800 dark:text-slate-250 shadow-[0_15px_35px_rgba(15,23,42,0.03)] flex flex-col justify-between min-h-[290px] transform hover:scale-[1.02] hover:shadow-[0_20px_45px_rgba(244,63,94,0.08)] transition-all group"
            >
              <div className="flex flex-col gap-3.5">
                <div className="w-12 h-12 bg-pink-50 border border-pink-150 text-pink-600 dark:bg-pink-950/40 dark:border-pink-900 dark:text-pink-400 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-all select-none">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight leading-tight font-Outfit text-slate-900 dark:text-white">{info.schoolTitle}</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] font-semibold leading-relaxed mt-2.5">
                    {info.schoolDesc}
                  </p>
                </div>
              </div>

              <MotionLink
                href="/school"
                onMouseEnter={playBubble}
                onClick={() => playMarimba(329.63, 0.4)}
                className="mt-5 flex items-center justify-center gap-1.5 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-black text-xs cursor-pointer transition-all active:scale-95 border-none font-Outfit"
              >
                {info.schoolBtn} <ArrowRight className="w-3.5 h-3.5 text-pink-100" />
              </MotionLink>
            </motion.div>

          </div>
        </section>
      </div>

      {/* Footer Info */}
      <footer className="z-10 w-full text-center flex flex-col md:flex-row items-center justify-between gap-4 border-t border-slate-300/40 dark:border-slate-800/60 pt-6 pointer-events-auto mt-10">
        <span className="text-[9px] text-slate-500 dark:text-slate-500 font-extrabold uppercase tracking-widest">
          {t.landing.footerFriendly}
        </span>
        <span className="text-[9px] text-slate-500 dark:text-slate-500 font-extrabold uppercase tracking-widest">
          {t.landing.footerCopyright}
        </span>
      </footer>

    </main>
  );
}
