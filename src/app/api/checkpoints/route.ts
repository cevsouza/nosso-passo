import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const childId = req.headers.get('x-child-id') || searchParams.get('childId');

    if (!childId) {
      return NextResponse.json({ error: 'ID da criança é obrigatório' }, { status: 400 });
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
