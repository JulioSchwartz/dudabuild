'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useEmpresa } from '@/hooks/useEmpresa'

export default function Obras() {
  const { empresaId, loading: loadingEmpresa, bloqueado, perfil } = useEmpresa()
  const router = useRouter()

  const [obras,       setObras]       = useState<any[]>([])
  const [financeiro,  setFinanceiro]  = useState<any[]>([])
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
          supabase.from('obras').select('*').eq('empresa_id', empresaId).is('deleted_at', null),
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
    if (!confirm('Excluir obra? Os dados serão mantidos para controle de limites do plano.')) return
    try {
      // Soft delete — mantém no banco mas marca como deletado
      await supabase.from('obras').update({ deleted_at: new Date().toISOString() }).eq('id', id)
      carregar()
    } catch (err) {
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

  const emAndamento = obras.filter(o => o.status !== 'concluida')
  const concluidas  = obras.filter(o => o.status === 'concluida')

  const somenteNavegacao = perfil === 'financeiro'
  const podeCriarObra   = perfil === 'admin' || perfil === 'engenheiro'
  const podeExcluirObra = perfil === 'admin'
  const podeEditarObra  = perfil === 'admin' || perfil === 'engenheiro'

  return (
    <div style={{ padding: 24 }}>
      <div style={header}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>🏗️ Obras</h1>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>
            {somenteNavegacao
              ? 'Selecione uma obra para lançar financeiro'
              : `${emAndamento.length} em andamento · ${concluidas.length} concluída(s)`}
          </p>
        </div>
        {podeCriarObra && (
          <button style={btnNova} onClick={() => router.push('/obras/nova')}>+ Nova Obra</button>
        )}
      </div>

      {obras.length === 0 && (
        <div style={vazioCard}>
          <p style={{ fontSize: 36 }}>🏗️</p>
          <p style={{ fontWeight: 600, color: '#0f172a' }}>Nenhuma obra cadastrada</p>
          <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>Crie sua primeira obra para começar</p>
        </div>
      )}

      {emAndamento.length > 0 && (
        <div style={secaoWrapper}>
          <div style={secaoHeader}>
            <h2 style={secaoTitulo}>🔄 Em Andamento</h2>
            <span style={secaoBadge('#f59e0b', '#fef3c7')}>{emAndamento.length}</span>
          </div>
          <div style={grid}>
            {emAndamento.map(obra => {
              const lucro = calcularLucro(obra.id)
              const perc  = Number(obra.percentual_concluido || 0)
              const corPerc = perc < 30 ? '#ef4444' : perc < 70 ? '#f59e0b' : '#22c55e'
              return (
                <div key={obra.id} style={cardAndamento(lucro)}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>{obra.nome}</h3>
                      <p style={{ color: '#64748b', fontSize: 13, marginTop: 2 }}>{obra.cliente}</p>
                    </div>
                    <span style={{ fontSize: 18, fontWeight: 800, color: corPerc, marginLeft: 8 }}>{perc}%</span>
                  </div>
                  <div style={{ height: 6, background: '#e2e8f0', borderRadius: 999, margin: '10px 0', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${perc}%`, background: corPerc, borderRadius: 999 }} />
                  </div>
                  <p style={{ fontWeight: 600, fontSize: 14 }}>💰 {format(Number(obra.valor || 0))}</p>
                  {!somenteNavegacao && (
                    <p style={{ color: lucro >= 0 ? '#16a34a' : '#dc2626', fontWeight: 600, fontSize: 13, marginTop: 2 }}>
                      {lucro >= 0 ? '↑ Lucro' : '↓ Prejuízo'}: {format(lucro)}
                    </p>
                  )}
                  {obra.data_previsao && (
                    <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                      Previsão: {new Date(obra.data_previsao + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </p>
                  )}
                  <div style={botoes}>
                    <Link href={`/obras/${obra.id}`}>
                      <button style={btnVer}>{somenteNavegacao ? '💰 Lançar' : 'Ver'}</button>
                    </Link>
                    {podeEditarObra  && <button onClick={() => router.push(`/obras/${obra.id}/editar`)} style={btnEditar}>Editar</button>}
                    {podeExcluirObra && <button onClick={() => excluir(obra.id)} style={btnExcluir}>Excluir</button>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {concluidas.length > 0 && (
        <div style={secaoWrapper}>
          <div style={secaoHeader}>
            <h2 style={secaoTitulo}>✅ Concluídas</h2>
            <span style={secaoBadge('#16a34a', '#dcfce7')}>{concluidas.length}</span>
          </div>
          <div style={grid}>
            {concluidas.map(obra => {
              const lucro = calcularLucro(obra.id)
              return (
                <div key={obra.id} style={cardConcluida}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>{obra.nome}</h3>
                      <p style={{ color: '#64748b', fontSize: 13, marginTop: 2 }}>{obra.cliente}</p>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#16a34a', background: '#dcfce7', padding: '3px 10px', borderRadius: 999 }}>100%</span>
                  </div>
                  <div style={{ height: 6, background: '#bbf7d0', borderRadius: 999, margin: '10px 0' }}>
                    <div style={{ height: '100%', width: '100%', background: '#16a34a', borderRadius: 999 }} />
                  </div>
                  <p style={{ fontWeight: 600, fontSize: 14 }}>💰 {format(Number(obra.valor || 0))}</p>
                  {!somenteNavegacao && (
                    <p style={{ color: lucro >= 0 ? '#16a34a' : '#dc2626', fontWeight: 600, fontSize: 13, marginTop: 2 }}>
                      {lucro >= 0 ? '↑ Lucro' : '↓ Prejuízo'}: {format(lucro)}
                    </p>
                  )}
                  {obra.data_conclusao && (
                    <p style={{ fontSize: 12, color: '#16a34a', marginTop: 4, fontWeight: 600 }}>
                      ✅ Concluída em {new Date(obra.data_conclusao + 'T12:00:00').toLocaleDateString('pt-BR')}
                    </p>
                  )}
                  <div style={botoes}>
                    <Link href={`/obras/${obra.id}`}>
                      <button style={btnVer}>{somenteNavegacao ? '💰 Lançar' : 'Ver'}</button>
                    </Link>
                    {podeExcluirObra && <button onClick={() => excluir(obra.id)} style={btnExcluir}>Excluir</button>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function format(v: number) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const header: React.CSSProperties       = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }
const secaoWrapper: React.CSSProperties = { marginBottom: 32 }
const secaoHeader: React.CSSProperties  = { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }
const secaoTitulo: React.CSSProperties  = { fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }
const secaoBadge = (cor: string, bg: string): React.CSSProperties => ({ background: bg, color: cor, fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 999 })
const grid: React.CSSProperties         = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }
const cardBase: React.CSSProperties     = { background: '#fff', padding: 20, borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }
const cardAndamento = (lucro: number): React.CSSProperties => ({ ...cardBase, borderLeft: `4px solid ${lucro >= 0 ? '#22c55e' : '#ef4444'}` })
const cardConcluida: React.CSSProperties = { ...cardBase, borderLeft: '4px solid #16a34a', background: '#f0fdf4' }
const botoes: React.CSSProperties       = { marginTop: 14, display: 'flex', gap: 8 }
const vazioCard: React.CSSProperties    = { textAlign: 'center', padding: '48px 20px', background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }
const btnNova: React.CSSProperties      = { background: '#2563eb', color: '#fff', padding: '10px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600 }
const btnVer: React.CSSProperties       = { background: '#22c55e', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }
const btnEditar: React.CSSProperties    = { background: '#f59e0b', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }
const btnExcluir: React.CSSProperties   = { background: '#ef4444', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }