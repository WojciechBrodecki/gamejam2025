import React, { useState } from 'react';
import styled from 'styled-components';
import { QRCodeSVG } from 'qrcode.react';
import { Player, RoomConfig, Round, Room } from '../types';
import { BASE_PATH } from '../config';
import BetWheel from './BetWheel';
import BetPanel from './BetPanel';

// Image paths - will be copied to dist/images by webpack
const getImagePath = () => {
  const basePath = process.env.NODE_ENV === 'production' ? '/casino' : '';
  return {
    lowStake: `${basePath}/images/low_stake.png`,
    highStake: `${basePath}/images/high_stake.png`,
  };
};

// SVG Icons
const ArrowLeftIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5" />
    <path d="M12 19l-7-7 7-7" />
  </svg>
);

const ShareIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
    <polyline points="16 6 12 2 8 6" />
    <line x1="12" y1="2" x2="12" y2="15" />
  </svg>
);

const MoreIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="5" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="12" cy="19" r="2" />
  </svg>
);

const GrandWagerWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 600px;
  margin: 0 auto;
  padding: 0 16px;
  position: relative;
`;

// Dashboard styles
const RoomsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;

  @media (min-width: 500px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
`;

// Public Room Card with background image
const PublicRoomCard = styled.div<{ $bgImage: string }>`
  position: relative;
  aspect-ratio: 1;
  border-radius: ${({ theme }) => theme.radius};
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  background-image: url(${props => props.$bgImage});
  background-size: cover;
  background-position: center;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      to bottom,
      rgba(0, 0, 0, 0.3) 0%,
      rgba(0, 0, 0, 0.1) 40%,
      rgba(0, 0, 0, 0.6) 100%
    );
    z-index: 1;
  }
`;

const RoomNameNotch = styled.div`
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  border-radius: 0 0 12px 12px;
  padding: 6px 16px;
  z-index: 2;
  border: 1px solid ${({ theme }) => theme.colors.gold};
  border-top: none;
`;

const RoomNameNotchText = styled.div`
  font-size: 0.85rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gold};
  text-align: center;
  white-space: nowrap;

  @media (min-width: 768px) {
    font-size: 0.95rem;
  }
`;

const RoomInfoBar = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.85);
  padding: 10px 12px;
  z-index: 2;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const RoomInfoStats = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.7rem;
  color: ${({ theme }) => theme.colors.textDim};
  margin-bottom: 8px;

  @media (min-width: 768px) {
    font-size: 0.8rem;
  }
`;

const RoomInfoStat = styled.span`
  display: flex;
  align-items: center;
  gap: 3px;
`;

const RoomJoinButton = styled.button`
  width: 100%;
  padding: 8px;
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.gold} 0%, ${({ theme }) => theme.colors.goldDim} 100%);
  color: ${({ theme }) => theme.colors.bgDark};
  border: none;
  border-radius: ${({ theme }) => theme.radiusSm};
  font-weight: 700;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  
  &:hover {
    filter: brightness(1.1);
  }

  @media (min-width: 768px) {
    padding: 10px;
    font-size: 0.85rem;
  }
`;

const RoomCard = styled.div<{ $active?: boolean }>`
  background: ${({ theme, $active }) => $active ? 'rgba(240, 192, 32, 0.15)' : theme.colors.bgCard};
  border: 2px solid ${({ theme, $active }) => $active ? theme.colors.gold : 'transparent'};
  border-radius: ${({ theme }) => theme.radius};
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: ${({ theme }) => theme.colors.bgHover};
    transform: translateY(-2px);
  }

  @media (min-width: 768px) {
    padding: 16px;
  }
`;

const RoomName = styled.div`
  font-size: 1rem;
  font-weight: 600;
  text-align: center;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 8px;
  display: flex;
  justify-content: center;
  gap: 8px;

  @media (min-width: 768px) {
    font-size: 1.1rem;
  }
`;

const RoomStats = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 0.75rem;
  justify-content: center;
  color: ${({ theme }) => theme.colors.textDim};
  margin-bottom: 12px;

  @media (min-width: 768px) {
    gap: 12px;
    font-size: 0.85rem;
  }
`;

const RoomStat = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const Divider = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 4px 0;
`;

const DividerLine = styled.div`
  flex: 1;
  height: 1px;
  background: linear-gradient(to right, transparent, ${({ theme }) => theme.colors.border}, transparent);
`;

const DividerText = styled.span`
  color: ${({ theme }) => theme.colors.gold};
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  white-space: nowrap;

  @media (min-width: 768px) {
    font-size: 0.85rem;
    letter-spacing: 2px;
  }
`;

const JoinButton = styled.button`
  width: 100%;
  padding: 8px;
  background: ${({ theme }) => theme.colors.gold};
  color: ${({ theme }) => theme.colors.bgDark};
  border: none;
  border-radius: ${({ theme }) => theme.radiusSm};
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    filter: brightness(1.1);
  }

  @media (min-width: 768px) {
    padding: 10px;
    font-size: 0.9rem;
  }
`;

const JoinCodeSection = styled.div`
  background: ${({ theme }) => theme.colors.bgCard};
  border-radius: ${({ theme }) => theme.radius};
  padding: 12px;

  @media (min-width: 768px) {
    padding: 16px;
  }
`;

const JoinCodeRow = styled.div`
  display: flex;
  gap: 8px;
`;

const JoinCodeInput = styled.input`
  flex: 1;
  min-width: 0;
  padding: 10px 12px;
  background: ${({ theme }) => theme.colors.bgDark};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radiusSm};
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 2px;
  
  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
    text-transform: none;
    letter-spacing: normal;
  }

  @media (min-width: 768px) {
    padding: 12px;
    font-size: 1rem;
  }
`;

const CreateRoomSection = styled.div`
  background: ${({ theme }) => theme.colors.bgCard};
  border-radius: ${({ theme }) => theme.radius};
  padding: 12px;

  @media (min-width: 768px) {
    padding: 16px;
  }
`;

const CreateRoomButton = styled.button`
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #2ecc71, #27ae60);
  color: white;
  border: none;
  border-radius: ${({ theme }) => theme.radiusSm};
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    filter: brightness(1.1);
    transform: translateY(-1px);
  }

  @media (min-width: 768px) {
    padding: 14px;
    font-size: 1rem;
  }
`;

// Current Room styles
const BackButton = styled.button`
  position: fixed;
  left: 20px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.text};
  font-size: 1.4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  z-index: 50;
  
  &:hover {
    background: rgba(0, 0, 0, 0.8);
    border-color: ${({ theme }) => theme.colors.gold};
    color: ${({ theme }) => theme.colors.gold};
  }

  @media (min-width: 768px) {
    width: 52px;
    height: 52px;
    font-size: 1.5rem;
  }
`;

const MenuButton = styled.button`
  position: fixed;
  right: 20px;
  top: 76px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.text};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  z-index: 51;
  
  &:hover {
    background: rgba(0, 0, 0, 0.8);
    border-color: ${({ theme }) => theme.colors.gold};
    color: ${({ theme }) => theme.colors.gold};
  }

  @media (min-width: 768px) {
    top: 84px;
    width: 48px;
    height: 48px;
  }
`;

const MenuDropdown = styled.div`
  position: fixed;
  right: 20px;
  top: 130px;
  background: ${({ theme }) => theme.colors.bgCard};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius};
  min-width: 180px;
  z-index: 100;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  overflow: hidden;

  @media (min-width: 768px) {
    top: 142px;
  }
`;

const MenuOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 99;
`;

const MenuItem = styled.button<{ $danger?: boolean; $disabled?: boolean }>`
  width: 100%;
  padding: 14px 16px;
  background: none;
  border: none;
  color: ${({ theme, $danger, $disabled }) => 
    $disabled ? theme.colors.textMuted :
    $danger ? '#e74c3c' : 
    theme.colors.text};
  font-size: 0.9rem;
  text-align: left;
  cursor: ${({ $disabled }) => $disabled ? 'not-allowed' : 'pointer'};
  display: flex;
  align-items: center;
  gap: 10px;
  transition: background 0.15s;
  opacity: ${({ $disabled }) => $disabled ? 0.5 : 1};
  
  &:hover {
    background: ${({ theme, $disabled }) => $disabled ? 'none' : theme.colors.bgHover};
  }

  &:not(:last-child) {
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
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
  myRooms: Room[];
  joinedRooms: Room[];
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
  myRooms,
  joinedRooms,
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
  const [showMenu, setShowMenu] = useState(false);

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
    const handleBack = () => {
      if (isCreator) {
        onRoomClose(currentRoom.id);
      } else {
        onRoomLeave();
      }
    };

    // Check if there are active bets (cannot delete room if someone is in pool)
    const hasActiveBets = (currentRound?.bets?.length || 0) > 0;

    return (
      <GrandWagerWrapper>
        <BackButton onClick={handleBack} title={isCreator ? 'Zamknij pokój' : 'Opuść pokój'}>
          <ArrowLeftIcon />
        </BackButton>
        
        {/* Menu only for private rooms */}
        {currentRoom.type === 'private' && (
          <>
            <MenuButton onClick={() => setShowMenu(!showMenu)}>
              <MoreIcon />
            </MenuButton>
            
            {showMenu && (
              <>
                <MenuOverlay onClick={() => setShowMenu(false)} />
                <MenuDropdown>
                  {currentRoom.inviteCode && (
                    <MenuItem onClick={() => { setShowQRModal(true); setShowMenu(false); }}>
                      <ShareIcon /> Zaproś
                    </MenuItem>
                  )}
                  {isCreator ? (
                    <MenuItem 
                      $danger 
                      $disabled={hasActiveBets}
                      onClick={() => {
                        if (!hasActiveBets) {
                          onRoomClose(currentRoom.id);
                          setShowMenu(false);
                        }
                      }}
                      title={hasActiveBets ? 'Nie można usunąć - gracze są w puli' : ''}
                    >
                      ✖ Usuń pokój {hasActiveBets && '(gracze w puli)'}
                    </MenuItem>
                  ) : (
                    <MenuItem $danger onClick={() => { onRoomLeave(); setShowMenu(false); }}>
                      ← Opuść pokój
                    </MenuItem>
                  )}
                </MenuDropdown>
              </>
            )}
          </>
        )}

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
                  value={`${window.location.origin}${BASE_PATH}?roomCode=${currentRoom.inviteCode}`}
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
  const images = getImagePath();
  
  // Helper to determine background image based on room name
  const getRoomBackground = (roomName: string): string => {
    const lowerName = roomName.toLowerCase();
    if (lowerName.includes('high') || lowerName.includes('wysok')) {
      return images.highStake;
    }
    return images.lowStake;
  };

  return (
    <GrandWagerWrapper>
      {publicRooms.length === 0 ? (
        <p style={{ color: '#888', textAlign: 'center', padding: '20px' }}>
          Brak dostępnych pokojów publicznych
        </p>
      ) : (
        <RoomsGrid>
          {publicRooms.map(room => (
            <PublicRoomCard 
              key={room.id} 
              $bgImage={getRoomBackground(room.name)}
              onClick={() => onRoomJoin(room.id)}
            >
              <RoomNameNotch>
                <RoomNameNotchText>{room.name}</RoomNameNotchText>
              </RoomNameNotch>
              <RoomInfoBar>
                <RoomInfoStats>
                  <RoomInfoStat>🎲 {room.currentBetterCount || 0}/{room.maxPlayers}</RoomInfoStat>
                  <RoomInfoStat>💰 ${room.minBet}-${room.maxBet}</RoomInfoStat>
                  <RoomInfoStat>⏱️ {room.roundDurationMs / 1000}s</RoomInfoStat>
                </RoomInfoStats>
                <RoomJoinButton>Dołącz do gry</RoomJoinButton>
              </RoomInfoBar>
            </PublicRoomCard>
          ))}
        </RoomsGrid>
      )}

      <Divider>
        <DividerLine />
        <DividerText>⚔️ 1v1</DividerText>
        <DividerLine />
      </Divider>

      <JoinCodeSection>
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

      <Divider>
        <DividerLine />
        <DividerText>lub stwórz</DividerText>
        <DividerLine />
      </Divider>

      <CreateRoomSection>
        <CreateRoomButton onClick={() => setShowCreateModal(true)}>
          + Utwórz prywatny pokój
        </CreateRoomButton>
      </CreateRoomSection>

      {/* My Rooms Section */}
      {myRooms.length > 0 && (
        <>
          <Divider>
            <DividerLine />
            <DividerText>🔒 Moje pokoje</DividerText>
            <DividerLine />
          </Divider>
          <RoomsGrid>
            {myRooms.map(room => (
              <RoomCard key={room.id} onClick={() => onRoomJoin(room.id)}>
                <RoomName>🔒 {room.name}</RoomName>
                <RoomStats>
                  <RoomStat>👥 {room.playerCount}/2</RoomStat>
                  <RoomStat>💰 ${room.minBet}-${room.maxBet}</RoomStat>
                  <RoomStat>🔑 {room.inviteCode}</RoomStat>
                </RoomStats>
                <JoinButton>Wejdź do pokoju</JoinButton>
              </RoomCard>
            ))}
          </RoomsGrid>
        </>
      )}

      {/* Joined Rooms Section */}
      {joinedRooms.length > 0 && (
        <>
          <Divider>
            <DividerLine />
            <DividerText>🎮 Dołączone pokoje</DividerText>
            <DividerLine />
          </Divider>
          <RoomsGrid>
            {joinedRooms.map(room => (
              <RoomCard key={room.id} onClick={() => onRoomJoin(room.id)}>
                <RoomName>🎮 {room.name}</RoomName>
                <RoomStats>
                  <RoomStat>👥 {room.playerCount}/2</RoomStat>
                  <RoomStat>💰 ${room.minBet}-${room.maxBet}</RoomStat>
                </RoomStats>
                <JoinButton>Wejdź do pokoju</JoinButton>
              </RoomCard>
            ))}
          </RoomsGrid>
        </>
      )}

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
