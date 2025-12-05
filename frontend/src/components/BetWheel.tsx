import React, { useMemo, useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../config';
import {
  WheelContainer,
  WheelWrapper,
  WheelPointer,
  WheelSvg,
  TimerCenter,
  TimerValue,
  TimerLabel,
  PoolInfo,
  PoolLabel,
  PoolValue,
  WinnerOverlay,
  WinnerIcon,
  WinnerAvatar,
  WinnerTitle,
  WinnerName,
  WinnerAmount,
  WinnerChance,
  PlayersLegend,
  PlayerLegendItem,
  PlayerLegendAvatar,
  PlayerPercent,
} from '../styles/BetWheel.styles';

// Kolor dla zalogowanego gracza
const CURRENT_PLAYER_COLOR = '#f0c020'; // gold

// Odcienie szarości dla innych graczy
const OTHER_PLAYER_COLORS = [
  '#8a8a9a', // jasny szary
  '#6a6a7a', // średni szary
  '#5a5a6a', // ciemniejszy szary
  '#7a7a8a', // szary niebieski
  '#9a9aaa', // bardzo jasny szary
  '#4a4a5a', // ciemny szary
  '#aaaaба', // srebrzysty
  '#606070', // stalowy
];

interface Bet {
  playerId: string;
  playerUsername: string;
  amount: number;
}

interface Winner {
  playerId: string;
  username: string;
  amount: number;
  winningNumber: number;
  avatar?: string | null;
  totalPool?: number;
}

interface BetWheelProps {
  bets: Bet[];
  totalPool: number;
  timeRemaining: number;
  currentPlayerId: string | null;
  winner: Winner | null;
  onWinnerShown?: () => void;
}

interface AggregatedBet {
  playerId: string;
  username: string;
  totalAmount: number;
  percent: number;
  color: string;
}

const BetWheel: React.FC<BetWheelProps> = ({
  bets,
  totalPool,
  timeRemaining,
  currentPlayerId,
  winner,
  onWinnerShown,
}) => {
  // Stan animacji
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showWinnerPopup, setShowWinnerPopup] = useState(false);
  
  // Zapamiętane dane do wyświetlenia podczas animacji
  const [displayBets, setDisplayBets] = useState<Bet[]>([]);
  const [displayPool, setDisplayPool] = useState(0);
  const [winnerData, setWinnerData] = useState<{chance: number; color: string} | null>(null);
  
  // Ref do śledzenia czy już obsłużyliśmy tego winnera
  const lastWinnerIdRef = useRef<string | null>(null);
  const animationRef = useRef<number | null>(null);
  
  // Ref do przechowywania ostatnich niepustych bets (dla przypadku gdy ROUND_WAITING przychodzi przed animacją)
  const lastValidBetsRef = useRef<{bets: Bet[], totalPool: number}>({bets: [], totalPool: 0});
  
  // Zapisuj ostatnie niepuste bets - ale NIE resetuj ich aż do końca animacji
  useEffect(() => {
    // Zapisuj tylko jeśli nie jesteśmy w trakcie animacji
    if (bets.length > 0 && totalPool > 0 && !isSpinning && !showWinnerPopup) {
      lastValidBetsRef.current = {bets: [...bets], totalPool};
    }
  }, [bets, totalPool, isSpinning, showWinnerPopup]);

  // Agreguj zakłady per gracz - używaj displayBets podczas animacji
  const activeBets = isSpinning || showWinnerPopup ? displayBets : bets;
  const activePool = isSpinning || showWinnerPopup ? displayPool : totalPool;

  const aggregatedBets = useMemo(() => {
    const byPlayer: Record<string, AggregatedBet> = {};
    let otherColorIndex = 0;
    
    activeBets.forEach((bet) => {
      if (!byPlayer[bet.playerId]) {
        // Zalogowany gracz ma złoty kolor, reszta odcienie szarości
        const isCurrentPlayer = bet.playerId === currentPlayerId;
        const color = isCurrentPlayer 
          ? CURRENT_PLAYER_COLOR 
          : OTHER_PLAYER_COLORS[otherColorIndex++ % OTHER_PLAYER_COLORS.length];
        
        byPlayer[bet.playerId] = {
          playerId: bet.playerId,
          username: bet.playerUsername,
          totalAmount: 0,
          percent: 0,
          color,
        };
      }
      byPlayer[bet.playerId].totalAmount += bet.amount;
    });

    Object.values(byPlayer).forEach(player => {
      player.percent = activePool > 0 ? (player.totalAmount / activePool) * 100 : 0;
    });

    // Nie sortujemy - zachowujemy kolejność w jakiej gracze obstawiali
    // żeby była zgodna z kolejnością w jakiej backend liczy winningNumber
    return Object.values(byPlayer);
  }, [activeBets, activePool, currentPlayerId]);

  // Główna logika animacji - reaguj na nowego winnera
  useEffect(() => {
    console.log('[BetWheel] useEffect triggered, winner:', winner ? 'yes' : 'no', 'lastWinnerIdRef:', lastWinnerIdRef.current);
    
    if (!winner) {
      // Reset gdy winner zniknie
      lastWinnerIdRef.current = null;
      return;
    }

    // Unikalna identyfikacja winnera
    const winnerId = `${winner.playerId}-${winner.winningNumber}`;
    
    console.log('[BetWheel] Checking winnerId:', winnerId, 'vs lastWinnerIdRef:', lastWinnerIdRef.current);
    
    // Jeśli już obsłużyliśmy tego winnera, nic nie rób
    if (lastWinnerIdRef.current === winnerId) {
      console.log('[BetWheel] Already handled this winner, skipping');
      return;
    }
    
    // Użyj aktualnych bets jeśli są dostępne, lub ostatnich zapisanych
    const sourceBets = bets.length > 0 ? bets : lastValidBetsRef.current.bets;
    // Użyj totalPool z winner jeśli jest dostępny (najbardziej wiarygodne), potem aktualne, potem zapisane
    const sourcePool = winner.totalPool || (totalPool > 0 ? totalPool : lastValidBetsRef.current.totalPool);
    
    console.log('[BetWheel] Winner received:', { 
      winnerId, 
      'winner.totalPool': winner.totalPool, 
      totalPool, 
      'lastValidBetsRef.totalPool': lastValidBetsRef.current.totalPool,
      sourcePool,
      'bets.length': bets.length,
      'sourceBets.length': sourceBets.length
    });
    
    // Sprawdź czy mamy dane do animacji - potrzebujemy tylko totalPool (bets są opcjonalne dla wizualizacji)
    if (sourcePool === 0) {
      console.warn('[BetWheel] No totalPool available for animation, skipping');
      return;
    }
    lastWinnerIdRef.current = winnerId;
    
    console.log('[BetWheel] Starting animation for winner:', winnerId);

    // Zamroź dane - jeśli nie mamy bets, użyj pustej tablicy (koło będzie puste ale animacja zadziała)
    setDisplayBets([...sourceBets]);
    setDisplayPool(sourcePool);

    // Oblicz dane o zwycięzcy
    const byPlayer: Record<string, AggregatedBet> = {};
    let otherColorIdx = 0;
    sourceBets.forEach((bet) => {
      if (!byPlayer[bet.playerId]) {
        const isCurrentPlayer = bet.playerId === currentPlayerId;
        const color = isCurrentPlayer 
          ? CURRENT_PLAYER_COLOR 
          : OTHER_PLAYER_COLORS[otherColorIdx++ % OTHER_PLAYER_COLORS.length];
        byPlayer[bet.playerId] = {
          playerId: bet.playerId,
          username: bet.playerUsername,
          totalAmount: 0,
          percent: 0,
          color,
        };
      }
      byPlayer[bet.playerId].totalAmount += bet.amount;
    });
    Object.values(byPlayer).forEach(player => {
      player.percent = sourcePool > 0 ? (player.totalAmount / sourcePool) * 100 : 0;
    });
    
    const winnerPlayer = byPlayer[winner.playerId];
    if (winnerPlayer) {
      setWinnerData({
        chance: winnerPlayer.percent,
        color: winnerPlayer.color,
      });
    } else {
      // Fallback
      setWinnerData({
        chance: 0,
        color: OTHER_PLAYER_COLORS[0],
      });
    }

    // Oblicz docelowy kąt
    const winningAngle = (winner.winningNumber / sourcePool) * 360;
    const spins = 3; // 3 pełne obroty
    
    // Normalizuj aktualną rotację do 0-360
    const currentNormalizedRotation = rotation % 360;
    // Oblicz ile musimy obrócić żeby trafić na zwycięzcę (wskaźnik jest na górze = -90 stopni)
    // Koło kręci się zgodnie z ruchem wskazówek zegara, więc musimy obrócić tak żeby winningAngle był przy wskaźniku
    const finalAngle = 360 - winningAngle; // gdzie ma się zatrzymać (od pozycji 0)
    
    // Oblicz ile stopni musimy dodać do aktualnej pozycji
    let additionalRotation = finalAngle - currentNormalizedRotation;
    if (additionalRotation < 0) additionalRotation += 360; // zawsze kręć do przodu
    
    // Dodaj pełne obroty + dodatkową rotację do osiągnięcia celu
    const targetRotation = rotation + (spins * 360) + additionalRotation;

    console.log('[BetWheel] Animation params:', { winningAngle, currentNormalizedRotation, finalAngle, additionalRotation, targetRotation, currentRotation: rotation });

    // Animacja kręcenia - 1 obrót na sekundę = 5 sekund na 5 obrotów
    const duration = 2000; // 2 sekundy
    const startTime = Date.now();
    const startRotation = rotation;

    setIsSpinning(true);
    console.log('[BetWheel] setIsSpinning(true) called');

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out - zwalnianie na końcu
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      const currentRotation = startRotation + (targetRotation - startRotation) * easeOut;
      setRotation(currentRotation);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Animacja zakończona
        setIsSpinning(false);
        
        // Pokaż popup winnera po krótkim opóźnieniu
        setTimeout(() => {
          setShowWinnerPopup(true);
        }, 500);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [winner, bets, totalPool]);

  // Funkcja do zamykania popup winnera
  const closeWinnerPopup = () => {
    setShowWinnerPopup(false);
    setDisplayBets([]);
    setDisplayPool(0);
    setWinnerData(null);
    setRotation(0); // Reset koła do pozycji początkowej
    lastValidBetsRef.current = {bets: [], totalPool: 0}; // Reset cached bets
    onWinnerShown?.();
  };

  // Wywołaj callback po pokazaniu winnera (auto-zamknięcie po 3s)
  useEffect(() => {
    if (showWinnerPopup && winner) {
      const timeout = setTimeout(() => {
        closeWinnerPopup();
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [showWinnerPopup, winner]);

  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    return `${seconds}`;
  };

  // Generuj segmenty SVG dla koła
  const renderWheelSegments = () => {
    if (aggregatedBets.length === 0) {
      return (
        <circle
          cx="50"
          cy="50"
          r="48"
          fill="#1a1a24"
          stroke="#303040"
          strokeWidth="1"
        />
      );
    }

    const segments: JSX.Element[] = [];
    const avatars: JSX.Element[] = [];
    let currentAngle = -90;

    aggregatedBets.forEach((player) => {
      const angle = (player.percent / 100) * 360;
      if (angle <= 0) return;

      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;

      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;

      const x1 = 50 + 48 * Math.cos(startRad);
      const y1 = 50 + 48 * Math.sin(startRad);
      const x2 = 50 + 48 * Math.cos(endRad);
      const y2 = 50 + 48 * Math.sin(endRad);

      const largeArcFlag = angle > 180 ? 1 : 0;

      const pathData = angle >= 360
        ? `M 50,50 m -48,0 a 48,48 0 1,1 96,0 a 48,48 0 1,1 -96,0`
        : `M 50,50 L ${x1},${y1} A 48,48 0 ${largeArcFlag},1 ${x2},${y2} Z`;

      segments.push(
        <path
          key={player.playerId}
          d={pathData}
          fill={player.color}
          stroke="#0d0d14"
          strokeWidth="0.5"
        />
      );

      // Dodaj avatar na środku segmentu (tylko jeśli segment jest wystarczająco duży)
      if (angle >= 20) {
        const midAngle = (startAngle + endAngle) / 2;
        const midRad = (midAngle * Math.PI) / 180;
        const avatarRadius = 6;
        const avatarDistance = 36; // odległość od środka koła
        const ax = 50 + avatarDistance * Math.cos(midRad);
        const ay = 50 + avatarDistance * Math.sin(midRad);

        avatars.push(
          <g key={`avatar-${player.playerId}`}>
            {/* Tło z kolorem gracza */}
            <circle 
              cx={ax} 
              cy={ay} 
              r={avatarRadius} 
              fill={player.color}
              stroke="#fff"
              strokeWidth="0.5"
            />
            {/* Literka jako fallback */}
            <text
              x={ax}
              y={ay + 0.5}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="6"
              fill="#0d0d14"
              fontWeight="bold"
              style={{ pointerEvents: 'none' }}
            >
              {player.username.charAt(0).toUpperCase()}
            </text>
            {/* Avatar używając foreignObject z HTML img */}
            <foreignObject
              x={ax - avatarRadius}
              y={ay - avatarRadius}
              width={avatarRadius * 2}
              height={avatarRadius * 2}
            >
              <div 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  borderRadius: '50%', 
                  overflow: 'hidden' 
                }}
              >
                <img
                  src={`${API_BASE_URL}/api/players/${player.playerId}/avatar`}
                  alt=""
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover',
                    display: 'block'
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            </foreignObject>
          </g>
        );
      }

      currentAngle = endAngle;
    });

    return [...segments, ...avatars];
  };

  return (
    <WheelContainer>
      <WheelWrapper>
        <WheelPointer />
        
        <WheelSvg
          viewBox="0 0 100 100"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          {renderWheelSegments()}
          <circle cx="50" cy="50" r="24" fill="#0d0d14" />
        </WheelSvg>

        <TimerCenter>
          {showWinnerPopup && winner && winnerData ? (
            <WinnerIcon $color={winnerData.color}>
              <WinnerAvatar 
                src={`${API_BASE_URL}/api/players/${winner.playerId}/avatar`} 
                alt={winner.username}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              {winner.username.charAt(0).toUpperCase()}
            </WinnerIcon>
          ) : (
            <>
              <TimerValue $warning={timeRemaining < 10000 && timeRemaining > 0}>
                {formatTime(timeRemaining)}
              </TimerValue>
              <TimerLabel>CZAS</TimerLabel>
            </>
          )}
        </TimerCenter>

        {showWinnerPopup && winner && winnerData && (
          <WinnerOverlay onClick={closeWinnerPopup} style={{ cursor: 'pointer' }}>
            <WinnerIcon $color={winnerData.color}>
              <WinnerAvatar 
                src={`${API_BASE_URL}/api/players/${winner.playerId}/avatar`} 
                alt={winner.username}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              {winner.username.charAt(0).toUpperCase()}
            </WinnerIcon>
            <WinnerTitle $isYou={winner.playerId === currentPlayerId}>
              {winner.playerId === currentPlayerId ? 'WYGRAŁEŚ!' : 'WYGRYWA'}
            </WinnerTitle>
            <WinnerName>{winner.username}</WinnerName>
            <WinnerAmount>+${winner.amount.toFixed(2)}</WinnerAmount>
            <WinnerChance>
              Szansa: <span>{winnerData.chance.toFixed(1)}%</span>
            </WinnerChance>
          </WinnerOverlay>
        )}
      </WheelWrapper>

      <PoolInfo>
        <PoolLabel>Pula</PoolLabel>
        <PoolValue>${activePool.toFixed(2)}</PoolValue>
      </PoolInfo>

      {aggregatedBets.length > 0 && (
        <PlayersLegend>
          {aggregatedBets.map(player => (
            <PlayerLegendItem
              key={player.playerId}
              $color={player.color}
              $isYou={player.playerId === currentPlayerId}
            >
              <PlayerLegendAvatar $color={player.color}>
                <img 
                  src={`${API_BASE_URL}/api/players/${player.playerId}/avatar`}
                  alt={player.username}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                {player.username.charAt(0).toUpperCase()}
              </PlayerLegendAvatar>
              {player.username}
              <PlayerPercent>{player.percent.toFixed(1)}%</PlayerPercent>
            </PlayerLegendItem>
          ))}
        </PlayersLegend>
      )}
    </WheelContainer>
  );
};

export default BetWheel;
