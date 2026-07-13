'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Loader from '@/components/Loader'
import { useNotification } from '../../context/NotificationContext'
import AdminShell from '@/components/admin/AdminShell'
import { clearAdminSession } from '@/lib/adminAuth'
import styles from '@/components/admin/admin.module.css'

export default function AdminDashboard() {
  const router = useRouter()
  const [isAppLoading, setIsAppLoading] = useState(true)
  useEffect(() => {
    const timer = setTimeout(() => setIsAppLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])
  const { showSuccess, showError, showWarning, showInfo } = useNotification()
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('admin_active_tab') || 'dashboard'
    }
    return 'dashboard'
  })
  const [plans, setPlans] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [editUserTeamData, setEditUserTeamData] = useState(null)
  const [isAddingNetworkMember, setIsAddingNetworkMember] = useState(false)
  const [networkMemberForm, setNetworkMemberForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: 'password123',
    level: 'A',
    planName: 'Free',
    planAmount: '0'
  })
  const [editingPlan, setEditingPlan] = useState(null)
  const [showAddPlan, setShowAddPlan] = useState(false)
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [uploadedImages, setUploadedImages] = useState({})
  const [pendingRechargeRequests, setPendingRechargeRequests] = useState([])
  const [pendingWithdrawRequests, setPendingWithdrawRequests] = useState([])
  const [planRequests, setPlanRequests] = useState([])
  const [planRequestsLoading, setPlanRequestsLoading] = useState(false)
  const [previewReceiptUrl, setPreviewReceiptUrl] = useState(null)
  const [users, setUsers] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = sessionStorage.getItem('admin_cached_users')
        if (cached) return JSON.parse(cached)
      } catch (e) {
        console.warn('Error reading cached users:', e)
      }
    }
    return []
  })
  const [isUsersLoading, setIsUsersLoading] = useState(false)

  const updateUsersWithCache = (newUsers) => {
    setUsers(newUsers)
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('admin_cached_users', JSON.stringify(newUsers))
      } catch (e) {
        console.warn('Error setting cached users:', e)
      }
    }
  }
  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    pendingWithdrawals: 0,
    pendingPlanRequests: 0,
    totalEarningsDistributed: 0,
    totalWithdrawalsPaid: 0
  })
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [editingUserData, setEditingUserData] = useState(null)
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    balance: 0,
    earnBalance: 0,
    totalCommissionEarned: 0,
    totalRecharge: 0,
    status: 'approved',
    isBlocked: false,
    isAdmin: false,
    investmentPlans: [],
    withdrawHistory: [],
    rechargeHistory: []
  })
  const [newPlanToAdd, setNewPlanToAdd] = useState({ planName: '', amount: 0, status: 'active', startDate: '' })
  const [newWdToAdd, setNewWdToAdd] = useState({ amount: 0, status: 'approved', date: '' })
  const [ads, setAds] = useState([])
  const [newAd, setNewAd] = useState({ title: '', url: '' })
  
  // Courses states
  const [courses, setCourses] = useState([])
  const [newCourse, setNewCourse] = useState({ title: '', videoUrl: '', imageUrl: '', description: '' })
  const [paymentDetails, setPaymentDetails] = useState({
    easypaisa: { number: '', accountName: '' },
    jazzcash: { number: '', accountName: '' }
  })
  
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  })

  const showConfirm = (message, onConfirm, title = 'Are you sure?') => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm()
        setConfirmModal(prev => ({ ...prev, isOpen: false }))
      }
    })
  }

  // Coupon management states
  const [coupons, setCoupons] = useState([])
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    bonusAmount: '',
    maxUsage: '',
    isActive: true,
    description: ''
  })
  const [showAddCoupon, setShowAddCoupon] = useState(false)
  const [usedCoupons, setUsedCoupons] = useState([])

  // Earnings control states
  const EARNINGS_STORAGE_KEY = 'admin_earnings_plans'
  function seedEarningsData() {
    return [
      { id: 'free',     name: 'Free Plan',     perAd: 0.02, refA: 0,  refB: 0, refC: 0 },
      { id: 'basic',    name: 'Basic Plan',    perAd: 0.20, refA: 20, refB: 5, refC: 5 },
      { id: 'standard', name: 'Standard Plan', perAd: 0.40, refA: 20, refB: 5, refC: 5 },
      { id: 'diamond',  name: 'Diamond Plan',  perAd: 0.80, refA: 20, refB: 5, refC: 5 },
      { id: 'pro',      name: 'Pro Plan',      perAd: 1.20, refA: 20, refB: 5, refC: 5 },
      { id: 'premium',  name: 'Premium Plan',  perAd: 1.60, refA: 20, refB: 5, refC: 5 },
      { id: 'legend',   name: 'Legend Plan',   perAd: 2.00, refA: 20, refB: 5, refC: 5 }
    ]
  }

  const [earningsPlans, setEarningsPlans] = useState(seedEarningsData)
  const [earningsSavedMsg, setEarningsSavedMsg] = useState(false)

  const loadEarningsPlans = async () => {
    try {
      const res = await fetch(`/api/settings?key=earnings_plans&_t=${Date.now()}`)
      if (res.ok) {
        const data = await res.json()
        if (data && data.value) {
          setEarningsPlans(data.value)
          return
        }
      }
    } catch (err) {
      console.error(err)
    }
    setEarningsPlans(seedEarningsData())
  }

  useEffect(() => {
    if (isAdminLoggedIn) {
      loadEarningsPlans()
    }
  }, [isAdminLoggedIn])

  function handleEarningsFieldChange(id, field, value) {
    setEarningsPlans(prev =>
      prev.map(p => p.id === id ? { ...p, [field]: parseFloat(value) || 0 } : p)
    )
  }

  const saveEarningsPlans = async () => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'earnings_plans',
          value: earningsPlans,
          description: 'Earnings control reward rates and commissions'
        })
      })
      if (res.ok) {
        setEarningsSavedMsg(true)
        setTimeout(() => setEarningsSavedMsg(false), 2000)
        showSuccess('Earnings settings saved successfully!')
      } else {
        showError('Failed to save settings to DB')
      }
    } catch (err) {
      showError('Network error')
    }
  }

  // ─── Mystery Boxes state ───────────────────────────────────────────────
  const [mysteryBoxes, setMysteryBoxes] = useState([])
  const [mysteryBoxesEnabled, setMysteryBoxesEnabled] = useState(true)
  const [editingBox, setEditingBox] = useState(null)

  useEffect(() => {
    fetch('/api/admin/mystery-boxes')
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setMysteryBoxes(data.boxes || [])
          setMysteryBoxesEnabled(data.enabled !== false)
        }
      })
      .catch(console.error)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function saveMysteryBoxes() {
    fetch('/api/admin/mystery-boxes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: mysteryBoxesEnabled, boxes: mysteryBoxes })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        showSuccess('Mystery Boxes saved!')
      } else {
        showError('Failed to save mystery boxes.')
      }
    })
    .catch(console.error)
  }

  function openEditBox(box) {
    setEditingBox(box)
  }

  function openAddBox() {
    setEditingBox({ id: 'new', rank: mysteryBoxes.length + 1, medal: '🎁', title: `Top ${mysteryBoxes.length + 1} Mystery Box`, desc: '$0 Cash Prize', value: 0 })
  }

  function confirmEditBox() {
    const num = parseFloat(editingBox.value)
    if (isNaN(num) || num < 0) return
    if (editingBox.id === 'new') {
      const newBox = {
        ...editingBox,
        id: 'box_' + Date.now(),
      }
      setMysteryBoxes(prev => [...prev, newBox])
    } else {
      setMysteryBoxes(prev => prev.map(b => b.id === editingBox.id ? editingBox : b))
    }
    setEditingBox(null)
  }

  function deleteBox(id) {
    if (!window.confirm('Delete this mystery box?')) return
    setMysteryBoxes(prev => prev.filter(b => b.id !== id))
  }

  // â”€â”€ E-Commerce state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const PRODUCTS_KEY = 'admin_products'
  const ORDERS_KEY = 'admin_orders'

  function seedProducts() {
    return [
      { id:'p_1', name:"Women's loafer (cherry red color)", desc:'Premium edition of loafers', price:3000, currency:'Rs', active:true,
        img:'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&auto=format&fit=crop&q=60' },
    ]
  }

  function seedOrders() {
    return [
      { id:'o_1', product:"Women's loafer (cherry red color)", customer:'Ayesha Khan', amount:3000, currency:'Rs', status:'pending' },
      { id:'o_2', product:"Women's loafer (cherry red color)", customer:'Sara Malik',  amount:3000, currency:'Rs', status:'approved' },
      { id:'o_3', product:"Women's loafer (cherry red color)", customer:'Bilal Ahmed', amount:3000, currency:'Rs', status:'approved' },
    ]
  }

  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [ecommerceTab, setEcommerceTab] = useState('products')
  const [productForm, setProductForm] = useState(null)
  
  const [ecommerceBankSettings, setEcommerceBankSettings] = useState({ bankName: '', accountName: '', accountNumber: '' })
  const [bankSettingsSaving, setBankSettingsSaving] = useState(false)
  const [receiptModalUrl, setReceiptModalUrl] = useState('')

  const fetchEcommerceData = async () => {
    try {
      const ts = Date.now()
      const [pRes, oRes, bRes] = await Promise.all([
        fetch(`/api/admin/products?_t=${ts}`),
        fetch(`/api/admin/orders?_t=${ts}`),
        fetch(`/api/admin/ecommerce-settings?_t=${ts}`)
      ])
      
      const [pData, oData, bData] = await Promise.all([
        pRes.json(),
        oRes.json(),
        bRes.json()
      ])
      
      setProducts(Array.isArray(pData) ? pData : [])
      setOrders(Array.isArray(oData) ? oData : [])
      if (bRes.ok && bData) setEcommerceBankSettings(bData)
    } catch (err) {
      console.error(err)
    }
  }

  const saveEcommerceBankSettings = async () => {
    setBankSettingsSaving(true)
    try {
      const res = await fetch('/api/admin/ecommerce-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ecommerceBankSettings)
      })
      if (res.ok) {
        showSuccess('Bank settings saved successfully')
      } else {
        showError('Failed to save bank settings')
      }
    } catch (err) {
      showError('Network error')
    }
    setBankSettingsSaving(false)
  }

  useEffect(() => {
    if (isAdminLoggedIn) {
      fetchEcommerceData()
    }
  }, [isAdminLoggedIn])

  async function toggleProduct(id) {
    const prod = products.find(p => p._id === id || p.id === id)
    if (!prod) return
    const actualId = prod._id || prod.id
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: actualId, isActive: !prod.isActive })
      })
      if (res.ok) {
        fetchEcommerceData()
      }
    } catch (err) {
      console.error(err)
    }
  }

  function openEditProduct(p) {
    setProductForm({
      id: p._id || p.id,
      name: p.name,
      desc: p.description || p.desc,
      price: p.price,
      imgs: p.images && p.images.length > 0 ? p.images : (p.image || p.img ? [p.image || p.img] : []),
      mode: 'edit'
    })
  }

  function openAddProduct() {
    setProductForm({
      id: '',
      name: '',
      desc: '',
      price: 0,
      imgs: [],
      mode: 'add'
    })
  }

  function handleProductImageUpload(e) {
    const files = Array.from(e.target.files)
    if (files.length > 0) {
      files.forEach(file => {
        const reader = new FileReader()
        reader.onloadend = () => {
          setProductForm(prev => {
            if (!prev || !prev.imgs) return prev;
            if (prev.imgs.length >= 5) return prev;
            return { ...prev, imgs: [...prev.imgs, reader.result] }
          })
        }
        reader.readAsDataURL(file)
      })
    }
  }

  function removeProductImage(index) {
    setProductForm(prev => {
      const newImgs = [...prev.imgs];
      newImgs.splice(index, 1);
      return { ...prev, imgs: newImgs };
    });
  }

  async function saveProductForm() {
    if (!productForm) return
    if (!productForm.name.trim()) {
      showError('Product name is required')
      return
    }

    try {
      if (productForm.mode === 'add') {
        const res = await fetch('/api/admin/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: productForm.name,
            description: productForm.desc,
            price: parseFloat(productForm.price) || 0,
            currency: 'Rs',
            isActive: true,
            image: (productForm.imgs && productForm.imgs[0]) ? productForm.imgs[0] : '',
            images: productForm.imgs || []
          })
        })
        if (res.ok) {
          showSuccess('Product added successfully!')
          fetchEcommerceData()
        } else {
          showError('Failed to add product')
        }
      } else {
        const res = await fetch('/api/admin/products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: productForm.id,
            name: productForm.name,
            description: productForm.desc,
            price: parseFloat(productForm.price) || 0,
            image: (productForm.imgs && productForm.imgs[0]) ? productForm.imgs[0] : '',
            images: productForm.imgs || []
          })
        })
        if (res.ok) {
          showSuccess('Product updated successfully!')
          fetchEcommerceData()
        } else {
          showError('Failed to update product')
        }
      }
    } catch (err) {
      console.error(err)
      showError('An error occurred')
    }
    setProductForm(null)
  }

  async function deleteProduct(id) {
    if (!window.confirm('Delete this product?')) return
    const actualId = products.find(p => p.id === id || p._id === id)?._id || id
    try {
      const res = await fetch(`/api/admin/products?id=${actualId}`, { method: 'DELETE' })
      if (res.ok) {
        fetchEcommerceData()
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function handleOrderAction(orderId, status) {
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status })
      })
      const data = await res.json()
      if (res.ok) {
        showSuccess(data.message || `Order ${status}`)
        fetchEcommerceData()
      } else {
        showError(data.message || 'Error updating order')
      }
    } catch (err) {
      showError('Network error')
    }
  }

  // Activity states
  const [recentActivities, setRecentActivities] = useState([])
  const [activityLoading, setActivityLoading] = useState(false)

  // History states
  const [rechargeHistory, setRechargeHistory] = useState([])
  const [withdrawHistory, setWithdrawHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [rechargeFilter, setRechargeFilter] = useState('pending') // all, approved, rejected, pending
  const [withdrawFilter, setWithdrawFilter] = useState('pending') // all, approved, rejected, pending

  // Sample plans data - in a real app, this would come from your backend
  const [samplePlans, setSamplePlans] = useState([])

  // Load plans from database only when admin is authenticated
  useEffect(() => {
    if (isAdminLoggedIn && !isCheckingAuth) {
      const loadPlans = async () => {
        try {
          console.log('Loading plans from database...')
          const timestamp = Date.now(); // Add timestamp to prevent caching
          const response = await fetch(`/api/plans?_t=${timestamp}`)
          if (response.ok) {
            const data = await response.json()
            console.log('Found plans:', data)
            setSamplePlans(data)
          } else {
            console.warn('Failed to load plans from DB, using fallback plans')
            setSamplePlans([
              {
                _id: 'fallback_1',
                name: 'Neo Earner Type R',
                image: 'car1.jpeg',
                investAmount: '$5,000',
                dailyIncome: '$25',
                validity: '200 days',
                color: 'from-red-500 to-red-700',
                description: 'High performance variant with turbocharged engine',
                isActive: true,
                order: 1
              },
              {
                _id: 'fallback_2',
                name: 'Neo Earner Sedan',
                image: 'car2.jpeg',
                investAmount: '$3,500',
                dailyIncome: '$17.50',
                validity: '200 days',
                color: 'from-blue-500 to-blue-700',
                description: 'Classic four-door model with excellent fuel economy',
                isActive: true,
                order: 2
              }
            ])
          }
        } catch (error) {
          console.warn('Error loading plans, using fallback plans:', error.message)
          setSamplePlans([
            {
              _id: 'fallback_1',
              name: 'Neo Earner Type R',
              image: 'car1.jpeg',
              investAmount: '$5,000',
              dailyIncome: '$25',
              validity: '200 days',
              color: 'from-red-500 to-red-700',
              description: 'High performance variant with turbocharged engine',
              isActive: true,
              order: 1
            },
            {
              _id: 'fallback_2',
              name: 'Neo Earner Sedan',
              image: 'car2.jpeg',
              investAmount: '$3,500',
              dailyIncome: '$17.50',
              validity: '200 days',
              color: 'from-blue-500 to-blue-700',
              description: 'Classic four-door model with excellent fuel economy',
              isActive: true,
              order: 2
            }
          ])
        }
      }

      loadPlans()
    }
  }, [isAdminLoggedIn, isCheckingAuth, showError])

  const [newPlan, setNewPlan] = useState({
    name: '',
    image: '',
    investAmount: '',
    dailyIncome: '',
    validity: '',
    color: 'from-purple-500 to-purple-700',
    description: '',
    isActive: true,
    order: 0
  })

  useEffect(() => {
    console.log('Syncing samplePlans to plans:', samplePlans)
    setPlans(samplePlans)
  }, [samplePlans])

  // Debug useEffect to log plans state changes
  useEffect(() => {
    console.log('Plans state updated:', plans)
  }, [plans])

  // Check admin authentication
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const adminLoginStatus = sessionStorage.getItem('isAdminLoggedIn')
      if (adminLoginStatus === 'true') {
        setIsAdminLoggedIn(true)
      } else {
        router.push('/admin')
      }
      setIsCheckingAuth(false)
    }
  }, [router])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('admin_active_tab', activeTab)
    }
  }, [activeTab])

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const res = await fetch(`/api/settings?key=admin_ads&_t=${Date.now()}`)
        if (res.ok) {
          const data = await res.json()
          if (data && data.value) {
            setAds(data.value)
            return
          }
        }
      } catch (err) {
        console.error(err)
      }
      
      const seededAds = [
        { id: 'ad_1', title: 'Bsnns', url: 'https://youtube.com/watch?v=demo1', active: true },
        { id: 'ad_2', title: 'Hmh', url: 'https://youtube.com/watch?v=demo2', active: true },
      ]
      setAds(seededAds)
    }
    fetchAds()
  }, [])

  const saveAds = async (nextAds) => {
    setAds(nextAds)
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'admin_ads',
          value: nextAds,
          description: 'Managed Video Ads for watch and earn'
        })
      })
    } catch (err) {
      console.error('Failed to save ads to DB:', err)
    }
  }

  const handleAddAd = () => {
    const title = newAd.title.trim()
    const url = newAd.url.trim()

    if (!title || !url) {
      showError('Please enter both a title and a video URL.')
      return
    }

    saveAds([
      ...ads,
      { id: `ad_${Date.now()}`, title, url, active: true },
    ])
    setNewAd({ title: '', url: '' })
    showSuccess('Ad added successfully')
  }

  const handleToggleAd = (id) => {
    saveAds(ads.map((ad) => (
      ad.id === id ? { ...ad, active: !ad.active } : ad
    )))
  }

  const handleDeleteAd = (id) => {
    saveAds(ads.filter((ad) => ad.id !== id))
    showSuccess('Ad deleted successfully')
  }

  // Courses loader, saver and event handlers
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await fetch(`/api/settings?key=admin_courses&_t=${Date.now()}`)
        if (res.ok) {
          const data = await res.json()
          if (data && data.value) {
            setCourses(data.value)
            return
          }
        }
      } catch (err) {
        console.error(err)
      }
      
      const seededCourses = [
        {
          id: 'course_1',
          title: 'CAPCUT MOBILE VIDEO EDITING',
          videoUrl: 'https://www.youtube.com/watch?v=F28Z8Gz4fks',
          imageUrl: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=500',
          description: 'Learn professional video editing on your phone with CapCut.',
          active: true
        },
        {
          id: 'course_2',
          title: 'YOUTUBE COURSE (From Beginner to Pro)',
          videoUrl: 'https://www.youtube.com/watch?v=HlyLQQG1fCc',
          imageUrl: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=500',
          description: 'Learn how to start, grow and monetize your own YouTube channel.',
          active: true
        }
      ]
      setCourses(seededCourses)
    }
    if (isAdminLoggedIn) {
      fetchCourses()
    }
  }, [isAdminLoggedIn])

  const saveCourses = async (nextCourses) => {
    setCourses(nextCourses)
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'admin_courses',
          value: nextCourses,
          description: 'HMHPro Academy Courses list'
        })
      })
    } catch (err) {
      console.error('Failed to save courses to DB:', err)
    }
  }

  const handleAddCourse = () => {
    const title = newCourse.title.trim()
    const videoUrl = newCourse.videoUrl.trim()
    
    if (!title || !videoUrl) {
      showError('Please enter both a title and a video URL.')
      return
    }

    saveCourses([
      ...courses,
      {
        id: `course_${Date.now()}`,
        title,
        videoUrl,
        imageUrl: newCourse.imageUrl.trim() || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500',
        description: newCourse.description.trim() || 'A professional digital training course.',
        active: true
      }
    ])
    setNewCourse({ title: '', videoUrl: '', imageUrl: '', description: '' })
    showSuccess('Course added successfully')
  }

  const handleToggleCourse = (id) => {
    saveCourses(courses.map((c) => (
      c.id === id ? { ...c, active: !c.active } : c
    )))
  }

  const handleDeleteCourse = (id) => {
    saveCourses(courses.filter((c) => c.id !== id))
    showSuccess('Course deleted successfully')
  }

  const handleLogout = () => {
    showConfirm('Are you sure you want to logout from admin panel?', () => {
      clearAdminSession()
      router.push('/admin')
    }, 'Confirm Logout')
  }

  const handleAddPlan = async () => {
    if (!newPlan.name || !newPlan.investAmount || !newPlan.dailyIncome || !newPlan.validity) {
      showError('Please fill in all required fields (name, investment amount, daily income, and validity)')
      return
    }

    try {
      // Get the next order number
      const nextOrder = plans.length > 0 ? Math.max(...plans.map(p => p.order || 0)) + 1 : 1;
      
      const response = await fetch('/api/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newPlan,
          image: newPlan.image || 'car1.jpeg',
          order: nextOrder
        }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Plan created:', data.plan)
        setSamplePlans(prevPlans => Array.isArray(prevPlans) ? [...prevPlans, data.plan] : [data.plan])
        showSuccess('Plan created successfully!')
        
        setNewPlan({
          name: '',
          image: '',
          investAmount: '',
          dailyIncome: '',
          validity: '',
          color: 'from-purple-500 to-purple-700',
          description: '',
          isActive: true,
          order: 0
        })
        setShowAddPlan(false)
      } else {
        const error = await response.json()
        showError(error.error || 'Failed to create plan')
      }
    } catch (error) {
      console.warn('Error creating plan:', error)
      showError('Error creating plan')
    }
  }

  const handleEditPlan = (plan) => {
    setEditingPlan(plan)
    setNewPlan({
      name: plan.name,
      image: plan.image,
      investAmount: plan.investAmount,
      dailyIncome: plan.dailyIncome,
      validity: plan.validity,
      color: plan.color,
      description: plan.description,
      isActive: plan.isActive,
      order: plan.order || 0
    })
    setShowAddPlan(true)
  }

  const handleUpdatePlan = async () => {
    if (!editingPlan) return

    try {
      const response = await fetch('/api/plans', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: editingPlan._id,
          ...newPlan
        }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Plan updated:', data.plan)
        setSamplePlans(prevPlans => {
          if (!Array.isArray(prevPlans)) return [data.plan];
          return prevPlans.map(plan => 
            plan._id === editingPlan._id ? data.plan : plan
          );
        })
        showSuccess('Plan updated successfully!')
        
        setEditingPlan(null)
        setNewPlan({
          name: '',
          image: '',
          investAmount: '',
          dailyIncome: '',
          validity: '',
          color: 'from-purple-500 to-purple-700',
          description: '',
          isActive: true,
          order: 0
        })
        setShowAddPlan(false)
      } else {
        const error = await response.json()
        showError(error.error || 'Failed to update plan')
      }
    } catch (error) {
      console.warn('Error updating plan:', error)
      showError('Error updating plan')
    }
  }

  const handleDeletePlan = async (planId) => {
    if (confirm('Are you sure you want to delete this plan?')) {
      try {
        const response = await fetch(`/api/plans?id=${planId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          setSamplePlans(prevPlans => {
            if (!Array.isArray(prevPlans)) return [];
            return prevPlans.filter(plan => plan._id !== planId);
          })
          showSuccess('Plan deleted successfully!')
        } else {
          const error = await response.json()
          showError(error.error || 'Failed to delete plan')
        }
      } catch (error) {
        console.warn('Error deleting plan:', error)
        showError('Error deleting plan')
      }
    }
  }

  const handleTogglePlanStatus = async (planId) => {
    try {
      const plan = samplePlans.find(p => p._id === planId)
      if (!plan) return

      const response = await fetch('/api/plans', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: planId,
          isActive: !plan.isActive
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setSamplePlans(prevPlans => {
          if (!Array.isArray(prevPlans)) return [data.plan];
          return prevPlans.map(p => 
            p._id === planId ? data.plan : p
          );
        })
        showSuccess(`Plan ${data.plan.isActive ? 'activated' : 'deactivated'} successfully!`)
      } else {
        const error = await response.json()
        showError(error.error || 'Failed to toggle plan status')
      }
    } catch (error) {
      console.warn('Error toggling plan status:', error)
      showError('Error toggling plan status')
    }
  }

  const handleCancelEdit = () => {
    setEditingPlan(null)
    setShowAddPlan(false)
    setNewPlan({
      name: '',
      image: '',
      investAmount: '',
      dailyIncome: '',
      validity: '',
      color: 'from-purple-500 to-purple-700',
      description: '',
      isActive: true,
      order: 0
    })
  }

  // Handle file upload
  const handleFileUpload = async (file, imageName) => {
    if (file) {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const imageData = e.target.result
        
        try {
          // Upload to database
          const response = await fetch('/api/admin/images', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              imageName,
              imageData,
              imageType: file.type
            }),
          })

          if (response.ok) {
            // Update local state
            setUploadedImages(prev => ({
              ...prev,
              [imageName]: imageData
            }))
            
            // Update the plan if it's being edited
            if (editingPlan && editingPlan.image === imageName) {
              setEditingPlan(prev => ({ ...prev, image: imageData }))
            }
            if (newPlan.image === imageName) {
              setNewPlan(prev => ({ ...prev, image: imageData }))
            }
            
            // Update the plans array
            setPlans(prevPlans => 
              prevPlans.map(plan => 
                plan.image === imageName 
                  ? { ...plan, image: imageData }
                  : plan
              )
            )
            
            showSuccess('Image uploaded successfully!')
          } else {
            const error = await response.json()
            showError(error.error || 'Failed to upload image')
          }
        } catch (error) {
          console.warn('Error uploading image:', error)
          showError('Failed to upload image')
        }
      }
      reader.readAsDataURL(file)
    }
  }

  // Get image source (either uploaded or from public folder)
  const getImageSrc = (imageName) => {
    // If it's a base64 data URL, return it directly
    if (imageName && imageName.startsWith('data:')) {
      return imageName
    }
    // If it's in uploaded images, return that
    if (uploadedImages[imageName]) {
      return uploadedImages[imageName]
    }
    // Otherwise, treat it as a file name from public folder
    return `/${imageName}`
  }

  // Load pending requests and users
  // Load admin data only when authenticated
  useEffect(() => {
    if (isAdminLoggedIn && !isCheckingAuth && typeof window !== 'undefined') {
      // Load users from MongoDB API
      const loadUsers = async () => {
        try {
          setIsUsersLoading(true)
          // Get all users by setting a high limit
          const response = await fetch('/api/admin/users?limit=1000')
          if (response.ok) {
            const data = await response.json()
            updateUsersWithCache(data.users || [])
            console.log('Loaded users:', data.users?.length || 0)
          } else {
            console.warn('Failed to load users from API')
          }
        } catch (error) {
          console.warn('Error loading users:', error)
        } finally {
          setIsUsersLoading(false)
        }
      }
      
      // Load payment details from database
      const loadPaymentDetails = async () => {
        try {
          const response = await fetch('/api/settings?key=paymentDetails')
          if (response.ok) {
            const data = await response.json()
            if (data && data.value) {
              setPaymentDetails(data.value)
            } else {
              // Default payment details
              const defaultPaymentDetails = {
                easypaisa: { number: '0300 1234567', accountName: 'Neo Earner' },
                jazzcash: { number: '0300 7654321', accountName: 'Neo Earner' }
              }
              setPaymentDetails(defaultPaymentDetails)
            }
          } else {
            // If API fails, use default payment details
            const defaultPaymentDetails = {
              easypaisa: { number: '0300 1234567', accountName: 'Neo Earner' },
              jazzcash: { number: '0300 7654321', accountName: 'Neo Earner' }
            }
            setPaymentDetails(defaultPaymentDetails)
          }
        } catch (error) {
          console.warn('Error loading payment details:', error)
          // Use default payment details on error
          const defaultPaymentDetails = {
            easypaisa: { number: '0300 1234567', accountName: 'Neo Earner' },
            jazzcash: { number: '0300 7654321', accountName: 'Neo Earner' }
          }
          setPaymentDetails(defaultPaymentDetails)
        }
      }

      // Load coupons from database
      const loadCoupons = async () => {
        try {
          const response = await fetch('/api/coupons')
          if (response.ok) {
            const data = await response.json()
            setCoupons(data)
          } else {
            console.warn('Failed to load coupons from API')
            setCoupons([])
          }
        } catch (error) {
          console.warn('Error loading coupons:', error)
          setCoupons([])
        }
      }

      // Load images from database
      const loadImages = async () => {
        try {
          const response = await fetch('/api/admin/images')
          if (response.ok) {
            const data = await response.json()
            if (data.success && data.images) {
              const imageMap = {}
              Object.keys(data.images).forEach(imageName => {
                imageMap[imageName] = data.images[imageName].data
              })
              setUploadedImages(imageMap)
            }
          } else {
            console.warn('Failed to load images from API')
          }
        } catch (error) {
          console.warn('Error loading images:', error)
        }
      }

      // Load transactions for pending requests
      const loadPendingRequests = async () => {
        try {
          const rechargeResponse = await fetch('/api/transactions?type=recharge&status=pending')
          const withdrawResponse = await fetch('/api/transactions?type=withdraw&status=pending')
          
          if (rechargeResponse.ok) {
            const rechargeData = await rechargeResponse.json()
            setPendingRechargeRequests(rechargeData)
          }
          
          if (withdrawResponse.ok) {
            const withdrawData = await withdrawResponse.json()
            setPendingWithdrawRequests(withdrawData)
          }
        } catch (error) {
          console.warn('Error loading pending requests:', error)
        }
      }

      // Load recharge history
      const loadRechargeHistory = async () => {
        try {
          setHistoryLoading(true)
          const response = await fetch('/api/transactions?type=recharge&status=all')
          if (response.ok) {
            const data = await response.json()
            setRechargeHistory(data)
          } else {
            console.warn('Failed to load recharge history')
            setRechargeHistory([])
          }
        } catch (error) {
          console.warn('Error loading recharge history:', error)
          setRechargeHistory([])
        } finally {
          setHistoryLoading(false)
        }
      }

      // Load withdraw history
      const loadWithdrawHistory = async () => {
        try {
          setHistoryLoading(true)
          const response = await fetch('/api/transactions?type=withdraw&status=all')
          if (response.ok) {
            const data = await response.json()
            setWithdrawHistory(data)
          } else {
            console.warn('Failed to load withdraw history')
            setWithdrawHistory([])
          }
        } catch (error) {
          console.warn('Error loading withdraw history:', error)
          setWithdrawHistory([])
        } finally {
          setHistoryLoading(false)
        }
      }

      // Load dashboard stats
      const loadDashboardStats = async () => {
        try {
          const response = await fetch('/api/admin/stats')
          if (response.ok) {
            const data = await response.json()
            setDashboardStats(data)
          }
        } catch (error) {
          console.warn('Error loading dashboard stats:', error)
        }
      }

      // Load recent activities
      const loadRecentActivities = async () => {
        try {
          setActivityLoading(true)
          const response = await fetch('/api/admin/activity?limit=10')
          if (response.ok) {
            const data = await response.json()
            setRecentActivities(data)
          } else {
            console.warn('Failed to load recent activities')
            setRecentActivities([])
          }
        } catch (error) {
          console.warn('Error loading recent activities:', error)
          setRecentActivities([])
        } finally {
          setActivityLoading(false)
        }
      }
      
      // Load only active tab data to prevent parallel query storms
      if (activeTab === 'dashboard') {
        loadDashboardStats()
        loadRecentActivities()
      } else if (activeTab === 'users') {
        loadUsers()
      } else if (activeTab === 'withdrawals') {
        loadPendingRequests()
        loadWithdrawHistory()
      } else if (activeTab === 'planRequests') {
        loadPendingRequests()
        loadRechargeHistory()
      }
      
      // Load settings-like data once
      loadPaymentDetails()
      loadCoupons()
      loadImages()
      
      // Set up periodic refresh every 15 seconds for the active tab only
      const refreshInterval = setInterval(() => {
        if (activeTab === 'dashboard') {
          loadDashboardStats()
          loadRecentActivities()
        } else if (activeTab === 'users') {
          loadUsers()
        } else if (activeTab === 'withdrawals') {
          loadPendingRequests()
          loadWithdrawHistory()
        } else if (activeTab === 'planRequests') {
          loadPendingRequests()
          loadRechargeHistory()
        }
      }, 15000)
      
      return () => {
        clearInterval(refreshInterval)
      }
    }
  }, [isAdminLoggedIn, isCheckingAuth, activeTab])

  // Load recharge history when tab is activated
  useEffect(() => {
    if (isAdminLoggedIn && !isCheckingAuth && activeTab === 'planRequests') {
      const loadRechargeHistory = async () => {
        try {
          setHistoryLoading(true)
          const response = await fetch('/api/transactions?type=recharge&status=all')
          if (response.ok) {
            const data = await response.json()
            setRechargeHistory(data)
          } else {
            console.warn('Failed to load recharge history')
            setRechargeHistory([])
          }
        } catch (error) {
          console.warn('Error loading recharge history:', error)
          setRechargeHistory([])
        } finally {
          setHistoryLoading(false)
        }
      }
      loadRechargeHistory()
    }
  }, [isAdminLoggedIn, isCheckingAuth, activeTab])

  // Load withdraw history when withdrawals tab is activated
  useEffect(() => {
    if (isAdminLoggedIn && !isCheckingAuth && activeTab === 'withdrawals') {
      const loadWithdrawHistory = async () => {
        try {
          setHistoryLoading(true)
          const response = await fetch('/api/transactions?type=withdraw&status=all')
          if (response.ok) {
            const data = await response.json()
            setWithdrawHistory(data)
          } else {
            console.warn('Failed to load withdraw history')
            setWithdrawHistory([])
          }
        } catch (error) {
          console.warn('Error loading withdraw history:', error)
          setWithdrawHistory([])
        } finally {
          setHistoryLoading(false)
        }
      }
      loadWithdrawHistory()
    }
  }, [isAdminLoggedIn, isCheckingAuth, activeTab])

  // Load plan requests when tab is activated
  useEffect(() => {
    if (isAdminLoggedIn && !isCheckingAuth && activeTab === 'planRequests') {
      const loadPlanRequests = async () => {
        setPlanRequestsLoading(true)
        try {
          const res = await fetch('/api/admin/plans?status=pending')
          if (res.ok) {
            const data = await res.json()
            setPlanRequests(data)
          } else {
            setPlanRequests([])
          }
        } catch {
          setPlanRequests([])
        } finally {
          setPlanRequestsLoading(false)
        }
      }
      loadPlanRequests()
    }
  }, [isAdminLoggedIn, isCheckingAuth, activeTab])

  const handlePlanAction = async (userId, planId, action) => {
    try {
      const res = await fetch('/api/admin/plans', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, planId, action })
      })
      if (res.ok) {
        showSuccess(`Plan ${action === 'approve' ? 'approved' : 'rejected'} successfully`)
        // Remove from list
        setPlanRequests(prev => prev.filter(p => p.planId?.toString() !== planId?.toString()))
      } else {
        const data = await res.json()
        showError(data.error || 'Failed to update plan')
      }
    } catch {
      showError('Network error')
    }
  }

  // Load withdraw history when tab is activated
  useEffect(() => {
    if (isAdminLoggedIn && !isCheckingAuth && activeTab === 'withdrawals') {
      const loadWithdrawHistory = async () => {
        try {
          setHistoryLoading(true)
          const response = await fetch('/api/transactions?type=withdraw&status=all')
          if (response.ok) {
            const data = await response.json()
            setWithdrawHistory(data)
          } else {
            console.warn('Failed to load withdraw history')
            setWithdrawHistory([])
          }
        } catch (error) {
          console.warn('Error loading withdraw history:', error)
          setWithdrawHistory([])
        } finally {
          setHistoryLoading(false)
        }
      }
      loadWithdrawHistory()
    }
  }, [isAdminLoggedIn, isCheckingAuth, activeTab])

  // Load recent activities when analytics tab is activated
  useEffect(() => {
    if (isAdminLoggedIn && !isCheckingAuth && activeTab === 'dashboard') {
      const loadRecentActivities = async () => {
        try {
          setActivityLoading(true)
          const response = await fetch('/api/admin/activity?limit=10')
          if (response.ok) {
            const data = await response.json()
            setRecentActivities(data)
          } else {
            console.warn('Failed to load recent activities')
            setRecentActivities([])
          }
        } catch (error) {
          console.warn('Error loading recent activities:', error)
          setRecentActivities([])
        } finally {
          setActivityLoading(false)
        }
      }
      loadRecentActivities()
    }
  }, [isAdminLoggedIn, isCheckingAuth, activeTab])

  // Manual refresh functions
  const refreshRechargeHistory = async () => {
    try {
      setHistoryLoading(true)
      const response = await fetch('/api/transactions?type=recharge&status=all')
      if (response.ok) {
        const data = await response.json()
        setRechargeHistory(data)
        showSuccess('Recharge history refreshed successfully')
      } else {
        showError('Failed to refresh recharge history')
      }
    } catch (error) {
      console.warn('Error refreshing recharge history:', error)
      showError('Error refreshing recharge history')
    } finally {
      setHistoryLoading(false)
    }
  }

  const refreshWithdrawHistory = async () => {
    try {
      setHistoryLoading(true)
      const response = await fetch('/api/transactions?type=withdraw&status=all')
      if (response.ok) {
        const data = await response.json()
        setWithdrawHistory(data)
        showSuccess('Withdraw history refreshed successfully')
      } else {
        showError('Failed to refresh withdraw history')
      }
    } catch (error) {
      console.warn('Error refreshing withdraw history:', error)
      showError('Error refreshing withdraw history')
    } finally {
      setHistoryLoading(false)
    }
  }

  // Update transaction names with user names
  const updateTransactionNames = async () => {
    try {
      setHistoryLoading(true)
      const response = await fetch('/api/transactions/update-names', {
        method: 'POST'
      })
      if (response.ok) {
        const result = await response.json()
        showSuccess(result.message)
        // Refresh both histories after update
        await refreshRechargeHistory()
        await refreshWithdrawHistory()
      } else {
        showError('Failed to update transaction names')
      }
    } catch (error) {
      console.warn('Error updating transaction names:', error)
      showError('Error updating transaction names')
    } finally {
      setHistoryLoading(false)
    }
  }

  // Filter functions
  const getFilteredRechargeHistory = () => {
    if (rechargeFilter === 'all') return rechargeHistory
    return rechargeHistory.filter(transaction => transaction.status === rechargeFilter)
  }

  const getSortedRechargeHistory = () => {
    return [...getFilteredRechargeHistory()].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }

  const getPlanRequestEmptyLabel = () => {
    return rechargeFilter === 'all' ? '' : `${rechargeFilter} `
  }

  const getFilteredWithdrawHistory = () => {
    if (withdrawFilter === 'all') return withdrawHistory
    return withdrawHistory.filter(transaction => transaction.status === withdrawFilter)
  }

  const getSortedWithdrawHistory = () => {
    return [...getFilteredWithdrawHistory()].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  }

  const getWithdrawalAmount = (transaction) => {
    const amount = transaction.amountAfterFee || transaction.amount || 0
    return Number(amount).toFixed(2)
  }

  const getWithdrawalAccount = (transaction) => {
    return transaction.withdrawalNumber || transaction.withdrawalAccountNumber || 'Not provided'
  }

  const getWithdrawalEmptyLabel = () => {
    return withdrawFilter === 'all' ? '' : `${withdrawFilter} `
  }

  // Helper function to format date in Pakistan timezone
  const formatPakistanDate = (dateString) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'Invalid Date'
      
      return date.toLocaleDateString('en-PK', { 
        timeZone: 'Asia/Karachi',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      })
    } catch (error) {
      return 'Invalid Date'
    }
  }

  // Helper function to format time in Pakistan timezone
  const formatPakistanTime = (dateString) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return 'Invalid Time'
      
      return date.toLocaleTimeString('en-PK', { 
        timeZone: 'Asia/Karachi',
        hour12: true,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    } catch (error) {
      return 'Invalid Time'
    }
  }

  // Handle recharge approval
  const handleRechargeApproval = async (requestId, approved) => {
    try {
      // Call the API to update the transaction status
      const response = await fetch('/api/transactions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId: requestId,
          action: approved ? 'approve' : 'reject'
        }),
      });

      if (response.ok) {
        showSuccess(`Recharge request ${approved ? 'approved' : 'rejected'} successfully`);
        // Refresh the pending requests list and recharge history
        const loadPendingRequests = async () => {
          try {
            const rechargeResponse = await fetch('/api/transactions?type=recharge&status=pending')
            const withdrawResponse = await fetch('/api/transactions?type=withdraw&status=pending')
            const rechargeHistoryResponse = await fetch('/api/transactions?type=recharge&status=all')
            
            if (rechargeResponse.ok) {
              const rechargeData = await rechargeResponse.json()
              setPendingRechargeRequests(rechargeData)
            }
            
            if (withdrawResponse.ok) {
              const withdrawData = await withdrawResponse.json()
              setPendingWithdrawRequests(withdrawData)
            }

            if (rechargeHistoryResponse.ok) {
              const rechargeHistoryData = await rechargeHistoryResponse.json()
              setRechargeHistory(rechargeHistoryData)
            }
          } catch (error) {
            console.warn('Error loading pending requests:', error)
          }
        }
        loadPendingRequests()
      } else {
        const errorData = await response.json()
        showError(errorData.message || 'Failed to update transaction status')
      }
    } catch (error) {
      console.warn('Error updating transaction:', error)
      showError('Failed to update transaction status')
    }
  }

  // Handle withdraw approval
  const handleWithdrawApproval = async (requestId, approved) => {
    try {
      // Call the API to update the transaction status
      const response = await fetch('/api/transactions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId: requestId,
          action: approved ? 'approve' : 'reject'
        }),
      });

      if (response.ok) {
        showSuccess(`Withdrawal request ${approved ? 'approved' : 'rejected'} successfully`);
        // Refresh the pending requests list and withdrawal history
        const loadPendingRequests = async () => {
          try {
            const rechargeResponse = await fetch('/api/transactions?type=recharge&status=pending')
            const withdrawResponse = await fetch('/api/transactions?type=withdraw&status=pending')
            const withdrawHistoryResponse = await fetch('/api/transactions?type=withdraw&status=all')
            
            if (rechargeResponse.ok) {
              const rechargeData = await rechargeResponse.json()
              setPendingRechargeRequests(rechargeData)
            }
            
            if (withdrawResponse.ok) {
              const withdrawData = await withdrawResponse.json()
              setPendingWithdrawRequests(withdrawData)
            }

            if (withdrawHistoryResponse.ok) {
              const withdrawHistoryData = await withdrawHistoryResponse.json()
              setWithdrawHistory(withdrawHistoryData)
            }
          } catch (error) {
            console.warn('Error loading pending requests:', error)
          }
        }
        loadPendingRequests()
      } else {
        const errorData = await response.json()
        showError(errorData.message || 'Failed to update transaction status')
      }
    } catch (error) {
      console.warn('Error updating transaction:', error)
      showError('Failed to update transaction status')
    }
  }

  // Handle user management
  const handleBlockUser = async (userId) => {
    if (confirm('Are you sure you want to block this user?')) {
      try {
        const response = await fetch('/api/admin/users', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: userId,
            action: 'toggleBlock'
          }),
        })

        if (response.ok) {
          // Refresh users list
          const loadUsers = async () => {
            try {
              const userResponse = await fetch('/api/admin/users')
              if (userResponse.ok) {
                const userData = await userResponse.json()
                setUsers(userData.users || [])
              }
            } catch (error) {
              console.warn('Error refreshing users:', error)
            }
          }
          loadUsers()
          
          const user = users.find(u => u.phone === userId)
          const action = user?.isBlocked ? 'unblocked' : 'blocked'
          showSuccess(`User ${userId} has been ${action}`)
        } else {
          showError('Failed to update user status')
        }
      } catch (error) {
        console.warn('Error blocking user:', error)
        showError('Failed to update user status')
      }
    }
  }

  const handleApproveUser = async (userId) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          action: 'approve'
        }),
      })

      if (response.ok) {
        const loadUsers = async () => {
          try {
            const userResponse = await fetch('/api/admin/users')
            if (userResponse.ok) {
              const userData = await userResponse.json()
              setUsers(userData.users || [])
            }
          } catch (error) {
            console.warn('Error refreshing users:', error)
          }
        }
        await loadUsers()
        showSuccess(`User registration approved successfully`)
      } else {
        showError('Failed to approve user')
      }
    } catch (error) {
      console.warn('Error approving user:', error)
      showError('Failed to approve user')
    }
  }

  const handleRejectUser = async (userId) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          action: 'reject'
        }),
      })

      if (response.ok) {
        const loadUsers = async () => {
          try {
            const userResponse = await fetch('/api/admin/users')
            if (userResponse.ok) {
              const userData = await userResponse.json()
              setUsers(userData.users || [])
            }
          } catch (error) {
            console.warn('Error refreshing users:', error)
          }
        }
        await loadUsers()
        showSuccess(`User registration rejected successfully`)
      } else {
        showError('Failed to reject user')
      }
    } catch (error) {
      console.warn('Error rejecting user:', error)
      showError('Failed to reject user')
    }
  }

  const handleDeleteUser = async (userId) => {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        const response = await fetch('/api/admin/users', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: userId,
            action: 'delete'
          }),
        })

        if (response.ok) {
          // Refresh users list
          const loadUsers = async () => {
            try {
              const userResponse = await fetch('/api/admin/users')
              if (userResponse.ok) {
                const userData = await userResponse.json()
                setUsers(userData.users || [])
              }
            } catch (error) {
              console.warn('Error refreshing users:', error)
            }
          }
          loadUsers()
          
          showSuccess(`User ${userId} has been deleted successfully`)
        } else {
          showError('Failed to delete user')
        }
      } catch (error) {
        console.warn('Error deleting user:', error)
        showError('Failed to delete user')
      }
    }
  }

  const handleResetUserPassword = (userId) => {
    if (confirm('Reset password for this user? They will need to set a new password on next login.')) {
      const updatedUsers = users.map(user => 
        user.phone === userId 
          ? { ...user, passwordReset: true }
          : user
      )
      setUsers(updatedUsers)
      localStorage.setItem('registeredUsers', JSON.stringify(updatedUsers))
      showSuccess('Password reset initiated. User will be prompted to set a new password on next login.')
    }
  }

  const refreshUsers = async () => {
    if (isUsersLoading) return
    try {
      setIsUsersLoading(true)
      const response = await fetch('/api/admin/users?limit=1000')
      if (response.ok) {
        const data = await response.json()
        updateUsersWithCache(data.users || [])
        showSuccess(`Users list refreshed successfully! Found ${data.users?.length || 0} users.`)
      } else {
        showError('Failed to refresh users list')
      }
    } catch (error) {
      console.warn('Error refreshing users:', error)
      showError('Failed to refresh users list')
    } finally {
      setIsUsersLoading(false)
    }
  }

  const getUserKey = (user) => user.phone || user._id

  const getUserInitials = (name = '') => {
    const initials = name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()

    return initials || 'U'
  }

  const fetchEditingUserTeamData = async (phone) => {
    try {
      const response = await fetch(`/api/user/team?userId=${phone}`)
      if (response.ok) {
        const data = await response.json()
        setEditUserTeamData(data)
      }
    } catch (error) {
      console.warn('Error fetching editing user team:', error)
    }
  }

  const handleAddNetworkMember = async (e) => {
    e.preventDefault()
    if (!networkMemberForm.name.trim() || !networkMemberForm.phone.trim() || !networkMemberForm.password.trim()) {
      showError('Name, phone, and password are required')
      return
    }

    try {
      setIsAddingNetworkMember(true)
      const response = await fetch('/api/admin/add-network-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referrerPhone: editingUserData.phone,
          ...networkMemberForm
        })
      })

      const data = await response.json()
      if (response.ok) {
        showSuccess('Referral member added to network successfully!')
        setNetworkMemberForm({
          name: '',
          email: '',
          phone: '',
          password: 'password123',
          level: 'A',
          planName: 'Free',
          planAmount: '0'
        })
        // Refresh team details list
        await fetchEditingUserTeamData(editingUserData.phone)
      } else {
        showError(data.error || 'Failed to add member to network')
      }
    } catch (error) {
      console.warn('Error adding network member:', error)
      showError('Error adding network member')
    } finally {
      setIsAddingNetworkMember(false)
    }
  }

  const handleStartEditUser = (user) => {
    setEditUserTeamData(null)
    fetchEditingUserTeamData(user.phone)
    setEditingUserData(user)
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      password: '',
      balance: user.balance || 0,
      earnBalance: user.earnBalance || 0,
      totalCommissionEarned: user.totalCommissionEarned || 0,
      totalRecharge: user.totalRecharge || 0,
      status: user.status || 'approved',
      isBlocked: !!user.isBlocked,
      isAdmin: !!user.isAdmin,
      investmentPlans: user.investmentPlans ? JSON.parse(JSON.stringify(user.investmentPlans)) : [],
      withdrawHistory: user.withdrawHistory ? JSON.parse(JSON.stringify(user.withdrawHistory)) : [],
      rechargeHistory: user.rechargeHistory ? JSON.parse(JSON.stringify(user.rechargeHistory)) : [],
      customTotalEarnings: user.customTotalEarnings !== undefined && user.customTotalEarnings !== null ? String(user.customTotalEarnings) : '',
      customMySalary: user.customMySalary !== undefined && user.customMySalary !== null ? String(user.customMySalary) : '',
      customTotalWithdrawals: user.customTotalWithdrawals !== undefined && user.customTotalWithdrawals !== null ? String(user.customTotalWithdrawals) : '',
      customDirectReferrals: user.customDirectReferrals !== undefined && user.customDirectReferrals !== null ? String(user.customDirectReferrals) : '',
      customIndirectReferrals: user.customIndirectReferrals !== undefined && user.customIndirectReferrals !== null ? String(user.customIndirectReferrals) : '',
      customAdEarning: user.customAdEarning !== undefined && user.customAdEarning !== null ? String(user.customAdEarning) : ''
    })
  }

  const handleSaveEditUser = async () => {
    if (!editForm.name.trim() || !editForm.phone.trim()) {
      showError('Name and phone are required')
      return
    }
    
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: editingUserData._id || editingUserData.phone,
          action: 'edit_user',
          data: editForm
        }),
      })

      if (response.ok) {
        showSuccess('User updated successfully!')
        setEditingUserData(null)
        await refreshUsers()
      } else {
        const errorData = await response.json()
        showError(errorData.error || 'Failed to update user')
      }
    } catch (error) {
      console.warn('Error updating user:', error)
      showError('Error updating user')
    } finally {
      setIsLoading(false)
    }
  }

  const handleImpersonateUser = (user) => {
    if (confirm(`Are you sure you want to log in as and access the dashboard of ${user.name || user.phone}?`)) {
      const userData = {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isAdmin: !!user.isAdmin
      }
      localStorage.setItem('user', JSON.stringify(userData))
      
      // Clear cached data of any previous session to prevent overlapping/caching bugs
      localStorage.removeItem('hmh-profile')
      localStorage.removeItem('hmh-active-page')
      localStorage.removeItem('hmh-active-plan')
      localStorage.removeItem('hmh-team-data')

      window.open('/', '_blank')
      showSuccess(`Impersonation session started for ${user.name}`)
    }
  }

  const filteredUsers = users.filter((user) => {
    const q = userSearchQuery.trim().toLowerCase()
    if (!q) return true

    return [user.name, user.phone, user.referralCode, user._id]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(q))
  })

  // Handle payment details update
  const handleUpdatePaymentDetails = (method, field, value) => {
    const updatedPaymentDetails = {
      ...paymentDetails,
      [method]: {
        ...paymentDetails[method],
        [field]: value
      }
    }
    setPaymentDetails(updatedPaymentDetails)
  }

  // Handle saving payment details to database
  const handleSavePaymentDetails = async () => {
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: 'paymentDetails',
          value: paymentDetails,
          description: 'Payment method details for user recharges'
        }),
      })

      if (response.ok) {
        showSuccess('Payment settings saved successfully!')
        localStorage.setItem('paymentDetails', JSON.stringify(paymentDetails))
      } else {
        const error = await response.json()
        showError(error.message || 'Failed to save payment settings')
      }
    } catch (error) {
      console.warn('Error saving payment settings:', error)
      showError('Failed to save payment settings')
    }
  }

  // Coupon management functions
  const handleAddCoupon = async () => {
    if (!newCoupon.code || !newCoupon.bonusAmount) {
      showError('Please fill in all required fields')
      return
    }

    try {
      const response = await fetch('/api/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: newCoupon.code.toUpperCase(),
          bonusAmount: parseFloat(newCoupon.bonusAmount),
          maxUsage: newCoupon.maxUsage ? parseInt(newCoupon.maxUsage) : null,
          isActive: newCoupon.isActive,
          description: newCoupon.description
        }),
      })

      if (response.ok) {
        const coupon = await response.json()
        setCoupons(prev => [...prev, coupon])
        
        // Reset form
        setNewCoupon({
          code: '',
          bonusAmount: '',
          maxUsage: '',
          isActive: true,
          description: ''
        })
        setShowAddCoupon(false)
        showSuccess('Coupon created successfully!')
      } else {
        const error = await response.json()
        showError(error.message || 'Failed to create coupon')
      }
    } catch (error) {
      console.warn('Error creating coupon:', error)
      showError('Failed to create coupon')
    }
  }

  const handleToggleCouponStatus = async (couponId) => {
    try {
      const response = await fetch('/api/coupons', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          couponId: couponId,
          action: 'toggle'
        }),
      })

      if (response.ok) {
        const updatedCoupon = await response.json()
        setCoupons(prev => prev.map(coupon => 
          coupon._id === couponId ? updatedCoupon : coupon
        ))
        showSuccess('Coupon status updated successfully!')
      } else {
        const error = await response.json()
        showError(error.message || 'Failed to update coupon')
      }
    } catch (error) {
      console.warn('Error updating coupon:', error)
      showError('Failed to update coupon')
    }
  }

  const handleDeleteCoupon = async (couponId) => {
    if (confirm('Are you sure you want to delete this coupon?')) {
      try {
        const response = await fetch(`/api/coupons?id=${couponId}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          setCoupons(prev => prev.filter(coupon => coupon._id !== couponId))
          showSuccess('Coupon deleted successfully!')
        } else {
          const error = await response.json()
          showError(error.message || 'Failed to delete coupon')
        }
      } catch (error) {
        console.warn('Error deleting coupon:', error)
        showError('Failed to delete coupon')
      }
    }
  }

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Checking admin access...</p>
        </div>
      </div>
    )
  }

  // Don't render if not admin logged in
  if (!isAdminLoggedIn) {
    return null
  }

  if (isAppLoading) return <Loader />;

  return (
    <AdminShell
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onLogout={handleLogout}
    >
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
        {activeTab === 'users' && (
          <div className={styles.usersPage}>
            <div className={styles.pageHeadRow}>
              <div>
                <h2 className={styles.pageTitle}>All Users</h2>
                <p className={styles.pageSub}>
                  {users.length} registered user{users.length === 1 ? '' : 's'}
                </p>
              </div>
              <button
                type="button"
                onClick={refreshUsers}
                className={`${styles.btn} ${styles.btnOutline}`}
                disabled={isUsersLoading}
              >
                <svg 
                  className={styles.btnIcon} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  style={{ animation: isUsersLoading ? 'spin 1s linear infinite' : 'none' }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{isUsersLoading ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            </div>

            <div className={styles.searchBox}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                value={userSearchQuery}
                onChange={(event) => setUserSearchQuery(event.target.value)}
                placeholder="Search by name or email..."
              />
            </div>
            
            {isUsersLoading && users.length === 0 ? (
              <div className={styles.empty}>
                <svg 
                  className={styles.btnIcon} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  style={{ animation: 'spin 1.5s linear infinite', width: '36px', height: '36px', margin: '0 auto 12px auto' }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <p>Loading users...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className={styles.empty}>
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <p>No users found</p>
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div className={styles.card} key={getUserKey(user)}>
                  <div className={styles.cardTop}>
                    <div className={styles.userBlock}>
                      {user.profilePicture ? (
                        <img 
                          src={user.profilePicture} 
                          alt="avatar" 
                          className={styles.avatar} 
                          style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} 
                        />
                      ) : (
                        <div className={styles.avatar}>{getUserInitials(user.name)}</div>
                      )}
                      <div>
                        <div className={styles.userName}>{user.name || 'Unknown User'}</div>
                        <div className={styles.userEmail}>{user.email || user.phone || 'No email provided'}</div>
                      </div>
                    </div>
                    <span className={`${styles.status} ${user.isBlocked ? styles.suspended : styles.active}`}>
                      {user.isBlocked ? 'suspended' : 'active'}
                    </span>
                    <span className={`${styles.status} ${
                      user.status === 'approved' ? styles.approved :
                      user.status === 'rejected' ? styles.rejected :
                      styles.pending
                    }`} style={{ marginLeft: '8px' }}>
                      {user.status || 'pending'}
                    </span>
                  </div>
                  <div className={styles.detailGrid}>
                    <div>
                      <div className={styles.detailLabel}>Plan</div>
                      <div className={styles.detailValue}>
                        {[...(user.investmentPlans || [])].reverse().find((plan) => plan.status === 'active')?.planName || 'Free'}
                      </div>
                    </div>
                    <div>
                      <div className={styles.detailLabel}>Balance</div>
                      <div className={`${styles.detailValue} ${styles.amount}`}>
                        Rs{Number(user.balance || 0).toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className={styles.detailLabel}>Joined</div>
                      <div className={styles.detailValue}>
                        {user.createdAt ? formatPakistanDate(user.createdAt) : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className={styles.detailLabel}>User ID</div>
                      <div className={styles.detailValue}>{user.phone || user._id}</div>
                    </div>
                  </div>
                  <div className={styles.cardActions}>
                    <button
                      type="button"
                      className={`${styles.btn}`}
                      style={{ backgroundColor: 'var(--gold)', color: '#fff', borderColor: 'var(--gold)' }}
                      onClick={() => handleStartEditUser(user)}
                    >
                      Edit User
                    </button>
                    <button
                      type="button"
                      className={`${styles.btn}`}
                      style={{ backgroundColor: '#3490dc', color: '#fff', borderColor: '#3490dc' }}
                      onClick={() => handleImpersonateUser(user)}
                    >
                      Access Dashboard
                    </button>
                    {user.status !== 'approved' && (
                      <button
                        type="button"
                        className={`${styles.btn}`}
                        style={{ backgroundColor: 'var(--green)', color: '#fff', borderColor: 'var(--green)' }}
                        onClick={() => handleApproveUser(getUserKey(user))}
                      >
                        Approve Registration
                      </button>
                    )}
                    {user.status !== 'rejected' && user.status !== 'approved' && (
                      <button
                        type="button"
                        className={`${styles.btn} ${styles.btnDangerOutline}`}
                        onClick={() => handleRejectUser(getUserKey(user))}
                      >
                        Reject
                      </button>
                    )}
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnOutline}`}
                      onClick={() => handleBlockUser(getUserKey(user))}
                    >
                      {user.isBlocked ? 'Reactivate' : 'Suspend'}
                    </button>
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnDangerOutline}`}
                      onClick={() => handleDeleteUser(getUserKey(user))}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {editingUserData && (
          <div className={styles.editModal}>
            <div className={styles.editModalBox} style={{ maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }}>
              <div className={styles.editModalTitle}>Edit User Profile: {editingUserData.name || editingUserData.phone}</div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                {/* Basic Fields */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Full Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: '8px 12px', borderRadius: '6px', color: '#fff' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Phone (User ID)</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={e => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: '8px 12px', borderRadius: '6px', color: '#fff' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Email Address</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={e => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: '8px 12px', borderRadius: '6px', color: '#fff' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-dim)' }}>New Password (leave empty to keep current)</label>
                  <input
                    type="password"
                    placeholder="Set new password..."
                    value={editForm.password}
                    onChange={e => setEditForm(prev => ({ ...prev, password: e.target.value }))}
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: '8px 12px', borderRadius: '6px', color: '#fff' }}
                  />
                </div>
              </div>

              {/* Financial Fields */}
              <div className={styles.editModalTitle} style={{ fontSize: '14px', marginTop: '24px', marginBottom: '12px' }}>Financial Balances</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Deposit Balance (Rs)</label>
                  <input
                    type="number"
                    value={editForm.balance}
                    onChange={e => setEditForm(prev => ({ ...prev, balance: parseFloat(e.target.value) || 0 }))}
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: '8px 12px', borderRadius: '6px', color: '#fff' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Earning Balance (Rs)</label>
                  <input
                    type="number"
                    value={editForm.earnBalance}
                    onChange={e => setEditForm(prev => ({ ...prev, earnBalance: parseFloat(e.target.value) || 0 }))}
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: '8px 12px', borderRadius: '6px', color: '#fff' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Total Recharge (Rs)</label>
                  <input
                    type="number"
                    value={editForm.totalRecharge}
                    onChange={e => setEditForm(prev => ({ ...prev, totalRecharge: parseFloat(e.target.value) || 0 }))}
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: '8px 12px', borderRadius: '6px', color: '#fff' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Total Commission Earned (Rs)</label>
                  <input
                    type="number"
                    value={editForm.totalCommissionEarned}
                    onChange={e => setEditForm(prev => ({ ...prev, totalCommissionEarned: parseFloat(e.target.value) || 0 }))}
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: '8px 12px', borderRadius: '6px', color: '#fff' }}
                  />
                </div>
              </div>

              {/* Custom Overrides */}
              <div className={styles.editModalTitle} style={{ fontSize: '14px', marginTop: '24px', marginBottom: '12px' }}>Dashboard Display Overrides (Leave empty to use actual data)</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Total Earnings Override (Rs)</label>
                  <input
                    type="number"
                    placeholder="Use actual..."
                    value={editForm.customTotalEarnings}
                    onChange={e => setEditForm(prev => ({ ...prev, customTotalEarnings: e.target.value }))}
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: '8px 12px', borderRadius: '6px', color: '#fff' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-dim)' }}>My Salary Override (Rs)</label>
                  <input
                    type="number"
                    placeholder="Use actual..."
                    value={editForm.customMySalary}
                    onChange={e => setEditForm(prev => ({ ...prev, customMySalary: e.target.value }))}
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: '8px 12px', borderRadius: '6px', color: '#fff' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Total Withdrawals Override (Rs)</label>
                  <input
                    type="number"
                    placeholder="Use actual..."
                    value={editForm.customTotalWithdrawals}
                    onChange={e => setEditForm(prev => ({ ...prev, customTotalWithdrawals: e.target.value }))}
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: '8px 12px', borderRadius: '6px', color: '#fff' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Direct Referrals Count Override</label>
                  <input
                    type="number"
                    placeholder="Use actual..."
                    value={editForm.customDirectReferrals}
                    onChange={e => setEditForm(prev => ({ ...prev, customDirectReferrals: e.target.value }))}
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: '8px 12px', borderRadius: '6px', color: '#fff' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Indirect Referrals Count Override</label>
                  <input
                    type="number"
                    placeholder="Use actual..."
                    value={editForm.customIndirectReferrals}
                    onChange={e => setEditForm(prev => ({ ...prev, customIndirectReferrals: e.target.value }))}
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: '8px 12px', borderRadius: '6px', color: '#fff' }}
                  />
                </div>
              </div>

              {/* Custom Ad Earning Override */}
              <div className={styles.editModalTitle} style={{ fontSize: '14px', marginTop: '8px', marginBottom: '12px', color: 'var(--gold)' }}>Ad Earning Override</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px', background: 'rgba(201,160,74,0.06)', border: '1px solid rgba(201,160,74,0.2)', borderRadius: '10px', padding: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--gold)' }}>Custom Daily Ad Reward (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Nil (use plan default)"
                    value={editForm.customAdEarning}
                    onChange={e => setEditForm(prev => ({ ...prev, customAdEarning: e.target.value }))}
                    style={{ background: 'var(--bg)', border: '1px solid rgba(201,160,74,0.4)', padding: '8px 12px', borderRadius: '6px', color: '#fff' }}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>Leave empty = user earns based on their plan. Set a $ amount to override their ad reward.</span>
                </div>
              </div>

              {/* Status and Access Toggles */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px', background: 'var(--surface-2)', padding: '12px', borderRadius: '8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Status</label>
                  <select
                    value={editForm.status}
                    onChange={e => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: '6px 10px', borderRadius: '6px', color: '#fff' }}
                  >
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '100%', paddingTop: '16px' }}>
                  <input
                    type="checkbox"
                    id="edit_isBlocked"
                    checked={editForm.isBlocked}
                    onChange={e => setEditForm(prev => ({ ...prev, isBlocked: e.target.checked }))}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <label htmlFor="edit_isBlocked" style={{ fontSize: '13px', color: '#fff', cursor: 'pointer' }}>Suspended</label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '100%', paddingTop: '16px' }}>
                  <input
                    type="checkbox"
                    id="edit_isAdmin"
                    checked={editForm.isAdmin}
                    onChange={e => setEditForm(prev => ({ ...prev, isAdmin: e.target.checked }))}
                    style={{ width: '16px', height: '16px' }}
                  />
                  <label htmlFor="edit_isAdmin" style={{ fontSize: '13px', color: '#fff', cursor: 'pointer' }}>Is Admin</label>
                </div>
              </div>

              {/* User Investment Plans Section */}
              <div className={styles.editModalTitle} style={{ fontSize: '14px', marginTop: '24px', marginBottom: '12px' }}>Investment Plans ({editForm.investmentPlans.length})</div>
              
              <div style={{ background: 'var(--surface-2)', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '10px', color: 'var(--gold-bright)' }}>Add Custom Investment Plan</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr auto', gap: '8px', alignItems: 'end' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Select Plan</label>
                    <select
                      value={newPlanToAdd.planName}
                      onChange={e => {
                        const planName = e.target.value
                        const matchedPlan = samplePlans.find(p => p.name === planName)
                        setNewPlanToAdd(prev => ({
                          ...prev,
                          planName,
                          amount: matchedPlan ? parseFloat(matchedPlan.investAmount.replace(/[^0-9.]/g, '')) || 0 : 0
                        }))
                      }}
                      style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', padding: '6px', borderRadius: '4px', color: '#fff' }}
                    >
                      <option value="">-- Choose Plan --</option>
                      {samplePlans.map(p => (
                        <option key={p._id} value={p.name}>{p.name} ({p.investAmount})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Amount (Rs)</label>
                    <input
                      type="number"
                      value={newPlanToAdd.amount}
                      onChange={e => setNewPlanToAdd(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                      style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', padding: '6px', borderRadius: '4px', color: '#fff' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Status</label>
                    <select
                      value={newPlanToAdd.status}
                      onChange={e => setNewPlanToAdd(prev => ({ ...prev, status: e.target.value }))}
                      style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', padding: '6px', borderRadius: '4px', color: '#fff' }}
                    >
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Start Date</label>
                    <input
                      type="date"
                      value={newPlanToAdd.startDate}
                      onChange={e => setNewPlanToAdd(prev => ({ ...prev, startDate: e.target.value }))}
                      style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', padding: '5px', borderRadius: '4px', color: '#fff' }}
                    />
                  </div>
                  <button
                    type="button"
                    className={styles.btn}
                    onClick={() => {
                      if (!newPlanToAdd.planName) {
                        showError('Please select a plan')
                        return
                      }
                      const dateObj = newPlanToAdd.startDate ? new Date(newPlanToAdd.startDate) : new Date()
                      const updatedPlans = [...editForm.investmentPlans, {
                        _id: 'new_' + Date.now(),
                        planName: newPlanToAdd.planName,
                        amount: newPlanToAdd.amount,
                        status: newPlanToAdd.status,
                        startDate: dateObj,
                        paymentMethod: 'admin_manual',
                        createdAt: new Date()
                      }]
                      setEditForm(prev => ({ ...prev, investmentPlans: updatedPlans }))
                      setNewPlanToAdd({ planName: '', amount: 0, status: 'active', startDate: '' })
                      showSuccess('Plan added to list')
                    }}
                    style={{ height: '34px', padding: '0 12px' }}
                  >
                    Add
                  </button>
                </div>
              </div>

              {editForm.investmentPlans.length === 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--text-dim)', fontStyle: 'italic', marginBottom: '24px' }}>No investment plans found for this user.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px', maxHeight: '180px', overflowY: 'auto' }}>
                  {editForm.investmentPlans.map((plan, index) => (
                    <div key={plan._id || index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface-2)', padding: '8px 12px', borderRadius: '6px', gap: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{plan.planName}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                          Rs{plan.amount} · Start: {plan.startDate ? formatPakistanDate(plan.startDate) : 'N/A'}
                        </div>
                      </div>
                      <select
                        value={plan.status}
                        onChange={e => {
                          const updated = [...editForm.investmentPlans]
                          updated[index].status = e.target.value
                          setEditForm(prev => ({ ...prev, investmentPlans: updated }))
                        }}
                        style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: '4px 8px', borderRadius: '4px', color: '#fff', fontSize: '12px' }}
                      >
                        <option value="pending">Pending</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = editForm.investmentPlans.filter((_, idx) => idx !== index)
                          setEditForm(prev => ({ ...prev, investmentPlans: updated }))
                        }}
                        style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontSize: '16px' }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* User Withdrawal History Section */}
              <div className={styles.editModalTitle} style={{ fontSize: '14px', marginTop: '24px', marginBottom: '12px' }}>Withdrawals ({editForm.withdrawHistory.length})</div>
              
              <div style={{ background: 'var(--surface-2)', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '10px', color: 'var(--gold-bright)' }}>Add Manual Withdrawal Record</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '8px', alignItems: 'end' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Amount (Rs)</label>
                    <input
                      type="number"
                      value={newWdToAdd.amount}
                      onChange={e => setNewWdToAdd(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                      style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', padding: '6px', borderRadius: '4px', color: '#fff' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Status</label>
                    <select
                      value={newWdToAdd.status}
                      onChange={e => setNewWdToAdd(prev => ({ ...prev, status: e.target.value }))}
                      style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', padding: '6px', borderRadius: '4px', color: '#fff' }}
                    >
                      <option value="approved">Approved</option>
                      <option value="pending">Pending</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Date</label>
                    <input
                      type="date"
                      value={newWdToAdd.date}
                      onChange={e => setNewWdToAdd(prev => ({ ...prev, date: e.target.value }))}
                      style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', padding: '5px', borderRadius: '4px', color: '#fff' }}
                    />
                  </div>
                  <button
                    type="button"
                    className={styles.btn}
                    onClick={() => {
                      if (newWdToAdd.amount <= 0) {
                        showError('Please enter a valid amount')
                        return
                      }
                      const dateObj = newWdToAdd.date ? new Date(newWdToAdd.date) : new Date()
                      const updatedWd = [...editForm.withdrawHistory, {
                        _id: 'new_wd_' + Date.now(),
                        amount: newWdToAdd.amount,
                        status: newWdToAdd.status,
                        date: dateObj
                      }]
                      setEditForm(prev => ({ ...prev, withdrawHistory: updatedWd }))
                      setNewWdToAdd({ amount: 0, status: 'approved', date: '' })
                      showSuccess('Withdrawal added to list')
                    }}
                    style={{ height: '34px', padding: '0 12px' }}
                  >
                    Add
                  </button>
                </div>
              </div>

              {editForm.withdrawHistory.length === 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--text-dim)', fontStyle: 'italic', marginBottom: '24px' }}>No withdrawals found for this user.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px', maxHeight: '180px', overflowY: 'auto' }}>
                  {editForm.withdrawHistory.map((wd, index) => (
                    <div key={wd._id || index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface-2)', padding: '8px 12px', borderRadius: '6px', gap: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 'bold' }}>Rs{wd.amount}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                          Date: {wd.date ? formatPakistanDate(wd.date) : 'N/A'}
                        </div>
                      </div>
                      <select
                        value={wd.status}
                        onChange={e => {
                          const updated = [...editForm.withdrawHistory]
                          updated[index].status = e.target.value
                          setEditForm(prev => ({ ...prev, withdrawHistory: updated }))
                        }}
                        style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: '4px 8px', borderRadius: '4px', color: '#fff', fontSize: '12px' }}
                      >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = editForm.withdrawHistory.filter((_, idx) => idx !== index)
                          setEditForm(prev => ({ ...prev, withdrawHistory: updated }))
                        }}
                        style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontSize: '16px' }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Referral Network Section */}
              <div className={styles.editModalTitle} style={{ fontSize: '14px', marginTop: '24px', marginBottom: '12px' }}>Referral Network</div>
              
              {/* Add Network Member Form */}
              <div style={{ background: 'var(--surface-2)', padding: '16px', borderRadius: '10px', marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '13px', color: 'var(--gold)' }}>Add Member to Network</h4>
                <form onSubmit={handleAddNetworkMember} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Name</label>
                    <input
                      type="text"
                      placeholder="Member's full name"
                      value={networkMemberForm.name}
                      onChange={e => setNetworkMemberForm(prev => ({ ...prev, name: e.target.value }))}
                      style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: '6px 10px', borderRadius: '4px', color: '#fff', fontSize: '12px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Email</label>
                    <input
                      type="email"
                      placeholder="Member's email"
                      value={networkMemberForm.email}
                      onChange={e => setNetworkMemberForm(prev => ({ ...prev, email: e.target.value }))}
                      style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: '6px 10px', borderRadius: '4px', color: '#fff', fontSize: '12px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Phone (User ID)</label>
                    <input
                      type="text"
                      placeholder="03*********"
                      value={networkMemberForm.phone}
                      onChange={e => setNetworkMemberForm(prev => ({ ...prev, phone: e.target.value }))}
                      style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: '6px 10px', borderRadius: '4px', color: '#fff', fontSize: '12px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Password</label>
                    <input
                      type="text"
                      placeholder="Password"
                      value={networkMemberForm.password}
                      onChange={e => setNetworkMemberForm(prev => ({ ...prev, password: e.target.value }))}
                      style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: '6px 10px', borderRadius: '4px', color: '#fff', fontSize: '12px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Referral Level</label>
                    <select
                      value={networkMemberForm.level}
                      onChange={e => setNetworkMemberForm(prev => ({ ...prev, level: e.target.value }))}
                      style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: '6px 10px', borderRadius: '4px', color: '#fff', fontSize: '12px' }}
                    >
                      <option value="A">Level A (Direct Referral)</option>
                      <option value="B">Level B (Indirect Referral)</option>
                      <option value="C">Level C (Downline Referral)</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Plan</label>
                      <select
                        value={networkMemberForm.planName}
                        onChange={e => {
                          const name = e.target.value;
                          let amount = '0';
                          if (name === 'Basic') amount = '1000';
                          else if (name === 'Standard') amount = '3000';
                          else if (name === 'Diamond') amount = '6000';
                          else if (name === 'Pro') amount = '12000';
                          else if (name === 'Premium') amount = '25000';
                          else if (name === 'Legend') amount = '50000';
                          setNetworkMemberForm(prev => ({ ...prev, planName: name, planAmount: amount }));
                        }}
                        style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: '6px 10px', borderRadius: '4px', color: '#fff', fontSize: '12px' }}
                      >
                        <option value="Free">Free Plan (Rs0)</option>
                        <option value="Basic">Basic Plan (Rs1,000)</option>
                        <option value="Standard">Standard Plan (Rs3,000)</option>
                        <option value="Diamond">Diamond Plan (Rs6,000)</option>
                        <option value="Pro">Pro Plan (Rs12,000)</option>
                        <option value="Premium">Premium Plan (Rs25,000)</option>
                        <option value="Legend">Legend Plan (Rs50,000)</option>
                      </select>
                    </div>
                    <div style={{ width: '80px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Amount</label>
                      <input
                        type="number"
                        value={networkMemberForm.planAmount}
                        onChange={e => setNetworkMemberForm(prev => ({ ...prev, planAmount: e.target.value }))}
                        style={{ background: 'var(--bg)', border: '1px solid var(--border)', padding: '6px 10px', borderRadius: '4px', color: '#fff', fontSize: '12px' }}
                      />
                    </div>
                  </div>
                  <div style={{ gridColumn: 'span 2', marginTop: '6px' }}>
                    <button
                      type="submit"
                      disabled={isAddingNetworkMember}
                      className={styles.btn}
                      style={{ width: '100%', backgroundColor: 'var(--gold)', color: '#000', fontWeight: 'bold' }}
                    >
                      {isAddingNetworkMember ? 'Adding member...' : 'Add Member to Network'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Network Members Lists */}
              {editUserTeamData ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                  {/* Level A */}
                  <div>
                    <h5 style={{ margin: '0 0 6px', fontSize: '12.5px', color: '#fff' }}>
                      👤 Level A - Direct Referrals ({editUserTeamData.levelA?.count || 0})
                    </h5>
                    {editUserTeamData.levelA?.members?.length === 0 ? (
                      <p style={{ fontSize: '12px', color: 'var(--text-dim)', fontStyle: 'italic', margin: 0 }}>No Level A members</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '150px', overflowY: 'auto' }}>
                        {editUserTeamData.levelA.members.map((m, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)', padding: '6px 10px', borderRadius: '4px', fontSize: '12px' }}>
                            <div>
                              <strong>{m.name}</strong> ({m.phone})<br/>
                              <span style={{ fontSize: '10.5px', color: 'var(--text-dim)' }}>Email: {m.email || 'N/A'}</span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span className="badge" style={{ background: 'var(--gold-bg)', color: 'var(--gold-bright)', fontSize: '10.5px', padding: '2px 6px', borderRadius: '4px' }}>{m.plan}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Level B */}
                  <div>
                    <h5 style={{ margin: '0 0 6px', fontSize: '12.5px', color: '#fff' }}>
                      🔗 Level B - Indirect Referrals ({editUserTeamData.levelB?.count || 0})
                    </h5>
                    {editUserTeamData.levelB?.members?.length === 0 ? (
                      <p style={{ fontSize: '12px', color: 'var(--text-dim)', fontStyle: 'italic', margin: 0 }}>No Level B members</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '150px', overflowY: 'auto' }}>
                        {editUserTeamData.levelB.members.map((m, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)', padding: '6px 10px', borderRadius: '4px', fontSize: '12px' }}>
                            <div>
                              <strong>{m.name}</strong> ({m.phone})<br/>
                              <span style={{ fontSize: '10.5px', color: 'var(--text-dim)' }}>Email: {m.email || 'N/A'}</span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span className="badge" style={{ background: 'var(--gold-bg)', color: 'var(--gold-bright)', fontSize: '10.5px', padding: '2px 6px', borderRadius: '4px' }}>{m.plan}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Level C */}
                  <div>
                    <h5 style={{ margin: '0 0 6px', fontSize: '12.5px', color: '#fff' }}>
                      🔗 Level C - Downline Referrals ({editUserTeamData.levelC?.count || 0})
                    </h5>
                    {editUserTeamData.levelC?.members?.length === 0 ? (
                      <p style={{ fontSize: '12px', color: 'var(--text-dim)', fontStyle: 'italic', margin: 0 }}>No Level C members</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '150px', overflowY: 'auto' }}>
                        {editUserTeamData.levelC.members.map((m, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)', padding: '6px 10px', borderRadius: '4px', fontSize: '12px' }}>
                            <div>
                              <strong>{m.name}</strong> ({m.phone})<br/>
                              <span style={{ fontSize: '10.5px', color: 'var(--text-dim)' }}>Email: {m.email || 'N/A'}</span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span className="badge" style={{ background: 'var(--gold-bg)', color: 'var(--gold-bright)', fontSize: '10.5px', padding: '2px 6px', borderRadius: '4px' }}>{m.plan}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: '13px', color: 'var(--text-dim)', fontStyle: 'italic', marginBottom: '24px' }}>Loading referral network details...</p>
              )}

              {/* Action Buttons */}
              <div className={styles.editModalActions}>
                <button
                  type="button"
                  className={styles.btn}
                  style={{ backgroundColor: 'var(--green)', color: '#fff', borderColor: 'var(--green)' }}
                  onClick={handleSaveEditUser}
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnOutline}`}
                  onClick={() => setEditingUserData(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Key Metrics Cards */}
            <div className={styles.statsGrid}>
              {/* Total Users */}
              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: 'rgba(111, 168, 220, 0.15)', color: '#6fa8dc' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <div>
                  <div className={styles.statLabel}>Total Users</div>
                  <div className={styles.statValue}>{dashboardStats.totalUsers}</div>
                </div>
              </div>

              {/* Pending Withdrawals */}
              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: 'rgba(217, 169, 78, 0.15)', color: '#d9a94e' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
                </div>
                <div>
                  <div className={styles.statLabel}>Pending Withdrawals</div>
                  <div className={styles.statValue}>{dashboardStats.pendingWithdrawals}</div>
                </div>
              </div>

              {/* Pending Plan Requests */}
              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: 'rgba(62, 207, 142, 0.15)', color: '#3ecf8e' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12l4-4 4 4"/></svg>
                </div>
                <div>
                  <div className={styles.statLabel}>Pending Plan Requests</div>
                  <div className={styles.statValue}>{dashboardStats.pendingPlanRequests}</div>
                </div>
              </div>

              {/* Active Ads */}
              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: 'rgba(164, 140, 224, 0.15)', color: '#a48ce0' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                </div>
                <div>
                  <div className={styles.statLabel}>Active Ads</div>
                  <div className={styles.statValue}>
                    {(() => {
                      if (typeof window !== 'undefined') {
                        try {
                          const ads = JSON.parse(localStorage.getItem('admin_ads') || '[]');
                          return ads.filter(a => a.active).length;
                        } catch (e) {
                          return 0;
                        }
                      }
                      return 0;
                    })()}
                  </div>
                </div>
              </div>

              {/* Total Earnings Distributed */}
              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: 'rgba(217, 169, 78, 0.15)', color: '#d9a94e' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                </div>
                <div>
                  <div className={styles.statLabel}>Total Earnings Distributed</div>
                  <div className={styles.statValue}>
                    Rs{Number(dashboardStats.totalEarningsDistributed || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Total Withdrawals Paid */}
              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: 'rgba(226, 88, 77, 0.15)', color: '#e2584d' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                </div>
                <div>
                  <div className={styles.statLabel}>Total Withdrawals Paid</div>
                  <div className={styles.statValue}>
                    Rs{Number(dashboardStats.totalWithdrawalsPaid || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {false && activeTab === 'manageAds' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Image Management</h3>
            <p className="text-gray-600 mb-6">Manage car images for your investment plans.</p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {['car1.jpeg', 'car2.jpeg', 'car3.jpeg', 'car4.jpeg', 'car5.jpeg'].map((imageName, index) => (
                <div key={imageName} className="border border-gray-200 rounded-lg p-4 text-center">
                  <div className="w-full h-32 bg-gray-200 rounded-lg overflow-hidden mb-3">
                    <img 
                      src={getImageSrc(imageName)} 
                      alt={`Car ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm" style={{display: 'none'}}>
                      Image Not Found
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-800">{imageName}</p>
                  <p className="text-xs text-gray-500">Car {index + 1}</p>
                  <div className="mt-2 space-y-1">
                    <button
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = (e) => {
                          const file = e.target.files[0];
                          if (file) {
                            // Check file size (5MB limit)
                            if (file.size > 5 * 1024 * 1024) {
                              showError('File size must be less than 5MB');
                              return;
                            }
                            // Check file type
                            if (!file.type.startsWith('image/')) {
                              showError('Please select an image file');
                              return;
                            }
                            handleFileUpload(file, imageName);
                          }
                        };
                        input.click();
                      }}
                      className="w-full px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                    >
                      Upload Image
                    </button>
                    {uploadedImages[imageName] && (
                      <button
                        onClick={async () => {
                          if (confirm('Are you sure you want to delete this image?')) {
                            try {
                              const response = await fetch(`/api/admin/images?imageName=${imageName}`, {
                                method: 'DELETE'
                              });
                              
                              if (response.ok) {
                                setUploadedImages(prev => {
                                  const newImages = { ...prev };
                                  delete newImages[imageName];
                                  return newImages;
                                });
                                showSuccess('Image deleted successfully!');
                              } else {
                                showError('Failed to delete image');
                              }
                            } catch (error) {
                              console.warn('Error deleting image:', error);
                              showError('Failed to delete image');
                            }
                          }
                        }}
                        className="w-full px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                      >
                        Delete Image
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Image Upload Instructions:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>â€¢ Supported formats: JPEG, PNG, GIF</li>
                <li>â€¢ Recommended size: 800x600 pixels or larger</li>
                <li>â€¢ File size: Maximum 5MB per image</li>
                <li>â€¢ Images should be placed in the public folder of your project</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'manageAds' && (
          <div className={styles.usersPage}>
            <h2 className={styles.pageTitle}>Manage Ads</h2>
            <p className={styles.pageSub}>Add and manage video ads for users</p>

            <div className={styles.card}>
              <div className={styles.formTitle}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add New Ad
              </div>

              <div className={styles.field}>
                <label htmlFor="adTitle">Title</label>
                <input
                  type="text"
                  id="adTitle"
                  value={newAd.title}
                  onChange={(event) => setNewAd({ ...newAd, title: event.target.value })}
                  placeholder="Ad title"
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="adUrl">Video URL</label>
                <input
                  type="url"
                  id="adUrl"
                  value={newAd.url}
                  onChange={(event) => setNewAd({ ...newAd, url: event.target.value })}
                  placeholder="https://youtube.com/..."
                />
              </div>

              <div className={styles.note}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                Reward amounts are automatically set based on each user's plan - no manual setting needed.
              </div>

              <button
                type="button"
                className={`${styles.btn} ${styles.btnGold} ${styles.btnFull}`}
                onClick={handleAddAd}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add Ad
              </button>
            </div>

            {ads.length === 0 ? (
              <div className={styles.empty}>
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                <p>No ads yet. Add one above.</p>
              </div>
            ) : (
              ads.map((ad) => (
                <div className={styles.rowCard} key={ad.id}>
                  <div className={styles.rowIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </div>
                  <div>
                    <div className={styles.rowTitle}>{ad.title}</div>
                    <div className={styles.rowSub}>Reward based on user plan</div>
                  </div>
                  <div className={styles.rowActions}>
                    <label className={styles.switch}>
                      <input
                        type="checkbox"
                        checked={ad.active}
                        onChange={() => handleToggleAd(ad.id)}
                      />
                      <span className={styles.slider}></span>
                    </label>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      onClick={() => handleDeleteAd(ad.id)}
                      aria-label="Delete ad"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        <path d="M10 11v6M14 11v6" />
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'manageCourses' && (
          <div className={styles.usersPage}>
            <h2 className={styles.pageTitle}>Manage Courses</h2>
            <p className={styles.pageSub}>Add and manage digital learning courses for users</p>

            <div className={styles.card}>
              <div className={styles.formTitle}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add New Course
              </div>

              <div className={styles.field}>
                <label htmlFor="courseTitle">Course Title</label>
                <input
                  type="text"
                  id="courseTitle"
                  value={newCourse.title}
                  onChange={(event) => setNewCourse({ ...newCourse, title: event.target.value })}
                  placeholder="e.g. CAPCUT MOBILE VIDEO EDITING"
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="courseUrl">YouTube Video URL</label>
                <input
                  type="url"
                  id="courseUrl"
                  value={newCourse.videoUrl}
                  onChange={(event) => setNewCourse({ ...newCourse, videoUrl: event.target.value })}
                  placeholder="e.g. https://youtube.com/watch?v=..."
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="courseImage">Image/Thumbnail URL (Optional)</label>
                <input
                  type="url"
                  id="courseImage"
                  value={newCourse.imageUrl}
                  onChange={(event) => setNewCourse({ ...newCourse, imageUrl: event.target.value })}
                  placeholder="Leave empty for fallback thumbnail"
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="courseDesc">Description (Optional)</label>
                <textarea
                  id="courseDesc"
                  value={newCourse.description}
                  onChange={(event) => setNewCourse({ ...newCourse, description: event.target.value })}
                  placeholder="Brief summary of what this course covers..."
                  style={{
                    width: '100%',
                    background: 'var(--panel-2, #161d2e)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    padding: '10px',
                    color: 'var(--text, #f2eee4)',
                    fontSize: '14px',
                    minHeight: '80px',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>

              <button
                type="button"
                className={`${styles.btn} ${styles.btnGold} ${styles.btnFull}`}
                onClick={handleAddCourse}
                style={{ marginTop: '16px' }}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add Course
              </button>
            </div>

            {courses.length === 0 ? (
              <div className={styles.empty}>
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" stroke="currentColor">
                  <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <p>No courses yet. Add one above.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
                {courses.map((c) => (
                  <div className={styles.rowCard} key={c.id} style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <img 
                      src={c.imageUrl} 
                      alt={c.title} 
                      style={{ 
                        width: '80px', 
                        height: '50px', 
                        objectFit: 'cover', 
                        borderRadius: '6px',
                        border: '1px solid rgba(255,255,255,0.08)'
                      }} 
                    />
                    <div style={{ flex: 1 }}>
                      <div className={styles.rowTitle} style={{ fontSize: '15px', fontWeight: '700' }}>{c.title}</div>
                      <div className={styles.rowSub} style={{ fontSize: '12px', marginTop: '2px', color: 'var(--muted)' }}>
                        {c.videoUrl.length > 40 ? c.videoUrl.slice(0, 40) + '...' : c.videoUrl}
                      </div>
                    </div>
                    <div className={styles.rowActions} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <label className={styles.switch}>
                        <input
                          type="checkbox"
                          checked={c.active}
                          onChange={() => handleToggleCourse(c.id)}
                        />
                        <span className={styles.slider}></span>
                      </label>
                      <button
                        type="button"
                        className={styles.iconBtn}
                        onClick={() => handleDeleteCourse(c.id)}
                        aria-label="Delete course"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6M14 11v6" />
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}



        {activeTab === 'planRequests' && (
          <div className={styles.usersPage}>
            <div className={styles.pageHeadRow}>
              <div>
                <h2 className={styles.pageTitle}>Plan Upgrade Requests</h2>
                <p className={styles.pageSub}>Approve or reject user plan upgrades</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPlanRequestsLoading(true)
                  fetch('/api/admin/plans?status=pending')
                    .then(r => r.ok ? r.json() : [])
                    .then(data => setPlanRequests(Array.isArray(data) ? data : []))
                    .catch(() => setPlanRequests([]))
                    .finally(() => setPlanRequestsLoading(false))
                }}
                disabled={planRequestsLoading}
                className={`${styles.btn} ${styles.btnOutline}`}
              >
                <svg className={styles.btnIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{planRequestsLoading ? 'Loading' : 'Refresh'}</span>
              </button>
            </div>
            {planRequestsLoading ? (
              <div className={styles.empty}><p>Loading plan requests...</p></div>
            ) : planRequests.length === 0 ? (
              <div className={styles.empty}>
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v8M8 12l4-4 4 4" />
                </svg>
                <p>No pending plan requests</p>
              </div>
            ) : (
              planRequests.map((req, i) => (
                <div className={styles.card} key={req.planId || i}>
                  <div className={styles.cardTop}>
                    <div className={styles.userBlock}>
                      {req.userProfilePicture ? (
                        <img 
                          src={req.userProfilePicture} 
                          alt="avatar" 
                          className={styles.avatar} 
                          style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} 
                        />
                      ) : (
                        <div className={styles.avatar}>{getUserInitials(req.userName)}</div>
                      )}
                      <div>
                        <div className={styles.userName}>{req.userName || 'Unknown User'}</div>
                        <div className={styles.userEmail}>{req.userEmail || req.userPhone}</div>
                      </div>
                    </div>
                    <span className={`${styles.status} ${styles.pending}`}>pending</span>
                  </div>
                  <div className={styles.detailGrid}>
                    <div>
                      <div className={styles.detailLabel}>Current Plan</div>
                      <div className={styles.detailValue}>
                        <span style={{ background: '#3b82f620', color: '#3b82f6', borderRadius: 6, padding: '2px 10px', fontWeight: 600 }}>{req.userCurrentPlan || 'Free'}</span>
                      </div>
                    </div>
                    <div>
                      <div className={styles.detailLabel}>Requested Plan</div>
                      <div className={styles.detailValue}>
                        <span style={{ background: '#ede9fe', color: '#7c3aed', borderRadius: 6, padding: '2px 10px', fontWeight: 600 }}>{req.planName}</span>
                      </div>
                    </div>
                    <div>
                      <div className={styles.detailLabel}>Amount (PKR)</div>
                      <div className={`${styles.detailValue} ${styles.amount}`}>PKR {Number(req.amount || 0).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className={styles.detailLabel}>Payment Method</div>
                      <div className={styles.detailValue}>{req.paymentMethod || '-'}</div>
                    </div>
                    <div>
                      <div className={styles.detailLabel}>Requested on</div>
                      <div className={styles.detailValue}>{req.startDate ? new Date(req.startDate).toLocaleDateString() : '-'}</div>
                    </div>
                  </div>

                  {/* Payment Receipt */}
                  {req.screenshotData ? (
                    <div style={{ margin: '14px 0', padding: '12px', background: 'rgba(255,255,255,0.04)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div style={{ fontSize: 11, color: '#9598a3', marginBottom: 8, fontWeight: 600, letterSpacing: '0.06em' }}>PAYMENT RECEIPT</div>
                      <img
                        src={req.screenshotData}
                        alt="Payment receipt"
                        onClick={() => setPreviewReceiptUrl(req.screenshotData)}
                        style={{
                          width: '100%',
                          maxHeight: 180,
                          objectFit: 'cover',
                          borderRadius: 8,
                          cursor: 'zoom-in',
                          border: '1px solid rgba(255,255,255,0.1)',
                          display: 'block'
                        }}
                      />
                      <div style={{ textAlign: 'center', fontSize: 11, color: '#c9a04a', marginTop: 6, cursor: 'pointer' }} onClick={() => setPreviewReceiptUrl(req.screenshotData)}>
                        🔍 Click to view full receipt
                      </div>
                    </div>
                  ) : (
                    <div style={{ margin: '14px 0', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: '1px dashed rgba(255,255,255,0.1)', fontSize: 12, color: '#666', textAlign: 'center' }}>
                      No receipt uploaded
                    </div>
                  )}

                  <div className={styles.cardActions}>
                    <button type="button" className={`${styles.btn} ${styles.btnGreen}`} onClick={() => handlePlanAction(req.userId, req.planId, 'approve')}>Approve</button>
                    <button type="button" className={`${styles.btn} ${styles.btnReject}`} onClick={() => handlePlanAction(req.userId, req.planId, 'reject')}>Reject</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'withdrawals' && (
          <div className={styles.usersPage}>
            <div className={styles.pageHeadRow}>
              <div>
                <h2 className={styles.pageTitle}>Withdrawal Requests</h2>
                <p className={styles.pageSub}>Approve or reject user withdrawals</p>
              </div>
              <button
                type="button"
                onClick={refreshWithdrawHistory}
                disabled={historyLoading}
                className={`${styles.btn} ${styles.btnOutline}`}
              >
                <svg className={styles.btnIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{historyLoading ? 'Loading' : 'Refresh'}</span>
              </button>
            </div>

            <div className={styles.tabs}>
              {['pending', 'approved', 'rejected', 'all'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`${styles.tab} ${withdrawFilter === tab ? styles.tabActive : ''}`}
                  onClick={() => setWithdrawFilter(tab)}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {getSortedWithdrawHistory().length === 0 ? (
              <div className={styles.empty}>
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5">
                  <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                  <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                  <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
                </svg>
                <p>No {getWithdrawalEmptyLabel()}withdrawal requests</p>
              </div>
            ) : (
              getSortedWithdrawHistory().map((request) => (
                <div className={styles.card} key={request.transactionId || request._id}>
                  <div className={styles.cardTop}>
                    <div className={styles.userBlock}>
                      {request.userProfilePicture || users.find(u => u.phone === request.userId)?.profilePicture ? (
                        <img 
                          src={request.userProfilePicture || users.find(u => u.phone === request.userId)?.profilePicture} 
                          alt="avatar" 
                          className={styles.avatar} 
                          style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} 
                        />
                      ) : (
                        <div className={styles.avatar}>{getUserInitials(request.userName)}</div>
                      )}
                      <div>
                        <div className={styles.userName}>{request.userName || 'Unknown User'}</div>
                        <div className={styles.userEmail}>
                          {users.find(u => u.phone === request.userId)?.email || request.userId}
                        </div>
                      </div>
                    </div>
                    <span className={`${styles.status} ${styles[request.status] || styles.pending}`}>
                      {request.status}
                    </span>
                  </div>
                  <div className={styles.detailGrid}>
                    <div>
                      <div className={styles.detailLabel}>Amount</div>
                      <div className={`${styles.detailValue} ${styles.amount}`}>
                        Rs{getWithdrawalAmount(request)}
                      </div>
                    </div>
                    <div>
                      <div className={styles.detailLabel}>Requested on</div>
                      <div className={styles.detailValue}>
                        {formatPakistanDate(request.createdAt)}
                      </div>
                    </div>
                    <div>
                      <div className={styles.detailLabel}>Method</div>
                      <div className={styles.detailValue}>{request.withdrawalMethod || 'N/A'}</div>
                    </div>
                    <div>
                      <div className={styles.detailLabel}>Account</div>
                      <div className={styles.detailValue}>{getWithdrawalAccount(request)}</div>
                    </div>
                  </div>
                  {request.status === 'pending' && (
                    <div className={styles.cardActions}>
                      <button
                        type="button"
                        className={`${styles.btn} ${styles.btnGreen}`}
                        onClick={() => handleWithdrawApproval(request.transactionId, true)}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className={`${styles.btn} ${styles.btnReject}`}
                        onClick={() => handleWithdrawApproval(request.transactionId, false)}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'earningsControl' && (
          <div className={styles.earningsPage}>
            <h1 className={styles.pageTitle}>Earnings Control</h1>
            <p className={styles.pageSub}>Set per-plan reward rates for ad views and referrals</p>

            {earningsPlans.map(p => (
              <div key={p.id} className={styles.planRow}>
                <div className={styles.planRowHead}>
                  <span className={styles.planName}>{p.name}</span>
                  <span className={styles.planBadge}>{p.id}</span>
                </div>
                <div className={styles.planFields}>
                  <div className={styles.field}>
                    <label>Reward per ad view ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={(p.perAd || 0).toFixed(2)}
                      onChange={e => handleEarningsFieldChange(p.id, 'perAd', e.target.value)}
                    />
                  </div>
                  <div className={styles.field}>
                    <label>Direct Referral % (Lvl A)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={p.refA || 0}
                      onChange={e => handleEarningsFieldChange(p.id, 'refA', e.target.value)}
                    />
                  </div>
                  <div className={styles.field}>
                    <label>Indirect Referral % (Lvl B)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={p.refB || 0}
                      onChange={e => handleEarningsFieldChange(p.id, 'refB', e.target.value)}
                    />
                  </div>
                  <div className={styles.field}>
                    <label>Downline Referral % (Lvl C)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={p.refC || 0}
                      onChange={e => handleEarningsFieldChange(p.id, 'refC', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              className={`${styles.btn} ${styles.btnGold} ${styles.btnFull}`}
              style={{ marginTop: '6px' }}
              onClick={saveEarningsPlans}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
              </svg>
              Save Changes
            </button>
            {earningsSavedMsg && (
              <p className={styles.savedMsg}>Saved.</p>
            )}
          </div>
        )}



        {/* Recharge History Tab */}
        {false && activeTab === 'planRequests' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-800">Recharge History</h3>
              <div className="flex items-center space-x-2">
                {historyLoading && (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                )}
                <span className="text-sm text-gray-600">
                  Total: {getFilteredRechargeHistory().length} transactions
                </span>
                <select
                  value={rechargeFilter}
                  onChange={(e) => setRechargeFilter(e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <button
                  onClick={refreshRechargeHistory}
                  disabled={historyLoading}
                  className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Refresh</span>
                </button>
                <button
                  onClick={updateTransactionNames}
                  disabled={historyLoading}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Update Names</span>
                </button>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-green-600 font-medium">Total Recharges</p>
                    <p className="text-lg font-bold text-green-800">{rechargeHistory.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Approved</p>
                    <p className="text-lg font-bold text-blue-800">
                      {rechargeHistory.filter(t => t.status === 'approved').length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-yellow-600 font-medium">Pending</p>
                    <p className="text-lg font-bold text-yellow-800">
                      {rechargeHistory.filter(t => t.status === 'pending').length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-red-600 font-medium">Rejected</p>
                    <p className="text-lg font-bold text-red-800">
                      {rechargeHistory.filter(t => t.status === 'rejected').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {getFilteredRechargeHistory().length === 0 ? (
              <div className="text-center py-8">
                {historyLoading ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                ) : (
                  <p className="text-gray-500">No recharge transactions found</p>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">User</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Amount</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Payment Method</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Transaction ID</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredRechargeHistory().map((transaction) => (
                      <tr key={transaction._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium text-gray-800">{transaction.userName || 'Unknown'}</div>
                            <div className="text-sm text-gray-500">
                              {users.find(u => u.phone === transaction.userId)?.email || transaction.userId}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-green-600">Rs{transaction.amount}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-600">{transaction.paymentMethod}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            {transaction.userTransactionId && (
                              <div className="text-xs text-blue-600">
                                User ID: {transaction.userTransactionId}
                              </div>
                            )}
                            <div className="text-xs text-gray-500">
                              System: {transaction.transactionId}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            transaction.status === 'approved' 
                              ? 'bg-green-100 text-green-800' 
                              : transaction.status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {transaction.status === 'approved' ? 'Approved' : 
                             transaction.status === 'rejected' ? 'Rejected' : 'Pending'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-600">
                            {formatPakistanDate(transaction.createdAt)}
                          </span>
                          <div className="text-xs text-gray-500">
                            {formatPakistanTime(transaction.createdAt)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

{activeTab === 'mysteryBoxes' && (
          <div className={styles.mysteryPage}>
            <h1 className={styles.pageTitle}>Mystery Boxes</h1>
            <p className={styles.pageSub}>Set monthly top-leaderboard rewards</p>

            {/* Enable toggle card */}
            <div className={styles.enableCard}>
              <div>
                <div className={styles.enableCardLabel}>Enable Mystery Boxes</div>
                <div className={styles.enableCardSub}>Show reward boxes to users on the leaderboard</div>
              </div>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  checked={mysteryBoxesEnabled}
                  onChange={e => setMysteryBoxesEnabled(e.target.checked)}
                />
                <span className={styles.slider}></span>
              </label>
            </div>

            {/* Save button */}
            <button
              className={`${styles.btn} ${styles.btnGold} ${styles.btnFull}`}
              style={{ marginBottom: '24px' }}
              onClick={saveMysteryBoxes}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/>
                <polyline points="17 21 17 13 7 13 7 21"/>
                <polyline points="7 3 7 8 15 8"/>
              </svg>
              Save
            </button>

            {/* Box cards */}
            {mysteryBoxes.map(b => (
              <div
                key={b.id}
                className={`${styles.boxCard} ${
                  b.rank === 1 ? styles.boxCardRank1 :
                  b.rank === 3 ? styles.boxCardRank3 : ''
                }`}
              >
                <div className={styles.boxMedal}>{b.medal}</div>
                <div className={styles.boxTitle}>{b.title}</div>
                <div className={styles.boxDesc}>{b.desc}</div>
                <div className={styles.boxValue}>${b.value}</div>
                <div className={styles.boxActions}>
                  <button
                    className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`}
                    onClick={() => openEditBox(b)}
                  >
                    Edit
                  </button>
                  <button
                    className={`${styles.btn} ${styles.btnDangerOutline} ${styles.btnSm}`}
                    onClick={() => deleteBox(b.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}

            <button className={`${styles.btn} ${styles.btnOutline}`} onClick={openAddBox} style={{ margin: '0 auto', display: 'block', marginTop: '20px' }}>
              + Add Mystery Box
            </button>

            {/* Inline edit modal */}
            {editingBox && (
              <div className={styles.editModal}>
                <div className={styles.editModalBox}>
                  <div className={styles.editModalTitle}>{editingBox.id === 'new' ? 'Add Mystery Box' : 'Edit — ' + editingBox.title}</div>
                  <div className={styles.field}>
                    <label>Title</label>
                    <input type="text" value={editingBox.title} onChange={e => setEditingBox({...editingBox, title: e.target.value})} />
                  </div>
                  <div className={styles.field}>
                    <label>Description</label>
                    <input type="text" value={editingBox.desc} onChange={e => setEditingBox({...editingBox, desc: e.target.value})} />
                  </div>
                  <div className={styles.field}>
                    <label>Medal Emoji</label>
                    <input type="text" value={editingBox.medal} onChange={e => setEditingBox({...editingBox, medal: e.target.value})} />
                  </div>
                  <div className={styles.field}>
                    <label>Cash Prize Value ($)</label>
                    <input type="number" min="0" step="1" value={editingBox.value} onChange={e => setEditingBox({...editingBox, value: e.target.value})} />
                  </div>
                  <div className={styles.editModalActions}>
                    <button className={`${styles.btn} ${styles.btnGold}`} onClick={confirmEditBox}>Confirm</button>
                    <button className={`${styles.btn} ${styles.btnOutline}`} onClick={() => setEditingBox(null)}>Cancel</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'ecommerce' && (
          <div className={styles.ecommercePage}>
            <div className={styles.pageHeadRow}>
              <div>
                <h1 className={styles.pageTitle}>E-Commerce</h1>
                <p className={styles.pageSub}>Manage products and view orders</p>
              </div>
              <button className={`${styles.btn} ${styles.btnGold}`} onClick={openAddProduct}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Add Product
              </button>
            </div>

            <div className={styles.tabs} style={{ marginTop: '20px' }}>
              <button
                className={`${styles.tab} ${ecommerceTab === 'products' ? styles.tabActive : ''}`}
                onClick={() => setEcommerceTab('products')}
              >
                Products ({products.length})
              </button>
              <button
                className={`${styles.tab} ${ecommerceTab === 'orders' ? styles.tabActive : ''}`}
                onClick={() => setEcommerceTab('orders')}
              >
                Orders ({orders.length})
              </button>
              <button
                className={`${styles.tab} ${ecommerceTab === 'settings' ? styles.tabActive : ''}`}
                onClick={() => setEcommerceTab('settings')}
              >
                Bank Settings
              </button>
            </div>

            <div>
              {ecommerceTab === 'products' ? (
                products.length > 0 ? (
                  <div className={styles.productsGrid}>
                    {products.map(p => (
                      <div key={p._id || p.id} className={styles.productCard}>
                        <img className={styles.productImg} src={p.image || p.img || ''} alt={p.name} />
                        <div className={styles.productBody}>
                          <div className={styles.productTop}>
                            <div className={styles.productName}>{p.name}</div>
                            <span
                              className={`${styles.status} ${(p.isActive !== undefined ? p.isActive : p.active) ? styles.active : styles.suspended}`}
                              style={{ cursor: 'pointer' }}
                              onClick={() => toggleProduct(p._id || p.id)}
                              title="Click to toggle status"
                            >
                              {(p.isActive !== undefined ? p.isActive : p.active) ? 'Active' : 'Hidden'}
                            </span>
                          </div>
                          <div className={styles.productDesc}>{p.description || p.desc}</div>
                          <div className={styles.productPrice}>{p.currency || 'Rs'} {p.price?.toLocaleString()}</div>
                          <div className={styles.productActions}>
                            <button className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`} onClick={() => openEditProduct(p)}>
                              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                              </svg>
                              Edit
                            </button>
                            <button className={`${styles.btn} ${styles.btnDangerOutline} ${styles.btnSm}`} onClick={() => deleteProduct(p.id)}>
                              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                              </svg>
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.empty}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
                      <path d="M3 6h18"/>
                      <path d="M16 10a4 4 0 0 1-8 0"/>
                    </svg>
                    <p>No products yet. Click "Add Product" to create one.</p>
                  </div>
                )
              ) : ecommerceTab === 'orders' ? (
                orders.length > 0 ? (
                  orders.map(o => (
                    <div key={o._id || o.id} className={styles.rowCard} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                      {o.userProfilePicture ? (
                        <img 
                          src={o.userProfilePicture} 
                          alt="avatar" 
                          className={styles.rowIcon} 
                          style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} 
                        />
                      ) : (
                        <div className={styles.rowIcon}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="9" cy="21" r="1"/>
                            <circle cx="20" cy="21" r="1"/>
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                          </svg>
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: '200px' }}>
                        <div className={styles.rowTitle}>{o.productName || o.product}</div>
                        <div className={styles.rowSub} style={{ lineHeight: '1.4' }}>
                          <div><strong>User:</strong> {o.userName || o.customer} ({o.userEmail || o.userId})</div>
                          <div><strong>Plan:</strong> {o.userPlan || 'N/A'}</div>
                          <div><strong>Address:</strong> {o.deliveryAddress || 'N/A'}</div>
                          <div><strong>Phone:</strong> {o.phoneNumber || 'N/A'}</div>
                          <div><strong>Payment Method:</strong> {o.paymentMethod === 'online_transfer' ? 'Online Transfer' : 'Balance'}</div>
                          <div style={{ color: 'var(--gold)', marginTop: '4px' }}>Amount: {o.currency} {(o.amount || 0).toLocaleString()}</div>
                          {o.paymentMethod === 'online_transfer' && o.receiptImage && (
                            <div style={{ marginTop: '6px' }}>
                              <button onClick={() => setReceiptModalUrl(o.receiptImage)} style={{ background: 'none', border: 'none', color: '#3b82f6', textDecoration: 'underline', fontSize: '12px', cursor: 'pointer', padding: 0 }}>View Receipt</button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className={styles.rowActions} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span className={`${styles.status} ${styles[o.status] || ''}`}>{o.status}</span>
                        {o.status === 'pending' && (
                          <>
                            <button className={`${styles.btn} ${styles.btnGreen}`} style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleOrderAction(o._id, 'approved')}>Approve</button>
                            <button className={`${styles.btn} ${styles.btnReject}`} style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleOrderAction(o._id, 'rejected')}>Reject</button>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={styles.empty}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="9" cy="21" r="1"/>
                      <circle cx="20" cy="21" r="1"/>
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                    </svg>
                    <p>No orders yet.</p>
                  </div>
                )
              ) : ecommerceTab === 'settings' ? (
                <div className={styles.panel} style={{ maxWidth: '500px', padding: '24px' }}>
                  <h3 style={{ margin: '0 0 16px 0' }}>Online Transfer Settings</h3>
                  <div className={styles.field}>
                    <label>Bank Name</label>
                    <input
                      type="text"
                      value={ecommerceBankSettings.bankName}
                      onChange={e => setEcommerceBankSettings({ ...ecommerceBankSettings, bankName: e.target.value })}
                      placeholder="e.g. SadaPay or Meezan Bank"
                    />
                  </div>
                  <div className={styles.field}>
                    <label>Account Name / Title</label>
                    <input
                      type="text"
                      value={ecommerceBankSettings.accountName}
                      onChange={e => setEcommerceBankSettings({ ...ecommerceBankSettings, accountName: e.target.value })}
                      placeholder="e.g. HMH Admin"
                    />
                  </div>
                  <div className={styles.field}>
                    <label>Account Number</label>
                    <input
                      type="text"
                      value={ecommerceBankSettings.accountNumber}
                      onChange={e => setEcommerceBankSettings({ ...ecommerceBankSettings, accountNumber: e.target.value })}
                      placeholder="Account or IBAN"
                    />
                  </div>
                  <button className={`${styles.btn} ${styles.btnGold}`} onClick={saveEcommerceBankSettings} disabled={bankSettingsSaving} style={{ marginTop: '10px' }}>
                    {bankSettingsSaving ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              ) : null}
            </div>

            {/* Custom Product Modal (Add/Edit) */}
            {productForm && (
              <div className={styles.editModal}>
                <div className={styles.editModalBox} style={{ maxWidth: '480px' }}>
                  <div className={styles.editModalTitle}>
                    {productForm.mode === 'add' ? 'Add New Product' : 'Edit Product'}
                  </div>
                  
                  <div className={styles.field}>
                    <label>Product Name</label>
                    <input
                      type="text"
                      value={productForm.name}
                      onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                      placeholder="Enter product name"
                    />
                  </div>

                  <div className={styles.field}>
                    <label>Short Description</label>
                    <textarea
                      value={productForm.desc}
                      onChange={e => setProductForm({ ...productForm, desc: e.target.value })}
                      placeholder="Enter product description"
                      rows="3"
                    />
                  </div>

                  <div className={styles.field}>
                    <label>Price (Rs)</label>
                    <input
                      type="number"
                      min="0"
                      value={productForm.price}
                      onChange={e => setProductForm({ ...productForm, price: e.target.value })}
                      placeholder="0"
                    />
                  </div>

                  <div className={styles.field}>
                    <label>Product Pictures (Up to 5)</label>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
                      {(productForm.imgs || []).map((imgUrl, i) => (
                        <div key={i} style={{ position: 'relative' }}>
                          <img
                            src={imgUrl}
                            alt="Preview"
                            style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'contain', background: 'var(--panel-2)' }}
                          />
                          <button
                            type="button"
                            onClick={() => removeProductImage(i)}
                            style={{ position: 'absolute', top: -5, right: -5, background: 'red', color: 'white', borderRadius: '50%', width: 20, height: 20, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, padding: 0 }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      {(productForm.imgs || []).length < 5 && (
                        <>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleProductImageUpload}
                            style={{ display: 'none' }}
                            id="modal-image-upload"
                          />
                          <label
                            htmlFor="modal-image-upload"
                            className={`${styles.btn} ${styles.btnOutline} ${styles.btnSm}`}
                            style={{ cursor: 'pointer', margin: 0, height: '60px', display: 'flex', alignItems: 'center' }}
                          >
                            + Upload
                          </label>
                        </>
                      )}
                    </div>
                  </div>

                  <div className={styles.editModalActions}>
                    <button
                      className={`${styles.btn} ${styles.btnGold}`}
                      onClick={saveProductForm}
                    >
                      Save Product
                    </button>
                    <button
                      className={`${styles.btn} ${styles.btnOutline}`}
                      onClick={() => setProductForm(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      {previewReceiptUrl && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justify: 'center',
            zIndex: 100000,
            padding: '20px'
          }}
          onClick={() => setPreviewReceiptUrl(null)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '90%',
              maxHeight: '90%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewReceiptUrl(null)}
              style={{
                position: 'absolute',
                top: -40,
                right: 0,
                background: 'none',
                border: 'none',
                color: '#fff',
                fontSize: '28px',
                cursor: 'pointer'
              }}
            >
              ×
            </button>
            <img
              src={previewReceiptUrl}
              alt="Receipt Preview"
              style={{
                maxWidth: '100%',
                maxHeight: '80vh',
                objectFit: 'contain',
                borderRadius: '8px',
                border: '2px solid rgba(255,255,255,0.2)'
              }}
            />
          </div>
        </div>
      )}

      {/* Receipt Modal for Ecommerce */}
      {receiptModalUrl && (
        <div className={styles.editModal} onClick={() => setReceiptModalUrl('')} style={{ zIndex: 10000 }}>
          <div className={styles.editModalBox} style={{ maxWidth: '600px', textAlign: 'center', padding: '20px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0 }}>Payment Receipt</h3>
              <button onClick={() => setReceiptModalUrl('')} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--text)' }}>×</button>
            </div>
            <img src={receiptModalUrl} alt="Receipt" style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: '8px' }} />
          </div>
        </div>
      )}
      {/* Custom Confirm Modal */}
      {confirmModal.isOpen && (
        <div className={styles.editModal} onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} style={{ zIndex: 20000 }}>
          <div className={styles.editModalBox} style={{ maxWidth: '400px', textAlign: 'center', padding: '24px', borderRadius: '12px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 12px', fontSize: '18px', color: 'var(--text)' }}>{confirmModal.title}</h3>
            <p style={{ margin: '0 0 24px', fontSize: '14.5px', color: 'var(--text-dim)', lineHeight: '1.5' }}>{confirmModal.message}</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                className={`${styles.btn} ${styles.btnOutline}`} 
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                style={{ flex: 1, padding: '10px 16px' }}
              >
                Cancel
              </button>
              <button 
                className={`${styles.btn} ${styles.btnGold}`} 
                onClick={confirmModal.onConfirm}
                style={{ flex: 1, padding: '10px 16px' }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
      {(isAppLoading || isLoading) && <Loader />}
    </AdminShell>
  )
} 

