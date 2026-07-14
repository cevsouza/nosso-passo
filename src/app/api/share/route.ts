import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

// Guardian-only management of role-scoped access codes for a child.
// Auth follows the app's existing pattern: the guardian's uid in `x-user-uid`.

const ROLES = ['therapist', 'school', 'readonly'];

function genCode() {
  // Unambiguous uppercase alphanumeric (no O/0/I/1).
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

async function ownedChild(uid: string, childId: string) {
  return prisma.child.findFirst({ where: { id: childId, parentUid: uid } });
}

export async function GET(req: Request) {
  try {
    const uid = req.headers.get('x-user-uid');
    const childId = new URL(req.url).searchParams.get('childId');
    if (!uid || !childId) {
      return NextResponse.json({ error: 'Parâmetros obrigatórios ausentes.' }, { status: 400 });
    }
    if (!(await ownedChild(uid, childId))) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
    }
    const codes = await prisma.accessCode.findMany({
      where: { childId },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(codes);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const uid = req.headers.get('x-user-uid');
    const body = await req.json();
    const { childId, role, label, expiresInDays } = body;
    if (!uid || !childId || !role) {
      return NextResponse.json({ error: 'Parâmetros obrigatórios ausentes.' }, { status: 400 });
    }
    if (!ROLES.includes(role)) {
      return NextResponse.json({ error: 'Papel inválido.' }, { status: 400 });
    }
    if (!(await ownedChild(uid, childId))) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
    }

    // Generate a unique code (retry on the rare collision).
    let code = genCode();
    for (let i = 0; i < 6; i++) {
      const clash = await prisma.accessCode.findUnique({ where: { code } });
      if (!clash) break;
      code = genCode();
    }

    const expiresAt =
      expiresInDays && Number(expiresInDays) > 0
        ? new Date(Date.now() + Number(expiresInDays) * 86400000)
        : null;

    const created = await prisma.accessCode.create({
      data: { code, role, label: (label || '').toString().slice(0, 80), childId, expiresAt },
    });
    return NextResponse.json(created);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const uid = req.headers.get('x-user-uid');
    const body = await req.json();
    const { id, revoked } = body;
    if (!uid || !id) {
      return NextResponse.json({ error: 'Parâmetros obrigatórios ausentes.' }, { status: 400 });
    }
    const ac = await prisma.accessCode.findUnique({ where: { id }, include: { child: true } });
    if (!ac || ac.child.parentUid !== uid) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
    }
    const updated = await prisma.accessCode.update({
      where: { id },
      data: { revoked: revoked !== false },
    });
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
