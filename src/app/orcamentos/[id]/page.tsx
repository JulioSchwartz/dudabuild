'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function OrcamentoPublico(){

  const { id } = useParams()
  const [orc,setOrc]=useState<any>(null)
  const [itens,setItens]=useState<any[]>([])

  useEffect(()=>{carregar()},[])

  async function carregar(){
    const { data } = await supabase.from('orcamentos').select('*').eq('id',id).single()
    const { data: itensData } = await supabase.from('orcamento_itens').select('*').eq('orcamento_id',id)

    setOrc(data)
    setItens(itensData || [])
  }

  function total(){
    return itens.reduce((acc,i)=>acc+Number(i.valor_total),0)
  }

  if(!orc) return <p>Carregando...</p>

  return (
    <div style={{padding:40,maxWidth:900,margin:'0 auto'}}>

      <h1>Orçamento</h1>
      <h2>{orc.cliente_nome}</h2>

      <table style={{width:'100%',marginTop:20}}>
        <tr>
          <th>Descrição</th>
          <th>Qtd</th>
          <th>Total</th>
        </tr>

        {itens.map((i,index)=>(
          <tr key={index}>
            <td>{i.descricao}</td>
            <td>{i.quantidade}</td>
            <td>R$ {Number(i.valor_total).toFixed(2)}</td>
          </tr>
        ))}
      </table>

      <h2 style={{marginTop:20}}>
        Total: R$ {total().toFixed(2)}
      </h2>

    </div>
  )
}