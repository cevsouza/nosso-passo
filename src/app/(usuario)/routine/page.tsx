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



export default function ChildRoutine() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentDay, setCurrentDay] = useState('segunda');
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
  const [activeAmbientType, setActiveAmbientType] = useState<'none' | 'rain' | 'binaural'>('none');
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      stopAmbientSound();
    };
  }, []);

  const handleAmbientChange = (type: 'none' | 'rain' | 'binaural') => {
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
  
  // 1. Detect current day of week, load children and subscribe to tasks
  useEffect(() => {
    const todayNum = new Date().getDay();
    const todayKey = DAYS_PORTUGUESE[todayNum] || 'segunda';
    setCurrentDay(todayKey);

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
      if (todayTasks.length > 0) {
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
        notes: 'Humor registrado pelo próprio usuário na rotina.'
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
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#0b0f19] via-[#1a2035] to-[#2b1f3d] text-white relative overflow-hidden">
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

        <motion.div
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={transitionConfig}
          className="z-10 w-full max-w-lg text-center flex flex-col items-center gap-6"
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
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-tr from-[#f8fafc] via-[#eff6ff] to-[#f0fdf4] animate-gradient-flow text-[#0f172a] p-6 pb-12 flex flex-col items-center relative overflow-hidden">
      {/* Background Soft Glows */}
      {sensoryVisuals === 'rich' && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[20%] left-[-15%] w-80 h-80 bg-blue-200/40 rounded-full filter blur-3xl opacity-60 animate-pulse"></div>
          <div className="absolute bottom-[20%] right-[-15%] w-96 h-96 bg-indigo-200/30 rounded-full filter blur-3xl opacity-50 animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
      )}

      {/* Top Navigation */}
      <div className="w-full max-w-2xl flex items-center justify-between mb-8 z-10">
        <button 
          onClick={() => handleAttemptExit('/')}
          onMouseEnter={playBubble}
          className="flex items-center gap-1.5 px-5 py-2.5 bg-white hover:bg-slate-50 text-xs font-black rounded-full border-2 border-slate-350 shadow-premium transition-all active:scale-95 cursor-pointer text-slate-800"
        >
          🏠 Início
        </button>

        <h2 className="text-xs font-black bg-white border-2 border-slate-350 text-slate-800 px-5 py-2.5 rounded-full shadow-premium uppercase tracking-widest font-Outfit">
          {DAY_LABELS[currentDay] || 'Rotina Semanal'}
        </h2>
        
        {/* Ambient Sound Selector */}
        <div className="flex bg-white border-2 border-slate-350 p-1 rounded-full shadow-premium gap-1 items-center z-10">
          <button
            onClick={() => handleAmbientChange('none')}
            className={`px-3 py-1.5 rounded-full text-xs font-black transition-all ${
              activeAmbientType === 'none'
                ? 'bg-slate-200 text-slate-800'
                : 'bg-transparent text-slate-400 hover:text-slate-600'
            }`}
            title="Silencioso"
          >
            🔈
          </button>
          <button
            onClick={() => handleAmbientChange('rain')}
            className={`px-3 py-1.5 rounded-full text-xs font-black transition-all ${
              activeAmbientType === 'rain'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-transparent text-slate-400 hover:text-blue-500'
            }`}
            title="Som de Chuva"
          >
            🌧️
          </button>
          <button
            onClick={() => handleAmbientChange('binaural')}
            className={`px-3 py-1.5 rounded-full text-xs font-black transition-all ${
              activeAmbientType === 'binaural'
                ? 'bg-indigo-100 text-indigo-800'
                : 'bg-transparent text-slate-400 hover:text-indigo-500'
            }`}
            title="Foco Binaural"
          >
            🧠
          </button>
        </div>
      </div>

      <div className="w-full max-w-2xl flex flex-col gap-6 z-10">
        
        {/* Token Economy Stars Row */}
        {activeChild && (
          <div className="bg-white border-2 border-slate-300 p-4.5 rounded-[24px] shadow-premium flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
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
        {todayTasks.length === 0 ? (
          <motion.div 
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white/80 border border-white/50 p-12 rounded-[32px] shadow-premium text-center flex flex-col items-center gap-4"
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
                    className={`bg-white border-4 rounded-[36px] p-8 shadow-premium flex flex-col items-center text-center gap-6 relative overflow-hidden transition-all duration-500 border-t-8 border-t-transparent ${category.shadow}`}
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
                        {activeTask.icon && (
                          <div className="absolute top-0 right-0 w-14 h-14 bg-white border-4 border-indigo-100 text-slate-700 rounded-2xl flex items-center justify-center text-4xl shadow-md select-none transform rotate-12">
                            {activeTask.icon}
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
                        onClick={() => { playBubble(); speakText(activeTask.title); }}
                        className="flex items-center gap-1.5 px-5 py-3 bg-indigo-100 hover:bg-indigo-200 border-2 border-indigo-350 text-indigo-950 text-xs font-black rounded-full shadow-xxs cursor-pointer transition-all active:scale-95 hover:scale-[1.03] font-Outfit"
                      >
                        🔊 Ouvir Atividade
                      </button>
                    </div>

                    {/* Time Timer and Transition Banner */}
                    <div className="w-full flex flex-col md:flex-row items-center justify-center gap-4 border-t border-b border-slate-100 py-4 my-2">
                      {/* Time Timer ring */}
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

                      {/* Transition Warning / Next Task Banner */}
                      {nextTasks.length > 0 && (
                        <div className="flex-1 flex flex-col gap-1.5 text-left bg-slate-100 border-2 border-slate-300 p-3 rounded-2xl shadow-xxs">
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 font-Outfit">Próxima Atividade:</span>
                          <span className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                            <span className="text-base">{nextTasks[0].icon || '📅'}</span> {nextTasks[0].title}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mt-2">
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
                        {activeTask.icon && (
                          <div className="absolute top-0 right-0 w-10 h-10 bg-white border-2 border-indigo-105 text-slate-700 rounded-xl flex items-center justify-center text-2xl shadow select-none">
                            {activeTask.icon}
                          </div>
                        )}
                      </div>
                      <h4 
                        onClick={() => { playBubble(); speakText(activeTask.title); }}
                        className="text-xl font-black text-slate-950 tracking-tight cursor-pointer hover:text-indigo-700 select-none font-Outfit"
                      >
                        {activeTask.title}
                      </h4>
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
                        {nextTask.icon || '📅'}
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
              <div className="bg-white border-2 border-slate-300 p-6.5 rounded-[32px] shadow-premium flex flex-col gap-4 text-left w-full">
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
              className="bg-white border-4 border-indigo-400 rounded-[32px] p-8 w-full max-w-md shadow-2xl flex flex-col items-center text-center gap-6"
            >
              <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-2xl shadow-sm">
                🧠
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-800">Como você está se sentindo agora?</h3>
                <p className="text-xs text-slate-400 font-semibold mt-1">
                  Marque sua emoção para ajudar a acompanhar seu dia!
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full">
                {[
                  { key: 'feliz', label: 'Feliz 😊', color: 'bg-emerald-100 hover:bg-emerald-200 text-emerald-950 border-2 border-emerald-450' },
                  { key: 'calmo', label: 'Calmo 🧘', color: 'bg-sky-100 hover:bg-sky-200 text-sky-950 border-2 border-sky-450' },
                  { key: 'agitado', label: 'Agitado 🌀', color: 'bg-amber-100 hover:bg-amber-200 text-amber-950 border-2 border-amber-450' },
                  { key: 'triste', label: 'Triste 😢', color: 'bg-red-100 hover:bg-red-200 text-red-950 border-2 border-red-450' }
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

              <button
                onClick={() => setShowMoodModal(false)}
                className="text-xs font-bold text-slate-450 hover:text-slate-650 underline cursor-pointer bg-transparent border-none"
              >
                Pular check-in
              </button>
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
