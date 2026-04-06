'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useEmpresa } from '@/hooks/useEmpresa'

type Orcamento = {
  id: string
  cliente_nome: string
  valor_total: number
  status?: string
  created_at: string
  telefone?: string
}

export default function OrcamentosPage() {
  
  const { empresaId, limites, loading: loadingEmpresa } = useEmpresa()
  const [lista, setLista] = useState<Orcamento[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (!empresaId) return
    carregar()
  }, [empresaId])

  async function carregar() {
    
    if (!empresaId) return

    const { data, error } = await supabase
      .from('orcamentos')
      .select('*')
      .eq('empresa_id', empresaId)

    if (!error && data) {
      setLista(data)
    }

    setLoading(false)
  }

  function formatarMoeda(valor: number) {
    return valor?.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  const limite = limites.orcamentos
  const atingiuLimite = limite !== Infinity && lista.length >= limite

  // 🔥 LOADER GLOBAL
  if (loadingEmpresa) return <Loader />

  // 🔥 LOADING
  if (loading) return <Loader />

  return (
    <div style={container}>

      {/* 🚨 ALERTA DE LIMITE */}
      {atingiuLimite && (
        <div style={alerta}>
          🚨 Você atingiu o limite do plano.
          <button
            style={btnUpgrade}
            onClick={() => router.push('/bloqueado')}
          >
            Fazer upgrade
          </button>
        </div>
      )}

      <div style={header}>
        <h1>
          Orçamentos ({lista.length}/{limite === Infinity ? '∞' : limite})
        </h1>

        <button
          style={{
            ...btnNovo,
            opacity: atingiuLimite ? 0.5 : 1
          }}
          onClick={() => {
            if (atingiuLimite) {
              alert('Limite atingido. Faça upgrade.')
              router.push('/bloqueado')
              return
            }
            router.push('/orcamentos/novo')
          }}
        >
          + Novo Orçamento
        </button>
      </div>

      <table style={tabela}>

        <thead>
          <tr>
            <th>Cliente</th>
            <th>Valor</th>
            <th>Status</th>
            <th>Data</th>
            <th>Ações</th>
          </tr>
        </thead>

        <tbody>
          {lista.map(o => (
            <tr key={o.id} style={linha}>

              <td>{o.cliente_nome}</td>

              <td>{formatarMoeda(o.valor_total)}</td>

              <td>
                <span style={status(o.status)}>
                  {o.status || 'pendente'}
                </span>
              </td>

              <td>
                {new Date(o.created_at).toLocaleDateString()}
              </td>

              <td style={{ display: 'flex', gap: 6 }}>

              <button onClick={() => {
  const link = `${window.location.origin}/orcamentos/${o.id}`
  navigator.clipboard.writeText(link)
}}>
  🔗 Link
</button>

                <button
                  style={btn}
                  onClick={() => router.push(`/orcamentos/editar/${o.id}`)}
                >
                  Editar
                </button>

                <button
                  style={btn}
                  onClick={() => router.push(`/orcamentos/${o.id}`)}
                >
                  Ver
                </button>

                <button onClick={() => enviarCliente(o.id, o.telefone || '')}>
                  WhatsApp
                </button>
              </td>

            </tr>
          ))}
        </tbody>

      </table>

    </div>
  )
}

/* 🔥 LOADER */
function Loader() {
  return (
    <div style={loaderContainer}>
      <div style={spinner}></div>
      <p>Carregando...</p>
    </div>
  )
}

/* 🎨 ESTILO */

const alerta = {
  background: '#fef3c7',
  padding: 15,
  borderRadius: 8,
  marginBottom: 20,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
}

const btnUpgrade = {
  background: '#f59e0b',
  color: '#fff',
  padding: '6px 12px',
  borderRadius: 6,
  border: 'none',
  cursor: 'pointer'
}

const loaderContainer = {
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  justifyContent: 'center',
  height: '60vh',
}

const spinner = {
  width: 40,
  height: 40,
  border: '4px solid #e2e8f0',
  borderTop: '4px solid #2563eb',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
}

const container = { padding: 24 }

const header = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
}

const tabela = {
  width: '100%',
  marginTop: 20,
  borderCollapse: 'collapse'
}

const linha = {
  borderBottom: '1px solid #e2e8f0'
}

const btnNovo = {
  background: '#2563eb',
  color: '#fff',
  padding: '10px 14px',
  borderRadius: 8,
  border: 'none',
  cursor: 'pointer'
}

const btn = {
  padding: '6px 10px',
  borderRadius: 6,
  border: '1px solid #cbd5e1',
  cursor: 'pointer'
}

function status(s?: string) {
  if (s === 'aprovado') return { color: '#16a34a', fontWeight: 600 }
  if (s === 'recusado') return { color: '#dc2626', fontWeight: 600 }
  return { color: '#f59e0b', fontWeight: 600 }
}

function enviarCliente(id: string, telefone: string) {

  const link = `${window.location.origin}/orcamentos/${id}`
  const texto = `Olá! Segue seu orçamento:\n${link}`

  const url = telefone
    ? `https://wa.me/${telefone}?text=${encodeURIComponent(texto)}`
    : `https://wa.me/?text=${encodeURIComponent(texto)}`

  window.open(url)
}