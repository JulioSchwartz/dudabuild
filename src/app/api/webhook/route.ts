import { headers } from 'next/headers'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const body = await req.text()
  const sig = headers().get('stripe-signature')

  if (!sig) {
    return new Response('Sem assinatura', { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    return new Response(`Erro webhook: ${err.message}`, { status: 400 })
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session

      const customerId = session.customer as string
      const subscriptionId = session.subscription as string

      const lineItems = await stripe.checkout.sessions.listLineItems(session.id)
      const priceId = lineItems.data[0]?.price?.id

      let plano = 'basico'

      if (priceId === 'price_PRO_AQUI') plano = 'pro'
      if (priceId === 'price_PREMIUM_AQUI') plano = 'premium'

      await supabase
        .from('empresas')
        .update({
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          status: 'active',
          plano
        })
        .eq('stripe_customer_id', customerId)
    }

    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string

      await supabase
        .from('empresas')
        .update({ status: 'past_due' })
        .eq('stripe_customer_id', customerId)
    }

    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as Stripe.Subscription
      const customerId = sub.customer as string

      await supabase
        .from('empresas')
        .update({
          status: 'canceled',
          plano: 'basico'
        })
        .eq('stripe_customer_id', customerId)
    }

  } catch (err) {
    console.error('Erro processamento:', err)
  }

  return new Response('OK', { status: 200 })
}