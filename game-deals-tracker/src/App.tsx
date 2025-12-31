import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { WishlistProvider } from '@/contexts/WishlistContext';
import { UserPreferencesProvider } from '@/contexts/UserPreferencesContext';
import { Layout } from '@/components/layout';
import { HomePage, SearchPage, WishlistPage, LoginPage, RegisterPage, SettingsPage } from '@/pages';

function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <UserPreferencesProvider>
          <WishlistProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Layout />}>
                  <Route index element={<HomePage />} />
                  <Route path="search" element={<SearchPage />} />
                  <Route path="wishlist" element={<WishlistPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="login" element={<LoginPage />} />
                  <Route path="register" element={<RegisterPage />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </WishlistProvider>
        </UserPreferencesProvider>
      </AuthProvider>
    </SettingsProvider>
  );
}

export default App;
