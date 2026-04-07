'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

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
    let mounted = true

    carregar()

    // 🔥 ESCUTA LOGIN / LOGOUT (ESSENCIAL)
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      if (mounted) carregar()
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  async function carregar() {
    try {
      setLoading(true)

      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser()

      // 🔐 SEM USUÁRIO → LIMPA TUDO
      if (userError || !user) {
        limparEstado()
        return
      }

      // 🔹 BUSCA EMPRESA DO USUÁRIO
      const { data: usuario, error: usuarioError } = await supabase
        .from('usuarios')
        .select('empresa_id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (usuarioError || !usuario?.empresa_id) {
        limparEstado()
        return
      }

      setEmpresaId(usuario.empresa_id)

      // 🔹 BUSCA EMPRESA
      const { data: empresa, error: empresaError } = await supabase
        .from('empresas')
        .select('plano')
        .eq('id', usuario.empresa_id)
        .maybeSingle()

      if (empresaError || !empresa) {
        limparEstado()
        return
      }

      const planoAtual = empresa.plano || 'free'
      setPlano(planoAtual)

      // 🔥 LIMITES BASEADOS NO PLANO
      if (planoAtual === 'free') {
        setLimites({ orcamentos: 5, obras: 3 })
      } else if (planoAtual === 'pro') {
        setLimites({ orcamentos: 50, obras: 20 })
      } else {
        setLimites({ orcamentos: Infinity, obras: Infinity })
      }

    } catch (err) {
      console.error('Erro ao carregar empresa:', err)
      limparEstado()
    } finally {
      setLoading(false)
    }
  }

  function limparEstado() {
    setEmpresaId(null)
    setPlano('free')
    setLimites({ orcamentos: 5, obras: 3 })
  }

  return {
    empresaId,
    plano,
    limites,
    loading
  }
}