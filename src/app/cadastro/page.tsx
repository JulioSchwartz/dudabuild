'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Cadastro(){

  const router = useRouter()

  const [nomeEmpresa, setNomeEmpresa] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  async function cadastrar(e: any) {
  e.preventDefault()

  setErro('')
  setLoading(true)

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
    })

    if (error) {
      if (error.message.includes('already registered')) {
        setErro('Este email já está cadastrado. Faça login.')
      } else {
        setErro(error.message)
      }
      return
    }

    const user = data.user

    if (!user) {
      setErro('Erro ao criar usuário')
      return
    }

    // 🏢 cria empresa
    const { data: empresa, error: erroEmpresa } = await supabase
      .from('empresas')
      .insert({
        nome: nomeEmpresa || email,
        plano: 'basico',
        status: 'incomplete' // 🔥 IMPORTANTE
      })
      .select()
      .single()

    if (erroEmpresa || !empresa) {
      setErro('Erro ao criar empresa')
      return
    }

    // 👤 cria usuario
    const { error: erroUsuario } = await supabase
      .from('usuarios')
      .insert({
        email,
        user_id: user.id,
        empresa_id: empresa.id,
        is_admin: false
      })

    if (erroUsuario) {
      setErro('Erro ao vincular usuário')
      return
    }

    // 🚀 REDIRECIONA PRA PAGAMENTO
    router.push('/planos')

  } catch (err) {
    console.error(err)
    setErro('Erro inesperado')
  } finally {
    setLoading(false)
  }
}

  return (
    <div style={container}>
      <div style={card}>
        <h1 style={titulo}>🚀 Criar Conta</h1>

        <form onSubmit={cadastrar}>
          <input
            placeholder="Nome da empresa"
            onChange={e=>setNomeEmpresa(e.target.value)}
            style={input}
          />

          <input
            placeholder="Email"
            onChange={e=>setEmail(e.target.value)}
            style={input}
          />

          <input
            placeholder="Senha"
            type="password"
            onChange={e=>setSenha(e.target.value)}
            style={input}
          />

          {erro && <p style={{color:'red'}}>{erro}</p>}

          <button style={botao}>
            {loading ? 'Criando...' : 'Criar conta'}
          </button>
        </form>
      </div>
    </div>
  )
}

/* estilo */

const container={height:'100vh',display:'flex',justifyContent:'center',alignItems:'center',background:'#0f172a'}
const card={background:'#fff',padding:30,borderRadius:12,width:320}
const titulo={marginBottom:20}
const input={width:'100%',padding:10,marginBottom:10,border:'1px solid #ccc'}
const botao={width:'100%',padding:12,background:'#22c55e',color:'#fff',borderRadius:6}