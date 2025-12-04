import React from 'react';

interface NotFoundProps {
  gameName: string;
  onGoBack: () => void;
}

const NotFound: React.FC<NotFoundProps> = ({ gameName, onGoBack }) => {
  return (
    <div className="not-found-page">
      <div className="not-found-content">
        <div className="error-code">404</div>
        <h1>Strona nie znaleziona</h1>
        <p className="error-description">
          Gra <strong>"{gameName}"</strong> jest jeszcze w przygotowaniu.
        </p>
        <p className="error-subtitle">
          Wróć wkrótce, pracujemy nad czymś ekscytującym!
        </p>
        <button className="back-btn" onClick={onGoBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15,18 9,12 15,6" />
          </svg>
          Wróć do GRAND WAGER
        </button>
        
        <div className="decorative-cards">
          <span className="card">🂡</span>
          <span className="card">🂱</span>
          <span className="card">🃁</span>
          <span className="card">🃑</span>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
