import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Zap, Loader2, CheckCircle2, AlertCircle, FileText, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import PremiumLock from '../components/PremiumLock';
import { scoreCV } from '../services/geminiService';

export default function ATSAnalysis() {
  const { user } = useAuth();
  const [cvs, setCvs] = useState<any[]>([]);
  const [selectedCv, setSelectedCv] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [atsResult, setAtsResult] = useState<any>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'cvs'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      setCvs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, [user]);

  const handleAnalyze = async () => {
    if (!selectedCv) return;
    setIsAnalyzing(true);
    try {
      const result = await scoreCV(selectedCv.data);
      setAtsResult(result);
      setNotification({ message: "Analyse terminée !", type: 'success' });
    } catch (err) {
      console.error(err);
      setNotification({ message: "Erreur lors de l'analyse", type: 'error' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="pt-24 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 bg-emerald-100 rounded-[2rem] flex items-center justify-center text-emerald-600 mx-auto mb-6"
          >
            <Search size={40} />
          </motion.div>
          <h1 className="text-4xl font-black text-slate-900 mb-4">Analyse Score ATS</h1>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">
            Découvrez comment les logiciels de recrutement (ATS) voient votre CV et obtenez des conseils pour l'améliorer.
          </p>
        </div>

        <PremiumLock 
          feature="analysis"
          title="Analyse ATS"
          description="Découvrez comment les logiciels de recrutement voient votre CV et obtenez des conseils."
          price={200}
        >
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 space-y-8">
              <div className="space-y-4">
                <label className="text-sm font-black text-slate-400 uppercase tracking-widest">Sélectionnez votre CV</label>
                <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {cvs.map((cv) => (
                    <button
                      key={cv.id}
                      onClick={() => setSelectedCv(cv)}
                      className={`w-full p-4 rounded-2xl border-2 transition-all text-left flex items-center space-x-3 ${selectedCv?.id === cv.id ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-slate-200'}`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedCv?.id === cv.id ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>
                        <FileText size={20} />
                      </div>
                      <div className="flex-1 truncate">
                        <p className="font-bold text-slate-900 truncate">{cv.data.firstName} {cv.data.lastName}</p>
                        <p className="text-[10px] text-slate-500 uppercase font-black">{new Date(cv.createdAt).toLocaleDateString()}</p>
                      </div>
                    </button>
                  ))}
                  {cvs.length === 0 && (
                    <p className="text-center py-8 text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      Aucun CV trouvé.
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !selectedCv}
                className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black text-lg flex items-center justify-center space-x-3 hover:bg-primary transition-all shadow-2xl shadow-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="animate-spin" size={24} />
                    <span>Analyse en cours...</span>
                  </>
                ) : (
                  <>
                    <Zap size={24} />
                    <span>Lancer l'analyse ATS</span>
                  </>
                )}
              </button>
            </div>

            <div className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100 min-h-[400px] flex flex-col items-center justify-center text-center shadow-inner">
              {atsResult ? (
                <div className="w-full text-left space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-black text-slate-900">Résultats de l'analyse</h3>
                    <div className={`px-4 py-2 rounded-2xl font-black text-2xl shadow-lg ${atsResult.score >= 80 ? 'bg-emerald-500 text-white' : atsResult.score >= 60 ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'}`}>
                      {atsResult.score}/100
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center space-x-2">
                        <CheckCircle2 size={14} className="text-emerald-500" />
                        <span>Points Forts</span>
                      </h4>
                      <ul className="space-y-2">
                        {atsResult.strengths.map((s: string, i: number) => (
                          <li key={i} className="text-sm text-slate-700 flex items-start space-x-2 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                            <span className="text-emerald-500 mt-1 font-black">•</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center space-x-2">
                        <AlertCircle size={14} className="text-amber-500" />
                        <span>Points d'amélioration</span>
                      </h4>
                      <ul className="space-y-2">
                        {atsResult.weaknesses.map((w: string, i: number) => (
                          <li key={i} className="text-sm text-slate-700 flex items-start space-x-2 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                            <span className="text-amber-500 mt-1 font-black">•</span>
                            <span>{w}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10 shadow-sm">
                      <h4 className="text-xs font-black text-primary uppercase tracking-widest mb-2 flex items-center space-x-2">
                        <Sparkles size={14} />
                        <span>Conseil d'expert</span>
                      </h4>
                      <p className="text-sm text-slate-700 italic leading-relaxed">
                        {atsResult.advice[0]}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-24 h-24 bg-white rounded-[2rem] shadow-xl flex items-center justify-center text-slate-200 mb-6">
                    <Search size={48} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2">En attente d'analyse</h3>
                  <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
                    Sélectionnez un CV à gauche et cliquez sur le bouton pour obtenir votre score ATS et des conseils personnalisés.
                  </p>
                </>
              )}
            </div>
          </div>
        </PremiumLock>

        {notification && (
          <div className={`fixed bottom-8 right-8 px-6 py-4 rounded-2xl shadow-2xl z-50 flex items-center space-x-3 animate-bounce ${notification.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
            {notification.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
            <span className="font-bold">{notification.message}</span>
          </div>
        )}
      </div>
    </div>
  );
}
