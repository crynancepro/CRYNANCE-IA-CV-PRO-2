import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  FileText, Plus, Trash2, Edit, ExternalLink, 
  Loader2, User as UserIcon, CreditCard, Zap, 
  Mail, Phone, Save, Clock, HelpCircle, ArrowRight,
  MessageSquare, Receipt, Download, Eye, Bell, Users,
  CheckCircle2, AlertCircle, Search, ShieldCheck, Upload
} from 'lucide-react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, addDoc, getDoc, orderBy } from 'firebase/firestore';
import { storage } from '../utils/storage';
import { InvoicePDF } from '../components/InvoicePDF';
import PremiumLock from '../components/PremiumLock';
import { Invoice, Message } from '../types';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { scoreCV, parseCVFromFile } from '../services/geminiService';

const CountdownTimer = ({ expiryDate, onExpire }: { expiryDate: string, onExpire: () => void }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiryDate).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft('Expiré');
        onExpire();
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeLeft(`${days}j ${hours}h ${minutes}m`);
      } else {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [expiryDate, onExpire]);

  return <span>{timeLeft}</span>;
};

export default function Dashboard() {
  const [cvs, setCvs] = useState<any[]>([]);
  const [letters, setLetters] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ message: string, onConfirm: () => void } | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const [activeTab, setActiveTab] = useState<'cvs' | 'letters' | 'payments' | 'messages' | 'invoices' | 'referral' | 'profile' | 'ats'>('cvs');
  const [payments, setPayments] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [selectedCvForAts, setSelectedCvForAts] = useState<any | null>(null);
  const [atsResult, setAtsResult] = useState<any | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    phone: ''
  });
  const navigate = useNavigate();
  const { user, firebaseUser, refreshProfile } = useAuth();

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || ''
      });
      
      // Real-time listener for CVs
      const qCvs = query(collection(db, 'cvs'), where('userId', '==', user.uid));
      const unsubscribeCvs = onSnapshot(qCvs, (snapshot) => {
        const cvsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCvs(cvsData);
        setIsLoading(false);
      }, (error) => {
        console.error("Error fetching CVs:", error);
        setIsLoading(false);
      });

      // Real-time listener for Letters
      const qLetters = query(collection(db, 'cover_letters'), where('userId', '==', user.uid));
      const unsubscribeLetters = onSnapshot(qLetters, (snapshot) => {
        const lettersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setLetters(lettersData);
      }, (error) => {
        console.error("Error fetching Letters:", error);
      });

      // Real-time listener for Payments
      const qPayments = query(collection(db, 'payments'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
      const unsubscribePayments = onSnapshot(qPayments, (snapshot) => {
        const paymentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPayments(paymentsData);
      }, (error) => {
        console.error("Error fetching Payments:", error);
      });

      // Real-time listener for Invoices
      const qInvoices = query(collection(db, 'invoices'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
      const unsubscribeInvoices = onSnapshot(qInvoices, (snapshot) => {
        const invoicesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any as Invoice));
        setInvoices(invoicesData);
      }, (error) => {
        console.error("Error fetching Invoices:", error);
      });

      // Real-time listener for Messages
      const qMessages = query(collection(db, 'messages'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
      const unsubscribeMessages = onSnapshot(qMessages, (snapshot) => {
        const messagesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any as Message));
        setMessages(messagesData);
        setUnreadCount(messagesData.filter(m => !m.isRead).length);
      }, (error) => {
        console.error("Error fetching Messages:", error);
      });

      return () => {
        unsubscribeCvs();
        unsubscribeLetters();
        unsubscribePayments();
        unsubscribeInvoices();
        unsubscribeMessages();
      };
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSavingProfile(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), profileData);
      await refreshProfile();
      setNotification({ message: "Profil mis à jour !", type: 'success' });
    } catch (error) {
      console.error(error);
      setNotification({ message: "Une erreur est survenue lors de la mise à jour du profil.", type: 'error' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploadingPhoto(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        await api.auth.uploadProfilePhoto(base64);
        await refreshProfile();
        setNotification({ message: "Photo de profil mise à jour !", type: 'success' });
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setNotification({ message: "Erreur lors de l'upload de la photo", type: 'error' });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleAtsFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const parsedData = await parseCVFromFile(base64, file.type);
        setSelectedCvForAts({ data: parsedData, id: 'uploaded' });
        setNotification({ message: "CV importé pour analyse !", type: 'success' });
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setNotification({ message: "Erreur lors de l'importation du CV", type: 'error' });
    } finally {
      setIsParsing(false);
    }
  };

  const deleteCv = async (id: string) => {
    setConfirmModal({
      message: "Supprimer ce CV ?",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'cvs', id));
          setNotification({ message: "CV supprimé avec succès", type: 'success' });
        } catch (error) {
          console.error(error);
          setNotification({ message: "Une erreur est survenue lors de la suppression", type: 'error' });
        }
      }
    });
  };

  const saveTestCv = async () => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'cvs'), {
        userId: user.uid,
        title: "Mon CV Test",
        content: "Contenu du CV test",
        createdAt: new Date().toISOString()
      });
      setNotification({ message: "CV test enregistré avec succès !", type: 'success' });
    } catch (error) {
      console.error("Error saving CV:", error);
      setNotification({ message: "Erreur lors de l'enregistrement du CV.", type: 'error' });
    }
  };

  const deleteLetter = async (id: string) => {
    if (!confirm("Supprimer cette lettre ?")) return;
    try {
      await deleteDoc(doc(db, 'cover_letters', id));
      alert("Lettre supprimée avec succès");
    } catch (error) {
      console.error(error);
      alert("Une erreur est survenue lors de la suppression");
    }
  };

  const editCv = (cv: any) => {
    storage.saveCV(cv.data);
    navigate('/create-cv');
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      // await api.messages.markAsRead(id);
      setMessages(messages.map(m => m.id === id ? { ...m, isRead: true } : m));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="pt-24 pb-16 px-4 bg-slate-50 min-h-screen">
      {/* Notification Toast */}
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`fixed top-24 right-4 z-50 p-4 rounded-2xl shadow-2xl border flex items-center space-x-3 ${notification.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-red-50 border-red-100 text-red-600'}`}
        >
          {notification.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <p className="font-bold">{notification.message}</p>
        </motion.div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white p-8 rounded-[2.5rem] shadow-2xl max-w-md w-full"
          >
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-6">
              <AlertCircle size={32} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Confirmation</h3>
            <p className="text-slate-600 font-medium mb-8">{confirmModal.message}</p>
            <div className="flex space-x-4">
              <button
                onClick={() => setConfirmModal(null)}
                className="flex-1 px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(null);
                }}
                className="flex-1 px-6 py-3 rounded-xl font-bold bg-red-600 text-white shadow-lg shadow-red-200 hover:bg-red-700 transition-colors"
              >
                Confirmer
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Bonjour, {user?.firstName}</h1>
            <p className="text-slate-600">Gérez vos CV et lettres de motivation ici.</p>
          </div>
          <div className="flex space-x-4">
            <button 
              onClick={saveTestCv}
              className="bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold flex items-center space-x-2 hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
            >
              <Save size={20} />
              <span>Enregistrer CV Test</span>
            </button>
            <button 
              onClick={() => {
                storage.clearCV();
                navigate('/create-cv');
              }}
              className="bg-primary text-white px-6 py-3 rounded-xl font-bold flex items-center space-x-2 hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
            >
              <Plus size={20} />
              <span>Nouveau CV</span>
            </button>
            <button 
              onClick={() => {
                storage.saveLetterData(null);
                localStorage.removeItem('currentLetterContent');
                navigate('/cover-letter');
              }}
              className="bg-white text-slate-700 border border-slate-200 px-6 py-3 rounded-xl font-bold flex items-center space-x-2 hover:bg-slate-50 transition-all"
            >
              <Plus size={20} />
              <span>Nouvelle Lettre</span>
            </button>
          </div>
        </div>

        <div className="flex space-x-4 mb-8 border-b border-slate-100">
          <button 
            onClick={() => setActiveTab('cvs')}
            className={`pb-4 px-2 text-sm font-bold transition-all border-b-2 ${activeTab === 'cvs' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            Mes CV ({cvs.length})
          </button>
          <button 
            onClick={() => setActiveTab('letters')}
            className={`pb-4 px-2 text-sm font-bold transition-all border-b-2 ${activeTab === 'letters' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            Mes lettres motivation ({letters.length})
          </button>
          <button 
            onClick={() => setActiveTab('payments')}
            className={`pb-4 px-2 text-sm font-bold transition-all border-b-2 ${activeTab === 'payments' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            Mes paiements
          </button>
          <button 
            onClick={() => setActiveTab('invoices')}
            className={`pb-4 px-2 text-sm font-bold transition-all border-b-2 ${activeTab === 'invoices' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            Mes factures ({invoices.length})
          </button>
          <button 
            onClick={() => setActiveTab('referral')}
            className={`pb-4 px-2 text-sm font-bold transition-all border-b-2 ${activeTab === 'referral' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            Parrainage
          </button>
          <button 
            onClick={() => setActiveTab('ats')}
            className={`pb-4 px-2 text-sm font-bold transition-all border-b-2 ${activeTab === 'ats' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            Analyse ATS
          </button>
          <button 
            onClick={() => setActiveTab('messages')}
            className={`pb-4 px-2 text-sm font-bold transition-all border-b-2 relative ${activeTab === 'messages' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            <span>Messages</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            )}
          </button>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Profile Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 space-y-6 sticky top-24">
              <div className="flex flex-col items-center text-center">
                <div className="relative group">
                  <div className="w-24 h-24 bg-slate-100 rounded-[2rem] flex items-center justify-center text-slate-400 mb-4 overflow-hidden border-4 border-white shadow-xl">
                    {user?.photoURL ? (
                      <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon size={40} />
                    )}
                    {isUploadingPhoto && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white">
                        <Loader2 className="animate-spin" size={24} />
                      </div>
                    )}
                  </div>
                  <label htmlFor="photo-upload" className="absolute bottom-2 right-0 w-8 h-8 bg-primary text-white rounded-xl flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 transition-transform">
                    <Plus size={16} />
                    <input type="file" id="photo-upload" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                  </label>
                </div>
                <h3 className="font-bold text-slate-900">{user?.firstName} {user?.lastName}</h3>
                <p className="text-sm text-slate-500">{user?.email}</p>
                {(user?.modernExpiresAt && new Date(user.modernExpiresAt) > new Date()) || 
                 (user?.classicExpiresAt && new Date(user.classicExpiresAt) > new Date()) || 
                 (user?.creativeExpiresAt && new Date(user.creativeExpiresAt) > new Date()) || 
                 user?.isPremium || user?.role === 'admin' ? (
                  <span className="mt-2 px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase rounded-full">Premium Pro Actif</span>
                ) : (
                  <span className="mt-2 px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-black uppercase rounded-full">Compte Gratuit</span>
                )}
              </div>
              
              <div className="pt-6 border-t border-slate-100 space-y-3">
                {['modern', 'classic', 'creative'].map((type) => {
                  const expiry = (user as any)?.[`${type}ExpiresAt`];
                  const isActive = expiry && new Date(expiry) > new Date();
                  
                  return (
                    <div key={type} className={`p-3 rounded-xl flex flex-col border ${isActive ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <Zap size={14} fill={isActive ? "currentColor" : "none"} />
                          <span className="text-xs font-bold capitalize">{type}</span>
                        </div>
                        <span className="text-[10px] font-medium">
                          {isActive ? "Abonnement actif" : "Inactif"}
                        </span>
                      </div>
                      {isActive && (
                        <div className="flex items-center space-x-1 text-[10px] font-bold">
                          <Clock size={10} />
                          <span>Temps restant: </span>
                          <CountdownTimer expiryDate={expiry} onExpire={() => {}} />
                        </div>
                      )}
                      {!isActive && expiry && (
                        <p className="text-[10px] text-red-400 font-bold">Votre abonnement a expiré</p>
                      )}
                    </div>
                  );
                })}
                
                {!user?.isPremium && (
                  <Link to="/premium" className="p-4 rounded-2xl flex items-center justify-between bg-primary text-white hover:bg-primary-dark transition-all shadow-lg shadow-primary/20">
                    <div className="flex items-center space-x-2">
                      <Zap size={18} />
                      <span className="text-sm font-bold">Passer en Pro</span>
                    </div>
                    <ExternalLink size={14} />
                  </Link>
                )}

                <Link to="/help" className="p-4 rounded-2xl flex items-center justify-between bg-slate-50 text-slate-600 hover:bg-slate-100 transition-all border border-slate-100">
                  <div className="flex items-center space-x-2">
                    <HelpCircle size={18} />
                    <span className="text-sm font-bold">Aide & FAQ</span>
                  </div>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'ats' && (
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-black text-slate-900">Analyse & Score ATS</h2>
                  <p className="text-slate-500">Évaluez la performance de votre CV face aux algorithmes de recrutement.</p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                  <ShieldCheck size={28} />
                </div>
                  <PremiumLock 
          feature="analysis"
          title="Analyse ATS"
          description="Découvrez comment les logiciels de recrutement voient votre CV et obtenez des conseils."
          price={200}
        >
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-black text-slate-400 uppercase tracking-widest">Sélectionnez un CV à analyser</label>
                <div className="relative">
                  <input type="file" id="ats-upload" className="hidden" accept=".pdf,.doc,.docx,image/*" onChange={handleAtsFileUpload} />
                  <label htmlFor="ats-upload" className="flex items-center space-x-2 text-primary hover:text-primary/80 cursor-pointer font-bold text-xs">
                    {isParsing ? <Loader2 className="animate-spin" size={12} /> : <Upload size={12} />}
                    <span>Importer un fichier</span>
                  </label>
                </div>
              </div>
              <div className="space-y-3">
                {selectedCvForAts?.id === 'uploaded' && (
                  <button
                    onClick={() => setSelectedCvForAts(selectedCvForAts)}
                    className="w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between border-primary bg-primary/5 ring-2 ring-primary/10"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary text-white">
                        <FileText size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">CV Importé</p>
                        <p className="text-xs text-slate-500">Prêt pour l'analyse</p>
                      </div>
                    </div>
                    <CheckCircle2 size={20} className="text-primary" />
                  </button>
                )}
                {cvs.length === 0 && !selectedCvForAts ? (
                  <p className="text-slate-500 text-sm italic">Aucun CV trouvé. Créez-en un d'abord.</p>
                ) : (
                  cvs.map((cv) => (
                    <button
                      key={cv.id}
                      onClick={() => setSelectedCvForAts(cv)}
                      className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between group ${selectedCvForAts?.id === cv.id ? 'border-primary bg-primary/5 ring-2 ring-primary/10' : 'border-slate-100 hover:border-slate-200 bg-slate-50'}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedCvForAts?.id === cv.id ? 'bg-primary text-white' : 'bg-white text-slate-400'}`}>
                          <FileText size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{cv.data.firstName} {cv.data.lastName}</p>
                          <p className="text-xs text-slate-500">{cv.data.jobTitle}</p>
                        </div>
                      </div>
                      {selectedCvForAts?.id === cv.id && <CheckCircle2 size={20} className="text-primary" />}
                    </button>
                  ))
                )}
              </div>

              <button
                disabled={!selectedCvForAts || isAnalyzing}
                onClick={async () => {
                  if (!selectedCvForAts) return;
                  setIsAnalyzing(true);
                  try {
                    // Consommer un crédit
                    const consumeRes = await api.ia.consume('analysis');
                    if (!consumeRes.ok) {
                      const err = await consumeRes.json();
                      throw new Error(err.error || "Erreur lors de la consommation du crédit");
                    }

                    const result = await scoreCV(selectedCvForAts.data);
                    setAtsResult(result);
                    setNotification({ message: "Analyse terminée !", type: 'success' });
                  } catch (err: any) {
                    console.error(err);
                    setNotification({ message: err.message || "Erreur lors de l'analyse", type: 'error' });
                  } finally {
                    setIsAnalyzing(false);
                  }
                }}
                className="w-full mt-8 bg-slate-900 text-white py-4 rounded-2xl font-black flex items-center justify-center space-x-3 hover:bg-primary transition-all shadow-xl shadow-slate-200 disabled:opacity-50"
              >
                {isAnalyzing ? <Loader2 className="animate-spin" size={20} /> : <Zap size={20} />}
                <span>Lancer l'analyse ATS</span>
              </button>
            </div>

            <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100 min-h-[400px] flex flex-col items-center justify-center text-center">
              {atsResult ? (
                <div className="w-full text-left space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-black text-slate-900">Résultats de l'analyse</h3>
                    <div className={`px-4 py-2 rounded-2xl font-black text-2xl ${atsResult.score >= 80 ? 'bg-emerald-100 text-emerald-600' : atsResult.score >= 60 ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'}`}>
                      {atsResult.score}/100
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center space-x-2">
                        <CheckCircle2 size={14} className="text-emerald-500" />
                        <span>Points Forts</span>
                      </h4>
                      <ul className="space-y-2">
                        {atsResult.strengths.map((s: string, i: number) => (
                          <li key={i} className="text-sm text-slate-700 flex items-start space-x-2">
                            <span className="text-emerald-500 mt-1">•</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center space-x-2">
                        <AlertCircle size={14} className="text-amber-500" />
                        <span>Points d'amélioration</span>
                      </h4>
                      <ul className="space-y-2">
                        {atsResult.weaknesses.map((w: string, i: number) => (
                          <li key={i} className="text-sm text-slate-700 flex items-start space-x-2">
                            <span className="text-amber-500 mt-1">•</span>
                            <span>{w}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                      <h4 className="text-xs font-black text-primary uppercase tracking-widest mb-2">Conseil d'expert</h4>
                      <p className="text-sm text-slate-700 italic">
                        {atsResult.advice[0]}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center text-slate-300 mb-6">
                    <Search size={40} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">En attente d'analyse</h3>
                  <p className="text-slate-500 text-sm max-w-xs">
                    Sélectionnez un CV et cliquez sur le bouton pour obtenir votre score ATS et des conseils personnalisés.
                  </p>
                </>
              )}
            </div>
          </div>
        </PremiumLock>
      </div>
    </div>
  </div>
)}

        {activeTab === 'referral' && (
          <div className="space-y-8">
            <div className="bg-slate-900 rounded-[2.5rem] p-10 md:p-16 relative overflow-hidden text-white">
              <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl"></div>
              <div className="relative z-10">
                <h2 className="text-3xl font-black mb-4">Programme de Parrainage</h2>
                <p className="text-slate-400 text-lg mb-8 max-w-2xl">
                  Invitez vos amis et gagnez du temps d'abonnement gratuit pour chaque inscription confirmée.
                </p>
                
                <div className="grid md:grid-cols-3 gap-6 mb-10">
                  <div className="bg-white/5 backdrop-blur-sm p-6 rounded-3xl border border-white/10">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">1 Ami</p>
                    <p className="text-xl font-black">12 Heures Gratuites</p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm p-6 rounded-3xl border border-white/10">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">3 Amis</p>
                    <p className="text-xl font-black">24 Heures Gratuites</p>
                  </div>
                  <div className="bg-white/5 backdrop-blur-sm p-6 rounded-3xl border border-white/10">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">10 Amis</p>
                    <p className="text-xl font-black">7 Jours Gratuits</p>
                  </div>
                </div>

                <div className="bg-white/10 p-6 rounded-3xl border border-white/20">
                  <p className="text-sm font-bold mb-3">Votre lien de parrainage unique :</p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <input 
                      readOnly 
                      value={`${window.location.origin}/register?ref=${user?.uid}`}
                      className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3 font-mono text-sm outline-none"
                    />
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/register?ref=${user?.uid}`);
                        alert("Lien copié !");
                      }}
                      className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-primary-dark transition-all"
                    >
                      Copier le lien
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
                <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center space-x-2">
                  <Users className="text-primary" />
                  <span>Amis Invités ({referrals.length})</span>
                </h3>
                <div className="space-y-4">
                  {referrals.length === 0 ? (
                    <p className="text-slate-500 text-center py-8">Vous n'avez pas encore invité d'amis.</p>
                  ) : (
                    referrals.map((ref) => (
                      <div key={ref.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div>
                          <p className="font-bold text-slate-900">{ref.firstName} {ref.lastName}</p>
                          <p className="text-xs text-slate-500">{ref.createdAt ? new Date(ref.createdAt).toLocaleDateString() : 'Date inconnue'}</p>
                        </div>
                        {ref.rewardGranted ? (
                          <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-1 rounded-full uppercase">
                            Récompense : {ref.rewardGranted}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px] font-bold uppercase">En attente</span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
                <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center space-x-2">
                  <Zap className="text-amber-500" />
                  <span>Vos Statistiques IA</span>
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 text-center">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">CV Restants</p>
                    <p className="text-3xl font-black text-slate-900">{user?.cvGenerationsRemaining || 0}</p>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 text-center">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Lettres Restantes</p>
                    <p className="text-3xl font-black text-slate-900">{user?.letterGenerationsRemaining || 0}</p>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 text-center">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Optimisations</p>
                    <p className="text-3xl font-black text-slate-900">{user?.optimizationGenerationsRemaining || 0}</p>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 text-center">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Analyses ATS</p>
                    <p className="text-3xl font-black text-slate-900">{user?.analysisGenerationsRemaining || 0}</p>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                  <p className="text-xs text-amber-800 font-medium leading-relaxed">
                    Chaque abonnement vous donne droit à 5 générations de CV et 5 générations de lettres de motivation. Renouvelez votre abonnement pour recharger vos crédits.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cvs' && (
              <>
                <h2 className="text-xl font-bold text-slate-900 mb-6">Mes CVs</h2>
                {isLoading ? (
                  <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-primary" size={40} />
                  </div>
                ) : cvs.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-6">
                    {cvs.map((cv) => (
                      <motion.div 
                        key={cv.id}
                        whileHover={{ y: -5 }}
                        className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 group"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                            <FileText size={24} />
                          </div>
                          <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => editCv(cv)} className="p-2 text-slate-400 hover:text-primary"><Edit size={18} /></button>
                            <button onClick={() => deleteCv(cv.id)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={18} /></button>
                          </div>
                        </div>
                        <h3 className="font-bold text-slate-900 mb-1">{cv.data.firstName} {cv.data.lastName}</h3>
                        <p className="text-sm text-slate-500 mb-4">Modifié le {cv.createdAt ? new Date(cv.createdAt).toLocaleDateString() : 'Date inconnue'}</p>
                        <button 
                          onClick={() => {
                            storage.saveCV(cv.data);
                            navigate('/cv-preview');
                          }}
                          className="w-full py-2 bg-slate-50 text-slate-700 rounded-xl text-sm font-bold hover:bg-primary hover:text-white transition-all flex items-center justify-center space-x-2"
                        >
                          <ExternalLink size={16} />
                          <span>Ouvrir</span>
                        </button>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-20 text-center">
                    <FileText className="mx-auto text-slate-300 mb-4" size={48} />
                    <p className="text-slate-500 font-medium mb-6">Vous n'avez pas encore créé de CV.</p>
                    <button 
                      onClick={() => {
                        storage.clearCV();
                        navigate('/create-cv');
                      }}
                      className="bg-primary text-white px-8 py-3 rounded-xl font-bold inline-flex items-center space-x-2"
                    >
                      <Plus size={20} />
                      <span>Créer mon premier CV</span>
                    </button>
                  </div>
                )}
              </>
            )}

            {activeTab === 'letters' && (
              <>
                <h2 className="text-xl font-bold text-slate-900 mb-6">Mes Lettres de Motivation</h2>
                {isLoading ? (
                  <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-primary" size={40} />
                  </div>
                ) : letters.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-6">
                    {letters.map((letter) => (
                      <motion.div 
                        key={letter.id}
                        whileHover={{ y: -5 }}
                        className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 group"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                            <FileText size={24} />
                          </div>
                          <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => deleteLetter(letter.id)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={18} /></button>
                          </div>
                        </div>
                        <h3 className="font-bold text-slate-900 mb-1">{letter.data.jobTitle || "Lettre de motivation"}</h3>
                        <p className="text-sm text-slate-500 mb-4">Modifiée le {letter.createdAt ? new Date(letter.createdAt).toLocaleDateString() : 'Date inconnue'}</p>
                        <button 
                          onClick={() => {
                            storage.saveLetterContent({ id: letter.id, data: letter.data, content: letter.content });
                            storage.saveLetterData(letter.data);
                            navigate('/cover-letter-preview');
                          }}
                          className="w-full py-2 bg-slate-50 text-slate-700 rounded-xl text-sm font-bold hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center space-x-2"
                        >
                          <ExternalLink size={16} />
                          <span>Ouvrir</span>
                        </button>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-20 text-center">
                    <FileText className="mx-auto text-slate-300 mb-4" size={48} />
                    <p className="text-slate-500 font-medium mb-6">Vous n'avez pas encore créé de lettre.</p>
                    <Link to="/cover-letter" className="bg-primary text-white px-8 py-3 rounded-xl font-bold inline-flex items-center space-x-2">
                      <Plus size={20} />
                      <span>Créer ma première lettre</span>
                    </Link>
                  </div>
                )}
              </>
            )}

            {activeTab === 'profile' && (
              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
                <h2 className="text-2xl font-bold text-slate-900 mb-8">Mon Profil</h2>
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-500 uppercase">Prénom</label>
                      <input 
                        type="text" 
                        value={profileData.firstName}
                        onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-primary outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-500 uppercase">Nom</label>
                      <input 
                        type="text" 
                        value={profileData.lastName}
                        onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-primary outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-500 uppercase">Email (Non modifiable)</label>
                    <div className="flex items-center space-x-3 px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-400">
                      <Mail size={18} />
                      <span>{user?.email}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-500 uppercase">Téléphone</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="tel" 
                        value={profileData.phone}
                        onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-primary outline-none transition-all"
                      />
                    </div>
                  </div>
                  <button 
                    type="submit"
                    disabled={isSavingProfile}
                    className="bg-primary text-white px-8 py-3 rounded-xl font-bold flex items-center space-x-2 hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                  >
                    {isSavingProfile ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    <span>Enregistrer les modifications</span>
                  </button>
                </form>
              </div>
            )}
            {activeTab === 'payments' && (
              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
                <h2 className="text-2xl font-bold text-slate-900 mb-8">Historique des Paiements</h2>
                {payments.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left border-b border-slate-100">
                          <th className="pb-4 font-bold text-slate-500 uppercase text-xs">Plan</th>
                          <th className="pb-4 font-bold text-slate-500 uppercase text-xs">Montant</th>
                          <th className="pb-4 font-bold text-slate-500 uppercase text-xs">Date</th>
                          <th className="pb-4 font-bold text-slate-500 uppercase text-xs">Statut</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {payments.map((p) => (
                          <tr key={p.id}>
                            <td className="py-4">
                              <span className="font-bold text-slate-900 capitalize">{p.planType}</span>
                            </td>
                            <td className="py-4">
                              <span className="text-slate-600">{p.amount} FCFA</span>
                            </td>
                            <td className="py-4">
                              <span className="text-slate-500 text-sm">{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'Date inconnue'}</span>
                            </td>
                            <td className="py-4">
                              <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                                p.status === 'confirmed' 
                                  ? 'bg-emerald-100 text-emerald-700' 
                                  : 'bg-amber-100 text-amber-700'
                              }`}>
                                {p.status === 'confirmed' ? 'Réussi' : 'En attente'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <CreditCard className="mx-auto text-slate-200 mb-4" size={48} />
                    <p className="text-slate-500">Aucun paiement enregistré.</p>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'invoices' && (
              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
                <h2 className="text-2xl font-bold text-slate-900 mb-8">Mes Factures</h2>
                {invoices.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left border-b border-slate-100">
                          <th className="pb-4 font-bold text-slate-500 uppercase text-xs">N° Facture</th>
                          <th className="pb-4 font-bold text-slate-500 uppercase text-xs">Plan</th>
                          <th className="pb-4 font-bold text-slate-500 uppercase text-xs">Montant</th>
                          <th className="pb-4 font-bold text-slate-500 uppercase text-xs">Date</th>
                          <th className="pb-4 font-bold text-slate-500 uppercase text-xs">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {invoices.map((inv) => (
                          <tr key={inv.id}>
                            <td className="py-4 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                            <td className="py-4">
                              <span className="font-bold text-slate-700 capitalize">{inv.planType}</span>
                            </td>
                            <td className="py-4 font-bold text-slate-900">{inv.amount} FCFA</td>
                            <td className="py-4 text-slate-500 text-sm">{inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : 'Date inconnue'}</td>
                            <td className="py-4">
                              <button 
                                onClick={() => setPreviewInvoice(inv)}
                                className="text-primary hover:text-primary-dark p-2 transition-colors"
                                title="Télécharger PDF"
                              >
                                <Download size={18} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Receipt className="mx-auto text-slate-200 mb-4" size={48} />
                    <p className="text-slate-500">Aucune facture disponible.</p>
                  </div>
                )}
              </div>
            )}
            {activeTab === 'messages' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Messages de l'Administrateur</h2>
                {messages.length > 0 ? (
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <motion.div 
                        key={msg.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-6 rounded-3xl border transition-all ${msg.isRead ? 'bg-white border-slate-100' : 'bg-blue-50 border-blue-100 shadow-lg shadow-blue-500/5'}`}
                        onClick={() => !msg.isRead && handleMarkAsRead(msg.id)}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${msg.isRead ? 'bg-slate-100 text-slate-400' : 'bg-blue-500 text-white'}`}>
                              <MessageSquare size={20} />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">Administrateur CRYNANCE</p>
                              <p className="text-xs text-slate-500">{msg.createdAt ? new Date(msg.createdAt).toLocaleString() : 'Date inconnue'}</p>
                            </div>
                          </div>
                          {!msg.isRead && (
                            <span className="bg-blue-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full">Nouveau</span>
                          )}
                        </div>
                        <p className="text-slate-700 font-medium mb-6 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        
                        {msg.invoice && (
                          <div className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                                <Receipt size={20} />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-900">Facture #{msg.invoice.invoiceNumber}</p>
                                <p className="text-xs text-slate-500">{msg.invoice.amount} FCFA - {msg.invoice.planType}</p>
                              </div>
                            </div>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewInvoice(msg.invoice!);
                              }}
                              className="bg-emerald-500 text-white p-2 rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                            >
                              <Download size={18} />
                            </button>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white p-12 rounded-[2.5rem] shadow-xl border border-slate-100 text-center">
                    <Mail className="mx-auto text-slate-200 mb-4" size={48} />
                    <p className="text-slate-500 font-medium">Vous n'avez aucun message pour le moment.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {previewInvoice && (
        <InvoicePDF 
          invoice={previewInvoice} 
          onClose={() => setPreviewInvoice(null)} 
        />
      )}
    </div>
  );
}
