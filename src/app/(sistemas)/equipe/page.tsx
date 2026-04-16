'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useEmpresa } from '@/hooks/useEmpresa'

type Membro = {
  id: number; email: string
  perfil: 'admin' | 'engenheiro' | 'mestre_obra' | 'financeiro'
  is_admin: boolean; criado_em: string; user_id: string
}

const PERFIL_LABEL: Record<string, string> = { admin: 'Administrador', engenheiro: 'Engenheiro', mestre_obra: 'Mestre de Obra', financeiro: 'Financeiro' }
const PERFIL_COR:   Record<string, string> = { admin: '#d4a843', engenheiro: '#3b82f6', mestre_obra: '#10b981', financeiro: '#8b5cf6' }

export default function Equipe() {
  const router = useRouter()
  const { plano, loading: loadingEmpresa } = useEmpresa()

  const [membros,      setMembros]      = useState<Membro[]>([])
  const [loadingLista, setLoadingLista] = useState(true)
  const [salvando,     setSalvando]     = useState(false)
  const [erro,         setErro]         = useState('')
  const [sucesso,      setSucesso]      = useState('')
  const [email,        setEmail]        = useState('')
  const [senha,        setSenha]        = useState('')
  const [perfil,       setPerfil]       = useState<'engenheiro' | 'mestre_obra' | 'financeiro'>('engenheiro')
  const [senhaMembroId,    setSenhaMembroId]    = useState<number | null>(null)
  const [senhaUserAuthId,  setSenhaUserAuthId]  = useState<string | null>(null)
  const [novaSenha,        setNovaSenha]        = useState('')
  const [mostrarNovaSenha, setMostrarNovaSenha] = useState(false)
  const [salvandoSenha,    setSalvandoSenha]    = useState(false)
  const [erroSenha,        setErroSenha]        = useState('')
  const [sucessoSenha,     setSucessoSenha]     = useState('')
  const [removendo,        setRemovendo]        = useState<number | null>(null)

  const carregarEquipe = useCallback(async () => {
    setLoadingLista(true)
    const { data } = await supabase.rpc('get_equipe')
    setMembros(data ?? [])
    setLoadingLista(false)
  }, [])

  useEffect(() => { if (!loadingEmpresa) carregarEquipe() }, [loadingEmpresa, carregarEquipe])
  useEffect(() => { if (!loadingEmpresa && plano !== 'premium') router.push('/planos') }, [loadingEmpresa, plano, router])

  async function criarMembro() {
    setErro(''); setSucesso('')
    if (!email || !senha) { setErro('Preencha todos os campos.'); return }
    setSalvando(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/equipe/criar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ email, senha, perfil }),
      })
      const json = await res.json()
      if (!res.ok) { setErro(json.error || 'Erro ao criar membro.'); return }
      setSucesso('Membro adicionado com sucesso!')
      setEmail(''); setSenha('')
      carregarEquipe()
    } catch { setErro('Erro inesperado.') }
    finally { setSalvando(false) }
  }

  async function removerMembro(m: Membro) {
    if (!confirm(`Remover ${m.email}?`)) return
    setRemovendo(m.id)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/equipe/remover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ usuarioId: m.id, userAuthId: m.user_id }),
      })
      if (!res.ok) { alert('Erro ao remover.'); return }
      carregarEquipe()
    } catch { alert('Erro inesperado.') }
    finally { setRemovendo(null) }
  }

  async function redefinirSenha() {
    setErroSenha(''); setSucessoSenha('')
    if (!novaSenha || novaSenha.length < 6) { setErroSenha('Mínimo 6 caracteres.'); return }
    setSalvandoSenha(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/equipe/senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
        body: JSON.stringify({ userAuthId: senhaUserAuthId, novaSenha }),
      })
      const json = await res.json()
      if (!res.ok) { setErroSenha(json.error || 'Erro.'); return }
      setSucessoSenha('Senha redefinida com sucesso!')
      setNovaSenha('')
    } catch { setErroSenha('Erro inesperado.') }
    finally { setSalvandoSenha(false) }
  }

  function abrirRedefinirSenha(m: Membro) {
    setSenhaMembroId(m.id); setSenhaUserAuthId(m.user_id)
    setNovaSenha(''); setErroSenha(''); setSucessoSenha(''); setMostrarNovaSenha(false)
  }

  if (loadingEmpresa) return <p style={{ padding: 40, textAlign: 'center' }}>Carregando...</p>
  if (plano !== 'premium') return null

  return (
    <div style={container}>
      <style>{`
        @media (max-width: 768px) {
          .eq-grid2 { grid-template-columns: 1fr !important; }
          .eq-membro-card { flex-direction: column !important; align-items: flex-start !important; gap: 10px !important; }
          .eq-membro-acoes { width: 100% !important; justify-content: flex-end !important; }
          .eq-senha-form-row { flex-direction: column !important; }
        }
      `}</style>

      <div style={{ marginBottom: 32 }}>
        <h1 style={titulo}>Equipe</h1>
        <p style={subtitulo}>Gerencie os membros da sua empresa</p>
      </div>

      {/* FORM NOVO MEMBRO */}
      <div style={card}>
        <h2 style={cardTitulo}>Adicionar membro</h2>
        {/* E-mail e Senha — 2 col desktop, 1 col mobile */}
        <div className="eq-grid2" style={grid2}>
          <div style={campo}>
            <label style={label}>E-mail</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="email@exemplo.com" style={input} />
          </div>
          <div style={campo}>
            <label style={label}>Senha inicial</label>
            <input type="password" value={senha} onChange={e => setSenha(e.target.value)}
              placeholder="Mínimo 6 caracteres" style={input} />
          </div>
        </div>

        <div style={{ ...campo, marginTop: 16 }}>
          <label style={label}>Perfil</label>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {(['engenheiro', 'mestre_obra', 'financeiro'] as const).map(p => (
              <button key={p} onClick={() => setPerfil(p)} style={{
                ...btnPerfil,
                background: perfil === p ? PERFIL_COR[p] + '15' : '#f8fafc',
                border: `2px solid ${perfil === p ? PERFIL_COR[p] : '#e2e8f0'}`,
                color: perfil === p ? PERFIL_COR[p] : '#64748b',
                fontWeight: perfil === p ? 700 : 500,
              }}>
                {PERFIL_LABEL[p]}
              </button>
            ))}
          </div>
        </div>

        <div style={descricaoPerfil}>
          {perfil === 'engenheiro'  && '🏗️ Acessa obras, orçamentos, financeiro e relatórios. Não gerencia equipe ou planos.'}
          {perfil === 'mestre_obra' && '👷 Acessa obras, diário, fotos, etapas e financeiro. Não exclui lançamentos.'}
          {perfil === 'financeiro'  && '💼 Acessa financeiro e relatórios. Foco total em gestão financeira das obras.'}
        </div>

        {erro    && <p style={{ color: '#ef4444', fontSize: 13, marginTop: 12 }}>⚠ {erro}</p>}
        {sucesso && <p style={{ color: '#22c55e', fontSize: 13, marginTop: 12 }}>✓ {sucesso}</p>}

        <button onClick={criarMembro} disabled={salvando}
          style={{ ...btnPrimario, marginTop: 20, opacity: salvando ? 0.7 : 1 }}>
          {salvando ? 'Criando...' : '+ Adicionar membro'}
        </button>
      </div>

      {/* LISTA */}
      <div style={{ ...card, marginTop: 24 }}>
        <h2 style={cardTitulo}>Membros da equipe</h2>
        {loadingLista ? (
          <p style={{ color: '#94a3b8', fontSize: 14 }}>Carregando...</p>
        ) : membros.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: 14 }}>Nenhum membro cadastrado ainda.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {membros.map(m => (
              <div key={m.id}>
                <div className="eq-membro-card" style={membroCard}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: PERFIL_COR[m.perfil] + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: PERFIL_COR[m.perfil] }}>
                      {m.email[0].toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, color: '#0f172a', fontSize: 14, margin: 0 }}>{m.email}</p>
                      <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
                        Adicionado em {new Date(m.criado_em).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  <div className="eq-membro-acoes" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, background: PERFIL_COR[m.perfil] + '15', color: PERFIL_COR[m.perfil] }}>
                      {PERFIL_LABEL[m.perfil]}
                    </span>
                    {!m.is_admin && (
                      <>
                        <button onClick={() => senhaMembroId === m.id ? (setSenhaMembroId(null), setSenhaUserAuthId(null)) : abrirRedefinirSenha(m)}
                          title="Redefinir senha" style={btnAcao('#3b82f6')}>🔑</button>
                        <button onClick={() => removerMembro(m)} disabled={removendo === m.id}
                          title="Remover membro" style={btnAcao('#ef4444')}>
                          {removendo === m.id ? '...' : '✕'}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {senhaMembroId === m.id && (
                  <div style={senhaForm}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
                      🔑 Redefinir senha de <span style={{ color: '#3b82f6' }}>{m.email}</span>
                    </p>
                    <div className="eq-senha-form-row" style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                      <div style={{ ...campo, flex: 1 }}>
                        <label style={label}>Nova senha</label>
                        <div style={{ position: 'relative' }}>
                          <input type={mostrarNovaSenha ? 'text' : 'password'} value={novaSenha}
                            onChange={e => setNovaSenha(e.target.value)} placeholder="Mínimo 6 caracteres"
                            style={{ ...input, paddingRight: 40 }} />
                          <button onClick={() => setMostrarNovaSenha(!mostrarNovaSenha)}
                            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#94a3b8' }}>
                            {mostrarNovaSenha ? '🙈' : '👁'}
                          </button>
                        </div>
                      </div>
                      <button onClick={redefinirSenha} disabled={salvandoSenha}
                        style={{ ...btnPrimario, opacity: salvandoSenha ? 0.7 : 1, whiteSpace: 'nowrap' }}>
                        {salvandoSenha ? 'Salvando...' : 'Salvar senha'}
                      </button>
                      <button onClick={() => { setSenhaMembroId(null); setSenhaUserAuthId(null) }} style={btnCancelar}>
                        Cancelar
                      </button>
                    </div>
                    {erroSenha    && <p style={{ color: '#ef4444', fontSize: 13, marginTop: 8 }}>⚠ {erroSenha}</p>}
                    {sucessoSenha && <p style={{ color: '#22c55e', fontSize: 13, marginTop: 8 }}>✓ {sucessoSenha}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const container: React.CSSProperties       = { padding: '32px 24px', maxWidth: 800, margin: '0 auto' }
const titulo: React.CSSProperties          = { fontSize: 24, fontWeight: 900, color: '#0f172a', margin: 0 }
const subtitulo: React.CSSProperties       = { fontSize: 14, color: '#64748b', marginTop: 4 }
const card: React.CSSProperties            = { background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: '24px' }
const cardTitulo: React.CSSProperties      = { fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 20, marginTop: 0 }
const grid2: React.CSSProperties           = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }
const campo: React.CSSProperties           = { display: 'flex', flexDirection: 'column', gap: 6 }
const label: React.CSSProperties           = { fontSize: 13, fontWeight: 600, color: '#374151' }
const input: React.CSSProperties           = { padding: '10px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', color: '#0f172a' }
const btnPerfil: React.CSSProperties       = { padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 13, transition: 'all 0.15s' }
const btnPrimario: React.CSSProperties     = { padding: '11px 22px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #d4a843, #f0c040)', color: '#000', fontWeight: 700, fontSize: 14, cursor: 'pointer' }
const btnCancelar: React.CSSProperties     = { padding: '11px 16px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#f8fafc', color: '#64748b', fontWeight: 600, fontSize: 14, cursor: 'pointer' }
const membroCard: React.CSSProperties      = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 10, border: '1px solid #f1f5f9', background: '#fafafa' }
const descricaoPerfil: React.CSSProperties = { marginTop: 12, padding: '10px 14px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 13, color: '#64748b', lineHeight: 1.5 }
const senhaForm: React.CSSProperties       = { background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '16px', marginTop: 4 }
const btnAcao = (cor: string): React.CSSProperties => ({
  width: 32, height: 32, borderRadius: 8, border: `1px solid ${cor}25`,
  background: cor + '10', color: cor, cursor: 'pointer', fontSize: 14,
  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
})