"use client";
import React, { useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { playBubble, playMarimba } from '../lib/audio-synth';
import { Gamepad2, Users, Stethoscope, Heart, ArrowRight } from 'lucide-react';
import { useLanguage } from '../lib/LanguageContext';
import { LanguageSelector } from '../components/LanguageSelector';

const MotionLink = motion(Link);

const localDict = {
  pt: {
    eyebrow: "Previsibilidade & acolhimento para o TEA",
    welcomeTitle: "Onde a rotina se torna um abraço de afeto",
    subheadline: "Estrutura, previsibilidade e carinho para o desenvolvimento saudável — celebrando a singularidade de cada jornada.",
    portalTitle: "Escolha o seu espaço",
    portalSubtitle: "Cada pessoa da rede de apoio tem um painel feito para o seu papel.",
    enter: "Entrar",
    explainTitle: "A essência do TEAcolher",
    explainText: "O nome une o TEA (Transtorno do Espectro Autista) ao ato de acolher. Dar previsibilidade e segurança reduz a sobrecarga e a ansiedade, abrindo espaço para a criança florescer. Conectamos família, escola e terapeutas num só ecossistema, para que o dia a dia seja mais leve, sadio e feliz.",
    kidsTitle: "Paciente",
    kidsDesc: "A rotina do dia com previsibilidade, foco e calma para a criança.",
    parentsTitle: "Responsáveis",
    parentsDesc: "Monte a agenda, acompanhe o progresso e ajuste tudo num só lugar.",
    professionalTitle: "Profissional",
    professionalDesc: "Terapeuta ou escola: acompanhe a evolução e deixe observações com um código de acesso.",
  },
  es: {
    eyebrow: "Previsibilidad y acogida para el TEA",
    welcomeTitle: "Donde la rutina se convierte en un abrazo de afecto",
    subheadline: "Estructura, previsibilidad y cariño para el desarrollo saludable — celebrando la singularidad de cada jornada.",
    portalTitle: "Elige tu espacio",
    portalSubtitle: "Cada persona de la red de apoyo tiene un panel hecho para su rol.",
    enter: "Entrar",
    explainTitle: "La esencia de TEAcolher",
    explainText: "El nombre une el TEA (Trastorno del Espectro Autista) al acto de acoger. Brindar previsibilidad y seguridad reduce la sobrecarga y la ansiedad, dando espacio para que el niño florezca. Conectamos a la familia, la escuela y los terapeutas en un solo ecosistema, para que el día a día sea más ligero, sano y feliz.",
    kidsTitle: "Paciente",
    kidsDesc: "La rutina del día con previsibilidad, foco y calma para el niño.",
    parentsTitle: "Responsables",
    parentsDesc: "Arma la agenda, sigue el progreso y ajusta todo en un solo lugar.",
    professionalTitle: "Profesional",
    professionalDesc: "Terapeuta o escuela: sigue la evolución y deja observaciones con un código de acceso.",
  },
  en: {
    eyebrow: "Predictability & care for autism",
    welcomeTitle: "Where routine becomes a warm embrace of care",
    subheadline: "Structure, predictability and care for healthy development — celebrating the uniqueness of every journey.",
    portalTitle: "Choose your space",
    portalSubtitle: "Everyone in the support network has a panel built for their role.",
    enter: "Enter",
    explainTitle: "The essence of TEAcolher",
    explainText: "The name joins ASD (Autism Spectrum Disorder) with the act of welcoming. Predictability and safety reduce overload and anxiety, giving the child space to bloom. We connect family, school and therapists in a single ecosystem, so daily life feels lighter, healthier and happier.",
    kidsTitle: "Patient",
    kidsDesc: "The day's routine with predictability, focus and calm for the child.",
    parentsTitle: "Guardians",
    parentsDesc: "Build the schedule, track progress and adjust everything in one place.",
    professionalTitle: "Professional",
    professionalDesc: "Therapist or school: follow progress and leave notes with an access code.",
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

  const portals = [
    { href: '/routine', icon: Gamepad2, title: info.kidsTitle, desc: info.kidsDesc, tint: '#e4e7fc', color: '#5468e6', freq: 261.63 },
    { href: '/login', icon: Users, title: info.parentsTitle, desc: info.parentsDesc, tint: '#eee6fb', color: '#8a66d9', freq: 329.63 },
    { href: '/therapist', icon: Stethoscope, title: info.professionalTitle, desc: info.professionalDesc, tint: '#dfe3fb', color: '#4658de', freq: 392.0 },
  ];

  return (
    <main className="min-h-screen flex flex-col bg-[#f6f8f9] text-slate-900 font-sans">

      {/* Header */}
      <header className="w-full max-w-5xl mx-auto px-5 md:px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl select-none">🐶</span>
          <span className="text-lg font-black tracking-tight font-Outfit select-none text-slate-900">
            TEAcolher
          </span>
        </div>
        <LanguageSelector />
      </header>

      {/* Hero */}
      <section className="w-full max-w-3xl mx-auto px-5 md:px-8 pt-10 pb-8 md:pt-16 md:pb-12 flex flex-col items-center text-center gap-5">
        <motion.span
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 text-[11px] md:text-xs font-black uppercase tracking-widest text-[#5468e6] bg-[#e4e7fc] border border-[#d3d9fa] px-3.5 py-1.5 rounded-full"
        >
          🌸 {info.eyebrow}
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="text-[30px] leading-[1.1] md:text-5xl md:leading-[1.08] font-black tracking-tight font-Outfit text-slate-900 max-w-2xl"
        >
          {info.welcomeTitle}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.12 }}
          className="text-slate-500 text-sm md:text-base font-medium max-w-xl leading-relaxed"
        >
          {info.subheadline}
        </motion.p>
      </section>

      {/* Portals */}
      <section className="w-full max-w-5xl mx-auto px-5 md:px-8 pb-6 flex flex-col gap-5">
        <div className="text-center flex flex-col gap-1">
          <h2 className="text-xl md:text-2xl font-black font-Outfit text-slate-900 tracking-tight">{info.portalTitle}</h2>
          <p className="text-slate-500 text-xs md:text-sm font-medium max-w-md mx-auto">{info.portalSubtitle}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 md:gap-4">
          {portals.map(p => {
            const Icon = p.icon;
            return (
              <MotionLink
                key={p.href}
                href={p.href}
                onMouseEnter={playBubble}
                onClick={() => playMarimba(p.freq, 0.4)}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                className="group bg-white border border-slate-200 rounded-2xl p-5 flex flex-col gap-3 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer"
              >
                <span
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: p.tint, color: p.color }}
                >
                  <Icon className="w-6 h-6" />
                </span>
                <div className="flex flex-col gap-1 flex-1">
                  <h3 className="text-base font-black font-Outfit text-slate-900 tracking-tight">{p.title}</h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">{p.desc}</p>
                </div>
                <span
                  className="inline-flex items-center gap-1.5 text-xs font-black font-Outfit mt-1"
                  style={{ color: p.color }}
                >
                  {info.enter}
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </MotionLink>
            );
          })}
        </div>
      </section>

      {/* Essence */}
      <section className="w-full max-w-3xl mx-auto px-5 md:px-8 py-10 md:py-14">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 flex flex-col gap-3">
          <span className="text-2xl select-none">🦋</span>
          <h2 className="text-lg md:text-xl font-black font-Outfit text-slate-900 tracking-tight">{info.explainTitle}</h2>
          <p className="text-sm text-slate-500 font-medium leading-relaxed">{info.explainText}</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full max-w-5xl mx-auto px-5 md:px-8 py-6 mt-auto border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-slate-400 font-bold tracking-widest uppercase">
        <div className="flex items-center gap-1.5">
          <Heart className="w-3 h-3 fill-[#9c7be6] text-[#9c7be6]" />
          <span>{t.landing.badgeNeuro}</span>
        </div>
        <span className="text-center">{t.landing.footerFriendly} | {t.landing.footerCopyright}</span>
      </footer>

    </main>
  );
}
