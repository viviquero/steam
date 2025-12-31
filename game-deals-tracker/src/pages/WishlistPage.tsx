import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useSettings } from '@/contexts/SettingsContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Input } from '@/components/ui';
import { Heart, LogIn, Trash2, Bell, Loader2, Edit2, Check, X, Mail, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmailReportModal } from '@/components/EmailReportModal';
import { GamePriceComparison } from '@/components/GamePriceComparison';

export function WishlistPage() {
  const { user } = useAuth();
  const { items, loading, removeFromWishlist, updateTargetPrice } = useWishlist();
  const { t, formatPrice, currency, language } = useSettings();
  const [editingPrice, setEditingPrice] = useState<string | null>(null);
  const [targetPriceInput, setTargetPriceInput] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [comparisonGame, setComparisonGame] = useState<{ gameID: string; title: string } | null>(null);

  const handleSetTargetPrice = async (gameID: string) => {
    const price = parseFloat(targetPriceInput);
    if (!isNaN(price) && price > 0) {
      await updateTargetPrice(gameID, price);
    }
    setEditingPrice(null);
    setTargetPriceInput('');
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-[hsl(var(--primary))]/10 flex items-center justify-center mb-4">
              <LogIn className="h-6 w-6 text-[hsl(var(--primary))]" />
            </div>
            <CardTitle>{t.wishlist.loginRequired}</CardTitle>
            <CardDescription>
              {t.wishlist.loginDescription}
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--primary))]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold">
          {t.wishlist.title} <span className="text-[hsl(var(--primary))]">{t.wishlist.titleHighlight}</span>
        </h1>
        <p className="text-[hsl(var(--muted-foreground))] max-w-xl mx-auto">
          {t.wishlist.subtitle}
        </p>
      </div>

      {items.length === 0 ? (
        /* Empty state */
        <Card className="max-w-lg mx-auto">
          <CardContent className="py-12 text-center">
            <Heart className="h-16 w-16 mx-auto text-[hsl(var(--muted-foreground))] mb-4" />
            <h3 className="text-lg font-semibold mb-2">{t.wishlist.empty}</h3>
            <p className="text-[hsl(var(--muted-foreground))] mb-4">
              {t.wishlist.emptyDescription}
            </p>
            <Link to="/search">
              <Button variant="primary">{t.wishlist.searchGames}</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        /* Wishlist items */
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              {items.length} {items.length === 1 ? t.wishlist.game : t.wishlist.games}
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowEmailModal(true)}
              className="gap-2"
            >
              <Mail className="h-4 w-4" />
              {language === 'es' ? 'Enviar Informe' : 'Send Report'}
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {items.map((item) => (
              <Card key={item.gameID} className="hover:border-[hsl(var(--primary))] transition-colors">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <img
                      src={item.thumb}
                      alt={item.gameTitle}
                      className="w-24 h-16 object-cover rounded bg-[hsl(var(--secondary))]"
                      loading="lazy"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate" title={item.gameTitle}>
                        {item.gameTitle}
                      </h3>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-[hsl(var(--muted-foreground))]">{t.wishlist.currentPrice}:</span>
                        <span className="text-[hsl(var(--success))] font-medium">
                          {formatPrice(item.currentBestPrice.toString())}
                        </span>
                      </div>

                      {/* Target Price */}
                      <div className="flex items-center gap-2 mt-1">
                        {editingPrice === item.gameID ? (
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              value={targetPriceInput}
                              onChange={(e) => setTargetPriceInput(e.target.value)}
                              placeholder={currency === 'EUR' ? '€' : '$'}
                              className="w-20 h-7 text-sm"
                              step="0.01"
                              min="0"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSetTargetPrice(item.gameID)}
                              className="h-7 w-7 p-0"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingPrice(null);
                                setTargetPriceInput('');
                              }}
                              className="h-7 w-7 p-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <Bell className="h-3 w-3 text-[hsl(var(--muted-foreground))]" />
                            <span className="text-sm text-[hsl(var(--muted-foreground))]">
                              {item.targetPrice 
                                ? `${t.wishlist.alertAt} ${formatPrice(item.targetPrice.toString())}`
                                : t.wishlist.noAlert
                              }
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingPrice(item.gameID);
                                setTargetPriceInput(item.targetPrice?.toString() || '');
                              }}
                              className="h-6 w-6 p-0"
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setComparisonGame({ gameID: item.gameID, title: item.gameTitle })}
                          className="gap-1 h-7 text-xs"
                          title={language === 'es' ? 'Comparar precios' : 'Compare prices'}
                        >
                          <BarChart3 className="h-3 w-3" />
                          {language === 'es' ? 'Comparar' : 'Compare'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromWishlist(item.gameID)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-500/10 h-7"
                          title={t.wishlist.remove}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Email Report Modal */}
      <EmailReportModal 
        isOpen={showEmailModal} 
        onClose={() => setShowEmailModal(false)} 
      />

      {/* Price Comparison Modal */}
      {comparisonGame && (
        <GamePriceComparison
          gameID={comparisonGame.gameID}
          gameTitle={comparisonGame.title}
          onClose={() => setComparisonGame(null)}
        />
      )}
    </div>
  );
}
