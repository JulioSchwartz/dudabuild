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
  token?: string
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
    try {
      const { data, error } = await supabase
        .from('orcamentos')
        .select('*')
        .eq('empresa_id', empresaId)
        .order('created_at', { ascending: false })
 
      if (error) throw error
 
      setLista(data || [])
 
    } catch (err) {
      console.error(err)
      alert('Erro ao carregar orçamentos')
    } finally {
      setLoading(false)
    }
  }
 
  function formatarMoeda(valor: number) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }
 
  const limite = limites?.orcamentos
  const atingiuLimite = limite !== undefined && limite !== Infinity && lista.length >= limite
 
  if (loadingEmpresa || loading) return <Loader />
 
  return (
    <div style={container}>
 
      {atingiuLimite && (
        <div style={alerta}>
          🚨 Limite do plano atingido
          <button style={btnUpgrade} onClick={() => router.push('/planos')}>
            Fazer upgrade
          </button>
        </div>
      )}
 
      <div style={header}>
        <h1>📑 Orçamentos</h1>
        <button
          style={btnNovo}
          onClick={() => {
            if (atingiuLimite) {
              alert('Limite atingido. Faça upgrade para continuar.')
              return
            }
            router.push('/orcamentos/novo')
          }}
        >
          + Novo Orçamento
        </button>
      </div>
 
      {lista.length === 0 && (
        <p style={{ color: '#64748b' }}>Nenhum orçamento criado ainda.</p>
      )}
 
      <div style={grid}>
        {lista.map(o => (
          <div key={o.id} style={card}>
 
            <div>
              <h3>{o.cliente_nome}</h3>
              <p style={valorStyle}>{formatarMoeda(o.valor_total)}</p>
              <span style={badge(o.status)}>{o.status || 'pendente'}</span>
              <p style={dataStyle}>
                {new Date(o.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
 
            <div style={acoes}>
              <button
                onClick={() => {
                  if (!o.token) {
                    alert('Erro: orçamento sem token. Recrie o orçamento.')
                    return
                  }
                  copiarLink(o.id, o.token)
                }}
                style={btnSec}
              >
                🔗 Link
              </button>
 
              <button
                onClick={() => router.push(`/orcamentos/${o.id}`)}
                style={btnPrim}
              >
                Ver
              </button>
 
              <button
                onClick={() => router.push(`/orcamentos/editar/${o.id}`)}
                style={btnSec}
              >
                Editar
              </button>
 
              <button
                onClick={() => {
                  if (!o.token) {
                    alert('Erro: orçamento sem token.')
                    return
                  }
                  enviarCliente(o.id, o.telefone || '', o.token)
                }}
                style={btnWhats}
              >
                WhatsApp
              </button>
            </div>
 
          </div>
        ))}
      </div>
 
    </div>
  )
}
 
/* ================= FUNÇÕES ================= */
 
function copiarLink(id: string, token: string) {
  const link = `${window.location.origin}/orcamento-publico/${id}?token=${token}`
  navigator.clipboard.writeText(link)
  alert('Link copiado!')
}
 
function enviarCliente(id: string, telefone: string, token: string) {
  const link = `${window.location.origin}/orcamento-publico/${id}?token=${token}`
  const texto = `Olá! Segue sua proposta:\n${link}`
  const url = telefone
    ? `https://wa.me/${telefone}?text=${encodeURIComponent(texto)}`
    : `https://wa.me/?text=${encodeURIComponent(texto)}`
  window.open(url)
}
 
function badge(status?: string): React.CSSProperties {
  if (status === 'aprovado') return { color: '#16a34a', fontWeight: 600 }
  if (status === 'recusado') return { color: '#dc2626', fontWeight: 600 }
  return { color: '#f59e0b', fontWeight: 600 }
}
 
/* ================= UI ================= */
 
function Loader() {
  return <p style={{ padding: 40 }}>Carregando...</p>
}
 
/* ================= ESTILOS ================= */
 
const container: React.CSSProperties = { padding: 24 }
 
const header: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 20
}
 
const grid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))',
  gap: 16
}
 
const card: React.CSSProperties = {
  background: '#fff',
  padding: 20,
  borderRadius: 12,
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between'
}
 
const valorStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  marginTop: 6
}
 
const dataStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#64748b',
  marginTop: 6
}
 
const acoes: React.CSSProperties = {
  marginTop: 10,
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8
}
 
const btnNovo: React.CSSProperties = {
  background: '#2563eb',
  color: '#fff',
  padding: '10px 14px',
  borderRadius: 8,
  border: 'none',
  cursor: 'pointer'
}
 
const btnPrim: React.CSSProperties = {
  background: '#2563eb',
  color: '#fff',
  padding: '8px 12px',
  borderRadius: 6,
  border: 'none',
  cursor: 'pointer'
}
 
const btnSec: React.CSSProperties = {
  background: '#e2e8f0',
  padding: '8px 12px',
  borderRadius: 6,
  border: 'none',
  cursor: 'pointer'
}
 
const btnWhats: React.CSSProperties = {
  background: '#22c55e',
  color: '#fff',
  padding: '8px 12px',
  borderRadius: 6,
  border: 'none',
  cursor: 'pointer'
}
 
const alerta: React.CSSProperties = {
  background: '#fef3c7',
  padding: 12,
  borderRadius: 8,
  marginBottom: 20,
  display: 'flex',
  alignItems: 'center',
  gap: 10
}
 
const btnUpgrade: React.CSSProperties = {
  background: '#f59e0b',
  color: '#fff',
  padding: '6px 10px',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer'
}