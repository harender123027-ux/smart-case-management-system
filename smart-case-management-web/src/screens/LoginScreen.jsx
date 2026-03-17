import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/translations';
import { Shield, Lock, User, Globe, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../services/api';

const LoginScreen = () => {
  const { login, language, toggleLanguage } = useAuth();
  const { t } = useTranslation(language);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { username, password });
      const { token, user } = res.data;
      // Store token inside the user object so the api interceptor can read it
      login({ ...user, token, name: user.full_name || user.username });
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed. Please check your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="language-toggle" onClick={toggleLanguage}>
        <Globe size={18} />
        {language === 'en' ? 'हिन्दी' : 'English'}
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="login-card glass"
      >
        <div className="login-header">
          <div className="logo-icon">
            <Shield size={40} color="#3b82f6" fill="rgba(59, 130, 246, 0.2)" />
          </div>
          <h1>{t('loginHeader')}</h1>
          <p>{t('loginSubheader')}</p>
        </div>

        <form onSubmit={handleLogin}>
          {error && (
            <div className="login-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="input-group">
            <label className="input-label">
              <User size={14} style={{ marginRight: 8 }} />
              {t('username')}
            </label>
            <input 
              type="text" 
              className="input-field"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">
              <Lock size={14} style={{ marginRight: 8 }} />
              {t('password')}
            </label>
            <input 
              type="password" 
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 10 }} disabled={loading}>
            {loading ? <div className="login-spinner" /> : null}
            {loading ? 'Authenticating...' : t('loginBtn')}
          </button>
        </form>
      </motion.div>

      <style>{`
        .login-page {
          height: 100vh;
          width: 100vw;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle at center, #0a1120 0%, #05070a 100%);
          position: relative;
          overflow: hidden;
        }

        .login-page::before {
          content: '';
          position: absolute;
          width: 200%;
          height: 200%;
          background: url('https://www.transparenttextures.com/patterns/carbon-fibre.png');
          opacity: 0.05;
          pointer-events: none;
        }

        .language-toggle {
          position: absolute;
          top: 30px;
          right: 30px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.05);
          cursor: pointer;
          font-size: 0.85rem;
          transition: all 0.3s ease;
          border: 1px solid var(--glass-border);
        }

        .language-toggle:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .login-card {
          width: 100%;
          max-width: 420px;
          padding: 40px;
          border-radius: 24px;
        }

        .login-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .logo-icon {
          margin-bottom: 20px;
          display: flex;
          justify-content: center;
        }

        .login-header h1 {
          font-size: 1.75rem;
          margin-bottom: 10px;
          background: linear-gradient(135deg, #fff 0%, #94a3b8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .login-header p {
          color: var(--text-muted);
          font-size: 0.95rem;
        }

        .login-error {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 12px;
          color: #ef4444;
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 20px;
        }

        .login-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          display: inline-block;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoginScreen;
