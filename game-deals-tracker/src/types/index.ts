// User types
export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  notificationEmail?: string;
  notificationFrequency?: 'daily' | 'weekly' | 'never';
  createdAt?: Date;
}

// Game and Deal types from CheapShark API
export interface GameDeal {
  internalName: string;
  title: string;
  metacriticLink: string | null;
  dealID: string;
  storeID: string;
  gameID: string;
  salePrice: string;
  normalPrice: string;
  isOnSale: string;
  savings: string;
  metacriticScore: string;
  steamRatingText: string | null;
  steamRatingPercent: string;
  steamRatingCount: string;
  steamAppID: string | null;
  releaseDate: number;
  lastChange: number;
  dealRating: string;
  thumb: string;
}

export interface Store {
  storeID: string;
  storeName: string;
  isActive: number;
  images: {
    banner: string;
    logo: string;
    icon: string;
  };
}

export interface GameInfo {
  info: {
    title: string;
    steamAppID: string | null;
    thumb: string;
  };
  cheapestPriceEver: {
    price: string;
    date: number;
  };
  deals: GameDealInfo[];
}

export interface GameDealInfo {
  storeID: string;
  dealID: string;
  price: string;
  retailPrice: string;
  savings: string;
}

export interface GameSearchResult {
  gameID: string;
  steamAppID: string | null;
  cheapest: string;
  cheapestDealID: string;
  external: string;
  internalName: string;
  thumb: string;
}

// Wishlist types
export interface WishlistItem {
  id: string;
  gameID: string;
  gameTitle: string;
  steamAppID: string | null;
  thumb: string;
  targetPrice: number | null;
  currentBestPrice: number;
  addedAt: Date;
  lastChecked: Date;
}

// Alert types
export interface PriceAlert {
  id: string;
  userId: string;
  gameID: string;
  gameTitle: string;
  targetPrice: number;
  currentPrice: number;
  triggered: boolean;
  createdAt: Date;
  triggeredAt?: Date;
}

// API Response types
export interface DealsResponse {
  deals: GameDeal[];
  totalPageCount: number;
}

// Filter types
export interface DealsFilter {
  storeID?: string;
  upperPrice?: number;
  lowerPrice?: number;
  metacritic?: number;
  steamRating?: number;
  title?: string;
  sortBy?: 'Deal Rating' | 'Title' | 'Savings' | 'Price' | 'Metacritic' | 'Reviews' | 'Release' | 'Store' | 'Recent';
  desc?: boolean;
  pageNumber?: number;
  pageSize?: number;
  onSale?: boolean;
}
