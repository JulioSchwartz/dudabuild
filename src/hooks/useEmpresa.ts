import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function useEmpresa() {

  const [empresaId, setEmpresaId] = useState<string | null>(null)

  useEffect(() => {
    carregar()
  }, [])

  async function carregar() {

    const { data: { user } } = await supabase.auth.getUser()

    const { data } = await supabase
      .from('usuarios')
      .select('empresa_id')
      .eq('user_id', user?.id)
      .single()

    setEmpresaId(data?.empresa_id)
  }

  return empresaId
}