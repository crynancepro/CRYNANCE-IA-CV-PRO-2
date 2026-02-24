import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Plus, Trash2, Tag, Percent, DollarSign, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

interface PromoCode {
  id: number;
  code: string;
  discount: number;
  type: 'fixed' | 'percentage';
  startDate: string;
  endDate: string;
}

export default function AdminPromo() {
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newCode, setNewCode] = useState({ code: '', discount: 0, type: 'fixed', startDate: '', endDate: '' });
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchPromos();
  }, [navigate]);

  const fetchPromos = async () => {
    try {
      const response = await api.admin.getPromos();
      const data = await response.json();
      setPromos(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      const response = await api.admin.createPromo(newCode);
      if (response.ok) {
        setNewCode({ code: '', discount: 0, type: 'fixed', startDate: '', endDate: '' });
        fetchPromos();
      } else {
        const data = await response.json();
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce code promo ?')) return;
    try {
      await api.admin.deletePromo(id);
      fetchPromos();
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="pt-32 flex justify-center">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 px-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Gestion des Codes Promo</h1>
          <p className="text-slate-500">Créez et gérez les réductions pour vos utilisateurs.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Add Form */}
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 sticky top-32">
            <h3 className="text-lg font-bold mb-4 flex items-center space-x-2">
              <Plus size={20} className="text-primary" />
              <span>Nouveau Code</span>
            </h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Code</label>
                <input
                  required
                  type="text"
                  value={newCode.code}
                  onChange={(e) => setNewCode({ ...newCode, code: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-primary"
                  placeholder="EX: PROMO50"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Réduction (FCFA)</label>
                <input
                  required
                  type="number"
                  value={newCode.discount}
                  onChange={(e) => setNewCode({ ...newCode, discount: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-primary"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Début</label>
                  <input
                    required
                    type="date"
                    value={newCode.startDate}
                    onChange={(e) => setNewCode({ ...newCode, startDate: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-primary text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">Fin</label>
                  <input
                    required
                    type="date"
                    value={newCode.endDate}
                    onChange={(e) => setNewCode({ ...newCode, endDate: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-primary text-sm"
                  />
                </div>
              </div>
              <button
                disabled={isAdding}
                className="w-full bg-primary text-white py-3 rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all flex items-center justify-center space-x-2"
              >
                {isAdding ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                <span>Ajouter le code</span>
              </button>
            </form>
          </div>
        </div>

        {/* List */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Code</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Réduction</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Validité</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {promos.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-slate-400">
                      Aucun code promo actif.
                    </td>
                  </tr>
                ) : (
                  promos.map((promo) => (
                    <tr key={promo.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <Tag size={16} className="text-primary" />
                          <span className="font-bold text-slate-900">{promo.code}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-emerald-600">-{promo.discount} FCFA</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-slate-500">
                          <div>Du {promo.startDate}</div>
                          <div>Au {promo.endDate}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(promo.id)}
                          className="text-slate-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
