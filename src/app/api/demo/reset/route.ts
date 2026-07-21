import { NextResponse } from 'next/server';
import { resetDemoAccount, DEMO_UID, DEMO_EMAIL } from '../../../../lib/demo-seed';

// Recria a conta de demonstracao de vendas do zero.
//
// Trava dupla, porque este endpoint apaga dados:
//  1. so roda se DEMO_SEED_TOKEN estiver configurado no ambiente;
//  2. exige o mesmo token no cabecalho x-demo-token.
// O alvo e fixo no codigo (DEMO_UID) — nao vem da requisicao —, entao nao ha
// como apontar este endpoint para a conta de um cliente real.

export const dynamic = 'force-dynamic';

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function POST(req: Request) {
  const expected = process.env.DEMO_SEED_TOKEN;
  if (!expected) {
    return NextResponse.json(
      { error: 'Reset da demonstração desabilitado: DEMO_SEED_TOKEN não está configurado.' },
      { status: 503 }
    );
  }

  const provided = req.headers.get('x-demo-token') || '';
  if (!timingSafeEqual(provided, expected)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  try {
    const summary = await resetDemoAccount();
    return NextResponse.json({
      ok: true,
      uid: DEMO_UID,
      loginUrl: '/login',
      ...summary,
      note: `Conta ${DEMO_EMAIL} recriada. Rotina gerada para o mês corrente.`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
