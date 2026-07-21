"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { firebaseBridge } from '../../../lib/firebase-bridge';
import { playBubble, playMarimba } from '../../../lib/audio-synth';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '../../../lib/LanguageContext';
import { LanguageSelector } from '../../../components/LanguageSelector';
import { DEMO_EMAIL, DEMO_PASSWORD } from '../../../lib/demo-credentials';

export default function ParentAuth() {
  const router = useRouter();
  const { locale, t } = useLanguage();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [consent, setConsent] = useState(false);

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
        if (!consent) {
          throw new Error(
            locale === 'en'
              ? 'To create an account you must confirm you are the legal guardian and accept the terms.'
              : locale === 'es'
              ? 'Para crear una cuenta debes confirmar que eres el responsable legal y aceptar los términos.'
              : 'Para criar a conta, confirme que você é o responsável legal e aceite os termos.'
          );
        }
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

  // Entrada direta na conta de demonstracao: dados ficticios, para quem quer
  // conhecer o app antes de cadastrar uma crianca de verdade.
  const handleDemo = async () => {
    setLoading(true);
    setError('');
    playMarimba(392, 0.3);
    try {
      await firebaseBridge.auth.signIn(DEMO_EMAIL, DEMO_PASSWORD);
      playMarimba(523.25, 0.4);
      router.push('/dashboard');
    } catch {
      setError(
        locale === 'en'
          ? 'The demo is unavailable right now. Please try again in a moment.'
          : locale === 'es'
          ? 'La demostración no está disponible ahora. Inténtelo de nuevo en un momento.'
          : 'A demonstração está indisponível no momento. Tente de novo em instantes.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMode = () => {
    playBubble();
    setIsRegister(!isRegister);
    setError('');
    setConsent(false);
    // Clear passwords but keep email for convenience
    setPassword('');
  };

  return (
    <main style={{ padding: '1.5rem' }} className="min-h-screen flex flex-col items-center justify-center bg-[#f7f7fb] relative overflow-hidden">
      {/* Back button and language selector */}
      <div className="absolute top-6 left-6 right-6 z-10 flex justify-between items-center pointer-events-auto">
        <Link 
          href="/" 
          onMouseEnter={playBubble}
          className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 rounded-full border border-slate-200 shadow-sm transition-all text-xs font-bold active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-slate-600" /> {t.common.back}
        </Link>
        <LanguageSelector />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={{ padding: '2rem' }}
        className="w-full max-w-md bg-white border border-slate-200 rounded-[24px] shadow-premium-soft z-10 relative flex flex-col gap-5"
      >
        {/* Brand avatar — contained, no overlap */}
        <div className="flex justify-center">
          <div className="w-14 h-14 rounded-2xl grad-primary flex items-center justify-center text-2xl shadow-sm select-none">
            🐶
          </div>
        </div>

        <div className="text-center">
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
          <div className="flex flex-col gap-1.5">
            <label className="block text-[11px] font-black text-slate-700 uppercase tracking-widest pl-1 font-Outfit">
              {t.login.labelEmail}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={locale === 'en' ? 'name@example.com' : locale === 'es' ? 'nombre@ejemplo.com' : 'nome@exemplo.com'}
              style={{ padding: '0.7rem 1rem' }}
              className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-slate-900 placeholder-slate-400 outline-none transition-all text-sm font-semibold focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="block text-[11px] font-black text-slate-700 uppercase tracking-widest pl-1 font-Outfit">
              {t.login.labelPassword}
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t.login.placeholderPassword}
              style={{ padding: '0.7rem 1rem' }}
              className="w-full bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-slate-900 placeholder-slate-400 outline-none transition-all text-sm font-semibold focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          {isRegister && (
            <label className="flex gap-2.5 items-start cursor-pointer bg-slate-50 border border-slate-200 rounded-xl p-3 mt-1">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 w-4 h-4 shrink-0 accent-indigo-600 cursor-pointer"
              />
              <span className="text-[11px] text-slate-600 font-semibold leading-relaxed">
                {locale === 'en' ? (
                  <>
                    I am over 18 and the <strong>legal guardian</strong> of the child I will register. I consent to
                    the processing of their health data as described in the{' '}
                    <Link href="/privacidade" target="_blank" className="text-indigo-700 underline font-black">Privacy Policy</Link>
                    {' '}and I accept the{' '}
                    <Link href="/termos" target="_blank" className="text-indigo-700 underline font-black">Terms of Use</Link>.
                  </>
                ) : locale === 'es' ? (
                  <>
                    Soy mayor de 18 años y <strong>responsable legal</strong> del niño que voy a registrar. Consiento
                    el tratamiento de sus datos de salud según la{' '}
                    <Link href="/privacidade" target="_blank" className="text-indigo-700 underline font-black">Política de Privacidad</Link>
                    {' '}y acepto los{' '}
                    <Link href="/termos" target="_blank" className="text-indigo-700 underline font-black">Términos de Uso</Link>.
                  </>
                ) : (
                  <>
                    Sou maior de 18 anos e <strong>responsável legal</strong> pela criança que vou cadastrar. Consinto
                    com o tratamento dos dados de saúde dela conforme a{' '}
                    <Link href="/privacidade" target="_blank" className="text-indigo-700 underline font-black">Política de Privacidade</Link>
                    {' '}e aceito os{' '}
                    <Link href="/termos" target="_blank" className="text-indigo-700 underline font-black">Termos de Uso</Link>.
                  </>
                )}
              </span>
            </label>
          )}

          <button
            type="submit"
            disabled={loading || (isRegister && !consent)}
            style={{ padding: '0.85rem 1rem' }}
            className="w-full mt-1 grad-primary hover:brightness-105 active:scale-95 text-white font-black rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer tracking-wide font-Outfit disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
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

          <button
            type="button"
            onClick={handleDemo}
            onMouseEnter={playBubble}
            disabled={loading}
            className="text-xs font-black text-slate-600 hover:text-indigo-800 cursor-pointer bg-transparent border-none outline-none font-Outfit disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {locale === 'en'
              ? '👀 See the demo — no sign-up needed'
              : locale === 'es'
              ? '👀 Ver la demostración — sin registro'
              : '👀 Ver a demonstração — sem cadastro'}
          </button>

          <Link
            href="/therapist"
            onMouseEnter={playBubble}
            className="text-xs font-black text-indigo-700 hover:text-indigo-900 flex items-center justify-center gap-1 cursor-pointer font-Outfit border-t border-slate-100 pt-3 transition-all"
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
