'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export type PlanoTipo  = 'basico' | 'pro' | 'premium'
export type StatusTipo = 'active' | 'past_due' | 'canceled' | 'incomplete'

type Limites = {
  orcamentos: number
  obras: number
}

const LIMITES_POR_PLANO: Record<PlanoTipo, Limites> = {
  basico:  { orcamentos: 5,        obras: 2        },
  pro:     { orcamentos: 15,       obras: 5        },
  premium: { orcamentos: Infinity, obras: Infinity },
}

export function useEmpresa() {
  const [empresaId,     setEmpresaId]     = useState<string | null>(null)
  const [plano,         setPlano]         = useState<PlanoTipo>('basico')
  const [status,        setStatus]        = useState<StatusTipo>('incomplete')
  const [limites,       setLimites]       = useState<Limites>(LIMITES_POR_PLANO.basico)
  const [nomeUsuario,   setNomeUsuario]   = useState('')
  const [nomeEmpresa,   setNomeEmpresa]   = useState('')
  const [loading,       setLoading]       = useState(true)
  const [bloqueado,     setBloqueado]     = useState(false)
  const [diasRestantes, setDiasRestantes] = useState<number | null>(null)
  const [trialExpirado, setTrialExpirado] = useState(false)

  useEffect(() => {
    let mounted = true
    carregar(mounted)

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        if (session) carregar(mounted)
        else { limparEstado(false); setLoading(false) }
      }
    })

    return () => { mounted = false; listener.subscription.unsubscribe() }
  }, [])

  async function carregar(mounted = true) {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { if (mounted) limparEstado(false); return }

      const { data, error } = await supabase.rpc('get_dados_empresa')
      if (error || !data) { console.error('Erro RPC:', error); if (mounted) limparEstado(false); return }
      if (!mounted) return

      const planoAtual  = (data.plano  || 'basico')     as PlanoTipo
      const statusAtual = (data.status || 'incomplete') as StatusTipo

      // Calcula dias restantes do trial direto da RPC
      const trialDate  = data.trial_expira_em ? new Date(data.trial_expira_em) : null
      const agora      = new Date()
      const expirado   = trialDate ? agora > trialDate : false
      const dias       = trialDate
        ? Math.max(0, Math.ceil((trialDate.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24)))
        : null

      setEmpresaId(data.empresa_id)
      setPlano(planoAtual)
      setStatus(statusAtual)
      setLimites(LIMITES_POR_PLANO[planoAtual] ?? LIMITES_POR_PLANO.basico)
      setNomeUsuario(data.nome_usuario || session.user.email || 'Usuário')
      setNomeEmpresa(data.nome_empresa || 'Minha Empresa')

      const ehTrial = statusAtual === 'incomplete'

      setDiasRestantes(ehTrial ? dias : null)
      setTrialExpirado(ehTrial ? expirado : false)

      // Bloqueia se cancelado, inadimplente, ou trial expirado sem plano pago
      const trialExpiradoSemPlano = expirado && statusAtual === 'incomplete'
      setBloqueado(
        statusAtual === 'canceled' ||
        statusAtual === 'past_due' ||
        trialExpiradoSemPlano
      )

    } catch (err) {
      console.error('Erro ao carregar empresa:', err)
    } finally {
      if (mounted) setLoading(false)
    }
  }

  function limparEstado(bloquear = false) {
    setEmpresaId(null)
    setPlano('basico')
    setStatus('incomplete')
    setBloqueado(bloquear)
    setLimites(LIMITES_POR_PLANO.basico)
    setNomeUsuario('')
    setNomeEmpresa('')
    setDiasRestantes(null)
    setTrialExpirado(false)
  }

  return {
    empresaId,
    plano,
    status,
    limites,
    nomeUsuario,
    nomeEmpresa,
    loading,
    bloqueado,
    diasRestantes,
    trialExpirado,
  }
}