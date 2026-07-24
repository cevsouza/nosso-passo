// Leitura do que os dados ja dizem — sem banco, sem rede, sem IA.
//
// Tudo aqui e funcao pura sobre tarefas, registros sensoriais e checkpoints,
// para poder rodar no servidor (API), no painel da familia e no portal do
// profissional sem duplicar regra. Se uma conta muda, muda em um lugar so.
//
// Convencao de data: Task nao guarda "quando foi concluida" — guarda o dia em
// que estava prevista (`day` = dia do mes, mais `month`/`year`). Para dias que
// ja passaram isso e suficiente: a conclusao daquele dia nao muda mais. Por
// isso toda janela aqui termina ONTEM. O dia de hoje ainda esta acontecendo e
// contaria como abandono.

export interface InsightTask {
  day: string;
  month?: number | null;
  year?: number | null;
  isCompleted: boolean;
  category?: string | null;
  period?: string | null;
  title?: string | null;
  time?: string | null;
}

export interface InsightLog {
  timestamp: string | Date;
  crisisOccurred?: boolean;
  mood?: string | null;
  trigger?: string | null;
  decibels?: number | null;
  lightLevel?: string | null;
  notes?: string | null;
  loggedBy?: string | null;
}

export interface InsightCheckpoint {
  createdAt?: string | Date | null;
  date?: string | null;
  feedback?: string | null;
  professionalName?: string | null;
  professionalRole?: string | null;
}

export type InterfaceMode = 'foco' | 'intermediario' | 'completo';

const MODE_ORDER: InterfaceMode[] = ['foco', 'intermediario', 'completo'];

export const DAY_MS = 86400000;

/** Meia-noite local do dia de `d`. Compara dias, nunca instantes. */
export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** A data em que a tarefa estava prevista, ou null se o registro for antigo/torto. */
export function taskDate(t: InsightTask): Date | null {
  const dayNum = parseInt(String(t.day), 10);
  if (!Number.isFinite(dayNum) || dayNum < 1 || dayNum > 31) return null;
  if (t.month === undefined || t.month === null || t.year === undefined || t.year === null) return null;
  const d = new Date(Number(t.year), Number(t.month) - 1, dayNum);
  // rejeita 31 de fevereiro e afins
  if (d.getMonth() !== Number(t.month) - 1) return null;
  return d;
}

function logDate(l: InsightLog): Date {
  return l.timestamp instanceof Date ? l.timestamp : new Date(l.timestamp);
}

export interface WindowStats {
  from: Date;
  to: Date;            // inclusivo
  days: number;
  scheduled: number;   // tarefas previstas na janela
  done: number;
  rate: number;        // 0..1 — 0 quando nada foi previsto
  activeDays: number;  // dias com pelo menos uma tarefa concluida
  logs: number;
  crises: number;
  moods: Record<string, number>;
  triggers: Record<string, number>;
}

/** Agrega tarefas e registros numa janela fechada [from, to] (ambos inclusivos, por dia). */
export function windowStats(
  tasks: InsightTask[],
  logs: InsightLog[],
  from: Date,
  to: Date
): WindowStats {
  const a = startOfDay(from).getTime();
  const b = startOfDay(to).getTime();
  const days = Math.round((b - a) / DAY_MS) + 1;

  let scheduled = 0;
  let done = 0;
  const activeSet = new Set<number>();

  for (const t of tasks) {
    const d = taskDate(t);
    if (!d) continue;
    const ts = d.getTime();
    if (ts < a || ts > b) continue;
    scheduled++;
    if (t.isCompleted) {
      done++;
      activeSet.add(ts);
    }
  }

  let nLogs = 0;
  let crises = 0;
  const moods: Record<string, number> = {};
  const triggers: Record<string, number> = {};

  for (const l of logs) {
    const d = startOfDay(logDate(l)).getTime();
    if (d < a || d > b) continue;
    nLogs++;
    if (l.crisisOccurred) crises++;
    if (l.mood) moods[l.mood] = (moods[l.mood] || 0) + 1;
    if (l.trigger) triggers[l.trigger] = (triggers[l.trigger] || 0) + 1;
  }

  return {
    from: new Date(a),
    to: new Date(b),
    days,
    scheduled,
    done,
    rate: scheduled > 0 ? done / scheduled : 0,
    activeDays: activeSet.size,
    logs: nLogs,
    crises,
    moods,
    triggers,
  };
}

/**
 * `count` janelas de 7 dias, da mais recente para a mais antiga, todas
 * terminando ONTEM (o dia de hoje fica de fora de proposito).
 */
export function rollingWeeks(
  tasks: InsightTask[],
  logs: InsightLog[],
  now: Date,
  count: number
): WindowStats[] {
  const yesterday = new Date(startOfDay(now).getTime() - DAY_MS);
  const out: WindowStats[] = [];
  for (let i = 0; i < count; i++) {
    const to = new Date(yesterday.getTime() - i * 7 * DAY_MS);
    const from = new Date(to.getTime() - 6 * DAY_MS);
    out.push(windowStats(tasks, logs, from, to));
  }
  return out;
}

export function topEntries(map: Record<string, number>, n = 3): { key: string; count: number }[] {
  return Object.entries(map)
    .sort((x, y) => y[1] - x[1])
    .slice(0, n)
    .map(([key, count]) => ({ key, count }));
}

// ---------------------------------------------------------------------------
// Sugestao de nivel de interface
// ---------------------------------------------------------------------------

export interface LevelSuggestionState {
  dir?: 'up' | 'down';
  mode?: string;        // nivel vigente quando a sugestao foi dispensada
  count?: number;       // quantas vezes a familia disse "agora nao"
  lastAt?: string;      // ISO
}

export interface LevelSuggestion {
  direction: 'up' | 'down';
  from: InterfaceMode;
  to: InterfaceMode;
  /** Semanas que sustentam a sugestao, da mais recente para a mais antiga. */
  weeks: WindowStats[];
  /** Aderencia media do periodo considerado (0..1). */
  rate: number;
  /** Crises na semana que disparou a sugestao (so no sentido "down"). */
  crises: number;
  /** Quantas vezes esta mesma sugestao ja foi dispensada. */
  dismissed: number;
}

export const LEVEL_UP_WEEKS = 3;        // semanas seguidas boas antes de sugerir subir
export const LEVEL_UP_RATE = 0.85;
export const LEVEL_DOWN_RATE = 0.40;
export const MIN_TASKS_PER_WEEK = 5;    // abaixo disso nao ha amostra, so ruido
export const MAX_DISMISSALS = 3;        // o "sinal de morte" do roadmap

export function parseLevelState(raw?: string | null): LevelSuggestionState {
  if (!raw) return {};
  try {
    const p = JSON.parse(raw);
    return p && typeof p === 'object' ? p : {};
  } catch {
    return {};
  }
}

function step(mode: InterfaceMode, dir: 'up' | 'down'): InterfaceMode | null {
  const i = MODE_ORDER.indexOf(mode);
  if (i < 0) return null;
  const j = dir === 'up' ? i + 1 : i - 1;
  return MODE_ORDER[j] || null;
}

/**
 * Le a aderencia real e devolve, no maximo, UMA sugestao de mudanca de nivel.
 * Nunca decide nada: quem troca o nivel e o adulto, sempre. Previsibilidade e
 * o produto — trocar a tela da crianca sozinho seria trair exatamente isso.
 *
 * Devolve null quando nao ha amostra suficiente, quando o nivel ja esta no
 * extremo certo, ou quando a familia ja dispensou a mesma sugestao 3 vezes
 * (nesse caso o problema nao e o nivel, e nao adianta insistir).
 */
export function suggestLevel(opts: {
  mode: InterfaceMode;
  tasks: InsightTask[];
  logs: InsightLog[];
  now?: Date;
  state?: LevelSuggestionState;
}): LevelSuggestion | null {
  const now = opts.now || new Date();
  const state = opts.state || {};
  const weeks = rollingWeeks(opts.tasks, opts.logs, now, LEVEL_UP_WEEKS + 1);
  const [w0, w1, w2, w3] = weeks;

  const dismissedFor = (dir: 'up' | 'down') =>
    state.dir === dir && state.mode === opts.mode ? state.count || 0 : 0;

  // --- descer: uma semana ruim pesa mais do que tres boas ---
  if (opts.mode !== 'foco' && w0.scheduled >= MIN_TASKS_PER_WEEK) {
    const priorCrises = [w1, w2, w3].filter(Boolean).reduce((s, w) => s + w.crises, 0) / 3;
    const collapsed = w0.rate <= LEVEL_DOWN_RATE;
    const crisisSpike = w0.crises >= 3 && w0.crises >= priorCrises * 2;
    if (collapsed || crisisSpike) {
      const to = step(opts.mode, 'down');
      const dismissed = dismissedFor('down');
      if (to && dismissed < MAX_DISMISSALS) {
        return {
          direction: 'down',
          from: opts.mode,
          to,
          weeks: [w0],
          rate: w0.rate,
          crises: w0.crises,
          dismissed,
        };
      }
    }
  }

  // --- subir: so com constancia, nunca com uma semana boa isolada ---
  if (opts.mode !== 'completo') {
    const recent = weeks.slice(0, LEVEL_UP_WEEKS);
    const enough = recent.every(w => w.scheduled >= MIN_TASKS_PER_WEEK);
    const steady = recent.every(w => w.rate >= LEVEL_UP_RATE);
    const calm = recent.every(w => w.crises < 3);
    if (enough && steady && calm) {
      const to = step(opts.mode, 'up');
      const dismissed = dismissedFor('up');
      if (to && dismissed < MAX_DISMISSALS) {
        const scheduled = recent.reduce((s, w) => s + w.scheduled, 0);
        const done = recent.reduce((s, w) => s + w.done, 0);
        return {
          direction: 'up',
          from: opts.mode,
          to,
          weeks: recent,
          rate: scheduled > 0 ? done / scheduled : 0,
          crises: recent.reduce((s, w) => s + w.crises, 0),
          dismissed,
        };
      }
    }
  }

  return null;
}

/** Registra um "agora nao" — e conta, porque tres seguidos sao informacao. */
export function dismissLevelSuggestion(
  state: LevelSuggestionState,
  suggestion: LevelSuggestion
): LevelSuggestionState {
  const same = state.dir === suggestion.direction && state.mode === suggestion.from;
  return {
    dir: suggestion.direction,
    mode: suggestion.from,
    count: (same ? state.count || 0 : 0) + 1,
    lastAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Evolucao: o que mudou desde a ultima vez
// ---------------------------------------------------------------------------

export interface EvolutionReport {
  days: number;
  current: WindowStats;
  previous: WindowStats;
  delta: {
    rate: number;       // pontos percentuais (ex.: +12)
    crises: number;
    activeDays: number;
    scheduled: number;
  };
  topTriggers: { key: string; count: number }[];
  /** Categorias que a crianca mais deixa passar no periodo atual. */
  weakCategories: { key: string; rate: number; scheduled: number }[];
}

/**
 * Compara os ultimos `days` dias (terminando ontem) com os `days` anteriores.
 * E a unica pergunta que o terapeuta faz de verdade ao abrir um relatorio.
 */
export function evolutionReport(
  tasks: InsightTask[],
  logs: InsightLog[],
  opts?: { now?: Date; days?: number }
): EvolutionReport {
  const now = opts?.now || new Date();
  const days = opts?.days || 14;
  const yesterday = new Date(startOfDay(now).getTime() - DAY_MS);

  const curTo = yesterday;
  const curFrom = new Date(curTo.getTime() - (days - 1) * DAY_MS);
  const prevTo = new Date(curFrom.getTime() - DAY_MS);
  const prevFrom = new Date(prevTo.getTime() - (days - 1) * DAY_MS);

  const current = windowStats(tasks, logs, curFrom, curTo);
  const previous = windowStats(tasks, logs, prevFrom, prevTo);

  // aderencia por categoria no periodo atual
  const byCat: Record<string, { scheduled: number; done: number }> = {};
  const a = curFrom.getTime();
  const b = curTo.getTime();
  for (const t of tasks) {
    const d = taskDate(t);
    if (!d) continue;
    const ts = d.getTime();
    if (ts < a || ts > b) continue;
    const cat = t.category || 'AVD';
    if (!byCat[cat]) byCat[cat] = { scheduled: 0, done: 0 };
    byCat[cat].scheduled++;
    if (t.isCompleted) byCat[cat].done++;
  }
  const weakCategories = Object.entries(byCat)
    .filter(([, v]) => v.scheduled >= 3)
    .map(([key, v]) => ({ key, rate: v.done / v.scheduled, scheduled: v.scheduled }))
    .sort((x, y) => x.rate - y.rate);

  return {
    days,
    current,
    previous,
    delta: {
      rate: Math.round((current.rate - previous.rate) * 100),
      crises: current.crises - previous.crises,
      activeDays: current.activeDays - previous.activeDays,
      scheduled: current.scheduled - previous.scheduled,
    },
    topTriggers: topEntries(current.triggers, 3),
    weakCategories,
  };
}

// ---------------------------------------------------------------------------
// Desde a sua ultima visita (portal do profissional)
// ---------------------------------------------------------------------------

export interface SinceVisit {
  since: Date;
  daysAway: number;
  newLogs: number;
  newCrises: number;
  newCheckpoints: number;
  scheduled: number;
  done: number;
  rate: number;
  topTriggers: { key: string; count: number }[];
  /** true quando nao ha nada novo — vale dizer isso em vez de inventar. */
  quiet: boolean;
}

/**
 * O que aconteceu desde `since`. Diferente das outras funcoes, aqui os
 * registros usam o instante exato (o profissional pode ter saido no meio do
 * dia); as tarefas continuam contadas por dia, que e o que elas sabem.
 */
export function sinceVisit(
  tasks: InsightTask[],
  logs: InsightLog[],
  checkpoints: InsightCheckpoint[],
  since: Date,
  now?: Date
): SinceVisit {
  const ref = now || new Date();
  const sinceTs = since.getTime();
  const daysAway = Math.max(0, Math.floor((startOfDay(ref).getTime() - startOfDay(since).getTime()) / DAY_MS));

  let newLogs = 0;
  let newCrises = 0;
  const triggers: Record<string, number> = {};
  for (const l of logs) {
    if (logDate(l).getTime() <= sinceTs) continue;
    newLogs++;
    if (l.crisisOccurred) newCrises++;
    if (l.trigger) triggers[l.trigger] = (triggers[l.trigger] || 0) + 1;
  }

  let newCheckpoints = 0;
  for (const c of checkpoints) {
    const raw = c.createdAt;
    if (!raw) continue;
    const d = raw instanceof Date ? raw : new Date(raw);
    if (d.getTime() > sinceTs) newCheckpoints++;
  }

  // tarefas: do dia da visita ate ontem
  const from = startOfDay(since);
  const to = new Date(startOfDay(ref).getTime() - DAY_MS);
  const w = to.getTime() >= from.getTime()
    ? windowStats(tasks, [], from, to)
    : null;

  return {
    since,
    daysAway,
    newLogs,
    newCrises,
    newCheckpoints,
    scheduled: w?.scheduled || 0,
    done: w?.done || 0,
    rate: w?.rate || 0,
    topTriggers: topEntries(triggers, 3),
    quiet: newLogs === 0 && newCheckpoints === 0 && (w?.done || 0) === 0,
  };
}
