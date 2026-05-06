import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Route, Switch, Redirect } from 'wouter'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { Toaster } from '@/components/ui/toaster'
import { Layout } from '@/components/Layout'
import { Auth } from '@/pages/Auth'
import { Dashboard } from '@/pages/Dashboard'
import { Proposals } from '@/pages/Proposals'
import { NewProposal } from '@/pages/NewProposal'
import { ProposalDetail } from '@/pages/ProposalDetail'
import { Invoices } from '@/pages/Invoices'
import { InvoiceDetail } from '@/pages/InvoiceDetail'
import { Clients } from '@/pages/Clients'
import { Settings } from '@/pages/Settings'
import { PublicProposal } from '@/pages/PublicProposal'
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
      <Route path="/auth">
        {user ? <Redirect to="/dashboard" /> : <Auth />}
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
      <Route path="/">
        {user ? <Redirect to="/dashboard" /> : <Redirect to="/auth" />}
      </Route>
      <Route>
        {user ? <Redirect to="/dashboard" /> : <Redirect to="/auth" />}
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
