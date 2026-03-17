import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/translations';
import api from '../services/api';
import { 
  FileText, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  ArrowUpRight,
  Plus,
  Search,
  Database,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';

const StatCard = ({ title, value, icon, color, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="stat-card glass"
  >
    <div className="stat-icon" style={{ backgroundColor: `${color}15`, color: color }}>
      {icon}
    </div>
    <div className="stat-content">
      <h3>{value}</h3>
      <p>{title}</p>
    </div>
  </motion.div>
);

const QuickAction = ({ title, icon, color, onClick, delay }) => (
  <motion.button
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay }}
    onClick={onClick}
    className="quick-action-btn glass"
  >
    <div className="action-icon" style={{ color: color }}>
      {icon}
    </div>
    <span>{title}</span>
  </motion.button>
);

const DashboardScreen = () => {
  const { language } = useAuth();
  const { t } = useTranslation(language);
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total_cases: 0, open_cases: 0, urgent_cases: 0, pending: 0 });
  const [recentCases, setRecentCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, casesRes] = await Promise.all([
          api.get('/cases/stats/summary'),
          api.get('/cases?limit=5')
        ]);
        setStats(statsRes.data);
        setRecentCases(casesRes.data.cases || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) return <div className="loading-state">{t('loading')}</div>;

  return (
    <div className="dashboard-container">
      <header className="page-header">
        <div className="header-text">
          <h1>{t('dashboard')}</h1>
          <p>Real-time operational overview</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/complaints')}>
          <Plus size={18} />
          {t('newComplaint')}
        </button>
      </header>

      <div className="stats-grid">
        <StatCard 
          title={t('totalCases')} 
          value={stats.total_cases} 
          icon={<FileText size={24} />} 
          color="#3b82f6"
          delay={0.1}
        />
        <StatCard 
          title={t('openCases')} 
          value={stats.open_cases} 
          icon={<Clock size={24} />} 
          color="#60a5fa"
          delay={0.2}
        />
        <StatCard 
          title={t('urgentCases')} 
          value={stats.urgent_cases} 
          icon={<AlertCircle size={24} />} 
          color="#ef4444"
          delay={0.3}
        />
        <StatCard 
          title={t('pendingComplaints')} 
          value={stats.pending} 
          icon={<CheckCircle2 size={24} />} 
          color="#f59e0b"
          delay={0.4}
        />
      </div>

      <div className="secondary-grid">
        <div className="recent-activity glass">
          <div className="section-header">
            <h2>{t('recentCases')}</h2>
            <button className="text-btn">
              View All <ArrowUpRight size={16} />
            </button>
          </div>
          <div className="activity-list">
            {recentCases.map((caseItem, idx) => (
              <div key={idx} className="activity-item">
                <div className="activity-badge" style={{ backgroundColor: caseItem.priority === 'urgent' ? '#ef444420' : '#3b82f620' }}>
                  <FileText size={18} color={caseItem.priority === 'urgent' ? '#ef4444' : '#3b82f6'} />
                </div>
                <div className="activity-info">
                  <h4>{caseItem.case_number || 'Draft'}</h4>
                  <p>{caseItem.title || 'Untitled Case'}</p>
                </div>
                <div className="activity-status">
                  <span className={`status-pill ${caseItem.status}`}>
                    {t(caseItem.status)}
                  </span>
                  <span className="timestamp">2h ago</span>
                </div>
              </div>
            ))}
            {recentCases.length === 0 && <p className="empty-msg">No recent activity found.</p>}
          </div>
        </div>

        <div className="quick-actions-panel">
          <h2>{t('quickActions')}</h2>
          <div className="actions-grid">
            <QuickAction title={t('newComplaint')} icon={<Plus size={24} />} color="#3b82f6" delay={0.1} onClick={() => navigate('/complaints')} />
            <QuickAction title={t('searchCase')} icon={<Search size={24} />} color="#60a5fa" delay={0.2} onClick={() => navigate('/cases')} />
            <QuickAction title={t('evidence')} icon={<Database size={24} />} color="#22c55e" delay={0.3} onClick={() => navigate('/evidence')} />
            <QuickAction title={t('predictive')} icon={<Zap size={24} />} color="#a855f7" delay={0.4} onClick={() => navigate('/predictive')} />
          </div>
          
          <div className="system-status glass">
            <h3>System Status</h3>
            <div className="status-indicator">
              <span className="dot online"></span>
              <span>All Systems Operational</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .dashboard-container {
          padding: 40px;
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 32px;
          max-width: 1400px;
          margin: 0 auto;
          width: 100%;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }

        .header-text h1 {
          font-size: 2rem;
          margin-bottom: 4px;
        }

        .header-text p {
          color: var(--text-muted);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
        }

        .stat-card {
          padding: 24px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .stat-icon {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-content h3 {
          font-size: 1.75rem;
          line-height: 1;
          margin-bottom: 4px;
        }

        .stat-content p {
          font-size: 0.85rem;
          color: var(--text-muted);
          font-weight: 500;
        }

        .secondary-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 32px;
        }

        .recent-activity {
          padding: 32px;
          border-radius: 24px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .text-btn {
          background: transparent;
          border: none;
          color: var(--primary);
          cursor: pointer;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .activity-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          border-bottom: 1px solid var(--glass-border);
          transition: background 0.3s ease;
          border-radius: 12px;
        }

        .activity-item:hover {
          background: rgba(255, 255, 255, 0.02);
        }

        .activity-item:last-child {
          border-bottom: none;
        }

        .activity-badge {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .activity-info {
          flex: 1;
        }

        .activity-info h4 {
          font-size: 0.95rem;
          margin-bottom: 2px;
        }

        .activity-info p {
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        .activity-status {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
        }

        .status-pill {
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .status-pill.open { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
        .status-pill.urgent { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

        .timestamp {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .quick-actions-panel {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .actions-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .quick-action-btn {
          height: 100px;
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-main);
        }

        .quick-action-btn:hover {
          background: rgba(255, 255, 255, 0.05);
          transform: translateY(-4px);
        }

        .system-status {
          padding: 24px;
          border-radius: 20px;
          margin-top: auto;
        }

        .system-status h3 {
          font-size: 0.9rem;
          margin-bottom: 12px;
          color: var(--text-muted);
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .dot.online {
          width: 8px;
          height: 8px;
          background: var(--success);
          border-radius: 50%;
          box-shadow: 0 0 10px var(--success);
        }

        .loading-state {
          height: calc(100vh - 80px);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
};

export default DashboardScreen;
