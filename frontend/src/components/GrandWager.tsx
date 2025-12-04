import React from 'react';
import { Player, GameConfig, Round } from '../types';

interface GrandWagerProps {
  player: Player | null;
  currentRound: Round | null;
  config: GameConfig | null;
  timeRemaining: number;
  betAmount: string;
  onBetAmountChange: (amount: string) => void;
  onPlaceBet: () => void;
  onQuickBet: (amount: number) => void;
}

const GrandWager: React.FC<GrandWagerProps> = ({
  player,
  currentRound,
  config,
  timeRemaining,
  betAmount,
  onBetAmountChange,
  onPlaceBet,
  onQuickBet,
}) => {
  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const calculateChance = (bet: { playerId: string; amount: number }): string => {
    if (!currentRound || currentRound.totalPool === 0) return '0%';
    return ((bet.amount / currentRound.totalPool) * 100).toFixed(1) + '%';
  };

  const getPlayerTotalBet = (): number => {
    if (!currentRound || !player) return 0;
    return currentRound.bets
      .filter(b => b.playerId === player.id)
      .reduce((sum, b) => sum + b.amount, 0);
  };

  const getPlayerChance = (): string => {
    if (!currentRound || currentRound.totalPool === 0 || !player) return '0%';
    const totalBet = getPlayerTotalBet();
    return ((totalBet / currentRound.totalPool) * 100).toFixed(1) + '%';
  };

  return (
    <div className="grand-wager-game">
      <div className="game-main">
        {/* Timer i pula */}
        <div className="game-header-panel">
          <div className="timer-box">
            <span className="timer-label">Czas do końca</span>
            <div className={`timer-value ${timeRemaining < 10000 ? 'warning' : ''}`}>
              {formatTime(timeRemaining)}
            </div>
          </div>
          
          <div className="pool-box">
            <span className="pool-label">Aktualna pula</span>
            <div className="pool-value">
              {currentRound?.totalPool.toFixed(2) || '0.00'} 💰
            </div>
            {config && (
              <span className="commission-info">
                Prowizja: {config.casinoCommissionPercent}%
              </span>
            )}
          </div>

          <div className="your-stats-box">
            <span className="stats-label">Twój zakład</span>
            <div className="stats-value">{getPlayerTotalBet().toFixed(2)} 💰</div>
            <span className="chance-value">Szansa: {getPlayerChance()}</span>
          </div>
        </div>

        {/* Panel zakładów */}
        <div className="betting-panel">
          <h3>Postaw zakład</h3>
          <div className="bet-controls">
            <div className="bet-input-wrapper">
              <input
                type="number"
                className="bet-input"
                value={betAmount}
                onChange={(e) => onBetAmountChange(e.target.value)}
                min={config?.minBet || 1}
                max={config?.maxBet || 10000}
                placeholder="Kwota zakładu"
              />
              <span className="bet-currency">💰</span>
            </div>
            <button
              className="place-bet-btn"
              onClick={onPlaceBet}
              disabled={!currentRound || currentRound.status === 'finished'}
            >
              Postaw zakład
            </button>
          </div>
          
          <div className="quick-bets">
            {[10, 25, 50, 100, 250, 500].map((amount) => (
              <button
                key={amount}
                className="quick-bet-btn"
                onClick={() => onQuickBet(amount)}
              >
                {amount}
              </button>
            ))}
            {player && (
              <button
                className="quick-bet-btn all-in"
                onClick={() => onQuickBet(player.balance)}
              >
                ALL IN
              </button>
            )}
          </div>
        </div>

        {/* Lista zakładów */}
        <div className="bets-panel">
          <h3>
            Zakłady w rundzie
            <span className="bets-count">{currentRound?.bets.length || 0}</span>
          </h3>
          <div className="bets-list">
            {currentRound?.bets.map((bet, index) => (
              <div 
                key={index} 
                className={`bet-row ${bet.playerId === player?.id ? 'own-bet' : ''}`}
              >
                <div className="bet-player">
                  <div className="player-avatar-small">
                    {bet.playerUsername.charAt(0).toUpperCase()}
                  </div>
                  <span className="player-name">
                    {bet.playerUsername}
                    {bet.playerId === player?.id && <span className="you-badge">Ty</span>}
                  </span>
                </div>
                <div className="bet-amount">{bet.amount} 💰</div>
                <div className="bet-chance">{calculateChance(bet)}</div>
              </div>
            ))}
            {(!currentRound?.bets || currentRound.bets.length === 0) && (
              <div className="no-bets">
                <span>🎲</span>
                <p>Brak zakładów - bądź pierwszy!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Panel boczny z zasadami */}
      <div className="game-rules-panel">
        <h4>Jak grać?</h4>
        <ul>
          <li>
            <span className="rule-icon">⏱️</span>
            <span>Runda trwa {config ? config.roundDurationMs / 1000 : 60} sekund</span>
          </li>
          <li>
            <span className="rule-icon">💰</span>
            <span>Im więcej postawisz, tym większa szansa na wygraną</span>
          </li>
          <li>
            <span className="rule-icon">🏆</span>
            <span>Zwycięzca zgarnia całą pulę minus {config?.casinoCommissionPercent || 5}% prowizji</span>
          </li>
          <li>
            <span className="rule-icon">🔄</span>
            <span>Możesz stawiać wielokrotnie w jednej rundzie</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default GrandWager;
