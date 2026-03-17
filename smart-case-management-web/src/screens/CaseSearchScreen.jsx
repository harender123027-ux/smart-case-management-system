import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/translations';
import api from '../services/api';
import { 
  Search, 
  Mic, 
  Plus, 
  X, 
  Filter, 
  FileText, 
  User, 
  Calendar,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Bot,
  Zap,
  Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_COLORS = { 
  open: '#3b82f6', 
  investigating: '#f59e0b', 
  closed: '#22c55e', 
  archived: '#94a3b8',
  pending: '#a855f7'
};

const PRIORITY_COLORS = { 
  urgent: '#ef4444', 
  high: '#f97316', 
  medium: '#f59e0b', 
  low: '#22c55e' 
};

const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

const CaseSearchScreen = () => {
  const { language } = useAuth();
  const { t } = useTranslation(language);
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('cases'); // 'cases' or 'complaints'
  const [cases, setCases] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [aiResult, setAiResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [newCase, setNewCase] = useState({ title: '', case_type: '', location: '', priority: 'medium' });

  const recognitionRef = useRef(null);

  useEffect(() => { loadData(); }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'cases' ? '/cases' : '/complaints';
      const res = await api.get(`${endpoint}?limit=30`);
      if (activeTab === 'cases') {
        setCases(res.data.cases || []);
      } else {
        setComplaints(res.data.complaints || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return loadData();

    setAiLoading(true);
    setAiResult('');
    try {
      if (activeTab === 'cases') {
        const res = await api.post('/ai/search', { query, language });
        setAiResult(res.data.result);
        const filtered = await api.get(`/cases?search=${encodeURIComponent(query)}&limit=30`);
        setCases(filtered.data.cases || []);
      } else {
        const filtered = await api.get(`/complaints?search=${encodeURIComponent(query)}&limit=30`);
        setComplaints(filtered.data.complaints || []);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setAiLoading(false);
    }
  };

  const startVoice = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition not supported');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = language === 'en' ? 'en-US' : 'hi-IN';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
    };
    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleAddCase = async (e) => {
    e.preventDefault();
    try {
      await api.post('/cases', newCase);
      setShowAddForm(false);
      setNewCase({ title: '', case_type: '', location: '', priority: 'medium' });
      loadData();
    } catch (err) {
      console.error('Add case error:', err);
    }
  };

  return (
    <div className="search-container">
      <header className="page-header">
        <div className="header-text">
          <h1>{t('caseSearch')}</h1>
          <p>Repository of all active and archived records</p>
        </div>
        <div className="breadcrumb">
          <span>{t('dashboard')}</span>
          <ChevronRight size={14} />
          <span className="active">{t('caseSearch')}</span>
        </div>
      </header>

      <div className="search-workspace">
        <div className="workspace-tabs">
          <button 
            className={`tab-btn ${activeTab === 'cases' ? 'active' : ''}`}
            onClick={() => setActiveTab('cases')}
          >
            <Database size={18} />
            Case Files
          </button>
          <button 
            className={`tab-btn ${activeTab === 'complaints' ? 'active' : ''}`}
            onClick={() => setActiveTab('complaints')}
          >
            <FileText size={18} />
            Incoming Complaints
          </button>
        </div>

        <div className="action-bar glass">
          <form className="search-form" onSubmit={handleSearch}>
            <div className="search-input-wrapper">
              <Search size={20} className="search-icon" />
              <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="search-input"
              />
              <button 
                type="button" 
                className={`voice-search-btn ${isListening ? 'listening' : ''}`}
                onClick={startVoice}
              >
                <Mic size={18} />
              </button>
            </div>
            <button type="submit" className="btn btn-primary search-submit" disabled={aiLoading}>
              {aiLoading ? <div className="spinner-small" /> : <Bot size={18} />}
              AI Search
            </button>
          </form>
          
          {activeTab === 'cases' && (
            <button className="btn btn-secondary add-case-toggle" onClick={() => setShowAddForm(!showAddForm)}>
              {showAddForm ? <X size={18} /> : <Plus size={18} />}
              {showAddForm ? 'Cancel' : 'New Case'}
            </button>
          )}
        </div>

        <AnimatePresence>
          {showAddForm && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="add-case-form glass"
            >
              <h3>Register New Strategic Case</h3>
              <form className="quick-form" onSubmit={handleAddCase}>
                <input 
                  type="text" 
                  placeholder="Case Title *"
                  value={newCase.title}
                  onChange={(e) => setNewCase({...newCase, title: e.target.value})}
                  required
                />
                <input 
                  type="text" 
                  placeholder="Category (e.g. Narcotics)"
                  value={newCase.case_type}
                  onChange={(e) => setNewCase({...newCase, case_type: e.target.value})}
                />
                <select 
                  value={newCase.priority}
                  onChange={(e) => setNewCase({...newCase, priority: e.target.value})}
                >
                  {PRIORITIES.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                </select>
                <button type="submit" className="btn btn-primary">Create</button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {aiResult && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="ai-insight-box glass"
            >
              <div className="insight-header">
                <Bot size={20} color="var(--primary)" />
                <h4>AI Intelligence Insight</h4>
              </div>
              <p>{aiResult}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="results-list">
          {loading ? (
            <div className="loading-area">
              <div className="spinner" />
              <span>Scanning Database...</span>
            </div>
          ) : (
            <div className="records-grid">
              {(activeTab === 'cases' ? cases : complaints).map((item, index) => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  key={item.id} 
                  className="record-card glass"
                >
                  <div className="card-header">
                    <span className="case-id">#{item.case_number || item.id || 'Draft'}</span>
                    <span className="status-pill" style={{ backgroundColor: `${STATUS_COLORS[item.status || 'pending']}20`, color: STATUS_COLORS[item.status || 'pending'] }}>
                      {t(item.status || 'pending')}
                    </span>
                  </div>
                  <h3 className="card-title">{item.title || item.complainant_name}</h3>
                  <p className="card-desc">
                    {item.description || "No detailed description provided for this record."}
                  </p>
                  <div className="card-footer">
                    <div className="meta-item">
                      <Zap size={14} color={PRIORITY_COLORS[item.priority]} fill={PRIORITY_COLORS[item.priority]} />
                      <span>{t(item.priority)}</span>
                    </div>
                    <div className="meta-item">
                      <Calendar size={14} />
                      <span>{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
              {(activeTab === 'cases' ? cases : complaints).length === 0 && (
                <div className="empty-state">
                  <AlertCircle size={48} />
                  <p>No records found matching your current parameters.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .search-container {
          padding: 40px;
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
        }

        .search-workspace {
          margin-top: 32px;
        }

        .workspace-tabs {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
        }

        .tab-btn {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--glass-border);
          color: var(--text-muted);
          padding: 12px 24px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .tab-btn:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        .tab-btn.active {
          background: var(--primary-glow);
          color: var(--text-main);
          border-color: var(--primary);
        }

        .action-bar {
          padding: 16px;
          border-radius: 20px;
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
        }

        .search-form {
          flex: 1;
          display: flex;
          gap: 12px;
        }

        .search-input-wrapper {
          flex: 1;
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: 16px;
          color: var(--text-muted);
        }

        .search-input {
          width: 100%;
          padding: 12px 100px 12px 48px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--glass-border);
          color: white;
          outline: none;
          height: 48px;
        }

        .voice-search-btn {
          position: absolute;
          right: 12px;
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          transition: all 0.3s ease;
        }

        .voice-search-btn:hover {
          color: var(--primary);
          background: rgba(59, 130, 246, 0.1);
        }

        .voice-search-btn.listening {
          color: var(--danger);
          animation: pulse 1s infinite;
        }

        .search-submit {
          height: 48px;
          padding: 0 24px;
        }

        .add-case-toggle {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--glass-border);
          color: var(--text-main);
        }

        .add-case-form {
          padding: 24px;
          border-radius: 20px;
          margin-bottom: 24px;
          overflow: hidden;
        }

        .add-case-form h3 {
          font-size: 1rem;
          margin-bottom: 16px;
          color: var(--primary);
        }

        .quick-form {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr auto;
          gap: 12px;
        }

        .quick-form input, .quick-form select {
          padding: 10px 16px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--glass-border);
          color: white;
          outline: none;
        }

        .ai-insight-box {
          padding: 24px;
          border-radius: 20px;
          margin-bottom: 24px;
          background: rgba(59, 130, 246, 0.05);
          border-left: 4px solid var(--primary);
        }

        .insight-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }

        .insight-header h4 {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--primary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .ai-insight-box p {
          font-size: 0.95rem;
          line-height: 1.6;
          color: var(--text-main);
        }

        .records-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 20px;
        }

        .record-card {
          padding: 24px;
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          transition: all 0.3s ease;
        }

        .record-card:hover {
          transform: translateY(-4px);
          background: rgba(255, 255, 255, 0.05);
          border-color: var(--primary-glow);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .case-id {
          font-family: 'Mono', monospace;
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 600;
        }

        .status-pill {
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
        }

        .card-title {
          font-size: 1.1rem;
          line-height: 1.3;
        }

        .card-desc {
          font-size: 0.85rem;
          color: var(--text-muted);
          line-height: 1.5;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .card-footer {
          margin-top: auto;
          display: flex;
          gap: 16px;
          padding-top: 16px;
          border-top: 1px solid var(--glass-border);
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 600;
        }

        .loading-area {
          padding: 100px 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          color: var(--text-muted);
        }

        .empty-state {
          grid-column: 1 / -1;
          padding: 80px 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          color: var(--text-muted);
          opacity: 0.5;
        }

        .spinner-small {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default CaseSearchScreen;
