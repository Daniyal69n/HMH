'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
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

const PLANS_LIST = [
  { name: 'Basic', priceUSD: 5, pricePKR: 1500, desc: 'Perfect for Beginners' },
  { name: 'Standard', priceUSD: 10, pricePKR: 3000, desc: 'Best for Regular Earners' },
  { name: 'Diamond', priceUSD: 20, pricePKR: 6000, desc: 'Grow Your Income Faster' },
  { name: 'Pro', priceUSD: 30, pricePKR: 9000, desc: 'For Serious Earners' },
  { name: 'Premium', priceUSD: 40, pricePKR: 12000, desc: 'Maximum Value & Benefits' },
  { name: 'Legend', priceUSD: 50, pricePKR: 15000, desc: 'Ultimate Membership Experience' }
]

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
    referralCode: '',
    planName: 'Basic',
    paymentMethod: 'jazzcash',
    trxId: ''
  })

  const [screenshotFile, setScreenshotFile] = useState(null)
  const [screenshotPreview, setScreenshotPreview] = useState(null)
  const [copiedField, setCopiedField] = useState('')
  const fileInputRef = useRef(null)

  // Modals
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showRejectionModal, setShowRejectionModal] = useState(false)
  const [pendingUser, setPendingUser] = useState(null)

  const [paymentDetails, setPaymentDetails] = useState({
    jazzcash: { accountName: 'Muhammad Haseeb', number: '03705318754' },
    easypaisa: { accountName: 'Muhammad Haseeb', number: '03705318754' },
    binance: { accountName: 'Binance Pay ID / USDT TRC20', number: '03705318754' }
  })

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingStatusText, setLoadingStatusText] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Status check function
  const checkStatus = useCallback(async (userInfo) => {
    if (!userInfo || (!userInfo.email && !userInfo.phone)) return
    try {
      const res = await fetch(`/api/auth/register-status?email=${encodeURIComponent(userInfo.email || '')}&phone=${encodeURIComponent(userInfo.phone || '')}&_t=${Date.now()}`)
      if (res.ok) {
        const data = await res.json()
        if (data.status === 'pending') {
          setShowSuccessModal(true)
          setShowRejectionModal(false)
        } else if (data.status === 'approved') {
          localStorage.removeItem('hmh-pending-reg')
          setShowSuccessModal(false)
          setShowRejectionModal(false)
          router.push('/login?approved=true')
        } else if (data.status === 'rejected') {
          setShowSuccessModal(false)
          setShowRejectionModal(true)
        } else if (data.status === 'not_found') {
          localStorage.removeItem('hmh-pending-reg')
          setShowSuccessModal(false)
          setShowRejectionModal(false)
        }
      }
    } catch (e) {
      console.warn('Error checking registration status:', e)
    }
  }, [router])

  // Check on mount if user has a pending registration
  useEffect(() => {
    try {
      const savedPending = localStorage.getItem('hmh-pending-reg')
      if (savedPending) {
        const parsed = JSON.parse(savedPending)
        setPendingUser(parsed)
        setShowSuccessModal(true)
        checkStatus(parsed)
      }
    } catch { }
  }, [checkStatus])

  // Periodic status polling if pending
  useEffect(() => {
    if (!showSuccessModal && !pendingUser) return
    const interval = setInterval(() => {
      const saved = localStorage.getItem('hmh-pending-reg')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          checkStatus(parsed)
        } catch { }
      }
    }, 8000)
    return () => clearInterval(interval)
  }, [showSuccessModal, pendingUser, checkStatus])

  // Fetch admin payment account settings from server
  useEffect(() => {
    fetch('/api/settings?key=paymentDetails')
      .then(res => res.json())
      .then(data => {
        if (data && data.value) {
          setPaymentDetails(prev => ({
            ...prev,
            ...data.value
          }))
        }
      })
      .catch(() => { })
  }, [])

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

  // Compress image to 800x800 jpeg 0.7 using HTML Canvas with safe fallbacks
  const compressImage = async (file) => {
    try {
      return await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          const img = new Image()
          img.onload = () => {
            try {
              const canvas = document.createElement('canvas')
              const MAX_WIDTH = 500
              const MAX_HEIGHT = 500
              let width = img.width
              let height = img.height

              if (width > height) {
                if (width > MAX_WIDTH) {
                  height = Math.round((height * MAX_WIDTH) / width)
                  width = MAX_WIDTH
                }
              } else {
                if (height > MAX_HEIGHT) {
                  width = Math.round((width * MAX_HEIGHT) / height)
                  height = MAX_HEIGHT
                }
              }

              canvas.width = width
              canvas.height = height
              const ctx = canvas.getContext('2d')
              ctx.drawImage(img, 0, 0, width, height)
              resolve(canvas.toDataURL('image/jpeg', 0.6))
            } catch {
              resolve(e.target.result)
            }
          }
          img.onerror = () => resolve(e.target.result)
          img.src = e.target.result
        }
        reader.onerror = (err) => reject(err)
        reader.readAsDataURL(file)
      })
    } catch {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target.result)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file.')
        return
      }
      if (file.size > 15 * 1024 * 1024) {
        setError('File size must be less than 15MB.')
        return
      }
      setScreenshotFile(file)
      const previewUrl = URL.createObjectURL(file)
      setScreenshotPreview(previewUrl)
      setError('')
    }
  }

  const copyToClipboard = (text, field) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(''), 2000)
  }

  const selectedPlan = PLANS_LIST.find(p => p.name === formData.planName) || PLANS_LIST[0]
  const currentMethodDetails = paymentDetails[formData.paymentMethod] || { accountName: 'Muhammad Haseeb', number: '03705318754' }

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

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    const trimmedTrx = (formData.trxId || '').trim()
    if (!trimmedTrx) {
      setError('Please enter the TRX ID / Transaction Reference ID.')
      return
    }

    if (trimmedTrx.length < 8 || trimmedTrx.length > 30) {
      setError('TRX ID must be between 8 and 30 characters long.')
      return
    }

    if (!screenshotFile) {
      setError('Please upload your payment screenshot.')
      return
    }

    setLoading(true)
    setLoadingStatusText('Processing payment screenshot...')

    try {
      // 1. Client-side fast compression
      const compressedBase64 = await compressImage(screenshotFile)

      // 2. Upload to Cloudinary via serverless helper
      setLoadingStatusText('Uploading screenshot...')
      let uploadedScreenshotUrl = null
      try {
        const uploadRes = await fetch('/api/user/plan-screenshot-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: compressedBase64 })
        })
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json()
          uploadedScreenshotUrl = uploadData.screenshotUrl
        }
      } catch (uploadErr) {
        console.warn('Direct upload failed, fallback to base64 payload', uploadErr)
      }

      // Auto-generate unique phone number as required by schema
      const randomPhone = '03' + Math.floor(100000000 + Math.random() * 900000000).toString().substring(0, 9);

      setLoadingStatusText('Submitting registration...')

      const paymentMethodLabel = formData.paymentMethod === 'jazzcash'
        ? 'JazzCash'
        : (formData.paymentMethod === 'easypaisa' ? 'EasyPaisa' : 'Binance')

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: randomPhone,
          password: formData.password,
          referralCode: formData.referralCode.trim(),
          planName: selectedPlan.name,
          planAmount: selectedPlan.pricePKR,
          paymentMethod: paymentMethodLabel,
          trxId: trimmedTrx,
          screenshotUrl: uploadedScreenshotUrl || compressedBase64
        })
      })

      let data = {}
      let responseText = ''
      try {
        responseText = await response.text()
        data = responseText ? JSON.parse(responseText) : {}
      } catch {
        data = { error: responseText ? responseText.slice(0, 150) : `Server error (Status ${response.status})` }
      }

      if (response.ok) {
        // Save pending registration in localStorage to persist across refreshes
        const pendingData = {
          email: formData.email.trim(),
          phone: randomPhone,
          name: formData.name.trim()
        }
        localStorage.setItem('hmh-pending-reg', JSON.stringify(pendingData))
        setPendingUser(pendingData)
        setShowSuccessModal(true)
        setLoading(false)
      } else {
        setError(data.error || data.message || `Registration failed (Status ${response.status}).`)
        setLoading(false)
      }
    } catch (err) {
      console.error('Registration error:', err)
      setError(err.message || 'Registration failed. Please check your connection and try again.')
      setLoading(false)
    }
  }

  const handleCloseRejection = () => {
    localStorage.removeItem('hmh-pending-reg')
    setShowRejectionModal(false)
    setPendingUser(null)
    router.push('/')
  }

  return (
    <div className="meridian">
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '24px 16px' }}>
        <div style={{ width: '100%', maxWidth: '560px' }}>

          {/* Header Card */}
          <div className="card" style={{ marginBottom: '18px', textAlign: 'center', background: 'linear-gradient(150deg, var(--surface), var(--surface-2))' }}>
            <img
              src="/logo.jpg"
              alt="HMHPro Logo"
              style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 14px', border: '1.5px solid var(--gold)' }}
            />
            <div className="eyebrow" style={{ marginBottom: '6px' }}>Join HMHPro</div>
            <h1 style={{ margin: 0, fontFamily: 'var(--font-fraunces, serif)', fontSize: '28px', fontWeight: 600 }}>Create your account</h1>
            <p style={{ margin: '8px 0 0', color: 'var(--text-dim)', fontSize: '13.5px' }}>
              Select a plan, transfer payment, and register your account.
            </p>
          </div>

          {/* Tutorial Video Card */}
          <div className="card" style={{ marginBottom: '18px', padding: '16px', background: 'var(--surface)' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', color: 'var(--text-bright)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>📺</span> How to Register (Tutorial)
            </h3>
            <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)', backgroundColor: '#000' }}>
              <video
                controls
                playsInline
                poster="/tutorial-thumb.jpeg"
                style={{ width: '100%', maxHeight: '360px', objectFit: 'contain', display: 'block', borderRadius: '12px' }}
              >
                <source src="/tutorial.mp4.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>

          {/* Main Form Card */}
          <div className="card" style={{ borderRadius: '16px', padding: '24px 20px' }}>
            <form onSubmit={handleSubmit}>

              {/* Account Details Section */}
              <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--gold-bright)', marginBottom: '14px', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
                1. Account Details
              </div>

              <label htmlFor="name">Full name *</label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
              />

              <label htmlFor="email">Email address *</label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email address"
                required
              />

              <div className="row-2">
                <div>
                  <label htmlFor="password">Password *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Create a password"
                      style={{ paddingRight: '45px' }}
                      required
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
                  <label htmlFor="confirmPassword">Confirm password *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Repeat password"
                      style={{ paddingRight: '45px' }}
                      required
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

              <label htmlFor="referralCode">Referral code (Optional)</label>
              <input
                id="referralCode"
                name="referralCode"
                type="text"
                value={formData.referralCode}
                onChange={handleChange}
                placeholder="Optional referral code"
              />

              {/* Plan & Payment Section */}
              <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--gold-bright)', marginTop: '24px', marginBottom: '14px', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
                2. Select Plan & Payment Proof
              </div>

              {/* Plan Selection Dropdown */}
              <label htmlFor="planName">Choose Plan *</label>
              <select
                id="planName"
                name="planName"
                value={formData.planName}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: 'var(--input-bg, #1a1a1a)',
                  border: '1px solid var(--border, #333)',
                  color: '#fff',
                  fontSize: '14.5px',
                  fontWeight: 600,
                  marginBottom: '14px',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                {PLANS_LIST.map((p) => (
                  <option key={p.name} value={p.name} style={{ background: '#1c1c1c', color: '#fff' }}>
                    {p.name} Plan
                  </option>
                ))}
              </select>

              {/* Selected Plan Summary Banner */}
              <div style={{
                background: 'rgba(201, 160, 74, 0.08)',
                border: '1px solid rgba(201, 160, 74, 0.35)',
                borderRadius: '12px',
                padding: '14px 16px',
                marginBottom: '18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--text-dim)' }}>Selected Plan:</div>
                  <div style={{ fontWeight: 700, fontSize: '16px', color: '#fff' }}>{selectedPlan.name} Plan</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '13px', color: 'var(--text-dim)' }}>Amount to Pay:</div>
                  <div style={{ fontWeight: 800, fontSize: '17px', color: 'var(--gold-bright)' }}>
                    Rs {selectedPlan.pricePKR.toLocaleString()} (${selectedPlan.priceUSD})
                  </div>
                </div>
              </div>

              {/* Payment Method Selector */}
              <label>Select Payment Method *</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
                {[
                  { id: 'jazzcash', label: 'JazzCash', icon: '📱' },
                  { id: 'easypaisa', label: 'EasyPaisa', icon: '💳' },
                  { id: 'binance', label: 'Binance', icon: '🪙' }
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, paymentMethod: m.id }))}
                    style={{
                      padding: '10px 6px',
                      borderRadius: '10px',
                      border: formData.paymentMethod === m.id ? '2px solid var(--gold-bright)' : '1px solid var(--border)',
                      background: formData.paymentMethod === m.id ? 'rgba(201, 160, 74, 0.15)' : 'var(--surface-2)',
                      color: formData.paymentMethod === m.id ? 'var(--gold-bright)' : 'var(--text)',
                      fontWeight: 700,
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>{m.icon}</span>
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>

              {/* Account Details Box with Copy Buttons */}
              <div style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '14px 16px',
                marginBottom: '18px'
              }}>
                <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                  Transfer Details for {formData.paymentMethod.toUpperCase()}:
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Account Title: </span>
                    <span style={{ fontWeight: 700, fontSize: '13.5px', color: '#fff' }}>{currentMethodDetails.accountName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(currentMethodDetails.accountName, 'title')}
                    style={{
                      background: copiedField === 'title' ? '#4caf50' : 'rgba(255,255,255,0.08)',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '11.5px',
                      color: '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    {copiedField === 'title' ? '✓ Copied' : 'Copy'}
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Account Number: </span>
                    <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--gold-bright)' }}>{currentMethodDetails.number}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(currentMethodDetails.number, 'number')}
                    style={{
                      background: copiedField === 'number' ? '#4caf50' : 'rgba(255,255,255,0.08)',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '11.5px',
                      color: '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    {copiedField === 'number' ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* TRX ID Field */}
              <label htmlFor="trxId">TRX ID / Reference ID *</label>
              <input
                id="trxId"
                name="trxId"
                type="text"
                value={formData.trxId}
                onChange={handleChange}
                placeholder="Enter transaction ID / Reference number"
                required
                style={{ marginBottom: '14px' }}
              />

              {/* Payment Screenshot Upload */}
              <label>Payment Screenshot *</label>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed var(--border)',
                  borderRadius: '12px',
                  padding: '18px 12px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: 'var(--surface-2)',
                  transition: 'border-color 0.2s ease',
                  marginBottom: '16px'
                }}
              >
                {screenshotPreview ? (
                  <div>
                    <img
                      src={screenshotPreview}
                      alt="Payment Receipt Preview"
                      style={{ maxHeight: '160px', maxWidth: '100%', objectFit: 'contain', borderRadius: '8px', margin: '0 auto 8px', display: 'block' }}
                    />
                    <div style={{ fontSize: '12.5px', color: 'var(--gold-bright)', fontWeight: 600 }}>
                      ✓ Screenshot Selected (Click to change)
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: '28px', marginBottom: '4px' }}>📸</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-bright)' }}>
                      Click to upload payment screenshot
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px' }}>
                      PNG, JPG, JPEG (Compressed securely, max 15MB)
                    </div>
                  </div>
                )}
              </div>

              {error ? (
                <div style={{ marginTop: '14px', padding: '12px 14px', borderRadius: '10px', background: 'rgba(196, 87, 74, 0.12)', border: '1px solid rgba(196, 87, 74, 0.35)', color: 'var(--red)', fontSize: '13px' }}>
                  {error}
                </div>
              ) : null}

              {loading && loadingStatusText ? (
                <div style={{ marginTop: '14px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(201, 160, 74, 0.12)', color: 'var(--gold-bright)', fontSize: '13px', textAlign: 'center' }}>
                  ⏳ {loadingStatusText}
                </div>
              ) : null}

              <div style={{ marginTop: '18px' }}>
                <button className="btn btn-gold" type="submit" disabled={loading} style={{ opacity: loading ? 0.75 : 1, width: '100%', padding: '14px 0', fontSize: '15px' }}>
                  {loading ? 'Submitting Registration...' : 'Complete Registration & Pay'}
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

      {/* REGISTRATION SUCCESS / PENDING VERIFICATION MODAL */}
      {showSuccessModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: '#151821',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '20px',
            padding: '28px 24px',
            maxWidth: '440px',
            width: '100%',
            position: 'relative',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
          }}>
            <button
              onClick={() => setShowSuccessModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: '#fff',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '16px',
                lineHeight: '1'
              }}
            >
              ✕
            </button>

            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{
                width: '56px',
                height: '56px',
                background: '#4caf50',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px auto',
                boxShadow: '0 4px 12px rgba(76, 175, 80, 0.35)'
              }}>
                <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff', margin: 0 }}>
                Registration Submitted Successfully!
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13.5px', color: '#d0d5e0', lineHeight: '1.5' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.03)', padding: '12px 14px', borderRadius: '10px' }}>
                <span style={{ fontSize: '16px' }}>👋</span>
                <span>Thank you for joining <strong>HMHProo</strong>.</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.03)', padding: '12px 14px', borderRadius: '10px' }}>
                <span style={{ fontSize: '16px' }}>🔍</span>
                <span>Your registration and payment are currently under verification.</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.03)', padding: '12px 14px', borderRadius: '10px' }}>
                <span style={{ fontSize: '16px' }}>📝</span>
                <span>Our team will review your TRX ID and payment details.</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.03)', padding: '12px 14px', borderRadius: '10px' }}>
                <span style={{ fontSize: '16px' }}>🔔</span>
                <span>Please wait for approval. You will be notified as soon as your account is activated.</span>
              </div>

              <div style={{ background: 'rgba(201, 160, 74, 0.08)', border: '1px solid rgba(201, 160, 74, 0.25)', padding: '12px 14px', borderRadius: '10px', color: 'var(--gold-bright)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px' }}>
                <span style={{ fontSize: '16px' }}>⏱️</span>
                <span>Estimated verification time: 5 minutes to 2 hours.</span>
              </div>
            </div>

            <button
              onClick={() => setShowSuccessModal(false)}
              style={{
                marginTop: '22px',
                width: '100%',
                padding: '13px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #c9a04a, #e8c06a)',
                color: '#181205',
                fontWeight: 'bold',
                fontSize: '15px',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* REGISTRATION REJECTED MODAL */}
      {showRejectionModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.88)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: '#151821',
            border: '1px solid rgba(244, 67, 54, 0.3)',
            borderRadius: '20px',
            padding: '28px 24px',
            maxWidth: '440px',
            width: '100%',
            position: 'relative',
            boxShadow: '0 20px 40px rgba(0,0,0,0.7)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              background: '#f44336',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px auto',
              boxShadow: '0 4px 12px rgba(244, 67, 54, 0.35)'
            }}>
              <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </div>

            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#ff6b6b', margin: '0 0 10px 0' }}>
              Registration Request Rejected
            </h2>

            <p style={{ fontSize: '14px', color: '#d0d5e0', lineHeight: '1.6', marginBottom: '22px' }}>
              Your registration and payment verification request was not approved by the admin. Please verify your payment details and register again.
            </p>

            <button
              onClick={handleCloseRejection}
              style={{
                width: '100%',
                padding: '13px',
                borderRadius: '10px',
                border: 'none',
                background: 'linear-gradient(135deg, #c9a04a, #e8c06a)',
                color: '#181205',
                fontWeight: 'bold',
                fontSize: '15px',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {(loading || isAppLoading) && <Loader />}
    </div>
  )
}
