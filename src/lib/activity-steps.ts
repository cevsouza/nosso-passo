// Passo a passo das atividades — analise de tarefa (task analysis).
//
// A ideia (da esposa do autor): a crianca nao so reconhece a atividade no
// pictograma, ela APRENDE a fazer, um passo pequeno e previsivel por vez —
// escovar os dentes, tomar banho, lavar as maos. E das praticas mais
// estabelecidas na terapia, e serve ao proposito do app: independencia.
//
// Este modulo e a BIBLIOTECA PRONTA: o pai ganha os passos das atividades
// comuns de graca, sem escrever nada. Passos customizados do pai (quando
// existirem) tem prioridade sobre a biblioteca — ver quem consome isto.
//
// Casamento pelo TEXTO da atividade, por INICIO DE PALAVRA (mesma filosofia do
// pictograma): "Escovar os dentes" casa por "dente"; "banho" nao casa
// "banheiro" (palavras diferentes). A ordem importa: o mais especifico vence.

export type Locale = 'pt' | 'en' | 'es';

export interface ActivityStep {
  emoji: string;
  pt: string;
  en: string;
  es: string;
}

interface StepEntry {
  // Radicais/palavras que disparam este conjunto (inicio de palavra, sem acento).
  match: string[];
  steps: ActivityStep[];
}

// Normaliza para casar sem depender de acento/caixa.
const norm = (s: string) =>
  (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

// A ordem e proposital: entradas mais especificas primeiro.
const LIBRARY: StepEntry[] = [
  {
    // banheiro ANTES de banho: "banheiro" nao pode cair em "banho".
    match: ['banheiro', 'vaso', 'privada', 'xixi', 'coco', 'penico'],
    steps: [
      { emoji: '🚪', pt: 'Vá até o banheiro', en: 'Go to the bathroom', es: 'Ve al baño' },
      { emoji: '👖', pt: 'Abaixe a roupa', en: 'Pull your pants down', es: 'Bájate la ropa' },
      { emoji: '🚽', pt: 'Sente no vaso', en: 'Sit on the toilet', es: 'Siéntate en el inodoro' },
      { emoji: '🧻', pt: 'Use o papel', en: 'Use the paper', es: 'Usa el papel' },
      { emoji: '💧', pt: 'Dê a descarga', en: 'Flush', es: 'Tira de la cadena' },
      { emoji: '🧼', pt: 'Lave as mãos', en: 'Wash your hands', es: 'Lávate las manos' },
    ],
  },
  {
    match: ['dente', 'escovar os dente', 'escovacao'],
    steps: [
      { emoji: '💧', pt: 'Molhe a escova', en: 'Wet the toothbrush', es: 'Moja el cepillo' },
      { emoji: '🪥', pt: 'Ponha um pouco de pasta', en: 'Put a little toothpaste', es: 'Pon un poco de pasta' },
      { emoji: '⬆️', pt: 'Escove os dentes de cima', en: 'Brush the top teeth', es: 'Cepilla los dientes de arriba' },
      { emoji: '⬇️', pt: 'Escove os de baixo', en: 'Brush the bottom teeth', es: 'Cepilla los de abajo' },
      { emoji: '😛', pt: 'Cuspa na pia', en: 'Spit in the sink', es: 'Escupe en el lavabo' },
      { emoji: '🥤', pt: 'Enxágue a boca', en: 'Rinse your mouth', es: 'Enjuaga la boca' },
    ],
  },
  {
    match: ['banho', 'tomar banho', 'chuveiro'],
    steps: [
      { emoji: '👕', pt: 'Tire a roupa', en: 'Take off your clothes', es: 'Quítate la ropa' },
      { emoji: '🚿', pt: 'Ligue o chuveiro morno', en: 'Turn on warm water', es: 'Abre el agua tibia' },
      { emoji: '💧', pt: 'Molhe o corpo todo', en: 'Wet your whole body', es: 'Mójate todo el cuerpo' },
      { emoji: '🧼', pt: 'Passe sabonete', en: 'Use soap', es: 'Pásate el jabón' },
      { emoji: '🚿', pt: 'Enxágue bem', en: 'Rinse well', es: 'Enjuágate bien' },
      { emoji: '🧺', pt: 'Seque com a toalha', en: 'Dry with the towel', es: 'Sécate con la toalla' },
    ],
  },
  {
    match: ['lavar as mao', 'lavar mao', 'maos', 'mao'],
    steps: [
      { emoji: '🚰', pt: 'Abra a torneira', en: 'Turn on the tap', es: 'Abre el grifo' },
      { emoji: '💧', pt: 'Molhe as mãos', en: 'Wet your hands', es: 'Mójate las manos' },
      { emoji: '🧼', pt: 'Passe sabonete', en: 'Use soap', es: 'Usa jabón' },
      { emoji: '🤲', pt: 'Esfregue bem', en: 'Rub them well', es: 'Frótalas bien' },
      { emoji: '💧', pt: 'Enxágue', en: 'Rinse', es: 'Enjuaga' },
      { emoji: '🧻', pt: 'Seque as mãos', en: 'Dry your hands', es: 'Sécate las manos' },
    ],
  },
  {
    match: ['vestir', 'roupa', 'uniforme', 'trocar de roupa'],
    steps: [
      { emoji: '🩲', pt: 'Vista a roupa de baixo', en: 'Put on underwear', es: 'Ponte la ropa interior' },
      { emoji: '👕', pt: 'Vista a camiseta', en: 'Put on the shirt', es: 'Ponte la camiseta' },
      { emoji: '👖', pt: 'Vista a calça', en: 'Put on the pants', es: 'Ponte el pantalón' },
      { emoji: '🧦', pt: 'Ponha as meias', en: 'Put on your socks', es: 'Ponte los calcetines' },
    ],
  },
  {
    match: ['sapato', 'calcar', 'tenis', 'calcado'],
    steps: [
      { emoji: '👟', pt: 'Abra o sapato', en: 'Open the shoe', es: 'Abre el zapato' },
      { emoji: '🦶', pt: 'Ponha o pé dentro', en: 'Put your foot in', es: 'Mete el pie' },
      { emoji: '🤙', pt: 'Ajeite o calcanhar', en: 'Fix the heel', es: 'Acomoda el talón' },
      { emoji: '🎀', pt: 'Feche ou amarre', en: 'Close or tie it', es: 'Ciérralo o átalo' },
    ],
  },
  {
    match: ['cabelo', 'pentear', 'escovar o cabelo'],
    steps: [
      { emoji: '🪮', pt: 'Pegue a escova', en: 'Get the brush', es: 'Toma el cepillo' },
      { emoji: '💇', pt: 'Penteie de cima para baixo', en: 'Brush top to bottom', es: 'Peina de arriba abajo' },
      { emoji: '✨', pt: 'Ajeite o cabelo', en: 'Fix your hair', es: 'Acomoda el cabello' },
    ],
  },
  {
    match: ['refeicao', 'almoc', 'jantar', 'comer', 'cafe da manha', 'lanche'],
    steps: [
      { emoji: '🪑', pt: 'Sente à mesa', en: 'Sit at the table', es: 'Siéntate a la mesa' },
      { emoji: '🍴', pt: 'Pegue os talheres', en: 'Pick up your cutlery', es: 'Toma los cubiertos' },
      { emoji: '🍽️', pt: 'Coma devagar', en: 'Eat slowly', es: 'Come despacio' },
      { emoji: '🧻', pt: 'Limpe a boca', en: 'Wipe your mouth', es: 'Límpiate la boca' },
    ],
  },
  {
    match: ['dormir', 'deitar', 'cama', 'hora de dormir', 'sono'],
    steps: [
      { emoji: '👚', pt: 'Vista o pijama', en: 'Put on pajamas', es: 'Ponte el pijama' },
      { emoji: '🪥', pt: 'Escove os dentes', en: 'Brush your teeth', es: 'Cepíllate los dientes' },
      { emoji: '💡', pt: 'Apague a luz', en: 'Turn off the light', es: 'Apaga la luz' },
      { emoji: '😴', pt: 'Deite e feche os olhos', en: 'Lie down and close your eyes', es: 'Acuéstate y cierra los ojos' },
    ],
  },
];

/**
 * Passos da biblioteca para uma atividade, pelo titulo. Retorna null quando
 * nao ha correspondencia (a maioria das atividades nao tem passo-a-passo, e
 * tudo bem — so as AVDs comuns tem).
 */
export function stepsForActivity(title: string): ActivityStep[] | null {
  const words = norm(title).split(/[^a-z0-9]+/).filter(Boolean);
  if (words.length === 0) return null;
  for (const entry of LIBRARY) {
    for (const kw of entry.match) {
      const k = norm(kw);
      // Casa por inicio de palavra: cada termo do radical bate no comeco de
      // alguma palavra do titulo, em sequencia para radicais de varias palavras.
      const parts = k.split(' ');
      if (parts.length === 1) {
        if (words.some((w) => w.startsWith(k))) return entry.steps;
      } else {
        // radical multi-palavra: procura a sequencia comecando em cada posicao.
        for (let i = 0; i + parts.length <= words.length; i++) {
          if (parts.every((p, j) => words[i + j].startsWith(p))) return entry.steps;
        }
      }
    }
  }
  return null;
}

export function stepText(step: ActivityStep, locale: string): string {
  return locale === 'en' ? step.en : locale === 'es' ? step.es : step.pt;
}
