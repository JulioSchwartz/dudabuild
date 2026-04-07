'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import TabelaOrcamento from '@/components/TabelaOrcamento'
import { useEmpresa } from '@/hooks/useEmpresa'
import html2pdf from 'html2pdf.js'

export default function NovoOrcamento() {

  const { empresaId } = useEmpresa()

  const [cliente, setCliente] = useState('')
  const [descricao, setDescricao] = useState('')
  const [orcamentoId, setOrcamentoId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [itens, setItens] = useState<any[]>([{
    descricao: '',
    quantidade: 1,
    material: 0,
    mao_obra: 0,
    equipamentos: 0
  }])

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
      descricao:'',
      quantidade:1,
      material:0,
      mao_obra:0,
      equipamentos:0
    }])
  }

  function totalItem(i:any){
    return (Number(i.material||0)+Number(i.mao_obra||0)+Number(i.equipamentos||0))*Number(i.quantidade||0)
  }

  function totalGeral(){
    return itens.reduce((a,i)=>a+totalItem(i),0)
  }

  async function salvar(){

  if (!cliente) return alert('Informe o cliente')
  if (!empresaId) return alert('Erro empresa')

  setLoading(true)

  const token = crypto.randomUUID()

  const { data: orc, error } = await supabase
    .from('orcamentos')
    .insert({
      empresa_id: empresaId,
      cliente_nome: cliente,
      descricao,
      valor_total: totalGeral(),
      token // 🔥 AQUI
    })
    .select()
    .single()

  if (error || !orc) {
    alert('Erro ao salvar')
    setLoading(false)
    return
  }

  setOrcamentoId(orc.id)

  await supabase.from('orcamento_itens').insert(
    itens.map(i => ({
      ...i,
      orcamento_id: orc.id,
      valor_total: totalItem(i)
    }))
  )

  // 🔥 LINK PRONTO AUTOMÁTICO
  const link = `${window.location.origin}/orcamento-publico/${orc.id}?token=${token}`

  console.log('Link:', link)

  alert('Orçamento salvo! Link copiado')

  navigator.clipboard.writeText(link)

  setLoading(false)
}

  function gerarPDF(){

  const dataHoje = new Date().toLocaleDateString('pt-BR')

  const element = document.createElement('div')

  element.innerHTML = `
    <div style="font-family:Arial;color:#0f172a">

      <!-- CAPA -->
      <div style="
        height:200px;
        background:#0f172a;
        color:white;
        display:flex;
        flex-direction:column;
        justify-content:center;
        align-items:center;
      ">
        <img src="/logo.png" style="width:120px;margin-bottom:10px"/>
        <h1 style="margin:0">DudaBuild Engenharia</h1>
        <p style="margin:0">Proposta Comercial</p>
      </div>

      <div style="padding:40px">

        <!-- CLIENTE -->
        <div style="margin-bottom:30px">
          <h2 style="margin-bottom:10px">Dados do Cliente</h2>
          <p><strong>Cliente:</strong> ${cliente}</p>
          <p><strong>Descrição:</strong> ${descricao}</p>
          <p><strong>Data:</strong> ${dataHoje}</p>
        </div>

        <!-- ITENS -->
        <div>
          <h2 style="margin-bottom:10px">Itens do Orçamento</h2>

          ${itens.map(i => `
            <div style="
              display:flex;
              justify-content:space-between;
              padding:12px 0;
              border-bottom:1px solid #e2e8f0;
            ">
              <span>${i.descricao}</span>
              <strong>${format(totalItem(i))}</strong>
            </div>
          `).join('')}

        </div>

        <!-- TOTAL -->
        <div style="
          margin-top:40px;
          padding:25px;
          background:#16a34a;
          color:white;
          border-radius:10px;
          text-align:center;
        ">
          <h2>Total do Investimento</h2>
          <h1>${format(totalGeral())}</h1>
        </div>

        <!-- ASSINATURA -->
        <div style="margin-top:60px">
          <p>______________________________________</p>
          <p><strong>DudaBuild Engenharia</strong></p>
          <p>Responsável Técnico</p>
        </div>

        <!-- RODAPÉ -->
        <div style="
          margin-top:40px;
          text-align:center;
          font-size:12px;
          color:#64748b;
        ">
          Proposta válida por 7 dias<br/>
          contato@dudabuild.com
        </div>

      </div>

    </div>
  `

  html2pdf()
    .from(element)
    .set({
      margin: 0,
      filename: `Proposta_${cliente.replace(/\s+/g,'_')}.pdf`,
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    })
    .save()
}

  return(
    <div style={container}>

      <h1 style={titulo}>Nova Proposta Comercial</h1>

      <input value={cliente} onChange={e=>setCliente(e.target.value)} placeholder="Cliente" style={input}/>
      <input value={descricao} onChange={e=>setDescricao(e.target.value)} placeholder="Descrição" style={input}/>

      <TabelaOrcamento itens={itens} atualizarItem={atualizarItem} removerItem={removerItem}/>

      <button onClick={adicionarItem}>+ Item</button>

      <h2>{format(totalGeral())}</h2>

      <button onClick={salvar}>
        {loading ? 'Salvando...' : 'Salvar'}
      </button>

      <button onClick={gerarPDF}>
        Baixar PDF
      </button>

    </div>
  )
}

/* HELPERS */

function format(v:number){
  return v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
}

/* UI */

const container={maxWidth:800,margin:'0 auto',padding:20}
const titulo={fontSize:26,fontWeight:700}
const input={width:'100%',marginTop:10,padding:10}