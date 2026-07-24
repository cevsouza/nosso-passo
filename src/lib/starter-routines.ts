// Rotinas prontas — "os dez minutos prometidos".
//
// A promessa da landing e montar a rotina de hoje em dez minutos. Ate agora a
// familia chegava numa tela vazia, que e onde ela desiste. Aqui ela apaga o que
// nao serve em vez de criar do zero.
//
// Uma decisao de produto esta embutida no formato: os blocos sao POR MOMENTO DO
// DIA, nunca um dia inteiro e nunca um mes. O erro mais comum de quem comeca e
// montar tudo no dia 1 e abandonar no dia 3 — entao o produto so oferece um
// pedaco de cada vez. Nao e limitacao tecnica, e a recomendacao virando forma.

export type StarterLocale = 'pt' | 'en' | 'es';

export interface StarterTask {
  title: Record<StarterLocale, string>;
  icon: string;
  time: string;                       // HH:MM
  period: 'manhã' | 'tarde' | 'noite';
  category: 'AVD' | 'Aprendizado' | 'Lazer';
  duration: number;                   // minutos
}

export interface StarterBlock {
  id: 'manha' | 'tarde' | 'noite';
  label: Record<StarterLocale, string>;
  hint: Record<StarterLocale, string>;
  icon: string;
  tasks: StarterTask[];
}

export const STARTER_BLOCKS: StarterBlock[] = [
  {
    id: 'manha',
    icon: '🌅',
    label: { pt: 'Manhã', en: 'Morning', es: 'Mañana' },
    hint: {
      pt: 'Acordar, se arrumar e sair de casa sem correria.',
      en: 'Waking up, getting ready and leaving without a rush.',
      es: 'Despertar, prepararse y salir sin prisa.',
    },
    tasks: [
      {
        title: { pt: 'Acordar', en: 'Wake up', es: 'Despertar' },
        icon: '☀️', time: '07:00', period: 'manhã', category: 'AVD', duration: 10,
      },
      {
        title: { pt: 'Ir ao banheiro', en: 'Bathroom', es: 'Ir al baño' },
        icon: '🚽', time: '07:10', period: 'manhã', category: 'AVD', duration: 10,
      },
      {
        title: { pt: 'Escovar os dentes', en: 'Brush teeth', es: 'Cepillarse los dientes' },
        icon: '🪥', time: '07:20', period: 'manhã', category: 'AVD', duration: 5,
      },
      {
        title: { pt: 'Vestir a roupa', en: 'Get dressed', es: 'Vestirse' },
        icon: '👕', time: '07:30', period: 'manhã', category: 'AVD', duration: 10,
      },
      {
        title: { pt: 'Café da manhã', en: 'Breakfast', es: 'Desayuno' },
        icon: '🥣', time: '07:45', period: 'manhã', category: 'AVD', duration: 20,
      },
      {
        title: { pt: 'Pegar a mochila e sair', en: 'Grab the bag and go', es: 'Tomar la mochila y salir' },
        icon: '🎒', time: '08:10', period: 'manhã', category: 'AVD', duration: 10,
      },
    ],
  },
  {
    id: 'tarde',
    icon: '🏫',
    label: { pt: 'Escola e tarde', en: 'School and afternoon', es: 'Escuela y tarde' },
    hint: {
      pt: 'A volta para casa, o descanso e a terapia — a parte do dia que mais desanda.',
      en: 'Coming home, resting and therapy — the part of the day that unravels most.',
      es: 'La vuelta a casa, el descanso y la terapia — la parte del día que más se desarma.',
    },
    tasks: [
      {
        title: { pt: 'Voltar para casa', en: 'Come home', es: 'Volver a casa' },
        icon: '🏠', time: '12:00', period: 'tarde', category: 'AVD', duration: 15,
      },
      {
        title: { pt: 'Almoço', en: 'Lunch', es: 'Almuerzo' },
        icon: '🍲', time: '12:30', period: 'tarde', category: 'AVD', duration: 30,
      },
      {
        title: { pt: 'Momento de descanso', en: 'Rest time', es: 'Momento de descanso' },
        icon: '🛋️', time: '13:15', period: 'tarde', category: 'Lazer', duration: 30,
      },
      {
        title: { pt: 'Terapia', en: 'Therapy', es: 'Terapia' },
        icon: '🧩', time: '15:00', period: 'tarde', category: 'Aprendizado', duration: 50,
      },
      {
        title: { pt: 'Lanche da tarde', en: 'Afternoon snack', es: 'Merienda' },
        icon: '🍎', time: '16:30', period: 'tarde', category: 'AVD', duration: 20,
      },
      {
        title: { pt: 'Brincar livre', en: 'Free play', es: 'Juego libre' },
        icon: '🧸', time: '17:00', period: 'tarde', category: 'Lazer', duration: 40,
      },
    ],
  },
  {
    id: 'noite',
    icon: '🌙',
    label: { pt: 'Noite', en: 'Evening', es: 'Noche' },
    hint: {
      pt: 'A descida do dia: jantar, banho e sono na mesma ordem, sempre.',
      en: 'Winding down: dinner, bath and sleep in the same order, always.',
      es: 'El cierre del día: cena, baño y sueño en el mismo orden, siempre.',
    },
    tasks: [
      {
        title: { pt: 'Jantar', en: 'Dinner', es: 'Cena' },
        icon: '🍽️', time: '19:00', period: 'noite', category: 'AVD', duration: 30,
      },
      {
        title: { pt: 'Banho', en: 'Bath', es: 'Baño' },
        icon: '🛁', time: '19:45', period: 'noite', category: 'AVD', duration: 20,
      },
      {
        title: { pt: 'Vestir o pijama', en: 'Put on pyjamas', es: 'Ponerse el pijama' },
        icon: '🩳', time: '20:10', period: 'noite', category: 'AVD', duration: 10,
      },
      {
        title: { pt: 'Escovar os dentes', en: 'Brush teeth', es: 'Cepillarse los dientes' },
        icon: '🪥', time: '20:25', period: 'noite', category: 'AVD', duration: 5,
      },
      {
        title: { pt: 'História antes de dormir', en: 'Bedtime story', es: 'Cuento antes de dormir' },
        icon: '📖', time: '20:35', period: 'noite', category: 'Lazer', duration: 15,
      },
      {
        title: { pt: 'Apagar a luz', en: 'Lights out', es: 'Apagar la luz' },
        icon: '🌙', time: '21:00', period: 'noite', category: 'AVD', duration: 5,
      },
    ],
  },
];

export function starterLocale(locale: string | undefined): StarterLocale {
  return locale === 'en' ? 'en' : locale === 'es' ? 'es' : 'pt';
}

/** Converte um bloco nas tarefas que a API espera, ja no dia escolhido. */
export function blockToTasks(
  block: StarterBlock,
  day: string,
  locale: string | undefined
) {
  const lang = starterLocale(locale);
  return block.tasks.map((t, i) => ({
    title: t.title[lang],
    time: t.time,
    period: t.period,
    day,
    icon: t.icon,
    category: t.category,
    duration: t.duration,
    description: '',
    order: i + 1,
  }));
}
