
// Client-side "Backend" using localStorage
// This replaces all /api calls for a purely static deployment

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

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
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      
      const clonedResponse = response.clone();
      
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      return clonedResponse;
    },
    register: async (userData: any) => {
      return fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
    },
    getProfile: async () => {
      return fetch('/api/profile', {
        headers: { ...getAuthHeader() }
      });
    },
    forgotPassword: async (email: string) => {
      return fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
    },
    resetPassword: async (data: any) => {
      return fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    },
    getReferrals: async () => {
      return fetch('/api/referrals', {
        headers: { ...getAuthHeader() }
      });
    },
    updateProfile: async (profileData: any) => {
      return fetch('/api/profile', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(profileData)
      });
    }
  },
  cvs: {
    list: async () => {
      return fetch('/api/cvs', {
        headers: { ...getAuthHeader() }
      });
    },
    save: async (cvData: any) => {
      return fetch('/api/cvs', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ 
          id: cvData.id || 'current-cv', 
          data: cvData,
          atsScore: cvData.atsScore,
          isOptimized: cvData.isOptimized
        })
      });
    },
    delete: async (id: string) => {
      return fetch(`/api/cvs/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { ...getAuthHeader() }
      });
    }
  },
  letters: {
    list: async () => {
      return fetch('/api/cover-letters', {
        headers: { ...getAuthHeader() }
      });
    },
    save: async (letterData: any) => {
      return fetch('/api/cover-letters', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ id: letterData.id || Date.now().toString(), data: letterData, content: letterData.content })
      });
    },
    delete: async (id: string) => {
      return fetch(`/api/cover-letters/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { ...getAuthHeader() }
      });
    }
  },
  payments: {
    history: async () => {
      return fetch('/api/payments/history', {
        headers: { ...getAuthHeader() }
      });
    },
    request: async (data: any) => {
      return fetch('/api/payment/request', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(data)
      });
    }
  },
  invoices: {
    list: async () => {
      return fetch('/api/invoices', {
        headers: { ...getAuthHeader() }
      });
    }
  },
  ia: {
    consume: async (type: 'cv' | 'letter') => {
      return fetch('/api/ia/consume', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({ type })
      });
    }
  },
  messages: {
    list: async () => {
      return fetch('/api/messages', {
        headers: { ...getAuthHeader() }
      });
    },
    markAsRead: async (id: number) => {
      return fetch(`/api/messages/${id}/read`, {
        method: 'POST',
        headers: { ...getAuthHeader() }
      });
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
      return fetch('/api/admin/stats', {
        headers: { ...getAuthHeader() }
      });
    },
    getRevenueStats: async () => {
      return fetch('/api/admin/revenue-stats', {
        headers: { ...getAuthHeader() }
      });
    },
    getIAStats: async () => {
      return fetch('/api/admin/ia-stats', {
        headers: { ...getAuthHeader() }
      });
    },
    getReferralStats: async () => {
      return fetch('/api/admin/referral-stats', {
        headers: { ...getAuthHeader() }
      });
    },
    getUsers: async () => {
      return fetch('/api/admin/users', {
        headers: { ...getAuthHeader() }
      });
    },
    banUser: async (id: number) => {
      return fetch(`/api/admin/users/${id}/ban`, {
        method: 'POST',
        headers: { ...getAuthHeader() }
      });
    },
    deleteUser: async (id: number) => {
      return fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { ...getAuthHeader() }
      });
    },
    getPayments: async () => {
      return fetch('/api/admin/payments', {
        headers: { ...getAuthHeader() }
      });
    },
    getPromos: async () => {
      return fetch('/api/admin/promo-codes', {
        headers: { ...getAuthHeader() }
      });
    },
    createPromo: async (promoData: any) => {
      return fetch('/api/admin/promo-codes', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(promoData)
      });
    },
    deletePromo: async (id: number) => {
      return fetch(`/api/admin/promo-codes/${id}`, {
        method: 'DELETE',
        headers: { ...getAuthHeader() }
      });
    },
    confirmPayment: async (id: number) => {
      return fetch(`/api/admin/payments/${id}/confirm`, {
        method: 'POST',
        headers: { ...getAuthHeader() }
      });
    },
    getInvoices: async () => {
      return fetch('/api/admin/invoices', {
        headers: { ...getAuthHeader() }
      });
    },
    generateInvoice: async (paymentId: number) => {
      return fetch(`/api/admin/payments/${paymentId}/generate-invoice`, {
        method: 'POST',
        headers: { ...getAuthHeader() }
      });
    },
    sendMessage: async (data: { userId: number, content: string, invoiceId?: number }) => {
      return fetch('/api/admin/messages/send', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(data)
      });
    },
    getReviews: async () => {
      return fetch('/api/admin/reviews', {
        headers: { ...getAuthHeader() }
      });
    },
    approveReview: async (id: number) => {
      return fetch(`/api/admin/reviews/${id}/approve`, {
        method: 'PATCH',
        headers: { ...getAuthHeader() }
      });
    },
    deleteReview: async (id: number) => {
      return fetch(`/api/admin/reviews/${id}`, {
        method: 'DELETE',
        headers: { ...getAuthHeader() }
      });
    },
    getEmails: async () => {
      return fetch('/api/admin/emails', {
        headers: { ...getAuthHeader() }
      });
    }
  },
  promoCodes: {
    validate: async (code: string) => {
      return fetch(`/api/promo-codes/validate/${code}`);
    }
  }
};
