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

  function totalItem(item: Item) {
    return (item.material + item.mao_obra + item.equipamentos) * item.quantidade
  }

  return (
    <>
      <div style={header}>
        <span>Cód</span>
        <span>Descrição</span>
        <span>Un</span>
        <span>Qtd</span>
        <span>Material</span>
        <span>M.O</span>
        <span>Equip</span>
        <span>Total</span>
        <span></span>
      </div>

      {itens.map((item, index) => (
        <div key={index} style={linha(index)}>

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
            style={input}
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
            style={input}
          />

          <input
            disabled={readOnly}
            type="number"
            value={item.mao_obra}
            onChange={e => atualizarItem(index,'mao_obra', Number(e.target.value))}
            style={input}
          />

          <input
            disabled={readOnly}
            type="number"
            value={item.equipamentos}
            onChange={e => atualizarItem(index,'equipamentos', Number(e.target.value))}
            style={input}
          />

          <strong>
            R$ {totalItem(item).toFixed(2)}
          </strong>

          {!readOnly && (
            <button onClick={() => removerItem(index)} style={btnRemover}>
              X
            </button>
          )}

        </div>
      ))}
    </>
  )
}

/* 🎨 ESTILO */

const header = {
  display:'grid',
  gridTemplateColumns:'80px 2fr 80px 80px 120px 120px 120px 120px 50px',
  background:'#e2e8f0',
  padding:10,
  borderRadius:8
}

const linha = (i:number)=>( {
  display:'grid',
  gridTemplateColumns:'80px 2fr 80px 80px 120px 120px 120px 120px 50px',
  gap:8,
  marginTop:8
})

const input = {
  padding:8,
  border:'1px solid #cbd5e1',
  borderRadius:6
}

const btnRemover = {
  background:'red',
  color:'#fff',
  border:'none',
  borderRadius:6,
  cursor:'pointer'
}