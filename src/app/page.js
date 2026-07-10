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
      merged = {
        ...merged,
        ...saved
      }
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

  const [currency, setCurrency] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('hmh-currency') || 'USD'
    }
    return 'USD'
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('hmh-currency', currency)
    }
  }, [currency])

  const [withdrawHistory, setWithdrawHistory] = useState([])
  const [wdAmount, setWdAmount] = useState('')
  const [wdMethod, setWdMethod] = useState('')
  const [wdName, setWdName] = useState('')
  const [wdAccount, setWdAccount] = useState('')
  const [wdSubmitting, setWdSubmitting] = useState(false)

  const [profile, setProfile] = useState(() => loadStoredProfile())
  const [profileDraft, setProfileDraft] = useState(() => loadStoredProfile())
  const [profileSaved, setProfileSaved] = useState(false)
  const profileReady = useRef(false)

  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [galleryImages, setGalleryImages] = useState([])
  const [galleryIndex, setGalleryIndex] = useState(0)
  const [checkoutProduct, setCheckoutProduct] = useState(null)
  const [coName, setCoName] = useState('')
  const [coPhone, setCoPhone] = useState('')
  const [coAddress, setCoAddress] = useState('')
  const [coPaymentMethod, setCoPaymentMethod] = useState('balance')
  const [coReceiptFile, setCoReceiptFile] = useState(null)
  const [ecommerceBankDetails, setEcommerceBankDetails] = useState({ bankName: '', accountName: '', accountNumber: '' })
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false)

  const [spinAngle, setSpinAngle] = useState(0)
  const [spinRunning, setSpinRunning] = useState(false)
  const [spinResult, setSpinResult] = useState('Locked')
  const spinAngleRef = useRef(0)

  const [teamData, setTeamData] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('hmh-team-data')
      if (stored) {
        try {
          return JSON.parse(stored)
        } catch { }
      }
    }
    return {
      totalMembers: 0,
      totalTeamEarnings: 0,
      levelA: { count: 0, members: [] }
    }
  })

  const [activePlanName, setActivePlanName] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('hmh-active-plan') || 'Free'
    }
    return 'Free'
  })

  // PKR conversion: $1 = PKR 300
  const PKR_RATE = 300

  const formatVal = (pkrAmount) => {
    if (currency === 'USD') {
      return `$${((pkrAmount || 0) / PKR_RATE).toFixed(2)}`
    }
    return `Rs ${(pkrAmount || 0).toLocaleString()}`
  }

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

  // Social task state
  const [stPlatform, setStPlatform] = useState('')
  const [stScreenshot, setStScreenshot] = useState(null)
  const [stNotes, setStNotes] = useState('')
  const [stSubmitting, setStSubmitting] = useState(false)

  const NAV = useMemo(
    () => [
      { id: 'dashboard', label: 'Dashboard', icon: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z' },
      { id: 'withdraw', label: 'Withdraw funds', icon: 'M3 7h18v10H3zM3 10h18' },
      { id: 'network', label: 'My network', icon: 'M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM17 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 20c0-3 3-5 6-5s6 2 6 5M13 20c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4' },
      { id: 'plans', label: 'My plan', icon: 'M12 3v18M5 8l7-5 7 5' },
      { id: 'levels', label: 'Rewards & levels', icon: 'M8 21h8M12 17v4M6 3h12l-1 8a5 5 0 0 1-10 0z' },
      { id: 'social-task', label: 'Social Task', icon: 'M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z' },
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

  const [products, setProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [mysteryBoxes, setMysteryBoxes] = useState([])
  const [mysteryBoxesEnabled, setMysteryBoxesEnabled] = useState(true)

  useEffect(() => {
    const ts = Date.now()
    fetch(`/api/user/products?_t=${ts}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setProducts(data)
        }
        setProductsLoading(false)
      })
      .catch(err => {
        console.error(err)
        setProductsLoading(false)
      })

    if (profile?.phone) {
      fetch(`/api/user/profile?phone=${encodeURIComponent(profile.phone)}&_t=${ts}`)
        .then(res => res.json())
        .then(data => {
          if (data && !data.error) {
            setProfile(prev => {
              const next = { ...prev, ...data }
              localStorage.setItem('hmh-profile', JSON.stringify(next))
              return next
            })
          }
        })
        .catch(console.error)
    }

    fetch(`/api/admin/ecommerce-settings?_t=${ts}`)
      .then(res => res.json())
      .then(data => {
        if (data) setEcommerceBankDetails(data)
      })
      .catch(console.error)

    fetch(`/api/admin/mystery-boxes?_t=${ts}`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setMysteryBoxes(data.boxes || [])
          setMysteryBoxesEnabled(data.enabled !== false)
        }
      })
      .catch(console.error)
  }, [])

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

  const levels = useMemo(() => {
    let pools = {
      basic: [], standard: [], diamond: [], pro: [], premium: [], legend: [], other: []
    }
    if (teamData.levelA?.members) {
      for (const m of teamData.levelA.members) {
        const plan = (m.plan || '').toLowerCase().trim()
        if (pools[plan]) {
          pools[plan].push(m)
        } else {
          pools.other.push(m)
        }
      }
    }

    const consumeAny = (count) => {
      let consumed = 0
      const order = ['other', 'basic', 'standard', 'diamond', 'pro', 'premium', 'legend']
      for (const p of order) {
        while (pools[p].length > 0 && consumed < count) {
          pools[p].pop()
          consumed++
        }
      }
      return consumed
    }

    const consumeSpecific = (plan, count) => {
      let consumed = 0
      while (pools[plan] && pools[plan].length > 0 && consumed < count) {
        pools[plan].pop()
        consumed++
      }
      return consumed
    }

    return Array.from({ length: 50 }, (_, index) => {
      const lv = index + 1
      let reqText = ''
      let isCompleted = false
      let progressPercent = 0
      let progressText = ''
      let rewardUSD = 0
      let membersRequired = 0

      if (lv === 1) {
        rewardUSD = 2
        membersRequired = 5
        reqText = '5 members of any plan'
        const count = consumeAny(5)
        progressPercent = Math.min(100, Math.round((count / 5) * 100))
        isCompleted = count >= 5
        progressText = `${count} / ${membersRequired}`
      } else if (lv === 2) {
        rewardUSD = 5
        membersRequired = 10
        reqText = '10 members of any plan'
        const count = consumeAny(10)
        progressPercent = Math.min(100, Math.round((count / 10) * 100))
        isCompleted = count >= 10
        progressText = `${count} / ${membersRequired}`
      } else {
        // Levels 3 to 50
        let reqEach = 0
        if (lv === 3) {
          rewardUSD = 10
          reqEach = 2
        } else if (lv === 4) {
          rewardUSD = 15
          reqEach = 3
        } else if (lv === 5) {
          rewardUSD = 20
          reqEach = 4
        } else {
          // Level 6 to 50
          reqEach = 5
          rewardUSD = 25 + (lv - 6) * 5
        }

        membersRequired = reqEach * 6
        reqText = `${reqEach} Basic · ${reqEach} Standard · ${reqEach} Diamond · ${reqEach} Pro · ${reqEach} Premium · ${reqEach} Legend`

        const basicProgress = consumeSpecific('basic', reqEach)
        const standardProgress = consumeSpecific('standard', reqEach)
        const diamondProgress = consumeSpecific('diamond', reqEach)
        const proProgress = consumeSpecific('pro', reqEach)
        const premiumProgress = consumeSpecific('premium', reqEach)
        const legendProgress = consumeSpecific('legend', reqEach)

        const totalProgress = basicProgress + standardProgress + diamondProgress + proProgress + premiumProgress + legendProgress
        progressPercent = Math.min(100, Math.round((totalProgress / membersRequired) * 100))
        progressText = `${totalProgress} / ${membersRequired}`

        isCompleted = (
          basicProgress >= reqEach &&
          standardProgress >= reqEach &&
          diamondProgress >= reqEach &&
          proProgress >= reqEach &&
          premiumProgress >= reqEach &&
          legendProgress >= reqEach
        )
      }

      const isMilestone = lv % 10 === 0

      return {
        level: lv,
        reqText,
        rewardUSD,
        progressPercent,
        progressText,
        isCompleted,
        membersRequired,
        isMilestone,
        rewardLabel: isMilestone ? `$${lv * 10} + Salary` : null,
        salaryLabel: isMilestone ? `$${lv * 10} monthly salary` : null
      }
    })
  }, [teamData.levelA?.members])

  const currentLevel = useMemo(() => {
    let lvl = 1
    for (let i = 0; i < levels.length; i++) {
      if (levels[i].isCompleted) {
        lvl = levels[i].level + 1
      } else {
        break
      }
    }
    return Math.min(lvl, 50)
  }, [levels])

  useEffect(() => {
    if (profile?.phone && currentLevel > (profile.level || 0)) {
      fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: profile.phone,
          updates: { level: currentLevel }
        })
      }).catch(console.error)
    }
  }, [profile?.phone, profile?.level, currentLevel])

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
            localStorage.setItem('hmh-team-data', JSON.stringify(data))
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
          setProfile(prev => {
            const next = {
              ...prev,
              ...data
            }
            localStorage.setItem('hmh-profile', JSON.stringify(next))
            return next
          })
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
      if (activePlanName === 'Free') {
        setPage('dashboard')
      } else if (savedPage) {
        setPage(savedPage)
      }
    }
  }, [activePlanName])

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
    if (activePlanName === 'Free' && id !== 'dashboard' && id !== 'plans') {
      showToast('Please upgrade your plan to access this page.')
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

  // Load real withdrawal history from transactions API
  useEffect(() => {
    if (!profile || !profile.phone) return
    const loadWithdrawHistory = async () => {
      try {
        const res = await fetch(`/api/transactions?userId=${encodeURIComponent(profile.phone)}&type=withdraw`)
        if (res.ok) {
          const data = await res.json()
          const txns = Array.isArray(data) ? data : (data.transactions || [])
          setWithdrawHistory(txns)
        }
      } catch (err) {
        console.warn('Failed to load withdraw history:', err)
      }
    }
    loadWithdrawHistory()
  }, [profile.phone])

  const submitWithdrawal = async () => {
    if (!wdAmount || !wdMethod || !wdName || !wdAccount) {
      showToast('Please fill in every field')
      return
    }
    const amtInPKR = currency === 'USD' ? Number(wdAmount) * PKR_RATE : Number(wdAmount)
    if (isNaN(amtInPKR) || amtInPKR <= 0) {
      showToast('Please enter a valid amount')
      return
    }
    if (amtInPKR < 300) {
      showToast('Minimum withdrawal amount is Rs 300')
      return
    }
    const currentBalance = profile.balance || 0
    if (amtInPKR > currentBalance) {
      showToast(`Insufficient balance. Your current balance is ${formatVal(currentBalance)}.`)
      return
    }
    const phone = profile.phone
    if (!phone) {
      showToast('Please log in to withdraw')
      return
    }
    setWdSubmitting(true)
    try {
      const res = await fetch('/api/user/balance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: phone,
          operation: 'withdraw',
          amount: amtInPKR,
          withdrawalMethod: wdMethod,
          withdrawalAccountName: wdName,
          withdrawalNumber: wdAccount
        })
      })
      const data = await res.json()
      if (!res.ok) {
        showToast(data.error || 'Withdrawal failed')
        return
      }
      // Immediately deduct from local profile state so balance reflects instantly
      setProfile(prev => {
        const next = { ...prev, balance: data.newBalance ?? (currentBalance - amtInPKR) }
        localStorage.setItem('hmh-profile', JSON.stringify(next))
        return next
      })
      // Clear form
      setWdAmount('')
      setWdMethod('')
      setWdName('')
      setWdAccount('')
      showToast('✅ Withdrawal request submitted. Pending admin approval.')
      // Reload withdrawal history
      try {
        const txRes = await fetch(`/api/transactions?userId=${encodeURIComponent(phone)}&type=withdraw`)
        if (txRes.ok) {
          const txData = await txRes.json()
          const txns = Array.isArray(txData) ? txData : (txData.transactions || [])
          setWithdrawHistory(txns)
        }
      } catch { }
    } catch (err) {
      console.error(err)
      showToast('Withdrawal request failed. Please try again.')
    } finally {
      setWdSubmitting(false)
    }
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

  const openGallery = (p) => {
    let imgs = []
    if (p.images && p.images.length > 0) imgs = p.images
    else if (p.image) imgs = [p.image]

    if (imgs.length > 0) {
      setGalleryImages(imgs)
      setGalleryIndex(0)
      setGalleryOpen(true)
    } else {
      showToast('No images available for this product.')
    }
  }

  const handleShareImage = async () => {
    const currentImg = galleryImages[galleryIndex]
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Product Image',
          text: 'Check out this product image!',
          url: currentImg,
        })
      } catch (e) { }
    } else {
      showToast('Share not supported on this browser.')
    }
  }

  const openPlanModal = async (plan) => {
    const hasAnyPending = (profile.investmentPlans || []).some(planReq => planReq.status === 'pending')
    if (hasAnyPending) {
      showToast('You already have a plan upgrade request pending approval.')
      return
    }
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

        // Fetch fresh profile data to update pending plan state immediately
        try {
          const profileRes = await fetch(`/api/user/profile?phone=${encodeURIComponent(profile.phone || user.phone)}&_t=${Date.now()}`)
          if (profileRes.ok) {
            const profileData = await profileRes.json()
            setProfile(prev => ({
              ...prev,
              ...profileData
            }))
          }
        } catch (profileErr) {
          console.warn('Error reloading profile after plan request:', profileErr)
        }
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

  const submitSocialTask = async () => {
    if (!stPlatform || !stScreenshot) {
      showToast('Please select a platform and upload a screenshot')
      return
    }
    setStSubmitting(true)
    try {
      const res = await fetch('/api/user/social-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: profile.phone })
      })
      const data = await res.json()
      if (res.ok) {
        showToast(data.message || 'Task submitted successfully!')
        setStPlatform('')
        setStScreenshot(null)
        setStNotes('')

        // Update balance and earning instantly
        setProfile(prev => {
          const next = {
            ...prev,
            balance: data.balance,
            earnBalance: data.earnBalance,
            totalCommissionEarned: data.totalCommissionEarned
          }
          localStorage.setItem('hmh-profile', JSON.stringify(next))
          return next
        })
      } else {
        showToast(data.message || 'Task submission failed')
      }
    } catch (err) {
      console.error(err)
      showToast('Error submitting task')
    } finally {
      setStSubmitting(false)
    }
  }

  const confirmOrder = async () => {
    if (!coPhone || !coAddress) {
      showToast('Please add your phone and address')
      return
    }

    if (coPaymentMethod === 'online_transfer' && !coReceiptFile) {
      showToast('Please upload a screenshot of your payment receipt')
      return
    }

    setCheckoutSubmitting(true)
    try {
      let receiptBase64 = ''
      if (coReceiptFile) {
        receiptBase64 = await new Promise((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result)
          reader.readAsDataURL(coReceiptFile)
        })
      }

      const res = await fetch('/api/user/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: profile.phone,
          productId: checkoutProduct._id,
          deliveryAddress: coAddress,
          phoneNumber: coPhone,
          paymentMethod: coPaymentMethod,
          receiptImage: receiptBase64
        })
      })
      const data = await res.json()
      if (res.ok) {
        showToast(data.message || 'Order placed successfully!')
        setCheckoutOpen(false)
        setCheckoutProduct(null)
        setCoPaymentMethod('balance')
        setCoReceiptFile(null)
      } else {
        showToast(data.message || 'Error placing order')
      }
    } catch (err) {
      showToast('Network error')
    }
    setCheckoutSubmitting(false)
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

  const claimLevelReward = async (level) => {
    if (!profile || !profile.phone) return
    try {
      const res = await fetch('/api/user/claim-level', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: profile.phone, level })
      })
      const data = await res.json()
      if (res.ok) {
        showToast(data.message)
        // Refresh local React profile state with updated values
        setProfile(prev => {
          const next = {
            ...prev,
            balance: data.balance,
            earnBalance: data.earnBalance,
            totalCommissionEarned: data.totalCommissionEarned,
            claimedLevels: data.claimedLevels
          }
          localStorage.setItem('hmh-profile', JSON.stringify(next))
          return next
        })
      } else {
        showToast(data.message || 'Claim failed')
      }
    } catch (err) {
      console.error(err)
      showToast('Error claiming reward')
    }
  }

  const handleProfilePicUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfileDraft(prev => ({ ...prev, profilePicture: reader.result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const saveProfile = async () => {
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

      // Persist to database
      await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: nextProfile.phone,
          updates: {
            name: nextProfile.name,
            email: nextProfile.email,
            username: nextProfile.username,
            city: nextProfile.city,
            address: nextProfile.address,
            profilePicture: nextProfile.profilePicture
          }
        })
      })
    } catch (e) {
      console.error('Error saving profile:', e)
    }
  }

  useEffect(() => {
    if (page === 'profile') setProfileDraft(profile)
  }, [page, profile])

  const avatarInitial = (profile.name || 'A').trim().charAt(0).toUpperCase()
  const membershipName = profile.name || 'Alex Rivera'
  const membershipUsername = profile.username || 'alex_rivera'
  const membershipEmail = profile.email || 'alex.rivera@example.com'

  const streakDots = useMemo(() => Array.from({ length: 10 }), [])

  const mySalaryUSD = useMemo(() => {
    let total = 0
    const claimed = profile.claimedLevels || []
    for (const lv of claimed) {
      if (lv >= 1 && lv <= 10) total += 10
      else if (lv >= 11 && lv <= 20) total += 20
      else if (lv >= 21 && lv <= 30) total += 30
      else if (lv >= 31 && lv <= 40) total += 40
      else if (lv >= 41 && lv <= 50) total += 50
    }
    return total
  }, [profile.claimedLevels])

  const streakDays = useMemo(() => {
    if (!profile || !profile.createdAt || !teamData.levelA?.members || teamData.levelA.members.length === 0) {
      return 0
    }

    const joinTime = new Date(profile.createdAt).getTime()
    const cycleMs = 24 * 60 * 60 * 1000

    // Group referrals by their cycle index
    const activeCycles = new Set()
    for (const m of teamData.levelA.members) {
      const mTime = new Date(m.joinDate).getTime()
      const cycleIdx = Math.floor((mTime - joinTime) / cycleMs)
      if (cycleIdx >= 0) {
        activeCycles.add(cycleIdx)
      }
    }

    const currentCycle = Math.floor((Date.now() - joinTime) / cycleMs)

    // Determine start of consecutive check
    let checkCycle = currentCycle
    if (!activeCycles.has(checkCycle)) {
      checkCycle = currentCycle - 1
    }

    let streak = 0
    while (checkCycle >= 0 && activeCycles.has(checkCycle)) {
      streak++
      checkCycle--
    }

    return Math.min(10, streak)
  }, [profile, teamData.levelA?.members])

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
            {NAV.map((item) => {
              const isLocked = activePlanName === 'Free' && item.id !== 'dashboard' && item.id !== 'plans' && item.id !== 'admin'
              return (
                <a
                  key={item.id}
                  href="#"
                  className={`nav-item ${page === item.id ? 'active' : ''}`}
                  style={isLocked ? { opacity: 0.45, cursor: 'not-allowed' } : undefined}
                  onClick={(e) => {
                    e.preventDefault()
                    if (isLocked) {
                      showToast('Please upgrade your plan to access this page.')
                    } else {
                      goTo(item.id)
                    }
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d={item.icon} />
                  </svg>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {item.label}
                    {isLocked && <span style={{ fontSize: '11px', filter: 'grayscale(100%)' }}>🔒</span>}
                  </span>
                </a>
              )
            })}

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

            <div className="topbar-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img
                src="/logo.jpg"
                alt="HMHPro Logo"
                style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid var(--gold)' }}
              />
              <span style={{ color: 'var(--gold-bright)', fontWeight: 600, fontSize: '17px' }}>Welcome to HMHProEarn</span>
            </div>

            <button
              className="currency-toggle"
              onClick={() => setCurrency(c => c === 'USD' ? 'PKR' : 'USD')}
              style={{
                marginRight: '12px',
                background: 'linear-gradient(135deg, rgba(201, 160, 74, 0.15) 0%, rgba(201, 160, 74, 0.05) 100%)',
                border: '1px solid rgba(201, 160, 74, 0.3)',
                color: 'var(--gold-bright)',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                fontFamily: 'inherit'
              }}
            >
              <span>{currency === 'USD' ? '💵 USD' : '🇵🇰 PKR'}</span>
            </button>

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
              {profile.profilePicture ? (
                <img src={profile.profilePicture} alt="Avatar" style={{ width: '66px', height: '66px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--gold-dim)', flex: 'none' }} />
              ) : (
                <div className="avatar-ring">{avatarInitial}</div>
              )}
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
                  <div className="stat-value">{formatVal(profile.balance)}</div>
                </div>
              </div>
              <div className="card stat-card">
                <div className="stat-icon" style={{ background: 'rgba(91,127,214,.12)' }}>💼</div>
                <div>
                  <div className="stat-label">Total earnings</div>
                  <div className="stat-value">{formatVal((profile.earnBalance || 0) + (profile.totalCommissionEarned || 0))}</div>
                </div>
              </div>
              <div className="card stat-card">
                <div className="stat-icon" style={{ background: 'rgba(201,160,74,.12)' }}>🎁</div>
                <div>
                  <div className="stat-label">My rewards</div>
                  <div className="stat-value">{formatVal(profile.totalCommissionEarned)}</div>
                </div>
              </div>
              <div className="card stat-card">
                <div className="stat-icon" style={{ background: 'rgba(201,160,74,.12)' }}>📈</div>
                <div>
                  <div className="stat-label">My salary</div>
                  <div className="stat-value">{currency === 'USD' ? `$${mySalaryUSD.toFixed(2)}` : `Rs ${(mySalaryUSD * PKR_RATE).toLocaleString()}`}</div>
                </div>
              </div>
              <div className="card stat-card">
                <div className="stat-icon" style={{ background: 'rgba(196,87,74,.12)' }}>📤</div>
                <div>
                  <div className="stat-label">Total withdrawals</div>
                  <div className="stat-value">{formatVal((withdrawHistory || [])
                    .filter(w => w.status !== 'rejected' && w.status !== 'cancelled')
                    .reduce((sum, w) => sum + w.amount, 0))}</div>
                </div>
              </div>
            </div>

            <div className="card streak-card">
              <div className="streak-top">
                <h3>🔥 Referral streak</h3>
                <span className="streak-pill">Day {streakDays} / 10</span>
              </div>
              <div className="dots-row">
                {streakDots.map((_, i) => (
                  <div key={i} className={`streak-dot ${i < streakDays ? 'filled' : ''}`} />
                ))}
              </div>
              <div className="streak-note">
                {streakDays > 0
                  ? `Your streak is active! You have a ${streakDays}-day referral streak.`
                  : 'Start your streak — invite 1 member today.'
                }
              </div>
              <div className="streak-note">Complete a 10-day streak to earn a $10 bonus reward.</div>
            </div>

            {mysteryBoxesEnabled && mysteryBoxes.length > 0 && (
              <div className="card" style={{ marginBottom: 18 }}>
                <h3 style={{ margin: '0 0 4px' }}>🎁 Mystery boxes</h3>
                <p style={{ margin: '0 0 16px', color: 'var(--text-dim)', fontSize: 13 }}>
                  Stay in the Top 3 of the leaderboard for 15 days to claim.
                </p>
                <div className="mystery-grid">
                  {mysteryBoxes.map((b) => (
                    <div key={b.id || b.title} className="card mystery-card">
                      <div className="mystery-medal">{b.medal}</div>
                      <div className="mystery-title">{b.title}</div>
                      <div className="mystery-sub">{b.desc}</div>
                      <div className="lock-pill">🔒 Locked · 15-day streak</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                    <div className="leader-amt">{currency === 'USD' ? `$${u.amt.toFixed(2)}` : `Rs ${(u.amt * PKR_RATE).toLocaleString()}`}</div>
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

            {/* Balance banner */}
            <div className="card balance-strip">
              <span style={{ color: 'var(--text-dim)', fontSize: 14 }}>Available balance</span>
              <span className="amt">{formatVal(profile.balance)}</span>
            </div>

            {/* Withdrawal form */}
            <div className="card" style={{ marginBottom: 18 }}>
              <h3 style={{ margin: '0 0 4px' }}>New withdrawal</h3>
              <p style={{ margin: '0 0 16px', color: 'var(--text-faint)', fontSize: 12.5 }}>
                Min: {currency === 'USD' ? '$1' : 'Rs 300'} &nbsp;·&nbsp; Max: {formatVal(profile.balance)}
              </p>

              <label>Amount ({currency === 'USD' ? '$' : 'PKR'})</label>
              <input
                type="number"
                value={wdAmount}
                onChange={(e) => setWdAmount(e.target.value)}
                placeholder={currency === 'USD' ? 'e.g. 5' : 'e.g. 1500'}
                min="0"
                disabled={wdSubmitting}
              />

              <label>Payment method</label>
              <select value={wdMethod} onChange={(e) => setWdMethod(e.target.value)} disabled={wdSubmitting}>
                <option value="">Select payment method</option>
                <option value="Easy Paisa">Easy Paisa</option>
                <option value="Jazzcash">Jazzcash</option>
                <option value="SadaPay">SadaPay</option>
                <option value="Bank transfer">Bank transfer</option>
                <option value="Binance">Binance</option>
              </select>

              <label>Account holder name</label>
              <input
                value={wdName}
                onChange={(e) => setWdName(e.target.value)}
                placeholder="Account holder name"
                disabled={wdSubmitting}
              />

              <label>Account number / Wallet ID</label>
              <input
                value={wdAccount}
                onChange={(e) => setWdAccount(e.target.value)}
                placeholder="Enter account number or wallet ID"
                disabled={wdSubmitting}
              />

              <div style={{ marginTop: 18 }}>
                <button
                  className="btn btn-gold"
                  onClick={submitWithdrawal}
                  disabled={wdSubmitting}
                  style={{ opacity: wdSubmitting ? 0.7 : 1, cursor: wdSubmitting ? 'not-allowed' : 'pointer' }}
                >
                  {wdSubmitting ? '⏳ Submitting…' : 'Submit withdrawal'}
                </button>
              </div>

              <p style={{ marginTop: 12, fontSize: 11.5, color: 'var(--text-faint)', lineHeight: 1.5 }}>
                ⚠️ The requested amount will be deducted from your current balance immediately. Admin will review and approve your withdrawal request.
              </p>
            </div>

            {/* Withdrawal history */}
            <div className="card">
              <h3 style={{ margin: '0 0 14px' }}>Withdrawal history</h3>
              {withdrawHistory.length === 0 ? (
                <div className="empty-state">No withdrawals yet. Once you request one, it'll show up here.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {withdrawHistory.map((h, i) => {
                    const statusColor = h.status === 'approved'
                      ? '#22c55e'
                      : h.status === 'rejected'
                        ? '#ef4444'
                        : '#f59e0b'
                    const statusLabel = h.status === 'approved'
                      ? '✅ Approved'
                      : h.status === 'rejected'
                        ? '❌ Rejected'
                        : '⏳ Pending'
                    return (
                      <div key={h._id || h.transactionId || i} style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--line)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>
                            {formatVal(h.amount)}
                          </span>
                          <span style={{ fontSize: 11.5, fontWeight: 700, color: statusColor, background: `${statusColor}18`, border: `1px solid ${statusColor}40`, padding: '2px 9px', borderRadius: 20 }}>
                            {statusLabel}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-dim)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                          {(h.createdAt || h.date) && (
                            <span>🕐 {new Date(h.createdAt || h.date).toLocaleDateString()}</span>
                          )}
                        </div>
                        {h.withdrawalFee > 0 && (
                          <div style={{ marginTop: 6, fontSize: 11.5, color: 'var(--text-faint)' }}>
                            Fee: {formatVal(h.withdrawalFee)} &nbsp;·&nbsp; Net payout: {formatVal(h.amountAfterFee)}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
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
                  <div className="stat-value">{teamData.levelB?.count || 0}</div>
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
              <h3 style={{ margin: '0 0 14px' }}>👤 Direct referrals ({teamData.levelA?.count || 0})</h3>
              {teamData.levelA?.members?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {teamData.levelA.members.map((member, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--line)' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text)' }}>{member.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{member.phone}</div>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-dim)', alignSelf: 'center', textAlign: 'right' }}>
                        <div>Joined: {new Date(member.joinDate).toLocaleDateString()}</div>
                        <div style={{ fontSize: 12, color: 'var(--gold-bright)', marginTop: 4, fontWeight: 600 }}>
                          Plan: {member.plan || 'Free'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">No direct referrals yet. Share your link to start building your team.</div>
              )}
            </div>

            <div className="card" style={{ marginBottom: 18 }}>
              <h3 style={{ margin: '0 0 14px' }}>🔗 Indirect referrals ({teamData.levelB?.count || 0})</h3>
              {teamData.levelB?.members?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {teamData.levelB.members.map((member, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--line)' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text)' }}>{member.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{member.phone}</div>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-dim)', alignSelf: 'center', textAlign: 'right' }}>
                        <div>Joined: {new Date(member.joinDate).toLocaleDateString()}</div>
                        <div style={{ fontSize: 12, color: 'var(--gold-bright)', marginTop: 4, fontWeight: 600 }}>
                          Plan: {member.plan || 'Free'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">No indirect referrals yet — these appear once your direct referrals invite others.</div>
              )}
            </div>

            <div className="card">
              <h3 style={{ margin: '0 0 14px' }}>👥 Downline referrals ({teamData.levelC?.count || 0})</h3>
              {teamData.levelC?.members?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {teamData.levelC.members.map((member, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--line)' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text)' }}>{member.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>{member.phone}</div>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-dim)', alignSelf: 'center', textAlign: 'right' }}>
                        <div>Joined: {new Date(member.joinDate).toLocaleDateString()}</div>
                        <div style={{ fontSize: 12, color: 'var(--gold-bright)', marginTop: 4, fontWeight: 600 }}>
                          Plan: {member.plan || 'Free'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">No downline referrals yet — these appear once your indirect referrals invite others.</div>
              )}
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
                const isPending = (profile.investmentPlans || []).some(
                  planReq => planReq.planName.toLowerCase() === p.name.toLowerCase() && planReq.status === 'pending'
                )
                const hasAnyPending = (profile.investmentPlans || []).some(
                  planReq => planReq.status === 'pending'
                )
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
                      opacity: (hasAnyPlan && !isActive) || (hasAnyPending && !isPending && !isActive) ? 0.75 : 1
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
                      {currency === 'USD' ? `$${p.price}` : `Rs ${(p.price * PKR_RATE).toLocaleString()}`} <span style={{ fontSize: 12, color: 'var(--text-faint)', fontWeight: 500 }}>one-time</span>
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
                    ) : isPending ? (
                      <button
                        className="btn"
                        disabled
                        style={{
                          width: '100%',
                          background: 'rgba(201,160,74,0.15)',
                          border: '1px solid rgba(201,160,74,0.4)',
                          color: 'var(--gold-bright)',
                          cursor: 'default',
                          fontWeight: 700
                        }}
                      >
                        ⏳ Pending Approval
                      </button>
                    ) : (
                      <button
                        className={`btn ${p.featured ? 'btn-gold' : 'btn-ghost'}`}
                        onClick={() => openPlanModal(p)}
                        disabled={hasAnyPending}
                        style={{
                          width: '100%',
                          opacity: hasAnyPending ? 0.5 : 1,
                          cursor: hasAnyPending ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {hasAnyPlan ? 'Upgrade Plan' : p.buttonLabel}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </section>


          {/* STORE (E-commerce) */}
          <section className={`page ${page === 'store' ? 'active' : ''}`}>
            <div className="page-head">
              <h1>E-commerce</h1>
              <p>Browse and purchase products with your HMHPro balance or direct transfer.</p>
            </div>

            {productsLoading ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-dim)' }}>
                <div style={{ display: 'inline-block', width: '40px', height: '40px', border: '3px solid rgba(201,160,74,0.3)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '16px' }}></div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <div>Loading products...</div>
              </div>
            ) : products.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 20 }}>
                {products.map(p => (
                  <div key={p._id || p.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ height: 150, background: 'linear-gradient(135deg,#2a2116,#171b25)', display: 'flex', alignItems: 'center', justifyItems: 'center', position: 'relative' }}>
                      {p.images && p.images.length > 0 ? (
                        <img src={p.images[0]} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : p.image ? (
                        <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ fontSize: 38 }}>🛒</div>
                      )}
                    </div>
                    <div style={{ padding: 16 }}>
                      <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 3 }}>{p.name}</div>
                      <div style={{ color: 'var(--text-faint)', fontSize: 12, marginBottom: 12 }}>{p.description || p.desc}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace', fontWeight: 700, color: 'var(--gold-bright)' }}>
                          {p.currency || 'Rs'} {p.price.toLocaleString()}
                        </span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            style={{ background: 'var(--panel-3)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '8px 14px', fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}
                            onClick={() => openGallery(p)}
                          >
                            View Products
                          </button>
                          <button
                            style={{ background: 'var(--gold)', color: '#181205', border: 'none', borderRadius: 8, padding: '8px 14px', fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}
                            onClick={() => openCheckout(p)}
                          >
                            Buy now
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">No products available at the moment. Please check back later.</div>
            )}
          </section>

          {/* SOCIAL TASK */}
          <section className={`page ${page === 'social-task' ? 'active' : ''}`}>
            <div className="page-head">
              <h1>Social Task</h1>
              <p>Complete Social Media Tasks &amp; Earn Rewards!</p>
            </div>

            <div className="card" style={{ marginBottom: 18 }}>
              <h3 style={{ margin: '0 0 4px' }}>📋 Task Details</h3>
              <p style={{ margin: '0 0 16px', color: 'var(--text-dim)', fontSize: 13 }}>
                Task Name: Upload a Promotional Video
              </p>
              <ul style={{ paddingLeft: 20, color: 'var(--text-dim)', fontSize: 13, marginBottom: 20 }}>
                <li style={{ paddingBottom: 6 }}>✅ Upload the video on TikTok, Instagram, Facebook, or YouTube.</li>
                <li style={{ paddingBottom: 6 }}>✅ Keep the post public.</li>
                <li style={{ paddingBottom: 6 }}>✅ Take a screenshot of the uploaded post.</li>
                <li style={{ paddingBottom: 6 }}>✅ Submit the form below.</li>
              </ul>

              <label>Select Platform</label>
              <select value={stPlatform} onChange={(e) => setStPlatform(e.target.value)} disabled={stSubmitting}>
                <option value="">Select Platform</option>
                <option value="TikTok">TikTok</option>
                <option value="Instagram">Instagram</option>
                <option value="Facebook">Facebook</option>
                <option value="YouTube">YouTube</option>
              </select>

              <label style={{ marginTop: 12 }}>Upload Screenshot</label>
              <input type="file" accept="image/*" onChange={(e) => setStScreenshot(e.target.files[0])} disabled={stSubmitting} style={{
                background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px', width: '100%', color: 'var(--text)'
              }} />

              <label style={{ marginTop: 12 }}>Additional Notes (Optional)</label>
              <textarea value={stNotes} onChange={(e) => setStNotes(e.target.value)} disabled={stSubmitting} placeholder="Any notes..." style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'var(--text)', minHeight: 80, fontFamily: 'inherit' }} />

              <div style={{ marginTop: 18 }}>
                <button
                  className="btn btn-gold"
                  onClick={submitSocialTask}
                  disabled={stSubmitting}
                  style={{ opacity: stSubmitting ? 0.7 : 1, cursor: stSubmitting ? 'not-allowed' : 'pointer' }}
                >
                  {stSubmitting ? '⏳ Submitting…' : '🟢 Collect Reward'}
                </button>
              </div>
            </div>

            <div className="card">
              <h3 style={{ margin: '0 0 10px', color: 'var(--red)' }}>📢 Important Rules</h3>
              <ul style={{ paddingLeft: 20, color: 'var(--text-faint)', fontSize: 13 }}>
                <li style={{ paddingBottom: 6 }}>Only original uploads are accepted.</li>
                <li style={{ paddingBottom: 6 }}>Screenshot must be clear.</li>
                <li style={{ paddingBottom: 6 }}>Post must remain public.</li>
                <li style={{ paddingBottom: 6 }}>Fake submissions will be rejected.</li>
              </ul>
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
                    { icon: '🗺️', title: 'National Tour', level: 10 },
                    { icon: '💻', title: 'Laptop', level: 20 },
                    { icon: '📱', title: 'iPhone', level: 30 },
                    { icon: '💍', title: 'Ring', level: 40 },
                    { icon: '🚗', title: 'Car', level: 50 },
                    { icon: '✈️', title: 'Tour', level: 50 }
                  ].map((reward) => {
                    const levelData = levels.find(l => l.level === reward.level)
                    const isCompleted = levelData ? levelData.isCompleted : false
                    const isClaimed = (profile.claimedLevels || []).includes(reward.level)
                    return (
                      <div key={reward.title} className="reward-tile" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '165px', padding: '16px 8px' }}>
                        <div>
                          <div className="reward-icon">{reward.icon}</div>
                          <div className="reward-name">{reward.title}</div>
                          <div className="reward-level">Lv.{reward.level}</div>
                        </div>
                        <div style={{ width: '100%', marginTop: 'auto' }}>
                          {isClaimed ? (
                            <button
                              disabled
                              style={{ width: '100%', background: 'rgba(255,255,255,0.06)', color: 'var(--text-faint)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '6px 0', fontSize: '11px', fontWeight: 700, cursor: 'not-allowed' }}
                            >
                              ✅ Claimed
                            </button>
                          ) : isCompleted ? (
                            <button
                              style={{ width: '100%', background: 'var(--gold)', color: '#181205', border: 'none', borderRadius: '8px', padding: '6px 0', fontSize: '11px', fontWeight: 800, cursor: 'pointer', boxShadow: '0 0 10px rgba(201,160,74,0.3)' }}
                              onClick={() => claimLevelReward(reward.level)}
                            >
                              🎁 Collect
                            </button>
                          ) : (
                            <button
                              disabled
                              style={{ width: '100%', background: 'rgba(255,255,255,0.03)', color: 'var(--text-faint)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '6px 0', fontSize: '11px', fontWeight: 600, cursor: 'not-allowed' }}
                            >
                              🔒 Locked
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
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
                      <div className="level-req">{level.reqText}</div>
                      <div className="level-bar">
                        <div
                          className="level-bar-fill"
                          style={{ width: `${level.progressPercent}%` }}
                        />
                      </div>
                      <div className="level-progress">
                        <span>Condition progress ({level.progressText})</span>
                        <span>{level.progressPercent}%</span>
                      </div>

                      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <span className="reward-chip" style={{ fontSize: 12.5, fontWeight: 700, background: 'rgba(201,160,74,0.12)', color: 'var(--gold-bright)', border: '1px solid rgba(201,160,74,0.3)', padding: '4px 10px', borderRadius: 20 }}>
                            💰 Reward: {currency === 'USD' ? `$${level.rewardUSD}` : `Rs ${(level.rewardUSD * PKR_RATE).toLocaleString()}`}
                          </span>
                          {level.isMilestone && (
                            <span className="reward-chip" style={{ fontSize: 12.5, fontWeight: 700, background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)', padding: '4px 10px', borderRadius: 20 }}>
                              🎁 {level.rewardLabel}
                            </span>
                          )}
                        </div>

                        {/* Claim button */}
                        {(() => {
                          const isClaimed = (profile.claimedLevels || []).includes(level.level);
                          if (isClaimed) {
                            return (
                              <button
                                disabled
                                style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-faint)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'not-allowed' }}
                              >
                                ✅ Claimed
                              </button>
                            );
                          } else if (level.isCompleted) {
                            return (
                              <button
                                style={{ background: 'var(--gold)', color: '#181205', border: 'none', borderRadius: 8, padding: '6px 16px', fontSize: 12, fontWeight: 800, cursor: 'pointer', boxShadow: '0 0 12px rgba(201,160,74,0.3)' }}
                                onClick={() => claimLevelReward(level.level)}
                              >
                                🎁 Collect
                              </button>
                            );
                          } else {
                            return (
                              <button
                                disabled
                                style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--text-faint)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'not-allowed' }}
                              >
                                🔒 Locked
                              </button>
                            );
                          }
                        })()}
                      </div>
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
                <div className="profile-avatar-wrap" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  {profileDraft.profilePicture ? (
                    <img
                      src={profileDraft.profilePicture}
                      alt="Profile Avatar"
                      style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--gold)' }}
                    />
                  ) : (
                    <div className="avatar-ring profile-avatar-large">{avatarInitial}</div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    id="profile-pic-upload"
                    style={{ display: 'none' }}
                    onChange={handleProfilePicUpload}
                  />
                  <label
                    htmlFor="profile-pic-upload"
                    style={{ fontSize: '12px', color: 'var(--gold)', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Change Picture
                  </label>
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
      <div className={`modal-bg ${galleryOpen ? 'show' : ''}`} onClick={() => setGalleryOpen(false)}>
        <div className={`modal-container ${galleryOpen ? 'show' : ''}`} onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', width: '90%', padding: '20px', borderRadius: '12px' }}>
          <button className="modal-close" onClick={() => setGalleryOpen(false)} aria-label="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"></path></svg>
          </button>
          <div className="modal-header">
            <h2>Product Pictures</h2>
            <p>Image {galleryIndex + 1} of {galleryImages.length}</p>
          </div>

          <div style={{ position: 'relative', width: '100%', height: '300px', background: 'var(--panel-2)', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {galleryImages.length > 0 && (
              <img src={galleryImages[galleryIndex]} alt="Gallery" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            )}

            {galleryImages.length > 1 && (
              <>
                <button
                  onClick={() => setGalleryIndex(i => (i === 0 ? galleryImages.length - 1 : i - 1))}
                  style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  ❮
                </button>
                <button
                  onClick={() => setGalleryIndex(i => (i === galleryImages.length - 1 ? 0 : i + 1))}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  ❯
                </button>
              </>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <a
              href={galleryImages[galleryIndex]}
              download="product-image"
              target="_blank"
              style={{ flex: 1, background: 'var(--panel-3)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px', fontWeight: 700, fontSize: 14, cursor: 'pointer', textAlign: 'center', textDecoration: 'none' }}
            >
              Save Image
            </a>
          </div>
        </div>
      </div>

      <div className={`modal-bg ${checkoutOpen ? 'show' : ''}`} onClick={() => setCheckoutOpen(false)}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-head">
            <h3 style={{ margin: 0 }}>Checkout — delivery details</h3>
            <button className="modal-close" onClick={() => setCheckoutOpen(false)} aria-label="Close">
              ×
            </button>
          </div>

          <div className="modal-product">
            <div className="modal-product-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {checkoutProduct?.image ? (
                <img src={checkoutProduct.image} alt={checkoutProduct.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : '🛒'}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13.5 }}>{checkoutProduct?.name ?? 'Product'}</div>
              <div style={{ color: 'var(--gold-bright)', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace', fontSize: 13 }}>
                {checkoutProduct?.currency || 'Rs'} {checkoutProduct?.price ? checkoutProduct.price.toLocaleString() : '0'}
              </div>
            </div>
          </div>

          <label style={{ marginTop: 0 }}>Full name</label>
          <input value={coName} onChange={(e) => setCoName(e.target.value)} />
          <label>Phone number</label>
          <input value={coPhone} onChange={(e) => setCoPhone(e.target.value)} placeholder="03XXXXXXXXX" />
          <label>Delivery address</label>
          <textarea value={coAddress} onChange={(e) => setCoAddress(e.target.value)} placeholder="Full delivery address (house, street, area, city)" />

          <label style={{ marginTop: 12 }}>Payment Method</label>
          <div style={{ display: 'flex', gap: 12, marginTop: 4, marginBottom: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, margin: 0, fontSize: 13 }}>
              <input type="radio" name="paymentMethod" value="balance" checked={coPaymentMethod === 'balance'} onChange={() => setCoPaymentMethod('balance')} />
              HMHPro Earn (Balance)
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, margin: 0, fontSize: 13 }}>
              <input type="radio" name="paymentMethod" value="online_transfer" checked={coPaymentMethod === 'online_transfer'} onChange={() => setCoPaymentMethod('online_transfer')} />
              Direct Online Transfer
            </label>
          </div>

          {coPaymentMethod === 'online_transfer' && (
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
              <div style={{ fontSize: 13, marginBottom: 8 }}>
                <strong>Bank:</strong> {ecommerceBankDetails.bankName || 'N/A'}<br />
                <strong>Title:</strong> {ecommerceBankDetails.accountName || 'N/A'}<br />
                <strong>Account / IBAN:</strong> {ecommerceBankDetails.accountNumber || 'N/A'}
              </div>
              <label style={{ marginTop: 0, fontSize: 12 }}>Upload Receipt Screenshot</label>
              <input type="file" accept="image/*" onChange={(e) => setCoReceiptFile(e.target.files[0])} style={{ padding: '8px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', width: '100%', color: 'var(--text)' }} />
            </div>
          )}

          <div className="row-2" style={{ marginTop: 18 }}>
            <button className="btn btn-outline" onClick={() => setCheckoutOpen(false)} disabled={checkoutSubmitting}>
              Cancel
            </button>
            <button className="btn btn-gold" onClick={confirmOrder} disabled={checkoutSubmitting} style={{ opacity: checkoutSubmitting ? 0.7 : 1 }}>
              {checkoutSubmitting ? 'Processing...' : 'Place Order'}
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

