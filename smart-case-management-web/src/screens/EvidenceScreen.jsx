import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/translations';
import api from '../services/api';
import { 
  Database, 
  Plus, 
  Search, 
  Mic, 
  Video, 
  FileText, 
  Camera, 
  Package,
  Upload,
  X,
  History,
  ShieldCheck,
  ChevronRight,
  Filter,
  Paperclip,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MEDIA_TYPES = [
  { key: 'audio', label: 'Audio', icon: <Mic size={20} />, color: '#ec4899', description: 'Attach audio evidence' },
  { key: 'video', label: 'Video', icon: <Video size={20} />, color: '#f97316', description: 'Attach video footage' },
  { key: 'document', label: 'PDF/Doc', icon: <FileText size={20} />, color: '#3b82f6', description: 'Attach documents' },
  { key: 'photo', label: 'Photo', icon: <Camera size={20} />, color: '#22c55e', description: 'Attach photos' },
  { key: 'physical', label: 'Physical', icon: <Package size={20} />, color: '#a855f7', description: 'Log physical item' },
];

const EvidenceScreen = () => {
  const { language } = useAuth();
  const { t } = useTranslation(language);
  const [evidence, setEvidence] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', case_id: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadEvidence(); }, []);

  const loadEvidence = async () => {
    setLoading(true);
    try {
      const res = await api.get('/evidence?limit=100');
      setEvidence(res.data.evidence || []);
    } catch (err) {
      console.error('Error loading evidence:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      if (!form.title) {
        setForm(p => ({ ...p, title: e.target.files[0].name.split('.')[0] }));
      }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return alert('Title is required');
    
    setSaving(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      formData.append('evidence_type', selectedType.key);
      if (selectedFile) formData.append('file', selectedFile);

      await api.post('/evidence', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setShowModal(false);
      setForm({ title: '', description: '', case_id: '' });
      setSelectedFile(null);
      loadEvidence();
    } catch (err) {
      console.error('Error saving evidence:', err);
      alert('Failed to save evidence.');
    } finally {
      setSaving(false);
    }
  };

  const filteredEvidence = evidence.filter(e => {
    const matchesType = filterType === 'all' || e.evidence_type === filterType;
    const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          e.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="evidence-container">
      <header className="page-header">
        <div className="header-text">
          <h1>{t('evidenceTracker')}</h1>
          <p>Chain of Custody and Evidence Management</p>
        </div>
        <div className="breadcrumb">
          <span>{t('dashboard')}</span>
          <ChevronRight size={14} />
          <span className="active">{t('evidence')}</span>
        </div>
      </header>

      <div className="evidence-workspace">
        <div className="evidence-toolbar glass">
          <div className="search-group">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Filter vault..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="filter-chips">
            <button 
              className={`chip ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => setFilterType('all')}
            >
              All Records
            </button>
            {MEDIA_TYPES.map(type => (
              <button 
                key={type.key}
                className={`chip ${filterType === type.key ? 'active' : ''}`}
                onClick={() => setFilterType(type.key)}
                style={{ '--chip-color': type.color }}
              >
                {type.icon}
                {type.label}
              </button>
            ))}
          </div>
        </div>

        <div className="add-evidence-grid">
           {MEDIA_TYPES.map(type => (
             <motion.button 
               whileHover={{ scale: 1.02 }}
               whileTap={{ scale: 0.98 }}
               key={type.key}
               className="add-card glass"
               onClick={() => { setSelectedType(type); setShowModal(true); }}
               style={{ '--card-accent': type.color }}
             >
               <div className="icon-box" style={{ backgroundColor: `${type.color}20`, color: type.color }}>
                 {type.icon}
               </div>
               <div className="text-box">
                 <h3>{type.label}</h3>
                 <p>{type.description}</p>
               </div>
               <Plus size={20} className="plus-icon" />
             </motion.button>
           ))}
        </div>

        <div className="evidence-vault">
          <div className="vault-header">
            <h2><History size={20} /> Repository Records</h2>
            <span>{filteredEvidence.length} items found</span>
          </div>

          {loading ? (
            <div className="loading-vault">
              <Activity className="spinner" size={40} />
              <p>Scanning Digital Vault...</p>
            </div>
          ) : (
            <div className="evidence-grid">
              {filteredEvidence.map((item, idx) => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  key={item.id} 
                  className="evidence-card glass"
                  style={{ '--border-accent': MEDIA_TYPES.find(m => m.key === item.evidence_type)?.color || '#3b82f6' }}
                >
                  <div className="card-top">
                    <div className="type-badge" style={{ backgroundColor: `${MEDIA_TYPES.find(m => m.key === item.evidence_type)?.color}20`, color: MEDIA_TYPES.find(m => m.key === item.evidence_type)?.color }}>
                      {MEDIA_TYPES.find(m => m.key === item.evidence_type)?.icon}
                      <span>{item.evidence_type.toUpperCase()}</span>
                    </div>
                    <span className="ev-number">#{item.evidence_number || 'E-000'+item.id}</span>
                  </div>
                  
                  <div className="card-body">
                    <h3>{item.title}</h3>
                    <p>{item.description || "No analysis provided."}</p>
                  </div>

                  <div className="card-footer">
                    {item.file_name && (
                      <div className="file-link">
                        <Paperclip size={14} />
                        <span>{item.file_name}</span>
                      </div>
                    )}
                    <div className="chain-status">
                      <ShieldCheck size={14} color="#22c55e" />
                      <span>Verified</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="modal-content glass"
              onClick={e => e.stopPropagation()}
            >
              <div className="modal-header" style={{ borderLeft: `4px solid ${selectedType?.color}` }}>
                <div className="header-info">
                  <div className="icon" style={{ backgroundColor: `${selectedType?.color}15`, color: selectedType?.color }}>
                    {selectedType?.icon}
                  </div>
                  <div>
                    <h3>Secure Evidence Upload</h3>
                    <p>Registering {selectedType?.label} exhibit in Case Management System</p>
                  </div>
                </div>
                <button className="close-btn" onClick={() => setShowModal(false)}><X size={20} /></button>
              </div>

              <form onSubmit={handleSave} className="modal-form">
                <div className="input-group">
                  <label>Title *</label>
                  <input 
                    type="text" 
                    value={form.title}
                    onChange={e => setForm({...form, title: e.target.value})}
                    placeholder="Reference label for evidence"
                    required
                  />
                </div>

                <div className="input-group">
                  <label>Description (Context)</label>
                  <textarea 
                    value={form.description}
                    onChange={e => setForm({...form, description: e.target.value})}
                    placeholder="Incident context and collection details..."
                    rows="3"
                  />
                </div>

                <div className="input-group">
                  <label>Associated Case ID</label>
                  <input 
                    type="text" 
                    value={form.case_id}
                    onChange={e => setForm({...form, case_id: e.target.value})}
                    placeholder="Record ID or Reference #"
                  />
                </div>

                <div className="file-upload-zone">
                  <label className="upload-btn">
                    <Upload size={24} />
                    {selectedFile ? (
                      <div className="file-preview">
                        <strong>{selectedFile.name}</strong>
                        <span>{(selectedFile.size / 1024).toFixed(1)} KB</span>
                      </div>
                    ) : (
                      <span>Select {selectedType?.label} Exhibit File</span>
                    )}
                    <input type="file" hidden onChange={handleFileChange} />
                  </label>
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Processing...' : 'Securely Commit to Vault'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .evidence-container {
          padding: 40px;
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
        }

        .evidence-toolbar {
          padding: 16px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 32px;
          gap: 20px;
        }

        .search-group {
          position: relative;
          flex: 1;
          max-width: 400px;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
        }

        .search-group input {
          width: 100%;
          padding: 10px 10px 10px 40px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          color: white;
          outline: none;
        }

        .filter-chips {
          display: flex;
          gap: 8px;
        }

        .chip {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--glass-border);
          color: var(--text-muted);
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .chip.active {
          background: var(--primary-glow);
          color: white;
          border-color: var(--primary);
        }

        .add-evidence-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 20px;
          margin-bottom: 40px;
        }

        .add-card {
          padding: 24px;
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          cursor: pointer;
          border: 1px solid var(--glass-border);
          position: relative;
          height: 180px;
          justify-content: center;
        }

        .add-card:hover {
          border-color: var(--card-accent);
          background: rgba(255, 255, 255, 0.05);
        }

        .icon-box {
          width: 50px;
          height: 50px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }

        .text-box h3 {
          font-size: 0.95rem;
          margin-bottom: 4px;
        }

        .text-box p {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .plus-icon {
          position: absolute;
          top: 12px;
          right: 12px;
          opacity: 0.3;
        }

        .evidence-vault {
          margin-top: 40px;
        }

        .vault-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--glass-border);
        }

        .vault-header h2 {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 1.25rem;
        }

        .vault-header span {
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        .evidence-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
        }

        .evidence-card {
          padding: 24px;
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          border-left: 2px solid var(--border-accent);
        }

        .card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .type-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 10px;
          border-radius: 8px;
          font-size: 0.7rem;
          font-weight: 700;
        }

        .ev-number {
          font-family: monospace;
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .card-body h3 {
          font-size: 1rem;
          margin-bottom: 8px;
        }

        .card-body p {
          font-size: 0.85rem;
          color: var(--text-muted);
          line-height: 1.5;
        }

        .card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 16px;
          border-top: 1px solid var(--glass-border);
        }

        .file-link, .chain-status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-muted);
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-content {
          width: 100%;
          max-width: 600px;
          padding: 40px;
          border-radius: 32px;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 32px;
          padding-left: 20px;
        }

        .header-info {
          display: flex;
          gap: 20px;
        }

        .header-info h3 {
          font-size: 1.25rem;
          margin-bottom: 4px;
        }

        .header-info p {
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        .modal-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .modal-form label {
          display: block;
          margin-bottom: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-muted);
        }

        .modal-form input, .modal-form textarea {
          width: 100%;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          color: white;
          outline: none;
        }

        .file-upload-zone {
          margin-top: 10px;
        }

        .upload-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 32px;
          border: 2px dashed var(--glass-border);
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .upload-btn:hover {
          border-color: var(--primary);
          background: rgba(59, 130, 246, 0.05);
        }

        .file-preview {
          text-align: center;
          display: flex;
          flex-direction: column;
        }

        .loading-vault {
          padding: 100px 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          color: var(--text-muted);
        }

        .spinner {
          animation: spin 2s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default EvidenceScreen;
