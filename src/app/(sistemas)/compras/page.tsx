'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useEmpresa } from '@/hooks/useEmpresa'

type Compra = {
  id: number
  obra_id: number | null
  fornecedor_id: number | null
  descricao: string
  valor: number | null
  status: 'solicitado' | 'aprovado' | 'recebido'
  created_at: string
  obras?: { nome: string }
  fornecedores?: { nome: string }
}

const STATUS_COR: Record<string, string> = {
  solicitado: '#f59e0b',
  aprovado:   '#3b82f6',
  recebido:   '#16a34a',
}

const STATUS_LABEL: Record<string, string> = {
  solicitado: '📋 Solicitado',
  aprovado:   '✅ Aprovado',
  recebido:   '📦 Recebido',
}

export default function ComprasPage() {
  const { empresaId, loading: loadingEmpresa } = useEmpresa()

  const [compras,      setCompras]      = useState<Compra[]>([])
  const [obras,        setObras]        = useState<any[]>([])
  const [fornecedores, setFornecedores] = useState<any[]>([])
  const [loading,      setLoading]      = useState(true)
  const [salvando,     setSalvando]     = useState(false)
  const [erro,         setErro]         = useState('')
  const [filtroObra,   setFiltroObra]   = useState('todas')
  const [filtroStatus, setFiltroStatus] = useState('todos')

  // Form
  const [mostrarForm,   setMostrarForm]   = useState(false)
  const [formDesc,      setFormDesc]      = useState('')
  const [formValor,     setFormValor]     = useState('')
  const [formObra,      setFormObra]      = useState('')
  const [formFornecedor, setFormFornecedor] = useState('')
  const [formStatus,    setFormStatus]    = useState<'solicitado' | 'aprovado' | 'recebido'>('solicitado')
  const [gerarConta,    setGerarConta]    = useState(false)
  const [formVenc,      setFormVenc]      = useState('')

  const carregar = useCallback(async () => {
    if (!empresaId) return
    setLoading(true)
    try {
      const [{ data: cData }, { data: oData }, { data: fData }] = await Promise.all([
        supabase.from('compras').select('*, obras(nome), fornecedores(nome)').eq('empresa_id', empresaId).order('created_at', { ascending: false }),
        supabase.from('obras').select('id, nome').eq('empresa_id', empresaId).is('deleted_at', null),
        supabase.from('fornecedores').select('id, nome').eq('empresa_id', empresaId).order('nome'),
      ])
      setCompras(cData || [])
      setObras(oData || [])
      setFornecedores(fData || [])
    } finally {
      setLoading(false)
    }
  }, [empresaId])

  useEffect(() => {
    if (!loadingEmpresa) carregar()
  }, [loadingEmpresa, carregar])

  async function salvar() {
    setErro('')
    if (!formDesc.trim()) { setErro('Informe a descrição.'); return }
    if (gerarConta && !formVenc) { setErro('Informe a data de vencimento para gerar a conta.'); return }
    if (gerarConta && (!formValor || Number(formValor) <= 0)) { setErro('Informe o valor para gerar a conta.'); return }

    setSalvando(true)
    try {
      let contaId: number | null = null

      // Gera conta a pagar se solicitado
      if (gerarConta && formValor && formVenc) {
        const { data: novaConta } = await supabase.from('contas').insert({
          empresa_id: empresaId,
          obra_id:    formObra ? Number(formObra) : null,
          tipo:       'pagar',
          descricao:  `Compra: ${formDesc.trim()}`,
          valor:      Number(formValor),
          vencimento: formVenc,
          status:     'pendente',
        }).select().single()
        contaId = novaConta?.id || null
      }

      await supabase.from('compras').insert({
        empresa_id:    empresaId,
        obra_id:       formObra ? Number(formObra) : null,
        fornecedor_id: formFornecedor ? Number(formFornecedor) : null,
        descricao:     formDesc.trim(),
        valor:         formValor ? Number(formValor) : null,
        status:        formStatus,
        conta_id:      contaId,
      })

      setMostrarForm(false)
      setFormDesc(''); setFormValor(''); setFormObra(''); setFormFornecedor('')
      setFormStatus('solicitado'); setGerarConta(false); setFormVenc('')
      carregar()
    } catch {
      setErro('Erro ao salvar compra.')
    } finally {
      setSalvando(false)
    }
  }

  async function atualizarStatus(id: number, status: 'solicitado' | 'aprovado' | 'recebido') {
    await supabase.from('compras').update({ status }).eq('id', id)
    carregar()
  }

  async function excluir(id: number) {
    if (!confirm('Excluir esta compra?')) return
    await supabase.from('compras').delete().eq('id', id)
    carregar()
  }

  if (loadingEmpresa || loading) return <p style={{ padding: 24 }}>Carregando...</p>

  const comprasFiltradas = compras.filter(c => {
    if (filtroObra !== 'todas' && String(c.obra_id) !== filtroObra) return false
    if (filtroStatus !== 'todos' && c.status !== filtroStatus) return false
    return true
  })

  const totalSolicitado = compras.filter(c => c.status === 'solicitado').reduce((a, c) => a + Number(c.valor || 0), 0)
  const totalAprovado   = compras.filter(c => c.status === 'aprovado').reduce((a, c) => a + Number(c.valor || 0), 0)
  const totalRecebido   = compras.filter(c => c.status === 'recebido').reduce((a, c) => a + Number(c.valor || 0), 0)

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: '0 auto' }}>

      {/* CABEÇALHO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>🛒 Compras</h1>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>Ordens de compra por obra e fornecedor</p>
        </div>
        <button onClick={() => setMostrarForm(!mostrarForm)}
          style={{ background: '#2563eb', color: '#fff', padding: '10px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
          + Nova Compra
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Solicitado', valor: totalSolicitado, cor: '#f59e0b', bg: '#fffbeb' },
          { label: 'Aprovado',   valor: totalAprovado,   cor: '#3b82f6', bg: '#eff6ff' },
          { label: 'Recebido',   valor: totalRecebido,   cor: '#16a34a', bg: '#f0fdf4' },
        ].map(k => (
          <div key={k.label} style={{ background: k.bg, borderRadius: 12, padding: '16px 20px', border: `1px solid ${k.cor}30` }}>
            <p style={{ fontSize: 12, color: k.cor, fontWeight: 700, textTransform: 'uppercase' }}>{k.label}</p>
            <p style={{ fontSize: 22, fontWeight: 800, color: k.cor, marginTop: 4 }}>{format(k.valor)}</p>
          </div>
        ))}
      </div>

      {/* FORM */}
      {mostrarForm && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 24, marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>Nova Compra</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={labelSt}>Descrição do material/serviço *</label>
              <input value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="Ex: 500 sacos de cimento CP-II" style={inputSt} />
            </div>
            <div>
              <label style={labelSt}>Valor (R$)</label>
              <input type="number" value={formValor} onChange={e => setFormValor(e.target.value)} placeholder="0,00" style={inputSt} min="0" step="0.01" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={labelSt}>Obra</label>
              <select value={formObra} onChange={e => setFormObra(e.target.value)} style={inputSt}>
                <option value="">Sem obra</option>
                {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
              </select>
            </div>
            <div>
              <label style={labelSt}>Fornecedor</label>
              <select value={formFornecedor} onChange={e => setFormFornecedor(e.target.value)} style={inputSt}>
                <option value="">Selecionar...</option>
                {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
              </select>
            </div>
            <div>
              <label style={labelSt}>Status</label>
              <select value={formStatus} onChange={e => setFormStatus(e.target.value as any)} style={inputSt}>
                <option value="solicitado">📋 Solicitado</option>
                <option value="aprovado">✅ Aprovado</option>
                <option value="recebido">📦 Recebido</option>
              </select>
            </div>
          </div>

          {/* Gerar conta a pagar */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16, marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: gerarConta ? 14 : 0 }}>
              <input type="checkbox" checked={gerarConta} onChange={e => setGerarConta(e.target.checked)}
                style={{ width: 16, height: 16, cursor: 'pointer' }} />
              <label style={{ fontSize: 14, fontWeight: 600, color: '#374151', cursor: 'pointer' }}
                onClick={() => setGerarConta(!gerarConta)}>
                Gerar conta a pagar automaticamente
              </label>
            </div>
            {gerarConta && (
              <div>
                <label style={labelSt}>Data de vencimento *</label>
                <input type="date" value={formVenc} onChange={e => setFormVenc(e.target.value)} style={{ ...inputSt, maxWidth: 220 }} />
              </div>
            )}
          </div>

          {erro && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>⚠ {erro}</p>}

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={salvar} disabled={salvando}
              style={{ background: '#2563eb', color: '#fff', padding: '11px 24px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, opacity: salvando ? 0.7 : 1 }}>
              {salvando ? 'Salvando...' : 'Salvar Compra'}
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
        <select value={filtroObra} onChange={e => setFiltroObra(e.target.value)} style={selectFiltro}>
          <option value="todas">Todas as obras</option>
          {obras.map(o => <option key={o.id} value={o.id}>{o.nome}</option>)}
        </select>
        <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} style={selectFiltro}>
          <option value="todos">Todos os status</option>
          <option value="solicitado">Solicitado</option>
          <option value="aprovado">Aprovado</option>
          <option value="recebido">Recebido</option>
        </select>
      </div>

      {/* LISTA */}
      {comprasFiltradas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0' }}>
          <p style={{ fontSize: 32, marginBottom: 12 }}>🛒</p>
          <p style={{ fontWeight: 600, color: '#0f172a' }}>Nenhuma compra registrada</p>
          <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>Registre compras de materiais e serviços por obra</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {comprasFiltradas.map(c => (
            <div key={c.id} style={{
              background: '#fff', borderRadius: 12, padding: '16px 20px',
              border: '1px solid #e2e8f0',
              borderLeft: `4px solid ${STATUS_COR[c.status]}`,
              display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
            }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <p style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{c.descricao}</p>
                  <span style={{ background: STATUS_COR[c.status] + '20', color: STATUS_COR[c.status], fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999 }}>
                    {STATUS_LABEL[c.status]}
                  </span>
                </div>
                <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                  {c.obras?.nome ? `🏗️ ${c.obras.nome}` : ''}
                  {c.fornecedores?.nome ? ` · 🏭 ${c.fornecedores.nome}` : ''}
                  {` · ${new Date(c.created_at).toLocaleDateString('pt-BR')}`}
                </p>
              </div>

              <p style={{ fontWeight: 800, fontSize: 16, color: '#0f172a', minWidth: 100, textAlign: 'right' }}>
                {c.valor ? format(Number(c.valor)) : '—'}
              </p>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {c.status === 'solicitado' && (
                  <button onClick={() => atualizarStatus(c.id, 'aprovado')}
                    style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '6px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                    Aprovar
                  </button>
                )}
                {c.status === 'aprovado' && (
                  <button onClick={() => atualizarStatus(c.id, 'recebido')}
                    style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', padding: '6px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                    Recebido
                  </button>
                )}
                <button onClick={() => excluir(c.id)}
                  style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '6px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function format(v: number) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const labelSt: React.CSSProperties      = { fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }
const inputSt: React.CSSProperties      = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', color: '#0f172a', background: '#fff' }
const selectFiltro: React.CSSProperties = { padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, background: '#fff', color: '#374151', cursor: 'pointer' }