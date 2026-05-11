import { useEffect } from 'react'
import { useLocation } from 'wouter'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2 } from 'lucide-react'

// This page is kept for backward compatibility but Firebase auth no longer
// uses server-side redirects. The AuthContext handles sign-in state automatically.
export function AuthCallback() {
  const [, setLocation] = useLocation()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      if (user) {
        setLocation(user.onboarding_completed ? '/dashboard' : '/onboarding')
      } else {
        setLocation('/auth')
      }
    }
  }, [user, loading])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
        <p className="text-muted-foreground">Signing you in...</p>
      </div>
    </div>
  )
}
