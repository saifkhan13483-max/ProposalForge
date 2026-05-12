import { Link, useLocation } from 'wouter'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import {
  LayoutDashboard, FileText, Receipt, Users, Settings, LogOut, ChevronDown,
  Menu, X, Crown, BarChart3
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/proposals', label: 'Proposals', icon: FileText },
  { href: '/invoices', label: 'Invoices', icon: Receipt },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
]

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const [location] = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-40 w-60 flex-col bg-sidebar flex transition-transform duration-200',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-sidebar-border">
          <img src="/logo.png" alt="ProposalForge" className="h-8 w-8 object-contain shrink-0" />
          <span className="font-bold text-sidebar-foreground text-lg tracking-tight" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>
            ProposalForge
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = location === href || location.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  active
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
                data-testid={`nav-${label.toLowerCase()}`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Upgrade banner for free users */}
        {user?.plan === 'free' && (
          <div className="mx-3 mb-3 p-3 rounded-lg bg-gradient-to-br from-primary/20 to-purple-600/20 border border-primary/20">
            <div className="flex items-center gap-2 mb-1.5">
              <Crown className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold text-sidebar-foreground">Upgrade to Pro</span>
            </div>
            <p className="text-xs text-sidebar-foreground/70 mb-2">
              {user.proposals_this_month}/3 proposals used
            </p>
            <Link href="/settings" className="text-xs font-medium text-primary hover:underline">
              Upgrade now →
            </Link>
          </div>
        )}

        {/* User menu */}
        <div className="p-3 border-t border-sidebar-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                data-testid="user-menu-trigger"
                className="flex items-center gap-3 w-full px-2 py-2 rounded-lg hover:bg-sidebar-accent transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                  {user?.email?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-xs font-medium text-sidebar-foreground truncate">
                    {user?.business_name || user?.email}
                  </p>
                  <p className="text-xs text-sidebar-foreground/50 capitalize">{user?.plan} plan</p>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-sidebar-foreground/50 shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-52" align="end" side="top">
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
                  <Settings className="h-4 w-4" /> Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                <LogOut className="h-4 w-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-60 overflow-hidden">
        {/* Mobile header */}
        <header className="flex items-center justify-between h-14 px-4 border-b bg-background lg:hidden shrink-0">
          <button onClick={() => setMobileOpen(true)} className="p-2 hover:bg-accent rounded-lg">
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-bold" style={{ fontFamily: 'Bricolage Grotesque, sans-serif' }}>ProposalForge</span>
          {mobileOpen && (
            <button onClick={() => setMobileOpen(false)} className="p-2 hover:bg-accent rounded-lg">
              <X className="h-5 w-5" />
            </button>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
