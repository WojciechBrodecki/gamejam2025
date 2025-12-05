import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useWebSocket } from './hooks/useWebSocket';
import { GameState, Player, Room } from './types';
import {
  Navbar,
  Sidebar,
  GrandWager,
  LoginScreen,
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

const App: React.FC = () => {
  const { 
    isConnected, 
    lastMessage, 
    sendMessage, 
    login, 
    disconnect, 
    tryAutoLogin,
    joinRoom,
    joinRoomByCode,
    leaveRoom,
    createRoom,
    closeRoom,
  } = useWebSocket();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAutoLogging, setIsAutoLogging] = useState(true);
  const [player, setPlayer] = useState<Player | null>(null);
  const [currentGame, setCurrentGame] = useState<'grand-wager' | 'timber-fever'>('grand-wager');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [gameState, setGameState] = useState<GameState>({
    currentRound: null,
    config: null,
    players: [],
    playerId: null,
    currentRoom: null,
    availableRooms: [],
    myRooms: [],
    joinedRooms: [],
  });
  
  const [betAmount, setBetAmount] = useState<string>('10');
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [winner, setWinner] = useState<{ playerId: string; username: string; amount: number; winningNumber: number; avatar?: string | null } | null>(null);
  const [roundStatus, setRoundStatus] = useState<'waiting' | 'active' | 'finished'>('waiting');
  const [pendingRoomCode, setPendingRoomCode] = useState<string | null>(null);

  // Check for roomCode in URL on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomCode = urlParams.get('roomCode');
    if (roomCode) {
      setPendingRoomCode(roomCode);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);
  useEffect(() => {
    const savedSession = tryAutoLogin();
    if (savedSession) {
      setIsLoggedIn(true);
    }
    setIsAutoLogging(false);
  }, [tryAutoLogin]);

  // Join room by code when connected and have pending room code
  useEffect(() => {
    if (isConnected && pendingRoomCode && isLoggedIn) {
      joinRoomByCode(pendingRoomCode);
      setPendingRoomCode(null);
    }
  }, [isConnected, pendingRoomCode, isLoggedIn, joinRoomByCode]);

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
        // Store playerId and available rooms from CONNECTED
        if (lastMessage.payload.username) {
          setGameState(prev => ({
            ...prev,
            playerId: lastMessage.payload.playerId || prev.playerId,
            availableRooms: lastMessage.payload.rooms || [],
            myRooms: lastMessage.payload.myRooms || [],
            joinedRooms: lastMessage.payload.joinedRooms || [],
          }));
          // Fetch player data to get balance
          if (lastMessage.payload.playerId) {
            fetchPlayerData(lastMessage.payload.playerId);
          }
        }
        break;

      case 'ROOM_JOINED':
        // Joined a room - update state with room data
        setGameState(prev => {
          const room = lastMessage.payload.room;
          const playerId = lastMessage.payload.playerId || prev.playerId;
          
          // Add to joinedRooms if it's a private room and player is not the creator
          let newJoinedRooms = prev.joinedRooms;
          if (room.type === 'private' && room.creatorId !== playerId) {
            // Check if not already in joinedRooms
            if (!prev.joinedRooms.some(r => r.id === room.id)) {
              newJoinedRooms = [...prev.joinedRooms, room];
            }
          }
          
          return {
            ...prev,
            currentRoom: room,
            currentRound: lastMessage.payload.currentRound,
            config: lastMessage.payload.config,
            playerId: playerId,
            joinedRooms: newJoinedRooms,
          };
        });
        if (lastMessage.payload.currentRound) {
          setRoundStatus(lastMessage.payload.currentRound.status || 'waiting');
        }
        // Only show toast for private rooms
        if (lastMessage.payload.room.type === 'private') {
          toast.success(`Dołączono do pokoju: ${lastMessage.payload.room.name}`);
        }
        break;

      case 'ROOM_CREATED':
        // Created a room - update state and add to myRooms
        setGameState(prev => ({
          ...prev,
          currentRoom: lastMessage.payload.room,
          currentRound: lastMessage.payload.currentRound,
          config: lastMessage.payload.config,
          playerId: lastMessage.payload.playerId || prev.playerId,
          myRooms: [...prev.myRooms, lastMessage.payload.room],
        }));
        if (lastMessage.payload.currentRound) {
          setRoundStatus(lastMessage.payload.currentRound.status || 'waiting');
        }
        toast.success(`Utworzono pokój: ${lastMessage.payload.room.name}`);
        break;

      case 'ROOM_LEFT':
        setGameState(prev => ({
          ...prev,
          currentRoom: null,
          currentRound: null,
          config: null,
          // Remove from joinedRooms if it was there
          joinedRooms: lastMessage.payload?.roomId 
            ? prev.joinedRooms.filter(r => r.id !== lastMessage.payload.roomId)
            : prev.joinedRooms,
        }));
        setRoundStatus('waiting');
        setWinner(null);
        break;

      case 'ROOM_CLOSED':
        setGameState(prev => ({
          ...prev,
          currentRoom: null,
          currentRound: null,
          config: null,
          // Remove the closed room from myRooms and joinedRooms
          myRooms: prev.myRooms.filter(r => r.id !== lastMessage.payload.roomId),
          joinedRooms: prev.joinedRooms.filter(r => r.id !== lastMessage.payload.roomId),
        }));
        setRoundStatus('waiting');
        setWinner(null);
        toast.warning('Pokój został zamknięty');
        break;

      case 'ROOM_LIST_UPDATE':
      case 'ROOMS_LIST':
        setGameState(prev => ({
          ...prev,
          availableRooms: lastMessage.payload.rooms || [],
        }));
        break;

      case 'PLAYER_JOINED_ROOM':
        // Only show notification for private rooms
        if (gameState.currentRoom?.type === 'private') {
          toast.info(`${lastMessage.payload.username} dołączył do pokoju`);
        }
        break;

      case 'PLAYER_LEFT_ROOM':
        // Only show notification for private rooms
        if (gameState.currentRoom?.type === 'private') {
          toast.info(`${lastMessage.payload.username} opuścił pokój`);
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
        // Handle new SYNC_STATE format with rooms
        const syncRoundStatus = lastMessage.payload.currentRoom?.currentRound?.status || 'waiting';
        setRoundStatus(syncRoundStatus);
        
        setGameState(prev => ({
          ...prev,
          currentRoom: lastMessage.payload.currentRoom?.room || null,
          currentRound: lastMessage.payload.currentRoom?.currentRound || null,
          config: lastMessage.payload.currentRoom?.config || null,
          playerId: lastMessage.payload.playerId || prev.playerId,
          availableRooms: lastMessage.payload.availableRooms || [],
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

      case 'ROUND_RESULT_NOTIFICATION':
        // Personal notification about round result (for players who placed bets)
        const { isWinner, netResult, roomName, winnerUsername, currentBalance } = lastMessage.payload;
        if (isWinner) {
          toast.success(`🏆 Wygrałeś ${netResult}$ w pokoju ${roomName}!`);
        } else {
          toast.info(`Pokój ${roomName}: Wygrał ${winnerUsername}. Stracono: ${Math.abs(netResult)}$`);
        }
        // Update player balance from notification
        if (player && currentBalance !== undefined) {
          setPlayer({ ...player, balance: currentBalance });
        }
        break;

      case 'ERROR':
        console.error('Server ERROR:', lastMessage.payload);
        toast.error(lastMessage.payload.message);
        break;
    }
  }, [lastMessage, gameState.playerId]);

  useEffect(() => {
    if (!gameState.currentRound || gameState.currentRound.status === 'finished' || !gameState.currentRound.endTime) {
      return;
    }

    const interval = setInterval(() => {
      const remaining = Math.max(
        0,
        new Date(gameState.currentRound!.endTime!).getTime() - Date.now()
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
  };

  const handleLogout = () => {
    if (gameState.currentRoom) {
      leaveRoom();
    }
    disconnect();
    setIsLoggedIn(false);
    setPlayer(null);
    setGameState({
      currentRound: null,
      config: null,
      players: [],
      playerId: null,
      currentRoom: null,
      availableRooms: [],
      myRooms: [],
      joinedRooms: [],
    });
  };

  const handlePlaceBet = () => {
    if (!isConnected) {
      toast.error('Brak połączenia z serwerem');
      return;
    }

    if (!gameState.currentRoom) {
      toast.error('Najpierw dołącz do pokoju');
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

  const handleJoinRoom = (roomId: string) => {
    joinRoom(roomId);
  };

  const handleJoinRoomByCode = (inviteCode: string) => {
    joinRoomByCode(inviteCode);
  };

  const handleLeaveRoom = () => {
    leaveRoom();
  };

  const handleCreateRoom = (options: {
    name: string;
    minBet: number;
    maxBet: number;
    roundDurationMs: number;
  }) => {
    createRoom(options);
  };

  const handleCloseRoom = (roomId: string) => {
    closeRoom(roomId);
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
        currentGame={currentGame}
        onGameChange={setCurrentGame}
      />

      <MainContent>
        {currentGame === 'grand-wager' ? (
          <GrandWager
            player={player}
            currentRound={gameState.currentRound}
            config={gameState.config}
            currentRoom={gameState.currentRoom}
            availableRooms={gameState.availableRooms}
            myRooms={gameState.myRooms}
            joinedRooms={gameState.joinedRooms}
            playerId={gameState.playerId}
            timeRemaining={timeRemaining}
            betAmount={betAmount}
            onBetAmountChange={setBetAmount}
            onPlaceBet={handlePlaceBet}
            onRoomJoin={handleJoinRoom}
            onRoomJoinByCode={handleJoinRoomByCode}
            onRoomLeave={handleLeaveRoom}
            onRoomClose={handleCloseRoom}
            onRoomCreate={handleCreateRoom}
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
