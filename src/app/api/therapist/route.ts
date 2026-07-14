import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

// ---- Access resolution (role-scoped codes + legacy sharingCode) ----
// Code may arrive via the `x-share-code` header (preferred, keeps it out of
// URLs/logs), or the legacy `?sharingCode=` query / `sharingCode` body field.

type Access =
  | { child: any; role: string }
  | { error: string; status: number };

async function resolveAccess(req: Request, bodyCode?: string): Promise<Access> {
  const url = new URL(req.url);
  const raw = req.headers.get('x-share-code') || bodyCode || url.searchParams.get('sharingCode');
  if (!raw) return { error: 'Código de compartilhamento é obrigatório.', status: 400 };
  const code = raw.trim();

  // 1) Role-scoped code (new model)
  const ac = await prisma.accessCode.findUnique({ where: { code }, include: { child: true } });
  if (ac) {
    if (ac.revoked) return { error: 'Código de acesso revogado.', status: 403 };
    if (ac.expiresAt && ac.expiresAt.getTime() < Date.now()) {
      return { error: 'Código de acesso expirado.', status: 403 };
    }
    // best-effort usage stamp; never block the request on this
    prisma.accessCode.update({ where: { id: ac.id }, data: { lastUsedAt: new Date() } }).catch(() => {});
    return { child: ac.child, role: ac.role };
  }

  // 2) Legacy full-access sharingCode -> therapist role (backward compat)
  const child = await prisma.child.findUnique({ where: { sharingCode: code } });
  if (child) return { child, role: 'therapist' };

  return { error: 'Código de compartilhamento inválido ou inativo.', status: 404 };
}

// Only the therapist role may write through this endpoint. School/read-only
// codes are read-only here (school contributes via /api/sensory-logs).
function canWrite(role: string) {
  return role === 'therapist';
}

export async function GET(req: Request) {
  try {
    const access = await resolveAccess(req);
    if ('error' in access) return NextResponse.json({ error: access.error }, { status: access.status });

    const full = await prisma.child.findUnique({
      where: { id: access.child.id },
      include: {
        tasks: { orderBy: [{ day: 'asc' }, { time: 'asc' }] },
        sensoryLogs: { orderBy: { timestamp: 'desc' }, take: 100 },
        checkpoints: { orderBy: { weekNum: 'asc' } },
      },
    });

    if (!full) {
      return NextResponse.json({ error: 'Código de compartilhamento inválido ou inativo.' }, { status: 404 });
    }

    // _role tells the client which actions to enable.
    return NextResponse.json({ ...full, _role: access.role });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const access = await resolveAccess(req, body.sharingCode);
    if ('error' in access) return NextResponse.json({ error: access.error }, { status: access.status });
    if (!canWrite(access.role)) {
      return NextResponse.json({ error: 'Este código é somente leitura.' }, { status: 403 });
    }
    const child = access.child;
    const { action } = body;

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
          userUid: child.parentUid,
        },
      });

      return NextResponse.json(newTask);
    }

    if (action === 'DELETE_TASK') {
      const { taskId } = body;
      if (!taskId) {
        return NextResponse.json({ error: 'ID da tarefa é obrigatório.' }, { status: 400 });
      }

      const task = await prisma.task.findUnique({ where: { id: taskId } });
      if (!task || task.childId !== child.id) {
        return NextResponse.json({ error: 'Tarefa não associada a este paciente.' }, { status: 403 });
      }

      await prisma.task.delete({ where: { id: taskId } });
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
    const access = await resolveAccess(req, body.sharingCode);
    if ('error' in access) return NextResponse.json({ error: access.error }, { status: access.status });
    if (!canWrite(access.role)) {
      return NextResponse.json({ error: 'Este código é somente leitura.' }, { status: 403 });
    }
    const child = access.child;

    // Default to 'UPDATE_CHECKPOINT' if action is not specified (backward compat)
    const activeAction = body.action || 'UPDATE_CHECKPOINT';

    if (activeAction === 'UPDATE_CHECKPOINT') {
      const { checkpointId, updates } = body;
      if (!checkpointId) {
        return NextResponse.json({ error: 'ID do checkpoint é obrigatório.' }, { status: 400 });
      }

      const checkpoint = await prisma.checkpoint.findUnique({ where: { id: checkpointId } });
      if (!checkpoint || checkpoint.childId !== child.id) {
        return NextResponse.json({ error: 'Checkpoint inválido ou não associado a esta criança.' }, { status: 403 });
      }

      const updatedCheckpoint = await prisma.checkpoint.update({
        where: { id: checkpointId },
        data: {
          status: updates.status || 'completed',
          notes: updates.notes,
          feedback: updates.feedback,
          professionalName: updates.professionalName,
          professionalRole: updates.professionalRole,
          date: updates.date || new Date().toISOString().split('T')[0],
        },
      });

      return NextResponse.json(updatedCheckpoint);
    }

    if (activeAction === 'UPDATE_TASK') {
      const { taskId, updates } = body;
      if (!taskId) {
        return NextResponse.json({ error: 'ID da tarefa é obrigatório.' }, { status: 400 });
      }

      const task = await prisma.task.findUnique({ where: { id: taskId } });
      if (!task || task.childId !== child.id) {
        return NextResponse.json({ error: 'Tarefa não associada a este paciente.' }, { status: 403 });
      }

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

      const updatedTask = await prisma.task.update({ where: { id: taskId }, data: updateData });
      return NextResponse.json(updatedTask);
    }

    return NextResponse.json({ error: 'Ação não suportada.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
