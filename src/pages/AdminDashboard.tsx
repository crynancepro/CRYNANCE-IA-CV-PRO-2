import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Users, CreditCard, FileText, Zap, 
  CheckCircle2, Clock, Search, Filter, 
  TrendingUp, AlertCircle, Trash2, Plus,
  Calendar, Percent, Tag, ShieldCheck
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [promos, setPromos] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'payments' | 'promos'>('stats');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && ['stats', 'users', 'payments', 'promos'].includes(tab)) {
      setActiveTab(tab as any);
    }
  }, [location]);

  // Promo form state
  const [newPromo, setNewPromo] = useState({
    code: '',
    discount: 0,
    type: 'fixed',
    startDate: '',
    endDate: ''
  });

  const fetchData = async () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (user.role !== 'admin') return navigate('/dashboard');

    try {
      const [statsRes, usersRes, paymentsRes, promosRes] = await Promise.all([
        api.admin.getStats(),
        api.admin.getUsers(),
        api.admin.getPayments(),
        api.admin.getPromos()
      ]);

      const [statsData, usersData, paymentsData, promosData] = await Promise.all([
        statsRes.json(),
        usersRes.json(),
        paymentsRes.json(),
        promosRes.json()
      ]);

      setStats(statsData);
      setUsers(usersData);
      setPayments(paymentsData);
      setPromos(promosData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleConfirmPayment = async (id: number) => {
    try {
      const res = await api.admin.confirmPayment(id);
      if (res.ok) {
        alert("Paiement confirmé !");
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.admin.createPromo(newPromo);
      if (res.ok) {
        alert("Code promo créé !");
        setNewPromo({ code: '', discount: 0, type: 'fixed', startDate: '', endDate: '' });
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePromo = async (id: number) => {
    if (!confirm("Supprimer ce code promo ?")) return;
    try {
      const res = await api.admin.deletePromo(id);
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin text-primary">
          <Zap size={48} />
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16 px-4 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-2">
              <ShieldCheck size={14} />
              <span>Mode Administrateur</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900">Tableau de Bord</h1>
            <p className="text-slate-500 font-medium">Gestion complète de la plateforme CRYNANCE IA.</p>
          </div>
          
          <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
            {[
              { id: 'stats', label: 'Statistiques', icon: TrendingUp },
              { id: 'users', label: 'Utilisateurs', icon: Users },
              { 
                id: 'payments', 
                label: (
                  <div className="flex items-center space-x-2">
                    <span>Paiements</span>
                    {stats?.pending > 0 && (
                      <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full animate-pulse">
                        {stats.pending}
                      </span>
                    )}
                  </div>
                ), 
                icon: CreditCard 
              },
              { id: 'promos', label: 'Codes promo', icon: Tag },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
              >
                <tab.icon size={18} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'stats' && stats && (
          <div className="space-y-8">
            {stats.pending > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center justify-between"
              >
                <div className="flex items-center space-x-3 text-amber-800">
                  <AlertCircle size={20} />
                  <span className="font-bold">Nouveau paiement reçu : {stats.pending} demande(s) en attente</span>
                </div>
                <button 
                  onClick={() => setActiveTab('payments')}
                  className="bg-amber-200 text-amber-900 px-4 py-1.5 rounded-xl text-xs font-bold hover:bg-amber-300 transition-all"
                >
                  Voir les demandes
                </button>
              </motion.div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
                <Users size={24} />
              </div>
              <p className="text-sm font-bold text-slate-400 uppercase">Utilisateurs</p>
              <p className="text-3xl font-black text-slate-900">{stats.users}</p>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-4">
                <FileText size={24} />
              </div>
              <p className="text-sm font-bold text-slate-400 uppercase">CV Créés</p>
              <p className="text-3xl font-black text-slate-900">{stats.cvs}</p>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
                <CheckCircle2 size={24} />
              </div>
              <p className="text-sm font-bold text-slate-400 uppercase">Paiements Confirmés</p>
              <p className="text-3xl font-black text-slate-900">{stats.payments}</p>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-4">
                <AlertCircle size={24} />
              </div>
              <p className="text-sm font-bold text-slate-400 uppercase">En Attente</p>
              <p className="text-3xl font-black text-slate-900">{stats.pending}</p>
            </div>
          </div>
        </div>
      )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-slate-100">
                    <th className="p-6 font-bold text-slate-500 uppercase text-xs">Utilisateur</th>
                    <th className="p-6 font-bold text-slate-500 uppercase text-xs">Contact</th>
                    <th className="p-6 font-bold text-slate-500 uppercase text-xs">Inscription</th>
                    <th className="p-6 font-bold text-slate-500 uppercase text-xs">Rôle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-bold">
                            {u.firstName[0]}{u.lastName[0]}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{u.firstName} {u.lastName}</p>
                            <p className="text-sm text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <p className="text-sm text-slate-600">{u.phone || 'N/A'}</p>
                      </td>
                      <td className="p-6">
                        <p className="text-sm text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</p>
                      </td>
                      <td className="p-6">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                          {u.role}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-slate-100">
                    <th className="p-6 font-bold text-slate-500 uppercase text-xs">Utilisateur</th>
                    <th className="p-6 font-bold text-slate-500 uppercase text-xs">Plan</th>
                    <th className="p-6 font-bold text-slate-500 uppercase text-xs">Montant</th>
                    <th className="p-6 font-bold text-slate-500 uppercase text-xs">Date</th>
                    <th className="p-6 font-bold text-slate-500 uppercase text-xs">Statut</th>
                    <th className="p-6 font-bold text-slate-500 uppercase text-xs">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-6">
                        <div>
                          <p className="font-bold text-slate-900">{p.firstName} {p.lastName}</p>
                          <p className="text-xs text-slate-500">{p.email}</p>
                        </div>
                      </td>
                      <td className="p-6">
                        <span className="font-bold text-slate-700 capitalize">{p.planType}</span>
                      </td>
                      <td className="p-6 font-bold text-slate-900">{p.amount} FCFA</td>
                      <td className="p-6 text-sm text-slate-500">{new Date(p.createdAt).toLocaleString()}</td>
                      <td className="p-6">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${p.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {p.status === 'confirmed' ? 'Confirmé' : 'En attente'}
                        </span>
                      </td>
                      <td className="p-6">
                        {p.status === 'pending' && (
                          <button 
                            onClick={() => handleConfirmPayment(p.id)}
                            className="bg-primary text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary-dark transition-all"
                          >
                            Confirmer
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'promos' && (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
                <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center space-x-2">
                  <Plus size={20} className="text-primary" />
                  <span>Nouveau Code Promo</span>
                </h2>
                <form onSubmit={handleCreatePromo} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Code</label>
                    <input 
                      required 
                      value={newPromo.code}
                      onChange={(e) => setNewPromo({...newPromo, code: e.target.value.toUpperCase()})}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-primary" 
                      placeholder="PROMO2024" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Réduction</label>
                      <input 
                        type="number" 
                        required 
                        value={newPromo.discount}
                        onChange={(e) => setNewPromo({...newPromo, discount: parseInt(e.target.value)})}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-primary" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Type</label>
                      <select 
                        value={newPromo.type}
                        onChange={(e) => setNewPromo({...newPromo, type: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-primary"
                      >
                        <option value="fixed">Fixe (FCFA)</option>
                        <option value="percentage">Pourcentage (%)</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Date Début</label>
                    <input 
                      type="date" 
                      value={newPromo.startDate}
                      onChange={(e) => setNewPromo({...newPromo, startDate: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-primary" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Date Fin</label>
                    <input 
                      type="date" 
                      value={newPromo.endDate}
                      onChange={(e) => setNewPromo({...newPromo, endDate: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-primary" 
                    />
                  </div>
                  <button type="submit" className="w-full bg-primary text-white py-4 rounded-2xl font-bold hover:bg-primary-dark transition-all shadow-xl shadow-primary/20">
                    Créer le code
                  </button>
                </form>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
                <div className="p-8 border-b border-slate-100">
                  <h2 className="text-xl font-bold text-slate-900">Codes Promo Actifs</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left bg-slate-50/50">
                        <th className="p-6 font-bold text-slate-500 uppercase text-xs">Code</th>
                        <th className="p-6 font-bold text-slate-500 uppercase text-xs">Réduction</th>
                        <th className="p-6 font-bold text-slate-500 uppercase text-xs">Validité</th>
                        <th className="p-6 font-bold text-slate-500 uppercase text-xs">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {promos.map((p) => (
                        <tr key={p.id}>
                          <td className="p-6">
                            <span className="font-mono font-bold text-primary bg-primary/5 px-3 py-1 rounded-lg">{p.code}</span>
                          </td>
                          <td className="p-6">
                            <span className="font-bold text-slate-900">
                              {p.discount}{p.type === 'percentage' ? '%' : ' FCFA'}
                            </span>
                          </td>
                          <td className="p-6">
                            <div className="flex flex-col text-xs text-slate-500">
                              <span>Du: {p.startDate || 'N/A'}</span>
                              <span>Au: {p.endDate || 'N/A'}</span>
                            </div>
                          </td>
                          <td className="p-6">
                            <button 
                              onClick={() => handleDeletePromo(p.id)}
                              className="text-red-400 hover:text-red-600 transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
