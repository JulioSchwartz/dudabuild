'use client'

type Item = {
  codigo: string
  descricao: string
  unidade: string
  quantidade: number
  material: number
  mao_obra: number
  equipamentos: number
}

type Props = {
  itens: Item[]
  atualizarItem: (index: number, campo: keyof Item, valor: any) => void
  removerItem: (index: number) => void
  readOnly?: boolean
}

export default function TabelaOrcamento({
  itens,
  atualizarItem,
  removerItem,
  readOnly
}: Props) {

  function totalItem(i:any){
  return (
    Number(i.material || 0) +
    Number(i.mao_obra || 0) +
    Number(i.equipamentos || 0)
  ) * Number(i.quantidade || 0)
}

  return (
    <div style={wrapper}>

      {/* HEADER */}
      <div style={header}>
        <span>Cód</span>
        <span>Descrição</span>
        <span>Un</span>
        <span>Qtd</span>
        <span style={colMaterial}>Material</span>
        <span style={colMao}>M.O</span>
        <span style={colEquip}>Equip</span>
        <span>Total</span>
        <span></span>
      </div>

      {/* LINHAS */}
      {itens.map((item, index) => (
        <div key={index} style={linha}>

          <input
            disabled={readOnly}
            value={item.codigo}
            onChange={e => atualizarItem(index,'codigo',e.target.value)}
            style={input}
          />

          <input
            disabled={readOnly}
            value={item.descricao}
            onChange={e => atualizarItem(index,'descricao',e.target.value)}
            style={inputDescricao}
          />

          <input
            disabled={readOnly}
            value={item.unidade}
            onChange={e => atualizarItem(index,'unidade',e.target.value)}
            style={input}
          />

          <input
            disabled={readOnly}
            type="number"
            value={item.quantidade}
            onChange={e => atualizarItem(index,'quantidade', Number(e.target.value))}
            style={input}
          />

          <input
            disabled={readOnly}
            type="number"
            value={item.material}
            onChange={e => atualizarItem(index,'material', Number(e.target.value))}
            style={inputValor}
          />

          <input
            disabled={readOnly}
            type="number"
            value={item.mao_obra}
            onChange={e => atualizarItem(index,'mao_obra', Number(e.target.value))}
            style={inputValor}
          />

          <input
            disabled={readOnly}
            type="number"
            value={item.equipamentos}
            onChange={e => atualizarItem(index,'equipamentos', Number(e.target.value))}
            style={inputValor}
          />

          <div style={total}>
            {format(totalItem(item))}
          </div>

          {!readOnly && (
            <button onClick={() => removerItem(index)} style={btnRemover}>
              ✕
            </button>
          )}

        </div>
      ))}

    </div>
  )
}

/* HELPERS */

function format(v:number){
  return v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
}

/* 🎨 UI PREMIUM */

const wrapper = {
  marginTop: 20
}

const header = {
  display:'grid',
  gridTemplateColumns:'80px 2fr 70px 70px 120px 120px 120px 140px 50px',
  background:'#0f172a',
  color:'#fff',
  padding:12,
  borderRadius:10,
  fontSize:13,
  fontWeight:600
}

const linha = {
  display:'grid',
  gridTemplateColumns:'80px 2fr 70px 70px 120px 120px 120px 140px 50px',
  gap:10,
  marginTop:10,
  alignItems:'center',
  background:'#fff',
  padding:10,
  borderRadius:10,
  boxShadow:'0 5px 15px rgba(0,0,0,0.04)'
}

const input = {
  padding:10,
  border:'1px solid #e2e8f0',
  borderRadius:8,
  fontSize:13
}

const inputDescricao = {
  padding:10,
  border:'1px solid #e2e8f0',
  borderRadius:8,
  fontSize:13,
  width:'100%'
}

const inputValor = {
  padding:10,
  border:'1px solid #e2e8f0',
  borderRadius:8,
  fontSize:13,
  textAlign:'right' as const
}

const total = {
  fontWeight:700,
  color:'#16a34a',
  textAlign:'right' as const
}

const btnRemover = {
  background:'#ef4444',
  color:'#fff',
  border:'none',
  borderRadius:8,
  width:32,
  height:32,
  cursor:'pointer',
  fontSize:16
}

/* CORES VISUAIS */

const colMaterial = { color:'#38bdf8' }
const colMao = { color:'#f59e0b' }
const colEquip = { color:'#a78bfa' }