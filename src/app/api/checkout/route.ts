import { NextResponse } from 'next/server'
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
  try {
    const { priceId } = await req.json()

    // 🔐 pega usuário logado
    const authHeader = req.headers.get('Authorization')

    if (!authHeader) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')

    const {
      data: { user },
    } = await supabase.auth.getUser(token)

    if (!user) {
      return NextResponse.json({ error: 'Usuário inválido' }, { status: 401 })
    }

    // 🔎 busca empresa do usuário
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('empresa_id')
      .eq('user_id', user.id)
      .single()

    if (!usuario?.empresa_id) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 400 })
    }

    // 🔎 busca empresa
    const { data: empresa } = await supabase
      .from('empresas')
      .select('*')
      .eq('id', usuario.empresa_id)
      .single()

    // 👤 cria ou usa customer
    let customerId = empresa?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email!,
      })

      customerId = customer.id

      await supabase
        .from('empresas')
        .update({ stripe_customer_id: customerId })
        .eq('id', usuario.empresa_id)
    }

    // 💳 cria sessão
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/planos`,
    })

    return NextResponse.json({ url: session.url })

  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}