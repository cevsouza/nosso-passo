"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../lib/LanguageContext';
import { LanguageSelector } from '../../components/LanguageSelector';
import { playBubble, playMarimba } from '../../lib/audio-synth';
import { GlobalNav } from '../../components/GlobalNav';

function SchoolPortalContent() {
  const searchParams = useSearchParams();
  const initialCode = searchParams.get('code') || '';
  const { locale, t } = useLanguage();

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
  const [activeTab, setActiveTab] = useState<'log' | 'dictionary'>('log');

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
        setVerifyError(t.school.errorCode);
      } else {
        setChildData(data);
      }
    } catch (err) {
      setVerifyError(t.school.errorConnection);
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
          notes: notes.trim() || 'Daily school checkpoint logged by mediator.'
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        alert(data.error || 'Error saving checkpoint.');
      } else {
        setSubmitSuccess(true);
        // Clear fields
        setNotes('');
        setCrisisOccurred(false);
      }
    } catch (err) {
      alert('Network error saving report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-tr from-[#f8fafc] via-[#eff6ff] to-[#f0fdf4] text-slate-800 flex flex-col items-center justify-center p-6 relative overflow-hidden font-Outfit lg:pl-64">
      <GlobalNav />
      {/* Background elements */}
      <div className="absolute top-[-150px] right-[-150px] w-96 h-96 bg-yellow-100/50 rounded-full filter blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute bottom-[-150px] left-[-150px] w-96 h-96 bg-indigo-100/50 rounded-full filter blur-3xl -z-10 animate-pulse" style={{ animationDelay: '2s' }}></div>

      {/* Floating Language Selector */}
      <div className="absolute top-6 right-6 z-30">
        <LanguageSelector />
      </div>

      <div className="w-full max-w-md bg-white border-2 border-slate-200 rounded-[32px] p-6 shadow-premium z-10 flex flex-col gap-6">
        <div className="text-center">
          <span className="text-4xl">🏫</span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-2 font-Outfit">{t.school.portalTitle}</h1>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            {t.school.portalDesc}
          </p>
        </div>

        {!childData ? (
          // Verification Screen
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider font-Outfit">{t.school.sharingCodeLabel}</label>
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
                  {isVerifying ? t.school.btnValidating : t.school.btnAccess}
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
                {t.school.tipLabel}
              </p>
            </div>
          </div>
        ) : (
          // Logging Screen
          <div className="flex flex-col gap-4">
            {/* Child Header Info */}
            <div className="p-3 bg-indigo-50/50 border-2 border-indigo-100 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-655 rounded-xl flex items-center justify-center text-xl shadow-inner border border-indigo-150">
                  {childData.gender === 'Feminino' ? '👧' : '👦'}
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 font-Outfit">{childData.name}</h3>
                  <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest">
                    {t.school.childHeaderSubtitle} {childData.diagnosis || 'TEA'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setChildData(null); setSharingCode(''); }}
                className="text-[10px] font-black text-slate-400 hover:text-slate-600 font-Outfit uppercase bg-transparent border-none cursor-pointer"
              >
                {t.common.exit}
              </button>
            </div>

            {/* Didactic Clinical Banner */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-indigo-150 p-4 rounded-2xl text-left shadow-sm">
              <div className="flex items-start gap-2.5">
                <span className="text-xl">📊</span>
                <div>
                  <h4 className="text-xs font-black text-indigo-950 font-Outfit">{t.school.clinicalBannerTitle}</h4>
                  <p className="text-[10px] text-indigo-900 leading-normal font-semibold mt-0.5">
                    {locale === 'en' 
                      ? `This diary synchronizes school behavior with therapist and parent reports. Always consult the Sign Guide to follow recommended strategies for ${childData.name.split(' ')[0]}.`
                      : locale === 'es' 
                      ? `Este diario sincroniza los comportamientos escolares con los informes de terapeutas y padres. Consulte siempre la Guía de Señales para seguir las conductas recomendadas para ${childData.name.split(' ')[0]}.`
                      : `Este diário sincroniza os comportamentos observados na escola com os relatórios analíticos dos terapeutas e pais. Sempre consulte a aba Guia de Sinais para seguir as condutas recomendadas para o(a) ${childData.name.split(' ')[0]}.`}
                  </p>
                </div>
              </div>
            </div>

            {/* Tab Switcher */}
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('log')}
                className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all cursor-pointer font-Outfit border-none ${
                  activeTab === 'log' ? 'bg-white text-indigo-950 shadow-xxs' : 'text-slate-500 hover:text-slate-700 bg-transparent'
                }`}
              >
                {t.school.tabLog}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('dictionary')}
                className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all cursor-pointer font-Outfit border-none ${
                  activeTab === 'dictionary' ? 'bg-white text-indigo-950 shadow-xxs' : 'text-slate-500 hover:text-slate-700 bg-transparent'
                }`}
              >
                {t.school.tabDictionary}
              </button>
            </div>

            {activeTab === 'log' ? (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <AnimatePresence>
                  {submitSuccess && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-805 text-xs font-semibold text-center flex flex-col gap-1"
                    >
                      <span>{t.school.successTitle}</span>
                      <span className="text-[10px] text-emerald-600 font-medium">{t.school.successDesc}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Mood Selector */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider font-Outfit">{t.school.moodLabel}</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { key: 'feliz', emoji: '😊', label: t.school.moodFeliz },
                      { key: 'calmo', emoji: '😐', label: t.school.moodCalmo },
                      { key: 'triste', emoji: '😢', label: t.school.moodTriste },
                      { key: 'agitado', emoji: '😫', label: t.school.moodAgitado }
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
                    <label className="block text-xs font-black text-slate-800 font-Outfit">{t.school.crisisLabel}</label>
                    <span className="text-[9px] text-slate-450 font-bold">{t.school.crisisDesc}</span>
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
                    {crisisOccurred ? t.school.crisisYes : t.school.crisisNo}
                  </button>
                </div>

                {/* School support dropdown selectors */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1 font-Outfit">{t.school.noiseLabel}</label>
                    <select
                      value={schoolNoise}
                      onChange={e => setSchoolNoise(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none cursor-pointer"
                    >
                      <option value="baixo">{t.school.noiseBaixo}</option>
                      <option value="medio">{t.school.noiseMedio}</option>
                      <option value="alto">{t.school.noiseAlto}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1 font-Outfit">{t.school.foodLabel}</label>
                    <select
                      value={foodIntake}
                      onChange={e => setFoodIntake(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none cursor-pointer"
                    >
                      <option value="boa">{t.school.foodBoa}</option>
                      <option value="regular">{t.school.foodRegular}</option>
                      <option value="recusou">{t.school.foodRecusou}</option>
                    </select>
                  </div>
                </div>

                {/* School notes */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider font-Outfit">{t.school.notesLabel}</label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder={t.school.notesPlaceholder}
                    className="w-full p-3 bg-white border-2 border-slate-200 rounded-2xl text-xs font-semibold outline-none focus:border-indigo-600 min-h-[90px] resize-none focus:ring-4 focus:ring-indigo-50"
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-yellow-500 hover:bg-yellow-600 disabled:bg-slate-200 disabled:text-slate-400 border-none text-slate-950 text-xs font-black rounded-2xl shadow-md uppercase tracking-wider transition-all active:scale-98 cursor-pointer font-Outfit"
                >
                  {isSubmitting ? t.school.btnSubmitting : t.school.btnSubmit}
                </button>
              </form>
            ) : (
              // Dictionary View Screen
              <div className="flex flex-col gap-3.5 max-h-[480px] overflow-y-auto pr-1">
                <div className="bg-slate-50 border border-slate-150 p-3 rounded-2xl text-xxs font-bold text-slate-500 leading-relaxed">
                  {t.school.dictionaryTip}
                </div>
                {(() => {
                  let behaviorList = [];
                  try {
                    if (childData.behaviorDictionary) {
                      behaviorList = JSON.parse(childData.behaviorDictionary);
                    }
                  } catch (e) {}

                  if (behaviorList.length === 0) {
                    return (
                      <p className="text-center text-xs text-slate-400 font-semibold italic py-8 font-Outfit">
                        {t.school.dictionaryEmpty}
                      </p>
                    );
                  }

                  return behaviorList.map((item: any) => (
                    <div key={item.id} className="p-3.5 bg-indigo-50/20 border border-indigo-150 rounded-2xl flex flex-col gap-2 text-xxs text-left">
                      <div className="font-Outfit font-extrabold text-xs text-indigo-950 border-b border-indigo-100/50 pb-1 flex justify-between">
                        <span>{locale === 'en' ? '📢 Sign:' : locale === 'es' ? '📢 Señal:' : '📢 Sinal:'} {item.signal}</span>
                      </div>
                      <div className="text-slate-700 leading-normal font-semibold">
                        <strong>{locale === 'en' ? '🧠 Meaning:' : locale === 'es' ? '🧠 Significado:' : '🧠 Significado:'}</strong> {item.meaning}
                      </div>
                      <div className="text-emerald-800 leading-normal bg-emerald-50/50 border border-emerald-150 p-2.5 rounded-xl mt-1 font-semibold">
                        <strong>{locale === 'en' ? '👩‍🏫 Recommended action:' : locale === 'es' ? '👩‍🏫 Conducta recomendada:' : '👩‍🏫 Conduta recomendada:'}</strong> {item.intervention}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default function SchoolPortal() {
  const { t } = useLanguage();
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center flex-col gap-3 font-Outfit">
        <div className="w-12 h-12 border-4 border-indigo-650 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm font-black text-slate-700 animate-pulse">{t.common.loading}</span>
      </div>
    }>
      <SchoolPortalContent />
    </Suspense>
  );
}
