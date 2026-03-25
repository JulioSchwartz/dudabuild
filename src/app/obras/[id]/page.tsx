'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { opcoesFinanceiro } from '@/lib/financeiro'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export default function DetalheObra() {
  const { id } = useParams()
  const router = useRouter()

  const [obra, setObra] = useState<any>(null)
  const [financeiro, setFinanceiro] = useState<any[]>([])

  const [editando, setEditando] = useState(false)
  const [nome, setNome] = useState('')
  const [cliente, setCliente] = useState('')
  const [valorObra, setValorObra] = useState('')

  const [tipo, setTipo] = useState('entrada')
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')

  useEffect(() => {
    const empresa = localStorage.getItem('empresa_id')

    if (!empresa) {
      router.push('/login')
    } else {
      carregar()
    }
  }, [])

  async function carregar() {
    const empresa_id = localStorage.getItem('empresa_id')

    const { data: obraData } = await supabase
      .from('obras')
      .select('*')
      .eq('id', id)
      .eq('empresa_id', empresa_id)
      .single()

    const { data: financeiroData } = await supabase
      .from('financeiro')
      .select('*')
      .eq('obra_id', id)
      .eq('empresa_id', empresa_id)

    setObra(obraData)
    setFinanceiro(financeiroData || [])

    if (obraData) {
      setNome(obraData.nome)
      setCliente(obraData.cliente)
      setValorObra(obraData.valor)
    }
  }

  async function salvarEdicao() {
    const empresa_id = localStorage.getItem('empresa_id')

    await supabase
      .from('obras')
      .update({
        nome,
        cliente,
        valor: Number(valorObra),
        empresa_id,
      })
      .eq('id', id)

    setEditando(false)
    carregar()
  }

  async function adicionar(e: any) {
    e.preventDefault()

    const empresa_id = localStorage.getItem('empresa_id')

    if (!descricao) {
      alert('Selecione uma descrição')
      return
    }

    if (!valor || Number(valor) <= 0) {
      alert('Informe um valor válido')
      return
    }

    await supabase.from('financeiro').insert([
      {
        obra_id: id,
        tipo,
        descricao,
        valor: Number(valor),
        empresa_id,
      },
    ])

    setDescricao('')
    setValor('')
    carregar()
  }

  async function excluirLancamento(idLancamento: number) {
    const confirmar = confirm('Deseja excluir este lançamento?')
    if (!confirmar) return

    await supabase.from('financeiro').delete().eq('id', idLancamento)
    carregar()
  }

  if (!obra) return <p>Carregando...</p>

  const entradas = financeiro.filter((f) => f.tipo === 'entrada')
  const saidas = financeiro.filter((f) => f.tipo === 'saida')

  const totalEntradas = entradas.reduce((acc, e) => acc + Number(e.valor), 0)
  const totalSaidas = saidas.reduce((acc, s) => acc + Number(s.valor), 0)

  const lucro = totalEntradas - totalSaidas
  const margem = totalEntradas > 0 ? (lucro / totalEntradas) * 100 : 0

  const categorias: any = {}

  saidas.forEach((s) => {
    if (!categorias[s.descricao]) categorias[s.descricao] = 0
    categorias[s.descricao] += Number(s.valor)
  })

  const dadosGrafico = Object.entries(categorias).map(([nome, valor]) => ({
    name: nome,
    value: Number(valor),
  }))

  return (
    <div>
      {/* HEADER */}
      {editando ? (
        <div style={box}>
          <input value={nome} onChange={(e) => setNome(e.target.value)} style={input} />
          <input value={cliente} onChange={(e) => setCliente(e.target.value)} style={input} />
          <input value={valorObra} onChange={(e) => setValorObra(e.target.value)} style={input} />

          <button onClick={salvarEdicao} style={btnSalvar}>Salvar</button>
        </div>
      ) : (
        <div style={{ marginBottom: '20px' }}>
          <h1 style={titulo}>{obra.nome}</h1>
          <p style={subtitulo}>{obra.cliente}</p>
          <button onClick={() => setEditando(true)} style={btnEditar}>Editar</button>
        </div>
      )}

      {/* DASHBOARD */}
      <div style={grid}>
        <Card titulo="Receita" valor={totalEntradas} cor="#22c55e" />
        <Card titulo="Custos" valor={totalSaidas} cor="#ef4444" />
        <Card titulo="Lucro" valor={lucro} cor="#3b82f6" />
        <Card titulo="Margem" valor={margem} cor="#a855f7" tipo="porcentagem" />
      </div>

      {/* FORM */}
      <h3 style={sectionTitle}>Adicionar lançamento</h3>

      <form onSubmit={adicionar} style={box}>
        <select value={tipo} onChange={(e) => setTipo(e.target.value)} style={input}>
          <option value="entrada">Entrada</option>
          <option value="saida">Saída</option>
        </select>

        <select value={descricao} onChange={(e) => setDescricao(e.target.value)} style={input}>
          <option value="">Selecione...</option>

          {(tipo === 'entrada'
            ? opcoesFinanceiro.entrada
            : opcoesFinanceiro.saida
          ).map((item, i) => (
            <option key={i}>{item}</option>
          ))}
        </select>

        <input
          type="number"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          style={input}
        />

        <button style={btnAdicionar}>Adicionar</button>
      </form>

      {/* GRÁFICO */}
      <h2 style={sectionTitle}>Gráfico de custos</h2>

      <div style={box}>
        <div style={{ height: 300 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie data={dadosGrafico} dataKey="value" nameKey="name" outerRadius={100}>
                {dadosGrafico.map((_, i) => (
                  <Cell key={i} fill={cores[i % cores.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CATEGORIAS */}
      <h2 style={sectionTitle}>Custos por categoria</h2>

      <div style={box}>
        {Object.entries(categorias).map(([nome, valor]: any) => (
          <div key={nome} style={linha}>
            <span>{nome}</span>
            <strong>
              {Number(valor).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </strong>
          </div>
        ))}
      </div>

      {/* LANÇAMENTOS */}
      <h3 style={sectionTitle}>Lançamentos</h3>

      <div style={box}>
        {financeiro.map((item) => (
          <div key={item.id} style={linha}>
            <div>
              <strong>{item.tipo === 'entrada' ? 'Entrada' : 'Saída'}</strong> - {item.descricao}
              <br />
              {Number(item.valor).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </div>

            <button onClick={() => excluirLancamento(item.id)} style={btnExcluir}>
              Excluir
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function Card({ titulo, valor, cor, tipo }: any) {
  return (
    <div style={{ ...card, borderLeft: `6px solid ${cor}` }}>
      <p style={{ color: '#64748b' }}>{titulo}</p>
      <h2 style={{ color: '#0f172a' }}>
        {tipo === 'porcentagem'
          ? valor.toFixed(2) + '%'
          : Number(valor).toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
      </h2>
    </div>
  )
}

/* 🎨 ESTILO PROFISSIONAL */

const titulo = {
  color: '#0f172a',
}

const subtitulo = {
  color: '#64748b',
}

const sectionTitle = {
  marginTop: '30px',
  marginBottom: '10px',
  color: '#0f172a',
}

const grid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '20px',
  marginTop: '20px',
}

const card = {
  background: '#ffffff',
  padding: '20px',
  borderRadius: '12px',
  boxShadow: '0 6px 20px rgba(0,0,0,0.05)',
}

const box = {
  background: '#ffffff',
  padding: '20px',
  borderRadius: '12px',
  marginTop: '10px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
}

const linha = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: '10px',
  color: '#1e293b',
}

const input = {
  display: 'block',
  marginBottom: '10px',
  padding: '10px',
  width: '100%',
  borderRadius: '6px',
  border: '1px solid #cbd5f5',
}

const btnAdicionar = {
  background: '#2563eb',
  color: '#fff',
  padding: '10px',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
}

const btnEditar = {
  background: '#f59e0b',
  color: '#fff',
  padding: '8px',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
}

const btnSalvar = {
  background: '#22c55e',
  color: '#fff',
  padding: '10px',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
}

const btnExcluir = {
  background: '#ef4444',
  color: '#fff',
  border: 'none',
  padding: '6px 10px',
  borderRadius: '6px',
  cursor: 'pointer',
}

const cores = ['#22c55e', '#ef4444', '#3b82f6', '#f59e0b', '#a855f7']