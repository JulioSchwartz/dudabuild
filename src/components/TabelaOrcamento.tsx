'use client'
 
type Item = {
  codigo:      string
  descricao:   string
  unidade:     string
  quantidade:  number
  material:    number
  mao_obra:    number
  equipamentos: number
}
 
type Props = {
  itens:         Item[]
  atualizarItem: (index: number, campo: keyof Item, valor: any) => void
  removerItem:   (index: number) => void
  readOnly?:     boolean
}
 
export default function TabelaOrcamento({ itens, atualizarItem, removerItem, readOnly }: Props) {
 
  function totalItem(i: any) {
    return (Number(i.material || 0) + Number(i.mao_obra || 0) + Number(i.equipamentos || 0))
      * Number(i.quantidade || 0)
  }
 
  // Separa itens por tipo para exibição
  const itensMaterial  = itens.map((item, idx) => ({ item, idx })).filter(({ item }) => Number(item.material) > 0 || (!item.mao_obra && !item.equipamentos))
  const itensMaoObra   = itens.map((item, idx) => ({ item, idx })).filter(({ item }) => Number(item.mao_obra) > 0)
  const itensEquip     = itens.map((item, idx) => ({ item, idx })).filter(({ item }) => Number(item.equipamentos) > 0)
 
  const totalMaterial  = itens.reduce((a, i) => a + Number(i.material || 0) * Number(i.quantidade || 0), 0)
  const totalMaoObra   = itens.reduce((a, i) => a + Number(i.mao_obra || 0) * Number(i.quantidade || 0), 0)
  const totalEquip     = itens.reduce((a, i) => a + Number(i.equipamentos || 0) * Number(i.quantidade || 0), 0)
  const totalGeral     = itens.reduce((a, i) => a + totalItem(i), 0)
 
  return (
    <div style={wrapper}>
 
      {/* ── TABELA PRINCIPAL ── */}
      <div style={tableContainer}>
 
        {/* HEADER */}
        <div style={headerRow}>
          <span style={{ ...col, flex: '0 0 70px' }}>Cód</span>
          <span style={{ ...col, flex: 3 }}>Descrição</span>
          <span style={{ ...col, flex: '0 0 60px', textAlign: 'center' }}>Un</span>
          <span style={{ ...col, flex: '0 0 60px', textAlign: 'center' }}>Qtd</span>
          <span style={{ ...col, flex: 1, textAlign: 'right', color: '#38bdf8' }}>Material</span>
          <span style={{ ...col, flex: 1, textAlign: 'right', color: '#f59e0b' }}>M. de Obra</span>
          <span style={{ ...col, flex: 1, textAlign: 'right', color: '#a78bfa' }}>Equip.</span>
          <span style={{ ...col, flex: 1, textAlign: 'right', color: '#4ade80' }}>Total</span>
          {!readOnly && <span style={{ flex: '0 0 40px' }} />}
        </div>
 
        {/* LINHAS */}
        {itens.map((item, index) => (
          <div key={index} style={itemRow}>
 
            <input
              disabled={readOnly}
              value={item.codigo}
              onChange={e => atualizarItem(index, 'codigo', e.target.value)}
              placeholder="MO-01"
              style={{ ...inputBase, flex: '0 0 70px' }}
            />
 
            <input
              disabled={readOnly}
              value={item.descricao}
              onChange={e => atualizarItem(index, 'descricao', e.target.value)}
              placeholder="Descreva o item..."
              style={{ ...inputBase, flex: 3 }}
            />
 
            <input
              disabled={readOnly}
              value={item.unidade}
              onChange={e => atualizarItem(index, 'unidade', e.target.value)}
              placeholder="m²"
              style={{ ...inputBase, flex: '0 0 60px', textAlign: 'center' }}
            />
 
            <input
              disabled={readOnly}
              type="number"
              value={item.quantidade}
              onChange={e => atualizarItem(index, 'quantidade', Number(e.target.value))}
              style={{ ...inputBase, flex: '0 0 60px', textAlign: 'center' }}
              min="0"
            />
 
            <input
              disabled={readOnly}
              type="number"
              value={item.material}
              onChange={e => atualizarItem(index, 'material', Number(e.target.value))}
              style={{ ...inputBase, flex: 1, textAlign: 'right', borderColor: '#bae6fd' }}
              min="0"
              step="0.01"
            />
 
            <input
              disabled={readOnly}
              type="number"
              value={item.mao_obra}
              onChange={e => atualizarItem(index, 'mao_obra', Number(e.target.value))}
              style={{ ...inputBase, flex: 1, textAlign: 'right', borderColor: '#fde68a' }}
              min="0"
              step="0.01"
            />
 
            <input
              disabled={readOnly}
              type="number"
              value={item.equipamentos}
              onChange={e => atualizarItem(index, 'equipamentos', Number(e.target.value))}
              style={{ ...inputBase, flex: 1, textAlign: 'right', borderColor: '#ddd6fe' }}
              min="0"
              step="0.01"
            />
 
            <div style={{ flex: 1, textAlign: 'right', fontWeight: 700, color: '#16a34a', fontSize: 14 }}>
              {format(totalItem(item))}
            </div>
 
            {!readOnly && (
              <button onClick={() => removerItem(index)} style={btnRemover}>✕</button>
            )}
 
          </div>
        ))}
 
      </div>
 
      {/* ── RESUMO POR CATEGORIA ── */}
      <div style={resumoGrid}>
 
        <div style={resumoCard('#bae6fd', '#0369a1')}>
          <p style={resumoLabel}>🧱 Total Materiais</p>
          <p style={resumoValor}>{format(totalMaterial)}</p>
          <p style={resumoPerc}>
            {totalGeral > 0 ? ((totalMaterial / totalGeral) * 100).toFixed(1) + '%' : '—'}
          </p>
        </div>
 
        <div style={resumoCard('#fde68a', '#92400e')}>
          <p style={resumoLabel}>👷 Total Mão de Obra</p>
          <p style={resumoValor}>{format(totalMaoObra)}</p>
          <p style={resumoPerc}>
            {totalGeral > 0 ? ((totalMaoObra / totalGeral) * 100).toFixed(1) + '%' : '—'}
          </p>
        </div>
 
        <div style={resumoCard('#ddd6fe', '#5b21b6')}>
          <p style={resumoLabel}>🔧 Total Equipamentos</p>
          <p style={resumoValor}>{format(totalEquip)}</p>
          <p style={resumoPerc}>
            {totalGeral > 0 ? ((totalEquip / totalGeral) * 100).toFixed(1) + '%' : '—'}
          </p>
        </div>
 
        <div style={resumoCard('#bbf7d0', '#14532d')}>
          <p style={resumoLabel}>💰 Total Geral</p>
          <p style={{ ...resumoValor, fontSize: 20 }}>{format(totalGeral)}</p>
          <p style={resumoPerc}>100%</p>
        </div>
 
      </div>
 
    </div>
  )
}
 
function format(v: number) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
 
/* ESTILOS */
 
const wrapper: React.CSSProperties = { marginTop: 20 }
 
const tableContainer: React.CSSProperties = {
  background: '#fff',
  borderRadius: 12,
  overflow: 'hidden',
  boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
  marginBottom: 16
}
 
const col: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
}
 
const headerRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  background: '#0f172a',
  color: '#94a3b8',
  padding: '12px 16px',
}
 
const itemRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '10px 16px',
  borderBottom: '1px solid #f1f5f9',
  transition: 'background 0.1s',
}
 
const inputBase: React.CSSProperties = {
  padding: '8px 10px',
  border: '1px solid #e2e8f0',
  borderRadius: 6,
  fontSize: 13,
  background: '#f8fafc',
  outline: 'none',
  width: '100%',
}
 
const btnRemover: React.CSSProperties = {
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
 
const resumoCard = (bg: string, cor: string): React.CSSProperties => ({
  background: bg + '40',
  border: `1px solid ${bg}`,
  borderRadius: 12,
  padding: '14px 16px',
})
 
const resumoLabel: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: '#64748b',
  marginBottom: 4,
}
 
const resumoValor: React.CSSProperties = {
  fontSize: 17,
  fontWeight: 800,
  color: '#0f172a',
}
 
const resumoPerc: React.CSSProperties = {
  fontSize: 11,
  color: '#94a3b8',
  marginTop: 2,
}