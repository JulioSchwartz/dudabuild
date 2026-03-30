'use client'

export default function TabelaOrcamento({ itens, atualizarItem, removerItem, totalItem }) {

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

          <input value={item.codigo} onChange={e => atualizarItem(index,'codigo',e.target.value)} style={inputPeq}/>
          <input value={item.descricao} onChange={e => atualizarItem(index,'descricao',e.target.value)} style={input}/>
          <input value={item.unidade} onChange={e => atualizarItem(index,'unidade',e.target.value)} style={inputPeq}/>

          <input type="number" value={item.quantidade} onChange={e => atualizarItem(index,'quantidade', Number(e.target.value))} style={inputPeq}/>
          <input type="number" value={item.material} onChange={e => atualizarItem(index,'material', Number(e.target.value))} style={inputPeq}/>
          <input type="number" value={item.mao_obra} onChange={e => atualizarItem(index,'mao_obra', Number(e.target.value))} style={inputPeq}/>
          <input type="number" value={item.equipamentos} onChange={e => atualizarItem(index,'equipamentos', Number(e.target.value))} style={inputPeq}/>

          <strong>R$ {totalItem(item).toFixed(2)}</strong>

          <button onClick={()=>removerItem(index)} style={btnRemover}>X</button>
        </div>
      ))}
    </>
  )
}

const header = {
  display:'grid',
  gridTemplateColumns:'80px 2fr 80px 80px 120px 120px 120px 120px 50px',
  background:'#e2e8f0',
  padding:10,
  borderRadius:8,
  fontWeight:600
}

const linha = (i:number)=>({
  display:'grid',
  gridTemplateColumns:'80px 2fr 80px 80px 120px 120px 120px 120px 50px',
  gap:8,
  marginTop:8,
  padding:10,
  background:i%2?'#f8fafc':'#fff',
  borderRadius:8,
  alignItems:'center'
})

const input = { padding:8, border:'1px solid #cbd5e1', borderRadius:6 }
const inputPeq = input
const btnRemover = { background:'#ef4444', color:'#fff', borderRadius:6 }