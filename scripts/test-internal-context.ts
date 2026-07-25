// Aviso do ambiente interno: `npx tsx scripts/test-internal-context.ts`
import { deriveInternalHint } from '../src/lib/internal-context';

let ok = 0; const falhas: string[] = [];
const check = (nome: string, cond: boolean) => { if (cond) ok++; else falhas.push('  ' + nome); };

// Bateria vence a hora.
check('vermelho = sobrecarga', deriveInternalHint({ battery: 'red', hour: 10 }).kind === 'overload');
check('vermelho a noite ainda = sobrecarga', deriveInternalHint({ battery: 'red', hour: 22 }).kind === 'overload');
check('amarelo = cansaco', deriveInternalHint({ battery: 'yellow', hour: 10 }).kind === 'tired');
check('verde de dia = none', deriveInternalHint({ battery: 'green', hour: 10 }).kind === 'none');
check('verde a noite = night', deriveInternalHint({ battery: 'green', hour: 21 }).kind === 'night');
check('verde de madrugada = night', deriveInternalHint({ battery: 'green', hour: 3 }).kind === 'night');
check('sem bateria de dia = none', deriveInternalHint({ battery: null, hour: 14 }).kind === 'none');
check('sem bateria a noite = night', deriveInternalHint({ battery: undefined, hour: 23 }).kind === 'night');

if (falhas.length) { console.log('FALHAS:'); falhas.forEach((l) => console.log(l)); }
console.log(`\n${ok}/${ok + falhas.length} verificacoes do ambiente interno corretas\n`);
process.exit(falhas.length ? 1 : 0);
