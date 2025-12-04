import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useWebSocket } from './hooks/useWebSocket';
import { GameState, Player } from './types';
import {
  Navbar,
  Sidebar,
  GrandWager,
  LoginScreen,
  Room,
  TimberFever,
} from './components';
import {
  AppWrapper,
  MainContent,
  ConnectionDot,
  FullScreenLoader,
  Spinner,
  LoaderText,
} from './styles/App.styles';
import { API_BASE_URL } from './config';

const defaultRooms: Room[] = [
  { id: 'open-1', name: 'Główny Pokój', type: 'open-limit', minBet: 1, maxBet: 10000, playersCount: 0 },
  { id: 'open-2', name: 'High Roller', type: 'open-limit', minBet: 100, maxBet: 50000, playersCount: 0 },
  { id: '1v1-1', name: 'Arena #1', type: '1:1', minBet: 50, playersCount: 0 },
  { id: '1v1-2', name: 'Arena #2', type: '1:1', minBet: 100, playersCount: 0 },
];

const App: React.FC = () => {
  const { isConnected, lastMessage, sendMessage, login, disconnect, tryAutoLogin } = useWebSocket();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAutoLogging, setIsAutoLogging] = useState(true);
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
  const [winner, setWinner] = useState<{ playerId: string; username: string; amount: number; winningNumber: number; avatar?: string | null } | null>(null);
  const [roundStatus, setRoundStatus] = useState<'waiting' | 'active' | 'finished'>('waiting');

  // Try auto-login on mount
  useEffect(() => {
    const savedSession = tryAutoLogin();
    if (savedSession) {
      setIsLoggedIn(true);
    }
    setIsAutoLogging(false);
  }, [tryAutoLogin]);

  // Fetch player data from API when we get playerId
  const fetchPlayerData = async (playerId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/player/${playerId}`);
      const data = await response.json();
      if (data.success && data.data) {
        setPlayer(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch player data:', error);
    }
  };

  useEffect(() => {
    if (!lastMessage) return;

    switch (lastMessage.type) {
      case 'CONNECTED':
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
        // Pobierz roundStatus z SYNC_STATE
        const syncRoundStatus = lastMessage.payload.currentRound?.status || 'waiting';
        setRoundStatus(syncRoundStatus);
        
        setGameState(prev => ({
          ...prev,
          currentRound: lastMessage.payload.currentRound,
          config: lastMessage.payload.config,
          playerId: lastMessage.payload.playerId,
        }));
        
        // Fetch player data from API
        if (lastMessage.payload.playerId) {
          fetchPlayerData(lastMessage.payload.playerId);
        }
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
        // Refresh player balance after bet
        if (gameState.playerId) {
          fetchPlayerData(gameState.playerId);
        }
        break;

      case 'ROUND_END':
        setRoundStatus('finished');
        setWinner({
          playerId: lastMessage.payload.winner.playerId,
          username: lastMessage.payload.winner.username,
          amount: lastMessage.payload.winner.amountWon,
          winningNumber: lastMessage.payload.winningNumber,
          avatar: lastMessage.payload.winner.avatar,
        });
        // Refresh player balance after round end (might have won)
        if (gameState.playerId) {
          fetchPlayerData(gameState.playerId);
        }
        break;

      case 'ERROR':
        console.error('Server ERROR:', lastMessage.payload);
        toast.error(lastMessage.payload.message);
        break;
    }
  }, [lastMessage, gameState.playerId]);

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

  const handleLogin = async (username: string, avatar?: File) => {
    const result = await login(username, avatar);
    
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

  // Show loading while checking for saved session
  if (isAutoLogging) {
    return (
      <AppWrapper>
        <FullScreenLoader>
          <Spinner />
          <LoaderText>Ładowanie...</LoaderText>
        </FullScreenLoader>
      </AppWrapper>
    );
  }

  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // Check if we have all required data (player info - balance is the key indicator that SYNC_STATE was received)
  const isDataLoaded = player !== null && player.balance !== undefined;

  return (
    <AppWrapper>
      {/* Full screen loader while waiting for player data */}
      {!isDataLoaded && (
        <FullScreenLoader>
          <Spinner />
          <LoaderText>Ładowanie danych gry...</LoaderText>
        </FullScreenLoader>
      )}
      
      <Navbar
        balance={player?.balance || 1000}
        username={player?.username || 'Gracz'}
        playerId={player?.id || gameState.playerId}
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
              // Resetuj winner i roundStatus po pokazaniu
              setWinner(null);
              setRoundStatus('waiting');
              // Sync state żeby dostać nową rundę
              sendMessage({
                type: 'SYNC_STATE',
                payload: {},
                timestamp: Date.now(),
              });
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
