import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useWebSocket } from './hooks/useWebSocket';
import { GameState, Player } from './types';
import {
  Navbar,
  Sidebar,
  GrandWager,
  NotFound,
  LoginScreen,
  Room,
  TimberFever,
} from './components';
import {
  AppWrapper,
  MainContent,
  ConnectionDot,
} from './styles/App.styles';

const defaultRooms: Room[] = [
  { id: 'open-1', name: 'Główny Pokój', type: 'open-limit', minBet: 1, maxBet: 10000, playersCount: 0 },
  { id: 'open-2', name: 'High Roller', type: 'open-limit', minBet: 100, maxBet: 50000, playersCount: 0 },
  { id: '1v1-1', name: 'Arena #1', type: '1:1', minBet: 50, playersCount: 0 },
  { id: '1v1-2', name: 'Arena #2', type: '1:1', minBet: 100, playersCount: 0 },
];

const App: React.FC = () => {
  const { isConnected, lastMessage, sendMessage, login, disconnect } = useWebSocket();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [player, setPlayer] = useState<Player | null>(null);
  const [currentGame, setCurrentGame] = useState<'grand-wager' | 'timber-fever'>('grand-wager');
  const [selectedRoom, setSelectedRoom] = useState('open-1');
  const [rooms, setRooms] = useState<Room[]>(defaultRooms);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [gameState, setGameState] = useState<GameState>({
    currentRound: null,
    config: null,
    players: [],
    playerId: null,
  });
  
  const [betAmount, setBetAmount] = useState<string>('10');
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [winner, setWinner] = useState<{ playerId: string; username: string; amount: number } | null>(null);
  const [roundStatus, setRoundStatus] = useState<'waiting' | 'active' | 'finished'>('waiting');

  useEffect(() => {
    if (!lastMessage) return;

    switch (lastMessage.type) {
      case 'CONNECTED':
        // Set round status from CONNECTED message
        if (lastMessage.payload.roundStatus) {
          setRoundStatus(lastMessage.payload.roundStatus);
        }
        // Store playerId from CONNECTED (username matches our login)
        if (lastMessage.payload.username) {
          setGameState(prev => ({
            ...prev,
            playerId: lastMessage.payload.playerId || prev.playerId,
          }));
        }
        break;

      case 'ROUND_WAITING':
        setRoundStatus('waiting');
        setGameState(prev => ({
          ...prev,
          currentRound: lastMessage.payload.round,
        }));
        break;

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
        setRooms(prev => prev.map(room => ({
          ...room,
          playersCount: lastMessage.payload.players?.length || 0,
        })));
        break;

      case 'ROUND_START':
        setRoundStatus('active');
        setGameState(prev => ({
          ...prev,
          currentRound: lastMessage.payload.round,
        }));
        setTimeRemaining(lastMessage.payload.timeRemaining);
        break;

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
        setRoundStatus('finished');
        setWinner({
          playerId: lastMessage.payload.winner.playerId,
          username: lastMessage.payload.winner.username,
          amount: lastMessage.payload.winner.amountWon,
        });
        break;

      case 'PLAYER_JOINED':
        // Set player data from PLAYER_JOINED - includes balance
        // Check by username since we might not have playerId yet
        const joinedUsername = lastMessage.payload.username;
        if (lastMessage.payload.playerId === gameState.playerId || 
            (player && player.username === joinedUsername) ||
            (!player && joinedUsername)) {
          setPlayer({
            id: lastMessage.payload.playerId,
            username: lastMessage.payload.username,
            balance: lastMessage.payload.balance,
          });
          setGameState(prev => ({
            ...prev,
            playerId: lastMessage.payload.playerId,
          }));
        }
        break;

      case 'ERROR':
        console.error('Server ERROR:', lastMessage.payload);
        toast.error(lastMessage.payload.message);
        break;
    }
  }, [lastMessage, player, sendMessage, gameState.playerId]);

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

  const handleLogin = async (username: string) => {
    console.log('handleLogin called with username:', username);
    
    const result = await login(username);
    
    if (!result.success) {
      toast.error(result.error || 'Nie udało się zalogować');
      return;
    }
    
    setIsLoggedIn(true);
    toast.success('Zalogowano pomyślnie!');
  };

  const handleLogout = () => {
    disconnect();
    setIsLoggedIn(false);
    setPlayer(null);
    setGameState({
      currentRound: null,
      config: null,
      players: [],
      playerId: null,
    });
  };

  const handlePlaceBet = () => {
    console.log('handlePlaceBet called, isConnected:', isConnected);
    
    if (!isConnected) {
      toast.error('Brak połączenia z serwerem');
      return;
    }

    const amount = parseInt(betAmount, 10);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Wprowadź prawidłową kwotę');
      return;
    }

    if (player && amount > player.balance) {
      toast.error('Niewystarczające środki');
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

  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <AppWrapper>
      <Navbar
        balance={player?.balance || 1000}
        username={player?.username || 'Gracz'}
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        onLogout={handleLogout}
      />

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        rooms={rooms}
        selectedRoomId={selectedRoom}
        onRoomSelect={setSelectedRoom}
        currentGame={currentGame}
        onGameChange={setCurrentGame}
      />

      <MainContent>
        {currentGame === 'grand-wager' ? (
          <GrandWager
            player={player}
            currentRound={gameState.currentRound}
            config={gameState.config}
            timeRemaining={timeRemaining}
            betAmount={betAmount}
            onBetAmountChange={setBetAmount}
            onPlaceBet={handlePlaceBet}
            winner={winner}
            roundStatus={roundStatus}
            onWinnerShown={() => {
              setTimeout(() => {
                setWinner(null);
                sendMessage({
                  type: 'SYNC_STATE',
                  payload: {},
                  timestamp: Date.now(),
                });
              }, 3000);
            }}
          />
        ) : (
          <TimberFever playerBalance={player?.balance || 1000} />
        )}
      </MainContent>

      <ConnectionDot $online={isConnected} />
      
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </AppWrapper>
  );
};

export default App;
