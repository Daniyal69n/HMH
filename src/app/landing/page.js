'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const PLAN_DATA = [
  {
    name: 'Basic',
    icon: '🟢',
    usd: '$5',
    pkr: 'Rs 1,500',
    tagline: 'Perfect for Beginners',
    badge: null,
    isPopular: false,
    color: '#4fae82',
    features: [
      'Daily Earning',
      'Direct commission',
      'Referral Rewards',
      'Fast Withdrawal',
      '24/7 Support'
    ]
  },
  {
    name: 'Standard',
    icon: '🔵',
    usd: '$10',
    pkr: 'Rs 3,000',
    tagline: 'Best for Regular Earners',
    badge: 'Most popular',
    isPopular: true,
    color: '#5b7fd6',
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
    name: 'Diamond',
    icon: '💎',
    usd: '$20',
    pkr: 'Rs 6,000',
    tagline: 'Grow Your Income Faster',
    badge: null,
    isPopular: false,
    color: '#a259d6',
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
    name: 'Pro',
    icon: '🟣',
    usd: '$30',
    pkr: 'Rs 9,000',
    tagline: 'For Serious Earners',
    badge: null,
    isPopular: false,
    color: '#c9a04a',
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
    name: 'Premium',
    icon: '👑',
    usd: '$40',
    pkr: 'Rs 12,000',
    tagline: 'Maximum Value & Benefits',
    badge: null,
    isPopular: false,
    color: '#c4574a',
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
    name: 'Legend',
    icon: '🌟',
    usd: '$50',
    pkr: 'Rs 15,000',
    tagline: 'Ultimate Membership Experience',
    badge: null,
    isPopular: false,
    color: '#e2b968',
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
]

export default function LandingPage() {
  const router = useRouter()
  const [currency, setCurrency] = useState('PKR')
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleGetStarted = (planName) => {
    router.push(`/register?plan=${encodeURIComponent(planName)}`)
  }

  return (
    <div className="meridian" style={{ minHeight: '100vh', background: 'radial-gradient(1200px 600px at 15% -10%, rgba(201,160,74,0.08), transparent 60%), #0b0d12' }}>
      
      {/* ── Top Navigation Bar ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: scrolled ? 'rgba(11, 13, 18, 0.92)' : 'rgba(11, 13, 18, 0.6)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-soft)',
        padding: '0 5%',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: '68px',
        transition: 'all 0.3s ease'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img
            src="/logo.jpg"
            alt="HMHPro Logo"
            style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid var(--gold)' }}
          />
          <div>
            <div style={{ fontWeight: 700, fontSize: '18px', color: 'var(--gold-bright)', lineHeight: 1.1 }}>HMHPro</div>
            <div style={{ fontSize: '11px', color: 'var(--text-faint)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Earning Platform</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            onClick={() => setCurrency(c => c === 'PKR' ? 'USD' : 'PKR')}
            style={{
              background: 'rgba(201,160,74,0.12)',
              border: '1px solid rgba(201,160,74,0.3)',
              color: 'var(--gold-bright)',
              borderRadius: '8px',
              padding: '6px 14px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <span>{currency === 'PKR' ? '🇵🇰 PKR' : '💵 USD'}</span>
          </button>

          <Link
            href="/login"
            style={{
              padding: '8px 18px', borderRadius: '8px',
              border: '1px solid var(--border)', color: 'var(--text)',
              fontSize: '14px', fontWeight: 600, textDecoration: 'none'
            }}
          >
            Sign In
          </Link>

          <Link
            href="/register"
            style={{
              padding: '8px 22px', borderRadius: '8px',
              background: 'linear-gradient(135deg, var(--gold), var(--gold-bright))',
              color: '#0b0d12', fontSize: '14px', fontWeight: 700, textDecoration: 'none',
              boxShadow: '0 4px 16px rgba(201,160,74,0.3)'
            }}
          >
            Register
          </Link>
        </div>
      </nav>

      {/* ── Main Hero Section ── */}
      <section style={{ textAlign: 'center', padding: '70px 5% 40px', maxWidth: '980px', margin: '0 auto' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: 'rgba(201,160,74,0.1)', border: '1px solid rgba(201,160,74,0.3)',
          borderRadius: '100px', padding: '6px 18px', marginBottom: '24px',
          fontSize: '13.5px', color: 'var(--gold)', fontWeight: 600
        }}>
          🏆 Number #1 Earning Platform in Pakistan
        </div>

        <h1 style={{
          fontSize: 'clamp(32px, 5.5vw, 58px)', fontWeight: 800, lineHeight: 1.15,
          color: '#ffffff',
          margin: '0 0 18px',
          fontFamily: 'var(--font-fraunces, serif)'
        }}>
          Choose the plan that&apos;s right for you.
        </h1>

        <p style={{
          color: 'var(--text-dim)', fontSize: 'clamp(14.5px, 2vw, 17px)', lineHeight: 1.6,
          maxWidth: '780px', margin: '0 auto 36px'
        }}>
          Number #1 earning platform in the pakistan last 3 years and gain a trust of milions clients. Select the plan and earn according to your plan.
        </p>
      </section>

      {/* ── Plans Grid (Matching User Theme) ── */}
      <section id="plans" style={{ padding: '20px 5% 80px', maxWidth: '1240px', margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '24px'
        }}>
          {PLAN_DATA.map((plan) => {
            const priceDisplay = currency === 'USD' ? plan.usd : plan.pkr

            return (
              <div
                key={plan.name}
                style={{
                  background: 'var(--surface)',
                  border: plan.isPopular ? '1.5px solid rgba(201,160,74,0.5)' : '1px solid var(--border)',
                  borderRadius: '18px',
                  padding: '30px 24px',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: plan.isPopular ? '0 8px 32px rgba(201,160,74,0.12)' : '0 4px 20px rgba(0,0,0,0.25)',
                  transition: 'all 0.25s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.borderColor = 'var(--gold)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.borderColor = plan.isPopular ? 'rgba(201,160,74,0.5)' : 'var(--border)'
                }}
              >
                {/* Popular Badge */}
                {plan.badge && (
                  <div style={{
                    position: 'absolute', top: '-13px', left: '50%', transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg, var(--gold), var(--gold-bright))',
                    color: '#0b0d12',
                    padding: '4px 16px', borderRadius: '100px',
                    fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap',
                    boxShadow: '0 4px 12px rgba(201,160,74,0.4)'
                  }}>
                    {plan.badge}
                  </div>
                )}

                {/* Plan Icon Header */}
                <div style={{ textAlign: 'center', marginBottom: '14px' }}>
                  <div style={{ fontSize: '36px', marginBottom: '6px' }}>{plan.icon}</div>
                  <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: 'var(--text)' }}>
                    {plan.name}
                  </h3>
                </div>

                {/* Price Display */}
                <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                  <span style={{
                    fontSize: '36px',
                    fontWeight: 800,
                    color: plan.isPopular ? 'var(--gold-bright)' : 'var(--gold)',
                    fontFamily: 'monospace'
                  }}>
                    {priceDisplay}
                  </span>
                  <span style={{ fontSize: '13px', color: 'var(--text-faint)', marginLeft: '6px' }}>one-time</span>
                </div>

                {/* Tagline */}
                <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '13px', marginBottom: '22px' }}>
                  {plan.tagline}
                </div>

                {/* Divider */}
                <div style={{ height: '1px', background: 'var(--border-soft)', marginBottom: '20px' }} />

                {/* Features List */}
                <div style={{ flex: 1, marginBottom: '26px' }}>
                  {plan.features.map((feat, fi) => (
                    <div key={fi} style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '7px 0',
                      fontSize: '13.5px', color: 'var(--text-dim)'
                    }}>
                      <div style={{
                        width: '18px', height: '18px', borderRadius: '4px',
                        background: 'rgba(79, 174, 130, 0.15)',
                        border: '1px solid rgba(79, 174, 130, 0.4)',
                        color: 'var(--green)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '11px', flexShrink: 0, fontWeight: 'bold'
                      }}>
                        ✓
                      </div>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                {/* Get Started Button */}
                <button
                  onClick={() => handleGetStarted(plan.name)}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '10px',
                    border: plan.isPopular ? 'none' : '1px solid var(--border)',
                    background: plan.isPopular
                      ? 'linear-gradient(135deg, var(--gold), var(--gold-bright))'
                      : 'var(--surface-2)',
                    color: plan.isPopular ? '#0b0d12' : 'var(--text)',
                    fontWeight: 700,
                    fontSize: '15px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: plan.isPopular ? '0 4px 18px rgba(201,160,74,0.3)' : 'none'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, var(--gold), var(--gold-bright))'
                    e.currentTarget.style.color = '#0b0d12'
                    e.currentTarget.style.boxShadow = '0 6px 22px rgba(201,160,74,0.4)'
                  }}
                  onMouseLeave={e => {
                    if (!plan.isPopular) {
                      e.currentTarget.style.background = 'var(--surface-2)'
                      e.currentTarget.style.color = 'var(--text)'
                      e.currentTarget.style.boxShadow = 'none'
                    }
                  }}
                >
                  Get Started
                </button>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: '1px solid var(--border-soft)',
        padding: '30px 5%',
        textAlign: 'center',
        color: 'var(--text-faint)',
        fontSize: '13.5px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
          <img src="/logo.jpg" alt="HMHPro" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--gold)' }} />
          <span style={{ fontWeight: 700, color: 'var(--gold-bright)' }}>HMHPro</span>
        </div>
        <div>© {new Date().getFullYear()} HMHPro. All rights reserved. Pakistan&apos;s #1 Earning Platform.</div>
      </footer>

    </div>
  )
}
