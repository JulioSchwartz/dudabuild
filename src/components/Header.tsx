'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useEmpresa } from '@/hooks/useEmpresa'

export default function Header() {

  const { empresaId } = useEmpresa()
  const [financeiro, setFinanceiro] = useState<any[]>([])

  useEffect(() => {
    if (!empresaId) return

    supabase
      .from('financeiro')
      .select('*')
      .eq('empresa_id', empresaId)
      .then(({ data }) => setFinanceiro(data || []))
  }, [empresaId])

  const entrada = financeiro
    .filter(f => f.tipo === 'entrada')
    .reduce((a, b) => a + b.valor, 0)

  const saida = financeiro
    .filter(f => f.tipo === 'saida')
    .reduce((a, b) => a + b.valor, 0)

  const lucro = entrada - saida

  return (
    <div style={{
      background: '#fff',
      padding: 16,
      borderBottom: '1px solid #e2e8f0',
      display: 'flex',
      justifyContent: 'space-between'
    }}>
      <strong>Resumo</strong>

      <div style={{ display: 'flex', gap: 20 }}>
        <span>💰 {format(entrada)}</span>
        <span>💸 {format(saida)}</span>
        <span style={{ color: lucro < 0 ? '#dc2626' : '#16a34a' }}>
          📊 {format(lucro)}
        </span>
      </div>
    </div>
  )
}

function format(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}