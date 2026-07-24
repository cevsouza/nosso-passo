// Testes da lib de insights: `npm run test:insights`
//
// Estes numeros aparecem impressos num relatorio que um terapeuta le antes de
// uma sessao, e uma sugestao errada muda a tela de uma crianca. As funcoes sao
// puras justamente para poderem ser provadas aqui, sem banco e sem navegador.
//
// O caso que mais importa e o de "hoje nao conta": Task guarda o dia PREVISTO,
// nao o de conclusao, entao incluir o dia corrente contaria como abandono toda
// tarefa que ainda vai acontecer — e o app sugeriria baixar o nivel de uma
// crianca que nao fez nada de errado.

import {
  windowStats, rollingWeeks, suggestLevel, evolutionReport, sinceVisit,
  taskDate, startOfDay, DAY_MS, dismissLevelSuggestion, parseLevelState,
} from '../src/lib/insights';

let pass = 0, fail = 0;
const ok = (name: string, cond: boolean, extra?: any) => {
  if (cond) { pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name, extra !== undefined ? JSON.stringify(extra) : ''); }
};

const NOW = new Date(2026, 6, 24, 15, 0); // 24/07/2026, uma sexta

// gera tarefas para os N dias que terminam ONTEM, com uma taxa de conclusao
function mkTasks(days: number, perDay: number, rate: number, endOffset = 1) {
  const out: any[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(startOfDay(NOW).getTime() - (i + endOffset) * DAY_MS);
    for (let j = 0; j < perDay; j++) {
      out.push({
        day: String(d.getDate()),
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        isCompleted: j / perDay < rate,
        category: j % 2 === 0 ? 'AVD' : 'Aprendizado',
      });
    }
  }
  return out;
}

function mkLogs(days: number, crisesPerDay: number, endOffset = 1, trigger = 'ruído') {
  const out: any[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(startOfDay(NOW).getTime() - (i + endOffset) * DAY_MS);
    for (let j = 0; j < crisesPerDay; j++) {
      out.push({ timestamp: new Date(d.getTime() + 3600000).toISOString(), crisisOccurred: true, mood: 'agitado', trigger });
    }
  }
  return out;
}

console.log('\ntaskDate');
ok('data valida', taskDate({ day: '5', month: 7, year: 2026, isCompleted: false })?.getDate() === 5);
ok('rejeita mes/ano ausente', taskDate({ day: '5', isCompleted: false }) === null);
ok('rejeita 31 de fevereiro', taskDate({ day: '31', month: 2, year: 2026, isCompleted: false }) === null);
ok('rejeita dia lixo', taskDate({ day: 'segunda', month: 7, year: 2026, isCompleted: false }) === null);

console.log('\nwindowStats');
{
  const tasks = mkTasks(7, 4, 1.0);
  const w = windowStats(tasks, [], new Date(startOfDay(NOW).getTime() - 7 * DAY_MS), new Date(startOfDay(NOW).getTime() - DAY_MS));
  ok('conta 7 dias', w.days === 7, w.days);
  ok('28 previstas', w.scheduled === 28, w.scheduled);
  ok('28 feitas', w.done === 28, w.done);
  ok('taxa 1.0', w.rate === 1, w.rate);
  ok('7 dias ativos', w.activeDays === 7, w.activeDays);
}
{
  const w = windowStats([], [], new Date(2026, 6, 1), new Date(2026, 6, 7));
  ok('sem tarefas => taxa 0 (nao NaN)', w.rate === 0);
}

console.log('\nrollingWeeks — hoje fica de fora');
{
  // tarefas SO de hoje: nenhuma janela pode ve-las
  const hoje = [{ day: String(NOW.getDate()), month: 7, year: 2026, isCompleted: false }];
  const weeks = rollingWeeks(hoje, [], NOW, 4);
  ok('hoje nao entra em nenhuma janela', weeks.every(w => w.scheduled === 0));
  ok('janelas nao se sobrepoem', weeks[0].from.getTime() - weeks[1].to.getTime() === DAY_MS);
}

console.log('\nsuggestLevel — subir');
{
  const s = suggestLevel({ mode: 'foco', tasks: mkTasks(21, 3, 1.0), logs: [], now: NOW });
  ok('sugere subir com 3 semanas cheias', s?.direction === 'up', s);
  ok('foco -> intermediario', s?.to === 'intermediario', s?.to);
}
{
  const s = suggestLevel({ mode: 'completo', tasks: mkTasks(21, 3, 1.0), logs: [], now: NOW });
  ok('completo nao sobe mais', s === null);
}
{
  // so a ultima semana boa: nao basta
  const s = suggestLevel({ mode: 'foco', tasks: [...mkTasks(7, 3, 1.0), ...mkTasks(14, 3, 0.3, 8)], logs: [], now: NOW });
  ok('uma semana boa isolada nao sobe', s === null || s.direction !== 'up', s);
}
{
  // amostra magra: 1 tarefa por dia = 7/semana, ok; 0.5 -> menos que MIN
  const s = suggestLevel({ mode: 'foco', tasks: mkTasks(21, 1, 1.0).filter((_, i) => i % 3 === 0), logs: [], now: NOW });
  ok('amostra pequena nao sugere', s === null, s);
}
{
  const s = suggestLevel({ mode: 'foco', tasks: mkTasks(21, 3, 1.0), logs: mkLogs(21, 1), now: NOW });
  ok('3 crises na semana travam a subida', s === null || s.direction !== 'up', s);
}

console.log('\nsuggestLevel — descer');
{
  const s = suggestLevel({ mode: 'completo', tasks: mkTasks(7, 5, 0.2), logs: [], now: NOW });
  ok('taxa baixa sugere descer', s?.direction === 'down', s);
  ok('completo -> intermediario', s?.to === 'intermediario', s?.to);
}
{
  const s = suggestLevel({ mode: 'foco', tasks: mkTasks(7, 5, 0.2), logs: [], now: NOW });
  ok('foco nao desce mais', s === null);
}
{
  // pico de crises com aderencia boa
  const tasks = mkTasks(28, 4, 0.95);
  const logs = [...mkLogs(1, 4, 1), ...mkLogs(21, 0, 8)];
  const s = suggestLevel({ mode: 'intermediario', tasks, logs, now: NOW });
  ok('pico de crises sugere descer', s?.direction === 'down', s);
}

console.log('\nsuggestLevel — dispensas');
{
  const tasks = mkTasks(21, 3, 1.0);
  const base = suggestLevel({ mode: 'foco', tasks, logs: [], now: NOW })!;
  let st = parseLevelState(null);
  st = dismissLevelSuggestion(st, base);
  ok('1a dispensa conta 1', st.count === 1, st);
  st = dismissLevelSuggestion(st, base);
  st = dismissLevelSuggestion(st, base);
  ok('3a dispensa conta 3', st.count === 3, st);
  const after = suggestLevel({ mode: 'foco', tasks, logs: [], now: NOW, state: st });
  ok('para de sugerir apos 3 recusas', after === null, after);

  // mudar de nivel zera a contagem
  const other = suggestLevel({ mode: 'intermediario', tasks, logs: [], now: NOW, state: st });
  ok('contagem e por nivel+direcao', other !== null, other);
}

console.log('\nevolutionReport');
{
  // 14 dias bons agora, 14 ruins antes
  const tasks = [...mkTasks(14, 4, 1.0, 1), ...mkTasks(14, 4, 0.5, 15)];
  const r = evolutionReport(tasks, [], { now: NOW, days: 14 });
  ok('periodo atual 100%', Math.round(r.current.rate * 100) === 100, r.current.rate);
  ok('periodo anterior 50%', Math.round(r.previous.rate * 100) === 50, r.previous.rate);
  ok('delta +50 pontos', r.delta.rate === 50, r.delta);
  ok('janelas nao se cruzam', r.current.from.getTime() - r.previous.to.getTime() === DAY_MS);
}
{
  const r = evolutionReport([], [], { now: NOW });
  ok('sem dados nao quebra', r.delta.rate === 0 && r.current.scheduled === 0);
}
{
  const tasks = mkTasks(14, 4, 0.5);
  const r = evolutionReport(tasks, [], { now: NOW });
  ok('categorias fracas listadas', r.weakCategories.length > 0, r.weakCategories);
}

console.log('\nsinceVisit');
{
  const since = new Date(startOfDay(NOW).getTime() - 5 * DAY_MS);
  const tasks = mkTasks(10, 3, 1.0);
  const logs = mkLogs(3, 1, 1);
  const cps = [{ createdAt: new Date(NOW.getTime() - 2 * DAY_MS) }, { createdAt: new Date(NOW.getTime() - 30 * DAY_MS) }];
  const sv = sinceVisit(tasks, logs, cps, since, NOW);
  ok('dias fora = 5', sv.daysAway === 5, sv.daysAway);
  ok('3 registros novos', sv.newLogs === 3, sv.newLogs);
  ok('3 crises novas', sv.newCrises === 3, sv.newCrises);
  ok('1 sessao nova', sv.newCheckpoints === 1, sv.newCheckpoints);
  ok('nao esta quieto', sv.quiet === false);
  ok('gatilho principal', sv.topTriggers[0]?.key === 'ruído', sv.topTriggers);
}
{
  const since = new Date(startOfDay(NOW).getTime() - 5 * DAY_MS);
  const sv = sinceVisit([], [], [], since, NOW);
  ok('vazio => quiet', sv.quiet === true);
}
{
  // visita hoje mesmo: janela de tarefas invalida (to < from) nao pode quebrar
  const sv = sinceVisit(mkTasks(3, 2, 1), [], [], NOW, NOW);
  ok('visita de hoje nao quebra', sv.daysAway === 0 && sv.scheduled >= 0, sv);
}

console.log(`\n${pass} passaram, ${fail} falharam\n`);
process.exit(fail === 0 ? 0 : 1);
