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
  const sig = headers().get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('Erro webhook:', err.message)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  try {

    // ✅ PAGAMENTO CRIADO
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session

      const customerId = session.customer as string
      const subscriptionId = session.subscription as string

      await supabase
        .from('empresas')
        .update({
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          status: 'active',
          plano: 'pro'
        })
        .eq('stripe_customer_id', customerId)
    }

    // 🔴 PAGAMENTO FALHOU
    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as Stripe.Invoice

      const customerId = invoice.customer as string

      await supabase
        .from('empresas')
        .update({
          status: 'past_due'
        })
        .eq('stripe_customer_id', customerId)
    }

    // ❌ CANCELADO
    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as Stripe.Subscription

      const customerId = sub.customer as string

      await supabase
        .from('empresas')
        .update({
          status: 'canceled',
          plano: 'free'
        })
        .eq('stripe_customer_id', customerId)
    }

  } catch (err) {
    console.error('Erro processamento webhook:', err)
  }

  return new Response('OK', { status: 200 })
}