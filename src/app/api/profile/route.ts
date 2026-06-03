import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

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
      // Keep user-123 for demo email so mock loads properly
      const uid = email === 'responsavel@exemplo.com' ? 'user-123' : 'user-' + Math.random().toString(36).substring(2, 9);
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

    const updated = await prisma.userProfile.update({
      where: { uid },
      data: {
        childHyperfocus: updates.childHyperfocus,
        parentPinCode: updates.parentPinCode,
        lockType: updates.lockType,
        plan: updates.plan,
        sensorySpeed: updates.sensorySpeed,
        sensorySound: updates.sensorySound,
        sensoryVisuals: updates.sensoryVisuals,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
