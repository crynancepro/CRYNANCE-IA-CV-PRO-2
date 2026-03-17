import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Check, Zap, CreditCard, ShieldCheck, Sparkles, Loader2, AlertCircle, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Premium() {
  const [promoCode, setPromoCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const plans = [
    {
      id: 'analysis',
      name: 'Analyse CV / Score ATS',
      price: 200,
      icon: <FileText className="text-blue-500" size={32} />,
      color: 'from-blue-400 to-blue-600',
      waveLink: 'https://pay.wave.com/m/M_sn_wXlszdyVZOIV/c/sn/?amount=200',
      features: ['Calcul du score ATS', 'Diagnostic complet', 'Conseils de correction', 'Accès immédiat']
    },
    {
      id: 'letter',
      name: 'Lettre de Motivation',
      price: 300,
      icon: <Sparkles className="text-purple-500" size={32} />,
      color: 'from-purple-500 to-pink-600',
      waveLink: 'https://pay.wave.com/m/M_sn_wXlszdyVZOIV/c/sn/?amount=300',
      features: ['Rédaction IA sur mesure', 'Adaptée au poste visé', 'Style professionnel', 'Prête à l\'emploi']
    },
    {
      id: 'optimization',
      name: 'Optimisation CV Pro',
      price: 500,
      icon: <Zap className="text-amber-500" size={32} />,
      color: 'from-amber-500 to-orange-600',
      waveLink: 'https://pay.wave.com/m/M_sn_wXlszdyVZOIV/c/sn/?amount=500',
      features: ['Adaptation à l\'offre d\'emploi', 'Mots-clés optimisés', 'Mise en page pro', 'Support prioritaire']
    }
  ];

  const handleValidatePromo = async () => {
    if (!promoCode) return;
    setIsValidating(true);
    setError('');
    setSuccess('');
    try {
      const response = await api.promoCodes.validate(promoCode);
      const data = await response.json() as any;
      if (data.valid) {
        setDiscount(data.discount);
        setSuccess(`Code promo appliqué : -${data.discount} FCFA`);
      } else {
        setError('Code promo invalide');
        setDiscount(0);
      }
    } catch (err) {
      setError('Erreur lors de la validation');
    } finally {
      setIsValidating(false);
    }
  };

  const handlePayment = async (planId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }

    setIsProcessing(true);
    try {
      const plan = plans.find(p => p.id === planId);
      const response = await api.payments.request({ type: planId, amount: plan?.price });
      const data = await response.json() as any;
      if (data.success) {
        alert("Demande de paiement envoyée ! Un administrateur validera votre accès sous peu.");
        navigate('/dashboard');
      }
    } catch (err) {
      alert('Erreur lors de la demande de paiement');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="pt-32 pb-20 px-4 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-bold mb-4"
          >
            <Zap size={16} />
            <span>CRYNANCE IA CV PRO 2</span>
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">
            Choisissez votre <span className="text-primary">Abonnement</span>
          </h1>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            Débloquez le template qui vous correspond et boostez votre carrière dès aujourd'hui.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, idx) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden flex flex-col"
            >
              <div className={`h-2 bg-gradient-to-r ${plan.color}`}></div>
              <div className="p-8 flex-1 flex flex-col">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                    {plan.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">{plan.name}</h3>
                  <div className="flex items-baseline space-x-1 mt-2">
                    <span className="text-3xl font-black text-slate-900">{plan.price}</span>
                    <span className="text-slate-500 font-bold">FCFA</span>
                  </div>
                </div>

                <ul className="space-y-4 mb-8 flex-1">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center space-x-3 text-slate-600 text-sm">
                      <div className="w-5 h-5 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <Check size={12} />
                      </div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="space-y-3">
                  <a
                    href={plan.waveLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-[#1c96e8] hover:bg-[#167dc2] text-white py-4 rounded-2xl font-black flex items-center justify-center space-x-3 transition-all shadow-lg shadow-[#1c96e8]/20"
                  >
                    <CreditCard size={20} />
                    <span>Payer avec Wave</span>
                  </a>

                  <button
                    onClick={() => handlePayment(plan.id)}
                    disabled={isProcessing}
                    className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black flex items-center justify-center space-x-3 transition-all hover:bg-slate-800 disabled:opacity-50"
                  >
                    {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <ShieldCheck size={20} />}
                    <span>J'ai déjà payé</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Promo Code Section */}
        <div className="mt-16 max-w-md mx-auto bg-white p-8 rounded-[2rem] shadow-lg border border-slate-100">
          <h4 className="font-bold text-slate-900 mb-4 flex items-center space-x-2">
            <Sparkles className="text-primary" size={20} />
            <span>Vous avez un code promo ?</span>
          </h4>
          <div className="flex space-x-2">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 outline-none focus:border-primary transition-all"
              placeholder="CODE PROMO"
            />
            <button
              onClick={handleValidatePromo}
              disabled={isValidating || !promoCode}
              className="bg-primary text-white px-6 py-2 rounded-xl font-bold transition-all disabled:opacity-50"
            >
              {isValidating ? <Loader2 className="animate-spin" size={18} /> : "Vérifier"}
            </button>
          </div>
          {error && <p className="text-red-500 text-xs mt-2 flex items-center space-x-1"><AlertCircle size={12} /> <span>{error}</span></p>}
          {success && <p className="text-emerald-500 text-xs mt-2 flex items-center space-x-1"><Check size={12} /> <span>{success}</span></p>}
        </div>
      </div>
    </div>
  );
}
