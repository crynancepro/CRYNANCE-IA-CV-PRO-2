import React from 'react';
import { motion } from 'motion/react';
import { 
  HelpCircle, Book, Zap, FileText, 
  Search, CheckCircle2, MessageCircle, 
  ArrowRight, Sparkles, ShieldCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';

const faqs = [
  {
    question: "Comment fonctionne la génération de CV avec l'IA ?",
    answer: "Notre IA analyse vos informations professionnelles et les reformule pour mettre en avant vos compétences clés. Elle utilise des verbes d'action puissants et structure vos expériences de manière à attirer l'attention des recruteurs.",
    icon: <Sparkles className="text-primary" size={24} />
  },
  {
    question: "Qu'est-ce que l'optimisation ATS ?",
    answer: "L'ATS (Applicant Tracking System) est un logiciel utilisé par les entreprises pour filtrer les CV. Nos templates sont conçus pour être 100% lisibles par ces systèmes, garantissant que votre CV ne soit pas rejeté pour des raisons techniques.",
    icon: <Search className="text-blue-500" size={24} />
  },
  {
    question: "Comment activer mon abonnement Premium ?",
    answer: "Après avoir effectué votre paiement via Wave, cliquez sur le bouton 'J'ai déjà payé' sur la page Premium. Un administrateur confirmera votre paiement et votre accès sera activé pour 24 heures.",
    icon: <Zap className="text-amber-500" size={24} />
  },
  {
    question: "Puis-je modifier mon CV après génération ?",
    answer: "Oui, absolument ! Vous pouvez modifier toutes les sections de votre CV à tout moment depuis votre tableau de bord. Les modifications sont enregistrées automatiquement.",
    icon: <Edit className="text-purple-500" size={24} />
  },
  {
    question: "Quels sont les avantages du format PDF ?",
    answer: "Le PDF est le format standard pour les candidatures. Il garantit que votre mise en page reste intacte, peu importe l'appareil ou le logiciel utilisé par le recruteur pour l'ouvrir.",
    icon: <FileText className="text-emerald-500" size={24} />
  },
  {
    question: "Comment maximiser mes chances avec l'IA ?",
    answer: "Soyez précis dans vos descriptions. Plus vous donnez de détails sur vos réalisations (chiffres, outils utilisés, responsabilités), plus l'IA pourra générer un contenu riche et convaincant.",
    icon: <CheckCircle2 className="text-blue-600" size={24} />
  }
];

const tips = [
  {
    title: "Mots-clés stratégiques",
    description: "Identifiez les compétences requises dans l'offre d'emploi et assurez-vous qu'elles apparaissent dans votre CV. L'ATS les recherche en priorité.",
    category: "ATS"
  },
  {
    title: "Verbes d'action",
    description: "Commencez vos puces par des verbes forts : 'Piloté', 'Conçu', 'Négocié'. Cela montre votre proactivité et vos résultats.",
    category: "Contenu"
  },
  {
    title: "Simplicité du design",
    description: "Évitez les graphiques complexes ou les colonnes multiples si vous postulez dans de grandes entreprises utilisant des ATS anciens.",
    category: "Technique"
  },
  {
    title: "Réalisations chiffrées",
    description: "Transformez vos tâches en résultats : 'Augmentation de 20% du CA' est plus parlant que 'Gestion des ventes'.",
    category: "Impact"
  },
  {
    title: "Personnalisation",
    description: "Ne soumettez jamais le même CV à deux entreprises différentes. Adaptez le titre et les compétences clés à chaque fois.",
    category: "Stratégie"
  },
  {
    title: "Contact Direct",
    description: "Assurez-vous que vos coordonnées sont à jour et professionnelles. Utilisez une adresse email sobre (prenom.nom@email.com).",
    category: "Basique"
  }
];

import { Edit } from 'lucide-react';

export default function Help() {
  return (
    <div className="pt-32 pb-20 px-4 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-bold mb-4"
          >
            <HelpCircle size={16} />
            <span>Centre d'Aide & FAQ</span>
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">
            Comment utiliser <span className="text-primary">CRYNANCE IA</span>
          </h1>
          <p className="text-slate-600 text-lg">
            Tout ce que vous devez savoir pour créer des candidatures percutantes et optimisées.
          </p>
        </div>

        <div className="grid gap-8 mb-16">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center space-x-3">
            <Book className="text-primary" size={28} />
            <span>Questions Fréquentes</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {faqs.map((faq, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100"
              >
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-6">
                  {faq.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">{faq.question}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="bg-slate-900 rounded-[3rem] p-10 md:p-16 text-white mb-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] -mr-32 -mt-32"></div>
          <div className="relative z-10">
            <h2 className="text-3xl font-black mb-8 flex items-center space-x-3">
              <Zap className="text-primary" size={32} />
              <span>Conseils d'Experts pour l'ATS</span>
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {tips.map((tip, idx) => (
                <div key={idx} className="space-y-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">
                    {tip.category}
                  </span>
                  <h4 className="text-xl font-bold">{tip.title}</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">{tip.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Encore besoin d'aide ?</h2>
          <p className="text-slate-500 mb-8">Notre équipe est disponible sur WhatsApp pour vous accompagner.</p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <a 
              href="https://wa.me/221789619088" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-emerald-500 text-white px-8 py-4 rounded-2xl font-bold flex items-center space-x-3 hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
            >
              <MessageCircle size={20} />
              <span>Contacter sur WhatsApp</span>
            </a>
            <Link 
              to="/dashboard" 
              className="text-slate-600 font-bold flex items-center space-x-2 hover:text-primary transition-colors"
            >
              <span>Retour au tableau de bord</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
