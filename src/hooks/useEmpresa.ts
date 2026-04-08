'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type Limites = {
  orcamentos: number
  obras: number
}

export function useEmpresa() {
  const [empresaId, setEmpresaId] = useState<string | null>(null)
  const [plano, setPlano] = useState<'basico' | 'pro' | 'premium'>('basico')
  const [status, setStatus] = useState<'active' | 'past_due' | 'canceled' | 'incomplete'>('incomplete')
  const [limites, setLimites] = useState<Limites>({
    orcamentos: 5,
    obras: 2
  })
  const [loading, setLoading] = useState(true)
  const [bloqueado, setBloqueado] = useState(false)

  useEffect(() => {
    let mounted = true

    carregar()

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

      if (userError || !user) {
        limparEstado()
        return
      }

      // 🔎 usuário
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

      // 🔎 empresa
      const { data: empresa, error: empresaError } = await supabase
        .from('empresas')
        .select('plano, status')
        .eq('id', usuario.empresa_id)
        .maybeSingle()

      if (empresaError || !empresa) {
        limparEstado()
        return
      }

      const planoAtual = empresa.plano || 'basico'
      const statusAtual = empresa.status || 'incomplete'

      setPlano(planoAtual)
      setStatus(statusAtual)

      // 🔒 BLOQUEIO AUTOMÁTICO
      if (statusAtual !== 'active') {
        setBloqueado(true)
      } else {
        setBloqueado(false)
      }

      // 📊 LIMITES
      if (planoAtual === 'basico') {
        setLimites({ orcamentos: 5, obras: 2 })
      } else if (planoAtual === 'pro') {
        setLimites({ orcamentos: 10, obras: 5 })
      } else if (planoAtual === 'premium') {
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
    setPlano('basico')
    setStatus('incomplete')
    setBloqueado(true)
    setLimites({ orcamentos: 5, obras: 2 })
  }

  return {
    empresaId,
    plano,
    status,
    limites,
    loading,
    bloqueado
  }
}