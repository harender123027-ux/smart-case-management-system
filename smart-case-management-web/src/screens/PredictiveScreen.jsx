import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/translations';
import api from '../services/api';
import { 
  Bot, 
  Zap, 
  BarChart3, 
  MapPin, 
  AlertTriangle, 
  ChevronRight,
  Sparkles,
  TrendingUp,
  BrainCircuit,
  ShieldIcon,
  Book,
  Upload,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PredictiveScreen = () => {
  const { language } = useAuth();
  const { t } = useTranslation(language);
  const [insights, setInsights] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [suggestFile, setSuggestFile] = useState(null);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestResult, setSuggestResult] = useState('');

  const runAnalysis = async () => {
    setLoading(true);
    setInsights('');
    try {
      const res = await api.post('/ai/predictive', { language });
      setInsights(res.data.insights || 'No insights generated.');
      setData(res.data.data);
    } catch (err) {
      console.error('Analysis error:', err);
      alert('AI Analysis failed. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestFile = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSuggestFile(e.target.files[0]);
    }
  };

  const runActSuggestion = async () => {
    if (!suggestFile) return;
    setSuggestLoading(true);
    setSuggestResult('');
    try {
      const formData = new FormData();
      formData.append('file', suggestFile);
      const res = await api.post('/ai/analyze-legal-pdf', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuggestResult(res.data.analysis || 'No acts suggested.');
    } catch (err) {
      console.error('Act suggestion error:', err);
      alert('Act suggestion failed. Please try again.');
    } finally {
      setSuggestLoading(false);
    }
  };

  return (
    <div className="predictive-container">
      <header className="page-header">
        <div className="header-text">
          <h1>{t('predictivePolicing')}</h1>
          <p>AI-Driven Strategic Intelligence & Crime Forecasting</p>
        </div>
        <div className="breadcrumb">
          <span>{t('dashboard')}</span>
          <ChevronRight size={14} />
          <span className="active">{t('predictive')}</span>
        </div>
      </header>

      <div className="predictive-workspace">
        <div className="intelligence-overview glass">
          <div className="intel-card">
            <div className="intel-icon" style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}>
              <BrainCircuit size={24} />
            </div>
            <div className="intel-content">
              <h3>Gemini Neural Engine</h3>
              <p>Analyzing cross-referenced data from last 90 days of criminal activities and patterns.</p>
            </div>
          </div>
          
          <button 
            className={`btn btn-primary run-intel-btn ${loading ? 'loading' : ''}`}
            onClick={runAnalysis}
            disabled={loading}
          >
            {loading ? <div className="spinner-small" /> : <Sparkles size={18} />}
            {loading ? 'Processing Intelligence...' : 'Generate New Forecast'}
          </button>
        </div>

        <div className="predictive-grid">
          <section className="predictive-main">
            <AnimatePresence mode="wait">
              {data ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  key="results"
                  className="results-container"
                >
                  <div className="section-group">
                    <div className="section-header">
                      <TrendingUp size={20} color="#a855f7" />
                      <h2>Strategic Trend Analysis</h2>
                    </div>
                    <div className="trend-grid">
                      {data.case_trends?.map((trend, idx) => (
                        <div key={idx} className="trend-card glass">
                          <div className="trend-top">
                            <span className="case-type">{trend.case_type}</span>
                            <span className="trend-stat">{trend.count} Events</span>
                          </div>
                          <div className="pattern-bar-container">
                             <div className="pattern-bar" style={{ width: `${Math.min((trend.count / 10) * 100, 100)}%`, backgroundColor: '#a855f7' }}></div>
                          </div>
                          {trend.location && (
                            <div className="trend-loc">
                              <MapPin size={12} />
                              <span>Hotspot: {trend.location}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="section-group">
                    <div className="section-header">
                      <AlertTriangle size={20} color="#ef4444" />
                      <h2>Emergent Risk Localities</h2>
                    </div>
                    <div className="hotspot-list">
                      {data.recent_complaints?.map((h, i) => (
                        <div key={i} className="hotspot-item glass">
                          <div className="h-info">
                            <strong>{h.complaint_type}</strong>
                            <span>{h.location}</span>
                          </div>
                          <div className="h-risk">
                            <div className="risk-level high"></div>
                            <span>{h.count} Reports</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  key="placeholder"
                  className="placeholder-state glass"
                >
                  <Bot size={64} className="bot-icon" />
                  <h2>Intelligence Engine Standby</h2>
                  <p>Awaiting command to process the collective database for pattern recognition and proactive policing insights.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          <aside className="predictive-sidebar">
            <div className="legal-act-card glass" style={{ marginBottom: '24px' }}>
              <div className="card-header">
                <Book size={18} color="#3b82f6" />
                <h3>Legal Act Intelligence</h3>
              </div>
              
              <div className="act-downloads">
                <p className="section-subtitle">Official Reference Docs</p>
                <div className="download-buttons">
                  <a href="/BNS.pdf" download className="act-btn">BNS</a>
                  <a href="/BNSS.pdf" download className="act-btn">BNSS</a>
                  <a href="/BSA.pdf" download className="act-btn">BSA</a>
                </div>
              </div>

              <div className="act-suggestion">
                <p className="section-subtitle">Suggest Acts from Case</p>
                <label className="upload-btn-small">
                  <Upload size={16} />
                  <span>{suggestFile ? suggestFile.name : 'Upload FIR/Case PDF'}</span>
                  <input type="file" hidden accept=".pdf" onChange={handleSuggestFile} />
                </label>
                <button 
                  className="btn btn-primary run-suggest-btn" 
                  onClick={runActSuggestion}
                  disabled={suggestLoading || !suggestFile}
                >
                  {suggestLoading ? <div className="spinner-small" /> : 'Suggest Applicable Acts'}
                </button>
              </div>

              <AnimatePresence>
                {suggestResult && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="suggest-result"
                  >
                    <FileText size={16} color="#3b82f6" />
                    <p>{suggestResult}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="insight-card glass">
              <div className="card-header">
                <Zap size={18} color="#f59e0b" />
                <h3>AI Strategic Insights</h3>
              </div>
              <div className="insight-body">
                {insights ? (
                  <p className="insight-text">{insights}</p>
                ) : (
                  <div className="insight-empty">
                    <ShieldIcon size={32} />
                    <p>Run forecast to populate strategic intelligence.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="stats-mini glass">
              <h3>Coverage Metrics</h3>
              <div className="mini-stat">
                <span>Data Integrity</span>
                <div className="progress-bg"><div className="progress-fill" style={{ width: '94%' }}></div></div>
              </div>
              <div className="mini-stat">
                <span>Model Accuracy</span>
                <div className="progress-bg"><div className="progress-fill" style={{ width: '88%' }}></div></div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <style>{`
        .predictive-container {
          padding: 40px;
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
        }

        .intelligence-overview {
          padding: 24px 32px;
          border-radius: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 32px;
          border-left: 4px solid #a855f7;
        }

        .intel-card {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .intel-icon {
          width: 54px;
          height: 54px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .intel-content h3 {
          font-size: 1.1rem;
          margin-bottom: 4px;
          color: white;
        }

        .intel-content p {
          font-size: 0.85rem;
          color: var(--text-muted);
          max-width: 400px;
        }

        .run-intel-btn {
          height: 54px;
          padding: 0 28px;
          font-size: 1rem;
          background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%);
        }

        .predictive-grid {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 32px;
        }

        .section-group {
          margin-bottom: 40px;
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
        }

        .section-header h2 {
          font-size: 1.25rem;
        }

        .trend-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .trend-card {
          padding: 20px;
          border-radius: 20px;
        }

        .trend-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .case-type {
          font-weight: 600;
          font-size: 0.9rem;
        }

        .trend-stat {
          font-size: 0.8rem;
          color: #a855f7;
          font-weight: 700;
        }

        .pattern-bar-container {
          height: 6px;
          background: rgba(255,255,255,0.05);
          border-radius: 3px;
          margin-bottom: 12px;
          overflow: hidden;
        }

        .pattern-bar {
          height: 100%;
          border-radius: 3px;
        }

        .trend-loc {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .hotspot-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .hotspot-item {
          padding: 16px 24px;
          border-radius: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .h-info {
           display: flex;
           flex-direction: column;
           gap: 2px;
        }

        .h-info strong {
          font-size: 0.95rem;
        }

        .h-info span {
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .h-risk {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .risk-level {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ef4444;
          box-shadow: 0 0 10px #ef4444;
        }

        .h-risk span {
          font-size: 0.8rem;
          font-weight: 700;
          color: #ef4444;
        }

        .placeholder-state {
          padding: 80px 40px;
          border-radius: 24px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        .bot-icon {
          color: var(--primary);
          opacity: 0.2;
          animation: float 4s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .predictive-sidebar {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .insight-card {
          border-radius: 20px;
          display: flex;
          flex-direction: column;
        }

        .insight-card .card-header {
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid var(--glass-border);
        }

        .insight-card .card-header h3 {
          font-size: 1rem;
        }

        .insight-body {
          padding: 24px;
          min-height: 300px;
        }

        .insight-text {
          font-size: 0.9rem;
          line-height: 1.7;
          color: white;
          white-space: pre-wrap;
        }

        .insight-empty {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: var(--text-muted);
          gap: 16px;
          opacity: 0.5;
        }

        .insight-empty p {
          font-size: 0.8rem;
        }

        .stats-mini {
          padding: 24px;
          border-radius: 20px;
        }

        .stats-mini h3 {
          font-size: 0.9rem;
          margin-bottom: 20px;
          color: var(--text-muted);
        }

        .mini-stat {
          margin-bottom: 16px;
        }

        .mini-stat span {
          display: block;
          font-size: 0.75rem;
          margin-bottom: 6px;
          font-weight: 600;
        }

        .progress-bg {
          height: 4px;
          background: rgba(255,255,255,0.05);
          border-radius: 2px;
        }

        .progress-fill {
          height: 100%;
          border-radius: 2px;
          background: var(--primary);
        }

        .spinner-small {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .legal-act-card {
          border-radius: 20px;
          display: flex;
          flex-direction: column;
        }

        .legal-act-card .card-header {
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid var(--glass-border);
        }

        .legal-act-card .card-header h3 {
          font-size: 1rem;
        }

        .act-downloads, .act-suggestion {
          padding: 24px;
          border-bottom: 1px solid var(--glass-border);
        }

        .section-subtitle {
          font-size: 0.8rem;
          color: var(--text-muted);
          font-weight: 600;
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .download-buttons {
          display: flex;
          gap: 8px;
        }

        .act-btn {
          flex: 1;
          text-align: center;
          padding: 8px 0;
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 700;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .act-btn:hover {
          background: rgba(59, 130, 246, 0.2);
        }

        .upload-btn-small {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px;
          border: 1px dashed var(--glass-border);
          border-radius: 12px;
          cursor: pointer;
          font-size: 0.85rem;
          transition: all 0.2s ease;
          margin-bottom: 12px;
          color: var(--text-muted);
        }

        .upload-btn-small:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: var(--text-main);
          color: white;
        }

        .upload-btn-small span {
          max-width: 180px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .run-suggest-btn {
          width: 100%;
          height: 48px;
          font-size: 0.9rem;
        }

        .suggest-result {
          padding: 24px;
          background: rgba(59, 130, 246, 0.05);
          border-radius: 0 0 20px 20px;
        }

        .suggest-result p {
          font-size: 0.85rem;
          line-height: 1.6;
          color: white;
          margin-top: 8px;
          white-space: pre-wrap;
        }
      `}</style>
    </div>
  );
};

export default PredictiveScreen;
