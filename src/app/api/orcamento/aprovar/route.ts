import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Cliente com service role — roda no servidor, bypassa RLS
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
      .select('*')
      .eq('id', orcamento_id)
      .eq('token', token)
      .maybeSingle()

    if (errOrc || !orc) {
      return NextResponse.json({ error: 'Orçamento não encontrado' }, { status: 404 })
    }

    if (orc.status === 'aprovado') {
      return NextResponse.json({ error: 'Já aprovado', obra_id: orc.obra_id }, { status: 200 })
    }

    // Busca itens para calcular total
    const { data: itens } = await supabaseAdmin
      .from('orcamento_itens')
      .select('*')
      .eq('orcamento_id', orcamento_id)

    const totalGeral = (itens || []).reduce((acc: number, i: any) => {
      return acc + (
        (Number(i.material || 0) + Number(i.mao_obra || 0) + Number(i.equipamentos || 0))
        * Number(i.quantidade || 0)
      )
    }, 0)

    // Cria obra
    const { data: obra, error: errObra } = await supabaseAdmin
      .from('obras')
      .insert({
        nome:       `Obra - ${orc.cliente_nome}`,
        cliente:    orc.cliente_nome,
        valor:      totalGeral,
        empresa_id: orc.empresa_id,
        status:     'em_andamento',
      })
      .select()
      .single()

    if (errObra || !obra) {
      console.error('Erro ao criar obra:', errObra)
      return NextResponse.json({ error: 'Erro ao criar obra' }, { status: 500 })
    }

    // Atualiza orçamento
    await supabaseAdmin
      .from('orcamentos')
      .update({
        status:      'aprovado',
        aprovado_em: new Date().toISOString(),
        obra_id:     obra.id,
      })
      .eq('id', orcamento_id)

    // Lança entrada financeira
    await supabaseAdmin
      .from('financeiro')
      .insert({
        obra_id:    obra.id,
        empresa_id: orc.empresa_id,
        tipo:       'entrada',
        descricao:  'Proposta aprovada pelo cliente',
        valor:      totalGeral,
        created_at: new Date().toISOString(),
      })

    return NextResponse.json({ success: true, obra_id: obra.id })

  } catch (err) {
    console.error('Erro na API aprovar:', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}