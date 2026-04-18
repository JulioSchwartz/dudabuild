'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useEmpresa } from '@/hooks/useEmpresa'

const UNIDADES = ['m²', 'm³', 'm', 'un', 'kg', 't', 'l', 'h', 'vb', 'cj', 'cx', 'pç', 'sc']

type Composicao = {
  id: string
  codigo: string
  descricao: string
  unidade: string
  valor: number
}

export default function ComposicoesPage() {
  const { empresaId } = useEmpresa()
  const [itens, setItens]         = useState<Composicao[]>([])
  const [loading, setLoading]     = useState(true)
  const [salvando, setSalvando]   = useState(false)
  const [busca, setBusca]         = useState('')
  const [showForm, setShowForm]   = useState(false)
  const [editando, setEditando]   = useState<Composicao | null>(null)
  const [form, setForm]           = useState({ codigo: '', descricao: '', unidade: 'un', valor: '' })
  const [erro, setErro]           = useState('')

  useEffect(() => { if (empresaId) carregar() }, [empresaId])

  async function carregar() {
    setLoading(true)
    const { data } = await supabase
      .from('composicoes_proprias')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('descricao')
    setItens(data || [])
    setLoading(false)
  }

  function abrirNovo() {
    setEditando(null)
    setForm({ codigo: '', descricao: '', unidade: 'un', valor: '' })
    setErro('')
    setShowForm(true)
  }

  function abrirEditar(item: Composicao) {
    setEditando(item)
    setForm({ codigo: item.codigo || '', descricao: item.descricao, unidade: item.unidade, valor: String(item.valor) })
    setErro('')
    setShowForm(true)
  }

  async function salvar() {
    if (!form.descricao.trim()) { setErro('Descrição é obrigatória'); return }
    if (!form.valor || isNaN(Number(form.valor))) { setErro('Valor inválido'); return }
    setSalvando(true)
    setErro('')

    const payload = {
      empresa_id: empresaId,
      codigo:     form.codigo.trim() || null,
      descricao:  form.descricao.trim(),
      unidade:    form.unidade,
      valor:      Number(form.valor),
    }

    if (editando) {
      const { error } = await supabase.from('composicoes_proprias').update(payload).eq('id', editando.id)
      if (error) { setErro('Erro ao salvar'); setSalvando(false); return }
    } else {
      const { error } = await supabase.from('composicoes_proprias').insert(payload)
      if (error) { setErro('Erro ao salvar'); setSalvando(false); return }
    }

    setSalvando(false)
    setShowForm(false)
    carregar()
  }

  async function excluir(id: string) {
    if (!confirm('Excluir esta composição?')) return
    await supabase.from('composicoes_proprias').delete().eq('id', id)
    carregar()
  }

  const filtrados = itens.filter(i =>
    i.descricao.toLowerCase().includes(busca.toLowerCase()) ||
    (i.codigo || '').toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0 }}>📋 Composições Próprias</h1>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
            Cadastre preços e serviços personalizados da sua empresa — aparecem junto ao SINAPI nos orçamentos
          </p>
        </div>
        <button onClick={abrirNovo} style={btnPrimario}>+ Nova Composição</button>
      </div>

      {/* STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
        <div style={cardStat}>
          <p style={statLabel}>Total de itens</p>
          <p style={{ ...statValue, color: '#3b82f6' }}>{itens.length}</p>
        </div>
        <div style={cardStat}>
          <p style={statLabel}>Valor médio</p>
          <p style={{ ...statValue, color: '#16a34a' }}>
            {itens.length > 0
              ? (itens.reduce((a, i) => a + Number(i.valor), 0) / itens.length).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
              : 'R$ 0,00'}
          </p>
        </div>
        <div style={cardStat}>
          <p style={statLabel}>Com código</p>
          <p style={{ ...statValue, color: '#f59e0b' }}>{itens.filter(i => i.codigo).length}</p>
        </div>
      </div>

      {/* BUSCA */}
      <div style={{ marginBottom: 16 }}>
        <input
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="🔍 Buscar por descrição ou código..."
          style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, background: '#f8fafc', outline: 'none', boxSizing: 'border-box' }}
        />
      </div>

      {/* FORM MODAL */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 500, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '0 0 20px' }}>
              {editando ? '✏️ Editar Composição' : '➕ Nova Composição'}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelSt}>Código (opcional)</label>
                  <input value={form.codigo} onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))}
                    placeholder="Ex: 001, A-01..." style={inputSt} />
                </div>
                <div>
                  <label style={labelSt}>Unidade *</label>
                  <select value={form.unidade} onChange={e => setForm(f => ({ ...f, unidade: e.target.value }))} style={{ ...inputSt, cursor: 'pointer' }}>
                    {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label style={labelSt}>Descrição *</label>
                <input value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                  placeholder="Ex: Mão de obra pedreiro + ajudante, por m²..." style={inputSt} />
              </div>

              <div>
                <label style={labelSt}>Valor unitário (R$) *</label>
                <input type="number" value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))}
                  placeholder="0,00" style={inputSt} min="0" step="0.01" />
              </div>

              {erro && <p style={{ color: '#dc2626', fontSize: 13, margin: 0 }}>⚠️ {erro}</p>}

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button onClick={() => setShowForm(false)} style={btnSecundario}>Cancelar</button>
                <button onClick={salvar} disabled={salvando} style={{ ...btnPrimario, flex: 1, opacity: salvando ? 0.7 : 1 }}>
                  {salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Adicionar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LISTA */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        {/* HEADER TABELA */}
        <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 70px 120px 80px', gap: 8, background: '#1e293b', color: '#fff', padding: '10px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <span>Código</span>
          <span>Descrição</span>
          <span style={{ textAlign: 'center' }}>Un</span>
          <span style={{ textAlign: 'right' }}>Valor Unit.</span>
          <span style={{ textAlign: 'center' }}>Ações</span>
        </div>

        {loading && (
          <p style={{ textAlign: 'center', color: '#94a3b8', padding: '32px 0', fontSize: 13 }}>Carregando...</p>
        )}

        {!loading && filtrados.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>📋</p>
            <p style={{ color: '#64748b', fontSize: 14, fontWeight: 600 }}>
              {busca ? 'Nenhuma composição encontrada' : 'Nenhuma composição cadastrada'}
            </p>
            <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>
              {!busca && 'Clique em "Nova Composição" para adicionar seus preços personalizados'}
            </p>
          </div>
        )}

        {filtrados.map((item, idx) => (
          <div key={item.id} style={{
            display: 'grid', gridTemplateColumns: '90px 1fr 70px 120px 80px', gap: 8,
            padding: '12px 16px', borderBottom: '1px solid #f1f5f9',
            alignItems: 'center', background: idx % 2 === 0 ? '#fff' : '#fafafa',
          }}>
            <span style={{ fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>
              {item.codigo || <span style={{ color: '#cbd5e1' }}>—</span>}
            </span>
            <span style={{ fontSize: 13, color: '#0f172a', fontWeight: 500 }}>{item.descricao}</span>
            <span style={{ fontSize: 12, color: '#64748b', textAlign: 'center' }}>{item.unidade}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#16a34a', textAlign: 'right' }}>
              {Number(item.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
              <button onClick={() => abrirEditar(item)} style={btnEdit} title="Editar">✏️</button>
              <button onClick={() => excluir(item.id)} style={btnDel} title="Excluir">🗑️</button>
            </div>
          </div>
        ))}
      </div>

      {filtrados.length > 0 && (
        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12, marginTop: 12 }}>
          {filtrados.length} composição(ões) {busca ? 'encontrada(s)' : 'cadastrada(s)'}
        </p>
      )}
    </div>
  )
}

const btnPrimario: React.CSSProperties = { background: 'linear-gradient(135deg, #1e293b, #334155)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }
const btnSecundario: React.CSSProperties = { background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }
const btnEdit: React.CSSProperties = { background: '#eff6ff', border: 'none', borderRadius: 6, width: 30, height: 30, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }
const btnDel: React.CSSProperties = { background: '#fee2e2', border: 'none', borderRadius: 6, width: 30, height: 30, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }
const inputSt: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, background: '#f8fafc', outline: 'none', boxSizing: 'border-box' }
const labelSt: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 5 }
const cardStat: React.CSSProperties = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px' }
const statLabel: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }
const statValue: React.CSSProperties = { fontSize: 20, fontWeight: 800 }