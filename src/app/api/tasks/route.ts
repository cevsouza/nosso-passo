import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

const DEFAULT_SEED_TASKS = [
  { title: 'Escovar os dentes 🪥', time: '08:00', period: 'manhã', day: 'segunda', order: 1 },
  { title: 'Tomar café da manhã 🍞', time: '08:30', period: 'manhã', day: 'segunda', order: 2 },
  { title: 'Aulas e Estudo 🏫', time: '09:00', period: 'manhã', day: 'segunda', order: 3 },
  { title: 'Almoço Saudável 🍲', time: '12:30', period: 'tarde', day: 'segunda', order: 4 },
  { title: 'Brincar com o Collie 🐶', time: '15:00', period: 'tarde', day: 'segunda', order: 5 },
  { title: 'Jantar em Família 🍽️', time: '19:00', period: 'noite', day: 'segunda', order: 6 },
  { title: 'Tomar Banho e Dormir 😴', time: '21:00', period: 'noite', day: 'segunda', order: 7 },
];

export async function GET(req: Request) {
  try {
    const userUid = req.headers.get('x-user-uid') || 'user-123';
    const childId = req.headers.get('x-child-id');

    // Verify user profile exists (create if not)
    let user = await prisma.userProfile.findUnique({ where: { uid: userUid } });
    if (!user) {
      user = await prisma.userProfile.create({
        data: {
          uid: userUid,
          email: userUid === 'user-123' ? 'responsavel@exemplo.com' : `${userUid}@demo.com`,
          childHyperfocus: 'Border Collies 🐕',
        }
      });
    }

    let dbTasks;
    if (childId) {
      dbTasks = await prisma.task.findMany({
        where: { childId },
        orderBy: [{ day: 'asc' }, { time: 'asc' }],
      });
    } else {
      dbTasks = await prisma.task.findMany({
        where: { userUid },
        orderBy: [{ day: 'asc' }, { time: 'asc' }],
      });
    }

    return NextResponse.json(dbTasks);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userUid = req.headers.get('x-user-uid') || 'user-123';
    const childId = req.headers.get('x-child-id');
    const taskData = await req.json();

    const newTask = await prisma.task.create({
      data: {
        title: taskData.title,
        time: taskData.time,
        period: taskData.period,
        day: taskData.day,
        order: taskData.order || 1,
        userUid,
        childId: childId || null,
      },
    });

    return NextResponse.json(newTask);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const userUid = req.headers.get('x-user-uid') || 'user-123';
    const childId = req.headers.get('x-child-id');
    const body = await req.json();

    if (body.overwrite && Array.isArray(body.tasks)) {
      // Bulk overwrite tasks (loadTemplate, resetToDefaults, etc.)
      if (childId) {
        await prisma.task.deleteMany({
          where: { childId },
        });

        if (body.tasks.length > 0) {
          await prisma.task.createMany({
            data: body.tasks.map((t: any, idx: number) => ({
              title: t.title,
              time: t.time,
              period: t.period,
              day: t.day,
              isCompleted: t.isCompleted ?? false,
              order: idx + 1,
              userUid,
              childId,
            })),
          });
        }

        const updatedTasks = await prisma.task.findMany({
          where: { childId },
          orderBy: [{ day: 'asc' }, { time: 'asc' }],
        });
        return NextResponse.json(updatedTasks);
      } else {
        await prisma.task.deleteMany({
          where: { userUid },
        });

        if (body.tasks.length > 0) {
          await prisma.task.createMany({
            data: body.tasks.map((t: any, idx: number) => ({
              title: t.title,
              time: t.time,
              period: t.period,
              day: t.day,
              isCompleted: t.isCompleted ?? false,
              order: idx + 1,
              userUid,
            })),
          });
        }

        const updatedTasks = await prisma.task.findMany({
          where: { userUid },
          orderBy: [{ day: 'asc' }, { time: 'asc' }],
        });
        return NextResponse.json(updatedTasks);
      }
    }

    // Single task update
    const { id, updates } = body;
    if (!id) {
      return NextResponse.json({ error: 'ID da tarefa é obrigatório' }, { status: 400 });
    }

    const updated = await prisma.task.update({
      where: { id },
      data: {
        title: updates.title,
        time: updates.time,
        period: updates.period,
        day: updates.day,
        isCompleted: updates.isCompleted,
        order: updates.order,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID da tarefa é obrigatório' }, { status: 400 });
    }

    await prisma.task.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
