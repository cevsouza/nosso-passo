import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

// Registro de auditoria — o que o responsavel mexeu na conta DELE.
//
// ⚠️ Esta rota vazava. O GET era `findMany({ take: 50 })`: sem `where` e sem
// autenticacao nenhuma. Qualquer pessoa, logada ou nao, recebia os ultimos 50
// registros do banco INTEIRO — e-mail de outros responsaveis e detalhes que
// carregam **nome de crianca** e o que mudou no perfil dela. Dado sensivel de
// menor, nos termos dos arts. 11 e 14 da LGPD, aberto na rua.
//
// O POST tinha o irmao do mesmo problema: aceitava `responsibleEmail` do corpo
// da requisicao. Um registro de auditoria que qualquer um assina com o nome de
// outro nao serve de auditoria — e exatamente a coisa que ele deveria provar
// que nao aconteceu.
//
// Agora as duas pontas exigem o uid, e o e-mail vem SEMPRE do banco.

async function usuario(req: Request) {
  const uid = req.headers.get('x-user-uid');
  if (!uid) return null;
  return prisma.userProfile.findUnique({ where: { uid }, select: { email: true } });
}

export async function GET(req: Request) {
  try {
    const user = await usuario(req);
    if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });

    const logs = await prisma.auditLog.findMany({
      where: { responsibleEmail: user.email },
      orderBy: { timestamp: 'desc' },
      take: 50,
    });

    return NextResponse.json(
      logs.map((log) => ({
        id: log.id,
        timestamp: log.timestamp.toISOString(),
        responsibleEmail: log.responsibleEmail,
        action: log.action as any,
        details: log.details,
      }))
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await usuario(req);
    if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });

    const { action, details } = await req.json();

    const log = await prisma.auditLog.create({
      data: {
        action: String(action || '').slice(0, 60),
        details: String(details || '').slice(0, 2000),
        // Do banco, nunca do corpo: e isso que impede assinar em nome de outro.
        responsibleEmail: user.email,
      },
    });

    return NextResponse.json({
      id: log.id,
      timestamp: log.timestamp.toISOString(),
      responsibleEmail: log.responsibleEmail,
      action: log.action,
      details: log.details,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
