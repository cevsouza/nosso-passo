import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { verifyPassword, hashPassword } from '../../../lib/auth-utils';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'E-mail e senha são obrigatórios.' }, { status: 400 });
    }

    const formattedEmail = email.trim().toLowerCase();

    // Find profile
    const profile = await prisma.userProfile.findUnique({
      where: { email: formattedEmail },
    });

    if (!profile) {
      return NextResponse.json({ error: 'E-mail ou senha incorretos. Verifique suas credenciais.' }, { status: 400 });
    }

    // Verify password (allow empty hash for backward compatibility with mock users)
    const isMockUserWithNoPassword = profile.passwordHash === "" || profile.passwordHash === null;
    
    if (!isMockUserWithNoPassword && !verifyPassword(password, profile.passwordHash)) {
      return NextResponse.json({ error: 'E-mail ou senha incorretos. Verifique suas credenciais.' }, { status: 400 });
    }

    // Auto-update legacy mock accounts with their newly typed password on first login
    if (isMockUserWithNoPassword) {
      const passwordHash = hashPassword(password);
      await prisma.userProfile.update({
        where: { email: formattedEmail },
        data: { passwordHash }
      });
      profile.passwordHash = passwordHash;
    }

    // Remove passwordHash from response for security
    const { passwordHash: _, ...safeProfile } = profile;

    return NextResponse.json(safeProfile);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
