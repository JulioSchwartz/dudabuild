'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { lancarMovimento } from '@/lib/financeiro'

export default function OrcamentoPublico() {

  const { id } = useParams()
  const search = useSearchParams()
  const token = search.get('token')

  const [orcamento, setOrcamento] = useState<any>(null)
  const [itens, setItens] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [finalizado, setFinalizado] = useState(false)

  useEffect(() => {
    if (!id || !token) {
  setLoading(false)
  return
}
    carregar()
  }, [id, token])

  async function carregar() {

    const { data: orc } = await supabase
      .from('orcamentos')
      .select('*')
      .eq('id', id)
      .eq('token', token)
      .maybeSingle()

    if (!orc) {
      setLoading(false)
      return
    }

    const { data: itensData } = await supabase
      .from('orcamento_itens')
      .select('*')
      .eq('orcamento_id', id)

    setOrcamento(orc)
    setItens(itensData || [])
    setLoading(false)
  }

  function totalItem(i: any) {
    return (
      Number(i.material || 0) +
      Number(i.mao_obra || 0) +
      Number(i.equipamentos || 0)
    ) * Number(i.quantidade || 0)
  }

  function totalGeral() {
    return itens.reduce((acc, i) => acc + totalItem(i), 0)
  }

  async function aprovar() {

    if (!orcamento) return

    // Atualiza status
    await supabase
      .from('orcamentos')
      .update({
        status: 'aprovado',
        aprovado_em: new Date().toISOString()
      })
      .eq('id', orcamento.id)

    // Cria obra
    const { data: obra } = await supabase
      .from('obras')
      .insert({
        nome: `Obra - ${orcamento.cliente_nome}`,
        cliente: orcamento.cliente_nome,
        valor: totalGeral(),
        empresa_id: orcamento.empresa_id
      })
      .select()
      .single()

    if (obra) {

      await supabase
        .from('orcamentos')
        .update({ obra_id: obra.id })
        .eq('id', orcamento.id)

      await lancarMovimento({
        obra_id: obra.id,
        empresa_id: orcamento.empresa_id,
        tipo: 'entrada',
        descricao: 'Proposta aprovada',
        valor: totalGeral()
      })
    }

    setFinalizado(true)
  }

  async function recusar() {

    await supabase
      .from('orcamentos')
      .update({
        status: 'recusado'
      })
      .eq('id', id)
      .eq('token', token)

    setFinalizado(true)
  }

  if (loading) return <p style={{padding:40}}>Carregando proposta...</p>

  if (!orcamento) {
    return (
      <div style={erroBox}>
        ❌ Link inválido ou expirado
      </div>
    )
  }

  return (
    <div style={container}>

      <div style={card}>

        {/* HEADER */}
        <div style={header}>
          <h1 style={titulo}>Proposta Comercial</h1>
          <span style={empresa}>DudaBuild Engenharia</span>
        </div>

        {/* CLIENTE */}
        <div style={clienteBox}>
          <p><strong>Cliente:</strong> {orcamento.cliente_nome}</p>
          <p>{orcamento.descricao}</p>
        </div>

        {/* ITENS */}
        <div style={bloco}>
          {itens.map((i, index) => (
            <div key={index} style={item}>
              <span>{i.descricao}</span>
              <span>{format(totalItem(i))}</span>
            </div>
          ))}
        </div>

        {/* TOTAL */}
        <div style={totalBox}>
          <span>Investimento Total</span>
          <h1>{format(totalGeral())}</h1>
        </div>

        {/* STATUS FINAL */}
        {(orcamento.status === 'aprovado' || orcamento.status === 'recusado' || finalizado) && (
          <div style={statusBox(finalizado ? 'aprovado' : orcamento.status)}>
            {orcamento.status === 'aprovado' || finalizado
              ? '✅ Proposta aprovada — obrigado!'
              : '❌ Proposta recusada'}
          </div>
        )}

        {/* BOTÕES */}
        {(orcamento.status === 'pendente' || !orcamento.status) && !finalizado && (
          <div style={acoes}>

            <button style={btnAprovar} onClick={aprovar}>
              Aprovar proposta
            </button>

            <button style={btnRecusar} onClick={recusar}>
              Recusar
            </button>

          </div>
        )}

      </div>

    </div>
  )
}

/* UI */

function format(v:number){
  return Number(v || 0).toLocaleString('pt-BR',{
    style:'currency',
    currency:'BRL'
  })
}

const container = {
  background:'#f1f5f9',
  minHeight:'100vh',
  display:'flex',
  justifyContent:'center',
  alignItems:'center',
  padding:20
}

const card = {
  background:'#fff',
  padding:40,
  borderRadius:16,
  width:'100%',
  maxWidth:800,
  boxShadow:'0 20px 60px rgba(0,0,0,0.08)'
}

const header = {
  display:'flex',
  justifyContent:'space-between',
  marginBottom:20
}

const titulo = {
  fontSize:28,
  fontWeight:700
}

const empresa = {
  color:'#64748b'
}

const clienteBox = {
  background:'#f8fafc',
  padding:20,
  borderRadius:10
}

const bloco = {
  marginTop:20
}

const item = {
  display:'flex',
  justifyContent:'space-between',
  padding:12,
  borderBottom:'1px solid #e2e8f0'
}

const totalBox = {
  marginTop:30,
  padding:25,
  background:'#16a34a',
  color:'#fff',
  borderRadius:12,
  textAlign:'center' as const
}

const acoes = {
  display:'flex',
  gap:10,
  marginTop:30
}

const btnAprovar = {
  background:'#16a34a',
  color:'#fff',
  padding:16,
  borderRadius:10,
  flex:1,
  border:'none',
  fontWeight:600
}

const btnRecusar = {
  background:'#dc2626',
  color:'#fff',
  padding:16,
  borderRadius:10,
  flex:1,
  border:'none',
  fontWeight:600
}

const statusBox = (status:string)=>({
  marginTop:20,
  padding:15,
  borderRadius:10,
  textAlign:'center' as const,
  fontWeight:700,
  background: status==='aprovado' ? '#dcfce7' : '#fee2e2',
  color: status==='aprovado' ? '#166534' : '#991b1b'
})

const erroBox = {
  padding:40,
  textAlign:'center' as const,
  color:'#991b1b'
}