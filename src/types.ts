import { Type } from "@google/genai";

export interface User {
  id: number;
  uid?: string;
  email: string;
  emailVerified?: boolean;
  firstName: string;
  lastName: string;
  phone?: string;
  photoURL?: string;
  isPremium: boolean;
  premiumExpiresAt?: string;
  modernExpiresAt?: string;
  classicExpiresAt?: string;
  creativeExpiresAt?: string;
  optimizationExpiresAt?: string;
  letterExpiresAt?: string;
  analysisExpiresAt?: string;
  role?: string;
  hasOptimizationAccess?: boolean;
  hasLetterAccess?: boolean;
  hasAnalysisAccess?: boolean;
  cvGenerationsRemaining?: number;
  letterGenerationsRemaining?: number;
  optimizationGenerationsRemaining?: number;
  analysisGenerationsRemaining?: number;
  address?: string;
  bio?: string;
  status?: string;
}

export interface CVSections {
  contact: string;
  email: string;
  phone: string;
  address: string;
  skills: string;
  itSkills: string;
  experiences: string;
  education: string;
  qualities: string;
  flaws: string;
  interests: string;
  profile: string;
  divers: string;
  languages: string;
}

export interface CVData {
  id?: string;
  userId?: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  photo?: string;
  profile: string;
  skills: string[];
  itSkills: string[];
  experiences: Experience[];
  education: Education[];
  qualities: string[];
  flaws: string[];
  interests: string[];
  languagesList: LanguageItem[];
  language: 'fr' | 'en';
  template: 'modern' | 'classic' | 'creative' | 'blue' | 'pink' | 'dark' | 'orange' | 'dark-gold' | 'dark-minimal' | 'creative-gradient';
  isCompact?: boolean;
  jobTitle?: string;
  level?: string;
  sections?: CVSections;
  website?: string;
  customSections?: CustomSection[];
  layout?: CVLayout;
}

export interface CVLayout {
  left: string[];
  right: string[];
}

export interface CustomSection {
  id: string;
  title: string;
  content: string;
}

export interface Experience {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface Education {
  school: string;
  degree: string;
  year: string;
}

export interface LanguageItem {
  name: string;
  level: string;
}

export interface CoverLetterData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  targetJob: string;
  company: string;
  companyAddress: string;
  recruiterName?: string;
  jobCity: string;
  contractType: string;
  motivation: string;
}

export interface CVScore {
  score: number;
  strengths: string[];
  weaknesses: string[];
  advice: string[];
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  userId: number;
  paymentId: number;
  amount: number;
  planType: string;
  paymentMethod: string;
  status: string;
  createdAt: string;
  clientName?: string;
  clientEmail?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface Message {
  id: number;
  userId: number;
  senderId: number;
  content: string;
  invoiceId?: number;
  isRead: boolean;
  createdAt: string;
  invoice?: Invoice;
}
