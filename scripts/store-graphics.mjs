// Artes da ficha da Play Store: grafico de destaque e icone.
//
//   node scripts/store-graphics.mjs [pastaDeSaida]
//
// Os pictogramas do grafico de destaque sao os MESMOS do app — importados do
// componente, nao redesenhados. Se um desenho mudar no produto, muda aqui na
// proxima geracao, e a loja nunca fica mostrando uma versao que nao existe
// mais.

import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ActivityPictogram } from '../src/components/ludic/ActivityPictogram';

const OUT = resolve(process.argv[2] || 'store-graphics');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

// Quatro atividades que contam a rotina inteira de um dia, sem palavra nenhuma.
const VITRINE = ['Café da manhã', 'Ir para a escola', 'Sessão Fonoaudiologia', 'Dormir'];

const picto = (t) =>
  renderToStaticMarkup(React.createElement(ActivityPictogram, { title: t, size: 104 }));

// --- grafico de destaque 1024x500 ---------------------------------------

const FEATURE = `<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@600;800;900&display=swap" rel="stylesheet">
<style>
 *{margin:0;padding:0;box-sizing:border-box}
 html,body{width:1024px;height:500px;overflow:hidden}
 body{font-family:'Nunito',system-ui,sans-serif;
   background:linear-gradient(135deg,#f6f3ec 0%,#e9f3f1 58%,#dceeeb 100%);
   display:flex;align-items:center;position:relative}
 .bg{position:absolute;inset:0;opacity:.12}
 .txt{position:relative;padding:0 40px 0 62px;max-width:585px}
 .lockup{display:flex;align-items:center;gap:14px;margin-bottom:24px}
 .li{width:56px;height:56px;border-radius:17px;background:#2f8f86;flex:none}
 .li svg{width:56px;height:56px;display:block}
 .ln{font-weight:900;font-size:27px;color:#262219;letter-spacing:-.02em;line-height:1}
 .ls{font-size:10.5px;letter-spacing:.19em;text-transform:uppercase;color:#6b6559;font-weight:800;margin-top:5px}
 h1{font-size:46px;line-height:1.08;color:#20241f;font-weight:900;letter-spacing:-.028em}
 h1 em{font-style:normal;color:#2f8f86}
 p{margin-top:18px;font-size:20px;line-height:1.42;color:#5a5449;font-weight:600;max-width:470px}
 .strip{position:absolute;right:40px;top:50%;transform:translateY(-50%);
   display:grid;grid-template-columns:repeat(2,1fr);gap:16px}
 .card{width:126px;height:126px;background:#fff;border-radius:27px;
   box-shadow:0 8px 22px rgba(60,50,30,.09);display:flex;align-items:center;
   justify-content:center;border:1px solid #e9e3d7}
 .card svg{width:104px;height:104px}
</style>
<svg class="bg" viewBox="0 0 1024 500" preserveAspectRatio="xMidYMid slice">
  <ellipse cx="120" cy="430" rx="150" ry="52" fill="#2f8f86"/>
  <ellipse cx="330" cy="330" rx="130" ry="46" fill="#5cb3a8"/>
  <ellipse cx="520" cy="240" rx="112" ry="40" fill="#2f8f86"/>
  <ellipse cx="680" cy="160" rx="96" ry="34" fill="#ef9d61"/>
</svg>
<div class="txt">
  <div class="lockup">
    <span class="li"><svg viewBox="0 0 64 64"><ellipse cx="19" cy="45" rx="9" ry="6.5" fill="#fff"/><ellipse cx="31" cy="38" rx="8" ry="6" fill="#dbf3ef"/><ellipse cx="42" cy="30" rx="7.5" ry="5.5" fill="#fff"/><ellipse cx="51" cy="23" rx="6.5" ry="5" fill="#ef9d61"/></svg></span>
    <span><div class="ln">Nosso Passo</div><div class="ls">um passo de cada vez</div></span>
  </div>
  <h1>A rotina do seu filho<br>em <em>imagens</em>.</h1>
  <p>Uma coisa de cada vez, sem estímulo demais.<br>Criado por um pai, para o próprio filho.</p>
</div>
<div class="strip">${VITRINE.map((t) => `<div class="card">${picto(t)}</div>`).join('')}</div>`;

// --- icone 512x512 -------------------------------------------------------
//
// Sem texto: em 48px na gaveta do celular, palavra nenhuma se le. So as
// pedras da marca.
//
// O viewBox tem folga de proposito. Com `0 0 64 64` as pedras iam de canto a
// canto — e a diagonal e exatamente o que a mascara circular do Android come:
// a pedra laranja, que e o passo seguinte e o ponto do desenho, ficava cortada.
// Aqui a arte ocupa ~62% do lado, bem dentro do circulo.

const ICON = `<!doctype html><meta charset="utf-8">
<style>
 *{margin:0;padding:0}html,body{width:512px;height:512px;overflow:hidden}
 body{background:#2f8f86}
 svg{width:512px;height:512px;display:block}
</style>
<svg viewBox="-5 -4 77 77">
  <ellipse cx="19" cy="45" rx="9" ry="6.5" fill="#ffffff"/>
  <ellipse cx="31" cy="38" rx="8" ry="6" fill="#dbf3ef"/>
  <ellipse cx="42" cy="30" rx="7.5" ry="5.5" fill="#ffffff"/>
  <ellipse cx="51" cy="23" rx="6.5" ry="5" fill="#ef9d61"/>
</svg>`;

async function shot(html, arquivo, w, h) {
  const src = `${OUT}/_${arquivo}.html`;
  writeFileSync(src, html);
  await new Promise((res, rej) => {
    const p = spawn(CHROME, [
      '--headless=new', '--disable-gpu', '--hide-scrollbars',
      `--screenshot=${OUT}/${arquivo}.png`,
      `--window-size=${w},${h}`,
      '--virtual-time-budget=6000',
      'file:///' + src.replace(/\\/g, '/'),
    ], { stdio: 'ignore' });
    p.on('exit', (c) => (c === 0 ? res() : rej(new Error('chrome saiu ' + c))));
  });
  console.log(`  ${arquivo}.png  ${w}x${h}`);
}

mkdirSync(OUT, { recursive: true });
console.log('\nArtes da loja:');
await shot(FEATURE, 'grafico_destaque_1024x500', 1024, 500);
await shot(ICON, 'icone_512x512', 512, 512);
await sleep(200);
console.log(`\nem ${OUT}\n`);
