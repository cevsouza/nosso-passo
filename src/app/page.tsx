"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { HyperfocusMascot } from '../components/ludic/HyperfocusMascot';
import { playBubble, playMarimba } from '../lib/audio-synth';
import { Sparkles, ArrowRight, GraduationCap, Stethoscope, Users, Gamepad2, Heart, Sun } from 'lucide-react';
import { firebaseBridge } from '../lib/firebase-bridge';
import { useLanguage } from '../lib/LanguageContext';
import { LanguageSelector } from '../components/LanguageSelector';

const MotionLink = motion(Link);

const localDict = {
  pt: {
    welcomeTitle: "Onde a rotina se torna um abraço de afeto 🌸",
    subheadline: "Celebrando a beleza da vida e a singularidade de cada jornada com estrutura, previsibilidade e carinho para o desenvolvimento saudável.",
    explainTitle: "🦋 A Essência do TEAcolher",
    explainText: "O nome TEAcolher une o TEA (Transtorno do Espectro Autista) ao ato de Acolher. Acreditamos que a vida é bela em sua diversidade. Fornecer previsibilidade e segurança reduz a sobrecarga cognitiva e a ansiedade, abrindo espaço para a criança florescer. Conectamos a família, a escola e os terapeutas em um ecossistema integrado para que o dia a dia seja mais leve, sadio e feliz.",
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
    welcomeTitle: "Donde la rutina se convierte en un abrazo de afecto 🌸",
    subheadline: "Celebrando la belleza de la vida y la singularidad de cada jornada con estructura, previsibilidad y cariño para el desarrollo saludable.",
    explainTitle: "🦋 La Esencia de TEAcolher",
    explainText: "El nombre TEAcolher une el TEA (Trastorno del Espectro Autista) al acto de Acolher (Acoger). Creemos que la vida es bella en su diversidad. Brindar previsibilidad y seguridad reduce la sobrecarga cognitiva y la ansiedad, dando espacio para que el niño florezca. Conectamos a la familia, la escuela y los terapeutas en un ecosistema integrado para que el día a día sea más ligero, sano y feliz.",
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
    welcomeTitle: "Where routine becomes a warm embrace of care 🌸",
    subheadline: "Celebrating the beauty of life and the uniqueness of every journey with structure, predictability, and care for healthy development.",
    explainTitle: "🦋 The Essence of TEAcolher",
    explainText: "The name TEAcolher combines TEA (Autism Spectrum Disorder) and the verb Acolher (to welcome/embrace). We believe life is beautiful in its diversity. Providing predictability and safety reduces cognitive overload and anxiety, allowing the child to bloom. We connect family, school, and therapists in an integrated ecosystem to make daily life lighter, healthier, and happier.",
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

  // Force light mode on the landing page for a sunny, welcoming feel
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.classList.remove('dark');
    }
  }, []);

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
    { id: 1, size: 28, left: "7%", delay: 0, duration: 17, color: "bg-blue-300/20 border-blue-400/20" },
    { id: 2, size: 42, left: "22%", delay: 3, duration: 23, color: "bg-pink-300/20 border-pink-400/20" },
    { id: 3, size: 18, left: "76%", delay: 1, duration: 16, color: "bg-blue-300/20 border-blue-400/20" },
    { id: 4, size: 32, left: "86%", delay: 5, duration: 25, color: "bg-pink-300/20 border-pink-400/20" },
    { id: 5, size: 24, left: "48%", delay: 2, duration: 20, color: "bg-indigo-300/20 border-indigo-400/20" }
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
    <main className="min-h-screen flex flex-col items-center justify-between p-4 md:p-8 bg-slate-50 relative overflow-hidden font-sans select-none">
      
      {/* Subtle desaturated aurora background glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-15%] left-[-15%] w-[60vw] h-[60vw] bg-blue-300/10 rounded-full filter blur-[150px]" />
        <div className="absolute bottom-[-15%] right-[-15%] w-[60vw] h-[60vw] bg-pink-300/10 rounded-full filter blur-[150px]" />
      </div>

      {/* Header Info */}
      <header className="z-10 w-full max-w-6xl flex items-center justify-between pointer-events-auto select-none py-3">
        <div className="flex items-center gap-2 select-none">
          <span className="text-2xl select-none mr-0.5 hover:rotate-12 transition-transform duration-300 cursor-pointer">🐶</span>
          <span className="text-xl font-extrabold tracking-tight font-Outfit select-none">
            <span className="text-sky-600">TE</span>
            <span className="text-indigo-500 font-black">A</span>
            <span className="text-rose-500">colher</span>
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-500 bg-white border border-slate-200/60 px-3.5 py-1.5 rounded-full shadow-xxs font-Outfit">
            <Heart className="w-3 h-3 fill-rose-400 text-rose-450" /> {t.landing.badgeNeuro}
          </span>
          <LanguageSelector />
        </div>
      </header>

      {/* Main content Hero container */}
      <div className="z-10 w-full max-w-6xl my-auto flex flex-col gap-8 py-6">
        
        {/* Section 1: Welcoming Brand Banner */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Headline and Definition */}
          <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left gap-4">
            <motion.div
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-center lg:items-start gap-3"
            >
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 bg-white border border-slate-200 px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-xxs select-none">
                <Sun className="w-3 h-3 text-sky-500" /> {locale === 'en' ? '🌸 Beautiful Life' : locale === 'es' ? '🌸 Hermosa Vida' : '🌸 A Beleza da Vida'}
              </span>
              
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight font-Outfit text-slate-800">
                {info.welcomeTitle}
              </h1>
              
              <p className="text-slate-500 text-xs md:text-sm font-semibold max-w-xl leading-relaxed">
                {info.subheadline}
              </p>
            </motion.div>

            {/* Explanation box: What is TEAcolher? */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-2 p-5 bg-white/60 border border-slate-200/50 backdrop-blur-md rounded-2xl shadow-sm max-w-xl text-left border-l-4 border-l-indigo-400"
            >
              <h2 className="text-sm font-bold text-slate-700 font-Outfit flex items-center gap-1.5 mb-1.5">
                <span>🦋</span> {info.explainTitle}
              </h2>
              <p className="text-slate-500 text-[11px] md:text-xs font-semibold leading-relaxed">
                {info.explainText}
              </p>
            </motion.div>
          </div>

          {/* Right Column: Mascot Pedestal */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center relative select-none min-h-[280px]">
            {/* Ambient glows behind mascot */}
            <div className="absolute w-[200px] h-[200px] bg-gradient-to-tr from-sky-100/20 to-rose-100/20 rounded-full filter blur-3xl opacity-60 -z-10" />
            
            {/* Pedestal Base Glass Circle */}
            <motion.div
              className="cursor-pointer relative flex flex-col items-center justify-center p-5 bg-white/70 backdrop-blur-md border border-slate-200/60 rounded-full shadow-premium-soft hover:scale-[1.02] transition-all"
              onClick={handleMascotClick}
              onMouseEnter={handleHover}
              onMouseLeave={handleHoverLeave}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 350, damping: 20 }}
            >
              <HyperfocusMascot hyperfocus={childHyperfocus} state={collieState} size={150} />
              
              <span className="absolute bottom-2 text-[8px] font-bold bg-slate-800 text-white px-3 py-1.5 rounded-full shadow-sm select-none border border-slate-700 uppercase tracking-widest font-Outfit">
                {collieState === 'celebrating' ? getMascotCelebrationText(childHyperfocus) : collieState === 'guiding' ? t.landing.mascotLook : t.landing.mascotTapMe}
              </span>
            </motion.div>
          </div>
        </div>

        {/* Section 2: Portals Grid */}
        <section className="flex flex-col gap-5 mt-6">
          <div className="text-center md:text-left">
            <h2 className="text-xl md:text-2xl font-bold text-slate-700 font-Outfit">
              {info.portalTitle}
            </h2>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              {info.portalSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
            
            {/* Portal 1: Paciente (Criança) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white/60 border border-slate-200/40 backdrop-blur-md p-5 rounded-2xl text-slate-700 shadow-sm flex flex-col justify-between min-h-[260px] transform hover:scale-[1.01] hover:shadow-premium-soft transition-all duration-300 group"
            >
              <div className="flex flex-col gap-3">
                <div className="w-10 h-10 bg-slate-100/80 border border-slate-200/50 text-sky-600 rounded-xl flex items-center justify-center select-none">
                  <Gamepad2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold tracking-tight leading-tight font-Outfit text-slate-800">{info.kidsTitle}</h3>
                  <p className="text-slate-500 text-[10.5px] font-semibold leading-relaxed mt-2">
                    {info.kidsDesc}
                  </p>
                </div>
              </div>

              <MotionLink
                href="/routine"
                onMouseEnter={playBubble}
                onClick={() => playMarimba(261.63, 0.4)}
                className="mt-4 flex items-center justify-center gap-1.5 py-2 px-4 border border-sky-200/80 hover:bg-sky-500/10 hover:border-sky-400 text-sky-700 rounded-xl font-bold text-[11px] cursor-pointer transition-all active:scale-95 font-Outfit"
              >
                {info.kidsBtn} <ArrowRight className="w-3 h-3 text-sky-500" />
              </MotionLink>
            </motion.div>

            {/* Portal 2: Responsáveis */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white/60 border border-slate-200/40 backdrop-blur-md p-5 rounded-2xl text-slate-700 shadow-sm flex flex-col justify-between min-h-[260px] transform hover:scale-[1.01] hover:shadow-premium-soft transition-all duration-300 group"
            >
              <div className="flex flex-col gap-3">
                <div className="w-10 h-10 bg-slate-100/80 border border-slate-200/50 text-rose-500 rounded-xl flex items-center justify-center select-none">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold tracking-tight leading-tight font-Outfit text-slate-800">{info.parentsTitle}</h3>
                  <p className="text-slate-500 text-[10.5px] font-semibold leading-relaxed mt-2">
                    {info.parentsDesc}
                  </p>
                </div>
              </div>

              <MotionLink
                href="/login"
                onMouseEnter={playBubble}
                onClick={() => playMarimba(329.63, 0.4)}
                className="mt-4 flex items-center justify-center gap-1.5 py-2 px-4 border border-rose-200/80 hover:bg-rose-500/10 hover:border-rose-400 text-rose-700 rounded-xl font-bold text-[11px] cursor-pointer transition-all active:scale-95 font-Outfit"
              >
                {info.parentsBtn} <ArrowRight className="w-3 h-3 text-rose-500" />
              </MotionLink>
            </motion.div>

            {/* Portal 3: Terapeutas */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white/60 border border-slate-200/40 backdrop-blur-md p-5 rounded-2xl text-slate-700 shadow-sm flex flex-col justify-between min-h-[260px] transform hover:scale-[1.01] hover:shadow-premium-soft transition-all duration-300 group"
            >
              <div className="flex flex-col gap-3">
                <div className="w-10 h-10 bg-slate-100/80 border border-slate-200/50 text-sky-600 rounded-xl flex items-center justify-center select-none">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold tracking-tight leading-tight font-Outfit text-slate-800">{info.therapistsTitle}</h3>
                  <p className="text-slate-500 text-[10.5px] font-semibold leading-relaxed mt-2">
                    {info.therapistsDesc}
                  </p>
                </div>
              </div>

              <MotionLink
                href="/therapist"
                onMouseEnter={playBubble}
                onClick={() => playMarimba(261.63, 0.4)}
                className="mt-4 flex items-center justify-center gap-1.5 py-2 px-4 border border-sky-200/80 hover:bg-sky-500/10 hover:border-sky-400 text-sky-700 rounded-xl font-bold text-[11px] cursor-pointer transition-all active:scale-95 font-Outfit"
              >
                {info.therapistsBtn} <ArrowRight className="w-3 h-3 text-sky-500" />
              </MotionLink>
            </motion.div>

            {/* Portal 4: Escola */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white/60 border border-slate-200/40 backdrop-blur-md p-5 rounded-2xl text-slate-700 shadow-sm flex flex-col justify-between min-h-[260px] transform hover:scale-[1.01] hover:shadow-premium-soft transition-all duration-300 group"
            >
              <div className="flex flex-col gap-3">
                <div className="w-10 h-10 bg-slate-100/80 border border-slate-200/50 text-rose-500 rounded-xl flex items-center justify-center select-none">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold tracking-tight leading-tight font-Outfit text-slate-800">{info.schoolTitle}</h3>
                  <p className="text-slate-500 text-[10.5px] font-semibold leading-relaxed mt-2">
                    {info.schoolDesc}
                  </p>
                </div>
              </div>

              <MotionLink
                href="/school"
                onMouseEnter={playBubble}
                onClick={() => playMarimba(329.63, 0.4)}
                className="mt-4 flex items-center justify-center gap-1.5 py-2 px-4 border border-rose-200/80 hover:bg-rose-500/10 hover:border-rose-400 text-rose-700 rounded-xl font-bold text-[11px] cursor-pointer transition-all active:scale-95 font-Outfit"
              >
                {info.schoolBtn} <ArrowRight className="w-3 h-3 text-rose-500" />
              </MotionLink>
            </motion.div>

          </div>
        </section>
      </div>

      {/* Footer Info */}
      <footer className="z-10 w-full text-center flex flex-col md:flex-row items-center justify-between gap-4 border-t border-slate-200/60 pt-4 mt-8 pointer-events-auto">
        <span className="text-[8px] text-slate-400 font-bold tracking-widest uppercase">
          {t.landing.footerFriendly}
        </span>
        <span className="text-[8px] text-slate-400 font-bold tracking-widest uppercase">
          {t.landing.footerCopyright}
        </span>
      </footer>

    </main>
  );
}
