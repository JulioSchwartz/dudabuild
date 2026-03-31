'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Item = {
  descricao: string
  quantidade: number
  material: number
  mao_obra: number
  equipamentos: number
}

export default function OrcamentoCliente() {

  const { id } = useParams()

  const [orcamento, setOrcamento] = useState<any>(null)
  const [itens, setItens] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    carregar()
  }, [])

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

  function totalItem(i: Item) {
    return (i.material + i.mao_obra + i.equipamentos) * i.quantidade
  }

  function totalGeral() {
    return itens.reduce((acc, i) => acc + totalItem(i), 0)
  }

  async function atualizarStatus(status: string) {

  await supabase
    .from('orcamentos')
    .update({ status })
    .eq('id', id)

  // 🚀 SE APROVADO → CRIA OBRA
  if (status === 'aprovado') {

    const { data: obra } = await supabase
      .from('obras')
      .insert({
        nome: `Obra - ${orcamento.cliente_nome}`,
        cliente_nome: orcamento.cliente_nome,
        valor_total: orcamento.valor_total
      })
      .select()
      .single()

    // vincula obra ao orçamento
    if (obra) {
      await supabase
        .from('orcamentos')
        .update({ obra_id: obra.id })
        .eq('id', id)
    }
  }

  setOrcamento({ ...orcamento, status })
}

  if (loading) return <p>Carregando...</p>

  return (
    <div style={container}>

      <div style={card}>

        <h1 style={titulo}>Proposta Comercial</h1>

        <p><strong>Cliente:</strong> {orcamento?.cliente_nome}</p>
        <p><strong>Descrição:</strong> {orcamento?.descricao}</p>

        <h2 style={{ marginTop: 20 }}>Itens</h2>

        <table style={tabela}>
          <thead>
            <tr>
              <th>Descrição</th>
              <th>Qtd</th>
              <th>Total</th>
            </tr>
          </thead>

          <tbody>
            {itens.map((i, index) => (
              <tr key={index}>
                <td>{i.descricao}</td>
                <td>{i.quantidade}</td>
                <td>R$ {totalItem(i).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 style={total}>
          Total: R$ {totalGeral().toFixed(2)}
        </h2>

        <div style={acoes}>

          <button
            style={btnAprovar}
            onClick={() => atualizarStatus('aprovado')}
          >
            Aprovar Orçamento
          </button>

          <button
            style={btnRecusar}
            onClick={() => atualizarStatus('recusado')}
          >
            Recusar
          </button>

        </div>

        {orcamento.status && (
          <p style={{ marginTop: 20 }}>
            Status: <strong>{orcamento.status}</strong>
          </p>
        )}

      </div>

    </div>
  )
}

/* 🎨 ESTILO */

const container = {
  background: '#f1f5f9',
  minHeight: '100vh',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center'
}

const card = {
  background: '#fff',
  padding: 30,
  borderRadius: 10,
  width: 800
}

const titulo = {
  fontSize: 28,
  fontWeight: 700
}

const tabela = {
  width: '100%',
  marginTop: 10,
  borderCollapse: 'collapse'
}

const total = {
  fontSize: 24,
  fontWeight: 700,
  marginTop: 20
}

const acoes = {
  display: 'flex',
  gap: 10,
  marginTop: 20
}

const btnAprovar = {
  background: '#16a34a',
  color: '#fff',
  padding: 12,
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer'
}

const btnRecusar = {
  background: '#dc2626',
  color: '#fff',
  padding: 12,
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer'
}