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

    const rotasPublicas = ['/login', '/cadastro']

    if (rotasPublicas.includes(pathname)) {
      setLiberado(true)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('empresa_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!usuario?.empresa_id) {
      router.push('/login')
      return
    }

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

  // 🎯 AQUI ESTÁ O QUE FALTAVA → MENU + LAYOUT
  return (
    <div style={{ display: 'flex' }}>

      {/* MENU LATERAL */}
      <aside style={{
        width: 240,
        background: '#0f172a',
        color: '#fff',
        height: '100vh',
        padding: 20
      }}>
        <h2 style={{ marginBottom: 20 }}>🏗️ DudaBuild</h2>

        <MenuItem texto="Dashboard" rota="/dashboard" />
        <MenuItem texto="Obras" rota="/obras" />
        <MenuItem texto="Financeiro" rota="/financeiro" />
        <MenuItem texto="Orçamentos" rota="/orcamentos" />
      </aside>

      {/* CONTEÚDO */}
      <main style={{
        flex: 1,
        padding: 30,
        background: '#f8fafc',
        minHeight: '100vh'
      }}>
        {children}
      </main>

    </div>
  )
}

// 🔥 COMPONENTE MENU
function MenuItem({ texto, rota }: any) {
  const router = useRouter()

  return (
    <div
      onClick={() => router.push(rota)}
      style={{
        padding: '10px 0',
        cursor: 'pointer',
        color: '#cbd5e1'
      }}
    >
      {texto}
    </div>
  )
}