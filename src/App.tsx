import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import CVForm from './pages/CVForm';
import CVPreview from './pages/CVPreview';
import CoverLetterForm from './pages/CoverLetterForm';
import CoverLetterPreview from './pages/CoverLetterPreview';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Premium from './pages/Premium';
import Contact from './pages/Contact';
import AdminDashboard from './pages/AdminDashboard';
import AdminPromo from './pages/AdminPromo';
import Help from './pages/Help';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/create-cv" element={<CVForm />} />
            <Route path="/cv-preview" element={<CVPreview />} />
            <Route path="/cover-letter" element={<CoverLetterForm />} />
            <Route path="/cover-letter-preview" element={<CoverLetterPreview />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/premium" element={<Premium />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/help" element={<Help />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/promos" element={<AdminPromo />} />
          </Routes>
        </main>
        
        <footer className="bg-white border-t border-slate-100 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-slate-500 text-sm">
              © {new Date().getFullYear()} CV IA Pro. Tous droits réservés.
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
}
