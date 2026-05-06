import { useEffect } from 'react'
import { useLocation } from 'wouter'
import { setAuthToken } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2 } from 'lucide-react'

export function AuthCallback() {
  const [, setLocation] = useLocation()
  const { refreshUser } = useAuth()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const isNew = params.get('new') === '1'

    if (!token) {
      setLocation('/auth?error=google_failed')
      return
    }

    setAuthToken(token)
    refreshUser().then(() => {
      setLocation(isNew ? '/onboarding' : '/dashboard')
    }).catch(() => {
      setLocation('/auth?error=google_failed')
    })
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
        <p className="text-muted-foreground">Signing you in...</p>
      </div>
    </div>
  )
}
