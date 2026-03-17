import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/translations';
import { 
  LayoutDashboard, 
  FileText, 
  Search, 
  Database, 
  Zap, 
  LogOut,
  ShieldAlert
} from 'lucide-react';

const Sidebar = () => {
  const { logout, language } = useAuth();
  const { t } = useTranslation(language);

  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: t('dashboard'), path: '/' },
    { icon: <FileText size={20} />, label: t('newComplaint'), path: '/complaints' },
    { icon: <Search size={20} />, label: t('searchCase'), path: '/cases' },
    { icon: <Database size={20} />, label: t('evidence'), path: '/evidence' },
    { icon: <Zap size={20} />, label: t('predictive'), path: '/predictive' },
  ];

  return (
    <aside className="sidebar glass">
      <div className="sidebar-header">
        <ShieldAlert size={28} color="#3b82f6" />
        <span className="brand-name">{t('appName')}</span>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item, index) => (
          <NavLink 
            key={index} 
            to={item.path} 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button onClick={logout} className="logout-btn">
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>

      <style>{`
        .sidebar {
          width: 260px;
          height: 100vh;
          display: flex;
          flex-direction: column;
          border-right: 1px solid var(--glass-border);
          z-index: 100;
        }

        .sidebar-header {
          padding: 30px 24px;
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }

        .brand-name {
          font-weight: 700;
          font-size: 1.25rem;
          letter-spacing: -0.5px;
          background: linear-gradient(135deg, #fff 0%, #94a3b8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .sidebar-nav {
          flex: 1;
          padding: 0 16px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          color: var(--text-muted);
          text-decoration: none;
          border-radius: 12px;
          margin-bottom: 8px;
          transition: all 0.3s ease;
          font-weight: 500;
        }

        .nav-item:hover {
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-main);
        }

        .nav-item.active {
          background: var(--primary-glow);
          color: var(--text-main);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .sidebar-footer {
          padding: 24px;
          border-top: 1px solid var(--glass-border);
        }

        .logout-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: transparent;
          border: 1px solid var(--glass-border);
          color: var(--danger);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 500;
        }

        .logout-btn:hover {
          background: rgba(239, 68, 68, 0.1);
          border-color: var(--danger);
        }
      `}</style>
    </aside>
  );
};

export default Sidebar;
