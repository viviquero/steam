import { useEffect, useState, useCallback } from 'react';
import { getDeals, getStores, getDiscountPercentage, getDealRedirectUrl, getStoreIconUrl } from '@/services/cheapshark';
import { useSettings } from '@/contexts/SettingsContext';
import { useUserPreferences } from '@/contexts/UserPreferencesContext';
import type { GameDeal, Store, DealsFilter as DealsFilterType } from '@/types';
import { Card, CardContent, Button } from '@/components/ui';
import { ExternalLink, TrendingDown, Loader2, BarChart3, Heart, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Star, LogIn, Filter } from 'lucide-react';
import { DealsFilter } from '@/components/DealsFilter';
import { GamePriceComparison } from '@/components/GamePriceComparison';
import { useWishlist } from '@/contexts/WishlistContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const DEALS_PER_PAGE = 30; // 5 columns x 6 rows

export function HomePage() {
  const { t, formatPrice, language } = useSettings();
  const { user } = useAuth();
  const { addToWishlist, removeFromWishlist, isInWishlist, items: wishlistItems } = useWishlist();
  const { preferences, applyPreferencesToFilters } = useUserPreferences();
  const navigate = useNavigate();
  
  const [deals, setDeals] = useState<GameDeal[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wishlistVisible, setWishlistVisible] = useState(() => {
    const saved = localStorage.getItem('wishlist-section-visible');
    return saved !== null ? saved === 'true' : true;
  });
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  
  // Initialize filters with user preferences
  const getInitialFilters = useCallback((): DealsFilterType => {
    const prefFilters = applyPreferencesToFilters();
    return {
      onSale: true,
      pageSize: DEALS_PER_PAGE,
      sortBy: (prefFilters.sortBy as DealsFilterType['sortBy']) || 'Deal Rating',
      storeID: prefFilters.storeID,
      lowerPrice: prefFilters.lowerPrice,
      upperPrice: prefFilters.upperPrice,
    };
  }, [applyPreferencesToFilters]);
  
  const [filters, setFilters] = useState<DealsFilterType>(() => getInitialFilters());
  const [comparisonGame, setComparisonGame] = useState<{ gameID: string; title: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMorePages, setHasMorePages] = useState(true);

  // Update filters when preferences change
  useEffect(() => {
    setFilters(getInitialFilters());
  }, [preferences, getInitialFilters]);

  // Helper function to deduplicate deals - keep only the cheapest per game
  const deduplicateDeals = useCallback((dealsData: GameDeal[]): GameDeal[] => {
    const gameMap = new Map<string, GameDeal>();
    
    for (const deal of dealsData) {
      const existing = gameMap.get(deal.gameID);
      if (!existing || parseFloat(deal.salePrice) < parseFloat(existing.salePrice)) {
        gameMap.set(deal.gameID, deal);
      }
    }
    
    return Array.from(gameMap.values());
  }, []);

  const fetchDeals = useCallback(async (currentFilters: DealsFilterType, page: number = 0) => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch more deals to account for duplicates that will be filtered out
      const dealsData = await getDeals({ 
        ...currentFilters, 
        pageSize: DEALS_PER_PAGE * 2, // Fetch extra to compensate for deduplication
        pageNumber: page 
      });
      
      // Deduplicate and limit to desired page size
      const uniqueDeals = deduplicateDeals(dealsData).slice(0, DEALS_PER_PAGE);
      setDeals(uniqueDeals);
      
      // If we got fewer unique deals than requested, there might not be more pages
      setHasMorePages(uniqueDeals.length === DEALS_PER_PAGE);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load deals');
    } finally {
      setLoading(false);
    }
  }, [deduplicateDeals]);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        const [dealsData, storesData] = await Promise.all([
          getDeals({ ...filters, pageSize: DEALS_PER_PAGE * 2 }),
          getStores(),
        ]);
        
        // Deduplicate - keep only the cheapest deal per game
        const uniqueDeals = deduplicateDeals(dealsData).slice(0, DEALS_PER_PAGE);
        setDeals(uniqueDeals);
        setStores(storesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load deals');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [deduplicateDeals]);

  // Refetch when filters change
  const handleFilterChange = useCallback((newFilters: DealsFilterType) => {
    setFilters(newFilters);
    setCurrentPage(0);
    fetchDeals(newFilters, 0);
  }, [fetchDeals]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    fetchDeals(filters, newPage);
    // Scroll to top of deals
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleWishlistToggle = async (deal: GameDeal) => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (isInWishlist(deal.gameID)) {
      await removeFromWishlist(deal.gameID);
    } else {
      await addToWishlist({
        gameID: deal.gameID,
        gameTitle: deal.title,
        steamAppID: deal.steamAppID,
        thumb: deal.thumb,
        targetPrice: null,
        currentBestPrice: parseFloat(deal.salePrice),
      });
    }
  };

  const getStoreName = (storeID: string) => {
    const store = stores.find(s => s.storeID === storeID);
    return store?.storeName || 'Unknown Store';
  };

  const getStoreIcon = (storeID: string) => {
    const store = stores.find(s => s.storeID === storeID);
    return store ? getStoreIconUrl(store) : '';
  };

  const toggleWishlistSection = () => {
    const newValue = !wishlistVisible;
    setWishlistVisible(newValue);
    localStorage.setItem('wishlist-section-visible', String(newValue));
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
      {/* Header with integrated filter button */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3">
          <h1 className="text-3xl sm:text-4xl font-bold">
            <span className="text-[hsl(var(--primary))]">{t.home.title}</span> {t.home.titleHighlight}
          </h1>
          <button
            onClick={() => setFiltersExpanded(!filtersExpanded)}
            className={`p-2 rounded-lg transition-colors ${
              filtersExpanded 
                ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]' 
                : 'bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--accent))]'
            }`}
            title={filtersExpanded ? (language === 'es' ? 'Ocultar filtros' : 'Hide filters') : (language === 'es' ? 'Mostrar filtros' : 'Show filters')}
          >
            <Filter className="h-5 w-5" />
          </button>
        </div>
        <p className="text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto">
          {t.home.subtitle}
        </p>
      </div>

      {/* Filters - Collapsible */}
      <DealsFilter onFilterChange={handleFilterChange} initialFilters={filters} isExpanded={filtersExpanded} />

      {/* Wishlist Section - Collapsible */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <button
            onClick={toggleWishlistSection}
            className="flex items-center gap-2 text-lg font-semibold hover:text-[hsl(var(--primary))] transition-colors"
          >
            <Star className="h-5 w-5 text-[hsl(var(--warning))] fill-current" />
            {t.home.wishlistSection}
            {wishlistVisible ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            {user && wishlistItems.length > 0 && (
              <span className="text-sm font-normal text-[hsl(var(--muted-foreground))]">
                ({wishlistItems.length})
              </span>
            )}
          </button>
          {user && wishlistItems.length > 0 && (
            <Link
              to="/wishlist"
              className="text-sm text-[hsl(var(--primary))] hover:underline"
            >
              {t.home.viewAll}
            </Link>
          )}
        </div>

        {wishlistVisible && (
          <div className="transition-all duration-300 ease-in-out">
            {!user ? (
              // Not logged in state
              <Card className="border-dashed">
                <CardContent className="py-6 text-center">
                  <LogIn className="h-8 w-8 mx-auto mb-2 text-[hsl(var(--muted-foreground))]" />
                  <p className="text-[hsl(var(--muted-foreground))] mb-3">{t.home.wishlistLogin}</p>
                  <Button variant="primary" size="sm" onClick={() => navigate('/login')}>
                    {t.nav.login}
                  </Button>
                </CardContent>
              </Card>
            ) : wishlistItems.length === 0 ? (
              // Empty wishlist state
              <Card className="border-dashed">
                <CardContent className="py-6 text-center">
                  <Heart className="h-8 w-8 mx-auto mb-2 text-[hsl(var(--muted-foreground))]" />
                  <p className="text-[hsl(var(--muted-foreground))]">{t.home.wishlistEmpty}</p>
                </CardContent>
              </Card>
            ) : (
              // Wishlist games horizontal scroll
              <div className="relative">
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-[hsl(var(--border))] scrollbar-track-transparent">
                  {wishlistItems.slice(0, 10).map((item) => (
                    <Card 
                      key={item.gameID} 
                      className="flex-shrink-0 w-[160px] group hover:border-[hsl(var(--primary))] transition-colors overflow-hidden"
                    >
                      <div className="aspect-video relative overflow-hidden bg-[hsl(var(--secondary))]">
                        <img
                          src={item.thumb}
                          alt={item.gameTitle}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <div className="absolute top-1 right-1">
                          <button
                            onClick={() => removeFromWishlist(item.gameID)}
                            className="p-1 rounded bg-red-500/90 text-white hover:bg-red-600 backdrop-blur-sm transition-colors"
                            title={t.wishlist.remove}
                          >
                            <Heart className="h-3 w-3 fill-current" />
                          </button>
                        </div>
                      </div>
                      <CardContent className="p-2 space-y-1">
                        <h4 className="font-medium text-xs line-clamp-2 min-h-[2rem] leading-tight" title={item.gameTitle}>
                          {item.gameTitle}
                        </h4>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[hsl(var(--success))]">
                            {formatPrice(String(item.currentBestPrice))}
                          </span>
                          {item.targetPrice && (
                            <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                              🎯 {formatPrice(String(item.targetPrice))}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {wishlistItems.length > 10 && (
                    <Link
                      to="/wishlist"
                      className="flex-shrink-0 w-[160px] flex items-center justify-center"
                    >
                      <Card className="w-full h-full flex items-center justify-center hover:border-[hsl(var(--primary))] transition-colors">
                        <CardContent className="py-8 text-center">
                          <span className="text-sm text-[hsl(var(--primary))]">
                            +{wishlistItems.length - 10} {t.home.viewAll}
                          </span>
                        </CardContent>
                      </Card>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Deals Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--primary))]" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {deals.map((deal) => {
            const inWishlist = isInWishlist(deal.gameID);
            return (
              <Card key={deal.dealID} className="group hover:border-[hsl(var(--primary))] transition-colors overflow-hidden">
                <div className="aspect-video relative overflow-hidden bg-[hsl(var(--secondary))]">
                  <img
                    src={deal.thumb}
                    alt={deal.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  {getDiscountPercentage(deal.savings) > 0 && (
                    <div className="absolute top-1 right-1 bg-[hsl(var(--success))] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                      -{getDiscountPercentage(deal.savings)}%
                    </div>
                  )}
                  {/* Quick actions overlay */}
                  <div className="absolute top-1 left-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleWishlistToggle(deal)}
                      className={`p-1 rounded backdrop-blur-sm transition-colors ${
                        inWishlist 
                          ? 'bg-red-500/90 text-white' 
                          : 'bg-black/50 text-white hover:bg-black/70'
                      }`}
                      title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                    >
                      <Heart className={`h-3 w-3 ${inWishlist ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={() => setComparisonGame({ gameID: deal.gameID, title: deal.title })}
                      className="p-1 rounded bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm transition-colors"
                      title="Compare prices"
                    >
                      <BarChart3 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <CardContent className="p-2.5 space-y-1.5">
                  <h3 className="font-medium text-sm line-clamp-2 min-h-[2.25rem] leading-tight" title={deal.title}>
                    {deal.title}
                  </h3>
              
              <div className="flex items-center gap-1.5">
                {getStoreIcon(deal.storeID) && (
                  <img
                    src={getStoreIcon(deal.storeID)}
                    alt={getStoreName(deal.storeID)}
                    className="w-3 h-3"
                  />
                )}
                <span className="text-[10px] text-[hsl(var(--muted-foreground))] truncate">
                  {getStoreName(deal.storeID)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-[hsl(var(--success))]">
                    {formatPrice(deal.salePrice)}
                  </span>
                  {parseFloat(deal.normalPrice) > parseFloat(deal.salePrice) && (
                    <span className="text-[10px] text-[hsl(var(--muted-foreground))] line-through">
                      {formatPrice(deal.normalPrice)}
                    </span>
                  )}
                </div>
                <TrendingDown className="h-3 w-3 text-[hsl(var(--success))]" />
              </div>

              {deal.steamRatingPercent && parseInt(deal.steamRatingPercent) > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="flex-1 h-1 bg-[hsl(var(--secondary))] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[hsl(var(--primary))] rounded-full"
                      style={{ width: `${deal.steamRatingPercent}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                    {deal.steamRatingPercent}%
                  </span>
                </div>
              )}

              <a
                href={getDealRedirectUrl(deal.dealID)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-md bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]/90 transition-colors text-xs font-medium"
              >
                {t.home.getDeal}
                <ExternalLink className="h-3 w-3" />
              </a>
            </CardContent>
          </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && deals.length > 0 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 0}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            {language === 'es' ? 'Anterior' : 'Previous'}
          </Button>

          {/* Page numbers */}
          <div className="flex items-center gap-1">
            {currentPage > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handlePageChange(0)}
                  className="w-9 h-9 p-0"
                >
                  1
                </Button>
                {currentPage > 2 && <span className="px-1 text-[hsl(var(--muted-foreground))]">...</span>}
              </>
            )}

            {currentPage > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                className="w-9 h-9 p-0"
              >
                {currentPage}
              </Button>
            )}

            <Button
              variant="primary"
              size="sm"
              className="w-9 h-9 p-0"
              disabled
            >
              {currentPage + 1}
            </Button>

            {hasMorePages && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                className="w-9 h-9 p-0"
              >
                {currentPage + 2}
              </Button>
            )}

            {hasMorePages && (
              <>
                <span className="px-1 text-[hsl(var(--muted-foreground))]">...</span>
              </>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!hasMorePages}
            className="gap-1"
          >
            {language === 'es' ? 'Siguiente' : 'Next'}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Current page indicator */}
      {!loading && deals.length > 0 && (
        <p className="text-center text-sm text-[hsl(var(--muted-foreground))]">
          {language === 'es' 
            ? `Página ${currentPage + 1} · ${deals.length} ofertas mostradas`
            : `Page ${currentPage + 1} · ${deals.length} deals shown`
          }
        </p>
      )}

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
