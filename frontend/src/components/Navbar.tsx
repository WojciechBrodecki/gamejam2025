import React, { useState } from 'react';

interface NavbarProps {
  casinoName: string;
  balance: number;
  username: string;
  avatarUrl?: string;
  currentGame: 'grand-wager' | 'test-gra';
  onGameChange: (game: 'grand-wager' | 'test-gra') => void;
  onLogout: () => void;
  onAvatarChange: () => void;
}

const Navbar: React.FC<NavbarProps> = ({
  casinoName,
  balance,
  username,
  avatarUrl,
  currentGame,
  onGameChange,
  onLogout,
  onAvatarChange,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <div className="casino-name">{casinoName}</div>
        <div className="nav-games">
          <button
            className={`nav-game-btn ${currentGame === 'grand-wager' ? 'active' : ''}`}
            onClick={() => onGameChange('grand-wager')}
          >
            GRAND WAGER
          </button>
          <button
            className={`nav-game-btn ${currentGame === 'test-gra' ? 'active' : ''}`}
            onClick={() => onGameChange('test-gra')}
          >
            TEST_GRA
          </button>
        </div>
      </div>

      <div className="navbar-right">
        <div className="balance-display">
          <span className="balance-label">Balans</span>
          <span className="balance-amount">{balance.toFixed(2)} 💰</span>
        </div>

        <div className="user-menu-container">
          <button
            className="user-menu-trigger"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <div className="user-avatar">
              {avatarUrl ? (
                <img src={avatarUrl} alt={username} />
              ) : (
                <div className="avatar-placeholder">
                  {username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <span className="username-display">{username}</span>
            <svg
              className={`menu-arrow ${isMenuOpen ? 'open' : ''}`}
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="currentColor"
            >
              <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="2" fill="none" />
            </svg>
          </button>

          {isMenuOpen && (
            <div className="user-dropdown">
              <button className="dropdown-item" onClick={onAvatarChange}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
                </svg>
                Zmień avatar
              </button>
              <button className="dropdown-item logout" onClick={onLogout}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16,17 21,12 16,7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Wyloguj
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
