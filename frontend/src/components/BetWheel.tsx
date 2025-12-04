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
  WinnerTitle,
  WinnerName,
  WinnerAmount,
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
  const [isSpinning, setIsSpinning] = useState(false);
  const [targetRotation, setTargetRotation] = useState(0);
  const [showWinner, setShowWinner] = useState(false);

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
      let winnerStartAngle = 0;
      for (const player of aggregatedBets) {
        if (player.playerId === winner.playerId) {
          break;
        }
        winnerStartAngle += (player.percent / 100) * 360;
      }

      // Oblicz środek segmentu zwycięzcy
      const winnerPlayer = aggregatedBets.find(p => p.playerId === winner.playerId);
      const winnerMidAngle = winnerStartAngle + ((winnerPlayer?.percent || 0) / 100) * 180;

      // Kręcimy koło - cel to pozycja gdzie wskaźnik pokazuje zwycięzcę (góra = 0 stopni)
      // Więc musimy obrócić koło tak, żeby środek segmentu zwycięzcy był na górze
      const spins = 5 + Math.random() * 3; // 5-8 pełnych obrotów
      const finalRotation = spins * 360 + (360 - winnerMidAngle + 90);

      setIsSpinning(true);
      
      // Po krótkim czasie zacznij zwalniać
      setTimeout(() => {
        setIsSpinning(false);
        setTargetRotation(finalRotation);
      }, 2000);

      // Pokaż zwycięzcę po zakończeniu animacji
      setTimeout(() => {
        setShowWinner(true);
        onWinnerShown?.();
      }, 6000);
    } else {
      setIsSpinning(false);
      setTargetRotation(0);
      setShowWinner(false);
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
            <WinnerTitle $isYou={winner.playerId === currentPlayerId}>
              {winner.playerId === currentPlayerId ? 'WYGRAŁEŚ!' : 'WYGRYWA'}
            </WinnerTitle>
            <WinnerName>{winner.username}</WinnerName>
            <WinnerAmount>+${winner.amount.toFixed(2)}</WinnerAmount>
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
