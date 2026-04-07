'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useEmpresa } from '@/hooks/useEmpresa'

export default function Obras() {

  const { empresaId, limites, loading: loadingEmpresa } = useEmpresa()
  const router = useRouter()

  const [obras, setObras] = useState<any[]>([])
  const [financeiro, setFinanceiro] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!empresaId) return
    carregar()
  }, [empresaId])

  async function carregar() {

    try {

      const { data: obrasData, error: errObras } = await supabase
        .from('obras')
        .select('*')
        .eq('empresa_id', Number(empresaId)) // 🔥 CORREÇÃO

      if (errObras) throw errObras

      const { data: finData, error: errFin } = await supabase
        .from('financeiro')
        .select('*')
        .eq('empresa_id', Number(empresaId)) // 🔥 CORREÇÃO

      if (errFin) throw errFin

      setObras(obrasData || [])
      setFinanceiro(finData || [])

    } catch (err) {
      console.error('Erro obras:', err)
      alert('Erro ao carregar obras')
    } finally {
      setLoading(false) // 🔥 evita travamento
    }
  }

  function calcularLucro(obraId:number){

    const itens = financeiro.filter(f => f.obra_id === obraId)

    const entrada = itens
      .filter(i => i.tipo === 'entrada')
      .reduce((a,b)=>a + Number(b.valor || 0), 0)

    const saida = itens
      .filter(i => i.tipo === 'saida')
      .reduce((a,b)=>a + Number(b.valor || 0), 0)

    return entrada - saida
  }

  if (loadingEmpresa || loading) return <p>Carregando...</p>

  return (
    <div style={{ padding:24 }}>

      <div style={header}>
        <h1>🏗️ Obras</h1>

        <button style={btnNova} onClick={()=>router.push('/obras/nova')}>
          + Nova Obra
        </button>
      </div>

      <div style={grid}>
        {obras.map((obra)=>{

          const lucro = calcularLucro(obra.id)

          return (
            <div key={obra.id} style={card(lucro)}>

              <h3>{obra.nome}</h3>
              <p style={{ color:'#64748b' }}>{obra.cliente}</p>

              <p style={valor}>
                💰 {format(Number(obra.valor || 0))}
              </p>

              <p style={{
                color: lucro >= 0 ? '#16a34a' : '#dc2626',
                fontWeight:600
              }}>
                {lucro >= 0 ? 'Lucro' : 'Prejuízo'}: {format(lucro)}
              </p>

              <div style={botoes}>
                <Link href={`/obras/${obra.id}`}>
                  <button style={btnVer}>Ver</button>
                </Link>

                <button onClick={()=>excluir(obra.id)} style={btnExcluir}>
                  Excluir
                </button>
              </div>

            </div>
          )
        })}
      </div>

    </div>
  )

  async function excluir(id:number){

    if (!confirm('Excluir obra?')) return

    try {

      await supabase.from('financeiro').delete().eq('obra_id', id)
      await supabase.from('obras').delete().eq('id', id)

      carregar()

    } catch (err) {
      console.error('Erro ao excluir:', err)
      alert('Erro ao excluir obra')
    }
  }
}

/* HELPERS */

function format(v:number){
  return Number(v || 0).toLocaleString('pt-BR',{
    style:'currency',
    currency:'BRL'
  })
}

/* UI */

const header = {
  display:'flex',
  justifyContent:'space-between',
  marginBottom:20
}

const grid = {
  display:'grid',
  gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',
  gap:16
}

const card = (lucro:number)=>({
  background: lucro >= 0 ? '#ecfdf5' : '#fee2e2',
  padding:20,
  borderRadius:12,
  border:`1px solid ${lucro >= 0 ? '#16a34a' : '#dc2626'}`,
  boxShadow:'0 4px 12px rgba(0,0,0,0.05)'
})

const valor = {
  fontWeight:600,
  marginTop:6
}

const botoes = {
  marginTop:10,
  display:'flex',
  gap:10
}

const btnNova = {
  background:'#2563eb',
  color:'#fff',
  padding:'10px 14px',
  borderRadius:8,
  border:'none'
}

const btnVer = {
  background:'#22c55e',
  color:'#fff',
  border:'none',
  padding:'8px 12px',
  borderRadius:6
}

const btnExcluir = {
  background:'#ef4444',
  color:'#fff',
  border:'none',
  padding:'8px 12px',
  borderRadius:6
}