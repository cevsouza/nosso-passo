'use client';
import React from 'react';
import { stepsForActivity, stepText, ActivityStep } from '../../lib/activity-steps';

/**
 * Passo a passo de "como fazer" a atividade — lista curta e visivel, cada passo
 * tocavel para ouvir (TTS). Analise de tarefa: a crianca segue a tela e faz
 * sozinha. So aparece quando ha passos (biblioteca ou customizados do pai);
 * a maioria das atividades nao tem, e a tela fica limpa.
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
  custom?: ActivityStep[] | null;
}) {
  const steps = (custom && custom.length > 0) ? custom : stepsForActivity(title);
  if (!steps || steps.length === 0) return null;

  return (
    <div className="mt-1 w-full max-w-md flex flex-col gap-1.5">
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center font-Outfit">
        {locale === 'en' ? 'How to do it' : locale === 'es' ? 'Cómo hacerlo' : 'Como fazer'}
      </span>
      <ol className="flex flex-col gap-1.5">
        {steps.map((s, i) => {
          const txt = stepText(s, locale);
          return (
            <li key={i}>
              <button
                type="button"
                onClick={() => onSpeak(txt)}
                title={locale === 'en' ? 'Tap to hear' : locale === 'es' ? 'Toca para oír' : 'Toque para ouvir'}
                className="w-full flex items-center gap-2.5 px-3 py-2 bg-slate-50 hover:bg-indigo-50/50 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-xl text-left cursor-pointer active:scale-[0.99] transition-all select-none"
              >
                <span className="shrink-0 w-6 h-6 rounded-full bg-white dark:bg-white/10 border border-slate-200 dark:border-white/15 text-slate-500 dark:text-slate-300 text-[11px] font-black flex items-center justify-center font-Outfit tabular-nums">
                  {i + 1}
                </span>
                <span className="text-lg shrink-0">{s.emoji}</span>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-snug font-Outfit">{txt}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
