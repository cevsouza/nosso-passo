import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16' as any,
    })
  : null;

export async function POST(req: Request) {
  try {
    const { uid, email } = await req.json();
    if (!uid || !email) {
      return NextResponse.json({ error: 'UID e e-mail são obrigatórios' }, { status: 400 });
    }

    if (!stripe) {
      console.warn("Stripe is not configured. Falling back to local mock checkout.");
      return NextResponse.json({ url: `/dashboard?mock_checkout=true&uid=${uid}` });
    }

    const priceId = process.env.STRIPE_PRICE_ID;
    if (!priceId) {
      return NextResponse.json({ error: 'STRIPE_PRICE_ID não configurado no servidor' }, { status: 500 });
    }

    const origin = req.headers.get('origin') || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${origin}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard?canceled=true`,
      customer_email: email,
      metadata: {
        uid: uid,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Erro no checkout Stripe:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
