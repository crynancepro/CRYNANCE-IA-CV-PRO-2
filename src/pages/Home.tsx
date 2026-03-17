import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, Sparkles, ShieldCheck, Zap, ArrowRight, 
  CheckCircle2, Users, Flame, Star, MousePointer2, 
  Download, Globe, Languages, Layout, Briefcase,
  Check, X, Search
} from 'lucide-react';
import { api } from '../services/api';
import { storage } from '../utils/storage';
import Testimonials from '../components/Testimonials';

export default function Home() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalCvs: 12450,
    totalUsers: 3200,
    cvsToday: 85,
    satisfaction: 4.9
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'cv' | 'letter'>('all');

  const templates = [
    { id: 1, name: "Modern CV", type: "cv", img: "https://picsum.photos/seed/modern-cv/600/800", tag: "Le plus populaire", category: "Moderne" },
    { id: 2, name: "Classic CV", type: "cv", img: "https://picsum.photos/seed/classic-cv/600/800", tag: "Intemporel", category: "Professionnel" },
    { id: 3, name: "Creative CV", type: "cv", img: "https://picsum.photos/seed/creative-cv/600/800", tag: "Original", category: "Créatif" },
    { id: 4, name: "Executive CV", type: "cv", img: "https://picsum.photos/seed/executive-cv/600/800", tag: "Premium", category: "Direction" },
    { id: 5, name: "Minimalist CV", type: "cv", img: "https://picsum.photos/seed/minimal-cv/600/800", tag: "Épuré", category: "Minimaliste" },
    { id: 6, name: "Lettre de Motivation Standard", type: "letter", img: "https://picsum.photos/seed/letter-std/600/800", tag: "Essentiel", category: "Standard" },
    { id: 7, name: "Lettre de Motivation Créative", type: "letter", img: "https://picsum.photos/seed/letter-creative/600/800", tag: "Design", category: "Créatif" },
    { id: 8, name: "Lettre de Motivation Executive", type: "letter", img: "https://picsum.photos/seed/letter-exec/600/800", tag: "Sérieux", category: "Direction" },
  ];

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         t.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || t.type === activeCategory;
    return matchesSearch && matchesCategory;
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.public.getStats();
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="bg-white">
      {/* 1. HERO SECTION */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/5 rounded-full blur-[120px]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center lg:text-left"
            >
              <div className="inline-flex items-center space-x-2 bg-primary/10 px-4 py-2 rounded-full text-primary text-sm font-bold uppercase tracking-wider mb-8">
                <Sparkles size={16} />
                <span>L'Intelligence Artificielle au service de votre carrière</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-[1.1] mb-8">
                Créez votre CV professionnel en <span className="text-primary">quelques minutes</span> avec l’IA
              </h1>
              <h2 className="text-lg text-slate-600 mb-10 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Générez un CV et une lettre de motivation optimisés pour les recruteurs grâce à l’intelligence artificielle. Démarquez-vous et décrochez votre job idéal.
              </h2>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start space-y-4 sm:space-y-0 sm:space-x-4">
                <button 
                  onClick={() => {
                    storage.clearCV();
                    navigate('/create-cv');
                  }}
                  className="w-full sm:w-auto bg-primary text-white px-10 py-5 rounded-2xl font-bold text-lg hover:bg-primary-dark transition-all shadow-2xl shadow-primary/30 flex items-center justify-center group"
                >
                  Créer mon CV maintenant
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
                </button>
                <a href="#models" className="w-full sm:w-auto bg-white text-slate-700 border border-slate-200 px-10 py-5 rounded-2xl font-bold text-lg hover:bg-slate-50 transition-all flex items-center justify-center space-x-2">
                  <Layout size={20} className="text-primary" />
                  <span>Voir les modèles</span>
                </a>
              </div>
              
              <div className="mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm text-slate-500 font-medium">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 size={18} className="text-emerald-500" />
                  <span>Optimisé ATS</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 size={18} className="text-emerald-500" />
                  <span>Export PDF & Word</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 size={18} className="text-emerald-500" />
                  <span>100% Personnalisable</span>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mt-16 lg:mt-0 relative"
            >
              <div className="relative z-10 bg-white rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden transform hover:scale-[1.02] transition-transform duration-500">
                <img
                  src="https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?q=80&w=800&auto=format&fit=crop"
                  alt="Professionnel utilisant CRYNANCE IA"
                  className="w-full h-auto"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
                
                {/* Overlay text for a professional touch */}
                <div className="absolute bottom-8 left-8 right-8 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <p className="text-white text-xs font-bold uppercase tracking-widest">IA Active : Optimisation en cours</p>
                  </div>
                </div>
              </div>
              
              {/* Floating Badge */}
              <motion.div 
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-8 -right-8 bg-white p-6 rounded-[2rem] shadow-2xl border border-slate-50 hidden md:block z-20"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                    <Zap size={28} fill="currentColor" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Score de Recrutement</p>
                    <p className="text-3xl font-black text-slate-900">98%</p>
                  </div>
                </div>
              </motion.div>

              {/* Floating Stats Card */}
              <motion.div 
                animate={{ y: [0, 15, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -bottom-8 -left-8 bg-white p-5 rounded-[2rem] shadow-2xl border border-slate-50 hidden md:block z-20"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                        <img src={`https://i.pravatar.cc/100?u=${i}`} alt="User" />
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Utilisateurs Actifs</p>
                    <p className="text-sm font-bold text-slate-900">+3,200 Pros</p>
                  </div>
                </div>
              </motion.div>

              {/* Decorative circles */}
              <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl -z-10"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2. SECTION COMMENT ÇA MARCHE */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl font-black text-slate-900 mb-6">Comment ça marche ?</h2>
            <p className="text-base text-slate-600">Trois étapes simples pour transformer votre carrière.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Connecting Line (Desktop) */}
            <div className="hidden md:block absolute top-24 left-1/4 right-1/4 h-0.5 bg-slate-200 -z-10"></div>

            {[
              {
                step: "Étape 1",
                title: "Remplissez vos informations",
                desc: "Saisissez vos expériences, formations et compétences dans notre interface intuitive.",
                icon: MousePointer2,
                color: "bg-blue-500"
              },
              {
                step: "Étape 2",
                title: "L’IA génère votre CV professionnel",
                desc: "Notre intelligence artificielle analyse vos données et rédige un contenu percutant.",
                icon: Sparkles,
                color: "bg-primary"
              },
              {
                step: "Étape 3",
                title: "Téléchargez votre CV",
                desc: "Obtenez votre CV prêt à l'emploi en format PDF ou Word haute définition.",
                icon: Download,
                color: "bg-emerald-500"
              }
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="flex flex-col items-center text-center"
              >
                <div className={`w-20 h-20 ${item.color} text-white rounded-[2rem] flex items-center justify-center mb-8 shadow-xl shadow-slate-200 relative`}>
                  <item.icon size={32} />
                  <div className="absolute -top-2 -right-2 bg-white text-slate-900 w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shadow-md border border-slate-100">
                    {i + 1}
                  </div>
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-4">{item.title}</h3>
                <p className="text-slate-600 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* NEW: SERVICES EXPRESS SECTION */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-primary/5 -skew-x-12 translate-x-1/2 -z-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-16 gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center space-x-2 bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4">
                <Zap size={14} fill="currentColor" />
                <span>Services Express à la Carte</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight">
                Boostez votre candidature avec nos <span className="text-primary">Services Premium</span>
              </h2>
            </div>
            <p className="text-slate-600 font-medium lg:max-w-sm">
              Des solutions rapides et efficaces pour maximiser vos chances de décrocher l'entretien de vos rêves.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Optimisation CV",
                subtitle: "Pour offre d’emploi",
                price: "500",
                desc: "Adaptation précise de votre CV aux mots-clés d'une annonce spécifique pour passer les filtres.",
                icon: Briefcase,
                color: "bg-amber-500",
                link: "https://pay.wave.com/m/M_sn_wXlszdyVZOIV/c/sn/?amount=500"
              },
              {
                title: "Lettre de Motivation",
                subtitle: "Personnalisée par IA",
                price: "300",
                desc: "Une lettre percutante rédigée sur mesure pour captiver l'attention des recruteurs dès les premières lignes.",
                icon: FileText,
                color: "bg-purple-500",
                link: "https://pay.wave.com/m/M_sn_wXlszdyVZOIV/c/sn/?amount=300"
              },
              {
                title: "Analyse & Score ATS",
                subtitle: "Amélioration garantie",
                price: "200",
                desc: "Diagnostic complet de votre CV et calcul de compatibilité avec les systèmes de tri automatique.",
                icon: ShieldCheck,
                color: "bg-emerald-500",
                link: "https://pay.wave.com/m/M_sn_wXlszdyVZOIV/c/sn/?amount=200"
              }
            ].map((service, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl hover:shadow-2xl hover:border-primary/20 transition-all flex flex-col"
              >
                <div className={`w-16 h-16 ${service.color} text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                  <service.icon size={32} />
                </div>
                <div className="mb-6 flex-1">
                  <h3 className="text-2xl font-black text-slate-900 mb-1">{service.title}</h3>
                  <p className="text-primary font-bold text-sm uppercase tracking-widest mb-4">{service.subtitle}</p>
                  <p className="text-slate-600 leading-relaxed text-sm">{service.desc}</p>
                </div>
                <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                  <div>
                    <span className="text-3xl font-black text-slate-900">{service.price}</span>
                    <span className="text-slate-400 font-bold text-xs ml-1 uppercase">FCFA</span>
                  </div>
                  <a 
                    href={service.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-primary transition-all flex items-center space-x-2 group/btn"
                  >
                    <span>Commander</span>
                    <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. SECTION MODÈLES DE CV & LETTRES */}
      <section id="models" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-black text-slate-900 mb-6">Nos Modèles de CV & Lettres</h2>
            <p className="text-base text-slate-600 mb-10">Des designs conçus par des experts en recrutement pour maximiser vos chances.</p>
            
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-12">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Rechercher un modèle (ex: Moderne, Créatif...)" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                />
              </div>
              <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                <button 
                  onClick={() => setActiveCategory('all')}
                  className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeCategory === 'all' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Tous
                </button>
                <button 
                  onClick={() => setActiveCategory('cv')}
                  className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeCategory === 'cv' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  CV
                </button>
                <button 
                  onClick={() => setActiveCategory('letter')}
                  className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeCategory === 'letter' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Lettres
                </button>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredTemplates.length > 0 ? (
                filteredTemplates.map((model) => (
                  <motion.div 
                    key={model.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={{ y: -10 }}
                    className="group relative"
                  >
                    <div className="aspect-[3/4] rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-xl mb-6 relative">
                      <img src={model.img} alt={model.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button 
                          onClick={() => {
                            if (model.type === 'cv') {
                              storage.clearCV();
                              navigate('/create-cv');
                            } else {
                              navigate('/cover-letter');
                            }
                          }}
                          className="bg-white text-slate-900 px-8 py-3 rounded-xl font-bold transform translate-y-4 group-hover:translate-y-0 transition-transform"
                        >
                          Utiliser ce modèle
                        </button>
                      </div>
                      {model.tag && (
                        <div className="absolute top-6 left-6 bg-primary text-white px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-lg">
                          {model.tag}
                        </div>
                      )}
                      <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-sm text-slate-900 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                        {model.category}
                      </div>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 text-center">{model.name}</h3>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full py-20 text-center">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
                    <Search size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Aucun modèle trouvé</h3>
                  <p className="text-slate-500">Essayez d'autres mots-clés ou changez de catégorie.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* 4. SECTION STATISTIQUES */}
      <section className="py-20 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            {[
              { label: "CV générés", value: (stats.totalCvs || 0).toLocaleString(), icon: FileText, color: "text-primary" },
              { label: "Utilisateurs inscrits", value: (stats.totalUsers || 0).toLocaleString(), icon: Users, color: "text-blue-400" },
              { label: "Note moyenne", value: `${stats.satisfaction || 0}/5`, icon: Star, color: "text-amber-400" },
              { label: "CV créés aujourd’hui", value: (stats.cvsToday || 0).toLocaleString(), icon: Flame, color: "text-orange-500" }
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 mb-6 ${stat.color}`}>
                  <stat.icon size={32} fill={stat.icon === Star ? "currentColor" : "none"} />
                </div>
                <div className="text-4xl font-black mb-2">{stat.value}</div>
                <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. SECTION FONCTIONNALITÉS */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl font-black text-slate-900 mb-6">Tout ce dont vous avez besoin</h2>
            <p className="text-base text-slate-600">Des outils puissants pour une candidature parfaite.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Génération CV avec IA", desc: "L'IA rédige vos descriptions de postes et accroches professionnelles.", icon: Sparkles, color: "bg-purple-50 text-purple-600" },
              { title: "Lettre de motivation", desc: "Générez une lettre personnalisée en un clic pour chaque offre.", icon: FileText, color: "bg-blue-50 text-blue-600" },
              { title: "Traduction du CV", desc: "Traduisez instantanément votre CV en plusieurs langues.", icon: Languages, color: "bg-emerald-50 text-emerald-600" },
              { title: "Optimisation ATS", desc: "Templates testés pour passer les filtres des recruteurs.", icon: ShieldCheck, color: "bg-amber-50 text-amber-600" },
              { title: "Téléchargement PDF / Word", desc: "Exportez vos documents dans les formats standards du marché.", icon: Download, color: "bg-red-50 text-red-600" },
              { title: "Templates professionnels", desc: "Une large sélection de designs modernes et élégants.", icon: Layout, color: "bg-indigo-50 text-indigo-600" }
            ].map((f, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -5 }}
                className="p-8 rounded-[2rem] bg-slate-50 border border-slate-100 transition-all"
              >
                <div className={`w-14 h-14 ${f.color} rounded-2xl flex items-center justify-center mb-6 shadow-sm`}>
                  <f.icon size={28} />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-3">{f.title}</h3>
                <p className="text-slate-600 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. SECTION AVIS UTILISATEURS */}
      <Testimonials />

      {/* 7. SECTION TARIFS */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl font-black text-slate-900 mb-6">Tarifs Simples & Transparents</h2>
            <p className="text-base text-slate-600">Choisissez le service qui correspond à vos besoins immédiats.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              { 
                name: "Analyse & Score ATS", 
                price: "200", 
                features: ["Calcul du score ATS", "Diagnostic complet", "Conseils de correction", "Accès immédiat"], 
                color: "border-slate-200",
                link: "https://pay.wave.com/m/M_sn_wXlszdyVZOIV/c/sn/?amount=200"
              },
              { 
                name: "Optimisation CV Pro", 
                price: "500", 
                features: ["Adaptation à l'offre", "Mots-clés optimisés", "Mise en page pro", "Support prioritaire"], 
                color: "border-primary shadow-2xl shadow-primary/10", 
                popular: true,
                link: "https://pay.wave.com/m/M_sn_wXlszdyVZOIV/c/sn/?amount=500"
              },
              { 
                name: "Lettre de Motivation", 
                price: "300", 
                features: ["Rédaction IA sur mesure", "Adaptée au poste visé", "Style professionnel", "Prête à l'emploi"], 
                color: "border-slate-200",
                link: "https://pay.wave.com/m/M_sn_wXlszdyVZOIV/c/sn/?amount=300"
              }
            ].map((plan, i) => (
              <div key={i} className={`bg-white rounded-[2.5rem] p-10 border-2 ${plan.color} relative flex flex-col`}>
                {plan.popular && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-primary text-white px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest">
                    Le plus choisi
                  </div>
                )}
                <div className="mb-8">
                  <h3 className="text-xl font-black text-slate-900 mb-4">{plan.name}</h3>
                  <div className="flex items-baseline">
                    <span className="text-4xl font-black text-slate-900">{plan.price}</span>
                    <span className="text-slate-500 font-bold ml-2 uppercase tracking-widest">FCFA</span>
                  </div>
                </div>
                <ul className="space-y-4 mb-10 flex-1">
                  {plan.features.map((feat, j) => (
                    <li key={j} className="flex items-center space-x-3 text-slate-600 font-medium">
                      <div className="w-5 h-5 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <Check size={12} />
                      </div>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
                <a 
                  href={plan.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full py-4 rounded-2xl font-bold text-center transition-all ${plan.popular ? 'bg-primary text-white shadow-xl shadow-primary/20 hover:bg-primary-dark' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                  Commander avec Wave
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. SECTION APPEL À L’ACTION FINAL */}
      <section className="py-24 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-primary rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden shadow-2xl shadow-primary/30">
            {/* Decorations */}
            <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-black/10 rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-black text-white mb-8">Prêt à créer votre CV professionnel ?</h2>
              <p className="text-primary-light text-lg mb-12 max-w-2xl mx-auto font-medium">
                Rejoignez des milliers d'utilisateurs qui ont déjà boosté leur carrière avec CRYNANCE IA.
              </p>
              <Link to="/create-cv" className="inline-flex items-center bg-white text-primary px-12 py-5 rounded-2xl font-black text-xl hover:bg-slate-50 transition-all shadow-2xl shadow-black/10 group">
                Créer mon CV maintenant
                <ArrowRight className="ml-3 group-hover:translate-x-2 transition-transform" size={24} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
