import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FileText, User, CreditCard, Home, LogOut, Menu, X, ShieldCheck, MessageCircle, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const navLinks = [
    { name: 'Accueil', path: '/', icon: Home },
  ];

  if (user) {
    if (user.role === 'admin') {
      navLinks.push({ name: 'Admin: Utilisateurs', path: '/admin?tab=users', icon: ShieldCheck });
      navLinks.push({ name: 'Admin: Paiements', path: '/admin?tab=payments', icon: CreditCard });
      navLinks.push({ name: 'Admin: Codes Promo', path: '/admin?tab=promos', icon: ShieldCheck });
    } else {
      navLinks.push({ name: 'Mes CV', path: '/dashboard', icon: FileText });
      navLinks.push({ name: 'Mes Lettres', path: '/dashboard', icon: FileText });
      navLinks.push({ name: 'Premium', path: '/premium', icon: CreditCard });
    }
  } else {
    navLinks.push({ name: 'Créer CV', path: '/create-cv', icon: FileText });
    navLinks.push({ name: 'Premium', path: '/premium', icon: CreditCard });
  }

  navLinks.push({ name: 'Aide & FAQ', path: '/help', icon: HelpCircle });
  navLinks.push({ name: 'Contact', path: '/contact', icon: MessageCircle });

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
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-slate-100 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-4 text-base font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <link.icon size={20} className="text-primary" />
                    <span>{link.name}</span>
                  </div>
                </Link>
              ))}
              {!user && (
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="block w-full text-center bg-primary text-white py-3 rounded-xl mt-4 font-medium"
                >
                  Connexion
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
