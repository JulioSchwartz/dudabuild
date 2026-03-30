'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function SistemaLayout({ children }: any) {

  const router = useRouter()
  const [liberado, setLiberado] = useState(false)

  useEffect(() => {
    verificar()
  }, [])

  async function verificar() {

    // 🔥 PEGA USUÁRIO LOGADO
    const { data: { user } } = await supabase.auth.getUser()

    console.log('USER:', user)

    if (!user) {
      router.push('/login')
      return
    }

    // 🔥 PEGA EMPRESA DO USUÁRIO
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('empresa_id')
      .eq('user_id', user.id)
      .single()

    console.log('USUARIO:', usuario)

    if (!usuario?.empresa_id) {
      router.push('/login')
      return
    }

    // 🔥 VALIDA STATUS
    const { data: empresa } = await supabase
      .from('empresas')
      .select('status')
      .eq('id', usuario.empresa_id)
      .single()

    console.log('EMPRESA:', empresa)

    if (empresa?.status !== 'ativo') {
      router.push('/bloqueado')
      return
    }

    setLiberado(true)
  }

  if (!liberado) return null

  return children
}