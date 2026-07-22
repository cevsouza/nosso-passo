import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { hashPassword } from '../../../lib/auth-utils';
import { applyReferral, isSourceKey, publicProfile, uniqueReferralCode } from '../../../lib/growth';

export async function POST(req: Request) {
  try {
    const { email, password, referralSource, referralDetail, referralCode } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'E-mail e senha são obrigatórios.' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'A senha deve conter no mínimo 6 caracteres.' }, { status: 400 });
    }

    const formattedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existing = await prisma.userProfile.findUnique({
      where: { email: formattedEmail },
    });

    if (existing) {
      return NextResponse.json({ error: 'Este e-mail já está sendo utilizado por outro responsável.' }, { status: 400 });
    }

    const passwordHash = hashPassword(password);
    const uid = 'user-' + Math.random().toString(36).substring(2, 9);

    // Create new profile with standard defaults
    await prisma.userProfile.create({
      data: {
        uid,
        email: formattedEmail,
        passwordHash,
        role: 'responsavel',
        childHyperfocus: 'Border Collies 🐕',
        parentPinCode: '1234',
        lockType: 'math',
        plan: 'free',
        sensorySpeed: 1.0,
        sensorySound: 'marimba',
        sensoryVisuals: 'rich',
        // Toda conta ja nasce com o proprio codigo para compartilhar.
        referralCode: await uniqueReferralCode(),
        referralSource: isSourceKey(referralSource) ? referralSource : null,
        referralDetail: (referralDetail || '').toString().trim().slice(0, 120) || null,
      },
    });

    // Um codigo invalido nao pode barrar o cadastro: a familia entra e apenas
    // nao ganha o premio.
    const referral = await applyReferral(uid, referralCode);

    const profile = await prisma.userProfile.findUnique({ where: { uid } });
    return NextResponse.json({ ...publicProfile(profile!), referralApplied: referral.applied });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
