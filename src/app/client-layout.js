'use client'

import { NotificationProvider } from './context/NotificationContext'

export default function ClientLayout({ children }) {
  return <NotificationProvider>{children}</NotificationProvider>
}
