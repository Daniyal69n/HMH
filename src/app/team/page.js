'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useNotification } from '../context/NotificationContext'
import { getCurrentUser } from '@/lib/api'

export default function TeamPage() {
  const [activeNav, setActiveNav] = useState('team')
  const router = useRouter()
  const { showSuccess, showError, showWarning, showInfo } = useNotification()
  
  // Team and referral states
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [referralLink, setReferralLink] = useState('')
  const [teamData, setTeamData] = useState({
    teamSize: 0,
    totalDeposit: 0,
    totalWithdraw: 0,
    teamMembers: [],
    levelA: [],
    totalEarnings: {
      levelA: 0,
      total: 0
    }
  })
  const [userData, setUserData] = useState(null)

  // Load user data and team information
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = await getCurrentUser()
        if (user) {
          setUserData(user)
          
          // Generate referral link using short user ID (last 8 chars of _id)
          const shortId = user._id ? user._id.substring(user._id.length - 8) : user.phone
          const baseUrl = window.location.origin
          const userReferralLink = `${baseUrl}/register?ref=${shortId}`
          setReferralLink(userReferralLink)
        }
      } catch (error) {
        console.error('Error loading user data:', error)
      }
    }

    loadUserData()
  }, [])

  // Load team data when userData changes
  useEffect(() => {
    if (userData) {
      loadTeamData()
    }
  }, [userData])

  const loadTeamData = async () => {
    try {
      const timestamp = Date.now(); // Add timestamp to prevent caching
      const response = await fetch(`/api/user/team?userId=${userData.phone}&_t=${timestamp}`)
      if (response.ok) {
        const data = await response.json()
        
        setTeamData({
          teamSize: data.totalMembers,
          totalDeposit: data.totalTeamEarnings,
          totalWithdraw: 0, // This would need to be calculated from transactions
          teamMembers: [...data.levelA.members],
          levelA: data.levelA.members,
          totalEarnings: {
            levelA: data.levelA.members.reduce((sum, member) => {
              const memberTotalActivity = member.balance + member.earnBalance
              return sum + (memberTotalActivity * 0.16)
            }, 0),
            total: data.totalTeamEarnings
          }
        })
      }
    } catch (error) {
      console.error('Error loading team data:', error)
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
        // Already on team
        break
      case 'profile':
        router.push('/profile')
        break
    }
  }

  const handleInviteFriends = () => {
    setShowInviteModal(true)
  }

  const copyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink)
      showSuccess('Referral link copied to clipboard!')
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = referralLink
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      showSuccess('Referral link copied to clipboard!')
    }
  }

  const shareViaWhatsApp = () => {
    const message = `Join me on Neo Earner! Use my referral link: ${referralLink}`
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  const shareViaTelegram = () => {
    const message = `Join me on Neo Earner! Use my referral link: ${referralLink}`
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('Join me on Neo Earner!')}`
    window.open(telegramUrl, '_blank')
  }

  return (
    <div className="w-full min-h-screen ">

      <div className="p-4">
        {/* Page Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-xl p-8 mb-8 hover:shadow-xl transition-all duration-300" style={{ boxShadow: 'rgba(17, 17, 26, 0.1) 0px 4px 16px, rgba(17, 17, 26, 0.1) 0px 8px 24px, rgba(17, 17, 26, 0.1) 0px 16px 56px' }}>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-3">
              Team Overview
            </h1>
            <p className="text-purple-100 text-lg mb-4">
              Build your team and earn together
            </p>
          </div>
        </div>
        
        {/* Team Overview Card */}
      <div className="bg-white rounded-lg p-6 mb-6 relative overflow-hidden" style={{ boxShadow: 'rgba(17, 17, 26, 0.1) 0px 4px 16px, rgba(17, 17, 26, 0.1) 0px 8px 24px, rgba(17, 17, 26, 0.1) 0px 16px 56px' }}>
        <div className="absolute top-0 right-0 w-20 h-20 bg-purple-200 rounded-full -translate-y-10 translate-x-10 opacity-20"></div>
        <div className="relative z-10">
          <div className="flex items-center mb-4">
            <svg className="w-6 h-6 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h2 className="text-xl font-bold text-purple-900">Team Overview</h2>
          </div>
          
          <div className="space-y-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold text-purple-900">{teamData.teamSize}</span>
              <span className="text-sm text-gray-600">Team Size</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold text-purple-900">Rs{teamData.totalDeposit.toFixed(2)}</span>
              <span className="text-sm text-gray-600">Total Deposit</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold text-purple-900">Rs{teamData.totalWithdraw.toFixed(2)}</span>
              <span className="text-sm text-gray-600">Total Withdraw</span>
            </div>
          </div>
          
          <button 
            onClick={handleInviteFriends}
            className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center hover:bg-purple-700 transition-colors"
          >
            <span>Invite Friends</span>
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Team Details Card */}
      <div className="bg-white rounded-lg p-6 relative overflow-hidden" style={{ boxShadow: 'rgba(17, 17, 26, 0.1) 0px 4px 16px, rgba(17, 17, 26, 0.1) 0px 8px 24px, rgba(17, 17, 26, 0.1) 0px 16px 56px' }}>
        <div className="absolute top-0 right-0 w-16 h-16 bg-purple-200 rounded-full -translate-y-8 translate-x-8 opacity-20"></div>
        <div className="relative z-10">
          <div className="flex items-center mb-4">
            <svg className="w-6 h-6 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h2 className="text-xl font-bold text-purple-900">Team Details</h2>
          </div>
          
          {/* Level A - Direct Referrals (16% Commission) */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-purple-900 mb-3 flex items-center">
              <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center mr-2">
                <span className="text-white text-xs font-bold">A</span>
              </div>
              Level A - Direct Referrals (16% Commission)
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="text-sm text-gray-600">Members: {teamData.levelA.length}</span>
                </div>
                <span className="text-sm font-semibold text-green-600">Rs{teamData.totalEarnings.levelA.toFixed(2)}</span>
              </div>
            </div>
          </div>



          {/* Total Earnings */}
          <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <svg className="w-6 h-6 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <span className="text-lg font-bold text-purple-900">Total Team Earnings</span>
              </div>
              <span className="text-xl font-bold text-purple-900">Rs{teamData.totalEarnings.total.toFixed(2)}</span>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-green-700">Available for Withdrawal</span>
                </div>
                <span className="text-sm font-bold text-green-600">Rs{userData?.referralCommission?.toFixed(2) || '0.00'}</span>
              </div>
              <p className="text-xs text-green-600 mt-1">Your team commission is already included in your account balance</p>
            </div>
          </div>


          
          {/* Commission Breakdown */}
          <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <h4 className="text-sm font-medium text-green-800 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Commission Breakdown
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Total Commission Earned</span>
                  <span className="text-sm font-bold text-green-600">Rs{userData?.totalCommissionEarned?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Available Commission</span>
                  <span className="text-sm font-bold text-blue-600">Rs{userData?.referralCommission?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
              <div className="bg-white rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Level A Rate</span>
                  <span className="text-sm font-bold text-purple-600">16%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Commission Type</span>
                  <span className="text-sm font-bold text-purple-600">Direct Only</span>
                </div>
              </div>
            </div>
            <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
              <strong>💡 Note:</strong> Team commission is already included in your account balance. You can withdraw it anytime from your main balance!
            </div>
          </div>

          <button className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 transition-colors">
            Check
          </button>
        </div>
      </div>
    </div>

    {/* Invite Friends Modal */}
    {showInviteModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-6 w-full max-w-md">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Invite Friends</h3>
            <p className="text-gray-600 text-sm">Share your referral link and earn together!</p>
          </div>

          {/* Referral Link */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Your Referral Link</label>
            <div className="flex">
              <input
                type="text"
                value={referralLink}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg bg-gray-50 text-gray-700 text-sm"
                placeholder="Generating referral link..."
              />
              <button
                onClick={copyReferralLink}
                className="px-4 py-2 bg-purple-600 text-white rounded-r-lg hover:bg-purple-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Click the copy button to copy your referral link</p>
          </div>

          {/* Share Options */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Share via:</h4>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={shareViaWhatsApp}
                className="flex items-center justify-center p-3 border border-green-200 rounded-lg hover:bg-green-50 transition-colors"
              >
                <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                </svg>
                <span className="text-sm font-medium text-green-600">WhatsApp</span>
              </button>
              
              <button
                onClick={shareViaTelegram}
                className="flex items-center justify-center p-3 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
                <span className="text-sm font-medium text-blue-600">Telegram</span>
              </button>
            </div>
          </div>

          {/* Team Stats Preview */}
          <div className="mb-6 p-4 bg-purple-50 rounded-lg">
            <h4 className="text-sm font-medium text-purple-800 mb-2">Your Current Team:</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-purple-900">{teamData.teamSize}</div>
                <div className="text-xs text-purple-600">Members</div>
              </div>
              <div>
                <div className="text-lg font-bold text-purple-900">Rs{teamData.totalDeposit.toFixed(2)}</div>
                <div className="text-xs text-purple-600">Deposits</div>
              </div>
              <div>
                <div className="text-lg font-bold text-purple-900">Rs{teamData.totalWithdraw.toFixed(2)}</div>
                <div className="text-xs text-purple-600">Withdraws</div>
              </div>
            </div>
          </div>

          {/* How it works */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-800 mb-2">💡 How it works:</h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Share your referral link with friends</li>
              <li>• When they register using your link, they join your team</li>
              <li>• Track your team's performance and earnings</li>
              <li>• Earn rewards based on your team's activity</li>
            </ul>
          </div>

          <button
            onClick={() => setShowInviteModal(false)}
            className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    )}
     
    </div>
  )
}
