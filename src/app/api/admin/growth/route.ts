import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { DEMO_UID } from '../../../../lib/demo-credentials';
import { SOURCE_KEYS } from '../../../../lib/growth';

// Os numeros da semana, para nao ter que contar a mao.
// Leitura pura, protegida por ADMIN_TOKEN no cabecalho x-admin-token.
// A conta de demonstracao fica de fora de tudo — ela falsearia todo numero.

export const dynamic = 'force-dynamic';

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000);

export async function GET(req: Request) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) {
    return NextResponse.json(
      { error: 'Painel de números desabilitado: ADMIN_TOKEN não está configurado.' },
      { status: 503 }
    );
  }
  if (!timingSafeEqual(req.headers.get('x-admin-token') || '', expected)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  try {
    const semAdemo = { uid: { not: DEMO_UID } };
    const criancasReais = { parent: { uid: { not: DEMO_UID } } };

    const [totalContas, contas7d, contas30d, pagantes, comPremio] = await Promise.all([
      prisma.userProfile.count({ where: semAdemo }),
      prisma.userProfile.count({ where: { ...semAdemo, createdAt: { gte: daysAgo(7) } } }),
      prisma.userProfile.count({ where: { ...semAdemo, createdAt: { gte: daysAgo(30) } } }),
      prisma.userProfile.count({ where: { ...semAdemo, plan: 'premium' } }),
      prisma.userProfile.count({ where: { ...semAdemo, premiumUntil: { gt: new Date() } } }),
    ]);

    // O numero que importa: crianca que concluiu tarefa na semana.
    const [criancas, ativas7d, ativas30d] = await Promise.all([
      prisma.child.count({ where: criancasReais }),
      prisma.child.count({ where: { ...criancasReais, lastActiveAt: { gte: daysAgo(7) } } }),
      prisma.child.count({ where: { ...criancasReais, lastActiveAt: { gte: daysAgo(30) } } }),
    ]);

    // De onde veio quem se cadastrou.
    const porOrigem = await prisma.userProfile.groupBy({
      by: ['referralSource'],
      where: semAdemo,
      _count: { _all: true },
    });
    const origem: Record<string, number> = { naoInformado: 0 };
    SOURCE_KEYS.forEach((k) => (origem[k] = 0));
    porOrigem.forEach((row) => {
      const key = row.referralSource || 'naoInformado';
      origem[key] = (origem[key] || 0) + row._count._all;
    });

    // O que as pessoas escreveram quando marcaram "outro" — e onde aparece o
    // canal que ninguem tinha previsto.
    const detalhes = await prisma.userProfile.findMany({
      where: { ...semAdemo, referralDetail: { not: null } },
      select: { referralDetail: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    const indicados = await prisma.userProfile.count({
      where: { ...semAdemo, referredByUid: { not: null } },
    });

    // Códigos de profissional realmente em uso (mede as alavancas 2 e 3).
    const [codigos, codigosUsados] = await Promise.all([
      prisma.accessCode.count({ where: { revoked: false, child: criancasReais } }),
      prisma.accessCode.count({
        where: { revoked: false, child: criancasReais, lastUsedAt: { gte: daysAgo(30) } },
      }),
    ]);

    return NextResponse.json({
      geradoEm: new Date().toISOString(),
      contas: { total: totalContas, novas7d: contas7d, novas30d: contas30d },
      criancas: { total: criancas, ativas7d, ativas30d },
      pagantes,
      premioIndicacaoAtivo: comPremio,
      indicacao: { contasQueVieramDeIndicacao: indicados },
      codigosProfissionais: { ativos: codigos, usadosEm30d: codigosUsados },
      origem,
      outrosDetalhes: detalhes.map((d) => d.referralDetail),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
