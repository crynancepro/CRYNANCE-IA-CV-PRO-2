import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Users, CreditCard, FileText, Zap, 
  CheckCircle2, Clock, Search, Filter, 
  TrendingUp, AlertCircle, Trash2, Plus,
  Calendar, Percent, Tag, ShieldCheck,
  MessageSquare, Send, Download, Eye,
  Receipt, Sparkles, Star, Mail
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { InvoicePDF } from '../components/InvoicePDF';
import { Invoice } from '../types';
import AdminReviews from './AdminReviews';
import AdminEmails from './AdminEmails';
import { useAuth } from '../context/AuthContext';

import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [revenueStats, setRevenueStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [promos, setPromos] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [iaStats, setIaStats] = useState<any>(null);
  const [referralStats, setReferralStats] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'stats' | 'revenue' | 'users' | 'payments' | 'promos' | 'invoices' | 'affiliation' | 'ia' | 'reviews' | 'emails'>('stats');
  const [userFilter, setUserFilter] = useState<'all' | 'active' | 'banned'>('all');
  const [isLoading, setIsLoading] = useState(true);
  
  // Messaging state
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [messageContent, setMessageContent] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [attachInvoiceId, setAttachInvoiceId] = useState<number | null>(null);

  // Invoice preview state
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && ['stats', 'revenue', 'users', 'payments', 'promos', 'invoices', 'affiliation', 'ia', 'reviews', 'emails'].includes(tab)) {
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

  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ message: string, onConfirm: () => void } | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const fetchData = async () => {
    if (!user) return navigate('/login');
    
    if (user.email !== 'peter25ngouala@gmail.com' && user.role !== 'admin') {
      return navigate('/dashboard');
    }

    setIsLoading(true);
    try {
      const statsRes = await api.admin.getStats();
      if (statsRes.ok) setStats(await statsRes.json());

      const revenueRes = await api.admin.getRevenueStats();
      if (revenueRes.ok) setRevenueStats(await revenueRes.json());

      const usersRes = await api.admin.getUsers();
      if (usersRes?.ok) setUsers(await usersRes.json());

      const paymentsRes = await api.admin.getPayments();
      if (paymentsRes?.ok) setPayments(await paymentsRes.json());

      const promosRes = await api.admin.getPromos();
      if (promosRes.ok) setPromos(await promosRes.json());

      const invoicesRes = await api.admin.getInvoices();
      if (invoicesRes.ok) setInvoices(await invoicesRes.json());

      const iaRes = await api.admin.getIAStats();
      if (iaRes.ok) setIaStats(await iaRes.json());

      const refRes = await api.admin.getReferralStats();
      if (refRes.ok) setReferralStats(await refRes.json());
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
        // Automatically generate invoice after confirmation
        await api.admin.generateInvoice(id);
        setNotification({ message: "Paiement confirmé et facture générée !", type: 'success' });
        fetchData();
      }
    } catch (err) {
      console.error(err);
      setNotification({ message: "Erreur lors de la confirmation", type: 'error' });
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !messageContent) return;

    setIsSendingMessage(true);
    try {
      const res = await api.admin.sendMessage({
        userId: selectedUser.id,
        content: messageContent,
        invoiceId: attachInvoiceId || undefined
      });

      if (res.ok) {
        setNotification({ message: "Message envoyé !", type: 'success' });
        setMessageContent('');
        setAttachInvoiceId(null);
        setSelectedUser(null);
      }
    } catch (err) {
      console.error(err);
      setNotification({ message: "Erreur lors de l'envoi", type: 'error' });
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.admin.createPromo(newPromo);
      if (res.ok) {
        setNotification({ message: "Code promo créé !", type: 'success' });
        setNewPromo({ code: '', discount: 0, type: 'fixed', startDate: '', endDate: '' });
        fetchData();
      }
    } catch (err) {
      console.error(err);
      setNotification({ message: "Erreur lors de la création", type: 'error' });
    }
  };

  const handleDeletePromo = async (id: number) => {
    setConfirmModal({
      message: "Supprimer ce code promo ?",
      onConfirm: async () => {
        try {
          const res = await api.admin.deletePromo(id);
          if (res.ok) {
            setNotification({ message: "Code promo supprimé !", type: 'success' });
            fetchData();
          }
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  const handleBanUser = async (id: number) => {
    setConfirmModal({
      message: "Êtes-vous sûr de vouloir modifier le statut de cet utilisateur ?",
      onConfirm: async () => {
        try {
          const res = await api.admin.banUser(id);
          if (res.ok) {
            setNotification({ message: "Statut mis à jour !", type: 'success' });
            fetchData();
          } else {
            const data = await res.json();
            setNotification({ message: data.error || "Erreur lors de l'opération", type: 'error' });
          }
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  const handleDeleteUser = async (id: number) => {
    setConfirmModal({
      message: "ATTENTION : Cette action est irréversible. Toutes les données de l'utilisateur seront supprimées. Continuer ?",
      onConfirm: async () => {
        try {
          const res = await api.admin.deleteUser(id);
          if (res.ok) {
            setNotification({ message: "Utilisateur supprimé !", type: 'success' });
            fetchData();
          } else {
            const data = await res.json();
            setNotification({ message: data.error || "Erreur lors de la suppression", type: 'error' });
          }
        } catch (err) {
          console.error(err);
        }
      }
    });
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
              { id: 'stats', label: 'Vue d\'ensemble', icon: TrendingUp },
              { id: 'revenue', label: 'Revenus & Stats', icon: TrendingUp },
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
              { id: 'invoices', label: 'Factures', icon: Receipt },
              { id: 'affiliation', label: 'Affiliation', icon: Users },
              { id: 'ia', label: 'Gestion IA', icon: Sparkles },
              { id: 'promos', label: 'Codes promo', icon: Tag },
              { id: 'reviews', label: 'Avis', icon: Star },
              { id: 'emails', label: 'Emails', icon: Mail },
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

        {activeTab === 'affiliation' && (
          <div className="space-y-8">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Parrains</p>
                <p className="text-3xl font-black text-slate-900">{referralStats.length}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Parrainages</p>
                <p className="text-3xl font-black text-slate-900">
                  {referralStats.reduce((acc, curr) => acc + curr.referralCount, 0)}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
              <div className="p-8 border-b border-slate-100">
                <h2 className="text-xl font-black text-slate-900">Liste des Parrains</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Utilisateur</th>
                      <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Parrainages</th>
                      <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Récompenses</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {referralStats.map((ref, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="px-8 py-6">
                          <p className="font-bold text-slate-900">{ref.firstName} {ref.lastName}</p>
                          <p className="text-xs text-slate-500">{ref.email}</p>
                        </td>
                        <td className="px-8 py-6">
                          <span className="bg-primary-light text-primary px-3 py-1 rounded-full text-xs font-bold">
                            {ref.referralCount} invités
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <p className="text-sm text-slate-600">
                            {ref.referralCount >= 10 ? "7 jours" : ref.referralCount >= 3 ? "24h" : ref.referralCount >= 1 ? "12h" : "Aucune"}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ia' && (
          <div className="space-y-8">
            <div className="grid md:grid-cols-5 gap-6">
              <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Générations IA</p>
                <p className="text-3xl font-black text-slate-900">{iaStats?.totalGenerations || 0}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">CV Générés</p>
                <p className="text-3xl font-black text-slate-900">{iaStats?.totalCvs || 0}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Lettres Générées</p>
                <p className="text-3xl font-black text-slate-900">{iaStats?.totalLetters || 0}</p>
              </div>
              <div className="bg-emerald-50 p-6 rounded-3xl shadow-xl border border-emerald-100">
                <p className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-1">Score ATS Moyen</p>
                <p className="text-3xl font-black text-emerald-900">{iaStats?.avgAtsScore || 0}%</p>
              </div>
              <div className="bg-blue-50 p-6 rounded-3xl shadow-xl border border-blue-100">
                <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-1">CV Optimisés</p>
                <p className="text-3xl font-black text-blue-900">{iaStats?.optimizedCvsCount || 0}</p>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
              <div className="p-8 border-b border-slate-100">
                <h2 className="text-xl font-black text-slate-900">Consommation par Utilisateur (Top 20)</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Utilisateur</th>
                      <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">CV</th>
                      <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Lettres</th>
                      <th className="px-8 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {iaStats?.consumptionByUser.map((user: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="px-8 py-6">
                          <p className="font-bold text-slate-900">{user.email}</p>
                        </td>
                        <td className="px-8 py-6 font-bold text-slate-600">{user.cvCount}</td>
                        <td className="px-8 py-6 font-bold text-slate-600">{user.letterCount}</td>
                        <td className="px-8 py-6">
                          <span className="bg-slate-900 text-white px-3 py-1 rounded-full text-xs font-bold">
                            {user.cvCount + user.letterCount}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'revenue' && revenueStats && (
          <div className="space-y-10">
            {/* Main Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                  <TrendingUp size={80} />
                </div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Revenus Aujourd'hui</p>
                <p className="text-3xl font-black text-slate-900">{(revenueStats.summary?.today || 0).toLocaleString()} FCFA</p>
                <div className="mt-4 flex items-center text-emerald-500 text-xs font-bold">
                  <TrendingUp size={14} className="mr-1" />
                  <span>En direct</span>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                  <Calendar size={80} />
                </div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Revenus Semaine</p>
                <p className="text-3xl font-black text-slate-900">{(revenueStats.summary?.week || 0).toLocaleString()} FCFA</p>
                <p className="mt-4 text-slate-400 text-xs font-bold">7 derniers jours</p>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                  <CreditCard size={80} />
                </div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Revenus Mois</p>
                <p className="text-3xl font-black text-slate-900">{(revenueStats.summary?.month || 0).toLocaleString()} FCFA</p>
                <div className={`mt-4 flex items-center text-xs font-bold ${revenueStats.performance?.growth >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  <TrendingUp size={14} className={`mr-1 ${revenueStats.performance.growth < 0 ? 'rotate-180' : ''}`} />
                  <span>{revenueStats.performance.growth}% vs mois dernier</span>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                  <Zap size={80} />
                </div>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Revenus Totaux</p>
                <p className="text-3xl font-black text-slate-900">{(revenueStats.summary?.total || 0).toLocaleString()} FCFA</p>
                <p className="mt-4 text-slate-400 text-xs font-bold">Depuis le lancement</p>
              </div>
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl text-white">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Utilisateurs</p>
                <p className="text-4xl font-black">{revenueStats.summary.users}</p>
                <div className="mt-4 flex items-center text-emerald-400 text-xs font-bold">
                  <Plus size={14} className="mr-1" />
                  <span>{revenueStats.performance.newUsers} cette semaine</span>
                </div>
              </div>
              <div className="bg-primary p-8 rounded-[2.5rem] shadow-xl text-white">
                <p className="text-xs font-black text-white/60 uppercase tracking-widest mb-1">Abonnements Vendus</p>
                <p className="text-4xl font-black">{revenueStats.summary.subscriptions}</p>
                <p className="mt-4 text-white/60 text-xs font-bold">Paiements confirmés</p>
              </div>
              <div className="bg-emerald-600 p-8 rounded-[2.5rem] shadow-xl text-white">
                <p className="text-xs font-black text-white/60 uppercase tracking-widest mb-1">Paiements Confirmés</p>
                <p className="text-4xl font-black">{revenueStats.summary.confirmedPayments}</p>
                <p className="mt-4 text-white/60 text-xs font-bold">Validés par l'admin</p>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Daily Revenue Chart */}
              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
                <h3 className="text-lg font-black text-slate-900 mb-6">Évolution des revenus (30 jours)</h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueStats.charts.daily}>
                      <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 10, fill: '#94a3b8'}}
                        tickFormatter={(str) => str ? new Date(str).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : ''}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 10, fill: '#94a3b8'}}
                        tickFormatter={(value) => `${value / 1000}k`}
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: any) => [`${(value || 0).toLocaleString()} FCFA`, 'Revenu']}
                      />
                      <Area type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Weekly Revenue Chart */}
              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
                <h3 className="text-lg font-black text-slate-900 mb-6">Revenus par semaine</h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueStats.charts.weekly}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 10, fill: '#94a3b8'}}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 10, fill: '#94a3b8'}}
                        tickFormatter={(value) => `${value / 1000}k`}
                      />
                      <Tooltip 
                        cursor={{fill: '#f8fafc'}}
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: any) => [`${(value || 0).toLocaleString()} FCFA`, 'Revenu']}
                      />
                      <Bar dataKey="value" fill="#2563eb" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Monthly Revenue Chart */}
              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
                <h3 className="text-lg font-black text-slate-900 mb-6">Revenus par mois</h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueStats.charts.monthly}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 10, fill: '#94a3b8'}}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 10, fill: '#94a3b8'}}
                        tickFormatter={(value) => `${value / 1000}k`}
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: any) => [`${(value || 0).toLocaleString()} FCFA`, 'Revenu']}
                      />
                      <Line type="stepAfter" dataKey="value" stroke="#8b5cf6" strokeWidth={4} dot={{ r: 6, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Subscription Distribution */}
              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
                <h3 className="text-lg font-black text-slate-900 mb-6">Répartition des abonnements</h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={revenueStats.charts.distribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {revenueStats.charts.distribution.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={['#2563eb', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'][index % 5]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Performance Analysis */}
            <div className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-10">
                <TrendingUp size={160} />
              </div>
              <h3 className="text-2xl font-black mb-8 flex items-center space-x-3">
                <Zap className="text-primary" />
                <span>Performance de l'entreprise</span>
              </h3>
              <div className="grid md:grid-cols-3 gap-12 relative z-10">
                <div className="space-y-2">
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Croissance des revenus</p>
                  <p className="text-4xl font-black text-emerald-400">+{revenueStats.performance.growth}%</p>
                  <p className="text-sm text-slate-500">Comparé au mois précédent</p>
                </div>
                <div className="space-y-2">
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Abonnement le plus vendu</p>
                  <p className="text-4xl font-black text-primary capitalize">{revenueStats.performance.bestSeller}</p>
                  <p className="text-sm text-slate-500">Basé sur le volume de ventes</p>
                </div>
                <div className="space-y-2">
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Nouveaux utilisateurs</p>
                  <p className="text-4xl font-black text-white">{revenueStats.performance.newUsers}</p>
                  <p className="text-sm text-slate-500">Inscrits ces 7 derniers jours</p>
                </div>
              </div>
            </div>
          </div>
        )}

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
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center space-x-2">
                <Filter size={20} className="text-slate-400" />
                <span className="font-bold text-slate-700">Filtrer par statut :</span>
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={() => setUserFilter('all')}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${userFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  Tous
                </button>
                <button 
                  onClick={() => setUserFilter('active')}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${userFilter === 'active' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  Actifs
                </button>
                <button 
                  onClick={() => setUserFilter('banned')}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${userFilter === 'banned' ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  Bannis
                </button>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-slate-100">
                      <th className="p-6 font-bold text-slate-500 uppercase text-xs">Utilisateur</th>
                      <th className="p-6 font-bold text-slate-500 uppercase text-xs">Contact</th>
                      <th className="p-6 font-bold text-slate-500 uppercase text-xs">Inscription</th>
                      <th className="p-6 font-bold text-slate-500 uppercase text-xs">Accès Premium</th>
                      <th className="p-6 font-bold text-slate-500 uppercase text-xs">Rôle / Statut</th>
                      <th className="p-6 font-bold text-slate-500 uppercase text-xs text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {users.filter(u => userFilter === 'all' ? true : u.status === userFilter).map((u) => (
                      <tr key={u.id} className={`hover:bg-slate-50/50 transition-colors ${u.status === 'banned' ? 'bg-red-50/30' : ''}`}>
                        <td className="p-6">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${u.status === 'banned' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                              {u.firstName?.[0]}{u.lastName?.[0]}
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
                          <p className="text-sm text-slate-500">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Date inconnue'}</p>
                        </td>
                        <td className="p-6">
                          <div className="flex flex-wrap gap-1">
                            {u.isPremium && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-md text-[9px] font-black uppercase">Full</span>}
                            {u.hasOptimizationAccess && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md text-[9px] font-black uppercase">Opti</span>}
                            {u.hasLetterAccess && <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-md text-[9px] font-black uppercase">Lettre</span>}
                            {u.hasAnalysisAccess && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-md text-[9px] font-black uppercase">ATS</span>}
                            {!u.isPremium && !u.hasOptimizationAccess && !u.hasLetterAccess && !u.hasAnalysisAccess && <span className="text-[9px] text-slate-400 font-bold italic">Aucun</span>}
                          </div>
                        </td>
                        <td className="p-6">
                          <div className="flex flex-col space-y-2 items-start">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                              {u.role}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${u.status === 'banned' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                              {u.status === 'banned' ? 'Banni' : 'Actif'}
                            </span>
                          </div>
                        </td>
                        <td className="p-6">
                          <div className="flex items-center justify-end space-x-2">
                            <button 
                              onClick={() => setSelectedUser(u)}
                              className="text-primary hover:text-primary-dark p-2 transition-colors bg-primary/10 rounded-xl"
                              title="Envoyer un message"
                            >
                              <MessageSquare size={16} />
                            </button>
                            {u.role !== 'admin' && (
                              <>
                                <button 
                                  onClick={() => handleBanUser(u.id)}
                                  className={`p-2 transition-colors rounded-xl ${u.status === 'banned' ? 'text-emerald-600 bg-emerald-100 hover:bg-emerald-200' : 'text-amber-600 bg-amber-100 hover:bg-amber-200'}`}
                                  title={u.status === 'banned' ? "Débannir" : "Bannir"}
                                >
                                  <AlertCircle size={16} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteUser(u.id)}
                                  className="text-red-600 hover:text-red-700 p-2 transition-colors bg-red-100 hover:bg-red-200 rounded-xl"
                                  title="Supprimer définitivement"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'invoices' && (
          <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-slate-100">
                    <th className="p-6 font-bold text-slate-500 uppercase text-xs">N° Facture</th>
                    <th className="p-6 font-bold text-slate-500 uppercase text-xs">Utilisateur</th>
                    <th className="p-6 font-bold text-slate-500 uppercase text-xs">Plan</th>
                    <th className="p-6 font-bold text-slate-500 uppercase text-xs">Montant</th>
                    <th className="p-6 font-bold text-slate-500 uppercase text-xs">Date</th>
                    <th className="p-6 font-bold text-slate-500 uppercase text-xs">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-6 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                      <td className="p-6">
                        <div>
                          <p className="font-bold text-slate-900">{inv.clientName || `${inv.firstName} ${inv.lastName}`}</p>
                          <p className="text-xs text-slate-500">{inv.clientEmail || inv.email}</p>
                        </div>
                      </td>
                      <td className="p-6">
                        <span className="font-bold text-slate-700 capitalize">{inv.planType}</span>
                      </td>
                      <td className="p-6 font-bold text-slate-900">{inv.amount} FCFA</td>
                      <td className="p-6 text-sm text-slate-500">{inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : 'Date inconnue'}</td>
                      <td className="p-6">
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => setPreviewInvoice(inv)}
                            className="p-2 text-slate-400 hover:text-primary transition-colors"
                            title="Voir la facture"
                          >
                            <Eye size={18} />
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedUser({ id: inv.userId, firstName: inv.firstName, lastName: inv.lastName, email: inv.email });
                              setAttachInvoiceId(inv.id);
                              setMessageContent(`Bonjour, voici votre facture pour l'abonnement ${inv.planType}. Merci de votre confiance !`);
                            }}
                            className="p-2 text-slate-400 hover:text-emerald-500 transition-colors"
                            title="Envoyer au client"
                          >
                            <Send size={18} />
                          </button>
                        </div>
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
                          <p className="font-bold text-slate-900">{p.userName || `${p.firstName} ${p.lastName}`}</p>
                          <p className="text-xs text-slate-500">{p.userEmail || p.email}</p>
                        </div>
                      </td>
                      <td className="p-6">
                        <span className="font-bold text-slate-700 capitalize">{p.planType}</span>
                      </td>
                      <td className="p-6 font-bold text-slate-900">{p.amount} FCFA</td>
                      <td className="p-6 text-sm text-slate-500">{p.createdAt ? new Date(p.createdAt).toLocaleString() : 'Date inconnue'}</td>
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

        {activeTab === 'reviews' && <AdminReviews />}
        {activeTab === 'emails' && <AdminEmails />}
      </div>

      {/* Message Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl"
          >
            <div className="p-8 border-b border-slate-100 bg-slate-50">
              <h2 className="text-2xl font-black text-slate-900">Nouveau Message</h2>
              <p className="text-slate-500 font-medium">À : {selectedUser.firstName} {selectedUser.lastName} ({selectedUser.email})</p>
            </div>
            <form onSubmit={handleSendMessage} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Message</label>
                <textarea 
                  required
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 outline-none focus:border-primary min-h-[150px] resize-none font-medium"
                  placeholder="Écrivez votre message ici..."
                />
              </div>
              
              {attachInvoiceId && (
                <div className="flex items-center space-x-3 bg-emerald-50 text-emerald-700 px-4 py-3 rounded-xl border border-emerald-100">
                  <Receipt size={18} />
                  <span className="text-sm font-bold">Facture #{invoices.find(i => i.id === attachInvoiceId)?.invoiceNumber} jointe</span>
                  <button 
                    type="button"
                    onClick={() => setAttachInvoiceId(null)}
                    className="ml-auto text-emerald-400 hover:text-emerald-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}

              <div className="flex items-center space-x-4">
                <button 
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="flex-1 px-6 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-all"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  disabled={isSendingMessage}
                  className="flex-[2] bg-primary text-white py-4 rounded-2xl font-bold hover:bg-primary-dark transition-all shadow-xl shadow-primary/20 flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {isSendingMessage ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send size={18} />
                      <span>Envoyer le message</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Invoice Preview Modal */}
      {previewInvoice && (
        <InvoicePDF 
          invoice={previewInvoice} 
          onClose={() => setPreviewInvoice(null)} 
        />
      )}
    </div>
  );
}
