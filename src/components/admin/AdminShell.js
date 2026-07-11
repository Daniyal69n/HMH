'use client'

import { useState } from 'react'
import styles from './admin.module.css'

export const ADMIN_NAV = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  },
  {
    id: 'users',
    label: 'All Users',
    icon: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM6 20c0-3.5 3-5.5 6-5.5s6 2 6 5.5',
  },
  {
    id: 'withdrawals',
    label: 'Withdrawals',
    icon: 'M3 7h18v10H3zM3 10h18',
  },
  {
    id: 'planRequests',
    label: 'Plan Requests',
    icon: 'M12 3v18M5 8l7-5 7 5',
  },
  {
    id: 'manageAds',
    label: 'Manage Ads',
    icon: 'M8 5v14l11-7z',
  },
  {
    id: 'manageCourses',
    label: 'Manage Courses',
    icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
  },
  {
    id: 'earningsControl',
    label: 'Earnings Control',
    icon: 'M12 8c-2.2 0-4 1.8-4 4s1.8 4 4 4 4-1.8 4-4-1.8-4-4-4zM4 20c0-4 4-6 8-6s8 2 8 6',
  },
  {
    id: 'mysteryBoxes',
    label: 'Mystery Boxes',
    icon: 'M4 7h16v13H4zM4 7l2-4h12l2 4M12 11v5',
  },
  {
    id: 'ecommerce',
    label: 'E-Commerce',
    icon: 'M4 8h16l-1.5 11h-13zM8 8V6a4 4 0 0 1 8 0v2',
  },
]

export default function AdminShell({
  activeTab,
  setActiveTab,
  onLogout,
  children,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pageTitle =
    ADMIN_NAV.find((item) => item.id === activeTab)?.label ?? 'Admin'

  const selectTab = (id) => {
    setActiveTab(id)
    setSidebarOpen(false)
  }

  return (
    <div className={styles.adminApp}>
      {sidebarOpen && (
        <button
          type="button"
          className={styles.overlay}
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}
      >
        <div className={styles.sidebarHead}>
          <span className={styles.sidebarTitle}>Admin Panel</span>
          <button
            type="button"
            className={styles.sidebarClose}
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            ×
          </button>
        </div>

        <nav className={styles.nav}>
          {ADMIN_NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`${styles.navItem} ${
                activeTab === item.id ? styles.navItemActive : ''
              }`}
              onClick={() => selectTab(item.id)}
            >
              <svg
                className={styles.navIcon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={item.icon} />
              </svg>
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <button
            type="button"
            className={styles.menuBtn}
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            ☰
          </button>
          <h1 className={styles.topbarTitle}>{pageTitle}</h1>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button 
              type="button" 
              className={styles.logoutBtn}
              style={{ backgroundColor: '#4a5568', borderColor: '#4a5568', marginRight: '4px' }}
              onClick={() => {
                sessionStorage.clear()
                localStorage.clear()
                window.location.reload()
              }}
            >
              Clear Cache
            </button>
            <button type="button" className={styles.logoutBtn} onClick={onLogout}>
              Logout
            </button>
          </div>
        </header>

        <div className={styles.content}>{children}</div>
      </div>
    </div>
  )
}
