import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FileText, User, CreditCard, Home, LogOut, Menu, X, ShieldCheck, HelpCircle, Search, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { storage } from '../utils/storage';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const isAdmin = user?.email === 'peter25ngouala@gmail.com' || user?.role === 'admin';

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = [
    { name: 'Accueil', path: '/', icon: Home },
  ];

  if (user) {
    if (isAdmin) {
      navLinks.push({ name: 'Admin: Dashboard', path: '/admin?tab=stats', icon: ShieldCheck });
      navLinks.push({ name: 'Admin: Utilisateurs', path: '/admin?tab=users', icon: User });
      navLinks.push({ name: 'Admin: Paiements', path: '/admin?tab=payments', icon: CreditCard });
      navLinks.push({ name: 'Admin: Codes Promo', path: '/admin?tab=promos', icon: ShieldCheck });
      navLinks.push({ name: 'Mon Profil', path: '/profile', icon: User });
    } else {
      navLinks.push({ name: 'Mes CV', path: '/dashboard', icon: FileText });
      navLinks.push({ name: 'Optimisation CV', path: '/optimization', icon: Zap });
      navLinks.push({ name: 'Lettre de Motivation', path: '/cover-letter', icon: FileText });
      navLinks.push({ name: 'Analyse ATS', path: '/ats-analysis', icon: Search });
      navLinks.push({ name: 'Mon Profil', path: '/profile', icon: User });
      navLinks.push({ name: 'Premium', path: '/premium', icon: CreditCard });
    }
  } else {
    navLinks.push({ name: 'Créer CV', path: '/create-cv', icon: FileText });
    navLinks.push({ name: 'Optimisation CV', path: '/optimization', icon: Zap });
    navLinks.push({ name: 'Lettre de Motivation', path: '/cover-letter', icon: FileText });
    navLinks.push({ name: 'Analyse ATS', path: '/ats-analysis', icon: Search });
    navLinks.push({ name: 'Premium', path: '/premium', icon: CreditCard });
  }

  navLinks.push({ name: 'Aide & FAQ', path: '/help', icon: HelpCircle });

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                <FileText size={24} />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black tracking-tight text-slate-900 leading-none">CRYNANCE <span className="text-primary">IA CV PRO 2</span></span>
                {user?.role === 'admin' ? (
                  <span className="text-[10px] font-black text-primary uppercase tracking-tighter">Mode Administrateur</span>
                ) : user?.isPremium ? (
                  <span className="text-[10px] font-black text-primary uppercase tracking-tighter">Premium Pro</span>
                ) : null}
              </div>
            </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => {
                  if (link.path === '/create-cv') storage.clearCV();
                }}
                className={`text-sm font-medium transition-colors hover:text-primary ${location.pathname === link.path ? 'text-primary' : 'text-slate-600'}`}
              >
                {link.name}
              </Link>
            ))}
            {user ? (
              <button onClick={handleLogout} className="flex items-center space-x-1 text-sm font-medium text-slate-600 hover:text-red-500 transition-colors">
                <LogOut size={16} />
                <span>Déconnexion</span>
              </button>
            ) : (
              <Link to="/login" className="bg-primary text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-primary-dark transition-all shadow-lg shadow-primary/20">
                Connexion
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-slate-600">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[60] md:hidden bg-white"
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <Link to="/" onClick={() => setIsOpen(false)} className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
                    <FileText size={18} />
                  </div>
                  <span className="text-lg font-black text-slate-900">CRYNANCE</span>
                </Link>
                <button onClick={() => setIsOpen(false)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-8 px-6 space-y-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={() => {
                      setIsOpen(false);
                      if (link.path === '/create-cv') storage.clearCV();
                    }}
                    className={`flex items-center space-x-4 p-4 rounded-2xl transition-all ${location.pathname === link.path ? 'bg-primary/5 text-primary' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <div className={`p-2 rounded-xl ${location.pathname === link.path ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}>
                      <link.icon size={20} />
                    </div>
                    <span className="font-bold">{link.name}</span>
                  </Link>
                ))}
              </div>

              <div className="p-6 border-t border-slate-100 space-y-4">
                {user ? (
                  <button 
                    onClick={() => { handleLogout(); setIsOpen(false); }}
                    className="w-full flex items-center justify-center space-x-2 p-4 rounded-2xl bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-all"
                  >
                    <LogOut size={20} />
                    <span>Déconnexion</span>
                  </button>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="block w-full text-center bg-primary text-white py-4 rounded-2xl font-bold shadow-xl shadow-primary/20"
                  >
                    Connexion
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
