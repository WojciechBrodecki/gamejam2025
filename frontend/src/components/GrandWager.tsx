import React, { useState } from 'react';
import styled from 'styled-components';
import { QRCodeSVG } from 'qrcode.react';
import { Player, RoomConfig, Round, Room } from '../types';
import BetWheel from './BetWheel';
import BetPanel from './BetPanel';

const GrandWagerWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 600px;
  margin: 0 auto;
  padding: 0 16px;
`;

// Dashboard styles
const DashboardTitle = styled.h2`
  text-align: center;
  color: ${({ theme }) => theme.colors.gold};
  font-size: 1.8rem;
  margin-bottom: 8px;
`;

const DashboardSubtitle = styled.p`
  text-align: center;
  color: ${({ theme }) => theme.colors.textDim};
  margin-bottom: 24px;
`;

const SectionTitle = styled.h3`
  color: ${({ theme }) => theme.colors.text};
  font-size: 1.1rem;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const RoomsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const RoomCard = styled.div<{ $active?: boolean }>`
  background: ${({ theme, $active }) => $active ? 'rgba(240, 192, 32, 0.15)' : theme.colors.bgCard};
  border: 2px solid ${({ theme, $active }) => $active ? theme.colors.gold : 'transparent'};
  border-radius: ${({ theme }) => theme.radius};
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: ${({ theme }) => theme.colors.bgHover};
    transform: translateY(-2px);
  }
`;

const RoomName = styled.div`
  font-size: 1.1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const RoomStats = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.textDim};
  margin-bottom: 12px;
`;

const RoomStat = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const JoinButton = styled.button`
  width: 100%;
  padding: 10px;
  background: ${({ theme }) => theme.colors.gold};
  color: ${({ theme }) => theme.colors.bgDark};
  border: none;
  border-radius: ${({ theme }) => theme.radiusSm};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    filter: brightness(1.1);
  }
`;

const JoinCodeSection = styled.div`
  background: ${({ theme }) => theme.colors.bgCard};
  border-radius: ${({ theme }) => theme.radius};
  padding: 16px;
  margin-bottom: 24px;
`;

const JoinCodeRow = styled.div`
  display: flex;
  gap: 8px;
`;

const JoinCodeInput = styled.input`
  flex: 1;
  padding: 12px;
  background: ${({ theme }) => theme.colors.bgDark};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radiusSm};
  color: ${({ theme }) => theme.colors.text};
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 2px;
  
  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
    text-transform: none;
    letter-spacing: normal;
  }
`;

const CreateRoomSection = styled.div`
  background: ${({ theme }) => theme.colors.bgCard};
  border-radius: ${({ theme }) => theme.radius};
  padding: 16px;
  margin-bottom: 24px;
`;

const CreateRoomButton = styled.button`
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #2ecc71, #27ae60);
  color: white;
  border: none;
  border-radius: ${({ theme }) => theme.radiusSm};
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    filter: brightness(1.1);
    transform: translateY(-1px);
  }
`;

// Current Room styles
const CurrentRoomHeader = styled.div`
  background: rgba(240, 192, 32, 0.1);
  border: 1px solid ${({ theme }) => theme.colors.gold};
  border-radius: ${({ theme }) => theme.radius};
  padding: 16px;
  margin-bottom: 16px;
`;

const CurrentRoomTitle = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const CurrentRoomName = styled.h3`
  color: ${({ theme }) => theme.colors.gold};
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CurrentRoomStats = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.textDim};
  margin-bottom: 12px;
`;

const CurrentRoomActions = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const ActionButton = styled.button<{ $variant?: 'danger' | 'info' }>`
  padding: 8px 16px;
  background: ${({ $variant }) => 
    $variant === 'danger' ? '#c0392b' : 
    $variant === 'info' ? '#2980b9' : 
    '#7f8c8d'};
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    filter: brightness(1.1);
  }
`;

// Modal styles
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const ModalContent = styled.div`
  background: ${({ theme }) => theme.colors.bgCard};
  border-radius: ${({ theme }) => theme.radius};
  padding: 24px;
  width: 100%;
  max-width: 400px;
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalTitle = styled.h3`
  color: ${({ theme }) => theme.colors.gold};
  font-size: 1.3rem;
  margin-bottom: 20px;
  text-align: center;
`;

const ModalLabel = styled.label`
  display: block;
  color: ${({ theme }) => theme.colors.textDim};
  font-size: 0.85rem;
  margin-bottom: 4px;
  margin-top: 12px;
`;

const ModalInput = styled.input`
  width: 100%;
  padding: 12px;
  background: ${({ theme }) => theme.colors.bgDark};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radiusSm};
  color: ${({ theme }) => theme.colors.text};
  font-size: 1rem;
  
  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }
`;

const ModalButtonRow = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 24px;
`;

const ModalButton = styled.button<{ $primary?: boolean }>`
  flex: 1;
  padding: 12px;
  background: ${({ $primary, theme }) => $primary ? theme.colors.gold : 'transparent'};
  color: ${({ $primary, theme }) => $primary ? theme.colors.bgDark : theme.colors.text};
  border: 1px solid ${({ $primary, theme }) => $primary ? 'transparent' : theme.colors.border};
  border-radius: ${({ theme }) => theme.radiusSm};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    filter: brightness(1.1);
  }
`;

interface Winner {
  playerId: string;
  username: string;
  amount: number;
  winningNumber: number;
}

interface GrandWagerProps {
  player: Player | null;
  currentRound: Round | null;
  config: RoomConfig | null;
  currentRoom: Room | null;
  availableRooms: Room[];
  playerId: string | null;
  timeRemaining: number;
  betAmount: string;
  onBetAmountChange: (amount: string) => void;
  onPlaceBet: () => void;
  onRoomJoin: (roomId: string) => void;
  onRoomJoinByCode: (inviteCode: string) => void;
  onRoomLeave: () => void;
  onRoomClose: (roomId: string) => void;
  onRoomCreate: (options: {
    name: string;
    minBet: number;
    maxBet: number;
    roundDurationMs: number;
  }) => void;
  winner: Winner | null;
  roundStatus: 'waiting' | 'active' | 'finished';
  onWinnerShown?: () => void;
}

const GrandWager: React.FC<GrandWagerProps> = ({
  player,
  currentRound,
  config,
  currentRoom,
  availableRooms,
  playerId,
  timeRemaining,
  betAmount,
  onBetAmountChange,
  onPlaceBet,
  onRoomJoin,
  onRoomJoinByCode,
  onRoomLeave,
  onRoomClose,
  onRoomCreate,
  winner,
  roundStatus,
  onWinnerShown,
}) => {
  const [joinCode, setJoinCode] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  
  // Create room form state
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomMinBet, setNewRoomMinBet] = useState('10');
  const [newRoomMaxBet, setNewRoomMaxBet] = useState('1000');
  const [newRoomRoundDuration, setNewRoomRoundDuration] = useState('60');

  const publicRooms = availableRooms.filter(r => r.type === 'public');

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

  const handleJoinByCode = () => {
    if (!joinCode.trim()) return;
    onRoomJoinByCode(joinCode.trim().toUpperCase());
    setJoinCode('');
  };

  const handleCreateRoom = () => {
    if (!newRoomName.trim()) return;
    
    const roundDurationSec = parseInt(newRoomRoundDuration) || 60;
    const clampedDuration = Math.max(10, Math.min(600, roundDurationSec));
    
    onRoomCreate({
      name: newRoomName.trim(),
      minBet: parseInt(newRoomMinBet) || 10,
      maxBet: parseInt(newRoomMaxBet) || 1000,
      roundDurationMs: clampedDuration * 1000,
    });
    
    setShowCreateModal(false);
    setNewRoomName('');
  };

  const isCreator = currentRoom?.type === 'private' && currentRoom?.creatorId === playerId;

  // If in a room, show the game
  if (currentRoom) {
    return (
      <GrandWagerWrapper>
        <CurrentRoomHeader>
          <CurrentRoomTitle>
            <CurrentRoomName>
              {currentRoom.name}
              {currentRoom.type === 'private' && ' 🔒'}
            </CurrentRoomName>
          </CurrentRoomTitle>
          <CurrentRoomStats>
            <span>👥 {currentRoom.playerCount} w pokoju</span>
            <span>🎲 {currentRoom.currentBetterCount || 0}/{currentRoom.maxPlayers} graczy</span>
            <span>💰 ${config?.minBet || currentRoom.minBet} - ${config?.maxBet || currentRoom.maxBet}</span>
          </CurrentRoomStats>
          <CurrentRoomActions>
            {currentRoom.inviteCode && (
              <>
                <ActionButton $variant="info" onClick={() => setShowQRModal(true)}>
                  📱 QR Kod
                </ActionButton>
                <span style={{ color: '#888', fontSize: '0.85rem', alignSelf: 'center' }}>
                  Kod: <strong style={{ color: '#f1c40f' }}>{currentRoom.inviteCode}</strong>
                </span>
              </>
            )}
            {isCreator ? (
              <ActionButton $variant="danger" onClick={() => onRoomClose(currentRoom.id)}>
                Zamknij pokój
              </ActionButton>
            ) : (
              <ActionButton onClick={onRoomLeave}>
                Opuść pokój
              </ActionButton>
            )}
          </CurrentRoomActions>
        </CurrentRoomHeader>

        <BetWheel
          bets={currentRound?.bets || []}
          totalPool={currentRound?.totalPool || 0}
          timeRemaining={timeRemaining}
          currentPlayerId={player?.id || null}
          winner={winner}
          onWinnerShown={onWinnerShown}
        />

        <BetPanel
          betAmount={betAmount}
          onBetAmountChange={onBetAmountChange}
          onPlaceBet={onPlaceBet}
          playerBalance={player?.balance ?? 1000}
          playerTotalBet={getPlayerTotalBet()}
          playerChance={getPlayerChance()}
          isDisabled={roundStatus === 'finished' || !!winner}
          minBet={config?.minBet}
          maxBet={config?.maxBet}
        />

        {/* QR Code Modal */}
        {showQRModal && currentRoom.inviteCode && (
          <ModalOverlay onClick={() => setShowQRModal(false)}>
            <ModalContent onClick={e => e.stopPropagation()} style={{ textAlign: 'center' }}>
              <ModalTitle>Zaproszenie do pokoju</ModalTitle>
              <p style={{ color: '#aaa', marginBottom: '16px' }}>
                Zeskanuj kod QR aby dołączyć do pokoju <strong>{currentRoom.name}</strong>
              </p>
              <div style={{ 
                background: 'white', 
                padding: '16px', 
                borderRadius: '8px', 
                display: 'inline-block',
                marginBottom: '16px'
              }}>
                <QRCodeSVG 
                  value={`${window.location.origin}?roomCode=${currentRoom.inviteCode}`}
                  size={200}
                  level="H"
                />
              </div>
              <p style={{ color: '#888', fontSize: '12px', marginBottom: '8px' }}>
                Lub podziel się kodem:
              </p>
              <p style={{ 
                color: '#f1c40f', 
                fontSize: '24px', 
                fontWeight: 'bold',
                letterSpacing: '4px',
                marginBottom: '16px'
              }}>
                {currentRoom.inviteCode}
              </p>
              <ModalButton onClick={() => setShowQRModal(false)}>
                Zamknij
              </ModalButton>
            </ModalContent>
          </ModalOverlay>
        )}
      </GrandWagerWrapper>
    );
  }

  // Dashboard - no room selected
  return (
    <GrandWagerWrapper>
      <DashboardTitle>🎰 Grand Wager</DashboardTitle>
      <DashboardSubtitle>Dołącz do pokoju publicznego lub stwórz własny pojedynek 1v1</DashboardSubtitle>

      {/* Join by code */}
      <JoinCodeSection>
        <SectionTitle>🔑 Dołącz przez kod</SectionTitle>
        <JoinCodeRow>
          <JoinCodeInput
            type="text"
            placeholder="Wpisz kod zaproszenia"
            value={joinCode}
            onChange={e => setJoinCode(e.target.value.toUpperCase())}
            maxLength={6}
            onKeyDown={e => e.key === 'Enter' && handleJoinByCode()}
          />
          <JoinButton onClick={handleJoinByCode} style={{ width: 'auto', padding: '12px 24px' }}>
            Dołącz
          </JoinButton>
        </JoinCodeRow>
      </JoinCodeSection>

      {/* Public rooms */}
      <SectionTitle>🌐 Pokoje publiczne ({publicRooms.length})</SectionTitle>
      {publicRooms.length === 0 ? (
        <p style={{ color: '#888', textAlign: 'center', padding: '20px' }}>
          Brak dostępnych pokojów publicznych
        </p>
      ) : (
        <RoomsGrid>
          {publicRooms.map(room => (
            <RoomCard key={room.id} onClick={() => onRoomJoin(room.id)}>
              <RoomName>{room.name}</RoomName>
              <RoomStats>
                <RoomStat>👥 {room.playerCount} w pokoju</RoomStat>
                <RoomStat>🎲 {room.currentBetterCount || 0}/{room.maxPlayers} graczy</RoomStat>
                <RoomStat>💰 ${room.minBet}-${room.maxBet}</RoomStat>
                <RoomStat>⏱️ {room.roundDurationMs / 1000}s</RoomStat>
              </RoomStats>
              <JoinButton>Dołącz do gry</JoinButton>
            </RoomCard>
          ))}
        </RoomsGrid>
      )}

      {/* Create private room */}
      <CreateRoomSection>
        <SectionTitle>⚔️ Stwórz pojedynek 1v1</SectionTitle>
        <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '12px' }}>
          Utwórz prywatny pokój i zaproś znajomego za pomocą kodu lub QR
        </p>
        <CreateRoomButton onClick={() => setShowCreateModal(true)}>
          + Utwórz prywatny pokój
        </CreateRoomButton>
      </CreateRoomSection>

      {/* Create Room Modal */}
      {showCreateModal && (
        <ModalOverlay onClick={() => setShowCreateModal(false)}>
          <ModalContent onClick={e => e.stopPropagation()}>
            <ModalTitle>Nowy pojedynek 1v1</ModalTitle>
            
            <ModalLabel>Nazwa pokoju</ModalLabel>
            <ModalInput
              type="text"
              placeholder="np. Wysoki poziom"
              value={newRoomName}
              onChange={e => setNewRoomName(e.target.value)}
            />
            
            <ModalLabel>Minimalny zakład ($)</ModalLabel>
            <ModalInput
              type="number"
              min="1"
              value={newRoomMinBet}
              onChange={e => setNewRoomMinBet(e.target.value)}
            />
            
            <ModalLabel>Maksymalny łączny zakład ($)</ModalLabel>
            <ModalInput
              type="number"
              min="1"
              value={newRoomMaxBet}
              onChange={e => setNewRoomMaxBet(e.target.value)}
            />
            
            <ModalLabel>Czas rundy (sekundy)</ModalLabel>
            <ModalInput
              type="number"
              min="10"
              max="600"
              value={newRoomRoundDuration}
              onChange={e => setNewRoomRoundDuration(e.target.value)}
              placeholder="60"
            />
            
            <ModalButtonRow>
              <ModalButton onClick={() => setShowCreateModal(false)}>
                Anuluj
              </ModalButton>
              <ModalButton $primary onClick={handleCreateRoom}>
                Utwórz
              </ModalButton>
            </ModalButtonRow>
          </ModalContent>
        </ModalOverlay>
      )}
    </GrandWagerWrapper>
  );
};

export default GrandWager;
