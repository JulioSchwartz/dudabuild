'use client'
 
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
 
export type PlanoTipo = 'basico' | 'pro' | 'premium'
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
 
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      if (mounted) carregar(mounted)
    })
 
    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])
 
  async function carregar(mounted = true) {
    try {
      setLoading(true)
 
      const { data: { user }, error: userError } = await supabase.auth.getUser()
 
      if (userError || !user) {
        if (mounted) limparEstado()
        return
      }
 
      const { data: usuario, error: usuarioError } = await supabase
        .from('usuarios')
        .select('empresa_id, nome')
        .eq('user_id', user.id)
        .maybeSingle()
 
      if (usuarioError || !usuario?.empresa_id) {
        if (mounted) limparEstado()
        return
      }
 
      const { data: empresa, error: empresaError } = await supabase
        .from('empresas')
        .select('plano, status, nome')
        .eq('id', usuario.empresa_id)
        .maybeSingle()
 
      if (empresaError || !empresa) {
        if (mounted) limparEstado()
        return
      }
 
      if (!mounted) return
 
      const planoAtual  = (empresa.plano  || 'basico')  as PlanoTipo
      const statusAtual = (empresa.status || 'incomplete') as StatusTipo
 
      setEmpresaId(usuario.empresa_id)
      setPlano(planoAtual)
      setStatus(statusAtual)
      setLimites(LIMITES_POR_PLANO[planoAtual] ?? LIMITES_POR_PLANO.basico)
      setNomeUsuario(usuario.nome || user.email || 'Usuário')
      setNomeEmpresa(empresa.nome || 'Minha Empresa')
 
      // 🔒 Bloqueado apenas se status explicitamente inativo
      // 'active' = liberado | qualquer outro = bloqueado
      setBloqueado(statusAtual !== 'active')
 
    } catch (err) {
      console.error('Erro ao carregar empresa:', err)
      // Não bloqueia em erro de rede — mantém estado anterior
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