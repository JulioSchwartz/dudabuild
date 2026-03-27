'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Orcamentos() {
  const router = useRouter()
  const [orcamentos, setOrcamentos] = useState<any[]>([])

  useEffect(() => {
    carregar()
  }, [])

  async function carregar() {
    const empresa_id = localStorage.getItem('empresa_id')

    const { data } = await supabase
      .from('orcamentos')
      .select('*')
      .eq('empresa_id', empresa_id)
      .order('created_at', { ascending: false })

    setOrcamentos(data || [])
  }

  function corStatus(status: string) {
    if (status === 'aprovado') return '#16a34a'
    if (status === 'recusado') return '#ef4444'
    return '#f59e0b'
  }

  return (
    <div>
      <h1 style={titulo}>Orçamentos</h1>

      <button style={btnNovo} onClick={() => router.push('/orcamentos/novo')}>
        + Novo Orçamento
      </button>

      {orcamentos.map((orc) => (
        <div key={orc.id} style={card}>
          <div>
            <strong>{orc.cliente_nome}</strong>
            <p style={sub}>{orc.descricao}</p>
          </div>

          <div style={statusBox}>
            <span style={{ ...badge, background: corStatus(orc.status) }}>
              {orc.status}
            </span>
            <strong style={valor}>
              {Number(orc.valor_total).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </strong>
          </div>

          <div style={acoes}>
            <button
              style={btnEditar}
              onClick={() => router.push(`/orcamentos/editar/${orc.id}`)}
            >
              ✏️ Editar
            </button>

            <button
              style={btnLink}
              onClick={() => {
                const link = `${window.location.origin}/cliente/orcamento/${orc.token}`
                navigator.clipboard.writeText(link)
                alert('Link copiado!')
              }}
            >
              🔗 Link
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ESTILO */

const titulo = { fontSize: 28, marginBottom: 20 }

const btnNovo = {
  background: '#2563eb',
  color: '#fff',
  padding: '12px 16px',
  borderRadius: 10,
  marginBottom: 20
}

const card = {
  background: '#fff',
  padding: 20,
  borderRadius: 16,
  marginBottom: 15,
  boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
}

const sub = { color: '#64748b' }

const statusBox = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: 10
}

const badge = {
  color: '#fff',
  padding: '6px 12px',
  borderRadius: 999
}

const valor = {
  fontSize: 20,
  fontWeight: 'bold',
  color: '#16a34a'
}

const acoes = {
  display: 'flex',
  gap: 10,
  marginTop: 15
}

const btnEditar = {
  background: '#f59e0b',
  color: '#fff',
  padding: '8px 12px',
  borderRadius: 8
}

const btnLink = {
  background: '#0ea5e9',
  color: '#fff',
  padding: '8px 12px',
  borderRadius: 8
}