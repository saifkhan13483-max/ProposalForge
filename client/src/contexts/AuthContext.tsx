import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { api, setAuthToken, clearAuthToken, getAuthToken } from '@/lib/api'

interface User {
  id: string
  email: string
  business_name: string | null
  plan: string
  logo_url: string | null
  accent_color: string
  default_currency: string
  proposals_this_month: number
  invoice_prefix: string
  font_family: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, businessName?: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(getAuthToken)
  const [loading, setLoading] = useState(true)

  async function refreshUser() {
    try {
      const data = await api.get<{ user: User }>('/auth/me')
      setUser(data.user)
    } catch {
      setUser(null)
      clearAuthToken()
      setToken(null)
    }
  }

  useEffect(() => {
    if (token) {
      refreshUser().finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [token])

  async function login(email: string, password: string) {
    const data = await api.post<{ user: User; token: string }>('/auth/login', { email, password })
    setAuthToken(data.token)
    setToken(data.token)
    setUser(data.user)
  }

  async function register(email: string, password: string, businessName?: string) {
    const data = await api.post<{ user: User; token: string }>('/auth/register', { email, password, businessName })
    setAuthToken(data.token)
    setToken(data.token)
    setUser(data.user)
  }

  function logout() {
    clearAuthToken()
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
