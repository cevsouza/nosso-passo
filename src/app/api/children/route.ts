import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET(req: Request) {
  try {
    const userUid = req.headers.get('x-user-uid');
    if (!userUid) {
      return NextResponse.json({ error: 'UID do usuário é obrigatório' }, { status: 400 });
    }

    // 1. Fetch children
    let children = await prisma.child.findMany({
      where: { parentUid: userUid },
      orderBy: { createdAt: 'asc' },
    });

    // 2. If no children exist, create a default child (auto-seed)
    if (children.length === 0) {
      // Find parent to inherit settings if possible
      const parent = await prisma.userProfile.findUnique({
        where: { uid: userUid }
      });

      const defaultChild = await prisma.child.create({
        data: {
          name: 'Meu Pequeno',
          birthDate: '',
          gender: 'Não Informado',
          diagnosis: 'Não Informado',
          childHyperfocus: parent?.childHyperfocus || '',
          parentPinCode: parent?.parentPinCode || '1234',
          lockType: parent?.lockType || 'math',
          sensorySpeed: parent?.sensorySpeed || 1.0,
          sensorySound: parent?.sensorySound || 'marimba',
          sensoryVisuals: parent?.sensoryVisuals || 'rich',
          sensoryProfile: parent?.sensoryProfile || 'balanced',
          timerStyle: parent?.timerStyle || 'circle',
          // Rede de seguranca para contas antigas, criadas antes de o cadastro
          // pedir o nome. Nasce em foco, como toda crianca nova.
          interfaceMode: 'foco',
          parentUid: userUid,
        }
      });

      children = [defaultChild];

      // 3. Migrate any existing unassociated tasks to this default child
      await prisma.task.updateMany({
        where: { userUid, childId: null },
        data: { childId: defaultChild.id }
      });
    }

    return NextResponse.json(children);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userUid = req.headers.get('x-user-uid');
    if (!userUid) {
      return NextResponse.json({ error: 'UID do usuário é obrigatório' }, { status: 400 });
    }

    const body = await req.json();
    const { name, birthDate, gender, diagnosis } = body;

    if (!name) {
      return NextResponse.json({ error: 'Nome da criança é obrigatório' }, { status: 400 });
    }

    // Create child with standard defaults
    const child = await prisma.child.create({
      data: {
        name,
        birthDate: birthDate || '',
        gender: gender || 'Não Informado',
        diagnosis: diagnosis || 'Não Informado',
        childHyperfocus: body.childHyperfocus || '',
        parentPinCode: body.parentPinCode || '1234',
        lockType: body.lockType || 'math',
        sensorySpeed: body.sensorySpeed || 1.0,
        sensorySound: body.sensorySound || 'marimba',
        sensoryVisuals: body.sensoryVisuals || 'rich',
        sensoryProfile: body.sensoryProfile || 'balanced',
        timerStyle: body.timerStyle || 'circle',
        interfaceMode: body.interfaceMode || 'foco',
        rewardName: body.rewardName || '15 minutos de tablet',
        rewardCost: body.rewardCost !== undefined ? Number(body.rewardCost) : 10,
        tokens: body.tokens !== undefined ? Number(body.tokens) : 0,
        transitionMinutes: body.transitionMinutes !== undefined ? Number(body.transitionMinutes) : 5,
        parentUid: userUid,
      }
    });

    // Sem tarefas de brinde aqui, de proposito.
    //
    // Antes esta rota semeava 7 tarefas no **dia 1** e sem mes/ano — que a
    // consulta por mes nao encontra. A familia ganhava uma rotina invisivel:
    // o banco tinha 7 linhas e a tela da crianca continuava vazia, sem que
    // ninguem entendesse por que.
    //
    // Quem oferece rotina agora e a Rotina Pronta, no painel: por momento do
    // dia, no dia certo, escolhida pela familia e apagavel item a item.
    return NextResponse.json(child);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID da criança é obrigatório' }, { status: 400 });
    }

    const updatedChild = await prisma.child.update({
      where: { id },
      data: {
        name: updates.name,
        birthDate: updates.birthDate,
        gender: updates.gender,
        diagnosis: updates.diagnosis,
        childHyperfocus: updates.childHyperfocus,
        parentPinCode: updates.parentPinCode,
        lockType: updates.lockType,
        sensorySpeed: updates.sensorySpeed,
        sensorySound: updates.sensorySound,
        sensoryVisuals: updates.sensoryVisuals,
        sensoryProfile: updates.sensoryProfile,
        timerStyle: updates.timerStyle,
        interfaceMode: updates.interfaceMode,
        rewardName: updates.rewardName,
        rewardCost: updates.rewardCost !== undefined ? Number(updates.rewardCost) : undefined,
        tokens: updates.tokens !== undefined ? Number(updates.tokens) : undefined,
        transitionMinutes: updates.transitionMinutes !== undefined ? Number(updates.transitionMinutes) : undefined,
        sharingCode: updates.sharingCode,
        collectedParts: updates.collectedParts !== undefined ? Number(updates.collectedParts) : undefined,
        toyInventory: updates.toyInventory,
        emotionalBattery: updates.emotionalBattery,
        audioAlert10: updates.audioAlert10,
        audioAlert5: updates.audioAlert5,
        audioAlert2: updates.audioAlert2,
        monthlyTemplate: updates.monthlyTemplate,
        emergencyFirstThen: updates.emergencyFirstThen !== undefined ? Boolean(updates.emergencyFirstThen) : undefined,
        behaviorDictionary: updates.behaviorDictionary,
        unexpectedChange: updates.unexpectedChange,
        aacCustomItems: updates.aacCustomItems,
        customStories: updates.customStories,
        levelSuggestionState: updates.levelSuggestionState,
      }
    });

    return NextResponse.json(updatedChild);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID da criança é obrigatório' }, { status: 400 });
    }

    await prisma.child.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
