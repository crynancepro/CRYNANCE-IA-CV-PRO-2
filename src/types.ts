import { Type } from "@google/genai";

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  isPremium: boolean;
  modernExpiresAt?: string;
  classicExpiresAt?: string;
  creativeExpiresAt?: string;
  role?: string;
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
  references?: string;
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
  language: 'fr' | 'en';
  template: 'modern' | 'classic' | 'creative' | 'blue' | 'pink' | 'dark' | 'orange';
  isCompact?: boolean;
  jobTitle?: string;
  level?: string;
  sections?: CVSections;
  references?: string;
  website?: string;
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

export interface CoverLetterData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  targetJob: string;
  company: string;
  contractType: string;
  motivation: string;
}

export interface CVScore {
  score: number;
  strengths: string[];
  weaknesses: string[];
  advice: string[];
}
