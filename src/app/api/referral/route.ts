import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import {
  REFERRAL_DAYS,
  REFERRAL_MAX_GRANTS,
  ensureReferralCode,
  hasActivePremiumGrant,
} from '../../../lib/growth';

// Situacao do programa de indicacao da conta logada.
// Auth segue o padrao do app: o uid do responsavel no cabecalho x-user-uid.

export async function GET(req: Request) {
  try {
    const uid = req.headers.get('x-user-uid');
    if (!uid) {
      return NextResponse.json({ error: 'UID do usuário é obrigatório' }, { status: 400 });
    }

    const profile = await prisma.userProfile.findUnique({ where: { uid } });
    if (!profile) {
      return NextResponse.json({ error: 'Conta não encontrada.' }, { status: 404 });
    }

    const code = await ensureReferralCode(profile.uid, profile.referralCode);
    const total = await prisma.userProfile.count({ where: { referredByUid: uid } });
    const premiados = Math.min(total, REFERRAL_MAX_GRANTS);

    return NextResponse.json({
      code,
      total,
      diasGanhos: premiados * REFERRAL_DAYS,
      diasPorIndicacao: REFERRAL_DAYS,
      restantes: Math.max(0, REFERRAL_MAX_GRANTS - total),
      premiumUntil: profile.premiumUntil,
      premiumAtivo: hasActivePremiumGrant(profile.premiumUntil),
      assinaturaPaga: profile.plan === 'premium',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
