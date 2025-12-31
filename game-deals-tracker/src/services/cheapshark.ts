import type { GameDeal, Store, GameInfo, GameSearchResult, DealsFilter } from '@/types';

const API_BASE_URL = 'https://www.cheapshark.com/api/1.0';

/**
 * CheapShark API Service
 * Free API that aggregates game deals from multiple stores
 * Documentation: https://apidocs.cheapshark.com/
 */

// Cache for stores to avoid repeated API calls
let storesCache: Store[] | null = null;

/**
 * Get list of all available stores
 */
export async function getStores(): Promise<Store[]> {
  if (storesCache) {
    return storesCache;
  }

  const response = await fetch(`${API_BASE_URL}/stores`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch stores');
  }
  
  const stores: Store[] = await response.json();
  storesCache = stores.filter(store => store.isActive === 1);
  return storesCache;
}

/**
 * Get current game deals with optional filters
 */
export async function getDeals(filters: DealsFilter = {}): Promise<GameDeal[]> {
  const params = new URLSearchParams();
  
  if (filters.storeID) params.append('storeID', filters.storeID);
  if (filters.upperPrice !== undefined) params.append('upperPrice', filters.upperPrice.toString());
  if (filters.lowerPrice !== undefined) params.append('lowerPrice', filters.lowerPrice.toString());
  if (filters.metacritic !== undefined) params.append('metacritic', filters.metacritic.toString());
  if (filters.steamRating !== undefined) params.append('steamRating', filters.steamRating.toString());
  if (filters.title) params.append('title', filters.title);
  if (filters.sortBy) params.append('sortBy', filters.sortBy);
  if (filters.desc !== undefined) params.append('desc', filters.desc ? '1' : '0');
  if (filters.pageNumber !== undefined) params.append('pageNumber', filters.pageNumber.toString());
  if (filters.pageSize !== undefined) params.append('pageSize', filters.pageSize.toString());
  if (filters.onSale !== undefined) params.append('onSale', filters.onSale ? '1' : '0');

  const response = await fetch(`${API_BASE_URL}/deals?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch deals');
  }
  
  return response.json();
}

/**
 * Search for games by title
 */
export async function searchGames(title: string, limit: number = 10): Promise<GameSearchResult[]> {
  if (!title.trim()) {
    return [];
  }

  const params = new URLSearchParams({
    title: title.trim(),
    limit: limit.toString(),
  });

  const response = await fetch(`${API_BASE_URL}/games?${params.toString()}`);
  
  if (!response.ok) {
    throw new Error('Failed to search games');
  }
  
  return response.json();
}

/**
 * Get detailed information about a specific game including all deals
 */
export async function getGameInfo(gameID: string): Promise<GameInfo> {
  const response = await fetch(`${API_BASE_URL}/games?id=${gameID}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch game info');
  }
  
  return response.json();
}

/**
 * Get multiple games info by IDs (comma-separated, max 25)
 */
export async function getMultipleGamesInfo(gameIDs: string[]): Promise<Record<string, GameInfo>> {
  if (gameIDs.length === 0) {
    return {};
  }

  // API limit is 25 games per request
  const limitedIDs = gameIDs.slice(0, 25);
  const response = await fetch(`${API_BASE_URL}/games?ids=${limitedIDs.join(',')}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch games info');
  }
  
  return response.json();
}

/**
 * Get deal details by deal ID
 */
export async function getDealInfo(dealID: string): Promise<{
  gameInfo: {
    storeID: string;
    gameID: string;
    name: string;
    steamAppID: string | null;
    salePrice: string;
    retailPrice: string;
    steamRatingText: string | null;
    steamRatingPercent: string;
    steamRatingCount: string;
    metacriticScore: string;
    metacriticLink: string | null;
    releaseDate: number;
    publisher: string;
    steamworks: string;
    thumb: string;
  };
  cheaperStores: Array<{
    dealID: string;
    storeID: string;
    salePrice: string;
    retailPrice: string;
  }>;
  cheapestPrice: {
    price: string;
    date: number;
  };
}> {
  const response = await fetch(`${API_BASE_URL}/deals?id=${dealID}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch deal info');
  }
  
  return response.json();
}

/**
 * Get all current deals for a specific game
 */
export async function getDealsForGame(gameID: string): Promise<Array<{
  storeID: string;
  dealID: string;
  salePrice: string;
  normalPrice: string;
  savings: string;
}>> {
  try {
    const gameInfo = await getGameInfo(gameID);
    
    if (!gameInfo || !gameInfo.deals) {
      return [];
    }
    
    // Map GameDealInfo to expected format (price -> salePrice, retailPrice -> normalPrice)
    return gameInfo.deals.map(deal => ({
      storeID: deal.storeID,
      dealID: deal.dealID,
      salePrice: deal.price,
      normalPrice: deal.retailPrice,
      savings: deal.savings,
    }));
  } catch (error) {
    console.error('Error fetching deals for game:', error);
    return [];
  }
}

/**
 * Get store logo URL
 */
export function getStoreLogoUrl(store: Store): string {
  return `https://www.cheapshark.com${store.images.logo}`;
}

/**
 * Get store icon URL
 */
export function getStoreIconUrl(store: Store): string {
  return `https://www.cheapshark.com${store.images.icon}`;
}

/**
 * Calculate discount percentage from savings string
 */
export function getDiscountPercentage(savings: string): number {
  return Math.round(parseFloat(savings));
}

/**
 * Format price to display
 */
export function formatPrice(price: string | number): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return numPrice === 0 ? 'Free' : `$${numPrice.toFixed(2)}`;
}

/**
 * Get redirect URL to store deal
 */
export function getDealRedirectUrl(dealID: string): string {
  return `https://www.cheapshark.com/redirect?dealID=${dealID}`;
}
