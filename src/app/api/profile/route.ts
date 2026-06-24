import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { hashPassword } from '../../../lib/auth-utils';

export async function POST(req: Request) {
  try {
    const { email, role } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'E-mail é obrigatório' }, { status: 400 });
    }

    // Find or create profile
    let profile = await prisma.userProfile.findUnique({
      where: { email },
    });

    if (!profile) {
      const uid = 'user-' + Math.random().toString(36).substring(2, 9);
      profile = await prisma.userProfile.create({
        data: {
          uid,
          email,
          role: role || (email.includes('crianca') || email.includes('child') || email.includes('usuario') ? 'usuario' : 'responsavel'),
          childHyperfocus: 'Border Collies 🐕',
          parentPinCode: '1234',
          lockType: 'math',
          plan: 'free',
          sensorySpeed: 1.0,
          sensorySound: 'marimba',
          sensoryVisuals: 'rich',
          sensoryProfile: 'balanced',
          timerStyle: 'circle',
        },
      });
    }

    return NextResponse.json(profile);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { uid, updates } = await req.json();
    if (!uid) {
      return NextResponse.json({ error: 'UID do usuário é obrigatório' }, { status: 400 });
    }

    const dataToUpdate: any = {
      childHyperfocus: updates.childHyperfocus,
      parentPinCode: updates.parentPinCode,
      lockType: updates.lockType,
      plan: updates.plan,
      sensorySpeed: updates.sensorySpeed,
      sensorySound: updates.sensorySound,
      sensoryVisuals: updates.sensoryVisuals,
      sensoryProfile: updates.sensoryProfile,
      timerStyle: updates.timerStyle,
    };

    if (updates.password) {
      dataToUpdate.passwordHash = hashPassword(updates.password);
    }

    const updated = await prisma.userProfile.update({
      where: { uid },
      data: dataToUpdate,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
