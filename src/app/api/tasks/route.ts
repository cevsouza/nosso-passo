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

    if (Array.isArray(taskData)) {
      // Bulk create tasks
      const createdTasks = [];
      for (const t of taskData) {
        const newTask = await prisma.task.create({
          data: {
            title: t.title,
            time: t.time,
            period: t.period,
            day: t.day,
            order: t.order || 1,
            icon: t.icon || "📅",
            customIcon: t.customIcon || null,
            category: t.category || "AVD",
            duration: t.duration !== undefined ? Number(t.duration) : 30,
            description: t.description || "",
            userUid,
            childId: childId || null,
          },
        });
        createdTasks.push(newTask);
      }
      return NextResponse.json(createdTasks);
    } else {
      const newTask = await prisma.task.create({
        data: {
          title: taskData.title,
          time: taskData.time,
          period: taskData.period,
          day: taskData.day,
          order: taskData.order || 1,
          icon: taskData.icon || "📅",
          customIcon: taskData.customIcon || null,
          category: taskData.category || "AVD",
          duration: taskData.duration !== undefined ? Number(taskData.duration) : 30,
          description: taskData.description || "",
          userUid,
          childId: childId || null,
        },
      });
      return NextResponse.json(newTask);
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const userUid = req.headers.get('x-user-uid') || 'user-123';
    const childId = req.headers.get('x-child-id');
    const body = await req.json();

    if (body.resetCompletions) {
      if (childId) {
        await prisma.task.updateMany({
          where: { childId },
          data: { isCompleted: false },
        });
        const updatedTasks = await prisma.task.findMany({
          where: { childId },
          orderBy: [{ day: 'asc' }, { time: 'asc' }],
        });
        return NextResponse.json(updatedTasks);
      } else {
        await prisma.task.updateMany({
          where: { userUid },
          data: { isCompleted: false },
        });
        const updatedTasks = await prisma.task.findMany({
          where: { userUid },
          orderBy: [{ day: 'asc' }, { time: 'asc' }],
        });
        return NextResponse.json(updatedTasks);
      }
    }

    if (body.overwrite && Array.isArray(body.tasks)) {
      // Bulk overwrite tasks (loadTemplate, resetToDefaults, etc.)
      if (childId) {
        await prisma.task.deleteMany({
          where: { childId },
        });

        await prisma.task.createMany({
          data: body.tasks.map((t: any, idx: number) => ({
            title: t.title,
            time: t.time,
            period: t.period,
            day: t.day,
            isCompleted: t.isCompleted ?? false,
            order: idx + 1,
            icon: t.icon || "📅",
            customIcon: t.customIcon || null,
            category: t.category || "AVD",
            duration: t.duration !== undefined ? Number(t.duration) : 30,
            description: t.description || "",
            userUid,
            childId,
          })),
        });

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
              icon: t.icon || "📅",
              customIcon: t.customIcon || null,
              category: t.category || "AVD",
              duration: t.duration !== undefined ? Number(t.duration) : 30,
              description: t.description || "",
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

    const updateData: any = {};
    if (updates.title !== undefined && updates.title !== null) updateData.title = updates.title;
    if (updates.time !== undefined && updates.time !== null) updateData.time = updates.time;
    if (updates.period !== undefined && updates.period !== null) updateData.period = updates.period;
    if (updates.day !== undefined && updates.day !== null) updateData.day = updates.day;
    if (updates.isCompleted !== undefined && updates.isCompleted !== null) updateData.isCompleted = updates.isCompleted;
    if (updates.order !== undefined && updates.order !== null) updateData.order = updates.order;
    if (updates.icon !== undefined && updates.icon !== null) updateData.icon = updates.icon;
    if (updates.customIcon !== undefined) updateData.customIcon = updates.customIcon;
    if (updates.category !== undefined && updates.category !== null) updateData.category = updates.category;
    if (updates.duration !== undefined && updates.duration !== null) {
      updateData.duration = Number(updates.duration);
    }
    if (updates.description !== undefined && updates.description !== null) updateData.description = updates.description;

    const updated = await prisma.task.update({
      where: { id },
      data: updateData,
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
    const day = searchParams.get('day');
    const childId = req.headers.get('x-child-id');
    const userUid = req.headers.get('x-user-uid') || 'user-123';

    if (day) {
      if (childId) {
        await prisma.task.deleteMany({
          where: { childId, day },
        });
      } else {
        await prisma.task.deleteMany({
          where: { userUid, day },
        });
      }
      return NextResponse.json({ success: true });
    }

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
