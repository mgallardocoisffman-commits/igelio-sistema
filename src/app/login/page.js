'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError('Email o contraseña incorrectos. Intenta de nuevo.')
      setLoading(false)
    } else {
      router.push('/sistema')
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#111111',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        background: '#fff', borderRadius: 10, padding: 40,
        width: 380, maxWidth: '90vw'
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ display: 'flex', gap: 3 }}>
            {[0,1,2].map(i => (
              <span key={i} style={{ display: 'block', width: 5, height: 26, background: '#E8581A', borderRadius: 1 }} />
            ))}
          </div>
          <span style={{ fontWeight: 'bold', fontSize: 15, letterSpacing: 0.5 }}>
            IMPORTACIONES GENERALES ELIO
          </span>
        </div>
        <p style={{ color: '#6B6862', fontSize: 12, marginBottom: 28 }}>
          Sistema de gestión y trazabilidad
        </p>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 'bold', color: '#3A3835', marginBottom: 5 }}>
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@igilio.com"
              required
              style={{
                width: '100%', fontFamily: 'Arial', fontSize: 14,
                padding: '11px 14px', border: '1px solid #E3E0DA',
                borderRadius: 7, outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: 6 }}>
            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 'bold', color: '#3A3835', marginBottom: 5 }}>
              Contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Tu contraseña"
                required
                style={{
                  width: '100%', fontFamily: 'Arial', fontSize: 14,
                  padding: '11px 40px 11px 14px', border: '1px solid #E3E0DA',
                  borderRadius: 7, outline: 'none', boxSizing: 'border-box'
                }}
              />
              <span
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: 10, top: '50%',
                  transform: 'translateY(-50%)', cursor: 'pointer',
                  color: '#6B6862', fontSize: 12, userSelect: 'none'
                }}
              >
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </span>
            </div>
          </div>

          {error && (
            <p style={{ color: '#B0261A', fontSize: 12, marginBottom: 10 }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', background: loading ? '#B8B5AE' : '#E8581A',
              color: '#fff', border: 'none', borderRadius: 6,
              padding: '11px 16px', fontWeight: 'bold', fontSize: 13,
              cursor: loading ? 'not-allowed' : 'pointer', marginTop: 16
            }}
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}
