import React from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Invoice } from '../types';

interface InvoicePDFProps {
  invoice: Invoice;
  onClose: () => void;
}

export const InvoicePDF: React.FC<InvoicePDFProps> = ({ invoice, onClose }) => {
  const downloadPDF = async () => {
    const element = document.getElementById('invoice-content');
    if (!element) return;

    // Set a fixed width for the capture to ensure consistent A4 proportions
    const originalWidth = element.style.width;
    element.style.width = '800px';

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });
    
    element.style.width = originalWidth;

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    // If the content is longer than A4, it will be scaled down to fit
    const finalHeight = pdfHeight > 297 ? 297 : pdfHeight;
    const finalWidth = pdfHeight > 297 ? (canvas.width * 297) / canvas.height : pdfWidth;
    const xOffset = (pdfWidth - finalWidth) / 2;

    pdf.addImage(imgData, 'PNG', xOffset, 0, finalWidth, finalHeight);
    pdf.save(`Facture-${invoice.invoiceNumber}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h2 className="text-lg font-bold text-slate-900">Aperçu de la Facture</h2>
          <div className="flex items-center space-x-2">
            <button 
              onClick={downloadPDF}
              className="bg-primary text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
            >
              Télécharger PDF
            </button>
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-2"
            >
              Fermer
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto bg-slate-200 p-8 flex justify-center">
          <div 
            className="bg-white shadow-lg p-10 w-[800px] min-h-[1131px] relative" 
            id="invoice-content"
            style={{ pageBreakInside: 'avoid' }}
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-8 border-b-2 border-primary pb-6">
              <div>
                <h1 className="text-[20px] font-black text-primary leading-none mb-2">CRYNANCE IA CV PRO 2</h1>
                <p className="text-slate-500 text-[11px] font-medium">Générateur de CV et Lettres de motivation IA</p>
                <p className="text-slate-500 text-[10px]">Sénégal / Côte d'Ivoire</p>
              </div>
              <div className="text-right">
                <h2 className="text-[24px] font-black text-slate-900 uppercase tracking-tighter leading-none mb-1">FACTURE</h2>
                <p className="text-primary font-bold text-[14px]">N° {invoice.invoiceNumber}</p>
                <p className="text-slate-500 text-[11px] mt-1">Date: {invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString() : 'Date inconnue'}</p>
              </div>
            </div>

            {/* Info Sections */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-widest mb-2">Détails du Client</h3>
                <p className="font-bold text-slate-900 text-[13px]">{invoice.clientName || invoice.firstName + ' ' + invoice.lastName || 'Utilisateur'}</p>
                <p className="text-slate-600 text-[11px]">{invoice.clientEmail || invoice.email}</p>
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Méthode de paiement</p>
                  <p className="text-[11px] font-bold text-slate-700">{invoice.paymentMethod || 'Wave'}</p>
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-widest mb-2">Résumé de l'Abonnement</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">Plan:</span>
                    <span className="font-bold text-slate-900 capitalize">{invoice.planType}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">Durée:</span>
                    <span className="font-bold text-slate-900">24 Heures</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">Statut:</span>
                    <span className="text-emerald-600 font-black uppercase">PAYÉ</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="mb-8">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-primary text-white">
                    <th className="text-left p-3 text-[11px] font-bold uppercase rounded-tl-lg">Service / Description</th>
                    <th className="text-center p-3 text-[11px] font-bold uppercase">Prix Unitaire</th>
                    <th className="text-center p-3 text-[11px] font-bold uppercase">Durée</th>
                    <th className="text-right p-3 text-[11px] font-bold uppercase rounded-tr-lg">Total</th>
                  </tr>
                </thead>
                <tbody className="border-x border-b border-slate-200">
                  <tr className="border-b border-slate-100">
                    <td className="p-4">
                      <p className="font-bold text-slate-900 text-[12px]">Abonnement Premium {invoice.planType.charAt(0).toUpperCase() + invoice.planType.slice(1)}</p>
                      <p className="text-slate-500 text-[10px] mt-1">Accès illimité aux modèles et outils IA pendant 24h</p>
                    </td>
                    <td className="p-4 text-center font-bold text-slate-700 text-[11px]">{invoice.amount} FCFA</td>
                    <td className="p-4 text-center font-bold text-slate-700 text-[11px]">24h</td>
                    <td className="p-4 text-right font-black text-primary text-[12px]">{invoice.amount} FCFA</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end mb-12">
              <div className="w-64 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex justify-between text-[11px] text-slate-500 mb-2">
                  <span>Sous-total</span>
                  <span className="font-bold text-slate-900">{invoice.amount} FCFA</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 mb-2">
                  <span>TVA (0%)</span>
                  <span className="font-bold text-slate-900">0 FCFA</span>
                </div>
                <div className="pt-2 border-t border-slate-300 flex justify-between items-center">
                  <span className="text-[13px] font-black text-slate-900">TOTAL</span>
                  <span className="text-[18px] font-black text-primary">{invoice.amount} FCFA</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-10 left-10 right-10">
              <div className="pt-6 border-t border-slate-200 text-center">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">
                  Merci de votre confiance !
                </p>
                <p className="text-slate-300 text-[9px] italic">
                  "Facture générée automatiquement par CRYNANCE IA CV PRO 2"
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
