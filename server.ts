import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Initialize Firebase Admin
let db: admin.firestore.Firestore;

try {
  if (!admin.apps.length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://${process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id}.firebaseio.com`
      });
      console.log('Firebase Admin initialized with service account');
    } else {
      // On Vercel, this will fail if not configured correctly, so we log a warning
      console.warn('FIREBASE_SERVICE_ACCOUNT is missing. Attempting default initialization...');
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || 'crynance-ia-cv-pro-2'
      });
    }
  }
  db = admin.firestore();
} catch (error) {
  console.error('CRITICAL: Firebase Admin initialization failed:', error);
  // We still want the app to start but routes using db will fail with a clear error
}

export { db };

// Configuration CORS
app.use(cors({
  origin: [
    'https://crynance-seven.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
}));

app.use(express.json());

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// IA Consumption Route
app.post('/api/ia/consume', async (req, res) => {
  const { type, userId } = req.body;
  
  if (!userId) {
    return res.status(401).json({ error: 'ID utilisateur manquant' });
  }

  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const userData = userDoc.data();
    const field = type === 'cv' ? 'cvGenerationsRemaining' : 'letterGenerationsRemaining';
    const current = userData?.[field] || 0;

    if (current > 0) {
      await userRef.update({ [field]: current - 1 });
      return res.json({ success: true, remaining: current - 1 });
    } else {
      return res.status(403).json({ error: "Vous n'avez plus de crédits de génération." });
    }
  } catch (error) {
    console.error('IA Consume error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Payment Request Route
app.post('/api/payment/request', async (req, res) => {
  const { type, amount, userId, userEmail } = req.body;

  if (!userId) {
    return res.status(401).json({ error: 'ID utilisateur manquant' });
  }

  try {
    const requestRef = await db.collection('demandes de paiement').add({
      userId,
      userEmail,
      type,
      amount,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ success: true, requestId: requestRef.id });
  } catch (error) {
    console.error('Payment request error:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

// Statut Global (Public)
app.get('/api/statistiques', async (req, res) => {
  try {
    const usersSnap = await db.collection('users').count().get();
    const cvsSnap = await db.collection('cvs').count().get();
    
    res.json({
      totalUsers: usersSnap.data().count + 3200, // Base + Real
      totalCvs: cvsSnap.data().count + 12450,   // Base + Real
      satisfaction: 4.9
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Erreur stats' });
  }
});

// Middleware pour vérifier si l'utilisateur est admin
const isAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Non authentifié' });
  }

  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    if (decodedToken.email === 'peter25ngouala@gmail.com') {
      next();
    } else {
      // Vérifier aussi dans Firestore si le rôle est admin
      const userDoc = await db.collection('users').doc(decodedToken.uid).get();
      if (userDoc.exists && userDoc.data()?.role === 'admin') {
        next();
      } else {
        res.status(403).json({ error: 'Accès refusé : Droits administrateur requis' });
      }
    }
  } catch (error) {
    console.error('Admin verification error:', error);
    res.status(401).json({ error: 'Token invalide' });
  }
};

// Route pour confirmer un paiement (Admin seulement)
app.post('/api/admin/confirm-payment', isAdmin, async (req, res) => {
  const { paymentId } = req.body;

  if (!paymentId) {
    return res.status(400).json({ error: 'ID de paiement manquant' });
  }

  try {
    const paymentRef = db.collection('demandes de paiement').doc(paymentId);
    const paymentDoc = await paymentRef.get();

    if (!paymentDoc.exists) {
      return res.status(404).json({ error: 'Demande de paiement non trouvée' });
    }

    const paymentData = paymentDoc.data();
    if (paymentData?.status === 'confirmed') {
      return res.status(400).json({ error: 'Paiement déjà confirmé' });
    }

    const userId = paymentData?.userId;
    const planType = paymentData?.type; // 'monthly' or 'yearly'

    // 1. Mettre à jour le statut du paiement
    await paymentRef.update({
      status: 'confirmed',
      confirmedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // 2. Mettre à jour les crédits et le statut de l'utilisateur
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    const expirationDate = new Date();
    if (planType === 'yearly') {
      expirationDate.setFullYear(expirationDate.getFullYear() + 1);
    } else {
      expirationDate.setMonth(expirationDate.getMonth() + 1);
    }

    const updates: any = {
      isPremium: true,
      role: 'premium',
      premiumExpiresAt: expirationDate.toISOString(),
      // Ajouter des crédits généreux pour le premium
      cvGenerationsRemaining: admin.firestore.FieldValue.increment(50),
      letterGenerationsRemaining: admin.firestore.FieldValue.increment(50)
    };

    await userRef.update(updates);

    res.json({ success: true, message: 'Paiement confirmé et crédits ajoutés' });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ error: 'Erreur lors de la confirmation du paiement' });
  }
});

// Export pour Vercel
export default app;

// Développement local
if (process.env.NODE_ENV !== 'production') {
  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
