"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { firebaseBridge, Task, UserProfile } from '../../../lib/firebase-bridge';
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
  RotateCcw
} from 'lucide-react';
import Link from 'next/link';

const DAYS_OF_WEEK = [
  { key: 'segunda', label: 'Segunda-feira 📅' },
  { key: 'terca', label: 'Terça-feira 📅' },
  { key: 'quarta', label: 'Quarta-feira 📅' },
  { key: 'quinta', label: 'Quinta-feira 📅' },
  { key: 'sexta', label: 'Sexta-feira 📅' },
  { key: 'sabado', label: 'Sábado ☀️' },
  { key: 'domingo', label: 'Domingo ☀️' }
];

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
  { title: 'Dormir / Descanso', time: '21:30', period: 'noite' as const }
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
  }
};


export default function ParentDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  
  // Mascot Collie state for parent dashboard
  const [collieState, setCollieState] = useState<CollieState>('idle');
  const [activeTipIdx, setActiveTipIdx] = useState(0);

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

      const dayLabel = DAYS_OF_WEEK.find(d => d.key === activeDayFilter)?.label.replace(/ 📅| ☀️/, '');
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

  // Load a complete Clinical Preset Template for a Day or the Entire Week
  const handleLoadTemplate = async (templateKey: keyof typeof CLINICAL_TEMPLATES, target: 'day' | 'week') => {
    const template = CLINICAL_TEMPLATES[templateKey];
    
    // Check billing constraints (limits)
    if (plan === 'free') {
      if (target === 'day' && template.tasks.length > 3) {
        playMarimba(180, 0.2);
        setShowPaywall(true);
        return;
      }
      if (target === 'week') {
        playMarimba(180, 0.2);
        setShowPaywall(true);
        return;
      }
    }

    const confirmMsg = target === 'day'
      ? `Deseja realmente carregar o modelo "${template.name}" para o dia atual? Isso substituirá as tarefas existentes de ${DAYS_OF_WEEK.find(d => d.key === activeDayFilter)?.label.replace(/ 📅| ☀️/, '')}.`
      : `Deseja realmente carregar o modelo "${template.name}" para TODOS OS DIAS da semana? Isso substituirá todas as tarefas existentes de segunda a domingo.`;

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
        
        const dayLabel = DAYS_OF_WEEK.find(d => d.key === activeDayFilter)?.label.replace(/ 📅| ☀️/, '');
        await immutableLogger.logChange(
          'RESET_ROUTINE',
          `Carregou o modelo "${template.name}" na agenda de ${dayLabel}.`,
          currentUser?.email
        );
        triggerStatus(`Modelo aplicado para ${dayLabel}!`);
      } else {
        // Replace all week tasks
        const allNewTasks: any[] = [];
        DAYS_OF_WEEK.forEach(day => {
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
          `Carregou o modelo "${template.name}" para toda a semana (segunda a domingo).`,
          currentUser?.email
        );
        triggerStatus(`Modelo aplicado para toda a semana!`);
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
  const [hyperfocus, setHyperfocus] = useState('');
  const [lockType, setLockType] = useState<'pin' | 'math' | 'none'>('math');
  const [parentPinCode, setParentPinCode] = useState('1234');
  const [plan, setPlan] = useState<'free' | 'premium'>('free');
  const [sensorySpeed, setSensorySpeed] = useState<0.7 | 1.0 | 1.2>(1.0);
  const [sensorySound, setSensorySound] = useState<'marimba' | 'bubble' | 'silent'>('marimba');
  const [sensoryVisuals, setSensoryVisuals] = useState<'rich' | 'minimal'>('rich');
  
  // Reward & Transition Timer states
  const [rewardName, setRewardName] = useState('15 minutos de tablet');
  const [rewardCost, setRewardCost] = useState(10);
  const [transitionMinutes, setTransitionMinutes] = useState(5);

  // Emotional sensory log states
  const [sensoryLogs, setSensoryLogs] = useState<any[]>([]);
  const [crisisNotes, setCrisisNotes] = useState('');
  const [savingCrisis, setSavingCrisis] = useState(false);

  const [showPaywall, setShowPaywall] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [notifications, setNotifications] = useState<{ id: string; message: string; timestamp: Date }[]>([]);
  
  // Tab/Filter states
  const [activeDayFilter, setActiveDayFilter] = useState('segunda');
  const [activePanelTab, setActivePanelTab] = useState<'tasks' | 'reports' | 'logs'>('tasks');
  
  // UI states
  const [formOpen, setFormOpen] = useState(false);
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
    return {
      emoji: '🐶',
      text: collieState === 'celebrating' ? 'Au Au! 🐾' : 'Companheiro (Dicas)'
    };
  };

  const mascotLabel = getMascotLabelInfo();

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
          
          setRewardName(active.rewardName || '15 minutos de tablet');
          setRewardCost(active.rewardCost || 10);
          setTransitionMinutes(active.transitionMinutes || 5);
          
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
    
    setRewardName(child.rewardName || '15 minutos de tablet');
    setRewardCost(child.rewardCost || 10);
    setTransitionMinutes(child.transitionMinutes || 5);

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
      const added = await firebaseBridge.db.addTask({
        title: title.trim(),
        time,
        period,
        day: activeDayFilter,
        icon: taskIcon,
        category: taskCategory
      });

      // Write IMUTABLE LOG trail
      const dayLabel = DAYS_OF_WEEK.find(d => d.key === activeDayFilter)?.label;
      await immutableLogger.logChange(
        'ADD_TASK', 
        `Adicionou a tarefa "${title.trim()}" (Ícone: ${taskIcon}, Categoria: ${taskCategory}) às ${time} (${period}) na ${dayLabel}.`,
        currentUser?.email
      );

      setTitle('');
      setTaskIcon('📅');
      setTaskCategory('AVD');
      setFormOpen(false);
      triggerStatus('Tarefa adicionada com sucesso!');
    } catch (err) {
      triggerStatus('Erro ao adicionar tarefa.');
    }
  };

  // Delete Task
  const handleDeleteTask = async (task: Task) => {
    playMarimba(293.66, 0.3);
    try {
      await firebaseBridge.db.deleteTask(task.id);
      
      const dayLabel = DAYS_OF_WEEK.find(d => d.key === task.day)?.label;
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
        rewardName,
        rewardCost,
        transitionMinutes
      });
      
      setActiveChild(updated);
      firebaseBridge.auth.setActiveChild(updated);
      setChildren(prev => prev.map(c => c.id === updated.id ? updated : c));
      
      await immutableLogger.logChange(
        'UPDATE_PROFILE', 
        `Atualizou o perfil de ${activeChild.name}: Hiperfoco: "${hyperfocus}", Bloqueio Infantil: "${lockType}" (PIN: ${parentPinCode}), Velocidade Fala: ${sensorySpeed}x, Efeito Sonoro: "${sensorySound}", Visual: "${sensoryVisuals}", Reforçador: "${rewardName}" (${rewardCost} estrelas), Alerta de Transição: ${transitionMinutes}min.`,
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

  const triggerStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(''), 4000);
  };

  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-900 pb-16">
      {/* Header bar */}
      <header className="bg-white border-b-2 border-slate-250 sticky top-0 z-30 shadow-premium">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
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
      <section className="bg-white border-b-2 border-slate-250 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider font-Outfit">Crianças:</span>
            {children.map(child => {
              const isActive = activeChild?.id === child.id;
              return (
                <div key={child.id} className="flex items-center gap-1 bg-slate-50 border-2 border-slate-250 rounded-xl p-1 shadow-xs">
                  <button
                    onClick={() => handleSelectChild(child)}
                    className={`px-4 py-2 rounded-lg text-sm font-black flex items-center gap-2 transition-all cursor-pointer font-Outfit ${
                      isActive
                        ? 'bg-indigo-600 text-white border-2 border-indigo-850 shadow-md'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-2 border-slate-300'
                    }`}
                  >
                    <span>👶</span> {child.name}
                    {child.diagnosis && child.diagnosis !== 'Não Informado' && (
                      <span className={`text-[9px] px-2 py-0.5 rounded-md font-black uppercase tracking-wider ${isActive ? 'bg-indigo-855 text-indigo-100 border border-indigo-700' : 'bg-slate-250 text-slate-700 border border-slate-350'}`}>
                        {child.diagnosis}
                      </span>
                    )}
                  </button>
                  {children.length > 1 && (
                    <button
                      onClick={() => handleDeleteChild(child.id, child.name)}
                      className="p-1.5 text-slate-450 hover:text-red-655 rounded-lg hover:bg-red-50 transition-colors border border-transparent hover:border-red-200"
                      title="Excluir Criança"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
            
            <button
              onClick={() => setNewChildModalOpen(true)}
              className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-855 border-2 border-emerald-350 text-sm font-black rounded-xl flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-xs font-Outfit"
            >
              <Plus className="w-4 h-4" /> Cadastrar Criança
            </button>
          </div>

          {activeChild ? (
            <div className="flex items-center gap-3">
              <a
                href={`/routine?childId=${activeChild.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 bg-indigo-600 text-white hover:bg-indigo-750 text-sm font-black rounded-xl shadow-md border-b-4 border-indigo-900 transition-all active:scale-95 flex items-center gap-2 font-Outfit"
              >
                <span>🚀</span> Ir para Tela de {activeChild.name}
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
          <div className="max-w-6xl mx-auto px-6 mt-4">
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

      <div className="max-w-6xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Child Settings & Fast Actions */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          
          {/* Child Hyperfocus Profile Card */}
          <div className="bg-white border-2 border-slate-250 rounded-[28px] p-6 shadow-premium flex flex-col gap-4">
            <div className="flex items-center gap-2.5 text-indigo-600">
              <Sparkles className="w-5 h-5" />
              <h2 className="font-bold text-slate-900 text-lg font-Outfit">Perfil da Criança</h2>
            </div>
            
            <form onSubmit={handleSaveProfile} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5 font-Outfit">
                  Hiperfoco Principal do Usuário
                </label>
                <input 
                  type="text" 
                  value={hyperfocus}
                  onChange={e => setHyperfocus(e.target.value)}
                  placeholder="Ex: Trens, Dinossauros, Espaço"
                  className="w-full px-4 py-2.5 bg-white border-2 border-slate-300 focus:border-indigo-600 focus:bg-white rounded-xl text-slate-900 placeholder-slate-400 outline-none text-sm transition-all shadow-xxs font-bold focus:ring-4 focus:ring-indigo-100"
                />
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
                  <option value="minimal">Filtro Sensorial Reduzido (Minimalista) 🧘</option>
                </select>
              </div>

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
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xxs font-black text-slate-700 uppercase mb-1 font-Outfit">
                      Meta de Fichas
                    </label>
                    <input 
                      type="number" 
                      min={1}
                      max={50}
                      value={rewardCost}
                      onChange={e => setRewardCost(parseInt(e.target.value) || 10)}
                      className="w-full px-4 py-2.5 bg-white border-2 border-slate-300 focus:border-indigo-650 rounded-xl text-slate-900 outline-none text-xs font-bold focus:ring-4 focus:ring-indigo-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xxs font-black text-slate-700 uppercase mb-1 font-Outfit">
                      Antecipação (min)
                    </label>
                    <input 
                      type="number" 
                      min={1}
                      max={30}
                      value={transitionMinutes}
                      onChange={e => setTransitionMinutes(parseInt(e.target.value) || 5)}
                      className="w-full px-4 py-2.5 bg-white border-2 border-slate-300 focus:border-indigo-650 rounded-xl text-slate-900 outline-none text-xs font-bold focus:ring-4 focus:ring-indigo-100"
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
          </div>



          {/* Quick Actions Card */}
          <div className="bg-white border-2 border-slate-250 rounded-3xl p-6 shadow-premium">
            <div className="flex items-center gap-2.5 mb-4 text-indigo-600">
              <Settings className="w-5 h-5" />
              <h2 className="font-bold text-slate-900 text-lg font-Outfit">Ações Rápidas</h2>
            </div>

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
                      onClick={() => handleLoadTemplate(key as any, 'week')}
                      className="flex-1 py-2 bg-white border-2 border-slate-300 hover:border-indigo-500 hover:text-indigo-700 text-[10px] font-black rounded-lg shadow-xxs cursor-pointer transition-all active:scale-95 text-slate-750 font-Outfit"
                    >
                      Aplicar na Semana
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
          </div>
        </div>

        {/* Right Side: Routine Composer / Logs */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Tabs for switching Tasks Routine vs Reports vs Audit Logs */}
          <div className="bg-white border-2 border-slate-250 p-2 rounded-2xl flex shadow-sm gap-1 overflow-x-auto scrollbar-none">
            <button
              onClick={() => { playBubble(); setActivePanelTab('tasks'); }}
              className={`flex-1 py-3 text-sm font-black rounded-xl transition-all flex items-center justify-center gap-2 shrink-0 font-Outfit cursor-pointer ${
                activePanelTab === 'tasks' 
                  ? 'bg-slate-900 text-white border-2 border-slate-950 shadow-md' 
                  : 'text-slate-700 hover:text-slate-955 hover:bg-slate-50 border-2 border-transparent'
              }`}
            >
              <ListTodo className="w-4 h-4" /> Agenda Semanal
            </button>
            <button
              onClick={() => { playBubble(); setActivePanelTab('reports'); }}
              className={`flex-1 py-3 text-sm font-black rounded-xl transition-all flex items-center justify-center gap-2 shrink-0 font-Outfit cursor-pointer ${
                activePanelTab === 'reports' 
                  ? 'bg-slate-900 text-white border-2 border-slate-950 shadow-md' 
                  : 'text-slate-700 hover:text-slate-955 hover:bg-slate-50 border-2 border-transparent'
              }`}
            >
              <span>📊</span> Relatório Clínico
            </button>
            <button
              onClick={() => { playBubble(); setActivePanelTab('logs'); }}
              className={`flex-1 py-3 text-sm font-black rounded-xl transition-all flex items-center justify-center gap-2 shrink-0 font-Outfit cursor-pointer ${
                activePanelTab === 'logs' 
                  ? 'bg-slate-900 text-white border-2 border-slate-950 shadow-md' 
                  : 'text-slate-700 hover:text-slate-955 hover:bg-slate-50 border-2 border-transparent'
              }`}
            >
              <History className="w-4 h-4" /> Logs de Segurança
              <span className="text-xxs bg-indigo-100 border-2 border-indigo-300 text-indigo-955 px-2 py-0.5 rounded-full font-extrabold shadow-sm">
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
                
                {/* Horizontal Days Selector Navigation */}
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                  {DAYS_OF_WEEK.map(day => (
                    <button
                      key={day.key}
                      onClick={() => { playBubble(); setActiveDayFilter(day.key); }}
                      className={`px-4 py-2 text-xs font-extrabold rounded-full border transition-all shrink-0 active:scale-95 ${
                        activeDayFilter === day.key
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-800'
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>

                {/* Day Agenda Grid Card */}
                <div className="bg-white border border-slate-200 rounded-[32px] p-6 shadow-md shadow-slate-100 flex flex-col gap-6">
                  
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="font-black text-slate-850 text-xl leading-tight">
                        Agenda para {DAYS_OF_WEEK.find(d => d.key === activeDayFilter)?.label}
                      </h3>
                      <p className="text-xs text-slate-400 font-semibold mt-0.5">
                        {tasks.filter(t => t.day === activeDayFilter).length} tarefas cadastradas
                      </p>
                    </div>

                    <button
                      onClick={() => { playBubble(); setFormOpen(!formOpen); }}
                      className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-600 text-xs font-black rounded-full shadow-sm transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> {formOpen ? 'Fechar Form' : 'Adicionar Tarefa'}
                    </button>
                  </div>

                  {/* Progress Bar & Rate in real-time */}
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

                  {/* Presets Carrossel for 1-click add */}
                  <div className="flex flex-col gap-2 border-b border-slate-100 pb-5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1 select-none">
                      ✨ Modelos Rápidos (Adicione com 1 clique)
                    </span>
                    <div className="flex gap-2 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin">
                      {PRESETS.map((preset, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleAddPreset(preset)}
                          className="px-3.5 py-2.5 bg-slate-50 hover:bg-indigo-50/50 hover:border-indigo-250 border border-slate-200 text-slate-700 hover:text-indigo-700 text-xs font-black rounded-2xl transition-all shrink-0 active:scale-95 shadow-xxs flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5 text-indigo-500" /> {preset.title}
                        </button>
                      ))}
                    </div>
                  </div>

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
                        <h4 className="font-bold text-xs text-slate-600 uppercase tracking-wider">Nova Tarefa</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xxs font-bold text-slate-500 uppercase mb-1">Título da Atividade</label>
                            <input
                              type="text"
                              required
                              value={title}
                              onChange={e => setTitle(e.target.value)}
                              placeholder="Ex: Escovar os dentes 🪥"
                              className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 outline-none text-sm"
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
                                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 outline-none text-sm"
                                />
                              </div>
                            </div>
                            
                            <div>
                              <label className="block text-xxs font-bold text-slate-500 uppercase mb-1">Período</label>
                              <select
                                value={period}
                                onChange={e => setPeriod(e.target.value as any)}
                                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 outline-none text-sm"
                              >
                                <option value="manhã">Manhã</option>
                                <option value="tarde">Tarde</option>
                                <option value="noite">Noite</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1 border-t border-slate-200/60 pt-3">
                          <div>
                            <label className="block text-xxs font-bold text-slate-500 uppercase mb-1">Domínio da Atividade (Categoria)</label>
                            <select
                              value={taskCategory}
                              onChange={e => setTaskCategory(e.target.value as any)}
                              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 outline-none text-sm font-bold cursor-pointer"
                            >
                              <option value="AVD">AVD (Vida Diária) 🧼</option>
                              <option value="Aprendizado">Aprendizado 📚</option>
                              <option value="Lazer">Lazer 🧸</option>
                            </select>
                          </div>
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
                        </div>

                        <div className="flex gap-3 mt-2 self-end">
                          <button
                            type="button"
                            onClick={() => { playBubble(); setFormOpen(false); }}
                            className="px-4 py-2.5 bg-slate-200 text-slate-600 text-xs font-bold rounded-xl active:scale-95"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            className="px-5 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-sm hover:bg-indigo-700 active:scale-95"
                          >
                            Salvar na Agenda
                          </button>
                        </div>
                      </motion.form>
                    )}
                  </AnimatePresence>

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
                                return (
                                  <motion.div
                                    layout
                                    key={task.id}
                                    className={`flex items-center justify-between p-4 bg-white border-2 rounded-2xl hover:border-slate-350 transition-all group border-l-6 shadow-xxs hover:shadow-sm`}
                                    style={{ borderLeftColor: taskCat.gradient.includes('2dd4bf') ? '#0d9488' : taskCat.gradient.includes('fbbf24') ? '#ea580c' : taskCat.gradient.includes('38bdf8') ? '#0284c7' : taskCat.gradient.includes('6366f1') ? '#4338ca' : '#db2777' }}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-9 h-9 bg-indigo-50 border border-indigo-100 text-slate-700 rounded-xl flex items-center justify-center text-lg shadow-xxs shrink-0 select-none">
                                        {task.icon || '📅'}
                                      </div>
                                      <div className="w-9 h-9 bg-slate-50 border border-slate-200/60 text-slate-500 rounded-xl flex items-center justify-center text-xs font-black shadow-xxs shrink-0">
                                        {task.time}
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <span className="font-extrabold text-slate-700 text-sm">{task.title}</span>
                                          <span className="text-[9px] px-2 py-0.5 rounded-full font-black bg-slate-100 text-slate-550 border border-slate-200 uppercase tracking-wider">
                                            {task.category || 'AVD'}
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <span className={`text-xxs font-black uppercase tracking-wider px-3 py-1 rounded-full border shadow-xxs ${
                                        task.isCompleted 
                                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                                          : 'bg-amber-50 text-amber-600 border-amber-250'
                                      }`}>
                                        {task.isCompleted ? 'Feito ✓' : 'Pendente'}
                                      </span>

                                      <button
                                        onClick={() => handleDeleteTask(task)}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-85 group-hover:opacity-100 transition-all active:scale-90 cursor-pointer"
                                        title="Excluir Atividade"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </motion.div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                </div>
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
                    </div>
                    <button
                      onClick={() => { playBubble(); window.print(); }}
                      className="flex items-center gap-1.5 px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-full shadow-md transition-all cursor-pointer self-end md:self-auto"
                    >
                      🖨️ Imprimir / Exportar PDF
                    </button>
                  </div>

                  {/* Clinician Summary cards */}
                  {(() => {
                    const totalTasks = tasks.length;
                    const completedTasks = tasks.filter(t => t.isCompleted).length;
                    const rate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
                    
                    const morningTasks = tasks.filter(t => t.period === 'manhã');
                    const morningComp = morningTasks.length > 0 ? Math.round((morningTasks.filter(t => t.isCompleted).length / morningTasks.length) * 100) : 0;
                    
                    const afternoonTasks = tasks.filter(t => t.period === 'tarde');
                    const afternoonComp = afternoonTasks.length > 0 ? Math.round((afternoonTasks.filter(t => t.isCompleted).length / afternoonTasks.length) * 100) : 0;
                    
                    const eveningTasks = tasks.filter(t => t.period === 'noite');
                    const eveningComp = eveningTasks.length > 0 ? Math.round((eveningTasks.filter(t => t.isCompleted).length / eveningTasks.length) * 100) : 0;

                    return (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="bg-indigo-50/50 border border-indigo-100/50 p-4.5 rounded-2xl flex flex-col gap-1.5 shadow-xxs">
                            <span className="text-xxs font-black text-indigo-500 uppercase tracking-widest">Taxa de Aderência</span>
                            <span className="text-3xl font-black text-indigo-750">{rate}%</span>
                            <p className="text-xxs text-slate-400 font-semibold leading-relaxed">Conclusão de tarefas de toda a semana.</p>
                          </div>
                          <div className="bg-amber-55/60 border border-amber-100/50 p-4.5 rounded-2xl flex flex-col gap-1.5 shadow-xxs">
                            <span className="text-xxs font-black text-amber-600 uppercase tracking-widest">Conformidade Diária</span>
                            <span className="text-3xl font-black text-amber-700">{completedTasks} de {totalTasks}</span>
                            <p className="text-xxs text-slate-400 font-semibold leading-relaxed">Total de tarefas cumpridas de {totalTasks} cadastradas.</p>
                          </div>
                          <div className="bg-sky-50/50 border border-sky-100/50 p-4.5 rounded-2xl flex flex-col gap-1.5 shadow-xxs">
                            <span className="text-xxs font-black text-sky-500 uppercase tracking-widest">Hiperfoco Ativo</span>
                            <span className="text-base font-black text-sky-750 truncate max-w-xs">{activeChild?.childHyperfocus || 'Não cadastrado'}</span>
                            <p className="text-xxs text-slate-400 font-semibold leading-relaxed">Apoio de previsibilidade em execução.</p>
                          </div>
                        </div>

                        {/* Visual Category Compliance Graph */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-slate-50 border border-slate-200/50 p-5 rounded-2xl flex flex-col gap-4 shadow-xxs">
                            <h4 className="font-extrabold text-xs text-slate-500 uppercase tracking-wider">Aderência por Período de Dia</h4>
                            <div className="flex flex-col gap-3">
                              <div>
                                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                                  <span>Manhã ☀️</span>
                                  <span>{morningComp}%</span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${morningComp}%` }} />
                                </div>
                              </div>
                              <div>
                                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                                  <span>Tarde ⛅</span>
                                  <span>{afternoonComp}%</span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                                  <div className="bg-blue-500 h-full rounded-full" style={{ width: `${afternoonComp}%` }} />
                                </div>
                              </div>
                              <div>
                                <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                                  <span>Noite 🌙</span>
                                  <span>{eveningComp}%</span>
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
                                const avdTotal = tasks.filter(t => getCat(t) === 'AVD').length;
                                const avdDone = tasks.filter(t => getCat(t) === 'AVD' && t.isCompleted).length;
                                const avdRate = avdTotal > 0 ? Math.round((avdDone / avdTotal) * 100) : 0;

                                const studyTotal = tasks.filter(t => getCat(t) === 'Aprendizado').length;
                                const studyDone = tasks.filter(t => getCat(t) === 'Aprendizado' && t.isCompleted).length;
                                const studyRate = studyTotal > 0 ? Math.round((studyDone / studyTotal) * 100) : 0;

                                const playTotal = tasks.filter(t => getCat(t) === 'Lazer').length;
                                const playDone = tasks.filter(t => getCat(t) === 'Lazer' && t.isCompleted).length;
                                const playRate = playTotal > 0 ? Math.round((playDone / playTotal) * 100) : 0;

                                return (
                                  <>
                                    <div>
                                      <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                                        <span>AVD (Vida Diária) 🧼</span>
                                        <span>{avdRate}% ({avdDone}/{avdTotal})</span>
                                      </div>
                                      <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                                        <div className="bg-teal-500 h-full rounded-full" style={{ width: `${avdRate}%` }} />
                                      </div>
                                    </div>
                                    <div>
                                      <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                                        <span>Aprendizado 📚</span>
                                        <span>{studyRate}% ({studyDone}/{studyTotal})</span>
                                      </div>
                                      <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                                        <div className="bg-indigo-650 h-full rounded-full" style={{ width: `${studyRate}%` }} />
                                      </div>
                                    </div>
                                    <div>
                                      <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                                        <span>Lazer 🧸</span>
                                        <span>{playRate}% ({playDone}/{playTotal})</span>
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

                              try {
                                const newLog = await firebaseBridge.db.addSensoryLog({
                                  childId: activeChild.id,
                                  crisisOccurred: true,
                                  notes: crisisNotes.trim()
                                });

                                setSensoryLogs(prev => [newLog, ...prev]);
                                setCrisisNotes('');
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
                              placeholder="Descreva a crise (comportamento, gatilho e estratégias aplicadas)"
                              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:border-red-400 h-16 resize-none"
                            />
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
                              sensoryLogs.map(log => (
                                <div key={log.id} className={`p-2.5 rounded-lg border text-xxs flex flex-col gap-1 ${
                                  log.crisisOccurred ? 'bg-red-50/30 border-red-100 text-red-805' : 'bg-indigo-50/20 border-indigo-100 text-indigo-805'
                                }`}>
                                  <div className="flex justify-between font-bold text-[9px] text-slate-400">
                                    <span>{new Date(log.timestamp).toLocaleString()}</span>
                                    <span>{log.crisisOccurred ? '🚨 CRISE' : `🧠 HUMOR: ${log.mood}`}</span>
                                  </div>
                                  {log.notes && <p className="font-semibold text-slate-700">{log.notes}</p>}
                                </div>
                              ))
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
                                <p className="text-sm font-black text-slate-650">{new Date().toLocaleDateString()}</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8 border-b border-slate-200 pb-4">
                              <div>
                                <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">Informações Gerais</h3>
                                <p className="text-sm font-bold text-slate-700 mt-2">Responsável: <span className="font-extrabold">{currentUser?.email}</span></p>
                                <p className="text-sm font-bold text-slate-700 mt-2">Criança: <span className="font-extrabold">{activeChild?.name || 'Não cadastrado'}</span></p>
                                <p className="text-sm font-bold text-slate-700 mt-1">Hiperfoco: <span className="font-extrabold">{activeChild?.childHyperfocus || 'Não cadastrado'}</span></p>
                              </div>
                              <div>
                                <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest">Resumo de Aderência</h3>
                                <p className="text-sm font-bold text-slate-700 mt-2">Tarefas Cumpridas: <span className="font-extrabold">{completedTasks} de {totalTasks} ({rate}%)</span></p>
                                <p className="text-sm font-bold text-slate-700 mt-1">Barreira Infantil Ativa: <span className="font-extrabold">{lockType === 'pin' ? 'PIN' : lockType === 'math' ? 'Matemática' : 'Nenhuma'}</span></p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                              <div>
                                <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-3">Aderência por Período de Dia</h3>
                                <div className="flex flex-col gap-2">
                                  <p className="text-sm text-slate-700 font-bold">☀️ Período da Manhã: <span className="font-extrabold text-indigo-650">{morningComp}% de conclusão</span></p>
                                  <p className="text-sm text-slate-700 font-bold">⛅ Período da Tarde: <span className="font-extrabold text-indigo-650">{afternoonComp}% de conclusão</span></p>
                                  <p className="text-sm text-slate-700 font-bold">🌙 Período da Noite: <span className="font-extrabold text-indigo-650">{eveningComp}% de conclusão</span></p>
                                </div>
                              </div>
                              <div>
                                <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-3">Aderência por Domínio (ABA)</h3>
                                <div className="flex flex-col gap-2">
                                  {(() => {
                                    const getCat = (t: Task) => t.category || 'AVD';
                                    const avdTotal = tasks.filter(t => getCat(t) === 'AVD').length;
                                    const avdDone = tasks.filter(t => getCat(t) === 'AVD' && t.isCompleted).length;
                                    const avdRate = avdTotal > 0 ? Math.round((avdDone / avdTotal) * 100) : 0;

                                    const studyTotal = tasks.filter(t => getCat(t) === 'Aprendizado').length;
                                    const studyDone = tasks.filter(t => getCat(t) === 'Aprendizado' && t.isCompleted).length;
                                    const studyRate = studyTotal > 0 ? Math.round((studyDone / studyTotal) * 100) : 0;

                                    const playTotal = tasks.filter(t => getCat(t) === 'Lazer').length;
                                    const playDone = tasks.filter(t => getCat(t) === 'Lazer' && t.isCompleted).length;
                                    const playRate = playTotal > 0 ? Math.round((playDone / playTotal) * 100) : 0;

                                    return (
                                      <>
                                        <p className="text-sm text-slate-700 font-bold">🧼 Vida Diária (AVD): <span className="font-extrabold text-indigo-650">{avdRate}% ({avdDone}/{avdTotal})</span></p>
                                        <p className="text-sm text-slate-700 font-bold">📚 Aprendizado: <span className="font-extrabold text-indigo-650">{studyRate}% ({studyDone}/{studyTotal})</span></p>
                                        <p className="text-sm text-slate-700 font-bold">🧸 Lazer e Recreação: <span className="font-extrabold text-indigo-650">{playRate}% ({playDone}/{playTotal})</span></p>
                                      </>
                                    );
                                  })()}
                                </div>
                              </div>
                            </div>

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
                      
                      // Simulate Stripe redirect and payments checkout loop
                      setTimeout(async () => {
                        playMarimba(523.25, 0.12);
                        setTimeout(() => playMarimba(659.25, 0.15), 100);
                        
                        await firebaseBridge.auth.updateProfileSettings({ plan: 'premium' });
                        setPlan('premium');
                        setShowPaywall(false);
                        setCheckingOut(false);
                        triggerStatus('Assinatura Premium ativa! Obrigado 💎');
                      }, 2000);
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
    </main>
  );
}
