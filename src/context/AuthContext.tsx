import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { User } from '../types';

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
        userData.emailVerified = auth.currentUser?.emailVerified || false;
        // Force admin role if email matches and persist it if needed
        if (userData.email === adminEmail) {
          if (userData.role !== 'admin') {
            userData.role = 'admin';
            await updateDoc(doc(db, 'users', uid), { role: 'admin' });
          }
        }
        setUser(userData);
      } else {
        // If user document doesn't exist in Firestore but exists in Auth,
        // we might need to create it or handle it.
        const basicUser: User = {
          id: 0, // Placeholder for ID
          uid,
          email: auth.currentUser?.email || '',
          firstName: '',
          lastName: '',
          phone: '',
          isPremium: false,
          role: auth.currentUser?.email === adminEmail ? 'admin' : 'user'
        };
        
        // Create the document if it doesn't exist
        await setDoc(doc(db, 'users', uid), {
          ...basicUser,
          createdAt: new Date().toISOString(),
          cvGenerationsRemaining: 1,
          letterGenerationsRemaining: 1
        });
        
        setUser(basicUser);
      }
    } catch (error: any) {
      console.error("Error fetching user profile:", error);
      if (error.message?.includes('client is offline')) {
        console.warn("Firestore seems to be unreachable. Make sure you have created the Firestore database in your Firebase console and that security rules allow access.");
      }
      
      // Fallback to basic user info from Auth if Firestore fails
      const basicUser: User = {
        id: 0,
        uid,
        email: auth.currentUser?.email || '',
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
