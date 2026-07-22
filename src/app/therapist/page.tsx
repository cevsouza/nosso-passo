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
import { useLanguage } from '../../lib/LanguageContext';
import { LanguageSelector } from '../../components/LanguageSelector';
import { SensoryHeatmap } from '../../components/SensoryHeatmap';
import { GlobalNav } from '../../components/GlobalNav';
import { DEMO_CODES } from '../../lib/demo-credentials';
import { PrintFooter } from '../../components/PrintFooter';

export default function TherapistPortal() {
  const { t, locale } = useLanguage();
  const [sharingCode, setSharingCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [childData, setChildData] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'checkpoints' | 'routine' | 'analysis'>('checkpoints');

  // --- Unified role-aware guest portal ---
  const role: string = (childData as any)?._role || 'therapist';
  const canEdit = role === 'therapist';
  const [logMood, setLogMood] = useState('calmo');
  const [logCrisis, setLogCrisis] = useState(false);
  const [logNoise, setLogNoise] = useState('medio');
  const [logFood, setLogFood] = useState('boa');
  const [logNotes, setLogNotes] = useState('');
  const [logBusy, setLogBusy] = useState(false);
  const [logOk, setLogOk] = useState(false);
  const submitLog = async () => {
    if (!childData) return;
    setLogBusy(true);
    try {
      const res = await fetch('/api/sensory-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-share-code': sharingCode.trim() },
        body: JSON.stringify({
          childId: childData.id, mood: logMood, crisisOccurred: logCrisis,
          loggedBy: 'school', location: locale === 'en' ? 'School' : locale === 'es' ? 'Escuela' : 'Escola',
          schoolNoise: logNoise, foodIntake: logFood,
          notes: logNotes.trim() || (locale === 'en' ? 'School checkpoint' : locale === 'es' ? 'Checkpoint escolar' : 'Checkpoint escolar'),
        }),
      });
      const d = await res.json();
      if (!res.ok || d.error) throw new Error(d.error || 'Erro');
      setLogOk(true); setLogNotes(''); setTimeout(() => setLogOk(false), 2500);
    } catch (e: any) { alert(e.message || 'Erro'); }
    finally { setLogBusy(false); }
  };

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
      const res = await fetch('/api/therapist', { headers: { 'x-share-code': finalCode.toUpperCase() } });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (locale === 'en' ? 'Invalid code' : locale === 'es' ? 'Código inválido' : 'Código inválido'));
      }
      setChildData(data);
      playMarimba(523, 0.4);
    } catch (err: any) {
      setErrorMsg(err.message || (locale === 'en' ? 'Invalid or inactive sharing code.' : locale === 'es' ? 'Código de compartido inválido o inactivo.' : 'Código de compartilhamento inválido ou inativo.'));
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
    if (!window.confirm(locale === 'en' ? 'Are you sure you want to remove this activity from the routine?' : locale === 'es' ? '¿Está seguro de que desea eliminar esta actividad de la rutina?' : 'Tem certeza que deseja remover esta atividade da rotina?') || !childData) return;
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
      alert(err.message || (locale === 'en' ? 'Error removing task.' : locale === 'es' ? 'Error al eliminar la tarea.' : 'Erro ao remover tarefa.'));
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
      alert(err.message || (locale === 'en' ? 'Error updating task.' : locale === 'es' ? 'Error al actualizar la tarea.' : 'Erro ao atualizar tarefa.'));
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
      setStatusMsg(locale === 'en' ? 'Clinical progress saved successfully!' : locale === 'es' ? '¡Evolución clínica registrada con éxito!' : 'Evolução clínica gravada com sucesso!');
      setTimeout(() => {
        setSelectedCheckpoint(null);
        setStatusMsg('');
      }, 1500);
    } catch (err: any) {
      setStatusMsg(`${locale === 'en' ? 'Error' : locale === 'es' ? 'Error' : 'Erro'}: ${err.message}`);
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
      if (!res.ok) throw new Error(created.error || (locale === 'en' ? 'Error creating daily checkpoint' : locale === 'es' ? 'Error al crear el punto de control diario' : 'Erro ao criar checkpoint diário'));

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
      setStatusMsg(locale === 'en' ? 'Clinical daily checkpoint registered successfully!' : locale === 'es' ? '¡Checkpoint diario clínico registrado con éxito!' : 'Checkpoint diário clínico registrado com sucesso!');
      setTimeout(() => {
        setStatusMsg('');
      }, 2000);
    } catch (err: any) {
      setStatusMsg(`${locale === 'en' ? 'Error' : locale === 'es' ? 'Error' : 'Erro'}: ${err.message}`);
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
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50">
      <GlobalNav />
      <main className="flex-1 min-h-screen p-4 md:p-8 text-slate-800">
      
      {/* Clinician Entry Verification */}
      {!childData ? (
        <div className="max-w-md mx-auto my-16 bg-white border border-slate-200 rounded-2xl p-8 shadow-premium-soft flex flex-col gap-6 relative overflow-hidden">
          
          <div className="flex justify-between items-start gap-4">
            <div className="text-left">
              <div className="w-12 h-12 bg-teal-50 text-teal-655 rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-teal-100">
                🩺
              </div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight mt-3 font-Outfit">{t.therapist.portalTitle}</h1>
              <p className="text-[10px] text-slate-400 font-semibold mt-1 leading-normal max-w-[220px]">
                {t.therapist.portalDesc}
              </p>
            </div>
            <div className="shrink-0">
              <LanguageSelector />
            </div>
          </div>

          <form onSubmit={handleVerify} className="flex flex-col gap-4">
            <div>
              <label className="block text-xxs font-black text-slate-500 uppercase tracking-widest mb-1.5 font-Outfit">
                {t.therapist.sharingCodeLabel}
              </label>
              <input
                type="text"
                placeholder="Ex: ABCD2345"
                value={sharingCode}
                onChange={e => setSharingCode(e.target.value)}
                /* Os codigos gerados em /api/share tem 8 caracteres. */
                maxLength={8}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-black tracking-widest text-center text-lg uppercase outline-none focus:border-teal-500 focus:bg-white text-slate-800"
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
              {verifying ? t.therapist.btnValidating : (t.therapist.btnAccess + (locale === 'en' ? ' Clinical Chart' : locale === 'es' ? ' Historial Clínico' : ' Prontuário Clínico'))}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
          
          <button
            type="button"
            onClick={() => setSharingCode(DEMO_CODES.teoTherapist)}
            className="text-[11px] font-black text-teal-700 hover:text-teal-900 hover:underline cursor-pointer bg-transparent border-none outline-none font-Outfit -mt-2"
          >
            {locale === 'en'
              ? '👀 Use the demo code (fictional patient)'
              : locale === 'es'
              ? '👀 Usar el código de demostración (paciente ficticio)'
              : '👀 Usar o código de demonstração (paciente fictício)'}
          </button>

          <span className="text-[9px] text-slate-400 font-medium text-center">
            {locale === 'en' ? '* The code must be generated by parents in the child profile settings in the guardian panel.' : locale === 'es' ? '* El código debe ser generado por los padres en la configuración del perfil del niño en el panel del tutor.' : '* O código deve ser gerado pelos pais nas configurações do perfil da criança no painel do responsável.'}
          </span>
        </div>
      ) : (
        /* Therapist Dashboard View */
        <div className="max-w-6xl mx-auto flex flex-col gap-6">
          
          {/* Header Card */}
          <div className="bg-white border border-slate-250 rounded-2xl p-6 shadow-premium flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 grad-primary"></div>
            
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 grad-primary text-white rounded-2xl flex items-center justify-center text-3xl shadow-md select-none font-Outfit">
                {childData.gender === 'Feminino' ? '👧' : childData.gender === 'Masculino' ? '👦' : '👶'}
              </div>
              <div className="text-left">
                <span className="text-[9px] font-black uppercase bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1 rounded-full tracking-wider">
                  {role === 'school' ? (locale === 'en' ? 'School access' : locale === 'es' ? 'Acceso escolar' : 'Acesso Escolar') : role === 'readonly' ? (locale === 'en' ? 'Read-only' : locale === 'es' ? 'Solo lectura' : 'Somente Leitura') : (locale === 'en' ? 'Active Clinical Chart' : locale === 'es' ? 'Historial Clínico Activo' : 'Prontuário Clínico Ativo')}
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
                      {childData.emotionalBattery === 'green' ? (locale === 'en' ? '🔋 Great' : locale === 'es' ? '🔋 Excelente' : '🔋 Ótimo') : childData.emotionalBattery === 'yellow' ? (locale === 'en' ? '⚡ Tired' : locale === 'es' ? '⚡ Cansado' : '⚡ Cansado') : (locale === 'en' ? '🪫 Overloaded' : locale === 'es' ? '🪫 Sobrecargado' : '🪫 Sobrecarregado')}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-1.5 text-xs text-slate-500 font-bold">
                  {childData.diagnosis && <span>🎯 {locale === 'en' ? 'Diagnosis:' : locale === 'es' ? 'Diagnóstico:' : 'Diagnóstico:'} <strong className="text-slate-800">{childData.diagnosis}</strong></span>}
                  {childData.childHyperfocus && <span>🚀 {locale === 'en' ? 'Hyperfocus:' : locale === 'es' ? 'Hiperenfoque:' : 'Hiperfoco:'} <strong className="text-indigo-650">{childData.childHyperfocus}</strong></span>}
                </div>
              </div>
            </div>

            <div className="flex gap-2 items-center self-start md:self-center">
              <LanguageSelector />
              <button
                onClick={() => { playBubble(); window.print(); }}
                className="px-4 py-2.5 bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-700 text-xs font-black rounded-xl cursor-pointer active:scale-95 transition-all font-Outfit"
              >
                {locale === 'en' ? '🖨️ Export Clinical PDF' : locale === 'es' ? '🖨️ Exportar PDF Clínico' : '🖨️ Exportar PDF Clínico'}
              </button>
              
              <button
                onClick={() => { playBubble(); setChildData(null); setSharingCode(''); }}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-250 text-slate-600 text-xs font-black rounded-xl cursor-pointer active:scale-95 transition-all font-Outfit"
              >
                {locale === 'en' ? '🔒 Exit Chart' : locale === 'es' ? '🔒 Salir del Historial' : '🔒 Sair do Prontuário'}
              </button>
            </div>
          </div>

          {/* Role banner + school logging (unified portal) */}
          {role !== 'therapist' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 print:hidden">
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 shrink-0">
                {role === 'school' ? (locale === 'en' ? 'School' : locale === 'es' ? 'Escuela' : 'Escola') : (locale === 'en' ? 'Read-only' : locale === 'es' ? 'Solo lectura' : 'Somente leitura')}
              </span>
              <span className="text-xs text-slate-500 font-semibold">
                {role === 'school'
                  ? (locale === 'en' ? 'View the routine and log observations below. You cannot edit the routine.' : locale === 'es' ? 'Ve la rutina y registra observaciones abajo. No puedes editar la rutina.' : 'Veja a rotina e registre observações abaixo. Você não edita a rotina.')
                  : (locale === 'en' ? 'View-only access to this chart.' : locale === 'es' ? 'Acceso solo de lectura.' : 'Acesso somente de leitura a este prontuário.')}
              </span>
            </div>
          )}

          {role === 'school' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col gap-4 print:hidden">
              <h3 className="text-sm font-black text-slate-800 font-Outfit flex items-center gap-2">
                <ClipboardCheck className="w-4.5 h-4.5 text-indigo-600" /> {locale === 'en' ? 'Sensory log' : locale === 'es' ? 'Registro sensorial' : 'Registro sensorial'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="flex flex-col gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  {locale === 'en' ? 'Mood' : locale === 'es' ? 'Ánimo' : 'Humor'}
                  <select value={logMood} onChange={e => setLogMood(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500 cursor-pointer normal-case">
                    <option value="feliz">😀 {locale === 'en' ? 'Happy' : 'Feliz'}</option>
                    <option value="calmo">😌 {locale === 'en' ? 'Calm' : locale === 'es' ? 'Tranquilo' : 'Calmo'}</option>
                    <option value="agitado">😣 {locale === 'en' ? 'Agitated' : 'Agitado'}</option>
                    <option value="triste">😢 {locale === 'en' ? 'Sad' : locale === 'es' ? 'Triste' : 'Triste'}</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  {locale === 'en' ? 'Noise' : locale === 'es' ? 'Ruido' : 'Ruído'}
                  <select value={logNoise} onChange={e => setLogNoise(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500 cursor-pointer normal-case">
                    <option value="baixo">{locale === 'en' ? 'Low' : locale === 'es' ? 'Bajo' : 'Baixo'}</option>
                    <option value="medio">{locale === 'en' ? 'Medium' : locale === 'es' ? 'Medio' : 'Médio'}</option>
                    <option value="alto">{locale === 'en' ? 'High' : locale === 'es' ? 'Alto' : 'Alto'}</option>
                  </select>
                </label>
                <label className="flex flex-col gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  {locale === 'en' ? 'Food' : locale === 'es' ? 'Comida' : 'Alimentação'}
                  <select value={logFood} onChange={e => setLogFood(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 outline-none focus:border-indigo-500 cursor-pointer normal-case">
                    <option value="boa">{locale === 'en' ? 'Good' : locale === 'es' ? 'Buena' : 'Boa'}</option>
                    <option value="parcial">{locale === 'en' ? 'Partial' : 'Parcial'}</option>
                    <option value="recusou">{locale === 'en' ? 'Refused' : locale === 'es' ? 'Rechazó' : 'Recusou'}</option>
                  </select>
                </label>
              </div>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-600">
                <input type="checkbox" checked={logCrisis} onChange={e => setLogCrisis(e.target.checked)} className="w-4 h-4 accent-indigo-600" />
                {locale === 'en' ? 'A crisis occurred today' : locale === 'es' ? 'Hubo una crisis hoy' : 'Houve uma crise hoje'}
              </label>
              <textarea value={logNotes} onChange={e => setLogNotes(e.target.value)} rows={2} placeholder={locale === 'en' ? 'Notes (optional)' : locale === 'es' ? 'Notas (opcional)' : 'Observações (opcional)'} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:border-indigo-500 resize-none" />
              <button onClick={submitLog} disabled={logBusy} className="self-start inline-flex items-center gap-2 px-4 py-2.5 grad-primary text-white text-sm font-black rounded-lg cursor-pointer active:scale-95 disabled:opacity-50 transition-all font-Outfit">
                {logBusy ? '...' : logOk ? (locale === 'en' ? 'Saved ✓' : locale === 'es' ? 'Guardado ✓' : 'Registrado ✓') : (locale === 'en' ? 'Log observation' : locale === 'es' ? 'Registrar' : 'Registrar')}
              </button>
            </div>
          )}

          {/* Sticky Tab Bar Container for Therapist Portal */}
          <div className="sticky top-[130px] md:top-[80px] z-20 bg-[#f2f0fc]/95 backdrop-blur-md py-3 -mx-2 px-2 print:hidden">
            <div className="bg-slate-100/80 p-1.5 rounded-2xl flex shadow-inner gap-1 overflow-x-auto scrollbar-none">
              <button
                type="button"
                onClick={() => { playBubble(); setActiveTab('checkpoints'); }}
                className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 shrink-0 font-Outfit cursor-pointer select-none active:scale-95 border-none outline-none ${
                  activeTab === 'checkpoints'
                    ? 'bg-white text-teal-950 shadow-sm border border-slate-200/50 scale-100'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                }`}
              >
                <ClipboardCheck className="w-4.5 h-4.5" />
                {locale === 'en' ? 'Sessions & Evolution 📝' : locale === 'es' ? 'Sesiones y Evolución 📝' : 'Sessões & Evolução'}
              </button>

              <button
                type="button"
                onClick={() => { playBubble(); setActiveTab('routine'); }}
                className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 shrink-0 font-Outfit cursor-pointer select-none active:scale-95 border-none outline-none ${
                  activeTab === 'routine'
                    ? 'bg-white text-teal-950 shadow-sm border border-slate-200/50 scale-100'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                }`}
              >
                <Calendar className="w-4.5 h-4.5" />
                {locale === 'en' ? 'Prescribe Routine 📅' : locale === 'es' ? 'Prescribir Rutina 📅' : 'Prescrever Rotina'}
              </button>

              <button
                type="button"
                onClick={() => { playBubble(); setActiveTab('analysis'); }}
                className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 shrink-0 font-Outfit cursor-pointer select-none active:scale-95 border-none outline-none ${
                  activeTab === 'analysis'
                    ? 'bg-white text-teal-950 shadow-sm border border-slate-200/50 scale-100'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                }`}
              >
                <TrendingUp className="w-4.5 h-4.5" />
                {locale === 'en' ? 'Analysis & Diary 📊' : locale === 'es' ? 'Análisis y Diario 📊' : 'Análise & Diário'}
              </button>
            </div>
          </div>

          {/* Checkpoints Tab Content */}
          <div className={activeTab === 'checkpoints' ? "w-full flex flex-col gap-6" : "hidden print:flex print:flex-col print:gap-6 print:w-full"}>
              {/* Checkpoints Tracker */}
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-premium flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 text-teal-650 text-left">
                    <ClipboardCheck className="w-5 h-5" />
                    <h3 className="font-black text-slate-900 text-lg font-Outfit">
                      {locale === 'en' ? 'Clinical Evolution & Sessions' : locale === 'es' ? 'Evolución Clínica y Sesiones' : 'Evolução Clínica & Sessões Clínicas'}
                    </h3>
                  </div>
                  {canEdit && (
                  <button
                    type="button"
                    onClick={() => { playBubble(); setNewCpOpen(!newCpOpen); if (!newCpDate) setNewCpDate(new Date().toISOString().split('T')[0]); }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-teal-50 border border-teal-100 hover:bg-teal-100 text-teal-700 text-xs font-black rounded-full shadow-sm transition-all cursor-pointer font-Outfit border-none outline-none"
                  >
                    <Plus className="w-4 h-4" /> {newCpOpen ? (locale === 'en' ? 'Close Form' : locale === 'es' ? 'Cerrar Registro' : 'Fechar Cadastro') : (locale === 'en' ? 'New Daily Checkpoint' : locale === 'es' ? 'Nuevo Checkpoint Diario' : 'Novo Checkpoint Diário')}
                  </button>
                  )}
                </div>

                <AnimatePresence>
                  {newCpOpen && (
                    <motion.form
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      onSubmit={handleCreateDailyCheckpoint}
                      className="bg-slate-50 border border-dashed border-slate-200 p-5 rounded-2xl overflow-hidden flex flex-col gap-4 text-xs text-left"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                            {locale === 'en' ? 'Session Date' : locale === 'es' ? 'Fecha de la Sesión' : 'Data da Sessão'}
                          </label>
                          <input
                            type="date"
                            required
                            value={newCpDate}
                            onChange={e => setNewCpDate(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:border-teal-600 focus:bg-white outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                            {locale === 'en' ? 'Professional Name' : locale === 'es' ? 'Nombre del Profesional' : 'Nome do Profissional'}
                          </label>
                          <input
                            type="text"
                            required
                            placeholder={locale === 'en' ? 'e.g. Dr. Carlos Reis' : locale === 'es' ? 'Ej: Dr. Carlos Reis' : 'Ex: Dr. Carlos Reis'}
                            value={newCpName}
                            onChange={e => setNewCpName(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:border-teal-600 focus:bg-white outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                            {locale === 'en' ? 'Specialty' : locale === 'es' ? 'Especialidad' : 'Especialidade'}
                          </label>
                          <select
                            value={newCpRole}
                            onChange={e => setNewCpRole(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-black focus:border-teal-600 focus:bg-white outline-none cursor-pointer"
                          >
                            <option value="Psicologia ABA">{locale === 'en' ? 'ABA Psychology' : locale === 'es' ? 'Psicología ABA' : 'Psicologia ABA'} 🧠</option>
                            <option value="Terapia Ocupacional">{locale === 'en' ? 'Occupational Therapy' : locale === 'es' ? 'Terapia Ocupacional' : 'Terapia Ocupacional'} 🧼</option>
                            <option value="Fonoterapia">{locale === 'en' ? 'Speech Therapy' : locale === 'es' ? 'Logopedia' : 'Fonoterapia'} 🗣️</option>
                            <option value="Fisioterapia">{locale === 'en' ? 'Physical Therapy' : locale === 'es' ? 'Fisioterapia' : 'Fisioterapia'} 🩺</option>
                            <option value="Psicoterapia">{locale === 'en' ? 'Psychotherapy' : locale === 'es' ? 'Psicoterapia' : 'Psicoterapia'} 💬</option>
                            <option value="Psicomotricidade">{locale === 'en' ? 'Psychomotor Skills' : locale === 'es' ? 'Psicomotricidad' : 'Psicomotricidade'} 🏃</option>
                            <option value="Outro">{locale === 'en' ? 'Other' : locale === 'es' ? 'Otro' : 'Outro'} 🧑‍⚕️</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                            {locale === 'en' ? 'Clinical-Therapeutic Feedback & Evolution' : locale === 'es' ? 'Feedback y Evolución Clínico-Terapéutica' : 'Feedback e Evolução Clínico-Terapêutica'}
                          </label>
                          <textarea
                            required
                            placeholder={locale === 'en' ? 'Describe clinical measures, achievements and recommended guidelines...' : locale === 'es' ? 'Describa las medidas clínicas adoptadas, logros y pautas recomendadas...' : 'Descreva as condutas clínicas adotadas, conquistas e condutas recomendadas...'}
                            value={newCpFeedback}
                            onChange={e => setNewCpFeedback(e.target.value)}
                            className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:border-teal-600 focus:bg-white outline-none h-20 resize-none"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                            {locale === 'en' ? 'Internal Notes / Report (Optional)' : locale === 'es' ? 'Notas Internas / Informe (Opcional)' : 'Anotações Internas / Relato (Opcional)'}
                          </label>
                          <textarea
                            placeholder={locale === 'en' ? 'Any internal note on performance or sensory responses...' : locale === 'es' ? 'Cualquier nota interna sobre rendimiento o respuestas sensoriales...' : 'Alguma anotação interna sobre o desempenho ou respostas sensoriais...'}
                            value={newCpNotes}
                            onChange={e => setNewCpNotes(e.target.value)}
                            className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:border-teal-600 focus:bg-white outline-none h-20 resize-none"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 mt-1">
                        <button
                          type="button"
                          onClick={() => { playBubble(); setNewCpOpen(false); }}
                          className="px-4 py-2 bg-slate-200 text-slate-705 text-xs font-bold rounded-xl active:scale-95 cursor-pointer border-none outline-none"
                        >
                          {t.common.cancel || 'Cancelar'}
                        </button>
                        <button
                          type="submit"
                          disabled={creatingCheckpoint}
                          className="px-5 py-2 bg-teal-600 hover:bg-teal-750 text-white text-xs font-black rounded-xl shadow-sm active:scale-95 cursor-pointer disabled:opacity-50 border-none outline-none font-Outfit"
                        >
                          {creatingCheckpoint ? (locale === 'en' ? 'Saving...' : locale === 'es' ? 'Guardando...' : 'Gravando...') : (locale === 'en' ? 'Save Checkpoint' : locale === 'es' ? 'Guardar Checkpoint' : 'Gravar Checkpoint')}
                        </button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>

                <p className="text-xs text-slate-500 font-semibold leading-normal text-left">
                  {locale === 'en' ? 'Select a week below to record clinical evolution reports and professional feedback for the family.' : locale === 'es' ? 'Seleccione una semana a continuación para registrar informes de evolución clínica y comentarios profesionales para la familia.' : 'Selecione uma semana abaixo para registrar laudos de evolução clínica e feedback profissional para a família.'}
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
                        className={`p-4 rounded-2xl border text-center flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                          selectedCheckpoint?.id === cp.id
                            ? 'bg-teal-50 border-teal-500 text-teal-950 shadow-md shadow-teal-50'
                            : isCompleted
                            ? 'bg-emerald-50/40 border-emerald-200 text-emerald-800'
                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-350'
                        }`}
                      >
                        <span className="text-xs font-black uppercase tracking-widest font-Outfit">
                          {cp.date ? new Date(cp.date + 'T00:00:00').toLocaleDateString(locale === 'en' ? 'en-US' : locale === 'es' ? 'es-ES' : 'pt-BR') : `${locale === 'en' ? 'Week' : locale === 'es' ? 'Semana' : 'Semana'} ${cp.weekNum}`}
                        </span>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                          isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {isCompleted ? (locale === 'en' ? 'Logged ✓' : locale === 'es' ? 'Registrado ✓' : 'Logado ✓') : (locale === 'en' ? 'Pending' : locale === 'es' ? 'Pendiente' : 'Pendente')}
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
                        {locale === 'en' ? 'Clinical Feedback - Week' : locale === 'es' ? 'Feedback Clínico - Semana' : 'Feedback Clínico - Semana'} {selectedCheckpoint.weekNum}
                      </h4>
                      <form onSubmit={handleUpdateCheckpoint} className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                        <div className="md:col-span-2">
                          <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">
                            {locale === 'en' ? 'Instructions and Feedback for the Family' : locale === 'es' ? 'Instrucciones y Feedback para la Familia' : 'Instruções e Feedback para a Família'}
                          </label>
                          <textarea
                            value={feedbackText}
                            onChange={e => setFeedbackText(e.target.value)}
                            placeholder={locale === 'en' ? 'Describe behavioral achievements, adopted actions, and recommended regulation strategies for the week...' : locale === 'es' ? 'Describa los logros de comportamiento, conductas adoptadas y estrategias de regulación recomendadas para la semana...' : 'Descreva as conquistas comportamentais, condutas adotadas e estratégias de regulação recomendadas para a semana...'}
                            className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-teal-500 focus:bg-white rounded-xl text-xs font-semibold outline-none h-24 resize-none transition-all"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">
                            {locale === 'en' ? 'Professional Name' : locale === 'es' ? 'Nombre del Profesional' : 'Nome do Profissional'}
                          </label>
                          <input
                            type="text"
                            value={profName}
                            onChange={e => setProfName(e.target.value)}
                            placeholder={locale === 'en' ? 'e.g. Dra. Ana Beatriz' : locale === 'es' ? 'Ej: Dra. Ana Beatriz' : 'Ex: Dra. Ana Beatriz'}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-teal-500 focus:bg-white rounded-xl text-xs font-bold outline-none transition-all"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] font-black text-slate-500 uppercase mb-1">
                            {locale === 'en' ? 'Specialty / Registration' : locale === 'es' ? 'Especialidad / Registro' : 'Especialidade / Registro'}
                          </label>
                          <select
                            value={profRole}
                            onChange={e => setProfRole(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-teal-500 focus:bg-white rounded-xl text-xs font-bold outline-none cursor-pointer transition-all"
                          >
                            <option value="Psicologia ABA">{locale === 'en' ? 'ABA Psychology' : locale === 'es' ? 'Psicología ABA' : 'Psicologia ABA'} 🧠</option>
                            <option value="Terapia Ocupacional">{locale === 'en' ? 'Occupational Therapy' : locale === 'es' ? 'Terapia Ocupacional' : 'Terapia Ocupacional'} 🧼</option>
                            <option value="Fonoaudiologia">{locale === 'en' ? 'Speech Therapy' : locale === 'es' ? 'Logopedia' : 'Fonoaudiologia'} 🗣️</option>
                            <option value="Fisioterapia Postural">{locale === 'en' ? 'Postural Physical Therapy' : locale === 'es' ? 'Fisioterapia Postural' : 'Fisioterapia Postural'} 🩺</option>
                            <option value="Psicopedagogia">{locale === 'en' ? 'Psychopedagogy' : locale === 'es' ? 'Psicopedagogía' : 'Psicopedagogia'} 📚</option>
                          </select>
                        </div>

                        {statusMsg && (
                          <p className={`md:col-span-2 text-xxs font-extrabold p-2 rounded-lg text-center ${
                            statusMsg.includes('Erro') || statusMsg.includes('Error') ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-emerald-50 text-emerald-800 border border-emerald-100'
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
                            {t.common.cancel || 'Cancelar'}
                          </button>
                          {canEdit && (
                          <button
                            type="submit"
                            disabled={savingCheckpoint}
                            className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-sm active:scale-95 cursor-pointer flex items-center gap-1 disabled:opacity-50"
                          >
                            {savingCheckpoint ? (locale === 'en' ? 'Saving...' : locale === 'es' ? 'Guardando...' : 'Gravando...') : (locale === 'en' ? 'Save Evolution' : locale === 'es' ? 'Guardar Evolución' : 'Gravar Evolução')}
                          </button>
                          )}
                        </div>

                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>

          </div>

          {/* Routine Tab Content */}
          <div className={activeTab === 'routine' ? "grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full" : "hidden print:grid print:grid-cols-1 print:lg:grid-cols-12 print:gap-6 print:items-start print:w-full"}>
            <div className="lg:col-span-8 flex flex-col gap-6">
              {/* Child Routine Inspection */}
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-premium flex flex-col gap-4 text-left">
                <div className="flex items-center justify-between gap-2 text-indigo-650 flex-wrap">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5" />
                    <h3 className="font-black text-slate-900 text-lg font-Outfit">
                      {locale === 'en' ? 'Routine Tasks Grid' : locale === 'es' ? 'Cuadrícula de Tareas de la Rutina' : 'Grade de Tarefas da Rotina'}
                    </h3>
                  </div>
                  {canEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      playBubble();
                      resetTaskForm();
                      setTaskFormOpen(true);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-indigo-650 hover:bg-indigo-755 text-white text-[10px] font-black rounded-lg active:scale-95 transition-all cursor-pointer font-Outfit shadow-xxs border-none outline-none"
                  >
                    <Plus className="w-3.5 h-3.5" /> {locale === 'en' ? 'Add Activity' : locale === 'es' ? 'Añadir Actividad' : 'Adicionar Atividade'}
                  </button>
                  )}
                </div>

                <div className="flex flex-col gap-2.5 max-h-[400px] overflow-y-auto pr-1">
                  {tasks.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-6">
                      {locale === 'en' ? 'No tasks registered in this routine.' : locale === 'es' ? 'Ninguna tarea registrada en esta rutina.' : 'Nenhuma tarefa cadastrada nesta rotina.'}
                    </p>
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
                                {locale === 'en' ? 'Day' : locale === 'es' ? 'Día' : 'Dia'} {task.day} • {task.time} ({task.period})
                              </p>
                              {task.description && (
                                <p className="text-[10px] text-slate-400 font-semibold mt-0.5 text-left">
                                  💡 {locale === 'en' ? 'Instructions:' : locale === 'es' ? 'Instrucciones:' : 'Instruções:'} {task.description}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              onClick={canEdit ? () => handleToggleTaskCompletion(task) : undefined}
                              className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase border select-none transition-all ${canEdit ? 'cursor-pointer active:scale-95' : ''} ${
                                task.isCompleted
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-150 hover:bg-emerald-100'
                                  : 'bg-amber-50 text-amber-800 border-amber-150 hover:bg-amber-100'
                              }`}
                              title={canEdit ? (locale === 'en' ? 'Click to toggle completion' : locale === 'es' ? 'Haga clic para alternar finalización' : 'Clique para alternar conclusão') : undefined}
                            >
                              {task.isCompleted ? (locale === 'en' ? 'Done' : locale === 'es' ? 'Hecho' : 'Feito') : (locale === 'en' ? 'Pending' : locale === 'es' ? 'Pendiente' : 'Pendente')}
                            </span>
                            {canEdit && (
                            <>
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
                            </>
                            )}
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
                          {editingTaskId 
                            ? (locale === 'en' ? '📝 Edit Activity' : locale === 'es' ? '📝 Editar Actividad' : '📝 Editar Atividade') 
                            : (locale === 'en' ? '✨ New Activity' : locale === 'es' ? '✨ Nueva Actividad' : '✨ Nova Atividade')}
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
                            {locale === 'en' ? 'Activity Title' : locale === 'es' ? 'Título de la Actividad' : 'Título da Atividade'}
                          </label>
                          <input
                            type="text"
                            value={taskTitle}
                            onChange={e => setTaskTitle(e.target.value)}
                            placeholder={locale === 'en' ? 'e.g. Brush teeth 🪥, Occupational Therapy...' : locale === 'es' ? 'Ej: Cepillarse los dientes 🪥, Terapia Ocupacional...' : 'Ex: Escovar os dentes 🪥, Terapia Ocupacional...'}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-xs font-bold outline-none transition-all"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] font-black text-slate-500 uppercase mb-1 pl-0.5">
                            {locale === 'en' ? 'Time' : locale === 'es' ? 'Horario' : 'Horário'}
                          </label>
                          <input
                            type="time"
                            value={taskTime}
                            onChange={e => setTaskTime(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-xs font-bold outline-none transition-all"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] font-black text-slate-500 uppercase mb-1 pl-0.5">
                            {locale === 'en' ? 'Period' : locale === 'es' ? 'Período' : 'Período'}
                          </label>
                          <select
                            value={taskPeriod}
                            onChange={e => setTaskPeriod(e.target.value as any)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-xs font-bold outline-none cursor-pointer transition-all"
                          >
                            <option value="manhã">{locale === 'en' ? 'Morning ☀️' : locale === 'es' ? 'Mañana ☀️' : 'Manhã ☀️'}</option>
                            <option value="tarde">{locale === 'en' ? 'Afternoon ⛅' : locale === 'es' ? 'Tarde ⛅' : 'Tarde ⛅'}</option>
                            <option value="noite">{locale === 'en' ? 'Night 🌙' : locale === 'es' ? 'Noche 🌙' : 'Noite 🌙'}</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[9px] font-black text-slate-500 uppercase mb-1 pl-0.5">
                            {locale === 'en' ? 'Day of Month (1 to 31)' : locale === 'es' ? 'Día del Mes (1 a 31)' : 'Dia do Mês (1 a 31)'}
                          </label>
                          <select
                            value={taskDay}
                            onChange={e => setTaskDay(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-xs font-bold outline-none cursor-pointer transition-all"
                          >
                            {Array.from({ length: 31 }).map((_, i) => (
                              <option key={i + 1} value={String(i + 1)}>{locale === 'en' ? 'Day' : locale === 'es' ? 'Día' : 'Dia'} {i + 1}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[9px] font-black text-slate-500 uppercase mb-1 pl-0.5">
                            {locale === 'en' ? 'Estimated Duration (minutes)' : locale === 'es' ? 'Duración Estimada (minutos)' : 'Duração Estimada (minutos)'}
                          </label>
                          <input
                            type="number"
                            value={taskDuration}
                            onChange={e => setTaskDuration(Number(e.target.value))}
                            min={1}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-xs font-bold outline-none transition-all"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] font-black text-slate-500 uppercase mb-1 pl-0.5">
                            {locale === 'en' ? 'Clinical Category' : locale === 'es' ? 'Categoría Clínica' : 'Categoria Clínica'}
                          </label>
                          <select
                            value={taskCategory}
                            onChange={e => setTaskCategory(e.target.value as any)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-xs font-bold outline-none cursor-pointer transition-all"
                          >
                            <option value="AVD">{locale === 'en' ? 'ADL (Activities of Daily Living) 🧼' : locale === 'es' ? 'AVD (Actividades de la Vida Diaria) 🧼' : 'AVD (Ativ. Vida Diária) 🧼'}</option>
                            <option value="Aprendizado">{locale === 'en' ? 'Learning / Session 🧠' : locale === 'es' ? 'Aprendizaje / Sesión 🧠' : 'Aprendizado / Sessão 🧠'}</option>
                            <option value="Lazer">{locale === 'en' ? 'Leisure / Play 🎨' : locale === 'es' ? 'Ocio / Juego 🎨' : 'Lazer / Brincar 🎨'}</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[9px] font-black text-slate-500 uppercase mb-1 pl-0.5">
                            {locale === 'en' ? 'Default Icon' : locale === 'es' ? 'Icono Predeterminado' : 'Ícone Padrão'}
                          </label>
                          <select
                            value={taskIcon}
                            onChange={e => setTaskIcon(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-xs font-bold outline-none cursor-pointer transition-all"
                          >
                            <option value="📅">{locale === 'en' ? 'Calendar 📅' : locale === 'es' ? 'Calendario 📅' : 'Calendário 📅'}</option>
                            <option value="🧼">{locale === 'en' ? 'Hygiene 🧼' : locale === 'es' ? 'Higiene 🧼' : 'Higiene 🧼'}</option>
                            <option value="🪥">{locale === 'en' ? 'Brush 🪥' : locale === 'es' ? 'Cepillo 🪥' : 'Escova 🪥'}</option>
                            <option value="🍲">{locale === 'en' ? 'Meal 🍲' : locale === 'es' ? 'Alimentación 🍲' : 'Alimentação 🍲'}</option>
                            <option value="🏫">{locale === 'en' ? 'School 🏫' : locale === 'es' ? 'Escuela 🏫' : 'Escola 🏫'}</option>
                            <option value="🎨">{locale === 'en' ? 'Leisure 🎨' : locale === 'es' ? 'Ocio 🎨' : 'Lazer 🎨'}</option>
                            <option value="🐶">{locale === 'en' ? 'Mascot 🐶' : locale === 'es' ? 'Mascota 🐶' : 'Mascote 🐶'}</option>
                            <option value="😴">{locale === 'en' ? 'Sleep 😴' : locale === 'es' ? 'Dormir 😴' : 'Dormir 😴'}</option>
                            <option value="🧸">{locale === 'en' ? 'Toy 🧸' : locale === 'es' ? 'Juguete 🧸' : 'Brinquedo 🧸'}</option>
                            <option value="🧠">{locale === 'en' ? 'ABA Session 🧠' : locale === 'es' ? 'Sesión ABA 🧠' : 'Sessão ABA 🧠'}</option>
                            <option value="🗣️">{locale === 'en' ? 'Speech 🗣️' : locale === 'es' ? 'Habla 🗣️' : 'Fono 🗣️'}</option>
                            <option value="⚽">{locale === 'en' ? 'Sport ⚽' : locale === 'es' ? 'Deporte ⚽' : 'Esporte ⚽'}</option>
                          </select>
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-[9px] font-black text-slate-500 uppercase mb-1 pl-0.5">
                            {locale === 'en' ? 'Or Attach Real Photo (Custom PECS)' : locale === 'es' ? 'O Adjuntar Foto Real (PECS Personalizado)' : 'Ou Anexar Foto Real (PECS Customizado)'}
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleTaskFileChange}
                            className="w-full text-xs font-semibold text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-indigo-50 file:text-indigo-750 hover:file:bg-indigo-100 cursor-pointer"
                          />
                          {taskCustomIcon && (
                            <div className="mt-2 flex items-center gap-2">
                              <span className="text-[9px] text-slate-400 font-extrabold">{locale === 'en' ? 'Preview:' : locale === 'es' ? 'Vista previa:' : 'Pré-visualização:'}</span>
                              <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-250 bg-slate-50 flex items-center justify-center">
                                <img src={taskCustomIcon} alt="" className="w-full h-full object-cover" />
                              </div>
                              <button
                                type="button"
                                onClick={() => setTaskCustomIcon('')}
                                className="text-[9px] font-bold text-red-500 hover:underline cursor-pointer border-none bg-transparent outline-none"
                              >
                                {locale === 'en' ? 'Remove photo' : locale === 'es' ? 'Eliminar foto' : 'Remover foto'}
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-[9px] font-black text-slate-500 uppercase mb-1 pl-0.5">
                            {locale === 'en' ? 'Description / Instructions' : locale === 'es' ? 'Descripción / Instrucciones' : 'Descrição / Instruções'}
                          </label>
                          <textarea
                            value={taskDescription}
                            onChange={e => setTaskDescription(e.target.value)}
                            placeholder={locale === 'en' ? 'Describe step-by-step instructions for the child or sensory guidelines...' : locale === 'es' ? 'Describa instrucciones paso a paso para el niño o pautas sensoriales...' : 'Descreva instruções passo a passo para a criança ou orientações sensoriais...'}
                            className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-xs font-semibold outline-none h-18 resize-none transition-all"
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
                            {t.common.cancel || 'Cancelar'}
                          </button>
                          <button
                            type="submit"
                            disabled={savingTask}
                            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-750 text-white text-xs font-bold rounded-xl shadow-sm active:scale-95 cursor-pointer flex items-center gap-1 disabled:opacity-50 border-none outline-none"
                          >
                            {savingTask ? (locale === 'en' ? 'Saving...' : locale === 'es' ? 'Guardando...' : 'Salvando...') : (locale === 'en' ? 'Save Activity' : locale === 'es' ? 'Guardar Actividad' : 'Salvar Atividade')}
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>


            </div>
            <div className="lg:col-span-4 flex flex-col gap-6">
                {/* Presets Manager Card */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-premium flex flex-col gap-4 text-left">
                  <div className="flex items-center gap-2 text-teal-650">
                    <Brain className="w-5 h-5 text-indigo-500" />
                    <h3 className="font-black text-slate-900 text-md font-Outfit">
                      {locale === 'en' ? 'Prescribe Therapeutic Presets' : locale === 'es' ? 'Prescribir Ajustes Terapéuticos' : 'Prescrever Presets Terapêuticos'}
                    </h3>
                  </div>
                  
                  <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                    {locale === 'en' 
                      ? 'Choose one of the models below based on clinical methodologies and add the activities instantly to the patient\'s routine.' 
                      : locale === 'es' 
                      ? 'Elija uno de los modelos a continuación basados en metodologías clínicas y agregue las actividades instantáneamente a la rutina del paciente.' 
                      : 'Escolha um dos modelos abaixo baseados em metodologias clínicas e adicione as atividades instantaneamente à rotina do paciente.'}
                  </p>

                  <div className="flex flex-col gap-3">
                    {[
                      {
                        title: locale === 'en' ? 'ABA Behavioral Intervention 🧩' : locale === 'es' ? 'Intervención Conductual ABA 🧩' : 'Intervenção Comportamental ABA 🧩',
                        desc: locale === 'en' ? 'Structured routine with focus training and play breaks.' : locale === 'es' ? 'Rutina estructurada con entrenamiento de enfoque y pausas lúdicas.' : 'Rotina estruturada com treinos de foco e pausas lúdicas.',
                        tasks: [
                          { title: locale === 'en' ? 'Focus: ABA Imitation Training 🧩' : locale === 'es' ? 'Enfoque: Entr. de Imitación ABA 🧩' : 'Foco: Treino de Imitação ABA 🧩', time: '09:00', period: 'manhã', day: '1', order: 1, icon: '🧩', category: 'Aprendizado', duration: 30, description: locale === 'en' ? 'Focus work and shared attention.' : locale === 'es' ? 'Trabajo de enfoque y atención compartida.' : 'Trabalho de foco e atenção compartilhada.' },
                          { title: locale === 'en' ? 'ADL Training: Washing Hands 🧼' : locale === 'es' ? 'Entr. de AVD: Lavarse las manos 🧼' : 'Treino de AVD: Lavar as mãos 🧼', time: '10:00', period: 'manhã', day: '1', order: 2, icon: '🧼', category: 'AVD', duration: 15, description: locale === 'en' ? 'Wash hands independently.' : locale === 'es' ? 'Lavarse las manos de forma independiente.' : 'Lavar as mãos de forma independente.' },
                          { title: locale === 'en' ? 'Free Sensory Break 🧸' : locale === 'es' ? 'Pausa Sensorial Libre 🧸' : 'Pausa Sensorial Livre 🧸', time: '10:30', period: 'manhã', day: '1', order: 3, icon: '🧸', category: 'Lazer', duration: 20, description: locale === 'en' ? 'Regulating free play.' : locale === 'es' ? 'Juego libre regulador.' : 'Brincadeira livre reguladora.' }
                        ]
                      },
                      {
                        title: locale === 'en' ? 'OT Sensory Integration 跑' : locale === 'es' ? 'Integración Sensorial T.O. 跑' : 'Integração Sensorial T.O. 跑',
                        desc: locale === 'en' ? 'Focus on psychomotor regulation and body relaxation.' : locale === 'es' ? 'Enfoque en regulación psicomotora y relajación corporal.' : 'Foco em regulação psicomotora e relaxamento corporal.',
                        tasks: [
                          { title: locale === 'en' ? 'Sensory Psychomotor Circuit 跑' : locale === 'es' ? 'Circuito Psicomotor Sensorial 跑' : 'Circuito Psicomotor Sensorial 跑', time: '14:00', period: 'tarde', day: '1', order: 1, icon: '跑', category: 'Aprendizado', duration: 45, description: locale === 'en' ? 'Circuit with pillows and jumps.' : locale === 'es' ? 'Circuito con almohadas y saltos.' : 'Circuito com almofadas e saltos.' },
                          { title: locale === 'en' ? 'Regulating Bubble Bath 🚿' : locale === 'es' ? 'Baño de Espuma Regulador 🚿' : 'Banho de Espuma Regulador 🚿', time: '15:00', period: 'tarde', day: '1', order: 2, icon: '🚿', category: 'AVD', duration: 30, description: locale === 'en' ? 'Gentle tactile stimulation with foam.' : locale === 'es' ? 'Estimulación táctil suave con espuma.' : 'Estimulação tátil suave com espuma.' },
                          { title: locale === 'en' ? 'Resting in the Hammock 💤' : locale === 'es' ? 'Descanso en la Hamaca 💤' : 'Descanso na Rede 💤', time: '15:45', period: 'tarde', day: '1', order: 3, icon: '💤', category: 'Lazer', duration: 20, description: locale === 'en' ? 'Passive vestibular regulation.' : locale === 'es' ? 'Regulación vestibular pasiva.' : 'Regulação vestibular passiva.' }
                        ]
                      },
                      {
                        title: locale === 'en' ? 'Communication & Language 🗣️' : locale === 'es' ? 'Comunicación y Lenguaje 🗣️' : 'Comunicação e Linguagem 🗣️',
                        desc: locale === 'en' ? 'Focus on speech training, PECS cards, and social meals.' : locale === 'es' ? 'Enfoque en entrenamiento de habla, tarjetas PECS y comida social.' : 'Foco em treinos de fala, cartões PECS e refeição social.',
                        tasks: [
                          { title: locale === 'en' ? 'PECS Training / Naming 🗣️' : locale === 'es' ? 'Entr. de PECS / Nominación 🗣️' : 'Treino de PECS / Nomeação 🗣️', time: '11:00', period: 'manhã', day: '1', order: 1, icon: '🗣️', category: 'Aprendizado', duration: 30, description: locale === 'en' ? 'Augmentative communication exercises.' : locale === 'es' ? 'Ejercicios de comunicación aumentativa.' : 'Exercícios de comunicação aumentativa.' },
                          { title: locale === 'en' ? 'Social Lunch Without Screens 🍱' : locale === 'es' ? 'Almuerzo Social Sin Pantallas 🍱' : 'Almoço Social Sem Telas 🍱', time: '12:00', period: 'tarde', day: '1', order: 2, icon: '🍱', category: 'AVD', duration: 45, description: locale === 'en' ? 'Lunch focused on chewing and interaction.' : locale === 'es' ? 'Almuerzo enfocado en masticación e interacción.' : 'Almoço focado em mastigação e interação.' },
                          { title: locale === 'en' ? 'Shared Reading 📖' : locale === 'es' ? 'Lectura Compartida 📖' : 'Leitura Compartilhada 📖', time: '20:00', period: 'noite', day: '1', order: 3, icon: '📖', category: 'Lazer', duration: 30, description: locale === 'en' ? 'Interactive reading of social stories.' : locale === 'es' ? 'Lectura interactiva de historias sociales.' : 'Leitura interativa de histórias sociais.' }
                        ]
                      }
                    ].map((preset, pIdx) => (
                      <div key={pIdx} className="bg-slate-50 border border-slate-150 p-3 rounded-2xl flex flex-col gap-1 text-left">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <h4 className="text-[11px] font-black text-slate-800 font-Outfit">{preset.title}</h4>
                            <p className="text-[9px] text-slate-500 font-semibold mt-0.5 leading-normal">{preset.desc}</p>
                          </div>
                          <button
                            onClick={async () => {
                              playMarimba(392, 0.2);
                              setStatusMsg(locale === 'en' ? 'Prescribing routine...' : locale === 'es' ? 'Prescribiendo rutina...' : 'Prescrevendo rotina...');
                              try {
                                for (const t of preset.tasks) {
                                  await fetch('/api/therapist', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      sharingCode: childData.sharingCode,
                                      action: 'CREATE_TASK',
                                      taskData: t
                                    })
                                  });
                                }
                                playMarimba(523.25, 0.3);
                                setStatusMsg(locale === 'en' ? `Routine "${preset.title}" prescribed successfully! 🎉` : locale === 'es' ? `¡Rutina "${preset.title}" prescrita con éxito! 🎉` : `Rotina "${preset.title}" prescrita com sucesso! 🎉`);
                                handleVerify(undefined, childData.sharingCode);
                                setTimeout(() => setStatusMsg(''), 4000);
                              } catch (err) {
                                console.error("Erro ao prescrever preset:", err);
                                setStatusMsg(locale === 'en' ? 'Failed to prescribe routine.' : locale === 'es' ? 'Error al prescribir rutina.' : 'Falha ao prescrever rotina.');
                              }
                            }}
                            className="px-3.5 py-1.5 bg-indigo-650 hover:bg-indigo-700 text-white text-[9px] font-black rounded-lg cursor-pointer border-none font-Outfit shadow-sm shrink-0 active:scale-95 transition-all outline-none"
                          >
                            {locale === 'en' ? 'Prescribe' : locale === 'es' ? 'Prescribir' : 'Prescrever'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

            </div>
          </div>

          {/* Analysis & Diary Tab Content */}
          <div className={activeTab === 'analysis' ? "w-full flex flex-col gap-6" : "hidden print:flex print:flex-col print:gap-6 print:w-full"}>
          {/* Clinical Correlation & AI Banner */}
          <div className="grad-soft border border-slate-200 p-4.5 rounded-2xl text-left shadow-sm flex items-start gap-3.5">
            <div className="w-10 h-10 bg-teal-100 text-teal-700 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-inner border border-teal-150">
              🧠
            </div>
            <div>
              <h4 className="text-xs font-black text-teal-950 font-Outfit">{locale === 'en' ? 'Smart Clinical Synchronization' : locale === 'es' ? 'Sincronización Clínica Inteligente' : 'Sincronização Clínica Inteligente'}</h4>
              <p className="text-[10.5px] text-teal-900 leading-relaxed font-semibold mt-0.5">
                {locale === 'en' 
                  ? 'Clinical checkpoints registered on this platform cross-reference data in real time with the mediator\'s school notes and routine logs entered by the family. Our correlation AI analyzes these three sources to predict stress peaks, meltdowns, and determine the patient\'s Sensory Adherence.' 
                  : locale === 'es' 
                  ? 'Los puntos de control clínicos registrados en esta plataforma cruzan datos en tiempo real con las notas escolares del mediador y los registros de rutina introducidos por la familia. Nuestra IA de correlación analiza estas tres fuentes para predecir picos de estrés, meltdowns y determinar la Adherencia Sensorial del paciente.' 
                  : 'Os checkpoints clínicos registrados nesta plataforma cruzam dados em tempo real com as anotações escolares do mediador e os registros de rotina inseridos pela família. Nossa IA de correlação analisa essas três fontes para prever picos de estresse, meltdowns e determinar a Aderência Sensorial do paciente.'}
              </p>
            </div>
          </div>


          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            
            {/* compliance card */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xxs flex flex-col justify-between gap-4">
              <div className="flex justify-between items-start">
                <div className="text-left">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-Outfit">
                    {locale === 'en' ? 'Routine Adherence' : locale === 'es' ? 'Adherencia a la Rutina' : 'Aderência à Rotina'}
                  </span>
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
                  {locale === 'en' 
                    ? `Calculated over ${totalTasksElapsed} tasks of the ${elapsedDays} elapsed days of the month.` 
                    : locale === 'es' 
                    ? `Calculado sobre ${totalTasksElapsed} tareas de los ${elapsedDays} días transcurridos del mes.` 
                    : `Calculado sobre ${totalTasksElapsed} tarefas dos ${elapsedDays} dias decorridos do mês.`}
                </span>
              </div>
            </div>

            {/* stability card */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xxs flex flex-col justify-between gap-4">
              <div className="flex justify-between items-start">
                <div className="text-left">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-Outfit">
                    {locale === 'en' ? 'Emotional Stability' : locale === 'es' ? 'Estabilidad Emocional' : 'Estabilidade Emocional'}
                  </span>
                  <span className="text-3xl font-black text-slate-900 tracking-tight mt-1 block font-Outfit">{stabilityRate}%</span>
                </div>
                <div className="w-10 h-10 bg-teal-50 border border-teal-100 text-teal-700 rounded-xl flex items-center justify-center shadow-xxs">
                  <Smile className="w-5 h-5" />
                </div>
              </div>
              <div className="text-left">
                <span className="text-xs font-black text-teal-800 bg-teal-50 border border-teal-100 px-2 py-0.5 rounded-md inline-block mb-1 font-Outfit">
                  {stabilityRate >= 80 
                    ? (locale === 'en' ? 'Excellent' : locale === 'es' ? 'Excelente' : 'Excelente') 
                    : stabilityRate >= 50 
                    ? (locale === 'en' ? 'Stable' : locale === 'es' ? 'Estable' : 'Estável') 
                    : (locale === 'en' ? 'Attention Needed' : locale === 'es' ? 'Atención Necesaria' : 'Atenção Necessária')}
                </span>
                <p className="text-[9px] text-slate-450 font-bold mt-0.5 leading-snug">
                  {locale === 'en' 
                    ? 'Average of regulated mood (Happy/Calm) in the emotional diary logs.' 
                    : locale === 'es' 
                    ? 'Promedio de humor regulado (Feliz/Calmo) en los registros del diario emocional.' 
                    : 'Média de humor regulado (Feliz/Calmo) nos registros do diário emocional.'}
                </p>
              </div>
            </div>

            {/* crises card */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xxs flex flex-col justify-between gap-4">
              <div className="flex justify-between items-start">
                <div className="text-left">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-Outfit">
                    {locale === 'en' ? 'Crisis Frequency' : locale === 'es' ? 'Frecuencia de Crisis' : 'Frequência de Crises'}
                  </span>
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
                  {crisesCount === 0 
                    ? (locale === 'en' ? 'Under Control' : locale === 'es' ? 'Bajo Control' : 'Sob Controle') 
                    : (locale === 'en' ? `${crisesCount} Recent Meltdown(s)` : locale === 'es' ? `${crisesCount} Meltdown(s) Reciente(s)` : `${crisesCount} Meltdown(s) Recente(s)`)}
                </span>
                <p className="text-[9px] text-slate-450 font-bold mt-0.5 leading-snug">
                  {locale === 'en' 
                    ? 'Total count of crises and severe sensory overloads this month.' 
                    : locale === 'es' 
                    ? 'Recuento total de crisis y sobrecargas sensoriales graves este mes.' 
                    : 'Contagem total de crises e sobrecargas sensoriais graves neste mês.'}
                </p>
              </div>
            </div>

            {/* top trigger card */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xxs flex flex-col justify-between gap-4">
              <div className="flex justify-between items-start">
                <div className="text-left">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-Outfit">
                    {locale === 'en' ? 'Most Frequent Trigger' : locale === 'es' ? 'Gatillo Más Frecuente' : 'Gatilho Mais Frequente'}
                  </span>
                  <span className="text-lg font-black text-slate-900 tracking-tight mt-1 block font-Outfit leading-tight">{topTrigger}</span>
                </div>
                <div className="w-10 h-10 bg-amber-50 border border-amber-100 text-amber-700 rounded-xl flex items-center justify-center shadow-xxs">
                  <Brain className="w-5 h-5" />
                </div>
              </div>
              <div className="text-left">
                <span className="text-[9px] text-slate-450 font-bold leading-normal block">
                  {locale === 'en' 
                    ? 'Identified from environmental analysis filled in regulation logs.' 
                    : locale === 'es' 
                    ? 'Identificado a partir del análisis ambiental completado en los registros de regulación.' 
                    : 'Identificado a partir das análises ambientais preenchidas nos registros de regulação.'}
                </span>
              </div>
            </div>

          </div>


            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-8 flex flex-col gap-6">
                {/* Visual Analytics Card */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-premium flex flex-col gap-4 text-left">
                  <div className="flex items-center gap-2 text-teal-650">
                    <TrendingUp className="w-5 h-5 text-teal-600" />
                    <h3 className="font-black text-slate-900 text-md font-Outfit">
                      {locale === 'en' ? 'Adherence & Success Metrics' : locale === 'es' ? 'Métricas de Adherencia y Éxito' : 'Métricas de Aderência e Sucesso'}
                    </h3>
                  </div>

                  {/* 1. Category Success Rates */}
                  <div className="flex flex-col gap-3">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-Outfit">
                      {locale === 'en' ? 'Success by Category (Today)' : locale === 'es' ? 'Éxito por Categoría (Hoy)' : 'Sucesso por Categoria (Hoje)'}
                    </h4>
                    {(() => {
                      const childTasks = childData?.tasks || [];
                      const categories = ['AVD', 'Aprendizado', 'Lazer'];
                      return categories.map(cat => {
                        const catTasks = childTasks.filter((t: any) => t.category === cat);
                        const total = catTasks.length;
                        const completed = catTasks.filter((t: any) => t.isCompleted).length;
                        const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                        return (
                          <div key={cat} className="flex flex-col gap-1 text-[11px] font-bold text-slate-700">
                            <div className="flex justify-between items-center">
                              <span>
                                {cat === 'AVD' 
                                  ? (locale === 'en' ? '🏠 ADLs' : locale === 'es' ? '🏠 AVDs' : '🏠 AVDs') 
                                  : cat === 'Aprendizado' 
                                  ? (locale === 'en' ? '📚 Learning' : locale === 'es' ? '📚 Aprendizaje' : '📚 Aprendizado') 
                                  : (locale === 'en' ? '🎮 Leisure' : locale === 'es' ? '🎮 Ocio' : '🎮 Lazer')}
                              </span>
                              <span className="font-black text-slate-900">{completed}/{total} ({pct}%)</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${
                                  cat === 'AVD' ? 'bg-indigo-650' : cat === 'Aprendizado' ? 'bg-teal-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>

                  {/* 2. Crises Trend Over Time */}
                  <div className="flex flex-col gap-2 border-t border-slate-100 pt-3">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-Outfit">
                      {locale === 'en' ? 'Sensory Dysregulation Trend (Week)' : locale === 'es' ? 'Tendencia de Desregulación Sensorial (Semana)' : 'Tendência de Desregulação Sensorial (Semana)'}
                    </h4>
                    {(() => {
                      const cLogs = childData?.sensoryLogs || [];
                      const last7Days = Array.from({ length: 7 }).map((_, i) => {
                        const d = new Date();
                        d.setDate(d.getDate() - i);
                        return d.toISOString().split('T')[0];
                      }).reverse();

                      const crisesPerDay = last7Days.map(dayStr => {
                        return cLogs.filter((l: any) => {
                          const logDay = new Date(l.timestamp).toISOString().split('T')[0];
                          return logDay === dayStr && l.crisisOccurred;
                        }).length;
                      });

                      const maxCrises = Math.max(1, ...crisesPerDay);
                      
                      return (
                        <div className="flex items-end justify-between h-20 px-2 pt-4 bg-slate-50 border border-slate-205 rounded-2xl gap-2">
                          {last7Days.map((dayStr, idx) => {
                            const count = crisesPerDay[idx];
                            const heightPct = (count / maxCrises) * 100;
                            const shortLabel = dayStr.split('-')[2];
                            return (
                              <div key={dayStr} className="flex-1 flex flex-col items-center gap-1 group relative">
                                <div 
                                  className="w-full rounded-t-md bg-red-400 hover:bg-red-500 transition-all cursor-pointer"
                                  style={{ height: `${Math.max(15, heightPct)}px`, opacity: count > 0 ? 1 : 0.25 }}
                                  title={`${count} crises em ${dayStr}`}
                                />
                                <span className="text-[8px] font-black text-slate-400">{shortLabel}</span>
                                {count > 0 && (
                                  <span className="absolute top-[-18px] bg-slate-900 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-md pointer-events-none select-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                                    🚨 {count}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>

              </div>
              <div className="lg:col-span-4 flex flex-col gap-6 text-left">
              {/* Sensory Heatmap */}
              {sensoryLogs.length > 0 && (
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-premium flex flex-col gap-4">
                  <div className="flex items-center gap-2 text-indigo-650">
                    <Map className="w-5 h-5 text-indigo-500" />
                    <h3 className="font-black text-slate-900 text-md font-Outfit">
                      {locale === 'en' ? 'Sensory Heatmap' : locale === 'es' ? 'Mapa de Calor Sensorial' : 'Mapa de Calor Sensorial'}
                    </h3>
                  </div>
                  <SensoryHeatmap logs={sensoryLogs} />
                </div>
              )}


              {/* Patient Behavior Dictionary / Guia de Sinais */}
              {childData && (
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-premium flex flex-col gap-4 text-left">
                  <div className="flex items-center gap-2 text-indigo-650">
                    <span className="text-xl">📖</span>
                    <h3 className="font-black text-slate-900 text-md font-Outfit">
                      {locale === 'en' ? 'Behavioral Dictionary (Signs)' : locale === 'es' ? 'Diccionario de Comportamiento (Señales)' : 'Dicionário Comportamental (Sinais)'}
                    </h3>
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
                            {locale === 'en' ? 'No behavioral signs registered by parents.' : locale === 'es' ? 'Ninguna señal de comportamiento registrada por los padres.' : 'Nenhum sinal comportamental cadastrado pelos pais.'}
                          </p>
                        );
                      }

                      return behaviorList.map((item: any) => (
                        <div key={item.id} className="p-3 bg-indigo-50/20 border border-indigo-150 rounded-xl flex flex-col gap-1.5 text-xxs">
                          <div className="font-Outfit font-extrabold text-[11px] text-indigo-950 border-b border-indigo-100/50 pb-1">
                            {locale === 'en' ? '📢 Sign:' : locale === 'es' ? '📢 Señal:' : '📢 Sinal:'} {item.signal}
                          </div>
                          <div className="text-slate-700 leading-normal font-semibold">
                            <strong>{locale === 'en' ? '🧠 Meaning:' : locale === 'es' ? '🧠 Significado:' : '🧠 Significado:'}</strong> {item.meaning}
                          </div>
                          <div className="text-emerald-800 leading-normal bg-emerald-50/40 border border-emerald-150 p-2 rounded-lg mt-1 font-semibold">
                            <strong>{locale === 'en' ? '👩‍🏫 Recommended action:' : locale === 'es' ? '👩‍🏫 Conducta recomendada:' : '👩‍🏫 Conduta recomendada:'}</strong> {item.intervention}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}


              {/* Sensory Log / Crises History */}
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-premium flex flex-col gap-4">
                <div className="flex items-center gap-2 text-red-650">
                  <AlertTriangle className="w-5 h-5" />
                  <h3 className="font-black text-slate-900 text-md font-Outfit">
                    {locale === 'en' ? 'Sensory Diary & Crises' : locale === 'es' ? 'Diario Sensorial y Crisis' : 'Diário Sensorial & Crises'}
                  </h3>
                </div>
                
                <div className="flex flex-col gap-3 max-h-[450px] overflow-y-auto pr-1">
                  {sensoryLogs.length === 0 ? (
                    <p className="text-slate-400 text-xs italic text-center py-4">
                      {locale === 'en' ? 'No behavioral or sensory records added.' : locale === 'es' ? 'No se han agregado registros de comportamiento o sensoriales.' : 'Nenhum registro comportamental ou sensorial adicionado.'}
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
                              {isSchool ? (locale === 'en' ? '🏫 SCHOOL' : locale === 'es' ? '🏫 ESCUELA' : '🏫 ESCOLA') : isAac ? (locale === 'en' ? '🗣️ AAC COMMUNICATION' : locale === 'es' ? 'COMUNICACIÓN AAC' : 'COMUNICAÇÃO AAC') : isChild ? (locale === 'en' ? '👶 CHILD' : locale === 'es' ? '👶 NIÑO' : '👶 CRIANÇA') : (locale === 'en' ? '👪 CAREGIVER' : locale === 'es' ? '👪 CUIDADOR' : '👪 CUIDADOR')} - {log.crisisOccurred ? (locale === 'en' ? '🚨 Crisis' : locale === 'es' ? '🚨 Crisis' : '🚨 Crise') : `${locale === 'en' ? '🧠 Mood:' : locale === 'es' ? '🧠 Humor:' : '🧠 Humor:'} ${log.mood}`}
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
                                <span>🍲 {locale === 'en' ? 'Meals:' : locale === 'es' ? 'Alimentación:' : 'Alimentação:'} {
                                  log.foodIntake === 'boa' ? (locale === 'en' ? 'Good 🟢' : locale === 'es' ? 'Buena 🟢' : 'Boa 🟢') : log.foodIntake === 'regular' ? (locale === 'en' ? 'Regular 🟡' : locale === 'es' ? 'Regular 🟡' : 'Regular 🟡') : (locale === 'en' ? 'Refused 🔴' : locale === 'es' ? 'Rechazó 🔴' : 'Recusou 🔴')
                                }</span>
                              )}
                              {log.schoolNoise && (
                                <span>🔊 {locale === 'en' ? 'Noise:' : locale === 'es' ? 'Ruido:' : 'Barulho:'} {
                                  log.schoolNoise === 'baixo' ? (locale === 'en' ? 'Low 🟢' : locale === 'es' ? 'Bajo 🟢' : 'Baixo 🟢') : log.schoolNoise === 'medio' ? (locale === 'en' ? 'Medium 🟡' : locale === 'es' ? 'Medio 🟡' : 'Médio 🟡') : (locale === 'en' ? 'High 🔴' : locale === 'es' ? 'Alto 🔴' : 'Alto 🔴')
                                }</span>
                              )}
                            </div>
                          )}
                          {(log.antecedent || log.behavior || log.consequence) && (
                            <div className="bg-slate-100/60 border border-slate-200/40 p-2 rounded-lg mt-1 text-[10px] text-slate-650 font-bold flex flex-col gap-0.5">
                              {log.antecedent && <div><strong>{locale === 'en' ? 'A (Antecedent):' : locale === 'es' ? 'A (Antecedente):' : 'A (Antecedente):'}</strong> {log.antecedent}</div>}
                              {log.behavior && <div><strong>{locale === 'en' ? 'B (Behavior):' : locale === 'es' ? 'B (Comportamiento):' : 'B (Comportamento):'}</strong> {log.behavior}</div>}
                              {log.consequence && <div><strong>{locale === 'en' ? 'C (Consequence):' : locale === 'es' ? 'C (Consecuencia):' : 'C (Consequência):'}</strong> {log.consequence}</div>}
                            </div>
                          )}
                          {(log.location || log.lightLevel || (log.decibels !== undefined && log.decibels !== null) || log.trigger) && (
                            <div className="flex flex-wrap gap-1.5 pt-1.5 border-t border-slate-100 text-[9px] text-slate-500 font-bold">
                              {log.location && <span className="flex items-center gap-0.5 bg-white border border-slate-200 px-1.5 py-0.5 rounded-md"><MapPin className="w-2.5 h-2.5" /> {log.location}</span>}
                              {log.lightLevel && <span className="flex items-center gap-0.5 bg-white border border-slate-200 px-1.5 py-0.5 rounded-md"><Sun className="w-2.5 h-2.5" /> {locale === 'en' ? 'Light:' : locale === 'es' ? 'Luz:' : 'Luz:'} {log.lightLevel}</span>}
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

        </div>
      )}

      {/* Clinician PDF Report Template */}
      {childData && (
        <div className="print-only">
          <div className="p-8 max-w-4xl mx-auto flex flex-col gap-6 text-[#0f172a] text-left">
            
            {/* Header */}
            <div className="border-b border-slate-200 pb-4 flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-black text-teal-605 tracking-tight font-Outfit">
                  {locale === 'en' ? 'BEHAVIORAL / SENSORY REPORT' : locale === 'es' ? 'INFORME CONDUCTUAL / SENSORIAL' : 'LAUDO COMPORTAMENTAL / SENSORIAL'}
                </h1>
                <p className="text-sm text-slate-505 font-semibold mt-1">
                  {locale === 'en' ? 'TEAcolher SaaS - Clinical Adherence Report' : locale === 'es' ? 'TEAcolher SaaS - Reporte Clínico de Adherencia' : 'TEAcolher SaaS - Relatório Clínico de Aderência'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase">
                  {locale === 'en' ? 'Issue Date' : locale === 'es' ? 'Fecha de Emisión' : 'Data de Emissão'}
                </p>
                <p className="text-sm font-black text-slate-700 font-Outfit">{new Date().toLocaleDateString()}</p>
              </div>
            </div>

            {/* Patient Profile info */}
            <div className="grid grid-cols-3 gap-6 border-b border-slate-200 pb-5">
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase">
                  {locale === 'en' ? 'Child (Patient)' : locale === 'es' ? 'Niño (Paciente)' : 'Criança (Paciente)'}
                </span>
                <p className="text-sm font-black text-slate-800 mt-0.5">{childData.name}</p>
                <p className="text-[10px] text-slate-500 font-semibold">
                  {locale === 'en' ? `Gender: ${childData.gender === 'Feminino' ? 'Female' : childData.gender === 'Masculino' ? 'Male' : 'Not informed'}` : locale === 'es' ? `Género: ${childData.gender === 'Feminino' ? 'Femenino' : childData.gender === 'Masculino' ? 'Masculino' : 'No informado'}` : `Gênero: ${childData.gender || 'Não informado'}`}
                </p>
                {childData.emotionalBattery && (
                  <p className="text-[10px] text-slate-550 font-bold mt-0.5">
                    {locale === 'en' ? `🔋 Emotional Battery: ${childData.emotionalBattery === 'green' ? 'Great (100%)' : childData.emotionalBattery === 'yellow' ? 'Tired (50%)' : 'Overloaded (10%)'}` : locale === 'es' ? `🔋 Batería Emocional: ${childData.emotionalBattery === 'green' ? 'Excelente (100%)' : childData.emotionalBattery === 'yellow' ? 'Cansado (50%)' : 'Sobrecargado (10%)'}` : `🔋 Bateria Emocional: ${childData.emotionalBattery === 'green' ? 'Ótimo (100%)' : childData.emotionalBattery === 'yellow' ? 'Cansado (50%)' : 'Sobrecarregado (10%)'}`}
                  </p>
                )}
              </div>
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase">
                  {locale === 'en' ? 'Clinical Diagnosis' : locale === 'es' ? 'Diagnóstico Clínico' : 'Diagnóstico Clínico'}
                </span>
                <p className="text-sm font-black text-slate-800 mt-0.5">{childData.diagnosis || (locale === 'en' ? 'Not informed' : locale === 'es' ? 'No informado' : 'Não informado')}</p>
                <p className="text-[10px] text-slate-500 font-semibold">
                  {locale === 'en' ? `Hyperfocus: ${childData.childHyperfocus || 'Not registered'}` : locale === 'es' ? `Hiperenfoque: ${childData.childHyperfocus || 'No registrado'}` : `Hiperfoco: ${childData.childHyperfocus || 'Não cadastrado'}`}
                </p>
              </div>
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase">
                  {locale === 'en' ? 'Link Code' : locale === 'es' ? 'Código de Vínculo' : 'Código de Vínculo'}
                </span>
                <p className="text-sm font-black text-teal-700 mt-0.5 uppercase">{childData.sharingCode}</p>
              </div>
            </div>

            {/* Core Indicators */}
            <div className="grid grid-cols-3 gap-4 border-b border-slate-200 pb-5">
              <div className="border border-slate-200 p-3.5 rounded-xl text-center">
                <span className="text-[9px] font-black text-slate-400 uppercase">
                  {locale === 'en' ? 'General Adherence' : locale === 'es' ? 'Adherencia General' : 'Aderência Geral'}
                </span>
                <p className="text-2xl font-black text-slate-800 mt-1">{complianceRate}%</p>
                <span className="text-[8px] text-slate-450 font-semibold">
                  {locale === 'en' ? `${completedTasksElapsed} of ${totalTasksElapsed} tasks completed` : locale === 'es' ? `${completedTasksElapsed} de ${totalTasksElapsed} tareas completadas` : `${completedTasksElapsed} de ${totalTasksElapsed} tarefas concluídas`}
                </span>
              </div>
              <div className="border border-slate-200 p-3.5 rounded-xl text-center">
                <span className="text-[9px] font-black text-slate-400 uppercase">
                  {locale === 'en' ? 'Emotional Stability' : locale === 'es' ? 'Estabilidad Emocional' : 'Estabilidade Emocional'}
                </span>
                <p className="text-2xl font-black text-slate-850 mt-1">{stabilityRate}%</p>
                <span className="text-[8px] text-slate-450 font-semibold">
                  {locale === 'en' ? 'Predominantly regulated mood' : locale === 'es' ? 'Humor predominantemente regulado' : 'Humor predominantemente regulado'}
                </span>
              </div>
              <div className="border border-slate-200 p-3.5 rounded-xl text-center">
                <span className="text-[9px] font-black text-slate-400 uppercase">
                  {locale === 'en' ? 'Meltdown / Crises' : locale === 'es' ? 'Meltdown / Crisis' : 'Meltdown / Crises'}
                </span>
                <p className="text-2xl font-black text-red-650 mt-1">{crisesCount}</p>
                <span className="text-[8px] text-slate-455 font-semibold">
                  {locale === 'en' ? 'Sensory-behavioral crises' : locale === 'es' ? 'Crisis sensorio-conductuales' : 'Crises sensorio-comportamentais'}
                </span>
              </div>
            </div>

            {/* Checkpoints logs */}
            <div>
              <h3 className="text-xs font-black uppercase text-slate-450 tracking-widest mb-3 border-b border-slate-100 pb-1 font-Outfit">
                {locale === 'en' ? 'Clinical-Therapeutic Evolution' : locale === 'es' ? 'Evolución Clínico-Terapéutica' : 'Evolução Clínico-Terapêutica'}
              </h3>
              <div className="flex flex-col gap-3">
                {checkpoints.filter((cp: any) => cp.status === 'completed').length === 0 ? (
                  <p className="text-xs text-slate-405 italic">
                    {locale === 'en' ? 'No clinical feedback recorded for this month.' : locale === 'es' ? 'Ningún feedback clínico registrado para este mes.' : 'Nenhum feedback clínico registrado para este mês.'}
                  </p>
                ) : (
                  checkpoints.filter((cp: any) => cp.status === 'completed').map((cp: any) => (
                    <div key={cp.id} className="border border-slate-200 p-3.5 rounded-xl bg-slate-50/50">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
                        <span>{locale === 'en' ? 'Week' : locale === 'es' ? 'Semana' : 'Semana'} {cp.weekNum} ({cp.date})</span>
                        <span>{locale === 'en' ? 'Specialist:' : locale === 'es' ? 'Especialista:' : 'Especialista:'} {cp.professionalName} ({cp.professionalRole})</span>
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
                <h3 className="text-xs font-black uppercase text-slate-450 tracking-widest mb-3 border-b border-slate-100 pb-1 font-Outfit">
                  {locale === 'en' ? 'Sensory Heatmap (Crisis Triggers)' : locale === 'es' ? 'Mapa de Calor Sensorial (Gatillos de Crisis)' : 'Mapa de Calor Sensorial (Gatilhos de Crises)'}
                </h3>
                <div className="mb-4">
                  <SensoryHeatmap logs={sensoryLogs} />
                </div>
              </div>
            )}

            {/* Sensory Log / Crises ABC Table */}
            <div>
              <h3 className="text-xs font-black uppercase text-slate-450 tracking-widest mb-3 border-b border-slate-100 pb-1 font-Outfit">
                {locale === 'en' ? 'Detailed History of Crises & ABA Analysis (ABC)' : locale === 'es' ? 'Historial Detallado de Crisis y Análisis ABA (ABC)' : 'Histórico Detalhado de Crises & Análise ABA (ABC)'}
              </h3>
              {sensoryLogs.length === 0 ? (
                <p className="text-xs text-slate-400 italic">
                  {locale === 'en' ? 'No behavioral records.' : locale === 'es' ? 'Sin registros de comportamiento.' : 'Sem registros comportamentais.'}
                </p>
              ) : (
                <table className="w-full text-left border-collapse text-xxs mt-2">
                  <thead>
                    <tr className="border-b border-slate-200 text-[9px] font-black uppercase text-slate-450">
                      <th className="py-2 pr-2">{locale === 'en' ? 'Date/Time' : locale === 'es' ? 'Fecha/Hora' : 'Data/Hora'}</th>
                      <th className="py-2 pr-2">{locale === 'en' ? 'Event' : locale === 'es' ? 'Evento' : 'Evento'}</th>
                      <th className="py-2 pr-2">{locale === 'en' ? 'A (Antecedent)' : locale === 'es' ? 'A (Antecedente)' : 'A (Antecedente)'}</th>
                      <th className="py-2 pr-2">{locale === 'en' ? 'B (Behavior)' : locale === 'es' ? 'B (Comportamiento)' : 'B (Comportamento)'}</th>
                      <th className="py-2 pr-2">{locale === 'en' ? 'C (Consequence)' : locale === 'es' ? 'C (Consecuencia)' : 'C (Consequência)'}</th>
                      <th className="py-2">{locale === 'en' ? 'Trigger/Environment' : locale === 'es' ? 'Gatillo/Ambiente' : 'Gatilho/Ambiente'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sensoryLogs.map((log: any) => {
                      const isAac = log.notes?.startsWith('Comunicação AAC:');
                      return (
                        <tr key={log.id} className="border-b border-slate-200/80 py-2">
                          <td className="py-2 pr-2 font-bold text-slate-500 whitespace-nowrap">{new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                          <td className="py-2 pr-2 font-extrabold text-slate-800">
                            {log.crisisOccurred ? (locale === 'en' ? '🚨 Crisis' : locale === 'es' ? '🚨 Crisis' : '🚨 Crise') : isAac ? '🗣️ AAC' : `${locale === 'en' ? 'Mood:' : locale === 'es' ? 'Humor:' : 'Humor:'} ${log.mood}`}
                            <span className="block text-[8px] text-slate-400 uppercase font-black tracking-wider mt-0.5">
                              {log.loggedBy === 'school' 
                                ? (locale === 'en' ? '🏫 School' : locale === 'es' ? '🏫 Escuela' : '🏫 Escola') 
                                : isAac 
                                ? (locale === 'en' ? '🗣️ Communication' : locale === 'es' ? '🗣️ Comunicación' : '🗣️ Comunicação') 
                                : log.loggedBy === 'child' 
                                ? (locale === 'en' ? '👶 Child' : locale === 'es' ? '👶 Niño' : '👶 Criança') 
                                : (locale === 'en' ? '👪 Caregiver' : locale === 'es' ? '👪 Cuidador' : '👪 Cuidador')}
                            </span>
                          </td>
                          <td className="py-2 pr-2 text-slate-650 font-semibold">{log.antecedent || '-'}</td>
                          <td className="py-2 pr-2 text-slate-650 font-semibold">{isAac ? log.notes : (log.behavior || '-')}</td>
                          <td className="py-2 pr-2 text-slate-650 font-semibold">{log.consequence || '-'}</td>
                          <td className="py-2 text-slate-500 font-bold">
                            {log.loggedBy === 'school' ? (
                              <div className="flex flex-col gap-0.5 text-[8px] font-Outfit">
                                {log.foodIntake && <span>🍲 {locale === 'en' ? 'Meals:' : locale === 'es' ? 'Alimentación:' : 'Alimentação:'} {log.foodIntake}</span>}
                                {log.schoolNoise && <span>🔊 {locale === 'en' ? 'Noise:' : locale === 'es' ? 'Ruido:' : 'Barulho:'} {log.schoolNoise}</span>}
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
                <p className="text-[9px] font-black uppercase text-slate-450 mt-2">
                  {locale === 'en' ? 'Professional Signature' : locale === 'es' ? 'Firma del Profesional' : 'Assinatura do Profissional'}
                </p>
              </div>
              <div className="text-center w-48">
                <div className="border-b border-slate-300 h-8"></div>
                <p className="text-[9px] font-black uppercase text-slate-450 mt-2">
                  {locale === 'en' ? 'Legal Guardian' : locale === 'es' ? 'Tutor Legal' : 'Responsável Legal'}
                </p>
              </div>
            </div>

            {/* Rodape de marca: o relatorio circula entre profissionais, e quem
                recebe entra pelo QR sem precisar falar com ninguem. */}
            <PrintFooter
              variant="profissional"
              qrSvg={childData?._portalQrSvg}
              url={childData?._portalUrl}
            />

          </div>
        </div>
      )}
    </main>
  </div>
  );
}
