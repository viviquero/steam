import { useState } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Input, Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui';
import { Mail, Send, Loader2, CheckCircle, AlertCircle, X, FileText } from 'lucide-react';
import { checkAllPrices, generateDealReport, getTargetReachedAlerts } from '@/services/priceChecker';
import { sendDealReportEmail, sendPriceAlertEmail, isEmailConfigured } from '@/services/email';

interface EmailReportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ReportType = 'deals' | 'alerts';
type Status = 'idle' | 'checking' | 'sending' | 'success' | 'error';

export function EmailReportModal({ isOpen, onClose }: EmailReportModalProps) {
  const { language, currency } = useSettings();
  const { items } = useWishlist();
  const { user } = useAuth();
  
  const [email, setEmail] = useState(user?.notificationEmail || user?.email || '');
  const [reportType, setReportType] = useState<ReportType>('deals');
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [message, setMessage] = useState('');

  const texts = {
    es: {
      title: 'Enviar Informe por Email',
      subtitle: 'Recibe un informe de ofertas o alertas de precio',
      email: 'Correo electrónico',
      emailPlaceholder: 'tu@email.com',
      reportType: 'Tipo de informe',
      dealsReport: 'Informe de ofertas',
      dealsDescription: 'Lista de todas las ofertas actuales de tus juegos',
      alertsReport: 'Alertas de precio',
      alertsDescription: 'Solo juegos que alcanzaron tu precio objetivo',
      send: 'Enviar Informe',
      sending: 'Enviando...',
      checking: 'Verificando precios',
      success: '¡Informe enviado!',
      error: 'Error al enviar',
      noGames: 'Añade juegos a tu lista de seguimiento primero',
      noAlerts: 'Ningún juego ha alcanzado tu precio objetivo',
      demoWarning: 'Modo demo: El email se simula, configura EmailJS para enviar emails reales',
      cancel: 'Cancelar',
    },
    en: {
      title: 'Send Email Report',
      subtitle: 'Receive a deals report or price alerts',
      email: 'Email address',
      emailPlaceholder: 'your@email.com',
      reportType: 'Report type',
      dealsReport: 'Deals report',
      dealsDescription: 'List of all current deals on your tracked games',
      alertsReport: 'Price alerts',
      alertsDescription: 'Only games that reached your target price',
      send: 'Send Report',
      sending: 'Sending...',
      checking: 'Checking prices',
      success: 'Report sent!',
      error: 'Failed to send',
      noGames: 'Add games to your wishlist first',
      noAlerts: 'No games have reached your target price',
      demoWarning: 'Demo mode: Email is simulated, configure EmailJS to send real emails',
      cancel: 'Cancel',
    },
  };

  const txt = texts[language];

  const handleSend = async () => {
    if (!email || items.length === 0) return;

    try {
      setStatus('checking');
      setProgress({ current: 0, total: items.length });

      // Check all prices
      const results = await checkAllPrices(items, (current, total) => {
        setProgress({ current, total });
      });

      setStatus('sending');

      let result;
      const userName = user?.displayName || email.split('@')[0];

      if (reportType === 'alerts') {
        // Send price alerts
        const alerts = getTargetReachedAlerts(results);
        
        if (alerts.length === 0) {
          setStatus('error');
          setMessage(txt.noAlerts);
          return;
        }

        result = await sendPriceAlertEmail(email, userName, alerts, language, currency);
      } else {
        // Send deals report
        const report = generateDealReport(results);
        result = await sendDealReportEmail(email, userName, report, language, currency);
      }

      if (result.success) {
        setStatus('success');
        setMessage(result.message);
      } else {
        setStatus('error');
        setMessage(result.message);
      }
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const handleClose = () => {
    setStatus('idle');
    setMessage('');
    setProgress({ current: 0, total: 0 });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md animate-in fade-in zoom-in duration-200">
        <CardHeader className="relative">
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 p-1 rounded-lg hover:bg-[hsl(var(--secondary))] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[hsl(var(--primary))]/10 flex items-center justify-center">
              <Mail className="h-5 w-5 text-[hsl(var(--primary))]" />
            </div>
            <div>
              <CardTitle>{txt.title}</CardTitle>
              <CardDescription>{txt.subtitle}</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Demo warning */}
          {!isEmailConfigured() && (
            <div className="p-3 rounded-lg bg-[hsl(var(--warning))]/10 border border-[hsl(var(--warning))]/30">
              <p className="text-sm text-[hsl(var(--warning))]">
                ⚠️ {txt.demoWarning}
              </p>
            </div>
          )}

          {status === 'idle' && (
            <>
              {/* Email input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">{txt.email}</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={txt.emailPlaceholder}
                />
              </div>

              {/* Report type selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">{txt.reportType}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setReportType('deals')}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      reportType === 'deals'
                        ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10'
                        : 'border-[hsl(var(--border))] hover:border-[hsl(var(--primary))]/50'
                    }`}
                  >
                    <FileText className={`h-5 w-5 mb-1 ${reportType === 'deals' ? 'text-[hsl(var(--primary))]' : ''}`} />
                    <p className="font-medium text-sm">{txt.dealsReport}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{txt.dealsDescription}</p>
                  </button>
                  <button
                    onClick={() => setReportType('alerts')}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      reportType === 'alerts'
                        ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10'
                        : 'border-[hsl(var(--border))] hover:border-[hsl(var(--primary))]/50'
                    }`}
                  >
                    <AlertCircle className={`h-5 w-5 mb-1 ${reportType === 'alerts' ? 'text-[hsl(var(--primary))]' : ''}`} />
                    <p className="font-medium text-sm">{txt.alertsReport}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{txt.alertsDescription}</p>
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  {txt.cancel}
                </Button>
                <Button 
                  onClick={handleSend} 
                  disabled={!email || items.length === 0}
                  className="flex-1"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {txt.send}
                </Button>
              </div>

              {items.length === 0 && (
                <p className="text-sm text-center text-[hsl(var(--muted-foreground))]">
                  {txt.noGames}
                </p>
              )}
            </>
          )}

          {status === 'checking' && (
            <div className="py-8 text-center space-y-4">
              <Loader2 className="h-10 w-10 animate-spin mx-auto text-[hsl(var(--primary))]" />
              <div>
                <p className="font-medium">{txt.checking}...</p>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  {progress.current} / {progress.total}
                </p>
              </div>
            </div>
          )}

          {status === 'sending' && (
            <div className="py-8 text-center space-y-4">
              <Loader2 className="h-10 w-10 animate-spin mx-auto text-[hsl(var(--primary))]" />
              <p className="font-medium">{txt.sending}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="py-8 text-center space-y-4">
              <CheckCircle className="h-12 w-12 mx-auto text-[hsl(var(--success))]" />
              <div>
                <p className="font-medium text-[hsl(var(--success))]">{txt.success}</p>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">{message}</p>
              </div>
              <Button onClick={handleClose}>{txt.cancel}</Button>
            </div>
          )}

          {status === 'error' && (
            <div className="py-8 text-center space-y-4">
              <AlertCircle className="h-12 w-12 mx-auto text-[hsl(var(--destructive))]" />
              <div>
                <p className="font-medium text-[hsl(var(--destructive))]">{txt.error}</p>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">{message}</p>
              </div>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={handleClose}>{txt.cancel}</Button>
                <Button onClick={() => setStatus('idle')}>
                  {language === 'es' ? 'Reintentar' : 'Try again'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
