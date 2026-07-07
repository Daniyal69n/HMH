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
          <button type="button" className={styles.logoutBtn} onClick={onLogout}>
            Logout
          </button>
        </header>

        <div className={styles.content}>{children}</div>
      </div>
    </div>
  )
}
