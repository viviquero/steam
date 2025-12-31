import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Input, Button } from '@/components/ui';
import { Gamepad2, Mail, Lock, AlertCircle } from 'lucide-react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { login } = useAuth();
  const { t } = useSettings();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError(t.login.fillAllFields);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : t.login.error);
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
          <CardTitle className="text-2xl">{t.login.title}</CardTitle>
          <CardDescription>
            {t.login.subtitle}
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
            
            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                <Input
                  type="email"
                  placeholder={t.login.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                <Input
                  type="password"
                  placeholder={t.login.passwordPlaceholder}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  disabled={loading}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" isLoading={loading}>
              {t.login.signIn}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-[hsl(var(--muted-foreground))]">{t.login.noAccount} </span>
            <Link to="/register" className="text-[hsl(var(--primary))] hover:underline font-medium">
              {t.login.signUp}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
