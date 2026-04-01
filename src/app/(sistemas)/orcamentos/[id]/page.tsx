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

  function totalItem(i: any) {
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

    if (status === 'aprovado' && orcamento) {

      const { data: obra } = await supabase
        .from('obras')
        .insert({
          nome: `Obra - ${orcamento.cliente_nome}`,
          cliente_nome: orcamento.cliente_nome,
          valor_total: totalGeral()
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
          tipo: 'entrada',
          descricao: 'Contrato aprovado',
          valor: totalGeral()
        })
      }
    }

    setOrcamento({ ...orcamento, status })
  }

  if (loading) return <p style={{ padding: 40 }}>Carregando proposta...</p>

  return (
    <div style={container}>

      <div style={card}>

        {/* HEADER */}
        <div style={header}>
          <h1 style={titulo}>Proposta Comercial</h1>
          <span style={empresa}>DudaBuild Engenharia</span>
        </div>

        {/* CLIENTE */}
        <div style={bloco}>
          <p><strong>Cliente:</strong> {orcamento?.cliente_nome}</p>
          <p><strong>Descrição:</strong> {orcamento?.descricao}</p>
        </div>

        {/* ITENS */}
        <div style={bloco}>
          <h2>Itens do Orçamento</h2>

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
        </div>

        {/* TOTAL */}
        <div style={totalBox}>
          Total: R$ {totalGeral().toFixed(2)}
        </div>

        {/* AÇÕES */}
        {!orcamento.status && (
          <div style={acoes}>

            <button
              style={btnAprovar}
              onClick={() => atualizarStatus('aprovado')}
            >
              ✅ Aprovar Orçamento
            </button>

            <button
              style={btnRecusar}
              onClick={() => atualizarStatus('recusado')}
            >
              ❌ Recusar
            </button>

          </div>
        )}

        {/* STATUS */}
        {orcamento.status && (
          <div style={statusBox}>
            Status: <strong>{orcamento.status}</strong>
          </div>
        )}

      </div>

    </div>
  )
}

/* 🎨 UI */

const container = {
  background: '#f1f5f9',
  minHeight: '100vh',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: 20
}

const card = {
  background: '#fff',
  padding: 40,
  borderRadius: 12,
  width: 900,
  boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
}

const header = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: 20
}

const titulo = {
  fontSize: 28,
  fontWeight: 700
}

const empresa = {
  color: '#64748b'
}

const bloco = {
  marginTop: 20
}

const tabela = {
  width: '100%',
  marginTop: 10,
  borderCollapse: 'collapse'
}

const totalBox = {
  fontSize: 26,
  fontWeight: 700,
  marginTop: 20,
  textAlign: 'right'
}

const acoes = {
  display: 'flex',
  gap: 10,
  marginTop: 30
}

const btnAprovar = {
  background: '#16a34a',
  color: '#fff',
  padding: 14,
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
  flex: 1
}

const btnRecusar = {
  background: '#dc2626',
  color: '#fff',
  padding: 14,
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
  flex: 1
}

const statusBox = {
  marginTop: 30,
  padding: 15,
  background: '#e2e8f0',
  borderRadius: 8,
  textAlign: 'center'
}