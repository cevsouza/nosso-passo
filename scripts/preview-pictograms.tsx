// Folha de contato dos pictogramas: `npx tsx scripts/preview-pictograms.tsx > out.html`
//
// Renderiza TODOS os desenhos lado a lado, no tamanho real em que a crianca ve
// (120px) e no menor (88px). Pictograma se julga de relance e em conjunto — um
// que destoa dos outros aparece na folha e nao aparece no arquivo.
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ActivityPictogram, pictogramFor } from '../src/components/ludic/ActivityPictogram';

const TITULOS = [
  'Escovar os dentes', 'Banho', 'Lavar as mãos', 'Usar o Banheiro',
  'Acordar', 'Dormir', 'Descanso sem tela',
  'Café da manhã', 'Almoço', 'Lanche da tarde', 'Beber água',
  'Vestir o uniforme', 'Calçar o tênis',
  'Ir para a escola', 'Aulas e Estudo', 'Pegar a mochila e sair',
  'Tarefa da escola', 'História antes de dormir',
  'Sessão Fonoaudiologia', 'Terapia ocupacional', 'Sessão Psicologia ABA',
  'Fisioterapia Motora', 'Sessão Psicopedagogia', 'Consulta com o neuro', 'Terapia',
  'Tomar o remédio',
  'Brincar com os dinossauros', 'Parque e Natureza', 'Assistir TV',
  'Sessão Musicoterapia', 'Natação adaptada', 'Organizar Brinquedos',
  'Visita da vovó',
];

const cards = TITULOS.map((t) => {
  const key = pictogramFor(t);
  const big = renderToStaticMarkup(React.createElement(ActivityPictogram, { title: t, size: 120 }));
  const small = renderToStaticMarkup(React.createElement(ActivityPictogram, { title: t, size: 64 }));
  return `<figure><div class="row">${big}${small}</div>
    <figcaption><b>${t}</b><span>${key}</span></figcaption></figure>`;
}).join('\n');

console.log(`<!doctype html><meta charset="utf-8">
<style>
 body{font-family:system-ui,sans-serif;background:#f7f5fd;margin:0;padding:28px;color:#3a3550}
 h1{font-size:20px;margin:0 0 4px}
 p.sub{margin:0 0 24px;color:#6b6488;font-size:13px}
 .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:16px}
 figure{margin:0;background:#fff;border:1px solid #e3def3;border-radius:16px;padding:14px}
 .row{display:flex;align-items:flex-end;gap:10px}
 figcaption{margin-top:10px;display:flex;flex-direction:column;gap:2px}
 figcaption b{font-size:13px}
 figcaption span{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#9891ba;font-weight:800}
</style>
<h1>Pictogramas de atividade — folha de contato</h1>
<p class="sub">Cada desenho em 120px (tamanho da tela do paciente) e 64px. O rótulo cinza é a chave que o texto casou.</p>
<div class="grid">${cards}</div>`);
