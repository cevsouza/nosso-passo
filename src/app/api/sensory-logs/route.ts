import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

// Resolve a share code to { childId, role }, honoring revocation/expiry.
// Falls back to the legacy Child.sharingCode as a therapist-role code.
async function resolveCode(raw: string | null) {
  if (!raw) return null;
  const code = raw.trim();
  const ac = await prisma.accessCode.findUnique({ where: { code } });
  if (ac) {
    if (ac.revoked) return null;
    if (ac.expiresAt && ac.expiresAt.getTime() < Date.now()) return null;
    return { childId: ac.childId, role: ac.role };
  }
  const child = await prisma.child.findUnique({ where: { sharingCode: code } });
  if (child) return { childId: child.id, role: 'therapist' };
  return null;
}

// Access is granted to the child's guardian (uid) or to a valid code for that
// child. `needWrite` additionally requires a write-capable role.
async function authorize(req: Request, childId: string, needWrite: boolean) {
  const uid = req.headers.get('x-user-uid');
  if (uid) {
    const owned = await prisma.child.findFirst({ where: { id: childId, parentUid: uid } });
    if (owned) return true;
  }
  const resolved = await resolveCode(req.headers.get('x-share-code'));
  if (resolved && resolved.childId === childId) {
    if (!needWrite) return true;
    return resolved.role === 'therapist' || resolved.role === 'school';
  }
  return false;
}

function formatLog(log: any) {
  return {
    id: log.id,
    timestamp: log.timestamp.toISOString(),
    mood: log.mood,
    crisisOccurred: log.crisisOccurred,
    notes: log.notes,
    decibels: log.decibels,
    lightLevel: log.lightLevel,
    location: log.location,
    trigger: log.trigger,
    antecedent: log.antecedent,
    behavior: log.behavior,
    consequence: log.consequence,
    loggedBy: log.loggedBy,
    foodIntake: log.foodIntake,
    schoolNoise: log.schoolNoise,
    latitude: log.latitude || undefined,
    longitude: log.longitude || undefined,
  };
}

export async function GET(req: Request) {
  try {
    const childId = new URL(req.url).searchParams.get('childId');
    if (!childId) {
      return NextResponse.json({ error: 'ID da criança é obrigatório' }, { status: 400 });
    }
    if (!(await authorize(req, childId, false))) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
    }

    const logs = await prisma.sensoryLog.findMany({
      where: { childId },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });

    return NextResponse.json(logs.map(formatLog));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { childId, mood, crisisOccurred, notes, decibels, lightLevel, location, trigger, antecedent, behavior, consequence, loggedBy, foodIntake, schoolNoise, latitude, longitude } = body;

    if (!childId) {
      return NextResponse.json({ error: 'ID da criança é obrigatório' }, { status: 400 });
    }
    if (!(await authorize(req, childId, true))) {
      return NextResponse.json({ error: 'Não autorizado para registrar.' }, { status: 403 });
    }

    const log = await prisma.sensoryLog.create({
      data: {
        childId,
        mood: mood || null,
        crisisOccurred: !!crisisOccurred,
        notes: notes || '',
        decibels: decibels !== undefined && decibels !== null ? Number(decibels) : null,
        lightLevel: lightLevel || null,
        location: location || null,
        trigger: trigger || null,
        antecedent: antecedent || null,
        behavior: behavior || null,
        consequence: consequence || null,
        loggedBy: loggedBy || 'parent',
        foodIntake: foodIntake || null,
        schoolNoise: schoolNoise || null,
        latitude: latitude !== undefined && latitude !== null ? Number(latitude) : null,
        longitude: longitude !== undefined && longitude !== null ? Number(longitude) : null,
      },
    });

    return NextResponse.json(formatLog(log));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
