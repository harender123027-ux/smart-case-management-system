import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import ComplaintScreen from './screens/ComplaintScreen';
import CaseSearchScreen from './screens/CaseSearchScreen';
import EvidenceScreen from './screens/EvidenceScreen';
import PredictiveScreen from './screens/PredictiveScreen';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import './styles/index.css';

const Layout = ({ children }) => {
  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <main className="content-area">
          {children}
        </main>
      </div>
      <style>{`
        .main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow: hidden;
        }
        .content-area {
          flex: 1;
          overflow-y: auto;
          background: radial-gradient(circle at 50% 0%, #0a1120 0%, #05070a 100%);
        }
      `}</style>
    </div>
  );
};

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  return <Layout>{children}</Layout>;
};

function App() {
  return (
    <AuthProvider>
      <Router basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/" element={
            <ProtectedRoute>
              <DashboardScreen />
            </ProtectedRoute>
          } />
          <Route path="/complaints" element={
            <ProtectedRoute>
              <ComplaintScreen />
            </ProtectedRoute>
          } />
          <Route path="/cases" element={
            <ProtectedRoute>
              <CaseSearchScreen />
            </ProtectedRoute>
          } />
          <Route path="/evidence" element={
            <ProtectedRoute>
              <EvidenceScreen />
            </ProtectedRoute>
          } />
          <Route path="/predictive" element={
            <ProtectedRoute>
              <PredictiveScreen />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
