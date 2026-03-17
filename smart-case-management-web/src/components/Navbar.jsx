import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/translations';
import { Bell, User, Globe, Search as SearchIcon } from 'lucide-react';

const Navbar = () => {
  const { user, language, toggleLanguage } = useAuth();
  const { t } = useTranslation(language);

  return (
    <header className="navbar glass">
      <div className="search-bar glass">
        <SearchIcon size={18} color="var(--text-muted)" />
        <input type="text" placeholder={t('searchPlaceholder')} />
      </div>

      <div className="navbar-actions">
        <div className="action-btn" onClick={toggleLanguage} title="Change Language">
          <Globe size={20} />
          <span>{language === 'en' ? 'EN' : 'HI'}</span>
        </div>
        
        <div className="action-btn" title="Notifications">
          <div className="notification-dot" />
          <Bell size={20} />
        </div>

        <div className="user-profile">
          <div className="user-info">
            <span className="user-name">{user?.name}</span>
            <span className="user-role">Precinct Officer</span>
          </div>
          <div className="user-avatar">
            <User size={20} />
          </div>
        </div>
      </div>

      <style>{`
        .navbar {
          height: 80px;
          padding: 0 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--glass-border);
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .search-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 20px;
          border-radius: 12px;
          width: 400px;
          background: rgba(255, 255, 255, 0.05);
        }

        .search-bar input {
          background: transparent;
          border: none;
          color: white;
          width: 100%;
          outline: none;
          font-size: 0.9rem;
        }

        .navbar-actions {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .action-btn {
          position: relative;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.3s ease;
          border: 1px solid var(--glass-border);
          gap: 6px;
          padding: 0 12px;
          width: auto;
        }

        .action-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-2px);
        }

        .notification-dot {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 8px;
          height: 8px;
          background: var(--danger);
          border-radius: 50%;
          border: 2px solid var(--panel-bg);
          z-index: 1;
        }

        .user-profile {
          display: flex;
          align-items: center;
          gap: 16px;
          padding-left: 24px;
          border-left: 1px solid var(--glass-border);
        }

        .user-info {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .user-name {
          font-weight: 600;
          font-size: 0.95rem;
        }

        .user-role {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .user-avatar {
          width: 44px;
          height: 44px;
          background: var(--primary-glow);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--primary);
        }
      `}</style>
    </header>
  );
};

export default Navbar;
