'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const registered = searchParams.get('registered')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!phone.trim() || !password.trim()) {
      setError('Enter both your phone number and password.')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password })
      })

      const data = await response.json()
      if (response.ok) {
        // Save user info in localStorage
        localStorage.setItem('user', JSON.stringify(data))
        router.push('/')
      } else {
        setError(data.error || 'Invalid credentials.')
      }
    } catch (err) {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="meridian">
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '24px' }}>
        <div style={{ width: '100%', maxWidth: '460px' }}>
          <div className="card" style={{ marginBottom: '18px', textAlign: 'center', background: 'linear-gradient(150deg, var(--surface), var(--surface-2))' }}>
            <div className="brand-mark" style={{ margin: '0 auto 14px' }}>M</div>
            <div className="eyebrow" style={{ marginBottom: '6px' }}>HMHProEarn Access</div>
            <h1 style={{ margin: 0, fontFamily: 'var(--font-fraunces, serif)', fontSize: '30px', fontWeight: 600 }}>Welcome back</h1>
            <p style={{ margin: '10px 0 0', color: 'var(--text-dim)', fontSize: '14px' }}>Sign in to continue to the HMHProEarn dashboard.</p>
          </div>

          <div className="card" style={{ borderRadius: '16px' }}>
            <form onSubmit={handleSubmit}>
              <label htmlFor="phone">Phone number</label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+92 300 1234567"
              />

              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
              />

              {registered ? (
                <div style={{ marginBottom: '14px', padding: '12px 14px', borderRadius: '10px', background: 'rgba(62, 207, 142, 0.12)', border: '1px solid rgba(62, 207, 142, 0.35)', color: '#3ecf8e', fontSize: '13px' }}>
                  🎉 Registration successful! Please sign in below.
                </div>
              ) : null}

              {error ? (
                <div style={{ marginTop: '14px', padding: '12px 14px', borderRadius: '10px', background: 'rgba(196, 87, 74, 0.12)', border: '1px solid rgba(196, 87, 74, 0.35)', color: 'var(--red)', fontSize: '13px' }}>
                  {error}
                </div>
              ) : null}

              <div style={{ marginTop: '18px' }}>
                <button className="btn btn-gold" type="submit" disabled={loading} style={{ opacity: loading ? 0.75 : 1 }}>
                  {loading ? 'Signing in...' : 'Sign in'}
                </button>
              </div>
            </form>

            <p style={{ margin: '18px 0 0', textAlign: 'center', color: 'var(--text-dim)', fontSize: '13.5px' }}>
              New here?{' '}
              <Link href="/register" style={{ color: 'var(--gold-bright)', fontWeight: 700 }}>
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="meridian" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <div style={{ color: 'var(--muted)', fontSize: '14px' }}>Loading...</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
