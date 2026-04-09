'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

const UNIDADES = ['m²', 'm³', 'm', 'un', 'kg', 't', 'l', 'h', 'vb', 'cj', 'cx', 'pç', 'sc']

type ItemMaterial = {
  tipo:        'material'
  codigo:      string
  descricao:   string
  unidade:     string
  quantidade:  number
  material:    number
  mao_obra:    0
  equipamentos: 0
}

type ItemServico = {
  tipo:        'servico'
  codigo:      string
  descricao:   string
  unidade:     string
  quantidade:  number
  material:    0
  mao_obra:    number
  equipamentos: number
}

export type ItemOrcamento = ItemMaterial | ItemServico

type Props = {
  materiais:         ItemOrcamento[]
  servicos:          ItemOrcamento[]
  atualizarMaterial: (index: number, campo: string, valor: any) => void
  atualizarServico:  (index: number, campo: string, valor: any) => void
  removerMaterial:   (index: number) => void
  removerServico:    (index: number) => void
  readOnly?:         boolean
}

type SinapiItem = {
  codigo:    string
  descricao: string
  unidade:   string
  valor:     number
}

export default function TabelaOrcamento({
  materiais, servicos,
  atualizarMaterial, atualizarServico,
  removerMaterial, removerServico,
  readOnly
}: Props) {

  const totalMat  = materiais.reduce((a, i) => a + Number(i.material || 0) * Number(i.quantidade || 0), 0)
  const totalMO   = servicos.reduce((a, i)  => a + Number(i.mao_obra || 0) * Number(i.quantidade || 0), 0)
  const totalEq   = servicos.reduce((a, i)  => a + Number(i.equipamentos || 0) * Number(i.quantidade || 0), 0)
  const totalGeral = totalMat + totalMO + totalEq

  return (
    <div style={{ marginTop: 20 }}>

      {/* ── SEÇÃO MATERIAIS ── */}
      <SecaoTabela
        titulo="🧱 Materiais"
        cor="#3b82f6"
        corFundo="#eff6ff"
        itens={materiais}
        tipo="material"
        atualizar={atualizarMaterial}
        remover={removerMaterial}
        readOnly={readOnly}
      />

      {/* ── SEÇÃO SERVIÇOS ── */}
      <SecaoTabela
        titulo="👷 Serviços"
        cor="#f59e0b"
        corFundo="#fffbeb"
        itens={servicos}
        tipo="servico"
        atualizar={atualizarServico}
        remover={removerServico}
        readOnly={readOnly}
      />

      {/* ── RESUMO GERAL ── */}
      <div style={resumoGrid}>
        <ResumoCard label="🧱 Materiais"   valor={totalMat}   cor="#3b82f6" perc={totalGeral > 0 ? totalMat / totalGeral * 100 : 0} />
        <ResumoCard label="👷 Mão de Obra" valor={totalMO}    cor="#f59e0b" perc={totalGeral > 0 ? totalMO / totalGeral * 100 : 0} />
        <ResumoCard label="🔧 Equipamentos" valor={totalEq}   cor="#a855f7" perc={totalGeral > 0 ? totalEq / totalGeral * 100 : 0} />
        <ResumoCard label="💰 Total Geral"  valor={totalGeral} cor="#16a34a" perc={100} grande />
      </div>

    </div>
  )
}

/* ── SEÇÃO COM TABELA ── */
function SecaoTabela({ titulo, cor, corFundo, itens, tipo, atualizar, remover, readOnly }: any) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: cor, margin: 0 }}>{titulo}</h3>
        <span style={{ background: cor + '20', color: cor, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999 }}>
          {itens.length} item(s)
        </span>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>

        {/* HEADER */}
        <div style={{ display: 'flex', gap: 8, background: cor, color: '#fff', padding: '10px 14px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>
          <span style={{ flex: '0 0 90px' }}>Cód SINAPI</span>
          <span style={{ flex: 3 }}>Descrição</span>
          <span style={{ flex: '0 0 80px', textAlign: 'center' as const }}>Un</span>
          <span style={{ flex: '0 0 70px', textAlign: 'center' as const }}>Qtd</span>
          {tipo === 'material' && <span style={{ flex: 1, textAlign: 'right' as const }}>Valor Unit.</span>}
          {tipo === 'servico'  && <span style={{ flex: 1, textAlign: 'right' as const }}>Mão de Obra</span>}
          {tipo === 'servico'  && <span style={{ flex: 1, textAlign: 'right' as const }}>Equipamentos</span>}
          <span style={{ flex: 1, textAlign: 'right' as const }}>Total</span>
          {!readOnly && <span style={{ flex: '0 0 32px' }} />}
        </div>

        {itens.length === 0 && (
          <p style={{ textAlign: 'center', color: '#94a3b8', padding: '20px 0', fontSize: 13 }}>
            Nenhum item ainda — use o botão abaixo para adicionar
          </p>
        )}

        {itens.map((item: any, index: number) => (
          <LinhaItem
            key={index}
            item={item}
            index={index}
            tipo={tipo}
            atualizar={atualizar}
            remover={remover}
            readOnly={readOnly}
            corBorda={cor}
          />
        ))}

      </div>
    </div>
  )
}

/* ── LINHA DE ITEM COM AUTOCOMPLETE ── */
function LinhaItem({ item, index, tipo, atualizar, remover, readOnly, corBorda }: any) {

  const [sugestoes,     setSugestoes]     = useState<SinapiItem[]>([])
  const [buscando,      setBuscando]      = useState(false)
  const [mostrarLista,  setMostrarLista]  = useState(false)
  const [termoBusca,    setTermoBusca]    = useState(item.descricao || '')
  const debounceRef = useRef<any>(null)
  const wrapRef     = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setTermoBusca(item.descricao || '')
  }, [item.descricao])

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setMostrarLista(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function buscarSinapi(termo: string) {
    if (termo.length < 2) { setSugestoes([]); setMostrarLista(false); return }
    setBuscando(true)
    try {
      const { data } = await supabase
        .from('sinapi')
        .select('codigo, descricao, unidade, valor')
        .or(`descricao.ilike.%${termo}%,codigo.ilike.%${termo}%`)
        .limit(8)
      setSugestoes(data || [])
      setMostrarLista(true)
    } finally {
      setBuscando(false)
    }
  }

  function handleDescricaoChange(valor: string) {
    setTermoBusca(valor)
    atualizar(index, 'descricao', valor)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => buscarSinapi(valor), 300)
  }

  function selecionarSinapi(s: SinapiItem) {
    atualizar(index, 'codigo',    s.codigo)
    atualizar(index, 'descricao', s.descricao)
    atualizar(index, 'unidade',   s.unidade)
    if (tipo === 'material') atualizar(index, 'material', s.valor)
    else                     atualizar(index, 'mao_obra', s.valor)
    setTermoBusca(s.descricao)
    setMostrarLista(false)
    setSugestoes([])
  }

  function totalLinha() {
    const qtd = Number(item.quantidade || 0)
    if (tipo === 'material') return Number(item.material || 0) * qtd
    return (Number(item.mao_obra || 0) + Number(item.equipamentos || 0)) * qtd
  }

  return (
    <div style={{ display: 'flex', gap: 8, padding: '10px 14px', borderBottom: '1px solid #f1f5f9', alignItems: 'center', borderLeft: `3px solid ${corBorda}20` }}>

      {/* CÓD */}
      <input
        disabled={readOnly}
        value={item.codigo}
        onChange={e => atualizar(index, 'codigo', e.target.value)}
        placeholder="Ex: 94964"
        style={{ ...inputSt, flex: '0 0 90px', fontSize: 12 }}
      />

      {/* DESCRIÇÃO COM AUTOCOMPLETE */}
      <div ref={wrapRef} style={{ flex: 3, position: 'relative' }}>
        <input
          disabled={readOnly}
          value={termoBusca}
          onChange={e => handleDescricaoChange(e.target.value)}
          placeholder="Digite para buscar no SINAPI..."
          style={{ ...inputSt, width: '100%' }}
        />
        {buscando && (
          <span style={{ position: 'absolute', right: 8, top: 9, fontSize: 11, color: '#94a3b8' }}>⏳</span>
        )}
        {mostrarLista && sugestoes.length > 0 && (
          <div style={dropdownSt}>
            {sugestoes.map(s => (
              <div
                key={s.codigo}
                style={dropdownItem}
                onMouseDown={() => selecionarSinapi(s)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', flex: 1 }}>{s.descricao}</span>
                  <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 700, marginLeft: 8 }}>{format(s.valor)}</span>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>Cód: {s.codigo}</span>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>Un: {s.unidade}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* UNIDADE */}
      <select
        disabled={readOnly}
        value={item.unidade}
        onChange={e => atualizar(index, 'unidade', e.target.value)}
        style={{ ...inputSt, flex: '0 0 80px', textAlign: 'center', cursor: 'pointer' }}
      >
        {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
      </select>

      {/* QUANTIDADE */}
      <input
        disabled={readOnly}
        type="number"
        value={item.quantidade}
        onChange={e => atualizar(index, 'quantidade', Number(e.target.value))}
        style={{ ...inputSt, flex: '0 0 70px', textAlign: 'center' }}
        min="0" step="0.01"
      />

      {/* VALOR MATERIAL ou MÃO DE OBRA */}
      {tipo === 'material' && (
        <input
          disabled={readOnly}
          type="number"
          value={item.material}
          onChange={e => atualizar(index, 'material', Number(e.target.value))}
          style={{ ...inputSt, flex: 1, textAlign: 'right', borderColor: '#bae6fd' }}
          min="0" step="0.01"
        />
      )}
      {tipo === 'servico' && (
        <input
          disabled={readOnly}
          type="number"
          value={item.mao_obra}
          onChange={e => atualizar(index, 'mao_obra', Number(e.target.value))}
          style={{ ...inputSt, flex: 1, textAlign: 'right', borderColor: '#fde68a' }}
          min="0" step="0.01"
        />
      )}

      {/* EQUIPAMENTOS (só serviços) */}
      {tipo === 'servico' && (
        <input
          disabled={readOnly}
          type="number"
          value={item.equipamentos}
          onChange={e => atualizar(index, 'equipamentos', Number(e.target.value))}
          style={{ ...inputSt, flex: 1, textAlign: 'right', borderColor: '#ddd6fe' }}
          min="0" step="0.01"
        />
      )}

      {/* TOTAL */}
      <div style={{ flex: 1, textAlign: 'right', fontWeight: 700, color: '#16a34a', fontSize: 14 }}>
        {format(totalLinha())}
      </div>

      {/* REMOVER */}
      {!readOnly && (
        <button onClick={() => remover(index)} style={btnRemoverSt}>✕</button>
      )}

    </div>
  )
}

/* ── CARD DE RESUMO ── */
function ResumoCard({ label, valor, cor, perc, grande }: any) {
  return (
    <div style={{ background: cor + '12', border: `1px solid ${cor}30`, borderRadius: 12, padding: '14px 16px' }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>{label}</p>
      <p style={{ fontSize: grande ? 20 : 17, fontWeight: 800, color: cor }}>{format(valor)}</p>
      <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
        {perc > 0 ? perc.toFixed(1) + '%' : '—'}
      </p>
    </div>
  )
}

function format(v: number) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/* ── ESTILOS ── */
const inputSt: React.CSSProperties = {
  padding: '8px 10px',
  border: '1px solid #e2e8f0',
  borderRadius: 6,
  fontSize: 13,
  background: '#f8fafc',
  outline: 'none',
}

const dropdownSt: React.CSSProperties = {
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: 10,
  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
  zIndex: 999,
  maxHeight: 280,
  overflowY: 'auto',
}

const dropdownItem: React.CSSProperties = {
  padding: '10px 14px',
  cursor: 'pointer',
  borderBottom: '1px solid #f1f5f9',
}

const btnRemoverSt: React.CSSProperties = {
  flex: '0 0 32px',
  background: '#fee2e2',
  color: '#dc2626',
  border: 'none',
  borderRadius: 6,
  width: 32,
  height: 32,
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 700,
}

const resumoGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 12,
  marginTop: 8,
}