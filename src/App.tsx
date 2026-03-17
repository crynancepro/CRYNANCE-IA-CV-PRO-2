import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';
import Home from './pages/Home';
import CVForm from './pages/CVForm';
import CVPreview from './pages/CVPreview';
import CoverLetterForm from './pages/CoverLetterForm';
import CoverLetterPreview from './pages/CoverLetterPreview';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Premium from './pages/Premium';
import Contact from './pages/Contact';
import AdminDashboard from './pages/AdminDashboard';
import AdminPromo from './pages/AdminPromo';
import AdminReviews from './pages/AdminReviews';
import AdminEmails from './pages/AdminEmails';
import Help from './pages/Help';
import Profile from './pages/Profile';
import Optimization from './pages/Optimization';
import ATSAnalysis from './pages/ATSAnalysis';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-slate-50">
          <div className="no-print">
            <Navbar />
          </div>
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/premium" element={<Premium />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/help" element={<Help />} />
              
              {/* Protected Routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/create-cv" element={
                <ProtectedRoute>
                  <CVForm />
                </ProtectedRoute>
              } />
              <Route path="/cv-preview" element={
                <ProtectedRoute>
                  <CVPreview />
                </ProtectedRoute>
              } />
              <Route path="/cover-letter" element={
                <ProtectedRoute>
                  <CoverLetterForm />
                </ProtectedRoute>
              } />
              <Route path="/cover-letter-preview" element={
                <ProtectedRoute>
                  <CoverLetterPreview />
                </ProtectedRoute>
              } />
              <Route path="/optimization" element={
                <ProtectedRoute>
                  <Optimization />
                </ProtectedRoute>
              } />
              <Route path="/ats-analysis" element={
                <ProtectedRoute>
                  <ATSAnalysis />
                </ProtectedRoute>
              } />

              {/* Admin Routes */}
              <Route path="/admin" element={
                <ProtectedRoute adminOnly>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin/promos" element={
                <ProtectedRoute adminOnly>
                  <AdminPromo />
                </ProtectedRoute>
              } />
              <Route path="/admin/reviews" element={
                <ProtectedRoute adminOnly>
                  <AdminReviews />
                </ProtectedRoute>
              } />
              <Route path="/admin/emails" element={
                <ProtectedRoute adminOnly>
                  <AdminEmails />
                </ProtectedRoute>
              } />
            </Routes>
          </main>
          
          <Footer />
          <WhatsAppButton />
        </div>
      </Router>
    </AuthProvider>
  );
}
