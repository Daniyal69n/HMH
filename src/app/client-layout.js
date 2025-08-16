'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { NotificationProvider, useNotification } from './context/NotificationContext'

function ClientLayoutContent({ children }) {
  const pathname = usePathname()
  const router = useRouter()
  const { showSuccess, showError, showWarning, showInfo } = useNotification()
  const [activeNav, setActiveNav] = useState('home')
  const [userName, setUserName] = useState('John Doe')
  const [userPhone, setUserPhone] = useState('+92 300 1234567')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const userInitial = userName.charAt(0).toUpperCase()

            // Check authentication on component mount
          useEffect(() => {
            const checkAuth = async () => {
              const loginStatus = sessionStorage.getItem('isLoggedIn')
              const userData = sessionStorage.getItem('userData')

              if (loginStatus === 'true' && userData) {
                const user = JSON.parse(userData)
                
                // Check if user is blocked from database
                try {
                  const response = await fetch(`/api/user/profile?phone=${user.phone}`)
                  if (response.ok) {
                    const currentUser = await response.json()
                    
                    if (currentUser.isBlocked) {
                      // User is blocked, log them out immediately
                      sessionStorage.removeItem('isLoggedIn')
                      sessionStorage.removeItem('userData')
                      sessionStorage.removeItem('userPhone')
                      showError('Your account has been blocked. Please contact admin for support.')
                      router.push('/login')
                      setIsLoading(false)
                      return
                    }
                    
                    setUserName(currentUser.name || 'John Doe')
                    setUserPhone(currentUser.phone || '+92 300 1234567')
                    setIsLoggedIn(true)
                  } else {
                    // User not found in database, log them out
                    sessionStorage.removeItem('isLoggedIn')
                    sessionStorage.removeItem('userData')
                    sessionStorage.removeItem('userPhone')
                    router.push('/login')
                  }
                } catch (error) {
                  console.error('Error checking user status:', error)
                  // On error, still allow access but log the error
                  setUserName(user.name || 'John Doe')
                  setUserPhone(user.phone || '+92 300 1234567')
                  setIsLoggedIn(true)
                }
              } else {
                // Redirect to login if not authenticated and not already on login/register pages or admin pages
                if (!pathname.includes('/login') && !pathname.includes('/register') && !pathname.includes('/admin')) {
                  router.push('/login')
                }
              }
              setIsLoading(false)
            }

            // Only run auth check on client side
            if (typeof window !== 'undefined') {
              checkAuth()
            }
          }, [pathname, router, showError])

  // Update active navigation based on current pathname
  useEffect(() => {
    if (pathname === '/') {
      setActiveNav('home')
    } else if (pathname === '/invest') {
      setActiveNav('invest')
    } else if (pathname === '/team') {
      setActiveNav('team')
    } else if (pathname === '/profile') {
      setActiveNav('profile')
    }
  }, [pathname])

  // Don't render the main layout for login/register pages or admin pages
  if (pathname.includes('/login') || pathname.includes('/register') || pathname.includes('/admin')) {
    return (
    <NotificationProvider>
      {children}
    </NotificationProvider>
  )
  }

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render if not logged in
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  const handleNavigation = (page) => {
    setActiveNav(page)
    switch(page) {
      case 'home':
        router.push('/') // Navigate to home
        break
      case 'invest':
        router.push('/invest') // Navigate to invest
        break
      case 'team':
        router.push('/team') // Navigate to team
        break
      case 'profile':
        router.push('/profile')
        break
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Navigation Bar / Banner */}
      <nav className="bg-gradient-to-r from-indigo-600 via-purple-600 to-purple-700 text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <span className="text-indigo-600 font-bold text-lg">{userInitial}</span>
              </div>
              <div>
                <h1 className="text-xl font-bold">Welcome, {userName}</h1>
                <p className="text-purple-200 text-sm">{userPhone}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  localStorage.removeItem('isLoggedIn')
                  localStorage.removeItem('userData')
                  router.push('/login')
                }}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 pb-24">
        {children}
      </main>

      {/* Bottom Navigation Footer */}
      <footer className="fixed z-999 bottom-0 left-0 right-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-purple-700 shadow-lg rounded-t-3xl">
        <div className="grid grid-cols-4 h-16">
          <button 
            onClick={() => handleNavigation('home')}
            className={`flex flex-col items-center justify-center space-y-1 transition-all rounded-tl-3xl ${
              activeNav === 'home' 
                ? 'text-white' 
                : 'text-gray-300 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
            </svg>
            <span className="text-xs font-medium">Home</span>
          </button>
          
          <button 
            onClick={() => handleNavigation('invest')}
            className={`flex flex-col items-center justify-center space-y-1 transition-all ${
              activeNav === 'invest' 
                ? 'text-white' 
                : 'text-gray-300 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
            </svg>
            <span className="text-xs font-medium">Invest</span>
          </button>
          
          <button 
            onClick={() => handleNavigation('team')}
            className={`flex flex-col items-center justify-center space-y-1 transition-all ${
              activeNav === 'team' 
                ? 'text-white' 
                : 'text-gray-300 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
            <span className="text-xs font-medium">Team</span>
          </button>
          
          <button 
            onClick={() => handleNavigation('profile')}
            className={`flex flex-col items-center justify-center space-y-1 transition-all rounded-tr-3xl ${
              activeNav === 'profile' 
                ? 'text-white' 
                : 'text-gray-300 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
            <span className="text-xs font-medium">Profile</span>
          </button>
        </div>
      </footer>
    </div>
  )
}

export default function ClientLayout({ children }) {
  return (
    <NotificationProvider>
      <ClientLayoutContent>
        {children}
      </ClientLayoutContent>
    </NotificationProvider>
  )
}
