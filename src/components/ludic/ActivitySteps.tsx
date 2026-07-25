'use client';
import React from 'react';
import { stepsForActivity, stepText } from '../../lib/activity-steps';

/** Passo customizado do pai: texto na lingua dele + emoji opcional. */
export interface CustomStep {
  emoji?: string;
  text: string;
}

/**
 * Le o campo `steps` da tarefa (JSON) com seguranca. "" ou invalido => null.
 * Exportado para a tela do paciente e o editor reaproveitarem a mesma leitura.
 */
export function parseCustomSteps(raw?: string | null): CustomStep[] | null {
  if (!raw) return null;
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return null;
    const clean = arr
      .map((s: any) => ({ emoji: typeof s?.emoji === 'string' ? s.emoji : '', text: typeof s?.text === 'string' ? s.text.trim() : '' }))
      .filter((s: CustomStep) => s.text.length > 0);
    return clean.length > 0 ? clean : null;
  } catch {
    return null;
  }
}

/**
 * Passo a passo de "como fazer" a atividade — lista curta e visivel, cada passo
 * tocavel para ouvir (TTS). Analise de tarefa: a crianca segue a tela e faz
 * sozinha. So aparece quando ha passos; a maioria das atividades nao tem.
 *
 * `custom` (passos do pai) tem prioridade sobre a biblioteca pronta.
 */
export default function ActivitySteps({
  title,
  locale,
  onSpeak,
  custom,
}: {
  title: string;
  locale: string;
  onSpeak: (text: string) => void;
  custom?: CustomStep[] | null;
}) {
  // Normaliza para {emoji, text}: customizado tem prioridade; senao a biblioteca.
  const rows: CustomStep[] | null = (custom && custom.length > 0)
    ? custom
    : (stepsForActivity(title) || []).map((s) => ({ emoji: s.emoji, text: stepText(s, locale) }));

  if (!rows || rows.length === 0) return null;

  return (
    <div className="mt-1 w-full max-w-md flex flex-col gap-1.5">
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center font-Outfit">
        {locale === 'en' ? 'How to do it' : locale === 'es' ? 'Cómo hacerlo' : 'Como fazer'}
      </span>
      <ol className="flex flex-col gap-1.5">
        {rows.map((s, i) => (
          <li key={i}>
            <button
              type="button"
              onClick={() => onSpeak(s.text)}
              title={locale === 'en' ? 'Tap to hear' : locale === 'es' ? 'Toca para oír' : 'Toque para ouvir'}
              className="w-full flex items-center gap-2.5 px-3 py-2 bg-slate-50 hover:bg-indigo-50/50 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-xl text-left cursor-pointer active:scale-[0.99] transition-all select-none"
            >
              <span className="shrink-0 w-6 h-6 rounded-full bg-white dark:bg-white/10 border border-slate-200 dark:border-white/15 text-slate-500 dark:text-slate-300 text-[11px] font-black flex items-center justify-center font-Outfit tabular-nums">
                {i + 1}
              </span>
              {s.emoji ? <span className="text-lg shrink-0">{s.emoji}</span> : null}
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-snug font-Outfit">{s.text}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
