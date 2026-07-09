'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

const EMPTY_PROFILE = {
  name: '',
  email: '',
  username: '',
  city: '',
  address: ''
}

function loadStoredProfile() {
  if (typeof window === 'undefined') return { ...EMPTY_PROFILE }

  let merged = { ...EMPTY_PROFILE }

  try {
    const userData = localStorage.getItem('user')
    if (userData) {
      const user = JSON.parse(userData)
      merged = {
        ...merged,
        name: user.name || '',
        email: user.email || '',
        username: user.phone || '',
        phone: user.phone || '',
        _id: user._id || ''
      }
    }
  } catch { }

  try {
    const savedProfile = localStorage.getItem('hmh-profile')
    if (savedProfile) {
      const saved = JSON.parse(savedProfile)
      if (saved.name) merged.name = saved.name
      if (saved.email) merged.email = saved.email
      if (saved.username) merged.username = saved.username
      if (saved.city) merged.city = saved.city
      if (saved.address) merged.address = saved.address
    }
  } catch { }

  return merged
}

export default function Page() {
  const router = useRouter()
  const [page, setPage] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const [toast, setToast] = useState('')
  const toastTimer = useRef(null)
  const spinTimer = useRef(null)

  const [withdrawHistory, setWithdrawHistory] = useState([])
  const [wdAmount, setWdAmount] = useState('')
  const [wdMethod, setWdMethod] = useState('')
  const [wdName, setWdName] = useState('')
  const [wdAccount, setWdAccount] = useState('')

  const [profile, setProfile] = useState(EMPTY_PROFILE)
  const [profileDraft, setProfileDraft] = useState(EMPTY_PROFILE)
  const [profileSaved, setProfileSaved] = useState(false)
  const profileReady = useRef(false)

  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [checkoutProduct, setCheckoutProduct] = useState(null)
  const [coName, setCoName] = useState('')
  const [coPhone, setCoPhone] = useState('')
  const [coAddress, setCoAddress] = useState('')

  const [spinAngle, setSpinAngle] = useState(0)
  const [spinRunning, setSpinRunning] = useState(false)
  const [spinResult, setSpinResult] = useState('Locked')
  const spinAngleRef = useRef(0)

  const [teamData, setTeamData] = useState({
    totalMembers: 0,
    totalTeamEarnings: 0,
    levelA: { count: 0, members: [] }
  })

  const [activePlanName, setActivePlanName] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('hmh-active-plan') || 'Free'
    }
    return 'Free'
  })

  // PKR conversion: $1 = PKR 300
  const PKR_RATE = 300

  // Plan purchase modal state
  const [planModalOpen, setPlanModalOpen] = useState(false)
  const [selectedPlanData, setSelectedPlanData] = useState(null)
  const [planPaymentMethod, setPlanPaymentMethod] = useState('jazzcash')
  const [planScreenshot, setPlanScreenshot] = useState(null)
  const [planScreenshotName, setPlanScreenshotName] = useState('')
  const [planSubmitting, setPlanSubmitting] = useState(false)
  const [planPaymentDetails, setPlanPaymentDetails] = useState({
    jazzcash: { number: '03705318754', accountName: 'Muhammad Haseeb' },
    easypaisa: { number: '03705318754', accountName: 'Muhammad Haseeb' }
  })

  // Spin reset countdown and cycle state
  const [spinCountdown, setSpinCountdown] = useState('24h 00m 00s')
  const [currentCycleInvites, setCurrentCycleInvites] = useState(0)
  const [hasSpunThisCycle, setHasSpunThisCycle] = useState(false)

  const NAV = useMemo(
    () => [
      { id: 'dashboard', label: 'Dashboard', icon: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z' },
      { id: 'withdraw', label: 'Withdraw funds', icon: 'M3 7h18v10H3zM3 10h18' },
      { id: 'network', label: 'My network', icon: 'M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM17 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 20c0-3 3-5 6-5s6 2 6 5M13 20c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4' },
      { id: 'plans', label: 'My plan', icon: 'M12 3v18M5 8l7-5 7 5' },
      { id: 'levels', label: 'Rewards & levels', icon: 'M8 21h8M12 17v4M6 3h12l-1 8a5 5 0 0 1-10 0z' },
      { id: 'spin', label: 'Lucky spin', icon: 'M12 2v20M2 12h20' },
      { id: 'store', label: 'E-commerce', icon: 'M4 8h16l-1.5 11h-13zM8 8V6a4 4 0 0 1 8 0v2' },
      { id: 'membership', label: 'Membership card', icon: 'M3 6h18v12H3zM3 10h18' },
      { id: 'profile', label: 'Profile settings', icon: 'M12 15a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM5 20c1.5-3.5 4-5 7-5s5.5 1.5 7 5' },
      { id: 'admin', label: 'Admin panel', icon: 'M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z' }
    ],
    []
  )

  const leaders = useMemo(
    () => [
      { name: 'Jordan K.', level: 12, amt: 482.5 },
      { name: 'Sam T.', level: 9, amt: 361.2 },
      { name: 'Riley M.', level: 8, amt: 298.75 },
      { name: 'Casey P.', level: 6, amt: 210.0 },
      { name: 'Morgan L.', level: 5, amt: 175.4 },
      { name: 'Drew H.', level: 4, amt: 140.0 },
      { name: 'Taylor B.', level: 3, amt: 98.6 },
      { name: 'Jamie F.', level: 2, amt: 64.1 },
      { name: 'Avery S.', level: 1, amt: 32.0 },
      { name: 'Quinn R.', level: 1, amt: 18.5 }
    ],
    []
  )

  const plans = useMemo(
    () => [
      {
        icon: '🟢',
        name: 'Basic',
        price: 5,
        desc: 'Perfect for Beginners',
        buttonLabel: 'Get Started',
        features: [
          'Daily Earning',
          'Direct commission',
          'Referral Rewards',
          'Fast Withdrawal',
          '24/7 Support'
        ]
      },
      {
        icon: '🔵',
        name: 'Standard',
        price: 10,
        desc: 'Best for Regular Earners',
        featured: true,
        buttonLabel: 'Get Started',
        features: [
          'Higher Daily Earning',
          'More Daily Tasks',
          'Better Referral Rewards',
          'Fast Withdrawal',
          'Priority Support',
          'Direct commission',
          'Indirect commission'
        ]
      },
      {
        icon: '💎',
        name: 'Diamond',
        price: 20,
        desc: 'Grow Your Income Faster',
        buttonLabel: 'Get Started',
        features: [
          'Increased Daily Earning',
          'Higher Referral Bonuses',
          'Premium Features',
          'Priority Withdrawal',
          'Direct commission',
          'Indirect commission',
          '24/7 Support'
        ]
      },
      {
        icon: '🟣',
        name: 'Pro',
        price: 30,
        desc: 'For Serious Earners',
        buttonLabel: 'Get Started',
        features: [
          'High Daily Earnings',
          'Bigger Referral Rewards',
          'Advanced Features',
          'Faster Withdrawals',
          'Premium Support',
          'Direct commission',
          'Indirect commission'
        ]
      },
      {
        icon: '👑',
        name: 'Premium',
        price: 40,
        desc: 'Maximum Value & Benefits',
        buttonLabel: 'Get Started',
        features: [
          'Excellent Daily Earnings',
          'Exclusive Rewards',
          'VIP Benefits',
          'Priority Support',
          'Fast Withdrawals',
          'Direct commission',
          'Indirect commission',
          'Downline Commission'
        ]
      },
      {
        icon: '🌟',
        name: 'Legend',
        price: 50,
        desc: 'Ultimate Membership Experience',
        buttonLabel: 'Join Legend',
        features: [
          'Highest Daily Earnings',
          'Maximum Referral Rewards',
          'Exclusive VIP Features',
          'Fastest Withdrawals',
          'Dedicated Premium Support',
          'Direct commission',
          'Indirect commission',
          'Downline Commission'
        ]
      }
    ],
    []
  )

  const products = useMemo(
    () => [
      { icon: '👟', name: 'Cherry loafers', desc: 'Premium edition loafers', price: 'Rs 3,000' },
      { icon: '🎧', name: 'Wireless earbuds', desc: 'Noise-isolating, 20h battery', price: 'Rs 4,500' },
      { icon: '⌚', name: 'Classic watch', desc: 'Stainless steel, water resistant', price: 'Rs 6,200' },
      { icon: '🎒', name: 'Travel backpack', desc: 'Weatherproof, 30L capacity', price: 'Rs 3,800' }
    ],
    []
  )

  const spinPrizes = useMemo(
    () => [
      { label: '1$', icon: '💵', color: '#caa84d' },
      { label: '2$', icon: '💵', color: '#d08a28' },
      { label: '3$', icon: '💵', color: '#c54d3f' },
      { label: 'Smart watch', icon: '⌚', color: '#6b63e6' },
      { label: '4$', icon: '💵', color: '#5aa17a' },
      { label: '5$', icon: '💵', color: '#58a0c7' },
      { label: 'Airpods', icon: '🎧', color: '#7b56e8' },
      { label: 'Laptop', icon: '💻', color: '#d34588' },
      { label: 'Android mobile', icon: '📱', color: '#3ecf8e' },
      { label: '1$', icon: '💵', color: '#caa84d' },
      { label: '2$', icon: '💵', color: '#d08a28' },
      { label: '3$', icon: '💵', color: '#c54d3f' }
    ],
    []
  )

  const spinGradient = useMemo(
    () => `conic-gradient(${spinPrizes.map((prize, index) => `${prize.color} ${index * 30}deg ${(index + 1) * 30}deg`).join(', ')})`,
    [spinPrizes]
  )

  const levels = useMemo(
    () =>
      Array.from({ length: 50 }, (_, index) => {
        const level = index + 1
        const isMilestone = level % 10 === 0
        const membersRequired = level === 1 ? 2 : level < 10 ? level + 1 : level

        return {
          level,
          isMilestone,
          membersRequired,
          rewardLabel: isMilestone ? `$${level * 10} + prize pack` : null,
          salaryLabel: isMilestone ? `$${level * 10} monthly salary` : null
        }
      }),
    []
  )

  const currentLevel = useMemo(() => {
    let lvl = 0
    for (let i = 0; i < levels.length; i++) {
      if (teamData.totalMembers >= levels[i].membersRequired) {
        lvl = levels[i].level
      } else {
        break
      }
    }
    return lvl
  }, [teamData.totalMembers, levels])

  const levelBadgeClass = (level) => {
    const palette = ['level-blue', 'level-green', 'level-red', 'level-amber', 'level-gold']
    return palette[(level - 1) % palette.length]
  }

  const showToast = (msg) => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 2600)
  }

  useLayoutEffect(() => {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('user')
      if (!user) {
        router.replace('/login')
        return
      }
    }

    const storedProfile = loadStoredProfile()
    setProfile(storedProfile)
    setProfileDraft(storedProfile)
    if (storedProfile.name) setCoName(storedProfile.name)
    profileReady.current = true
  }, [router])

  useEffect(() => {
    if (profile && profile.phone) {
      const loadTeamData = async () => {
        try {
          const response = await fetch(`/api/user/team?userId=${profile.phone}`)
          if (response.ok) {
            const data = await response.json()
            setTeamData(data)
          }
        } catch (error) {
          console.warn('Error loading team data:', error)
        }
      }
      loadTeamData()
    }
  }, [profile])

  // Fetch user's profile and active plan from DB
  useEffect(() => {
    if (!profile || !profile.phone) return
    const fetchActivePlan = async () => {
      try {
        const res = await fetch(`/api/user/profile?phone=${encodeURIComponent(profile.phone)}&_t=${Date.now()}`)
        if (res.ok) {
          const data = await res.json()
          // Update profile state with live database values
          setProfile(prev => ({
            ...prev,
            ...data
          }))
          const activePlan = [...(data.investmentPlans || [])].reverse().find(p => p.status === 'active')
          const planName = activePlan ? activePlan.planName : 'Free'
          setActivePlanName(planName)
          localStorage.setItem('hmh-active-plan', planName)
        }
      } catch { }
    }
    fetchActivePlan()
  }, [profile.phone])

  useEffect(() => {
    if (!profile || !profile.createdAt) return
    const updateCountdown = () => {
      const joinTime = new Date(profile.createdAt).getTime()
      const now = Date.now()
      const cycleMs = 24 * 60 * 60 * 1000 // 24 hours
      const msSinceJoined = now - joinTime
      const currentCycleIndex = Math.max(0, Math.floor(msSinceJoined / cycleMs))
      const currentCycleStart = joinTime + (currentCycleIndex * cycleMs)
      const currentCycleEnd = currentCycleStart + cycleMs
      const msRemaining = Math.max(0, currentCycleEnd - now)

      // Format remaining time as hh:mm:ss
      const hours = Math.floor(msRemaining / (3600 * 1000))
      const minutes = Math.floor((msRemaining % (3600 * 1000)) / (60 * 1000))
      const seconds = Math.floor((msRemaining % (60 * 1000)) / 1000)
      
      const formatNum = (num) => String(num).padStart(2, '0')
      setSpinCountdown(`${formatNum(hours)}h ${formatNum(minutes)}m ${formatNum(seconds)}s`)

      // Check how many referrals joined in this cycle
      const cycleInvites = (teamData.levelA?.members || []).filter(member => {
        const joinDate = new Date(member.joinDate).getTime()
        return joinDate >= currentCycleStart && joinDate < currentCycleEnd
      }).length
      setCurrentCycleInvites(cycleInvites)

      // Check if user has already spun in this cycle
      const lastSpunCycle = localStorage.getItem(`hmh-last-spin-cycle-${profile.phone}`)
      setHasSpunThisCycle(lastSpunCycle === String(currentCycleIndex))
    }

    updateCountdown()
    const timer = setInterval(updateCountdown, 1000)
    return () => clearInterval(timer)
  }, [profile, teamData])

  useEffect(() => {
    const savedSpinAngle = localStorage.getItem('hmh-spin-angle')
    const savedSpinResult = localStorage.getItem('hmh-spin-result')
    if (savedSpinAngle) {
      const parsedAngle = Number(savedSpinAngle) || 0
      spinAngleRef.current = parsedAngle
      setSpinAngle(parsedAngle)
    }
    if (savedSpinResult) setSpinResult(savedSpinResult)

    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current)
      if (spinTimer.current) clearInterval(spinTimer.current)
    }
  }, [])

  useEffect(() => {
    if (!profileSaved) return
    const timer = setTimeout(() => setProfileSaved(false), 2200)
    return () => clearTimeout(timer)
  }, [profileSaved])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPage = localStorage.getItem('hmh-active-page')
      if (savedPage) {
        setPage(savedPage)
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || !profileReady.current) return
    window.localStorage.setItem('hmh-profile', JSON.stringify(profile))
  }, [profile])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem('hmh-spin-angle', String(spinAngle))
    window.localStorage.setItem('hmh-spin-result', spinResult)
  }, [spinAngle, spinResult])

  const goTo = (id) => {
    if (id === 'admin') {
      router.push('/admin')
      setSidebarOpen(false)
      setBellOpen(false)
      return
    }
    setPage(id)
    if (typeof window !== 'undefined') {
      localStorage.setItem('hmh-active-page', id)
    }
    setSidebarOpen(false)
    setBellOpen(false)
    try {
      window.scrollTo(0, 0)
    } catch { }
  }

  const topbarTitle = NAV.find((n) => n.id === page)?.label ?? 'HMHPro'

  const submitWithdrawal = () => {
    if (!wdAmount || !wdMethod || !wdName || !wdAccount) {
      showToast('Please fill in every field')
      return
    }
    setWithdrawHistory((prev) => [
      { id: globalThis.crypto?.randomUUID?.() ?? String(Date.now()), amount: Number(wdAmount), method: wdMethod, status: 'Pending' },
      ...prev
    ])
    setWdAmount('')
    setWdMethod('')
    setWdName('')
    setWdAccount('')
    showToast('Withdrawal request submitted')
  }

  const copyRefLink = async () => {
    const idStr = (profile._id || '').toString()
    const shortId = idStr.length >= 8 ? idStr.slice(-8) : profile.phone
    const link = typeof window !== 'undefined' ? `${window.location.origin}/register?ref=${shortId}` : ''
    try {
      await navigator.clipboard.writeText(link)
    } catch { }
    showToast('Referral link copied')
  }

  const openCheckout = (p) => {
    setCheckoutProduct(p)
    setCheckoutOpen(true)
  }

  const openPlanModal = async (plan) => {
    setSelectedPlanData(plan)
    setPlanPaymentMethod('jazzcash')
    setPlanScreenshot(null)
    setPlanScreenshotName('')
    setPlanModalOpen(true)
    // Load payment details from DB
    try {
      const res = await fetch('/api/settings?key=paymentDetails')
      if (res.ok) {
        const data = await res.json()
        if (data && data.value) {
          setPlanPaymentDetails(data.value)
        }
      }
    } catch { }
  }

  const submitPlanRequest = async () => {
    if (!selectedPlanData) return
    if (!planScreenshot) {
      showToast('Please upload a payment screenshot')
      return
    }
    setPlanSubmitting(true)
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      // Calculate upgrade difference
      const currentPlanPrice = plans.find(p => p.name.toLowerCase() === activePlanName.toLowerCase())?.price || 0
      const newPlanPKR = selectedPlanData.price * PKR_RATE
      const currentPlanPKR = currentPlanPrice * PKR_RATE
      const amountToPay = activePlanName === 'Free' ? newPlanPKR : Math.max(0, newPlanPKR - currentPlanPKR)
      const formData = new FormData()
      formData.append('userId', user._id || user.phone || '')
      formData.append('userPhone', user.phone || '')
      formData.append('planName', selectedPlanData.name)
      formData.append('previousPlan', activePlanName)
      formData.append('amount', amountToPay)
      formData.append('fullPlanPKR', newPlanPKR)
      formData.append('paymentMethod', planPaymentMethod === 'jazzcash' ? 'JazzCash' : 'EasyPaisa')
      formData.append('screenshot', planScreenshot)
      const res = await fetch('/api/user/plan-request', {
        method: 'POST',
        body: formData
      })
      if (res.ok) {
        setPlanModalOpen(false)
        showToast('Plan request submitted! Admin will activate your plan shortly.')
      } else {
        const err = await res.json().catch(() => ({}))
        showToast(err.message || 'Submission failed. Please try again.')
      }
    } catch {
      showToast('Submission failed. Please try again.')
    } finally {
      setPlanSubmitting(false)
    }
  }

  const confirmOrder = () => {
    if (!coPhone || !coAddress) {
      showToast('Please add your phone and address')
      return
    }
    setCheckoutOpen(false)
    setCheckoutProduct(null)
    showToast('Order placed — this is a preview, no payment was charged')
  }

  const startSpin = () => {
    if (spinRunning) return
    setSpinRunning(true)
    setSpinResult('Spinning...')
    if (spinTimer.current) clearInterval(spinTimer.current)
    spinTimer.current = setInterval(() => {
      setSpinAngle((current) => {
        const next = (current + 18) % 360
        spinAngleRef.current = next
        return next
      })
    }, 40)
  }

  const stopSpin = () => {
    if (!spinRunning) return
    if (spinTimer.current) clearInterval(spinTimer.current)
    spinTimer.current = null
    setSpinRunning(false)

    // Always land on 1$ (index 0 or 9) or 2$ (index 1 or 10)
    const winningIndices = [0, 1, 9, 10]
    const chosenIndex = winningIndices[Math.floor(Math.random() * winningIndices.length)]
    const prize = spinPrizes[chosenIndex]
    setSpinResult(prize.label)

    // Compute final angle so pointer lands exactly on chosen sector
    // (360 - (chosenIndex*30 + 15)) centers pointer in the middle of that sector
    const baseRotations = Math.ceil(Math.abs(spinAngleRef.current) / 360) * 360 + 720
    const targetSectorAngle = (360 - (chosenIndex * 30 + 15) + 360) % 360
    const finalAngle = baseRotations + targetSectorAngle
    spinAngleRef.current = finalAngle
    setSpinAngle(finalAngle)
    showToast(`🎉 You won ${prize.label}!`)

    // Save last spun cycle to localStorage to lock it until reset
    if (profile && profile.createdAt) {
      const joinTime = new Date(profile.createdAt).getTime()
      const cycleMs = 24 * 60 * 60 * 1000
      const currentCycleIndex = Math.max(0, Math.floor((Date.now() - joinTime) / cycleMs))
      localStorage.setItem(`hmh-last-spin-cycle-${profile.phone}`, String(currentCycleIndex))
      setHasSpunThisCycle(true)
    }
  }

  const resetSpin = () => {
    if (spinTimer.current) clearInterval(spinTimer.current)
    spinTimer.current = null
    setSpinRunning(false)
    setSpinAngle(0)
    spinAngleRef.current = 0
    setSpinResult('Locked')
    showToast('Spin reset')
  }

  const saveProfile = () => {
    const nextProfile = { ...profileDraft }
    setProfile(nextProfile)
    setProfileDraft(nextProfile)
    setCoName(nextProfile.name || '')
    setProfileSaved(true)
    showToast('Profile saved')

    try {
      localStorage.setItem('hmh-profile', JSON.stringify(nextProfile))
      const userData = localStorage.getItem('user')
      if (userData) {
        const user = JSON.parse(userData)
        localStorage.setItem('user', JSON.stringify({ ...user, name: nextProfile.name, email: nextProfile.email }))
      }
    } catch { }
  }

  useEffect(() => {
    if (page === 'profile') setProfileDraft(profile)
  }, [page, profile])

  const avatarInitial = (profile.name || 'A').trim().charAt(0).toUpperCase()
  const membershipName = profile.name || 'Alex Rivera'
  const membershipUsername = profile.username || 'alex_rivera'
  const membershipEmail = profile.email || 'alex.rivera@example.com'

  const streakDots = useMemo(() => Array.from({ length: 10 }), [])

  return (
    <div className="meridian">
      <div className="app">
        <div className={`overlay ${sidebarOpen ? 'show' : ''}`} onClick={() => setSidebarOpen(false)} />

        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="brand">
            <img
              src="/logo.jpg"
              alt="HMHPro Logo"
              style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--gold)' }}
            />
            <div>
              <div className="brand-name">HMHPro</div>
              <div className="brand-sub">Learn · Earn · Grow</div>
            </div>
            <button className="sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
              ×
            </button>
          </div>

          <nav className="nav">
            {NAV.map((item) => (
              <a
                key={item.id}
                href="#"
                className={`nav-item ${page === item.id ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault()
                  goTo(item.id)
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d={item.icon} />
                </svg>
                <span>{item.label}</span>
              </a>
            ))}

            <div className="nav-divider" />

            <a
              href="#"
              className="nav-item"
              style={{ color: 'var(--red)' }}
              onClick={(e) => {
                e.preventDefault()
                localStorage.removeItem('user')
                localStorage.removeItem('hmh-profile')
                localStorage.removeItem('hmh-active-page')
                localStorage.removeItem('hmh-active-plan')
                router.replace('/login')
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
              <span>Logout</span>
            </a>
          </nav>
        </aside>

        <div className="main">
          <div className="topbar">
            <button className="hamburger" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
            </button>

            <div className="topbar-title">{topbarTitle}</div>

            <div className="bell-wrap">
              <button className="bell" onClick={() => setBellOpen((v) => !v)} aria-label="Notifications">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                  <path d="M10 21a2 2 0 0 0 4 0" />
                </svg>
                <span className="dot" />
              </button>

              <div className={`bell-panel ${bellOpen ? 'show' : ''}`}>
                <div className="bell-item">
                  <b>Streak reminder</b>
                  <br />
                  Invite a member today to keep your streak alive.
                </div>
                <div className="bell-item">
                  <b>Leaderboard update</b>
                  <br />
                  Top 10 refreshes every 24 hours.
                </div>
                <div className="bell-item">
                  <b>New tier unlocked</b>
                  <br />
                  Diamond plan now includes faster withdrawals.
                </div>
              </div>
            </div>
          </div>

          {/* DASHBOARD */}
          <section className={`page ${page === 'dashboard' ? 'active' : ''}`}>
            <div className="card profile-card">
              <div className="avatar-ring">{avatarInitial}</div>
              <div className="profile-meta">
                <div className="eyebrow">Welcome to HMHPro</div>
                <h2>{profile.name || 'Member'}</h2>
                <div className="uid">ID: {profile._id ? profile._id.substring(profile._id.length - 8) : (profile.phone ? profile.phone.substring(Math.max(0, profile.phone.length - 8)) : '7f19c3e2')}</div>
                <div className="badge-row">
                  <span className="badge gold" style={{ background: activePlanName === 'Free' ? 'rgba(255,255,255,0.08)' : 'rgba(201,160,74,0.18)', color: activePlanName === 'Free' ? 'var(--text-dim)' : 'var(--gold-bright)', border: activePlanName === 'Free' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(201,160,74,0.4)' }}>
                    {activePlanName === 'Free' ? '🆓 Free' : `⭐ ${activePlanName} Plan`}
                  </span>
                  <span className="badge gold">Level {currentLevel}</span>
                </div>
              </div>
            </div>

            <div className="stat-grid">
              <div className="card stat-card">
                <div className="stat-icon" style={{ background: 'rgba(79,174,130,.12)' }}>💵</div>
                <div>
                  <div className="stat-label">Current balance</div>
                  <div className="stat-value">${((profile.balance || 0) / PKR_RATE).toFixed(2)}</div>
                </div>
              </div>
              <div className="card stat-card">
                <div className="stat-icon" style={{ background: 'rgba(91,127,214,.12)' }}>💼</div>
                <div>
                  <div className="stat-label">Total earnings</div>
                  <div className="stat-value">${(((profile.earnBalance || 0) + (profile.totalCommissionEarned || 0)) / PKR_RATE).toFixed(2)}</div>
                </div>
              </div>
              <div className="card stat-card">
                <div className="stat-icon" style={{ background: 'rgba(201,160,74,.12)' }}>🎁</div>
                <div>
                  <div className="stat-label">My rewards</div>
                  <div className="stat-value">${((profile.totalCommissionEarned || 0) / PKR_RATE).toFixed(2)}</div>
                </div>
              </div>
              <div className="card stat-card">
                <div className="stat-icon" style={{ background: 'rgba(201,160,74,.12)' }}>📈</div>
                <div>
                  <div className="stat-label">My salary</div>
                  <div className="stat-value">$0.00</div>
                </div>
              </div>
              <div className="card stat-card">
                <div className="stat-icon" style={{ background: 'rgba(196,87,74,.12)' }}>📤</div>
                <div>
                  <div className="stat-label">Total withdrawals</div>
                  <div className="stat-value">${(((profile.withdrawHistory || [])
                    .filter(w => w.status === 'approved' || w.status === 'completed')
                    .reduce((sum, w) => sum + w.amount, 0)) / PKR_RATE).toFixed(2)}</div>
                </div>
              </div>
            </div>

            <div className="card streak-card">
              <div className="streak-top">
                <h3>🔥 Referral streak</h3>
                <span className="streak-pill">Day {teamData.totalMembers} / 10</span>
              </div>
              <div className="dots-row">
                {streakDots.map((_, i) => (
                  <div key={i} className={`streak-dot ${i < teamData.totalMembers ? 'active' : ''}`} />
                ))}
              </div>
              <div className="streak-note">
                {teamData.totalMembers > 0
                  ? `Your streak is active! You have referred ${teamData.totalMembers} approved member(s).`
                  : 'Start your streak — invite 1 member today.'
                }
              </div>
              <div className="streak-note">Complete a 10-day streak to earn a $10 bonus reward.</div>
            </div>

            <div className="card" style={{ marginBottom: 18 }}>
              <h3 style={{ margin: '0 0 4px' }}>🎁 Mystery boxes</h3>
              <p style={{ margin: '0 0 16px', color: 'var(--text-dim)', fontSize: 13 }}>
                Stay in the Top 3 of the leaderboard for 15 days to claim.
              </p>
              <div className="mystery-grid">
                {[
                  { medal: '🥇', title: 'Top 1 box', sub: 'Best mystery box' },
                  { medal: '🥈', title: 'Top 2 box', sub: 'Great mystery box' },
                  { medal: '🥉', title: 'Top 3 box', sub: 'Small mystery box' }
                ].map((b) => (
                  <div key={b.title} className="card mystery-card">
                    <div className="mystery-medal">{b.medal}</div>
                    <div className="mystery-title">{b.title}</div>
                    <div className="mystery-sub">{b.sub}</div>
                    <div className="lock-pill">🔒 Locked · 15-day streak</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 style={{ margin: '0 0 4px' }}>🏆 Top 10 leaderboard</h3>
              <p style={{ margin: '0 0 16px', color: 'var(--text-dim)', fontSize: 13 }}>
                Ranked by total earnings.
              </p>
              <div>
                {leaders.map((u, i) => (
                  <div key={u.name} className={`leader-row ${i < 3 ? `rank${i + 1}` : ''}`}>
                    <div className="leader-rank">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}</div>
                    <div className="leader-avatar">{u.name[0]}</div>
                    <div>
                      <div className="leader-name">{u.name}</div>
                      <div className="leader-level">Level {u.level}</div>
                    </div>
                    <div className="leader-amt">${u.amt.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* WITHDRAW */}
          <section className={`page ${page === 'withdraw' ? 'active' : ''}`}>
            <div className="page-head">
              <h1>Withdraw funds</h1>
              <p>Move your earnings to your preferred payout method.</p>
            </div>

            <div className="card balance-strip">
              <span style={{ color: 'var(--text-dim)', fontSize: 14 }}>Available balance</span>
              <span className="amt">$0.00</span>
            </div>

            <div className="card" style={{ marginBottom: 18 }}>
              <h3 style={{ margin: '0 0 4px' }}>New withdrawal</h3>
              <p style={{ margin: 0, color: 'var(--text-faint)', fontSize: 12.5 }}>Max: $0.00</p>

              <label>Amount ($)</label>
              <input type="number" value={wdAmount} onChange={(e) => setWdAmount(e.target.value)} placeholder="Enter amount" />

              <label>Payment method</label>
              <select value={wdMethod} onChange={(e) => setWdMethod(e.target.value)}>
                <option value="">Select payment method</option>
                <option>Easy Paisa</option>
                <option>Jazzcash</option>
                <option>SadaPay</option>
                <option>Bank transfer</option>
                <option>Binance</option>
              </select>

              <label>Account holder name</label>
              <input value={wdName} onChange={(e) => setWdName(e.target.value)} placeholder="Account holder name" />

              <label>Account number</label>
              <input value={wdAccount} onChange={(e) => setWdAccount(e.target.value)} placeholder="Enter account number" />

              <div style={{ marginTop: 18 }}>
                <button className="btn btn-gold" onClick={submitWithdrawal}>
                  Submit withdrawal
                </button>
              </div>
            </div>

            <div className="card">
              <h3 style={{ margin: '0 0 14px' }}>Withdrawal history</h3>
              {withdrawHistory.length === 0 ? (
                <div className="empty-state">No withdrawals yet. Once you request one, it'll show up here.</div>
              ) : (
                withdrawHistory.map((h) => (
                  <div key={h.id} className="history-row">
                    <span>
                      ${Number(h.amount).toFixed(2)} · {h.method}
                    </span>
                    <span className="history-status status-pending">{h.status}</span>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* NETWORK (direct + indirect only) */}
          <section className={`page ${page === 'network' ? 'active' : ''}`}>
            <div className="page-head">
              <h1>My network</h1>
              <p>Grow your team to unlock higher tiers and bonuses.</p>
            </div>

            <div className="stat-pair">
              <div className="card stat-card">
                <div className="stat-icon" style={{ background: 'rgba(201,160,74,.12)' }}>👤</div>
                <div>
                  <div className="stat-label">Direct referrals</div>
                  <div className="stat-value">{teamData.levelA.count}</div>
                </div>
              </div>
              <div className="card stat-card">
                <div className="stat-icon" style={{ background: 'rgba(91,127,214,.12)' }}>🔗</div>
                <div>
                  <div className="stat-label">Indirect referrals</div>
                  <div className="stat-value">0</div>
                </div>
              </div>
            </div>

            <div className="card" style={{ marginBottom: 18 }}>
              <label style={{ marginTop: 0 }}>Your referral link</label>
              <div className="link-row">
                <input type="text" value={(() => { const idStr = (profile._id || '').toString(); const shortId = idStr.length >= 8 ? idStr.slice(-8) : (profile.phone || ''); return typeof window !== 'undefined' ? `${window.location.origin}/register?ref=${shortId}` : '' })()} readOnly />
                <button onClick={copyRefLink}>Copy</button>
              </div>
            </div>

            <div className="card" style={{ marginBottom: 18 }}>
              <h3 style={{ margin: '0 0 14px' }}>👤 Direct referrals ({teamData.levelA.count})</h3>
              {teamData.levelA.members.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {teamData.levelA.members.map((member, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--line)' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text)' }}>{member.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{member.phone}</div>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-dim)', alignSelf: 'center' }}>
                        Joined: {new Date(member.joinDate).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">No direct referrals yet. Share your link to start building your team.</div>
              )}
            </div>

            <div className="card">
              <h3 style={{ margin: '0 0 14px' }}>🔗 Indirect referrals (0)</h3>
              <div className="empty-state">No indirect referrals yet — these appear once your direct referrals invite others.</div>
            </div>
          </section>

          {/* PLANS */}
          <section className={`page ${page === 'plans' ? 'active' : ''}`}>
            <div className="page-head">
              <h1>Upgrade plan</h1>
              <p>Choose a plan to start earning daily.</p>
              {activePlanName !== 'Free' && (
                <div style={{
                  marginTop: 10,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'rgba(34,197,94,0.12)',
                  border: '1px solid rgba(34,197,94,0.3)',
                  borderRadius: 20,
                  padding: '6px 16px',
                  fontSize: 13,
                  color: '#22c55e',
                  fontWeight: 600
                }}>
                  ✅ Your active plan: <strong>{activePlanName}</strong>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: 16 }}>
              {plans.map((p) => {
                const isActive = activePlanName !== 'Free' && activePlanName.toLowerCase() === p.name.toLowerCase()
                const hasAnyPlan = activePlanName !== 'Free'
                return (
                  <div
                    key={p.name}
                    className="card"
                    style={{
                      textAlign: 'center',
                      position: 'relative',
                      borderColor: isActive
                        ? 'rgba(34,197,94,0.5)'
                        : p.featured ? 'rgba(201,160,74,.4)' : undefined,
                      boxShadow: isActive
                        ? '0 0 0 2px rgba(34,197,94,0.2) inset, 0 0 24px rgba(34,197,94,0.08)'
                        : p.featured ? '0 0 0 1px rgba(201,160,74,.15) inset' : undefined,
                      opacity: hasAnyPlan && !isActive ? 0.75 : 1
                    }}
                  >
                    {/* Active badge */}
                    {isActive ? (
                      <div style={{
                        position: 'absolute',
                        top: -11,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: '#22c55e',
                        color: '#fff',
                        fontSize: 10.5,
                        fontWeight: 800,
                        padding: '3px 12px',
                        borderRadius: 20,
                        letterSpacing: '.05em',
                        whiteSpace: 'nowrap'
                      }}>
                        ✅ Active Plan
                      </div>
                    ) : p.featured ? (
                      <div style={{
                        position: 'absolute',
                        top: -11,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'var(--gold)',
                        color: '#181205',
                        fontSize: 10.5,
                        fontWeight: 800,
                        padding: '3px 10px',
                        borderRadius: 20,
                        letterSpacing: '.05em'
                      }}>
                        Most popular
                      </div>
                    ) : null}

                    <div style={{ fontSize: 30, marginBottom: 8 }}>{p.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{p.name}</div>
                    <div
                      style={{
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                        fontSize: 26,
                        color: isActive ? '#22c55e' : 'var(--gold-bright)',
                        fontWeight: 700,
                        margin: '8px 0 2px'
                      }}
                    >
                      ${p.price} <span style={{ fontSize: 12, color: 'var(--text-faint)', fontWeight: 500 }}>one-time</span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-dim)', margin: '4px 0 10px' }}>{p.desc}</div>
                    <ul style={{ textAlign: 'left', fontSize: 12.8, color: 'var(--text-dim)', margin: '14px 0', padding: 0, listStyle: 'none' }}>
                      {p.features.map((feat, idx) => (
                        <li key={idx} style={{ padding: '6px 0', borderBottom: idx === p.features.length - 1 ? 'none' : '1px solid var(--border-soft)' }}>
                          ✅ {feat}
                        </li>
                      ))}
                    </ul>

                    {isActive ? (
                      <button
                        className="btn"
                        disabled
                        style={{
                          width: '100%',
                          background: 'rgba(34,197,94,0.15)',
                          border: '1px solid rgba(34,197,94,0.4)',
                          color: '#22c55e',
                          cursor: 'default',
                          fontWeight: 700
                        }}
                      >
                        ✅ Active Plan
                      </button>
                    ) : (
                      <button
                        className={`btn ${p.featured ? 'btn-gold' : 'btn-ghost'}`}
                        onClick={() => openPlanModal(p)}
                      >
                        {hasAnyPlan ? 'Upgrade Plan' : p.buttonLabel}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </section>


          {/* STORE */}
          <section className={`page ${page === 'store' ? 'active' : ''}`}>
            <div className="page-head">
              <h1>E-commerce</h1>
              <p>Browse and purchase products with your HMHPro balance or card.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 16 }}>
              {products.map((p) => (
                <div key={p.name} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div style={{ height: 150, background: 'linear-gradient(135deg,#2a2116,#171b25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38 }}>
                    {p.icon}
                  </div>
                  <div style={{ padding: 16 }}>
                    <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 3 }}>{p.name}</div>
                    <div style={{ color: 'var(--text-faint)', fontSize: 12, marginBottom: 12 }}>{p.desc}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace', fontWeight: 700, color: 'var(--gold-bright)' }}>
                        {p.price}
                      </span>
                      <button
                        style={{ background: 'var(--gold)', color: '#181205', border: 'none', borderRadius: 8, padding: '8px 14px', fontWeight: 700, fontSize: 12.5 }}
                        onClick={() => openCheckout(p)}
                      >
                        Buy now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* LEVELS */}
          <section className={`page ${page === 'levels' ? 'active' : ''}`}>
            <div className="levels-page">
              <div className="levels-hero page-head">
                <h1>Rewards &amp; levels</h1>
                <p>Track your progress and unlock rewards from level 1 to 50.</p>
              </div>

              <div className="levels-summary">
                <div className="levels-summary-head">
                  <h3 className="levels-summary-title">
                    <span className="levels-summary-icon">🏆</span>
                    <span>Current level</span>
                  </h3>
                  <span className="streak-pill">Level {currentLevel} / 50</span>
                </div>
                <div className="levels-summary-grid">
                  <div>
                    <div className="levels-summary-number">{currentLevel}</div>
                    <div className="levels-summary-sub">{teamData.totalMembers} referral{teamData.totalMembers === 1 ? '' : 's'} made</div>
                  </div>
                  <div>
                    <div className="level-bar">
                      <div
                        className="level-bar-fill"
                        style={{ width: `${Math.min(100, Math.round((currentLevel / 50) * 100))}%` }}
                      />
                    </div>
                    <div className="levels-summary-footer">
                      <span className="levels-summary-meta">
                        <span>Overall progress</span>
                      </span>
                      <span>{Math.min(100, Math.round((currentLevel / 50) * 100))}%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card levels-rewards-card">
                <h3 style={{ margin: '0 0 4px' }}>Big rewards await</h3>
                <p style={{ margin: '0 0 16px', color: 'var(--text-dim)', fontSize: 13 }}>
                  Major prizes unlock at every 10th milestone.
                </p>
                <div className="levels-reward-wall">
                  {[
                    { icon: '🎧', title: 'AirPods', level: 4 },
                    { icon: '💻', title: 'Laptop', level: 20 },
                    { icon: '📱', title: 'iPhone', level: 30 },
                    { icon: '💍', title: 'Ring', level: 40 },
                    { icon: '🚗', title: 'Car', level: 50 },
                    { icon: '✈️', title: 'Tour', level: 50 }
                  ].map((reward) => (
                    <div key={reward.title} className="reward-tile">
                      <div className="reward-icon">{reward.icon}</div>
                      <div className="reward-name">{reward.title}</div>
                      <div className="reward-level">Lv.{reward.level}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="level-list">
                {levels.map((level) => (
                  <div key={level.level} className={`level-row ${level.isMilestone ? 'milestone' : ''}`}>
                    <div className={`level-badge ${level.isMilestone ? 'level-gold' : levelBadgeClass(level.level)}`}>
                      <span>LEVEL</span>
                      <b>{level.level}</b>
                    </div>
                    <div className="level-body">
                      {level.isMilestone ? <div className="milestone-tag">⭐ Milestone level</div> : null}
                      <div className="level-req">5 Basic · 2 Standard · 2 Diamond · 2 Pro · 2 Premium · 2 Legend · {level.membersRequired} members required</div>
                      <div className="level-bar">
                        <div
                          className="level-bar-fill"
                          style={{ width: `${Math.min(100, (teamData.totalMembers / level.membersRequired) * 100)}%` }}
                        />
                      </div>
                      <div className="level-progress">
                        <span>{Math.min(level.membersRequired, teamData.totalMembers)}/{level.membersRequired} members</span>
                        <span>{Math.min(100, Math.round((teamData.totalMembers / level.membersRequired) * 100))}%</span>
                      </div>
                      {level.isMilestone ? (
                        <div className="level-rewards">
                          <span className="reward-chip">🎁 {level.rewardLabel}</span>
                          <span className="reward-chip">💰 {level.salaryLabel}</span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* SPIN */}
          <section className={`page ${page === 'spin' ? 'active' : ''}`}>
            <div className="page-head">
              <h1>Lucky spin</h1>
              <p>Invite 3 members within 24 hours to unlock your spin.</p>
            </div>

            <div className="card spin-page-card">
              <div className="spin-progress-card">
                <div className="spin-progress-copy">
                  {currentCycleInvites >= 3
                    ? (hasSpunThisCycle ? 'Already spun this cycle. Wait for the next reset.' : 'Goal achieved! Spin wheel unlocked.')
                    : `Invite ${3 - currentCycleInvites} more member${3 - currentCycleInvites === 1 ? '' : 's'} within 24 hours`
                  }
                </div>
                <div className="spin-progress-bar">
                  <div
                    className="spin-progress-fill"
                    style={{ width: `${Math.min(100, (currentCycleInvites / 3) * 100)}%` }}
                  />
                </div>
                <div className="spin-progress-meta">
                  <span>{Math.min(3, currentCycleInvites)}/3 invited</span>
                  <span>Resets in {spinCountdown}</span>
                </div>
              </div>

              <div className="spin-wheel-holder">
                <div className="spin-wheel-pointer" />
                <div className="spin-wheel" style={{ background: spinGradient, transform: `rotate(${spinAngle}deg)` }}>
                  {spinPrizes.map((prize, index) => {
                    const angle = index * 30 + 15
                    return (
                      <div
                        key={prize.label + index}
                        className="spin-wheel-label"
                        style={{ transform: `rotate(${angle}deg) translateY(-118px) rotate(${-angle}deg)` }}
                      >
                        <span className="spin-wheel-icon">{prize.icon}</span>
                        <span className="spin-wheel-text">{prize.label}</span>
                      </div>
                    )
                  })}
                </div>
                <div className="spin-wheel-hub">🎰</div>
              </div>

              <div className="spin-actions">
                <button
                  className="btn btn-gold spin-lock-btn"
                  onClick={startSpin}
                  disabled={currentCycleInvites < 3 || hasSpunThisCycle || spinRunning}
                  style={{
                    opacity: (currentCycleInvites < 3 || hasSpunThisCycle) ? 0.65 : 1,
                    cursor: (currentCycleInvites < 3 || hasSpunThisCycle) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {currentCycleInvites < 3
                    ? '🔒 Locked (Invite 3 members)'
                    : (hasSpunThisCycle ? '✅ Spun (Wait for Reset)' : (spinRunning ? 'Spinning...' : 'Start spin'))}
                </button>
                <button className="btn btn-outline spin-secondary-btn" onClick={stopSpin} disabled={!spinRunning}>
                  Stop spin
                </button>
                <button className="btn btn-ghost spin-tertiary-btn" onClick={resetSpin}>
                  Reset
                </button>
              </div>

              <div className="spin-result">Result: <b>{spinResult}</b></div>

              <p className="spin-note">The wheel now moves and stops in-app. Use Start spin, then Stop spin to land on a prize.</p>
            </div>
          </section>

          {/* MEMBERSHIP */}
          <section className={`page ${page === 'membership' ? 'active' : ''}`}>
            <div className="page-head">
              <h1>Membership card</h1>
              <p>Your digital identity across the HMHPro network.</p>
            </div>

            <div className="membership-shell">
              {(() => {
                const theme = (() => {
                  switch (activePlanName.toLowerCase()) {
                    case 'basic':
                      return {
                        background: 'radial-gradient(380px 180px at 100% 0%, rgba(34,197,94,.2), transparent 55%), linear-gradient(135deg, #052e16 0%, #022c22 58%, #0b0f19 100%)',
                        border: '1px solid rgba(34,197,94,.35)',
                        boxShadow: '0 18px 50px rgba(0,0,0,.38), 0 0 0 1px rgba(34,197,94,.08) inset',
                        brandColor: '#4ade80',
                        chipBg: 'linear-gradient(135deg, #4ade80 0%, #15803d 100%)'
                      }
                    case 'standard':
                      return {
                        background: 'radial-gradient(380px 180px at 100% 0%, rgba(59,130,246,.25), transparent 55%), linear-gradient(135deg, #1e3a8a 0%, #0f172a 58%, #0f172a 100%)',
                        border: '1px solid rgba(59,130,246,.4)',
                        boxShadow: '0 18px 50px rgba(0,0,0,.45), 0 0 0 1px rgba(59,130,246,.12) inset',
                        brandColor: '#60a5fa',
                        chipBg: 'linear-gradient(135deg, #60a5fa 0%, #1d4ed8 100%)'
                      }
                    case 'diamond':
                      return {
                        background: 'radial-gradient(380px 180px at 100% 0%, rgba(6,182,212,.3), transparent 55%), linear-gradient(135deg, #0e7490 0%, #0891b2 58%, #0b132b 100%)',
                        border: '1px solid rgba(6,182,212,.5)',
                        boxShadow: '0 18px 50px rgba(6,182,212,.18), 0 0 0 1px rgba(6,182,212,.15) inset',
                        brandColor: '#22d3ee',
                        chipBg: 'linear-gradient(135deg, #22d3ee 0%, #0891b2 100%)'
                      }
                    case 'pro':
                      return {
                        background: 'radial-gradient(380px 180px at 100% 0%, rgba(139,92,246,.3), transparent 55%), linear-gradient(135deg, #4c1d95 0%, #2e1065 58%, #0c0a0f 100%)',
                        border: '1px solid rgba(139,92,246,.45)',
                        boxShadow: '0 18px 50px rgba(139,92,246,.15), 0 0 0 1px rgba(139,92,246,.1) inset',
                        brandColor: '#a78bfa',
                        chipBg: 'linear-gradient(135deg, #a78bfa 0%, #6d28d9 100%)'
                      }
                    case 'premium':
                      return {
                        background: 'radial-gradient(380px 180px at 100% 0%, rgba(245,158,11,.3), transparent 55%), linear-gradient(135deg, #78350f 0%, #451a03 58%, #0c0a09 100%)',
                        border: '1px solid rgba(245,158,11,.45)',
                        boxShadow: '0 18px 50px rgba(245,158,11,.15), 0 0 0 1px rgba(245,158,11,.1) inset',
                        brandColor: '#fbbf24',
                        chipBg: 'linear-gradient(135deg, #fbbf24 0%, #b45309 100%)'
                      }
                    case 'legend':
                      return {
                        background: 'radial-gradient(380px 180px at 100% 0%, rgba(201,160,74,.35), transparent 55%), linear-gradient(135deg, #1c1917 0%, #0c0a09 58%, #000000 100%)',
                        border: '1px solid rgba(201,160,74,.6)',
                        boxShadow: '0 24px 60px rgba(201,160,74,.25), 0 0 0 2px rgba(201,160,74,.2) inset',
                        brandColor: '#f59e0b',
                        chipBg: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)'
                      }
                    default: // Free / Unranked
                      return {
                        background: 'radial-gradient(380px 180px at 100% 0%, rgba(201,160,74,.16), transparent 55%), linear-gradient(135deg, #17120c 0%, #0d1016 58%, #10151d 100%)',
                        border: '1px solid rgba(201,160,74,.24)',
                        boxShadow: '0 18px 50px rgba(0,0,0,.38), 0 0 0 1px rgba(201,160,74,.04) inset',
                        brandColor: 'var(--gold-bright)',
                        chipBg: 'linear-gradient(135deg, #d9ba63 0%, #a47f2e 100%)'
                      }
                  }
                })()

                const joinYear = profile.createdAt ? new Date(profile.createdAt).getFullYear() : 2026

                return (
                  <div className="mem-card" style={{ background: theme.background, borderColor: theme.border, boxShadow: theme.boxShadow }}>
                    <div className="mem-top">
                      <div className="mem-brand" style={{ color: theme.brandColor }}>HMHPro</div>
                      <div className="mem-chip" style={{ background: theme.chipBg }} aria-hidden="true" />
                    </div>

                    <div className="mem-name">{profile.name || 'Member'}</div>
                    <div className="mem-id">{profile._id ? `HMH-${profile._id.substring(profile._id.length - 8).toUpperCase()}` : (profile.phone ? `HMH-${profile.phone.substring(Math.max(0, profile.phone.length - 8))}` : '7F19 C3E2 0091')}</div>

                    <div className="mem-bottom">
                      <div className="mem-col">
                        <div className="mem-label">Tier</div>
                        <div className="mem-val" style={{ color: theme.brandColor, fontWeight: 700 }}>{activePlanName === 'Free' ? 'Unranked' : activePlanName}</div>
                      </div>
                      <div className="mem-col">
                        <div className="mem-label">Level</div>
                        <div className="mem-val">{currentLevel}</div>
                      </div>
                      <div className="mem-col">
                        <div className="mem-label">Member since</div>
                        <div className="mem-val">{joinYear}</div>
                      </div>
                    </div>
                  </div>
                )
              })()}
            </div>
          </section>

          {/* PROFILE */}
          <section className={`page ${page === 'profile' ? 'active' : ''}`}>
            <div className="page-head">
              <h1>Profile settings</h1>
              <p>Update your personal information.</p>
            </div>

            <div className="profile-shell">
              <div className="card profile-edit-card">
                <div className="profile-avatar-wrap">
                  <div className="avatar-ring profile-avatar-large">{avatarInitial}</div>
                </div>

                <label>Full name</label>
                <input type="text" value={profileDraft.name} onChange={(e) => setProfileDraft((prev) => ({ ...prev, name: e.target.value }))} />

                <label>Email</label>
                <input type="text" value={profileDraft.email} onChange={(e) => setProfileDraft((prev) => ({ ...prev, email: e.target.value }))} />

                <label>Username</label>
                <input type="text" value={profileDraft.username} onChange={(e) => setProfileDraft((prev) => ({ ...prev, username: e.target.value }))} placeholder="Choose a unique username" />

                <label>City</label>
                <input type="text" value={profileDraft.city} onChange={(e) => setProfileDraft((prev) => ({ ...prev, city: e.target.value }))} placeholder="Enter your city" />

                <label>Address</label>
                <textarea value={profileDraft.address} onChange={(e) => setProfileDraft((prev) => ({ ...prev, address: e.target.value }))} placeholder="Enter your address" />

                <button type="button" className="btn btn-gold profile-save-btn" onClick={saveProfile}>
                  {profileSaved ? 'Saved' : 'Save changes'}
                </button>
              </div>
            </div>
          </section>

          {/* Placeholders (so sidebar works) */}
          {['admin'].map((id) => (
            <section key={id} className={`page ${page === id ? 'active' : ''}`}>
              <div className="page-head">
                <h1>{NAV.find((n) => n.id === id)?.label}</h1>
                <p>Preview build — we’ll wire real data next.</p>
              </div>
              <div className="card empty-state">This section is in progress.</div>
            </section>
          ))}
        </div>
      </div>

      {/* Checkout modal */}
      <div className={`modal-bg ${checkoutOpen ? 'show' : ''}`} onClick={() => setCheckoutOpen(false)}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-head">
            <h3 style={{ margin: 0 }}>Checkout — delivery details</h3>
            <button className="modal-close" onClick={() => setCheckoutOpen(false)} aria-label="Close">
              ×
            </button>
          </div>

          <div className="modal-product">
            <div className="modal-product-img">{checkoutProduct?.icon ?? '🛒'}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13.5 }}>{checkoutProduct?.name ?? 'Product'}</div>
              <div style={{ color: 'var(--gold-bright)', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace', fontSize: 13 }}>
                {checkoutProduct?.price ?? '$0'}
              </div>
            </div>
          </div>

          <label style={{ marginTop: 0 }}>Full name</label>
          <input value={coName} onChange={(e) => setCoName(e.target.value)} />
          <label>Phone number</label>
          <input value={coPhone} onChange={(e) => setCoPhone(e.target.value)} placeholder="03XXXXXXXXX" />
          <label>Delivery address</label>
          <textarea value={coAddress} onChange={(e) => setCoAddress(e.target.value)} placeholder="Full delivery address (house, street, area, city)" />

          <div className="row-2" style={{ marginTop: 18 }}>
            <button className="btn btn-outline" onClick={() => setCheckoutOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-gold" onClick={confirmOrder}>
              Continue to payment
            </button>
          </div>
        </div>
      </div>

      {/* Plan Purchase Modal */}
      {planModalOpen && selectedPlanData && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, padding: '16px'
          }}
          onClick={() => setPlanModalOpen(false)}
        >
          <div
            style={{
              background: '#1a1f2e', borderRadius: 16, padding: '24px',
              width: '100%', maxWidth: 420, maxHeight: '90vh', overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)', position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, color: '#fff', fontSize: 18, fontWeight: 700 }}>
                💰 Upgrade to {selectedPlanData.name}
              </h3>
              <button
                onClick={() => setPlanModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#aaa', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}
              >×</button>
            </div>

            {/* Amount to Pay */}
            {(() => {
              const currentPlanPrice = plans.find(p => p.name.toLowerCase() === activePlanName.toLowerCase())?.price || 0
              const newPlanPKR = selectedPlanData.price * PKR_RATE
              const currentPlanPKR = currentPlanPrice * PKR_RATE
              const isUpgrade = activePlanName !== 'Free'
              const amountToPay = isUpgrade ? Math.max(0, newPlanPKR - currentPlanPKR) : newPlanPKR
              return (
                <div style={{ background: '#252b3b', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
                  <div style={{ color: '#aaa', fontSize: 12, marginBottom: 6 }}>
                    {isUpgrade ? `Upgrading from ${activePlanName} → ${selectedPlanData.name}` : 'Amount to Pay'}
                  </div>
                  <div style={{ color: '#c9a04a', fontSize: 28, fontWeight: 800, marginBottom: isUpgrade ? 10 : 0 }}>
                    PKR {amountToPay.toLocaleString()}
                  </div>
                  {isUpgrade && (
                    <div style={{ borderTop: '1px solid #374151', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#aaa' }}>
                        <span>New plan total</span>
                        <span>PKR {newPlanPKR.toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#22c55e' }}>
                        <span>Already paid ({activePlanName})</span>
                        <span>- PKR {currentPlanPKR.toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#c9a04a', fontWeight: 700, marginTop: 4, borderTop: '1px solid #374151', paddingTop: 6 }}>
                        <span>Remaining to pay</span>
                        <span>PKR {amountToPay.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })()}

            {/* Send Payment To */}
            <div style={{ background: '#252b3b', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
              <div style={{ color: '#fff', fontWeight: 700, marginBottom: 12 }}>💳 Send Payment To:</div>
              {/* Method tabs */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                <button
                  onClick={() => setPlanPaymentMethod('jazzcash')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 14px', borderRadius: 20, border: 'none',
                    background: planPaymentMethod === 'jazzcash' ? '#c9a04a' : '#374151',
                    color: planPaymentMethod === 'jazzcash' ? '#181205' : '#fff',
                    fontWeight: 700, fontSize: 13, cursor: 'pointer'
                  }}
                >
                  <span style={{ background: '#d63a0a', borderRadius: '50%', width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff', fontWeight: 800 }}>JC</span>
                  JazzCash
                </button>
                <button
                  onClick={() => setPlanPaymentMethod('easypaisa')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 14px', borderRadius: 20, border: 'none',
                    background: planPaymentMethod === 'easypaisa' ? '#c9a04a' : '#374151',
                    color: planPaymentMethod === 'easypaisa' ? '#181205' : '#fff',
                    fontWeight: 700, fontSize: 13, cursor: 'pointer'
                  }}
                >
                  <span style={{ background: '#00a651', borderRadius: '50%', width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff', fontWeight: 800 }}>EP</span>
                  EasyPaisa
                </button>
              </div>
              {/* Account Name */}
              <div style={{ background: '#1a1f2e', borderRadius: 10, padding: '10px 14px', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ color: '#888', fontSize: 10, letterSpacing: '0.08em', marginBottom: 2 }}>ACCOUNT NAME</div>
                  <div style={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>
                    {planPaymentDetails[planPaymentMethod]?.accountName || 'Muhammad Haseeb'}
                  </div>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(planPaymentDetails[planPaymentMethod]?.accountName || 'Muhammad Haseeb')
                    showToast('Account name copied!')
                  }}
                  style={{ background: '#2a2116', border: '1px solid #c9a04a', color: '#c9a04a', borderRadius: 8, padding: '5px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
                >📋 Copy</button>
              </div>
              {/* Phone Number */}
              <div style={{ background: '#1a1f2e', borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ color: '#888', fontSize: 10, letterSpacing: '0.08em', marginBottom: 2 }}>PHONE NUMBER</div>
                  <div style={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>
                    {planPaymentDetails[planPaymentMethod]?.number || '03705318754'}
                  </div>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(planPaymentDetails[planPaymentMethod]?.number || '03705318754')
                    showToast('Phone number copied!')
                  }}
                  style={{ background: '#2a2116', border: '1px solid #c9a04a', color: '#c9a04a', borderRadius: 8, padding: '5px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
                >📋 Copy</button>
              </div>
            </div>

            {/* Payment Method Used dropdown */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', color: '#ccc', fontSize: 13, marginBottom: 6 }}>Payment Method Used</label>
              <select
                value={planPaymentMethod}
                onChange={(e) => setPlanPaymentMethod(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10,
                  background: '#252b3b', border: '1px solid #374151',
                  color: '#fff', fontSize: 14, outline: 'none'
                }}
              >
                <option value="jazzcash">JazzCash</option>
                <option value="easypaisa">EasyPaisa</option>
              </select>
            </div>

            {/* Upload Screenshot */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', color: '#ccc', fontSize: 13, marginBottom: 6 }}>Upload Payment Screenshot</label>
              <label style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 10,
                background: '#252b3b', border: '1px solid #374151',
                color: '#aaa', fontSize: 13, cursor: 'pointer'
              }}>
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files[0]
                    if (file) {
                      setPlanScreenshot(file)
                      setPlanScreenshotName(file.name)
                    }
                  }}
                />
                <span>Choose file</span>
                <span style={{ color: planScreenshotName ? '#c9a04a' : '#666' }}>
                  {planScreenshotName || 'No file chosen'}
                </span>
              </label>
            </div>

            {/* Submit */}
            <button
              onClick={submitPlanRequest}
              disabled={planSubmitting}
              style={{
                width: '100%', padding: '14px', borderRadius: 10, border: 'none',
                background: planSubmitting ? '#5a4a1a' : 'linear-gradient(135deg, #c9a04a, #e8c06a)',
                color: '#181205', fontWeight: 800, fontSize: 15, cursor: planSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
              }}
            >
              {planSubmitting ? 'Submitting...' : '⬆ Submit Request'}
            </button>
          </div>
        </div>
      )}

      <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>
    </div>
  )
}

