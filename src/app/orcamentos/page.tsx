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

      <button
        style={btnNovo}
        onClick={() => router.push('/orcamentos/novo')}
      >
        + Novo Orçamento
      </button>

      <div style={box}>
        {orcamentos.map((orc) => (
          <div key={orc.id} style={linha}>
            <div>
              <strong>{orc.cliente_nome}</strong><br />
              <span style={sub}>{orc.descricao}</span>
            </div>

            <div>
              <span style={{
                ...status,
                background: corStatus(orc.status)
              }}>
                {orc.status}
              </span>
            </div>

            <div>
              <strong>
                {Number(orc.valor_total).toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </strong>
            </div>

            <div>
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
    </div>
  )
}

/* ESTILO */

const titulo = { fontSize: '26px', marginBottom: '20px' }

const btnNovo = {
  background: '#2563eb',
  color: '#fff',
  padding: '10px 14px',
  border: 'none',
  borderRadius: '8px',
  marginBottom: '20px',
}

const box = {
  background: '#fff',
  padding: '20px',
  borderRadius: '12px',
}

const linha = {
  display: 'grid',
  gridTemplateColumns: '2fr 1fr 1fr 1fr',
  alignItems: 'center',
  padding: '10px 0',
  borderBottom: '1px solid #e2e8f0',
}

const sub = { color: '#64748b', fontSize: '12px' }

const status = {
  color: '#fff',
  padding: '6px 10px',
  borderRadius: '6px',
  fontSize: '12px'
}

const btnLink = {
  background: '#0ea5e9',
  color: '#fff',
  border: 'none',
  padding: '6px 10px',
  borderRadius: '6px',
}