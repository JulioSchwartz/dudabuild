'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useEmpresa } from '@/hooks/useEmpresa'

export default function VerOrcamento() {

  const { id }        = useParams<{ id: string }>()
  const router        = useRouter()
  const { empresaId } = useEmpresa()

  const [orc,         setOrc]         = useState<any>(null)
  const [itens,       setItens]       = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [aprovando,   setAprovando]   = useState(false)

  useEffect(() => {
    if (id) carregar()
  }, [id])

  async function carregar() {
    try {
      const { data: orcData, error } = await supabase
        .from('orcamentos').select('*').eq('id', id).maybeSingle()

      if (error) throw error
      if (!orcData) { alert('Orçamento não encontrado'); router.push('/orcamentos'); return }

      setOrc(orcData)

      const { data: itensData } = await supabase
        .from('orcamento_itens').select('*').eq('orcamento_id', id)

      setItens(itensData || [])

    } catch (err) {
      console.error(err)
      alert('Erro ao carregar orçamento')
      router.push('/orcamentos')
    } finally {
      setLoadingData(false)
    }
  }

  async function aprovarEGerarObra() {
    if (!confirm(`Aprovar orçamento de ${orc.cliente_nome} e gerar obra automaticamente?`)) return

    setAprovando(true)
    try {
      await supabase.from('orcamentos').update({ status: 'aprovado' }).eq('id', id)

      const { data: novaObra, error: errObra } = await supabase
        .from('obras')
        .insert({
          nome:                 `Obra — ${orc.cliente_nome}`,
          cliente:              orc.cliente_nome,
          valor:                orc.valor_total,
          empresa_id:           empresaId,
          orcamento_id:         id,
          percentual_concluido: 0,
        })
        .select()
        .single()

      if (errObra || !novaObra) throw errObra

      await carregar()

      const irParaObra = confirm(
        `✅ Aprovado!\n\nObra "${novaObra.nome}" criada.\n\nDeseja ir para a obra agora?`
      )
      if (irParaObra) router.push(`/obras/${novaObra.id}`)

    } catch (err) {
      console.error(err)
      alert('Erro ao aprovar')
    } finally {
      setAprovando(false)
    }
  }

  function totalItem(i: any) {
    return (Number(i.material || 0) + Number(i.mao_obra || 0) + Number(i.equipamentos || 0))
      * Number(i.quantidade || 0)
  }

  function totalMaterial()  { return itens.reduce((a, i) => a + Number(i.material  || 0) * Number(i.quantidade || 0), 0) }
  function totalMaoObra()   { return itens.reduce((a, i) => a + Number(i.mao_obra  || 0) * Number(i.quantidade || 0), 0) }
  function totalEquip()     { return itens.reduce((a, i) => a + Number(i.equipamentos || 0) * Number(i.quantidade || 0), 0) }
  function totalGeral()     { return itens.reduce((a, i) => a + totalItem(i), 0) }

  function copiarLink() {
    if (!orc?.token) return alert('Token não encontrado')
    const link = `${window.location.origin}/orcamento-publico/${id}?token=${orc.token}`
    navigator.clipboard.writeText(link)
    alert('Link copiado!')
  }

  function enviarWhatsApp() {
    if (!orc?.token) return alert('Token não encontrado')
    const link  = `${window.location.origin}/orcamento-publico/${id}?token=${orc.token}`
    const texto = `Olá! Segue sua proposta:\n${link}`
    const url   = orc.telefone
      ? `https://wa.me/${orc.telefone}?text=${encodeURIComponent(texto)}`
      : `https://wa.me/?text=${encodeURIComponent(texto)}`
    window.open(url)
  }

  function gerarPDF() {
    import('html2pdf.js').then(({ default: html2pdf }) => {
      const dataHoje = new Date().toLocaleDateString('pt-BR')
      const el = document.createElement('div')
      el.innerHTML = `
        <div style="font-family:Arial;color:#0f172a">
          <div style="height:160px;background:#0f172a;color:white;display:flex;flex-direction:column;justify-content:center;align-items:center">
            <h1 style="margin:0;font-size:24px">DudaBuild Engenharia</h1>
            <p style="margin:6px 0 0;opacity:0.7">Proposta Comercial</p>
          </div>
          <div style="padding:40px">
            <h2 style="margin-bottom:8px">Dados</h2>
            <p><strong>Cliente:</strong> ${orc.cliente_nome}</p>
            ${orc.descricao ? `<p><strong>Descrição:</strong> ${orc.descricao}</p>` : ''}
            <p><strong>Data:</strong> ${dataHoje}</p>
            <hr style="margin:20px 0;border:none;border-top:1px solid #e2e8f0"/>
            <h2 style="margin-bottom:12px">Itens</h2>
            <table style="width:100%;border-collapse:collapse;font-size:13px">
              <thead>
                <tr style="background:#f8fafc">
                  <th style="text-align:left;padding:8px;border-bottom:1px solid #e2e8f0">Descrição</th>
                  <th style="text-align:center;padding:8px;border-bottom:1px solid #e2e8f0">Un</th>
                  <th style="text-align:center;padding:8px;border-bottom:1px solid #e2e8f0">Qtd</th>
                  <th style="text-align:right;padding:8px;border-bottom:1px solid #e2e8f0">Material</th>
                  <th style="text-align:right;padding:8px;border-bottom:1px solid #e2e8f0">M.O.</th>
                  <th style="text-align:right;padding:8px;border-bottom:1px solid #e2e8f0">Equip.</th>
                  <th style="text-align:right;padding:8px;border-bottom:1px solid #e2e8f0">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itens.map(i => `
                  <tr>
                    <td style="padding:8px;border-bottom:1px solid #f1f5f9">${i.descricao || '—'}</td>
                    <td style="padding:8px;border-bottom:1px solid #f1f5f9;text-align:center">${i.unidade || '—'}</td>
                    <td style="padding:8px;border-bottom:1px solid #f1f5f9;text-align:center">${i.quantidade || 1}</td>
                    <td style="padding:8px;border-bottom:1px solid #f1f5f9;text-align:right">${format(Number(i.material || 0))}</td>
                    <td style="padding:8px;border-bottom:1px solid #f1f5f9;text-align:right">${format(Number(i.mao_obra || 0))}</td>
                    <td style="padding:8px;border-bottom:1px solid #f1f5f9;text-align:right">${format(Number(i.equipamentos || 0))}</td>
                    <td style="padding:8px;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:700">${format(totalItem(i))}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div style="margin-top:20px;display:flex;justify-content:flex-end;gap:16px;font-size:13px">
              <span>Materiais: <strong>${format(totalMaterial())}</strong></span>
              <span>M.O.: <strong>${format(totalMaoObra())}</strong></span>
              <span>Equip.: <strong>${format(totalEquip())}</strong></span>
            </div>
            <div style="margin-top:30px;padding:24px;background:#16a34a;color:white;border-radius:10px;text-align:center">
              <p style="margin:0;font-size:14px;opacity:0.8">Total do Investimento</p>
              <h1 style="margin:8px 0 0;font-size:32px">${format(totalGeral())}</h1>
            </div>
            <div style="margin-top:50px">
              <p>______________________________________</p>
              <p><strong>DudaBuild Engenharia</strong> · Responsável Técnico</p>
            </div>
            <p style="margin-top:30px;text-align:center;font-size:11px;color:#94a3b8">
              Proposta válida por 7 dias · contato@dudabuild.com
            </p>
          </div>
        </div>
      `
      html2pdf().from(el).set({
        margin: 0,
        filename: `Proposta_${orc.cliente_nome.replace(/\s+/g, '_')}.pdf`,
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }).save()
    })
  }

  if (loadingData) return <p style={{ padding: 24 }}>Carregando...</p>
  if (!orc)        return null

  const jaAprovado = orc.status === 'aprovado'
  const jaRecusado = orc.status === 'recusado'
  const tgeral     = totalGeral()
  const tmat       = totalMaterial()
  const tmo        = totalMaoObra()
  const teq        = totalEquip()

  return (
    <div style={container}>

      {/* CABEÇALHO */}
      <div style={cabecalho}>
        <div>
          <button onClick={() => router.back()} style={btnVoltar}>← Voltar</button>
          <h1 style={titulo}>{orc.cliente_nome}</h1>
          {orc.descricao && <p style={{ color: '#64748b', marginTop: 4 }}>{orc.descricao}</p>}
          <p style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>
            Criado em {new Date(orc.created_at).toLocaleDateString('pt-BR')}
            {orc.telefone && ` · ${orc.telefone}`}
          </p>
        </div>
        <span style={badgeStyle(orc.status)}>{orc.status || 'pendente'}</span>
      </div>

      {/* BANNER APROVAÇÃO */}
      {jaAprovado && (
        <div style={bannerAprovado}>
          ✅ Orçamento aprovado — obra gerada automaticamente
          <button onClick={() => router.push('/obras')} style={btnVerObras}>Ver Obras →</button>
        </div>
      )}

      {/* BOTÃO APROVAR */}
      {!jaAprovado && !jaRecusado && (
        <div style={aprovacaoBox}>
          <div>
            <p style={{ fontWeight: 700, color: '#0f172a' }}>Cliente aceitou a proposta?</p>
            <p style={{ color: '#64748b', fontSize: 13, marginTop: 2 }}>
              Ao aprovar, uma obra será criada automaticamente.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={aprovarEGerarObra} style={btnAprovar} disabled={aprovando}>
              {aprovando ? '⏳ Gerando...' : '✅ Aprovar e Gerar Obra'}
            </button>
            <button onClick={() => router.push(`/orcamentos/editar/${id}`)} style={btnEditarTop}>
              ✏️ Editar
            </button>
          </div>
        </div>
      )}

      {/* RESUMO FINANCEIRO */}
      <div style={resumoGrid}>
        <Metrica label="Total Geral"   valor={format(tgeral)} cor="#16a34a" grande />
        <Metrica label="Materiais"     valor={format(tmat)}   cor="#3b82f6" />
        <Metrica label="Mão de Obra"   valor={format(tmo)}    cor="#f59e0b" />
        <Metrica label="Equipamentos"  valor={format(teq)}    cor="#a855f7" />
      </div>

      {/* TABELA DE ITENS */}
      <div style={secaoCard}>
        <h3 style={secaoTitulo}>📋 Itens do Orçamento</h3>

        {itens.length === 0
          ? <p style={{ color: '#94a3b8', textAlign: 'center', padding: 20 }}>
              Nenhum item cadastrado.
            </p>
          : (
            <>
              <div style={tabelaHeader}>
                <span>Cód</span>
                <span style={{ flex: 3 }}>Descrição</span>
                <span style={{ textAlign: 'center' }}>Un</span>
                <span style={{ textAlign: 'center' }}>Qtd</span>
                <span style={{ textAlign: 'right', color: '#3b82f6' }}>Material</span>
                <span style={{ textAlign: 'right', color: '#f59e0b' }}>M.O.</span>
                <span style={{ textAlign: 'right', color: '#a855f7' }}>Equip.</span>
                <span style={{ textAlign: 'right', color: '#16a34a' }}>Total</span>
              </div>

              {itens.map((item, i) => (
                <div key={i} style={tabelaLinha}>
                  <span style={{ color: '#94a3b8', fontSize: 12 }}>{item.codigo || '—'}</span>
                  <span style={{ flex: 3, fontWeight: 500 }}>{item.descricao || '—'}</span>
                  <span style={{ textAlign: 'center', color: '#64748b' }}>{item.unidade || '—'}</span>
                  <span style={{ textAlign: 'center', color: '#64748b' }}>{item.quantidade || 1}</span>
                  <span style={{ textAlign: 'right', color: '#3b82f6' }}>{format(Number(item.material || 0))}</span>
                  <span style={{ textAlign: 'right', color: '#f59e0b' }}>{format(Number(item.mao_obra || 0))}</span>
                  <span style={{ textAlign: 'right', color: '#a855f7' }}>{format(Number(item.equipamentos || 0))}</span>
                  <span style={{ textAlign: 'right', fontWeight: 700, color: '#16a34a' }}>{format(totalItem(item))}</span>
                </div>
              ))}

              <div style={tabelaRodape}>
                <span style={{ gridColumn: '1 / 8', fontWeight: 700 }}>Total Geral</span>
                <span style={{ textAlign: 'right', fontWeight: 900, fontSize: 16, color: '#16a34a' }}>
                  {format(tgeral)}
                </span>
              </div>
            </>
          )
        }
      </div>

      {/* AÇÕES */}
      <div style={acoes}>
        <button onClick={gerarPDF}       style={btnPdf}>📄 Baixar PDF</button>
        <button onClick={copiarLink}     style={btnSec}>🔗 Copiar Link</button>
        <button onClick={enviarWhatsApp} style={btnWhats}>WhatsApp</button>
        {!jaAprovado && !jaRecusado && (
          <button onClick={() => router.push(`/orcamentos/editar/${id}`)} style={btnSec}>
            ✏️ Editar Orçamento
          </button>
        )}
      </div>

    </div>
  )
}

/* ── HELPERS ── */
function format(v: number) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function Metrica({ label, valor, cor, grande }: any) {
  return (
    <div style={{ background: cor + '12', border: `1px solid ${cor}30`, borderRadius: 12, padding: '14px 18px' }}>
      <p style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>{label}</p>
      <p style={{ fontSize: grande ? 24 : 18, fontWeight: 800, color: cor, marginTop: 4 }}>{valor}</p>
    </div>
  )
}

function badgeStyle(status?: string): React.CSSProperties {
  if (status === 'aprovado') return { background: '#dcfce7', color: '#16a34a', padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 700 }
  if (status === 'recusado') return { background: '#fee2e2', color: '#dc2626', padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 700 }
  return { background: '#fef3c7', color: '#d97706', padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 700 }
}

/* ── ESTILOS ── */
const container: React.CSSProperties     = { maxWidth: 1000, margin: '0 auto', padding: 24 }
const cabecalho: React.CSSProperties     = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }
const btnVoltar: React.CSSProperties     = { background: 'transparent', border: 'none', color: '#2563eb', cursor: 'pointer', fontSize: 14, padding: 0, marginBottom: 8, display: 'block' }
const titulo: React.CSSProperties        = { fontSize: 26, fontWeight: 800, color: '#0f172a' }
const aprovacaoBox: React.CSSProperties  = { background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '16px 20px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }
const btnAprovar: React.CSSProperties    = { background: '#16a34a', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 14 }
const btnEditarTop: React.CSSProperties  = { background: '#f59e0b', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 14 }
const bannerAprovado: React.CSSProperties = { background: '#dcfce7', border: '1px solid #86efac', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontWeight: 600, color: '#15803d', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }
const btnVerObras: React.CSSProperties   = { background: '#16a34a', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 13 }
const resumoGrid: React.CSSProperties    = { display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: 12, marginBottom: 20 }
const secaoCard: React.CSSProperties     = { background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', marginBottom: 20 }
const secaoTitulo: React.CSSProperties   = { fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 16 }

const colBase = '80px 3fr 60px 60px 1fr 1fr 1fr 1fr'
const tabelaHeader: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: colBase,
  gap: 8, padding: '8px 12px', background: '#0f172a', color: '#94a3b8',
  borderRadius: 8, fontSize: 12, fontWeight: 700, marginBottom: 4
}
const tabelaLinha: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: colBase,
  gap: 8, padding: '10px 12px', borderBottom: '1px solid #f1f5f9',
  fontSize: 13, alignItems: 'center'
}
const tabelaRodape: React.CSSProperties = {
  display: 'grid', gridTemplateColumns: colBase,
  gap: 8, padding: '12px', background: '#f8fafc', borderRadius: 8, marginTop: 8
}

const acoes: React.CSSProperties  = { display: 'flex', gap: 10, flexWrap: 'wrap' }
const btnPdf: React.CSSProperties   = { background: '#0f172a', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }
const btnSec: React.CSSProperties   = { background: '#f1f5f9', color: '#374151', border: 'none', padding: '12px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }
const btnWhats: React.CSSProperties = { background: '#22c55e', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }