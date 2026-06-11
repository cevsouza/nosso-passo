"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

function SchoolPortalContent() {
  const searchParams = useSearchParams();
  const initialCode = searchParams.get('code') || '';

  const [sharingCode, setSharingCode] = useState(initialCode);
  const [isVerifying, setIsVerifying] = useState(false);
  const [childData, setChildData] = useState<any | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Form states
  const [mood, setMood] = useState<string>('calmo');
  const [crisisOccurred, setCrisisOccurred] = useState<boolean>(false);
  const [schoolNoise, setSchoolNoise] = useState<string>('medio');
  const [foodIntake, setFoodIntake] = useState<string>('boa');
  const [notes, setNotes] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    if (initialCode) {
      verifyCode(initialCode);
    }
  }, [initialCode]);

  const verifyCode = async (codeToVerify: string) => {
    if (!codeToVerify.trim()) return;
    setIsVerifying(true);
    setVerifyError(null);
    setChildData(null);
    setSubmitSuccess(false);

    try {
      const res = await fetch(`/api/therapist?sharingCode=${codeToVerify.trim()}`);
      const data = await res.json();

      if (!res.ok || data.error) {
        setVerifyError(data.error || 'Código inválido ou inativo.');
      } else {
        setChildData(data);
      }
    } catch (err) {
      setVerifyError('Erro de conexão ao validar o código.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!childData) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/sensory-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId: childData.id,
          mood,
          crisisOccurred,
          loggedBy: 'school',
          location: 'Escola',
          schoolNoise,
          foodIntake,
          notes: notes.trim() || 'Check-in diário escolar preenchido pelo mediador/professor.'
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        alert(data.error || 'Erro ao enviar o checkpoint.');
      } else {
        setSubmitSuccess(true);
        // Clear fields
        setNotes('');
        setCrisisOccurred(false);
      }
    } catch (err) {
      alert('Erro de rede ao salvar o relatório.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-tr from-[#f8fafc] via-[#eff6ff] to-[#f0fdf4] text-slate-800 flex flex-col items-center justify-center p-6 relative overflow-hidden font-Outfit">
      {/* Background elements */}
      <div className="absolute top-[-150px] right-[-150px] w-96 h-96 bg-yellow-100/50 rounded-full filter blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-[-150px] left-[-150px] w-96 h-96 bg-indigo-100/50 rounded-full filter blur-3xl -z-10 animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="w-full max-w-md bg-white border-2 border-slate-200 rounded-[32px] p-6 shadow-premium z-10 flex flex-col gap-6">
        <div className="text-center">
          <span className="text-4xl">🏫</span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-2 font-Outfit">Portal do Mediador Escolar</h1>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            Diário de regulação sensorial e checkpoints comportamentais escolares.
          </p>
        </div>

        {!childData ? (
          // Verification Screen
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider font-Outfit">Código de Compartilhamento Clínico</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={sharingCode}
                  onChange={e => setSharingCode(e.target.value.toUpperCase())}
                  placeholder="EX: ABC123"
                  className="flex-1 px-4 py-3 bg-white border-2 border-slate-300 focus:border-indigo-650 focus:bg-white rounded-xl text-slate-900 outline-none text-sm transition-all font-black tracking-widest text-center font-Outfit"
                />
                <button
                  onClick={() => verifyCode(sharingCode)}
                  disabled={isVerifying || !sharingCode.trim()}
                  className="px-5 py-3 bg-indigo-600 hover:bg-indigo-750 disabled:bg-slate-200 disabled:text-slate-400 disabled:border-slate-200 disabled:shadow-none border-b-4 border-indigo-900 text-white text-xs font-black rounded-xl active:scale-95 transition-all cursor-pointer font-Outfit uppercase tracking-wider"
                >
                  {isVerifying ? 'Validando...' : 'Acessar'}
                </button>
              </div>
            </div>

            {verifyError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-750 text-xs font-semibold text-center">
                ❌ {verifyError}
              </div>
            )}

            <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl flex gap-2.5 mt-2">
              <span className="text-sm shrink-0">💡</span>
              <p className="text-[10px] text-slate-500 leading-normal font-medium">
                Insira o código de compartilhamento de 6 caracteres fornecido pelos responsáveis da criança para abrir o painel de registro.
              </p>
            </div>
          </div>
        ) : (
          // Logging Screen
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Child Header Info */}
            <div className="p-3 bg-indigo-50/50 border-2 border-indigo-100 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-655 rounded-xl flex items-center justify-center text-xl shadow-inner border border-indigo-150">
                  {childData.gender === 'Feminino' ? '👧' : '👦'}
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 font-Outfit">{childData.name}</h3>
                  <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest">
                    Paciente • {childData.diagnosis || 'TEA'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setChildData(null); setSharingCode(''); }}
                className="text-[10px] font-black text-slate-400 hover:text-slate-600 font-Outfit uppercase bg-transparent border-none cursor-pointer"
              >
                Sair
              </button>
            </div>

            <AnimatePresence>
              {submitSuccess && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-805 text-xs font-semibold text-center flex flex-col gap-1"
                >
                  <span>✅ Checkpoint escolar salvo com sucesso!</span>
                  <span className="text-[10px] text-emerald-600 font-medium">Os pais e terapeutas já receberam os dados no dashboard.</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mood Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider font-Outfit">Humor Predominante</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { key: 'feliz', emoji: '😊', label: 'Feliz' },
                  { key: 'calmo', emoji: '😐', label: 'Calmo' },
                  { key: 'triste', emoji: '😢', label: 'Triste' },
                  { key: 'agitado', emoji: '😫', label: 'Agitado' }
                ].map(item => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setMood(item.key)}
                    className={`p-2.5 rounded-xl border-2 flex flex-col items-center gap-1 transition-all active:scale-95 cursor-pointer border-none ${
                      mood === item.key
                        ? 'bg-indigo-50 border-2 border-indigo-600 text-indigo-950 font-black shadow-xs'
                        : 'bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-500 font-bold'
                    }`}
                  >
                    <span className="text-xl">{item.emoji}</span>
                    <span className="text-[9px]">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Crisis Toggle */}
            <div className="flex items-center justify-between p-3 border border-slate-200 rounded-2xl bg-slate-50/50">
              <div>
                <label className="block text-xs font-black text-slate-800 font-Outfit">Crise de Desregulação?</label>
                <span className="text-[9px] text-slate-450 font-bold">Ocorreu algum meltdown ou desregulação hoje?</span>
              </div>
              <button
                type="button"
                onClick={() => setCrisisOccurred(!crisisOccurred)}
                className={`px-4 py-2 text-xs font-black rounded-xl transition-all border-b-2 cursor-pointer ${
                  crisisOccurred
                    ? 'bg-red-500 border-red-700 text-white shadow-sm'
                    : 'bg-slate-200 border-slate-350 text-slate-700'
                }`}
              >
                {crisisOccurred ? '🚨 Sim, ocorreu' : 'Não'}
              </button>
            </div>

            {/* School support dropdown selectors */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1 font-Outfit">Nível de Barulho na Sala</label>
                <select
                  value={schoolNoise}
                  onChange={e => setSchoolNoise(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none cursor-pointer"
                >
                  <option value="baixo">Baixo (Ideal) 🔇</option>
                  <option value="medio">Médio 🔉</option>
                  <option value="alto">Alto (Barulhento) 🔊</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1 font-Outfit">Alimentação na Escola</label>
                <select
                  value={foodIntake}
                  onChange={e => setFoodIntake(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none cursor-pointer"
                >
                  <option value="boa">Boa (Comeu tudo) 🍲</option>
                  <option value="regular">Regular (Parcial) 🥣</option>
                  <option value="recusou">Recusou Lanche 🚫</option>
                </select>
              </div>
            </div>

            {/* School notes */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider font-Outfit">Anotações do Dia (Texto Livre)</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Ex: Teve foco nas atividades, interagiu bem no recreio, demonstrou desconforto no final da tarde..."
                className="w-full p-3 bg-white border-2 border-slate-200 rounded-2xl text-xs font-semibold outline-none focus:border-indigo-600 min-h-[90px] resize-none focus:ring-4 focus:ring-indigo-50"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-yellow-500 hover:bg-yellow-600 disabled:bg-slate-200 disabled:text-slate-400 border-none text-slate-950 text-xs font-black rounded-2xl shadow-md uppercase tracking-wider transition-all active:scale-98 cursor-pointer font-Outfit"
            >
              {isSubmitting ? 'Salvando Relatório...' : 'Enviar Checkpoint Escolar 🏫'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

export default function SchoolPortal() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center flex-col gap-3 font-Outfit">
        <div className="w-12 h-12 border-4 border-indigo-650 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm font-black text-slate-700 animate-pulse">Carregando portal escolar...</span>
      </div>
    }>
      <SchoolPortalContent />
    </Suspense>
  );
}
