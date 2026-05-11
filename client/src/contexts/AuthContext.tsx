import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react'
import { onAuthStateChanged, type User as FirebaseUser } from 'firebase/auth'
import { auth, firebaseSignOut, getFirebaseIdToken } from '@/lib/firebase'
import { BASE_URL } from '@/lib/api'

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
  const endpoint = `${BASE_URL}/auth/firebase-login`
  const isUnconfigured = BASE_URL === '/api'

  let res: Response
  try {
    res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
    })
  } catch {
    // fetch() itself threw — CORS preflight blocked, network error, or server unreachable
    throw new Error(
      isUnconfigured
        ? 'Backend URL is not configured. Set VITE_API_URL in Vercel → Project Settings → Environment Variables (pointing to your Railway URL), then redeploy.'
        : `Cannot reach the backend at ${endpoint}. Check that your Railway service is running and the URL is correct.`
    )
  }

  const contentType = res.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    // Got a response but it's HTML — wrong URL, server down, or CORS preflight rejected
    throw new Error(
      isUnconfigured
        ? 'Backend URL is not configured. Add VITE_API_URL in Vercel → Project Settings → Environment Variables (your Railway URL), then trigger a redeploy.'
        : `Unexpected response (HTTP ${res.status}) from ${endpoint}. Check Railway logs — the server may be crashing on startup or the URL is wrong.`
    )
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Auth failed' }))
    if (res.status === 503) {
      throw new Error(
        'The server authentication service is not configured correctly. ' +
        'Please contact the site administrator to check FIREBASE_SERVICE_ACCOUNT_JSON.'
      )
    }
    if (res.status === 401) {
      throw new Error('Authentication failed. Please sign in again.')
    }
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
      const res = await fetch(`${BASE_URL}/auth/me`, {
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
