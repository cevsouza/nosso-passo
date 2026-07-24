"use client";
import React from 'react';
import type { EvolutionReport as EvolutionData } from '../lib/insights';

// Relatorio de evolucao — uma pagina, uma pergunta: o que mudou desde a
// ultima vez?
//
// O PDF clinico que ja existe responde "como esta"; consolida tudo e serve de
// prontuario. Este responde outra coisa. O terapeuta abre a pasta antes da
// sessao com trinta segundos e uma pergunta na cabeca — se a resposta exige
// comparar duas paginas de tabela, ele nao compara.
//
// Por isso: comparacao explicita (14 dias contra os 14 anteriores), setas com
// o sinal escrito por extenso, e nenhuma metrica que nao mude decisao.

interface Props {
  childName: string;
  data: EvolutionData;
  locale?: string;
  /** Nome de quem imprime, quando informado — vai para o cabecalho. */
  professionalName?: string;
}

const fmtDate = (d: Date | string, locale: string) => {
  const dt = d instanceof Date ? d : new Date(d);
  return dt.toLocaleDateString(locale === 'en' ? 'en-US' : locale === 'es' ? 'es-ES' : 'pt-BR', {
    day: '2-digit', month: '2-digit',
  });
};

const CAT_LABEL: Record<string, Record<string, string>> = {
  AVD: { pt: 'Vida diária', en: 'Daily living', es: 'Vida diaria' },
  Aprendizado: { pt: 'Aprendizado', en: 'Learning', es: 'Aprendizaje' },
  Lazer: { pt: 'Lazer', en: 'Leisure', es: 'Ocio' },
};

export function EvolutionReportSheet({ childName, data, locale = 'pt', professionalName }: Props) {
  const L = (pt: string, en: string, es: string) => (locale === 'en' ? en : locale === 'es' ? es : pt);
  const lang = locale === 'en' ? 'en' : locale === 'es' ? 'es' : 'pt';

  const curPct = Math.round(data.current.rate * 100);
  const prevPct = Math.round(data.previous.rate * 100);
  const d = data.delta;

  const period = `${fmtDate(data.current.from, locale)} – ${fmtDate(data.current.to, locale)}`;
  const prevPeriod = `${fmtDate(data.previous.from, locale)} – ${fmtDate(data.previous.to, locale)}`;

  // Sem amostra nao ha comparacao. Dizer isso e mais util do que desenhar
  // setas em cima de zero.
  const noData = data.current.scheduled === 0 && data.previous.scheduled === 0;

  const rows: { label: string; cur: string; prev: string; delta: number; goodWhen: 'up' | 'down' }[] = [
    {
      label: L('Rotina cumprida', 'Routine completed', 'Rutina cumplida'),
      cur: `${curPct}%`,
      prev: `${prevPct}%`,
      delta: d.rate,
      goodWhen: 'up',
    },
    {
      label: L('Dias com atividade', 'Days with activity', 'Días con actividad'),
      cur: `${data.current.activeDays}`,
      prev: `${data.previous.activeDays}`,
      delta: d.activeDays,
      goodWhen: 'up',
    },
    {
      label: L('Crises registradas', 'Crises recorded', 'Crisis registradas'),
      cur: `${data.current.crises}`,
      prev: `${data.previous.crises}`,
      delta: d.crises,
      goodWhen: 'down',
    },
    {
      label: L('Registros da família', 'Family records', 'Registros de la familia'),
      cur: `${data.current.logs}`,
      prev: `${data.previous.logs}`,
      delta: data.current.logs - data.previous.logs,
      goodWhen: 'up',
    },
  ];

  const arrow = (n: number, goodWhen: 'up' | 'down') => {
    if (n === 0) return { sym: '=', cls: 'text-slate-400' };
    const good = goodWhen === 'up' ? n > 0 : n < 0;
    return {
      sym: `${n > 0 ? '↑' : '↓'} ${Math.abs(n)}`,
      cls: good ? 'text-emerald-700' : 'text-rose-600',
    };
  };

  // A frase de abertura. E o que o profissional le se ler uma coisa so.
  const headline = noData
    ? L(
        'Não há dados suficientes neste período para comparar.',
        'There is not enough data in this period to compare.',
        'No hay datos suficientes en este período para comparar.'
      )
    : d.rate > 5
      ? L(
          `A rotina de ${childName} melhorou: ${Math.abs(d.rate)} pontos acima do período anterior.`,
          `${childName}'s routine improved: ${Math.abs(d.rate)} points above the previous period.`,
          `La rutina de ${childName} mejoró: ${Math.abs(d.rate)} puntos por encima del período anterior.`
        )
      : d.rate < -5
        ? L(
            `A rotina de ${childName} caiu ${Math.abs(d.rate)} pontos em relação ao período anterior.`,
            `${childName}'s routine dropped ${Math.abs(d.rate)} points versus the previous period.`,
            `La rutina de ${childName} cayó ${Math.abs(d.rate)} puntos respecto al período anterior.`
          )
        : L(
            `A rotina de ${childName} se manteve estável em relação ao período anterior.`,
            `${childName}'s routine held steady versus the previous period.`,
            `La rutina de ${childName} se mantuvo estable respecto al período anterior.`
          );

  return (
    <div className="evolution-sheet bg-white text-slate-900 mx-auto w-full max-w-[820px] p-8 flex flex-col gap-6">
      {/* <div>, nao <header>: o CSS global de impressao esconde header/footer/nav,
          e este cabecalho precisa sair no papel. */}
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-black font-Outfit tracking-tight leading-tight">
            {L('Relatório de evolução', 'Progress report', 'Informe de evolución')}
          </h1>
          <p className="text-sm text-slate-500 font-semibold mt-1">
            {childName} · {L('últimos', 'last', 'últimos')} {data.days} {L('dias', 'days', 'días')} ({period})
          </p>
        </div>
        <div className="text-right text-[10px] text-slate-400 font-semibold leading-relaxed shrink-0">
          {professionalName && <div className="text-slate-600 font-black">{professionalName}</div>}
          <div>{L('comparado com', 'compared to', 'comparado con')} {prevPeriod}</div>
        </div>
      </div>

      <p className="text-base font-bold text-slate-800 leading-snug">{headline}</p>

      {!noData && (
        <>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-slate-400">
                <th className="text-left font-black pb-2">{L('Indicador', 'Measure', 'Indicador')}</th>
                <th className="text-right font-black pb-2">{L('Agora', 'Now', 'Ahora')}</th>
                <th className="text-right font-black pb-2">{L('Antes', 'Before', 'Antes')}</th>
                <th className="text-right font-black pb-2">{L('Mudança', 'Change', 'Cambio')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const a = arrow(r.delta, r.goodWhen);
                return (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="py-2.5 font-semibold text-slate-700">{r.label}</td>
                    <td className="py-2.5 text-right font-black tabular-nums text-slate-900">{r.cur}</td>
                    <td className="py-2.5 text-right tabular-nums text-slate-400">{r.prev}</td>
                    <td className={`py-2.5 text-right font-black tabular-nums ${a.cls}`}>{a.sym}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {data.weakCategories.length > 0 && (
            <section>
              <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                {L('Onde a rotina trava', 'Where the routine stalls', 'Dónde se traba la rutina')}
              </h2>
              <div className="flex flex-col gap-1.5">
                {data.weakCategories.slice(0, 3).map(c => (
                  <div key={c.key} className="flex items-center gap-3 text-sm">
                    <span className="w-32 shrink-0 font-semibold text-slate-700">
                      {CAT_LABEL[c.key]?.[lang] || c.key}
                    </span>
                    <span className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <span
                        className="block h-full bg-teal-600 rounded-full"
                        style={{ width: `${Math.round(c.rate * 100)}%` }}
                      />
                    </span>
                    <span className="w-24 text-right tabular-nums text-xs text-slate-500 font-semibold shrink-0">
                      {Math.round(c.rate * 100)}% {L('de', 'of', 'de')} {c.scheduled}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {data.topTriggers.length > 0 && (
            <section>
              <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                {L('Gatilhos mais registrados no período', 'Most recorded triggers in the period', 'Disparadores más registrados en el período')}
              </h2>
              <p className="text-sm text-slate-700 font-semibold">
                {data.topTriggers.map(t => `${t.key} (${t.count}×)`).join(' · ')}
              </p>
            </section>
          )}
        </>
      )}

      <p className="text-[10px] text-slate-400 leading-relaxed border-t border-slate-200 pt-3 mt-auto">
        {L(
          'Este relatório resume registros feitos pela família e pela escola no aplicativo. Não é laudo, não substitui avaliação clínica e não deve ser lido isoladamente.',
          'This report summarises records entered by the family and the school in the app. It is not a diagnosis, does not replace clinical assessment and should not be read in isolation.',
          'Este informe resume registros hechos por la familia y la escuela en la aplicación. No es un diagnóstico, no sustituye la evaluación clínica y no debe leerse de forma aislada.'
        )}
      </p>
    </div>
  );
}
