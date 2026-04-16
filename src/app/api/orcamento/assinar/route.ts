import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { orcamento_id, token, nome, cpf } = await req.json()

    if (!orcamento_id || !token || !nome || !cpf) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    // Valida CPF básico (11 dígitos)
    const cpfLimpo = cpf.replace(/\D/g, '')
    if (cpfLimpo.length !== 11) {
      return NextResponse.json({ error: 'CPF inválido' }, { status: 400 })
    }

    // Busca orçamento e valida token
    const { data: orc } = await supabase
      .from('orcamentos')
      .select('*')
      .eq('id', orcamento_id)
      .eq('token', token)
      .maybeSingle()

    if (!orc) {
      return NextResponse.json({ error: 'Orçamento não encontrado' }, { status: 404 })
    }

    if (orc.status !== 'pendente' && orc.status !== null) {
      return NextResponse.json({ error: 'Orçamento já foi respondido' }, { status: 400 })
    }

    // Gera hash do conteúdo
    const conteudo = JSON.stringify({
      orcamento_id,
      cliente: orc.cliente_nome,
      valor: orc.valor_total,
      assinante: nome,
      cpf: cpfLimpo,
      timestamp: new Date().toISOString(),
    })
    const hash = createHash('sha256').update(conteudo).digest('hex')

    // Pega IP do cliente
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ||
               req.headers.get('x-real-ip') || 'desconhecido'

    // Atualiza orçamento com assinatura + aprovação
    const { error } = await supabase
      .from('orcamentos')
      .update({
        status:          'aprovado',
        aprovado_em:     new Date().toISOString(),
        assinatura_nome: nome.trim(),
        assinatura_cpf:  cpfLimpo,
        assinatura_ip:   ip,
        assinatura_hash: hash,
        assinado_em:     new Date().toISOString(),
      })
      .eq('id', orcamento_id)
      .eq('token', token)

    if (error) throw error

    return NextResponse.json({ ok: true, hash })

  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}