'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { lancarMovimento } from '@/lib/financeiro'

export default function OrcamentoCliente() {

  const { id } = useParams()

  const [orcamento, setOrcamento] = useState<any>(null)
  const [itens, setItens] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    carregar()
  }, [id])

  async function carregar() {

    const { data: orc } = await supabase
      .from('orcamentos')
      .select('*')
      .eq('id', id)
      .single()

    const { data: itensData } = await supabase
      .from('orcamento_itens')
      .select('*')
      .eq('orcamento_id', id)

    setOrcamento(orc)
    setItens(itensData || [])
    setLoading(false)
  }

  function totalItem(i: any) {
    return (Number(i.material || 0) + Number(i.mao_obra || 0) + Number(i.equipamentos || 0)) * Number(i.quantidade || 0)
  }

  function totalGeral() {
    return itens.reduce((acc, i) => acc + totalItem(i), 0)
  }

  async function atualizarStatus(status: string) {

    await supabase
      .from('orcamentos')
      .update({ status })
      .eq('id', id)

    if (status === 'aprovado' && orcamento) {

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
          .eq('id', id)

        await lancarMovimento({
          obra_id: obra.id,
          empresa_id: orcamento.empresa_id,
          tipo: 'entrada',
          descricao: 'Contrato aprovado',
          valor: totalGeral()
        })
      }
    }

    setOrcamento({ ...orcamento, status })
  }

  if (loading) return <p style={{ padding: 40 }}>Carregando...</p>

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
          <p><strong>Cliente:</strong> {orcamento?.cliente_nome}</p>
          <p>{orcamento?.descricao}</p>
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

        {/* TOTAL DESTACADO */}
        <div style={totalBox}>
          <span>Investimento Total</span>
          <h1>{format(totalGeral())}</h1>
        </div>

        {/* STATUS */}
        {orcamento.status && (
          <div style={statusBadge(orcamento.status)}>
            {orcamento.status.toUpperCase()}
          </div>
        )}

        {/* AÇÕES */}
        {!orcamento.status && (
          <div style={acoes}>

            <button style={btnAprovar} onClick={() => atualizarStatus('aprovado')}>
              ✅ Aprovar
            </button>

            <button style={btnRecusar} onClick={() => atualizarStatus('recusado')}>
              ❌ Recusar
            </button>

          </div>
        )}

      </div>

    </div>
  )
}

/* UI */

const container = {
  background:'#f1f5f9',
  minHeight:'100vh',
  display:'flex',
  justifyContent:'center',
  padding:20
}

const card = {
  background:'#fff',
  padding:40,
  borderRadius:12,
  width:800,
  boxShadow:'0 20px 50px rgba(0,0,0,0.05)'
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
  padding:15,
  borderRadius:10
}

const bloco = {
  marginTop:20
}

const item = {
  display:'flex',
  justifyContent:'space-between',
  padding:10,
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
  border:'none'
}

const btnRecusar = {
  background:'#dc2626',
  color:'#fff',
  padding:16,
  borderRadius:10,
  flex:1,
  border:'none'
}

function statusBadge(status:string){
  if(status==='aprovado'){
    return {
      background:'#dcfce7',
      color:'#166534',
      padding:10,
      borderRadius:8,
      marginTop:20,
      textAlign:'center' as const,
      fontWeight:700
    }
  }
  return {
    background:'#fee2e2',
    color:'#991b1b',
    padding:10,
    borderRadius:8,
    marginTop:20,
    textAlign:'center' as const,
    fontWeight:700
  }
}

function format(v:number){
  return Number(v || 0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
}