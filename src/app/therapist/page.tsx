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
  FileSpreadsheet
} from 'lucide-react';
import { playBubble, playMarimba } from '../../lib/audio-synth';

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

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sharingCode.trim()) return;
    setVerifying(true);
    setErrorMsg('');
    playMarimba(392, 0.3);

    try {
      const res = await fetch(`/api/therapist?sharingCode=${sharingCode.toUpperCase().trim()}`);
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
                <h1 className="text-2xl font-black text-slate-900 mt-1 font-Outfit">{childData.name}</h1>
                <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-1.5 text-xs text-slate-500 font-bold">
                  {childData.diagnosis && <span>🎯 Diagnóstico: <strong className="text-slate-800">{childData.diagnosis}</strong></span>}
                  {childData.childHyperfocus && <span>🚀 Hiperfoco: <strong className="text-indigo-650">{childData.childHyperfocus}</strong></span>}
                </div>
              </div>
            </div>

            <button
              onClick={() => { playBubble(); setChildData(null); setSharingCode(''); }}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-250 text-slate-600 text-xs font-black rounded-xl cursor-pointer active:scale-95 transition-all self-start md:self-center font-Outfit"
            >
              🔒 Sair do Prontuário
            </button>
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
                <div className="flex items-center gap-2 text-teal-650 text-left">
                  <ClipboardCheck className="w-5 h-5" />
                  <h3 className="font-black text-slate-900 text-lg font-Outfit">Evolução Clínica & Sessões Clínicas</h3>
                </div>
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
                        <span className="text-xs font-black uppercase tracking-widest font-Outfit">Semana {cp.weekNum}</span>
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
                <div className="flex items-center gap-2 text-indigo-650">
                  <FileSpreadsheet className="w-5 h-5" />
                  <h3 className="font-black text-slate-900 text-lg font-Outfit">Grade de Tarefas da Rotina</h3>
                </div>
                <div className="flex flex-col gap-2.5 max-h-[350px] overflow-y-auto pr-1">
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
                              <div className="flex items-center gap-1.5 flex-wrap">
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
                              <p className="text-[10px] text-slate-450 font-bold mt-1">
                                Dia {task.day} • {task.time} ({task.period})
                              </p>
                              {task.description && (
                                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                                  💡 Instruções: {task.description}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase border ${
                            task.isCompleted 
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-150' 
                              : 'bg-amber-50 text-amber-800 border-amber-150'
                          }`}>
                            {task.isCompleted ? 'Feito' : 'Pendente'}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>

            {/* Right Side: Environmental Sensory Logs & Trigger Analysis */}
            <div className="lg:col-span-4 flex flex-col gap-6 text-left">
              
              {/* Sensory Log / Crises History */}
              <div className="bg-white border border-slate-200 p-5 rounded-[28px] shadow-premium flex flex-col gap-4">
                <div className="flex items-center gap-2 text-red-650">
                  <AlertTriangle className="w-5 h-5" />
                  <h3 className="font-black text-slate-900 text-md font-Outfit">Diário Sensorial & Crises</h3>
                </div>
                
                <div className="flex flex-col gap-2.5 max-h-[500px] overflow-y-auto pr-1">
                  {sensoryLogs.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-6">Nenhum registro no diário emocional.</p>
                  ) : (
                    sensoryLogs.map((log: any) => {
                      return (
                        <div key={log.id} className={`p-3 border rounded-xl flex flex-col gap-1.5 text-xxs ${
                          log.crisisOccurred ? 'bg-red-50/20 border-red-150 text-red-950' : 'bg-indigo-50/20 border-indigo-150 text-indigo-950'
                        }`}>
                          <div className="flex justify-between font-black text-[9px] text-slate-400 uppercase font-Outfit">
                            <span>{new Date(log.timestamp).toLocaleString()}</span>
                            <span>{log.crisisOccurred ? '🚨 Crise' : `🧠 Humor: ${log.mood}`}</span>
                          </div>
                          {log.notes && (
                            <p className="font-semibold text-slate-700 leading-relaxed">
                              {log.notes}
                            </p>
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

    </main>
  );
}
