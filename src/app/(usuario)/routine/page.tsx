"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { firebaseBridge, Task } from '../../../lib/firebase-bridge';
import { CollieState } from '../../../components/ludic/BorderCollie';
import { HyperfocusMascot } from '../../../components/ludic/HyperfocusMascot';
import { playBubble, playMarimba, playCelebration, speakText, startAmbientSound, stopAmbientSound } from '../../../lib/audio-synth';
import { getTaskCategory, TaskCategory } from '../../../lib/sensory-standards';
import { RoutineIllustration } from '../../../components/ludic/RoutineIllustration';
import { 
  Check, 
  Star, 
  ArrowRight, 
  Sun, 
  Moon, 
  Sunrise, 
  Clock, 
  Sparkles, 
  Utensils, 
  BookOpen, 
  Gamepad2, 
  Bed 
} from 'lucide-react';

const DAYS_PORTUGUESE: { [key: number]: string } = {
  0: 'domingo',
  1: 'segunda',
  2: 'terca',
  3: 'quarta',
  4: 'quinta',
  5: 'sexta',
  6: 'sabado'
};

const DAY_LABELS: { [key: string]: string } = {
  segunda: 'Segunda-feira 📅',
  terca: 'Terça-feira 📅',
  quarta: 'Quarta-feira 📅',
  quinta: 'Quinta-feira 📅',
  sexta: 'Sexta-feira 📅',
  sabado: 'Sábado ☀️',
  domingo: 'Domingo ☀️'
};

const BADGES = [
  { id: 'hygiene', label: 'Higiene de Ouro 🫧', desc: 'Missões de asseio concluídas.', icon: '🏆' },
  { id: 'nutrition', label: 'Super Alimentado 🍎', desc: 'Refeições feitas na hora.', icon: '🏅' },
  { id: 'study', label: 'Mente Brilhante 📝', desc: 'Atividades e deveres feitos.', icon: '🎓' }
];


const SOCIAL_STORIES = [
  {
    id: 'haircut',
    title: 'Cortar o Cabelo ✂️',
    desc: 'O que acontece no salão de cabeleireiro? Vamos ver com nosso amigo!',
    steps: [
      {
        text: 'Hoje vamos visitar o cabeleireiro. Cortar o cabelo é como dar um abraço nos fios para que cresçam fortes e saudáveis!',
        img: '💇',
      },
      {
        text: 'Lá, você vai sentar em uma cadeira especial que pode subir e descer como um brinquedo.',
        img: '💺',
      },
      {
        text: 'O cabeleireiro vai usar uma tesoura ou maquininha. Eles fazem um barulhinho suave. Se o som incomodar, você pode usar seu fone ou pedir para ir mais devagar!',
        img: '🎧',
      },
      {
        text: 'Depois que terminar, você vai se olhar no espelho e ver como seu cabelo ficou incrível! E você ganhará um super abraço!',
        img: '✨',
      }
    ]
  },
  {
    id: 'doctor',
    title: 'Consulta com o Médico 🩺',
    desc: 'Visitar o consultório para medir nossa altura e ver se somos fortes!',
    steps: [
      {
        text: 'Ir ao médico serve para ver como nosso corpo está crescendo forte e saudável como um super-herói.',
        img: '🦸',
      },
      {
        text: 'O médico usa um estetoscópio. Ele parece uma moedinha fria que escuta o coração fazendo: tum-tum, tum-tum!',
        img: '💓',
      },
      {
        text: 'Ele vai pedir para você respirar fundo, como se estivesse soprando uma velinha de aniversário.',
        img: '🎂',
      },
      {
        text: 'Pronto! A consulta terminou rápido. Você ganha uma estrela por ser tão forte e cooperativo!',
        img: '⭐',
      }
    ]
  },
  {
    id: 'vaccine',
    title: 'Hora da Vacina 💉',
    desc: 'Uma picadinha de mosquito rápida que nos protege de todas as gripes!',
    steps: [
      {
        text: 'A vacina é como um escudo invisível de proteção. Ela ensina nosso corpo a afastar os bichinhos da gripe.',
        img: '🛡️',
      },
      {
        text: 'A enfermeira limpa o braço com um algodão geladinho. É muito refrescante!',
        img: '❄️',
      },
      {
        text: 'Depois, vem uma picadinha rápida, como um beliscão de formiguinha de apenas 3 segundos. Vamos contar: um, dois, três!',
        img: '🐜',
      },
      {
        text: 'Já acabou! Colocamos um adesivo divertido por cima e seu escudo está ativo para te proteger!',
        img: '🏅',
      }
    ]
  },
  {
    id: 'making_friends',
    title: 'Fazer Novos Amigos 🤝',
    desc: 'Como podemos nos aproximar e brincar com outras crianças na escola ou no parque!',
    steps: [
      {
        text: 'Na escola ou no parque, há muitas crianças que também querem brincar. Fazer amigos é como começar um jogo divertido em equipe!',
        img: '🏫',
      },
      {
        text: 'Você pode se aproximar devagar, olhar nos olhos com um sorriso amigável e dizer: "Olá! Meu nome é [Mascote], posso brincar com você?"',
        img: '👋',
      },
      {
        text: 'Se o outro amigo disser que sim, vocês podem compartilhar as brincadeiras! Dividir blocos de montar ou esperar a sua vez no balanço torna tudo divertido.',
        img: '🧩',
      },
      {
        text: 'Se ele preferir brincar sozinho agora, tudo bem! Há muitas outras crianças e outros momentos para tentarmos. Você foi super corajoso ao tentar!',
        img: '❤️',
      }
    ]
  },
  {
    id: 'sharing_toys',
    title: 'Compartilhar e Cooperar 🧸',
    desc: 'Aprender a dividir brinquedos e esperar a nossa vez deixa a brincadeira muito melhor!',
    steps: [
      {
        text: 'Brincar com carrinhos ou blocos é muito legal! Mas quando compartilhamos, podemos construir pistas de corrida ainda maiores juntos.',
        img: '🚗',
      },
      {
        text: 'Se outro amigo quiser o brinquedo que você está usando, você pode dizer: "Vou brincar mais um pouquinho, e depois é a sua vez!" Isso ajuda a acalmar.',
        img: '⏳',
      },
      {
        text: 'Quando entregamos o brinquedo com calma, nosso amigo fica muito feliz. E logo ele vai compartilhar um brinquedo legal com você também!',
        img: '🙌',
      },
      {
        text: 'Parabéns! Brincar juntos respeitando os tempos é uma super missão de amizade concluída com sucesso!',
        img: '🥳',
      }
    ]
  },
  {
    id: 'dealing_with_frustration',
    title: 'Quando Algo Muda 🌀',
    desc: 'Nem sempre as coisas saem como planejamos, e tudo bem! Vamos ver como respirar e acalmar.',
    steps: [
      {
        text: 'Às vezes, nós queremos brincar lá fora, mas começa a chover. Ou uma atividade muda de horário de repente. Isso pode dar um friozinho na barriga.',
        img: '🌧️',
      },
      {
        text: 'Quando isso acontecer, você pode fechar os olhos e respirar fundo 3 vezes. Puxe o ar como se cheirasse uma flor, e solte como se soprasse uma vela.',
        img: '🧘',
      },
      {
        text: 'Pensar em um plano B ajuda nosso cérebro! Se não dá para ir ao parque, que tal desenhar o seu mascote favorito no papel?',
        img: '🎨',
      },
      {
        text: 'As mudanças acontecem, mas nós somos flexíveis e fortes como super-heróis. Logo o sol volta a brilhar!',
        img: '☀️',
      }
    ]
  }
];

interface TimerProps {
  progress: number;
  minutesLeft: number;
}

const HourglassTimer: React.FC<TimerProps> = ({ progress, minutesLeft }) => {
  const topPercent = progress * 100;
  const bottomPercent = (1 - progress) * 100;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="text-[9px] font-black uppercase tracking-widest text-slate-700 select-none">
        ⏳ Ampulheta Lúdica
      </span>
      <div className="relative w-20 h-20 flex items-center justify-center bg-white rounded-full p-2 border-2 border-slate-300 shadow-xxs">
        <svg viewBox="0 0 100 120" className="w-full h-full">
          <path d="M20,10 L80,10 L80,20 Q80,55 55,60 Q80,65 80,100 L80,110 L20,110 L20,100 Q20,65 45,60 Q20,55 20,20 Z" fill="none" stroke="#64748b" strokeWidth="6" strokeLinejoin="round" />
          <clipPath id="top-clip">
            <rect x="0" y={10 + (90 - topPercent * 0.45)} width="100" height="50" />
          </clipPath>
          <path d="M25,15 L75,15 Q75,52 50,57 Q25,52 25,15 Z" fill="#eab308" opacity="0.85" clipPath="url(#top-clip)" />
          <clipPath id="bottom-clip">
            <rect x="0" y={105 - bottomPercent * 0.45} width="100" height="50" />
          </clipPath>
          <path d="M50,63 Q75,68 75,105 L25,105 Q25,68 50,63 Z" fill="#eab308" opacity="0.95" clipPath="url(#bottom-clip)" />
          {progress > 0 && progress < 1 && (
            <line x1="50" y1="55" x2="50" y2="95" stroke="#eab308" strokeWidth="3" strokeDasharray="5,5" strokeLinecap="round">
              <animate attributeName="stroke-dashoffset" values="10;0" dur="1s" repeatCount="indefinite" />
            </line>
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center font-bold pointer-events-none mt-2">
          <span className="text-sm font-black text-slate-900 bg-white/70 px-1.5 py-0.5 rounded">{minutesLeft}m</span>
        </div>
      </div>
    </div>
  );
};

const DropletsTimer: React.FC<TimerProps> = ({ progress, minutesLeft }) => {
  const fillHeight = (1 - progress) * 35;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="text-[9px] font-black uppercase tracking-widest text-slate-700 select-none">
        💧 Gotas de Água
      </span>
      <div className="relative w-20 h-20 flex items-center justify-center bg-white rounded-full p-2 border-2 border-slate-300 shadow-xxs">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <rect x="42" y="5" width="16" height="10" rx="3" fill="#94a3b8" />
          <path d="M25,40 L25,85 A10,10 0 0,0 35,95 L65,95 A10,10 0 0,0 75,85 L75,40 Z" fill="none" stroke="#64748b" strokeWidth="5" />
          {progress > 0 && (
            <motion.path
              d="M50,15 C47,15 45,20 45,23 C45,26 47,28 50,28 C53,28 55,26 55,23 C55,20 53,15 50,15 Z"
              fill="#0ea5e9"
              animate={{ y: [0, 50] }}
              transition={{ repeat: Infinity, duration: 2.2, ease: "easeIn" }}
            />
          )}
          <rect x="28" y={92 - fillHeight} width="44" height={fillHeight} fill="#0ea5e9" opacity="0.75" rx="2" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center font-bold pointer-events-none mt-2">
          <span className="text-sm font-black text-slate-900 bg-white/70 px-1.5 py-0.5 rounded">{minutesLeft}m</span>
        </div>
      </div>
    </div>
  );
};

const BEDTIME_STORIES = [
  {
    id: 'sleepy-dino',
    title: 'O Dinossauro com Sono 🦖💤',
    desc: 'Uma história para relaxar os olhinhos e dormir bem.',
    steps: [
      {
        text: 'Era uma vez um pequeno dinossauro chamado [Mascote] que adorava correr. Mas a lua chegou no céu e era hora de descansar.',
        img: '🦕',
      },
      {
        text: '[Mascote] bocejou bem alto. Ele deitou sua cabeça na grama macia e ouviu o som suave do vento nas folhas.',
        img: '🍃',
      },
      {
        text: 'Ele fechou os olhos devagarzinho. Cada respiração acalmava seu peito. Respire fundo com o dino...',
        img: '✨',
      },
      {
        text: 'Bons sonhos, pequeno dinossauro. Durma bem e tenha uma linda noite de sono.',
        img: '🌙',
      }
    ]
  },
  {
    id: 'space-journey',
    title: 'Viagem das Estrelas 🚀⭐',
    desc: 'Flutue no espaço calmo e silencioso até o sono chegar.',
    steps: [
      {
        text: 'O pequeno astronauta [Mascote] terminou sua missão de hoje. Ele entra em seu foguete aconchegante e confortável.',
        img: '🚀',
      },
      {
        text: 'Lá fora, as estrelas piscam bem devagar, como luzes suaves de ninar.',
        img: '⭐',
      },
      {
        text: 'O motor do foguete faz um ruído baixinho e morno, que ajuda a relaxar cada parte do corpo.',
        img: '🌌',
      },
      {
        text: 'Agora, a nave desliga as luzes principais. É hora de sonhar com galáxias distantes e felizes.',
        img: '💤',
      }
    ]
  }
];

const HyperfocusThemeTimer: React.FC<TimerProps & { theme: string }> = ({ progress, minutesLeft, theme }) => {
  const lowerTheme = (theme || "").toLowerCase();
  
  let timerName = "Hiperfoco: Mascote 🐶";
  let content = null;

  if (lowerTheme.includes("dino")) {
    timerName = "🥚 Dino Chocando";
    const crackSpread = (1 - progress) * 14;
    const dinoY = progress * 22;
    content = (
      <svg viewBox="0 0 120 120" className="w-full h-full">
        <circle cx="60" cy="60" r="50" fill="#f0fdf4" stroke="#bbf7d0" strokeWidth="2" />
        {progress < 0.8 && (
          <motion.g y={dinoY} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <circle cx="60" cy="65" r="22" fill="#22c55e" />
            <circle cx="53" cy="58" r="3" fill="#000" />
            <circle cx="67" cy="58" r="3" fill="#000" />
            <circle cx="48" cy="63" r="2" fill="#f43f5e" opacity="0.6" />
            <circle cx="72" cy="63" r="2" fill="#f43f5e" opacity="0.6" />
            <path d="M57,66 Q60,69 63,66" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" />
            <path d="M48,46 L53,42 L58,46" fill="#15803d" />
            <path d="M62,46 L67,42 L72,46" fill="#15803d" />
          </motion.g>
        )}
        <motion.path 
          d="M60,20 C35,20 30,85 60,100 Z" 
          fill="#fef08a" 
          stroke="#ca8a04" 
          strokeWidth="3"
          animate={{ x: -crackSpread / 2 }}
          transition={{ type: "spring", stiffness: 100 }}
        />
        <motion.path 
          d="M60,20 C85,20 90,85 60,100 Z" 
          fill="#fef08a" 
          stroke="#ca8a04" 
          strokeWidth="3"
          animate={{ x: crackSpread / 2 }}
          transition={{ type: "spring", stiffness: 100 }}
        />
        {progress > 0 && progress < 1 && (
          <path 
            d="M60,20 L55,40 L65,60 L55,80 L60,100" 
            fill="none" 
            stroke="#ca8a04" 
            strokeWidth="2.5" 
            strokeDasharray="4,4"
          />
        )}
      </svg>
    );
  } else if (lowerTheme.includes("espa") || lowerTheme.includes("space") || lowerTheme.includes("astro") || lowerTheme.includes("foguete")) {
    timerName = "🚀 Foguete Pousando";
    const rocketY = (1 - progress) * 75 + 10;
    content = (
      <svg viewBox="0 0 100 120" className="w-full h-full">
        <rect width="100" height="120" rx="10" fill="#0f172a" />
        <circle cx="20" cy="30" r="1.5" fill="#fff" opacity="0.8" />
        <circle cx="80" cy="40" r="1" fill="#fff" opacity="0.6" />
        <circle cx="75" cy="80" r="2" fill="#fff" opacity="0.9" />
        <circle cx="30" cy="90" r="1.2" fill="#fff" opacity="0.7" />
        <path d="M5,105 Q50,95 95,105 L95,120 L5,120 Z" fill="#94a3b8" />
        <circle cx="30" cy="110" r="4" fill="#64748b" />
        <circle cx="70" cy="108" r="5" fill="#64748b" />
        <circle cx="50" cy="112" r="3" fill="#64748b" />
        {progress > 0 && (
          <motion.polygon 
            points="45,28 55,28 50,42" 
            fill="#f97316"
            animate={{ scaleY: [1, 1.4, 1] }}
            transition={{ repeat: Infinity, duration: 0.3 }}
            style={{ transformOrigin: "50% 28px" }}
            y={rocketY + 15}
          />
        )}
        <g transform={`translate(50, ${rocketY}) translate(-15, -15)`}>
          <path d="M5,22 L15,12 L25,22 Z" fill="#ef4444" />
          <rect x="8" y="5" width="14" height="20" rx="7" fill="#f8fafc" />
          <rect x="8" y="12" width="14" height="10" fill="#f8fafc" />
          <circle cx="15" cy="12" r="3.5" fill="#38bdf8" stroke="#cbd5e1" strokeWidth="1" />
          <path d="M8,7 A7,7 0 0,1 22,7 L15,0 Z" fill="#ef4444" />
        </g>
      </svg>
    );
  } else if (lowerTheme.includes("tren") || lowerTheme.includes("train") || lowerTheme.includes("carr") || lowerTheme.includes("car")) {
    timerName = "🚂 Trem na Trilha";
    const trainX = (1 - progress) * 70 + 10;
    content = (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="48" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="2" />
        <line x1="8" y1="70" x2="92" y2="70" stroke="#475569" strokeWidth="4" />
        {[15, 30, 45, 60, 75, 85].map((x) => (
          <line key={x} x1={x} y1="70" x2={x} y2="76" stroke="#475569" strokeWidth="2.5" />
        ))}
        <g transform="translate(85, 45)">
          <rect x="0" y="0" width="3" height="25" fill="#1e293b" />
          <polygon points="3,0 15,5 3,10" fill="#22c55e" />
          <circle cx="1.5" cy="0" r="2" fill="#ef4444" />
        </g>
        {progress > 0 && progress < 1 && (
          <motion.circle 
            cx={trainX + 4} 
            cy="48" 
            r="3" 
            fill="#cbd5e1" 
            opacity="0.8"
            animate={{ y: [0, -10], x: [0, -5], opacity: [0.8, 0], scale: [1, 2] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
          />
        )}
        <g transform={`translate(${trainX}, 50)`}>
          <rect x="-8" y="0" width="10" height="15" fill="#dc2626" rx="1" />
          <rect x="-6" y="2" width="6" height="5" fill="#bae6fd" />
          <rect x="2" y="5" width="12" height="10" fill="#2563eb" rx="1" />
          <rect x="10" y="0" width="3" height="5" fill="#1e293b" />
          <circle cx="-5" cy="16" r="3.5" fill="#1e293b" />
          <circle cx="5" cy="16" r="3.5" fill="#1e293b" />
          <circle cx="11" cy="16" r="3.5" fill="#1e293b" />
        </g>
      </svg>
    );
  } else if (lowerTheme.includes("mine") || lowerTheme.includes("block") || lowerTheme.includes("craft") || lowerTheme.includes("terra")) {
    timerName = "🧱 Blocos Minecraft";
    const blocksCount = Math.floor((1 - progress) * 9);
    content = (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <rect width="100" height="100" fill="#f5f5f4" rx="8" stroke="#d6d3d1" strokeWidth="2" />
        {[0, 1, 2].map((r) =>
          [0, 1, 2].map((c) => {
            const idx = r * 3 + c;
            const isBuilt = idx < blocksCount;
            const x = 20 + c * 22;
            const y = 20 + r * 22;
            return (
              <g key={idx} opacity={isBuilt ? 1 : 0.15}>
                <rect x={x} y={y} width="18" height="18" fill={isBuilt ? "#16a34a" : "#78716c"} stroke="#15803d" strokeWidth="1" />
                {isBuilt && (
                  <>
                    <rect x={x} y={y} width="18" height="5" fill="#22c55e" />
                    <rect x={x} y={y+5} width="4" height="6" fill="#15803d" />
                    <rect x={x+8} y={y+5} width="3" height="4" fill="#15803d" />
                    <rect x={x+14} y={y+5} width="4" height="7" fill="#15803d" />
                  </>
                )}
              </g>
            );
          })
        )}
        <rect x="15" y="86" width="70" height="6" fill="#444" rx="3" />
        <rect x="15" y="86" width={70 * (1 - progress)} height="6" fill="#22c55e" rx="3" />
      </svg>
    );
  } else {
    timerName = "🐶 Mascote Caminhando";
    const mascotX = (1 - progress) * 65 + 10;
    content = (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="48" fill="#fffbeb" stroke="#fef3c7" strokeWidth="2" />
        <line x1="8" y1="75" x2="92" y2="75" stroke="#f59e0b" strokeWidth="3" strokeDasharray="3,3" />
        <g transform="translate(80, 58)">
          <path d="M2,17 L14,17 L12,9 L4,9 Z" fill="#f43f5e" />
          <circle cx="8" cy="7" r="1.5" fill="#fef08a" />
          <path d="M4,17 Q8,12 12,17" fill="none" stroke="#be123c" strokeWidth="1.5" />
          <rect x="6" y="2" width="4" height="8" fill="#f1f5f9" rx="1" transform="rotate(20 8 6)" />
        </g>
        <g transform={`translate(${mascotX}, 55)`}>
          <rect x="-8" y="0" width="16" height="11" fill="#1e293b" rx="4" />
          <rect x="-8" y="0" width="8" height="11" fill="#f8fafc" rx="1" />
          <circle cx="-10" cy="-4" r="7" fill="#1e293b" />
          <circle cx="-11" cy="-4" r="5" fill="#f8fafc" />
          <circle cx="-13" cy="-5" r="1.2" fill="#000" />
          <path d="M-8,-10 Q-5,-6 -8,-4" fill="#1e293b" stroke="#000" strokeWidth="1" />
          <motion.path 
            d="M8,2 Q14,-4 12,-6" 
            fill="none" 
            stroke="#1e293b" 
            strokeWidth="3.5" 
            strokeLinecap="round"
            animate={progress > 0 && progress < 1 ? { rotate: [0, 20, 0, -20, 0] } : {}}
            transition={{ repeat: Infinity, duration: 0.6 }}
            style={{ transformOrigin: "8px 2px" }}
          />
          <line x1="-5" y1="11" x2="-5" y2="17" stroke="#f8fafc" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="-1" y1="11" x2="-1" y2="17" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="3" y1="11" x2="3" y2="17" stroke="#f8fafc" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="6" y1="11" x2="6" y2="17" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      </svg>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="text-[9px] font-black uppercase tracking-widest text-slate-700 select-none">
        {timerName}
      </span>
      <div className="relative w-20 h-20 flex items-center justify-center bg-white rounded-full p-2 border-2 border-slate-350 shadow-xxs">
        <div className="w-full h-full">
          {content}
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
          <span className="text-[10px] font-black text-slate-950 bg-white/85 px-1.5 py-0.5 rounded shadow-xxs">
            {minutesLeft}m
          </span>
        </div>
      </div>
    </div>
  );
};

export default function ChildRoutine() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentDay, setCurrentDay] = useState('1');
  const [collieState, setCollieState] = useState<CollieState>('idle');
  const [celebratingTaskId, setCelebratingTaskId] = useState<string | null>(null);
  const [childHyperfocus, setChildHyperfocus] = useState('Border Collies 🐕');
  const [sensoryVisuals, setSensoryVisuals] = useState<'rich' | 'minimal'>('rich');

  // Child Multi-profile states
  const [children, setChildren] = useState<any[]>([]);
  const [activeChild, setActiveChild] = useState<any | null>(null);
  const [loadingChildren, setLoadingChildren] = useState(true);
  
  // Parental Lock states
  const router = useRouter();
  const [lockType, setLockType] = useState<'pin' | 'math' | 'none'>('math');
  const [parentPinCode, setParentPinCode] = useState('1234');
  const [showLockModal, setShowLockModal] = useState(false);
  const [exitTarget, setExitTarget] = useState('/');
  const [mathProblem, setMathProblem] = useState({ question: '', answer: 0 });

  // Time Timer, Token Economy, and Regulation States
  const [timerProgress, setTimerProgress] = useState(1.0);
  const [timerMinutesLeft, setTimerMinutesLeft] = useState(30);
  const [transitionWarned, setTransitionWarned] = useState<string | null>(null);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [activeAmbientType, setActiveAmbientType] = useState<'none' | 'rain' | 'binaural' | 'white' | 'pink'>('none');
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [sensoryProfile, setSensoryProfile] = useState<'balanced' | 'hypersensitive' | 'hyposensitive'>('balanced');
  const [timerStyle, setTimerStyle] = useState<'circle' | 'hourglass' | 'droplets' | 'hyperfocus'>('circle');
  const [showStoriesModal, setShowStoriesModal] = useState(false);
  const [selectedStory, setSelectedStory] = useState<any | null>(null);
  const [currentStoryStep, setCurrentStoryStep] = useState(0);

  // Environmental states for sensory logs
  const [decibels, setDecibels] = useState<number>(45);
  const [lightLevel, setLightLevel] = useState<'Baixa' | 'Média' | 'Alta'>('Média');
  const [location, setLocation] = useState<string>('Casa');
  const [activeTrigger, setActiveTrigger] = useState<string>('Nenhum');
  const [isMeasuringNoise, setIsMeasuringNoise] = useState(false);

  // Sleep Mode states
  const [sleepMode, setSleepMode] = useState(false);

  useEffect(() => {
    return () => {
      stopAmbientSound();
    };
  }, []);

  useEffect(() => {
    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let stream: MediaStream | null = null;
    let animationFrameId: number;

    if (showMoodModal) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((s) => {
          stream = s;
          audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const source = audioContext.createMediaStreamSource(s);
          analyser = audioContext.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);
          
          setIsMeasuringNoise(true);
          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);

          const updateVolume = () => {
            if (!analyser) return;
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
              sum += dataArray[i];
            }
            const average = sum / bufferLength;
            const dbVal = Math.round(30 + (average / 255) * 70);
            setDecibels(dbVal);
            animationFrameId = requestAnimationFrame(updateVolume);
          };
          updateVolume();
        })
        .catch((err) => {
          console.log("Sem microfone ou permissão negada:", err);
          setIsMeasuringNoise(false);
        });
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (audioContext) audioContext.close();
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [showMoodModal]);

  const handleAmbientChange = (type: 'none' | 'rain' | 'binaural' | 'white' | 'pink') => {
    playBubble();
    setActiveAmbientType(type);
    startAmbientSound(type);
  };

  const generateMathProblem = () => {
    const num1 = Math.floor(Math.random() * 8) + 2; // 2 to 9
    const num2 = Math.floor(Math.random() * 8) + 2; // 2 to 9
    const isPlus = Math.random() > 0.4;
    
    if (isPlus) {
      setMathProblem({
        question: `${num1} + ${num2}`,
        answer: num1 + num2
      });
    } else {
      const bigger = Math.max(num1, num2);
      const smaller = Math.min(num1, num2);
      setMathProblem({
        question: `${bigger} - ${smaller}`,
        answer: bigger - smaller
      });
    }
  };

  const handleAttemptExit = (target = '/') => {
    playBubble();
    const currentLockType = activeChild?.lockType || lockType || 'math';
    
    if (currentLockType === 'none') {
      router.push(target);
      return;
    }
    
    setExitTarget(target);
    if (currentLockType === 'math') {
      generateMathProblem();
    }
    setShowLockModal(true);
  };

  // Star particles for lúdico reward feedback
  const [starParticles, setStarParticles] = useState<{ id: number; x: number; y: number; scale: number; rotate: number }[]>([]);

  const generateStars = () => {
    if (sensoryVisuals === 'minimal') return; // Skip star explosions to avoid sensory overload
    const newStars = Array.from({ length: 15 }).map((_, idx) => ({
      id: Date.now() + idx,
      x: (Math.random() - 0.5) * 220, // horizontal spread
      y: -60 - Math.random() * 120,   // vertical float
      scale: Math.random() * 0.7 + 0.6,
      rotate: Math.random() * 360
    }));
    setStarParticles(newStars);
    setTimeout(() => {
      setStarParticles([]);
    }, 2000);
  };
  
  // 1. Detect current day of month, load children and subscribe to tasks
  useEffect(() => {
    const todayDayOfMonth = new Date().getDate().toString();
    setCurrentDay(todayDayOfMonth);

    const loadPortal = async () => {
      setLoadingChildren(true);
      try {
        const fetchedChildren = await firebaseBridge.auth.getChildren();
        setChildren(fetchedChildren);

        // Read childId from query string safely on client
        const searchParams = new URLSearchParams(window.location.search);
        const childId = searchParams.get('childId');

        let active = null;
        if (childId) {
          active = fetchedChildren.find(c => c.id === childId) || null;
        }

        // Fallback to cached active child if url has no childId
        if (!active) {
          const cached = firebaseBridge.auth.getActiveChild();
          if (cached && fetchedChildren.some(c => c.id === cached.id)) {
            active = fetchedChildren.find(c => c.id === cached.id) || null;
          }
        }

        if (active) {
          setActiveChild(active);
          firebaseBridge.auth.setActiveChild(active);
          
          if (active.childHyperfocus) setChildHyperfocus(active.childHyperfocus);
          setLockType((active.lockType || 'math') as any);
          setParentPinCode(active.parentPinCode || '1234');
          setSensoryVisuals((active.sensoryVisuals || 'rich') as any);
          setSensoryProfile((active.sensoryProfile || 'balanced') as any);
          setTimerStyle((active.timerStyle || 'circle') as any);
        }
      } catch (err) {
        console.error('Erro no portal infantil:', err);
      } finally {
        setLoadingChildren(false);
      }
    };

    loadPortal();

    // Subscribe to tasks in real time
    const unsubscribeTasks = firebaseBridge.db.onSnapshotTasks((fetchedTasks) => {
      setTasks(fetchedTasks);
    });

    return () => unsubscribeTasks();
  }, []);

  // Filter tasks for the current day, sorted by time/order
  const todayTasks = tasks
    .filter(t => t.day === currentDay)
    .sort((a, b) => a.time.localeCompare(b.time));

  // Find active task (first uncompleted task of today)
  const activeTask = todayTasks.find(t => !t.isCompleted);
  
  // Next two tasks in line
  const remainingTasks = todayTasks.filter(t => !t.isCompleted && t.id !== activeTask?.id);
  const nextTasks = remainingTasks.slice(0, 2);

  // Completed tasks today
  const completedTasks = todayTasks.filter(t => t.isCompleted);

  // Checks if the entire day's routine is completed
  const isDayFinished = todayTasks.length > 0 && todayTasks.every(t => t.isCompleted);

  // 2. Automatically speak the active task title when it changes
  useEffect(() => {
    if (activeTask && !celebratingTaskId) {
      const timer = setTimeout(() => {
        speakText(`Sua missão agora é: ${activeTask.title}`);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [activeTask?.id, celebratingTaskId]);

  // 3. Automatically speak when all tasks of the day are finished
  useEffect(() => {
    if (isDayFinished) {
      const timer = setTimeout(() => {
        speakText("Parabéns! Todas as missões de hoje foram cumpridas! Hora de descansar.");
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isDayFinished]);

  // Time Timer Countdown calculations
  useEffect(() => {
    if (!activeTask) return;
    
    const updateTimer = () => {
      const now = new Date();
      const [taskH, taskM] = activeTask.time.split(':').map(Number);
      const taskTime = new Date();
      taskTime.setHours(taskH, taskM, 0, 0);

      // Find the next task time to determine duration
      let durationMinutes = 30; // default
      if (activeTask.duration && activeTask.duration > 0) {
        durationMinutes = activeTask.duration;
      } else if (todayTasks.length > 0) {
        const nextTaskIndex = todayTasks.findIndex(t => t.id === activeTask.id) + 1;
        if (nextTaskIndex < todayTasks.length) {
          const nextT = todayTasks[nextTaskIndex];
          const [nextH, nextM] = nextT.time.split(':').map(Number);
          const nextTime = new Date();
          nextTime.setHours(nextH, nextM, 0, 0);
          const diffMs = nextTime.getTime() - taskTime.getTime();
          if (diffMs > 0) {
            durationMinutes = Math.min(120, Math.floor(diffMs / 60000));
          }
        }
      }

      const elapsedMs = now.getTime() - taskTime.getTime();
      const elapsedMinutes = elapsedMs / 60000;
      
      let minutesLeft = durationMinutes - elapsedMinutes;
      if (minutesLeft < 0) minutesLeft = 0;
      if (minutesLeft > durationMinutes) minutesLeft = durationMinutes;

      const progress = minutesLeft / durationMinutes;
      setTimerProgress(progress);
      setTimerMinutesLeft(Math.ceil(minutesLeft));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 5000);
    return () => clearInterval(interval);
  }, [activeTask?.id, todayTasks]);

  // Transition Alert
  useEffect(() => {
    if (!activeTask || timerMinutesLeft === undefined) return;
    const warningThreshold = activeChild?.transitionMinutes || 5;
    
    if (nextTasks.length > 0 && timerMinutesLeft <= warningThreshold && timerMinutesLeft > 0) {
      if (transitionWarned !== activeTask.id) {
        setTransitionWarned(activeTask.id);
        const nextTaskName = nextTasks[0].title;
        playMarimba(349.23, 0.3); // soft transition marimba note
        setTimeout(() => {
          speakText(`Atenção, em ${timerMinutesLeft} minutos será hora de: ${nextTaskName}`);
        }, 500);
      }
    }
  }, [timerMinutesLeft, activeTask?.id, nextTasks, activeChild?.transitionMinutes, transitionWarned]);

  // Handle task completion click
  const handleCompleteTask = async (task: Task) => {
    if (celebratingTaskId) return; // Prevent double trigger

    setCelebratingTaskId(task.id);
    setCollieState('celebrating');
    
    // 1. Play soft marimba celebration notes
    playCelebration();

    // 2. Trigger sensory reward stars
    generateStars();

    // 3. Wait 2 seconds (sensory closure standard) to update state
    setTimeout(async () => {
      try {
        await firebaseBridge.db.updateTask(task.id, { isCompleted: true });

        // Add Token to Child for positive behavior reward
        if (activeChild) {
          const updatedChild = await firebaseBridge.auth.addTokens(activeChild.id, 1);
          setActiveChild(updatedChild);
          firebaseBridge.auth.setActiveChild(updatedChild);

          if (updatedChild.tokens !== undefined && updatedChild.rewardCost !== undefined && updatedChild.tokens >= updatedChild.rewardCost) {
            playCelebration();
            setShowRewardModal(true);
          }
        }

        // Check if all tasks in the period are now completed
        const period = task.period;
        const periodTasks = todayTasks.filter(t => t.period === period);
        const isPeriodFinished = periodTasks.every(t => t.isCompleted || t.id === task.id);
        
        if (isPeriodFinished) {
          setTimeout(() => {
            setShowMoodModal(true);
          }, 600);
        }
      } catch (err) {
        console.error('Erro ao completar tarefa:', err);
      } finally {
        setCelebratingTaskId(null);
        setCollieState('idle');
      }
    }, 2000);
  };

  const handleClaimReward = async () => {
    if (!activeChild) return;
    playMarimba(523.25, 0.25);
    try {
      const updatedChild = await firebaseBridge.auth.addTokens(activeChild.id, -(activeChild.rewardCost || 10));
      setActiveChild(updatedChild);
      firebaseBridge.auth.setActiveChild(updatedChild);
      setShowRewardModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectMood = async (selectedMood: 'feliz' | 'calmo' | 'agitado' | 'triste') => {
    if (!activeChild) return;
    playMarimba(440, 0.25);
    try {
      await firebaseBridge.db.addSensoryLog({
        childId: activeChild.id,
        mood: selectedMood,
        notes: 'Humor registrado pelo próprio usuário na rotina.',
        decibels: decibels,
        lightLevel: lightLevel,
        location: location,
        trigger: activeTrigger
      });
      speakText("Obrigado por me contar como você está se sentindo! Estou muito orgulhoso de você.");
      setShowMoodModal(false);
    } catch (err) {
      console.error(err);
    }
  };


  const handleMascotClick = () => {
    if (isDayFinished) {
      playMarimba(261.63, 0.4);
      speakText("Parabéns! Todas as missões de hoje foram cumpridas! Hora de descansar.");
      return;
    }
    
    setCollieState('celebrating');
    playMarimba(329.63, 0.3);
    if (activeTask) {
      speakText(activeTask.title);
    }
    setTimeout(() => {
      if (isDayFinished) setCollieState('sleeping');
      else setCollieState('idle');
    }, 2000);
  };

  // Safe animation transitions
  const transitionConfig = {
    type: "tween",
    duration: 0.35,
    ease: "easeInOut"
  } as const;

  // Twinkling stars specifications for relaxing night sky
  const twinklingStars = [
    { id: 1, top: "12%", left: "15%", delay: 0 },
    { id: 2, top: "25%", left: "80%", delay: 0.5 },
    { id: 3, top: "8%", left: "45%", delay: 1.2 },
    { id: 4, top: "35%", left: "10%", delay: 0.8 },
    { id: 5, top: "70%", left: "85%", delay: 1.5 },
    { id: 6, top: "82%", left: "20%", delay: 0.3 },
    { id: 7, top: "60%", left: "6%", delay: 2.1 },
    { id: 8, top: "45%", left: "92%", delay: 1.7 }
  ];

  // If no active child is selected, show the selection screen
  if (!activeChild) {
    return (
      <main className="min-h-screen bg-gradient-to-tr from-[#f8fafc] via-[#eff6ff] to-[#f0fdf4] flex flex-col items-center justify-center p-6 text-slate-900 relative overflow-hidden">
        {/* Playful background blobs */}
        <div className="absolute top-[-100px] left-[-100px] w-[300px] h-[300px] bg-blue-200/50 rounded-full filter blur-3xl -z-10 animate-pulse"></div>
        <div className="absolute bottom-[-100px] right-[-100px] w-[300px] h-[300px] bg-indigo-200/40 rounded-full filter blur-3xl -z-10 animate-pulse"></div>

        <div className="max-w-2xl w-full text-center flex flex-col items-center gap-8 z-10">
          <div className="w-24 h-24 bg-indigo-100 text-indigo-700 rounded-3xl flex items-center justify-center font-bold text-4xl shadow-md border-2 border-indigo-200">
            🐶
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-950 tracking-tight font-Outfit">Quem é você hoje? 🐶</h1>
            <p className="text-sm font-bold text-slate-750 mt-3 font-semibold">Escolha seu perfil para carregar sua agenda lúdica!</p>
          </div>

          {loadingChildren ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm font-bold text-slate-700 animate-pulse">Carregando seus dados...</span>
            </div>
          ) : children.length === 0 ? (
            <div className="bg-white border-2 border-slate-300 p-8 rounded-2xl shadow-md text-center">
              <p className="text-sm font-bold text-slate-700">Nenhuma criança cadastrada ainda.</p>
              <p className="text-xs text-slate-600 mt-2 font-semibold">Peça ao seu responsável para cadastrar seu perfil no painel principal.</p>
              <button 
                onClick={() => router.push('/dashboard')}
                className="mt-5 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer border-none font-Outfit"
              >
                Ir para o Painel do Responsável
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-lg mt-4">
              {children.map(child => (
                <button
                  key={child.id}
                  onClick={() => {
                    playMarimba(392, 0.2);
                    setActiveChild(child);
                    firebaseBridge.auth.setActiveChild(child);
                    
                    if (child.childHyperfocus) setChildHyperfocus(child.childHyperfocus);
                    setLockType(child.lockType || 'math');
                    setParentPinCode(child.parentPinCode || '1234');
                    setSensoryVisuals(child.sensoryVisuals || 'rich');
                    setSensoryProfile(child.sensoryProfile || 'balanced');
                    setTimerStyle(child.timerStyle || 'circle');
                    
                    // Redirect to include childId in URL for easy bookmarking
                    router.replace(`/routine?childId=${child.id}`);
                  }}
                  className="bg-white border-2 border-slate-350 hover:border-indigo-600 rounded-3xl p-6 shadow-md hover:shadow-2xl transition-all hover:-translate-y-1 flex flex-col items-center gap-4 text-center cursor-pointer group"
                >
                  <div className="w-20 h-20 bg-indigo-50 text-indigo-650 group-hover:bg-indigo-100 rounded-2xl flex items-center justify-center text-4xl shadow-inner transition-colors border border-transparent group-hover:border-indigo-200">
                    {child.gender === 'Feminino' ? '👧' : child.gender === 'Masculino' ? '👦' : '👶'}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 group-hover:text-indigo-900 transition-colors font-Outfit">{child.name}</h3>
                    {child.diagnosis && child.diagnosis !== 'Não Informado' && (
                      <span className="inline-block text-[10px] mt-2.5 px-3 py-1 bg-slate-200 group-hover:bg-indigo-100 group-hover:text-indigo-800 rounded-full font-black uppercase tracking-wider text-slate-750">
                        {child.diagnosis}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    );
  }

  // Dynamic visual layout for day finished (darker, cozy, resting theme)
  if (isDayFinished) {
    const profileClass = sensoryProfile === 'hypersensitive'
      ? 'saturate-[60%] brightness-[90%] contrast-[88%]'
      : sensoryProfile === 'hyposensitive'
      ? 'saturate-[125%] contrast-[110%]'
      : '';

    return (
      <main className={`min-h-screen flex flex-col items-center p-6 pb-12 bg-gradient-to-b from-[#0b0f19] via-[#1a2035] to-[#2b1f3d] text-white relative overflow-hidden ${profileClass}`}>
        {/* Twinkling stars in the background */}
        {sensoryVisuals === 'rich' && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            {twinklingStars.map(star => (
              <motion.div
                key={star.id}
                className="absolute w-1.5 h-1.5 bg-yellow-100 rounded-full"
                style={{ top: star.top, left: star.left }}
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 3.5, delay: star.delay, repeat: Infinity, ease: "easeInOut" }}
              />
            ))}
          </div>
        )}

        {/* Floating cozy moon */}
        {sensoryVisuals === 'rich' && (
          <motion.div 
            className="absolute top-10 right-10 w-24 h-24 pointer-events-none select-none z-0 hidden md:block"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <svg viewBox="0 0 100 100" className="w-full h-full filter drop-shadow-[0_0_20px_rgba(254,240,138,0.25)]">
              <path d="M 50 15 C 30 15, 30 75, 75 75 C 80 75, 83 72, 85 70 C 65 72, 45 60, 45 40 C 45 28, 52 20, 58 15 C 55 15, 52 15, 50 15 Z" fill="#fef08a" />
            </svg>
          </motion.div>
        )}

        {/* Top Navigation Header (styled for Dark/Night view) */}
        <div className="w-full max-w-2xl md:max-w-4xl flex items-center justify-between mb-8 z-10 px-4 md:px-6">
          <div className="flex gap-2 items-center">
            <button 
              onClick={() => handleAttemptExit('/')}
              onMouseEnter={playBubble}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-xs font-black rounded-full border-2 border-slate-700 shadow-premium transition-all active:scale-95 cursor-pointer text-slate-200"
            >
              🏠 Início
            </button>
            
            <button
              onClick={() => { playBubble(); setShowStoriesModal(true); }}
              onMouseEnter={playBubble}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-950 hover:bg-indigo-900 border-2 border-indigo-800 text-indigo-200 text-xs font-black rounded-full shadow-premium transition-all active:scale-95 cursor-pointer"
            >
              📖 Histórias
            </button>
          </div>

          <h2 className="text-xs font-black bg-slate-800 border-2 border-slate-700 text-slate-200 px-5 py-2.5 rounded-full shadow-premium uppercase tracking-widest font-Outfit">
            {DAY_LABELS[currentDay] || `Dia ${currentDay} 📅`}
          </h2>
          
          {/* Ambient Sound Selector */}
          <div className="flex bg-slate-800 border-2 border-slate-700 p-1 rounded-full shadow-premium gap-1 items-center z-10">
            <button
              onClick={() => handleAmbientChange('none')}
              className={`px-3 py-1.5 rounded-full text-xs font-black transition-all ${
                activeAmbientType === 'none'
                  ? 'bg-slate-700 text-slate-100'
                  : 'bg-transparent text-slate-405 hover:text-slate-200'
              }`}
              title="Silencioso"
            >
              🔈
            </button>
            <button
              onClick={() => handleAmbientChange('rain')}
              className={`px-3 py-1.5 rounded-full text-xs font-black transition-all ${
                activeAmbientType === 'rain'
                  ? 'bg-blue-900 text-blue-105'
                  : 'bg-transparent text-slate-405 hover:text-blue-300'
              }`}
              title="Som de Chuva"
            >
              🌧️
            </button>
            <button
              onClick={() => handleAmbientChange('binaural')}
              className={`px-3 py-1.5 rounded-full text-xs font-black transition-all ${
                activeAmbientType === 'binaural'
                  ? 'bg-indigo-900 text-indigo-105'
                  : 'bg-transparent text-slate-405 hover:text-indigo-300'
              }`}
              title="Foco Binaural"
            >
              🧠
            </button>
          </div>
        </div>

        <motion.div
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={transitionConfig}
          className="z-10 w-full max-w-lg md:max-w-4xl text-center flex flex-col items-center gap-6 px-4 md:px-6"
        >
          {/* Night indicator */}
          <span className="text-xs font-black uppercase tracking-wider text-indigo-300 bg-indigo-950/70 px-4.5 py-2 rounded-full border border-indigo-700/50 shadow-inner flex items-center gap-1.5">
            🌙 Previsibilidade de Fim de Dia
          </span>

          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-1 text-yellow-100">
            Missões Cumpridas!
          </h1>
          <p className="text-slate-350 text-sm max-w-xs leading-relaxed font-semibold">
            Você completou todas as atividades de hoje. Hora de descansar!
          </p>

          {/* Sleeping Border Collie Cozy SVG Mascot */}
          <div className="relative cursor-pointer py-4" onClick={handleMascotClick}>
            {/* Glowing moon shadow background */}
            <div className="absolute w-36 h-36 bg-indigo-500/20 rounded-full filter blur-xl -z-10 animate-pulse"></div>
            <HyperfocusMascot hyperfocus={childHyperfocus} state="sleeping" size={240} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            {/* Badges Gallery Reward */}
            <div className="w-full bg-slate-800/50 border border-slate-700/40 p-5 rounded-3xl flex flex-col gap-4 text-left shadow-2xl">
              <h4 className="font-extrabold text-slate-200 text-xs uppercase tracking-widest flex items-center gap-1.5 select-none">
                🏅 Medalhas conquistadas hoje:
              </h4>
              <div className="grid grid-cols-3 gap-3">
                {BADGES.map(badge => (
                  <motion.div 
                    key={badge.id}
                    whileHover={{ scale: 1.05 }}
                    className="bg-slate-700/40 border border-slate-600/30 p-3 rounded-2xl flex flex-col items-center text-center gap-1 shadow-md"
                  >
                    <span className="text-3xl animate-pulse select-none">{badge.icon}</span>
                    <h5 className="font-black text-slate-100 text-[10px] leading-tight mt-1">{badge.label}</h5>
                    <span className="text-[8px] text-slate-400 leading-tight mt-0.5">{badge.desc}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* TEACCH Choice Board (Painel de Escolhas Lúdicas) */}
            <div className="w-full bg-slate-800/50 border border-slate-700/40 p-5 rounded-3xl flex flex-col gap-4 text-left shadow-2xl">
              <h4 className="font-extrabold text-slate-200 text-xs uppercase tracking-widest flex items-center gap-1.5 select-none font-Outfit">
                🪁 Painel de Escolhas Lúdicas (O que quer fazer agora?):
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'draw', label: 'Desenhar 🎨', speech: 'Você escolheu desenhar! Divirta-se com as cores!', icon: '🎨' },
                  { id: 'read', label: 'Ler Livro 📚', speech: 'Você escolheu ler um livro! Uma ótima história te espera!', icon: '📚' },
                  { id: 'blocks', label: 'Montar Blocos 🧱', speech: 'Você escolheu brincar de blocos! Que tal construir um castelo?', icon: '🧱' },
                  { id: 'puzzle', label: 'Quebra-cabeça 🧩', speech: 'Você escolheu jogar quebra-cabeça! Vamos encaixar as peças!', icon: '🧩' },
                ].map(choice => {
                  const isSelected = selectedChoice === choice.id;
                  return (
                    <motion.button
                      key={choice.id}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        playBubble();
                        setSelectedChoice(choice.id);
                        speakText(choice.speech);
                      }}
                      className={`p-4.5 rounded-2xl flex flex-col items-center justify-center text-center gap-2 border-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-650/80 border-indigo-500 text-white shadow-lg shadow-indigo-950/50'
                          : 'bg-slate-700/30 border-slate-600/30 text-slate-200 hover:bg-slate-700/50'
                      }`}
                    >
                      <span className="text-4.5xl select-none">{choice.icon}</span>
                      <span className="font-black text-xs tracking-tight font-Outfit mt-1">{choice.label}</span>
                    </motion.button>
                  );
                })}
              </div>
              {selectedChoice && (
                <p className="text-[10px] text-center text-indigo-300 font-extrabold animate-pulse uppercase tracking-wider">
                  Boa escolha! Aproveite seu momento de descanso!
                </p>
              )}
            </div>
          </div>

          <div className="w-full bg-slate-800/40 backdrop-blur-md border border-slate-700/40 p-5 rounded-3xl shadow-xl flex flex-col gap-4 text-left">
            <h3 className="font-extrabold text-slate-200 text-xs flex items-center gap-2">
              ⭐ Suas Conquistas de Hoje ({completedTasks.length}/{todayTasks.length})
            </h3>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-1">
              {completedTasks.map(task => (
                <div 
                  key={task.id} 
                  className="bg-slate-700/50 border border-slate-650/40 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-300 flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  {task.title}
                </div>
              ))}
            </div>
          </div>

          {/* Home Link */}
          <button 
            onClick={() => handleAttemptExit('/')}
            onMouseEnter={playBubble}
            className="mt-2 text-sm text-indigo-300 hover:text-indigo-200 font-bold underline cursor-pointer bg-transparent border-none outline-none transition-all active:scale-95"
          >
            Voltar ao Início 🏠
          </button>
        </motion.div>

        {/* Parental Lock Modal overlay */}
        <AnimatePresence>
          {showLockModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
            >
              <ParentalLockOverlay
                lockType={lockType}
                parentPinCode={parentPinCode}
                mathProblem={mathProblem}
                onSuccess={() => {
                  setShowLockModal(false);
                  router.push(exitTarget);
                }}
                onClose={() => {
                  playBubble();
                  setShowLockModal(false);
                }}
                generateMathProblem={generateMathProblem}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Social Stories Modal Dialog (also available on Day Finished Screen) */}
        <AnimatePresence>
          {showStoriesModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white border-4 border-indigo-400 rounded-[32px] p-6 w-full max-w-lg shadow-2xl flex flex-col gap-6 relative overflow-hidden text-[#0f172a]"
              >
                {/* Close button at top right */}
                <button
                  onClick={() => { playBubble(); setShowStoriesModal(false); setSelectedStory(null); setCurrentStoryStep(0); }}
                  className="absolute top-4 right-4 w-9 h-9 bg-slate-100 hover:bg-slate-200 border-2 border-slate-200 text-slate-500 rounded-full flex items-center justify-center font-black transition-all active:scale-90 cursor-pointer text-sm"
                >
                  ✕
                </button>

                {!selectedStory ? (
                  // Story Selection Screen
                  <div className="flex flex-col gap-5">
                    <div className="text-center mt-2">
                      <span className="text-3xl">📖</span>
                      <h3 className="text-xl font-black text-slate-850 mt-2 font-Outfit">Histórias Sociais do Mascote</h3>
                      <p className="text-xs text-slate-400 font-semibold mt-1">
                        Escolha uma história para ver com o seu mascote!
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto pr-1 scrollbar-thin">
                      {SOCIAL_STORIES.map(story => (
                        <button
                          key={story.id}
                          onClick={() => {
                            playBubble();
                            setSelectedStory(story);
                            setCurrentStoryStep(0);
                            speakText(story.steps[0].text.replace('[Mascote]', childHyperfocus.split(' ')[0]));
                          }}
                          className="p-4 bg-slate-50 hover:bg-indigo-50/40 hover:border-indigo-300 border-2 border-slate-200/80 rounded-2xl transition-all active:scale-98 text-left cursor-pointer flex items-center gap-4 group"
                        >
                          <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-2xl shadow-xxs shrink-0 group-hover:scale-105 transition-all">
                            {story.steps[0].img}
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm text-slate-850 font-Outfit group-hover:text-indigo-750 transition-all">{story.title}</h4>
                            <p className="text-[10px] text-slate-500 font-semibold mt-0.5 leading-normal">{story.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  // Story Reading Screen
                  <div className="flex flex-col items-center gap-5">
                    <div className="flex items-center justify-between w-full border-b border-slate-100 pb-3">
                      <button
                        onClick={() => { playBubble(); setSelectedStory(null); setCurrentStoryStep(0); }}
                        className="text-xxs font-black uppercase tracking-wider text-slate-400 hover:text-slate-650 flex items-center gap-1 cursor-pointer bg-transparent border-none"
                      >
                        ← Voltar
                      </button>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-Outfit">
                        Etapa {currentStoryStep + 1} de {selectedStory.steps.length}
                      </span>
                    </div>

                    {/* Visual Scene */}
                    <div className="flex flex-col items-center gap-3 py-4 w-full bg-slate-50/50 border-2 border-slate-150 rounded-[24px] relative min-h-[220px] justify-center">
                      {/* Big illustration emoji */}
                      <motion.div 
                        key={currentStoryStep}
                        initial={{ scale: 0.7, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                        className="text-7xl select-none"
                      >
                        {selectedStory.steps[currentStoryStep].img}
                      </motion.div>
                      
                      {/* Active hyperfocus mascot is guide here */}
                      <div className="absolute bottom-2 right-4 flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1.5 rounded-full shadow-xxs max-w-[80%]">
                        <span className="text-xs">🐾</span>
                        <span className="text-[9px] font-black text-indigo-700 uppercase tracking-wider font-Outfit">Guia {childHyperfocus.split(' ')[0]}</span>
                      </div>
                    </div>

                    {/* Narration Text */}
                    <motion.p 
                      key={`text-${currentStoryStep}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-slate-700 leading-relaxed font-extrabold text-center px-2 min-h-[60px]"
                    >
                      {selectedStory.steps[currentStoryStep].text.replace('[Mascote]', childHyperfocus.split(' ')[0])}
                    </motion.p>

                    {/* Navigation Buttons */}
                    <div className="flex gap-3 w-full border-t border-slate-100 pt-4 mt-1">
                      {currentStoryStep > 0 ? (
                        <button
                          onClick={() => {
                            playBubble();
                            const prevStep = currentStoryStep - 1;
                            setCurrentStoryStep(prevStep);
                            speakText(selectedStory.steps[prevStep].text.replace('[Mascote]', childHyperfocus.split(' ')[0]));
                          }}
                          className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 border-2 border-slate-350 text-slate-750 text-xs font-black rounded-2xl active:scale-95 transition-all cursor-pointer font-Outfit flex items-center justify-center gap-1"
                        >
                          ⬅️ Anterior
                        </button>
                      ) : null}

                      {currentStoryStep < selectedStory.steps.length - 1 ? (
                        <button
                          onClick={() => {
                            playBubble();
                            const nextStep = currentStoryStep + 1;
                            setCurrentStoryStep(nextStep);
                            speakText(selectedStory.steps[nextStep].text.replace('[Mascote]', childHyperfocus.split(' ')[0]));
                          }}
                          className="flex-1 py-3 bg-indigo-650 hover:bg-indigo-750 text-white text-xs font-black rounded-2xl active:scale-95 transition-all cursor-pointer font-Outfit flex items-center justify-center gap-1"
                        >
                          Próximo ➡️
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            playCelebration();
                            setShowStoriesModal(false);
                            setSelectedStory(null);
                            setCurrentStoryStep(0);
                          }}
                          className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-2xl active:scale-95 transition-all cursor-pointer font-Outfit flex items-center justify-center gap-1 shadow-md shadow-emerald-100"
                        >
                          Concluir 🏆
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    );
  }

  const profileClass = sensoryProfile === 'hypersensitive'
    ? 'saturate-[65%] brightness-[92%] contrast-[88%]'
    : sensoryProfile === 'hyposensitive'
    ? 'saturate-[120%] contrast-[108%]'
    : '';

  return (
    <main className={`min-h-screen transition-colors duration-500 p-6 pb-12 flex flex-col items-center relative overflow-hidden ${
      sleepMode 
        ? 'bg-[#040815] text-amber-100/90' 
        : 'bg-gradient-to-tr from-[#f8fafc] via-[#eff6ff] to-[#f0fdf4] animate-gradient-flow text-[#0f172a]'
    } ${profileClass}`}>
      {/* Background Soft Glows */}
      {sensoryVisuals === 'rich' && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          {sleepMode ? (
            <>
              {twinklingStars.map(star => (
                <motion.div
                  key={star.id}
                  className="absolute w-1.5 h-1.5 bg-yellow-100/80 rounded-full"
                  style={{ top: star.top, left: star.left }}
                  animate={{ opacity: [0.15, 0.85, 0.15] }}
                  transition={{ duration: 4, delay: star.delay, repeat: Infinity, ease: "easeInOut" }}
                />
              ))}
              <div className="absolute top-[15%] left-[-10%] w-80 h-80 bg-blue-950/25 rounded-full filter blur-3xl opacity-40"></div>
              <div className="absolute bottom-[20%] right-[-10%] w-96 h-96 bg-amber-950/20 rounded-full filter blur-3xl opacity-35"></div>
            </>
          ) : (
            <>
              <div className="absolute top-[20%] left-[-15%] w-80 h-80 bg-blue-200/40 rounded-full filter blur-3xl opacity-60 animate-pulse"></div>
              <div className="absolute bottom-[20%] right-[-15%] w-96 h-96 bg-indigo-200/30 rounded-full filter blur-3xl opacity-50 animate-pulse" style={{ animationDelay: '2s' }}></div>
            </>
          )}
        </div>
      )}

      {/* Top Navigation */}
      <div className="w-full max-w-2xl md:max-w-5xl flex items-center justify-between mb-8 z-10 px-4 md:px-6">
        <div className="flex gap-2 items-center">
          <button 
            onClick={() => handleAttemptExit('/')}
            onMouseEnter={playBubble}
            className={`flex items-center gap-1.5 px-5 py-2.5 text-xs font-black rounded-full border-2 shadow-premium transition-all active:scale-95 cursor-pointer ${
              sleepMode 
                ? 'bg-slate-905 border-slate-700 text-amber-200 hover:bg-slate-800' 
                : 'bg-white hover:bg-slate-50 border-slate-350 text-slate-805'
            }`}
          >
            🏠 Início
          </button>
          
          <button
            onClick={() => { playBubble(); setShowStoriesModal(true); }}
            onMouseEnter={playBubble}
            className={`flex items-center gap-1.5 px-5 py-2.5 border-2 text-xs font-black rounded-full shadow-premium transition-all active:scale-95 cursor-pointer ${
              sleepMode 
                ? 'bg-amber-950/20 border-amber-900/50 text-amber-300 hover:bg-amber-950/50' 
                : 'bg-white hover:bg-indigo-50 border-indigo-250 text-indigo-700'
            }`}
          >
            📖 Histórias
          </button>

          <button
            onClick={() => {
              playBubble();
              setSleepMode(!sleepMode);
              if (!sleepMode) {
                speakText("Modo sono ativado. Hora de relaxar.");
              } else {
                speakText("Modo sono desativado.");
              }
            }}
            onMouseEnter={playBubble}
            className={`flex items-center gap-1.5 px-5 py-2.5 text-xs font-black rounded-full shadow-premium transition-all active:scale-95 cursor-pointer border-2 ${
              sleepMode 
                ? 'bg-amber-950/80 border-amber-600 text-amber-200' 
                : 'bg-white hover:bg-amber-50 border-amber-200 text-amber-700'
            }`}
          >
            🌙 {sleepMode ? 'Modo Normal' : 'Modo Sono'}
          </button>
        </div>

        <h2 className={`text-xs font-black border-2 px-5 py-2.5 rounded-full shadow-premium uppercase tracking-widest font-Outfit ${
          sleepMode ? 'bg-[#090d1a] border-amber-900/50 text-amber-200' : 'bg-white border-slate-350 text-slate-800'
        }`}>
          {DAY_LABELS[currentDay] || `Dia ${currentDay} 📅`}
        </h2>
        
        {/* Ambient Sound Selector */}
        <div className={`flex border-2 p-1 rounded-full shadow-premium gap-1 items-center z-10 ${
          sleepMode ? 'bg-[#090d1a] border-amber-900/50' : 'bg-white border-slate-350'
        }`}>
          {[
            { type: 'none', label: '🔈', title: 'Silencioso', activeClass: sleepMode ? 'bg-slate-800 text-slate-100' : 'bg-slate-200 text-slate-800', inactiveClass: sleepMode ? 'text-amber-500/60 hover:text-amber-205' : 'text-slate-400 hover:text-slate-650' },
            { type: 'rain', label: '🌧️', title: 'Som de Chuva', activeClass: sleepMode ? 'bg-blue-950 text-blue-305' : 'bg-blue-100 text-blue-800', inactiveClass: sleepMode ? 'text-amber-500/60 hover:text-blue-300' : 'text-slate-405 hover:text-blue-500' },
            { type: 'white', label: '🤍', title: 'Ruído Branco', activeClass: sleepMode ? 'bg-slate-800 text-slate-100' : 'bg-slate-200 text-slate-800', inactiveClass: sleepMode ? 'text-amber-500/60 hover:text-amber-200' : 'text-slate-400 hover:text-slate-605' },
            { type: 'pink', label: '💗', title: 'Ruído Rosa', activeClass: sleepMode ? 'bg-pink-950 text-pink-305' : 'bg-pink-100 text-pink-800', inactiveClass: sleepMode ? 'text-amber-500/60 hover:text-pink-300' : 'text-slate-400 hover:text-pink-650' },
            { type: 'binaural', label: '🧠', title: 'Foco Binaural', activeClass: sleepMode ? 'bg-indigo-950 text-indigo-305' : 'bg-indigo-100 text-indigo-805', inactiveClass: sleepMode ? 'text-amber-500/60 hover:text-indigo-300' : 'text-slate-400 hover:text-indigo-500' }
          ].map(btn => (
            <button
              key={btn.type}
              onClick={() => handleAmbientChange(btn.type as any)}
              className={`px-2.5 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer border-none ${
                activeAmbientType === btn.type ? btn.activeClass : `bg-transparent ${btn.inactiveClass}`
              }`}
              title={btn.title}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full max-w-2xl md:max-w-5xl flex flex-col md:grid md:grid-cols-12 gap-6 z-10 px-4 md:px-6">
        
        {/* Token Economy Stars Row */}
        {activeChild && !sleepMode && (
          <div className="bg-white border-2 border-slate-300 p-4.5 rounded-[24px] shadow-premium flex flex-col sm:flex-row items-center justify-between gap-3 w-full md:col-span-12">
            <div className="flex items-center gap-2">
              <span className="text-xl">🪙</span>
              <div>
                <h4 className="font-extrabold text-xs text-slate-900 leading-tight text-left font-Outfit">Estrelas do Reforço Positivo</h4>
                <p className="text-[10px] text-slate-705 font-semibold mt-0.5 text-left">
                  Ganhe {activeChild.rewardCost || 10} estrelas para: <strong className="text-indigo-700 font-black">{activeChild.rewardName || 'Prêmio'}</strong>
                </p>
              </div>
            </div>

            {/* Stars rendering */}
            <div className="flex items-center gap-1.5 bg-slate-50 border-2 border-slate-300 px-3.5 py-1.5 rounded-full shadow-xxs">
              {(() => {
                const earned = activeChild.tokens || 0;
                const cost = activeChild.rewardCost || 10;
                return Array.from({ length: Math.min(15, cost) }).map((_, idx) => {
                  const isGold = idx < earned;
                  return (
                    <span 
                      key={idx} 
                      className={`text-base select-none transition-all ${
                        isGold ? 'text-yellow-450 scale-110 drop-shadow-[0_1px_3px_rgba(234,179,8,0.25)] font-black' : 'text-slate-200'
                      }`}
                    >
                      ★
                    </span>
                  );
                });
              })()}
              <span className="text-[10px] font-black text-slate-750 ml-1.5 uppercase">
                {activeChild.tokens || 0} / {activeChild.rewardCost || 10}
              </span>
            </div>
          </div>
        )}
        
        {/* If no tasks entered yet */}
        {sleepMode ? (
          <div className="md:col-span-12 w-full flex flex-col gap-6">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#0b0f19]/90 border-2 border-amber-900/60 rounded-[32px] p-6 md:p-8 shadow-2xl flex flex-col gap-6 text-amber-100"
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-amber-950 pb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl animate-pulse">🌙</span>
                  <div>
                    <h3 className="text-xl font-black text-amber-200 font-Outfit">Ambiente do Sono Sensorial</h3>
                    <p className="text-xs text-amber-400 font-semibold mt-0.5">Sons calmos e histórias acolhedoras para ninar.</p>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    playBubble();
                    setSelectedStory(BEDTIME_STORIES[0]);
                    setCurrentStoryStep(0);
                    speakText(BEDTIME_STORIES[0].steps[0].text.replace('[Mascote]', childHyperfocus.split(' ')[0]));
                    setShowStoriesModal(true);
                  }}
                  className="px-5 py-2.5 bg-amber-950/80 hover:bg-amber-900 border border-amber-700/60 text-amber-200 text-xs font-black rounded-2xl active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  📖 Ler História de Ninar
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#121827] border border-amber-950/50 p-5 rounded-2xl flex flex-col gap-4">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-500 font-Outfit font-extrabold">📻 Reprodutor de Ruídos Relaxantes</span>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { type: 'none', label: 'Silencioso 🔈', activeColor: 'bg-slate-800 text-slate-100 border-slate-700' },
                      { type: 'rain', label: 'Chuva 🌧️', activeColor: 'bg-blue-950 text-blue-300 border-blue-800' },
                      { type: 'white', label: 'Ruído Branco 🤍', activeColor: 'bg-slate-800 text-slate-100 border-slate-650' },
                      { type: 'pink', label: 'Ruído Rosa 💗', activeColor: 'bg-pink-950 text-pink-305 border-pink-900' },
                      { type: 'binaural', label: 'Foco Binaural 🧠', activeColor: 'bg-indigo-950 text-indigo-305 border-indigo-900' }
                    ].map(snd => (
                      <button
                        key={snd.type}
                        onClick={() => handleAmbientChange(snd.type as any)}
                        className={`p-3 border rounded-xl text-xs font-black transition-all active:scale-95 text-center cursor-pointer ${
                          activeAmbientType === snd.type
                            ? `${snd.activeColor} border-2 shadow-inner`
                            : 'bg-transparent text-amber-400/80 border-amber-950 hover:bg-amber-950/20'
                        }`}
                      >
                        {snd.label}
                      </button>
                    ))}
                  </div>

                  <p className="text-[10px] text-amber-450/70 font-semibold leading-relaxed">
                    💡 Os ruídos branco e rosa ajudam a mascarar barulhos externos repentinos que podem assustar a criança.
                  </p>
                </div>

                <div className="bg-[#121827] border border-amber-950/50 p-5 rounded-2xl flex flex-col gap-4">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-500 font-Outfit font-extrabold">🛌 Histórias para Adormecer</span>
                  
                  <div className="flex flex-col gap-2.5 max-h-[180px] overflow-y-auto pr-1">
                    {BEDTIME_STORIES.map(story => (
                      <button
                        key={story.id}
                        onClick={() => {
                          playBubble();
                          setSelectedStory(story);
                          setCurrentStoryStep(0);
                          speakText(story.steps[0].text.replace('[Mascote]', childHyperfocus.split(' ')[0]));
                          setShowStoriesModal(true);
                        }}
                        className="p-3 bg-amber-950/10 hover:bg-amber-950/40 border border-amber-900/40 rounded-xl transition-all text-left cursor-pointer flex items-center gap-3 group"
                      >
                        <span className="text-2xl shrink-0 group-hover:scale-110 transition-transform">{story.steps[0].img}</span>
                        <div>
                          <h4 className="font-extrabold text-xs text-amber-200 font-Outfit">{story.title}</h4>
                          <p className="text-[9px] text-amber-455 mt-0.5 leading-normal">{story.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        ) : todayTasks.length === 0 ? (
          <motion.div 
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white/80 border border-white/50 p-12 rounded-[32px] shadow-premium text-center flex flex-col items-center gap-4 md:col-span-12"
          >
            <HyperfocusMascot hyperfocus={childHyperfocus} state="idle" size={170} />
            <h3 className="text-xl font-extrabold text-slate-700 mt-2">Nenhuma atividade hoje!</h3>
            <p className="text-sm text-slate-400 max-w-xs leading-relaxed font-semibold">
              O responsável ainda não adicionou tarefas na sua agenda de hoje. Peça para ele adicionar no Painel!
            </p>
          </motion.div>
        ) : (
          <>
            {/* 1. MAIN CURRENT MISSION CARD */}
            <AnimatePresence mode="wait">
              {activeTask && (() => {
                const category = getTaskCategory(activeTask.title);
                return (
                  <motion.div
                    key={activeTask.id}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={transitionConfig}
                    className={`bg-white border-4 rounded-[36px] p-8 shadow-premium flex flex-col items-center text-center gap-6 relative overflow-hidden transition-all duration-500 border-t-8 border-t-transparent md:col-span-7 ${category.shadow}`}
                  >
                    {/* Glowing outer soft neon reflection underneath */}
                    {sensoryVisuals === 'rich' && (
                      <div className={`absolute -inset-4 bg-gradient-to-tr ${category.gradient} opacity-5 filter blur-3xl -z-10`}></div>
                    )}

                    {/* Dynamic gradient background hint underlay */}
                    <div className={`absolute top-0 inset-x-0 h-2 bg-gradient-to-r ${category.gradient}`}></div>

                    <div className="flex flex-col items-center gap-2">
                      <div className="relative">
                        <RoutineIllustration category={activeTask.title} size={150} hyperfocus={childHyperfocus} />
                        {(activeTask.customIcon || activeTask.icon) && (
                          <div className="absolute top-0 right-0 w-14 h-14 bg-white border-4 border-indigo-100 text-slate-700 rounded-2xl flex items-center justify-center text-4xl shadow-md overflow-hidden select-none transform rotate-12">
                            {activeTask.customIcon ? (
                              <img src={activeTask.customIcon} alt="PECS" className="w-full h-full object-cover" />
                            ) : (
                              activeTask.icon
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2 items-center flex-wrap justify-center mt-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-800 bg-slate-100 border border-slate-200/60 px-3.5 py-1.5 rounded-full shadow-xxs flex items-center gap-1">
                          🚀 Missão Atual
                        </span>
                        <span className={`text-[10px] font-black uppercase tracking-widest px-3.5 py-1.5 rounded-full border shadow-xxs ${category.tagClass}`}>
                          {category.label}
                        </span>
                      </div>
                      <span className="text-xs font-extrabold text-slate-400 mt-1.5 flex items-center gap-1.5 justify-center">
                        <Clock className="w-4 h-4 text-slate-400" /> Previsão: {activeTask.time} ({activeTask.period})
                      </span>
                    </div>

                    <div className="flex flex-col items-center gap-3 w-full">
                      <h1 
                        onClick={() => { playBubble(); speakText(activeTask.title); }}
                        className="text-3.5xl md:text-4.5xl font-black tracking-tight text-slate-950 max-w-md break-words px-2 cursor-pointer hover:text-indigo-700 transition-all select-none hover:scale-[1.01] font-Outfit"
                        title="Clique para ouvir"
                      >
                        {activeTask.title}
                      </h1>
                      
                      {/* Big Tactile Audio Speaker Pill */}
                      <button 
                        onClick={() => { playBubble(); speakText(activeTask.title + (activeTask.description ? `. Instruções: ${activeTask.description}` : '')); }}
                        className="flex items-center gap-1.5 px-5 py-3 bg-indigo-100 hover:bg-indigo-200 border-2 border-indigo-350 text-indigo-950 text-xs font-black rounded-full shadow-xxs cursor-pointer transition-all active:scale-95 hover:scale-[1.03] font-Outfit"
                      >
                        🔊 Ouvir Atividade
                      </button>

                      {activeTask.description && (
                        <div 
                          onClick={() => { playBubble(); speakText(activeTask.description || ''); }}
                          className="mt-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl max-w-md select-none hover:bg-slate-100/50 transition-all cursor-pointer shadow-xxs"
                          title="Clique para ouvir as instruções"
                        >
                          <p className="text-xs font-bold text-slate-550 leading-relaxed font-Outfit">
                            💡 {activeTask.description}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Time Timer and Transition Banner */}
                    <div className="w-full flex flex-col md:flex-row items-center justify-center gap-4 border-t border-b border-slate-100 py-4 my-2">
                      {/* Time Timer selector */}
                      {timerStyle === 'hourglass' ? (
                        <HourglassTimer progress={timerProgress} minutesLeft={timerMinutesLeft} />
                      ) : timerStyle === 'droplets' ? (
                        <DropletsTimer progress={timerProgress} minutesLeft={timerMinutesLeft} />
                      ) : timerStyle === 'hyperfocus' ? (
                        <HyperfocusThemeTimer progress={timerProgress} minutesLeft={timerMinutesLeft} theme={childHyperfocus} />
                      ) : (
                        <div className="flex flex-col items-center gap-1.5">
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-700 flex items-center gap-1 select-none">
                            ⏱️ Tempo Restante
                          </span>
                          <div className="relative w-20 h-20 flex items-center justify-center">
                            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                              <circle cx="50" cy="50" r="40" fill="none" stroke="#cbd5e1" strokeWidth="8" />
                              <circle 
                                cx="50" 
                                cy="50" 
                                r="40" 
                                fill="none" 
                                stroke="#dc2626" 
                                strokeWidth="8" 
                                strokeDasharray="251.2" 
                                strokeDashoffset={251.2 * (1 - timerProgress)} 
                                strokeLinecap="round"
                                className="transition-all duration-1000 ease-linear"
                              />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center font-bold">
                              <span className="text-base font-black text-slate-950">{timerMinutesLeft}</span>
                              <span className="text-[8px] text-slate-700 uppercase tracking-wider font-extrabold">min</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Transition Warning / Next Task Banner */}
                      {nextTasks.length > 0 && (
                        <div className="flex-1 flex flex-col gap-1.5 text-left bg-slate-100 border-2 border-slate-300 p-3 rounded-2xl shadow-xxs">
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 font-Outfit">Próxima Atividade:</span>
                          <span className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                            {nextTasks[0].customIcon ? (
                              <img src={nextTasks[0].customIcon} alt="" className="w-6 h-6 object-cover rounded-md inline-block mr-1.5 align-middle" />
                            ) : (
                              <span className="text-base">{nextTasks[0].icon || '📅'}</span>
                            )}
                            {" "}{nextTasks[0].title}
                          </span>
                          {timerMinutesLeft <= (activeChild?.transitionMinutes || 5) ? (
                            <span className="text-[10px] text-amber-950 font-black flex items-center gap-1 bg-amber-100 border-2 border-amber-400 px-2.5 py-1 rounded-lg animate-pulse">
                              ⚠️ Prepare-se para a transição!
                            </span>
                          ) : (
                            <span className="text-[9px] text-slate-500 font-semibold">Em seguida, após terminar a missão atual.</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Mascot Collie in Interactive Pedestal with category color background and rewarding stars */}
                    <div className="relative p-8">
                      {/* Star particles overlay cascade */}
                      <AnimatePresence>
                        {starParticles.map(star => (
                          <motion.div
                            key={star.id}
                            initial={{ opacity: 0, scale: 0, x: 0, y: 0, rotate: 0 }}
                            animate={{ 
                              opacity: [0, 1, 1, 0], 
                              scale: [0, star.scale, star.scale, 0],
                              x: star.x,
                              y: star.y,
                              rotate: star.rotate 
                            }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1.8, ease: "easeOut" }}
                            className="absolute text-yellow-450 text-3xl pointer-events-none select-none z-35"
                            style={{ left: "45%", top: "45%" }}
                          >
                            ⭐
                          </motion.div>
                        ))}
                      </AnimatePresence>

                      <div 
                        className="cursor-pointer relative p-5 rounded-full border border-slate-100 bg-slate-50/50 hover:bg-white hover:scale-[1.04] active:scale-95 transition-all shadow-premium"
                        onClick={handleMascotClick}
                      >
                        {sensoryVisuals === 'rich' && (
                          <div className={`absolute -inset-1 rounded-full bg-gradient-to-tr ${category.gradient} opacity-15 filter blur-md`}></div>
                        )}
                        <div className={`absolute bottom-2 right-2 w-9 h-9 rounded-full bg-gradient-to-tr ${category.gradient} flex items-center justify-center shadow-md animate-bounce`}>
                          <category.icon className="w-5.5 h-5.5 text-white" />
                        </div>
                        <HyperfocusMascot 
                          hyperfocus={childHyperfocus}
                          state={celebratingTaskId === activeTask.id ? 'celebrating' : collieState === 'celebrating' ? 'celebrating' : 'guiding'} 
                          size={165} 
                        />
                      </div>
                    </div>

                    {/* LARGE COMPLETE MISSION BUTTON */}
                    <motion.button
                      whileHover={{ scale: 1.015 }}
                      whileTap={{ scale: 0.985 }}
                      onClick={() => handleCompleteTask(activeTask)}
                      disabled={celebratingTaskId !== null}
                      className={`w-full py-5 text-xl font-black rounded-2xl shadow-lg cursor-pointer transform transition-all duration-300 flex items-center justify-center gap-2 border-b-4 border-slate-950/20 ${
                        celebratingTaskId === activeTask.id
                          ? 'bg-gradient-to-r from-emerald-400 to-emerald-500 text-white animate-pulse border-emerald-600/70'
                          : `bg-gradient-to-r ${category.gradient} text-white hover:opacity-95 shadow-md`
                      }`}
                    >
                      {celebratingTaskId === activeTask.id ? (
                        <span className="flex items-center gap-2">
                          <Star className="w-6 h-6 text-yellow-200 animate-spin" /> EXCELENTE! 🎉
                        </span>
                      ) : (
                        'EU TERMINEI! ✅'
                      )}
                    </motion.button>
                  </motion.div>
                );
              })()}
            </AnimatePresence>

            {/* 2. PROGRESS TRACKER OR CLINICAL FIRST-THEN BOARD */}
            {sensoryVisuals === 'minimal' ? (
              /* TEACCH FIRST-THEN (PRIMEIRO-DEPOIS) BOARD */
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full mt-2 md:col-span-5 md:mt-0">
                {/* FIRST CARD (CURRENT ACTIVE TASK) */}
                {activeTask ? (() => {
                  const category = getTaskCategory(activeTask.title);
                  return (
                    <div className={`bg-white border-4 border-indigo-600 rounded-[32px] p-6 shadow-premium flex flex-col items-center text-center gap-4 relative overflow-hidden transition-all duration-300 ${category.shadow}`}>
                      <div className="absolute top-3 left-3 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full select-none font-Outfit">
                        1º Primeiro
                      </div>
                      <div className="mt-4 relative">
                        <RoutineIllustration category={activeTask.title} size={110} hyperfocus={childHyperfocus} />
                        {(activeTask.customIcon || activeTask.icon) && (
                          <div className="absolute top-0 right-0 w-10 h-10 bg-white border-2 border-indigo-105 text-slate-700 rounded-xl flex items-center justify-center text-2xl shadow overflow-hidden select-none">
                            {activeTask.customIcon ? (
                              <img src={activeTask.customIcon} alt="PECS" className="w-full h-full object-cover" />
                            ) : (
                              activeTask.icon
                            )}
                          </div>
                        )}
                      </div>
                      <h4 
                        onClick={() => { playBubble(); speakText(activeTask.title + (activeTask.description ? `. Instruções: ${activeTask.description}` : '')); }}
                        className="text-xl font-black text-slate-950 tracking-tight cursor-pointer hover:text-indigo-700 select-none font-Outfit"
                      >
                        {activeTask.title}
                      </h4>
                      {activeTask.description && (
                        <p 
                          onClick={() => { playBubble(); speakText(activeTask.description || ''); }}
                          className="text-[11px] font-bold text-slate-500 mt-1 cursor-pointer max-w-[200px] hover:text-indigo-700 transition-all leading-normal select-none"
                          title="Clique para ouvir as instruções"
                        >
                          💡 {activeTask.description}
                        </p>
                      )}
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wide">⏱️ Previsão: {activeTask.time}</span>
                    </div>
                  );
                })() : (
                  <div className="bg-white border-4 border-dashed border-slate-300 rounded-[32px] p-6 shadow-premium flex flex-col items-center text-center justify-center gap-3 relative min-h-[200px]">
                    <span className="text-3xl">🎉</span>
                    <h4 className="text-lg font-black text-slate-800 font-Outfit">Primeira Missão</h4>
                    <p className="text-xs text-slate-400 font-semibold max-w-[200px]">Tudo pronto por hoje!</p>
                  </div>
                )}

                {/* THEN CARD (NEXT TASK IN PREDICTIVE TIMELINE) */}
                {nextTasks.length > 0 ? (() => {
                  const nextTask = nextTasks[0];
                  return (
                    <div className="bg-slate-50 border-4 border-dashed border-slate-350 rounded-[32px] p-6 shadow-premium flex flex-col items-center text-center justify-center gap-4 relative overflow-hidden opacity-85">
                      <div className="absolute top-3 left-3 bg-slate-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full select-none font-Outfit">
                        2º Depois
                      </div>
                      <div 
                        onClick={() => { playBubble(); speakText(nextTask.title); }}
                        className="w-16 h-16 rounded-2xl bg-white border-2 border-slate-200 flex items-center justify-center text-3xl shadow-sm cursor-pointer select-none transition-transform active:scale-95 hover:scale-105"
                      >
                        {nextTask.customIcon ? (
                          <img src={nextTask.customIcon} alt="" className="w-full h-full object-cover rounded-2xl" />
                        ) : (
                          nextTask.icon || '📅'
                        )}
                      </div>
                      <h4 
                        onClick={() => { playBubble(); speakText(nextTask.title); }}
                        className="text-xl font-black text-slate-700 tracking-tight cursor-pointer hover:text-indigo-700 select-none font-Outfit"
                      >
                        {nextTask.title}
                      </h4>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wide">Aguardando a missão atual</span>
                    </div>
                  );
                })() : (
                  <div className="bg-slate-50 border-4 border-dashed border-slate-300 rounded-[32px] p-6 shadow-premium flex flex-col items-center text-center justify-center gap-3 relative min-h-[200px] opacity-60">
                    <div className="absolute top-3 left-3 bg-slate-450 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full select-none font-Outfit">
                      2º Depois
                    </div>
                    <span className="text-3xl select-none">🌙</span>
                    <h4 className="text-lg font-black text-slate-650 font-Outfit">Fim da Trilha</h4>
                    <p className="text-xs text-slate-450 font-semibold">Sem tarefas pendentes!</p>
                  </div>
                )}
              </div>
            ) : (
              /* THE ROUTINE TRAIL - GAMIFIED PROGRESS TRACKER (RICH VISUALS) */
              <div className="bg-white border-2 border-slate-300 p-6.5 rounded-[32px] shadow-premium flex flex-col gap-4 text-left w-full md:col-span-5 md:mt-0">
                <h3 className="font-black text-xs text-slate-655 uppercase tracking-widest flex items-center gap-1.5 select-none font-Outfit">
                  🚂 Trilha das Minhas Missões:
                </h3>
                
                <div className="relative flex items-center justify-between px-4 py-6 overflow-x-auto min-h-[100px] scrollbar-none gap-6">
                  
                  {/* Visual Connector Line */}
                  <div className="absolute top-[48px] left-[40px] right-[40px] h-2 bg-slate-300 -z-10 rounded-full" />
                  
                  {todayTasks.map((task, idx) => {
                    const taskCat = getTaskCategory(task.title);
                    const isCompleted = task.isCompleted;
                    const isActive = activeTask?.id === task.id;
                    
                    return (
                      <div key={task.id} className="flex flex-col items-center gap-2 shrink-0 relative">
                        
                        {/* Active Indicator Arrow / Mascot Pointer */}
                        {isActive && (
                          <motion.div 
                            className="absolute top-[-30px] text-lg pointer-events-none"
                            animate={{ y: [0, -4, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                          >
                            🐾
                          </motion.div>
                        )}

                        {/* Node circle */}
                        <motion.div
                          whileHover={{ scale: 1.08 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            playBubble();
                            speakText(task.title);
                          }}
                          className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all cursor-pointer relative ${
                            isCompleted
                              ? 'bg-gradient-to-tr from-emerald-600 to-green-700 text-white border-2 border-white shadow-glow-green scale-95'
                              : isActive
                              ? `bg-white text-indigo-900 border-3 border-indigo-650 scale-110 shadow-lg ring-4 ring-indigo-250`
                              : 'bg-slate-200 text-slate-700 border-2 border-slate-350'
                          }`}
                        >
                          {isCompleted ? (
                            <Check className="w-5 h-5 text-white" />
                          ) : task.customIcon ? (
                            <img src={task.customIcon} alt="" className="w-full h-full object-cover rounded-full" />
                          ) : task.icon ? (
                            <span className="text-xl select-none">{task.icon}</span>
                          ) : (
                            <taskCat.icon className={`w-5 h-5 ${isActive ? 'text-indigo-600 animate-pulse' : 'text-slate-450'}`} />
                          )}
                          
                          {/* Task Order Number Badge */}
                          <span className="absolute bottom-[-6px] right-[-6px] bg-slate-800 text-white text-[8px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-white select-none">
                            {idx + 1}
                          </span>
                        </motion.div>

                        {/* Node Label (Short title) */}
                        <span className={`text-[10px] font-black max-w-[80px] text-center truncate ${
                          isActive ? 'text-slate-850 font-black' : 'text-slate-400'
                        }`}>
                          {task.title.replace(/🪥|🚿|🍳|🏫|📚|🍱|🛌|🎮|🎒/g, '').trim()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </>
        )}

      </div>

      {/* Parental Lock Modal overlay */}
      <AnimatePresence>
        {showLockModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
          >
            <ParentalLockOverlay
              lockType={lockType}
              parentPinCode={parentPinCode}
              mathProblem={mathProblem}
              onSuccess={() => {
                setShowLockModal(false);
                router.push(exitTarget);
              }}
              onClose={() => {
                playBubble();
                setShowLockModal(false);
              }}
              generateMathProblem={generateMathProblem}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Economia de Fichas (Token Economy) Reward Modal */}
      <AnimatePresence>
        {showRewardModal && activeChild && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white border-4 border-indigo-400 rounded-[32px] p-8 w-full max-w-sm shadow-2xl flex flex-col items-center text-center gap-6 relative overflow-hidden"
            >
              {/* Confetti celebration bg hints */}
              <div className="absolute inset-0 bg-gradient-to-tr from-yellow-50 via-white to-indigo-50/50 opacity-60 -z-10" />
              
              <div className="w-18 h-18 bg-yellow-100 text-yellow-500 rounded-full flex items-center justify-center text-4xl shadow-md animate-bounce select-none">
                🎁
              </div>

              <div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Parabéns, você conseguiu! 🎉</h3>
                <p className="text-xs text-slate-400 font-semibold mt-1">
                  Você completou suas missões e desbloqueou seu prêmio:
                </p>
                <div className="mt-3.5 px-6 py-3 bg-indigo-100 border-2 border-indigo-300 text-indigo-950 font-black text-sm rounded-2xl shadow-xxs font-Outfit">
                  {activeChild.rewardName || 'Prêmio'}
                </div>
              </div>

              <div className="flex flex-col gap-2 w-full">
                <button
                  onClick={handleClaimReward}
                  className="w-full py-4 bg-gradient-to-r from-yellow-500 via-amber-500 to-amber-600 text-slate-950 font-black text-sm rounded-2xl shadow-md cursor-pointer transition-all active:scale-95 border-b-4 border-amber-800 font-Outfit"
                >
                  RESGATAR PRÊMIO! 🐾
                </button>
                <button
                  onClick={() => setShowRewardModal(false)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-650 cursor-pointer bg-transparent border-none mt-1"
                >
                  Guardar estrelas para depois
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mood Selection Dialog (Diário de Regulação) */}
      <AnimatePresence>
        {showMoodModal && activeChild && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className={`border-4 rounded-[32px] p-8 w-full max-w-md shadow-2xl flex flex-col items-center text-center gap-6 transition-colors duration-300 ${
                sleepMode 
                  ? 'bg-[#090d1a] border-amber-900/60 text-amber-150' 
                  : 'bg-white border-indigo-400 text-slate-805'
              }`}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm border ${
                sleepMode ? 'bg-amber-950/20 border-amber-900/40' : 'bg-indigo-50 border-indigo-100'
              }`}>
                🧠
              </div>

              <div>
                <h3 className={`text-xl font-black ${sleepMode ? 'text-amber-200' : 'text-slate-800'}`}>Como você está se sentindo agora?</h3>
                <p className={`text-xs font-semibold mt-1 ${sleepMode ? 'text-amber-450' : 'text-slate-400'}`}>
                  Marque sua emoção para ajudar a acompanhar seu dia!
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full">
                {[
                  { key: 'feliz', label: 'Feliz 😊', color: sleepMode ? 'bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-200 border-2 border-emerald-800' : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-950 border-2 border-emerald-450' },
                  { key: 'calmo', label: 'Calmo 🧘', color: sleepMode ? 'bg-sky-950/40 hover:bg-sky-900/40 text-sky-200 border-2 border-sky-800' : 'bg-sky-100 hover:bg-sky-200 text-sky-950 border-2 border-sky-450' },
                  { key: 'agitado', label: 'Agitado 🌀', color: sleepMode ? 'bg-amber-950/40 hover:bg-amber-900/40 text-amber-200 border-2 border-amber-800' : 'bg-amber-100 hover:bg-amber-200 text-amber-950 border-2 border-amber-450' },
                  { key: 'triste', label: 'Triste 😢', color: sleepMode ? 'bg-red-950/40 hover:bg-red-900/40 text-red-200 border-2 border-red-800' : 'bg-red-100 hover:bg-red-200 text-red-950 border-2 border-red-450' }
                ].map(moodOption => (
                  <button
                    key={moodOption.key}
                    onClick={() => handleSelectMood(moodOption.key as any)}
                    className={`p-4 rounded-2xl font-black text-sm shadow-xxs transition-all active:scale-95 hover:scale-[1.02] cursor-pointer text-center font-Outfit ${moodOption.color}`}
                  >
                    {moodOption.label}
                  </button>
                ))}
              </div>

              {/* Medidor de Ruído / Ambiente */}
              <div className={`w-full border p-3 rounded-2xl flex flex-col gap-2 text-left transition-colors duration-300 ${
                sleepMode ? 'bg-[#121827] border-amber-950/50' : 'bg-slate-50 border-slate-200/80'
              }`}>
                <span className={`text-[10px] font-black uppercase tracking-wider font-Outfit flex items-center justify-between ${
                  sleepMode ? 'text-amber-500' : 'text-slate-500'
                }`}>
                  <span>📍 Ambiente Atual</span>
                  {isMeasuringNoise ? (
                    <span className="text-emerald-505 animate-pulse font-extrabold">🎙️ Mic Ativo</span>
                  ) : (
                    <span className="opacity-60">🎙️ Mic Desativo</span>
                  )}
                </span>
                
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-xs font-bold ${sleepMode ? 'text-amber-300' : 'text-slate-700'}`}>Som Ambiente:</span>
                  <div className="flex items-center gap-1.5 flex-1 max-w-[150px]">
                    <div className={`w-full h-2 rounded-full overflow-hidden relative ${sleepMode ? 'bg-[#090d1a]' : 'bg-slate-200'}`}>
                      <div 
                        className={`h-full transition-all duration-300 ${
                          decibels < 55 ? 'bg-emerald-500' : decibels < 75 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, (decibels - 30) * 1.4))}%` }}
                      ></div>
                    </div>
                    <span className={`text-xs font-black whitespace-nowrap ${sleepMode ? 'text-amber-250' : 'text-slate-800'}`}>{decibels} dB</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1.5 mt-1">
                  <div className="flex flex-col gap-0.5">
                    <label className={`text-[8px] font-black uppercase ${sleepMode ? 'text-amber-450' : 'text-slate-450'}`}>Local</label>
                    <select 
                      value={location} 
                      onChange={(e) => setLocation(e.target.value)}
                      className={`text-[10px] font-bold p-1 border rounded-lg ${
                        sleepMode ? 'bg-[#090d1a] border-amber-900 text-amber-200' : 'bg-white border-slate-350 text-slate-700'
                      }`}
                    >
                      <option value="Casa">Casa 🏠</option>
                      <option value="Escola">Escola 🏫</option>
                      <option value="Parque">Parque 🌳</option>
                      <option value="Consultório">Consultório 🩺</option>
                      <option value="Outro">Outro 📍</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <label className={`text-[8px] font-black uppercase ${sleepMode ? 'text-amber-450' : 'text-slate-450'}`}>Luz</label>
                    <select 
                      value={lightLevel} 
                      onChange={(e: any) => setLightLevel(e.target.value)}
                      className={`text-[10px] font-bold p-1 border rounded-lg ${
                        sleepMode ? 'bg-[#090d1a] border-amber-900 text-amber-200' : 'bg-white border-slate-350 text-slate-700'
                      }`}
                    >
                      <option value="Baixa">Suave 💡</option>
                      <option value="Média">Média 🔆</option>
                      <option value="Alta">Forte ☀️</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <label className={`text-[8px] font-black uppercase ${sleepMode ? 'text-amber-450' : 'text-slate-450'}`}>Gatilho</label>
                    <select 
                      value={activeTrigger} 
                      onChange={(e) => setActiveTrigger(e.target.value)}
                      className={`text-[10px] font-bold p-1 border rounded-lg ${
                        sleepMode ? 'bg-[#090d1a] border-amber-900 text-amber-200' : 'bg-white border-slate-350 text-slate-700'
                      }`}
                    >
                      <option value="Nenhum">Nenhum</option>
                      <option value="Barulho">Barulho</option>
                      <option value="Luz Forte">Luz Forte</option>
                      <option value="Transição">Transição</option>
                      <option value="Cansaço">Cansaço</option>
                      <option value="Fome">Fome</option>
                    </select>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowMoodModal(false)}
                className={`text-xs font-bold underline cursor-pointer bg-transparent border-none ${
                  sleepMode ? 'text-amber-500 hover:text-amber-305' : 'text-slate-450 hover:text-slate-650'
                }`}
              >
                Pular check-in
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Social Stories Modal Dialog */}
      <AnimatePresence>
        {showStoriesModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className={`border-4 rounded-[32px] p-6 w-full max-w-lg shadow-2xl flex flex-col gap-6 relative overflow-hidden transition-colors duration-300 ${
                sleepMode 
                  ? 'bg-[#090d1a] border-amber-900/60 text-amber-100' 
                  : 'bg-white border-indigo-400 text-slate-800'
              }`}
            >
              {/* Close button at top right */}
              <button
                onClick={() => { playBubble(); setShowStoriesModal(false); setSelectedStory(null); setCurrentStoryStep(0); }}
                className={`absolute top-4 right-4 w-9 h-9 border-2 rounded-full flex items-center justify-center font-black transition-all active:scale-90 cursor-pointer text-sm ${
                  sleepMode 
                    ? 'bg-[#121827] border-amber-900/40 text-amber-450 hover:bg-amber-950' 
                    : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'
                }`}
              >
                ✕
              </button>

              {!selectedStory ? (
                // Story Selection Screen
                <div className="flex flex-col gap-5">
                  <div className="text-center mt-2">
                    <span className="text-3xl">📖</span>
                    <h3 className={`text-xl font-black mt-2 font-Outfit ${sleepMode ? 'text-amber-200' : 'text-slate-855'}`}>Histórias do Mascote</h3>
                    <p className={`text-xs font-semibold mt-1 ${sleepMode ? 'text-amber-450' : 'text-slate-400'}`}>
                      Escolha uma história para ver com o seu mascote!
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto pr-1 scrollbar-thin">
                    <span className={`text-[10px] font-black uppercase tracking-wider font-Outfit ${sleepMode ? 'text-amber-500' : 'text-indigo-500'}`}>Histórias Sociais 📖</span>
                    {SOCIAL_STORIES.map(story => (
                      <button
                        key={story.id}
                        onClick={() => {
                          playBubble();
                          setSelectedStory(story);
                          setCurrentStoryStep(0);
                          speakText(story.steps[0].text.replace('[Mascote]', childHyperfocus.split(' ')[0]));
                        }}
                        className={`p-4 border-2 rounded-2xl transition-all active:scale-98 text-left cursor-pointer flex items-center gap-4 group ${
                          sleepMode 
                            ? 'bg-[#121827] hover:bg-amber-950/20 hover:border-amber-700 border-amber-955' 
                            : 'bg-slate-50 hover:bg-indigo-50/40 hover:border-indigo-300 border-slate-200/80'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-xxs shrink-0 group-hover:scale-105 transition-all ${
                          sleepMode ? 'bg-amber-950/20 border border-amber-900/40' : 'bg-indigo-50 border border-indigo-100'
                        }`}>
                          {story.steps[0].img}
                        </div>
                        <div>
                          <h4 className={`font-extrabold text-sm font-Outfit transition-all ${sleepMode ? 'text-amber-205 group-hover:text-amber-305' : 'text-slate-855 group-hover:text-indigo-750'}`}>{story.title}</h4>
                          <p className={`text-[10px] font-semibold mt-0.5 leading-normal ${sleepMode ? 'text-amber-450' : 'text-slate-500'}`}>{story.desc}</p>
                        </div>
                      </button>
                    ))}

                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-500 font-Outfit mt-3">Histórias do Sono 🌙💤</span>
                    {BEDTIME_STORIES.map(story => (
                      <button
                        key={story.id}
                        onClick={() => {
                          playBubble();
                          setSelectedStory(story);
                          setCurrentStoryStep(0);
                          speakText(story.steps[0].text.replace('[Mascote]', childHyperfocus.split(' ')[0]));
                        }}
                        className={`p-4 border-2 rounded-2xl transition-all active:scale-98 text-left cursor-pointer flex items-center gap-4 group ${
                          sleepMode 
                            ? 'bg-[#121827] hover:bg-amber-950/20 hover:border-amber-700 border-amber-955' 
                            : 'bg-slate-50 hover:bg-amber-50/40 hover:border-amber-350 border-slate-200/80'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-xxs shrink-0 group-hover:scale-105 transition-all ${
                          sleepMode ? 'bg-amber-950/20 border border-amber-900/40' : 'bg-amber-50 border border-amber-100'
                        }`}>
                          {story.steps[0].img}
                        </div>
                        <div>
                          <h4 className={`font-extrabold text-sm font-Outfit transition-all ${sleepMode ? 'text-amber-205 group-hover:text-amber-305' : 'text-amber-800 group-hover:text-amber-900'}`}>{story.title}</h4>
                          <p className={`text-[10px] font-semibold mt-0.5 leading-normal ${sleepMode ? 'text-amber-450' : 'text-slate-500'}`}>{story.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                // Story Reading Screen
                <div className="flex flex-col items-center gap-5">
                  <div className={`flex items-center justify-between w-full border-b pb-3 ${sleepMode ? 'border-amber-950' : 'border-slate-100'}`}>
                    <button
                      onClick={() => { playBubble(); setSelectedStory(null); setCurrentStoryStep(0); }}
                      className={`text-xxs font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer bg-transparent border-none ${
                        sleepMode ? 'text-amber-500 hover:text-amber-305' : 'text-slate-400 hover:text-slate-650'
                      }`}
                    >
                      ← Voltar
                    </button>
                    <span className={`text-[10px] font-black uppercase tracking-widest font-Outfit ${sleepMode ? 'text-amber-500' : 'text-slate-400'}`}>
                      Etapa {currentStoryStep + 1} de {selectedStory.steps.length}
                    </span>
                  </div>

                  {/* Visual Scene */}
                  <div className={`flex flex-col items-center gap-3 py-4 w-full rounded-[24px] relative min-h-[220px] justify-center border-2 ${
                    sleepMode ? 'bg-[#101524] border-amber-950/60' : 'bg-slate-50/50 border-slate-150'
                  }`}>
                    {/* Big illustration emoji */}
                    <motion.div 
                      key={currentStoryStep}
                      initial={{ scale: 0.7, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15 }}
                      className="text-7xl select-none"
                    >
                      {selectedStory.steps[currentStoryStep].img}
                    </motion.div>
                    
                    {/* Active hyperfocus mascot is guide here */}
                    <div className={`absolute bottom-2 right-4 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full shadow-xxs max-w-[80%] border ${
                      sleepMode ? 'bg-[#0b0f19] border-amber-900/60 text-amber-400' : 'bg-white border-slate-200 text-indigo-750'
                    }`}>
                      <span className="text-xs">🐾</span>
                      <span className="text-[9px] font-black uppercase tracking-wider font-Outfit">Guia {childHyperfocus.split(' ')[0]}</span>
                    </div>
                  </div>

                  {/* Narration Text */}
                  <motion.p 
                    key={`text-${currentStoryStep}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`text-sm leading-relaxed font-extrabold text-center px-2 min-h-[60px] ${sleepMode ? 'text-amber-100' : 'text-slate-700'}`}
                  >
                    {selectedStory.steps[currentStoryStep].text.replace('[Mascote]', childHyperfocus.split(' ')[0])}
                  </motion.p>

                  {/* Navigation Buttons */}
                  <div className={`flex gap-3 w-full border-t pt-4 mt-1 ${sleepMode ? 'border-amber-950' : 'border-slate-100'}`}>
                    {currentStoryStep > 0 ? (
                      <button
                        onClick={() => {
                          playBubble();
                          const prevStep = currentStoryStep - 1;
                          setCurrentStoryStep(prevStep);
                          speakText(selectedStory.steps[prevStep].text.replace('[Mascote]', childHyperfocus.split(' ')[0]));
                        }}
                        className={`flex-1 py-3 border-2 text-xs font-black rounded-2xl active:scale-95 transition-all cursor-pointer font-Outfit flex items-center justify-center gap-1 ${
                          sleepMode 
                            ? 'bg-[#121827] hover:bg-amber-950/20 border-amber-900/40 text-amber-250' 
                            : 'bg-slate-100 hover:bg-slate-200 border-slate-350 text-slate-750'
                        }`}
                      >
                        ⬅️ Anterior
                      </button>
                    ) : null}

                    {currentStoryStep < selectedStory.steps.length - 1 ? (
                      <button
                        onClick={() => {
                          playBubble();
                          const nextStep = currentStoryStep + 1;
                          setCurrentStoryStep(nextStep);
                          speakText(selectedStory.steps[nextStep].text.replace('[Mascote]', childHyperfocus.split(' ')[0]));
                        }}
                        className={`flex-1 py-3 text-xs font-black rounded-2xl active:scale-95 transition-all cursor-pointer font-Outfit flex items-center justify-center gap-1 ${
                          sleepMode 
                            ? 'bg-amber-900 hover:bg-amber-800 text-amber-100 border-none' 
                            : 'bg-indigo-650 hover:bg-indigo-750 text-white'
                        }`}
                      >
                        Próximo ➡️
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          playCelebration();
                          setShowStoriesModal(false);
                          setSelectedStory(null);
                          setCurrentStoryStep(0);
                        }}
                        className={`flex-1 py-3 text-xs font-black rounded-2xl active:scale-95 transition-all cursor-pointer font-Outfit flex items-center justify-center gap-1 shadow-md ${
                          sleepMode 
                            ? 'bg-amber-700 hover:bg-amber-600 text-white shadow-amber-950/40' 
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-100'
                        }`}
                      >
                        Concluir 🏆
                      </button>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

interface ParentalLockOverlayProps {
  lockType: 'pin' | 'math' | 'none';
  parentPinCode: string;
  mathProblem: { question: string; answer: number };
  onSuccess: () => void;
  onClose: () => void;
  generateMathProblem: () => void;
}

const ParentalLockOverlay: React.FC<ParentalLockOverlayProps> = ({
  lockType,
  parentPinCode,
  mathProblem,
  onSuccess,
  onClose,
  generateMathProblem
}) => {
  const [typedPin, setTypedPin] = React.useState('');
  const [typedMath, setTypedMath] = React.useState('');
  const [errorWiggle, setErrorWiggle] = React.useState(false);

  const handleKeypadPress = (val: string) => {
    playBubble();
    if (lockType === 'pin') {
      if (typedPin.length >= 4) return;
      const nextPin = typedPin + val;
      setTypedPin(nextPin);
      
      // Auto-validate if 4 digits typed
      if (nextPin.length === 4) {
        if (nextPin === parentPinCode) {
          playMarimba(523.25, 0.15);
          setTimeout(() => playMarimba(659.25, 0.25), 150);
          onSuccess();
        } else {
          playMarimba(180, 0.2);
          setTimeout(() => playMarimba(150, 0.35), 150);
          setErrorWiggle(true);
          setTimeout(() => {
            setErrorWiggle(false);
            setTypedPin('');
          }, 600);
        }
      }
    } else {
      setTypedMath(prev => prev + val);
    }
  };

  const handleBackspace = () => {
    playBubble();
    if (lockType === 'pin') {
      setTypedPin(prev => prev.slice(0, -1));
    } else {
      setTypedMath(prev => prev.slice(0, -1));
    }
  };

  const handleConfirmMath = () => {
    playBubble();
    if (parseInt(typedMath) === mathProblem.answer) {
      playMarimba(523.25, 0.15);
      setTimeout(() => playMarimba(659.25, 0.25), 150);
      onSuccess();
    } else {
      playMarimba(180, 0.2);
      setTimeout(() => playMarimba(150, 0.35), 150);
      setErrorWiggle(true);
      setTimeout(() => {
        setErrorWiggle(false);
        setTypedMath('');
        generateMathProblem();
      }, 600);
    }
  };

  return (
    <motion.div
      animate={errorWiggle ? { x: [-10, 10, -10, 10, -5, 5, 0] } : { x: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white border-2 border-slate-350 rounded-[32px] p-8 w-full max-w-sm shadow-2xl flex flex-col items-center text-center gap-6"
    >
      <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-2xl shadow-sm">
        🔐
      </div>

      <div>
        <h3 className="text-xl font-black text-slate-800">Área dos Pais</h3>
        <p className="text-xs text-slate-400 font-semibold mt-1">
          {lockType === 'pin' 
            ? 'Digite o PIN de 4 dígitos para sair' 
            : 'Resolva a conta matemática para provar que é um adulto'}
        </p>
      </div>

      {/* Inputs Display */}
      {lockType === 'pin' ? (
        <div className="flex gap-4.5 justify-center py-2">
          {[0, 1, 2, 3].map(idx => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                idx < typedPin.length
                  ? 'bg-indigo-600 border-indigo-600 scale-110 shadow-sm shadow-indigo-200'
                  : 'bg-slate-100 border-slate-350/50'
              }`}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3 items-center w-full">
          <div className="text-4xl font-black text-indigo-600 tracking-wide select-none">
            {mathProblem.question}
          </div>
          <div className="w-full bg-slate-50 border border-slate-250 rounded-2xl py-3.5 text-center text-2xl font-black text-slate-800 tracking-widest min-h-[58px]">
            {typedMath || '?'}
          </div>
        </div>
      )}

      {/* Keys Keypad */}
      <div className="grid grid-cols-3 gap-2.5 w-full">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(val => (
          <button
            key={val}
            onClick={() => handleKeypadPress(val)}
            className="w-full py-3 bg-slate-100 border-2 border-slate-300 hover:border-indigo-600 hover:bg-indigo-50 text-slate-900 font-black rounded-2xl text-lg shadow-xxs transition-all active:scale-95 cursor-pointer font-Outfit"
          >
            {val}
          </button>
        ))}
        <button
          onClick={handleBackspace}
          className="w-full py-3 bg-red-100 border-2 border-red-300 hover:bg-red-200 text-red-750 font-black rounded-2xl text-sm shadow-xxs transition-all active:scale-95 cursor-pointer"
        >
          ⌫
        </button>
        <button
          onClick={() => handleKeypadPress('0')}
          className="w-full py-3 bg-slate-100 border-2 border-slate-300 hover:border-indigo-600 hover:bg-indigo-50 text-slate-900 font-black rounded-2xl text-lg shadow-xxs transition-all active:scale-95 cursor-pointer font-Outfit"
        >
          0
        </button>
        {lockType === 'math' ? (
          <button
            onClick={handleConfirmMath}
            className="w-full py-3 bg-indigo-650 hover:bg-indigo-700 text-white font-black rounded-2xl text-sm shadow-sm hover:bg-indigo-700 transition-all active:scale-95 cursor-pointer border-2 border-indigo-850 font-Outfit"
          >
            Ok ✓
          </button>
        ) : (
          <div className="w-full" />
        )}
      </div>

      <button
        onClick={onClose}
        className="text-xs font-bold text-slate-450 hover:text-slate-650 underline cursor-pointer mt-1 bg-transparent border-none"
      >
        Voltar à Rotina 🐾
      </button>
    </motion.div>
  );
};
