'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useNotification } from '../context/NotificationContext'
import { getCurrentUser, updateUserBalance } from '@/lib/api'

export default function ProfilePage() {
  const router = useRouter()
  const { showSuccess, showError, showWarning, showInfo } = useNotification()
  const [activeNav, setActiveNav] = useState('profile')
  const [userName, setUserName] = useState('John Doe')
  const [userPhone, setUserPhone] = useState('+92 300 ****567')
  const [userData, setUserData] = useState(null)
  const [balance, setBalance] = useState(0)
  const [showRechargeModal, setShowRechargeModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [rechargeAmount, setRechargeAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [transactionId, setTransactionId] = useState('')
  const [rechargeHistory, setRechargeHistory] = useState([])
  const [withdrawHistory, setWithdrawHistory] = useState([])
  const [investmentHistory, setInvestmentHistory] = useState([])
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('easypaisa')
  const [selectedWithdrawMethod, setSelectedWithdrawMethod] = useState('easypaisa')
  const [paymentDetails, setPaymentDetails] = useState({
    easypaisa: { number: '', accountName: '' },
    jazzcash: { number: '', accountName: '' }
  })
  const [withdrawAccountName, setWithdrawAccountName] = useState('')
  const [withdrawAccountNumber, setWithdrawAccountNumber] = useState('')
  
  // Income tracking states
  const [todayIncome, setTodayIncome] = useState(0)
  const [earnBalance, setEarnBalance] = useState(0)
  const [totalRecharge, setTotalRecharge] = useState(0)
  const [referralCommission, setReferralCommission] = useState(0)
  const [totalCommissionEarned, setTotalCommissionEarned] = useState(0)
  const [teamSize, setTeamSize] = useState(0)
  const [investments, setInvestments] = useState([])
  const [currentPlan, setCurrentPlan] = useState(null)
  


  // Refresh user data from database (same logic as loadUserData)
  const refreshUserData = async () => {
    try {
      console.log('refreshUserData called - fetching user data...');
      const user = await getCurrentUser(true); // Force refresh from database
      console.log('User data fetched in profile:', user);
      
      if (user) {
        setUserName(user.name || 'John Doe');
        setUserPhone(user.phone || '+92 300 ****567');
        setUserData(user);
        setEarnBalance(user.earnBalance || 0);
        setTotalRecharge(user.totalRecharge || 0);
        // Don't set balance here - let team API set it to avoid showing negative balance first
        // Don't set commission here - let team API set it (same as home page)
        
        // Load team data and investments to update balance with commission
        try {
          const timestamp = Date.now(); // Add timestamp to prevent caching
          const [teamResponse, investmentsResponse] = await Promise.all([
            fetch(`/api/user/team?userId=${user.phone}&_t=${timestamp}`),
            fetch(`/api/user/investments?active=true&_t=${timestamp}`)
          ]);
          
          // Process investments
          if (investmentsResponse.ok) {
            const investments = await investmentsResponse.json();
            setInvestments(investments); // Set investments state for display
            if (investments.length > 0) {
              setCurrentPlan(investments[0]);
            }
          }
          
          if (teamResponse.ok) {
            const teamData = await teamResponse.json();
            console.log('Profile page refresh - Team data received:', teamData);
            setTeamSize(teamData.totalMembers || 0);
            
            // Update balance to include team commission (exact same logic as home page)
            const currentBalance = user.balance || 0;
            const teamCommission = teamData.totalTeamEarnings || 0;
            
            console.log('Profile page refresh - Balance calculation:', {
              currentBalance: currentBalance,
              teamCommission: teamCommission,
              hasTeamCommission: teamCommission > 0
            });
            
            setReferralCommission(teamCommission);
            setTotalCommissionEarned(teamCommission);
            
            // Use the balance from database directly - it already includes team commission
            setBalance(currentBalance);
            console.log('Profile page refresh - Using balance from database (includes team commission):', currentBalance);
          } else {
            // If team API fails, still set the base balance to avoid showing nothing
            setBalance(user.balance || 0);
            console.log('Profile page refresh - Team API failed, using base balance:', user.balance || 0);
          }
        } catch (error) {
          console.error('Error loading team data in refresh:', error);
          setBalance(user.balance || 0);
        }
        
        showSuccess('Data refreshed successfully!');
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
      showError('Failed to refresh data');
    }
  };

  // Load user data on component mount with cache busting
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = await getCurrentUser()
        if (user) {
          setUserName(user.name || 'John Doe')
          setUserPhone(user.phone || '+92 300 ****567')
          setUserData(user)
          setEarnBalance(user.earnBalance || 0)
          setTotalRecharge(user.totalRecharge || 0)
          // Don't set balance here - let team API set it to avoid showing negative balance first
          // Don't set commission here - let team API set it (same as home page)
          
          // Load ALL data in parallel for maximum performance (same as home page)
          const timestamp = Date.now(); // Add timestamp to prevent caching
          const [investmentsResponse, teamResponse] = await Promise.all([
            fetch(`/api/user/investments?active=true&_t=${timestamp}`),
            fetch(`/api/user/team?userId=${user.phone}&_t=${timestamp}`)
          ])
          
          // Process investments
          if (investmentsResponse.ok) {
            const investments = await investmentsResponse.json()
            setInvestments(investments) // Set investments state for display
            if (investments.length > 0) {
              setCurrentPlan(investments[0])
            }
          }
          
          // Process team data (this will update balance with team commission)
          if (teamResponse.ok) {
            const teamData = await teamResponse.json()
            console.log('Profile page - Team data received:', teamData)
            setTeamSize(teamData.totalMembers || 0)
            
            // Update balance to include team commission (exact same logic as home page)
            const currentBalance = user.balance || 0
            const teamCommission = teamData.totalTeamEarnings || 0
            
            console.log('Profile page - Balance calculation:', {
              currentBalance: currentBalance,
              teamCommission: teamCommission,
              hasTeamCommission: teamCommission > 0
            })
            
            setReferralCommission(teamCommission)
            setTotalCommissionEarned(teamCommission)
            
            // Use the balance from database directly - it already includes team commission
            setBalance(currentBalance)
            console.log('Profile page - Using balance from database (includes team commission):', currentBalance)
          } else {
            // If team API fails, still set the base balance to avoid showing nothing
            setBalance(user.balance || 0)
            console.log('Profile page - Team API failed, using base balance:', user.balance || 0)
          }
          
          // Load transaction history (non-blocking)
          loadTransactionHistory(user.phone)
          
          // Load investment history (non-blocking)
          loadInvestmentHistory(user.phone)
        }
      } catch (error) {
        console.error('Error loading user data:', error)
      }
    }

    loadUserData()
  }, [])

  // Auto-refresh user data every 30 seconds to show updated balances
  useEffect(() => {
    const interval = setInterval(() => {
      if (userData) {
        refreshUserData()
      }
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [userData])

  // Load payment details from database
  useEffect(() => {
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
            // Save default to database
            await fetch('/api/settings', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                key: 'paymentDetails',
                value: defaultPaymentDetails,
                description: 'Payment method details'
              })
            })
          }
        }
      } catch (error) {
        console.error('Error loading payment details:', error)
      }
    }

    loadPaymentDetails()
  }, [])

  // Load transaction history from database
  const loadTransactionHistory = async (userId) => {
    try {
      const response = await fetch(`/api/transactions?userId=${userId}`)
      if (response.ok) {
        const transactions = await response.json()
                    setRechargeHistory(transactions.filter(tx => tx.type === 'recharge'))
            setWithdrawHistory(transactions.filter(tx => tx.type === 'withdraw'))
            showSuccess('Transaction history refreshed!')
      }
    } catch (error) {
      console.error('Error loading transaction history:', error)
      showError('Failed to load transaction history')
    }
  }

  const loadInvestmentHistory = async (userId) => {
    try {
      const response = await fetch(`/api/user/investments?userId=${userId}`)
      if (response.ok) {
        const investments = await response.json()
        setInvestmentHistory(investments)
        showSuccess('Investment history refreshed!')
      }
    } catch (error) {
      console.error('Error loading investment history:', error)
      showError('Failed to load investment history')
    }
  }

  // Load team data from database


  // Parse investment amount from string (e.g., "$5,000" to 5000)
  const parseInvestmentAmount = (amountString) => {
    if (typeof amountString === 'number') return amountString
    if (!amountString) return 0
    
    // Remove currency symbols and commas, then parse
    const cleanAmount = amountString.replace(/[$,₹Rs]/g, '').replace(/,/g, '')
    return parseFloat(cleanAmount) || 0
  }

  // Daily income system - check and add daily income every 24 hours
  useEffect(() => {
    if (!userData || !currentPlan) return
    
    const checkAndAddDailyIncome = async () => {
      try {
        const response = await fetch(`/api/user/balance`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            operation: 'check_daily_income',
            userId: userData.phone,
            planId: currentPlan._id
          })
        })

        if (response.ok) {
          const result = await response.json()
          if (result.incomeAdded) {
            setEarnBalance(result.newEarnBalance)
            setBalance(result.newBalance)
            showSuccess(`Daily income of ${result.incomeAmount} Rs added from ${currentPlan.planName}`)
          } else if (result.hoursRemaining) {
            // Check if user has already seen this popup today
            const today = new Date().toDateString()
            const hasSeenDailyIncomePopup = sessionStorage.getItem(`dailyIncomePopupSeen_${userData.phone}_${today}`)
            
            if (!hasSeenDailyIncomePopup) {
              // Show info about time remaining until first income (only once per day)
              showInfo(`First daily income will be added in ${result.hoursRemaining} hours`)
              // Remember that user has seen this popup today
              sessionStorage.setItem(`dailyIncomePopupSeen_${userData.phone}_${today}`, 'true')
            }
          }
        }
      } catch (error) {
        console.error('Error checking daily income:', error)
      }
    }
    
    // Check immediately when component mounts
    checkAndAddDailyIncome()
    
    // Set up interval to check every hour (in case user keeps the page open)
    const dailyIncomeInterval = setInterval(checkAndAddDailyIncome, 60 * 60 * 1000) // Check every hour
    
    return () => {
      clearInterval(dailyIncomeInterval)
    }
  }, [userData, currentPlan, showSuccess])

  // Refresh all data when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      refreshAllData()
    }, 100) // Small delay to ensure all data is loaded
    
    return () => clearTimeout(timer)
  }, [])

  const refreshAllData = async () => {
    if (!userData) return
    
    try {
      // Refresh user data
      const user = await getCurrentUser(true) // Force refresh (same as home page)
      if (user) {
        setEarnBalance(user.earnBalance || 0)
        setTotalRecharge(user.totalRecharge || 0)
        // Don't set balance here - let team API set it to avoid showing negative balance first
      }
      
      // Load ALL data in parallel for maximum performance (same as home page)
      const timestamp = Date.now(); // Add timestamp to prevent caching
      const [investmentsResponse, teamResponse] = await Promise.all([
        fetch(`/api/user/investments?active=true&_t=${timestamp}`),
        fetch(`/api/user/team?userId=${userData.phone}&_t=${timestamp}`)
      ])
      
      // Process investments
      if (investmentsResponse.ok) {
        const investments = await investmentsResponse.json()
        setInvestments(investments) // Set investments state for display
        if (investments.length > 0) {
          setCurrentPlan(investments[0])
        }
      }
      
      // Process team data (this will update balance with team commission)
      if (teamResponse.ok) {
        const teamData = await teamResponse.json()
        console.log('Profile page refresh - Team data received:', teamData)
        setTeamSize(teamData.totalMembers || 0)
        
        // Update balance to include team commission (exact same logic as home page)
        const currentBalance = user.balance || 0
        const teamCommission = teamData.totalTeamEarnings || 0
        
        console.log('Profile page refresh - Balance calculation:', {
          currentBalance: currentBalance,
          teamCommission: teamCommission,
          hasTeamCommission: teamCommission > 0
        })
        
        setReferralCommission(teamCommission)
        setTotalCommissionEarned(teamCommission)
        
        // Use the balance from database directly - it already includes team commission
        setBalance(currentBalance)
        console.log('Profile page refresh - Using balance from database (includes team commission):', currentBalance)
      } else {
        // If team API fails, still set the base balance to avoid showing nothing
        setBalance(user.balance || 0)
        console.log('Profile page refresh - Team API failed, using base balance:', user.balance || 0)
      }
      
      // Refresh transaction history (non-blocking)
      loadTransactionHistory(userData.phone)
    } catch (error) {
      console.error('Error refreshing data:', error)
    }
  }

  // Calculate income based on current plan and team
  const calculateIncome = async () => {
    if (!userData || !currentPlan) return

    try {
      // Calculate from current plan
      const dailyIncomeAmount = parseInvestmentAmount(currentPlan.dailyIncome)
      setTodayIncome(dailyIncomeAmount)

      // Calculate team income (3-tier referral system)
      const response = await fetch(`/api/user/balance`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: 'calculate_team_income',
          userId: userData.phone
        })
      })

      if (response.ok) {
        const result = await response.json()
        // Team income is already added to earn balance in the backend
        console.log('Team income calculated:', result)
      }
    } catch (error) {
      console.error('Error calculating income:', error)
    }
  }

  const userInitial = userName.charAt(0).toUpperCase()

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('isLoggedIn')
      localStorage.removeItem('userData')
      router.push('/login')
    }
  }

  const handleRecharge = async () => {
    if (!rechargeAmount || parseFloat(rechargeAmount) <= 0) {
      showError('Please enter a valid amount')
      return
    }

    const amount = parseFloat(rechargeAmount)
    
    // Check minimum recharge limit
    if (amount < 1000) {
      showError('Minimum recharge amount is Rs 1000')
      return
    }

    if (!userData) {
      showError('Please log in to recharge')
      return
    }

    try {
      await updateUserBalance(userData.phone, 'recharge', {
        amount: amount,
        paymentMethod: selectedPaymentMethod === 'easypaisa' ? 'EasyPaisa' : 'JazzCash',
        paymentNumber: paymentDetails[selectedPaymentMethod].number,
        paymentAccountName: paymentDetails[selectedPaymentMethod].accountName,
        transactionId: transactionId.trim()
      })

      showSuccess(`Recharge request submitted for Rs${amount}. Admin will approve your payment.`)
      setRechargeAmount('')
      setTransactionId('')
      setShowRechargeModal(false)
      // Refresh all data to update balance with team commission
      await refreshAllData()
    } catch (error) {
      showError(error.message || 'Recharge request failed')
    }
  }

  const handleWithdraw = async () => {
    // Check if user has purchased any investment plan by making a direct API call
    try {
      const investmentsResponse = await fetch(`/api/user/investments?active=true&userId=${userData.phone}`)
      if (investmentsResponse.ok) {
        const activeInvestments = await investmentsResponse.json()
        if (!activeInvestments || activeInvestments.length === 0) {
          showError('❌ Withdrawal Failed!\n\nYou must purchase an investment plan before you can withdraw.\n\nPlease go to the Invest page and buy a plan first.')
          setShowWithdrawModal(false)
          return
        }
      } else {
        showError('Failed to check investment status. Please try again.')
        return
      }
    } catch (error) {
      showError('Failed to check investment status. Please try again.')
      return
    }

    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      showError('Please enter a valid amount')
      return
    }

    const amount = parseFloat(withdrawAmount)
    
    // Check minimum withdrawal limit
    if (amount < 300) {
      showError('Minimum withdrawal amount is Rs 300')
      return
    }

    if (!userData) {
      showError('Please log in to withdraw')
      return
    }

    try {
      await updateUserBalance(userData.phone, 'withdraw', {
        amount: amount,
        teamCommission: referralCommission, // Include team commission
        withdrawalMethod: selectedWithdrawMethod === 'easypaisa' ? 'EasyPaisa' : 'JazzCash',
        withdrawalNumber: withdrawAccountNumber.trim() || paymentDetails[selectedWithdrawMethod].number,
        withdrawalAccountName: withdrawAccountName
      })

      showSuccess(`Withdrawal request submitted for Rs${amount}. Amount has been deducted from your balance. Admin will process your withdrawal.`)
      setWithdrawAmount('')
      setWithdrawAccountName('')
      setShowWithdrawModal(false)
      // Refresh all data to update balance with team commission
      await refreshAllData()
    } catch (error) {
      showError(error.message || 'Withdrawal request failed')
    }
  }

  const handleNavigation = (page) => {
    setActiveNav(page)
    switch(page) {
      case 'home':
        router.push('/')
        break
      case 'invest':
        router.push('/invest')
        break
      case 'investment':
        router.push('/invest')
        break
      case 'team':
        router.push('/team')
        break
      case 'profile':
        // Already on profile
        break
    }
  }

  const handleTelegram = () => {
    // Open Telegram channel link
    window.open('https://t.me/HondaCivicCar', '_blank')
            showInfo('Opening Neo Earner Telegram channel...')
  }

  const handleWhatsApp = () => {
    // Open WhatsApp channel link
    window.open('https://whatsapp.com/channel/0029VbBRj5B1yT2Coj35e92J', '_blank')
            showInfo('Opening Neo Earner WhatsApp channel...')
  }

  return (
    <>
      <div className="w-full min-h-screen">
        <div className="p-4">
                {/* Profile Header Card */}
        <div className="bg-white rounded-2xl p-6 mb-6 relative overflow-hidden" style={{ boxShadow: 'rgba(17, 17, 26, 0.1) 0px 4px 16px, rgba(17, 17, 26, 0.1) 0px 8px 24px, rgba(17, 17, 26, 0.1) 0px 16px 56px' }}>
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-200 rounded-full -translate-y-10 translate-x-10 opacity-20"></div>
          <div className="relative z-10 text-center">
            <div className="w-20 h-20 bg-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-white text-2xl font-bold">{userInitial}</span>
            </div>
            <h2 className="text-2xl font-bold text-purple-900 mb-3">{userName}</h2>
            <p className="text-gray-600 mb-3">{userPhone}</p>
            {userData?.referralCode && (
              <p className="text-sm text-gray-500 mb-3">Referred by: {userData.referralCode}</p>
            )}
            <div className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-full text-sm font-medium mb-6">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Premium Member
            </div>
            
            {/* Refresh Button */}
            <div className="mb-6">
              <button
                onClick={refreshUserData}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-full text-sm font-medium hover:bg-green-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Data
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="bg-purple-100 rounded-xl p-4 mb-2">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <p className="text-2xl font-bold text-purple-900">Rs{balance.toFixed(2)}</p>
                  <p className="text-sm text-gray-600">Balance</p>
                </div>
              </div>
              <div className="text-center">
                <div className="bg-purple-100 rounded-xl p-4 mb-2">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <p className="text-2xl font-bold text-purple-900">{investments.length}</p>
                  <p className="text-sm text-gray-600">Investments</p>
                </div>
              </div>

            </div>
            
            {/* Second Row - Team Size */}
            <div className="grid grid-cols-1 gap-4 mt-4">
              <div className="text-center">
                <div className="bg-purple-100 rounded-xl p-4 mb-2">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <p className="text-2xl font-bold text-purple-900">{teamSize}</p>
                  <p className="text-sm text-gray-600">Team Size</p>
                </div>
              </div>
            </div>
          </div>
        </div>



        {/* Financial Overview Section */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center">
            <svg className="w-5 h-5 text-white mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            Financial Overview
          </h3>
          
          {/* Account Balance Cards - Like Home Page */}
          <div className="flex gap-4 mb-4">
            {/* Account Balance - Large Card */}
            <div className="flex-1 bg-white rounded-lg p-4 text-purple-900 relative overflow-hidden shadow-lg">
              <div className="absolute top-0 right-0 w-20 h-20 bg-purple-200 rounded-full -translate-y-10 translate-x-10 opacity-30"></div>
              <div className="relative z-10">
                <p className="text-sm font-medium opacity-90">Account balance</p>
                <p className="text-2xl font-bold mt-1">Rs{balance.toFixed(2)}</p>
                {referralCommission > 0 && (
                  <p className="text-xs text-green-600 mt-1 font-medium">✅ Balance includes team commission</p>
                )}
              </div>
            </div>
            
            {/* Right Side Cards */}
            <div className="flex flex-col gap-4 w-1/3">
             
              
              {/* Earn Balance */}
              <div className="bg-white rounded-lg p-3 text-purple-900 relative overflow-hidden shadow-lg">
                <div className="absolute top-0 right-0 w-12 h-12 bg-purple-200 rounded-full -translate-y-6 translate-x-6 opacity-30"></div>
                <div className="relative z-10">
                  <p className="text-xs font-medium opacity-90">Earn Balance</p>
                  <p className="text-lg font-bold mt-1">Rs{earnBalance.toFixed(2)}</p>
                  <p className="text-xs text-green-600 mt-1">Team Commission: Rs{referralCommission.toFixed(2)}</p>
                  <p className="text-xs text-green-500">Already in account balance</p>
                </div>
              </div>
              
              {/* Total Recharge */}
              <div className="bg-white rounded-lg p-3 text-purple-900 relative overflow-hidden shadow-lg">
                <div className="absolute top-0 right-0 w-12 h-12 bg-purple-200 rounded-full -translate-y-6 translate-x-6 opacity-30"></div>
                <div className="relative z-10">
                  <p className="text-xs font-medium opacity-90">Total Recharge</p>
                  <p className="text-lg font-bold mt-1">Rs{totalRecharge.toFixed(2)}</p>
                </div>
              </div>
              

            </div>
          </div>
          
          {/* Additional Balance Cards */}
          <div className="grid grid-cols-1 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 text-purple-900 relative overflow-hidden shadow-lg">
              <div className="absolute top-0 right-0 w-16 h-16 bg-purple-200 rounded-full -translate-y-8 translate-x-8 opacity-30"></div>
              <div className="relative z-10">
                <p className="text-sm font-medium opacity-90">Total Withdraw</p>
                <p className="text-xl font-bold mt-1">Rs{withdrawHistory.filter(req => req.userId === userData?.phone && req.status === 'approved').reduce((sum, req) => sum + parseFloat(req.amount), 0).toFixed(2)}</p>
              </div>
            </div>
          </div>
          
          {/* Refresh Data Button */}
          <div className="flex justify-end mb-4">
            <button
              onClick={refreshUserData}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Data
            </button>
          </div>
          
          {/* Action Buttons */}
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <div className="flex justify-center gap-8">
              {/* Recharge Button */}
              <div className="flex flex-col items-center" onClick={() => setShowRechargeModal(true)}>
                <div className="w-16 h-16 bg-purple-600 rounded-lg flex items-center justify-center mb-2 hover:bg-purple-700 transition-colors cursor-pointer shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <span className="text-purple-900 text-sm font-medium">Recharge</span>
              </div>
              
              {/* Withdraw Button */}
              <div className="flex flex-col items-center" onClick={() => setShowWithdrawModal(true)}>
                <div className={`w-16 h-16 rounded-lg flex items-center justify-center mb-2 transition-colors cursor-pointer shadow-lg ${
                  currentPlan 
                    ? 'bg-purple-600 hover:bg-purple-700' 
                    : 'bg-gray-400 cursor-not-allowed'
                }`}>
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <span className="text-purple-900 text-sm font-medium">Withdraw</span>
                {!currentPlan && (
                  <span className="text-red-500 text-xs mt-1">Plan Required</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center">
              <svg className="w-5 h-5 text-white mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Transaction History
            </h3>
            <button
              onClick={() => userData && loadTransactionHistory(userData.phone)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>

          {/* Recharge History */}
          <div className="bg-white rounded-lg p-6 shadow-lg mb-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-purple-900 flex items-center">
                <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                Recharge History
              </h4>
              <span className="text-sm text-gray-500">
                {rechargeHistory.length} transaction{rechargeHistory.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            {rechargeHistory.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {rechargeHistory.map((transaction, index) => (
                  <div key={transaction.transactionId || index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-3 ${
                          transaction.status === 'approved' ? 'bg-green-500' :
                          transaction.status === 'pending' ? 'bg-yellow-500' :
                          transaction.status === 'rejected' ? 'bg-red-500' : 'bg-gray-500'
                        }`}></div>
                        <span className="font-semibold text-gray-900">
                          Rs{transaction.amount.toFixed(2)}
                        </span>
                      </div>
                      <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                        transaction.status === 'approved' ? 'bg-green-100 text-green-800' :
                        transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        transaction.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex justify-between">
                        <span>Method:</span>
                        <span className="font-medium">{transaction.paymentMethod || 'N/A'}</span>
                      </div>
                      {transaction.userTransactionId && (
                        <div className="flex justify-between">
                          <span>Transaction ID:</span>
                          <span className="font-mono text-xs">{transaction.userTransactionId}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Date:</span>
                        <span>{new Date(transaction.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</span>
                      </div>
                      {transaction.description && (
                        <div className="text-gray-500 text-xs mt-2">
                          {transaction.description}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p>No recharge transactions found</p>
                <p className="text-sm">Your recharge history will appear here</p>
              </div>
            )}
          </div>

          {/* Withdraw History */}
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-purple-900 flex items-center">
                <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                Withdraw History
              </h4>
              <span className="text-sm text-gray-500">
                {withdrawHistory.length} transaction{withdrawHistory.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            {withdrawHistory.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {withdrawHistory.map((transaction, index) => (
                  <div key={transaction.transactionId || index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full mr-3 ${
                          transaction.status === 'approved' ? 'bg-green-500' :
                          transaction.status === 'pending' ? 'bg-yellow-500' :
                          transaction.status === 'rejected' ? 'bg-red-500' : 'bg-gray-500'
                        }`}></div>
                        <span className="font-semibold text-gray-900">
                          Rs{transaction.amount.toFixed(2)}
                        </span>
                      </div>
                      <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                        transaction.status === 'approved' ? 'bg-green-100 text-green-800' :
                        transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        transaction.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex justify-between">
                        <span>Amount:</span>
                        <span className="font-medium">Rs{transaction.amount.toFixed(2)}</span>
                      </div>
                      {transaction.withdrawalFee > 0 && (
                        <div className="flex justify-between">
                          <span>Fee (25%):</span>
                          <span className="font-medium text-red-600">-Rs{transaction.withdrawalFee.toFixed(2)}</span>
                        </div>
                      )}
                      {transaction.amountAfterFee > 0 && (
                        <div className="flex justify-between">
                          <span>You'll Receive:</span>
                          <span className="font-medium text-green-600">Rs{transaction.amountAfterFee.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Method:</span>
                        <span className="font-medium">{transaction.withdrawalMethod || 'N/A'}</span>
                      </div>
                      {transaction.withdrawalAccountName && (
                        <div className="flex justify-between">
                          <span>Account Name:</span>
                          <span className="font-medium">{transaction.withdrawalAccountName}</span>
                        </div>
                      )}
                      {transaction.withdrawalNumber && (
                        <div className="flex justify-between">
                          <span>Account Number:</span>
                          <span className="font-mono text-xs">{transaction.withdrawalNumber}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Date:</span>
                        <span>{new Date(transaction.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</span>
                      </div>
                      {transaction.description && (
                        <div className="text-gray-500 text-xs mt-2">
                          {transaction.description}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <p>No withdraw transactions found</p>
                <p className="text-sm">Your withdrawal history will appear here</p>
              </div>
            )}
          </div>
        </div>

        {/* Investment History Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center">
              <svg className="w-5 h-5 text-white mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Investment History
            </h3>
            <button
              onClick={() => userData && loadInvestmentHistory(userData.phone)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-purple-900 flex items-center">
                <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Plan Purchase History
              </h4>
              <span className="text-sm text-gray-500">
                {investmentHistory.length} investment{investmentHistory.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            {investmentHistory.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {investmentHistory.map((investment, index) => {
                  const investDate = new Date(investment.investDate)
                  const firstIncomeDate = new Date(investment.firstIncomeDate)
                  const now = new Date()
                  const isActive = investment.isActive
                  const isFirstIncomeTime = now >= firstIncomeDate
                  
                  return (
                    <div key={investment._id || index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-3 ${
                            isActive ? 'bg-green-500' : 'bg-gray-500'
                          }`}></div>
                          <span className="font-semibold text-gray-900">
                            {investment.planName}
                          </span>
                        </div>
                        <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                          isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex justify-between">
                          <span>Investment Amount:</span>
                          <span className="font-medium">{investment.investAmount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Daily Income:</span>
                          <span className="font-medium">{investment.dailyIncome}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Validity:</span>
                          <span className="font-medium">{investment.validity}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Earned:</span>
                          <span className="font-medium">Rs{investment.totalEarned.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Purchase Date:</span>
                          <span>{investDate.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</span>
                        </div>
                        {isActive && (
                          <div className="flex justify-between">
                            <span>First Income:</span>
                            <span className={`font-medium ${isFirstIncomeTime ? 'text-green-600' : 'text-orange-600'}`}>
                              {isFirstIncomeTime ? 'Started' : `${Math.ceil((firstIncomeDate.getTime() - now.getTime()) / (1000 * 60 * 60))}h remaining`}
                            </span>
                          </div>
                        )}
                        {investment.lastIncomeDate && (
                          <div className="flex justify-between">
                            <span>Last Income:</span>
                            <span>{new Date(investment.lastIncomeDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <p>No investment history found</p>
                <p className="text-sm">Your plan purchase history will appear here</p>
              </div>
            )}
          </div>
        </div>

        {/* Settings Card */}
        <div className="bg-white rounded-lg p-6 relative overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 w-12 h-12 bg-purple-200 rounded-full -translate-y-6 translate-x-6 opacity-20"></div>
          <div className="relative z-10">
            <h3 className="text-lg font-bold text-purple-900 mb-4 flex items-center">
              <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </h3>
            
            <div className="space-y-3">
              <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-purple-50 transition-colors">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-purple-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span className="text-gray-700">Change Password</span>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-purple-50 transition-colors">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-purple-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5v-5zM4 19h6v-6H4v6zM4 5h6V4a1 1 0 00-1-1H5a1 1 0 00-1 1v1zm0 0h6m0 0H4m6 0v6" />
                  </svg>
                  <span className="text-gray-700">Notifications</span>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              <button 
                onClick={handleTelegram}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-purple-50 transition-colors"
              >
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-purple-600 mr-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                  <span className="text-gray-700">Help & Support</span>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              <button 
                onClick={handleWhatsApp}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-green-50 transition-colors"
              >
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-600 mr-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                  </svg>
                  <span className="text-gray-700">WhatsApp Help</span>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-red-50 transition-colors"
              >
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="text-red-600">Logout</span>
                </div>
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recharge Modal */}
      {showRechargeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4 pb-20">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Recharge Account</h3>
            
            {/* Amount Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-black mb-2">Amount (Rs)</label>
              
              {/* Predefined Amount Options */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setRechargeAmount('1200')}
                  className={`p-2 border rounded-lg text-black font-semibold text-center transition-colors ${
                    rechargeAmount === '1200'
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="text-sm font-medium">Rs 1,200</div>
                </button>
                <button
                  type="button"
                  onClick={() => setRechargeAmount('2500')}
                  className={`p-2 border rounded-lg text-black font-semibold text-center transition-colors ${
                    rechargeAmount === '2500'
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="text-sm font-medium">Rs 2,500</div>
                </button>
                <button
                  type="button"
                  onClick={() => setRechargeAmount('5000')}
                  className={`p-2 border rounded-lg text-black font-semibold  text-center transition-colors ${
                    rechargeAmount === '5000'
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="text-sm font-medium">Rs 5,000</div>
                </button>
                <button
                  type="button"
                  onClick={() => setRechargeAmount('10000')}
                  className={`p-2 border rounded-lg text-black font-semibold text-center transition-colors ${
                    rechargeAmount === '10000'
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="text-sm font-medium">Rs 10,000</div>
                </button>
                <button
                  type="button"
                  onClick={() => setRechargeAmount('15000')}
                  className={`p-2 border rounded-lg text-black font-semibold text-center transition-colors ${
                    rechargeAmount === '15000'
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="text-sm font-medium">Rs 15,000</div>
                </button>
                <button
                  type="button"
                  onClick={() => setRechargeAmount('20000')}
                  className={`p-2 border rounded-lg text-black font-semibold text-center transition-colors ${
                    rechargeAmount === '20000'
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="text-sm font-medium">Rs 20,000</div>
                </button>
              </div>
              
              <input
                type="number"
                value={rechargeAmount}
                onChange={(e) => setRechargeAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                placeholder="Enter custom amount (min: Rs 1,000)"
                min="1000"
                step="0.01"
              />
              <p className="text-xs text-gray-500 mt-1">Minimum recharge amount: Rs 1,000</p>
            </div>

            {/* Transaction ID Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Transaction ID </label>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                placeholder="Enter transaction ID from payment app"
              />
            </div>

            {/* Payment Method Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
              <div className="grid grid-cols-2 gap-3">
                                 <button
                   type="button"
                   onClick={() => setSelectedPaymentMethod('easypaisa')}
                   className={`p-3 border rounded-lg text-center transition-colors ${
                     selectedPaymentMethod === 'easypaisa'
                       ? 'border-purple-500 bg-purple-50 text-purple-700'
                       : 'border-gray-300 hover:border-gray-400'
                   }`}
                 >
                   <div className="text-lg text-black font-semibold">EasyPaisa</div>
                 </button>
                 <button
                   type="button"
                   onClick={() => setSelectedPaymentMethod('jazzcash')}
                   className={`p-3 border rounded-lg text-center transition-colors ${
                     selectedPaymentMethod === 'jazzcash'
                       ? 'border-purple-500 bg-purple-50 text-purple-700'
                       : 'border-gray-300 hover:border-gray-400'
                   }`}
                 >
                   <div className="text-lg text-black font-semibold">JazzCash</div>
                 </button>
              </div>
            </div>

            {/* Payment Details */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Payment Details</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-xl font-semibold text-gray-600">Account Number:</span>
                  <span className="text-xl font-semibold text-gray-800">
                    {paymentDetails[selectedPaymentMethod].number}
                  </span>
                </div>
              </div>
              <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                💡 Send the exact amount to the account above. Include your phone number in the payment note.
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleRecharge}
                className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
              >
                Submit Request
              </button>
              <button
                onClick={() => setShowRechargeModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

            {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4 pb-20">
          <div className="bg-white rounded-xl p-4 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-800 mb-3">Withdraw Funds</h3>
            
            {/* Available Balance */}
            <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                <span className="font-semibold">Available Balance:</span> Rs{balance.toFixed(2)}
              </p>
              {referralCommission > 0 && (
                <p className="text-xs text-green-600 mt-1">
                  <span className="font-medium">Team Commission:</span> Rs{referralCommission.toFixed(2)} (withdrawable)
                </p>
              )}
            </div>

            {/* Amount Input */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Withdrawal Amount (Rs)</label>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                placeholder="Enter amount (min: Rs 300)"
                min="300"
                max={balance}
                step="0.01"
              />
              <p className="text-xs text-gray-500 mt-1">Minimum withdrawal amount: Rs 300</p>
            </div>

            {/* Withdrawal Fee Warning */}
            {withdrawAmount > 0 && (
              <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center mb-1">
                  <svg className="w-4 h-4 text-orange-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span className="text-sm font-medium text-orange-800">Withdrawal Fee: 25%</span>
                </div>
                <div className="text-xs text-orange-700 space-y-1">
                  <div className="flex justify-between">
                    <span>Requested Amount:</span>
                    <span>Rs{parseFloat(withdrawAmount || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fee (25%):</span>
                    <span className="text-red-600">-Rs{(parseFloat(withdrawAmount || 0) * 0.25).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>You'll Receive:</span>
                    <span className="text-green-600">Rs{(parseFloat(withdrawAmount || 0) * 0.75).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Withdrawal Method Selection */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Withdrawal Method</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedWithdrawMethod('easypaisa')}
                  className={`p-2 border rounded-lg text-center transition-colors ${
                    selectedWithdrawMethod === 'easypaisa'
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="text-base font-semibold">EasyPaisa</div>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedWithdrawMethod('jazzcash')}
                  className={`p-2 border rounded-lg text-center transition-colors ${
                    selectedWithdrawMethod === 'jazzcash'
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-300 hover:border-gray-400'
                }`}
                >
                  <div className="text-base font-semibold">JazzCash</div>
                </button>
              </div>
            </div>

            {/* Account Details */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
              <input
                type="text"
                value={withdrawAccountNumber}
                onChange={(e) => setWithdrawAccountNumber(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                placeholder="Enter account number"
              />
              <p className="text-xs text-gray-500 mt-1">Enter your account number or leave empty to use registered number</p>
            </div>

            {/* Account Holder Name */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Account Holder Name</label>
              <input
                type="text"
                value={withdrawAccountName}
                onChange={(e) => setWithdrawAccountName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                placeholder="Enter account holder name"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Enter the name registered with your account</p>
            </div>

            {/* Withdrawal Info */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-medium text-blue-800 mb-1">Withdrawal Information:</h4>
              <ul className="text-xs text-blue-700 space-y-0.5">
                <li>• Amount will be sent to your {selectedWithdrawMethod === 'easypaisa' ? 'EasyPaisa' : 'JazzCash'} account</li>
                <li>• Processing time: 5-30 minutes</li>
                <li>• Make sure account details are correct</li>
                <li>• Admin will verify and process your withdrawal</li>
              </ul>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleWithdraw}
                disabled={!withdrawAccountName.trim() || (!withdrawAccountNumber.trim() && !paymentDetails[selectedWithdrawMethod].number)}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Submit Withdrawal
              </button>
              <button
                onClick={() => {
                  setShowWithdrawModal(false)
                  setWithdrawAccountName('')
                  setWithdrawAccountNumber('')
                  setWithdrawAmount('')
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  )
} 
