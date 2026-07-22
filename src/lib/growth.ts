import { prisma } from './prisma';

// ---------------------------------------------------------------------------
// Crescimento: atribuicao ("como conheceu") e indicacao de mao dupla.
//
// Regra central do plano: `plan` continua sendo a verdade da ASSINATURA paga
// (so o webhook da Stripe escreve nele). O premio de indicacao vive em
// `premiumUntil` e nunca toca `plan` — assim um premio que expira jamais
// rebaixa quem paga, e quem paga nao perde nada quando o premio acaba.
// Quem junta os dois e `effectivePlan`, na hora de responder ao cliente.
// ---------------------------------------------------------------------------

/** Dias de premium que cada lado ganha por indicacao aceita. */
export const REFERRAL_DAYS = 30;

/**
 * Teto de indicacoes premiadas por conta. Existe porque o premio e concedido
 * no cadastro, sem confirmacao de e-mail: sem teto, criar contas falsas daria
 * premium infinito. Doze indicacoes ja sao um ano inteiro de plano.
 */
export const REFERRAL_MAX_GRANTS = 12;

/** As respostas de "como voce conheceu o TEAcolher?". */
export const SOURCE_KEYS = [
  'terapeuta',
  'familia',
  'grupo',
  'redes',
  'busca',
  'escola',
  'associacao',
  'outro',
] as const;

export type SourceKey = (typeof SOURCE_KEYS)[number];

export function isSourceKey(v: unknown): v is SourceKey {
  return typeof v === 'string' && (SOURCE_KEYS as readonly string[]).includes(v);
}

/** Codigo curto e sem caracteres ambiguos (o pai dita no WhatsApp ou no papel). */
function genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export async function uniqueReferralCode() {
  for (let i = 0; i < 8; i++) {
    const code = genCode();
    const clash = await prisma.userProfile.findUnique({ where: { referralCode: code } });
    if (!clash) return code;
  }
  // Colisao oito vezes seguidas nao acontece; se acontecer, alonga em vez de falhar.
  return genCode() + genCode();
}

/** Garante que a conta tenha codigo — contas antigas foram criadas sem um. */
export async function ensureReferralCode(uid: string, current?: string | null) {
  if (current) return current;
  const code = await uniqueReferralCode();
  try {
    await prisma.userProfile.update({ where: { uid }, data: { referralCode: code } });
    return code;
  } catch {
    // Corrida entre duas abas: relê o que ficou gravado.
    const fresh = await prisma.userProfile.findUnique({ where: { uid } });
    return fresh?.referralCode || null;
  }
}

export function hasActivePremiumGrant(premiumUntil?: Date | null) {
  return !!premiumUntil && premiumUntil.getTime() > Date.now();
}

/** O plano que o app deve enxergar: assinatura paga OU premio de indicacao. */
export function effectivePlan(profile: { plan: string; premiumUntil?: Date | null }) {
  if (profile.plan === 'premium') return 'premium';
  return hasActivePremiumGrant(profile.premiumUntil) ? 'premium' : 'free';
}

/**
 * O que pode sair para o navegador. Duas coisas acontecem aqui:
 *  - `passwordHash` NUNCA vai junto (antes vazava por /api/profile e ficava
 *    guardado no localStorage do usuario);
 *  - `plan` ja sai resolvido, entao toda a UI que testa `plan === 'premium'`
 *    continua funcionando sem alteracao.
 */
export function publicProfile<T extends { plan: string; premiumUntil?: Date | null }>(profile: T) {
  const { passwordHash: _drop, ...rest } = profile as T & { passwordHash?: string };
  return {
    ...rest,
    plan: effectivePlan(profile),
    paidPlan: profile.plan,
    premiumUntil: profile.premiumUntil ?? null,
  };
}

/** Estende o premio a partir de hoje, ou do fim do premio atual se ainda vale. */
export async function grantPremiumDays(uid: string, days: number) {
  const profile = await prisma.userProfile.findUnique({ where: { uid } });
  if (!profile) return null;
  const base = hasActivePremiumGrant(profile.premiumUntil)
    ? profile.premiumUntil!.getTime()
    : Date.now();
  return prisma.userProfile.update({
    where: { uid },
    data: { premiumUntil: new Date(base + days * 86400000) },
  });
}

export type ReferralOutcome = {
  applied: boolean;
  reason?: 'codigo-invalido' | 'proprio-codigo' | 'teto-atingido';
  referrerUid?: string;
};

/**
 * Aplica a indicacao no cadastro. Os dois lados ganham; o teto vale so para
 * quem indica. Um codigo invalido nunca bloqueia o cadastro — a familia entra
 * do mesmo jeito e so nao ganha o premio.
 */
export async function applyReferral(newUid: string, rawCode?: string | null): Promise<ReferralOutcome> {
  const code = (rawCode || '').trim().toUpperCase();
  if (!code) return { applied: false };

  const referrer = await prisma.userProfile.findUnique({ where: { referralCode: code } });
  if (!referrer) return { applied: false, reason: 'codigo-invalido' };
  if (referrer.uid === newUid) return { applied: false, reason: 'proprio-codigo' };

  await prisma.userProfile.update({
    where: { uid: newUid },
    data: { referredByUid: referrer.uid },
  });

  // Quem entra sempre ganha; quem indica so ate o teto.
  await grantPremiumDays(newUid, REFERRAL_DAYS);

  const jaIndicou = await prisma.userProfile.count({ where: { referredByUid: referrer.uid } });
  if (jaIndicou > REFERRAL_MAX_GRANTS) {
    return { applied: true, reason: 'teto-atingido', referrerUid: referrer.uid };
  }

  await grantPremiumDays(referrer.uid, REFERRAL_DAYS);
  return { applied: true, referrerUid: referrer.uid };
}
