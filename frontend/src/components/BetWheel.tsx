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
  PlayerPercent,
} from '../styles/BetWheel.styles';

// Kolory dla graczy
const PLAYER_COLORS = [
  '#f0c020', // gold
  '#4080e0', // blue
  '#40c080', // green
  '#e05050', // red
  '#a040c0', // purple
  '#40c0c0', // cyan
  '#e08040', // orange
  '#c040a0', // pink
  '#80c040', // lime
  '#c0c040', // yellow-green
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

  // Agreguj zakłady per gracz - używaj displayBets podczas animacji
  const activeBets = isSpinning || showWinnerPopup ? displayBets : bets;
  const activePool = isSpinning || showWinnerPopup ? displayPool : totalPool;

  const aggregatedBets = useMemo(() => {
    const byPlayer: Record<string, AggregatedBet> = {};
    
    activeBets.forEach((bet) => {
      if (!byPlayer[bet.playerId]) {
        const colorIndex = Object.keys(byPlayer).length % PLAYER_COLORS.length;
        byPlayer[bet.playerId] = {
          playerId: bet.playerId,
          username: bet.playerUsername,
          totalAmount: 0,
          percent: 0,
          color: PLAYER_COLORS[colorIndex],
        };
      }
      byPlayer[bet.playerId].totalAmount += bet.amount;
    });

    Object.values(byPlayer).forEach(player => {
      player.percent = activePool > 0 ? (player.totalAmount / activePool) * 100 : 0;
    });

    return Object.values(byPlayer).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [activeBets, activePool]);

  // Główna logika animacji - reaguj na nowego winnera
  useEffect(() => {
    if (!winner) {
      // Reset gdy winner zniknie
      lastWinnerIdRef.current = null;
      return;
    }

    // Unikalna identyfikacja winnera
    const winnerId = `${winner.playerId}-${winner.winningNumber}`;
    
    // Jeśli już obsłużyliśmy tego winnera, nic nie rób
    if (lastWinnerIdRef.current === winnerId) {
      return;
    }
    
    // Sprawdź czy mamy dane do animacji
    if (bets.length === 0 || totalPool === 0) {
      return;
    }
    lastWinnerIdRef.current = winnerId;

    // Zamroź dane
    setDisplayBets([...bets]);
    setDisplayPool(totalPool);

    // Oblicz dane o zwycięzcy
    const byPlayer: Record<string, AggregatedBet> = {};
    bets.forEach((bet) => {
      if (!byPlayer[bet.playerId]) {
        const colorIndex = Object.keys(byPlayer).length % PLAYER_COLORS.length;
        byPlayer[bet.playerId] = {
          playerId: bet.playerId,
          username: bet.playerUsername,
          totalAmount: 0,
          percent: 0,
          color: PLAYER_COLORS[colorIndex],
        };
      }
      byPlayer[bet.playerId].totalAmount += bet.amount;
    });
    Object.values(byPlayer).forEach(player => {
      player.percent = totalPool > 0 ? (player.totalAmount / totalPool) * 100 : 0;
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
        color: PLAYER_COLORS[0],
      });
    }

    // Oblicz docelowy kąt
    const winningAngle = (winner.winningNumber / totalPool) * 360;
    const spins = 5; // 5 pełnych obrotów
    
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

    // Animacja kręcenia - 1 obrót na sekundę = 5 sekund na 5 obrotów
    const duration = 3000; // 3 sekundy
    const startTime = Date.now();
    const startRotation = rotation;

    setIsSpinning(true);

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

  // Wywołaj callback po pokazaniu winnera
  useEffect(() => {
    if (showWinnerPopup && winner) {
      const timeout = setTimeout(() => {
        setShowWinnerPopup(false);
        setDisplayBets([]);
        setDisplayPool(0);
        setWinnerData(null);
        onWinnerShown?.();
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [showWinnerPopup, winner, onWinnerShown]);

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

      currentAngle = endAngle;
    });

    return segments;
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
          <WinnerOverlay>
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
