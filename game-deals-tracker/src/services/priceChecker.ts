// Price checker service - compares wishlist prices with current deals
import { getDealsForGame } from './cheapshark';
import type { WishlistItem } from '@/types';
import type { PriceAlert, DealReport } from './email';

// Store info mapping
const STORE_NAMES: Record<string, string> = {
  '1': 'Steam',
  '2': 'GamersGate',
  '3': 'GreenManGaming',
  '7': 'GOG',
  '8': 'Origin',
  '11': 'Humble Bundle',
  '13': 'Uplay',
  '15': 'Fanatical',
  '21': 'WinGameStore',
  '23': 'GameBillet',
  '24': 'Voidu',
  '25': 'Epic Games Store',
  '27': 'Gamesplanet',
  '28': 'Gamesload',
  '29': '2Game',
  '30': 'IndieGala',
  '31': 'Blizzard Shop',
  '33': 'DLGamer',
  '34': 'Noctre',
  '35': 'DreamGame',
};

export interface PriceCheckResult {
  gameID: string;
  gameTitle: string;
  currentBestPrice: number;
  currentBestStore: string;
  targetPrice: number | null;
  isAtTarget: boolean;
  savings: number;
  dealUrl: string;
  originalPrice: number;
  discount: number;
}

// Check prices for a single game
export const checkGamePrice = async (item: WishlistItem): Promise<PriceCheckResult | null> => {
  try {
    const deals = await getDealsForGame(item.gameID);
    
    if (!deals || deals.length === 0) {
      return null;
    }

    // Find the best deal (lowest price)
    const bestDeal = deals.reduce((best, deal) => {
      const price = parseFloat(deal.salePrice);
      const bestPrice = parseFloat(best.salePrice);
      return price < bestPrice ? deal : best;
    }, deals[0]);

    const currentPrice = parseFloat(bestDeal.salePrice);
    const originalPrice = parseFloat(bestDeal.normalPrice);
    const discount = Math.round(parseFloat(bestDeal.savings));
    const storeName = STORE_NAMES[bestDeal.storeID] || `Store ${bestDeal.storeID}`;
    const dealUrl = `https://www.cheapshark.com/redirect?dealID=${bestDeal.dealID}`;

    const isAtTarget = item.targetPrice !== null && currentPrice <= item.targetPrice;
    const savings = item.targetPrice !== null ? item.targetPrice - currentPrice : 0;

    return {
      gameID: item.gameID,
      gameTitle: item.gameTitle,
      currentBestPrice: currentPrice,
      currentBestStore: storeName,
      targetPrice: item.targetPrice,
      isAtTarget,
      savings: Math.max(0, savings),
      dealUrl,
      originalPrice,
      discount,
    };
  } catch (error) {
    console.error(`Error checking price for ${item.gameTitle}:`, error);
    return null;
  }
};

// Check prices for all wishlist items
export const checkAllPrices = async (
  wishlist: WishlistItem[],
  onProgress?: (current: number, total: number) => void
): Promise<PriceCheckResult[]> => {
  const results: PriceCheckResult[] = [];
  
  for (let i = 0; i < wishlist.length; i++) {
    const item = wishlist[i];
    onProgress?.(i + 1, wishlist.length);
    
    const result = await checkGamePrice(item);
    if (result) {
      results.push(result);
    }
    
    // Small delay to avoid rate limiting
    if (i < wishlist.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  return results;
};

// Get games that have reached target price
export const getTargetReachedAlerts = (results: PriceCheckResult[]): PriceAlert[] => {
  return results
    .filter(r => r.isAtTarget && r.targetPrice !== null)
    .map(r => ({
      gameTitle: r.gameTitle,
      currentPrice: r.currentBestPrice,
      targetPrice: r.targetPrice!,
      savings: r.savings,
      dealUrl: r.dealUrl,
    }));
};

// Generate a deal report from price check results
export const generateDealReport = (results: PriceCheckResult[]): DealReport => {
  const gamesWithDeals = results
    .filter(r => r.discount > 0)
    .sort((a, b) => b.discount - a.discount);

  const totalSavings = gamesWithDeals.reduce(
    (sum, game) => sum + (game.originalPrice - game.currentBestPrice),
    0
  );

  return {
    games: gamesWithDeals.map(game => ({
      title: game.gameTitle,
      currentPrice: game.currentBestPrice,
      originalPrice: game.originalPrice,
      discount: game.discount,
      store: game.currentBestStore,
      dealUrl: game.dealUrl,
    })),
    totalSavings,
    generatedAt: new Date(),
  };
};

// Update wishlist items with current prices
export const updateWishlistPrices = (
  wishlist: WishlistItem[],
  results: PriceCheckResult[]
): WishlistItem[] => {
  return wishlist.map(item => {
    const result = results.find(r => r.gameID === item.gameID);
    if (result) {
      return {
        ...item,
        currentBestPrice: result.currentBestPrice,
      };
    }
    return item;
  });
};
