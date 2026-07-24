// ---------------------------------------------------------------------------
// Conteudo da conta de demonstracao (vendas/marketing).
//
// Este arquivo nao toca o banco: so gera os dados. Quem grava e o
// `demo-seed.ts`. E aqui que se edita nome de crianca, rotina, falas do
// terapeuta e registros — sem risco de mexer em codigo de persistencia.
//
// A rotina e sempre gerada para o MES CORRENTE, entao a demo nunca abre vazia:
// existe "hoje", com parte das tarefas ja concluidas.
// ---------------------------------------------------------------------------

export { DEMO_UID, DEMO_EMAIL, DEMO_PASSWORD, DEMO_PIN, DEMO_CODES } from './demo-credentials';

// Horario de Brasilia, independente do fuso do servidor (Railway roda em UTC).
const BRT_OFFSET_MIN = -180;

export function brtNow() {
  return new Date(Date.now() + BRT_OFFSET_MIN * 60000);
}

/** Instante UTC real correspondente a um horario de Brasilia. */
function brtToUtc(year: number, monthIndex: number, day: number, hh: number, mm: number) {
  return new Date(Date.UTC(year, monthIndex, day, hh, mm) - BRT_OFFSET_MIN * 60000);
}

/** PRNG deterministico: todo reset produz exatamente a mesma demonstracao. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const minutesOf = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

// ---------------------------------------------------------------------------
// Modelos de rotina
// ---------------------------------------------------------------------------

type Slot = {
  title: string;
  time: string;
  period: 'manhã' | 'tarde' | 'noite';
  category: 'AVD' | 'Aprendizado' | 'Lazer';
  duration: number;
  icon: string;
  description?: string;
  /** Dias da semana (0=domingo) em que a tarefa aparece. Omitido = todos. */
  weekdays?: number[];
};

// Teo, 8 anos — rotina completa de quem ja esta na escola regular.
const TEO_WEEKDAY: Slot[] = [
  { title: 'Acordar e abrir a cortina', time: '06:50', period: 'manhã', category: 'AVD', duration: 10, icon: '🌅', description: 'Luz natural primeiro, sem acender a luz do teto.' },
  { title: 'Escovar os dentes', time: '07:05', period: 'manhã', category: 'AVD', duration: 10, icon: '🪥' },
  { title: 'Café da manhã', time: '07:20', period: 'manhã', category: 'AVD', duration: 25, icon: '🥣', description: 'Mesma caneca azul. Trocar a caneca costuma travar o café.' },
  { title: 'Vestir o uniforme', time: '07:50', period: 'manhã', category: 'AVD', duration: 15, icon: '👕', description: 'Roupa separada na noite anterior, na ordem em que veste.' },
  { title: 'Ir para a escola', time: '08:10', period: 'manhã', category: 'AVD', duration: 30, icon: '🚌', description: 'Sai de casa 8h10 e conta as estações do caminho.' },
  { title: 'Aula', time: '08:40', period: 'manhã', category: 'Aprendizado', duration: 180, icon: '🏫' },
  { title: 'Almoço', time: '12:10', period: 'tarde', category: 'AVD', duration: 30, icon: '🍲' },
  { title: 'Descanso sem tela', time: '12:50', period: 'tarde', category: 'Lazer', duration: 30, icon: '🛋️' },
  { title: 'Fonoaudiologia', time: '14:00', period: 'tarde', category: 'Aprendizado', duration: 50, icon: '🗣️', description: 'Sessão semanal. Avisar 3 dias antes se mudar de horário.', weekdays: [2] },
  { title: 'Terapia ocupacional', time: '14:00', period: 'tarde', category: 'Aprendizado', duration: 50, icon: '🧩', description: 'Sessão semanal.', weekdays: [4] },
  { title: 'Tarefa da escola', time: '14:00', period: 'tarde', category: 'Aprendizado', duration: 25, icon: '✏️', description: 'Máximo 25 minutos. Passou disso, para e retoma amanhã.', weekdays: [1, 3, 5] },
  { title: 'Tempo do metrô', time: '15:30', period: 'tarde', category: 'Lazer', duration: 40, icon: '🚇', description: 'Vídeos de linha de metrô. É o que recarrega ele.' },
  { title: 'Banho', time: '17:30', period: 'tarde', category: 'AVD', duration: 20, icon: '🛁', description: 'Chuveiro morno, não quente. Avisar 5 minutos antes.' },
  { title: 'Jantar em família', time: '18:40', period: 'noite', category: 'AVD', duration: 30, icon: '🍽️' },
  { title: 'História com luz baixa', time: '19:40', period: 'noite', category: 'Lazer', duration: 20, icon: '📖' },
  { title: 'Dormir', time: '20:15', period: 'noite', category: 'AVD', duration: 15, icon: '😴' },
];

const TEO_WEEKEND: Slot[] = [
  { title: 'Acordar sem alarme', time: '08:00', period: 'manhã', category: 'AVD', duration: 15, icon: '🌤️' },
  { title: 'Café da manhã', time: '08:30', period: 'manhã', category: 'AVD', duration: 30, icon: '🥣' },
  { title: 'Escovar os dentes', time: '09:10', period: 'manhã', category: 'AVD', duration: 10, icon: '🪥' },
  { title: 'Passeio combinado', time: '10:00', period: 'manhã', category: 'Lazer', duration: 90, icon: '🚉', description: 'Combinado na véspera, com a volta já marcada.' },
  { title: 'Almoço', time: '12:30', period: 'tarde', category: 'AVD', duration: 40, icon: '🍲' },
  { title: 'Tempo do metrô', time: '15:00', period: 'tarde', category: 'Lazer', duration: 60, icon: '🚇' },
  { title: 'Banho', time: '17:30', period: 'tarde', category: 'AVD', duration: 20, icon: '🛁' },
  { title: 'Jantar em família', time: '19:00', period: 'noite', category: 'AVD', duration: 40, icon: '🍽️' },
  { title: 'História com luz baixa', time: '20:00', period: 'noite', category: 'Lazer', duration: 20, icon: '📖' },
  { title: 'Dormir', time: '20:40', period: 'noite', category: 'AVD', duration: 15, icon: '😴' },
];

// Bento, 6 anos — rotina intermediaria.
const BENTO_WEEKDAY: Slot[] = [
  { title: 'Acordar', time: '07:00', period: 'manhã', category: 'AVD', duration: 10, icon: '🌅' },
  { title: 'Escovar os dentes', time: '07:20', period: 'manhã', category: 'AVD', duration: 10, icon: '🪥' },
  { title: 'Café da manhã', time: '07:35', period: 'manhã', category: 'AVD', duration: 25, icon: '🥣' },
  { title: 'Escola', time: '08:30', period: 'manhã', category: 'Aprendizado', duration: 180, icon: '🏫' },
  { title: 'Almoço', time: '12:30', period: 'tarde', category: 'AVD', duration: 30, icon: '🍲' },
  { title: 'Psicologia (ABA)', time: '15:00', period: 'tarde', category: 'Aprendizado', duration: 50, icon: '🧠', weekdays: [1, 3] },
  { title: 'Brincar com os dinossauros', time: '16:00', period: 'tarde', category: 'Lazer', duration: 45, icon: '🦖' },
  { title: 'Banho', time: '17:40', period: 'tarde', category: 'AVD', duration: 20, icon: '🛁' },
  { title: 'Jantar', time: '19:00', period: 'noite', category: 'AVD', duration: 30, icon: '🍽️' },
  { title: 'Dormir', time: '20:30', period: 'noite', category: 'AVD', duration: 15, icon: '😴' },
];

const BENTO_WEEKEND: Slot[] = [
  { title: 'Acordar', time: '08:00', period: 'manhã', category: 'AVD', duration: 15, icon: '🌤️' },
  { title: 'Café da manhã', time: '08:40', period: 'manhã', category: 'AVD', duration: 30, icon: '🥣' },
  { title: 'Parque', time: '10:30', period: 'manhã', category: 'Lazer', duration: 60, icon: '🌳' },
  { title: 'Almoço', time: '12:30', period: 'tarde', category: 'AVD', duration: 40, icon: '🍲' },
  { title: 'Brincar com os dinossauros', time: '15:30', period: 'tarde', category: 'Lazer', duration: 60, icon: '🦖' },
  { title: 'Banho', time: '17:40', period: 'tarde', category: 'AVD', duration: 20, icon: '🛁' },
  { title: 'Jantar', time: '19:00', period: 'noite', category: 'AVD', duration: 40, icon: '🍽️' },
  { title: 'Dormir', time: '20:40', period: 'noite', category: 'AVD', duration: 15, icon: '😴' },
];

// Nina, 4 anos — modo Foco: so as ancoras do dia, nada alem disso.
const NINA_DAY: Slot[] = [
  { title: 'Acordar', time: '07:30', period: 'manhã', category: 'AVD', duration: 15, icon: '🌅' },
  { title: 'Café da manhã', time: '08:00', period: 'manhã', category: 'AVD', duration: 30, icon: '🥣' },
  { title: 'Almoço', time: '12:00', period: 'tarde', category: 'AVD', duration: 40, icon: '🍲' },
  { title: 'Banho', time: '17:00', period: 'tarde', category: 'AVD', duration: 25, icon: '🛁' },
  { title: 'Jantar', time: '18:30', period: 'noite', category: 'AVD', duration: 40, icon: '🍽️' },
  { title: 'Dormir', time: '20:00', period: 'noite', category: 'AVD', duration: 20, icon: '😴' },
];

type RoutineModel = {
  weekday: Slot[];
  weekend: Slot[];
  adherence: number;
  /**
   * Adesao nas ultimas 3 semanas, quando a historia da crianca e "engatou
   * agora". Existe por causa da sugestao de nivel: sem uma virada recente no
   * dado, a demonstracao nunca mostra o app propondo subir de nivel — que e
   * justamente a coisa que nenhum concorrente faz.
   */
  recentAdherence?: number;
};

const ROUTINES: Record<string, RoutineModel> = {
  teo: { weekday: TEO_WEEKDAY, weekend: TEO_WEEKEND, adherence: 0.86 },
  bento: { weekday: BENTO_WEEKDAY, weekend: BENTO_WEEKEND, adherence: 0.78 },
  // A Nina e a historia de progresso: comecou irregular e engatou no ultimo
  // mes. E ela que dispara a sugestao de sair do Foco para o Intermediario.
  nina: { weekday: NINA_DAY, weekend: NINA_DAY, adherence: 0.62, recentAdherence: 0.95 },
};

/** Dias inteiros entre duas datas UTC (a, b), positivo quando b vem depois. */
const daysBetween = (a: Date, b: Date) =>
  Math.round((Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate())
    - Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate())) / 86400000);

/**
 * Gera a rotina do mes ANTERIOR e do mes corrente. Dias passados vem com adesao
 * parcial (nunca 100% — rotina perfeita nao existe e um terapeuta percebe na
 * hora); o dia de hoje vem concluido so ate o horario atual; dias futuros ficam
 * abertos.
 *
 * O mes anterior existe por dois motivos: o relatorio de evolucao compara 14
 * dias com os 14 anteriores (sem isso a coluna "antes" fica pela metade e a
 * comparacao mente), e a sugestao de nivel olha 3 semanas para tras, que no
 * comeco do mes caem todas no mes passado.
 */
export function buildTasks(modelKey: string, childId: string, userUid: string, seed: number) {
  const model = ROUTINES[modelKey];
  const now = brtNow();
  const nowMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const rand = rng(seed);

  const rows: any[] = [];

  // [mes anterior, mes corrente] — nessa ordem, para o PRNG andar no tempo.
  const months = [
    new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)),
    new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)),
  ];

  for (const monthStart of months) {
    const year = monthStart.getUTCFullYear();
    const monthIndex = monthStart.getUTCMonth();
    const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(Date.UTC(year, monthIndex, day));
      const offset = daysBetween(date, now); // >0 passado, 0 hoje, <0 futuro
      const weekday = date.getUTCDay();
      const isWeekend = weekday === 0 || weekday === 6;
      const slots = (isWeekend ? model.weekend : model.weekday).filter(
        (s) => !s.weekdays || s.weekdays.includes(weekday)
      );

      // A virada de comportamento: as ultimas 3 semanas (sem contar hoje).
      const adherence =
        model.recentAdherence !== undefined && offset >= 1 && offset <= 21
          ? model.recentAdherence
          : model.adherence;

      slots.forEach((slot, index) => {
        let isCompleted = false;
        if (offset > 0) {
          isCompleted = rand() < adherence;
        } else if (offset === 0) {
          isCompleted = minutesOf(slot.time) + slot.duration <= nowMinutes && rand() < 0.9;
        } else {
          rand(); // mantem a sequencia estavel entre os dias
        }

        rows.push({
          title: `${slot.title} ${slot.icon}`,
          time: slot.time,
          period: slot.period,
          day: String(day),
          isCompleted,
          order: index + 1,
          icon: slot.icon,
          category: slot.category,
          duration: slot.duration,
          description: slot.description || '',
          childId,
          userUid,
          month: monthIndex + 1,
          year,
        });
      });
    }
  }

  return rows;
}

// ---------------------------------------------------------------------------
// Registros sensoriais / diario
// ---------------------------------------------------------------------------

/**
 * Dias do mes corrente disponiveis para o historico (do mais antigo ate ontem)
 * e um seletor "ha N dias" que distribui os registros por todo o periodo
 * disponivel. Sem essa escala, no comeco do mes o historico inteiro desabava
 * no dia 1.
 */
function historyPicker() {
  const now = brtNow();
  const todayMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const monthStartMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
  // Quantos dias do mes corrente ja passaram (0 se hoje e dia 1).
  const daysThisMonth = Math.round((todayMs - monthStartMs) / 86400000);

  /**
   * Data de "ha N dias", em calendario de Brasilia.
   *
   * `sameMonth` prende o registro dentro do mes corrente: as crises que devem
   * se correlacionar com a rotina so funcionam se houver tarefa gerada naquele
   * dia, e a rotina existe apenas no mes corrente. Os demais registros podem
   * atravessar para o mes anterior — e o que mantem o historico continuo
   * quando a demo e reiniciada nos primeiros dias do mes.
   *
   * `weekday` recua ate cair de segunda a sexta (escola, terapia, licao).
   */
  const dayAt = (fromEnd: number, opts?: { sameMonth?: boolean; weekday?: boolean }) => {
    let offset = fromEnd;
    if (opts?.sameMonth) {
      offset = daysThisMonth === 0 ? 0 : ((fromEnd - 1) % daysThisMonth) + 1;
    }
    let ms = todayMs - offset * 86400000;

    if (opts?.weekday) {
      for (let i = 0; i < 7; i++) {
        const wd = new Date(ms).getUTCDay();
        if (wd >= 1 && wd <= 5) break;
        const back = ms - 86400000;
        ms = opts.sameMonth && back < monthStartMs ? ms + 86400000 : back;
      }
    }

    const d = new Date(ms);
    return { year: d.getUTCFullYear(), monthIndex: d.getUTCMonth(), day: d.getUTCDate() };
  };

  return dayAt;
}

type DayRef = { year: number; monthIndex: number; day: number };

/**
 * Historico do Teo com um padrao real embutido, para que a analise do app
 * tenha o que encontrar: crises concentradas em ruido alto (>70dB) e luz
 * forte, e crises logo depois das tarefas de Aprendizado. Sem padrao, a aba
 * de analise abre vazia e a demonstracao morre ali.
 */
export function buildTeoLogs(childId: string) {
  const now = brtNow();
  const year = now.getUTCFullYear();
  const monthIndex = now.getUTCMonth();
  const dayAt = historyPicker();
  // As crises precisam cair num dia que tenha rotina gerada, para que o painel
  // consiga ligar cada crise a tarefa que veio antes dela.
  const crisisDay = (fromEnd: number) => dayAt(fromEnd, { sameMonth: true, weekday: true });

  const logs: any[] = [];
  const add = (ref: DayRef, hh: number, mm: number, data: any) => {
    logs.push({ childId, timestamp: brtToUtc(ref.year, ref.monthIndex, ref.day, hh, mm), ...data });
  };

  // --- Crises com gatilho sonoro (o padrao que a analise deve achar) --------
  add(dayAt(23), 10, 40, {
    mood: 'agitado',
    crisisOccurred: true,
    decibels: 84,
    lightLevel: 'Alta',
    location: 'Supermercado',
    trigger: 'Ruído Alto',
    notes: 'Anúncio no alto-falante bem em cima dele. Tapou os ouvidos e sentou no chão.',
    loggedBy: 'parent',
  });
  add(crisisDay(15), 9, 55, {
    mood: 'agitado',
    crisisOccurred: true,
    decibels: 79,
    lightLevel: 'Alta',
    location: 'Escola',
    trigger: 'Ruído Alto',
    notes: 'Recreio no pátio coberto. Saiu antes do sinal, foi para a sala de leitura.',
    loggedBy: 'school',
    schoolNoise: 'Alto',
    antecedent: 'Recreio no pátio, cerca de 60 crianças gritando',
    behavior: 'Tapou os ouvidos, começou a chorar e correu para a porta',
    consequence: 'Levado à sala de leitura com abafador; acalmou em 6 minutos',
  });
  add(dayAt(6), 15, 5, {
    mood: 'agitado',
    crisisOccurred: true,
    decibels: 88,
    lightLevel: 'Alta',
    location: 'Festa de aniversário',
    trigger: 'Ruído Alto',
    notes: 'Parabéns cantado com microfone. Saiu do salão sozinho — foi o sinal.',
    loggedBy: 'parent',
  });

  // --- Crises apos tarefa de Aprendizado (correlacao com a rotina) ---------
  // ~35 min depois da "Tarefa da escola" das 14:00, no mesmo dia do mes.
  add(crisisDay(19), 14, 35, {
    mood: 'agitado',
    crisisOccurred: true,
    decibels: 52,
    lightLevel: 'Média',
    location: 'Casa',
    trigger: 'Frustração',
    notes: 'Errou a mesma conta três vezes e rasgou a folha. Passou dos 25 minutos combinados.',
    loggedBy: 'parent',
    antecedent: 'Lição de casa já no 35º minuto, sem pausa',
    behavior: 'Rasgou a folha, empurrou o caderno, chorou',
    consequence: 'Encerrou a atividade; retomou no dia seguinte em 15 minutos, sem crise',
  });
  add(crisisDay(9), 14, 40, {
    mood: 'triste',
    crisisOccurred: true,
    decibels: 48,
    lightLevel: 'Média',
    location: 'Casa',
    trigger: 'Frustração',
    notes: 'Mesmo padrão: a crise vem quando a tarefa passa de meia hora.',
    loggedBy: 'parent',
  });

  // --- Crise de transicao no banho ----------------------------------------
  add(crisisDay(12), 17, 45, {
    mood: 'agitado',
    crisisOccurred: true,
    decibels: 55,
    lightLevel: 'Média',
    location: 'Casa',
    trigger: 'Transição Inesperada',
    notes: 'Chamado para o banho no meio do vídeo, sem o aviso de 5 minutos.',
    loggedBy: 'parent',
    antecedent: 'Interrompido no meio do vídeo de metrô, sem aviso prévio',
    behavior: 'Gritou, se jogou no sofá, recusou entrar no banheiro por 20 minutos',
    consequence: 'Com o aviso visual de 5 minutos, nas outras noites entrou sem resistência',
  });

  // --- Dias bons: o contraste que sustenta o argumento --------------------
  const good: Array<[number, number, number, string, string, string]> = [
    [24, 19, 50, 'calmo', 'Casa', 'Noite tranquila. Dormiu 20 minutos antes do normal.'],
    [22, 16, 10, 'feliz', 'Casa', 'Contou a linha 4 do metrô inteira, estação por estação.'],
    [21, 12, 30, 'calmo', 'Escola', 'Almoçou na sala menor, com menos gente. Funcionou.'],
    [18, 15, 20, 'feliz', 'Terapia', 'Sessão de fono boa. Pediu água usando a prancha.'],
    [17, 8, 20, 'calmo', 'Casa', 'Café da manhã sem negociação. Caneca azul.'],
    [16, 20, 10, 'calmo', 'Casa', 'História com luz baixa. Adormeceu na segunda página.'],
    [14, 16, 40, 'feliz', 'Parque', 'Passeio combinado na véspera, com hora de voltar marcada.'],
    [13, 9, 30, 'calmo', 'Escola', 'Usou o abafador no recreio por conta própria.'],
    [11, 18, 50, 'feliz', 'Casa', 'Jantou tudo. Contou o dia sem a gente perguntar.'],
    [10, 14, 20, 'calmo', 'Casa', 'Lição em 15 minutos, com pausa no meio. Sem crise.'],
    [8, 20, 5, 'calmo', 'Casa', 'Rotina da noite na ordem certa.'],
    [7, 11, 0, 'feliz', 'Casa', 'Sábado devagar. Acordou sem alarme.'],
    [5, 15, 45, 'calmo', 'Terapia', 'TO trabalhou tolerância a texturas. Aceitou duas novas.'],
    [4, 8, 15, 'calmo', 'Casa', 'Vestiu o uniforme sozinho, na ordem de sempre.'],
    [3, 19, 30, 'feliz', 'Casa', 'Melhor dia da semana. Nenhum registro de alerta.'],
    [2, 12, 40, 'calmo', 'Escola', 'Almoço tranquilo. A professora avisou da troca de sala antes.'],
  ];
  good.forEach(([fromEnd, hh, mm, mood, location, notes]) => {
    const onSite = location === 'Escola' || location === 'Terapia';
    add(dayAt(fromEnd, { weekday: onSite }), hh, mm, {
      mood,
      crisisOccurred: false,
      location,
      notes,
      decibels: location === 'Escola' ? 58 : 45,
      lightLevel: 'Média',
      loggedBy: location === 'Escola' ? 'school' : location === 'Terapia' ? 'therapist' : 'parent',
    });
  });

  // --- Registros da escola: o canal que o app abre -------------------------
  add(dayAt(20, { weekday: true }), 10, 30, {
    mood: 'calmo',
    crisisOccurred: false,
    location: 'Escola',
    loggedBy: 'school',
    schoolNoise: 'Médio',
    foodIntake: 'Comeu metade do lanche',
    notes: 'Manhã boa. Participou da roda de leitura sentado.',
  });
  add(dayAt(11, { weekday: true }), 10, 45, {
    mood: 'agitado',
    crisisOccurred: false,
    location: 'Escola',
    loggedBy: 'school',
    schoolNoise: 'Alto',
    foodIntake: 'Recusou o lanche',
    notes: 'Ensaio da apresentação no pátio. Ficou inquieto, mas não houve crise.',
  });

  return logs;
}

export function buildSimpleLogs(
  childId: string,
  entries: Array<[number, number, number, string, boolean, string, string]>
) {
  const dayAt = historyPicker();

  return entries.map(([fromEnd, hh, mm, mood, crisis, location, notes]) => {
    const ref = dayAt(fromEnd, { sameMonth: crisis, weekday: crisis });
    return {
    childId,
    timestamp: brtToUtc(ref.year, ref.monthIndex, ref.day, hh, mm),
    mood,
    crisisOccurred: crisis,
    location,
    notes,
    lightLevel: 'Média',
    loggedBy: 'parent',
    };
  });
}

export const BENTO_LOGS: Array<[number, number, number, string, boolean, string, string]> = [
  [18, 16, 30, 'feliz', false, 'Casa', 'Montou a fila de dinossauros inteira sem interrupção.'],
  [15, 17, 50, 'agitado', true, 'Casa', 'Luz branca da cozinha acesa. Tapou os olhos e chorou.'],
  [12, 10, 0, 'calmo', false, 'Parque', 'Manhã boa no parque, sem gente demais.'],
  [9, 15, 40, 'feliz', false, 'Terapia', 'Sessão de ABA produtiva. Trocou dois pedidos por fala.'],
  [6, 19, 20, 'calmo', false, 'Casa', 'Jantou bem. Aceitou o feijão pela primeira vez em semanas.'],
  [4, 17, 45, 'triste', false, 'Casa', 'Cansaço do dia. Sem crise, só precisou de silêncio.'],
  [2, 16, 10, 'feliz', false, 'Casa', 'Dia leve.'],
];

export const NINA_LOGS: Array<[number, number, number, string, boolean, string, string]> = [
  [14, 12, 20, 'calmo', false, 'Casa', 'Almoçou com o prato de sempre.'],
  [11, 17, 30, 'agitado', true, 'Casa', 'Banho: a água estava mais quente que o normal.'],
  [8, 10, 0, 'feliz', false, 'Casa', 'Bolhas de sabão no quintal. Riu muito.'],
  [5, 18, 40, 'calmo', false, 'Casa', 'Jantar tranquilo.'],
  [3, 9, 30, 'feliz', false, 'Casa', 'Usou a prancha para pedir bolha, sem ajuda.'],
];

// ---------------------------------------------------------------------------
// Conteudo de apoio das criancas
// ---------------------------------------------------------------------------

export const TEO_BEHAVIORS = JSON.stringify([
  {
    id: 'sig-teo-1',
    signal: 'Balança o corpo sentado e para de responder',
    meaning: 'Está sobrecarregado. Quase sempre é barulho ou gente demais.',
    intervention: 'Levar para o canto calmo, oferecer o abafador e ficar 5 minutos sem falar com ele.',
  },
  {
    id: 'sig-teo-2',
    signal: 'Repete a mesma pergunta várias vezes seguidas',
    meaning: 'Ficou inseguro sobre o que vem depois.',
    intervention: 'Mostrar a rotina na tela e apontar a próxima tarefa. Responder uma vez, com a mesma frase.',
  },
  {
    id: 'sig-teo-3',
    signal: 'Anda na ponta dos pés pela casa',
    meaning: 'Está buscando estímulo — normalmente antes de uma crise.',
    intervention: 'Propor pressão profunda: apertar o travesseiro, empurrar a parede, carregar algo pesado.',
  },
  {
    id: 'sig-teo-4',
    signal: 'Cobre um ouvido só',
    meaning: 'Começo de incômodo sonoro. Ainda dá tempo de evitar a crise.',
    intervention: 'Reduzir a fonte do som ou sair do ambiente agora, sem esperar piorar.',
  },
]);

export const TEO_AAC = JSON.stringify([
  { id: 'aac-teo-1', text: 'Quero sair daqui 🚪', speech: 'Quero sair daqui', mood: 'agitado', alert: true },
  { id: 'aac-teo-2', text: 'Está muito alto 🔊', speech: 'Está muito alto', mood: 'agitado', alert: true },
  { id: 'aac-teo-3', text: 'Preciso de pausa ⏸️', speech: 'Preciso de uma pausa', mood: 'calmo', alert: false },
  { id: 'aac-teo-4', text: 'Quero água 💧', speech: 'Quero água', mood: 'calmo', alert: false },
  { id: 'aac-teo-5', text: 'Quero ver metrô 🚇', speech: 'Quero ver metrô', mood: 'calmo', alert: false },
  { id: 'aac-teo-6', text: 'Estou com fome 🍎', speech: 'Estou com fome', mood: 'calmo', alert: false },
]);

export const TEO_STORIES = JSON.stringify([
  {
    id: 'story-teo-1',
    title: 'A viagem de metrô do Téo',
    desc: 'História social para preparar o passeio de sábado.',
    steps: [
      { text: 'Hoje o Téo vai andar de metrô. Ele já sabe qual linha vai pegar: a azul.', img: '🚇' },
      { text: 'Na estação tem muita gente e o som é alto. O Téo leva o abafador na mochila.', img: '🎧' },
      { text: 'Se ficar alto demais, o Téo pode falar: "Está muito alto". Aí a gente para um pouco.', img: '🔊' },
      { text: 'O trem chega, as portas abrem e o Téo entra segurando a mão do pai.', img: '🚉' },
      { text: 'Depois de três estações, a gente desce e volta para casa. O Téo conseguiu!', img: '🎉' },
    ],
  },
  {
    id: 'story-teo-2',
    title: 'O dia em que a professora falta',
    desc: 'Para o dia em que a rotina da escola muda sem aviso.',
    steps: [
      { text: 'Às vezes a professora do Téo falta. Nesse dia, quem entra é outra professora.', img: '🏫' },
      { text: 'O Téo pode estranhar. Estranhar é normal e passa.', img: '🤔' },
      { text: 'A sala é a mesma, a cadeira é a mesma e a mochila é a mesma.', img: '🎒' },
      { text: 'Se o Téo precisar, ele pode ir para a sala de leitura por alguns minutos.', img: '📖' },
      { text: 'No fim do dia, a mãe busca o Téo no mesmo lugar de sempre.', img: '🚗' },
    ],
  },
]);

export const BENTO_BEHAVIORS = JSON.stringify([
  {
    id: 'sig-bento-1',
    signal: 'Alinha os dinossauros em fila e não deixa ninguém encostar',
    meaning: 'Está se organizando. Não é birra.',
    intervention: 'Deixar terminar. Avisar 5 minutos antes de precisar guardar.',
  },
  {
    id: 'sig-bento-2',
    signal: 'Tapa os olhos com o braço',
    meaning: 'Luz forte demais, principalmente lâmpada branca.',
    intervention: 'Baixar a luz ou mudar de ambiente.',
  },
]);

export const NINA_BEHAVIORS = JSON.stringify([
  {
    id: 'sig-nina-1',
    signal: 'Aperta as mãos e sorri sem olhar',
    meaning: 'Está feliz e animada.',
    intervention: 'Nada a fazer. É alegria, não desregulação.',
  },
  {
    id: 'sig-nina-2',
    signal: 'Empurra o prato para longe',
    meaning: 'A textura do alimento incomodou.',
    intervention: 'Não insistir. Oferecer o alimento seguro e tentar o novo em outro dia.',
  },
]);

export const NINA_AAC = JSON.stringify([
  { id: 'aac-nina-1', text: 'Quero colo 🤗', speech: 'Quero colo', mood: 'calmo', alert: false },
  { id: 'aac-nina-2', text: 'Acabou 🚫', speech: 'Acabou', mood: 'calmo', alert: false },
  { id: 'aac-nina-3', text: 'Quero bolha 🫧', speech: 'Quero bolha', mood: 'calmo', alert: false },
  { id: 'aac-nina-4', text: 'Dói 😣', speech: 'Dói', mood: 'agitado', alert: true },
]);

// ---------------------------------------------------------------------------
// Checkpoints (a conversa entre a casa e o consultorio)
// ---------------------------------------------------------------------------

const isoAgo = (days: number) =>
  new Date(brtNow().getTime() - days * 86400000).toISOString().split('T')[0];

export function buildTeoCheckpoints(childId: string) {
  return [
    {
      childId,
      weekNum: 1,
      status: 'completed',
      date: isoAgo(21),
      professionalName: 'Marina A.',
      professionalRole: 'Terapeuta Ocupacional',
      notes: 'Semana difícil no recreio. Duas saídas antes do sinal, as duas por barulho. Em casa, tudo bem.',
      feedback:
        'O padrão é sonoro, não comportamental. Manter o abafador acessível na mochila e combinar com a escola a saída antecipada do pátio. Não tratar como recusa escolar.',
    },
    {
      childId,
      weekNum: 2,
      status: 'completed',
      date: isoAgo(14),
      professionalName: 'Marina A.',
      professionalRole: 'Terapeuta Ocupacional',
      notes: 'Com o abafador liberado, nenhuma saída no recreio. A crise da semana foi na lição de casa, quando passou de meia hora.',
      feedback:
        'Excelente resposta ao ajuste sonoro. Agora limitar a lição a 25 minutos com pausa no meio — o registro mostra que a crise aparece depois desse tempo, não pela dificuldade da tarefa.',
    },
    {
      childId,
      weekNum: 3,
      status: 'completed',
      date: isoAgo(7),
      professionalName: 'Marina A.',
      professionalRole: 'Terapeuta Ocupacional',
      notes: 'Lição com pausa funcionou: sem crise nenhuma nessa atividade. A crise da semana foi no banho, quando o chamamos sem o aviso de 5 minutos.',
      feedback:
        'Confirma que a transição é o ponto, não a atividade. Usar o aviso visual de 5 minutos em toda troca de atividade, inclusive nas que parecem óbvias. Manter por mais duas semanas antes de reduzir.',
    },
    {
      childId,
      weekNum: 4,
      status: 'pending',
      date: '',
      professionalName: '',
      professionalRole: 'Terapeuta Ocupacional',
      notes: '',
      feedback: '',
    },
  ];
}

export function buildSimpleCheckpoints(
  childId: string,
  role: string,
  done: { daysAgo: number; name: string; notes: string; feedback: string }[]
) {
  return Array.from({ length: 4 }).map((_, i) => {
    const filled = done[i];
    return {
      childId,
      weekNum: i + 1,
      status: filled ? 'completed' : 'pending',
      date: filled ? isoAgo(filled.daysAgo) : '',
      professionalName: filled?.name || '',
      professionalRole: role,
      notes: filled?.notes || '',
      feedback: filled?.feedback || '',
    };
  });
}

export const BENTO_CHECKPOINTS = [
  {
    daysAgo: 10,
    name: 'Rafael S.',
    notes: 'A luz da cozinha continua sendo o gatilho. Trocamos a lâmpada por uma amarela.',
    feedback:
      'Boa intervenção. Registrar por duas semanas para confirmar que a troca resolveu antes de mexer em outra coisa.',
  },
];

export const NINA_CHECKPOINTS = [
  {
    daysAgo: 5,
    name: 'Camila R.',
    notes: 'Começou a usar a prancha sozinha para pedir bolha.',
    feedback:
      'Ótimo sinal. Ampliar o vocabulário da prancha para 6 itens, mantendo os 4 atuais nas mesmas posições.',
  },
];
