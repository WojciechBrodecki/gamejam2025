import React, { useState } from 'react';

interface LoginScreenProps {
  isConnected: boolean;
  onLogin: (username: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ isConnected, onLogin }) => {
  const [username, setUsername] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      onLogin(username.trim());
    }
  };

  return (
    <div className="login-page">
      <div className="login-background">
        <div className="floating-card card-1">🂡</div>
        <div className="floating-card card-2">🂮</div>
        <div className="floating-card card-3">🃁</div>
        <div className="floating-card card-4">🃞</div>
        <div className="floating-chip chip-1">🪙</div>
        <div className="floating-chip chip-2">🪙</div>
      </div>

      <div className="login-container">
        <div className="login-header">
          <h1 className="casino-logo">🎰 ROYAL CASINO</h1>
          <p className="casino-tagline">Szczęście sprzyja odważnym</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <h2>Dołącz do gry</h2>
          
          <div className="input-group">
            <label htmlFor="username">Nazwa gracza</label>
            <input
              id="username"
              type="text"
              placeholder="Wprowadź swoją nazwę"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              maxLength={20}
            />
          </div>

          <button type="submit" className="login-btn" disabled={!isConnected || !username.trim()}>
            {isConnected ? (
              <>
                <span>Wejdź do kasyna</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9,6 15,12 9,18" />
                </svg>
              </>
            ) : (
              <span>Łączenie z serwerem...</span>
            )}
          </button>
        </form>

        <div className={`connection-indicator ${isConnected ? 'connected' : ''}`}>
          <span className="status-dot"></span>
          <span>{isConnected ? 'Połączono z serwerem' : 'Łączenie...'}</span>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
