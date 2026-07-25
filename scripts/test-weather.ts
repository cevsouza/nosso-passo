// Aviso do tempo: `npx tsx scripts/test-weather.ts`
import { deriveHint, activityWantsWeather, isRainyCode } from '../src/lib/weather';

let ok = 0; const falhas: string[] = [];
const check = (nome: string, cond: boolean) => { if (cond) ok++; else falhas.push('  ' + nome); };

// deriveHint: prioridade chuva > frio > sol
check('chuva por probabilidade', deriveHint({ tempC: 12, precipProb: 80, code: 3 })?.kind === 'rain');
check('chuva por codigo (mesmo com pouca prob)', deriveHint({ tempC: 12, precipProb: 10, code: 61 })?.kind === 'rain');
check('frio sem chuva', deriveHint({ tempC: 10, precipProb: 10, code: 1 })?.kind === 'cold');
check('sol forte', deriveHint({ tempC: 33, precipProb: 0, code: 0 })?.kind === 'hot');
check('ameno = none', deriveHint({ tempC: 22, precipProb: 10, code: 1 })?.kind === 'none');
check('sem leitura = null', deriveHint(null) === null);
check('chuva vence frio', deriveHint({ tempC: 8, precipProb: 90, code: 80 })?.kind === 'rain');

// codigos de chuva
check('code 61 chuva', isRainyCode(61) === true);
check('code 95 trovoada', isRainyCode(95) === true);
check('code 0 ceu limpo nao e chuva', isRainyCode(0) === false);

// activityWantsWeather
check('ir para a escola quer tempo', activityWantsWeather('Ir para a escola') === true);
check('vestir o uniforme quer tempo', activityWantsWeather('Vestir o uniforme') === true);
check('passeio combinado quer tempo', activityWantsWeather('Passeio combinado') === true);
check('trocar de roupa quer tempo', activityWantsWeather('Trocar de roupa') === true);
check('escovar os dentes NAO quer tempo', activityWantsWeather('Escovar os dentes') === false);
check('almoco NAO quer tempo', activityWantsWeather('Almoço') === false);

if (falhas.length) { console.log('FALHAS:'); falhas.forEach((l) => console.log(l)); }
console.log(`\n${ok}/${ok + falhas.length} verificacoes do tempo corretas\n`);
process.exit(falhas.length ? 1 : 0);
