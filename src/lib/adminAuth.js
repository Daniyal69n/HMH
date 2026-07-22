export const ADMIN_CREDENTIALS = {
  username: 'HafizHaseeb',
  password: 'haseeb@4563',
}

export function validateAdminLogin(username, password) {
  return (
    username === ADMIN_CREDENTIALS.username &&
    password === ADMIN_CREDENTIALS.password
  )
}

export function setAdminSession(username) {
  if (typeof window === 'undefined') return
  sessionStorage.setItem('isAdminLoggedIn', 'true')
  sessionStorage.setItem(
    'adminData',
    JSON.stringify({
      username,
      role: 'admin',
      loginTime: new Date().toISOString(),
    })
  )
}

export function clearAdminSession() {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem('isAdminLoggedIn')
  sessionStorage.removeItem('adminData')
}

export function isAdminSessionActive() {
  return (
    typeof window !== 'undefined' &&
    sessionStorage.getItem('isAdminLoggedIn') === 'true'
  )
}
