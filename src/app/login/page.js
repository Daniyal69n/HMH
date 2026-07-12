'use client'

import { useState, Suspense, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import Loader from '@/components/Loader'

const EyeOpenIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
)

const EyeClosedIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
    <line x1="1" y1="1" x2="23" y2="23"></line>
  </svg>
)

function LoginContent() {
  const router = useRouter()
  const [isAppLoading, setIsAppLoading] = useState(true)
  useEffect(() => {
    const timer = setTimeout(() => setIsAppLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])
  const searchParams = useSearchParams()
  const registered = searchParams.get('registered')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [view, setView] = useState('login') // 'login' or 'forgot'
  const [forgotEmail, setForgotEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [resetLoading, setResetLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!email.trim() || !password.trim()) {
      setError('Enter both your email and password.')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()
      if (response.ok) {
        // Save user info in localStorage
        localStorage.setItem('user', JSON.stringify(data))
        localStorage.removeItem('hmh-profile')
        localStorage.removeItem('hmh-active-page')
        localStorage.removeItem('hmh-active-plan')
        localStorage.removeItem('hmh-team-data')
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

  const handleResetPassword = async (event) => {
    event.preventDefault()
    setError('')
    setSuccessMsg('')

    if (!forgotEmail.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setError('Please fill in all fields.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setResetLoading(true)
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, newPassword })
      })

      const data = await response.json()
      if (response.ok) {
        setSuccessMsg(data.message || 'Password reset successfully!')
        setForgotEmail('')
        setNewPassword('')
        setConfirmPassword('')
        setTimeout(() => {
          setView('login')
          setSuccessMsg('')
        }, 3000)
      } else {
        setError(data.error || 'Failed to reset password.')
      }
    } catch (err) {
      setError('Connection error. Please try again.')
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className="meridian">
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '24px' }}>
        <div style={{ width: '100%', maxWidth: '460px' }}>
          <div className="card" style={{ marginBottom: '18px', textAlign: 'center', background: 'linear-gradient(150deg, var(--surface), var(--surface-2))' }}>
            <img 
              src="/logo.jpg" 
              alt="HMHPro Logo" 
              style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 14px', border: '1.5px solid var(--gold)' }} 
            />
            <div className="eyebrow" style={{ marginBottom: '6px' }}>HMHPro Access</div>
            <h1 style={{ margin: 0, fontFamily: 'var(--font-fraunces, serif)', fontSize: '30px', fontWeight: 600 }}>
              {view === 'login' ? 'Welcome back' : 'Reset Password'}
            </h1>
            <p style={{ margin: '10px 0 0', color: 'var(--text-dim)', fontSize: '14px' }}>
              {view === 'login' ? 'Sign in to continue to the HMHPro dashboard.' : 'Enter your registered email and a new password.'}
            </p>
          </div>

          <div className="card" style={{ borderRadius: '16px' }}>
            {view === 'login' ? (
              <form onSubmit={handleSubmit}>
                <label htmlFor="email">Email address</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Enter your email"
                />

                <label htmlFor="password">Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    style={{ paddingRight: '45px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-dim)',
                      cursor: 'pointer',
                      padding: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {showPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={() => { setView('forgot'); setError(''); setSuccessMsg(''); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--gold-bright)',
                      fontSize: '12.5px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    Forgot password?
                  </button>
                </div>

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
            ) : (
              <form onSubmit={handleResetPassword}>
                <label htmlFor="forgotEmail">Email address</label>
                <input
                  id="forgotEmail"
                  type="email"
                  value={forgotEmail}
                  onChange={(event) => setForgotEmail(event.target.value)}
                  placeholder="Enter your registered email"
                />

                <label htmlFor="newPassword">New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="Enter new password"
                    style={{ paddingRight: '45px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-dim)',
                      cursor: 'pointer',
                      padding: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {showPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
                  </button>
                </div>

                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirm new password"
                />

                {successMsg && (
                  <div style={{ marginTop: '14px', padding: '12px 14px', borderRadius: '10px', background: 'rgba(62, 207, 142, 0.12)', border: '1px solid rgba(62, 207, 142, 0.35)', color: '#3ecf8e', fontSize: '13px' }}>
                    🎉 {successMsg}
                  </div>
                )}

                {error && (
                  <div style={{ marginTop: '14px', padding: '12px 14px', borderRadius: '10px', background: 'rgba(196, 87, 74, 0.12)', border: '1px solid rgba(196, 87, 74, 0.35)', color: 'var(--red)', fontSize: '13px' }}>
                    {error}
                  </div>
                )}

                <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => { setView('login'); setError(''); setSuccessMsg(''); }}
                    style={{ flex: 1 }}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-gold"
                    type="submit"
                    disabled={resetLoading}
                    style={{ flex: 1, opacity: resetLoading ? 0.75 : 1 }}
                  >
                    {resetLoading ? 'Resetting...' : 'Reset Password'}
                  </button>
                </div>
              </form>
            )}

            <p style={{ margin: '18px 0 0', textAlign: 'center', color: 'var(--text-dim)', fontSize: '13.5px' }}>
              New here?{' '}
              <Link href="/register" style={{ color: 'var(--gold-bright)', fontWeight: 700 }}>
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>
      {(loading || resetLoading || isAppLoading) && <Loader />}
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
