import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import {
  suggestLevel,
  evolutionReport,
  parseLevelState,
  dismissLevelSuggestion,
  InterfaceMode,
} from '../../../lib/insights';

// Leitura dos dados que a crianca ja gerou. Nao guarda nada (exceto a dispensa
// de uma sugestao, no PATCH) e nao decide nada — devolve o que os numeros
// dizem, para o adulto decidir.
//
// Existe como rota, e nao como calculo no cliente, por um motivo pratico: o
// painel so carrega o mes corrente, e a janela util aqui atravessa a virada do
// mes. E porque o portal do profissional precisa exatamente da mesma conta.

const LOOKBACK_DAYS = 70; // 4 semanas de sugestao + 2 janelas de 14 dias, com folga

// Somente o responsavel. O "desde a sua ultima visita" do profissional NAO
// mora aqui de proposito: /api/therapist carimba AccessCode.lastUsedAt na
// entrada, entao qualquer chamada posterior ja veria a visita atual como
// "ultima". Aquela conta vive dentro daquela rota, onde o valor anterior ainda
// existe.
type Auth =
  | { ok: true; childId: string }
  | { ok: false; status: number; error: string };

async function authorize(req: Request, childId: string | null): Promise<Auth> {
  const uid = req.headers.get('x-user-uid');
  if (!childId) return { ok: false, status: 400, error: 'ID da criança é obrigatório.' };
  if (!uid) return { ok: false, status: 401, error: 'Não autenticado.' };

  const owned = await prisma.child.findFirst({ where: { id: childId, parentUid: uid } });
  if (!owned) return { ok: false, status: 403, error: 'Não autorizado.' };
  return { ok: true, childId };
}

/** Tarefas dos meses que a janela de lookback atravessa. */
async function loadTasks(childId: string, now: Date) {
  const from = new Date(now.getTime() - LOOKBACK_DAYS * 86400000);
  const months: { month: number; year: number }[] = [];
  const cursor = new Date(from.getFullYear(), from.getMonth(), 1);
  while (cursor <= now) {
    months.push({ month: cursor.getMonth() + 1, year: cursor.getFullYear() });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return prisma.task.findMany({
    where: { childId, OR: months },
    select: { day: true, month: true, year: true, isCompleted: true, category: true, period: true, title: true, time: true },
  });
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const childId = url.searchParams.get('childId');
    const auth = await authorize(req, childId);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const now = new Date();
    const child = await prisma.child.findUnique({
      where: { id: auth.childId },
      select: { id: true, name: true, interfaceMode: true, levelSuggestionState: true },
    });
    if (!child) return NextResponse.json({ error: 'Criança não encontrada.' }, { status: 404 });

    const since = new Date(now.getTime() - LOOKBACK_DAYS * 86400000);
    const [tasks, logs] = await Promise.all([
      loadTasks(auth.childId, now),
      prisma.sensoryLog.findMany({
        where: { childId: auth.childId, timestamp: { gte: since } },
        select: { timestamp: true, crisisOccurred: true, mood: true, trigger: true, decibels: true, lightLevel: true, notes: true, loggedBy: true },
        orderBy: { timestamp: 'desc' },
      }),
    ]);

    const days = Number(url.searchParams.get('days') || 14);

    return NextResponse.json({
      childId: child.id,
      childName: child.name,
      interfaceMode: child.interfaceMode,
      evolution: evolutionReport(tasks as any, logs as any, { now, days: days > 0 && days <= 60 ? days : 14 }),
      levelSuggestion: suggestLevel({
        mode: (child.interfaceMode || 'completo') as InterfaceMode,
        tasks: tasks as any,
        logs: logs as any,
        now,
        state: parseLevelState(child.levelSuggestionState),
      }),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// "Agora nao" para a sugestao de nivel. Guardar isso e o que permite ao produto
// parar de insistir depois de tres recusas — e registrar que o nivel nao era o
// problema daquela familia.
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const childId = body?.childId;
    const auth = await authorize(req, childId || null);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const direction = body?.direction === 'down' ? 'down' : 'up';
    const child = await prisma.child.findUnique({
      where: { id: auth.childId },
      select: { interfaceMode: true, levelSuggestionState: true },
    });
    if (!child) return NextResponse.json({ error: 'Criança não encontrada.' }, { status: 404 });

    const next = dismissLevelSuggestion(parseLevelState(child.levelSuggestionState), {
      direction,
      from: (child.interfaceMode || 'completo') as InterfaceMode,
    } as any);

    await prisma.child.update({
      where: { id: auth.childId },
      data: { levelSuggestionState: JSON.stringify(next) },
    });

    return NextResponse.json({ ok: true, state: next });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
