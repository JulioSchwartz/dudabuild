'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Financeiro() {

  const [dados, setDados] = useState<any[]>([])
  const [obras, setObras] = useState<any[]>([]) // ✅ PASSO 3.1

  useEffect(() => {
    carregar()
  }, [])

  // ✅ PASSO 2 (já estava certo)
  function calcularLucroPorObra(obraId: string) {

    const entradas = dados.filter(
      d => d.obra_id === obraId && d.tipo === 'entrada'
    )

    const saidas = dados.filter(
      d => d.obra_id === obraId && d.tipo === 'saida'
    )

    const totalEntrada = entradas.reduce((acc, d) => acc + d.valor, 0)
    const totalSaida = saidas.reduce((acc, d) => acc + d.valor, 0)

    return totalEntrada - totalSaida
  }

  async function carregar() {

    const { data } = await supabase.from('financeiro').select('*')
    setDados(data || [])

    // ✅ PASSO 3.2
    const { data: ob } = await supabase.from('obras').select('*')
    setObras(ob || [])
  }

  const entradas = dados.filter(d => d.tipo === 'entrada')
  const saidas = dados.filter(d => d.tipo === 'saida')

  const totalEntrada = entradas.reduce((acc, d) => acc + d.valor, 0)
  const totalSaida = saidas.reduce((acc, d) => acc + d.valor, 0)

  const lucro = totalEntrada - totalSaida

  return (
    <div style={{ padding: 24 }}>

      <h1>💰 Financeiro</h1>

      <div style={grid}>

        <Card titulo="Entradas" valor={format(totalEntrada)} cor="#16a34a" />
        <Card titulo="Saídas" valor={format(totalSaida)} cor="#dc2626" />
        <Card titulo="Lucro" valor={format(lucro)} cor="#2563eb" />

      </div>

      <table style={tabela}>
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Descrição</th>
            <th>Valor</th>
            <th>Data</th>
          </tr>
        </thead>

        <tbody>
          {dados.map(d => (
            <tr key={d.id}>
              <td>{d.tipo}</td>
              <td>{d.descricao}</td>
              <td>{format(d.valor)}</td>
              <td>{new Date(d.data).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ✅ PASSO 3 FINAL */}
      <div style={{ marginTop: 30 }}>
        <h2>🏗️ Lucro por Obra</h2>

        {obras.map(o => (
          <div key={o.id} style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 10,
            padding: 10,
            background: '#fff',
            borderRadius: 8
          }}>

            <span>{o.nome}</span>

            <strong style={{
              color: calcularLucroPorObra(o.id) < 0 ? 'red' : 'green'
            }}>
              {format(calcularLucroPorObra(o.id))}
            </strong>

          </div>
        ))}
      </div>

    </div>
  )
}

/* COMPONENTES */

function Card({ titulo, valor, cor }: any) {
  return (
    <div style={{ ...card, borderLeft: `6px solid ${cor}` }}>
      <h4>{titulo}</h4>
      <h2>{valor}</h2>
    </div>
  )
}

/* ESTILO */

const grid = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr 1fr',
  gap: 20,
  marginBottom: 20
}

const card = {
  background: '#fff',
  padding: 20,
  borderRadius: 10
}

const tabela = {
  width: '100%',
  marginTop: 20
}

function format(valor: number) {
  return valor?.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  })
}