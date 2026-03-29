'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

const categoriasPadrao = [
  'Serviços preliminares',
  'Infraestrutura',
  'Superestrutura',
  'Alvenaria',
  'Cobertura',
  'Instalações',
  'Revestimentos',
  'Acabamentos',
  'Limpeza'
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

  const [cronograma, setCronograma] = useState([
    { etapa: 'Fundação', dias: 10, percentual: 20 }
  ])

  const [itens, setItens] = useState([
    {
      categoria: 'Infraestrutura',
      codigo: '',
      descricao: '',
      unidade: 'm²',
      quantidade: 1,
      material: 0,
      mao_obra: 0,
      equipamentos: 0
    }
  ])

  function adicionarItem() {
    setItens([
      ...itens,
      {
        categoria: 'Serviços preliminares',
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
    const empresa_id = localStorage.getItem('empresa_id')

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

    const cron = cronogramaComValor().map(c => `
      <tr>
        <td>${c.etapa}</td>
        <td>${c.dias}</td>
        <td>${c.percentual}%</td>
        <td>R$ ${c.valor.toFixed(2)}</td>
      </tr>
    `).join('')

    const html = `
      <style>
        body { font-family: Arial; padding: 30px; color:#0f172a }
        h1 { font-size: 28px; color:#1e3a8a }
        table { width: 100%; border-collapse: collapse; margin-top: 20px }
        th, td { border: 1px solid #ccc; padding: 8px }
        th { background: #f1f5f9 }
      </style>

      <h1>ORÇAMENTO</h1>

      <h3>Cliente</h3>
      <p>${cliente}</p>

      <h3>Resumo</h3>
      <p><b>Total:</b> R$ ${totalGeral().toFixed(2)}</p>

      <h3>Planilha</h3>
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
            <td>${i.material}</td>
            <td>${i.mao_obra}</td>
            <td>${i.equipamentos}</td>
            <td>R$ ${totalItem(i).toFixed(2)}</td>
          </tr>
        `).join('')}
      </table>

      <h3>Cronograma</h3>
      <table>
        <tr><th>Etapa</th><th>Dias</th><th>%</th><th>Valor</th></tr>
        ${cron}
      </table>

      <h3>Memorial</h3>
      <p><b>Materiais:</b> ${memorial.materiais}</p>
      <p><b>Métodos:</b> ${memorial.metodos}</p>
      <p><b>Marcas:</b> ${memorial.marcas}</p>
      <p><b>Observações:</b> ${memorial.observacoes}</p>

      <h3>Condições Comerciais</h3>
      <p><b>Pagamento:</b> ${condicoes.pagamento}</p>
      <p><b>Validade:</b> ${condicoes.validade}</p>
      <p><b>Garantia:</b> ${condicoes.garantia}</p>
      <p><b>Obs:</b> ${condicoes.observacoes}</p>
    `

    const w = window.open('', '', 'width=900,height=700')
    w?.document.write(html)
    w?.document.close()
    w?.print()
  }

  const categorias = [...new Set(itens.map(i => i.categoria))]

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24, background: '#f8fafc', color: '#0f172a' }}>

      <h1 style={{ fontSize: 28, fontWeight: 700 }}>📊 Orçamento Profissional</h1>

      <div style={card}>
        <h3>Dados do Cliente</h3>
        <div style={grid}>
          <input placeholder="Nome" onChange={e => setCliente(e.target.value)} style={input}/>
          <input placeholder="WhatsApp" onChange={e => setWhatsapp(e.target.value)} style={input}/>
          <input placeholder="Email" onChange={e => setEmail(e.target.value)} style={input}/>
        </div>
      </div>

      <div style={card}>
        <h3>Descrição</h3>
        <textarea onChange={e => setDescricao(e.target.value)} style={textarea}/>
      </div>

      {categorias.map(cat => (
        <div key={cat} style={card}>
          <h3>{cat}</h3>

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

          {itens.filter(i => i.categoria === cat).map((item, index) => (
            <div key={index} style={linha(index)}>

              <input value={item.codigo} onChange={e => atualizarItem(index,'codigo',e.target.value)} style={input}/>
              <input value={item.descricao} onChange={e => atualizarItem(index,'descricao',e.target.value)} style={input}/>
              <input value={item.unidade} onChange={e => atualizarItem(index,'unidade',e.target.value)} style={input}/>

              <input
                type="number"
                value={item.quantidade}
                onChange={e => atualizarItem(index,'quantidade', Number(e.target.value))}
                style={input}
              />

              <input
                type="number"
                value={item.material}
                onChange={e => atualizarItem(index,'material', Number(e.target.value))}
                style={input}
              />

              <input
                type="number"
                value={item.mao_obra}
                onChange={e => atualizarItem(index,'mao_obra', Number(e.target.value))}
                style={input}
              />

              <input
                type="number"
                value={item.equipamentos}
                onChange={e => atualizarItem(index,'equipamentos', Number(e.target.value))}
                style={input}
              />

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

      <div style={card}>
        <h3>Memorial Descritivo</h3>
        <textarea placeholder="Materiais" onChange={e => setMemorial({...memorial, materiais:e.target.value})} style={textarea}/>
        <textarea placeholder="Métodos" onChange={e => setMemorial({...memorial, metodos:e.target.value})} style={textarea}/>
        <textarea placeholder="Marcas" onChange={e => setMemorial({...memorial, marcas:e.target.value})} style={textarea}/>
        <textarea placeholder="Observações" onChange={e => setMemorial({...memorial, observacoes:e.target.value})} style={textarea}/>
      </div>

      <div style={card}>
        <h3>Condições Comerciais</h3>
        <textarea placeholder="Forma de pagamento" onChange={e => setCondicoes({...condicoes, pagamento:e.target.value})} style={textarea}/>
        <textarea placeholder="Validade" onChange={e => setCondicoes({...condicoes, validade:e.target.value})} style={textarea}/>
        <textarea placeholder="Garantia" onChange={e => setCondicoes({...condicoes, garantia:e.target.value})} style={textarea}/>
        <textarea placeholder="Observações" onChange={e => setCondicoes({...condicoes, observacoes:e.target.value})} style={textarea}/>
      </div>

      <div style={{ fontSize: 26, fontWeight: 700, color: '#16a34a' }}>
        Total: R$ {totalGeral().toFixed(2)}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        <button onClick={salvar} style={btnSalvar}>Salvar</button>
        <button onClick={gerarPDF} style={btnPDF}>Gerar PDF</button>
      </div>

    </div>
  )
}

const card = { background:'#fff', padding:20, borderRadius:10, marginBottom:20 }
const grid = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }
const header = { display:'grid', gridTemplateColumns:'1fr 2fr 1fr 1fr 1fr 1fr 1fr 1fr 60px', background:'#e2e8f0', padding:10 }
const linha = (i:number)=>({
  display:'grid',
  gridTemplateColumns:'1fr 2fr 1fr 1fr 1fr 1fr 1fr 1fr 60px',
  gap:10,
  marginTop:10,
  background: i%2 ? '#f1f5f9' : '#fff',
  padding:10
})
const input = { padding:10, border:'1px solid #cbd5e1', borderRadius:6, color:'#000', background:'#fff' }
const textarea = { width:'100%', height:100, padding:10, marginTop:10 }
const subtotal = { textAlign:'right', marginTop:10, fontWeight:600 }
const btnAdd = { background:'#22c55e', color:'#fff', padding:10, borderRadius:6 }
const btnRemover = { background:'#ef4444', color:'#fff', borderRadius:6 }
const btnSalvar = { background:'#2563eb', color:'#fff', padding:12, borderRadius:8 }
const btnPDF = { background:'#111827', color:'#fff', padding:12, borderRadius:8 }
