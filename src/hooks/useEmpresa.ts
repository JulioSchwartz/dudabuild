'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export function useEmpresa() {
  const router = useRouter()

  useEffect(() => {
    verificar()
  }, [])

  async function verificar() {
    const empresa_id = localStorage.getItem('empresa_id')

    if (!empresa_id) {
      router.push('/login')
      return
    }

    const { data } = await supabase
      .from('empresas')
      .select('status')
      .eq('id', empresa_id)
      .single()

    if (data?.status !== 'ativo') {
      router.push('/bloqueado')
    }
  }
}