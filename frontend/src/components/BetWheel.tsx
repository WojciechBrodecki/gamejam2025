import React, { useMemo, useState, useEffect } from 'react';
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
}

interface BetWheelProps {
  bets: Bet[];
  totalPool: number;
  timeRemaining: number;
  currentPlayerId: string | null;
  winner: Winner | null;
  roundId: string | null;
  onWinnerShown?: () => void;
}

// Deterministyczna funkcja hash - generuje tę samą liczbę dla tego samego stringa
// Używamy prostego algorytmu hashowania który daje wartość 0-1
function deterministicRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Normalizuj do zakresu 0-1
  return Math.abs(hash % 10000) / 10000;
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
  roundId,
  onWinnerShown,
}) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [targetRotation, setTargetRotation] = useState(0);
  const [showWinner, setShowWinner] = useState(false);
  const [winnerInfo, setWinnerInfo] = useState<{ chance: number; color: string } | null>(null);

  // Agreguj zakłady per gracz
  const aggregatedBets = useMemo(() => {
    const byPlayer: Record<string, AggregatedBet> = {};
    
    bets.forEach((bet, index) => {
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

    // Oblicz procenty
    Object.values(byPlayer).forEach(player => {
      player.percent = totalPool > 0 ? (player.totalAmount / totalPool) * 100 : 0;
    });

    return Object.values(byPlayer).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [bets, totalPool]);

  // Efekt animacji kręcenia koła gdy jest winner
  useEffect(() => {
    if (winner && aggregatedBets.length > 0) {
      // Znajdź pozycję zwycięzcy na kole
      // Segmenty są rysowane od kąta 0 (który w SVG z offsetem -90 to góra)
      // Liczymy kąt startowy segmentu zwycięzcy od pozycji 0
      let winnerStartAngle = 0;
      for (const player of aggregatedBets) {
        if (player.playerId === winner.playerId) {
          break;
        }
        winnerStartAngle += (player.percent / 100) * 360;
      }

      // Oblicz środek segmentu zwycięzcy (kąt od 0)
      const winnerPlayer = aggregatedBets.find(p => p.playerId === winner.playerId);
      const winnerSegmentSize = (winnerPlayer?.percent || 0) / 100 * 360;
      const winnerMidAngle = winnerStartAngle + winnerSegmentSize / 2;

      // Zapisz info o zwycięzcy
      if (winnerPlayer) {
        setWinnerInfo({
          chance: winnerPlayer.percent,
          color: winnerPlayer.color,
        });
      }

      // Kręcimy koło - wskaźnik jest na górze (pozycja 0 stopni w układzie SVG z offsetem -90)
      // Żeby środek segmentu zwycięzcy był pod wskaźnikiem, musimy obrócić koło
      // o kąt równy winnerMidAngle (w kierunku przeciwnym do ruchu wskazówek zegara = ujemna rotacja)
      // Ale CSS rotate obraca zgodnie z ruchem wskazówek, więc:
      // finalRotation = pełne obroty + (360 - winnerMidAngle) żeby segment był na górze
      
      // DETERMINISTYCZNE: używamy roundId do wygenerowania identycznej liczby obrotów u wszystkich
      const seedValue = roundId ? deterministicRandom(roundId) : 0.5;
      const spins = 3 + seedValue * 2; // 3-5 pełnych obrotów (deterministycznie)
      
      // Obrót żeby środek segmentu zwycięzcy znalazł się na górze (pod wskaźnikiem)
      const rotationToWinner = 360 - winnerMidAngle;
      const finalRotation = spins * 360 + rotationToWinner;

      console.log('Winner calculation:', {
        winnerStartAngle,
        winnerSegmentSize,
        winnerMidAngle,
        rotationToWinner,
        finalRotation,
        winner: winner.username,
      });

      // Najpierw szybkie kręcenie
      setIsSpinning(true);
      setTargetRotation(0);
      
      // Po 500ms przejdź do płynnego zwalniania
      setTimeout(() => {
        setIsSpinning(false);
        setTargetRotation(finalRotation);
      }, 500);

      // Pokaż zwycięzcę po zakończeniu animacji kręcenia (500ms + 5s transition)
      setTimeout(() => {
        setShowWinner(true);
      }, 5500);

      // Callback po pokazaniu zwycięzcy
      setTimeout(() => {
        onWinnerShown?.();
      }, 8500);
    } else if (!winner) {
      setIsSpinning(false);
      setTargetRotation(0);
      setShowWinner(false);
      setWinnerInfo(null);
    }
  }, [winner, aggregatedBets, onWinnerShown]);

  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${remainingSeconds}`;
  };

  // Generuj segmenty SVG dla koła
  const renderWheelSegments = () => {
    if (aggregatedBets.length === 0) {
      // Pusty wheel
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
    let currentAngle = -90; // Start from top

    aggregatedBets.forEach((player, index) => {
      const angle = (player.percent / 100) * 360;
      
      if (angle <= 0) return;

      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;

      // Oblicz punkty łuku
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
          $spinning={isSpinning}
          $targetRotation={isSpinning ? undefined : targetRotation}
        >
          {renderWheelSegments()}
          {/* Wewnętrzny okrąg na timer */}
          <circle cx="50" cy="50" r="24" fill="#0d0d14" />
        </WheelSvg>

        <TimerCenter>
          <TimerValue $warning={timeRemaining < 10000 && timeRemaining > 0}>
            {winner ? '!' : formatTime(timeRemaining)}
          </TimerValue>
          <TimerLabel>{winner ? 'KONIEC' : 'CZAS'}</TimerLabel>
        </TimerCenter>

        {showWinner && winner && (
          <WinnerOverlay>
            <WinnerIcon $color={winnerInfo?.color}>
              {winner.username.charAt(0).toUpperCase()}
            </WinnerIcon>
            <WinnerTitle $isYou={winner.playerId === currentPlayerId}>
              {winner.playerId === currentPlayerId ? 'WYGRAŁEŚ!' : 'WYGRYWA'}
            </WinnerTitle>
            <WinnerName>{winner.username}</WinnerName>
            <WinnerAmount>+${winner.amount.toFixed(2)}</WinnerAmount>
            <WinnerChance>
              Szansa: <span>{winnerInfo?.chance.toFixed(1)}%</span>
            </WinnerChance>
          </WinnerOverlay>
        )}
      </WheelWrapper>

      <PoolInfo>
        <PoolLabel>Pula</PoolLabel>
        <PoolValue>${totalPool.toFixed(2)}</PoolValue>
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
