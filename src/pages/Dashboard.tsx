import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  FileText, Plus, Trash2, Edit, ExternalLink, 
  Loader2, User as UserIcon, CreditCard, Zap, 
  Mail, Phone, Save, Clock, HelpCircle, ArrowRight 
} from 'lucide-react';
import { api } from '../services/api';
import { storage } from '../utils/storage';

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

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
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
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<'cvs' | 'letters' | 'profile' | 'payments'>('cvs');
  const [payments, setPayments] = useState<any[]>([]);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    phone: ''
  });
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchData(token);
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || ''
      });
    }
  }, [navigate]);

  const fetchData = async (token: string) => {
    try {
      const [cvsRes, lettersRes, paymentsRes, profileRes] = await Promise.all([
        api.cvs.list(),
        api.letters.list(),
        api.payments.history(),
        api.auth.getProfile()
      ]);

      if (!cvsRes.ok || !lettersRes.ok || !paymentsRes.ok || !profileRes.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const [cvsData, lettersData, paymentsData, profileData] = await Promise.all([
        cvsRes.json(), 
        lettersRes.json(),
        paymentsRes.json(),
        profileRes.json()
      ]);
      
      setCvs(cvsData);
      setLetters(lettersData);
      setPayments(paymentsData);
      
      // Update local storage with fresh user data
      localStorage.setItem('user', JSON.stringify(profileData));
      setProfileData({
        firstName: profileData.firstName || '',
        lastName: profileData.lastName || '',
        phone: profileData.phone || ''
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const res = await api.auth.updateProfile(profileData);
      if (res.ok) {
        alert("Profil mis à jour !");
      } else {
        alert("Erreur lors de la mise à jour du profil.");
      }
    } catch (error) {
      console.error(error);
      alert("Une erreur est survenue.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const deleteCv = async (id: string) => {
    if (!confirm("Supprimer ce CV ?")) return;
    try {
      await api.cvs.delete(id);
      setCvs([]); // Ensure list is cleared as only one CV is allowed
      alert("CV supprimé avec succès");
    } catch (error) {
      console.error(error);
    }
  };

  const deleteLetter = async (id: string) => {
    if (!confirm("Supprimer cette lettre ?")) return;
    try {
      await api.letters.delete(id);
      setLetters(letters.filter(l => l.id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  const editCv = (cv: any) => {
    storage.saveCV(cv.data);
    navigate('/create-cv');
  };

  return (
    <div className="pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Bonjour, {user?.firstName}</h1>
            <p className="text-slate-600">Gérez vos CV et lettres de motivation ici.</p>
          </div>
          <div className="flex space-x-4">
            <Link to="/create-cv" className="bg-primary text-white px-6 py-3 rounded-xl font-bold flex items-center space-x-2 hover:bg-primary-dark transition-all shadow-lg shadow-primary/20">
              <Plus size={20} />
              <span>Nouveau CV</span>
            </Link>
            <Link to="/cover-letter" className="bg-white text-slate-700 border border-slate-200 px-6 py-3 rounded-xl font-bold flex items-center space-x-2 hover:bg-slate-50 transition-all">
              <Plus size={20} />
              <span>Nouvelle Lettre</span>
            </Link>
          </div>
        </div>

        <div className="flex space-x-4 mb-8 border-b border-slate-100">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`pb-4 px-2 text-sm font-bold transition-all border-b-2 ${activeTab === 'profile' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            Mon profil
          </button>
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
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Profile Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 space-y-6 sticky top-24">
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mb-4">
                  <UserIcon size={40} />
                </div>
                <h3 className="font-bold text-slate-900">{user?.firstName} {user?.lastName}</h3>
                <p className="text-sm text-slate-500">{user?.email}</p>
                {(user?.modernExpiresAt && new Date(user.modernExpiresAt) > new Date()) || 
                 (user?.classicExpiresAt && new Date(user.classicExpiresAt) > new Date()) || 
                 (user?.creativeExpiresAt && new Date(user.creativeExpiresAt) > new Date()) || 
                 user?.isPremium ? (
                  <span className="mt-2 px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase rounded-full">Premium Pro Actif</span>
                ) : (
                  <span className="mt-2 px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-black uppercase rounded-full">Compte Gratuit</span>
                )}
              </div>
              
              <div className="pt-6 border-t border-slate-100 space-y-3">
                {['modern', 'classic', 'creative'].map((type) => {
                  const expiry = user?.[`${type}ExpiresAt`];
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
                        <p className="text-sm text-slate-500 mb-4">Modifié le {new Date(cv.createdAt).toLocaleDateString()}</p>
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
                    <Link to="/create-cv" className="bg-primary text-white px-8 py-3 rounded-xl font-bold inline-flex items-center space-x-2">
                      <Plus size={20} />
                      <span>Créer mon premier CV</span>
                    </Link>
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
                        <p className="text-sm text-slate-500 mb-4">Modifiée le {new Date(letter.createdAt).toLocaleDateString()}</p>
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
                              <span className="text-slate-500 text-sm">{new Date(p.createdAt).toLocaleDateString()}</span>
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
          </div>
        </div>
      </div>
    </div>
  );
}
