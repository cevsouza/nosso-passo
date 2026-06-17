"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { firebaseBridge, Task, UserProfile, getOfflineQueue } from '../../../lib/firebase-bridge';
import { immutableLogger, AuditLog } from '../../../lib/immutable-logger';
import { playBubble, playMarimba } from '../../../lib/audio-synth';
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
  Briefcase,
  BookOpen,
  MessageSquare,
  Activity
} from 'lucide-react';
import Link from 'next/link';
import { SensoryHeatmap } from '../../../components/SensoryHeatmap';

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

const getDayLabel = (dayKey: string) => {
  const day = DAYS_OF_MONTH.find(d => d.key === dayKey);
  return day ? day.label : `Dia ${dayKey}`;
};

const getRecurrenceWeekdayLabel = (dayKey: string) => {
  const dayObj = DAYS_OF_MONTH.find(d => d.key === dayKey);
  if (!dayObj) return 'no mesmo dia da semana';
  
  const mapping: Record<string, string> = {
    domingo: 'Domingos',
    segunda: 'Segundas-feiras',
    terca: 'Terças-feiras',
    quarta: 'Quartas-feiras',
    quinta: 'Quintas-feiras',
    sexta: 'Sextas-feiras',
    sabado: 'Sábados'
  };
  
  return `Todas as ${mapping[dayObj.weekdayKey] || dayObj.weekdayKey} do mês`;
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
  { title: 'Escovar os dentes', time: '08:00', period: 'manhã' as const },
  { title: 'Tomar banho', time: '08:30', period: 'manhã' as const },
  { title: 'Café da manhã', time: '09:00', period: 'manhã' as const },
  { title: 'Ir para a escola', time: '13:00', period: 'tarde' as const },
  { title: 'Dever de casa', time: '17:30', period: 'tarde' as const },
  { title: 'Jantar em família', time: '19:30', period: 'noite' as const },
  { title: 'Dormir / Descanso', time: '21:30', period: 'noite' as const },
  { title: 'Sessão Psicologia ABA 🧠', time: '09:00', period: 'manhã' as const },
  { title: 'Terapia Ocupacional 🧼', time: '14:00', period: 'tarde' as const },
  { title: 'Sessão Fonoterapia 🗣️', time: '10:30', period: 'manhã' as const },
  { title: 'Fisioterapia Motora 🩺', time: '15:30', period: 'tarde' as const },
  { title: 'Psicoterapia Infantil 💬', time: '16:00', period: 'tarde' as const },
  { title: 'Psicomotricidade 🏃', time: '11:00', period: 'manhã' as const }
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


function ParentDashboardContent() {
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
        day: activeDayFilter
      });

      const dayLabel = getDayLabel(activeDayFilter).replace(/ 📅| ☀️/, '');
      await immutableLogger.logChange(
        'ADD_TASK', 
        `Adicionou a tarefa rápida "${preset.title}" na agenda de ${dayLabel}.`,
        currentUser?.email
      );

      triggerStatus('Tarefa rápida adicionada!');
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
      ? `Deseja realmente carregar o modelo "${template.name}" para o dia atual? Isso substituirá as tarefas existentes de ${getDayLabel(activeDayFilter).replace(/ 📅| ☀️/, '')}.`
      : `Deseja realmente carregar o modelo "${template.name}" para TODOS OS DIAS do mês? Isso substituirá todas as tarefas existentes do dia 1 ao 31.`;

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
        
        const dayLabel = getDayLabel(activeDayFilter).replace(/ 📅| ☀️/, '');
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
              triggerStatus('Áudio de alerta salvo com sucesso!');
            } catch (err) {
              triggerStatus('Erro ao salvar áudio no servidor.');
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
      triggerStatus('Permissão de microfone negada ou não suportada.');
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
      triggerStatus('Erro ao reproduzir o áudio.');
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
      triggerStatus('Áudio de alerta removido!');
    } catch (err) {
      triggerStatus('Erro ao remover áudio.');
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
      triggerStatus('Simulação de crise registrada com GPS!');
      
      await immutableLogger.logChange(
        'ADD_TASK',
        `Simulou crise sensorial no local "${randomLoc}" com latitude: ${latitude.toFixed(4)}, longitude: ${longitude.toFixed(4)}.`,
        currentUser?.email
      );
    } catch (err) {
      triggerStatus('Erro ao salvar log de simulação.');
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
    profile: true,           // Default collapsed
    voiceRecorder: true,     // Default collapsed
    aacEditor: true,         // Default collapsed
    storiesEditor: true,     // Default collapsed
    dictionary: true,        // Default collapsed
    quickActions: true,      // Default collapsed
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
  const [activeDayFilter, setActiveDayFilter] = useState(new Date().getDate().toString());
  const [activePanelTab, setActivePanelTab] = useState<'tasks' | 'reports' | 'logs' | 'checkpoints'>('tasks');
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

  // Copy/Paste Routine Buffer States
  const [copiedTasksBuffer, setCopiedTasksBuffer] = useState<any[]>([]);
  const [copiedFromDay, setCopiedFromDay] = useState<string | null>(null);

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
      triggerStatus('Checkpoint clínico salvo!');
      
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
    const dayLabel = getDayLabel(activeDayFilter).replace(/ 📅| ☀️/, '');
    triggerStatus(`Rotina de ${dayLabel} copiada! (${dayTasks.length} tarefas)`);
  };

  const handlePasteDay = async () => {
    if (!copiedFromDay || copiedTasksBuffer.length === 0 || !activeChild?.id) return;
    
    playMarimba(392, 0.4);
    
    const targetDayLabel = getDayLabel(activeDayFilter).replace(/ 📅| ☀️/, '');
    const sourceDayLabel = getDayLabel(copiedFromDay).replace(/ 📅| ☀️/, '');
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
      triggerStatus('Checkpoint diário clínico registrado!');

      await immutableLogger.logChange(
        'UPDATE_PROFILE',
        `Adicionou checkpoint clínico para a data ${newCpDate} (${newCpRole} - ${newCpName}).`,
        currentUser?.email
      );
    } catch (err) {
      console.error(err);
      triggerStatus('Erro ao criar checkpoint diário.');
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

      triggerStatus('Criança cadastrada com sucesso!');
      setNewChildModalOpen(false);
      
      // Reset form states
      setNewChildName('');
      setNewChildBirthDate('');
      setNewChildGender('Não Informado');
      setNewChildDiagnosis('Não Informado');
    } catch (err) {
      triggerStatus('Erro ao cadastrar criança.');
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

      triggerStatus('Criança removida com sucesso!');
    } catch (err) {
      triggerStatus('Erro ao remover criança.');
    }
  };

  // Handle Log Out
  const handleLogout = async () => {
    playMarimba(261, 0.3);
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
        const dayLabel = getDayLabel(activeDayFilter).replace(/ 📅| ☀️/, '');
        logMessage = `Adicionou a tarefa "${title.trim()}" (Duração: ${taskDuration}min, Ícone: ${taskIcon}, Categoria: ${taskCategory}) às ${time} (${period}) na agenda de ${dayLabel}.`;
      } else if (recurrenceMode === 'weekday') {
        const dayLabel = getRecurrenceWeekdayLabel(activeDayFilter);
        logMessage = `Adicionou a tarefa "${title.trim()}" (Duração: ${taskDuration}min, Ícone: ${taskIcon}, Categoria: ${taskCategory}) às ${time} (${period}) em ${dayLabel}.`;
      } else {
        logMessage = `Adicionou a tarefa "${title.trim()}" (Duração: ${taskDuration}min, Ícone: ${taskIcon}, Categoria: ${taskCategory}) às ${time} (${period}) em todos os dias do mês.`;
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
      
      const dayLabel = getDayLabel(task.day);
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

      const dayLabel = getDayLabel(activeDayFilter);
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
      triggerStatus('Por favor, cadastre uma criança primeiro.');
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
        `Atualizou o perfil de ${activeChild.name}: Hiperfoco: "${hyperfocus}", Bloqueio Infantil: "${lockType}" (PIN: ${parentPinCode}), Velocidade Fala: ${sensorySpeed}x, Efeito Sonoro: "${sensorySound}", Visual: "${sensoryVisuals}", Perfil Sensorial: "${sensoryProfile}", Estilo Timer: "${timerStyle}", Reforçador: "${rewardName}" (${rewardCost} estrelas), Alerta de Transição: ${transitionMinutes}min.`,
        currentUser?.email
      );
      
      // Trigger Border Collie celebration
      setCollieState('celebrating');
      setTimeout(() => setCollieState('idle'), 2000);
      
      triggerStatus('Configurações da criança salvas com sucesso!');
    } catch (err) {
      triggerStatus('Erro ao salvar configurações.');
    } finally {
      setSavingProfile(false);
    }
  };



  // --- CUSTOM AAC AND SOCIAL STORIES HANDLERS ---

  const handleAddAacItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChild) return;
    if (!newAacText.trim() || !newAacSpeech.trim()) {
      triggerStatus('Preencha o título e a frase do botão.');
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
      triggerStatus('Botão AAC adicionado!');
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
      triggerStatus('Botão AAC removido.');
    } catch (err) {
      triggerStatus('Erro ao remover item AAC.');
    }
  };

  const handleGenerateAiStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChild) return;
    if (!aiTheme.trim()) {
      triggerStatus('Digite um tema para a história.');
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
        triggerStatus('História Social gerada e salva!');
      } catch (err) {
        setGeneratingAi(false);
        triggerStatus('Erro ao salvar história.');
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
      triggerStatus('História excluída.');
    } catch (err) {
      triggerStatus('Erro ao excluir história.');
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
      triggerStatus('Sinal excluído.');
    } catch (err) {
      triggerStatus('Erro ao excluir sinal.');
    }
  };

  // Unexpected Change Management
  const handleDeclareUnexpectedChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChild) return;
    if (!selectedCancelTaskTitle || !changeReason.trim() || !changeReplacement.trim()) {
      triggerStatus('Preencha todos os campos da mudança inesperada.');
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
      triggerStatus('Mudança de planos notificada ao portal da criança!');
    } catch (err) {
      triggerStatus('Erro ao registrar mudança de planos.');
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
      triggerStatus('Mudança de planos removida.');
    } catch (err) {
      triggerStatus('Erro ao limpar mudança.');
    }
  };

  // Monthly Template Saving & Reapplying
  const handleSaveMonthlyTemplate = async () => {
    if (!activeChild) return;
    if (tasks.length === 0) {
      triggerStatus('Não há tarefas ativas para salvar como modelo.');
      return;
    }

    // Strip IDs, userUids, dates, and ensure isCompleted is false
    const strippedTasks = tasks.map(t => ({
      title: t.title,
      time: t.time,
      period: t.period,
      day: t.day,
      isCompleted: false,
      order: t.order,
      icon: t.icon || '📅',
      customIcon: t.customIcon || null,
      category: t.category || 'AVD',
      duration: t.duration || 30,
      description: t.description || ''
    }));

    try {
      const updated = await firebaseBridge.auth.updateChildSettings(activeChild.id, {
        monthlyTemplate: JSON.stringify(strippedTasks)
      });
      setActiveChild(updated);
      firebaseBridge.auth.setActiveChild(updated);
      triggerStatus('Agenda do mês salva como modelo com sucesso!');
    } catch (err) {
      triggerStatus('Erro ao salvar modelo.');
    }
  };

  const handleReapplyMonthlyTemplate = async () => {
    if (!activeChild) return;
    if (!activeChild.monthlyTemplate) {
      triggerStatus('Nenhum modelo salvo encontrado para este paciente.');
      return;
    }

    if (!window.confirm('Atenção: Reaplicar o modelo substituirá todas as atividades atuais do paciente por uma cópia limpa do modelo salvo. Deseja continuar?')) {
      return;
    }

    try {
      const templateTasks = JSON.parse(activeChild.monthlyTemplate);
      await firebaseBridge.db.loadTemplate(templateTasks);
      triggerStatus('Modelo mensal reaplicado com sucesso!');
    } catch (err) {
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
      triggerStatus('Rotina padrão restaurada!');
    } catch (err) {
      triggerStatus('Erro ao restaurar rotina.');
    }
  };

  // Clear all tasks
  const handleClearAll = async () => {
    if (!window.confirm('Atenção: deseja limpar toda a rotina? Esta ação não pode ser desfeita.')) return;
    
    playMarimba(261.63, 0.5);
    try {
      await firebaseBridge.db.clearAllTasks();
      await immutableLogger.logChange(
        'RESET_ROUTINE',
        'Limpou toda a grade de tarefas semanais.',
        currentUser?.email
      );
      triggerStatus('Grade limpa!');
    } catch (err) {
      triggerStatus('Erro ao limpar rotina.');
    }
  };

  const handleExportABAData = () => {
    playBubble();
    if (!activeChild) {
      triggerStatus('Selecione uma criança primeiro para exportar.');
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
    if (!activeChild) return { level: 'Baixo 🟢', percentage: 15, class: 'text-emerald-600 bg-emerald-50 border-emerald-200', desc: 'Agenda fluindo bem. Sem indicativos de fadiga ou resistência.' };
    
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
        level: 'ALTO 🚨',
        percentage: finalScore,
        class: 'text-red-705 bg-red-50 border-red-200',
        desc: 'Alta probabilidade de esgotamento nervoso ou meltdown. Recomendado: reduzir cobrança, ativar o modelo de Regulação Sensorial e oferecer pausas no refúgio.'
      };
    } else if (finalScore >= 35) {
      return {
        level: 'Moderado ⚠️',
        percentage: finalScore,
        class: 'text-amber-705 bg-amber-50 border-amber-250',
        desc: 'Sinais sutis de resistência ou oscilação de humor. Fique atento a sinais físicos de agitação. Evite transições sem o aviso visual de 5 minutos.'
      };
    } else {
      return {
        level: 'Baixo 🟢',
        percentage: finalScore,
        class: 'text-emerald-705 bg-emerald-50 border-emerald-200',
        desc: 'Comportamento regulado e conformidade estável. Continue com o reforço positivo!'
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
        text: `Risco de crise elevado quando ruído ultrapassa 70dB (${highNoiseCrises} eventos registrados em ambientes com som alto).`
      });
    }

    const brightLightCrises = crises.filter(log => log.lightLevel === 'Alta').length;
    if (brightLightCrises >= 2) {
      insights.push({
        type: 'danger',
        text: `Alta probabilidade de sobrecarga sensorial associada a ambientes com luminosidade alta / luzes fortes.`
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
          text: `Gatilho recorrente detectado: "${trigger}" desencadeou desregulação comportamental em pelo menos ${count} ocasiões.`
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
        insights.push({
          type: 'warning',
          text: `Ambiente de alta vulnerabilidade: o local "${loc}" está correlacionado a crises repetidas (${count} registros).`
        });
      }
    });

    if (insights.length === 0) {
      insights.push({
        type: 'info',
        text: 'Não foram encontradas correlações fortes de gatilhos nas últimas crises. Continue registrando os dados de antecedente, ruído e luz.'
      });
    }

    return insights;
  };

  // Week calculations for weekly schedule view
  const weekStart = Math.floor((parseInt(activeDayFilter || '1', 10) - 1) / 7) * 7 + 1;
  const weekEnd = Math.min(weekStart + 6, DAYS_OF_MONTH.length);
  const weekDays = Array.from({ length: weekEnd - weekStart + 1 }, (_, i) => weekStart + i);

  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-900 pb-16 relative">
      {offline && (
        <div className="bg-amber-500 text-white py-2 px-4 text-center text-xs font-black select-none z-50 flex items-center justify-center gap-2 font-Outfit shadow-md">
          <span>📶 Modo Offline Ativado</span>
          {offlineQueueSize > 0 && (
            <span className="bg-amber-700/60 px-2 py-0.5 rounded text-[10px]">
              {offlineQueueSize} {offlineQueueSize === 1 ? 'alteração pendente' : 'alterações pendentes'}
            </span>
          )}
        </div>
      )}
      {/* Header bar */}
      <header className="bg-white border-b-2 border-slate-250 sticky top-0 z-30 shadow-premium">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-850 rounded-xl flex items-center justify-center font-bold text-lg shadow-sm border-2 border-indigo-200">
              PA
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-955 font-Outfit">Painel do Responsável</h1>
              <p className="text-xs text-slate-655 font-semibold">Controle de Rotina & Segurança Sensorial</p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-auto">
            <span className="text-xs font-bold bg-indigo-50 border-2 border-indigo-200 text-indigo-800 px-3 py-1.5 rounded-full shadow-sm">
              🧑‍💻 {currentUser?.email}
            </span>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-50 border-2 border-red-200 hover:bg-red-100 hover:text-red-800 text-red-700 text-xs font-black rounded-full transition-all active:scale-95 font-Outfit cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> Sair
            </button>
          </div>
        </div>
      </header>

      {/* Child Selector & Management Bar */}
      <section className="bg-white border-b-2 border-slate-250 py-4.5 shadow-sm select-none">
        <div className="max-w-6xl mx-auto px-4 md:px-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 flex-wrap">
            <span className="text-xs font-black text-slate-450 uppercase tracking-widest font-Outfit">Crianças:</span>
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
                          {child.diagnosis}
                        </span>
                      )}
                    </div>
                  </button>

                  {children.length > 1 && (
                    <button
                      onClick={() => handleDeleteChild(child.id, child.name)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-100 text-red-600 hover:bg-red-500 hover:text-white rounded-full flex items-center justify-center transition-all border border-red-200 shadow-xxs opacity-0 group-hover:opacity-100 cursor-pointer text-[9px] font-black"
                      title="Excluir Criança"
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
              <span>Cadastrar Criança</span>
            </button>
          </div>

          {activeChild ? (
            <div className="flex items-center gap-3">
              <a
                href={`/routine?childId=${activeChild.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 bg-indigo-600 text-white hover:bg-indigo-755 text-xs font-black rounded-xl shadow-md border-b-4 border-indigo-900 transition-all active:scale-95 flex items-center gap-2 font-Outfit uppercase tracking-wider"
              >
                <span>🚀</span> Ir para Tela de {activeChild.name.split(' ')[0]}
              </a>
            </div>
          ) : (
            <span className="text-xs font-bold text-slate-500">Nenhuma criança cadastrada</span>
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
                    <h2 className="text-lg font-black text-slate-900 font-Outfit">Guia de Mediação Clínica e Rotina</h2>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">
                      Entenda como estruturar um ambiente previsível e sensorialmente seguro para o seu filho.
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
                  title="Ocultar guia de onboarding permanentemente"
                >
                  Entendi, Ocultar ×
                </button>
              </div>

              {/* Grid with 3 columns describing clinical benefits */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-5 border-t border-slate-100">
                <div className="flex flex-col gap-2 p-4 rounded-2xl bg-indigo-50/40 border border-indigo-100">
                  <span className="text-xl">📅</span>
                  <h3 className="text-xs font-black text-slate-900 font-Outfit uppercase tracking-wider">1. Previsibilidade & Ansiedade</h3>
                  <p className="text-[10px] text-slate-600 font-semibold leading-relaxed">
                    Crianças no espectro TEA ou com TDAH beneficiam-se muito da previsibilidade. Rotinas visuais bem estruturadas reduzem a carga cognitiva do lobo frontal, diminuindo o estresse e prevenindo crises de desregulação emocional.
                  </p>
                </div>

                <div className="flex flex-col gap-2 p-4 rounded-2xl bg-emerald-50/40 border border-emerald-100">
                  <span className="text-xl">🧠</span>
                  <h3 className="text-xs font-black text-slate-900 font-Outfit uppercase tracking-wider">2. Ajuste Sensorial Fino</h3>
                  <p className="text-[10px] text-slate-600 font-semibold leading-relaxed">
                    O processamento sensorial varia de acordo com o estado do dia. Ajustar a velocidade da voz do mascote (TTS) e o nível de estímulo visual (rich ou minimal) permite criar uma interface adaptável e acolhedora de acordo com a fadiga do dia.
                  </p>
                </div>

                <div className="flex flex-col gap-2 p-4 rounded-2xl bg-amber-50/40 border border-amber-100">
                  <span className="text-xl">🤝</span>
                  <h3 className="text-xs font-black text-slate-900 font-Outfit uppercase tracking-wider">3. Sintonia Escola-Terapia</h3>
                  <p className="text-[10px] text-slate-600 font-semibold leading-relaxed">
                    Quando a escola, os pais e a equipe terapêutica usam o mesmo <strong>Dicionário Comportamental</strong>, as respostas aos comportamentos da criança tornam-se consistentes. Isso gera estabilidade e reforça a segurança social do indivíduo.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto px-4 md:px-6 mt-8 grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8">
        
        {/* Left Side: Child Settings & Fast Actions */}
        <div className="md:col-span-4 flex flex-col gap-6">
          
          {/* Active Emotional Battery Card */}
          {activeChild && (
            <div className="bg-white border-2 border-slate-250 rounded-[28px] p-6 shadow-premium flex flex-col gap-4">
              <button
                type="button"
                onClick={() => toggleSection('emotionalBattery')}
                className="w-full flex items-center justify-between text-left cursor-pointer bg-transparent border-none outline-none select-none"
              >
                <div className="flex items-center gap-2.5 text-indigo-655">
                  <span className="text-base">🔋</span>
                  <h2 className="font-bold text-slate-900 text-sm font-Outfit uppercase tracking-wider">Energia Emocional</h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full font-Outfit ${
                    activeChild.emotionalBattery === 'green' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : activeChild.emotionalBattery === 'yellow'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-805'
                  }`}>
                    {activeChild.emotionalBattery === 'green' ? 'Ótimo' : activeChild.emotionalBattery === 'yellow' ? 'Cansado' : 'Sobrecarregado'}
                  </span>
                  {collapsedSections.emotionalBattery ? <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />}
                </div>
              </button>

              {!collapsedSections.emotionalBattery && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-col gap-4 border-t border-slate-100 pt-4 w-full"
                >
              
              <div className="flex items-center justify-center py-2 bg-slate-50 border border-slate-155 rounded-2xl">
                <span className="text-3xl">
                  {activeChild.emotionalBattery === 'green' ? '🔋' : activeChild.emotionalBattery === 'yellow' ? '⚡' : '🪫'}
                </span>
                <span className="text-xl font-black text-slate-800 ml-2.5 font-Outfit">
                  {activeChild.emotionalBattery === 'green' ? '100%' : activeChild.emotionalBattery === 'yellow' ? '50%' : '10%'}
                </span>
              </div>

              {activeChild.emotionalBattery !== 'green' && (
                <div className={`p-4 rounded-2xl border text-xxs font-semibold leading-relaxed flex flex-col gap-2 ${
                  activeChild.emotionalBattery === 'red'
                    ? 'bg-red-50 border-red-200 text-red-800'
                    : 'bg-yellow-50 border-yellow-250 text-yellow-800'
                }`}>
                  <span className="font-black font-Outfit uppercase text-[9px] tracking-widest flex items-center gap-1">
                    ⚠️ {activeChild.emotionalBattery === 'red' ? 'Alerta de Crise' : 'Aviso de Cansaço'}
                  </span>
                  <p>
                    {activeChild.emotionalBattery === 'red' 
                      ? `Atenção: ${activeChild.name.split(' ')[0]} registrou sobrecarga extrema nas últimas horas. Considere imediatamente pausar telas, apagar luzes fortes e guiar uma atividade de descompressão ou usar o SOS Sensorial.`
                      : `${activeChild.name.split(' ')[0]} sente cansaço ou fadiga. Considere reduzir a velocidade ou complexidade das tarefas de hoje e dar um tempo para descanso.`}
                  </p>
                </div>
              )}
                </motion.div>
              )}
            </div>
          )}

          {/* Daily Status Grid Card */}
          {activeChild && (
            <div className="bg-white border-2 border-slate-250 rounded-[28px] p-6 shadow-premium flex flex-col gap-4">
              <button
                type="button"
                onClick={() => toggleSection('dailyStatus')}
                className="w-full flex items-center justify-between text-left cursor-pointer bg-transparent border-none outline-none select-none"
              >
                <div className="flex items-center gap-2.5 text-indigo-600">
                  <span className="text-base">📅</span>
                  <h2 className="font-bold text-slate-900 text-sm font-Outfit uppercase tracking-wider">Acompanhamento Diário</h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-slate-400 uppercase">Últimos 7 dias</span>
                  {collapsedSections.dailyStatus ? <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />}
                </div>
              </button>

              {!collapsedSections.dailyStatus && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-col gap-4 border-t border-slate-100 pt-4 w-full"
                >

              <div className="flex flex-col gap-3">
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
                          <div className="flex items-center gap-1" title={schoolLog ? 'Relatório escolar recebido' : 'Sem relatório escolar hoje'}>
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
                          <div className="flex items-center gap-1" title={clinicalCp ? 'Acompanhamento clínico registrado' : 'Sem laudo clínico hoje'}>
                            <span className="text-[10px]" title="Clínico">🧠</span>
                            {clinicalCp ? (
                              <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[9px] font-black border border-emerald-250" title={`${clinicalCp.professionalRole}: ${clinicalCp.feedback}`}>
                                OK ✓
                              </span>
                            ) : (
                              <button
                                onClick={() => {
                                  playBubble();
                                  setActivePanelTab('checkpoints');
                                  setNewCpDate(isoDate);
                                  setNewCpOpen(true);
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
            </div>
          )}

          {/* Child Hyperfocus Profile Card */}
          <div className="bg-white border-2 border-slate-250 rounded-[28px] p-6 shadow-premium flex flex-col gap-4">
            <button
              type="button"
              onClick={() => toggleSection('profile')}
              className="w-full flex items-center justify-between text-left cursor-pointer bg-transparent border-none outline-none select-none"
            >
              <div className="flex items-center gap-2.5 text-indigo-600">
                <Sparkles className="w-5 h-5" />
                <h2 className="font-bold text-slate-900 text-lg font-Outfit">Perfil da Criança</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black text-slate-400 uppercase">Configurações</span>
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
                  Hiperfoco Principal do Usuário
                </label>
                <select
                  value={hyperfocus}
                  onChange={e => setHyperfocus(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border-2 border-slate-300 focus:border-indigo-600 focus:bg-white rounded-xl text-slate-900 outline-none text-sm transition-all shadow-xxs font-bold cursor-pointer focus:ring-4 focus:ring-indigo-100"
                >
                  <option value="Border Collies 🐕">Cachorro Border Collie 🐶</option>
                  <option value="Dinossauro 🦖">Dinossauro 🦖</option>
                  <option value="Astronauta / Espaço 🚀">Espaço / Astronauta 🚀</option>
                  <option value="Minecraft / Blocos 🟩">Minecraft / Blocos 🟩</option>
                  <option value="Gato 🐱">Gato 🐱</option>
                  <option value="Carro 🚗">Carro 🚗</option>
                  <option value="Trem / Locomotiva 🚂">Trem / Locomotiva 🚂</option>
                  <option value="Super-herói 🦸">Super-herói 🦸</option>
                  <option value="Tubarão / Fundo do Mar 🦈">Tubarão / Fundo do Mar 🦈</option>
                  <option value="Unicórnio 🦄">Unicórnio 🦄</option>
                  <option value="Robô / Tecnologia 🤖">Robô / Tecnologia 🤖</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5 font-Outfit">
                  Tipo de Bloqueio Infantil
                </label>
                <select
                  value={lockType}
                  onChange={e => setLockType(e.target.value as any)}
                  className="w-full px-4 py-2.5 bg-white border-2 border-slate-300 focus:border-indigo-600 focus:bg-white rounded-xl text-slate-900 outline-none text-sm transition-all shadow-xxs font-bold cursor-pointer focus:ring-4 focus:ring-indigo-100"
                >
                  <option value="math">Desafio de Matemática 🧮</option>
                  <option value="pin">PIN de 4 dígitos 🔑</option>
                  <option value="none">Nenhum (Livre) 🔓</option>
                </select>
              </div>

              {lockType === 'pin' && (
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5 font-Outfit">
                    PIN do Responsável (4 dígitos)
                  </label>
                  <input 
                    type="text" 
                    maxLength={4}
                    value={parentPinCode}
                    onChange={e => setParentPinCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Ex: 1234"
                    className="w-full px-4 py-2.5 bg-white border-2 border-slate-300 focus:border-indigo-600 focus:bg-white rounded-xl text-slate-900 placeholder-slate-400 outline-none text-sm transition-all shadow-xxs font-bold text-center tracking-widest text-lg focus:ring-4 focus:ring-indigo-100"
                  />
                </div>
              )}

              {/* Sensory speed select */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5 font-Outfit">
                  Velocidade da Fala do Mascote (TTS) 🗣️
                </label>
                <select
                  value={sensorySpeed}
                  onChange={e => setSensorySpeed(parseFloat(e.target.value) as any)}
                  className="w-full px-4 py-2.5 bg-white border-2 border-slate-300 focus:border-indigo-600 focus:bg-white rounded-xl text-slate-900 outline-none text-sm transition-all shadow-xxs font-bold cursor-pointer focus:ring-4 focus:ring-indigo-100"
                >
                  <option value={0.7}>Muito Calma / Lenta (0.7x) 🐢</option>
                  <option value={1.0}>Calma Recomendada (1.0x) ☕</option>
                  <option value={1.2}>Dinâmica / Padrão (1.2x) ⚡</option>
                </select>
              </div>

              {/* Sensory sound selection */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5 font-Outfit">
                  Estilo de Efeito Sonoro 🔊
                </label>
                <select
                  value={sensorySound}
                  onChange={e => setSensorySound(e.target.value as any)}
                  className="w-full px-4 py-2.5 bg-white border-2 border-slate-300 focus:border-indigo-600 focus:bg-white rounded-xl text-slate-900 outline-none text-sm transition-all shadow-xxs font-bold cursor-pointer focus:ring-4 focus:ring-indigo-100"
                >
                  <option value="marimba">Instrumento de Madeira (Marimba) 🪵</option>
                  <option value="bubble">Bolhas Fluidas (Suave) 🫧</option>
                  <option value="silent">Modo Silencioso (Sem som) 🔕</option>
                </select>
              </div>

              {/* Sensory visuals selection */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5 font-Outfit">
                  Nível de Estímulos Visuais 🎨
                </label>
                <select
                  value={sensoryVisuals}
                  onChange={e => setSensoryVisuals(e.target.value as any)}
                  className="w-full px-4 py-2.5 bg-white border-2 border-slate-350 focus:border-indigo-600 focus:bg-white rounded-xl text-slate-900 outline-none text-sm transition-all shadow-xxs font-bold cursor-pointer focus:ring-4 focus:ring-indigo-100"
                >
                  <option value="rich">Interativo e Animado (Padrão) ✨</option>
                  <option value="minimal">Filtro Sensorial Reduzido (Quadro Primeiro-Depois) 🧘</option>
                </select>
              </div>

              {/* Sensory Profile selection */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5 font-Outfit">
                  Limiar de Sensibilidade Sensorial (Perfil) 🧠
                </label>
                <select
                  value={sensoryProfile}
                  onChange={e => {
                    const val = e.target.value as 'balanced' | 'hypersensitive' | 'hyposensitive';
                    setSensoryProfile(val);
                    if (val === 'hypersensitive') {
                      setSensoryVisuals('minimal');
                      setSensorySpeed(0.7);
                    } else if (val === 'hyposensitive') {
                      setSensoryVisuals('rich');
                      setSensorySpeed(1.2);
                    }
                  }}
                  className="w-full px-4 py-2.5 bg-white border-2 border-slate-350 focus:border-indigo-600 focus:bg-white rounded-xl text-slate-900 outline-none text-sm transition-all shadow-xxs font-bold cursor-pointer focus:ring-4 focus:ring-indigo-100"
                >
                  <option value="balanced">Perfil Equilibrado (Padrão) 🧘</option>
                  <option value="hypersensitive">Perfil Hipersensível (Baixa Estimulação) 🔇</option>
                  <option value="hyposensitive">Perfil Hipossensível (Estímulo Adicional) ⚡</option>
                </select>
              </div>

              {/* Timer Style selection */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5 font-Outfit">
                  Estilo de Temporizador Visual ⏱️
                </label>
                <select
                  value={timerStyle}
                  onChange={e => setTimerStyle(e.target.value as any)}
                  className="w-full px-4 py-2.5 bg-white border-2 border-slate-350 focus:border-indigo-600 focus:bg-white rounded-xl text-slate-900 outline-none text-sm transition-all shadow-xxs font-bold cursor-pointer focus:ring-4 focus:ring-indigo-100"
                >
                  <option value="circle">Time Timer Tradicional (Círculo Vermelho) ⏱️</option>
                  <option value="hourglass">Ampulheta Lúdica (Areia caindo) ⏳</option>
                  <option value="droplets">Gotas de Água (Gotas enchendo vaso) 💧</option>
                  <option value="hyperfocus">Temporizador Temático do Hiperfoco 🚀</option>
                </select>
              </div>

              {/* Emergency First-Then mode toggle */}
              {activeChild && (
                <div className="bg-gradient-to-tr from-indigo-50/50 to-indigo-100/50 border-2 border-indigo-200 p-4.5 rounded-2xl flex flex-col gap-3 shadow-xxs">
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-900 flex items-center gap-1 select-none font-Outfit">
                        🚨 Modo Primeiro-Depois
                      </span>
                      <p className="text-[9.5px] text-slate-500 font-semibold leading-tight mt-0.5">
                        Simplifica o portal em duas tarefas gigantes durante crises.
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
                      {emergencyFirstThen ? 'Ativo 🟢' : 'Inativo'}
                    </button>
                  </div>
                </div>
              )}

              {/* Token Economy Config */}
              <div className="bg-indigo-50 border-2 border-indigo-200 p-4.5 rounded-2xl flex flex-col gap-3 shadow-xxs">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-900 flex items-center gap-1 select-none font-Outfit">
                  🪙 Economia de Fichas (Reforço Positivo ABA)
                </span>
                <div>
                  <label className="block text-xxs font-black text-slate-700 uppercase mb-1 font-Outfit">
                    Nome do Prêmio / Reforçador
                  </label>
                  <input 
                    type="text" 
                    value={rewardName}
                    onChange={e => setRewardName(e.target.value)}
                    placeholder="Ex: 15 min de tablet"
                    className="w-full px-4 py-2.5 bg-white border-2 border-slate-300 focus:border-indigo-650 rounded-xl text-slate-900 outline-none text-xs font-bold focus:ring-4 focus:ring-indigo-100"
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
                      className="w-full px-2.5 py-2.5 bg-white border-2 border-slate-300 focus:border-indigo-650 rounded-xl text-slate-900 outline-none text-xs font-bold focus:ring-4 focus:ring-indigo-100"
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
                      className="w-full px-2.5 py-2.5 bg-white border-2 border-slate-300 focus:border-indigo-650 rounded-xl text-slate-900 outline-none text-xs font-bold focus:ring-4 focus:ring-indigo-100"
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
                      className="w-full px-2.5 py-2.5 bg-white border-2 border-slate-300 focus:border-indigo-650 rounded-xl text-slate-900 outline-none text-xs font-bold focus:ring-4 focus:ring-indigo-100"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Assinatura do Serviço
                </label>
                <div className={`px-4 py-3 rounded-xl border font-bold flex items-center justify-between text-sm ${
                  plan === 'premium'
                    ? 'bg-amber-50 border-amber-250 text-amber-700'
                    : 'bg-slate-50 border-slate-200 text-slate-650'
                }`}>
                  <span>{plan === 'premium' ? '💎 Premium Ativo' : '🔓 Plano Grátis'}</span>
                  {plan === 'premium' ? (
                    <button
                      type="button"
                      onClick={async () => {
                        playMarimba(261, 0.3);
                        await firebaseBridge.auth.updateProfileSettings({ plan: 'free' });
                        setPlan('free');
                        triggerStatus('Sua assinatura foi cancelada (Plano Grátis).');
                      }}
                      className="text-[10px] font-black uppercase text-red-500 hover:text-red-750 cursor-pointer bg-transparent border-none font-bold"
                    >
                      Cancelar
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        playBubble();
                        setShowPaywall(true);
                      }}
                      className="text-[10px] font-black uppercase text-indigo-600 hover:text-indigo-850 cursor-pointer bg-transparent border-none font-bold"
                    >
                      Upgrade
                    </button>
                  )}
                </div>
              </div>

              {/* Clinical Sharing Code */}
              <div className="bg-indigo-50 border-2 border-indigo-200 p-4.5 rounded-2xl flex flex-col gap-3 shadow-xxs">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-900 flex items-center gap-1 select-none font-Outfit">
                  ⚕️ Compartilhamento Clínico (Terapeutas)
                </span>
                <p className="text-[10px] text-indigo-950 font-semibold leading-tight">
                  Gere um código de acesso seguro para terapeutas (psicólogos, T.O.s, fonoaudiólogos) acompanharem a rotina e registrarem checkpoints.
                </p>
                <div className="flex flex-col gap-2 bg-white border border-slate-200 p-3 rounded-xl">
                  {activeChild?.sharingCode ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold text-slate-500 uppercase font-Outfit">Código do Paciente:</span>
                        <span className="text-sm font-black text-indigo-650 tracking-wider bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-150 font-Outfit">
                          {activeChild.sharingCode}
                        </span>
                      </div>
                      <div className="flex gap-1.5 w-full mt-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(activeChild.sharingCode || '');
                            triggerStatus('Código copiado!');
                          }}
                          className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-black rounded-lg active:scale-95 transition-all cursor-pointer font-Outfit"
                        >
                          Copiar Código
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (typeof window !== 'undefined') {
                              const directLink = `${window.location.origin}/therapist?code=${activeChild.sharingCode}`;
                              navigator.clipboard.writeText(directLink);
                              triggerStatus('Link direto copiado para a área de transferência!');
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
                          title="Gerar novo código"
                        >
                          Renovar
                        </button>
                      </div>
                      <p className="text-[9px] text-slate-500 font-medium leading-normal mt-1 border-t border-slate-100 pt-2 text-left">
                        💡 **Como o terapeuta acessa?** Ele pode entrar em <Link href="/therapist" className="text-indigo-650 hover:underline font-bold" target="_blank">/therapist</Link> e digitar o código, ou você pode clicar em **"Copiar Link Direto"** e enviar para ele no WhatsApp para acesso instantâneo!
                      </p>
                      
                      <div className="mt-2.5 pt-2 border-t border-dashed border-slate-200 flex flex-col gap-2">
                        <span className="text-[10px] font-black text-slate-700 uppercase font-Outfit">🏫 Acompanhamento Escolar (Mediador/Professor)</span>
                        <p className="text-[9px] text-slate-500 font-medium leading-normal">
                          Envie o link do portal escolar para o professor ou mediador registrar relatórios diários de humor, alimentação e ruído da escola:
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            if (typeof window !== 'undefined') {
                              const schoolLink = `${window.location.origin}/school?code=${activeChild?.sharingCode}`;
                              navigator.clipboard.writeText(schoolLink);
                              triggerStatus('Link da escola copiado!');
                            }
                          }}
                          className="w-full py-2 bg-yellow-500 hover:bg-yellow-600 text-slate-950 text-[10px] font-black rounded-xl active:scale-95 transition-all cursor-pointer font-Outfit border-none uppercase tracking-wider shadow-sm font-black"
                        >
                          Copiar Link da Escola 🏫
                        </button>
                      </div>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={handleGenerateSharingCode}
                      className="w-full py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-900 border border-indigo-300 rounded-xl text-xs font-black active:scale-95 transition-all cursor-pointer font-Outfit"
                    >
                      Gerar Código Clínico
                    </button>
                  )}
                </div>
              </div>

              <button 
                type="submit" 
                disabled={savingProfile}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-755 text-white text-sm font-black rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer border-b-4 border-indigo-900 font-Outfit"
              >
                {savingProfile ? 'Salvando...' : 'Atualizar Perfil'}
              </button>
            </form>
            <p className="text-xxs text-slate-400 leading-relaxed">
              * O hiperfoco ajuda a criança a se conectar com a rotina. O mascote utilizará este termo para incentivos lúdicos personalizados.
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
                title="Clique para rotacionar dicas clínicas!"
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

                    {/* Unified Clinical Support Tools & Attachments Card */}
          {activeChild && (
            <div className="bg-white border-2 border-slate-250 rounded-3xl p-6 shadow-premium">
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
                  <h2 className="font-bold text-slate-900 text-base font-Outfit">Apoio Clínico & Anexos 🎒</h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black text-slate-400 uppercase">Ferramentas</span>
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
                    Selecione uma ferramenta de apoio:
                  </label>
                  <select
                    value={activeSidebarTool}
                    onChange={(e) => {
                      playBubble();
                      setActiveSidebarTool(e.target.value as any);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl outline-none focus:border-indigo-500 transition-all cursor-pointer shadow-xxs"
                  >
                    <option value="none">Nenhuma ferramenta ativa</option>
                    <option value="aac">🗣️ Prancha AAC Customizada</option>
                    <option value="stories">📖 Histórias Sociais com IA</option>
                    <option value="dictionary">🧠 Dicionário Comportamental</option>
                    <option value="voice">📻 Gravador de Voz Familiar</option>
                  </select>

                  {/* Render voice alert content if active */}
                  {activeSidebarTool === 'voice' && (
                    <div className="flex flex-col gap-4 border-t border-slate-100/60 pt-4 mt-1">
                      <div className="flex items-center gap-2 text-indigo-650">
                        <Mic className="w-4 h-4 text-indigo-500" />
                        <h3 className="font-extrabold text-slate-900 text-xs font-Outfit">IA de Voz Familiar (Regulação)</h3>
                      </div>
                      <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                        Grave avisos de transição com sua voz real para acalmar a criança durante a contagem regressiva da rotina.
                      </p>

                      <div className="flex flex-col gap-3">
                        {(['audioAlert10', 'audioAlert5', 'audioAlert2'] as const).map((type) => {
                          const label = type === 'audioAlert10' ? 'Alerta de 10 min' : type === 'audioAlert5' ? 'Alerta de 5 min' : 'Alerta de 2 min';
                          const hasAudio = !!activeChild[type];
                          const isRecording = recordingType === type;
                          const isPlaying = isPlayingAudio === type;

                          return (
                            <div key={type} className="flex flex-col gap-1.5 p-3 rounded-2xl bg-slate-50 border border-slate-200">
                              <div className="flex items-center justify-between text-xxs font-black text-slate-700">
                                <span>{label}</span>
                                {hasAudio && !isRecording && (
                                  <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-250">Gravado ✓</span>
                                )}
                                {!hasAudio && !isRecording && (
                                  <span className="text-[9px] text-slate-400 font-bold">Sem gravação</span>
                                )}
                                {isRecording && (
                                  <span className="text-[9px] text-red-600 font-bold animate-pulse flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                                    Gravando ({recordingSecondsLeft}s)
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
                                    <Square className="w-3.5 h-3.5 fill-current" /> Parar Gravação
                                  </button>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => startRecording(type)}
                                      className="flex-1 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-800 border border-indigo-200 rounded-xl text-xxs font-black flex items-center justify-center gap-1 cursor-pointer transition-all"
                                    >
                                      <Mic className="w-3.5 h-3.5" /> Gravar 10s
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
                                          title="Ouvir gravação"
                                        >
                                          {isPlaying ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => deleteRecordedAudio(type)}
                                          className="p-1.5 bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 rounded-xl flex items-center justify-center cursor-pointer transition-all"
                                          title="Excluir gravação"
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
                        <h3 className="font-extrabold text-slate-900 text-xs font-Outfit">Prancha AAC Customizada</h3>
                      </div>
                      <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                        Personalize os botões de voz do paciente para que ele possa comunicar sentimentos, dores ou desejos no portal dele.
                      </p>

                      {/* List of current custom items */}
                      <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto pr-1">
                        {aacItemsList.length === 0 ? (
                          <p className="text-slate-400 text-xxs italic w-full text-center py-4">
                            Nenhum botão personalizado ainda.
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
                                title="Remover botão"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Form to add item */}
                      <form onSubmit={handleAddAacItem} className="flex flex-col gap-2.5 border-t border-slate-100 pt-4 mt-2">
                        <span className="text-xxs font-black text-slate-700 uppercase tracking-wider font-Outfit">Criar Novo Botão</span>
                        
                        <div className="grid grid-cols-4 gap-2">
                          <div className="col-span-3">
                            <input
                              type="text"
                              placeholder="Título (Ex: Quero colo)"
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
                            placeholder="Texto falado (Ex: Quero um colo da mamãe)"
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
                            🚨 Botão de Crise / Alerta Visual no SOS
                          </label>
                        </div>

                        <button
                          type="submit"
                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-755 text-white text-xs font-black rounded-xl border-b-2 border-indigo-900 active:scale-95 transition-all cursor-pointer font-Outfit uppercase tracking-wider"
                        >
                          ➕ Adicionar Botão
                        </button>
                      </form>
                    </div>
                  )}

                  {/* Render social stories content if active */}
                  {activeSidebarTool === 'stories' && (
                    <div className="flex flex-col gap-4 border-t border-slate-100/60 pt-4 mt-1">
                      <div className="flex items-center gap-2 text-indigo-655">
                        <BookOpen className="w-4 h-4 text-indigo-500" />
                        <h3 className="font-extrabold text-slate-900 text-xs font-Outfit">Histórias Sociais com IA</h3>
                      </div>
                      <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                        Crie histórias sociais curtas para preparar seu filho para transições ou consultas. A IA usará o hiperfoco da criança para torná-la cativante.
                      </p>

                      {/* List of current social stories */}
                      <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto pr-1">
                        {customStoriesList.length === 0 ? (
                          <p className="text-slate-400 text-xxs italic text-center py-4">
                            Nenhuma história criada ainda.
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
                                title="Excluir história"
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
                              💡 A IA vai adaptar a história com o hiperfoco ativo: <strong>{hyperfocus || activeChild.childHyperfocus || 'Border Collies 🐕'}</strong>.
                            </p>
                            <button
                              type="submit"
                              className="w-full py-2 bg-indigo-600 hover:bg-indigo-755 text-white text-xs font-black rounded-xl border-b-2 border-indigo-900 active:scale-95 transition-all cursor-pointer font-Outfit uppercase tracking-wider flex items-center justify-center gap-1"
                            >
                              <Sparkles className="w-3.5 h-3.5" /> Gerar História
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
                        <h3 className="font-extrabold text-slate-900 text-xs font-Outfit">Dicionário Comportamental</h3>
                      </div>
                      <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                        Mapeie os sinais corporais da criança, seus significados e a conduta recomendada para mediadores escolares e terapeutas.
                      </p>

                      {/* List of current signals */}
                      <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                        {behaviorList.length === 0 ? (
                          <p className="text-slate-400 text-xxs italic text-center py-4">
                            Nenhum sinal cadastrado ainda.
                          </p>
                        ) : (
                          behaviorList.map((item) => (
                            <div key={item.id} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-1.5 relative group">
                              <button
                                type="button"
                                onClick={() => handleDeleteBehaviorSignal(item.id)}
                                className="absolute top-2.5 right-2.5 p-1 bg-transparent hover:bg-rose-50 text-slate-405 hover:text-red-655 rounded-md border-none cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Excluir sinal"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <div className="text-xxs font-black text-indigo-950 font-Outfit pr-6">
                                📢 Sinal: {item.signal}
                              </div>
                              <div className="text-[10px] text-slate-600 font-semibold leading-tight">
                                <strong>🧠 Significado:</strong> {item.meaning}
                              </div>
                              <div className="text-[10px] text-emerald-800 font-semibold bg-emerald-50/60 border border-emerald-150 p-2 rounded-xl mt-1 leading-normal">
                                <strong>👩‍🏫 Conduta:</strong> {item.intervention}
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Add form */}
                      <form onSubmit={handleAddBehaviorSignal} className="flex flex-col gap-2.5 border-t border-slate-100 pt-4 mt-2">
                        <span className="text-xxs font-black text-slate-700 uppercase tracking-wider font-Outfit">Cadastrar Novo Sinal</span>
                        <div>
                          <input
                            type="text"
                            placeholder="Sinal (Ex: Aleteo / Agitar mãos)"
                            value={newSignal}
                            onChange={e => setNewSignal(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-255 rounded-xl text-xxs font-bold outline-none focus:bg-white focus:border-indigo-650"
                            required
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder="Significado (Ex: Excitação ou sobrecarga)"
                            value={newMeaning}
                            onChange={e => setNewMeaning(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-255 rounded-xl text-xxs font-bold outline-none focus:bg-white focus:border-indigo-650"
                            required
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            placeholder="Conduta (Ex: Reduzir estímulos / Dar tempo)"
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
                          ➕ Adicionar Sinal
                        </button>
                      </form>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          )}
{/* Quick Actions Card */}
          <div className="bg-white border-2 border-slate-250 rounded-3xl p-6 shadow-premium">
            <button
              type="button"
              onClick={() => toggleSection('quickActions')}
              className="w-full flex items-center justify-between text-left cursor-pointer bg-transparent border-none outline-none select-none"
            >
              <div className="flex items-center gap-2.5 text-indigo-600">
                <Settings className="w-5 h-5" />
                <h2 className="font-bold text-slate-900 text-sm font-Outfit uppercase tracking-wider">Ações Rápidas & Modelos</h2>
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
                  <RotateCcw className="w-4 h-4 text-indigo-500" /> Restaurar Rotina Clínica Padrão
                </span>
                <span>→</span>
              </button>
              <button 
                onClick={handleClearAll}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-red-50 text-slate-800 hover:text-red-600 border border-slate-100 hover:border-red-100 rounded-xl text-xs font-bold transition-all text-left"
              >
                <span className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-red-400" /> Limpar Toda a Grade
                </span>
                <span>→</span>
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-150 flex flex-col gap-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1 select-none">
                🚀 Modelos Clínicos Completos (1-Clique)
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
                      Aplicar no Mês
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 bg-slate-50 border border-slate-200/50 p-4 rounded-2xl flex gap-2">
              <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <p className="text-xxs text-slate-500 leading-relaxed">
                Todas as ações executadas geram registros instantâneos e imutáveis no histórico de segurança para assegurar que rotinas não sejam sobrepostas acidentalmente por outros cuidadores.
              </p>
            </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Right Side: Routine Composer / Logs */}
        <div className="md:col-span-8 flex flex-col gap-6">
          
          {/* Tabs for switching Tasks Routine vs Reports vs Audit Logs */}
          <div className="bg-slate-100/80 p-1.5 rounded-2xl flex shadow-inner gap-1 overflow-x-auto scrollbar-none">
            <button
              onClick={() => { playBubble(); setActivePanelTab('tasks'); }}
              className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 shrink-0 font-Outfit cursor-pointer select-none active:scale-95 ${
                activePanelTab === 'tasks' 
                  ? 'bg-white text-indigo-950 shadow-sm border border-slate-200/50 scale-100' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/40 border-2 border-transparent'
              }`}
            >
              <ListTodo className="w-4.5 h-4.5" /> Agenda
            </button>
            <button
              onClick={() => { playBubble(); setActivePanelTab('checkpoints'); }}
              className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 shrink-0 font-Outfit cursor-pointer select-none active:scale-95 ${
                activePanelTab === 'checkpoints' 
                  ? 'bg-white text-indigo-950 shadow-sm border border-slate-200/50 scale-100' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/40 border-2 border-transparent'
              }`}
            >
              <span className="text-sm">🤝</span> Checkpoints Clínicos
            </button>
            <button
              onClick={() => { playBubble(); setActivePanelTab('reports'); }}
              className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 shrink-0 font-Outfit cursor-pointer select-none active:scale-95 ${
                activePanelTab === 'reports' 
                  ? 'bg-white text-indigo-950 shadow-sm border border-slate-200/50 scale-100' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/40 border-2 border-transparent'
              }`}
            >
              <span className="text-sm">📊</span> Relatório Clínico
            </button>
            <button
              onClick={() => { playBubble(); setActivePanelTab('logs'); }}
              className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 shrink-0 font-Outfit cursor-pointer select-none active:scale-95 ${
                activePanelTab === 'logs' 
                  ? 'bg-white text-indigo-950 shadow-sm border border-slate-200/50 scale-100' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/40 border-2 border-transparent'
              }`}
            >
              <History className="w-4.5 h-4.5" /> Logs de Segurança
              <span className="text-[10px] bg-indigo-50 border border-indigo-150 text-indigo-755 px-2 py-0.5 rounded-full font-extrabold shadow-xxs">
                {logs.length}
              </span>
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activePanelTab === 'tasks' ? (
              
              // ROUTINE COMPOSER PANEL
              <motion.div
                key="tasks-panel"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col gap-6"
              >
                
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

                {/* GLOBAL CALENDAR REPLICATION & UNEXPECTED CHANGES */}
                {activeChild && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Template Replication */}
                    <div className="bg-gradient-to-br from-indigo-50/50 to-sky-50/50 border border-indigo-150 p-6 rounded-[28px] shadow-sm flex flex-col gap-4 text-left">
                      <div className="flex items-center gap-2 text-indigo-950">
                        <span className="text-xl">📅</span>
                        <h4 className="font-extrabold text-sm font-Outfit uppercase tracking-wide">Modelo de Agenda</h4>
                      </div>
                      <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                        Salve o calendário completo de atividades personalizadas para o paciente e replique-o no início de cada semana para zerar o progresso em 1 clique.
                      </p>
                      <div className="flex gap-2.5 mt-2">
                        <button
                          type="button"
                          onClick={handleSaveMonthlyTemplate}
                          className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-755 text-white text-xs font-black rounded-xl border-b-2 border-indigo-900 active:scale-95 transition-all cursor-pointer font-Outfit uppercase tracking-wider"
                        >
                          💾 Salvar Modelo
                        </button>
                        <button
                          type="button"
                          onClick={handleReapplyMonthlyTemplate}
                          disabled={!activeChild.monthlyTemplate}
                          className="flex-1 py-2.5 bg-white hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-455 disabled:border-slate-200 text-indigo-950 text-xs font-black rounded-xl border-2 border-slate-250 active:scale-95 transition-all cursor-pointer font-Outfit uppercase tracking-wider disabled:shadow-none"
                        >
                          🔄 Reaplicar Modelo
                        </button>
                      </div>
                      {activeChild.monthlyTemplate && (
                        <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50/50 border border-emerald-150 px-2 py-1 rounded-lg text-center mt-1 self-start select-none">
                          ✓ Modelo salvo no perfil do paciente
                        </span>
                      )}
                    </div>

                    {/* Unexpected Change Panel */}
                    <div className="bg-gradient-to-br from-amber-50/50 to-orange-50/50 border border-amber-150 p-6 rounded-[28px] shadow-sm flex flex-col gap-4 text-left">
                      <div className="flex items-center gap-2 text-amber-950">
                        <span className="text-xl">⚠️</span>
                        <h4 className="font-extrabold text-sm font-Outfit uppercase tracking-wide">Notificar Mudança Inesperada</h4>
                      </div>
                      
                      {unexpectedChangeObj ? (
                        <div className="flex flex-col gap-3">
                          <div className="p-3 bg-white border border-amber-200 rounded-xl text-xxs font-semibold text-slate-700 flex flex-col gap-1.5">
                            <div>
                              <strong className="text-amber-800">Atividade Cancelada:</strong> {unexpectedChangeObj.cancelledTaskTitle}
                            </div>
                            <div>
                              <strong className="text-amber-800">Motivo da Mudança:</strong> {unexpectedChangeObj.reason}
                            </div>
                            <div>
                              <strong className="text-amber-800">Atividade Substituta:</strong> {unexpectedChangeObj.replacement}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleClearUnexpectedChange}
                            className="w-full py-2.5 bg-red-500 hover:bg-red-650 text-white text-xs font-black rounded-xl border-b-2 border-red-750 active:scale-95 transition-all cursor-pointer font-Outfit uppercase tracking-wider"
                          >
                            ❌ Cancelar Notificação
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={handleDeclareUnexpectedChange} className="flex flex-col gap-2.5">
                          <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                            Intercepte o portal da criança com um modal explicativo (por voz/imagem) para prepará-la para alterações repentinas de rotina.
                          </p>
                          <div className="grid grid-cols-1 gap-2 mt-1">
                            <div>
                              <label className="block text-[8px] font-black text-slate-500 uppercase mb-0.5 pl-0.5">Atividade Afetada</label>
                              <select
                                value={selectedCancelTaskTitle}
                                onChange={e => setSelectedCancelTaskTitle(e.target.value)}
                                className="w-full px-2.5 py-1.5 bg-white border border-slate-250 rounded-lg text-[10px] font-bold outline-none cursor-pointer"
                                required
                              >
                                <option value="">Selecione uma atividade...</option>
                                {tasks.filter(t => t.day === activeDayFilter).map(t => (
                                  <option key={t.id} value={t.title}>{t.title} ({t.time})</option>
                                ))}
                                {tasks.filter(t => t.day === activeDayFilter).length === 0 && (
                                  <option disabled>Nenhuma atividade cadastrada hoje</option>
                                )}
                              </select>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[8px] font-black text-slate-500 uppercase mb-0.5 pl-0.5">Motivo (Ex: carro quebrou)</label>
                                <input
                                  type="text"
                                  placeholder="o carro quebrou..."
                                  value={changeReason}
                                  onChange={e => setChangeReason(e.target.value)}
                                  className="w-full px-2.5 py-1.5 bg-white border border-slate-250 rounded-lg text-xxs font-bold outline-none"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-[8px] font-black text-slate-500 uppercase mb-0.5 pl-0.5">Substituta (Ex: jogar blocos)</label>
                                  <input
                                  type="text"
                                  placeholder="assistir filme 🍿..."
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
                            📢 Enviar para Criança
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                )}

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
                      <div className="flex bg-slate-100 p-0.5 rounded-full border border-slate-200 w-fit shrink-0">
                        {(['daily', 'weekly', 'monthly'] as const).map(mode => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => { playBubble(); setScheduleViewMode(mode); }}
                            className={`px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                              scheduleViewMode === mode
                                ? 'bg-indigo-650 text-white shadow-xxs'
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            {mode === 'daily' ? 'Diária' : mode === 'weekly' ? 'Semanal' : 'Mensal'}
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
                          <span>📈 Progresso da Criança hoje</span>
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
                      ✨ Modelos de Atividades Rápidas
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
                      <option value="" disabled>Escolha um modelo rápido para adicionar...</option>
                      {PRESETS.map((preset, idx) => (
                        <option key={idx} value={idx}>
                          ➕ {preset.title} ({preset.time} - {preset.period === 'manhã' ? 'Manhã' : preset.period === 'tarde' ? 'Tarde' : 'Noite'})
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
                              1. Identificação
                            </span>
                            <span className="text-slate-355 text-[10px] select-none">➔</span>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider font-Outfit transition-all ${
                              formStep === 2 ? 'bg-indigo-600 text-white shadow-xxs' : 'bg-slate-200 text-slate-500'
                            }`}>
                              2. Didática & PECS
                            </span>
                          </div>
                        </div>

                        {/* STEP 1: Basic Identification */}
                        {formStep === 1 && (
                          <div className="flex flex-col gap-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xxs font-bold text-slate-500 uppercase mb-1">Título da Atividade</label>
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
                                  <label className="block text-xxs font-bold text-slate-500 uppercase mb-1">Horário (Previsão)</label>
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
                                  <label className="block text-xxs font-bold text-slate-500 uppercase mb-1">Período</label>
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
                                <label className="block text-xxs font-bold text-slate-500 uppercase mb-1">Domínio da Atividade (Categoria)</label>
                                <select
                                  value={taskCategory}
                                  onChange={e => setTaskCategory(e.target.value as any)}
                                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-705 outline-none text-sm font-bold cursor-pointer"
                                >
                                  <option value="AVD">AVD (Vida Diária) 🧼</option>
                                  <option value="Aprendizado">Aprendizado 📚</option>
                                  <option value="Lazer">Lazer 🧸</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-xxs font-bold text-slate-500 uppercase mb-1">Recorrência / Inclusão</label>
                                <select
                                  value={recurrenceMode}
                                  onChange={e => setRecurrenceMode(e.target.value as any)}
                                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-705 outline-none text-sm font-bold cursor-pointer"
                                >
                                  <option value="single">Apenas neste dia ({getDayLabel(activeDayFilter).replace(/ 📅| ☀️/, '')})</option>
                                  <option value="weekday">Repetir no dia da semana ({getRecurrenceWeekdayLabel(activeDayFilter).replace('Todas as ', '')})</option>
                                  <option value="monthly">Repetir em todos os dias do mês (Diária)</option>
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
                                Próximo Passo →
                              </button>
                            </div>
                          </div>
                        )}

                        {/* STEP 2: Sensory details & PECS */}
                        {formStep === 2 && (
                          <div className="flex flex-col gap-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="md:col-span-1">
                                <label className="block text-xxs font-bold text-slate-500 uppercase mb-1">Duração (Minutos)</label>
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
                                <label className="block text-xxs font-bold text-slate-500 uppercase mb-1">Descrição Detalhada / Instruções (Opcional)</label>
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
                                <label className="block text-xxs font-bold text-slate-500 uppercase mb-1">Cartão PECS (Ícone): {taskIcon}</label>
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
                                    <span className="text-[9px] text-slate-400 font-semibold">Pré-visualização:</span>
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
                      📚 Didática & Apoio de Mediação Clínica
                    </span>
                    <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                      Cada atividade pode possuir demandas de processamento sensorial. Entenda os símbolos e categorias nos cartões do seu filho:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5 mt-1 pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🧼</span>
                        <div className="text-[9px] font-bold text-slate-605">
                          <strong>AVD (Vida Diária):</strong> Higiene, alimentação, autocuidado.
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">📚</span>
                        <div className="text-[9px] font-bold text-slate-605">
                          <strong>Aprendizado:</strong> Terapia, tarefas escolares, leitura.
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🧸</span>
                        <div className="text-[9px] font-bold text-slate-605">
                          <strong>Lazer/Lúdico:</strong> Brincadeiras, tempo livre, reforço.
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🗣️</span>
                        <div className="text-[9px] font-bold text-slate-605">
                          <strong>Voz Familiar:</strong> Gravações de áudios para acalmar na transição.
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
                          <div className={`text-xs font-extrabold px-3.5 py-1.5 rounded-full border w-fit shadow-xxs select-none ${p.color}`}>
                            {p.label}
                          </div>

                          {periodTasks.length === 0 ? (
                            <div className="text-slate-400 text-xs border border-dashed border-slate-200/80 p-4 rounded-2xl text-center bg-slate-50/50">
                              Sem tarefas cadastradas para este período.
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
                                          ✏️ Editar Atividade
                                        </h4>
                                        <span className="text-[9px] font-bold text-slate-400">ID: {task.id.slice(-6)}</span>
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                          <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Título da Atividade</label>
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
                                            <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Horário</label>
                                            <input
                                              type="time"
                                              required
                                              value={editTaskTime}
                                              onChange={e => setEditTaskTime(e.target.value)}
                                              className="w-full px-2 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 outline-none text-xs font-bold focus:border-indigo-400"
                                            />
                                          </div>
                                          
                                          <div>
                                            <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Período</label>
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
                                          <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Duração (Minutos)</label>
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
                                          <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Instruções / Descrição</label>
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
                                          <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">PECS (Ícone): {editTaskIcon}</label>
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
                                                <span className="text-[8px] text-slate-400 font-semibold">Pré-visualização:</span>
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
                                          Salvar Alterações 💾
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
                                    className={`flex flex-col bg-white border-2 rounded-2xl hover:border-slate-350 transition-all group border-l-6 shadow-xxs hover:shadow-sm overflow-hidden`}
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
                                      className="flex items-center justify-between p-4 cursor-pointer select-none"
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



                </div>
              </motion.div>
            ) : activePanelTab === 'checkpoints' ? (
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
                      Checkpoints Clínicos & Evolução 🤝
                    </h3>
                    <p className="text-xs text-slate-400 font-semibold mt-0.5">
                      Acompanhamento por dia ou por semana das orientações e sessões dos especialistas.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { playBubble(); setNewCpOpen(!newCpOpen); if (!newCpDate) setNewCpDate(new Date().toISOString().split('T')[0]); }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-600 text-xs font-black rounded-full shadow-sm transition-all cursor-pointer font-Outfit border-none outline-none"
                  >
                    <Plus className="w-4 h-4" /> {newCpOpen ? 'Fechar Cadastro' : 'Novo Checkpoint Diário'}
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
                      <h4 className="font-black text-slate-800 font-Outfit">Novo Checkpoint Clínico Diário</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Data da Sessão</label>
                          <input
                            type="date"
                            required
                            value={newCpDate}
                            onChange={e => setNewCpDate(e.target.value)}
                            className="w-full bg-white border-2 border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:border-indigo-650 focus:bg-white outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Profissional / Terapeuta</label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: Dra. Ana Paula"
                            value={newCpName}
                            onChange={e => setNewCpName(e.target.value)}
                            className="w-full bg-white border-2 border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:border-indigo-650 focus:bg-white outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Especialidade</label>
                          <select
                            value={newCpRole}
                            onChange={e => setNewCpRole(e.target.value)}
                            className="w-full bg-white border-2 border-slate-200 rounded-xl px-3 py-2 text-xs font-black focus:border-indigo-655 focus:bg-white outline-none cursor-pointer"
                          >
                            <option value="Psicologia ABA">Psicologia ABA 🧠</option>
                            <option value="Terapia Ocupacional">Terapia Ocupacional 🧼</option>
                            <option value="Fonoterapia">Fonoterapia 🗣️</option>
                            <option value="Fisioterapia">Fisioterapia 🩺</option>
                            <option value="Psicoterapia">Psicoterapia 💬</option>
                            <option value="Psicomotricidade">Psicomotricidade 🏃</option>
                            <option value="Outro">Outro 🧑‍⚕️</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Feedback / Orientações para Casa</label>
                          <textarea
                            required
                            placeholder="Instruções práticas de regulação, reforço visual ou condutas para a família adotar..."
                            value={newCpFeedback}
                            onChange={e => setNewCpFeedback(e.target.value)}
                            className="w-full p-3 bg-white border-2 border-slate-200 rounded-xl text-xs font-semibold focus:border-indigo-655 focus:bg-white outline-none h-20 resize-none"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Notas do Responsável / Relato (Opcional)</label>
                          <textarea
                            placeholder="Anotações dos pais sobre como a criança se comportou na sessão ou dúvidas..."
                            value={newCpNotes}
                            onChange={e => setNewCpNotes(e.target.value)}
                            className="w-full p-3 bg-white border-2 border-slate-200 rounded-xl text-xs font-semibold focus:border-indigo-655 focus:bg-white outline-none h-20 resize-none"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 mt-1">
                        <button
                          type="button"
                          onClick={() => { playBubble(); setNewCpOpen(false); }}
                          className="px-4 py-2 bg-slate-200 text-slate-705 text-xs font-bold rounded-xl active:scale-95 cursor-pointer border-none outline-none"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={creatingCheckpoint}
                          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-750 text-white text-xs font-black rounded-xl shadow-sm active:scale-95 cursor-pointer disabled:opacity-50 border-none outline-none font-Outfit"
                        >
                          {creatingCheckpoint ? 'Registrando...' : 'Gravar Checkpoint'}
                        </button>
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
                    Nenhuma sessão configurada. Certifique-se de selecionar uma criança válida no menu lateral.
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
                              {cp.date ? `Sessão: ${new Date(cp.date + 'T00:00:00').toLocaleDateString('pt-BR')}` : `Semana ${cp.weekNum}`}
                            </span>
                            <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border shadow-xxs ${
                              cp.status === 'completed' 
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-250' 
                                : 'bg-amber-50 text-amber-600 border-amber-200'
                            }`}>
                              {cp.status === 'completed' ? 'Concluído ✓' : 'Pendente'}
                            </span>
                          </div>

                          {isEditing ? (
                            <div className="flex flex-col gap-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Profissional</label>
                                  <input 
                                    type="text" 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-indigo-500" 
                                    placeholder="Nome do profissional" 
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Especialidade</label>
                                  <select 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-extrabold text-slate-700 focus:outline-indigo-500" 
                                    value={editRole}
                                    onChange={(e) => setEditRole(e.target.value)}
                                  >
                                    <option value="Psicologia ABA">Psicologia ABA 🧠</option>
                                    <option value="Terapia Ocupacional">Terapia Ocupacional 🧼</option>
                                    <option value="Fonoterapia">Fonoterapia 🗣️</option>
                                    <option value="Fisioterapia">Fisioterapia 🩺</option>
                                    <option value="Psicoterapia">Psicoterapia 💬</option>
                                    <option value="Psicomotricidade">Psicomotricidade 🏃</option>
                                    <option value="Outro">Outro 🧑‍⚕️</option>
                                  </select>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Data da Sessão</label>
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
                                    Sessão Realizada
                                  </label>
                                </div>
                              </div>

                              <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Observações dos Pais</label>
                                <textarea 
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-indigo-500 h-16 resize-none" 
                                  placeholder="Como foi o comportamento em casa nesta semana?"
                                  value={editNotes}
                                  onChange={(e) => setEditNotes(e.target.value)}
                                />
                              </div>

                              <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Recomendações do Profissional</label>
                                <textarea 
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-indigo-500 h-16 resize-none" 
                                  placeholder="Feedback e orientações dadas para a semana..."
                                  value={editFeedback}
                                  onChange={(e) => setEditFeedback(e.target.value)}
                                />
                              </div>

                              <div className="flex gap-2 justify-end mt-2">
                                <button 
                                  onClick={() => { playBubble(); setEditingCheckpointId(null); }}
                                  className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-755 text-xs font-black rounded-xl cursor-pointer active:scale-95 transition-all"
                                >
                                  Cancelar
                                </button>
                                <button 
                                  onClick={() => handleSaveCheckpoint(cp.id)}
                                  disabled={savingCheckpointId === cp.id}
                                  className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-black rounded-xl cursor-pointer active:scale-95 transition-all shadow-sm disabled:opacity-50"
                                >
                                  {savingCheckpointId === cp.id ? 'Salvando...' : 'Salvar Alterações 💾'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-3">
                              {cp.professionalName ? (
                                <div className="bg-slate-50/50 border border-slate-150 p-3 rounded-xl flex flex-col gap-1.5 shadow-xxs">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="font-extrabold text-slate-800">🧑‍⚕️ {cp.professionalName}</span>
                                    <span className="text-xxs font-black bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-full uppercase tracking-wider">{cp.professionalRole}</span>
                                  </div>
                                  {cp.date && (
                                    <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                      <span>📅 Sessão:</span> {cp.date.split('-').reverse().join('/')}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-slate-400 text-xxs border border-dashed border-slate-200 p-3.5 rounded-xl text-center font-semibold bg-slate-50/20">
                                  Nenhuma sessão registrada para esta semana.
                                </div>
                              )}

                              {cp.notes && (
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Observações dos Pais</span>
                                  <p className="text-xs text-slate-650 leading-normal font-medium bg-slate-50/30 p-2.5 rounded-lg border border-slate-150/50 whitespace-pre-wrap">{cp.notes}</p>
                                </div>
                              )}

                              {cp.feedback && (
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-[9px] font-black uppercase tracking-wider text-indigo-400">Recomendações Clínicas</span>
                                  <p className="text-xs text-indigo-950 leading-normal font-medium bg-indigo-50/20 p-2.5 rounded-lg border border-indigo-100 whitespace-pre-wrap">{cp.feedback}</p>
                                </div>
                              )}

                              <button
                                onClick={() => startEditingCheckpoint(cp)}
                                className="w-full mt-1.5 py-2.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-750 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 text-xs font-black rounded-xl transition-all cursor-pointer shadow-xxs active:scale-98 flex items-center justify-center gap-1 font-Outfit"
                              >
                                {cp.professionalName ? 'Editar Registro 📝' : 'Registrar Checkpoint 🤝'}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            ) : activePanelTab === 'reports' ? (
              
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
                    <h3 className="font-extrabold text-slate-850 text-xl">Relatórios Clínicos Avançados</h3>
                    <p className="text-sm text-slate-400 max-w-sm mt-1.5 leading-relaxed font-semibold">
                      Gere laudos detalhados de aderência de rotina, picos de engajamento e exportação otimizada para terapeutas e médicos.
                    </p>
                  </div>
                  <div className="bg-indigo-50 border border-indigo-150 p-4.5 rounded-2xl text-left max-w-sm flex gap-3 shadow-xxs">
                    <span className="text-xl">✨</span>
                    <p className="text-xs text-indigo-700 leading-relaxed font-bold">
                      A assinatura Premium desbloqueia relatórios em PDF com design de laudo clínico profissional, além de tarefas diárias ilimitadas.
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
                      <h3 className="font-extrabold text-slate-850 text-xl">Relatório de Evolução Clínica</h3>
                      <p className="text-xs text-slate-400 font-semibold mt-0.5">
                        Métricas analíticas consolidadas de conformidade de rotina.
                      </p>
                      {/* Clinical Metadata Bar */}
                      {(() => {
                        const currentDayNum = new Date().getDate();
                        return (
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-[11px] text-slate-500 font-bold bg-slate-50 border border-slate-150 px-3 py-1.5 rounded-lg w-fit">
                            <span>Criança: <span className="text-indigo-650 font-black">{activeChild?.name}</span></span>
                            <span className="text-slate-300">|</span>
                            <span>Diagnóstico: <span className="text-slate-700 font-black">{activeChild?.diagnosis || 'Não informado'}</span></span>
                            <span className="text-slate-300">|</span>
                            <span>Hiperfoco Ativo: <span className="text-sky-600 font-black">{activeChild?.childHyperfocus || 'Não cadastrado'}</span></span>
                            <span className="text-slate-300">|</span>
                            <span>Período: <span className="text-slate-700 font-black">Dia 1 ao {currentDayNum}</span></span>
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
                    const trendText = trend > 0 ? `▲ +${trend}%` : trend < 0 ? `▼ ${trend}%` : 'Estável';
                    const trendColor = trend > 0 ? 'text-emerald-700 bg-emerald-50 border-emerald-100' : trend < 0 ? 'text-amber-700 bg-amber-50 border-amber-100' : 'text-slate-600 bg-slate-50 border-slate-100';

                    // 4. Emotional Stability Indicator
                    const totalLogs = sensoryLogs.length;
                    const regulatedLogs = sensoryLogs.filter(log => log.mood === 'feliz' || log.mood === 'calmo').length;
                    const stabilityRate = totalLogs > 0 ? Math.round((regulatedLogs / totalLogs) * 100) : 100;
                    
                    let stabilityLevel = 'Regular ⚖️';
                    let stabilityClass = 'text-amber-700 bg-amber-50 border-amber-250';
                    let stabilityDesc = 'Oscilações moderadas de humor observadas.';
                    if (stabilityRate >= 80) {
                      stabilityLevel = 'Excelente 🌟';
                      stabilityClass = 'text-emerald-700 bg-emerald-50 border-emerald-250';
                      stabilityDesc = 'Humor predominantemente calmo ou feliz.';
                    } else if (stabilityRate < 50) {
                      stabilityLevel = 'Atenção ⚠️';
                      stabilityClass = 'text-red-700 bg-red-50 border-red-250';
                      stabilityDesc = 'Frequentes episódios de agitação ou desregulação.';
                    }
                    const stabilityBadgeColor = stabilityRate >= 80 ? 'text-emerald-700 bg-emerald-50 border-emerald-100' : stabilityRate >= 50 ? 'text-amber-700 bg-amber-50 border-amber-100' : 'text-rose-700 bg-rose-50 border-rose-100';

                    // 5. Sensory Crisis Frequency
                    const oneDayMs = 24 * 60 * 60 * 1000;
                    const nowTime = new Date().getTime();
                    const recentCrises = sensoryLogs.filter(log => log.crisisOccurred && (nowTime - new Date(log.timestamp).getTime()) <= 7 * oneDayMs).length;
                    const priorCrises = sensoryLogs.filter(log => log.crisisOccurred && (nowTime - new Date(log.timestamp).getTime()) > 7 * oneDayMs && (nowTime - new Date(log.timestamp).getTime()) <= 14 * oneDayMs).length;
                    const crisisDiff = recentCrises - priorCrises;
                    
                    const crisisTrendText = crisisDiff < 0 ? `▼ ${Math.abs(crisisDiff)}` : crisisDiff > 0 ? `▲ +${crisisDiff}` : 'Estável';
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
                      if (val >= 80) return 'Estável 🟢';
                      if (val >= 50) return 'Moderado ⚠️';
                      return 'Crítico 🚨';
                    };

                    // Generate Dynamic Clinical Insights
                    const generateClinicalInsights = () => {
                      const list = [];
                      if (rate < 80 && rate > 0) {
                        list.push({
                          type: 'warning',
                          title: 'Aderência Geral sob Atenção',
                          text: 'A taxa de conclusão da rotina está abaixo de 80%. Para consolidar hábitos e previsibilidade em crianças com TEA, sugerimos simplificar a rotina, reduzir a duração de tarefas difíceis ou aumentar o valor dos tokens.'
                        });
                      } else if (rate >= 80) {
                        list.push({
                          type: 'success',
                          title: 'Aderência Clínica Excelente',
                          text: 'A criança demonstra alta estabilidade e previsibilidade nas rotinas. Continue utilizando reforço positivo imediato e aproveite para manter a rigidez cognitiva baixa.'
                        });
                      }
                      
                      if (stabilityRate < 60) {
                        list.push({
                          type: 'danger',
                          title: 'Alerta de Regulação Emocional',
                          text: 'Flutuações de humor frequentes ou crises recentes detectadas. Recomendamos ativar o modelo de "Regulação Sensorial" no calendário, reduzir exigências acadêmicas e dar pausas no refúgio sensorial.'
                        });
                      }
                      
                      const minPeriod = Math.min(morningComp, afternoonComp, eveningComp);
                      if (minPeriod === morningComp && morningTasks.length > 0 && morningComp < 70) {
                        list.push({
                          type: 'info',
                          title: 'Foco na Transição Matinal',
                          text: 'O período da manhã apresenta menor aderência. Tente introduzir 10 minutos de previsibilidade com aviso visual antes de iniciar as tarefas matinais.'
                        });
                      } else if (minPeriod === eveningComp && eveningTasks.length > 0 && eveningComp < 70) {
                        list.push({
                          type: 'info',
                          title: 'Ajuste de Rotina Noturna',
                          text: 'Menor aderência identificada à noite. Tente restringir telas e atividades de alta excitação após as 19:30, facilitando o relaxamento natural para o sono.'
                        });
                      }

                      const getCat = (t: Task) => t.category || 'AVD';
                      const studyTotal = elapsedTasks.filter(t => getCat(t) === 'Aprendizado').length;
                      const studyDone = elapsedTasks.filter(t => getCat(t) === 'Aprendizado' && t.isCompleted).length;
                      const studyRate = studyTotal > 0 ? Math.round((studyDone / studyTotal) * 100) : 0;
                      
                      if (studyRate > 80 && studyTotal > 0) {
                        list.push({
                          type: 'success',
                          title: 'Excelente Foco Acadêmico',
                          text: 'Engajamento muito alto em tarefas cognitivas/aprendizado. Ótimo período para introduzir novos conceitos terapêuticos.'
                        });
                      }

                      if (list.length === 0) {
                        list.push({
                          type: 'info',
                          title: 'Análise Clínica em Andamento',
                          text: 'Continue registrando o cumprimento das atividades e o humor no diário comportamental. Isso permitirá ao nosso preditor fornecer sugestões terapêuticas mais direcionadas.'
                        });
                      }

                      return list.slice(0, 3);
                    };

                    const clinicalInsights = generateClinicalInsights();

                    return (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="bg-indigo-50/50 border border-indigo-100/50 p-4.5 rounded-2xl flex flex-col gap-1.5 shadow-xxs hover:shadow-xs transition-all hover:scale-[1.01]">
                            <span className="text-xxs font-black text-indigo-500 uppercase tracking-widest">Aderência Acumulada</span>
                            <div className="flex items-baseline gap-2">
                              <span className="text-3xl font-black text-indigo-750">{rate}%</span>
                              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md border ${trendColor} whitespace-nowrap`}>
                                {trendText} vs sem. ant.
                              </span>
                            </div>
                            <p className="text-xxs text-slate-400 font-semibold leading-relaxed">Conclusão de tarefas nos dias decorridos do mês.</p>
                          </div>

                          <div className="bg-amber-55/60 border border-amber-100/50 p-4.5 rounded-2xl flex flex-col gap-1.5 shadow-xxs hover:shadow-xs transition-all hover:scale-[1.01]">
                            <span className="text-xxs font-black text-amber-600 uppercase tracking-widest">Conformidade Diária</span>
                            <div className="flex items-baseline gap-2">
                              <span className="text-3xl font-black text-amber-700">{avgDailyCompleted.toFixed(1)} <span className="text-sm font-semibold text-slate-400">/ dia</span></span>
                              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md border ${complianceBadgeColor} whitespace-nowrap`}>
                                {avgDailyCompliance}%
                              </span>
                            </div>
                            <p className="text-xxs text-slate-400 font-semibold leading-relaxed">Média de {avgDailyCompleted.toFixed(1)} de {avgDailyScheduled.toFixed(1)} atividades por dia decorrido.</p>
                          </div>

                          <div className="bg-teal-50/50 border border-teal-100/50 p-4.5 rounded-2xl flex flex-col gap-1.5 shadow-xxs hover:shadow-xs transition-all hover:scale-[1.01]">
                            <span className="text-xxs font-black text-teal-600 uppercase tracking-widest">Estabilidade Emocional</span>
                            <div className="flex items-baseline gap-2">
                              <span className="text-3xl font-black text-teal-700">{stabilityRate}%</span>
                              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md border ${stabilityBadgeColor} whitespace-nowrap`}>
                                {stabilityLevel}
                              </span>
                            </div>
                            <p className="text-xxs text-slate-400 font-semibold leading-relaxed">{stabilityDesc}</p>
                          </div>

                          <div className="bg-rose-50/50 border border-rose-100/50 p-4.5 rounded-2xl flex flex-col gap-1.5 shadow-xxs hover:shadow-xs transition-all hover:scale-[1.01]">
                            <span className="text-xxs font-black text-rose-600 uppercase tracking-widest">Frequência de Crises</span>
                            <div className="flex items-baseline gap-2">
                              <span className="text-3xl font-black text-rose-700">{recentCrises} <span className="text-sm font-semibold text-slate-400">crise{recentCrises !== 1 ? 's' : ''}</span></span>
                              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md border ${crisisTrendColor} whitespace-nowrap`}>
                                {crisisTrendText} vs sem. ant.
                              </span>
                            </div>
                            <p className="text-xxs text-slate-400 font-semibold leading-relaxed">Ocorrências nos últimos 7 dias comparadas à semana anterior.</p>
                          </div>
                        </div>

                        {/* Dynamic Clinical Insights Panel */}
                        <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col gap-4 shadow-xxs hover:shadow-xs transition-all">
                          <h4 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1.5 font-Outfit">
                            💡 Recomendações e Insights Clínicos Customizados (ABA / T.O.)
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
                            <h4 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">Aderência por Período de Dia</h4>
                            <div className="flex flex-col gap-3">
                              <div>
                                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                                  <span>Manhã ☀️</span>
                                  <span>{morningComp}% <span className="text-slate-400 font-semibold">({getRatingText(morningComp).replace(/[^a-zA-Záéíóúâêôãõç\s]/g, '')})</span></span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${morningComp}%` }} />
                                </div>
                              </div>
                              <div>
                                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                                  <span>Tarde ⛅</span>
                                  <span>{afternoonComp}% <span className="text-slate-400 font-semibold">({getRatingText(afternoonComp).replace(/[^a-zA-Záéíóúâêôãõç\s]/g, '')})</span></span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                                  <div className="bg-blue-500 h-full rounded-full" style={{ width: `${afternoonComp}%` }} />
                                </div>
                              </div>
                              <div>
                                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                                  <span>Noite 🌙</span>
                                  <span>{eveningComp}% <span className="text-slate-400 font-semibold">({getRatingText(eveningComp).replace(/[^a-zA-Záéíóúâêôãõç\s]/g, '')})</span></span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                                  <div className="bg-indigo-650 h-full rounded-full" style={{ width: `${eveningComp}%` }} />
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="bg-slate-50 border border-slate-200/50 p-5 rounded-2xl flex flex-col gap-4 shadow-xxs">
                            <h4 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">Aderência por Domínio de Atividade (ABA)</h4>
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
                                        <span>AVD (Vida Diária) 🧼</span>
                                        <span>{avdRate}% ({avdDone}/{avdTotal}) <span className="text-slate-400 font-semibold">({getRatingText(avdRate).replace(/[^a-zA-Záéíóúâêôãõç\s]/g, '')})</span></span>
                                      </div>
                                      <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                                        <div className="bg-teal-500 h-full rounded-full" style={{ width: `${avdRate}%` }} />
                                      </div>
                                    </div>
                                    <div>
                                      <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                                        <span>Aprendizado 📚</span>
                                        <span>{studyRate}% ({studyDone}/{studyTotal}) <span className="text-slate-400 font-semibold">({getRatingText(studyRate).replace(/[^a-zA-Záéíóúâêôãõç\s]/g, '')})</span></span>
                                      </div>
                                      <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                                        <div className="bg-indigo-650 h-full rounded-full" style={{ width: `${studyRate}%` }} />
                                      </div>
                                    </div>
                                    <div>
                                      <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                                        <span>Lazer 🧸</span>
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

                        {/* AI Sensory Overload Predictor Panel */}
                        <div className="bg-slate-50 border border-slate-200/50 p-5 rounded-2xl flex flex-col gap-4 shadow-xxs">
                          <h4 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1.5 select-none font-Outfit">
                            🤖 IA Preditora de Sobrecarga (Risco de Meltdown)
                          </h4>
                          
                          <div className={`p-4 rounded-xl border flex flex-col gap-2 ${riskInfo.class}`}>
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-black uppercase text-slate-800">Termômetro de Risco:</span>
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
                            <span className="text-[10px] text-slate-400 font-semibold text-right block mt-0.5">Probabilidade: {riskInfo.percentage}%</span>

                            <p className="text-xs font-bold leading-relaxed mt-1 text-slate-700">
                              {riskInfo.desc}
                            </p>
                          </div>
                          <span className="text-[9px] text-slate-450 italic font-semibold">
                            *Nota: Este cálculo utiliza dados comportamentais de latência de rotina e diários emocionais. Não substitui consulta médica.
                          </span>

                          {/* Correlation Insights Section */}
                          <div className="border-t border-slate-200/60 pt-4 flex flex-col gap-2">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider font-Outfit">🔍 Análise de Gatilhos & Correlações (ABA):</span>
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
                                Identifique picos de desregulação sensorial da criança mapeados por geolocalização.
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
                            🧠 Registro de Desregulação Sensorial e Crises
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
                            <label className="text-[10px] font-black text-red-700 uppercase">Anotar Evento de Desregulação</label>
                            <textarea
                              value={crisisNotes}
                              onChange={e => setCrisisNotes(e.target.value)}
                              placeholder="Resumo geral ou observações sobre a crise"
                              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:border-red-400 h-14 resize-none"
                            />

                            <div className="flex flex-col gap-2 mt-1">
                              <div>
                                <label className="block text-[8px] font-black text-slate-500 uppercase mb-0.5 font-Outfit">Antecedente (A) - O que ocorreu logo antes?</label>
                                <input
                                  type="text"
                                  value={crisisAntecedent}
                                  onChange={e => setCrisisAntecedent(e.target.value)}
                                  placeholder="Ex: Barulho de liquidificador, transição de atividade"
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
                                <label className="block text-[8px] font-black text-slate-500 uppercase mb-0.5 font-Outfit">Consequência (C) - Qual foi a intervenção?</label>
                                <input
                                  type="text"
                                  value={crisisConsequence}
                                  onChange={e => setCrisisConsequence(e.target.value)}
                                  placeholder="Ex: Fone abafador de ruídos, abraço apertado"
                                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:border-red-450"
                                />
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 my-1.5">
                              <div>
                                <label className="block text-[8px] font-black text-slate-500 uppercase mb-0.5">Localização</label>
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
                                <label className="block text-[8px] font-black text-slate-500 uppercase mb-0.5">Nível de Ruído (dB): {crisisDecibels}dB</label>
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
                              {savingCrisis ? 'Gravando...' : 'Gravar no diário'}
                            </button>
                          </form>

                          <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
                            <span className="text-[9px] font-black text-slate-400 uppercase">Diário Emocional e Crises Recentes</span>
                            {sensoryLogs.length === 0 ? (
                              <p className="text-xxs text-slate-400 italic text-center py-2">Sem registros de regulação emocional.</p>
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
                                <h1 className="text-3xl font-black text-indigo-650 tracking-tight">Rotina Animada - Laudo Clínico</h1>
                                <p className="text-sm text-slate-500 font-semibold mt-1">SaaS de Predictabilidade de Rotinas no Espectro Autista</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs font-bold text-slate-450">Data de Geração:</p>
                                <p className="text-sm font-black text-slate-655">{new Date().toLocaleDateString()}</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-8 border-b border-slate-200 pb-6">
                              <div>
                                <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 pb-1.5">Informações Gerais</h3>
                                <p className="text-xs font-bold text-slate-700 mt-2">Responsável: <span className="font-extrabold">{currentUser?.email}</span></p>
                                <p className="text-xs font-bold text-slate-700 mt-1.5">Criança: <span className="font-extrabold">{activeChild?.name || 'Não cadastrado'}</span></p>
                                <p className="text-xs font-bold text-slate-700 mt-1.5">Hiperfoco Ativo: <span className="font-extrabold">{activeChild?.childHyperfocus || 'Não cadastrado'}</span></p>
                                <p className="text-xs font-bold text-slate-700 mt-1.5">Diagnóstico: <span className="font-extrabold">{activeChild?.diagnosis || 'Não informado'}</span></p>
                              </div>
                              <div>
                                <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 pb-1.5">Resumo Comportamental</h3>
                                <p className="text-xs font-bold text-slate-700 mt-2">Aderência Acumulada: <span className="font-extrabold text-indigo-750">{rate}% ({getRatingText(rate).replace(/[^a-zA-Záéíóúâêôãõç\s]/g, '').trim()})</span></p>
                                <p className="text-xs font-bold text-slate-700 mt-1.5">Média Diária: <span className="font-extrabold text-amber-700">{avgDailyCompleted.toFixed(1)} de {avgDailyScheduled.toFixed(1)} ativ. ({avgDailyCompliance}%)</span></p>
                                <p className="text-xs font-bold text-slate-700 mt-1.5">Risco de Sobrecarga (Meltdown): <span className="font-extrabold text-red-700">{riskInfo.level.replace(/[^a-zA-Záéíóúâêôãõç\s]/g, '').trim()} ({riskInfo.percentage}%)</span></p>
                              </div>
                              <div>
                                <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 pb-1.5">Regulação & Humor</h3>
                                <p className="text-xs font-bold text-slate-700 mt-2">Estabilidade Emocional: <span className="font-extrabold text-teal-700">{stabilityRate}% ({stabilityLevel.replace(/[^a-zA-Záéíóúâêôãõç\s]/g, '').trim()})</span></p>
                                <p className="text-xs font-bold text-slate-700 mt-1.5">Crises Sensoriais (7d): <span className="font-extrabold text-rose-700">{recentCrises} crises ({crisisTrendText.replace(/[^a-zA-Z0-9\+\-\s]/g, '').trim()})</span></p>
                                <p className="text-xs font-bold text-slate-700 mt-1.5">Barreira Infantil: <span className="font-extrabold">{lockType === 'pin' ? 'PIN' : lockType === 'math' ? 'Matemática' : 'Nenhuma'}</span></p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8 border-b border-slate-200 pb-4">
                              <div>
                                <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-3">Aderência por Período de Dia</h3>
                                <div className="flex flex-col gap-2">
                                  <p className="text-xs text-slate-700 font-bold">☀️ Período da Manhã: <span className="font-extrabold text-indigo-650">{morningComp}% de conclusão ({getRatingText(morningComp).replace(/[^a-zA-Záéíóúâêôãõç\s]/g, '').trim()})</span></p>
                                  <p className="text-xs text-slate-700 font-bold">⛅ Período da Tarde: <span className="font-extrabold text-indigo-650">{afternoonComp}% de conclusão ({getRatingText(afternoonComp).replace(/[^a-zA-Záéíóúâêôãõç\s]/g, '').trim()})</span></p>
                                  <p className="text-xs text-slate-700 font-bold">🌙 Período da Noite: <span className="font-extrabold text-indigo-650">{eveningComp}% de conclusão ({getRatingText(eveningComp).replace(/[^a-zA-Záéíóúâêôãõç\s]/g, '').trim()})</span></p>
                                </div>
                              </div>
                              <div>
                                <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-3">Aderência por Domínio (ABA)</h3>
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
                                        <p className="text-xs text-slate-700 font-bold">🧼 Vida Diária (AVD): <span className="font-extrabold text-indigo-650">{avdRate}% ({avdDone}/{avdTotal}) - {getRatingText(avdRate).replace(/[^a-zA-Záéíóúâêôãõç\s]/g, '').trim()}</span></p>
                                        <p className="text-xs text-slate-700 font-bold">📚 Aprendizado: <span className="font-extrabold text-indigo-650">{studyRate}% ({studyDone}/{studyTotal}) - {getRatingText(studyRate).replace(/[^a-zA-Záéíóúâêôãõç\s]/g, '').trim()}</span></p>
                                        <p className="text-xs text-slate-700 font-bold">🧸 Lazer e Recreação: <span className="font-extrabold text-indigo-650">{playRate}% ({playDone}/{playTotal}) - {getRatingText(playRate).replace(/[^a-zA-Záéíóúâêôãõç\s]/g, '').trim()}</span></p>
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
                              <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">Diário Emocional e Registros de Desregulação</h3>
                              <div className="flex flex-col gap-2 mt-3">
                                {sensoryLogs.length === 0 ? (
                                  <p className="text-xs text-slate-400 italic">Sem registros clínicos neste período.</p>
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
                              <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">Histórico de Atividades Realizadas</h3>
                              <div className="flex flex-col gap-1.5 mt-3">
                                {tasks.map(task => (
                                  <div key={task.id} className="flex justify-between border-b border-slate-100 pb-1 text-xs">
                                    <span className="font-bold text-slate-700">{task.day.toUpperCase()} ({task.period}) - {task.time} - {task.title}</span>
                                    <span className={`font-black uppercase tracking-wider ${task.isCompleted ? 'text-emerald-600' : 'text-amber-600'}`}>
                                      {task.isCompleted ? 'CONCLUÍDO ✓' : 'PENDENTE'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="mt-16 flex justify-between items-end border-t border-slate-200 pt-12">
                              <div className="text-center w-56 border-t border-slate-400 pt-2 text-xs font-bold text-slate-400">
                                Responsável
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
                  <h3 className="font-extrabold text-slate-800 text-lg">Trilha de Logs Imutáveis</h3>
                  <p className="text-xs text-slate-400">
                    Histórico imutável de todas as modificações estruturais da agenda (CFR-compliant).
                  </p>
                </div>

                <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-2 divide-y divide-slate-100">
                  {logs.length === 0 ? (
                    <p className="text-slate-400 text-xs text-center py-6">Nenhum log registrado ainda.</p>
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
                            <span>{log.details}</span>
                          </div>
                          <span className="text-[9px] text-slate-400 font-semibold block mt-1">
                            Autor: {log.responsibleEmail}
                          </span>
                        </div>
                      </div>
                    ))

                  )}
                </div>
              </motion.div>
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
            title="Imprimir cartões PECS"
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
                <h3 className="text-xl font-black text-indigo-950 tracking-tight">Cadastrar Criança 👶</h3>
                <button
                  onClick={() => { playBubble(); setNewChildModalOpen(false); }}
                  className="text-slate-400 hover:text-slate-600 font-extrabold text-sm p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer border-none bg-transparent"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleRegisterChild} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nome da Criança</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Joãozinho"
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
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gênero</label>
                  <select
                    value={newChildGender}
                    onChange={e => setNewChildGender(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-850"
                  >
                    <option value="Não Informado">Não Informado</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Feminino">Feminino</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5 text-left">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Diagnóstico Clínico (opcional)</label>
                  <select
                    value={newChildDiagnosis}
                    onChange={e => setNewChildDiagnosis(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-850"
                  >
                    <option value="Não Informado">Não Informado</option>
                    <option value="TEA Nível 1">TEA Nível 1</option>
                    <option value="TEA Nível 2">TEA Nível 2</option>
                    <option value="TEA Nível 3">TEA Nível 3</option>
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
                <h3 className="text-2xl font-black text-amber-200 tracking-tight">Evolua para o Plano Premium</h3>
                <p className="text-xs text-indigo-200 font-semibold mt-1">
                  Desbloqueie o potencial máximo da Rotina Animada
                </p>
              </div>

              {/* Benefits list */}
              <div className="flex flex-col gap-3 text-left w-full bg-slate-900/40 border border-slate-700/30 p-5 rounded-2xl shadow-inner">
                <div className="flex gap-2.5 items-start text-xs font-bold text-indigo-100">
                  <span className="text-amber-400 text-sm">✓</span>
                  <span><strong>Tarefas Diárias Ilimitadas:</strong> Crie quantas rotinas precisar na agenda do seu filho.</span>
                </div>
                <div className="flex gap-2.5 items-start text-xs font-bold text-indigo-100">
                  <span className="text-amber-400 text-sm">✓</span>
                  <span><strong>Relatório de Aderência Clínica:</strong> Métricas em tempo real e exportação profissional em PDF para médicos/terapeutas.</span>
                </div>
                <div className="flex gap-2.5 items-start text-xs font-bold text-indigo-100">
                  <span className="text-amber-400 text-sm">✓</span>
                  <span><strong>Feed de Notificações em Tempo Real:</strong> Alertas imediatos em seu painel quando o filho cumpre uma missão.</span>
                </div>
              </div>

              {/* Price Tag */}
              <div className="text-center">
                <span className="text-xxs uppercase tracking-widest text-indigo-300 font-black">Assinatura Mensal</span>
                <div className="text-4xl font-black text-white mt-0.5">R$ 29,90<span className="text-sm font-medium text-indigo-300">/mês</span></div>
                <span className="text-[10px] text-slate-400 block mt-1 font-semibold">* Cancelamento gratuito a qualquer momento com um único clique.</span>
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
                                triggerStatus('Assinatura Premium ativa (Simulação)! Obrigado 💎');
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
                          triggerStatus('Assinatura Premium ativa (Simulação local)! Obrigado 💎');
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
                    Voltar ao Plano Grátis
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PECS Printable Grid */}
      <div className="print-only">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-[#0f172a] font-Outfit">Cartões de Rotina PECS</h1>
          <p className="text-sm text-slate-500 font-bold mt-1">Rotina de {activeChild?.name || 'seu filho'}</p>
        </div>
        <div className="pecs-print-grid">
          {tasks.map(task => (
            <div key={task.id} className="pecs-card">
              <span className="pecs-card-icon">{task.icon || '📅'}</span>
              <h3 className="pecs-card-title">{task.title}</h3>
              <p className="text-xs text-slate-500 font-bold mt-1.5">Horário: {task.time}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

export default function ParentDashboard() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f172a] text-white gap-3">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs font-bold text-slate-300 animate-pulse">Carregando painel...</span>
      </div>
    }>
      <ParentDashboardContent />
    </Suspense>
  );
}
