
// Client-side "Backend" using localStorage
// This replaces all /api calls for a purely static deployment

const STORAGE_KEYS = {
  USERS: 'cv_app_users',
  CVS: 'cv_app_cvs',
  LETTERS: 'cv_app_letters',
  PAYMENTS: 'cv_app_payments',
  PROMOS: 'cv_app_promos',
  CURRENT_USER: 'user',
  TOKEN: 'token'
};

// Helper to get data from localStorage
const get = (key: string) => JSON.parse(localStorage.getItem(key) || '[]');
const set = (key: string, data: any) => localStorage.setItem(key, JSON.stringify(data));

// Initialize Admin Account
const initAdmin = () => {
  const users = get(STORAGE_KEYS.USERS);
  const adminEmail = 'peter25ngouala@gmail.com';
  const adminPassword = 'Peter2005';
  
  if (!users.find((u: any) => u.email === adminEmail)) {
    users.push({
      id: 'admin-1',
      firstName: 'Peter',
      lastName: 'Admin',
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      isPremium: 1,
      createdAt: new Date().toISOString()
    });
    set(STORAGE_KEYS.USERS, users);
  }
};

initAdmin();

export const api = {
  auth: {
    login: async (credentials: any) => {
      const users = get(STORAGE_KEYS.USERS);
      const user = users.find((u: any) => u.email === credentials.email && u.password === credentials.password);
      
      if (user) {
        const { password, ...userWithoutPassword } = user;
        // Ensure specific admin always has admin role
        if (user.email === 'peter25ngouala@gmail.com') {
          userWithoutPassword.role = 'admin';
        }
        localStorage.setItem(STORAGE_KEYS.TOKEN, 'mock-token-' + user.id);
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(userWithoutPassword));
        return { ok: true, json: async () => ({ token: 'mock-token', user: userWithoutPassword }) };
      }
      return { ok: false, status: 401, json: async () => ({ message: 'Identifiants invalides' }) };
    },
    register: async (userData: any) => {
      const users = get(STORAGE_KEYS.USERS);
      if (users.find((u: any) => u.email === userData.email)) {
        return { ok: false, status: 400, json: async () => ({ message: 'Email déjà utilisé' }) };
      }
      const newUser = { 
        ...userData, 
        id: Date.now(), 
        role: userData.email === 'peter25ngouala@gmail.com' ? 'admin' : 'user',
        isPremium: userData.email === 'peter25ngouala@gmail.com' ? 1 : 0,
        createdAt: new Date().toISOString()
      };
      users.push(newUser);
      set(STORAGE_KEYS.USERS, users);
      return { ok: true, json: async () => ({ message: 'Inscription réussie' }) };
    },
    getProfile: async () => {
      const user = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || 'null');
      if (user) {
        // Refresh from "db"
        const users = get(STORAGE_KEYS.USERS);
        const updatedUser = users.find((u: any) => u.id === user.id);
        if (updatedUser) {
          const { password, ...safeUser } = updatedUser;
          localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(safeUser));
          return { ok: true, json: async () => safeUser };
        }
      }
      return { ok: false, status: 401 };
    }
  },
  cvs: {
    list: async () => {
      const user = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || 'null');
      const cvs = get(STORAGE_KEYS.CVS).filter((cv: any) => cv.userId === user?.id);
      return { ok: true, json: async () => cvs };
    },
    save: async (cvData: any) => {
      const user = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || 'null');
      const cvs = get(STORAGE_KEYS.CVS);
      const index = cvs.findIndex((cv: any) => cv.id === cvData.id);
      
      const newCv = { ...cvData, userId: user?.id, updatedAt: new Date().toISOString() };
      if (index > -1) {
        cvs[index] = newCv;
      } else {
        cvs.push({ ...newCv, id: cvData.id || Date.now().toString() });
      }
      set(STORAGE_KEYS.CVS, cvs);
      return { ok: true, json: async () => ({ success: true }) };
    },
    delete: async (id: string) => {
      const cvs = get(STORAGE_KEYS.CVS).filter((cv: any) => cv.id !== id);
      set(STORAGE_KEYS.CVS, cvs);
      return { ok: true };
    }
  },
  letters: {
    list: async () => {
      const user = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || 'null');
      const letters = get(STORAGE_KEYS.LETTERS).filter((l: any) => l.userId === user?.id);
      return { ok: true, json: async () => letters };
    },
    save: async (letterData: any) => {
      const user = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || 'null');
      const letters = get(STORAGE_KEYS.LETTERS);
      const index = letters.findIndex((l: any) => l.id === letterData.id);
      
      const newLetter = { ...letterData, userId: user?.id, updatedAt: new Date().toISOString() };
      if (index > -1) {
        letters[index] = newLetter;
      } else {
        letters.push({ ...newLetter, id: letterData.id || Date.now().toString() });
      }
      set(STORAGE_KEYS.LETTERS, letters);
      return { ok: true, json: async () => ({ success: true }) };
    },
    delete: async (id: string) => {
      const letters = get(STORAGE_KEYS.LETTERS).filter((l: any) => l.id !== id);
      set(STORAGE_KEYS.LETTERS, letters);
      return { ok: true };
    }
  },
  payments: {
    history: async () => {
      const user = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || 'null');
      const payments = get(STORAGE_KEYS.PAYMENTS).filter((p: any) => p.userId === user?.id);
      return { ok: true, json: async () => payments };
    },
    request: async (data: any) => {
      const user = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || 'null');
      const payments = get(STORAGE_KEYS.PAYMENTS);
      const newPayment = {
        ...data,
        id: Date.now(),
        userId: user?.id,
        userEmail: user?.email,
        userName: `${user?.firstName} ${user?.lastName}`,
        status: 'En attente',
        createdAt: new Date().toISOString()
      };
      payments.push(newPayment);
      set(STORAGE_KEYS.PAYMENTS, payments);
      return { ok: true, json: async () => ({ success: true }) };
    }
  },
  admin: {
    getStats: async () => {
      const users = get(STORAGE_KEYS.USERS);
      const payments = get(STORAGE_KEYS.PAYMENTS);
      const cvs = get(STORAGE_KEYS.CVS);
      return { ok: true, json: async () => ({
        users: users.length,
        payments: payments.filter((p: any) => p.status === 'Confirmé').length,
        cvs: cvs.length,
        pending: payments.filter((p: any) => p.status === 'En attente').length
      })};
    },
    getUsers: async () => {
      return { ok: true, json: async () => get(STORAGE_KEYS.USERS) };
    },
    getPayments: async () => {
      return { ok: true, json: async () => get(STORAGE_KEYS.PAYMENTS) };
    },
    getPromos: async () => {
      return { ok: true, json: async () => get(STORAGE_KEYS.PROMOS) };
    },
    createPromo: async (promoData: any) => {
      const promos = get(STORAGE_KEYS.PROMOS);
      const newPromo = { ...promoData, id: Date.now() };
      promos.push(newPromo);
      set(STORAGE_KEYS.PROMOS, promos);
      return { ok: true, json: async () => newPromo };
    },
    deletePromo: async (id: number) => {
      const promos = get(STORAGE_KEYS.PROMOS).filter((p: any) => p.id !== id);
      set(STORAGE_KEYS.PROMOS, promos);
      return { ok: true };
    },
    confirmPayment: async (id: number) => {
      const payments = get(STORAGE_KEYS.PAYMENTS);
      const payment = payments.find((p: any) => p.id === id);
      if (payment) {
        payment.status = 'Confirmé';
        set(STORAGE_KEYS.PAYMENTS, payments);
        
        // Update user premium status
        const users = get(STORAGE_KEYS.USERS);
        const user = users.find((u: any) => u.id === payment.userId);
        if (user) {
          const expiry = new Date();
          expiry.setHours(expiry.getHours() + 24);
          const expiryStr = expiry.toISOString();
          
          if (payment.type === 'modern') user.modernExpiresAt = expiryStr;
          if (payment.type === 'classic') user.classicExpiresAt = expiryStr;
          if (payment.type === 'creative') user.creativeExpiresAt = expiryStr;
          
          user.isPremium = 1;
          set(STORAGE_KEYS.USERS, users);
        }
      }
      return { ok: true };
    }
  },
  promoCodes: {
    validate: async (code: string) => {
      const promos = get(STORAGE_KEYS.PROMOS);
      const promo = promos.find((p: any) => p.code === code);
      if (promo) {
        return { ok: true, json: async () => ({ valid: true, discount: promo.discount }) };
      }
      return { ok: true, json: async () => ({ valid: false }) };
    }
  }
};
