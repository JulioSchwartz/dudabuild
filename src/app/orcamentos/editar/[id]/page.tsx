'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import TabelaOrcamento from '@/components/TabelaOrcamento'

export default function EditarOrcamento(){

  const { id } = useParams()

  const [itens,setItens]=useState<any[]>([])
  const [cliente,setCliente]=useState('')

  useEffect(()=>{
    carregar()
  },[])

  async function carregar(){
    const { data } = await supabase.from('orcamentos').select('*').eq('id',id).single()
    const { data:itensData } = await supabase.from('orcamento_itens').select('*').eq('orcamento_id',id)

    if(data) setCliente(data.cliente_nome)
    if(itensData) setItens(itensData)
  }

  function atualizarItem(index:number,campo:string,valor:any){
    const novos=[...itens]
    novos[index][campo]=valor
    setItens(novos)
  }

  function removerItem(index:number){
    const novos=[...itens]
    novos.splice(index,1)
    setItens(novos)
  }

  function totalItem(item:any){
    return (item.material + item.mao_obra + item.equipamentos) * item.quantidade
  }

  function totalGeral(){
    return itens.reduce((acc,i)=>acc+totalItem(i),0)
  }

  const categorias=[...new Set(itens.map(i=>i.categoria))]

  return(
    <div style={container}>

      <h1 style={titulo}>Editar Orçamento</h1>

      {categorias.map(cat=>(
        <div key={cat} style={card}>
          <h3>{cat}</h3>

          <TabelaOrcamento
            itens={itens.filter(i=>i.categoria===cat)}
            atualizarItem={atualizarItem}
            removerItem={removerItem}
            totalItem={totalItem}
          />
        </div>
      ))}

      <div style={totalBox}>Total: R$ {totalGeral().toFixed(2)}</div>

    </div>
  )
}

const container={maxWidth:1100,margin:'0 auto',padding:24}
const titulo={fontSize:28,fontWeight:700}
const card={background:'#fff',padding:20,borderRadius:12,marginBottom:20}
const totalBox={fontSize:24,fontWeight:700}