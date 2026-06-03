"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { firebaseBridge } from '../../../lib/firebase-bridge';
import { playBubble, playMarimba } from '../../../lib/audio-synth';
import { BorderCollie } from '../../../components/ludic/BorderCollie';
import { Lock, Mail, ArrowLeft, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function ParentAuth() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('responsavel@exemplo.com');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    playMarimba(392, 0.3);

    try {
      if (!email.includes('@')) {
        throw new Error('Por favor, insira um e-mail válido.');
      }
      if (password.length < 6) {
        throw new Error('A senha deve conter no mínimo 6 caracteres.');
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
      setError(err.message || 'Falha ao autenticar.');
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
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-tr from-[#f0f4f8] via-[#e2edf8] to-[#ebf8f1] animate-gradient-flow relative overflow-hidden">
      {/* Background Soft Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-5%] left-[-5%] w-80 h-80 bg-blue-100/40 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-pulse"></div>
        <div className="absolute bottom-[-5%] right-[-5%] w-96 h-96 bg-indigo-100/30 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Back button */}
      <div className="absolute top-6 left-6 z-10">
        <Link 
          href="/" 
          onMouseEnter={playBubble}
          className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-600 rounded-full border border-slate-200/60 shadow-premium transition-all text-xs font-black active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" /> Voltar
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 35 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md bg-white/85 backdrop-blur-3xl border border-white/70 rounded-[36px] p-8 shadow-[0_30px_60px_rgba(99,102,241,0.06)] z-10 border-t-white relative mt-24"
      >
        {/* Collie Peek Mascot */}
        <div className="absolute top-[-95px] left-1/2 -translate-x-1/2 z-20 drop-shadow-[0_8px_16px_rgba(0,0,0,0.05)] pointer-events-none">
          <BorderCollie state={loading ? "celebrating" : "idle"} size={135} />
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2.5xl font-black text-slate-800 tracking-tight">
            {isRegister ? 'Criar Conta de Responsável' : 'Portal do Responsável'}
          </h1>
          <p className="text-slate-500 text-xs mt-1.5 leading-relaxed font-semibold max-w-xs mx-auto">
            {isRegister 
              ? 'Cadastre-se para gerenciar a rotina semanal, configurar filtros sensoriais e acompanhar laudos clínicos.'
              : 'Acesse as ferramentas de agendamento semanal e acompanhe o registro imutável de rotinas do seu filho.'}
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold flex items-start gap-2 mb-5 border border-red-100"
          >
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 pl-1">
              E-mail do Responsável
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@exemplo.com"
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50/60 border-2 border-slate-200/60 focus:border-indigo-400 focus:bg-white rounded-xl text-slate-800 placeholder-slate-400 outline-none transition-all text-xs font-bold shadow-xxs focus:ring-4 focus:ring-indigo-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 pl-1">
              Senha de Acesso
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full pl-11 pr-4 py-3.5 bg-slate-50/60 border-2 border-slate-200/60 focus:border-indigo-400 focus:bg-white rounded-xl text-slate-800 placeholder-slate-400 outline-none transition-all text-xs font-bold shadow-xxs focus:ring-4 focus:ring-indigo-50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 py-4 bg-indigo-650 hover:bg-indigo-700 active:scale-95 text-white font-black rounded-xl text-xs shadow-glow-indigo transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-widest border-b-3 border-indigo-850"
          >
            {loading 
              ? 'Processando...' 
              : isRegister 
              ? 'Concluir Cadastro ✓' 
              : 'Acessar Painel'}
          </button>
        </form>

        <div className="mt-5 text-center">
          <button
            onClick={handleToggleMode}
            className="text-xs font-black text-indigo-600 hover:text-indigo-850 hover:underline cursor-pointer bg-transparent border-none outline-none"
          >
            {isRegister 
              ? 'Já possui uma conta? Entrar no Painel' 
              : 'Novo por aqui? Criar conta de responsável'}
          </button>
        </div>

        <div className="mt-6 text-center text-[10px] text-slate-400 border-t border-slate-250/40 pt-4 font-bold">
          <p>
            {isRegister 
              ? '* A senha deve conter pelo menos 6 caracteres.' 
              : '* Credenciais de demonstração: responsavel@exemplo.com / 123456'}
          </p>
        </div>
      </motion.div>
    </main>
  );
}
