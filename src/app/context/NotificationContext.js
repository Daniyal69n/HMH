'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import Notification from '../components/Notification'

const NotificationContext = createContext()

export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([])

  const showNotification = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random()
    const newNotification = { id, message, type, duration }
    
    setNotifications(prev => [...prev, newNotification])
    
    return id
  }, [])

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }, [])

  const showSuccess = useCallback((message, duration = 5000) => {
    return showNotification(message, 'success', duration)
  }, [showNotification])

  const showError = useCallback((message, duration = 5000) => {
    return showNotification(message, 'error', duration)
  }, [showNotification])

  const showWarning = useCallback((message, duration = 5000) => {
    return showNotification(message, 'warning', duration)
  }, [showNotification])

  const showInfo = useCallback((message, duration = 5000) => {
    return showNotification(message, 'info', duration)
  }, [showNotification])

  const value = {
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeNotification
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <Notification
            key={notification.id}
            message={notification.message}
            type={notification.type}
            duration={notification.duration}
            onClose={() => removeNotification(notification.id)}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  )
} 