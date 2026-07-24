import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { hashPassword, verifyPassword } from '../../../lib/auth-utils';
import { ensureReferralCode, publicProfile } from '../../../lib/growth';

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
          childHyperfocus: '',
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

    profile.referralCode = await ensureReferralCode(profile.uid, profile.referralCode);

    // publicProfile tira o passwordHash: este endpoint devolvia o hash para o
    // navegador, que o guardava no localStorage.
    return NextResponse.json(publicProfile(profile));
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

    // ⚠️ Esta rota trocava a SENHA a partir de um uid no corpo, sem conferir
    // nada: quem descobrisse um uid tomava a conta. O uid viaja em cabecalho e
    // mora no localStorage — nunca foi feito para ser segredo.
    //
    // Duas travas, sem redesenhar a autenticacao hoje:
    //  1) o cabecalho tem de bater com o alvo, o que barra a chamada montada
    //     so com um corpo;
    //  2) trocar a senha exige a senha ATUAL. Assim, mesmo que um uid vaze,
    //     ele nao vira tomada de conta.
    if (req.headers.get('x-user-uid') !== uid) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 403 });
    }

    const dono = await prisma.userProfile.findUnique({
      where: { uid },
      select: { passwordHash: true },
    });
    if (!dono) {
      return NextResponse.json({ error: 'Perfil não encontrado.' }, { status: 404 });
    }

    const dataToUpdate: any = {
      childHyperfocus: updates.childHyperfocus,
      parentPinCode: updates.parentPinCode,
      lockType: updates.lockType,
      sensorySpeed: updates.sensorySpeed,
      sensorySound: updates.sensorySound,
      sensoryVisuals: updates.sensoryVisuals,
      sensoryProfile: updates.sensoryProfile,
      timerStyle: updates.timerStyle,
    };

    // O plano NUNCA sobe pelo cliente — quem promove para premium e o webhook
    // da Stripe (api/webhook), depois do pagamento confirmado. O cliente so
    // pode rebaixar a propria conta para free (cancelamento).
    if (updates.plan === 'free') {
      dataToUpdate.plan = 'free';
    }

    if (updates.password) {
      if (String(updates.password).length < 6) {
        return NextResponse.json(
          { error: 'A nova senha deve conter no mínimo 6 caracteres.' },
          { status: 400 }
        );
      }
      // A conta so tem senha depois do cadastro; contas antigas com hash vazio
      // podem definir a primeira sem apresentar a anterior.
      if (dono.passwordHash && !verifyPassword(String(updates.currentPassword || ''), dono.passwordHash)) {
        return NextResponse.json({ error: 'Senha atual incorreta.' }, { status: 403 });
      }
      dataToUpdate.passwordHash = hashPassword(updates.password);
    }

    const updated = await prisma.userProfile.update({
      where: { uid },
      data: dataToUpdate,
    });

    return NextResponse.json(publicProfile(updated));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
