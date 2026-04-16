'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function OrcamentoPublico() {

  const { id } = useParams()
  const search = useSearchParams()
  const token = search.get('token')

  const [orcamento,       setOrcamento]       = useState<any>(null)
  const [itens,           setItens]           = useState<any[]>([])
  const [loading,         setLoading]         = useState(true)
  const [finalizadoStatus, setFinalizadoStatus] = useState<'aprovado' | 'recusado' | null>(null)

  // Modal de assinatura
  const [mostrarModal,  setMostrarModal]  = useState(false)
  const [assinNome,     setAssinNome]     = useState('')
  const [assinCpf,      setAssinCpf]      = useState('')
  const [assinAceite,   setAssinAceite]   = useState(false)
  const [assinando,     setAssinando]     = useState(false)
  const [erroAssinatura, setErroAssinatura] = useState('')

  useEffect(() => {
    if (!id || !token) { setLoading(false); return }
    carregar()
  }, [id, token])

  async function carregar() {
    const { data: orc } = await supabase
      .from('orcamentos')
      .select('*')
      .eq('id', id)
      .eq('token', token)
      .maybeSingle()

    if (!orc) { setLoading(false); return }

    const { data: itensData } = await supabase
      .from('orcamento_itens')
      .select('*')
      .eq('orcamento_id', id)

    setOrcamento(orc)
    setItens(itensData || [])
    setLoading(false)
  }

  function totalItem(i: any) {
    return (
      Number(i.material || 0) +
      Number(i.mao_obra || 0) +
      Number(i.equipamentos || 0)
    ) * Number(i.quantidade || 0)
  }

  function totalGeral() {
    return itens.reduce((acc, i) => acc + totalItem(i), 0)
  }

  function formatarCpf(v: string) {
    return v.replace(/\D/g, '').slice(0, 11)
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }

  async function assinarEAprovar() {
    setErroAssinatura('')
    if (!assinNome.trim()) { setErroAssinatura('Informe seu nome completo.'); return }
    const cpfLimpo = assinCpf.replace(/\D/g, '')
    if (cpfLimpo.length !== 11) { setErroAssinatura('CPF inválido. Informe os 11 dígitos.'); return }
    if (!assinAceite) { setErroAssinatura('Você precisa aceitar os termos para assinar.'); return }

    setAssinando(true)
    try {
      const res = await fetch('/api/orcamento/assinar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orcamento_id: orcamento.id,
          token,
          nome: assinNome.trim(),
          cpf:  cpfLimpo,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setErroAssinatura(data.error || 'Erro ao assinar.'); return }
      setMostrarModal(false)
      setFinalizadoStatus('aprovado')
      // Atualiza localmente os dados de assinatura
      setOrcamento((prev: any) => ({
        ...prev,
        status: 'aprovado',
        assinatura_nome: assinNome.trim(),
        assinatura_cpf: cpfLimpo,
        assinado_em: new Date().toISOString(),
        assinatura_hash: data.hash,
      }))
    } catch {
      setErroAssinatura('Erro inesperado. Tente novamente.')
    } finally {
      setAssinando(false)
    }
  }

  async function recusar() {
    if (!confirm('Tem certeza que deseja recusar esta proposta?')) return
    try {
      const res = await fetch('/api/orcamento/recusar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orcamento_id: orcamento.id, token }),
      })
      if (!res.ok) throw new Error('Erro ao recusar')
      setFinalizadoStatus('recusado')
    } catch {
      alert('Erro ao recusar proposta. Tente novamente.')
    }
  }

  if (loading) return <p style={{ padding: 40 }}>Carregando proposta...</p>

  if (!orcamento) {
    return <div style={erroBox}>❌ Link inválido ou expirado</div>
  }

  const statusFinal = finalizadoStatus || orcamento.status
  const jaRespondido = statusFinal === 'aprovado' || statusFinal === 'recusado'
  const foiAssinado  = !!orcamento.assinado_em || finalizadoStatus === 'aprovado'

  return (
    <div style={container}>

      {/* MODAL DE ASSINATURA */}
      {mostrarModal && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
              ✍️ Assinar Proposta
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24, lineHeight: 1.6 }}>
              Ao assinar, você confirma que leu e aceita todos os termos desta proposta comercial.
              Sua assinatura será registrada com data, hora e identificação digital.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelSt}>Nome completo *</label>
                <input
                  value={assinNome}
                  onChange={e => setAssinNome(e.target.value)}
                  placeholder="Seu nome completo"
                  style={inputSt}
                />
              </div>
              <div>
                <label style={labelSt}>CPF *</label>
                <input
                  value={assinCpf}
                  onChange={e => setAssinCpf(formatarCpf(e.target.value))}
                  placeholder="000.000.000-00"
                  style={inputSt}
                  maxLength={14}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <input
                  type="checkbox"
                  checked={assinAceite}
                  onChange={e => setAssinAceite(e.target.checked)}
                  style={{ marginTop: 3, width: 16, height: 16, cursor: 'pointer', flexShrink: 0 }}
                />
                <label style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, cursor: 'pointer' }}
                  onClick={() => setAssinAceite(!assinAceite)}>
                  Declaro que li e aceito integralmente os termos desta proposta comercial,
                  no valor de <strong>{format(totalGeral())}</strong>, e autorizo o registro
                  desta assinatura eletrônica conforme a MP 2.200-2/2001.
                </label>
              </div>
            </div>

            {erroAssinatura && (
              <p style={{ color: '#dc2626', fontSize: 13, marginTop: 12 }}>⚠ {erroAssinatura}</p>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button
                onClick={assinarEAprovar}
                disabled={assinando}
                style={{ flex: 1, background: '#16a34a', color: '#fff', padding: '13px 0', borderRadius: 10, border: 'none', fontWeight: 700, fontSize: 15, cursor: 'pointer', opacity: assinando ? 0.7 : 1 }}
              >
                {assinando ? '⏳ Registrando...' : '✍️ Confirmar Assinatura'}
              </button>
              <button
                onClick={() => { setMostrarModal(false); setErroAssinatura('') }}
                style={{ padding: '13px 20px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', fontWeight: 600, cursor: 'pointer' }}
              >
                Cancelar
              </button>
            </div>

            {/* Info legal */}
            <div style={{ marginTop: 20, padding: '12px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <p style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.6 }}>
                🔒 Esta assinatura eletrônica tem validade jurídica conforme a Medida Provisória nº 2.200-2/2001.
                Serão registrados: nome, CPF, endereço IP, data e hora da assinatura, e hash SHA-256 do documento.
              </p>
            </div>
          </div>
        </div>
      )}

      <div style={card}>

        {/* HEADER */}
        <div style={headerStyle}>
          <div>
            <h1 style={titulo}>Proposta Comercial</h1>
            <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>
              {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontWeight: 700, color: '#0f172a', fontSize: 16 }}>Zynplan</p>
            <p style={{ color: '#64748b', fontSize: 13 }}>Planejamento Inteligente</p>
          </div>
        </div>

        {/* CLIENTE */}
        <div style={clienteBox}>
          <p style={{ fontWeight: 600, color: '#0f172a' }}>📋 Proposta para: {orcamento.cliente_nome}</p>
          {orcamento.descricao && <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>{orcamento.descricao}</p>}
        </div>

        {/* ITENS */}
        <div style={bloco}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', padding: '8px 12px', background: '#f8fafc', borderRadius: '8px 8px 0 0', fontSize: 12, fontWeight: 700, color: '#64748b' }}>
            <span>DESCRIÇÃO</span>
            <span>VALOR</span>
          </div>
          {itens.map((i, index) => (
            <div key={index} style={itemStyle}>
              <div>
                <p style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{i.descricao}</p>
                <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                  Qtd: {i.quantidade} {i.unidade}
                  {Number(i.material) > 0 && ` · Material: ${format(Number(i.material) * Number(i.quantidade))}`}
                  {Number(i.mao_obra) > 0 && ` · M.O.: ${format(Number(i.mao_obra) * Number(i.quantidade))}`}
                </p>
              </div>
              <span style={{ fontWeight: 700, color: '#0f172a', fontSize: 15 }}>{format(totalItem(i))}</span>
            </div>
          ))}
        </div>

        {/* TOTAL */}
        <div style={totalBox}>
          <span style={{ fontSize: 14, opacity: 0.85 }}>Investimento Total</span>
          <h1 style={{ fontSize: 32, fontWeight: 900, marginTop: 4 }}>{format(totalGeral())}</h1>
        </div>

        {/* STATUS ASSINADO */}
        {foiAssinado && (orcamento.assinatura_nome || finalizadoStatus === 'aprovado') && (
          <div style={assinadoBox}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 24 }}>✅</span>
              <div>
                <p style={{ fontWeight: 700, color: '#166534', fontSize: 15 }}>Proposta Assinada Digitalmente</p>
                <p style={{ fontSize: 12, color: '#16a34a' }}>Assinatura com validade jurídica (MP 2.200-2/2001)</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 13 }}>
              <div style={assinadoCampo}>
                <p style={assinadoLabel}>Assinante</p>
                <p style={assinadoValor}>{orcamento.assinatura_nome || assinNome}</p>
              </div>
              <div style={assinadoCampo}>
                <p style={assinadoLabel}>CPF</p>
                <p style={assinadoValor}>
                  {(orcamento.assinatura_cpf || assinCpf.replace(/\D/g, '')).replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}
                </p>
              </div>
              <div style={assinadoCampo}>
                <p style={assinadoLabel}>Data/Hora</p>
                <p style={assinadoValor}>
                  {new Date(orcamento.assinado_em || new Date()).toLocaleString('pt-BR')}
                </p>
              </div>
              <div style={assinadoCampo}>
                <p style={assinadoLabel}>IP registrado</p>
                <p style={assinadoValor}>{orcamento.assinatura_ip || '—'}</p>
              </div>
            </div>
            {orcamento.assinatura_hash && (
              <div style={{ marginTop: 10, padding: '8px 12px', background: '#dcfce7', borderRadius: 6 }}>
                <p style={{ fontSize: 10, color: '#166534', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  SHA-256: {orcamento.assinatura_hash}
                </p>
              </div>
            )}
          </div>
        )}

        {/* STATUS RECUSADO */}
        {(statusFinal === 'recusado') && (
          <div style={statusBox('recusado')}>❌ Proposta recusada</div>
        )}

        {/* BOTÕES */}
        {!jaRespondido && (
          <div style={acoes}>
            <button style={btnAprovar} onClick={() => setMostrarModal(true)}>
              ✍️ Assinar e Aprovar proposta
            </button>
            <button style={btnRecusar} onClick={recusar}>
              Recusar
            </button>
          </div>
        )}

        {/* RODAPÉ */}
        <div style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: '#94a3b8' }}>
            Proposta gerada pela plataforma Zynplan · app.zynplan.com.br
          </p>
        </div>

      </div>
    </div>
  )
}

function format(v: number) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/* ── ESTILOS ── */
const container: React.CSSProperties     = { background: '#f1f5f9', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '40px 20px' }
const card: React.CSSProperties          = { background: '#fff', padding: 40, borderRadius: 16, width: '100%', maxWidth: 800, boxShadow: '0 20px 60px rgba(0,0,0,0.08)' }
const headerStyle: React.CSSProperties  = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }
const titulo: React.CSSProperties       = { fontSize: 28, fontWeight: 800, color: '#0f172a' }
const clienteBox: React.CSSProperties   = { background: '#f8fafc', padding: 20, borderRadius: 10, marginBottom: 20, border: '1px solid #e2e8f0' }
const bloco: React.CSSProperties        = { border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden', marginBottom: 20 }
const itemStyle: React.CSSProperties    = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 12px', borderBottom: '1px solid #f1f5f9' }
const totalBox: React.CSSProperties     = { marginTop: 8, padding: 25, background: 'linear-gradient(135deg, #16a34a, #15803d)', color: '#fff', borderRadius: 12, textAlign: 'center' }
const acoes: React.CSSProperties        = { display: 'flex', gap: 10, marginTop: 24 }
const btnAprovar: React.CSSProperties   = { background: '#16a34a', color: '#fff', padding: 16, borderRadius: 10, flex: 1, border: 'none', fontWeight: 700, fontSize: 15, cursor: 'pointer' }
const btnRecusar: React.CSSProperties   = { background: '#fee2e2', color: '#dc2626', padding: 16, borderRadius: 10, width: 120, border: '1px solid #fecaca', fontWeight: 600, cursor: 'pointer', fontSize: 14 }
const erroBox: React.CSSProperties      = { padding: 40, textAlign: 'center', color: '#991b1b' }
const statusBox = (status: string): React.CSSProperties => ({
  marginTop: 20, padding: 15, borderRadius: 10, textAlign: 'center', fontWeight: 700,
  background: status === 'aprovado' ? '#dcfce7' : '#fee2e2',
  color: status === 'aprovado' ? '#166534' : '#991b1b'
})
const assinadoBox: React.CSSProperties  = { marginTop: 20, padding: 20, background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 12 }
const assinadoCampo: React.CSSProperties = { background: '#fff', padding: '10px 14px', borderRadius: 8, border: '1px solid #dcfce7' }
const assinadoLabel: React.CSSProperties = { fontSize: 11, color: '#16a34a', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }
const assinadoValor: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: '#0f172a' }
const modalOverlay: React.CSSProperties  = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }
const modalBox: React.CSSProperties      = { background: '#fff', borderRadius: 16, padding: 32, width: '100%', maxWidth: 500, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }
const labelSt: React.CSSProperties       = { fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }
const inputSt: React.CSSProperties       = { width: '100%', padding: '11px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', color: '#0f172a' }