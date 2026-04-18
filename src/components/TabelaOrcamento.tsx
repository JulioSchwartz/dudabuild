'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '@/lib/supabase'
import { useEmpresa } from '@/hooks/useEmpresa'

const UNIDADES = ['m²', 'm³', 'm', 'un', 'kg', 't', 'l', 'h', 'vb', 'cj', 'cx', 'pç', 'sc']

type ItemMaterial = {
  tipo: 'material'; codigo: string; descricao: string; unidade: string
  quantidade: number; material: number; mao_obra: 0; equipamentos: 0; bdi?: number
}
type ItemServico = {
  tipo: 'servico'; codigo: string; descricao: string; unidade: string
  quantidade: number; material: 0; mao_obra: number; equipamentos: number; bdi?: number
}
export type ItemOrcamento = ItemMaterial | ItemServico

type Props = {
  materiais: ItemOrcamento[]; servicos: ItemOrcamento[]
  atualizarMaterial: (index: number, campo: string, valor: any) => void
  atualizarServico:  (index: number, campo: string, valor: any) => void
  removerMaterial:   (index: number) => void
  removerServico:    (index: number) => void
  readOnly?: boolean
}

type SinapiItem = { codigo: string; descricao: string; unidade: string; valor: number; proprio?: boolean }

function valorComBdi(valor: number, bdi?: number) {
  if (!bdi || bdi === 0) return valor
  return valor * (1 + bdi / 100)
}

export default function TabelaOrcamento({
  materiais, servicos,
  atualizarMaterial, atualizarServico,
  removerMaterial, removerServico, readOnly
}: Props) {
  const totalMat   = materiais.reduce((a, i) => a + valorComBdi(Number(i.material || 0), i.bdi) * Number(i.quantidade || 0), 0)
  const totalMO    = servicos.reduce((a, i)  => a + valorComBdi(Number(i.mao_obra || 0) + Number(i.equipamentos || 0), i.bdi) * Number(i.quantidade || 0), 0)
  const totalGeral = totalMat + totalMO

  return (
    <div style={{ marginTop: 20 }}>
      <style>{`
        .tbc-desktop { display: flex !important; }
        .tbc-mobile  { display: none !important; }
        .tbc-resumo-grid { grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)) !important; }
        .sinapi-dropdown { position: fixed; background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; box-shadow: 0 8px 32px rgba(0,0,0,0.15); z-index: 99999; max-height: 300px; overflow-y: auto; }
        .sinapi-dropdown-item { padding: 10px 14px; cursor: pointer; border-bottom: 1px solid #f1f5f9; transition: background 0.1s; }
        .sinapi-dropdown-item:hover { background: #f8fafc; }
        @media (max-width: 768px) {
          .tbc-desktop { display: none !important; }
          .tbc-mobile  { display: block !important; }
          .tbc-resumo-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>

      <SecaoTabela titulo="🧱 Materiais" cor="#3b82f6" itens={materiais} tipo="material"
        atualizar={atualizarMaterial} remover={removerMaterial} readOnly={readOnly} />
      <SecaoTabela titulo="👷 Serviços" cor="#f59e0b" itens={servicos} tipo="servico"
        atualizar={atualizarServico} remover={removerServico} readOnly={readOnly} />

      <div className="tbc-resumo-grid" style={resumoGrid}>
        <ResumoCard label="🧱 Materiais"            valor={totalMat}   cor="#3b82f6" perc={totalGeral > 0 ? totalMat / totalGeral * 100 : 0} />
        <ResumoCard label="👷 Mão de Obra + Equip." valor={totalMO}    cor="#f59e0b" perc={totalGeral > 0 ? totalMO  / totalGeral * 100 : 0} />
        <ResumoCard label="💰 Total Geral"          valor={totalGeral} cor="#16a34a" perc={100} grande />
      </div>
    </div>
  )
}

function SecaoTabela({ titulo, cor, itens, tipo, atualizar, remover, readOnly }: any) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: cor, margin: 0 }}>{titulo}</h3>
        <span style={{ background: cor + '20', color: cor, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999 }}>
          {itens.length} item(s)
        </span>
      </div>
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div className="tbc-desktop" style={{ flexDirection: 'column' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: tipo === 'material'
              ? '100px 1fr 75px 70px 110px 70px 110px 32px'
              : '100px 1fr 75px 70px 110px 110px 70px 110px 32px',
            gap: 6, background: cor, color: '#fff', borderRadius: '12px 12px 0 0',
            padding: '10px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
          }}>
            <span>Cód</span><span>Descrição</span>
            <span style={{ textAlign: 'center' }}>Un</span>
            <span style={{ textAlign: 'center' }}>Qtd</span>
            {tipo === 'material' && <span style={{ textAlign: 'right' }}>Valor Unit.</span>}
            {tipo === 'servico'  && <span style={{ textAlign: 'right' }}>Mão de Obra</span>}
            {tipo === 'servico'  && <span style={{ textAlign: 'right' }}>Equipamentos</span>}
            <span style={{ textAlign: 'center' }}>BDI %</span>
            <span style={{ textAlign: 'right' }}>Total</span>
            {!readOnly && <span />}
          </div>
          {itens.length === 0 && <p style={{ textAlign: 'center', color: '#94a3b8', padding: '20px 0', fontSize: 13 }}>Nenhum item — use o botão abaixo para adicionar</p>}
          {itens.map((item: any, index: number) => (
            <LinhaDesktop key={index} item={item} index={index} tipo={tipo}
              atualizar={atualizar} remover={remover} readOnly={readOnly} corBorda={cor} />
          ))}
        </div>
        <div className="tbc-mobile">
          <div style={{ background: cor, color: '#fff', padding: '10px 14px', fontSize: 12, fontWeight: 700, borderRadius: '12px 12px 0 0' }}>
            {tipo === 'material' ? 'CÓD · DESCRIÇÃO · UN · QTD · VALOR · BDI' : 'CÓD · DESCRIÇÃO · UN · QTD · MÃO DE OBRA · EQUIP. · BDI'}
          </div>
          {itens.length === 0 && <p style={{ textAlign: 'center', color: '#94a3b8', padding: '20px 0', fontSize: 13 }}>Nenhum item</p>}
          {itens.map((item: any, index: number) => (
            <CardMobile key={index} item={item} index={index} tipo={tipo}
              atualizar={atualizar} remover={remover} readOnly={readOnly} corBorda={cor} />
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── AUTOCOMPLETE DESCRIÇÃO COM PORTAL ── */
function AutocompleteDescricao({ item, index, tipo, atualizar, readOnly, inputStyle }: any) {
  const { empresaId } = useEmpresa()
  const [sugestoes,    setSugestoes]    = useState<SinapiItem[]>([])
  const [buscando,     setBuscando]     = useState(false)
  const [mostrarLista, setMostrarLista] = useState(false)
  const [termoBusca,   setTermoBusca]   = useState(item.descricao || '')
  const [dropdownPos,  setDropdownPos]  = useState({ top: 0, left: 0, width: 0 })
  const debounceRef = useRef<any>(null)
  const inputRef    = useRef<HTMLInputElement>(null)
  const [mounted,   setMounted]         = useState(false)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { setTermoBusca(item.descricao || '') }, [item.descricao])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement
      if (!target.closest('.sinapi-dropdown') && inputRef.current !== target) setMostrarLista(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function buscarSinapi(termo: string) {
    if (termo.length < 2) { setSugestoes([]); setMostrarLista(false); return }
    setBuscando(true)
    try {
      const [{ data: sinapi }, { data: proprias }] = await Promise.all([
        supabase.from('sinapi').select('codigo, descricao, unidade, valor')
          .or(`descricao.ilike.%${termo}%,codigo.ilike.%${termo}%`)
          .order('descricao', { ascending: true }).limit(7),
        empresaId
          ? supabase.from('composicoes_proprias').select('codigo, descricao, unidade, valor')
              .eq('empresa_id', empresaId)
              .or(`descricao.ilike.%${termo}%,codigo.ilike.%${termo}%`)
              .order('descricao', { ascending: true }).limit(3)
          : Promise.resolve({ data: [] }),
      ])
      const propriasFormatadas = (proprias || []).map((p: any) => ({ ...p, proprio: true }))
      const sinapiFormatadas   = (sinapi   || []).map((s: any) => ({ ...s, proprio: false }))
      setSugestoes([...propriasFormatadas, ...sinapiFormatadas])
      setMostrarLista(true)
    } finally { setBuscando(false) }
  }

  function atualizarPosicao() {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect()
      setDropdownPos({ top: rect.bottom + window.scrollY + 4, left: rect.left + window.scrollX, width: rect.width })
    }
  }

  function handleChange(valor: string) {
    setTermoBusca(valor); atualizar(index, 'descricao', valor)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => buscarSinapi(valor), 300)
  }

  function handleFocus() { atualizarPosicao(); if (termoBusca.length >= 2) buscarSinapi(termoBusca) }

  function selecionarSinapi(s: SinapiItem) {
    atualizar(index, 'codigo', s.codigo || '')
    atualizar(index, 'descricao', s.descricao)
    atualizar(index, 'unidade', s.unidade)
    if (tipo === 'material') atualizar(index, 'material', s.valor)
    else                     atualizar(index, 'mao_obra', s.valor)
    setTermoBusca(s.descricao); setMostrarLista(false); setSugestoes([])
  }

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input ref={inputRef} disabled={readOnly} value={termoBusca}
        onChange={e => handleChange(e.target.value)} onFocus={handleFocus}
        placeholder="Digite descrição ou código..." style={{ ...inputStyle, width: '100%' }} />
      {buscando && <span style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: '#94a3b8' }}>⏳</span>}

      {mounted && mostrarLista && sugestoes.length > 0 && createPortal(
        <div className="sinapi-dropdown" style={{ top: dropdownPos.top, left: dropdownPos.left, width: Math.max(dropdownPos.width, 340) }}>
          {sugestoes.map((s, i) => (
            <div key={i} className="sinapi-dropdown-item" onMouseDown={() => selecionarSinapi(s)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', flex: 1, lineHeight: 1.3 }}>{s.descricao}</span>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0 }}>
                  {s.proprio && <span style={{ fontSize: 10, background: '#fef3c7', color: '#92400e', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>★ Próprio</span>}
                  <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 700 }}>{format(s.valor)}/{s.unidade}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 3 }}>
                <span style={{ fontSize: 11, color: '#64748b' }}>Cód: {s.codigo || '—'}</span>
                <span style={{ fontSize: 11, color: '#64748b' }}>Un: {s.unidade}</span>
              </div>
            </div>
          ))}
        </div>,
        document.body
      )}
    </div>
  )
}

/* ── AUTOCOMPLETE CÓDIGO ── */
function AutocompleteCodigo({ item, index, tipo, atualizar, readOnly, inputStyle }: any) {
  const { empresaId } = useEmpresa()
  const debounceRef = useRef<any>(null)

  async function buscarPorCodigo(codigo: string) {
    if (codigo.length < 2) return

    // Tenta composições próprias primeiro
    if (empresaId) {
      const { data: propria } = await supabase
        .from('composicoes_proprias').select('codigo, descricao, unidade, valor')
        .eq('empresa_id', empresaId).ilike('codigo', `${codigo}%`).limit(1).single()
      if (propria) {
        atualizar(index, 'codigo', propria.codigo); atualizar(index, 'descricao', propria.descricao)
        atualizar(index, 'unidade', propria.unidade)
        if (tipo === 'material') atualizar(index, 'material', propria.valor)
        else                     atualizar(index, 'mao_obra', propria.valor)
        return
      }
    }

    // Depois tenta SINAPI
    const { data } = await supabase
      .from('sinapi').select('codigo, descricao, unidade, valor')
      .ilike('codigo', `${codigo}%`).limit(1).single()
    if (data) {
      atualizar(index, 'codigo', data.codigo); atualizar(index, 'descricao', data.descricao)
      atualizar(index, 'unidade', data.unidade)
      if (tipo === 'material') atualizar(index, 'material', data.valor)
      else                     atualizar(index, 'mao_obra', data.valor)
    }
  }

  return (
    <input disabled={readOnly} value={item.codigo}
      onChange={e => {
        atualizar(index, 'codigo', e.target.value)
        clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => buscarPorCodigo(e.target.value), 500)
      }}
      placeholder="Ex: 94963" style={{ ...inputStyle, fontSize: 12 }} />
  )
}

/* ── LINHA DESKTOP ── */
function LinhaDesktop({ item, index, tipo, atualizar, remover, readOnly, corBorda }: any) {
  function totalLinha() {
    const qtd = Number(item.quantidade || 0)
    if (tipo === 'material') return valorComBdi(Number(item.material || 0), item.bdi) * qtd
    return valorComBdi(Number(item.mao_obra || 0) + Number(item.equipamentos || 0), item.bdi) * qtd
  }
  const gridCols = tipo === 'material'
    ? '100px 1fr 75px 70px 110px 70px 110px 32px'
    : '100px 1fr 75px 70px 110px 110px 70px 110px 32px'

  return (
    <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 6, padding: '8px 14px', borderBottom: '1px solid #f1f5f9', alignItems: 'center', borderLeft: `3px solid ${corBorda}30` }}>
      <AutocompleteCodigo item={item} index={index} tipo={tipo} atualizar={atualizar} readOnly={readOnly} inputStyle={inputSt} />
      <AutocompleteDescricao item={item} index={index} tipo={tipo} atualizar={atualizar} readOnly={readOnly} inputStyle={inputSt} />
      <select disabled={readOnly} value={item.unidade} onChange={e => atualizar(index, 'unidade', e.target.value)} style={{ ...inputSt, cursor: 'pointer' }}>
        {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
      </select>
      <input disabled={readOnly} type="number" value={item.quantidade}
        onChange={e => atualizar(index, 'quantidade', Number(e.target.value))}
        style={{ ...inputSt, textAlign: 'center' }} min="0" step="0.01" />
      {tipo === 'material' && (
        <input disabled={readOnly} type="number" value={item.material}
          onChange={e => atualizar(index, 'material', Number(e.target.value))}
          style={{ ...inputSt, textAlign: 'right', borderColor: '#bae6fd' }} min="0" step="0.01" />
      )}
      {tipo === 'servico' && (
        <input disabled={readOnly} type="number" value={item.mao_obra}
          onChange={e => atualizar(index, 'mao_obra', Number(e.target.value))}
          style={{ ...inputSt, textAlign: 'right', borderColor: '#fde68a' }} min="0" step="0.01" />
      )}
      {tipo === 'servico' && (
        <input disabled={readOnly} type="number" value={item.equipamentos}
          onChange={e => atualizar(index, 'equipamentos', Number(e.target.value))}
          style={{ ...inputSt, textAlign: 'right', borderColor: '#ddd6fe' }} min="0" step="0.01" />
      )}
      <div style={{ position: 'relative' }}>
        <input disabled={readOnly} type="number" value={item.bdi || ''}
          onChange={e => atualizar(index, 'bdi', Number(e.target.value))}
          placeholder="0" style={{ ...inputSt, textAlign: 'center', borderColor: '#d1fae5', paddingRight: 20 }} min="0" step="0.5" />
        <span style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', fontSize: 10, color: '#94a3b8' }}>%</span>
      </div>
      <div style={{ textAlign: 'right', fontWeight: 700, color: '#16a34a', fontSize: 14 }}>{format(totalLinha())}</div>
      {!readOnly && <button onClick={() => remover(index)} style={btnRemoverSt}>✕</button>}
    </div>
  )
}

/* ── CARD MOBILE ── */
function CardMobile({ item, index, tipo, atualizar, remover, readOnly, corBorda }: any) {
  function totalLinha() {
    const qtd = Number(item.quantidade || 0)
    if (tipo === 'material') return valorComBdi(Number(item.material || 0), item.bdi) * qtd
    return valorComBdi(Number(item.mao_obra || 0) + Number(item.equipamentos || 0), item.bdi) * qtd
  }
  const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 3 }
  const inp: React.CSSProperties = { ...inputSt, width: '100%' }

  return (
    <div style={{ padding: 14, borderBottom: '1px solid #f1f5f9', borderLeft: `3px solid ${corBorda}40`, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 75px 70px', gap: 8 }}>
        <div><p style={lbl}>Cód</p><AutocompleteCodigo item={item} index={index} tipo={tipo} atualizar={atualizar} readOnly={readOnly} inputStyle={inp} /></div>
        <div><p style={lbl}>Un</p>
          <select disabled={readOnly} value={item.unidade} onChange={e => atualizar(index, 'unidade', e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
            {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div><p style={lbl}>Qtd</p>
          <input disabled={readOnly} type="number" value={item.quantidade}
            onChange={e => atualizar(index, 'quantidade', Number(e.target.value))}
            style={{ ...inp, textAlign: 'center' }} min="0" step="0.01" />
        </div>
      </div>
      <div><p style={lbl}>Descrição</p><AutocompleteDescricao item={item} index={index} tipo={tipo} atualizar={atualizar} readOnly={readOnly} inputStyle={inp} /></div>
      <div style={{ display: 'grid', gridTemplateColumns: tipo === 'servico' ? '1fr 1fr 80px' : '1fr 80px', gap: 8 }}>
        {tipo === 'material' && <div><p style={lbl}>Valor Unit. (R$)</p>
          <input disabled={readOnly} type="number" value={item.material}
            onChange={e => atualizar(index, 'material', Number(e.target.value))}
            style={{ ...inp, borderColor: '#bae6fd' }} min="0" step="0.01" /></div>}
        {tipo === 'servico' && <>
          <div><p style={lbl}>Mão de Obra (R$)</p>
            <input disabled={readOnly} type="number" value={item.mao_obra}
              onChange={e => atualizar(index, 'mao_obra', Number(e.target.value))}
              style={{ ...inp, borderColor: '#fde68a' }} min="0" step="0.01" /></div>
          <div><p style={lbl}>Equipamentos (R$)</p>
            <input disabled={readOnly} type="number" value={item.equipamentos}
              onChange={e => atualizar(index, 'equipamentos', Number(e.target.value))}
              style={{ ...inp, borderColor: '#ddd6fe' }} min="0" step="0.01" /></div>
        </>}
        <div><p style={lbl}>BDI %</p>
          <input disabled={readOnly} type="number" value={item.bdi || ''}
            onChange={e => atualizar(index, 'bdi', Number(e.target.value))}
            placeholder="0" style={{ ...inp, textAlign: 'center', borderColor: '#d1fae5' }} min="0" step="0.5" /></div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={lbl}>Total {item.bdi ? `(c/ BDI ${item.bdi}%)` : ''}</p>
          <p style={{ fontWeight: 800, color: '#16a34a', fontSize: 16 }}>{format(totalLinha())}</p>
        </div>
        {!readOnly && <button onClick={() => remover(index)} style={{ ...btnRemoverSt, width: 'auto', padding: '8px 16px' }}>✕ Remover</button>}
      </div>
    </div>
  )
}

function ResumoCard({ label, valor, cor, perc, grande }: any) {
  return (
    <div style={{ background: cor + '12', border: `1px solid ${cor}30`, borderRadius: 12, padding: '14px 16px' }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: grande ? 20 : 17, fontWeight: 800, color: cor }}>{format(valor)}</p>
      <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{perc > 0 ? perc.toFixed(1) + '%' : '—'}</p>
    </div>
  )
}

function format(v: number) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const inputSt: React.CSSProperties = { padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13, background: '#f8fafc', outline: 'none', width: '100%', boxSizing: 'border-box' }
const btnRemoverSt: React.CSSProperties = { background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: 6, width: 32, height: 32, cursor: 'pointer', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }
const resumoGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginTop: 8 }