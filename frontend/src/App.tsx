import React, { useState, useEffect } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { GameState, Player } from './types';
import {
  Navbar,
  Sidebar,
  GrandWager,
  NotFound,
  WinnerModal,
  LoginScreen,
  Room,
} from './components';
import './styles.css';

// Domyślne pokoje
const defaultRooms: Room[] = [
  { id: 'open-1', name: 'Główny Pokój', type: 'open-limit', minBet: 1, maxBet: 10000, playersCount: 0 },
  { id: 'open-2', name: 'High Roller', type: 'open-limit', minBet: 100, maxBet: 50000, playersCount: 0 },
  { id: '1v1-1', name: 'Arena #1', type: '1:1', minBet: 50, playersCount: 0 },
  { id: '1v1-2', name: 'Arena #2', type: '1:1', minBet: 100, playersCount: 0 },
];

const App: React.FC = () => {
  const { isConnected, lastMessage, sendMessage } = useWebSocket();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [player, setPlayer] = useState<Player | null>(null);
  const [currentGame, setCurrentGame] = useState<'grand-wager' | 'test-gra'>('grand-wager');
  const [selectedRoom, setSelectedRoom] = useState('open-1');
  const [rooms, setRooms] = useState<Room[]>(defaultRooms);
  
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
        // Update room player counts
        setRooms(prev => prev.map(room => ({
          ...room,
          playersCount: lastMessage.payload.players?.length || 0,
        })));
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
        if (player) {
          sendMessage({
            type: 'SYNC_STATE',
            payload: {},
            timestamp: Date.now(),
          });
        }
        break;

      case 'ROUND_END':
        setWinner({
          username: lastMessage.payload.winner.username,
          amount: lastMessage.payload.winner.amountWon,
        });
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

  const handleLogin = (username: string) => {
    sendMessage({
      type: 'JOIN_GAME',
      payload: { username },
      timestamp: Date.now(),
    });
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setPlayer(null);
    setGameState({
      currentRound: null,
      config: null,
      players: [],
      playerId: null,
    });
    // Reload to reset WebSocket connection
    window.location.reload();
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

    if (player) {
      setPlayer({ ...player, balance: player.balance - amount });
    }
  };

  const handleQuickBet = (amount: number) => {
    setBetAmount(amount.toString());
  };

  const handleGameChange = (game: 'grand-wager' | 'test-gra') => {
    setCurrentGame(game);
  };

  const handleAvatarChange = () => {
    // TODO: Implementacja zmiany avatara
    alert('Funkcja zmiany avatara będzie dostępna wkrótce!');
  };

  // Login screen
  if (!isLoggedIn) {
    return <LoginScreen isConnected={isConnected} onLogin={handleLogin} />;
  }

  // Main game layout
  return (
    <div className="app-layout">
      <Navbar
        casinoName="🎰 ROYAL CASINO"
        balance={player?.balance || 1000}
        username={player?.username || 'Gracz'}
        currentGame={currentGame}
        onGameChange={handleGameChange}
        onLogout={handleLogout}
        onAvatarChange={handleAvatarChange}
      />

      <div className="main-content">
        {currentGame === 'grand-wager' && (
          <Sidebar
            rooms={rooms}
            selectedRoomId={selectedRoom}
            onRoomSelect={setSelectedRoom}
          />
        )}

        <main className="game-area">
          {error && (
            <div className="error-toast">
              <span>⚠️</span>
              {error}
            </div>
          )}

          {currentGame === 'grand-wager' ? (
            <GrandWager
              player={player}
              currentRound={gameState.currentRound}
              config={gameState.config}
              timeRemaining={timeRemaining}
              betAmount={betAmount}
              onBetAmountChange={setBetAmount}
              onPlaceBet={handlePlaceBet}
              onQuickBet={handleQuickBet}
            />
          ) : (
            <NotFound
              gameName="TEST_GRA"
              onGoBack={() => setCurrentGame('grand-wager')}
            />
          )}
        </main>
      </div>

      {winner && (
        <WinnerModal
          username={winner.username}
          amount={winner.amount}
          isCurrentPlayer={winner.username === player?.username}
          onClose={() => setWinner(null)}
        />
      )}

      <div className={`connection-status-indicator ${isConnected ? 'online' : 'offline'}`}>
        <span className="status-dot"></span>
      </div>
    </div>
  );
};

export default App;
