"use client";
import React, { useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { playBubble, playMarimba } from '../lib/audio-synth';
import { Gamepad2, Users, Stethoscope, GraduationCap, Heart } from 'lucide-react';
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
    
    kidsTitle: "Paciente",
    kidsBtn: "Área do Paciente 🎮",
    
    parentsTitle: "Responsáveis",
    parentsBtn: "Painel da Família 🏡",
    
    therapistsTitle: "Terapeutas",
    therapistsBtn: "Painel Clínico 🩺",
    
    schoolTitle: "Escola",
    schoolBtn: "Painel Escolar 🏫"
  },
  es: {
    welcomeTitle: "Donde la rutina se convierte en un abrazo de afecto 🌸",
    subheadline: "Celebrando la belleza de la vida y la singularidad de cada jornada con estructura, previsibilidad y cariño para el desarrollo saludable.",
    explainTitle: "🦋 La Esencia de TEAcolher",
    explainText: "El nombre TEAcolher une el TEA (Transtorno del Espectro Autista) al acto de Acolher (Acoger). Creemos que la vida es bella en su diversidad. Brindar previsibilidad y seguridad reduce la sobrecarga cognitiva y la ansiedad, dando espacio para que el niño florezca. Conectamos a la familia, la escuela y los terapeutas en un ecosistema integrado para que el día a día sea más ligero, sano y feliz.",
    portalTitle: "Portales de Acceso Integrados",
    portalSubtitle: "Seleccione el panel correspondiente a su rol en la red de apoyo:",
    
    kidsTitle: "Paciente",
    kidsBtn: "Área del Paciente 🎮",
    
    parentsTitle: "Responsables",
    parentsBtn: "Panel Familiar 🏡",
    
    therapistsTitle: "Terapeutas",
    therapistsBtn: "Panel Clínico 🩺",
    
    schoolTitle: "Escuela",
    schoolBtn: "Panel Escolar 🏫"
  },
  en: {
    welcomeTitle: "Where routine becomes a warm embrace of care 🌸",
    subheadline: "Celebrating the beauty of life and the uniqueness of every journey with structure, predictability, and care for healthy development.",
    explainTitle: "🦋 The Essence of TEAcolher",
    explainText: "The name TEAcolher combines TEA (Autism Spectrum Disorder) and the verb Acolher (to welcome/embrace). We believe life is beautiful in its diversity. Providing predictability and safety reduces cognitive overload and anxiety, allowing the child to bloom. We connect family, school, and therapists in an integrated ecosystem to make daily life lighter, healthier, and happier.",
    portalTitle: "Integrated Access Portals",
    portalSubtitle: "Select the panel corresponding to your role in the support network:",
    
    kidsTitle: "Patient",
    kidsBtn: "Patient Area 🎮",
    
    parentsTitle: "Guardians",
    parentsBtn: "Family Dashboard 🏡",
    
    therapistsTitle: "Therapists",
    therapistsBtn: "Clinical Dashboard 🩺",
    
    schoolTitle: "School",
    schoolBtn: "School Dashboard 🏫"
  }
};

export default function Home() {
  const { locale, t } = useLanguage();

  const curLang = (locale === 'en' || locale === 'es' ? locale : 'pt') as 'pt' | 'es' | 'en';
  const info = localDict[curLang];

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-between p-6 md:p-12 bg-slate-50 relative overflow-hidden font-sans select-none">
      
      {/* Header Info */}
      <header className="z-10 w-full max-w-4xl flex items-center justify-between pointer-events-auto py-2">
        <div className="flex items-center gap-2">
          <span className="text-xl select-none mr-0.5 hover:rotate-12 transition-transform duration-350 cursor-pointer">🐶</span>
          <span className="text-lg font-bold tracking-tight font-Outfit select-none">
            <span className="text-sky-600">TE</span>
            <span className="text-indigo-500 font-black">A</span>
            <span className="text-rose-500">colher</span>
          </span>
        </div>
        
        <LanguageSelector />
      </header>

      {/* Main content Hero container */}
      <div className="z-10 w-full max-w-2xl my-auto flex flex-col items-center text-center gap-8 py-12">
        
        {/* Brand/Hero Headline */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center gap-4"
        >
          <h1 className="text-3xl md:text-4xl lg:text-[44px] font-extrabold tracking-tight leading-tight font-Outfit text-slate-800 max-w-xl">
            {info.welcomeTitle}
          </h1>
          
          <p className="text-slate-500 text-xs md:text-sm font-semibold max-w-lg leading-relaxed">
            {info.subheadline}
          </p>
        </motion.div>

        {/* Access Portals Selector Pills */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="w-full flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 mt-4"
        >
          <MotionLink
            href="/routine"
            onMouseEnter={playBubble}
            onClick={() => playMarimba(261.63, 0.4)}
            className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-sky-50/40 border border-slate-200/60 rounded-full text-slate-700 text-xs font-bold transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95 font-Outfit flex items-center justify-center gap-2 cursor-pointer"
          >
            <Gamepad2 className="w-4 h-4 text-sky-500" />
            {info.kidsBtn}
          </MotionLink>

          <MotionLink
            href="/login"
            onMouseEnter={playBubble}
            onClick={() => playMarimba(329.63, 0.4)}
            className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-rose-50/40 border border-slate-200/60 rounded-full text-slate-700 text-xs font-bold transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95 font-Outfit flex items-center justify-center gap-2 cursor-pointer"
          >
            <Users className="w-4 h-4 text-rose-455" />
            {info.parentsBtn}
          </MotionLink>

          <MotionLink
            href="/therapist"
            onMouseEnter={playBubble}
            onClick={() => playMarimba(261.63, 0.4)}
            className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-sky-50/40 border border-slate-200/60 rounded-full text-slate-700 text-xs font-bold transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95 font-Outfit flex items-center justify-center gap-2 cursor-pointer"
          >
            <Stethoscope className="w-4 h-4 text-sky-500" />
            {info.therapistsBtn}
          </MotionLink>

          <MotionLink
            href="/school"
            onMouseEnter={playBubble}
            onClick={() => playMarimba(329.63, 0.4)}
            className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-rose-50/40 border border-slate-200/60 rounded-full text-slate-700 text-xs font-bold transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95 font-Outfit flex items-center justify-center gap-2 cursor-pointer"
          >
            <GraduationCap className="w-4 h-4 text-rose-455" />
            {info.schoolBtn}
          </MotionLink>
        </motion.div>



      </div>

      {/* Footer Info */}
      <footer className="z-10 w-full max-w-4xl text-center flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200/50 pt-4 mt-6 pointer-events-auto text-[8px] text-slate-400 font-bold tracking-widest uppercase">
        <div className="flex items-center gap-1.5 justify-center sm:justify-start">
          <Heart className="w-2.5 h-2.5 fill-rose-355 text-rose-355" />
          <span>{t.landing.badgeNeuro}</span>
        </div>
        <span>{t.landing.footerFriendly} | {t.landing.footerCopyright}</span>
      </footer>

    </main>
  );
}
