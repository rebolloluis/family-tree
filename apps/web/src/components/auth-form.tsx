'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type Mode = 'login' | 'signup'

export default function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter()
  const supabase = createClient()

  const [fullName, setFullName]     = useState('')
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [error, setError]           = useState<string | null>(null)
  const [loading, setLoading]       = useState(false)
  const [checkEmail, setCheckEmail] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      })
      if (error) { setError(error.message); setLoading(false); return }
      // If session is null, email confirmation is required
      if (!data.session) { setCheckEmail(true); setLoading(false); return }
      router.push('/dashboard')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
      router.push('/dashboard')
    }

    router.refresh()
  }

  if (checkEmail) {
    return (
      <div style={{ textAlign: 'center', padding: '1rem 0' }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📬</div>
        <p style={{ fontFamily: 'var(--serif)', fontSize: '1.1rem', marginBottom: '0.5rem' }}>Check your email</p>
        <p style={{ fontSize: '0.82rem', color: 'var(--ink-light)', lineHeight: 1.6 }}>
          We sent a confirmation link to <strong>{email}</strong>.<br />
          Click it to activate your account, then sign in.
        </p>
        <Link href="/auth/login" style={{ display: 'inline-block', marginTop: '1.25rem', fontSize: '0.82rem', color: 'var(--ink)' }}>
          Go to sign in →
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {mode === 'signup' && (
        <Field label="Full name">
          <input
            type="text"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Margaret Webb"
            required
          />
        </Field>
      )}

      <Field label="Email">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />
      </Field>

      <Field label="Password">
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          minLength={6}
        />
      </Field>

      {error && (
        <p style={{ fontSize: '0.8rem', color: '#b03030' }}>{error}</p>
      )}

      <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: '0.25rem' }}>
        {loading ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}
      </button>

      <p style={{ fontSize: '0.78rem', color: 'var(--ink-light)', textAlign: 'center', marginTop: '0.25rem' }}>
        {mode === 'signup' ? (
          <>Already have an account? <Link href="/auth/login" style={{ color: 'var(--ink)' }}>Sign in</Link></>
        ) : (
          <>No account? <Link href="/auth/signup" style={{ color: 'var(--ink)' }}>Sign up</Link></>
        )}
      </p>
    </form>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{
        display: 'block', fontSize: '0.68rem', fontWeight: 500,
        letterSpacing: '0.5px', textTransform: 'uppercase',
        color: 'var(--ink-light)', marginBottom: '0.3rem',
      }}>
        {label}
      </label>
      <div style={{ display: 'contents' }}>
        {children}
      </div>
    </div>
  )
}
