import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { id, status } = await req.json()

  console.log(`Orçamento ${id} foi ${status}`)

  // 👉 aqui depois você pode integrar:
  // WhatsApp / Email / Push

  return NextResponse.json({ ok: true })
}