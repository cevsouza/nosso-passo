"use client";

import React, { useState, useEffect, Suspense } from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { motion, AnimatePresence } from 'framer-motion';

import { firebaseBridge, Task, UserProfile, getOfflineQueue } from '../../../lib/firebase-bridge';

import { immutableLogger, AuditLog } from '../../../lib/immutable-logger';

import { playBubble, playMarimba } from '../../../lib/audio-synth';

import { useLanguage } from '../../../lib/LanguageContext';

import { LanguageSelector } from '../../../components/LanguageSelector';

import { AccessCodesManager } from '../../../components/AccessCodesManager';

import { getTaskCategory, TaskCategory } from '../../../lib/sensory-standards';

import { CollieState } from '../../../components/ludic/BorderCollie';

import { HyperfocusMascot } from '../../../components/ludic/HyperfocusMascot';

import { RoutineIllustration } from '../../../components/ludic/RoutineIllustration';

import { 

  Calendar, 

  Clock, 

  Trash2, 

  Plus, 

  Settings, 

  History, 

  LogOut, 

  Sparkles, 

  ListTodo,

  Info,

  CheckCircle,

  RotateCcw,

  Pencil,

  Mic,

  Play,

  Pause,

  Square,

  Map,

  AlertTriangle,

  ChevronDown,

  ChevronUp,

  ChevronLeft,

  ChevronRight,

  Briefcase,

  BookOpen,

  MessageSquare,

  Activity

} from 'lucide-react';

import Link from 'next/link';

import { SensoryHeatmap } from '../../../components/SensoryHeatmap';

import { GlobalNav } from '../../../components/GlobalNav';



const getWeeksOfMonth = (month: number, year: number) => {

  const numDays = new Date(year, month, 0).getDate();

  const weeks: { weekNum: number; start: number; end: number; days: string[] }[] = [];

  

  let currentWeekNum = 1;

  let weekDays: string[] = [];

  let weekStart = 1;

  

  for (let d = 1; d <= numDays; d++) {

    const date = new Date(year, month - 1, d);

    const dayOfWeek = date.getDay(); // 0 is Sunday, 6 is Saturday

    

    weekDays.push(String(d));

    

    if (dayOfWeek === 6 || d === numDays) {

      weeks.push({

        weekNum: currentWeekNum,

        start: weekStart,

        end: d,

        days: [...weekDays]

      });

      currentWeekNum++;

      weekDays = [];

      weekStart = d + 1;

    }

  }

  return weeks;

};



const getDaysOfCurrentMonth = () => {

  const now = new Date();

  const year = now.getFullYear();

  const month = now.getMonth(); // 0-indexed

  const numDays = new Date(year, month + 1, 0).getDate();

  const DAYS_PORTUGUESE = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const WEEKDAY_KEYS = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];

  

  return Array.from({ length: numDays }).map((_, i) => {

    const dayNum = i + 1;

    const date = new Date(year, month, dayNum);

    const dayOfWeek = DAYS_PORTUGUESE[date.getDay()];

    return {

      key: String(dayNum),

      label: `Dia ${dayNum} (${dayOfWeek}) 📅`,

      short: `${dayNum}`,

      weekdayKey: WEEKDAY_KEYS[date.getDay()],

      weekdayShort: dayOfWeek

    };

  });

};



const DAYS_OF_MONTH = getDaysOfCurrentMonth();



const getDayLabel = (dayKey: string, locale: string = 'pt') => {

  const day = DAYS_OF_MONTH.find(d => d.key === dayKey);

  if (!day) return locale === 'en' ? `Day ${dayKey}` : locale === 'es' ? `Día ${dayKey}` : `Dia ${dayKey}`;

  

  const weekdayShortMap: Record<string, Record<string, string>> = {

    'Dom': { pt: 'Dom', es: 'Dom', en: 'Sun' },

    'Seg': { pt: 'Seg', es: 'Lun', en: 'Mon' },

    'Ter': { pt: 'Ter', es: 'Mar', en: 'Tue' },

    'Qua': { pt: 'Qua', es: 'Mié', en: 'Wed' },

    'Qui': { pt: 'Qui', es: 'Jue', en: 'Thu' },

    'Sex': { pt: 'Sex', es: 'Vie', en: 'Fri' },

    'Sáb': { pt: 'Sáb', es: 'Sáb', en: 'Sat' }

  };

  

  const wTrans = weekdayShortMap[day.weekdayShort]?.[locale] || day.weekdayShort;

  

  return locale === 'en'

    ? `Day ${day.key} (${wTrans}) 📅`

    : locale === 'es'

    ? `Día ${day.key} (${wTrans}) 📅`

    : `Dia ${day.key} (${day.weekdayShort}) 📅`;

};



const getRecurrenceWeekdayLabel = (dayKey: string, locale: string = 'pt') => {

  const dayObj = DAYS_OF_MONTH.find(d => d.key === dayKey);

  if (!dayObj) return locale === 'en' ? 'on the same day of the week' : locale === 'es' ? 'en el mismo día de la semana' : 'no mesmo dia da semana';

  

  const mappingPt: Record<string, string> = {

    domingo: 'Domingos',

    segunda: 'Segundas-feiras',

    terca: 'Terças-feiras',

    quarta: 'Quartas-feiras',

    quinta: 'Quintas-feiras',

    sexta: 'Sextas-feiras',

    sabado: 'Sábados'

  };



  const mappingEn: Record<string, string> = {

    domingo: 'Sundays',

    segunda: 'Mondays',

    terca: 'Tuesdays',

    quarta: 'Wednesdays',

    quinta: 'Thursdays',

    sexta: 'Fridays',

    sabado: 'Saturdays'

  };



  const mappingEs: Record<string, string> = {

    domingo: 'Domingos',

    segunda: 'Lunes',

    terca: 'Martes',

    quarta: 'Miércoles',

    quinta: 'Jueves',

    sexta: 'Viernes',

    sabado: 'Sábados'

  };

  

  const mapping = locale === 'en' ? mappingEn : locale === 'es' ? mappingEs : mappingPt;

  

  return locale === 'en' 

    ? `All ${mapping[dayObj.weekdayKey] || dayObj.weekdayKey} of the month`

    : locale === 'es'

    ? `Todos los ${mapping[dayObj.weekdayKey] || dayObj.weekdayKey} del mes`

    : `Todas as ${mapping[dayObj.weekdayKey] || dayObj.weekdayKey} do mês`;

};



const PERIODS = [

  { key: 'manhã', label: 'Manhã ☀️', color: 'bg-amber-55 text-amber-700 border-amber-150' },

  { key: 'tarde', label: 'Tarde ⛅', color: 'bg-blue-55 text-blue-700 border-blue-150' },

  { key: 'noite', label: 'Noite 🌙', color: 'bg-indigo-55 text-indigo-700 border-indigo-150' }

];



const getLogActionStyle = (action: string) => {

  switch (action) {

    case 'ADD_TASK':

      return 'bg-emerald-50 text-emerald-700 border-emerald-200/80';

    case 'DELETE_TASK':

      return 'bg-rose-50 text-rose-700 border-rose-200/80';

    case 'UPDATE_PROFILE':

      return 'bg-sky-50 text-sky-700 border-sky-200/80';

    case 'RESET_ROUTINE':

      return 'bg-amber-50 text-amber-700 border-amber-200/80';

    default:

      return 'bg-slate-50 text-slate-700 border-slate-200';

  }

};



const GENERATOR_STATUSES = [

  "Pesquisando interesses do paciente... 🔍",

  "Encontrando conexões de hiperfoco... 🧠",

  "Escrevendo a história pedagógica... ✍️",

  "Ilustrando as cenas com emojis lúdicos... 🎨",

  "Finalizando e revisando pedagogia ABA... ✨"

];



const CLINICAL_TIPS = [

  "Use reforço positivo imediato após a conclusão de uma tarefa difícil.",

  "Dê à criança 10 minutos de previsibilidade antes de transições de atividades.",

  "Evite sobrecarga de tarefas no período da noite para induzir um sono reparador.",

  "O hiperfoco (ex: trens) é uma ponte excelente para incentivar a higiene diária.",

  "Tente manter horários semelhantes para refeições para reduzir a rigidez cognitiva."

];



const PRESETS = [

  { title: 'Escovar os dentes', icon: '🪥', time: '08:00', period: 'manhã' as const },

  { title: 'Tomar banho', icon: '🧼', time: '08:30', period: 'manhã' as const },

  { title: 'Café da manhã', icon: '🍳', time: '09:00', period: 'manhã' as const },

  { title: 'Ir para a escola', icon: '🏫', time: '13:00', period: 'tarde' as const },

  { title: 'Dever de casa', icon: '📝', time: '17:30', period: 'tarde' as const },

  { title: 'Jantar em família', icon: '🍽️', time: '19:30', period: 'noite' as const },

  { title: 'Dormir / Descanso', icon: '🛌', time: '21:30', period: 'noite' as const },

  { title: 'Sessão Psicologia ABA 🧠', icon: '🧠', time: '09:00', period: 'manhã' as const },

  { title: 'Terapia Ocupacional 🧼', icon: '🧼', time: '14:00', period: 'tarde' as const },

  { title: 'Sessão Fonoaudiologia 🗣️', icon: '🗣️', time: '10:30', period: 'manhã' as const },

  { title: 'Fisioterapia Motora 🩺', icon: '🩺', time: '15:30', period: 'tarde' as const },

  { title: 'Psicoterapia Infantil 💬', icon: '💬', time: '16:00', period: 'tarde' as const },

  { title: 'Psicomotricidade 🏃', icon: '🏃', time: '11:00', period: 'manhã' as const },

  { title: 'Sessão Musicoterapia 🎵', icon: '🎵', time: '15:00', period: 'tarde' as const },

  { title: 'Sessão Psicopedagogia 📚', icon: '📚', time: '16:30', period: 'tarde' as const }

];



const CLINICAL_TEMPLATES = {

  standard: {

    name: "Rotina Clínica Padrão 🧭",

    description: "Equilibrada com higiene, estudo e lazer ao longo de toda a semana.",

    tasks: [

      { title: 'Escovar os dentes', time: '08:00', period: 'manhã' as const },

      { title: 'Tomar café da manhã', time: '08:30', period: 'manhã' as const },

      { title: 'Aulas e Estudo', time: '09:00', period: 'manhã' as const },

      { title: 'Almoço Saudável', time: '12:30', period: 'tarde' as const },

      { title: 'Brincar com o Collie', time: '15:00', period: 'tarde' as const },

      { title: 'Jantar em Família', time: '19:00', period: 'noite' as const },

      { title: 'Tomar Banho e Dormir', time: '21:00', period: 'noite' as const }

    ]

  },

  sensory_focus: {

    name: "Foco em Regulação Sensorial 🧘",

    description: "Ideal para dias de sobrecarga ou desregulação sensorial. Menos cobrança acadêmica.",

    tasks: [

      { title: 'Alongamento Suave', time: '08:00', period: 'manhã' as const },

      { title: 'Higiene e Escovação', time: '08:30', period: 'manhã' as const },

      { title: 'Pausa de Descompressão', time: '10:30', period: 'manhã' as const },

      { title: 'Almoço Calmo', time: '12:30', period: 'tarde' as const },

      { title: 'Atividade Motora Livre', time: '14:30', period: 'tarde' as const },

      { title: 'Refúgio Sensorial', time: '16:30', period: 'tarde' as const },

      { title: 'Banho Morno Relaxante', time: '19:00', period: 'noite' as const },

      { title: 'Leitura e Calmaria', time: '20:30', period: 'noite' as const }

    ]

  },

  weekend_play: {

    name: "Fim de Semana Lúdico 🎈",

    description: "Foco em autonomia, socialização e atividades ao ar livre com flexibilidade.",

    tasks: [

      { title: 'Café Especial', time: '09:00', period: 'manhã' as const },

      { title: 'Organizar Brinquedos', time: '10:00', period: 'manhã' as const },

      { title: 'Parque e Natureza', time: '10:30', period: 'manhã' as const },

      { title: 'Almoço em Família', time: '13:00', period: 'tarde' as const },

      { title: 'Tempo Livre (Hiperfoco)', time: '15:30', period: 'tarde' as const },

      { title: 'Jantar em Família', time: '19:30', period: 'noite' as const },

      { title: 'Higiene e Dormir', time: '21:00', period: 'noite' as const }

    ]

  },

  therapy_aba: {

    name: "Rotina Terapêutica ABA 🧠",

    description: "Estruturada com sessões ABA de mandos, imitação, lanche social e pausas reguladoras.",

    tasks: [

      { title: 'Higiene da Manhã 🫧', time: '08:00', period: 'manhã' as const },

      { title: 'Treino ABA: Mandos & Olhar 🧠', time: '09:00', period: 'manhã' as const },

      { title: 'Lanche Comportamental 🍎', time: '10:00', period: 'manhã' as const },

      { title: 'Treino ABA: Imitação & Motor 🧠', time: '10:30', period: 'manhã' as const },

      { title: 'Pausa de Descompressão 🌙', time: '11:30', period: 'manhã' as const },

      { title: 'Almoço Cooperativo 🍎', time: '12:30', period: 'tarde' as const },

      { title: 'Brincar Dirigido (ABA) 🎮', time: '15:00', period: 'tarde' as const },

      { title: 'Rotina de Dormir 🌙', time: '20:30', period: 'noite' as const }

    ]

  },

  therapy_ot_speech: {

    name: "Terapia Ocupacional & Fono 🧼",

    description: "Dia focado em estimulação de fala, linguagem, motricidade fina e integração sensorial.",

    tasks: [

      { title: 'Escovação de Higiene 🫧', time: '08:30', period: 'manhã' as const },

      { title: 'Sessão de Fonoterapia 🗣️', time: '09:30', period: 'manhã' as const },

      { title: 'Terapia Ocupacional: Pegboard 🧼', time: '11:00', period: 'manhã' as const },

      { title: 'Almoço Saudável 🍎', time: '12:30', period: 'tarde' as const },

      { title: 'T.O.: Escovação Sensorial 🧼', time: '14:30', period: 'tarde' as const },

      { title: 'Fono: Leitura Compartilhada 🗣️', time: '16:00', period: 'tarde' as const },

      { title: 'Jantar em Família 🍎', time: '19:30', period: 'noite' as const }

    ]

  },

  therapy_motor: {

    name: "Fisio & Psicomotricidade 🏃",

    description: "Foco em motricidade ampla, alongamento, tônus postural e circuitos de equilíbrio.",

    tasks: [

      { title: 'Alongamento Matinal 🏃', time: '08:30', period: 'manhã' as const },

      { title: 'Fisioterapia: Bola Pilates 🩺', time: '09:30', period: 'manhã' as const },

      { title: 'Lanche Saudável 🍎', time: '10:30', period: 'manhã' as const },

      { title: 'Psicomotricidade: Circuito 🏃', time: '11:00', period: 'manhã' as const },

      { title: 'Almoço e Autonomia 🍎', time: '12:30', period: 'tarde' as const },

      { title: 'Atividade Física ao Ar Livre 🏃', time: '16:00', period: 'tarde' as const },

      { title: 'Banho Relaxante 🫧', time: '19:00', period: 'noite' as const }

    ]

  },

  therapy_emotions: {

    name: "Psicoterapia & Regulação 💬",

    description: "Foco em psicoeducação emocional, expressão de sentimentos e psicoterapia lúdica.",

    tasks: [

      { title: 'Diário das Emoções (Desenho) 📝', time: '09:00', period: 'manhã' as const },

      { title: 'Psicoterapia Infantil 💬', time: '10:30', period: 'manhã' as const },

      { title: 'Almoço Calmo 🍎', time: '12:30', period: 'tarde' as const },

      { title: 'Psicoterapia: Diálogo Emocional 💬', time: '15:30', period: 'tarde' as const },

      { title: 'Tempo Livre Relaxante 🌙', time: '17:00', period: 'tarde' as const },

      { title: 'Leitura para Acalmar 🌙', time: '20:30', period: 'noite' as const }

    ]

  }

};





const translateLogDetails = (details: string, locale: string) => {

  if (locale === 'pt') return details;

  let tDetails = details;

  if (locale === 'en') {

    tDetails = tDetails

      .replace(/Adicionou a tarefa rápida "(.*?)" na agenda de (.*?)\./g, 'Added quick task "$1" to the schedule of $2.')

      .replace(/Adicionou a tarefa "(.*?)" \(Duração: (.*?)min, Ícone: (.*?), Categoria: (.*?)\) às (.*?) \((.*?)\) na agenda de (.*?)\./g, 'Added task "$1" (Duration: $2min, Icon: $3, Category: $4) at $5 ($6) in the schedule for $7.')

      .replace(/Adicionou a tarefa "(.*?)" \(Duração: (.*?)min, Ícone: (.*?), Categoria: (.*?)\) às (.*?) \((.*?)\) em (.*?)\./g, 'Added task "$1" (Duration: $2min, Icon: $3, Category: $4) at $5 ($6) on $7.')

      .replace(/Adicionou a tarefa "(.*?)" \(Duração: (.*?)min, Ícone: (.*?), Categoria: (.*?)\) às (.*?) \((.*?)\) em todos os dias do mês\./g, 'Added task "$1" (Duration: $2min, Icon: $3, Category: $4) at $5 ($6) on all days of the month.')

      .replace(/Carregou o modelo "(.*?)" na agenda de (.*?)\./g, 'Loaded model "$1" in the schedule of $2.')

      .replace(/Carregou o modelo "(.*?)" para todo o mês\./g, 'Loaded model "$1" for the entire month.')

      .replace(/Gravou áudio personalizado de transição \((.*?)\) para (.*?)\./g, 'Recorded custom transition audio ($1) for $2.')

      .replace(/Removeu o áudio personalizado de transição \((.*?)\) de (.*?)\./g, 'Removed custom transition audio ($1) of $2.')

      .replace(/Simulou crise sensorial no local "(.*?)" com latitude: (.*?), longitude: (.*?)\./g, 'Simulated sensory crisis at "$1" with latitude: $2, longitude: $3.')

      .replace(/Atualizou o checkpoint clínico da Semana (.*?) \((.*?) - (.*?)\)\./g, 'Updated clinical checkpoint for Week $1 ($2 - $3).')

      .replace(/Copiou em bloco a rotina de (.*?) para (.*?)\./g, 'Copied in block the routine from $1 to $2.')

      .replace(/Adicionou checkpoint clínico para a data (.*?) \((.*?) - (.*?)\)\./g, 'Added clinical checkpoint for date $1 ($2 - $3).')

      .replace(/Cadastrou uma nova criança: (.*?) \(Gênero: (.*?), Diagnóstico: (.*?), Data de Nasc\.: (.*?)\)\./g, 'Registered a new child: $1 (Gender: $2, Diagnosis: $3, Birth Date: $4).')

            .replace(/Excluiu o perfil de criança: (.*?)\./g, 'Deleted child profile: $1.')

      .replace(/SOS Sensorial ativado pela criança no aplicativo\./g, 'Sensory SOS activated by the child in the app.')

      .replace(/Criança indicou Bateria Emocional: Cheia\/Ótimo 🔋/g, 'Child indicated Emotional Battery: Full/Great 🔋')

      .replace(/Criança indicou Bateria Emocional: Média\/Cansado ⚡/g, 'Child indicated Emotional Battery: Medium/Tired ⚡')

      .replace(/Criança indicou Bateria Emocional: Baixa\/Sobrecarregado 🪫/g, 'Child indicated Emotional Battery: Low/Overloaded 🪫')

      .replace(/Comunicação AAC: "(.*?)"/g, 'AAC Communication: "$1"')

      .replace(/Humor registrado pelo próprio usuário na rotina\./g, 'Mood registered by the user in the routine.')

      .replace(/Sobrecarga Sensorial/g, 'Sensory Overload')

      .replace(/Removeu a tarefa "(.*?)" de (.*?) \((.*?)\)\./g, 'Removed task "$1" from $2 ($3).')

      .replace(/Editou a tarefa "(.*?)" \(Duração: (.*?)min, Ícone: (.*?), Categoria: (.*?)\) às (.*?) \((.*?)\) na (.*?)\./g, 'Edited task "$1" (Duration: $2min, Icon: $3, Category: $4) at $5 ($6) on $7.')

      .replace(/Atualizou o perfil de (.*?): Hiperfoco: "(.*?)", Bloqueio Infantil: "(.*?)" \(PIN: (.*?)\), Velocidade Fala: (.*?)x, Efeito Sonoro: "(.*?)", Visual: "(.*?)", Perfil Sensorial: "(.*?)", Estilo Timer: "(.*?)", Reforçador: "(.*?)" \((.*?) estrelas\), Alerta de Transição: (.*?)min\./g, 'Updated profile of $1: Hyperfocus: "$2", Child Lock: "$3" (PIN: $4), Speech Speed: $5x, Sound Effect: "$6", Visual: "$7", Sensory Profile: "$8", Timer Style: "$9", Reinforcer: "$10" ($11 stars), Transition Alert: $12min.')

      .replace(/Restaurou toda a rotina semanal para o modelo padrão da clínica\./g, 'Restored the entire weekly routine to the clinic standard model.')

      .replace(/Limpou toda a grade de tarefas semanais\./g, 'Cleared the entire weekly task grid.')

      .replace(/Registrou desregulação sensorial para (.*?): "(.*?)"/g, 'Registró desregulación sensorial para $1: "$2"')

      .replace(/Manhã/g, 'Morning').replace(/Tarde/g, 'Afternoon').replace(/Noite/g, 'Night')

      .replace(/segunda/g, 'monday').replace(/terca/g, 'tuesday').replace(/quarta/g, 'wednesday')

      .replace(/quinta/g, 'thursday').replace(/sexta/g, 'friday').replace(/sabado/g, 'saturday').replace(/domingo/g, 'sunday')

      .replace(/Masculino/g, 'Male').replace(/Feminino/g, 'Female')

      .replace(/Não Informado/g, 'Not Informed');

  } else if (locale === 'es') {

    tDetails = tDetails

      .replace(/Adicionou a tarefa rápida "(.*?)" na agenda de (.*?)\./g, 'Agregó la tarea rápida "$1" a la agenda de $2.')

      .replace(/Adicionou a tarefa "(.*?)" \(Duração: (.*?)min, Ícone: (.*?), Categoria: (.*?)\) às (.*?) \((.*?)\) na agenda de (.*?)\./g, 'Agregó la tarea "$1" (Duración: $2min, Icono: $3, Categoría: $4) a las $5 ($6) en la agenda de $7.')

      .replace(/Adicionou a tarefa "(.*?)" \(Duração: (.*?)min, Ícone: (.*?), Categoria: (.*?)\) às (.*?) \((.*?)\) em (.*?)\./g, 'Agregó la tarea "$1" (Duración: $2min, Icono: $3, Categoría: $4) a las $5 ($6) en $7.')

      .replace(/Adicionou a tarefa "(.*?)" \(Duração: (.*?)min, Ícone: (.*?), Categoria: (.*?)\) às (.*?) \((.*?)\) em todos os dias do mês\./g, 'Agregó la tarea "$1" (Duración: $2min, Icono: $3, Categoría: $4) a las $5 ($6) en todos los días del mes.')

      .replace(/Carregou o modelo "(.*?)" na agenda de (.*?)\./g, 'Cargó el modelo "$1" en la agenda de $2.')

      .replace(/Carregou o modelo "(.*?)" para todo o mês\./g, 'Cargó el modelo "$1" para todo el mes.')

      .replace(/Gravou áudio personalizado de transição \((.*?)\) para (.*?)\./g, 'Grabó audio de transición personalizado ($1) para $2.')

      .replace(/Removeu o áudio personalizado de transição \((.*?)\) de (.*?)\./g, 'Eliminó el audio de transición personalizado ($1) de $2.')

      .replace(/Simulou crise sensorial no local "(.*?)" com latitude: (.*?), longitude: (.*?)\./g, 'Simuló crisis sensorial en el lugar "$1" con latitud: $2, longitud: $3.')

      .replace(/Atualizou o checkpoint clínico da Semana (.*?) \((.*?) - (.*?)\)\./g, 'Actualizó el punto de control clínico de la Semana $1 ($2 - $3).')

      .replace(/Copiou em bloco a rotina de (.*?) para (.*?)\./g, 'Copió en bloque la rutina de $1 a $2.')

      .replace(/Adicionou checkpoint clínico para a data (.*?) \((.*?) - (.*?)\)\./g, 'Agregó punto de control clínico para la fecha $1 ($2 - $3).')

      .replace(/Cadastrou uma nova criança: (.*?) \(Gênero: (.*?), Diagnóstico: (.*?), Data de Nasc\.: (.*?)\)\./g, 'Registró un nuevo niño: $1 (Género: $2, Diagnóstico: $3, Fecha de Nac.: $4).')

            .replace(/Excluiu o perfil de criança: (.*?)\./g, 'Eliminó el perfil del niño: $1.')

      .replace(/SOS Sensorial ativado pela criança no aplicativo\./g, 'SOS Sensorial activado por el niño en la aplicación.')

      .replace(/Criança indicou Bateria Emocional: Cheia\/Ótimo 🔋/g, 'El niño indicó Batería Emocional: Llena/Excelente 🔋')

      .replace(/Criança indicou Bateria Emocional: Média\/Cansado ⚡/g, 'El niño indicó Batería Emocional: Media/Cansado ⚡')

      .replace(/Criança indicou Bateria Emocional: Baixa\/Sobrecarregado 🪫/g, 'El niño indicó Batería Emocional: Baja/Sobrecargado 🪫')

      .replace(/Comunicação AAC: "(.*?)"/g, 'Comunicación AAC: "$1"')

      .replace(/Humor registrado pelo próprio usuário na rotina\./g, 'Humor registrado por el propio usuario en la rutina.')

      .replace(/Sobrecarga Sensorial/g, 'Sobrecarga Sensorial')

      .replace(/Removeu a tarefa "(.*?)" de (.*?) \((.*?)\)\./g, 'Eliminó la tarefa "$1" de $2 ($3).')

      .replace(/Editou a tarefa "(.*?)" \(Duração: (.*?)min, Ícone: (.*?), Categoria: (.*?)\) às (.*?) \((.*?)\) na (.*?)\./g, 'Editó la tarea "$1" (Duración: $2min, Icono: $3, Categoría: $4) a las $5 ($6) en $7.')

      .replace(/Atualizou o perfil de (.*?): Hiperfoco: "(.*?)", Bloqueio Infantil: "(.*?)" \(PIN: (.*?)\), Velocidade Fala: (.*?)x, Efeito Sonoro: "(.*?)", Visual: "(.*?)", Perfil Sensorial: "(.*?)", Estilo Timer: "(.*?)", Reforçador: "(.*?)" \((.*?) estrelas\), Alerta de Transição: (.*?)min\./g, 'Actualizó el perfil de $1: Hiperenfoque: "$2", Bloqueio Infantil: "$3" (PIN: $4), Velocidad de Habla: $5x, Efecto de Sonido: "$6", Visual: "$7", Perfil Sensorial: "$8", Estilo de Temporizador: "$9", Reforzador: "$10" ($11 estrellas), Alerta de Transición: $12min.')

      .replace(/Restaurou toda a rotina semanal para o modelo padrão da clínica\./g, 'Restauró toda la rutina semanal al modelo estándar de la clínica.')

      .replace(/Limpou toda a grade de tarefas semanais\./g, 'Limpió toda la cuadrícula de tareas semanales.')

      .replace(/Registrou desregulação sensorial para (.*?): "(.*?)"/g, 'Registró desregulación sensorial para $1: "$2"')

      .replace(/Manhã/g, 'Mañana').replace(/Tarde/g, 'Tarde').replace(/Noite/g, 'Noche')

      .replace(/segunda/g, 'lunes').replace(/terca/g, 'martes').replace(/quarta/g, 'miércoles')

      .replace(/quinta/g, 'jueves').replace(/sexta/g, 'viernes').replace(/sabado/g, 'sábado').replace(/domingo/g, 'domingo')

      .replace(/Masculino/g, 'Masculino').replace(/Feminino/g, 'Femenino')

      .replace(/Não Informado/g, 'No Informado');

  }

  return tDetails;

};



function ParentDashboardContent() {

  const { t, locale } = useLanguage();



  const PRESETS = [

    { title: t.dashboard.presets[0], icon: '🪥', time: '08:00', period: 'manhã' as const },

    { title: t.dashboard.presets[1], icon: '🧼', time: '08:30', period: 'manhã' as const },

    { title: t.dashboard.presets[2], icon: '🍳', time: '09:00', period: 'manhã' as const },

    { title: t.dashboard.presets[3], icon: '🏫', time: '13:00', period: 'tarde' as const },

    { title: t.dashboard.presets[4], icon: '📝', time: '17:30', period: 'tarde' as const },

    { title: t.dashboard.presets[5], icon: '🍽️', time: '19:30', period: 'noite' as const },

    { title: t.dashboard.presets[6], icon: '🛌', time: '21:30', period: 'noite' as const },

    { title: t.dashboard.presets[7], icon: '🧠', time: '09:00', period: 'manhã' as const },

    { title: t.dashboard.presets[8], icon: '🧼', time: '14:00', period: 'tarde' as const },

    { title: t.dashboard.presets[9], icon: '🗣️', time: '10:30', period: 'manhã' as const },

    { title: t.dashboard.presets[10], icon: '🩺', time: '15:30', period: 'tarde' as const },

    { title: t.dashboard.presets[11], icon: '💬', time: '16:00', period: 'tarde' as const },

    { title: t.dashboard.presets[12], icon: '🏃', time: '11:00', period: 'manhã' as const },

    { title: t.dashboard.presets[13], icon: '🎵', time: '15:00', period: 'tarde' as const },

    { title: t.dashboard.presets[14], icon: '📚', time: '16:30', period: 'tarde' as const }

  ];



  const CLINICAL_TEMPLATES = {

    standard: {

      name: locale === 'es' ? "Rutina Clínica Estándar 🧭" : locale === 'en' ? "Standard Clinical Routine 🧭" : "Rotina Clínica Padrão 🧭",

      description: locale === 'es' ? "Equilibrada con higiene, estudio y ocio durante toda la semana." : locale === 'en' ? "Balanced with hygiene, study, and leisure throughout the week." : "Equilibrada com higiene, estudo e lazer ao longo de toda a semana.",

      tasks: [

        { title: locale === 'es' ? 'Cepillarse los dientes' : locale === 'en' ? 'Brush teeth' : 'Escovar os dentes', time: '08:00', period: 'manhã' as const },

        { title: locale === 'es' ? 'Tomar el desayuno' : locale === 'en' ? 'Have breakfast' : 'Tomar café da manhã', time: '08:30', period: 'manhã' as const },

        { title: locale === 'es' ? 'Clases y estudio' : locale === 'en' ? 'Classes and study' : 'Aulas e Estudo', time: '09:00', period: 'manhã' as const },

        { title: locale === 'es' ? 'Almuerzo saludable' : locale === 'en' ? 'Healthy lunch' : 'Almoço Saudável', time: '12:30', period: 'tarde' as const },

        { title: locale === 'es' ? 'Jugar con el Collie' : locale === 'en' ? 'Play with the Collie' : 'Brincar com o Collie', time: '15:00', period: 'tarde' as const },

        { title: locale === 'es' ? 'Cena familiar' : locale === 'en' ? 'Family dinner' : 'Jantar em Família', time: '19:00', period: 'noite' as const },

        { title: locale === 'es' ? 'Bañarse y dormir' : locale === 'en' ? 'Take a bath and sleep' : 'Tomar Banho e Dormir', time: '21:00', period: 'noite' as const }

      ]

    },

    sensory_focus: {

      name: locale === 'es' ? "Enfoque en Regulación Sensorial 🧘" : locale === 'en' ? "Sensory Regulation Focus 🧘" : "Foco em Regulação Sensorial 🧘",

      description: locale === 'es' ? "Ideal para días de sobrecarga o desregulación sensorial. Menos exigencia académica." : locale === 'en' ? "Ideal for days of overload or sensory dysregulation. Less academic demand." : "Ideal para dias de sobrecarga ou desregulação sensorial. Menos cobrança acadêmica.",

      tasks: [

        { title: locale === 'es' ? 'Estiramiento suave' : locale === 'en' ? 'Gentle stretching' : 'Alongamento Suave', time: '08:00', period: 'manhã' as const },

        { title: locale === 'es' ? 'Higiene y cepillado' : locale === 'en' ? 'Hygiene and brushing' : 'Higiene e Escovação', time: '08:30', period: 'manhã' as const },

        { title: locale === 'es' ? 'Pausa de descompresión' : locale === 'en' ? 'Decompression break' : 'Pausa de Descompressão', time: '10:30', period: 'manhã' as const },

        { title: locale === 'es' ? 'Almuerzo tranquilo' : locale === 'en' ? 'Calm lunch' : 'Almoço Calmo', time: '12:30', period: 'tarde' as const },

        { title: locale === 'es' ? 'Actividad motora libre' : locale === 'en' ? 'Free motor activity' : 'Atividade Motora Livre', time: '14:30', period: 'tarde' as const },

        { title: locale === 'es' ? 'Refugio sensorial' : locale === 'en' ? 'Sensory refuge' : 'Refúgio Sensorial', time: '16:30', period: 'tarde' as const },

        { title: locale === 'es' ? 'Baño tibio relajante' : locale === 'en' ? 'Relaxing warm bath' : 'Banho Morno Relaxante', time: '19:00', period: 'noite' as const },

        { title: locale === 'es' ? 'Lectura y calmaria' : locale === 'en' ? 'Reading and calm' : 'Leitura e Calmaria', time: '20:30', period: 'noite' as const }

      ]

    },

    weekend_play: {

      name: locale === 'es' ? "Fin de Semana Lúdico 🎈" : locale === 'en' ? "Playful Weekend 🎈" : "Fim de Semana Lúdico 🎈",

      description: locale === 'es' ? "Foco en autonomía, socialización y actividades al aire libre con flexibilidad." : locale === 'en' ? "Focus on autonomy, socialization, and outdoor activities with flexibility." : "Foco em autonomia, socialização e atividades ao ar livre com flexibilidade.",

      tasks: [

        { title: locale === 'es' ? 'Desayuno especial' : locale === 'en' ? 'Special breakfast' : 'Café Especial', time: '09:00', period: 'manhã' as const },

        { title: locale === 'es' ? 'Organizar juguetes' : locale === 'en' ? 'Organize toys' : 'Organizar Brinquedos', time: '10:00', period: 'manhã' as const },

        { title: locale === 'es' ? 'Parque y naturaleza' : locale === 'en' ? 'Park and nature' : 'Parque e Natureza', time: '10:30', period: 'manhã' as const },

        { title: locale === 'es' ? 'Almuerzo en familia' : locale === 'en' ? 'Family lunch' : 'Almoço em Família', time: '13:00', period: 'tarde' as const },

        { title: locale === 'es' ? 'Tiempo libre (Hiperenfoque)' : locale === 'en' ? 'Free time (Hyperfocus)' : 'Tempo Livre (Hiperfoco)', time: '15:30', period: 'tarde' as const },

        { title: locale === 'es' ? 'Cena familiar' : locale === 'en' ? 'Family dinner' : 'Jantar em Família', time: '19:30', period: 'noite' as const },

        { title: locale === 'es' ? 'Higiene y dormir' : locale === 'en' ? 'Hygiene and sleep' : 'Higiene e Dormir', time: '21:00', period: 'noite' as const }

      ]

    },

    therapy_aba: {

      name: locale === 'es' ? "Rutina Terapéutica ABA 🧠" : locale === 'en' ? "ABA Therapy Routine 🧠" : "Rotina Terapêutica ABA 🧠",

      description: locale === 'es' ? "Estructurada con sesiones ABA de mandos, imitación, merienda social y pausas reguladoras." : locale === 'en' ? "Structured with ABA sessions of mands, imitation, social snack, and regulating breaks." : "Estruturada com sessões ABA de mandos, imitação, lanche social e pausas reguladoras.",

      tasks: [

        { title: locale === 'es' ? 'Higiene matutina 🫧' : locale === 'en' ? 'Morning Hygiene 🫧' : 'Higiene da Manhã 🫧', time: '08:00', period: 'manhã' as const },

        { title: locale === 'es' ? 'Entrenamiento ABA: Mandos y Mirada 🧠' : locale === 'en' ? 'ABA Training: Mands & Eye Contact 🧠' : 'Treino ABA: Mandos & Olhar 🧠', time: '09:00', period: 'manhã' as const },

        { title: locale === 'es' ? 'Merienda conductual 🍎' : locale === 'en' ? 'Behavioral Snack 🍎' : 'Lanche Comportamental 🍎', time: '10:00', period: 'manhã' as const },

        { title: locale === 'es' ? 'Entrenamiento ABA: Imitación y Motor 🧠' : locale === 'en' ? 'ABA Training: Imitation & Motor 🧠' : 'Treino ABA: Imitação & Motor 🧠', time: '10:30', period: 'manhã' as const },

        { title: locale === 'es' ? 'Pausa de descompresión 🌙' : locale === 'en' ? 'Decompression Break 🌙' : 'Pausa de Descompressão 🌙', time: '11:30', period: 'manhã' as const },

        { title: locale === 'es' ? 'Almuerzo cooperativo 🍎' : locale === 'en' ? 'Cooperative Lunch 🍎' : 'Almoço Cooperativo 🍎', time: '12:30', period: 'tarde' as const },

        { title: locale === 'es' ? 'Juego dirigido (ABA) 🎮' : locale === 'en' ? 'Directed Play (ABA) 🎮' : 'Brincar Dirigido (ABA) 🎮', time: '15:00', period: 'tarde' as const },

        { title: locale === 'es' ? 'Rutina de dormir 🌙' : locale === 'en' ? 'Bedtime Routine 🌙' : 'Rotina de Dormir 🌙', time: '20:30', period: 'noite' as const }

      ]

    },

    therapy_ot_speech: {

      name: locale === 'es' ? "Terapia Ocupacional y Fonoaudiología 🧼" : locale === 'en' ? "Occupational Therapy & Speech 🧼" : "Terapia Ocupacional & Fono 🧼",

      description: locale === 'es' ? "Día enfocado en estimulación de habla, lenguaje, motricidad fina e integración sensorial." : locale === 'en' ? "Day focused on speech stimulation, language, fine motor skills, and sensory integration." : "Dia focado em estimulação de fala, linguagem, motricidade fina e integração sensorial.",

      tasks: [

        { title: locale === 'es' ? 'Cepillado de higiene 🫧' : locale === 'en' ? 'Hygiene Brushing 🫧' : 'Escovação de Higiene 🫧', time: '08:30', period: 'manhã' as const },

        { title: locale === 'es' ? 'Sesión de fonoaudiología 🗣️' : locale === 'en' ? 'Speech Therapy Session 🗣️' : 'Sessão de Fonoterapia 🗣️', time: '09:30', period: 'manhã' as const },

        { title: locale === 'es' ? 'Terapia Ocupacional: Tablero perforado 🧼' : locale === 'en' ? 'Occupational Therapy: Pegboard 🧼' : 'Terapia Ocupacional: Pegboard 🧼', time: '11:00', period: 'manhã' as const },

        { title: locale === 'es' ? 'Almuerzo saludable 🍎' : locale === 'en' ? 'Healthy Lunch 🍎' : 'Almoço Saudável 🍎', time: '12:30', period: 'tarde' as const },

        { title: locale === 'es' ? 'T.O.: Cepillado sensorial 🧼' : locale === 'en' ? 'O.T.: Sensory Brushing 🧼' : 'T.O.: Escovação Sensorial 🧼', time: '14:30', period: 'tarde' as const },

        { title: locale === 'es' ? 'Fono: Lectura compartida 🗣️' : locale === 'en' ? 'Speech: Shared Reading 🗣️' : 'Fono: Leitura Compartilhada 🗣️', time: '16:00', period: 'tarde' as const },

        { title: locale === 'es' ? 'Cena familiar 🍎' : locale === 'en' ? 'Family Dinner 🍎' : 'Jantar em Família 🍎', time: '19:30', period: 'noite' as const }

      ]

    },

    therapy_motor: {

      name: locale === 'es' ? "Fisioterapia y Psicomotricidad 🏃" : locale === 'en' ? "Physio & Psychomotricity 🏃" : "Fisio & Psicomotricidade 🏃",

      description: locale === 'es' ? "Enfoque en motricidad gruesa, estiramiento, tono postural y circuitos de equilibrio." : locale === 'en' ? "Focus on gross motor skills, stretching, postural tone, and balance circuits." : "Foco em motricidade ampla, alongamento, tônus postural e circuitos de equilíbrio.",

      tasks: [

        { title: locale === 'es' ? 'Estiramiento matutino 🏃' : locale === 'en' ? 'Morning Stretching 🏃' : 'Alongamento Matinal 🏃', time: '08:30', period: 'manhã' as const },

        { title: locale === 'es' ? 'Fisioterapia: Pelota de Pilates 🩺' : locale === 'en' ? 'Physical Therapy: Pilates Ball 🩺' : 'Fisioterapia: Bola Pilates 🩺', time: '09:30', period: 'manhã' as const },

        { title: locale === 'es' ? 'Merienda saludable 🍎' : locale === 'en' ? 'Healthy Snack 🍎' : 'Lanche Saudável 🍎', time: '10:30', period: 'manhã' as const },

        { title: locale === 'es' ? 'Psicomotricidad: Circuito 🏃' : locale === 'en' ? 'Psychomotricity: Circuit 🏃' : 'Psicomotricidade: Circuito 🏃', time: '11:00', period: 'manhã' as const },

        { title: locale === 'es' ? 'Almuerzo y autonomía 🍎' : locale === 'en' ? 'Lunch and Autonomy 🍎' : 'Almoço e Autonomia 🍎', time: '12:30', period: 'tarde' as const },

        { title: locale === 'es' ? 'Actividad física al aire libre 🏃' : locale === 'en' ? 'Outdoor Physical Activity 🏃' : 'Atividade Física ao Ar Livre 🏃', time: '16:00', period: 'tarde' as const },

        { title: locale === 'es' ? 'Baño relajante 🫧' : locale === 'en' ? 'Relaxing Bath 🫧' : 'Banho Relaxante 🫧', time: '19:00', period: 'noite' as const }

      ]

    },

    therapy_emotions: {

      name: locale === 'es' ? "Psicoterapia y Regulación 💬" : locale === 'en' ? "Psychotherapy & Regulation 💬" : "Psicoterapia & Regulação 💬",

      description: locale === 'es' ? "Enfoque en psicoeducación emocional, expresión de sentimientos y psicoterapia lúdica." : locale === 'en' ? "Focus on emotional psychoeducation, expression of feelings, and playful psychotherapy." : "Foco em psicoeducação emocional, expressão de sentimentos e psicoterapia lúdica.",

      tasks: [

        { title: locale === 'es' ? 'Diario de emociones (Dibujo) 📝' : locale === 'en' ? 'Emotions Diary (Drawing) 📝' : 'Diário das Emoções (Desenho) 📝', time: '09:00', period: 'manhã' as const },

        { title: locale === 'es' ? 'Psicoterapia infantil 💬' : locale === 'en' ? 'Child Psychotherapy 💬' : 'Psicoterapia Infantil 💬', time: '10:30', period: 'manhã' as const },

        { title: locale === 'es' ? 'Almuerzo tranquilo 🍎' : locale === 'en' ? 'Calm Lunch 🍎' : 'Almoço Calmo 🍎', time: '12:30', period: 'tarde' as const },

        { title: locale === 'es' ? 'Psicoterapia: Diálogo emocional 💬' : locale === 'en' ? 'Psychotherapy: Emotional Dialogue 💬' : 'Psicoterapia: Diálogo Emocional 💬', time: '15:30', period: 'tarde' as const },

        { title: locale === 'es' ? 'Tiempo libre relajante 🌙' : locale === 'en' ? 'Relaxing Free Time 🌙' : 'Tempo Livre Relaxante 🌙', time: '17:00', period: 'tarde' as const },

        { title: locale === 'es' ? 'Lectura para calmar 🌙' : locale === 'en' ? 'Reading to Calm Down 🌙' : 'Leitura para Acalmar 🌙', time: '20:30', period: 'noite' as const }

      ]

    }

  };



  const GENERATOR_STATUSES = t.dashboard.statusGenerator;

  const CLINICAL_TIPS = t.dashboard.clinicalTips;



  const router = useRouter();

  const searchParams = useSearchParams();

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  const [offline, setOffline] = useState(false);

  const [offlineQueueSize, setOfflineQueueSize] = useState(0);



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

  

  // Mascot Collie state for parent dashboard

  const [collieState, setCollieState] = useState<CollieState>('idle');

  const [activeTipIdx, setActiveTipIdx] = useState(0);



  // States for simplified visual layout

  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});

  const [activeSidebarTool, setActiveSidebarTool] = useState<'none' | 'aac' | 'stories' | 'dictionary' | 'voice'>('none');

  const [sidebarCollapsedStates, setSidebarCollapsedStates] = useState<Record<string, boolean>>({

    profile: false,

    monitoring: false,

    tools: true,

    actions: true,

  });



  const rotateTip = () => {

    setActiveTipIdx(prev => (prev + 1) % CLINICAL_TIPS.length);

  };



  const handleMiniCollieClick = () => {

    setCollieState('celebrating');

    playMarimba(329.63, 0.3);

    setTimeout(() => {

      setCollieState('idle');

    }, 2000);

  };







  // Add Preset Task automatically with 1-click

  const handleAddPreset = async (preset: typeof PRESETS[0]) => {

    const activeDayTasks = tasks.filter(t => t.day === activeDayFilter);

    if (plan === 'free' && activeDayTasks.length >= 3) {

      playMarimba(180, 0.2);

      setShowPaywall(true);

      return;

    }



    playMarimba(392, 0.4);

    setCollieState('celebrating');

    setTimeout(() => setCollieState('idle'), 2000);

    rotateTip();



    try {

      await firebaseBridge.db.addTask({

        title: preset.title,

        time: preset.time,

        period: preset.period,

        day: activeDayFilter,

        icon: preset.icon || '📅'

      });



      const dayLabel = getDayLabel(activeDayFilter, locale).replace(/ 📅| ☀️/, '');

      await immutableLogger.logChange(

        'ADD_TASK', 

        `Adicionou a tarefa rápida "${preset.title}" na agenda de ${dayLabel}.`,

        currentUser?.email

      );



      triggerStatus(t.dashboard.statusQuickTaskAdded);

    } catch (err) {

      triggerStatus('Erro ao adicionar preset.');

    }

  };



  // Load a complete Clinical Preset Template for a Day or the Entire Month

  const handleLoadTemplate = async (templateKey: keyof typeof CLINICAL_TEMPLATES, target: 'day' | 'month') => {

    const template = CLINICAL_TEMPLATES[templateKey];

    

    // Check billing constraints (limits)

    if (plan === 'free') {

      if (target === 'day' && template.tasks.length > 3) {

        playMarimba(180, 0.2);

        setShowPaywall(true);

        return;

      }

      if (target === 'month') {

        playMarimba(180, 0.2);

        setShowPaywall(true);

        return;

      }

    }



    const confirmMsg = target === 'day'

      ? (locale === 'es'

          ? `¿Realmente desea cargar el modelo "${template.name}" para el día actual? Esto reemplazará las tareas existentes de ${getDayLabel(activeDayFilter, locale).replace(/ 📅| ☀️/, '')}.`

          : locale === 'en'

            ? `Do you really want to load the template "${template.name}" for the current day? This will replace the existing tasks for ${getDayLabel(activeDayFilter, locale).replace(/ 📅| ☀️/, '')}.`

            : `Deseja realmente carregar o modelo "${template.name}" para o dia atual? Isso substituirá as tarefas existentes de ${getDayLabel(activeDayFilter, locale).replace(/ 📅| ☀️/, '')}.`)

      : (locale === 'es'

          ? `¿Realmente desea cargar el modelo "${template.name}" para TODOS LOS DÍAS del mes? Esto reemplazará todas las tareas existentes del día 1 al 31.`

          : locale === 'en'

            ? `Do you really want to load the template "${template.name}" for ALL DAYS of the month? This will replace all existing tasks from day 1 to 31.`

            : `Deseja realmente carregar o modelo "${template.name}" para TODOS OS DIAS do mês? Isso substituirá todas as tarefas existentes do dia 1 ao 31.`);



    if (!window.confirm(confirmMsg)) return;



    playMarimba(329, 0.4);

    setCollieState('celebrating');

    setTimeout(() => setCollieState('idle'), 2000);



    try {

      if (target === 'day') {

        // Keep other days, but replace tasks of active day

        const otherDaysTasks = tasks.filter(t => t.day !== activeDayFilter);

        const newDayTasks = template.tasks.map((t, idx) => ({

          ...t,

          day: activeDayFilter,

          id: Math.random().toString(36).substring(2, 11),

          isCompleted: false,

          order: idx + 1

        }));

        

        await firebaseBridge.db.loadTemplate([...otherDaysTasks, ...newDayTasks]);

        

        const dayLabel = getDayLabel(activeDayFilter, locale).replace(/ 📅| ☀️/, '');

        await immutableLogger.logChange(

          'RESET_ROUTINE',

          `Carregou o modelo "${template.name}" na agenda de ${dayLabel}.`,

          currentUser?.email

        );

        triggerStatus(`Modelo aplicado para ${dayLabel}!`);

      } else {

        // Replace all month tasks

        const allNewTasks: any[] = [];

        DAYS_OF_MONTH.forEach(day => {

          template.tasks.forEach((t, idx) => {

            allNewTasks.push({

              ...t,

              day: day.key,

              id: Math.random().toString(36).substring(2, 11),

              isCompleted: false,

              order: idx + 1

            });

          });

        });

        

        await firebaseBridge.db.loadTemplate(allNewTasks);

        

        await immutableLogger.logChange(

          'RESET_ROUTINE',

          `Carregou o modelo "${template.name}" para todo o mês.`,

          currentUser?.email

        );

        triggerStatus(`Modelo aplicado para todo o mês!`);

      }

    } catch (err) {

      triggerStatus('Erro ao carregar modelo.');

    }

  };

  

  // Real-time states



  const [tasks, setTasks] = useState<Task[]>([]);

  const [logs, setLogs] = useState<AuditLog[]>([]);

  

  // Child States

  const [children, setChildren] = useState<any[]>([]);

  const [activeChild, setActiveChild] = useState<any | null>(null);

  const [newChildModalOpen, setNewChildModalOpen] = useState(false);



  // Custom AAC States

  const [aacItemsList, setAacItemsList] = useState<any[]>([]);

  const [newAacEmoji, setNewAacEmoji] = useState('🤗');

  const [newAacText, setNewAacText] = useState('');

  const [newAacSpeech, setNewAacSpeech] = useState('');

  const [newAacAlert, setNewAacAlert] = useState(false);



  // Custom Social Stories States

  const [customStoriesList, setCustomStoriesList] = useState<any[]>([]);

  const [newStoryTitle, setNewStoryTitle] = useState('');

  const [newStoryDesc, setNewStoryDesc] = useState('');

  const [aiTheme, setAiTheme] = useState('');

  const [generatingAi, setGeneratingAi] = useState(false);

  const [aiStatusIdx, setAiStatusIdx] = useState(0);



  // Alertas de Voz Familiar & GPS Simulation States

  const [recordingType, setRecordingType] = useState<'audioAlert10' | 'audioAlert5' | 'audioAlert2' | null>(null);

  const [recordingSecondsLeft, setRecordingSecondsLeft] = useState(10);

  const [isPlayingAudio, setIsPlayingAudio] = useState<'audioAlert10' | 'audioAlert5' | 'audioAlert2' | null>(null);

  const [simulatingGps, setSimulatingGps] = useState(false);



  const preferencesMenuRef = React.useRef<HTMLDivElement>(null);
  const batteryPopoverRef = React.useRef<HTMLDivElement>(null);
  const dailyTrackingPopoverRef = React.useRef<HTMLDivElement>(null);
  const [showPreferencesMenu, setShowPreferencesMenu] = useState(false);
  const [showBatteryPopover, setShowBatteryPopover] = useState(false);
  const [showDailyTrackingPopover, setShowDailyTrackingPopover] = useState(false);
  const [activePrefTab, setActivePrefTab] = useState<'conta' | 'sensorial' | 'seguranca' | 'plano'>('conta');
  const [newPassword, setNewPassword] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Load and apply theme
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = (localStorage.getItem('tea_theme') || 'light') as 'light' | 'dark';
      setTheme(savedTheme);
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, []);

  const toggleTheme = () => {
    playBubble();
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('tea_theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);

  const audioChunksRef = React.useRef<Blob[]>([]);

  const recordingIntervalRef = React.useRef<any>(null);

  const audioPlayRef = React.useRef<HTMLAudioElement | null>(null);



  // Clean up recording on unmount

  useEffect(() => {

    return () => {

      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);

      if (audioPlayRef.current) audioPlayRef.current.pause();

    };

  }, []);

  // Close preferences dropdown and popovers when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (preferencesMenuRef.current && !preferencesMenuRef.current.contains(event.target as Node)) {
        setShowPreferencesMenu(false);
      }
      if (batteryPopoverRef.current && !batteryPopoverRef.current.contains(event.target as Node)) {
        setShowBatteryPopover(false);
      }
      if (dailyTrackingPopoverRef.current && !dailyTrackingPopoverRef.current.contains(event.target as Node)) {
        setShowDailyTrackingPopover(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);



  // Start recording voice (10s max limit)

  const startRecording = async (type: 'audioAlert10' | 'audioAlert5' | 'audioAlert2') => {

    if (recordingType) return;

    playBubble();

    

    try {

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      audioChunksRef.current = [];

      

      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;

      

      mediaRecorder.ondataavailable = (event) => {

        if (event.data.size > 0) {

          audioChunksRef.current.push(event.data);

        }

      };

      

      mediaRecorder.onstop = async () => {

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

        const reader = new FileReader();

        reader.readAsDataURL(audioBlob);

        reader.onloadend = async () => {

          const base64Audio = reader.result as string;

          if (activeChild) {

            try {

              const updated = await firebaseBridge.auth.updateChildSettings(activeChild.id, {

                [type]: base64Audio

              });

              setActiveChild(updated);

              firebaseBridge.auth.setActiveChild(updated);

              setChildren(prev => prev.map(c => c.id === updated.id ? updated : c));

              

              await immutableLogger.logChange(

                'UPDATE_PROFILE',

                `Gravou áudio personalizado de transição (${type === 'audioAlert10' ? '10 min' : type === 'audioAlert5' ? '5 min' : '2 min'}) para ${activeChild.name}.`,

                currentUser?.email

              );

              triggerStatus(t.dashboard.statusAudioSaved);

            } catch (err) {

              triggerStatus(t.dashboard.statusAudioSaveError);

            }

          }

        };

        stream.getTracks().forEach(track => track.stop());

      };

      

      mediaRecorder.start();

      setRecordingType(type);

      setRecordingSecondsLeft(10);

      

      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);

      recordingIntervalRef.current = setInterval(() => {

        setRecordingSecondsLeft(prev => {

          if (prev <= 1) {

            stopRecording();

            return 0;

          }

          return prev - 1;

        });

      }, 1000);

      

    } catch (err) {

      console.error('Microphone access denied:', err);

      triggerStatus(t.dashboard.statusMicPermissionDenied);

    }

  };



  const stopRecording = () => {

    if (recordingIntervalRef.current) {

      clearInterval(recordingIntervalRef.current);

      recordingIntervalRef.current = null;

    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {

      mediaRecorderRef.current.stop();

    }

    setRecordingType(null);

    playMarimba(300, 0.2);

  };



  const playRecordedAudio = (type: 'audioAlert10' | 'audioAlert5' | 'audioAlert2') => {

    const audioData = activeChild?.[type];

    if (!audioData) return;

    

    if (isPlayingAudio === type && audioPlayRef.current) {

      audioPlayRef.current.pause();

      setIsPlayingAudio(null);

      return;

    }

    

    if (audioPlayRef.current) {

      audioPlayRef.current.pause();

    }

    

    const audio = new Audio(audioData);

    audioPlayRef.current = audio;

    setIsPlayingAudio(type);

    

    audio.play().catch(() => {

      triggerStatus(t.dashboard.statusAudioPlayError);

      setIsPlayingAudio(null);

    });

    

    audio.onended = () => {

      setIsPlayingAudio(null);

    };

  };



  const deleteRecordedAudio = async (type: 'audioAlert10' | 'audioAlert5' | 'audioAlert2') => {

    if (!activeChild) return;

    playMarimba(200, 0.2);

    

    try {

      const updated = await firebaseBridge.auth.updateChildSettings(activeChild.id, {

        [type]: null

      });

      setActiveChild(updated);

      firebaseBridge.auth.setActiveChild(updated);

      setChildren(prev => prev.map(c => c.id === updated.id ? updated : c));

      

      await immutableLogger.logChange(

        'UPDATE_PROFILE',

        `Removeu o áudio personalizado de transição (${type === 'audioAlert10' ? '10 min' : type === 'audioAlert5' ? '5 min' : '2 min'}) de ${activeChild.name}.`,

        currentUser?.email

      );

      triggerStatus(t.dashboard.statusAudioRemoved);

    } catch (err) {

      triggerStatus(t.dashboard.statusAudioRemoveError);

    }

  };



  const handleSimulateCrisisGps = async () => {

    if (!activeChild) return;

    setSimulatingGps(true);

    playBubble();

    

    let latitude = -23.5505;

    let longitude = -46.6333;

    

    if (typeof navigator !== 'undefined' && navigator.geolocation) {

      try {

        const position = await new Promise<GeolocationPosition>((resolve, reject) => {

          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000, enableHighAccuracy: true });

        });

        latitude = position.coords.latitude;

        longitude = position.coords.longitude;

      } catch (err) {

        console.warn('Real GPS access failed, simulating offset coords:', err);

        latitude += (Math.random() - 0.5) * 0.02;

        longitude += (Math.random() - 0.5) * 0.02;

      }

    } else {

      latitude += (Math.random() - 0.5) * 0.02;

      longitude += (Math.random() - 0.5) * 0.02;

    }

    

    const locations = ['Supermercado', 'Shopping', 'Terapia ABA', 'Parque', 'Escola'];

    const triggers = ['Barulho Elevado', 'Luz Estroboscópica / Forte', 'Transição de Atividade', 'Multidão'];

    const notes = [

      'Teve uma sobrecarga leve devido ao barulho de secador de mãos.',

      'Meltdown moderado no setor de brinquedos por frustração e luz forte.',

      'Dificuldade de transição com choro intenso ao sair do carro.',

      'Hipersensibilidade tátil a texturas de roupas novas no shopping.'

    ];

    

    const randomLoc = locations[Math.floor(Math.random() * locations.length)];

    const randomTrigger = triggers[Math.floor(Math.random() * triggers.length)];

    const randomNote = notes[Math.floor(Math.random() * notes.length)];

    

    try {

      const newLog = await firebaseBridge.db.addSensoryLog({

        childId: activeChild.id,

        crisisOccurred: true,

        notes: `Simulação: ${randomNote}`,

        decibels: 75 + Math.floor(Math.random() * 20),

        lightLevel: 'Alta',

        location: randomLoc,

        trigger: randomTrigger,

        antecedent: 'Ambiente novo com muitos estímulos visuais e auditivos.',

        behavior: 'Criança tapou os ouvidos, sentou no chão e chorou continuamente.',

        consequence: 'Retirada imediata para local calmo com abafador de ruídos.',

        latitude,

        longitude

      });

      

      setSensoryLogs(prev => [newLog, ...prev]);

      triggerStatus(t.dashboard.statusSimulationRegistered);

      

      await immutableLogger.logChange(

        'ADD_TASK',

        `Simulou crise sensorial no local "${randomLoc}" com latitude: ${latitude.toFixed(4)}, longitude: ${longitude.toFixed(4)}.`,

        currentUser?.email

      );

    } catch (err) {

      triggerStatus(t.dashboard.statusSimulationSaveError);

    } finally {

      setSimulatingGps(false);

    }

  };

  const [newChildName, setNewChildName] = useState('');

  const [newChildBirthDate, setNewChildBirthDate] = useState('');

  const [newChildGender, setNewChildGender] = useState('Não Informado');

  const [newChildDiagnosis, setNewChildDiagnosis] = useState('Não Informado');

  const [registeringChild, setRegisteringChild] = useState(false);



  // Form states

  const [title, setTitle] = useState('');

  const [time, setTime] = useState('08:00');

  const [period, setPeriod] = useState<'manhã' | 'tarde' | 'noite'>('manhã');

  const [taskIcon, setTaskIcon] = useState('📅');

  const [taskCategory, setTaskCategory] = useState<'AVD' | 'Aprendizado' | 'Lazer'>('AVD');

  const [taskDuration, setTaskDuration] = useState(30);

  const [taskDescription, setTaskDescription] = useState('');

  const [recurrenceMode, setRecurrenceMode] = useState<'single' | 'weekday' | 'monthly'>('single');



  // Edit states for single tasks

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const [editTaskTitle, setEditTaskTitle] = useState('');

  const [editTaskTime, setEditTaskTime] = useState('08:00');

  const [editTaskPeriod, setEditTaskPeriod] = useState<'manhã' | 'tarde' | 'noite'>('manhã');

  const [editTaskDuration, setEditTaskDuration] = useState(30);

  const [editTaskDescription, setEditTaskDescription] = useState('');

  const [editTaskCategory, setEditTaskCategory] = useState<'AVD' | 'Aprendizado' | 'Lazer'>('AVD');

  const [editTaskIcon, setEditTaskIcon] = useState('📅');

  const [hyperfocus, setHyperfocus] = useState('');

  const [lockType, setLockType] = useState<'pin' | 'math' | 'none'>('math');

  const [parentPinCode, setParentPinCode] = useState('1234');

  const [plan, setPlan] = useState<'free' | 'premium'>('free');

  const [sensorySpeed, setSensorySpeed] = useState<0.7 | 1.0 | 1.2>(1.0);

  const [sensorySound, setSensorySound] = useState<'marimba' | 'bubble' | 'silent'>('marimba');

  const [sensoryVisuals, setSensoryVisuals] = useState<'rich' | 'minimal'>('rich');

  const [sensoryProfile, setSensoryProfile] = useState<'balanced' | 'hypersensitive' | 'hyposensitive'>('balanced');

  const [timerStyle, setTimerStyle] = useState<'circle' | 'hourglass' | 'droplets'>('circle');

  const [interfaceMode, setInterfaceMode] = useState<'foco' | 'intermediario' | 'completo'>('completo');



  // Reward & Transition Timer states

  const [rewardName, setRewardName] = useState('15 minutos de tablet');

  const [rewardCost, setRewardCost] = useState(10);

  const [transitionMinutes, setTransitionMinutes] = useState(5);

  const [tokens, setTokens] = useState(0);



  // Phase 3 Roadmap & Template Replication States

  const [emergencyFirstThen, setEmergencyFirstThen] = useState(false);

  const [behaviorList, setBehaviorList] = useState<any[]>([]);

  const [newSignal, setNewSignal] = useState('');

  const [newMeaning, setNewMeaning] = useState('');

  const [newIntervention, setNewIntervention] = useState('');

  const [unexpectedChangeObj, setUnexpectedChangeObj] = useState<any | null>(null);

  const [selectedCancelTaskTitle, setSelectedCancelTaskTitle] = useState('');

  const [changeReason, setChangeReason] = useState('');

  const [changeReplacement, setChangeReplacement] = useState('');



  // Weekly and Monthly Schedule View Mode State

  const [scheduleViewMode, setScheduleViewMode] = useState<'daily' | 'weekly' | 'monthly'>('daily');



  // Onboarding help state

  const [showOnboardingHelp, setShowOnboardingHelp] = useState(true);

  useEffect(() => {

    if (typeof window !== 'undefined') {

      const stored = localStorage.getItem('showOnboardingHelp');

      if (stored === 'false') {

        setShowOnboardingHelp(false);

      }

    }

  }, []);



  // Collapsible Sidebar Sections State

  const [collapsedSections, setCollapsedSections] = useState({

    emotionalBattery: false, // Default open since it is vital

    dailyStatus: true,       // Default collapsed

    profile: false,           // Default collapsed

    voiceRecorder: false,     // Default collapsed

    aacEditor: false,         // Default collapsed

    storiesEditor: false,     // Default collapsed

    dictionary: false,        // Default collapsed

    quickActions: true,       // Advanced — collapsed by default

  });



  const toggleSection = (section: keyof typeof collapsedSections) => {

    playBubble();

    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));

  };



  // Emotional sensory log states

  const [sensoryLogs, setSensoryLogs] = useState<any[]>([]);

  const [crisisNotes, setCrisisNotes] = useState('');

  const [crisisLocation, setCrisisLocation] = useState('Casa');

  const [crisisLightLevel, setCrisisLightLevel] = useState('Média');

  const [crisisDecibels, setCrisisDecibels] = useState(50);

  const [crisisTrigger, setCrisisTrigger] = useState('Nenhum');

  const [crisisAntecedent, setCrisisAntecedent] = useState('');

  const [crisisBehavior, setCrisisBehavior] = useState('');

  const [crisisConsequence, setCrisisConsequence] = useState('');

  const [taskCustomIcon, setTaskCustomIcon] = useState('');

  const [editTaskCustomIcon, setEditTaskCustomIcon] = useState('');

  const [savingCrisis, setSavingCrisis] = useState(false);



  const [showPaywall, setShowPaywall] = useState(false);

  const [checkingOut, setCheckingOut] = useState(false);

  const [notifications, setNotifications] = useState<{ id: string; message: string; timestamp: Date }[]>([]);

  

  // Tab/Filter states

  const [copiedTasksBuffer, setCopiedTasksBuffer] = useState<any[]>([]);

  const [copiedFromDay, setCopiedFromDay] = useState<string | null>(null);



  // Scope-based Schedule Template States

  const [saveTemplateScope, setSaveTemplateScope] = useState<'day' | 'week' | 'month'>('day');

  const [applyTemplateScope, setApplyTemplateScope] = useState<'day' | 'week' | 'month'>('month');

  const [showReapplyModal, setShowReapplyModal] = useState(false);

  const [showClearModal, setShowClearModal] = useState(false);

  const [reapplyTargetType, setReapplyTargetType] = useState<'days' | 'weeks' | 'month'>('days');

  const [reapplySelectedDays, setReapplySelectedDays] = useState<string[]>([]);

  const [reapplySelectedWeeks, setReapplySelectedWeeks] = useState<string[]>([]);



  const getSavedTemplateType = () => {

    if (!activeChild || !activeChild.monthlyTemplate) return null;

    try {

      const parsed = JSON.parse(activeChild.monthlyTemplate);

      if (parsed && typeof parsed === 'object' && 'type' in parsed) {

        return parsed.type as 'day' | 'week' | 'month';

      }

      return 'month';

    } catch (e) {

      return 'month';

    }

  };



  const [reapplyTargetMonthOffset, setReapplyTargetMonthOffset] = useState<0 | 1>(0);



  const [activeMonth, setActiveMonth] = useState<number>(() => {

    if (typeof window !== 'undefined') {

      const saved = sessionStorage.getItem('tea_active_month');

      if (saved) return parseInt(saved, 10);

    }

    return new Date().getMonth() + 1;

  });

  const [activeYear, setActiveYear] = useState<number>(() => {

    if (typeof window !== 'undefined') {

      const saved = sessionStorage.getItem('tea_active_year');

      if (saved) return parseInt(saved, 10);

    }

    return new Date().getFullYear();

  });

  const [activeDayFilter, setActiveDayFilter] = useState(() => {

    if (typeof window !== 'undefined') {

      const saved = sessionStorage.getItem('tea_active_day');

      if (saved) return saved;

    }

    return new Date().getDate().toString();

  });



  useEffect(() => {

    if (typeof window !== 'undefined') {

      sessionStorage.setItem('tea_active_month', String(activeMonth));

      sessionStorage.setItem('tea_active_year', String(activeYear));

      sessionStorage.setItem('tea_active_day', activeDayFilter);

    }

  }, [activeMonth, activeYear, activeDayFilter]);



  useEffect(() => {

    const fetchTasks = async () => {

      try {

        const fetched = await firebaseBridge.db.getTasks(activeMonth, activeYear);

        setTasks(fetched);

        window.dispatchEvent(new CustomEvent('firebase-mock-db-update', { detail: fetched }));

      } catch (err) {

        console.error("Error fetching tasks for active period:", err);

      }

    };

    fetchTasks();

  }, [activeMonth, activeYear, activeChild?.id]);





  const DAYS_OF_MONTH = React.useMemo(() => {

    const numDays = new Date(activeYear, activeMonth, 0).getDate();

    const DAYS_PORTUGUESE = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    const WEEKDAY_KEYS = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];

    

    return Array.from({ length: numDays }).map((_, i) => {

      const dayNum = i + 1;

      const date = new Date(activeYear, activeMonth - 1, dayNum);

      const dayOfWeek = DAYS_PORTUGUESE[date.getDay()];

      return {

        key: String(dayNum),

        label: `Dia ${dayNum} (${dayOfWeek}) 📅`,

        short: `${dayNum}`,

        weekdayKey: WEEKDAY_KEYS[date.getDay()],

        weekdayShort: dayOfWeek

      };

    });

  }, [activeMonth, activeYear]);



  const getDayLabel = (dayKey: string, locale: string = 'pt') => {

    const day = DAYS_OF_MONTH.find(d => d.key === dayKey);

    if (!day) return locale === 'en' ? `Day ${dayKey}` : locale === 'es' ? `Día ${dayKey}` : `Dia ${dayKey}`;

    

    const weekdayShortMap: Record<string, Record<string, string>> = {

      'Dom': { pt: 'Dom', es: 'Dom', en: 'Sun' },

      'Seg': { pt: 'Seg', es: 'Lun', en: 'Mon' },

      'Ter': { pt: 'Ter', es: 'Mar', en: 'Tue' },

      'Qua': { pt: 'Qua', es: 'Mié', en: 'Wed' },

      'Qui': { pt: 'Qui', es: 'Jue', en: 'Thu' },

      'Sex': { pt: 'Sex', es: 'Vie', en: 'Fri' },

      'Sáb': { pt: 'Sáb', es: 'Sáb', en: 'Sat' }

    };

    

    const wTrans = weekdayShortMap[day.weekdayShort]?.[locale] || day.weekdayShort;

    

    return locale === 'en'

      ? `Day ${day.key} (${wTrans}) 📅`

      : locale === 'es'

      ? `Día ${day.key} (${wTrans}) 📅`

      : `Dia ${day.key} (${day.weekdayShort}) 📅`;

  };



  const getRecurrenceWeekdayLabel = (dayKey: string, locale: string = 'pt') => {

    const dayObj = DAYS_OF_MONTH.find(d => d.key === dayKey);

    if (!dayObj) return locale === 'en' ? 'on the same day of the week' : locale === 'es' ? 'en el mismo día de la semana' : 'no mesmo dia da semana';

    

    const mappingPt: Record<string, string> = {

      domingo: 'Domingos',

      segunda: 'Segundas-feiras',

      terca: 'Terças-feiras',

      quarta: 'Quartas-feiras',

      quinta: 'Quintas-feiras',

      sexta: 'Sextas-feiras',

      sabado: 'Sábados'

    };



    const mappingEn: Record<string, string> = {

      domingo: 'Sundays',

      segunda: 'Mondays',

      terca: 'Tuesdays',

      quarta: 'Wednesdays',

      quinta: 'Thursdays',

      sexta: 'Fridays',

      sabado: 'Saturdays'

    };



    const mappingEs: Record<string, string> = {

      domingo: 'Domingos',

      segunda: 'Lunes',

      terca: 'Martes',

      quarta: 'Miércoles',

      quinta: 'Jueves',

      sexta: 'Viernes',

      sabado: 'Sábados'

    };

    

    const mapping = locale === 'en' ? mappingEn : locale === 'es' ? mappingEs : mappingPt;

    

    return locale === 'en' 

      ? `All ${mapping[dayObj.weekdayKey] || dayObj.weekdayKey} of the month`

      : locale === 'es'

      ? `Todos los ${mapping[dayObj.weekdayKey] || dayObj.weekdayKey} del mes`

      : `Todas as ${mapping[dayObj.weekdayKey] || dayObj.weekdayKey} do mês`;

  };

  const [activePanelTab, setActivePanelTab] = useState<'hoje' | 'tasks' | 'feedback' | 'tools'>('hoje');
  const [activeFeedbackSubTab, setActiveFeedbackSubTab] = useState<'checkpoints' | 'reports'>('checkpoints');
  const [activeToolsSubTab, setActiveToolsSubTab] = useState<'config' | 'logs'>('config');

  const [checkpoints, setCheckpoints] = useState<any[]>([]);

  const [loadingCheckpoints, setLoadingCheckpoints] = useState(false);

  const [savingCheckpointId, setSavingCheckpointId] = useState<string | null>(null);

  const [editingCheckpointId, setEditingCheckpointId] = useState<string | null>(null);

  

  const [editName, setEditName] = useState('');

  const [editRole, setEditRole] = useState('Psicologia ABA');

  const [editDate, setEditDate] = useState('');

  const [editNotes, setEditNotes] = useState('');

  const [editFeedback, setEditFeedback] = useState('');

  const [editStatus, setEditStatus] = useState<'pending' | 'completed'>('pending');



  // Custom Daily Checkpoint Form States

  const [newCpOpen, setNewCpOpen] = useState(false);

  const [newCpDate, setNewCpDate] = useState('');

  const [newCpName, setNewCpName] = useState('');

  const [newCpRole, setNewCpRole] = useState('Psicologia ABA');

  const [newCpNotes, setNewCpNotes] = useState('');

  const [newCpFeedback, setNewCpFeedback] = useState('');

  const [newCpStatus, setNewCpStatus] = useState<'pending' | 'completed'>('completed');

  const [creatingCheckpoint, setCreatingCheckpoint] = useState(false);

  

  // UI states

  const [formOpen, setFormOpen] = useState(false);

  const [formStep, setFormStep] = useState<1 | 2>(1);

  const [savingProfile, setSavingProfile] = useState(false);

  const [statusMessage, setStatusMessage] = useState('');



  const getMascotLabelInfo = () => {

    const focus = (hyperfocus || activeChild?.childHyperfocus || 'Border Collies 🐕').toLowerCase().trim();

    if (focus.includes("dino") || focus.includes("dinossauro") || focus.includes("dinosaur")) {

      return {

        emoji: '🦖',

        text: collieState === 'celebrating' ? 'Roar! 🦖' : 'Mascote (Dicas)'

      };

    }

    if (focus.includes("espaço") || focus.includes("astronauta") || focus.includes("space") || focus.includes("estrela") || focus.includes("star") || focus.includes("foguete") || focus.includes("rocket")) {

      return {

        emoji: '🚀',

        text: collieState === 'celebrating' ? 'Bip bip! 🚀' : 'Mascote (Dicas)'

      };

    }

    if (focus.includes("minecraft") || focus.includes("bloco") || focus.includes("block")) {

      return {

        emoji: '🟩',

        text: collieState === 'celebrating' ? 'Tlec! 🟩' : 'Mascote (Dicas)'

      };

    }

    if (focus.includes("gato") || focus.includes("cat")) {

      return {

        emoji: '🐱',

        text: collieState === 'celebrating' ? 'Miau! 🐾' : 'Mascote (Dicas)'

      };

    }

    if (focus.includes("carro") || focus.includes("car")) {

      return {

        emoji: '🚗',

        text: collieState === 'celebrating' ? 'Vrum! 🏁' : 'Mascote (Dicas)'

      };

    }

    if (focus.includes("trem") || focus.includes("train") || focus.includes("locomotiva")) {

      return {

        emoji: '🚂',

        text: collieState === 'celebrating' ? 'Tchutchu! 🚂' : 'Mascote (Dicas)'

      };

    }

    if (focus.includes("herói") || focus.includes("heroi") || focus.includes("hero") || focus.includes("super")) {

      return {

        emoji: '🦸',

        text: collieState === 'celebrating' ? 'Super! 🌟' : 'Mascote (Dicas)'

      };

    }

    if (focus.includes("tubarão") || focus.includes("tubarao") || focus.includes("shark") || focus.includes("mar")) {

      return {

        emoji: '🦈',

        text: collieState === 'celebrating' ? 'Splash! 🌊' : 'Mascote (Dicas)'

      };

    }

    if (focus.includes("unicórnio") || focus.includes("unicornio") || focus.includes("unicorn")) {

      return {

        emoji: '🦄',

        text: collieState === 'celebrating' ? 'Brilho! ✨' : 'Mascote (Dicas)'

      };

    }

    if (focus.includes("robô") || focus.includes("robo") || focus.includes("robot")) {

      return {

        emoji: '🤖',

        text: collieState === 'celebrating' ? 'Bip bop! 🤖' : 'Mascote (Dicas)'

      };

    }

    return {

      emoji: '🐶',

      text: collieState === 'celebrating' ? 'Au Au! 🐾' : 'Companheiro (Dicas)'

    };

  };



  const mascotLabel = getMascotLabelInfo();



  // 1.1 Sync profile if returning from Stripe checkout

  useEffect(() => {

    const success = searchParams.get('success');

    const sessionId = searchParams.get('session_id');

    if (success === 'true' && sessionId) {

      const sync = async () => {

        try {

          if ((firebaseBridge.auth as any).syncProfile) {

            const updatedProfile = await (firebaseBridge.auth as any).syncProfile();

            if (updatedProfile) {

              setPlan(updatedProfile.plan || 'free');

              triggerStatus('Assinatura Premium ativa! Obrigado 💎');

            }

          }

        } catch (err) {

          console.error("Erro ao sincronizar assinatura:", err);

        }

      };

      sync();

      router.replace('/dashboard');

    }

  }, [searchParams, router]);



  // 1. Verification of authentication & fetch profile & children

  useEffect(() => {

    const user = firebaseBridge.auth.getCurrentUser();

    if (!user || user.role !== 'responsavel') {

      router.push('/login');

      return;

    }

    setCurrentUser(user);

    setPlan(user.plan || 'free');



    const loadChildren = async () => {

      try {

        const fetchedChildren = await firebaseBridge.auth.getChildren();

        setChildren(fetchedChildren);



        // Determine active child

        const cachedActiveChild = firebaseBridge.auth.getActiveChild();

        const active = (cachedActiveChild && fetchedChildren.some(c => c.id === cachedActiveChild.id))

          ? fetchedChildren.find(c => c.id === cachedActiveChild.id)

          : fetchedChildren[0] || null;



        if (active) {

          setActiveChild(active);

          firebaseBridge.auth.setActiveChild(active);

          

          setHyperfocus(active.childHyperfocus || '');

          setLockType((active.lockType || 'math') as any);

          setParentPinCode(active.parentPinCode || '1234');

          setSensorySpeed((active.sensorySpeed || 1.0) as any);

          setSensorySound((active.sensorySound || 'marimba') as any);

          setSensoryVisuals((active.sensoryVisuals || 'rich') as any);

          setSensoryProfile((active.sensoryProfile || 'balanced') as any);

          setTimerStyle((active.timerStyle || 'circle') as any);

          setInterfaceMode((active.interfaceMode || 'completo') as any);

          

          setRewardName(active.rewardName || '15 minutos de tablet');

          setRewardCost(active.rewardCost || 10);

          setTransitionMinutes(active.transitionMinutes || 5);

          setTokens(active.tokens || 0);



          setEmergencyFirstThen(active.emergencyFirstThen || false);

          let bList = [];

          try {

            if (active.behaviorDictionary) {

              bList = JSON.parse(active.behaviorDictionary);

            }

          } catch (e) {}

          setBehaviorList(bList);



          let unex = null;

          try {

            if (active.unexpectedChange) {

              unex = JSON.parse(active.unexpectedChange);

            }

          } catch (e) {}

          setUnexpectedChangeObj(unex);



          let aacList = [];

          try {

            if (active.aacCustomItems) {

              aacList = JSON.parse(active.aacCustomItems);

            }

          } catch (e) {}

          setAacItemsList(aacList);



          let storiesList = [];

          try {

            if (active.customStories) {

              storiesList = JSON.parse(active.customStories);

            }

          } catch (e) {}

          setCustomStoriesList(storiesList);

          

          firebaseBridge.db.getSensoryLogs(active.id).then(setSensoryLogs).catch(console.error);

        }

      } catch (err) {

        console.error('Erro ao carregar crianças:', err);

      }

    };



    loadChildren();



    // 2. Subscribe to real-time Tasks updates (onSnapshot)

    const unsubscribeTasks = firebaseBridge.db.onSnapshotTasks((fetchedTasks) => {

      setTasks(fetchedTasks);

    });



    // 3. Subscribe to real-time Logs updates

    const unsubscribeLogs = immutableLogger.onSnapshotLogs((fetchedLogs) => {

      setLogs(fetchedLogs);

    });



    // 4. Subscribe to real-time Task Completion Alerts (PubSub)

    const unsubscribeCompleted = firebaseBridge.db.onSnapshotTaskCompleted((completedTask) => {

      playMarimba(440, 0.1);

      setTimeout(() => playMarimba(554.37, 0.15), 100);



      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const newMsg = `Seu filho concluiu a tarefa "${completedTask.title}" às ${timeStr}! ✓`;



      setNotifications(prev => [

        { id: Math.random().toString(), message: newMsg, timestamp: new Date() },

        ...prev.slice(0, 4)

      ]);

    });



    return () => {

      unsubscribeTasks();

      unsubscribeLogs();

      unsubscribeCompleted();

    };

  }, [router]);



  // Load checkpoints when active child or tab changes

  useEffect(() => {

    if (!activeChild?.id) return;

    

    const fetchCheckpoints = async () => {

      setLoadingCheckpoints(true);

      try {

        const data = await firebaseBridge.db.getCheckpoints(activeChild.id);

        setCheckpoints(data);

      } catch (err) {

        console.error("Erro ao carregar checkpoints:", err);

      } finally {

        setLoadingCheckpoints(false);

      }

    };

    

    fetchCheckpoints();

  }, [activeChild?.id, activePanelTab]);



  const startEditingCheckpoint = (cp: any) => {

    playBubble();

    setEditingCheckpointId(cp.id);

    setEditName(cp.professionalName || '');

    setEditRole(cp.professionalRole || 'Psicologia ABA');

    setEditDate(cp.date || '');

    setEditNotes(cp.notes || '');

    setEditFeedback(cp.feedback || '');

    setEditStatus(cp.status || 'pending');

  };



  const handleSaveCheckpoint = async (id: string) => {

    playMarimba(392, 0.4);

    setSavingCheckpointId(id);

    try {

      const updated = await firebaseBridge.db.saveCheckpoint(id, {

        professionalName: editName,

        professionalRole: editRole,

        date: editDate,

        notes: editNotes,

        feedback: editFeedback,

        status: editStatus

      });

      

      setCheckpoints(prev => prev.map(c => c.id === id ? updated : c));

      setEditingCheckpointId(null);

      triggerStatus(t.dashboard.statusCheckpointSaved);

      

      await immutableLogger.logChange(

        'UPDATE_PROFILE',

        `Atualizou o checkpoint clínico da Semana ${updated.weekNum} (${updated.professionalRole} - ${updated.professionalName}).`,

        currentUser?.email

      );

    } catch (err) {

      console.error(err);

      triggerStatus('Erro ao salvar checkpoint.');

    } finally {

      setSavingCheckpointId(null);

    }

  };



  const handleCopyDay = () => {

    playBubble();

    const dayTasks = tasks.filter(t => t.day === activeDayFilter);

    if (dayTasks.length === 0) {

      triggerStatus('Nenhuma tarefa para copiar neste dia.');

      return;

    }

    setCopiedTasksBuffer(dayTasks);

    setCopiedFromDay(activeDayFilter);

    const dayLabel = getDayLabel(activeDayFilter, locale).replace(/ 📅| ☀️/, '');

    triggerStatus(`Rotina de ${dayLabel} copiada! (${dayTasks.length} tarefas)`);

  };



  const handlePasteDay = async () => {

    if (!copiedFromDay || copiedTasksBuffer.length === 0 || !activeChild?.id) return;

    

    playMarimba(392, 0.4);

    

    const targetDayLabel = getDayLabel(activeDayFilter, locale).replace(/ 📅| ☀️/, '');

    const sourceDayLabel = getDayLabel(copiedFromDay, locale).replace(/ 📅| ☀️/, '');

    const confirmPaste = window.confirm(

      `Deseja substituir as tarefas existentes de ${targetDayLabel} pelas ${copiedTasksBuffer.length} tarefas copiadas de ${sourceDayLabel}?`

    );

    if (!confirmPaste) return;



    try {

      triggerStatus('Substituindo tarefas...');

      

      // Delete existing tasks for activeDayFilter

      await firebaseBridge.db.deleteTasksByDay(activeDayFilter);



      // Create copies

      const tasksToCreate = copiedTasksBuffer.map(t => ({

        title: t.title,

        time: t.time,

        period: t.period,

        day: activeDayFilter,

        icon: t.icon,

        customIcon: t.customIcon || undefined,

        category: t.category,

        duration: t.duration,

        description: t.description || ''

      }));



      // Call API

      const headers: Record<string, string> = {

        'Content-Type': 'application/json',

        'x-user-uid': currentUser?.uid || 'user-123',

        'x-child-id': activeChild.id

      };



      const res = await fetch('/api/tasks', {

        method: 'POST',

        headers,

        body: JSON.stringify(tasksToCreate)

      });

      const data = await res.json();

      if (data.error) throw new Error(data.error);



      // Trigger local updates

      const updatedTasks = await firebaseBridge.db.getTasks();

      window.dispatchEvent(new CustomEvent('firebase-mock-db-update', { detail: updatedTasks }));



      // Write log trail

      await immutableLogger.logChange(

        'RESET_ROUTINE',

        `Copiou em bloco a rotina de ${sourceDayLabel} para ${targetDayLabel}.`,

        currentUser?.email

      );



      triggerStatus('Rotina colada com sucesso!');

    } catch (err) {

      console.error(err);

      triggerStatus('Erro ao colar rotina.');

    }

  };



  const handleCreateDailyCheckpoint = async (e: React.FormEvent) => {

    e.preventDefault();

    if (!activeChild?.id || !newCpDate) return;



    setCreatingCheckpoint(true);

    try {

      playMarimba(392, 0.4);

      const created = await firebaseBridge.db.addDailyCheckpoint({

        childId: activeChild.id,

        date: newCpDate,

        professionalName: newCpName.trim() || 'Especialista',

        professionalRole: newCpRole,

        feedback: newCpFeedback.trim(),

        notes: newCpNotes.trim(),

        status: newCpStatus,

        weekNum: 1

      });



      setCheckpoints(prev => {

        const idx = prev.findIndex(c => c.date === created.date);

        if (idx !== -1) {

          return prev.map((c, i) => i === idx ? created : c);

        } else {

          return [...prev, created];

        }

      });



      // Reset form

      setNewCpOpen(false);

      setNewCpName('');

      setNewCpFeedback('');

      setNewCpNotes('');

      triggerStatus(t.dashboard.statusDailyCheckpointRegistered);



      await immutableLogger.logChange(

        'UPDATE_PROFILE',

        `Adicionou checkpoint clínico para a data ${newCpDate} (${newCpRole} - ${newCpName}).`,

        currentUser?.email

      );

    } catch (err) {

      console.error(err);

      triggerStatus(t.dashboard.statusDailyCheckpointError);

    } finally {

      setCreatingCheckpoint(false);

    }

  };



  const handleSelectChild = async (child: any) => {

    playMarimba(300, 0.25);

    setActiveChild(child);

    firebaseBridge.auth.setActiveChild(child);

    

    // Set settings states

    setHyperfocus(child.childHyperfocus || '');

    setLockType(child.lockType || 'math');

    setParentPinCode(child.parentPinCode || '1234');

    setSensorySpeed(child.sensorySpeed || 1.0);

    setSensorySound(child.sensorySound || 'marimba');

    setSensoryVisuals(child.sensoryVisuals || 'rich');

    setSensoryProfile(child.sensoryProfile || 'balanced');

    setTimerStyle(child.timerStyle || 'circle');

    setInterfaceMode(child.interfaceMode || 'completo');

    

    setRewardName(child.rewardName || '15 minutos de tablet');

    setRewardCost(child.rewardCost || 10);

    setTransitionMinutes(child.transitionMinutes || 5);

    setTokens(child.tokens || 0);



    setEmergencyFirstThen(child.emergencyFirstThen || false);

    let bList = [];

    try {

      if (child.behaviorDictionary) {

        bList = JSON.parse(child.behaviorDictionary);

      }

    } catch (e) {}

    setBehaviorList(bList);



    let unex = null;

    try {

      if (child.unexpectedChange) {

        unex = JSON.parse(child.unexpectedChange);

      }

    } catch (e) {}

    setUnexpectedChangeObj(unex);



    let aacList = [];

    try {

      if (child.aacCustomItems) {

        aacList = JSON.parse(child.aacCustomItems);

      }

    } catch (e) {}

    setAacItemsList(aacList);



    let storiesList = [];

    try {

      if (child.customStories) {

        storiesList = JSON.parse(child.customStories);

      }

    } catch (e) {}

    setCustomStoriesList(storiesList);



    // Immediately fetch tasks and logs for the new child

    try {

      const fetchedTasks = await firebaseBridge.db.getTasks();

      setTasks(fetchedTasks);

      

      const sLogs = await firebaseBridge.db.getSensoryLogs(child.id);

      setSensoryLogs(sLogs);

    } catch (err) {

      console.error(err);

    }

  };



  const handleRegisterChild = async (e: React.FormEvent) => {

    e.preventDefault();

    if (!newChildName.trim()) return;



    setRegisteringChild(true);

    playMarimba(523.25, 0.35); // happy note



    try {

      const newChild = await firebaseBridge.auth.addChild({

        name: newChildName.trim(),

        birthDate: newChildBirthDate,

        gender: newChildGender,

        diagnosis: newChildDiagnosis,

      });



      setChildren(prev => [...prev, newChild]);

      

      // Select the newly registered child

      await handleSelectChild(newChild);



      await immutableLogger.logChange(

        'REGISTER_CHILD',

        `Cadastrou uma nova criança: ${newChild.name} (Gênero: ${newChild.gender}, Diagnóstico: ${newChild.diagnosis}, Data de Nasc.: ${newChild.birthDate || 'Não Informado'}).`,

        currentUser?.email

      );



      triggerStatus(t.dashboard.statusChildRegistered);

      setNewChildModalOpen(false);

      

      // Reset form states

      setNewChildName('');

      setNewChildBirthDate('');

      setNewChildGender('Não Informado');

      setNewChildDiagnosis('Não Informado');

    } catch (err) {

      triggerStatus(t.dashboard.statusChildRegisterError);

    } finally {

      setRegisteringChild(false);

    }

  };



  const handleDeleteChild = async (childId: string, name: string) => {

    if (!window.confirm(`Tem certeza que deseja excluir o perfil de ${name}? Todas as tarefas e configurações desta criança serão apagadas permanentemente.`)) return;



    playMarimba(196, 0.4);

    try {

      await firebaseBridge.auth.deleteChild(childId);

      

      await immutableLogger.logChange(

        'DELETE_CHILD',

        `Excluiu o perfil de criança: ${name}.`,

        currentUser?.email

      );



      const updatedChildren = children.filter(c => c.id !== childId);

      setChildren(updatedChildren);



      // Select first remaining child or null

      if (updatedChildren.length > 0) {

        handleSelectChild(updatedChildren[0]);

      } else {

        setActiveChild(null);

        firebaseBridge.auth.setActiveChild(null);

        setTasks([]);

      }



      triggerStatus(t.dashboard.statusChildRemoved);

    } catch (err) {

      triggerStatus(t.dashboard.statusChildRemoveError);

    }

  };



  // Handle Log Out

  const handleLogout = async () => {
    playMarimba(261, 0.3);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tea_active_day');
      localStorage.removeItem('tea_active_month');
      localStorage.removeItem('tea_active_year');
      sessionStorage.clear();
    }
    await firebaseBridge.auth.signOut();
    router.push('/login');
  };



  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {

    const file = e.target.files?.[0];

    if (file) {

      const reader = new FileReader();

      reader.onloadend = () => {

        const base64String = reader.result as string;

        if (isEdit) {

          setEditTaskCustomIcon(base64String);

        } else {

          setTaskCustomIcon(base64String);

        }

      };

      reader.readAsDataURL(file);

    }

  };



  const handleGenerateSharingCode = async () => {

    if (!activeChild) return;

    playMarimba(392, 0.4);

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

    let code = '';

    for (let i = 0; i < 6; i++) {

      code += chars.charAt(Math.floor(Math.random() * chars.length));

    }

    

    try {

      const updated = await firebaseBridge.auth.updateChildSettings(activeChild.id, {

        sharingCode: code

      } as any);

      

      setActiveChild(updated);

      firebaseBridge.auth.setActiveChild(updated);

      setChildren(prev => prev.map(c => c.id === updated.id ? updated : c));

      triggerStatus(`Código gerado: ${code}`);

    } catch (err) {

      triggerStatus('Erro ao gerar código.');

    }

  };



  // Add Task to Routine

  const handleAddTask = async (e: React.FormEvent) => {

    e.preventDefault();

    if (!title.trim()) return;

    

    const activeDayTasks = tasks.filter(t => t.day === activeDayFilter);

    if (plan === 'free' && activeDayTasks.length >= 3) {

      playMarimba(180, 0.2);

      setShowPaywall(true);

      return;

    }



    playMarimba(392, 0.4);



    try {

      let targetDays = [activeDayFilter];

      if (recurrenceMode === 'weekday') {

        const targetDayObj = DAYS_OF_MONTH.find(d => d.key === activeDayFilter);

        if (targetDayObj) {

          targetDays = DAYS_OF_MONTH.filter(d => d.weekdayKey === targetDayObj.weekdayKey).map(d => d.key);

        }

      } else if (recurrenceMode === 'monthly') {

        targetDays = DAYS_OF_MONTH.map(d => d.key);

      }



      // Map to tasks payload

      const tasksToCreate = targetDays.map(dayKey => ({

        title: title.trim(),

        time,

        period,

        day: dayKey,

        icon: taskIcon,

        customIcon: taskCustomIcon.trim() || undefined,

        category: taskCategory,

        duration: taskDuration,

        description: taskDescription.trim()

      }));



      // Call database bridge (supports single or array)

      const payload = tasksToCreate.length === 1 ? tasksToCreate[0] : tasksToCreate;

      await firebaseBridge.db.addTask(payload);



      // Write IMUTABLE LOG trail

      let logMessage = '';

      if (recurrenceMode === 'single') {

        const dayLabel = getDayLabel(activeDayFilter, locale).replace(/ 📅| ☀️/, '');

        logMessage = locale === 'en'

          ? `Added task "${title.trim()}" (Duration: ${taskDuration}min, Icon: ${taskIcon}, Category: ${taskCategory}) at ${time} (${period}) in the schedule for ${dayLabel}.`

          : locale === 'es'

          ? `Agregó la tarea "${title.trim()}" (Duración: ${taskDuration}min, Icono: ${taskIcon}, Categoría: ${taskCategory}) a las ${time} (${period}) en la agenda de ${dayLabel}.`

          : `Adicionou a tarefa "${title.trim()}" (Duração: ${taskDuration}min, Ícone: ${taskIcon}, Categoria: ${taskCategory}) às ${time} (${period}) na agenda de ${dayLabel}.`;

      } else if (recurrenceMode === 'weekday') {

        const dayLabel = getRecurrenceWeekdayLabel(activeDayFilter, locale);

        logMessage = locale === 'en'

          ? `Added task "${title.trim()}" (Duration: ${taskDuration}min, Icon: ${taskIcon}, Category: ${taskCategory}) at ${time} (${period}) on ${dayLabel}.`

          : locale === 'es'

          ? `Agregó la tarea "${title.trim()}" (Duración: ${taskDuration}min, Icono: ${taskIcon}, Categoría: ${taskCategory}) a las ${time} (${period}) en ${dayLabel}.`

          : `Adicionou a tarefa "${title.trim()}" (Duração: ${taskDuration}min, Ícone: ${taskIcon}, Categoria: ${taskCategory}) às ${time} (${period}) em ${dayLabel}.`;

      } else {

        logMessage = locale === 'en'

          ? `Added task "${title.trim()}" (Duration: ${taskDuration}min, Icon: ${taskIcon}, Category: ${taskCategory}) at ${time} (${period}) on all days of the month.`

          : locale === 'es'

          ? `Agregó la tarea "${title.trim()}" (Duración: ${taskDuration}min, Icono: ${taskIcon}, Categoría: ${taskCategory}) a las ${time} (${period}) en todos los días del mes.`

          : `Adicionou a tarefa "${title.trim()}" (Duração: ${taskDuration}min, Ícone: ${taskIcon}, Categoria: ${taskCategory}) às ${time} (${period}) em todos os dias do mês.`;

      }



      await immutableLogger.logChange(

        'ADD_TASK', 

        logMessage,

        currentUser?.email

      );



      setTitle('');

      setTaskIcon('📅');

      setTaskCustomIcon('');

      setTaskCategory('AVD');

      setTaskDuration(30);

      setTaskDescription('');

      

      const successMsg = recurrenceMode === 'single' 

        ? 'Tarefa adicionada com sucesso!' 

        : recurrenceMode === 'weekday' 

        ? 'Tarefa adicionada para os dias selecionados!' 

        : 'Tarefa adicionada para todo o mês!';

      

      setRecurrenceMode('single');

      setFormOpen(false);

      setFormStep(1);

      triggerStatus(successMsg);

    } catch (err) {

      triggerStatus('Erro ao adicionar tarefa.');

    }

  };



  // Delete Task

  const handleDeleteTask = async (task: Task) => {

    playMarimba(293.66, 0.3);

    try {

      await firebaseBridge.db.deleteTask(task.id);

      

      const dayLabel = getDayLabel(task.day, locale);

      await immutableLogger.logChange(

        'DELETE_TASK', 

        `Removeu a tarefa "${task.title}" de ${dayLabel} (${task.period}).`,

        currentUser?.email

      );

      

      triggerStatus('Tarefa removida com sucesso!');

    } catch (err) {

      triggerStatus('Erro ao remover tarefa.');

    }

  };



  // Save Task Edit

  const handleSaveTaskEdit = async (taskId: string) => {

    playMarimba(392, 0.4);

    try {

      await firebaseBridge.db.updateTask(taskId, {

        title: editTaskTitle,

        time: editTaskTime,

        period: editTaskPeriod,

        duration: editTaskDuration,

        description: editTaskDescription.trim(),

        category: editTaskCategory,

        icon: editTaskIcon,

        customIcon: editTaskCustomIcon.trim() || undefined

      });



      const dayLabel = getDayLabel(activeDayFilter, locale);

      await immutableLogger.logChange(

        'UPDATE_PROFILE', 

        `Editou a tarefa "${editTaskTitle}" (Duração: ${editTaskDuration}min, Ícone: ${editTaskIcon}, Categoria: ${editTaskCategory}) às ${editTaskTime} (${editTaskPeriod}) na ${dayLabel}.`,

        currentUser?.email

      );



      setEditingTaskId(null);

      triggerStatus('Tarefa atualizada com sucesso!');

    } catch (err) {

      triggerStatus('Erro ao atualizar tarefa.');

    }

  };



  // Update Active Child Settings

  const handleSaveProfile = async (e: React.FormEvent) => {

    e.preventDefault();

    if (!activeChild) {

      triggerStatus(t.dashboard.statusRegisterChildFirst);

      return;

    }



    setSavingProfile(true);

    playMarimba(440, 0.3);



    try {

      const updated = await firebaseBridge.auth.updateChildSettings(activeChild.id, {

        childHyperfocus: hyperfocus,

        lockType,

        parentPinCode,

        sensorySpeed,

        sensorySound,

        sensoryVisuals,

        sensoryProfile,

        timerStyle,

        interfaceMode,

        rewardName,

        rewardCost,

        transitionMinutes,

        tokens,

        emergencyFirstThen

      });

      

      setActiveChild(updated);

      firebaseBridge.auth.setActiveChild(updated);

      setChildren(prev => prev.map(c => c.id === updated.id ? updated : c));

      

      await immutableLogger.logChange(

        'UPDATE_PROFILE', 

        `Atualizou o perfil de ${activeChild.name}: Hiperfoco: "${hyperfocus}", Bloqueio Infantil: "${lockType}" (PIN: ${parentPinCode}), Velocidade Fala: ${sensorySpeed}x, Efeito Sonoro: "${sensorySound}", Visual: "${sensoryVisuals}", Perfil Sensorial: "${sensoryProfile}", Estilo Timer: "${timerStyle}", Nível de Interface: "${interfaceMode}", Reforçador: "${rewardName}" (${rewardCost} estrelas), Alerta de Transição: ${transitionMinutes}min.`,

        currentUser?.email

      );

      

      // Trigger Border Collie celebration

      setCollieState('celebrating');

      setTimeout(() => setCollieState('idle'), 2000);

      

      triggerStatus(t.dashboard.statusSettingsSaved);

    } catch (err) {

      triggerStatus(t.dashboard.statusSettingsSaveError);

    } finally {

      setSavingProfile(false);

    }

  };







  // --- CUSTOM AAC AND SOCIAL STORIES HANDLERS ---



  const handleAddAacItem = async (e: React.FormEvent) => {

    e.preventDefault();

    if (!activeChild) return;

    if (!newAacText.trim() || !newAacSpeech.trim()) {

      triggerStatus(t.dashboard.statusFillButtonFields);

      return;

    }



    const newItem = {

      id: `aac-${Date.now()}`,

      text: `${newAacText.trim()} ${newAacEmoji}`,

      speech: newAacSpeech.trim(),

      mood: newAacAlert ? 'agitado' : 'calmo',

      alert: newAacAlert

    };



    const updatedList = [...aacItemsList, newItem];

    setAacItemsList(updatedList);



    try {

      const updated = await firebaseBridge.auth.updateChildSettings(activeChild.id, {

        aacCustomItems: JSON.stringify(updatedList)

      });

      setActiveChild(updated);

      firebaseBridge.auth.setActiveChild(updated);

      setNewAacText('');

      setNewAacSpeech('');

      setNewAacEmoji('🤗');

      setNewAacAlert(false);

      triggerStatus(t.dashboard.statusAacButtonAdded);

    } catch (err) {

      triggerStatus('Erro ao salvar item AAC.');

    }

  };



  const handleDeleteAacItem = async (id: string) => {

    if (!activeChild) return;

    const updatedList = aacItemsList.filter(item => item.id !== id);

    setAacItemsList(updatedList);



    try {

      const updated = await firebaseBridge.auth.updateChildSettings(activeChild.id, {

        aacCustomItems: JSON.stringify(updatedList)

      });

      setActiveChild(updated);

      firebaseBridge.auth.setActiveChild(updated);

      triggerStatus(t.dashboard.statusAacButtonRemoved);

    } catch (err) {

      triggerStatus('Erro ao remover item AAC.');

    }

  };



  const handleGenerateAiStory = async (e: React.FormEvent) => {

    e.preventDefault();

    if (!activeChild) return;

    if (!aiTheme.trim()) {

      triggerStatus(t.dashboard.statusEnterStoryTheme);

      return;

    }



    setGeneratingAi(true);

    setAiStatusIdx(0);



    // Animate generation steps

    const interval = setInterval(() => {

      setAiStatusIdx(prev => {

        if (prev >= GENERATOR_STATUSES.length - 1) {

          clearInterval(interval);

          return prev;

        }

        return prev + 1;

      });

    }, 800);



    setTimeout(async () => {

      clearInterval(interval);

      

      const childFocus = hyperfocus || activeChild.childHyperfocus || 'Border Collies 🐕';

      

      const cleanTheme = aiTheme.trim();

      const cleanFocus = childFocus.split(' ')[0] || "Mascote";

      

      let focusEmoji = "🐶";

      if (childFocus.toLowerCase().includes("astronauta") || childFocus.toLowerCase().includes("espaço") || childFocus.toLowerCase().includes("space")) focusEmoji = "🚀";

      else if (childFocus.toLowerCase().includes("trem") || childFocus.toLowerCase().includes("train") || childFocus.toLowerCase().includes("locomotiva")) focusEmoji = "🚂";

      else if (childFocus.toLowerCase().includes("gato") || childFocus.toLowerCase().includes("cat")) focusEmoji = "🐱";

      else if (childFocus.toLowerCase().includes("carro") || childFocus.toLowerCase().includes("car")) focusEmoji = "🚗";

      else if (childFocus.toLowerCase().includes("minecraft") || childFocus.toLowerCase().includes("bloco")) focusEmoji = "🟩";

      else if (childFocus.toLowerCase().includes("herói") || childFocus.toLowerCase().includes("hero")) focusEmoji = "🦸‍♂️";

      else if (childFocus.toLowerCase().includes("tubarão") || childFocus.toLowerCase().includes("shark")) focusEmoji = "🦈";

      else if (childFocus.toLowerCase().includes("unicórnio") || childFocus.toLowerCase().includes("unicorn")) focusEmoji = "🦄";

      else if (childFocus.toLowerCase().includes("robô") || childFocus.toLowerCase().includes("robot")) focusEmoji = "🤖";

      else if (childFocus.toLowerCase().includes("border") || childFocus.toLowerCase().includes("collie")) focusEmoji = "🐶";

      else if (childFocus.toLowerCase().includes("dino") || childFocus.toLowerCase().includes("dinossauro")) focusEmoji = "🦖";



      const steps = [

        {

          text: `Era uma vez o ${cleanFocus}, que adorava explorar o mundo! Um dia, ele soube que tinha uma missão muito especial: ${cleanTheme}. Ele ficou um pouquinho curioso, mas sabia que era um herói aventureiro!`,

          img: focusEmoji,

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

          img: focusEmoji,

        },

        {

          text: `Uau! A missão foi um sucesso absoluto! O ${cleanFocus} agora é o explorador mais feliz do mundo e ganhou estrelas brilhantes por ser tão incrível no ${cleanTheme}!`,

          img: "🎉",

        }

      ];



      const newStory = {

        id: `ai-${Date.now()}`,

        title: `Aventura do ${cleanFocus}: ${cleanTheme}`,

        desc: `História social gerada pela IA com o tema ${cleanTheme} e hiperfoco ${cleanFocus}.`,

        steps: steps

      };



      const updatedList = [...customStoriesList, newStory];

      setCustomStoriesList(updatedList);



      try {

        const updated = await firebaseBridge.auth.updateChildSettings(activeChild.id, {

          customStories: JSON.stringify(updatedList)

        });

        setActiveChild(updated);

        firebaseBridge.auth.setActiveChild(updated);

        setAiTheme('');

        setGeneratingAi(false);

        triggerStatus(t.dashboard.statusStoryGenerated);

      } catch (err) {

        setGeneratingAi(false);

        triggerStatus(t.dashboard.statusStorySaveError);

      }

    }, GENERATOR_STATUSES.length * 800 + 200);

  };



  const handleDeleteStory = async (id: string) => {

    if (!activeChild) return;

    const updatedList = customStoriesList.filter(item => item.id !== id);

    setCustomStoriesList(updatedList);



    try {

      const updated = await firebaseBridge.auth.updateChildSettings(activeChild.id, {

        customStories: JSON.stringify(updatedList)

      });

      setActiveChild(updated);

      firebaseBridge.auth.setActiveChild(updated);

      triggerStatus(t.dashboard.statusStoryDeleted);

    } catch (err) {

      triggerStatus(t.dashboard.statusStoryDeleteError);

    }

  };







  // --- PHASE 3 ROADMAP HANDLERS ---



  // Behavioral Dictionary CRUD

  const handleAddBehaviorSignal = async (e: React.FormEvent) => {

    e.preventDefault();

    if (!activeChild) return;

    if (!newSignal.trim() || !newMeaning.trim() || !newIntervention.trim()) {

      triggerStatus('Preencha todos os campos do sinal comportamental.');

      return;

    }



    const newItem = {

      id: Math.random().toString(36).substring(2, 9),

      signal: newSignal.trim(),

      meaning: newMeaning.trim(),

      intervention: newIntervention.trim(),

    };



    const updatedList = [...behaviorList, newItem];

    setBehaviorList(updatedList);



    try {

      const updated = await firebaseBridge.auth.updateChildSettings(activeChild.id, {

        behaviorDictionary: JSON.stringify(updatedList)

      });

      setActiveChild(updated);

      firebaseBridge.auth.setActiveChild(updated);

      setNewSignal('');

      setNewMeaning('');

      setNewIntervention('');

      triggerStatus('Sinal cadastrado com sucesso!');

    } catch (err) {

      triggerStatus('Erro ao salvar sinal no banco.');

    }

  };



  const handleDeleteBehaviorSignal = async (id: string) => {

    if (!activeChild) return;

    const updatedList = behaviorList.filter(item => item.id !== id);

    setBehaviorList(updatedList);



    try {

      const updated = await firebaseBridge.auth.updateChildSettings(activeChild.id, {

        behaviorDictionary: JSON.stringify(updatedList)

      });

      setActiveChild(updated);

      firebaseBridge.auth.setActiveChild(updated);

      triggerStatus(t.dashboard.statusSignalDeleted);

    } catch (err) {

      triggerStatus('Erro ao excluir sinal.');

    }

  };



  // Unexpected Change Management

  const handleDeclareUnexpectedChange = async (e: React.FormEvent) => {

    e.preventDefault();

    if (!activeChild) return;

    if (!selectedCancelTaskTitle || !changeReason.trim() || !changeReplacement.trim()) {

      triggerStatus(

        locale === 'es'

          ? 'Complete todos los campos del cambio inesperado.'

          : locale === 'en'

          ? 'Fill in all fields of the unexpected change.'

          : 'Preencha todos os campos da mudança inesperada.'

      );

      return;

    }



    const changeObj = {

      cancelledTaskTitle: selectedCancelTaskTitle,

      reason: changeReason.trim(),

      replacement: changeReplacement.trim()

    };



    try {

      const updated = await firebaseBridge.auth.updateChildSettings(activeChild.id, {

        unexpectedChange: JSON.stringify(changeObj)

      });

      setActiveChild(updated);

      firebaseBridge.auth.setActiveChild(updated);

      setUnexpectedChangeObj(changeObj);

      setChangeReason('');

      setChangeReplacement('');

      triggerStatus(

        locale === 'es'

          ? '¡Cambio de planes notificado al portal del niño!'

          : locale === 'en'

          ? 'Change of plans notified to the child\'s portal!'

          : 'Mudança de planos notificada ao portal da criança!'

      );

    } catch (err) {

      triggerStatus(

        locale === 'es'

          ? 'Error al registrar el cambio de planes.'

          : locale === 'en'

          ? 'Error registering change of plans.'

          : 'Erro ao registrar mudança de planos.'

      );

    }

  };



  const handleClearUnexpectedChange = async () => {

    if (!activeChild) return;

    try {

      const updated = await firebaseBridge.auth.updateChildSettings(activeChild.id, {

        unexpectedChange: null

      });

      setActiveChild(updated);

      firebaseBridge.auth.setActiveChild(updated);

      setUnexpectedChangeObj(null);

      setSelectedCancelTaskTitle('');

      triggerStatus(

        locale === 'es'

          ? 'Cambio de planes eliminado.'

          : locale === 'en'

          ? 'Change of plans removed.'

          : 'Mudança de planos removida.'

      );

    } catch (err) {

      triggerStatus(

        locale === 'es'

          ? 'Error al limpiar el cambio.'

          : locale === 'en'

          ? 'Error clearing change.'

          : 'Erro ao limpar mudança.'

      );

    }

  };



  // Scope-based Schedule Template Saving & Reapplying

  const handleSaveMonthlyTemplate = async () => {

    if (!activeChild) return;

    if (tasks.length === 0) {

      triggerStatus(t.dashboard.statusNoTasksToSave);

      return;

    }



    // Determine target tasks based on saveTemplateScope

    let targetTasks = [];

    if (saveTemplateScope === 'day') {

      targetTasks = tasks.filter(t => t.day === activeDayFilter);

      if (targetTasks.length === 0) {

        triggerStatus(locale === 'en' ? 'No tasks on this day to save.' : locale === 'es' ? 'No hay tareas en este día para guardar.' : 'Sem tarefas neste dia para salvar.');

        return;

      }

    } else if (saveTemplateScope === 'week') {

      const weeks = getWeeksOfMonth(activeMonth, activeYear);

      const dayNum = parseInt(activeDayFilter || '1', 10);

      const activeWeek = weeks.find(w => dayNum >= w.start && dayNum <= w.end) || weeks[0];

      targetTasks = tasks.filter(t => activeWeek.days.includes(t.day));

      if (targetTasks.length === 0) {

        triggerStatus(locale === 'en' ? 'No tasks in this week to save.' : locale === 'es' ? 'No hay tareas en esta semana para guardar.' : 'Sem tarefas nesta semana para salvar.');

        return;

      }

    } else {

      targetTasks = tasks;

    }



    const strippedTasks = targetTasks.map(t => {

      let relativeDay = t.day;

      if (saveTemplateScope === 'day') {

        relativeDay = '0';

      } else if (saveTemplateScope === 'week') {

        // Save as day of week (0 to 6, Sunday to Saturday) for flexible mapping

        const dateObj = new Date(activeYear, activeMonth - 1, parseInt(t.day, 10));

        relativeDay = String(dateObj.getDay());

      }

      return {

        title: t.title,

        time: t.time,

        period: t.period,

        day: relativeDay,

        isCompleted: false,

        order: t.order,

        icon: t.icon || '📅',

        customIcon: t.customIcon || null,

        category: t.category || 'AVD',

        duration: t.duration || 30,

        description: t.description || ''

      };

    });



    const templateData = {

      type: saveTemplateScope,

      sourceDay: activeDayFilter,

      tasks: strippedTasks

    };



    try {

      const updated = await firebaseBridge.auth.updateChildSettings(activeChild.id, {

        monthlyTemplate: JSON.stringify(templateData)

      });

      setActiveChild(updated);

      firebaseBridge.auth.setActiveChild(updated);

      

      const successMsg = saveTemplateScope === 'day'

        ? (locale === 'en' ? 'Day schedule saved as template successfully!' : locale === 'es' ? '¡Agenda del día guardada como modelo con éxito!' : 'Modelo de dia salvo como modelo com sucesso!')

        : saveTemplateScope === 'week'

        ? (locale === 'en' ? 'Week schedule saved as template successfully!' : locale === 'es' ? '¡Agenda de la semana guardada como modelo con éxito!' : 'Modelo de semana salvo como modelo com sucesso!')

        : t.dashboard.statusMonthSavedAsTemplate;

      

      triggerStatus(successMsg);

    } catch (err) {

      triggerStatus('Erro ao salvar modelo.');

    }

  };



  const handleReapplyMonthlyTemplate = () => {

    if (!activeChild || !activeChild.monthlyTemplate) {

      triggerStatus('Nenhum modelo salvo encontrado para este paciente.');

      return;

    }

    playBubble();

    setReapplyTargetType('days');

    setReapplySelectedDays([]);

    setReapplySelectedWeeks([]);

    setShowReapplyModal(true);

  };



  const handleExecuteReapply = async () => {

    if (!activeChild) return;

    if (!activeChild.monthlyTemplate) {

      triggerStatus('Nenhum modelo salvo encontrado para este paciente.');

      return;

    }



    let templateData;

    try {

      const parsed = JSON.parse(activeChild.monthlyTemplate);

      if (parsed && typeof parsed === 'object' && 'type' in parsed && 'tasks' in parsed) {

        templateData = parsed;

      } else if (Array.isArray(parsed)) {

        templateData = {

          type: 'month',

          tasks: parsed

        };

      }

    } catch (e) {

      triggerStatus('Erro ao decodificar modelo.');

      return;

    }



    if (!templateData || !templateData.tasks || templateData.tasks.length === 0) {

      triggerStatus('Modelo vazio ou inválido.');

      return;

    }



    const targetM = reapplyTargetMonthOffset === 0 ? activeMonth : (activeMonth === 12 ? 1 : activeMonth + 1);

    const targetY = reapplyTargetMonthOffset === 0 ? activeYear : (activeMonth === 12 ? activeYear + 1 : activeYear);

    const numDaysInTargetMonth = new Date(targetY, targetM, 0).getDate();



    // 1. Resolve Target Days

    let targetDays: string[] = [];

    if (reapplyTargetType === 'days') {

      targetDays = [...reapplySelectedDays];

    } else if (reapplyTargetType === 'weeks') {

      const targetWeeksList = getWeeksOfMonth(targetM, targetY);

      reapplySelectedWeeks.forEach(weekStr => {

        const wIdx = parseInt(weekStr, 10) - 1;

        const targetWeek = targetWeeksList[wIdx];

        if (targetWeek) {

          targetWeek.days.forEach(d => targetDays.push(d));

        }

      });

      targetDays = Array.from(new Set(targetDays));

    } else {

      // Entire Month

      for (let d = 1; d <= numDaysInTargetMonth; d++) {

        targetDays.push(String(d));

      }

    }



    if (targetDays.length === 0) {

      triggerStatus(

        locale === 'en'

          ? 'Please select at least one day or week.'

          : locale === 'es'

          ? 'Por favor, seleccione al menos un día o semana.'

          : 'Por favor, selecione pelo menos um dia ou semana.'

      );

      return;

    }



    const confirmMsg = locale === 'en'

      ? `Attention: Reapplying the template will replace all activities in the ${targetDays.length} selected day(s) of the target period. Do you want to continue?`

      : locale === 'es'

      ? `Atención: Reaplicar el modelo reemplazará todas las actividades en los ${targetDays.length} día(s) seleccionado(s) del período de destino. ¿Desea continuar?`

      : `Atenção: Reaplicar o modelo substituirá todas as atividades atuais nos ${targetDays.length} dia(s) selecionado(s) do período de destino. Deseja continuar?`;



    if (!window.confirm(confirmMsg)) {

      return;

    }



    try {

      // Fetch existing tasks of the target month so we don't wipe untouched days of the target month

      const targetMonthTasks = await firebaseBridge.db.getTasks(targetM, targetY);

      const untouchedTasks = targetMonthTasks.filter(t => !targetDays.includes(t.day));

      const mappedTemplateTasks: any[] = [];



      targetDays.forEach(tDay => {

        if (templateData.type === 'day') {

          templateData.tasks.forEach((tmplTask: any) => {

            mappedTemplateTasks.push({

              ...tmplTask,

              day: tDay,

              month: targetM,

              year: targetY

            });

          });

        } else if (templateData.type === 'week') {

          // Map week templates using weekday index (0 = Sunday, 6 = Saturday)

          const targetDateObj = new Date(targetY, targetM - 1, parseInt(tDay, 10));

          const targetWeekday = targetDateObj.getDay();

          const matchingTmplTasks = templateData.tasks.filter((t: any) => parseInt(t.day, 10) === targetWeekday);

          matchingTmplTasks.forEach((tmplTask: any) => {

            mappedTemplateTasks.push({

              ...tmplTask,

              day: tDay,

              month: targetM,

              year: targetY

            });

          });

        } else {

          const matchingTmplTasks = templateData.tasks.filter((t: any) => t.day === tDay);

          matchingTmplTasks.forEach((tmplTask: any) => {

            mappedTemplateTasks.push({

              ...tmplTask,

              day: tDay,

              month: targetM,

              year: targetY

            });

          });

        }

      });



      const newTasksToLoad = [...untouchedTasks, ...mappedTemplateTasks];



      await firebaseBridge.db.loadTemplate(newTasksToLoad, targetM, targetY);



      const successMsg = locale === 'en'

        ? 'Template applied successfully!'

        : locale === 'es'

        ? '¡Modelo aplicado con éxito!'

        : 'Modelo reaplicado com sucesso!';



      triggerStatus(successMsg);

      setShowReapplyModal(false);



      if (targetM === activeMonth && targetY === activeYear) {

        const updated = await firebaseBridge.db.getTasks(activeMonth, activeYear);

        setTasks(updated);

        window.dispatchEvent(new CustomEvent('firebase-mock-db-update', { detail: updated }));

      }

    } catch (err) {

      console.error(err);

      triggerStatus('Erro ao aplicar o modelo.');

    }

  };



    // Reset Routine to standard template

  const handleResetToDefaults = async () => {

    if (!window.confirm('Deseja realmente restaurar a agenda para a rotina padrão recomendada? Isso substituirá as tarefas existentes.')) return;

    

    playMarimba(329, 0.4);

    try {

      await firebaseBridge.db.resetToDefaults();

      await immutableLogger.logChange(

        'RESET_ROUTINE',

        'Restaurou toda a rotina semanal para o modelo padrão da clínica.',

        currentUser?.email

      );

      triggerStatus(t.dashboard.statusStandardRoutineRestored);

    } catch (err) {

      triggerStatus('Erro ao restaurar rotina.');

    }

  };



  // Clear tasks by scope (day, week, or month)

  const handleClearGrid = async (scope: 'day' | 'week' | 'month') => {

    let targetDays: string[] = [];

    let scopeLabel = '';



    if (scope === 'day') {

      targetDays = [activeDayFilter];

      scopeLabel = locale === 'en' ? `Day ${activeDayFilter}` : locale === 'es' ? `Día ${activeDayFilter}` : `Dia ${activeDayFilter}`;

    } else if (scope === 'week') {

      const weeks = getWeeksOfMonth(activeMonth, activeYear);

      const dayNum = parseInt(activeDayFilter || '1', 10);

      const activeWeek = weeks.find(w => dayNum >= w.start && dayNum <= w.end) || weeks[0];

      targetDays = [...activeWeek.days];

      scopeLabel = locale === 'en' ? `Week ${activeWeek.weekNum}` : locale === 'es' ? `Semana ${activeWeek.weekNum}` : `Semana ${activeWeek.weekNum}`;

    } else {

      targetDays = DAYS_OF_MONTH.map(d => d.key);

      const MONTH_NAMES: Record<string, string[]> = {

        pt: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],

        en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],

        es: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

      };

      const monthName = MONTH_NAMES[locale]?.[activeMonth - 1] || MONTH_NAMES['pt'][activeMonth - 1];

      scopeLabel = `${monthName} ${activeYear}`;

    }



    const confirmMsg = locale === 'en'

      ? `Attention: Are you sure you want to clear all tasks for ${scopeLabel}? This action cannot be undone.`

      : locale === 'es'

      ? `Atención: ¿Está seguro de que desea limpiar todas las tareas de ${scopeLabel}? Esta acción no se puede deshacer.`

      : `Atenção: Tem certeza que deseja limpar todas as tarefas de ${scopeLabel}? Esta ação não pode ser desfeita.`;



    if (!window.confirm(confirmMsg)) return;



    playMarimba(261.63, 0.5);

    try {

      const filteredTasks = tasks.filter(t => !targetDays.includes(t.day));

      await firebaseBridge.db.loadTemplate(filteredTasks, activeMonth, activeYear);



      const updated = await firebaseBridge.db.getTasks(activeMonth, activeYear);

      setTasks(updated);

      window.dispatchEvent(new CustomEvent('firebase-mock-db-update', { detail: updated }));



      await immutableLogger.logChange(

        'RESET_ROUTINE',

        `Limpou as tarefas do escopo: ${scopeLabel}`,

        currentUser?.email

      );



      triggerStatus(locale === 'en' ? 'Tasks cleared!' : locale === 'es' ? '¡Tareas limpiadas!' : 'Tarefas limpas!');

      setShowClearModal(false);

    } catch (err) {

      console.error(err);

      triggerStatus(locale === 'en' ? 'Error clearing tasks.' : locale === 'es' ? 'Error al limpiar tareas.' : 'Erro ao limpar tarefas.');

    }

  };



  const handleExportABAData = () => {

    playBubble();

    if (!activeChild) {

      triggerStatus(t.dashboard.statusSelectChildFirstToExport);

      return;

    }



    // CSV header with metadata

    let csvContent = `RELATORIO DE EVOLUCAO CLINICA ABA - ${activeChild.name.toUpperCase()}\n`;

    csvContent += `Data de Emissao:;${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}\n`;

    csvContent += `Responsavel:;${currentUser?.email || 'N/A'}\n`;

    csvContent += `Hiperfoco:;${activeChild.childHyperfocus || 'N/A'}\n`;

    csvContent += `Diagnostico:;${activeChild.diagnosis || 'N/A'}\n\n`;



    // 1. Routine activities section

    csvContent += `--- GRADE DE TAREFAS DA SEMANA ---\n`;

    csvContent += `Dia da Semana;Periodo;Horario;Atividade;Categoria;Status de Conclusao\n`;

    

    // Sort tasks logically by day index and then by time

    const dayIndices: { [key: string]: number } = { segunda: 1, terca: 2, quarta: 3, quinta: 4, sexta: 5, sabado: 6, domingo: 7 };

    const sortedTasks = [...tasks].sort((a, b) => {

      const dayDiff = (dayIndices[a.day] || 0) - (dayIndices[b.day] || 0);

      if (dayDiff !== 0) return dayDiff;

      return a.time.localeCompare(b.time);

    });



    sortedTasks.forEach(task => {

      const status = task.isCompleted ? 'CONCLUIDO' : 'PENDENTE';

      const category = task.category || 'AVD';

      csvContent += `"${task.day.toUpperCase()}";"${task.period.toUpperCase()}";"${task.time}";"${task.title.replace(/"/g, '""')}";"${category}";"${status}"\n`;

    });



    csvContent += `\n`;



    // 2. Sensory logs & crises section

    csvContent += `--- REGISTROS SENSORIAIS E DIARIO EMOCIONAL ---\n`;

    csvContent += `Data/Hora;Tipo de Registro;Descricao/Notas\n`;



    const sortedLogs = [...sensoryLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    sortedLogs.forEach(log => {

      const dateStr = new Date(log.timestamp).toLocaleString();

      const type = log.crisisOccurred ? 'CRISE SENSORIAL / DESREGULACAO' : `HUMOR: ${log.mood?.toUpperCase()}`;

      const notes = log.notes ? log.notes.replace(/"/g, '""') : 'Sem observacoes';

      csvContent += `"${dateStr}";"${type}";"${notes}"\n`;

    });



    // Generate blob and download

    try {

      const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });

      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');

      link.setAttribute('href', url);

      link.setAttribute('download', `laudo_aba_${activeChild.name.toLowerCase().replace(/\s+/g, '_')}.csv`);

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      triggerStatus('Planilha ABA (CSV) exportada com sucesso!');

    } catch (err) {

      console.error(err);

      triggerStatus('Erro ao exportar planilha CSV.');

    }

  };



  const getSensoryOverloadRisk = () => {

    if (!activeChild) return { 

      level: locale === 'en' ? 'Low 🟢' : locale === 'es' ? 'Bajo 🟢' : 'Baixo 🟢', 

      percentage: 15, 

      class: 'text-emerald-600 bg-emerald-50 border-emerald-200', 

      desc: locale === 'en' ? 'Schedule flowing well. No indicators of fatigue or resistance.' : locale === 'es' ? 'Agenda fluyendo bien. Sin indicativos de fatiga o resistencia.' : 'Agenda fluindo bem. Sem indicativos de fadiga ou resistência.' 

    };

    

    let score = 0;

    

    // 1. Completion Rate Factor (calculated over elapsed days to prevent false alerts)

    const currentDayNum = new Date().getDate();

    const elapsedDaysList = Array.from({ length: currentDayNum }, (_, i) => String(i + 1));

    const elapsedTasks = tasks.filter(t => elapsedDaysList.includes(t.day));

    

    const total = elapsedTasks.length;

    const completed = elapsedTasks.filter(t => t.isCompleted).length;

    const pendingRate = total > 0 ? (total - completed) / total : 0;

    score += pendingRate * 40;



    // 2. Sensory/Mood logs factor

    const recentLogs = sensoryLogs.slice(0, 5);

    let crisisCount = 0;

    let agitatedOrSadCount = 0;

    recentLogs.forEach(log => {

      if (log.crisisOccurred) {

        crisisCount++;

      } else if (log.mood === 'agitado' || log.mood === 'triste') {

        agitatedOrSadCount++;

      }

    });



    score += crisisCount * 25;

    score += agitatedOrSadCount * 12;



    const finalScore = Math.min(100, Math.max(5, Math.round(score)));



    if (finalScore >= 70) {

      return {

        level: locale === 'en' ? 'HIGH 🚨' : locale === 'es' ? 'ALTO 🚨' : 'ALTO 🚨',

        percentage: finalScore,

        class: 'text-red-705 bg-red-50 border-red-200',

        desc: locale === 'en' ? 'High probability of nervous exhaustion or meltdown. Recommended: reduce demands, activate Sensory Regulation template, and offer sensory refuge breaks.' : locale === 'es' ? 'Alta probabilidad de agotamiento nervioso o meltdown. Recomendado: reducir exigencias, activar la plantilla de Regulación Sensorial y ofrecer descansos en el refugio.' : 'Alta probabilidade de esgotamento nervoso ou meltdown. Recomendado: reduzir cobrança, ativar o modelo de Regulação Sensorial e oferecer pausas no refúgio.'

      };

    } else if (finalScore >= 35) {

      return {

        level: locale === 'en' ? 'Moderate ⚠️' : locale === 'es' ? 'Moderado ⚠️' : 'Moderado ⚠️',

        percentage: finalScore,

        class: 'text-amber-705 bg-amber-50 border-amber-250',

        desc: locale === 'en' ? 'Subtle signs of resistance or mood swing. Watch for physical signs of agitation. Avoid transitions without the 5-minute visual warning.' : locale === 'es' ? 'Señales sutiles de resistencia o fluctuación de humor. Fíjese en señales físicas de agitación. Evite transiciones sin el aviso visual de 5 minutos.' : 'Sinais sutis de resistência ou oscilação de humor. Fique atento a sinais físicos de agitação. Evite transições sem o aviso visual de 5 minutos.'

      };

    } else {

      return {

        level: locale === 'en' ? 'Low 🟢' : locale === 'es' ? 'Bajo 🟢' : 'Baixo 🟢',

        percentage: finalScore,

        class: 'text-emerald-705 bg-emerald-50 border-emerald-200',

        desc: locale === 'en' ? 'Regulated behavior and stable compliance. Continue with positive reinforcement!' : locale === 'es' ? 'Comportamiento regulado y conformidad estable. ¡Continúe con el refuerzo positivo!' : 'Comportamento regulado e conformidade estável. Continue com o reforço positivo!'

      };

    }

  };



  const triggerStatus = (msg: string) => {

    setStatusMessage(msg);

    setTimeout(() => setStatusMessage(''), 4000);

  };



  const getCorrelationInsights = () => {

    const insights: { type: 'danger' | 'warning' | 'info'; text: string }[] = [];

    if (!sensoryLogs || sensoryLogs.length === 0) return insights;



    const crises = sensoryLogs.filter(log => log.crisisOccurred);



    const highNoiseCrises = crises.filter(log => log.decibels && log.decibels > 70).length;

    if (highNoiseCrises >= 2) {

      insights.push({

        type: 'danger',

        text: locale === 'en' 

          ? `High risk of crisis when noise exceeds 70dB (${highNoiseCrises} events recorded in loud environments).`

          : locale === 'es'

          ? `Alto riesgo de crisis cuando el ruido supera los 70dB (${highNoiseCrises} eventos registrados en ambientes ruidosos).`

          : `Risco de crise elevado quando ruído ultrapassa 70dB (${highNoiseCrises} eventos registrados em ambientes com som alto).`

      });

    }



    const brightLightCrises = crises.filter(log => log.lightLevel === 'Alta').length;

    if (brightLightCrises >= 2) {

      insights.push({

        type: 'danger',

        text: locale === 'en'

          ? 'High probability of sensory overload associated with bright light environments / strong lights.'

          : locale === 'es'

          ? 'Alta probabilidad de sobrecarga sensorial asociada a ambientes con mucha luz / luces fuertes.'

          : 'Alta probabilidade de sobrecarga sensorial associada a ambientes com luminosidade alta / luzes fortes.'

      });

    }



    const triggerCounts: Record<string, number> = {};

    crises.forEach(log => {

      if (log.trigger && log.trigger !== 'Nenhum') {

        triggerCounts[log.trigger] = (triggerCounts[log.trigger] || 0) + 1;

      }

    });



    Object.entries(triggerCounts).forEach(([trigger, count]) => {

      if (count >= 2) {

        insights.push({

          type: 'warning',

          text: locale === 'en'

            ? `Recurrent trigger detected: "${trigger}" triggered behavioral dysregulation on at least ${count} occasions.`

            : locale === 'es'

            ? `Desencadenante recurrente detectado: "${trigger}" causó desregulación conductual en al menos ${count} ocasiones.`

            : `Gatilho recorrente detectado: "${trigger}" desencadeou desregulação comportamental em pelo menos ${count} ocasiões.`

        });

      }

    });



    const locationCounts: Record<string, number> = {};

    crises.forEach(log => {

      if (log.location) {

        locationCounts[log.location] = (locationCounts[log.location] || 0) + 1;

      }

    });



    Object.entries(locationCounts).forEach(([loc, count]) => {

      if (count >= 2) {

        const locTrans = loc === 'Escola' 

          ? (locale === 'en' ? 'school' : locale === 'es' ? 'escuela' : 'Escola')

          : (loc === 'Casa' ? (locale === 'en' ? 'home' : locale === 'es' ? 'casa' : 'Casa') : loc);

        insights.push({

          type: 'warning',

          text: locale === 'en'

            ? `High vulnerability environment: the location "${locTrans}" is correlated to repeated crises (${count} records).`

            : locale === 'es'

            ? `Ambiente de alta vulnerabilidad: el lugar "${locTrans}" está correlacionado con crisis repetidas (${count} registros).`

            : `Ambiente de alta vulnerabilidade: o local "${loc}" está correlacionado a crises repetidas (${count} registros).`

        });

      }

    });



    if (insights.length === 0) {

      insights.push({

        type: 'info',

        text: locale === 'en'

          ? 'No strong trigger correlations found in the last crises. Continue logging antecedent, noise, and light data.'

          : locale === 'es'

          ? 'No se encontraron correlaciones fuertes de desencadenantes en las últimas crisis. Continúe registrando datos de antecedente, ruido y luz.'

          : 'Não foram encontradas correlações fortes de gatilhos nas últimas crises. Continue registrando os dados de antecedente, ruído e luz.'

      });

    }



    return insights;

  };



  const getAIPatternAlerts = () => {

    const alerts: { title: string; trigger: string; recommendation: string; percentage: number; type: 'danger' | 'warning' | 'info' }[] = [];

    

    const activeChildName = activeChild?.name || (locale === 'en' ? 'the child' : locale === 'es' ? 'el niño' : 'a criança');

    const childDiagnosis = activeChild?.diagnosis || (locale === 'en' ? 'Autism' : locale === 'es' ? 'Autismo' : 'Autismo');

    const childHyperfocus = activeChild?.childHyperfocus || (locale === 'en' ? 'Dinosaurs' : locale === 'es' ? 'Dinosaurios' : 'Dinossauros');



    const crises = sensoryLogs.filter(log => log.crisisOccurred);



    // If we have some crises, let's analyze them

    if (crises.length > 0) {

      // Analyze decibel correlation

      const highNoiseCrises = crises.filter(log => log.decibels && log.decibels > 70);

      const noisePercentage = Math.round((highNoiseCrises.length / crises.length) * 100);

      

      if (noisePercentage >= 30) {

        alerts.push({

          title: locale === 'en' ? 'Acute Auditory Sensitivity' : locale === 'es' ? 'Sensibilidad Auditiva Aguda' : 'Sensibilidade Auditiva Aguda',

          trigger: locale === 'en' 

            ? `Trigger detected: ${noisePercentage}% of ${activeChildName}'s crises occurred in environments with noise higher than 70dB.`

            : locale === 'es'

            ? `Desencadenante detectado: el ${noisePercentage}% de las crisis de ${activeChildName} ocurrieron en ambientes con ruido superior a 70dB.`

            : `Gatilho detectado: ${noisePercentage}% das crises de ${activeChildName} ocorreram em ambientes com ruído superior a 70dB.`,

          recommendation: locale === 'en'

            ? `Use ear muffs during noisy activities. We recommend setting up a visual transition warning and directing ${activeChildName} to the sensory refuge with a soft marimba sound.`

            : locale === 'es'

            ? `Use orejeras protectoras durante actividades ruidosas. Recomendamos configurar un aviso visual de transición y dirigir a ${activeChildName} al refugio sensorial con sonido de marimba suave.`

            : `Utilize abafadores de som durante atividades barulhentas. Recomendamos configurar um aviso visual de transição e direcionar ${activeChildName} ao refúgio sensorial com som de marimba suave.`,

          percentage: noisePercentage,

          type: 'danger'

        });

      }



      // Analyze task correlation

      const categoryCrisisCounts: Record<string, number> = { AVD: 0, Aprendizado: 0, Lazer: 0 };

      let matchedPrecedingCount = 0;



      crises.forEach(log => {

        const crisisDate = new Date(log.timestamp);

        const dayStr = String(crisisDate.getDate());

        

        // Find completed tasks on the same day that happened before the crisis (up to 2.5 hours before)

        const precedingTasks = tasks.filter(t => {

          if (t.day !== dayStr || !t.isCompleted) return false;

          try {

            const [tHour, tMin] = t.time.split(':').map(Number);

            const tDate = new Date(crisisDate.getFullYear(), crisisDate.getMonth(), crisisDate.getDate(), tHour, tMin);

            const diffMin = (crisisDate.getTime() - tDate.getTime()) / (1000 * 60);

            return diffMin >= 0 && diffMin <= 150; // within 2.5 hours

          } catch (e) {

            return false;

          }

        });



        precedingTasks.forEach(t => {

          const cat = t.category || 'AVD';

          categoryCrisisCounts[cat] = (categoryCrisisCounts[cat] || 0) + 1;

          matchedPrecedingCount++;

        });

      });



      if (matchedPrecedingCount > 0) {

        if (categoryCrisisCounts['Aprendizado'] > 0) {

          const learnPercentage = Math.round((categoryCrisisCounts['Aprendizado'] / crises.length) * 100);

          alerts.push({

            title: locale === 'en' ? 'Cognitive Overload (Study)' : locale === 'es' ? 'Sobrecarga Cognitiva (Estudio)' : 'Sobrecarga Cognitiva (Estudo)',

            trigger: locale === 'en'

              ? `Correlation identified: 'Learning' / 'Study' tasks precede ${learnPercentage}% of dysregulation episodes.`

              : locale === 'es'

              ? `Correlación identificada: tareas de 'Aprendizaje' / 'Estudio' preceden el ${learnPercentage}% de los episodios de desregulación.`

              : `Correlação identificada: tarefas de 'Aprendizado' / 'Estudo' precedem ${learnPercentage}% dos episódios de desregulação.`,

            recommendation: locale === 'en'

              ? `Avoid study sessions longer than 30-40 consecutive minutes. Alternate with active and playful breaks of 10 minutes using the hyperfocus on "${childHyperfocus}".`

              : locale === 'es'

              ? `Evite sesiones de estudio superiores a 30-40 minutos seguidos. Intercale con pausas activas y lúdicas de 10 minutos usando el hiperenfoque en "${childHyperfocus}".`

              : `Evite sessões de estudo superiores a 30-40 minutos seguidos. Intercale com pausas ativas e lúdicas de 10 minutos usando o hiperfoco em "${childHyperfocus}".`,

            percentage: learnPercentage,

            type: 'danger'

          });

        }

        

        if (categoryCrisisCounts['AVD'] > 0) {

          const avdPercentage = Math.round((categoryCrisisCounts['AVD'] / crises.length) * 100);

          const locName = locale === 'en' 

            ? (crises[0].location === 'Escola' ? 'school' : 'home') 

            : locale === 'es' 

            ? (crises[0].location === 'Escola' ? 'la escuela' : 'casa') 

            : (crises[0].location || 'casa');

          alerts.push({

            title: locale === 'en' ? 'Transition Resistance in ADLs' : locale === 'es' ? 'Resistencia de Transición en AVD' : 'Resistência de Transição em AVDs',

            trigger: locale === 'en'

              ? `Association identified: 'Daily Life' tasks (hygiene, dressing) precede ${avdPercentage}% of crises at ${locName}.`

              : locale === 'es'

              ? `Asociación identificada: tareas de 'Vida Diaria' (higiene, vestirse) anteceden el ${avdPercentage}% de las crisis en ${locName}.`

              : `Associação identificada: tarefas de 'Vida Diária' (higiene, vestir-se) antecedem ${avdPercentage}% das crises em ${crises[0].location || 'casa'}.`,

            recommendation: locale === 'en'

              ? `Strengthen predictability with visual warnings. Use the custom familiar audio recording of 5 or 10 minutes to ease the transition.`

              : locale === 'es'

              ? `Fortalezca la previsibilidad con avisos visuales. Utilice la grabación de audio familiar personalizada de 5 o 10 minutos para suavizar la transición.`

              : `Fortaleça a previsibilidade com avisos visuais. Utilize a gravação de áudio familiar personalizada de 5 ou 10 minutos para suavizar a transição.`,

            percentage: avdPercentage,

            type: 'warning'

          });

        }

      }

    }



    // Always generate premium clinical insights based on child diagnosis & hyperfocus if alerts count is low

    if (alerts.length < 3) {

      alerts.push({

        title: locale === 'en' ? `Hyperfocus Strategy based on ${childHyperfocus}` : locale === 'es' ? `Estrategia de Hiperenfoque basada en ${childHyperfocus}` : `Estratégia de Hiperfoco baseada em ${childHyperfocus}`,

        trigger: locale === 'en'

          ? `Engagement Analysis: The intrinsic interest in "${childHyperfocus}" is a strong behavior regulator.`

          : locale === 'es'

          ? `Análisis de Compromiso: El interés intrínseco por "${childHyperfocus}" es un fuerte regulador del comportamiento.`

          : `Análise de Engajamento: O interesse intrínseco por "${childHyperfocus}" é um forte regulador de comportamento.`,

        recommendation: locale === 'en'

          ? `Insert visual elements of "${childHyperfocus}" (drawings, stickers, or custom rewards) before low-adherence tasks (like hygiene or bathing) to reduce transition anxiety.`

          : locale === 'es'

          ? `Inserte elementos visuales de "${childHyperfocus}" (dibujos, pegatinas o recompensas personalizadas) antes de tareas de baja adherencia (como higiene o baño) para reducir la ansiedad de transición.`

          : `Insira elementos visuais de "${childHyperfocus}" (desenhos, adesivos ou recompensas personalizadas) antes de tarefas de baixa aderência (como higiene ou banho) para reduzir a ansiedade de transição.`,

        percentage: 85,

        type: 'info'

      });



      alerts.push({

        title: locale === 'en' ? 'Routine and Rigidity Mapping' : locale === 'es' ? 'Mapeo de Rutina y Rigidez' : 'Mapeamento de Rotina e Rigidez',

        trigger: locale === 'en'

          ? 'Clinical Pattern: Unscheduled transitions generate immediate overload.'

          : locale === 'es'

          ? 'Patrón Clínico: Las transiciones no programadas generan sobrecarga inmediata.'

          : 'Padrão Clínico: Transições não programadas geram sobrecarga imediata.',

        recommendation: locale === 'en'

          ? `Maintain the routine with a high level of predictability. If there is an unavoidable change, register it in the "Unexpected Change" panel so the AI can adjust the mascot's sensory pause times.`

          : locale === 'es'

          ? `Mantenga la rutina con un alto nivel de previsibilidad. Si hay un cambio inevitable, regístrelo en el panel de "Cambio Inesperado" para que la AI ajuste los tiempos de pausa sensorial de la mascota.`

          : `Mantenha a rotina com alto índice de previsibilidade. Caso haja uma alteração inevitável, registre no painel de "Mudança Inesperada" para que a IA ajuste os tempos de pausa sensorial do mascote.`,

        percentage: 75,

        type: 'info'

      });



      if (alerts.length < 3) {

        alerts.push({

          title: locale === 'en' ? 'Night Crisis Prevention' : locale === 'es' ? 'Prevención de Crisis Nocturna' : 'Prevenção de Crise Noturna',

          trigger: locale === 'en'

            ? 'Circadian Rhythm Analysis: Accumulation of stimuli in the late afternoon.'

            : locale === 'es'

            ? 'Análisis del Ritmo Circadiano: Acumulación de estímulos al final de la tarde.'

            : 'Análise de Ritmo Circadiano: Acúmulo de estímulos no final da tarde.',

          recommendation: locale === 'en'

            ? `Decrease the volume of noises and lights starting at 6:30 PM. Activate the mascot's "Calm Mode" with a simulated noise canceler on the child's routine screen.`

            : locale === 'es'

            ? `Disminuya el volumen de ruidos y luces a partir de las 18:30. Active el "Modo Calma" de la mascota con un abofador de ruidos simulado en la pantalla de la rutina del niño.`

            : `Diminua o volume de ruídos e luzes a partir das 18:30. Ative o "Modo Calmo" do mascote com abafador de ruídos simulado na tela da rotina da criança.`,

          percentage: 60,

          type: 'warning'

        });

      }

    }



    return alerts.slice(0, 3);

  };



  // Week calculations for weekly schedule view (Sunday to Saturday weeks)

  const currentWeeks = React.useMemo(() => {

    return getWeeksOfMonth(activeMonth, activeYear);

  }, [activeMonth, activeYear]);



  const activeWeekInfo = React.useMemo(() => {

    const dayNum = parseInt(activeDayFilter || '1', 10);

    return currentWeeks.find(w => dayNum >= w.start && dayNum <= w.end) || currentWeeks[0];

  }, [currentWeeks, activeDayFilter]);



  const weekStart = activeWeekInfo ? activeWeekInfo.start : 1;

  const weekEnd = activeWeekInfo ? activeWeekInfo.end : Math.min(7, DAYS_OF_MONTH.length);

  const weekDays = activeWeekInfo 

    ? activeWeekInfo.days.map(d => parseInt(d, 10))

    : Array.from({ length: weekEnd - weekStart + 1 }, (_, i) => weekStart + i);



  return (

    <div className="min-h-screen flex flex-col lg:flex-row bg-[#f8fafc]">

      <GlobalNav />

      <main className="flex-1 min-h-screen text-slate-900 pb-16 relative">

      {offline && (

        <div className="bg-amber-500 text-white py-2 px-4 text-center text-xs font-black select-none z-50 flex items-center justify-center gap-2 font-Outfit shadow-md">

          <span>📶 {locale === 'es' ? 'Modo Offline Activado' : locale === 'en' ? 'Offline Mode Activated' : 'Modo Offline Ativado'}</span>

          {offlineQueueSize > 0 && (

            <span className="bg-amber-700/60 px-2 py-0.5 rounded text-[10px]">

              {offlineQueueSize} {offlineQueueSize === 1 

                ? (locale === 'es' ? 'cambio pendiente' : locale === 'en' ? 'pending change' : 'alteração pendente') 

                : (locale === 'es' ? 'cambios pendientes' : locale === 'en' ? 'pending changes' : 'alterações pendentes')}

            </span>

          )}

        </div>

      )}

      {/* Header bar */}

      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">

        <div className="max-w-6xl mx-auto px-4 py-3 md:py-4 flex flex-row items-center justify-between gap-2">

          <div className="flex items-center gap-2.5">

            <div className="w-9 h-9 md:w-10 md:h-10 grad-primary text-white rounded-xl flex items-center justify-center font-bold text-base md:text-lg shadow-sm shrink-0">

              PA

            </div>

            <div>

              <h1 className="text-sm md:text-xl font-black text-slate-955 font-Outfit leading-tight">

                {locale === 'es' ? 'Portal del Responsable' : locale === 'en' ? 'Guardian Portal' : `Painel do ${t.common.navResponsible}`}

              </h1>

              <p className="hidden md:block text-xs text-slate-655 font-semibold mt-0.5">

                {locale === 'es' ? 'Control de Rutina y Seguridad Sensorial' : locale === 'en' ? 'Routine Control & Sensory Safety' : 'Controle de Rotina & Segurança Sensorial'}

              </p>

            </div>

          </div>



          <div className="flex items-center gap-2 md:gap-3 shrink-0">

            <div ref={preferencesMenuRef} className="relative z-45">
              <button
                type="button"
                onClick={() => { playBubble(); setShowPreferencesMenu(!showPreferencesMenu); }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 text-xs font-black rounded-full transition-all cursor-pointer active:scale-95 font-Outfit"
              >
                ⚙️ {locale === 'en' ? 'Preferences' : locale === 'es' ? 'Preferencias' : 'Preferências'}
              </button>
              
              <AnimatePresence>
                {showPreferencesMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    className="absolute top-12 right-0 w-[23rem] max-w-[92vw] bg-white border border-slate-200 rounded-2xl shadow-lg p-5 flex flex-col gap-4 z-50 text-left dark:bg-slate-900 dark:border-slate-800"
                  >
                    {/* Header Tabs */}
                    <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl gap-1 select-none">
                      {(['conta', 'sensorial', 'seguranca', 'plano'] as const).map(tab => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => { playBubble(); setActivePrefTab(tab); }}
                          className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all cursor-pointer text-center ${
                            activePrefTab === tab
                              ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-900 dark:text-indigo-200'
                              : 'text-slate-500 hover:text-slate-800 dark:text-slate-500 dark:hover:text-slate-300'
                          }`}
                        >
                          {tab === 'conta' 
                            ? (locale === 'en' ? '👤 Account' : locale === 'es' ? '👤 Cuenta' : '👤 Conta')
                            : tab === 'sensorial' 
                            ? (locale === 'en' ? '🧠 Sensory' : locale === 'es' ? '🧠 Sensorial' : '🧠 Sensor.')
                            : tab === 'seguranca' 
                            ? (locale === 'en' ? '🔒 Secur.' : locale === 'es' ? '🔒 Segur.' : '🔒 Segur.')
                            : (locale === 'en' ? '💳 Plan' : locale === 'es' ? '💳 Plan' : '💳 Plano')}
                        </button>
                      ))}
                    </div>

                    {/* Tab 1: Conta (User Details, Change Password, Language, Theme) */}
                    {activePrefTab === 'conta' && (
                      <div className="flex flex-col gap-3 animate-pop">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                            {locale === 'en' ? 'Guardian E-mail' : locale === 'es' ? 'E-mail del Responsable' : 'E-mail do Responsável'}
                          </span>
                          <span className="text-xs font-extrabold text-slate-850 dark:text-slate-200 truncate" title={currentUser?.email || ''}>
                            🧑‍💻 {currentUser?.email}
                          </span>
                        </div>

                        {/* Change Password */}
                        <div className="flex flex-col gap-1 border-t border-slate-100 dark:border-slate-800 pt-2.5">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                            {locale === 'en' ? 'Change Password' : locale === 'es' ? 'Cambiar Contraseña' : 'Alterar Senha'}
                          </span>
                          <div className="flex gap-1.5 mt-0.5">
                            <input
                              type="password"
                              value={newPassword}
                              onChange={e => setNewPassword(e.target.value)}
                              placeholder={locale === 'en' ? 'Min 6 chars' : locale === 'es' ? 'Mín 6 caracteres' : 'Mín 6 caracteres'}
                              className="flex-1 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-slate-750 dark:text-slate-300 text-xs font-bold rounded-lg outline-none focus:border-indigo-500"
                            />
                            <button
                              type="button"
                              onClick={async () => {
                                if (newPassword.length < 6) {
                                  playMarimba(196, 0.3);
                                  triggerStatus(locale === 'en' ? 'Password must be at least 6 characters!' : locale === 'es' ? '¡La contraseña debe tener al menos 6 caracteres!' : 'A senha deve ter no mínimo 6 caracteres!');
                                  return;
                                }
                                try {
                                  playMarimba(329.63, 0.3);
                                  await firebaseBridge.auth.updateProfileSettings({ password: newPassword });
                                  setNewPassword('');
                                  triggerStatus(locale === 'en' ? 'Password changed!' : locale === 'es' ? '¡Contraseña actualizada!' : 'Senha atualizada com sucesso!');
                                } catch (err: any) {
                                  triggerStatus(locale === 'en' ? 'Error changing password' : locale === 'es' ? 'Error al cambiar contraseña' : 'Erro ao alterar senha');
                                }
                              }}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase rounded-lg cursor-pointer transition-all active:scale-95 border-none font-Outfit"
                            >
                              {locale === 'en' ? 'Update' : locale === 'es' ? 'Actualizar' : 'Alterar'}
                            </button>
                          </div>
                        </div>

                        {/* Theme Switcher */}
                        <div className="flex flex-col gap-1.5 border-t border-slate-100 dark:border-slate-800 pt-2.5">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                            {locale === 'en' ? 'App Theme' : locale === 'es' ? 'Tema de la Aplicación' : 'Tema do App'}
                          </span>
                          <button
                            type="button"
                            onClick={toggleTheme}
                            className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer font-Outfit text-slate-750 dark:text-slate-300"
                          >
                            <span>{theme === 'light' ? (locale === 'en' ? 'Dark Mode 🌙' : locale === 'es' ? 'Modo Oscuro 🌙' : 'Modo Escuro 🌙') : (locale === 'en' ? 'Light Mode ☀️' : locale === 'es' ? 'Modo Claro ☀️' : 'Modo Claro ☀️')}</span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{locale === 'en' ? 'Toggle' : locale === 'es' ? 'Alternar' : 'Alternar'}</span>
                          </button>
                        </div>

                        {/* Language Selector */}
                        <div className="flex flex-col gap-1.5 border-t border-slate-100 dark:border-slate-800 pt-2.5">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                            {locale === 'en' ? 'Language' : locale === 'es' ? 'Idioma' : 'Idioma'}
                          </span>
                          <div className="flex justify-start">
                            <LanguageSelector />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tab 2: Sensorial (Interactive Clinical/Sensory Adjustments) */}
                    {activePrefTab === 'sensorial' && (
                      <div className="flex flex-col gap-2.5 animate-pop max-h-72 overflow-y-auto pr-1">
                        {activeChild ? (
                          <>
                            {/* Interface Complexity Level */}
                            <div className="flex flex-col gap-1 p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900">
                              <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-300 uppercase tracking-wide">
                                {locale === 'en' ? '🎚️ Interface Level (Complexity)' : locale === 'es' ? '🎚️ Nivel de Interfaz (Complejidad)' : '🎚️ Nível de Interface (Complexidade)'}
                              </span>
                              <select
                                value={interfaceMode}
                                onChange={async (e) => {
                                  const val = e.target.value as 'foco' | 'intermediario' | 'completo';
                                  setInterfaceMode(val);
                                  const updated = await firebaseBridge.auth.updateChildSettings(activeChild.id, { interfaceMode: val });
                                  setActiveChild(updated);
                                  triggerStatus(locale === 'en' ? 'Interface level updated!' : locale === 'es' ? '¡Nivel de interfaz actualizado!' : 'Nível de interface atualizado!');
                                }}
                                className="w-full px-2 py-1.5 bg-white dark:bg-slate-800/60 border border-indigo-200 dark:border-indigo-800 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg outline-none cursor-pointer"
                              >
                                <option value="foco">{locale === 'en' ? 'Focus (Essential) 🎯' : locale === 'es' ? 'Enfoque (Esencial) 🎯' : 'Foco (Essencial) 🎯'}</option>
                                <option value="intermediario">{locale === 'en' ? 'Intermediate 🌱' : locale === 'es' ? 'Intermedio 🌱' : 'Intermediário 🌱'}</option>
                                <option value="completo">{locale === 'en' ? 'Complete (All features) 🚀' : locale === 'es' ? 'Completo (Todo) 🚀' : 'Completo (Tudo) 🚀'}</option>
                              </select>
                              <p className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                                {interfaceMode === 'foco'
                                  ? (locale === 'en' ? 'Only the essentials: schedule, current task, timer, calm/SOS, mood and Voice (AAC). No games, shop or extras. Ideal for ASD level 3 / attention deficit.' : locale === 'es' ? 'Solo lo esencial: agenda, tarea actual, temporizador, calma/SOS, ánimo y Voz (CAA). Sin juegos, tienda ni extras. Ideal para TEA nivel 3 / déficit de atención.' : 'Só o essencial: agenda, tarefa atual, cronômetro, calma/SOS, humor e Minha Voz (CAA). Sem jogos, loja ou extras. Ideal para TEA nível 3 / déficit de atenção.')
                                  : interfaceMode === 'intermediario'
                                  ? (locale === 'en' ? 'Adds social stories, waiting hourglass, calming sounds, sleep mode, event simulator and star rewards. For children in development.' : locale === 'es' ? 'Agrega historias sociales, reloj de espera, sonidos calmantes, modo sueño, simulador de eventos y recompensas con estrellas. Para niños en desarrollo.' : 'Adiciona histórias sociais, ampulheta de espera, sons calmantes, modo sono, simulador de eventos e recompensas por estrelas. Para crianças em desenvolvimento.')
                                  : (locale === 'en' ? 'All features enabled: mascot shop, My World, noise monitor, AI stories, accessories and badges. For more mature children.' : locale === 'es' ? 'Todas las funciones: tienda del mascota, Mi Mundo, monitor de ruido, historias con IA, accesorios y medallas. Para niños más maduros.' : 'Todas as funções: Loja do Mascote, Meu Mundo, monitor de ruído, histórias por IA, acessórios e medalhas. Para crianças mais maduras.')}
                              </p>
                            </div>

                            {/* Sensory Profile */}
                            <div className="flex flex-col gap-1">
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">
                                {locale === 'en' ? 'Sensory Profile' : locale === 'es' ? 'Perfil Sensorial' : 'Perfil Sensorial'}
                              </span>
                              <select
                                value={sensoryProfile}
                                onChange={async (e) => {
                                  const val = e.target.value as 'balanced' | 'hypersensitive' | 'hyposensitive';
                                  setSensoryProfile(val);
                                  let speed = sensorySpeed;
                                  let visuals = sensoryVisuals;
                                  if (val === 'hypersensitive') {
                                    speed = 0.7;
                                    visuals = 'minimal';
                                    setSensorySpeed(0.7);
                                    setSensoryVisuals('minimal');
                                  } else if (val === 'hyposensitive') {
                                    speed = 1.2;
                                    visuals = 'rich';
                                    setSensorySpeed(1.2);
                                    setSensoryVisuals('rich');
                                  }
                                  const updated = await firebaseBridge.auth.updateChildSettings(activeChild.id, {
                                    sensoryProfile: val,
                                    sensorySpeed: speed,
                                    sensoryVisuals: visuals
                                  });
                                  setActiveChild(updated);
                                  triggerStatus(locale === 'en' ? 'Sensory profile updated!' : locale === 'es' ? '¡Perfil sensorial actualizado!' : 'Perfil sensorial atualizado!');
                                }}
                                className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 text-xs font-bold rounded-lg outline-none cursor-pointer"
                              >
                                <option value="balanced">{locale === 'en' ? 'Balanced 🧘' : locale === 'es' ? 'Equilibrado 🧘' : 'Equilibrado 🧘'}</option>
                                <option value="hypersensitive">{locale === 'en' ? 'Hypersensitive (Low Stim) 🔇' : locale === 'es' ? 'Hipersensible (Bajo Estímulo) 🔇' : 'Hipersensível (Baixo Estímulo) 🔇'}</option>
                                <option value="hyposensitive">{locale === 'en' ? 'Hyposensitive (Stimulating) ⚡' : locale === 'es' ? 'Hiposensible (Estímulo Extra) ⚡' : 'Hipossensível (Estímulo Extra) ⚡'}</option>
                              </select>
                            </div>

                            {/* Sound Style */}
                            <div className="flex flex-col gap-1">
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">
                                {locale === 'en' ? 'Sound Style' : locale === 'es' ? 'Estilo de Sonido' : 'Estilo de Som'}
                              </span>
                              <select
                                value={sensorySound}
                                onChange={async (e) => {
                                  const val = e.target.value as any;
                                  setSensorySound(val);
                                  const updated = await firebaseBridge.auth.updateChildSettings(activeChild.id, { sensorySound: val });
                                  setActiveChild(updated);
                                  triggerStatus(locale === 'en' ? 'Sound updated!' : locale === 'es' ? '¡Efecto de sonido actualizado!' : 'Efeito sonoro atualizado!');
                                }}
                                className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-355 text-xs font-bold rounded-lg outline-none cursor-pointer"
                              >
                                <option value="marimba">{locale === 'en' ? 'Marimba 🪵' : locale === 'es' ? 'Marimba 🪵' : 'Marimba 🪵'}</option>
                                <option value="bubble">{locale === 'en' ? 'Bubbles 🫧' : locale === 'es' ? 'Burbujas 🫧' : 'Bolhas 🫧'}</option>
                                <option value="silent">{locale === 'en' ? 'Silent 🔕' : locale === 'es' ? 'Silencioso 🔕' : 'Silencioso 🔕'}</option>
                              </select>
                            </div>

                            {/* Visual Stimulation */}
                            <div className="flex flex-col gap-1">
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">
                                {locale === 'en' ? 'Visual Stimulation' : locale === 'es' ? 'Estímulos Visuales' : 'Filtro Visual'}
                              </span>
                              <select
                                value={sensoryVisuals}
                                onChange={async (e) => {
                                  const val = e.target.value as any;
                                  setSensoryVisuals(val);
                                  const updated = await firebaseBridge.auth.updateChildSettings(activeChild.id, { sensoryVisuals: val });
                                  setActiveChild(updated);
                                  triggerStatus(locale === 'en' ? 'Visual stimulation updated!' : locale === 'es' ? '¡Estilo visual actualizado!' : 'Estilo visual atualizado!');
                                }}
                                className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-355 text-xs font-bold rounded-lg outline-none cursor-pointer"
                              >
                                <option value="rich">{locale === 'en' ? 'Interactive / Rich ✨' : locale === 'es' ? 'Interactivo / Rico ✨' : 'Interativo / Rico ✨'}</option>
                                <option value="minimal">{locale === 'en' ? 'Minimal / Low Stim 🧘' : locale === 'es' ? 'Minimalista / Bajo Estímulo 🧘' : 'Minimalista / Baixo Estímulo 🧘'}</option>
                              </select>
                            </div>

                            {/* Mascot Speed */}
                            <div className="flex flex-col gap-1">
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">
                                {locale === 'en' ? 'Speech Speed' : locale === 'es' ? 'Velocidad de Voz' : 'Velocidade da Voz'}
                              </span>
                              <select
                                value={sensorySpeed}
                                onChange={async (e) => {
                                  const val = parseFloat(e.target.value) as any;
                                  setSensorySpeed(val);
                                  const updated = await firebaseBridge.auth.updateChildSettings(activeChild.id, { sensorySpeed: val });
                                  setActiveChild(updated);
                                  triggerStatus(locale === 'en' ? 'Speech speed updated!' : locale === 'es' ? '¡Velocidad de habla actualizada!' : 'Velocidade de fala atualizada!');
                                }}
                                className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-355 text-xs font-bold rounded-lg outline-none cursor-pointer"
                              >
                                <option value={0.7}>{locale === 'en' ? 'Slow (0.7x) 🐢' : locale === 'es' ? 'Lento (0.7x) 🐢' : 'Lento (0.7x) 🐢'}</option>
                                <option value={1.0}>{locale === 'en' ? 'Normal (1.0x) ☕' : locale === 'es' ? 'Normal (1.0x) ☕' : 'Normal (1.0x) ☕'}</option>
                                <option value={1.2}>{locale === 'en' ? 'Fast (1.2x) ⚡' : locale === 'es' ? 'Rápido (1.2x) ⚡' : 'Rápido (1.2x) ⚡'}</option>
                              </select>
                            </div>

                            {/* Timer Style */}
                            <div className="flex flex-col gap-1">
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">
                                {locale === 'en' ? 'Timer Style' : locale === 'es' ? 'Estilo del Timer' : 'Estilo do Temporizador'}
                              </span>
                              <select
                                value={timerStyle}
                                onChange={async (e) => {
                                  const val = e.target.value as any;
                                  setTimerStyle(val);
                                  const updated = await firebaseBridge.auth.updateChildSettings(activeChild.id, { timerStyle: val });
                                  setActiveChild(updated);
                                  triggerStatus(locale === 'en' ? 'Timer updated!' : locale === 'es' ? '¡Estilo del timer actualizado!' : 'Estilo do cronômetro atualizado!');
                                }}
                                className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-355 text-xs font-bold rounded-lg outline-none cursor-pointer"
                              >
                                <option value="circle">{locale === 'en' ? 'Red Circle ⏱️' : locale === 'es' ? 'Círculo Rojo ⏱️' : 'Círculo Vermelho ⏱️'}</option>
                                <option value="hourglass">{locale === 'en' ? 'Hourglass ⏳' : locale === 'es' ? 'Ampulheta ⏳' : 'Ampulheta ⏳'}</option>
                                <option value="droplets">{locale === 'en' ? 'Water Droplets 💧' : locale === 'es' ? 'Gotas de Agua 💧' : 'Gotas de Água 💧'}</option>
                              </select>
                            </div>
                          </>
                        ) : (
                          <span className="text-xs text-slate-400 font-bold leading-relaxed text-center py-4">
                            {locale === 'en' ? 'Select or register a child to configure sensory filters.' : locale === 'es' ? 'Seleccione o registre un niño para configurar los filtros sensoriales.' : 'Selecione ou cadastre uma criança para configurar filtros sensoriais.'}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Tab 3: Segurança */}
                    {activePrefTab === 'seguranca' && (
                      <div className="flex flex-col gap-3.5 animate-pop">
                        {activeChild ? (
                          <>
                            <div className="flex flex-col gap-1">
                              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">
                                {locale === 'en' ? 'Kid Lock Style' : locale === 'es' ? 'Tipo de Bloqueio' : 'Tipo de Bloqueio'}
                              </label>
                              <select
                                value={lockType}
                                onChange={async (e) => {
                                  const val = e.target.value as any;
                                  setLockType(val);
                                  const updated = await firebaseBridge.auth.updateChildSettings(activeChild.id, { lockType: val });
                                  setActiveChild(updated);
                                  triggerStatus(locale === 'en' ? 'Lock updated!' : locale === 'es' ? '¡Bloqueio actualizado!' : 'Bloqueio atualizado!');
                                }}
                                className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg outline-none focus:border-indigo-500 transition-all cursor-pointer"
                              >
                                <option value="math">{locale === 'en' ? 'Math Challenge 🧮' : locale === 'es' ? 'Desafío Matemático 🧮' : 'Matemática 🧮'}</option>
                                <option value="pin">{locale === 'en' ? 'Numerical PIN 🔑' : locale === 'es' ? 'PIN Numérico 🔑' : 'PIN numérico 🔑'}</option>
                                <option value="none">{locale === 'en' ? 'No lock 🔓' : locale === 'es' ? 'Sin bloqueo 🔓' : 'Sem bloqueio 🔓'}</option>
                              </select>
                            </div>

                            {lockType === 'pin' && (
                              <div className="flex flex-col gap-1">
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">
                                  {locale === 'en' ? 'Parent PIN' : locale === 'es' ? 'PIN de los Padres' : 'PIN dos Pais'}
                                </label>
                                <div className="flex gap-1.5">
                                  <input
                                    type="text"
                                    maxLength={4}
                                    value={parentPinCode}
                                    onChange={e => setParentPinCode(e.target.value.replace(/\D/g, ''))}
                                    className="flex-1 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-slate-750 dark:text-slate-300 text-xs font-bold rounded-lg outline-none focus:border-indigo-500"
                                    placeholder="1234"
                                  />
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      playMarimba(329.63, 0.3);
                                      const updated = await firebaseBridge.auth.updateChildSettings(activeChild.id, { parentPinCode });
                                      setActiveChild(updated);
                                      triggerStatus(locale === 'en' ? 'PIN Saved!' : locale === 'es' ? '¡PIN guardado!' : 'PIN de segurança salvo!');
                                    }}
                                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase rounded-lg cursor-pointer transition-all active:scale-95 border-none font-Outfit"
                                  >
                                    {locale === 'en' ? 'Save' : locale === 'es' ? 'Guardar' : 'Salvar'}
                                  </button>
                                </div>
                              </div>
                            )}
                            
                            <p className="text-[10px] text-slate-400 font-semibold leading-relaxed italic">
                              {locale === 'en' ? '*Note: Lock prevents child from leaving the routine dashboard.' : locale === 'es' ? '*Nota: El bloqueo evita que el niño salga del panel de rutinas.' : '*Note: O bloqueio impede que a criança saia da tela de rotinas sem autorização.'}
                            </p>
                          </>
                        ) : (
                          <span className="text-xs text-slate-400 font-bold leading-relaxed text-center py-4">
                            {locale === 'en' ? 'Register a child to manage safety.' : locale === 'es' ? 'Registre un niño para gestionar seguridad.' : 'Cadastre uma criança para gerenciar segurança.'}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Tab 4: Plano */}
                    {activePrefTab === 'plano' && (
                      <div className="flex flex-col gap-3.5 animate-pop">
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                            {locale === 'en' ? 'Subscription' : locale === 'es' ? 'Suscripción' : 'Tipo de Assinatura'}
                          </span>
                          <span className={`text-xs font-black flex items-center gap-1 font-Outfit mt-0.5 ${plan === 'premium' ? 'text-amber-600' : 'text-slate-655 dark:text-slate-350'}`}>
                            {plan === 'premium' ? '👑 Premium Pro' : '🌱 Plano Gratuito'}
                          </span>
                        </div>

                        <p className="text-[10px] font-semibold text-slate-450 dark:text-slate-400 leading-relaxed">
                          {plan === 'premium' 
                            ? (locale === 'en' ? 'Unrestricted access to clinical tools, consolidating PDF reports, and AI insights.' : locale === 'es' ? 'Acceso ilimitado a herramientas clínicas, informes consolidados en PDF e insights de IA.' : 'Acesso irrestrito a todas as ferramentas clínicas, relatórios consolidados em PDF e insights com inteligência artificial.')
                            : (locale === 'en' ? 'Daily limit of 3 tasks per routine. Advanced analytics and AI insights unavailable.' : locale === 'es' ? 'Límite de 3 tareas diarias por rutina. Informes y gráficos analíticos de IA no disponibles.' : 'Limite diário de 3 tarefas por rotina. Gráficos analíticos avançados e relatórios de IA indisponíveis.')}
                        </p>

                        <div className="pt-2">
                          {plan === 'premium' ? (
                            <button
                              type="button"
                              onClick={async () => {
                                playMarimba(261, 0.3);
                                await firebaseBridge.auth.updateProfileSettings({ plan: 'free' });
                                setPlan('free');
                                triggerStatus(t.dashboard.premiumCancelSuccess);
                              }}
                              className="w-full py-2 bg-slate-50 dark:bg-slate-800/40 hover:bg-red-50 text-red-500 hover:text-red-700 border border-slate-200 dark:border-slate-800 hover:border-red-200 text-xs font-black uppercase rounded-xl transition-all cursor-pointer text-center font-Outfit active:scale-95"
                            >
                              {locale === 'en' ? 'Cancel Subscription' : locale === 'es' ? 'Cancelar Suscripción' : 'Cancelar Assinatura'}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                playBubble();
                                setShowPreferencesMenu(false);
                                setShowPaywall(true);
                              }}
                              className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white text-xs font-black uppercase rounded-xl transition-all cursor-pointer text-center font-Outfit active:scale-95 border-b-2 border-amber-700/30"
                            >
                              {locale === 'en' ? 'Upgrade to Premium 👑' : locale === 'es' ? 'Mejorar a Premium 👑' : 'Assinar Premium 👑'}
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Separator & Logout button */}
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-2.5 mt-1">
                      <button 
                        type="button"
                        onClick={() => {
                          setShowPreferencesMenu(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center justify-center gap-1.5 py-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs font-black rounded-xl transition-all active:scale-95 font-Outfit cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" /> <span>{t.common.exit}</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>

        </div>

      </header>



      {/* Child Selector & Management Bar */}

      <section className="bg-white border-b-2 border-slate-250 py-4.5 shadow-sm select-none">

        <div className="max-w-6xl mx-auto px-4 md:px-6 flex flex-wrap items-center justify-between gap-4">

          <div className="flex items-center gap-3.5 flex-wrap">

            <span className="text-xs font-black text-slate-450 uppercase tracking-widest font-Outfit">{t.dashboard.children}</span>

            {children.map((child, index) => {

              const isActive = activeChild?.id === child.id;

              const colors = [

                'bg-indigo-500 text-indigo-50 border-indigo-600 shadow-indigo-100',

                'bg-emerald-500 text-emerald-50 border-emerald-600 shadow-emerald-100',

                'bg-amber-500 text-amber-50 border-amber-600 shadow-amber-100',

                'bg-rose-500 text-rose-50 border-rose-600 shadow-rose-100',

                'bg-sky-500 text-sky-50 border-sky-600 shadow-sky-100'

              ];

              const colorClass = colors[index % colors.length];

              const initials = child.name.substring(0, 2).toUpperCase();



              return (

                <div key={child.id} className="flex items-center gap-1.5 shrink-0 relative group">

                  <button

                    onClick={() => handleSelectChild(child)}

                    className={`flex items-center gap-2.5 pl-2 pr-4 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer font-Outfit border-2 select-none active:scale-95 ${

                      isActive

                        ? `${colorClass} ring-4 ring-indigo-500/30 ring-offset-2 scale-105 shadow-md`

                        : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-250 shadow-xxs'

                    }`}

                  >

                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] border ${

                      isActive ? 'bg-white/20 border-white/30 text-white' : 'bg-slate-150 border-slate-250 text-slate-500'

                    }`}>

                      {initials}

                    </div>

                    <div className="text-left flex flex-col justify-center">

                      <span className="leading-none text-xxs font-black">{child.name}</span>

                      {child.diagnosis && child.diagnosis !== 'Não Informado' && (

                        <span className={`text-[8px] font-black uppercase tracking-wider mt-0.5 ${isActive ? 'text-indigo-100' : 'text-slate-400'}`}>

                          {locale === 'en' ? (child.diagnosis === 'Não Informado' ? 'Not Informed' : child.diagnosis) : locale === 'es' ? (child.diagnosis === 'Não Informado' ? 'No Informado' : child.diagnosis) : child.diagnosis}

                        </span>

                      )}

                    </div>

                  </button>



                  {children.length > 1 && (

                    <button

                      onClick={() => handleDeleteChild(child.id, child.name)}

                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-100 text-red-600 hover:bg-red-500 hover:text-white rounded-full flex items-center justify-center transition-all border border-red-200 shadow-xxs opacity-0 group-hover:opacity-100 cursor-pointer text-[9px] font-black"

                      title={t.dashboard.deleteChild}

                    >

                      ✕

                    </button>

                  )}

                </div>

              );

            })}

            

            <button

              onClick={() => setNewChildModalOpen(true)}

              className="pl-2 pr-4 py-1.5 bg-slate-50 hover:bg-slate-100 hover:border-slate-350 border-2 border-dashed border-slate-300 text-xs font-black rounded-full flex items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-xxs font-Outfit"

            >

              <div className="w-7 h-7 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-extrabold text-xs text-slate-550">

                +

              </div>

              <span>{t.dashboard.registerChildBtn}</span>

            </button>

          </div>



          {activeChild ? (

                        <div className="flex flex-wrap items-center gap-3">

              {/* Emotional Battery Widget */}
              <div ref={batteryPopoverRef} className="relative z-40">
                <button
                  type="button"
                  onClick={() => { playBubble(); setShowBatteryPopover(!showBatteryPopover); }}
                  className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-xs font-black transition-all cursor-pointer active:scale-95 font-Outfit select-none ${
                    activeChild.emotionalBattery === 'green'
                      ? 'bg-emerald-50 hover:bg-emerald-100/60 border-emerald-250 text-emerald-700'
                      : activeChild.emotionalBattery === 'yellow'
                      ? 'bg-yellow-50 hover:bg-yellow-100/60 border-yellow-250 text-yellow-800'
                      : 'bg-red-50 hover:bg-red-100/60 border-red-200 text-red-700 animate-pulse'
                  }`}
                >
                  <span>{activeChild.emotionalBattery === 'green' ? '🔋 100%' : activeChild.emotionalBattery === 'yellow' ? '⚡ 50%' : '🪫 10%'}</span>
                  <span>{activeChild.emotionalBattery === 'green' ? t.dashboard.emotionalBatteryStatusGreen : activeChild.emotionalBattery === 'yellow' ? t.dashboard.emotionalBatteryStatusYellow : t.dashboard.emotionalBatteryStatusRed}</span>
                </button>

                <AnimatePresence>
                  {showBatteryPopover && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 350, damping: 25 }}
                      className="absolute top-12 right-0 md:left-0 md:right-auto w-72 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 flex flex-col gap-3 z-50 text-left"
                    >
                      <div className="flex items-center gap-2 text-indigo-650">
                        <span className="text-base">🔋</span>
                        <h3 className="font-bold text-slate-800 text-xs font-Outfit uppercase tracking-wider">{t.dashboard.emotionalBatteryTitle}</h3>
                      </div>
                      
                      <div className="flex items-center justify-center py-2 bg-slate-50 border border-slate-150 rounded-xl">
                        <span className="text-2xl">
                          {activeChild.emotionalBattery === 'green' ? '🔋' : activeChild.emotionalBattery === 'yellow' ? '⚡' : '🪫'}
                        </span>
                        <span className="text-lg font-black text-slate-800 ml-2 font-Outfit">
                          {activeChild.emotionalBattery === 'green' ? '100%' : activeChild.emotionalBattery === 'yellow' ? '50%' : '10%'}
                        </span>
                      </div>

                      <div className={`p-3 rounded-xl border text-xxs font-semibold leading-relaxed flex flex-col gap-1.5 ${
                        activeChild.emotionalBattery === 'red'
                          ? 'bg-red-50 border-red-200 text-red-800'
                          : activeChild.emotionalBattery === 'yellow'
                          ? 'bg-yellow-50 border-yellow-250 text-yellow-800'
                          : 'bg-emerald-50 border-emerald-250 text-emerald-800'
                      }`}>
                        <span className="font-black font-Outfit uppercase text-[9px] tracking-widest flex items-center gap-1">
                          ⚠️ {activeChild.emotionalBattery === 'red' 
                                ? t.dashboard.emotionalBatteryAlertTitleRed 
                                : activeChild.emotionalBattery === 'yellow' 
                                ? t.dashboard.emotionalBatteryAlertTitleYellow 
                                : (locale === 'en' ? 'Optimal Charge' : locale === 'es' ? 'Carga Óptima' : 'Carga Ideal')}
                        </span>
                        <p>
                          {activeChild.emotionalBattery === 'red' 
                            ? t.dashboard.emotionalBatteryAlertDescRed.replace('{name}', activeChild.name.split(' ')[0])
                            : activeChild.emotionalBattery === 'yellow' 
                            ? t.dashboard.emotionalBatteryAlertDescYellow.replace('{name}', activeChild.name.split(' ')[0])
                            : (locale === 'en' 
                                ? `${activeChild.name.split(' ')[0]} is emotionally regulated and ready for activities.` 
                                : locale === 'es'
                                ? `${activeChild.name.split(' ')[0]} está regulado emocionalmente y listo para las actividades.`
                                : `${activeChild.name.split(' ')[0]} está regulado emocionalmente e pronto para as atividades.`)}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Daily Tracking / Acompanhamento Diário Widget */}
              <div ref={dailyTrackingPopoverRef} className="relative z-40">
                <button
                  type="button"
                  onClick={() => { playBubble(); setShowDailyTrackingPopover(!showDailyTrackingPopover); }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 border-2 border-slate-200 text-slate-700 text-xs font-black rounded-xl transition-all cursor-pointer active:scale-95 font-Outfit select-none"
                >
                  <span>📅</span>
                  <span>{locale === 'en' ? 'Daily Status' : locale === 'es' ? 'Acompañamiento' : 'Acompanhamento'}</span>
                </button>

                <AnimatePresence>
                  {showDailyTrackingPopover && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 350, damping: 25 }}
                      className="absolute top-12 right-0 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 flex flex-col gap-3.5 z-50 text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-indigo-655">
                          <span className="text-base">📅</span>
                          <h3 className="font-bold text-slate-800 text-xs font-Outfit uppercase tracking-wider">{t.dashboard.dailyTrackingTitle}</h3>
                        </div>
                        <span className="text-[9px] font-black text-slate-400 uppercase">{t.dashboard.dailyTrackingSubtitle}</span>
                      </div>

                      <div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto pr-1 animate-none">
                        {(() => {
                          const days = [];
                          for (let i = 0; i < 7; i++) {
                            const d = new Date();
                            d.setDate(d.getDate() - i);
                            days.push(d);
                          }

                          return days.map((dateObj, idx) => {
                            const isoDate = dateObj.toISOString().split('T')[0];
                            const dayName = idx === 0 ? 'Hoje' : idx === 1 ? 'Ontem' : dateObj.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'numeric' });
                            
                            // Find school log for this date
                            const schoolLog = sensoryLogs.find(log => 
                              log.loggedBy === 'school' && 
                              new Date(log.timestamp).toISOString().split('T')[0] === isoDate
                            );

                            // Find clinical checkpoint for this date
                            const clinicalCp = checkpoints.find(cp => 
                              cp.date === isoDate && cp.status === 'completed'
                            );

                            return (
                              <div key={isoDate} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-150 rounded-xl hover:bg-slate-100/50 transition-all text-xxs font-semibold">
                                <span className="font-bold text-slate-700 capitalize w-20">{dayName}</span>
                                
                                <div className="flex items-center gap-3">
                                  {/* School badge */}
                                  <div className="flex items-center gap-1" title={schoolLog ? t.dashboard.schoolBadgeLog : t.dashboard.schoolBadgeNoLog}>
                                    <span className="text-[10px]" title="Escola">🏫</span>
                                    {schoolLog ? (
                                      <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[9px] font-black border border-emerald-250">
                                        {schoolLog.mood === 'feliz' ? '😊' : schoolLog.mood === 'calmo' ? '😐' : schoolLog.mood === 'triste' ? '😢' : '😫'}
                                      </span>
                                    ) : (
                                      <span className="bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full text-[9px] font-black border border-slate-300">
                                        Pendente
                                      </span>
                                    )}
                                  </div>

                                  {/* Clinical badge */}
                                  <div className="flex items-center gap-1" title={clinicalCp ? t.dashboard.clinicalBadgeLog : t.dashboard.clinicalBadgeNoLog}>
                                    <span className="text-[10px]" title={locale === 'en' ? 'Clinical' : locale === 'es' ? 'Clínico' : 'Clínico'}>🧠</span>
                                    {clinicalCp ? (
                                      <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[9px] font-black border border-emerald-250" title={`${clinicalCp.professionalRole}: ${clinicalCp.feedback}`}>
                                        OK ✓
                                      </span>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          playBubble();
                                          setActivePanelTab('feedback');
                                          setActiveFeedbackSubTab('checkpoints');
                                          setNewCpDate(isoDate);
                                          setNewCpOpen(true);
                                          setShowDailyTrackingPopover(false);
                                        }}
                                        className="bg-slate-200 hover:bg-indigo-50 hover:text-indigo-650 hover:border-indigo-250 text-slate-500 px-2 py-0.5 rounded-full text-[9px] font-black border border-slate-300 transition-all cursor-pointer outline-none"
                                      >
                                        + Add
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <a
                href={`/routine?childId=${activeChild.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 bg-indigo-600 text-white hover:bg-indigo-755 text-xs font-black rounded-xl shadow-md border-b-4 border-indigo-900 transition-all active:scale-95 flex items-center gap-2 font-Outfit uppercase tracking-wider"
              >
                <span>🚀</span> {t.dashboard.goToChildRoutine} {activeChild.name.split(' ')[0]}
              </a>
            </div>

          ) : (

            <span className="text-xs font-bold text-slate-500">{t.dashboard.noChildren}</span>

          )}

        </div>

      </section>



      {/* Floating Status Notification */}

      <AnimatePresence>

        {statusMessage && (

          <motion.div 

            initial={{ opacity: 0, y: -50, scale: 0.9 }}

            animate={{ opacity: 1, y: 0, scale: 1 }}

            exit={{ opacity: 0, y: -20, scale: 0.9 }}

            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white font-semibold text-sm px-6 py-3 rounded-full shadow-xl border border-slate-700 flex items-center gap-2"

          >

            <CheckCircle className="w-4 h-4 text-emerald-400" />

            {statusMessage}

          </motion.div>

        )}

      </AnimatePresence>



      {/* Real-time Task Completion Notification Feed for Parents */}

      <AnimatePresence>

        {notifications.length > 0 && (

          <div className="max-w-6xl mx-auto px-4 md:px-6 mt-4">

            <motion.div

              initial={{ opacity: 0, y: -10 }}

              animate={{ opacity: 1, y: 0 }}

              exit={{ opacity: 0, y: -10 }}

              className="bg-indigo-600 text-white rounded-2xl p-4.5 shadow-md flex items-center justify-between gap-4 border border-indigo-500"

            >

              <div className="flex items-center gap-3">

                <span className="text-2xl animate-bounce">🔔</span>

                <div>

                  <h4 className="text-xs font-black uppercase tracking-widest text-indigo-200">Alerta de Atividade Realizada</h4>

                  <p className="text-sm font-bold mt-0.5">{notifications[0].message}</p>

                </div>

              </div>

              <button

                onClick={() => {

                  playBubble();

                  setNotifications([]);

                }}

                className="px-3.5 py-1.5 bg-indigo-700/50 hover:bg-indigo-750 text-white font-extrabold text-[10px] uppercase rounded-lg transition-all cursor-pointer border border-indigo-500/40"

              >

                Limpar Feed

              </button>

            </motion.div>

          </div>

        )}

      </AnimatePresence>



      {/* Educational Clinical Onboarding & Help Widget */}

      <AnimatePresence>

        {activeChild && showOnboardingHelp && (

          <div className="max-w-6xl mx-auto px-4 md:px-6 mt-6">

            <motion.div

              initial={{ opacity: 0, height: 0 }}

              animate={{ opacity: 1, height: 'auto' }}

              exit={{ opacity: 0, height: 0 }}

              className="bg-white border-2 border-indigo-250 p-6 rounded-[28px] shadow-premium relative overflow-hidden"

            >

              {/* Background gradient hint */}

              <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

              

              <div className="flex items-start justify-between gap-4">

                <div className="flex items-center gap-3">

                  <span className="text-3xl animate-pulse">🎓</span>

                  <div>

                    <h2 className="text-lg font-black text-slate-900 font-Outfit">{t.dashboard.guidanceTitle}</h2>

                    <p className="text-xs text-slate-500 font-semibold mt-0.5">

                      {t.dashboard.guidanceDesc}

                    </p>

                  </div>

                </div>

                <button

                  onClick={() => {

                    playBubble();

                    setShowOnboardingHelp(false);

                    localStorage.setItem('showOnboardingHelp', 'false');

                  }}

                  className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100/60 px-3 py-1.5 rounded-xl transition-all cursor-pointer border-none font-Outfit uppercase tracking-wider"

                  title={locale === 'en' ? 'Hide onboarding guide permanently' : locale === 'es' ? 'Ocultar guía de inducción permanentemente' : 'Ocultar guia de onboarding permanentemente'}

                >

                  {locale === 'en' ? 'Got it, Hide ×' : locale === 'es' ? 'Entendido, Ocultar ×' : 'Entendi, Ocultar ×'}

                </button>

              </div>



              {/* Grid with 3 columns describing clinical benefits */}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-5 border-t border-slate-100">

                <div className="flex flex-col gap-2 p-4 rounded-2xl bg-indigo-50/40 border border-indigo-100">

                  <span className="text-xl">📅</span>

                  <h3 className="text-xs font-black text-slate-900 font-Outfit uppercase tracking-wider">{t.dashboard.guidanceSection1Title}</h3>

                  <p className="text-[10px] text-slate-600 font-semibold leading-relaxed">

                    {t.dashboard.guidanceSection1}

                  </p>

                </div>



                <div className="flex flex-col gap-2 p-4 rounded-2xl bg-emerald-50/40 border border-emerald-100">

                  <span className="text-xl">🧠</span>

                  <h3 className="text-xs font-black text-slate-900 font-Outfit uppercase tracking-wider">{t.dashboard.guidanceSection2Title}</h3>

                  <p className="text-[10px] text-slate-600 font-semibold leading-relaxed">

                    {t.dashboard.guidanceSection2}

                  </p>

                </div>



                <div className="flex flex-col gap-2 p-4 rounded-2xl bg-amber-50/40 border border-amber-100">

                  <span className="text-xl">🤝</span>

                  <h3 className="text-xs font-black text-slate-900 font-Outfit uppercase tracking-wider">{t.dashboard.guidanceSection3Title}</h3>

                  <p className="text-[10px] text-slate-600 font-semibold leading-relaxed">

                    {t.dashboard.guidanceSection3}

                  </p>

                </div>

              </div>

            </motion.div>

          </div>

        )}

      </AnimatePresence>



            <div className="max-w-6xl mx-auto px-4 md:px-6 mt-8 flex flex-col gap-6">

        {/* Main Panel Content: Routine Composer / Logs */}
        <div className="w-full flex flex-col gap-6">

          

          {/* Sticky Tab Bar Container for Desktop/Tablet landscape navigation */}

          <div className="sticky top-[130px] md:top-[80px] z-20 bg-[#f8fafc]/95 backdrop-blur-md py-3 -mx-2 px-2">
            <div className="bg-slate-100 border border-slate-200 p-1 rounded-xl flex gap-1 overflow-x-auto scrollbar-none">
              <button
                onClick={() => { playBubble(); setActivePanelTab('hoje'); }}
                className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 shrink-0 font-Outfit cursor-pointer select-none active:scale-95 ${
                  activePanelTab === 'hoje'
                    ? 'grad-primary text-white shadow-sm border border-transparent scale-100'
                    : 'text-slate-655 hover:text-slate-900 hover:bg-white/40 border border-transparent'
                }`}
              >
                <span className="text-sm">🏠</span> {locale === 'es' ? 'Hoy' : locale === 'en' ? 'Today' : 'Hoje'}
              </button>

              <button
                onClick={() => { playBubble(); setActivePanelTab('tasks'); }}
                className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 shrink-0 font-Outfit cursor-pointer select-none active:scale-95 ${
                  activePanelTab === 'tasks'
                    ? 'grad-primary text-white shadow-sm border border-transparent scale-100'
                    : 'text-slate-655 hover:text-slate-900 hover:bg-white/40 border border-transparent'
                }`}
              >
                <ListTodo className="w-4.5 h-4.5" /> {locale === 'es' ? 'Rutina' : locale === 'en' ? 'Routine' : 'Rotina'}
              </button>

              <button
                onClick={() => { playBubble(); setActivePanelTab('feedback'); }}
                className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 shrink-0 font-Outfit cursor-pointer select-none active:scale-95 ${
                  activePanelTab === 'feedback' 
                    ? 'grad-primary text-white shadow-sm border border-transparent scale-100' 
                    : 'text-slate-655 hover:text-slate-900 hover:bg-white/40 border border-transparent'
                }`}
              >
                <span className="text-sm">📈</span> {locale === 'es' ? 'Seguimiento' : locale === 'en' ? 'Progress' : 'Acompanhamento'}
              </button>

              <button
                onClick={() => { playBubble(); setActivePanelTab('tools'); }}
                className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 shrink-0 font-Outfit cursor-pointer select-none active:scale-95 ${
                  activePanelTab === 'tools' 
                    ? 'grad-primary text-white shadow-sm border border-transparent scale-100' 
                    : 'text-slate-655 hover:text-slate-900 hover:bg-white/40 border border-transparent'
                }`}
              >
                <Settings className="w-4.5 h-4.5" /> {locale === 'es' ? 'Ajustes' : locale === 'en' ? 'Settings' : 'Config'}
              </button>
            </div>
          </div>

          {/* Sub-tab menus for Feedback and Tools */}
          {activePanelTab === 'feedback' && (
            <div className="mb-5">
              <AccessCodesManager childId={activeChild?.id} locale={(locale === 'en' || locale === 'es') ? locale : 'pt'} />
            </div>
          )}

          {activePanelTab === 'feedback' && (
            <div className="bg-slate-100 border border-slate-200 p-1 rounded-xl flex gap-1 mb-4 w-fit">
              <button
                onClick={() => { playBubble(); setActiveFeedbackSubTab('checkpoints'); }}
                className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
                  activeFeedbackSubTab === 'checkpoints'
                    ? 'bg-white text-indigo-950 shadow-sm border border-slate-200/50'
                    : 'text-slate-655 hover:text-slate-900 hover:bg-white/40'
                }`}
              >
                🤝 {locale === 'es' ? 'Puntos de Control' : locale === 'en' ? 'Clinical Checkpoints' : 'Checkpoints da Rede'}
              </button>
              <button
                onClick={() => { playBubble(); setActiveFeedbackSubTab('reports'); }}
                className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
                  activeFeedbackSubTab === 'reports'
                    ? 'bg-white text-indigo-950 shadow-sm border border-slate-200/50'
                    : 'text-slate-655 hover:text-slate-900 hover:bg-white/40'
                }`}
              >
                📊 {locale === 'es' ? 'Informe Clínico' : locale === 'en' ? 'Clinical Report' : 'Relatório de Evolução'}
              </button>
            </div>
          )}

          {activePanelTab === 'tools' && (
            <div className="bg-slate-100 border border-slate-200 p-1 rounded-xl flex gap-1 mb-4 w-fit">
              <button
                onClick={() => { playBubble(); setActiveToolsSubTab('config'); }}
                className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeToolsSubTab === 'config'
                    ? 'bg-white text-indigo-950 shadow-sm border border-slate-200/50'
                    : 'text-slate-655 hover:text-slate-900 hover:bg-white/40'
                }`}
              >
                <Settings className="w-3.5 h-3.5" /> {locale === 'es' ? 'Herramientas' : locale === 'en' ? 'Tools' : 'Ferramentas do Painel'}
              </button>
              <button
                onClick={() => { playBubble(); setActiveToolsSubTab('logs'); }}
                className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeToolsSubTab === 'logs'
                    ? 'bg-white text-indigo-950 shadow-sm border border-slate-200/50'
                    : 'text-slate-655 hover:text-slate-900 hover:bg-white/40'
                }`}
              >
                <History className="w-3.5 h-3.5" /> {locale === 'es' ? 'Registros de Segurança' : locale === 'en' ? 'Security Logs' : 'Logs de Atividades'}
                <span className="text-[9px] bg-indigo-50 border border-indigo-150 text-indigo-755 px-1.5 py-0.5 rounded-full font-extrabold shadow-xxs ml-0.5">
                  {logs.length}
                </span>
              </button>
            </div>
          )}

          <AnimatePresence mode="wait">
            {activePanelTab === 'hoje' ? (
              <motion.div
                key="hoje-panel"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-6"
              >
                {(() => {
                  const todayNum = new Date().getDate().toString();
                  const dayTasks = tasks.filter(t => t.day === todayNum).sort((a, b) => a.time.localeCompare(b.time));
                  const done = dayTasks.filter(t => t.isCompleted).length;
                  const total = dayTasks.length;
                  const nowTask = dayTasks.find(t => !t.isCompleted);
                  const mood = activeChild?.emotionalBattery === 'green' ? (locale === 'en' ? 'Great' : locale === 'es' ? 'Bien' : 'Ótimo')
                    : activeChild?.emotionalBattery === 'yellow' ? (locale === 'en' ? 'Tired' : locale === 'es' ? 'Cansado' : 'Cansado')
                    : activeChild?.emotionalBattery === 'red' ? (locale === 'en' ? 'Overloaded' : locale === 'es' ? 'Sobrecargado' : 'Sobrecarregado')
                    : '—';
                  return (
                    <>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h2 className="text-2xl font-black font-Outfit text-slate-900 tracking-tight">{locale === 'en' ? 'Today' : locale === 'es' ? 'Hoy' : 'Hoje'}{activeChild ? ` · ${activeChild.name.split(' ')[0]}` : ''}</h2>
                          <p className="text-sm text-slate-500 font-medium mt-0.5">{locale === 'en' ? "The day's routine at a glance." : locale === 'es' ? 'La rutina del día de un vistazo.' : 'A rotina do dia num relance.'}</p>
                        </div>
                        <button
                          onClick={() => { playBubble(); router.push('/routine'); }}
                          className="shrink-0 inline-flex items-center justify-center gap-2 px-5 py-3 grad-primary text-white text-sm font-black rounded-xl cursor-pointer active:scale-95 transition-all font-Outfit"
                        >
                          ▶ {locale === 'en' ? 'Open Child Mode' : locale === 'es' ? 'Abrir Modo Niño' : 'Abrir Modo Criança'}
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">{locale === 'en' ? 'Done' : locale === 'es' ? 'Hechas' : 'Feitas'}</div>
                          <div className="text-2xl font-black text-indigo-700 font-Outfit mt-0.5 tabular-nums">{done}<span className="text-sm text-slate-400"> / {total}</span></div>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">{locale === 'en' ? 'Mood' : locale === 'es' ? 'Ánimo' : 'Humor'}</div>
                          <div className="text-lg font-black text-indigo-700 font-Outfit mt-1">{mood}</div>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">{locale === 'en' ? 'Stars' : locale === 'es' ? 'Estrellas' : 'Estrelas'}</div>
                          <div className="text-2xl font-black text-indigo-700 font-Outfit mt-0.5 tabular-nums">{activeChild?.tokens || 0}</div>
                        </div>
                      </div>

                      {nowTask && (
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 min-w-[44px]">{locale === 'en' ? 'Now' : locale === 'es' ? 'Ahora' : 'Agora'}</span>
                          <span className="text-2xl select-none">{nowTask.icon || '📌'}</span>
                          <div className="flex-1 min-w-0">
                            <div className="font-black text-slate-800 truncate font-Outfit">{nowTask.title}</div>
                            <div className="text-xs text-slate-500 tabular-nums">{nowTask.time}</div>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-sm font-black text-slate-700 font-Outfit">{locale === 'en' ? "Today's routine" : locale === 'es' ? 'Rutina de hoy' : 'Rotina de hoje'}</h3>
                          <button onClick={() => { playBubble(); setActivePanelTab('tasks'); }} className="text-xs font-black text-indigo-700 hover:text-indigo-900 cursor-pointer bg-transparent border-none">{locale === 'en' ? 'Edit' : locale === 'es' ? 'Editar' : 'Editar'}</button>
                        </div>
                        {total === 0 ? (
                          <p className="text-sm text-slate-400 py-8 text-center">{locale === 'en' ? 'No activities today.' : locale === 'es' ? 'Sin actividades hoy.' : 'Sem atividades para hoje.'}</p>
                        ) : dayTasks.map(task => (
                          <div key={task.id} className="flex items-center gap-3 py-3 border-t border-slate-100">
                            <span className="text-xs text-slate-400 tabular-nums w-11 shrink-0">{task.time}</span>
                            <span className="text-lg select-none shrink-0">{task.icon || '📌'}</span>
                            <span className="flex-1 text-sm font-semibold text-slate-700 truncate">{task.title}</span>
                            {task.isCompleted
                              ? <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded shrink-0">{locale === 'en' ? 'done' : locale === 'es' ? 'hecho' : 'feito'}</span>
                              : <span className="text-slate-300 shrink-0">•</span>}
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </motion.div>
            ) : activePanelTab === 'tasks' ? (

              

              // ROUTINE COMPOSER PANEL

              <motion.div

                key="tasks-panel"

                initial={{ opacity: 0, y: 10 }}

                animate={{ opacity: 1, y: 0 }}

                exit={{ opacity: 0, y: -10 }}

                transition={{ duration: 0.3 }}

                className="flex flex-col gap-6"

              >

                {/* Month/Year Navigation Selector Header */}

                <div className="flex items-center justify-between bg-white border border-slate-200 p-4 rounded-[22px] shadow-sm select-none gap-4">

                  <div className="flex flex-col text-left">

                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-650 font-Outfit">

                      {locale === 'en' ? 'Active Period' : locale === 'es' ? 'Periodo Activo' : 'Período Ativo'}

                    </span>

                    <span className="text-sm font-black text-slate-800 font-Outfit">

                      {(() => {

                        const MONTH_NAMES: Record<string, string[]> = {

                          pt: [

                            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',

                            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'

                          ],

                          en: [

                            'January', 'February', 'March', 'April', 'May', 'June',

                            'July', 'August', 'September', 'October', 'November', 'December'

                          ],

                          es: [

                            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',

                            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'

                          ]

                        };

                        const monthName = MONTH_NAMES[locale]?.[activeMonth - 1] || MONTH_NAMES['pt'][activeMonth - 1];

                        return `${monthName} ${activeYear}`;

                      })()}

                    </span>

                  </div>

                  

                  <div className="flex gap-2">

                    <button

                      type="button"

                      onClick={() => {

                        playBubble();

                        let prevM = activeMonth - 1;

                        let prevY = activeYear;

                        if (prevM < 1) {

                          prevM = 12;

                          prevY -= 1;

                        }

                        setActiveMonth(prevM);

                        setActiveYear(prevY);

                        

                        const maxDays = new Date(prevY, prevM, 0).getDate();

                        if (parseInt(activeDayFilter, 10) > maxDays) {

                          setActiveDayFilter('1');

                        }

                      }}

                      className="w-9 h-9 flex items-center justify-center bg-white border border-slate-200 text-slate-600 hover:text-indigo-950 hover:bg-slate-50 hover:border-slate-350 rounded-xl transition-all cursor-pointer select-none active:scale-95 shadow-xxs"

                      title={locale === 'en' ? 'Previous Month' : locale === 'es' ? 'Mes Anterior' : 'Mês Anterior'}

                    >

                      <ChevronLeft className="w-4 h-4" />

                    </button>

                    

                    <button

                      type="button"

                      onClick={() => {

                        playBubble();

                        let nextM = activeMonth + 1;

                        let nextY = activeYear;

                        if (nextM > 12) {

                          nextM = 1;

                          nextY += 1;

                        }

                        setActiveMonth(nextM);

                        setActiveYear(nextY);

                        

                        const maxDays = new Date(nextY, nextM, 0).getDate();

                        if (parseInt(activeDayFilter, 10) > maxDays) {

                          setActiveDayFilter('1');

                        }

                      }}

                      className="w-9 h-9 flex items-center justify-center bg-white border border-slate-200 text-slate-600 hover:text-indigo-950 hover:bg-slate-50 hover:border-slate-350 rounded-xl transition-all cursor-pointer select-none active:scale-95 shadow-xxs"

                      title={locale === 'en' ? 'Next Month' : locale === 'es' ? 'Siguiente Mes' : 'Próximo Mês'}

                    >

                      <ChevronRight className="w-4 h-4" />

                    </button>

                  </div>

                </div>

                

                {/* Wrapped Days Calendar Grid Selector */}

                <div className="flex flex-wrap gap-2 pb-3 max-h-36 overflow-y-auto pr-1 scrollbar-thin border-b border-slate-100 select-none">

                  {DAYS_OF_MONTH.map(day => (

                    <button

                      key={day.key}

                      onClick={() => { playBubble(); setActiveDayFilter(day.key); }}

                      className={`w-9 h-9 flex items-center justify-center text-xs font-black rounded-xl border transition-all shrink-0 active:scale-95 cursor-pointer ${

                        activeDayFilter === day.key

                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100'

                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-800 hover:bg-slate-50'

                      }`}

                      title={day.label}

                    >

                      {day.short}

                    </button>

                  ))}

                </div>



                



                {/* Day Agenda Grid Card */}

                <div className="bg-white border border-slate-200 rounded-[32px] p-6 shadow-md shadow-slate-100 flex flex-col gap-6">

                  

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">

                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">

                      <div>

                        <h3 className="font-black text-slate-850 text-xl leading-tight font-Outfit">

                          {scheduleViewMode === 'daily' && `Agenda para ${DAYS_OF_MONTH.find(d => d.key === activeDayFilter)?.label}`}

                          {scheduleViewMode === 'weekly' && `Agenda Semanal (Dias ${weekStart} a ${weekEnd}) 📅`}

                          {scheduleViewMode === 'monthly' && `Agenda Mensal Completa 🗓️`}

                        </h3>

                        <p className="text-xs text-slate-400 font-semibold mt-0.5">

                          {scheduleViewMode === 'daily' && `${tasks.filter(t => t.day === activeDayFilter).length} tarefas cadastradas`}

                          {scheduleViewMode === 'weekly' && `${tasks.filter(t => parseInt(t.day) >= weekStart && parseInt(t.day) <= weekEnd).length} tarefas cadastradas na semana`}

                          {scheduleViewMode === 'monthly' && `${tasks.length} tarefas cadastradas no total`}

                        </p>

                      </div>



                      {/* View selector tabs */}

                      <div className="flex gap-1.5 bg-slate-100 p-1 rounded-full border border-slate-200 w-fit shrink-0">

                        {(['daily', 'weekly', 'monthly'] as const).map(mode => (

                          <button

                            key={mode}

                            type="button"

                            onClick={() => { playBubble(); setScheduleViewMode(mode); }}

                            className={`px-4.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${

                              scheduleViewMode === mode

                                ? 'bg-indigo-650 text-white shadow-xxs'

                                : 'text-slate-500 hover:text-slate-800 hover:bg-white/45'

                            }`}

                          >

                            {mode === 'daily' ? (locale === 'en' ? 'Daily' : locale === 'es' ? 'Diario' : 'Diária') : mode === 'weekly' ? (locale === 'en' ? 'Weekly' : locale === 'es' ? 'Semanal' : 'Semanal') : (locale === 'en' ? 'Monthly' : locale === 'es' ? 'Mensual' : 'Mensal')}

                          </button>

                        ))}

                      </div>

                    </div>



                    {scheduleViewMode === 'daily' && (

                      <div className="flex flex-wrap gap-2">

                        <button

                          type="button"

                          onClick={handleCopyDay}

                          className="flex items-center gap-1 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-full border border-slate-300 transition-all cursor-pointer font-Outfit"

                          title="Copiar todas as tarefas deste dia"

                        >

                          📋 Copiar

                        </button>



                        {copiedFromDay && copiedTasksBuffer.length > 0 && (

                          <button

                            type="button"

                            onClick={handlePasteDay}

                            className="flex items-center gap-1 px-3.5 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 text-xs font-black rounded-full border border-yellow-350 transition-all cursor-pointer font-Outfit"

                            title={`Colar tarefas copiadas do Dia ${copiedFromDay}`}

                          >

                            📥 Colar

                          </button>

                        )}



                        <button

                          onClick={() => { playBubble(); window.print(); }}

                          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 border border-emerald-250 hover:bg-emerald-100 text-emerald-700 text-xs font-black rounded-full shadow-sm transition-all cursor-pointer font-Outfit"

                        >

                          🖨️ Imprimir PECS

                        </button>



                        <button

                          onClick={() => { playBubble(); setFormOpen(!formOpen); }}

                          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-600 text-xs font-black rounded-full shadow-sm transition-all cursor-pointer"

                        >

                          <Plus className="w-4 h-4" /> {formOpen ? 'Fechar Form' : 'Adicionar Tarefa'}

                        </button>

                      </div>

                    )}

                  </div>



                  {scheduleViewMode === 'daily' && (

                    <>

                  {(() => {

                    const activeDayTasks = tasks.filter(t => t.day === activeDayFilter);

                    const completedActiveDayTasks = activeDayTasks.filter(t => t.isCompleted);

                    const completionRate = activeDayTasks.length > 0 

                      ? Math.round((completedActiveDayTasks.length / activeDayTasks.length) * 100) 

                      : 0;



                    return activeDayTasks.length > 0 ? (

                      <div className="bg-gradient-to-r from-indigo-50 to-indigo-100/50 border border-indigo-100/80 p-4.5 rounded-2xl flex flex-col gap-2">

                        <div className="flex justify-between items-center text-xs font-bold text-indigo-850">

                          <span>📈 {locale === 'en' ? "Child's Progress today" : locale === 'es' ? 'Progreso del Niño hoy' : 'Progresso da Criança hoje'}</span>

                          <span className="bg-indigo-600 text-white font-black px-2 py-0.5 rounded-md text-[10px] uppercase shadow-xxs">

                            {completedActiveDayTasks.length} de {activeDayTasks.length} feitas ({completionRate}%)

                          </span>

                        </div>

                        <div className="w-full bg-slate-200/60 rounded-full h-2.5 overflow-hidden border border-slate-350/30">

                          <motion.div 

                            className="bg-indigo-600 h-full rounded-full"

                            initial={{ width: 0 }}

                            animate={{ width: `${completionRate}%` }}

                            transition={{ duration: 0.5, ease: "easeOut" }}

                          />

                        </div>

                      </div>

                    ) : null;

                  })()}



                  {/* Presets Dropdown select for 1-click add */}

                  <div className="flex flex-col gap-2 border-b border-slate-100 pb-5">

                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1 select-none">

                      {t.dashboard.quickActivityTemplates}

                    </span>

                    <select

                      onChange={(e) => {

                        const idx = e.target.value;

                        if (idx !== "") {

                          handleAddPreset(PRESETS[parseInt(idx)]);

                          e.target.value = ""; // Reset selection

                        }

                      }}

                      defaultValue=""

                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl outline-none focus:border-indigo-500 transition-all cursor-pointer shadow-xxs"

                    >

                      <option value="" disabled>{t.dashboard.chooseQuickTemplate}</option>

                      {PRESETS.map((preset, idx) => (

                        <option key={idx} value={idx}>

                          {preset.icon || '➕'} {preset.title} ({preset.time} - {preset.period === 'manhã' ? 'Manhã' : preset.period === 'tarde' ? 'Tarde' : 'Noite'})

                        </option>

                      ))}

                    </select>

                  </div>



                  <div id="add-task-form-anchor" />

                  {/* Add Task Collapsible Form */}

                  <AnimatePresence>

                    {formOpen && (

                      <motion.form

                        initial={{ opacity: 0, height: 0 }}

                        animate={{ opacity: 1, height: 'auto' }}

                        exit={{ opacity: 0, height: 0 }}

                        onSubmit={handleAddTask}

                        className="bg-slate-50 border border-slate-200 p-5 rounded-2xl overflow-hidden flex flex-col gap-4"

                      >

                        <div className="flex items-center justify-between border-b border-slate-200/60 pb-3 mb-1">

                          <h4 className="font-bold text-xs text-slate-605 uppercase tracking-wider font-Outfit">Nova Tarefa</h4>

                          

                          {/* Step Indicators */}

                          <div className="flex items-center gap-1.5">

                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider font-Outfit transition-all ${

                              formStep === 1 ? 'bg-indigo-600 text-white shadow-xxs' : 'bg-slate-200 text-slate-500'

                            }`}>

                              {t.dashboard.stepIdentification}

                            </span>

                            <span className="text-slate-355 text-[10px] select-none">➔</span>

                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider font-Outfit transition-all ${

                              formStep === 2 ? 'bg-indigo-600 text-white shadow-xxs' : 'bg-slate-200 text-slate-500'

                            }`}>

                              {t.dashboard.stepDidactics}

                            </span>

                          </div>

                        </div>



                        {/* STEP 1: Basic Identification */}

                        {formStep === 1 && (

                          <div className="flex flex-col gap-4">

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                              <div>

                                <label className="block text-xxs font-bold text-slate-500 uppercase mb-1">{t.dashboard.activityTitle}</label>

                                <input

                                  type="text"

                                  required

                                  value={title}

                                  onChange={e => setTitle(e.target.value)}

                                  placeholder="Ex: Escovar os dentes 🪥"

                                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-755 placeholder-slate-400 outline-none text-sm font-semibold"

                                />

                              </div>



                              <div className="grid grid-cols-2 gap-3">

                                <div>

                                  <label className="block text-xxs font-bold text-slate-500 uppercase mb-1">{t.dashboard.timeForecast}</label>

                                  <div className="relative">

                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

                                    <input

                                      type="time"

                                      required

                                      value={time}

                                      onChange={e => setTime(e.target.value)}

                                      className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-705 outline-none text-sm font-bold"

                                    />

                                  </div>

                                </div>

                                

                                <div>

                                  <label className="block text-xxs font-bold text-slate-500 uppercase mb-1">{t.dashboard.period}</label>

                                  <select

                                    value={period}

                                    onChange={e => setPeriod(e.target.value as any)}

                                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-705 outline-none text-sm font-bold cursor-pointer"

                                  >

                                    <option value="manhã">Manhã ☀️</option>

                                    <option value="tarde">Tarde ⛅</option>

                                    <option value="noite">Noite 🌙</option>

                                  </select>

                                </div>

                              </div>

                            </div>



                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-200/60 pt-3">

                              <div>

                                <label className="block text-xxs font-bold text-slate-500 uppercase mb-1">{locale === 'en' ? 'Activity Domain (Category)' : locale === 'es' ? 'Dominio de la Actividad (Categoría)' : 'Domínio da Atividade (Categoria)'}</label>

                                <select

                                  value={taskCategory}

                                  onChange={e => setTaskCategory(e.target.value as any)}

                                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-705 outline-none text-sm font-bold cursor-pointer"

                                >

                                  <option value="AVD">{locale === 'en' ? 'ADL (Daily Life) 🧼' : locale === 'es' ? 'AVD (Vida Diaria) 🧼' : 'AVD (Vida Diária) 🧼'}</option>

                                  <option value="Aprendizado">{locale === 'en' ? 'Learning 📚' : locale === 'es' ? 'Aprendizaje 📚' : 'Aprendizado 📚'}</option>

                                  <option value="Lazer">{locale === 'en' ? 'Leisure 🧸' : locale === 'es' ? 'Ocio 🧸' : 'Lazer 🧸'}</option>

                                </select>

                              </div>



                              <div>

                                <label className="block text-xxs font-bold text-slate-500 uppercase mb-1">{locale === 'en' ? 'Recurrence / Inclusion' : locale === 'es' ? 'Recurrencia / Inclusión' : 'Recorrência / Inclusão'}</label>

                                <select

                                  value={recurrenceMode}

                                  onChange={e => setRecurrenceMode(e.target.value as any)}

                                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-705 outline-none text-sm font-bold cursor-pointer"

                                >

                                  <option value="single">{locale === 'en' ? `Only on this day (${getDayLabel(activeDayFilter, locale).replace(/ 📅| ☀️/, '')})` : locale === 'es' ? `Solo en este día (${getDayLabel(activeDayFilter, locale).replace(/ 📅| ☀️/, '')})` : `Apenas neste dia (${getDayLabel(activeDayFilter, locale).replace(/ 📅| ☀️/, '')})`}</option>

                                  <option value="weekday">{locale === 'en' ? `Repeat on weekday (${getRecurrenceWeekdayLabel(activeDayFilter, locale)})` : locale === 'es' ? `Repetir en el día de la semana (${getRecurrenceWeekdayLabel(activeDayFilter, locale)})` : `Repetir no dia da semana (${getRecurrenceWeekdayLabel(activeDayFilter, locale).replace('Todas as ', '')})`}</option>

                                  <option value="monthly">{locale === 'en' ? 'Repeat all days of the month (Daily)' : locale === 'es' ? 'Repeat todos los días del mes (Diario)' : 'Repetir em todos os dias do mês (Diária)'}</option>

                                </select>

                              </div>

                            </div>



                            <div className="flex gap-3 mt-2 self-end">

                              <button

                                type="button"

                                onClick={() => { playBubble(); setFormOpen(false); }}

                                className="px-4 py-2.5 bg-slate-200 text-slate-600 text-xs font-bold rounded-xl active:scale-95 cursor-pointer font-Outfit uppercase tracking-wider text-[10px]"

                              >

                                Cancelar

                              </button>

                              <button

                                type="button"

                                onClick={() => {

                                  playBubble();

                                  if (title.trim() && time) {

                                    setFormStep(2);

                                  }

                                }}

                                disabled={!title.trim() || !time}

                                className="px-5 py-2.5 bg-indigo-650 text-white text-xs font-bold rounded-xl shadow-sm hover:bg-indigo-700 active:scale-95 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed cursor-pointer font-Outfit uppercase tracking-wider text-[10px]"

                              >

                                {t.dashboard.nextStepBtn}

                              </button>

                            </div>

                          </div>

                        )}



                        {/* STEP 2: Sensory details & PECS */}

                        {formStep === 2 && (

                          <div className="flex flex-col gap-4">

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                              <div className="md:col-span-1">

                                <label className="block text-xxs font-bold text-slate-500 uppercase mb-1">{t.dashboard.durationMinutes}</label>

                                <input

                                  type="number"

                                  min={1}

                                  max={240}

                                  required

                                  value={taskDuration}

                                  onChange={e => setTaskDuration(parseInt(e.target.value) || 30)}

                                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-707 outline-none text-sm font-bold"

                                />

                              </div>

                              <div className="md:col-span-2">

                                <label className="block text-xxs font-bold text-slate-500 uppercase mb-1">{t.dashboard.instructionsOptional}</label>

                                <input

                                  type="text"

                                  value={taskDescription}

                                  onChange={e => setTaskDescription(e.target.value)}

                                  placeholder="Ex: Escove com movimentos circulares, use pouca pasta..."

                                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-707 placeholder-slate-400 outline-none text-sm font-semibold"

                                />

                              </div>

                            </div>



                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-200/60 pt-3">

                              <div>

                                <label className="block text-xxs font-bold text-slate-500 uppercase mb-1">{t.dashboard.pecsCardIcon} {taskIcon}</label>

                                <div className="flex flex-wrap gap-1.5 p-2 bg-white border border-slate-200 rounded-xl max-h-[82px] overflow-y-auto">

                                  {['🪥', '🍞', '🏫', '🍲', '🧸', '🛌', '🚶', '🚿', '📚', '🐶', '🍕', '🧼', '🎨', '⚽', '🧘', '🦷', '🍎', '💤', '🧴', '👕'].map(emoji => (

                                    <button

                                      type="button"

                                      key={emoji}

                                      onClick={() => setTaskIcon(emoji)}

                                      className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-all cursor-pointer ${

                                        taskIcon === emoji ? 'bg-indigo-650 text-white' : 'bg-slate-50 hover:bg-slate-100 text-slate-700'

                                      }`}

                                    >

                                      {emoji}

                                    </button>

                                  ))}

                                </div>

                              </div>

                              

                              <div>

                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Ou Foto Real (PECS Customizado)</label>

                                <div className="flex gap-2 items-center">

                                  <input

                                    type="file"

                                    accept="image/*"

                                    onChange={e => handleFileChange(e, false)}

                                    className="hidden"

                                    id="task-file-upload"

                                  />

                                  <label

                                    htmlFor="task-file-upload"

                                    className="px-2.5 py-1.5 bg-indigo-50 border border-indigo-250 text-indigo-700 rounded-xl text-[10px] font-black hover:bg-indigo-100/50 cursor-pointer shadow-xxs transition-all flex items-center gap-1 shrink-0"

                                  >

                                    📷 Upload

                                  </label>

                                  <input

                                    type="text"

                                    placeholder="Ou cole a URL da imagem..."

                                    value={taskCustomIcon}

                                    onChange={e => setTaskCustomIcon(e.target.value)}

                                    className="flex-1 px-2.5 py-1.5 bg-white border border-slate-205 rounded-xl text-slate-707 outline-none text-[10px] font-semibold focus:border-indigo-400"

                                  />

                                  {taskCustomIcon && (

                                    <button

                                      type="button"

                                      onClick={() => setTaskCustomIcon('')}

                                      className="text-red-500 text-[10px] font-black cursor-pointer hover:underline"

                                    >

                                      Limpar

                                    </button>

                                  )}

                                </div>

                                {taskCustomIcon && (

                                  <div className="mt-2 flex items-center gap-2">

                                    <span className="text-[9px] text-slate-400 font-semibold">{t.dashboard.preview}</span>

                                    <div className="w-8 h-8 border border-slate-200 rounded-lg overflow-hidden flex items-center justify-center bg-slate-50 shadow-xxs">

                                      <img src={taskCustomIcon} alt="Preview" className="w-full h-full object-cover" />

                                    </div>

                                  </div>

                                )}

                              </div>

                            </div>



                            <div className="flex gap-3 mt-2 self-end">

                              <button

                                type="button"

                                onClick={() => { playBubble(); setFormStep(1); }}

                                className="px-4 py-2.5 bg-slate-200 text-slate-600 text-xs font-bold rounded-xl active:scale-95 cursor-pointer font-Outfit uppercase tracking-wider text-[10px]"

                              >

                                ← Voltar

                              </button>

                              <button

                                type="submit"

                                className="px-5 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-sm hover:bg-indigo-700 active:scale-95 cursor-pointer font-Outfit uppercase tracking-wider text-[10px]"

                              >

                                Salvar na Agenda

                              </button>

                            </div>

                          </div>

                        )}

                      </motion.form>

                    )}

                  </AnimatePresence>



                  {/* Sensory & Clinical Legend Card */}

                  <div className="bg-white border border-slate-200 p-4.5 rounded-2xl shadow-sm flex flex-col gap-2">

                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 select-none">

                      📚 {t.dashboard.didacticsLegendTitle}

                    </span>

                    <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">

                      {t.dashboard.didacticsLegendDesc}

                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5 mt-1 pt-3 border-t border-slate-100">

                      <div className="flex items-center gap-2">

                        <span className="text-xl">🧼</span>

                        <div className="text-[9px] font-bold text-slate-605">

                          {t.dashboard.legendAvd}

                        </div>

                      </div>

                      <div className="flex items-center gap-2">

                        <span className="text-xl">📚</span>

                        <div className="text-[9px] font-bold text-slate-605">

                          {t.dashboard.legendLearning}

                        </div>

                      </div>

                      <div className="flex items-center gap-2">

                        <span className="text-xl">🧸</span>

                        <div className="text-[9px] font-bold text-slate-605">

                          {t.dashboard.legendLeisure}

                        </div>

                      </div>

                      <div className="flex items-center gap-2">

                        <span className="text-xl">🗣️</span>

                        <div className="text-[9px] font-bold text-slate-605">

                          {t.dashboard.legendFamilyVoice}

                        </div>

                      </div>

                    </div>

                  </div>



                  {/* Tasks Lists divided by Periods */}

                  <div className="flex flex-col gap-6">

                    {PERIODS.map(p => {

                      const periodTasks = tasks

                        .filter(t => t.day === activeDayFilter && t.period === p.key)

                        .sort((a, b) => a.time.localeCompare(b.time));



                      return (

                        <div key={p.key} className="flex flex-col gap-2.5">

                          <div className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg w-fit select-none ${p.color}`}>

                            {p.label}

                          </div>



                          {periodTasks.length === 0 ? (

                            <div className="text-slate-400 text-xs border border-dashed border-slate-200/80 p-4 rounded-2xl text-center bg-slate-50/50">

                              {t.dashboard.noTasks}

                            </div>

                          ) : (

                            <div className="flex flex-col gap-2.5">

                              {periodTasks.map(task => {

                                const taskCat = getTaskCategory(task.title);



                                if (editingTaskId === task.id) {

                                  return (

                                    <motion.div

                                      layout

                                      key={task.id}

                                      className="flex flex-col gap-4 p-5 bg-indigo-50/20 border-2 border-indigo-400 rounded-2xl transition-all shadow-sm border-l-6"

                                      style={{ borderLeftColor: '#4338ca' }}

                                    >

                                      <div className="flex justify-between items-center border-b border-indigo-100 pb-2">

                                        <h4 className="font-extrabold text-xs text-indigo-800 uppercase tracking-wider flex items-center gap-1.5 font-Outfit">

                                          {locale === 'en' ? '✏️ Edit Activity' : locale === 'es' ? '✏️ Editar Actividad' : '✏️ Editar Atividade'}

                                        </h4>

                                        <span className="text-[9px] font-bold text-slate-400">ID: {task.id.slice(-6)}</span>

                                      </div>



                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                                        <div>

                                          <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{t.dashboard.activityTitle}</label>

                                          <input

                                            type="text"

                                            required

                                            value={editTaskTitle}

                                            onChange={e => setEditTaskTitle(e.target.value)}

                                            className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 outline-none text-xs font-bold focus:border-indigo-400"

                                          />

                                        </div>



                                        <div className="grid grid-cols-2 gap-2">

                                          <div>

                                            <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{locale === 'en' ? 'Time' : locale === 'es' ? 'Horario' : 'Horário'}</label>

                                            <input

                                              type="time"

                                              required

                                              value={editTaskTime}

                                              onChange={e => setEditTaskTime(e.target.value)}

                                              className="w-full px-2 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 outline-none text-xs font-bold focus:border-indigo-400"

                                            />

                                          </div>

                                          

                                          <div>

                                            <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{t.dashboard.period}</label>

                                            <select

                                              value={editTaskPeriod}

                                              onChange={e => setEditTaskPeriod(e.target.value as any)}

                                              className="w-full px-2 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 outline-none text-xs font-bold focus:border-indigo-400"

                                            >

                                              <option value="manhã">Manhã</option>

                                              <option value="tarde">Tarde</option>

                                              <option value="noite">Noite</option>

                                            </select>

                                          </div>

                                        </div>

                                      </div>



                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 border-t border-slate-200/60 pt-3">

                                        <div>

                                          <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{t.dashboard.durationMinutes}</label>

                                          <input

                                            type="number"

                                            min={1}

                                            max={240}

                                            required

                                            value={editTaskDuration}

                                            onChange={e => setEditTaskDuration(parseInt(e.target.value) || 30)}

                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 outline-none text-xs font-bold focus:border-indigo-400"

                                          />

                                        </div>

                                        

                                        <div className="md:col-span-2">

                                          <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{locale === 'en' ? 'Instructions / Description' : locale === 'es' ? 'Instrucciones / Descripción' : 'Instruções / Descrição'}</label>

                                          <input

                                            type="text"

                                            value={editTaskDescription}

                                            onChange={e => setEditTaskDescription(e.target.value)}

                                            placeholder="Ex: Escovar com movimentos suaves..."

                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 outline-none text-xs focus:border-indigo-400"

                                          />

                                        </div>

                                      </div>



                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-slate-200/60 pt-3">

                                        <div>

                                          <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Categoria</label>

                                          <select

                                            value={editTaskCategory}

                                            onChange={e => setEditTaskCategory(e.target.value as any)}

                                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 outline-none text-xs font-bold focus:border-indigo-400 cursor-pointer"

                                          >

                                            <option value="AVD">AVD (Vida Diária) 🧼</option>

                                            <option value="Aprendizado">Aprendizado 📚</option>

                                            <option value="Lazer">Lazer 🧸</option>

                                          </select>

                                        </div>



                                        <div>

                                          <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">{t.dashboard.pecsCardIcon} {editTaskIcon}</label>

                                          <div className="flex flex-wrap gap-1.5 p-1.5 bg-white border border-slate-200 rounded-xl max-h-[70px] overflow-y-auto">

                                            {['🪥', '🍞', '🏫', '🍲', '🧸', '🛌', '🚶', '🚿', '📚', '🐶', '🍕', '🧼', '🎨', '⚽', '🧘', '🦷', '🍎', '💤', '🧴', '👕'].map(emoji => (

                                              <button

                                                type="button"

                                                key={emoji}

                                                onClick={() => setEditTaskIcon(emoji)}

                                                className={`w-6 h-6 rounded-md text-xs flex items-center justify-center transition-all cursor-pointer ${

                                                  editTaskIcon === emoji ? 'bg-indigo-650 text-white' : 'bg-slate-50 hover:bg-slate-100 text-slate-700'

                                                }`}

                                              >

                                                {emoji}

                                              </button>

                                            ))}

                                          </div>

                                          <div className="mt-2">

                                            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Ou Foto Real (PECS Customizado)</label>

                                            <div className="flex gap-1.5 items-center">

                                              <input

                                                type="file"

                                                accept="image/*"

                                                onChange={e => handleFileChange(e, true)}

                                                className="hidden"

                                                id="edit-task-file-upload"

                                              />

                                              <label

                                                htmlFor="edit-task-file-upload"

                                                className="px-2 py-1 bg-indigo-50 border border-indigo-250 text-indigo-700 rounded-lg text-[9px] font-black hover:bg-indigo-100/50 cursor-pointer shadow-xxs transition-all flex items-center gap-1 shrink-0"

                                              >

                                                📷 Foto

                                              </label>

                                              <input

                                                type="text"

                                                placeholder="URL da imagem..."

                                                value={editTaskCustomIcon}

                                                onChange={e => setEditTaskCustomIcon(e.target.value)}

                                                className="flex-1 px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 outline-none text-[9px] font-semibold focus:border-indigo-400"

                                              />

                                              {editTaskCustomIcon && (

                                                <button

                                                  type="button"

                                                  onClick={() => setEditTaskCustomIcon('')}

                                                  className="text-red-500 text-[9px] font-black cursor-pointer hover:underline"

                                                >

                                                  Limpar

                                                </button>

                                              )}

                                            </div>

                                            {editTaskCustomIcon && (

                                              <div className="mt-1 flex items-center gap-2">

                                                <span className="text-[8px] text-slate-400 font-semibold">{t.dashboard.preview}</span>

                                                <div className="w-6 h-6 border border-slate-200 rounded-md overflow-hidden flex items-center justify-center bg-slate-50 shadow-xxs">

                                                  <img src={editTaskCustomIcon} alt="Preview" className="w-full h-full object-cover" />

                                                </div>

                                              </div>

                                            )}

                                          </div>

                                        </div>

                                      </div>



                                      <div className="flex gap-2 justify-end mt-2 border-t border-slate-200/60 pt-3">

                                        <button

                                          type="button"

                                          onClick={() => { playBubble(); setEditingTaskId(null); }}

                                          className="px-3.5 py-2 bg-slate-200 hover:bg-slate-350 text-slate-700 text-xs font-bold rounded-xl active:scale-95 cursor-pointer transition-all"

                                        >

                                          Cancelar

                                        </button>

                                        <button

                                          type="button"

                                          onClick={() => handleSaveTaskEdit(task.id)}

                                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm active:scale-95 cursor-pointer transition-all"

                                        >

                                          {t.dashboard.saveChanges}

                                        </button>

                                      </div>

                                    </motion.div>

                                  );

                                }



                                                                const isExpanded = !!expandedTasks[task.id];

                                return (

                                  <motion.div

                                    layout

                                    key={task.id}

                                    className={`flex flex-col bg-white border border-slate-200 rounded-xl hover:bg-slate-50/60 transition-all group border-l-4 overflow-hidden`}

                                    style={{ borderLeftColor: 

                                      taskCat.gradient.includes('teal') ? '#0d9488' : 

                                      taskCat.gradient.includes('amber') || taskCat.gradient.includes('orange') ? '#ea580c' : 

                                      taskCat.gradient.includes('sky') || taskCat.gradient.includes('blue') ? '#0284c7' : 

                                      taskCat.gradient.includes('indigo') ? '#4338ca' : 

                                      taskCat.gradient.includes('violet') ? '#7c3aed' : 

                                      taskCat.gradient.includes('emerald') ? '#059669' : 

                                      taskCat.gradient.includes('pink') ? '#db2777' : 

                                      '#db2777' 

                                    }}

                                  >

                                    {/* Main Header Row: Clickable to expand */}

                                    <div 

                                      onClick={() => {

                                        playBubble();

                                        setExpandedTasks(prev => ({

                                          ...prev,

                                          [task.id]: !prev[task.id]

                                        }));

                                      }}

                                      className="flex items-center justify-between px-3.5 py-2.5 cursor-pointer select-none"

                                    >

                                      <div className="flex items-center gap-3">

                                        <div className="w-9 h-9 bg-indigo-50 border border-indigo-100 text-slate-700 rounded-xl flex items-center justify-center text-lg shadow-xxs shrink-0 overflow-hidden">

                                          {task.customIcon ? (

                                            <img src={task.customIcon} alt="" className="w-full h-full object-cover" />

                                          ) : (

                                            task.icon || '📅'

                                          )}

                                        </div>

                                        <div className="w-9 h-9 bg-slate-50 border border-slate-200/60 text-slate-500 rounded-xl flex items-center justify-center text-xs font-black shadow-xxs shrink-0">

                                          {task.time}

                                        </div>

                                        <span className="font-extrabold text-slate-700 text-sm">{task.title}</span>

                                      </div>



                                      <div className="flex items-center gap-2">

                                        <span className={`text-xxs font-black uppercase tracking-wider px-3 py-1 rounded-full border shadow-xxs ${

                                          task.isCompleted 

                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 

                                            : 'bg-amber-50 text-amber-600 border-amber-250'

                                        }`}>

                                          {task.isCompleted ? 'Feito ✓' : 'Pendente'}

                                        </span>

                                        {isExpanded ? (

                                          <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />

                                        ) : (

                                          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />

                                        )}

                                      </div>

                                    </div>



                                    {/* Expanded Details Row: Description, Category, Duration, Action Buttons */}

                                    <AnimatePresence>

                                      {isExpanded && (

                                        <motion.div

                                          initial={{ height: 0, opacity: 0 }}

                                          animate={{ height: 'auto', opacity: 1 }}

                                          exit={{ height: 0, opacity: 0 }}

                                          className="border-t border-slate-100 bg-slate-50/50 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 overflow-hidden"

                                        >

                                          <div className="flex flex-col gap-2">

                                            <div className="flex items-center gap-2">

                                              <span className="text-[9px] px-2 py-0.5 rounded-full font-black bg-slate-200 text-slate-600 border border-slate-300 uppercase tracking-wider">

                                                {task.category || 'AVD'}

                                              </span>

                                              {task.duration && (

                                                <span className="text-[9px] px-2 py-0.5 rounded-full font-black bg-indigo-50 text-indigo-750 border border-indigo-150 uppercase tracking-wider">

                                                  ⏱️ {task.duration} min

                                                </span>

                                              )}

                                            </div>

                                            {task.description && (

                                              <p className="text-[11px] text-slate-500 font-semibold leading-tight mt-1">

                                                {task.description}

                                              </p>

                                            )}

                                          </div>



                                          <div className="flex items-center gap-2 self-end md:self-center">

                                            {!task.isCompleted && (

                                              <button

                                                onClick={() => {

                                                  playBubble();

                                                  setEditingTaskId(task.id);

                                                  setEditTaskTitle(task.title);

                                                  setEditTaskTime(task.time);

                                                  setEditTaskPeriod(task.period as any);

                                                  setEditTaskDuration(task.duration || 30);

                                                  setEditTaskDescription(task.description || '');

                                                  setEditTaskCategory(task.category as any || 'AVD');

                                                  setEditTaskIcon(task.icon || '📅');

                                                }}

                                                className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 border border-indigo-150 text-indigo-650 hover:bg-indigo-100/50 rounded-xl text-xxs font-black transition-all active:scale-95 cursor-pointer"

                                                title="Editar Atividade"

                                              >

                                                <Pencil className="w-3 h-3" /> Editar

                                              </button>

                                            )}



                                            <button

                                              onClick={() => handleDeleteTask(task)}

                                              className="flex items-center gap-1 px-3 py-1.5 bg-red-50 border border-red-150 text-red-600 hover:bg-red-100/50 rounded-xl text-xxs font-black transition-all active:scale-95 cursor-pointer"

                                              title="Excluir Atividade"

                                            >

                                              <Trash2 className="w-3 h-3" /> Excluir

                                            </button>

                                          </div>

                                        </motion.div>

                                      )}

                                    </AnimatePresence>

                                  </motion.div>

                                );

                              })}

                            </div>

                          )}

                        </div>

                      );

                    })}

                  </div>

                    </>

                  )}



                  {/* Weekly View Block */}

                  {scheduleViewMode === 'weekly' && (

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">

                      {weekDays.map(dayNum => {

                        const day = DAYS_OF_MONTH.find(d => d.key === String(dayNum));

                        if (!day) return null;

                        const dayTasks = tasks.filter(t => t.day === day.key);

                        const completedTasks = dayTasks.filter(t => t.isCompleted);

                        const isToday = day.key === activeDayFilter;

                        const progressPercent = dayTasks.length > 0 ? Math.round((completedTasks.length / dayTasks.length) * 100) : 0;



                        return (

                          <div 

                            key={day.key}

                            className={`flex flex-col justify-between p-4.5 rounded-3xl border-2 transition-all shadow-xxs hover:shadow-sm ${

                              isToday 

                                ? 'border-indigo-400 bg-indigo-50/15' 

                                : 'border-slate-200 bg-white hover:border-slate-300'

                            }`}

                          >

                            <div>

                              {/* Header of the Day Card */}

                              <div className="flex justify-between items-start mb-3">

                                <div>

                                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${

                                    isToday ? 'bg-indigo-650 text-white' : 'bg-slate-100 text-slate-655'

                                  }`}>

                                    {day.weekdayShort}

                                  </span>

                                  <h4 className="font-extrabold text-slate-800 text-sm mt-1 font-Outfit">

                                    {day.label}

                                  </h4>

                                </div>

                                <div className="text-right">

                                  <span className="text-[10px] font-bold text-slate-450 block">

                                    {completedTasks.length}/{dayTasks.length} Feitas

                                  </span>

                                  {dayTasks.length > 0 && (

                                    <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full border ${

                                      progressPercent === 100 

                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 

                                        : 'bg-indigo-50 text-indigo-600 border-indigo-200'

                                    }`}>

                                      {progressPercent}%

                                    </span>

                                  )}

                                </div>

                              </div>



                              {/* Progress Bar */}

                              {dayTasks.length > 0 && (

                                <div className="w-full bg-slate-105 rounded-full h-1.5 mb-4 overflow-hidden border border-slate-200/50">

                                  <div 

                                    className={`h-full rounded-full ${progressPercent === 100 ? 'bg-emerald-500' : 'bg-indigo-650'}`}

                                    style={{ width: `${progressPercent}%` }}

                                  />

                                </div>

                              )}



                              {/* Tasks Mini List */}

                              <div className="flex flex-col gap-2.5 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin mb-4">

                                {dayTasks.length === 0 ? (

                                  <p className="text-[11px] text-slate-400 font-semibold italic text-center py-4 bg-slate-50/50 border border-dashed border-slate-150 rounded-xl">

                                    Sem atividades.

                                  </p>

                                ) : (

                                  dayTasks

                                    .sort((a, b) => a.time.localeCompare(b.time))

                                    .map(t => {

                                      const taskCat = getTaskCategory(t.title);

                                      return (

                                        <div 

                                          key={t.id} 

                                          className="flex items-center justify-between p-2 bg-slate-50/50 border border-slate-150 rounded-xl hover:bg-slate-50 transition-all border-l-4"

                                          style={{ borderLeftColor: 

                                            taskCat.gradient.includes('teal') ? '#0d9488' : 

                                            taskCat.gradient.includes('amber') || taskCat.gradient.includes('orange') ? '#ea580c' : 

                                            taskCat.gradient.includes('sky') || taskCat.gradient.includes('blue') ? '#0284c7' : 

                                            taskCat.gradient.includes('indigo') ? '#4338ca' : 

                                            taskCat.gradient.includes('violet') ? '#7c3aed' : 

                                            taskCat.gradient.includes('emerald') ? '#059669' : 

                                            '#db2777' 

                                          }}

                                        >

                                          <div className="flex items-center gap-2 min-w-0">

                                            <div className="w-6 h-6 bg-white border border-slate-200 text-slate-700 rounded-lg flex items-center justify-center text-xs shrink-0 overflow-hidden select-none">

                                              {t.customIcon ? (

                                                <img src={t.customIcon} alt="" className="w-full h-full object-cover" />

                                              ) : (

                                                t.icon || '📅'

                                              )}

                                            </div>

                                            <div className="min-w-0">

                                              <p className="text-xxs font-black text-slate-450">{t.time}</p>

                                              <p className="text-xs font-bold text-slate-700 truncate max-w-[110px]">{t.title}</p>

                                            </div>

                                          </div>

                                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md shrink-0 ${

                                            t.isCompleted 

                                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-250' 

                                              : 'bg-amber-50 text-amber-600 border-amber-250'

                                          }`}>

                                            {t.isCompleted ? '✓' : '•'}

                                          </span>

                                        </div>

                                      );

                                    })

                                )}

                              </div>

                            </div>



                            {/* Action button */}

                            <button

                              type="button"

                              onClick={() => {

                                playBubble();

                                setActiveDayFilter(day.key);

                                setScheduleViewMode('daily');

                              }}

                              className="w-full py-2 bg-indigo-50 hover:bg-indigo-150 text-indigo-700 text-xs font-black rounded-2xl border border-indigo-200 transition-all active:scale-95 cursor-pointer text-center mt-2 font-Outfit"

                            >

                              Ver Detalhes

                            </button>

                          </div>

                        );

                      })}

                    </div>

                  )}



                  {/* Monthly View Block */}

                  {scheduleViewMode === 'monthly' && (

                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-3.5">

                      {DAYS_OF_MONTH.map(day => {

                        const dayTasks = tasks.filter(t => t.day === day.key);

                        const completedTasks = dayTasks.filter(t => t.isCompleted);

                        const isSelected = day.key === activeDayFilter;

                        const progressPercent = dayTasks.length > 0 ? Math.round((completedTasks.length / dayTasks.length) * 100) : 0;

                        const taskPreview = dayTasks.slice(0, 2);



                        return (

                          <button

                            key={day.key}

                            type="button"

                            onClick={() => {

                              playBubble();

                              setActiveDayFilter(day.key);

                              setScheduleViewMode('daily');

                            }}

                            className={`flex flex-col items-center justify-between p-3.5 rounded-2xl border-2 transition-all text-left cursor-pointer active:scale-95 group h-32 ${

                              isSelected 

                                ? 'border-indigo-400 bg-indigo-50/15 shadow-sm' 

                                : 'border-slate-150 bg-white hover:border-slate-300 hover:shadow-sm'

                            }`}

                          >

                            {/* Day Number and Completion Rate */}

                            <div className="flex justify-between items-start w-full">

                              <div className="flex flex-col">

                                <span className={`text-sm font-black font-Outfit ${isSelected ? 'text-indigo-650' : 'text-slate-800'}`}>

                                  Dia {day.key}

                                </span>

                                <span className="text-[8px] font-bold text-slate-450 uppercase">{day.weekdayShort}</span>

                              </div>

                              {dayTasks.length > 0 ? (

                                <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full border shrink-0 ${

                                  progressPercent === 100 

                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-150' 

                                    : 'bg-indigo-50 text-indigo-600 border-indigo-150'

                                }`}>

                                  {progressPercent}%

                                </span>

                              ) : (

                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider shrink-0 select-none">

                                  Livre

                                </span>

                              )}

                            </div>



                            {/* Task Emojis Preview */}

                            <div className="flex gap-1.5 my-2.5 items-center justify-center w-full">

                              {dayTasks.length === 0 ? (

                                <span className="text-xs text-slate-350 select-none">🧸</span>

                              ) : (

                                <>

                                  {taskPreview.map(t => (

                                    <div 

                                      key={t.id} 

                                      title={t.title}

                                      className="w-7 h-7 bg-slate-50 border border-slate-205 text-slate-700 rounded-lg flex items-center justify-center text-sm shadow-xxs overflow-hidden select-none shrink-0"

                                    >

                                      {t.customIcon ? (

                                        <img src={t.customIcon} alt="" className="w-full h-full object-cover" />

                                      ) : (

                                        t.icon || '📅'

                                      )}

                                    </div>

                                  ))}

                                  {dayTasks.length > 2 && (

                                    <span className="text-[9px] font-black text-slate-450 bg-slate-100 border border-slate-200/80 w-5 h-5 rounded-full flex items-center justify-center shrink-0">

                                      +{(dayTasks.length - 2)}

                                    </span>

                                  )}

                                </>

                              )}

                            </div>



                            {/* Bottom Task count and progress bar */}

                            <div className="w-full">

                              {dayTasks.length > 0 ? (

                                <div className="flex flex-col gap-1 w-full">

                                  <span className="text-[9px] text-slate-450 font-bold block truncate">

                                    {completedTasks.length}/{dayTasks.length} feitas

                                  </span>

                                  <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">

                                    <div 

                                      className={`h-full rounded-full ${progressPercent === 100 ? 'bg-emerald-500' : 'bg-indigo-650'}`}

                                      style={{ width: `${progressPercent}%` }}

                                    />

                                  </div>

                                </div>

                              ) : (

                                <span className="text-[9px] text-slate-400 italic block font-semibold text-center select-none">

                                  Sem tarefas

                                </span>

                              )}

                            </div>

                          </button>

                        );

                      })}

                    </div>

                  )}

                {/* GLOBAL CALENDAR REPLICATION & UNEXPECTED CHANGES */}

                {activeChild && (

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Template Replication */}

                    <div className="bg-gradient-to-br from-indigo-50/50 to-sky-50/50 border border-indigo-150 p-6 rounded-[28px] shadow-sm flex flex-col gap-4 text-left">

                      <div className="flex items-center gap-2 text-indigo-950">

                        <span className="text-xl">📅</span>

                        <h4 className="font-extrabold text-sm font-Outfit uppercase tracking-wide">{t.dashboard.scheduleTemplate}</h4>

                      </div>

                      <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">

                        {t.dashboard.saveTemplateDesc}

                      </p>



                      



                      <div className="flex gap-2.5 mt-1">

                        <button

                          type="button"

                          onClick={handleSaveMonthlyTemplate}

                          className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-755 text-white text-xs font-black rounded-xl border-b-2 border-indigo-900 active:scale-95 transition-all cursor-pointer font-Outfit uppercase tracking-wider"

                        >

                          💾 {t.dashboard.saveTemplate}

                        </button>

                        <button

                          type="button"

                          onClick={handleReapplyMonthlyTemplate}

                          disabled={!activeChild.monthlyTemplate}

                          className="flex-1 py-2.5 bg-white hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-455 disabled:border-slate-200 text-indigo-955 text-xs font-black rounded-xl border-2 border-slate-250 active:scale-95 transition-all cursor-pointer font-Outfit uppercase tracking-wider disabled:shadow-none"

                        >

                          🔄 {t.dashboard.reapplyTemplate}

                        </button>

                      </div>

                      {activeChild.monthlyTemplate && (() => {

                        const savedType = getSavedTemplateType();

                        return (

                          <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50/50 border border-emerald-150 px-2 py-1 rounded-lg text-center mt-1 self-start select-none">

                            ✓ {locale === 'en'

                              ? `${savedType === 'day' ? 'Day' : savedType === 'week' ? 'Week' : 'Month'} template saved in patient profile`

                              : locale === 'es'

                              ? `Modelo de ${savedType === 'day' ? 'día' : savedType === 'week' ? 'semana' : 'mes'} guardado en el perfil`

                              : `Modelo de ${savedType === 'day' ? 'dia' : savedType === 'week' ? 'semana' : 'mês'} salvo no perfil`}

                          </span>

                        );

                      })()}

                    </div>



                    {/* Unexpected Change Panel */}

                    <div className="bg-gradient-to-br from-amber-50/50 to-orange-50/50 border border-amber-150 p-6 rounded-[28px] shadow-sm flex flex-col gap-4 text-left">

                      <div className="flex items-center gap-2 text-amber-950">

                        <span className="text-xl">⚠️</span>

                        <h4 className="font-extrabold text-sm font-Outfit uppercase tracking-wide">{t.dashboard.notifyChangeTitle}</h4>

                      </div>

                      

                      {unexpectedChangeObj ? (

                        <div className="flex flex-col gap-3">

                          <div className="p-3 bg-white border border-amber-200 rounded-xl text-xxs font-semibold text-slate-700 flex flex-col gap-1.5">

                            <div>

                              <strong className="text-amber-800">{t.dashboard.cancelledActivity}</strong> {unexpectedChangeObj.cancelledTaskTitle}

                            </div>

                            <div>

                              <strong className="text-amber-800">{t.dashboard.changeReason}</strong> {unexpectedChangeObj.reason}

                            </div>

                            <div>

                              <strong className="text-amber-800">{t.dashboard.replacementActivity}</strong> {unexpectedChangeObj.replacement}

                            </div>

                          </div>

                          <button

                            type="button"

                            onClick={handleClearUnexpectedChange}

                            className="w-full py-2.5 bg-red-500 hover:bg-red-650 text-white text-xs font-black rounded-xl border-b-2 border-red-750 active:scale-95 transition-all cursor-pointer font-Outfit uppercase tracking-wider"

                          >

                            ❌ {t.dashboard.cancelNotification}

                          </button>

                        </div>

                      ) : (

                        <form onSubmit={handleDeclareUnexpectedChange} className="flex flex-col gap-2.5">

                          <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">

                            {t.dashboard.unexpectedChangeDesc}

                          </p>

                          <div className="grid grid-cols-1 gap-2 mt-1">

                            <div>

                              <label className="block text-[8px] font-black text-slate-500 uppercase mb-0.5 pl-0.5">{t.dashboard.affectedActivity}</label>

                              <select

                                value={selectedCancelTaskTitle}

                                onChange={e => setSelectedCancelTaskTitle(e.target.value)}

                                className="w-full px-2.5 py-1.5 bg-white border border-slate-250 rounded-lg text-[10px] font-bold outline-none cursor-pointer"

                                required

                              >

                                <option value="">{t.dashboard.selectActivity}</option>

                                {tasks.filter(t => t.day === activeDayFilter).map(t => (

                                  <option key={t.id} value={t.title}>{t.title} ({t.time})</option>

                                ))}

                                {tasks.filter(t => t.day === activeDayFilter).length === 0 && (

                                  <option disabled>{t.dashboard.noActivitiesToday}</option>

                                )}

                              </select>

                            </div>

                            <div className="grid grid-cols-2 gap-2">

                              <div>

                                <label className="block text-[8px] font-black text-slate-500 uppercase mb-0.5 pl-0.5">{t.dashboard.changeReasonLabel}</label>

                                <input

                                  type="text"

                                  placeholder={t.dashboard.changeReasonPlaceholder}

                                  value={changeReason}

                                  onChange={e => setChangeReason(e.target.value)}

                                  className="w-full px-2.5 py-1.5 bg-white border border-slate-250 rounded-lg text-xxs font-bold outline-none"

                                  required

                                />

                              </div>

                              <div>

                                <label className="block text-[8px] font-black text-slate-500 uppercase mb-0.5 pl-0.5">{t.dashboard.replacementLabel}</label>

                                  <input

                                  type="text"

                                  placeholder={t.dashboard.replacementPlaceholder}

                                  value={changeReplacement}

                                  onChange={e => setChangeReplacement(e.target.value)}

                                  className="w-full px-2.5 py-1.5 bg-white border border-slate-250 rounded-lg text-xxs font-bold outline-none"

                                  required

                                />

                              </div>

                            </div>

                          </div>

                          <button

                            type="submit"

                            className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl border-b-2 border-amber-700 active:scale-95 transition-all cursor-pointer font-Outfit uppercase tracking-wider"

                          >

                            📢 {t.dashboard.sendToChild}

                          </button>

                        </form>

                      )}

                    </div>

                  </div>

                )}







                </div>

              </motion.div>

            ) : activePanelTab === 'feedback' ? (
              activeFeedbackSubTab === 'checkpoints' ? (

              <motion.div

                key="checkpoints-panel"

                initial={{ opacity: 0, y: 10 }}

                animate={{ opacity: 1, y: 0 }}

                exit={{ opacity: 0, y: -10 }}

                className="bg-white border border-slate-200 rounded-[32px] p-6 shadow-md shadow-slate-100 flex flex-col gap-6"

              >

                <div className="flex items-center justify-between border-b border-slate-100 pb-4">

                  <div>

                    <h3 className="font-black text-slate-850 text-xl leading-tight font-Outfit">

                      {locale === 'es' ? 'Puntos de Control' : locale === 'en' ? 'Clinical Checkpoints' : 'Checkpoints Clínicos'} & Evolução 🤝

                    </h3>

                    <p className="text-xs text-slate-400 font-semibold mt-0.5">

                      {locale === 'es' ? 'Seguimiento diario o semanal de las orientaciones y sesiones de los especialistas.' : locale === 'en' ? 'Daily or weekly follow-up of specialists\' guidance and sessions.' : 'Acompanhamento por dia ou por semana das orientações e sessões dos especialistas.'}

                    </p>

                  </div>

                  <button

                    type="button"

                    onClick={() => { playBubble(); setNewCpOpen(!newCpOpen); if (!newCpDate) setNewCpDate(new Date().toISOString().split('T')[0]); }}

                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-600 text-xs font-black rounded-full shadow-sm transition-all cursor-pointer font-Outfit border-none outline-none"

                  >

                    <Plus className="w-4 h-4" /> {newCpOpen ? (locale === 'es' ? 'Cerrar Registro' : locale === 'en' ? 'Close Register' : 'Fechar Cadastro') : `+ ${t.dashboard.newDailyCheckpoint}`}

                  </button>

                </div>



                <AnimatePresence>

                  {newCpOpen && (

                    <motion.form

                      initial={{ opacity: 0, height: 0 }}

                      animate={{ opacity: 1, height: 'auto' }}

                      exit={{ opacity: 0, height: 0 }}

                      onSubmit={handleCreateDailyCheckpoint}

                      className="bg-slate-50 border border-slate-200 p-5 rounded-[24px] overflow-hidden flex flex-col gap-4 text-xs"

                    >

                      <h4 className="font-black text-slate-800 font-Outfit">

                        {t.dashboard.newDailyCheckpoint}

                      </h4>

                      

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                        <div>

                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">

                            {t.dashboard.sessionDate}

                          </label>

                          <input

                            type="date"

                            required

                            value={newCpDate}

                            onChange={e => setNewCpDate(e.target.value)}

                            className="w-full bg-white border-2 border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:border-indigo-650 focus:bg-white outline-none"

                          />

                        </div>



                        <div>

                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">

                            {locale === 'es' ? 'Profesional / Terapeuta' : locale === 'en' ? 'Professional / Therapist' : 'Profissional / Terapeuta'}

                          </label>

                          <input

                            type="text"

                            required

                            placeholder={locale === 'es' ? 'Ej: Dra. Ana Paula' : locale === 'en' ? 'E.g.: Dr. Jane Doe' : 'Ex: Dra. Ana Paula'}

                            value={newCpName}

                            onChange={e => setNewCpName(e.target.value)}

                            className="w-full bg-white border-2 border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:border-indigo-650 focus:bg-white outline-none"

                          />

                        </div>



                        <div>

                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">

                            {t.dashboard.professional}

                          </label>

                          <select

                            value={newCpRole}

                            onChange={e => setNewCpRole(e.target.value)}

                            className="w-full bg-white border-2 border-slate-200 rounded-xl px-3 py-2 text-xs font-black focus:border-indigo-655 focus:bg-white outline-none cursor-pointer"

                          >

                            <option value="Psicologia ABA">{locale === 'es' ? 'Psicología ABA 🧠' : locale === 'en' ? 'ABA Psychology 🧠' : 'Psicologia ABA 🧠'}</option>

                            <option value="Terapia Ocupacional">{locale === 'es' ? 'Terapia Ocupacional 🧼' : locale === 'en' ? 'Occupational Therapy 🧼' : 'Terapia Ocupacional 🧼'}</option>

                            <option value="Fonoterapia">{locale === 'es' ? 'Fonoaudiología 🗣️' : locale === 'en' ? 'Speech Therapy 🗣️' : 'Fonoterapia 🗣️'}</option>

                            <option value="Fisioterapia">{locale === 'es' ? 'Fisioterapia 🩺' : locale === 'en' ? 'Physical Therapy 🩺' : 'Fisioterapia 🩺'}</option>

                            <option value="Psicoterapia">{locale === 'es' ? 'Psicoterapia 💬' : locale === 'en' ? 'Psychotherapy 💬' : 'Psicoterapia 💬'}</option>

                            <option value="Psicomotricidade">{locale === 'es' ? 'Psicomotricidad 🏃' : locale === 'en' ? 'Psychomotricity 🏃' : 'Psicomotricidade 🏃'}</option>

                            <option value="Outro">{locale === 'es' ? 'Otro 🧑‍⚕️' : locale === 'en' ? 'Other 🧑‍⚕️' : 'Outro 🧑‍⚕️'}</option>

                          </select>

                        </div>

                      </div>



                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        <div>

                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">

                            {t.dashboard.homeFeedback}

                          </label>

                          <textarea

                            placeholder={t.dashboard.homeFeedbackPlaceholder}

                            value={newCpFeedback}

                            onChange={e => setNewCpFeedback(e.target.value)}

                            className="w-full bg-white border-2 border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:border-indigo-650 focus:bg-white outline-none h-20 resize-none"

                          />

                        </div>

                        <div>

                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">

                            {t.dashboard.guardianNotes}

                          </label>

                          <textarea

                            placeholder={t.dashboard.guardianNotesPlaceholder}

                            value={newCpNotes}

                            onChange={e => setNewCpNotes(e.target.value)}

                            className="w-full bg-white border-2 border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:border-indigo-650 focus:bg-white outline-none h-20 resize-none"

                          />

                        </div>

                      </div>



                      <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-1">

                        <label className="flex items-center gap-1.5 text-xs font-black text-slate-700 cursor-pointer select-none">

                          <input 

                            type="checkbox" 

                            className="rounded text-indigo-650 focus:ring-indigo-500 w-4 h-4 border-2 border-slate-300"

                            checked={newCpStatus === 'completed'}

                            onChange={(e) => setNewCpStatus(e.target.checked ? 'completed' : 'pending')}

                          />

                          {t.dashboard.sessionRealized}

                        </label>



                        <div className="flex items-center gap-2">

                          <button

                            type="button"

                            onClick={() => { playBubble(); setNewCpOpen(false); }}

                            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-755 text-xs font-black rounded-xl cursor-pointer active:scale-95 transition-all"

                          >

                            {t.common.cancel}

                          </button>

                          <button

                            type="submit"

                            disabled={creatingCheckpoint}

                            className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-black rounded-xl cursor-pointer active:scale-95 transition-all shadow-sm disabled:opacity-50"

                          >

                            {creatingCheckpoint ? t.dashboard.registering : t.dashboard.recordCheckpoint}

                          </button>

                        </div>

                      </div>

                    </motion.form>

                  )}

                </AnimatePresence>



                {loadingCheckpoints ? (

                  <div className="flex flex-col items-center justify-center p-12 gap-3">

                    <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-650 rounded-full animate-spin"></div>

                    <span className="text-xs font-bold text-slate-500">Carregando checkpoints...</span>

                  </div>

                ) : checkpoints.length === 0 ? (

                  <div className="text-slate-450 text-xs border border-dashed border-slate-200/80 p-8 rounded-2xl text-center bg-slate-50/50">

                    {t.dashboard.noSessions}

                  </div>

                ) : (

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {checkpoints.map((cp) => {

                      const isEditing = editingCheckpointId === cp.id;

                      return (

                        <div 

                          key={cp.id} 

                          className={`border-2 rounded-[24px] p-5 shadow-xxs transition-all flex flex-col gap-4 ${

                            cp.status === 'completed'

                              ? 'border-emerald-200 bg-emerald-50/10'

                              : 'border-slate-200 bg-white'

                          }`}

                        >

                          <div className="flex items-center justify-between border-b border-slate-100 pb-3">

                            <span className="text-sm font-black text-slate-850 font-Outfit">

                              {cp.date 

                                ? (locale === 'es' 

                                    ? `Sesión: ${new Date(cp.date + 'T00:00:00').toLocaleDateString('es-ES')}` 

                                    : locale === 'en' 

                                      ? `Session: ${new Date(cp.date + 'T00:00:00').toLocaleDateString('en-US')}` 

                                      : `Sessão: ${new Date(cp.date + 'T00:00:00').toLocaleDateString('pt-BR')}`) 

                                : (locale === 'es' ? `Semana ${cp.weekNum}` : locale === 'en' ? `Week ${cp.weekNum}` : `Semana ${cp.weekNum}`)}

                            </span>

                            <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border shadow-xxs ${

                              cp.status === 'completed' 

                                ? 'bg-emerald-50 text-emerald-600 border-emerald-250' 

                                : 'bg-amber-50 text-amber-600 border-amber-200'

                            }`}>

                              {cp.status === 'completed' ? t.dashboard.completed : t.dashboard.pending}

                            </span>

                          </div>



                          {isEditing ? (

                            <div className="flex flex-col gap-3">

                              <div className="grid grid-cols-2 gap-3">

                                <div>

                                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">

                                    {locale === 'es' ? 'Profesional' : locale === 'en' ? 'Professional' : 'Profissional'}

                                  </label>

                                  <input 

                                    type="text" 

                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-indigo-500" 

                                    placeholder={t.dashboard.professionalPlaceholder} 

                                    value={editName}

                                    onChange={(e) => setEditName(e.target.value)}

                                  />

                                </div>

                                <div>

                                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">

                                    {t.dashboard.professional}

                                  </label>

                                  <select 

                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-extrabold text-slate-700 focus:outline-indigo-500" 

                                    value={editRole}

                                    onChange={(e) => setEditRole(e.target.value)}

                                  >

                                    <option value="Psicologia ABA">{locale === 'es' ? 'Psicología ABA 🧠' : locale === 'en' ? 'ABA Psychology 🧠' : 'Psicologia ABA 🧠'}</option>

                                    <option value="Terapia Ocupacional">{locale === 'es' ? 'Terapia Ocupacional 🧼' : locale === 'en' ? 'Occupational Therapy 🧼' : 'Terapia Ocupacional 🧼'}</option>

                                    <option value="Fonoterapia">{locale === 'es' ? 'Fonoaudiología 🗣️' : locale === 'en' ? 'Speech Therapy 🗣️' : 'Fonoterapia 🗣️'}</option>

                                    <option value="Fisioterapia">{locale === 'es' ? 'Fisioterapia 🩺' : locale === 'en' ? 'Physical Therapy 🩺' : 'Fisioterapia 🩺'}</option>

                                    <option value="Psicoterapia">{locale === 'es' ? 'Psicoterapia 💬' : locale === 'en' ? 'Psychotherapy 💬' : 'Psicoterapia 💬'}</option>

                                    <option value="Psicomotricidade">{locale === 'es' ? 'Psicomotricidad 🏃' : locale === 'en' ? 'Psychomotricity 🏃' : 'Psicomotricidade 🏃'}</option>

                                    <option value="Outro">{locale === 'es' ? 'Otro 🧑‍⚕️' : locale === 'en' ? 'Other 🧑‍⚕️' : 'Outro 🧑‍⚕️'}</option>

                                  </select>

                                </div>

                              </div>



                              <div className="grid grid-cols-2 gap-3">

                                <div>

                                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">

                                    {t.dashboard.sessionDate}

                                  </label>

                                  <input 

                                    type="date" 

                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-indigo-500" 

                                    value={editDate}

                                    onChange={(e) => setEditDate(e.target.value)}

                                  />

                                </div>

                                <div className="flex items-end pb-1.5">

                                  <label className="flex items-center gap-2 text-xs font-extrabold text-slate-700 cursor-pointer select-none">

                                    <input 

                                      type="checkbox" 

                                      className="rounded border-slate-350 text-indigo-600 focus:ring-indigo-500 w-4 h-4" 

                                      checked={editStatus === 'completed'}

                                      onChange={(e) => setEditStatus(e.target.checked ? 'completed' : 'pending')}

                                    />

                                    {t.dashboard.sessionRealized}

                                  </label>

                                </div>

                              </div>



                              <div>

                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">

                                  {t.dashboard.guardianObs}

                                </label>

                                <textarea 

                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-indigo-500 h-16 resize-none" 

                                  placeholder={t.dashboard.guardianNotesPlaceholder}

                                  value={editNotes}

                                  onChange={(e) => setEditNotes(e.target.value)}

                                />

                              </div>



                              <div>

                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">

                                  {t.dashboard.clinicianRecommendations}

                                </label>

                                <textarea 

                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-indigo-500 h-16 resize-none" 

                                  placeholder={t.dashboard.clinicianRecommendationsPlaceholder}

                                  value={editFeedback}

                                  onChange={(e) => setEditFeedback(e.target.value)}

                                />

                              </div>



                              <div className="flex gap-2 justify-end mt-2">

                                <button 

                                  onClick={() => { playBubble(); setEditingCheckpointId(null); }}

                                  className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-755 text-xs font-black rounded-xl cursor-pointer active:scale-95 transition-all"

                                >

                                  {t.common.cancel}

                                </button>

                                <button 

                                  onClick={() => handleSaveCheckpoint(cp.id)}

                                  disabled={savingCheckpointId === cp.id}

                                  className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-black rounded-xl cursor-pointer active:scale-95 transition-all shadow-sm disabled:opacity-50"

                                >

                                  {savingCheckpointId === cp.id ? t.dashboard.saving : t.dashboard.saveChanges}

                                </button>

                              </div>

                            </div>

                          ) : (

                            <div className="flex flex-col gap-3">

                              {cp.professionalName ? (

                                <div className="bg-slate-50/50 border border-slate-150 p-3 rounded-xl flex flex-col gap-1.5 shadow-xxs">

                                  <div className="flex items-center justify-between text-xs">

                                    <span className="font-extrabold text-slate-800">🧑‍⚕️ {cp.professionalName}</span>

                                    <span className="text-xxs font-black bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">

                                      {cp.professionalRole === 'Psicologia ABA'

                                        ? (locale === 'es' ? 'Psicología ABA' : locale === 'en' ? 'ABA Psychology' : 'Psicologia ABA')

                                        : cp.professionalRole === 'Terapia Ocupacional'

                                          ? (locale === 'es' ? 'Terapia Ocupacional' : locale === 'en' ? 'Occupational Therapy' : 'Terapia Ocupacional')

                                          : cp.professionalRole === 'Fonoterapia'

                                            ? (locale === 'es' ? 'Fonoaudiología' : locale === 'en' ? 'Speech Therapy' : 'Fonoterapia')

                                            : cp.professionalRole === 'Fisioterapia'

                                              ? (locale === 'es' ? 'Fisioterapia' : locale === 'en' ? 'Physical Therapy' : 'Fisioterapia')

                                              : cp.professionalRole === 'Psicoterapia'

                                                ? (locale === 'es' ? 'Psicoterapia' : locale === 'en' ? 'Psychotherapy' : 'Psicoterapia')

                                                : cp.professionalRole === 'Psicomotricidade'

                                                  ? (locale === 'es' ? 'Psicomotricidad' : locale === 'en' ? 'Psychomotricity' : 'Psicomotricidade')

                                                  : (locale === 'es' ? 'Otro' : locale === 'en' ? 'Other' : cp.professionalRole || 'Outro')}

                                    </span>

                                  </div>

                                  {cp.date && (

                                    <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1">

                                      <span>{locale === 'es' ? '📅 Sesión:' : locale === 'en' ? '📅 Session:' : '📅 Sessão:'}</span> {locale === 'es' ? cp.date.split('-').reverse().join('/') : locale === 'en' ? cp.date.split('-').join('/') : cp.date.split('-').reverse().join('/')}

                                    </div>

                                  )}

                                </div>

                              ) : (

                                <div className="text-slate-400 text-xxs border border-dashed border-slate-200 p-3.5 rounded-xl text-center font-semibold bg-slate-50/20">

                                  {t.dashboard.noSessionsThisWeek}

                                </div>

                              )}



                              {cp.notes && (

                                <div className="flex flex-col gap-0.5">

                                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">

                                    {t.dashboard.guardianObs}

                                  </span>

                                  <p className="text-xs text-slate-650 leading-normal font-medium bg-slate-50/30 p-2.5 rounded-lg border border-slate-150/50 whitespace-pre-wrap">{cp.notes}</p>

                                </div>

                              )}



                              {cp.feedback && (

                                <div className="flex flex-col gap-0.5">

                                  <span className="text-[9px] font-black uppercase tracking-wider text-indigo-400">

                                    {t.dashboard.clinicianRecommendations}

                                  </span>

                                  <p className="text-xs text-indigo-950 leading-normal font-medium bg-indigo-50/20 p-2.5 rounded-lg border border-indigo-100 whitespace-pre-wrap">{cp.feedback}</p>

                                </div>

                              )}



                              <button

                                onClick={() => startEditingCheckpoint(cp)}

                                className="w-full mt-1.5 py-2.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-750 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 text-xs font-black rounded-xl transition-all cursor-pointer shadow-xxs active:scale-98 flex items-center justify-center gap-1 font-Outfit"

                              >

                                {cp.professionalName ? t.dashboard.editRecord : t.dashboard.registerCheckpoint}

                              </button>

                            </div>

                          )}

                        </div>

                      );

                    })}

                  </div>

                )}

              </motion.div>

              ) : (

              

              // CLINICAL REPORTS PANEL

              plan === 'free' ? (

                <motion.div

                  key="reports-locked"

                  initial={{ opacity: 0, y: 10 }}

                  animate={{ opacity: 1, y: 0 }}

                  exit={{ opacity: 0, y: -10 }}

                  className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-md shadow-slate-100 flex flex-col items-center text-center gap-6 relative overflow-hidden"

                >

                  <div className="absolute inset-0 bg-slate-50/40 backdrop-blur-xxs -z-10" />

                  <div className="w-16 h-16 bg-amber-50 border border-amber-100 rounded-3xl flex items-center justify-center text-3xl shadow-sm">

                    📊

                  </div>

                  <div>

                    <h3 className="font-extrabold text-slate-850 text-xl">{t.dashboard.advancedClinicalReportsTitle}</h3>

                    <p className="text-sm text-slate-400 max-w-sm mt-1.5 leading-relaxed font-semibold">

                      {t.dashboard.advancedClinicalReportsDesc}

                    </p>

                  </div>

                  <div className="bg-indigo-50 border border-indigo-150 p-4.5 rounded-2xl text-left max-w-sm flex gap-3 shadow-xxs">

                    <span className="text-xl">✨</span>

                    <p className="text-xs text-indigo-700 leading-relaxed font-bold">

                      {t.dashboard.premiumUnlockDesc}

                    </p>

                  </div>

                  <button

                    onClick={() => { playBubble(); setShowPaywall(true); }}

                    className="px-6 py-3 bg-indigo-650 hover:bg-indigo-700 text-white font-extrabold text-sm rounded-xl shadow-md cursor-pointer transition-all active:scale-95 border-b-2 border-indigo-700/50"

                  >

                    Desbloquear Plano Premium

                  </button>

                </motion.div>

              ) : (

                <motion.div

                  key="reports-panel"

                  initial={{ opacity: 0, y: 10 }}

                  animate={{ opacity: 1, y: 0 }}

                  exit={{ opacity: 0, y: -10 }}

                  className="bg-white border border-slate-200 rounded-[32px] p-6 shadow-md shadow-slate-100 flex flex-col gap-6"

                >

                  <style dangerouslySetInnerHTML={{__html: `

                    @media print {

                      body * {

                        visibility: hidden !important;

                      }

                      #clinical-print-report, #clinical-print-report * {

                        visibility: visible !important;

                      }

                      #clinical-print-report {

                        position: absolute !important;

                        left: 0 !important;

                        top: 0 !important;

                        width: 100% !important;

                        background: white !important;

                      }

                    }

                  `}} />

                  

                  <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4 gap-4">

                    <div>

                      <h3 className="font-extrabold text-slate-850 text-xl">{t.dashboard.evolutionReportTitle}</h3>

                      <p className="text-xs text-slate-400 font-semibold mt-0.5">

                        {t.dashboard.evolutionReportDesc}

                      </p>

                      {/* Clinical Metadata Bar */}

                      {(() => {

                        const currentDayNum = new Date().getDate();

                        return (

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-[11px] text-slate-500 font-bold bg-slate-50 border border-slate-150 px-3 py-1.5 rounded-lg w-fit">

                            <span>{t.dashboard.childLabel} <span className="text-indigo-650 font-black">{activeChild?.name}</span></span>

                            <span className="text-slate-300">|</span>

                            <span>{t.dashboard.diagnosisLabel} <span className="text-slate-700 font-black">{activeChild?.diagnosis || (locale === 'en' ? 'Not informed' : locale === 'es' ? 'No informado' : 'Não informado')}</span></span>

                            <span className="text-slate-300">|</span>

                            <span>{t.dashboard.activeHyperfocusLabel} <span className="text-sky-600 font-black">{activeChild?.childHyperfocus || (locale === 'en' ? 'Not registered' : locale === 'es' ? 'No registrado' : 'Não cadastrado')}</span></span>

                            <span className="text-slate-300">|</span>

                            <span>{t.dashboard.periodLabel} <span className="text-slate-700 font-black">{locale === 'en' ? `Day 1 to ${currentDayNum}` : locale === 'es' ? `Día 1 al ${currentDayNum}` : `Dia 1 ao ${currentDayNum}`}</span></span>

                          </div>

                        );

                      })()}

                    </div>

                    <div className="flex gap-2 items-center flex-wrap self-end md:self-auto">

                      <button

                        onClick={handleExportABAData}

                        className="flex items-center gap-1.5 px-4.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-full shadow-md transition-all cursor-pointer"

                      >

                        📊 Exportar Planilha ABA (CSV)

                      </button>

                      <button

                        onClick={() => { playBubble(); window.print(); }}

                        className="flex items-center gap-1.5 px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-full shadow-md transition-all cursor-pointer"

                      >

                        🖨️ Imprimir / Exportar PDF

                      </button>

                    </div>

                  </div>



                  {/* Clinician Summary cards */}

                  {(() => {

                    const currentDayNum = new Date().getDate();

                    const elapsedDaysList = Array.from({ length: currentDayNum }, (_, i) => String(i + 1));

                    const elapsedTasks = tasks.filter(t => elapsedDaysList.includes(t.day));

                    

                    const totalTasksElapsed = elapsedTasks.length;

                    const completedTasksElapsed = elapsedTasks.filter(t => t.isCompleted).length;

                    

                    const totalTasks = totalTasksElapsed;

                    const completedTasks = completedTasksElapsed;

                    

                    // 1. Taxa de Aderência Real (Acumulada)

                    const rate = totalTasksElapsed > 0 ? Math.round((completedTasksElapsed / totalTasksElapsed) * 100) : 0;

                    

                    // 2. Conformidade Diária Média (Average Activities per Day)

                    const daysWithTasks = Array.from(new Set(elapsedTasks.map(t => t.day)));

                    const numDaysWithTasks = daysWithTasks.length;

                    const avgDailyScheduled = numDaysWithTasks > 0 ? (totalTasksElapsed / numDaysWithTasks) : 0;

                    const avgDailyCompleted = numDaysWithTasks > 0 ? (completedTasksElapsed / numDaysWithTasks) : 0;

                    const avgDailyCompliance = avgDailyScheduled > 0 ? Math.round((avgDailyCompleted / avgDailyScheduled) * 100) : 0;



                    // 3. Adherence Trend (weekly comparison of the elapsed days)

                    const last7DaysList = Array.from({ length: 7 }, (_, i) => String(Math.max(1, currentDayNum - 6 + i)));

                    const last7Tasks = tasks.filter(t => last7DaysList.includes(t.day));

                    const last7Completed = last7Tasks.filter(t => t.isCompleted).length;

                    const last7Total = last7Tasks.length;

                    const last7Rate = last7Total > 0 ? Math.round((last7Completed / last7Total) * 100) : 0;



                    const prev7DaysList = Array.from({ length: 7 }, (_, i) => String(Math.max(1, currentDayNum - 13 + i))).filter(d => Number(d) < currentDayNum - 6);

                    const prev7Tasks = tasks.filter(t => prev7DaysList.includes(t.day));

                    const prev7Completed = prev7Tasks.filter(t => t.isCompleted).length;

                    const prev7Total = prev7Tasks.length;

                    const prev7Rate = prev7Total > 0 ? Math.round((prev7Completed / prev7Total) * 100) : 0;



                    const trend = last7Rate - prev7Rate;

                    const trendText = trend > 0 ? `▲ +${trend}%` : trend < 0 ? `▼ ${trend}%` : (locale === 'en' ? 'Stable' : locale === 'es' ? 'Estable' : 'Estável');

                    const trendColor = trend > 0 ? 'text-emerald-700 bg-emerald-50 border-emerald-100' : trend < 0 ? 'text-amber-700 bg-amber-50 border-amber-100' : 'text-slate-600 bg-slate-50 border-slate-100';



                    // 4. Emotional Stability Indicator

                    const totalLogs = sensoryLogs.length;

                    const regulatedLogs = sensoryLogs.filter(log => log.mood === 'feliz' || log.mood === 'calmo').length;

                    const stabilityRate = totalLogs > 0 ? Math.round((regulatedLogs / totalLogs) * 100) : 100;

                    

                    let stabilityLevel = 'Regular ⚖️';

                    let stabilityClass = 'text-amber-700 bg-amber-50 border-amber-250';

                    let stabilityDesc = locale === 'en' ? 'Moderate mood swings observed.' : locale === 'es' ? 'Oscilaciones moderadas de humor observadas.' : 'Oscilações moderadas de humor observadas.';

                    if (stabilityRate >= 80) {

                      stabilityLevel = locale === 'en' ? 'Excellent 🌟' : locale === 'es' ? 'Excelente 🌟' : 'Excelente 🌟';

                      stabilityClass = 'text-emerald-700 bg-emerald-50 border-emerald-250';

                      stabilityDesc = locale === 'en' ? 'Predominantly calm or happy mood.' : locale === 'es' ? 'Humor predominantemente tranquilo o feliz.' : 'Humor predominantemente calmo ou feliz.';

                    } else if (stabilityRate < 50) {

                      stabilityLevel = locale === 'en' ? 'Attention ⚠️' : locale === 'es' ? 'Atención ⚠️' : 'Atenção ⚠️';

                      stabilityClass = 'text-red-700 bg-red-50 border-red-250';

                      stabilityDesc = locale === 'en' ? 'Frequent episodes of agitation or dysregulation.' : locale === 'es' ? 'Frecuentes episodios de agitación o desregulación.' : 'Frequentes episódios de agitação ou desregulação.';

                    }

                    const stabilityBadgeColor = stabilityRate >= 80 ? 'text-emerald-700 bg-emerald-50 border-emerald-100' : stabilityRate >= 50 ? 'text-amber-700 bg-amber-50 border-amber-100' : 'text-rose-700 bg-rose-50 border-rose-100';



                    // 5. Sensory Crisis Frequency

                    const oneDayMs = 24 * 60 * 60 * 1000;

                    const nowTime = new Date().getTime();

                    const recentCrises = sensoryLogs.filter(log => log.crisisOccurred && (nowTime - new Date(log.timestamp).getTime()) <= 7 * oneDayMs).length;

                    const priorCrises = sensoryLogs.filter(log => log.crisisOccurred && (nowTime - new Date(log.timestamp).getTime()) > 7 * oneDayMs && (nowTime - new Date(log.timestamp).getTime()) <= 14 * oneDayMs).length;

                    const crisisDiff = recentCrises - priorCrises;

                    

                    const crisisTrendText = crisisDiff < 0 ? `▼ ${Math.abs(crisisDiff)}` : crisisDiff > 0 ? `▲ +${crisisDiff}` : (locale === 'en' ? 'Stable' : locale === 'es' ? 'Estable' : 'Estável');

                    const crisisTrendColor = crisisDiff < 0 ? 'text-emerald-700 bg-emerald-50 border-emerald-100' : crisisDiff > 0 ? 'text-rose-700 bg-rose-50 border-rose-100' : 'text-slate-600 bg-slate-50 border-slate-100';



                    // 6. Period Adherence using elapsedTasks

                    const morningTasks = elapsedTasks.filter(t => t.period === 'manhã');

                    const morningComp = morningTasks.length > 0 ? Math.round((morningTasks.filter(t => t.isCompleted).length / morningTasks.length) * 100) : 0;

                    

                    const afternoonTasks = elapsedTasks.filter(t => t.period === 'tarde');

                    const afternoonComp = afternoonTasks.length > 0 ? Math.round((afternoonTasks.filter(t => t.isCompleted).length / afternoonTasks.length) * 100) : 0;

                    

                    const eveningTasks = elapsedTasks.filter(t => t.period === 'noite');

                    const eveningComp = eveningTasks.length > 0 ? Math.round((eveningTasks.filter(t => t.isCompleted).length / eveningTasks.length) * 100) : 0;



                    const complianceBadgeColor = avgDailyCompliance >= 80 ? 'text-emerald-700 bg-emerald-50 border-emerald-100' : avgDailyCompliance >= 50 ? 'text-amber-700 bg-amber-50 border-amber-100' : 'text-rose-700 bg-rose-50 border-rose-100';



                    const riskInfo = getSensoryOverloadRisk();



                    // Helper to get status rating

                    const getRatingText = (val: number) => {

                      if (val >= 80) return locale === 'en' ? 'Stable 🟢' : locale === 'es' ? 'Estable 🟢' : 'Estável 🟢';

                      if (val >= 50) return locale === 'en' ? 'Moderate ⚠️' : locale === 'es' ? 'Moderado ⚠️' : 'Moderado ⚠️';

                      return locale === 'en' ? 'Critical 🚨' : locale === 'es' ? 'Crítico 🚨' : 'Crítico 🚨';

                    };



                    // Generate Dynamic Clinical Insights

                    const generateClinicalInsights = () => {

                      const list = [];

                      if (rate < 80 && rate > 0) {

                        list.push({

                          type: 'warning',

                          title: locale === 'en' ? 'General Adherence Under Attention' : locale === 'es' ? 'Adherencia General bajo Atención' : 'Aderência Geral sob Atenção',

                          text: locale === 'en' 

                            ? 'The routine completion rate is below 80%. To consolidate habits and predictability in children with ASD, we suggest simplifying the routine, reducing the duration of difficult tasks, or increasing the value of tokens.'

                            : locale === 'es'

                            ? 'La tasa de finalización de la rutina está por debajo del 80%. Para consolidar hábitos y previsibilidad en niños con TEA, sugerimos simplificar la rutina, reducir la duración de las tareas difíciles o aumentar el valor de los tokens.'

                            : 'A taxa de conclusão da rotina está abaixo de 80%. Para consolidar hábitos e previsibilidade em crianças com TEA, sugerimos simplificar a rotina, reduzir a duração de tarefas difíceis ou aumentar o valor dos tokens.'

                        });

                      } else if (rate >= 80) {

                        list.push({

                          type: 'success',

                          title: locale === 'en' ? 'Excellent Clinical Adherence' : locale === 'es' ? 'Excelente Adherencia Clínica' : 'Aderência Clínica Excelente',

                          text: locale === 'en'

                            ? 'The child demonstrates high stability and predictability in routines. Continue using immediate positive reinforcement and take the opportunity to keep cognitive rigidity low.'

                            : locale === 'es'

                            ? 'El niño demuestra una alta estabilidad y previsibilidad en las rutinas. Continúe utilizando el refuerzo positivo inmediato y aproveche para mantener baja la rigidez cognitiva.'

                            : 'A criança demonstra alta estabilidade e previsibilidade nas rotinas. Continue utilizando reforço positivo imediato e aproveite para manter a rigidez cognitiva baixa.'

                        });

                      }

                      

                      if (stabilityRate < 60) {

                        list.push({

                          type: 'danger',

                          title: locale === 'en' ? 'Emotional Regulation Alert' : locale === 'es' ? 'Alerta de Regulación Emocional' : 'Alerta de Regulação Emocional',

                          text: locale === 'en'

                            ? 'Frequent mood fluctuations or recent crises detected. We recommend activating the "Sensory Regulation" template in the calendar, reducing academic demands, and taking breaks in the sensory refuge.'

                            : locale === 'es'

                            ? 'Se detectan fluctuaciones de humor frecuentes o crisis recientes. Recomendamos activar la plantilla de "Regulación Sensorial" en el calendario, reducir las demandas académicas y tomar descansos en el refugio sensorial.'

                            : 'Flutuações de humor frequentes ou crises recentes detectadas. Recomendamos ativar o modelo de "Regulação Sensorial" no calendário, reduzir exigências acadêmicas e dar pausas no refúgio sensorial.'

                        });

                      }

                      

                      const minPeriod = Math.min(morningComp, afternoonComp, eveningComp);

                      if (minPeriod === morningComp && morningTasks.length > 0 && morningComp < 70) {

                        list.push({

                          type: 'info',

                          title: locale === 'en' ? 'Focus on Morning Transition' : locale === 'es' ? 'Enfoque en la Transición Matutina' : 'Foco na Transição Matinal',

                          text: locale === 'en'

                            ? 'The morning period shows lower adherence. Try introducing 10 minutes of predictability with a visual warning before starting morning tasks.'

                            : locale === 'es'

                            ? 'El período de la mañana presenta menor adherencia. Intente introducir 10 minutos de previsibilidad con un aviso visual antes de comenzar las tareas matutinas.'

                            : 'O período da manhã apresenta menor aderência. Tente introduzir 10 minutos de previsibilidade com aviso visual antes de iniciar as tarefas matinais.'

                        });

                      } else if (minPeriod === eveningComp && eveningTasks.length > 0 && eveningComp < 70) {

                        list.push({

                          type: 'info',

                          title: locale === 'en' ? 'Night Routine Adjustment' : locale === 'es' ? 'Ajuste de Rutina Nocturna' : 'Ajuste de Rotina Noturna',

                          text: locale === 'en'

                            ? 'Lower adherence identified at night. Try restricting screens and high-arousal activities after 7:30 PM, facilitating natural relaxation for sleep.'

                            : locale === 'es'

                            ? 'Menor adherencia identificada por la noche. Intente restringir las pantallas y las actividades de alta excitación después de las 19:30, facilitando la relajación natural para el sueño.'

                            : 'Menor aderência identificada à noite. Tente restringir telas e atividades de alta excitação após as 19:30, facilitando o relaxamento natural para o sono.'

                        });

                      }



                      const getCat = (t: Task) => t.category || 'AVD';

                      const studyTotal = elapsedTasks.filter(t => getCat(t) === 'Aprendizado').length;

                      const studyDone = elapsedTasks.filter(t => getCat(t) === 'Aprendizado' && t.isCompleted).length;

                      const studyRate = studyTotal > 0 ? Math.round((studyDone / studyTotal) * 100) : 0;

                      

                      if (studyRate > 80 && studyTotal > 0) {

                        list.push({

                          type: 'success',

                          title: locale === 'en' ? 'Excellent Academic Focus' : locale === 'es' ? 'Excelente Enfoque Académico' : 'Excelente Foco Acadêmica',

                          text: locale === 'en'

                            ? 'Very high engagement in cognitive/learning tasks. Great period to introduce new therapeutic concepts.'

                            : locale === 'es'

                            ? 'Compromiso muy alto en tareas cognitivas/de aprendizaje. Excelente período para introducir nuevos conceptos terapéuticos.'

                            : 'Engajamento muito alto em tarefas cognitivas/aprendizado. Ótimo período para introduzir novos conceitos terapêuticos.'

                        });

                      }



                      if (list.length === 0) {

                        list.push({

                          type: 'info',

                          title: locale === 'en' ? 'Clinical Analysis in Progress' : locale === 'es' ? 'Análisis Clínico en Progreso' : 'Análise Clínica em Andamento',

                          text: locale === 'en'

                            ? 'Continue registering activity completion and mood in the behavioral diary. This will allow our predictor to provide more targeted therapeutic suggestions.'

                            : locale === 'es'

                            ? 'Continúe registrando el cumplimiento de las actividades y el estado de ánimo en el diario de comportamiento. Esto permitirá a nuestro predictor proporcionar sugerencias terapéuticas más dirigidas.'

                            : 'Continue registrando o cumprimento das atividades e o humor no diário comportamental. Isso permitirá ao nosso preditor fornecer sugestões terapêuticas mais direcionadas.'

                        });

                      }



                      return list.slice(0, 3);

                    };



                    const clinicalInsights = generateClinicalInsights();



                    return (

                      <>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                          <div className="bg-indigo-50/50 border border-indigo-100/50 p-4.5 rounded-2xl flex flex-col gap-1.5 shadow-xxs hover:shadow-xs transition-all hover:scale-[1.01]">

                            <span className="text-xxs font-black text-indigo-500 uppercase tracking-widest">{locale === 'en' ? 'Accumulated Adherence' : locale === 'es' ? 'Adherencia Acumulada' : 'Aderência Acumulada'}</span>

                            <div className="flex items-baseline gap-2">

                              <span className="text-3xl font-black text-indigo-750">{rate}%</span>

                              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md border ${trendColor} whitespace-nowrap`}>

                                {trendText} {locale === 'en' ? 'vs prev. wk.' : locale === 'es' ? 'vs sem. ant.' : 'vs sem. ant.'}

                              </span>

                            </div>

                            <p className="text-xxs text-slate-400 font-semibold leading-relaxed">{locale === 'en' ? 'Completion of tasks in the elapsed days of the month.' : locale === 'es' ? 'Finalización de tarefas en los días transcurridos del mes.' : 'Conclusão de tarefas nos dias decorridos do mês.'}</p>

                          </div>



                          <div className="bg-amber-55/60 border border-amber-100/50 p-4.5 rounded-2xl flex flex-col gap-1.5 shadow-xxs hover:shadow-xs transition-all hover:scale-[1.01]">

                            <span className="text-xxs font-black text-amber-600 uppercase tracking-widest">{locale === 'en' ? 'Daily Compliance' : locale === 'es' ? 'Conformidad Diaria' : 'Conformidade Diária'}</span>

                            <div className="flex items-baseline gap-2">

                              <span className="text-3xl font-black text-amber-700">{avgDailyCompleted.toFixed(1)} <span className="text-sm font-semibold text-slate-400"> {locale === 'en' ? '/ day' : locale === 'es' ? '/ día' : '/ dia'}</span></span>

                              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md border ${complianceBadgeColor} whitespace-nowrap`}>

                                {avgDailyCompliance}%

                              </span>

                            </div>

                            <p className="text-xxs text-slate-400 font-semibold leading-relaxed">{locale === 'en' ? `Average of ${avgDailyCompleted.toFixed(1)} of ${avgDailyScheduled.toFixed(1)} activities per elapsed day.` : locale === 'es' ? `Promedio de ${avgDailyCompleted.toFixed(1)} de ${avgDailyScheduled.toFixed(1)} actividades por día transcurrido.` : `Média de ${avgDailyCompleted.toFixed(1)} de ${avgDailyScheduled.toFixed(1)} atividades por dia decorrido.`}</p>

                          </div>



                          <div className="bg-teal-50/50 border border-teal-100/50 p-4.5 rounded-2xl flex flex-col gap-1.5 shadow-xxs hover:shadow-xs transition-all hover:scale-[1.01]">

                            <span className="text-xxs font-black text-teal-600 uppercase tracking-widest">{locale === 'en' ? 'Emotional Stability' : locale === 'es' ? 'Estabilidad Emocional' : 'Estabilidade Emocional'}</span>

                            <div className="flex items-baseline gap-2">

                              <span className="text-3xl font-black text-teal-700">{stabilityRate}%</span>

                              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md border ${stabilityBadgeColor} whitespace-nowrap`}>

                                {stabilityLevel}

                              </span>

                            </div>

                            <p className="text-xxs text-slate-400 font-semibold leading-relaxed">{stabilityDesc}</p>

                          </div>



                          <div className="bg-rose-50/50 border border-rose-100/50 p-4.5 rounded-2xl flex flex-col gap-1.5 shadow-xxs hover:shadow-xs transition-all hover:scale-[1.01]">

                            <span className="text-xxs font-black text-rose-600 uppercase tracking-widest">{locale === 'en' ? 'Crisis Frequency' : locale === 'es' ? 'Frecuencia de Crisis' : 'Frequência de Crises'}</span>

                            <div className="flex items-baseline gap-2">

                              <span className="text-3xl font-black text-rose-700">{recentCrises} <span className="text-sm font-semibold text-slate-400">crise{locale === 'en' ? (recentCrises !== 1 ? 'crises' : 'crisis') : locale === 'es' ? 'crisis' : recentCrises !== 1 ? 'crises' : 'crise'}</span></span>

                              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md border ${crisisTrendColor} whitespace-nowrap`}>

                                {crisisTrendText} {locale === 'en' ? 'vs prev. wk.' : locale === 'es' ? 'vs sem. ant.' : 'vs sem. ant.'}

                              </span>

                            </div>

                            <p className="text-xxs text-slate-400 font-semibold leading-relaxed">{locale === 'en' ? 'Occurrences in the last 7 days compared to the previous week.' : locale === 'es' ? 'Ocurrencias en los últimos 7 días comparadas con la semana anterior.' : 'Ocorrências nos últimos 7 dias comparadas à semana anterior.'}</p>

                          </div>

                        </div>



                        {/* Dynamic Clinical Insights Panel */}

                        <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col gap-4 shadow-xxs hover:shadow-xs transition-all">

                          <h4 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1.5 font-Outfit">

                            {locale === 'en' ? '💡 Custom Clinical Recommendations & Insights (ABA / O.T.)' : locale === 'es' ? '💡 Recomendaciones e Insights Clínicos Personalizados (ABA / T.O.)' : '💡 Recomendações e Insights Clínicos Customizados (ABA / T.O.)'}

                          </h4>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">

                            {clinicalInsights.map((insight, idx) => {

                              const icon = insight.type === 'success' ? '✅' : insight.type === 'warning' ? '⚠️' : insight.type === 'danger' ? '🚨' : 'ℹ️';

                              const border = insight.type === 'success' ? 'border-emerald-100 bg-emerald-50/30' : insight.type === 'warning' ? 'border-amber-100 bg-amber-50/30' : insight.type === 'danger' ? 'border-red-100 bg-red-50/30' : 'border-blue-100 bg-blue-50/30';

                              const textTitle = insight.type === 'success' ? 'text-emerald-800' : insight.type === 'warning' ? 'text-amber-800' : insight.type === 'danger' ? 'text-red-800' : 'text-blue-800';

                              

                              return (

                                <div key={idx} className={`p-4 rounded-xl border flex flex-col gap-1.5 transition-all hover:scale-[1.01] ${border}`}>

                                  <div className="flex items-center gap-1.5 font-black text-xs">

                                    <span>{icon}</span>

                                    <span className={textTitle}>{insight.title}</span>

                                  </div>

                                  <p className="text-[11px] font-semibold text-slate-600 leading-relaxed">

                                    {insight.text}

                                  </p>

                                </div>

                              );

                            })}

                          </div>

                        </div>



                        {/* Visual Category Compliance Graph */}

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                          <div className="bg-slate-50 border border-slate-200/50 p-5 rounded-2xl flex flex-col gap-4 shadow-xxs">

                            <h4 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">{locale === 'en' ? 'Adherence by Period of Day' : locale === 'es' ? 'Adherencia por Período de Día' : 'Aderência por Período de Dia'}</h4>

                            <div className="flex flex-col gap-3">

                              <div>

                                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">

                                  <span>{locale === 'en' ? 'Morning ☀️' : locale === 'es' ? 'Mañana ☀️' : 'Manhã ☀️'}</span>

                                  <span>{morningComp}% <span className="text-slate-400 font-semibold">({getRatingText(morningComp).replace(/[^a-zA-Záéíóúâêôãõç\s]/g, '')})</span></span>

                                </div>

                                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">

                                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${morningComp}%` }} />

                                </div>

                              </div>

                              <div>

                                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">

                                  <span>{locale === 'en' ? 'Afternoon ⛅' : locale === 'es' ? 'Tarde ⛅' : 'Tarde ⛅'}</span>

                                  <span>{afternoonComp}% <span className="text-slate-400 font-semibold">({getRatingText(afternoonComp).replace(/[^a-zA-Záéíóúâêôãõç\s]/g, '')})</span></span>

                                </div>

                                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">

                                  <div className="bg-blue-500 h-full rounded-full" style={{ width: `${afternoonComp}%` }} />

                                </div>

                              </div>

                              <div>

                                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">

                                  <span>{locale === 'en' ? 'Night 🌙' : locale === 'es' ? 'Noche 🌙' : 'Noite 🌙'}</span>

                                  <span>{eveningComp}% <span className="text-slate-400 font-semibold">({getRatingText(eveningComp).replace(/[^a-zA-Záéíóúâêôãõç\s]/g, '')})</span></span>

                                </div>

                                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">

                                  <div className="bg-indigo-650 h-full rounded-full" style={{ width: `${eveningComp}%` }} />

                                </div>

                              </div>

                            </div>

                          </div>



                          <div className="bg-slate-50 border border-slate-200/50 p-5 rounded-2xl flex flex-col gap-4 shadow-xxs">

                            <h4 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">{locale === 'en' ? 'Adherence by Activity Domain (ABA)' : locale === 'es' ? 'Adherencia por Dominio de Actividad (ABA)' : 'Aderência por Domínio de Atividade (ABA)'}</h4>

                            <div className="flex flex-col gap-3">

                              {(() => {

                                const getCat = (t: Task) => t.category || 'AVD';

                                const avdTotal = elapsedTasks.filter(t => getCat(t) === 'AVD').length;

                                const avdDone = elapsedTasks.filter(t => getCat(t) === 'AVD' && t.isCompleted).length;

                                const avdRate = avdTotal > 0 ? Math.round((avdDone / avdTotal) * 100) : 0;



                                const studyTotal = elapsedTasks.filter(t => getCat(t) === 'Aprendizado').length;

                                const studyDone = elapsedTasks.filter(t => getCat(t) === 'Aprendizado' && t.isCompleted).length;

                                const studyRate = studyTotal > 0 ? Math.round((studyDone / studyTotal) * 100) : 0;



                                const playTotal = elapsedTasks.filter(t => getCat(t) === 'Lazer').length;

                                const playDone = elapsedTasks.filter(t => getCat(t) === 'Lazer' && t.isCompleted).length;

                                const playRate = playTotal > 0 ? Math.round((playDone / playTotal) * 100) : 0;



                                return (

                                  <>

                                    <div>

                                      <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">

                                        <span>{locale === 'en' ? 'ADL (Daily Life) 🧼' : locale === 'es' ? 'AVD (Vida Diaria) 🧼' : 'AVD (Vida Diária) 🧼'}</span>

                                        <span>{avdRate}% ({avdDone}/{avdTotal}) <span className="text-slate-400 font-semibold">({getRatingText(avdRate).replace(/[^a-zA-Záéíóúâêôãõç\s]/g, '')})</span></span>

                                      </div>

                                      <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">

                                        <div className="bg-teal-500 h-full rounded-full" style={{ width: `${avdRate}%` }} />

                                      </div>

                                    </div>

                                    <div>

                                      <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">

                                        <span>{locale === 'en' ? 'Learning 📚' : locale === 'es' ? 'Aprendizaje 📚' : 'Aprendizado 📚'}</span>

                                        <span>{studyRate}% ({studyDone}/{studyTotal}) <span className="text-slate-400 font-semibold">({getRatingText(studyRate).replace(/[^a-zA-Záéíóúâêôãõç\s]/g, '')})</span></span>

                                      </div>

                                      <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">

                                        <div className="bg-indigo-650 h-full rounded-full" style={{ width: `${studyRate}%` }} />

                                      </div>

                                    </div>

                                    <div>

                                      <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">

                                        <span>{locale === 'en' ? 'Leisure 🧸' : locale === 'es' ? 'Ocio 🧸' : 'Lazer 🧸'}</span>

                                        <span>{playRate}% ({playDone}/{playTotal}) <span className="text-slate-400 font-semibold">({getRatingText(playRate).replace(/[^a-zA-Záéíóúâêôãõç\s]/g, '')})</span></span>

                                      </div>

                                      <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">

                                        <div className="bg-pink-500 h-full rounded-full" style={{ width: `${playRate}%` }} />

                                      </div>

                                    </div>

                                  </>

                                );

                              })()}

                            </div>

                          </div>

                        </div>



                        {/* AI Pattern Analysis and Alerts Panel */}

                        <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col gap-4 shadow-xxs hover:shadow-xs transition-all">

                          <h4 className="font-extrabold text-xs text-indigo-950 uppercase tracking-wider flex items-center gap-1.5 select-none font-Outfit">

                            {locale === 'en' ? '🧠 AI Pattern Report & Alerts' : locale === 'es' ? '🧠 Informe de Patrones y Alertas de IA' : '🧠 Relatório de Padrões e Alertas da IA'}

                          </h4>

                          <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">

                            {locale === 'en' ? 'AI analyzes intersections between completed routines and sensory episodes to predict hidden triggers and suggest customized ABA/O.T. interventions.' : locale === 'es' ? 'La IA analiza cruces entre rutinas cumplidas y episodios sensoriales para predecir desencadenantes ocultos y sugerir sugerencias personalizadas de ABA/T.O.' : 'A IA analisa cruzamentos entre rotinas cumpridas e episódios sensoriais para prever gatilhos ocultos e sugerir intervenções personalizadas de ABA/T.O.'}

                          </p>



                          <div className="flex flex-col gap-3">

                            {getAIPatternAlerts().map((alert, idx) => {

                              const borderClass = 

                                alert.type === 'danger' 

                                  ? 'border-red-150 bg-red-50/40 text-red-950' 

                                  : alert.type === 'warning'

                                  ? 'border-amber-150 bg-amber-50/40 text-amber-955'

                                  : 'border-indigo-150 bg-indigo-50/40 text-indigo-955';

                              

                              const badgeClass =

                                alert.type === 'danger'

                                  ? 'bg-red-500 text-white'

                                  : alert.type === 'warning'

                                  ? 'bg-amber-500 text-white'

                                  : 'bg-indigo-600 text-white';



                              return (

                                <div key={idx} className={`p-4 rounded-xl border flex flex-col gap-2 transition-all hover:scale-[1.01] ${borderClass}`}>

                                  <div className="flex justify-between items-center gap-2">

                                    <div className="flex items-center gap-1.5 font-black text-xs font-Outfit">

                                      <span>{alert.type === 'danger' ? '🚨' : alert.type === 'warning' ? '⚠️' : '💡'}</span>

                                      <span>{alert.title}</span>

                                    </div>

                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${badgeClass}`}>

                                      {alert.percentage}% {locale === 'en' ? 'Correlation' : locale === 'es' ? 'de Correlación' : 'de Correlação'}

                                    </span>

                                  </div>

                                  <div className="flex flex-col gap-1.5 pl-5">

                                    <p className="text-xs font-bold leading-normal text-slate-750">

                                      <span className="font-extrabold text-slate-850">Padrão:</span> {alert.trigger}

                                    </p>

                                    <p className="text-xs font-medium leading-relaxed text-indigo-900 bg-white/60 p-2.5 rounded-lg border border-indigo-100/50">

                                      <span className="font-extrabold text-indigo-950 block mb-0.5 font-Outfit">{locale === 'en' ? 'Clinical Recommendation (ABA/O.T.):' : locale === 'es' ? 'Recomendación Clínica (ABA/T.O.):' : 'Recomendação Clínica (ABA/T.O.):'}</span>

                                      {alert.recommendation}

                                    </p>

                                  </div>

                                </div>

                              );

                            })}

                          </div>

                        </div>



                        {/* AI Sensory Overload Predictor Panel */}

                        <div className="bg-slate-50 border border-slate-200/50 p-5 rounded-2xl flex flex-col gap-4 shadow-xxs">

                          <h4 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1.5 select-none font-Outfit">

                            {locale === 'en' ? '🤖 AI Overload Predictor (Meltdown Risk)' : locale === 'es' ? '🤖 IA Predictora de Sobrecarga (Riesgo de Meltdown)' : '🤖 IA Preditora de Sobrecarga (Risco de Meltdown)'}

                          </h4>

                          

                          <div className={`p-4 rounded-xl border flex flex-col gap-2 ${riskInfo.class}`}>

                            <div className="flex justify-between items-center">

                              <span className="text-xs font-black uppercase text-slate-800">{locale === 'en' ? 'Risk Thermometer:' : locale === 'es' ? 'Termómetro de Riesgo:' : 'Termômetro de Risco:'}</span>

                              <span className="text-sm font-black uppercase tracking-wider">{riskInfo.level}</span>

                            </div>

                            

                            {/* Visual Gauge Bar */}

                            <div className="w-full bg-slate-200/80 rounded-full h-3 overflow-hidden border border-slate-300/30 mt-1">

                              <div 

                                className={`h-full rounded-full transition-all duration-1000 ${

                                  riskInfo.percentage >= 70 ? 'bg-red-500' : riskInfo.percentage >= 35 ? 'bg-amber-500' : 'bg-emerald-500'

                                }`} 

                                style={{ width: `${riskInfo.percentage}%` }}

                              />

                            </div>

                            <span className="text-[10px] text-slate-400 font-semibold text-right block mt-0.5">{locale === 'en' ? 'Probability' : locale === 'es' ? 'Probabilidad' : 'Probabilidade'}: {riskInfo.percentage}%</span>



                            <p className="text-xs font-bold leading-relaxed mt-1 text-slate-700">

                              {riskInfo.desc}

                            </p>

                          </div>

                          <span className="text-[9px] text-slate-450 italic font-semibold">

                            {locale === 'en' ? '*Note: This calculation uses behavioral routine latency data and emotional logs. It does not replace medical consultation.' : locale === 'es' ? '*Note: Este cálculo utiliza datos de latencia de comportamiento y diarios emocionales. No reemplaza una consulta médica.' : '*Nota: Este cálculo utiliza dados comportamentais de latência de rotina e diários emocionais. Não substitui consulta médica.'}

                          </span>



                          {/* Correlation Insights Section */}

                          <div className="border-t border-slate-200/60 pt-4 flex flex-col gap-2">

                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider font-Outfit">{locale === 'en' ? '🔍 Trigger Analysis & Correlations (ABA):' : locale === 'es' ? '🔍 Análisis de Desencadenantes y Correlaciones (ABA):' : '🔍 Análise de Gatilhos & Correlações (ABA):'}</span>

                            <div className="flex flex-col gap-2">

                              {getCorrelationInsights().map((insight, idx) => (

                                <div 

                                  key={idx} 

                                  className={`p-3 rounded-xl border text-xs font-bold leading-relaxed flex items-start gap-2 ${

                                    insight.type === 'danger' 

                                      ? 'bg-red-50 border-red-200 text-red-800' 

                                      : insight.type === 'warning'

                                      ? 'bg-amber-50 border-amber-200 text-amber-805' 

                                      : 'bg-slate-100 border-slate-200 text-slate-700'

                                  }`}

                                >

                                  <span className="text-sm shrink-0">

                                    {insight.type === 'danger' ? '🚨' : insight.type === 'warning' ? '⚠️' : '💡'}

                                  </span>

                                  <span>{insight.text}</span>

                                </div>

                              ))}

                            </div>

                          </div>

                        </div>



                        {/* Sensory Heatmap Card */}

                        <div className="bg-slate-50 border border-slate-200/50 p-5 rounded-2xl flex flex-col gap-4 shadow-xxs">

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

                            <div>

                              <h4 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1.5 select-none font-Outfit">

                                <Map className="w-4 h-4 text-indigo-500" /> Mapa de Calor Sensorial (Gatilhos de Crises)

                              </h4>

                              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">

                                {t.dashboard.overloadRiskDesc}

                              </p>

                            </div>

                            <button

                              type="button"

                              onClick={handleSimulateCrisisGps}

                              disabled={simulatingGps}

                              className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-800 border border-indigo-200 rounded-xl text-xxs font-black transition-all cursor-pointer font-Outfit self-start sm:self-auto flex items-center gap-1 shrink-0"

                            >

                              {simulatingGps ? 'Buscando GPS...' : '📍 Simular Crise com GPS'}

                            </button>

                          </div>

                          

                          <SensoryHeatmap logs={sensoryLogs} />

                        </div>



                        {/* Diário de Regulação & Registro de Crises */}

                        <div className="bg-slate-50 border border-slate-200/50 p-5 rounded-2xl flex flex-col gap-4 shadow-xxs">

                          <h4 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1">

                            🧠 {t.dashboard.overloadRiskTitle}

                          </h4>

                          

                          <form 

                            onSubmit={async (e) => {

                              e.preventDefault();

                              if (!crisisNotes.trim() || !activeChild) return;

                              setSavingCrisis(true);

                              playMarimba(220, 0.35);



                              let latitude: number | undefined = undefined;

                              let longitude: number | undefined = undefined;



                              if (typeof navigator !== 'undefined' && navigator.geolocation) {

                                try {

                                  const position = await new Promise<GeolocationPosition>((resolve, reject) => {

                                    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000, enableHighAccuracy: true });

                                  });

                                  latitude = position.coords.latitude;

                                  longitude = position.coords.longitude;

                                } catch (geoErr) {

                                  console.warn('Geolocation capture failed or denied:', geoErr);

                                }

                              }



                              try {

                                const newLog = await firebaseBridge.db.addSensoryLog({

                                  childId: activeChild.id,

                                  crisisOccurred: true,

                                  notes: crisisNotes.trim(),

                                  decibels: Number(crisisDecibels) || undefined,

                                  lightLevel: crisisLightLevel,

                                  location: crisisLocation,

                                  trigger: crisisTrigger === 'Nenhum' ? undefined : crisisTrigger,

                                  antecedent: crisisAntecedent.trim() || undefined,

                                  behavior: crisisBehavior.trim() || undefined,

                                  consequence: crisisConsequence.trim() || undefined,

                                  latitude,

                                  longitude

                                });



                                setSensoryLogs(prev => [newLog, ...prev]);

                                setCrisisNotes('');

                                setCrisisLocation('Casa');

                                setCrisisLightLevel('Média');

                                setCrisisDecibels(50);

                                setCrisisTrigger('Nenhum');

                                setCrisisAntecedent('');

                                setCrisisBehavior('');

                                setCrisisConsequence('');

                                triggerStatus('Crise sensorial registrada!');

                                

                                await immutableLogger.logChange(

                                  'ADD_TASK',

                                  `Registrou desregulação sensorial para ${activeChild.name}: "${crisisNotes.trim()}"`,

                                  currentUser?.email

                                );

                              } catch (err) {

                                triggerStatus('Erro ao registrar.');

                              } finally {

                                setSavingCrisis(false);

                              }

                            }}

                            className="flex flex-col gap-2 bg-red-50/50 border border-red-100 p-3 rounded-xl"

                          >

                            <label className="text-[10px] font-black text-red-700 uppercase">{t.dashboard.logDysregulationEvent}</label>

                            <textarea

                              value={crisisNotes}

                              onChange={e => setCrisisNotes(e.target.value)}

                              placeholder={t.dashboard.crisisSummaryPlaceholder}

                              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:border-red-400 h-14 resize-none"

                            />



                            <div className="flex flex-col gap-2 mt-1">

                              <div>

                                <label className="block text-[8px] font-black text-slate-500 uppercase mb-0.5 font-Outfit">Antecedente (A) - O que ocorreu logo antes?</label>

                                <input

                                  type="text"

                                  value={crisisAntecedent}

                                  onChange={e => setCrisisAntecedent(e.target.value)}

                                  placeholder={t.dashboard.crisisTriggerPlaceholder}

                                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:border-red-450"

                                />

                              </div>



                              <div>

                                <label className="block text-[8px] font-black text-slate-500 uppercase mb-0.5 font-Outfit">Comportamento (B) - Como reagiu?</label>

                                <input

                                  type="text"

                                  value={crisisBehavior}

                                  onChange={e => setCrisisBehavior(e.target.value)}

                                  placeholder="Ex: Gritou, tampou os ouvidos, chorou"

                                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:border-red-450"

                                />

                              </div>



                              <div>

                                <label className="block text-[8px] font-black text-slate-500 uppercase mb-0.5 font-Outfit">{t.dashboard.crisisConsequenceLabel}</label>

                                <input

                                  type="text"

                                  value={crisisConsequence}

                                  onChange={e => setCrisisConsequence(e.target.value)}

                                  placeholder={t.dashboard.crisisConsequencePlaceholder}

                                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:border-red-450"

                                />

                              </div>

                            </div>

                            

                            <div className="grid grid-cols-2 gap-2 my-1.5">

                              <div>

                                <label className="block text-[8px] font-black text-slate-500 uppercase mb-0.5">{t.dashboard.locationLabel}</label>

                                <select

                                  value={crisisLocation}

                                  onChange={e => setCrisisLocation(e.target.value)}

                                  className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold outline-none cursor-pointer"

                                >

                                  <option value="Casa">Casa 🏠</option>

                                  <option value="Escola">Escola 🏫</option>

                                  <option value="Parque">Parque 🌳</option>

                                  <option value="Consultório">Consultório 🩺</option>

                                  <option value="Outro">Outro 🌐</option>

                                </select>

                              </div>

                              

                              <div>

                                <label className="block text-[8px] font-black text-slate-500 uppercase mb-0.5">Luminosidade</label>

                                <select

                                  value={crisisLightLevel}

                                  onChange={e => setCrisisLightLevel(e.target.value)}

                                  className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold outline-none cursor-pointer"

                                >

                                  <option value="Baixa">Baixa (Escuro) 🌑</option>

                                  <option value="Média">Média (Ideal) ⛅</option>

                                  <option value="Alta">Alta (Luz Forte) ☀️</option>

                                </select>

                              </div>



                              <div>

                                <label className="block text-[8px] font-black text-slate-500 uppercase mb-0.5">{t.dashboard.noiseLevelLabel} {crisisDecibels}dB</label>

                                <div className="flex items-center gap-1">

                                  <input

                                    type="range"

                                    min="30"

                                    max="120"

                                    value={crisisDecibels}

                                    onChange={e => setCrisisDecibels(parseInt(e.target.value))}

                                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-650"

                                  />

                                </div>

                              </div>



                              <div>

                                <label className="block text-[8px] font-black text-slate-500 uppercase mb-0.5">Gatilho Sensorial</label>

                                <select

                                  value={crisisTrigger}

                                  onChange={e => setCrisisTrigger(e.target.value)}

                                  className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold outline-none cursor-pointer"

                                >

                                  <option value="Nenhum">Nenhum / Desconhecido ❓</option>

                                  <option value="Barulho Alto">Barulho Alto 🔊</option>

                                  <option value="Luz Forte">Luz Forte 💡</option>

                                  <option value="Mudança de Rotina">Mudança de Rotina 🌀</option>

                                  <option value="Fadiga">Fadiga / Sono 🛌</option>

                                  <option value="Frustração">Frustração / Limite 😠</option>

                                  <option value="Telas em Excesso">Telas em Excesso 📱</option>

                                </select>

                              </div>

                            </div>

                            <button

                              type="submit"

                              disabled={savingCrisis || !crisisNotes.trim()}

                              className="self-end px-3.5 py-1.5 bg-red-600 hover:bg-red-750 text-white font-extrabold text-[10px] uppercase rounded-lg shadow-xxs cursor-pointer transition-all active:scale-95 disabled:opacity-50"

                            >

                              {savingCrisis ? t.common.loading : t.dashboard.recordInDiary}

                            </button>

                          </form>



                          <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">

                            <span className="text-[9px] font-black text-slate-400 uppercase">{t.dashboard.emotionalDiaryTitle}</span>

                            {sensoryLogs.length === 0 ? (

                              <p className="text-xxs text-slate-400 italic text-center py-2">{t.dashboard.noEmotionalLogs}</p>

                            ) : (

                              sensoryLogs.map(log => {

                                const isSchool = log.loggedBy === 'school';

                                const isChild = log.loggedBy === 'child';

                                const cardBg = log.crisisOccurred 

                                  ? 'bg-red-50/30 border-red-100 text-red-805' 

                                  : isSchool 

                                  ? 'bg-yellow-50/25 border-yellow-200 text-yellow-805' 

                                  : isChild

                                  ? 'bg-emerald-50/20 border-emerald-100 text-emerald-805'

                                  : 'bg-indigo-50/20 border-indigo-100 text-indigo-805';



                                return (

                                  <div key={log.id} className={`p-2.5 rounded-lg border text-xxs flex flex-col gap-1 ${cardBg}`}>

                                    <div className="flex justify-between font-bold text-[9px] text-slate-400">

                                      <span>{new Date(log.timestamp).toLocaleString()}</span>

                                      <span className="font-Outfit uppercase tracking-wider font-black">

                                        {isSchool ? '🏫 ESCOLA' : isChild ? '👶 CRIANÇA' : '👪 RESPONSÁVEL'} - {log.crisisOccurred ? '🚨 CRISE' : `🧠 HUMOR: ${log.mood}`}

                                      </span>

                                    </div>

                                    {log.notes && <p className="font-semibold text-slate-700">{log.notes}</p>}

                                    

                                    {isSchool && (log.foodIntake || log.schoolNoise) && (

                                      <div className="flex gap-2.5 my-1 text-[9px] text-slate-550 font-extrabold bg-white/70 px-2 py-1 rounded border border-slate-150">

                                        {log.foodIntake && (

                                          <span>🍲 Alimentação: {

                                            log.foodIntake === 'boa' ? 'Boa 🟢' : log.foodIntake === 'regular' ? 'Regular 🟡' : 'Recusou 🔴'

                                          }</span>

                                        )}

                                        {log.schoolNoise && (

                                          <span>🔊 Barulho Sala: {

                                            log.schoolNoise === 'baixo' ? 'Baixo 🟢' : log.schoolNoise === 'medio' ? 'Médio 🟡' : 'Alto 🔴'

                                          }</span>

                                        )}

                                      </div>

                                    )}



                                    {(log.antecedent || log.behavior || log.consequence) && (

                                      <div className="bg-slate-100/60 border border-slate-200/40 p-2 rounded-lg mt-1 text-[10px] text-slate-600 font-bold flex flex-col gap-0.5">

                                        {log.antecedent && <div><strong>A (Antecedente):</strong> {log.antecedent}</div>}

                                        {log.behavior && <div><strong>B (Comportamento):</strong> {log.behavior}</div>}

                                        {log.consequence && <div><strong>C (Consequência):</strong> {log.consequence}</div>}

                                      </div>

                                    )}

                                    {(log.location || log.lightLevel || (log.decibels !== undefined && log.decibels !== null) || log.trigger) && (

                                      <div className="flex flex-wrap gap-1.5 mt-1 pt-1.5 border-t border-slate-100/30 text-[9px] text-slate-500 font-bold">

                                        {log.location && <span>📍 {log.location}</span>}

                                        {log.lightLevel && <span>💡 Luz: {log.lightLevel}</span>}

                                        {log.decibels !== undefined && log.decibels !== null && <span>🔊 Som: {log.decibels}dB</span>}

                                        {log.trigger && <span>🎯 Gatilho: {log.trigger}</span>}

                                      </div>

                                    )}

                                  </div>

                                );

                              })

                            )}

                          </div>

                        </div>



                        {/* Clinician Advice card */}

                        <div className="bg-indigo-50 border border-indigo-150 p-4.5 rounded-2xl flex gap-3">

                          <span className="text-xl">👩‍⚕️</span>

                          <p className="text-xs text-indigo-700 leading-relaxed font-bold">

                            * Terapeutas aconselham manter a aderência acima de 80% para garantir uma rotina sólida de regulação sensorial para crianças com TEA.

                          </p>

                        </div>



                        {/* Clean print template hidden on screen */}

                        <div id="clinical-print-report" className="hidden">

                          <div className="p-12 bg-white max-w-4xl mx-auto rounded-3xl flex flex-col gap-6 text-slate-800 text-left">

                            <div className="border-b-4 border-indigo-650 pb-4 flex justify-between items-center">

                              <div>

                                <h1 className="text-3xl font-black text-indigo-650 tracking-tight">{locale === 'en' ? 'TEAcolher - Clinical Report' : locale === 'es' ? 'TEAcolher - Informe Clínico' : 'TEAcolher - Laudo Clínico'}</h1>

                                <p className="text-sm text-slate-500 font-semibold mt-1">SaaS de Predictabilidade de Rotinas no Espectro Autista</p>

                              </div>

                              <div className="text-right">

                                <p className="text-xs font-bold text-slate-450">{locale === 'en' ? 'Generation Date:' : locale === 'es' ? 'Fecha de Generación:' : 'Data de Geração:'}</p>

                                <p className="text-sm font-black text-slate-655">{new Date().toLocaleDateString()}</p>

                              </div>

                            </div>



                            <div className="grid grid-cols-3 gap-8 border-b border-slate-200 pb-6">

                              <div>

                                <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 pb-1.5">{locale === 'en' ? 'General Information' : locale === 'es' ? 'Información General' : 'Informações Gerais'}</h3>

                                <p className="text-xs font-bold text-slate-700 mt-2">{locale === 'en' ? 'Guardian:' : locale === 'es' ? 'Tutor:' : `${t.common.navResponsible}:`} <span className="font-extrabold">{currentUser?.email}</span></p>

                                <p className="text-xs font-bold text-slate-700 mt-1.5">{locale === 'en' ? 'Child:' : locale === 'es' ? 'Niño:' : 'Criança:'} <span className="font-extrabold">{activeChild?.name || (locale === 'en' ? 'Not registered' : locale === 'es' ? 'No registrado' : 'Não cadastrado')}</span></p>

                                <p className="text-xs font-bold text-slate-700 mt-1.5">{locale === 'en' ? 'Active Hyperfocus:' : locale === 'es' ? 'Hiperenfoque Activo:' : 'Hiperfoco Ativo:'} <span className="font-extrabold">{activeChild?.childHyperfocus || (locale === 'en' ? 'Not registered' : locale === 'es' ? 'No registrado' : 'Não cadastrado')}</span></p>

                                <p className="text-xs font-bold text-slate-700 mt-1.5">{locale === 'en' ? 'Diagnosis:' : locale === 'es' ? 'Diagnóstico:' : 'Diagnóstico:'} <span className="font-extrabold">{activeChild?.diagnosis || (locale === 'en' ? 'Not informed' : locale === 'es' ? 'No informado' : 'Não informado')}</span></p>

                              </div>

                              <div>

                                <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 pb-1.5">Resumo Comportamental</h3>

                                <p className="text-xs font-bold text-slate-700 mt-2">{locale === 'en' ? 'Accumulated Adherence:' : locale === 'es' ? 'Adherencia Acumulada:' : 'Aderência Acumulada:'} <span className="font-extrabold text-indigo-750">{rate}% ({getRatingText(rate).replace(/[^a-zA-Záéíóúâêôãõç\s]/g, '').trim()})</span></p>

                                <p className="text-xs font-bold text-slate-700 mt-1.5">{locale === 'en' ? 'Daily Average:' : locale === 'es' ? 'Promedio Diario:' : 'Média Diária:'} <span className="font-extrabold text-amber-700">{avgDailyCompleted.toFixed(1)} de {avgDailyScheduled.toFixed(1)} ativ. ({avgDailyCompliance}%)</span></p>

                                <p className="text-xs font-bold text-slate-700 mt-1.5">{locale === 'en' ? 'Overload Risk (Meltdown):' : locale === 'es' ? 'Riesgo de Sobrecarga (Meltdown):' : 'Risco de Sobrecarga (Meltdown):'} <span className="font-extrabold text-red-700">{riskInfo.level.replace(/[^a-zA-Záéíóúâêôãõç\s]/g, '').trim()} ({riskInfo.percentage}%)</span></p>

                              </div>

                              <div>

                                <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 pb-1.5">{locale === 'en' ? 'Regulation & Mood' : locale === 'es' ? 'Regulación y Humor' : 'Regulação & Humor'}</h3>

                                <p className="text-xs font-bold text-slate-700 mt-2">{locale === 'en' ? 'Emotional Stability:' : locale === 'es' ? 'Estabilidad Emocional:' : 'Estabilidade Emocional:'} <span className="font-extrabold text-teal-700">{stabilityRate}% ({stabilityLevel.replace(/[^a-zA-Záéíóúâêôãõç\s]/g, '').trim()})</span></p>

                                <p className="text-xs font-bold text-slate-700 mt-1.5">Crises Sensoriais (7d): <span className="font-extrabold text-rose-700">{recentCrises} crises ({crisisTrendText.replace(/[^a-zA-Z0-9\+\-\s]/g, '').trim()})</span></p>

                                <p className="text-xs font-bold text-slate-700 mt-1.5">{locale === 'en' ? 'Child Lock:' : locale === 'es' ? 'Bloqueo Infantil:' : 'Barreira Infantil:'} <span className="font-extrabold">{lockType === 'pin' ? 'PIN' : lockType === 'math' ? 'Matemática' : 'Nenhuma'}</span></p>

                              </div>

                            </div>



                            <div className="grid grid-cols-2 gap-8 border-b border-slate-200 pb-4">

                              <div>

                                <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-3">{locale === 'en' ? 'Adherence by Period of Day' : locale === 'es' ? 'Adherencia por Período de Día' : 'Aderência por Período de Dia'}</h3>

                                <div className="flex flex-col gap-2">

                                  <p className="text-xs text-slate-700 font-bold">☀️ {locale === 'en' ? 'Morning Period:' : locale === 'es' ? 'Período de la Mañana:' : 'Período da Manhã:'} <span className="font-extrabold text-indigo-650">{morningComp}% de conclusão ({getRatingText(morningComp).replace(/[^a-zA-Záéíóúâêôãõç\s]/g, '').trim()})</span></p>

                                  <p className="text-xs text-slate-700 font-bold">⛅ {locale === 'en' ? 'Afternoon Period:' : locale === 'es' ? 'Período de la Tarde:' : 'Período da Tarde:'} <span className="font-extrabold text-indigo-650">{afternoonComp}% de conclusão ({getRatingText(afternoonComp).replace(/[^a-zA-Záéíóúâêôãõç\s]/g, '').trim()})</span></p>

                                  <p className="text-xs text-slate-700 font-bold">🌙 {locale === 'en' ? 'Evening Period:' : locale === 'es' ? 'Período de la Noche:' : 'Período da Noite:'} <span className="font-extrabold text-indigo-650">{eveningComp}% de conclusão ({getRatingText(eveningComp).replace(/[^a-zA-Záéíóúâêôãõç\s]/g, '').trim()})</span></p>

                                </div>

                              </div>

                              <div>

                                <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-3">{locale === 'en' ? 'Adherence by Domain (ABA)' : locale === 'es' ? 'Adherencia por Dominio (ABA)' : 'Aderência por Domínio (ABA)'}</h3>

                                <div className="flex flex-col gap-2">

                                  {(() => {

                                    const getCat = (t: Task) => t.category || 'AVD';

                                    const avdTotal = elapsedTasks.filter(t => getCat(t) === 'AVD').length;

                                    const avdDone = elapsedTasks.filter(t => getCat(t) === 'AVD' && t.isCompleted).length;

                                    const avdRate = avdTotal > 0 ? Math.round((avdDone / avdTotal) * 100) : 0;



                                    const studyTotal = elapsedTasks.filter(t => getCat(t) === 'Aprendizado').length;

                                    const studyDone = elapsedTasks.filter(t => getCat(t) === 'Aprendizado' && t.isCompleted).length;

                                    const studyRate = studyTotal > 0 ? Math.round((studyDone / studyTotal) * 100) : 0;



                                    const playTotal = elapsedTasks.filter(t => getCat(t) === 'Lazer').length;

                                    const playDone = elapsedTasks.filter(t => getCat(t) === 'Lazer' && t.isCompleted).length;

                                    const playRate = playTotal > 0 ? Math.round((playDone / playTotal) * 100) : 0;



                                    return (

                                      <>

                                        <p className="text-xs text-slate-700 font-bold">🧼 {locale === 'en' ? 'Daily Life (ADL):' : locale === 'es' ? 'Vida Diaria (AVD):' : 'Vida Diária (AVD):'} <span className="font-extrabold text-indigo-650">{avdRate}% ({avdDone}/{avdTotal}) - {getRatingText(avdRate).replace(/[^a-zA-Záéíóúâêôãõç\s]/g, '').trim()}</span></p>

                                        <p className="text-xs text-slate-700 font-bold">📚 {locale === 'en' ? 'Learning:' : locale === 'es' ? 'Aprendizaje:' : 'Aprendizado:'} <span className="font-extrabold text-indigo-650">{studyRate}% ({studyDone}/{studyTotal}) - {getRatingText(studyRate).replace(/[^a-zA-Záéíóúâêôãõç\s]/g, '').trim()}</span></p>

                                        <p className="text-xs text-slate-700 font-bold">🧸 {locale === 'en' ? 'Leisure and Recreation:' : locale === 'es' ? 'Ocio y Recreación:' : 'Lazer e Recreação:'} <span className="font-extrabold text-indigo-650">{playRate}% ({playDone}/{playTotal}) - {getRatingText(playRate).replace(/[^a-zA-Záéíóúâêôãõç\s]/g, '').trim()}</span></p>

                                      </>

                                    );

                                  })()}

                                </div>

                              </div>

                            </div>



                            {sensoryLogs.filter(log => log.latitude !== undefined && log.longitude !== undefined).length > 0 && (

                              <div className="mt-8 border-t border-slate-100 pt-6">

                                <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-3">Mapa de Calor Sensorial (GPS)</h3>

                                <SensoryHeatmap logs={sensoryLogs} />

                              </div>

                            )}



                            <div className="mt-8 border-t border-slate-100 pt-6">

                              <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">{locale === 'en' ? 'Emotional Diary & Dysregulation Logs' : locale === 'es' ? 'Diario Emocional y Registros de Desregulación' : 'Diário Emocional e Registros de Desregulação'}</h3>

                              <div className="flex flex-col gap-2 mt-3">

                                {sensoryLogs.length === 0 ? (

                                  <p className="text-xs text-slate-400 italic">{locale === 'en' ? 'No clinical logs in this period.' : locale === 'es' ? 'Sin registros clínicos en este período.' : 'Sem registros clínicos neste período.'}</p>

                                ) : (

                                  sensoryLogs.map(log => (

                                    <div key={log.id} className="border-b border-slate-100 pb-2 text-xs">

                                      <span className="font-extrabold text-slate-500">{new Date(log.timestamp).toLocaleString()}</span>

                                      <p className="font-bold text-slate-700 mt-1">

                                        {log.crisisOccurred 

                                          ? `🚨 CRISE SENSORIAL REGISTRADA: ${log.notes || 'Sem observações'}`

                                          : `🧠 REGISTRO DE HUMOR DO USUÁRIO: ${log.mood?.toUpperCase()}`

                                        }

                                      </p>

                                    </div>

                                  ))

                                )}

                              </div>

                            </div>



                            <div className="mt-8 border-t border-slate-100 pt-6">

                              <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">{locale === 'en' ? 'History of Completed Activities' : locale === 'es' ? 'Historial de Actividades Realizadas' : 'Histórico de Atividades Realizadas'}</h3>

                              <div className="flex flex-col gap-1.5 mt-3">

                                {tasks.map(task => (

                                  <div key={task.id} className="flex justify-between border-b border-slate-100 pb-1 text-xs">

                                    <span className="font-bold text-slate-700">{task.day.toUpperCase()} ({task.period}) - {task.time} - {task.title}</span>

                                    <span className={`font-black uppercase tracking-wider ${task.isCompleted ? 'text-emerald-600' : 'text-amber-600'}`}>

                                      {task.isCompleted ? t.dashboard.completedUppercase : t.dashboard.pendingUppercase}

                                    </span>

                                  </div>

                                ))}

                              </div>

                            </div>



                            <div className="mt-16 flex justify-between items-end border-t border-slate-200 pt-12">

                              <div className="text-center w-56 border-t border-slate-400 pt-2 text-xs font-bold text-slate-400">

                                {t.common.navResponsible}

                              </div>

                              <div className="text-center w-56 border-t border-slate-400 pt-2 text-xs font-bold text-slate-400">

                                Assinatura do Profissional / Terapeuta

                              </div>

                            </div>

                          </div>

                        </div>

                      </>

                    );

                  })()}

                </motion.div>

              )

              )
            ) : (
              activeToolsSubTab === 'config' ? (
              <motion.div
                key="tools-panel"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left"
              >
                {/* Profile Card */}
                <div className="flex flex-col gap-6">
                  <div className="flex items-center gap-2 px-1 pt-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{locale === 'en' ? 'Essentials' : locale === 'es' ? 'Esenciales' : 'Essenciais'}</span>
                    <span className="flex-1 h-px bg-slate-200"></span>
                  </div>
                  {/* Child Hyperfocus Profile Card */}

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-premium flex flex-col gap-4">

            <button

              type="button"

              onClick={() => toggleSection('profile')}

              className="w-full flex items-center justify-between text-left cursor-pointer bg-transparent border-none outline-none select-none"

            >

              <div className="flex items-center gap-2.5 text-indigo-600">

                <Sparkles className="w-5 h-5" />

                <h2 className="font-bold text-slate-900 text-lg font-Outfit">{t.dashboard.childProfileTitle}</h2>

              </div>

              <div className="flex items-center gap-2">

                <span className="text-[9px] font-black text-slate-400 uppercase">{t.dashboard.childProfileSubtitle}</span>

                {collapsedSections.profile ? <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />}

              </div>

            </button>



            {!collapsedSections.profile && (

              <motion.div

                initial={{ opacity: 0, height: 0 }}

                animate={{ opacity: 1, height: 'auto' }}

                exit={{ opacity: 0, height: 0 }}

                className="flex flex-col gap-4 border-t border-slate-100 pt-4 w-full"

              >

            

            <form onSubmit={handleSaveProfile} className="flex flex-col gap-3">

              <div>

                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5 font-Outfit">

                  {locale === 'en' ? 'User\'s Main Hyperfocus' : locale === 'es' ? 'Hiperenfoque Principal del Usuario' : 'Hiperfoco Principal do Usuário'}

                </label>

                <select

                  value={hyperfocus}

                  onChange={e => setHyperfocus(e.target.value)}

                  className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-900 outline-none text-sm transition-all shadow-xxs font-bold cursor-pointer focus:ring-2 focus:ring-indigo-200"

                >

                  <option value="Border Collies 🐕">{locale === 'en' ? 'Border Collie Dog 🐶' : locale === 'es' ? 'Perro Border Collie 🐶' : 'Cachorro Border Collie 🐶'}</option>

                  <option value="Dinossauro 🦖">{locale === 'en' ? 'Dinosaur 🦖' : locale === 'es' ? 'Dinosaurio 🦖' : 'Dinossauro 🦖'}</option>

                  <option value="Astronauta / Espaço 🚀">{locale === 'en' ? 'Space / Astronaut 🚀' : locale === 'es' ? 'Espacio / Astronauta 🚀' : 'Espaço / Astronauta 🚀'}</option>

                  <option value="Minecraft / Blocos 🟩">{locale === 'en' ? 'Minecraft / Blocks 🟩' : locale === 'es' ? 'Minecraft / Bloques 🟩' : 'Minecraft / Blocos 🟩'}</option>

                  <option value="Gato 🐱">{locale === 'en' ? 'Cat 🐱' : locale === 'es' ? 'Gato 🐱' : 'Gato 🐱'}</option>

                  <option value="Carro 🚗">{locale === 'en' ? 'Car 🚗' : locale === 'es' ? 'Coche 🚗' : 'Carro 🚗'}</option>

                  <option value="Trem / Locomotiva 🚂">{locale === 'en' ? 'Train / Locomotive 🚂' : locale === 'es' ? 'Tren / Locomotora 🚂' : 'Trem / Locomotiva 🚂'}</option>

                  <option value="Super-herói 🦸">{locale === 'en' ? 'Superhero 🦸' : locale === 'es' ? 'Superhéroe 🦸' : 'Super-herói 🦸'}</option>

                  <option value="Tubarão / Fundo do Mar 🦈">{locale === 'en' ? 'Shark / Undersea 🦈' : locale === 'es' ? 'Tiburón / Fondo del Mar 🦈' : 'Tubarão / Fundo do Mar 🦈'}</option>

                  <option value="Unicórnio 🦄">{locale === 'en' ? 'Unicorn 🦄' : locale === 'es' ? 'Unicornio 🦄' : 'Unicórnio 🦄'}</option>

                  <option value="Robô / Tecnologia 🤖">{locale === 'en' ? 'Robot / Technology 🤖' : locale === 'es' ? 'Robot / Tecnología 🤖' : 'Robô / Tecnologia 🤖'}</option>

                </select>

              </div>



              {/* Emergency First-Then mode toggle */}

              {activeChild && (

                <div className="bg-indigo-50 border border-indigo-100 p-4.5 rounded-2xl flex flex-col gap-3 shadow-xxs">

                  <div className="flex items-center justify-between">

                    <div className="text-left">

                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-900 flex items-center gap-1 select-none font-Outfit">

                        {t.dashboard.firstThenModeTitle}

                      </span>

                      <p className="text-[9.5px] text-slate-500 font-semibold leading-tight mt-0.5">

                        {t.dashboard.firstThenModeDesc}

                      </p>

                    </div>

                    <button

                      type="button"

                      onClick={() => {

                        playBubble();

                        setEmergencyFirstThen(!emergencyFirstThen);

                      }}

                      className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all border-b-2 cursor-pointer ${

                        emergencyFirstThen

                          ? 'bg-indigo-600 border-indigo-950 text-white shadow-sm'

                          : 'bg-slate-200 border-slate-355 text-slate-700'

                      }`}

                    >

                      {emergencyFirstThen ? t.dashboard.activeLabel : t.dashboard.inactiveLabel}

                    </button>

                  </div>

                </div>

              )}



              {/* Token Economy Config */}

              <div className="bg-indigo-50 border-2 border-indigo-200 p-4.5 rounded-2xl flex flex-col gap-3 shadow-xxs">

                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-900 flex items-center gap-1 select-none font-Outfit">

                  {t.dashboard.tokenEconomyTitle}

                </span>

                <div>

                  <label className="block text-xxs font-black text-slate-700 uppercase mb-1 font-Outfit">

                    {t.dashboard.tokenEconomyPrize}

                  </label>

                  <input 

                    type="text" 

                    value={rewardName}

                    onChange={e => setRewardName(e.target.value)}

                    placeholder="Ex: 15 min de tablet"

                    className="w-full px-4 py-2.5 bg-white border-2 border-slate-300 focus:border-indigo-650 rounded-xl text-slate-900 outline-none text-xs font-bold focus:ring-2 focus:ring-indigo-200"

                  />

                </div>

                <div className="grid grid-cols-3 gap-2">

                  <div>

                    <label className="block text-[9px] font-black text-slate-700 uppercase mb-1 font-Outfit truncate">

                      Estrelas Atuais

                    </label>

                    <input 

                      type="number" 

                      min={0}

                      max={100}

                      value={tokens}

                      onChange={e => setTokens(parseInt(e.target.value) || 0)}

                      className="w-full px-2.5 py-2.5 bg-white border-2 border-slate-300 focus:border-indigo-650 rounded-xl text-slate-900 outline-none text-xs font-bold focus:ring-2 focus:ring-indigo-200"

                    />

                  </div>

                  <div>

                    <label className="block text-[9px] font-black text-slate-700 uppercase mb-1 font-Outfit truncate">

                      Meta de Fichas

                    </label>

                    <input 

                      type="number" 

                      min={1}

                      max={50}

                      value={rewardCost}

                      onChange={e => setRewardCost(parseInt(e.target.value) || 10)}

                      className="w-full px-2.5 py-2.5 bg-white border-2 border-slate-300 focus:border-indigo-650 rounded-xl text-slate-900 outline-none text-xs font-bold focus:ring-2 focus:ring-indigo-200"

                    />

                  </div>

                  <div>

                    <label className="block text-[9px] font-black text-slate-700 uppercase mb-1 font-Outfit truncate">

                      Aviso (min)

                    </label>

                    <input 

                      type="number" 

                      min={1}

                      max={30}

                      value={transitionMinutes}

                      onChange={e => setTransitionMinutes(parseInt(e.target.value) || 5)}

                      className="w-full px-2.5 py-2.5 bg-white border-2 border-slate-300 focus:border-indigo-650 rounded-xl text-slate-900 outline-none text-xs font-bold focus:ring-2 focus:ring-indigo-200"

                    />

                  </div>

                </div>

              </div>



              <div>

                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">

                  {t.dashboard.subscriptionTitle}

                </label>

                <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-all shadow-xxs ${
                  plan === 'premium'
                    ? 'bg-gradient-to-r from-amber-50 to-yellow-50/50 border-amber-200 text-amber-900 shadow-amber-50'
                    : 'bg-gradient-to-r from-slate-50 to-pink-50/30 border-slate-200 text-slate-750'
                }`}>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Plano Atual</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black flex items-center gap-1 font-Outfit">
                        {plan === 'premium' ? '👑 Premium Pro' : '🌱 Plano Gratuito (Limitado)'}
                      </span>
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-widest ${
                        plan === 'premium' ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {plan === 'premium' ? 'Ativo' : 'Básico'}
                      </span>
                    </div>
                    <p className="text-[11px] font-medium text-slate-550 leading-relaxed max-w-md mt-1">
                      {plan === 'premium' 
                        ? 'Você tem acesso a tarefas diárias ilimitadas, todos os laudos clínicos em PDF e o painel de análise de padrões da IA.'
                        : 'Acesso básico limitado a 3 tarefas diárias por dia e painéis analíticos bloqueados.'}
                    </p>
                  </div>
                  {plan === 'premium' ? (
                    <button
                      type="button"
                      onClick={async () => {
                        playMarimba(261, 0.3);
                        await firebaseBridge.auth.updateProfileSettings({ plan: 'free' });
                        setPlan('free');
                        triggerStatus(t.dashboard.premiumCancelSuccess);
                      }}
                      className="px-4 py-2.5 bg-white hover:bg-red-50 text-red-500 hover:text-red-700 border border-slate-200 hover:border-red-200 text-xs font-black uppercase rounded-xl transition-all cursor-pointer shadow-xxs shrink-0 self-start sm:self-center font-Outfit active:scale-95"
                    >
                      {locale === 'en' ? 'Cancel Subscription' : locale === 'es' ? 'Cancelar Suscripción' : 'Cancelar Assinatura'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        playBubble();
                        setShowPaywall(true);
                      }}
                      className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white text-xs font-black uppercase rounded-xl transition-all cursor-pointer shadow-md shadow-amber-100 shrink-0 self-start sm:self-center font-Outfit active:scale-95 border-b-2 border-amber-700/30"
                    >
                      {locale === 'en' ? 'Upgrade to Premium 👑' : locale === 'es' ? 'Mejorar a Premium 👑' : 'Assinar Premium 👑'}
                    </button>
                  )}
                </div>

              </div>



              {/* Clinical Sharing Code */}

              <div className="bg-indigo-50 border-2 border-indigo-200 p-4.5 rounded-2xl flex flex-col gap-3 shadow-xxs">

                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-900 flex items-center gap-1 select-none font-Outfit">

                  {t.dashboard.clinicalSharingTitle}

                </span>

                <p className="text-[10px] text-indigo-950 font-semibold leading-tight">

                  {t.dashboard.clinicalSharingDesc}

                </p>

                <div className="flex flex-col gap-2 bg-white border border-slate-200 p-3 rounded-xl">

                  {activeChild?.sharingCode ? (

                    <>

                      <div className="flex items-center justify-between">

                        <span className="text-[10px] font-extrabold text-slate-500 uppercase font-Outfit">{t.dashboard.patientCode}</span>

                        <span className="text-sm font-black text-indigo-650 tracking-wider bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-150 font-Outfit">

                          {activeChild.sharingCode}

                        </span>

                      </div>

                      <div className="flex gap-1.5 w-full mt-1.5 flex-wrap">

                        <button

                          type="button"

                          onClick={() => {

                            navigator.clipboard.writeText(activeChild.sharingCode || '');

                            triggerStatus(t.dashboard.statusCodeCopied);

                          }}

                          className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-black rounded-lg active:scale-95 transition-all cursor-pointer font-Outfit"

                        >

                          {locale === 'en' ? 'Copy Code' : locale === 'es' ? 'Copiar Código' : 'Copiar Código'}

                        </button>

                        <button

                          type="button"

                          onClick={() => {

                            if (typeof window !== 'undefined') {

                              const directLink = `${window.location.origin}/therapist?code=${activeChild.sharingCode}`;

                              navigator.clipboard.writeText(directLink);

                              triggerStatus(t.dashboard.statusLinkCopied);

                            }

                          }}

                          className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-black rounded-lg active:scale-95 transition-all cursor-pointer font-Outfit"

                        >

                          Copiar Link Direto

                        </button>

                        <button

                          type="button"

                          onClick={handleGenerateSharingCode}

                          className="py-1.5 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[9px] font-black rounded-lg active:scale-95 transition-all cursor-pointer border border-slate-300 font-Outfit"

                          title={locale === 'en' ? 'Generate new code' : locale === 'es' ? 'Generar nuevo código' : 'Gerar novo código'}

                        >

                          Renovar

                        </button>

                      </div>

                      <p className="text-[9px] text-slate-500 font-medium leading-normal mt-1 border-t border-slate-100 pt-2 text-left">

                        {locale === 'en' ? (<>💡 **How does the therapist access?** They can go to <Link href="/therapist" className="text-indigo-650 hover:underline font-bold" target="_blank">/therapist</Link> and enter the code, or you can click **"Copy Direct Link"** and send it to them on WhatsApp for instant access!</>) : locale === 'es' ? (<>💡 **¿Cómo accede el terapeuta?** ¡Puede ingresar a <Link href="/therapist" className="text-indigo-650 hover:underline font-bold" target="_blank">/therapist</Link> e ingresar el código, o puede hacer clic en **"Copiar Enlace Directo"** y enviárselo por WhatsApp para acceso instantáneo!</>) : (<>💡 **Como o terapeuta acessa?** Ele pode entrar em <Link href="/therapist" className="text-indigo-650 hover:underline font-bold" target="_blank">/therapist</Link> e digitar o código, ou você pode clicar em **"Copiar Link Direto"** e enviar para ele no WhatsApp para acesso instantâneo!</>)}

                      </p>

                      

                      <div className="mt-2.5 pt-2 border-t border-dashed border-slate-200 flex flex-col gap-2">

                        <span className="text-[10px] font-black text-slate-700 uppercase font-Outfit">{locale === 'en' ? '🏫 School Follow-up (Mediator/Teacher)' : locale === 'es' ? '🏫 Acompañamiento Escolar (Mediador/Profesor)' : '🏫 Acompanhamento Escolar (Mediador/Professor)'}</span>

                        <p className="text-[9px] text-slate-500 font-medium leading-normal">

                          {t.dashboard.schoolSharingDesc}

                        </p>

                        <button

                          type="button"

                          onClick={() => {

                            if (typeof window !== 'undefined') {

                              const schoolLink = `${window.location.origin}/school?code=${activeChild?.sharingCode}`;

                              navigator.clipboard.writeText(schoolLink);

                              triggerStatus(t.dashboard.schoolLinkCopied);

                            }

                          }}

                          className="w-full py-2 bg-yellow-500 hover:bg-yellow-600 text-slate-950 text-[10px] font-black rounded-xl active:scale-95 transition-all cursor-pointer font-Outfit border-none uppercase tracking-wider shadow-sm font-black"

                        >

                          {locale === 'en' ? 'Copy School Link 🏫' : locale === 'es' ? 'Copiar Enlace de la Escuela 🏫' : 'Copiar Link da Escola 🏫'}

                        </button>

                      </div>

                    </>

                  ) : (

                    <button

                      type="button"

                      onClick={handleGenerateSharingCode}

                      className="w-full py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-900 border border-indigo-300 rounded-xl text-xs font-black active:scale-95 transition-all cursor-pointer font-Outfit"

                    >

                      {t.dashboard.generateClinicalCode}

                    </button>

                  )}

                </div>

              </div>



              <button 

                type="submit" 

                disabled={savingProfile}

                className="w-full py-3 bg-indigo-600 hover:bg-indigo-755 text-white text-sm font-black rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer border-b-4 border-indigo-900 font-Outfit"

              >

                {savingProfile ? t.common.loading : (locale === 'en' ? 'Update Profile' : locale === 'es' ? 'Actualizar Perfil' : 'Atualizar Perfil')}

              </button>

            </form>

            <p className="text-xxs text-slate-400 leading-relaxed">

              {locale === 'en' ? '* Hyperfocus helps the child connect with the routine. The mascot will use this term for personalized playful encouragement.' : locale === 'es' ? '* El hiperenfoque ayuda al niño a conectarse con la rutina. La mascota usará este término para incentivos lúdicos personalizados.' : '* O hiperfoco ajuda a criança a se conectar com a rotina. O mascote utilizará este termo para incentivos lúdicos personalizados.'}

            </p>



            <div className="flex flex-col items-center justify-center mt-8 pt-4 border-t border-slate-100 relative">

              {/* Collie Speech Bubble Clinic Tip */}

              <div className="absolute bottom-[138px] w-64 bg-slate-800 text-white p-3 rounded-2xl text-[10px] font-bold leading-relaxed shadow-lg border border-slate-700 pointer-events-none select-none text-center">

                <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-800 border-r border-b border-slate-700 rotate-45"></div>

                💡 {CLINICAL_TIPS[activeTipIdx]}

              </div>



              <div 

                className="cursor-pointer relative p-3 rounded-full border border-slate-100 bg-slate-50/50 hover:bg-white hover:scale-[1.04] active:scale-95 transition-all shadow-premium"

                onClick={() => { handleMiniCollieClick(); rotateTip(); }}

                title={locale === 'en' ? 'Click to rotate clinical tips!' : locale === 'es' ? '¡Haga clic para rotar consejos clínicos!' : 'Clique para rotacionar dicas clínicas!'}

              >

                <div className="absolute inset-0 rounded-full bg-indigo-150 opacity-10 filter blur-sm"></div>

                <HyperfocusMascot hyperfocus={hyperfocus || activeChild?.childHyperfocus || 'Border Collies 🐕'} state={collieState} size={110} />

              </div>

              <span className="text-[9px] font-extrabold text-slate-400 mt-2 tracking-widest uppercase flex items-center gap-1 select-none">

                {mascotLabel.emoji} {mascotLabel.text}

              </span>

            </div>

            </motion.div>

          )}

          </div>
                </div>

                {/* Quick Actions Card */}
                <div className="flex flex-col gap-6">
                  <div className="flex items-center gap-2 px-1 pt-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{locale === 'en' ? 'Advanced' : locale === 'es' ? 'Avanzado' : 'Avançado'}</span>
                    <span className="flex-1 h-px bg-slate-200"></span>
                  </div>
                  {/* Quick Actions Card */}

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-premium">

            <button

              type="button"

              onClick={() => toggleSection('quickActions')}

              className="w-full flex items-center justify-between text-left cursor-pointer bg-transparent border-none outline-none select-none"

            >

              <div className="flex items-center gap-2.5 text-indigo-600">

                <Settings className="w-5 h-5" />

                <h2 className="font-bold text-slate-900 text-sm font-Outfit uppercase tracking-wider">{t.dashboard.quickActionsTitle}</h2>

              </div>

              <div className="flex items-center gap-2">

                <span className="text-[9px] font-black text-slate-400 uppercase">Restaurar / Modelos</span>

                {collapsedSections.quickActions ? <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />}

              </div>

            </button>



            {!collapsedSections.quickActions && (

              <motion.div

                initial={{ opacity: 0, height: 0 }}

                animate={{ opacity: 1, height: 'auto' }}

                exit={{ opacity: 0, height: 0 }}

                className="flex flex-col gap-4 border-t border-slate-100 pt-4 mt-4 w-full"

              >



            <div className="flex flex-col gap-2">

              <button 

                onClick={handleResetToDefaults}

                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-indigo-50 text-slate-800 hover:text-indigo-700 border-2 border-slate-200 hover:border-indigo-300 rounded-xl text-xs font-extrabold transition-all text-left cursor-pointer font-Outfit"

              >

                <span className="flex items-center gap-2">

                  <RotateCcw className="w-4 h-4 text-indigo-500" /> {t.dashboard.restoreClinicalRoutine}

                </span>

                <span>→</span>

              </button>

              <button 

                onClick={() => { playBubble(); setShowClearModal(true); }}

                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-red-50 text-slate-800 hover:text-red-600 border border-slate-100 hover:border-red-100 rounded-xl text-xs font-bold transition-all text-left font-Outfit"

              >

                <span className="flex items-center gap-2">

                  <Trash2 className="w-4 h-4 text-red-400" /> Limpar Toda a Grade

                </span>

                <span>→</span>

              </button>

            </div>



            <div className="mt-4 pt-4 border-t border-slate-150 flex flex-col gap-3">

              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1 select-none">

                {t.dashboard.clinicalTemplatesTitle}

              </span>

              

              {Object.entries(CLINICAL_TEMPLATES).map(([key, tmpl]) => (

                <div key={key} className="bg-slate-100 border-2 border-slate-250 p-3.5 rounded-2xl flex flex-col gap-2 shadow-xxs">

                  <div>

                    <h4 className="font-black text-[12px] text-slate-900 font-Outfit">{tmpl.name}</h4>

                    <p className="text-[10px] text-slate-700 leading-normal mt-0.5 font-semibold">{tmpl.description}</p>

                  </div>

                  <div className="flex gap-2">

                    <button

                      onClick={() => handleLoadTemplate(key as any, 'day')}

                      className="flex-1 py-2 bg-white border-2 border-slate-300 hover:border-indigo-500 hover:text-indigo-700 text-[10px] font-black rounded-lg shadow-xxs cursor-pointer transition-all active:scale-95 text-slate-750 font-Outfit"

                    >

                      Aplicar no Dia

                    </button>

                    <button

                      onClick={() => handleLoadTemplate(key as any, 'month')}

                      className="flex-1 py-2 bg-white border-2 border-slate-300 hover:border-indigo-500 hover:text-indigo-700 text-[10px] font-black rounded-lg shadow-xxs cursor-pointer transition-all active:scale-95 text-slate-750 font-Outfit"

                    >

                      {t.dashboard.applyOnMonth}

                    </button>

                  </div>

                </div>

              ))}

            </div>

            

            <div className="mt-4 bg-slate-50 border border-slate-200/50 p-4 rounded-2xl flex gap-2">

              <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />

              <p className="text-xxs text-slate-500 leading-relaxed">

                {t.dashboard.immutableLogsNotice}

              </p>

            </div>

              </motion.div>

            )}

          </div>
                </div>

                {/* Clinical Support Tools Card */}
                <div className="md:col-span-2 flex flex-col gap-6">
                  {/* Unified Clinical Support Tools & Attachments Card */}

          {activeChild && (

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-premium">

              <button

                type="button"

                onClick={() => {

                  playBubble();

                  setSidebarCollapsedStates(prev => ({ ...prev, tools: !prev.tools }));

                }}

                className="w-full flex items-center justify-between text-left cursor-pointer bg-transparent border-none outline-none select-none"

              >

                <div className="flex items-center gap-2.5 text-indigo-650">

                  <Briefcase className="w-5 h-5 text-indigo-500" />

                  <h2 className="font-bold text-slate-900 text-base font-Outfit">{t.dashboard.clinicalSupportTitle}</h2>

                </div>

                <div className="flex items-center gap-2">

                  <span className="text-[9px] font-black text-slate-400 uppercase">{locale === 'en' ? 'Tools' : locale === 'es' ? 'Herramientas' : 'Ferramentas'}</span>

                  {sidebarCollapsedStates.tools ? <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />}

                </div>

              </button>



              {!sidebarCollapsedStates.tools && (

                <motion.div

                  initial={{ opacity: 0, height: 0 }}

                  animate={{ opacity: 1, height: 'auto' }}

                  exit={{ opacity: 0, height: 0 }}

                  className="flex flex-col gap-4 border-t border-slate-100 pt-4 mt-4 w-full"

                >

                  <label className="block text-[10px] font-black text-slate-500 uppercase">

                    {t.dashboard.selectSupportToolLabel}

                  </label>

                  <select

                    value={activeSidebarTool}

                    onChange={(e) => {

                      playBubble();

                      const val = e.target.value;
                      if (plan === 'free' && (val === 'voice' || val === 'stories')) {
                        playMarimba(180, 0.2);
                        setShowPaywall(true);
                        return;
                      }

                      setActiveSidebarTool(val as any);

                    }}

                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl outline-none focus:border-indigo-500 transition-all cursor-pointer shadow-xxs"

                  >

                    <option value="none">{t.dashboard.toolNone}</option>

                    <option value="aac">{t.dashboard.toolAac}</option>

                    <option value="stories">{t.dashboard.toolStories} {plan === 'free' ? ' 👑' : ''}</option>

                    <option value="dictionary">{t.dashboard.toolDictionary}</option>

                    <option value="voice">{t.dashboard.toolVoice} {plan === 'free' ? ' 👑' : ''}</option>

                  </select>



                  {/* Render voice alert content if active */}

                  {activeSidebarTool === 'voice' && (

                    <div className="flex flex-col gap-4 border-t border-slate-100/60 pt-4 mt-1">

                      <div className="flex items-center gap-2 text-indigo-650">

                        <Mic className="w-4 h-4 text-indigo-500" />

                        <h3 className="font-extrabold text-slate-900 text-xs font-Outfit">{t.dashboard.familyVoiceTitle}</h3>

                      </div>

                      <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">

                        {t.dashboard.familyVoiceDesc}

                      </p>



                      <div className="flex flex-col gap-3">

                        {(['audioAlert10', 'audioAlert5', 'audioAlert2'] as const).map((type) => {

                          const label = type === 'audioAlert10' ? t.dashboard.audioAlert10Label : type === 'audioAlert5' ? t.dashboard.audioAlert5Label : t.dashboard.audioAlert2Label;

                          const hasAudio = !!activeChild[type];

                          const isRecording = recordingType === type;

                          const isPlaying = isPlayingAudio === type;



                          return (

                            <div key={type} className="flex flex-col gap-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-200">

                              <div className="flex items-center justify-between text-xxs font-black text-slate-700">

                                <span>{label}</span>

                                {hasAudio && !isRecording && (

                                  <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-250">{t.dashboard.audioRecordedLabel}</span>

                                )}

                                {!hasAudio && !isRecording && (

                                  <span className="text-[9px] text-slate-400 font-bold">{t.dashboard.audioNotRecordedLabel}</span>

                                )}

                                {isRecording && (

                                  <span className="text-[9px] text-red-600 font-bold animate-pulse flex items-center gap-1">

                                    <span className="w-1.5 h-1.5 rounded-full bg-red-600" />

                                    {locale === 'en' ? 'Recording' : locale === 'es' ? 'Grabando' : 'Gravando'} ({recordingSecondsLeft}s)

                                  </span>

                                )}

                              </div>



                              <div className="flex items-center gap-1.5 mt-1">

                                {isRecording ? (

                                  <button

                                    type="button"

                                    onClick={stopRecording}

                                    className="flex-1 py-1.5 bg-red-600 hover:bg-red-750 text-white rounded-xl text-xxs font-black flex items-center justify-center gap-1 cursor-pointer transition-all"

                                  >

                                    <Square className="w-3.5 h-3.5 fill-current" /> {t.dashboard.stopRecording}

                                  </button>

                                ) : (

                                  <>

                                    <button

                                      type="button"

                                      onClick={() => startRecording(type)}

                                      className="flex-1 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-800 border border-indigo-200 rounded-xl text-xxs font-black flex items-center justify-center gap-1 cursor-pointer transition-all"

                                    >

                                      <Mic className="w-3.5 h-3.5" /> {locale === 'en' ? 'Record 10s' : locale === 'es' ? 'Grabar 10s' : 'Gravar 10s'}

                                    </button>



                                    {hasAudio && (

                                      <>

                                        <button

                                          type="button"

                                          onClick={() => playRecordedAudio(type)}

                                          className={`p-1.5 rounded-xl border flex items-center justify-center cursor-pointer transition-all ${

                                            isPlaying 

                                              ? 'bg-amber-100 border-amber-300 text-amber-850' 

                                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'

                                          }`}

                                          title={t.dashboard.listenRecording}

                                        >

                                          {isPlaying ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}

                                        </button>

                                        <button

                                          type="button"

                                          onClick={() => deleteRecordedAudio(type)}

                                          className="p-1.5 bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 rounded-xl flex items-center justify-center cursor-pointer transition-all"

                                          title={t.dashboard.deleteRecording}

                                        >

                                          <Trash2 className="w-3.5 h-3.5" />

                                        </button>

                                      </>

                                    )}

                                  </>

                                )}

                              </div>

                            </div>

                          );

                        })}

                      </div>

                    </div>

                  )}



                  {/* Render AAC board content if active */}

                  {activeSidebarTool === 'aac' && (

                    <div className="flex flex-col gap-4 border-t border-slate-100/60 pt-4 mt-1">

                      <div className="flex items-center gap-2 text-indigo-655">

                        <MessageSquare className="w-4 h-4 text-indigo-500" />

                        <h3 className="font-extrabold text-slate-900 text-xs font-Outfit">{t.dashboard.customAacTitle}</h3>

                      </div>

                      <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">

                        {t.dashboard.customAacDesc}

                      </p>



                      {/* List of current custom items */}

                      <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto pr-1">

                        {aacItemsList.length === 0 ? (

                          <p className="text-slate-400 text-xxs italic w-full text-center py-4">

                            {t.dashboard.noCustomButtons}

                          </p>

                        ) : (

                          aacItemsList.map((item) => (

                            <div 

                              key={item.id} 

                              className={`px-3 py-2 border rounded-2xl flex items-center justify-between gap-3 text-xxs font-black shadow-xxs ${

                                item.alert 

                                  ? 'bg-rose-50 border-rose-200 text-rose-700' 

                                  : 'bg-indigo-50 border-indigo-150 text-indigo-805'

                              }`}

                            >

                              <span>{item.text}</span>

                              <button

                                type="button"

                                onClick={() => handleDeleteAacItem(item.id)}

                                className="p-0.5 bg-transparent border-none text-slate-400 hover:text-red-655 cursor-pointer"

                                title={locale === 'en' ? 'Remove button' : locale === 'es' ? 'Eliminar botón' : 'Remover botão'}

                              >

                                <Trash2 className="w-3.5 h-3.5" />

                              </button>

                            </div>

                          ))

                        )}

                      </div>



                      {/* Form to add item */}

                      <form onSubmit={handleAddAacItem} className="flex flex-col gap-2.5 border-t border-slate-100 pt-4 mt-2">

                        <span className="text-xxs font-black text-slate-700 uppercase tracking-wider font-Outfit">{t.dashboard.createNewButton}</span>

                        

                        <div className="grid grid-cols-4 gap-2">

                          <div className="col-span-3">

                            <input

                              type="text"

                              placeholder={t.dashboard.buttonTitlePlaceholder}

                              value={newAacText}

                              onChange={e => setNewAacText(e.target.value)}

                              className="w-full px-3 py-2 bg-slate-50 border border-slate-255 rounded-xl text-xxs font-bold outline-none focus:bg-white focus:border-indigo-650"

                              maxLength={20}

                              required

                            />

                          </div>

                          <div className="col-span-1">

                            <select

                              value={newAacEmoji}

                              onChange={e => setNewAacEmoji(e.target.value)}

                              className="w-full px-2 py-2 bg-slate-50 border border-slate-255 rounded-xl text-xxs font-bold outline-none focus:bg-white focus:border-indigo-650 cursor-pointer"

                            >

                              <option value="🤗">🤗</option>

                              <option value="🧸">🧸</option>

                              <option value="🛌">🛌</option>

                              <option value="🥛">🥛</option>

                              <option value="🍎">🍎</option>

                              <option value="🚽">🚽</option>

                              <option value="🎧">🎧</option>

                              <option value="❤️">❤️</option>

                              <option value="🩹">🩹</option>

                              <option value="🦖">🦖</option>

                            </select>

                          </div>

                        </div>



                        <div>

                          <input

                            type="text"

                            placeholder={t.dashboard.buttonSpeechPlaceholder}

                            value={newAacSpeech}

                            onChange={e => setNewAacSpeech(e.target.value)}

                            className="w-full px-3 py-2 bg-slate-50 border border-slate-255 rounded-xl text-xxs font-bold outline-none focus:bg-white focus:border-indigo-650"

                            maxLength={100}

                            required

                          />

                        </div>



                        <div className="flex items-center gap-2">

                          <input

                            type="checkbox"

                            id="aacAlertCheck"

                            checked={newAacAlert}

                            onChange={e => setNewAacAlert(e.target.checked)}

                            className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer"

                          />

                          <label htmlFor="aacAlertCheck" className="text-xxs font-black text-rose-700 cursor-pointer select-none">

                            {t.dashboard.sosButtonAlert}

                          </label>

                        </div>



                        <button

                          type="submit"

                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-755 text-white text-xs font-black rounded-xl border-b-2 border-indigo-900 active:scale-95 transition-all cursor-pointer font-Outfit uppercase tracking-wider"

                        >

                          {t.dashboard.addButton}

                        </button>

                      </form>

                    </div>

                  )}



                  {/* Render social stories content if active */}

                  {activeSidebarTool === 'stories' && (

                    <div className="flex flex-col gap-4 border-t border-slate-100/60 pt-4 mt-1">

                      <div className="flex items-center gap-2 text-indigo-655">

                        <BookOpen className="w-4 h-4 text-indigo-500" />

                        <h3 className="font-extrabold text-slate-900 text-xs font-Outfit">{t.dashboard.aiSocialStoriesTitle}</h3>

                      </div>

                      <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">

                        {t.dashboard.aiSocialStoriesDesc}

                      </p>



                      {/* List of current social stories */}

                      <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto pr-1">

                        {customStoriesList.length === 0 ? (

                          <p className="text-slate-400 text-xxs italic text-center py-4">

                            {t.dashboard.noStories}

                          </p>

                        ) : (

                          customStoriesList.map((story) => (

                            <div key={story.id} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 text-xxs font-semibold">

                              <div className="flex flex-col gap-0.5">

                                <span className="font-bold text-slate-900">{story.title}</span>

                                <span className="text-[10px] text-slate-505 truncate max-w-[200px]">{story.desc}</span>

                              </div>

                              <button

                                type="button"

                                onClick={() => handleDeleteStory(story.id)}

                                className="p-1.5 bg-rose-50 border border-rose-200 text-rose-605 hover:bg-rose-100 rounded-xl flex items-center justify-center cursor-pointer transition-all shrink-0"

                                title={t.dashboard.deleteStory}

                              >

                                <Trash2 className="w-3.5 h-3.5" />

                              </button>

                            </div>

                          ))

                        )}

                      </div>



                      {/* Form to generate via AI */}

                      <form onSubmit={handleGenerateAiStory} className="flex flex-col gap-2.5 border-t border-slate-100 pt-4 mt-2">

                        <span className="text-xxs font-black text-slate-700 uppercase tracking-wider font-Outfit flex items-center gap-1">

                          <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Gerador Assistido por IA

                        </span>



                        {generatingAi ? (

                          <div className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-2xl flex flex-col items-center justify-center text-center gap-3">

                            <div className="w-8 h-8 rounded-full border-4 border-indigo-650 border-t-transparent animate-spin" />

                            <span className="text-xxs font-bold text-indigo-950 font-Outfit tracking-wide">

                              {GENERATOR_STATUSES[aiStatusIdx]}

                            </span>

                          </div>

                        ) : (

                          <>

                            <div>

                              <input

                                type="text"

                                placeholder="Tema da dificuldade (Ex: Ir tomar vacina, Ir ao dentista)"

                                value={aiTheme}

                                onChange={e => setAiTheme(e.target.value)}

                                className="w-full px-3 py-2 bg-slate-50 border border-slate-255 rounded-xl text-xxs font-bold outline-none focus:bg-white focus:border-indigo-650"

                                required

                              />

                            </div>

                            <p className="text-[9px] text-slate-400 leading-normal">

                              {t.dashboard.aiAdaptStoryTip} <strong>{hyperfocus || activeChild.childHyperfocus || 'Border Collies 🐕'}</strong>.

                            </p>

                            <button

                              type="submit"

                              className="w-full py-2 bg-indigo-600 hover:bg-indigo-755 text-white text-xs font-black rounded-xl border-b-2 border-indigo-900 active:scale-95 transition-all cursor-pointer font-Outfit uppercase tracking-wider flex items-center justify-center gap-1"

                            >

                              <Sparkles className="w-3.5 h-3.5" /> {t.dashboard.generateStory}

                            </button>

                          </>

                        )}

                      </form>

                    </div>

                  )}



                  {/* Render behavior dictionary content if active */}

                  {activeSidebarTool === 'dictionary' && (

                    <div className="flex flex-col gap-4 border-t border-slate-100/60 pt-4 mt-1">

                      <div className="flex items-center gap-2 text-indigo-655">

                        <Activity className="w-4 h-4 text-indigo-500" />

                        <h3 className="font-extrabold text-slate-900 text-xs font-Outfit">{t.dashboard.behaviorDictionaryTitle}</h3>

                      </div>

                      <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">

                        {t.dashboard.behaviorDictionaryDesc}

                      </p>



                      {/* List of current signals */}

                      <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-1">

                        {behaviorList.length === 0 ? (

                          <p className="text-slate-400 text-xxs italic text-center py-4">

                            {locale === 'en' ? 'No signal registered yet.' : locale === 'es' ? 'Ninguna señal registrada aún.' : 'Nenhum sinal cadastrado ainda.'}

                          </p>

                        ) : (

                          behaviorList.map((item) => (

                            <div key={item.id} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-1.5 relative group">

                              <button

                                type="button"

                                onClick={() => handleDeleteBehaviorSignal(item.id)}

                                className="absolute top-2.5 right-2.5 p-1 bg-transparent hover:bg-rose-50 text-slate-405 hover:text-red-655 rounded-md border-none cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"

                                title={locale === 'en' ? 'Delete signal' : locale === 'es' ? 'Eliminar señal' : 'Excluir sinal'}

                              >

                                <Trash2 className="w-3.5 h-3.5" />

                              </button>

                              <div className="text-xxs font-black text-indigo-950 font-Outfit pr-6">

                                📢 {locale === 'en' ? 'Signal' : locale === 'es' ? 'Señal' : 'Sinal'}: {item.signal}

                              </div>

                              <div className="text-[10px] text-slate-600 font-semibold leading-tight">

                                <strong>🧠 {locale === 'en' ? 'Meaning' : locale === 'es' ? 'Significado' : 'Significado'}:</strong> {item.meaning}

                              </div>

                              <div className="text-[10px] text-emerald-800 font-semibold bg-emerald-50/60 border border-emerald-150 p-2 rounded-xl mt-1 leading-normal">

                                <strong>👩‍🏫 {locale === 'en' ? 'Action' : locale === 'es' ? 'Conducta' : 'Conduta'}:</strong> {item.intervention}

                              </div>

                            </div>

                          ))

                        )}

                      </div>



                      {/* Add form */}

                      <form onSubmit={handleAddBehaviorSignal} className="flex flex-col gap-2.5 border-t border-slate-100 pt-4 mt-2">

                        <span className="text-xxs font-black text-slate-700 uppercase tracking-wider font-Outfit">{locale === 'en' ? 'Register New Sign' : locale === 'es' ? 'Registrar Nueva Señal' : 'Cadastrar Novo Sinal'}</span>

                        <div>

                          <input

                            type="text"

                            placeholder={t.dashboard.signalPlaceholder}

                            value={newSignal}

                            onChange={e => setNewSignal(e.target.value)}

                            className="w-full px-3 py-2 bg-slate-50 border border-slate-255 rounded-xl text-xxs font-bold outline-none focus:bg-white focus:border-indigo-650"

                            required

                          />

                        </div>

                        <div>

                          <input

                            type="text"

                            placeholder={t.dashboard.meaningPlaceholder}

                            value={newMeaning}

                            onChange={e => setNewMeaning(e.target.value)}

                            className="w-full px-3 py-2 bg-slate-50 border border-slate-255 rounded-xl text-xxs font-bold outline-none focus:bg-white focus:border-indigo-650"

                            required

                          />

                        </div>

                        <div>

                          <input

                            type="text"

                            placeholder={t.dashboard.interventionPlaceholder}

                            value={newIntervention}

                            onChange={e => setNewIntervention(e.target.value)}

                            className="w-full px-3 py-2 bg-slate-50 border border-slate-255 rounded-xl text-xxs font-bold outline-none focus:bg-white focus:border-indigo-650"

                            required

                          />

                        </div>

                        <button

                          type="submit"

                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-755 text-white text-xs font-black rounded-xl border-b-2 border-indigo-900 active:scale-95 transition-all cursor-pointer font-Outfit uppercase tracking-wider"

                        >

                          ➕ {locale === 'en' ? 'Add Sign' : locale === 'es' ? 'Añadir Señal' : 'Adicionar Sinal'}

                        </button>

                      </form>

                    </div>

                  )}

                </motion.div>

              )}

            </div>

          )}
                </div>
              </motion.div>

              ) : (

              

              // IMMUTABLE AUDIT LOGS PANEL

              <motion.div

                key="logs-panel"

                initial={{ opacity: 0, y: 10 }}

                animate={{ opacity: 1, y: 0 }}

                exit={{ opacity: 0, y: -10 }}

                className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md shadow-slate-100"

              >

                <div className="border-b border-slate-100 pb-4 mb-4">

                  <h3 className="font-extrabold text-slate-800 text-lg">{locale === 'en' ? 'Immutable Logs Trail' : locale === 'es' ? 'Sendero de Registros Inmutables' : 'Trilha de Logs Imutáveis'}</h3>

                  <p className="text-xs text-slate-400">

                    {locale === 'en' ? 'Immutable history of all structural schedule modifications (CFR-compliant).' : locale === 'es' ? 'Historial inmutable de todas las modificaciones estructurales de la agenda (conforme a CFR).' : 'Histórico imutável de todas as modificações estruturais da agenda (CFR-compliant).'}

                  </p>

                </div>



                <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-2 divide-y divide-slate-100">

                  {logs.length === 0 ? (

                    <p className="text-slate-400 text-xs text-center py-6">{locale === 'en' ? 'No logs recorded yet.' : locale === 'es' ? 'Ningún registro guardado aún.' : 'Nenhum log registrado ainda.'}</p>

                  ) : (

                    logs.map((log, idx) => (

                      <div key={log.id} className={`pt-3 ${idx === 0 ? '' : 'mt-2'} flex gap-3 text-xs leading-relaxed`}>

                        <div className="shrink-0 font-bold text-slate-400 w-28 bg-slate-50 border border-slate-100 px-2 py-1 rounded text-center h-fit text-[9px] shadow-xxs">

                          {new Date(log.timestamp).toLocaleTimeString()} - {new Date(log.timestamp).toLocaleDateString()}

                        </div>

                        <div className="flex-1">

                          <div className="text-slate-700 font-medium flex flex-wrap items-center gap-2">

                            <span className={`px-2 py-0.5 rounded-full border text-[9px] font-black tracking-wider uppercase ${getLogActionStyle(log.action)} shadow-xxs`}>

                              {log.action}

                            </span>

                            <span>{translateLogDetails(log.details, locale)}</span>

                          </div>

                          <span className="text-[9px] text-slate-400 font-semibold block mt-1">

                            {locale === 'en' ? 'Author:' : locale === 'es' ? 'Autor:' : 'Autor:'} {log.responsibleEmail}

                          </span>

                        </div>

                      </div>

                    ))



                  )}

                </div>

              </motion.div>

              )
            )}
          </AnimatePresence>



        </div>



      </div>



      {/* Sticky Caregiver Toolbar at Bottom Right */}

      {activeChild && (

        <div className="fixed bottom-6 right-6 z-40 flex flex-col sm:flex-row items-center gap-2.5 bg-white/90 backdrop-blur-md border border-slate-200/60 p-2.5 rounded-3xl shadow-xl select-none">

          <button

            onClick={() => {

              playBubble();

              setFormOpen(true);

              const formEl = document.getElementById('add-task-form-anchor');

              if (formEl) {

                formEl.scrollIntoView({ behavior: 'smooth' });

              }

            }}

            className="flex items-center gap-1.5 px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-755 border-b-2 border-indigo-900 text-white text-xs font-black rounded-2xl active:scale-95 transition-all cursor-pointer font-Outfit uppercase tracking-wider"

            title="Criar nova atividade"

          >

            <Plus className="w-4 h-4" /> Criar Atividade

          </button>

          <button

            onClick={() => {

              playBubble();

              window.print();

            }}

            className="flex items-center gap-1.5 px-4.5 py-2.5 bg-emerald-600 hover:bg-emerald-755 border-b-2 border-emerald-900 text-white text-xs font-black rounded-2xl active:scale-95 transition-all cursor-pointer font-Outfit uppercase tracking-wider"

            title={t.dashboard.printPecsCards}

          >

            🖨️ Imprimir PECS

          </button>

          <a

            href={`/routine?childId=${activeChild.id}`}

            target="_blank"

            rel="noopener noreferrer"

            className="flex items-center gap-1.5 px-4.5 py-2.5 bg-amber-500 hover:bg-amber-600 border-b-2 border-amber-700 text-slate-950 text-xs font-black rounded-2xl active:scale-95 transition-all cursor-pointer font-Outfit uppercase tracking-wider"

            title="Ver portal do paciente"

          >

            🚀 Ver Portal

          </a>

          <button

            onClick={() => {

              playBubble();

              window.scrollTo({ top: 0, behavior: 'smooth' });

            }}

            className="w-10 h-10 bg-slate-105 hover:bg-slate-200 border border-slate-250 text-slate-600 rounded-2xl active:scale-95 transition-all cursor-pointer flex items-center justify-center font-black"

            title="Voltar ao Topo"

          >

            ▲

          </button>

        </div>

      )}



      {/* Cadastro de Criança Modal */}

      <AnimatePresence>

        {newChildModalOpen && (

          <motion.div

            initial={{ opacity: 0 }}

            animate={{ opacity: 1 }}

            exit={{ opacity: 0 }}

            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"

          >

            <motion.div

              initial={{ scale: 0.95, y: 15 }}

              animate={{ scale: 1, y: 0 }}

              exit={{ scale: 0.95, y: 15 }}

              className="bg-white border border-slate-200 rounded-[28px] p-8 w-full max-w-md shadow-2xl flex flex-col gap-6 text-slate-800 relative overflow-hidden"

            >

              <div className="flex justify-between items-center">

                <h3 className="text-xl font-black text-indigo-950 tracking-tight">{t.dashboard.registerChildModalTitle}</h3>

                <button

                  onClick={() => { playBubble(); setNewChildModalOpen(false); }}

                  className="text-slate-400 hover:text-slate-600 font-extrabold text-sm p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer border-none bg-transparent"

                >

                  ✕

                </button>

              </div>



              <form onSubmit={handleRegisterChild} className="flex flex-col gap-4">

                <div className="flex flex-col gap-1.5 text-left">

                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{locale === 'en' ? 'Child\'s Name' : locale === 'es' ? 'Nombre del Niño' : 'Nome da Criança'}</label>

                  <input

                    type="text"

                    required

                    placeholder={locale === 'en' ? 'e.g. Johnnie' : locale === 'es' ? 'Ej: Juanito' : 'Ex: Joãozinho'}

                    value={newChildName}

                    onChange={e => setNewChildName(e.target.value)}

                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-850"

                  />

                </div>



                <div className="flex flex-col gap-1.5 text-left">

                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Data de Nascimento</label>

                  <input

                    type="date"

                    value={newChildBirthDate}

                    onChange={e => setNewChildBirthDate(e.target.value)}

                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-850"

                  />

                </div>



                <div className="flex flex-col gap-1.5 text-left">

                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{locale === 'en' ? 'Gender' : locale === 'es' ? 'Género' : 'Gênero'}</label>

                  <select

                    value={newChildGender}

                    onChange={e => setNewChildGender(e.target.value)}

                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-850"

                  >

                    <option value="Não Informado">{locale === 'en' ? 'Not Informed' : locale === 'es' ? 'No Informado' : 'Não Informado'}</option>

                    <option value="Masculino">Masculino</option>

                    <option value="Feminino">Feminino</option>

                    <option value="Outro">Outro</option>

                  </select>

                </div>



                <div className="flex flex-col gap-1.5 text-left">

                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{locale === 'en' ? 'Clinical Diagnosis (optional)' : locale === 'es' ? 'Diagnóstico Clínico (opcional)' : 'Diagnóstico Clínico (opcional)'}</label>

                  <select

                    value={newChildDiagnosis}

                    onChange={e => setNewChildDiagnosis(e.target.value)}

                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-850"

                  >

                    <option value="Não Informado">{t.dashboard.notInformed}</option>

                    <option value="TEA Nível 1">{locale === 'en' ? 'ASD Level 1' : locale === 'es' ? 'TEA Nivel 1' : 'TEA Nível 1'}</option>

                    <option value="TEA Nível 2">{locale === 'en' ? 'ASD Level 2' : locale === 'es' ? 'TEA Nivel 2' : 'TEA Nível 2'}</option>

                    <option value="TEA Nível 3">{locale === 'en' ? 'ASD Level 3' : locale === 'es' ? 'TEA Nivel 3' : 'TEA Nível 3'}</option>

                    <option value="TDAH">TDAH</option>

                    <option value="TEA + TDAH">TEA + TDAH</option>

                    <option value="Outro">Outro</option>

                  </select>

                </div>



                <button

                  type="submit"

                  disabled={registeringChild}

                  className="w-full py-3 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer border-none"

                >

                  {registeringChild ? (

                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>

                  ) : (

                    <>🚀 Cadastrar e Ativar</>

                  )}

                </button>

              </form>

            </motion.div>

          </motion.div>

        )}

      </AnimatePresence>



      {/* SaaS Paywall & Stripe Checkout Modal */}

      <AnimatePresence>

        {showPaywall && (

          <motion.div

            initial={{ opacity: 0 }}

            animate={{ opacity: 1 }}

            exit={{ opacity: 0 }}

            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md"

          >

            <motion.div

              initial={{ scale: 0.95, y: 15 }}

              animate={{ scale: 1, y: 0 }}

              exit={{ scale: 0.95, y: 15 }}

              className="bg-gradient-to-b from-[#1e1b4b] via-[#311042] to-[#11051b] border border-indigo-500/40 rounded-[36px] p-8 w-full max-w-md shadow-2xl flex flex-col items-center text-center gap-6 text-white relative overflow-hidden"

            >

              <div className="absolute top-[-40px] w-64 h-64 bg-indigo-500/20 rounded-full filter blur-3xl -z-10 animate-pulse"></div>



              <div className="w-16 h-16 bg-amber-400 text-indigo-950 rounded-3xl flex items-center justify-center text-3xl shadow-lg shadow-amber-300/20 font-black select-none">

                💎

              </div>



              <div>

                <h3 className="text-2xl font-black text-amber-200 tracking-tight">{t.dashboard.premiumUnlockTitle}</h3>

                <p className="text-xs text-indigo-200 font-semibold mt-1">

                  {locale === 'en' ? 'Unlock the full potential of TEAcolher' : locale === 'es' ? 'Desbloquea el potencial máximo de TEAcolher' : 'Desbloqueie o potencial máximo da TEAcolher'}

                </p>

              </div>



              {/* Benefits list */}

              <div className="flex flex-col gap-3 text-left w-full bg-slate-900/40 border border-slate-700/30 p-5 rounded-2xl shadow-inner">

                <div className="flex gap-2.5 items-start text-xs font-bold text-indigo-100">

                  <span className="text-amber-400 text-sm">✓</span>

                  <span><strong>{locale === 'en' ? 'Unlimited Daily Tasks:' : locale === 'es' ? 'Tareas Diarias Ilimitadas:' : 'Tarefas Diárias Ilimitadas:'}</strong> {locale === 'en' ? 'Create as many routines as you need in your child\'s schedule.' : locale === 'es' ? 'Crea tantas rutinas como necesites en la agenda de tu hijo.' : 'Crie quantas rotinas precisar na agenda do seu filho.'}</span>

                </div>

                <div className="flex gap-2.5 items-start text-xs font-bold text-indigo-100">

                  <span className="text-amber-400 text-sm">✓</span>

                  <span><strong>{locale === 'en' ? 'Clinical Adherence Report:' : locale === 'es' ? 'Informe de Adherencia Clínica:' : 'Relatório de Aderência Clínica:'}</strong> {locale === 'en' ? 'Real-time metrics and professional PDF export for doctors/therapists.' : locale === 'es' ? 'Métricas en tiempo real y exportación profesional en PDF para médicos/terapeutas.' : 'Métricas em tempo real e exportação profissional em PDF para médicos/terapeutas.'}</span>

                </div>

                <div className="flex gap-2.5 items-start text-xs font-bold text-indigo-100">

                  <span className="text-amber-400 text-sm">✓</span>

                  <span><strong>{locale === 'en' ? 'Real-Time Notification Feed:' : locale === 'es' ? 'Feed de Notificaciones en Tiempo Real:' : 'Feed de Notificações em Tempo Real:'}</strong> {locale === 'en' ? 'Immediate alerts on your dashboard when the child completes a mission.' : locale === 'es' ? 'Alertas inmediatas en tu panel cuando el hijo cumple una misión.' : 'Alertas imediatas em seu painel quando o filho cumpre uma missão.'}</span>

                </div>

              </div>



              {/* Price Tag */}

              <div className="text-center">

                <span className="text-xxs uppercase tracking-widest text-indigo-300 font-black">Assinatura Mensal</span>

                <div className="text-4xl font-black text-white mt-0.5">{locale === 'en' ? '$5.90' : locale === 'es' ? '$5.90' : 'R$ 29,90'}<span className="text-sm font-medium text-indigo-300">{locale === 'en' ? '/month' : locale === 'es' ? '/mes' : '/mês'}</span></div>

                <span className="text-[10px] text-slate-400 block mt-1 font-semibold">{locale === 'en' ? '* Free cancellation at any time with a single click.' : locale === 'es' ? '* Cancelación gratuita en cualquier momento con un solo clic.' : '* Cancelamento gratuito a qualquer momento com um único clique.'}</span>

              </div>



              {checkingOut ? (

                <div className="flex flex-col items-center gap-2 py-2">

                  <div className="w-10 h-10 border-4 border-amber-300 border-t-transparent rounded-full animate-spin"></div>

                  <span className="text-xs font-black text-amber-200 animate-pulse mt-2 font-bold">Conectando ao Stripe Checkout...</span>

                </div>

              ) : (

                <div className="flex flex-col gap-3 w-full">

                  <button

                    onClick={async () => {

                      playMarimba(392, 0.1);

                      setCheckingOut(true);

                      

                      try {

                        const response = await fetch('/api/checkout', {

                          method: 'POST',

                          headers: {

                            'Content-Type': 'application/json',

                          },

                          body: JSON.stringify({

                            uid: currentUser?.uid,

                            email: currentUser?.email,

                          }),

                        });

                        

                        if (response.ok) {

                          const data = await response.json();

                          if (data.url) {

                            if (data.url.includes('mock_checkout=true')) {

                              setTimeout(async () => {

                                playMarimba(523.25, 0.12);

                                setTimeout(() => playMarimba(659.25, 0.15), 100);

                                

                                await firebaseBridge.auth.updateProfileSettings({ plan: 'premium' });

                                setPlan('premium');

                                setShowPaywall(false);

                                setCheckingOut(false);

                                triggerStatus(t.dashboard.statusPremiumSimulated);

                              }, 1500);

                            } else {

                              window.location.href = data.url;

                            }

                            return;

                          }

                        }

                        throw new Error('Falha ao conectar com o provedor de cobrança');

                      } catch (err: any) {

                        console.warn("Erro ao iniciar checkout, utilizando simulação local:", err);

                        setTimeout(async () => {

                          playMarimba(523.25, 0.12);

                          setTimeout(() => playMarimba(659.25, 0.15), 100);

                          

                          await firebaseBridge.auth.updateProfileSettings({ plan: 'premium' });

                          setPlan('premium');

                          setShowPaywall(false);

                          setCheckingOut(false);

                          triggerStatus(t.dashboard.statusPremiumSimulatedLocal);

                        }, 1500);

                      }

                    }}

                    className="w-full py-3 bg-gradient-to-r from-amber-450 via-yellow-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-indigo-950 font-black text-sm rounded-xl shadow-lg shadow-amber-300/10 cursor-pointer transition-all active:scale-95 border-b-2 border-amber-700/50"

                  >

                    Confirmar Assinatura Premium 🚀

                  </button>

                  <button

                    onClick={() => {

                      playBubble();

                      setShowPaywall(false);

                    }}

                    className="text-xs font-bold text-slate-450 hover:text-white cursor-pointer bg-transparent border-none"

                  >

                    {locale === 'en' ? 'Back to Free Plan' : locale === 'es' ? 'Volver al Plan Gratis' : 'Voltar ao Plano Grátis'}

                  </button>

                </div>

              )}

            </motion.div>

          </motion.div>

        )}

      </AnimatePresence>



      {/* Modal de Reaplicação Flexível */}

      <AnimatePresence>

        {showReapplyModal && (

          <motion.div

            initial={{ opacity: 0 }}

            animate={{ opacity: 1 }}

            exit={{ opacity: 0 }}

            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"

          >

            <motion.div

              initial={{ scale: 0.95, y: 15 }}

              animate={{ scale: 1, y: 0 }}

              exit={{ scale: 0.95, y: 15 }}

              className="bg-white border border-slate-200 rounded-[28px] p-6 w-full max-w-lg shadow-2xl flex flex-col gap-5 text-slate-800 relative overflow-hidden"

            >

              {/* Header */}

              <div className="flex justify-between items-center">

                <div className="flex items-center gap-2">

                  <span className="text-xl">🔄</span>

                  <h3 className="text-lg font-black text-indigo-955 tracking-tight">

                    {locale === 'en' ? 'Reapply Schedule Template' : locale === 'es' ? 'Reaplicar Modelo de Agenda' : 'Reaplicar Modelo de Agenda'}

                  </h3>

                </div>

                <button

                  onClick={() => { playBubble(); setShowReapplyModal(false); }}

                  className="text-slate-400 hover:text-slate-600 font-extrabold text-sm p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer border-none bg-transparent"

                >

                  ✕

                </button>

              </div>



              {/* Saved Template Type Indicator */}

              {activeChild && activeChild.monthlyTemplate && (() => {

                const savedType = getSavedTemplateType();

                return (

                  <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 flex flex-col gap-1 text-left">

                    <span className="text-[10px] text-indigo-900 font-extrabold uppercase tracking-wide">

                      {locale === 'en' ? 'Currently Saved Template' : locale === 'es' ? 'Modelo Guardado Actualmente' : 'Modelo Salvo Atualmente'}

                    </span>

                    <span className="text-xs font-bold text-slate-700">

                      {locale === 'en'

                        ? `Type: ${savedType === 'day' ? 'Day' : savedType === 'week' ? 'Week' : 'Month'} template`

                        : locale === 'es'

                        ? `Tipo: Modelo de ${savedType === 'day' ? 'día' : savedType === 'week' ? 'semana' : 'mes'}`

                        : `Tipo: Modelo de ${savedType === 'day' ? 'dia' : savedType === 'week' ? 'semana' : 'mês'}`}

                    </span>

                  </div>

                );

              })()}



              {/* Target Month/Period Selector */}

              <div className="flex flex-col gap-2">

                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider text-left">

                  {locale === 'en' ? 'Target Period:' : locale === 'es' ? 'Periodo de Destino:' : 'Período de Destino:'}

                </label>

                <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">

                  {(() => {

                    const MONTH_NAMES: Record<string, string[]> = {

                      pt: [

                        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',

                        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'

                      ],

                      en: [

                        'January', 'February', 'March', 'April', 'May', 'June',

                        'July', 'August', 'September', 'October', 'November', 'December'

                      ],

                      es: [

                        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',

                        'Julio', 'Agosto', 'Septiembre', 'Outubro', 'Novembro', 'Diciembre'

                      ]

                    };

                    const currentMonthName = MONTH_NAMES[locale]?.[activeMonth - 1] || MONTH_NAMES['pt'][activeMonth - 1];

                    const nextMonthIdx = activeMonth === 12 ? 0 : activeMonth;

                    const nextMonthName = MONTH_NAMES[locale]?.[nextMonthIdx] || MONTH_NAMES['pt'][nextMonthIdx];

                    

                    return (

                      <>

                        <button

                          type="button"

                          onClick={() => { playBubble(); setReapplyTargetMonthOffset(0); }}

                          className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${

                            reapplyTargetMonthOffset === 0

                              ? 'bg-white text-indigo-950 shadow-sm font-extrabold'

                              : 'text-slate-500 hover:text-slate-700'

                          }`}

                        >

                          {locale === 'en' ? 'Current Month' : locale === 'es' ? 'Mes Actual' : 'Mês Atual'} ({currentMonthName})

                        </button>

                        <button

                          type="button"

                          onClick={() => { playBubble(); setReapplyTargetMonthOffset(1); }}

                          className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${

                            reapplyTargetMonthOffset === 1

                              ? 'bg-white text-indigo-950 shadow-sm font-extrabold'

                              : 'text-slate-500 hover:text-slate-700'

                          }`}

                        >

                          {locale === 'en' ? 'Next Month' : locale === 'es' ? 'Siguiente Mes' : 'Próximo Mês'} ({nextMonthName})

                        </button>

                      </>

                    );

                  })()}

                </div>

              </div>



              



              {/* Content based on selected type */}

              <div className="flex-1 overflow-y-auto max-h-[250px] pr-1">

                {(() => {

                  const targetM = reapplyTargetMonthOffset === 0 ? activeMonth : (activeMonth === 12 ? 1 : activeMonth + 1);

                  const targetY = reapplyTargetMonthOffset === 0 ? activeYear : (activeMonth === 12 ? activeYear + 1 : activeYear);

                  const numDaysInTargetMonth = new Date(targetY, targetM, 0).getDate();

                  const DAYS_PORTUGUESE = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

                  const WEEKDAY_KEYS = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];

                  

                  const targetMonthDays = Array.from({ length: numDaysInTargetMonth }).map((_, i) => {

                    const dayNum = i + 1;

                    const date = new Date(targetY, targetM - 1, dayNum);

                    const dayOfWeek = DAYS_PORTUGUESE[date.getDay()];

                    return {

                      key: String(dayNum),

                      label: `Dia ${dayNum} (${dayOfWeek}) 📅`,

                      short: `${dayNum}`,

                      weekdayKey: WEEKDAY_KEYS[date.getDay()],

                      weekdayShort: dayOfWeek

                    };

                  });



                  const targetWeeksList = getWeeksOfMonth(targetM, targetY);

                  const numWeeks = targetWeeksList.length;

                  

                  let activeWeekNum = -1;

                  if (reapplyTargetMonthOffset === 0) {

                    const dayNum = parseInt(activeDayFilter || '1', 10);

                    const activeW = targetWeeksList.find(w => dayNum >= w.start && dayNum <= w.end);

                    if (activeW) activeWeekNum = activeW.weekNum;

                  }



                  if (reapplyTargetType === 'month') {

                    return (

                      <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-4 text-left flex gap-3 items-start">

                        <span className="text-xl">⚠️</span>

                        <div className="flex flex-col gap-1 text-slate-700 text-xs">

                          <span className="font-extrabold text-amber-800">

                            {locale === 'en' ? 'Warning' : locale === 'es' ? 'Atención' : 'Atenção'}

                          </span>

                          <span>

                            {locale === 'en'

                              ? `This will copy the saved template to all ${targetMonthDays.length} days of the target month. Existing tasks on all days will be replaced.`

                              : locale === 'es'

                              ? `Esto copiará el modelo guardado en todos los ${targetMonthDays.length} días del mes de destino. Las tareas existentes en todos los días serán reemplazadas.`

                              : `Isso copiará o modelo salvo em todos os ${targetMonthDays.length} dias do mês de destino. Tarefas existentes em todos os dias serão substituídas.`}

                          </span>

                        </div>

                      </div>

                    );

                  }



                  if (reapplyTargetType === 'weeks') {

                    return (

                      <div className="flex flex-col gap-3">

                        {/* Quick actions */}

                        <div className="flex gap-2 text-left">

                          <button

                            type="button"

                            onClick={() => {

                              playBubble();

                              const allWeeks = Array.from({ length: numWeeks }, (_, i) => String(i + 1));

                              setReapplySelectedWeeks(allWeeks);

                            }}

                            className="px-2 py-1 text-[10px] font-black uppercase text-indigo-650 hover:text-indigo-850 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border border-slate-200"

                          >

                            {locale === 'en' ? 'Select All' : locale === 'es' ? 'Seleccionar Todo' : 'Selecionar Tudo'}

                          </button>

                          <button

                            type="button"

                            onClick={() => { playBubble(); setReapplySelectedWeeks([]); }}

                            className="px-2 py-1 text-[10px] font-black uppercase text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border border-slate-200"

                          >

                            {locale === 'en' ? 'Clear' : locale === 'es' ? 'Limpiar' : 'Limpar'}

                          </button>

                          {reapplyTargetMonthOffset === 0 && (

                            <button

                              type="button"

                              onClick={() => {

                                playBubble();

                                const otherWeeks = Array.from({ length: numWeeks }, (_, i) => String(i + 1))

                                  .filter(w => w !== String(activeWeekNum));

                                setReapplySelectedWeeks(otherWeeks);

                              }}

                              className="px-2 py-1 text-[10px] font-black uppercase text-amber-600 hover:text-amber-850 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border border-slate-200"

                            >

                              {locale === 'en' ? 'All other weeks' : locale === 'es' ? 'Todas las demás semanas' : 'Todas as demais semanas'}

                            </button>

                          )}

                        </div>



                        {/* Checkbox List */}

                        <div className="grid grid-cols-1 gap-2 mt-1">

                          {targetWeeksList.map((week) => {

                            const wNum = week.weekNum;

                            const wStr = String(wNum);

                            const start = week.start;

                            const end = week.end;

                            const isActiveWeek = wNum === activeWeekNum;

                            const isChecked = reapplySelectedWeeks.includes(wStr);

                            

                            return (

                              <label

                                key={wNum}

                                className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${

                                  isChecked

                                    ? 'bg-indigo-50/40 border-indigo-200 text-indigo-950 font-bold'

                                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100/50'

                                }`}

                              >

                                <div className="flex items-center gap-3">

                                  <input

                                    type="checkbox"

                                    checked={isChecked}

                                    onChange={() => {

                                      playBubble();

                                      if (isChecked) {

                                        setReapplySelectedWeeks(reapplySelectedWeeks.filter(w => w !== wStr));

                                      } else {

                                        setReapplySelectedWeeks([...reapplySelectedWeeks, wStr]);

                                      }

                                    }}

                                    className="w-4 h-4 rounded text-indigo-650 focus:ring-indigo-500 border-slate-300"

                                  />

                                  <span className="text-xs">

                                    {locale === 'en' ? `Week ${wNum}` : locale === 'es' ? `Semana ${wNum}` : `Semana ${wNum}`}

                                    <span className="text-[10px] text-slate-400 font-medium ml-1.5 font-Outfit">

                                      (Dia {start} ao {end})

                                    </span>

                                  </span>

                                </div>

                                {isActiveWeek && (

                                  <span className="text-[8px] font-black uppercase tracking-wider text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-150">

                                    {locale === 'en' ? 'Active' : locale === 'es' ? 'Activa' : 'Ativa'}

                                  </span>

                                )}

                              </label>

                            );

                          })}

                        </div>

                      </div>

                    );

                  }



                  if (reapplyTargetType === 'days') {

                    return (

                      <div className="flex flex-col gap-3">

                        {/* Quick actions */}

                        <div className="flex gap-2 text-left">

                          <button

                            type="button"

                            onClick={() => {

                              playBubble();

                              const allDays = targetMonthDays.map(d => d.key);

                              setReapplySelectedDays(allDays);

                            }}

                            className="px-2 py-1 text-[10px] font-black uppercase text-indigo-650 hover:text-indigo-850 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border border-slate-200"

                          >

                            {locale === 'en' ? 'Select All' : locale === 'es' ? 'Seleccionar Todo' : 'Selecionar Tudo'}

                          </button>

                          <button

                            type="button"

                            onClick={() => { playBubble(); setReapplySelectedDays([]); }}

                            className="px-2 py-1 text-[10px] font-black uppercase text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border border-slate-200"

                          >

                            {locale === 'en' ? 'Clear' : locale === 'es' ? 'Limpiar' : 'Limpar'}

                          </button>

                          {reapplyTargetMonthOffset === 0 && (

                            <button

                              type="button"

                              onClick={() => {

                                playBubble();

                                const otherDays = targetMonthDays.map(d => d.key).filter(k => k !== activeDayFilter);

                                setReapplySelectedDays(otherDays);

                              }}

                              className="px-2 py-1 text-[10px] font-black uppercase text-amber-600 hover:text-amber-850 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border border-slate-200"

                            >

                              {locale === 'en' ? 'All other days' : locale === 'es' ? 'Todos los demás días' : 'Todos os demais dias'}

                            </button>

                          )}

                        </div>



                        {/* Calendar Grid of Days 1-31 */}

                        <div className="grid grid-cols-7 gap-1.5 mt-1 bg-slate-50 p-3 rounded-2xl border border-slate-200">

                          {targetMonthDays.map(day => {

                            const isChecked = reapplySelectedDays.includes(day.key);

                            const isActiveDay = reapplyTargetMonthOffset === 0 && day.key === activeDayFilter;

                            return (

                              <button

                                key={day.key}

                                type="button"

                                onClick={() => {

                                  playBubble();

                                  if (isChecked) {

                                    setReapplySelectedDays(reapplySelectedDays.filter(k => k !== day.key));

                                  } else {

                                    setReapplySelectedDays([...reapplySelectedDays, day.key]);

                                  }

                                }}

                                className={`h-9 w-full rounded-xl flex flex-col items-center justify-center relative transition-all cursor-pointer ${

                                  isChecked

                                    ? 'bg-indigo-650 text-white font-extrabold shadow-sm'

                                    : 'bg-white hover:bg-indigo-50 border border-slate-200 text-slate-700 hover:text-indigo-950 hover:border-indigo-250 font-bold'

                                }`}

                              >

                                <span className="text-[11px] font-Outfit">{day.short}</span>

                                <span className="text-[7px] uppercase tracking-tighter opacity-80 font-Outfit">{day.weekdayShort}</span>

                                {isActiveDay && (

                                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-500 border border-white rounded-full"></span>

                                )}

                              </button>

                            );

                          })}

                        </div>

                      </div>

                    );

                  }



                  return null;

                })()}

              </div>



              {/* Confirm / Cancel Buttons */}

              <div className="flex gap-3 pt-3 border-t border-slate-100">

                <button

                  type="button"

                  onClick={() => { playBubble(); setShowReapplyModal(false); }}

                  className="flex-1 py-3 bg-white hover:bg-slate-50 text-slate-550 hover:text-slate-700 font-extrabold text-xs rounded-xl border border-slate-250 active:scale-95 transition-all cursor-pointer uppercase tracking-wider font-Outfit"

                >

                  {locale === 'en' ? 'Cancel' : locale === 'es' ? 'Cancelar' : 'Cancelar'}

                </button>

                <button

                  type="button"

                  onClick={() => { playMarimba(523.25, 0.12); handleExecuteReapply(); }}

                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-755 text-white font-black text-xs rounded-xl border-b-2 border-indigo-900 active:scale-95 transition-all cursor-pointer uppercase tracking-wider font-Outfit shadow-md shadow-indigo-200"

                >

                  {locale === 'en' ? 'Reapply Template 🚀' : locale === 'es' ? 'Reaplicar Modelo 🚀' : 'Reaplicar Modelo 🚀'}

                </button>

              </div>

            </motion.div>

          </motion.div>

        )}

      </AnimatePresence>



      {/* Modal de Limpeza de Grade */}

      <AnimatePresence>

        {showClearModal && (

          <motion.div

            initial={{ opacity: 0 }}

            animate={{ opacity: 1 }}

            exit={{ opacity: 0 }}

            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"

          >

            <motion.div

              initial={{ scale: 0.95, y: 15 }}

              animate={{ scale: 1, y: 0 }}

              exit={{ scale: 0.95, y: 15 }}

              className="bg-white border border-slate-200 rounded-[28px] p-6 w-full max-w-md shadow-2xl flex flex-col gap-5 text-slate-800 relative overflow-hidden"

            >

              {/* Header */}

              <div className="flex justify-between items-center">

                <div className="flex items-center gap-2">

                  <span className="text-xl">🗑️</span>

                  <h3 className="text-lg font-black text-indigo-955 tracking-tight font-Outfit">

                    {locale === 'en' ? 'Clear Schedule Grid' : locale === 'es' ? 'Limpiar Grilla de Agenda' : 'Limpar Grade da Agenda'}

                  </h3>

                </div>

                <button

                  type="button"

                  onClick={() => { playBubble(); setShowClearModal(false); }}

                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors border-none cursor-pointer"

                >

                  ✕

                </button>

              </div>



              {/* Description */}

              <p className="text-xs text-slate-550 leading-relaxed font-semibold text-left">

                {locale === 'en'

                  ? 'Select which period scope you would like to clear. This will delete all tasks within the chosen scope.'

                  : locale === 'es'

                  ? 'Seleccione el alcance del período que desea limpiar. Esto eliminará todas las tareas dentro del alcance elegido.'

                  : 'Selecione qual escopo de período você deseja limpar. Isso apagará todas as tarefas contidas no escopo escolhido.'}

              </p>



              {/* Options Grid */}

              <div className="flex flex-col gap-3">

                {/* 1. Day Scope */}

                <button

                  type="button"

                  onClick={() => handleClearGrid('day')}

                  className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-red-50/50 border border-slate-200 hover:border-red-200 rounded-2xl text-left transition-all cursor-pointer group"

                >

                  <div className="flex flex-col gap-0.5">

                    <span className="text-xs font-black text-slate-800 group-hover:text-red-750 font-Outfit">

                      {locale === 'en' ? 'Clear Selected Day Only' : locale === 'es' ? 'Limpiar Solo el Día Seleccionado' : 'Limpar Apenas o Dia Selecionado'}

                    </span>

                    <span className="text-[10px] text-slate-400 font-bold">

                      {locale === 'en' ? `Delete tasks for Day ${activeDayFilter} only` : locale === 'es' ? `Eliminar tareas solo para el Día ${activeDayFilter}` : `Apagar tarefas apenas do Dia ${activeDayFilter}`}

                    </span>

                  </div>

                  <span className="text-lg text-slate-400 group-hover:text-red-500 transition-colors">➔</span>

                </button>



                {/* 2. Week Scope */}

                <button

                  type="button"

                  onClick={() => handleClearGrid('week')}

                  className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-red-50/50 border border-slate-200 hover:border-red-200 rounded-2xl text-left transition-all cursor-pointer group"

                >

                  <div className="flex flex-col gap-0.5">

                    <span className="text-xs font-black text-slate-800 group-hover:text-red-750 font-Outfit">

                      {locale === 'en' ? 'Clear Selected Week Only' : locale === 'es' ? 'Limpiar Solo la Semana Seleccionada' : 'Limpar Apenas a Semana Selecionada'}

                    </span>

                    <span className="text-[10px] text-slate-400 font-bold">

                      {(() => {

                        const activeWeekNum = Math.floor((parseInt(activeDayFilter || '1', 10) - 1) / 7) + 1;

                        return locale === 'en' ? `Delete tasks for Week ${activeWeekNum} only` : locale === 'es' ? `Eliminar tareas solo para la Semana ${activeWeekNum}` : `Apagar tarefas apenas da Semana ${activeWeekNum}`;

                      })()}

                    </span>

                  </div>

                  <span className="text-lg text-slate-400 group-hover:text-red-500 transition-colors">➔</span>

                </button>



                {/* 3. Month Scope */}

                <button

                  type="button"

                  onClick={() => handleClearGrid('month')}

                  className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-red-50/50 border border-slate-200 hover:border-red-200 rounded-2xl text-left transition-all cursor-pointer group"

                >

                  <div className="flex flex-col gap-0.5">

                    <span className="text-xs font-black text-slate-800 group-hover:text-red-750 font-Outfit">

                      {locale === 'en' ? 'Clear Entire Month' : locale === 'es' ? 'Limpiar Todo el Mes' : 'Limpar Todo o Mês'}

                    </span>

                    <span className="text-[10px] text-slate-400 font-bold">

                      {(() => {

                        const MONTH_NAMES: Record<string, string[]> = {

                          pt: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],

                          en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],

                          es: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

                        };

                        const monthName = MONTH_NAMES[locale]?.[activeMonth - 1] || MONTH_NAMES['pt'][activeMonth - 1];

                        return locale === 'en' ? `Delete all tasks for ${monthName} ${activeYear}` : locale === 'es' ? `Eliminar todas las tareas de ${monthName} ${activeYear}` : `Apagar todas as tarefas de ${monthName} ${activeYear}`;

                      })()}

                    </span>

                  </div>

                  <span className="text-lg text-slate-400 group-hover:text-red-500 transition-colors">➔</span>

                </button>

              </div>



              {/* Close Button */}

              <button

                type="button"

                onClick={() => { playBubble(); setShowClearModal(false); }}

                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-650 hover:text-slate-800 font-extrabold text-xs rounded-xl active:scale-95 transition-all cursor-pointer uppercase tracking-wider font-Outfit border-none mt-2"

              >

                {locale === 'en' ? 'Cancel' : locale === 'es' ? 'Cancelar' : 'Cancelar'}

              </button>

            </motion.div>

          </motion.div>

        )}

      </AnimatePresence>



      {/* PECS Printable Grid */}

      <div className="print-only">

        <div className="text-center mb-8">

          <h1 className="text-3xl font-black text-[#0f172a] font-Outfit">{locale === 'en' ? 'PECS Routine Cards' : locale === 'es' ? 'Tarjetas de Rutina PECS' : 'Cartões de Rotina PECS'}</h1>

          <p className="text-sm text-slate-500 font-bold mt-1">{locale === 'en' ? `Routine of \${activeChild?.name || \'your child\'}` : locale === 'es' ? `Rutina de \${activeChild?.name || \'tu hijo\'}` : `Rotina de \${activeChild?.name || \'seu filho\'}`}</p>

        </div>

        <div className="pecs-print-grid">

          {tasks.map(task => (

            <div key={task.id} className="pecs-card">

              <span className="pecs-card-icon">{task.icon || '📅'}</span>

              <h3 className="pecs-card-title">{task.title}</h3>

              <p className="text-xs text-slate-500 font-bold mt-1.5">{locale === 'en' ? 'Time:' : locale === 'es' ? 'Horario:' : 'Horário:'} {task.time}</p>

            </div>

          ))}

        </div>

      </div>

    </main>

  </div>

  );

}



export default function ParentDashboard() {

  const { locale } = useLanguage();

  return (

    <Suspense fallback={

      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f172a] text-white gap-3">

        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>

        <span className="text-xs font-bold text-slate-300 animate-pulse">{locale === 'en' ? 'Loading panel...' : locale === 'es' ? 'Cargando panel...' : 'Carregando painel...'}</span>

      </div>

    }>

      <ParentDashboardContent />

    </Suspense>

  );

}

