import { useState, useEffect } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui';
import { ExternalLink, Loader2, TrendingDown, X } from 'lucide-react';
import { getGameInfo, getStores, getDealRedirectUrl } from '@/services/cheapshark';
import type { Store as StoreType, GameInfo } from '@/types';

interface GamePriceComparisonProps {
  gameID: string;
  gameTitle: string;
  onClose: () => void;
}

export function GamePriceComparison({ gameID, gameTitle, onClose }: GamePriceComparisonProps) {
  const { language, formatPrice } = useSettings();
  const [loading, setLoading] = useState(true);
  const [gameInfo, setGameInfo] = useState<GameInfo | null>(null);
  const [stores, setStores] = useState<Record<string, StoreType>>({});
  const [error, setError] = useState<string | null>(null);

  const texts = {
    es: {
      title: 'Comparar Precios',
      subtitle: 'Precios en diferentes tiendas',
      store: 'Tienda',
      price: 'Precio',
      originalPrice: 'Original',
      discount: 'Descuento',
      cheapestEver: 'Precio más bajo histórico',
      onDate: 'el',
      goToStore: 'Ir a tienda',
      noDeals: 'No hay ofertas disponibles',
      loading: 'Cargando precios...',
      error: 'Error al cargar precios',
      close: 'Cerrar',
    },
    en: {
      title: 'Compare Prices',
      subtitle: 'Prices across different stores',
      store: 'Store',
      price: 'Price',
      originalPrice: 'Original',
      discount: 'Discount',
      cheapestEver: 'Cheapest price ever',
      onDate: 'on',
      goToStore: 'Go to store',
      noDeals: 'No deals available',
      loading: 'Loading prices...',
      error: 'Error loading prices',
      close: 'Close',
    },
  };

  const t = texts[language];

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load stores and game info in parallel
        const [storeList, info] = await Promise.all([
          getStores(),
          getGameInfo(gameID),
        ]);

        // Create store lookup map
        const storeMap: Record<string, StoreType> = {};
        storeList.forEach(store => {
          storeMap[store.storeID] = store;
        });

        setStores(storeMap);
        setGameInfo(info);
      } catch (err) {
        console.error('Error loading price comparison:', err);
        setError(t.error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [gameID, t.error]);

  // Format date from timestamp
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString(
      language === 'es' ? 'es-ES' : 'en-US',
      { year: 'numeric', month: 'short', day: 'numeric' }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
        <CardHeader className="relative border-b border-[hsl(var(--border))]">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-1 rounded-lg hover:bg-[hsl(var(--secondary))] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-start gap-4 pr-8">
            {gameInfo?.info?.thumb && (
              <img
                src={gameInfo.info.thumb}
                alt={gameTitle}
                className="w-20 h-12 object-cover rounded bg-[hsl(var(--secondary))]"
              />
            )}
            <div>
              <CardTitle className="text-lg">{gameTitle}</CardTitle>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">{t.subtitle}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--primary))]" />
              <span className="ml-2 text-[hsl(var(--muted-foreground))]">{t.loading}</span>
            </div>
          ) : error ? (
            <div className="py-12 text-center text-[hsl(var(--destructive))]">
              {error}
            </div>
          ) : gameInfo?.deals && gameInfo.deals.length > 0 ? (
            <div className="divide-y divide-[hsl(var(--border))]">
              {/* Cheapest Ever Banner */}
              {gameInfo.cheapestPriceEver && (
                <div className="p-4 bg-[hsl(var(--success))]/10 flex items-center gap-3">
                  <TrendingDown className="h-5 w-5 text-[hsl(var(--success))]" />
                  <div>
                    <p className="text-sm font-medium text-[hsl(var(--success))]">
                      {t.cheapestEver}: {formatPrice(gameInfo.cheapestPriceEver.price)}
                    </p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      {t.onDate} {formatDate(gameInfo.cheapestPriceEver.date)}
                    </p>
                  </div>
                </div>
              )}

              {/* Deals list sorted by price */}
              {[...gameInfo.deals]
                .sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
                .map((deal, index) => {
                  const store = stores[deal.storeID];
                  const currentPrice = parseFloat(deal.price);
                  const originalPrice = parseFloat(deal.retailPrice);
                  const discount = Math.round(parseFloat(deal.savings));
                  const isBestPrice = index === 0;

                  return (
                    <div
                      key={deal.dealID}
                      className={`p-4 flex items-center gap-4 hover:bg-[hsl(var(--accent))]/50 transition-colors ${
                        isBestPrice ? 'bg-[hsl(var(--primary))]/5' : ''
                      }`}
                    >
                      {/* Store info */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {store && (
                          <img
                            src={`https://www.cheapshark.com${store.images.icon}`}
                            alt={store.storeName}
                            className="w-6 h-6"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="font-medium truncate">
                            {store?.storeName || `Store ${deal.storeID}`}
                          </p>
                          {isBestPrice && (
                            <span className="text-xs text-[hsl(var(--success))] font-medium">
                              {language === 'es' ? '★ Mejor precio' : '★ Best price'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Prices */}
                      <div className="text-right">
                        <p className={`font-bold ${isBestPrice ? 'text-[hsl(var(--success))]' : ''}`}>
                          {formatPrice(currentPrice.toString())}
                        </p>
                        {discount > 0 && (
                          <p className="text-xs text-[hsl(var(--muted-foreground))] line-through">
                            {formatPrice(originalPrice.toString())}
                          </p>
                        )}
                      </div>

                      {/* Discount badge */}
                      {discount > 0 && (
                        <div className="px-2 py-1 rounded bg-[hsl(var(--success))]/20 text-[hsl(var(--success))] text-sm font-medium">
                          -{discount}%
                        </div>
                      )}

                      {/* Link to store */}
                      <a
                        href={getDealRedirectUrl(deal.dealID)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg hover:bg-[hsl(var(--secondary))] transition-colors"
                        title={t.goToStore}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="py-12 text-center text-[hsl(var(--muted-foreground))]">
              {t.noDeals}
            </div>
          )}
        </CardContent>

        <div className="p-4 border-t border-[hsl(var(--border))]">
          <Button variant="outline" onClick={onClose} className="w-full">
            {t.close}
          </Button>
        </div>
      </Card>
    </div>
  );
}
