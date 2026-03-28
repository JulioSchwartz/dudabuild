'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function EditarOrcamento() {
  const { id } = useParams()
  const router = useRouter()

  const [carregando, setCarregando] = useState(true)

  const [clienteNome, setClienteNome] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [email, setEmail] = useState('')
  const [descricao, setDescricao] = useState('')
  const [memorial, setMemorial] = useState('')

  const [sugestoes, setSugestoes] = useState<any>({})
  const [itens, setItens] = useState<any[]>([])

  useEffect(() => {
    carregar()
  }, [])

  async function carregar() {
    const { data } = await supabase.from('orcamentos').select('*').eq('id', id).single()
    const { data: itensData } = await supabase.from('orcamento_itens').select('*').eq('orcamento_id', id)

    if (data) {
      setClienteNome(data.cliente_nome || '')
      setWhatsapp(data.cliente_whatsapp || '')
      setEmail(data.cliente_email || '')
      setDescricao(data.descricao || '')
      setMemorial(data.memorial || '')
    }

    if (itensData) {
      setItens(itensData.map(i => ({
        id: i.id,
        categoria: i.categoria || 'Serviços',
        codigo: i.codigo || '',
        descricao: i.descricao,
        unidade: i.unidade || 'm²',
        quantidade: i.quantidade,
        valor_unitario: i.valor_unitario
      })))
    }

    setCarregando(false)
  }

  async function buscarSugestoes(termo: string, index: number) {
    if (!termo || termo.length < 2) return

    const empresa_id = localStorage.getItem('empresa_id')

    const { data } = await supabase
      .from('itens_base')
      .select('*')
      .eq('empresa_id', empresa_id)
      .ilike('descricao', `%${termo}%`)
      .limit(5)

    setSugestoes(prev => ({
      ...prev,
      [index]: data
    }))
  }

  function selecionarItem(item: any, index: number) {
    atualizarItem(index, 'descricao', item.descricao)
    atualizarItem(index, 'unidade', item.unidade)
    atualizarItem(index, 'valor_unitario', item.valor)

    setSugestoes(prev => ({
      ...prev,
      [index]: []
    }))
  }

  function adicionarItem() {
    setItens([
      ...itens,
      {
        categoria: 'Serviços',
        codigo: '',
        descricao: '',
        unidade: 'm²',
        quantidade: 1,
        valor_unitario: 0
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

  function calcularTotal() {
    return itens.reduce((acc, item) => acc + item.quantidade * item.valor_unitario, 0)
  }

  function totalCategoria(cat: string) {
    return itens
      .filter(i => i.categoria === cat)
      .reduce((acc, i) => acc + i.quantidade * i.valor_unitario, 0)
  }

  async function salvar() {
    const empresa_id = localStorage.getItem('empresa_id')
    const total = calcularTotal()

    await supabase.from('orcamentos').update({
      cliente_nome: clienteNome,
      cliente_whatsapp: whatsapp,
      cliente_email: email,
      descricao,
      memorial,
      valor_total: total
    }).eq('id', id)

    await supabase.from('orcamento_itens').delete().eq('orcamento_id', id)

    const itensFormatados = itens.map(item => ({
      orcamento_id: id,
      descricao: item.descricao,
      quantidade: item.quantidade,
      valor_unitario: item.valor_unitario,
      valor_total: item.quantidade * item.valor_unitario,
      categoria: item.categoria,
      codigo: item.codigo,
      unidade: item.unidade
    }))

    await supabase.from('orcamento_itens').insert(itensFormatados)

    await supabase.from('itens_base').insert(
      itens.map(item => ({
        empresa_id,
        descricao: item.descricao,
        unidade: item.unidade,
        valor: item.valor_unitario
      }))
    )

    alert('Orçamento atualizado!')
    router.push('/orcamentos')
  }

  function gerarPDF() {
    const tabela = itens.map(i => `
      <tr>
        <td>${i.codigo}</td>
        <td>${i.descricao}</td>
        <td>${i.unidade}</td>
        <td>${i.quantidade}</td>
        <td>R$ ${i.valor_unitario}</td>
        <td>R$ ${(i.quantidade * i.valor_unitario).toFixed(2)}</td>
      </tr>
    `).join('')

    const conteudo = `
      <style>
        body { font-family: Inter, Arial; padding: 20px }
        table { width: 100%; border-collapse: collapse; margin-top: 20px }
        th, td { border: 1px solid #ddd; padding: 8px }
        th { background: #e2e8f0 }
      </style>

      <h1>ORÇAMENTO</h1>
      <p><strong>Cliente:</strong> ${clienteNome}</p>

      <h3>Descrição</h3>
      <p>${descricao}</p>

      <table>
        <tr>
          <th>Código</th>
          <th>Descrição</th>
          <th>Un</th>
          <th>Qtd</th>
          <th>Valor</th>
          <th>Total</th>
        </tr>
        ${tabela}
      </table>

      <h2>Total: R$ ${calcularTotal().toFixed(2)}</h2>

      <h3>Memorial</h3>
      <p>${memorial}</p>
    `

    const win = window.open('', '', 'width=900,height=700')
    win?.document.write(conteudo)
    win?.document.close()
    win?.print()
  }

  if (carregando) return <p>Carregando...</p>

  const categorias = [...new Set(itens.map(i => i.categoria))]
  const total = calcularTotal()

  return (
    <div style={container}>
      <h1 style={titulo}>📊 Editar Orçamento Profissional</h1>

      <div style={card}>
        <h3>Dados do Cliente</h3>
        <div style={grid}>
          <input value={clienteNome} onChange={e => setClienteNome(e.target.value)} style={input}/>
          <input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} style={input}/>
          <input value={email} onChange={e => setEmail(e.target.value)} style={input}/>
        </div>
      </div>

      <div style={card}>
        <h3>Descrição</h3>
        <textarea value={descricao} onChange={e => setDescricao(e.target.value)} style={textarea}/>
      </div>

      {categorias.map(cat => (
        <div key={cat} style={card}>
          <h3>{cat}</h3>

          <div style={header}>
            <span>Cód</span>
            <span>Descrição</span>
            <span>Un</span>
            <span>Qtd</span>
            <span>Valor</span>
            <span>Total</span>
            <span></span>
          </div>

          {itens.filter(i => i.categoria === cat).map((item, index) => (
            <div key={index} style={linha(index)}>
              <input value={item.codigo} onChange={e => atualizarItem(index,'codigo',e.target.value)} style={inputPeq}/>

              <div style={{ position: 'relative' }}>
                <input
                  value={item.descricao}
                  onChange={e => {
                    atualizarItem(index,'descricao',e.target.value)
                    buscarSugestoes(e.target.value,index)
                  }}
                  style={input}
                />

                {sugestoes[index]?.length > 0 && (
                  <div style={dropdown}>
                    {sugestoes[index].map((s:any,i:number)=>(
                      <div key={i} style={itemDropdown} onClick={()=>selecionarItem(s,index)}>
                        <strong>{s.descricao}</strong> — R$ {s.valor}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <input value={item.unidade} onChange={e=>atualizarItem(index,'unidade',e.target.value)} style={inputPeq}/>
              <input type="number" value={item.quantidade} onChange={e=>atualizarItem(index,'quantidade',Number(e.target.value))} style={inputPeq}/>
              <input type="number" value={item.valor_unitario} onChange={e=>atualizarItem(index,'valor_unitario',Number(e.target.value))} style={inputPeq}/>

              <strong style={{color:'#020617'}}>R$ {(item.quantidade * item.valor_unitario).toFixed(2)}</strong>
              <button onClick={()=>removerItem(index)} style={btnRemover}>X</button>
            </div>
          ))}

          <div style={subtotal}>
            Subtotal: R$ {totalCategoria(cat).toFixed(2)}
          </div>
        </div>
      ))}

      <button onClick={adicionarItem} style={btnAdd}>+ Item</button>

      <div style={card}>
        <h3>Memorial</h3>
        <textarea value={memorial} onChange={e => setMemorial(e.target.value)} style={textarea}/>
      </div>

      <div style={totalBox}>💰 R$ {total.toFixed(2)}</div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={salvar} style={btnSalvar}>Salvar</button>
        <button onClick={gerarPDF} style={btnPDF}>Gerar PDF</button>
      </div>
    </div>
  )
}

/* ESTILO */

const container = { maxWidth:1100, margin:'0 auto', padding:24, fontFamily:'Inter, system-ui', background:'#f8fafc', minHeight:'100vh' }
const titulo = { fontSize:28, fontWeight:700, color:'#0f172a' }
const card = { background:'#fff', padding:20, borderRadius:12, marginBottom:20, boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }
const grid = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }

const header = { display:'grid', gridTemplateColumns:'80px 2fr 80px 80px 100px 120px 50px', background:'#e2e8f0', padding:10, borderRadius:8, color:'#020617', fontWeight:600 }

const linha = (i:number)=>({
  display:'grid',
  gridTemplateColumns:'80px 2fr 80px 80px 100px 120px 50px',
  gap:8,
  marginTop:8,
  padding:8,
  borderRadius:8,
  background: i%2===0 ? '#fff' : '#f1f5f9',
  color:'#020617',
  alignItems:'center'
})

const input = { padding:10, border:'1px solid #cbd5e1', borderRadius:6, color:'#020617' }
const inputPeq = input
const textarea = { width:'100%', height:120, padding:10, border:'1px solid #cbd5e1', borderRadius:6, color:'#020617' }

const subtotal = { textAlign:'right', marginTop:10, fontWeight:600 }
const totalBox = { fontSize:24, color:'#16a34a', fontWeight:700, marginTop:20 }

const btnAdd = { background:'#22c55e', color:'#fff', padding:10, borderRadius:6 }
const btnRemover = { background:'#ef4444', color:'#fff', padding:6, borderRadius:6 }
const btnSalvar = { background:'#2563eb', color:'#fff', padding:12, borderRadius:8 }
const btnPDF = { background:'#111827', color:'#fff', padding:12, borderRadius:8 }

const dropdown = { position:'absolute', top:'100%', left:0, right:0, background:'#fff', border:'1px solid #ddd', borderRadius:8, zIndex:10 }
const itemDropdown = { padding:10, cursor:'pointer' }