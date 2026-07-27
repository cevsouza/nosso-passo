import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

// Health check externo. Existe para a UptimeRobot (monitor de keyword) saber que
// o app esta DE PE de verdade — nao so respondendo HTTP, mas com o banco vivo.
//
// - Banco responde  -> 200 com "status":"ok"  (a keyword que o monitor procura)
// - Banco fora       -> 503 sem "ok"           (o monitor dispara o alerta)
//
// Nunca pode ser cacheado (senao o monitor veria um "ok" velho de um app morto).
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const startedAt = Date.now();
  try {
    // Ping barato: so confirma que a conexao com o Postgres esta viva.
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json(
      { status: 'ok', db: 'up', ms: Date.now() - startedAt, time: new Date().toISOString() },
      { status: 200, headers: { 'Cache-Control': 'no-store, max-age=0' } },
    );
  } catch (error: any) {
    return NextResponse.json(
      { status: 'error', db: 'down', error: error?.message || 'db unreachable', time: new Date().toISOString() },
      { status: 503, headers: { 'Cache-Control': 'no-store, max-age=0' } },
    );
  }
}
