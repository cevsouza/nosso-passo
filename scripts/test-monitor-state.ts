// Maquina de estados do vigia interno: `npx tsx scripts/test-monitor-state.ts`
import { nextTransition } from '../src/lib/monitor-state';

let ok = 0; const falhas: string[] = [];
const check = (nome: string, cond: boolean) => { if (cond) ok++; else falhas.push('  ' + nome); };

// Primeira vez
check('1a vez saudavel = none', (() => { const t = nextTransition(null, true); return t.state === 'healthy' && t.notify === 'none'; })());
check('1a vez com problema = down', (() => { const t = nextTransition(null, false); return t.state === 'unhealthy' && t.notify === 'down'; })());
check('undefined tratado como 1a vez', (() => { const t = nextTransition(undefined, false); return t.notify === 'down'; })());

// Continuidade (anti-spam)
check('saudavel -> saudavel = none', (() => { const t = nextTransition('healthy', true); return t.notify === 'none'; })());
check('problema -> problema = none (nao repete)', (() => { const t = nextTransition('unhealthy', false); return t.state === 'unhealthy' && t.notify === 'none'; })());

// Viradas
check('saudavel -> problema = down', (() => { const t = nextTransition('healthy', false); return t.state === 'unhealthy' && t.notify === 'down'; })());
check('problema -> saudavel = recovery', (() => { const t = nextTransition('unhealthy', true); return t.state === 'healthy' && t.notify === 'recovery'; })());

if (falhas.length) { console.log('FALHAS:'); falhas.forEach((l) => console.log(l)); }
console.log(`\n${ok}/${ok + falhas.length} casos da maquina de estados corretos\n`);
process.exit(falhas.length ? 1 : 0);
