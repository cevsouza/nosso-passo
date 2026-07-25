// Localizador de funcoes: `npx tsx scripts/test-mapa.ts`
// As perguntas sao como um pai realmente digitaria.
import { buscarFuncoes } from '../src/lib/mapa-funcoes';

const casos: [string, string][] = [
  ['onde fica o código do terapeuta', 'codigo-terapeuta'],
  ['como compartilhar com a psicóloga', 'codigo-terapeuta'],
  ['quero imprimir os cartões', 'imprimir-pecs'],
  ['registrar o dia', 'registrar-dia'],
  ['como foi o dia / humor', 'registrar-dia'],
  ['simplificar a tela', 'nivel-interface'],
  ['nível foco', 'nivel-interface'],
  ['trocar minha senha', 'senha'],
  ['tema escuro', 'tema-idioma'],
  ['plano premium', 'plano'],
  ['prêmio estrelas', 'premio'],
  ['pin da criança', 'pin'],
  ['avisar a criança que cancelou a terapia', 'mudanca-inesperada'],
  ['relatório de evolução em pdf', 'relatorio'],
  ['cadastrar outro filho', 'cadastrar-crianca'],
  ['abrir a tela da criança', 'abrir-crianca'],
  ['ver a semana', 'semana-mes'],
  // Ambiguas: uma palavra que casa varias funcoes. A mais literal deve vencer.
  ['imprimir', 'imprimir-pecs'],
  ['codigo', 'codigo-terapeuta'],
  ['relatorio', 'relatorio'],
];

let ok = 0; const falhas: string[] = [];
for (const [q, esperado] of casos) {
  const r = buscarFuncoes(q);
  if (r[0]?.id === esperado) ok++;
  else falhas.push(`  "${q}" -> esperado ${esperado}, veio [${r.map(x => x.id).join(', ') || '(vazio)'}]`);
}
if (falhas.length) { console.log('FALHAS:'); falhas.forEach(l => console.log(l)); }
console.log(`\n${ok}/${casos.length} perguntas acharam a função certa em 1º\n`);
process.exit(falhas.length ? 1 : 0);
