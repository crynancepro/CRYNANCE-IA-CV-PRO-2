import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Trash2, ChevronRight, ChevronLeft, Sparkles, Image as ImageIcon, Loader2, CheckCircle2, X, Upload, User as UserIcon, Zap } from 'lucide-react';
import { useEffect } from 'react';
import { CVData } from '../types';
import { generateProfessionalCV, optimizeCVForJobOffer } from '../services/geminiService';
import PremiumLock from '../components/PremiumLock';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { storage } from '../utils/storage';
import { useAuth } from '../context/AuthContext';

export default function CVForm() {
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const navigate = useNavigate();
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const { user, refreshProfile } = useAuth();
  const [jobOffer, setJobOffer] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);

  const { register, control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<CVData>({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      profile: '',
      skills: [''],
      itSkills: [''],
      experiences: [{ company: '', position: '', startDate: '', endDate: '', description: '' }],
      education: [{ school: '', degree: '', year: '' }],
      qualities: [''],
      flaws: [''],
      interests: [''],
      languagesList: [{ name: '', level: '' }],
      language: 'fr',
      template: 'modern',
      jobTitle: ''
    }
  });

  React.useEffect(() => {
    const parsed = storage.loadCV();
    if (parsed) {
      reset(parsed);
      if (parsed.photo) setPhotoPreview(parsed.photo);
    }
  }, [reset]);

  const { fields: skillFields, append: appendSkill, remove: removeSkill } = useFieldArray({ control, name: "skills" as any });
  const { fields: itSkillFields, append: appendItSkill, remove: removeItSkill } = useFieldArray({ control, name: "itSkills" as any });
  const { fields: expFields, append: appendExp, remove: removeExp } = useFieldArray({ control, name: "experiences" as any });
  const { fields: eduFields, append: appendEdu, remove: removeEdu } = useFieldArray({ control, name: "education" as any });
  const { fields: qualityFields, append: appendQuality, remove: removeQuality } = useFieldArray({ control, name: "qualities" as any });
  const { fields: flawFields, append: appendFlaw, remove: removeFlaw } = useFieldArray({ control, name: "flaws" as any });
  const { fields: interestFields, append: appendInterest, remove: removeInterest } = useFieldArray({ control, name: "interests" as any });
  const { fields: langFields, append: appendLang, remove: removeLang } = useFieldArray({ control, name: "languagesList" as any });

  const formData = watch();

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      console.log("Current form errors:", errors);
    }
  }, [errors]);

  const handleOptimize = async () => {
    if (!jobOffer.trim()) {
      alert("Veuillez coller une offre d'emploi.");
      return;
    }

    setIsOptimizing(true);
    try {
      // Consommer un crédit d'optimisation
      const consumeRes = await api.ia.consume('optimization');
      if (!consumeRes.ok) {
        const err = await consumeRes.json();
        alert(err.error || "Vous n'avez plus de crédits d'optimisation.");
        navigate('/premium');
        return;
      }

      await refreshProfile();

      const currentData = watch();
      const optimizedData = await optimizeCVForJobOffer(currentData, jobOffer);
      
      // Update form with optimized data
      reset(optimizedData);
      
      alert("Votre CV a été optimisé avec succès pour cette offre !");
      setStep(5); // Go to preview/final step
    } catch (error: any) {
      console.error("Optimization error:", error);
      alert("Erreur lors de l'optimisation : " + error.message);
    } finally {
      setIsOptimizing(false);
    }
  };

  const onSubmit = async (data: CVData) => {
    console.log(">>> onSubmit CALLED with data:", data);
    if (!user) {
      console.warn("User not logged in");
      alert("Veuillez vous connecter pour générer un CV avec l'IA.");
      navigate('/login');
      return;
    }

    setIsGenerating(true);
    try {
      console.log(">>> Consuming credit for user:", user.uid);
      // Check and consume generation credit
      const consumeRes = await api.ia.consume('cv');
      console.log(">>> Consume response status:", consumeRes.status);
      
      if (!consumeRes.ok) {
        const err = await consumeRes.json();
        alert(err.error || "Vous n'avez plus de crédits de génération. Veuillez renouveler votre abonnement.");
        navigate('/premium');
        return;
      }

      // Refresh profile to update remaining credits in context
      await refreshProfile();

      console.log(">>> Calling Gemini AI service...");
      // Step 1: Generation with IA
      const enhancedData = await generateProfessionalCV({ ...data, photo: photoPreview || undefined });
      console.log(">>> AI Generation successful!");
      
      // Step 2: Automatic Verification & Correction
      let finalData = { ...enhancedData };
      
      if (!finalData.sections) {
        finalData.sections = {
          contact: 'Contact', email: 'Email', phone: 'Téléphone', address: 'Adresse',
          skills: 'Compétences', itSkills: 'Informatique', experiences: 'Expériences',
          education: 'Formation', qualities: 'Qualités', flaws: 'Défauts',
          interests: 'Centres d\'intérêt', profile: 'Profil', divers: 'Divers', languages: 'Langues'
        };
      }

      const isTooEmpty = !finalData.profile || 
                         (finalData.skills?.length || 0) < 3 || 
                         (finalData.experiences?.length || 0) < 1;

      if (isTooEmpty) {
        console.log(">>> Content too sparse, retrying once...");
        finalData = await generateProfessionalCV(finalData);
      }

      // Step 3: Final Sanity Check
      if (!finalData.skills || finalData.skills.length === 0) finalData.skills = ['Communication', 'Travail d\'équipe', 'Résolution de problèmes'];
      if (!finalData.experiences || finalData.experiences.length === 0) {
        finalData.experiences = [{
          company: 'Entreprise Exemple',
          position: finalData.jobTitle || 'Poste Professionnel',
          startDate: '2020',
          endDate: 'Présent',
          description: 'Description détaillée des missions et réalisations professionnelles.'
        }];
      }
      
      localStorage.removeItem('currentCV');
      localStorage.removeItem('currentCV_photo');
      
      storage.saveCV(finalData);
      console.log(">>> CV saved. Navigating to preview...");
      navigate('/cv-preview');
    } catch (error: any) {
      console.error(">>> CV Generation Error:", error);
      alert(`❌ Erreur lors de la génération : ${error.message || "Erreur inconnue"}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 400;
          const MAX_HEIGHT = 400;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            setPhotoPreview(dataUrl);
          } else {
            setPhotoPreview(reader.result as string);
          }
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const steps = [
    { title: "Infos Personnelles", id: 1 },
    { title: "Profil & Compétences", id: 2 },
    { title: "Expériences", id: 3 },
    { title: "Formation", id: 4 },
    { title: "Qualités & Intérêts", id: 5 },
    { title: "Optimisation IA", id: 6 },
    { title: "Options", id: 7 },
  ];

  return (
    <div className="pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-black text-slate-900">Créer mon <span className="text-primary">CV</span></h1>
        </div>
        {/* Progress Bar */}
        <div className="mb-8 md:mb-12">
          <div className="flex justify-between mb-4 overflow-x-auto pb-2 no-scrollbar">
            {steps.map((s) => (
              <div key={s.id} className="flex flex-col items-center min-w-[60px] md:min-w-[80px]">
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-xs md:text-sm font-bold transition-all ${step >= s.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-200 text-slate-500'}`}>
                  {s.id}
                </div>
                <span className={`text-[8px] md:text-[10px] mt-2 font-medium uppercase tracking-wider text-center ${step >= s.id ? 'text-primary' : 'text-slate-400'}`}>{s.title}</span>
              </div>
            ))}
          </div>
          <div className="h-1.5 md:h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${(step / steps.length) * 100}%` }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-[1.5rem] md:rounded-[2rem] shadow-xl border border-slate-100 p-6 md:p-12">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex flex-col items-center mb-8">
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-3xl bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-dashed border-slate-300 group-hover:border-primary transition-colors">
                      {photoPreview ? (
                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon size={32} className="text-slate-400" />
                      )}
                    </div>
                    <label className="absolute bottom-2 right-2 bg-primary text-white p-2 rounded-xl cursor-pointer shadow-lg hover:bg-primary-dark transition-all">
                      <Plus size={16} />
                      <input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
                    </label>
                  </div>
                  <p className="text-sm text-slate-500 mt-3">Ajouter une photo professionnelle</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Prénom</label>
                    <input {...register("firstName", { required: true })} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all" placeholder="Jean" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Nom</label>
                    <input {...register("lastName", { required: true })} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all" placeholder="Dupont" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-semibold text-slate-700">Poste visé</label>
                    <input {...register("jobTitle", { required: true })} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all" placeholder="Ex: Développeur Web, Comptable, etc." />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Email</label>
                    <input {...register("email", { required: true })} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all" placeholder="jean.dupont@email.com" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Téléphone</label>
                    <input {...register("phone", { required: true })} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all" placeholder="+33 6 00 00 00 00" />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Profil / Accroche</label>
                  <textarea {...register("profile")} rows={4} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all" placeholder="Décrivez votre parcours en quelques lignes..." />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-semibold text-slate-700">Compétences Techniques</label>
                    <button type="button" onClick={() => appendSkill('')} className="text-primary text-sm font-bold flex items-center space-x-1">
                      <Plus size={16} /> <span>Ajouter</span>
                    </button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    {skillFields.map((field, index) => (
                      <div key={field.id} className="flex space-x-2">
                        <input {...register(`skills.${index}` as any)} className="flex-1 px-4 py-2 rounded-lg bg-slate-50 border border-slate-200 outline-none" placeholder="Ex: Gestion de projet" />
                        <button type="button" onClick={() => removeSkill(index)} className="text-slate-400 hover:text-red-500"><Trash2 size={18} /></button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-semibold text-slate-700">Compétences Informatiques</label>
                    <button type="button" onClick={() => appendItSkill('')} className="text-primary text-sm font-bold flex items-center space-x-1">
                      <Plus size={16} /> <span>Ajouter</span>
                    </button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    {itSkillFields.map((field, index) => (
                      <div key={field.id} className="flex space-x-2">
                        <input {...register(`itSkills.${index}` as any)} className="flex-1 px-4 py-2 rounded-lg bg-slate-50 border border-slate-200 outline-none" placeholder="Ex: React, SQL, Excel" />
                        <button type="button" onClick={() => removeItSkill(index)} className="text-slate-400 hover:text-red-500"><Trash2 size={18} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-slate-900">Expériences Professionnelles</h3>
                  <button type="button" onClick={() => appendExp({ company: '', position: '', startDate: '', endDate: '', description: '' })} className="bg-primary/10 text-primary px-4 py-2 rounded-xl text-sm font-bold flex items-center space-x-2">
                    <Plus size={16} /> <span>Ajouter une expérience</span>
                  </button>
                </div>

                {expFields.map((field, index) => (
                  <div key={field.id} className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 relative">
                    <button type="button" onClick={() => removeExp(index)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500"><Trash2 size={18} /></button>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Entreprise</label>
                        <input {...register(`experiences.${index}.company` as any)} className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Poste</label>
                        <input {...register(`experiences.${index}.position` as any)} className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Date Début</label>
                        <input {...register(`experiences.${index}.startDate` as any)} className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none" placeholder="MM/AAAA" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Date Fin</label>
                        <input {...register(`experiences.${index}.endDate` as any)} className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none" placeholder="MM/AAAA ou Présent" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase">Description des missions</label>
                      <textarea {...register(`experiences.${index}.description` as any)} rows={3} className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none" />
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-slate-900">Formation</h3>
                  <button type="button" onClick={() => appendEdu({ school: '', degree: '', year: '' })} className="bg-primary/10 text-primary px-4 py-2 rounded-xl text-sm font-bold flex items-center space-x-2">
                    <Plus size={16} /> <span>Ajouter une formation</span>
                  </button>
                </div>

                {eduFields.map((field, index) => (
                  <div key={field.id} className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4 relative">
                    <button type="button" onClick={() => removeEdu(index)} className="absolute top-4 right-4 text-slate-400 hover:text-red-500"><Trash2 size={18} /></button>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="md:col-span-2 space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">École / Université</label>
                        <input {...register(`education.${index}.school` as any)} className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Année</label>
                        <input {...register(`education.${index}.year` as any)} className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none" />
                      </div>
                      <div className="md:col-span-3 space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Diplôme / Domaine d'étude</label>
                        <input {...register(`education.${index}.degree` as any)} className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none" />
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-semibold text-slate-700">Qualités</label>
                      <button type="button" onClick={() => appendQuality('')} className="text-primary text-sm font-bold flex items-center space-x-1">
                        <Plus size={16} /> <span>Ajouter</span>
                      </button>
                    </div>
                    {qualityFields.map((field, index) => (
                      <div key={field.id} className="flex space-x-2">
                        <input {...register(`qualities.${index}` as any)} className="flex-1 px-4 py-2 rounded-lg bg-slate-50 border border-slate-200 outline-none" />
                        <button type="button" onClick={() => removeQuality(index)} className="text-slate-400 hover:text-red-500"><Trash2 size={18} /></button>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-semibold text-slate-700">Défauts</label>
                      <button type="button" onClick={() => appendFlaw('')} className="text-primary text-sm font-bold flex items-center space-x-1">
                        <Plus size={16} /> <span>Ajouter</span>
                      </button>
                    </div>
                    {flawFields.map((field, index) => (
                      <div key={field.id} className="flex space-x-2">
                        <input {...register(`flaws.${index}` as any)} className="flex-1 px-4 py-2 rounded-lg bg-slate-50 border border-slate-200 outline-none" />
                        <button type="button" onClick={() => removeFlaw(index)} className="text-slate-400 hover:text-red-500"><Trash2 size={18} /></button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-semibold text-slate-700">Centres d'intérêt</label>
                    <button type="button" onClick={() => appendInterest('')} className="text-primary text-sm font-bold flex items-center space-x-1">
                      <Plus size={16} /> <span>Ajouter</span>
                    </button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    {interestFields.map((field, index) => (
                      <div key={field.id} className="flex space-x-2">
                        <input {...register(`interests.${index}` as any)} className="flex-1 px-4 py-2 rounded-lg bg-slate-50 border border-slate-200 outline-none" />
                        <button type="button" onClick={() => removeInterest(index)} className="text-slate-400 hover:text-red-500"><Trash2 size={18} /></button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-semibold text-slate-700">Langues parlées</label>
                    <button type="button" onClick={() => appendLang({ name: '', level: '' })} className="text-primary text-sm font-bold flex items-center space-x-1">
                      <Plus size={16} /> <span>Ajouter une langue</span>
                    </button>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    {langFields.map((field, index) => (
                      <div key={field.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 relative">
                        <button type="button" onClick={() => removeLang(index)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Langue</label>
                          <input {...register(`languagesList.${index}.name` as any)} placeholder="Ex: Français" className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Niveau</label>
                          <select {...register(`languagesList.${index}.level` as any)} className="w-full px-3 py-2 rounded-lg border border-slate-200 outline-none bg-white">
                            <option value="">Sélectionner un niveau</option>
                            <option value="Langue maternelle">Langue maternelle</option>
                            <option value="Courant">Courant</option>
                            <option value="Avancé">Avancé</option>
                            <option value="Intermédiaire">Intermédiaire</option>
                            <option value="Débutant">Débutant</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 6 && (
              <motion.div
                key="step6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <PremiumLock 
                  feature="optimization"
                  title="Optimisation CV pour offre d'emploi"
                  description="Notre IA adaptera votre CV en mettant en avant les compétences et mots-clés recherchés par les recruteurs."
                  price={500}
                >
                  <div className="space-y-4">
                    <div className="bg-primary/5 p-6 rounded-2xl border border-primary/10">
                      <div className="flex items-start space-x-3">
                        <Zap className="text-primary mt-1" size={24} />
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">Optimisation Intelligente</h3>
                          <p className="text-sm text-slate-600 mt-1">
                            Collez l'offre d'emploi ci-dessous. Notre IA adaptera votre CV en mettant en avant les compétences et mots-clés recherchés par les recruteurs.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Offre d'emploi (Description)</label>
                      <textarea 
                        value={jobOffer}
                        onChange={(e) => setJobOffer(e.target.value)}
                        rows={8} 
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all" 
                        placeholder="Copiez et collez ici le texte de l'offre d'emploi..." 
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleOptimize}
                      disabled={isOptimizing || !jobOffer.trim()}
                      className="w-full bg-primary text-white py-4 rounded-xl font-bold flex items-center justify-center space-x-2 hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                    >
                      {isOptimizing ? (
                        <>
                          <Loader2 className="animate-spin" size={20} />
                          <span>Optimisation en cours...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={20} />
                          <span>Optimiser mon CV pour cette offre</span>
                        </>
                      )}
                    </button>
                  </div>
                </PremiumLock>
              </motion.div>
            )}

            {step === 7 && (
              <motion.div
                key="step7"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="grid md:grid-cols-1 gap-8">
                  <div className="space-y-4">
                    <label className="text-sm font-semibold text-slate-700">Template</label>
                    <select {...register("template")} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:border-primary">
                      <option value="modern">Moderne (Élégant)</option>
                      <option value="blue">Moderne (Pro Bleu)</option>
                      <option value="dark-minimal">Moderne (Épuré)</option>
                      <option value="classic">Classique (Traditionnel)</option>
                      <option value="creative">Créatif (Original)</option>
                    </select>
                  </div>
                </div>

                <div className="bg-primary-light p-6 rounded-2xl border border-primary/10">
                  <div className="flex items-start space-x-3">
                    <Sparkles className="text-primary mt-1" size={20} />
                    <div>
                      <h4 className="font-bold text-primary">Génération Assistée par IA</h4>
                      <p className="text-sm text-slate-600 mt-1">
                        Notre IA va analyser vos données, corriger les fautes, optimiser les mots-clés pour les ATS et compléter les sections vides avec du contenu professionnel.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-12 flex flex-col space-y-4">
            {Object.keys(errors).length > 0 && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium">
                ⚠️ Veuillez remplir tous les champs obligatoires (Prénom, Nom, Poste visé, Email, Téléphone) dans les étapes précédentes.
              </div>
            )}
            
            <div className="flex justify-between">
              {step > 1 ? (
                <button type="button" onClick={prevStep} className="flex items-center space-x-2 text-slate-600 font-bold hover:text-primary transition-colors">
                  <ChevronLeft size={20} /> <span>Précédent</span>
                </button>
              ) : <div />}

              {step < 7 ? (
                <button type="button" onClick={nextStep} className="bg-primary text-white px-8 py-3 rounded-xl font-bold flex items-center space-x-2 hover:bg-primary-dark transition-all shadow-lg shadow-primary/20">
                  <span>Suivant</span> <ChevronRight size={20} />
                </button>
              ) : (
                <button 
                  type="submit" 
                  disabled={isGenerating} 
                  className="bg-emerald-500 text-white px-10 py-3 rounded-xl font-bold flex items-center space-x-2 hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                  onClick={() => {
                    if (Object.keys(errors).length > 0) {
                      console.log("Validation errors:", errors);
                    }
                  }}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      <div className="flex flex-col items-start">
                        <span className="text-sm">Génération du CV en cours...</span>
                        <span className="text-[10px] opacity-70 font-normal">Vérification et optimisation IA</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} />
                      <span>Générer mon CV avec l'IA</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
