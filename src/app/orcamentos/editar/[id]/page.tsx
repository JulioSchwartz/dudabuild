'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
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

export default function EditarOrcamento() {
  const { id } = useParams()
  const router = useRouter()

  const [carregando, setCarregando] = useState(true)

  const [clienteNome, setClienteNome] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [email, setEmail] = useState('')
  const [descricao, setDescricao] = useState('')

  // 🔥 EVOLUÇÃO (compatível com antigo)
  const [memorial, setMemorial] = useState<any>({
    materiais: '',
    metodos: '',
    marcas: '',
    observacoes: ''
  })

  const [condicoes, setCondicoes] = useState<any>({
    validade: '',
    pagamento: '',
    garantia: '',
    observacoes: ''
  })

  const [cronograma, setCronograma] = useState<any[]>([])

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

      // 🔥 compatibilidade com versão antiga (string) e nova (json)
      if (typeof data.memorial === 'string') {
        setMemorial({
          materiais: data.memorial,
          metodos: '',
          marcas: '',
          observacoes: ''
        })
      } else {
        setMemorial(data.memorial || {})
      }

      setCondicoes(data.condicoes || {})
      setCronograma(data.cronograma || [])
    }

    if (itensData) {
      setItens(itensData.map(i => ({
        id: i.id,
        categoria: i.categoria || 'Serviços',
        codigo: i.codigo || '',
        descricao: i.descricao,
        unidade: i.unidade || 'm²',
        quantidade: i.quantidade,
        valor_unitario: i.valor_unitario || 0,
        material: i.material || 0,
        mao_obra: i.mao_obra || 0,
        equipamentos: i.equipamentos || 0
      })))
    }

    setCarregando(false)
  }

  function totalItem(item: any) {
    const custo = (item.material + item.mao_obra + item.equipamentos)
    const base = custo > 0 ? custo : item.valor_unitario
    return base * item.quantidade
  }

  function calcularTotal() {
    return itens.reduce((acc, item) => acc + totalItem(item), 0)
  }

  function totalCategoria(cat: string) {
    return itens
      .filter(i => i.categoria === cat)
      .reduce((acc, i) => acc + totalItem(i), 0)
  }

  function cronogramaComValor() {
    const total = calcularTotal()
    return cronograma.map(c => ({
      ...c,
      valor: (c.percentual / 100) * total
    }))
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
      condicoes,
      cronograma,
      valor_total: total
    }).eq('id', id)

    await supabase.from('orcamento_itens').delete().eq('orcamento_id', id)

    const itensFormatados = itens.map(item => ({
      orcamento_id: id,
      descricao: item.descricao,
      quantidade: item.quantidade,
      valor_unitario: item.valor_unitario,
      valor_total: totalItem(item),
      categoria: item.categoria,
      codigo: item.codigo,
      unidade: item.unidade,
      material: item.material,
      mao_obra: item.mao_obra,
      equipamentos: item.equipamentos
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

    const cron = cronogramaComValor().map(c => `
      <tr>
        <td>${c.etapa}</td>
        <td>${c.dias}</td>
        <td>${c.percentual}%</td>
        <td>R$ ${c.valor.toFixed(2)}</td>
      </tr>
    `).join('')

    const tabela = itens.map(i => `
      <tr>
        <td>${i.codigo}</td>
        <td>${i.descricao}</td>
        <td>${i.unidade}</td>
        <td>${i.quantidade}</td>
        <td>${i.material}</td>
        <td>${i.mao_obra}</td>
        <td>${i.equipamentos}</td>
        <td>R$ ${totalItem(i).toFixed(2)}</td>
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
          <th>Material</th>
          <th>M.O</th>
          <th>Equip</th>
          <th>Total</th>
        </tr>
        ${tabela}
      </table>

      <h2>Total: R$ ${calcularTotal().toFixed(2)}</h2>

      <h3>Cronograma</h3>
      <table>
        <tr><th>Etapa</th><th>Dias</th><th>%</th><th>Valor</th></tr>
        ${cron}
      </table>

      <h3>Memorial</h3>
      <p><b>Materiais:</b> ${memorial.materiais}</p>
      <p><b>Métodos:</b> ${memorial.metodos}</p>
      <p><b>Marcas:</b> ${memorial.marcas}</p>
      <p><b>Obs:</b> ${memorial.observacoes}</p>

      <h3>Condições</h3>
      <p><b>Pagamento:</b> ${condicoes.pagamento}</p>
      <p><b>Validade:</b> ${condicoes.validade}</p>
      <p><b>Garantia:</b> ${condicoes.garantia}</p>
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
            <span>Material</span>
            <span>M.O</span>
            <span>Equip</span>
            <span>Total</span>
            <span></span>
          </div>

          {itens.filter(i => i.categoria === cat).map((item, index) => (
  <div key={index} style={linha(index)}>

    <input
      value={item.codigo}
      onChange={e => atualizarItem(index,'codigo',e.target.value)}
      style={inputPeq}
    />

    <input
      value={item.descricao}
      onChange={e => atualizarItem(index,'descricao',e.target.value)}
      style={input}
    />

    <input
      value={item.unidade}
      onChange={e=>atualizarItem(index,'unidade',e.target.value)}
      style={inputPeq}
    />

    <input
      type="number"
      value={item.quantidade}
      onChange={e => atualizarItem(index,'quantidade', Number(e.target.value))}
      style={inputPeq}
    />

    <input
      type="number"
      value={item.material}
      onChange={e => atualizarItem(index,'material', Number(e.target.value))}
      style={inputPeq}
    />

    <input
      type="number"
      value={item.mao_obra}
      onChange={e => atualizarItem(index,'mao_obra', Number(e.target.value))}
      style={inputPeq}
    />

    <input
      type="number"
      value={item.equipamentos}
      onChange={e => atualizarItem(index,'equipamentos', Number(e.target.value))}
      style={inputPeq}
    />

    <strong>R$ {totalItem(item).toFixed(2)}</strong>

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
        <h3>Memorial Descritivo</h3>
        <textarea placeholder="Materiais" value={memorial.materiais} onChange={e => setMemorial({...memorial, materiais:e.target.value})} style={textarea}/>
        <textarea placeholder="Métodos" value={memorial.metodos} onChange={e => setMemorial({...memorial, metodos:e.target.value})} style={textarea}/>
        <textarea placeholder="Marcas" value={memorial.marcas} onChange={e => setMemorial({...memorial, marcas:e.target.value})} style={textarea}/>
        <textarea placeholder="Observações" value={memorial.observacoes} onChange={e => setMemorial({...memorial, observacoes:e.target.value})} style={textarea}/>
      </div>

      <div style={card}>
        <h3>Condições Comerciais</h3>
        <textarea placeholder="Forma de pagamento" value={condicoes.pagamento} onChange={e => setCondicoes({...condicoes, pagamento:e.target.value})} style={textarea}/>
        <textarea placeholder="Validade" value={condicoes.validade} onChange={e => setCondicoes({...condicoes, validade:e.target.value})} style={textarea}/>
        <textarea placeholder="Garantia" value={condicoes.garantia} onChange={e => setCondicoes({...condicoes, garantia:e.target.value})} style={textarea}/>
        <textarea placeholder="Observações" value={condicoes.observacoes} onChange={e => setCondicoes({...condicoes, observacoes:e.target.value})} style={textarea}/>
      </div>

      <div style={totalBox}>💰 R$ {total.toFixed(2)}</div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={salvar} style={btnSalvar}>Salvar</button>
        <button onClick={gerarPDF} style={btnPDF}>Gerar PDF</button>
      </div>
    </div>
  )
}

/* estilos mantidos */
const container = { maxWidth:1100, margin:'0 auto', padding:24, fontFamily:'Inter, system-ui', background:'#f8fafc', minHeight:'100vh' }
const titulo = { fontSize:28, fontWeight:700, color:'#0f172a' }
const card = { background:'#fff', padding:20, borderRadius:12, marginBottom:20, boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }
const grid = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }
const header = { display:'grid', gridTemplateColumns:'80px 2fr 80px 80px 120px 120px 120px 120px 50px', background:'#e2e8f0', padding:10, borderRadius:8, color:'#020617', fontWeight:600 }
const linha = (i:number)=>({
  display:'grid',
  gridTemplateColumns:'80px 2fr 80px 80px 120px 120px 120px 120px 50px',
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
