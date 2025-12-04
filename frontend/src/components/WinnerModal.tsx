import React, { useEffect, useState } from 'react';

interface WinnerModalProps {
  username: string;
  amount: number;
  isCurrentPlayer: boolean;
  onClose: () => void;
}

const WinnerModal: React.FC<WinnerModalProps> = ({
  username,
  amount,
  isCurrentPlayer,
  onClose,
}) => {
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="winner-overlay" onClick={onClose}>
      <div className="winner-modal" onClick={(e) => e.stopPropagation()}>
        {showConfetti && (
          <div className="confetti-container">
            {[...Array(50)].map((_, i) => (
              <div
                key={i}
                className="confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  backgroundColor: ['#ffd700', '#ff6b6b', '#4ade80', '#60a5fa', '#f472b6'][
                    Math.floor(Math.random() * 5)
                  ],
                }}
              />
            ))}
          </div>
        )}
        
        <div className="winner-content">
          <div className="trophy-icon">🏆</div>
          
          {isCurrentPlayer ? (
            <>
              <h2 className="winner-title victory">GRATULACJE!</h2>
              <p className="winner-subtitle">Wygrałeś tę rundę!</p>
            </>
          ) : (
            <>
              <h2 className="winner-title">MAMY ZWYCIĘZCĘ!</h2>
              <p className="winner-subtitle">Może następnym razem Ty?</p>
            </>
          )}
          
          <div className="winner-details">
            <div className="winner-avatar">
              {username.charAt(0).toUpperCase()}
            </div>
            <div className="winner-name">{username}</div>
          </div>
          
          <div className="winner-prize">
            <span className="prize-label">Wygrana</span>
            <span className="prize-amount">+{amount.toFixed(2)} 💰</span>
          </div>
          
          <button className="continue-btn" onClick={onClose}>
            Kontynuuj grę
          </button>
        </div>
      </div>
    </div>
  );
};

export default WinnerModal;
