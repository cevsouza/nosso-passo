import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const childId = searchParams.get('childId');

    if (!childId) {
      return NextResponse.json({ error: 'ID da criança é obrigatório' }, { status: 400 });
    }

    const logs = await prisma.sensoryLog.findMany({
      where: { childId },
      orderBy: { timestamp: 'desc' },
      take: 100, // Limit to recent 100 entries for layout performance
    });

    const formatted = logs.map(log => ({
      id: log.id,
      timestamp: log.timestamp.toISOString(),
      mood: log.mood,
      crisisOccurred: log.crisisOccurred,
      notes: log.notes,
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { childId, mood, crisisOccurred, notes } = body;

    if (!childId) {
      return NextResponse.json({ error: 'ID da criança é obrigatório' }, { status: 400 });
    }

    const log = await prisma.sensoryLog.create({
      data: {
        childId,
        mood: mood || null,
        crisisOccurred: !!crisisOccurred,
        notes: notes || '',
      },
    });

    return NextResponse.json({
      id: log.id,
      timestamp: log.timestamp.toISOString(),
      mood: log.mood,
      crisisOccurred: log.crisisOccurred,
      notes: log.notes,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
