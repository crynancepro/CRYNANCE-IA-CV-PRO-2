import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Star, CheckCircle2, Trash2, Clock, User, Mail, MessageSquare } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AdminReviews() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState<{ message: string, onConfirm: () => void } | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchReviews = async () => {
    if (!user || (user.email !== 'peter25ngouala@gmail.com' && user.role !== 'admin')) {
      navigate('/dashboard');
      return;
    }
    try {
      const res = await api.admin.getReviews();
      if (res.ok) {
        setReviews(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleApprove = async (id: number) => {
    try {
      const res = await api.admin.approveReview(id);
      if (res.ok) {
        fetchReviews();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    setConfirmModal({
      message: "Supprimer cet avis ?",
      onConfirm: async () => {
        try {
          const res = await api.admin.deleteReview(id);
          if (res.ok) {
            fetchReviews();
          }
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  if (loading) return <div className="p-8 text-center">Chargement...</div>;

  return (
    <div className="p-4 md:p-8">
      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white p-8 rounded-[2.5rem] shadow-2xl max-w-md w-full"
          >
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-6">
              <Star size={32} />
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

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Gestion des Avis</h1>
          <p className="text-slate-500">Modérez les témoignages des utilisateurs.</p>
        </div>
      </div>

      <div className="grid gap-6">
        {reviews.map((review) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="flex text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={16} fill={i < review.rating ? "currentColor" : "none"} />
                    ))}
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${review.isApproved ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                    {review.isApproved ? 'Approuvé' : 'En attente'}
                  </span>
                </div>
                <p className="text-slate-700 mb-4 italic">"{review.content}"</p>
                <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                  <div className="flex items-center space-x-1">
                    <User size={12} />
                    <span>{review.firstName} {review.lastName}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Mail size={12} />
                    <span>{review.email}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock size={12} />
                    <span>{review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'Date inconnue'}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {!review.isApproved && (
                  <button
                    onClick={() => handleApprove(review.id)}
                    className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors"
                    title="Approuver"
                  >
                    <CheckCircle2 size={20} />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(review.id)}
                  className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                  title="Supprimer"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}

        {reviews.length === 0 && (
          <div className="text-center py-20 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
            <MessageSquare size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 font-bold">Aucun avis pour le moment.</p>
          </div>
        )}
      </div>
    </div>
  );
}
