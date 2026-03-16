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
if (!admin.apps.length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
        databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`
      });
    } else {
      admin.initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || 'crynance-ia-cv-pro-2'
      });
    }
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
  }
}

const db = admin.firestore();

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
    const requestRef = await db.collection('payment_requests').add({
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

// Statut Global
app.get('/api/stats', async (req, res) => {
  try {
    const usersSnap = await db.collection('users').count().get();
    const cvsSnap = await db.collection('cvs').count().get();
    
    res.json({
      totalUsers: usersSnap.data().count,
      totalCvs: cvsSnap.data().count,
      satisfaction: 4.9
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur stats' });
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
