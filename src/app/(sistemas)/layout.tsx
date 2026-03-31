'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function SistemaLayout({ children }: any) {

  const router = useRouter()
  const pathname = usePathname()
  const [liberado, setLiberado] = useState(false)

  useEffect(() => {
    verificar()
  }, [pathname])

  async function verificar() {

    // 🔥 ROTAS LIBERADAS (SEM LOGIN)
    const rotasPublicas = ['/login', '/cadastro']

    if (rotasPublicas.includes(pathname)) {
      setLiberado(true)
      return
    }

    // 🔥 VERIFICA LOGIN
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    // 🔥 BUSCA EMPRESA
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('empresa_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!usuario?.empresa_id) {
      router.push('/login')
      return
    }

    // 🔥 VALIDA STATUS
    const { data: empresa } = await supabase
      .from('empresas')
      .select('status')
      .eq('id', usuario.empresa_id)
      .maybeSingle()

    if (empresa?.status !== 'ativo') {
      router.push('/bloqueado')
      return
    }

    setLiberado(true)
  }

  if (!liberado) return null

  return children
}