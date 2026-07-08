'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useNotification } from '../context/NotificationContext'
import { setAdminSession, validateAdminLogin } from '@/lib/adminAuth'

export default function AdminPage() {
  const router = useRouter()
  const { showSuccess, showError, showWarning, showInfo } = useNotification()
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)

  // Check if admin is already logged in
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const adminLoginStatus = sessionStorage.getItem('isAdminLoggedIn')
      if (adminLoginStatus === 'true') {
        setIsAdminLoggedIn(true)
        router.push('/admin/dashboard')
      }
      setIsCheckingAuth(false)
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

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[#0b0d12] flex items-center justify-center" style={{ background: 'radial-gradient(1200px 600px at 15% -10%, rgba(201, 160, 74, 0.08), transparent 60%), #0b0d12' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e2b968] mx-auto mb-4"></div>
          <p className="text-[#f2eee3]">Checking admin access...</p>
        </div>
      </div>
    )
  }

  // Don't render if already logged in (will redirect)
  if (isAdminLoggedIn) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'radial-gradient(1200px 600px at 15% -10%, rgba(201, 160, 74, 0.08), transparent 60%), #0b0d12' }}>
      <div className="w-full max-w-md">
        {/* Admin Logo/Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-[#12151d] border border-[#262b38] rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
            <svg className="w-10 h-10 text-[#e2b968]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-[#f2eee3] mb-2 font-serif" style={{ fontFamily: 'var(--font-fraunces), serif' }}>Admin Access</h1>
          <p className="text-[#9598a3]">Sign in to manage your platform</p>
        </div>

        {/* Admin Login Form */}
        <div className="bg-[#12151d] border border-[#262b38] rounded-2xl p-8 shadow-xl" style={{ boxShadow: 'var(--shadow)' }}>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-[#9598a3] mb-2">
                Admin Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-[#5c606c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-4 py-3 bg-[#0b0d12] border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#c9a04a] focus:border-[#c9a04a] transition-all text-[#f2eee3] placeholder-[#5c606c] ${
                    errors.username ? 'border-red-500/80 focus:ring-red-500 focus:border-red-500' : 'border-[#262b38]'
                  }`}
                  placeholder="Enter admin username"
                />
              </div>
              {errors.username && <p className="mt-1 text-sm text-red-400">{errors.username}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#9598a3] mb-2">
                Admin Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-[#5c606c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full pl-10 pr-4 py-3 bg-[#0b0d12] border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#c9a04a] focus:border-[#c9a04a] transition-all text-[#f2eee3] placeholder-[#5c606c] ${
                    errors.password ? 'border-red-500/80 focus:ring-red-500 focus:border-red-500' : 'border-[#262b38]'
                  }`}
                  placeholder="Enter admin password"
                />
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-400">{errors.password}</p>}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#c9a04a] text-[#0b0d12] py-3 px-4 rounded-lg font-semibold hover:bg-[#e2b968] focus:outline-none focus:ring-2 focus:ring-[#c9a04a] focus:ring-offset-2 focus:ring-offset-[#12151d] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-[#0b0d12]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing In...
                </div>
              ) : (
                'Sign In as Admin'
              )}
            </button>
          </form>

          {/* Back to Site Link */}
          <div className="mt-6 text-center">
            <button 
              onClick={() => router.push('/')}
              className="text-[#c9a04a] hover:text-[#e2b968] font-semibold transition-colors"
            >
              ← Back to Main Site
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 
