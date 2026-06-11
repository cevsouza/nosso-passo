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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sharingCode, action } = body;

    if (!sharingCode) {
      return NextResponse.json({ error: 'Código de compartilhamento é obrigatório.' }, { status: 400 });
    }

    // Verify sharingCode is valid for this child
    const child = await prisma.child.findUnique({
      where: { sharingCode }
    });

    if (!child) {
      return NextResponse.json({ error: 'Código de compartilhamento inválido.' }, { status: 404 });
    }

    if (action === 'CREATE_TASK') {
      const { taskData } = body;
      if (!taskData || !taskData.title) {
        return NextResponse.json({ error: 'Dados da tarefa inválidos.' }, { status: 400 });
      }

      const newTask = await prisma.task.create({
        data: {
          title: taskData.title,
          time: taskData.time || '08:00',
          period: taskData.period || 'manhã',
          day: taskData.day || '1',
          order: taskData.order || 1,
          icon: taskData.icon || '📅',
          customIcon: taskData.customIcon || null,
          category: taskData.category || 'AVD',
          duration: taskData.duration !== undefined ? Number(taskData.duration) : 30,
          description: taskData.description || '',
          childId: child.id,
          userUid: child.parentUid
        }
      });

      return NextResponse.json(newTask);
    }

    if (action === 'DELETE_TASK') {
      const { taskId } = body;
      if (!taskId) {
        return NextResponse.json({ error: 'ID da tarefa é obrigatório.' }, { status: 400 });
      }

      // Check if task belongs to this child
      const task = await prisma.task.findUnique({
        where: { id: taskId }
      });

      if (!task || task.childId !== child.id) {
        return NextResponse.json({ error: 'Tarefa não associada a este paciente.' }, { status: 403 });
      }

      await prisma.task.delete({
        where: { id: taskId }
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Ação não suportada.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { sharingCode, action } = body;

    if (!sharingCode) {
      return NextResponse.json({ error: 'Código de compartilhamento é obrigatório.' }, { status: 400 });
    }

    const child = await prisma.child.findUnique({
      where: { sharingCode }
    });

    if (!child) {
      return NextResponse.json({ error: 'Código de compartilhamento inválido.' }, { status: 404 });
    }

    // Default to 'UPDATE_CHECKPOINT' if action is not specified (for backward compatibility)
    const activeAction = action || 'UPDATE_CHECKPOINT';

    if (activeAction === 'UPDATE_CHECKPOINT') {
      const { checkpointId, updates } = body;
      if (!checkpointId) {
        return NextResponse.json({ error: 'ID do checkpoint é obrigatório.' }, { status: 400 });
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
          notes: updates.notes,
          feedback: updates.feedback,
          professionalName: updates.professionalName,
          professionalRole: updates.professionalRole,
          date: updates.date || new Date().toISOString().split('T')[0],
        }
      });

      return NextResponse.json(updatedCheckpoint);
    }

    if (activeAction === 'UPDATE_TASK') {
      const { taskId, updates } = body;
      if (!taskId) {
        return NextResponse.json({ error: 'ID da tarefa é obrigatório.' }, { status: 400 });
      }

      // Check if task belongs to this child
      const task = await prisma.task.findUnique({
        where: { id: taskId }
      });

      if (!task || task.childId !== child.id) {
        return NextResponse.json({ error: 'Tarefa não associada a este paciente.' }, { status: 403 });
      }

      // Build data payload dynamically depending on which updates were provided
      const updateData: any = {};
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.time !== undefined) updateData.time = updates.time;
      if (updates.period !== undefined) updateData.period = updates.period;
      if (updates.day !== undefined) updateData.day = updates.day;
      if (updates.isCompleted !== undefined) updateData.isCompleted = updates.isCompleted;
      if (updates.order !== undefined) updateData.order = updates.order;
      if (updates.icon !== undefined) updateData.icon = updates.icon;
      if (updates.customIcon !== undefined) updateData.customIcon = updates.customIcon;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.duration !== undefined) updateData.duration = Number(updates.duration);
      if (updates.description !== undefined) updateData.description = updates.description;

      const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: updateData
      });

      return NextResponse.json(updatedTask);
    }

    return NextResponse.json({ error: 'Ação não suportada.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
