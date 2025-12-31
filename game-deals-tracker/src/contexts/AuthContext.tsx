import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '@/config/firebase';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isDemo: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
  loginAsDemo: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

// Demo user for testing without Firebase
const DEMO_USER: User = {
  uid: 'demo-user-123',
  email: 'demo@gamedeals.com',
  displayName: 'Demo User',
  photoURL: null,
  notificationEmail: 'demo@gamedeals.com',
  notificationFrequency: 'weekly',
  createdAt: new Date(),
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(!isFirebaseConfigured);

  // Convert Firebase user to our User type
  const formatUser = async (firebaseUser: FirebaseUser): Promise<User> => {
    if (!db) {
      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        notificationEmail: firebaseUser.email || undefined,
        notificationFrequency: 'weekly',
        createdAt: new Date(),
      };
    }
    
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    const userData = userDoc.data();

    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
      notificationEmail: userData?.notificationEmail || firebaseUser.email || undefined,
      notificationFrequency: userData?.notificationFrequency || 'weekly',
      createdAt: userData?.createdAt?.toDate() || new Date(),
    };
  };

  // Listen to auth state changes
  useEffect(() => {
    // If Firebase is not configured, just stop loading
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const formattedUser = await formatUser(firebaseUser);
          setUser(formattedUser);
          setIsDemo(false);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Error formatting user:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Login as demo user
  const loginAsDemo = (): void => {
    setUser(DEMO_USER);
    setIsDemo(true);
    setError(null);
  };

  // Login with email and password
  const login = async (email: string, password: string): Promise<void> => {
    if (!auth) {
      // Demo mode - accept any credentials
      loginAsDemo();
      return;
    }
    
    try {
      setError(null);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to login';
      setError(message);
      throw err;
    }
  };

  // Register new user
  const register = async (email: string, password: string, displayName: string): Promise<void> => {
    if (!auth) {
      // Demo mode
      setUser({ ...DEMO_USER, email, displayName });
      setIsDemo(true);
      return;
    }
    
    try {
      setError(null);
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with display name
      await updateProfile(firebaseUser, { displayName });
      
      // Create user document in Firestore
      if (db) {
        await setDoc(doc(db, 'users', firebaseUser.uid), {
          email,
          displayName,
          notificationEmail: email,
          notificationFrequency: 'weekly',
          createdAt: serverTimestamp(),
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to register';
      setError(message);
      throw err;
    }
  };

  // Logout
  const logout = async (): Promise<void> => {
    if (!auth || isDemo) {
      setUser(null);
      setIsDemo(!isFirebaseConfigured);
      return;
    }
    
    try {
      setError(null);
      await signOut(auth);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to logout';
      setError(message);
      throw err;
    }
  };

  // Reset password
  const resetPassword = async (email: string): Promise<void> => {
    if (!auth) {
      setError('Password reset not available in demo mode');
      return;
    }
    
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send reset email';
      setError(message);
      throw err;
    }
  };

  // Clear error
  const clearError = () => setError(null);

  const value: AuthContextType = {
    user,
    loading,
    error,
    isDemo,
    login,
    register,
    logout,
    resetPassword,
    clearError,
    loginAsDemo,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
