import { GoogleGenAI, Type } from "@google/genai";
import { CVData, CVScore } from "../types";

const getApiKey = () => {
  const viteKey = import.meta.env.VITE_GEMINI_API_KEY;
  const processKey = process.env.GEMINI_API_KEY;
  
  let key = (viteKey as string) || (processKey as string) || "";
  key = key.trim();
  
  if (!key || key === "undefined" || key === "null") {
    console.error("Gemini API Key: ABSENTE ou invalide (valeur: " + key + "). Vérifiez Netlify.");
    return "";
  } else {
    console.log("Gemini API Key: Détectée (Longueur: " + key.length + ")");
    if (!key.startsWith("AIza")) {
      console.warn("Gemini API Key: Format inhabituel (ne commence pas par 'AIza'). Vérifiez votre clé dans Netlify.");
    }
  }
  return key;
};

const getAI = () => {
  const apiKey = getApiKey();
  if (!apiKey) return null;
  try {
    return new GoogleGenAI({ apiKey });
  } catch (e) {
    console.error("Error initializing GoogleGenAI:", e);
    return null;
  }
};

export const generateProfessionalCV = async (data: CVData): Promise<CVData> => {
  const ai = getAI();
  if (!ai) {
    throw new Error("Clé API manquante ou invalide");
  }
  
  const modelName = "gemini-3-flash-preview"; // Use recommended model
  
  const prompt = `Tu es un expert en recrutement international. Ta mission est d'optimiser ce CV pour qu'il soit extrêmement percutant, professionnel et surtout CONCIS.
  
  OBJECTIF : Le CV doit impérativement tenir sur UNE SEULE PAGE A4.
  
  RÈGLES DE RÉDACTION :
  1. CONCISION EXTRÊME : Utilise des phrases courtes, simples et directes. Supprime tout verbiage ou répétition.
  2. PROFIL : Rédige une accroche percutante de MAXIMUM 2 lignes.
  3. EXPÉRIENCES : Pour chaque expérience, limite la description à 3-4 puces (bullet points) maximum. Chaque puce doit être courte et orientée résultats.
  4. COMPÉTENCES : Sélectionne les 6 compétences les plus pertinentes pour le poste.
  5. QUALITÉS & DÉFAUTS : Liste 3 qualités et 2 défauts professionnels (non rédhibitoires).
  6. PAS D'INVENTION INUTILE : Optimise et valorise les données fournies par l'utilisateur. Si une section est vraiment vide, complète-la avec du contenu standard et réaliste pour le métier visé (${data.jobTitle || 'Professionnel'}), mais reste minimaliste.
  7. MISE EN PAGE : Le contenu doit être structuré pour une lecture rapide (scannabilité).
  
  Langue: ${data.language === 'fr' ? 'Français' : 'Anglais'}.
  
  Données de l'utilisateur : ${JSON.stringify(data)}`;

  try {
    console.log(`Calling Gemini API with model: ${modelName}...`);
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            profile: { type: Type.STRING },
            skills: { type: Type.ARRAY, items: { type: Type.STRING } },
            itSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
            experiences: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  company: { type: Type.STRING },
                  position: { type: Type.STRING },
                  startDate: { type: Type.STRING },
                  endDate: { type: Type.STRING },
                  description: { type: Type.STRING },
                },
                required: ["company", "position", "startDate", "endDate", "description"]
              }
            },
            education: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  school: { type: Type.STRING },
                  degree: { type: Type.STRING },
                  year: { type: Type.STRING },
                },
                required: ["school", "degree", "year"]
              }
            },
            qualities: { type: Type.ARRAY, items: { type: Type.STRING } },
            flaws: { type: Type.ARRAY, items: { type: Type.STRING } },
            interests: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["profile", "skills", "itSkills", "experiences", "education", "qualities", "flaws", "interests"]
        }
      }
    });

    if (!response || !response.text) {
      throw new Error("Réponse vide de l'IA");
    }

    const generated = JSON.parse(response.text);
    return { ...data, ...generated };
  } catch (error: any) {
    console.error("Gemini CV Generation Full Error:", error);
    // Extract more details if available
    const details = error.response?.data?.error?.message || error.message || JSON.stringify(error);
    throw new Error(details);
  }
};

export const scoreCV = async (data: CVData): Promise<CVScore> => {
  const ai = getAI();
  if (!ai) {
    throw new Error("Clé API manquante");
  }
  const modelName = "gemini-3-flash-preview";
  const prompt = `Analyse ce CV et donne un score sur 100, ainsi que les points forts, points faibles et conseils d'amélioration.
  CV: ${JSON.stringify(data)}`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
            advice: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["score", "strengths", "weaknesses", "advice"]
        }
      }
    });

    if (!response || !response.text) throw new Error("Réponse vide");
    return JSON.parse(response.text);
  } catch (error: any) {
    console.error("Gemini CV Scoring Error:", error);
    throw new Error(error.message || "Erreur de scoring");
  }
};

export const generateCoverLetter = async (cvData: CVData, letterData: any): Promise<string> => {
  const ai = getAI();
  if (!ai) {
    throw new Error("Clé API manquante");
  }
  const modelName = "gemini-3-flash-preview";
  const prompt = `Tu es un expert en recrutement. Rédige une lettre de motivation professionnelle, percutante et personnalisée.
  
  CONTEXTE :
  - Candidat : ${cvData.firstName} ${cvData.lastName}
  - Poste visé : ${letterData.targetJob}
  - Entreprise : ${letterData.company}
  - Type de contrat : ${letterData.contractType}
  - Motivations spécifiques : ${letterData.motivation || 'Non spécifié'}
  - Profil du candidat : ${cvData.profile}
  - Expériences clés : ${JSON.stringify(cvData.experiences.slice(0, 2))}
  
  CONSIGNES :
  1. Utilise un ton professionnel, enthousiaste et convaincant.
  2. Structure la lettre : En-tête, Objet, Introduction (pourquoi j'écris), Présentation (qui je suis), Motivation (pourquoi vous), Conclusion (appel à l'action).
  3. Fais le lien entre les compétences du candidat et les besoins de l'entreprise.
  4. La lettre doit être prête à l'emploi, sans [TEXTE À REMPLIR] si possible, sauf pour la date.
  5. Langue: ${cvData.language === 'fr' ? 'Français' : 'Anglais'}.`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
    });

    return response.text || "";
  } catch (error: any) {
    console.error("Gemini Cover Letter Error:", error);
    throw new Error(error.message || "Erreur de génération de lettre");
  }
};
