import { useEffect, useState } from 'react';
import { getDeals, getStores, getDiscountPercentage, getDealRedirectUrl, getStoreIconUrl } from '@/services/cheapshark';
import { useSettings } from '@/contexts/SettingsContext';
import type { GameDeal, Store } from '@/types';
import { Card, CardContent } from '@/components/ui';
import { ExternalLink, TrendingDown, Loader2 } from 'lucide-react';

export function HomePage() {
  const { t, formatPrice } = useSettings();
  const [deals, setDeals] = useState<GameDeal[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        const [dealsData, storesData] = await Promise.all([
          getDeals({ pageSize: 20, sortBy: 'Deal Rating', onSale: true }),
          getStores(),
        ]);
        
        setDeals(dealsData);
        setStores(storesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load deals');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const getStoreName = (storeID: string) => {
    const store = stores.find(s => s.storeID === storeID);
    return store?.storeName || 'Unknown Store';
  };

  const getStoreIcon = (storeID: string) => {
    const store = stores.find(s => s.storeID === storeID);
    return store ? getStoreIconUrl(store) : '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--primary))]" />
          <p className="text-[hsl(var(--muted-foreground))]">{t.home.loading}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-8">
            <p className="text-[hsl(var(--destructive))] mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-[hsl(var(--primary))] hover:underline"
            >
              {t.home.tryAgain}
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold">
          <span className="text-[hsl(var(--primary))]">{t.home.title}</span> {t.home.titleHighlight}
        </h1>
        <p className="text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto">
          {t.home.subtitle}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-[hsl(var(--primary))]">{deals.length}+</p>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">{t.home.activeDeals}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-[hsl(var(--success))]">{stores.length}</p>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">{t.home.stores}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-[hsl(var(--warning))]">
              {deals.length > 0 ? `${Math.max(...deals.map(d => getDiscountPercentage(d.savings)))}%` : '0%'}
            </p>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">{t.home.maxDiscount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-[hsl(var(--foreground))]">24/7</p>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">{t.home.priceUpdates}</p>
          </CardContent>
        </Card>
      </div>

      {/* Deals Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {deals.map((deal) => (
          <Card key={deal.dealID} className="group hover:border-[hsl(var(--primary))] transition-colors overflow-hidden">
            <div className="aspect-video relative overflow-hidden bg-[hsl(var(--secondary))]">
              <img
                src={deal.thumb}
                alt={deal.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              {getDiscountPercentage(deal.savings) > 0 && (
                <div className="absolute top-2 right-2 bg-[hsl(var(--success))] text-white text-xs font-bold px-2 py-1 rounded">
                  -{getDiscountPercentage(deal.savings)}%
                </div>
              )}
            </div>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold line-clamp-2 min-h-[2.5rem]" title={deal.title}>
                {deal.title}
              </h3>
              
              <div className="flex items-center gap-2">
                {getStoreIcon(deal.storeID) && (
                  <img
                    src={getStoreIcon(deal.storeID)}
                    alt={getStoreName(deal.storeID)}
                    className="w-4 h-4"
                  />
                )}
                <span className="text-xs text-[hsl(var(--muted-foreground))]">
                  {getStoreName(deal.storeID)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-[hsl(var(--success))]">
                    {formatPrice(deal.salePrice)}
                  </span>
                  {parseFloat(deal.normalPrice) > parseFloat(deal.salePrice) && (
                    <span className="text-sm text-[hsl(var(--muted-foreground))] line-through">
                      {formatPrice(deal.normalPrice)}
                    </span>
                  )}
                </div>
                <TrendingDown className="h-4 w-4 text-[hsl(var(--success))]" />
              </div>

              {deal.steamRatingPercent && parseInt(deal.steamRatingPercent) > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-[hsl(var(--secondary))] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[hsl(var(--primary))] rounded-full"
                      style={{ width: `${deal.steamRatingPercent}%` }}
                    />
                  </div>
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">
                    {deal.steamRatingPercent}%
                  </span>
                </div>
              )}

              <a
                href={getDealRedirectUrl(deal.dealID)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]/90 transition-colors text-sm font-medium"
              >
                {t.home.getDeal}
                <ExternalLink className="h-4 w-4" />
              </a>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
