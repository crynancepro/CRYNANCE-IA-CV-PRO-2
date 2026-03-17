import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Mail, User, Clock, Search, ChevronRight, MessageSquare } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AdminEmails() {
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchEmails = async () => {
    if (!user || (user.email !== 'peter25ngouala@gmail.com' && user.role !== 'admin')) {
      navigate('/dashboard');
      return;
    }
    try {
      const res = await api.admin.getEmails();
      if (res.ok) {
        setEmails(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  const filteredEmails = emails.filter(email => 
    email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    email.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    email.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    email.lastName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-8 text-center">Chargement...</div>;

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Historique des Emails</h1>
          <p className="text-slate-500">Consultez les emails automatiques envoyés aux utilisateurs.</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Rechercher un email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white rounded-xl border border-slate-200 outline-none focus:border-primary transition-all"
          />
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Utilisateur</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Objet</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Date d'envoi</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredEmails.map((email) => (
                <tr key={email.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-bold text-xs">
                        {email.firstName[0]}{email.lastName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{email.firstName} {email.lastName}</p>
                        <p className="text-xs text-slate-500">{email.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <Mail size={14} className="text-primary" />
                      <span className="text-sm font-medium text-slate-700">{email.subject}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2 text-xs text-slate-500">
                      <Clock size={12} />
                      <span>{email.sentAt ? new Date(email.sentAt).toLocaleString() : 'Date inconnue'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => alert(email.content)}
                      className="p-2 text-slate-400 hover:text-primary transition-colors"
                      title="Voir le contenu"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredEmails.length === 0 && (
          <div className="text-center py-20">
            <MessageSquare size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-500 font-bold">Aucun email trouvé.</p>
          </div>
        )}
      </div>
    </div>
  );
}
