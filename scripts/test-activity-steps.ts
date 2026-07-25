// Passo a passo por atividade: `npx tsx scripts/test-activity-steps.ts`
// O foco e o casamento por titulo — onde os bugs de radical moram.
import { stepsForActivity, stepText } from '../src/lib/activity-steps';

// Casa o titulo -> primeiro passo esperado (pt), para provar o conjunto certo.
const casos: [string, string | null][] = [
  ['Escovar os dentes', 'Molhe a escova'],
  ['Escovação noturna', 'Molhe a escova'],
  ['Tomar banho', 'Tire a roupa'],
  ['Banho', 'Tire a roupa'],
  // A armadilha: "banheiro" NAO pode virar "banho".
  ['Ir ao banheiro', 'Vá até o banheiro'],
  ['Usar o banheiro', 'Vá até o banheiro'],
  ['Lavar as mãos', 'Abra a torneira'],
  ['Vestir o uniforme', 'Vista a roupa de baixo'],
  ['Trocar de roupa', 'Vista a roupa de baixo'],
  ['Calçar o sapato', 'Abra o sapato'],
  ['Pentear o cabelo', 'Pegue a escova'],
  ['Café da manhã', 'Sente à mesa'],
  ['Almoço', 'Sente à mesa'],
  ['Jantar em Família', 'Sente à mesa'],
  ['Hora de dormir', 'Vista o pijama'],
  // Novos triviais/recorrentes:
  ['Acordar e abrir a cortina', 'Abra a cortina'],
  // Colisao classica: "arrumar a cama" NAO pode virar "dormir" (ambos tem cama).
  ['Arrumar a cama', 'Estique o lençol'],
  ['Guardar os brinquedos', 'Pegue a caixa'],
  ['Fazer a lição', 'Pegue o material'],
  ['Tarefa da escola', 'Pegue o material'],
  ['Lavar o rosto', 'Abra a torneira'],
  ['Tomar remédio', 'Chame um adulto'],
  // Sem correspondencia: a maioria das atividades nao tem passo-a-passo.
  ['Tempo do metrô', null],
  ['Fonoaudiologia', null],
  ['Brincar no parque', null],
];

let ok = 0;
const falhas: string[] = [];
for (const [title, esperado] of casos) {
  const steps = stepsForActivity(title);
  const first = steps ? stepText(steps[0], 'pt') : null;
  if (first === esperado) ok++;
  else falhas.push(`  "${title}" -> esperado ${esperado === null ? '(nenhum)' : `"${esperado}"`}, veio ${first === null ? '(nenhum)' : `"${first}"`}`);
}
if (falhas.length) { console.log('FALHAS:'); falhas.forEach((l) => console.log(l)); }
console.log(`\n${ok}/${casos.length} atividades casaram o passo-a-passo certo\n`);
process.exit(falhas.length ? 1 : 0);
