'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Loader from '@/components/Loader'

const EyeOpenIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
)

const EyeClosedIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
    <line x1="1" y1="1" x2="23" y2="23"></line>
  </svg>
)

export default function RegisterPage() {
  const router = useRouter()
  const [isAppLoading, setIsAppLoading] = useState(true)
  useEffect(() => {
    const timer = setTimeout(() => setIsAppLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    referralCode: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ref = params.get('ref')
    if (ref) {
      setFormData((prev) => ({
        ...prev,
        referralCode: ref
      }))
    }
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      setError('Fill in your name, email, and password.')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    // Auto-generate unique phone number as required by schema
    const randomPhone = '03' + Math.floor(100000000 + Math.random() * 900000000).toString().substring(0, 9);

    setLoading(true)
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: randomPhone,
          password: formData.password,
          referralCode: formData.referralCode
        })
      })

      const data = await response.json()
      if (response.ok) {
        router.push('/login?registered=true')
      } else {
        setError(data.error || 'Registration failed.')
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
        <div style={{ width: '100%', maxWidth: '540px' }}>
          <div className="card" style={{ marginBottom: '18px', textAlign: 'center', background: 'linear-gradient(150deg, var(--surface), var(--surface-2))' }}>
            <img
              src="/logo.jpg"
              alt="HMHPro Logo"
              style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 14px', border: '1.5px solid var(--gold)' }}
            />
            <div className="eyebrow" style={{ marginBottom: '6px' }}>Join HMHPro</div>
            <h1 style={{ margin: 0, fontFamily: 'var(--font-fraunces, serif)', fontSize: '30px', fontWeight: 600 }}>Create your account</h1>
            <p style={{ margin: '10px 0 0', color: 'var(--text-dim)', fontSize: '14px' }}>Set up your profile and continue to the HMHPro flow.</p>
          </div>

          <div className="card" style={{ borderRadius: '16px' }}>
            <form onSubmit={handleSubmit}>
              <label htmlFor="name">Full name</label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
              />

              <label htmlFor="email">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email address"
              />

              <div className="row-2">
                <div>
                  <label htmlFor="password">Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Create a password"
                      style={{ paddingRight: '45px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-dim)',
                        cursor: 'pointer',
                        padding: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {showPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="confirmPassword">Confirm password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Repeat password"
                      style={{ paddingRight: '45px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-dim)',
                        cursor: 'pointer',
                        padding: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {showConfirmPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
                    </button>
                  </div>
                </div>
              </div>

              <label htmlFor="referralCode">Referral code</label>
              <input
                id="referralCode"
                name="referralCode"
                type="text"
                value={formData.referralCode}
                onChange={handleChange}
                placeholder="Optional referral code"
              />

              {error ? (
                <div style={{ marginTop: '14px', padding: '12px 14px', borderRadius: '10px', background: 'rgba(196, 87, 74, 0.12)', border: '1px solid rgba(196, 87, 74, 0.35)', color: 'var(--red)', fontSize: '13px' }}>
                  {error}
                </div>
              ) : null}

              <div style={{ marginTop: '18px' }}>
                <button className="btn btn-gold" type="submit" disabled={loading} style={{ opacity: loading ? 0.75 : 1 }}>
                  {loading ? 'Creating account...' : 'Create account'}
                </button>
              </div>
            </form>

            <p style={{ margin: '18px 0 0', textAlign: 'center', color: 'var(--text-dim)', fontSize: '13.5px' }}>
              Already have an account?{' '}
              <Link href="/login" style={{ color: 'var(--gold-bright)', fontWeight: 700 }}>
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
      {(loading || isAppLoading) && <Loader />}
    </div>
  )
}
