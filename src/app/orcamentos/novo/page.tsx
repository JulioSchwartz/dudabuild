'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

// ✅ CATEGORIAS PROFISSIONAIS
const categoriasPadrao = [
  'Serviços de Mão de Obra',
  'Lista de Materiais',
  'Equipamentos',
  'Acabamentos'
]

export default function NovoOrcamento() {

  const [cliente, setCliente] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [email, setEmail] = useState('')
  const [descricao, setDescricao] = useState('')

  const [memorial, setMemorial] = useState({
    materiais: '',
    metodos: '',
    marcas: '',
    observacoes: ''
  })

  const [condicoes, setCondicoes] = useState({
    validade: '',
    pagamento: '',
    garantia: '',
    observacoes: ''
  })

  
  function adicionarItem() {
    setItens([
      ...itens,
      {
        categoria: 'Lista de Materiais',
        codigo: '',
        descricao: '',
        unidade: 'm²',
        quantidade: 1,
        material: 0,
        mao_obra: 0,
        equipamentos: 0
      }
    ])
  }

  function removerItem(index: number) {
    const novos = [...itens]
    novos.splice(index, 1)
    setItens(novos)
  }

  function atualizarItem(index: number, campo: string, valor: any) {
    const novos = [...itens]
    novos[index][campo] = valor
    setItens(novos)
  }

  function totalItem(item: any) {
    return (item.material + item.mao_obra + item.equipamentos) * item.quantidade
  }

  function totalGeral() {
    return itens.reduce((acc, item) => acc + totalItem(item), 0)
  }

  function totalPorCategoria(cat: string) {
    return itens
      .filter(i => i.categoria === cat)
      .reduce((acc, i) => acc + totalItem(i), 0)
  }

  function cronogramaComValor() {
    const total = totalGeral()
    return cronograma.map(c => ({
      ...c,
      valor: (c.percentual / 100) * total
    }))
  }

  async function salvar() {
    const empresa = "DudaBuild Engenharia"

    const { data: orcamento } = await supabase
      .from('orcamentos')
      .insert({
        empresa_id,
        cliente_nome: cliente,
        cliente_whatsapp: whatsapp,
        cliente_email: email,
        descricao,
        memorial,
        condicoes,
        cronograma,
        valor_total: totalGeral()
      })
      .select()
      .single()

    if (!orcamento) {
      alert('Erro ao salvar')
      return
    }

    const itensFormatados = itens.map(i => ({
      orcamento_id: orcamento.id,
      categoria: i.categoria,
      codigo: i.codigo,
      descricao: i.descricao,
      unidade: i.unidade,
      quantidade: i.quantidade,
      material: i.material,
      mao_obra: i.mao_obra,
      equipamentos: i.equipamentos,
      valor_total: totalItem(i)
    }))

    await supabase.from('orcamento_itens').insert(itensFormatados)

    alert('Orçamento salvo com sucesso!')
  }

  function gerarPDF() {

  const empresa = "DudaBuild Engenharia"

  const html = `
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      color: #0f172a;
    }

    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 40px;
      box-sizing: border-box;
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #1e3a8a;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }

    .logo {
      height: 50px;
    }

    .empresa {
      text-align: right;
      font-size: 14px;
    }

    h1 {
      font-size: 26px;
      color: #1e3a8a;
    }

    h2 {
      color: #1e3a8a;
      margin-top: 30px;
      font-size: 18px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }

    th {
      background: #1e3a8a;
      color: white;
      padding: 8px;
      font-size: 12px;
    }

    td {
      border: 1px solid #e2e8f0;
      padding: 8px;
      font-size: 12px;
    }

    .box {
      background: #f8fafc;
      padding: 12px;
      border-radius: 6px;
      margin-top: 10px;
      font-size: 13px;
    }

    .total {
      margin-top: 30px;
      font-size: 24px;
      font-weight: bold;
      text-align: right;
      color: #16a34a;
    }

    .assinatura {
      margin-top: 60px;
      display: flex;
      justify-content: space-between;
      font-size: 14px;
    }

    .linha {
      border-top: 1px solid #000;
      width: 250px;
      margin-top: 40px;
      text-align: center;
    }

  </style>

  <div class="page">

    <!-- HEADER -->
    <div class="header">
      <img src="/logo.png" class="logo" />
      <div class="empresa">
        <strong>${empresa}</strong><br/>
        Proposta Comercial<br/>
        ${new Date().toLocaleDateString()}
      </div>
    </div>

    <h1>Proposta para ${cliente}</h1>

    <h2>Resumo Executivo</h2>
    <div class="box">
      ${descricao || 'Execução de serviços conforme orçamento abaixo.'}
    </div>

    <h2>Planilha de Custos</h2>
    <table>
      <tr>
        <th>Categoria</th>
        <th>Descrição</th>
        <th>Qtd</th>
        <th>Material</th>
        <th>M.O</th>
        <th>Equip</th>
        <th>Total</th>
      </tr>

      ${itens.map(i => `
        <tr>
          <td>${i.categoria}</td>
          <td>${i.descricao}</td>
          <td>${i.quantidade}</td>
          <td>R$ ${i.material}</td>
          <td>R$ ${i.mao_obra}</td>
          <td>R$ ${i.equipamentos}</td>
          <td><b>R$ ${totalItem(i).toFixed(2)}</b></td>
        </tr>
      `).join('')}

    </table>

    <h2>Memorial Descritivo</h2>
    <div class="box">
      <p><b>Materiais:</b> ${memorial.materiais}</p>
      <p><b>Métodos:</b> ${memorial.metodos}</p>
      <p><b>Marcas:</b> ${memorial.marcas}</p>
      <p><b>Observações:</b> ${memorial.observacoes}</p>
    </div>

    <h2>Condições Comerciais</h2>
    <div class="box">
      <p><b>Pagamento:</b> ${condicoes.pagamento}</p>
      <p><b>Validade:</b> ${condicoes.validade}</p>
      <p><b>Garantia:</b> ${condicoes.garantia}</p>
      <p><b>Observações:</b> ${condicoes.observacoes}</p>
    </div>

    <div class="total">
      VALOR TOTAL: R$ ${totalGeral().toFixed(2)}
    </div>

    <!-- ASSINATURA -->
    <div class="assinatura">
      <div>
        <div class="linha">${empresa}</div>
      </div>

      <div>
        <div class="linha">${cliente}</div>
      </div>
    </div>

  </div>
  `

  const w = window.open('', '', 'width=900,height=700')
  w?.document.write(html)
  w?.document.close()
  w?.print()
}

  const categorias = [...new Set(itens.map(i => i.categoria))]

  return (
    <div style={container}>
      <h1 style={titulo}>📊 Orçamento Profissional</h1>

      {categorias.map(cat => (
        <div key={cat} style={card}>
          <h3>{cat}</h3>

          <div style={header}>
            <span>Cód</span><span>Descrição</span><span>Un</span><span>Qtd</span>
            <span>Material</span><span>M.O</span><span>Equip</span><span>Total</span><span></span>
          </div>

          {itens.filter(i => i.categoria === cat).map((item, index) => (
            <div key={index} style={linha(index)}>

              <input value={item.codigo} onChange={e => atualizarItem(index,'codigo',e.target.value)} style={input}/>
              <input value={item.descricao} onChange={e => atualizarItem(index,'descricao',e.target.value)} style={input}/>
              <input value={item.unidade} onChange={e => atualizarItem(index,'unidade',e.target.value)} style={input}/>

              <input type="number" value={item.quantidade} onChange={e => atualizarItem(index,'quantidade', Number(e.target.value))} style={input}/>
              <input type="number" value={item.material} onChange={e => atualizarItem(index,'material', Number(e.target.value))} style={input}/>
              <input type="number" value={item.mao_obra} onChange={e => atualizarItem(index,'mao_obra', Number(e.target.value))} style={input}/>
              <input type="number" value={item.equipamentos} onChange={e => atualizarItem(index,'equipamentos', Number(e.target.value))} style={input}/>

              <strong>R$ {totalItem(item).toFixed(2)}</strong>

              <button onClick={() => removerItem(index)} style={btnRemover}>X</button>
            </div>
          ))}

          <div style={subtotal}>
            Subtotal: R$ {totalPorCategoria(cat).toFixed(2)}
          </div>
        </div>
      ))}

      <button onClick={adicionarItem} style={btnAdd}>+ Item</button>

      <div style={totalBox}>
        Total: R$ {totalGeral().toFixed(2)}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={salvar} style={btnSalvar}>Salvar</button>
        <button onClick={gerarPDF} style={btnPDF}>PDF</button>
      </div>
    </div>
  )
}

// 🎨 ESTILO PROFISSIONAL
const container={maxWidth:1100,margin:'0 auto',padding:24,background:'#f8fafc'}

const titulo={fontSize:28,fontWeight:700}

const card={background:'#fff',padding:20,borderRadius:12,marginBottom:20,boxShadow:'0 2px 6px rgba(0,0,0,0.05)'}

const header = {
  display:'grid',
  gridTemplateColumns:'80px 2fr 70px 80px 110px 110px 110px 120px 60px',
  gap:8,
  background:'#e2e8f0',
  padding:10,
  borderRadius:8,
  alignItems:'center' // 🔥 ESSENCIAL
}

const linha=(i:number)=>({
  display:'grid',
  gridTemplateColumns:'80px 2fr 70px 80px 110px 110px 110px 120px 60px',
  gap:8,
  marginTop:8,
  padding:10,
  background:i%2?'#f8fafc':'#fff',
  alignItems:'center' // 🔥 ESSENCIAL
})

const input={width:'100%',padding:8,border:'1px solid #cbd5e1',borderRadius:6}

const subtotal={textAlign:'right',marginTop:10,fontWeight:600}

const totalBox={fontSize:28,fontWeight:700,color:'#16a34a',textAlign:'right'}

const btnAdd={background:'#22c55e',color:'#fff',padding:10,borderRadius:6}

const btnRemover={background:'#ef4444',color:'#fff',borderRadius:6,width:40}

const btnSalvar={background:'#2563eb',color:'#fff',padding:12,borderRadius:8}

const btnPDF={background:'#111827',color:'#fff',padding:12,borderRadius:8}
