"use client";
import React from 'react';

// ---------------------------------------------------------------------------
// Pictogramas de atividade — padrao PECS/ARASAAC
// ---------------------------------------------------------------------------
//
// Substitui as cenas antigas, que eram construidas EM VOLTA de um mascote
// (o cachorro na banheira, o cachorro comendo). Sem o mascote, sobrava uma
// banheira vazia — cenario sem personagem, que nao diz nada.
//
// A escolha aqui e outra, e e a que a terapia ja usa: **um objeto, literal,
// no centro**. Traco grosso, cor chapada, sem gradiente, sem sombra, sem
// animacao. E a mesma convencao dos cartoes que a crianca ve na sessao e na
// geladeira — reconhecimento em vez de interpretacao.
//
// Regras que valem para TODOS os desenhos:
//   · viewBox 0 0 200 200, objeto ocupando o miolo (~40..160)
//   · contorno INK, 5px, junta e ponta arredondadas
//   · no maximo 3 cores de preenchimento por desenho
//   · nada se move: pictograma parado e o ponto (calma visual e a cunha)
//
// O casamento e pelo TEXTO que o responsavel digitou, nao pela categoria:
// "Escovar os dentes" tem que virar escova, nao "Higiene".

const INK = '#3a3550';        // contorno — slate-700 da paleta calma
const PAPER = '#ffffff';

// Tons chapados, dessaturados o suficiente para nao competir com a tela.
const C = {
  teal: '#5cb3a8',
  tealDeep: '#2f8f86',
  sand: '#f0c88a',
  clay: '#e0956a',
  rose: '#e39ba0',
  sky: '#9cc4dd',
  leaf: '#8fbf87',
  butter: '#f5dd8f',
  lilac: '#b3a8d6',
  stone: '#d8d3e4',
};

export type PictoKey =
  | 'dentes' | 'banho' | 'maos' | 'banheiro'
  | 'acordar' | 'dormir' | 'descanso'
  | 'cafe' | 'refeicao' | 'lanche' | 'beber'
  | 'vestir' | 'sapato'
  | 'escola' | 'transporte' | 'mochila'
  | 'tarefa' | 'leitura'
  | 'fono' | 'ocupacional' | 'psicologia' | 'fisio' | 'psicopedagogia' | 'medico' | 'terapia'
  | 'remedio'
  | 'brincar' | 'parque' | 'tela' | 'musica' | 'esporte'
  | 'guardar' | 'generico';

// Casamento por INICIO DE PALAVRA, nunca por pedaco solto no meio.
//
// Nao e preciosismo: com `includes` cru, **"Brincar" casava com transporte**,
// porque "car" mora dentro de "brin-car-". A crianca via um onibus na hora de
// brincar. Inicio de palavra ainda deixa passar sufixo — "descans" pega
// "descanso" e "descansar", "psicolog" pega "psicologia" —, que e justamente o
// que se quer.
const startsWord = (text: string, word: string) =>
  text.startsWith(word) || text.includes(' ' + word);

/** Palavras curtas demais para tolerar sufixo: `aba` nao pode pegar "abacaxi". */
const wholeWord = (text: string, word: string) =>
  text.split(' ').includes(word);

/** Sem acento, sem emoji, minusculo — o texto vem digitado por gente. */
function normalize(s: string): string {
  return (s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

// Ordem IMPORTA: o primeiro que casar vence, e varias regras disputam o mesmo
// texto. As decisoes que a lista embute, todas tiradas de rotinas reais:
//   · "Ir para a escola" e ONIBUS, nao escola — o que acontece agora e o trajeto
//   · "Tarefa da escola" e CADERNO, nao escola → `tarefa` vem antes de `escola`
//   · "Aulas e Estudo" e ESCOLA → por isso `tarefa` nao carrega a palavra "estudo"
//   · "Descanso sem tela" e DESCANSO, nao tela
//   · "Sessao Musicoterapia" e NOTA MUSICAL, nao a peca generica de terapia
//
// E cada terapia tem desenho proprio. Fono, ABA, TO e Fisio sao salas, pessoas
// e experiencias diferentes; achatar tudo numa peca de quebra-cabeca apagaria
// exatamente a diferenca que a crianca precisa antecipar.
const RULES: { key: PictoKey; words: string[]; exact?: string[] }[] = [
  { key: 'dentes', words: ['dente', 'escovar os dente', 'escova de dente', 'brush teeth', 'toothbrush', 'diente', 'cepillar'] },
  { key: 'maos', words: ['lavar as mao', 'lavar mao', 'wash hand', 'lavar las mano', 'higienizar', 'alcool em gel'] },
  { key: 'banheiro', words: ['banheiro', 'toilet', 'penico', 'vaso sanitario', 'fazer xixi', 'xixi', 'coco', 'wc', 'bathroom'] },
  { key: 'banho', words: ['banho', 'chuveiro', 'shower', 'bath', 'ducha', 'bano', 'tomar banho'] },

  // leitura ANTES de dormir: "Historia antes de dormir" e o livro, nao a cama
  { key: 'leitura', words: ['leitura', 'livro', 'historia', 'story', 'bedtime story', 'cuento', 'conto', 'book'], exact: ['ler', 'leer', 'read'] },

  { key: 'acordar', words: ['acordar', 'levantar', 'wake', 'despertar', 'bom dia', 'good morning', 'abrir a cortina'] },
  { key: 'dormir', words: ['dormir', 'sleep', 'cama', 'bedtime', 'sueno', 'soneca', 'boa noite', 'apagar a luz', 'lights out'], exact: ['nap'] },
  { key: 'descanso', words: ['descans', 'relax', 'calma', 'pausa', 'sofa', 'sem tela', 'silencio'], exact: ['rest'] },

  { key: 'cafe', words: ['cafe da manha', 'breakfast', 'desayuno', 'cafe especial', 'lanche da manha'] },
  { key: 'lanche', words: ['lanche', 'snack', 'merienda', 'fruta', 'fruit'] },
  { key: 'beber', words: ['beber', 'agua', 'water', 'drink', 'suco', 'juice', 'hidrat'] },
  { key: 'refeicao', words: ['almoc', 'jantar', 'lunch', 'dinner', 'almuerzo', 'cena', 'refeicao', 'comer', 'meal', 'comida', 'janta'] },

  { key: 'sapato', words: ['sapato', 'calcar', 'tenis', 'shoe', 'zapato', 'meia'] },
  { key: 'vestir', words: ['vestir', 'roupa', 'uniforme', 'dress', 'clothes', 'ropa', 'pijama', 'pyjama', 'trocar de roupa'] },

  { key: 'mochila', words: ['mochila', 'backpack', 'material escolar', 'preparar a bolsa', 'pegar a mochila'] },
  { key: 'transporte', words: ['onibus', 'carro', 'metro', 'transporte', 'ir para a escola', 'ir pra escola', 'voltar para casa', 'ir para casa', 'ir pra casa', 'trajeto'], exact: ['bus', 'car', 'van'] },

  // As terapias, cada uma com a sua cara. Vem antes de escola/tarefa porque
  // "Sessao Psicopedagogia" nao e aula e "Terapia ocupacional" nao e tarefa.
  { key: 'musica', words: ['musicoterapia', 'musica', 'music', 'cantar', 'sing', 'cancao', 'violao', 'instrumento'] },
  { key: 'fono', words: ['fono', 'fonoaudiolog', 'speech', 'fala', 'linguagem', 'logopedia'] },
  { key: 'ocupacional', words: ['ocupacional', 'terapeuta ocupacional', 'integracao sensorial', 'sensorial'] },
  { key: 'fisio', words: ['fisio', 'fisioterapia', 'motora', 'physio', 'psicomotric', 'motricidade'] },
  { key: 'psicopedagogia', words: ['psicopedagog', 'pedagog', 'reforco escolar'] },
  { key: 'psicologia', words: ['psicolog', 'psicoterapia', 'analise do comportamento', 'comportamental'], exact: ['aba'] },
  { key: 'medico', words: ['medico', 'doctor', 'pediatra', 'neuro', 'dentista', 'consulta', 'exame', 'vacina'] },

  // sem 'estudo' de proposito: "Aulas e Estudo" e escola, nao dever de casa
  { key: 'tarefa', words: ['tarefa', 'licao', 'homework', 'dever de casa', 'deberes', 'estudar', 'study', 'escrever', 'caderno'] },
  { key: 'escola', words: ['escola', 'aula', 'school', 'class', 'escuela', 'clase', 'creche', 'professora', 'estudo'] },

  { key: 'terapia', words: ['terapia', 'therapy', 'sessao', 'atendimento'] },
  { key: 'remedio', words: ['remedio', 'medicament', 'medicine', 'medication', 'medicina', 'vitamina', 'comprimido'] },

  { key: 'esporte', words: ['natacao', 'nadar', 'swim', 'esporte', 'exercicio', 'bicicleta', 'correr', 'futebol', 'bola', 'sport', 'judo', 'caminhada', 'alongamento'] },
  { key: 'parque', words: ['parque', 'park', 'ar livre', 'outdoor', 'praca', 'playground', 'natureza', 'parquinho', 'quintal', 'passear', 'passeio', 'jardim'] },
  { key: 'tela', words: ['tablet', 'celular', 'tela', 'screen', 'video', 'desenho animado', 'youtube', 'televisao', 'computador'], exact: ['tv'] },
  { key: 'guardar', words: ['guardar', 'organizar', 'arrumar', 'tidy', 'clean up', 'ordenar', 'limpar', 'recolher'] },
  { key: 'brincar', words: ['brincar', 'brinquedo', 'play', 'jugar', 'juego', 'toy', 'lego', 'bloco', 'quebra cabeca', 'puzzle', 'massinha', 'desenhar', 'pintar', 'draw', 'tempo livre', 'free time', 'tiempo libre', 'dinossauro'] },
];

/** Qual pictograma o texto da atividade pede. Nunca falha: cai em 'generico'. */
export function pictogramFor(title: string): PictoKey {
  const t = normalize(title);
  if (!t) return 'generico';
  for (const rule of RULES) {
    if (rule.words.some((w) => startsWord(t, w))) return rule.key;
    if (rule.exact?.some((w) => wholeWord(t, w))) return rule.key;
  }
  return 'generico';
}

/** true quando o desenho veio do texto, e nao do fallback. */
export function hasPictogram(title: string): boolean {
  return pictogramFor(title) !== 'generico';
}

// --- primitivas de desenho -------------------------------------------------

const s = {
  fill: 'none',
  stroke: INK,
  strokeWidth: 5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};
/** Forma preenchida com contorno — o par que define o padrao. */
const f = (fill: string) => ({ ...s, fill });

// --- os desenhos -----------------------------------------------------------

const SHAPES: Record<PictoKey, { tint: string; art: React.ReactNode }> = {
  dentes: {
    tint: C.sky,
    art: (
      <g>
        {/* cabo */}
        <path d="M112 150 L150 60" {...f(PAPER)} />
        <path d="M104 146 L142 56 L156 62 L118 152 Z" {...f(PAPER)} />
        {/* cerdas */}
        <path d="M96 152 L110 122 L136 134 L122 164 Z" {...f(C.teal)} />
        <path d="M100 143 L128 156 M107 130 L133 143" {...s} strokeWidth={4} />
        {/* pasta */}
        <path d="M60 96 C50 84 62 68 76 74 C86 62 104 70 100 86" {...f(C.rose)} />
      </g>
    ),
  },

  banho: {
    tint: C.sky,
    art: (
      <g>
        {/* chuveiro */}
        <path d="M148 40 L148 66" {...s} />
        <path d="M120 66 L176 66 L166 84 L130 84 Z" {...f(C.stone)} />
        {/* gotas */}
        <path d="M136 100 L136 116 M148 96 L148 118 M160 100 L160 114" {...s} strokeWidth={6} stroke={C.teal} />
        {/* banheira */}
        <path d="M34 124 L166 124 L156 166 L44 166 Z" {...f(PAPER)} />
        <path d="M28 124 L172 124" {...s} strokeWidth={7} />
        <path d="M50 140 C70 132 92 148 112 140 C130 133 146 143 152 140" {...s} strokeWidth={4} stroke={C.teal} />
      </g>
    ),
  },

  maos: {
    tint: C.teal,
    art: (
      // Duas maos abertas com espuma em cima. Nada de torneira: no primeiro
      // desenho ela lia como um martelo atravessado nas maos, e um pictograma
      // que precisa ser decifrado ja falhou.
      <g>
        <g transform="translate(2,30) scale(0.7)" strokeWidth={7}>
          <path d="M52 168 L52 116 C52 106 66 106 66 116 L66 96 C66 86 80 86 80 96 L80 112 C80 100 94 100 94 112 L94 122 C94 106 108 108 108 120 L108 150 C108 164 96 172 84 172 Z" {...f(C.sand)} strokeWidth={7} />
        </g>
        <g transform="translate(198,30) scale(-0.7,0.7)" strokeWidth={7}>
          <path d="M52 168 L52 116 C52 106 66 106 66 116 L66 96 C66 86 80 86 80 96 L80 112 C80 100 94 100 94 112 L94 122 C94 106 108 108 108 120 L108 150 C108 164 96 172 84 172 Z" {...f(C.sand)} strokeWidth={7} />
        </g>
        {/* espuma */}
        <circle cx="100" cy="60" r="22" {...f(PAPER)} />
        <circle cx="64" cy="40" r="13" {...f(PAPER)} />
        <circle cx="134" cy="44" r="11" {...f(PAPER)} />
      </g>
    ),
  },

  banheiro: {
    tint: C.sky,
    art: (
      <g>
        {/* caixa */}
        <path d="M120 42 L164 42 L164 86 L120 86 Z" {...f(C.stone)} />
        {/* vaso */}
        <path d="M56 86 L134 86 L124 132 L70 132 Z" {...f(PAPER)} />
        <ellipse cx="97" cy="86" rx="42" ry="12" {...f(PAPER)} />
        <ellipse cx="97" cy="86" rx="24" ry="6" {...f(C.sky)} />
        <path d="M82 132 L82 158 L112 158 L112 132" {...f(PAPER)} />
        <path d="M62 158 L132 158" {...s} strokeWidth={7} />
      </g>
    ),
  },

  acordar: {
    tint: C.butter,
    art: (
      <g>
        {/* raios */}
        <path d="M100 30 L100 46 M52 50 L63 61 M148 50 L137 61 M32 100 L48 100 M168 100 L152 100" {...s} strokeWidth={6} />
        {/* sol */}
        <circle cx="100" cy="100" r="34" {...f(C.butter)} />
        {/* horizonte */}
        <path d="M28 148 L172 148" {...s} strokeWidth={7} />
        <path d="M52 148 C52 130 148 130 148 148" {...f(C.clay)} />
      </g>
    ),
  },

  dormir: {
    tint: C.lilac,
    art: (
      <g>
        {/* lua */}
        <path d="M150 38 C128 44 122 72 140 84 C124 92 100 80 100 60 C100 42 122 32 150 38 Z" {...f(C.butter)} />
        {/* cama */}
        <path d="M30 152 L30 112 L170 112 L170 152" {...f(PAPER)} />
        <path d="M30 130 L170 130" {...s} />
        <path d="M46 112 L46 92 L96 92 L96 112" {...f(C.rose)} />
        <path d="M24 152 L176 152" {...s} strokeWidth={7} />
        <path d="M30 152 L30 166 M170 152 L170 166" {...s} strokeWidth={6} />
      </g>
    ),
  },

  descanso: {
    tint: C.teal,
    art: (
      <g>
        {/* poltrona */}
        <path d="M46 96 C46 76 58 68 68 68 C78 68 84 78 84 92 L84 120 L46 120 Z" {...f(C.teal)} />
        <path d="M116 92 C116 78 122 68 132 68 C142 68 154 76 154 96 L154 120 L116 120 Z" {...f(C.teal)} />
        <path d="M44 116 L156 116 L156 150 L44 150 Z" {...f(C.tealDeep)} />
        <path d="M56 150 L56 166 M144 150 L144 166" {...s} strokeWidth={6} />
        {/* almofada */}
        <path d="M84 84 L116 84 L116 116 L84 116 Z" {...f(PAPER)} />
      </g>
    ),
  },

  cafe: {
    tint: C.sand,
    art: (
      <g>
        {/* caneca */}
        <path d="M44 84 L120 84 L112 148 L52 148 Z" {...f(PAPER)} />
        <path d="M120 96 C144 96 144 128 118 128" {...s} />
        <path d="M50 104 L114 104" {...s} strokeWidth={4} stroke={C.clay} />
        {/* pao */}
        <path d="M126 122 L176 122 L176 156 L126 156 Z" {...f(C.sand)} />
        <path d="M126 122 C126 106 176 106 176 122" {...f(C.sand)} />
      </g>
    ),
  },

  refeicao: {
    tint: C.clay,
    art: (
      <g>
        {/* prato */}
        <circle cx="100" cy="106" r="48" {...f(PAPER)} />
        <circle cx="100" cy="106" r="28" {...f(C.sand)} />
        {/* garfo — dentes cheios, para nao sumir em 64px */}
        <path d="M22 44 L22 78 C22 92 44 92 44 78 L44 44" {...f(C.stone)} />
        <path d="M33 44 L33 74" {...s} strokeWidth={4} />
        <path d="M33 88 L33 162" {...f(C.stone)} strokeWidth={11} />
        {/* faca */}
        <path d="M156 42 C176 60 176 90 166 100 L156 100 Z" {...f(C.stone)} />
        <path d="M161 100 L161 162" {...f(C.stone)} strokeWidth={11} />
      </g>
    ),
  },

  lanche: {
    tint: C.rose,
    art: (
      <g>
        {/* maca */}
        <path d="M100 68 C82 54 48 66 48 100 C48 134 74 162 100 148 C126 162 152 134 152 100 C152 66 118 54 100 68 Z" {...f(C.rose)} />
        <path d="M100 68 L100 44" {...s} strokeWidth={6} />
        <path d="M100 52 C116 34 140 40 136 56 C132 70 112 68 100 52 Z" {...f(C.leaf)} />
      </g>
    ),
  },

  beber: {
    tint: C.sky,
    art: (
      <g>
        <path d="M58 56 L142 56 L128 160 L72 160 Z" {...f(PAPER)} />
        <path d="M66 96 L134 96 L128 160 L72 160 Z" {...f(C.sky)} />
        {/* canudo */}
        <path d="M118 46 L146 40" {...s} strokeWidth={7} stroke={C.clay} />
      </g>
    ),
  },

  vestir: {
    tint: C.lilac,
    art: (
      <g>
        <path d="M74 46 L126 46 L166 74 L146 100 L132 90 L132 158 L68 158 L68 90 L54 100 L34 74 Z" {...f(C.lilac)} />
        <path d="M78 46 C82 64 118 64 122 46" {...f(PAPER)} />
      </g>
    ),
  },

  sapato: {
    tint: C.clay,
    art: (
      <g>
        <path d="M34 142 L34 96 L70 96 L96 116 L150 124 C168 128 170 142 168 150 L34 150 Z" {...f(C.clay)} />
        <path d="M28 150 L174 150 L174 162 L28 162 Z" {...f(INK)} stroke="none" />
        <path d="M46 100 L60 118 M62 98 L76 116" {...s} strokeWidth={4} stroke={PAPER} />
      </g>
    ),
  },

  escola: {
    tint: C.clay,
    art: (
      <g>
        {/* mastro com bandeira: e o que separa "escola" de "casa" */}
        <path d="M100 44 L100 16" {...s} strokeWidth={6} />
        <path d="M100 18 L136 26 L100 40 Z" {...f(C.rose)} />
        {/* predio */}
        <path d="M40 156 L40 92 L160 92 L160 156 Z" {...f(PAPER)} />
        <path d="M28 92 L100 46 L172 92 Z" {...f(C.clay)} />
        {/* relogio no frontao */}
        <circle cx="100" cy="76" r="11" {...f(PAPER)} />
        {/* porta dupla */}
        <path d="M82 156 L82 116 L118 116 L118 156 Z" {...f(C.tealDeep)} />
        <path d="M100 116 L100 156" {...s} strokeWidth={4} stroke={PAPER} />
        {/* janelas */}
        <rect x="52" y="108" width="20" height="20" rx="3" {...f(C.sky)} />
        <rect x="128" y="108" width="20" height="20" rx="3" {...f(C.sky)} />
        <path d="M24 156 L176 156" {...s} strokeWidth={7} />
      </g>
    ),
  },

  transporte: {
    tint: C.butter,
    art: (
      <g>
        <path d="M28 60 L172 60 L172 132 L28 132 Z" {...f(C.butter)} />
        <rect x="42" y="74" width="42" height="30" rx="4" {...f(C.sky)} />
        <rect x="98" y="74" width="42" height="30" rx="4" {...f(C.sky)} />
        <path d="M22 132 L178 132" {...s} strokeWidth={7} />
        <circle cx="62" cy="146" r="16" {...f(INK)} />
        <circle cx="138" cy="146" r="16" {...f(INK)} />
        <circle cx="62" cy="146" r="6" fill={PAPER} />
        <circle cx="138" cy="146" r="6" fill={PAPER} />
      </g>
    ),
  },

  mochila: {
    tint: C.teal,
    art: (
      <g>
        <path d="M62 62 C62 40 138 40 138 62" {...s} />
        <path d="M44 74 C44 58 156 58 156 74 L156 156 L44 156 Z" {...f(C.teal)} />
        <path d="M44 108 L156 108" {...s} />
        <rect x="76" y="118" width="48" height="28" rx="6" {...f(C.sand)} />
      </g>
    ),
  },

  tarefa: {
    tint: C.sky,
    art: (
      <g>
        {/* caderno */}
        <path d="M40 40 L140 40 L140 160 L40 160 Z" {...f(PAPER)} />
        <path d="M40 40 L40 160" {...s} strokeWidth={8} stroke={C.sky} />
        <path d="M62 74 L118 74 M62 100 L118 100 M62 126 L96 126" {...s} strokeWidth={5} />
        {/* lapis */}
        <path d="M126 148 L162 60 L178 68 L142 156 Z" {...f(C.sand)} />
        <path d="M126 148 L142 156 L128 164 Z" {...f(INK)} />
      </g>
    ),
  },

  leitura: {
    tint: C.lilac,
    art: (
      <g>
        <path d="M100 68 C78 52 48 52 30 58 L30 148 C48 142 78 142 100 158 Z" {...f(PAPER)} />
        <path d="M100 68 C122 52 152 52 170 58 L170 148 C152 142 122 142 100 158 Z" {...f(PAPER)} />
        <path d="M100 68 L100 158" {...s} strokeWidth={6} />
        <path d="M48 82 L82 82 M48 104 L82 104 M118 82 L152 82 M118 104 L152 104" {...s} strokeWidth={4} stroke={C.lilac} />
      </g>
    ),
  },

  // --- terapias: uma cara para cada sala ---

  fono: {
    tint: C.clay,
    art: (
      <g>
        {/* boca falando */}
        <path d="M30 100 C30 74 62 60 86 60 C110 60 138 74 138 100 C138 126 110 142 86 142 C62 142 30 126 30 100 Z" {...f(PAPER)} />
        <path d="M30 100 C56 88 112 88 138 100" {...s} strokeWidth={5} />
        <path d="M56 100 C64 118 108 118 116 100" {...f(C.rose)} />
        {/* ondas de som saindo */}
        <path d="M152 76 C166 90 166 110 152 124" {...s} strokeWidth={6} stroke={C.clay} />
        <path d="M172 60 C194 84 194 116 172 140" {...s} strokeWidth={6} stroke={C.clay} />
      </g>
    ),
  },

  ocupacional: {
    tint: C.teal,
    art: (
      <g>
        {/* mao encaixando formas — o gesto que define a TO */}
        <path d="M118 60 L160 60 L160 102 L118 102 Z" {...f(C.butter)} />
        <circle cx="66" cy="62" r="24" {...f(C.rose)} />
        {/* mao */}
        <path d="M52 168 L52 116 C52 106 66 106 66 116 L66 96 C66 86 80 86 80 96 L80 112 C80 100 94 100 94 112 L94 122 C94 106 108 108 108 120 L108 150 C108 164 96 172 84 172 Z" {...f(C.sand)} />
      </g>
    ),
  },

  psicologia: {
    tint: C.lilac,
    art: (
      <g>
        {/* peca de quebra-cabeca — o simbolo que a clinica ja usa */}
        <path
          d="M56 48 L104 48 C104 32 132 32 132 48 L144 48 L144 84 C160 84 160 112 144 112 L144 152 L104 152
             C104 168 76 168 76 152 L56 152 Z"
          {...f(C.lilac)}
        />
      </g>
    ),
  },

  fisio: {
    tint: C.leaf,
    art: (
      <g>
        {/* bola de pilates + corpo em movimento.
            Corpo de forma cheia, nao palito: no conjunto, o unico desenho de
            linha fina saltava aos olhos como erro. */}
        <circle cx="134" cy="124" r="44" {...f(C.leaf)} />
        <path d="M104 90 C114 102 114 146 104 158" {...s} strokeWidth={4} stroke={C.tealDeep} />
        <circle cx="58" cy="46" r="19" {...f(C.sand)} />
        <path d="M44 72 L72 72 L78 122 L38 122 Z" {...f(C.tealDeep)} />
        <path d="M52 84 L20 100 M64 84 L98 66" {...s} strokeWidth={11} stroke={C.sand} />
        <path d="M46 122 L26 166 M70 122 L82 166" {...s} strokeWidth={12} stroke={C.tealDeep} />
      </g>
    ),
  },

  psicopedagogia: {
    tint: C.sand,
    art: (
      <g>
        {/* blocos de letras: aprender, sem virar "dever de casa" */}
        <rect x="26" y="98" width="54" height="54" rx="8" {...f(C.sand)} />
        <rect x="90" y="98" width="54" height="54" rx="8" {...f(C.sky)} />
        <rect x="58" y="40" width="54" height="54" rx="8" {...f(C.rose)} />
        <text x="53" y="136" fontSize="34" fontWeight="800" fill={INK} textAnchor="middle" fontFamily="system-ui, sans-serif">A</text>
        <text x="117" y="136" fontSize="34" fontWeight="800" fill={INK} textAnchor="middle" fontFamily="system-ui, sans-serif">B</text>
        <text x="85" y="78" fontSize="34" fontWeight="800" fill={INK} textAnchor="middle" fontFamily="system-ui, sans-serif">C</text>
      </g>
    ),
  },

  medico: {
    tint: C.sky,
    art: (
      <g>
        {/* estetoscopio */}
        <path d="M58 40 L58 84 C58 110 84 126 104 126 C124 126 148 110 148 84 L148 66" {...s} strokeWidth={7} />
        <path d="M46 34 L70 34" {...s} strokeWidth={8} />
        <circle cx="148" cy="56" r="14" {...f(C.sky)} />
        <circle cx="104" cy="150" r="26" {...f(C.stone)} />
        <circle cx="104" cy="150" r="13" {...f(PAPER)} />
      </g>
    ),
  },

  terapia: {
    tint: C.tealDeep,
    art: (
      <g>
        {/* generico de terapia: duas pessoas, uma de frente pra outra */}
        <circle cx="62" cy="62" r="20" {...f(C.sand)} />
        <path d="M28 152 C28 116 96 116 96 152 Z" {...f(C.teal)} />
        <circle cx="138" cy="62" r="20" {...f(C.sand)} />
        <path d="M104 152 C104 116 172 116 172 152 Z" {...f(C.tealDeep)} />
        <path d="M24 158 L176 158" {...s} strokeWidth={7} />
      </g>
    ),
  },

  remedio: {
    tint: C.rose,
    art: (
      <g>
        <path d="M70 46 L130 46 L130 68 L70 68 Z" {...f(C.stone)} />
        <path d="M58 68 L142 68 L142 158 L58 158 Z" {...f(PAPER)} />
        <path d="M100 88 L100 132 M78 110 L122 110" {...s} strokeWidth={10} stroke={C.rose} />
      </g>
    ),
  },

  brincar: {
    tint: C.butter,
    art: (
      <g>
        {/* blocos */}
        <rect x="34" y="104" width="52" height="52" rx="8" {...f(C.rose)} />
        <rect x="94" y="104" width="52" height="52" rx="8" {...f(C.sky)} />
        <rect x="64" y="48" width="52" height="52" rx="8" {...f(C.butter)} />
        <circle cx="90" cy="74" r="7" {...f(PAPER)} />
      </g>
    ),
  },

  parque: {
    tint: C.leaf,
    art: (
      <g>
        {/* sol */}
        <circle cx="152" cy="52" r="20" {...f(C.butter)} />
        {/* arvore */}
        <path d="M92 150 L92 104" {...s} strokeWidth={12} stroke={C.clay} />
        <circle cx="92" cy="80" r="42" {...f(C.leaf)} />
        <path d="M24 152 L176 152" {...s} strokeWidth={7} />
      </g>
    ),
  },

  tela: {
    tint: C.stone,
    art: (
      <g>
        <rect x="30" y="46" width="140" height="98" rx="10" {...f(PAPER)} />
        <rect x="46" y="62" width="108" height="66" rx="4" {...f(C.sky)} />
        <path d="M100 144 L100 160" {...s} strokeWidth={7} />
        <path d="M64 166 L136 166" {...s} strokeWidth={7} />
      </g>
    ),
  },

  musica: {
    tint: C.lilac,
    art: (
      <g>
        <path d="M78 140 L78 56 L150 40 L150 124" {...s} strokeWidth={7} />
        <ellipse cx="60" cy="142" rx="22" ry="17" {...f(C.lilac)} />
        <ellipse cx="132" cy="126" rx="20" ry="16" {...f(C.lilac)} />
        <path d="M78 78 L150 62" {...s} strokeWidth={7} />
      </g>
    ),
  },

  esporte: {
    tint: C.leaf,
    art: (
      <g>
        <circle cx="100" cy="102" r="54" {...f(PAPER)} />
        <path d="M100 48 L100 156 M46 102 L154 102" {...s} strokeWidth={5} stroke={C.leaf} />
        <path d="M62 64 C90 92 90 112 62 140 M138 64 C110 92 110 112 138 140" {...s} strokeWidth={5} stroke={C.leaf} />
      </g>
    ),
  },

  guardar: {
    tint: C.clay,
    art: (
      <g>
        {/* caixa de brinquedos */}
        <path d="M36 88 L164 88 L154 158 L46 158 Z" {...f(C.clay)} />
        <path d="M30 70 L170 70 L170 90 L30 90 Z" {...f(C.sand)} />
        {/* itens indo pra dentro */}
        <circle cx="72" cy="46" r="14" {...f(C.rose)} />
        <rect x="108" y="34" width="26" height="26" rx="5" {...f(C.sky)} />
      </g>
    ),
  },

  generico: {
    tint: C.teal,
    art: (
      <g>
        {/* relogio: "uma hora do dia", quando o texto nao diz o que e */}
        <circle cx="100" cy="104" r="54" {...f(PAPER)} />
        <path d="M100 68 L100 104 L128 118" {...s} strokeWidth={7} />
        <path d="M100 42 L100 50 M154 104 L146 104 M100 166 L100 158 M46 104 L54 104" {...s} strokeWidth={6} />
      </g>
    ),
  },
};

interface Props {
  /** O texto da atividade, como o responsavel digitou. */
  title: string;
  size?: number;
  className?: string;
}

/**
 * Um pictograma para a atividade. Estatico de proposito: o desenho e para ser
 * reconhecido de relance, nao observado.
 */
export const ActivityPictogram: React.FC<Props> = ({ title, size = 120, className = '' }) => {
  const key = pictogramFor(title);
  const { tint, art } = SHAPES[key];

  return (
    <div
      className={`select-none pointer-events-none ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={title}
    >
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* moldura macia e constante — da presenca ao desenho sem disputar com ele */}
        <rect x="4" y="4" width="192" height="192" rx="44" fill={tint} opacity="0.16" />
        <rect x="4" y="4" width="192" height="192" rx="44" fill="none" stroke={tint} strokeWidth="3" opacity="0.5" />
        {art}
      </svg>
    </div>
  );
};
