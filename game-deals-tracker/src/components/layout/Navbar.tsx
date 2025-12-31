import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { Button } from '@/components/ui';
import { Gamepad2, Search, Heart, Settings, LogOut, User, Menu, X, Sparkles } from 'lucide-react';
import { useState } from 'react';
import logger from '@/utils/logger';

export function Navbar() {
  const { user, logout, isDemo } = useAuth();
  const { t } = useSettings();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: '/', label: t.nav.deals, icon: Gamepad2 },
    { to: '/search', label: t.nav.search, icon: Search },
    { to: '/wishlist', label: t.nav.wishlist, icon: Heart },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      logger.error('Logout error:', error);
    }
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/95 backdrop-blur supports-[backdrop-filter]:bg-[hsl(var(--background))]/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-[hsl(var(--primary))]">
            <Gamepad2 className="h-6 w-6" />
            <span>KeroDeals</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${isActive(to)
                    ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                    : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]'
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                {isDemo && (
                  <div className="flex items-center gap-1 px-2 py-1 rounded bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))] text-xs font-medium">
                    <Sparkles className="h-3 w-3" />
                    {t.common.demo}
                  </div>
                )}
                <Link
                  to="/settings"
                  className={`
                    p-2 rounded-lg transition-colors
                    ${isActive('/settings')
                      ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                      : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]'
                    }
                  `}
                >
                  <Settings className="h-5 w-5" />
                </Link>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[hsl(var(--secondary))]">
                  <User className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                  <span className="text-sm font-medium">{user.displayName || user.email}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout} title={t.nav.logout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">{t.nav.login}</Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">{t.nav.signUp}</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[hsl(var(--border))]">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileMenuOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${isActive(to)
                    ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                    : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]'
                  }
                `}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            ))}
            
            {user ? (
              <>
                <Link
                  to="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${isActive('/settings')
                      ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                      : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]'
                    }
                  `}
                >
                  <Settings className="h-5 w-5" />
                  {t.nav.settings}
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  {t.nav.logout}
                </button>
              </>
            ) : (
              <div className="flex gap-2 pt-2">
                <Link to="/login" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">{t.nav.login}</Button>
                </Link>
                <Link to="/register" className="flex-1" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" className="w-full">{t.nav.signUp}</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
