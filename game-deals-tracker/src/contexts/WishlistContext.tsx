import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  serverTimestamp 
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';
import type { WishlistItem } from '@/types';
import logger from '@/utils/logger';

interface WishlistContextType {
  items: WishlistItem[];
  loading: boolean;
  addToWishlist: (item: Omit<WishlistItem, 'id' | 'addedAt' | 'lastChecked'>) => Promise<void>;
  removeFromWishlist: (gameID: string) => Promise<void>;
  updateTargetPrice: (gameID: string, targetPrice: number | null) => Promise<void>;
  isInWishlist: (gameID: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | null>(null);

const WISHLIST_STORAGE_KEY = 'game-deals-wishlist';

export function useWishlist(): WishlistContextType {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}

interface WishlistProviderProps {
  children: ReactNode;
}

export function WishlistProvider({ children }: WishlistProviderProps) {
  const { user, isDemo } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Load wishlist from localStorage (for demo mode)
  const loadLocalWishlist = (): WishlistItem[] => {
    try {
      const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((item: WishlistItem) => ({
          ...item,
          addedAt: new Date(item.addedAt),
          lastChecked: new Date(item.lastChecked),
        }));
      }
    } catch (error) {
      logger.error('Error loading wishlist from localStorage:', error);
    }
    return [];
  };

  // Save wishlist to localStorage (for demo mode)
  const saveLocalWishlist = (wishlist: WishlistItem[]) => {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
    } catch (error) {
      logger.error('Error saving wishlist to localStorage:', error);
    }
  };

  // Load wishlist based on auth state and mode
  useEffect(() => {
    // If no user, clear wishlist
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    // Demo mode: load from localStorage
    if (isDemo || !isFirebaseConfigured || !db) {
      const localItems = loadLocalWishlist();
      setItems(localItems);
      setLoading(false);
      return;
    }

    // Firebase mode: subscribe to Firestore
    const wishlistRef = collection(db, 'users', user.uid, 'wishlist');
    const q = query(wishlistRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const wishlistItems: WishlistItem[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          gameID: data.gameID,
          gameTitle: data.gameTitle,
          steamAppID: data.steamAppID,
          thumb: data.thumb,
          targetPrice: data.targetPrice,
          currentBestPrice: data.currentBestPrice,
          addedAt: data.addedAt?.toDate() || new Date(),
          lastChecked: data.lastChecked?.toDate() || new Date(),
        };
      });
      setItems(wishlistItems);
      setLoading(false);
    }, (error) => {
      logger.error('Error loading wishlist:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, isDemo]);

  // Add game to wishlist
  const addToWishlist = async (item: Omit<WishlistItem, 'id' | 'addedAt' | 'lastChecked'>): Promise<void> => {
    if (!user) return;

    const now = new Date();
    const newItem: WishlistItem = {
      ...item,
      id: item.gameID,
      addedAt: now,
      lastChecked: now,
    };

    // Demo mode: save to localStorage
    if (isDemo || !isFirebaseConfigured || !db) {
      const updatedItems = [...items.filter(i => i.gameID !== item.gameID), newItem];
      setItems(updatedItems);
      saveLocalWishlist(updatedItems);
      return;
    }

    // Firebase mode: save to Firestore
    try {
      const docRef = doc(db, 'users', user.uid, 'wishlist', item.gameID);
      await setDoc(docRef, {
        ...item,
        addedAt: serverTimestamp(),
        lastChecked: serverTimestamp(),
      });
    } catch (error) {
      logger.error('Error adding to wishlist:', error);
      throw error;
    }
  };

  // Remove game from wishlist
  const removeFromWishlist = async (gameID: string): Promise<void> => {
    if (!user) return;

    // Demo mode: remove from localStorage
    if (isDemo || !isFirebaseConfigured || !db) {
      const updatedItems = items.filter(i => i.gameID !== gameID);
      setItems(updatedItems);
      saveLocalWishlist(updatedItems);
      return;
    }

    // Firebase mode: delete from Firestore
    try {
      const docRef = doc(db, 'users', user.uid, 'wishlist', gameID);
      await deleteDoc(docRef);
    } catch (error) {
      logger.error('Error removing from wishlist:', error);
      throw error;
    }
  };

  // Update target price for a game
  const updateTargetPrice = async (gameID: string, targetPrice: number | null): Promise<void> => {
    if (!user) return;

    // Demo mode: update in localStorage
    if (isDemo || !isFirebaseConfigured || !db) {
      const updatedItems = items.map(item => 
        item.gameID === gameID ? { ...item, targetPrice } : item
      );
      setItems(updatedItems);
      saveLocalWishlist(updatedItems);
      return;
    }

    // Firebase mode: update in Firestore
    try {
      const docRef = doc(db, 'users', user.uid, 'wishlist', gameID);
      await setDoc(docRef, { targetPrice }, { merge: true });
    } catch (error) {
      logger.error('Error updating target price:', error);
      throw error;
    }
  };

  // Check if game is in wishlist
  const isInWishlist = (gameID: string): boolean => {
    return items.some(item => item.gameID === gameID);
  };

  const value: WishlistContextType = {
    items,
    loading,
    addToWishlist,
    removeFromWishlist,
    updateTargetPrice,
    isInWishlist,
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
}
