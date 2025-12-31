import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Input, Button } from '@/components/ui';
import { Gamepad2, Mail, Lock, User, AlertCircle } from 'lucide-react';
import { isValidEmail, validatePassword, validateDisplayName, sanitizeString } from '@/utils/validation';

export function RegisterPage() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { register } = useAuth();
  const { t } = useSettings();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!displayName || !email || !password || !confirmPassword) {
      setError(t.register.fillAllFields);
      return;
    }

    // Validate display name
    const nameValidation = validateDisplayName(displayName);
    if (!nameValidation.isValid) {
      setError(nameValidation.error || 'Nombre inválido');
      return;
    }

    // Validate email format
    if (!isValidEmail(email)) {
      setError('Email inválido');
      return;
    }

    if (password !== confirmPassword) {
      setError(t.register.passwordsNoMatch);
      return;
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.errors[0]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const sanitizedName = sanitizeString(displayName);
      await register(email.toLowerCase().trim(), password, sanitizedName);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : t.register.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-[hsl(var(--primary))]/10 flex items-center justify-center mb-4">
            <Gamepad2 className="h-6 w-6 text-[hsl(var(--primary))]" />
          </div>
          <CardTitle className="text-2xl">{t.register.title}</CardTitle>
          <CardDescription>
            {t.register.subtitle}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-[hsl(var(--destructive))]/10 text-[hsl(var(--destructive))]">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}
            
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
              <Input
                type="text"
                placeholder={t.register.namePlaceholder}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="pl-10"
                disabled={loading}
              />
            </div>

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
              <Input
                type="email"
                placeholder={t.register.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                disabled={loading}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
              <Input
                type="password"
                placeholder={t.register.passwordPlaceholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
                disabled={loading}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
              <Input
                type="password"
                placeholder={t.register.confirmPlaceholder}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-10"
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full" isLoading={loading}>
              {t.register.createAccount}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-[hsl(var(--muted-foreground))]">{t.register.hasAccount} </span>
            <Link to="/login" className="text-[hsl(var(--primary))] hover:underline font-medium">
              {t.register.signIn}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
