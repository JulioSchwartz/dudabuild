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
    const empresa_id = localStorage.getItem('empresa_id')

    console.log('Empresa layout:', empresa_id)

    if (!empresa_id) {
      router.push('/login')
      return
    }

    const { data } = await supabase
      .from('empresas')
      .select('status')
      .eq('id', empresa_id)
      .single()

    console.log('Status empresa:', data)

    if (data?.status !== 'ativo') {
      router.push('/bloqueado')
      return
    }

    setLiberado(true)
  }

  if (!liberado) return null

  return children
}