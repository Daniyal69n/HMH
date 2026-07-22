'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useNotification } from '../../context/NotificationContext'
import { setAdminSession, validateAdminLogin } from '@/lib/adminAuth'

export default function AdminLoginPage() {
  const router = useRouter()
  const { showSuccess, showError, showWarning, showInfo } = useNotification()
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Simple check for already logged in admin
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const adminLoginStatus = sessionStorage.getItem('isAdminLoggedIn')
      if (adminLoginStatus === 'true') {
        router.push('/admin/dashboard')
      }
    }
  }, [router])


  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      if (validateAdminLogin(formData.username, formData.password)) {
        setAdminSession(formData.username)
        router.push('/admin/dashboard')
      } else {
        showError('Invalid admin credentials. Please try again.')
        setIsLoading(false)
      }
    } catch (error) {
      showError('Login failed. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="admin-login-page">
      <style>{`
        .admin-login-page {
          min-height: 100vh;
          background: #0b0d12;
          background-image: radial-gradient(1200px 600px at 15% -10%, rgba(201, 160, 74, 0.06), transparent 60%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
          -webkit-font-smoothing: antialiased;
        }
        .admin-login-inner {
          width: 100%;
          max-width: 420px;
        }
        .admin-login-header {
          text-align: center;
          margin-bottom: 32px;
        }
        .admin-login-logo {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          margin: 0 auto 16px;
          background: conic-gradient(from 200deg, #7a6535, #c9a04a, #e2b968, #7a6535);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 24px;
          color: #0b0d12;
          box-shadow: 0 8px 30px rgba(0,0,0,0.35);
        }
        .admin-login-header h1 {
          font-size: 26px;
          font-weight: 600;
          color: #e2b968;
          margin: 0 0 6px;
        }
        .admin-login-header p {
          margin: 0;
          color: #5c606c;
          font-size: 14px;
        }
        .admin-login-card {
          background: #12151d;
          border: 1px solid #1d212b;
          border-radius: 16px;
          padding: 32px 28px;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.35);
        }
        .admin-login-card form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .admin-login-field label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: #9598a3;
          margin-bottom: 8px;
        }
        .admin-login-input-wrap {
          position: relative;
        }
        .admin-login-input-wrap .input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          width: 18px;
          height: 18px;
          color: #5c606c;
          pointer-events: none;
          flex: none;
        }
        .admin-login-input-wrap .input-icon svg {
          width: 18px;
          height: 18px;
        }
        .admin-login-field input {
          width: 100%;
          background: #171b25;
          border: 1px solid #262b38;
          border-radius: 10px;
          padding: 12px 14px 12px 42px;
          color: #f2eee3;
          font-size: 14px;
          font-family: inherit;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }
        .admin-login-field input:focus {
          outline: none;
          border-color: #7a6535;
        }
        .admin-login-field input.error {
          border-color: #c4574a;
        }
        .admin-login-field .field-error {
          margin-top: 6px;
          font-size: 12.5px;
          color: #c4574a;
        }
        .admin-login-submit {
          width: 100%;
          background: linear-gradient(135deg, #e2b968, #c9a04a);
          color: #181205;
          border: none;
          border-radius: 12px;
          padding: 14px 20px;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          transition: opacity 0.2s;
          font-family: inherit;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 48px;
        }
        .admin-login-submit:hover {
          opacity: 0.9;
        }
        .admin-login-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .admin-login-submit .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(24, 18, 5, 0.3);
          border-top-color: #181205;
          border-radius: 50%;
          animation: admin-spin 0.6s linear infinite;
        }
        @keyframes admin-spin {
          to { transform: rotate(360deg); }
        }
        .admin-login-footer {
          margin-top: 20px;
          text-align: center;
        }
        .admin-login-footer button {
          background: none;
          border: none;
          color: #c9a04a;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          font-family: inherit;
          padding: 4px 8px;
        }
        .admin-login-footer button:hover {
          color: #e2b968;
        }
        @media (max-width: 480px) {
          .admin-login-card {
            padding: 24px 18px;
          }
          .admin-login-logo {
            width: 60px;
            height: 60px;
            font-size: 20px;
          }
          .admin-login-header h1 {
            font-size: 22px;
          }
        }
      `}</style>

      <div className="admin-login-inner">
        {/* Admin Logo/Header */}
        <div className="admin-login-header">
          <div className="admin-login-logo">A</div>
          <h1>Admin Access</h1>
          <p>Sign in to manage your platform</p>
        </div>

        {/* Admin Login Form */}
        <div className="admin-login-card">
          <form onSubmit={handleSubmit}>
            {/* Username */}
            <div className="admin-login-field">
              <label htmlFor="username">Admin Username</label>
              <div className="admin-login-input-wrap">
                <span className="input-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className={errors.username ? 'error' : ''}
                  placeholder="Enter admin username"
                />
              </div>
              {errors.username && <p className="field-error">{errors.username}</p>}
            </div>

            {/* Password */}
            <div className="admin-login-field">
              <label htmlFor="password">Admin Password</label>
              <div className="admin-login-input-wrap">
                <span className="input-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={errors.password ? 'error' : ''}
                  placeholder="Enter admin password"
                  style={{ paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
                >
                  {showPassword ? (
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.978 9.978 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && <p className="field-error">{errors.password}</p>}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="admin-login-submit"
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Signing In...
                </>
              ) : (
                'Sign In as Admin'
              )}
            </button>
          </form>

          {/* Back to Site Link */}
          <div className="admin-login-footer">
            <button onClick={() => router.push('/')}>
              ← Back to Main Site
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}