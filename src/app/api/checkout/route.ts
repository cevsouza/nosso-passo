import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16' as any,
    })
  : null;

// STRIPE_PRICE_ID (legado) continua valendo como preco mensal.
function priceIdFor(billing: 'monthly' | 'annual') {
  if (billing === 'annual') return process.env.STRIPE_PRICE_ID_ANNUAL;
  return process.env.STRIPE_PRICE_ID_MONTHLY || process.env.STRIPE_PRICE_ID;
}

export async function POST(req: Request) {
  try {
    const { uid, email, billing } = await req.json();
    if (!uid || !email) {
      return NextResponse.json({ error: 'UID e e-mail são obrigatórios' }, { status: 400 });
    }

    const period: 'monthly' | 'annual' = billing === 'annual' ? 'annual' : 'monthly';

    if (!stripe) {
      // Sem Stripe configurado o checkout NAO libera premium: so ambiente de
      // desenvolvimento pode simular, e ainda assim de forma explicita.
      if (process.env.NODE_ENV !== 'production' && process.env.ALLOW_MOCK_CHECKOUT === 'true') {
        console.warn('Stripe ausente — checkout simulado (dev).');
        return NextResponse.json({ url: `/dashboard?mock_checkout=true&uid=${uid}` });
      }
      console.error('Checkout solicitado mas STRIPE_SECRET_KEY nao esta configurada.');
      return NextResponse.json(
        { error: 'Pagamento indisponível no momento. Tente novamente em instantes.' },
        { status: 503 },
      );
    }

    const priceId = priceIdFor(period);
    if (!priceId) {
      console.error(`Price ID ausente para o periodo "${period}".`);
      return NextResponse.json(
        { error: 'Plano indisponível no momento. Tente novamente em instantes.' },
        { status: 503 },
      );
    }

    const origin = req.headers.get('origin') || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      // Pix/boleto entram conforme os metodos habilitados no painel da Stripe.
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${origin}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard?canceled=true`,
      customer_email: email,
      locale: 'pt-BR',
      metadata: {
        uid: uid,
        billing: period,
      },
      subscription_data: {
        metadata: { uid: uid, billing: period },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Erro no checkout Stripe:', error);
    return NextResponse.json({ error: 'Não foi possível iniciar o pagamento.' }, { status: 500 });
  }
}
