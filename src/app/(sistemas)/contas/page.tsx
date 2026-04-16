'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useEmpresa } from '@/hooks/useEmpresa'

type Conta = {
  id: number
  obra_id: number | null
  tipo: 'pagar' | 'receber'
  descricao: string
  valor: number
  vencimento: string
  status: 'pendente' | 'pago' | 'atrasado'
  pago_em: string | null
  created_at: string
  obras?: { nome: string }
}

const STATUS_COR: Record<string, string> = {
  pendente: '#f59e0b',
  pago:     '#16a34a',
  atrasado: '#ef4444',
}

const STATUS_LABEL: Record<string, string> = {
  pendente: '⏳ Pendente',
  pago:     '✅ Pago',
  atrasado: '🚨 Atrasado',
}

export default function ContasPage() {
  const { empresaId, loading: loadingEmpresa } = useEmpresa()
  const router = useRouter()

  const [contas,      setContas]      = useState<Conta[]>([])
  const [obras,       setObras]       = useState<any[]>([])
  const [loading,     setLoading]     = useState(true)
  const [filtroTipo,  setFiltroTipo]  = useState<'todos' | 'pagar' | 'receber'>('todos')
  const [filtroObra,  setFiltroObra]  = useState<string>('todas')
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')
  const [salvando,    setSalvando]    = useState(false)
  const [erro,        setErro]        = useState('')

  // Form nova conta
  const [mostrarForm,  setMostrarForm]  = useState(false)
  const [formTipo,     setFormTipo]     = useState<'pagar' | 'receber'>('receber')
  const [formDesc,     setFormDesc]     = useState('')
  const [formValor,    setFormValor]    = useState('')
  const [formVenc,     setFormVenc]     = useState('')
  const [formObra,     setFormObra]     = useState('')

  const carregar = useCallback(async () => {
    if (!empresaId) return
    setLoading(true)
    try {
      const [{ data: contasData }, { data: obrasData }] = await Promise.all([
        supabase.from('contas').select('*, obras(nome)').eq('empresa_id', empresaId).order('vencimento', { ascending: true }),
        supabase.from('obras').select('id, nome').eq('empresa_id', empresaId).is('deleted_at', null),
      ])

      // Atualiza status de atrasadas automaticamente
      const hoje = new Date().toISOString().split('T')[0]
      const atrasadas = (contasData || []).filter(c => c.status === 'pendente' && c.vencimento < hoje)
      for (const c of atrasadas) {
        await supabase.from('contas').update({ status: 'atrasado' }).eq('id', c.id)
      }

      setContas((contasData || []).map(c => ({
        ...c,
        status: c.status === 'pendente' && c.vencimento < hoje ? 'atrasado' : c.status,
      })))
      setObras(obrasData || [])
    } finally {
      setLoading(false)
    }
  }, [empresaId])

  useEffect(() => {
    if (!loadingEmpresa) carregar()
  }, [loadingEmpresa, carregar])

  async function salvarConta() {
    setErro('')
    if (!formDesc.trim()) { setErro('Informe a descrição.'); return }
    if (!formValor || Number(formValor) <= 0) { setErro('Informe um valor válido.'); return }
    if (!formVenc) { setErro('Informe a data de vencimento.'); return }

    setSalvando(true)
    try {
      const { error } = await supabase.from('contas').insert({
        empresa_id: empresaId,
        obra_id:    formObra ? Number(formObra) : null,
        tipo:       formTipo,
        descricao:  formDesc.trim(),
        valor:      Number(formValor),
        vencimento: formVenc,
        status:     'pendente',
      })
      if (error) throw error
      setMostrarForm(false)
      setFormDesc(''); setFormValor(''); setFormVenc(''); setFormObra('')
      carregar()
    } catch {
      setErro('Erro ao salvar conta.')
    } finally {
      setSalvando(false)
    }
  }

  async function marcarPago(id: number) {
    if (!confirm('Marcar como pago?')) return
    await supabase.from('contas').update({ status: 'pago', pago_em: new Date().toISOString() }).eq('id', id)
    carregar()
  }

  async function excluir(id: number) {
    if (!confirm('Excluir esta conta?')) return
    await supabase.from('contas').delete().eq('id', id)
    carregar()
  }

  if (loadingEmpresa || loading) return <p style={{ padding: 24 }}>Carregando...</p>

  const hoje = new Date().toISOString().split('T')[0]

  const contasFiltradas = contas.filter(c => {
    if (filtroTipo !== 'todos' && c.tipo !== filtroTipo) return false
    if (filtroObra !== 'todas' && String(c.obra_id) !== filtroObra) return false
    if (filtroStatus !== 'todos' && c.status !== filtroStatus) return false
    return true
  })

  const totalPagar   = contasFiltradas.filter(c => c.tipo === 'pagar'   && c.status !== 'pago').reduce((a, c) => a + Number(c.valor), 0)
  const totalReceber = contasFiltradas.filter(c => c.tipo === 'receber' && c.status !== 'pago').reduce((a, c) => a + Number(c.valor), 0)
  const atrasadas    = contasFiltradas.filter(c => c.status === 'atrasado').length
  const proximasVenc = contasFiltradas.filter(c => {
    if (c.status !== 'pendente') return false
    const diff = Math.ceil((new Date(c.vencimento).getTime() - new Date(hoje).getTime()) / (1000*60*60*24))
    return diff >= 0 && diff <= 10
  }).length

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>

      {/* CABEÇALHO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>💳 Contas</h1>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>Contas a pagar e receber por obra</p>
        </div>
        <button onClick={() => setMostrarForm(!mostrarForm)}
          style={{ background: '#2563eb', color: '#fff', padding: '10px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
          + Nova Conta
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '16px 20px' }}>
          <p style={{ fontSize: 12, color: '#dc2626', fontWeight: 700, textTransform: 'uppercase' }}>A Pagar</p>
          <p style={{ fontSize: 22, fontWeight: 800, color: '#dc2626', marginTop: 4 }}>{format(totalPagar)}</p>
        </div>
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '16px 20px' }}>
          <p style={{ fontSize: 12, color: '#16a34a', fontWeight: 700, textTransform: 'uppercase' }}>A Receber</p>
          <p style={{ fontSize: 22, fontWeight: 800, color: '#16a34a', marginTop: 4 }}>{format(totalReceber)}</p>
        </div>
        <div style={{ background: atrasadas > 0 ? '#fef2f2' : '#f8fafc', border: `1px solid ${atrasadas > 0 ? '#fecaca' : '#e2e8f0'}`, borderRadius: 12, padding: '16px 20px' }}>
          <p style={{ fontSize: 12, color: atrasadas > 0 ? '#dc2626' : '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Atrasadas</p>
          <p style={{ fontSize: 22, fontWeight: 800, color: atrasadas > 0 ? '#dc2626' : '#0f172a', marginTop: 4 }}>{atrasadas}</p>
        </div>
        <div style={{ background: proximasVenc > 0 ? '#fffbeb' : '#f8fafc', border: `1px solid ${proximasVenc > 0 ? '#fde68a' : '#e2e8f0'}`, borderRadius: 12, padding: '16px 20px' }}>
          <p style={{ fontSize: 12, color: proximasVenc > 0 ? '#d97706' : '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Vencem em 10 dias</p>
          <p style={{ fontSize: 22, fontWeight: 800, color: proximasVenc > 0 ? '#d97706' : '#0f172a', marginTop: 4 }}>{proximasVenc}</p>
        </div>
      </div>

      {/* FORM NOVA CONTA */}
      {mostrarForm && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 24, marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>Nova Conta</h3>

          {/* Tipo */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
            {(['receber', 'pagar'] as const).map(t => (
              <button key={t} onClick={() => setFormTipo(t)} style={{
                flex: 1, padding: '11px 0', borderRadius: 8, border: `2px solid ${formTipo === t ? (t === 'receber' ? '#16a34a' : '#dc2626') : '#e2e8f0'}`,
                background: formTipo === t ? (t === 'receber' ? '#f0fdf4' : '#fef2f2') : '#f8fafc',
                color: formTipo === t ? (t === 'receber' ? '#16a34a' : '#dc2626') : '#64748b',
                fontWeight: 700, cursor: 'pointer', fontSize: 14,
              }}>
                {t === 'receber' ? '💰 A Receber' : '💸 A Pagar'}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={labelSt}>Descrição *</label>
              <input value={formDesc} onChange={e => setFormDesc(e.target.value)}
                placeholder="Ex: Parcela 1 — Cliente João" style={inputSt} />
            </div>
            <div>
              <label style={labelSt}>Valor (R$) *</label>
              <input type="number" value={formValor} onChange={e => setFormValor(e.target.value)}
                placeholder="0,00" style={inputSt} min="0" step="0.01" />
            </div>
            <div>
              <label style={labelSt}>Vencimento *</label>
              <input type="date" value={formVenc} onChange={e => setFormVenc(e.target.value)} style={inputSt} />
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={labelSt}>Obra (opcional)</label>
            <select value={formObra} onChange={e => setFormObra(e.target.value)} style={inputSt}>
              <option value="">Sem obra específica</option>
              {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
            </select>
          </div>

          {erro && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>⚠ {erro}</p>}

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={salvarConta} disabled={salvando}
              style={{ background: '#2563eb', color: '#fff', padding: '11px 24px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, opacity: salvando ? 0.7 : 1 }}>
              {salvando ? 'Salvando...' : 'Salvar Conta'}
            </button>
            <button onClick={() => { setMostrarForm(false); setErro('') }}
              style={{ background: '#f1f5f9', color: '#64748b', padding: '11px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600 }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* FILTROS */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value as any)} style={selectFiltro}>
          <option value="todos">Todos os tipos</option>
          <option value="receber">A Receber</option>
          <option value="pagar">A Pagar</option>
        </select>
        <select value={filtroObra} onChange={e => setFiltroObra(e.target.value)} style={selectFiltro}>
          <option value="todas">Todas as obras</option>
          {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
        </select>
        <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} style={selectFiltro}>
          <option value="todos">Todos os status</option>
          <option value="pendente">Pendente</option>
          <option value="atrasado">Atrasado</option>
          <option value="pago">Pago</option>
        </select>
      </div>

      {/* LISTA */}
      {contasFiltradas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0' }}>
          <p style={{ fontSize: 32, marginBottom: 12 }}>💳</p>
          <p style={{ fontWeight: 600, color: '#0f172a' }}>Nenhuma conta encontrada</p>
          <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>Crie sua primeira conta clicando em "+ Nova Conta"</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {contasFiltradas.map(c => {
            const diasVenc = Math.ceil((new Date(c.vencimento + 'T12:00:00').getTime() - new Date().getTime()) / (1000*60*60*24))
            const alertaProximo = c.status === 'pendente' && diasVenc >= 0 && diasVenc <= 10

            return (
              <div key={c.id} style={{
                background: '#fff', borderRadius: 12, padding: '16px 20px',
                border: `1px solid ${c.status === 'atrasado' ? '#fecaca' : alertaProximo ? '#fde68a' : '#e2e8f0'}`,
                borderLeft: `4px solid ${c.tipo === 'receber' ? '#16a34a' : '#ef4444'}`,
                display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
              }}>
                {/* Info principal */}
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <p style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{c.descricao}</p>
                    <span style={{ background: STATUS_COR[c.status] + '20', color: STATUS_COR[c.status], fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999 }}>
                      {STATUS_LABEL[c.status]}
                    </span>
                    {alertaProximo && c.status === 'pendente' && (
                      <span style={{ background: '#fef3c7', color: '#d97706', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999 }}>
                        ⏰ {diasVenc === 0 ? 'Vence hoje!' : `${diasVenc}d`}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                    {c.obras?.nome ? `🏗️ ${c.obras.nome} · ` : ''}
                    Vence: {new Date(c.vencimento + 'T12:00:00').toLocaleDateString('pt-BR')}
                    {c.pago_em ? ` · Pago em: ${new Date(c.pago_em).toLocaleDateString('pt-BR')}` : ''}
                  </p>
                </div>

                {/* Valor */}
                <p style={{ fontWeight: 800, fontSize: 18, color: c.tipo === 'receber' ? '#16a34a' : '#dc2626', minWidth: 120, textAlign: 'right' }}>
                  {c.tipo === 'receber' ? '+' : '-'}{format(Number(c.valor))}
                </p>

                {/* Ações */}
                <div style={{ display: 'flex', gap: 8 }}>
                  {c.status !== 'pago' && (
                    <button onClick={() => marcarPago(c.id)}
                      style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', padding: '7px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                      ✓ Pago
                    </button>
                  )}
                  <button onClick={() => excluir(c.id)}
                    style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '7px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                    ✕
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function format(v: number) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const labelSt: React.CSSProperties  = { fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }
const inputSt: React.CSSProperties  = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', color: '#0f172a', background: '#fff' }
const selectFiltro: React.CSSProperties = { padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, background: '#fff', color: '#374151', cursor: 'pointer' }