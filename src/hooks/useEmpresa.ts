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
  pro:     { orcamentos: 10,       obras: 5        },
  premium: { orcamentos: Infinity, obras: Infinity },
}
 
export function useEmpresa() {
  const [empresaId,   setEmpresaId]   = useState<string | null>(null)
  const [plano,       setPlano]       = useState<PlanoTipo>('basico')
  const [status,      setStatus]      = useState<StatusTipo>('incomplete')
  const [limites,     setLimites]     = useState<Limites>(LIMITES_POR_PLANO.basico)
  const [nomeUsuario, setNomeUsuario] = useState('')
  const [nomeEmpresa, setNomeEmpresa] = useState('')
  const [loading,     setLoading]     = useState(true)
  const [bloqueado,   setBloqueado]   = useState(false)
 
  useEffect(() => {
    let mounted = true
 
    carregar(mounted)
 
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        if (session) {
          carregar(mounted)
        } else {
          limparEstado()
          setLoading(false)
        }
      }
    })
 
    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])
 
  async function carregar(mounted = true) {
    try {
      setLoading(true)
 
      // 1️⃣ Verifica sessão ativa
      const { data: { session } } = await supabase.auth.getSession()
 
      if (!session) {
        if (mounted) limparEstado()
        return
      }
 
      // 2️⃣ Usa RPC com SECURITY DEFINER — ignora RLS, sempre funciona
      const { data, error } = await supabase.rpc('get_dados_empresa')
 
      if (error || !data) {
        console.error('Erro RPC get_dados_empresa:', error)
        if (mounted) limparEstado()
        return
      }
 
      if (!mounted) return
 
      const planoAtual  = (data.plano  || 'basico')     as PlanoTipo
      const statusAtual = (data.status || 'incomplete') as StatusTipo
 
      setEmpresaId(data.empresa_id)
      setPlano(planoAtual)
      setStatus(statusAtual)
      setLimites(LIMITES_POR_PLANO[planoAtual] ?? LIMITES_POR_PLANO.basico)
      setNomeUsuario(data.nome_usuario || session.user.email || 'Usuário')
      setNomeEmpresa(data.nome_empresa || 'Minha Empresa')
      // Bloqueia apenas se cancelado ou inadimplente — 'incomplete' é trial/novo usuário
      setBloqueado(statusAtual === 'canceled' || statusAtual === 'past_due')
 
    } catch (err) {
      console.error('Erro ao carregar empresa:', err)
    } finally {
      if (mounted) setLoading(false)
    }
  }
 
  function limparEstado() {
    setEmpresaId(null)
    setPlano('basico')
    setStatus('incomplete')
    setBloqueado(true)
    setLimites(LIMITES_POR_PLANO.basico)
    setNomeUsuario('')
    setNomeEmpresa('')
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
  }
}