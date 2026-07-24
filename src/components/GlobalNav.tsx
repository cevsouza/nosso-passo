"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Home,
  LayoutDashboard,
  Activity,
  Baby,
  ChevronRight,
  CalendarCheck,
  ListTodo,
  LineChart,
  Settings,
} from 'lucide-react';
import { playBubble, playMarimba } from '../lib/audio-synth';
import { firebaseBridge } from '../lib/firebase-bridge';
import { useLanguage } from '../lib/LanguageContext';
import { SECOES, urlDaSecao, rotuloSecao, secaoDoParam, SecaoPainel } from '../lib/painel-secoes';

const ICONE_SECAO: Record<SecaoPainel, any> = {
  hoje: CalendarCheck,
  tasks: ListTodo,
  feedback: LineChart,
  tools: Settings,
};

export function GlobalNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [activeChildId, setActiveChildId] = useState<string | null>(null);
  const [secao, setSecao] = useState<SecaoPainel>('hoje');
  const { t, locale } = useLanguage();

  // Dentro do painel a barra navega o PAINEL. Fora dele, navega o site.
  //
  // Antes ela era sempre do site: "Início" levava a pagina de vendas e
  // "Profissional" a uma tela de codigo — duas coisas que um responsavel
  // logado nunca usa. Metade da barra permanente da tela era inutil para
  // quem estava usando o app.
  const noPainel = pathname.startsWith('/dashboard');

  useEffect(() => {
    const sincroniza = () => {
      const child = firebaseBridge.auth.getActiveChild();
      if (child) setActiveChildId(child.id);
      if (typeof window !== 'undefined') {
        setSecao(secaoDoParam(new URLSearchParams(window.location.search).get('p')));
      }
    };
    sincroniza();
    // `popstate` cobre o botao voltar; o intervalo cobre a troca de seção
    // feita por dentro da pagina, que usa history.replaceState.
    window.addEventListener('popstate', sincroniza);
    const interval = setInterval(sincroniza, 1000);
    return () => {
      window.removeEventListener('popstate', sincroniza);
      clearInterval(interval);
    };
  }, [pathname]);

  const itensSite = [
    {
      label: t.common.navHome || 'Início',
      href: '/',
      icon: Home,
      color: 'hover:text-slate-900',
      activeColor: 'text-slate-900 bg-slate-100 border-slate-300',
    },
    {
      label: t.common.navResponsible || 'Responsável',
      href: '/dashboard',
      icon: LayoutDashboard,
      color: 'hover:text-indigo-650',
      activeColor: 'text-indigo-805 bg-indigo-50 border-indigo-200',
    },
    {
      // Portal unico do profissional — terapeuta e escola foram unificados em
      // /therapist (/school so redireciona para la).
      label: locale === 'en' ? 'Professional' : locale === 'es' ? 'Profesional' : 'Profissional',
      href: '/therapist',
      icon: Activity,
      color: 'hover:text-emerald-650',
      activeColor: 'text-emerald-805 bg-emerald-50 border-emerald-200',
    },
  ];

  const itensPainel = SECOES.map((s) => ({
    label: rotuloSecao(s, locale),
    href: urlDaSecao(s),
    icon: ICONE_SECAO[s],
    secao: s,
    color: 'hover:text-indigo-650',
    activeColor: 'text-indigo-805 bg-indigo-50 border-indigo-200',
  }));

  const navItems: any[] = noPainel ? itensPainel : itensSite;

  const handleNavClick = (href: string) => {
    playBubble();
    if (href.startsWith('/dashboard')) {
      const user = firebaseBridge.auth.getCurrentUser();
      if (!user) {
        router.push('/login');
        return;
      }
    }
    playMarimba(330, 0.25);
  };

  const isItemActive = (item: any) => {
    if (noPainel) return item.secao === secao;
    if (item.href === '/') return pathname === '/';
    return pathname.startsWith(item.href);
  };

  return (
    <>
      {/* Desktop Left Sidebar Navigation */}
      <aside className="sticky top-0 h-screen w-64 bg-white border-r-2 border-slate-200 hidden lg:flex flex-col justify-between py-6 px-4 z-45 shadow-sm shrink-0">
        <div className="flex flex-col gap-8">
          {/* A marca leva para o inicio — e por onde se sai do painel agora
              que "Início" nao ocupa mais um lugar fixo na barra. */}
          <Link href="/" onClick={playBubble} className="flex items-center gap-2.5 px-2 select-none cursor-pointer">
            <img src="/icon.svg" alt="" className="w-8 h-8 select-none mr-0.5" />
            <div>
              <span className="block text-base font-bold tracking-tight font-Outfit leading-none text-slate-900">
                Nosso Passo
              </span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-1 block">um passo de cada vez</span>
            </div>
          </Link>

          <nav className="flex flex-col gap-1.5">
            {navItems.map((item) => {
              const active = isItemActive(item);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => handleNavClick(item.href)}
                  className={`flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-black transition-all border-2 border-transparent cursor-pointer font-Outfit group ${
                    active
                      ? `${item.activeColor} shadow-xxs scale-102`
                      : `text-slate-500 hover:bg-slate-50 ${item.color} hover:border-slate-105`
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${active ? 'stroke-[2.5px]' : 'stroke-[2px]'}`} />
                    <span>{item.label}</span>
                  </div>
                  {active && (
                    <motion.div layoutId="activeDot" className="w-1.5 h-1.5 rounded-full bg-current" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Atalho para a tela da crianca */}
        {activeChildId && (
          <div className="flex flex-col gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl relative overflow-hidden shadow-sm">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🧒</span>
              <div>
                <span className="block text-[10px] font-black text-indigo-900 uppercase tracking-wider leading-none">{t.common.navQuickShortcut || 'Atalho Rápido'}</span>
                <span className="text-[8px] font-bold text-indigo-500 block mt-0.5">{t.common.navKidPanel || 'Painel Infantil'}</span>
              </div>
            </div>

            <Link
              href={`/routine?childId=${activeChildId}`}
              onClick={() => {
                playBubble();
                playMarimba(392, 0.4);
              }}
              className="mt-1 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] rounded-xl text-center shadow-sm flex items-center justify-center gap-1 font-Outfit uppercase tracking-wider active:scale-95 transition-all"
            >
              <Baby className="w-3.5 h-3.5" /> {t.common.navGoToRoutine || 'Ir para a tela dela'} <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        )}
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 inset-x-0 bg-white/85 backdrop-blur-md border-t-2 border-slate-200 lg:hidden flex justify-around py-2 px-1 z-45 shadow-[0_-8px_24px_rgba(15,23,42,0.05)]">
        {navItems.map((item) => {
          const active = isItemActive(item);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => handleNavClick(item.href)}
              className={`flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl transition-all cursor-pointer ${
                active
                  ? 'text-indigo-605 scale-102 font-black'
                  : 'text-slate-450 hover:text-slate-700'
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5px]' : 'stroke-[2px]'}`} />
              <span className="text-[9px] font-black font-Outfit leading-none tracking-tight">{item.label}</span>
            </Link>
          );
        })}
        {/* Fora do painel, o atalho da crianca continua na barra. Dentro dele
            nao: as quatro secoes ja ocupam a barra, e o botao grande
            "Ir para a tela de X" mora no cabecalho, onde e mais visivel. */}
        {activeChildId && !noPainel && (
          <Link
            href={`/routine?childId=${activeChildId}`}
            onClick={() => {
              playBubble();
              playMarimba(392, 0.4);
            }}
            className="flex flex-col items-center gap-1 py-1.5 px-3 rounded-xl text-slate-450 hover:text-slate-700 relative"
          >
            <div className="absolute top-0 right-3 w-2 h-2 bg-indigo-600 rounded-full animate-ping"></div>
            <Baby className="w-5 h-5 stroke-[2px]" />
            <span className="text-[9px] font-black font-Outfit leading-none tracking-tight">{t.common.navRoutine || 'Criança'}</span>
          </Link>
        )}
      </nav>
    </>
  );
}
