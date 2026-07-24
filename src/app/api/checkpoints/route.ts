import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

// Acompanhamentos: a devolutiva escrita pelo profissional e o relato dos pais.
//
// ⚠️ As tres rotas nao verificavam nada. Bastava conhecer um `childId` para
// ler a devolutiva clinica sobre uma crianca, reescrever a devolutiva de um
// terapeuta ou apagar o relato de uma familia. O `childId` circula em URL
// (`/routine?childId=...`) e nunca foi um segredo.
//
// Mesma regra das demais rotas da rede de apoio: ou voce e o responsavel pela
// crianca, ou apresenta um codigo de acesso valido para ELA.

async function resolveCode(raw: string | null) {
  if (!raw) return null;
  const code = raw.trim();
  const ac = await prisma.accessCode.findUnique({ where: { code } });
  if (ac) {
    if (ac.revoked) return null;
    if (ac.expiresAt && ac.expiresAt.getTime() < Date.now()) return null;
    return { childId: ac.childId, role: ac.role };
  }
  const child = await prisma.child.findUnique({ where: { sharingCode: code } });
  if (child) return { childId: child.id, role: 'therapist' };
  return null;
}

/**
 * `needWrite` exige papel que possa escrever. A escola le e registra pelos
 * sensory-logs, mas nao assina devolutiva clinica — isso e do terapeuta e do
 * responsavel.
 */
async function autorizado(req: Request, childId: string, needWrite: boolean) {
  const uid = req.headers.get('x-user-uid');
  if (uid) {
    const dono = await prisma.child.findFirst({ where: { id: childId, parentUid: uid } });
    if (dono) return true;
  }
  const code = await resolveCode(req.headers.get('x-share-code'));
  if (code && code.childId === childId) {
    return needWrite ? code.role === 'therapist' : true;
  }
  return false;
}

/** O checkpoint so diz a que crianca pertence depois de buscado. */
async function childIdDoCheckpoint(id: string) {
  const cp = await prisma.checkpoint.findUnique({ where: { id }, select: { childId: true } });
  return cp?.childId || null;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const childId = req.headers.get('x-child-id') || searchParams.get('childId');

    if (!childId) {
      return NextResponse.json({ error: 'ID da criança é obrigatório' }, { status: 400 });
    }
    if (!(await autorizado(req, childId, false))) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
    }

    let checkpoints = await prisma.checkpoint.findMany({
      where: { childId },
      orderBy: { weekNum: 'asc' },
    });

    // Auto-initialize 4 weekly checkpoints if none exist for this child
    if (checkpoints.length === 0) {
      const defaultCheckpoints = Array.from({ length: 4 }).map((_, idx) => ({
        weekNum: idx + 1,
        status: 'pending',
        notes: '',
        feedback: '',
        professionalName: '',
        professionalRole: 'Psicologia ABA',
        date: '',
        childId,
      }));

      await prisma.checkpoint.createMany({
        data: defaultCheckpoints,
      });

      checkpoints = await prisma.checkpoint.findMany({
        where: { childId },
        orderBy: { weekNum: 'asc' },
      });
    }

    return NextResponse.json(checkpoints);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { childId, date, feedback, professionalName, professionalRole, notes, status, weekNum } = body;

    if (!childId || !date) {
      return NextResponse.json({ error: 'ID da criança e data são obrigatórios' }, { status: 400 });
    }
    if (!(await autorizado(req, childId, true))) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
    }

    // Check if checkpoint already exists for this date and child
    const existing = await prisma.checkpoint.findFirst({
      where: { childId, date }
    });

    let checkpoint;
    if (existing) {
      checkpoint = await prisma.checkpoint.update({
        where: { id: existing.id },
        data: {
          feedback: feedback || '',
          professionalName: professionalName || '',
          professionalRole: professionalRole || '',
          notes: notes || '',
          status: status || 'completed',
          weekNum: weekNum || 1,
        }
      });
    } else {
      checkpoint = await prisma.checkpoint.create({
        data: {
          childId,
          date,
          feedback: feedback || '',
          professionalName: professionalName || '',
          professionalRole: professionalRole || 'Psicologia ABA',
          notes: notes || '',
          status: status || 'completed',
          weekNum: weekNum || 1,
        }
      });
    }

    return NextResponse.json(checkpoint);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID do checkpoint é obrigatório' }, { status: 400 });
    }

    const childId = await childIdDoCheckpoint(id);
    if (!childId) {
      return NextResponse.json({ error: 'Acompanhamento não encontrado.' }, { status: 404 });
    }
    if (!(await autorizado(req, childId, true))) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
    }

    const updated = await prisma.checkpoint.update({
      where: { id },
      data: {
        status: updates.status,
        notes: updates.notes,
        feedback: updates.feedback,
        professionalName: updates.professionalName,
        professionalRole: updates.professionalRole,
        date: updates.date,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
