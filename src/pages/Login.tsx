import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, Lock, Loader2, User as UserIcon, AlertCircle } from 'lucide-react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || "/dashboard";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      if (email === 'peter25ngouala@gmail.com') {
        navigate('/admin');
      } else {
        navigate(from, { replace: true });
      }
    } catch (error: any) {
      console.error("Firebase Login Error:", error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setError('Email ou mot de passe incorrect.');
      } else if (error.code === 'auth/unauthorized-domain') {
        setError('Ce domaine n\'est pas autorisé dans la console Firebase. Veuillez ajouter votre lien Vercel aux domaines autorisés.');
      } else if (error.code === 'auth/operation-not-allowed') {
        setError('La connexion par Email/Mot de passe n\'est pas activée dans votre console Firebase (Authentication > Sign-in method).');
      } else if (error.code === 'auth/network-request-failed') {
        setError('Erreur réseau. Vérifiez votre connexion internet.');
      } else {
        setError(`Erreur: ${error.message || 'Une erreur est survenue lors de la connexion.'}`);
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
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-6">
            <UserIcon size={32} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Connexion</h1>
          <p className="text-slate-500 mt-2">Accédez à vos CV et lettres de motivation.</p>
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

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-primary outline-none transition-all" 
                placeholder="votre@email.com" 
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-700">Mot de passe</label>
              <Link to="/forgot-password" className="text-sm font-bold text-primary hover:text-primary-dark transition-colors">
                Mot de passe oublié ?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
            {isLoading ? <Loader2 className="animate-spin" size={24} /> : <span>Se connecter</span>}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-slate-500 text-sm">
            Pas encore de compte ?{' '}
            <Link to="/register" className="text-primary font-bold hover:underline">S'inscrire</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
