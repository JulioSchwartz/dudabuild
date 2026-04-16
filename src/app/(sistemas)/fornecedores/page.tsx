'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useEmpresa } from '@/hooks/useEmpresa'

type Fornecedor = {
  id: number
  nome: string
  cnpj: string | null
  telefone: string | null
  email: string | null
  observacoes: string | null
  created_at: string
}

export default function FornecedoresPage() {
  const { empresaId, loading: loadingEmpresa } = useEmpresa()

  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [comprasPorFornecedor, setComprasPorFornecedor] = useState<Record<number, any[]>>({})
  const [loading,      setLoading]      = useState(true)
  const [salvando,     setSalvando]     = useState(false)
  const [erro,         setErro]         = useState('')
  const [expandido,    setExpandido]    = useState<number | null>(null)
  const [editando,     setEditando]     = useState<number | null>(null)

  // Form
  const [mostrarForm, setMostrarForm] = useState(false)
  const [formNome,    setFormNome]    = useState('')
  const [formCnpj,    setFormCnpj]    = useState('')
  const [formTel,     setFormTel]     = useState('')
  const [formEmail,   setFormEmail]   = useState('')
  const [formObs,     setFormObs]     = useState('')

  const carregar = useCallback(async () => {
    if (!empresaId) return
    setLoading(true)
    try {
      const [{ data: fData }, { data: cData }] = await Promise.all([
        supabase.from('fornecedores').select('*').eq('empresa_id', empresaId).order('nome'),
        supabase.from('compras').select('*, obras(nome)').eq('empresa_id', empresaId).order('created_at', { ascending: false }),
      ])
      setFornecedores(fData || [])

      // Agrupa compras por fornecedor
      const agrupado: Record<number, any[]> = {}
      ;(cData || []).forEach((c: any) => {
        if (!agrupado[c.fornecedor_id]) agrupado[c.fornecedor_id] = []
        agrupado[c.fornecedor_id].push(c)
      })
      setComprasPorFornecedor(agrupado)
    } finally {
      setLoading(false)
    }
  }, [empresaId])

  useEffect(() => {
    if (!loadingEmpresa) carregar()
  }, [loadingEmpresa, carregar])

  function limparForm() {
    setFormNome(''); setFormCnpj(''); setFormTel(''); setFormEmail(''); setFormObs('')
    setEditando(null)
  }

  function formatarCnpj(v: string) {
    return v.replace(/\D/g, '').slice(0, 14)
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
  }

  async function salvar() {
    setErro('')
    if (!formNome.trim()) { setErro('Informe o nome do fornecedor.'); return }
    setSalvando(true)
    try {
      if (editando) {
        await supabase.from('fornecedores').update({
          nome: formNome.trim(), cnpj: formCnpj || null,
          telefone: formTel || null, email: formEmail || null, observacoes: formObs || null,
        }).eq('id', editando)
      } else {
        await supabase.from('fornecedores').insert({
          empresa_id: empresaId, nome: formNome.trim(),
          cnpj: formCnpj || null, telefone: formTel || null,
          email: formEmail || null, observacoes: formObs || null,
        })
      }
      setMostrarForm(false)
      limparForm()
      carregar()
    } catch {
      setErro('Erro ao salvar fornecedor.')
    } finally {
      setSalvando(false)
    }
  }

  function iniciarEdicao(f: Fornecedor) {
    setEditando(f.id)
    setFormNome(f.nome)
    setFormCnpj(f.cnpj || '')
    setFormTel(f.telefone || '')
    setFormEmail(f.email || '')
    setFormObs(f.observacoes || '')
    setMostrarForm(true)
  }

  async function excluir(id: number) {
    if (!confirm('Excluir este fornecedor?')) return
    await supabase.from('fornecedores').delete().eq('id', id)
    carregar()
  }

  if (loadingEmpresa || loading) return <p style={{ padding: 24 }}>Carregando...</p>

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>

      {/* CABEÇALHO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>🏭 Fornecedores</h1>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>{fornecedores.length} fornecedor(es) cadastrado(s)</p>
        </div>
        <button onClick={() => { setMostrarForm(!mostrarForm); limparForm() }}
          style={{ background: '#2563eb', color: '#fff', padding: '10px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
          + Novo Fornecedor
        </button>
      </div>

      {/* FORM */}
      {mostrarForm && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: 24, marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>
            {editando ? 'Editar Fornecedor' : 'Novo Fornecedor'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={labelSt}>Nome *</label>
              <input value={formNome} onChange={e => setFormNome(e.target.value)} placeholder="Nome do fornecedor" style={inputSt} />
            </div>
            <div>
              <label style={labelSt}>CNPJ</label>
              <input value={formCnpj} onChange={e => setFormCnpj(formatarCnpj(e.target.value))} placeholder="00.000.000/0000-00" style={inputSt} maxLength={18} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label style={labelSt}>Telefone / WhatsApp</label>
              <input value={formTel} onChange={e => setFormTel(e.target.value)} placeholder="(00) 00000-0000" style={inputSt} />
            </div>
            <div>
              <label style={labelSt}>E-mail</label>
              <input type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} placeholder="fornecedor@email.com" style={inputSt} />
            </div>
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={labelSt}>Observações</label>
            <textarea value={formObs} onChange={e => setFormObs(e.target.value)} placeholder="Prazo de entrega, condições de pagamento..." rows={2}
              style={{ ...inputSt, resize: 'vertical', fontFamily: 'inherit' }} />
          </div>
          {erro && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>⚠ {erro}</p>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={salvar} disabled={salvando}
              style={{ background: '#2563eb', color: '#fff', padding: '11px 24px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, opacity: salvando ? 0.7 : 1 }}>
              {salvando ? 'Salvando...' : editando ? 'Salvar Alterações' : 'Cadastrar Fornecedor'}
            </button>
            <button onClick={() => { setMostrarForm(false); limparForm(); setErro('') }}
              style={{ background: '#f1f5f9', color: '#64748b', padding: '11px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600 }}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* LISTA */}
      {fornecedores.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0' }}>
          <p style={{ fontSize: 32, marginBottom: 12 }}>🏭</p>
          <p style={{ fontWeight: 600, color: '#0f172a' }}>Nenhum fornecedor cadastrado</p>
          <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 4 }}>Cadastre fornecedores para usar nas compras e cotações</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {fornecedores.map(f => {
            const compras = comprasPorFornecedor[f.id] || []
            const totalComprado = compras.reduce((a, c) => a + Number(c.valor || 0), 0)
            const exp = expandido === f.id

            return (
              <div key={f.id} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                {/* Card principal */}
                <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}
                  onClick={() => setExpandido(exp ? null : f.id)}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                    🏭
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{f.nome}</p>
                    <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                      {f.cnpj && `CNPJ: ${f.cnpj} · `}
                      {f.telefone && `📱 ${f.telefone} · `}
                      {compras.length} compra(s) · {format(totalComprado)}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button onClick={e => { e.stopPropagation(); iniciarEdicao(f) }}
                      style={{ background: '#fef3c7', color: '#d97706', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                      ✏️ Editar
                    </button>
                    <button onClick={e => { e.stopPropagation(); excluir(f.id) }}
                      style={{ background: '#fef2f2', color: '#dc2626', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                      ✕
                    </button>
                    <span style={{ color: '#94a3b8', fontSize: 12 }}>{exp ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Histórico expandido */}
                {exp && (
                  <div style={{ borderTop: '1px solid #f1f5f9', padding: '16px 20px', background: '#f8fafc' }}>
                    {f.email && <p style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>📧 {f.email}</p>}
                    {f.observacoes && <p style={{ fontSize: 13, color: '#64748b', marginBottom: 12, fontStyle: 'italic' }}>💬 {f.observacoes}</p>}
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                      Histórico de Compras
                    </p>
                    {compras.length === 0 ? (
                      <p style={{ fontSize: 13, color: '#94a3b8' }}>Nenhuma compra registrada ainda.</p>
                    ) : (
                      compras.slice(0, 5).map((c, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0', fontSize: 13 }}>
                          <div>
                            <p style={{ fontWeight: 600, color: '#0f172a' }}>{c.descricao}</p>
                            <p style={{ fontSize: 11, color: '#94a3b8' }}>{c.obras?.nome} · {new Date(c.created_at).toLocaleDateString('pt-BR')}</p>
                          </div>
                          <p style={{ fontWeight: 700, color: '#0f172a' }}>{format(Number(c.valor || 0))}</p>
                        </div>
                      ))
                    )}
                    {compras.length > 5 && (
                      <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>+ {compras.length - 5} compra(s) anteriores</p>
                    )}
                  </div>
                )}
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

const labelSt: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }
const inputSt: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', color: '#0f172a', background: '#fff' }