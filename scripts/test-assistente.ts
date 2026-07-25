// Regras do proximo passo: `npx tsx scripts/test-assistente.ts`
import { proximoPasso, EstadoDia, PassoId } from '../src/lib/assistente';

const base: EstadoDia = { temCrianca: true, totalHoje: 8, feitasHoje: 0, hora: 9, abriuTelaHoje: false };
const casos: [string, Partial<EstadoDia>, PassoId][] = [
  ['sem crianca', { temCrianca: false }, 'cadastrar'],
  ['dia vazio', { totalHoje: 0 }, 'montar'],
  ['rotina pronta, de manha, ninguem comecou', { feitasHoje: 0, hora: 8 }, 'abrir'],
  ['rotina pronta, mas 23h', { feitasHoje: 0, hora: 23 }, 'em-dia'],
  ['rotina pronta, mas 5h', { feitasHoje: 0, hora: 5 }, 'em-dia'],
  ['no meio da rotina', { feitasHoje: 3 }, 'progresso'],
  ['tudo feito de noite', { feitasHoje: 8, hora: 20 }, 'registrar'],
  ['tudo feito cedo', { feitasHoje: 8, hora: 11 }, 'em-dia'],
  ['dia vazio vence tudo', { totalHoje: 0, feitasHoje: 0, hora: 20 }, 'montar'],
];

let ok = 0; const falhas: string[] = [];
for (const [nome, patch, esperado] of casos) {
  const got = proximoPasso({ ...base, ...patch });
  if (got === esperado) ok++;
  else falhas.push(`  ${nome}: esperado=${esperado} obtido=${got}`);
}
if (falhas.length) { console.log('FALHAS:'); falhas.forEach(l => console.log(l)); }
console.log(`\n${ok}/${casos.length} casos do assistente corretos\n`);
process.exit(falhas.length ? 1 : 0);
