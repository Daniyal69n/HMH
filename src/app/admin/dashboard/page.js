'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useNotification } from '../../context/NotificationContext'
import AdminShell from '@/components/admin/AdminShell'
import { clearAdminSession } from '@/lib/adminAuth'
import styles from '@/components/admin/admin.module.css'

export default function AdminDashboard() {
  const router = useRouter()
  const { showSuccess, showError, showWarning, showInfo } = useNotification()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [plans, setPlans] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [editingPlan, setEditingPlan] = useState(null)
  const [showAddPlan, setShowAddPlan] = useState(false)
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [uploadedImages, setUploadedImages] = useState({})
  const [pendingRechargeRequests, setPendingRechargeRequests] = useState([])
  const [pendingWithdrawRequests, setPendingWithdrawRequests] = useState([])
  const [users, setUsers] = useState([])
  const [paymentDetails, setPaymentDetails] = useState({
    easypaisa: { number: '', accountName: '' },
    jazzcash: { number: '', accountName: '' }
  })
  
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

  // Activity states
  const [recentActivities, setRecentActivities] = useState([])
  const [activityLoading, setActivityLoading] = useState(false)

  // History states
  const [rechargeHistory, setRechargeHistory] = useState([])
  const [withdrawHistory, setWithdrawHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [rechargeFilter, setRechargeFilter] = useState('all') // all, approved, rejected, pending
  const [withdrawFilter, setWithdrawFilter] = useState('all') // all, approved, rejected, pending

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
            console.error('Failed to load plans')
            showError('Failed to load investment plans')
          }
        } catch (error) {
          console.error('Error loading plans:', error)
          showError('Error loading investment plans')
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

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout from admin panel?')) {
      clearAdminSession()
      router.push('/admin')
    }
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
      console.error('Error creating plan:', error)
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
      console.error('Error updating plan:', error)
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
        console.error('Error deleting plan:', error)
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
      console.error('Error toggling plan status:', error)
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
          console.error('Error uploading image:', error)
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
          // Get all users by setting a high limit
          const response = await fetch('/api/admin/users?limit=1000')
          if (response.ok) {
            const data = await response.json()
            setUsers(data.users || [])
            console.log('Loaded users:', data.users?.length || 0)
          } else {
            console.error('Failed to load users from API')
            setUsers([])
          }
        } catch (error) {
          console.error('Error loading users:', error)
          setUsers([])
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
          console.error('Error loading payment details:', error)
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
            console.error('Failed to load coupons from API')
            setCoupons([])
          }
        } catch (error) {
          console.error('Error loading coupons:', error)
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
            console.error('Failed to load images from API')
          }
        } catch (error) {
          console.error('Error loading images:', error)
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
          console.error('Error loading pending requests:', error)
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
            console.error('Failed to load recharge history')
            setRechargeHistory([])
          }
        } catch (error) {
          console.error('Error loading recharge history:', error)
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
            console.error('Failed to load withdraw history')
            setWithdrawHistory([])
          }
        } catch (error) {
          console.error('Error loading withdraw history:', error)
          setWithdrawHistory([])
        } finally {
          setHistoryLoading(false)
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
            console.error('Failed to load recent activities')
            setRecentActivities([])
          }
        } catch (error) {
          console.error('Error loading recent activities:', error)
          setRecentActivities([])
        } finally {
          setActivityLoading(false)
        }
      }
      
      // Load all data
      loadUsers()
      loadPaymentDetails()
      loadCoupons()
      loadImages()
      loadPendingRequests()
      loadRechargeHistory()
      loadWithdrawHistory()
      loadRecentActivities()
      
      // Set up periodic refresh every 30 seconds
      const refreshInterval = setInterval(() => {
        loadUsers()
        loadPaymentDetails()
        loadCoupons()
        loadPendingRequests()
        loadRechargeHistory()
        loadWithdrawHistory()
        loadRecentActivities()
      }, 30000)
      
      return () => {
        clearInterval(refreshInterval)
      }
    }
  }, [isAdminLoggedIn, isCheckingAuth])

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
            console.error('Failed to load recharge history')
            setRechargeHistory([])
          }
        } catch (error) {
          console.error('Error loading recharge history:', error)
          setRechargeHistory([])
        } finally {
          setHistoryLoading(false)
        }
      }
      loadRechargeHistory()
    }
  }, [isAdminLoggedIn, isCheckingAuth, activeTab])

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
            console.error('Failed to load withdraw history')
            setWithdrawHistory([])
          }
        } catch (error) {
          console.error('Error loading withdraw history:', error)
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
            console.error('Failed to load recent activities')
            setRecentActivities([])
          }
        } catch (error) {
          console.error('Error loading recent activities:', error)
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
      console.error('Error refreshing recharge history:', error)
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
      console.error('Error refreshing withdraw history:', error)
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
      console.error('Error updating transaction names:', error)
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

  const getFilteredWithdrawHistory = () => {
    if (withdrawFilter === 'all') return withdrawHistory
    return withdrawHistory.filter(transaction => transaction.status === withdrawFilter)
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
        // Refresh the pending requests list
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
            console.error('Error loading pending requests:', error)
          }
        }
        loadPendingRequests()
      } else {
        const errorData = await response.json()
        showError(errorData.message || 'Failed to update transaction status')
      }
    } catch (error) {
      console.error('Error updating transaction:', error)
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
        // Refresh the pending requests list
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
            console.error('Error loading pending requests:', error)
          }
        }
        loadPendingRequests()
      } else {
        const errorData = await response.json()
        showError(errorData.message || 'Failed to update transaction status')
      }
    } catch (error) {
      console.error('Error updating transaction:', error)
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
              console.error('Error refreshing users:', error)
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
        console.error('Error blocking user:', error)
        showError('Failed to update user status')
      }
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
              console.error('Error refreshing users:', error)
            }
          }
          loadUsers()
          
          showSuccess(`User ${userId} has been deleted successfully`)
        } else {
          showError('Failed to delete user')
        }
      } catch (error) {
        console.error('Error deleting user:', error)
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
      console.error('Error saving payment settings:', error)
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
      console.error('Error creating coupon:', error)
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
      console.error('Error updating coupon:', error)
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
        console.error('Error deleting coupon:', error)
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

  return (
    <AdminShell
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onLogout={handleLogout}
    >
        {activeTab === 'planRequests' && (
          <div className="space-y-6">
            {/* Add/Edit Plan Form */}
            {showAddPlan && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  {editingPlan ? 'Edit Plan' : 'Add New Plan'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Plan Name</label>
                    <input
                      type="text"
                      value={newPlan.name}
                      onChange={(e) => setNewPlan({...newPlan, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                      placeholder="Neo Earner Type R"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Image File</label>
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={newPlan.image}
                        onChange={(e) => setNewPlan({...newPlan, image: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                        placeholder="car1.jpeg"
                      />
                      <div className="text-xs text-gray-500">
                        Available images: car1.jpeg, car2.jpeg, car3.jpeg, car4.jpeg, car5.jpeg
                      </div>
                      <div className="flex space-x-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setNewPlan({...newPlan, image: 'car1.jpeg'})}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                          Car 1
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewPlan({...newPlan, image: 'car2.jpeg'})}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                          Car 2
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewPlan({...newPlan, image: 'car3.jpeg'})}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                          Car 3
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewPlan({...newPlan, image: 'car4.jpeg'})}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                          Car 4
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewPlan({...newPlan, image: 'car5.jpeg'})}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                          Car 5
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.onchange = (e) => {
                              const file = e.target.files[0];
                              if (file) {
                                if (file.size > 5 * 1024 * 1024) {
                                  showError('File size must be less than 5MB');
                                  return;
                                }
                                if (!file.type.startsWith('image/')) {
                                  showError('Please select an image file');
                                  return;
                                }
                                const reader = new FileReader();
                                reader.onload = (e) => {
                                  setNewPlan({...newPlan, image: e.target.result});
                                };
                                reader.readAsDataURL(file);
                              }
                            };
                            input.click();
                          }}
                          className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                        >
                          📷 Upload New
                        </button>
                      </div>
                      {newPlan.image && (
                        <div className="mt-2">
                          <label className="block text-xs text-gray-600 mb-1">Preview:</label>
                          <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden">
                            <img 
                              src={getImageSrc(newPlan.image)} 
                              alt="Preview"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs" style={{display: 'none'}}>
                              No Image
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Investment Amount</label>
                    <input
                      type="text"
                      value={newPlan.investAmount}
                      onChange={(e) => setNewPlan({...newPlan, investAmount: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                      placeholder="$5,000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Daily Income</label>
                    <input
                      type="text"
                      value={newPlan.dailyIncome}
                      onChange={(e) => setNewPlan({...newPlan, dailyIncome: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                      placeholder="$25"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Validity Period</label>
                    <input
                      type="text"
                      value={newPlan.validity}
                      onChange={(e) => setNewPlan({...newPlan, validity: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                      placeholder="200 days"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Color Theme</label>
                    <select
                      value={newPlan.color}
                      onChange={(e) => setNewPlan({...newPlan, color: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                    >
                      <option value="from-red-500 to-red-700">Red</option>
                      <option value="from-blue-500 to-blue-700">Blue</option>
                      <option value="from-green-500 to-green-700">Green</option>
                      <option value="from-yellow-500 to-yellow-700">Yellow</option>
                      <option value="from-purple-500 to-purple-700">Purple</option>
                      <option value="from-indigo-500 to-indigo-700">Indigo</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={newPlan.description}
                      onChange={(e) => setNewPlan({...newPlan, description: e.target.value})}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                      placeholder="High performance variant with turbocharged engine"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newPlan.isActive}
                        onChange={(e) => setNewPlan({...newPlan, isActive: e.target.checked})}
                        className="mr-2"
                      />
                      <span className="text-sm font-medium text-gray-700">Active Plan</span>
                    </label>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={handleCancelEdit}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={editingPlan ? handleUpdatePlan : handleAddPlan}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    {editingPlan ? 'Update Plan' : 'Add Plan'}
                  </button>
                </div>
              </div>
            )}

            {/* Plans List */}
            <div className="bg-white rounded-lg shadow-lg">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-gray-800">Investment Plans</h3>
                  <div className="flex space-x-3">
                    <button
                      onClick={async () => {
                        console.log('Manual refresh of plans')
                        try {
                          const response = await fetch('/api/plans')
                          if (response.ok) {
                            const data = await response.json()
                            console.log('Refreshing plans:', data.plans)
                            setSamplePlans(data.plans)
                            showSuccess('Plans refreshed successfully!')
                          } else {
                            showError('Failed to refresh plans')
                          }
                        } catch (error) {
                          console.error('Error refreshing plans:', error)
                          showError('Error refreshing plans')
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Refresh</span>
                    </button>
                    {!showAddPlan && (
                      <button
                        onClick={() => setShowAddPlan(true)}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        Add New Plan
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Investment</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Daily Income</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {plans && plans.length > 0 ? plans.map((plan) => (
                      <tr key={plan.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden mr-3">
                                                          <img 
                              src={getImageSrc(plan.image)} 
                              alt={plan.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs" style={{display: 'none'}}>
                                No Image
                              </div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{plan.name}</div>
                              <div className="text-sm text-gray-500">{plan.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{plan.investAmount}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">{plan.dailyIncome}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            plan.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {plan.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditPlan(plan)}
                              className="text-purple-600 hover:text-purple-900"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleTogglePlanStatus(plan._id)}
                              className={`${
                                plan.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'
                              }`}
                            >
                              {plan.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => handleDeletePlan(plan._id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                          No plans found. Loading...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800">User Management</h3>
                <p className="text-gray-600">Manage registered users and their accounts. Total users: {users.length}</p>
              </div>
              <button
                onClick={async () => {
                  try {
                    const response = await fetch('/api/admin/users?limit=1000')
                    if (response.ok) {
                      const data = await response.json()
                      setUsers(data.users || [])
                      showSuccess(`Users list refreshed successfully! Found ${data.users?.length || 0} users.`)
                    } else {
                      showError('Failed to refresh users list')
                    }
                  } catch (error) {
                    console.error('Error refreshing users:', error)
                    showError('Failed to refresh users list')
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh</span>
              </button>
            </div>
            
            {users.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <p className="text-gray-500">No registered users found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registration Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.phone} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center mr-3">
                              <span className="text-white text-sm font-bold">
                                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.referralCode ? `Ref: ${user.referralCode}` : 'No referral'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.phone}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.createdAt ? (
                            <div>
                              <div>{formatPakistanDate(user.createdAt)}</div>
                              <div className="text-xs text-gray-400">{formatPakistanTime(user.createdAt)}</div>
                            </div>
                          ) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.isBlocked 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {user.isBlocked ? 'Blocked' : 'Active'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleBlockUser(user.phone)}
                              className={`${
                                user.isBlocked 
                                  ? 'text-green-600 hover:text-green-900' 
                                  : 'text-yellow-600 hover:text-yellow-900'
                              }`}
                            >
                              {user.isBlocked ? 'Unblock' : 'Block'}
                            </button>
                            <button
                              onClick={() => handleResetUserPassword(user.phone)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Reset Password
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.phone)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
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
                  <div className={styles.statValue}>{users.length}</div>
                </div>
              </div>

              {/* Pending Withdrawals */}
              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: 'rgba(217, 169, 78, 0.15)', color: '#d9a94e' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
                </div>
                <div>
                  <div className={styles.statLabel}>Pending Withdrawals</div>
                  <div className={styles.statValue}>{pendingWithdrawRequests.length}</div>
                </div>
              </div>

              {/* Pending Plan Requests */}
              <div className={styles.statCard}>
                <div className={styles.statIcon} style={{ background: 'rgba(62, 207, 142, 0.15)', color: '#3ecf8e' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12l4-4 4 4"/></svg>
                </div>
                <div>
                  <div className={styles.statLabel}>Pending Plan Requests</div>
                  <div className={styles.statValue}>{pendingRechargeRequests.length}</div>
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
                    Rs{withdrawHistory.reduce((sum, r) => sum + Number(r.amount || 0), 0).toFixed(2)}
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
                    Rs{withdrawHistory.filter(r => r.status === 'approved').reduce((sum, r) => sum + Number(r.amount || 0), 0).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'manageAds' && (
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
                              console.error('Error deleting image:', error);
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
                <li>• Supported formats: JPEG, PNG, GIF</li>
                <li>• Recommended size: 800x600 pixels or larger</li>
                <li>• File size: Maximum 5MB per image</li>
                <li>• Images should be placed in the public folder of your project</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'planRequests' && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Pending Recharge Requests ({pendingRechargeRequests.length})</h3>
            {pendingRechargeRequests.length === 0 ? (
              <p className="text-gray-500">No pending recharge requests</p>
            ) : (
              <div className="space-y-3">
                {pendingRechargeRequests.map((request) => (
                  <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-800">{request.userName}</p>
                        <p className="text-sm text-gray-600">Phone: {request.userId}</p>
                        <p className="text-sm text-gray-600">Amount: ${request.amount}</p>
                        <p className="text-sm text-gray-600">Payment Method: {request.paymentMethod}</p>
                        <p className="text-sm text-blue-600">User Transaction ID: {request.userTransactionId || 'Not provided'}</p>
                        <p className="text-xs text-gray-500">System Transaction ID: {request.transactionId}</p>
                        <p className="text-xs text-gray-500">Date: {formatPakistanDate(request.createdAt)} {formatPakistanTime(request.createdAt)}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleRechargeApproval(request.transactionId, true)}
                          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRechargeApproval(request.transactionId, false)}
                          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'withdrawals' && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Withdrawal Requests ({pendingWithdrawRequests.length})</h3>
            {pendingWithdrawRequests.length === 0 ? (
              <p className="text-gray-500">No pending withdraw requests</p>
            ) : (
              <div className="space-y-3">
                {pendingWithdrawRequests.map((request) => (
                  <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-800">{request.userName}</p>
                        <p className="text-sm text-gray-600">Phone: {request.userId}</p>
                        <p className="text-sm text-gray-600">Amount: ${request.amountAfterFee || (request.amount * 0.75).toFixed(2)} (After 25% fee)</p>
                        <p className="text-xs text-gray-500">Original: ${request.amount} | Fee: ${request.withdrawalFee || (request.amount * 0.25).toFixed(2)}</p>
                        <p className="text-sm text-gray-600">Method: {request.withdrawalMethod}</p>
                        <p className="text-sm text-gray-600">Account Name: {request.withdrawalAccountName}</p>
                        <p className="text-sm text-gray-600">Account Number: {request.withdrawalNumber || 'Not provided'}</p>
                        <p className="text-xs text-gray-500">Transaction ID: {request.transactionId}</p>
                        <p className="text-xs text-gray-500">Date: {formatPakistanDate(request.createdAt)} {formatPakistanTime(request.createdAt)}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleWithdrawApproval(request.transactionId, true)}
                          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleWithdrawApproval(request.transactionId, false)}
                          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'earningsControl' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Payment Settings</h3>
            <p className="text-gray-600 mb-6">Manage payment method details for user recharges.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* EasyPaisa Settings */}
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-white font-bold text-sm">EP</span>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-800">EasyPaisa</h4>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
                    <input
                      type="text"
                      value={paymentDetails.easypaisa.number}
                      onChange={(e) => handleUpdatePaymentDetails('easypaisa', 'number', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                      placeholder="0300 1234567"
                    />
                  </div>
                </div>
              </div>

              {/* JazzCash Settings */}
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-white font-bold text-sm">JC</span>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-800">JazzCash</h4>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
                    <input
                      type="text"
                      value={paymentDetails.jazzcash.number}
                      onChange={(e) => handleUpdatePaymentDetails('jazzcash', 'number', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                      placeholder="0300 7654321"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSavePaymentDetails}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
              >
                Save Payment Settings
              </button>
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-medium text-blue-800 mb-2">💡 Payment Settings Info:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• These details will be shown to users when they recharge</li>
                <li>• Users can choose between EasyPaisa and JazzCash</li>
                <li>• Click "Save Payment Settings" to save changes</li>
                <li>• Make sure account numbers are correct and active</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'earningsControl' && (
          <div className="space-y-6">
            {/* Add Coupon Form */}
            {showAddCoupon && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Add New Coupon</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Coupon Code *</label>
                    <input
                      type="text"
                      value={newCoupon.code}
                      onChange={(e) => setNewCoupon({...newCoupon, code: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                      placeholder="WELCOME10"
                      maxLength="20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bonus Amount (Rs) *</label>
                    <input
                      type="number"
                      value={newCoupon.bonusAmount}
                      onChange={(e) => setNewCoupon({...newCoupon, bonusAmount: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                      placeholder="10"
                      min="1"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Usage (Optional)</label>
                    <input
                      type="number"
                      value={newCoupon.maxUsage}
                      onChange={(e) => setNewCoupon({...newCoupon, maxUsage: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                      placeholder="100"
                      min="1"
                    />
                    <p className="text-xs text-gray-500 mt-1">Leave empty for unlimited usage</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={newCoupon.isActive}
                      onChange={(e) => setNewCoupon({...newCoupon, isActive: e.target.value === 'true'})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                    >
                      <option value={true}>Active</option>
                      <option value={false}>Inactive</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={newCoupon.description}
                      onChange={(e) => setNewCoupon({...newCoupon, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                      placeholder="Welcome bonus for new users"
                      rows="3"
                    />
                  </div>
                </div>
                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={handleAddCoupon}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Create Coupon
                  </button>
                  <button
                    onClick={() => {
                      setShowAddCoupon(false)
                      setNewCoupon({
                        code: '',
                        bonusAmount: '',
                        maxUsage: '',
                        isActive: true,
                        description: ''
                      })
                    }}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Coupons List */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-800">Coupon Management</h3>
                <button
                  onClick={() => setShowAddCoupon(true)}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Add New Coupon
                </button>
              </div>

              {coupons.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No coupons available</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Code</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Bonus Amount</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Usage</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Description</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {coupons.map((coupon) => (
                        <tr key={coupon._id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded text-black">
                              {coupon.code}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-green-600">Rs{coupon.bonusAmount}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm text-gray-600">
                              {coupon.usageCount || 0}
                              {coupon.maxUsage && ` / ${coupon.maxUsage}`}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              coupon.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {coupon.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm text-gray-600">{coupon.description}</span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleToggleCouponStatus(coupon._id)}
                                className={`px-2 py-1 rounded text-xs ${
                                  coupon.isActive
                                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                }`}
                              >
                                {coupon.isActive ? 'Deactivate' : 'Activate'}
                              </button>
                              <button
                                onClick={() => handleDeleteCoupon(coupon._id)}
                                className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Used Coupons History */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Coupon Usage History</h3>
              {usedCoupons.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No coupons have been used yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-700">User</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Coupon Code</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Bonus Amount</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Used Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usedCoupons.map((usedCoupon, index) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div>
                              <div className="font-medium text-gray-800">{usedCoupon.userName}</div>
                              <div className="text-sm text-gray-500">{usedCoupon.userPhone}</div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded text-black">
                              {usedCoupon.couponCode}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-green-600">Rs{usedCoupon.bonusAmount}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-sm text-gray-600">
                              {new Date(usedCoupon.usedDate).toLocaleDateString()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recharge History Tab */}
        {activeTab === 'planRequests' && (
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
                            <div className="text-sm text-gray-500">{transaction.userId}</div>
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

        {/* Withdraw History Tab */}
        {activeTab === 'withdrawals' && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-800">Withdraw History</h3>
              <div className="flex items-center space-x-2">
                {historyLoading && (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                )}
                <span className="text-sm text-gray-600">
                  Total: {getFilteredWithdrawHistory().length} transactions
                </span>
                <select
                  value={withdrawFilter}
                  onChange={(e) => setWithdrawFilter(e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <button
                  onClick={refreshWithdrawHistory}
                  disabled={historyLoading}
                  className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-red-600 font-medium">Total Withdrawals</p>
                    <p className="text-lg font-bold text-red-800">{withdrawHistory.length}</p>
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
                      {withdrawHistory.filter(t => t.status === 'approved').length}
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
                      {withdrawHistory.filter(t => t.status === 'pending').length}
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
                      {withdrawHistory.filter(t => t.status === 'rejected').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {getFilteredWithdrawHistory().length === 0 ? (
              <div className="text-center py-8">
                {historyLoading ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                ) : (
                  <p className="text-gray-500">No withdraw transactions found</p>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">User</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Amount</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Method</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Account Details</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredWithdrawHistory().map((transaction) => (
                      <tr key={transaction._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium text-gray-800">{transaction.userName || 'Unknown'}</div>
                            <div className="text-sm text-gray-500">{transaction.userId}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-red-600">Rs{transaction.amount}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-gray-600">{transaction.withdrawalMethod}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <div className="text-sm text-gray-800">
                              {transaction.withdrawalAccountName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {transaction.withdrawalNumber || 'No account number'}
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
          <div className={styles.placeholder}>
            <h3>Mystery Boxes</h3>
            <p>Configure mystery box rewards and odds here.</p>
          </div>
        )}

        {activeTab === 'ecommerce' && (
          <div className={styles.placeholder}>
            <h3>E-Commerce</h3>
            <p>Manage store products and orders here.</p>
          </div>
        )}
    </AdminShell>
  )
} 
