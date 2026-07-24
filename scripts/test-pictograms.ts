// Casamento texto → pictograma: `npm run test:pictograms`
//
// Os casos abaixo NAO sao inventados: sao os titulos de atividade que existem
// de verdade no banco, tirados das rotinas reais em 24/07/2026. E por isso que
// eles valem — cada um ja quebrou pelo menos uma versao das regras.
//
// Se voce mexer na ordem de RULES, rode isto. A ordem e a parte fragil:
// "Tarefa da escola", "Aulas e Estudo", "Ir para a escola" e "Descanso sem
// tela" disputam palavras entre si, e o primeiro que casa vence.

import { pictogramFor, PictoKey } from '../src/components/ludic/ActivityPictogram';

const CASOS: [string, PictoKey][] = [
  // --- rotinas reais em producao ---
  ['Banho 🛁', 'banho'],
  ['Almoço 🍲', 'refeicao'],
  ['Café da manhã 🥣', 'cafe'],
  ['Dormir 😴', 'dormir'],
  ['Jantar 🍽️', 'refeicao'],
  ['Escovar os dentes 🪥', 'dentes'],
  ['Jantar em Família', 'refeicao'],
  ['Acordar 🌅', 'acordar'],
  ['Usar o Banheiro', 'banheiro'],
  ['Aulas e Estudo', 'escola'],
  ['Brincar com os dinossauros 🦖', 'brincar'],
  ['Tempo do metrô 🚇', 'transporte'],
  ['História com luz baixa 📖', 'leitura'],
  ['Sessão Psicologia ABA 🧠', 'psicologia'],
  ['Fisioterapia Motora 🩺', 'fisio'],
  ['Tomar Banho e Dormir', 'banho'],
  ['Trocar de Roupa', 'vestir'],
  ['Almoço Saudável', 'refeicao'],
  ['Tomar café da manhã', 'cafe'],
  ['Sessão Fonoaudiologia 🗣️', 'fono'],
  ['Vestir o uniforme 👕', 'vestir'],
  ['Acordar e abrir a cortina 🌅', 'acordar'],
  ['Escola 🏫', 'escola'],
  ['Ir para a escola 🚌', 'transporte'],
  ['Descanso sem tela 🛋️', 'descanso'],
  ['Aula 🏫', 'escola'],
  ['Sessão Psicopedagogia 📚', 'psicopedagogia'],
  ['Almoço em Família', 'refeicao'],
  ['Higiene e Dormir', 'dormir'],
  ['Café Especial', 'cafe'],
  ['Tempo Livre (Hiperfoco)', 'brincar'],
  ['Organizar Brinquedos', 'guardar'],
  ['Parque e Natureza', 'parque'],
  ['Tarefa da escola ✏️', 'tarefa'],
  ['Psicologia (ABA) 🧠', 'psicologia'],
  ['Passeio combinado 🚉', 'parque'],
  ['Parque 🌳', 'parque'],
  ['Acordar sem alarme 🌤️', 'acordar'],
  ['Sessão Musicoterapia 🎵', 'musica'],
  ['Terapia ocupacional 🧩', 'ocupacional'],
  ['Fonoaudiologia 🗣️', 'fono'],
  ['Brincar com o Collie 🐶', 'brincar'],

  // --- rotinas prontas que o proprio app oferece ---
  ['Ir ao banheiro', 'banheiro'],
  ['Vestir a roupa', 'vestir'],
  ['Pegar a mochila e sair', 'mochila'],
  ['Voltar para casa', 'transporte'],
  ['Momento de descanso', 'descanso'],
  ['Terapia', 'terapia'],
  ['Lanche da tarde', 'lanche'],
  ['Brincar livre', 'brincar'],
  ['Banho', 'banho'],
  ['Vestir o pijama', 'vestir'],
  ['História antes de dormir', 'leitura'],
  ['Apagar a luz', 'dormir'],

  // --- outros idiomas ---
  ['Brush teeth', 'dentes'],
  ['Breakfast', 'cafe'],
  ['Bedtime story', 'leitura'],
  ['Lights out', 'dormir'],
  ['Get dressed', 'vestir'],
  ['Cepillarse los dientes', 'dentes'],
  ['Merienda', 'lanche'],
  ['Cuento antes de dormir', 'leitura'],

  // --- casos que o texto do responsavel pode trazer ---
  ['Lavar as mãos', 'maos'],
  ['Tomar o remédio', 'remedio'],
  ['Beber água', 'beber'],
  ['Calçar o tênis', 'sapato'],
  ['Natação adaptada', 'esporte'],
  ['Assistir TV', 'tela'],
  ['Consulta com o neuro', 'medico'],
  ['Integração sensorial', 'ocupacional'],
  ['Psicomotricidade', 'fisio'],

  // --- sem palavra conhecida: cai no relogio, nunca quebra ---
  ['Visita da vovó', 'generico'],
  ['', 'generico'],
];

let pass = 0;
const falhas: string[] = [];

for (const [titulo, esperado] of CASOS) {
  const obtido = pictogramFor(titulo);
  if (obtido === esperado) pass++;
  else falhas.push(`  "${titulo}"  esperado=${esperado}  obtido=${obtido}`);
}

if (falhas.length) {
  console.log('FALHAS:');
  falhas.forEach((l) => console.log(l));
}
console.log(`\n${pass}/${CASOS.length} titulos casaram com o pictograma certo\n`);
process.exit(falhas.length === 0 ? 0 : 1);
