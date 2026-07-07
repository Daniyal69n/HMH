'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    confirmPassword: '',
    referralCode: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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

  const handleSubmit = (event) => {
    event.preventDefault()
    setError('')

    if (!formData.name.trim() || !formData.phone.trim() || !formData.password.trim()) {
      setError('Fill in your name, phone number, and password.')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      router.push('/login')
    }, 450)
  }

  return (
    <div className="meridian">
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '24px' }}>
        <div style={{ width: '100%', maxWidth: '540px' }}>
          <div className="card" style={{ marginBottom: '18px', textAlign: 'center', background: 'linear-gradient(150deg, var(--surface), var(--surface-2))' }}>
            <div className="brand-mark" style={{ margin: '0 auto 14px' }}>M</div>
            <div className="eyebrow" style={{ marginBottom: '6px' }}>Join HMHProEarn</div>
            <h1 style={{ margin: 0, fontFamily: 'var(--font-fraunces, serif)', fontSize: '30px', fontWeight: 600 }}>Create your account</h1>
            <p style={{ margin: '10px 0 0', color: 'var(--text-dim)', fontSize: '14px' }}>Set up your profile and continue to the HMHProEarn flow.</p>
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

              <label htmlFor="phone">Phone number</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter your phone number"
              />

              <div className="row-2">
                <div>
                  <label htmlFor="password">Password</label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a password"
                  />
                </div>
                <div>
                  <label htmlFor="confirmPassword">Confirm password</label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Repeat password"
                  />
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
    </div>
  )
}
