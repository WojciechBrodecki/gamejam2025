import React, { useState, useEffect, useCallback } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { GameState, Round, Player, GameConfig, WSMessage } from './types';

const App: React.FC = () => {
  const { isConnected, lastMessage, sendMessage } = useWebSocket();
  
  const [username, setUsername] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [player, setPlayer] = useState<Player | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    currentRound: null,
    config: null,
    players: [],
    playerId: null,
  });
  const [betAmount, setBetAmount] = useState<string>('10');
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [winner, setWinner] = useState<{ username: string; amount: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;

    switch (lastMessage.type) {
      case 'SYNC_STATE':
        setGameState({
          currentRound: lastMessage.payload.currentRound,
          config: lastMessage.payload.config,
          players: lastMessage.payload.players,
          playerId: lastMessage.payload.playerId,
        });
        if (lastMessage.payload.playerId) {
          const currentPlayer = lastMessage.payload.players.find(
            (p: Player) => p.id === lastMessage.payload.playerId
          );
          if (currentPlayer) {
            setPlayer(currentPlayer);
          }
        }
        break;

      case 'ROUND_START':
      case 'ROUND_UPDATE':
        setGameState(prev => ({
          ...prev,
          currentRound: lastMessage.payload.round,
        }));
        setTimeRemaining(lastMessage.payload.timeRemaining);
        break;

      case 'BET_PLACED':
        setGameState(prev => ({
          ...prev,
          currentRound: lastMessage.payload.round,
        }));
        // Update player balance if it's our bet
        if (player) {
          const myBet = lastMessage.payload.round.bets.find(
            (b: any) => b.playerId === player.id
          );
          if (myBet) {
            // Refresh player data
            sendMessage({
              type: 'SYNC_STATE',
              payload: {},
              timestamp: Date.now(),
            });
          }
        }
        break;

      case 'ROUND_END':
        setWinner({
          username: lastMessage.payload.winner.username,
          amount: lastMessage.payload.winner.amountWon,
        });
        // Refresh state after round end
        setTimeout(() => {
          sendMessage({
            type: 'SYNC_STATE',
            payload: {},
            timestamp: Date.now(),
          });
        }, 1000);
        break;

      case 'PLAYER_JOINED':
        if (lastMessage.payload.playerId === gameState.playerId) {
          setPlayer({
            id: lastMessage.payload.playerId,
            username: lastMessage.payload.username,
            balance: lastMessage.payload.balance,
          });
        }
        break;

      case 'ERROR':
        setError(lastMessage.payload.message);
        setTimeout(() => setError(null), 5000);
        break;
    }
  }, [lastMessage, player, sendMessage, gameState.playerId]);

  // Timer countdown
  useEffect(() => {
    if (!gameState.currentRound || gameState.currentRound.status === 'finished') {
      return;
    }

    const interval = setInterval(() => {
      const remaining = Math.max(
        0,
        new Date(gameState.currentRound!.endTime).getTime() - Date.now()
      );
      setTimeRemaining(remaining);
    }, 100);

    return () => clearInterval(interval);
  }, [gameState.currentRound]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    sendMessage({
      type: 'JOIN_GAME',
      payload: { username: username.trim() },
      timestamp: Date.now(),
    });
    setIsLoggedIn(true);
  };

  const handlePlaceBet = () => {
    const amount = parseInt(betAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      setError('Wprowadź prawidłową kwotę');
      return;
    }

    if (player && amount > player.balance) {
      setError('Niewystarczające środki');
      return;
    }

    sendMessage({
      type: 'PLACE_BET',
      payload: { amount },
      timestamp: Date.now(),
    });

    // Optimistically update balance
    if (player) {
      setPlayer({ ...player, balance: player.balance - amount });
    }
  };

  const handleQuickBet = (amount: number) => {
    setBetAmount(amount.toString());
  };

  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const calculateChance = (bet: { playerId: string; amount: number }): string => {
    if (!gameState.currentRound || gameState.currentRound.totalPool === 0) return '0%';
    return ((bet.amount / gameState.currentRound.totalPool) * 100).toFixed(1) + '%';
  };

  // Login screen
  if (!isLoggedIn) {
    return (
      <div className="app">
        <div className="header">
          <h1>🎰 CASINO</h1>
          <p className="subtitle">Gra Losowa z Pulą</p>
        </div>
        <form className="login-form" onSubmit={handleLogin}>
          <h2>Dołącz do gry</h2>
          <input
            type="text"
            placeholder="Wprowadź nazwę użytkownika"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
          />
          <button type="submit" disabled={!isConnected}>
            {isConnected ? 'Wejdź do kasyna' : 'Łączenie...'}
          </button>
        </form>
        <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? '● Połączono' : '○ Rozłączono'}
        </div>
      </div>
    );
  }

  // Game screen
  return (
    <div className="app">
      <div className="header">
        <h1>🎰 CASINO</h1>
        <p className="subtitle">Gra Losowa z Pulą</p>
      </div>

      <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
        {isConnected ? '● Połączono' : '○ Rozłączono'}
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="game-container">
        <div className="main-panel">
          <div className="timer-section">
            <h3>Czas do końca rundy</h3>
            <div className={`timer ${timeRemaining < 10000 ? 'warning' : ''}`}>
              {formatTime(timeRemaining)}
            </div>
          </div>

          <div className="pool-section">
            <h3>Aktualna pula</h3>
            <div className="pool-amount">
              {gameState.currentRound?.totalPool.toFixed(2) || '0.00'} 💰
            </div>
            {gameState.config && (
              <p style={{ marginTop: '10px', color: '#94a3b8', fontSize: '0.9rem' }}>
                Prowizja kasyna: {gameState.config.casinoCommissionPercent}%
              </p>
            )}
          </div>

          <div className="bet-section">
            <h3>Postaw zakład</h3>
            <div className="bet-input-group">
              <input
                type="number"
                className="bet-input"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                min={gameState.config?.minBet || 1}
                max={gameState.config?.maxBet || 10000}
              />
              <button
                className="bet-button"
                onClick={handlePlaceBet}
                disabled={!gameState.currentRound || gameState.currentRound.status === 'finished'}
              >
                Postaw
              </button>
            </div>
            <div className="quick-bets">
              {[10, 50, 100, 250, 500].map((amount) => (
                <button
                  key={amount}
                  className="quick-bet"
                  onClick={() => handleQuickBet(amount)}
                >
                  {amount}
                </button>
              ))}
              {player && (
                <button
                  className="quick-bet"
                  onClick={() => handleQuickBet(player.balance)}
                >
                  ALL IN
                </button>
              )}
            </div>
          </div>

          <div className="bets-list">
            <h3>Zakłady w tej rundzie ({gameState.currentRound?.bets.length || 0})</h3>
            {gameState.currentRound?.bets.map((bet, index) => (
              <div key={index} className="bet-item">
                <span className="username">
                  {bet.playerUsername}
                  {bet.playerId === player?.id && ' (Ty)'}
                </span>
                <span className="amount">{bet.amount} 💰</span>
                <span className="chance">{calculateChance(bet)}</span>
              </div>
            ))}
            {(!gameState.currentRound?.bets || gameState.currentRound.bets.length === 0) && (
              <p style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>
                Brak zakładów w tej rundzie
              </p>
            )}
          </div>
        </div>

        <div className="side-panel">
          <div className="player-info">
            <h3>Twoje konto</h3>
            <div className="username">{player?.username || username}</div>
            <div className="balance">{player?.balance.toFixed(2) || '1000.00'} 💰</div>
          </div>

          <div style={{ marginTop: '20px' }}>
            <h3 style={{ color: '#94a3b8', marginBottom: '15px' }}>Zasady gry</h3>
            <ul style={{ color: '#94a3b8', fontSize: '0.9rem', paddingLeft: '20px' }}>
              <li style={{ marginBottom: '10px' }}>
                Każda runda trwa {gameState.config ? gameState.config.roundDurationMs / 1000 : 60} sekund
              </li>
              <li style={{ marginBottom: '10px' }}>
                Im więcej postawisz, tym większa szansa na wygraną
              </li>
              <li style={{ marginBottom: '10px' }}>
                Zwycięzca otrzymuje całą pulę minus {gameState.config?.casinoCommissionPercent || 5}% prowizji
              </li>
              <li>
                Możesz stawiać wielokrotnie w jednej rundzie
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Winner overlay */}
      {winner && (
        <div className="winner-overlay" onClick={() => setWinner(null)}>
          <div className="winner-modal" onClick={(e) => e.stopPropagation()}>
            <h2>🎉 MAMY ZWYCIĘZCĘ! 🎉</h2>
            <div className="winner-name">{winner.username}</div>
            <div className="winner-amount">+{winner.amount.toFixed(2)} 💰</div>
            <button className="close-btn" onClick={() => setWinner(null)}>
              Kontynuuj grę
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
