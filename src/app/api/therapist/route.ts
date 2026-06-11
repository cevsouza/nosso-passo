import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sharingCode = searchParams.get('sharingCode');

    if (!sharingCode) {
      return NextResponse.json({ error: 'Código de compartilhamento é obrigatório' }, { status: 400 });
    }

    // Find child by sharingCode
    const child = await prisma.child.findUnique({
      where: { sharingCode },
      include: {
        tasks: {
          orderBy: [{ day: 'asc' }, { time: 'asc' }]
        },
        sensoryLogs: {
          orderBy: { timestamp: 'desc' },
          take: 100
        },
        checkpoints: {
          orderBy: { weekNum: 'asc' }
        }
      }
    });

    if (!child) {
      return NextResponse.json({ error: 'Código de compartilhamento inválido ou inativo.' }, { status: 404 });
    }

    return NextResponse.json(child);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { sharingCode, checkpointId, updates } = body;

    if (!sharingCode || !checkpointId) {
      return NextResponse.json({ error: 'Código de compartilhamento e ID do checkpoint são obrigatórios.' }, { status: 400 });
    }

    // Verify sharingCode is valid for this child
    const child = await prisma.child.findUnique({
      where: { sharingCode }
    });

    if (!child) {
      return NextResponse.json({ error: 'Código de compartilhamento inválido.' }, { status: 404 });
    }

    // Check if the checkpoint belongs to this child
    const checkpoint = await prisma.checkpoint.findUnique({
      where: { id: checkpointId }
    });

    if (!checkpoint || checkpoint.childId !== child.id) {
      return NextResponse.json({ error: 'Checkpoint inválido ou não associado a esta criança.' }, { status: 403 });
    }

    // Update checkpoint
    const updatedCheckpoint = await prisma.checkpoint.update({
      where: { id: checkpointId },
      data: {
        status: updates.status || 'completed',
        notes: updates.notes, // optionally allow updating parental notes or keep it
        feedback: updates.feedback,
        professionalName: updates.professionalName,
        professionalRole: updates.professionalRole,
        date: updates.date || new Date().toISOString().split('T')[0],
      }
    });

    return NextResponse.json(updatedCheckpoint);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
