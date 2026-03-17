import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Mail, Phone, MapPin, Camera, Save, Loader2, AlertCircle, CheckCircle2, Shield, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db, auth as firebaseAuth } from '../firebase';
import { sendEmailVerification } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';

export default function Profile() {
  const { user, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
    address: user?.address || '',
    bio: user?.bio || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await updateDoc(doc(db, 'users', user.uid), formData);
      await refreshProfile();
      setSuccess('Profil mis à jour avec succès !');
    } catch (err) {
      console.error(err);
      setError('Erreur lors de la mise à jour du profil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendVerification = async () => {
    if (!firebaseAuth.currentUser) return;
    setIsVerifying(true);
    setError('');
    setSuccess('');
    try {
      await sendEmailVerification(firebaseAuth.currentUser);
      setSuccess('Email de vérification envoyé ! Veuillez consulter votre boîte de réception.');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/too-many-requests') {
        setError('Trop de tentatives. Veuillez réessayer plus tard.');
      } else {
        setError('Erreur lors de l\'envoi de l\'email de vérification.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="pt-24 pb-20 px-4 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Mon Profil</h1>
        <p className="text-slate-500">Gérez vos informations personnelles et vos préférences.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Sidebar Info */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 text-center">
            <div className="relative inline-block mb-4">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                <User size={48} />
              </div>
              <button className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-lg hover:bg-primary-dark transition-all">
                <Camera size={16} />
              </button>
            </div>
            <h2 className="text-xl font-black text-slate-900">{user?.firstName} {user?.lastName}</h2>
            <p className="text-slate-500 text-sm mb-4">{user?.email}</p>
            <div className="flex items-center justify-center space-x-2 px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-600">
              <Shield size={10} />
              <span>Compte {user?.role === 'admin' ? 'Administrateur' : 'Utilisateur'}</span>
            </div>
          </div>

          <div className="bg-primary/5 p-6 rounded-[2.5rem] border border-primary/10">
            <h3 className="text-sm font-black text-primary uppercase tracking-widest mb-4">Statistiques</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 text-sm">CV Restants</span>
                <span className="font-black text-slate-900">{user?.cvGenerationsRemaining}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 text-sm">Lettres Restantes</span>
                <span className="font-black text-slate-900">{user?.letterGenerationsRemaining}</span>
              </div>
              <div className="pt-4 border-t border-primary/10">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 text-sm">Statut</span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded-full text-[10px] font-black uppercase">
                    {user?.status || 'Actif'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <div className="md:col-span-2">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm flex items-center">
                  <AlertCircle size={16} className="mr-2 flex-shrink-0" />
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 px-4 py-3 rounded-2xl text-sm flex items-center">
                  <CheckCircle2 size={16} className="mr-2 flex-shrink-0" />
                  {success}
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Prénom</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-primary transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Nom</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-primary transition-all"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Email (Non modifiable)</label>
                <div className="flex flex-col space-y-2">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full pl-12 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-2xl text-slate-500 cursor-not-allowed"
                    />
                  </div>
                  <div className="flex items-center justify-between px-2">
                    <div className="flex items-center space-x-2">
                      {user?.emailVerified ? (
                        <div className="flex items-center text-emerald-600 text-xs font-bold">
                          <CheckCircle2 size={14} className="mr-1" />
                          Email vérifié
                        </div>
                      ) : (
                        <div className="flex items-center text-amber-600 text-xs font-bold">
                          <AlertCircle size={14} className="mr-1" />
                          Email non vérifié
                        </div>
                      )}
                    </div>
                    {!user?.emailVerified && (
                      <button
                        type="button"
                        onClick={handleSendVerification}
                        disabled={isVerifying}
                        className="text-primary text-xs font-black uppercase tracking-widest hover:underline flex items-center disabled:opacity-50"
                      >
                        {isVerifying ? (
                          <Loader2 size={12} className="animate-spin mr-1" />
                        ) : (
                          <Send size={12} className="mr-1" />
                        )}
                        Renvoyer le lien
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Téléphone</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-primary transition-all"
                      placeholder="+221 ..."
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Adresse</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-primary transition-all"
                      placeholder="Dakar, Sénégal"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Bio / Présentation</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={4}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-primary transition-all resize-none"
                  placeholder="Parlez-nous un peu de vous..."
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    <Save size={20} />
                    <span>Enregistrer les modifications</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
