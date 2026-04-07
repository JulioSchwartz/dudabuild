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

    const { data, error } = await supabase
      .from('orcamentos')
      .select('*')
      .eq('empresa_id', empresaId)

    if (error) {
      console.error(error)
      alert('Erro ao carregar orçamentos')
      return
    }

    setLista(data || [])
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

  if (loadingEmpresa || loading) return <Loader />

  return (
    <div style={container}>

      {atingiuLimite && (
        <div style={alerta}>
          🚨 Limite do plano atingido
          <button style={btnUpgrade} onClick={()=>router.push('/bloqueado')}>
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
              alert('Limite atingido')
              return
            }
            router.push('/orcamentos/novo')
          }}
        >
          + Novo Orçamento
        </button>
      </div>

      {/* 🔥 CARDS PREMIUM */}
      <div style={grid}>

        {lista.map(o => (
          <div key={o.id} style={card}>

            <div>
              <h3>{o.cliente_nome}</h3>

              <p style={valor}>
                {formatarMoeda(o.valor_total)}
              </p>

              <span style={badge(o.status)}>
                {o.status || 'pendente'}
              </span>

              <p style={data}>
                {new Date(o.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>

            <div style={acoes}>

              <button onClick={() => copiarLink(o.id, (o as any).token)} style={btnSec}>
                🔗 Link
              </button>

              <button onClick={() => router.push(`/orcamentos/${o.id}`)} style={btnPrim}>
                Ver
              </button>

              <button onClick={() => router.push(`/orcamentos/editar/${o.id}`)} style={btnSec}>
                Editar
              </button>

              <button onClick={() => enviarCliente(o.id, o.telefone || '')} style={btnWhats}>
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

function copiarLink(id:string, token:string){
  const link = `${window.location.origin}/orcamento-publico/${id}?token=${token}`
  navigator.clipboard.writeText(link)
  alert('Link copiado!')
}

function enviarCliente(id: string, telefone: string) {

  const link = `${window.location.origin}/orcamentos/${id}`
  const texto = `Olá! Segue seu orçamento:\n${link}`

  const url = telefone
    ? `https://wa.me/${telefone}?text=${encodeURIComponent(texto)}`
    : `https://wa.me/?text=${encodeURIComponent(texto)}`

  window.open(url)
}

/* ================= UI ================= */

function Loader(){
  return <p style={{ padding:40 }}>Carregando...</p>
}

const container = { padding:24 }

const header = {
  display:'flex',
  justifyContent:'space-between',
  marginBottom:20
}

const grid = {
  display:'grid',
  gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',
  gap:16
}

const card = {
  background:'#fff',
  padding:20,
  borderRadius:12,
  boxShadow:'0 4px 12px rgba(0,0,0,0.05)',
  display:'flex',
  flexDirection:'column',
  justifyContent:'space-between'
}

const valor = {
  fontSize:18,
  fontWeight:700,
  marginTop:6
}

const data = {
  fontSize:12,
  color:'#64748b',
  marginTop:6
}

const acoes = {
  marginTop:10,
  display:'flex',
  flexWrap:'wrap',
  gap:8
}

const btnNovo = {
  background:'#2563eb',
  color:'#fff',
  padding:'10px 14px',
  borderRadius:8,
  border:'none'
}

const btnPrim = {
  background:'#2563eb',
  color:'#fff',
  padding:'8px 12px',
  borderRadius:6,
  border:'none'
}

const btnSec = {
  background:'#e2e8f0',
  padding:'8px 12px',
  borderRadius:6,
  border:'none'
}

const btnWhats = {
  background:'#22c55e',
  color:'#fff',
  padding:'8px 12px',
  borderRadius:6,
  border:'none'
}

const alerta = {
  background:'#fef3c7',
  padding:12,
  borderRadius:8,
  marginBottom:20
}

const btnUpgrade = {
  marginLeft:10,
  background:'#f59e0b',
  color:'#fff',
  padding:'6px 10px',
  border:'none',
  borderRadius:6
}

function badge(status?:string){
  if(status==='aprovado') return { color:'#16a34a', fontWeight:600 }
  if(status==='recusado') return { color:'#dc2626', fontWeight:600 }
  return { color:'#f59e0b', fontWeight:600 }
}