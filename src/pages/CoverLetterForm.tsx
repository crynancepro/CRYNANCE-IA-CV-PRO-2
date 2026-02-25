import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'motion/react';
import { FileText, Sparkles, Loader2, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useEffect } from 'react';
import { generateCoverLetter } from '../services/geminiService';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { CoverLetterData } from '../types';

export default function CoverLetterForm() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const navigate = useNavigate();

  const { register, handleSubmit, watch, reset } = useForm<CoverLetterData>({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      targetJob: '',
      company: '',
      contractType: 'CDI',
      motivation: ''
    }
  });

  const formData = watch();

  useEffect(() => {
    const saved = localStorage.getItem('currentLetterData');
    if (saved) {
      reset(JSON.parse(saved));
    }
  }, [reset]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (Object.keys(formData).length > 0) {
        setIsAutoSaving(true);
        localStorage.setItem('currentLetterData', JSON.stringify(formData));
        
        // Permanent save if logged in
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        if (user) {
          await api.letters.save({
            id: localStorage.getItem('currentLetterId') || Date.now().toString(),
            data: formData,
            content: localStorage.getItem('currentLetter') || ''
          });
        }
        
        setTimeout(() => setIsAutoSaving(false), 1000);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [formData]);

  const onSubmit = async (data: CoverLetterData) => {
    setIsGenerating(true);
    try {
      const cvData = JSON.parse(localStorage.getItem('currentCV') || '{}');
      const content = await generateCoverLetter(cvData, data);
      localStorage.setItem('currentLetter', JSON.stringify({ data, content }));
      navigate('/cover-letter-preview');
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la génération de la lettre");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="pt-24 pb-16 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12 relative">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Lettre de Motivation IA</h1>
          <p className="text-slate-600">Générez une lettre personnalisée basée sur votre profil et le poste visé.</p>
          {isAutoSaving && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute top-0 right-0 flex items-center space-x-1 text-emerald-500 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-lg"
            >
              <CheckCircle2 size={12} />
              <span>Lettre sauvegardée</span>
            </motion.div>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-[2rem] shadow-xl border border-slate-100 p-8 md:p-12 space-y-8">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Prénom</label>
              <input {...register("firstName", { required: true })} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-primary outline-none transition-all" placeholder="Jean" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Nom</label>
              <input {...register("lastName", { required: true })} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-primary outline-none transition-all" placeholder="Dupont" />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Poste recherché</label>
              <input {...register("targetJob", { required: true })} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-primary outline-none transition-all" placeholder="Ex: Développeur Fullstack" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Entreprise</label>
              <input {...register("company", { required: true })} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-primary outline-none transition-all" placeholder="Ex: Google" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Type de contrat</label>
            <select {...register("contractType")} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-primary">
              <option value="CDI">CDI</option>
              <option value="CDD">CDD</option>
              <option value="Stage">Stage</option>
              <option value="Alternance">Alternance</option>
              <option value="Freelance">Freelance</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Points clés de motivation (Optionnel)</label>
            <textarea {...register("motivation")} rows={5} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-primary outline-none transition-all" placeholder="Mentionnez des projets spécifiques ou pourquoi cette entreprise vous attire..." />
          </div>

          <button type="submit" disabled={isGenerating} className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center space-x-2 hover:bg-primary-dark transition-all shadow-xl shadow-primary/20 disabled:opacity-50">
            {isGenerating ? (
              <>
                <Loader2 className="animate-spin" size={24} />
                <span>Génération en cours...</span>
              </>
            ) : (
              <>
                <Sparkles size={24} />
                <span>Générer ma lettre</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
