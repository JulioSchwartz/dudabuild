import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { orcamento_id, token } = await req.json()

    if (!orcamento_id || !token) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
    }

    // Valida o orçamento e token
    const { data: orc, error: errOrc } = await supabaseAdmin
      .from('orcamentos')
      .select('id, status, token')
      .eq('id', orcamento_id)
      .eq('token', token)
      .maybeSingle()

    if (errOrc || !orc) {
      return NextResponse.json({ error: 'Orçamento não encontrado' }, { status: 404 })
    }

    if (orc.status === 'recusado') {
      return NextResponse.json({ success: true, already: true }, { status: 200 })
    }

    const { error } = await supabaseAdmin
      .from('orcamentos')
      .update({
        status:      'recusado',
        aprovado_em: new Date().toISOString(),
      })
      .eq('id', orcamento_id)
      .eq('token', token)

    if (error) {
      console.error('Erro ao recusar:', error)
      return NextResponse.json({ error: 'Erro ao recusar' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (err) {
    console.error('Erro na API recusar:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}