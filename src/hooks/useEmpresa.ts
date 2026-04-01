'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Empresa = {
  id: string
  plano: 'free' | 'pro' | 'premium'
  status: string
}

type Limites = {
  orcamentos: number
  obras: number
}

export function useEmpresa() {

  const [empresaId, setEmpresaId] = useState<string | null>(null)
  const [plano, setPlano] = useState<'free' | 'pro' | 'premium'>('free')
  const [limites, setLimites] = useState<Limites>({
    orcamentos: 5,
    obras: 3
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    carregar()
  }, [])

  async function carregar() {

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    // 🔹 BUSCA EMPRESA DO USUÁRIO
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('empresa_id')
      .eq('user_id', user.id)
      .single()

    if (!usuario?.empresa_id) {
      setLoading(false)
      return
    }

    setEmpresaId(usuario.empresa_id)

    // 🔹 BUSCA DADOS DA EMPRESA
    const { data: empresa } = await supabase
      .from('empresas')
      .select('*')
      .eq('id', usuario.empresa_id)
      .single()

    if (!empresa) {
      setLoading(false)
      return
    }

    setPlano(empresa.plano || 'free')

    // 🔥 DEFINE LIMITES DINÂMICOS
    if (empresa.plano === 'free') {
      setLimites({
        orcamentos: 5,
        obras: 3
      })
    }

    if (empresa.plano === 'pro') {
      setLimites({
        orcamentos: Infinity,
        obras: Infinity
      })
    }

    if (empresa.plano === 'premium') {
      setLimites({
        orcamentos: Infinity,
        obras: Infinity
      })
    }

    setLoading(false)
  }

  return {
    empresaId,
    plano,
    limites,
    loading
  }
}