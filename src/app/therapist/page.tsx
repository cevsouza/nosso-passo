"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Stethoscope, 
  Activity, 
  Brain, 
  AlertTriangle, 
  Volume2, 
  Sun, 
  MapPin, 
  ClipboardCheck, 
  ArrowRight,
  TrendingUp,
  Smile,
  Calendar,
  Lock,
  ChevronRight,
  FileSpreadsheet,
  Plus,
  Trash2,
  Pencil,
  X,
  Map
} from 'lucide-react';
import { playBubble, playMarimba } from '../../lib/audio-synth';
import { SensoryHeatmap } from '../../components/SensoryHeatmap';

export default function TherapistPortal() {
  const [sharingCode, setSharingCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [childData, setChildData] = useState<any | null>(null);

  // Form states for checkpoints
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<any | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [profName, setProfName] = useState('');
  const [profRole, setProfRole] = useState('Psicologia ABA');
  const [savingCheckpoint, setSavingCheckpoint] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // Custom Daily Checkpoint Form States
  const [newCpOpen, setNewCpOpen] = useState(false);
  const [newCpDate, setNewCpDate] = useState('');
  const [newCpName, setNewCpName] = useState('');
  const [newCpRole, setNewCpRole] = useState('Psicologia ABA');
  const [newCpNotes, setNewCpNotes] = useState('');
  const [newCpFeedback, setNewCpFeedback] = useState('');
  const [creatingCheckpoint, setCreatingCheckpoint] = useState(false);

  // Task management states
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskTime, setTaskTime] = useState('08:00');
  const [taskPeriod, setTaskPeriod] = useState<'manhã' | 'tarde' | 'noite'>('manhã');
  const [taskDay, setTaskDay] = useState('1');
  const [taskDuration, setTaskDuration] = useState(30);
  const [taskCategory, setTaskCategory] = useState<'AVD' | 'Aprendizado' | 'Lazer'>('AVD');
  const [taskIcon, setTaskIcon] = useState('📅');
  const [taskCustomIcon, setTaskCustomIcon] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [savingTask, setSavingTask] = useState(false);
  const [taskError, setTaskError] = useState('');

  const handleVerify = async (e?: React.FormEvent, codeToUse?: string) => {
    if (e) e.preventDefault();
    const finalCode = (codeToUse || sharingCode).trim();
    if (!finalCode) return;
    setVerifying(true);
    setErrorMsg('');
    playMarimba(392, 0.3);

    try {
      const res = await fetch(`/api/therapist?sharingCode=${finalCode.toUpperCase()}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Código inválido');
      }
      setChildData(data);
      playMarimba(523, 0.4);
    } catch (err: any) {
      setErrorMsg(err.message || 'Código de compartilhamento inválido ou inativo.');
      playMarimba(180, 0.2);
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      if (code) {
        setSharingCode(code.toUpperCase());
        handleVerify(undefined, code.toUpperCase());
      }
    }
  }, []);

  const resetTaskForm = () => {
    setEditingTaskId(null);
    setTaskTitle('');
    setTaskTime('08:00');
    setTaskPeriod('manhã');
    setTaskDay('1');
    setTaskDuration(30);
    setTaskCategory('AVD');
    setTaskIcon('📅');
    setTaskCustomIcon('');
    setTaskDescription('');
    setTaskError('');
  };

  const startEditingTask = (task: any) => {
    playBubble();
    setEditingTaskId(task.id);
    setTaskTitle(task.title || '');
    setTaskTime(task.time || '08:00');
    setTaskPeriod(task.period || 'manhã');
    setTaskDay(task.day || '1');
    setTaskDuration(task.duration || 30);
    setTaskCategory(task.category || 'AVD');
    setTaskIcon(task.icon || '📅');
    setTaskCustomIcon(task.customIcon || '');
    setTaskDescription(task.description || '');
    setTaskFormOpen(true);
  };

  const handleTaskFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTaskCustomIcon(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !childData) return;
    setSavingTask(true);
    setTaskError('');

    try {
      if (editingTaskId) {
        const res = await fetch('/api/therapist', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sharingCode: childData.sharingCode,
            action: 'UPDATE_TASK',
            taskId: editingTaskId,
            updates: {
              title: taskTitle.trim(),
              time: taskTime,
              period: taskPeriod,
              day: taskDay,
              duration: Number(taskDuration),
              category: taskCategory,
              icon: taskIcon,
              customIcon: taskCustomIcon.trim() || null,
              description: taskDescription.trim()
            }
          })
        });

        const updatedTask = await res.json();
        if (!res.ok) throw new Error(updatedTask.error || 'Erro ao atualizar tarefa');

        setChildData((prev: any) => ({
          ...prev,
          tasks: prev.tasks.map((t: any) => t.id === editingTaskId ? updatedTask : t).sort((a: any, b: any) => {
            const dayA = parseInt(a.day) || 1;
            const dayB = parseInt(b.day) || 1;
            if (dayA !== dayB) return dayA - dayB;
            return a.time.localeCompare(b.time);
          })
        }));

        playMarimba(523, 0.4);
        setEditingTaskId(null);
        setTaskFormOpen(false);
        resetTaskForm();
      } else {
        const res = await fetch('/api/therapist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sharingCode: childData.sharingCode,
            action: 'CREATE_TASK',
            taskData: {
              title: taskTitle.trim(),
              time: taskTime,
              period: taskPeriod,
              day: taskDay,
              duration: Number(taskDuration),
              category: taskCategory,
              icon: taskIcon,
              customIcon: taskCustomIcon.trim() || null,
              description: taskDescription.trim()
            }
          })
        });

        const newTask = await res.json();
        if (!res.ok) throw new Error(newTask.error || 'Erro ao criar tarefa');

        setChildData((prev: any) => ({
          ...prev,
          tasks: [...prev.tasks, newTask].sort((a: any, b: any) => {
            const dayA = parseInt(a.day) || 1;
            const dayB = parseInt(b.day) || 1;
            if (dayA !== dayB) return dayA - dayB;
            return a.time.localeCompare(b.time);
          })
        }));

        playMarimba(523, 0.4);
        setTaskFormOpen(false);
        resetTaskForm();
      }
    } catch (err: any) {
      setTaskError(err.message || 'Erro ao salvar tarefa.');
      playMarimba(180, 0.2);
    } finally {
      setSavingTask(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Tem certeza que deseja remover esta atividade da rotina?') || !childData) return;
    playMarimba(196, 0.4);

    try {
      const res = await fetch('/api/therapist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sharingCode: childData.sharingCode,
          action: 'DELETE_TASK',
          taskId
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao remover tarefa');

      setChildData((prev: any) => ({
        ...prev,
        tasks: prev.tasks.filter((t: any) => t.id !== taskId)
      }));
    } catch (err: any) {
      alert(err.message || 'Erro ao remover tarefa.');
    }
  };

  const handleToggleTaskCompletion = async (task: any) => {
    if (!childData) return;
    playBubble();

    try {
      const res = await fetch('/api/therapist', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sharingCode: childData.sharingCode,
          action: 'UPDATE_TASK',
          taskId: task.id,
          updates: {
            isCompleted: !task.isCompleted
          }
        })
      });

      const updatedTask = await res.json();
      if (!res.ok) throw new Error(updatedTask.error || 'Erro ao alterar status da tarefa');

      setChildData((prev: any) => ({
        ...prev,
        tasks: prev.tasks.map((t: any) => t.id === task.id ? updatedTask : t)
      }));
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar tarefa.');
    }
  };

  const handleUpdateCheckpoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCheckpoint || !profName.trim() || !feedbackText.trim()) return;
    setSavingCheckpoint(true);
    setStatusMsg('');

    try {
      const res = await fetch('/api/therapist', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sharingCode: childData.sharingCode,
          checkpointId: selectedCheckpoint.id,
          updates: {
            status: 'completed',
            feedback: feedbackText,
            professionalName: profName,
            professionalRole: profRole,
            date: new Date().toISOString().split('T')[0]
          }
        })
      });

      const updatedCheckpoint = await res.json();
      if (!res.ok) {
        throw new Error(updatedCheckpoint.error || 'Erro ao salvar checkpoint');
      }

      // Sync state
      setChildData((prev: any) => ({
        ...prev,
        checkpoints: prev.checkpoints.map((c: any) => c.id === updatedCheckpoint.id ? updatedCheckpoint : c)
      }));

      playMarimba(523, 0.4);
      setStatusMsg('Evolução clínica gravada com sucesso!');
      setTimeout(() => {
        setSelectedCheckpoint(null);
        setStatusMsg('');
      }, 1500);
    } catch (err: any) {
      setStatusMsg(`Erro: ${err.message}`);
      playMarimba(180, 0.2);
    } finally {
      setSavingCheckpoint(false);
    }
  };

  const handleCreateDailyCheckpoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!childData?.id || !newCpDate || !newCpName.trim() || !newCpFeedback.trim()) return;

    setCreatingCheckpoint(true);
    setStatusMsg('');
    try {
      playMarimba(392, 0.4);
      const res = await fetch('/api/checkpoints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId: childData.id,
          date: newCpDate,
          professionalName: newCpName.trim(),
          professionalRole: newCpRole,
          feedback: newCpFeedback.trim(),
          notes: newCpNotes.trim(),
          status: 'completed',
          weekNum: 1
        })
      });

      const created = await res.json();
      if (!res.ok) throw new Error(created.error || 'Erro ao criar checkpoint diário');

      setChildData((prev: any) => {
        const idx = prev.checkpoints.findIndex((c: any) => c.date === created.date);
        let updatedCheckpoints;
        if (idx !== -1) {
          updatedCheckpoints = prev.checkpoints.map((c: any, i: number) => i === idx ? created : c);
        } else {
          updatedCheckpoints = [...prev.checkpoints, created];
        }
        return {
          ...prev,
          checkpoints: updatedCheckpoints
        };
      });

      setNewCpOpen(false);
      setNewCpName('');
      setNewCpFeedback('');
      setNewCpNotes('');
      setStatusMsg('Checkpoint diário clínico registrado com sucesso!');
      setTimeout(() => {
        setStatusMsg('');
      }, 2000);
    } catch (err: any) {
      setStatusMsg(`Erro: ${err.message}`);
      playMarimba(180, 0.2);
    } finally {
      setCreatingCheckpoint(false);
    }
  };

  // Helper calculations
  const elapsedDays = new Date().getDate();
  
  const tasks = childData?.tasks || [];
  const sensoryLogs = childData?.sensoryLogs || [];
  const checkpoints = childData?.checkpoints || [];

  // Filter tasks for elapsed days in the month
  const elapsedTasks = tasks.filter((t: any) => {
    const tDay = parseInt(t.day);
    return !isNaN(tDay) && tDay <= elapsedDays;
  });

  const totalTasksElapsed = elapsedTasks.length;
  const completedTasksElapsed = elapsedTasks.filter((t: any) => t.isCompleted).length;
  
  // Compliance Rate
  const complianceRate = totalTasksElapsed > 0 
    ? Math.round((completedTasksElapsed / totalTasksElapsed) * 100) 
    : 0;

  // Emotional Stability
  const emotionalLogs = sensoryLogs.filter((log: any) => log.mood);
  const stableLogsCount = emotionalLogs.filter((log: any) => log.mood === 'feliz' || log.mood === 'calmo').length;
  const stabilityRate = emotionalLogs.length > 0 
    ? Math.round((stableLogsCount / emotionalLogs.length) * 100) 
    : 100; // default to stable if no logs yet

  // Crises Count (7 days)
  const crisesCount = sensoryLogs.filter((log: any) => log.crisisOccurred).length;

  // Triggers aggregation
  const triggersList = sensoryLogs
    .filter((log: any) => log.trigger && log.trigger !== 'Nenhum')
    .map((log: any) => log.trigger);
  
  const triggerCounts = triggersList.reduce((acc: any, t: string) => {
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});

  const topTrigger = Object.keys(triggerCounts).length > 0 
    ? Object.keys(triggerCounts).reduce((a, b) => triggerCounts[a] > triggerCounts[b] ? a : b) 
    : 'Nenhum identificado';

  return (
    <main className="min-h-screen bg-gradient-to-tr from-[#f8fafc] via-[#eff6ff] to-[#f0fdf4] p-4 md:p-8 text-slate-800">
      
      {/* Clinician Entry Verification */}
      {!childData ? (
        <div className="max-w-md mx-auto my-16 bg-white border-2 border-slate-200 rounded-[32px] p-8 shadow-xl flex flex-col gap-6 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-teal-500 via-cyan-500 to-indigo-600"></div>
          
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 bg-teal-50 text-teal-650 rounded-2xl flex items-center justify-center text-3xl shadow-sm border border-teal-100">
              🩺
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 font-Outfit">Portal do Terapeuta</h1>
              <p className="text-xs font-semibold text-slate-400 mt-1">
                Acesse o progresso terapêutico, verifique a aderência diária e registre laudos clínicos.
              </p>
            </div>
          </div>

          <form onSubmit={handleVerify} className="flex flex-col gap-4">
            <div>
              <label className="block text-xxs font-black text-slate-500 uppercase tracking-widest mb-1.5 font-Outfit">
                Código de Compartilhamento Clínico
              </label>
              <input
                type="text"
                placeholder="Ex: ABC123"
                value={sharingCode}
                onChange={e => setSharingCode(e.target.value)}
                maxLength={6}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-black tracking-widest text-center text-lg uppercase outline-none focus:border-teal-500 focus:bg-white text-slate-800"
              />
            </div>

            {errorMsg && (
              <p className="text-[11px] text-red-500 font-extrabold text-center bg-red-50 border border-red-100 p-2 rounded-lg">
                ⚠️ {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={verifying || !sharingCode.trim()}
              className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98 transition-all disabled:opacity-50 font-Outfit"
            >
              {verifying ? 'Verificando...' : 'Acessar Prontuário Clínico'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
          
          <span className="text-[9px] text-slate-400 font-medium text-center">
            * O código deve ser gerado pelos pais nas configurações do perfil da criança no painel do responsável.
          </span>
        </div>
      ) : (
        /* Therapist Dashboard View */
        <div className="max-w-6xl mx-auto flex flex-col gap-6">
          
          {/* Header Card */}
          <div className="bg-white border-2 border-slate-250 rounded-[28px] p-6 shadow-premium flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-teal-500 to-indigo-500"></div>
            
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-tr from-teal-500 to-cyan-600 text-white rounded-2xl flex items-center justify-center text-3xl shadow-md select-none font-Outfit">
                {childData.gender === 'Feminino' ? '👧' : childData.gender === 'Masculino' ? '👦' : '👶'}
              </div>
              <div className="text-left">
                <span className="text-[9px] font-black uppercase bg-teal-50 border border-teal-150 text-teal-700 px-3 py-1 rounded-full tracking-wider">
                  Prontuário Clínico Ativo
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <h1 className="text-2xl font-black text-slate-900 font-Outfit">{childData.name}</h1>
                  {childData.emotionalBattery && (
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full font-Outfit ${
                      childData.emotionalBattery === 'green'
                        ? 'bg-emerald-100 text-emerald-800'
                        : childData.emotionalBattery === 'yellow'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800 animate-pulse'
                    }`}>
                      {childData.emotionalBattery === 'green' ? '🔋 Ótimo' : childData.emotionalBattery === 'yellow' ? '⚡ Cansado' : '🪫 Sobrecarregado'}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-1.5 text-xs text-slate-500 font-bold">
                  {childData.diagnosis && <span>🎯 Diagnóstico: <strong className="text-slate-800">{childData.diagnosis}</strong></span>}
                  {childData.childHyperfocus && <span>🚀 Hiperfoco: <strong className="text-indigo-650">{childData.childHyperfocus}</strong></span>}
                </div>
              </div>
            </div>

            <div className="flex gap-2 self-start md:self-center">
              <button
                onClick={() => { playBubble(); window.print(); }}
                className="px-4 py-2.5 bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-700 text-xs font-black rounded-xl cursor-pointer active:scale-95 transition-all font-Outfit"
              >
                🖨️ Exportar PDF Clínico
              </button>
              
              <button
                onClick={() => { playBubble(); setChildData(null); setSharingCode(''); }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-250 text-slate-600 text-xs font-black rounded-xl cursor-pointer active:scale-95 transition-all font-Outfit"
              >
                🔒 Sair do Prontuário
              </button>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            
            {/* compliance card */}
            <div className="bg-white border border-slate-200 p-5 rounded-[24px] shadow-xxs flex flex-col justify-between gap-4">
              <div className="flex justify-between items-start">
                <div className="text-left">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-Outfit">Aderência à Rotina</span>
                  <span className="text-3xl font-black text-slate-900 tracking-tight mt-1 block font-Outfit">{complianceRate}%</span>
                </div>
                <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center shadow-xxs">
                  <Activity className="w-5 h-5" />
                </div>
              </div>
              <div className="text-left">
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-1.5">
                  <div 
                    className={`h-full rounded-full ${complianceRate >= 80 ? 'bg-emerald-500' : complianceRate >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} 
                    style={{ width: `${complianceRate}%` }} 
                  />
                </div>
                <span className="text-[9px] text-slate-450 font-bold">
                  Calculado sobre {totalTasksElapsed} tarefas dos {elapsedDays} dias decorridos do mês.
                </span>
              </div>
            </div>

            {/* stability card */}
            <div className="bg-white border border-slate-200 p-5 rounded-[24px] shadow-xxs flex flex-col justify-between gap-4">
              <div className="flex justify-between items-start">
                <div className="text-left">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-Outfit">Estabilidade Emocional</span>
                  <span className="text-3xl font-black text-slate-900 tracking-tight mt-1 block font-Outfit">{stabilityRate}%</span>
                </div>
                <div className="w-10 h-10 bg-teal-50 border border-teal-100 text-teal-700 rounded-xl flex items-center justify-center shadow-xxs">
                  <Smile className="w-5 h-5" />
                </div>
              </div>
              <div className="text-left">
                <span className="text-xs font-black text-teal-800 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-md inline-block mb-1 font-Outfit">
                  {stabilityRate >= 80 ? 'Excelente' : stabilityRate >= 50 ? 'Estável' : 'Atenção Necessária'}
                </span>
                <p className="text-[9px] text-slate-450 font-bold mt-0.5 leading-snug">
                  Média de humor regulado (Feliz/Calmo) nos registros do diário emocional.
                </p>
              </div>
            </div>

            {/* crises card */}
            <div className="bg-white border border-slate-200 p-5 rounded-[24px] shadow-xxs flex flex-col justify-between gap-4">
              <div className="flex justify-between items-start">
                <div className="text-left">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-Outfit">Frequência de Crises</span>
                  <span className="text-3xl font-black text-slate-900 tracking-tight mt-1 block font-Outfit">{crisesCount}</span>
                </div>
                <div className="w-10 h-10 bg-red-50 border border-red-100 text-red-700 rounded-xl flex items-center justify-center shadow-xxs">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
              <div className="text-left">
                <span className={`text-xs font-black px-2 py-0.5 rounded-md inline-block mb-1 font-Outfit ${
                  crisesCount === 0 ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-red-50 text-red-800 border border-red-100'
                }`}>
                  {crisesCount === 0 ? 'Sob Controle' : `${crisesCount} Meltdown(s) Recente(s)`}
                </span>
                <p className="text-[9px] text-slate-450 font-bold mt-0.5 leading-snug">
                  Contagem total de crises e sobrecargas sensoriais graves neste mês.
                </p>
              </div>
            </div>

            {/* top trigger card */}
            <div className="bg-white border border-slate-200 p-5 rounded-[24px] shadow-xxs flex flex-col justify-between gap-4">
              <div className="flex justify-between items-start">
                <div className="text-left">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-Outfit">Gatilho Mais Frequente</span>
                  <span className="text-lg font-black text-slate-900 tracking-tight mt-1 block font-Outfit leading-tight">{topTrigger}</span>
                </div>
                <div className="w-10 h-10 bg-amber-50 border border-amber-100 text-amber-700 rounded-xl flex items-center justify-center shadow-xxs">
                  <Brain className="w-5 h-5" />
                </div>
              </div>
              <div className="text-left">
                <span className="text-[9px] text-slate-450 font-bold leading-normal block">
                  Identificado a partir das análises ambientais preenchidas nos registros de regulação.
                </span>
              </div>
            </div>

          </div>

          {/* Main Content Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Side: Checkpoints & Routine Trail */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              
              {/* Checkpoints Tracker */}
              <div className="bg-white border border-slate-200 p-6 rounded-[28px] shadow-premium flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 text-teal-650 text-left">
                    <ClipboardCheck className="w-5 h-5" />
                    <h3 className="font-black text-slate-900 text-lg font-Outfit">Evolução Clínica & Sessões Clínicas</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => { playBubble(); setNewCpOpen(!newCpOpen); if (!newCpDate) setNewCpDate(new Date().toISOString().split('T')[0]); }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-teal-50 border border-teal-100 hover:bg-teal-100 text-teal-700 text-xs font-black rounded-full shadow-sm transition-all cursor-pointer font-Outfit border-none outline-none"
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
                      className="bg-slate-50 border border-slate-200 p-5 rounded-[24px] overflow-hidden flex flex-col gap-4 text-xs text-left"
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
                            className="w-full bg-white border-2 border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:border-teal-600 focus:bg-white outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Nome do Profissional</label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: Dr. Carlos Reis"
                            value={newCpName}
                            onChange={e => setNewCpName(e.target.value)}
                            className="w-full bg-white border-2 border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:border-teal-600 focus:bg-white outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Especialidade</label>
                          <select
                            value={newCpRole}
                            onChange={e => setNewCpRole(e.target.value)}
                            className="w-full bg-white border-2 border-slate-200 rounded-xl px-3 py-2 text-xs font-black focus:border-teal-600 focus:bg-white outline-none cursor-pointer"
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
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Feedback e Evolução Clínico-Terapêutica</label>
                          <textarea
                            required
                            placeholder="Descreva as condutas clínicas adotadas, conquistas e condutas recomendadas..."
                            value={newCpFeedback}
                            onChange={e => setNewCpFeedback(e.target.value)}
                            className="w-full p-3 bg-white border-2 border-slate-200 rounded-xl text-xs font-semibold focus:border-teal-600 focus:bg-white outline-none h-20 resize-none"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Anotações Internas / Relato (Opcional)</label>
                          <textarea
                            placeholder="Alguma anotação interna sobre o desempenho ou respostas sensoriais..."
                            value={newCpNotes}
                            onChange={e => setNewCpNotes(e.target.value)}
                            className="w-full p-3 bg-white border-2 border-slate-200 rounded-xl text-xs font-semibold focus:border-teal-600 focus:bg-white outline-none h-20 resize-none"
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
                          className="px-5 py-2 bg-teal-600 hover:bg-teal-750 text-white text-xs font-black rounded-xl shadow-sm active:scale-95 cursor-pointer disabled:opacity-50 border-none outline-none font-Outfit"
                        >
                          {creatingCheckpoint ? 'Gravando...' : 'Gravar Checkpoint'}
                        </button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>

                <p className="text-xs text-slate-500 font-semibold leading-normal text-left">
                  Selecione uma semana abaixo para registrar laudos de evolução clínica e feedback profissional para a família.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
                  {checkpoints.map((cp: any) => {
                    const isCompleted = cp.status === 'completed';
                    return (
                      <button
                        key={cp.id}
                        type="button"
                        onClick={() => {
                          playBubble();
                          setSelectedCheckpoint(cp);
                          setFeedbackText(cp.feedback || '');
                          setProfName(cp.professionalName || '');
                          setProfRole(cp.professionalRole || 'Psicologia ABA');
                        }}
                        className={`p-4 rounded-2xl border-2 text-center flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                          selectedCheckpoint?.id === cp.id
                            ? 'bg-teal-50 border-teal-500 text-teal-950 shadow-md shadow-teal-50'
                            : isCompleted
                            ? 'bg-emerald-50/40 border-emerald-200 text-emerald-800'
                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-350'
                        }`}
                      >
                        <span className="text-xs font-black uppercase tracking-widest font-Outfit">
                          {cp.date ? new Date(cp.date + 'T00:00:00').toLocaleDateString('pt-BR') : `Semana ${cp.weekNum}`}
                        </span>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                          isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {isCompleted ? 'Logado ✓' : 'Pendente'}
                        </span>
                        {cp.date && <span className="text-[8px] text-slate-400 font-semibold">{cp.date}</span>}
                      </button>
                    );
                  })}
                </div>

                {/* Interactive Checkpoint Form */}
                <AnimatePresence mode="wait">
                  {selectedCheckpoint && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-slate-100 pt-5 mt-3 text-left"
                    >
                      <h4 className="font-extrabold text-xs text-slate-800 font-Outfit">
                        Feedback Clínico - Semana {selectedCheckpoint.weekNum}
                      </h4>
                      <form onSubmit={handleUpdateCheckpoint} className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                        <div className="md:col-span-2">
                          <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">
                            Instruções e Feedback para a Família
                          </label>
                          <textarea
                            value={feedbackText}
                            onChange={e => setFeedbackText(e.target.value)}
                            placeholder="Descreva as conquistas comportamentais, condutas adotadas e estratégias de regulação recomendadas para a semana..."
                            className="w-full p-3 bg-slate-50 border-2 border-slate-200 focus:border-teal-500 focus:bg-white rounded-xl text-xs font-semibold outline-none h-24 resize-none transition-all"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">Nome do Profissional</label>
                          <input
                            type="text"
                            value={profName}
                            onChange={e => setProfName(e.target.value)}
                            placeholder="Ex: Dra. Ana Beatriz"
                            className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-200 focus:border-teal-500 focus:bg-white rounded-xl text-xs font-bold outline-none transition-all"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">Especialidade / Registro</label>
                          <select
                            value={profRole}
                            onChange={e => setProfRole(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-200 focus:border-teal-500 focus:bg-white rounded-xl text-xs font-bold outline-none cursor-pointer transition-all"
                          >
                            <option value="Psicologia ABA">Psicologia ABA 🧠</option>
                            <option value="Terapia Ocupacional">Terapia Ocupacional 🧼</option>
                            <option value="Fonoaudiologia">Fonoaudiologia 🗣️</option>
                            <option value="Fisioterapia Postural">Fisioterapia Postural Postural 🩺</option>
                            <option value="Psicopedagogia">Psicopedagogia 📚</option>
                          </select>
                        </div>

                        {statusMsg && (
                          <p className={`md:col-span-2 text-xxs font-extrabold p-2 rounded-lg text-center ${
                            statusMsg.includes('Erro') ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                          }`}>
                            {statusMsg}
                          </p>
                        )}

                        <div className="md:col-span-2 flex gap-2 justify-end mt-1">
                          <button
                            type="button"
                            onClick={() => { playBubble(); setSelectedCheckpoint(null); }}
                            className="px-3.5 py-2 bg-slate-200 text-slate-600 text-xs font-bold rounded-xl active:scale-95 cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            disabled={savingCheckpoint}
                            className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-sm active:scale-95 cursor-pointer flex items-center gap-1 disabled:opacity-50"
                          >
                            {savingCheckpoint ? 'Gravando...' : 'Gravar Evolução'}
                          </button>
                        </div>

                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>

              {/* Child Routine Inspection */}
              <div className="bg-white border border-slate-200 p-6 rounded-[28px] shadow-premium flex flex-col gap-4 text-left">
                <div className="flex items-center justify-between gap-2 text-indigo-650 flex-wrap">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5" />
                    <h3 className="font-black text-slate-900 text-lg font-Outfit">Grade de Tarefas da Rotina</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      playBubble();
                      resetTaskForm();
                      setTaskFormOpen(true);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-indigo-650 hover:bg-indigo-750 text-white text-[10px] font-black rounded-lg active:scale-95 transition-all cursor-pointer font-Outfit shadow-xxs border-none outline-none"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar Atividade
                  </button>
                </div>

                <div className="flex flex-col gap-2.5 max-h-[400px] overflow-y-auto pr-1">
                  {tasks.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-6">Nenhuma tarefa cadastrada nesta rotina.</p>
                  ) : (
                    tasks.map((task: any) => {
                      return (
                        <div key={task.id} className="p-3 border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs bg-slate-50/50 hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-center text-lg shadow-xxs overflow-hidden shrink-0 select-none">
                              {task.customIcon ? (
                                <img src={task.customIcon} alt="" className="w-full h-full object-cover" />
                              ) : (
                                task.icon || '📅'
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap text-left">
                                <span className="font-extrabold text-slate-800 text-sm">{task.title}</span>
                                <span className="text-[8px] bg-slate-200/60 border border-slate-300 text-slate-600 px-1.5 py-0.5 rounded font-black uppercase">
                                  {task.category || 'AVD'}
                                </span>
                                {task.duration && (
                                  <span className="text-[8px] bg-indigo-50 text-indigo-700 border border-indigo-150 px-1.5 py-0.5 rounded font-black uppercase">
                                    ⏱️ {task.duration}m
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-450 font-bold mt-1 text-left">
                                Dia {task.day} • {task.time} ({task.period})
                              </p>
                              {task.description && (
                                <p className="text-[10px] text-slate-400 font-semibold mt-0.5 text-left">
                                  💡 Instruções: {task.description}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 shrink-0">
                            <span 
                              onClick={() => handleToggleTaskCompletion(task)}
                              className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase border cursor-pointer select-none active:scale-95 transition-all ${
                                task.isCompleted 
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-150 hover:bg-emerald-100' 
                                  : 'bg-amber-50 text-amber-800 border-amber-150 hover:bg-amber-100'
                              }`}
                              title="Clique para alternar conclusão"
                            >
                              {task.isCompleted ? 'Feito' : 'Pendente'}
                            </span>
                            <button
                              type="button"
                              onClick={() => startEditingTask(task)}
                              className="p-1 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-600 hover:text-indigo-650 rounded-md active:scale-90 transition-all cursor-pointer outline-none"
                              title="Editar atividade"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTask(task.id)}
                              className="p-1 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-600 hover:text-rose-650 rounded-md active:scale-90 transition-all cursor-pointer outline-none"
                              title="Remover atividade"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Interactive Task Form */}
                <AnimatePresence mode="wait">
                  {taskFormOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-slate-150 pt-5 mt-3 text-left relative overflow-hidden"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-extrabold text-xs text-slate-800 font-Outfit flex items-center gap-1.5">
                          {editingTaskId ? '📝 Editar Atividade' : '✨ Nova Atividade'}
                        </h4>
                        <button
                          type="button"
                          onClick={() => { playBubble(); setTaskFormOpen(false); resetTaskForm(); }}
                          className="text-slate-400 hover:text-slate-650 cursor-pointer p-1 border-none bg-transparent"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <form onSubmit={handleSaveTask} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-[9px] font-black text-slate-500 uppercase mb-1 pl-0.5">
                            Título da Atividade
                          </label>
                          <input
                            type="text"
                            value={taskTitle}
                            onChange={e => setTaskTitle(e.target.value)}
                            placeholder="Ex: Escovar os dentes 🪥, Terapia Ocupacional..."
                            className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-xs font-bold outline-none transition-all"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] font-black text-slate-500 uppercase mb-1 pl-0.5">
                            Horário
                          </label>
                          <input
                            type="time"
                            value={taskTime}
                            onChange={e => setTaskTime(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-xs font-bold outline-none transition-all"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] font-black text-slate-500 uppercase mb-1 pl-0.5">
                            Período
                          </label>
                          <select
                            value={taskPeriod}
                            onChange={e => setTaskPeriod(e.target.value as any)}
                            className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-xs font-bold outline-none cursor-pointer transition-all"
                          >
                            <option value="manhã">Manhã ☀️</option>
                            <option value="tarde">Tarde ⛅</option>
                            <option value="noite">Noite 🌙</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[9px] font-black text-slate-500 uppercase mb-1 pl-0.5">
                            Dia do Mês (1 a 31)
                          </label>
                          <select
                            value={taskDay}
                            onChange={e => setTaskDay(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-xs font-bold outline-none cursor-pointer transition-all"
                          >
                            {Array.from({ length: 31 }).map((_, i) => (
                              <option key={i + 1} value={String(i + 1)}>Dia {i + 1}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[9px] font-black text-slate-500 uppercase mb-1 pl-0.5">
                            Duração Estimada (minutos)
                          </label>
                          <input
                            type="number"
                            value={taskDuration}
                            onChange={e => setTaskDuration(Number(e.target.value))}
                            min={1}
                            className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-xs font-bold outline-none transition-all"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] font-black text-slate-500 uppercase mb-1 pl-0.5">
                            Categoria Clínica
                          </label>
                          <select
                            value={taskCategory}
                            onChange={e => setTaskCategory(e.target.value as any)}
                            className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-xs font-bold outline-none cursor-pointer transition-all"
                          >
                            <option value="AVD">AVD (Ativ. Vida Diária) 🧼</option>
                            <option value="Aprendizado">Aprendizado / Sessão 🧠</option>
                            <option value="Lazer">Lazer / Brincar 🎨</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[9px] font-black text-slate-500 uppercase mb-1 pl-0.5">
                            Ícone Padrão
                          </label>
                          <select
                            value={taskIcon}
                            onChange={e => setTaskIcon(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-xs font-bold outline-none cursor-pointer transition-all"
                          >
                            <option value="📅">Calendário 📅</option>
                            <option value="🧼">Higiene 🧼</option>
                            <option value="🪥">Escova 🪥</option>
                            <option value="🍲">Alimentação 🍲</option>
                            <option value="🏫">Escola 🏫</option>
                            <option value="🎨">Lazer 🎨</option>
                            <option value="🐶">Mascote 🐶</option>
                            <option value="😴">Dormir 😴</option>
                            <option value="🧸">Brinquedo 🧸</option>
                            <option value="🧠">Sessão ABA 🧠</option>
                            <option value="🗣️">Fono 🗣️</option>
                            <option value="⚽">Esporte ⚽</option>
                          </select>
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-[9px] font-black text-slate-500 uppercase mb-1 pl-0.5">
                            Ou Anexar Foto Real (PECS Customizado)
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleTaskFileChange}
                            className="w-full text-xs font-semibold text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-indigo-50 file:text-indigo-750 hover:file:bg-indigo-100 cursor-pointer"
                          />
                          {taskCustomIcon && (
                            <div className="mt-2 flex items-center gap-2">
                              <span className="text-[9px] text-slate-400 font-extrabold">Pré-visualização:</span>
                              <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-250 bg-slate-50 flex items-center justify-center">
                                <img src={taskCustomIcon} alt="" className="w-full h-full object-cover" />
                              </div>
                              <button
                                type="button"
                                onClick={() => setTaskCustomIcon('')}
                                className="text-[9px] font-bold text-red-500 hover:underline cursor-pointer border-none bg-transparent outline-none"
                              >
                                Remover foto
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-[9px] font-black text-slate-500 uppercase mb-1 pl-0.5">
                            Descrição / Instruções
                          </label>
                          <textarea
                            value={taskDescription}
                            onChange={e => setTaskDescription(e.target.value)}
                            placeholder="Descreva instruções passo a passo para a criança ou orientações sensoriais..."
                            className="w-full p-3 bg-slate-50 border-2 border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-xs font-semibold outline-none h-18 resize-none transition-all"
                          />
                        </div>

                        {taskError && (
                          <p className="md:col-span-2 text-xxs font-extrabold p-2 rounded-lg text-center bg-red-50 text-red-500 border border-red-100">
                            ⚠️ {taskError}
                          </p>
                        )}

                        <div className="md:col-span-2 flex gap-2 justify-end mt-1">
                          <button
                            type="button"
                            onClick={() => { playBubble(); setTaskFormOpen(false); resetTaskForm(); }}
                            className="px-3.5 py-2 bg-slate-250 text-slate-650 text-xs font-bold rounded-xl active:scale-95 cursor-pointer border-none outline-none"
                          >
                            Cancelar
                          </button>
                          <button
                            type="submit"
                            disabled={savingTask}
                            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-750 text-white text-xs font-bold rounded-xl shadow-sm active:scale-95 cursor-pointer flex items-center gap-1 disabled:opacity-50 border-none outline-none"
                          >
                            {savingTask ? 'Salvando...' : 'Salvar Atividade'}
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>

            {/* Right Side: Environmental Sensory Logs & Trigger Analysis */}
            <div className="lg:col-span-4 flex flex-col gap-6 text-left">
              
              {/* Sensory Heatmap */}
              {sensoryLogs.length > 0 && (
                <div className="bg-white border border-slate-200 p-5 rounded-[28px] shadow-premium flex flex-col gap-4">
                  <div className="flex items-center gap-2 text-indigo-650">
                    <Map className="w-5 h-5 text-indigo-500" />
                    <h3 className="font-black text-slate-900 text-md font-Outfit">Mapa de Calor Sensorial</h3>
                  </div>
                  <SensoryHeatmap logs={sensoryLogs} />
                </div>
              )}

              {/* Patient Behavior Dictionary / Guia de Sinais */}
              {childData && (
                <div className="bg-white border border-slate-200 p-5 rounded-[28px] shadow-premium flex flex-col gap-4 text-left">
                  <div className="flex items-center gap-2 text-indigo-650">
                    <span className="text-xl">📖</span>
                    <h3 className="font-black text-slate-900 text-md font-Outfit">Dicionário Comportamental (Sinais)</h3>
                  </div>
                  
                  <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
                    {(() => {
                      let behaviorList = [];
                      try {
                        if (childData.behaviorDictionary) {
                          behaviorList = JSON.parse(childData.behaviorDictionary);
                        }
                      } catch (e) {}

                      if (behaviorList.length === 0) {
                        return (
                          <p className="text-slate-400 text-xxs italic text-center py-4">
                            Nenhum sinal comportamental cadastrado pelos pais.
                          </p>
                        );
                      }

                      return behaviorList.map((item: any) => (
                        <div key={item.id} className="p-3 bg-indigo-50/20 border border-indigo-150 rounded-xl flex flex-col gap-1.5 text-xxs">
                          <div className="font-Outfit font-extrabold text-[11px] text-indigo-950 border-b border-indigo-100/50 pb-1">
                            📢 Sinal: {item.signal}
                          </div>
                          <div className="text-slate-700 leading-normal font-semibold">
                            <strong>🧠 Significado:</strong> {item.meaning}
                          </div>
                          <div className="text-emerald-800 leading-normal bg-emerald-50/40 border border-emerald-150 p-2 rounded-lg mt-1 font-semibold">
                            <strong>👩‍🏫 Conduta recomendada:</strong> {item.intervention}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}

              {/* Sensory Log / Crises History */}
              <div className="bg-white border border-slate-200 p-5 rounded-[28px] shadow-premium flex flex-col gap-4">
                <div className="flex items-center gap-2 text-red-650">
                  <AlertTriangle className="w-5 h-5" />
                  <h3 className="font-black text-slate-900 text-md font-Outfit">Diário Sensorial & Crises</h3>
                </div>
                
                <div className="flex flex-col gap-3 max-h-[450px] overflow-y-auto pr-1">
                  {sensoryLogs.length === 0 ? (
                    <p className="text-slate-400 text-xs italic text-center py-4">
                      Nenhum registro comportamental ou sensorial adicionado.
                    </p>
                  ) : (
                    sensoryLogs.map((log: any) => {
                      const isSchool = log.loggedBy === 'school';
                      const isChild = log.loggedBy === 'child';
                      const isAac = log.notes?.startsWith('Comunicação AAC:');
                      const cardBg = log.crisisOccurred 
                        ? 'bg-red-50/20 border-red-150 text-red-950' 
                        : isAac
                        ? 'bg-teal-50/30 border-teal-200 text-teal-950'
                        : isSchool 
                        ? 'bg-yellow-50/25 border-yellow-200 text-yellow-950' 
                        : isChild
                        ? 'bg-emerald-50/20 border-emerald-150 text-emerald-950'
                        : 'bg-indigo-50/20 border-indigo-150 text-indigo-950';

                      return (
                        <div key={log.id} className={`p-3 border rounded-xl flex flex-col gap-1.5 text-xxs ${cardBg}`}>
                          <div className="flex justify-between font-black text-[9px] text-slate-400 uppercase font-Outfit">
                            <span>{new Date(log.timestamp).toLocaleString()}</span>
                            <span className="tracking-wide">
                              {isSchool ? '🏫 ESCOLA' : isAac ? '🗣️ COMUNICAÇÃO AAC' : isChild ? '👶 CRIANÇA' : '👪 CUIDADOR'} - {log.crisisOccurred ? '🚨 Crise' : `🧠 Humor: ${log.mood}`}
                            </span>
                          </div>
                          {log.notes && (
                            <p className="font-semibold text-slate-700 leading-relaxed">
                              {log.notes}
                            </p>
                          )}
                          {isSchool && (log.foodIntake || log.schoolNoise) && (
                            <div className="flex gap-2.5 my-1 text-[9px] text-slate-550 font-extrabold bg-white/70 px-2 py-1 rounded border border-slate-200">
                              {log.foodIntake && (
                                <span>🍲 Alimentação: {
                                  log.foodIntake === 'boa' ? 'Boa 🟢' : log.foodIntake === 'regular' ? 'Regular 🟡' : 'Recusou 🔴'
                                }</span>
                              )}
                              {log.schoolNoise && (
                                <span>🔊 Barulho: {
                                  log.schoolNoise === 'baixo' ? 'Baixo 🟢' : log.schoolNoise === 'medio' ? 'Médio 🟡' : 'Alto 🔴'
                                }</span>
                              )}
                            </div>
                          )}
                          {(log.antecedent || log.behavior || log.consequence) && (
                            <div className="bg-slate-100/60 border border-slate-200/40 p-2 rounded-lg mt-1 text-[10px] text-slate-650 font-bold flex flex-col gap-0.5">
                              {log.antecedent && <div><strong>A (Antecedente):</strong> {log.antecedent}</div>}
                              {log.behavior && <div><strong>B (Comportamento):</strong> {log.behavior}</div>}
                              {log.consequence && <div><strong>C (Consequência):</strong> {log.consequence}</div>}
                            </div>
                          )}
                          {(log.location || log.lightLevel || (log.decibels !== undefined && log.decibels !== null) || log.trigger) && (
                            <div className="flex flex-wrap gap-1.5 pt-1.5 border-t border-slate-100 text-[9px] text-slate-500 font-bold">
                              {log.location && <span className="flex items-center gap-0.5 bg-white border border-slate-200 px-1.5 py-0.5 rounded-md"><MapPin className="w-2.5 h-2.5" /> {log.location}</span>}
                              {log.lightLevel && <span className="flex items-center gap-0.5 bg-white border border-slate-200 px-1.5 py-0.5 rounded-md"><Sun className="w-2.5 h-2.5" /> Luz: {log.lightLevel}</span>}
                              {log.decibels !== undefined && log.decibels !== null && <span className="flex items-center gap-0.5 bg-white border border-slate-200 px-1.5 py-0.5 rounded-md"><Volume2 className="w-2.5 h-2.5" /> {log.decibels}dB</span>}
                              {log.trigger && <span className="flex items-center gap-0.5 bg-white border border-slate-200 px-1.5 py-0.5 rounded-md">🎯 {log.trigger}</span>}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* Clinician PDF Report Template */}
      {childData && (
        <div className="print-only">
          <div className="p-8 max-w-4xl mx-auto flex flex-col gap-6 text-[#0f172a] text-left">
            
            {/* Header */}
            <div className="border-b-4 border-teal-650 pb-4 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-black text-teal-605 tracking-tight font-Outfit">LAUDO COMPORTAMENTAL / SENSORIAL</h1>
                <p className="text-sm text-slate-505 font-semibold mt-1">Rotina Animada SaaS - Relatório Clínico de Aderência</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase">Data de Emissão</p>
                <p className="text-sm font-black text-slate-700 font-Outfit">{new Date().toLocaleDateString()}</p>
              </div>
            </div>

            {/* Patient Profile info */}
            <div className="grid grid-cols-3 gap-6 border-b border-slate-200 pb-5">
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase">Criança (Paciente)</span>
                <p className="text-sm font-black text-slate-800 mt-0.5">{childData.name}</p>
                <p className="text-[10px] text-slate-500 font-semibold">Gênero: {childData.gender || 'Não informado'}</p>
                {childData.emotionalBattery && (
                  <p className="text-[10px] text-slate-550 font-bold mt-0.5">🔋 Bateria Emocional: {
                    childData.emotionalBattery === 'green' ? 'Ótimo (100%)' : childData.emotionalBattery === 'yellow' ? 'Cansado (50%)' : 'Sobrecarregado (10%)'
                  }</p>
                )}
              </div>
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase">Diagnóstico Clínico</span>
                <p className="text-sm font-black text-slate-800 mt-0.5">{childData.diagnosis || 'Não informado'}</p>
                <p className="text-[10px] text-slate-500 font-semibold">Hiperfoco: {childData.childHyperfocus || 'Não cadastrado'}</p>
              </div>
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase">Código de Vínculo</span>
                <p className="text-sm font-black text-teal-700 mt-0.5 uppercase">{childData.sharingCode}</p>
              </div>
            </div>

            {/* Core Indicators */}
            <div className="grid grid-cols-3 gap-4 border-b border-slate-200 pb-5">
              <div className="border border-slate-200 p-3.5 rounded-xl text-center">
                <span className="text-[9px] font-black text-slate-400 uppercase">Aderência Geral</span>
                <p className="text-2xl font-black text-slate-800 mt-1">{complianceRate}%</p>
                <span className="text-[8px] text-slate-450 font-semibold">{completedTasksElapsed} de {totalTasksElapsed} tarefas concluídas</span>
              </div>
              <div className="border border-slate-200 p-3.5 rounded-xl text-center">
                <span className="text-[9px] font-black text-slate-400 uppercase">Estabilidade Emocional</span>
                <p className="text-2xl font-black text-slate-850 mt-1">{stabilityRate}%</p>
                <span className="text-[8px] text-slate-450 font-semibold">Humor predominantemente regulado</span>
              </div>
              <div className="border border-slate-200 p-3.5 rounded-xl text-center">
                <span className="text-[9px] font-black text-slate-400 uppercase">Meltdown / Crises</span>
                <p className="text-2xl font-black text-red-650 mt-1">{crisesCount}</p>
                <span className="text-[8px] text-slate-455 font-semibold">Crises sensorio-comportamentais</span>
              </div>
            </div>

            {/* Checkpoints logs */}
            <div>
              <h3 className="text-xs font-black uppercase text-slate-450 tracking-widest mb-3 border-b border-slate-100 pb-1 font-Outfit">Evolução Clínico-Terapêutica</h3>
              <div className="flex flex-col gap-3">
                {checkpoints.filter((cp: any) => cp.status === 'completed').length === 0 ? (
                  <p className="text-xs text-slate-405 italic">Nenhum feedback clínico registrado para este mês.</p>
                ) : (
                  checkpoints.filter((cp: any) => cp.status === 'completed').map((cp: any) => (
                    <div key={cp.id} className="border border-slate-200 p-3.5 rounded-xl bg-slate-50/50">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
                        <span>Semana {cp.weekNum} ({cp.date})</span>
                        <span>Especialista: {cp.professionalName} ({cp.professionalRole})</span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed font-semibold">
                        {cp.feedback}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {sensoryLogs.filter((log: any) => log.latitude !== undefined && log.longitude !== undefined).length > 0 && (
              <div>
                <h3 className="text-xs font-black uppercase text-slate-450 tracking-widest mb-3 border-b border-slate-100 pb-1 font-Outfit">Mapa de Calor Sensorial (Gatilhos de Crises)</h3>
                <div className="mb-4">
                  <SensoryHeatmap logs={sensoryLogs} />
                </div>
              </div>
            )}

            {/* Sensory Log / Crises ABC Table */}
            <div>
              <h3 className="text-xs font-black uppercase text-slate-450 tracking-widest mb-3 border-b border-slate-100 pb-1 font-Outfit">Histórico Detalhado de Crises & Análise ABA (ABC)</h3>
              {sensoryLogs.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Sem registros comportamentais.</p>
              ) : (
                <table className="w-full text-left border-collapse text-xxs mt-2">
                  <thead>
                    <tr className="border-b-2 border-slate-300 text-[9px] font-black uppercase text-slate-450">
                      <th className="py-2 pr-2">Data/Hora</th>
                      <th className="py-2 pr-2">Evento</th>
                      <th className="py-2 pr-2">A (Antecedente)</th>
                      <th className="py-2 pr-2">B (Comportamento)</th>
                      <th className="py-2 pr-2">C (Consequência)</th>
                      <th className="py-2">Gatilho/Ambiente</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sensoryLogs.map((log: any) => {
                      const isAac = log.notes?.startsWith('Comunicação AAC:');
                      return (
                        <tr key={log.id} className="border-b border-slate-200/80 py-2">
                          <td className="py-2 pr-2 font-bold text-slate-500 whitespace-nowrap">{new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                          <td className="py-2 pr-2 font-extrabold text-slate-800">
                            {log.crisisOccurred ? '🚨 Crise' : isAac ? '🗣️ AAC' : `Humor: ${log.mood}`}
                            <span className="block text-[8px] text-slate-400 uppercase font-black tracking-wider mt-0.5">
                              {log.loggedBy === 'school' ? '🏫 Escola' : isAac ? '🗣️ Comunicação' : log.loggedBy === 'child' ? '👶 Criança' : '👪 Cuidador'}
                            </span>
                          </td>
                          <td className="py-2 pr-2 text-slate-650 font-semibold">{log.antecedent || '-'}</td>
                          <td className="py-2 pr-2 text-slate-650 font-semibold">{isAac ? log.notes : (log.behavior || '-')}</td>
                          <td className="py-2 pr-2 text-slate-650 font-semibold">{log.consequence || '-'}</td>
                          <td className="py-2 text-slate-500 font-bold">
                            {log.loggedBy === 'school' ? (
                              <div className="flex flex-col gap-0.5 text-[8px] font-Outfit">
                                {log.foodIntake && <span>🍲 Alimentação: {log.foodIntake}</span>}
                                {log.schoolNoise && <span>🔊 Barulho: {log.schoolNoise}</span>}
                              </div>
                            ) : (
                              <>
                                {log.trigger && <span>🎯 {log.trigger}</span>}
                                {log.location && <span className="block text-[8px] mt-0.5">📍 {log.location} ({log.decibels || 50}dB)</span>}
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Signature section */}
            <div className="mt-16 pt-8 border-t border-slate-200 flex justify-between">
              <div className="text-center w-48">
                <div className="border-b border-slate-300 h-8"></div>
                <p className="text-[9px] font-black uppercase text-slate-450 mt-2">Assinatura do Profissional</p>
              </div>
              <div className="text-center w-48">
                <div className="border-b border-slate-300 h-8"></div>
                <p className="text-[9px] font-black uppercase text-slate-450 mt-2">Responsável Legal</p>
              </div>
            </div>

          </div>
        </div>
      )}
    </main>
  );
}
