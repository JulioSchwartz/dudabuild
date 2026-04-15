'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Bloqueado() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/planos')
  }, [])

  return null
}