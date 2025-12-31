import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Input, Button } from '@/components/ui';
import { Settings, Mail, Bell, LogIn, Globe, DollarSign, Store, Filter, RotateCcw, Save, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getStores } from '@/services/cheapshark';
import type { Store as StoreType } from '@/types';

export function SettingsPage() {
  const { user } = useAuth();
  const { language, setLanguage, currency, setCurrency, t } = useSettings();
  const { preferences, updatePreferences, resetPreferences, loading: prefsLoading } = useUserPreferences();
  
  const [notificationEmail, setNotificationEmail] = useState(user?.notificationEmail || '');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'never'>(user?.notificationFrequency || 'weekly');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  // Store preferences
  const [stores, setStores] = useState<StoreType[]>([]);
  const [loadingStores, setLoadingStores] = useState(true);
  const [selectedStores, setSelectedStores] = useState<string[]>(preferences.favoriteStores);
  const [minPrice, setMinPrice] = useState<string>(preferences.minPrice?.toString() || '');
  const [maxPrice, setMaxPrice] = useState<string>(preferences.maxPrice?.toString() || '');
  const [sortBy, setSortBy] = useState(preferences.sortBy);

  const frequencyLabels = {
    daily: t.settings.daily,
    weekly: t.settings.weekly,
    never: t.settings.never
  };

  const sortOptions = [
    { value: 'Deal Rating', label: language === 'es' ? 'Mejor oferta' : 'Best Deal' },
    { value: 'Price', label: language === 'es' ? 'Precio' : 'Price' },
    { value: 'Savings', label: language === 'es' ? 'Descuento' : 'Discount' },
    { value: 'Title', label: language === 'es' ? 'Título' : 'Title' },
    { value: 'recent', label: language === 'es' ? 'Más recientes' : 'Most Recent' },
  ];

  // Load stores
  useEffect(() => {
    const loadStores = async () => {
      try {
        const storeList = await getStores();
        setStores(storeList);
      } catch (error) {
        console.error('Error loading stores:', error);
      } finally {
        setLoadingStores(false);
      }
    };
    loadStores();
  }, []);

  // Sync with preferences when loaded
  useEffect(() => {
    if (!prefsLoading) {
      setSelectedStores(preferences.favoriteStores);
      setMinPrice(preferences.minPrice?.toString() || '');
      setMaxPrice(preferences.maxPrice?.toString() || '');
      setSortBy(preferences.sortBy);
    }
  }, [preferences, prefsLoading]);

  const handleStoreToggle = (storeID: string) => {
    setSelectedStores(prev =>
      prev.includes(storeID)
        ? prev.filter(id => id !== storeID)
        : [...prev, storeID]
    );
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    await updatePreferences({
      favoriteStores: selectedStores,
      minPrice: minPrice ? parseFloat(minPrice) : null,
      maxPrice: maxPrice ? parseFloat(maxPrice) : null,
      sortBy,
      preferredCurrency: currency,
      preferredLanguage: language,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleResetPreferences = async () => {
    await resetPreferences();
    setSelectedStores([]);
    setMinPrice('');
    setMaxPrice('');
    setSortBy('Deal Rating');
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-[hsl(var(--primary))]/10 flex items-center justify-center mb-4">
              <LogIn className="h-6 w-6 text-[hsl(var(--primary))]" />
            </div>
            <CardTitle>{t.settings.loginRequired}</CardTitle>
            <CardDescription>
              {t.settings.loginDescription}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2 justify-center">
            <Link to="/login">
              <Button variant="primary">{t.common.login}</Button>
            </Link>
            <Link to="/register">
              <Button variant="outline">{t.common.register}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    await handleSavePreferences();
    setSaving(false);
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Settings className="h-8 w-8 text-[hsl(var(--primary))]" />
          {t.settings.title}
        </h1>
        <p className="text-[hsl(var(--muted-foreground))]">
          {t.settings.subtitle}
        </p>
      </div>

      {/* Language & Currency Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {t.settings.preferences}
          </CardTitle>
          <CardDescription>
            {t.settings.preferencesDescription}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t.settings.language}</label>
            <div className="flex flex-wrap gap-2">
              {(['es', 'en'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${language === lang
                      ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                      : 'bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] hover:bg-[hsl(var(--accent))]'
                    }
                  `}
                >
                  {lang === 'es' ? '🇪🇸 Español' : '🇬🇧 English'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              {t.settings.currency}
            </label>
            <div className="flex flex-wrap gap-2">
              {(['EUR', 'USD'] as const).map((curr) => (
                <button
                  key={curr}
                  onClick={() => setCurrency(curr)}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${currency === curr
                      ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                      : 'bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] hover:bg-[hsl(var(--accent))]'
                    }
                  `}
                >
                  {curr === 'EUR' ? '€ Euro' : '$ USD'}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Favorite Stores Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Store className="h-5 w-5" />
            {language === 'es' ? 'Tiendas Favoritas' : 'Favorite Stores'}
          </CardTitle>
          <CardDescription>
            {language === 'es' 
              ? 'Selecciona tus tiendas preferidas para filtrar ofertas automáticamente'
              : 'Select your preferred stores to automatically filter deals'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingStores ? (
            <div className="text-sm text-[hsl(var(--muted-foreground))]">
              {language === 'es' ? 'Cargando tiendas...' : 'Loading stores...'}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {stores.map((store) => (
                <button
                  key={store.storeID}
                  onClick={() => handleStoreToggle(store.storeID)}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors
                    ${selectedStores.includes(store.storeID)
                      ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                      : 'bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] hover:bg-[hsl(var(--accent))]'
                    }
                  `}
                >
                  <img
                    src={`https://www.cheapshark.com${store.images.icon}`}
                    alt={store.storeName}
                    className="w-4 h-4"
                  />
                  {store.storeName}
                </button>
              ))}
            </div>
          )}
          {selectedStores.length > 0 && (
            <p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">
              {selectedStores.length} {language === 'es' ? 'tiendas seleccionadas' : 'stores selected'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Price & Sort Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {language === 'es' ? 'Filtros por Defecto' : 'Default Filters'}
          </CardTitle>
          <CardDescription>
            {language === 'es' 
              ? 'Configura tus filtros predeterminados para las ofertas'
              : 'Configure your default filters for deals'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {language === 'es' ? 'Precio Mínimo' : 'Min Price'}
              </label>
              <Input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder={currency === 'EUR' ? '€0' : '$0'}
                min="0"
                step="1"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {language === 'es' ? 'Precio Máximo' : 'Max Price'}
              </label>
              <Input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder={currency === 'EUR' ? '€50' : '$50'}
                min="0"
                step="1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              {language === 'es' ? 'Ordenar por' : 'Sort by'}
            </label>
            <div className="flex flex-wrap gap-2">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSortBy(option.value)}
                  className={`
                    px-3 py-2 rounded-lg text-sm transition-colors
                    ${sortBy === option.value
                      ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                      : 'bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] hover:bg-[hsl(var(--accent))]'
                    }
                  `}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button 
              onClick={handleSavePreferences} 
              isLoading={saving}
              className="gap-2"
            >
              {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              {saved 
                ? (language === 'es' ? '¡Guardado!' : 'Saved!') 
                : (language === 'es' ? 'Guardar Preferencias' : 'Save Preferences')
              }
            </Button>
            <Button 
              variant="outline" 
              onClick={handleResetPreferences}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              {language === 'es' ? 'Restablecer' : 'Reset'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t.settings.profile}</CardTitle>
          <CardDescription>{t.settings.profileDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-[hsl(var(--muted-foreground))]">{t.settings.displayName}</label>
            <p className="text-lg">{user.displayName || t.settings.notSet}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-[hsl(var(--muted-foreground))]">{t.settings.email}</label>
            <p className="text-lg">{user.email}</p>
          </div>
        </CardContent>
      </Card>

      {/* Notifications Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {t.settings.notifications}
          </CardTitle>
          <CardDescription>
            {t.settings.notificationsDescription}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Mail className="h-4 w-4" />
              {t.settings.notificationEmail}
            </label>
            <Input
              type="email"
              value={notificationEmail}
              onChange={(e) => setNotificationEmail(e.target.value)}
              placeholder={t.settings.emailPlaceholder}
            />
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              {t.settings.emailDescription}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t.settings.frequency}</label>
            <div className="flex flex-wrap gap-2">
              {(['daily', 'weekly', 'never'] as const).map((freq) => (
                <button
                  key={freq}
                  onClick={() => setFrequency(freq)}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${frequency === freq
                      ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                      : 'bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] hover:bg-[hsl(var(--accent))]'
                    }
                  `}
                >
                  {frequencyLabels[freq]}
                </button>
              ))}
            </div>
            <p className="text-xs text-[hsl(var(--muted-foreground))]">
              {t.settings.frequencyDescription}
            </p>
          </div>

          <Button onClick={handleSave} isLoading={saving}>
            {t.common.save}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
