import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Input, Button } from '@/components/ui';
import { Settings, Mail, Bell, LogIn, Globe, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

export function SettingsPage() {
  const { user } = useAuth();
  const { language, setLanguage, currency, setCurrency, t } = useSettings();
  const [notificationEmail, setNotificationEmail] = useState(user?.notificationEmail || '');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'never'>(user?.notificationFrequency || 'weekly');
  const [saving, setSaving] = useState(false);

  const frequencyLabels = {
    daily: t.settings.daily,
    weekly: t.settings.weekly,
    never: t.settings.never
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
    // TODO: Implement save to Firestore
    await new Promise(resolve => setTimeout(resolve, 1000));
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
