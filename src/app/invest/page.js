'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useNotification } from '../context/NotificationContext'
import { getCurrentUser } from '@/lib/api'

export default function InvestPage() {
  const { showSuccess, showError, showWarning, showInfo } = useNotification()
  const [userData, setUserData] = useState(null)
  const [userBalance, setUserBalance] = useState(0)
  const [showInsufficientModal, setShowInsufficientModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)
  
  // Ribbon badges for infinite slider
  const ribbonBadges = [
    { text: "🔥 Hot Deals", emoji: "🔥" },
    { text: "💎 Premium Models", emoji: "💎" },
    { text: "📈 Daily Returns", emoji: "📈" },
    { text: "🚗 Best Cars", emoji: "🚗" },
    { text: "💰 High Profits", emoji: "💰" },
    { text: "⭐ Top Quality", emoji: "⭐" }
  ]

  const [civicModels, setCivicModels] = useState([])

  // Load user data and balance
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = await getCurrentUser()
        if (user) {
          setUserData(user)
          setUserBalance(user.balance || 0)
        }
      } catch (error) {
        console.error('Error loading user data:', error)
      }
    }

    loadUserData()
  }, [])

  // Load plans from database
  useEffect(() => {
    const loadPlans = async () => {
      try {
        const timestamp = Date.now(); // Add timestamp to prevent caching
        const response = await fetch(`/api/plans?_t=${timestamp}`)
        if (response.ok) {
          const plans = await response.json()
          setCivicModels(plans)
        } else {
          // Fallback to default plans if API fails
          const defaultPlans = [
            {
              _id: 1,
              name: 'Neo Earner Type R',
              image: 'car1.jpeg',
              investAmount: '$5,000',
              dailyIncome: '$25',
              validity: '200 days',
              color: 'from-red-500 to-red-700',
              description: 'High performance variant with turbocharged engine',
              isActive: true
            },
            {
              _id: 2,
              name: 'Neo Earner Sedan',
              image: 'car2.jpeg',
              investAmount: '$3,500',
              dailyIncome: '$17.50',
              validity: '200 days',
              color: 'from-blue-500 to-blue-700',
              description: 'Classic four-door model with excellent fuel economy',
              isActive: true
            },
            {
              _id: 3,
              name: 'Neo Earner Hatchback',
              image: 'car3.jpeg',
              investAmount: '$4,000',
              dailyIncome: '$20',
              validity: '200 days',
              color: 'from-green-500 to-green-700',
              description: 'Versatile hatchback with sporty styling and ample cargo space',
              isActive: true
            },
            {
              _id: 4,
              name: 'Neo Earner Si',
              image: 'car4.jpeg',
              investAmount: '$4,500',
              dailyIncome: '$22.50',
              validity: '200 days',
              color: 'from-yellow-500 to-yellow-700',
              description: 'Sport-injected model with enhanced performance features',
              isActive: true
            },
            {
              _id: 5,
              name: 'Neo Earner Hybrid',
              image: 'car5.jpeg',
              investAmount: '$4,200',
              dailyIncome: '$21',
              validity: '200 days',
              color: 'from-purple-500 to-purple-700',
              description: 'Eco-friendly hybrid with excellent fuel efficiency',
              isActive: true
            }
          ]
          setCivicModels(defaultPlans)
        }
      } catch (error) {
        console.error('Error loading plans:', error)
      }
    }

    loadPlans()
  }, [])

  // Parse investment amount from string (e.g., "$5,000" to 5000)
  const parseInvestmentAmount = (amountString) => {
    if (typeof amountString === 'number') return amountString
    if (!amountString) return 0
    
    // Remove currency symbols and commas, then parse
    const cleanAmount = amountString.replace(/[$,₹Rs]/g, '').replace(/,/g, '')
    return parseFloat(cleanAmount) || 0
  }

  const handleInvest = async (modelId) => {
    if (!userData) {
      showError('Please log in to invest')
      return
    }

    const selectedModel = civicModels.find(model => model._id === modelId)
    if (!selectedModel) {
      showError('Selected plan not found')
      return
    }

    const investAmount = parseInvestmentAmount(selectedModel.investAmount)
    
    if (userBalance < investAmount) {
      setSelectedPlan(selectedModel)
      setShowInsufficientModal(true)
      return
    }

    try {
      // Create investment in database
      const response = await fetch('/api/user/investments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData.phone,
          planId: selectedModel._id,
          planName: selectedModel.name,
          investAmount: selectedModel.investAmount,
          dailyIncome: selectedModel.dailyIncome,
          validity: selectedModel.validity,
          investDate: new Date().toISOString()
        })
      })

      if (response.ok) {
        const result = await response.json()
        
        // Update user balance
        const newBalance = userBalance - investAmount
        setUserBalance(newBalance)
        
        showSuccess(`🎉 Investment successful! You have purchased ${selectedModel.name} for ${selectedModel.investAmount}. Daily income: ${selectedModel.dailyIncome}. You can purchase more plans to increase your earnings!`)
        
        // Redirect to home page to see the investment
        window.location.href = '/'
      } else {
        const errorData = await response.json()
        showError(errorData.message || 'Investment failed')
      }
    } catch (error) {
      console.error('Error making investment:', error)
      showError('Investment failed. Please try again.')
    }
  }

  return (
    <>
      <div className="w-full min-h-screen">
        <div className="p-4">
          <div className="container mx-auto">
          {/* Balance Display */}
          {userData && (
            <div className="bg-white rounded-xl p-4 mb-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">Welcome, {userData.name}</h2>
                  <p className="text-sm text-gray-600">Check your balance before investing</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Available Balance</p>
                  <p className="text-2xl font-bold text-purple-600">Rs{userBalance.toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Page Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-xl py-8 mb-8 hover:shadow-xl transition-all duration-300" style={{ boxShadow: 'rgba(17, 17, 26, 0.1) 0px 4px 16px, rgba(17, 17, 26, 0.1) 0px 8px 24px, rgba(17, 17, 26, 0.1) 0px 16px 56px' }}>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-white mb-3">
                Neo Earner Investment Options
              </h1>
              <p className="text-purple-100 text-lg mb-4">
                Invest in premium Neo Earner models and earn daily returns
              </p>
              <p className="text-purple-200 text-sm mb-2">
                💡 You can purchase multiple plans simultaneously to maximize your earnings!
              </p>
              <div className="overflow-hidden">
                <div className="flex animate-scroll-ribbon">
                  {/* First set of badges */}
                  {ribbonBadges.map((badge, index) => (
                    <div key={`first-${index}`} className="bg-white bg-opacity-20 rounded-full px-4 py-2 mx-2 flex-shrink-0">
                      <span className="text-black font-semibold whitespace-nowrap">{badge.text}</span>
                    </div>
                  ))}
                  {/* Duplicate set for seamless loop */}
                  {ribbonBadges.map((badge, index) => (
                    <div key={`second-${index}`} className="bg-white bg-opacity-20 rounded-full px-4 py-2 mx-2 flex-shrink-0">
                      <span className="text-black font-semibold whitespace-nowrap">{badge.text}</span>
                    </div>
                  ))}
                  {ribbonBadges.map((badge, index) => (
                    <div key={`second-${index}`} className="bg-white bg-opacity-20 rounded-full px-4 py-2 mx-2 flex-shrink-0">
                      <span className="text-black font-semibold whitespace-nowrap">{badge.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Car Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {civicModels.filter(model => model.isActive).map((model) => (
              <div key={model._id} className="bg-white rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 relative" style={{ boxShadow: 'rgba(17, 17, 26, 0.1) 0px 4px 16px, rgba(17, 17, 26, 0.1) 0px 8px 24px, rgba(17, 17, 26, 0.1) 0px 16px 56px' }}>
                {/* HOT Badge */}
                <div className="absolute top-3 right-3 z-10">
                  <div className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                    HOT
                  </div>
                </div>
                <div className="h-48 relative overflow-hidden bg-gray-200 flex items-center justify-center">
                  <img 
                    src={model.image && model.image.startsWith('data:') ? model.image : `/${model.image}`} 
                    alt={model.name}
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
                <div className="p-5">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{model.name}</h3>
                  <p className="text-gray-600 mb-4 text-sm">{model.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500">Investment Amount</p>
                      <p className="font-bold text-lg text-gray-800">{model.investAmount}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500">Daily Income</p>
                      <p className="font-bold text-lg text-green-600">{model.dailyIncome}</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg mb-4">
                    <p className="text-xs text-gray-500">Validity Period</p>
                    <p className="font-bold text-lg text-gray-800">{model.validity}</p>
                  </div>
                  
                  <button 
                    onClick={() => handleInvest(model._id)}
                    className={`w-full py-3 rounded-lg bg-gradient-to-r ${model.color} text-white font-bold hover:opacity-90 transition-all flex items-center justify-center space-x-2`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    <span>Invest Now</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
          </div>
        </div>
      </div>

      {/* Insufficient Balance Modal */}
      {showInsufficientModal && selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Insufficient Balance</h3>
              <p className="text-gray-600 text-sm">You don't have enough balance to invest in this plan.</p>
            </div>

            {/* Plan Details */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-gray-800 mb-3">Plan Details:</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Plan:</span>
                  <span className="font-medium">{selectedPlan.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Investment Amount:</span>
                  <span className="font-medium text-red-600">{selectedPlan.investAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Your Balance:</span>
                  <span className="font-medium text-green-600">Rs{userBalance.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shortfall:</span>
                  <span className="font-medium text-red-600">
                    Rs{(parseInvestmentAmount(selectedPlan.investAmount) - userBalance).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowInsufficientModal(false)
                  setSelectedPlan(null)
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowInsufficientModal(false)
                  setSelectedPlan(null)
                  window.location.href = '/'
                }}
                className="flex-1 bg-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
              >
                Recharge Now
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes scroll-ribbon {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        
        .animate-scroll-ribbon {
          animation: scroll-ribbon 5s linear infinite;
        }
      `}</style>
    </>
  )
}
