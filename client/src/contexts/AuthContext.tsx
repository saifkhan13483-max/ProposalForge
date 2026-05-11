import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react'
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth'
import { auth, firebaseSignOut, getFirebaseIdToken } from '@/lib/firebase'

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
  onboarding_completed: boolean
}

interface AuthContextType {
  user: User | null
  firebaseUser: FirebaseUser | null
  loading: boolean
  authError: string | null
  clearAuthError: () => void
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

async function syncWithBackend(firebaseUser: FirebaseUser): Promise<{ user: User; isNew: boolean }> {
  const idToken = await firebaseUser.getIdToken()
  const res = await fetch('/api/auth/firebase-login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
  })

  const contentType = res.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    throw new Error('Cannot reach the server. Please try again later.')
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Auth failed' }))
    throw new Error(err.error || 'Failed to authenticate with backend')
  }
  return res.json()
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)
  const signingOut = useRef(false)

  function clearAuthError() {
    setAuthError(null)
  }

  async function refreshUser() {
    const fbUser = auth.currentUser
    if (!fbUser) {
      setUser(null)
      return
    }
    try {
      const idToken = await fbUser.getIdToken(true)
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${idToken}` },
      })
      if (!res.ok) throw new Error('Failed to refresh user')
      const data = await res.json()
      setUser(data.user)
    } catch {
      setUser(null)
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (signingOut.current) return

      setFirebaseUser(fbUser)
      if (fbUser) {
        try {
          const { user: appUser } = await syncWithBackend(fbUser)
          setAuthError(null)
          setUser(appUser)
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Sign-in failed. Please try again.'
          setAuthError(message)
          setUser(null)
          // Sign out from Firebase so the user can try again cleanly
          signingOut.current = true
          await firebaseSignOut().catch(() => {})
          setFirebaseUser(null)
          signingOut.current = false
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  async function logout() {
    signingOut.current = true
    await firebaseSignOut()
    setUser(null)
    setFirebaseUser(null)
    setAuthError(null)
    signingOut.current = false
  }

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, authError, clearAuthError, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
