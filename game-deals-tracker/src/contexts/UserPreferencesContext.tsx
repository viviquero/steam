import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';
import logger from '@/utils/logger';

export interface UserPreferences {
  favoriteStores: string[];
  minPrice: number | null;
  maxPrice: number | null;
  preferredCurrency: 'EUR' | 'USD';
  preferredLanguage: 'es' | 'en';
  minDiscount: number | null;
  sortBy: string;
  showOnlyWishlisted: boolean;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  favoriteStores: [],
  minPrice: null,
  maxPrice: null,
  preferredCurrency: 'EUR',
  preferredLanguage: 'es',
  minDiscount: null,
  sortBy: 'Deal Rating',
  showOnlyWishlisted: false,
};

interface UserPreferencesContextType {
  preferences: UserPreferences;
  loading: boolean;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  resetPreferences: () => Promise<void>;
  applyPreferencesToFilters: () => { storeID?: string; lowerPrice?: number; upperPrice?: number; sortBy?: string };
}

const UserPreferencesContext = createContext<UserPreferencesContextType | null>(null);

const PREFERENCES_STORAGE_KEY = 'kerodeals-user-preferences';

export function useUserPreferences(): UserPreferencesContextType {
  const context = useContext(UserPreferencesContext);
  if (!context) {
    throw new Error('useUserPreferences must be used within a UserPreferencesProvider');
  }
  return context;
}

interface UserPreferencesProviderProps {
  children: ReactNode;
}

export function UserPreferencesProvider({ children }: UserPreferencesProviderProps) {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);

  // Load preferences from localStorage
  const loadLocalPreferences = (): UserPreferences => {
    try {
      const saved = localStorage.getItem(PREFERENCES_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(saved) };
      }
    } catch (error) {
      logger.error('Error loading preferences from localStorage:', error);
    }
    return DEFAULT_PREFERENCES;
  };

  // Save preferences to localStorage
  const saveLocalPreferences = (prefs: UserPreferences) => {
    try {
      localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(prefs));
    } catch (error) {
      logger.error('Error saving preferences to localStorage:', error);
    }
  };

  // Load preferences based on auth state
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) {
        setPreferences(DEFAULT_PREFERENCES);
        setLoading(false);
        return;
      }

      // Local mode or no Firebase: load from localStorage
      if (!isFirebaseConfigured || !db) {
        const localPrefs = loadLocalPreferences();
        setPreferences(localPrefs);
        setLoading(false);
        return;
      }

      // Firebase mode: load from Firestore
      try {
        const prefsDoc = await getDoc(doc(db, 'users', user.uid, 'settings', 'preferences'));
        if (prefsDoc.exists()) {
          setPreferences({ ...DEFAULT_PREFERENCES, ...prefsDoc.data() as UserPreferences });
        } else {
          setPreferences(DEFAULT_PREFERENCES);
        }
      } catch (error) {
        logger.error('Error loading preferences from Firestore:', error);
        // Fallback to local
        const localPrefs = loadLocalPreferences();
        setPreferences(localPrefs);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [user]);

  // Update preferences
  const updatePreferences = async (updates: Partial<UserPreferences>): Promise<void> => {
    const newPreferences = { ...preferences, ...updates };
    setPreferences(newPreferences);

    // Always save locally
    saveLocalPreferences(newPreferences);

    // If logged in with Firebase, also save to Firestore
    if (user && isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'settings', 'preferences'), newPreferences);
      } catch (error) {
        logger.error('Error saving preferences to Firestore:', error);
      }
    }
  };

  // Reset preferences to defaults
  const resetPreferences = async (): Promise<void> => {
    setPreferences(DEFAULT_PREFERENCES);
    saveLocalPreferences(DEFAULT_PREFERENCES);

    if (user && isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'settings', 'preferences'), DEFAULT_PREFERENCES);
      } catch (error) {
        logger.error('Error resetting preferences in Firestore:', error);
      }
    }
  };

  // Convert preferences to filter format
  const applyPreferencesToFilters = () => {
    const filters: { storeID?: string; lowerPrice?: number; upperPrice?: number; sortBy?: string } = {};
    
    if (preferences.favoriteStores.length > 0) {
      filters.storeID = preferences.favoriteStores.join(',');
    }
    if (preferences.minPrice !== null) {
      filters.lowerPrice = preferences.minPrice;
    }
    if (preferences.maxPrice !== null) {
      filters.upperPrice = preferences.maxPrice;
    }
    if (preferences.sortBy) {
      filters.sortBy = preferences.sortBy;
    }
    
    return filters;
  };

  return (
    <UserPreferencesContext.Provider
      value={{
        preferences,
        loading,
        updatePreferences,
        resetPreferences,
        applyPreferencesToFilters,
      }}
    >
      {children}
    </UserPreferencesContext.Provider>
  );
}
