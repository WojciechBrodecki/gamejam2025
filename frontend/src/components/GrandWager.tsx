import React from 'react';
import styled from 'styled-components';
import { Player, GameConfig, Round } from '../types';
import BetWheel from './BetWheel';
import BetPanel from './BetPanel';

const GrandWagerWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 500px;
  margin: 0 auto;
`;

interface Winner {
  playerId: string;
  username: string;
  amount: number;
}

interface GrandWagerProps {
  player: Player | null;
  currentRound: Round | null;
  config: GameConfig | null;
  timeRemaining: number;
  betAmount: string;
  onBetAmountChange: (amount: string) => void;
  onPlaceBet: () => void;
  winner: Winner | null;
  roundStatus: 'waiting' | 'active' | 'finished';
  onWinnerShown?: () => void;
}

const GrandWager: React.FC<GrandWagerProps> = ({
  player,
  currentRound,
  config,
  timeRemaining,
  betAmount,
  onBetAmountChange,
  onPlaceBet,
  winner,
  roundStatus,
  onWinnerShown,
}) => {
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

  return (
    <GrandWagerWrapper>
      <BetWheel
        bets={currentRound?.bets || []}
        totalPool={currentRound?.totalPool || 0}
        timeRemaining={timeRemaining}
        currentPlayerId={player?.id || null}
        winner={winner}
        roundId={currentRound?.id || null}
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
      />
    </GrandWagerWrapper>
  );
};

export default GrandWager;
