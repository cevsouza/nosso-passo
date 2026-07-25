'use client';
import React from 'react';
import { CustomStep } from './ludic/ActivitySteps';
import { stepsForActivity, stepText } from '../lib/activity-steps';

/** Serializa os passos para o campo `steps` da tarefa (vazio = usa a biblioteca). */
export function serializeSteps(steps: CustomStep[]): string {
  const clean = steps
    .map((s) => ({ emoji: (s.emoji || '').trim(), text: (s.text || '').trim() }))
    .filter((s) => s.text.length > 0);
  return clean.length ? JSON.stringify(clean) : '';
}

/**
 * Editor do passo a passo "como fazer" de uma atividade. Reaproveitado pelos
 * formularios do Responsavel e do Profissional. Se a atividade tem modelo na
 * biblioteca, oferece "usar modelo pronto" para semear e depois editar.
 */
export default function StepsEditor({
  steps,
  setSteps,
  title,
  locale,
  onBubble,
}: {
  steps: CustomStep[];
  setSteps: React.Dispatch<React.SetStateAction<CustomStep[]>>;
  title: string;
  locale: string;
  onBubble?: () => void;
}) {
  const lib = stepsForActivity(title);
  const bubble = () => { try { onBubble?.(); } catch {} };
  const update = (i: number, patch: Partial<CustomStep>) =>
    setSteps((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  const remove = (i: number) => setSteps((prev) => prev.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) =>
    setSteps((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <label className="text-[11px] font-black text-slate-500 uppercase tracking-wide font-Outfit">
          {locale === 'en' ? 'How-to steps (optional)' : locale === 'es' ? 'Pasos: cómo hacerlo (opcional)' : 'Passo a passo: como fazer (opcional)'}
        </label>
        {steps.length === 0 && lib && (
          <button
            type="button"
            onClick={() => { bubble(); setSteps(lib.map((s) => ({ emoji: s.emoji, text: stepText(s, locale) }))); }}
            className="text-[11px] font-black text-teal-700 hover:text-teal-900 hover:underline cursor-pointer bg-transparent border-none outline-none shrink-0"
          >
            {locale === 'en' ? '✨ Use template' : locale === 'es' ? '✨ Usar modelo' : '✨ Usar modelo pronto'}
          </button>
        )}
      </div>
      {steps.map((s, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <input
            value={s.emoji || ''}
            onChange={(e) => update(i, { emoji: e.target.value })}
            placeholder="🙂"
            maxLength={2}
            className="w-10 text-center px-1 py-2 bg-slate-50 border border-slate-200 rounded-lg text-base outline-none focus:border-indigo-400"
          />
          <input
            value={s.text}
            onChange={(e) => update(i, { text: e.target.value })}
            placeholder={locale === 'en' ? 'Step...' : locale === 'es' ? 'Paso...' : 'Passo...'}
            className="flex-1 min-w-0 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 outline-none focus:border-indigo-400"
          />
          <button type="button" onClick={() => move(i, -1)} disabled={i === 0} title="Subir" className="w-7 h-8 shrink-0 rounded-lg bg-slate-100 border border-slate-200 text-slate-500 disabled:opacity-30 cursor-pointer text-xs">↑</button>
          <button type="button" onClick={() => move(i, 1)} disabled={i === steps.length - 1} title="Descer" className="w-7 h-8 shrink-0 rounded-lg bg-slate-100 border border-slate-200 text-slate-500 disabled:opacity-30 cursor-pointer text-xs">↓</button>
          <button type="button" onClick={() => remove(i)} title="Remover" className="w-7 h-8 shrink-0 rounded-lg bg-rose-50 border border-rose-150 text-rose-500 cursor-pointer text-xs">✕</button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => { bubble(); setSteps((prev) => [...prev, { emoji: '', text: '' }]); }}
        className="self-start text-xs font-black text-indigo-650 hover:text-indigo-800 cursor-pointer bg-transparent border border-dashed border-indigo-200 rounded-lg px-3 py-1.5"
      >
        {locale === 'en' ? '+ Add step' : locale === 'es' ? '+ Agregar paso' : '+ Adicionar passo'}
      </button>
    </div>
  );
}
