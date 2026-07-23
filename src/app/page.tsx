"use client";
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { playBubble, playMarimba } from '../lib/audio-synth';
import { Gamepad2, Users, Stethoscope, Heart, ArrowRight, Check } from 'lucide-react';
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
    explainTitle: "A essência do Nosso Passo",
    explainText: "O nome diz o método: cada dia, um passo de cada vez. Dar previsibilidade e segurança reduz a sobrecarga e a ansiedade, abrindo espaço para a criança florescer. Conectamos família, escola e terapeutas num só ecossistema, para que o dia a dia seja mais leve, sadio e feliz.",
    kidsTitle: "Paciente",
    kidsDesc: "A rotina do dia com previsibilidade, foco e calma para a criança.",
    parentsTitle: "Responsáveis",
    parentsDesc: "Monte a agenda, acompanhe o progresso e ajuste tudo num só lugar.",
    professionalTitle: "Profissional",
    professionalDesc: "Terapeuta ou escola: acompanhe a evolução e deixe observações com um código de acesso.",
    plansTitle: "Comece de graça",
    plansSubtitle: "Sem cartão para começar. Sem anúncios. Sem vender dados da sua família.",
    planFreeName: "Gratuito",
    planFreePrice: "R$ 0",
    planFreePeriod: "para sempre",
    planFreeFeatures: ["Rotina visual diária", "Até 3 tarefas por dia", "Níveis de interface Foco e Intermediário", "Modo calma e comunicação por figuras"],
    planFamilyName: "Família",
    planFamilyPrice: "R$ 199",
    planFamilyPeriod: "por ano (R$ 16,58/mês)",
    planFamilyBadge: "Mais escolhido",
    planFamilyFeatures: ["Tarefas ilimitadas", "Relatório de aderência em PDF", "Histórico sensorial completo", "Acompanhamento por terapeuta e escola"],
    planPartnerName: "Terapeuta e Escola",
    planPartnerPrice: "R$ 0",
    planPartnerPeriod: "sempre gratuito",
    planPartnerFeatures: ["Painel do profissional", "Acesso por código, revogável", "Registro de devolutivas", "Sem custo para o profissional"],
    plansStart: "Começar grátis",
    plansMonthlyNote: "Também disponível no plano mensal de R$ 29,90. Cancele quando quiser.",
    footerPrivacy: "Privacidade",
    footerTerms: "Termos de Uso",
  },
  es: {
    eyebrow: "Previsibilidad y acogida para el TEA",
    welcomeTitle: "Donde la rutina se convierte en un abrazo de afecto",
    subheadline: "Estructura, previsibilidad y cariño para el desarrollo saludable — celebrando la singularidad de cada jornada.",
    portalTitle: "Elige tu espacio",
    portalSubtitle: "Cada persona de la red de apoyo tiene un panel hecho para su rol.",
    enter: "Entrar",
    explainTitle: "La esencia de Nosso Passo",
    explainText: "El nombre dice el método: cada día, un paso a la vez. Brindar previsibilidad y seguridad reduce la sobrecarga y la ansiedad, dando espacio para que el niño florezca. Conectamos a la familia, la escuela y los terapeutas en un solo ecosistema, para que el día a día sea más ligero, sano y feliz.",
    kidsTitle: "Paciente",
    kidsDesc: "La rutina del día con previsibilidad, foco y calma para el niño.",
    parentsTitle: "Responsables",
    parentsDesc: "Arma la agenda, sigue el progreso y ajusta todo en un solo lugar.",
    professionalTitle: "Profesional",
    professionalDesc: "Terapeuta o escuela: sigue la evolución y deja observaciones con un código de acceso.",
    plansTitle: "Empieza gratis",
    plansSubtitle: "Sin tarjeta para empezar. Sin anuncios. Sin vender los datos de tu familia.",
    planFreeName: "Gratuito",
    planFreePrice: "$0",
    planFreePeriod: "para siempre",
    planFreeFeatures: ["Rutina visual diaria", "Hasta 3 tareas por día", "Niveles de interfaz Foco e Intermedio", "Modo calma y comunicación por figuras"],
    planFamilyName: "Familia",
    planFamilyPrice: "$39",
    planFamilyPeriod: "por año ($3,25/mes)",
    planFamilyBadge: "Más elegido",
    planFamilyFeatures: ["Tareas ilimitadas", "Informe de adherencia en PDF", "Historial sensorial completo", "Seguimiento por terapeuta y escuela"],
    planPartnerName: "Terapeuta y Escuela",
    planPartnerPrice: "$0",
    planPartnerPeriod: "siempre gratis",
    planPartnerFeatures: ["Panel del profesional", "Acceso por código, revocable", "Registro de devoluciones", "Sin costo para el profesional"],
    plansStart: "Empezar gratis",
    plansMonthlyNote: "También disponible en el plan mensual de $5,90. Cancela cuando quieras.",
    footerPrivacy: "Privacidad",
    footerTerms: "Términos de Uso",
  },
  en: {
    eyebrow: "Predictability & care for autism",
    welcomeTitle: "Where routine becomes a warm embrace of care",
    subheadline: "Structure, predictability and care for healthy development — celebrating the uniqueness of every journey.",
    portalTitle: "Choose your space",
    portalSubtitle: "Everyone in the support network has a panel built for their role.",
    enter: "Enter",
    explainTitle: "The essence of Nosso Passo",
    explainText: "The name says the method: each day, one step at a time. Predictability and safety reduce overload and anxiety, giving the child space to bloom. We connect family, school and therapists in a single ecosystem, so daily life feels lighter, healthier and happier.",
    kidsTitle: "Patient",
    kidsDesc: "The day's routine with predictability, focus and calm for the child.",
    parentsTitle: "Guardians",
    parentsDesc: "Build the schedule, track progress and adjust everything in one place.",
    professionalTitle: "Professional",
    professionalDesc: "Therapist or school: follow progress and leave notes with an access code.",
    plansTitle: "Start for free",
    plansSubtitle: "No card to start. No ads. We never sell your family's data.",
    planFreeName: "Free",
    planFreePrice: "$0",
    planFreePeriod: "forever",
    planFreeFeatures: ["Daily visual routine", "Up to 3 tasks a day", "Focus and Intermediate interface levels", "Calm mode and picture communication"],
    planFamilyName: "Family",
    planFamilyPrice: "$39",
    planFamilyPeriod: "per year ($3.25/month)",
    planFamilyBadge: "Most chosen",
    planFamilyFeatures: ["Unlimited tasks", "Adherence report as PDF", "Full sensory history", "Therapist and school follow-up"],
    planPartnerName: "Therapist & School",
    planPartnerPrice: "$0",
    planPartnerPeriod: "always free",
    planPartnerFeatures: ["Professional dashboard", "Code-based, revocable access", "Session feedback log", "No cost for the professional"],
    plansStart: "Start free",
    plansMonthlyNote: "Also available monthly at $5.90. Cancel anytime.",
    footerPrivacy: "Privacy",
    footerTerms: "Terms of Use",
  }
};

export default function Home() {
  const { locale, t } = useLanguage();

  const curLang = (locale === 'en' || locale === 'es' ? locale : 'pt') as 'pt' | 'es' | 'en';
  const info = localDict[curLang];

  const portals = [
    { href: '/routine', icon: Gamepad2, title: info.kidsTitle, desc: info.kidsDesc, tint: '#e2f1ef', color: '#2f8f86', freq: 261.63 },
    { href: '/login', icon: Users, title: info.parentsTitle, desc: info.parentsDesc, tint: '#fbeee0', color: '#c9743a', freq: 329.63 },
    { href: '/therapist', icon: Stethoscope, title: info.professionalTitle, desc: info.professionalDesc, tint: '#d8ebe8', color: '#26716a', freq: 392.0 },
  ];

  return (
    <main className="min-h-screen flex flex-col bg-[#f6f8f9] text-slate-900 font-sans">

      {/* Header */}
      <header className="w-full max-w-5xl mx-auto px-5 md:px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/icon.svg" alt="" className="w-7 h-7 select-none" />
          <span className="text-lg font-black tracking-tight font-Outfit select-none text-slate-900">
            Nosso Passo
          </span>
        </div>
        <LanguageSelector />
      </header>

      {/* Hero */}
      <section className="w-full max-w-3xl mx-auto px-5 md:px-8 pt-6 pb-5 sm:pt-10 sm:pb-8 md:pt-16 md:pb-12 flex flex-col items-center text-center gap-3 sm:gap-5">
        <motion.span
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="hidden sm:inline-flex items-center gap-2 text-[11px] md:text-xs font-black uppercase tracking-widest text-[#2f8f86] bg-[#e2f1ef] border border-[#bfe0db] px-3.5 py-1.5 rounded-full"
        >
          🌿 {info.eyebrow}
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
      <section className="w-full max-w-5xl mx-auto px-5 md:px-8 pb-6 flex flex-col gap-3.5 sm:gap-5">
        <div className="text-center flex flex-col gap-1">
          <h2 className="text-xl md:text-2xl font-black font-Outfit text-slate-900 tracking-tight">{info.portalTitle}</h2>
          <p className="hidden sm:block text-slate-500 text-xs md:text-sm font-medium max-w-md mx-auto">{info.portalSubtitle}</p>
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
                className="group bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-row sm:flex-col items-center sm:items-stretch gap-3.5 sm:gap-3 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer"
              >
                <span
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: p.tint, color: p.color }}
                >
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </span>
                <div className="flex flex-col gap-0.5 sm:gap-1 flex-1 min-w-0">
                  <h3 className="text-base font-black font-Outfit text-slate-900 tracking-tight">{p.title}</h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">{p.desc}</p>
                </div>
                {/* No celular a seta basta; o rotulo "Entrar" so aparece a partir do sm. */}
                <ArrowRight className="w-5 h-5 shrink-0 sm:hidden" style={{ color: p.color }} />
                <span
                  className="hidden sm:inline-flex items-center gap-1.5 text-xs font-black font-Outfit mt-1"
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

      {/* Planos */}
      <section className="w-full max-w-5xl mx-auto px-5 md:px-8 pt-10 md:pt-14 flex flex-col gap-5">
        <div className="text-center flex flex-col gap-1">
          <h2 className="text-xl md:text-2xl font-black font-Outfit text-slate-900 tracking-tight">{info.plansTitle}</h2>
          <p className="text-slate-500 text-xs md:text-sm font-medium max-w-md mx-auto">{info.plansSubtitle}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 md:gap-4 items-start">
          {[
            { name: info.planFreeName, price: info.planFreePrice, period: info.planFreePeriod, features: info.planFreeFeatures, badge: null, featured: false },
            { name: info.planFamilyName, price: info.planFamilyPrice, period: info.planFamilyPeriod, features: info.planFamilyFeatures, badge: info.planFamilyBadge, featured: true },
            { name: info.planPartnerName, price: info.planPartnerPrice, period: info.planPartnerPeriod, features: info.planPartnerFeatures, badge: null, featured: false },
          ].map(plan => (
            <div
              key={plan.name}
              className={`relative bg-white rounded-2xl p-5 flex flex-col gap-3 transition-all ${plan.featured ? 'border-2 border-[#2f8f86] shadow-md sm:-mt-2' : 'border border-slate-200 shadow-sm'}`}
            >
              {plan.badge && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#2f8f86] text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
                  {plan.badge}
                </span>
              )}

              <h3 className="text-sm font-black font-Outfit text-slate-900 tracking-tight mt-1">{plan.name}</h3>

              <div className="flex flex-col">
                <span className="text-3xl font-black font-Outfit text-slate-900 tracking-tight">{plan.price}</span>
                <span className="text-[11px] text-slate-500 font-bold">{plan.period}</span>
              </div>

              <ul className="flex flex-col gap-1.5 mt-1 flex-1">
                {plan.features.map((f: string) => (
                  <li key={f} className="flex gap-2 items-start text-xs text-slate-500 font-medium leading-relaxed">
                    <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#2f8f86]" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center gap-2">
          <Link
            href="/login"
            onMouseEnter={playBubble}
            onClick={() => playMarimba(329.63, 0.4)}
            className="inline-flex items-center gap-1.5 bg-[#2f8f86] hover:bg-[#26716a] text-white text-sm font-black font-Outfit px-6 py-3 rounded-xl shadow-sm transition-all active:scale-95"
          >
            {info.plansStart}
            <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-[11px] text-slate-400 font-semibold text-center">{info.plansMonthlyNote}</p>
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
          <Heart className="w-3 h-3 fill-[#ef9d61] text-[#ef9d61]" />
          <span>{t.landing.badgeNeuro}</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/privacidade" className="hover:text-slate-600 transition-colors">{info.footerPrivacy}</Link>
          <Link href="/termos" className="hover:text-slate-600 transition-colors">{info.footerTerms}</Link>
        </div>
        <span className="text-center">{t.landing.footerFriendly} | {t.landing.footerCopyright}</span>
      </footer>

    </main>
  );
}
