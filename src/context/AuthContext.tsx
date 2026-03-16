import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface User {
  uid: string;
  email: string | null;
  firstName: string;
  lastName: string;
  phone: string;
  isPremium: boolean;
  role: string;
  modernExpiresAt?: string;
  classicExpiresAt?: string;
  creativeExpiresAt?: string;
  cvGenerationsRemaining?: number;
  letterGenerationsRemaining?: number;
  address?: string;
  bio?: string;
  status?: string;
}

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (uid: string) => {
    const adminEmail = "peter25ngouala@gmail.com";
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        // Force admin role if email matches
        if (userData.email === adminEmail) {
          userData.role = 'admin';
        }
        setUser(userData);
      } else {
        // If user document doesn't exist in Firestore but exists in Auth,
        // we might need to create it or handle it.
        const basicUser: User = {
          uid,
          email: auth.currentUser?.email || null,
          firstName: '',
          lastName: '',
          phone: '',
          isPremium: false,
          role: auth.currentUser?.email === adminEmail ? 'admin' : 'user'
        };
        setUser(basicUser);
      }
    } catch (error: any) {
      console.error("Error fetching user profile:", error);
      if (error.message?.includes('client is offline')) {
        console.warn("Firestore seems to be unreachable. Make sure you have created the Firestore database in your Firebase console and that security rules allow access.");
      }
      
      // Fallback to basic user info from Auth if Firestore fails
      const basicUser: User = {
        uid,
        email: auth.currentUser?.email || null,
        firstName: '',
        lastName: '',
        phone: '',
        isPremium: false,
        role: auth.currentUser?.email === adminEmail ? 'admin' : 'user'
      };
      setUser(basicUser);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fUser) => {
      setFirebaseUser(fUser);
      if (fUser) {
        await fetchUserProfile(fUser.uid);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await auth.signOut();
  };

  const refreshProfile = async () => {
    if (firebaseUser) {
      await fetchUserProfile(firebaseUser.uid);
    }
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
