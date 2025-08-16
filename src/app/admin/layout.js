'use client'

import { NotificationProvider } from '../context/NotificationContext'

export default function AdminLayout({ children }) {
  return (
    <NotificationProvider>
      {children}
    </NotificationProvider>
  )
} 