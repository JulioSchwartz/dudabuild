'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function OrcamentoCliente() {
  const { token } = useParams()

  const [orcamento, setOrcamento] = useState<any>(null)
  const [itens, setItens] = useState<any[]>([])

  useEffect(() => {
    carregar()
  }, [])

  async function carregar() {
    const { data } = await supabase
      .from('orcamentos')
      .select('*')
      .eq('token', token)
      .single()

    if (!data) return

    const { data: itensData } = await supabase
      .from('orcamento_itens')
      .select('*')
      .eq('orcamento_id', data.id)

    setOrcamento(data)
    setItens(itensData || [])
  }

  async function aprovar() {
    // 🔥 1. Atualiza status
    await supabase
      .from('orcamentos')
      .update({ status: 'aprovado' })
      .eq('id', orcamento.id)

    // 🔥 2. Cria OBRA automaticamente
    const { data: obra } = await supabase
      .from('obras')
      .insert([{
        empresa_id: orcamento.empresa_id,
        nome: `Obra - ${orcamento.cliente_nome}`,
        cliente: orcamento.cliente_nome,
        status: 'em andamento',
        created_at: new Date().toISOString()
      }])
      .select()
      .single()

    // 🔥 3. Cria entrada no financeiro
    await supabase.from('financeiro').insert([{
      obra_id: obra.id,
      empresa_id: orcamento.empresa_id,
      tipo: 'entrada',
      descricao: 'Orçamento aprovado',
      valor: orcamento.valor_total,
      created_at: new Date().toISOString()
    }])

    alert('Orçamento aprovado e obra criada!')
    carregar()
  }

  async function recusar() {
    await supabase
      .from('orcamentos')
      .update({ status: 'recusado' })
      .eq('id', orcamento.id)

    alert('Orçamento recusado')
    carregar()
  }

  if (!orcamento) return <p>Carregando...</p>

  return (
    <div style={container}>
      <h1>Orçamento</h1>

      <h2>{orcamento.cliente_nome}</h2>
      <p>{orcamento.descricao}</p>

      <div style={box}>
        {itens.map((item) => (
          <div key={item.id} style={linha}>
            <span>{item.descricao}</span>
            <span>{item.quantidade}</span>
            <span>
              {Number(item.valor_total).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </span>
          </div>
        ))}
      </div>

      <h2 style={total}>
        Total:{' '}
        {Number(orcamento.valor_total).toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        })}
      </h2>

      {orcamento.status === 'pendente' && (
        <div style={acoes}>
          <button style={btnAprovar} onClick={aprovar}>
            ✅ Aprovar
          </button>

          <button style={btnRecusar} onClick={recusar}>
            ❌ Recusar
          </button>
        </div>
      )}

      {orcamento.status === 'aprovado' && (
        <p style={{ color: '#16a34a', marginTop: '20px' }}>
          ✔ Orçamento aprovado
        </p>
      )}

      {orcamento.status === 'recusado' && (
        <p style={{ color: '#ef4444', marginTop: '20px' }}>
          ❌ Orçamento recusado
        </p>
      )}
    </div>
  )
}

/* ESTILO */

const container = {
  padding: '30px',
  maxWidth: '800px',
  margin: '0 auto',
}

const box = {
  background: '#fff',
  padding: '20px',
  borderRadius: '12px',
  marginTop: '20px',
}

const linha = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: '10px',
}

const total = {
  marginTop: '20px',
}

const acoes = {
  marginTop: '30px',
  display: 'flex',
  gap: '10px',
}

const btnAprovar = {
  background: '#22c55e',
  color: '#fff',
  padding: '12px',
  border: 'none',
  borderRadius: '8px',
}

const btnRecusar = {
  background: '#ef4444',
  color: '#fff',
  padding: '12px',
  border: 'none',
  borderRadius: '8px',
}