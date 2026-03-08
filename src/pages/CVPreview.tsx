import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Download, FileText, FileDown, CheckCircle2, AlertCircle, Sparkles, Loader2, ChevronLeft, Save, Zap, Edit3, RefreshCw, Mail, Phone, MapPin, Globe, Star, Maximize2 } from 'lucide-react';
import { api } from '../services/api';
import { CVData, CVScore } from '../types';
import { scoreCV, generateProfessionalCV } from '../services/geminiService';
import { storage } from '../utils/storage';
import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';
// @ts-ignore
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';

export default function CVPreview() {
  const [cvData, setCvData] = useState<CVData | null>(null);
  const [score, setScore] = useState<CVScore | null>(null);
  const [isScoring, setIsScoring] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const [currentUser, setCurrentUser] = useState<any>(user);
  const navigate = useNavigate();
  const cvRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      if (cvRef.current && cvRef.current.parentElement) {
        const containerWidth = cvRef.current.parentElement.offsetWidth;
        const scale = Math.min(1, (containerWidth - 40) / 794);
        cvRef.current.style.transform = `scale(${scale})`;
        // Adjust parent height to match scaled content
        cvRef.current.parentElement.style.height = `${1123 * scale + 40}px`;
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [cvData]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.auth.getProfile();
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data);
          localStorage.setItem('user', JSON.stringify(data));
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchProfile();
  }, []);

  const getSubscriptionStatus = (template: string) => {
    if (!currentUser) return { active: false, expired: false };
    if (currentUser.role === 'admin' || currentUser.isPremium) return { active: true, expired: false };
    
    let expiry: string | null = null;
    if (template === 'modern') expiry = currentUser.modernExpiresAt;
    if (template === 'classic') expiry = currentUser.classicExpiresAt;
    if (template === 'creative') expiry = currentUser.creativeExpiresAt;
    if (template === 'blue') expiry = currentUser.blueExpiresAt;
    if (template === 'pink') expiry = currentUser.pinkExpiresAt;
    if (template === 'dark') expiry = currentUser.darkExpiresAt;
    if (template === 'orange') expiry = currentUser.orangeExpiresAt;
    
    if (!expiry) return { active: false, expired: false };
    const active = new Date(expiry) > new Date();
    return { active, expired: !active };
  };

  const isSubscribed = (template: string) => getSubscriptionStatus(template).active;

  useEffect(() => {
    const parsed = storage.loadCV();
    if (parsed) {
      // Initialize sections if missing
      if (!parsed.sections) {
        parsed.sections = {
          contact: parsed.language === 'fr' ? 'Contact' : 'Contact',
          email: 'Email',
          phone: parsed.language === 'fr' ? 'Téléphone' : 'Phone',
          address: parsed.language === 'fr' ? 'Adresse' : 'Address',
          skills: parsed.language === 'fr' ? 'Compétences' : 'Skills',
          itSkills: parsed.language === 'fr' ? 'Informatique' : 'IT Skills',
          experiences: parsed.language === 'fr' ? 'Expériences' : 'Experience',
          education: parsed.language === 'fr' ? 'Formation' : 'Education',
          qualities: parsed.language === 'fr' ? 'Qualités' : 'Qualities',
          flaws: parsed.language === 'fr' ? 'Défauts' : 'Flaws',
          interests: parsed.language === 'fr' ? 'Centres d\'intérêt' : 'Interests',
          profile: parsed.language === 'fr' ? 'Profil' : 'Profile',
          divers: parsed.language === 'fr' ? 'Divers' : 'Miscellaneous',
          references: parsed.language === 'fr' ? 'Références' : 'References',
          languages: parsed.language === 'fr' ? 'Langues' : 'Languages'
        };
      }
      
      if (!parsed.qualities) parsed.qualities = [];
      if (!parsed.flaws) parsed.flaws = [];
      if (!parsed.references) parsed.references = parsed.language === 'fr' ? 'Juliana Silva\nRimberio / CTO\n+123-456-7890\n\nDonna Stroupe\nBorcelle / CEO\n+123-456-7890' : 'Juliana Silva\nRimberio / CTO\n+123-456-7890\n\nDonna Stroupe\nBorcelle / CEO\n+123-456-7890';
      if (!parsed.website) parsed.website = 'www.reallygreatsite.com';
      
      setCvData(parsed);
      handleScore(parsed);
    } else {
      navigate('/create-cv');
    }
  }, [navigate]);

  const handleScore = async (data: CVData) => {
    setIsScoring(true);
    try {
      const result = await scoreCV(data);
      setScore(result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsScoring(false);
    }
  };

  const handleAIFill = async (currentData?: CVData) => {
    const dataToUse = currentData || cvData;
    if (!dataToUse) return;
    setIsGenerating(true);
    try {
      const improved = await generateProfessionalCV(dataToUse);
      // Preserve sections if they were already edited
      if (dataToUse.sections) {
        improved.sections = dataToUse.sections;
      }
      setCvData(improved);
      storage.saveCV(improved);
      handleScore(improved);
    } catch (error: any) {
      console.error("AI Optimization Error:", error);
      const msg = error.message || "";
      if (msg.includes("Clé API manquante")) {
        alert("La clé API Gemini n'est pas configurée dans Netlify.");
      } else {
        alert(`Erreur lors de l'optimisation par l'IA: ${msg || "Veuillez réessayer."}`);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const updateCV = (newData: Partial<CVData>) => {
    if (!cvData) return;
    const updated = { ...cvData, ...newData };
    setCvData(updated);
    storage.saveCV(updated);
  };

  const handleSave = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert("Veuillez vous connecter pour sauvegarder votre CV.");
      navigate('/login');
      return;
    }

    setIsSaving(true);
    try {
      const cvId = cvData?.id || Math.random().toString(36).substr(2, 9);
      const response = await api.cvs.save({
        id: cvId,
        data: { ...cvData, id: cvId }
      });
      if (response.ok) {
        if (cvData) {
          const updated = { ...cvData, id: cvId };
          setCvData(updated);
          storage.saveCV(updated);
        }
        alert("CV sauvegardé avec succès !");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const printCV = () => {
    if (!cvData) return;
    if (!isSubscribed(cvData.template)) {
      setShowPayModal(true);
      return;
    }
    window.print();
  };

  const exportPDF = async () => {
    if (!cvRef.current || !cvData) return;
    
    if (!isSubscribed(cvData.template)) {
      setShowPayModal(true);
      return;
    }

    setIsExporting(true);
    try {
      const element = cvRef.current;
      
      // Force A4 dimensions for capture
      const originalWidth = element.style.width;
      const originalMinHeight = element.style.minHeight;
      const originalTransform = element.style.transform;
      const originalOverflow = element.style.overflow;
      
      // A4 dimensions in pixels at 96 DPI
      element.style.width = '210mm';
      element.style.minHeight = '297mm';
      element.style.transform = 'none';
      element.style.overflow = 'visible'; // Ensure all content is visible
      
      const dataUrl = await toPng(element, {
        quality: 1,
        pixelRatio: 3, // Higher quality
        backgroundColor: '#ffffff',
        width: element.scrollWidth, // Use scrollWidth/scrollHeight to capture everything
        height: element.scrollHeight
      });

      // Restore style
      element.style.width = originalWidth;
      element.style.minHeight = originalMinHeight;
      element.style.transform = originalTransform;
      element.style.overflow = originalOverflow;

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgProps = pdf.getImageProperties(dataUrl);
      const imgWidth = pdfWidth;
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      // First page
      pdf.addImage(dataUrl, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      // Additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(dataUrl, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(`${cvData?.firstName}_${cvData?.lastName}_CV.pdf`);
    } catch (error) {
      console.error(error);
      alert("Erreur lors de l'export PDF. Veuillez réessayer.");
    } finally {
      setIsExporting(false);
    }
  };

  const exportWord = async () => {
    if (!cvData) return;
    
    if (!isSubscribed(cvData.template)) {
      setShowPayModal(true);
      return;
    }

    const sections = cvData.sections!;
    
    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: 720,
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
        },
        children: [
          // Header
          new Paragraph({
            children: [
              new TextRun({ text: `${cvData.firstName} ${cvData.lastName}`, bold: true, size: 48, color: "0F172A" }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: `${cvData.email} | ${cvData.phone}`, size: 20, color: "64748B" }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          
          // Profile
          new Paragraph({
            children: [new TextRun({ text: sections.profile.toUpperCase(), bold: true, size: 28, color: "0F172A" })],
            border: { bottom: { color: "E2E8F0", space: 4, style: BorderStyle.SINGLE, size: 12 } },
            spacing: { before: 200, after: 200 },
          }),
          new Paragraph({ 
            children: [new TextRun({ text: cvData.profile, size: 22, color: "334155" })],
            spacing: { after: 400 } 
          }),

          // Experiences
          new Paragraph({
            children: [new TextRun({ text: sections.experiences.toUpperCase(), bold: true, size: 28, color: "0F172A" })],
            border: { bottom: { color: "E2E8F0", space: 4, style: BorderStyle.SINGLE, size: 12 } },
            spacing: { before: 200, after: 200 },
          }),
          ...cvData.experiences.flatMap(exp => [
            new Paragraph({
              children: [
                new TextRun({ text: exp.position, bold: true, size: 24, color: "0F172A" }),
                new TextRun({ text: ` @ ${exp.company}`, bold: true, size: 24, color: "10B981" }),
              ],
              spacing: { before: 150 },
            }),
            new Paragraph({
              children: [new TextRun({ text: `${exp.startDate} - ${exp.endDate}`, italics: true, size: 18, color: "94A3B8" })],
              spacing: { after: 100 },
            }),
            new Paragraph({ 
              children: [new TextRun({ text: exp.description, size: 20, color: "475569" })],
              spacing: { after: 200 } 
            }),
          ]),

          // Education
          new Paragraph({
            children: [new TextRun({ text: sections.education.toUpperCase(), bold: true, size: 28, color: "0F172A" })],
            border: { bottom: { color: "E2E8F0", space: 4, style: BorderStyle.SINGLE, size: 12 } },
            spacing: { before: 200, after: 200 },
          }),
          ...cvData.education.flatMap(edu => [
            new Paragraph({
              children: [
                new TextRun({ text: edu.degree, bold: true, size: 24, color: "0F172A" }),
                new TextRun({ text: ` - ${edu.school}`, size: 24, color: "475569" }),
              ],
              spacing: { before: 150 },
            }),
            new Paragraph({ 
              children: [new TextRun({ text: edu.year, size: 18, color: "94A3B8" })],
              spacing: { after: 200 } 
            }),
          ]),

          // Skills
          new Paragraph({
            children: [new TextRun({ text: sections.skills.toUpperCase(), bold: true, size: 28, color: "0F172A" })],
            border: { bottom: { color: "E2E8F0", space: 4, style: BorderStyle.SINGLE, size: 12 } },
            spacing: { before: 200, after: 200 },
          }),
          new Paragraph({ 
            children: [new TextRun({ text: cvData.skills.join(' • '), size: 22, color: "334155" })],
            spacing: { after: 200 }
          }),

          // IT Skills
          new Paragraph({
            children: [new TextRun({ text: sections.itSkills.toUpperCase(), bold: true, size: 28, color: "0F172A" })],
            border: { bottom: { color: "E2E8F0", space: 4, style: BorderStyle.SINGLE, size: 12 } },
            spacing: { before: 200, after: 200 },
          }),
          new Paragraph({ 
            children: [new TextRun({ text: cvData.itSkills.join(' • '), size: 22, color: "334155" })],
            spacing: { after: 200 }
          }),

          // Qualities, Flaws & Interests
          new Paragraph({
            children: [new TextRun({ text: `${sections.qualities.toUpperCase()} & ${sections.interests.toUpperCase()}`, bold: true, size: 28, color: "0F172A" })],
            border: { bottom: { color: "E2E8F0", space: 4, style: BorderStyle.SINGLE, size: 12 } },
            spacing: { before: 200, after: 200 },
          }),
          new Paragraph({ 
            children: [
              new TextRun({ text: `${sections.qualities}: `, bold: true, size: 20, color: "0F172A" }),
              new TextRun({ text: cvData.qualities.join(', '), size: 20, color: "475569" })
            ],
          }),
          ...(cvData.flaws && cvData.flaws.length > 0 ? [
            new Paragraph({ 
              children: [
                new TextRun({ text: `${sections.flaws}: `, bold: true, size: 20, color: "0F172A" }),
                new TextRun({ text: cvData.flaws.join(', '), size: 20, color: "475569" })
              ],
            })
          ] : []),
          new Paragraph({ 
            children: [
              new TextRun({ text: `${sections.interests}: `, bold: true, size: 20, color: "0F172A" }),
              new TextRun({ text: cvData.interests.join(', '), size: 20, color: "475569" })
            ],
          }),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${cvData.firstName}_${cvData.lastName}_CV.docx`);
  };

  if (!cvData) return null;

  return (
    <div className="pt-24 pb-16 px-4 bg-slate-50 min-h-screen">
      {/* Subscription Modal */}
      {showPayModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl text-center"
          >
            <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Zap size={40} fill="currentColor" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">
              {getSubscriptionStatus(cvData?.template || '').expired ? "⌛ Abonnement Expiré" : "🔒 Accès Restreint"}
            </h2>
            <p className="text-slate-600 mb-8">
              {getSubscriptionStatus(cvData?.template || '').expired 
                ? "Votre abonnement de 24 heures a expiré. Veuillez renouveler pour continuer à télécharger." 
                : "Vous devez payer pour télécharger votre CV. L'abonnement débloque les exports PDF et Word pour ce modèle pendant 24 heures."}
            </p>
            <div className="space-y-3">
              <button 
                onClick={() => navigate('/premium')}
                className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-lg hover:bg-primary-dark transition-all shadow-xl shadow-primary/20"
              >
                {getSubscriptionStatus(cvData?.template || '').expired ? "Renouveler avec Wave" : "Payer avec Wave"}
              </button>
              <button 
                onClick={async () => {
                  const res = await api.auth.getProfile();
                  if (res.ok) {
                    const data = await res.json();
                    setCurrentUser(data);
                    localStorage.setItem('user', JSON.stringify(data));
                    if (isSubscribed(cvData?.template || '')) {
                      setShowPayModal(false);
                    } else {
                      alert("Aucun abonnement actif trouvé. Si vous venez de payer, assurez-vous d'avoir cliqué sur 'Confirmer' sur la page Premium.");
                    }
                  }
                }}
                className="w-full bg-slate-100 text-slate-700 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-all"
              >
                J'ai payé (Actualiser)
              </button>
              <button 
                onClick={() => setShowPayModal(false)}
                className="w-full py-2 text-slate-400 text-sm font-medium hover:text-slate-600"
              >
                Plus tard
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left: Preview */}
          <div className="lg:w-2/3">
            <div className="flex flex-wrap justify-between items-center mb-6 gap-4 no-print">
              <button onClick={() => navigate('/create-cv')} className="flex items-center space-x-2 text-slate-600 font-bold hover:text-primary transition-colors">
                <ChevronLeft size={20} /> <span>Retour</span>
              </button>
              
              <div className="flex flex-wrap items-center gap-3">
                <button 
                  onClick={() => handleAIFill()} 
                  disabled={isGenerating} 
                  className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                >
                  {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
                  <span>Optimiser par l'IA</span>
                </button>

                <button onClick={handleSave} disabled={isSaving} className="flex items-center space-x-2 bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-xl font-bold hover:bg-slate-50 transition-all">
                  {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  <span>Sauvegarder</span>
                </button>

                <div className="relative group no-print">
                  <button className="flex items-center space-x-2 bg-primary text-white px-6 py-2 rounded-xl font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20">
                    <Download size={18} />
                    <span>Télécharger</span>
                  </button>
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <button onClick={printCV} className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-slate-50 text-left text-sm font-medium border-b border-slate-50">
                      <FileText size={18} className="text-primary" />
                      <span>Imprimer / PDF</span>
                    </button>
                    <button onClick={exportPDF} disabled={isExporting} className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-slate-50 text-left text-sm font-medium border-b border-slate-50">
                      <FileDown size={18} className="text-red-500" />
                      <span>Format PDF Direct</span>
                    </button>
                    <button onClick={exportWord} className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-slate-50 text-left text-sm font-medium">
                      <FileText size={18} className="text-blue-500" />
                      <span>Format Word</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-emerald-100 text-emerald-700 p-4 rounded-xl mb-6 flex items-center space-x-3 border border-emerald-200 no-print">
              <Edit3 size={20} />
              <span className="font-bold text-sm">Mode Édition : Cliquez sur n'importe quel texte pour le modifier.</span>
            </div>

            {/* CV Template Render */}
            <div className="overflow-auto bg-slate-200 p-4 md:p-8 rounded-xl border border-slate-200 flex justify-center">
              <div 
                className={`bg-white shadow-2xl origin-top transition-transform ${isCompact ? 'cv-compact' : ''}`} 
                id="cv-render" 
                ref={cvRef}
                style={{ 
                  width: '210mm', 
                  minHeight: '297mm',
                  transform: 'scale(1)',
                }}
                onContextMenu={(e) => e.preventDefault()}
              >
                {cvData.template === 'modern' && <ModernTemplate data={cvData} onUpdate={updateCV} />}
                {cvData.template === 'classic' && <ClassicTemplate data={cvData} onUpdate={updateCV} />}
                {cvData.template === 'creative' && <CreativeTemplate data={cvData} onUpdate={updateCV} />}
                {cvData.template === 'blue' && <BlueTemplate data={cvData} onUpdate={updateCV} />}
                {cvData.template === 'pink' && <PinkTemplate data={cvData} onUpdate={updateCV} />}
                {cvData.template === 'dark' && <DarkTemplate data={cvData} onUpdate={updateCV} />}
                {cvData.template === 'orange' && <OrangeTemplate data={cvData} onUpdate={updateCV} />}
              </div>
            </div>
          </div>

          {/* Right: Analysis & Advice */}
          <div className="lg:w-1/3 space-y-6 no-print">
            <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 mb-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center space-x-2">
                <Zap className="text-primary" size={20} />
                <span>Actions Rapides</span>
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    if (cvData) {
                      storage.saveCV(cvData);
                      navigate('/cover-letter');
                    }
                  }}
                  className="w-full flex items-center justify-center space-x-2 bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10"
                >
                  <Sparkles size={18} />
                  <span>Lettre de Motivation</span>
                </button>
                <button
                  onClick={() => handleAIFill()}
                  disabled={isGenerating}
                  className="w-full flex items-center justify-center space-x-2 bg-primary/10 text-primary py-3 rounded-xl font-bold hover:bg-primary/20 transition-all border border-primary/20"
                >
                  {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} />}
                  <span>Optimiser avec l'IA</span>
                </button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 mb-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center space-x-2">
                <Maximize2 className="text-primary" size={20} />
                <span>Mise en Page</span>
              </h3>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-700">Mode Compact</span>
                  <span className="text-xs text-slate-500">Force le CV sur une page</span>
                </div>
                <button 
                  onClick={() => updateCV({ isCompact: !cvData.isCompact })}
                  className={`w-12 h-6 rounded-full transition-all relative ${cvData.isCompact ? 'bg-primary' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${cvData.isCompact ? 'left-7' : 'left-1'}`}></div>
                </button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 mb-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center space-x-2">
                <FileText className="text-primary" size={20} />
                <span>Style du Template</span>
              </h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Templates Classiques</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {['classic', 'blue', 'pink', 'orange'].map((t) => (
                      <button
                        key={t}
                        onClick={() => {
                          if (!isSubscribed(t)) {
                            setShowPayModal(true);
                            return;
                          }
                          updateCV({ template: t as any });
                        }}
                        className={`p-3 rounded-2xl border-2 transition-all text-xs font-bold capitalize flex flex-col items-center space-y-2 ${
                          cvData.template === t ? 'border-primary bg-primary/5 text-primary shadow-sm' : 'border-slate-100 text-slate-500 hover:border-slate-200'
                        }`}
                      >
                        <div className={`w-full h-12 rounded-lg mb-1 flex items-center justify-center ${
                          t === 'classic' ? 'bg-slate-800' : 
                          t === 'blue' ? 'bg-[#2d4a63]' : 
                          t === 'pink' ? 'bg-[#e8b4b8]' : 
                          'bg-[#f27d26]'
                        }`}>
                          <FileText size={20} className="text-white/40" />
                        </div>
                        <div className="flex items-center space-x-1">
                          <span>{t}</span>
                          {!isSubscribed(t) && <Zap size={10} className="text-primary" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Modernes & Créatifs</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {['modern', 'creative', 'dark'].map((t) => (
                      <button
                        key={t}
                        onClick={() => {
                          if (!isSubscribed(t)) {
                            setShowPayModal(true);
                            return;
                          }
                          updateCV({ template: t as any });
                        }}
                        className={`p-2 rounded-xl border-2 transition-all text-xs font-bold capitalize flex flex-col items-center space-y-1 ${
                          cvData.template === t ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 text-slate-500 hover:border-slate-200'
                        }`}
                      >
                        <div className={`w-full h-8 rounded-md mb-1 flex items-center justify-center ${
                          t === 'modern' ? 'bg-slate-900' : 
                          t === 'creative' ? 'bg-emerald-500' : 
                          'bg-[#0f111a]'
                        }`}>
                          <Sparkles size={14} className="text-white/40" />
                        </div>
                        <div className="flex items-center space-x-1">
                          <span>{t}</span>
                          {!isSubscribed(t) && <Zap size={10} className="text-primary" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 mb-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center space-x-2">
                <Zap className="text-amber-500" size={20} />
                <span>Optimisation d'Espace</span>
              </h3>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <p className="font-bold text-slate-900 text-sm">Mode Compact</p>
                  <p className="text-xs text-slate-500">Réduit les marges et la taille du texte pour faire tenir sur 1 page.</p>
                </div>
                <button 
                  onClick={() => setIsCompact(!isCompact)}
                  className={`w-12 h-6 rounded-full transition-all relative ${isCompact ? 'bg-primary' : 'bg-slate-300'}`}
                >
                  <motion.div 
                    animate={{ x: isCompact ? 24 : 4 }}
                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                  />
                </button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100">
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center space-x-2">
                <Zap className="text-primary" size={20} />
                <span>Analyse du CV</span>
              </h3>

              {isScoring ? (
                <div className="flex flex-col items-center py-8">
                  <Loader2 className="animate-spin text-primary mb-4" size={32} />
                  <p className="text-slate-500 font-medium">Analyse en cours...</p>
                </div>
              ) : score ? (
                <div className="space-y-6">
                  <div className="flex flex-col items-center">
                    <div className="relative w-32 h-32 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
                        <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={364.4} strokeDashoffset={364.4 - (364.4 * score.score) / 100} className="text-primary" />
                      </svg>
                      <span className="absolute text-3xl font-bold text-slate-900">{score.score}</span>
                    </div>
                    <p className="mt-2 font-bold text-slate-500 uppercase text-xs tracking-widest">Score CV / 100</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-bold text-emerald-600 uppercase mb-2 flex items-center space-x-2">
                        <CheckCircle2 size={16} /> <span>Points Forts</span>
                      </h4>
                      <ul className="space-y-1">
                        {score.strengths.map((s, i) => (
                          <li key={i} className="text-sm text-slate-600 flex items-start space-x-2">
                            <span className="text-emerald-500 mt-1">•</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-red-500 uppercase mb-2 flex items-center space-x-2">
                        <AlertCircle size={16} /> <span>Points Faibles</span>
                      </h4>
                      <ul className="space-y-1">
                        {score.weaknesses.map((w, i) => (
                          <li key={i} className="text-sm text-slate-600 flex items-start space-x-2">
                            <span className="text-red-400 mt-1">•</span>
                            <span>{w}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="bg-primary text-white p-6 rounded-3xl shadow-xl shadow-primary/20">
              <h3 className="text-xl font-bold mb-4 flex items-center space-x-2">
                <Sparkles size={20} />
                <span>Conseils de l'IA</span>
              </h3>
              <ul className="space-y-4">
                {score?.advice.map((a, i) => (
                  <li key={i} className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">
                      {i + 1}
                    </div>
                    <p className="text-sm text-white/90 leading-relaxed">{a}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const Editable = ({ text, onSave, className, multiline = false }: { text: string, onSave: (val: string) => void, className?: string, multiline?: boolean }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(text);

  useEffect(() => {
    setValue(text);
  }, [text]);

  if (isEditing) {
    return multiline ? (
      <textarea 
        autoFocus
        className={`w-full p-1 border-2 border-primary rounded outline-none bg-white text-slate-900 ${className}`}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => { setIsEditing(false); onSave(value); }}
        rows={4}
      />
    ) : (
      <input 
        autoFocus
        className={`w-full p-1 border-2 border-primary rounded outline-none bg-white text-slate-900 ${className}`}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => { setIsEditing(false); onSave(value); }}
      />
    );
  }

  return (
    <div 
      onClick={() => setIsEditing(true)} 
      className={`cursor-text hover:bg-slate-100/50 transition-colors rounded px-1 -mx-1 ${className}`}
    >
      {text || <span className="text-slate-300 italic">Cliquez pour éditer</span>}
    </div>
  );
};

const ModernTemplate = ({ data, onUpdate }: { data: CVData, onUpdate: (d: Partial<CVData>) => void }) => (
  <div className={`cv-container cv-content-auto flex min-h-[297mm] w-[210mm] font-sans text-slate-800 bg-white shadow-2xl mx-auto ${data.isCompact ? 'cv-compact' : ''}`}>
    {/* Sidebar */}
    <div className="w-[35%] bg-slate-900 text-white p-8 flex flex-col">
      {data.photo && (
        <div className="w-32 h-32 rounded-2xl overflow-hidden mb-8 border-4 border-white/10 mx-auto">
          <img src={data.photo} alt="Profile" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="space-y-8">
        <section>
          <Editable 
            text={data.sections?.contact || 'Contact'} 
            className="text-xs font-bold text-primary uppercase tracking-widest mb-4" 
            onSave={(val) => onUpdate({ sections: { ...data.sections!, contact: val } })} 
          />
          <div className="space-y-2 text-sm text-slate-300">
            <Editable text={data.email} onSave={(val) => onUpdate({ email: val })} />
            <Editable text={data.phone} onSave={(val) => onUpdate({ phone: val })} />
          </div>
        </section>

        <section>
          <Editable 
            text={data.sections?.skills || 'Compétences'} 
            className="text-xs font-bold text-primary uppercase tracking-widest mb-4" 
            onSave={(val) => onUpdate({ sections: { ...data.sections!, skills: val } })} 
          />
          <div className="flex flex-wrap gap-2">
            {data.skills.map((s, i) => (
              <Editable 
                key={i} 
                text={s} 
                className="bg-white/10 px-2 py-1 rounded text-xs" 
                onSave={(val) => {
                  const newSkills = [...data.skills];
                  newSkills[i] = val;
                  onUpdate({ skills: newSkills });
                }} 
              />
            ))}
          </div>
        </section>

        <section>
          <Editable 
            text={data.sections?.itSkills || 'Informatique'} 
            className="text-xs font-bold text-primary uppercase tracking-widest mb-4" 
            onSave={(val) => onUpdate({ sections: { ...data.sections!, itSkills: val } })} 
          />
          <div className="flex flex-wrap gap-2">
            {data.itSkills.map((s, i) => (
              <Editable 
                key={i} 
                text={s} 
                className="bg-white/10 px-2 py-1 rounded text-xs" 
                onSave={(val) => {
                  const newSkills = [...data.itSkills];
                  newSkills[i] = val;
                  onUpdate({ itSkills: newSkills });
                }} 
              />
            ))}
          </div>
        </section>

        <section className="break-inside-avoid">
          <Editable 
            text={data.sections?.qualities || 'Qualités'} 
            className="text-xs font-bold text-primary uppercase tracking-widest mb-4" 
            onSave={(val) => onUpdate({ sections: { ...data.sections!, qualities: val } })} 
          />
          <div className="space-y-1 text-sm text-slate-300">
            {data.qualities.map((q, i) => (
              <div key={i} className="flex items-start space-x-1">
                <span>•</span>
                <Editable 
                  text={q} 
                  onSave={(val) => {
                    const newQ = [...data.qualities];
                    newQ[i] = val;
                    onUpdate({ qualities: newQ });
                  }} 
                />
              </div>
            ))}
          </div>
        </section>

        {data.flaws && data.flaws.length > 0 && (
          <section className="break-inside-avoid">
            <Editable 
              text={data.sections?.flaws || 'Défauts'} 
              className="text-xs font-bold text-primary uppercase tracking-widest mb-4" 
              onSave={(val) => onUpdate({ sections: { ...data.sections!, flaws: val } })} 
            />
            <div className="space-y-1 text-sm text-slate-300">
              {data.flaws.map((f, i) => (
                <div key={i} className="flex items-start space-x-1">
                  <span>•</span>
                  <Editable 
                    text={f} 
                    onSave={(val) => {
                      const newF = [...data.flaws];
                      newF[i] = val;
                      onUpdate({ flaws: newF });
                    }} 
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        <section>
          <Editable 
            text={data.sections?.interests || 'Centres d\'intérêt'} 
            className="text-xs font-bold text-primary uppercase tracking-widest mb-4" 
            onSave={(val) => onUpdate({ sections: { ...data.sections!, interests: val } })} 
          />
          <div className="space-y-1 text-sm text-slate-300">
            {data.interests.map((it, i) => (
              <div key={i} className="flex items-start space-x-1">
                <span>•</span>
                <Editable 
                  text={it} 
                  onSave={(val) => {
                    const newI = [...data.interests];
                    newI[i] = val;
                    onUpdate({ interests: newI });
                  }} 
                />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>

    {/* Main Content */}
    <div className="w-[65%] p-8 bg-white flex flex-col overflow-hidden">
      <header className="mb-6">
        <div className="flex space-x-2 text-4xl font-bold text-slate-900 uppercase tracking-tight">
          <Editable text={data.firstName} onSave={(val) => onUpdate({ firstName: val })} />
          <Editable text={data.lastName} onSave={(val) => onUpdate({ lastName: val })} />
        </div>
        <div className="h-1 w-20 bg-primary mt-4"></div>
        <Editable 
          text={data.profile} 
          multiline 
          className="mt-6 text-slate-600 leading-relaxed italic" 
          onSave={(val) => onUpdate({ profile: val })} 
        />
      </header>

      <section className="mb-8 experience-item break-inside-avoid">
        <Editable 
          text={data.sections?.experiences || 'Expériences'} 
          className="text-lg font-bold text-slate-900 uppercase tracking-widest border-b-2 border-slate-100 pb-2 mb-6" 
          onSave={(val) => onUpdate({ sections: { ...data.sections!, experiences: val } })} 
        />
        <div className="space-y-8">
          {data.experiences.map((exp, i) => (
            <div key={i}>
              <div className="flex justify-between items-baseline mb-1">
                <Editable 
                  text={exp.position} 
                  className="font-bold text-slate-900" 
                  onSave={(val) => {
                    const newExp = [...data.experiences];
                    newExp[i] = { ...exp, position: val };
                    onUpdate({ experiences: newExp });
                  }} 
                />
                <div className="flex space-x-1 text-sm text-slate-400 font-medium">
                  <Editable text={exp.startDate} onSave={(val) => {
                    const newExp = [...data.experiences];
                    newExp[i] = { ...exp, startDate: val };
                    onUpdate({ experiences: newExp });
                  }} />
                  <span>-</span>
                  <Editable text={exp.endDate} onSave={(val) => {
                    const newExp = [...data.experiences];
                    newExp[i] = { ...exp, endDate: val };
                    onUpdate({ experiences: newExp });
                  }} />
                </div>
              </div>
              <Editable 
                text={exp.company} 
                className="text-primary text-sm font-bold mb-2" 
                onSave={(val) => {
                  const newExp = [...data.experiences];
                  newExp[i] = { ...exp, company: val };
                  onUpdate({ experiences: newExp });
                }} 
              />
              <Editable 
                text={exp.description} 
                multiline 
                className="text-sm text-slate-600 leading-relaxed" 
                onSave={(val) => {
                  const newExp = [...data.experiences];
                  newExp[i] = { ...exp, description: val };
                  onUpdate({ experiences: newExp });
                }} 
              />
            </div>
          ))}
        </div>
      </section>

      <section className="education-item break-inside-avoid">
        <Editable 
          text={data.sections?.education || 'Formation'} 
          className="text-lg font-bold text-slate-900 uppercase tracking-widest border-b-2 border-slate-100 pb-2 mb-6" 
          onSave={(val) => onUpdate({ sections: { ...data.sections!, education: val } })} 
        />
        <div className="space-y-6">
          {data.education.map((edu, i) => (
            <div key={i}>
              <div className="flex justify-between items-baseline mb-1">
                <Editable 
                  text={edu.degree} 
                  className="font-bold text-slate-900" 
                  onSave={(val) => {
                    const newEdu = [...data.education];
                    newEdu[i] = { ...edu, degree: val };
                    onUpdate({ education: newEdu });
                  }} 
                />
                <Editable 
                  text={edu.year} 
                  className="text-sm text-slate-400 font-medium" 
                  onSave={(val) => {
                    const newEdu = [...data.education];
                    newEdu[i] = { ...edu, year: val };
                    onUpdate({ education: newEdu });
                  }} 
                />
              </div>
              <Editable 
                text={edu.school} 
                className="text-slate-600 text-sm" 
                onSave={(val) => {
                  const newEdu = [...data.education];
                  newEdu[i] = { ...edu, school: val };
                  onUpdate({ education: newEdu });
                }} 
              />
            </div>
          ))}
        </div>
      </section>

      <section className="references-item break-inside-avoid mt-8">
        <Editable 
          text={data.sections?.references || 'Références'} 
          className="text-lg font-bold text-slate-900 uppercase tracking-widest border-b-2 border-slate-100 pb-2 mb-6" 
          onSave={(val) => onUpdate({ sections: { ...data.sections!, references: val } })} 
        />
        <Editable 
          text={data.references || ''} 
          multiline 
          className="text-sm text-slate-600 leading-relaxed whitespace-pre-line" 
          onSave={(val) => onUpdate({ references: val })} 
        />
      </section>
    </div>
  </div>
);

const ClassicTemplate = ({ data, onUpdate }: { data: CVData, onUpdate: (d: Partial<CVData>) => void }) => (
  <div className={`cv-container cv-content-auto min-h-[297mm] w-[210mm] font-sans text-slate-900 bg-white flex relative shadow-2xl mx-auto ${data.isCompact ? 'cv-compact' : ''}`}>
    {/* Sidebar */}
    <div className="w-[35%] bg-slate-800 text-white p-8 flex flex-col">
       {/* Name & Job Title */}
       <div className={data.isCompact ? 'mb-6' : 'mb-12'}>
          <h1 className={`${data.isCompact ? 'text-2xl' : 'text-4xl'} font-black leading-tight mb-1`}>
             <Editable text={data.firstName} onSave={(val) => onUpdate({ firstName: val })} />
             <br />
             <Editable text={data.lastName} onSave={(val) => onUpdate({ lastName: val })} />
          </h1>
          <div className="h-1 w-12 bg-amber-400 mb-4"></div>
          <Editable 
            text={data.experiences[0]?.position || data.jobTitle} 
            className={`${data.isCompact ? 'text-lg' : 'text-xl'} font-bold text-white/80`} 
            onSave={(val) => onUpdate({ jobTitle: val })} 
          />
       </div>

       {/* Contact */}
       <section className={data.isCompact ? 'mb-6' : 'mb-10'}>
          <div className={`bg-white text-slate-800 rounded-full px-6 py-2 inline-flex items-center space-x-2 ${data.isCompact ? 'mb-3' : 'mb-6'}`}>
             <div className="w-2 h-2 bg-slate-800 rounded-full"></div>
             <Editable text={data.sections?.contact || 'contact'} className="font-bold uppercase tracking-widest text-sm" onSave={(val) => onUpdate({ sections: { ...data.sections!, contact: val } })} />
          </div>
          <div className={`space-y-2 ${data.isCompact ? 'text-xs' : 'text-sm'}`}>
             <div className="flex items-center space-x-3">
                <div className={`${data.isCompact ? 'w-6 h-6' : 'w-8 h-8'} rounded-full border border-amber-400 flex items-center justify-center text-amber-400`}>
                   <Phone size={data.isCompact ? 12 : 14} />
                </div>
                <Editable text={data.phone} onSave={(val) => onUpdate({ phone: val })} />
             </div>
             <div className="flex items-center space-x-3">
                <div className={`${data.isCompact ? 'w-6 h-6' : 'w-8 h-8'} rounded-full border border-amber-400 flex items-center justify-center text-amber-400`}>
                   <Mail size={data.isCompact ? 12 : 14} />
                </div>
                <Editable text={data.email} onSave={(val) => onUpdate({ email: val })} />
             </div>
             <div className="flex items-center space-x-3">
                <div className={`${data.isCompact ? 'w-6 h-6' : 'w-8 h-8'} rounded-full border border-amber-400 flex items-center justify-center text-amber-400`}>
                   <MapPin size={data.isCompact ? 12 : 14} />
                </div>
                <Editable text={data.sections?.address || '123, rue Anywhere, ville Any'} onSave={(val) => onUpdate({ sections: { ...data.sections!, address: val } })} />
             </div>
             <div className="flex items-center space-x-3">
                <div className={`${data.isCompact ? 'w-6 h-6' : 'w-8 h-8'} rounded-full border border-amber-400 flex items-center justify-center text-amber-400`}>
                   <Globe size={data.isCompact ? 12 : 14} />
                </div>
                <Editable text={data.website || 'www.reallygreatsite.com'} onSave={(val) => onUpdate({ website: val })} />
             </div>
          </div>
       </section>

       {/* Skills */}
       <section className={data.isCompact ? 'mb-6' : 'mb-10'}>
          <div className={`bg-white text-slate-800 rounded-full px-6 py-2 inline-flex items-center space-x-2 ${data.isCompact ? 'mb-3' : 'mb-6'}`}>
             <div className="w-2 h-2 bg-slate-800 rounded-full"></div>
             <Editable text={data.sections?.skills || 'Compéte'} className="font-bold uppercase tracking-widest text-sm" onSave={(val) => onUpdate({ sections: { ...data.sections!, skills: val } })} />
          </div>
          <div className="space-y-2">
             {data.skills.slice(0, 6).map((skill, i) => (
                <div key={i} className="flex justify-between items-center">
                   <Editable text={skill} className={data.isCompact ? 'text-xs' : 'text-sm'} onSave={(val) => {
                      const newSkills = [...data.skills];
                      newSkills[i] = val;
                      onUpdate({ skills: newSkills });
                   }} />
                   <div className="flex space-x-0.5 text-amber-400">
                      {[1, 2, 3, 4, 5].map(star => (
                         <Star key={star} size={data.isCompact ? 8 : 10} fill={star <= 4 ? "currentColor" : "none"} />
                      ))}
                   </div>
                </div>
             ))}
          </div>
       </section>

        {/* Qualities & Flaws */}
        {(data.qualities.length > 0 || data.flaws.length > 0) && (
          <section className={`${data.isCompact ? 'mb-6' : 'mb-10'} break-inside-avoid`}>
            <div className={`bg-white text-slate-800 rounded-full px-6 py-2 inline-flex items-center space-x-2 ${data.isCompact ? 'mb-3' : 'mb-6'}`}>
               <div className="w-2 h-2 bg-slate-800 rounded-full"></div>
               <Editable text={data.sections?.qualities || 'Qualités & Défauts'} className="font-bold uppercase tracking-widest text-sm" onSave={(val) => onUpdate({ sections: { ...data.sections!, qualities: val } })} />
            </div>
            <div className="space-y-1">
               {data.qualities.map((q, i) => (
                  <div key={`q-${i}`} className={`flex items-center space-x-2 ${data.isCompact ? 'text-xs' : 'text-sm'}`}>
                     <CheckCircle2 size={data.isCompact ? 10 : 12} className="text-amber-400" />
                     <Editable text={q} onSave={(val) => {
                        const newQ = [...data.qualities];
                        newQ[i] = val;
                        onUpdate({ qualities: newQ });
                     }} />
                  </div>
               ))}
               {data.flaws.map((f, i) => (
                  <div key={`f-${i}`} className={`flex items-center space-x-2 ${data.isCompact ? 'text-xs' : 'text-sm'} text-white/60`}>
                     <AlertCircle size={data.isCompact ? 10 : 12} />
                     <Editable text={f} onSave={(val) => {
                        const newF = [...data.flaws];
                        newF[i] = val;
                        onUpdate({ flaws: newF });
                     }} />
                  </div>
               ))}
            </div>
          </section>
        )}

       {/* Languages */}
       <section className={data.isCompact ? 'mb-6' : 'mb-10'}>
          <div className={`bg-white text-slate-800 rounded-full px-6 py-2 inline-flex items-center space-x-2 ${data.isCompact ? 'mb-3' : 'mb-6'}`}>
             <div className="w-2 h-2 bg-slate-800 rounded-full"></div>
             <Editable text={data.sections?.languages || 'Langues'} className="font-bold uppercase tracking-widest text-sm" onSave={(val) => onUpdate({ sections: { ...data.sections!, languages: val } })} />
          </div>
          <ul className={`space-y-1 ${data.isCompact ? 'text-xs' : 'text-sm'} list-disc list-inside`}>
             <li>Anglais</li>
             <li>Allemand</li>
             <li>Français</li>
          </ul>
       </section>

       {/* Interests */}
       {data.interests.length > 0 && (
         <section className={data.isCompact ? 'mb-6' : 'mb-10'}>
           <div className={`bg-white text-slate-800 rounded-full px-6 py-2 inline-flex items-center space-x-2 ${data.isCompact ? 'mb-3' : 'mb-6'}`}>
              <div className="w-2 h-2 bg-slate-800 rounded-full"></div>
              <Editable text={data.sections?.interests || 'Intérêts'} className="font-bold uppercase tracking-widest text-sm" onSave={(val) => onUpdate({ sections: { ...data.sections!, interests: val } })} />
           </div>
           <ul className={`space-y-1 ${data.isCompact ? 'text-xs' : 'text-sm'} list-disc list-inside`}>
              {data.interests.map((interest, i) => (
                <li key={i}>
                  <Editable text={interest} onSave={(val) => {
                    const newInterests = [...data.interests];
                    newInterests[i] = val;
                    onUpdate({ interests: newInterests });
                  }} />
                </li>
              ))}
           </ul>
         </section>
       )}

       {/* Geometric shapes footer sidebar */}
       <div className="mt-auto relative h-32 -mx-8 -mb-8 overflow-hidden">
          <div className="absolute bottom-0 left-0 w-full h-full bg-amber-400 skew-y-12 origin-bottom-left"></div>
          <div className="absolute bottom-0 left-0 w-3/4 h-3/4 bg-white skew-y-12 origin-bottom-left"></div>
       </div>
    </div>

    {/* Main Content */}
    <div className="w-[65%] p-8 flex flex-col relative">
       {/* Sections */}
       <div className={`${data.isCompact ? 'mt-4' : 'mt-8'} ${data.isCompact ? 'space-y-6' : 'space-y-12'}`}>
          {/* Profile & Photo Header */}
          <div className="flex justify-between items-start gap-6">
             <div className="flex-1">
                {/* Profile */}
                <section className="break-inside-avoid">
                   <div className={`bg-amber-400 text-slate-800 rounded-full px-8 py-2 inline-flex items-center space-x-2 ${data.isCompact ? 'mb-3' : 'mb-6'}`}>
                      <div className="w-2 h-2 bg-slate-800 rounded-full"></div>
                      <Editable text={data.sections?.profile || 'Profil'} className="font-bold uppercase tracking-widest text-sm" onSave={(val) => onUpdate({ sections: { ...data.sections!, profile: val } })} />
                   </div>
                   <Editable text={data.profile} multiline className={`${data.isCompact ? 'text-xs' : 'text-sm'} leading-relaxed text-slate-600`} onSave={(val) => onUpdate({ profile: val })} />
                </section>
             </div>
             
             {data.photo && (
                <div className={`${data.isCompact ? 'w-32 h-40' : 'w-44 h-52'} flex-shrink-0 overflow-hidden rounded-3xl shadow-xl border-4 border-white`}>
                   <img src={data.photo} alt="Profile" className="w-full h-full object-cover" />
                </div>
             )}
          </div>

          {/* Experience */}
          <section className="break-inside-avoid">
             <div className={`bg-amber-400 text-slate-800 rounded-full px-8 py-2 inline-flex items-center space-x-2 ${data.isCompact ? 'mb-3' : 'mb-6'}`}>
                <div className="w-2 h-2 bg-slate-800 rounded-full"></div>
                <Editable text={data.sections?.experiences || 'Expérience professionnelle'} className="font-bold uppercase tracking-widest text-sm" onSave={(val) => onUpdate({ sections: { ...data.sections!, experiences: val } })} />
             </div>
             <div className={data.isCompact ? 'space-y-4' : 'space-y-8'}>
                {data.experiences.map((exp, i) => (
                   <div key={i}>
                      <div className="flex justify-between items-baseline mb-1">
                         <div className="font-bold text-slate-800">
                            <Editable text={exp.position} className={data.isCompact ? 'text-sm' : ''} onSave={(val) => {
                               const newExp = [...data.experiences];
                               newExp[i].position = val;
                               onUpdate({ experiences: newExp });
                            }} />
                            <span className="mx-2 text-slate-300">|</span>
                            <Editable text={exp.company} className={`text-slate-500 ${data.isCompact ? 'text-xs' : ''}`} onSave={(val) => {
                               const newExp = [...data.experiences];
                               newExp[i].company = val;
                               onUpdate({ experiences: newExp });
                            }} />
                         </div>
                         <div className="text-xs font-bold text-slate-400 uppercase">
                            <Editable text={exp.startDate} onSave={(val) => {
                               const newExp = [...data.experiences];
                               newExp[i].startDate = val;
                               onUpdate({ experiences: newExp });
                            }} />
                            <span className="mx-1">-</span>
                            <Editable text={exp.endDate} onSave={(val) => {
                               const newExp = [...data.experiences];
                               newExp[i].endDate = val;
                               onUpdate({ experiences: newExp });
                            }} />
                         </div>
                      </div>
                      <Editable text={exp.description} multiline className={`${data.isCompact ? 'text-xs' : 'text-sm'} text-slate-600 leading-relaxed list-disc list-inside`} onSave={(val) => {
                         const newExp = [...data.experiences];
                         newExp[i].description = val;
                         onUpdate({ experiences: newExp });
                      }} />
                   </div>
                ))}
             </div>
          </section>

          {/* Education */}
          <section className="break-inside-avoid">
             <div className={`bg-amber-400 text-slate-800 rounded-full px-8 py-2 inline-flex items-center space-x-2 ${data.isCompact ? 'mb-3' : 'mb-6'}`}>
                <div className="w-2 h-2 bg-slate-800 rounded-full"></div>
                <Editable text={data.sections?.education || 'Éducation'} className="font-bold uppercase tracking-widest text-sm" onSave={(val) => onUpdate({ sections: { ...data.sections!, education: val } })} />
             </div>
             <div className={data.isCompact ? 'space-y-3' : 'space-y-6'}>
                {data.education.map((edu, i) => (
                   <div key={i}>
                      <div className="flex justify-between items-baseline mb-1">
                         <Editable text={edu.degree} className={`font-bold text-slate-800 ${data.isCompact ? 'text-sm' : ''}`} onSave={(val) => {
                            const newEdu = [...data.education];
                            newEdu[i].degree = val;
                            onUpdate({ education: newEdu });
                         }} />
                         <Editable text={edu.year} className="text-xs font-bold text-slate-400" onSave={(val) => {
                            const newEdu = [...data.education];
                            newEdu[i].year = val;
                            onUpdate({ education: newEdu });
                         }} />
                      </div>
                      <Editable text={edu.school} className={`${data.isCompact ? 'text-xs' : 'text-sm'} text-slate-500`} onSave={(val) => {
                         const newEdu = [...data.education];
                         newEdu[i].school = val;
                         onUpdate({ education: newEdu });
                      }} />
                   </div>
                ))}
             </div>
          </section>

          {/* References */}
          <section className="break-inside-avoid mt-8">
             <div className={`bg-amber-400 text-slate-800 rounded-full px-8 py-2 inline-flex items-center space-x-2 ${data.isCompact ? 'mb-3' : 'mb-6'}`}>
                <div className="w-2 h-2 bg-slate-800 rounded-full"></div>
                <Editable text={data.sections?.references || 'Références'} className="font-bold uppercase tracking-widest text-sm" onSave={(val) => onUpdate({ sections: { ...data.sections!, references: val } })} />
             </div>
             <Editable 
               text={data.references || ''} 
               multiline 
               className={`${data.isCompact ? 'text-xs' : 'text-sm'} text-slate-600 leading-relaxed whitespace-pre-line`} 
               onSave={(val) => onUpdate({ references: val })} 
             />
          </section>
       </div>

       {/* Geometric shapes footer main */}
       <div className="mt-auto relative h-32 -mx-12 -mb-12 overflow-hidden">
          <div className="absolute bottom-0 right-0 w-full h-full bg-slate-800 -skew-y-6 origin-bottom-right"></div>
       </div>
    </div>
  </div>
);

const CreativeTemplate = ({ data, onUpdate }: { data: CVData, onUpdate: (d: Partial<CVData>) => void }) => (
  <div className={`cv-container cv-content-auto min-h-[297mm] w-[210mm] font-sans text-slate-800 bg-slate-50 relative shadow-2xl mx-auto ${data.isCompact ? 'cv-compact' : ''}`}>
    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full -mr-32 -mt-32 no-print"></div>
    <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-50 rounded-full -ml-48 -mb-48 no-print"></div>

    <div className="relative z-10 p-10">
      <header className="flex items-center space-x-8 mb-8">
        {data.photo && (
          <div className="w-40 h-40 rounded-full overflow-hidden border-8 border-white shadow-2xl">
            <img src={data.photo} alt="Profile" className="w-full h-full object-cover" />
          </div>
        )}
        <div>
          <div className="text-5xl font-black text-slate-900 leading-none mb-2">
            <Editable text={data.firstName} onSave={(val) => onUpdate({ firstName: val })} />
            <Editable text={data.lastName} className="text-primary" onSave={(val) => onUpdate({ lastName: val })} />
          </div>
          <Editable 
            text={data.experiences[0]?.position || data.jobTitle} 
            className="text-lg font-bold text-slate-400 uppercase tracking-widest" 
            onSave={(val) => {
              const newExp = [...data.experiences];
              if (newExp[0]) newExp[0].position = val;
              onUpdate({ experiences: newExp, jobTitle: val });
            }} 
          />
        </div>
      </header>

      <div className="grid grid-cols-12 gap-12">
        <div className="col-span-8 space-y-12">
          <section className="break-inside-avoid">
            <Editable 
              text={data.sections?.experiences || 'MON PARCOURS'} 
              className="text-2xl font-black text-slate-900 mb-6 flex items-center" 
              onSave={(val) => onUpdate({ sections: { ...data.sections!, experiences: val } })} 
            />
            <div className="space-y-8 border-l-2 border-slate-200 ml-4 pl-8">
              {data.experiences.map((exp, i) => (
                <div key={i} className="relative">
                  <div className="absolute -left-[41px] top-1 w-4 h-4 bg-white border-2 border-primary rounded-full"></div>
                  <Editable text={exp.position} className="text-xl font-bold text-slate-900" onSave={(val) => {
                    const newExp = [...data.experiences];
                    newExp[i].position = val;
                    onUpdate({ experiences: newExp });
                  }} />
                  <div className="flex space-x-1 text-primary font-bold text-sm mb-3">
                    <Editable text={exp.company} onSave={(val) => {
                      const newExp = [...data.experiences];
                      newExp[i].company = val;
                      onUpdate({ experiences: newExp });
                    }} />
                    <span>|</span>
                    <Editable text={exp.startDate} onSave={(val) => {
                      const newExp = [...data.experiences];
                      newExp[i].startDate = val;
                      onUpdate({ experiences: newExp });
                    }} />
                    <span>-</span>
                    <Editable text={exp.endDate} onSave={(val) => {
                      const newExp = [...data.experiences];
                      newExp[i].endDate = val;
                      onUpdate({ experiences: newExp });
                    }} />
                  </div>
                  <Editable text={exp.description} multiline className="text-sm text-slate-600 leading-relaxed" onSave={(val) => {
                    const newExp = [...data.experiences];
                    newExp[i].description = val;
                    onUpdate({ experiences: newExp });
                  }} />
                </div>
              ))}
            </div>
          </section>

          <section className="break-inside-avoid">
            <Editable 
              text={data.sections?.education || 'FORMATION'} 
              className="text-2xl font-black text-slate-900 mb-6 flex items-center" 
              onSave={(val) => onUpdate({ sections: { ...data.sections!, education: val } })} 
            />
            <div className="grid md:grid-cols-2 gap-6">
              {data.education.map((edu, i) => (
                <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <Editable text={edu.degree} className="font-bold text-slate-900 mb-1" onSave={(val) => {
                    const newEdu = [...data.education];
                    newEdu[i].degree = val;
                    onUpdate({ education: newEdu });
                  }} />
                  <Editable text={edu.school} className="text-sm text-slate-500" onSave={(val) => {
                    const newEdu = [...data.education];
                    newEdu[i].school = val;
                    onUpdate({ education: newEdu });
                  }} />
                  <Editable text={edu.year} className="text-xs font-bold text-primary mt-2" onSave={(val) => {
                    const newEdu = [...data.education];
                    newEdu[i].year = val;
                    onUpdate({ education: newEdu });
                  }} />
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="col-span-4 space-y-10">
          <section className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-xl">
            <Editable 
              text={data.sections?.contact || 'Contact'} 
              className="text-sm font-black uppercase tracking-widest mb-6 text-primary" 
              onSave={(val) => onUpdate({ sections: { ...data.sections!, contact: val } })} 
            />
            <div className="space-y-4 text-sm">
              <div className="flex flex-col">
                <Editable 
                  text={data.sections?.email || 'Email'} 
                  className="text-slate-500 font-bold mb-1" 
                  onSave={(val) => onUpdate({ sections: { ...data.sections!, email: val } })} 
                />
                <Editable text={data.email} onSave={(val) => onUpdate({ email: val })} />
              </div>
              <div className="flex flex-col">
                <Editable 
                  text={data.sections?.phone || 'Phone'} 
                  className="text-slate-500 font-bold mb-1" 
                  onSave={(val) => onUpdate({ sections: { ...data.sections!, phone: val } })} 
                />
                <Editable text={data.phone} onSave={(val) => onUpdate({ phone: val })} />
              </div>
            </div>
          </section>

          <section>
            <Editable 
              text={data.sections?.skills || 'Compétences'} 
              className="text-sm font-black uppercase tracking-widest mb-4" 
              onSave={(val) => onUpdate({ sections: { ...data.sections!, skills: val } })} 
            />
            <div className="flex flex-wrap gap-2">
              {data.skills.map((s, i) => (
                <Editable 
                  key={i} 
                  text={s} 
                  className="bg-white px-3 py-1 rounded-full text-xs font-bold shadow-sm border border-slate-100" 
                  onSave={(val) => {
                    const newS = [...data.skills];
                    newS[i] = val;
                    onUpdate({ skills: newS });
                  }} 
                />
              ))}
            </div>
          </section>

          <section className="break-inside-avoid">
            <Editable 
              text={data.sections?.qualities || 'QUALITÉS & DÉFAUTS'} 
              className="text-sm font-black uppercase tracking-widest mb-4" 
              onSave={(val) => onUpdate({ sections: { ...data.sections!, qualities: val } })} 
            />
            <div className="space-y-2">
              {data.qualities.map((q, i) => (
                <div key={`q-${i}`} className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                  <Editable 
                    text={q} 
                    className="text-xs font-bold text-slate-700" 
                    onSave={(val) => {
                      const newQ = [...data.qualities];
                      newQ[i] = val;
                      onUpdate({ qualities: newQ });
                    }} 
                  />
                </div>
              ))}
              {data.flaws.map((f, i) => (
                <div key={`f-${i}`} className="flex items-center space-x-2 opacity-60">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                  <Editable 
                    text={f} 
                    className="text-xs font-medium text-slate-500" 
                    onSave={(val) => {
                      const newF = [...data.flaws];
                      newF[i] = val;
                      onUpdate({ flaws: newF });
                    }} 
                  />
                </div>
              ))}
            </div>
          </section>

          <section>
            <Editable 
              text={data.sections?.interests || 'Loisirs'} 
              className="text-sm font-black uppercase tracking-widest mb-4" 
              onSave={(val) => onUpdate({ sections: { ...data.sections!, interests: val } })} 
            />
            <div className="flex flex-wrap gap-2">
              {data.interests.map((s, i) => (
                <Editable 
                  key={i} 
                  text={s} 
                  className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold" 
                  onSave={(val) => {
                    const newI = [...data.interests];
                    newI[i] = val;
                    onUpdate({ interests: newI });
                  }} 
                />
              ))}
            </div>
          </section>

          <section>
            <Editable 
              text={data.sections?.references || 'Références'} 
              className="text-sm font-black uppercase tracking-widest mb-4" 
              onSave={(val) => onUpdate({ sections: { ...data.sections!, references: val } })} 
            />
            <Editable 
              text={data.references || ''} 
              multiline 
              className="text-xs text-slate-600 leading-relaxed whitespace-pre-line" 
              onSave={(val) => onUpdate({ references: val })} 
            />
          </section>
        </div>
      </div>
    </div>
  </div>
);

const BlueTemplate = ({ data, onUpdate }: { data: CVData, onUpdate: (d: Partial<CVData>) => void }) => (
  <div className={`cv-container cv-content-auto min-h-[297mm] w-[210mm] font-sans text-slate-900 bg-white flex relative shadow-2xl mx-auto ${data.isCompact ? 'cv-compact' : ''}`}>
    <div className="w-[35%] bg-[#2d4a63] text-white p-8 flex flex-col">
       <div className="mb-8 flex justify-center">
          <div className="w-40 h-40 rounded-full border-8 border-[#2d4a63] shadow-xl overflow-hidden bg-white">
             {data.photo ? (
                <img src={data.photo} alt="Profile" className="w-full h-full object-cover" />
             ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400">
                   <Maximize2 size={48} />
                </div>
             )}
          </div>
       </div>
       <section className="mb-10">
          <h2 className="text-lg font-bold uppercase tracking-widest border-b border-white/20 pb-2 mb-4">
             <Editable text={data.sections?.education || 'Education'} onSave={(val) => onUpdate({ sections: { ...data.sections!, education: val } })} />
          </h2>
          <div className="space-y-4">
             {data.education.map((edu, i) => (
                <div key={i}>
                   <Editable text={edu.school} className="font-bold block" onSave={(val) => {
                      const newEdu = [...data.education];
                      newEdu[i].school = val;
                      onUpdate({ education: newEdu });
                   }} />
                   <div className="text-xs opacity-80 mb-1">
                      <Editable text={edu.year} onSave={(val) => {
                         const newEdu = [...data.education];
                         newEdu[i].year = val;
                         onUpdate({ education: newEdu });
                      }} />
                   </div>
                   <Editable text={edu.degree} className="text-sm italic" onSave={(val) => {
                      const newEdu = [...data.education];
                      newEdu[i].degree = val;
                      onUpdate({ education: newEdu });
                   }} />
                </div>
             ))}
          </div>
       </section>
       <section className="mb-10">
          <h2 className="text-lg font-bold uppercase tracking-widest border-b border-white/20 pb-2 mb-4">
             <Editable text={data.sections?.skills || 'Skills'} onSave={(val) => onUpdate({ sections: { ...data.sections!, skills: val } })} />
          </h2>
          <div className="space-y-3">
             {data.skills.map((skill, i) => (
                <div key={i}>
                   <div className="flex justify-between text-xs uppercase font-bold mb-1">
                      <Editable text={skill} onSave={(val) => {
                         const newSkills = [...data.skills];
                         newSkills[i] = val;
                         onUpdate({ skills: newSkills });
                      }} />
                   </div>
                   <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-white rounded-full" style={{ width: '80%' }}></div>
                   </div>
                </div>
             ))}
          </div>
       </section>
       <section className="mt-auto">
          <h2 className="text-lg font-bold uppercase tracking-widest border-b border-white/20 pb-2 mb-4">
             <Editable text={data.sections?.contact || 'Contact'} onSave={(val) => onUpdate({ sections: { ...data.sections!, contact: val } })} />
          </h2>
          <div className="space-y-3 text-sm">
             <div className="flex items-center space-x-3">
                <Phone size={14} className="text-white/60" />
                <Editable text={data.phone} onSave={(val) => onUpdate({ phone: val })} />
             </div>
             <div className="flex items-center space-x-3">
                <Mail size={14} className="text-white/60" />
                <Editable text={data.email} onSave={(val) => onUpdate({ email: val })} />
             </div>
             <div className="flex items-center space-x-3">
                <MapPin size={14} className="text-white/60" />
                <Editable text={data.sections?.address || 'Address'} onSave={(val) => onUpdate({ sections: { ...data.sections!, address: val } })} />
             </div>
          </div>
       </section>
    </div>
    <div className="w-[65%] p-12 flex flex-col">
       <div className="mb-12">
          <h1 className="text-5xl font-black text-[#2d4a63] leading-tight mb-2">
             <Editable text={data.firstName} onSave={(val) => onUpdate({ firstName: val })} />
             <br />
             <Editable text={data.lastName} onSave={(val) => onUpdate({ lastName: val })} />
          </h1>
          <Editable text={data.jobTitle || 'Graphic Designer'} className="text-xl font-bold tracking-[0.2em] uppercase text-slate-800" onSave={(val) => onUpdate({ jobTitle: val })} />
       </div>
       <section className="mb-10">
          <div className="bg-[#2d4a63] text-white px-6 py-2 rounded-r-full -ml-12 mb-6 inline-block">
             <Editable text={data.sections?.profile || 'Profil'} className="font-bold uppercase tracking-widest" onSave={(val) => onUpdate({ sections: { ...data.sections!, profile: val } })} />
          </div>
          <Editable text={data.profile} multiline className="text-sm leading-relaxed text-slate-600" onSave={(val) => onUpdate({ profile: val })} />
       </section>
       <section className="mb-10">
          <div className="bg-[#2d4a63] text-white px-6 py-2 rounded-r-full -ml-12 mb-6 inline-block">
             <Editable text={data.sections?.experiences || 'Expériences'} className="font-bold uppercase tracking-widest" onSave={(val) => onUpdate({ sections: { ...data.sections!, experiences: val } })} />
          </div>
          <div className="space-y-8">
             {data.experiences.map((exp, i) => (
                <div key={i} className="relative pl-6 border-l-2 border-slate-100">
                   <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-[#2d4a63]"></div>
                   <div className="flex justify-between items-baseline mb-1">
                      <Editable text={exp.position} className="font-bold text-slate-800 uppercase" onSave={(val) => {
                         const newExp = [...data.experiences];
                         newExp[i].position = val;
                         onUpdate({ experiences: newExp });
                      }} />
                      <div className="text-xs font-bold text-slate-400">
                         <Editable text={exp.startDate} onSave={(val) => {
                            const newExp = [...data.experiences];
                            newExp[i].startDate = val;
                            onUpdate({ experiences: newExp });
                         }} />
                         <span> / </span>
                         <Editable text={exp.endDate} onSave={(val) => {
                            const newExp = [...data.experiences];
                            newExp[i].endDate = val;
                            onUpdate({ experiences: newExp });
                         }} />
                      </div>
                   </div>
                   <Editable text={exp.company} className="text-sm font-bold text-[#2d4a63] mb-2 block" onSave={(val) => {
                      const newExp = [...data.experiences];
                      newExp[i].company = val;
                      onUpdate({ experiences: newExp });
                   }} />
                   <Editable text={exp.description} multiline className="text-sm text-slate-600 leading-relaxed" onSave={(val) => {
                      const newExp = [...data.experiences];
                      newExp[i].description = val;
                      onUpdate({ experiences: newExp });
                   }} />
                </div>
             ))}
          </div>
       </section>
       <section>
          <div className="bg-[#2d4a63] text-white px-6 py-2 rounded-r-full -ml-12 mb-6 inline-block">
             <Editable text={data.sections?.references || 'Références'} className="font-bold uppercase tracking-widest" onSave={(val) => onUpdate({ sections: { ...data.sections!, references: val } })} />
          </div>
          <Editable 
            text={data.references || ''} 
            multiline 
            className="text-sm text-slate-600 leading-relaxed whitespace-pre-line" 
            onSave={(val) => onUpdate({ references: val })} 
          />
       </section>
    </div>
  </div>
);

const PinkTemplate = ({ data, onUpdate }: { data: CVData, onUpdate: (d: Partial<CVData>) => void }) => (
  <div className={`cv-container cv-content-auto min-h-[297mm] w-[210mm] font-sans text-slate-900 bg-white relative shadow-2xl mx-auto overflow-hidden ${data.isCompact ? 'cv-compact' : ''}`}>
    <div className="absolute top-0 right-0 w-1/2 h-64 bg-[#e8b4b8] -skew-y-12 origin-top-right -z-0"></div>
    <div className="absolute top-48 left-0 w-1/3 h-32 bg-[#e8b4b8]/20 skew-y-12 origin-top-left -z-0"></div>
    <div className="relative z-10 flex h-full min-h-[297mm]">
       <div className="w-[40%] p-10 flex flex-col">
          <div className="mb-12">
             <h1 className="text-4xl font-black text-slate-800 leading-tight uppercase">
                <Editable text={data.firstName} onSave={(val) => onUpdate({ firstName: val })} />
                <br />
                <Editable text={data.lastName} onSave={(val) => onUpdate({ lastName: val })} />
             </h1>
             <Editable text={data.jobTitle || 'Graphic Designer'} className="text-lg italic text-slate-500" onSave={(val) => onUpdate({ jobTitle: val })} />
          </div>
          <section className="mb-10">
             <h2 className="text-2xl font-black text-slate-800 mb-4">
                <Editable text={data.sections?.profile || 'Profil'} onSave={(val) => onUpdate({ sections: { ...data.sections!, profile: val } })} />
             </h2>
             <Editable text={data.profile} multiline className="text-sm leading-relaxed text-slate-600" onSave={(val) => onUpdate({ profile: val })} />
          </section>
          <section className="mb-10">
             <h2 className="text-2xl font-black text-slate-800 mb-4">
                <Editable text={data.sections?.contact || 'Contact'} onSave={(val) => onUpdate({ sections: { ...data.sections!, contact: val } })} />
             </h2>
             <div className="space-y-2 text-sm text-slate-600">
                <div className="flex items-center space-x-2">
                   <span className="w-1.5 h-1.5 rounded-full bg-[#e8b4b8]"></span>
                   <Editable text={data.phone} onSave={(val) => onUpdate({ phone: val })} />
                </div>
                <div className="flex items-center space-x-2">
                   <span className="w-1.5 h-1.5 rounded-full bg-[#e8b4b8]"></span>
                   <Editable text={data.email} onSave={(val) => onUpdate({ email: val })} />
                </div>
                <div className="flex items-center space-x-2">
                   <span className="w-1.5 h-1.5 rounded-full bg-[#e8b4b8]"></span>
                   <Editable text={data.sections?.address || 'Adresse'} onSave={(val) => onUpdate({ sections: { ...data.sections!, address: val } })} />
                </div>
             </div>
          </section>
          <section className="mb-10">
             <h2 className="text-2xl font-black text-slate-800 mb-4">
                <Editable text={data.sections?.education || 'Formation'} onSave={(val) => onUpdate({ sections: { ...data.sections!, education: val } })} />
             </h2>
             <div className="space-y-6">
                {data.education.map((edu, i) => (
                   <div key={i} className="relative pl-4 border-l border-[#e8b4b8]">
                      <div className="absolute -left-1.5 top-0 w-3 h-3 rotate-45 bg-[#e8b4b8]"></div>
                      <div className="text-sm font-bold text-slate-400 mb-1">
                         <Editable text={edu.year} onSave={(val) => {
                            const newEdu = [...data.education];
                            newEdu[i].year = val;
                            onUpdate({ education: newEdu });
                         }} />
                      </div>
                      <Editable text={edu.school} className="text-sm font-bold text-slate-700 block" onSave={(val) => {
                         const newEdu = [...data.education];
                         newEdu[i].school = val;
                         onUpdate({ education: newEdu });
                      }} />
                      <Editable text={edu.degree} className="text-xs text-slate-500" onSave={(val) => {
                         const newEdu = [...data.education];
                         newEdu[i].degree = val;
                         onUpdate({ education: newEdu });
                      }} />
                   </div>
                ))}
             </div>
          </section>
       </div>
       <div className="w-[60%] p-10 flex flex-col">
          <div className="flex justify-end mb-12">
             <div className="w-56 h-56 rounded-full border-[12px] border-white shadow-2xl overflow-hidden bg-slate-100">
                {data.photo ? (
                   <img src={data.photo} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                   <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Maximize2 size={64} />
                   </div>
                )}
             </div>
          </div>
          <section className="mb-10">
             <h2 className="text-2xl font-black text-slate-800 mb-6">
                <Editable text={data.sections?.experiences || 'Expériences'} onSave={(val) => onUpdate({ sections: { ...data.sections!, experiences: val } })} />
             </h2>
             <div className="space-y-8">
                {data.experiences.map((exp, i) => (
                   <div key={i} className="relative pl-6 border-l border-dashed border-[#e8b4b8]">
                      <div className="absolute -left-1.5 top-0 w-3 h-3 rotate-45 bg-[#e8b4b8]"></div>
                      <div className="flex justify-between items-baseline mb-1">
                         <Editable text={exp.company} className="font-bold text-slate-700" onSave={(val) => {
                            const newExp = [...data.experiences];
                            newExp[i].company = val;
                            onUpdate({ experiences: newExp });
                         }} />
                         <div className="text-xs font-bold text-slate-400">
                            <Editable text={exp.startDate} onSave={(val) => {
                               const newExp = [...data.experiences];
                               newExp[i].startDate = val;
                               onUpdate({ experiences: newExp });
                            }} />
                            <span>-</span>
                            <Editable text={exp.endDate} onSave={(val) => {
                               const newExp = [...data.experiences];
                               newExp[i].endDate = val;
                               onUpdate({ experiences: newExp });
                            }} />
                         </div>
                      </div>
                      <Editable text={exp.position} className="text-sm italic text-slate-500 mb-2 block" onSave={(val) => {
                         const newExp = [...data.experiences];
                         newExp[i].position = val;
                         onUpdate({ experiences: newExp });
                      }} />
                      <Editable text={exp.description} multiline className="text-xs text-slate-600 leading-relaxed list-disc list-inside" onSave={(val) => {
                         const newExp = [...data.experiences];
                         newExp[i].description = val;
                         onUpdate({ experiences: newExp });
                      }} />
                   </div>
                ))}
             </div>
          </section>
          <section className="mb-10">
             <h2 className="text-2xl font-black text-slate-800 mb-4">
                <Editable text={data.sections?.skills || 'Compétences'} onSave={(val) => onUpdate({ sections: { ...data.sections!, skills: val } })} />
             </h2>
             <div className="grid grid-cols-1 gap-3">
                {data.skills.map((skill, i) => (
                   <div key={i} className="flex items-center justify-between">
                      <Editable text={skill} className="text-sm text-slate-700" onSave={(val) => {
                         const newSkills = [...data.skills];
                         newSkills[i] = val;
                         onUpdate({ skills: newSkills });
                      }} />
                      <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                         <div className="h-full bg-[#e8b4b8]" style={{ width: '70%' }}></div>
                      </div>
                   </div>
                ))}
             </div>
          </section>
          <section className="mb-10">
             <h2 className="text-2xl font-black text-slate-800 mb-4">
                <Editable text={data.sections?.references || 'Références'} onSave={(val) => onUpdate({ sections: { ...data.sections!, references: val } })} />
             </h2>
             <Editable 
               text={data.references || ''} 
               multiline 
               className="text-sm text-slate-600 leading-relaxed whitespace-pre-line" 
               onSave={(val) => onUpdate({ references: val })} 
             />
          </section>
          <section>
             <h2 className="text-2xl font-black text-slate-800 mb-4">Langues</h2>
             <div className="grid grid-cols-1 gap-3">
                {['English', 'Chinese', 'Portuguese', 'French'].map((lang, i) => (
                   <div key={i} className="flex items-center justify-between">
                      <span className="text-sm text-slate-700">{lang}</span>
                      <div className="flex space-x-1">
                         {[1, 2, 3, 4, 5].map(dot => (
                            <div key={dot} className={`w-6 h-1.5 rounded-full ${dot <= 4 - i ? 'bg-[#e8b4b8]' : 'bg-slate-100'}`}></div>
                         ))}
                      </div>
                   </div>
                ))}
             </div>
          </section>
       </div>
    </div>
  </div>
);

const DarkTemplate = ({ data, onUpdate }: { data: CVData, onUpdate: (d: Partial<CVData>) => void }) => (
  <div className={`cv-container cv-content-auto min-h-[297mm] w-[210mm] font-sans text-white bg-[#0f111a] p-8 shadow-2xl mx-auto ${data.isCompact ? 'cv-compact' : ''}`}>
    <div className="bg-gradient-to-br from-[#1a1c2e] to-[#0f111a] rounded-[2rem] h-full p-10 border border-white/5 relative overflow-hidden">
       <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 blur-[100px] -z-0"></div>
       <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 blur-[100px] -z-0"></div>
       <div className="relative z-10 flex flex-col h-full">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 mb-8 flex justify-between items-center">
             <div>
                <h1 className="text-5xl font-black tracking-tight mb-2">
                   <Editable text={data.firstName} onSave={(val) => onUpdate({ firstName: val })} />{' '}
                   <Editable text={data.lastName} onSave={(val) => onUpdate({ lastName: val })} />
                </h1>
                <Editable text={data.jobTitle || 'UI/UX Designer'} className="text-xl text-purple-400 font-bold" onSave={(val) => onUpdate({ jobTitle: val })} />
             </div>
             <div className="text-right text-sm text-white/60 space-y-1">
                <div className="flex items-center justify-end space-x-2">
                   <Editable text={data.phone} onSave={(val) => onUpdate({ phone: val })} />
                   <Phone size={14} />
                </div>
                <div className="flex items-center justify-end space-x-2">
                   <Editable text={data.email} onSave={(val) => onUpdate({ email: val })} />
                   <Mail size={14} />
                </div>
                <div className="flex items-center justify-end space-x-2">
                   <Editable text={data.sections?.address || 'Address'} onSave={(val) => onUpdate({ sections: { ...data.sections!, address: val } })} />
                   <MapPin size={14} />
                </div>
             </div>
          </div>
          <div className="flex gap-8 flex-1">
             <div className="w-[35%] space-y-8">
                <section className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6">
                   <h2 className="text-sm font-black uppercase tracking-widest text-purple-400 mb-6 border-b border-white/10 pb-2">
                      <Editable text={data.sections?.skills || 'Compétences'} onSave={(val) => onUpdate({ sections: { ...data.sections!, skills: val } })} />
                   </h2>
                   <div className="flex flex-wrap gap-2">
                      {data.skills.map((skill, i) => (
                         <div key={i} className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl text-xs font-bold text-white/80">
                            <Editable text={skill} onSave={(val) => {
                               const newSkills = [...data.skills];
                               newSkills[i] = val;
                               onUpdate({ skills: newSkills });
                            }} />
                         </div>
                      ))}
                   </div>
                </section>
                <section className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6">
                   <h2 className="text-sm font-black uppercase tracking-widest text-purple-400 mb-6 border-b border-white/10 pb-2">
                      <Editable text={data.sections?.education || 'Formation'} onSave={(val) => onUpdate({ sections: { ...data.sections!, education: val } })} />
                   </h2>
                   <div className="space-y-6">
                      {data.education.map((edu, i) => (
                         <div key={i}>
                            <Editable text={edu.degree} className="font-bold block text-white" onSave={(val) => {
                               const newEdu = [...data.education];
                               newEdu[i].degree = val;
                               onUpdate({ education: newEdu });
                            }} />
                            <Editable text={edu.school} className="text-xs text-white/60 block" onSave={(val) => {
                               const newEdu = [...data.education];
                               newEdu[i].school = val;
                               onUpdate({ education: newEdu });
                            }} />
                            <Editable text={edu.year} className="text-[10px] font-black text-purple-400 uppercase mt-1 block" onSave={(val) => {
                               const newEdu = [...data.education];
                               newEdu[i].year = val;
                               onUpdate({ education: newEdu });
                            }} />
                         </div>
                      ))}
                   </div>
                </section>
                <section className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6">
                   <h2 className="text-sm font-black uppercase tracking-widest text-purple-400 mb-6 border-b border-white/10 pb-2">Langues</h2>
                   <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                         <span className="text-white/80">Anglais</span>
                         <span className="text-purple-400 font-bold text-xs uppercase">Natif</span>
                      </div>
                      <div className="flex justify-between">
                         <span className="text-white/80">Français</span>
                         <span className="text-purple-400 font-bold text-xs uppercase">Courant</span>
                      </div>
                   </div>
                </section>
             </div>
             <div className="w-[65%] space-y-8">
                <section className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8">
                   <h2 className="text-sm font-black uppercase tracking-widest text-purple-400 mb-6">
                      <Editable text={data.sections?.profile || 'Profil'} onSave={(val) => onUpdate({ sections: { ...data.sections!, profile: val } })} />
                   </h2>
                   <Editable text={data.profile} multiline className="text-sm leading-relaxed text-white/70" onSave={(val) => onUpdate({ profile: val })} />
                </section>
                <section className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 flex-1">
                   <h2 className="text-sm font-black uppercase tracking-widest text-purple-400 mb-8">
                      <Editable text={data.sections?.experiences || 'Expériences'} onSave={(val) => onUpdate({ sections: { ...data.sections!, experiences: val } })} />
                   </h2>
                   <div className="space-y-10">
                      {data.experiences.map((exp, i) => (
                         <div key={i} className="relative pl-8 border-l border-white/10">
                            <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
                            <div className="flex justify-between items-start mb-2">
                               <div>
                                  <Editable text={exp.position} className="text-lg font-bold text-white block" onSave={(val) => {
                                     const newExp = [...data.experiences];
                                     newExp[i].position = val;
                                     onUpdate({ experiences: newExp });
                                  }} />
                                  <Editable text={exp.company} className="text-sm font-bold text-purple-400 block" onSave={(val) => {
                                     const newExp = [...data.experiences];
                                     newExp[i].company = val;
                                     onUpdate({ experiences: newExp });
                                  }} />
                               </div>
                               <div className="bg-white/5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-white/10">
                                  <Editable text={exp.startDate} onSave={(val) => {
                                     const newExp = [...data.experiences];
                                     newExp[i].startDate = val;
                                     onUpdate({ experiences: newExp });
                                  }} />
                                  <span> - </span>
                                  <Editable text={exp.endDate} onSave={(val) => {
                                     const newExp = [...data.experiences];
                                     newExp[i].endDate = val;
                                     onUpdate({ experiences: newExp });
                                  }} />
                               </div>
                            </div>
                            <Editable text={exp.description} multiline className="text-xs text-white/50 leading-relaxed" onSave={(val) => {
                               const newExp = [...data.experiences];
                               newExp[i].description = val;
                               onUpdate({ experiences: newExp });
                            }} />
                         </div>
                      ))}
                   </div>
                </section>
                <section className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8">
                   <h2 className="text-sm font-black uppercase tracking-widest text-purple-400 mb-6">
                      <Editable text={data.sections?.references || 'Références'} onSave={(val) => onUpdate({ sections: { ...data.sections!, references: val } })} />
                   </h2>
                   <Editable 
                     text={data.references || ''} 
                     multiline 
                     className="text-xs text-white/50 leading-relaxed whitespace-pre-line" 
                     onSave={(val) => onUpdate({ references: val })} 
                   />
                </section>
             </div>
          </div>
       </div>
    </div>
  </div>
);

const OrangeTemplate = ({ data, onUpdate }: { data: CVData, onUpdate: (d: Partial<CVData>) => void }) => (
  <div className={`cv-container cv-content-auto min-h-[297mm] w-[210mm] font-sans text-slate-900 bg-white relative shadow-2xl mx-auto overflow-hidden ${data.isCompact ? 'cv-compact' : ''}`}>
    <div className="absolute top-0 right-0 w-1/2 h-64 bg-[#f27d26] -skew-y-12 origin-top-right -z-0"></div>
    <div className="absolute top-10 right-10 w-64 h-64 border-[20px] border-white/20 rounded-full -z-0"></div>
    <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#f27d26] rounded-tr-[100px] -z-0"></div>
    <div className="relative z-10 flex h-full min-h-[297mm]">
       <div className="w-[40%] p-10 flex flex-col">
          <div className="mb-12">
             <h1 className="text-4xl font-black text-slate-800 leading-tight uppercase">
                <Editable text={data.firstName} onSave={(val) => onUpdate({ firstName: val })} />
                <br />
                <Editable text={data.lastName} onSave={(val) => onUpdate({ lastName: val })} />
             </h1>
             <Editable text={data.jobTitle || 'Graphic Designer'} className="text-lg italic text-slate-500" onSave={(val) => onUpdate({ jobTitle: val })} />
          </div>
          <section className="mb-10">
             <h2 className="text-2xl font-black text-slate-800 mb-4">
                <Editable text={data.sections?.profile || 'Profil'} onSave={(val) => onUpdate({ sections: { ...data.sections!, profile: val } })} />
             </h2>
             <Editable text={data.profile} multiline className="text-sm leading-relaxed text-slate-600" onSave={(val) => onUpdate({ profile: val })} />
          </section>
          <section className="mb-10">
             <h2 className="text-2xl font-black text-slate-800 mb-4">
                <Editable text={data.sections?.contact || 'Contact'} onSave={(val) => onUpdate({ sections: { ...data.sections!, contact: val } })} />
             </h2>
             <div className="space-y-2 text-sm text-slate-600">
                <div className="flex items-center space-x-2">
                   <span className="w-1.5 h-1.5 rounded-full bg-[#f27d26]"></span>
                   <Editable text={data.phone} onSave={(val) => onUpdate({ phone: val })} />
                </div>
                <div className="flex items-center space-x-2">
                   <span className="w-1.5 h-1.5 rounded-full bg-[#f27d26]"></span>
                   <Editable text={data.email} onSave={(val) => onUpdate({ email: val })} />
                </div>
                <div className="flex items-center space-x-2">
                   <span className="w-1.5 h-1.5 rounded-full bg-[#f27d26]"></span>
                   <Editable text={data.sections?.address || 'Adresse'} onSave={(val) => onUpdate({ sections: { ...data.sections!, address: val } })} />
                </div>
             </div>
          </section>
          <section className="mb-10">
             <h2 className="text-2xl font-black text-slate-800 mb-4">
                <Editable text={data.sections?.education || 'Formation'} onSave={(val) => onUpdate({ sections: { ...data.sections!, education: val } })} />
             </h2>
             <div className="space-y-6">
                {data.education.map((edu, i) => (
                   <div key={i} className="relative pl-4 border-l border-[#f27d26]">
                      <div className="absolute -left-1.5 top-0 w-3 h-3 rotate-45 bg-[#f27d26]"></div>
                      <div className="text-sm font-bold text-slate-400 mb-1">
                         <Editable text={edu.year} onSave={(val) => {
                            const newEdu = [...data.education];
                            newEdu[i].year = val;
                            onUpdate({ education: newEdu });
                         }} />
                      </div>
                      <Editable text={edu.school} className="text-sm font-bold text-slate-700 block" onSave={(val) => {
                         const newEdu = [...data.education];
                         newEdu[i].school = val;
                         onUpdate({ education: newEdu });
                      }} />
                      <Editable text={edu.degree} className="text-xs text-slate-500" onSave={(val) => {
                         const newEdu = [...data.education];
                         newEdu[i].degree = val;
                         onUpdate({ education: newEdu });
                      }} />
                   </div>
                ))}
             </div>
          </section>
       </div>
       <div className="w-[60%] p-10 flex flex-col">
          <div className="flex justify-end mb-12">
             <div className="relative">
                <div className="absolute -top-4 -right-4 w-full h-full border-[10px] border-[#f27d26]/10 rounded-full"></div>
                <div className="w-56 h-56 rounded-full border-[12px] border-white shadow-2xl overflow-hidden bg-slate-100 relative z-10">
                   {data.photo ? (
                      <img src={data.photo} alt="Profile" className="w-full h-full object-cover" />
                   ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                         <Maximize2 size={64} />
                      </div>
                   )}
                </div>
             </div>
          </div>
          <section className="mb-10">
             <h2 className="text-2xl font-black text-slate-800 mb-6">
                <Editable text={data.sections?.experiences || 'Expériences'} onSave={(val) => onUpdate({ sections: { ...data.sections!, experiences: val } })} />
             </h2>
             <div className="space-y-8">
                {data.experiences.map((exp, i) => (
                   <div key={i} className="relative pl-6 border-l border-dashed border-[#f27d26]">
                      <div className="absolute -left-1.5 top-0 w-3 h-3 rotate-45 bg-[#f27d26]"></div>
                      <div className="flex justify-between items-baseline mb-1">
                         <Editable text={exp.company} className="font-bold text-slate-700" onSave={(val) => {
                            const newExp = [...data.experiences];
                            newExp[i].company = val;
                            onUpdate({ experiences: newExp });
                         }} />
                         <div className="text-xs font-bold text-slate-400">
                            <Editable text={exp.startDate} onSave={(val) => {
                               const newExp = [...data.experiences];
                               newExp[i].startDate = val;
                               onUpdate({ experiences: newExp });
                            }} />
                            <span>-</span>
                            <Editable text={exp.endDate} onSave={(val) => {
                               const newExp = [...data.experiences];
                               newExp[i].endDate = val;
                               onUpdate({ experiences: newExp });
                            }} />
                         </div>
                      </div>
                      <Editable text={exp.position} className="text-sm italic text-slate-500 mb-2 block" onSave={(val) => {
                         const newExp = [...data.experiences];
                         newExp[i].position = val;
                         onUpdate({ experiences: newExp });
                      }} />
                      <Editable text={exp.description} multiline className="text-xs text-slate-600 leading-relaxed list-disc list-inside" onSave={(val) => {
                         const newExp = [...data.experiences];
                         newExp[i].description = val;
                         onUpdate({ experiences: newExp });
                      }} />
                   </div>
                ))}
             </div>
          </section>
          <section className="mb-10">
             <h2 className="text-2xl font-black text-slate-800 mb-4">
                <Editable text={data.sections?.skills || 'Compétences'} onSave={(val) => onUpdate({ sections: { ...data.sections!, skills: val } })} />
             </h2>
             <div className="grid grid-cols-1 gap-3">
                {data.skills.map((skill, i) => (
                   <div key={i} className="flex items-center justify-between">
                      <Editable text={skill} className="text-sm text-slate-700" onSave={(val) => {
                         const newSkills = [...data.skills];
                         newSkills[i] = val;
                         onUpdate({ skills: newSkills });
                      }} />
                      <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                         <div className="h-full bg-[#f27d26]" style={{ width: '70%' }}></div>
                      </div>
                   </div>
                ))}
             </div>
          </section>
          <section className="mb-10">
             <h2 className="text-2xl font-black text-slate-800 mb-4">
                <Editable text={data.sections?.references || 'Références'} onSave={(val) => onUpdate({ sections: { ...data.sections!, references: val } })} />
             </h2>
             <Editable 
               text={data.references || ''} 
               multiline 
               className="text-sm text-slate-600 leading-relaxed whitespace-pre-line" 
               onSave={(val) => onUpdate({ references: val })} 
             />
          </section>
          <section>
             <h2 className="text-2xl font-black text-slate-800 mb-4">Langues</h2>
             <div className="grid grid-cols-1 gap-3">
                {['English', 'Chinese', 'Portuguese', 'French'].map((lang, i) => (
                   <div key={i} className="flex items-center justify-between">
                      <span className="text-sm text-slate-700">{lang}</span>
                      <div className="flex space-x-1">
                         {[1, 2, 3, 4, 5].map(dot => (
                            <div key={dot} className={`w-6 h-1.5 rounded-full ${dot <= 4 - i ? 'bg-[#f27d26]' : 'bg-slate-100'}`}></div>
                         ))}
                      </div>
                   </div>
                ))}
             </div>
          </section>
       </div>
    </div>
  </div>
);
