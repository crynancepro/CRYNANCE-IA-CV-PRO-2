import { db, auth } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc, 
  getDoc,
  orderBy,
  serverTimestamp,
  setDoc
} from 'firebase/firestore';

// Client-side "Backend" using Firestore
// This replaces all /api calls for a purely static deployment

export const api = {
  public: {
    getStats: async () => {
      // Mock stats for static deployment
      return {
        ok: true,
        json: async () => ({
          totalCvs: 12450,
          totalUsers: 3200,
          cvsToday: 85,
          satisfaction: 4.9
        })
      } as any;
    }
  },
  auth: {
    login: async (credentials: any) => {
      // Handled directly by Firebase Auth in Login.tsx
      return { ok: true, json: async () => ({ success: true }) } as any;
    },
    register: async (userData: any) => {
      // Handled directly by Firebase Auth in Register.tsx
      return { ok: true, json: async () => ({ success: true }) } as any;
    },
    getProfile: async () => {
      const user = auth.currentUser;
      if (!user) return { ok: false } as any;
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      return {
        ok: true,
        json: async () => userDoc.exists() ? userDoc.data() : { uid: user.uid, email: user.email }
      } as any;
    },
    forgotPassword: async (email: string) => {
      return { ok: true } as any;
    },
    resetPassword: async (data: any) => {
      return { ok: true } as any;
    },
    getReferrals: async () => {
      return { ok: true, json: async () => [] } as any;
    },
    updateProfile: async (profileData: any) => {
      const user = auth.currentUser;
      if (!user) return { ok: false } as any;
      await updateDoc(doc(db, 'users', user.uid), profileData);
      return { ok: true } as any;
    }
  },
  cvs: {
    list: async () => {
      const user = auth.currentUser;
      if (!user) return { ok: true, json: async () => [] } as any;
      const q = query(collection(db, 'cvs'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const cvs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { ok: true, json: async () => cvs } as any;
    },
    save: async (cvData: any) => {
      const user = auth.currentUser;
      if (!user) return { ok: false } as any;
      
      const data = {
        userId: user.uid,
        title: cvData.title || 'Sans titre',
        content: cvData.content || '',
        atsScore: cvData.atsScore || 0,
        isOptimized: cvData.isOptimized || false,
        data: cvData,
        updatedAt: serverTimestamp(),
        createdAt: cvData.createdAt || serverTimestamp()
      };

      if (cvData.id && cvData.id !== 'current-cv') {
        await setDoc(doc(db, 'cvs', cvData.id), data, { merge: true });
        return { ok: true, json: async () => ({ id: cvData.id }) } as any;
      } else {
        const docRef = await addDoc(collection(db, 'cvs'), data);
        return { ok: true, json: async () => ({ id: docRef.id }) } as any;
      }
    },
    delete: async (id: string) => {
      await deleteDoc(doc(db, 'cvs', id));
      return { ok: true } as any;
    }
  },
  letters: {
    list: async () => {
      const user = auth.currentUser;
      if (!user) return { ok: true, json: async () => [] } as any;
      const q = query(collection(db, 'cover_letters'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const letters = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { ok: true, json: async () => letters } as any;
    },
    save: async (letterData: any) => {
      const user = auth.currentUser;
      if (!user) return { ok: false } as any;
      
      const data = {
        userId: user.uid,
        title: letterData.title || 'Lettre de motivation',
        content: letterData.content || '',
        data: letterData,
        updatedAt: serverTimestamp(),
        createdAt: letterData.createdAt || serverTimestamp()
      };

      if (letterData.id) {
        await setDoc(doc(db, 'cover_letters', letterData.id), data, { merge: true });
        return { ok: true, json: async () => ({ id: letterData.id }) } as any;
      } else {
        const docRef = await addDoc(collection(db, 'cover_letters'), data);
        return { ok: true, json: async () => ({ id: docRef.id }) } as any;
      }
    },
    delete: async (id: string) => {
      await deleteDoc(doc(db, 'cover_letters', id));
      return { ok: true } as any;
    }
  },
  payments: {
    history: async () => {
      const user = auth.currentUser;
      if (!user) return { ok: true, json: async () => [] } as any;
      const q = query(collection(db, 'payment_requests'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { ok: true, json: async () => history } as any;
    },
    request: async (data: any) => {
      const user = auth.currentUser;
      if (!user) return { ok: false } as any;
      
      await addDoc(collection(db, 'payment_requests'), {
        userId: user.uid,
        userEmail: user.email,
        type: data.type,
        amount: data.amount,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      return { ok: true, json: async () => ({ success: true }) } as any;
    }
  },
  invoices: {
    list: async () => {
      const user = auth.currentUser;
      if (!user) return { ok: true, json: async () => [] } as any;
      const q = query(collection(db, 'invoices'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const invoices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { ok: true, json: async () => invoices } as any;
    }
  },
  ia: {
    consume: async (type: 'cv' | 'letter') => {
      const user = auth.currentUser;
      if (!user) return { ok: false } as any;
      
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const field = type === 'cv' ? 'cvGenerationsRemaining' : 'letterGenerationsRemaining';
        const current = userData[field] || 0;
        if (current > 0) {
          await updateDoc(userRef, { [field]: current - 1 });
          return { ok: true, json: async () => ({ success: true }) } as any;
        }
      }
      return { ok: false, json: async () => ({ error: 'No generations remaining' }) } as any;
    }
  },
  messages: {
    list: async () => {
      const user = auth.currentUser;
      if (!user) return { ok: true, json: async () => [] } as any;
      const q = query(collection(db, 'messages'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { ok: true, json: async () => messages } as any;
    },
    markAsRead: async (id: string) => {
      await updateDoc(doc(db, 'messages', id), { read: true });
      return { ok: true } as any;
    }
  },
  reviews: {
    list: async () => {
      // Mock reviews for static deployment
      return {
        ok: true,
        json: async () => ({
          reviews: [
            { id: 1, firstName: "Mamadou", lastName: "S", content: "J'ai trouvé un stage grâce à ce CV généré !", rating: 5 },
            { id: 2, firstName: "Fatou", lastName: "D", content: "Très rapide et professionnel, je recommande.", rating: 5 },
            { id: 3, firstName: "Jean", lastName: "K", content: "Le meilleur générateur de CV que j'ai utilisé.", rating: 5 }
          ],
          avgRating: 4.9,
          totalReviews: 1250
        })
      } as any;
    },
    submit: async (data: { rating: number, content: string }) => {
      return { ok: true, json: async () => ({ success: true }) } as any;
    }
  },
  admin: {
    getStats: async () => {
      const usersSnap = await getDocs(collection(db, 'users'));
      const cvsSnap = await getDocs(collection(db, 'cvs'));
      const paymentsSnap = await getDocs(collection(db, 'payment_requests'));
      
      return {
        ok: true,
        json: async () => ({
          totalUsers: usersSnap.size,
          totalCvs: cvsSnap.size,
          totalPayments: paymentsSnap.size,
          pendingPayments: paymentsSnap.docs.filter(d => d.data().status === 'pending').length
        })
      } as any;
    },
    getRevenueStats: async () => {
      return { ok: true, json: async () => ({ totalRevenue: 0, monthlyRevenue: [] }) } as any;
    },
    getIAStats: async () => {
      return { ok: true, json: async () => ({ totalGenerations: 0 }) } as any;
    },
    getReferralStats: async () => {
      return { ok: true, json: async () => ({ totalReferrals: 0 }) } as any;
    },
    getUsers: async () => {
      const snapshot = await getDocs(collection(db, 'users'));
      const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { ok: true, json: async () => users } as any;
    },
    banUser: async (id: string) => {
      await updateDoc(doc(db, 'users', id), { status: 'banned' });
      return { ok: true } as any;
    },
    deleteUser: async (id: string) => {
      await deleteDoc(doc(db, 'users', id));
      return { ok: true } as any;
    },
    getPayments: async () => {
      const snapshot = await getDocs(query(collection(db, 'payment_requests'), orderBy('createdAt', 'desc')));
      const payments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { ok: true, json: async () => payments } as any;
    },
    getPromos: async () => {
      const snapshot = await getDocs(collection(db, 'promo_codes'));
      const promos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { ok: true, json: async () => promos } as any;
    },
    createPromo: async (promoData: any) => {
      const docRef = await addDoc(collection(db, 'promo_codes'), {
        ...promoData,
        createdAt: serverTimestamp()
      });
      return { ok: true, json: async () => ({ id: docRef.id }) } as any;
    },
    deletePromo: async (id: string) => {
      await deleteDoc(doc(db, 'promo_codes', id));
      return { ok: true } as any;
    },
    confirmPayment: async (id: string) => {
      const paymentRef = doc(db, 'payment_requests', id);
      const paymentDoc = await getDoc(paymentRef);
      if (paymentDoc.exists()) {
        const paymentData = paymentDoc.data();
        await updateDoc(paymentRef, { status: 'confirmed' });
        
        // Update user status
        const userRef = doc(db, 'users', paymentData.userId);
        await updateDoc(userRef, { 
          isPremium: true,
          role: 'premium',
          [`${paymentData.type}ExpiresAt`]: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        });
      }
      return { ok: true } as any;
    },
    getInvoices: async () => {
      const snapshot = await getDocs(collection(db, 'invoices'));
      const invoices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { ok: true, json: async () => invoices } as any;
    },
    generateInvoice: async (paymentId: string) => {
      return { ok: true } as any;
    },
    sendMessage: async (data: { userId: string, content: string, invoiceId?: string }) => {
      await addDoc(collection(db, 'messages'), {
        ...data,
        read: false,
        createdAt: serverTimestamp()
      });
      return { ok: true } as any;
    },
    getReviews: async () => {
      const snapshot = await getDocs(collection(db, 'reviews'));
      const reviews = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return { ok: true, json: async () => reviews } as any;
    },
    approveReview: async (id: string) => {
      await updateDoc(doc(db, 'reviews', id), { status: 'approved' });
      return { ok: true } as any;
    },
    deleteReview: async (id: string) => {
      await deleteDoc(doc(db, 'reviews', id));
      return { ok: true } as any;
    },
    getEmails: async () => {
      return { ok: true, json: async () => [] } as any;
    }
  },
  promoCodes: {
    validate: async (code: string) => {
      const q = query(collection(db, 'promo_codes'), where('code', '==', code));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const promo = snapshot.docs[0].data();
        return { ok: true, json: async () => ({ valid: true, discount: promo.discount }) } as any;
      }
      return { ok: true, json: async () => ({ valid: false }) } as any;
    }
  }
};
