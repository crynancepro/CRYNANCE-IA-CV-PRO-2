import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export default function Register() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    referredBy: null as number | null
  });
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ref = params.get('ref');
    if (ref) {
      setFormData(prev => ({ ...prev, referredBy: parseInt(ref) }));
    }
  }, [location]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // Save user profile to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        referredBy: formData.referredBy,
        isPremium: false,
        role: 'user',
        cvGenerationsRemaining: 1, // Initial free credits
        letterGenerationsRemaining: 1,
        createdAt: new Date().toISOString()
      });

      navigate('/dashboard');
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/email-already-in-use') {
        setError('Cet email est déjà utilisé.');
      } else if (error.code === 'auth/weak-password') {
        setError('Le mot de passe est trop faible.');
      } else {
        setError('Une erreur est survenue lors de l\'inscription.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 flex items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 p-10 md:p-12"
      >
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-slate-900">Créer un compte</h1>
          <p className="text-slate-500 mt-2">Rejoignez des milliers de professionnels.</p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-center space-x-3"
          >
            <AlertCircle size={20} className="flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleRegister} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Prénom</label>
              <input 
                type="text" 
                required 
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-primary outline-none transition-all" 
                placeholder="Jean" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Nom</label>
              <input 
                type="text" 
                required 
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-primary outline-none transition-all" 
                placeholder="Dupont" 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="email" 
                required 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-primary outline-none transition-all" 
                placeholder="votre@email.com" 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Téléphone</label>
            <input 
              type="tel" 
              required 
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-primary outline-none transition-all" 
              placeholder="+221 ..." 
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="password" 
                required 
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-primary outline-none transition-all" 
                placeholder="••••••••" 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center space-x-2 hover:bg-primary-dark transition-all shadow-xl shadow-primary/20 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="animate-spin" size={24} /> : <span>S'inscrire</span>}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-slate-500 text-sm">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-primary font-bold hover:underline">Se connecter</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
