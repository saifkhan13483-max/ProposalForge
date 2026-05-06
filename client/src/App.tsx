import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Route, Switch, Redirect } from 'wouter'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { Toaster } from '@/components/ui/toaster'
import { Layout } from '@/components/Layout'
import { Landing } from '@/pages/Landing'
import { Auth } from '@/pages/Auth'
import { AuthCallback } from '@/pages/AuthCallback'
import { Onboarding } from '@/pages/Onboarding'
import { ForgotPassword } from '@/pages/ForgotPassword'
import { ResetPassword } from '@/pages/ResetPassword'
import { Dashboard } from '@/pages/Dashboard'
import { Proposals } from '@/pages/Proposals'
import { NewProposal } from '@/pages/NewProposal'
import { ProposalDetail } from '@/pages/ProposalDetail'
import { Invoices } from '@/pages/Invoices'
import { InvoiceDetail } from '@/pages/InvoiceDetail'
import { Clients } from '@/pages/Clients'
import { Settings } from '@/pages/Settings'
import { PublicProposal } from '@/pages/PublicProposal'
import { Demo } from '@/pages/Demo'
import { Loader2 } from 'lucide-react'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
})

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }
  if (!user) return <Redirect to="/auth" />
  return <Layout>{children}</Layout>
}

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/">
        {user ? <Redirect to="/dashboard" /> : <Landing />}
      </Route>
      <Route path="/auth">
        {user ? <Redirect to="/dashboard" /> : <Auth />}
      </Route>
      <Route path="/auth/callback">
        <AuthCallback />
      </Route>
      <Route path="/onboarding">
        {!user ? <Redirect to="/auth" /> : <Onboarding />}
      </Route>
      <Route path="/demo">
        <Demo />
      </Route>
      <Route path="/forgot-password">
        <ForgotPassword />
      </Route>
      <Route path="/reset-password">
        <ResetPassword />
      </Route>
      <Route path="/proposal/:token">
        <PublicProposal />
      </Route>

      {/* Protected routes */}
      <Route path="/dashboard">
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      </Route>
      <Route path="/proposals/new">
        <ProtectedRoute><NewProposal /></ProtectedRoute>
      </Route>
      <Route path="/proposals/:id">
        <ProtectedRoute><ProposalDetail /></ProtectedRoute>
      </Route>
      <Route path="/proposals">
        <ProtectedRoute><Proposals /></ProtectedRoute>
      </Route>
      <Route path="/invoices/:id">
        <ProtectedRoute><InvoiceDetail /></ProtectedRoute>
      </Route>
      <Route path="/invoices">
        <ProtectedRoute><Invoices /></ProtectedRoute>
      </Route>
      <Route path="/clients">
        <ProtectedRoute><Clients /></ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute><Settings /></ProtectedRoute>
      </Route>

      {/* Default redirect */}
      <Route>
        {user ? <Redirect to="/dashboard" /> : <Redirect to="/" />}
      </Route>
    </Switch>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppRoutes />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  )
}
