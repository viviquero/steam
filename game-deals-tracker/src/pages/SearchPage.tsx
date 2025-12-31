import { useState, useCallback } from 'react';
import { searchGames } from '@/services/cheapshark';
import { useSettings } from '@/contexts/SettingsContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useAuth } from '@/contexts/AuthContext';
import type { GameSearchResult } from '@/types';
import { Input, Card, CardContent, Button } from '@/components/ui';
import { Search, Loader2, Heart, HeartOff, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GamePriceComparison } from '@/components/GamePriceComparison';
import { sanitizeSearchQuery, searchRateLimiter } from '@/utils/validation';
import logger from '@/utils/logger';

export function SearchPage() {
  const { t, formatPrice } = useSettings();
  const { user } = useAuth();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GameSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [comparisonGame, setComparisonGame] = useState<{ gameID: string; title: string } | null>(null);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    // Rate limiting
    if (!searchRateLimiter.isAllowed('search')) {
      logger.warn('Search rate limited');
      return;
    }

    try {
      setLoading(true);
      setSearched(true);
      const sanitizedQuery = sanitizeSearchQuery(query);
      const games = await searchGames(sanitizedQuery, 20);
      setResults(games);
    } catch (error) {
      logger.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleWishlistToggle = async (game: GameSearchResult) => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (isInWishlist(game.gameID)) {
      await removeFromWishlist(game.gameID);
    } else {
      await addToWishlist({
        gameID: game.gameID,
        gameTitle: game.external,
        steamAppID: game.steamAppID,
        thumb: game.thumb,
        targetPrice: null,
        currentBestPrice: parseFloat(game.cheapest),
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Search Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl sm:text-4xl font-bold">
          {t.search.title} <span className="text-[hsl(var(--primary))]">{t.search.titleHighlight}</span>
        </h1>
        <p className="text-[hsl(var(--muted-foreground))] max-w-xl mx-auto">
          {t.search.subtitle}
        </p>
      </div>

      {/* Search Input */}
      <div className="max-w-2xl mx-auto">
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder={t.search.placeholder}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-12 text-lg"
            />
          </div>
          <Button onClick={handleSearch} disabled={loading || !query.trim()} size="lg">
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Search className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--primary))]" />
        </div>
      ) : searched && results.length === 0 ? (
        <Card className="max-w-md mx-auto">
          <CardContent className="py-8 text-center">
            <p className="text-[hsl(var(--muted-foreground))]">
              {t.search.noResults} "{query}". {t.search.tryDifferent}
            </p>
          </CardContent>
        </Card>
      ) : results.length > 0 ? (
        <div className="space-y-4">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            {results.length} {t.search.found}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((game) => {
              const inWishlist = isInWishlist(game.gameID);
              return (
                <Card key={game.gameID} className="hover:border-[hsl(var(--primary))] transition-colors">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <img
                        src={game.thumb}
                        alt={game.external}
                        className="w-24 h-16 object-cover rounded bg-[hsl(var(--secondary))]"
                        loading="lazy"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate" title={game.external}>
                          {game.external}
                        </h3>
                        <p className="text-sm text-[hsl(var(--muted-foreground))]">
                          {t.search.bestPrice}: <span className="text-[hsl(var(--success))] font-medium">{formatPrice(game.cheapest)}</span>
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Button 
                            variant={inWishlist ? "secondary" : "ghost"} 
                            size="sm" 
                            title={t.search.addToWishlist}
                            onClick={() => handleWishlistToggle(game)}
                            className={inWishlist ? "text-red-500" : ""}
                          >
                            {inWishlist ? <HeartOff className="h-4 w-4" /> : <Heart className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title={t.search.viewDeals}
                            onClick={() => setComparisonGame({ gameID: game.gameID, title: game.external })}
                          >
                            <BarChart3 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ) : !searched ? (
        <div className="text-center py-12">
          <Search className="h-16 w-16 mx-auto text-[hsl(var(--muted-foreground))] mb-4" />
          <p className="text-[hsl(var(--muted-foreground))]">
            {t.search.enterName}
          </p>
        </div>
      ) : null}

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
