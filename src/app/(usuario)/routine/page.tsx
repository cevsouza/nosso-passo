"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { firebaseBridge, Task, getOfflineQueue } from '../../../lib/firebase-bridge';
import { CollieState } from '../../../components/ludic/BorderCollie';
import { HyperfocusMascot } from '../../../components/ludic/HyperfocusMascot';
import { playBubble, playMarimba, playCelebration, playSoftAlert, speakText, startAmbientSound, stopAmbientSound } from '../../../lib/audio-synth';
import { useLanguage } from '../../../lib/LanguageContext';
import { LanguageSelector } from '../../../components/LanguageSelector';
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

const localizedGeneratorStatuses = [
  "🤖 IA TEAcolher iniciando...",
  "🦖 Analisando seu hiperfoco ativo...",
  "📚 Estruturando parágrafos de previsibilidade...",
  "🎨 Criando ilustrações lúdicas e emojis...",
  "✨ Finalizando seu livro social personalizado!"
];

const generateAiStory = (theme: string, focus: string) => {
  const cleanTheme = theme.trim() || "Ir ao Dentista";
  const cleanFocus = focus.split(' ')[0] || "Dinossauro";
  
  const steps = [
    {
      text: `Era uma vez o ${cleanFocus}, que adorava explorar o mundo! Um dia, ele soube que tinha uma missão muito especial: ${cleanTheme}. Ele ficou um pouquinho curioso, mas sabia que era um herói aventureiro!`,
      img: "🦖",
    },
    {
      text: `Para começar a missão de ${cleanTheme}, o ${cleanFocus} respirou fundo e lembrou que toda grande aventura começa com calma. Ele deu um passo corajoso de cada vez!`,
      img: "🧘",
    },
    {
      text: `Durante a missão, o ${cleanFocus} viu coisas novas e ouviu sons diferentes. Ele pensou: "Se eu sentir qualquer incômodo, eu posso pedir uma pausa ou usar meu super escudo protetor!"`,
      img: "🎧",
    },
    {
      text: `O ${cleanFocus} cooperou super bem e completou cada etapa com muita paciência. Ele sabia que fazer ${cleanTheme} ajudava seu corpinho a ficar super forte e saudável!`,
      img: "💪",
    },
    {
      text: `Uau! A missão foi um sucesso absoluto! O ${cleanFocus} agora é o explorador mais feliz do mundo e ganhou estrelas brilhantes por ser tão incrível no ${cleanTheme}!`,
      img: "🏆",
    }
  ];
  
  let focusEmoji = "🦖";
  if (focus.toLowerCase().includes("astronauta") || focus.toLowerCase().includes("espaço") || focus.toLowerCase().includes("space")) focusEmoji = "🚀";
  else if (focus.toLowerCase().includes("trem") || focus.toLowerCase().includes("train") || focus.toLowerCase().includes("locomotiva")) focusEmoji = "🚂";
  else if (focus.toLowerCase().includes("gato") || focus.toLowerCase().includes("cat")) focusEmoji = "🐱";
  else if (focus.toLowerCase().includes("carro") || focus.toLowerCase().includes("car")) focusEmoji = "🚗";
  else if (focus.toLowerCase().includes("minecraft") || focus.toLowerCase().includes("bloco")) focusEmoji = "🟩";
  else if (focus.toLowerCase().includes("herói") || focus.toLowerCase().includes("hero")) focusEmoji = "🦸‍♂️";
  else if (focus.toLowerCase().includes("tubarão") || focus.toLowerCase().includes("shark")) focusEmoji = "🦈";
  else if (focus.toLowerCase().includes("unicórnio") || focus.toLowerCase().includes("unicorn")) focusEmoji = "🦄";
  else if (focus.toLowerCase().includes("robô") || focus.toLowerCase().includes("robot")) focusEmoji = "🤖";
  else if (focus.toLowerCase().includes("border") || focus.toLowerCase().includes("collie")) focusEmoji = "🐶";
  
  steps[0].img = focusEmoji;
  steps[1].img = "🧘";
  steps[2].img = "🎧";
  steps[3].img = focusEmoji;
  steps[4].img = "🎉";
  
  return {
    id: `ai-${Date.now()}`,
    title: `Aventura do ${cleanFocus}: ${cleanTheme}`,
    desc: `História social gerada pela IA com o tema ${cleanTheme} e hiperfoco ${cleanFocus}.`,
    steps: steps
  };
};

const AAC_ITEMS = [
  { text: "Quero água 🥛", speech: "Quero água, por favor.", mood: "calmo" },
  { text: "Tenho fome 🍎", speech: "Tenho fome, por favor.", mood: "calmo" },
  { text: "Banheiro 🚽", speech: "Quero ir ao banheiro.", mood: "calmo" },
  { text: "Estou com dor 🤕", speech: "Estou com dor.", mood: "triste", alert: true },
  { text: "Estou cansado 🥱", speech: "Estou cansado.", mood: "triste" },
  { text: "Preciso de ajuda 🆘", speech: "Preciso de ajuda.", mood: "agitado", alert: true },
  { text: "Quero brincar 🧸", speech: "Quero brincar.", mood: "feliz" },
  { text: "Fone de ouvido 🎧", speech: "Quero meu fone de ouvido.", mood: "calmo" },
  { text: "Frio ❄️", speech: "Estou com frio.", mood: "calmo" },
  { text: "Abraço 🤗", speech: "Quero um abraço.", mood: "feliz" }
];

interface TimerProps {
  progress: number;
  minutesLeft: number;
}

const HourglassTimer: React.FC<TimerProps> = ({ progress, minutesLeft }) => {
  const { locale } = useLanguage();
  const sandRatio = 1 - progress; // goes from 0 (start) to 1 (end)

  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="text-[9px] font-black uppercase tracking-widest text-slate-700 select-none">
        ⏳ {locale === 'en' ? 'Playful Hourglass' : locale === 'es' ? 'Reloj de Arena Lúdico' : 'Ampulheta Lúdica'}
      </span>
      <div className="relative w-20 h-20 flex items-center justify-center bg-white rounded-full p-2 border-2 border-slate-300 shadow-xxs">
        <svg viewBox="0 0 100 120" className="w-full h-full">
          <path d="M20,10 L80,10 L80,20 Q80,55 55,60 Q80,65 80,100 L80,110 L20,110 L20,100 Q20,65 45,60 Q20,55 20,20 Z" fill="none" stroke="#64748b" strokeWidth="6" strokeLinejoin="round" />
          <clipPath id="main-top-clip">
            <rect x="0" y={15 + sandRatio * 42} width="100" height="50" />
          </clipPath>
          <path d="M25,15 L75,15 Q75,52 50,57 Q25,52 25,15 Z" fill="#eab308" opacity="0.85" clipPath="url(#main-top-clip)" />
          <clipPath id="main-bottom-clip">
            <rect x="0" y={105 - sandRatio * 42} width="100" height="50" />
          </clipPath>
          <path d="M50,63 Q75,68 75,105 L25,105 Q25,68 50,63 Z" fill="#eab308" opacity="0.95" clipPath="url(#main-bottom-clip)" />
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
  const { locale } = useLanguage();
  const fillHeight = (1 - progress) * 35;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="text-[9px] font-black uppercase tracking-widest text-slate-700 select-none">
        💧 {locale === 'en' ? 'Water Droplets' : locale === 'es' ? 'Gotas de Agua' : 'Gotas de Água'}
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
  const { locale } = useLanguage();
  const lowerTheme = (theme || "").toLowerCase();
  
  let timerName = locale === 'en' ? "Hyperfocus: Mascot 🐶" : locale === 'es' ? "Hiperenfoque: Mascota 🐶" : "Hiperfoco: Mascote 🐶";
  let content = null;

  if (lowerTheme.includes("dino")) {
    timerName = locale === 'en' ? "🥚 Dino Hatching" : locale === 'es' ? "🥚 Dino Eclosionando" : "🥚 Dino Chocando";
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
    timerName = locale === 'en' ? "🚀 Rocket Landing" : locale === 'es' ? "🚀 Cohete Aterrizando" : "🚀 Foguete Pousando";
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
    timerName = locale === 'en' ? "🚂 Train on Track" : locale === 'es' ? "🚂 Tren en la Vía" : "🚂 Trem na Trilha";
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
    timerName = locale === 'en' ? "🧱 Minecraft Blocks" : locale === 'es' ? "🧱 Bloques Minecraft" : "🧱 Blocos Minecraft";
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
    timerName = locale === 'en' ? "🐶 Mascot Walking" : locale === 'es' ? "🐶 Mascota Caminando" : "🐶 Mascote Caminhando";
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
  const { t, locale } = useLanguage();
  const localizedBadges = [
    { id: 'hygiene', label: t.routine.badgeHygieneTitle, desc: t.routine.badgeHygieneDesc, icon: '🏆' },
    { id: 'nutrition', label: t.routine.badgeNutritionTitle, desc: t.routine.badgeNutritionDesc, icon: '🏅' },
    { id: 'study', label: t.routine.badgeStudyTitle, desc: t.routine.badgeStudyDesc, icon: '🎓' }
  ];

  const localizedSocialStories = [
    {
      id: 'haircut',
      title: t.routine.storyHaircutTitle,
      desc: t.routine.storyHaircutDesc,
      steps: [
        { text: t.routine.storyHaircutStep1, img: '💇' },
        { text: t.routine.storyHaircutStep2, img: '💺' },
        { text: t.routine.storyHaircutStep3, img: '🎧' },
        { text: t.routine.storyHaircutStep4, img: '✨' },
      ]
    },
    {
      id: 'doctor',
      title: t.routine.storyDoctorTitle,
      desc: t.routine.storyDoctorDesc,
      steps: [
        { text: t.routine.storyDoctorStep1, img: '🦸' },
        { text: t.routine.storyDoctorStep2, img: '💓' },
        { text: t.routine.storyDoctorStep3, img: '🎂' },
        { text: t.routine.storyDoctorStep4, img: '⭐' },
      ]
    },
    {
      id: 'vaccine',
      title: t.routine.storyVaccineTitle,
      desc: t.routine.storyVaccineDesc,
      steps: [
        { text: t.routine.storyVaccineStep1, img: '🛡️' },
        { text: t.routine.storyVaccineStep2, img: '❄️' },
        { text: t.routine.storyVaccineStep3, img: '🐜' },
        { text: t.routine.storyVaccineStep4, img: '🏅' },
      ]
    },
    {
      id: 'making_friends',
      title: t.routine.storyFriendsTitle,
      desc: t.routine.storyFriendsDesc,
      steps: [
        { text: t.routine.storyFriendsStep1, img: '🏫' },
        { text: t.routine.storyFriendsStep2, img: '👋' },
        { text: t.routine.storyFriendsStep3, img: '🧩' },
        { text: t.routine.storyFriendsStep4, img: '❤️' },
      ]
    },
    {
      id: 'sharing_toys',
      title: t.routine.storySharingTitle,
      desc: t.routine.storySharingDesc,
      steps: [
        { text: t.routine.storySharingStep1, img: '🚗' },
        { text: t.routine.storySharingStep2, img: '⏳' },
        { text: t.routine.storySharingStep3, img: '🙌' },
        { text: t.routine.storySharingStep4, img: '🧸' },
      ]
    },
    {
      id: 'dealing_with_frustration',
      title: t.routine.storyFrustrationTitle,
      desc: t.routine.storyFrustrationDesc,
      steps: [
        { text: t.routine.storyFrustrationStep1, img: '🌧️' },
        { text: t.routine.storyFrustrationStep2, img: '🧘' },
        { text: t.routine.storyFrustrationStep3, img: '🎨' },
        { text: t.routine.storyFrustrationStep4, img: '☀️' },
      ]
    }
  ];

  const localizedBedtimeStories = [
    {
      id: 'sleepy-dino',
      title: t.routine.storySleepyDinoTitle,
      desc: t.routine.storySleepyDinoDesc,
      steps: [
        { text: t.routine.storySleepyDinoStep1, img: '🦕' },
        { text: t.routine.storySleepyDinoStep2, img: '🍃' },
        { text: t.routine.storySleepyDinoStep3, img: '✨' },
        { text: t.routine.storySleepyDinoStep4, img: '🌙' },
      ]
    },
    {
      id: 'space-journey',
      title: t.routine.storySpaceJourneyTitle,
      desc: t.routine.storySpaceJourneyDesc,
      steps: [
        { text: t.routine.storySpaceJourneyStep1, img: '🚀' },
        { text: t.routine.storySpaceJourneyStep2, img: '⭐' },
        { text: t.routine.storySpaceJourneyStep3, img: '🌌' },
        { text: t.routine.storySpaceJourneyStep4, img: '💤' },
      ]
    }
  ];

  const localizedGeneratorStatuses = [
    locale === 'es' ? "🤖 IA Rutina Animada iniciando..." : locale === 'en' ? "🤖 IA Animated Routine starting..." : "🤖 IA TEAcolher iniciando...",
    locale === 'es' ? "🦖 Analizando tu hiperfoco activo..." : locale === 'en' ? "🦖 Analyzing your active hyperfocus..." : "🦖 Analizando seu hiperfoco ativo...",
    locale === 'es' ? "📚 Estructurando párrafos de previsibilidad..." : locale === 'en' ? "📚 Structuring predictability paragraphs..." : "📚 Estruturando parágrafos de previsibilidade...",
    locale === 'es' ? "🎨 Creando ilustraciones divertidas y emojis..." : locale === 'en' ? "🎨 Creating fun illustrations and emojis..." : "🎨 Criando ilustrações lúdicas e emojis...",
    locale === 'es' ? "✨ ¡Finalizando tu libro social personalizado!" : locale === 'en' ? "✨ Finalizing your personalized social book!" : "✨ Finalizando seu livro social personalizado!"
  ];

  const [tasks, setTasks] = useState<Task[]>([]);
  const [offline, setOffline] = useState(false);
  const [offlineQueueSize, setOfflineQueueSize] = useState(0);
  const [currentDay, setCurrentDay] = useState(() => new Date().getDate().toString());
  const [currentMonth, setCurrentMonth] = useState(() => (new Date().getMonth() + 1).toString());
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear().toString());
  const [collieState, setCollieState] = useState<CollieState>('idle');
  const [celebratingTaskId, setCelebratingTaskId] = useState<string | null>(null);
  const [childHyperfocus, setChildHyperfocus] = useState('Border Collies 🐕');
  
  // Wait Timer states
  const [waitTimerDuration, setWaitTimerDuration] = useState(300); // default 5m
  const [waitTimerTimeLeft, setWaitTimerTimeLeft] = useState(300);
  const [isWaitTimerActive, setIsWaitTimerActive] = useState(false);
  const [waitTimerFinished, setWaitTimerFinished] = useState(false);
  const [showBatteryMenu, setShowBatteryMenu] = useState(false);
  const [showWaitTimer, setShowWaitTimer] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => new Date());

  // Keep currentTime updated every second to drive real-time clocks/locks
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // Update currentDay, currentMonth, currentYear when the date changes
  useEffect(() => {
    const today = new Date();
    const todayDay = today.getDate().toString();
    const todayMonth = (today.getMonth() + 1).toString();
    const todayYear = today.getFullYear().toString();
    
    if (todayDay !== currentDay) setCurrentDay(todayDay);
    if (todayMonth !== currentMonth) setCurrentMonth(todayMonth);
    if (todayYear !== currentYear) setCurrentYear(todayYear);
  }, [currentTime, currentDay, currentMonth, currentYear]);

  const [sensoryVisuals, setSensoryVisuals] = useState<'rich' | 'minimal'>('rich');
  const [localCalmMode, setLocalCalmMode] = useState(false);
  const effectiveVisuals = localCalmMode ? 'minimal' : sensoryVisuals;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('localCalmMode');
      if (stored === 'true') {
        setLocalCalmMode(true);
      }
    }
  }, []);

  // Wait Timer countdown logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isWaitTimerActive && waitTimerTimeLeft > 0) {
      interval = setInterval(() => {
        setWaitTimerTimeLeft(prev => {
          if (prev <= 1) {
            setIsWaitTimerActive(false);
            setWaitTimerFinished(true);
            try {
              playSoftAlert();
            } catch (err) {
              console.error('Erro ao tocar som:', err);
            }
            const msg = t.routine.waitTimerFinished || 'O tempo de espera terminou! Muito bem por esperar!';
            speakText(msg);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isWaitTimerActive, waitTimerTimeLeft, t.routine.waitTimerFinished]);

  // Child Multi-profile states
  const [children, setChildren] = useState<any[]>([]);
  const [activeChild, setActiveChild] = useState<any | null>(null);
  const [loadingChildren, setLoadingChildren] = useState(true);

  // Monitor offline status
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOffline(!navigator.onLine);
      setOfflineQueueSize(getOfflineQueue().length);
      
      const handleOfflineStatus = (e: any) => {
        setOffline(e.detail.isOffline);
        setOfflineQueueSize(e.detail.queueLength || 0);
      };
      
      window.addEventListener('app-offline-status-changed', handleOfflineStatus);
      return () => {
        window.removeEventListener('app-offline-status-changed', handleOfflineStatus);
      };
    }
  }, []);
  
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
  const effectiveProfile = localCalmMode ? 'hypersensitive' : sensoryProfile;
  const [timerStyle, setTimerStyle] = useState<'circle' | 'hourglass' | 'droplets' | 'hyperfocus'>('circle');

  // Interface complexity level (per-child). Controls how many features the child sees.
  // 'foco' = essentials only | 'intermediario' = + supports | 'completo' = everything (legacy default)
  const [interfaceMode, setInterfaceMode] = useState<'foco' | 'intermediario' | 'completo'>('completo');
  const uiFoco = interfaceMode === 'foco';
  const uiCompleto = interfaceMode === 'completo';
  const showStories = interfaceMode !== 'foco';       // histórias sociais (preset)
  const showAiStories = interfaceMode === 'completo';  // geração por IA
  const showHourglass = interfaceMode !== 'foco';      // ampulheta de espera
  const showSleepMode = interfaceMode !== 'foco';      // modo sono
  const showAmbient = interfaceMode !== 'foco';        // sons ambiente
  const showSimulator = interfaceMode !== 'foco';      // simulador de eventos
  const showRewardSpend = interfaceMode !== 'foco';    // recompensa (gastar estrelas)
  const showTokensHeader = interfaceMode !== 'foco';   // contador de estrelas no topo
  const showShop = interfaceMode === 'completo';       // loja do mascote
  const showMyWorld = interfaceMode === 'completo';    // meu mundo / coletar peças
  const showNoiseMonitor = interfaceMode === 'completo'; // monitor de ruído
  // Menu "Apoios & Jogos" só aparece se houver ao menos um item nele
  const hasSupportMenu = showStories || showHourglass || showSimulator || showMyWorld || showShop || showNoiseMonitor;
  // Sempre visíveis em todos os níveis: humor, SOS/calma, Minha Voz (AAC)

  const [showStoriesModal, setShowStoriesModal] = useState(false);
  const [selectedStory, setSelectedStory] = useState<any | null>(null);
  const [currentStoryStep, setCurrentStoryStep] = useState(0);
  const [showHyperfocusModal, setShowHyperfocusModal] = useState(false);
  const [isToyLaunched, setIsToyLaunched] = useState(false);

  // Environmental states for sensory logs
  const [decibels, setDecibels] = useState<number>(45);
  const [lightLevel, setLightLevel] = useState<'Baixa' | 'Média' | 'Alta'>('Média');
  const [location, setLocation] = useState<string>('Casa');
  const [activeTrigger, setActiveTrigger] = useState<string>('Nenhum');
  const [isMeasuringNoise, setIsMeasuringNoise] = useState(false);

  // Sleep Mode states
  const [sleepMode, setSleepMode] = useState(false);

  // Strategic roadmap states
  const [isSosActive, setIsSosActive] = useState(false);
  const [breathStep, setBreathStep] = useState<'inspire' | 'segure' | 'expire'>('inspire');
  const [exitHoldProgress, setExitHoldProgress] = useState(0);
  const [transitionMinutesWarned, setTransitionMinutesWarned] = useState<string[]>([]);
  const [expiredTasksWarned, setExpiredTasksWarned] = useState<string[]>([]);
  const prevMinutesLeft = React.useRef<number | undefined>(undefined);
  const exitTimeout = React.useRef<any>(null);
  const exitInterval = React.useRef<any>(null);

  // AI Social Stories States
  const [storiesTab, setStoriesTab] = useState<'preset' | 'ai'>('preset');
  const [aiTheme, setAiTheme] = useState('');
  const [generatingAi, setGeneratingAi] = useState(false);
  const [aiStatusIdx, setAiStatusIdx] = useState(0);

  // AAC Modal States
  const [showAacModal, setShowAacModal] = useState(false);

  // Routine Simulator States
  const [showSimulatorModal, setShowSimulatorModal] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<'dentist' | 'school' | null>(null);
  const [simulatorStep, setSimulatorStep] = useState(0);
  const [simulatorFinished, setSimulatorFinished] = useState(false);

  // State for consolidated supports dropdown
  const [showSupportMenu, setShowSupportMenu] = useState(false);
  const [showAmbientMenu, setShowAmbientMenu] = useState(false);

  // Mascot Shop and Continuous Sensory Monitor states
  const [showShopModal, setShowShopModal] = useState(false);
  const [bgNoiseMonitor, setBgNoiseMonitor] = useState(false);
  const [showSensoryAlert, setShowSensoryAlert] = useState(false);
  const [sensoryAlertDb, setSensoryAlertDb] = useState(0);
  const [equippedAccessories, setEquippedAccessories] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tea_equipped_accessories');
      if (saved) {
        try {
          setEquippedAccessories(JSON.parse(saved));
        } catch (e) {}
      }
    }
  }, []);

  // 1.2 Background decibel monitor logic
  useEffect(() => {
    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let stream: MediaStream | null = null;
    let animationFrameId: number;
    let consecutiveLoudCounts = 0;

    if (bgNoiseMonitor) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((s) => {
          stream = s;
          audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const source = audioContext.createMediaStreamSource(s);
          analyser = audioContext.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);
          
          const bufferLength = analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);

          const checkVolume = () => {
            if (!analyser) return;
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
              sum += dataArray[i];
            }
            const average = sum / bufferLength;
            const dbVal = Math.round(30 + (average / 255) * 70);
            
            if (dbVal > 70) {
              consecutiveLoudCounts++;
              if (consecutiveLoudCounts >= 15) { // ~3 seconds at 5fps
                setSensoryAlertDb(dbVal);
                setShowSensoryAlert(true);
                consecutiveLoudCounts = 0;
              }
            } else {
              consecutiveLoudCounts = Math.max(0, consecutiveLoudCounts - 1);
            }

            animationFrameId = requestAnimationFrame(checkVolume);
          };

          checkVolume();
        })
        .catch((err) => {
          console.warn("Permissão de microfone negada ou indisponível para monitor de ruídos:", err);
          setBgNoiseMonitor(false);
        });
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (audioContext) audioContext.close();
      if (stream) stream.getTracks().forEach((track) => track.stop());
    };
  }, [bgNoiseMonitor]);

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
    if (effectiveVisuals === 'minimal') return; // Skip star explosions to avoid sensory overload
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
  
  // 1. Load children list and setup active child configuration
  useEffect(() => {
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
          setInterfaceMode((active.interfaceMode || 'completo') as any);
        }
      } catch (err) {
        console.error('Erro no portal infantil:', err);
      } finally {
        setLoadingChildren(false);
      }
    };

    loadPortal();
  }, []);

  // 1.3 Subscribe to tasks in real time specifically for the current calendar month and year
  useEffect(() => {
    const m = parseInt(currentMonth, 10);
    const y = parseInt(currentYear, 10);
    if (isNaN(m) || isNaN(y)) return;

    const unsubscribeTasks = firebaseBridge.db.onSnapshotTasks((fetchedTasks) => {
      setTasks(fetchedTasks);
    }, m, y);

    return () => unsubscribeTasks();
  }, [currentMonth, currentYear]);

  // Poll child settings in background to catch real-time parent changes (First-Then toggle / Unexpected changes)
  useEffect(() => {
    if (!activeChild?.id) return;
    const interval = setInterval(async () => {
      try {
        const fetchedChildren = await firebaseBridge.auth.getChildren();
        const active = fetchedChildren.find(c => c.id === activeChild.id);
        if (active) {
          // Compare settings to avoid unnecessary state triggers
          if (
            active.emergencyFirstThen !== activeChild.emergencyFirstThen ||
            active.unexpectedChange !== activeChild.unexpectedChange ||
            active.childHyperfocus !== activeChild.childHyperfocus ||
            active.lockType !== activeChild.lockType ||
            active.timerStyle !== activeChild.timerStyle ||
            active.sensoryVisuals !== activeChild.sensoryVisuals ||
            active.sensoryProfile !== activeChild.sensoryProfile ||
            active.interfaceMode !== activeChild.interfaceMode
          ) {
            setActiveChild(active);
            firebaseBridge.auth.setActiveChild(active);
            if (active.childHyperfocus) setChildHyperfocus(active.childHyperfocus);
            setLockType((active.lockType || 'math') as any);
            setParentPinCode(active.parentPinCode || '1234');
            setSensoryVisuals((active.sensoryVisuals || 'rich') as any);
            setSensoryProfile((active.sensoryProfile || 'balanced') as any);
            setTimerStyle((active.timerStyle || 'circle') as any);
            setInterfaceMode((active.interfaceMode || 'completo') as any);
          }
        }
      } catch (err) {
        console.error('Erro ao buscar atualizações do paciente:', err);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [activeChild?.id, activeChild]);

  // Automatic Daily Reset on new day detection
  useEffect(() => {
    if (!activeChild?.id) return;
    
    const checkAndResetDailyCompletions = async () => {
      try {
        const todayStr = new Date().toLocaleDateString('pt-BR');
        const storageKey = `tea_last_opened_date_${activeChild.id}`;
        const lastOpenedDate = localStorage.getItem(storageKey);
        
        if (lastOpenedDate !== todayStr) {
          console.log(`[AutoReset] Novo dia detectado! Antigo: ${lastOpenedDate}, Novo: ${todayStr}. Resetando conclusões.`);
          await firebaseBridge.db.resetCompletions();
          localStorage.setItem(storageKey, todayStr);
        }
      } catch (err) {
        console.error('Erro ao verificar ou resetar tarefas diárias:', err);
      }
    };
    
    checkAndResetDailyCompletions();
  }, [activeChild?.id]);

  // Speak unexpected change on load
  useEffect(() => {
    if (activeChild?.unexpectedChange) {
      try {
        const parsed = JSON.parse(activeChild.unexpectedChange);
        if (parsed && parsed.cancelledTaskTitle) {
          const speakTimer = setTimeout(() => {
            const speechText =
              locale === 'es'
                ? `¡Hola! Tuvimos un cambio de planes hoy. La actividad ${parsed.cancelledTaskTitle} fue cancelada porque ${parsed.reason}. ¡Pero no te preocupes! En su lugar, vamos a ${parsed.replacement}. ¿Está bien?`
                : locale === 'en'
                ? `Hi! We had a change of plans today. The activity ${parsed.cancelledTaskTitle} was cancelled because ${parsed.reason}. But don't worry! Instead, we are going to ${parsed.replacement}. Okay?`
                : `Oi! Tivemos uma mudança de planos hoje. A atividade ${parsed.cancelledTaskTitle} foi cancelada porque ${parsed.reason}. Mas não se preocupe! Em vez disso, nós vamos ${parsed.replacement}. Tudo bem?`;
            speakText(speechText);
          }, 1200);
          return () => clearTimeout(speakTimer);
        }
      } catch (e) {}
    }
  }, [activeChild?.unexpectedChange, locale]);

  const handleAcknowledgeUnexpectedChange = async () => {
    if (!activeChild) return;
    playBubble();
    try {
      const updated = await firebaseBridge.auth.updateChildSettings(activeChild.id, {
        unexpectedChange: null
      });
      setActiveChild(updated);
      firebaseBridge.auth.setActiveChild(updated);
      speakText(t.routine.ttsUnexpected);
    } catch (err) {
      console.error(err);
    }
  };

  // Filter tasks for the current day, sorted by time/order
  const todayTasks = tasks
    .filter(t => {
      const tm = t.month !== undefined && t.month !== null ? t.month : new Date().getMonth() + 1;
      const ty = t.year !== undefined && t.year !== null ? t.year : new Date().getFullYear();
      return (
        t.day === currentDay &&
        tm === parseInt(currentMonth, 10) &&
        ty === parseInt(currentYear, 10)
      );
    })
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
        speakText(`${t.routine.missionNow}${activeTask.title}`);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [activeTask?.id, celebratingTaskId]);

  // 3. Automatically speak when all tasks of the day are finished
  useEffect(() => {
    if (isDayFinished) {
      const timer = setTimeout(() => {
        speakText(t.routine.routineCompleted);
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

  // Transições Preditivas Graduais (10, 5 e 2 minutos antes)
  useEffect(() => {
    if (!activeTask || timerMinutesLeft === undefined || nextTasks.length === 0) return;
    
    const currentMinute = timerMinutesLeft;
    const targetMinutes = [10, 5, 2];
    
    if (targetMinutes.includes(currentMinute)) {
      const warnKey = `${activeTask.id}-${currentMinute}`;
      if (!transitionMinutesWarned.includes(warnKey)) {
        setTransitionMinutesWarned(prev => [...prev, warnKey]);
        const nextTaskName = nextTasks[0].title;
        const customAudio = currentMinute === 10
          ? activeChild?.audioAlert10
          : currentMinute === 5
          ? activeChild?.audioAlert5
          : currentMinute === 2
          ? activeChild?.audioAlert2
          : null;

        if (customAudio) {
          try {
            const audio = new Audio(customAudio);
            audio.play().catch(() => {
              speakText(t.routine.ttsTransition.replace('{minutes}', String(currentMinute)).replace('{active}', activeTask.title).replace('{next}', nextTaskName));
            });
          } catch (e) {
            speakText(t.routine.ttsTransition.replace('{minutes}', String(currentMinute)).replace('{active}', activeTask.title).replace('{next}', nextTaskName));
          }
        } else {
          speakText(t.routine.ttsTransition.replace('{minutes}', String(currentMinute)).replace('{active}', activeTask.title).replace('{next}', nextTaskName));
        }
        

        
        if (typeof window !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([100, 200, 100]); // Pulse feedback
        }
        playMarimba(349.23, 0.3);
      }
    }
  }, [timerMinutesLeft, activeTask?.id, nextTasks, transitionMinutesWarned]);

  // Keep track of the previous timerMinutesLeft to detect transitions
  useEffect(() => {
    prevMinutesLeft.current = timerMinutesLeft;
  }, [timerMinutesLeft]);

  // Reset the previous value when the active task changes
  useEffect(() => {
    prevMinutesLeft.current = undefined;
  }, [activeTask?.id]);

  // Alerta sonoro suave quando o prazo da atividade expira
  useEffect(() => {
    if (!activeTask || timerMinutesLeft === undefined) return;
    
    if (timerMinutesLeft === 0) {
      const warnKey = `${activeTask.id}-expired`;
      if (!expiredTasksWarned.includes(warnKey)) {
        setExpiredTasksWarned(prev => [...prev, warnKey]);
        
        // Só toca o som se foi uma transição de um valor positivo para zero
        // (previne tocar imediatamente ao abrir uma tarefa que já está atrasada)
        const wasPositive = prevMinutesLeft.current !== undefined && prevMinutesLeft.current > 0;
        if (wasPositive) {
          playSoftAlert();
          speakText(t.routine.taskExpired.replace('{title}', activeTask.title));
        }
      }
    }
  }, [timerMinutesLeft, activeTask?.id, expiredTasksWarned, t]);

  // SOS Sensorial effects (Audio loop & Haptic vibration)
  useEffect(() => {
    let hapticInterval: any = null;
    let breathInterval: any = null;
    let timers: any[] = [];

    if (isSosActive) {
      startAmbientSound('binaural');

      const triggerVibration = () => {
        if (typeof window !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([100, 200, 100, 1500]);
        }
      };
      triggerVibration();
      hapticInterval = setInterval(triggerVibration, 3000);

      const runBreathCycle = () => {
        setBreathStep('inspire');
        const t1 = setTimeout(() => setBreathStep('segure'), 2500);
        const t2 = setTimeout(() => setBreathStep('expire'), 3500);
        timers = [t1, t2];
      };
      runBreathCycle();
      breathInterval = setInterval(runBreathCycle, 6000);
    } else {
      stopAmbientSound();
      if (typeof window !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(0);
      }
    }

    return () => {
      if (hapticInterval) clearInterval(hapticInterval);
      if (breathInterval) clearInterval(breathInterval);
      timers.forEach(clearTimeout);
    };
  }, [isSosActive]);

  const handleTriggerSos = async () => {
    playBubble();
    setIsSosActive(true);
    if (activeChild) {
      try {
        await firebaseBridge.db.addSensoryLog({
          childId: activeChild.id,
          mood: 'agitado',
          crisisOccurred: true,
          notes: locale === 'en' ? 'Sensory SOS activated by the child in the app.' : locale === 'es' ? 'SOS Sensorial activado por el niño en la aplicación.' : 'SOS Sensorial ativado pela criança no aplicativo.',
          loggedBy: 'child',
          location: 'Casa',
          trigger: 'Sobrecarga Sensorial'
        });
      } catch (e) {
        console.error('Failed to log SOS crisis event:', e);
      }
    }
  };

  const handleUpdateBattery = async (level: 'green' | 'yellow' | 'red') => {
    if (!activeChild) return;
    playBubble();
    const updatedChild = { ...activeChild, emotionalBattery: level };
    setActiveChild(updatedChild);
    firebaseBridge.auth.setActiveChild(updatedChild);
    
    try {
      await firebaseBridge.auth.updateChildSettings(activeChild.id, {
        emotionalBattery: level
      });
      
      const moodMap = { green: 'feliz', yellow: 'calmo', red: 'triste' };
      const noteMap = {
        green: locale === 'en' ? 'Child indicated Emotional Battery: Full/Great 🔋' : locale === 'es' ? 'El niño indicó Batería Emocional: Llena/Excelente 🔋' : 'Criança indicou Bateria Emocional: Cheia/Ótimo 🔋',
        yellow: locale === 'en' ? 'Child indicated Emotional Battery: Medium/Tired ⚡' : locale === 'es' ? 'El niño indicó Batería Emocional: Media/Cansado ⚡' : 'Criança indicou Bateria Emocional: Média/Cansado ⚡',
        red: locale === 'en' ? 'Child indicated Emotional Battery: Low/Overloaded 🪫' : locale === 'es' ? 'El niño indicó Batería Emocional: Baja/Sobrecargado 🪫' : 'Criança indicou Bateria Emocional: Baixa/Sobrecarregado 🪫'
      };

      await firebaseBridge.db.addSensoryLog({
        childId: activeChild.id,
        mood: moodMap[level] as any,
        crisisOccurred: level === 'red',
        notes: noteMap[level],
        loggedBy: 'child',
        location: 'Casa'
      });

      if (level === 'red') {
        speakText("Bateria baixa! Que tal usar o SOS Sensorial para respirar e se acalmar?");
      } else if (level === 'yellow') {
        speakText(t.routine.batteryMedium);
      } else {
        speakText(t.routine.batteryHigh);
      }
    } catch (e) {
      console.error('Failed to update emotional battery:', e);
    }
  };

  const handleExitStart = () => {
    setExitHoldProgress(0);
    exitTimeout.current = setTimeout(() => {
      setIsSosActive(false);
      setExitHoldProgress(0);
      if (exitInterval.current) clearInterval(exitInterval.current);
    }, 2000);

    exitInterval.current = setInterval(() => {
      setExitHoldProgress(p => {
        if (p >= 100) {
          if (exitInterval.current) clearInterval(exitInterval.current);
          return 100;
        }
        return p + 5;
      });
    }, 100);
  };

  const handleExitEnd = () => {
    if (exitTimeout.current) clearTimeout(exitTimeout.current);
    if (exitInterval.current) clearInterval(exitInterval.current);
    setExitHoldProgress(0);
  };

  const handleAacClick = async (item: typeof AAC_ITEMS[0]) => {
    speakText(item.speech);
    
    if (!activeChild) return;
    try {
      const newLog = await firebaseBridge.db.addSensoryLog({
        childId: activeChild.id,
        mood: item.mood as any,
        notes: locale === 'en' ? `AAC Communication: "${item.text}"` : locale === 'es' ? `Comunicación AAC: "${item.text}"` : `Comunicação AAC: "${item.text}"`,
        loggedBy: 'child',
        crisisOccurred: item.alert || false,
      });
    } catch (err) {
      console.error("Error logging AAC usage", err);
    }
  };

  const handleCompleteSimulator = async () => {
    if (!activeChild) return;
    try {
      const updated = await firebaseBridge.auth.addTokens(activeChild.id, 3);
      setActiveChild(updated);
      firebaseBridge.auth.setActiveChild(updated);
      setChildren(prev => prev.map(c => c.id === updated.id ? updated : c));
      
      await firebaseBridge.db.addSensoryLog({
        childId: activeChild.id,
        mood: 'feliz',
        notes: `Completou o simulador de rotina: "${selectedScenario === 'dentist' ? 'Ir ao Dentista' : 'Primeiro Dia de Aula'}"`,
        loggedBy: 'child',
        crisisOccurred: false
      });
      speakText(t.routine.simCongrats);
    } catch (err) {
      console.error("Error adding simulator reward tokens", err);
    }
    setSimulatorFinished(true);
  };

  const handleGenerateAiStory = () => {
    if (!aiTheme.trim()) return;
    setGeneratingAi(true);
    setAiStatusIdx(0);
    
    playMarimba(261.63, 0.1);
    
    let currentIdx = 0;
    const interval = setInterval(() => {
      currentIdx++;
      if (currentIdx < localizedGeneratorStatuses.length) {
        setAiStatusIdx(currentIdx);
        playMarimba(261.63 + currentIdx * 50, 0.1);
      } else {
        clearInterval(interval);
        const generated = generateAiStory(aiTheme, childHyperfocus);
        setSelectedStory(generated);
        setCurrentStoryStep(0);
        setGeneratingAi(false);
        setAiTheme('');
        speakText(generated.steps[0].text);
      }
    }, 700);
  };

  // Handle task completion click
  const handleCompleteTask = async (task: Task) => {
    if (celebratingTaskId) return; // Prevent double trigger

    setCelebratingTaskId(task.id);
    setCollieState('celebrating');

    // Trigger gentle haptic vibration pulse (Autism-safe haptic standard)
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([80, 50, 80]);
    }
    
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

          if (showRewardSpend && updatedChild.tokens !== undefined && updatedChild.rewardCost !== undefined && updatedChild.tokens >= updatedChild.rewardCost) {
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
        notes: locale === 'en' ? 'Mood registered by the user in the routine.' : locale === 'es' ? 'Humor registrado por el propio usuario en la rutina.' : 'Humor registrado pelo próprio usuário na rotina.',
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
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(40);
    }

    if (isDayFinished) {
      playMarimba(261.63, 0.4);
      speakText(t.routine.routineCompleted);
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

  const getHyperfocusParts = (theme: string) => {
    const focus = (theme || "").toLowerCase();
    if (focus.includes("dino") || focus.includes("dinossauro") || focus.includes("dinosaur")) {
      return [
        { id: 'dino_skull', name: locale === 'en' ? 'T-Rex Skull 🦖' : locale === 'es' ? 'Cráneo de T-Rex 🦖' : 'Crânio de T-Rex 🦖', cost: 3, icon: '💀' },
        { id: 'dino_ribs', name: locale === 'en' ? 'T-Rex Ribs 🦴' : locale === 'es' ? 'Costillas de T-Rex 🦴' : 'Costelas de T-Rex 🦴', cost: 3, icon: '🩻' },
        { id: 'dino_legs', name: locale === 'en' ? 'T-Rex Legs 🐾' : locale === 'es' ? 'Patas de T-Rex 🐾' : 'Pernas de T-Rex 🐾', cost: 3, icon: '🦵' },
        { id: 'dino_tail', name: locale === 'en' ? 'T-Rex Tail 🐊' : locale === 'es' ? 'Cola de T-Rex 🐊' : 'Cauda de T-Rex 🐊', cost: 3, icon: '🦕' },
      ];
    }
    if (focus.includes("espaço") || focus.includes("astronauta") || focus.includes("space") || focus.includes("foguete") || focus.includes("rocket")) {
      return [
        { id: 'space_capsule', name: locale === 'en' ? 'Space Capsule 🚀' : locale === 'es' ? 'Cápsula Espacial 🚀' : 'Cápsula Espacial 🚀', cost: 3, icon: '🚀' },
        { id: 'space_thrusters', name: locale === 'en' ? 'Thrusters 🔥' : locale === 'es' ? 'Propulsores 🔥' : 'Propulsores 💥', cost: 3, icon: '🔥' },
        { id: 'space_panels', name: locale === 'en' ? 'Solar Panels ☀️' : locale === 'es' ? 'Paneles Solares ☀️' : 'Painéis Solares ☀️', cost: 3, icon: '🔋' },
        { id: 'space_flag', name: locale === 'en' ? 'Moon Flag 🏳️' : locale === 'es' ? 'Bandera de la Luna 🏳️' : 'Bandeira da Lua 🏳️', cost: 3, icon: '🏳️' },
      ];
    }
    if (focus.includes("trem") || focus.includes("train") || focus.includes("trilhos")) {
      return [
        { id: 'train_engine', name: locale === 'en' ? 'Main Locomotive 🚂' : locale === 'es' ? 'Locomotora Principal 🚂' : 'Locomotiva Principal 🚂', cost: 3, icon: '🚂' },
        { id: 'train_passenger', name: locale === 'en' ? 'Passenger Car 🚃' : locale === 'es' ? 'Vagón de Pasajeros 🚃' : 'Vagão de Passageiros 🚃', cost: 3, icon: '🚃' },
        { id: 'train_cargo', name: locale === 'en' ? 'Cargo Car 📦' : locale === 'es' ? 'Vagón de Carga 📦' : 'Vagão de Carga 📦', cost: 3, icon: '📦' },
        { id: 'train_tracks', name: locale === 'en' ? 'Iron Tracks 🛤️' : locale === 'es' ? 'Vías de Hierro 🛤️' : 'Trilhos de Ferro 🛤️', cost: 3, icon: '🛤️' },
      ];
    }
    return [
      { id: 'acc_hat', name: locale === 'en' ? 'Elegant Hat 🎩' : locale === 'es' ? 'Sombrero Elegante 🎩' : 'Chapéu Elegante 🎩', cost: 3, icon: '🎩' },
      { id: 'acc_glasses', name: locale === 'en' ? 'Sunglasses 😎' : locale === 'es' ? 'Gafas de Sol 😎' : 'Óculos de Sol 😎', cost: 3, icon: '😎' },
      { id: 'acc_medal', name: locale === 'en' ? 'Gold Medal 🥇' : locale === 'es' ? 'Medalla de Oro 🥇' : 'Medalha de Ouro 🥇', cost: 3, icon: '🥇' },
      { id: 'acc_cape', name: locale === 'en' ? 'Hero Cape 🦸‍♂️' : locale === 'es' ? 'Capa de Superhéroe 🦸‍♂️' : 'Capa de Super-herói 🦸‍♂️', cost: 3, icon: '🦸‍♂️' },
    ];
  };

  const handleBuyPart = async (partId: string, cost: number) => {
    if (!activeChild) return;
    const currentTokens = activeChild.tokens || 0;
    if (currentTokens < cost) {
      speakText(t.routine.toyBuyMoreStars);
      return;
    }

    let inventory: string[] = [];
    try {
      if (activeChild.toyInventory) {
        inventory = JSON.parse(activeChild.toyInventory);
      }
    } catch (e) {}

    if (inventory.includes(partId)) {
      speakText(t.routine.toyAlreadyHavePart);
      return;
    }

    const newInventory = [...inventory, partId];
    const newTokens = currentTokens - cost;
    const newCollectedParts = (activeChild.collectedParts || 0) + 1;

    playCelebration();
    speakText(t.routine.toyCongratsNewPart);

    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([100, 50, 100, 50, 150]);
    }

    try {
      const updated = await firebaseBridge.auth.updateChildSettings(activeChild.id, {
        tokens: newTokens,
        collectedParts: newCollectedParts,
        toyInventory: JSON.stringify(newInventory)
      });
      setActiveChild(updated);
      setChildren(prev => prev.map(c => c.id === updated.id ? updated : c));
    } catch (err) {
      console.error(err);
    }
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

  // INTERCEPT UNEXPECTED CHANGE
  if (activeChild && activeChild.unexpectedChange) {
    let unexObj: any = null;
    try {
      unexObj = JSON.parse(activeChild.unexpectedChange);
    } catch (e) {}

    if (unexObj && unexObj.cancelledTaskTitle) {
      return (
        <main className="min-h-screen bg-gradient-to-tr from-[#fef3c7] via-[#fffbeb] to-[#fef3c7] flex flex-col items-center justify-center p-6 text-slate-900 relative overflow-hidden font-Outfit select-none">
          {/* Empathetic unexpected change card */}
          <div className="w-full max-w-lg bg-white border-4 border-amber-400 rounded-[36px] p-8 shadow-2xl z-10 flex flex-col gap-6 text-center">
            <div>
              <span className="text-6xl animate-bounce inline-block">⚠️</span>
              <h1 className="text-3xl font-black text-amber-955 tracking-tight mt-3 font-Outfit">
                {locale === 'en' ? 'Change of Plans!' : locale === 'es' ? '¡Cambio de Planes!' : 'Mudança de Planos!'}
              </h1>
              <p className="text-xs text-slate-400 font-extrabold uppercase tracking-wider mt-1">
                {locale === 'en' ? 'We had a schedule change today' : locale === 'es' ? 'Tuvimos un cambio en la rutina hoy' : 'Tivemos uma alteração na rotina hoje'}
              </p>
            </div>

            {/* De -> Para visual explanation */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 py-4 border-y border-slate-100 my-2">
              <div className="flex flex-col items-center p-4 bg-red-50 border-2 border-red-200 rounded-2xl w-full md:w-5/12 opacity-80 relative overflow-hidden">
                <div className="absolute top-1 right-2 text-[8px] font-black text-red-500 uppercase tracking-widest">
                  {locale === 'en' ? 'Cancelled' : locale === 'es' ? 'Cancelada' : 'Cancelada'}
                </div>
                <div className="text-4xl line-through opacity-60">❌</div>
                <span className="text-sm font-black text-red-955 line-through mt-2">{unexObj.cancelledTaskTitle}</span>
              </div>

              <div className="text-3xl text-slate-400 animate-pulse">➡️</div>

              <div className="flex flex-col items-center p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl w-full md:w-5/12 relative overflow-hidden">
                <div className="absolute top-1 right-2 text-[8px] font-black text-emerald-600 uppercase tracking-widest">
                  {locale === 'en' ? 'Replacement' : locale === 'es' ? 'Sustituta' : 'Substituta'}
                </div>
                <div className="text-4xl">🌟</div>
                <span className="text-sm font-black text-emerald-955 mt-2">{unexObj.replacement}</span>
              </div>
            </div>

            {/* Motivo explanation */}
            <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 pl-0.5">
                {locale === 'en' ? 'Why did it change?' : locale === 'es' ? '¿Por qué cambió?' : 'Por que mudou?'}
              </p>
              <p className="text-sm font-extrabold text-slate-750 font-Outfit">
                "{unexObj.reason}"
              </p>
            </div>

            {/* Empathy Mascot guidance */}
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-250 p-4.5 rounded-2xl text-left">
              <span className="text-3xl shrink-0">🐶</span>
              <p className="text-[11px] text-amber-955 font-bold leading-normal">
                <strong>{locale === 'en' ? 'The Mascot says:' : locale === 'es' ? 'La Mascota dice:' : 'O Mascote diz:'}</strong>{' '}
                {locale === 'en'
                  ? 'It is okay to change plans! Sometimes things happen and we change what we are going to do. We will have a lot of fun anyway!'
                  : locale === 'es'
                  ? '¡Está bien cambiar de planes! A veces las cosas pasan y cambiamos lo que vamos a hacer. ¡Nos divertiremos mucho de todos modos!'
                  : 'Está tudo bem mudar de planos! Às vezes coisas acontecem e nós mudamos o que vamos fazer. Vamos nos divertir muito de qualquer jeito!'}
              </p>
            </div>

            {/* Acknowledge button */}
            <button
              onClick={handleAcknowledgeUnexpectedChange}
              className="w-full py-4.5 bg-yellow-500 hover:bg-yellow-600 text-slate-950 text-xs font-black rounded-2xl shadow-md border-b-4 border-yellow-755 active:scale-[0.98] transition-all cursor-pointer font-Outfit uppercase tracking-wider"
            >
              {locale === 'en' ? 'I understand, okay! 👍' : locale === 'es' ? '¡Entendido, está bien! 👍' : 'Entendi, tudo bem! 👍'}
            </button>
          </div>
        </main>
      );
    }
  }

  // If no active child is selected, show the selection screen
  if (!activeChild) {
    return (
      <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-900 relative overflow-hidden">
        {/* Playful background blobs removed to follow the home page minimal standard */}

        <div className="max-w-2xl w-full text-center flex flex-col items-center gap-6 z-10">
          <div className="w-16 h-16 bg-slate-100 text-indigo-500 rounded-2xl flex items-center justify-center font-bold text-3xl shadow-sm border border-slate-200">
            🐶
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight font-Outfit">
              {locale === 'en' ? 'Who are you today? 🐶' : locale === 'es' ? '¿Quién eres hoy? 🐶' : 'Quem é você hoje? 🐶'}
            </h1>
            <p className="text-sm font-bold text-slate-750 mt-3 font-semibold">
              {locale === 'en' ? 'Choose your profile to load your playful schedule!' : locale === 'es' ? '¡Elige tu perfil para cargar tu agenda lúdica!' : 'Escolha seu perfil para carregar sua agenda lúdica!'}
            </p>
          </div>

          {loadingChildren ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm font-bold text-slate-700 animate-pulse">
                {locale === 'en' ? 'Loading your data...' : locale === 'es' ? 'Cargando sus datos...' : 'Carregando seus dados...'}
              </span>
            </div>
          ) : children.length === 0 ? (
            <div className="bg-white border-2 border-slate-300 p-8 rounded-2xl shadow-md text-center">
              <p className="text-sm font-bold text-slate-700">
                {locale === 'en' ? 'No children registered yet.' : locale === 'es' ? 'Ningún niño registrado aún.' : 'Nenhuma criança cadastrada ainda.'}
              </p>
              <p className="text-xs text-slate-600 mt-2 font-semibold">
                {locale === 'en' ? 'Ask your guardian to register your profile in the main panel.' : locale === 'es' ? 'Pídele a tu tutor que registre tu perfil en el panel principal.' : 'Peça ao seu responsável para cadastrar seu perfil no painel principal.'}
              </p>
              <button 
                onClick={() => router.push('/dashboard')}
                className="mt-5 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer border-none font-Outfit"
              >
                {locale === 'en' ? 'Go to Guardian Panel' : locale === 'es' ? 'Ir al Panel del Tutor' : 'Ir para o Painel do Responsável'}
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
                  className="bg-white border border-slate-200 hover:border-indigo-450 rounded-2xl p-6 shadow-premium-soft hover:-translate-y-0.5 transition-all duration-300 flex flex-col items-center gap-4 text-center cursor-pointer group"
                >
                  <div className="w-16 h-16 bg-slate-100 text-indigo-500 rounded-2xl flex items-center justify-center text-3xl shadow-inner transition-colors border border-transparent group-hover:border-indigo-100">
                    {child.gender === 'Feminino' ? '👧' : child.gender === 'Masculino' ? '👦' : '👶'}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800 group-hover:text-indigo-900 transition-colors font-Outfit">{child.name}</h3>
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

  const renderHyperfocusModals = () => {
    if (!activeChild) return null;

    let inventory: string[] = [];
    try {
      if (activeChild.toyInventory) {
        inventory = JSON.parse(activeChild.toyInventory);
      }
    } catch (e) {}

    const focus = (childHyperfocus || "").toLowerCase();

    return (
      <>
        {/* Hyperfocus World Modal */}
        <AnimatePresence>
          {showHyperfocusModal && (
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
                className={`border-4 rounded-[32px] p-6 w-full max-w-lg shadow-2xl flex flex-col gap-5 relative overflow-hidden transition-colors duration-300 ${
                  sleepMode 
                    ? 'bg-[#090d1a] border-amber-900/60 text-amber-100' 
                    : 'bg-white border-yellow-400 text-slate-800'
                }`}
              >
                {/* Close button at top right */}
                <button
                  onClick={() => { playBubble(); setShowHyperfocusModal(false); }}
                  className={`absolute top-4 right-4 w-9 h-9 border-2 rounded-full flex items-center justify-center font-black transition-all active:scale-90 cursor-pointer text-sm ${
                    sleepMode 
                      ? 'bg-[#121827] border-amber-900/40 text-amber-450 hover:bg-amber-950' 
                      : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  ✕
                </button>

                <div className="text-center mt-2">
                  <span className="text-3xl">🎮</span>
                  <h3 className="text-xl font-black mt-1.5 font-Outfit">{locale === 'en' ? 'My Hyperfocus World' : locale === 'es' ? 'Mi Mundo del Hiperenfoque' : 'Meu Mundo do Hiperfoco'}</h3>
                  <p className="text-xs text-slate-400 font-semibold mt-1">
                    locale === 'en' ? 'Earn stars by completing missions and assemble your favorite toy!' : locale === 'es' ? '¡Gana estrellas completando misiones y arma tu juguete favorito!' : 'Ganhe estrelas completando missões e monte seu brinquedo favorito!'
                  </p>
                </div>

                {/* Toy preview assembly */}
                <div className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center min-h-[160px] ${
                  sleepMode ? 'bg-[#121827] border-amber-950/40' : 'bg-slate-50 border-slate-105'
                }`}>
                  {(() => {
                    if (focus.includes("dino") || focus.includes("dinossauro") || focus.includes("dinosaur")) {
                      return (
                        <svg viewBox="0 0 120 100" className="w-48 h-40">
                          {/* Skull */}
                          <rect x="75" y="25" width="22" height="18" rx="5" fill={inventory.includes('dino_skull') ? '#eab308' : '#e2e8f0'} stroke="#94a3b8" strokeWidth="2" />
                          <circle cx="82" cy="31" r="2" fill={inventory.includes('dino_skull') ? '#1e293b' : '#94a3b8'} />
                          {/* Ribs */}
                          <rect x="35" y="35" width="40" height="25" rx="8" fill={inventory.includes('dino_ribs') ? '#eab308' : '#e2e8f0'} stroke="#94a3b8" strokeWidth="2" />
                          {/* Legs */}
                          <rect x="42" y="60" width="8" height="20" rx="3" fill={inventory.includes('dino_legs') ? '#eab308' : '#e2e8f0'} stroke="#94a3b8" strokeWidth="2" />
                          <rect x="62" y="60" width="8" height="20" rx="3" fill={inventory.includes('dino_legs') ? '#eab308' : '#e2e8f0'} stroke="#94a3b8" strokeWidth="2" />
                          {/* Tail */}
                          <path d="M 35 45 Q 15 45 10 25 Q 20 55 35 55 Z" fill={inventory.includes('dino_tail') ? '#eab308' : '#e2e8f0'} stroke="#94a3b8" strokeWidth="2" />
                        </svg>
                      );
                    }
                    if (focus.includes("espaço") || focus.includes("astronauta") || focus.includes("space") || focus.includes("foguete") || focus.includes("rocket")) {
                      return (
                        <svg viewBox="0 0 100 120" className="w-40 h-44">
                          <rect x="20" y="100" width="60" height="8" rx="2" fill="#475569" />
                          <path d="M 40 85 L 35 98 L 45 98 Z" fill={inventory.includes('space_thrusters') ? '#ef4444' : '#cbd5e1'} />
                          <path d="M 60 85 L 55 98 L 65 98 Z" fill={inventory.includes('space_thrusters') ? '#ef4444' : '#cbd5e1'} />
                          <path d="M 30 70 L 18 85 L 35 85 Z" fill={inventory.includes('space_panels') ? '#3b82f6' : '#cbd5e1'} />
                          <path d="M 70 70 L 82 85 L 65 85 Z" fill={inventory.includes('space_panels') ? '#3b82f6' : '#cbd5e1'} />
                          <rect x="35" y="40" width="30" height="45" rx="15" fill={inventory.includes('space_capsule') ? '#6366f1' : '#e2e8f0'} stroke="#94a3b8" strokeWidth="2" />
                          <circle cx="50" cy="55" r="5" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5" />
                          {inventory.includes('space_flag') && (
                            <>
                              <line x1="65" y1="40" x2="65" y2="20" stroke="#475569" strokeWidth="2" />
                              <rect x="65" y="20" width="18" height="12" fill="#10b981" />
                            </>
                          )}
                        </svg>
                      );
                    }
                    if (focus.includes("trem") || focus.includes("train") || focus.includes("trilhos")) {
                      return (
                        <svg viewBox="0 0 150 80" className="w-56 h-30">
                          <line x1="10" y1="70" x2="140" y2="70" stroke={inventory.includes('train_tracks') ? '#475569' : '#e2e8f0'} strokeWidth="4" />
                          <rect x="85" y="25" width="45" height="35" rx="4" fill={inventory.includes('train_engine') ? '#ec4899' : '#e2e8f0'} stroke="#94a3b8" strokeWidth="2" />
                          <rect x="110" y="10" width="10" height="15" fill={inventory.includes('train_engine') ? '#3b82f6' : '#cbd5e1'} />
                          <rect x="35" y="30" width="40" height="30" rx="4" fill={inventory.includes('train_passenger') ? '#10b981' : '#e2e8f0'} stroke="#94a3b8" strokeWidth="2" />
                          <line x1="75" y1="45" x2="85" y2="45" stroke="#94a3b8" strokeWidth="3" />
                          <rect x="5" y="35" width="25" height="25" rx="2" fill={inventory.includes('train_cargo') ? '#f97316' : '#e2e8f0'} stroke="#94a3b8" strokeWidth="2" />
                          <line x1="30" y1="45" x2="35" y2="45" stroke="#94a3b8" strokeWidth="3" />
                          <circle cx="15" cy="65" r="5" fill="#1e293b" />
                          <circle cx="20" cy="65" r="5" fill="#1e293b" />
                          <circle cx="45" cy="65" r="5" fill="#1e293b" />
                          <circle cx="65" cy="65" r="5" fill="#1e293b" />
                          <circle cx="95" cy="65" r="5" fill="#1e293b" />
                          <circle cx="120" cy="65" r="5" fill="#1e293b" />
                        </svg>
                      );
                    }
                    // Fallback Accessories
                    return (
                      <div className="relative w-36 h-36 flex items-center justify-center bg-slate-100/50 rounded-full border-2 border-dashed border-slate-200">
                        <div className="text-6xl animate-bounce">🐶</div>
                        {inventory.includes('acc_hat') && <span className="absolute top-1 text-4xl">🎩</span>}
                        {inventory.includes('acc_glasses') && <span className="absolute top-10 text-3.5xl">😎</span>}
                        {inventory.includes('acc_medal') && <span className="absolute bottom-3 text-3.5xl">🥇</span>}
                        {inventory.includes('acc_cape') && <span className="absolute -left-1.5 text-4xl">🦸‍♂️</span>}
                      </div>
                    );
                  })()}
                </div>

                {/* Token Display */}
                <div className="flex items-center justify-between px-1 text-xs font-black uppercase tracking-wider">
                  <span className="flex items-center gap-1 text-[#475569]">
                    ⭐ {locale === 'en' ? 'Stars:' : locale === 'es' ? 'Estrellas:' : 'Estrelas:'} <strong className="text-yellow-500 text-sm font-black">{activeChild.tokens || 0}</strong>
                  </span>
                  <span className="text-slate-400">
                    {locale === 'en' ? 'Progress:' : locale === 'es' ? 'Progreso:' : 'Progresso:'} {activeChild.collectedParts === 4 ? (locale === 'en' ? '100% Complete! 🎉' : locale === 'es' ? '¡100% Completo! 🎉' : '100% Completo! 🎉') : `${activeChild.collectedParts || 0}/4 ${locale === 'en' ? 'Parts' : locale === 'es' ? 'Piezas' : 'Peças'}`}
                  </span>
                </div>

                {/* Parts Selection List */}
                <div className="grid grid-cols-2 gap-3 max-h-[180px] overflow-y-auto pr-1">
                  {(() => {
                    const parts = getHyperfocusParts(childHyperfocus);
                    return parts.map(part => {
                      const hasIt = inventory.includes(part.id);
                      const canBuy = (activeChild.tokens || 0) >= part.cost;

                      return (
                        <div
                          key={part.id}
                          className={`p-3 border-2 rounded-2xl flex flex-col items-center text-center justify-between gap-1.5 transition-all ${
                            hasIt
                              ? 'bg-emerald-50/45 border-emerald-300 text-slate-800'
                              : sleepMode
                              ? 'bg-[#121827] border-amber-950/40 text-amber-100'
                              : 'bg-slate-50 border-slate-105 text-slate-800'
                          }`}
                        >
                          <span className="text-2.5xl select-none">{part.icon}</span>
                          <h4 className="font-extrabold text-[10px] leading-tight font-Outfit">{part.name}</h4>
                          {hasIt ? (
                            <span className="text-[9px] font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full select-none">
                              {locale === 'en' ? 'Unlocked ✅' : locale === 'es' ? 'Desbloqueada ✅' : 'Conquistada ✅'}
                            </span>
                          ) : (
                            <button
                              disabled={!canBuy}
                              onClick={() => handleBuyPart(part.id, part.cost)}
                              className={`w-full py-1.5 rounded-full text-[9px] font-black tracking-tight transition-all active:scale-95 cursor-pointer border-none ${
                                canBuy
                                  ? 'bg-yellow-450 text-slate-950 hover:bg-yellow-500 shadow-sm'
                                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                              }`}
                            >
                              {locale === 'en' ? 'Get for' : locale === 'es' ? 'Obtener por' : 'Obter por'} {part.cost} ⭐
                            </button>
                          )}
                        </div>
                      );
                    });
                  })()}
                </div>

                {/* Launch Action */}
                {activeChild.collectedParts === 4 && (
                  <button
                    onClick={() => {
                      playCelebration();
                      setIsToyLaunched(true);
                      setShowHyperfocusModal(false);
                      if (focus.includes("space")) speakText(t.routine.spaceLaunch);
                      else if (focus.includes("dino")) speakText(t.routine.dinoLaunch);
                      else if (focus.includes("trem")) speakText(t.routine.tremLaunch);
                      else speakText(t.routine.congratsAllParts);
                    }}
                    className="w-full py-3 bg-gradient-to-r from-yellow-450 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-slate-950 text-xs font-black rounded-2xl shadow-md uppercase tracking-wider select-none animate-bounce font-Outfit border-none cursor-pointer mt-1"
                  >
                    🚀 {locale === 'en' ? 'Activate Assembled Toy!' : locale === 'es' ? '¡Activar Juguete Armado!' : 'Ativar Brinquedo Montado!'}
                  </button>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toy Launch Full Screen Overlay Animation */}
        <AnimatePresence>
          {isToyLaunched && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-[#070b19] flex flex-col items-center justify-center overflow-hidden"
            >
              {/* Twinkling stars */}
              <div className="absolute inset-0 opacity-40">
                {twinklingStars.map(star => (
                  <div
                    key={star.id}
                    className="absolute w-2 h-2 bg-white rounded-full animate-ping"
                    style={{ top: star.top, left: star.left }}
                  />
                ))}
              </div>

              {/* Launch Theme Rendering */}
              <div className="relative z-10 text-center flex flex-col items-center gap-6">
                {(() => {
                  if (focus.includes("space")) {
                    return (
                      <motion.div
                        animate={{ y: [300, -450] }}
                        transition={{ duration: 4.5, repeat: Infinity, ease: "easeIn" }}
                        className="text-9xl select-none"
                      >
                        🚀
                      </motion.div>
                    );
                  }
                  if (focus.includes("dino")) {
                    return (
                      <motion.div
                        animate={{ scale: [1, 1.2, 1], rotate: [0, -10, 10, 0] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        className="text-9xl select-none"
                      >
                        🦖
                      </motion.div>
                    );
                  }
                  if (focus.includes("trem")) {
                    return (
                      <motion.div
                        animate={{ x: [-300, 300] }}
                        transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                        className="text-9xl select-none"
                      >
                        🚂
                      </motion.div>
                    );
                  }
                  return (
                    <motion.div
                      animate={{ scale: [1, 1.15, 1], y: [0, -20, 0] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                      className="text-9xl select-none"
                    >
                      🐾
                    </motion.div>
                  );
                })()}

                <h1 className="text-4xl md:text-5xl font-black text-yellow-100 tracking-tight mt-6 font-Outfit animate-pulse">
                  {(() => {
                    if (focus.includes("space")) return locale === 'en' ? "Rocket Launching!" : locale === 'es' ? "¡Cohete Despegando!" : "Foguete Decolando!";
                    if (focus.includes("dino")) return locale === 'en' ? "T-Rex Came to Life!" : locale === 'es' ? "¡T-Rex Cobró Vida!" : "T-Rex Ganhou Vida!";
                    if (focus.includes("trem")) return locale === 'en' ? "Train in Motion!" : locale === 'es' ? "¡Tren en Movimiento!" : "Trem em Movimento!";
                    return locale === 'en' ? "Toy Activated!" : locale === 'es' ? "¡Juguete Activado!" : "Brinquedo Ativado!";
                  })()}
                </h1>
                <p className="text-indigo-200 text-sm max-w-sm font-semibold px-4">
                  {locale === 'en' ? 'You are amazing! You got all the pieces and assembled the toy yourself!' : locale === 'es' ? '¡Eres increíble! ¡Conseguiste todas las piezas y armaste el juguete tú solo!' : 'Você é incrível! Conseguiu todas as peças e montou o brinquedo sozinho!'}
                </p>

                <button
                  onClick={() => { playBubble(); setIsToyLaunched(false); }}
                  className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 border-2 border-indigo-400 text-white text-xs font-black rounded-full shadow-lg active:scale-95 transition-all cursor-pointer font-Outfit uppercase tracking-widest mt-8"
                >
                  {locale === 'en' ? 'Back to Routine 🔙' : locale === 'es' ? 'Volver a la Rutina 🔙' : 'Voltar à Rotina 🔙'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  };

  const renderAacModal = () => {
    if (!showAacModal) return null;
    return (
      <AnimatePresence>
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
            className="bg-white border-4 border-emerald-400 rounded-[32px] p-6 w-full max-w-2xl shadow-2xl flex flex-col gap-5 relative overflow-hidden text-slate-800"
          >
            <button
              onClick={() => { playBubble(); setShowAacModal(false); }}
              className="absolute top-4 right-4 w-9 h-9 bg-slate-100 border-2 border-slate-200 text-slate-500 rounded-full flex items-center justify-center font-black transition-all active:scale-90 cursor-pointer text-sm"
            >
              ✕
            </button>

            <div className="text-center mt-2">
              <span className="text-3xl">🗣️</span>
              <h3 className="text-xl font-black mt-1.5 font-Outfit text-emerald-805">
                {locale === 'en' ? 'My Voice (AAC Board)' : locale === 'es' ? 'Mi Voz (Tablero AAC)' : 'Minha Voz (Prancha AAC)'}
              </h3>
              <p className="text-xs text-slate-400 font-semibold mt-1">
                {locale === 'en' ? 'Tap a button to say what you need! Your guide will help you speak loud.' : locale === 'es' ? '¡Toca un botón para decir lo que necesitas! Tu guía te ayudará a hablar bien alto.' : 'Toque em um botão para falar o que você precisa! Seu guia vai te ajudar a falar bem alto.'}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 max-h-[380px] overflow-y-auto pr-1">
              {(() => {
                const localAacItems = [
                  { text: locale === 'en' ? "I want water 🥛" : locale === 'es' ? "Quiero agua 🥛" : "Quero água 🥛", speech: locale === 'en' ? "I want water, please." : locale === 'es' ? "Quiero agua, por favor." : "Quero água, por favor.", mood: "calmo" },
                  { text: locale === 'en' ? "I am hungry 🍎" : locale === 'es' ? "Tengo hambre 🍎" : "Tenho fome 🍎", speech: locale === 'en' ? "I am hungry, please." : locale === 'es' ? "Tengo hambre, por favor." : "Tenho fome, por favor.", mood: "calmo" },
                  { text: locale === 'en' ? "Bathroom 🚽" : locale === 'es' ? "Baño 🚽" : "Banheiro 🚽", speech: locale === 'en' ? "I want to go to the bathroom." : locale === 'es' ? "Quiero ir al baño." : "Quero ir ao banheiro.", mood: "calmo" },
                  { text: locale === 'en' ? "I am in pain 🤕" : locale === 'es' ? "Tengo dolor 🤕" : "Estou com dor 🤕", speech: locale === 'en' ? "I am in pain." : locale === 'es' ? "Tengo dolor." : "Estou com dor.", mood: "triste", alert: true },
                  { text: locale === 'en' ? "I am tired 🥱" : locale === 'es' ? "Estoy cansado 🥱" : "Estou cansado 🥱", speech: locale === 'en' ? "I am tired." : locale === 'es' ? "Estoy cansado." : "Estou cansado.", mood: "triste" },
                  { text: locale === 'en' ? "I need help 🆘" : locale === 'es' ? "Necesito ayuda 🆘" : "Preciso de ajuda 🆘", speech: locale === 'en' ? "I need help." : locale === 'es' ? "Necesito ayuda." : "Preciso de ajuda.", mood: "agitado", alert: true },
                  { text: locale === 'en' ? "I want to play 🧸" : locale === 'es' ? "Quiero jugar 🧸" : "Quero brincar 🧸", speech: locale === 'en' ? "I want to play." : locale === 'es' ? "Quiero jugar." : "Quero brincar.", mood: "feliz" },
                  { text: locale === 'en' ? "Headphones 🎧" : locale === 'es' ? "Auriculares 🎧" : "Fone de ouvido 🎧", speech: locale === 'en' ? "I want my headphones." : locale === 'es' ? "Quiero mis auriculares." : "Quero meu fone de ouvido.", mood: "calmo" },
                  { text: locale === 'en' ? "Cold ❄️" : locale === 'es' ? "Frío ❄️" : "Frio ❄️", speech: locale === 'en' ? "I am cold." : locale === 'es' ? "Tengo frío." : "Estou com frio.", mood: "calmo" },
                  { text: locale === 'en' ? "Hug 🤗" : locale === 'es' ? "Abrazo 🤗" : "Abraço 🤗", speech: locale === 'en' ? "I want a hug." : locale === 'es' ? "Quiero un abrazo." : "Quero um abraço.", mood: "feliz" }
                ];
                let mergedList = [...localAacItems];
                if (activeChild?.aacCustomItems) {
                  try {
                    const customItems = JSON.parse(activeChild.aacCustomItems);
                    if (Array.isArray(customItems)) {
                      mergedList = [...mergedList, ...customItems];
                    }
                  } catch (e) {}
                }
                return mergedList.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      playBubble();
                      handleAacClick(item);
                    }}
                    className={`p-3.5 flex flex-col items-center justify-center text-center gap-2 rounded-2xl border-2 transition-all active:scale-95 cursor-pointer hover:shadow-md ${
                      item.alert 
                        ? 'bg-red-50 border-red-300 hover:bg-red-100 hover:border-red-400 text-red-800' 
                        : 'bg-emerald-50/30 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-355 text-emerald-950'
                    }`}
                  >
                    <span className="text-4.5xl select-none leading-none">
                      {item.text.match(/\p{Emoji}/gu)?.[0] || '💬'}
                    </span>
                    <span className="text-[11px] font-black tracking-tight leading-snug uppercase font-Outfit">
                      {item.text.replace(/\p{Emoji}/gu, '').trim()}
                    </span>
                  </button>
                ));
              })()}
            </div>

            <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-2xl flex gap-2.5 items-center">
              <span className="text-lg">💡</span>
              <p className="text-[10px] text-slate-500 leading-normal font-semibold">
                {locale === 'en' 
                  ? 'This board helps non-verbal children or those in overload moments express their immediate needs. Every tap is logged in the history for caregivers and therapists to view.' 
                  : locale === 'es' 
                  ? 'Este tablero ayuda a los niños no verbales o en momentos de sobrecarga a expresar sus necesidades inmediatas. Cada toque se registra en el historial para el cuidador y el terapeuta.' 
                  : 'Esta prancha ajuda crianças não-verbais ou em momentos de sobrecarga a expressarem suas necessidades imediatas. Cada toque é registrado no histórico para que o cuidador e terapeuta vejam.'
                }
              </p>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  const renderSimulatorModal = () => {
    if (!showSimulatorModal) return null;
    
        const scenarios = [
      {
        id: 'dentist',
        title: locale === 'en' ? 'Going to the Dentist 🦷' : locale === 'es' ? 'Ir al Dentista 🦷' : 'Ir ao Dentista 🦷',
        desc: locale === 'en' ? 'Learn about the dentist\'s chair and how they take care of your teeth!' : locale === 'es' ? '¡Aprende cómo es la silla del dentista y cómo cuida tus dientes!' : 'Aprenda como é a cadeira do dentista e como ele cuida dos seus dentes!',
        icon: '🦷',
        color: 'border-blue-400 bg-blue-50/20 hover:bg-blue-50 text-blue-955',
        steps: [
          {
            title: locale === 'en' ? 'Dentist\'s Office 🚪' : locale === 'es' ? 'Consultorio del Dentista 🚪' : 'Sala do Dentista 🚪',
            desc: locale === 'en' ? 'You arrived at the clinic! The room has toys and the dentist has a giant astronaut chair. Let\'s wave happily!' : locale === 'es' ? '¡Llegaste a la clínica! La sala tiene juguetes y el dentista tiene una silla de astronauta gigante. ¡Saludemos alegremente!' : 'Você chegou na clínica! A sala tem brinquedos e o dentista tem uma cadeira de astronauta gigante. Vamos dar um tchau bem alegre!',
            action: locale === 'en' ? 'Wave to the dentist 👋' : locale === 'es' ? 'Saludar al dentista 👋' : 'Dar tchau para o dentista 👋',
            img: '👋🦷'
          },
          {
            title: locale === 'en' ? 'The Magic Chair 🚀' : locale === 'es' ? 'La Silla Mágica 🚀' : 'A Cadeira Mágica 🚀',
            desc: locale === 'en' ? 'You sit in the soft chair. It goes up and down, like a space rocket! Let\'s raise the chair!' : locale === 'es' ? 'Te sientas en la silla suave. ¡Sube y baja, parece un cohete espacial! ¡Subamos la silla!' : 'Você senta na cadeira macia. Ela sobe e desce, parece um foguete espacial! Vamos subir a cadeira!',
            action: locale === 'en' ? 'Raise the astronaut chair 🚀' : locale === 'es' ? 'Subir la silla de astronauta 🚀' : 'Subir a cadeira de astronauta 🚀',
            img: '💺'
          },
          {
            title: locale === 'en' ? 'The Dentist\'s Mirror 🔍' : locale === 'es' ? 'El Espejo del Dentista 🔍' : 'O Espelhinho do Dentista 🔍',
            desc: locale === 'en' ? 'The dentist uses a very small mirror to count how many teeth you have. Let\'s open our mouth wide and say Aaaah!' : locale === 'es' ? 'El dentista usa un espejo muy pequeño para contar cuántos dientes tienes. ¡Abramos la boca bien grande y digamos Aaaah!' : 'O espelhinho do dentista serve para contar quantos dentes você tem. Vamos abrir a boca bem grande e falar Aaaah!',
            action: locale === 'en' ? 'Open mouth wide 😮' : locale === 'es' ? 'Abrir la boca bien grande 😮' : 'Abrir a boca bem grande 😮',
            img: '😮'
          },
          {
            title: locale === 'en' ? 'The Tickling Brush 🫧' : locale === 'es' ? 'El Cepillo de Cosquillas 🫧' : 'A Escovinha Cócegas 🫧',
            desc: locale === 'en' ? 'The dentist uses a super fast electric brush. It makes a gentle noise and tickles your teeth a lot!' : locale === 'es' ? 'El dentista pasa un cepillo eléctrico súper rápido. ¡Hace un sonido suave y muchas cosquillas en los dientes!' : 'O dentista passa uma escova elétrica super rápida. Ela faz um barulhinho suave e muitas cócegas nos dentes!',
            action: locale === 'en' ? 'Get teeth tickled 🫧' : locale === 'es' ? 'Recibir cosquillas en los dientes 🫧' : 'Receber cócegas nos dentes 🫧',
            img: '🪥\u2728'
          },
          {
            title: locale === 'en' ? 'Star Smile! ⭐' : locale === 'es' ? '¡Sonrisa de Estrella! ⭐' : 'Sorriso de Estrela! ⭐',
            desc: locale === 'en' ? 'All done! The visit ended super fast and your teeth are shining like stars. You were very brave!' : locale === 'es' ? '¡Listo! La consulta terminó súper rápido y tus dientes brillan como estrellas. ¡Fuiste muy valiente!' : 'Pronto! A consulta acabou super rápido e seus dentes estão brilhando como estrelas. Você foi muito corajoso!',
            action: locale === 'en' ? 'Earn my stars! 🏆' : locale === 'es' ? '¡Ganar mis estrellas! 🏆' : 'Ganar minhas estrelas! 🏆',
            img: '\u2728😎\u2728'
          }
        ]
      },
      {
        id: 'school',
        title: locale === 'en' ? 'Going to School 🏫' : locale === 'es' ? 'Ir a la Escuela 🏫' : 'Ir para a Escola 🏫',
        desc: locale === 'en' ? 'Simulate the first day of school, meeting the teacher and making new friends!' : locale === 'es' ? '¡Simula el primer día de clases, conociendo a la maestra y haciendo nuevos amigos!' : 'Simule o primeiro dia de aula, conhecendo a professora e fazendo novos amigos!',
        icon: '🏫',
        color: 'border-purple-400 bg-purple-50/20 hover:bg-purple-50 text-purple-955',
        steps: [
          {
            title: locale === 'en' ? 'School Entrance 🎒' : locale === 'es' ? 'Entrada de la Escuela 🎒' : 'Entrada da Escola 🎒',
            desc: locale === 'en' ? 'You arrived at school with your colorful backpack! Let\'s give daddy and mommy a big hug before entering the classroom.' : locale === 'es' ? '¡Llegaste a la escuela con tu mochila colorida! Demos un abrazo muy fuerte a papá y mamá antes de entrar al salón.' : 'Você chegou na escola com sua mochila colorida! Vamos dar um abraço bem gostoso no papai e na mamãe antes de entrar na sala.',
            action: locale === 'en' ? 'Give a hug and enter school 🤗' : locale === 'es' ? 'Dar un abrazo y entrar a la escuela 🤗' : 'Dar um abraço e entrar na escola 🤗',
            img: '🏫🎒'
          },
          {
            title: locale === 'en' ? 'My Desk 🪑' : locale === 'es' ? 'Mi Mesa 🪑' : 'A Minha Mesa 🪑',
            desc: locale === 'en' ? 'The classroom is full of colors! The teacher shows you your desk with toys and paper for drawing. Let\'s choose our place.' : locale === 'es' ? '¡El salón de clases está lleno de colores! La maestra te muestra tu mesa con juguetes y hojas para dibujar. Vamos a elegir nuestro lugar.' : 'A sala de aula é cheia de cores! A professora te mostra a sua mesa com brinquedos e folhas para desenhar. Vamos escolher nosso lugar.',
            action: locale === 'en' ? 'Choose my desk 🪑' : locale === 'es' ? 'Elegir mi mesa 🪑' : 'Escolher minha mesa 🪑',
            img: '🎨🪑'
          },
          {
            title: locale === 'en' ? 'Snack Time 🍎' : locale === 'es' ? 'Hora de la Merienda 🍎' : 'Hora do Lanche 🍎',
            desc: locale === 'en' ? 'Yummy! It\'s time to eat snack with new friends. Everyone sits in their small chair and eats slowly.' : locale === 'es' ? '¡Qué delicia! Es hora de comer la merienda con los nuevos amigos. Cada uno se sienta en su silla y come despacio.' : 'Que delícia! É hora de comer o lanchinho com os novos amigos. Cada um senta na sua cadeirinha e come devagar.',
            action: locale === 'en' ? 'Eat my yummy snack 🍇' : locale === 'es' ? 'Comer mi merienda deliciosa 🍇' : 'Comer meu lanche gostoso 🍇',
            img: '🥪🍎'
          },
          {
            title: locale === 'en' ? 'Playing Together 🧱' : locale === 'es' ? 'Jugando Juntos 🧱' : 'Brincando Juntos 🧱',
            desc: locale === 'en' ? 'At playtime, a friend wants to use the same blocks as you. Let\'s share a block and build a giant tower together!' : locale === 'es' ? 'A la hora de jugar, un amigo quiere usar los mismos bloques que tú. ¡Compartamos un bloque y construyamos una torre gigante juntos!' : 'Na hora de brincar, um amigo quer usar os mesmos blocos que você. Vamos emprestar um bloco e construir uma torre gigante juntos!',
            action: locale === 'en' ? 'Build the giant tower 🧱' : locale === 'es' ? 'Construir la torre gigante 🧱' : 'Construir a torre gigante 🧱',
            img: '🧩🧱'
          },
          {
            title: locale === 'en' ? 'Time to Go Back! 🚗' : locale === 'es' ? '¡Hora de Volver! 🚗' : 'Hora de Voltar! 🚗',
            desc: locale === 'en' ? 'The school bell rings! You pack your backpack and see daddy and mommy waiting for you at the door with a big smile. Mission completed!' : locale === 'es' ? '¡Suena el timbre de la escuela! Prepara tu mochila y ve a papá y mamá esperándote en la puerta con una gran sonrisa. ¡Misión cumplida!' : 'O sinal da escola toca! Você arruma sua mochila e vê o papai e a mamãe te esperando na porta com um grande sorriso. Missão concluída!',
            action: locale === 'en' ? 'Grab backpack and run for a hug! 🚀' : locale === 'es' ? '¡Tomar la mochila y correr al abrazo! 🚀' : 'Pegar mochila e correr pro abraço! 🚀',
            img: '🥳🚗'
          }
        ]
      }
    ];

    const currentScenarioData = scenarios.find(s => s.id === selectedScenario);

    return (
      <AnimatePresence>
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
            className="bg-white border-4 border-purple-400 rounded-[32px] p-6 w-full max-w-lg shadow-2xl flex flex-col gap-5 relative overflow-hidden text-slate-800"
          >
            <button
              onClick={() => { playBubble(); setShowSimulatorModal(false); setSelectedScenario(null); setSimulatorStep(0); setSimulatorFinished(false); }}
              className="absolute top-4 right-4 w-9 h-9 bg-slate-100 border-2 border-slate-200 text-slate-500 rounded-full flex items-center justify-center font-black transition-all active:scale-90 cursor-pointer text-sm"
            >
              ✕
            </button>

            {!selectedScenario ? (
              <div className="flex flex-col gap-5">
                <div className="text-center mt-2">
                  <span className="text-3xl">🎮</span>
                  <h3 className="text-xl font-black mt-1.5 font-Outfit text-purple-805">Simulador de Rotinas</h3>
                  <p className="text-xs text-slate-400 font-semibold mt-1">
                    {locale === 'en' ? 'Choose an interactive simulation to learn how to act and prepare for new places!' : locale === 'es' ? '¡Elige una simulación interactiva para aprender cómo actuar y prepararte para nuevos lugares!' : 'Escolha uma simulação interativa para aprender como agir e se preparar para novos lugares!'}
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  {scenarios.map(sc => (
                    <button
                      key={sc.id}
                      onClick={() => {
                        playBubble();
                        setSelectedScenario(sc.id as any);
                        setSimulatorStep(0);
                        setSimulatorFinished(false);
                        speakText(`Vamos simular: ${sc.title}. ${sc.steps[0].desc}`);
                      }}
                      className={`p-4 border-2 rounded-2xl transition-all active:scale-98 text-left cursor-pointer flex items-center gap-4 group ${sc.color}`}
                    >
                      <div className="w-12 h-12 bg-white/80 border border-slate-200 rounded-xl flex items-center justify-center text-3xl shadow-xxs shrink-0 group-hover:scale-105 transition-all">
                        {sc.icon}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm font-Outfit">{sc.title}</h4>
                        <p className="text-[10px] text-slate-505 font-semibold mt-0.5 leading-normal">{sc.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : currentScenarioData ? (
              <div className="flex flex-col items-center gap-5">
                <div className="flex items-center justify-between w-full border-b border-slate-100 pb-3">
                  <button
                    onClick={() => { playBubble(); setSelectedScenario(null); setSimulatorStep(0); setSimulatorFinished(false); }}
                    className="text-xxs font-black uppercase tracking-wider text-slate-400 hover:text-slate-650 flex items-center gap-1 cursor-pointer bg-transparent border-none"
                  >
                    ← {t.common.back}
                  </button>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-Outfit">
                    Etapa {simulatorStep + 1} de {currentScenarioData.steps.length}
                  </span>
                </div>

                <div className="text-center">
                  <h4 className="text-sm font-black text-purple-800 uppercase tracking-wider font-Outfit">
                    {currentScenarioData.steps[simulatorStep].title}
                  </h4>
                </div>

                <div className="w-full bg-slate-50 border-2 border-slate-150 rounded-[24px] py-6 flex flex-col items-center justify-center min-h-[160px] relative">
                  <motion.div
                    key={simulatorStep}
                    initial={{ scale: 0.5, rotate: -15, opacity: 0 }}
                    animate={{ scale: 1, rotate: 0, opacity: 1 }}
                    className="text-6xl select-none"
                  >
                    {currentScenarioData.steps[simulatorStep].img}
                  </motion.div>

                  <div className="absolute bottom-2 right-4 flex items-center gap-1 bg-white border border-slate-200 px-2 py-1 rounded-full shadow-xxs">
                    <span className="text-xs">🐾</span>
                    <span className="text-[8px] font-black text-purple-700 uppercase tracking-wider font-Outfit">Mascote {childHyperfocus.split(' ')[0]}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 font-bold leading-relaxed text-center px-2 min-h-[50px]">
                  {currentScenarioData.steps[simulatorStep].desc}
                </p>

                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                  <div 
                    className="bg-purple-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${((simulatorStep + 1) / currentScenarioData.steps.length) * 100}%` }}
                  />
                </div>

                <button
                  onClick={async () => {
                    playBubble();
                    if (simulatorStep < currentScenarioData.steps.length - 1) {
                      const next = simulatorStep + 1;
                      setSimulatorStep(next);
                      speakText(currentScenarioData.steps[next].desc);
                    } else {
                      await handleCompleteSimulator();
                    }
                  }}
                  disabled={simulatorFinished}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-650 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {simulatorFinished ? "Recompensa Resgatada! 🎉" : currentScenarioData.steps[simulatorStep].action}
                </button>

                {simulatorFinished && (
                  <div className="text-center font-black text-emerald-600 text-xs flex flex-col gap-1.5 animate-bounce">
                    <span>🌟 +3 Estrelas Adicionadas!</span>
                    <button
                      onClick={() => {
                        playBubble();
                        setShowSimulatorModal(false);
                        setSelectedScenario(null);
                        setSimulatorStep(0);
                        setSimulatorFinished(false);
                      }}
                      className="px-4 py-1.5 bg-slate-100 hover:bg-slate-250 text-[10px] font-black uppercase text-slate-700 rounded-lg shadow-xxs border border-slate-300 cursor-pointer"
                    >
                      Fechar Simulador
                    </button>
                  </div>
                )}
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  const renderSensoryAlertModal = () => {
    if (!showSensoryAlert) return null;
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.95, y: 15 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 15 }}
            className="bg-white border-4 border-amber-400 rounded-[32px] p-6 w-full max-w-sm shadow-2xl flex flex-col items-center text-center gap-4 text-slate-800"
          >
            <span className="text-5xl animate-bounce">🎧</span>
            <div>
              <h3 className="text-xl font-black text-amber-950 font-Outfit">Ambiente Muito Barulhento!</h3>
              <p className="text-xs text-slate-500 font-bold mt-1">
                {locale === 'en' ? <>We detected noise of <strong className="text-red-500">{sensoryAlertDb} dB</strong>. How about calming down or putting on ear muffs?</> : locale === 'es' ? <>Detectamos ruidos de <strong className="text-red-500">{sensoryAlertDb} dB</strong>. ¿Qué tal calmarse o ponerse auriculares?</> : <>Detectamos ruídos de <strong className="text-red-500">{sensoryAlertDb} dB</strong>. Que tal se acalmar ou colocar abafadores?</>}
              </p>
            </div>
            
            <button
              onClick={() => {
                playBubble();
                setLocalCalmMode(true);
                localStorage.setItem('localCalmMode', 'true');
                speakText(t.routine.calmModeAuto);
                setShowSensoryAlert(false);
              }}
              className="w-full py-3 bg-teal-500 hover:bg-teal-600 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 border-none font-Outfit"
            >
              🧘 {locale === 'en' ? 'Activate Calm Mode' : locale === 'es' ? 'Activar Modo Calmo' : 'Ativar Modo Calmo'}
            </button>

            <button
              onClick={() => {
                playBubble();
                setShowSensoryAlert(false);
              }}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-xl shadow-xs transition-all active:scale-95 border-none"
            >
              {locale === 'en' ? 'Understood 🎧' : locale === 'es' ? 'Entendido 🎧' : 'Entendido 🎧'}
            </button>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  const renderMascotShopModal = () => {
    if (!showShopModal || !activeChild) return null;

    const shopItems = [
      { id: 'acc_hat', label: locale === 'en' ? '🎩 Elegant Hat' : locale === 'es' ? '🎩 Sombrero Elegante' : '🎩 Chapéu Elegante', cost: 5, desc: locale === 'en' ? 'Give your mascot a super fine look!' : locale === 'es' ? '¡Dale un aspecto súper fino a tu mascota!' : 'Dê um visual super fino ao seu mascote!' },
      { id: 'acc_glasses', label: locale === 'en' ? '😎 Cool Glasses' : locale === 'es' ? '😎 Gafas Geniales' : '😎 Óculos Maneiro', cost: 10, desc: locale === 'en' ? 'Cool sunglasses for your pet.' : locale === 'es' ? 'Gafas de sol geniales para tu mascota.' : 'Óculos de sol descolados para o seu pet.' },
      { id: 'acc_medal', label: locale === 'en' ? '🥇 Champion Medal' : locale === 'es' ? '🥇 Medalla de Campeón' : '🥇 Medalha de Campeão', cost: 15, desc: locale === 'en' ? 'Show your mascot\'s bravery!' : locale === 'es' ? '¡Muestra la valentía de tu mascota!' : 'Mostre a bravura do seu mascote!' },
      { id: 'acc_cape', label: locale === 'en' ? '🦸‍♂️ Hero Cape' : locale === 'es' ? '🦸‍♂️ Capa de Héroe' : '🦸‍♂️ Capa de Herói', cost: 20, desc: locale === 'en' ? 'Give incredible superpowers to your companion.' : locale === 'es' ? 'Dale superpoderes increíbles a tu compañero.' : 'Dê superpoderes incríveis ao seu companheiro.' }
    ];

    let owned: string[] = [];
    try {
      if (activeChild.toyInventory) {
        const parsed = JSON.parse(activeChild.toyInventory);
        if (parsed && typeof parsed === 'object') {
          owned = parsed.owned || [];
        } else if (Array.isArray(parsed)) {
          owned = parsed;
        }
      }
    } catch (e) {}

    const handleBuyItem = async (itemId: string, cost: number) => {
      if (activeChild.tokens < cost) return;
      playMarimba(523, 0.4);
      
      const newOwned = [...owned, itemId];
      const newEquipped = [...equippedAccessories, itemId];
      const newTokens = activeChild.tokens - cost;
      
      try {
        const updated = await firebaseBridge.auth.updateChildSettings(activeChild.id, {
          tokens: newTokens,
          toyInventory: JSON.stringify({ owned: newOwned, equipped: newEquipped })
        });
        setActiveChild(updated);
        setEquippedAccessories(newEquipped);
        localStorage.setItem('tea_equipped_accessories', JSON.stringify(newEquipped));
      } catch (err) {
        console.error("Erro ao comprar item:", err);
      }
    };

    const handleEquipItem = async (itemId: string) => {
      let nextEquipped = [...equippedAccessories];
      if (nextEquipped.includes(itemId)) {
        nextEquipped = nextEquipped.filter(id => id !== itemId);
        playBubble();
      } else {
        nextEquipped.push(itemId);
        playMarimba(392, 0.3);
      }
      
      setEquippedAccessories(nextEquipped);
      localStorage.setItem('tea_equipped_accessories', JSON.stringify(nextEquipped));

      try {
        await firebaseBridge.auth.updateChildSettings(activeChild.id, {
          toyInventory: JSON.stringify({ owned, equipped: nextEquipped })
        });
      } catch (err) {
        console.error("Erro ao equipar item:", err);
      }
    };

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.95, y: 15 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 15 }}
            className="bg-white border-4 border-indigo-500 rounded-[36px] p-6 w-full max-w-md shadow-2xl flex flex-col gap-5 text-slate-800"
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-xl font-black text-slate-900 font-Outfit">🛒 {locale === 'en' ? 'Mascot Shop' : locale === 'es' ? 'Tienda de la Mascota' : 'Loja do Mascote'}</h3>
              <button
                onClick={() => { playBubble(); setShowShopModal(false); }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-sm border-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center justify-between bg-indigo-50/50 border border-indigo-100 p-3.5 rounded-2xl">
              <span className="text-xs font-black text-indigo-950 font-Outfit">{locale === 'en' ? 'Your Stars:' : locale === 'es' ? 'Tus Estrellas:' : 'Suas Estrelas:'}</span>
              <div className="flex items-center gap-1.5 bg-yellow-450 text-indigo-955 font-black px-3.5 py-1 rounded-full text-xs shadow-sm">
                ⭐ {activeChild.tokens}
              </div>
            </div>

            <div className="flex flex-col gap-3.5 max-h-[300px] overflow-y-auto pr-1">
              {shopItems.map(item => {
                const isOwned = owned.includes(item.id);
                const isEquipped = equippedAccessories.includes(item.id);
                return (
                  <div key={item.id} className="flex items-center justify-between bg-slate-50 border border-slate-150 p-3.5 rounded-2xl gap-3 text-left">
                    <div className="flex-1">
                      <h4 className="text-sm font-black text-slate-805 font-Outfit">{item.label}</h4>
                      <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{item.desc}</p>
                    </div>

                    {isOwned ? (
                      <button
                        onClick={() => handleEquipItem(item.id)}
                        className={`px-4 py-2 text-[10px] font-black rounded-xl cursor-pointer transition-all active:scale-95 border-none font-Outfit ${
                          isEquipped ? 'bg-indigo-650 hover:bg-indigo-700 text-white shadow-sm' : 'bg-slate-200 hover:bg-slate-300 text-slate-705'
                        }`}
                      >
                        {isEquipped ? (locale === 'en' ? 'Unequip ✖' : locale === 'es' ? 'Desequipar ✖' : 'Desequipar ✖') : (locale === 'en' ? 'Equip 👕' : locale === 'es' ? 'Equipar 👕' : 'Equipar 👕')}
                      </button>
                    ) : (
                      <button
                        disabled={activeChild.tokens < item.cost}
                        onClick={() => handleBuyItem(item.id, item.cost)}
                        className={`px-4 py-2 text-[10px] font-black rounded-xl cursor-pointer transition-all active:scale-95 border-none font-Outfit ${
                          activeChild.tokens >= item.cost
                            ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        {locale === 'en' ? 'Buy' : locale === 'es' ? 'Comprar' : 'Comprar'} ⭐ {item.cost}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  // Dynamic visual layout for day finished (darker, cozy, resting theme)
  if (isDayFinished) {
    const profileClass = effectiveProfile === 'hypersensitive'
      ? 'saturate-[60%] brightness-[90%] contrast-[88%]'
      : effectiveProfile === 'hyposensitive'
      ? 'saturate-[125%] contrast-[110%]'
      : '';

    return (
      <main className={`min-h-screen flex flex-col items-center p-6 pb-12 bg-gradient-to-b from-[#0b0f19] via-[#1a2035] to-[#2b1f3d] text-white relative overflow-hidden ${profileClass}`}>
        {offline && (
          <div className="absolute top-0 inset-x-0 bg-amber-500 text-white py-2 px-4 text-center text-xs font-black select-none z-50 flex items-center justify-center gap-2 font-Outfit shadow-md shrink-0">
            <span>📶 Modo Offline Ativado</span>
            {offlineQueueSize > 0 && (
              <span className="bg-amber-700/60 px-2 py-0.5 rounded text-[10px]">
                {offlineQueueSize} {offlineQueueSize === 1 ? (locale === 'en' ? 'pending change' : locale === 'es' ? 'cambio pendiente' : 'alteração pendente') : (locale === 'en' ? 'pending changes' : locale === 'es' ? 'cambios pendientes' : 'alterações pendentes')}
              </span>
            )}
          </div>
        )}
        {/* Twinkling stars in the background */}
        {effectiveVisuals === 'rich' && (
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
        {effectiveVisuals === 'rich' && (
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
              className="flex items-center gap-1.5 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-xs font-black rounded-full border-2 border-slate-700 shadow-premium transition-all active:scale-95 cursor-pointer text-white"
            >
              🏠 {locale === 'en' ? 'Home' : locale === 'es' ? 'Inicio' : 'Início'}
            </button>
            
            {showStories && (
            <button
              onClick={() => { playBubble(); setShowStoriesModal(true); }}
              onMouseEnter={playBubble}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-950 hover:bg-indigo-900 border-2 border-indigo-800 text-indigo-100 text-xs font-black rounded-full shadow-premium transition-all active:scale-95 cursor-pointer"
            >
              📖 {locale === 'en' ? 'Stories' : locale === 'es' ? 'Historias' : 'Histórias'}
            </button>
            )}
            {showMyWorld && (
            <button
              onClick={() => { playBubble(); setShowHyperfocusModal(true); }}
              onMouseEnter={playBubble}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-yellow-950 hover:bg-yellow-900 border-2 border-yellow-800 text-yellow-100 text-xs font-black rounded-full shadow-premium transition-all active:scale-95 cursor-pointer"
            >
              🎮 Meu Mundo ({activeChild?.collectedParts || 0}/4)
            </button>
            )}
          </div>

          <h2 className="text-xs font-black bg-slate-800 border-2 border-slate-700 text-white px-5 py-2.5 rounded-full shadow-premium uppercase tracking-widest font-Outfit">
            {(t.common.dayLabels as any)[currentDay] || (locale === 'es' ? `Día ${currentDay} 📅` : locale === 'en' ? `Day ${currentDay} 📅` : `Dia ${currentDay} 📅`)}
          </h2>
          
          {/* Ambient Sound Selector */}
          {showAmbient ? (
          <div className="flex bg-slate-800 border-2 border-slate-700 p-1 rounded-full shadow-premium gap-1 items-center z-10">
            <button
              onClick={() => handleAmbientChange('none')}
              className={`px-3 py-1.5 rounded-full text-xs font-black transition-all ${
                activeAmbientType === 'none'
                  ? 'bg-slate-700 text-slate-100'
                  : 'bg-transparent text-slate-400 hover:text-slate-200'
              }`}
              title="Silencioso"
            >
              🔈
            </button>
            <button
              onClick={() => handleAmbientChange('rain')}
              className={`px-3 py-1.5 rounded-full text-xs font-black transition-all ${
                activeAmbientType === 'rain'
                  ? 'bg-blue-900 text-blue-100'
                  : 'bg-transparent text-slate-400 hover:text-blue-300'
              }`}
              title="Som de Chuva"
            >
              🌧️
            </button>
            <button
              onClick={() => handleAmbientChange('binaural')}
              className={`px-3 py-1.5 rounded-full text-xs font-black transition-all ${
                activeAmbientType === 'binaural'
                  ? 'bg-indigo-900 text-indigo-100'
                  : 'bg-transparent text-slate-400 hover:text-indigo-300'
              }`}
              title="Foco Binaural"
            >
              🧠
            </button>
          </div>
          ) : <div />}
        </div>

        <motion.div
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={transitionConfig}
          className="z-10 w-full max-w-lg md:max-w-4xl text-center flex flex-col items-center gap-6 px-4 md:px-6"
        >
          {/* Night indicator */}
          <span className="text-xs font-black uppercase tracking-wider text-indigo-100 bg-indigo-950/70 px-4.5 py-2 rounded-full border border-indigo-700/50 shadow-inner flex items-center gap-1.5">
            🌙 Previsibilidade de Fim de Dia
          </span>

          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-1 text-yellow-300">
            {locale === 'en' ? 'Missions Completed!' : locale === 'es' ? '¡Misiones Cumplidas!' : 'Missões Cumpridas!'}
          </h1>
          <p className="text-slate-50 text-sm max-w-xs leading-relaxed font-semibold">
            {locale === 'en' ? 'You completed all of today\'s activities. Time to rest!' : locale === 'es' ? 'Completaste todas las actividades de hoy. ¡Hora de descansar!' : 'Você completou todas as atividades de hoje. Hora de descansar!'}
          </p>

          {/* Sleeping Border Collie Cozy SVG Mascot */}
          <div className="relative cursor-pointer py-4" onClick={handleMascotClick}>
            {/* Glowing moon shadow background */}
            <div className="absolute w-36 h-36 bg-indigo-500/20 rounded-full filter blur-xl -z-10 animate-pulse"></div>
            <HyperfocusMascot hyperfocus={childHyperfocus} state="sleeping" size={240} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            {/* Badges Gallery Reward */}
            {uiCompleto && (
            <div className="w-full bg-slate-800/50 border border-slate-700/40 p-5 rounded-3xl flex flex-col gap-4 text-left shadow-2xl">
              <h4 className="font-extrabold text-white text-xs uppercase tracking-widest flex items-center gap-1.5 select-none">
                🏅 Medalhas conquistadas hoje:
              </h4>
              <div className="grid grid-cols-3 gap-3">
                {localizedBadges.map(badge => (
                  <motion.div 
                    key={badge.id}
                    whileHover={{ scale: 1.05 }}
                    className="bg-slate-700/40 border border-slate-600/30 p-3 rounded-2xl flex flex-col items-center text-center gap-1 shadow-md"
                  >
                    <span className="text-3xl animate-pulse select-none">{badge.icon}</span>
                    <h5 className="font-black text-white text-[10px] leading-tight mt-1">{badge.label}</h5>
                    <span className="text-[9px] text-slate-100 leading-tight mt-0.5">{badge.desc}</span>
                  </motion.div>
                ))}
              </div>
            </div>
            )}

            {/* TEACCH Choice Board (Painel de Escolhas Lúdicas) */}
            <div className="w-full bg-slate-800/50 border border-slate-700/40 p-5 rounded-3xl flex flex-col gap-4 text-left shadow-2xl">
              <h4 className="font-extrabold text-white text-xs uppercase tracking-widest flex items-center gap-1.5 select-none font-Outfit">
                {locale === 'en' ? '🪁 Playful Choices Board (What do you want to do now?):' : locale === 'es' ? '🪁 Panel de Elecciones Lúdicas (¿Qué quieres hacer ahora?):' : '🪁 Painel de Escolhas Lúdicas (O que quer fazer agora?):'}
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'draw', label: locale === 'en' ? 'Draw 🎨' : locale === 'es' ? 'Dibujar 🎨' : 'Desenhar 🎨', speech: locale === 'en' ? 'You chose to draw! Have fun with the colors!' : locale === 'es' ? '¡Elegiste dibujar! ¡Diviértete con los colores!' : 'Você escolheu desenhar! Divirta-se com as cores!', icon: '🎨' },
                  { id: 'read', label: locale === 'en' ? 'Read Book 📚' : locale === 'es' ? 'Leer Libro 📚' : 'Ler Livro 📚', speech: locale === 'en' ? 'You chose to read a book! A great story awaits you!' : locale === 'es' ? '¡Elegiste leer un libro! ¡Una gran historia te espera!' : 'Você escolheu ler um livro! Uma ótima história te espera!', icon: '📚' },
                  { id: 'blocks', label: locale === 'en' ? 'Build Blocks 🧱' : locale === 'es' ? 'Construir Bloques 🧱' : 'Montar Blocos 🧱', speech: locale === 'en' ? 'You chose to play with blocks! How about building a castle?' : locale === 'es' ? '¡Elegiste jugar con bloques! ¿Qué tal construir un castillo?' : 'Você escolheu brincar de blocos! Que tal construir um castelo?', icon: '🧱' },
                  { id: 'puzzle', label: locale === 'en' ? 'Puzzle 🧩' : locale === 'es' ? 'Rompecabezas 🧩' : 'Quebra-cabeça 🧩', speech: locale === 'en' ? 'You chose to play puzzle! Let\'s fit the pieces together!' : locale === 'es' ? '¡Elegiste jugar rompecabezas! ¡Vamos a encajar las piezas!' : 'Você escolheu jogar quebra-cabeça! Vamos encaixar as peças!', icon: '🧩' },
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
                          : 'bg-slate-700/30 border-slate-600/30 text-slate-50 hover:bg-slate-700/50 hover:text-white'
                      }`}
                    >
                      <span className="text-4.5xl select-none">{choice.icon}</span>
                      <span className="font-black text-xs tracking-tight font-Outfit mt-1 text-inherit">{choice.label}</span>
                    </motion.button>
                  );
                })}
              </div>
              {selectedChoice && (
                <p className="text-[10px] text-center text-indigo-100 font-extrabold animate-pulse uppercase tracking-wider">
                  Boa escolha! Aproveite seu momento de descanso!
                </p>
              )}
            </div>
          </div>

          <div className="w-full bg-slate-800/40 backdrop-blur-md border border-slate-700/40 p-5 rounded-3xl shadow-xl flex flex-col gap-4 text-left">
            <h3 className="font-extrabold text-white text-xs flex items-center gap-2">
              ⭐ {t.routine.badgesTitle} ({completedTasks.length}/{todayTasks.length})
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
            className="mt-2 text-sm text-indigo-100 hover:text-white font-bold underline cursor-pointer bg-transparent border-none outline-none transition-all active:scale-95"
          >
            {t.common.back} {locale === 'en' ? 'to Home' : locale === 'es' ? 'al Inicio' : 'ao Início'} 🏠
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
                      <h3 className="text-xl font-black text-slate-850 mt-2 font-Outfit">{t.routine.socialStoriesTitle} do Mascote</h3>
                      <p className="text-xs text-slate-400 font-semibold mt-1">
                        {t.routine.storySelectionPrompt}
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto pr-1 scrollbar-thin">
                      {localizedSocialStories.map(story => (
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

                      {(() => {
                        if (activeChild?.customStories) {
                          try {
                            const parsed = JSON.parse(activeChild.customStories);
                            if (Array.isArray(parsed) && parsed.length > 0) {
                              return (
                                <>
                                  <div className="text-[10px] font-black uppercase tracking-wider text-rose-500 font-Outfit mt-4 mb-1">
                                    {t.routine.storyCreatedByParents} 💖
                                  </div>
                                  {parsed.map(story => (
                                    <button
                                      key={story.id}
                                      onClick={() => {
                                        playBubble();
                                        setSelectedStory(story);
                                        setCurrentStoryStep(0);
                                        speakText(story.steps[0].text.replace('[Mascote]', childHyperfocus.split(' ')[0]));
                                      }}
                                      className="p-4 bg-slate-50 hover:bg-rose-50/40 hover:border-rose-300 border-2 border-slate-200/80 rounded-2xl transition-all active:scale-98 text-left cursor-pointer flex items-center gap-4 group"
                                    >
                                      <div className="w-12 h-12 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center text-2xl shadow-xxs shrink-0 group-hover:scale-105 transition-all">
                                        {story.steps[0]?.img || '📖'}
                                      </div>
                                      <div>
                                        <h4 className="font-extrabold text-sm text-slate-850 font-Outfit group-hover:text-rose-750 transition-all">{story.title}</h4>
                                        <p className="text-[10px] text-slate-500 font-semibold mt-0.5 leading-normal">{story.desc}</p>
                                      </div>
                                    </button>
                                  ))}
                                </>
                              );
                            }
                          } catch (e) {}
                        }
                        return null;
                      })()}
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
                        {locale === 'en' ? 'Step' : locale === 'es' ? 'Paso' : 'Etapa'} {currentStoryStep + 1} {locale === 'en' ? 'of' : locale === 'es' ? 'de' : 'de'} {selectedStory.steps.length}
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
                          {locale === 'en' ? 'Next ➡️' : locale === 'es' ? 'Siguiente ➡️' : 'Próximo ➡️'}
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

  // FIRST-THEN EMERGENCY BOARD
  if (activeChild && activeChild.emergencyFirstThen) {
    const profileClass = effectiveProfile === 'hypersensitive'
      ? 'saturate-[65%] brightness-[92%] contrast-[88%]'
      : effectiveProfile === 'hyposensitive'
      ? 'saturate-[120%] contrast-[108%]'
      : '';

    const firstTask = activeTask;
    const thenTask = nextTasks[0]; // next task in line

    return (
      <main className={`min-h-screen bg-gradient-to-tr from-[#0b0f19] to-[#1e1b4b] p-6 pb-12 flex flex-col items-center justify-between text-white relative overflow-hidden ${profileClass} font-Outfit select-none`}>
        {offline && (
          <div className="absolute top-0 inset-x-0 bg-amber-500 text-white py-2 px-4 text-center text-xs font-black select-none z-50 flex items-center justify-center gap-2 font-Outfit shadow-md shrink-0">
            <span>📶 Modo Offline Ativado</span>
          </div>
        )}

        {/* Top bar with minimal battery & parent exit */}
        <div className="w-full max-w-4xl flex justify-between items-center z-10">
          <div className="flex items-center gap-2 bg-slate-900/60 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-slate-700/50">
            <span className="text-xs">🔋</span>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">
              Energia: {activeChild.emotionalBattery === 'green' ? '100% 🟢' : activeChild.emotionalBattery === 'yellow' ? '50% 🟡' : '10% 🔴'}
            </span>
          </div>
          
          <button
            onClick={() => handleAttemptExit('/dashboard')}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-black rounded-lg border border-slate-600 active:scale-95 transition-all cursor-pointer uppercase tracking-wider"
          >
            🔒 Sair
          </button>
        </div>

        {/* Main Board Grid */}
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-6 my-auto z-10">
          {/* FIRST BOARD */}
          <div className="bg-slate-900/80 border-4 border-indigo-500 rounded-[40px] p-8 shadow-2xl flex flex-col justify-between items-center min-h-[380px] relative overflow-hidden text-center">
            <div className="absolute top-3 left-6 text-xxs font-black text-indigo-400 uppercase tracking-widest">PRIMEIRO</div>
            
            {firstTask ? (
              <>
                <div className="text-7xl mt-6">
                  {firstTask.customIcon ? (
                    <img src={firstTask.customIcon} className="w-24 h-24 object-contain rounded-2xl" alt="" />
                  ) : (
                    <span>{firstTask.icon || '📅'}</span>
                  )}
                </div>
                <div className="mt-4 flex flex-col gap-1">
                  <h2 className="text-2xl font-black text-white">{firstTask.title}</h2>
                  <span className="text-xs font-extrabold text-indigo-300 uppercase tracking-wider">{firstTask.time} • {firstTask.duration || 30} min</span>
                </div>
                
                {/* Completion Area */}
                <motion.button
                  whileHover={{ scale: 1.08, rotate: 1 }}
                  whileTap={{ scale: 0.90, rotate: -1 }}
                  onClick={() => handleCompleteTask(firstTask)}
                  disabled={!!celebratingTaskId}
                  className={`mt-6 w-20 h-20 rounded-full flex items-center justify-center border-4 cursor-pointer shadow-lg transition-colors duration-300 ${
                    celebratingTaskId === firstTask.id
                      ? 'bg-emerald-500 border-white text-white animate-ping'
                      : 'bg-indigo-650 hover:bg-indigo-700 border-indigo-400 text-white'
                  }`}
                  title="Concluir tarefa"
                >
                  <Check className="w-10 h-10 stroke-[3.5]" />
                </motion.button>
              </>
            ) : (
              <div className="my-auto flex flex-col items-center gap-3">
                <span className="text-6xl">🎉</span>
                <h2 className="text-xl font-black text-white">{locale === 'en' ? 'All missions completed!' : locale === 'es' ? '¡Todas las misiones cumplidas!' : 'Todas as missões cumpridas!'}</h2>
              </div>
            )}
          </div>

          {/* THEN BOARD */}
          <div className="bg-slate-900/80 border-4 border-slate-700 rounded-[40px] p-8 shadow-2xl flex flex-col justify-between items-center min-h-[380px] relative overflow-hidden text-center opacity-90">
            <div className="absolute top-3 left-6 text-xxs font-black text-slate-400 uppercase tracking-widest">DEPOIS</div>
            
            {firstTask && thenTask ? (
              <>
                <div className="text-7xl mt-8">
                  {thenTask.customIcon ? (
                    <img src={thenTask.customIcon} className="w-24 h-24 object-contain rounded-2xl" alt="" />
                  ) : (
                    <span>{thenTask.icon || '📅'}</span>
                  )}
                </div>
                <div className="mt-4 flex flex-col gap-1 my-auto">
                  <h2 className="text-xl font-black text-slate-300">{thenTask.title}</h2>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{thenTask.time} • {thenTask.duration || 30} min</span>
                </div>
                <div className="w-12 h-12 bg-slate-800 border-2 border-slate-650 rounded-full flex items-center justify-center text-slate-550 mb-4">
                  🔒
                </div>
              </>
            ) : firstTask && activeChild.rewardName ? (
              <>
                <div className="text-7xl mt-8">🏆</div>
                <div className="mt-4 flex flex-col gap-1 my-auto">
                  <h2 className="text-xl font-black text-yellow-300">{activeChild.rewardName}</h2>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{locale === 'en' ? 'Your reward / reinforcer' : locale === 'es' ? 'Tu premio / reforzador' : 'Seu prêmio / reforçador'}</span>
                </div>
                <div className="w-12 h-12 bg-yellow-500/10 border-2 border-yellow-500 text-yellow-500 rounded-full flex items-center justify-center font-black mb-4 animate-pulse">
                  🪙
                </div>
              </>
            ) : (
              <div className="my-auto flex flex-col items-center gap-3">
                <span className="text-6xl">😴</span>
                <h2 className="text-xl font-black text-slate-200">Hora de descansar!</h2>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Mascot co-regulation widget */}
        <div className="w-full max-w-4xl flex items-center gap-4 bg-slate-900/60 border border-slate-800 p-4 rounded-3xl z-10 text-left shrink-0">
          <div className="w-14 h-14 bg-indigo-950 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
            <HyperfocusMascot hyperfocus={childHyperfocus} state={collieState} size={55} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-indigo-400 font-Outfit tracking-wide">Foco e Calmaria</p>
            <p className="text-[10.5px] text-slate-300 font-semibold leading-normal mt-0.5">
              {firstTask 
                ? `Vamos fazer primeiro "${firstTask.title}". Concentre-se em concluir apenas esta tarefa!` 
                : locale === 'en' ? 'All tasks were completed. Well done! You were excellent!' : locale === 'es' ? 'Todas las tareas fueron completadas. ¡Muy bien! ¡Fuiste excelente!' : 'Todas as tarefas foram concluídas. Muito bem! Você foi excelente!'}
            </p>
          </div>
        </div>
      </main>
    );
  }

  const profileClass = effectiveProfile === 'hypersensitive'
    ? 'saturate-[65%] brightness-[92%] contrast-[88%]'
    : effectiveProfile === 'hyposensitive'
    ? 'saturate-[120%] contrast-[108%]'
    : '';

  return (
    <main className={`min-h-screen transition-colors duration-500 pt-0 px-0 pb-12 flex flex-col items-center relative overflow-hidden ${
      sleepMode 
        ? 'bg-[#040815] text-amber-100/90' 
        : 'bg-slate-50 text-[#0f172a]'
    } ${profileClass}`}>
      {offline && (
        <div className="absolute top-0 inset-x-0 bg-amber-500 text-white py-2 px-4 text-center text-xs font-black select-none z-50 flex items-center justify-center gap-2 font-Outfit shadow-md shrink-0">
          <span>📶 Modo Offline Ativado</span>
          {offlineQueueSize > 0 && (
            <span className="bg-amber-700/60 px-2 py-0.5 rounded text-[10px]">
              {offlineQueueSize} {offlineQueueSize === 1 ? (locale === 'en' ? 'pending change' : locale === 'es' ? 'cambio pendiente' : 'alteração pendente') : (locale === 'en' ? 'pending changes' : locale === 'es' ? 'cambios pendientes' : 'alterações pendentes')}
            </span>
          )}
        </div>
      )}

      {/* Emotional Battery Warning Banner */}
      {!sleepMode && activeChild?.emotionalBattery && activeChild.emotionalBattery !== 'green' && (
        <div className={`w-full py-2.5 px-4 text-center text-xs font-black select-none z-40 flex items-center justify-center gap-2 font-Outfit shadow-sm shrink-0 border-b relative ${
          activeChild.emotionalBattery === 'red' 
            ? 'bg-red-500 text-white border-red-650' 
            : 'bg-yellow-450 text-slate-950 border-yellow-500'
        }`}>
          {activeChild.emotionalBattery === 'red' ? (
            <>
              <span>🚨 Alerta de Sobrecarga! Vamos respirar fundo ou ir para um lugar calmo?</span>
              <button 
                onClick={handleTriggerSos} 
                className="bg-white text-red-700 px-2.5 py-1 rounded-full text-[10px] uppercase font-black tracking-wide ml-2 hover:bg-red-50 active:scale-95 cursor-pointer transition-all shadow-sm border-none font-Outfit"
              >
                Ativar SOS 🚨
              </button>
            </>
          ) : (
            <>
              <span>{locale === 'en' ? `Feeling tired? It's okay, ${activeChild.name.split(' ')[0]} can watch a story with you! 📖` : locale === 'es' ? `¿Te sientes cansado? ¡No pasa nada, ${activeChild.name.split(' ')[0]} puede ver una historia contigo! 📖` : `⚡ Sentindo cansaço? Tudo bem, o ${activeChild.name.split(' ')[0]} pode ver uma historinha com você! 📖`}</span>
              {showStories && (
              <button
                onClick={() => { playBubble(); setShowStoriesModal(true); }}
                className="bg-slate-950 text-yellow-400 px-2.5 py-1 rounded-full text-[10px] uppercase font-black tracking-wide ml-2 hover:bg-slate-900 active:scale-95 cursor-pointer transition-all shadow-sm border-none font-Outfit"
              >
                {locale === 'en' ? 'Watch Stories 📖' : locale === 'es' ? 'Ver Historias 📖' : 'Ver Histórias 📖'}
              </button>
              )}
            </>
          )}
        </div>
      )}
      {/* Background Soft Glows */}
      {effectiveVisuals === 'rich' && (
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
              <div className="absolute top-[22%] left-[-18%] w-80 h-80 bg-indigo-100/40 rounded-full filter blur-3xl opacity-40"></div>
              <div className="absolute bottom-[22%] right-[-18%] w-96 h-96 bg-indigo-100/30 rounded-full filter blur-3xl opacity-30"></div>
            </>
          )}
        </div>
      )}

      {/* Sticky Top Navigation Header */}
      <div className={`sticky top-0 w-full z-40 transition-all border-b shadow-sm backdrop-blur-md select-none py-3 mb-8 ${
        sleepMode 
          ? 'bg-slate-950/85 border-slate-800/60 text-amber-205 shadow-slate-950/50' 
          : 'bg-white/85 border-slate-200/50 text-slate-800 shadow-slate-105/45'
      }`}>
        <div className="w-full max-w-2xl md:max-w-5xl mx-auto flex items-center justify-between gap-3 px-4 md:px-6">
          {/* Sair (desafio de adulto) */}
          <button
            onClick={() => handleAttemptExit('/')}
            onMouseEnter={playBubble}
            className={`flex items-center gap-1.5 px-3.5 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-black rounded-full border shadow-sm transition-all active:scale-95 cursor-pointer shrink-0 whitespace-nowrap ${
              sleepMode
                ? 'bg-slate-905 border-slate-700 text-amber-200 hover:bg-slate-805'
                : 'bg-white hover:bg-slate-50 border-slate-350 text-slate-805'
            }`}
          >
            🔒 <span className="hidden sm:inline">{locale === 'en' ? 'Exit' : locale === 'es' ? 'Salir' : 'Sair'}</span>
          </button>

          {/* Identidade: nome + dia (contexto calmo, centralizado) */}
          <div className="flex-1 flex flex-col items-center leading-tight min-w-0 px-2 text-center">
            <span className="font-black font-Outfit text-sm sm:text-lg truncate max-w-[42vw]">
              {activeChild?.name ? activeChild.name.split(' ')[0] : ''}
            </span>
            <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wide ${sleepMode ? 'text-amber-200/70' : 'text-slate-500'}`}>
              {(t.common.dayLabels as any)[currentDay] || (locale === 'es' ? `Día ${currentDay}` : locale === 'en' ? `Day ${currentDay}` : `Dia ${currentDay}`)}
            </span>
          </div>

          {/* Essenciais + menu consolidado */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Minha Voz (CAA) — comunicação é necessidade básica */}
            <button
              onClick={() => { playBubble(); setShowAacModal(true); }}
              onMouseEnter={playBubble}
              aria-label={locale === 'en' ? 'My Voice' : locale === 'es' ? 'Mi Voz' : 'Minha Voz'}
              className={`flex items-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2.5 border text-sm font-black rounded-full shadow-sm transition-all active:scale-95 cursor-pointer shrink-0 ${
                sleepMode
                  ? 'bg-sky-950/20 border-sky-900/50 text-sky-300 hover:bg-sky-950/55'
                  : 'bg-white hover:bg-sky-50 border-sky-250 text-sky-700'
              }`}
            >
              🗣️ <span className="hidden md:inline">Voz</span>
            </button>

            {/* Modo Calmo */}
            <button
              onClick={() => {
                playBubble();
                const nextVal = !localCalmMode;
                setLocalCalmMode(nextVal);
                localStorage.setItem('localCalmMode', nextVal ? 'true' : 'false');
                if (nextVal) { speakText(t.routine.calmModeActivated); } else { speakText(t.routine.calmModeDeactivated); }
              }}
              onMouseEnter={playBubble}
              aria-label={locale === 'en' ? 'Calm mode' : locale === 'es' ? 'Modo calma' : 'Modo calmo'}
              className={`flex items-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2.5 border text-sm font-black rounded-full shadow-sm transition-all active:scale-95 cursor-pointer font-Outfit shrink-0 ${
                localCalmMode
                  ? 'bg-teal-500 border-teal-605 text-white'
                  : sleepMode
                  ? 'bg-slate-905 border-slate-700 text-amber-200 hover:bg-slate-800'
                  : 'bg-white hover:bg-teal-50 border-teal-200 text-teal-700'
              }`}
            >
              🧘 <span className="hidden md:inline">Calmo</span>
            </button>

            {/* SOS — sempre acessível */}
            <button
              onClick={handleTriggerSos}
              onMouseEnter={playBubble}
              aria-label="SOS"
              className={`flex items-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2.5 border text-sm font-black rounded-full shadow-sm transition-all active:scale-95 cursor-pointer shrink-0 ${
                sleepMode
                  ? 'bg-red-950/20 border-red-900/50 text-red-300 hover:bg-red-950/50'
                  : 'bg-red-50 hover:bg-red-100 border-red-250 text-red-650 font-Outfit'
              }`}
            >
              🚨 <span className="hidden md:inline">SOS</span>
            </button>

            {/* ⋯ Mais — menu consolidado (secundários) */}
            <div className="relative">
              <button
                onClick={() => { playBubble(); setShowSupportMenu(!showSupportMenu); }}
                onMouseEnter={playBubble}
                aria-label={locale === 'en' ? 'More' : locale === 'es' ? 'Más' : 'Mais'}
                className={`flex items-center gap-1 px-3 py-2 sm:px-3.5 sm:py-2.5 border text-sm font-black rounded-full shadow-sm transition-all active:scale-95 cursor-pointer shrink-0 ${
                  sleepMode
                    ? 'bg-amber-950/20 border-amber-900/50 text-amber-300 hover:bg-amber-950/55'
                    : 'bg-white hover:bg-indigo-50 border-indigo-250 text-indigo-700'
                }`}
              >
                <span className="text-lg leading-none -mt-1">⋯</span>
                <span className="hidden md:inline">{locale === 'en' ? 'More' : locale === 'es' ? 'Más' : 'Mais'}</span>
              </button>

              {showSupportMenu && (
                <div
                  className={`absolute right-0 mt-2 p-2 rounded-2xl border shadow-2xl flex flex-col gap-0.5 min-w-[240px] max-h-[72vh] overflow-y-auto z-50 ${
                    sleepMode
                      ? 'bg-[#090d1a] border-amber-900/50 text-amber-200'
                      : 'bg-white border-slate-200 text-slate-800'
                  }`}
                >
                  {/* Responsável */}
                  <span className={`px-3 pt-1.5 pb-1 text-[9px] font-black uppercase tracking-wider ${sleepMode ? 'text-amber-200/50' : 'text-slate-400'}`}>
                    {locale === 'en' ? 'Guardian' : locale === 'es' ? 'Tutor' : 'Responsável'}
                  </span>
                  <button
                    onClick={() => { playBubble(); setShowSupportMenu(false); handleAttemptExit('/dashboard'); }}
                    className={`flex items-center gap-2 w-full px-4 py-2 text-left text-xs font-bold rounded-xl transition-colors border-none bg-transparent cursor-pointer ${sleepMode ? 'hover:bg-slate-850 text-amber-205' : 'hover:bg-slate-50 text-slate-705'}`}
                  >
                    🔒 {locale === 'en' ? 'Guardian Panel' : locale === 'es' ? 'Panel del Tutor' : 'Painel do Responsável'}
                  </button>

                  {/* Como está se sentindo (humor) */}
                  {!sleepMode && (
                    <>
                      <span className={`px-3 pt-2 pb-1 text-[9px] font-black uppercase tracking-wider ${sleepMode ? 'text-amber-200/50' : 'text-slate-400'}`}>
                        {locale === 'en' ? 'How I feel' : locale === 'es' ? 'Cómo me siento' : 'Como me sinto'}
                      </span>
                      <div className="flex gap-1.5 px-2 pb-1">
                        <button
                          onClick={() => { playBubble(); handleUpdateBattery('green'); setShowSupportMenu(false); }}
                          className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl text-[10px] font-black border transition-all cursor-pointer ${activeChild?.emotionalBattery === 'green' ? 'bg-emerald-50 border-emerald-250 text-emerald-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                        >
                          <span className="text-lg">🔋</span>{locale === 'es' ? 'Bien' : locale === 'en' ? 'Great' : 'Ótimo'}
                        </button>
                        <button
                          onClick={() => { playBubble(); handleUpdateBattery('yellow'); setShowSupportMenu(false); }}
                          className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl text-[10px] font-black border transition-all cursor-pointer ${activeChild?.emotionalBattery === 'yellow' ? 'bg-yellow-50 border-yellow-250 text-yellow-755' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                        >
                          <span className="text-lg">⚡</span>{locale === 'es' ? 'Cansado' : locale === 'en' ? 'Tired' : 'Cansado'}
                        </button>
                        <button
                          onClick={() => { playBubble(); handleUpdateBattery('red'); setShowSupportMenu(false); }}
                          className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl text-[10px] font-black border transition-all cursor-pointer ${activeChild?.emotionalBattery === 'red' ? 'bg-red-50 border-red-255 text-red-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                        >
                          <span className="text-lg">🪫</span>{locale === 'es' ? 'Mucho' : locale === 'en' ? 'A lot' : 'Demais'}
                        </button>
                      </div>
                    </>
                  )}

                  {/* Apoios (gated por interfaceMode) */}
                  {hasSupportMenu && (
                    <>
                      <span className={`px-3 pt-2 pb-1 text-[9px] font-black uppercase tracking-wider ${sleepMode ? 'text-amber-200/50' : 'text-slate-400'}`}>
                        {locale === 'en' ? 'Supports' : locale === 'es' ? 'Apoyos' : 'Apoios'}
                      </span>
                      {showStories && (
                      <button
                        onClick={() => { playBubble(); setShowStoriesModal(true); setShowSupportMenu(false); }}
                        className={`flex items-center gap-2 w-full px-4 py-2 text-left text-xs font-bold rounded-xl transition-colors border-none bg-transparent cursor-pointer ${sleepMode ? 'hover:bg-slate-850 text-amber-205' : 'hover:bg-slate-50 text-slate-705'}`}
                      >
                        📖 {locale === 'en' ? 'Stories' : locale === 'es' ? 'Historias' : 'Histórias'}
                      </button>
                      )}
                      {!sleepMode && showMyWorld && (
                      <button
                        onClick={() => { playBubble(); setShowHyperfocusModal(true); setShowSupportMenu(false); }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-left text-xs font-bold rounded-xl transition-colors border-none bg-transparent cursor-pointer hover:bg-slate-50 text-slate-705"
                      >
                        🎮 Meu Mundo ({activeChild?.collectedParts || 0}/4)
                      </button>
                      )}
                      {!sleepMode && showShop && (
                      <button
                        onClick={() => { playBubble(); setShowShopModal(true); setShowSupportMenu(false); }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-left text-xs font-bold rounded-xl transition-colors border-none bg-transparent cursor-pointer hover:bg-slate-50 text-slate-705"
                      >
                        🛒 {locale === 'en' ? 'Mascot Shop' : locale === 'es' ? 'Tienda del Mascota' : 'Loja do Mascote'}
                      </button>
                      )}
                      {!sleepMode && showNoiseMonitor && (
                      <button
                        onClick={() => {
                          playBubble();
                          const nextVal = !bgNoiseMonitor;
                          setBgNoiseMonitor(nextVal);
                          setShowSupportMenu(false);
                          if (nextVal) { speakText(t.routine.noiseMonitorActivated); } else { speakText(t.routine.noiseMonitorDeactivated); }
                        }}
                        className={`flex items-center gap-2 w-full px-4 py-2 text-left text-xs font-bold rounded-xl transition-colors border-none bg-transparent cursor-pointer hover:bg-slate-50 ${bgNoiseMonitor ? 'text-teal-650 font-extrabold' : 'text-slate-705'}`}
                      >
                        🎤 {bgNoiseMonitor ? (locale === 'en' ? 'Disable Monitor' : locale === 'es' ? 'Desactivar Monitor' : 'Desativar Monitor') : (locale === 'en' ? 'Noise Monitor' : locale === 'es' ? 'Monitor de Ruidos' : 'Monitor de Ruídos')}
                      </button>
                      )}
                      {!sleepMode && showSimulator && (
                      <button
                        onClick={() => { playBubble(); setShowSimulatorModal(true); setSelectedScenario(null); setSimulatorStep(0); setSimulatorFinished(false); setShowSupportMenu(false); }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-left text-xs font-bold rounded-xl transition-colors border-none bg-transparent cursor-pointer font-Outfit hover:bg-slate-50 text-slate-705"
                      >
                        🎮 {locale === 'en' ? 'Simulator' : locale === 'es' ? 'Simulador' : 'Simulador'}
                      </button>
                      )}
                      {!sleepMode && showHourglass && (
                      <button
                        onClick={() => { playBubble(); setShowWaitTimer(!showWaitTimer); setShowSupportMenu(false); }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-left text-xs font-bold rounded-xl transition-colors border-none bg-transparent cursor-pointer font-Outfit hover:bg-slate-50 text-slate-705"
                      >
                        ⏳ {locale === 'en' ? 'Waiting Hourglass' : locale === 'es' ? 'Reloj de Espera' : 'Ampulheta de Espera'}
                      </button>
                      )}
                    </>
                  )}

                  {/* Ambiente: modo sono + sons */}
                  {(showSleepMode || (showAmbient && !sleepMode)) && (
                    <span className={`px-3 pt-2 pb-1 text-[9px] font-black uppercase tracking-wider ${sleepMode ? 'text-amber-200/50' : 'text-slate-400'}`}>
                      {locale === 'en' ? 'Environment' : locale === 'es' ? 'Ambiente' : 'Ambiente'}
                    </span>
                  )}
                  {showSleepMode && (
                  <button
                    onClick={() => {
                      playBubble();
                      setSleepMode(!sleepMode);
                      if (!sleepMode) { speakText(t.routine.sleepModeActivated); } else { speakText(t.routine.sleepModeDeactivated); }
                      setShowSupportMenu(false);
                    }}
                    className={`flex items-center gap-2 w-full px-4 py-2 text-left text-xs font-bold rounded-xl transition-colors border-none bg-transparent cursor-pointer ${sleepMode ? 'hover:bg-slate-850 text-amber-205' : 'hover:bg-slate-50 text-slate-705'}`}
                  >
                    🌙 {sleepMode ? (locale === 'en' ? 'Normal Mode' : locale === 'es' ? 'Modo Normal' : 'Modo Normal') : (locale === 'en' ? 'Sleep Mode' : locale === 'es' ? 'Modo Sueño' : 'Modo Sono')}
                  </button>
                  )}
                  {showAmbient && !sleepMode && [
                    { type: 'none', label: locale === 'es' ? '🔈 Silencioso' : locale === 'en' ? '🔈 Silent' : '🔈 Silencioso' },
                    { type: 'rain', label: locale === 'es' ? '🌧️ Lluvia' : locale === 'en' ? '🌧️ Rain' : '🌧️ Chuva' },
                    { type: 'white', label: locale === 'es' ? '🤍 Ruido Blanco' : locale === 'en' ? '🤍 White Noise' : '🤍 Ruído Branco' },
                    { type: 'pink', label: locale === 'es' ? '💗 Ruido Rosa' : locale === 'en' ? '💗 Pink Noise' : '💗 Ruído Rosa' },
                    { type: 'binaural', label: locale === 'es' ? '🧠 Foco Binaural' : locale === 'en' ? '🧠 Binaural Focus' : '🧠 Foco Binaural' }
                  ].map(btn => (
                    <button
                      key={btn.type}
                      onClick={() => { playBubble(); handleAmbientChange(btn.type as any); setShowSupportMenu(false); }}
                      className={`flex items-center gap-2 w-full px-4 py-2 text-left text-xs font-bold rounded-xl transition-colors border-none cursor-pointer ${activeAmbientType === btn.type ? 'bg-blue-50 text-blue-805' : 'bg-transparent hover:bg-slate-50 text-slate-705'}`}
                    >
                      {btn.label}
                    </button>
                  ))}

                  {/* Idioma */}
                  <span className={`px-3 pt-2 pb-1 text-[9px] font-black uppercase tracking-wider ${sleepMode ? 'text-amber-200/50' : 'text-slate-400'}`}>
                    {locale === 'en' ? 'Language' : locale === 'es' ? 'Idioma' : 'Idioma'}
                  </span>
                  <div className="px-3 pb-1">
                    <LanguageSelector />
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      <div className="w-full max-w-2xl md:max-w-5xl flex flex-col md:grid md:grid-cols-12 gap-6 z-10 px-4 md:px-6">
        
        {/* Token Economy Stars Row */}
        {activeChild && !sleepMode && showTokensHeader && (
          <div className="bg-white border border-slate-200 p-4 rounded-[20px] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 w-full md:col-span-12 order-last">
            <div className="flex items-center gap-2">
              <span className="text-xl">🪙</span>
              <div>
                <h4 className="font-extrabold text-xs text-slate-900 leading-tight text-left font-Outfit">{locale === 'en' ? 'Positive Reinforcement Stars' : locale === 'es' ? 'Estrellas del Refuerzo Positivo' : 'Estrelas do Reforço Positivo'}</h4>
                <p className="text-[10px] text-slate-705 font-semibold mt-0.5 text-left">
                  {locale === 'en' ? 'Earn ' : locale === 'es' ? 'Gana ' : 'Ganhe '}{activeChild.rewardCost || 10}{locale === 'en' ? ' stars for: ' : locale === 'es' ? ' estrellas para: ' : ' estrelas para: '}<strong className="text-indigo-700 font-black">{activeChild.rewardName || (locale === 'en' ? 'Reward' : locale === 'es' ? 'Premio' : 'Prêmio')}</strong>
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
                    <p className="text-xs text-amber-400 font-semibold mt-0.5">{t.routine.bedtimeStoriesDesc}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    playBubble();
                    setSelectedStory(localizedBedtimeStories[0]);
                    setCurrentStoryStep(0);
                    speakText(localizedBedtimeStories[0].steps[0].text.replace('[Mascote]', childHyperfocus.split(' ')[0]));
                    setShowStoriesModal(true);
                  }}
                  className="px-5 py-2.5 bg-amber-950/80 hover:bg-amber-900 border border-amber-700/60 text-amber-200 text-xs font-black rounded-2xl active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  📖 {locale === 'en' ? 'Read Bedtime Story' : locale === 'es' ? 'Leer Historia de Cuna' : 'Ler História de Ninar'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#121827] border border-amber-950/50 p-5 rounded-2xl flex flex-col gap-4">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-500 font-Outfit font-extrabold">📻 {locale === 'en' ? 'Relaxing Noise Player' : locale === 'es' ? 'Reproductor de Ruidos Relajantes' : 'Reprodutor de Ruídos Relaxantes'}</span>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { type: 'none', label: locale === 'en' ? 'Silent 🔈' : locale === 'es' ? 'Silencioso 🔈' : 'Silencioso 🔈', activeColor: 'bg-slate-800 text-slate-100 border-slate-700' },
                      { type: 'rain', label: locale === 'en' ? 'Rain 🌧️' : locale === 'es' ? 'Lluvia 🌧️' : 'Chuva 🌧️', activeColor: 'bg-blue-950 text-blue-300 border-blue-800' },
                      { type: 'white', label: locale === 'en' ? 'White Noise 🤍' : locale === 'es' ? 'Ruido Blanco 🤍' : 'Ruído Branco 🤍', activeColor: 'bg-slate-800 text-slate-100 border-slate-650' },
                      { type: 'pink', label: locale === 'en' ? 'Pink Noise 💗' : locale === 'es' ? 'Ruido Rosa 💗' : 'Ruído Rosa 💗', activeColor: 'bg-pink-950 text-pink-305 border-pink-900' },
                      { type: 'binaural', label: locale === 'en' ? 'Binaural Focus 🧠' : locale === 'es' ? 'Enfoque Binaural 🧠' : 'Foco Binaural 🧠', activeColor: 'bg-indigo-950 text-indigo-305 border-indigo-900' }
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
                    💡 {locale === 'en' ? 'White and pink noise help mask sudden external noises that could startle the child.' : locale === 'es' ? 'Los ruidos blanco y rosa ayudan a enmascarar ruidos externos repentinos que pueden asustar al niño.' : 'Os ruídos branco e rosa ajudam a mascarar barulhos externos repentinos que podem assustar a criança.'}
                  </p>
                </div>

                <div className="bg-[#121827] border border-amber-950/50 p-5 rounded-2xl flex flex-col gap-4">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-500 font-Outfit font-extrabold">🛌 {t.routine.bedtimeStoriesTitle}</span>
                  
                  <div className="flex flex-col gap-2.5 max-h-[180px] overflow-y-auto pr-1">
                    {localizedBedtimeStories.map(story => (
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
              {t.routine.emptyRoutine}
            </p>
          </motion.div>
        ) : (
          <>
            {/* "Agora" section label */}
            {activeTask && (
              <div className="md:col-span-12 w-full flex items-center gap-3 -mb-1 order-first">
                <span className={`text-xs font-black uppercase tracking-widest font-Outfit ${sleepMode ? 'text-amber-200/80' : 'text-slate-500'}`}>
                  {locale === 'en' ? 'Now' : locale === 'es' ? 'Ahora' : 'Agora'}
                </span>
                <span className={`flex-1 h-px ${sleepMode ? 'bg-amber-900/40' : 'bg-slate-200'}`}></span>
              </div>
            )}

            {/* 1. MAIN CURRENT MISSION CARD */}
            <AnimatePresence mode="wait">
              {activeTask && (() => {
                return (
                  <motion.div
                    key={activeTask.id}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={transitionConfig}
                    className={`bg-white border border-slate-200 rounded-2xl px-6 py-12 md:py-16 flex flex-col items-center justify-center text-center gap-7 relative transition-all md:col-span-${showWaitTimer ? '8' : '12'}`}
                  >
                    {/* Task illustration */}
                    <div className="flex flex-col items-center gap-6 w-full">
                      <div className="flex flex-col items-center gap-2">
                      <div className="relative">
                        <RoutineIllustration category={activeTask.title} size={120} hyperfocus={childHyperfocus} />
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
                      
                    </div>

                    <div className="flex flex-col items-center gap-3 w-full">
                      <h1 
                        onClick={() => { playBubble(); speakText(activeTask.title); }}
                        className="text-3.5xl md:text-4.5xl font-black tracking-tight text-slate-950 max-w-md break-words px-2 cursor-pointer hover:text-indigo-700 transition-all select-none hover:scale-[1.01] font-Outfit"
                        title="Clique para ouvir"
                      >
                        {activeTask.title}
                      </h1>
                      
                      <span className="text-sm text-slate-500 font-semibold flex items-center gap-2 justify-center">
                        <Clock className="w-4 h-4 text-slate-400" /> {activeTask.time}{activeTask.duration ? ` · ${activeTask.duration} min` : ''}
                      </span>

                      {activeTask.description && (
                        <div 
                          onClick={() => { playBubble(); speakText(activeTask.description || ''); }}
                          className="mt-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl max-w-md select-none hover:bg-slate-100/50 transition-all cursor-pointer shadow-xxs"
                          title={locale === 'en' ? 'Click to hear the instructions' : locale === 'es' ? 'Haga clic para escuchar las instrucciones' : 'Clique para ouvir as instruções'}
                        >
                          <p className="text-xs font-bold text-slate-550 leading-relaxed font-Outfit">
                            💡 {activeTask.description}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Visual timer — kept subtle (predictability), no chrome */}
                    <div className="w-full flex items-center justify-center pt-1">
                      {timerStyle === 'hourglass' ? (
                        <HourglassTimer progress={timerProgress} minutesLeft={timerMinutesLeft} />
                      ) : timerStyle === 'droplets' ? (
                        <DropletsTimer progress={timerProgress} minutesLeft={timerMinutesLeft} />
                      ) : timerStyle === 'hyperfocus' ? (
                        <HyperfocusThemeTimer progress={timerProgress} minutesLeft={timerMinutesLeft} theme={childHyperfocus} />
                      ) : (
                        <div className="relative w-16 h-16 flex items-center justify-center">
                          <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                            <circle cx="50" cy="50" r="40" fill="none" stroke="#e3def3" strokeWidth="7" />
                            <circle cx="50" cy="50" r="40" fill="none" stroke="#5468e6" strokeWidth="7" strokeDasharray="251.2" strokeDashoffset={251.2 * (1 - timerProgress)} strokeLinecap="round" className="transition-all duration-1000 ease-linear" />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-sm font-black text-slate-800">{timerMinutesLeft}</span>
                            <span className="text-[8px] text-slate-400 uppercase tracking-wider font-bold">min</span>
                          </div>
                        </div>
                      )}
                    </div>
                    </div>

                    {/* Complete action */}
                    <div className="w-full max-w-sm flex flex-col items-center gap-3">

                    {/* LARGE COMPLETE MISSION BUTTON */}
                    {(() => {
                      const [activeH, activeM] = activeTask.time.split(':').map(Number);
                      const activeStartTime = new Date(currentTime);
                      activeStartTime.setHours(activeH, activeM, 0, 0);
                      const timeToStartMs = activeStartTime.getTime() - currentTime.getTime();
                      const isActiveLocked = timeToStartMs > 0;
                      const lockSec = Math.max(0, Math.floor(timeToStartMs / 1000));
                      const lockMin = Math.floor(lockSec / 60);
                      const lockRemSec = lockSec % 60;

                      return (
                        <div className="w-full flex flex-col gap-2">
                          <motion.button
                            whileHover={isActiveLocked ? {} : { scale: 1.03, rotate: 0.5 }}
                            whileTap={isActiveLocked ? {} : { scale: 0.92, rotate: -0.5 }}
                            onClick={() => handleCompleteTask(activeTask)}
                            disabled={celebratingTaskId !== null || isActiveLocked}
                            className={`w-full py-4 text-lg font-black rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
                              celebratingTaskId === activeTask.id
                                ? 'bg-emerald-500 text-white animate-pulse motion-ok cursor-default'
                                : isActiveLocked
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : `grad-primary hover:brightness-105 cursor-pointer`
                            }`}
                          >
                            {celebratingTaskId === activeTask.id ? (
                              <span className="flex items-center gap-2">
                                <Star className="w-6 h-6 text-yellow-200 animate-spin" /> EXCELENTE! 🎉
                              </span>
                            ) : isActiveLocked ? (
                              <span className="flex items-center gap-2 select-none">
                                🔒 {locale === 'en' ? 'Waiting Start Time' : locale === 'es' ? 'Espera Hora de Inicio' : 'Aguardando Horário'}
                              </span>
                            ) : (
                              'EU TERMINEI! ✅'
                            )}
                          </motion.button>
                          
                          {isActiveLocked && (
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center select-none font-Outfit animate-pulse mt-0.5">
                              ⏰ {locale === 'en' ? 'Starts in:' : locale === 'es' ? 'Inicia en:' : 'Inicia em:'} {lockMin}m {lockRemSec}s
                            </span>
                          )}
                        </div>
                      );
                    })()}
                    </div>
                  </motion.div>
                );
              })()}
            </AnimatePresence>

                        {/* WAIT TIMER CARD */}
            {showWaitTimer && (() => {
              // Dynamically map hyperfocus theme to mascot, target, and visual styling
              const getMascotDetails = (theme: string) => {
                const focus = (theme || "").toLowerCase().trim();
                
                if (focus.includes("dino") || focus.includes("dinossauro") || focus.includes("dinosaur")) {
                  return {
                    emoji: "🦖",
                    target: "🌴",
                    stroke: "#22c55e",
                    bg: "bg-emerald-50",
                    border: "border-emerald-250",
                    text: "text-emerald-700",
                    btn: "bg-emerald-600 border-emerald-700 text-white shadow-sm hover:bg-emerald-700 hover:border-emerald-800",
                    btnInactive: "bg-slate-50 border-slate-200 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
                  };
                }
                if (focus.includes("espaço") || focus.includes("espao") || focus.includes("astronauta") || focus.includes("space") || focus.includes("estrela") || focus.includes("star") || focus.includes("foguete") || focus.includes("rocket")) {
                  return {
                    emoji: "🚀",
                    target: "🪐",
                    stroke: "#6366f1",
                    bg: "bg-indigo-50",
                    border: "border-indigo-250",
                    text: "text-indigo-700",
                    btn: "bg-indigo-600 border-indigo-700 text-white shadow-sm hover:bg-indigo-700 hover:border-indigo-800",
                    btnInactive: "bg-slate-50 border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200"
                  };
                }
                if (focus.includes("minecraft") || focus.includes("bloco") || focus.includes("block")) {
                  return {
                    emoji: "🟩",
                    target: "💎",
                    stroke: "#84cc16",
                    bg: "bg-lime-50",
                    border: "border-lime-200",
                    text: "text-lime-700",
                    btn: "bg-lime-600 border-lime-700 text-white shadow-sm hover:bg-lime-700 hover:border-lime-800",
                    btnInactive: "bg-slate-50 border-slate-200 text-slate-700 hover:bg-lime-50 hover:text-lime-700 hover:border-lime-200"
                  };
                }
                if (focus.includes("gato") || focus.includes("cat")) {
                  return {
                    emoji: "🐱",
                    target: "🧶",
                    stroke: "#f59e0b",
                    bg: "bg-amber-50",
                    border: "border-amber-200",
                    text: "text-amber-700",
                    btn: "bg-amber-600 border-amber-700 text-white shadow-sm hover:bg-amber-700 hover:border-amber-800",
                    btnInactive: "bg-slate-50 border-slate-200 text-slate-700 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200"
                  };
                }
                if (focus.includes("carro") || focus.includes("car")) {
                  return {
                    emoji: "🏎️",
                    target: "🏁",
                    stroke: "#ef4444",
                    bg: "bg-red-50",
                    border: "border-red-200",
                    text: "text-red-700",
                    btn: "bg-red-600 border-red-700 text-white shadow-sm hover:bg-red-700 hover:border-red-800",
                    btnInactive: "bg-slate-50 border-slate-200 text-slate-700 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
                  };
                }
                if (focus.includes("trem") || focus.includes("train") || focus.includes("locomotiva")) {
                  return {
                    emoji: "🚂",
                    target: "🚉",
                    stroke: "#ec4899",
                    bg: "bg-pink-50",
                    border: "border-pink-250",
                    text: "text-pink-700",
                    btn: "bg-pink-600 border-pink-700 text-white shadow-sm hover:bg-pink-700 hover:border-pink-800",
                    btnInactive: "bg-slate-50 border-slate-200 text-slate-700 hover:bg-pink-50 hover:text-pink-700 hover:border-pink-200"
                  };
                }
                if (focus.includes("herói") || focus.includes("heroi") || focus.includes("hero") || focus.includes("super")) {
                  return {
                    emoji: "🦸",
                    target: "🛡️",
                    stroke: "#3b82f6",
                    bg: "bg-blue-50",
                    border: "border-blue-200",
                    text: "text-blue-700",
                    btn: "bg-blue-600 border-blue-700 text-white shadow-sm hover:bg-blue-700 hover:border-blue-800",
                    btnInactive: "bg-slate-50 border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
                  };
                }
                if (focus.includes("tubarão") || focus.includes("tubarao") || focus.includes("shark") || focus.includes("mar")) {
                  return {
                    emoji: "🦈",
                    target: "⚓",
                    stroke: "#06b6d4",
                    bg: "bg-cyan-50",
                    border: "border-cyan-200",
                    text: "text-cyan-700",
                    btn: "bg-cyan-600 border-cyan-700 text-white shadow-sm hover:bg-cyan-700 hover:border-cyan-800",
                    btnInactive: "bg-slate-50 border-slate-200 text-slate-700 hover:bg-cyan-50 hover:text-cyan-700 hover:border-cyan-200"
                  };
                }
                if (focus.includes("unicórnio") || focus.includes("unicornio") || focus.includes("unicorn")) {
                  return {
                    emoji: "🦄",
                    target: "🌈",
                    stroke: "#d946ef",
                    bg: "bg-fuchsia-50",
                    border: "border-fuchsia-200",
                    text: "text-fuchsia-700",
                    btn: "bg-fuchsia-600 border-fuchsia-700 text-white shadow-sm hover:bg-fuchsia-700 hover:border-fuchsia-800",
                    btnInactive: "bg-slate-50 border-slate-200 text-slate-700 hover:bg-fuchsia-50 hover:text-fuchsia-700 hover:border-fuchsia-200"
                  };
                }
                if (focus.includes("robô") || focus.includes("robo") || focus.includes("robot")) {
                  return {
                    emoji: "🤖",
                    target: "🔌",
                    stroke: "#64748b",
                    bg: "bg-slate-50",
                    border: "border-slate-200",
                    text: "text-slate-700",
                    btn: "bg-slate-600 border-slate-700 text-white shadow-sm hover:bg-slate-700 hover:border-slate-800",
                    btnInactive: "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-700 hover:border-slate-200"
                  };
                }

                // Default fallback (Dog / Border Collie)
                return {
                  emoji: "🐶",
                  target: "🏠",
                  stroke: "#3b82f6",
                  bg: "bg-blue-50",
                  border: "border-blue-200",
                  text: "text-blue-700",
                  btn: "bg-blue-600 border-blue-700 text-white shadow-sm hover:bg-blue-700 hover:border-blue-800",
                  btnInactive: "bg-slate-50 border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200"
                };
              };

              const mascotInfo = getMascotDetails(childHyperfocus);
              const progressRatio = waitTimerDuration > 0 ? (waitTimerDuration - waitTimerTimeLeft) / waitTimerDuration : 0;

              return (
                <div className={`bg-white border-4 border-slate-200 rounded-[36px] p-6 shadow-premium flex flex-col items-center justify-between text-center gap-4 relative overflow-hidden transition-all duration-500 md:col-span-4 ${sleepMode ? 'bg-slate-900 border-slate-800 text-amber-205' : 'bg-white text-slate-850'}`}>
                  {/* Close Button directly inside the card */}
                  <button
                    onClick={() => { playBubble(); setShowWaitTimer(false); }}
                    className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 border-none rounded-full w-6 h-6 flex items-center justify-center text-xs cursor-pointer select-none font-Outfit"
                    title={locale === 'en' ? 'Close' : locale === 'es' ? 'Cerrar' : 'Fechar'}
                  >
                    ✕
                  </button>
                  <div className="flex flex-col items-center gap-1.5 w-full">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-xxs font-Outfit ${mascotInfo.bg} ${mascotInfo.border} ${mascotInfo.text}`}>
                      ⏳ {t.routine.waitTimerTitle}
                    </span>
                    <h3 className="font-extrabold text-sm text-slate-900 font-Outfit mt-1">
                      {t.routine.waitTimerSubtitle}
                    </h3>
                  </div>

                  {/* Waiting Hourglass countdown */}
                  <div className="relative w-28 h-28 flex items-center justify-center my-1">
                    <svg viewBox="0 0 100 120" className="w-full h-full">
                      <path 
                        d="M20,10 L80,10 L80,20 Q80,55 55,60 Q80,65 80,100 L80,110 L20,110 L20,100 Q20,65 45,60 Q20,55 20,20 Z" 
                        fill="none" 
                        stroke={sleepMode ? '#475569' : '#64748b'} 
                        strokeWidth="6" 
                        strokeLinejoin="round" 
                      />
                      <clipPath id="wait-top-clip">
                        <rect x="0" y={15 + progressRatio * 42} width="100" height="50" />
                      </clipPath>
                      <path d="M25,15 L75,15 Q75,52 50,57 Q25,52 25,15 Z" fill={waitTimerFinished ? '#10b981' : mascotInfo.stroke} opacity="0.85" clipPath="url(#wait-top-clip)" />
                      <clipPath id="wait-bottom-clip">
                        <rect x="0" y={105 - progressRatio * 42} width="100" height="50" />
                      </clipPath>
                      <path d="M50,63 Q75,68 75,105 L25,105 Q25,68 50,63 Z" fill={waitTimerFinished ? '#10b981' : mascotInfo.stroke} opacity="0.95" clipPath="url(#wait-bottom-clip)" />
                      {progressRatio > 0 && progressRatio < 1 && (
                        <line x1="50" y1="55" x2="50" y2="95" stroke={mascotInfo.stroke} strokeWidth="3" strokeDasharray="5,5" strokeLinecap="round">
                          <animate attributeName="stroke-dashoffset" values="10;0" dur="1s" repeatCount="indefinite" />
                        </line>
                      )}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center font-bold pointer-events-none mt-2">
                      {waitTimerFinished ? (
                        <span className="text-2xl animate-bounce motion-ok">🎉</span>
                      ) : (
                        <>
                          <span className="text-sm font-black text-slate-900 bg-white/70 px-1.5 py-0.5 rounded">
                            {Math.floor(waitTimerTimeLeft / 60)}:{(waitTimerTimeLeft % 60).toString().padStart(2, '0')}
                          </span>
                          <span className="text-[7px] text-slate-500 uppercase tracking-wider font-extrabold bg-white/70 px-1 rounded mt-0.5">
                            {locale === 'en' ? 'left' : locale === 'es' ? 'restante' : 'restam'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Mascot visual walking track */}
                  <div className="w-full bg-slate-100 rounded-full h-6 px-1.5 flex items-center relative my-1 overflow-hidden border border-slate-200/60">
                    <motion.div 
                      className="text-base absolute select-none"
                      animate={{ left: `${progressRatio * 85}%` }}
                      transition={{ duration: 0.5 }}
                    >
                      {mascotInfo.emoji}
                    </motion.div>
                    <div className="absolute right-2 text-sm select-none">
                      {mascotInfo.target}
                    </div>
                  </div>

                  {/* Preset Buttons Grid */}
                  <div className="grid grid-cols-4 gap-1.5 w-full mt-1">
                    {[5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60].map(min => (
                      <button
                        key={min}
                        onClick={() => {
                          playBubble();
                          setWaitTimerDuration(min * 60);
                          setWaitTimerTimeLeft(min * 60);
                          setWaitTimerFinished(false);
                          setIsWaitTimerActive(true); // Auto-start on tap!
                        }}
                        className={`py-1 rounded-lg text-[10px] font-black font-Outfit transition-all active:scale-95 cursor-pointer border ${
                          Math.floor(waitTimerDuration / 60) === min
                            ? mascotInfo.btn
                            : mascotInfo.btnInactive
                        }`}
                      >
                        {min}m
                      </button>
                    ))}
                  </div>

                  {/* Controls: Play/Pause, Reset, Adjusters */}
                  <div className="flex items-center justify-between w-full gap-2 mt-2">
                    <button
                      onClick={() => {
                        playBubble();
                        if (waitTimerTimeLeft > 0) {
                          setIsWaitTimerActive(!isWaitTimerActive);
                        }
                      }}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1 border-b-2 ${
                        isWaitTimerActive
                          ? 'bg-amber-500 border-amber-700 text-white hover:bg-amber-600'
                          : mascotInfo.btn
                      }`}
                    >
                      {isWaitTimerActive ? `⏸️ ${t.routine.waitTimerPause}` : `▶️ ${t.routine.waitTimerStart}`}
                    </button>

                    <button
                      onClick={() => {
                        playBubble();
                        setIsWaitTimerActive(false);
                        setWaitTimerTimeLeft(waitTimerDuration);
                        setWaitTimerFinished(false);
                      }}
                      className="p-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-slate-700 text-xs font-black cursor-pointer transition-all active:scale-95"
                      title={t.routine.waitTimerReset}
                    >
                      🔄
                    </button>

                    {/* +/- Adjusters */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          playBubble();
                          setWaitTimerTimeLeft(prev => {
                            const newVal = Math.max(0, prev - 60);
                            if (newVal === 0) {
                              setIsWaitTimerActive(false);
                              setWaitTimerFinished(true);
                              try {
                                playSoftAlert();
                              } catch (err) {
                                console.error('Erro ao tocar som:', err);
                              }
                              const msg = t.routine.waitTimerFinished || 'O tempo de espera terminou! Muito bem por esperar!';
                              speakText(msg);
                            }
                            return newVal;
                          });
                        }}
                        className="w-8 h-8 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl flex items-center justify-center text-xs font-extrabold cursor-pointer transition-all active:scale-95"
                        title="-1 min"
                      >
                        -1m
                      </button>
                      <button
                        onClick={() => {
                          playBubble();
                          setWaitTimerTimeLeft(prev => {
                            const newVal = prev + 60;
                            setWaitTimerDuration(d => Math.max(d, newVal));
                            return newVal;
                          });
                          setWaitTimerFinished(false);
                        }}
                        className="w-8 h-8 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl flex items-center justify-center text-xs font-extrabold cursor-pointer transition-all active:scale-95"
                        title="+1 min"
                      >
                        +1m
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 2. PROGRESS TRACKER OR CLINICAL FIRST-THEN BOARD */}
            {effectiveVisuals === 'minimal' ? (
              /* TEACCH FIRST-THEN (PRIMEIRO-DEPOIS) BOARD */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mt-4 md:col-span-12">
                {/* FIRST CARD (CURRENT ACTIVE TASK) */}
                {activeTask ? (() => {
                  const category = getTaskCategory(activeTask.title);
                  return (
                    <div className={`bg-white border-4 border-indigo-600 rounded-[32px] p-6 shadow-premium flex flex-col items-center text-center gap-4 relative overflow-hidden transition-all duration-300 ${category.shadow}`}>
                      <div className="absolute top-3 left-3 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full select-none font-Outfit">
                        {t.routine.first}
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
                        onClick={() => { playBubble(); speakText(activeTask.title + (activeTask.description ? (locale === 'en' ? `. Instructions: ${activeTask.description}` : locale === 'es' ? `. Instrucciones: ${activeTask.description}` : `. Instruções: ${activeTask.description}`) : '')); }}
                        className="text-xl font-black text-slate-950 tracking-tight cursor-pointer hover:text-indigo-700 select-none font-Outfit"
                      >
                        {activeTask.title}
                      </h4>
                      {activeTask.description && (
                        <p 
                          onClick={() => { playBubble(); speakText(activeTask.description || ''); }}
                          className="text-[11px] font-bold text-slate-500 mt-1 cursor-pointer max-w-[200px] hover:text-indigo-700 transition-all leading-normal select-none"
                          title={locale === 'en' ? 'Click to hear the instructions' : locale === 'es' ? 'Haga clic para escuchar las instrucciones' : 'Clique para ouvir as instruções'}
                        >
                          💡 {activeTask.description}
                        </p>
                      )}
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wide">⏱️ {locale === 'en' ? 'Est. Time:' : locale === 'es' ? 'Previsto:' : 'Previsão:'} {activeTask.time}</span>
                    </div>
                  );
                })() : (
                  <div className="bg-white border-4 border-dashed border-slate-300 rounded-[32px] p-6 shadow-premium flex flex-col items-center text-center justify-center gap-3 relative min-h-[200px]">
                    <span className="text-3xl">🎉</span>
                    <h4 className="text-lg font-black text-slate-800 font-Outfit">{locale === 'en' ? 'First Mission' : locale === 'es' ? 'Primera Misión' : 'Primeira Missão'}</h4>
                    <p className="text-xs text-slate-400 font-semibold max-w-[200px]">{locale === 'en' ? 'All set for today!' : locale === 'es' ? '¡Todo listo por hoy!' : 'Tudo pronto por hoje!'}</p>
                  </div>
                )}

                {/* THEN CARD (NEXT TASK IN PREDICTIVE TIMELINE) */}
                {nextTasks.length > 0 ? (() => {
                  const nextTask = nextTasks[0];
                  return (
                    <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-[24px] p-6 shadow-sm flex flex-col items-center text-center justify-center gap-4 relative overflow-hidden opacity-90">
                      <div className="absolute top-3 left-3 bg-slate-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full select-none font-Outfit">
                        {t.routine.then}
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
                      {(() => {
                        const [nextH, nextM] = nextTask.time.split(':').map(Number);
                        const nextStartTime = new Date(currentTime);
                        nextStartTime.setHours(nextH, nextM, 0, 0);
                        const timeToNextStartMs = nextStartTime.getTime() - currentTime.getTime();
                        const isNextFuture = timeToNextStartMs > 0;
                        const diffMin = Math.ceil(timeToNextStartMs / 60000);

                        return (
                          <span className="text-[9px] font-black text-slate-500 uppercase tracking-wide font-Outfit">
                            {isNextFuture 
                              ? `⏰ ${locale === 'en' ? 'Starts in' : locale === 'es' ? 'Inicia en' : 'Inicia em'} ${diffMin} min`
                              : (locale === 'en' ? 'Ready to start!' : locale === 'es' ? '¡Listo para empezar!' : 'Pronto para começar!')
                            }
                          </span>
                        );
                      })()}
                    </div>
                  );
                })() : (
                  <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-[24px] p-6 shadow-sm flex flex-col items-center text-center justify-center gap-3 relative min-h-[200px] opacity-60">
                    <div className="absolute top-3 left-3 bg-slate-450 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full select-none font-Outfit">
                      {t.routine.then}
                    </div>
                    <span className="text-3xl select-none">🌙</span>
                    <h4 className="text-lg font-black text-slate-650 font-Outfit">Fim da Trilha</h4>
                    <p className="text-xs text-slate-450 font-semibold">Sem tarefas pendentes!</p>
                  </div>
                )}
              </div>
            ) : (
              /* THE ROUTINE TRAIL - GAMIFIED PROGRESS TRACKER (RICH VISUALS) */
              <div className="bg-slate-50/70 border border-slate-200 p-4.5 rounded-[28px] shadow-sm flex flex-col gap-3 text-left w-full md:col-span-12 mt-4">
                <h3 className="font-black text-xs text-slate-655 uppercase tracking-widest flex items-center gap-1.5 select-none font-Outfit">
                  🚂 {locale === 'en' ? 'My Missions Trail:' : locale === 'es' ? 'Sendero de Mis Misiones:' : 'Trilha das Minhas Missões:'}
                </h3>
                
                <div className="relative flex items-center justify-between px-4 py-6 overflow-x-auto min-h-[100px] gap-6">
                  
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
                          <div className="absolute top-[-30px] text-lg pointer-events-none">
                            🐾
                          </div>
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
              
              <div className="w-18 h-18 bg-yellow-100 text-yellow-500 rounded-full flex items-center justify-center text-4xl shadow-md animate-bounce motion-ok select-none">
                🎁
              </div>

              <div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">{locale === 'en' ? 'Congratulations, you did it! 🎉' : locale === 'es' ? '¡Felicitaciones, lo lograste! 🎉' : 'Parabéns, você conseguiu! 🎉'}</h3>
                <p className="text-xs text-slate-400 font-semibold mt-1">
                  {locale === 'en' ? 'You completed your missions and unlocked your reward:' : locale === 'es' ? 'Completaste tus misiones y desbloqueaste tu premio:' : 'Você completou suas missões e desbloqueou seu prêmio:'}
                </p>
                <div className="mt-3.5 px-6 py-3 bg-indigo-100 border-2 border-indigo-300 text-indigo-950 font-black text-sm rounded-2xl shadow-xxs font-Outfit">
                  {activeChild.rewardName || (locale === 'en' ? 'Reward' : locale === 'es' ? 'Premio' : 'Prêmio')}
                </div>
              </div>

              <div className="flex flex-col gap-2 w-full">
                <button
                  onClick={handleClaimReward}
                  className="w-full py-4 bg-gradient-to-r from-yellow-500 via-amber-500 to-amber-600 text-slate-950 font-black text-sm rounded-2xl shadow-md cursor-pointer transition-all active:scale-95 border-b-4 border-amber-800 font-Outfit"
                >
                  {locale === 'en' ? 'CLAIM REWARD! 🐾' : locale === 'es' ? '¡RECLAMAR PREMIO! 🐾' : 'RESGATAR PRÊMIO! 🐾'}
                </button>
                <button
                  onClick={() => setShowRewardModal(false)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-650 cursor-pointer bg-transparent border-none mt-1"
                >
                  {locale === 'en' ? 'Save stars for later' : locale === 'es' ? 'Guardar estrellas para después' : 'Guardar estrelas para depois'}
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
                <h3 className={`text-xl font-black ${sleepMode ? 'text-amber-200' : 'text-slate-800'}`}>{locale === 'en' ? 'How are you feeling right now?' : locale === 'es' ? '¿Cómo te sientes ahora?' : 'Como você está se sentindo agora?'}</h3>
                <p className={`text-xs font-semibold mt-1 ${sleepMode ? 'text-amber-450' : 'text-slate-400'}`}>
                  {locale === 'en' ? 'Mark your emotion to help track your day!' : locale === 'es' ? '¡Marca tu emoción para ayudar a seguir tu día!' : 'Marque sua emoção para ajudar a acompanhar seu dia!'}
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
                    <label className={`text-[8px] font-black uppercase ${sleepMode ? 'text-amber-450' : 'text-slate-450'}`}>{locale === 'en' ? 'Location' : locale === 'es' ? 'Lugar' : 'Local'}</label>
                    <select 
                      value={location} 
                      onChange={(e) => setLocation(e.target.value)}
                      className={`text-[10px] font-bold p-1 border rounded-lg ${
                        sleepMode ? 'bg-[#090d1a] border-amber-900 text-amber-200' : 'bg-white border-slate-350 text-slate-700'
                      }`}
                    >
                      <option value="Casa">{locale === 'en' ? 'Home 🏠' : locale === 'es' ? 'Casa 🏠' : 'Casa 🏠'}</option>
                      <option value="Escola">{locale === 'en' ? 'School 🏫' : locale === 'es' ? 'Escuela 🏫' : 'Escola 🏫'}</option>
                      <option value="Parque">{locale === 'en' ? 'Park 🌳' : locale === 'es' ? 'Parque 🌳' : 'Parque 🌳'}</option>
                      <option value="Consultório">{locale === 'en' ? 'Clinic 🩺' : locale === 'es' ? 'Consultorio 🩺' : 'Consultório 🩺'}</option>
                      <option value="Outro">{locale === 'en' ? 'Other 📍' : locale === 'es' ? 'Otro 📍' : 'Outro 📍'}</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <label className={`text-[8px] font-black uppercase ${sleepMode ? 'text-amber-450' : 'text-slate-450'}`}>{locale === 'en' ? 'Light' : locale === 'es' ? 'Luz' : 'Luz'}</label>
                    <select 
                      value={lightLevel} 
                      onChange={(e: any) => setLightLevel(e.target.value)}
                      className={`text-[10px] font-bold p-1 border rounded-lg ${
                        sleepMode ? 'bg-[#090d1a] border-amber-900 text-amber-200' : 'bg-white border-slate-350 text-slate-700'
                      }`}
                    >
                      <option value="Baixa">{locale === 'en' ? 'Soft 💡' : locale === 'es' ? 'Suave 💡' : 'Suave 💡'}</option>
                      <option value="Média">{locale === 'en' ? 'Medium 🔆' : locale === 'es' ? 'Media 🔆' : 'Média 🔆'}</option>
                      <option value="Alta">{locale === 'en' ? 'Bright ☀️' : locale === 'es' ? 'Fuerte ☀️' : 'Forte ☀️'}</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <label className={`text-[8px] font-black uppercase ${sleepMode ? 'text-amber-450' : 'text-slate-450'}`}>{locale === 'en' ? 'Trigger' : locale === 'es' ? 'Desencadenante' : 'Gatilho'}</label>
                    <select 
                      value={activeTrigger} 
                      onChange={(e) => setActiveTrigger(e.target.value)}
                      className={`text-[10px] font-bold p-1 border rounded-lg ${
                        sleepMode ? 'bg-[#090d1a] border-amber-900 text-amber-200' : 'bg-white border-slate-350 text-slate-700'
                      }`}
                    >
                      <option value="Nenhum">{locale === 'en' ? 'None' : locale === 'es' ? 'Ninguno' : 'Nenhum'}</option>
                      <option value="Barulho">{locale === 'en' ? 'Noise' : locale === 'es' ? 'Ruido' : 'Barulho'}</option>
                      <option value="Luz Forte">{locale === 'en' ? 'Bright Light' : locale === 'es' ? 'Luz Fuerte' : 'Luz Forte'}</option>
                      <option value="Transição">{locale === 'en' ? 'Transition' : locale === 'es' ? 'Transición' : 'Transição'}</option>
                      <option value="Cansaço">{locale === 'en' ? 'Fatigue' : locale === 'es' ? 'Cansancio' : 'Cansaço'}</option>
                      <option value="Fome">{locale === 'en' ? 'Hunger' : locale === 'es' ? 'Hambre' : 'Fome'}</option>
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
                {locale === 'en' ? 'Skip check-in' : locale === 'es' ? 'Saltar check-in' : 'Pular check-in'}
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
                <div className="flex flex-col gap-4">
                  <div className="text-center mt-2">
                    <span className="text-3xl">📖</span>
                    <h3 className={`text-xl font-black mt-2 font-Outfit ${sleepMode ? 'text-amber-200' : 'text-slate-855'}`}>{t.routine.socialStoriesTitle}</h3>
                    <p className={`text-xs font-semibold mt-1 ${sleepMode ? 'text-amber-450' : 'text-slate-400'}`}>
                      {t.routine.storySelectionPrompt}
                    </p>
                  </div>

                  {!sleepMode && (
                    <div className="flex bg-slate-100 border border-slate-200 p-1 rounded-xl shadow-xxs gap-1 mb-2">
                      <button
                        type="button"
                        onClick={() => { playBubble(); setStoriesTab('preset'); }}
                        className={`flex-1 py-2 text-xs font-black rounded-lg transition-all cursor-pointer font-Outfit ${
                          storiesTab === 'preset' ? 'bg-indigo-650 text-white shadow-sm' : 'text-slate-650 hover:bg-white/50 border-none bg-transparent'
                        }`}
                      >
                        {t.routine.readyStories} 📚
                      </button>
                      <button
                        type="button"
                        onClick={() => { playBubble(); setStoriesTab('ai'); }}
                        className={`flex-1 py-2 text-xs font-black rounded-lg transition-all cursor-pointer font-Outfit ${
                          storiesTab === 'ai' ? 'bg-indigo-650 text-white shadow-sm' : 'text-slate-655 hover:bg-white/50 border-none bg-transparent'
                        }`}
                      >
                        {t.routine.createWithAi} 🤖✨
                      </button>
                    </div>
                  )}

                  {storiesTab === 'preset' || sleepMode ? (
                    <div className="flex flex-col gap-3 max-h-[320px] overflow-y-auto pr-1 scrollbar-thin">
                    <span className={`text-[10px] font-black uppercase tracking-wider font-Outfit ${sleepMode ? 'text-amber-500' : 'text-indigo-500'}`}>{t.routine.socialStoriesTitle} 📖</span>
                    {localizedSocialStories.map(story => (
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

                    {(() => {
                      if (activeChild?.customStories) {
                        try {
                          const parsed = JSON.parse(activeChild.customStories);
                          if (Array.isArray(parsed) && parsed.length > 0) {
                            return (
                              <>
                                <span className={`text-[10px] font-black uppercase tracking-wider font-Outfit mt-3 ${sleepMode ? 'text-rose-400' : 'text-rose-500'}`}>
                                  {t.routine.storyCreatedByParents} 💖
                                </span>
                                {parsed.map(story => (
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
                                        ? 'bg-[#121827] hover:bg-rose-950/20 hover:border-rose-900 border-rose-955' 
                                        : 'bg-slate-50 hover:bg-rose-50/40 hover:border-rose-300 border-slate-200/80'
                                    }`}
                                  >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-xxs shrink-0 group-hover:scale-105 transition-all ${
                                      sleepMode ? 'bg-rose-950/20 border border-rose-900/40' : 'bg-rose-50 border border-rose-100'
                                    }`}>
                                      {story.steps[0]?.img || '📖'}
                                    </div>
                                    <div>
                                      <h4 className={`font-extrabold text-sm font-Outfit transition-all ${sleepMode ? 'text-rose-205 group-hover:text-rose-305' : 'text-slate-855 group-hover:text-rose-750'}`}>{story.title}</h4>
                                      <p className={`text-[10px] font-semibold mt-0.5 leading-normal ${sleepMode ? 'text-rose-450' : 'text-slate-500'}`}>{story.desc}</p>
                                    </div>
                                  </button>
                                ))}
                              </>
                            );
                          }
                        } catch (e) {}
                      }
                      return null;
                    })()}

                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-500 font-Outfit mt-3">{t.routine.bedtimeStoriesTitle} 🌙💤</span>
                    {localizedBedtimeStories.map(story => (
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
                  ) : (
                    <div className="flex flex-col gap-4 py-2 text-left">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-wider font-Outfit">{locale === 'en' ? 'Which activity do you want to create the story about?' : locale === 'es' ? '¿Sobre qué actividad quieres crear la historia?' : 'Sobre qual atividade quer criar a história?'}</label>
                        <input
                          type="text"
                          value={aiTheme}
                          onChange={e => setAiTheme(e.target.value)}
                          placeholder={locale === 'en' ? 'e.g. going to the dentist, taking a bath, going to school' : locale === 'es' ? 'Ej: ir al dentista, bañarse, ir a la escuela' : 'Ex: ir ao dentista, tomar banho, ir à escola'}
                          className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-300 focus:border-indigo-600 focus:bg-white rounded-xl text-xs font-bold outline-none transition-all shadow-xxs text-slate-900"
                        />
                      </div>
                      
                      <div className="p-3.5 bg-indigo-50 border border-indigo-150 rounded-2xl flex items-center justify-between text-xs font-bold text-indigo-955">
                        <span>{locale === 'en' ? 'Active Guide Mascot:' : locale === 'es' ? 'Mascota Guía Activa:' : 'Mascote Guia Ativo:'}</span>
                        <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider font-Outfit">
                          {childHyperfocus.split(' ')[0]}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={handleGenerateAiStory}
                        disabled={generatingAi || !aiTheme.trim()}
                        className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 border-none cursor-pointer flex items-center justify-center gap-2"
                      >
                        {generatingAi ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            <span>{localizedGeneratorStatuses[aiStatusIdx]}</span>
                          </>
                        ) : (
                          <>{locale === 'en' ? '🤖 Generate Social Adventure' : locale === 'es' ? '🤖 Generar Aventura Social' : '🤖 Gerar Aventura Social'}</>
                        )}
                      </button>
                    </div>
                  )}
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
                        {locale === 'en' ? 'Next ➡️' : locale === 'es' ? 'Siguiente ➡️' : 'Próximo ➡️'}
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

      {renderHyperfocusModals()}
      {renderAacModal()}
      {renderSimulatorModal()}
      {renderMascotShopModal()}
      {renderSensoryAlertModal()}

      {/* SOS Sensorial Full Screen Modal */}
      <AnimatePresence>
        {isSosActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#030712] flex flex-col items-center justify-center overflow-hidden p-6"
          >
            {/* Soft background sparkles */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <div className="absolute top-[20%] left-[20%] w-4 h-4 bg-teal-400 rounded-full filter blur-xl animate-pulse"></div>
              <div className="absolute bottom-[30%] right-[20%] w-6 h-6 bg-indigo-500 rounded-full filter blur-xl animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="relative z-10 text-center flex flex-col items-center gap-6 max-w-sm w-full">
              {/* Calm sleep mascot */}
              <div className="text-8xl select-none animate-pulse">
                {(() => {
                  const focus = (childHyperfocus || '').toLowerCase();
                  if (focus.includes('dino')) return '🦕';
                  if (focus.includes('space')) return '🛸';
                  if (focus.includes('trem')) return '💤🚂';
                  return '💤🐶';
                })()}
              </div>

              <h1 className="text-3xl font-black text-teal-350 tracking-tight font-Outfit animate-pulse mt-2">
                {locale === 'en' ? 'Calm Space 🧘‍♂️' : locale === 'es' ? 'Espacio de Calma 🧘‍♂️' : 'Espaço da Calma 🧘‍♂️'}
              </h1>
              <p className="text-slate-400 text-xs font-semibold px-6 leading-relaxed">
                {locale === 'en' ? 'Close your eyes, listen to the soft sound, and follow the breathing balloon with your body.' : locale === 'es' ? 'Cierra los ojos, escucha el sonido suave y sigue el globo de respiración con tu cuerpo.' : 'Feche os olhos, escute o som suave e acompanhe o balão de respiração com o seu corpinho.'}
              </p>

              {/* Glowing breathing animation */}
              <div className="my-8 flex items-center justify-center relative w-60 h-60">
                <motion.div
                  animate={{ scale: [1, 1.4, 1.4, 1] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  className="w-40 h-40 bg-teal-500/15 border-4 border-teal-400/30 rounded-full flex items-center justify-center relative shadow-2xl shadow-teal-500/10"
                >
                  <motion.div
                    animate={{ scale: [1, 1.35, 1.35, 1] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    className="w-28 h-28 bg-indigo-400/20 border-2 border-indigo-300/30 rounded-full flex items-center justify-center"
                  />
                </motion.div>
                
                <span className="absolute text-[11px] font-black text-teal-200 uppercase tracking-widest font-Outfit text-center">
                  {breathStep === 'inspire' ? '✨ Puxar o Ar' : breathStep === 'segure' ? '⏸️ Segurar' : '🌬️ Soltar o Ar'}
                </span>
              </div>

              {/* Exit HOLD action button */}
              <div className="w-full flex flex-col items-center gap-2 mt-4">
                <button
                  onMouseDown={handleExitStart}
                  onMouseUp={handleExitEnd}
                  onMouseLeave={handleExitEnd}
                  onTouchStart={handleExitStart}
                  onTouchEnd={handleExitEnd}
                  className="w-full py-4 border-2 border-slate-700 bg-slate-900 text-slate-300 hover:text-white text-xs font-black rounded-3xl relative overflow-hidden active:scale-98 transition-all cursor-pointer font-Outfit uppercase tracking-wider select-none"
                >
                  {/* Progress fill */}
                  <div 
                    className="absolute left-0 top-0 bottom-0 bg-teal-600/40 transition-all duration-100 pointer-events-none"
                    style={{ width: `${exitHoldProgress}%` }}
                  />
                  <span className="relative z-10 font-Outfit">{t.routine.exitLongPress} 🔒</span>
                </button>
                <span className="text-[9px] text-slate-500 font-extrabold">
                  {locale === 'en' ? 'Hold for 2 seconds to release clinical lock' : locale === 'es' ? 'Mantén presionado por 2 segundos para liberar el bloqueo clínico' : 'Segure por 2 segundos para liberar o cadeado clínico'}
                </span>
              </div>
            </div>
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
  const { t, locale } = useLanguage();
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
        <h3 className="text-xl font-black text-slate-800">{locale === 'en' ? 'Parents Area' : locale === 'es' ? 'Área de Padres' : 'Área dos Pais'}</h3>
        <p className="text-xs text-slate-400 font-semibold mt-1">
          {lockType === 'pin' 
            ? t.routine.exitPinPrompt 
            : (locale === 'en' ? 'Solve the math problem to prove you are an adult' : locale === 'es' ? 'Resuelve el problema matemático para demostrar que eres un adulto' : 'Resolva a conta matemática para provar que é um adulto')}
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
