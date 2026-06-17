import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '../../../lib/prisma';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16' as any,
    })
  : null;

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: Request) {
  if (!stripe || !webhookSecret) {
    console.warn("Stripe webhook received but Stripe secret or webhook secret is not configured.");
    return NextResponse.json({ error: 'Webhook não configurado no servidor' }, { status: 500 });
  }

  const body = await req.text();
  const signature = req.headers.get('stripe-signature') || '';

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Falha na verificação da assinatura do webhook: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  try {
    // Handle specific events
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const uid = session.metadata?.uid;

      if (uid) {
        // Upgrade user to premium
        await prisma.userProfile.update({
          where: { uid },
          data: { plan: 'premium' },
        });
        console.log(`Usuário ${uid} promovido para o plano premium com sucesso.`);
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      
      const customer = await stripe.customers.retrieve(customerId);
      if (customer && !customer.deleted && customer.email) {
        await prisma.userProfile.update({
          where: { email: customer.email },
          data: { plan: 'free' },
        });
        console.log(`Assinatura cancelada para o cliente com e-mail ${customer.email}. Plano rebaixado para free.`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Erro ao processar evento de webhook do Stripe:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
