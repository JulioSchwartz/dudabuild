'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useEmpresa } from '@/hooks/useEmpresa'

export default function Obras() {

  const { empresaId, loading: loadingEmpresa, bloqueado } = useEmpresa()
  const router = useRouter()

  const [obras,      setObras]      = useState<any[]>([])
  const [financeiro, setFinanceiro] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (!loadingEmpresa && bloqueado) router.push('/bloqueado')
  }, [loadingEmpresa, bloqueado, router])

  useEffect(() => {
    if (!empresaId) return
    carregar()
  }, [empresaId])

  async function carregar() {
    try {
      const [{ data: obrasData, error: errObras }, { data: finData, error: errFin }] =
        await Promise.all([
          supabase.from('obras').select('*').eq('empresa_id', empresaId),
          supabase.from('financeiro').select('*').eq('empresa_id', empresaId),
        ])
      if (errObras) throw errObras
      if (errFin)   throw errFin
      setObras(obrasData || [])
      setFinanceiro(finData || [])
    } catch (err) {
      console.error('Erro obras:', err)
      alert('Erro ao carregar obras')
    } finally {
      setLoadingData(false)
    }
  }

  async function excluir(id: number) {
    if (!confirm('Excluir obra e todos os lançamentos financeiros relacionados?')) return
    try {
      const { error: errFin } = await supabase.from('financeiro').delete().eq('obra_id', id)
      if (errFin) throw errFin
      const { error: errObra } = await supabase.from('obras').delete().eq('id', id)
      if (errObra) throw errObra
      carregar()
    } catch (err) {
      console.error('Erro ao excluir:', err)
      alert('Erro ao excluir obra')
    }
  }

  function calcularLucro(obraId: number) {
    const itens   = financeiro.filter(f => f.obra_id === obraId)
    const entrada = itens.filter(i => i.tipo === 'entrada').reduce((a, b) => a + Number(b.valor || 0), 0)
    const saida   = itens.filter(i => i.tipo === 'saida').reduce((a, b)   => a + Number(b.valor || 0), 0)
    return entrada - saida
  }

  if (loadingEmpresa || loadingData) return <p style={{ padding: 24 }}>Carregando...</p>

  return (
    <div style={{ padding: 24 }}>

      <div style={header}>
        <h1>🏗️ Obras</h1>
        <button style={btnNova} onClick={() => router.push('/obras/nova')}>
          + Nova Obra
        </button>
      </div>

      {obras.length === 0 && (
        <p style={{ color: '#64748b' }}>Nenhuma obra cadastrada.</p>
      )}

      <div style={grid}>
        {obras.map(obra => {
          const lucro = calcularLucro(obra.id)

          return (
            <div key={obra.id} style={cardStyle(lucro)}>
              <h3>{obra.nome}</h3>
              <p style={{ color: '#64748b' }}>{obra.cliente}</p>

              <p style={valorStyle}>
                💰 {format(Number(obra.valor || 0))}
              </p>

              <p style={{ color: lucro >= 0 ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                {lucro >= 0 ? 'Lucro' : 'Prejuízo'}: {format(lucro)}
              </p>

              <div style={botoes}>
                <Link href={`/obras/${obra.id}`}>
                  <button style={btnVer}>Ver</button>
                </Link>

                <button
                  onClick={() => router.push(`/obras/${obra.id}/editar`)}
                  style={btnEditar}
                >
                  Editar
                </button>

                <button onClick={() => excluir(obra.id)} style={btnExcluir}>
                  Excluir
                </button>
              </div>
            </div>
          )
        })}
      </div>

    </div>
  )
}

function format(v: number) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const header: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between',
  alignItems: 'center', marginBottom: 20
}

const grid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))',
  gap: 16
}

const cardStyle = (lucro: number): React.CSSProperties => ({
  background: lucro >= 0 ? '#ecfdf5' : '#fee2e2',
  padding: 20, borderRadius: 12,
  border: `1px solid ${lucro >= 0 ? '#16a34a' : '#dc2626'}`,
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
})

const valorStyle: React.CSSProperties = { fontWeight: 600, marginTop: 6 }

const botoes: React.CSSProperties = { marginTop: 10, display: 'flex', gap: 8 }

const btnNova: React.CSSProperties = {
  background: '#2563eb', color: '#fff',
  padding: '10px 14px', borderRadius: 8, border: 'none', cursor: 'pointer'
}

const btnVer: React.CSSProperties = {
  background: '#22c55e', color: '#fff',
  border: 'none', padding: '8px 12px', borderRadius: 6, cursor: 'pointer'
}

const btnEditar: React.CSSProperties = {
  background: '#f59e0b', color: '#fff',
  border: 'none', padding: '8px 12px', borderRadius: 6, cursor: 'pointer'
}

const btnExcluir: React.CSSProperties = {
  background: '#ef4444', color: '#fff',
  border: 'none', padding: '8px 12px', borderRadius: 6, cursor: 'pointer'
}