import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/translations';
import api from '../services/api';
import { 
  Mic, 
  MicOff, 
  Upload, 
  Send, 
  X, 
  AlertTriangle,
  FileText,
  User,
  Phone,
  MapPin,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const COMPLAINT_TYPES = ['theft', 'assault', 'fraud', 'missing', 'accident', 'other'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

const PriorityBadge = ({ priority, active, onClick, t }) => {
  const colors = {
    low: '#22c55e',
    medium: '#f59e0b',
    high: '#ef4444',
    urgent: '#7f1d1d'
  };

  return (
    <button
      onClick={() => onClick(priority)}
      className={`priority-chip ${active ? 'active' : ''}`}
      style={{ 
        '--chip-color': colors[priority],
        borderColor: active ? colors[priority] : 'var(--glass-border)'
      }}
    >
      {t(priority)}
    </button>
  );
};

const ComplaintScreen = () => {
  const { language } = useAuth();
  const { t } = useTranslation(language);
  const [form, setForm] = useState({
    complainant_name: '',
    complainant_phone: '',
    complainant_address: '',
    complaint_type: 'theft',
    description: '',
    location: '',
    priority: 'medium',
  });
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const recognitionRef = useRef(null);

  const update = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

  const startVoice = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = language === 'en' ? 'en-US' : 'hi-IN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      update('description', form.description ? `${form.description} ${transcript}` : transcript);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.complainant_name.trim() || !form.description.trim()) {
      alert('Name and description are required');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      formData.append('language', language);
      if (selectedFile) {
        formData.append('file', selectedFile);
      }

      await api.post('/complaints', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
      setForm({
        complainant_name: '',
        complainant_phone: '',
        complainant_address: '',
        complaint_type: 'theft',
        description: '',
        location: '',
        priority: 'medium',
      });
      setSelectedFile(null);
    } catch (err) {
      console.error('Submission error:', err);
      alert('Error registering complaint. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="complaint-container">
      <header className="page-header">
        <div className="header-text">
          <h1>{t('registerComplaint')}</h1>
          <p>Official case registration and incident logging</p>
        </div>
        <div className="breadcrumb">
          <span>{t('dashboard')}</span>
          <ChevronRight size={14} />
          <span className="active">{t('complaints')}</span>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="complaint-form">
        <div className="form-main">
          <section className="form-section glass">
            <h2 className="section-title">
              <User size={18} /> {t('complainantName')}
            </h2>
            <div className="grid-2">
              <div className="input-group">
                <label className="input-label">{t('complainantName')} *</label>
                <div className="input-wrapper">
                  <User size={18} className="input-icon" />
                  <input 
                    type="text" 
                    className="input-field"
                    value={form.complainant_name}
                    onChange={(e) => update('complainant_name', e.target.value)}
                    placeholder="Enter full name"
                    required
                  />
                </div>
              </div>
              <div className="input-group">
                <label className="input-label">{t('phone')}</label>
                <div className="input-wrapper">
                  <Phone size={18} className="input-icon" />
                  <input 
                    type="tel" 
                    className="input-field"
                    value={form.complainant_phone}
                    onChange={(e) => update('complainant_phone', e.target.value)}
                    placeholder="+91 XXXXX XXXXX"
                  />
                </div>
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">{t('address')}</label>
              <div className="input-wrapper">
                <MapPin size={18} className="input-icon" style={{ marginTop: '12px' }} />
                <textarea 
                  className="input-field"
                  value={form.complainant_address}
                  onChange={(e) => update('complainant_address', e.target.value)}
                  placeholder="Address details..."
                  rows="2"
                />
              </div>
            </div>
          </section>

          <section className="form-section glass">
            <div className="section-header">
              <h2 className="section-title">
                <FileText size={18} /> {t('description')}
              </h2>
              <button 
                type="button" 
                className={`voice-btn ${isListening ? 'listening' : ''}`}
                onClick={startVoice}
              >
                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                {isListening ? t('speaking') : t('voiceInput')}
              </button>
            </div>
            
            <div className="input-group">
              <textarea 
                className="input-field description-area"
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                placeholder="Describe the incident in detail..."
                rows="6"
                required
              />
            </div>
          </section>
        </div>

        <aside className="form-sidebar">
          <section className="sidebar-section glass">
            <h3 className="sidebar-title">Evidence Upload</h3>
            <div className="file-upload">
              {selectedFile ? (
                <div className="selected-file">
                  <div className="file-info">
                    <FileText size={20} color="var(--primary)" />
                    <div className="text">
                      <span className="file-name">{selectedFile.name}</span>
                      <span className="file-size">{(selectedFile.size / 1024).toFixed(1)} KB</span>
                    </div>
                  </div>
                  <button type="button" onClick={() => setSelectedFile(null)} className="remove-btn">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <label className="upload-label">
                  <Upload size={24} />
                  <span>Click to upload evidence</span>
                  <p>Photo, PDF, or Audio</p>
                  <input type="file" hidden onChange={handleFileChange} />
                </label>
              )}
            </div>
          </section>

          <button 
            type="submit" 
            className="btn btn-primary submit-btn"
            disabled={loading}
          >
            {loading ? <div className="spinner" /> : <Send size={18} />}
            {t('submit')}
          </button>
        </aside>
      </form>

      <AnimatePresence>
        {success && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="success-toast glass"
          >
            <CheckCircle2 color="var(--success)" size={24} />
            <span>Complaint registered successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .complaint-container {
          padding: 40px;
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
        }

        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--text-muted);
          font-size: 0.85rem;
          margin-top: 8px;
        }

        .breadcrumb .active {
          color: var(--primary);
          font-weight: 600;
        }

        .complaint-form {
          display: grid;
          grid-template-columns: 1fr 350px;
          gap: 32px;
          margin-top: 32px;
        }

        .form-main {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .form-section {
          padding: 32px;
          border-radius: 24px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .section-title {
          font-size: 1.1rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
        }

        .section-header .section-title {
          margin-bottom: 0;
        }

        .grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: flex-start;
        }

        .input-icon {
          position: absolute;
          left: 14px;
          top: 14px;
          color: var(--text-muted);
        }

        .input-field {
          padding-left: 44px;
        }

        .description-area {
          padding-left: 20px;
          resize: vertical;
        }

        .voice-btn {
          background: rgba(59, 130, 246, 0.1);
          color: var(--primary);
          border: 1px solid rgba(59, 130, 246, 0.2);
          padding: 8px 16px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .voice-btn.listening {
          background: var(--danger);
          color: white;
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }

        .form-sidebar {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .sidebar-section {
          padding: 24px;
          border-radius: 20px;
        }

        .sidebar-title {
          font-size: 0.95rem;
          margin-bottom: 16px;
          color: var(--text-muted);
          font-weight: 600;
        }

        .type-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .type-chip {
          padding: 10px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--glass-border);
          color: var(--text-muted);
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .type-chip:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        .type-chip.selected {
          background: var(--primary-glow);
          border-color: var(--primary);
          color: var(--text-main);
        }

        .priority-list {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .priority-chip {
          padding: 10px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--glass-border);
          color: var(--text-muted);
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .priority-chip.active {
          background: var(--chip-color);
          color: white;
          opacity: 0.9;
        }

        .upload-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 30px 20px;
          border: 2px dashed var(--glass-border);
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .upload-label:hover {
          border-color: var(--primary);
          background: rgba(59, 130, 246, 0.05);
        }

        .upload-label span {
          font-weight: 600;
          font-size: 0.9rem;
        }

        .upload-label p {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .selected-file {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          border: 1px solid var(--primary-glow);
        }

        .file-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .file-info .text {
          display: flex;
          flex-direction: column;
        }

        .file-name {
          font-size: 0.85rem;
          font-weight: 600;
          max-width: 150px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .file-size {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .remove-btn {
          background: transparent;
          border: none;
          color: var(--danger);
          cursor: pointer;
          padding: 4px;
        }

        .submit-btn {
          width: 100%;
          height: 56px;
          font-size: 1.1rem;
          margin-top: auto;
        }

        .success-toast {
          position: fixed;
          bottom: 40px;
          right: 40px;
          padding: 16px 24px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 600;
          z-index: 1000;
          border-left: 4px solid var(--success);
        }

        .spinner {
          width: 24px;
          height: 24px;
          border: 3px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ComplaintScreen;
