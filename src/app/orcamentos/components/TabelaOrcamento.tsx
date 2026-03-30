'use client'

export default function TabelaOrcamento({ itens, atualizarItem, removerItem, totalItem }) {

  return itens.map((item, index) => (
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
  ))
}