import { GoogleGenAI, Type } from "@google/genai";
import { CVData, CVScore, CoverLetterData } from "../types";

const getApiKey = () => {
  const viteKey = import.meta.env.VITE_GEMINI_API_KEY;
  let processKey = "";
  try {
    processKey = process.env.GEMINI_API_KEY || "";
  } catch (e) {
    // process is not defined
  }
  
  let key = (viteKey as string) || processKey || "";
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

const safeJsonParse = (text: string) => {
  try {
    // Nettoyage des balises markdown si présentes
    let cleaned = text.trim();
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.replace(/^```json/, "").replace(/```$/, "").trim();
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```/, "").replace(/```$/, "").trim();
    }
    return JSON.parse(cleaned);
  } catch (e: any) {
    console.error("JSON Parse Error. Text length:", text.length);
    console.error("Text end:", text.substring(Math.max(0, text.length - 200)));
    
    // Tentative de réparation basique si c'est tronqué (optionnel et risqué, mais on peut au moins donner un meilleur message)
    if (e.message.includes("Unterminated string") || e.message.includes("Unexpected end of JSON input")) {
      throw new Error("La réponse de l'IA a été tronquée car elle était trop longue. Essayez de réduire le contenu de votre CV ou de demander des modifications plus spécifiques.");
    }
    
    throw new Error("Erreur de format de réponse de l'IA. Veuillez réessayer.");
  }
};

export const generateProfessionalCV = async (data: CVData): Promise<CVData> => {
  const ai = getAI();
  if (!ai) {
    throw new Error("Clé API manquante ou invalide");
  }
  
  const modelName = "gemini-3-flash-preview";
  
  const dataWithoutPhoto = { ...data };
  delete dataWithoutPhoto.photo;

  const prompt = `Tu es un expert en recrutement international. Ta mission est d'optimiser ce CV pour qu'il soit extrêmement percutant, professionnel et surtout CONCIS.
  
  OBJECTIF : Le CV doit impérativement tenir sur UNE SEULE PAGE A4.
  
  RÈGLES DE RÉDACTION :
  1. CONCISION EXTRÊME : Utilise des phrases courtes, simples et directes. Supprime tout verbiage ou répétition.
  2. PROFIL : Rédige une accroche percutante de MAXIMUM 2 lignes. ${data.template === 'creative' ? 'Comme le style est "CRÉATIF ARTISTE", adopte un ton plus inspirant, original et audacieux pour le profil.' : ''}
  3. EXPÉRIENCES : Pour chaque expérience, limite la description à 3-4 puces (bullet points) maximum. Chaque puce doit être courte et orientée résultats.
  4. COMPÉTENCES : Sélectionne les 6 compétences les plus pertinentes pour le poste.
  5. QUALITÉS & DÉFAUTS : Liste 3 qualités et 2 défauts professionnels (non rédhibitoires).
  6. PAS D'INVENTION INUTILE : Optimise et valorise les données fournies par l'utilisateur. Si une section est vraiment vide, complète-la avec du contenu standard et réaliste pour le métier visé (${data.jobTitle || 'Professionnel'}), mais reste minimaliste.
  7. MISE EN PAGE : Le contenu doit être structuré pour une lecture rapide (scannabilité).
  8. VÉRIFICATION : Assure-tu que TOUTES les sections suivantes sont présentes et remplies : profil, compétences, informatique, expériences, formation, qualités, défauts, centres d'intérêt.
  
  Langue: Français (IMPÉRATIF : Tout le contenu doit être en français. Si des données d'entrée sont en anglais ou une autre langue, traduis-les systématiquement en français professionnel).
  
  Données de l'utilisateur : ${JSON.stringify(dataWithoutPhoto)}`;

  try {
    console.log(`Calling Gemini API with model: ${modelName}...`);
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        systemInstruction: "Tu es un expert en recrutement international. Tu optimises des CV pour qu'ils soient percutants et concis (1 page A4). Tu réponds exclusivement en JSON valide. Tu dois impérativement inclure TOUTES les sections demandées dans le schéma.",
        responseMimeType: "application/json",
        maxOutputTokens: 8192,
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

    const generated = safeJsonParse(response.text);
    return { ...data, ...generated };
  } catch (error: any) {
    console.error("Gemini CV Generation Error:", error);
    throw new Error(error.message || "Erreur lors de la génération du CV");
  }
};

export const modifyCVWithAI = async (data: CVData, instruction: string): Promise<CVData> => {
  const ai = getAI();
  if (!ai) {
    throw new Error("Clé API manquante ou invalide");
  }
  
  const modelName = "gemini-3-flash-preview";
  
  const dataWithoutPhoto = { ...data };
  delete dataWithoutPhoto.photo;

  const prompt = `Tu es un expert en rédaction de CV. Ta tâche est de modifier le CV existant en suivant l'instruction de l'utilisateur.
  
  INSTRUCTION DE L'UTILISATEUR : "${instruction}"
  
  RÈGLES :
  1. Applique la modification demandée de manière intelligente et professionnelle.
  2. NE SUPPRIME PAS les informations existantes sauf si l'instruction le demande explicitement.
  3. Garde le ton professionnel et concis. ${data.template === 'creative' ? 'Comme le style est "CRÉATIF ARTISTE", garde un ton inspirant et original.' : ''}
  4. Si l'utilisateur demande d'ajouter une section qui n'existe pas dans le schéma standard (comme "Certifications"), essaie de l'intégrer intelligemment dans les champs existants (par exemple, ajoute-la à la fin du profil ou dans les centres d'intérêt si approprié, ou modifie le champ 'profile' pour inclure ces nouvelles informations).
  5. Retourne l'intégralité de l'objet CV mis à jour.
  6. VÉRIFICATION : Assure-tu que TOUTES les sections recommandées sont présentes dans l'objet final (profil, compétences, informatique, expériences, formation, qualités, défauts, centres d'intérêt).
  
  CV ACTUEL : ${JSON.stringify(dataWithoutPhoto)}`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        systemInstruction: "Tu es un expert en rédaction de CV. Tu modifies le CV selon les instructions de l'utilisateur et tu retournes l'objet complet en JSON valide. Tu dois impérativement inclure TOUTES les sections recommandées.",
        responseMimeType: "application/json",
        maxOutputTokens: 8192,
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
            jobTitle: { type: Type.STRING },
            firstName: { type: Type.STRING },
            lastName: { type: Type.STRING },
            email: { type: Type.STRING },
            phone: { type: Type.STRING },
            customSections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  content: { type: Type.STRING },
                },
                required: ["title", "content"]
              }
            }
          },
          required: ["profile", "skills", "itSkills", "experiences", "education", "qualities", "flaws", "interests"]
        }
      }
    });

    if (!response || !response.text) {
      throw new Error("Réponse vide de l'IA");
    }

    const generated = safeJsonParse(response.text);
    return { ...data, ...generated };
  } catch (error: any) {
    console.error("Gemini CV Modification Error:", error);
    throw new Error(error.message || "Erreur lors de la modification du CV");
  }
};

export const optimizeCVForJobOffer = async (data: CVData, jobOffer: string): Promise<CVData> => {
  const ai = getAI();
  if (!ai) {
    throw new Error("Clé API manquante ou invalide");
  }
  
  const modelName = "gemini-3-flash-preview";
  
  const dataWithoutPhoto = { ...data };
  delete dataWithoutPhoto.photo;

  const prompt = `Tu es un expert en recrutement et optimisation ATS. Ta mission est d'adapter ce CV spécifiquement pour l'offre d'emploi suivante.
  
  OFFRE D'EMPLOI :
  "${jobOffer}"
  
  RÈGLES D'OPTIMISATION :
  1. MOTS-CLÉS ATS : Identifie les mots-clés, compétences techniques et soft skills essentiels dans l'offre d'emploi et intègre-les naturellement dans le CV.
  2. PROFIL : Réécris l'accroche pour qu'elle réponde directement aux besoins de l'entreprise mentionnés dans l'offre.
  3. COMPÉTENCES : Réorganise et mets en avant les compétences les plus demandées par l'offre.
  4. EXPÉRIENCES : Reformule les descriptions pour mettre l'accent sur les réalisations qui prouvent que le candidat possède les compétences requises.
  5. CONCISION : Garde le CV sur une seule page.
  6. RÉPONSE : Retourne l'objet CV complet mis à jour en JSON valide.
  
  CV ACTUEL : ${JSON.stringify(dataWithoutPhoto)}`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        systemInstruction: "Tu es un expert en optimisation de CV pour les systèmes ATS. Tu adaptes le CV à une offre d'emploi spécifique et tu retournes l'objet complet en JSON valide.",
        responseMimeType: "application/json",
        maxOutputTokens: 8192,
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
            jobTitle: { type: Type.STRING },
          },
          required: ["profile", "skills", "itSkills", "experiences", "education", "qualities", "flaws", "interests"]
        }
      }
    });

    if (!response || !response.text) {
      throw new Error("Réponse vide de l'IA");
    }

    const generated = safeJsonParse(response.text);
    return { ...data, ...generated };
  } catch (error: any) {
    console.error("Gemini CV Optimization Error:", error);
    throw new Error(error.message || "Erreur lors de l'optimisation du CV");
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
        systemInstruction: "Tu es un expert en recrutement. Tu analyses les CV et fournis un score et des conseils en JSON valide.",
        responseMimeType: "application/json",
        maxOutputTokens: 2048,
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
    return safeJsonParse(response.text);
  } catch (error: any) {
    console.error("Gemini CV Scoring Error:", error);
    throw new Error(error.message || "Erreur de scoring");
  }
};

export const generateCoverLetter = async (cvData: CVData, letterData: CoverLetterData): Promise<string> => {
  const ai = getAI();
  if (!ai) {
    throw new Error("Clé API manquante");
  }
  const modelName = "gemini-3-flash-preview";
  
  const prompt = `Tu es un expert en recrutement. Ta mission est de rédiger une lettre de motivation professionnelle, percutante et personnalisée pour le site CRYNANCE IA CV PRO 2.

### INSTRUCTIONS CRITIQUES :
- GÉNÈRE UNIQUEMENT LA LETTRE FINALE.
- NE PAS AJOUTER D'EXPLICATION AVANT OU APRÈS LA LETTRE.
- NE PAS DONNER TON AVIS OU COMMENTER LA QUALITÉ DE LA LETTRE.
- NE PAS DONNER DE CONSEILS.
- LA RÉPONSE DOIT ÊTRE DIRECTEMENT LA LETTRE PRÊTE À UTILISER.

### STRUCTURE OBLIGATOIRE DE LA LETTRE :

1. Informations du candidat (en haut à gauche) :
${letterData.lastName} ${letterData.firstName}
${letterData.address}
${letterData.phone}
${letterData.email}

2. Informations de l'entreprise (un peu plus bas à droite) :
${letterData.company}
${letterData.recruiterName ? `À l'attention de ${letterData.recruiterName}` : 'À l\'attention du Responsable du Recrutement'}
${letterData.companyAddress}

3. Date et lieu :
Fait à ${letterData.jobCity}, le ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}

4. Objet :
Objet : Candidature au poste de ${letterData.targetJob} en ${letterData.contractType}

5. Corps de la lettre (3 paragraphes maximum) :
- Paragraphe 1 : Présentation du candidat et accroche.
- Paragraphe 2 : Compétences et expériences clés en lien avec le poste (utilise les infos du CV si disponibles).
- Paragraphe 3 : Motivation spécifique pour rejoindre l'entreprise et proposition d'entretien.

6. Formule de politesse finale :
"Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées."

7. Signature :
${letterData.firstName} ${letterData.lastName}

### CONTEXTE SUPPLÉMENTAIRE :
- Profil du candidat : ${cvData.profile}
- Expériences clés : ${JSON.stringify(cvData.experiences.slice(0, 3))}
- Motivations spécifiques de l'utilisateur : ${letterData.motivation || 'Non spécifié'}

Langue : Français professionnel.`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        systemInstruction: "Tu es un expert en recrutement. Tu rédiges des lettres de motivation professionnelles. Tu génères UNIQUEMENT la lettre, sans aucun autre texte.",
        maxOutputTokens: 2048,
      }
    });

    return response.text || "";
  } catch (error: any) {
    console.error("Gemini Cover Letter Error:", error);
    throw new Error(error.message || "Erreur de génération de lettre");
  }
};

export const parseCVFromFile = async (base64Data: string, mimeType: string): Promise<CVData> => {
  const ai = getAI();
  if (!ai) {
    throw new Error("Clé API manquante");
  }
  const modelName = "gemini-3-flash-preview";
  
  const prompt = `Analyse ce fichier (PDF, Word ou Image) et extrais toutes les informations pour remplir un CV professionnel.
  
  RÈGLES :
  1. Extraits le nom, prénom, email, téléphone, titre du poste.
  2. Extraits le profil professionnel.
  3. Extraits les compétences techniques et informatiques.
  4. Extraits toutes les expériences professionnelles (entreprise, poste, dates, description).
  5. Extraits les formations (école, diplôme, année).
  6. Extraits les centres d'intérêt.
  7. Si des informations sont manquantes, laisse les champs vides ou mets des valeurs par défaut cohérentes.
  8. Réponds UNIQUEMENT en JSON valide selon le schéma fourni.`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        { text: prompt },
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        }
      ],
      config: {
        systemInstruction: "Tu es un expert en analyse de documents. Tu extrais les données de CV à partir de fichiers et tu les retournes en JSON valide.",
        responseMimeType: "application/json",
        maxOutputTokens: 8192,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            firstName: { type: Type.STRING },
            lastName: { type: Type.STRING },
            email: { type: Type.STRING },
            phone: { type: Type.STRING },
            jobTitle: { type: Type.STRING },
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
            interests: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["firstName", "lastName", "email", "phone", "jobTitle", "profile", "skills", "itSkills", "experiences", "education", "interests"]
        }
      }
    });

    if (!response || !response.text) throw new Error("Réponse vide");
    const parsed = safeJsonParse(response.text);
    return {
      ...parsed,
      template: 'modern',
      color: '#0f172a',
      qualities: [],
      flaws: [],
      customSections: []
    } as CVData;
  } catch (error: any) {
    console.error("Gemini CV Parsing Error:", error);
    throw new Error(error.message || "Erreur lors de l'analyse du fichier");
  }
};
