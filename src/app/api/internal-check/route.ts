import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { nextTransition, HealthState } from '../../../lib/monitor-state';
import { sendAlertEmail } from '../../../lib/alert-email';

// Vigia INTERNO — o app se auto-vigia e avisa o dono por e-mail ANTES de uma
// familia tropecar. Vai alem do /health externo (que so faz SELECT 1): aqui a
// leitura e PROFUNDA (conta linhas de tabelas reais), pegando falha de tabela/
// schema que a conexao "de pe" mascara.
//
// Disparo: um monitor HTTP da UptimeRobot chama este endpoint a cada 5 min
// (cron barato). Retorna sempre 200 — o alerta e por E-MAIL, nao pelo status do
// monitor. Protegido por token para ninguem de fora disparar e-mail.
//
// Anti-spam: so envia na virada (down/recovery), via maquina de estados testada,
// com o estado guardado no banco (MonitorState). Se o banco estiver TOTALMENTE
// fora, nao da para persistir nem enviar — e ai o /health externo ja cobre.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get('token');
  const expected = process.env.INTERNAL_CHECK_TOKEN;
  if (!expected || token !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // 1) Check profundo: conexao + leitura de tabelas reais.
  let isHealthy = true;
  let detail = 'ok';
  try {
    await prisma.$queryRaw`SELECT 1`;
    await prisma.child.count();
    await prisma.task.count();
  } catch (e: any) {
    isHealthy = false;
    detail = (e?.message || 'deep check failed').slice(0, 300);
  }

  // 2) Estado anterior + transicao.
  let prev: HealthState | null = null;
  try {
    const row = await prisma.monitorState.findUnique({ where: { id: 'health' } });
    prev = (row?.state as HealthState) ?? null;
  } catch {
    prev = null;
  }
  const t = nextTransition(prev, isHealthy);

  // 3) Persiste (best-effort). So notifica se conseguiu persistir — assim, com o
  //    banco totalmente fora (nao persiste), nao viramos uma metralhadora de
  //    e-mail: quem cobre esse caso e o monitor externo.
  let persisted = false;
  try {
    await prisma.monitorState.upsert({
      where: { id: 'health' },
      update: { state: t.state, detail, ...(t.state !== prev ? { since: new Date() } : {}) },
      create: { id: 'health', state: t.state, detail },
    });
    persisted = true;
  } catch {
    persisted = false;
  }

  // 4) Alerta por e-mail apenas na virada.
  let emailed = false;
  if (persisted && t.notify === 'down') {
    emailed = await sendAlertEmail(
      '🔴 Nosso Passo: verificação interna FALHOU',
      `O vigia interno detectou um problema no backend.\n\nDetalhe: ${detail}\nQuando: ${new Date().toISOString()}\n\n(Você recebe este aviso uma vez; o próximo e-mail será só quando recuperar.)`,
    );
  } else if (persisted && t.notify === 'recovery') {
    emailed = await sendAlertEmail(
      '🟢 Nosso Passo: verificação interna recuperada',
      `O backend voltou ao normal.\n\nQuando: ${new Date().toISOString()}`,
    );
  }

  return NextResponse.json(
    { state: t.state, healthy: isHealthy, notify: t.notify, emailed, detail },
    { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } },
  );
}
