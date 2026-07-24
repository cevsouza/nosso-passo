// Capturas de tela para a ficha da Play Store.
//
// Nao da para usar o painel do navegador da IDE: com ele oculto a pagina nao
// compoe frames e a captura estoura o tempo. Aqui subimos um Chrome headless
// proprio e falamos CDP com ele — o que tambem deixa fixar a densidade de
// pixels, coisa que a janela normal nao permite. A Play aceita 320..3840 px,
// mas uma captura em 1x fica visivelmente mole ao lado dos concorrentes.
//
//   node scripts/store-screenshots.mjs [pastaDeSaida]
//
// Entra pela conta de DEMONSTRACAO (dados ficticios, criancas inventadas).
// Nenhuma tela de crianca real vai para a loja.

import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

const BASE = 'https://nossopasso.com.br';
const OUT = process.argv[2] || 'store-screens';
const PORT = 9333;
const DPR = 3;                 // 412x915 -> 1236x2745
const W = 412, H = 915;

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

// `antes` roda na pagina depois de carregar e antes da foto — e como se chega
// na aba certa. Sem isso o painel do adulto abre na lista de criancas com um
// paredao de texto, que nao vende nada.
const clicar = (texto) =>
  `(()=>{const b=[...document.querySelectorAll('button,a')]
     .find(x=>x.textContent.trim().startsWith(${JSON.stringify(texto)}));
     if(b){b.click();return 'ok'}return 'nao achou: ${texto}'})()`;

const TELAS = [
  { id: '1_tela_paciente', url: '/routine', espera: 7000, tema: 'dark',
    nota: 'A tela da crianca: uma atividade, um desenho, o tempo passando.' },
  { id: '2_hoje', url: '/dashboard', espera: 7000, tema: 'light',
    antes: clicar('Hoje'), esperaDepois: 2500,
    nota: 'O dia num relance, para o adulto.' },
  { id: '3_rotina_pronta', url: '/dashboard', espera: 7000, tema: 'light',
    antes: clicar('Rotina'), esperaDepois: 3000,
    nota: 'Rotina pronta por momento do dia — os dez minutos prometidos.' },
];

function cdpSend(ws, id, method, params = {}) {
  ws.send(JSON.stringify({ id, method, params }));
}

async function main() {
  mkdirSync(OUT, { recursive: true });

  const chrome = spawn(CHROME, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    '--disable-gpu',
    '--no-first-run',
    '--user-data-dir=' + OUT + '/_perfil',
    `--window-size=${W},${H}`,
    'about:blank',
  ], { stdio: 'ignore' });

  // espera a porta de depuracao subir
  let alvo = null;
  for (let i = 0; i < 40 && !alvo; i++) {
    await sleep(500);
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const abas = await r.json();
      alvo = abas.find((t) => t.type === 'page');
    } catch { /* ainda subindo */ }
  }
  if (!alvo) { chrome.kill(); throw new Error('Chrome nao abriu a porta de depuracao'); }

  const ws = new WebSocket(alvo.webSocketDebuggerUrl);
  const pendentes = new Map();
  let seq = 0;

  const chamar = (method, params) => new Promise((res, rej) => {
    const id = ++seq;
    pendentes.set(id, { res, rej });
    cdpSend(ws, id, method, params);
  });

  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pendentes.has(msg.id)) {
      const { res, rej } = pendentes.get(msg.id);
      pendentes.delete(msg.id);
      msg.error ? rej(new Error(msg.error.message)) : res(msg.result);
    }
  });

  await new Promise((r) => ws.addEventListener('open', r, { once: true }));

  await chamar('Page.enable');
  await chamar('Runtime.enable');
  await chamar('Emulation.setDeviceMetricsOverride', {
    width: W, height: H, deviceScaleFactor: DPR, mobile: true,
  });

  const irPara = async (caminho, espera) => {
    await chamar('Page.navigate', { url: BASE + caminho });
    await sleep(espera);
  };

  const avaliar = async (expressao) => {
    const r = await chamar('Runtime.evaluate', {
      expression: expressao, awaitPromise: true, returnByValue: true,
    });
    return r.result?.value;
  };

  // --- entrar na demonstracao ---
  await irPara('/login', 5000);
  await avaliar(`(()=>{const b=[...document.querySelectorAll('button,a')]
     .find(x=>x.textContent.includes('Ver a demonstração')); if(b){b.click();return 'clicou'} return 'nao achou'})()`);
  await sleep(8000);

  // escolhe a primeira crianca para nao cair no seletor de nomes
  await irPara('/routine', 6000);
  await avaliar(`(()=>{const b=[...document.querySelectorAll('button')]
     .find(x=>x.textContent.trim().startsWith('Téo')); if(b){b.click();return 'escolheu'} return 'ja estava'})()`);
  await sleep(6000);

  const feitas = [];
  for (const tela of TELAS) {
    // O painel do adulto e da marca clara (creme e verde); a tela da crianca e
    // escura por decisao de projeto. Sem fixar isto, o Chrome sem cabeca decide
    // sozinho e as capturas saem em temas diferentes a cada rodada.
    await chamar('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-color-scheme', value: tela.tema || 'light' }],
    });
    await irPara(tela.url, tela.espera);
    if (tela.antes) {
      const r = await avaliar(tela.antes);
      if (String(r).startsWith('nao achou')) console.warn('  aviso:', r);
      await sleep(tela.esperaDepois || 2500);
    }
    const { data } = await chamar('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    const arquivo = `${OUT}/${tela.id}.png`;
    writeFileSync(arquivo, Buffer.from(data, 'base64'));
    feitas.push({ arquivo, nota: tela.nota });
  }

  ws.close();
  chrome.kill();

  console.log(`\n${feitas.length} capturas em ${W * DPR}x${H * DPR}:`);
  feitas.forEach((f) => console.log(' ', f.arquivo, '—', f.nota));
}

main().catch((e) => { console.error('ERRO:', e.message); process.exit(1); });
