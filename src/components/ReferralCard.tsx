"use client";
import React, { useEffect, useState } from 'react';
import { Gift, Copy, Check, Share2 } from 'lucide-react';
import { firebaseBridge } from '../lib/firebase-bridge';
import { useLanguage } from '../lib/LanguageContext';

// Cartao de indicacao, no painel do responsavel.
//
// Fica ao lado do plano de proposito: a familia esta olhando quanto custa
// exatamente quando descobre como estender de graca. O texto de WhatsApp ja
// vem pronto — sem isso, quase ninguem escreve o convite do zero.

type Status = {
  code: string;
  total: number;
  diasGanhos: number;
  diasPorIndicacao: number;
  restantes: number;
  premiumUntil: string | null;
  premiumAtivo: boolean;
  assinaturaPaga: boolean;
};

export function ReferralCard() {
  const { locale } = useLanguage();
  const [status, setStatus] = useState<Status | null>(null);
  const [copied, setCopied] = useState<'link' | 'texto' | null>(null);

  useEffect(() => {
    let alive = true;
    firebaseBridge.auth
      .getReferralStatus()
      .then((s) => { if (alive && s) setStatus(s as Status); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  if (!status?.code) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://teacolher.online';
  const link = `${origin}/login?ref=${status.code}`;

  const convite =
    locale === 'en'
      ? `I've been using an app to organize my child's routine at home — it's called Nosso Passo. It was built by a father of an autistic child.\n\nIf you sign up through my link, we both get ${status.diasPorIndicacao} days of Premium:\n${link}`
      : locale === 'es'
      ? `He estado usando una app para organizar la rutina de mi hijo en casa: se llama Nosso Passo. La creó el padre de un niño autista.\n\nSi te registras con mi enlace, los dos ganamos ${status.diasPorIndicacao} días de Premium:\n${link}`
      : `Tenho usado um app para organizar a rotina do meu filho em casa — chama Nosso Passo. Foi feito por um pai de criança autista.\n\nSe você entrar pelo meu link, nós dois ganhamos ${status.diasPorIndicacao} dias de Premium:\n${link}`;

  const copiar = async (texto: string, tipo: 'link' | 'texto') => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopied(tipo);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* navegador sem permissao de area de transferencia: o texto continua visivel para selecionar a mao */
    }
  };

  const ate = status.premiumUntil
    ? new Date(status.premiumUntil).toLocaleDateString(
        locale === 'en' ? 'en-US' : locale === 'es' ? 'es-ES' : 'pt-BR'
      )
    : null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm" style={{ padding: '1.25rem' }}>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
          <Gift className="w-4 h-4 text-emerald-700" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-slate-900 font-Outfit">
            {locale === 'en' ? 'Invite another family' : locale === 'es' ? 'Invite a otra familia' : 'Convide outra família'}
          </h3>
          <p className="text-xs text-slate-600 font-semibold leading-relaxed mt-1">
            {locale === 'en'
              ? `Whoever joins through your link gets ${status.diasPorIndicacao} days of Premium — and so do you.`
              : locale === 'es'
              ? `Quien entre por su enlace gana ${status.diasPorIndicacao} días de Premium — y usted también.`
              : `Quem entrar pelo seu link ganha ${status.diasPorIndicacao} dias de Premium — e você ganha os mesmos ${status.diasPorIndicacao}.`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-4 flex-wrap">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-Outfit">
          {locale === 'en' ? 'Your code' : locale === 'es' ? 'Su código' : 'Seu código'}
        </span>
        <span className="font-mono font-bold tracking-[0.18em] text-slate-900 bg-slate-100 border border-slate-200 rounded-lg text-sm" style={{ padding: '0.35rem 0.7rem' }}>
          {status.code}
        </span>
      </div>

      <div className="flex gap-2 mt-3 flex-wrap">
        <button
          type="button"
          onClick={() => copiar(link, 'link')}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-all cursor-pointer font-Outfit"
          style={{ padding: '0.55rem 0.9rem' }}
        >
          {copied === 'link' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          {copied === 'link'
            ? (locale === 'en' ? 'Copied' : locale === 'es' ? 'Copiado' : 'Copiado')
            : (locale === 'en' ? 'Copy link' : locale === 'es' ? 'Copiar enlace' : 'Copiar link')}
        </button>

        <button
          type="button"
          onClick={() => copiar(convite, 'texto')}
          className="flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all cursor-pointer font-Outfit"
          style={{ padding: '0.55rem 0.9rem' }}
        >
          {copied === 'texto' ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
          {copied === 'texto'
            ? (locale === 'en' ? 'Message copied' : locale === 'es' ? 'Mensaje copiado' : 'Mensagem copiada')
            : (locale === 'en' ? 'Copy ready message' : locale === 'es' ? 'Copiar mensaje listo' : 'Copiar mensagem pronta')}
        </button>
      </div>

      <p className="text-[11px] text-slate-500 font-semibold leading-relaxed mt-3">
        {status.total === 0
          ? (locale === 'en'
              ? 'No one has joined through your link yet.'
              : locale === 'es'
              ? 'Todavía nadie entró por su enlace.'
              : 'Ninguém entrou pelo seu link ainda.')
          : (locale === 'en'
              ? `${status.total} family(ies) joined through you · ${status.diasGanhos} days earned`
              : locale === 'es'
              ? `${status.total} familia(s) entraron por usted · ${status.diasGanhos} días ganados`
              : `${status.total} família(s) entraram por você · ${status.diasGanhos} dias ganhos`)}
        {status.premiumAtivo && ate && (
          <>
            {' · '}
            {locale === 'en' ? 'Premium until ' : locale === 'es' ? 'Premium hasta ' : 'Premium até '}
            <strong>{ate}</strong>
          </>
        )}
      </p>
    </div>
  );
}
