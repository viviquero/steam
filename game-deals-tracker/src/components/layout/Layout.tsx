import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { useSettings } from '@/contexts/SettingsContext';

export function Layout() {
  const { t } = useSettings();
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Outlet />
        </div>
      </main>
      <footer className="border-t border-[hsl(var(--border))] py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-[hsl(var(--muted-foreground))]">
            KeroDeals © {new Date().getFullYear()} — {t.footer.poweredBy}{' '}
            <a 
              href="https://www.cheapshark.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[hsl(var(--primary))] hover:underline"
            >
              CheapShark API
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
