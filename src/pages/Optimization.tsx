import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { FileText, Zap, Loader2, CheckCircle2, AlertCircle, ArrowRight, Sparkles, Upload } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import PremiumLock from '../components/PremiumLock';
import { optimizeCVForJobOffer, parseCVFromFile } from '../services/geminiService';
import { storage } from '../utils/storage';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Optimization() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cvs, setCvs] = useState<any[]>([]);
  const [selectedCv, setSelectedCv] = useState<any>(null);
  const [jobOffer, setJobOffer] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [optimizedCv, setOptimizedCv] = useState<any>(null);
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const parsedData = await parseCVFromFile(base64, file.type);
        setSelectedCv({ data: parsedData, id: 'uploaded' });
        setNotification({ message: "CV importé et analysé avec succès !", type: 'success' });
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setNotification({ message: "Erreur lors de l'importation du CV", type: 'error' });
    } finally {
      setIsParsing(false);
    }
  };

  const handleOptimize = async () => {
    if (!selectedCv || !jobOffer.trim()) return;
    setIsOptimizing(true);
    try {
      // Consommer un crédit
      const consumeRes = await api.ia.consume('optimization');
      if (!consumeRes.ok) {
        const err = await consumeRes.json();
        throw new Error(err.error || "Erreur lors de la consommation du crédit");
      }

      const result = await optimizeCVForJobOffer(selectedCv.data, jobOffer);
      setOptimizedCv(result);
      setNotification({ message: "CV optimisé avec succès !", type: 'success' });
    } catch (err: any) {
      console.error(err);
      setNotification({ message: err.message || "Erreur lors de l'optimisation", type: 'error' });
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleSaveAndPreview = () => {
    if (!optimizedCv) return;
    storage.saveCV(optimizedCv);
    navigate('/cv-preview');
  };

  return (
    <div className="pt-24 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 bg-primary/10 rounded-[2rem] flex items-center justify-center text-primary mx-auto mb-6"
          >
            <Zap size={40} />
          </motion.div>
          <h1 className="text-4xl font-black text-slate-900 mb-4">Optimisation CV IA</h1>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto">
            Adaptez votre CV spécifiquement pour une offre d'emploi en quelques secondes grâce à notre IA avancée.
          </p>
        </div>

        <PremiumLock 
          feature="optimization"
          title="Optimisation CV"
          description="L'IA adapte votre CV automatiquement avec les mots-clés ATS et les compétences requises."
          price={500}
        >
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-100 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-black text-slate-400 uppercase tracking-widest">1. Sélectionnez le CV à optimiser</label>
                <div className="relative">
                  <input
                    type="file"
                    id="cv-upload"
                    className="hidden"
                    accept=".pdf,.doc,.docx,image/*"
                    onChange={handleFileUpload}
                  />
                  <label
                    htmlFor="cv-upload"
                    className="flex items-center space-x-2 text-primary hover:text-primary/80 cursor-pointer font-bold text-sm"
                  >
                    {isParsing ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <Upload size={16} />
                    )}
                    <span>Importer un fichier (PDF, Word, Photo)</span>
                  </label>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {selectedCv?.id === 'uploaded' && (
                  <button
                    onClick={() => setSelectedCv(selectedCv)}
                    className="p-4 rounded-2xl border-2 transition-all text-left flex items-center space-x-3 border-primary bg-primary/5"
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary text-white">
                      <FileText size={20} />
                    </div>
                    <div className="flex-1 truncate">
                      <p className="font-bold text-slate-900 truncate">CV Importé</p>
                      <p className="text-[10px] text-slate-500 uppercase font-black">Prêt pour l'optimisation</p>
                    </div>
                  </button>
                )}
                {cvs.map((cv) => (
                  <button
                    key={cv.id}
                    onClick={() => setSelectedCv(cv)}
                    className={`p-4 rounded-2xl border-2 transition-all text-left flex items-center space-x-3 ${selectedCv?.id === cv.id ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-slate-200'}`}
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
              </div>
              {cvs.length === 0 && (
                <p className="text-center py-8 text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  Vous n'avez pas encore de CV enregistré.
                </p>
              )}
            </div>

            <div className="space-y-4">
              <label className="text-sm font-black text-slate-400 uppercase tracking-widest">2. Collez l'offre d'emploi</label>
              <textarea
                value={jobOffer}
                onChange={(e) => setJobOffer(e.target.value)}
                placeholder="Copiez et collez ici le texte de l'annonce (description du poste, compétences requises...)"
                className="w-full h-48 p-6 rounded-3xl bg-slate-50 border border-slate-200 focus:border-primary outline-none transition-all resize-none font-medium text-slate-700"
              />
            </div>

            <button
              onClick={handleOptimize}
              disabled={isOptimizing || !selectedCv || !jobOffer.trim()}
              className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black text-lg flex items-center justify-center space-x-3 hover:bg-primary transition-all shadow-2xl shadow-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isOptimizing ? (
                <>
                  <Loader2 className="animate-spin" size={24} />
                  <span>Optimisation en cours...</span>
                </>
              ) : (
                <>
                  <Sparkles size={24} />
                  <span>Optimiser mon CV maintenant</span>
                </>
              )}
            </button>

            {optimizedCv && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-8 bg-emerald-50 rounded-[2rem] border border-emerald-100 text-center"
              >
                <div className="w-16 h-16 bg-emerald-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-2xl font-black text-emerald-900 mb-2">Optimisation terminée !</h3>
                <p className="text-emerald-700 mb-8">Votre CV a été adapté avec les mots-clés et compétences de l'offre.</p>
                <button
                  onClick={handleSaveAndPreview}
                  className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black flex items-center justify-center space-x-2 mx-auto hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200"
                >
                  <span>Voir et Télécharger le CV optimisé</span>
                  <ArrowRight size={20} />
                </button>
              </motion.div>
            )}
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
