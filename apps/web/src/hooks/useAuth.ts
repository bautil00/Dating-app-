import { useState, useEffect } from 'react'
import { authService } from '../services/api'

export function useAuth() {
  const [user, setUser] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      authService.getMe()
        .then(res => setUser(res.data))
        .catch(() => localStorage.removeItem('token'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    const res = await authService.login(email, password)
    localStorage.setItem('token', res.data.access_token)
    const userRes = await authService.getMe()
    setUser(userRes.data)
    return res.data
  }

  const register = async (email: string, password: string) => {
    const res = await authService.register(email, password)
    return res.data
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  return { user, loading, login, register, logout }
}
