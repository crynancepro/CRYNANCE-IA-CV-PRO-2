import React, { useState } from 'react';
import { Lock, Zap, CreditCard, CheckCircle2, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

interface PremiumLockProps {
  children: React.ReactNode;
  feature: 'optimization' | 'letter' | 'analysis';
  title: string;
  description: string;
  price: number;
}

export default function PremiumLock({ children, feature, title, description, price }: PremiumLockProps) {
  const { user } = useAuth();
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  const hasAccess = () => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    
    switch (feature) {
      case 'optimization':
        return user.hasOptimizationAccess || user.isPremium;
      case 'letter':
        return user.hasLetterAccess || user.isPremium;
      case 'analysis':
        return user.hasAnalysisAccess || user.isPremium;
      default:
        return false;
    }
  };

  const handleAlreadyPaid = async () => {
    if (!user) return;
    setIsRequesting(true);
    try {
      await api.requestPayment({
        userId: user.uid,
        userEmail: user.email || '',
        type: feature,
        amount: price
      });
      setRequestSent(true);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'envoi de la demande. Veuillez réessayer.");
    } finally {
      setIsRequesting(false);
    }
  };

  if (hasAccess()) {
    return <>{children}</>;
  }

  return (
    <div className="relative group">
      <div className="blur-sm pointer-events-none select-none opacity-50">
        {children}
      </div>
      
      <div className="absolute inset-0 flex items-center justify-center p-6 z-10">
        <div className="bg-white/95 backdrop-blur-md p-8 rounded-[2.5rem] shadow-2xl border border-primary/20 max-w-md text-center transform group-hover:scale-105 transition-all duration-300">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock size={32} />
          </div>
          
          <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">
            {title} <span className="text-primary">Premium</span>
          </h3>
          
          <p className="text-slate-600 text-sm mb-6">
            {description}
          </p>
          
          <div className="flex items-center justify-center space-x-2 mb-6">
            <span className="text-3xl font-black text-slate-900">{price}</span>
            <span className="text-slate-500 font-bold uppercase text-xs">FCFA</span>
          </div>
          
          <div className="space-y-3">
            <a
              href={`https://pay.wave.com/m/M_sn_wXlszdyVZOIV/c/sn/?amount=${price}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-primary text-white py-4 rounded-xl font-black flex items-center justify-center space-x-2 hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
            >
              <Zap size={18} />
              <span>Payer via Wave</span>
            </a>

            {requestSent ? (
              <div className="flex items-center justify-center space-x-2 text-emerald-600 font-bold py-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <CheckCircle2 size={18} />
                <span>Demande envoyée à l'admin</span>
              </div>
            ) : (
              <button
                onClick={handleAlreadyPaid}
                disabled={isRequesting}
                className="w-full bg-slate-100 text-slate-700 py-4 rounded-xl font-black flex items-center justify-center space-x-2 hover:bg-slate-200 transition-all disabled:opacity-50"
              >
                {isRequesting ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                <span>J'ai déjà payé</span>
              </button>
            )}
          </div>
          
          <div className="mt-6 flex items-center justify-center space-x-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            <CreditCard size={10} />
            <span>Paiement sécurisé via Wave</span>
          </div>
        </div>
      </div>
    </div>
  );
}

