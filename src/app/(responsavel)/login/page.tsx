"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { firebaseBridge } from '../../../lib/firebase-bridge';
import { playBubble, playMarimba } from '../../../lib/audio-synth';
import { BorderCollie } from '../../../components/ludic/BorderCollie';
import { Lock, Mail, ArrowLeft, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '../../../lib/LanguageContext';
import { LanguageSelector } from '../../../components/LanguageSelector';

export default function ParentAuth() {
  const router = useRouter();
  const { locale, t } = useLanguage();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    playMarimba(392, 0.3);

    try {
      if (!email.includes('@')) {
        throw new Error(t.login.errorEmail);
      }
      if (password.length < 6) {
        throw new Error(t.login.errorPassword);
      }

      if (isRegister) {
        await firebaseBridge.auth.signUp(email, password);
        playMarimba(523.25, 0.4); // Success chime
        router.push('/dashboard');
      } else {
        await firebaseBridge.auth.signIn(email, password);
        playMarimba(523.25, 0.4); // Success chime
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || t.login.errorGeneric);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMode = () => {
    playBubble();
    setIsRegister(!isRegister);
    setError('');
    // Clear passwords but keep email for convenience
    setPassword('');
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-tr from-[#f8fafc] via-[#eff6ff] to-[#f0fdf4] animate-gradient-flow relative overflow-hidden">
      {/* Background Soft Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-5%] left-[-5%] w-80 h-80 bg-blue-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-pulse"></div>
        <div className="absolute bottom-[-5%] right-[-5%] w-96 h-96 bg-indigo-200/30 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Back button and language selector */}
      <div className="absolute top-6 left-6 right-6 z-10 flex justify-between items-center pointer-events-auto">
        <Link 
          href="/" 
          onMouseEnter={playBubble}
          className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-800 rounded-full border-2 border-slate-300 shadow-premium transition-all text-xs font-black active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-slate-600" /> {t.common.back}
        </Link>
        <LanguageSelector />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 35 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md bg-white border-2 border-slate-300/80 rounded-[36px] p-8 shadow-[0_30px_60px_rgba(15,23,42,0.06)] z-10 relative mt-24"
      >
        {/* Collie Peek Mascot */}
        <div className="absolute top-[-95px] left-1/2 -translate-x-1/2 z-20 drop-shadow-[0_8px_16px_rgba(0,0,0,0.05)] pointer-events-none">
          <BorderCollie state={loading ? "celebrating" : "idle"} size={135} />
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2.5xl font-black text-slate-905 tracking-tight font-Outfit">
            {isRegister ? t.login.titleRegister : t.login.titleLogin}
          </h1>
          <p className="text-slate-600 text-xs mt-2.5 leading-relaxed font-semibold max-w-xs mx-auto">
            {isRegister ? t.login.descRegister : t.login.descLogin}
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-red-50 text-red-700 p-4 rounded-2xl text-xs font-bold flex items-start gap-2 mb-5 border-2 border-red-200"
          >
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-[11px] font-black text-slate-700 uppercase tracking-widest mb-2 pl-1 font-Outfit">
              {t.login.labelEmail}
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@exemplo.com"
                className="w-full pl-11 pr-4 py-3.5 bg-white border-2 border-slate-300 focus:border-indigo-600 focus:bg-white rounded-xl text-slate-900 placeholder-slate-400 outline-none transition-all text-xs font-bold shadow-xxs focus:ring-4 focus:ring-indigo-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-700 uppercase tracking-widest mb-2 pl-1 font-Outfit">
              {t.login.labelPassword}
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.login.placeholderPassword}
                className="w-full pl-11 pr-4 py-3.5 bg-white border-2 border-slate-300 focus:border-indigo-600 focus:bg-white rounded-xl text-slate-900 placeholder-slate-400 outline-none transition-all text-xs font-bold shadow-xxs focus:ring-4 focus:ring-indigo-100"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 py-4 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black rounded-xl text-xs shadow-glow-indigo transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-widest border-b-4 border-indigo-900 font-Outfit"
          >
            {loading 
              ? t.login.btnProcessing 
              : isRegister 
              ? t.login.btnSignUp + ' ✓' 
              : t.login.btnSignIn}
          </button>
        </form>

        <div className="mt-5 text-center flex flex-col gap-3">
          <button
            onClick={handleToggleMode}
            className="text-xs font-black text-indigo-700 hover:text-indigo-900 hover:underline cursor-pointer bg-transparent border-none outline-none font-Outfit"
          >
            {isRegister 
              ? t.login.toggleToLogin 
              : t.login.toggleToRegister}
          </button>

          <Link
            href="/therapist"
            onMouseEnter={playBubble}
            className="text-xs font-black text-teal-700 hover:text-teal-950 flex items-center justify-center gap-1 cursor-pointer font-Outfit border-t border-slate-100 pt-3 transition-all"
          >
            {locale === 'en' 
              ? '🩺 Are you a therapist? Access with Patient Code' 
              : locale === 'es' 
              ? '🩺 ¿Es terapeuta? Acceda con el Código del Paciente' 
              : '🩺 É terapeuta? Acesse com o Código do Paciente'}
          </Link>
        </div>

        <div className="mt-6 text-center text-[10px] text-slate-500 border-t border-slate-200 pt-4 font-bold">
          <p>
            {locale === 'en' 
              ? '* The password must be at least 6 characters long.' 
              : locale === 'es' 
              ? '* La contraseña debe tener al menos 6 caracteres.' 
              : '* A senha deve conter pelo menos 6 caracteres.'}
          </p>
        </div>
      </motion.div>
    </main>
  );
}
