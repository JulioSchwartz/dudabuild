'use client'
 
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
 
// Esta página foi substituída por /planos
// Redireciona automaticamente para não quebrar links antigos
export default function Pagar() {
  const router = useRouter()
 
  useEffect(() => {
    router.replace('/planos')
  }, [])
 
  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: '#0f172a',
      color: '#fff'
    }}>
      <p>Redirecionando...</p>
    </div>
  )
}