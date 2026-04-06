'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import TabelaOrcamento from '@/components/TabelaOrcamento'

export default function EditarOrcamento(){

  const { id } = useParams()

  const [cliente, setCliente] = useState('')
  const [descricao, setDescricao] = useState('')
  const [itens, setItens] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (id) carregar()
  }, [id])

  async function carregar(){

    const { data: orc } = await supabase
      .from('orcamentos')
      .select('*')
      .eq('id', id)
      .single()

    setCliente(orc?.cliente_nome || '')
    setDescricao(orc?.descricao || '')

    const { data: itensData } = await supabase
      .from('orcamento_itens')
      .select('*')
      .eq('orcamento_id', id)

    setItens(itensData || [])
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

  function adicionarItem(){
    setItens([...itens,{
      codigo:'',
      descricao:'',
      unidade:'m²',
      quantidade:1,
      material:0,
      mao_obra:0,
      equipamentos:0
    }])
  }

  function totalItem(i:any){
    return (Number(i.material||0)+Number(i.mao_obra||0)+Number(i.equipamentos||0)) * Number(i.quantidade||0)
  }

  function totalGeral(){
    return itens.reduce((a,i)=>a+totalItem(i),0)
  }

  async function salvar(){

    setLoading(true)

    await supabase
      .from('orcamentos')
      .update({
        cliente_nome: cliente,
        descricao,
        valor_total: totalGeral()
      })
      .eq('id', id)

    await supabase
      .from('orcamento_itens')
      .delete()
      .eq('orcamento_id', id)

    await supabase.from('orcamento_itens').insert(
      itens.map(i => ({
        ...i,
        orcamento_id: id,
        valor_total: totalItem(i)
      }))
    )

    alert('Atualizado com sucesso!')
    setLoading(false)
  }

  function enviarWhatsApp() {
    const link = `${window.location.origin}/orcamentos/${id}`
    const texto = `Olá! Segue seu orçamento:\n${link}`
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`)
  }

  return(
    <div style={container}>

      <h1 style={titulo}>✏️ Editar Orçamento</h1>

      {/* CLIENTE */}
      <div style={card}>
        <input
          placeholder="Cliente"
          value={cliente}
          onChange={e => setCliente(e.target.value)}
          style={input}
        />

        <input
          placeholder="Descrição"
          value={descricao}
          onChange={e => setDescricao(e.target.value)}
          style={input}
        />
      </div>

      {/* TABELA */}
      <div style={card}>
        <TabelaOrcamento
          itens={itens}
          atualizarItem={atualizarItem}
          removerItem={removerItem}
        />

        <button onClick={adicionarItem} style={btnAdd}>
          + Adicionar Item
        </button>
      </div>

      {/* TOTAL */}
      <div style={totalBox}>
        {format(totalGeral())}
      </div>

      {/* AÇÕES */}
      <div style={acoes}>

        <button onClick={salvar} style={btnPrim}>
          {loading ? 'Salvando...' : 'Salvar Alterações'}
        </button>

        <button onClick={enviarWhatsApp} style={btnWhats}>
          Enviar WhatsApp
        </button>

      </div>

    </div>
  )
}

/* HELPERS */

function format(v:number){
  return v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
}

/* UI */

const container={maxWidth:1100,margin:'0 auto',padding:24}

const titulo={
  fontSize:26,
  fontWeight:700
}

const card={
  background:'#fff',
  padding:20,
  borderRadius:12,
  marginTop:20,
  boxShadow:'0 10px 30px rgba(0,0,0,0.05)'
}

const input={
  width:'100%',
  marginTop:10,
  padding:12,
  borderRadius:8,
  border:'1px solid #e2e8f0'
}

const totalBox={
  fontSize:28,
  fontWeight:700,
  marginTop:20,
  color:'#16a34a'
}

const acoes={
  display:'flex',
  gap:10,
  marginTop:20
}

const btnPrim={
  padding:14,
  borderRadius:10,
  border:'none',
  background:'#2563eb',
  color:'#fff',
  fontWeight:600
}

const btnWhats={
  padding:14,
  borderRadius:10,
  border:'none',
  background:'#22c55e',
  color:'#fff',
  fontWeight:600
}

const btnAdd={
  marginTop:15,
  padding:12,
  borderRadius:8,
  border:'1px solid #cbd5e1',
  cursor:'pointer'
}