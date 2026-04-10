// src/components/InputFormatado.tsx
'use client'

/* ──────────────────────────────────────────────────────
   FUNÇÕES DE FORMATAÇÃO
────────────────────────────────────────────────────── */

export function formatarTelefone(valor: string): string {
  // Remove tudo que não é número
  const nums = valor.replace(/\D/g, '').slice(0, 11)

  if (nums.length === 0) return ''
  if (nums.length <= 2)  return `(${nums}`
  if (nums.length <= 6)  return `(${nums.slice(0,2)}) ${nums.slice(2)}`
  if (nums.length <= 10) return `(${nums.slice(0,2)}) ${nums.slice(2,6)}-${nums.slice(6)}`
  return `(${nums.slice(0,2)}) ${nums.slice(2,7)}-${nums.slice(7)}`
}

export function formatarCPF(valor: string): string {
  const nums = valor.replace(/\D/g, '').slice(0, 11)
  if (nums.length <= 3) return nums
  if (nums.length <= 6) return `${nums.slice(0,3)}.${nums.slice(3)}`
  if (nums.length <= 9) return `${nums.slice(0,3)}.${nums.slice(3,6)}.${nums.slice(6)}`
  return `${nums.slice(0,3)}.${nums.slice(3,6)}.${nums.slice(6,9)}-${nums.slice(9)}`
}

export function formatarCNPJ(valor: string): string {
  const nums = valor.replace(/\D/g, '').slice(0, 14)
  if (nums.length <= 2)  return nums
  if (nums.length <= 5)  return `${nums.slice(0,2)}.${nums.slice(2)}`
  if (nums.length <= 8)  return `${nums.slice(0,2)}.${nums.slice(2,5)}.${nums.slice(5)}`
  if (nums.length <= 12) return `${nums.slice(0,2)}.${nums.slice(2,5)}.${nums.slice(5,8)}/${nums.slice(8)}`
  return `${nums.slice(0,2)}.${nums.slice(2,5)}.${nums.slice(5,8)}/${nums.slice(8,12)}-${nums.slice(12)}`
}

// Detecta automaticamente CPF ou CNPJ pelo tamanho
export function formatarCpfCnpj(valor: string): string {
  const nums = valor.replace(/\D/g, '')
  if (nums.length <= 11) return formatarCPF(valor)
  return formatarCNPJ(valor)
}

// Converte número formatado para formato WhatsApp (+55XXXXXXXXXXX)
export function telefoneParaWhatsApp(valor: string): string {
  const nums = valor.replace(/\D/g, '')
  if (!nums) return ''
  // Já tem 55 na frente
  if (nums.startsWith('55') && nums.length >= 12) return `+${nums}`
  return `+55${nums}`
}

/* ──────────────────────────────────────────────────────
   COMPONENTES
────────────────────────────────────────────────────── */

type InputProps = {
  value:       string
  onChange:    (valor: string) => void
  placeholder?: string
  style?:      React.CSSProperties
  disabled?:   boolean
  required?:   boolean
}

/* Telefone / WhatsApp */
export function InputTelefone({ value, onChange, placeholder, style, disabled, required }: InputProps) {
  function handle(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(formatarTelefone(e.target.value))
  }
  return (
    <div style={{ position: 'relative' }}>
      <span style={prefixo}>+55</span>
      <input
        type="tel"
        value={value}
        onChange={handle}
        placeholder={placeholder || '(49) 99999-9999'}
        style={{ ...inputBase, paddingLeft: 44, ...style }}
        disabled={disabled}
        required={required}
        maxLength={15}
      />
    </div>
  )
}

/* CPF */
export function InputCPF({ value, onChange, placeholder, style, disabled, required }: InputProps) {
  function handle(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(formatarCPF(e.target.value))
  }
  return (
    <input
      type="text"
      inputMode="numeric"
      value={value}
      onChange={handle}
      placeholder={placeholder || '000.000.000-00'}
      style={{ ...inputBase, ...style }}
      disabled={disabled}
      required={required}
      maxLength={14}
    />
  )
}

/* CNPJ */
export function InputCNPJ({ value, onChange, placeholder, style, disabled, required }: InputProps) {
  function handle(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(formatarCNPJ(e.target.value))
  }
  return (
    <input
      type="text"
      inputMode="numeric"
      value={value}
      onChange={handle}
      placeholder={placeholder || '00.000.000/0001-00'}
      style={{ ...inputBase, ...style }}
      disabled={disabled}
      required={required}
      maxLength={18}
    />
  )
}

/* CPF ou CNPJ — detecta automaticamente */
export function InputCpfCnpj({ value, onChange, placeholder, style, disabled, required }: InputProps) {
  const nums = value.replace(/\D/g, '')
  const isCNPJ = nums.length > 11

  function handle(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(formatarCpfCnpj(e.target.value))
  }
  return (
    <div style={{ position: 'relative' }}>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={handle}
        placeholder={placeholder || 'CPF ou CNPJ'}
        style={{ ...inputBase, ...style }}
        disabled={disabled}
        required={required}
        maxLength={18}
      />
      {value && (
        <span style={tipoDoc}>{isCNPJ ? 'CNPJ' : 'CPF'}</span>
      )}
    </div>
  )
}

/* ── ESTILOS ── */
const inputBase: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid #e2e8f0',
  fontSize: 14,
  background: '#f8fafc',
  width: '100%',
  boxSizing: 'border-box',
}

const prefixo: React.CSSProperties = {
  position: 'absolute',
  left: 12,
  top: '50%',
  transform: 'translateY(-50%)',
  fontSize: 13,
  fontWeight: 700,
  color: '#64748b',
  pointerEvents: 'none',
  zIndex: 1,
}

const tipoDoc: React.CSSProperties = {
  position: 'absolute',
  right: 10,
  top: '50%',
  transform: 'translateY(-50%)',
  fontSize: 10,
  fontWeight: 700,
  color: '#2563eb',
  background: '#dbeafe',
  padding: '2px 6px',
  borderRadius: 4,
  pointerEvents: 'none',
}